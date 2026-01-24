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
import * as Astronomy from "astronomy-engine";

const NAKSHATRA_SPAN_DEG = 360 / 27; // Each nakshatra spans 13.333... degrees

// Get accurate moon phase from astronomy-engine (0 = new moon, 0.5 = full moon, 1 = new moon)
export function getMoonPhase(date: Date): number {
  const astroDate = Astronomy.MakeTime(date);
  const illum = Astronomy.Illumination(Astronomy.Body.Moon, astroDate);
  return illum.phase_angle / 360; // Convert phase angle to 0-1 range
}

// Get accurate moon ecliptic longitude for nakshatra calculation
function getMoonLongitude(date: Date): number {
  const astroDate = Astronomy.MakeTime(date);
  const ecliptic = Astronomy.EclipticGeoMoon(astroDate);
  let lon = ecliptic.lon;
  if (lon < 0) lon += 360;
  return lon;
}

// Calculate tithi number (0-29) from Sun-Moon angular distance
// Tithi is based on the angular distance between Moon and Sun
// Each tithi is 12 degrees of elongation (360/30 = 12)
export function getTithiNumber(date: Date): number {
  const astroDate = Astronomy.MakeTime(date);
  
  // Get ecliptic longitudes of Sun and Moon
  const sunEcliptic = Astronomy.SunPosition(astroDate);
  const moonEcliptic = Astronomy.EclipticGeoMoon(astroDate);
  
  // Calculate the angular distance from Sun to Moon (Moon - Sun)
  // This goes from 0° at new moon to 360° at next new moon
  let elongation = moonEcliptic.lon - sunEcliptic.elon;
  
  // Normalize to 0-360 range
  while (elongation < 0) elongation += 360;
  while (elongation >= 360) elongation -= 360;
  
  // Each tithi is 12 degrees
  const tithiNum = Math.floor(elongation / 12) % 30;
  return tithiNum;
}

// Search for the exact time when a specific tithi ends
function searchTithiEnd(date: Date, currentTithi: number): Date {
  const targetElongation = ((currentTithi + 1) % 30) * 12;
  
  // Binary search for the tithi end time within the next 2 days
  let low = date.getTime();
  let high = date.getTime() + 2 * 24 * 60 * 60 * 1000;
  
  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const midDate = new Date(mid);
    const tithiAtMid = getTithiNumber(midDate);
    
    if (tithiAtMid === currentTithi) {
      low = mid;
    } else {
      high = mid;
    }
  }
  
  return new Date(high);
}

// Search for the exact time when a tithi starts
function searchTithiStart(date: Date, currentTithi: number): Date {
  // Search backwards to find when this tithi started
  let low = date.getTime() - 2 * 24 * 60 * 60 * 1000;
  let high = date.getTime();
  
  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const midDate = new Date(mid);
    const tithiAtMid = getTithiNumber(midDate);
    
    if (tithiAtMid === currentTithi) {
      high = mid;
    } else {
      low = mid;
    }
  }
  
  return new Date(high);
}

export function getTithiTimings(date: Date, timezone: string = "Asia/Kolkata"): { startTime: string; endTime: string } {
  const currentTithi = getTithiNumber(date);
  const startDate = searchTithiStart(date, currentTithi);
  const endDate = searchTithiEnd(date, currentTithi);
  
  // Check if start/end dates are on different days than the reference date
  const referenceDay = getDateInTimezone(date, timezone);
  const startDay = getDateInTimezone(startDate, timezone);
  const endDay = getDateInTimezone(endDate, timezone);
  const startDaysDiff = startDay - referenceDay;
  const endDaysDiff = endDay - referenceDay;
  
  return {
    startTime: formatTime(startDate, timezone) + (startDaysDiff < 0 ? ` (${startDaysDiff})` : ""),
    endTime: formatTime(endDate, timezone) + (endDaysDiff > 0 ? ` (+${endDaysDiff})` : ""),
  };
}

// Get nakshatra index from moon longitude
function getNakshatraIndex(date: Date): number {
  const moonLon = getMoonLongitude(date);
  // Nakshatras start from Ashwini at 0 degrees (aligned with sidereal zodiac)
  // Apply Lahiri ayanamsa approximation for sidereal correction
  const ayanamsa = getAyanamsa(date);
  let siderealLon = moonLon - ayanamsa;
  if (siderealLon < 0) siderealLon += 360;
  return Math.floor(siderealLon / NAKSHATRA_SPAN_DEG) % 27;
}

