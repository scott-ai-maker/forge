import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { id: goalId } = await ctx.params
  if (!goalId || !/^[0-9a-f-]{36}$/i.test(goalId)) {
    return NextResponse.json({ error: 'Invalid goal id' }, { status: 400 })
  }

  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (typeof b.title === 'string') {
    const t = b.title.trim()
    if (!t || t.length > 200) {
      return NextResponse.json({ error: 'title max 200 chars' }, { status: 400 })
    }
    patch.title = t
  }

  if (b.current_value !== undefined) {
    patch.current_value = b.current_value !== '' ? Number(b.current_value) : null
  }

  if (b.target_value !== undefined) {
    patch.target_value = b.target_value !== '' ? Number(b.target_value) : null
  }

  if (b.baseline_value !== undefined) {
    patch.baseline_value = b.baseline_value !== '' ? Number(b.baseline_value) : null
  }

  if (typeof b.target_unit === 'string') {
    patch.target_unit = b.target_unit.trim().slice(0, 30) || null
  }

  if (typeof b.target_date === 'string') {
    patch.target_date = /^\d{4}-\d{2}-\d{2}$/.test(b.target_date) ? b.target_date : null
  }

  if (typeof b.notes === 'string') {
    patch.notes = b.notes.trim().slice(0, 1000) || null
  }

  if (b.is_achieved === true || b.is_achieved === false) {
    patch.is_achieved = b.is_achieved
    if (b.is_achieved === true) {
      patch.achieved_at = new Date().toISOString()
    } else {
      patch.achieved_at = null
    }
  }

  const admin = supabaseAdmin()

  const { data, error } = await admin
    .from('client_goals')
    .update(patch)
    .eq('id', goalId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
  }

  return NextResponse.json({ goal: data })
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { id: goalId } = await ctx.params
  if (!goalId || !/^[0-9a-f-]{36}$/i.test(goalId)) {
    return NextResponse.json({ error: 'Invalid goal id' }, { status: 400 })
  }

  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const admin = supabaseAdmin()
  const { error } = await admin
    .from('client_goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
