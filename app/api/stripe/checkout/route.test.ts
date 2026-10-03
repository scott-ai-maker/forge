import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestAuthzMock, requireRoleMock, supabaseAdminMock, createSessionMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  requireRoleMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
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

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

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

function createDiscountAdmin(discount: Record<string, unknown> | null) {
  return {
    from(table: string) {
      if (table !== 'discount_codes') {
        throw new Error(`Unexpected table: ${table}`)
      }

      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => ({ data: discount, error: null }),
              }
            },
          }
        },
      }
    },
  }
}

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

  it('applies a valid percentage discount code', async () => {
    supabaseAdminMock.mockReturnValue(
      createDiscountAdmin({
        id: 'code-1',
        code: 'COACH-15OFF',
        description: null,
        discount_type: 'percent',
        discount_value: 15,
        is_active: true,
        max_redemptions: null,
        redemptions_count: 0,
        starts_at: new Date(Date.now() - 60_000).toISOString(),
        expires_at: new Date(Date.now() + 3600_000).toISOString(),
        applies_to_package_ids: null,
        restricted_client_id: null,
      })
    )

    const req = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ packageId: 'starter', discountCode: 'coach-15off' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    expect(createSessionMock).toHaveBeenCalledTimes(1)
    const createArgs = createSessionMock.mock.calls[0][0]
    expect(createArgs.mode).toBe('subscription')
    expect(createArgs.line_items[0].price_data.recurring).toEqual({ interval: 'month' })
    expect(createArgs.line_items[0].price_data.unit_amount).toBe(20400)
    expect(createArgs.metadata.discountCode).toBe('COACH-15OFF')

    await expect(res.json()).resolves.toMatchObject({
      pricing: {
        basePriceCents: 24000,
        discountAmountCents: 3600,
        finalPriceCents: 20400,
      },
    })
  })

  it('rejects expired discount codes', async () => {
    supabaseAdminMock.mockReturnValue(
      createDiscountAdmin({
        id: 'code-1',
        code: 'OLDCODE',
        description: null,
        discount_type: 'fixed_amount',
        discount_value: 1000,
        is_active: true,
        max_redemptions: null,
        redemptions_count: 0,
        starts_at: new Date(Date.now() - 3600_000).toISOString(),
        expires_at: new Date(Date.now() - 60_000).toISOString(),
        applies_to_package_ids: null,
        restricted_client_id: null,
      })
    )

    const req = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ packageId: 'starter', discountCode: 'oldcode' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({
      error: 'This discount code is inactive or expired',
    })
  })

  it('attaches selected addons to line items and metadata', async () => {
    const req = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({
        packageId: 'starter',
        selectedAddonIds: ['metabolic-nutrition'],
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    expect(createSessionMock).toHaveBeenCalledTimes(1)
    const createArgs = createSessionMock.mock.calls[0][0]
    expect(createArgs.line_items).toHaveLength(2)
    expect(createArgs.line_items[1].price_data.unit_amount).toBe(14900)
    expect(createArgs.metadata.selectedAddonIds).toBe('metabolic-nutrition')
  })

  it('handles 12-week PIF cadence with one-time payment mode, correct sessions, and 3x recurring addon', async () => {
    const req = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({
        packageId: 'starter',
        cadence: 'twelve_week',
        selectedAddonIds: ['metabolic-nutrition'],
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    expect(createSessionMock).toHaveBeenCalledTimes(1)
    const createArgs = createSessionMock.mock.calls[0][0]

    // Verify mode is payment (not subscription)
    expect(createArgs.mode).toBe('payment')
    expect(createArgs.subscription_data).toBeUndefined()

    // Main package line item
    expect(createArgs.line_items[0].price_data.recurring).toBeUndefined()
    expect(createArgs.line_items[0].price_data.unit_amount).toBe(65000)
    expect(createArgs.line_items[0].price_data.product_data.name).toContain('12-Week Transformation Block')

    // Addon line item should be 3x because it's recurring_monthly billed upfront
    expect(createArgs.line_items[1].price_data.recurring).toBeUndefined()
    expect(createArgs.line_items[1].price_data.unit_amount).toBe(14900 * 3)

    // Metadata contains correct cadence and total sessions
    expect(createArgs.metadata.cadence).toBe('twelve_week')
    expect(createArgs.metadata.sessionsTotal).toBe('12')
    expect(createArgs.metadata.packageName).toBe('Starter Pack (12-Week Block)')

    await expect(res.json()).resolves.toMatchObject({
      pricing: {
        basePriceCents: 65000,
        discountAmountCents: 0,
        finalPriceCents: 65000,
      },
    })
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

  it('handles Autonomous Digital Lab (lab) checkout in both monthly subscription and annual PIF mode', async () => {
    // Monthly subscription ($59/mo)
    const reqMonthly = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({
        packageId: 'lab',
        cadence: 'monthly',
      }),
    })

    const resMonthly = await POST(reqMonthly)
    expect(resMonthly.status).toBe(200)

    const monthlyArgs = createSessionMock.mock.calls[0][0]
    expect(monthlyArgs.mode).toBe('subscription')
    expect(monthlyArgs.line_items[0].price_data.unit_amount).toBe(5900)
    expect(monthlyArgs.line_items[0].price_data.recurring).toEqual({ interval: 'month' })

    createSessionMock.mockClear()

    // Annual Pass PIF ($499/yr)
    const reqAnnual = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({
        packageId: 'lab',
        cadence: 'twelve_week',
      }),
    })

    const resAnnual = await POST(reqAnnual)
    expect(resAnnual.status).toBe(200)

    const annualArgs = createSessionMock.mock.calls[0][0]
    expect(annualArgs.mode).toBe('payment')
    expect(annualArgs.subscription_data).toBeUndefined()
    expect(annualArgs.line_items[0].price_data.unit_amount).toBe(49900)
    expect(annualArgs.line_items[0].price_data.recurring).toBeUndefined()
    expect(annualArgs.metadata.packageName).toBe('Autonomous Digital Lab (12-Week Block)')
  })

  it('handles Alumni Continuity Retainer (alumni) checkout in both monthly and annual PIF mode', async () => {
    // Monthly subscription ($149/mo)
    const reqMonthly = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({
        packageId: 'alumni',
        cadence: 'monthly',
      }),
    })

    const resMonthly = await POST(reqMonthly)
    expect(resMonthly.status).toBe(200)

    const monthlyArgs = createSessionMock.mock.calls[0][0]
    expect(monthlyArgs.mode).toBe('subscription')
    expect(monthlyArgs.line_items[0].price_data.unit_amount).toBe(14900)
    expect(monthlyArgs.line_items[0].price_data.recurring).toEqual({ interval: 'month' })

    createSessionMock.mockClear()

    // Annual Pass PIF ($1,295/yr)
    const reqAnnual = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({
        packageId: 'alumni',
        cadence: 'twelve_week',
      }),
    })

    const resAnnual = await POST(reqAnnual)
    expect(resAnnual.status).toBe(200)

    const annualArgs = createSessionMock.mock.calls[0][0]
    expect(annualArgs.mode).toBe('payment')
    expect(annualArgs.subscription_data).toBeUndefined()
    expect(annualArgs.line_items[0].price_data.unit_amount).toBe(129500)
    expect(annualArgs.line_items[0].price_data.recurring).toBeUndefined()
    expect(annualArgs.metadata.packageName).toBe('Alumni Continuity Retainer (12-Week Block)')
  })

  it('handles Corporate Executive Retainer (corporate) checkout in both monthly and annual PIF mode', async () => {
    // Monthly subscription ($3,500/mo)
    const reqMonthly = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({
        packageId: 'corporate',
        cadence: 'monthly',
      }),
    })

    const resMonthly = await POST(reqMonthly)
    expect(resMonthly.status).toBe(200)

    const monthlyArgs = createSessionMock.mock.calls[0][0]
    expect(monthlyArgs.mode).toBe('subscription')
    expect(monthlyArgs.line_items[0].price_data.unit_amount).toBe(350000)
    expect(monthlyArgs.line_items[0].price_data.recurring).toEqual({ interval: 'month' })

    createSessionMock.mockClear()

    // Annual Corporate Pass PIF ($35,000/yr)
    const reqAnnual = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({
        packageId: 'corporate',
        cadence: 'twelve_week',
      }),
    })

    const resAnnual = await POST(reqAnnual)
    expect(resAnnual.status).toBe(200)

    const annualArgs = createSessionMock.mock.calls[0][0]
    expect(annualArgs.mode).toBe('payment')
    expect(annualArgs.subscription_data).toBeUndefined()
    expect(annualArgs.line_items[0].price_data.unit_amount).toBe(3500000)
    expect(annualArgs.line_items[0].price_data.recurring).toBeUndefined()
    expect(annualArgs.metadata.packageName).toBe('Corporate Executive Retainer (12-Week Block)')
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
    expect(jsonBody.error).toContain('gordonathleticadvisory.com')

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
