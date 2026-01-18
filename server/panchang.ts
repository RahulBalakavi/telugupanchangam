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
const NEW_MOON_REFERENCE = new Date("2000-01-06T18:14:00Z").getTime();

export function getMoonPhase(date: Date): number {
  const diff = date.getTime() - NEW_MOON_REFERENCE;
  const days = diff / (1000 * 60 * 60 * 24);
  return (days % SYNODIC_MONTH) / SYNODIC_MONTH;
}

export function getTithiNumber(date: Date): number {
  const phase = getMoonPhase(date);
  return Math.floor(phase * 30) % 30;
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

export function getNakshatra(date: Date): { name: string; nameTelugu: string } {
  const jd = getJulianDay(date);
  const moonLong = getMoonLongitude(jd);
  const nakshatraIndex = Math.floor(moonLong / (360 / 27)) % 27;
  
  return {
    name: nakshatraNames[nakshatraIndex],
    nameTelugu: nakshatraNamesTelugu[nakshatraIndex],
  };
}

function getJulianDay(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate() + date.getUTCHours() / 24;
  
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
  const month = date.getMonth();
  const day = date.getDate();
  
  let teluguIndex = (month + 9) % 12;
  if (day < 15) {
    teluguIndex = (teluguIndex + 11) % 12;
  }
  
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

export function getSunrise(date: Date, lat: number = 17.385, lon: number = 78.4867): string {
  const dayOfYear = getDayOfYear(date);
  const B = (2 * Math.PI / 365) * (dayOfYear - 81);
  const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const decl = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
  
  const latRad = lat * Math.PI / 180;
  const declRad = decl * Math.PI / 180;
  
  const cosHA = -Math.tan(latRad) * Math.tan(declRad);
  const HA = Math.acos(Math.max(-1, Math.min(1, cosHA))) * 180 / Math.PI;
  
  const solarNoon = 12 - lon / 15 - EoT / 60 + 5.5;
  const sunrise = solarNoon - HA / 15;
  
  const hours = Math.floor(sunrise);
  const minutes = Math.round((sunrise - hours) * 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function getSunset(date: Date, lat: number = 17.385, lon: number = 78.4867): string {
  const dayOfYear = getDayOfYear(date);
  const B = (2 * Math.PI / 365) * (dayOfYear - 81);
  const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const decl = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
  
  const latRad = lat * Math.PI / 180;
  const declRad = decl * Math.PI / 180;
  
  const cosHA = -Math.tan(latRad) * Math.tan(declRad);
  const HA = Math.acos(Math.max(-1, Math.min(1, cosHA))) * 180 / Math.PI;
  
  const solarNoon = 12 - lon / 15 - EoT / 60 + 5.5;
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
  
  if (tithiName === "pradosham" || tithi.number === 12 || tithi.number === 27) {
    return {
      isSpecial: true,
      info: "Pradosham - Sacred to Lord Shiva",
      infoTelugu: "ప్రదోషం - శివ పూజ",
    };
  }
  
  return { isSpecial: false };
}

export function getPanchangForDate(date: Date): PanchangData {
  const tithi = getTithi(date);
  const nakshatra = getNakshatra(date);
  const teluguMonth = getTeluguMonth(date);
  const teluguYear = getTeluguYear(date);
  const moonPhase = getMoonPhase(date);
  const specialDay = getSpecialDayInfo(tithi);
  
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
    paksha: tithi.paksha,
    pakshaTelugu: tithi.pakshaTelugu,
    nakshatra: nakshatra.name,
    nakshatraTelugu: nakshatra.nameTelugu,
    sunrise: getSunrise(date),
    sunset: getSunset(date),
    moonPhase,
    isSpecialDay: specialDay.isSpecial,
    specialDayInfo: specialDay.info,
    specialDayInfoTelugu: specialDay.infoTelugu,
  };
}

export function getCalendarDays(year: number, month: number) {
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
    const panchang = getPanchangForDate(current);
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
