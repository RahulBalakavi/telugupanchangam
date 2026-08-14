# FireWeave rollout-ready — agent instructions (telugupanchangam)

This repo is FireWeave rollout-ready. See `.fireweave/PROVIDERS.md` for the
resolved environments/capabilities. FireWeave project: **gtm-chat**
(`8b7c7474-f1f4-474d-a6a5-6b8281677f2e`), org **a79**.

## Rollout-ready layout

| Path | Purpose |
| ---- | ------- |
| `server/fireweave/fw-harness.ts` + `fw-providers.ts` | ts-server harness (Express API, `server/index.ts` entrypoint) |
| `server/fireweave/fw-tracker/index.ts` | ts-server's `FW_STAMPS` — the deduped union of active change stamps for this surface |
| `client/src/fireweave/fw-harness.ts` + `fw-providers.ts` | web harness (Vite/React client, `client/src/main.tsx` entrypoint) |
| `client/src/fireweave/fw-tracker/index.ts` | web's `FW_STAMPS` |
| `.fireweave/PROVIDERS.md` | Resolved environments, capabilities, and what's deferred |
| `.fireweave/hooks/rollout-build-gate.{mjs,sh}` | Local build gate — reads the server-owned manifest projection, checked on Claude Code `Stop` |

**Rollout-ready manifests and change stamps are server-owned.** They are
reached through `mcp__rollout-server__upsert_rollout_manifest` and the
resolution seam — there is no directory under `.fireweave/` to read or write
them by hand. Gitignored runtime paths: `.fireweave/.cache/` (a disposable
server-state projection, rebuild with `fw sync`), `.fireweave/.queue/`
(unsynced author state — **never** delete this to "clear" a warning),
`.fireweave/.lock`, `.fireweave/local.json`.

## Every feature change (dev — before `/fireweave:safe-rollout`) — HARD ORDER

**Backfill after coding is NOT the client path.** If you implement first and
add the manifest later, `/fireweave:safe-rollout` and clients cannot rely on
promote-not-wrap.

1. **FIRST** — author the rollout-ready manifest with
   `mcp__rollout-server__upsert_rollout_manifest` `{ feature, manifest, baseContentHash }`
   (Manifest contract below). **FireWeave stores it — do not write a manifest
   file yourself.** `baseContentHash` is required and nullable: `null` asserts
   "no row exists yet"; otherwise pass the `contentHash` of the row you read.
   On `outcome: 'conflict'`, re-apply your change on top of the returned
   `current` and retry with `baseContentHash = currentContentHash`. On
   `outcome: 'queued'`, fw-server did not answer: the edit is safe in
   `.fireweave/.queue/` and will replay, but **shipping is blocked until it
   drains**. Mint `chg_<ULID>` + `stmp_<ULID>`. **Stamp policy for this repo:**
   append each stamp ONLY to its own surface's `FW_STAMPS` — a server-only
   change goes in `server/fireweave/fw-tracker/index.ts`, a client-only change
   in `client/src/fireweave/fw-tracker/index.ts`; a change touching both
   surfaces appends to both.

   **Absence has names — only one means _author it now_.** `never-authored` →
   author it. `not-fetched` → run `fw sync`. `not-authorized` → the manifests
   are **withheld**, not absent (`fw login` / ask an admin). `server-unavailable`
   → retry. `queued` → you already authored it; drain the queue. **Never**
   author a manifest to clear any of the last four.

2. Gate behavior behind OpenFeature via the harness — not legacy direct vendor
   SDK calls. Add `// @fireweave-flag <key>` at every evaluation site **while
   writing code**. Eval-site default MUST be `false` (RAMP-1). For local
   dogfood, set the key in the surface's `makeDevProvider()` `devFlags` —
   never `fw.flag(key, true)`.
3. **BEFORE calling the task done** — run
   `mcp__rollout-server__assert_dev_checklist` with `{ feature }`. **PARK on
   any block.** Also run `detect_rollout_ready` + `reconcile` phase `build`.
4. Do NOT open a PR / declare done until `assert_dev_checklist.pass === true`.

### Do not

- Swap providers at promotion time.
- Route telemetry through FireWeave (OTLP direct to bound vendor once one is
  bound — currently none is; see PROVIDERS.md).
