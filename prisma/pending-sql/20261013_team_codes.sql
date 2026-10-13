-- Team invite codes and member limit. Generated offline with prisma migrate diff (schema before → after).
-- Additive only. Apply after 20261013_team_plans.sql, TEST first; never to production without approval.

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "memberLimit" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "TeamInvite" ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'LINK',
ALTER COLUMN "employeeId" DROP NOT NULL;

