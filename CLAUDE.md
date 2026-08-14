## 🔴 FireWeave rollout-ready — HARD ORDER (this repo is initialised)

This repo is FireWeave rollout-ready ("promote, not wrap"). For **every user-facing
OR flag-gated OR behavior-changing** change — including internal/ops/observability
wiring — the rollout-ready package comes **FIRST, while you write code**, never as a
backfill after the feature is built. Backfill breaks promote-not-wrap and is forbidden.

1. **FIRST** — author the rollout-ready manifest by calling
   `mcp__rollout-server__upsert_rollout_manifest` `{ feature, manifest, baseContentHash }`
   (Manifest contract in [.fireweave/agent-instructions.md](.fireweave/agent-instructions.md)).
   **FireWeave stores the manifest — do not write a manifest file yourself.**
   `baseContentHash` is required and nullable (`null` = "no row yet"); on `conflict`,
   re-apply on top of `current` and retry with `currentContentHash`. Mint
   `chg_<ULID>` + `stmp_<ULID>`, and apply the stamp policy — per-surface stamps by
   default (append each stamp ONLY to its own surface's `FW_STAMPS`: `server/fireweave/fw-tracker`
   for server-only changes, `client/src/fireweave/fw-tracker` for web-only, both for changes
   touching both surfaces).
2. Gate the new behavior behind the harness OpenFeature provider and add
   `// @fireweave-flag <key>` at each evaluation site **as you write it**.
3. **BEFORE calling the task done** — run `mcp__rollout-server__assert_dev_checklist`
   `{ feature }` (PARK on any block) + `detect_rollout_ready` + `reconcile` phase `build`.
4. Do **not** open a PR / declare done until `assert_dev_checklist.pass === true`.
   Ship only via `/fireweave:safe-rollout` (promotes; never wraps).
5. **Absence has names — only `never-authored` means author one.** `not-fetched` →
   run `fw sync`. `not-authorized` → the manifests are **withheld, not absent**;
   `fw login` or ask an org admin. `server-unavailable` → retry. `queued` → you
   already authored it and it is waiting in `.fireweave/.queue/`; drain it. Never
   author a manifest to clear any of those four — you would displace a contract you
   cannot currently see.

If a request looks like feature work and you have NOT done step 1, stop and do it
first. If you are unsure whether a change qualifies, it does — err toward wrapping.
