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

function makeAdmin(session: unknown) {
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
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.data.formattedNotes).toContain('[S] SUBJECTIVE')
  })
})

