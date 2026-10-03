import { describe, it, expect, beforeEach } from 'vitest'
import {
  getWarmupStorageKey,
  isFutureWarmupSession,
  cleanupLegacyWarmupKeys,
} from './ClinicalKineticWarmupModule'
import {
  getCoolDownStorageKey,
  isFutureCoolDownSession,
  cleanupLegacyCoolDownKeys,
} from './ClinicalCoolDownModule'

describe('ClinicalKineticWarmupModule & ClinicalCoolDownModule Key Scoping & Future Guard', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
  })

  describe('Warm-Up Storage Key Generation', () => {
    it('creates scoped storage keys including plan, week, day, and session date', () => {
      const key = getWarmupStorageKey('plan-123', 2, 1, '2026-09-24')
      expect(key).toBe('sgf_warmup_done_p_plan-123_w2_d1_2026-09-24')
    })

    it('handles missing planId and date gracefully while keeping week and day', () => {
      const key = getWarmupStorageKey(null, 1, 3, null)
      expect(key).toBe('sgf_warmup_done_w1_d3')
    })

    it('differentiates Day 1 in Week 1 from Day 1 in Week 2', () => {
      const keyW1 = getWarmupStorageKey('plan-abc', 1, 1, '2026-09-15')
      const keyW2 = getWarmupStorageKey('plan-abc', 2, 1, '2026-09-22')
      expect(keyW1).not.toBe(keyW2)
    })
  })

  describe('Cool-Down Storage Key Generation', () => {
    it('creates scoped storage keys including plan, week, day, and session date', () => {
      const key = getCoolDownStorageKey('plan-456', 3, 2, '2026-09-25')
      expect(key).toBe('sgf_cooldown_done_p_plan-456_w3_d2_2026-09-25')
    })

    it('differentiates client plans so clients never share completion state', () => {
      const keyClientA = getCoolDownStorageKey('client-a-plan', 1, 1, '2026-09-24')
      const keyClientB = getCoolDownStorageKey('client-b-plan', 1, 1, '2026-09-24')
      expect(keyClientA).not.toBe(keyClientB)
    })
  })

  describe('Future Session Identification', () => {
    it('identifies future session dates correctly', () => {
      const futureDate = '2099-12-31'
      expect(isFutureWarmupSession(futureDate)).toBe(true)
      expect(isFutureCoolDownSession(futureDate)).toBe(true)
    })

    it('does not identify past session dates as future', () => {
      const pastDate = '2020-01-01'
      expect(isFutureWarmupSession(pastDate)).toBe(false)
      expect(isFutureCoolDownSession(pastDate)).toBe(false)
    })

    it('identifies future microcycle weeks as future', () => {
      // Viewing Week 3 when active current week is 1
      expect(isFutureWarmupSession(null, 3, 1)).toBe(true)
      expect(isFutureCoolDownSession(null, 3, 1)).toBe(true)
    })

    it('does not identify current microcycle week as future', () => {
      expect(isFutureWarmupSession(null, 2, 2)).toBe(false)
      expect(isFutureCoolDownSession(null, 2, 2)).toBe(false)
    })
  })

  describe('Legacy Unscoped Key Cleanup', () => {
    it('removes unscoped legacy keys from localStorage', () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sgf_warmup_done_day_1', JSON.stringify({ 'inhibit-def-1': true }))
        localStorage.setItem('sgf_cooldown_done_day_1', JSON.stringify({ 'cd-smr-1': true }))
        
        cleanupLegacyWarmupKeys()
        cleanupLegacyCoolDownKeys()

        expect(localStorage.getItem('sgf_warmup_done_day_1')).toBeNull()
        expect(localStorage.getItem('sgf_cooldown_done_day_1')).toBeNull()
      }
    })
  })
})

