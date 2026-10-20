import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

// One anonymous event per prayer-page opening; retries reuse the same event ID.
export const prayerPageViews = pgTable("prayer_page_views", {
  viewId: uuid("view_id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull(),
  viewedAt: timestamp("viewed_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [index("prayer_page_views_slug").on(table.slug)]);
