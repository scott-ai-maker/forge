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
    vi.stubEnv('COACH_ALERT_EMAIL', 'coach@forge-athletic.app')
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

  it('dispatches alert to Coach Gordon when requiresCoachPing is true', async () => {
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
        suggestedFollowUps: ['Contact Coach Gordon'],
        requiresCoachPing: true,
        coachPingReason: 'Complex situation detected (surgery) requiring direct review by Coach Gordon.',
      },
    })

    expect(result.sent).toBe(true)
    expect(result.messageId).toBe('alert_msg_987')
    expect(sendMock).toHaveBeenCalledTimes(1)
    const callArgs = sendMock.mock.calls[0][0]
    expect(callArgs.to).toBe('coach@forge-athletic.app')
    expect(callArgs.subject).toContain('ACTION REQUIRED')
    expect(callArgs.subject).not.toContain('Alex Mercer')
    expect(callArgs.html).not.toContain('lumbar_disc_condition')
    expect(callArgs.html).not.toContain('lumbar fusion surgery')
    expect(callArgs.text).not.toContain('lumbar_disc_condition')
    expect(callArgs.text).not.toContain('lumbar fusion surgery')
    expect(callArgs.html).toContain('/coach')
    expect(callArgs.html).not.toContain('/coach/dashboard')
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
    expect(callArgs.subject).toContain('URGENT ACTION')
    expect(callArgs.subject).not.toContain('Dave')
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

  it('HTML-escapes untrusted fields and scrubs PII from safety alert emails', async () => {
    const result = await dispatchCoachSafetyAlert({
      request: {
        question:
          'Sharp knee pain at alex@example.com or 555-234-5678 <script>alert("xss")</script>',
        athleteName: 'Alex <img src=x onerror=alert(1)>',
        currentExerciseName: 'Barbell Squat <b>Heavy</b>',
      },
      response: {
        answerMarkdown: 'Stop immediately & switch to **Box Squat** <script>evil()</script>.',
        spokenAudioText: 'Stop immediately.',
        relevantCurriculums: ['Scope of Practice'],
        suggestedFollowUps: [],
        requiresCoachPing: true,
        coachPingReason: 'Pain flag <svg onload=alert(2)>',
      },
    })

    expect(result.sent).toBe(true)
    const callArgs = sendMock.mock.calls[0][0]
    expect(callArgs.html).not.toContain('<script>')
    expect(callArgs.html).not.toContain('<img src=x')
    expect(callArgs.html).not.toContain('<svg onload=')
    expect(callArgs.html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(callArgs.html).not.toContain('alex@example.com')
    expect(callArgs.html).not.toContain('555-234-5678')
    expect(callArgs.html).not.toContain('Sharp knee pain')
    expect(callArgs.text).not.toContain('alex@example.com')
    expect(callArgs.text).not.toContain('Sharp knee pain')
  })
})
