import { sql } from "drizzle-orm";
import { boolean, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// The app has no accounts. Notification state is scoped to a *device*: the
// client mints a random id once and keeps it in localStorage (see
// client/src/lib/device-id.ts), then sends it as the X-Device-Id header.
//
// Keyed on that id rather than on the push endpoint, because browsers rotate
// push endpoints; the device id survives rotation, so saved preferences do too.

// Web push subscription for one browser/device.
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id").notNull(),
  endpoint: varchar("endpoint").notNull().unique(),
  p256dh: varchar("p256dh").notNull(),
  auth: varchar("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification preferences per device.
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id").notNull().unique(),
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

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

export type NotificationPreferenceDB = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferenceDB = typeof notificationPreferences.$inferInsert;
