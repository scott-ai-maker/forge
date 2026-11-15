import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestAuthzMock, supabaseAdminMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

import { POST } from '@/app/api/coach/clients/[id]/consultant-memo/route'
import { AuthzError } from '@/lib/authz'

describe('/api/coach/clients/[id]/consultant-memo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'coach-123' },
      client: { role: 'coach' },
    })
  })

  it('rejects unauthenticated requests with 401 and no-store cache headers', async () => {
    getRequestAuthzMock.mockRejectedValue(new AuthzError('Unauthorized', 401))
    const req = new NextRequest('http://localhost:3000/api/coach/clients/client-456/consultant-memo', {
      method: 'POST',
      body: JSON.stringify({ opt_phase: 1 }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'client-456' }) })
    expect(res.status).toBe(401)
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0')
  })

  it('rejects unassigned coach access with 403', async () => {
    supabaseAdminMock.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: { id: 'client-456', full_name: 'Dr. Evelyn Vance', designated_coach_id: 'other-coach' },
              error: null,
            }),
          }),
        }),
      }),
    })

    const req = new NextRequest('http://localhost:3000/api/coach/clients/client-456/consultant-memo', {
      method: 'POST',
      body: JSON.stringify({ opt_phase: 2 }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'client-456' }) })
    expect(res.status).toBe(403)
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0')
  })

  it('clamps out-of-range telemetry numbers, strips angle brackets/control chars, and dispatches memo', async () => {
    let insertedMessage: Record<string, unknown> | null = null

    supabaseAdminMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'clients') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: { id: 'client-456', full_name: 'Dr. Evelyn Vance', designated_coach_id: 'coach-123' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'coach_client_messages') {
          return {
            insert: async (payload: Record<string, unknown>) => {
              insertedMessage = payload
              return { error: null }
            },
          }
        }
        return {}
      },
    })

    const req = new NextRequest('http://localhost:3000/api/coach/clients/client-456/consultant-memo', {
      method: 'POST',
      body: JSON.stringify({
        opt_phase: 99,
        total_sets_logged: -12,
        target_sets_planned: 0,
        avg_readiness: 0,
        cex_streak_days: 6,
        custom_notes: 'Dial in <script>alert(1)</script>4/2/1 tempo on goblet squats.\u0007',
        dispatch_to_client_messages: true,
      }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'client-456' }) })
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0')
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.memo.fullMemoMarkdown).toContain('Phase 5')
    expect(json.memo.fullMemoMarkdown).not.toContain('<script>')
    expect(json.memo.fullMemoMarkdown).toContain('4/2/1 tempo on goblet squats.')
    expect((insertedMessage as { client_id?: string } | null)?.client_id).toBe('client-456')
  })
})
