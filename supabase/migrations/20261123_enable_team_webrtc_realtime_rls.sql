-- =============================================================================
-- Forge Athletic: Re-Enable Authorized Multi-Peer Team WebRTC Private Channels
-- Authorizes BOTH 1:1 `webrtc:live-<client_uuid>` AND Team `webrtc:team-<team_uuid>`
-- signaling/presence channels in `realtime.messages` with strict coach/member RLS.
-- IMPORTANT: Uses top-level DROP/CREATE POLICY (required by Supabase `supautils`)
-- and NEVER runs ALTER TABLE on `realtime.messages`.
-- =============================================================================

DROP POLICY IF EXISTS "Authorized coach and athlete WebRTC private channels"
  ON "realtime"."messages";

CREATE POLICY "Authorized coach and athlete WebRTC private channels"
  ON "realtime"."messages"
  FOR ALL
  TO authenticated
  USING (
    (
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
    OR
    (
      (SELECT realtime.topic()) LIKE 'webrtc:team-%'
      AND (
        EXISTS (
          SELECT 1
          FROM public.teams t
          WHERE ('webrtc:team-' || t.id::text) = (SELECT realtime.topic())
            AND t.coach_id = (SELECT auth.uid())
        )
        OR EXISTS (
          SELECT 1
          FROM public.team_members tm
          WHERE ('webrtc:team-' || tm.team_id::text) = (SELECT realtime.topic())
            AND tm.client_id = (SELECT auth.uid())
        )
        OR EXISTS (
          SELECT 1
          FROM public.clients c
          WHERE c.id = (SELECT auth.uid())
            AND c.role = 'coach'
        )
      )
    )
  )
  WITH CHECK (
    (
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
    OR
    (
      (SELECT realtime.topic()) LIKE 'webrtc:team-%'
      AND (
        EXISTS (
          SELECT 1
          FROM public.teams t
          WHERE ('webrtc:team-' || t.id::text) = (SELECT realtime.topic())
            AND t.coach_id = (SELECT auth.uid())
        )
        OR EXISTS (
          SELECT 1
          FROM public.team_members tm
          WHERE ('webrtc:team-' || tm.team_id::text) = (SELECT realtime.topic())
            AND tm.client_id = (SELECT auth.uid())
        )
        OR EXISTS (
          SELECT 1
          FROM public.clients c
          WHERE c.id = (SELECT auth.uid())
            AND c.role = 'coach'
        )
      )
    )
  );
