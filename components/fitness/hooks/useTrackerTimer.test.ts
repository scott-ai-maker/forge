import { describe, expect, it } from 'vitest'
import {
  formatTrackerElapsed,
  shouldActivateScreenWakeLock,
  adjustRestStateTime,
} from './useTrackerTimer'
import type { ActiveRestState } from './useExerciseRestTimer'

describe('useTrackerTimer Logic & Utilities', () => {
  it('formats elapsed workout seconds to mm:ss format cleanly', () => {
    expect(formatTrackerElapsed(0)).toBe('00:00')
    expect(formatTrackerElapsed(59)).toBe('00:59')
    expect(formatTrackerElapsed(60)).toBe('01:00')
    expect(formatTrackerElapsed(3600)).toBe('60:00')
    expect(formatTrackerElapsed(-10)).toBe('00:00')
  })

  it('determines screen wake-lock activation conditions accurately', () => {
    // Should activate when gym session (hub 'train')
    expect(shouldActivateScreenWakeLock(true, false, false)).toBe(true)
    // Should activate when workout timer is active
    expect(shouldActivateScreenWakeLock(false, true, false)).toBe(true)
    // Should activate when an active day is open
    expect(shouldActivateScreenWakeLock(false, false, true)).toBe(true)
    // Should NOT activate when completely idle
    expect(shouldActivateScreenWakeLock(false, false, false)).toBe(false)
  })

  it('adjusts rest state remaining time and total rest bounds', () => {
    const initialState: ActiveRestState = {
      exerciseName: 'Barbell Bench Press',
      key: '1-Barbell Bench Press',
      restSeconds: 60,
      remainingSeconds: 40,
      isRunning: true,
    }

    // Adding 15 seconds
    const added = adjustRestStateTime(initialState, 15)
    expect(added?.remainingSeconds).toBe(55)
    expect(added?.restSeconds).toBe(60)

    // Adding 30 seconds (remaining becomes 70 > 60, restSeconds extends to 70)
    const extended = adjustRestStateTime(initialState, 30)
    expect(extended?.remainingSeconds).toBe(70)
    expect(extended?.restSeconds).toBe(70)

    // Subtracting 50 seconds (bounds at 0)
    const subtracted = adjustRestStateTime(initialState, -50)
    expect(subtracted?.remainingSeconds).toBe(0)
    expect(subtracted?.restSeconds).toBe(60)

    // Null current state returns null
    expect(adjustRestStateTime(null, 15)).toBeNull()
  })
})
