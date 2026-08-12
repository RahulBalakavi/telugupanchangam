/**
 * fw-tracker — the deduped union of change stamps active on THIS surface
 * (ts-server). FireWeave-owned: every `mcp__rollout-server__upsert_rollout_manifest`
 * call for a feature touching this surface appends its `stmp_<ULID>` here.
 *
 * Do not hand-edit stamps out — use `/fireweave:cleanup` once a rollout is
 * fully promoted and its manifest archived server-side.
 */
export const FW_STAMPS: string[] = [];
