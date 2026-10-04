import { beforeEach, describe, expect, it, vi } from 'vitest'

const { adminMock, pushMock, emailMock, smsMock, suppressedMock, quietMock } = vi.hoisted(() => ({
  adminMock: vi.fn(),
  pushMock: vi.fn(),
  emailMock: vi.fn(),
  smsMock: vi.fn(),
  suppressedMock: vi.fn(),
  quietMock: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({ supabaseAdmin: adminMock }))
vi.mock('@/lib/push-notifications', () => ({ sendPushToUser: pushMock }))
vi.mock('@/lib/marketing-email', () => ({
  getBaseUrl: () => 'https://app.test',
  sendTransactionalEmail: emailMock,
  isEmailSuppressed: suppressedMock,
}))
vi.mock('@/lib/sms', () => ({ sendSms: smsMock, isWithinSmsQuietHours: quietMock }))

import { notifyUser } from '@/lib/notifications'

function buildAdmin(opts: { prefs?: Record<string, unknown> | null; logged?: boolean; recent?: boolean }) {
  const inserts: unknown[] = []
  const from = (table: string) => {
    const chain: Record<string, unknown> = {}
    chain.select = () => chain
    chain.eq = () => chain
    chain.gte = () => chain
    chain.limit = () => Promise.resolve({ data: opts.recent ? [{ id: 1 }] : [] })
    chain.maybeSingle = () => {
      if (table === 'notification_preferences') return Promise.resolve({ data: opts.prefs ?? null })
      if (table === 'clients') return Promise.resolve({ data: { email: 'a@b.com' } })
      return Promise.resolve({ data: opts.logged ? { id: 'x' } : null })
    }
    chain.insert = (row: unknown) => {
      inserts.push(row)
      return Promise.resolve({ error: null })
    }
    return chain
  }
  return { client: { from }, inserts }
}

describe('notifyUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pushMock.mockResolvedValue({ delivered: 1, skipped: false })
    emailMock.mockResolvedValue({ id: 'e1' })
    smsMock.mockResolvedValue({ sent: true })
    suppressedMock.mockResolvedValue(false)
    quietMock.mockReturnValue(false)
  })

  it('sends push and email for a message and logs delivery', async () => {
    const { client, inserts } = buildAdmin({})
    adminMock.mockReturnValue(client)
    const res = await notifyUser({ userId: 'u1', type: 'new_message', title: 'Hi', body: 'Yo' })
    expect(res.channels).toEqual(['push', 'email'])
    expect(smsMock).not.toHaveBeenCalled()
    expect(inserts).toHaveLength(1)
  })

  it('never texts without recorded consent', async () => {
    const { client } = buildAdmin({ prefs: { sms_enabled: true, sms_phone: '+16175550100', sms_consent_at: null } })
    adminMock.mockReturnValue(client)
    await notifyUser({ userId: 'u1', type: 'live_session_started', title: 'Live', body: 'Now' })
    expect(smsMock).not.toHaveBeenCalled()
  })

  it('texts time-sensitive items with consent', async () => {
    const { client } = buildAdmin({
      prefs: { sms_enabled: true, sms_phone: '+16175550100', sms_consent_at: '2026-01-01' },
    })
    adminMock.mockReturnValue(client)
    const res = await notifyUser({ userId: 'u1', type: 'live_session_started', title: 'Live', body: 'Now' })
    expect(res.channels).toContain('sms')
  })

  it('holds texts during quiet hours', async () => {
    quietMock.mockReturnValue(true)
    const { client } = buildAdmin({
      prefs: { sms_enabled: true, sms_phone: '+16175550100', sms_consent_at: '2026-01-01' },
    })
    adminMock.mockReturnValue(client)
    await notifyUser({ userId: 'u1', type: 'payment_failed', title: 'x', body: 'y' })
    expect(smsMock).not.toHaveBeenCalled()
  })

  it('respects muted categories but not billing', async () => {
    const { client } = buildAdmin({ prefs: { muted_categories: ['messages', 'billing'] } })
    adminMock.mockReturnValue(client)
    expect((await notifyUser({ userId: 'u1', type: 'new_message', title: 'a', body: 'b' })).skipped).toBe('muted')
    const billing = await notifyUser({ userId: 'u1', type: 'payment_failed', title: 'a', body: 'b' })
    expect(billing.channels).toContain('email')
  })

  it('skips duplicates and throttled types', async () => {
    adminMock.mockReturnValue(buildAdmin({ logged: true }).client)
    expect((await notifyUser({ userId: 'u1', type: 'addon_unlocked', title: 'a', body: 'b', dedupeKey: 'k' })).skipped).toBe('duplicate')
    adminMock.mockReturnValue(buildAdmin({ recent: true }).client)
    expect((await notifyUser({ userId: 'u1', type: 'new_message', title: 'a', body: 'b' })).skipped).toBe('throttled')
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('does not email suppressed addresses and survives channel failures', async () => {
    suppressedMock.mockResolvedValue(true)
    pushMock.mockRejectedValue(new Error('apns down'))
    adminMock.mockReturnValue(buildAdmin({}).client)
    const res = await notifyUser({ userId: 'u1', type: 'coach_feedback', title: 'a', body: 'b' })
    expect(res.channels).toEqual([])
    expect(emailMock).not.toHaveBeenCalled()
  })
})
