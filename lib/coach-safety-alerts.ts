import { Resend } from 'resend'
import { sanitizePiiString } from '@/src/lib/safety/clinicalGuardrails'
import type { AskCoachGordonRequest, AskCoachGordonResponse } from './ask-coach-gordon-types'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export interface SafetyAlertDispatchParams {
  request: AskCoachGordonRequest
  response: AskCoachGordonResponse
  clientEmail?: string
  clientPhone?: string
}

export interface SafetyAlertDispatchResult {
  sent: boolean
  skipped: boolean
  reason?: string
  messageId?: string
}

/**
 * Dispatches a minimum-necessary real-time safety alert to Coach Gordon when an athlete's
 * consultation triggers escalation or emergency 911 protocols.
 *
 * PRIVACY SAFEGUARD (#29): Raw symptom statements, medical/orthopedic contraindication tags,
 * readiness biometrics, and triage transcripts are NEVER transmitted in plaintext email.
 * The email directs the coach to review the encrypted Coach Portal safety queue.
 */
export async function dispatchCoachSafetyAlert(
  params: SafetyAlertDispatchParams
): Promise<SafetyAlertDispatchResult> {
  const { request, response } = params

  if (!response.requiresCoachPing && !response.isEmergency911) {
    return { sent: false, skipped: true, reason: 'No coach escalation required' }
  }

  const apiKey = process.env.RESEND_API_KEY
  const coachEmail = process.env.COACH_ALERT_EMAIL || 'coach@forge-athletic.app'
  const fromEmail =
    process.env.COACH_ALERT_FROM_EMAIL ||
    process.env.MARKETING_FROM_EMAIL ||
    'Forge Athletic Safety <onboarding@resend.dev>'
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://forge-athletic.app').replace(/\/+$/, '')
  const portalUrl = `${baseUrl}/coach`

  const safeAthleteName = sanitizePiiString(request.athleteName || 'Athlete').slice(0, 64) || 'Athlete'

  const auditLog = {
    eventType: 'COACH_GORDON_SAFETY_ALERT',
    timestamp: new Date().toISOString(),
    urgencyTier: response.isEmergency911 ? 'EMERGENCY_911' : 'COACH_CLINICAL_REVIEW',
    optPhase: Number(request.nasmOptPhase) || 1,
    hasContraindications: Boolean(request.contraindicationTags && request.contraindicationTags.length > 0),
  }
  console.warn('[SAFETY_AUDIT_LOG]', JSON.stringify(auditLog))

  if (!apiKey) {
    console.warn('[SafetyAlert] RESEND_API_KEY is not configured; skipping email dispatch.')
    return { sent: false, skipped: true, reason: 'Missing RESEND_API_KEY' }
  }

  try {
    const resend = new Resend(apiKey)
    const subject = response.isEmergency911
      ? '🚨 [URGENT ACTION] Forge Athletic Safety Queue Alert'
      : '⚠️ [ACTION REQUIRED] Forge Athletic Coaching Escalation'
    const safeHtmlAthlete = escapeHtml(safeAthleteName)
    const safePhase = Number(request.nasmOptPhase) || 1

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0E18; color: #FFFFFF; padding: 24px; border-radius: 8px; border: 1px solid #D4A017;">
        <div style="border-bottom: 1px solid rgba(212, 160, 23, 0.4); padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: ${response.isEmergency911 ? '#EF4444' : '#F59E0B'}; margin: 0 0 8px 0; font-size: 20px;">
            ${response.isEmergency911 ? '🚨 CRITICAL MEDICAL EMERGENCY DETECTED' : '🛡️ SECURE COACHING SAFETY ESCALATION'}
          </h2>
          <p style="margin: 0; color: #9CA3AF; font-size: 13px;">
            Forge Athletic Minimum-Necessary Safeguard Notification
          </p>
        </div>

        <div style="background: rgba(255, 255, 255, 0.05); padding: 16px; border-radius: 6px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Member:</strong> ${safeHtmlAthlete}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Urgency Tier:</strong> <span style="color: #FCD34D;">${response.isEmergency911 ? 'Emergency 911 Stop Triggered' : 'Priority Coach Review Required'}</span></p>
          <p style="margin: 0; font-size: 14px;"><strong>OPT™ Phase:</strong> Phase ${safePhase}</p>
        </div>

        <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #CBD5E1;">
          To protect member health privacy, symptom statements, orthopedic flags, and biometric readiness scores are withheld from unencrypted email. Sign in to the authenticated Forge Coach Portal to review the encrypted safety queue.
        </p>

        <div style="text-align: center; margin-bottom: 20px;">
          <a href="${portalUrl}" style="display: inline-block; background: #D4A017; color: #0A0E18; font-weight: 800; font-size: 13px; padding: 12px 24px; border-radius: 6px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em;">
            Open Secure Safety Queue →
          </a>
        </div>

        <div style="text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 16px;">
          <p style="margin: 0; font-size: 11px; color: #6B7280;">
            Dispatched by Forge Athletic Minimum-Necessary Notification Shield.
          </p>
        </div>
      </div>
    `

    const text = [
      'FORGE ATHLETIC SECURE SAFETY ALERT',
      '==================================',
      `Member: ${safeAthleteName}`,
      `Urgency Tier: ${response.isEmergency911 ? 'EMERGENCY 911' : 'COACH REVIEW REQUIRED'}`,
      `OPT Phase: Phase ${safePhase}`,
      '',
      'Health details, orthopedic flags, and symptom statements are withheld from plaintext email.',
      `Sign in to review the encrypted safety queue: ${portalUrl}`,
    ].join('\n')

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: coachEmail,
      subject,
      html,
      text,
    })

    if (error) {
      console.error('[SafetyAlert] Resend returned error:', error)
      return { sent: false, skipped: false, reason: error.message }
    }

    return { sent: true, skipped: false, messageId: data?.id }
  } catch (err) {
    console.error('[SafetyAlert] Failed to dispatch safety alert:', err)
    return { sent: false, skipped: false, reason: err instanceof Error ? err.message : String(err) }
  }
}
