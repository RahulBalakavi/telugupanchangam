import type { Express } from "express";
import { createServer, type Server } from "http";
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
import { notificationPreferenceSchema } from "@shared/schema";
import { runChat, isChatConfigured, type ChatMessage } from "./chat";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { storage } from "./storage";
import { getVapidPublicKey, startNotificationScheduler, sendNotificationToUser } from "./push-service";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  // Public API routes - no authentication required
  app.get("/api/panchang/today", (req, res) => {
    const timezone = (req.query.timezone as string) || "Asia/Kolkata";
    const today = getTodayInTimezone(timezone);
    const panchang = getPanchangForDate(today, timezone);
    res.json(panchang);
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
      
      const days = getCalendarDays(year, month, timezone);
      
      days.forEach((day) => {
        day.festivals = getFestivalsForDate(day.date);
        day.templeEvents = getTempleEventsForDate(day.date);
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
          "Chat is not configured. Set ANTHROPIC_API_KEY on the server to enable it.",
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
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to generate a response." });
    }
  });

  // Protected API routes - authentication required for notifications

  app.get("/api/notifications/preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as { id: string })?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const prefs = await storage.getNotificationPreferences(userId);
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

  app.post("/api/notifications/preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as { id: string })?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const parsed = notificationPreferenceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid preferences", details: parsed.error.errors });
      }
      
      const updated = await storage.saveNotificationPreferences({
        userId,
        ...parsed.data,
      });
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to save preferences" });
    }
  });

  // Push notification endpoints
  app.get("/api/push/vapid-public-key", isAuthenticated, (req, res) => {
    res.json({ publicKey: getVapidPublicKey() });
  });

  const pushSubscriptionSchema = z.object({
    endpoint: z.string(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  });

  app.post("/api/push/subscribe", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as { id: string })?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const parsed = pushSubscriptionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid subscription", details: parsed.error.errors });
      }

      const subscription = await storage.savePushSubscription({
        userId,
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

  app.post("/api/push/unsubscribe", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as { id: string })?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const { endpoint } = req.body;
      if (!endpoint) {
        return res.status(400).json({ error: "Endpoint required" });
      }

      await storage.deletePushSubscriptionForUser(userId, endpoint);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });

  app.post("/api/push/test", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as { id: string })?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const sentCount = await sendNotificationToUser(userId, {
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
