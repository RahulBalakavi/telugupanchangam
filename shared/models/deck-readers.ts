import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// One anonymous browser that chose Start, independent of calendar visit analytics.
export const durgaDeckReaders = pgTable("durga_deck_readers", {
  readerHash: varchar("reader_hash", { length: 64 }).primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
});
