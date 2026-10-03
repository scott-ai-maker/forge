import { describe, it, expect } from 'vitest'
import {
  getRpeScalePoint,
  mapRpeToRir,
  mapRirToRpe,
  getFatigueSafetyNotice,
  RPE_SCALE_POINTS,
} from '@/lib/rpe-exertion-scale'

describe('RpeRirExertionSelector Component Logic', () => {
  it('contains expected scale points spanning from 6.0 to 10.0', () => {
    expect(RPE_SCALE_POINTS.length).toBe(9)
    expect(RPE_SCALE_POINTS[0].rpe).toBe(6.0)
    expect(RPE_SCALE_POINTS[RPE_SCALE_POINTS.length - 1].rpe).toBe(10.0)
  })

  it('correctly maps button clicks to coupled RPE and RIR values', () => {
    // When user selects RPE 8.0, RIR should evaluate to 2.0
    const pt8 = getRpeScalePoint(8.0)
    expect(pt8.rpe).toBe(8.0)
    expect(pt8.rir).toBe(2.0)
    expect(mapRpeToRir(8.0)).toBe(2.0)

    // When user selects RPE 9.5, RIR should evaluate to 0.5
    const pt95 = getRpeScalePoint(9.5)
    expect(pt95.rpe).toBe(9.5)
    expect(pt95.rir).toBe(0.5)
    expect(mapRpeToRir(9.5)).toBe(0.5)
  })

  it('triggers critical safety notice when RPE reaches peak exertion (>= 9.5)', () => {
    const notice = getFatigueSafetyNotice('Barbell Deadlift', 10.0, 0.0)
    expect(notice?.hasWarning).toBe(true)
    expect(notice?.level).toBe('critical')
    expect(notice?.message).toContain('lumbar hyperextension')
  })

  it('enforces GAA strict neutral hammer grip rule on hammer curl movements', () => {
    const notice = getFatigueSafetyNotice('Dumbbell Hammer Curl', 9.5, 0.5)
    expect(notice?.message).toContain('palms facing inward toward each other')
    expect(notice?.message).toContain('ZERO twisting or supination')
    expect(notice?.message).toContain('thumbs pointing up')
  })
})
