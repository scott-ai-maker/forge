import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendMock = vi.fn()

vi.mock('resend', () => ({
  Resend: class {
    emails = {
      send: sendMock,
    }
  },
}))

import { dispatchCoachSafetyAlert } from './coach-safety-alerts'

describe('Coach Safety Alerts Subsystem (lib/coach-safety-alerts)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('RESEND_API_KEY', 're_test_safety_key')
    vi.stubEnv('COACH_ALERT_EMAIL', 'scott.gordon72@outlook.com')
    vi.stubEnv('COACH_ALERT_FROM_EMAIL', 'Forge Athletic Safety <alerts@forge-athletic.com>')
    sendMock.mockResolvedValue({ data: { id: 'alert_msg_987' }, error: null })
  })

  it('skips dispatching alert if requiresCoachPing and isEmergency911 are false', async () => {
    const result = await dispatchCoachSafetyAlert({
      request: {
        question: 'What is the best tempo for hypertrophy?',
        athleteName: 'Jordan',
      },
      response: {
        answerMarkdown: 'Use a 2-0-2-0 tempo.',
        spokenAudioText: 'Use a 2-0-2-0 tempo.',
        relevantCurriculums: ['Hypertrophy Biomechanics'],
        suggestedFollowUps: ['What about rest times?'],
        requiresCoachPing: false,
        isEmergency911: false,
      },
    })

    expect(result.skipped).toBe(true)
    expect(result.sent).toBe(false)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('dispatches alert to Coach Scott Gordon when requiresCoachPing is true', async () => {
    const result = await dispatchCoachSafetyAlert({
      request: {
        question: 'I had lumbar fusion surgery 4 months ago and feel a twinge.',
        athleteName: 'Alex Mercer',
        nasmOptPhase: 1,
        contraindicationTags: ['lumbar_disc_condition'],
      },
      response: {
        answerMarkdown: 'Stop and consult your physician immediately.',
        spokenAudioText: 'Stop and consult your physician.',
        relevantCurriculums: ['Scope of Practice'],
        suggestedFollowUps: ['Contact Coach Scott'],
        requiresCoachPing: true,
        coachPingReason: 'Complex situation detected (surgery) requiring direct review by Coach Scott Gordon.',
      },
    })

    expect(result.sent).toBe(true)
    expect(result.messageId).toBe('alert_msg_987')
    expect(sendMock).toHaveBeenCalledTimes(1)
    const callArgs = sendMock.mock.calls[0][0]
    expect(callArgs.to).toBe('scott.gordon72@outlook.com')
    expect(callArgs.subject).toContain('COACH ACTION REQUIRED')
    expect(callArgs.subject).toContain('Alex Mercer')
    expect(callArgs.html).toContain('lumbar_disc_condition')
    expect(callArgs.html).toContain('lumbar fusion surgery')
  })

  it('dispatches critical 911 alert when isEmergency911 is true', async () => {
    const result = await dispatchCoachSafetyAlert({
      request: {
        question: 'I have crushing chest pain and left arm numbness.',
        athleteName: 'Dave',
      },
      response: {
        answerMarkdown: 'CALL 911 IMMEDIATELY.',
        spokenAudioText: 'Call 911 immediately.',
        relevantCurriculums: ['Clinical Liability Protection'],
        suggestedFollowUps: ['Call 911'],
        requiresCoachPing: true,
        isEmergency911: true,
        coachPingReason: 'Critical medical red flags (chest pain/left arm numbness).',
      },
    })

    expect(result.sent).toBe(true)
    expect(sendMock).toHaveBeenCalledTimes(1)
    const callArgs = sendMock.mock.calls[0][0]
    expect(callArgs.subject).toContain('CRITICAL 911 EMERGENCY')
    expect(callArgs.html).toContain('CRITICAL MEDICAL EMERGENCY DETECTED')
  })

  it('skips email dispatch cleanly if RESEND_API_KEY is not set', async () => {
    vi.stubEnv('RESEND_API_KEY', '')

    const result = await dispatchCoachSafetyAlert({
      request: {
        question: 'My doctor told me not to lift.',
        athleteName: 'Sara',
      },
      response: {
        answerMarkdown: 'Please heed your doctor advice.',
        spokenAudioText: 'Please heed your doctor advice.',
        relevantCurriculums: ['Scope of Practice'],
        suggestedFollowUps: [],
        requiresCoachPing: true,
      },
    })

    expect(result.sent).toBe(false)
    expect(result.skipped).toBe(true)
    expect(result.reason).toBe('Missing RESEND_API_KEY')
    expect(sendMock).not.toHaveBeenCalled()
  })
})
