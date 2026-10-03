import { describe, it, expect } from 'vitest'
import {
  roundToNearestIncrement,
  calculateDropStages,
  calculateMyoRepsProtocol,
  formatIntensityProtocolNotes,
  parseIntensityProtocolNotes,
  type IntensityProtocolData,
} from './intensity-protocols-engine'

describe('intensity-protocols-engine', () => {
  it('rounds weights accurately to specified increments', () => {
    expect(roundToNearestIncrement(183, 5)).toBe(185)
    expect(roundToNearestIncrement(181, 5)).toBe(180)
    expect(roundToNearestIncrement(47.2, 2.5)).toBe(47.5)
    expect(roundToNearestIncrement(2, 5)).toBe(5)
  })

  it('calculates drop stages accurately with percentage reductions and mechanical volume', () => {
    // 200 lbs initial, 8 reps, 2 drops @ 20%
    const stages = calculateDropStages(200, 8, 2, 20, 5)
    expect(stages.length).toBe(3)

    // Stage 1
    expect(stages[0].stageNumber).toBe(1)
    expect(stages[0].weightLbs).toBe(200)
    expect(stages[0].reps).toBe(8)
    expect(stages[0].volumeLbs).toBe(1600)

    // Stage 2: 200 * 0.8 = 160
    expect(stages[1].stageNumber).toBe(2)
    expect(stages[1].weightLbs).toBe(160)
    expect(stages[1].percentDropFromInitial).toBe(20)

    // Stage 3: 160 * 0.8 = 128 -> rounded to 130
    expect(stages[2].stageNumber).toBe(3)
    expect(stages[2].weightLbs).toBe(130)
    expect(stages[2].percentDropFromInitial).toBe(35)
  })

  it('calculates Myo-Reps and rest-pause effective repetitions accurately', () => {
    const myo = calculateMyoRepsProtocol(135, 10, [4, 3, 3], 15)
    expect(myo.activationWeightLbs).toBe(135)
    expect(myo.activationReps).toBe(10)
    expect(myo.intraRestSeconds).toBe(15)
    expect(myo.miniSets).toEqual([4, 3, 3])
    // Total reps = 10 + 4 + 3 + 3 = 20
    expect(myo.totalVolumeLbs).toBe(135 * 20)
    // Total effective reps = 4 + 3 + 3 + 5 = 15
    expect(myo.totalEffectiveReps).toBe(15)
  })

  it('formats and parses intensity protocol notes correctly', () => {
    const data: IntensityProtocolData = {
      type: 'drop_set',
      exerciseName: 'Barbell Bench Press',
      initialWeightLbs: 225,
      initialReps: 8,
      stages: [
        { stageNumber: 1, weightLbs: 225, reps: 8, percentDropFromInitial: 0, volumeLbs: 1800 },
        { stageNumber: 2, weightLbs: 185, reps: 6, percentDropFromInitial: 18, volumeLbs: 1110 },
        { stageNumber: 3, weightLbs: 135, reps: 8, percentDropFromInitial: 40, volumeLbs: 1080 },
      ],
      totalVolumeLbs: 3990,
      totalReps: 22,
    }

    const formatted = formatIntensityProtocolNotes(data, 'imperial')
    expect(formatted).toContain('[DropSet: 225lb×8 ➔ 185lb×6 ➔ 135lb×8 | 3 Stages | Vol: 3,990 lb]')

    const parsed = parseIntensityProtocolNotes(`${formatted} Great pump!`)
    expect(parsed.isIntensityProtocol).toBe(true)
    expect(parsed.type).toBe('drop_set')
    expect(parsed.rawNotesWithoutTag).toBe('Great pump!')
  })
})
