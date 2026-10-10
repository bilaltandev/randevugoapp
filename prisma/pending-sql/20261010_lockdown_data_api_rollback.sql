-- ROLLBACK for 20261010_lockdown_data_api.sql.
--
-- WARNING: this re-opens every public table to the Supabase Data API (anon/authenticated), i.e.
-- the original critical exposure. Use it only if the app itself breaks after the lockdown, and
-- only together with the Data API disabled in the Supabase dashboard (Settings → API).
-- The app does not need the Data API, so a rollback should never be required for it to work.
--
-- Restores the pre-lockdown state observed in the 2026-10-10 audit:
--   RLS disabled on all public tables, ALL privileges granted to anon and authenticated,
--   default privileges for new objects created by postgres granted to anon and authenticated.
-- MobileSession and AuthRateLimit are deliberately kept locked (they never were open).

BEGIN;

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT c.relname FROM pg_class c
           WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r', 'p')
             AND c.relname NOT IN ('MobileSession', 'AuthRateLimit')
  LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t.relname);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO anon, authenticated', t.relname);
  END LOOP;
END $$;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;

COMMIT;
