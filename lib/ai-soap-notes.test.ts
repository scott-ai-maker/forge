import { describe, it, expect } from 'vitest'
import { generateClinicalSoapNotes } from './ai-soap-notes'

describe('generateClinicalSoapNotes', () => {
  it('synthesizes raw notes into structured S.O.A.P. sections', async () => {
    const raw = 'Squatted 225 lbs 3 sets of 5 reps. RPE was 8. Slight knee valgus on set 3. Athlete felt strong and energetic.'
    const result = await generateClinicalSoapNotes({
      rawNotes: raw,
      clientName: 'Alex Mercer',
      sessionDate: '2026-08-28',
      nasmPhase: 'Phase 2 Strength Endurance',
    })

    expect(result).toBeDefined()
    expect(result.subjective).toBeTruthy()
    expect(result.objective).toBeTruthy()
    expect(result.assessment).toBeTruthy()
    expect(result.plan).toBeTruthy()
    expect(result.formattedNotes).toContain('[S] SUBJECTIVE')
    expect(result.formattedNotes).toContain('[O] OBJECTIVE')
    expect(result.formattedNotes).toContain('[A] ASSESSMENT')
    expect(result.formattedNotes).toContain('[P] PLAN')
  })

  it('throws an error if raw notes are empty', async () => {
    await expect(generateClinicalSoapNotes({ rawNotes: '   ' })).rejects.toThrow(
      'Raw notes content is required'
    )
  })
})

