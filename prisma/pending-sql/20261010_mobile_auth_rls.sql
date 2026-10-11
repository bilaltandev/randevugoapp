-- Run AFTER the tables exist (after 20261010_mobile_auth.sql or prisma db push). Idempotent.

-- ---------------------------------------------------------------------------
-- Supabase hardening (hand-written). These tables hold refresh-token hashes and
-- rate-limit counters and must never be reachable through the Supabase Data API.
-- RLS with no policies denies anon/authenticated; the REVOKE is a second layer.
-- Prisma connects as the table owner (postgres), which bypasses non-forced RLS,
-- so the backend keeps working. Do NOT add FORCE ROW LEVEL SECURITY.
-- ---------------------------------------------------------------------------
ALTER TABLE "MobileSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuthRateLimit" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "MobileSession" FROM anon, authenticated;
REVOKE ALL ON TABLE "AuthRateLimit" FROM anon, authenticated;
