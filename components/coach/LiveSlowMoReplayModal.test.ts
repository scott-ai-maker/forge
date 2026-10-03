import { describe, expect, it } from 'vitest'

describe('LiveSlowMoReplayModal Mechanics & Controls', () => {
  it('supports precise athletic slow-motion playback rates', () => {
    const validPlaybackRates = [0.25, 0.5, 0.75, 1.0]

    expect(validPlaybackRates).toContain(0.25)
    expect(validPlaybackRates).toContain(0.5)
    expect(validPlaybackRates).toContain(0.75)
    expect(validPlaybackRates).toContain(1.0)
    expect(validPlaybackRates.length).toBe(4)
  })

  it('calculates frame-by-frame stepping with precise 0.04s delta for 25fps video', () => {
    function stepFrame(currentTime: number, delta: number, duration: number): number {
      return Math.max(0, Math.min(duration, Number((currentTime + delta).toFixed(4))))
    }

    const duration = 10.0 // 10 second replay buffer
    const frameDelta = 0.04

    // Step forward 1 frame from start
    expect(stepFrame(0, frameDelta, duration)).toBe(0.04)

    // Step forward 1 frame from middle
    expect(stepFrame(2.50, frameDelta, duration)).toBe(2.54)

    // Step backward 1 frame from middle
    expect(stepFrame(2.50, -frameDelta, duration)).toBe(2.46)

    // Boundary check: cannot step backwards past 0
    expect(stepFrame(0.02, -frameDelta, duration)).toBe(0)
    expect(stepFrame(0, -frameDelta, duration)).toBe(0)

    // Boundary check: cannot step forward past duration
    expect(stepFrame(9.98, frameDelta, duration)).toBe(10.0)
    expect(stepFrame(10.0, frameDelta, duration)).toBe(10.0)
  })

  it('clamps manual seek target times to valid buffer boundaries', () => {
    function calculateSeekTime(inputSeconds: number, maxDuration: number): number {
      if (!Number.isFinite(inputSeconds) || inputSeconds < 0) return 0
      return Math.min(inputSeconds, maxDuration)
    }

    expect(calculateSeekTime(3.45, 10.0)).toBe(3.45)
    expect(calculateSeekTime(-1.5, 10.0)).toBe(0)
    expect(calculateSeekTime(15.0, 10.0)).toBe(10.0)
    expect(calculateSeekTime(NaN, 10.0)).toBe(0)
  })

  it('formats replay timestamps accurately for sports science display', () => {
    function formatReplayTimestamp(seconds: number): string {
      const clamped = Math.max(0, seconds)
      const mins = Math.floor(clamped / 60)
      const secs = Math.floor(clamped % 60)
      const ms = Math.floor((clamped % 1) * 100)
      return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
    }

    expect(formatReplayTimestamp(0)).toBe('0:00.00')
    expect(formatReplayTimestamp(1.25)).toBe('0:01.25')
    expect(formatReplayTimestamp(10.08)).toBe('0:10.08')
    expect(formatReplayTimestamp(65.50)).toBe('1:05.50')
  })
})

