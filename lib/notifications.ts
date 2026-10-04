import { supabaseAdmin } from '@/lib/supabase'
import { sendPushToUser } from '@/lib/push-notifications'
import { getBaseUrl, sendTransactionalEmail, isEmailSuppressed } from '@/lib/marketing-email'
import { NOTIFICATION_CATALOG, type NotificationType } from '@/lib/notification-catalog'
import {
  DEFAULT_NOTIFICATION_URLS,
  buildNotificationEmail,
  buildNotificationSms,
  type NotificationContent,
} from '@/lib/notification-templates'
import { isWithinSmsQuietHours, sendSms } from '@/lib/sms'
import { toE164 } from '@/lib/phone'

export interface NotifyParams {
  userId: string
  type: NotificationType
  title: string
  body: string
  url?: string
  // Extra payload for the push channel
  data?: Record<string, string>
  // When set, the same event is never delivered twice
  dedupeKey?: string
}

export interface NotifyResult {
  channels: ('push' | 'email' | 'sms')[]
  skipped?: 'duplicate' | 'throttled' | 'muted'
}

/**
 * Fans one notification out to push, email and SMS according to the notification
 * catalog and the user's preferences. Never throws: a failing channel must not break the caller.
 */
export async function notifyUser(params: NotifyParams): Promise<NotifyResult> {
  const def = NOTIFICATION_CATALOG[params.type]
  const channels: NotifyResult['channels'] = []
  const content: NotificationContent = {
    title: params.title,
    body: params.body,
    url: params.url ?? DEFAULT_NOTIFICATION_URLS[params.type],
  }

  try {
    const admin = supabaseAdmin()
    const [{ data: prefs }, { data: client }] = await Promise.all([
      admin.from('notification_preferences').select('*').eq('user_id', params.userId).maybeSingle(),
      admin.from('clients').select('email').eq('id', params.userId).maybeSingle(),
    ])

    // Billing/access notices cannot be muted; everything else can.
    if (def.category !== 'billing' && (prefs?.muted_categories ?? []).includes(def.category)) {
      return { channels, skipped: 'muted' }
    }

    if (params.dedupeKey) {
      const { data: existing } = await admin
        .from('notification_log')
        .select('id')
        .eq('dedupe_key', params.dedupeKey)
        .maybeSingle()
      if (existing) return { channels, skipped: 'duplicate' }
    }

    if (def.throttleMinutes) {
      const since = new Date(Date.now() - def.throttleMinutes * 60_000).toISOString()
      const { data: recent } = await admin
        .from('notification_log')
        .select('id')
        .eq('user_id', params.userId)
        .eq('type', params.type)
        .gte('created_at', since)
        .limit(1)
      if (recent && recent.length > 0) return { channels, skipped: 'throttled' }
    }

    const baseUrl = getBaseUrl()

    if (def.push && prefs?.push_enabled !== false) {
      try {
        const res = await sendPushToUser({
          userId: params.userId,
          alert: { title: content.title, body: content.body },
          data: { type: params.type, url: content.url ?? '', ...params.data },
        })
        if (res.delivered > 0) channels.push('push')
      } catch (err) {
        console.warn('[notify] push failed', err)
      }
    }

    if (def.email && prefs?.email_enabled !== false && client?.email) {
      try {
        if (!(await isEmailSuppressed(admin, client.email))) {
          const mail = buildNotificationEmail(content, baseUrl)
          const res = await sendTransactionalEmail({ to: client.email, ...mail })
          if (!('skipped' in res && res.skipped)) channels.push('email')
        }
      } catch (err) {
        console.warn('[notify] email failed', err)
      }
    }

    // SMS requires explicit opt-in consent recorded against the exact number
    const smsPhone = toE164(prefs?.sms_phone)
    const smsAllowed =
      def.sms && prefs?.sms_enabled === true && prefs?.sms_consent_at && smsPhone
    if (smsAllowed && !isWithinSmsQuietHours()) {
      try {
        const res = await sendSms(smsPhone, buildNotificationSms(content, baseUrl))
        if (res.sent) channels.push('sms')
      } catch (err) {
        console.warn('[notify] sms failed', err)
      }
    }

    if (channels.length > 0) {
      await admin.from('notification_log').insert({
        user_id: params.userId,
        type: params.type,
        channels,
        dedupe_key: params.dedupeKey ?? null,
      })
    }
  } catch (err) {
    console.warn('[notify] dispatch failed', err)
  }

  return { channels }
}

export async function sendWeeklyCheckinNudges() {
  const admin = supabaseAdmin()
  const weekStart = new Date()
  const day = weekStart.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  weekStart.setUTCDate(weekStart.getUTCDate() + diff)
  weekStart.setUTCHours(0, 0, 0, 0)
  const weekStartIso = weekStart.toISOString().slice(0, 10)

  const { data: clients, error: clientsError } = await admin.from('clients').select('id, full_name, role').eq('role', 'client')
  if (clientsError) throw new Error(`Failed to load clients: ${clientsError.message}`)

  const { data: checkins, error: checkinsError } = await admin.from('weekly_checkins').select('user_id').eq('week_start', weekStartIso)
  if (checkinsError) throw new Error(`Failed to load weekly check-ins: ${checkinsError.message}`)

  const completed = new Set((checkins ?? []).map((row) => row.user_id))
  let notified = 0

  for (const client of clients ?? []) {
    if (completed.has(client.id)) continue
    const result = await notifyUser({
      userId: client.id,
      type: 'weekly_checkin_nudge',
      title: 'Weekly check-in due',
      body: 'Log your weight, recovery, and notes so your coach can adjust your plan.',
      dedupeKey: `weekly-checkin:${weekStartIso}:${client.id}`,
    })
    if (result.channels.length > 0) notified += 1
  }

  return { weekStart: weekStartIso, clientsConsidered: (clients ?? []).length, notified }
}
