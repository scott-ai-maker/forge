import { Resend } from 'resend'
import type { AskCoachGordonRequest, AskCoachGordonResponse } from './ask-coach-gordon-types'

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
 * Dispatches an automated real-time safety alert to Coach Scott Gordon
 * when an athlete's consultation triggers clinical escalation, emergency 911 protocols,
 * or orthopedic contraindication red flags.
 */
export async function dispatchCoachSafetyAlert(
  params: SafetyAlertDispatchParams
): Promise<SafetyAlertDispatchResult> {
  const { request, response } = params

  // Only dispatch if coach ping is required or it's an emergency
  if (!response.requiresCoachPing && !response.isEmergency911) {
    return { sent: false, skipped: true, reason: 'No coach escalation required' }
  }

  const apiKey = process.env.RESEND_API_KEY
  const coachEmail = process.env.COACH_ALERT_EMAIL || 'scott.gordon72@outlook.com'
  const fromEmail =
    process.env.COACH_ALERT_FROM_EMAIL ||
    process.env.MARKETING_FROM_EMAIL ||
    'Forge Athletic Safety <onboarding@resend.dev>'

  // Always log structured audit entry to server console for accountability
  const auditLog = {
    eventType: 'COACH_GORDON_SAFETY_ALERT',
    timestamp: new Date().toISOString(),
    urgencyTier: response.isEmergency911 ? 'EMERGENCY_911' : 'COACH_CLINICAL_REVIEW',
    athleteName: request.athleteName || 'Anonymous Athlete',
    clientAge: request.clientAge,
    clientSex: request.clientSex,
    optPhase: request.nasmOptPhase,
    goal: request.goal,
    readinessScore: request.recentReadinessScore,
    contraindicationTags: request.contraindicationTags || [],
    pingReason: response.coachPingReason || 'Flagged consultation requiring coach review',
    question: request.question,
    aiAnswerExcerpt: response.answerMarkdown ? response.answerMarkdown.slice(0, 300) : '',
  }
  console.warn('[SAFETY_AUDIT_LOG]', JSON.stringify(auditLog, null, 2))

  if (!apiKey) {
    console.warn('[SafetyAlert] RESEND_API_KEY is not configured; skipping email dispatch.')
    return { sent: false, skipped: true, reason: 'Missing RESEND_API_KEY' }
  }

  try {
    const resend = new Resend(apiKey)
    const urgencyLabel = response.isEmergency911
      ? '🚨 [CRITICAL 911 EMERGENCY] Athlete In-Session Alert'
      : '⚠️ [COACH ACTION REQUIRED] Coach Gordon Consultation Escalation'

    const subject = `${urgencyLabel} — ${request.athleteName || 'Athlete'}`

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0E18; color: #FFFFFF; padding: 24px; border-radius: 8px; border: 1px solid #D4A017;">
        <div style="border-bottom: 1px solid rgba(212, 160, 23, 0.4); padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: ${response.isEmergency911 ? '#EF4444' : '#F59E0B'}; margin: 0 0 8px 0; font-size: 20px;">
            ${response.isEmergency911 ? '🚨 CRITICAL MEDICAL EMERGENCY DETECTED' : '🛡️ COACH GORDON AI SAFETY ESCALATION'}
          </h2>
          <p style="margin: 0; color: #9CA3AF; font-size: 13px;">
            Forge Athletic Real-Time Human-in-the-Loop Safeguard Shield
          </p>
        </div>

        <div style="background: rgba(255, 255, 255, 0.05); padding: 16px; border-radius: 6px; margin-bottom: 16px;">
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Athlete:</strong> ${request.athleteName || 'Athlete'}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Urgency Reason:</strong> <span style="color: #FCD34D;">${response.coachPingReason || 'Direct coach review requested or orthopedic safety trigger'}</span></p>
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>OPT™ Phase:</strong> Phase ${request.nasmOptPhase || 1} | <strong>Goal:</strong> ${request.goal || 'General Fitness'}</p>
          ${request.contraindicationTags && request.contraindicationTags.length > 0 ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #F87171;"><strong>Known Contraindications:</strong> ${request.contraindicationTags.join(', ')}</p>` : ''}
          ${request.currentExerciseName ? `<p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Active Movement:</strong> ${request.currentExerciseName}</p>` : ''}
        </div>

        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px 0; color: #D4A017; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Athlete's Question / Statement:</h4>
          <blockquote style="margin: 0; padding: 12px 16px; background: rgba(255, 255, 255, 0.03); border-left: 3px solid #D4A017; font-style: italic; color: #E5E7EB;">
            "${request.question}"
          </blockquote>
        </div>

        <div style="margin-bottom: 24px;">
          <h4 style="margin: 0 0 8px 0; color: #9CA3AF; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">AI Coach Gordon Response Delivered:</h4>
          <div style="padding: 12px 16px; background: rgba(0, 0, 0, 0.4); border-radius: 6px; font-size: 13px; line-height: 1.5; color: #D1D5DB;">
            ${(response.answerMarkdown || '').replace(/\n/g, '<br/>')}
          </div>
        </div>

        <div style="text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 16px;">
          <p style="margin: 0; font-size: 11px; color: #6B7280;">
            This automated alert was dispatched by Forge Athletic Liability Shield to protect client safety and maintain coach supervision.
          </p>
        </div>
      </div>
    `

    const text = `
FORGE ATHLETIC SAFETY ALERT
===========================
Athlete: ${request.athleteName || 'Athlete'}
Urgency Tier: ${response.isEmergency911 ? 'EMERGENCY 911' : 'COACH CLINICAL REVIEW'}
Reason: ${response.coachPingReason || 'Review requested'}
OPT Phase: Phase ${request.nasmOptPhase || 1}
Contraindications: ${(request.contraindicationTags || []).join(', ') || 'None'}

ATHLETE'S QUESTION:
"${request.question}"

AI RESPONSE DELIVERED:
${response.answerMarkdown || ''}
    `.trim()

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
