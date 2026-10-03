import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'

type PackageGrantPayload = {
  clientId: string
  packageName: string
  sessionsTotal: number
  stripePaymentId: string
  discountCode?: string | null
  discountAmountCents?: number
}

async function ensureClientExists(
  admin: ReturnType<(typeof import('@/lib/supabase'))['supabaseAdmin']>,
  clientId: string,
  checkoutEmail: string | null
) {
  const fallbackEmail = `${clientId}@placeholder.local`

  let { error: clientError } = await admin
    .from('clients')
    .upsert(
      {
        id: clientId,
        email: checkoutEmail ?? fallbackEmail,
      },
      { onConflict: 'id' }
    )

  // If email already belongs to another row, preserve FK integrity
  // by creating this id with a guaranteed-unique placeholder email.
  if (clientError && clientError.message.includes('clients_email_key')) {
    const retry = await admin
      .from('clients')
      .upsert(
        {
          id: clientId,
          email: fallbackEmail,
        },
        { onConflict: 'id' }
      )
    clientError = retry.error
  }

  if (clientError) {
    throw new Error(`Failed upserting client: ${clientError.message}`)
  }
}

async function grantClientPackageCycle(
  admin: ReturnType<(typeof import('@/lib/supabase'))['supabaseAdmin']>,
  payload: PackageGrantPayload
) {
  const { clientId, packageName, sessionsTotal, stripePaymentId } = payload
  const normalizedDiscountCode = (payload.discountCode ?? '').trim().toUpperCase()
  const parsedDiscountAmount = Number.isFinite(payload.discountAmountCents)
    ? Math.max(payload.discountAmountCents ?? 0, 0)
    : 0

  const { data: existingPackage, error: existingError } = await admin
    .from('client_packages')
    .select('id')
    .eq('stripe_payment_id', stripePaymentId)
    .limit(1)
    .maybeSingle()

  if (existingError) {
    throw new Error(`Failed checking existing package: ${existingError.message}`)
  }

  if (existingPackage) {
    return { inserted: false }
  }

  const { error: packageError } = await admin.from('client_packages').insert({
    client_id: clientId,
    package_name: packageName,
    sessions_total: sessionsTotal,
    sessions_remaining: sessionsTotal,
    stripe_payment_id: stripePaymentId,
    source: 'purchase',
    discount_code: normalizedDiscountCode || null,
    discount_amount_cents: parsedDiscountAmount,
  })

  if (packageError) {
    throw new Error(`Failed inserting package: ${packageError.message}`)
  }

  return { inserted: true, normalizedDiscountCode, parsedDiscountAmount }
}

async function recordDiscountRedemption(
  admin: ReturnType<(typeof import('@/lib/supabase'))['supabaseAdmin']>,
  {
    clientId,
    stripePaymentId,
    discountCode,
    amountCents,
  }: {
    clientId: string
    stripePaymentId: string
    discountCode: string
    amountCents: number
  }
) {
  const normalizedDiscountCode = discountCode.trim().toUpperCase()
  if (!normalizedDiscountCode) return

  const { data: discountCodeRow, error: discountCodeError } = await admin
    .from('discount_codes')
    .select('id')
    .eq('code', normalizedDiscountCode)
    .maybeSingle()

  if (discountCodeError) {
    throw new Error(`Failed loading discount code: ${discountCodeError.message}`)
  }

  if (!discountCodeRow?.id) return

  const { data: redemption, error: redemptionError } = await admin
    .from('discount_code_redemptions')
    .insert({
      discount_code_id: discountCodeRow.id,
      client_id: clientId,
      stripe_payment_id: stripePaymentId,
      amount_cents: amountCents,
    })
    .select('id')
    .maybeSingle()

  if (redemptionError && redemptionError.code !== '23505') {
    throw new Error(`Failed inserting discount redemption: ${redemptionError.message}`)
  }

  if (!redemption?.id) return

  const { error: redemptionCountError } = await admin.rpc('increment_discount_code_redemptions', {
    p_discount_code: normalizedDiscountCode,
  })

  if (redemptionCountError) {
    throw new Error(`Failed incrementing discount redemptions: ${redemptionCountError.message}`)
  }
}

