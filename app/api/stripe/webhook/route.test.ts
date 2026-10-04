import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
  constructEventMock,
  transitionClientStatusMock,
  adminFromMock,
} = vi.hoisted(() => ({
  constructEventMock: vi.fn(),
  transitionClientStatusMock: vi.fn(),
  adminFromMock: vi.fn(),
}))

vi.mock('@/lib/notifications', () => ({
  notifyUser: vi.fn().mockResolvedValue({ channels: [] }),
}))

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: constructEventMock,
    },
  },
}))

vi.mock('@/lib/client-lifecycle', () => ({
  transitionClientStatus: transitionClientStatusMock,
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: vi.fn(() => ({
    from: adminFromMock,
    rpc: vi.fn().mockResolvedValue({ error: null }),
  })),
}))

import { POST } from './route'

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123')
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_123')

    // Default Supabase queries
    adminFromMock.mockImplementation((table: string) => {
      if (table === 'clients') {
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'client-1', status: 'active', stripe_customer_id: 'cus_123' },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'client_packages') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        }
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
    })
  })

  function makeWebhookRequest(payload = '{}') {
    return new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'sig_test',
        'content-type': 'application/json',
      },
      body: payload,
    })
  }

  it('grants a feature entitlement (and no session package) for a paid video review add-on', async () => {
    const entitlementUpsert = vi.fn().mockResolvedValue({ error: null })
    const packageInsert = vi.fn().mockResolvedValue({ error: null })
    adminFromMock.mockImplementation((table: string) => {
      if (table === 'client_addon_entitlements') return { upsert: entitlementUpsert }
      if (table === 'client_packages') return { insert: packageInsert }
      return {
        upsert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'client-1', status: 'active', stripe_customer_id: 'cus_123' }, error: null }),
          }),
        }),
      }
    })
    constructEventMock.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_addon',
          mode: 'payment',
          payment_status: 'paid',
          payment_intent: 'pi_addon',
          customer: 'cus_123',
          metadata: { clientId: 'client-1', packageId: 'addon-video-review-pack', packageName: 'Technique Video Review Pack', sessionsTotal: '0', source: 'forge_addon' },
        },
      },
    })

    const res = await POST(makeWebhookRequest())
    expect(res.status).toBe(200)
    expect(entitlementUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: 'client-1', feature: 'video-review', uses_remaining: 4, stripe_payment_id: 'pi_addon' }),
      { onConflict: 'stripe_payment_id', ignoreDuplicates: true }
    )
    expect(packageInsert).not.toHaveBeenCalled()
  })

  it('handles checkout.session.completed for subscription: links customer and activates client', async () => {
    adminFromMock.mockImplementation((table: string) => {
      if (table === 'clients') {
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'client-1', status: 'inactive', stripe_customer_id: null },
                error: null,
              }),
            }),
          }),
        }
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
    })

    constructEventMock.mockReturnValueOnce({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123',
          mode: 'subscription',
          customer: 'cus_123',
          customer_details: { email: 'athlete@example.com' },
          metadata: {
            clientId: 'client-1',
            packageName: 'VIP Coaching',
            sessionsTotal: '12',
          },
        },
      },
    })

    const res = await POST(makeWebhookRequest())
    expect(res.status).toBe(200)

    expect(transitionClientStatusMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        clientId: 'client-1',
        newStatus: 'active',
        reasonCode: 'new_enrollment',
      })
    )
  })

  it('handles invoice.payment_failed: places client on financial hold', async () => {
    constructEventMock.mockReturnValueOnce({
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_failed_123',
          customer: 'cus_123',
          parent: {
            subscription_details: {
              metadata: {
                clientId: 'client-1',
              },
            },
          },
        },
      },
    })

    const res = await POST(makeWebhookRequest())
    expect(res.status).toBe(200)

    expect(transitionClientStatusMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        clientId: 'client-1',
        newStatus: 'paused',
        reasonCode: 'financial_hold',
      })
    )
  })

  it('handles customer.subscription.deleted: marks client inactive', async () => {
    constructEventMock.mockReturnValueOnce({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_deleted_123',
          customer: 'cus_123',
          metadata: {
            clientId: 'client-1',
          },
          cancellation_details: {
            reason: 'payment_failed',
          },
        },
      },
    })

    const res = await POST(makeWebhookRequest())
    expect(res.status).toBe(200)

    expect(transitionClientStatusMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        clientId: 'client-1',
        newStatus: 'inactive',
        reasonCode: 'non_payment',
      })
    )
  })

  it('handles customer.subscription.updated past_due: pauses client account', async () => {
    constructEventMock.mockReturnValueOnce({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_pastdue_123',
          status: 'past_due',
          customer: 'cus_123',
          metadata: {
            clientId: 'client-1',
          },
        },
      },
    })

    const res = await POST(makeWebhookRequest())
    expect(res.status).toBe(200)

    expect(transitionClientStatusMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        clientId: 'client-1',
        newStatus: 'paused',
        reasonCode: 'financial_hold',
      })
    )
  })
})
