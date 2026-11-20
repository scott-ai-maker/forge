-- =============================================================================
-- Migration: 20261120_sprint1_rls_fks_and_retraction_vault.sql
-- Purpose:
--   1. (#18 / #11) Drop anonymous PostgREST `INSERT WITH CHECK (true)` policies
--      on `public.waitlist` and `public.coaching_applications` and revoke
--      `anon` / `authenticated` privileges so all submissions must pass through
--      rate-limited, TCPA/MHMDA-enforced server API routes.
--   2. (#22) Replace non-cascading foreign keys on `sessions.package_id` and
--      `coach_client_messages.deleted_by` with `ON DELETE SET NULL` (plus
--      supporting indexes) so package/account deletions never fail with 23503.
--   3. (#27) Create `service_role`-only `retracted_message_forensic_archive`
--      and scrub any existing `[retracted]:<body...>` rows in
--      `coach_client_messages` to literal `'[retracted]'` so recipients
--      querying PostgREST directly with their session JWT can never read
--      retracted message text or audio paths.
-- =============================================================================

-- 1. Lock down `waitlist` and `coaching_applications` against direct PostgREST inserts (#18 / #11)
DO $$
BEGIN
  IF to_regclass('public.waitlist') IS NOT NULL THEN
    ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public can join waitlist" ON public.waitlist;
    REVOKE ALL ON TABLE public.waitlist FROM anon, authenticated;
  END IF;

  IF to_regclass('public.coaching_applications') IS NOT NULL THEN
    ALTER TABLE public.coaching_applications ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public can submit coaching application" ON public.coaching_applications;
    REVOKE ALL ON TABLE public.coaching_applications FROM anon, authenticated;
  END IF;
END $$;

-- 2. Upgrade `sessions.package_id` and `coach_client_messages.deleted_by` FKs to ON DELETE SET NULL (#22)
DO $$
DECLARE
  fk_rec record;
BEGIN
  IF to_regclass('public.sessions') IS NOT NULL AND to_regclass('public.client_packages') IS NOT NULL THEN
    FOR fk_rec IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.conrelid = 'public.sessions'::regclass
        AND c.contype = 'f'
        AND a.attname = 'package_id'
    LOOP
      EXECUTE format('ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS %I', fk_rec.conname);
    END LOOP;

    ALTER TABLE public.sessions
      ADD CONSTRAINT sessions_package_id_fkey
      FOREIGN KEY (package_id) REFERENCES public.client_packages(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS sessions_package_id_idx
      ON public.sessions(package_id)
      WHERE package_id IS NOT NULL;
  END IF;

  IF to_regclass('public.coach_client_messages') IS NOT NULL AND to_regclass('public.clients') IS NOT NULL THEN
    FOR fk_rec IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.conrelid = 'public.coach_client_messages'::regclass
        AND c.contype = 'f'
        AND a.attname = 'deleted_by'
    LOOP
      EXECUTE format('ALTER TABLE public.coach_client_messages DROP CONSTRAINT IF EXISTS %I', fk_rec.conname);
    END LOOP;

    ALTER TABLE public.coach_client_messages
      ADD CONSTRAINT coach_client_messages_deleted_by_fkey
      FOREIGN KEY (deleted_by) REFERENCES public.clients(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS coach_client_messages_deleted_by_idx
      ON public.coach_client_messages(deleted_by)
      WHERE deleted_by IS NOT NULL;
  END IF;
END $$;

-- 3. Create service_role-only forensic archive for retracted messages & scrub PostgREST-visible rows (#27)
CREATE TABLE IF NOT EXISTS public.retracted_message_forensic_archive (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id        uuid NOT NULL,
  client_id         uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  coach_id          uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  sender_id         uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  retracted_by      uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  original_body     text NOT NULL,
  retracted_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_retracted_message_archive_client
  ON public.retracted_message_forensic_archive(client_id, retracted_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_retracted_message_archive_msg_uniq
  ON public.retracted_message_forensic_archive(message_id);

ALTER TABLE public.retracted_message_forensic_archive ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.retracted_message_forensic_archive FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF to_regclass('public.coach_client_messages') IS NOT NULL THEN
    INSERT INTO public.retracted_message_forensic_archive (
      message_id,
      client_id,
      coach_id,
      sender_id,
      retracted_by,
      original_body,
      retracted_at
    )
    SELECT
      m.id,
      m.client_id,
      m.coach_id,
      m.sender_id,
      m.deleted_by,
      regexp_replace(m.message_body, '^\[retracted\]:', ''),
      COALESCE(m.deleted_at, now())
    FROM public.coach_client_messages m
    WHERE m.message_body LIKE '[retracted]:%'
    ON CONFLICT (message_id) DO NOTHING;

    UPDATE public.coach_client_messages
    SET
      message_body = '[retracted]',
      is_deleted = true,
      deleted_at = COALESCE(deleted_at, now())
    WHERE message_body LIKE '[retracted]:%';
  END IF;
END $$;
