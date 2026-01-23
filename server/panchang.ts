import type { PanchangData, Festival, TempleEvent } from "@shared/schema";
import {
  tithiNames,
  tithiNamesTelugu,
  nakshatraNames,
  nakshatraNamesTelugu,
  teluguMonths,
  teluguMonthsEnglish,
  pakshas,
  pakshasTelugu,
} from "@shared/schema";

const SYNODIC_MONTH = 29.530588853;
const NEW_MOON_REFERENCE = new Date("2026-01-18T19:52:00Z").getTime();
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const TITHI_DURATION_MS = (SYNODIC_MONTH / 30) * MS_PER_DAY;
const NAKSHATRA_DURATION_DEG = 360 / 27;

export function getMoonPhase(date: Date): number {
  const diff = date.getTime() - NEW_MOON_REFERENCE;
  const days = diff / MS_PER_DAY;
  let phase = (days % SYNODIC_MONTH) / SYNODIC_MONTH;
  if (phase < 0) phase += 1;
  return phase;
}

export function getTithiNumber(date: Date): number {
  const phase = getMoonPhase(date);
  return Math.floor(phase * 30) % 30;
}

export function getTithiTimings(date: Date, timezone: string = "Asia/Kolkata"): { startTime: string; endTime: string } {
  const phase = getMoonPhase(date);
  const currentTithi = Math.floor(phase * 30);
  const fractionIntoTithi = (phase * 30) - currentTithi;
  
  const timeIntoTithi = fractionIntoTithi * TITHI_DURATION_MS;
  const timeUntilEnd = TITHI_DURATION_MS - timeIntoTithi;
  
  const startDate = new Date(date.getTime() - timeIntoTithi);
  const endDate = new Date(date.getTime() + timeUntilEnd);
  
  return {
    startTime: formatTime(startDate, timezone),
    endTime: formatTime(endDate, timezone),
  };
}

export function getNakshatraTimings(date: Date, timezone: string = "Asia/Kolkata"): { startTime: string; endTime: string } {
  const jd = getJulianDay(date);
  const moonLong = getMoonLongitude(jd);
  const nakshatraIndex = Math.floor(moonLong / NAKSHATRA_DURATION_DEG);
  const fractionIntoNakshatra = (moonLong / NAKSHATRA_DURATION_DEG) - nakshatraIndex;
  
  const moonDailyMotion = 13.176358;
  const nakshatraDurationHours = (NAKSHATRA_DURATION_DEG / moonDailyMotion) * 24;
  const nakshatraDurationMs = nakshatraDurationHours * 60 * 60 * 1000;
  
  const timeIntoNakshatra = fractionIntoNakshatra * nakshatraDurationMs;
  const timeUntilEnd = nakshatraDurationMs - timeIntoNakshatra;
  
  const startDate = new Date(date.getTime() - timeIntoNakshatra);
  const endDate = new Date(date.getTime() + timeUntilEnd);
  
  return {
    startTime: formatTime(startDate, timezone),
    endTime: formatTime(endDate, timezone),
  };
}

function formatTime(date: Date, timezone: string = "Asia/Kolkata"): string {
  try {
    return date.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
}

export function getTithi(date: Date): { name: string; nameTelugu: string; number: number; paksha: string; pakshaTelugu: string } {
  const tithiNum = getTithiNumber(date);
  
  let paksha: number;
  let tithiIndex: number;
  
  if (tithiNum < 15) {
    paksha = 0;
    tithiIndex = tithiNum;
  } else {
    paksha = 1;
    const krishnaTithi = tithiNum - 15;
    if (krishnaTithi === 14) {
      tithiIndex = 15;
    } else {
      tithiIndex = krishnaTithi;
    }
  }
  
  return {
    name: tithiNames[tithiIndex] || tithiNames[0],
    nameTelugu: tithiNamesTelugu[tithiIndex] || tithiNamesTelugu[0],
    number: tithiNum,
    paksha: pakshas[paksha],
    pakshaTelugu: pakshasTelugu[paksha],
  };
}

export function getNakshatra(date: Date): { name: string; nameTelugu: string; index: number } {
  const jd = getJulianDay(date);
  const moonLong = getMoonLongitude(jd);
  const nakshatraIndex = Math.floor(moonLong / NAKSHATRA_DURATION_DEG) % 27;
  
  return {
    name: nakshatraNames[nakshatraIndex],
    nameTelugu: nakshatraNamesTelugu[nakshatraIndex],
    index: nakshatraIndex,
  };
}

function getJulianDay(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate() + date.getUTCHours() / 24 + date.getUTCMinutes() / 1440;
  
  let y = year;
  let m = month;
  
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
}

function getMoonLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  let L = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
  L = L % 360;
  if (L < 0) L += 360;
  return L;
}

