import { z } from "zod";

export * from "./models/auth";

export const tithiNames = [
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
  "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
  "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima", "Amavasya"
] as const;

export const tithiNamesTelugu = [
  "పాడ్యమి", "విదియ", "తదియ", "చవితి", "పంచమి",
  "షష్ఠి", "సప్తమి", "అష్టమి", "నవమి", "దశమి",
  "ఏకాదశి", "ద్వాదశి", "త్రయోదశి", "చతుర్దశి", "పూర్ణిమ", "అమావాస్య"
] as const;

export const nakshatraNames = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu",
  "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta",
  "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha",
  "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
  "Uttara Bhadrapada", "Revati"
] as const;

export const nakshatraNamesTelugu = [
  "అశ్విని", "భరణి", "కృత్తిక", "రోహిణి", "మృగశిర", "ఆర్ద్ర", "పునర్వసు",
  "పుష్యమి", "ఆశ్లేష", "మఖ", "పుబ్బ", "ఉత్తర", "హస్త",
  "చిత్త", "స్వాతి", "విశాఖ", "అనురాధ", "జ్యేష్ఠ", "మూల", "పూర్వాషాఢ",
  "ఉత్తరాషాఢ", "శ్రావణం", "ధనిష్ఠ", "శతభిషం", "పూర్వాభాద్ర",
  "ఉత్తరాభాద్ర", "రేవతి"
] as const;

export const teluguMonths = [
  "చైత్రం", "వైశాఖం", "జ్యేష్ఠం", "ఆషాఢం", "శ్రావణం", "భాద్రపదం",
  "ఆశ్వయుజం", "కార్తీకం", "మార్గశిరం", "పుష్యం", "మాఘం", "ఫాల్గుణం"
] as const;

export const teluguMonthsEnglish = [
  "Chaitra", "Vaishakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada",
  "Ashwayuja", "Kartika", "Margashira", "Pushya", "Magha", "Phalguna"
] as const;

export const pakshas = ["Shukla", "Krishna"] as const;
export const pakshasTelugu = ["శుక్ల పక్షం", "కృష్ణ పక్షం"] as const;

export interface PanchangData {
  date: string;
  teluguDate: number;
  teluguMonth: string;
  teluguMonthEnglish: string;
  teluguYear: number;
  tithi: string;
  tithiTelugu: string;
  tithiNumber: number;
  tithiStartTime: string;
  tithiEndTime: string;
  paksha: string;
  pakshaTelugu: string;
  nakshatra: string;
  nakshatraTelugu: string;
  nakshatraStartTime: string;
  nakshatraEndTime: string;
  sunrise: string;
  sunset: string;
  timezone: string;
  moonPhase: number;
  isSpecialDay: boolean;
  specialDayInfo?: string;
  specialDayInfoTelugu?: string;
}

export interface Festival {
  id: string;
  name: string;
  nameTelugu: string;
  date: string;
  description: string;
  descriptionTelugu: string;
  type: "major" | "minor" | "regional";
  relatedTithi?: string;
}

export interface TempleEvent {
  id: string;
  templeName: string;
  templeNameTelugu: string;
  location: string;
  locationTelugu: string;
  eventName: string;
  eventNameTelugu: string;
  description: string;
  descriptionTelugu: string;
  startDate: string;
  endDate?: string;
  imageUrl?: string;
}

export interface NotificationPreference {
  id: string;
  enabled: boolean;
  notifyEkadashi: boolean;
  notifyChaturthi: boolean;
  notifyShashthi: boolean;
  notifyAshtami: boolean;
  notifyPurnima: boolean;
  notifyAmavasya: boolean;
  notifyTempleEvents: boolean;
  notifyTime: string;
}

export const notificationPreferenceSchema = z.object({
  enabled: z.boolean(),
  notifyEkadashi: z.boolean(),
  notifyChaturthi: z.boolean(),
  notifyShashthi: z.boolean(),
  notifyAshtami: z.boolean(),
  notifyPurnima: z.boolean(),
  notifyAmavasya: z.boolean(),
  notifyTempleEvents: z.boolean(),
  notifyTime: z.string(),
});

export type InsertNotificationPreference = z.infer<typeof notificationPreferenceSchema>;

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  panchang?: PanchangData;
  festivals: Festival[];
  templeEvents: TempleEvent[];
}

