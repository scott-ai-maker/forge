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

  describe('Unilateral Movement Two-Sided Timer Transition', () => {
    it('requires Side 1 to switch to Side 2 before completing for unilateral stretches', () => {
      interface ItemTimerState {
        itemId: string
        side: 1 | 2
        secondsLeft: number
        isUnilateral: boolean
      }

      const advanceTimerTick = (
        state: ItemTimerState,
        durationSec: number
      ): { next: ItemTimerState; isComplete: boolean; switchedSide: boolean } => {
        if (state.secondsLeft <= 1) {
          if (state.isUnilateral && state.side === 1) {
            return {
              next: { ...state, side: 2, secondsLeft: durationSec },
              isComplete: false,
              switchedSide: true,
            }
          }
          return {
            next: { ...state, secondsLeft: 0 },
            isComplete: true,
            switchedSide: false,
          }
        }
        return {
          next: { ...state, secondsLeft: state.secondsLeft - 1 },
          isComplete: false,
          switchedSide: false,
        }
      }

      // Unilateral item (Single Body Part Stretch, Kneeling Hip Flexor, etc.)
      const unilateralItem: ItemTimerState = {
        itemId: 'lengthen-def-1',
        side: 1,
        secondsLeft: 1,
        isUnilateral: true,
      }

      // Side 1 finishes -> switches to Side 2 (30s)
      const afterSide1 = advanceTimerTick(unilateralItem, 30)
      expect(afterSide1.switchedSide).toBe(true)
      expect(afterSide1.isComplete).toBe(false)
      expect(afterSide1.next.side).toBe(2)
      expect(afterSide1.next.secondsLeft).toBe(30)

      // Side 2 finishes -> item is marked complete
      const afterSide2 = advanceTimerTick({ ...afterSide1.next, secondsLeft: 1 }, 30)
      expect(afterSide2.switchedSide).toBe(false)
      expect(afterSide2.isComplete).toBe(true)
      expect(afterSide2.next.secondsLeft).toBe(0)

      // Bilateral item (e.g. Wall Sit or Child's Pose) finishes in 1 side
      const bilateralItem: ItemTimerState = {
        itemId: 'bilateral-1',
        side: 1,
        secondsLeft: 1,
        isUnilateral: false,
      }
      const bilateralResult = advanceTimerTick(bilateralItem, 30)
      expect(bilateralResult.switchedSide).toBe(false)
      expect(bilateralResult.isComplete).toBe(true)
    })
  })

  describe('Mobile Guided Flow Modal Architecture & Viewport Protection', () => {
    it('verifies that ClinicalKineticWarmupModule mounts Guided Flow via createPortal into document.body', async () => {
      const fs = await import('node:fs')
      const path = await import('node:path')
      const code = fs.readFileSync(
        path.resolve(process.cwd(), 'components/fitness/ClinicalKineticWarmupModule.tsx'),
        'utf-8'
      )

      expect(code).toContain("import { createPortal } from 'react-dom'")
      expect(code).toContain('createPortal(')
      expect(code).toContain('document.body')
      expect(code).toContain("aria-label=\"Close guided flow\"")
      expect(code).toContain("WebkitOverflowScrolling: 'touch'")
      expect(code).toContain("WebkitBackdropFilter: 'blur(8px)'")
      expect(code).toContain("Array.isArray(pc.inhibit)")
    })

    it('verifies that ClinicalCoolDownModule mounts Guided Flow via createPortal into document.body', async () => {
      const fs = await import('node:fs')
      const path = await import('node:path')
      const code = fs.readFileSync(
        path.resolve(process.cwd(), 'components/fitness/ClinicalCoolDownModule.tsx'),
        'utf-8'
      )

      expect(code).toContain("import { createPortal } from 'react-dom'")
      expect(code).toContain('createPortal(')
      expect(code).toContain('document.body')
      expect(code).toContain("aria-label=\"Close guided flow\"")
      expect(code).toContain("WebkitOverflowScrolling: 'touch'")
      expect(code).toContain("WebkitBackdropFilter: 'blur(8px)'")
    })

    it('verifies that both Guided Flow modules enforce a 3-second get-ready countdown upon advancing to the next stretch', async () => {
      const fs = await import('node:fs')
      const path = await import('node:path')
      const warmupCode = fs.readFileSync(
        path.resolve(process.cwd(), 'components/fitness/ClinicalKineticWarmupModule.tsx'),
        'utf-8'
      )
      const coolDownCode = fs.readFileSync(
        path.resolve(process.cwd(), 'components/fitness/ClinicalCoolDownModule.tsx'),
        'utf-8'
      )

      // Warmup module 3-second get ready assertions
      expect(warmupCode).toContain('setPrepCountdown(3)')
      expect(warmupCode).toContain('Get ready in 3, 2, 1')
      expect(warmupCode).toContain('Get into position for next stretch')
      expect(warmupCode).toContain("'Get Ready'")

      // Cool-down module 3-second get ready assertions
      expect(coolDownCode).toContain('setPrepCountdown(3)')
      expect(coolDownCode).toContain('Get ready in 3, 2, 1')
      expect(coolDownCode).toContain('Get into position for next stretch')
      expect(coolDownCode).toContain("'Get Ready'")
    })
  })
})


