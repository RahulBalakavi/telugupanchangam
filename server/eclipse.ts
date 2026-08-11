// Eclipse calculations: upcoming solar & lunar eclipses, location-based
// visibility, the nakshatra in which each eclipse occurs, which nakshatras
// are traditionally considered affected, and remedial recommendations.
//
// Astronomy comes from astronomy-engine (same engine used by panchang.ts).
// Nakshatra of the eclipse = the Moon's nakshatra at the eclipse peak
// (both solar and lunar eclipses happen at Sun-Moon conjunction/opposition,
// so the Moon's position defines the affected star).
//
// Traditional affected-nakshatra rule used here (widely followed in Telugu
// panchangam practice): the nakshatra in which the eclipse occurs (janma) is
// most affected, along with the 10th (anujanma) and 19th (trijanma) counted
// from it. People born under those stars are advised extra remedies.

import * as Astronomy from "astronomy-engine";
import { getNakshatra, getTimezoneCoordinates } from "./panchang";
import { nakshatraNames, nakshatraNamesTelugu } from "@shared/schema";

export interface EclipseNakshatraInfo {
  index: number;
  name: string;
  nameTelugu: string;
  severity: "high" | "medium";
  reason: string; // "janma" | "anujanma" | "trijanma"
}

export interface EclipseEvent {
  type: "solar" | "lunar";
  kind: string; // total | annular | partial | penumbral
  peakUtc: string; // ISO instant of eclipse peak
  dateLocal: string; // YYYY-MM-DD in requested timezone
  peakLocal: string; // formatted local time of peak
  obscuration: number | null; // fraction 0..1 at peak (global max)
  nakshatra: { index: number; name: string; nameTelugu: string };
  affectedNakshatras: EclipseNakshatraInfo[];
}

export interface LocalEclipseVisibility {
  visible: boolean;
  kindAtLocation: string | null; // total/annular/partial for solar; eclipse kind for lunar
  obscuration: number | null; // local obscuration fraction at peak (solar only)
  beginLocal: string | null;
  peakLocal: string | null;
  endLocal: string | null;
  peakAltitude: number | null; // degrees above horizon at peak
  note: string;
  noteTelugu: string;
}

const AFFECTED_OFFSETS: { offset: number; reason: string; severity: "high" | "medium" }[] = [
  { offset: 0, reason: "janma", severity: "high" },
  { offset: 9, reason: "anujanma", severity: "medium" },
  { offset: 18, reason: "trijanma", severity: "medium" },
];

function affectedNakshatras(eclipseNakIndex: number): EclipseNakshatraInfo[] {
  return AFFECTED_OFFSETS.map(({ offset, reason, severity }) => {
    const idx = (eclipseNakIndex + offset) % 27;
    return {
      index: idx,
      name: nakshatraNames[idx],
      nameTelugu: nakshatraNamesTelugu[idx],
      severity,
      reason,
    };
  });
}