- Delete `fw-tracker` stamps without `/fireweave:cleanup`.
- Finish feature code without a matching rollout-ready package (no backfill).
- Use `fw.flag(key, true)` / `default: true` to make a feature work locally —
  that same `true` is what prod serves when the provider flag is missing.
  Local ON → `devFlags` only.
- Gate identity wiring behind a feature flag.

### Cohort identity (always-on — never behind a flag)

This repo already has identity seams from Replit auth — reuse them, don't
introduce a parallel one:

| Surface | Contract |
| ------- | -------- |
| **Server** | `server/replit_integrations/auth.ts` provides `isAuthenticated` + `req.user.id`. When a route reads a flag with `fw.flag(...)`, pass `{ targetingKey: req.user?.id ?? '<stable anonymous fallback>' }`. Missing targeting key → the provider returns the safe default (`false`). |
| **Web** | `client/src/hooks/use-auth.ts` is the client auth hook. After sign-in, call `reloadFireweaveFlags(user.id)` (from `client/src/fireweave/fw-providers.ts`) to bind targeting and re-prefetch flags; on sign-out, reset so the next visitor doesn't inherit the previous bucket. |

**The bind is unconditional** — manifests declare `context.targetingKey:
"userId"`, and upstream `%` ramps hash that subject id. Gate the feature that
*uses* identity; never the bind itself.

### Manifest contract (the committed ship contract — copy, don't invent)

```json
{
  "schema": 1,
  "feature": "<feature-slug>",
  "changeType": "new-feature",
  "userFacing": true,
  "change": {
    "id": "chg_<ULID>",
    "stampId": "stmp_<ULID>",
    "title": "<human title>",
    "description": "<what changes, one line>",
    "author": "<you@org>",
    "createdAt": "<ISO timestamp>",
    "branch": "<dev-branch>",
    "backwardCompatible": "required",
    "supersedes": [],
    "supersededBy": [],
    "status": "in-progress"
  },
  "flagTelemetryProvider": "connected:posthog",
  "flags": [
    {
      "key": "<feature-slug>",
      "default": false,
      "cohortKey": "userId",
      "userFacing": true,
      "description": "Off: <today's behavior>. On: <new behavior>.",
      "tags": ["<area>"]
    }
  ],
  "wrapPoints": [
    {
      "file": "server/<file>.ts",
      "symbol": "<function/handler>",
      "wrapStyle": "method-guard",
      "flagKey": "<feature-slug>"
    }
  ],
  "context": { "targetingKey": "userId", "dimensions": [] },
  "telemetry": {
    "metrics": [
      { "name": "feature.<feature-slug>.adopted", "role": "adoption", "direction": "up-good", "guards": "<feature-slug>" },
      { "name": "feature.<feature-slug>.error", "role": "adoption", "direction": "up-bad", "guards": "<feature-slug>" }
    ],
    "logs": [],
    "traces": [],
    "dimensions": []
  },
  "harness": {
    "surface": "ts-server",
    "path": "server/fireweave/fw-harness.ts",
    "rolloutCredentialEnv": "FW_PROJECT_API_KEY",
    "attestUrlEnv": "FW_ATTEST_URL",
    "attestCredentialEnv": "FW_PROJECT_API_KEY",
    "posthogProjectId": "534542",
    "flags": { "api": "openfeature", "sdk": "server", "devProvider": "in-memory", "rolloutProvider": "connected:fireweave" },
    "telemetry": { "api": "otel", "devExporter": "console", "rolloutTransport": "otlp", "semconv": "fireweave/rollout-otel-semconv-v1", "signals": {} }
  }
}
```

For the **web** surface use `harness.surface: "web"`, `flags.sdk: "web"`,
`rolloutCredentialEnv: "PUBLIC_FW_PROJECT_API_KEY"`, and the web harness path.

**RAMP-1 — off until ramp:** boolean `flags[].default` MUST be `false`. Eval
sites MUST use `fw.flag(key, false, …)`. Prod-tier ON is the ramp, never the
call-site default.

### Ship

Run `/fireweave:safe-rollout` only after `assert_dev_checklist` passes — it
**promotes** rollout-ready work; it does not wrap code.
