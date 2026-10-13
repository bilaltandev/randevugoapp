-- USD prices with monthly/yearly billing. Apply after 20261013_payment_requests.sql, TEST first;
-- never to production without approval. Additive columns + a one-off price reset (user decision
-- 2026-10-13: every business moves to the new dollar list price, custom TL prices included).

ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "billingPeriod" TEXT NOT NULL DEFAULT 'MONTHLY';
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "pendingAmountTry" DOUBLE PRECISION;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "pendingRate" DOUBLE PRECISION;
ALTER TABLE "Subscription" ALTER COLUMN "monthlyPrice" SET DEFAULT 1.49;

-- TL list/custom prices → USD monthly list price of the plan (plan column from 20261013_team_plans.sql).
UPDATE "Subscription"
SET "monthlyPrice" = CASE WHEN "plan" = 'TEAM' THEN 2.49 ELSE 1.49 END,
    "billingPeriod" = 'MONTHLY'
WHERE "monthlyPrice" > 5;

-- Open bank transfer requests were quoted in TL: drop them so owners request again in USD.
UPDATE "Subscription"
SET "paymentStatus" = 'failed', "paymentRequestedAt" = NULL, "pendingAmount" = NULL, "pendingCouponCode" = NULL
WHERE "paymentStatus" = 'pending' AND "paymentRequestedAt" IS NOT NULL;
