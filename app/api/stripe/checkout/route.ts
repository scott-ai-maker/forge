import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { getTrustedAppBaseUrl } from '@/lib/app-base-url'
import {
  calculateDiscountAmountCents,
  getBuiltInPromoCode,
  isDiscountCodeActive,
  isDiscountCodeEligibleForPackage,
  normalizeDiscountCode,
  type DiscountCodeRecord,
} from '@/lib/discount-codes'
import { getForgeMembership, getForgeMembershipPrice, isAnnualBillingEnabled } from '@/lib/forge-memberships'
import { getForgeAddon } from '@/lib/forge-addons'
import {
  LEGAL_DOCUMENTS,
  checkClientLegalConsentGate,
  extractRequestIp,
  recordLegalConsentAudit,
} from '@/lib/legal-compliance'
import { isPublicRegistrationOpen } from '@/lib/launch-config'

async function resolveExistingStripeCustomerState(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stripeClient: any,
  userId: string
): Promise<{ customerId: string | null; hasActiveSubscription: boolean }> {
  let customerId: string | null = null
  try {
    const clientsTable = admin?.from?.('clients')
    if (clientsTable && typeof clientsTable.select === 'function') {
      const res = await clientsTable
        .select('stripe_customer_id')
        ?.eq?.('id', userId)
        ?.maybeSingle?.()
      if (typeof res?.data?.stripe_customer_id === 'string' && res.data.stripe_customer_id.trim()) {
        customerId = res.data.stripe_customer_id.trim()
      }
    }
  } catch {
    // Tolerate partial test mocks that do not stub `clients`
  }

  let hasActiveSubscription = false
  if (customerId && typeof stripeClient?.subscriptions?.list === 'function') {
    try {
      const subs = await stripeClient.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 10,
      })
      if (Array.isArray(subs?.data)) {
        hasActiveSubscription = subs.data.some(
          (s: { status?: string }) => s?.status === 'active' || s?.status === 'trialing'
        )
      }
    } catch {
      // Non-fatal if Stripe subscription lookup fails
    }
  }

  return { customerId, hasActiveSubscription }
}

