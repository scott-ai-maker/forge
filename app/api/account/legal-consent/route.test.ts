import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestAuthzMock, requireRoleMock, insertMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  requireRoleMock: vi.fn(),
  insertMock: vi.fn(),
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
  supabaseAdmin: () => ({
    from: (table: string) => {
      if (table === 'legal_consent_audit_log') {
        return { insert: insertMock }
      }
      return {}
    },
  }),
}))

import { POST } from './route'

describe('POST /api/account/legal-consent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'user-1', email: 'athlete@example.com' },
      client: { role: 'client' },
    })
    requireRoleMock.mockReturnValue(undefined)
    insertMock.mockResolvedValue({ error: null })
  })

  it('rejects athletic_liability_waiver without a valid typed full legal name signature (400)', async () => {
    const req = new NextRequest('http://localhost/api/account/legal-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentTypes: ['terms_of_service', 'athletic_liability_waiver'],
        ageVerified18Plus: true,
        affirmativeAssent: true,
        typedSignature: 'Verified Athlete',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('returns 500 instead of false 200 success when audit ledger insert fails', async () => {
    insertMock.mockResolvedValueOnce({ error: { message: 'db write failure' } })

    const req = new NextRequest('http://localhost/api/account/legal-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentTypes: ['terms_of_service', 'athletic_liability_waiver'],
        ageVerified18Plus: true,
        affirmativeAssent: true,
        typedSignature: 'Elena Rostova',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('records all 4 clickwrap & ESIGN waiver rows when valid', async () => {
    const req = new NextRequest('http://localhost/api/account/legal-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentTypes: [
          'terms_of_service',
          'privacy_policy',
          'consumer_health_biometric_policy',
          'athletic_liability_waiver',
        ],
        ageVerified18Plus: true,
        affirmativeAssent: true,
        typedSignature: 'Elena Rostova',
        flow: 'oauth_mandatory_clickwrap_gate',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.recorded).toBe(4)
    expect(insertMock).toHaveBeenCalledTimes(1)
  })
})
