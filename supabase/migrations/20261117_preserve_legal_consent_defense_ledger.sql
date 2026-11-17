-- =============================================================================
-- Remediation #7: Preserve Signed Liability Waivers & Arbitration Proofs Across
-- Account Deletion (GDPR Art. 17(3)(e) / CCPA § 1798.105(d)(5) / MA c. 260 § 2A
-- Litigation-Defense Exception) & Lock Append-Only Ledger Integrity
-- =============================================================================

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

-- Replace ON DELETE CASCADE on user_id with nullable ON DELETE SET NULL so account
-- deletion never wipes executed waivers, PAR-Q+ attestations, or arbitration proofs.
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
  FOR SELECT
  TO authenticated
  USING (user_id IS NOT NULL AND (SELECT auth.uid()) = user_id);

-- Enforce evidentiary immutability: block DELETE outright and forbid mutating
-- signed contract columns (allowing ONLY user_id -> NULL / deleted_subject_sha256
-- pseudonymization during account deletion).
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
