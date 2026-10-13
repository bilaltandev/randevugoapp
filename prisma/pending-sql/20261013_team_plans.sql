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
