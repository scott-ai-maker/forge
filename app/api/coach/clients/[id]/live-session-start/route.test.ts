import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { getRequestAuthz, requireCoachAssignedClient } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { notifyUser } from '@/lib/notifications'

vi.mock('@/lib/authz', () => ({
  getRequestAuthz: vi.fn(),
  requireCoachAssignedClient: vi.fn(),
  AuthzError: class AuthzError extends Error {
    status = 403
  },
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: vi.fn(),
}))

vi.mock('@/lib/notifications', () => ({
  notifyUser: vi.fn().mockResolvedValue({ channels: ['push'] }),
}))

describe('Live Session Start Alert API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unassigned coach requests', async () => {
    vi.mocked(getRequestAuthz).mockResolvedValue({
      user: { id: 'coach-123' },
      client: { role: 'coach' },
    } as unknown as Awaited<ReturnType<typeof getRequestAuthz>>)

    vi.mocked(requireCoachAssignedClient).mockRejectedValue(new Error('Forbidden'))

    const req = new NextRequest('http://localhost/api/coach/clients/client-456/live-session-start', {
      method: 'POST',
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'client-456' }) })
    expect(res.status).toBe(500)
  })

  it('successfully dispatches push and concierge alert to client', async () => {
    vi.mocked(getRequestAuthz).mockResolvedValue({
      user: { id: 'coach-123' },
      client: { role: 'coach' },
    } as unknown as Awaited<ReturnType<typeof getRequestAuthz>>)

    vi.mocked(requireCoachAssignedClient).mockResolvedValue(undefined)

    const mockAdmin = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'clients') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { full_name: 'Jordan Reed' }, error: null }),
              }),
            }),
          }
        }
        if (table === 'coach_client_messages') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          }
        }
        return {}
      }),
    }

    vi.mocked(supabaseAdmin).mockReturnValue(mockAdmin as unknown as ReturnType<typeof supabaseAdmin>)

    const req = new NextRequest('http://localhost/api/coach/clients/client-456/live-session-start', {
      method: 'POST',
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'client-456' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.pushSent).toBe(true)
    expect(notifyUser).toHaveBeenCalled()
  })
})