function formatLocal(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function localDateStr(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function buildEvent(
  type: "solar" | "lunar",
  kind: string,
  peak: Date,
  obscuration: number | null,
  timezone: string,
): EclipseEvent {
  const nak = getNakshatra(peak);
  return {
    type,
    kind,
    peakUtc: peak.toISOString(),
    dateLocal: localDateStr(peak, timezone),
    peakLocal: formatLocal(peak, timezone),
    obscuration,
    nakshatra: { index: nak.index, name: nak.name, nameTelugu: nak.nameTelugu },
    affectedNakshatras: affectedNakshatras(nak.index),
  };
}

/**
 * Returns the next `count` eclipses (solar + lunar interleaved chronologically)
 * starting from `from` (defaults to now).
 */
export function getUpcomingEclipses(
  timezone: string = "Asia/Kolkata",
  count: number = 8,
  from: Date = new Date(),
): EclipseEvent[] {
  const events: EclipseEvent[] = [];

  // Collect solar eclipses
  let solar = Astronomy.SearchGlobalSolarEclipse(new Astronomy.AstroTime(from));
  for (let i = 0; i < count && solar; i++) {
    events.push(
      buildEvent("solar", solar.kind, solar.peak.date, solar.obscuration ?? null, timezone),
    );
    solar = Astronomy.NextGlobalSolarEclipse(solar.peak);
  }

  // Collect lunar eclipses
  let lunar = Astronomy.SearchLunarEclipse(new Astronomy.AstroTime(from));
  for (let i = 0; i < count && lunar; i++) {
    events.push(
      buildEvent("lunar", lunar.kind, lunar.peak.date, lunar.obscuration ?? null, timezone),
    );
    lunar = Astronomy.NextLunarEclipse(lunar.peak);
  }

  events.sort((a, b) => a.peakUtc.localeCompare(b.peakUtc));
  return events.slice(0, count);
}

function moonAltitude(date: Date, lat: number, lon: number): number {
  const observer = new Astronomy.Observer(lat, lon, 0);
  const eq = Astronomy.Equator(Astronomy.Body.Moon, date, observer, true, true);
  const hor = Astronomy.Horizon(date, observer, eq.ra, eq.dec, "normal");
  return hor.altitude;
}

/**
 * Determines whether the eclipse peaking at `peakUtc` is visible from
 * (lat, lon). For solar eclipses, uses a local eclipse search; for lunar
 * eclipses, checks whether the Moon is above the horizon during the event.
 */
export function getLocalEclipseVisibility(
  type: "solar" | "lunar",
  peakUtc: Date,
  lat: number,
  lon: number,
  timezone: string,
): LocalEclipseVisibility {
  const invisible = (note: string, noteTelugu: string): LocalEclipseVisibility => ({
    visible: false,
    kindAtLocation: null,
    obscuration: null,
    beginLocal: null,
    peakLocal: null,
    endLocal: null,
    peakAltitude: null,
    note,
    noteTelugu,
  });

  if (type === "solar") {
    const observer = new Astronomy.Observer(lat, lon, 0);
    // Search from 2 days before the global peak; if the first local eclipse
    // found is a different event, this one is not visible from the location.
    const start = new Astronomy.AstroTime(new Date(peakUtc.getTime() - 2 * 86400_000));
    const local = Astronomy.SearchLocalSolarEclipse(start, observer);
    const diffDays = Math.abs(local.peak.time.date.getTime() - peakUtc.getTime()) / 86400_000;
    if (diffDays > 2) {
      return invisible(
        "This solar eclipse is not visible from your location. No eclipse-time restrictions (like fasting during the eclipse) traditionally apply where the eclipse cannot be seen.",
        "ఈ సూర్యగ్రహణం మీ ప్రాంతంలో కనిపించదు. గ్రహణం కనిపించని చోట సాంప్రదాయకంగా గ్రహణ నియమాలు వర్తించవు.",
      );
    }
    // The Sun must be above the horizon at some point during the eclipse.
    if (local.peak.altitude < 0) {
      // Peak below horizon; check partial begin/end altitudes
      const beginAlt = local.partial_begin ? local.partial_begin.altitude : -1;
      const endAlt = local.partial_end ? local.partial_end.altitude : -1;
      if (beginAlt < 0 && endAlt < 0) {
        return invisible(
          "The eclipse occurs while the Sun is below the horizon at your location, so it is not visible there.",
          "మీ ప్రాంతంలో గ్రహణ సమయంలో సూర్యుడు క్షితిజం క్రింద ఉంటాడు, కాబట్టి గ్రహణం కనిపించదు.",
        );
      }
    }
    return {
      visible: true,
      kindAtLocation: local.kind,
      obscuration: local.obscuration ?? null,
      beginLocal: local.partial_begin ? formatLocal(local.partial_begin.time.date, timezone) : null,
      peakLocal: formatLocal(local.peak.time.date, timezone),
      endLocal: local.partial_end ? formatLocal(local.partial_end.time.date, timezone) : null,
      peakAltitude: Math.round(local.peak.altitude * 10) / 10,
      note: "This eclipse is visible from your location. Traditional eclipse observances apply during the local eclipse window shown.",
      noteTelugu: "ఈ గ్రహణం మీ ప్రాంతంలో కనిపిస్తుంది. చూపిన స్థానిక గ్రహణ సమయంలో సాంప్రదాయ గ్రహణ నియమాలు పాటించాలి.",
    };
  }

  // Lunar eclipse: find the eclipse event and check Moon altitude
  const start = new Astronomy.AstroTime(new Date(peakUtc.getTime() - 2 * 86400_000));
  const lunar = Astronomy.SearchLunarEclipse(start);
  const diffDays = Math.abs(lunar.peak.date.getTime() - peakUtc.getTime()) / 86400_000;
  if (diffDays > 2) {
    return invisible(
      "Could not match this lunar eclipse for your location.",
      "మీ ప్రాంతానికి ఈ చంద్రగ్రహణ వివరాలు లభించలేదు.",
    );
  }
  // Umbral (partial) phase window; fall back to penumbral for penumbral-only
  // eclipses. Note: for eclipses with an umbral phase, the reported window
  // covers the umbral (visually significant) phase only.
  const sdMinutes = lunar.sd_partial > 0 ? lunar.sd_partial : lunar.sd_penum;
  const begin = new Date(lunar.peak.date.getTime() - sdMinutes * 60_000);
  const end = new Date(lunar.peak.date.getTime() + sdMinutes * 60_000);

  // Intersect the eclipse window with the interval(s) when the Moon is above
  // the horizon, using rise/set searches (robust against the Moon rising and
  // setting between coarse sample points).
  const observer = new Astronomy.Observer(lat, lon, 0);
  const altBegin = moonAltitude(begin, lat, lon);
  let visibleStart: Date | null = null;
  let visibleEnd: Date | null = null;
  if (altBegin > 0) {
    visibleStart = begin;
    const set = Astronomy.SearchRiseSet(
      Astronomy.Body.Moon, observer, -1, new Astronomy.AstroTime(begin), 2,
    );
    visibleEnd = set && set.date.getTime() < end.getTime() ? set.date : end;
  } else {
    const rise = Astronomy.SearchRiseSet(
      Astronomy.Body.Moon, observer, +1, new Astronomy.AstroTime(begin), 2,
    );
    if (rise && rise.date.getTime() < end.getTime()) {
      visibleStart = rise.date;
      const set = Astronomy.SearchRiseSet(
        Astronomy.Body.Moon, observer, -1, rise, 2,
      );
      visibleEnd = set && set.date.getTime() < end.getTime() ? set.date : end;
    }
  }

  if (!visibleStart || !visibleEnd || visibleEnd.getTime() <= visibleStart.getTime()) {
    return invisible(
      "The Moon is below the horizon during this eclipse at your location, so it is not visible there. Traditional eclipse restrictions do not apply where the eclipse cannot be seen.",
      "ఈ గ్రహణ సమయంలో మీ ప్రాంతంలో చంద్రుడు క్షితిజం క్రింద ఉంటాడు, కాబట్టి గ్రహణం కనిపించదు. గ్రహణం కనిపించని చోట గ్రహణ నియమాలు వర్తించవు.",
    );
  }

  const altPeak = moonAltitude(lunar.peak.date, lat, lon);
  const fullWindowVisible =
    visibleStart.getTime() <= begin.getTime() + 60_000 &&
    visibleEnd.getTime() >= end.getTime() - 60_000;
  return {
    visible: true,
    kindAtLocation: lunar.kind,
    obscuration: lunar.obscuration ?? null,
    beginLocal: formatLocal(visibleStart, timezone),
    peakLocal: formatLocal(lunar.peak.date, timezone),
    endLocal: formatLocal(visibleEnd, timezone),
    peakAltitude: Math.round(altPeak * 10) / 10,
    note: fullWindowVisible
      ? "This lunar eclipse is visible from your location. Traditional eclipse observances apply during the window shown."
      : "Part of this lunar eclipse is visible from your location (the Moon rises or sets during the eclipse). The times shown are the locally visible portion; traditional observances apply for that portion.",
    noteTelugu: fullWindowVisible
      ? "ఈ చంద్రగ్రహణం మీ ప్రాంతంలో కనిపిస్తుంది. చూపిన సమయంలో సాంప్రదాయ గ్రహణ నియమాలు పాటించాలి."
      : "ఈ చంద్రగ్రహణంలో కొంత భాగం మీ ప్రాంతంలో కనిపిస్తుంది (గ్రహణ సమయంలో చంద్రోదయం/చంద్రాస్తమయం జరుగుతుంది). చూపిన సమయాలు కనిపించే భాగానివి; ఆ భాగానికి నియమాలు పాటించాలి.",
  };
}

/** Returns true when `tz` is a valid IANA timezone identifier. */
export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export { getTimezoneCoordinates };
