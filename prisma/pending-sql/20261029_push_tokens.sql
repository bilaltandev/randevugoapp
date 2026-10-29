-- Push notifications for new bookings: each mobile session can hold its device's Expo push token.
-- Additive only (one nullable column). Apply TEST first; never to production without approval.
-- "MobileSession" already has RLS on and no Data API access (20261010_mobile_auth_rls.sql); nothing else needed.

-- AlterTable
ALTER TABLE "MobileSession" ADD COLUMN IF NOT EXISTS "pushToken" TEXT;
