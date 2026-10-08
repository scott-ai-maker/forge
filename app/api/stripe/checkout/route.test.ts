import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestAuthzMock, requireRoleMock, createSessionMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  requireRoleMock: vi.fn(),
  createSessionMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
    requireRole: requireRoleMock,
  }
})

vi.mock('@/lib/stripe', () => ({
  PACKAGES: [
    {
      id: 'lab',
      name: 'Autonomous Digital Lab',
      sessions: 0,
      price: 5900,
      pifPriceCents: 49900,
      pifSessions: 0,
      pifSavings: '$209',
      pifBonusDescription: 'Full 12-Month Annual Pass',
    },
    {
      id: 'alumni',
      name: 'Alumni Continuity Retainer',
      sessions: 0,
      price: 14900,
      pifPriceCents: 129500,
      pifSessions: 0,
      pifSavings: '$493',
      pifBonusDescription: 'Full 12-Month Maintenance Pass',
    },
    {
      id: 'starter',
      name: 'Starter Pack',
      sessions: 4,
      price: 24000,
      pifPriceCents: 65000,
      pifSessions: 12,
      pifSavings: '$70',
      pifBonusDescription: 'Complimentary Diagnostic Screen',
    },
    {
      id: 'momentum',
      name: 'Legacy Coaching Package',
      sessions: 1,
      price: 64900,
    },
    {
      id: 'transformation',
      name: 'Legacy Private Retainer',
      sessions: 4,
      price: 149500,
    },
    {
      id: 'corporate',
      name: 'Corporate Executive Retainer',
      sessions: 1,
      price: 350000,
      pifPriceCents: 3500000,
      pifSessions: 12,
      pifSavings: '$7,000',
      pifBonusDescription: 'Full 12-Month Corporate License',
    },
  ],
  COACHING_ADDONS: [
    {
      id: 'metabolic-nutrition',
      name: 'Metabolic Nutrition Suite',
      subtitle: 'Clinical Metabolic Engine',
      billingType: 'recurring_monthly',
      priceCents: 14900,
      badge: 'Nutrition Engine',
      icon: 'lightning',
      description: 'Dynamic metabolic modeling',
      deliverables: ['Macro cycling'],
      recommendedFor: 'Recomp clients',
    },
  ],
  STANDALONE_PRODUCTS: [
    {
      id: 'ai-postural-audit',
      name: 'Clinical 3D AI Kinetic Chain & Postural Distortion Audit',
      subtitle: 'Self-Guided Biomechanical Diagnostics',
      priceCents: 9700,
      badge: 'Diagnostic Screen',
      icon: 'microscope',
      description: 'Instant computer-vision analysis of all 5 kinetic chain checkpoints',
      deliverables: ['Full 4-view AI landmark joint angle tracking'],
      valueProposition: 'Identifies root biomechanical causes',
      upsellCreditCents: 9700,
    },
  ],
  stripe: {
    checkout: {
      sessions: {
        create: createSessionMock,
      },
    },
  },
}))

import { POST } from '@/app/api/stripe/checkout/route'

