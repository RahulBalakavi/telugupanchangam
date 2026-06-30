// Muhurtam / inauspicious-and-auspicious time windows for a given day.
//
// These are deterministic from the day length (sunrise → sunset) and the
// weekday, using the classical 8-part division of the day. This keeps every
// muhurtam answer the agent gives grounded in computed values, never invented.
//
//   Rahukalam / Yamagandam / Gulika — the day (sunrise→sunset) is split into 8
//   equal parts; which part each falls in depends on the weekday.
//   Abhijit muhurtam — the auspicious ~48 min window centred on local midday
//   (the 8th of 15 muhurtas across the day).

import {
  getSunrise,
  getSunset,
  getTimezoneCoordinates,
} from "./panchang";

export interface MuhurtamPeriod {
  nameEn: string;
  nameTe: string;
  start: string; // "HH:MM" 24h, local to the timezone
  end: string;
  auspicious: boolean;
  noteEn: string;
  noteTe: string;
}

export interface MuhurtamData {
  date: string; // YYYY-MM-DD
  timezone: string;
  weekday: string;
  sunrise: string;
  sunset: string;
  periods: MuhurtamPeriod[];
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// 1-based segment (of the 8 day-parts) for each weekday, index = getUTCDay().
// Classical sequences used across Telugu/South-Indian panchangams.
const RAHU_SEGMENT = [8, 2, 7, 5, 6, 4, 3]; // Sun..Sat
const YAMA_SEGMENT = [5, 4, 3, 2, 1, 7, 6];
const GULIKA_SEGMENT = [7, 6, 5, 4, 3, 2, 1];

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(totalMinutes: number): string {
  let mins = Math.round(totalMinutes) % (24 * 60);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function getMuhurtam(
  date: Date,
  timezone: string = "Asia/Kolkata",
): MuhurtamData {
  const { lat, lon, offset } = getTimezoneCoordinates(timezone);

  const sunriseStr = getSunrise(date, lat, lon, offset);
  const sunsetStr = getSunset(date, lat, lon, offset);

  const sunrise = toMinutes(sunriseStr);
  let sunset = toMinutes(sunsetStr);
  if (sunset <= sunrise) sunset += 24 * 60; // guard against wrap

  const dayLength = sunset - sunrise;
  const segment = dayLength / 8; // length of each of the 8 day-parts

  // `date` is noon UTC standing in for the local calendar date, so its UTC
  // weekday matches the local weekday.
  const weekdayIdx = date.getUTCDay();

  const partWindow = (oneBasedSegment: number): { start: number; end: number } => {
    const start = sunrise + (oneBasedSegment - 1) * segment;
    return { start, end: start + segment };
  };

  const rahu = partWindow(RAHU_SEGMENT[weekdayIdx]);
  const yama = partWindow(YAMA_SEGMENT[weekdayIdx]);
  const gulika = partWindow(GULIKA_SEGMENT[weekdayIdx]);

  // Abhijit muhurtam: the 8th of 15 muhurtas, centred on midday.
  const muhurta = dayLength / 15;
  const midday = sunrise + dayLength / 2;
  const abhijit = { start: midday - muhurta / 2, end: midday + muhurta / 2 };

  const periods: MuhurtamPeriod[] = [
    {
      nameEn: "Rahu Kalam",
      nameTe: "రాహుకాలం",
      start: toHHMM(rahu.start),
      end: toHHMM(rahu.end),
      auspicious: false,
      noteEn:
        "Inauspicious; traditionally avoided for starting travel, new ventures, and auspicious activities.",
      noteTe:
        "అశుభ సమయం; ప్రయాణం, కొత్త పనులు, శుభకార్యాలు ఆరంభించడానికి సాధారణంగా దీనిని వదిలిపెడతారు.",
    },
    {
      nameEn: "Yamagandam",
      nameTe: "యమగండం",
      start: toHHMM(yama.start),
      end: toHHMM(yama.end),
      auspicious: false,
      noteEn: "Inauspicious; avoided for important new activities.",
      noteTe: "అశుభ సమయం; ముఖ్యమైన కొత్త పనులకు వదిలిపెడతారు.",
    },
    {
      nameEn: "Gulika Kalam",
      nameTe: "గుళికకాలం",
      start: toHHMM(gulika.start),
      end: toHHMM(gulika.end),
      auspicious: false,
      noteEn:
        "Generally inauspicious for new beginnings (though considered acceptable for some recurring/permanent acts).",
      noteTe:
        "కొత్త పనుల ఆరంభానికి సాధారణంగా అశుభం (కొన్ని శాశ్వత కార్యాలకు అంగీకారం).",
    },
    {
      nameEn: "Abhijit Muhurtam",
      nameTe: "అభిజిత్ ముహూర్తం",
      start: toHHMM(abhijit.start),
      end: toHHMM(abhijit.end),
      auspicious: true,
      noteEn:
        "Auspicious midday window, favourable for most activities including travel and new beginnings. (By tradition Abhijit is not taken on Wednesdays.)",
      noteTe:
        "మధ్యాహ్న శుభ ముహూర్తం; ప్రయాణం, కొత్త పనులు సహా చాలా కార్యాలకు అనుకూలం. (సంప్రదాయంగా బుధవారం అభిజిత్‌ను తీసుకోరు.)",
    },
  ];

  let dateStr: string;
  try {
    dateStr = date.toLocaleDateString("en-CA", { timeZone: timezone });
  } catch {
    dateStr = date.toISOString().split("T")[0];
  }

  return {
    date: dateStr,
    timezone,
    weekday: WEEKDAYS[weekdayIdx],
    sunrise: sunriseStr,
    sunset: sunsetStr,
    periods,
  };
}
