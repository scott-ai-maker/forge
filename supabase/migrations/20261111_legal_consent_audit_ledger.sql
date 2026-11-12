-- =============================================================================
-- Forge Athletic — Immutable Legal Consent & ESIGN Audit Ledger
-- Enforces Massachusetts clickwrap formation proof (Kauders v. Uber, 486 Mass. 557),
-- ESIGN / MA UETA (M.G.L. c. 110G), Illinois BIPA (740 ILCS 14/), WA MHMDA,
-- and M.G.L. c. 272, § 99 all-party recording consent verification.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.legal_consent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_legal_consent_audit_user_doc
  ON public.legal_consent_audit_log (user_id, document_type, consented_at DESC);

ALTER TABLE public.legal_consent_audit_log ENABLE ROW LEVEL SECURITY;

-- Athletes may read their own executed legal consent history
DROP POLICY IF EXISTS "Users can view own legal consent audit rows" ON public.legal_consent_audit_log;
CREATE POLICY "Users can view own legal consent audit rows"
  ON public.legal_consent_audit_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Athletes may insert their own consent records (NO UPDATE OR DELETE policies — append-only ledger)
DROP POLICY IF EXISTS "Users can insert own legal consent audit rows" ON public.legal_consent_audit_log;
CREATE POLICY "Users can insert own legal consent audit rows"
  ON public.legal_consent_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