// Lahiri ayanamsa approximation (sidereal correction)
function getAyanamsa(date: Date): number {
  const year = date.getFullYear() + (date.getMonth() + 1) / 12;
  // Lahiri ayanamsa formula: approximately 23.85 degrees in 2000, increasing ~50.3 arcsec/year
  const ayanamsa2000 = 23.85;
  const ratePerYear = 50.3 / 3600; // arcseconds to degrees
  return ayanamsa2000 + (year - 2000) * ratePerYear;
}

function searchNakshatraEnd(date: Date, currentNakshatra: number): Date {
  let low = date.getTime();
  let high = date.getTime() + 2 * 24 * 60 * 60 * 1000;
  
  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const midDate = new Date(mid);
    const nakshatraAtMid = getNakshatraIndex(midDate);
    
    if (nakshatraAtMid === currentNakshatra) {
      low = mid;
    } else {
      high = mid;
    }
  }
  
  return new Date(high);
}

function searchNakshatraStart(date: Date, currentNakshatra: number): Date {
  let low = date.getTime() - 2 * 24 * 60 * 60 * 1000;
  let high = date.getTime();
  
  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const midDate = new Date(mid);
    const nakshatraAtMid = getNakshatraIndex(midDate);
    
    if (nakshatraAtMid === currentNakshatra) {
      high = mid;
    } else {
      low = mid;
    }
  }
  
  return new Date(high);
}

