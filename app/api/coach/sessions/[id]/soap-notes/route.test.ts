import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestAuthzMock, requireCoachAssignedClientMock, supabaseAdminMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  requireCoachAssignedClientMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
    requireCoachAssignedClient: requireCoachAssignedClientMock,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

import { POST } from '@/app/api/coach/sessions/[id]/soap-notes/route'
import { AuthzError } from '@/lib/authz'

const coachUser = { user: { id: 'coach-1' }, client: { role: 'coach' } }

function makeAdmin(
  session: unknown,
  options?: {
    auditConsents?: Array<{ document_type: string; consented_at?: string }>
    auditInsertSpy?: ReturnType<typeof vi.fn>
  }
) {
  return {
    from(table: string) {
      if (table === 'sessions') {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: async () => ({ data: session, error: null }),
                }
              },
            }
          },
        }
      }
      if (table === 'legal_consent_audit_log') {
        return {
          select() {
            return {
              eq() {
                return {
                  limit: async () => ({
                    data: options?.auditConsents ?? [],
                    error: null,
                  }),
                }
              },
            }
          },
          insert: options?.auditInsertSpy ?? (async () => ({ error: null })),
        }
      }
      if (table === 'client_intake_forms') {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: async () => ({ data: null, error: null }),
                }
              },
            }
          },
        }
      }
      return {}
    },
  }
}

