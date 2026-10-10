-- Supabase Data API lockdown for RandevuGo (all tables in schema "public").
--
-- Why: every public table had RLS disabled and full SELECT/INSERT/UPDATE/DELETE granted to the
-- Supabase API roles "anon" and "authenticated", so anyone holding the anon key could read and
-- modify all data through /rest/v1. The app never uses the Data API: it connects with Prisma as
-- "postgres", the owner of every table, which has BYPASSRLS. Nothing here affects that role.
--
-- What it does (single transaction, idempotent):
--   1. ENABLE (not FORCE) row level security on every public table, with no policies.
--   2. REVOKE all table and sequence privileges from anon and authenticated.
--   3. Stop future tables/sequences/functions created by postgres (e.g. prisma db push) from
--      being granted to anon/authenticated automatically.
--   4. Verify; any check failing raises an exception and rolls the whole thing back.
--
-- Not touched: service_role, postgres, the auth/storage schemas, Supabase settings.
-- Rollback: 20261010_lockdown_data_api_rollback.sql

BEGIN;

-- ENABLE RLS takes a brief ACCESS EXCLUSIVE lock per table. Never queue behind a long query on the
-- live site: if a lock isn't granted within 5s the whole transaction fails and nothing changes.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT c.relname FROM pg_class c
           WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r', 'p')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.relname);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t.relname);
  END LOOP;
END $$;

REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- Verification: abort (and roll back everything above) if anything is still exposed.
DO $$
DECLARE
  open_tables int;
  no_rls int;
  forced int;
BEGIN
  SELECT count(*) INTO no_rls FROM pg_class c
   WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r', 'p') AND NOT c.relrowsecurity;
  SELECT count(*) INTO forced FROM pg_class c
   WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r', 'p') AND c.relforcerowsecurity;
  SELECT count(*) INTO open_tables FROM pg_class c
   WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r', 'p')
     AND (has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE')
       OR has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE'));
  IF no_rls > 0 OR forced > 0 OR open_tables > 0 THEN
    RAISE EXCEPTION 'lockdown verification failed: no_rls=%, forced=%, still_granted=%', no_rls, forced, open_tables;
  END IF;
  -- The backend role must still be able to bypass RLS, otherwise the app would lose its data.
  IF NOT (SELECT rolbypassrls FROM pg_roles WHERE rolname = 'postgres') THEN
    RAISE EXCEPTION 'lockdown verification failed: postgres no longer bypasses RLS';
  END IF;
END $$;

COMMIT;