export function getNakshatraTimings(date: Date, timezone: string = "Asia/Kolkata"): { startTime: string; endTime: string } {
  const currentNakshatra = getNakshatraIndex(date);
  const startDate = searchNakshatraStart(date, currentNakshatra);
  const endDate = searchNakshatraEnd(date, currentNakshatra);
  
  // Check if start/end dates are on different days than the reference date
  const referenceDay = getDateInTimezone(date, timezone);
  const startDay = getDateInTimezone(startDate, timezone);
  const endDay = getDateInTimezone(endDate, timezone);
  const startDaysDiff = startDay - referenceDay;
  const endDaysDiff = endDay - referenceDay;
  
  return {
    startTime: formatTime(startDate, timezone) + (startDaysDiff < 0 ? ` (${startDaysDiff})` : ""),
    endTime: formatTime(endDate, timezone) + (endDaysDiff > 0 ? ` (+${endDaysDiff})` : ""),
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

// Get the day of the year in a specific timezone for date comparison
function getDateInTimezone(date: Date, timezone: string): number {
  try {
    const dateStr = date.toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD format
    const [year, month, day] = dateStr.split('-').map(Number);
    return year * 10000 + month * 100 + day; // Unique number for each day
  } catch {
    return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  }
}

export function getTithi(date: Date): { name: string; nameTelugu: string; number: number; paksha: string; pakshaTelugu: string } {
  const tithiNum = getTithiNumber(date);
  
  let paksha: number;
  let tithiIndex: number;
  
  if (tithiNum < 15) {
    paksha = 0; // Shukla
    tithiIndex = tithiNum;
  } else {
    paksha = 1; // Krishna
    const krishnaTithi = tithiNum - 15;
    if (krishnaTithi === 14) {
      tithiIndex = 15; // Amavasya
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
  const nakshatraIndex = getNakshatraIndex(date);
  
  return {
    name: nakshatraNames[nakshatraIndex],
    nameTelugu: nakshatraNamesTelugu[nakshatraIndex],
    index: nakshatraIndex,
  };
}

// Find the most recent new moon before or on the given date
function findPreviousNewMoon(date: Date): Date {
  const astroTime = Astronomy.MakeTime(date);
  // Search backwards for new moon (phase 0)
  const newMoon = Astronomy.SearchMoonPhase(0, astroTime, -30);
  return newMoon ? newMoon.date : date;
}

// Find the next new moon after the given date
function findNextNewMoon(date: Date): Date {
  const astroTime = Astronomy.MakeTime(date);
  const newMoon = Astronomy.SearchMoonPhase(0, astroTime, 30);
  return newMoon ? newMoon.date : date;
}

// Telugu month is determined by the lunar month
// Reference: Chaitra is the first month, starting around March/April new moon
export function getTeluguMonth(date: Date): { name: string; nameEnglish: string; index: number } {
  // For Telugu calendar, the month starts after new moon (Amanta/Amavasya system)
  // Find the new moon that starts the current lunar month
  const prevNewMoon = findPreviousNewMoon(date);
  const nextNewMoon = findNextNewMoon(date);
  
  // If we're within 12 hours of a new moon, use the upcoming month
  // This handles edge cases like Ugadi morning when new moon is same day
  const hoursToNextNewMoon = (nextNewMoon.getTime() - date.getTime()) / (1000 * 60 * 60);
  const monthStartNewMoon = hoursToNextNewMoon < 12 ? nextNewMoon : prevNewMoon;
  
  // Find Chaitra new moon - the new moon in March/April closest to spring equinox
  // Chaitra starts with the new moon that falls between mid-March and mid-April
  const year = date.getFullYear();
  
  // Search for the new moon closest to March 21 (spring equinox)
  const springEquinox = new Date(Date.UTC(year, 2, 21)); // March 21
  const chaitraNewMoon = Astronomy.SearchMoonPhase(0, Astronomy.MakeTime(springEquinox), -15);
  
  if (!chaitraNewMoon) {
    return { name: teluguMonths[0], nameEnglish: teluguMonthsEnglish[0], index: 0 };
  }
  
  // Calculate months since Chaitra new moon
  const msDiff = monthStartNewMoon.getTime() - chaitraNewMoon.date.getTime();
  const daysDiff = msDiff / (24 * 60 * 60 * 1000);
  let monthsSinceChaitra = Math.round(daysDiff / 29.53);
  
  // Normalize to 0-11 range
  while (monthsSinceChaitra < 0) monthsSinceChaitra += 12;
  monthsSinceChaitra = monthsSinceChaitra % 12;
  
  return {
    name: teluguMonths[monthsSinceChaitra],
    nameEnglish: teluguMonthsEnglish[monthsSinceChaitra],
    index: monthsSinceChaitra,
  };
}

export function getTeluguYear(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // Telugu year changes around Ugadi (March/April)
  // Saka era: Gregorian year - 78 (before March) or - 77 (after March)
  if (month < 3) { // Before April
    return year + 56; // Saka era approximation for display
  }
  return year + 57;
}

// Get sunrise using astronomy-engine
export function getSunrise(date: Date, lat: number = 17.385, lon: number = 78.4867, timezoneOffset: number = 5.5): string {
  try {
    const observer = new Astronomy.Observer(lat, lon, 0);
    const astroDate = Astronomy.MakeTime(date);
    const sunrise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, astroDate, 1);
    
    if (sunrise) {
      return formatTimeFromDate(sunrise.date, timezoneOffset);
    }
  } catch (e) {
    // Fallback to simple calculation
  }
  
  // Fallback calculation
  return fallbackSunrise(date, lat, lon, timezoneOffset);
}

// Get sunset using astronomy-engine
export function getSunset(date: Date, lat: number = 17.385, lon: number = 78.4867, timezoneOffset: number = 5.5): string {
  try {
    const observer = new Astronomy.Observer(lat, lon, 0);
    const astroDate = Astronomy.MakeTime(date);
    const sunset = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, astroDate, 1);
    
    if (sunset) {
      return formatTimeFromDate(sunset.date, timezoneOffset);
    }
  } catch (e) {
    // Fallback to simple calculation
  }
  
  // Fallback calculation
  return fallbackSunset(date, lat, lon, timezoneOffset);
}

function formatTimeFromDate(date: Date, timezoneOffset: number): string {
  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();
  const totalMinutes = utcHours * 60 + utcMinutes + timezoneOffset * 60;
  
  let hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = Math.round(totalMinutes % 60);
  
  if (hours < 0) hours += 24;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function fallbackSunrise(date: Date, lat: number, lon: number, timezoneOffset: number): string {
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

function fallbackSunset(date: Date, lat: number, lon: number, timezoneOffset: number): string {
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
  return Math.floor(diff / (1000 * 60 * 60 * 24));
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
  
  // Telugu date is the tithi number within the paksha (1-15 for each fortnight)
  const tithiInPaksha = (tithi.number % 15) + 1;
  const teluguDate = tithiInPaksha;
  
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
