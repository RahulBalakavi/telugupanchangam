import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import {
  getPanchangForDate,
  getCalendarDays,
} from "./panchang";
import {
  getUpcomingFestivals,
  getFestivalsForDate,
  getUpcomingTempleEvents,
  getTempleEventsForDate,
} from "./data";
import { notificationPreferenceSchema } from "@shared/schema";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { storage } from "./storage";
import { getVapidPublicKey, startNotificationScheduler } from "./push-service";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  app.get("/api/panchang/today", isAuthenticated, (req, res) => {
    const today = new Date();
    const timezone = (req.query.timezone as string) || "Asia/Kolkata";
    const panchang = getPanchangForDate(today, timezone);
    res.json(panchang);
  });

  app.get("/api/panchang/:date", isAuthenticated, (req, res) => {
    try {
      const date = new Date(req.params.date as string);
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

  app.get("/api/calendar/:year/:month", isAuthenticated, (req, res) => {
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

  app.get("/api/festivals/upcoming", isAuthenticated, (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const festivals = getUpcomingFestivals(limit);
    res.json(festivals);
  });

  app.get("/api/temple-events/upcoming", isAuthenticated, (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const events = getUpcomingTempleEvents(limit);
    res.json(events);
  });

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

  // Start the notification scheduler
  startNotificationScheduler();

  return httpServer;
}
