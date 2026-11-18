import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestAuthzMock, requireRoleMock, createSessionMock, supabaseAdminMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  requireRoleMock: vi.fn(),
  createSessionMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
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
    supabaseAdminMock.mockReturnValue({})
    createSessionMock.mockResolvedValue({ url: 'https://checkout.stripe.com/test' })
  })

  it('rejects checkout with 403 LEGAL_CONSENT_REQUIRED when client has no Terms consent on file', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'srv_test_key')
    supabaseAdminMock.mockReturnValueOnce({
      from: (table: string) => {
        if (table === 'client_intake_forms') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }
        }
        if (table === 'legal_consent_audit_log') {
          return {
            select: () => ({
              eq: () => ({
                limit: async () => ({ data: [], error: null }),
              }),
            }),
          }
        }
        return {}
      },
    })

    const req = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ packageId: 'forge-core', cadence: 'monthly' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.code).toBe('LEGAL_CONSENT_REQUIRED')
    expect(createSessionMock).not.toHaveBeenCalled()
    vi.unstubAllEnvs()
  })

  it('retires the old private coaching packages from new checkout', async () => {
    for (const packageId of ['lab', 'alumni', 'starter', 'momentum', 'transformation']) {
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

  it('rejects recurring subscription checkout with 400 AUTO_RENEWAL_CONSENT_REQUIRED when autoRenewalConsent is missing', async () => {
    const req = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ packageId: 'forge-core', cadence: 'monthly', acceptedTerms: true }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'AUTO_RENEWAL_CONSENT_REQUIRED',
    })
    expect(createSessionMock).not.toHaveBeenCalled()
  })

  it('rejects annual and 12-week prepayment cadences by default under month-to-month billing', async () => {
    for (const payload of [
      { packageId: 'forge-core', cadence: 'annual', autoRenewalConsent: true },
      { packageId: 'forge-pro-athlete', cadence: 'annual', autoRenewalConsent: true },
      { packageId: 'corporate', cadence: 'twelve_week' },
    ]) {
      const req = new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
      await expect(res.json()).resolves.toMatchObject({
        code: 'ANNUAL_BILLING_DISABLED',
      })
    }
    expect(createSessionMock).not.toHaveBeenCalled()
  })

  it('allows corporate team plan monthly checkout with proper recurring interval and cancel_url', async () => {
    const req = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ packageId: 'corporate', cadence: 'monthly', autoRenewalConsent: true }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    expect(createSessionMock).toHaveBeenCalledTimes(1)
    const createArgs = createSessionMock.mock.calls[0][0]
    expect(createArgs.mode).toBe('subscription')
    expect(createArgs.line_items[0].price_data.unit_amount).toBe(350000)
    expect(createArgs.line_items[0].price_data.recurring.interval).toBe('month')
    expect(createArgs.cancel_url).toBe('http://localhost/corporate#pricing')
    expect(createArgs.metadata.packageId).toBe('corporate')
  })

  it('allows corporate team plan annual checkout in payment mode when NEXT_PUBLIC_ENABLE_ANNUAL_PLANS=true', async () => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_ANNUAL_PLANS', 'true')
    try {
      const req = new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ packageId: 'corporate', cadence: 'twelve_week' }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)

      expect(createSessionMock).toHaveBeenCalledTimes(1)
      const createArgs = createSessionMock.mock.calls[0][0]
      expect(createArgs.mode).toBe('payment')
      expect(createArgs.line_items[0].price_data.unit_amount).toBe(3500000)
      expect(createArgs.line_items[0].price_data.product_data.name).toContain('Annual Team Plan')
      expect(createArgs.cancel_url).toBe('http://localhost/corporate#pricing')
      expect(createArgs.metadata.packageName).toContain('(Annual)')
    } finally {
      vi.unstubAllEnvs()
    }
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
      body: JSON.stringify({ packageId: 'forge-core', cadence: 'monthly', autoRenewalConsent: true }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const createArgs = createSessionMock.mock.calls[0][0]
    expect(createArgs.mode).toBe('subscription')
    expect(createArgs.line_items[0].price_data.unit_amount).toBe(4900)
    expect(createArgs.line_items[0].price_data.recurring).toEqual({ interval: 'month' })
    expect(createArgs.subscription_data.trial_period_days).toBe(7)
    expect(createArgs.metadata.packageName).toBe('Core')
    expect(createArgs.metadata.trialDays).toBe('7')
  })

  it('bills Core annually at $399 with the same seven-day trial when NEXT_PUBLIC_ENABLE_ANNUAL_PLANS=true', async () => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_ANNUAL_PLANS', 'true')
    try {
      const req = new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ packageId: 'forge-core', cadence: 'annual', autoRenewalConsent: true }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
      const createArgs = createSessionMock.mock.calls[0][0]
      expect(createArgs.line_items[0].price_data.unit_amount).toBe(39900)
      expect(createArgs.line_items[0].price_data.recurring).toEqual({ interval: 'year' })
      expect(createArgs.subscription_data.trial_period_days).toBe(7)
      expect(createArgs.metadata.cadence).toBe('annual')
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('bills Plus annually at $899 without a trial when NEXT_PUBLIC_ENABLE_ANNUAL_PLANS=true', async () => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_ANNUAL_PLANS', 'true')
    try {
      createSessionMock.mockClear()
      const req = new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ packageId: 'forge-pro-athlete', cadence: 'annual', autoRenewalConsent: true }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
      const createArgs = createSessionMock.mock.calls[0][0]
      expect(createArgs.line_items[0].price_data.unit_amount).toBe(89900)
      expect(createArgs.line_items[0].price_data.recurring).toEqual({ interval: 'year' })
      expect(createArgs.subscription_data.trial_period_days).toBeUndefined()
      expect(createArgs.metadata.cadence).toBe('annual')
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('creates Pro Athlete and Transformation Direct monthly subscriptions without a trial', async () => {
    for (const [packageId, amount] of [
      ['forge-pro-athlete', 9900],
      ['forge-transformation-direct', 29900],
    ] as const) {
      createSessionMock.mockClear()
      const req = new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ packageId, cadence: 'monthly', autoRenewalConsent: true }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
      const createArgs = createSessionMock.mock.calls[0][0]
      expect(createArgs.line_items[0].price_data.unit_amount).toBe(amount)
      expect(createArgs.line_items[0].price_data.recurring).toEqual({ interval: 'month' })
      expect(createArgs.subscription_data.trial_period_days).toBeUndefined()
    }
  })

  it('applies HOLIDAY25 25% Rate Lock discount to Forge memberships', async () => {
    const req = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({
        packageId: 'forge-core',
        cadence: 'monthly',
        discountCode: 'HOLIDAY25',
        autoRenewalConsent: true,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const createArgs = createSessionMock.mock.calls[0][0]
    expect(createArgs.mode).toBe('subscription')
    // $49.00 (4900 cents) - 25% (1225 cents) = 3675 cents ($36.75)
    expect(createArgs.line_items[0].price_data.unit_amount).toBe(3675)
    expect(createArgs.line_items[0].price_data.product_data.name).toBe('Core (HOLIDAY25 Rate Lock)')
    expect(createArgs.metadata.discountCode).toBe('HOLIDAY25')
    expect(createArgs.metadata.discountAmountCents).toBe('1225')
  })

  it('rejects unsupported membership billing cadences even when annual plans are enabled', async () => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_ANNUAL_PLANS', 'true')
    try {
      const req = new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({
          packageId: 'forge-transformation-direct',
          cadence: 'annual',
          autoRenewalConsent: true,
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
      await expect(res.json()).resolves.toEqual({
        error: 'Annual billing is not available for this membership',
      })
      expect(createSessionMock).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllEnvs()
    }
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

  it('enables Stripe automatic_tax and attaches canonical legalTermsVersion metadata when STRIPE_AUTOMATIC_TAX_ENABLED=true', async () => {
    const previousTaxEnv = process.env.STRIPE_AUTOMATIC_TAX_ENABLED
    process.env.STRIPE_AUTOMATIC_TAX_ENABLED = 'true'
    try {
      const req = new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ packageId: 'forge-core', cadence: 'monthly', autoRenewalConsent: true }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const createArgs = createSessionMock.mock.calls[0][0]
      expect(createArgs.automatic_tax).toEqual({ enabled: true })
      expect(createArgs.metadata.legalTermsVersion).toBe('tos-2026.11.11')
    } finally {
      if (previousTaxEnv === undefined) {
        delete process.env.STRIPE_AUTOMATIC_TAX_ENABLED
      } else {
        process.env.STRIPE_AUTOMATIC_TAX_ENABLED = previousTaxEnv
      }
    }
  })
})
