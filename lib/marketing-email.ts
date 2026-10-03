import type { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import crypto from 'node:crypto'

export type LeadSource = 'apply' | 'waitlist' | 'founding_cohort'

export type LeadInput = {
  email: string
  firstName?: string | null
  source: LeadSource
  recommendedTier?: string | null
  cohortReservationNumber?: number | null
  phone?: string | null
  profileType?: string | null
  primaryGoal?: string | null
}

type WelcomeInput = {
  email: string
  firstName?: string | null
  coachReplyToEmail?: string | null
}

type PasswordResetInput = {
  email: string
  resetLink: string
}

type QueueRow = {
  id: string
  email: string
  first_name: string | null
  template_key: string
  source: string
}

const DAY_MS = 24 * 60 * 60 * 1000
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const sequenceTemplates = [
  {
    key: 'launch_day_1',
    subject: 'The Closed-Loop Human Performance System (OPT™ Architecture)',
    body: (name: string, baseUrl: string) => ({
      text: [
        `Hi ${name},`,
        '',
        'Welcome to Forge Athletic.',
        '',
        'Forge Athletic pairs practical coaching with sports science that fits real life:',
        '- Automated NASM OPT™ periodization',
        '- 1RM strength telemetry and 3D AI posture audits',
        '- Wearable data support for Apple HealthKit and Android Health Connect',
        '- Training plans designed to progress with your schedule and goals',
        '',
        'The objective is simple: eliminate kinetic power leaks, protect joint longevity, and engineer undeniable physical performance.',
        '',
        `Complete your diagnostic fit quiz: ${baseUrl}/apply`,
      ].join('\n'),
      html: `<p>Hi ${name},</p>
<p>Welcome to Forge Athletic.</p>
<p>Forge Athletic pairs practical coaching with sports science that fits real life:</p>
<ul>
  <li><strong>Automated NASM OPT™ periodization</strong></li>
  <li><strong>1RM strength telemetry and 3D AI posture audits</strong></li>
  <li><strong>Wearable data support</strong> for Apple HealthKit and Android Health Connect</li>
  <li>Training plans designed to progress with your schedule and goals</li>
</ul>
<p>The objective is simple: eliminate kinetic power leaks, protect joint longevity, and engineer undeniable physical performance.</p>
<p><a href="${baseUrl}/apply">Complete your diagnostic fit quiz</a></p>`,
    }),
  },
  {
    key: 'launch_day_2',
    subject: 'Eliminating Kinetic Power Leaks: 3D Biomechanics & Postural Triage',
    body: (_name: string, baseUrl: string) => ({
      text: [
        'Before adding heavy load, we must verify structural alignment.',
        '',
        'Prolonged sitting and executive travel trigger silent kinetic distortions: anterior pelvic tilt, medial knee collapse, and forward head translation. In our platform, we screen all 5 kinetic chain checkpoints:',
        '- Foot & Ankle complex (pronation distortion)',
        '- Knee & Patella tracking (dynamic valgus)',
        '- Lumbo-Pelvic-Hip Complex (LPHC shear & pelvic tilt)',
        '- Shoulders & Thorax (upper crossed impingement)',
        '- Cervical spine plumb-line alignment',
        '',
        'Our computer-vision engine detects compensations and auto-generates 4-phase Corrective Exercise Continuums (Inhibit, Lengthen, Activate, Integrate).',
        '',
        `Explore the 3D AI Movement Audit: ${baseUrl}/audit`,
      ].join('\n'),
      html: `<p>Before adding heavy load, we must verify structural alignment.</p>
<p>Prolonged sitting and executive travel trigger silent kinetic distortions: anterior pelvic tilt, medial knee collapse, and forward head translation. In our platform, we screen all 5 kinetic chain checkpoints:</p>
<ul>
  <li>Foot & Ankle complex (pronation distortion)</li>
  <li>Knee & Patella tracking (dynamic valgus)</li>
  <li>Lumbo-Pelvic-Hip Complex (LPHC shear & pelvic tilt)</li>
  <li>Shoulders & Thorax (upper crossed impingement)</li>
  <li>Cervical spine plumb-line alignment</li>
</ul>
<p>Our computer-vision engine detects compensations and auto-generates 4-phase Corrective Exercise Continuums (Inhibit, Lengthen, Activate, Integrate).</p>
<p><a href="${baseUrl}/audit">Explore the 3D AI Movement Audit</a></p>`,
    }),
  },
  {
    key: 'launch_day_3',
    subject: 'Choose your Forge Athletic membership',
    body: (_name: string, baseUrl: string) => ({
      text: [
        'Choose the Forge Athletic membership that fits your training goals:',
        '',
        'Core Membership: $19.99/month or $149/year, with a 7-day free trial. Includes automated periodization, 1RM telemetry, and a 3D AI posture audit.',
        'Pro Athlete: $49/month. Includes Voice AI training cadences, biomechanical mesh diagnostics, and weekly performance dossiers.',
        'Transformation Direct: $199/month. Includes quarterly asynchronous video critiques with Coach Scott Gordon.',
        '',
        'Memberships renew automatically until cancelled.',
        '',
        `Compare memberships: ${baseUrl}/packages`,
      ].join('\n'),
      html: `<p>Choose the Forge Athletic membership that fits your training goals:</p>
<ol>
  <li><strong>Core Membership — $19.99/month or $149/year:</strong> 7-day free trial, automated periodization, 1RM telemetry, and a 3D AI posture audit.</li>
  <li><strong>Pro Athlete — $49/month:</strong> Voice AI training cadences, biomechanical mesh diagnostics, and weekly performance dossiers.</li>
  <li><strong>Transformation Direct — $199/month:</strong> Quarterly asynchronous video critiques with Coach Scott Gordon.</li>
</ol>
<p>Memberships renew automatically until cancelled.</p>
<p><a href="${baseUrl}/packages">Compare memberships</a></p>`,
    }),
  },
  {
    key: 'launch_day_4',
    subject: 'Executive Travel Resilience & Objective Telemetry',
    body: (_name: string, baseUrl: string) => ({
      text: [
        'High-performing executives cannot afford to lose momentum during cross-country travel or redeye flights.',
        '',
        'Forge Athletic helps you keep training when your routine changes:',
        '- Adapt your workouts to the equipment available while keeping your plan on track.',
        '- Connect supported health data to inform training and recovery.',
        '- Keep building consistency around work, travel, and everyday commitments.',
        '',
        `Take the 2-minute diagnostic fit quiz: ${baseUrl}/apply`,
      ].join('\n'),
      html: `<p>High-performing executives cannot afford to lose momentum during cross-country travel or redeye flights.</p>
<p>Forge Athletic helps you keep training when your routine changes:</p>
<ul>
  <li>Adapt your workouts to the equipment available while keeping your plan on track.</li>
  <li>Connect supported health data to inform training and recovery.</li>
  <li>Keep building consistency around work, travel, and everyday commitments.</li>
</ul>
<p><a href="${baseUrl}/apply">Take the 2-minute diagnostic fit quiz</a></p>`,
    }),
  },
  {
    key: 'launch_day_5',
    subject: 'Cohort Intake Notice & 3D Movement Diagnostic Voucher',
    body: (_name: string, baseUrl: string) => ({
      text: [
        'Start with practical training tools and add coaching support as your needs change.',
        '',
        'Core Membership offers a 7-day free trial and starts at $19.99/month, or $149/year.',
        'Pro Athlete is $49/month. Transformation Direct is $199/month.',
        '',
        'Explore the plans, compare features, and choose the option that fits your goals.',
        '',
        `Explore memberships: ${baseUrl}/packages`,
        `Find your starting point: ${baseUrl}/apply`,
      ].join('\n'),
      html: `<p>Start with practical training tools and add coaching support as your needs change.</p>
<p>Core Membership offers a 7-day free trial and starts at $19.99/month, or $149/year. Pro Athlete is $49/month. Transformation Direct is $199/month.</p>
<p>Explore the plans, compare features, and choose the option that fits your goals.</p>
<p><a href="${baseUrl}/packages">Explore memberships</a> | <a href="${baseUrl}/apply">Find your starting point</a></p>`,
    }),
  },
] as const

function getBaseUrl() {
  const customEmailBase = process.env.EMAIL_LINK_BASE_URL?.trim()
  if (customEmailBase) {
    return customEmailBase.replace(/\/+$/, '')
  }
  return (
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.MARKETING_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://forge-athletic.app' : 'http://127.0.0.1:3000')
  )
}

function normalizeEmail(email: string) {
  return email.toLowerCase().trim()
}

function safeName(name?: string | null) {
  const trimmed = (name ?? '').trim()
  return trimmed.length > 0 ? trimmed : 'there'
}

function hasEmailConfig() {
  return Boolean(process.env.RESEND_API_KEY && process.env.MARKETING_FROM_EMAIL)
}

export function getMissingEmailConfigKeys() {
  const missing: string[] = []
  if (!process.env.RESEND_API_KEY) missing.push('RESEND_API_KEY')
  if (!process.env.MARKETING_FROM_EMAIL) missing.push('MARKETING_FROM_EMAIL')
  return missing
}

export function createUnsubscribeToken(email: string): string {
  const secret =
    process.env.MARKETING_CRON_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'gaa-unsubscribe-fallback-secret'
  return crypto
    .createHmac('sha256', secret)
    .update(normalizeEmail(email))
    .digest('hex')
    .slice(0, 32)
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!email || !token || typeof token !== 'string') return false
  const expected = createUnsubscribeToken(email)
  if (token.length !== expected.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  } catch {
    return false
  }
}

