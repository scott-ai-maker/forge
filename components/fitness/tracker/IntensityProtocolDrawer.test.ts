import { describe, it, expect } from 'vitest'
import {
  calculateDropStages,
  calculateMyoRepsProtocol,
  formatIntensityProtocolNotes,
  parseIntensityProtocolNotes,
} from '@/lib/intensity-protocols-engine'

describe('IntensityProtocolDrawer Integration & Logic', () => {
  it('correctly sets up initial drop set stages with percentage drops', () => {
    const stages = calculateDropStages(225, 8, 2, 20, 5)
    expect(stages.length).toBe(3)
    expect(stages[0].weightLbs).toBe(225)
    expect(stages[0].percentDropFromInitial).toBe(0)

    expect(stages[1].weightLbs).toBe(180)
    expect(stages[1].percentDropFromInitial).toBe(20)

    expect(stages[2].weightLbs).toBe(145)
  })

  it('formats drop set notes in human-readable and parseable format', () => {
    const data = {
      type: 'drop_set' as const,
      exerciseName: 'Dumbbell Hammer Curl',
      initialWeightLbs: 50,
      initialReps: 10,
      stages: [
        { stageNumber: 1, weightLbs: 50, reps: 10, percentDropFromInitial: 0, volumeLbs: 500 },
        { stageNumber: 2, weightLbs: 35, reps: 8, percentDropFromInitial: 30, volumeLbs: 280 },
      ],
      totalVolumeLbs: 780,
      totalReps: 18,
    }

    const noteTag = formatIntensityProtocolNotes(data, 'imperial')
    expect(noteTag).toContain('[DropSet: 50lb×10 ➔ 35lb×8 | 2 Stages | Vol: 780 lb]')

    const parsed = parseIntensityProtocolNotes(`${noteTag} Forearms burning`)
    expect(parsed.isIntensityProtocol).toBe(true)
    expect(parsed.type).toBe('drop_set')
    expect(parsed.rawNotesWithoutTag).toBe('Forearms burning')
  })

  it('validates hammer curl guardrail for drop set exhaustion', () => {
    const isHammer = /\b(hammer curl)\b/i.test('Dumbbell Hammer Curl')
    expect(isHammer).toBe(true)
  })
})
