-- =============================================================================
-- Forge Athletic — Tier 3A Security & Legal Ledger Hardening Migration
-- 1. (#32) Revokes direct authenticated client INSERT into `legal_consent_audit_log`
--    so evidentiary clickwrap rows can ONLY be written by verified server endpoints
--    using `service_role` (`supabaseAdmin()`).
-- 2. (#30) Enforces private Supabase Realtime channel authorization (`realtime.messages`)
--    for `webrtc:live-<client_uuid>` and `webrtc:team-<team_uuid>` signaling rooms.
-- =============================================================================

-- 1. Lock down `public.legal_consent_audit_log` against client-side row spoofing (#32)
DO $$
BEGIN
  IF to_regclass('public.legal_consent_audit_log') IS NOT NULL THEN
    ALTER TABLE public.legal_consent_audit_log ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can insert own legal consent audit rows"
      ON public.legal_consent_audit_log;

    -- Ensure users can still view their own executed legal history (read-only)
    DROP POLICY IF EXISTS "Users can view own legal consent audit rows"
      ON public.legal_consent_audit_log;
    CREATE POLICY "Users can view own legal consent audit rows"
      ON public.legal_consent_audit_log
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 2. Authorize private WebRTC signaling & presence channels (`realtime.messages`) (#30)
DO $$
BEGIN
  IF to_regclass('realtime.messages') IS NOT NULL THEN
    ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Authorized coach and athlete WebRTC private channels"
      ON realtime.messages;
    CREATE POLICY "Authorized coach and athlete WebRTC private channels"
      ON realtime.messages
      FOR ALL
      TO authenticated
      USING (
        -- 1:1 Live Studio: athlete owns room OR is assigned coach
        (
          realtime.topic() LIKE 'webrtc:live-%'
          AND (
            realtime.topic() = ('webrtc:live-' || auth.uid()::text)
            OR EXISTS (
              SELECT 1
              FROM public.clients c
              WHERE ('webrtc:live-' || c.id::text) = realtime.topic()
                AND c.designated_coach_id = auth.uid()
            )
          )
        )
        OR
        -- Squad / Team Live Studio: team coach OR enrolled team member
        (
          realtime.topic() LIKE 'webrtc:team-%'
          AND (
            EXISTS (
              SELECT 1
              FROM public.teams t
              WHERE ('webrtc:team-' || t.id::text) = realtime.topic()
                AND t.coach_id = auth.uid()
            )
            OR EXISTS (
              SELECT 1
              FROM public.team_members tm
              WHERE ('webrtc:team-' || tm.team_id::text) = realtime.topic()
                AND tm.client_id = auth.uid()
            )
          )
        )
      )
      WITH CHECK (
        (
          realtime.topic() LIKE 'webrtc:live-%'
          AND (
            realtime.topic() = ('webrtc:live-' || auth.uid()::text)
            OR EXISTS (
              SELECT 1
              FROM public.clients c
              WHERE ('webrtc:live-' || c.id::text) = realtime.topic()
                AND c.designated_coach_id = auth.uid()
            )
          )
        )
        OR
        (
          realtime.topic() LIKE 'webrtc:team-%'
          AND (
            EXISTS (
              SELECT 1
              FROM public.teams t
              WHERE ('webrtc:team-' || t.id::text) = realtime.topic()
                AND t.coach_id = auth.uid()
            )
            OR EXISTS (
              SELECT 1
              FROM public.team_members tm
              WHERE ('webrtc:team-' || tm.team_id::text) = realtime.topic()
                AND tm.client_id = auth.uid()
            )
          )
        )
      );
  END IF;
END $$;
