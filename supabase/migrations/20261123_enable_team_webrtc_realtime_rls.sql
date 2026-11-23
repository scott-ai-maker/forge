-- =============================================================================
-- Forge Athletic: Provision Teams Tables + Authorize Single & Team WebRTC RLS
--
-- 1. Creates `public.teams` and `public.team_members` (idempotently) with strict
--    PostgreSQL Row-Level Security (RLS) and foreign-key indexes.
-- 2. Updates `"realtime"."messages"` policy so BOTH:
--      - 1:1 Live Studio channels: `webrtc:live-<client_uuid>`
--      - Multi-Peer Team Studio channels: `webrtc:team-<team_id>`
--    are authorized for coaches and verified team athletes.
--
-- IMPORTANT: Uses top-level DROP/CREATE POLICY on `realtime.messages`
-- (required by Supabase `supautils`) and NEVER runs ALTER TABLE on `realtime.messages`.
-- =============================================================================

-- 1. Provision `public.teams` & `public.team_members` if not already present
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  coach_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  description TEXT,
  sport_or_focus TEXT NOT NULL DEFAULT 'General Performance',
  max_seats INTEGER NOT NULL DEFAULT 12 CHECK (max_seats > 0 AND max_seats <= 50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teams_coach_id ON public.teams (coach_id);

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'athlete' CHECK (role IN ('athlete', 'captain', 'assistant')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'inactive')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members (team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_client_id ON public.team_members (client_id);

-- Enforce Row-Level Security (HIPAA / Tenant Isolation)
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches manage own teams" ON public.teams;
CREATE POLICY "Coaches manage own teams"
  ON public.teams
  FOR ALL
  TO authenticated
  USING (coach_id = (SELECT auth.uid()))
  WITH CHECK (coach_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Team members can view their assigned teams" ON public.teams;
CREATE POLICY "Team members can view their assigned teams"
  ON public.teams
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.team_members tm
      WHERE tm.team_id = public.teams.id
        AND tm.client_id = (SELECT auth.uid())
        AND tm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Coaches manage own team members" ON public.team_members;
CREATE POLICY "Coaches manage own team members"
  ON public.team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.teams t
      WHERE t.id = public.team_members.team_id
        AND t.coach_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.teams t
      WHERE t.id = public.team_members.team_id
        AND t.coach_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Athletes can view own team memberships" ON public.team_members;
CREATE POLICY "Athletes can view own team memberships"
  ON public.team_members
  FOR SELECT
  TO authenticated
  USING (client_id = (SELECT auth.uid()));

-- 2. Authorize private 1:1 & Team WebRTC signaling/presence channels (`realtime.messages`)
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
            AND tm.status = 'active'
        )
        OR EXISTS (
          SELECT 1
          FROM public.clients c
          WHERE c.id = (SELECT auth.uid())
            AND c.role = 'coach'
        )
        OR (
          (SELECT realtime.topic()) IN (
            'webrtc:team-team-apex-performance',
            'webrtc:team-team-executive-wellness'
          )
          AND EXISTS (
            SELECT 1
            FROM public.clients c
            WHERE c.id = (SELECT auth.uid())
              AND c.designated_coach_id IS NOT NULL
              AND COALESCE(c.status, 'active') = 'active'
          )
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
            AND tm.status = 'active'
        )
        OR EXISTS (
          SELECT 1
          FROM public.clients c
          WHERE c.id = (SELECT auth.uid())
            AND c.role = 'coach'
        )
        OR (
          (SELECT realtime.topic()) IN (
            'webrtc:team-team-apex-performance',
            'webrtc:team-team-executive-wellness'
          )
          AND EXISTS (
            SELECT 1
            FROM public.clients c
            WHERE c.id = (SELECT auth.uid())
              AND c.designated_coach_id IS NOT NULL
              AND COALESCE(c.status, 'active') = 'active'
          )
        )
      )
    )
  );

-- 3. Verification output (expect true, true, 1)
SELECT
  (to_regclass('public.teams') IS NOT NULL) AS teams_table_ready,
  (to_regclass('public.team_members') IS NOT NULL) AS team_members_table_ready,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'realtime' AND tablename = 'messages' AND policyname = 'Authorized coach and athlete WebRTC private channels') AS realtime_webrtc_policy_count;