export function getUnsubscribeUrl(email: string): string {
  const baseUrl = getBaseUrl()
  const token = createUnsubscribeToken(email)
  return `${baseUrl}/api/marketing/unsubscribe?email=${encodeURIComponent(normalizeEmail(email))}&token=${token}`
}

export function appendComplianceFooter(html: string, text: string, email: string) {
  const unsubUrl = getUnsubscribeUrl(email)
  const htmlFooter = `
<div style="margin-top: 36px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,0.12); font-size: 11px; color: #8899A6; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <p style="margin: 0 0 6px; font-weight: 600; color: #F59E0B;">Forge Athletic · Precision Science For Real Lives</p>
  <p style="margin: 0 0 6px;">75 Arlington St, Ste 500, Boston, MA 02116 · Membership and training updates</p>
  <p style="margin: 0;">
    You received this advisory transmission because you requested protocol access.
    <a href="${unsubUrl}" style="color: #F59E0B; text-decoration: underline; margin-left: 6px;">Unsubscribe</a>
  </p>
</div>`

  const textFooter = `

---
Forge Athletic · Precision Science For Real Lives
75 Arlington St, Ste 500, Boston, MA 02116
Unsubscribe: ${unsubUrl}`

  return {
    html: `${html}${htmlFooter}`,
    text: `${text}${textFooter}`,
    unsubUrl,
  }
}