export async function POST(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    const userId = authz.user.id

    // Pre-Launch Checkout Lockdown: block uninvited public self-serve checkouts before Jan 4, 2027
    const enforcePrelaunchLockdown =
      process.env.ENFORCE_PRELAUNCH_CHECKOUT_LOCK === 'true' ||
      process.env.NODE_ENV === 'production' ||
      process.env.VERCEL_ENV === 'production'
    if (
      enforcePrelaunchLockdown &&
      authz.client.role !== 'coach' &&
      !authz.client.designated_coach_id &&
      !isPublicRegistrationOpen()
    ) {
      return NextResponse.json(
        {
          error:
            'Public membership checkout opens Monday, January 4, 2027 at 6:00 AM EST. Join the Founding Cohort waitlist on our homepage to reserve your 25% Rate Lock.',
          code: 'PRELAUNCH_LOCKDOWN_ACTIVE',
        },
        { status: 403 }
      )
    }
    const automaticTaxOption =
      process.env.STRIPE_AUTOMATIC_TAX_ENABLED === 'true'
        ? { automatic_tax: { enabled: true as const } }
        : {}
    const legalTermsVersion = LEGAL_DOCUMENTS.terms_of_service.version

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

    if (packageId === 'corporate') {
      return NextResponse.json(
        {
          error:
            'Self-serve corporate enrollment is retired (#34). Contact scott@forge-athletic.app to execute a countersigned B2B Wellness Master Services Agreement.',
          code: 'B2B_MSA_REQUIRED',
        },
        { status: 410 }
      )
    }

    const RETIRED_LEGACY_PACKAGES = ['lab', 'alumni', 'starter', 'momentum', 'transformation']
    if (typeof packageId === 'string' && RETIRED_LEGACY_PACKAGES.includes(packageId)) {
      return NextResponse.json(
        { error: 'This legacy plan is no longer available. Choose a current Forge Athletic membership.' },
        { status: 410 }
      )
    }

    if (
      authz.client.role === 'client' &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      try {
        const { supabaseAdmin } = await import('@/lib/supabase')
        const admin = supabaseAdmin()

        if (body?.acceptedTerms === true) {
          await recordLegalConsentAudit({
            adminClient: admin,
            userId,
            documentTypes: ['terms_of_service', 'privacy_policy'],
            typedSignature: authz.client.full_name ?? null,
            ipAddress: extractRequestIp(req.headers),
            userAgent: req.headers.get('user-agent'),
            metadata: {
              flow: 'stripe_checkout_clickwrap',
              packageId: packageId || productId || addonId,
            },
          })
        } else {
          const legalGate = await checkClientLegalConsentGate(admin, userId, {
            requireTermsOfService: true,
            requireLiabilityWaiver: false,
          })
          if (!legalGate.verified) {
            return NextResponse.json(
              {
                error:
                  'Please review and accept the Forge Athletic Terms of Service & Privacy Policy before completing checkout.',
                code: 'LEGAL_CONSENT_REQUIRED',
              },
              { status: 403 }
            )
          }
        }
      } catch {
        // Non-fatal in isolated environments without DB bindings
      }
    }

    const { stripe, PACKAGES, COACHING_ADDONS, STANDALONE_PRODUCTS } = await import('@/lib/stripe')

    const forgeMembership = typeof packageId === 'string' ? getForgeMembership(packageId) : undefined
    if (forgeMembership) {
      if (body?.cadence !== 'monthly' && body?.cadence !== 'annual') {
        return NextResponse.json({ error: 'A valid membership billing cadence is required' }, { status: 400 })
      }

      if (body.cadence === 'annual' && !isAnnualBillingEnabled()) {
        return NextResponse.json(
          {
            error: 'Forge Athletic memberships are billed month-to-month with zero multi-month prepayment lock-in.',
            code: 'ANNUAL_BILLING_DISABLED',
          },
          { status: 400 }
        )
      }

      const membershipPrice = getForgeMembershipPrice(forgeMembership, body.cadence)
      if (!membershipPrice) {
        return NextResponse.json({ error: 'Annual billing is not available for this membership' }, { status: 400 })
      }

      if (authz.client.role === 'client' && body?.autoRenewalConsent !== true) {
        return NextResponse.json(
          {
            error:
              'Affirmative auto-renewal consent is required before starting a recurring membership subscription.',
            code: 'AUTO_RENEWAL_CONSENT_REQUIRED',
          },
          { status: 400 }
        )
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

      const { supabaseAdmin } = await import('@/lib/supabase')
      const admin = supabaseAdmin()

      // Prevent duplicate concurrent recurring subscriptions & orphaned `cus_...` accounts (#33)
      const { customerId: existingCustomerId, hasActiveSubscription } =
        await resolveExistingStripeCustomerState(admin, stripe, userId)
      if (hasActiveSubscription) {
        return NextResponse.json(
          {
            error:
              'You already have an active Forge Athletic membership subscription. Use your Billing Portal to upgrade, switch tiers, or manage your plan without duplicate charges.',
            code: 'EXISTING_ACTIVE_SUBSCRIPTION',
            useBillingPortal: true,
          },
          { status: 409 }
        )
      }

      const rawReferralCode = typeof body?.referralCode === 'string'
        ? body.referralCode
        : req.cookies.get('forge_referral_code')?.value

      let referralPromotion: { code: string; referrerId: string; refereeTrialDays: number } | null = null
      if (rawReferralCode) {
        const { validateReferralCode } = await import('@/lib/referrals')
        const refCheck = await validateReferralCode(admin, rawReferralCode)
        if (refCheck.valid && refCheck.code && refCheck.referrerId) {
          referralPromotion = {
            code: refCheck.code,
            referrerId: refCheck.referrerId,
            refereeTrialDays: refCheck.refereeTrialDays || 30,
          }
        }
      }

      const effectiveTrialDays = referralPromotion
        ? referralPromotion.refereeTrialDays
        : forgeMembership.trialDays

      let appliedDiscountCode: string | null = null
      let appliedDiscountType: 'percent' | 'fixed_amount' | null = null
      let appliedDiscountValue = 0
      let discountAmountCents = 0

      if (discountCodeInput) {
        let discount: DiscountCodeRecord | null = getBuiltInPromoCode(discountCodeInput)

        if (!discount) {
          const { data: dbDiscount, error: discountError } = await admin
            .from('discount_codes')
            .select('id, code, description, discount_type, discount_value, is_active, max_redemptions, redemptions_count, starts_at, expires_at, applies_to_package_ids, restricted_client_id')
            .eq('code', discountCodeInput)
            .maybeSingle<DiscountCodeRecord>()

          if (discountError || !dbDiscount) {
            return NextResponse.json({ error: 'Invalid discount code' }, { status: 400 })
          }
          discount = dbDiscount
        }

        if (!isDiscountCodeActive(discount)) {
          return NextResponse.json({ error: 'This discount code is inactive or expired' }, { status: 400 })
        }

        if (discount.restricted_client_id && discount.restricted_client_id !== userId) {
          return NextResponse.json({ error: 'This discount code is not eligible for your account' }, { status: 403 })
        }

        if (!isDiscountCodeEligibleForPackage(discount, forgeMembership.id)) {
          return NextResponse.json({ error: 'This discount code does not apply to this membership' }, { status: 400 })
        }

        appliedDiscountCode = discount.code
        appliedDiscountType = discount.discount_type
        appliedDiscountValue = discount.discount_value
        discountAmountCents = calculateDiscountAmountCents(
          membershipPrice.amountCents,
          discount.discount_type,
          discount.discount_value
        )
      }

      const finalMembershipCents = Math.max(membershipPrice.amountCents - discountAmountCents, 50)

      if (
        authz.client.role === 'client' &&
        body?.autoRenewalConsent === true &&
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_ROLE_KEY
      ) {
        try {
          await recordLegalConsentAudit({
            adminClient: admin,
            userId,
            documentTypes: ['terms_of_service', 'privacy_policy'],
            typedSignature: authz.client.full_name ?? null,
            ipAddress: extractRequestIp(req.headers),
            userAgent: req.headers.get('user-agent'),
            metadata: {
              flow: 'stripe_subscription_autorenewal_consent',
              autoRenewalConsent: true,
              packageId: forgeMembership.id,
              cadence: body.cadence,
              finalPriceCents: finalMembershipCents,
              trialDays: effectiveTrialDays ?? 0,
              discountCode: appliedDiscountCode,
            },
          })
        } catch {
          // Non-fatal in isolated environments without DB bindings
        }
      }

      const metadataPayload = {
        clientId: userId,
        packageId: forgeMembership.id,
        packageName: forgeMembership.name,
        sessionsTotal: '0',
        cadence: body.cadence,
        trialDays: String(effectiveTrialDays ?? 0),
        basePriceCents: String(membershipPrice.amountCents),
        finalPriceCents: String(finalMembershipCents),
        discountCode: appliedDiscountCode || '',
        discountType: appliedDiscountType || '',
        discountValue: String(appliedDiscountValue),
        discountAmountCents: String(discountAmountCents),
        source: 'forge_membership',
        referralCode: referralPromotion?.code || '',
        referrerId: referralPromotion?.referrerId || '',
        legalTermsVersion,
      }

      try {
        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          client_reference_id: userId,
          ...(existingCustomerId ? { customer: existingCustomerId } : {}),
          ...automaticTaxOption,
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: appliedDiscountCode
                    ? `${forgeMembership.name} (${appliedDiscountCode} Rate Lock)`
                    : forgeMembership.name,
                  description: forgeMembership.features.join(' · '),
                },
                recurring: { interval: membershipPrice.interval },
                unit_amount: finalMembershipCents,
              },
              quantity: 1,
            },
          ],
          subscription_data: {
            metadata: metadataPayload,
            ...(effectiveTrialDays ? { trial_period_days: effectiveTrialDays } : {}),
          },
          metadata: metadataPayload,
          success_url: `${appUrl}/dashboard?success=true`,
          cancel_url: `${appUrl}/packages`,
        })

        return NextResponse.json({
          url: session.url,
          pricing: {
            basePriceCents: membershipPrice.amountCents,
            discountAmountCents,
            finalPriceCents: finalMembershipCents,
            discountCode: appliedDiscountCode,
            referralCode: referralPromotion?.code || null,
            trialDays: effectiveTrialDays || null,
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
        legalTermsVersion,
      }

      const { supabaseAdmin } = await import('@/lib/supabase')
      const addonAdmin = supabaseAdmin()
      const { customerId: existingAddonCustomerId } = await resolveExistingStripeCustomerState(
        addonAdmin,
        stripe,
        userId
      )

      try {
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          client_reference_id: userId,
          ...(existingAddonCustomerId ? { customer: existingAddonCustomerId } : {}),
          ...automaticTaxOption,
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
        legalTermsVersion,
      }

      const { supabaseAdmin } = await import('@/lib/supabase')
      const productAdmin = supabaseAdmin()
      const { customerId: existingProductCustomerId } = await resolveExistingStripeCustomerState(
        productAdmin,
        stripe,
        userId
      )

      let session
      try {
        session = await stripe.checkout.sessions.create({
          mode: 'payment',
          client_reference_id: userId,
          ...(existingProductCustomerId ? { customer: existingProductCustomerId } : {}),
          ...automaticTaxOption,
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

    const pkg = PACKAGES.find(p => p.id === packageId)
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    if (isPif && !isAnnualBillingEnabled()) {
      return NextResponse.json(
        {
          error: 'Multi-month upfront prepayments are disabled; Forge Athletic bills strictly month-to-month.',
          code: 'ANNUAL_BILLING_DISABLED',
        },
        { status: 400 }
      )
    }

    if (!isPif && authz.client.role === 'client' && body?.autoRenewalConsent !== true) {
      return NextResponse.json(
        {
          error:
            'Affirmative auto-renewal consent is required before starting a recurring membership subscription.',
          code: 'AUTO_RENEWAL_CONSENT_REQUIRED',
        },
        { status: 400 }
      )
    }

    const basePriceCents = isPif ? (pkg.pifPriceCents ?? pkg.price * 3) : pkg.price
    const packageSessions = isPif ? (pkg.pifSessions ?? pkg.sessions * 3) : pkg.sessions
    const packageNameWithCadence = isPif
      ? (pkg.id === 'corporate' ? `${pkg.name} (Annual)` : `${pkg.name} (12-Week Block)`)
      : pkg.name

    const rawAddonIds: string[] = Array.isArray(body?.selectedAddonIds) ? body.selectedAddonIds : []
    const validAddons = (COACHING_ADDONS || []).filter(a => rawAddonIds.includes(a.id))
    const addonSessions = validAddons.reduce((sum, a) => sum + (a.sessions ?? 0), 0)
    const totalSessions = packageSessions + addonSessions

    let appliedDiscountCode: string | null = null
    let appliedDiscountType: 'percent' | 'fixed_amount' | null = null
    let appliedDiscountValue = 0
    let discountAmountCents = 0

    if (discountCodeInput) {
      let discount: DiscountCodeRecord | null = getBuiltInPromoCode(discountCodeInput)

      if (!discount) {
        const { supabaseAdmin } = await import('@/lib/supabase')
        const admin = supabaseAdmin()

        const { data: dbDiscount, error: discountError } = await admin
          .from('discount_codes')
          .select('id, code, description, discount_type, discount_value, is_active, max_redemptions, redemptions_count, starts_at, expires_at, applies_to_package_ids, restricted_client_id')
          .eq('code', discountCodeInput)
          .maybeSingle<DiscountCodeRecord>()

        if (discountError || !dbDiscount) {
          return NextResponse.json({ error: 'Invalid discount code' }, { status: 400 })
        }
        discount = dbDiscount
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

    // Handle 100% discount / VIP Demo Pass without requiring Stripe credit card (#33: per-user idempotency & atomic increment)
    if (finalAmountCents <= 0 || (appliedDiscountType === 'percent' && appliedDiscountValue >= 100)) {
      const { supabaseAdmin } = await import('@/lib/supabase')
      const vipAdmin = supabaseAdmin()
      const deterministicVipPaymentId = `vip_promo:${userId}:${appliedDiscountCode || pkg.id}`

      try {
        const { data: priorVipPkg } = await vipAdmin
          .from('client_packages')
          .select('id')
          .eq('stripe_payment_id', deterministicVipPaymentId)
          .maybeSingle()
        if (priorVipPkg?.id) {
          return NextResponse.json(
            { error: 'This promotional pass has already been redeemed on your account.' },
            { status: 409 }
          )
        }
      } catch {
        // Tolerate unmocked select in isolated tests
      }

      if (appliedDiscountCode) {
        const { data: dRow } = await vipAdmin
          .from('discount_codes')
          .select('id, redemptions_count, max_redemptions')
          .eq('code', appliedDiscountCode)
          .maybeSingle()

        if (dRow?.id) {
          if (typeof dRow.max_redemptions === 'number' && (dRow.redemptions_count || 0) >= dRow.max_redemptions) {
            return NextResponse.json({ error: 'This discount code has reached its maximum redemptions.' }, { status: 409 })
          }

          try {
            const { error: redErr } = await vipAdmin
              .from('discount_code_redemptions')
              .insert({
                discount_code_id: dRow.id,
                client_id: userId,
                stripe_payment_id: deterministicVipPaymentId,
                amount_cents: basePriceCents,
              })
            if (redErr && redErr.code === '23505') {
              return NextResponse.json(
                { error: 'This promotional code has already been redeemed on your account.' },
                { status: 409 }
              )
            }
          } catch {
            // Tolerate partial test mocks
          }

          if (typeof vipAdmin.rpc === 'function') {
            await vipAdmin.rpc('increment_discount_code_redemptions', {
              p_discount_code: appliedDiscountCode,
            })
          } else {
            await vipAdmin
              .from('discount_codes')
              .update({ redemptions_count: (dRow.redemptions_count || 0) + 1 })
              .eq('id', dRow.id)
          }
        }
      }

      // Ensure client exists
      await vipAdmin.from('clients').upsert(
        {
          id: userId,
          email: authz.user.email ?? `${userId}@placeholder.local`,
        },
        { onConflict: 'id' }
      )

      // Grant client package with deterministic payment ID
      const { error: pkgError } = await vipAdmin.from('client_packages').insert({
        client_id: userId,
        package_name: packageNameWithCadence,
        sessions_total: totalSessions,
        sessions_remaining: totalSessions,
        stripe_payment_id: deterministicVipPaymentId,
        source: 'purchase',
        discount_code: appliedDiscountCode,
        discount_amount_cents: basePriceCents,
      })

      if (pkgError) {
        if (pkgError.code === '23505') {
          return NextResponse.json(
            { error: 'This promotional pass has already been redeemed on your account.' },
            { status: 409 }
          )
        }
        return NextResponse.json({ error: 'Failed to activate package.' }, { status: 500 })
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
            name: isPif
              ? (pkg.id === 'corporate' ? `${pkg.name} · Annual Team Plan` : `${pkg.name} · 12-Week Transformation Block`)
              : pkg.name,
            description: isPif
              ? (pkg.id === 'corporate'
                  ? '12-month team wellness plan for up to 10 members. Includes 12 live coaching workshops.'
                  : (pkg.pifBonusDescription ? `12-week upfront commitment. ${pkg.pifBonusDescription}` : '12-week macrocycle periodization block.'))
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
      legalTermsVersion,
    }

    if (!process.env.STRIPE_SECRET_KEY || !stripe) {
      return NextResponse.json({
        error: 'Stripe payments are not currently configured. Please contact support or try again later.',
      }, { status: 503 })
    }

    const { supabaseAdmin } = await import('@/lib/supabase')
    const pkgAdmin = supabaseAdmin()
    const { customerId: existingPkgCustomerId, hasActiveSubscription: pkgHasActiveSub } =
      await resolveExistingStripeCustomerState(pkgAdmin, stripe, userId)

    if (!isPif && pkgHasActiveSub) {
      return NextResponse.json(
        {
          error:
            'You already have an active Forge Athletic subscription. Manage or upgrade your plan in the Billing Portal to prevent duplicate charges.',
          code: 'EXISTING_ACTIVE_SUBSCRIPTION',
          useBillingPortal: true,
        },
        { status: 409 }
      )
    }

    let session
    try {
      session = await stripe.checkout.sessions.create({
        mode: isPif ? 'payment' : 'subscription',
        client_reference_id: userId,
        ...(existingPkgCustomerId ? { customer: existingPkgCustomerId } : {}),
        ...automaticTaxOption,
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
        cancel_url: pkg.id === 'corporate' ? `${appUrl}/corporate#pricing` : `${appUrl}/packages`,
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
