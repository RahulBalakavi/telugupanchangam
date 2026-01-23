import webpush from "web-push";
import { storage } from "./storage";
import { getPanchangForDate } from "./panchang";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:panchangam@replit.app";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY || "";
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotification(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: PushPayload
): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error("VAPID keys not configured");
    return false;
  }

  try {
    await webpush.sendNotification(
      {
        endpoint,
        keys: { p256dh, auth },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (error: unknown) {
    const err = error as { statusCode?: number };
    if (err.statusCode === 410 || err.statusCode === 404) {
      await storage.deletePushSubscription(endpoint);
      console.log("Removed expired subscription:", endpoint);
    } else {
      console.error("Push notification failed:", error);
    }
    return false;
  }
}

export async function sendNotificationToUser(
  userId: string,
  payload: PushPayload
): Promise<number> {
  const subscriptions = await storage.getPushSubscriptionsByUserId(userId);
  let sentCount = 0;
  
  for (const sub of subscriptions) {
    const success = await sendPushNotification(
      sub.endpoint,
      sub.p256dh,
      sub.auth,
      payload
    );
    if (success) sentCount++;
  }
  
  return sentCount;
}

function getTithiNumber(tithiName: string): number {
  const tithis = [
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
    "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
    "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima", "Amavasya"
  ];
  return tithis.indexOf(tithiName) + 1;
}

function shouldNotify(
  tithiNumber: number,
  preferences: {
    notifyEkadashi?: boolean | null;
    notifyChaturthi?: boolean | null;
    notifyShashthi?: boolean | null;
    notifyAshtami?: boolean | null;
    notifyPurnima?: boolean | null;
    notifyAmavasya?: boolean | null;
  }
): { shouldSend: boolean; tithiName: string; tithiTelugu: string } {
  const tithiNames = [
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
    "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
    "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima", "Amavasya"
  ];
  const tithiNamesTelugu = [
    "పాడ్యమి", "విదియ", "తదియ", "చవితి", "పంచమి",
    "షష్ఠి", "సప్తమి", "అష్టమి", "నవమి", "దశమి",
    "ఏకాదశి", "ద్వాదశి", "త్రయోదశి", "చతుర్దశి", "పూర్ణిమ", "అమావాస్య"
  ];

  const tithiName = tithiNames[tithiNumber - 1] || "";
  const tithiTelugu = tithiNamesTelugu[tithiNumber - 1] || "";

  let shouldSend = false;

  if (tithiNumber === 4 && preferences.notifyChaturthi) shouldSend = true;
  if (tithiNumber === 6 && preferences.notifyShashthi) shouldSend = true;
  if (tithiNumber === 8 && preferences.notifyAshtami) shouldSend = true;
  if (tithiNumber === 11 && preferences.notifyEkadashi) shouldSend = true;
  if (tithiNumber === 15 && preferences.notifyPurnima) shouldSend = true;
  if (tithiNumber === 16 && preferences.notifyAmavasya) shouldSend = true;

  return { shouldSend, tithiName, tithiTelugu };
}

export async function checkAndSendNotifications(): Promise<void> {
  console.log("Running notification check at", new Date().toISOString());
  
  const allPrefs = await storage.getAllNotificationPreferences();
  
  for (const prefs of allPrefs) {
    if (!prefs.enabled) continue;
    
    const timezone = prefs.timezone || "Asia/Kolkata";
    const notifyTime = prefs.notifyTime || "06:00";
    
    const now = new Date();
    const userTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    const currentHour = userTime.getHours();
    const currentMinute = userTime.getMinutes();
    
    const [targetHour, targetMinute] = notifyTime.split(":").map(Number);
    
    if (currentHour === targetHour && currentMinute >= targetMinute && currentMinute < targetMinute + 5) {
      const today = new Date(userTime.getFullYear(), userTime.getMonth(), userTime.getDate());
      const todayStr = `${userTime.getFullYear()}-${String(userTime.getMonth() + 1).padStart(2, "0")}-${String(userTime.getDate()).padStart(2, "0")}`;
      const panchang = getPanchangForDate(today, timezone);
      
      const tithiNumber = panchang.tithiNumber;
      const { shouldSend, tithiName, tithiTelugu } = shouldNotify(tithiNumber, prefs);
      
      if (shouldSend) {
        const payload: PushPayload = {
          title: `${tithiTelugu} (${tithiName})`,
          body: `Today is ${tithiName}. ${panchang.specialDayInfo || "A special day for prayers and observances."}`,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-72.png",
          tag: `tithi-${todayStr}`,
          data: {
            url: "/",
            tithi: tithiName,
            date: todayStr,
          },
        };
        
        const sentCount = await sendNotificationToUser(prefs.userId, payload);
        console.log(`Sent ${sentCount} notifications to user ${prefs.userId} for ${tithiName}`);
      }
    }
  }
}

let notificationInterval: ReturnType<typeof setInterval> | null = null;

export function startNotificationScheduler(): void {
  if (notificationInterval) {
    clearInterval(notificationInterval);
  }
  
  checkAndSendNotifications().catch(console.error);
  
  notificationInterval = setInterval(() => {
    checkAndSendNotifications().catch(console.error);
  }, 5 * 60 * 1000);
  
  console.log("Notification scheduler started - checking every 5 minutes");
}

export function stopNotificationScheduler(): void {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
    console.log("Notification scheduler stopped");
  }
}
