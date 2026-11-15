// Privacy-preserving pageview beacon: one POST /api/track per route view,
// carrying the same opaque device id used for notifications. No cookies, no
// third-party script — DAU/WAU/MAU are counted server-side from these.

import { getDeviceId } from "./device-id";

function isPwa(): boolean {
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
}

let lastPath: string | null = null;

export function trackPageview(path: string): void {
  // A route re-render isn't a new view.
  if (path === lastPath) return;
  lastPath = path;

  // Nothing stored means the visitor is on the app's default (english, see
  // use-language.ts). The provider only persists the default in an effect that
  // runs after this beacon on a first visit, so unset must not mean unknown.
  let language = "english";
  try {
    const stored = localStorage.getItem("panchangam-language");
    if (stored === "telugu") language = stored;
  } catch {
    // storage blocked — the app falls back to the default too
  }

  const payload = JSON.stringify({
    deviceId: getDeviceId(),
    path,
    language,
    isPwa: isPwa(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  try {
    const blob = new Blob([payload], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/track", blob)) {
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Tracking must never break the app.
  }
}
