import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestAuthzMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
  }
})

import { POST } from './route'
import { AuthzError } from '@/lib/authz'

describe('POST /api/coach/workouts/generate-rag', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated requests with 401', async () => {
    getRequestAuthzMock.mockRejectedValueOnce(new AuthzError('Unauthorized', 401))
    const req = new NextRequest('http://localhost:3000/api/coach/workouts/generate-rag', {
      method: 'POST',
      body: JSON.stringify({ goal: 'hypertrophy' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('rejects non-coach users with 403 Forbidden', async () => {
    getRequestAuthzMock.mockResolvedValueOnce({
      user: { id: 'client-1' },
      client: { role: 'client' },
    })
    const req = new NextRequest('http://localhost:3000/api/coach/workouts/generate-rag', {
      method: 'POST',
      body: JSON.stringify({ goal: 'hypertrophy' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toBe('Forbidden')
  })

  it('allows coach users to generate RAG programs', async () => {
    getRequestAuthzMock.mockResolvedValueOnce({
      user: { id: 'coach-1' },
      client: { role: 'coach' },
    })
    const req = new NextRequest('http://localhost:3000/api/coach/workouts/generate-rag', {
      method: 'POST',
      body: JSON.stringify({
        clientName: 'Alexander',
        clientAge: 35,
        goal: 'hypertrophy',
        targetNasmPhase: 3,
        trainingDaysPerWeek: 3,
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.program).toBeDefined()
    expect(data.program.nasmOptPhase).toBe(3)
  })
})