describe('stripe checkout route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'test_key'
    process.env.APP_BASE_URL = 'http://localhost'
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'client-1' },
      client: { role: 'client' },
    })
    createSessionMock.mockResolvedValue({ url: 'https://checkout.stripe.com/test' })
  })

  it('retires the old private coaching packages from new checkout', async () => {
    for (const packageId of ['lab', 'alumni', 'starter', 'momentum', 'transformation', 'corporate']) {
      const req = new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ packageId, cadence: 'monthly' }),
      })

      const res = await POST(req)
      expect(res.status).toBe(410)
      await expect(res.json()).resolves.toMatchObject({
        error: 'This legacy plan is no longer available. Choose a current Forge Athletic membership.',
      })
    }
    expect(createSessionMock).not.toHaveBeenCalled()
  })

  it('handles standalone product checkout (e.g. ai-postural-audit) in payment mode', async () => {
    const req = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'ai-postural-audit',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    expect(createSessionMock).toHaveBeenCalledTimes(1)
    const createArgs = createSessionMock.mock.calls[0][0]

    expect(createArgs.mode).toBe('payment')
    expect(createArgs.subscription_data).toBeUndefined()
    expect(createArgs.line_items).toHaveLength(1)
    expect(createArgs.line_items[0].price_data.unit_amount).toBe(9700)
    expect(createArgs.line_items[0].price_data.product_data.name).toContain('Clinical 3D AI Kinetic Chain')
    expect(createArgs.metadata.productId).toBe('ai-postural-audit')
    expect(createArgs.metadata.source).toBe('audit_purchase')

    await expect(res.json()).resolves.toMatchObject({
      pricing: {
        basePriceCents: 9700,
        discountAmountCents: 0,
        finalPriceCents: 9700,
      },
    })
  })

  it('creates add-on and private session pack checkouts as one-time payments that grant session credits', async () => {
    const req = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ addonId: 'addon-private-session-4' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    const createArgs = createSessionMock.mock.calls[0][0]
    expect(createArgs.mode).toBe('payment')
    expect(createArgs.subscription_data).toBeUndefined()
    expect(createArgs.line_items[0].price_data.unit_amount).toBe(66000)
    expect(createArgs.line_items[0].price_data.recurring).toBeUndefined()
    expect(createArgs.metadata).toMatchObject({
      clientId: 'client-1',
      packageId: 'addon-private-session-4',
      sessionsTotal: '4',
      source: 'forge_addon',
    })
    expect(createArgs.cancel_url).toBe('http://localhost/packages#add-ons')
  })

  it('rejects unknown add-ons', async () => {
    const req = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ addonId: 'addon-does-not-exist' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(404)
    expect(createSessionMock).not.toHaveBeenCalled()
  })

  it('creates Core monthly subscriptions with a seven-day free trial', async () => {
    const req = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ packageId: 'forge-core', cadence: 'monthly' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const createArgs = createSessionMock.mock.calls[0][0]
    expect(createArgs.mode).toBe('subscription')
    expect(createArgs.line_items[0].price_data.unit_amount).toBe(1999)
    expect(createArgs.line_items[0].price_data.recurring).toEqual({ interval: 'month' })
    expect(createArgs.subscription_data.trial_period_days).toBe(7)
    expect(createArgs.metadata.packageName).toBe('Core')
  })

  it('bills Core annually at $149 with the same seven-day trial', async () => {
    const req = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ packageId: 'forge-core', cadence: 'annual' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const createArgs = createSessionMock.mock.calls[0][0]
    expect(createArgs.line_items[0].price_data.unit_amount).toBe(14900)
    expect(createArgs.line_items[0].price_data.recurring).toEqual({ interval: 'year' })
    expect(createArgs.subscription_data.trial_period_days).toBe(7)
    expect(createArgs.metadata.cadence).toBe('annual')
  })

  it('creates Pro Athlete and Transformation Direct monthly subscriptions without a trial', async () => {
    for (const [packageId, amount] of [
      ['forge-pro-athlete', 4900],
      ['forge-transformation-direct', 19900],
    ] as const) {
      createSessionMock.mockClear()
      const req = new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ packageId, cadence: 'monthly' }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
      const createArgs = createSessionMock.mock.calls[0][0]
      expect(createArgs.line_items[0].price_data.unit_amount).toBe(amount)
      expect(createArgs.line_items[0].price_data.recurring).toEqual({ interval: 'month' })
      expect(createArgs.subscription_data.trial_period_days).toBeUndefined()
    }
  })

  it('rejects unsupported membership billing cadences', async () => {
    const req = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ packageId: 'forge-pro-athlete', cadence: 'annual' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({
      error: 'Annual billing is not available for this membership',
    })
    expect(createSessionMock).not.toHaveBeenCalled()
  })

  it('strictly rejects native companion app checkout requests with 403 Forbidden', async () => {
    // Via x-capacitor-platform header
    const reqHeader = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'x-capacitor-platform': 'ios',
      },
      body: JSON.stringify({ packageId: 'starter' }),
    })
    const resHeader = await POST(reqHeader)
    expect(resHeader.status).toBe(403)
    const jsonHeader = await resHeader.json()
    expect(jsonHeader.error).toContain('mobile companion apps')

    // Via isNative in body
    const reqBody = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ packageId: 'starter', isNative: true }),
    })
    const resBody = await POST(reqBody)
    expect(resBody.status).toBe(403)
    const jsonBody = await resBody.json()
    expect(jsonBody.error).toContain('Forge Athletic website')

    // Via PWA companion platform in body
    const reqPwa = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ packageId: 'starter', platform: 'pwa', isCompanion: true }),
    })
    const resPwa = await POST(reqPwa)
    expect(resPwa.status).toBe(403)
    const jsonPwa = await resPwa.json()
    expect(jsonPwa.error).toContain('mobile companion apps')

    // Via x-companion-mode header
    const reqCompanionHeader = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      headers: { 'x-companion-mode': 'true' },
      body: JSON.stringify({ packageId: 'starter' }),
    })
    const resCompanionHeader = await POST(reqCompanionHeader)
    expect(resCompanionHeader.status).toBe(403)
  })
})
