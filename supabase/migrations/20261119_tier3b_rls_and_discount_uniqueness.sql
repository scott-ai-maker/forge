-- =============================================================================
-- Forge Athletic — Tier 3B Cross-Coach RLS Isolation & Discount Uniqueness
-- 1. (#38) Restricts `nasm_assessments` INSERT/UPDATE/DELETE strictly to the
--    client's assigned coach (`public.is_coach_assigned_to_client(client_id)`).
-- 2. (#38) If `teams` / `team_members` / `team_live_sessions` exist, removes
--    overbroad `OR role = 'coach'` cross-coach overrides and fixes `42P17`
--    self-referential recursion on `team_members`.
-- 3. (#33) Enforces per-client uniqueness on `discount_code_redemptions`
--    (`(discount_code_id, client_id)`) to prevent concurrent 100%-promo races.
-- =============================================================================

-- 1. Harden `public.nasm_assessments` RLS policies (#38)
DO $$
BEGIN
  IF to_regclass('public.nasm_assessments') IS NOT NULL
     AND to_regprocedure('public.is_coach_assigned_to_client(uuid)') IS NOT NULL THEN
    ALTER TABLE public.nasm_assessments ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Coach reads assigned client assessments" ON public.nasm_assessments;
    CREATE POLICY "Coach reads assigned client assessments"
      ON public.nasm_assessments
      FOR SELECT
      TO authenticated
      USING (
        (SELECT auth.uid()) = coach_id
        AND public.is_coach_assigned_to_client(client_id)
      );

    DROP POLICY IF EXISTS "Coach inserts client assessments" ON public.nasm_assessments;
    CREATE POLICY "Coach inserts client assessments"
      ON public.nasm_assessments
      FOR INSERT
      TO authenticated
      WITH CHECK (
        (SELECT auth.uid()) = coach_id
        AND public.is_coach_assigned_to_client(client_id)
      );

    DROP POLICY IF EXISTS "Coach updates client assessments" ON public.nasm_assessments;
    CREATE POLICY "Coach updates client assessments"
      ON public.nasm_assessments
      FOR UPDATE
      TO authenticated
      USING (
        (SELECT auth.uid()) = coach_id
        AND public.is_coach_assigned_to_client(client_id)
      )
      WITH CHECK (
        (SELECT auth.uid()) = coach_id
        AND public.is_coach_assigned_to_client(client_id)
      );

    DROP POLICY IF EXISTS "Coach deletes client assessments" ON public.nasm_assessments;
    CREATE POLICY "Coach deletes client assessments"
      ON public.nasm_assessments
      FOR DELETE
      TO authenticated
      USING (
        (SELECT auth.uid()) = coach_id
        AND public.is_coach_assigned_to_client(client_id)
      );
  END IF;
END $$;

-- 2. Harden `teams` / `team_members` / `team_live_sessions` if present (#38)
DO $$
BEGIN
  IF to_regclass('public.teams') IS NOT NULL AND to_regclass('public.team_members') IS NOT NULL THEN
    CREATE OR REPLACE FUNCTION public.is_enrolled_in_team(target_team_id uuid)
    RETURNS boolean
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $fn$
      SELECT EXISTS (
        SELECT 1
        FROM public.team_members tm
        WHERE tm.team_id = target_team_id
          AND tm.client_id = auth.uid()
      );
    $fn$;

    REVOKE ALL ON FUNCTION public.is_enrolled_in_team(uuid) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.is_enrolled_in_team(uuid) TO authenticated;

    DROP POLICY IF EXISTS "Coaches can manage own teams" ON public.teams;
    CREATE POLICY "Coaches can manage own teams"
      ON public.teams
      FOR ALL
      TO authenticated
      USING ((SELECT auth.uid()) = coach_id)
      WITH CHECK ((SELECT auth.uid()) = coach_id);

    DROP POLICY IF EXISTS "Members can view their teams" ON public.teams;
    CREATE POLICY "Members can view their teams"
      ON public.teams
      FOR SELECT
      TO authenticated
      USING (public.is_enrolled_in_team(id));

    DROP POLICY IF EXISTS "Coaches can manage team members" ON public.team_members;
    CREATE POLICY "Coaches can manage team members"
      ON public.team_members
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.teams t
          WHERE t.id = team_members.team_id
            AND t.coach_id = (SELECT auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.teams t
          WHERE t.id = team_members.team_id
            AND t.coach_id = (SELECT auth.uid())
        )
      );

    DROP POLICY IF EXISTS "Members can view teammates" ON public.team_members;
    CREATE POLICY "Members can view teammates"
      ON public.team_members
      FOR SELECT
      TO authenticated
      USING (public.is_enrolled_in_team(team_id));
  END IF;

  IF to_regclass('public.team_live_sessions') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Coaches can manage team live sessions" ON public.team_live_sessions;
    CREATE POLICY "Coaches can manage team live sessions"
      ON public.team_live_sessions
      FOR ALL
      TO authenticated
      USING ((SELECT auth.uid()) = coach_id)
      WITH CHECK ((SELECT auth.uid()) = coach_id);
  END IF;
END $$;

-- 3. Per-user discount code redemption uniqueness (#33)
DO $$
BEGIN
  IF to_regclass('public.discount_code_redemptions') IS NOT NULL THEN
    -- Deduplicate any historical duplicate (discount_code_id, client_id) rows before adding unique index
    DELETE FROM public.discount_code_redemptions a
    USING public.discount_code_redemptions b
    WHERE a.ctid < b.ctid
      AND a.discount_code_id = b.discount_code_id
      AND a.client_id = b.client_id;

    CREATE UNIQUE INDEX IF NOT EXISTS discount_code_redemptions_code_client_uniq
      ON public.discount_code_redemptions (discount_code_id, client_id);
  END IF;
END $$;

-- 4. Verification output
SELECT
  to_regclass('public.nasm_assessments') AS nasm_assessments_table,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'nasm_assessments') AS nasm_policy_count,
  (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'discount_code_redemptions_code_client_uniq') AS discount_uniq_index_count;
