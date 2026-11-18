-- =============================================================================
-- Forge Athletic — Tier 5 PostgreSQL SECURITY DEFINER search_path Hardening (#56)
-- =============================================================================
-- Pins `search_path = public` on `sync_client_personal_record()` and
-- `increment_referral_code_clicks(text)` and restricts `increment_referral_code_clicks`
-- execution strictly to `service_role`. Safe and idempotent to run in Supabase SQL Editor.

DO $$
BEGIN
  IF to_regprocedure('public.sync_client_personal_record()') IS NOT NULL THEN
    ALTER FUNCTION public.sync_client_personal_record() SET search_path = public;
  END IF;

  IF to_regprocedure('public.increment_referral_code_clicks(text)') IS NOT NULL THEN
    ALTER FUNCTION public.increment_referral_code_clicks(text) SET search_path = public;
    REVOKE ALL ON FUNCTION public.increment_referral_code_clicks(text) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.increment_referral_code_clicks(text) TO service_role;
  END IF;
END $$;

-- Verification check (should return search_path = public for both functions):
SELECT
  p.proname AS function_name,
  p.proconfig AS function_config
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('sync_client_personal_record', 'increment_referral_code_clicks')
ORDER BY p.proname;