describe('POST /api/coach/sessions/[id]/soap-notes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated requests', async () => {
    getRequestAuthzMock.mockRejectedValue(new AuthzError('Unauthorized', 401))

    const req = new NextRequest('http://localhost/api/coach/sessions/s-1/soap-notes', {
      method: 'POST',
      body: JSON.stringify({ rawNotes: 'Test notes' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 's-1' }) })
    expect(res.status).toBe(401)
  })

  it('rejects empty rawNotes', async () => {
    getRequestAuthzMock.mockResolvedValue(coachUser)

    const req = new NextRequest('http://localhost/api/coach/sessions/s-1/soap-notes', {
      method: 'POST',
      body: JSON.stringify({ rawNotes: '   ' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 's-1' }) })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Raw notes content is required')
  })

  it('synthesizes clinical SOAP notes for valid session', async () => {
    getRequestAuthzMock.mockResolvedValue(coachUser)
    requireCoachAssignedClientMock.mockResolvedValue(undefined)
    supabaseAdminMock.mockReturnValue(
      makeAdmin({
        id: 's-1',
        client_id: 'c-1',
        scheduled_at: '2026-08-28T14:00:00Z',
        status: 'completed',
        clients: { name: 'Alex Mercer' },
      })
    )

    const req = new NextRequest('http://localhost/api/coach/sessions/s-1/soap-notes', {
      method: 'POST',
      body: JSON.stringify({
        rawNotes: 'Squat 225x5x3. Felt great. Knee valgus on set 3.',
        mode: 'clinical_soap',
      }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 's-1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.data.formattedNotes).toContain('[S] SUBJECTIVE')
    expect(json.data.formattedNotes).toContain('[O] OBJECTIVE')
    expect(json.data.formattedNotes).toContain('[A] ASSESSMENT')
    expect(json.data.formattedNotes).toContain('[P] PLAN')
  })

  it('synthesizes clinical SOAP notes when client has full_name', async () => {
    getRequestAuthzMock.mockResolvedValue(coachUser)
    requireCoachAssignedClientMock.mockResolvedValue(undefined)
    supabaseAdminMock.mockReturnValue(
      makeAdmin({
        id: 's-2',
        client_id: 'c-2',
        scheduled_at: '2026-08-28T14:00:00Z',
        status: 'completed',
        clients: { full_name: 'Jordan Brooks' },
      })
    )

    const req = new NextRequest('http://localhost/api/coach/sessions/s-2/soap-notes', {
      method: 'POST',
      body: JSON.stringify({
        rawNotes: 'Romanian deadlifts 185x8x3. Good hip hinge, spine neutral.',
      }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 's-2' }) })
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toContain('no-store')
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.data.formattedNotes).toContain('[S] SUBJECTIVE')
  })

  it('rejects rawNotes exceeding 12,000 characters with 413', async () => {
    getRequestAuthzMock.mockResolvedValue(coachUser)

    const req = new NextRequest('http://localhost/api/coach/sessions/s-2/soap-notes', {
      method: 'POST',
      body: JSON.stringify({
        rawNotes: 'A'.repeat(12_005),
      }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 's-2' }) })
    expect(res.status).toBe(413)
    expect(res.headers.get('cache-control')).toContain('no-store')
  })

  it('rejects unsupported mode values with 400', async () => {
    getRequestAuthzMock.mockResolvedValue(coachUser)

    const req = new NextRequest('http://localhost/api/coach/sessions/s-2/soap-notes', {
      method: 'POST',
      body: JSON.stringify({
        rawNotes: 'Squat 225x5x3.',
        mode: 'arbitrary_invalid_mode',
      }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 's-2' }) })
    expect(res.status).toBe(400)
    expect(res.headers.get('cache-control')).toContain('no-store')
  })

  it('rejects voice dictation without coach recording law attestation (403)', async () => {
    getRequestAuthzMock.mockResolvedValue(coachUser)

    const req = new NextRequest('http://localhost/api/coach/sessions/s-2/soap-notes', {
      method: 'POST',
      body: JSON.stringify({
        rawNotes: 'Dictated via mic without checking compliance box.',
        voiceDictationUsed: true,
        coachRecordingAttested: false,
      }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 's-2' }) })
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toContain('M.G.L. c. 272, § 99')
  })

  it('blocks live_bilateral_consented SOAP synthesis when athlete lacks signed live_recording_soap_consent (403)', async () => {
    getRequestAuthzMock.mockResolvedValue(coachUser)
    requireCoachAssignedClientMock.mockResolvedValue(undefined)
    supabaseAdminMock.mockReturnValue(
      makeAdmin(
        {
          id: 's-live-1',
          client_id: 'c-live-1',
          scheduled_at: '2026-11-17T15:00:00Z',
          status: 'scheduled',
          clients: { full_name: 'Jordan Brooks', user_id: 'athlete-user-1' },
        },
        { auditConsents: [] }
      )
    )

    const req = new NextRequest('http://localhost/api/coach/sessions/s-live-1/soap-notes', {
      method: 'POST',
      body: JSON.stringify({
        rawNotes: 'Live session cueing notes.',
        captureContext: 'live_bilateral_consented',
        coachRecordingAttested: true,
        voiceDictationUsed: true,
      }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 's-live-1' }) })
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toContain('M.G.L. c. 272, § 99')
  })

  it('allows live_bilateral_consented SOAP synthesis and writes coach audit row when athlete has signed live_recording_soap_consent', async () => {
    getRequestAuthzMock.mockResolvedValue(coachUser)
    requireCoachAssignedClientMock.mockResolvedValue(undefined)
    const auditInsertSpy = vi.fn().mockResolvedValue({ error: null })
    supabaseAdminMock.mockReturnValue(
      makeAdmin(
        {
          id: 's-live-2',
          client_id: 'c-live-2',
          scheduled_at: '2026-11-17T15:00:00Z',
          status: 'scheduled',
          clients: { full_name: 'Jordan Brooks', user_id: 'athlete-user-2' },
        },
        {
          auditConsents: [
            {
              document_type: 'live_recording_soap_consent',
              consented_at: '2026-11-17T14:58:00Z',
            },
          ],
          auditInsertSpy,
        }
      )
    )

    const req = new NextRequest('http://localhost/api/coach/sessions/s-live-2/soap-notes', {
      method: 'POST',
      body: JSON.stringify({
        rawNotes: 'Back squat 225x5x3. Strong bracing.',
        captureContext: 'live_bilateral_consented',
        coachRecordingAttested: true,
        voiceDictationUsed: true,
      }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 's-live-2' }) })
    expect(res.status).toBe(200)
    expect(auditInsertSpy).toHaveBeenCalledTimes(1)
    expect(auditInsertSpy.mock.calls[0][0][0].document_type).toBe('live_recording_soap_consent')
  })
})

