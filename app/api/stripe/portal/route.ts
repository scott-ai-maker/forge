import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { getTrustedAppBaseUrl } from '@/lib/app-base-url'

export async function POST(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client'])
    const userId = authz.user.id

    const { stripe } = await import('@/lib/stripe')
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 500 })
    }

    const { supabaseAdmin } = await import('@/lib/supabase')
    const admin = supabaseAdmin()

    // 1. Check if client has a stripe_customer_id in clients table
    const { data: clientRow } = await admin
      .from('clients')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .maybeSingle()

    let customerId: string | null = clientRow?.stripe_customer_id ?? null

    // 2. Fallback: Search Stripe customers by email
    if (!customerId && (clientRow?.email || authz.user.email)) {
      const emailToSearch = clientRow?.email || authz.user.email
      if (emailToSearch) {
        const customers = await stripe.customers.list({ email: emailToSearch, limit: 1 })
        if (customers.data.length > 0) {
          customerId = customers.data[0].id
          // Save customerId for future lookups
          await admin
            .from('clients')
            .update({ stripe_customer_id: customerId })
            .eq('id', userId)
        }
      }
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'No active Stripe billing profile found. Please purchase a membership or add-on first.' },
        { status: 404 }
      )
    }

    const appUrl = getTrustedAppBaseUrl()
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/dashboard?workspace=packages`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'Unexpected billing portal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
