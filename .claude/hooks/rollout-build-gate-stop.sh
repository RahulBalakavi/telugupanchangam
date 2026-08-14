#!/usr/bin/env bash
# Claude Code Stop-hook parity for the rollout-ready build gate.
#
# Cursor has run this gate on every stop since initialise. Claude Code ran only
# the ADVISORY intent gate (a reminder on SessionStart / UserPromptSubmit), so a
# Claude-only host had no build gate at all — the manifest ⇄ anchor check simply
# did not happen, and nothing said so. This closes that asymmetry.
#
# Fail-open on everything EXCEPT a gate that ran and failed: a missing node, a
# missing gate, an unreadable temp file must never wedge a session. The one
# fail-open that is now VISIBLE is a gate present but not executable — that used
# to skip the check silently, which is a repo that believes it is gated and is
# not.
set -uo pipefail
root="$(cd "$(dirname "$0")/../.." 2>/dev/null && pwd)" || exit 0
gate="$root/.fireweave/hooks/rollout-build-gate.sh"

# Claude sets `stop_hook_active` once this hook has already blocked. Blocking a
# second time loops the agent against a gate it may not be able to clear (e.g.
# `fw sync` needs a network this session does not have).
payload="$(cat 2>/dev/null || true)"
case "$payload" in
  *'"stop_hook_active":true'* | *'"stop_hook_active": true'*) exit 0 ;;
esac

[ -f "$gate" ] || exit 0
if [ ! -x "$gate" ]; then
  echo "rollout-build-gate-stop: $gate is not executable — running it via bash. Repair with: chmod +x $gate" >&2
fi

out="$(mktemp 2>/dev/null)" || exit 0
err="$(mktemp 2>/dev/null)" || exit 0
trap 'rm -f "$out" "$err"' EXIT
# Capture the gate's stderr — never discard it. A wrapper that refuses to run
# (unreadable or identity-less pointer) exits non-zero with an explanation there
# and NO JSON on stdout; `2>/dev/null` turned that into the generic
# "drift detected" line, which reads as an ordinary finding rather than as
# "this repo is not being gated".
if bash "$gate" >"$out" 2>"$err"; then exit 0; fi

reason="$(node -e "
const j = JSON.parse(require('node:fs').readFileSync(process.argv[1], 'utf8'));
console.log((j.findings || []).filter((f) => f.severity !== 'info').map((f) => (f.fix ? f.message + ' Fix: ' + f.fix : f.message)).join('; '));
" "$out" 2>/dev/null || true)"
if [ -z "$reason" ]; then
  reason="the gate produced no verdict: $(tr '\n' ' ' <"$err")"
fi
msg="FireWeave rollout-ready build gate FAILED: ${reason} Complete the rollout-ready package per .fireweave/agent-instructions.md — author the manifest via upsert_rollout_manifest, add // @fireweave-flag at each evaluation site, append the stamp to its surface's FW_STAMPS — then re-run the gate. If a finding says \`fw sync\`, this worktree has no server projection and absence is NOT evidence: fetch it rather than authoring over a contract you cannot see."
node -e "console.log(JSON.stringify({ decision: 'block', reason: process.argv[1] }))" "$msg" 2>/dev/null \
  || printf '%s\n' "$msg"
exit 0
