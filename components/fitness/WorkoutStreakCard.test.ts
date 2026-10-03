import { describe, it, expect } from 'vitest'
import {
  calcStreak,
  buildHeatmap,
  formatOptPhaseDisplay,
  DAY_LABELS,
} from './WorkoutStreakCard'
import { generateExecutiveVerificationHash } from '@/lib/cryptographic-seal'

describe('WorkoutStreakCard Private Bank Institutional Standards', () => {
  it('has 7 day labels starting with Monday', () => {
    expect(DAY_LABELS).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S'])
  })

  it('formats NASM OPT phases accurately with institutional codes', () => {
    expect(formatOptPhaseDisplay(1)).toEqual({
      code: 'PHASE 1 CLEARANCE',
      label: 'Stabilization Endurance',
    })
    expect(formatOptPhaseDisplay(2)).toEqual({
      code: 'PHASE 2 CLEARANCE',
      label: 'Strength Endurance',
    })
    expect(formatOptPhaseDisplay('Phase 3: Hypertrophy')).toEqual({
      code: 'PHASE 3 CLEARANCE',
      label: 'Muscular Development',
    })
    expect(formatOptPhaseDisplay(4)).toEqual({
      code: 'PHASE 4 CLEARANCE',
      label: 'Maximal Strength',
    })
    expect(formatOptPhaseDisplay(5)).toEqual({
      code: 'PHASE 5 CLEARANCE',
      label: 'Power & Velocity',
    })
  })

  it('calculates consecutive protocol continuity accurately', () => {
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10)

    const set = new Set([today, yesterday, twoDaysAgo])
    expect(calcStreak(set)).toBe(3)

    const emptySet = new Set<string>()
    expect(calcStreak(emptySet)).toBe(0)
  })

  it('builds 12-week longitudinal density heatmap cells', () => {
    const dates = new Set(['2026-09-01', '2026-09-02'])
    const cells = buildHeatmap(dates, 12)
    expect(cells.length).toBe(12 * 7)
    expect(cells[0]).toHaveProperty('date')
    expect(cells[0]).toHaveProperty('count')
    expect(cells[0]).toHaveProperty('weekIdx')
    expect(cells[0]).toHaveProperty('dayIdx')
  })

  it('binds deterministic executive verification hash to workout workload', () => {
    const hash = generateExecutiveVerificationHash({
      athleteId: 'scott-boardroom',
      sessionDate: '2026-09-12',
      totalVolumeKg: 18450,
      totalSets: 28,
      nasmOptPhase: 2,
    })
    expect(hash).toMatch(/^GAA-SIG-[0-9A-F]{4}-EXEC$/)
  })
})
