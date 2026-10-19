import { describe, expect, it } from 'vitest'

describe('useStaticStretchHoldTimer logic & duration constraints', () => {
  it('validates target hold duration bounds for static stretches and SMR foam rolling', () => {
    const validateSeconds = (input: number) => Math.max(1, input || 30)

    expect(validateSeconds(30)).toBe(30)
    expect(validateSeconds(60)).toBe(60)
    expect(validateSeconds(0)).toBe(30)
    expect(validateSeconds(-10)).toBe(1)
  })

  it('formats remaining hold duration cleanly', () => {
    const formatRemaining = (remaining: number) => `${remaining}s`

    expect(formatRemaining(30)).toBe('30s')
    expect(formatRemaining(5)).toBe('5s')
    expect(formatRemaining(0)).toBe('0s')
  })

  it('cycles Side 1 to Side 2 for unilateral stretch holds before completion', () => {
    // Simulating timer tick logic for unilateral movements (sidesCount: 2)
    interface TimerState {
      targetSeconds: number
      remainingSeconds: number
      isRunning: boolean
      sidesCount: 1 | 2
      currentSide: 1 | 2
    }

    const advanceTick = (state: TimerState): { next: TimerState; completed: boolean; switchedSide: boolean } => {
      if (state.remainingSeconds <= 1) {
        if (state.sidesCount === 2 && state.currentSide === 1) {
          return {
            next: { ...state, currentSide: 2, remainingSeconds: state.targetSeconds, isRunning: true },
            completed: false,
            switchedSide: true,
          }
        }
        return {
          next: { ...state, remainingSeconds: 0, isRunning: false },
          completed: true,
          switchedSide: false,
        }
      }
      return {
        next: { ...state, remainingSeconds: state.remainingSeconds - 1 },
        completed: false,
        switchedSide: false,
      }
    }

    const initial: TimerState = {
      targetSeconds: 30,
      remainingSeconds: 1, // 1 second left on Side 1
      isRunning: true,
      sidesCount: 2,
      currentSide: 1,
    }

    // Tick reaches 0 on Side 1 -> switches to Side 2 (30s)
    const step1 = advanceTick(initial)
    expect(step1.switchedSide).toBe(true)
    expect(step1.completed).toBe(false)
    expect(step1.next.currentSide).toBe(2)
    expect(step1.next.remainingSeconds).toBe(30)
    expect(step1.next.isRunning).toBe(true)

    // Tick reaches 0 on Side 2 -> finishes completely
    const step2 = advanceTick({ ...step1.next, remainingSeconds: 1 })
    expect(step2.switchedSide).toBe(false)
    expect(step2.completed).toBe(true)
    expect(step2.next.currentSide).toBe(2)
    expect(step2.next.remainingSeconds).toBe(0)
    expect(step2.next.isRunning).toBe(false)
  })
})

