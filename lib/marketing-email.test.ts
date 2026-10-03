import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendMock = vi.fn()

vi.mock('resend', () => ({
  Resend: class {
    emails = {
      send: sendMock,
    }
  },
}))

import { triggerLeadEmailAutomation } from './marketing-email'

describe('Marketing Email Subsystem (lib/marketing-email)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('RESEND_API_KEY', 're_test_key_12345')
    vi.stubEnv('MARKETING_FROM_EMAIL', 'advisory@gordonathleticadvisory.com')
    vi.stubEnv('MARKETING_INTERNAL_NOTIFY_EMAIL', 'internal-alerts@gordonathleticadvisory.com')
    vi.stubEnv('APP_BASE_URL', 'https://gordonathleticadvisory.com')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://gordonathleticadvisory.com')
    sendMock.mockResolvedValue({ data: { id: 'msg_123' }, error: null })
  })

  function createMockSupabase(suppressed = false) {
    return {
      from: vi.fn((table: string) => {
        if (table === 'email_suppressions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: suppressed ? { id: 'suppression_1' } : null,
              error: null,
            }),
          }
        }
        if (table === 'marketing_email_queue') {
          return {
            upsert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ error: null }),
        }
      }),
    } as any
  }

  it('dispatches founding cohort VIP briefing memo with reservation number and links', async () => {
    const supabase = createMockSupabase(false)

    await triggerLeadEmailAutomation(supabase, {
      email: 'executive@acme.corp',
      firstName: 'Alexander',
      source: 'founding_cohort',
      cohortReservationNumber: 9,
      phone: '+1 617 555 0199',
      profileType: 'executive',
      primaryGoal: 'Spinal decompression & rotational power',
    })

    // Should have sent confirmation email + internal notification
    expect(sendMock).toHaveBeenCalledTimes(2)

    // 1. Applicant Confirmation Email
    const applicantCall = sendMock.mock.calls[0][0]
    expect(applicantCall.to).toBe('executive@acme.corp')
    expect(applicantCall.subject).toBe(
      'Founding Cohort Allocation Confirmed (#9) | Gordon Athletic Advisory'
    )
    expect(applicantCall.text).toContain('OFFICIAL ALLOCATION: RESERVATION #9 OF 20')
    expect(applicantCall.text).toContain('COACH GORDON BRIEFING MEMO')
    expect(applicantCall.text).toContain('13 NASM® disciplines')
    expect(applicantCall.text).toContain('https://gordonathleticadvisory.com/intake#accreditation-portfolio')
    expect(applicantCall.text).toContain('https://gordonathleticadvisory.com/packages')

    expect(applicantCall.html).toContain('RESERVATION #9 OF 20')
    expect(applicantCall.html).toContain('Coach Gordon Briefing Memo')
    expect(applicantCall.html).toContain('Gordon Athletic Advisory')

    // 2. Internal Team Notification Email
    const internalCall = sendMock.mock.calls[1][0]
    expect(internalCall.to).toBe('internal-alerts@gordonathleticadvisory.com')
    expect(internalCall.subject).toBe(
      '[GAA] Founding Cohort Intake (#9): executive@acme.corp'
    )
    expect(internalCall.text).toContain('Reservation #: 9')
    expect(internalCall.text).toContain('Phone: +1 617 555 0199')
    expect(internalCall.text).toContain('Profile Type: executive')
    expect(internalCall.text).toContain('Primary Goal / Notes: Spinal decompression & rotational power')
  })

  it('falls back cleanly to reservation #12 when cohort number is omitted', async () => {
    const supabase = createMockSupabase(false)

    await triggerLeadEmailAutomation(supabase, {
      email: 'founder@summit.io',
      firstName: 'Elena',
      source: 'founding_cohort',
    })

    expect(sendMock).toHaveBeenCalledTimes(2)
    const applicantCall = sendMock.mock.calls[0][0]
    expect(applicantCall.subject).toBe(
      'Founding Cohort Allocation Confirmed (#12) | Gordon Athletic Advisory'
    )
    expect(applicantCall.text).toContain('RESERVATION #12 OF 20')
  })

  it('sends application received confirmation for apply source with [GAA] notification', async () => {
    const supabase = createMockSupabase(false)

    await triggerLeadEmailAutomation(supabase, {
      email: 'athlete@olympic.org',
      firstName: 'Marcus',
      source: 'apply',
      recommendedTier: 'Hybrid Concierge',
    })

    expect(sendMock).toHaveBeenCalledTimes(2)

    const applicantCall = sendMock.mock.calls[0][0]
    expect(applicantCall.subject).toBe('Application Received | Gordon Athletic Advisory')
    expect(applicantCall.text).toContain('Recommended Advisory Pathway: Hybrid Concierge.')

    const internalCall = sendMock.mock.calls[1][0]
    expect(internalCall.subject).toBe('[GAA] New application: athlete@olympic.org')
  })

  it('sends waitlist confirmation for standard waitlist source with [GAA] notification', async () => {
    const supabase = createMockSupabase(false)

    await triggerLeadEmailAutomation(supabase, {
      email: 'waitlist_user@gmail.com',
      firstName: 'Jordan',
      source: 'waitlist',
    })

    expect(sendMock).toHaveBeenCalledTimes(2)

    const applicantCall = sendMock.mock.calls[0][0]
    expect(applicantCall.subject).toBe('Priority Waitlist Confirmed | Gordon Athletic Advisory')

    const internalCall = sendMock.mock.calls[1][0]
    expect(internalCall.subject).toBe('[GAA] New waitlist lead: waitlist_user@gmail.com')
  })

  it('skips email dispatch if recipient is suppressed', async () => {
    const supabase = createMockSupabase(true) // suppressed!

    await triggerLeadEmailAutomation(supabase, {
      email: 'unsubscribed@test.com',
      firstName: 'ExClient',
      source: 'founding_cohort',
    })

    expect(sendMock).not.toHaveBeenCalled()
  })

  it('skips silently if email address is malformed', async () => {
    const supabase = createMockSupabase(false)

    await triggerLeadEmailAutomation(supabase, {
      email: 'not-an-email',
      firstName: 'BadEmail',
      source: 'founding_cohort',
    })

    expect(sendMock).not.toHaveBeenCalled()
  })

  it('respects EMAIL_LINK_BASE_URL override when configured', async () => {
    vi.stubEnv('APP_BASE_URL', 'http://localhost:3000')
    vi.stubEnv('EMAIL_LINK_BASE_URL', 'https://staging.gordonathleticadvisory.com')
    const supabase = createMockSupabase(false)

    await triggerLeadEmailAutomation(supabase, {
      email: 'alex@example.com',
      firstName: 'Alex',
      source: 'waitlist',
    })

    expect(sendMock).toHaveBeenCalled()
    const call = sendMock.mock.calls[0][0]
    expect(call.text).toContain('https://staging.gordonathleticadvisory.com/apply')
    expect(call.text).not.toContain('http://localhost:3000')
  })
})
