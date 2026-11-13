import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

const { resendSendMock, sendSmsMock } = vi.hoisted(() => ({
  resendSendMock: vi.fn(),
  sendSmsMock: vi.fn(),
}))

vi.mock('resend', () => ({
  Resend: class {
    emails = {
      send: resendSendMock,
    }
  },
}))

vi.mock('@/lib/sms', async () => {
  const actual = await vi.importActual<typeof import('@/lib/sms')>('@/lib/sms')
  return {
    ...actual,
    sendSms: sendSmsMock,
  }
})

import {
  ALL_LAUNCH_TEMPLATE_IDS,
  LAUNCH_AUTOMATION_TEMPLATES,
  computeLocalWallClockUtc,
  dispatchDueLaunchAutomations,
  evaluateAutomationSuppression,
  evaluateScheduleReadiness,
  renderAutomationTemplate,
  suppressOnAccountActivated,
  suppressOnScreeningBooked,
  triggerPartnerPassGuestWelcome,
} from '@/src/lib/automations/launchSequence'

describe('Launch, Rescue, Referral & Retention Email/SMS Automation Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('RESEND_API_KEY', 're_test_launch_suite')
    vi.stubEnv('MARKETING_FROM_EMAIL', 'Coach Gordon <coach@forge-athletic.app>')
    vi.stubEnv('APP_BASE_URL', 'https://forge-athletic.app')
    resendSendMock.mockResolvedValue({ data: { id: 're_msg_001' }, error: null })
    sendSmsMock.mockResolvedValue({ sent: true })
  })

  it('defines all 10 Email/SMS templates across Steps 1–8 with zero unresolved placeholders when rendered', () => {
    expect(ALL_LAUNCH_TEMPLATE_IDS).toHaveLength(10)

    for (const templateId of ALL_LAUNCH_TEMPLATE_IDS) {
      const rendered = renderAutomationTemplate(templateId, {
        email: 'member@example.com',
        phone: '+16175550142',
        firstName: 'Jordan',
        guestFirstName: 'Taylor',
        referrerFirstName: 'Jordan',
        expirationDate: 'December 20, 2026',
        account_activated: templateId !== 'rescue_02a_email' && templateId !== 'rescue_02b_sms',
        screening_booked: false,
        guest_pass_redeemed: templateId === 'partner_pass_guest_07_email',
        sms_opt_in: true,
        activated_at: '2026-11-20T14:00:00Z',
      })

      if (rendered.channel === 'sms') {
        expect(rendered.body).not.toMatch(/\{\{.*\}\}/)
        expect(rendered.body).toMatch(/Reply STOP to opt out/)
        expect(rendered.body).toContain('https://forge-athletic.app/portal')
      } else {
        expect(rendered.subject).not.toMatch(/\{\{.*\}\}/)
        expect(rendered.previewText).not.toMatch(/\{\{.*\}\}/)
        expect(rendered.text).not.toMatch(/\{\{.*\}\}/)
        expect(rendered.html).not.toMatch(/\{\{.*\}\}/)
        expect(rendered.text).toContain('Unsubscribe:')
        expect(rendered.html).toContain('Unsubscribe')
        expect(rendered.headers['List-Unsubscribe']).toContain('/api/marketing/unsubscribe')
        expect(rendered.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
      }
    }
  })

  it('interpolates personalization variables accurately across Founding Member, Rescue, Screening & Partner Pass templates', () => {
    // Template 01B
    const launchEmail = renderAutomationTemplate('launch_01b_email', {
      email: 'alex@example.com',
      firstName: 'Alex Morgan',
      account_activated: false,
      screening_booked: false,
      guest_pass_redeemed: false,
      sms_opt_in: false,
    })
    expect(launchEmail.channel).toBe('email')
    if (launchEmail.channel === 'email') {
      expect(launchEmail.subject).toBe(
        'Your Founding Member Pass is live — start here (takes 2 mins)'
      )
      expect(launchEmail.text).toContain('Hi Alex,')
      expect(launchEmail.text).toContain('https://forge-athletic.app/portal')
    }

    // Template 02B SMS
    const rescueSms = renderAutomationTemplate('rescue_02b_sms', {
      phone: '617-555-0199',
      firstName: 'Sam',
      account_activated: false,
      screening_booked: false,
      guest_pass_redeemed: false,
      sms_opt_in: true,
    })
    expect(rescueSms.channel).toBe('sms')
    if (rescueSms.channel === 'sms') {
      expect(rescueSms.to).toBe('+16175550199')
      expect(rescueSms.body).toBe(
        'Forge Athletic: Hey Sam, still holding your Founding Member Pass + Lifetime Rate Lock before we release unclaimed spots to standby. Activate in 60s here: https://forge-athletic.app/portal Reply STOP to opt out'
      )
    }

    // Template 03 Screening Reminder
    const screeningEmail = renderAutomationTemplate('screening_03_email', {
      email: 'sam@example.com',
      firstName: 'Sam',
      account_activated: true,
      screening_booked: false,
      guest_pass_redeemed: false,
      sms_opt_in: false,
    })
    if (screeningEmail.channel === 'email') {
      expect(screeningEmail.text).toContain('https://forge-athletic.app/portal/screening')
    }

    // Template 07 Partner Pass Guest Welcome
    const guestEmail = renderAutomationTemplate('partner_pass_guest_07_email', {
      email: 'guest@example.com',
      guestFirstName: 'Casey',
      referrerFirstName: 'Jordan',
      expirationDate: 'December 25, 2026',
      account_activated: true,
      screening_booked: false,
      guest_pass_redeemed: true,
      sms_opt_in: false,
    })
    if (guestEmail.channel === 'email') {
      expect(guestEmail.subject).toBe(
        'Jordan unlocked 30 free days of Forge Athletic for you'
      )
      expect(guestEmail.text).toContain('Hi Casey,')
      expect(guestEmail.text).toContain('Glad to have you training alongside Jordan,')
      expect(guestEmail.text).toContain('runs through December 25, 2026.')
    }
  })

  it('enforces all suppression guards accurately (account_activated, screening_booked, guest_pass_redeemed, sms_opt_in)', () => {
    // Rule 2: 48-Hour Unclaimed Pass Rescue suppresses immediately when account_activated == true
    expect(
      evaluateAutomationSuppression('rescue_02a_email', {
        email: 'lead@example.com',
        account_activated: false,
        screening_booked: false,
        guest_pass_redeemed: false,
        sms_opt_in: false,
      }).allowed
    ).toBe(true)

    expect(
      evaluateAutomationSuppression('rescue_02a_email', {
        email: 'lead@example.com',
        account_activated: true,
        screening_booked: false,
        guest_pass_redeemed: false,
        sms_opt_in: false,
      })
    ).toEqual({ allowed: false, reason: 'account_already_activated' })

    expect(
      evaluateAutomationSuppression('rescue_02b_sms', {
        phone: '+16175550199',
        account_activated: false,
        screening_booked: false,
        guest_pass_redeemed: false,
        sms_opt_in: false,
      })
    ).toEqual({ allowed: false, reason: 'sms_not_opted_in' })

    // Rule 3: 48-Hour Screening Reminder fires ONLY if account_activated == true AND screening_booked == false
    expect(
      evaluateAutomationSuppression('screening_03_email', {
        email: 'active@example.com',
        account_activated: false,
        screening_booked: false,
        guest_pass_redeemed: false,
        sms_opt_in: false,
      })
    ).toEqual({ allowed: false, reason: 'account_not_activated' })

    expect(
      evaluateAutomationSuppression('screening_03_email', {
        email: 'active@example.com',
        account_activated: true,
        screening_booked: false,
        guest_pass_redeemed: false,
        sms_opt_in: false,
      }).allowed
    ).toBe(true)

    expect(
      evaluateAutomationSuppression('screening_03_email', {
        email: 'active@example.com',
        account_activated: true,
        screening_booked: true,
        guest_pass_redeemed: false,
        sms_opt_in: false,
      })
    ).toEqual({ allowed: false, reason: 'screening_already_booked' })

    // Rule 7: Guest Welcome requires guest_pass_redeemed == true
    expect(
      evaluateAutomationSuppression('partner_pass_guest_07_email', {
        email: 'friend@example.com',
        account_activated: true,
        screening_booked: false,
        guest_pass_redeemed: false,
        sms_opt_in: false,
      })
    ).toEqual({ allowed: false, reason: 'guest_pass_not_redeemed' })
  })

  it('computes simultaneous EST launch blast, local-timezone wall-clock schedules, and Day-30 post-activation windows accurately', () => {
    // 1. Global Launch Blast: Friday, Nov 20, 2026 at 06:00 AM EST (11:00 UTC) for BOTH NY and LA leads simultaneously
    const launchInstant = new Date('2026-11-20T11:05:00Z')
    expect(
      evaluateScheduleReadiness(
        'launch_01a_sms',
        { timezone: 'America/Los_Angeles', guest_pass_redeemed: false },
        launchInstant
      ).due
    ).toBe(true)
    expect(
      evaluateScheduleReadiness(
        'launch_01b_email',
        { timezone: 'America/New_York', guest_pass_redeemed: false },
        new Date('2026-11-20T10:59:00Z')
      ).due
    ).toBe(false)

    // 2. Local Wall-Clock: Nov 22, 2026 at 10:00 AM Local (15:00 UTC in NY vs 18:00 UTC in LA)
    const ny10amUtc = computeLocalWallClockUtc('2026-11-22', 10, 0, 'America/New_York')
    const la10amUtc = computeLocalWallClockUtc('2026-11-22', 10, 0, 'America/Los_Angeles')
    expect(ny10amUtc.toISOString()).toBe('2026-11-22T15:00:00.000Z')
    expect(la10amUtc.toISOString()).toBe('2026-11-22T18:00:00.000Z')

    // At 15:10 UTC, NY lead is due for Rescue 02A, while LA lead is NOT due yet (still 7:10 AM PST)
    const at1510Utc = new Date('2026-11-22T15:10:00Z')
    expect(
      evaluateScheduleReadiness(
        'rescue_02a_email',
        { timezone: 'America/New_York', guest_pass_redeemed: false },
        at1510Utc
      ).due
    ).toBe(true)
    expect(
      evaluateScheduleReadiness(
        'rescue_02a_email',
        { timezone: 'America/Los_Angeles', guest_pass_redeemed: false },
        at1510Utc
      ).due
    ).toBe(false)

    // 3. Day-30 Posture Scan Milestone: Activated Nov 20, 2026 -> Due Dec 20, 2026 at 09:00 AM Local
    const day30Eval = evaluateScheduleReadiness(
      'day_30_posture_06_email',
      {
        timezone: 'America/New_York',
        activated_at: '2026-11-20T13:30:00Z',
        guest_pass_redeemed: false,
      },
      new Date('2026-12-20T14:15:00Z') // 09:15 AM EST on Dec 20
    )
    expect(day30Eval.due).toBe(true)
    expect(day30Eval.targetLocalDate).toBe('2026-12-20')

    // 4. Jan 1, 2027 · 08:00 AM Local Phase 02 Transition
    expect(
      evaluateScheduleReadiness(
        'new_year_phase02_08_email',
        { timezone: 'America/New_York', guest_pass_redeemed: false },
        new Date('2027-01-01T13:05:00Z') // 08:05 AM EST
      ).due
    ).toBe(true)
  })

  it('cancels pending queue rows on account activation & screening booking, and sends Partner Pass Guest Welcome immediately', async () => {
    const updateCalls: Array<Record<string, unknown>> = []
    const mockEqChain = {
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
    }
    const mockAdmin = {
      from: vi.fn((table: string) => {
        if (table === 'marketing_email_queue') {
          return {
            update: vi.fn((payload: Record<string, unknown>) => {
              updateCalls.push(payload)
              return mockEqChain
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        if (table === 'clients') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { full_name: 'Scott Gordon', email: 'scott@forge-athletic.app' },
                  error: null,
                }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        }
      }),
    } as unknown as SupabaseClient

    const actResult = await suppressOnAccountActivated(mockAdmin, {
      userId: 'u_1',
      email: 'member@example.com',
    })
    expect(actResult.suppressedTemplates).toEqual(['rescue_02a_email', 'rescue_02b_sms'])
    expect(updateCalls[0]).toMatchObject({
      status: 'cancelled',
      last_error: 'Suppressed: account_activated=true',
    })

    const screenResult = await suppressOnScreeningBooked(mockAdmin, {
      userId: 'u_1',
    })
    expect(screenResult.suppressedTemplates).toEqual(['screening_03_email'])
    expect(updateCalls[1]).toMatchObject({
      status: 'cancelled',
      last_error: 'Suppressed: screening_booked=true',
    })

    const guestResult = await triggerPartnerPassGuestWelcome(mockAdmin, {
      guestUserId: 'guest_99',
      guestEmail: 'partner@example.com',
      guestFirstName: 'Elena',
      referrerId: 'referrer_1',
      redeemedAt: '2026-11-20T12:00:00Z',
      trialDays: 30,
    })

    expect(guestResult.sent).toBe(true)
    expect(resendSendMock).toHaveBeenCalledTimes(1)
    const sentMail = resendSendMock.mock.calls[0][0]
    expect(sentMail.to).toBe('partner@example.com')
    expect(sentMail.subject).toBe(
      'Scott unlocked 30 free days of Forge Athletic for you'
    )
    expect(sentMail.text).toContain('Hi Elena,')
    expect(sentMail.text).toContain('December 20, 2026')
  })

  it('dispatches simultaneous Launch Blast SMS + Email at Nov 20, 2026 06:00 AM EST and respects SMS opt-in flags', async () => {
    const mockAdmin = {
      from: vi.fn((table: string) => {
        if (table === 'waitlist') {
          return {
            select: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [
                  {
                    email: 'optedin@example.com',
                    first_name: 'Marcus',
                    phone: '+16175550111',
                    sms_opt_in: true,
                    timezone: 'America/New_York',
                  },
                  {
                    email: 'emailonly@example.com',
                    first_name: 'Claire',
                    phone: null,
                    sms_opt_in: false,
                    timezone: 'America/Los_Angeles',
                  },
                ],
                error: null,
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }
      }),
    } as unknown as SupabaseClient

    const summary = await dispatchDueLaunchAutomations(mockAdmin, {
      now: new Date('2026-11-20T11:02:00Z'), // 06:02 AM EST
    })

    expect(summary.evaluatedRecipients).toBe(2)
    expect(summary.dispatchedEmails).toBe(2) // Both Marcus (NY) & Claire (LA) get Launch Email simultaneously
    expect(summary.dispatchedSms).toBe(1) // Only Marcus (sms_opt_in=true) gets Launch SMS
    expect(summary.templateBreakdown.launch_01b_email.sent).toBe(2)
    expect(summary.templateBreakdown.launch_01a_sms.sent).toBe(1)
    expect(summary.templateBreakdown.launch_01a_sms.suppressed).toBe(1)
    expect(LAUNCH_AUTOMATION_TEMPLATES.post_thanksgiving_05_email.schedule).toEqual({
      mode: 'local_wall_clock',
      localDate: '2026-11-30',
      hour: 7,
      minute: 30,
    })
  })
})

