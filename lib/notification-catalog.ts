export type NotificationCategory = 'messages' | 'sessions' | 'billing' | 'reminders'

export type NotificationType =
  | 'new_message'
  | 'coach_feedback'
  | 'live_session_started'
  | 'live_session_recap'
  | 'weekly_checkin_nudge'
  | 'addon_unlocked'
  | 'session_credits_added'
  | 'payment_failed'
  | 'access_expiring'

export interface NotificationDefinition {
  category: NotificationCategory
  push: boolean
  email: boolean
  // Text messages are reserved for time-sensitive items so they stay rare and welcome
  sms: boolean
  // Minimum gap between sends of this type to the same user (prevents a flood of message emails)
  throttleMinutes?: number
}

export const NOTIFICATION_CATALOG: Record<NotificationType, NotificationDefinition> = {
  new_message: { category: 'messages', push: true, email: true, sms: false, throttleMinutes: 30 },
  coach_feedback: { category: 'messages', push: true, email: true, sms: false },
  live_session_started: { category: 'sessions', push: true, email: false, sms: true },
  live_session_recap: { category: 'sessions', push: true, email: true, sms: false },
  weekly_checkin_nudge: { category: 'reminders', push: true, email: true, sms: false },
  addon_unlocked: { category: 'billing', push: true, email: true, sms: false },
  session_credits_added: { category: 'billing', push: true, email: true, sms: false },
  payment_failed: { category: 'billing', push: true, email: true, sms: true },
  access_expiring: { category: 'billing', push: true, email: true, sms: false },
}

export const NOTIFICATION_CATEGORIES: readonly { id: NotificationCategory; label: string; description: string; mutable: boolean }[] = [
  { id: 'messages', label: 'Coach messages', description: 'New messages and feedback from your coach.', mutable: true },
  { id: 'sessions', label: 'Live sessions', description: 'When a live session starts and when your recap is ready.', mutable: true },
  { id: 'reminders', label: 'Reminders', description: 'Weekly check-in reminders.', mutable: true },
  { id: 'billing', label: 'Billing & access', description: 'Purchases, failed payments, and expiring access. Always on.', mutable: false },
]
