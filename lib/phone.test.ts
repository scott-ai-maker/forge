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
  it('blocks overnight, allows daytime (Eastern)', () => {
    expect(isWithinSmsQuietHours(new Date('2026-06-01T03:00:00Z'))).toBe(true) // 11pm ET
    expect(isWithinSmsQuietHours(new Date('2026-06-01T16:00:00Z'))).toBe(false) // noon ET
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
