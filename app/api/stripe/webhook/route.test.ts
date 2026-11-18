import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
  constructEventMock,
  transitionClientStatusMock,
  adminFromMock,
  sendTransactionalEmailMock,
} = vi.hoisted(() => ({
  constructEventMock: vi.fn(),
  transitionClientStatusMock: vi.fn(),
  adminFromMock: vi.fn(),
  sendTransactionalEmailMock: vi.fn().mockResolvedValue({ id: 'email_123' }),
}))

vi.mock('@/lib/notifications', () => ({
  notifyUser: vi.fn().mockResolvedValue({ channels: [] }),
}))

vi.mock('@/lib/marketing-email', () => ({
  getBaseUrl: () => 'https://forge-athletic.app',
  sendTransactionalEmail: sendTransactionalEmailMock,
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

  it('handles checkout.session.completed for subscription: links customer, activates client, and sends MA 3-business-day statutory confirmation email', async () => {
    const notificationInsertMock = vi.fn().mockResolvedValue({ error: null })
    adminFromMock.mockImplementation((table: string) => {
      if (table === 'clients') {
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'client-1', status: 'inactive', stripe_customer_id: null, email: 'athlete@example.com' },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'notification_log') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          insert: notificationInsertMock,
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
            packageId: 'forge-core',
            packageName: 'Core',
            sessionsTotal: '0',
            cadence: 'monthly',
            finalPriceCents: '4900',
            trialDays: '7',
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

    expect(sendTransactionalEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'athlete@example.com',
        subject: expect.stringContaining('Subscription Confirmation & Cancellation Rights'),
        text: expect.stringContaining('M.G.L. c. 93, §§ 81–82'),
      })
    )
    expect(sendTransactionalEmailMock.mock.calls[0][0].text).toContain(
      'https://forge-athletic.app/dashboard/settings'
    )
    expect(notificationInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'client-1',
        type: 'subscription_confirmation',
        dedupe_key: 'billing-ack:cs_123',
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

  it('handles customer.subscription.trial_will_end: sends 3-day free-trial-ending reminder email with 1-click cancellation link', async () => {
    const notificationInsertMock = vi.fn().mockResolvedValue({ error: null })
    adminFromMock.mockImplementation((table: string) => {
      if (table === 'clients') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'client-1', email: 'trial@example.com' },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'notification_log') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          insert: notificationInsertMock,
        }
      }
      return {}
    })

    constructEventMock.mockReturnValueOnce({
      type: 'customer.subscription.trial_will_end',
      data: {
        object: {
          id: 'sub_trial_1',
          customer: 'cus_123',
          trial_end: 1795478400,
          metadata: {
            clientId: 'client-1',
            packageName: 'Core',
            cadence: 'monthly',
            finalPriceCents: '4900',
          },
        },
      },
    })

    const res = await POST(makeWebhookRequest())
    expect(res.status).toBe(200)
    expect(sendTransactionalEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'trial@example.com',
        subject: expect.stringContaining('Core free trial ends'),
        text: expect.stringContaining('$49.00/month'),
      })
    )
    expect(notificationInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'client-1',
        type: 'trial_ending_reminder',
        dedupe_key: 'trial-ending:sub_trial_1:1795478400',
      })
    )
  })

  it('handles invoice.upcoming: sends upcoming subscription renewal notice email', async () => {
    const notificationInsertMock = vi.fn().mockResolvedValue({ error: null })
    adminFromMock.mockImplementation((table: string) => {
      if (table === 'notification_log') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          insert: notificationInsertMock,
        }
      }
      return {}
    })

    constructEventMock.mockReturnValueOnce({
      id: 'evt_upcoming_1',
      type: 'invoice.upcoming',
      data: {
        object: {
          customer: 'cus_123',
          customer_email: 'renewal@example.com',
          amount_due: 9900,
          next_payment_attempt: 1796083200,
          parent: {
            subscription_details: {
              metadata: {
                clientId: 'client-1',
                packageName: 'Plus',
                cadence: 'monthly',
              },
            },
          },
        },
      },
    })

    const res = await POST(makeWebhookRequest())
    expect(res.status).toBe(200)
    expect(sendTransactionalEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'renewal@example.com',
        subject: expect.stringContaining('Upcoming Plus Renewal'),
        text: expect.stringContaining('$99.00'),
      })
    )
    expect(notificationInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'client-1',
        type: 'upcoming_renewal_notice',
        dedupe_key: 'invoice-upcoming:cus_123:1796083200',
      })
    )
  })
})
