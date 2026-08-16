import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

// Privacy-preserving usage analytics. No accounts, no cookies, no third
// parties: the client fires one beacon per page view carrying the same opaque
// device id used for notifications (see client/src/lib/device-id.ts).
//
// Storage is deliberately aggregate-shaped so it stays tiny forever:
// one row per device per UTC day, plus one row per path per UTC day.

// One row per (device, day). DAU = count of rows for a day; WAU/MAU = distinct
// device_id over the trailing window.
export const dailyVisits = pgTable(
  "daily_visits",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    deviceId: varchar("device_id").notNull(),
    // UTC calendar date, YYYY-MM-DD. UTC keeps the day boundary consistent
    // across a userbase split between India and the US.
    day: varchar("day", { length: 10 }).notNull(),
    visits: integer("visits").notNull().default(1),
    // Last-seen values for the day; good enough for share-of-users splits.
    language: varchar("language", { length: 16 }),
    isPwa: boolean("is_pwa").notNull().default(false),
    timezone: varchar("timezone", { length: 64 }),
    firstPath: varchar("first_path", { length: 200 }),
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("daily_visits_device_day").on(t.deviceId, t.day)],
);

// One row per (day, path) with a view counter, for "top pages".
export const pageViews = pgTable(
  "page_views",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    day: varchar("day", { length: 10 }).notNull(),
    path: varchar("path", { length: 200 }).notNull(),
    views: integer("views").notNull().default(1),
  },
  (t) => [uniqueIndex("page_views_day_path").on(t.day, t.path)],
);

export type DailyVisit = typeof dailyVisits.$inferSelect;
export type PageView = typeof pageViews.$inferSelect;
