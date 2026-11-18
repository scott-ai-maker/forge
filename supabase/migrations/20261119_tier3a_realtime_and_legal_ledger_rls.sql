-- =============================================================================
-- Forge Athletic — Tier 3A Security & Legal Ledger Hardening Migration
-- 1. (#32) Revokes direct authenticated client INSERT into `legal_consent_audit_log`
--    so evidentiary clickwrap rows can ONLY be written by verified server endpoints
--    using `service_role` (`supabaseAdmin()`).
-- 2. (#30) Enforces private Supabase Realtime channel authorization (`realtime.messages`)
--    for 1:1 `webrtc:live-<client_uuid>` signaling rooms (Team Live is retired per #5).
--    IMPORTANT: Uses top-level CREATE/DROP POLICY (required by Supabase `supautils`)
--    and NEVER runs ALTER TABLE on `realtime.messages`.
-- =============================================================================

-- 1. Lock down `public.legal_consent_audit_log` against client-side row spoofing (#32)
ALTER TABLE public.legal_consent_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own legal consent audit rows"
  ON public.legal_consent_audit_log;

DROP POLICY IF EXISTS "Users can view own legal consent audit rows"
  ON public.legal_consent_audit_log;

CREATE POLICY "Users can view own legal consent audit rows"
  ON public.legal_consent_audit_log
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 2. Authorize private 1:1 WebRTC signaling & presence channels (`realtime.messages`) (#30)
DROP POLICY IF EXISTS "Authorized coach and athlete WebRTC private channels"
  ON "realtime"."messages";

CREATE POLICY "Authorized coach and athlete WebRTC private channels"
  ON "realtime"."messages"
  FOR ALL
  TO authenticated
  USING (
    (SELECT realtime.topic()) LIKE 'webrtc:live-%'
    AND (
      (SELECT realtime.topic()) = ('webrtc:live-' || (SELECT auth.uid())::text)
      OR EXISTS (
        SELECT 1
        FROM public.clients c
        WHERE ('webrtc:live-' || c.id::text) = (SELECT realtime.topic())
          AND c.designated_coach_id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    (SELECT realtime.topic()) LIKE 'webrtc:live-%'
    AND (
      (SELECT realtime.topic()) = ('webrtc:live-' || (SELECT auth.uid())::text)
      OR EXISTS (
        SELECT 1
        FROM public.clients c
        WHERE ('webrtc:live-' || c.id::text) = (SELECT realtime.topic())
          AND c.designated_coach_id = (SELECT auth.uid())
      )
    )
  );

-- 3. Verification output (expect 1 and 1)
SELECT
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'legal_consent_audit_log') AS legal_ledger_policy_count,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'realtime' AND tablename = 'messages' AND policyname = 'Authorized coach and athlete WebRTC private channels') AS realtime_webrtc_policy_count;
