// The app has no accounts. Notification preferences and push subscriptions are
// scoped to this browser by an opaque id minted once and kept in localStorage,
// sent to the server as the X-Device-Id header.
//
// Clearing site data loses the id, which just means this device starts over
// with default preferences — nothing else is keyed to it.

const STORAGE_KEY = "panchangam.deviceId";

function mint(): string {
  // randomUUID needs a secure context and isn't in older Safari, so fall back
  // to 32 hex chars — same shape as far as the server's validation
  // (/^[A-Za-z0-9-]{16,64}$/) is concerned.
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Held in module scope too, so a storage failure still yields one stable id for
// the life of the page rather than a new row per request.
let cached: string | null = null;

export function getDeviceId(): string {
  if (cached) return cached;
  try {
    cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) {
      cached = mint();
      localStorage.setItem(STORAGE_KEY, cached);
    }
  } catch {
    // Private mode / storage blocked: a per-session id still lets push work
    // for as long as the page is open.
    cached = mint();
  }
  return cached;
}
