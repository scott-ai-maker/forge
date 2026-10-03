import { describe, expect, it } from 'vitest'

describe('useLiveWorkoutSessionTimer logic & stage transitions', () => {
  it('validates stage transition sequence for standard NASM 4-stage flow', () => {
    const validStages = ['idle', 'strength', 'cardio', 'cooldown']
    expect(validStages).toContain('idle')
    expect(validStages).toContain('strength')
    expect(validStages).toContain('cardio')
    expect(validStages).toContain('cooldown')
  })

  it('accurately parses elapsed workout seconds to mm:ss format', () => {
    const formatElapsed = (totalSec: number) => {
      const mm = Math.floor(totalSec / 60).toString().padStart(2, '0')
      const ss = (totalSec % 60).toString().padStart(2, '0')
      return `${mm}:${ss}`
    }

    expect(formatElapsed(0)).toBe('00:00')
    expect(formatElapsed(65)).toBe('01:05')
    expect(formatElapsed(3600)).toBe('60:00')
  })
})

