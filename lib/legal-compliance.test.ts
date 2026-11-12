import { describe, expect, it, vi } from 'vitest'
import {
  LEGAL_DOCUMENTS,
  MINIMUM_ATHLETE_AGE,
  isValidLegalSignature,
  recordLegalConsentAudit,
} from './legal-compliance'

describe('lib/legal-compliance', () => {
  it('enforces 18+ adult minimum athlete eligibility and deterministic SHA-256 document hashes', () => {
    expect(MINIMUM_ATHLETE_AGE).toBe(18)
    for (const doc of Object.values(LEGAL_DOCUMENTS)) {
      expect(doc.sha256).toMatch(/^[a-f0-9]{64}$/)
      expect(doc.version.length).toBeGreaterThan(5)
    }
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

  it('records append-only consent rows with version and SHA-256 hash', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    const mockAdmin = {
      from: (table: string) => (table === 'legal_consent_audit_log' ? { insert: insertMock } : {}),
    }

    const result = await recordLegalConsentAudit({
      adminClient: mockAdmin,
      userId: 'user-123',
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
  })
})

