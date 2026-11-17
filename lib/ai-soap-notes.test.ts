import { describe, it, expect, vi, afterEach } from 'vitest'
import { generateClinicalSoapNotes, redactClientNameFromNotes } from './ai-soap-notes'

describe('generateClinicalSoapNotes & wiretap/PHI de-identification', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.GEMINI_API_KEY
  })

  it('redacts full and partial client names from raw coach dictation before cloud LLM calls', () => {
    const raw =
      'Alex Mercer squatted 225 lbs 3x5. Alex reported mild left knee tightness; Mercer will deload 5%.'
    const scrubbed = redactClientNameFromNotes(raw, 'Alex Mercer')
    expect(scrubbed).not.toContain('Alex')
    expect(scrubbed).not.toContain('Mercer')
    expect(scrubbed).toContain('Athlete squatted 225 lbs 3x5.')
  })

  it('de-identifies client name in outbound Gemini payload while preserving local structured S.O.A.P. output', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key'
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      subjective: 'Athlete reported strong readiness.',
                      objective: 'Squat 225x5x3 @ RPE 8.',
                      assessment: 'Neutral spine maintained.',
                      plan: 'Progress 5 lbs next session.',
                      formattedNotes:
                        '### S.O.A.P. Note\n**[S] SUBJECTIVE:** Athlete ready.\n**[O] OBJECTIVE:** 225x5x3.\n**[A] ASSESSMENT:** Good.\n**[P] PLAN:** +5 lbs.',
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )

    const result = await generateClinicalSoapNotes({
      rawNotes: 'Jordan Brooks hit 225x5x3 on back squat. Jordan felt explosive.',
      clientName: 'Jordan Brooks',
      sessionDate: '2026-11-17',
      nasmPhase: 'Phase 2',
    })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const requestInit = fetchSpy.mock.calls[0][1]
    const bodyStr = String(requestInit?.body ?? '')
    expect(bodyStr).toContain('Subject: Athlete (De-Identified)')
    expect(bodyStr).not.toContain('Jordan')
    expect(bodyStr).not.toContain('Brooks')
    expect(result.formattedNotes).toContain('[S] SUBJECTIVE')
  })

  it('synthesizes raw notes into structured S.O.A.P. sections deterministically when offline', async () => {
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
