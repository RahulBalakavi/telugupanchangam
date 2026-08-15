// Client-side eclipse geometry for the interactive Eclipse Lab.
// astronomy-engine is lazy-imported so the ~40KB (gzip) library only loads
// when the user opens the playback view.

const KM_PER_AU = 149597870.7;
const R_SUN_KM = 695700;
const R_MOON_KM = 1737.4;
const R_EARTH_KM = 6378.14;
const DEG = 180 / Math.PI;

export interface SolarFrame {
  /** ms since epoch */
  t: number;
  /** Moon-center offset from Sun center in the sky plane, in degrees (x: +east-ish RA, y: +north Dec) */
  x: number;
  y: number;
  /** apparent angular radii in degrees */
  rSun: number;
  rMoon: number;
  /** fraction of the Sun's disk covered, 0..1 */
  obsc: number;
  /** Sun altitude above the horizon at the observer, degrees */
  alt: number;
}

export interface LunarFrame {
  t: number;
  /** Moon-center offset from the shadow-axis center, degrees */
  x: number;
  y: number;
  rMoon: number;
  rUmbra: number;
  rPenumbra: number;
  /** fraction of the Moon's disk inside the umbra, 0..1 */
  umbralObsc: number;
  /** Moon altitude at the observer (null when no location given) */
  alt: number | null;
}

export type SolarView = "your-location" | "best-on-earth";

export interface SolarTimeline {
  type: "solar";
  frames: SolarFrame[];
  view: SolarView;
  /** observer used when view is "best-on-earth" */
  observer: { lat: number; lon: number };
  maxObsc: number;
}

export interface LunarTimeline {
  type: "lunar";
  frames: LunarFrame[];
  maxUmbralObsc: number;
}

export type EclipseTimeline = SolarTimeline | LunarTimeline;

type Astro = typeof import("astronomy-engine");

let astroPromise: Promise<Astro> | null = null;
function loadAstro(): Promise<Astro> {
  if (!astroPromise) astroPromise = import("astronomy-engine");
  return astroPromise;
}

/** angular separation between two RA/Dec positions (ra hours, dec degrees), in degrees */
function sep(ra1: number, dec1: number, ra2: number, dec2: number): number {
  const a1 = (ra1 * 15) / DEG, d1 = dec1 / DEG;
  const a2 = (ra2 * 15) / DEG, d2 = dec2 / DEG;
  const c = Math.sin(d1) * Math.sin(d2) + Math.cos(d1) * Math.cos(d2) * Math.cos(a1 - a2);
  return Math.acos(Math.min(1, Math.max(-1, c))) * DEG;
}

/** sky-plane offset of B relative to A in degrees; x along +RA (east), y along +Dec (north) */
function skyOffset(raA: number, decA: number, raB: number, decB: number): { x: number; y: number } {
  let dRa = raB - raA;
  if (dRa > 12) dRa -= 24;
  if (dRa < -12) dRa += 24;
  return { x: dRa * 15 * Math.cos(decA / DEG), y: decB - decA };
}

/** fraction of disk A (radius rA) covered by disk B (radius rB), centers d apart */
export function diskObscuration(rA: number, rB: number, d: number): number {
  if (d >= rA + rB) return 0;
  if (d <= Math.abs(rA - rB)) return rB >= rA ? 1 : (rB * rB) / (rA * rA);
  const d2 = d * d, a2 = rA * rA, b2 = rB * rB;
  const alpha = Math.acos((d2 + a2 - b2) / (2 * d * rA));
  const beta = Math.acos((d2 + b2 - a2) / (2 * d * rB));
  const area = a2 * (alpha - Math.sin(2 * alpha) / 2) + b2 * (beta - Math.sin(2 * beta) / 2);
  return area / (Math.PI * a2);
}

function solarFrameAt(A: Astro, time: InstanceType<Astro["AstroTime"]>, observer: InstanceType<Astro["Observer"]>): SolarFrame {
  const sun = A.Equator(A.Body.Sun, time, observer, true, true);
  const moon = A.Equator(A.Body.Moon, time, observer, true, true);
  const rSun = Math.asin(R_SUN_KM / (sun.dist * KM_PER_AU)) * DEG;
  const rMoon = Math.asin(R_MOON_KM / (moon.dist * KM_PER_AU)) * DEG;
  const d = sep(sun.ra, sun.dec, moon.ra, moon.dec);
  const { x, y } = skyOffset(sun.ra, sun.dec, moon.ra, moon.dec);
  const hz = A.Horizon(time, observer, sun.ra, sun.dec, "normal");
  return { t: time.date.getTime(), x, y, rSun, rMoon, obsc: diskObscuration(rSun, rMoon, d), alt: hz.altitude };
}

