import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  getRequestAuthzMock,
  requireRoleMock,
  supabaseAdminMock,
  enforceRateLimitMock,
  recordLegalConsentAuditMock,
} = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  requireRoleMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
  recordLegalConsentAuditMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
    requireRole: requireRoleMock,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

vi.mock('@/lib/rate-limit', () => ({
  enforceRateLimit: enforceRateLimitMock,
}))

vi.mock('@/lib/legal-compliance', async () => {
  const actual = await vi.importActual<typeof import('@/lib/legal-compliance')>('@/lib/legal-compliance')
  return {
    ...actual,
    recordLegalConsentAudit: recordLegalConsentAuditMock,
  }
})

import { POST } from './route'

describe('POST /api/account/erap (Pre-Session 1:1 ERAP Location & Dispatch Check-In)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'athlete-1', email: 'athlete@example.com' },
      client: { role: 'client' },
    })
    requireRoleMock.mockReturnValue(undefined)
    enforceRateLimitMock.mockResolvedValue({ allowed: true, remaining: 29, resetAt: Date.now() + 60_000 })
    recordLegalConsentAuditMock.mockResolvedValue({ ok: true })
  })

  it('rejects bare 911 instead of a 10-digit local municipal emergency dispatch phone', async () => {
    const req = new NextRequest('http://localhost/api/account/erap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workoutStreetAddress: '125 Newbury St',
        workoutCity: 'Boston',
        workoutState: 'MA',
        workoutPostalCode: '02116',
        localEmergencyDispatchPhone: '911',
        emergencyContactName: 'Jordan Taylor',
        emergencyContactPhone: '617-555-0192',
        hasAcceptedVirtualTelehealthConsent: true,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('10-digit')
  })

  it('rejects missing virtual telehealth emergency dispatch consent', async () => {
    const req = new NextRequest('http://localhost/api/account/erap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workoutStreetAddress: '125 Newbury St',
        workoutCity: 'Boston',
        workoutState: 'MA',
        workoutPostalCode: '02116',
        localEmergencyDispatchPhone: '617-343-4911',
        emergencyContactName: 'Jordan Taylor',
        emergencyContactPhone: '617-555-0192',
        hasAcceptedVirtualTelehealthConsent: false,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('rejects missing separate all-party live recording & S.O.A.P. consent (M.G.L. c. 272, § 99)', async () => {
    const req = new NextRequest('http://localhost/api/account/erap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workoutStreetAddress: '125 Newbury St',
        workoutCity: 'Boston',
        workoutState: 'MA',
        workoutPostalCode: '02116',
        localEmergencyDispatchPhone: '617-343-4911',
        emergencyContactName: 'Jordan Taylor',
        emergencyContactPhone: '617-555-0192',
        hasAcceptedVirtualTelehealthConsent: true,
        hasAcceptedAllPartyRecordingConsent: false,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('M.G.L. c. 272, § 99')
  })

  it('persists live workout location, gate code, 10-digit dispatch, and all-party recording consent while preserving PAR-Q flags', async () => {
    const updateSpy = vi.fn((_payload: Record<string, unknown>) => ({
      eq: async () => ({ error: null }),
    }))
    supabaseAdminMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'client_intake_forms') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    user_id: 'athlete-1',
                    consent_signature_name: 'Marcus Vance',
                    consent_signed_at: '2026-11-01T12:00:00Z',
                    parq_answers: {
                      hasBoneOrJointProblem: true,
                      reportedConditionsNotes: 'Mild knee irritation',
                    },
                  },
                }),
              }),
            }),
            update: updateSpy,
          }
        }
        return {}
      },
    })

    const req = new NextRequest('http://localhost/api/account/erap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workoutStreetAddress: '500 Boylston St',
        workoutUnitOrGateCode: 'Suite 1200 · Code #8821',
        workoutCity: 'Boston',
        workoutState: 'MA',
        workoutPostalCode: '02116',
        localEmergencyDispatchPhone: '617-343-4911',
        emergencyContactName: 'Elena Vance',
        emergencyContactPhone: '617-555-0188',
        hasAcceptedVirtualTelehealthConsent: true,
        hasAcceptedAllPartyRecordingConsent: true,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.erap.isErapComplete).toBe(true)
    expect(body.erap.workoutStreetAddress).toBe('500 Boylston St')
    expect(body.erap.workoutUnitOrGateCode).toBe('Suite 1200 · Code #8821')
    expect(body.erap.localEmergencyDispatchPhone).toBe('617-343-4911')

    expect(updateSpy).toHaveBeenCalledTimes(1)
    const updatedPayload = updateSpy.mock.calls[0][0]
    const savedParq = updatedPayload.parq_answers as Record<string, unknown>
    expect(savedParq.hasBoneOrJointProblem).toBe(true)
    expect(savedParq.workoutStreetAddress).toBe('500 Boylston St')
    expect(savedParq.hasAcceptedAllPartyRecordingConsent).toBe(true)
    expect(recordLegalConsentAuditMock).toHaveBeenCalledTimes(1)
    expect(recordLegalConsentAuditMock.mock.calls[0][0].documentTypes).toContain(
      'live_recording_soap_consent'
    )
  })

  it('rejects ERAP submission with 409 PARQ_SCREENING_REQUIRED when PAR-Q+ intake does not exist instead of fabricating all-false medical answers', async () => {
    const insertSpy = vi.fn()
    supabaseAdminMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'client_intake_forms') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null }),
              }),
            }),
            insert: insertSpy,
          }
        }
        return {}
      },
    })

    const req = new NextRequest('http://localhost/api/account/erap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workoutStreetAddress: '500 Boylston St',
        workoutCity: 'Boston',
        workoutState: 'MA',
        workoutPostalCode: '02116',
        localEmergencyDispatchPhone: '617-343-4911',
        emergencyContactName: 'Elena Vance',
        emergencyContactPhone: '617-555-0188',
        hasAcceptedVirtualTelehealthConsent: true,
        hasAcceptedAllPartyRecordingConsent: true,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.code).toBe('PARQ_SCREENING_REQUIRED')
    expect(insertSpy).not.toHaveBeenCalled()
  })
})
