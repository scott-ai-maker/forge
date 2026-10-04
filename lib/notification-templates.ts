import type { NotificationType } from '@/lib/notification-catalog'

export interface NotificationContent {
  title: string
  body: string
  // App-relative path the notification should open
  url?: string
}

export function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export const DEFAULT_NOTIFICATION_URLS: Record<NotificationType, string> = {
  new_message: '/dashboard/messages',
  coach_feedback: '/dashboard/fitness',
  live_session_started: '/dashboard/live',
  live_session_recap: '/dashboard/live',
  weekly_checkin_nudge: '/dashboard/fitness',
  addon_unlocked: '/dashboard/fitness',
  session_credits_added: '/dashboard/book',
  payment_failed: '/dashboard/settings',
  access_expiring: '/packages',
}

export function buildNotificationEmail(content: NotificationContent, baseUrl: string) {
  const link = content.url ? `${baseUrl}${content.url}` : null
  const settingsUrl = `${baseUrl}/dashboard/settings`
  const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; line-height: 1.55; color: #111827;">
<h2 style="margin: 0 0 12px;">${escapeHtml(content.title)}</h2>
<p style="margin: 0 0 16px;">${escapeHtml(content.body)}</p>
${link ? `<p style="margin: 0 0 24px;"><a href="${link}" style="display: inline-block; padding: 10px 18px; background: #F59E0B; color: #111827; border-radius: 6px; text-decoration: none; font-weight: 700;">Open Forge Athletic</a></p>` : ''}
<p style="margin: 0; font-size: 12px; color: #6B7280;">Forge Athletic · <a href="${settingsUrl}" style="color: #6B7280;">Manage notification preferences</a></p>
</div>`
  const text = [content.title, '', content.body, ...(link ? ['', link] : []), '', `Manage notification preferences: ${settingsUrl}`].join('\n')
  return { subject: content.title, html, text }
}

// Kept under one SMS segment where possible; carriers require the opt-out line on program messages.
export function buildNotificationSms(content: NotificationContent, baseUrl: string) {
  const link = content.url ? ` ${baseUrl}${content.url}` : ''
  return `Forge Athletic: ${content.title}. ${content.body.slice(0, 100)}${link} Reply STOP to opt out.`
}

// Smallest reminder threshold the remaining time has crossed, or null if none applies yet.
export function pickReminderBucket(daysLeft: number, thresholds: number[]): number | null {
  const crossed = thresholds.filter((t) => daysLeft <= t)
  return crossed.length > 0 ? Math.min(...crossed) : null
}
