import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetRateLimiterForTests } from '@/src/lib/security/rateLimiter'

const { getRequestAuthzMock, supabaseAdminMock, validateClientUniquenessMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  supabaseAdminMock: vi.fn(() => ({})),
  validateClientUniquenessMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return { ...actual, getRequestAuthz: getRequestAuthzMock }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

vi.mock('@/lib/client-lifecycle', () => ({
  validateClientUniqueness: validateClientUniquenessMock,
}))

import { POST } from './route'

describe('POST /api/coach/clients/duplicity (#38)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimiterForTests()
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'coach-alpha' },
      client: { role: 'coach', status: 'active' },
    })
  })

  it('redacts cross-coach client PII when matched client belongs to another coach', async () => {
    validateClientUniquenessMock.mockResolvedValueOnce({
      isUnique: false,
      duplicateField: 'email',
      existingClient: {
        id: 'secret-client-uuid',
        email: 'vip@private.com',
        full_name: 'Private Executive',
        status: 'active',
        designated_coach_id: 'coach-bravo',
      },
    })

    const req = new NextRequest('http://localhost:3000/api/coach/clients/duplicity', {
      method: 'POST',
      body: JSON.stringify({ email: 'vip@private.com' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.isUnique).toBe(false)
    expect(json.assignedToAnotherCoach).toBe(true)
    expect(json.existingClient).toBeUndefined()
  })
})
