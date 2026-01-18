import type { Express } from "express";
import { createServer, type Server } from "http";
import {
  getPanchangForDate,
  getCalendarDays,
} from "./panchang";
import {
  getUpcomingFestivals,
  getFestivalsForDate,
  getUpcomingTempleEvents,
  getTempleEventsForDate,
  getNotificationPreferences,
  setNotificationPreferences,
} from "./data";
import { notificationPreferenceSchema } from "@shared/schema";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  app.get("/api/panchang/today", isAuthenticated, (req, res) => {
    const today = new Date();
    const panchang = getPanchangForDate(today);
    res.json(panchang);
  });

  app.get("/api/panchang/:date", isAuthenticated, (req, res) => {
    try {
      const date = new Date(req.params.date as string);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }
      const panchang = getPanchangForDate(date);
      res.json(panchang);
    } catch (error) {
      res.status(400).json({ error: "Invalid date" });
    }
  });

  app.get("/api/calendar/:year/:month", isAuthenticated, (req, res) => {
    try {
      const year = parseInt(req.params.year as string);
      const month = parseInt(req.params.month as string);
      
      if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
        return res.status(400).json({ error: "Invalid year or month" });
      }
      
      const days = getCalendarDays(year, month);
      
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

  app.get("/api/notifications/preferences", isAuthenticated, (req, res) => {
    const prefs = getNotificationPreferences();
    res.json(prefs);
  });

  app.post("/api/notifications/preferences", isAuthenticated, (req, res) => {
    try {
      const parsed = notificationPreferenceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid preferences", details: parsed.error.errors });
      }
      
      const updated = setNotificationPreferences(parsed.data);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to save preferences" });
    }
  });

  return httpServer;
}
