import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dispatchCoachOnboardingAlert } from './coach-onboarding-alerts'

const mockSend = vi.fn()

vi.mock('resend', () => {
  return {
    Resend: class {
      emails = {
        send: mockSend,
      }
    },
  }
})

describe('dispatchCoachOnboardingAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('RESEND_API_KEY', 're_test_key_123')
    vi.stubEnv('COACH_ALERT_EMAIL', 'coach@forge-athletic.app')
    vi.stubEnv('COACH_ALERT_FROM_EMAIL', 'coaching@forge-athletic.app')
  })

  it('skips dispatch when RESEND_API_KEY is not set', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    const result = await dispatchCoachOnboardingAlert({
      userId: 'test-user-123',
      clientName: 'Kalli Seabrooke',
      clientEmail: 'kalicocat7@yahoo.com',
      goal: 'Fat Loss',
    })

    expect(result.skipped).toBe(true)
    expect(result.sent).toBe(false)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('successfully dispatches coach alert with athlete details and portal link', async () => {
    mockSend.mockResolvedValueOnce({ data: { id: 'msg_test_abc123' }, error: null })

    const result = await dispatchCoachOnboardingAlert({
      userId: 'test-user-123',
      clientName: 'Kalli Seabrooke',
      clientEmail: 'kalicocat7@yahoo.com',
      goal: 'Strength Endurance & Athletic Conditioning',
      trainingDaysPerWeek: 3,
      equipmentAccess: ['Dumbbells', 'Bench', 'Cables'],
      parqAnyYes: false,
    })

    expect(result.sent).toBe(true)
    expect(result.messageId).toBe('msg_test_abc123')
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'coaching@forge-athletic.app',
        to: 'coach@forge-athletic.app',
        replyTo: 'kalicocat7@yahoo.com',
        subject: expect.stringContaining('Kalli Seabrooke completed onboarding'),
        text: expect.stringContaining('/coach/clients/test-user-123?tab=ai-onboarding'),
      })
    )
  })

  it('handles resend error gracefully without throwing', async () => {
    mockSend.mockResolvedValueOnce({ data: null, error: { message: 'Quota exceeded' } })

    const result = await dispatchCoachOnboardingAlert({
      userId: 'test-user-123',
      clientName: 'Kalli Seabrooke',
      clientEmail: 'kalicocat7@yahoo.com',
    })

    expect(result.sent).toBe(false)
    expect(result.reason).toBe('Quota exceeded')
  })
})