async function linkStripeCustomer(
  admin: ReturnType<(typeof import('@/lib/supabase'))['supabaseAdmin']>,
  clientId: string,
  stripeCustomerId: string | null
) {
  if (!stripeCustomerId) return
  try {
    await admin
      .from('clients')
      .update({ stripe_customer_id: stripeCustomerId })
      .eq('id', clientId)
  } catch (err) {
    console.warn(`Failed linking Stripe customer ${stripeCustomerId} to client ${clientId}:`, err)
  }
}

async function resolveClientIdFromCustomer(
  admin: ReturnType<(typeof import('@/lib/supabase'))['supabaseAdmin']>,
  stripeCustomerId: string | null
): Promise<string | null> {
  if (!stripeCustomerId) return null
  try {
    const { data } = await admin
      .from('clients')
      .select('id')
      .eq('stripe_customer_id', stripeCustomerId)
      .maybeSingle()
    return data?.id ?? null
  } catch {
    return null
  }
}

async function syncClientStatusSafely(
  admin: ReturnType<(typeof import('@/lib/supabase'))['supabaseAdmin']>,
  clientId: string,
  targetStatus: 'active' | 'paused' | 'inactive',
  reasonCode: string,
  reasonNotes: string
) {
  try {
    const { data: client } = await admin
      .from('clients')
      .select('status')
      .eq('id', clientId)
      .maybeSingle()

    if (!client) return

    // Don't issue redundant transition if client is already in the target status
    if (client.status === targetStatus) return

    const { transitionClientStatus } = await import('@/lib/client-lifecycle')
    await transitionClientStatus(admin, {
      clientId,
      coachId: 'stripe-system',
      actorRole: 'system',
      coachName: 'Stripe Billing System',
      newStatus: targetStatus,
      reasonCode,
      reasonNotes,
    })
  } catch (err) {
    console.warn(`Failed transitioning client ${clientId} to ${targetStatus}:`, err)
  }
}

export async function POST(req: NextRequest) {
  // Stripe webhook handler — requires STRIPE_SECRET_KEY at runtime
  // Full implementation activates once env vars are set in Vercel
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  try {
    const { stripe } = await import('@/lib/stripe')

    const { supabaseAdmin } = await import('@/lib/supabase')
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')!
    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const {
        clientId,
        packageName,
        sessionsTotal,
        discountCode,
        discountAmountCents,
      } = session.metadata ?? {}
      const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null
      const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null

      if (clientId && packageName && sessionsTotal) {
        const admin = supabaseAdmin()
        const checkoutEmail = session.customer_details?.email ?? session.customer_email ?? null

        await ensureClientExists(admin, clientId, checkoutEmail)
        await linkStripeCustomer(admin, clientId, stripeCustomerId)

        if (session.mode === 'subscription') {
          await syncClientStatusSafely(
            admin,
            clientId,
            'active',
            'new_enrollment',
            `Subscription enrollment started via checkout session ${session.id}.`
          )
        }

        // Backward compatibility for older one-time payment checkouts.
        if (session.mode === 'payment' && paymentIntentId) {
          const parsedSessions = Number.parseInt(sessionsTotal, 10)
          const parsedDiscountAmount = Number.parseInt(discountAmountCents ?? '0', 10)
          const discountAmount = Number.isNaN(parsedDiscountAmount) ? 0 : Math.max(parsedDiscountAmount, 0)

          const grantResult = await grantClientPackageCycle(admin, {
            clientId,
            packageName,
            sessionsTotal: Number.isNaN(parsedSessions) ? 0 : Math.max(parsedSessions, 0),
            stripePaymentId: paymentIntentId,
            discountCode,
            discountAmountCents: discountAmount,
          })

          if (grantResult.inserted && grantResult.normalizedDiscountCode) {
            await recordDiscountRedemption(admin, {
              clientId,
              stripePaymentId: paymentIntentId,
              discountCode: grantResult.normalizedDiscountCode,
              amountCents: grantResult.parsedDiscountAmount,
            })
          }
        }
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice
      const invoiceId = invoice.id
      const subscriptionDetails = invoice.parent?.subscription_details ?? null
      const subscriptionId =
        typeof subscriptionDetails?.subscription === 'string'
          ? subscriptionDetails.subscription
          : subscriptionDetails?.subscription?.id ?? null
      const stripeCustomerId = typeof invoice.customer === 'string' ? invoice.customer : null

      if (invoiceId && subscriptionId) {
        const admin = supabaseAdmin()

        const metadata = subscriptionDetails?.metadata ?? {}
        const clientId = metadata.clientId
        const packageName = metadata.packageName
        const sessionsTotal = Number.parseInt(metadata.sessionsTotal ?? '0', 10)
        const discountCode = metadata.discountCode
        const parsedDiscountAmount = Number.parseInt(metadata.discountAmountCents ?? '0', 10)
        const discountAmount = Number.isNaN(parsedDiscountAmount) ? 0 : Math.max(parsedDiscountAmount, 0)

        if (clientId && packageName && Number.isFinite(sessionsTotal)) {
          await ensureClientExists(admin, clientId, invoice.customer_email ?? null)
          await linkStripeCustomer(admin, clientId, stripeCustomerId)

          await syncClientStatusSafely(
            admin,
            clientId,
            'active',
            'renewal',
            `Subscription renewal invoice ${invoiceId} paid successfully.`
          )

          const grantResult = await grantClientPackageCycle(admin, {
            clientId,
            packageName,
            sessionsTotal: Math.max(sessionsTotal, 0),
            stripePaymentId: invoiceId,
            discountCode,
            discountAmountCents: discountAmount,
          })

          // Record redemption once on subscription creation invoice.
          if (
            grantResult.inserted &&
            grantResult.normalizedDiscountCode &&
            invoice.billing_reason === 'subscription_create'
          ) {
            await recordDiscountRedemption(admin, {
              clientId,
              stripePaymentId: invoiceId,
              discountCode: grantResult.normalizedDiscountCode,
              amountCents: grantResult.parsedDiscountAmount,
            })
          }
        }
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice
      const admin = supabaseAdmin()
      const subscriptionDetails = invoice.parent?.subscription_details ?? null
      const stripeCustomerId = typeof invoice.customer === 'string' ? invoice.customer : null

      let clientId = subscriptionDetails?.metadata?.clientId ?? null
      if (!clientId && stripeCustomerId) {
        clientId = await resolveClientIdFromCustomer(admin, stripeCustomerId)
      }

      if (clientId) {
        await syncClientStatusSafely(
          admin,
          clientId,
          'paused',
          'financial_hold',
          `Subscription invoice ${invoice.id} payment failed. Placed on financial hold.`
        )
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      const admin = supabaseAdmin()
      const stripeCustomerId = typeof subscription.customer === 'string' ? subscription.customer : null

      let clientId: string | null = subscription.metadata?.clientId || subscription.metadata?.client_id || null
      if (!clientId && stripeCustomerId) {
        clientId = await resolveClientIdFromCustomer(admin, stripeCustomerId)
      }

      if (clientId) {
        const isNonPayment = subscription.cancellation_details?.reason === 'payment_failed'
        const reasonCode = isNonPayment ? 'non_payment' : 'client_requested_cancellation'
        const reasonNotes = isNonPayment
          ? `Stripe subscription ${subscription.id} cancelled due to non-payment.`
          : `Stripe subscription ${subscription.id} cancelled.`

        await syncClientStatusSafely(admin, clientId, 'inactive', reasonCode, reasonNotes)
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription
      const admin = supabaseAdmin()
      const stripeCustomerId = typeof subscription.customer === 'string' ? subscription.customer : null

      let clientId: string | null = subscription.metadata?.clientId || subscription.metadata?.client_id || null
      if (!clientId && stripeCustomerId) {
        clientId = await resolveClientIdFromCustomer(admin, stripeCustomerId)
      }

      if (clientId) {
        if (subscription.status === 'paused' || subscription.status === 'past_due') {
          await syncClientStatusSafely(
            admin,
            clientId,
            'paused',
            'financial_hold',
            `Subscription ${subscription.id} entered status '${subscription.status}'.`
          )
        } else if (subscription.status === 'active') {
          await syncClientStatusSafely(
            admin,
            clientId,
            'active',
            'renewal',
            `Subscription ${subscription.id} is now active.`
          )
        } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          await syncClientStatusSafely(
            admin,
            clientId,
            'inactive',
            'non_payment',
            `Subscription ${subscription.id} entered status '${subscription.status}'.`
          )
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 400 })
  }
}
