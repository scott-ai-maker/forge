import { NextRequest, NextResponse } from 'next/server'
import { AuthzError, getRequestAuthz, requireRole } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'

function getAuthzErrorResponse(error: unknown) {
  const status = error instanceof AuthzError ? error.status : 500
  const message = error instanceof Error ? error.message : 'Unauthorized'
  return NextResponse.json({ error: message }, { status })
}

export async function DELETE(req: NextRequest) {
  let userId = ''

  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    userId = authz.user.id
  } catch (error) {
    return getAuthzErrorResponse(error)
  }

  const admin = supabaseAdmin()

  // 1. Cancel active Stripe subscriptions so client is not billed after deletion
  try {
    const { data: clientRow } = await admin
      .from('clients')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .maybeSingle()

    let stripeCustomerId = clientRow?.stripe_customer_id ?? null

    if (process.env.STRIPE_SECRET_KEY) {
      const { stripe } = await import('@/lib/stripe')
      if (stripe) {
        if (!stripeCustomerId && clientRow?.email) {
          const customers = await stripe.customers.list({ email: clientRow.email, limit: 1 })
          if (customers.data.length > 0) {
            stripeCustomerId = customers.data[0].id
          }
        }

        if (stripeCustomerId) {
          const subscriptions = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            status: 'all',
          })

          for (const sub of subscriptions.data) {
            if (['active', 'trialing', 'past_due'].includes(sub.status)) {
              try {
                await stripe.subscriptions.cancel(sub.id)
              } catch (subCancelErr) {
                console.warn(`Failed cancelling subscription ${sub.id} during account deletion:`, subCancelErr)
              }
            }
          }
        }
      }
    }
  } catch (stripeErr) {
    console.warn('Error checking/cancelling Stripe subscriptions during account deletion:', stripeErr)
  }

  // 2. Record lifecycle deactivation audit trail
  try {
    const { transitionClientStatus } = await import('@/lib/client-lifecycle')
    await transitionClientStatus(admin, {
      clientId: userId,
      coachId: userId,
      actorRole: 'client',
      coachName: 'Client (Self Deletion)',
      newStatus: 'inactive',
      reasonCode: 'client_requested_cancellation',
      reasonNotes: 'Client permanently deleted their account.',
    })
  } catch (lifecycleErr) {
    console.warn('Could not record lifecycle transition during account deletion:', lifecycleErr)
  }

  // 3. Delete the auth user — Supabase cascades or we rely on RLS/FK delete rules.
  // We also explicitly anonymize PII in the clients row first so it is gone even if
  // the auth deletion is delayed by Supabase internals.
  const { error: profileError } = await admin
    .from('clients')
    .update({
      full_name: '[deleted]',
      email: `deleted_${userId}@placeholder.local`,
      phone: null,
      avatar_path: null,
      stripe_customer_id: null,
    })
    .eq('id', userId)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  const { error: authError } = await admin.auth.admin.deleteUser(userId)

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: true })
}
