import { NextRequest, NextResponse } from 'next/server'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.MARKETING_CRON_SECRET?.trim()
  const vercelCronSecret = process.env.CRON_SECRET?.trim()

  const headerSecret = req.headers.get('x-marketing-cron-secret')?.trim()
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()

  if (secret && headerSecret === secret) return true
  if (secret && bearer === secret) return true
  if (vercelCronSecret && bearer === vercelCronSecret) return true

  return false
}

async function handleDispatch() {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase')
    const { dispatchPendingSequenceEmails } = await import('@/lib/marketing-email')

    const result = await dispatchPendingSequenceEmails(supabaseAdmin())
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('Marketing dispatch error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return handleDispatch()
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return handleDispatch()
}
