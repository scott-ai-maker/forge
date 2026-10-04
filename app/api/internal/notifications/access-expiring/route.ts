import { NextRequest, NextResponse } from 'next/server'
import { notifyUser } from '@/lib/notifications'
import { supabaseAdmin } from '@/lib/supabase'
import { pickReminderBucket } from '@/lib/notification-templates'
import { getForgeAddon } from '@/lib/forge-addons'

const DAY_MS = 86_400_000
const GRACE_ADDON_ID = 'legacy-grace'

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.INTERNAL_CRON_SECRET?.trim()
  const vercelCronSecret = process.env.CRON_SECRET?.trim()
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  const headerSecret = req.headers.get('x-internal-cron-secret')?.trim()

  if (expected && (bearer === expected || headerSecret === expected)) return true
  return Boolean(vercelCronSecret && bearer === vercelCronSecret)
}

async function run() {
  const admin = supabaseAdmin()
  const now = Date.now()
  const { data, error } = await admin
    .from('client_addon_entitlements')
    .select('client_id, addon_id, feature, expires_at, uses_remaining, stripe_payment_id')
    .gt('expires_at', new Date(now).toISOString())
    .lte('expires_at', new Date(now + 30 * DAY_MS).toISOString())
  if (error) throw new Error(error.message)

  let notified = 0
  const seen = new Set<string>()

  for (const row of data ?? []) {
    // Membership-included access renews with each paid invoice, so only grace and one-time purchases warn.
    if (row.stripe_payment_id.startsWith('in_') || row.stripe_payment_id.startsWith('backfill:')) continue
    if (row.uses_remaining === 0) continue

    const isGrace = row.addon_id === GRACE_ADDON_ID
    const key = isGrace ? `grace:${row.client_id}` : `${row.client_id}:${row.addon_id}:${row.expires_at}`
    if (seen.has(key)) continue
    seen.add(key)

    const daysLeft = Math.ceil((new Date(row.expires_at).getTime() - now) / DAY_MS)
    const bucket = pickReminderBucket(daysLeft, isGrace ? [30, 7, 1] : [7, 1])
    if (bucket === null) continue

    const addon = getForgeAddon(row.addon_id)
    const title = isGrace
      ? `Your complimentary tools end in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
      : `${addon?.name ?? 'Your add-on'} expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
    const body = isGrace
      ? 'As a thank-you, your Video Review, Nutrition and Travel tools are free for a limited time. Choose a membership or add-on to keep them.'
      : 'Use it before it ends, or renew to keep access.'

    const result = await notifyUser({
      userId: row.client_id,
      type: 'access_expiring',
      title,
      body,
      url: '/packages#add-ons',
      dedupeKey: `access-expiring:${key}:${bucket}`,
    })
    if (result.channels.length > 0) notified += 1
  }

  return { considered: seen.size, notified }
}

async function handle(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    return NextResponse.json(await run())
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to send expiry reminders' }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle
