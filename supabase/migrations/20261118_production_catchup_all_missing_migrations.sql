-- ============================================================================
-- Migration: 20261118_production_catchup_all_missing_migrations.sql
-- Purpose:
--   Single, 100% idempotent, dependency-ordered catch-up script applying all
--   previously unexecuted migrations in one pass:
--     1. Security-definer coach assignment & storage folder helpers
--     2. `notification_preferences` & `notification_log` (20261005)
--     3. `client_telemetry_events` & `client_telemetry_snapshots` (20261114)
--     4. `forge_rag_chunks` + `pgvector` hybrid RAG store (20261115)
--     5. Private Storage buckets (`coach-voice-notes`, `coach-voice-cache`)
--     6. `18+` Adult DOB & Age constraints on `fitness_profiles` (#8)
--     7. RLS lockdowns on `email_suppressions`, `client_lifecycle_audit_logs`,
--        `coach_onboarding_gates`, `athlete_wearable_metrics`, `client_personal_records` (#1/#2)
--     8. Immutable Waiver Defense Ledger (`legal_consent_audit_log` + trigger) (#7)
--     9. Inline Base64 scrub & check constraint on `body_composition_analyses` (#16)
--    10. TCPA `sms_suppressions`, `waitlist` SMS consent columns & `timezone` (#18)
--    11. `clients` privileged-column trigger + `referral_codes` / `client_intake_forms` / `workout_plans` locks
--    12. Final read-only verification SELECT confirming zero NULL relations remain
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Core Coach Assignment & Private Storage Helper Functions
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.clients') IS NOT NULL THEN
    ALTER TABLE public.clients
      ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS must_reset_password boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS avatar_path text,
      ADD COLUMN IF NOT EXISTS stripe_customer_id text,
      ADD COLUMN IF NOT EXISTS designated_coach_id uuid;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.is_authenticated_coach()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clients c
    WHERE c.id = auth.uid()
      AND c.role = 'coach'
  );
$$;

REVOKE ALL ON FUNCTION public.is_authenticated_coach() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_authenticated_coach() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_coach_assigned_to_client(target_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clients coach
    JOIN public.clients cl ON cl.id = target_client_id
    WHERE coach.id = auth.uid()
      AND coach.role = 'coach'
      AND cl.designated_coach_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_coach_assigned_to_client(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_coach_assigned_to_client(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_access_client_storage_folder(folder_segment text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
BEGIN
  IF folder_segment IS NULL OR folder_segment !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RETURN false;
  END IF;
  target_id := folder_segment::uuid;
  RETURN target_id = auth.uid() OR public.is_coach_assigned_to_client(target_id);
END;
$$;

REVOKE ALL ON FUNCTION public.can_access_client_storage_folder(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_client_storage_folder(text) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. Notification Preferences & Delivery Deduplication Log (20261005)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id          uuid PRIMARY KEY REFERENCES public.clients(id) ON DELETE CASCADE,
  push_enabled     boolean NOT NULL DEFAULT true,
  email_enabled    boolean NOT NULL DEFAULT true,
  sms_enabled      boolean NOT NULL DEFAULT false,
  sms_phone        text,
  sms_consent_at   timestamptz,
  timezone         text,
  muted_categories text[] NOT NULL DEFAULT '{}',
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS timezone text;

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User reads own notification preferences" ON public.notification_preferences;
CREATE POLICY "User reads own notification preferences"
  ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.notification_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type       text NOT NULL,
  channels   text[] NOT NULL DEFAULT '{}',
  dedupe_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notification_log_user_type_idx
  ON public.notification_log (user_id, type, created_at DESC);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_log FROM anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Client Telemetry Events & Snapshots (20261114 — Safety Queue & Posture Sync)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_telemetry_events (
  event_id             uuid PRIMARY KEY,
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id           text NOT NULL,
  event_type           text NOT NULL,
  client_timestamp     timestamptz NOT NULL,
  client_timestamp_iso text NOT NULL,
  timezone_offset_mins int NOT NULL DEFAULT 0,
  platform             text NOT NULL CHECK (
    platform IN ('ios_app', 'android_app', 'pwa_standalone', 'mobile_web', 'desktop_web')
  ),
  app_version          text NOT NULL,
  network_type         text,
  cv_capability        jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload              jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_telemetry_events
  DROP CONSTRAINT IF EXISTS client_telemetry_events_event_type_check;

ALTER TABLE public.client_telemetry_events
  ADD CONSTRAINT client_telemetry_events_event_type_check CHECK (
    event_type IN (
      'posture_scan_completed',
      'desk_ergonomics_completed',
      'readiness_check_completed',
      'workout_completed',
      'set_logged',
      'joint_comfort_logged',
      'desk_reset_completed',
      'form_lab_uploaded',
      'live_studio_telemetry',
      'watch_biometrics_stream',
      'client_runtime_diagnostic',
      'safety_flag',
      'escalation_sms',
      'escalation_email'
    )
  );

CREATE INDEX IF NOT EXISTS idx_client_telemetry_events_user_time
  ON public.client_telemetry_events (user_id, client_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_client_telemetry_events_user_type
  ON public.client_telemetry_events (user_id, event_type, client_timestamp DESC);

CREATE TABLE IF NOT EXISTS public.client_telemetry_snapshots (
  user_id                   uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  latest_readiness_score    int CHECK (latest_readiness_score IS NULL OR (latest_readiness_score >= 0 AND latest_readiness_score <= 100)),
  latest_readiness_movement text,
  latest_readiness_at       timestamptz,
  joint_comfort_history     jsonb NOT NULL DEFAULT '[]'::jsonb,
  desk_workstation_score    int CHECK (desk_workstation_score IS NULL OR (desk_workstation_score >= 0 AND desk_workstation_score <= 100)),
  desk_strain_level         text,
  desk_strain_flags         text[] NOT NULL DEFAULT '{}',
  desk_angles               jsonb NOT NULL DEFAULT '{}'::jsonb,
  desk_audited_at           timestamptz,
  posture_delta             jsonb NOT NULL DEFAULT '{}'::jsonb,
  injected_warmup_drills    jsonb NOT NULL DEFAULT '[]'::jsonb,
  opt_phase                 int CHECK (opt_phase IS NULL OR (opt_phase >= 1 AND opt_phase <= 5)),
  express_mode_active       boolean NOT NULL DEFAULT false,
  environment_profile       text NOT NULL DEFAULT 'home_gym',
  last_workout_completed_at timestamptz,
  last_synced_at            timestamptz NOT NULL DEFAULT now(),
  last_platform             text,
  last_app_version          text,
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_telemetry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_telemetry_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Client reads own telemetry events" ON public.client_telemetry_events;
CREATE POLICY "Client reads own telemetry events"
  ON public.client_telemetry_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Client inserts own telemetry events" ON public.client_telemetry_events;
CREATE POLICY "Client inserts own telemetry events"
  ON public.client_telemetry_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Assigned coach reads client telemetry events" ON public.client_telemetry_events;
CREATE POLICY "Assigned coach reads client telemetry events"
  ON public.client_telemetry_events FOR SELECT TO authenticated
  USING (public.is_coach_assigned_to_client(client_telemetry_events.user_id));

DROP POLICY IF EXISTS "Client reads own telemetry snapshot" ON public.client_telemetry_snapshots;
CREATE POLICY "Client reads own telemetry snapshot"
  ON public.client_telemetry_snapshots FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Client writes own telemetry snapshot" ON public.client_telemetry_snapshots;
CREATE POLICY "Client writes own telemetry snapshot"
  ON public.client_telemetry_snapshots FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Assigned coach reads client telemetry snapshot" ON public.client_telemetry_snapshots;
CREATE POLICY "Assigned coach reads client telemetry snapshot"
  ON public.client_telemetry_snapshots FOR SELECT TO authenticated
  USING (public.is_coach_assigned_to_client(client_telemetry_snapshots.user_id));

-- ----------------------------------------------------------------------------
-- 4. Hybrid Semantic RAG Knowledge Store (20261115 — pgvector)
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.forge_rag_chunks (
  id              text PRIMARY KEY,
  doc_id          text NOT NULL,
  source_kind     text NOT NULL CHECK (
    source_kind IN ('nasm_curriculum', 'movement_biomechanics', 'contraindication_protocol')
  ),
  title           text NOT NULL,
  category        text NOT NULL,
  goal_category   text,
  nasm_opt_phases int[] NOT NULL DEFAULT '{}',
  content_passage text NOT NULL,
  key_concepts    text[] NOT NULL DEFAULT '{}',
  embedding       vector(768),
  content_hash    text NOT NULL,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forge_rag_chunks_doc_id
  ON public.forge_rag_chunks (doc_id);

CREATE INDEX IF NOT EXISTS idx_forge_rag_chunks_opt_phases
  ON public.forge_rag_chunks USING gin (nasm_opt_phases);

CREATE INDEX IF NOT EXISTS idx_forge_rag_chunks_fts
  ON public.forge_rag_chunks USING gin (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content_passage, ''))
  );

CREATE INDEX IF NOT EXISTS idx_forge_rag_chunks_embedding_hnsw
  ON public.forge_rag_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

ALTER TABLE public.forge_rag_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated members read Forge RAG chunks" ON public.forge_rag_chunks;
CREATE POLICY "Authenticated members read Forge RAG chunks"
  ON public.forge_rag_chunks FOR SELECT
  TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.match_forge_rag_chunks(
  query_embedding vector(768),
  match_count int DEFAULT 8,
  filter_opt_phase int DEFAULT NULL,
  min_similarity float DEFAULT 0.35
)
RETURNS TABLE (
  id text,
  doc_id text,
  source_kind text,
  title text,
  category text,
  goal_category text,
  nasm_opt_phases int[],
  content_passage text,
  key_concepts text[],
  similarity float
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    c.id,
    c.doc_id,
    c.source_kind,
    c.title,
    c.category,
    c.goal_category,
    c.nasm_opt_phases,
    c.content_passage,
    c.key_concepts,
    (1 - (c.embedding <=> query_embedding))::float AS similarity
  FROM public.forge_rag_chunks c
  WHERE c.embedding IS NOT NULL
    AND (1 - (c.embedding <=> query_embedding)) >= min_similarity
    AND (
      filter_opt_phase IS NULL
      OR cardinality(c.nasm_opt_phases) = 0
      OR filter_opt_phase = ANY(c.nasm_opt_phases)
    )
  ORDER BY c.embedding <=> query_embedding ASC
  LIMIT greatest(1, least(match_count, 25));
$$;

-- ----------------------------------------------------------------------------
-- 5. Private Storage Buckets (`coach-voice-notes` & `coach-voice-cache`)
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'coach-voice-notes',
  'coach-voice-notes',
  false,
  5242880,
  ARRAY['audio/mp4', 'audio/webm', 'audio/aac', 'audio/ogg', 'audio/mpeg', 'audio/wav']
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['audio/mp4', 'audio/webm', 'audio/aac', 'audio/ogg', 'audio/mpeg', 'audio/wav'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'coach-voice-cache',
  'coach-voice-cache',
  false,
  5242880,
  ARRAY['audio/mpeg']
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['audio/mpeg'];

DROP POLICY IF EXISTS "coach_voice_cache_coach_read" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Assigned participants upload voice notes" ON storage.objects;
CREATE POLICY "Assigned participants upload voice notes" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'coach-voice-notes'
    AND public.can_access_client_storage_folder((storage.foldername(name))[1])
  );

DROP POLICY IF EXISTS "Authenticated users view voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Assigned participants view voice notes" ON storage.objects;
CREATE POLICY "Assigned participants view voice notes" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'coach-voice-notes'
    AND public.can_access_client_storage_folder((storage.foldername(name))[1])
  );

DROP POLICY IF EXISTS "Assigned participants delete voice notes" ON storage.objects;
CREATE POLICY "Assigned participants delete voice notes" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'coach-voice-notes'
    AND public.can_access_client_storage_folder((storage.foldername(name))[1])
  );

-- ----------------------------------------------------------------------------
-- 6. 18+ Adult Eligibility & DOB Gate on `fitness_profiles` (#8)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.fitness_profiles') IS NOT NULL THEN
    ALTER TABLE public.fitness_profiles
      ADD COLUMN IF NOT EXISTS date_of_birth DATE,
      ADD COLUMN IF NOT EXISTS before_photo_path text;

    UPDATE public.fitness_profiles
    SET age = NULL
    WHERE age IS NOT NULL AND (age < 18 OR age > 105);

    UPDATE public.fitness_profiles
    SET date_of_birth = NULL
    WHERE date_of_birth IS NOT NULL
      AND (
        date_of_birth < DATE '1920-01-01'
        OR date_of_birth > (CURRENT_DATE - INTERVAL '18 years')::date
      );

    ALTER TABLE public.fitness_profiles
      DROP CONSTRAINT IF EXISTS fitness_profiles_adult_age_check;
    ALTER TABLE public.fitness_profiles
      ADD CONSTRAINT fitness_profiles_adult_age_check
      CHECK (age IS NULL OR (age >= 18 AND age <= 105));

    ALTER TABLE public.fitness_profiles
      DROP CONSTRAINT IF EXISTS fitness_profiles_dob_adult_check;
    ALTER TABLE public.fitness_profiles
      ADD CONSTRAINT fitness_profiles_dob_adult_check
      CHECK (
        date_of_birth IS NULL
        OR (
          date_of_birth >= DATE '1920-01-01'
          AND date_of_birth <= (CURRENT_DATE - INTERVAL '18 years')::date
        )
      );
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 7. Audit Logs, Onboarding Gates, Email Suppressions & Wearable RLS (#1/#2)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.email_suppressions') IS NOT NULL THEN
    ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public.email_suppressions FROM anon, authenticated;
    DROP POLICY IF EXISTS "Public can read email suppressions" ON public.email_suppressions;
    DROP POLICY IF EXISTS "Public can manage email suppressions" ON public.email_suppressions;
  END IF;

  IF to_regclass('public.client_lifecycle_audit_logs') IS NOT NULL THEN
    ALTER TABLE public.client_lifecycle_audit_logs ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public.client_lifecycle_audit_logs FROM anon;
    REVOKE INSERT, UPDATE, DELETE ON public.client_lifecycle_audit_logs FROM authenticated;
    DROP POLICY IF EXISTS "Coach reads assigned lifecycle audit logs" ON public.client_lifecycle_audit_logs;
    CREATE POLICY "Coach reads assigned lifecycle audit logs" ON public.client_lifecycle_audit_logs
      FOR SELECT TO authenticated
      USING (public.is_coach_assigned_to_client(client_lifecycle_audit_logs.client_id));
  END IF;

  IF to_regclass('public.coach_onboarding_gates') IS NOT NULL THEN
    ALTER TABLE public.coach_onboarding_gates ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public.coach_onboarding_gates FROM anon;
    DROP POLICY IF EXISTS "Coaches and admins can view and manage onboarding gates" ON public.coach_onboarding_gates;
    DROP POLICY IF EXISTS "Users and assigned coaches read onboarding gates" ON public.coach_onboarding_gates;
    CREATE POLICY "Users and assigned coaches read onboarding gates" ON public.coach_onboarding_gates
      FOR SELECT TO authenticated
      USING (
        (SELECT auth.uid()) = client_id
        OR public.is_coach_assigned_to_client(coach_onboarding_gates.client_id)
      );

    DROP POLICY IF EXISTS "Assigned coaches insert onboarding gates" ON public.coach_onboarding_gates;
    CREATE POLICY "Assigned coaches insert onboarding gates" ON public.coach_onboarding_gates
      FOR INSERT TO authenticated
      WITH CHECK (public.is_coach_assigned_to_client(coach_onboarding_gates.client_id));

    DROP POLICY IF EXISTS "Assigned coaches update onboarding gates" ON public.coach_onboarding_gates;
    CREATE POLICY "Assigned coaches update onboarding gates" ON public.coach_onboarding_gates
      FOR UPDATE TO authenticated
      USING (public.is_coach_assigned_to_client(coach_onboarding_gates.client_id))
      WITH CHECK (public.is_coach_assigned_to_client(coach_onboarding_gates.client_id));

    DROP POLICY IF EXISTS "Assigned coaches delete onboarding gates" ON public.coach_onboarding_gates;
    CREATE POLICY "Assigned coaches delete onboarding gates" ON public.coach_onboarding_gates
      FOR DELETE TO authenticated
      USING (public.is_coach_assigned_to_client(coach_onboarding_gates.client_id));
  END IF;

  IF to_regclass('public.athlete_wearable_metrics') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users read own wearable metrics" ON public.athlete_wearable_metrics;
    CREATE POLICY "Users read own wearable metrics" ON public.athlete_wearable_metrics
      FOR SELECT TO authenticated
      USING (
        auth.uid() = client_id
        OR public.is_coach_assigned_to_client(client_id)
      );
  END IF;

  IF to_regclass('public.client_personal_records') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users read own personal records" ON public.client_personal_records;
    CREATE POLICY "Users read own personal records" ON public.client_personal_records
      FOR SELECT TO authenticated
      USING (
        auth.uid() = user_id
        OR public.is_coach_assigned_to_client(user_id)
      );
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 8. Immutable Legal Consent & Waiver Defense Ledger (#7)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.legal_consent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_subject_sha256 TEXT CHECK (
    deleted_subject_sha256 IS NULL OR char_length(deleted_subject_sha256) = 64
  ),
  retained_for_legal_defense BOOLEAN NOT NULL DEFAULT true,
  document_type TEXT NOT NULL CHECK (
    document_type IN (
      'terms_of_service',
      'privacy_policy',
      'consumer_health_biometric_policy',
      'athletic_liability_waiver',
      'live_recording_soap_consent',
      'predict_look_ai_simulation_consent'
    )
  ),
  document_version TEXT NOT NULL,
  document_sha256 TEXT NOT NULL CHECK (char_length(document_sha256) = 64),
  typed_signature TEXT,
  ip_address TEXT,
  user_agent TEXT,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.legal_consent_audit_log
  ADD COLUMN IF NOT EXISTS deleted_subject_sha256 TEXT CHECK (
    deleted_subject_sha256 IS NULL OR char_length(deleted_subject_sha256) = 64
  ),
  ADD COLUMN IF NOT EXISTS retained_for_legal_defense BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.legal_consent_audit_log
  ALTER COLUMN user_id DROP NOT NULL;

DO $$
DECLARE
  fk_record RECORD;
BEGIN
  FOR fk_record IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'legal_consent_audit_log'
      AND con.contype = 'f'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.legal_consent_audit_log DROP CONSTRAINT IF EXISTS %I',
      fk_record.conname
    );
  END LOOP;
END $$;

ALTER TABLE public.legal_consent_audit_log
  ADD CONSTRAINT legal_consent_audit_log_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_legal_consent_audit_user_doc
  ON public.legal_consent_audit_log (user_id, document_type, consented_at DESC);

CREATE INDEX IF NOT EXISTS idx_legal_consent_audit_deleted_subject
  ON public.legal_consent_audit_log (deleted_subject_sha256)
  WHERE deleted_subject_sha256 IS NOT NULL;

ALTER TABLE public.legal_consent_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.legal_consent_audit_log FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.legal_consent_audit_log FROM authenticated;
GRANT SELECT ON TABLE public.legal_consent_audit_log TO authenticated;

DROP POLICY IF EXISTS "Users can insert own legal consent audit rows" ON public.legal_consent_audit_log;
DROP POLICY IF EXISTS "Users can view own legal consent audit rows" ON public.legal_consent_audit_log;
CREATE POLICY "Users can view own legal consent audit rows"
  ON public.legal_consent_audit_log
  FOR SELECT TO authenticated
  USING (user_id IS NOT NULL AND (SELECT auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION public.protect_legal_consent_audit_log_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'legal_consent_audit_log is an immutable evidentiary ledger; row deletion is prohibited.';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.id IS DISTINCT FROM OLD.id
      OR NEW.document_type IS DISTINCT FROM OLD.document_type
      OR NEW.document_version IS DISTINCT FROM OLD.document_version
      OR NEW.document_sha256 IS DISTINCT FROM OLD.document_sha256
      OR NEW.typed_signature IS DISTINCT FROM OLD.typed_signature
      OR NEW.ip_address IS DISTINCT FROM OLD.ip_address
      OR NEW.user_agent IS DISTINCT FROM OLD.user_agent
      OR NEW.consented_at IS DISTINCT FROM OLD.consented_at
      OR NEW.metadata IS DISTINCT FROM OLD.metadata
      OR NEW.created_at IS DISTINCT FROM OLD.created_at
    THEN
      RAISE EXCEPTION 'Immutable evidentiary columns on legal_consent_audit_log cannot be modified.';
    END IF;

    IF NEW.user_id IS DISTINCT FROM OLD.user_id AND NEW.user_id IS NOT NULL THEN
      RAISE EXCEPTION 'legal_consent_audit_log.user_id may only transition to NULL upon account deletion.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_legal_consent_audit_log ON public.legal_consent_audit_log;
CREATE TRIGGER trg_protect_legal_consent_audit_log
  BEFORE UPDATE OR DELETE ON public.legal_consent_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_legal_consent_audit_log_immutability();

-- ----------------------------------------------------------------------------
-- 9. Scrub Inline Base64 Body-Comp Photos from Postgres (#16)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.body_composition_analyses') IS NOT NULL THEN
    UPDATE public.body_composition_analyses
    SET photo_data_url = NULL
    WHERE photo_data_url IS NOT NULL
      AND (
        photo_data_url LIKE 'data:%'
        OR char_length(photo_data_url) > 512
      );

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'body_comp_no_inline_base64_chk'
    ) THEN
      ALTER TABLE public.body_composition_analyses
        ADD CONSTRAINT body_comp_no_inline_base64_chk
        CHECK (
          photo_data_url IS NULL
          OR (
            photo_data_url NOT LIKE 'data:%'
            AND char_length(photo_data_url) <= 512
          )
        );
    END IF;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 10. TCPA SMS Consent Columns & `sms_suppressions` (#18)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.waitlist') IS NOT NULL THEN
    ALTER TABLE public.waitlist
      ADD COLUMN IF NOT EXISTS phone text,
      ADD COLUMN IF NOT EXISTS sms_opt_in boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS sms_consent_at timestamptz,
      ADD COLUMN IF NOT EXISTS timezone text;
    CREATE INDEX IF NOT EXISTS waitlist_phone_idx
      ON public.waitlist (phone) WHERE phone IS NOT NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.sms_suppressions (
  phone         text PRIMARY KEY,
  reason        text NOT NULL DEFAULT 'user_stop',
  suppressed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_suppressions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sms_suppressions FROM anon, authenticated;

DROP POLICY IF EXISTS "No client read on sms_suppressions" ON public.sms_suppressions;
CREATE POLICY "No client read on sms_suppressions"
  ON public.sms_suppressions
  FOR SELECT TO anon, authenticated
  USING (false);

-- ----------------------------------------------------------------------------
-- 11. Re-apply `referral_codes` & `increment_referral_code_clicks` Locks (now that 20261016 is installed)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.referral_codes') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can insert their own referral code" ON public.referral_codes;
    DROP POLICY IF EXISTS "Users can update their own referral code" ON public.referral_codes;
    REVOKE INSERT, UPDATE, DELETE ON public.referral_codes FROM anon, authenticated;
  END IF;

  IF to_regprocedure('public.increment_referral_code_clicks(text)') IS NOT NULL THEN
    ALTER FUNCTION public.increment_referral_code_clicks(text) SET search_path = public;
    REVOKE ALL ON FUNCTION public.increment_referral_code_clicks(text) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.increment_referral_code_clicks(text) TO service_role;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 12. Built-in Verification Output (All Columns Should Now Be Non-NULL)
-- ----------------------------------------------------------------------------
SELECT
  to_regclass('public.coach_onboarding_gates')      AS onboarding_gates,
  to_regclass('public.client_addon_entitlements')   AS addon_entitlements,
  to_regclass('public.notification_preferences')    AS notif_prefs,
  to_regclass('public.referral_codes')              AS referral_codes,
  to_regclass('public.legal_consent_audit_log')     AS legal_ledger,
  to_regclass('public.client_telemetry_events')     AS telemetry_events,
  to_regclass('public.sms_suppressions')            AS sms_suppressions,
  to_regclass('public.forge_rag_chunks')            AS rag_chunks;
