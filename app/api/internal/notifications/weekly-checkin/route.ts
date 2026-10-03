import { NextRequest, NextResponse } from 'next/server'
import { sendWeeklyCheckinNudges } from '@/lib/push-notifications'

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.INTERNAL_CRON_SECRET?.trim()
  const vercelCronSecret = process.env.CRON_SECRET?.trim()

  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  const headerSecret = req.headers.get('x-internal-cron-secret')?.trim()

  if (expected && bearer === expected) return true
  if (expected && headerSecret === expected) return true
  if (vercelCronSecret && bearer === vercelCronSecret) return true

  return false
}

async function handleWeeklyCheckin() {
  try {
    const result = await sendWeeklyCheckinNudges()
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send weekly check-in nudges'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return handleWeeklyCheckin()
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return handleWeeklyCheckin()
}