import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Push subscription storage for web push notifications
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  endpoint: varchar("endpoint").notNull().unique(),
  p256dh: varchar("p256dh").notNull(),
  auth: varchar("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification preferences per user
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").default(true),
  notifyEkadashi: boolean("notify_ekadashi").default(true),
  notifyChaturthi: boolean("notify_chaturthi").default(true),
  notifyShashthi: boolean("notify_shashthi").default(true),
  notifyAshtami: boolean("notify_ashtami").default(true),
  notifyPurnima: boolean("notify_purnima").default(true),
  notifyAmavasya: boolean("notify_amavasya").default(true),
  notifyTempleEvents: boolean("notify_temple_events").default(true),
  notifyTime: varchar("notify_time").default("06:00"),
  timezone: varchar("timezone").default("Asia/Kolkata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

export type NotificationPreferenceDB = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferenceDB = typeof notificationPreferences.$inferInsert;
