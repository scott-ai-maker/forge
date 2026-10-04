import { NextRequest, NextResponse } from 'next/server'
import { AuthzError, getRequestAuthz } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { toE164 } from '@/lib/phone'
import { NOTIFICATION_CATEGORIES } from '@/lib/notification-catalog'

const MUTABLE = new Set(NOTIFICATION_CATEGORIES.filter((c) => c.mutable).map((c) => c.id as string))

function errorResponse(error: unknown, fallback: string) {
  if (error instanceof AuthzError) return NextResponse.json({ error: error.message }, { status: error.status })
  return NextResponse.json({ error: error instanceof Error ? error.message : fallback }, { status: 500 })
}

export async function GET(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)
    const { data } = await supabaseAdmin()
      .from('notification_preferences')
      .select('push_enabled, email_enabled, sms_enabled, sms_phone, muted_categories')
      .eq('user_id', authz.user.id)
      .maybeSingle()
    return NextResponse.json({
      pushEnabled: data?.push_enabled ?? true,
      emailEnabled: data?.email_enabled ?? true,
      smsEnabled: data?.sms_enabled ?? false,
      smsPhone: data?.sms_phone ?? '',
      mutedCategories: data?.muted_categories ?? [],
    })
  } catch (error) {
    return errorResponse(error, 'Failed to load notification preferences')
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

    const admin = supabaseAdmin()
    const { data: existing } = await admin
      .from('notification_preferences')
      .select('sms_enabled, sms_phone, sms_consent_at')
      .eq('user_id', authz.user.id)
      .maybeSingle()

    const muted = Array.isArray(body.mutedCategories)
      ? body.mutedCategories.filter((c): c is string => typeof c === 'string' && MUTABLE.has(c))
      : []

    const wantsSms = body.smsEnabled === true
    let smsPhone: string | null = existing?.sms_phone ?? null
    let smsConsentAt: string | null = existing?.sms_consent_at ?? null

    if (wantsSms) {
      // Consent must be explicit and tied to a valid number
      if (body.smsConsent !== true && !existing?.sms_consent_at) {
        return NextResponse.json({ error: 'Please agree to receive text messages to enable SMS.' }, { status: 400 })
      }
      const phone = toE164(typeof body.smsPhone === 'string' ? body.smsPhone : smsPhone)
      if (!phone) {
        return NextResponse.json({ error: 'Enter a valid mobile number.' }, { status: 400 })
      }
      if (phone !== smsPhone || !smsConsentAt) smsConsentAt = new Date().toISOString()
      smsPhone = phone
    }

    const row = {
      user_id: authz.user.id,
      push_enabled: body.pushEnabled !== false,
      email_enabled: body.emailEnabled !== false,
      sms_enabled: wantsSms,
      sms_phone: smsPhone,
      sms_consent_at: smsConsentAt,
      muted_categories: muted,
      updated_at: new Date().toISOString(),
    }
    const { error } = await admin.from('notification_preferences').upsert(row, { onConflict: 'user_id' })
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error, 'Failed to save notification preferences')
  }
}
