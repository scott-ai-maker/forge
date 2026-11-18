-- ============================================================================
-- Migration: 20261118_harden_intake_rls_and_client_columns.sql
-- Purpose:
--   1. Lock `email`, `must_reset_password`, and cross-tenant `avatar_path`
--      mutations on `public.clients` for authenticated PostgREST sessions
--      (preventing Stripe customer email hijacking and password-reset bypass).
--   2. Enforce folder-prefix ownership constraint on `fitness_profiles.before_photo_path`.
--   3. Replace `FOR ALL` browser RLS on `client_intake_forms` with `INSERT` +
--      `UPDATE` only (`NO DELETE`), preventing athletes from wiping signed
--      PAR-Q+ / liability disclosures from browser DevTools.
--   4. Revoke direct browser `INSERT / UPDATE / DELETE` on `workout_plans`
--      (preventing forged `isCertifiedByCoach: true` / `nasm_opt_phase: 5` plans)
--      and on `referral_codes` (preventing forged `total_rewards_earned_cents`).
-- ============================================================================

-- 1. Upgrade privileged column immutability trigger on public.clients
CREATE OR REPLACE FUNCTION public.enforce_clients_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) = 'authenticated' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Insufficient privilege: cannot modify client role' USING ERRCODE = '42501';
    END IF;
    IF NEW.designated_coach_id IS DISTINCT FROM OLD.designated_coach_id THEN
      RAISE EXCEPTION 'Insufficient privilege: cannot modify designated_coach_id' USING ERRCODE = '42501';
    END IF;
    IF NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id THEN
      RAISE EXCEPTION 'Insufficient privilege: cannot modify stripe_customer_id' USING ERRCODE = '42501';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Insufficient privilege: cannot modify account status' USING ERRCODE = '42501';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Insufficient privilege: email must be updated via Supabase Auth verification' USING ERRCODE = '42501';
    END IF;
    IF NEW.must_reset_password IS DISTINCT FROM OLD.must_reset_password THEN
      RAISE EXCEPTION 'Insufficient privilege: cannot clear must_reset_password directly' USING ERRCODE = '42501';
    END IF;
    IF NEW.avatar_path IS NOT NULL AND (
      split_part(ltrim(NEW.avatar_path, '/'), '/', 1) <> NEW.id::text
      OR position('..' IN NEW.avatar_path) > 0
      OR position('\' IN NEW.avatar_path) > 0
    ) THEN
      RAISE EXCEPTION 'Invalid avatar_path: must reside within own user storage folder' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_clients_privileged_columns ON public.clients;
CREATE TRIGGER trg_enforce_clients_privileged_columns
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_clients_privileged_columns();

-- 2. Enforce folder ownership on fitness_profiles.before_photo_path
ALTER TABLE public.fitness_profiles
  DROP CONSTRAINT IF EXISTS fitness_profiles_before_photo_owner_chk;

ALTER TABLE public.fitness_profiles
  ADD CONSTRAINT fitness_profiles_before_photo_owner_chk
  CHECK (
    before_photo_path IS NULL
    OR (
      split_part(ltrim(before_photo_path, '/'), '/', 1) = user_id::text
      AND position('..' IN before_photo_path) = 0
      AND position('\' IN before_photo_path) = 0
    )
  ) NOT VALID;

-- 3. Prevent authenticated clients from deleting their signed PAR-Q+ / intake forms
DROP POLICY IF EXISTS "User writes own intake form" ON public.client_intake_forms;
DROP POLICY IF EXISTS "User inserts own intake form" ON public.client_intake_forms;
DROP POLICY IF EXISTS "User updates own intake form" ON public.client_intake_forms;

CREATE POLICY "User inserts own intake form"
  ON public.client_intake_forms
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User updates own intake form"
  ON public.client_intake_forms
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

REVOKE DELETE ON public.client_intake_forms FROM anon, authenticated;

-- 4. Lock workout_plans against direct client-side PostgREST fabrication (writes go through server APIs)
DROP POLICY IF EXISTS "User writes own workout plans" ON public.workout_plans;
REVOKE INSERT, UPDATE, DELETE ON public.workout_plans FROM anon, authenticated;

-- 5. Lock referral_codes reward counters against direct client-side PostgREST tampering
DROP POLICY IF EXISTS "Users can insert their own referral code" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can update their own referral code" ON public.referral_codes;
REVOKE INSERT, UPDATE, DELETE ON public.referral_codes FROM anon, authenticated;
