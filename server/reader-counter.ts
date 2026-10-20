import { createHash } from "node:crypto";
import express, { type Express } from "express";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { durgaDeckReaders } from "../shared/models/deck-readers";

const endpoint = "/api/decks/durga-saptashati/readers";
const allowedOrigins = new Set([
  "https://rahulbalakavi.github.io",
  "https://mytelugupanchangam.space",
  "https://www.mytelugupanchangam.space",
]);
const readerSchema = z.object({ readerId: z.string().uuid() }).strict();

async function readerTotal(): Promise<number> {
  const [row] = await db.select({ readers: sql<number>`count(*)::int` }).from(durgaDeckReaders);
  return row.readers;
}

export async function registerReaderCounter(app: Express): Promise<void> {
  // Additive bootstrap for this independently hosted deck; never alters other tables.
  // Including the table in the shared schema also keeps future db:push runs aware of it.
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS durga_deck_readers (
      reader_hash varchar(64) PRIMARY KEY,
      started_at timestamptz NOT NULL DEFAULT now()
    )`);
  } catch (error) {
    // Counting is optional; its routes return 503 if unavailable, while the calendar stays usable.
    console.error("Could not initialize the deck reader counter:", error);
  }

  app.use(endpoint, (req, res, next) => {
    const origin = req.header("Origin");
    res.vary("Origin");
    if (origin && !allowedOrigins.has(origin)) {
      res.status(403).json({ error: "Origin not allowed" });
      return;
    }
    if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get(endpoint, async (_req, res) => {
    try {
      res.setHeader("Cache-Control", "public, max-age=30");
      res.json({ readers: await readerTotal() });
    } catch (error) {
      console.error("Reader count unavailable:", error);
      res.setHeader("Cache-Control", "no-store");
      res.status(503).json({ error: "Reader count temporarily unavailable" });
    }
  });

  app.post(endpoint, express.json({ limit: "1kb" }), async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const parsed = readerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "A valid reader ID is required" });
      return;
    }
    try {
      const readerHash = createHash("sha256")
        .update("durga-saptashati:" + parsed.data.readerId.toLowerCase())
        .digest("hex");
      await db.insert(durgaDeckReaders).values({ readerHash }).onConflictDoNothing();
      res.json({ readers: await readerTotal() });
    } catch (error) {
      console.error("Could not count reader:", error);
      res.status(503).json({ error: "Reader count temporarily unavailable" });
    }
  });
}
