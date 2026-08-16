import {
  pushSubscriptions,
  notificationPreferences,
  dailyVisits,
  pageViews,
  type PushSubscription,
  type InsertPushSubscription,
  type NotificationPreferenceDB,
  type InsertNotificationPreferenceDB
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

export interface VisitInfo {
  path: string;
  language?: string;
  isPwa: boolean;
  timezone?: string;
}

export interface UsageStats {
  today: string;
  dau: number;
  wau: number;
  mau: number;
  totalDevicesEver: number;
  dailyCounts: { day: string; devices: number; visits: number }[];
  pwaDevices7d: number;
  languages7d: { language: string; devices: number }[];
  topPages7d: { path: string; views: number }[];
}

export interface IStorage {
  // Push subscriptions
  savePushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription>;
  getPushSubscriptionsByDeviceId(deviceId: string): Promise<PushSubscription[]>;
  deletePushSubscription(endpoint: string): Promise<void>;
  deletePushSubscriptionForDevice(deviceId: string, endpoint: string): Promise<void>;
  getAllPushSubscriptions(): Promise<PushSubscription[]>;

  // Notification preferences
  getNotificationPreferences(deviceId: string): Promise<NotificationPreferenceDB | undefined>;
  saveNotificationPreferences(prefs: InsertNotificationPreferenceDB): Promise<NotificationPreferenceDB>;
  getAllNotificationPreferences(): Promise<NotificationPreferenceDB[]>;

  // Usage analytics
  recordVisit(deviceId: string, info: VisitInfo): Promise<void>;
  getUsageStats(): Promise<UsageStats>;
}

/** UTC calendar date as YYYY-MM-DD, optionally shifted back by whole days. */
function utcDay(daysAgo = 0): string {
  return new Date(Date.now() - daysAgo * 86400_000).toISOString().slice(0, 10);
}

export class DatabaseStorage implements IStorage {
  async savePushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription> {
    const [result] = await db
      .insert(pushSubscriptions)
      .values(subscription)
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          deviceId: subscription.deviceId,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      })
      .returning();
    return result;
  }

  async getPushSubscriptionsByDeviceId(deviceId: string): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.deviceId, deviceId));
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }

  async deletePushSubscriptionForDevice(deviceId: string, endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(
      and(eq(pushSubscriptions.deviceId, deviceId), eq(pushSubscriptions.endpoint, endpoint))
    );
  }

  async getAllPushSubscriptions(): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions);
  }

  async getNotificationPreferences(deviceId: string): Promise<NotificationPreferenceDB | undefined> {
    const [prefs] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.deviceId, deviceId));
    return prefs || undefined;
  }

  async saveNotificationPreferences(prefs: InsertNotificationPreferenceDB): Promise<NotificationPreferenceDB> {
    const [result] = await db
      .insert(notificationPreferences)
      .values(prefs)
      .onConflictDoUpdate({
        target: notificationPreferences.deviceId,
        set: {
          ...prefs,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getAllNotificationPreferences(): Promise<NotificationPreferenceDB[]> {
    return db.select().from(notificationPreferences);
  }

  async recordVisit(deviceId: string, info: VisitInfo): Promise<void> {
    const day = utcDay();
    await db
      .insert(dailyVisits)
      .values({
        deviceId,
        day,
        language: info.language,
        isPwa: info.isPwa,
        timezone: info.timezone,
        firstPath: info.path,
      })
      .onConflictDoUpdate({
        target: [dailyVisits.deviceId, dailyVisits.day],
        set: {
          visits: sql`${dailyVisits.visits} + 1`,
          language: info.language ?? sql`${dailyVisits.language}`,
          isPwa: info.isPwa,
          timezone: info.timezone ?? sql`${dailyVisits.timezone}`,
          lastSeenAt: new Date(),
        },
      });
    await db
      .insert(pageViews)
      .values({ day, path: info.path })
      .onConflictDoUpdate({
        target: [pageViews.day, pageViews.path],
        set: { views: sql`${pageViews.views} + 1` },
      });
  }

  async getUsageStats(): Promise<UsageStats> {
    const today = utcDay();
    const day7 = utcDay(6);
    const day30 = utcDay(29);

    const [dailyCounts, [windows], languages7d, topPages7d] = await Promise.all([
      db
        .select({
          day: dailyVisits.day,
          devices: sql<number>`count(*)::int`,
          visits: sql<number>`sum(${dailyVisits.visits})::int`,
        })
        .from(dailyVisits)
        .where(sql`${dailyVisits.day} >= ${day30}`)
        .groupBy(dailyVisits.day)
        .orderBy(dailyVisits.day),
      db
        .select({
          dau: sql<number>`count(distinct ${dailyVisits.deviceId}) filter (where ${dailyVisits.day} = ${today})::int`,
          wau: sql<number>`count(distinct ${dailyVisits.deviceId}) filter (where ${dailyVisits.day} >= ${day7})::int`,
          mau: sql<number>`count(distinct ${dailyVisits.deviceId})::int`,
          pwaDevices7d: sql<number>`count(distinct ${dailyVisits.deviceId}) filter (where ${dailyVisits.day} >= ${day7} and ${dailyVisits.isPwa})::int`,
        })
        .from(dailyVisits)
        .where(sql`${dailyVisits.day} >= ${day30}`),
      db
        .select({
          language: sql<string>`coalesce(${dailyVisits.language}, 'unknown')`,
          devices: sql<number>`count(distinct ${dailyVisits.deviceId})::int`,
        })
        .from(dailyVisits)
        .where(sql`${dailyVisits.day} >= ${day7}`)
        .groupBy(sql`coalesce(${dailyVisits.language}, 'unknown')`),
      db
        .select({
          path: pageViews.path,
          views: sql<number>`sum(${pageViews.views})::int`,
        })
        .from(pageViews)
        .where(sql`${pageViews.day} >= ${day7}`)
        .groupBy(pageViews.path)
        .orderBy(sql`sum(${pageViews.views}) desc`)
        .limit(15),
    ]);

    const [{ totalDevicesEver }] = await db
      .select({ totalDevicesEver: sql<number>`count(distinct ${dailyVisits.deviceId})::int` })
      .from(dailyVisits);

    return {
      today,
      dau: windows?.dau ?? 0,
      wau: windows?.wau ?? 0,
      mau: windows?.mau ?? 0,
      totalDevicesEver,
      dailyCounts,
      pwaDevices7d: windows?.pwaDevices7d ?? 0,
      languages7d,
      topPages7d,
    };
  }
}

export const storage = new DatabaseStorage();
