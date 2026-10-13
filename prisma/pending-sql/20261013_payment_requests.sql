-- Bank transfer (havale/EFT) payment requests on Subscription. Additive only, nullable columns.
-- Apply after 20261013_team_codes.sql, TEST first; never to production without approval.
-- Subscription already has RLS enabled with no policies (20261010_lockdown_data_api.sql).

ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "paymentRequestedAt" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "pendingAmount" DOUBLE PRECISION;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "pendingCouponCode" TEXT;
