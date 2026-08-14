# FireWeave providers — telugupanchangam

Resolved at `/fireweave:initialise` on 2026-08-12. Re-run `--reinit` after
binding a new capability (observability vendor, deploy detection) to refresh
this file and the harness.

## Project

- FireWeave project: **gtm-chat** (`8b7c7474-f1f4-474d-a6a5-6b8281677f2e`), org **a79**
- No dedicated `telugupanchangam` project exists in this org yet — this repo is
  bound to the only project available. Rename or split later via the FireWeave
  portal if needed.

## Environments

| Environment | Tier | Flags (`flag.control`) | Observability | Deploy detection |
| ----------- | ---- | ----------------------- | -------------- | ----------------- |
| `prod` (default) | prod | `fireweave-posthog`, PostHog project `534542` — bound | **unbound** (deferred, INIT-B11; auto-ramp is off so this is optional) | off (`deployDetectionSources: []`) |

No `dev`/`staging` environment is declared. Local runs (`NODE_ENV=development` /
Vite `MODE=development`) have no `FW_ENV_PROFILES` row and fall through to the
`isProd()` heuristic, which classifies them as dev-tier automatically.

## Surfaces

| Surface | Path | Entrypoint | Surface ID |
| ------- | ---- | ---------- | ---------- |
| `ts-server` | `server/fireweave/fw-harness.ts` | `server/index.ts` | `sfc_01KZVNRR9JG8RGJC9EQ4CZJWJ3` |
| `web` | `client/src/fireweave/fw-harness.ts` | `client/src/main.tsx` | `sfc_01KZVNRR9JG8RGJC9EQ4CZJWJ4` |

Both surfaces share one `package.json` / one npm workspace (no monorepo
packages dir) — `ts-server` is the Express API (`server/`), `web` is the Vite
React client (`client/src/`).

## Deferred at init

- **Observability**: no vendor bound. Prod branch stays on console/no-op
  telemetry. Bind a vendor (Grafana/Datadog/OpenObserve/…) in the FireWeave
  portal, then run `/fireweave:initialise --reinit` to wire direct OTLP export.
- **Deploy beacon**: skipped — `deployDetectionSources` is empty for this
  project, so `FW_ATTEST_URL` / `FW_PROJECT_API_KEY` were not provisioned. The
  harness's `initFwAttestation()` call resolves to a no-op until provisioned.
  Re-run `--reinit` to provision when you want deploy attestation.

## Environment source

Both surfaces read their own platform's standard env var — `NODE_ENV`
(server, already set by the existing npm scripts) and Vite's `MODE` (web) — no
new FireWeave-specific env var was introduced. `production` is aliased to the
FireWeave environment name `prod`.
