import { describe, expect, it } from 'vitest'
import { toE164 } from '@/lib/phone'
import { isWithinSmsQuietHours } from '@/lib/sms'
import { pickReminderBucket } from '@/lib/notification-templates'

describe('toE164', () => {
  it('normalizes US formats and rejects junk', () => {
    expect(toE164('(617) 555-0100')).toBe('+16175550100')
    expect(toE164('1-617-555-0100')).toBe('+16175550100')
    expect(toE164('+44 20 7946 0958')).toBe('+442079460958')
    expect(toE164('12345')).toBeNull()
    expect(toE164(null)).toBeNull()
  })
})

describe('isWithinSmsQuietHours', () => {
  it('blocks overnight and early morning coast-to-coast, allows safe daytime window', () => {
    expect(isWithinSmsQuietHours(new Date('2026-06-01T03:00:00Z'))).toBe(true) // 11pm ET
    expect(isWithinSmsQuietHours(new Date('2026-11-20T11:00:00Z'))).toBe(true) // 6am EST / 3am PST
    expect(isWithinSmsQuietHours(new Date('2026-06-01T16:00:00Z'))).toBe(false) // noon ET / 9am PT
    // Explicit recipient timezone & area-code inference (8am - 8pm local)
    expect(
      isWithinSmsQuietHours(new Date('2026-11-20T14:00:00Z'), 'America/Los_Angeles')
    ).toBe(true) // 6am PST
    expect(
      isWithinSmsQuietHours(new Date('2026-11-20T17:00:00Z'), undefined, '+12135550199')
    ).toBe(false) // 9am PST via LA area code 213
    expect(
      isWithinSmsQuietHours(new Date('2026-11-20T17:00:00Z'), undefined, '+18085550199')
    ).toBe(true) // 7am HST via Hawaii area code 808
  })
})

describe('pickReminderBucket', () => {
  it('returns the tightest crossed threshold', () => {
    expect(pickReminderBucket(25, [30, 7, 1])).toBe(30)
    expect(pickReminderBucket(5, [30, 7, 1])).toBe(7)
    expect(pickReminderBucket(1, [7, 1])).toBe(1)
    expect(pickReminderBucket(20, [7, 1])).toBeNull()
  })
})
