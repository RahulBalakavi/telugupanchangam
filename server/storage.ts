import {
  pushSubscriptions,
  notificationPreferences,
  type PushSubscription,
  type InsertPushSubscription,
  type NotificationPreferenceDB,
  type InsertNotificationPreferenceDB
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
