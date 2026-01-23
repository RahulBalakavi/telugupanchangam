import { 
  users, 
  pushSubscriptions,
  notificationPreferences,
  type User, 
  type UpsertUser,
  type PushSubscription,
  type InsertPushSubscription,
  type NotificationPreferenceDB,
  type InsertNotificationPreferenceDB
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Push subscriptions
  savePushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription>;
  getPushSubscriptionsByUserId(userId: string): Promise<PushSubscription[]>;
  deletePushSubscription(endpoint: string): Promise<void>;
  getAllPushSubscriptions(): Promise<PushSubscription[]>;
  
  // Notification preferences
  getNotificationPreferences(userId: string): Promise<NotificationPreferenceDB | undefined>;
  saveNotificationPreferences(prefs: InsertNotificationPreferenceDB): Promise<NotificationPreferenceDB>;
  getAllNotificationPreferences(): Promise<NotificationPreferenceDB[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async savePushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription> {
    const [result] = await db
      .insert(pushSubscriptions)
      .values(subscription)
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          userId: subscription.userId,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      })
      .returning();
    return result;
  }

  async getPushSubscriptionsByUserId(userId: string): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }

  async getAllPushSubscriptions(): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions);
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreferenceDB | undefined> {
    const [prefs] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId));
    return prefs || undefined;
  }

  async saveNotificationPreferences(prefs: InsertNotificationPreferenceDB): Promise<NotificationPreferenceDB> {
    const [result] = await db
      .insert(notificationPreferences)
      .values(prefs)
      .onConflictDoUpdate({
        target: notificationPreferences.userId,
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
