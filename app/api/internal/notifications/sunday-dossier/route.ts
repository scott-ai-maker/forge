import { NextRequest, NextResponse } from 'next/server'
import { dispatchSundayPerformanceDossiers } from '@/lib/sunday-dossier-dispatcher'
import { constantTimeSecretMatch } from '@/lib/webhook-security'

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.INTERNAL_CRON_SECRET?.trim()
  const vercelCronSecret = process.env.CRON_SECRET?.trim()

  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  const headerSecret = req.headers.get('x-internal-cron-secret')?.trim()

  if (expected && constantTimeSecretMatch(bearer, expected)) return true
  if (expected && constantTimeSecretMatch(headerSecret, expected)) return true
  if (vercelCronSecret && constantTimeSecretMatch(bearer, vercelCronSecret)) return true

  return false
}

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

async function handleSundayDossier() {
  try {
    const result = await dispatchSundayPerformanceDossiers()
    return NextResponse.json(result, { headers: NO_STORE_HEADERS })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to dispatch Sunday performance dossiers'
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE_HEADERS })
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
  }
  return handleSundayDossier()
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
  }
  return handleSundayDossier()
}
