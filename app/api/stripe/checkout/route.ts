import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { getTrustedAppBaseUrl } from '@/lib/app-base-url'
import {
  calculateDiscountAmountCents,
  isDiscountCodeActive,
  isDiscountCodeEligibleForPackage,
  normalizeDiscountCode,
  type DiscountCodeRecord,
} from '@/lib/discount-codes'
import { getForgeMembership, getForgeMembershipPrice } from '@/lib/forge-memberships'
import { getForgeAddon } from '@/lib/forge-addons'

export async function POST(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    const userId = authz.user.id

    // Zero In-App Purchase Compliance: In accordance with Apple App Store Guideline 3.1.3,
    // Google Play multiplatform policies, and PWA companion guidelines, purchases cannot occur on companion apps.
    const isCompanionHeader =
      req.headers.get('x-capacitor-platform') ||
      req.headers.get('x-app-platform') ||
      req.headers.get('x-companion-mode') ||
      req.headers.get('x-helper-mode')
    const userAgent = req.headers.get('user-agent') || ''
    const isCapacitorAgent = userAgent.includes('Capacitor')
    const isHelperCookie = req.cookies.get('gaa_helper_mode')?.value === '1'

    const body = await req.json()
    if (
      isCompanionHeader ||
      isCapacitorAgent ||
      isHelperCookie ||
      body?.isNative === true ||
      body?.platform === 'native' ||
      body?.isCompanion === true ||
      body?.platform === 'companion' ||
      body?.platform === 'pwa'
    ) {
      return NextResponse.json(
        {
          error:
            'Purchases cannot take place within mobile companion apps. Please manage memberships on the Forge Athletic website.',
        },
        { status: 403 }
      )
    }

    const packageId = body?.packageId
    const productId = body?.productId
    const addonId = body?.addonId
    const cadence = body?.cadence === 'twelve_week' ? 'twelve_week' : 'monthly'
    const isPif = cadence === 'twelve_week'
    const discountCodeInput = normalizeDiscountCode(typeof body?.discountCode === 'string' ? body.discountCode : '')

    if (
      (!packageId || typeof packageId !== 'string') &&
      (!productId || typeof productId !== 'string') &&
      (!addonId || typeof addonId !== 'string')
    ) {
      return NextResponse.json({ error: 'packageId, productId, or addonId is required' }, { status: 400 })
    }

    const { stripe, PACKAGES, COACHING_ADDONS, STANDALONE_PRODUCTS } = await import('@/lib/stripe')

    const forgeMembership = typeof packageId === 'string' ? getForgeMembership(packageId) : undefined
    if (forgeMembership) {
      if (body?.cadence !== 'monthly' && body?.cadence !== 'annual') {
        return NextResponse.json({ error: 'A valid membership billing cadence is required' }, { status: 400 })
      }

      const membershipPrice = getForgeMembershipPrice(forgeMembership, body.cadence)
      if (!membershipPrice) {
        return NextResponse.json({ error: 'Annual billing is not available for this membership' }, { status: 400 })
      }

      let appUrl: string
      try {
        appUrl = getTrustedAppBaseUrl()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'App base URL is not configured'
        return NextResponse.json({ error: message }, { status: 503 })
      }

      if (!process.env.STRIPE_SECRET_KEY || !stripe) {
        return NextResponse.json({
          error: 'Stripe payments are not currently configured. Please contact support or try again later.',
        }, { status: 503 })
      }

      const metadataPayload = {
        clientId: userId,
        packageId: forgeMembership.id,
        packageName: forgeMembership.name,
        sessionsTotal: '0',
        cadence: body.cadence,
        basePriceCents: String(membershipPrice.amountCents),
        finalPriceCents: String(membershipPrice.amountCents),
        source: 'forge_membership',
      }

      try {
        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          client_reference_id: userId,
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: forgeMembership.name,
                  description: forgeMembership.features.join(' · '),
                },
                recurring: { interval: membershipPrice.interval },
                unit_amount: membershipPrice.amountCents,
              },
              quantity: 1,
            },
          ],
          subscription_data: {
            metadata: metadataPayload,
            ...(forgeMembership.trialDays
              ? { trial_period_days: forgeMembership.trialDays }
              : {}),
          },
          metadata: metadataPayload,
          success_url: `${appUrl}/dashboard?success=true`,
          cancel_url: `${appUrl}/packages`,
        })

        return NextResponse.json({
          url: session.url,
          pricing: {
            basePriceCents: membershipPrice.amountCents,
            discountAmountCents: 0,
            finalPriceCents: membershipPrice.amountCents,
            discountCode: null,
          },
        })
      } catch (stripeErr) {
        const errMsg = stripeErr instanceof Error ? stripeErr.message : 'Stripe checkout error'
        return NextResponse.json({ error: errMsg }, { status: 400 })
      }
    }

    if (typeof addonId === 'string') {
      const addon = getForgeAddon(addonId)
      if (!addon) {
        return NextResponse.json({ error: 'Add-on not found' }, { status: 404 })
      }

      let appUrl: string
      try {
        appUrl = getTrustedAppBaseUrl()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'App base URL is not configured'
        return NextResponse.json({ error: message }, { status: 503 })
      }

      if (!process.env.STRIPE_SECRET_KEY || !stripe) {
        return NextResponse.json({
          error: 'Stripe payments are not currently configured. Please contact support or try again later.',
        }, { status: 503 })
      }

      // Add-ons are one-time payments so cancelling one can never affect the client's membership subscription.
      const metadataPayload = {
        clientId: userId,
        packageId: addon.id,
        packageName: addon.name,
        sessionsTotal: String(addon.sessions),
        cadence: 'one_time',
        basePriceCents: String(addon.priceCents),
        finalPriceCents: String(addon.priceCents),
        source: 'forge_addon',
      }

      try {
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          client_reference_id: userId,
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: addon.name,
                  description: addon.includes.join(' · '),
                },
                unit_amount: addon.priceCents,
              },
              quantity: 1,
            },
          ],
          payment_intent_data: { metadata: metadataPayload },
          metadata: metadataPayload,
          success_url: `${appUrl}/dashboard?success=true&addon=${encodeURIComponent(addon.id)}`,
          cancel_url: `${appUrl}/packages#add-ons`,
        })

        return NextResponse.json({
          url: session.url,
          pricing: {
            basePriceCents: addon.priceCents,
            discountAmountCents: 0,
            finalPriceCents: addon.priceCents,
            discountCode: null,
          },
        })
      } catch (stripeErr) {
        const errMsg = stripeErr instanceof Error ? stripeErr.message : 'Stripe checkout error'
        return NextResponse.json({ error: errMsg }, { status: 400 })
      }
    }

    if (productId) {
      const product = (STANDALONE_PRODUCTS || []).find(p => p.id === productId)
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      let appUrl: string
      try {
        appUrl = getTrustedAppBaseUrl()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'App base URL is not configured'
        return NextResponse.json({ error: message }, { status: 503 })
      }

      if (!process.env.STRIPE_SECRET_KEY || !stripe) {
        return NextResponse.json({
          error: 'Stripe payments are not currently configured. Please contact support or try again later.',
        }, { status: 503 })
      }

      const metadataPayload = {
        clientId: userId,
        productId: product.id,
        packageName: product.name,
        sessionsTotal: '0',
        cadence: 'one_time',
        basePriceCents: String(product.priceCents),
        finalPriceCents: String(product.priceCents),
        source: 'audit_purchase',
      }

      let session
      try {
        session = await stripe.checkout.sessions.create({
          mode: 'payment',
          client_reference_id: userId,
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: product.name,
                  description: product.description,
                },
                unit_amount: product.priceCents,
              },
              quantity: 1,
            },
          ],
          metadata: metadataPayload,
          success_url: `${appUrl}/dashboard/fitness?openScanner=true&auditSuccess=true`,
          cancel_url: `${appUrl}/audit`,
        })
      } catch (stripeErr) {
        const errMsg = stripeErr instanceof Error ? stripeErr.message : 'Stripe checkout error'
        return NextResponse.json({ error: errMsg }, { status: 400 })
      }

      return NextResponse.json({
        url: session.url,
        pricing: {
          basePriceCents: product.priceCents,
          discountAmountCents: 0,
          finalPriceCents: product.priceCents,
          discountCode: null,
        },
      })
    }

    if (typeof packageId === 'string' && PACKAGES.some(pkg => pkg.id === packageId)) {
      return NextResponse.json(
        { error: 'This legacy plan is no longer available. Choose a current Forge Athletic membership.' },
        { status: 410 }
      )
    }

    const pkg = PACKAGES.find(p => p.id === packageId)
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    const basePriceCents = isPif ? (pkg.pifPriceCents ?? pkg.price * 3) : pkg.price
    const packageSessions = isPif ? (pkg.pifSessions ?? pkg.sessions * 3) : pkg.sessions
    const packageNameWithCadence = isPif ? `${pkg.name} (12-Week Block)` : pkg.name

    const rawAddonIds: string[] = Array.isArray(body?.selectedAddonIds) ? body.selectedAddonIds : []
    const validAddons = (COACHING_ADDONS || []).filter(a => rawAddonIds.includes(a.id))
    const addonSessions = validAddons.reduce((sum, a) => sum + (a.sessions ?? 0), 0)
    const totalSessions = packageSessions + addonSessions

    let appliedDiscountCode: string | null = null
    let appliedDiscountType: 'percent' | 'fixed_amount' | null = null
    let appliedDiscountValue = 0
    let discountAmountCents = 0

    if (discountCodeInput) {
      const { supabaseAdmin } = await import('@/lib/supabase')
      const admin = supabaseAdmin()

      const { data: discount, error: discountError } = await admin
        .from('discount_codes')
        .select('id, code, description, discount_type, discount_value, is_active, max_redemptions, redemptions_count, starts_at, expires_at, applies_to_package_ids, restricted_client_id')
        .eq('code', discountCodeInput)
        .maybeSingle<DiscountCodeRecord>()

      if (discountError || !discount) {
        return NextResponse.json({ error: 'Invalid discount code' }, { status: 400 })
      }

      if (!isDiscountCodeActive(discount)) {
        return NextResponse.json({ error: 'This discount code is inactive or expired' }, { status: 400 })
      }

      if (discount.restricted_client_id && discount.restricted_client_id !== userId) {
        return NextResponse.json({ error: 'This discount code is not eligible for your account' }, { status: 403 })
      }

      if (!isDiscountCodeEligibleForPackage(discount, packageId)) {
        return NextResponse.json({ error: 'This discount code does not apply to this package' }, { status: 400 })
      }

      appliedDiscountCode = discount.code
      appliedDiscountType = discount.discount_type
      appliedDiscountValue = discount.discount_value
      discountAmountCents = calculateDiscountAmountCents(basePriceCents, discount.discount_type, discount.discount_value)
    }

    const finalAmountCents = basePriceCents - discountAmountCents

    // Handle 100% discount / VIP Demo Pass without requiring Stripe credit card
    if (finalAmountCents <= 0 || (appliedDiscountType === 'percent' && appliedDiscountValue >= 100)) {
      const { supabaseAdmin } = await import('@/lib/supabase')
      const admin = supabaseAdmin()

      // Ensure client exists
      await admin.from('clients').upsert(
        {
          id: userId,
          email: authz.user.email ?? `${userId}@placeholder.local`,
        },
        { onConflict: 'id' }
      )

      // Grant client package with all tier features & sessions
      const { error: pkgError } = await admin.from('client_packages').insert({
        client_id: userId,
        package_name: packageNameWithCadence,
        sessions_total: totalSessions,
        sessions_remaining: totalSessions,
        stripe_payment_id: `vip_promo_${Date.now()}`,
        source: 'purchase',
        discount_code: appliedDiscountCode,
        discount_amount_cents: basePriceCents,
      })

      if (pkgError) {
        return NextResponse.json({ error: 'Failed to activate package.' }, { status: 500 })
      }

      // Increment redemption count
      if (appliedDiscountCode) {
        const { data: dRow } = await admin
          .from('discount_codes')
          .select('id, redemptions_count')
          .eq('code', appliedDiscountCode)
          .maybeSingle()

        if (dRow) {
          await admin
            .from('discount_codes')
            .update({ redemptions_count: (dRow.redemptions_count || 0) + 1 })
            .eq('id', dRow.id)
        }
      }

      let appUrl: string
      try {
        appUrl = getTrustedAppBaseUrl()
      } catch {
        appUrl = ''
      }

      return NextResponse.json({
        url: `${appUrl}/dashboard?success=true&vip=true`,
        pricing: {
          basePriceCents,
          discountAmountCents: basePriceCents,
          finalPriceCents: 0,
          discountCode: appliedDiscountCode,
        },
      })
    }

    if (finalAmountCents < 50) {
      return NextResponse.json({
        error: 'Discount is too large for checkout. Use comp sessions for a fully free booking.',
      }, { status: 400 })
    }

    let appUrl: string
    try {
      appUrl = getTrustedAppBaseUrl()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'App base URL is not configured'
      return NextResponse.json({ error: message }, { status: 503 })
    }

    const lineItems: Array<{
      price_data: {
        currency: string
        product_data: { name: string; description?: string }
        recurring?: { interval: 'month' }
        unit_amount: number
      }
      quantity: number
    }> = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: isPif ? `${pkg.name} · 12-Week Transformation Block` : pkg.name,
            description: isPif
              ? (pkg.pifBonusDescription ? `12-week upfront commitment. ${pkg.pifBonusDescription}` : '12-week macrocycle periodization block.')
              : pkg.description,
          },
          ...(isPif ? {} : { recurring: { interval: 'month' as const } }),
          unit_amount: finalAmountCents,
        },
        quantity: 1,
      },
    ]

    for (const addon of validAddons) {
      const isRecurring = addon.billingType === 'recurring_monthly'
      // When checking out as a 12-week block, recurring monthly add-ons
      // are billed as a matching 3-month upfront block to prevent Stripe mode: 'payment' conflicts.
      const addonAmountCents = isPif && isRecurring ? addon.priceCents * 3 : addon.priceCents
      const addonName = isPif && isRecurring
        ? `${addon.name} (${addon.subtitle} · 12-Week Block)`
        : `${addon.name} (${addon.subtitle})`

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: addonName,
            description: addon.description,
          },
          ...(isPif ? {} : isRecurring ? { recurring: { interval: 'month' as const } } : {}),
          unit_amount: addonAmountCents,
        },
        quantity: 1,
      })
    }

    const metadataPayload = {
      clientId: userId,
      packageId: pkg.id,
      packageName: packageNameWithCadence,
      sessionsTotal: String(totalSessions),
      cadence,
      basePriceCents: String(basePriceCents),
      finalPriceCents: String(finalAmountCents),
      discountCode: appliedDiscountCode ?? '',
      discountType: appliedDiscountType ?? '',
      discountValue: String(appliedDiscountValue),
      discountAmountCents: String(discountAmountCents),
      selectedAddonIds: validAddons.map(a => a.id).join(','),
    }

    if (!process.env.STRIPE_SECRET_KEY || !stripe) {
      return NextResponse.json({
        error: 'Stripe payments are not currently configured. Please contact support or try again later.',
      }, { status: 503 })
    }

    let session
    try {
      session = await stripe.checkout.sessions.create({
        mode: isPif ? 'payment' : 'subscription',
        client_reference_id: userId,
        line_items: lineItems,
        ...(isPif
          ? {}
          : {
              subscription_data: {
                metadata: metadataPayload,
              },
            }),
        metadata: metadataPayload,
        success_url: `${appUrl}/dashboard?success=true`,
        cancel_url: `${appUrl}/packages`,
      })
    } catch (stripeErr) {
      const errMsg = stripeErr instanceof Error ? stripeErr.message : 'Stripe checkout error'
      return NextResponse.json({
        error: errMsg,
      }, { status: 400 })
    }

    return NextResponse.json({
      url: session.url,
      pricing: {
        basePriceCents,
        discountAmountCents,
        finalPriceCents: finalAmountCents,
        discountCode: appliedDiscountCode,
      },
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'Unexpected checkout error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
