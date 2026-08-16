// iCalendar feed: subscribe once in Google/Apple Calendar and every festival
// (and eclipse) lands on the calendar, updating automatically as we add years.

import { getAllFestivals } from "./data";
import { getUpcomingEclipses } from "./eclipse";

const SITE = "https://mytelugupanchangam.space";

// RFC 5545 text escaping: backslash, semicolon, comma, newline.
function icsEscape(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Fold lines longer than 75 octets (RFC 5545 §3.1) — continuation lines start
// with a single space. Folding on characters (not bytes) is fine in practice.
function fold(line: string): string {
  if (line.length <= 74) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 74));
  rest = rest.slice(74);
  while (rest.length > 0) {
    parts.push(" " + rest.slice(0, 73));
    rest = rest.slice(73);
  }
  return parts.join("\r\n");
}

function ymd(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

/** YYYY-MM-DD + 1 day, as YYYYMMDD (all-day DTEND is exclusive). */
function nextDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

export function buildIcs(): string {
  const now = new Date();
  const dtstamp =
    now.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Telugu Panchangam//mytelugupanchangam.space//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Telugu Panchangam — Festivals & Eclipses",
    "X-WR-CALDESC:Telugu festival dates and eclipse timings from " +
      "mytelugupanchangam.space. Computed astronomically; updated as new " +
      "years are added.",
    "X-WR-TIMEZONE:Asia/Kolkata",
    "REFRESH-INTERVAL;VALUE=DURATION:P1D",
    "X-PUBLISHED-TTL:P1D",
  ];

  for (const f of getAllFestivals()) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${f.id}@mytelugupanchangam.space`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${ymd(f.date)}`,
      `DTEND;VALUE=DATE:${nextDay(f.date)}`,
      `SUMMARY:${icsEscape(`${f.name} · ${f.nameTelugu}`)}`,
      `DESCRIPTION:${icsEscape(`${f.description}\n${f.descriptionTelugu}\nDetails: ${SITE}/festivals/${f.id}`)}`,
      `URL:${SITE}/festivals/${f.id}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }

  // Upcoming eclipses as timed events around the peak (UTC instants).
  for (const e of getUpcomingEclipses("Asia/Kolkata", 8)) {
    const peak = new Date(e.peakUtc);
    if (isNaN(peak.getTime())) continue;
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    const start = new Date(peak.getTime() - 90 * 60_000);
    const end = new Date(peak.getTime() + 90 * 60_000);
    const name = `${e.type === "solar" ? "Surya Grahanam (Solar Eclipse)" : "Chandra Grahanam (Lunar Eclipse)"} — peak ${e.peakLocal} IST`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:eclipse-${e.peakUtc}@mytelugupanchangam.space`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${icsEscape(name)}`,
      `DESCRIPTION:${icsEscape(`In ${e.nakshatra.name} (${e.nakshatra.nameTelugu}) nakshatra. Timings, affected nakshatras and remedies: ${SITE}/eclipses`)}`,
      `URL:${SITE}/eclipses`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
