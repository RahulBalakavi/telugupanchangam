import express, { type Express } from "express";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { prayerPageViews } from "../shared/models/prayer-views";
import { VRATHAMS } from "../client/src/lib/vrathams";

const endpoint = "/api/vrathams/:slug/views";
const slugs = new Set(VRATHAMS.map(prayer => prayer.slug));
const viewSchema = z.object({ viewId: z.string().uuid() }).strict();

async function totalViews(slug: string): Promise<number> {
  const [row] = await db.select({ views: sql<number>`count(*)::int` })
    .from(prayerPageViews).where(eq(prayerPageViews.slug, slug));
  return row.views;
}

export async function registerPrayerViews(app: Express): Promise<void> {
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS prayer_page_views (
      view_id uuid PRIMARY KEY,
      slug varchar(64) NOT NULL,
      viewed_at timestamptz NOT NULL DEFAULT now()
    )`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS prayer_page_views_slug ON prayer_page_views (slug)`);
  } catch (error) {
    // Optional social proof must not prevent prayer pages from opening.
    console.error("Could not initialize prayer page views:", error);
  }

  app.use(endpoint, (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    if (!slugs.has(req.params.slug)) {
      res.status(404).json({ error: "Prayer not found" });
      return;
    }
    const origin = req.header("Origin");
    if (origin && !["https://mytelugupanchangam.space", "https://www.mytelugupanchangam.space"].includes(origin)) {
      res.status(403).json({ error: "Origin not allowed" });
      return;
    }
    next();
  });

  app.get(endpoint, async (req, res) => {
    try {
      res.json({ views: await totalViews(req.params.slug) });
    } catch (error) {
      console.error("Prayer page views unavailable:", error);
      res.status(503).json({ error: "View count temporarily unavailable" });
    }
  });

  app.post(endpoint, express.json({ limit: "1kb" }), async (req, res) => {
    const parsed = viewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "A valid view ID is required" });
      return;
    }
    try {
      await db.insert(prayerPageViews).values({ viewId: parsed.data.viewId, slug: req.params.slug }).onConflictDoNothing();
      res.json({ views: await totalViews(req.params.slug) });
    } catch (error) {
      console.error("Could not record prayer page view:", error);
      res.status(503).json({ error: "View count temporarily unavailable" });
    }
  });
}
