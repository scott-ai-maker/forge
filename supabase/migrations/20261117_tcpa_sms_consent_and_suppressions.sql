-- ============================================================================
-- Migration: 20261117_tcpa_sms_consent_and_suppressions.sql
-- Purpose:
--   1. Ensure `public.waitlist` tracks explicit TCPA written consent
--      (`phone`, `sms_opt_in`, `sms_consent_at`, `timezone`) defaulting to
--      `sms_opt_in = false`.
--   2. Add `timezone` to `public.notification_preferences` so recipient-local
--      TCPA / mini-TCPA quiet hours (8:00 AM – 8:00 PM local) are enforced.
--   3. Create `public.sms_suppressions` (service-role only, RLS locked down)
--      so inbound STOP / revocation requests immediately block all future SMS
--      across both account notifications and waitlist/launch automations.
-- ============================================================================

ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS sms_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS timezone text;

CREATE INDEX IF NOT EXISTS waitlist_phone_idx ON public.waitlist (phone) WHERE phone IS NOT NULL;

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS timezone text;

CREATE TABLE IF NOT EXISTS public.sms_suppressions (
  phone         text PRIMARY KEY,
  reason        text NOT NULL DEFAULT 'user_stop',
  suppressed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_suppressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No client read on sms_suppressions" ON public.sms_suppressions;
CREATE POLICY "No client read on sms_suppressions"
  ON public.sms_suppressions
  FOR SELECT
  TO anon, authenticated
  USING (false);
