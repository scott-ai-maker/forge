import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)
    const admin = supabaseAdmin()

    const { data: newPkg, error } = await admin
      .from('client_packages')
      .insert({
        client_id: authz.user.id,
        package_name: 'Forge Executive Diagnostic Retainer (QA Test Access)',
        sessions_total: 4,
        sessions_remaining: 3,
        source: 'comp',
        grant_note: 'Developer & QA Calendar Testing Access',
        discount_amount_cents: 0,
      })
      .select('id, package_name, sessions_remaining')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, package: newPkg })
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const redirectParam = searchParams.get('redirect') || '/dashboard/book'

  try {
    const authz = await getRequestAuthz(req)
    const admin = supabaseAdmin()

    await admin.from('client_packages').insert({
      client_id: authz.user.id,
      package_name: 'Forge Executive Diagnostic Retainer (QA Test Access)',
      sessions_total: 4,
      sessions_remaining: 3,
      source: 'comp',
      grant_note: 'Developer & QA Calendar Testing Access',
      discount_amount_cents: 0,
    })

    return NextResponse.redirect(new URL(redirectParam, req.url))
  } catch {
    return NextResponse.redirect(new URL(`/auth/login?redirect=${encodeURIComponent(redirectParam)}`, req.url))
  }
}
