import { Resend } from 'resend'

export interface CoachOnboardingAlertParams {
  userId: string
  clientName: string
  clientEmail: string
  goal?: string | null
  trainingDaysPerWeek?: number | null
  equipmentAccess?: string[] | null
  parqAnyYes?: boolean | null
  injuriesLimitations?: string | null
}

export interface CoachOnboardingAlertResult {
  sent: boolean
  skipped: boolean
  reason?: string
  messageId?: string
}

/**
 * Dispatches an automated real-time notification email to Coach Gordon
 * when an athlete completes their baseline fitness setup, PAR-Q+ questionnaire,
 * and electronic consents.
 */
export async function dispatchCoachOnboardingAlert(
  params: CoachOnboardingAlertParams
): Promise<CoachOnboardingAlertResult> {
  const {
    userId,
    clientName,
    clientEmail,
    goal,
    trainingDaysPerWeek,
    equipmentAccess,
    parqAnyYes,
    injuriesLimitations,
  } = params

  const apiKey = process.env.RESEND_API_KEY
  const coachEmail = process.env.COACH_ALERT_EMAIL || 'coach@forge-athletic.app'
  const fromEmail =
    process.env.COACH_ALERT_FROM_EMAIL ||
    process.env.MARKETING_FROM_EMAIL ||
    'Forge Athletic Alerts <coaching@forge-athletic.app>'

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://forge-athletic.app'
  const coachPortalUrl = `${baseUrl}/coach/clients/${userId}?tab=ai-onboarding`

  console.log(`[ONBOARDING_ALERT] Athlete "${clientName}" (${clientEmail}) completed onboarding. Preparing coach notification to ${coachEmail}...`)

  if (!apiKey) {
    console.warn('[OnboardingAlert] RESEND_API_KEY not configured; skipping email dispatch.')
    return { sent: false, skipped: true, reason: 'Missing RESEND_API_KEY' }
  }

  const equipmentList = Array.isArray(equipmentAccess) && equipmentAccess.length > 0
    ? equipmentAccess.join(', ')
    : 'None specified'

  const medicalStatus = parqAnyYes
    ? '⚠️ Flagged (Answered YES to 1+ PAR-Q questions — Medical Review Required)'
    : '✅ Cleared (Low Risk — All PAR-Q questions answered NO)'

  const subject = `🎯 [Intake Complete] ${clientName} completed onboarding — ready for program deployment`

  const text = `Hi Coach Gordon,

${clientName} (${clientEmail}) has just completed their baseline fitness onboarding and health intake on Forge Athletic.

Athlete Details:
• Name: ${clientName}
• Email: ${clientEmail}
• Primary Goal: ${goal || 'Not specified'}
• Training Frequency: ${trainingDaysPerWeek ? `${trainingDaysPerWeek} days/week` : 'Not specified'}
• Equipment: ${equipmentList}
• Medical/PAR-Q Status: ${medicalStatus}
${injuriesLimitations ? `• Orthopedic Limitations/Notes: ${injuriesLimitations}\n` : ''}
Your AI Onboarding Studio has pre-synthesized their NASM OPT™ periodized macrocycle based on their intake answers.

Review & Deploy Program:
${coachPortalUrl}

Forge Athletic Master Coach Gateway
`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B1523; color: #FFFFFF; padding: 28px; border-radius: 10px; border: 1px solid #C5A059;">
      <div style="border-bottom: 1px solid rgba(197, 160, 89, 0.4); padding-bottom: 16px; margin-bottom: 20px;">
        <p style="margin: 0 0 6px 0; color: #C5A059; font-size: 11px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase;">
          Forge Athletic · Master Coach Gateway
        </p>
        <h2 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.02em;">
          🎯 Client Onboarding Completed
        </h2>
      </div>

      <p style="font-size: 15px; color: #CBD5E1; margin: 0 0 20px 0; line-height: 1.6;">
        <strong style="color: #FFFFFF;">${clientName}</strong> (<a href="mailto:${clientEmail}" style="color: #C5A059; text-decoration: none;">${clientEmail}</a>) has completed their baseline fitness setup, PAR-Q+ health clearance, and legal consents.
      </p>

      <div style="background: rgba(255, 255, 255, 0.05); padding: 18px 20px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #CBD5E1;">
          <tr>
            <td style="padding: 6px 0; width: 140px; font-weight: 600; color: #94A3B8;">Primary Goal:</td>
            <td style="padding: 6px 0; color: #FFFFFF; font-weight: 600;">${goal || 'General Fitness & Recomposition'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #94A3B8;">Schedule:</td>
            <td style="padding: 6px 0; color: #FFFFFF;">${trainingDaysPerWeek ? `${trainingDaysPerWeek} days per week` : 'Not specified'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #94A3B8;">Equipment:</td>
            <td style="padding: 6px 0; color: #FFFFFF;">${equipmentList}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #94A3B8;">PAR-Q+ Health:</td>
            <td style="padding: 6px 0; color: ${parqAnyYes ? '#F87171' : '#34D399'}; font-weight: 600;">
              ${medicalStatus}
            </td>
          </tr>
          ${injuriesLimitations ? `
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #94A3B8;">Limitations:</td>
            <td style="padding: 6px 0; color: #FCD34D;">${injuriesLimitations}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <div style="text-align: center; margin: 30px 0 24px 0;">
        <a href="${coachPortalUrl}" style="display: inline-block; background: #C5A059; color: #0B1523; font-weight: 800; font-size: 14px; letter-spacing: 0.05em; text-transform: uppercase; padding: 14px 28px; border-radius: 6px; text-decoration: none; box-shadow: 0 4px 14px rgba(197, 160, 89, 0.35);">
          Deploy Program in Coach Portal →
        </a>
      </div>

      <p style="font-size: 12px; color: #64748B; text-align: center; margin: 0; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 16px;">
        Clicking the link above will open the AI Onboarding Studio for ${clientName}, where you can certify and deploy their 12-week OPT™ periodization plan with one click.
      </p>
    </div>
  `

  try {
    const resend = new Resend(apiKey)
    const result = await resend.emails.send({
      from: fromEmail,
      to: coachEmail,
      replyTo: clientEmail,
      subject,
      text,
      html,
    })

    if (result.error) {
      console.error('[OnboardingAlert] Resend error dispatching alert:', result.error)
      return { sent: false, skipped: false, reason: result.error.message }
    }

    console.log(`[ONBOARDING_ALERT] Notification successfully delivered to ${coachEmail}. Message ID: ${result.data?.id}`)
    return { sent: true, skipped: false, messageId: result.data?.id }
  } catch (err) {
    console.error('[OnboardingAlert] Exception caught while sending coach alert:', err)
    return { sent: false, skipped: false, reason: err instanceof Error ? err.message : String(err) }
  }
}
