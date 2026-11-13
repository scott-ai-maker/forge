import { NextRequest, NextResponse } from 'next/server'
import type { AutomationTemplateId } from '@/lib/automations/launchSequence'

function isAuthorized(req: NextRequest): boolean {
  const internalSecret = process.env.INTERNAL_CRON_SECRET?.trim()
  const marketingSecret = process.env.MARKETING_CRON_SECRET?.trim()
  const vercelCronSecret = process.env.CRON_SECRET?.trim()

  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  const internalHeader = req.headers.get('x-internal-cron-secret')?.trim()
  const marketingHeader = req.headers.get('x-marketing-cron-secret')?.trim()

  if (internalSecret && (bearer === internalSecret || internalHeader === internalSecret)) {
    return true
  }
  if (marketingSecret && (bearer === marketingSecret || marketingHeader === marketingSecret)) {
    return true
  }
  if (vercelCronSecret && bearer === vercelCronSecret) {
    return true
  }

  return false
}

async function runDispatch(options?: {
  dryRun?: boolean
  now?: Date
  windowMinutes?: number
  onlyTemplates?: AutomationTemplateId[]
}) {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase')
    const { dispatchDueLaunchAutomations } = await import('@/lib/automations/launchSequence')

    const summary = await dispatchDueLaunchAutomations(supabaseAdmin(), options)
    return NextResponse.json({ success: true, ...summary })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to run launch sequence automation'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const dryRun = req.nextUrl.searchParams.get('dryRun') === '1'
  return runDispatch({ dryRun })
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    dryRun?: boolean
    simulatedNowIso?: string
    windowMinutes?: number
    onlyTemplates?: AutomationTemplateId[]
  }

  const parsedNow =
    typeof body.simulatedNowIso === 'string' && !Number.isNaN(new Date(body.simulatedNowIso).getTime())
      ? new Date(body.simulatedNowIso)
      : undefined

  return runDispatch({
    dryRun: Boolean(body.dryRun),
    now: parsedNow,
    windowMinutes: typeof body.windowMinutes === 'number' ? body.windowMinutes : undefined,
    onlyTemplates: Array.isArray(body.onlyTemplates) ? body.onlyTemplates : undefined,
  })
}

