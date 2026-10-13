-- Run AFTER 20261013_team_plans.sql. Idempotent. Same hardening as 20261010_mobile_auth_rls.sql:
-- invite token hashes must never be reachable through the Supabase Data API. RLS with no policies denies
-- anon/authenticated; Prisma connects as the table owner and is unaffected. Do NOT add FORCE ROW LEVEL SECURITY.
ALTER TABLE "TeamInvite" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "TeamInvite" FROM anon, authenticated;