export async function isEmailSuppressed(supabase: SupabaseClient, email: string): Promise<boolean> {
  const normalized = normalizeEmail(email)
  try {
    const { data, error } = await supabase
      .from('email_suppressions')
      .select('id')
      .eq('email', normalized)
      .maybeSingle()

    if (error) {
      // Gracefully fall back if table does not exist
      return false
    }
    return Boolean(data?.id)
  } catch {
    return false
  }
}

export async function suppressEmail(
  supabase: SupabaseClient,
  email: string,
  reason: 'unsubscribed' | 'bounced' | 'complained' | 'manual'
): Promise<void> {
  const normalized = normalizeEmail(email)
  try {
    await supabase.from('email_suppressions').upsert(
      { email: normalized, reason },
      { onConflict: 'email' }
    )
  } catch (err) {
    console.warn('Suppression insert failed (ignoring if table missing):', err)
  }

  try {
    // Also cancel all pending sequence emails in queue for this recipient
    await supabase
      .from('marketing_email_queue')
      .update({
        status: 'cancelled',
        last_error: `Suppressed: ${reason}`,
      })
      .eq('email', normalized)
      .eq('status', 'pending')
  } catch (err) {
    console.warn('Queue cancellation for suppressed email failed:', err)
  }
}

async function sendEmail(params: {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
  disableTracking?: boolean
  headers?: Record<string, string>
}) {
  if (!hasEmailConfig()) return { skipped: true as const }

  if (params.html.includes('localhost') || params.text.includes('localhost') || params.html.includes('127.0.0.1')) {
    console.warn(
      '[MarketingEmail] Warning: Email body contains localhost links. ' +
      'Mismatched link domains trigger spam filters and DMARC/reputation warnings in Resend. ' +
      'Configure EMAIL_LINK_BASE_URL=https://forge-athletic.app in .env.local for clean inbox delivery.'
    )
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { data, error } = await resend.emails.send({
    from: process.env.MARKETING_FROM_EMAIL!,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
    replyTo: params.replyTo || process.env.MARKETING_REPLY_TO_EMAIL || undefined,
    headers: params.headers,
    ...(params.disableTracking && { track: { links: false } }),
  })

  if (error) throw error
  return { skipped: false as const, id: data?.id ?? null }
}

export async function sendWelcomeEmail(input: WelcomeInput) {
  const email = normalizeEmail(input.email)
  if (!EMAIL_REGEX.test(email)) {
    throw new Error('Invalid welcome email address')
  }

  const name = safeName(input.firstName)
  const baseUrl = getBaseUrl()
  const replyTo = input.coachReplyToEmail?.trim() || process.env.MARKETING_REPLY_TO_EMAIL || undefined

  return sendEmail({
    to: email,
    subject: 'Welcome to Forge Athletic',
    html: `<h2>Welcome to Forge Athletic, ${name}!</h2>
<p>I'm glad you're here. Let's get your training foundation in place.</p>
<p>Start with these three steps:</p>
<ol>
  <li><strong>Complete your onboarding and PAR-Q+:</strong> share your training experience, goals, and available equipment.</li>
  <li><strong>Connect supported health data:</strong> link Apple HealthKit or Android Health Connect if you use them.</li>
  <li><strong>Review your training plan:</strong> get started with the periodization and training tools in your dashboard.</li>
</ol>
<p><a href="${baseUrl}/dashboard/onboarding">Continue to onboarding</a></p>
<p>If you have questions, reply to this email or message your coach in the app.</p>`,
    text: [
      `Welcome to Forge Athletic, ${name}!`,
      '',
      "I'm glad you're here. Let's get your training foundation in place.",
      '',
      'Start with these three steps:',
      '1. Complete your onboarding and PAR-Q+: share your training experience, goals, and available equipment.',
      '2. Connect supported health data: link Apple HealthKit or Android Health Connect if you use them.',
      '3. Review your training plan: get started with the periodization and training tools in your dashboard.',
      '',
      `Continue to onboarding: ${baseUrl}/dashboard/onboarding`,
      '',
      'If you have questions, reply to this email or message your coach in the app.',
    ].join('\n'),
    replyTo,
  })
}

export async function sendPasswordResetEmail(input: PasswordResetInput) {
  const email = normalizeEmail(input.email)
  if (!EMAIL_REGEX.test(email)) {
    throw new Error('Invalid password reset email address')
  }

  if (!input.resetLink || !/^https?:\/\//.test(input.resetLink)) {
    throw new Error('Invalid password reset link')
  }

  return sendEmail({
    to: email,
    subject: 'Reset your Forge Athletic password',
    html: `<h2>Password reset request</h2>
<p>We received a request to reset your password.</p>
<p><a href="${input.resetLink}">Reset your password</a></p>
<p>If the button does not work, copy and paste this URL into your browser:</p>
<p>${input.resetLink}</p>
<p>This link expires in 24 hours.</p>
<p>If you did not request this, you can ignore this email.</p>`,
    text: [
      'Password reset request',
      '',
      'We received a request to reset your password.',
      '',
      `Reset your password: ${input.resetLink}`,
      '',
      'This link expires in 24 hours.',
      'If you did not request this, you can ignore this email.',
    ].join('\n'),
    disableTracking: true,
  })
}

export async function triggerLeadEmailAutomation(
  supabase: SupabaseClient,
  input: LeadInput
) {
  const email = normalizeEmail(input.email)
  if (!EMAIL_REGEX.test(email)) return

  // Check if recipient has previously unsubscribed or bounced
  const suppressed = await isEmailSuppressed(supabase, email)
  if (suppressed) {
    return
  }

  const name = safeName(input.firstName)
  const baseUrl = getBaseUrl()
  const reservationNum =
    input.cohortReservationNumber && input.cohortReservationNumber > 0
      ? input.cohortReservationNumber
      : 12

  try {
    let confirmation: { subject: string; text: string; html: string }

    if (input.source === 'founding_cohort') {
      confirmation = {
        subject: `Forge Athletic Founding Cohort Confirmed (#${reservationNum})`,
        text: [
          `Hi ${name},`,
          '',
          'Your registration for the Forge Athletic Founding Cohort has been recorded.',
          '',
          `OFFICIAL ALLOCATION: RESERVATION #${reservationNum} OF 20`,
          '',
          '--- COACH GORDON BRIEFING MEMO ---',
          "Thank you for submitting your profile. I am reviewing each applicant's training experience, movement background, and performance goals.",
          '',
          'CREDENTIALING & METHODOLOGY UPDATE:',
          'In pursuit of unmatched sports science rigor, our advisory methodology is anchored by complete master-level accreditation across 13 NASM® disciplines—including Certified Personal Trainer (CPT), Corrective Exercise Specialist (CES), Performance Enhancement Specialist (PES), Certified Nutrition Coach (CNC), Certified Sports Nutrition Coach (CSNC), and NASM Master Trainer.',
          '',
          'WHAT HAPPENS NEXT:',
          '1. Intake & Biomechanical Review: Your profile answers have been logged into our triage queue.',
          '2. Priority Consultation Booking: Founding cohort members will receive 48-hour advance access to schedule their 1:1 Live Biomechanics Screen before public availability.',
          '3. Membership Follow-up: We will share current membership options and next steps as your application is reviewed.',
          '',
          `Explore the 13-Point Accreditation Portfolio: ${baseUrl}/intake#accreditation-portfolio`,
          `Explore Forge Athletic memberships: ${baseUrl}/packages`,
          '',
          'If you have immediate questions or specific requirements, you may reply directly to this transmission.',
          '',
          'In health and athletic excellence,',
          'Scott Gordon, Founder & Performance Director',
          'Forge Athletic · 75 Arlington St, Boston, MA',
        ].join('\n'),
        html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #080E18; color: #E2E8F0; padding: 32px 24px; border: 1px solid rgba(197, 160, 89, 0.35); border-radius: 8px;">
  <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid rgba(197, 160, 89, 0.2);">
    <p style="margin: 0; font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; color: #F59E0B; font-weight: 700;">Forge Athletic</p>
    <p style="margin: 4px 0 0; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #94A3B8;">Private Sports Science &amp; Human Performance Architecture</p>
  </div>

  <div style="margin: 24px 0; text-align: center; background: rgba(245, 158, 11, 0.08); border: 1px solid #F59E0B; border-radius: 6px; padding: 14px 16px;">
    <p style="margin: 0; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #F59E0B; font-weight: 700;">Official Allocation Confirmed</p>
    <p style="margin: 4px 0 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 18px; font-weight: 800; color: #FFFFFF; letter-spacing: 0.05em;">RESERVATION #${reservationNum} OF 20</p>
  </div>

  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px; color: #FFFFFF;">Hi ${name},</p>
  <p style="font-size: 14px; line-height: 1.6; margin-bottom: 16px; color: #CBD5E1;">Your registration for the Forge Athletic Founding Cohort has been recorded. I am reviewing each applicant's training experience, movement background, and performance goals.</p>

  <div style="background: rgba(15, 23, 42, 0.6); border-left: 3px solid #F59E0B; padding: 14px 16px; margin: 20px 0;">
    <p style="margin: 0 0 6px; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #F59E0B; font-weight: 700;">Coach Gordon Briefing Memo</p>
    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #E2E8F0;">In pursuit of unmatched sports science rigor, our advisory methodology is anchored by complete master-level accreditation across 13 NASM® disciplines—including CPT, CES, PES, CNC, CSNC, and NASM Master Trainer.</p>
  </div>

  <h3 style="font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #F59E0B; margin: 24px 0 12px; font-weight: 700;">What Happens Next</h3>
  <ol style="font-size: 13px; line-height: 1.7; color: #CBD5E1; padding-left: 20px; margin-bottom: 24px;">
    <li><strong style="color: #FFFFFF;">Intake &amp; Biomechanical Review:</strong> Your profile answers have been logged into our triage queue.</li>
    <li><strong style="color: #FFFFFF;">Priority Consultation Booking:</strong> Founding cohort members receive 48-hour advance access to schedule their 1:1 Live Biomechanics Screen before public availability.</li>
    <li><strong style="color: #FFFFFF;">Membership Follow-up:</strong> We will share current membership options and next steps as your application is reviewed.</li>
  </ol>

  <div style="display: flex; gap: 12px; margin: 28px 0 20px; flex-wrap: wrap;">
    <a href="${baseUrl}/intake#accreditation-portfolio" style="background: #F59E0B; color: #080E18; font-weight: 700; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; padding: 12px 20px; border-radius: 4px; display: inline-block;">View Accreditation Portfolio</a>
    <a href="${baseUrl}/packages" style="background: transparent; color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.5); font-weight: 700; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; padding: 12px 20px; border-radius: 4px; display: inline-block;">Forge Athletic Memberships</a>
  </div>

  <p style="font-size: 13px; line-height: 1.6; margin-top: 24px; color: #94A3B8;">If you have immediate orthopedic questions or specific scheduling requirements, you may reply directly to this transmission.</p>

  <div style="margin-top: 28px; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
    <p style="margin: 0; font-size: 13px; font-weight: 600; color: #FFFFFF;">Scott Gordon</p>
    <p style="margin: 2px 0 0; font-size: 11px; color: #F59E0B;">Founder · Forge Athletic</p>
  </div>
</div>`,
      }
    } else if (input.source === 'apply') {
      confirmation = {
        subject: 'Application Received | Forge Athletic',
        text: [
          `Hi ${name},`,
          '',
          'Thank you for submitting your training intake with Forge Athletic.',
          `Recommended starting point: ${input.recommendedTier ?? 'Core Membership'}.`,
          'Coach Scott Gordon will review your goals and training background.',
          '',
          `Explore Forge Athletic memberships: ${baseUrl}/packages`,
        ].join('\n'),
        html: `<p>Hi ${name},</p>
<p>Thank you for submitting your training intake with Forge Athletic.</p>
<p>Recommended starting point: <strong>${input.recommendedTier ?? 'Core Membership'}</strong>.</p>
<p>Coach Scott Gordon will review your goals and training background.</p>
<p><a href="${baseUrl}/packages">Explore Forge Athletic memberships</a></p>`,
      }
    } else {
      confirmation = {
        subject: 'Forge Athletic Updates | You are on the list',
        text: [
          `Hi ${name},`,
          '',
          'You are on the Forge Athletic updates list.',
          'We will share product updates, training resources, and membership news by email.',
          '',
          `Complete your diagnostic fit quiz at any time: ${baseUrl}/apply`,
        ].join('\n'),
        html: `<p>Hi ${name},</p>
<p>You are on the Forge Athletic updates list.</p>
<p>We will share product updates, training resources, and membership news by email.</p>
<p><a href="${baseUrl}/apply">Complete your diagnostic fit quiz</a></p>`,
      }
    }

    const compliance = appendComplianceFooter(confirmation.html, confirmation.text, email)

    await sendEmail({
      to: email,
      subject: confirmation.subject,
      html: compliance.html,
      text: compliance.text,
      headers: {
        'List-Unsubscribe': `<${compliance.unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })
  } catch (err) {
    console.error('Lead confirmation email failed:', err)
  }

  try {
    const internalTo = process.env.MARKETING_INTERNAL_NOTIFY_EMAIL
    if (internalTo) {
      const subject =
        input.source === 'founding_cohort'
          ? `[GAA] Founding Cohort Intake (#${reservationNum}): ${email}`
          : `[GAA] New ${input.source === 'apply' ? 'application' : 'waitlist lead'}: ${email}`

      await sendEmail({
        to: internalTo,
        subject,
        text: [
          `Source: ${input.source}`,
          `Email: ${email}`,
          `Name: ${safeName(input.firstName)}`,
          ...(input.cohortReservationNumber ? [`Reservation #: ${input.cohortReservationNumber}`] : []),
          ...(input.phone ? [`Phone: ${input.phone}`] : []),
          ...(input.profileType ? [`Profile Type: ${input.profileType}`] : []),
          ...(input.primaryGoal ? [`Primary Goal / Notes: ${input.primaryGoal}`] : []),
          `Recommended tier: ${input.recommendedTier ?? 'n/a'}`,
          `Captured at: ${new Date().toISOString()}`,
        ].join('\n'),
        html: `<p><strong>Source:</strong> ${input.source}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Name:</strong> ${safeName(input.firstName)}</p>
${input.cohortReservationNumber ? `<p><strong>Reservation #:</strong> ${input.cohortReservationNumber}</p>` : ''}
${input.phone ? `<p><strong>Phone:</strong> ${input.phone}</p>` : ''}
${input.profileType ? `<p><strong>Profile Type:</strong> ${input.profileType}</p>` : ''}
${input.primaryGoal ? `<p><strong>Primary Goal / Notes:</strong> ${input.primaryGoal}</p>` : ''}
<p><strong>Recommended tier:</strong> ${input.recommendedTier ?? 'n/a'}</p>
<p><strong>Captured at:</strong> ${new Date().toISOString()}</p>`,
      })
    }
  } catch (err) {
    console.error('Internal notify email failed:', err)
  }

  try {
    const sequenceEnabled = process.env.MARKETING_SEQUENCE_ENABLED !== '0'
    if (sequenceEnabled) {
      const now = Date.now()
      const queueRows = sequenceTemplates.map((template, index) => ({
        email,
        first_name: input.firstName?.trim() || null,
        template_key: template.key,
        source: `launch_sequence_${input.source}`,
        send_after: new Date(now + index * DAY_MS).toISOString(),
      }))

      const { error } = await supabase
        .from('marketing_email_queue')
        .upsert(queueRows, { onConflict: 'email,template_key', ignoreDuplicates: true })

      if (error) throw error
    }
  } catch (err) {
    console.error('Sequence queue insert failed:', err)
  }
}

export async function dispatchPendingSequenceEmails(
  supabase: SupabaseClient,
  limit = 25
) {
  const { data, error } = await supabase
    .from('marketing_email_queue')
    .select('id,email,first_name,template_key,source')
    .eq('status', 'pending')
    .lte('send_after', new Date().toISOString())
    .order('send_after', { ascending: true })
    .limit(limit)

  if (error) throw error

  const rows = (data ?? []) as QueueRow[]
  let sent = 0
  let failed = 0

  for (const row of rows) {
    // 1. Check suppression list before sending
    const suppressed = await isEmailSuppressed(supabase, row.email)
    if (suppressed) {
      await supabase
        .from('marketing_email_queue')
        .update({
          status: 'cancelled',
          attempts: 0,
          last_error: 'Recipient is unsubscribed or suppressed',
        })
        .eq('id', row.id)
      continue
    }

    const template = sequenceTemplates.find(t => t.key === row.template_key)
    if (!template) {
      failed += 1
      await supabase
        .from('marketing_email_queue')
        .update({ status: 'failed', attempts: 1, last_error: `Unknown template: ${row.template_key}` })
        .eq('id', row.id)
      continue
    }

    try {
      const payload = template.body(safeName(row.first_name), getBaseUrl())
      const compliance = appendComplianceFooter(payload.html, payload.text, row.email)

      const sendResult = await sendEmail({
        to: row.email,
        subject: template.subject,
        html: compliance.html,
        text: compliance.text,
        headers: {
          'List-Unsubscribe': `<${compliance.unsubUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })

      await supabase
        .from('marketing_email_queue')
        .update({
          status: 'sent',
          attempts: 1,
          provider_message_id: sendResult.skipped ? null : sendResult.id,
          sent_at: new Date().toISOString(),
          last_error: null,
        })
        .eq('id', row.id)

      sent += 1
    } catch (err) {
      failed += 1
      await supabase
        .from('marketing_email_queue')
        .update({
          status: 'failed',
          attempts: 1,
          last_error: err instanceof Error ? err.message : 'Unknown email error',
        })
        .eq('id', row.id)
    }
  }

  return {
    processed: rows.length,
    sent,
    failed,
  }
}
