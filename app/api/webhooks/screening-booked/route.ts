import { NextRequest, NextResponse } from 'next/server'

function isAuthorizedWebhook(req: NextRequest): boolean {
  const candidates = [
    process.env.SCREENING_WEBHOOK_SECRET?.trim(),
    process.env.INTERNAL_CRON_SECRET?.trim(),
    process.env.MARKETING_CRON_SECRET?.trim(),
  ].filter((v): v is string => Boolean(v))

  if (candidates.length === 0) return false

  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  const webhookHeader = req.headers.get('x-webhook-secret')?.trim()

  return candidates.some(secret => secret === bearer || secret === webhookHeader)
}

export async function POST(req: NextRequest) {
  if (!isAuthorizedWebhook(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = (await req.json().catch(() => ({}))) as {
    email?: unknown
    userId?: unknown
    payload?: { invitee?: { email?: unknown } }
  }

  const email =
    typeof payload.email === 'string'
      ? payload.email
      : typeof payload.payload?.invitee?.email === 'string'
        ? payload.payload.invitee.email
        : null
  const userId = typeof payload.userId === 'string' ? payload.userId : null

  if (!email && !userId) {
    return NextResponse.json({ error: 'email or userId is required' }, { status: 400 })
  }

  try {
    const { supabaseAdmin } = await import('@/lib/supabase')
    const { suppressOnScreeningBooked } = await import('@/lib/automations/launchSequence')

    const result = await suppressOnScreeningBooked(supabaseAdmin(), { email, userId })
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to process screening booking suppression'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

