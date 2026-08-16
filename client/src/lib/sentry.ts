// Loaded dynamically from main.tsx only when VITE_SENTRY_DSN is set at build
// time, so the Sentry SDK never ships to users' phones until it's configured.

import * as Sentry from "@sentry/react";

export function initSentry(dsn: string): void {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Errors only — no tracing or replay, keeps bundle work and quota minimal.
    tracesSampleRate: 0,
    ignoreErrors: [
      // User closed the share sheet — expected, not an error.
      "AbortError",
      // Network flakiness on mobile.
      "Failed to fetch",
      "Load failed",
      "NetworkError",
    ],
  });
}
