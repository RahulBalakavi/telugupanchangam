import type { Express } from "express";
import { createServer, type Server } from "http";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import {
  getPanchangForDate,
  getCalendarDays,
  getTodayInTimezone,
} from "./panchang";
import {
  getUpcomingFestivals,
  getAllFestivals,
  getFestivalsForDate,
  getUpcomingTempleEvents,
  getTempleEventsForDate,
} from "./data";
import { notificationPreferenceSchema, type CalendarDay } from "@shared/schema";
import {
  runChat,
  isChatConfigured,
  ChatUnavailableError,
  type ChatMessage,
} from "./chat";
import { getUpcomingEclipses, getPastEclipses, getLocalEclipseVisibility, getEclipsesForMonth, isValidTimezone } from "./eclipse";
import { storage } from "./storage";
import { getVapidPublicKey, startNotificationScheduler, sendNotificationToDevice } from "./push-service";

// The app has no accounts; notification state is keyed to an opaque device id
// the client mints once and keeps in localStorage. Only well-formed ids are
// accepted so a caller can't use this as arbitrary key/value storage.
const DEVICE_ID_RE = /^[A-Za-z0-9-]{16,64}$/;

function getDeviceId(req: { header(name: string): string | undefined }): string | null {
  const id = req.header("X-Device-Id");
  return id && DEVICE_ID_RE.test(id) ? id : null;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Public API routes
  app.get("/api/panchang/today", (req, res) => {
    const timezone = (req.query.timezone as string) || "Asia/Kolkata";
    const today = getTodayInTimezone(timezone);
    const panchang = getPanchangForDate(today, timezone);
    res.json(panchang);
  });

  app.get("/api/eclipses", (req, res) => {
    try {
      const timezone = (req.query.timezone as string) || "Asia/Kolkata";
      if (!isValidTimezone(timezone)) {
        return res.status(400).json({ error: "Invalid timezone" });
      }
      const eclipses = getUpcomingEclipses(timezone, 8);
      const past = getPastEclipses(timezone);
      res.json({ eclipses, past });
    } catch (error) {
      res.status(500).json({ error: "Failed to compute eclipses" });
    }
  });

  app.get("/api/eclipses/visibility", (req, res) => {
    try {
      const schema = z.object({
        type: z.enum(["solar", "lunar"]),
        peakUtc: z.string().refine((s) => !isNaN(Date.parse(s)), "Invalid date"),
        lat: z.coerce.number().finite().min(-90).max(90),
        lon: z.coerce.number().finite().min(-180).max(180),
        timezone: z.string().default("Asia/Kolkata").refine(isValidTimezone, "Invalid timezone"),
      });
      const parsed = schema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid parameters" });
      }
      const { type, peakUtc, lat, lon, timezone } = parsed.data;
      // Bound the search to a sane window (past year through +10 years) so the
      // endpoint can't be used to run unbounded astronomy searches.
      const peakMs = Date.parse(peakUtc);
      const now = Date.now();
      if (peakMs < now - 366 * 86400_000 || peakMs > now + 3660 * 86400_000) {
        return res.status(400).json({ error: "Eclipse date out of range" });
      }
      const visibility = getLocalEclipseVisibility(type, new Date(peakUtc), lat, lon, timezone);
      res.json(visibility);
    } catch (error) {
      res.status(500).json({ error: "Failed to compute eclipse visibility" });
    }
  });

  app.get("/api/panchang/:date", (req, res) => {
    try {
      const dateStr = req.params.date as string;
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }
      const timezone = (req.query.timezone as string) || "Asia/Kolkata";
      const panchang = getPanchangForDate(date, timezone);
      res.json(panchang);
    } catch (error) {
      res.status(400).json({ error: "Invalid date" });
    }
  });

  app.get("/api/calendar/:year/:month", (req, res) => {
    try {
      const year = parseInt(req.params.year as string);
      const month = parseInt(req.params.month as string);
      const timezone = (req.query.timezone as string) || "Asia/Kolkata";
      
      if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
        return res.status(400).json({ error: "Invalid year or month" });
      }
      
      const days = getCalendarDays(year, month, timezone) as CalendarDay[];
      const eclipsesByDate = getEclipsesForMonth(year, month, timezone);
      const localDateKey = (d: Date) =>
        new Intl.DateTimeFormat("en-CA", {
          timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
        }).format(d);
      
      days.forEach((day) => {
        day.festivals = getFestivalsForDate(day.date);
        day.templeEvents = getTempleEventsForDate(day.date);
        const dayEclipses = eclipsesByDate.get(localDateKey(day.date));
        if (dayEclipses?.length) {
          day.eclipses = dayEclipses.map((e) => ({
            type: e.type,
            kind: e.kind,
            peakLocal: e.peakLocal,
            nakshatra: e.nakshatra.name,
            nakshatraTelugu: e.nakshatra.nameTelugu,
          }));
        }
      });
      
      const festivals = getUpcomingFestivals(5);
      const templeEvents = getUpcomingTempleEvents(5);
      
      res.json({ days, festivals, templeEvents });
    } catch (error) {
      res.status(400).json({ error: "Failed to generate calendar" });
    }
  });

  app.get("/api/festivals/upcoming", (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const festivals = getUpcomingFestivals(limit);
    res.json(festivals);
  });

  app.get("/api/festivals/all", (_req, res) => {
    const all = getAllFestivals();
    res.json(all);
  });

  app.get("/api/temple-events/upcoming", (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const events = getUpcomingTempleEvents(limit);
    res.json(events);
  });

  // Agentic chat - public, but lightly rate-limited to bound token spend.
  const chatRateWindowMs = 60_000;
  const chatRateMax = 15; // requests per IP per window
  const chatHits = new Map<string, number[]>();

  const chatMessageSchema = z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(4000),
  });
  const chatRequestSchema = z.object({
    messages: z.array(chatMessageSchema).min(1).max(30),
    timezone: z.string().optional(),
    language: z.enum(["telugu", "english"]).optional(),
  });

  app.get("/api/chat/status", (_req, res) => {
    res.json({ enabled: isChatConfigured() });
  });

  app.post("/api/chat", async (req, res) => {
    if (!isChatConfigured()) {
      return res.status(503).json({
        error:
          "Chat is not configured. Set ANTHROPIC_API_KEY on the server.",
      });
    }

    // Simple sliding-window rate limit per client IP.
    const ip = req.ip || "unknown";
    const now = Date.now();
    const recent = (chatHits.get(ip) || []).filter(
      (t) => now - t < chatRateWindowMs,
    );
    if (recent.length >= chatRateMax) {
      return res
        .status(429)
        .json({ error: "Too many requests. Please slow down and try again." });
    }
    recent.push(now);
    chatHits.set(ip, recent);

    const parsed = chatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid request", details: parsed.error.errors });
    }

    const { messages, timezone, language } = parsed.data;
    try {
      const reply = await runChat(
        messages as ChatMessage[],
        timezone || "Asia/Kolkata",
        language || "english",
      );
      res.json({ reply });
    } catch (error) {
      // Log the raw error server-side, but never surface it verbatim to users.
      console.error("Chat error:", error);
      if (error instanceof ChatUnavailableError) {
        return res.status(503).json({
          error: "The assistant is temporarily unavailable. Please try again later.",
          code: "ai_unavailable",
          reason: error.reason,
        });
      }
      res.status(500).json({ error: "Failed to generate a response." });
    }
  });

  // Usage analytics - one beacon per client page view. The device id rides in
  // the body (navigator.sendBeacon can't set headers). Always answers 204 so a
  // storage hiccup never surfaces in the client console.
  const trackSchema = z.object({
    deviceId: z.string().regex(DEVICE_ID_RE),
    path: z.string().startsWith("/").max(200),
    language: z.enum(["telugu", "english"]).optional(),
    isPwa: z.boolean().default(false),
    timezone: z.string().max(64).optional(),
  });

  app.post("/api/track", async (req, res) => {
    res.status(204).end();
    const parsed = trackSchema.safeParse(req.body);
    if (!parsed.success) return;
    const { deviceId, ...info } = parsed.data;
    try {
      // Normalize dynamic segments so page_views stays a small table of page
      // *types*, not one row per festival slug per day.
      const path = info.path
        .replace(/^\/panchangam\/.+$/, "/panchangam/:date")
        .replace(/\/{2,}/g, "/");
      await storage.recordVisit(deviceId, { ...info, path });
    } catch (error) {
      console.error("Track error:", error);
    }
  });

  // Private usage dashboard data. Enabled only when STATS_KEY is set; the key
  // is checked with a constant-time comparison.
  app.get("/api/stats", async (req, res) => {
    const expected = process.env.STATS_KEY;
    if (!expected) return res.status(404).json({ error: "Not found" });
    const given = (req.query.key as string) || req.header("X-Stats-Key") || "";
    const a = Buffer.from(given);
    const b = Buffer.from(expected);
    const ok = a.length === b.length && timingSafeEqual(a, b);
    if (!ok) return res.status(404).json({ error: "Not found" });
    try {
      res.json(await storage.getUsageStats());
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ error: "Failed to compute stats" });
    }
  });

  // Notification routes - scoped to the calling device, no account needed

  app.get("/api/notifications/preferences", async (req, res) => {
    try {
      const deviceId = getDeviceId(req);
      if (!deviceId) {
        return res.status(400).json({ error: "Missing or invalid X-Device-Id header" });
      }
      const prefs = await storage.getNotificationPreferences(deviceId);
      if (prefs) {
        res.json(prefs);
      } else {
        res.json({
          enabled: false,
          notifyEkadashi: true,
          notifyChaturthi: true,
          notifyShashthi: true,
          notifyAshtami: true,
          notifyPurnima: true,
          notifyAmavasya: true,
          notifyTempleEvents: true,
          notifyTime: "06:00",
          timezone: "Asia/Kolkata",
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to get preferences" });
    }
  });

  app.post("/api/notifications/preferences", async (req, res) => {
    try {
      const deviceId = getDeviceId(req);
      if (!deviceId) {
        return res.status(400).json({ error: "Missing or invalid X-Device-Id header" });
      }

      const parsed = notificationPreferenceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid preferences", details: parsed.error.errors });
      }
      
      const updated = await storage.saveNotificationPreferences({
        deviceId,
        ...parsed.data,
      });
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to save preferences" });
    }
  });

  // Push notification endpoints
  app.get("/api/push/vapid-public-key", (req, res) => {
    res.json({ publicKey: getVapidPublicKey() });
  });

  const pushSubscriptionSchema = z.object({
    endpoint: z.string(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  });

  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const deviceId = getDeviceId(req);
      if (!deviceId) {
        return res.status(400).json({ error: "Missing or invalid X-Device-Id header" });
      }

      const parsed = pushSubscriptionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid subscription", details: parsed.error.errors });
      }

      const subscription = await storage.savePushSubscription({
        deviceId,
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
      });

      res.json({ success: true, id: subscription.id });
    } catch (error) {
      console.error("Push subscribe error:", error);
      res.status(500).json({ error: "Failed to save subscription" });
    }
  });

  app.post("/api/push/unsubscribe", async (req, res) => {
    try {
      const deviceId = getDeviceId(req);
      if (!deviceId) {
        return res.status(400).json({ error: "Missing or invalid X-Device-Id header" });
      }

      const { endpoint } = req.body;
      if (!endpoint) {
        return res.status(400).json({ error: "Endpoint required" });
      }

      await storage.deletePushSubscriptionForDevice(deviceId, endpoint);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });

  app.post("/api/push/test", async (req, res) => {
    try {
      const deviceId = getDeviceId(req);
      if (!deviceId) {
        return res.status(400).json({ error: "Missing or invalid X-Device-Id header" });
      }

      const sentCount = await sendNotificationToDevice(deviceId, {
        title: "🙏 తెలుగు పంచాంగం - Test",
        body: "This is a test notification. If you see this, push notifications are working!",
        icon: "/icon-192.png",
        tag: "test-notification",
        data: { url: "/" }
      });

      if (sentCount > 0) {
        res.json({ success: true, message: `Test notification sent to ${sentCount} device(s)` });
      } else {
        res.json({ success: false, message: "No active subscriptions found. Please enable notifications first." });
      }
    } catch (error) {
      console.error("Test notification error:", error);
      res.status(500).json({ error: "Failed to send test notification" });
    }
  });

  // Start the notification scheduler
  startNotificationScheduler();

  return httpServer;
}