function lunarFrameAt(A: Astro, time: InstanceType<Astro["AstroTime"]>, observer: InstanceType<Astro["Observer"]> | null): LunarFrame {
  const sun = A.EquatorFromVector(A.GeoVector(A.Body.Sun, time, true));
  const moon = A.EquatorFromVector(A.GeoVector(A.Body.Moon, time, true));
  const antiRa = (sun.ra + 12) % 24;
  const antiDec = -sun.dec;
  const dMoonKm = moon.dist * KM_PER_AU;
  const dSunKm = sun.dist * KM_PER_AU;
  const pMoon = Math.asin(R_EARTH_KM / dMoonKm) * DEG;
  const pSun = Math.asin(R_EARTH_KM / dSunKm) * DEG;
  const sSun = Math.asin(R_SUN_KM / dSunKm) * DEG;
  // 2% enlargement for Earth's atmosphere (Chauvenet's rule) — matches how
  // published umbral magnitudes are computed.
  const rUmbra = 1.02 * (pMoon + pSun - sSun);
  const rPenumbra = 1.02 * (pMoon + pSun + sSun);
  const rMoon = Math.asin(R_MOON_KM / dMoonKm) * DEG;
  const d = sep(antiRa, antiDec, moon.ra, moon.dec);
  const { x, y } = skyOffset(antiRa, antiDec, moon.ra, moon.dec);
  let alt: number | null = null;
  if (observer) {
    const topo = A.Equator(A.Body.Moon, time, observer, true, true);
    alt = A.Horizon(time, observer, topo.ra, topo.dec, "normal").altitude;
  }
  return {
    t: time.date.getTime(), x, y, rMoon, rUmbra, rPenumbra,
    umbralObsc: diskObscuration(rMoon, rUmbra, d),
    alt,
  };
}

const FRAME_COUNT = 160;

async function buildSolarTimeline(peakUtc: string, location: { lat: number; lon: number } | null): Promise<SolarTimeline> {
  const A = await loadAstro();
  const peakMs = new Date(peakUtc).getTime();
  const searchStart = new Date(peakMs - 2 * 86400_000);
  const nearPeak = (t: InstanceType<Astro["AstroTime"]>) => Math.abs(t.date.getTime() - peakMs) < 0.75 * 86400_000;

  // Prefer the user's own sky when this eclipse is actually visible there.
  let observer: InstanceType<Astro["Observer"]> | null = null;
  let view: SolarView = "best-on-earth";
  let begin = 0, end = 0;
  if (location) {
    const obs = new A.Observer(location.lat, location.lon, 0);
    const local = A.SearchLocalSolarEclipse(searchStart, obs);
    if (nearPeak(local.peak.time) && local.peak.altitude > 0) {
      observer = obs;
      view = "your-location";
      begin = local.partial_begin.time.date.getTime();
      end = local.partial_end.time.date.getTime();
    }
  }

  if (!observer) {
    // Grid-search a spot on Earth that sees the deepest eclipse at peak time
    // (the global-peak lat/lon is undefined for partial eclipses, so this
    // handles every kind uniformly).
    const peakTime = A.MakeTime(new Date(peakMs));
    const g = A.SearchGlobalSolarEclipse(searchStart);
    const candidates: Array<[number, number]> = [];
    if (nearPeak(g.peak) && g.latitude !== undefined && g.longitude !== undefined) {
      candidates.push([g.latitude, g.longitude]);
    }
    for (let lat = -80; lat <= 80; lat += 10) {
      for (let lon = -180; lon < 180; lon += 20) candidates.push([lat, lon]);
    }
    let best: InstanceType<Astro["Observer"]> | null = null;
    let bestObsc = -1;
    for (const [lat, lon] of candidates) {
      const obs = new A.Observer(lat, lon, 0);
      const f = solarFrameAt(A, peakTime, obs);
      if (f.alt > 0 && f.obsc > bestObsc) { bestObsc = f.obsc; best = obs; }
    }
    observer = best ?? new A.Observer(0, 0, 0);
    const local = A.SearchLocalSolarEclipse(searchStart, observer);
    if (nearPeak(local.peak.time)) {
      begin = local.partial_begin.time.date.getTime();
      end = local.partial_end.time.date.getTime();
    } else {
      begin = peakMs - 90 * 60_000;
      end = peakMs + 90 * 60_000;
    }
  }

  const frames: SolarFrame[] = [];
  let maxObsc = 0;
  for (let i = 0; i < FRAME_COUNT; i++) {
    const t = A.MakeTime(new Date(begin + ((end - begin) * i) / (FRAME_COUNT - 1)));
    const f = solarFrameAt(A, t, observer);
    maxObsc = Math.max(maxObsc, f.obsc);
    frames.push(f);
  }
  return { type: "solar", frames, view, observer: { lat: observer.latitude, lon: observer.longitude }, maxObsc };
}

async function buildLunarTimeline(peakUtc: string, location: { lat: number; lon: number } | null): Promise<LunarTimeline> {
  const A = await loadAstro();
  const peakMs = new Date(peakUtc).getTime();
  const ecl = A.SearchLunarEclipse(new Date(peakMs - 2 * 86400_000));
  const center = Math.abs(ecl.peak.date.getTime() - peakMs) < 86400_000 ? ecl.peak.date.getTime() : peakMs;
  const halfMin = Math.max(ecl.sd_penum, 60);
  const begin = center - halfMin * 60_000;
  const end = center + halfMin * 60_000;
  const observer = location ? new A.Observer(location.lat, location.lon, 0) : null;
  const frames: LunarFrame[] = [];
  let maxUmbralObsc = 0;
  for (let i = 0; i < FRAME_COUNT; i++) {
    const t = A.MakeTime(new Date(begin + ((end - begin) * i) / (FRAME_COUNT - 1)));
    const f = lunarFrameAt(A, t, observer);
    maxUmbralObsc = Math.max(maxUmbralObsc, f.umbralObsc);
    frames.push(f);
  }
  return { type: "lunar", frames, maxUmbralObsc };
}

export function buildEclipseTimeline(
  type: "solar" | "lunar",
  peakUtc: string,
  location: { lat: number; lon: number } | null,
): Promise<EclipseTimeline> {
  return type === "solar" ? buildSolarTimeline(peakUtc, location) : buildLunarTimeline(peakUtc, location);
}