export function getTeluguMonth(date: Date): { name: string; nameEnglish: string; index: number } {
  // Telugu months are lunar months. A month starts after Amavasya (new moon).
  // Reference: New Moon on Jan 18, 2026 starts Magha month (index 10)
  // Chaitra (index 0) starts around March 29, 2026
  
  // Calculate which lunar month we're in based on synodic cycles from reference
  const diff = date.getTime() - NEW_MOON_REFERENCE;
  const daysSinceRef = diff / MS_PER_DAY;
  const lunarMonthsSinceRef = Math.floor(daysSinceRef / SYNODIC_MONTH);
  
  // Reference new moon (Jan 18, 2026) is start of Magha (index 10)
  // Each synodic month advances to next Telugu month
  let teluguIndex = (10 + lunarMonthsSinceRef) % 12;
  if (teluguIndex < 0) teluguIndex += 12;
  
  return {
    name: teluguMonths[teluguIndex],
    nameEnglish: teluguMonthsEnglish[teluguIndex],
    index: teluguIndex,
  };
}

export function getTeluguYear(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  if (month < 3) {
    return year + 56;
  }
  return year + 57;
}

export function getSunrise(date: Date, lat: number = 17.385, lon: number = 78.4867, timezoneOffset: number = 5.5): string {
  const dayOfYear = getDayOfYear(date);
  const B = (2 * Math.PI / 365) * (dayOfYear - 81);
  const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const decl = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
  
  const latRad = lat * Math.PI / 180;
  const declRad = decl * Math.PI / 180;
  
  const cosHA = -Math.tan(latRad) * Math.tan(declRad);
  const HA = Math.acos(Math.max(-1, Math.min(1, cosHA))) * 180 / Math.PI;
  
  const solarNoon = 12 - lon / 15 - EoT / 60 + timezoneOffset;
  const sunrise = solarNoon - HA / 15;
  
  const hours = Math.floor(sunrise);
  const minutes = Math.round((sunrise - hours) * 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function getSunset(date: Date, lat: number = 17.385, lon: number = 78.4867, timezoneOffset: number = 5.5): string {
  const dayOfYear = getDayOfYear(date);
  const B = (2 * Math.PI / 365) * (dayOfYear - 81);
  const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const decl = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
  
  const latRad = lat * Math.PI / 180;
  const declRad = decl * Math.PI / 180;
  
  const cosHA = -Math.tan(latRad) * Math.tan(declRad);
  const HA = Math.acos(Math.max(-1, Math.min(1, cosHA))) * 180 / Math.PI;
  
  const solarNoon = 12 - lon / 15 - EoT / 60 + timezoneOffset;
  const sunset = solarNoon + HA / 15;
  
  const hours = Math.floor(sunset);
  const minutes = Math.round((sunset - hours) * 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / MS_PER_DAY);
}

function getTimezoneCoordinates(timezone: string): { lat: number; lon: number; offset: number } {
  const timezoneData: Record<string, { lat: number; lon: number; offset: number }> = {
    "Asia/Kolkata": { lat: 17.385, lon: 78.4867, offset: 5.5 },
    "Asia/Dubai": { lat: 25.2048, lon: 55.2708, offset: 4 },
    "Asia/Singapore": { lat: 1.3521, lon: 103.8198, offset: 8 },
    "Asia/Tokyo": { lat: 35.6762, lon: 139.6503, offset: 9 },
    "Asia/Hong_Kong": { lat: 22.3193, lon: 114.1694, offset: 8 },
    "Europe/London": { lat: 51.5074, lon: -0.1278, offset: 0 },
    "Europe/Paris": { lat: 48.8566, lon: 2.3522, offset: 1 },
    "Europe/Berlin": { lat: 52.52, lon: 13.405, offset: 1 },
    "America/New_York": { lat: 40.7128, lon: -74.006, offset: -5 },
    "America/Chicago": { lat: 41.8781, lon: -87.6298, offset: -6 },
    "America/Denver": { lat: 39.7392, lon: -104.9903, offset: -7 },
    "America/Los_Angeles": { lat: 34.0522, lon: -118.2437, offset: -8 },
    "America/Toronto": { lat: 43.6532, lon: -79.3832, offset: -5 },
    "Australia/Sydney": { lat: -33.8688, lon: 151.2093, offset: 10 },
    "Australia/Melbourne": { lat: -37.8136, lon: 144.9631, offset: 10 },
    "Pacific/Auckland": { lat: -36.8485, lon: 174.7633, offset: 12 },
  };
  return timezoneData[timezone] || timezoneData["Asia/Kolkata"];
}

export function getSpecialDayInfo(tithi: { name: string; number: number; paksha: string }): { isSpecial: boolean; info?: string; infoTelugu?: string } {
  const tithiName = tithi.name.toLowerCase();
  const paksha = tithi.paksha.toLowerCase();
  
  if (tithiName === "ekadashi") {
    return {
      isSpecial: true,
      info: `${tithi.paksha} Ekadashi - Fasting Day`,
      infoTelugu: `${paksha === "shukla" ? "శుక్ల" : "కృష్ణ"} ఏకాదశి - ఉపవాస దినం`,
    };
  }
  
  if (tithiName === "chaturthi") {
    return {
      isSpecial: true,
      info: `${tithi.paksha} Chaturthi - Sacred to Lord Ganesha`,
      infoTelugu: `${paksha === "shukla" ? "శుక్ల" : "కృష్ణ"} చవితి - గణపతి పూజ`,
    };
  }
  
  if (tithiName === "purnima") {
    return {
      isSpecial: true,
      info: "Purnima - Full Moon Day",
      infoTelugu: "పూర్ణిమ - పున్నమి",
    };
  }
  
  if (tithiName === "amavasya") {
    return {
      isSpecial: true,
      info: "Amavasya - New Moon Day",
      infoTelugu: "అమావాస్య - మాసాంతం",
    };
  }
  
  if (tithiName === "trayodashi" || tithi.number === 12 || tithi.number === 27) {
    return {
      isSpecial: true,
      info: "Pradosham - Sacred to Lord Shiva",
      infoTelugu: "ప్రదోషం - శివ పూజ",
    };
  }
  
  return { isSpecial: false };
}

export function getPanchangForDate(date: Date, timezone: string = "Asia/Kolkata"): PanchangData {
  const { lat, lon, offset } = getTimezoneCoordinates(timezone);
  
  const sunriseStr = getSunrise(date, lat, lon, offset);
  const [sunriseHour, sunriseMin] = sunriseStr.split(':').map(Number);
  const sunriseDate = new Date(date);
  sunriseDate.setHours(sunriseHour, sunriseMin, 0, 0);
  
  const tithi = getTithi(sunriseDate);
  const nakshatra = getNakshatra(sunriseDate);
  const teluguMonth = getTeluguMonth(date);
  const teluguYear = getTeluguYear(date);
  const moonPhase = getMoonPhase(sunriseDate);
  const specialDay = getSpecialDayInfo(tithi);
  const tithiTimings = getTithiTimings(sunriseDate, timezone);
  const nakshatraTimings = getNakshatraTimings(sunriseDate, timezone);
  
  const teluguDate = Math.floor(tithi.number / 2) + 1;
  
  return {
    date: date.toISOString().split("T")[0],
    teluguDate,
    teluguMonth: teluguMonth.name,
    teluguMonthEnglish: teluguMonth.nameEnglish,
    teluguYear,
    tithi: tithi.name,
    tithiTelugu: tithi.nameTelugu,
    tithiNumber: tithi.number,
    tithiStartTime: tithiTimings.startTime,
    tithiEndTime: tithiTimings.endTime,
    paksha: tithi.paksha,
    pakshaTelugu: tithi.pakshaTelugu,
    nakshatra: nakshatra.name,
    nakshatraTelugu: nakshatra.nameTelugu,
    nakshatraStartTime: nakshatraTimings.startTime,
    nakshatraEndTime: nakshatraTimings.endTime,
    sunrise: getSunrise(date, lat, lon, offset),
    sunset: getSunset(date, lat, lon, offset),
    timezone,
    moonPhase,
    isSpecialDay: specialDay.isSpecial,
    specialDayInfo: specialDay.info,
    specialDayInfoTelugu: specialDay.infoTelugu,
  };
}

export function getCalendarDays(year: number, month: number, timezone: string = "Asia/Kolkata") {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const endDate = new Date(lastDay);
  const daysToAdd = 6 - lastDay.getDay();
  endDate.setDate(endDate.getDate() + daysToAdd);
  
  const days = [];
  const current = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  while (current <= endDate) {
    const panchang = getPanchangForDate(current, timezone);
    const isCurrentMonth = current.getMonth() === month;
    const isToday = current.toDateString() === today.toDateString();
    
    days.push({
      date: new Date(current),
      isCurrentMonth,
      isToday,
      panchang,
      festivals: [] as Festival[],
      templeEvents: [] as TempleEvent[],
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}
