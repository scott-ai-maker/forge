import { describe, expect, it, vi } from 'vitest'
import {
  LEGAL_DOCUMENTS,
  MINIMUM_ATHLETE_AGE,
  calculateAgeFromDobIso,
  checkClientLegalConsentGate,
  checkClientLiveRecordingConsent,
  computeDeletedSubjectHash,
  isValidLegalSignature,
  recordLegalConsentAudit,
  validateAdultAthleteEligibility,
} from './legal-compliance'

describe('lib/legal-compliance', () => {
  it('enforces 18+ adult minimum athlete eligibility and deterministic SHA-256 document hashes', () => {
    expect(MINIMUM_ATHLETE_AGE).toBe(18)
    for (const doc of Object.values(LEGAL_DOCUMENTS)) {
      expect(doc.sha256).toMatch(/^[a-f0-9]{64}$/)
      expect(doc.version.length).toBeGreaterThan(5)
    }
  })

  it('computes deterministic 64-hex pseudonymized subject hashes for deleted account defense records', () => {
    const h1 = computeDeletedSubjectHash('user-123', 'Member@Example.com ')
    const h2 = computeDeletedSubjectHash('user-123', 'member@example.com')
    const h3 = computeDeletedSubjectHash('user-999', 'member@example.com')
    expect(h1).toMatch(/^[a-f0-9]{64}$/)
    expect(h1).toBe(h2)
    expect(h1).not.toBe(h3)
  })

  it('rejects placeholder or empty waiver signatures while accepting real full names', () => {
    expect(isValidLegalSignature('')).toBe(false)
    expect(isValidLegalSignature('   ')).toBe(false)
    expect(isValidLegalSignature('Verified Athlete')).toBe(false)
    expect(isValidLegalSignature('verified athlete')).toBe(false)
    expect(isValidLegalSignature('VIP Athlete')).toBe(false)
    expect(isValidLegalSignature('On File')).toBe(false)
    expect(isValidLegalSignature('Scott Gordon')).toBe(true)
    expect(isValidLegalSignature('María Elena Vázquez-O’Connor')).toBe(true)
  })

  it('records append-only consent rows with version, SHA-256 hash, and optional deleted_subject_sha256', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    const mockAdmin = {
      from: (table: string) => (table === 'legal_consent_audit_log' ? { insert: insertMock } : {}),
    }

    const delHash = computeDeletedSubjectHash('user-123', 'jane@example.com')
    const result = await recordLegalConsentAudit({
      adminClient: mockAdmin,
      userId: 'user-123',
      deletedSubjectSha256: delHash,
      documentTypes: ['terms_of_service', 'privacy_policy', 'consumer_health_biometric_policy'],
      typedSignature: 'Jane Athlete',
      ipAddress: '203.0.113.10',
      userAgent: 'Mozilla/5.0',
      metadata: { flow: 'signup_clickwrap', ageVerified18Plus: true },
    })

    expect(result.recorded).toBe(3)
    expect(insertMock).toHaveBeenCalledTimes(1)
    const insertedRows = insertMock.mock.calls[0][0]
    expect(insertedRows).toHaveLength(3)
    expect(insertedRows[0].document_version).toBe(LEGAL_DOCUMENTS.terms_of_service.version)
    expect(insertedRows[0].document_sha256).toBe(LEGAL_DOCUMENTS.terms_of_service.sha256)
    expect(insertedRows[0].typed_signature).toBe('Jane Athlete')
    expect(insertedRows[0].deleted_subject_sha256).toBe(delHash)
  })

  it('blocks unconsented users via checkClientLegalConsentGate and passes users with executed waivers', async () => {
    const emptyAdmin = {
      from: (table: string) => {
        if (table === 'client_intake_forms') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }
        }
        if (table === 'legal_consent_audit_log') {
          return {
            select: () => ({
              eq: () => ({
                limit: async () => ({ data: [], error: null }),
              }),
            }),
          }
        }
        return {}
      },
    }

    const blocked = await checkClientLegalConsentGate(emptyAdmin, 'oauth-unconsented-user')
    expect(blocked.verified).toBe(false)
    expect(blocked.missingDocuments).toEqual(['terms_of_service', 'athletic_liability_waiver'])

    const signedAuditAdmin = {
      from: (table: string) => {
        if (table === 'client_intake_forms') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }
        }
        if (table === 'legal_consent_audit_log') {
          return {
            select: () => ({
              eq: () => ({
                limit: async () => ({
                  data: [
                    { document_type: 'terms_of_service', typed_signature: 'Alex Mercer' },
                    { document_type: 'athletic_liability_waiver', typed_signature: 'Alex Mercer' },
                  ],
                  error: null,
                }),
              }),
            }),
          }
        }
        return {}
      },
    }

    const allowed = await checkClientLegalConsentGate(signedAuditAdmin, 'consented-user')
    expect(allowed.verified).toBe(true)
    expect(allowed.missingDocuments).toEqual([])
  })

  it('validates adult Date of Birth & 18+ age eligibility and blocks minor DOB even if age=25 is spoofed', () => {
    const refNow = new Date(Date.UTC(2026, 10, 17)) // 2026-11-17
    expect(calculateAgeFromDobIso('2008-11-17', refNow)).toBe(18)
    expect(calculateAgeFromDobIso('2008-11-18', refNow)).toBe(17)
    expect(calculateAgeFromDobIso('2000-02-30', refNow)).toBeNull()

    const spoofedMinor = validateAdultAthleteEligibility(
      { dateOfBirth: '2011-05-10', age: 25, requireAgeOrDob: true },
      refNow
    )
    expect(spoofedMinor.valid).toBe(false)
    expect(spoofedMinor.status).toBe(403)

    const validAdult = validateAdultAthleteEligibility(
      { dateOfBirth: '1994-06-20', requireAgeOrDob: true },
      refNow
    )
    expect(validAdult.valid).toBe(true)
    expect(validAdult.resolvedAge).toBe(32)
  })

  it('fails closed on checkClientLiveRecordingConsent when unconsented and passes when live_recording_soap_consent is logged', async () => {
    const unconsentedAdmin = {
      from: (table: string) => {
        if (table === 'legal_consent_audit_log') {
          return {
            select: () => ({
              eq: () => ({
                limit: async () => ({
                  data: [{ document_type: 'terms_of_service', consented_at: '2026-11-17T10:00:00Z' }],
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'client_intake_forms') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { parq_answers: {} }, error: null }),
              }),
            }),
          }
        }
        return {}
      },
    }

    const denied = await checkClientLiveRecordingConsent(unconsentedAdmin, 'athlete-no-wiretap')
    expect(denied.verified).toBe(false)
    expect(denied.reason).toContain('M.G.L. c. 272, § 99')

    const consentedAdmin = {
      from: (table: string) => {
        if (table === 'legal_consent_audit_log') {
          return {
            select: () => ({
              eq: () => ({
                limit: async () => ({
                  data: [
                    {
                      document_type: 'live_recording_soap_consent',
                      consented_at: '2026-11-17T13:00:00Z',
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }
        }
        return {}
      },
    }

    const allowed = await checkClientLiveRecordingConsent(consentedAdmin, 'athlete-wiretap-ok')
    expect(allowed.verified).toBe(true)
    expect(allowed.consentedAt).toBe('2026-11-17T13:00:00Z')
  })
})
