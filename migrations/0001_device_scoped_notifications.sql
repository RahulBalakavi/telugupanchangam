-- Drop Replit Auth and re-key notifications from user id to device id.
--
-- Run this ONCE against the new (Neon) database, after restoring the dump from
-- Replit and before the new deployment takes traffic:
--
--   psql "$DATABASE_URL" -f migrations/0001_device_scoped_notifications.sql
--
-- Existing push subscriptions are preserved: their old user id becomes the
-- device id, so already-subscribed browsers keep receiving notifications until
-- they next open the app, at which point the client's own device id takes over
-- (the upsert in savePushSubscription keys on the endpoint, so no duplicates).

BEGIN;

-- push_subscriptions: user_id -> device_id, no FK to users
ALTER TABLE push_subscriptions
  DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_users_id_fk;
ALTER TABLE push_subscriptions
  RENAME COLUMN user_id TO device_id;

-- notification_preferences: user_id -> device_id, keep the uniqueness
ALTER TABLE notification_preferences
  DROP CONSTRAINT IF EXISTS notification_preferences_user_id_users_id_fk;
ALTER TABLE notification_preferences
  RENAME COLUMN user_id TO device_id;

-- The unique index follows the rename automatically, but its name doesn't.
ALTER INDEX IF EXISTS notification_preferences_user_id_unique
  RENAME TO notification_preferences_device_id_unique;

-- Replit Auth tables are dead once the OIDC integration is gone.
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

COMMIT;
