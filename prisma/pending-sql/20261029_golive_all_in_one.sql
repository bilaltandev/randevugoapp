-- PRODUCTION go-live 2026-10-29: the six 20261013_*.sql files in order, in ONE transaction.
-- If any statement fails, nothing is applied (the transaction rolls back). Paste all of it into the Supabase
-- SQL editor of the production project (mfarghtdnstdedecvmqg) and Run once. Then deploy the code right away.
-- Impact checked first: 17 businesses, 0 without a Subscription row, 6 expired (they get 3 trial days).

BEGIN;

-- ======================== 20261013_team_plans.sql ========================
-- Person/Team plans and team invites. Table/index/FK section generated offline with:
--   prisma migrate diff --from-schema-datamodel <schema before> --to-schema-datamodel prisma/schema.prisma --script
-- Additive only (plus the plan backfill at the end). Apply to the TEST Supabase project first;
-- never to production without approval. Then run 20261013_team_plans_rls.sql.

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'PERSON';

-- CreateTable
CREATE TABLE "TeamInvite" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "TeamInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvite_tokenHash_key" ON "TeamInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "TeamInvite_businessId_idx" ON "TeamInvite"("businessId");

-- CreateIndex
CREATE INDEX "TeamInvite_employeeId_idx" ON "TeamInvite"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Backfill (hand-written): existing businesses get a plan by staff count, as decided on 2026-10-13:
-- one employee or none → PERSON (the column default), more than one → TEAM at the Team price.
-- Monthly prices an admin set by hand are kept for PERSON businesses.
UPDATE "Subscription" s
SET "plan" = 'TEAM', "monthlyPrice" = 149
WHERE (SELECT count(*) FROM "Employee" e WHERE e."businessId" = s."businessId") > 1;

-- ======================== 20261013_team_plans_rls.sql ========================
-- Run AFTER 20261013_team_plans.sql. Idempotent. Same hardening as 20261010_mobile_auth_rls.sql:
-- invite token hashes must never be reachable through the Supabase Data API. RLS with no policies denies
-- anon/authenticated; Prisma connects as the table owner and is unaffected. Do NOT add FORCE ROW LEVEL SECURITY.
ALTER TABLE "TeamInvite" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "TeamInvite" FROM anon, authenticated;

-- ======================== 20261013_team_codes.sql ========================
-- Team invite codes and member limit. Generated offline with prisma migrate diff (schema before → after).
-- Additive only. Apply after 20261013_team_plans.sql, TEST first; never to production without approval.

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "memberLimit" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "TeamInvite" ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'LINK',
ALTER COLUMN "employeeId" DROP NOT NULL;

-- ======================== 20261013_payment_requests.sql ========================
-- Bank transfer (havale/EFT) payment requests on Subscription. Additive only, nullable columns.
-- Apply after 20261013_team_codes.sql, TEST first; never to production without approval.
-- Subscription already has RLS enabled with no policies (20261010_lockdown_data_api.sql).

ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "paymentRequestedAt" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "pendingAmount" DOUBLE PRECISION;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "pendingCouponCode" TEXT;

-- ======================== 20261013_usd_billing_periods.sql ========================
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

-- ======================== 20261013_lock_grace.sql ========================
-- One-off, production rollout of the subscription lock (user decision 2026-10-13): businesses whose trial or
-- paid period had already ended get 3 more trial days from now, so nobody is closed without warning.
-- Run once, right after 20261013_usd_billing_periods.sql. Rows still inside a trial/paid period are untouched.
UPDATE "Subscription"
SET "status" = 'trial', "trialEndDate" = now() + interval '3 days'
WHERE NOT (
  ("status" = 'active' AND ("subscriptionEndDate" IS NULL OR "subscriptionEndDate" > now()))
  OR ("status" = 'trial' AND "trialEndDate" > now())
);

COMMIT;

-- Check (read-only): plans, member limits, and that nobody is locked right now.
SELECT "plan", count(*) AS isletme, min("memberLimit") AS uye_siniri, count(*) FILTER (WHERE NOT (("status" = 'active' AND ("subscriptionEndDate" IS NULL OR "subscriptionEndDate" > now())) OR ("status" = 'trial' AND "trialEndDate" > now()))) AS kilitli FROM "Subscription" GROUP BY "plan";
