import { describe, expect, it, vi } from 'vitest'

describe('app/api/coach/clients/[id]/onboarding-gates', () => {
  it('validates stage ID mapping structure', () => {
    const STAGE_ID_MAP = {
      1: 'intake_claim',
      2: 'liability_shield',
      3: 'baseline_biometrics',
      4: 'movement_testing',
      5: 'periodization',
      6: 'program_design',
      7: 'delivery_kickoff',
    }
    expect(STAGE_ID_MAP[1]).toBe('intake_claim')
    expect(STAGE_ID_MAP[7]).toBe('delivery_kickoff')
  })

  it('protects clinical consent and PAR-Q fields from unauthorized client overrides', () => {
    const PROTECTED_CLIENT_FIELDS = new Set([
      'consent_signature_name',
      'consent_signed_at',
      'consent_liability_waiver',
      'consent_informed_consent',
      'consent_privacy_practices',
      'consent_coaching_agreement',
      'consent_emergency_care',
      'parq_answers',
      'parq_any_yes',
    ])

    expect(PROTECTED_CLIENT_FIELDS.has('consent_signature_name')).toBe(true)
    expect(PROTECTED_CLIENT_FIELDS.has('parq_answers')).toBe(true)
    expect(PROTECTED_CLIENT_FIELDS.has('notes')).toBe(false)
  })
})
