import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { AuthzError } from '@/lib/authz'

const {
  getRequestAuthzMock,
  subscriptionsListMock,
  subscriptionsCancelMock,
  adminUpdateMock,
  adminDeleteUserMock,
  transitionClientStatusMock,
} = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  subscriptionsListMock: vi.fn(),
  subscriptionsCancelMock: vi.fn(),
  adminUpdateMock: vi.fn(),
  adminDeleteUserMock: vi.fn(),
  transitionClientStatusMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
  }
})

vi.mock('@/lib/stripe', () => ({
  stripe: {
    customers: {
      list: vi.fn().mockResolvedValue({ data: [{ id: 'cus_client_1' }] }),
    },
    subscriptions: {
      list: subscriptionsListMock,
      cancel: subscriptionsCancelMock,
    },
  },
}))

vi.mock('@/lib/client-lifecycle', () => ({
  transitionClientStatus: transitionClientStatusMock,
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { email: 'client@example.com', stripe_customer_id: 'cus_client_1' },
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: adminUpdateMock,
      }),
    })),
    auth: {
      admin: {
        deleteUser: adminDeleteUserMock,
      },
    },
  })),
}))

import { DELETE } from './route'

describe('DELETE /api/account/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123')
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'client-del-1' },
      client: { role: 'client' },
    })
    adminUpdateMock.mockResolvedValue({ error: null })
    adminDeleteUserMock.mockResolvedValue({ error: null })
    subscriptionsListMock.mockResolvedValue({
      data: [
        { id: 'sub_active_1', status: 'active' },
        { id: 'sub_trial_2', status: 'trialing' },
      ],
    })
    subscriptionsCancelMock.mockResolvedValue({ id: 'sub_canceled' })
    transitionClientStatusMock.mockResolvedValue({ success: true })
  })

  it('rejects unauthenticated requests with 401', async () => {
    getRequestAuthzMock.mockRejectedValueOnce(new AuthzError('Unauthorized', 401))
    const req = new NextRequest('http://localhost:3000/api/account/delete', { method: 'DELETE' })
    const res = await DELETE(req)
    expect(res.status).toBe(401)
  })

  it('cancels active subscriptions, records lifecycle deactivation, and deletes user profile', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/delete', { method: 'DELETE' })
    const res = await DELETE(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.deleted).toBe(true)

    // Verify Stripe active subscriptions were cancelled
    expect(subscriptionsCancelMock).toHaveBeenCalledWith('sub_active_1')
    expect(subscriptionsCancelMock).toHaveBeenCalledWith('sub_trial_2')

    // Verify lifecycle audit transition was logged
    expect(transitionClientStatusMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        clientId: 'client-del-1',
        newStatus: 'inactive',
        reasonCode: 'client_requested_cancellation',
      })
    )

    // Verify auth deletion was invoked
    expect(adminDeleteUserMock).toHaveBeenCalledWith('client-del-1')
  })
})

