import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  getRequestAuthzMock,
  requireRoleMock,
  requireCoachAssignedClientMock,
  transitionClientStatusMock,
  getClientLifecycleAuditTrailMock,
  supabaseAdminMock,
} = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  requireRoleMock: vi.fn(),
  requireCoachAssignedClientMock: vi.fn(),
  transitionClientStatusMock: vi.fn(),
  getClientLifecycleAuditTrailMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
    requireRole: requireRoleMock,
    requireCoachAssignedClient: requireCoachAssignedClientMock,
  }
})

vi.mock('@/lib/client-lifecycle', async () => {
  const actual = await vi.importActual<typeof import('@/lib/client-lifecycle')>('@/lib/client-lifecycle')
  return {
    ...actual,
    transitionClientStatus: transitionClientStatusMock,
    getClientLifecycleAuditTrail: getClientLifecycleAuditTrailMock,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

import { GET, PATCH } from '@/app/api/coach/clients/[id]/status/route'
import { AuthzError } from '@/lib/authz'
import { ClientLifecycleError } from '@/lib/client-lifecycle'

describe('client status & lifecycle audit route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseAdminMock.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'client-1',
                email: 'athlete@example.com',
                full_name: 'Test Athlete',
                status: 'active',
                status_reason: 'New Client Enrollment',
                status_updated_at: '2026-08-28T00:00:00.000Z',
              },
              error: null,
            }),
          }),
        }),
      }),
    })
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'coach-1', email: 'scott.gordon72@outlook.com' },
      client: { role: 'coach' },
    })
    requireCoachAssignedClientMock.mockResolvedValue(undefined)
  })

  it('returns unauthorized when authz fails', async () => {
    getRequestAuthzMock.mockRejectedValue(new AuthzError('Unauthorized', 401))

    const res = await GET(new NextRequest('http://localhost/api/coach/clients/client-1/status'), {
      params: Promise.resolve({ id: 'client-1' }),
    })

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toEqual({ error: 'Unauthorized' })
  })

  it('fetches status and audit logs on GET', async () => {
    getClientLifecycleAuditTrailMock.mockResolvedValue([
      {
        id: 'log-1',
        client_id: 'client-1',
        actor_name: 'Scott Gordon',
        action: 'activation',
        previous_status: 'inactive',
        new_status: 'active',
        reason_code: 'reactivation_approved',
        created_at: '2026-08-28T00:00:00.000Z',
      },
    ])

    const res = await GET(new NextRequest('http://localhost/api/coach/clients/client-1/status'), {
      params: Promise.resolve({ id: 'client-1' }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('active')
    expect(json.auditLogs).toHaveLength(1)
  })

  it('updates client status on PATCH and records audit trail', async () => {
    transitionClientStatusMock.mockResolvedValue({
      success: true,
      client: {
        id: 'client-1',
        email: 'athlete@example.com',
        full_name: 'Test Athlete',
        status: 'paused',
        status_reason: 'Injury / Medical Hold',
        status_updated_at: '2026-08-28T12:00:00.000Z',
      },
      auditLog: {
        id: 'log-2',
        client_id: 'client-1',
        actor_id: 'coach-1',
        new_status: 'paused',
        reason_code: 'injury_medical_leave',
      },
    })

    const req = new NextRequest('http://localhost/api/coach/clients/client-1/status', {
      method: 'PATCH',
      body: JSON.stringify({
        newStatus: 'paused',
        reasonCode: 'injury_medical_leave',
        reasonNotes: 'Resting sprained ankle',
      }),
    })

    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'client-1' }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.client.status).toBe('paused')
    expect(transitionClientStatusMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        clientId: 'client-1',
        coachId: 'coach-1',
        newStatus: 'paused',
        reasonCode: 'injury_medical_leave',
      })
    )
  })

  it('returns 400 when transition validation fails', async () => {
    transitionClientStatusMock.mockRejectedValue(
      new ClientLifecycleError('Category mismatch for status reason', 400, 'CATEGORY_MISMATCH')
    )

    const req = new NextRequest('http://localhost/api/coach/clients/client-1/status', {
      method: 'PATCH',
      body: JSON.stringify({
        newStatus: 'active',
        reasonCode: 'injury_medical_leave',
      }),
    })

    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'client-1' }),
    })

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/Category mismatch/)
  })
})

