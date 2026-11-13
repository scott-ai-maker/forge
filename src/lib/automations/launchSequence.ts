import type { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import {
  appendComplianceFooter,
  getBaseUrl,
  isEmailSuppressed,
} from '@/lib/marketing-email'
import { toE164 } from '@/lib/phone'
import { isWithinSmsQuietHours, sendSms } from '@/lib/sms'

/**
 * Forge Athletic — Launch, Rescue, Referral & Retention Email/SMS Automation Suite
 * Window: November 20, 2026 (06:00 AM EST) through January 1, 2027 (08:00 AM Local) + Evergreen Day-30 / Partner Pass Triggers
 */

export const FORGE_CANONICAL_ORIGIN = 'https://forge-athletic.app'
export const DEFAULT_AUTOMATION_TIMEZONE = 'America/New_York'
export const LAUNCH_BLAST_ISO_EST = '2026-11-20T06:00:00-05:00'

export type AutomationChannel = 'email' | 'sms'

export type AutomationTemplateId =
  | 'launch_01a_sms'
  | 'launch_01b_email'
  | 'rescue_02a_email'
  | 'rescue_02b_sms'
  | 'screening_03_email'
  | 'thanksgiving_04_email'
  | 'post_thanksgiving_05_email'
  | 'day_30_posture_06_email'
  | 'partner_pass_guest_07_email'
  | 'new_year_phase02_08_email'

export type AutomationStepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export type ScheduleKind =
  | {
      mode: 'global_instant'
      isoTimestamp: string
    }
  | {
      mode: 'local_wall_clock'
      localDate: `${number}-${number}-${number}` // YYYY-MM-DD
      hour: number // 0-23
      minute: number // 0-59
    }
  | {
      mode: 'relative_day_offset_local'
      anchorField: 'activated_at'
      dayOffset: number
      hour: number
      minute: number
    }
  | {
      mode: 'event_immediate'
      eventFlag: 'guest_pass_redeemed'
    }

export interface AutomationRecipientFlags {
  email?: string | null
  phone?: string | null
  firstName?: string | null
  guestFirstName?: string | null
  referrerFirstName?: string | null
  expirationDate?: string | null
  redeemedAt?: string | null
  trialDays?: number
  timezone?: string | null
  account_activated: boolean
  screening_booked: boolean
  guest_pass_redeemed: boolean
  sms_opt_in: boolean
  activated_at?: string | null
  is_founding_member?: boolean
  is_waitlist_lead?: boolean
  email_suppressed?: boolean
  sms_suppressed?: boolean
  standby_released?: boolean
}

export type SuppressionReason =
  | 'account_already_activated'
  | 'account_not_activated'
  | 'screening_already_booked'
  | 'guest_pass_not_redeemed'
  | 'sms_not_opted_in'
  | 'missing_valid_phone'
  | 'missing_valid_email'
  | 'email_suppressed'
  | 'sms_suppressed'
  | 'standby_spot_released'
  | 'not_founding_member'
  | 'missing_activated_at'

export interface SuppressionDecision {
  allowed: boolean
  reason?: SuppressionReason
}

export interface AutomationTemplateDefinition {
  id: AutomationTemplateId
  step: AutomationStepNumber
  code: '01A' | '01B' | '02A' | '02B' | '03' | '04' | '05' | '06' | '07' | '08'
  name: string
  channel: AutomationChannel
  schedule: ScheduleKind
  requiredVariables: ReadonlyArray<
    'First Name' | 'Referrer First Name' | 'Guest First Name' | 'Expiration Date'
  >
  subjectTemplate?: string
  previewTextTemplate?: string
  ctaLabel?: string
  ctaUrl?: string
  secondaryCtaNote?: string
  bodyMarkdownTemplate: string
}

export interface RenderedEmailPayload {
  channel: 'email'
  templateId: AutomationTemplateId
  to: string
  subject: string
  previewText: string
  text: string
  html: string
  unsubscribeUrl: string
  headers: Record<string, string>
}

export interface RenderedSmsPayload {
  channel: 'sms'
  templateId: AutomationTemplateId
  to: string
  body: string
}

export type RenderedAutomationPayload = RenderedEmailPayload | RenderedSmsPayload

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UNRESOLVED_TOKEN_REGEX = /\{\{[^}]+\}\}/

/**
 * Complete catalog of all 8 steps (10 Email/SMS templates) spanning Nov 20, 2026 – Jan 1, 2027.
 */
export const LAUNCH_AUTOMATION_TEMPLATES: Record<
  AutomationTemplateId,
  AutomationTemplateDefinition
> = {
  launch_01a_sms: {
    id: 'launch_01a_sms',
    step: 1,
    code: '01A',
    name: 'Launch Morning SMS',
    channel: 'sms',
    schedule: {
      mode: 'global_instant',
      isoTimestamp: LAUNCH_BLAST_ISO_EST,
    },
    requiredVariables: [],
    ctaUrl: `${FORGE_CANONICAL_ORIGIN}/portal`,
    bodyMarkdownTemplate:
      'Forge Athletic is LIVE! Claim your Founding Member Lifetime Rate Lock + book your 1-on-1 screening with Coach Gordon before spots fill: https://forge-athletic.app/portal Reply STOP to opt out',
  },

  launch_01b_email: {
    id: 'launch_01b_email',
    step: 1,
    code: '01B',
    name: 'Launch Morning Founding Member Email',
    channel: 'email',
    schedule: {
      mode: 'global_instant',
      isoTimestamp: LAUNCH_BLAST_ISO_EST,
    },
    requiredVariables: ['First Name'],
    subjectTemplate: 'Your Founding Member Pass is live — start here (takes 2 mins)',
    previewTextTemplate:
      'Your Lifetime Rate Lock is active. Run your 2-minute phone posture check and grab your 1-on-1 screening slot before Thanksgiving.',
    ctaLabel: 'Activate My Founding Member Pass →',
    ctaUrl: `${FORGE_CANONICAL_ORIGIN}/portal`,
    bodyMarkdownTemplate: [
      'Hi {{First Name}},',
      '',
      'The doors to **Forge Athletic** are officially open—and your **Founding Member Pass** (with your permanent **Lifetime Rate Lock**) is ready to activate.',
      '',
      'Here is how to get your baseline dialed in today in under 3 minutes:',
      '',
      '1. **Activate Your Founding Pass:** Sign in at `https://forge-athletic.app/portal` using this email address to lock your Founding Member rate for life.',
      '2. **Run Your 2-Minute Quick Posture Check:** Prop your phone at hip-to-chest height and let our 33-point camera guide map your baseline alignment and unlock your custom **5-Minute Desk Reset**.',
      '3. **Book Your Complimentary 1-on-1 Screening:** Grab a Mon–Wed slot with me before Thanksgiving so we can review your movement screen together.',
      '',
      '**[Activate My Founding Member Pass →]** (`https://forge-athletic.app/portal`)',
      '',
      'Glad to have you in our founding cohort of 50,',
      '',
      '**Coach Gordon**',
      'Founder & Head Coach, Forge Athletic · NASM-CPT® (Since 2008)',
    ].join('\n'),
  },

  rescue_02a_email: {
    id: 'rescue_02a_email',
    step: 2,
    code: '02A',
    name: '48-Hour Unclaimed Pass Rescue Email',
    channel: 'email',
    schedule: {
      mode: 'local_wall_clock',
      localDate: '2026-11-22',
      hour: 10,
      minute: 0,
    },
    requiredVariables: ['First Name'],
    subjectTemplate: 'Still holding your Founding Member Pass (before spots release)',
    previewTextTemplate:
      'Quick heads-up before Thanksgiving week—your lifetime rate lock and 1-on-1 screening pass are still reserved.',
    ctaLabel: 'Claim & Activate My Founding Member Pass →',
    ctaUrl: `${FORGE_CANONICAL_ORIGIN}/portal`,
    bodyMarkdownTemplate: [
      'Hi {{First Name}},',
      '',
      'Quick heads-up—I noticed you grabbed early access on our waitlist, so I’m still holding your **Founding Member Pass** (along with your permanent **Lifetime Rate Lock** and complimentary **pre-Thanksgiving 1-on-1 movement screening** with me).',
      '',
      'Since we capped this founding cohort at **50 members** so I can personally review movement screens and coach each member hands-on, we’ll be releasing any unclaimed waitlist passes to the standby list early next week.',
      '',
      "If you still want your spot—even if you won't have time for a full workout until after Thanksgiving—it takes less than 60 seconds to lock it in today:",
      '',
      '1. **Activate Your Pass:** Log in with this email address to lock your Founding Member dues for life.',
      '2. **Take 2 Minutes When Ready:** Whenever you have a quiet moment today, run your **2-Minute Quick Posture Check** right from your phone camera so your Phase 01 plan is ready whenever you are.',
      '',
      '**[Claim & Activate My Founding Member Pass →]** (`https://forge-athletic.app/portal`)',
      '',
      'No pressure at all if the timing isn\'t right—just reply *"PASS"* if you\'d like me to release your spot to someone on standby. Otherwise, jump in today and let\'s get you set up before the holiday rush.',
      '',
      'Best,',
      '',
      '**Coach Gordon**',
      'Founder & Head Coach, Forge Athletic · NASM-CPT® (Since 2008)',
    ].join('\n'),
  },

  rescue_02b_sms: {
    id: 'rescue_02b_sms',
    step: 2,
    code: '02B',
    name: '48-Hour Unclaimed Pass Rescue SMS',
    channel: 'sms',
    schedule: {
      mode: 'local_wall_clock',
      localDate: '2026-11-22',
      hour: 11,
      minute: 30,
    },
    requiredVariables: ['First Name'],
    ctaUrl: `${FORGE_CANONICAL_ORIGIN}/portal`,
    bodyMarkdownTemplate:
      'Forge Athletic: Hey {{First Name}}, still holding your Founding Member Pass + Lifetime Rate Lock before we release unclaimed spots to standby. Activate in 60s here: https://forge-athletic.app/portal Reply STOP to opt out',
  },

  screening_03_email: {
    id: 'screening_03_email',
    step: 3,
    code: '03',
    name: '48-Hour 1-on-1 Screening Reminder',
    channel: 'email',
    schedule: {
      mode: 'local_wall_clock',
      localDate: '2026-11-22',
      hour: 9,
      minute: 0,
    },
    requiredVariables: ['First Name'],
    subjectTemplate: 'Quick reminder: Your 1-on-1 screening with Coach Gordon (before Thursday)',
    previewTextTemplate:
      'Grab one of the remaining Mon–Wed pre-Thanksgiving slots before holiday travel starts.',
    ctaLabel: 'Book My 1-on-1 Screening Slot →',
    ctaUrl: `${FORGE_CANONICAL_ORIGIN}/portal/screening`,
    bodyMarkdownTemplate: [
      'Hi {{First Name}},',
      '',
      'Welcome inside Forge Athletic! I noticed you haven’t grabbed your complimentary **1-on-1 Movement & Posture Screening** slot yet.',
      '',
      'I opened extra Mon–Wed times before Thursday so we can review your 33-point posture scan, talk through any nagging neck, shoulder, or lower-back tightness, and customize your Phase 01 setup before holiday travel kicks off.',
      '',
      '**[Book My 1-on-1 Screening Slot →]** (`https://forge-athletic.app/portal/screening`)',
      '',
      'Takes 15 minutes on video—grab whichever slot fits your schedule best.',
      '',
      '**Coach Gordon**',
    ].join('\n'),
  },

  thanksgiving_04_email: {
    id: 'thanksgiving_04_email',
    step: 4,
    code: '04',
    name: 'Thanksgiving Travel Mode Guide',
    channel: 'email',
    schedule: {
      mode: 'local_wall_clock',
      localDate: '2026-11-24',
      hour: 10,
      minute: 0,
    },
    requiredVariables: ['First Name'],
    subjectTemplate: 'Traveling for Thanksgiving? Keep your momentum in 20 minutes',
    previewTextTemplate:
      'Hotel gym missing weights? Tap Hotel Travel + 20m Express and stay loose all weekend.',
    ctaLabel: 'Open My Dashboard →',
    ctaUrl: `${FORGE_CANONICAL_ORIGIN}/portal`,
    bodyMarkdownTemplate: [
      'Hi {{First Name}},',
      '',
      'Heading out of town or hosting family this week? Don’t worry about finding a full gym or carving out an hour.',
      '',
      'Three tools built right into your dashboard keep your joints feeling great all holiday weekend:',
      '',
      '- **Hotel Travel / Bodyweight Switcher:** Tap your Environment Profile pill to adapt any session to a bare-bones hotel gym or living room floor—then reset back to your home setup in one tap when you return.',
      '- **20m Express Mode:** Toggle `20m Express` for a complete, joint-safe NASM workout in 20 minutes flat.',
      '- **5-Minute Desk & Flight Reset:** Stiff from driving or flying? Run a quick 5-minute mobility reset right from your phone.',
      '',
      '**[Open My Dashboard →]** (`https://forge-athletic.app/portal`)',
      '',
      'Enjoy the holiday—zero guilt, zero all-or-nothing pressure.',
      '',
      '**Coach Gordon**',
    ].join('\n'),
  },

  post_thanksgiving_05_email: {
    id: 'post_thanksgiving_05_email',
    step: 5,
    code: '05',
    name: 'Post-Thanksgiving Rhythm Reset',
    channel: 'email',
    schedule: {
      mode: 'local_wall_clock',
      localDate: '2026-11-30',
      hour: 7,
      minute: 30,
    },
    requiredVariables: ['First Name'],
    subjectTemplate: 'Ease back into your rhythm today (no "punishment workouts" required)',
    previewTextTemplate:
      'Start with a 10-second Joint Comfort Check-In and a smooth Phase 01 session.',
    ctaLabel: "Check In & Start Today's Session →",
    ctaUrl: `${FORGE_CANONICAL_ORIGIN}/portal`,
    bodyMarkdownTemplate: [
      'Hi {{First Name}},',
      '',
      'Welcome back from Thanksgiving weekend. If you traveled, ate great food, or took a few extra rest days—good. You don’t need a punishing "burn it off" workout today.',
      '',
      'Here is all we’re focusing on this Monday:',
      '',
      '1. **Log a 10-Second Joint Comfort Check-In** on your dashboard so your load engine knows how your back, hips, and shoulders feel after the weekend.',
      '2. **Run a 30-Second Camera Readiness Check** before Set 1 if you’re stiff from travel—we’ll automatically inject 2–3 targeted warm-up drills before you touch a weight.',
      '',
      "**[Check In & Start Today's Session →]** (`https://forge-athletic.app/portal`)",
      '',
      'Consistency over intensity. Let’s have a strong week.',
      '',
      '**Coach Gordon**',
    ].join('\n'),
  },

  day_30_posture_06_email: {
    id: 'day_30_posture_06_email',
    step: 6,
    code: '06',
    name: 'Day-30 Posture Scan Milestone',
    channel: 'email',
    schedule: {
      mode: 'relative_day_offset_local',
      anchorField: 'activated_at',
      dayOffset: 30,
      hour: 9,
      minute: 0,
    },
    requiredVariables: ['First Name'],
    subjectTemplate: '30 days in — see how your posture & alignment have changed',
    previewTextTemplate:
      'Run a 2-minute follow-up scan to unlock your Before/After 33-point mesh comparison.',
    ctaLabel: 'Run My 30-Day Follow-Up Scan →',
    ctaUrl: `${FORGE_CANONICAL_ORIGIN}/portal`,
    bodyMarkdownTemplate: [
      'Hi {{First Name}},',
      '',
      'You’ve officially hit **30 days** inside Forge Athletic.',
      '',
      'Take 2 minutes today to run a **Follow-Up Posture Scan** on your dashboard. Our 33-point pose engine will overlay today’s alignment directly against your Day-1 baseline so you can see measurable changes in forward head tilt, shoulder symmetry, and pelvic balance—and verify your readiness for **Phase 02**.',
      '',
      '**[Run My 30-Day Follow-Up Scan →]** (`https://forge-athletic.app/portal`)',
      '',
      '**Coach Gordon**',
    ].join('\n'),
  },

  partner_pass_guest_07_email: {
    id: 'partner_pass_guest_07_email',
    step: 7,
    code: '07',
    name: 'Founding Partner Pass Guest Welcome',
    channel: 'email',
    schedule: {
      mode: 'event_immediate',
      eventFlag: 'guest_pass_redeemed',
    },
    requiredVariables: ['Guest First Name', 'Referrer First Name', 'Expiration Date'],
    subjectTemplate: '{{Referrer First Name}} unlocked 30 free days of Forge Athletic for you',
    previewTextTemplate:
      'Your 30-day Founding Partner Pass is active—start with a 2-minute phone posture check (zero gym required).',
    ctaLabel: 'Open My Member Dashboard →',
    ctaUrl: `${FORGE_CANONICAL_ORIGIN}/portal`,
    bodyMarkdownTemplate: [
      'Hi {{Guest First Name}},',
      '',
      'Welcome to **Forge Athletic**!',
      '',
      '{{Referrer First Name}} gifted you their **30-Day Founding Partner Pass**, giving you full, complimentary access for the next month—no credit card required and zero hidden catches.',
      '',
      'Forge Athletic is built for real people with busy schedules who want lasting strength, pain-free joints, and high energy—delivered 100% remotely to your living room, apartment gym, or hotel while traveling.',
      '',
      'Here is how to get started in under 3 minutes today:',
      '',
      '### 1. Run Your 2-Minute Quick Posture Check',
      'Open Forge Athletic on your phone and complete your baseline **2-Minute Quick Posture Check**.',
      '- Prop your phone upright at hip-to-chest height in a well-lit spot—our hands-free camera guide will walk you through a quick front and side alignment scan.',
      '- You’ll immediately see where daily desk time or stress is creating tightness and unlock a custom **5-Minute Desk Reset** mobility routine.',
      '',
      '### 2. Set Your Default Environment Profile',
      'Whether you train with **Home Dumbbells**, in an **Apartment Gym**, or **Bodyweight Only** in your living room, choose your setup on your dashboard. Every workout automatically adapts to the exact gear you have on hand while following our **5-Phase NASM OPT™ progression**.',
      '',
      '### 3. Try a 20-Minute Express Session',
      'Short on time this week? Toggle **`20m Express`** on your first workout card to get a focused, joint-safe strength session done in 20 minutes flat.',
      '',
      '**[Open My Member Dashboard →]** (`https://forge-athletic.app/portal`)',
      '',
      'If you have any questions about your posture scan, equipment setup, or getting started, just reply directly to this email—I read and answer every message personally.',
      '',
      'Glad to have you training alongside {{Referrer First Name}},',
      '',
      '**Coach Gordon**',
      'Founder & Head Coach, Forge Athletic · NASM-CPT® (Since 2008)',
      '',
      '*P.S. Your 30-day Founding Partner Pass runs through {{Expiration Date}}. If you decide to stay on after your guest month, let me know and I’ll make sure you get preferred partner pricing.*',
    ].join('\n'),
  },

  new_year_phase02_08_email: {
    id: 'new_year_phase02_08_email',
    step: 8,
    code: '08',
    name: 'New Year Phase 02 Transition',
    channel: 'email',
    schedule: {
      mode: 'local_wall_clock',
      localDate: '2027-01-01',
      hour: 8,
      minute: 0,
    },
    requiredVariables: ['First Name'],
    subjectTemplate: "While everyone else starts Day 1, you're stepping into Phase 02",
    previewTextTemplate:
      'Happy New Year—your 6-week foundation is locked in. Here is what unlocks next.',
    ctaLabel: 'Start My 2027 Phase 02 Session →',
    ctaUrl: `${FORGE_CANONICAL_ORIGIN}/portal`,
    bodyMarkdownTemplate: [
      'Hi {{First Name}},',
      '',
      'Happy New Year! While millions of people are starting from scratch today with random January resolutions that burn out by February, you already have a **6-week joint-first foundation** under your belt.',
      '',
      'As you step into **Phase 02 · Strength Endurance**, we pair controlled stabilization work with crisp strength supersets to build durable, everyday power without joint flare-ups.',
      '',
      '**Your New Year Action Step:** Prop your phone at a 45° angle during your main compound lift this week and submit a quick clip in **Form Lab** so we can verify your mechanics as loads climb.',
      '',
      '**[Start My 2027 Phase 02 Session →]** (`https://forge-athletic.app/portal`)',
      '',
      'Proud of the consistency you built in November and December—let’s make 2027 your strongest, most pain-free year yet.',
      '',
      '**Coach Gordon**',
    ].join('\n'),
  },
}

export const ALL_LAUNCH_TEMPLATE_IDS = Object.keys(
  LAUNCH_AUTOMATION_TEMPLATES
) as AutomationTemplateId[]

// ---------------------------------------------------------------------------
// Personalization & Formatting Helpers
// ---------------------------------------------------------------------------

export function extractFirstName(raw?: string | null, fallback = 'there'): string {
  const cleaned = (raw ?? '').trim()
  if (!cleaned) return fallback
  const token = cleaned.split(/\s+/)[0]?.replace(/[<>{}]/g, '').trim()
  return token && token.length > 0 ? token : fallback
}

export function isValidIanaTimeZone(tz?: string | null): boolean {
  if (!tz || typeof tz !== 'string' || !tz.trim()) return false
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz.trim() })
    return true
  } catch {
    return false
  }
}

export function resolveSafeTimeZone(tz?: string | null): string {
  return isValidIanaTimeZone(tz) ? tz!.trim() : DEFAULT_AUTOMATION_TIMEZONE
}

export function formatExpirationDate(
  redeemedAtIso?: string | Date | null,
  trialDays = 30,
  timeZone = DEFAULT_AUTOMATION_TIMEZONE
): string {
  const anchor = redeemedAtIso ? new Date(redeemedAtIso) : new Date()
  const safeAnchor = Number.isNaN(anchor.getTime()) ? new Date() : anchor
  const expiresAt = new Date(safeAnchor.getTime() + trialDays * 24 * 60 * 60 * 1000)
  const safeTz = resolveSafeTimeZone(timeZone)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: safeTz,
  }).format(expiresAt)
}

export function interpolateTemplateVariables(
  raw: string,
  variables: Record<string, string>
): string {
  return raw.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, key: string) => {
    const normalizedKey = key.trim()
    if (Object.prototype.hasOwnProperty.call(variables, normalizedKey)) {
      return variables[normalizedKey]
    }
    throw new Error(`Missing required template variable: {{${normalizedKey}}}`)
  })
}

export function assertZeroUnresolvedPlaceholders(text: string, label: string): void {
  const match = text.match(UNRESOLVED_TOKEN_REGEX)
  if (match) {
    throw new Error(`Unresolved template placeholder ${match[0]} in ${label}`)
  }
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderInlineMarkdownToHtml(escapedLine: string): string {
  return escapedLine
    .replace(
      /\*\*\[([^\]]+)\]\*\*\s*\(`(https?:\/\/[^`]+)`\)/g,
      (_m, label: string, url: string) =>
        `<a href="${url}" style="display:inline-block;margin:8px 0;padding:13px 22px;border-radius:8px;background:linear-gradient(135deg,#F59E0B 0%,#D97706 100%);color:#080E18;font-weight:800;font-size:14px;letter-spacing:0.03em;text-decoration:none;">${label}</a>`
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#F8FAFC;">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(
      /`(https?:\/\/[^`]+)`/g,
      '<a href="$1" style="color:#FBBF24;text-decoration:underline;">$1</a>'
    )
    .replace(
      /`([^`]+)`/g,
      '<code style="background:rgba(245,158,11,0.14);color:#FDE68A;padding:2px 6px;border-radius:4px;font-size:13px;">$1</code>'
    )
}

function convertMarkdownBodyToHtmlAndPlainText(
  markdown: string,
  previewText: string
): { html: string; text: string } {
  const lines = markdown.split('\n')
  const htmlBlocks: string[] = []
  let inUl = false
  let inOl = false

  const closeLists = () => {
    if (inUl) {
      htmlBlocks.push('</ul>')
      inUl = false
    }
    if (inOl) {
      htmlBlocks.push('</ol>')
      inOl = false
    }
  }

  for (const rawLine of lines) {
    const trimmed = rawLine.trim()
    if (!trimmed) {
      closeLists()
      continue
    }

    if (trimmed.startsWith('### ')) {
      closeLists()
      const heading = renderInlineMarkdownToHtml(escapeHtml(trimmed.slice(4)))
      htmlBlocks.push(
        `<h3 style="margin:22px 0 8px;font-size:15px;font-weight:700;color:#FBBF24;letter-spacing:0.02em;">${heading}</h3>`
      )
      continue
    }

    if (trimmed.startsWith('- ')) {
      if (inOl) {
        htmlBlocks.push('</ol>')
        inOl = false
      }
      if (!inUl) {
        htmlBlocks.push(
          '<ul style="margin:12px 0 16px;padding-left:20px;color:#CBD5E1;font-size:14px;line-height:1.65;">'
        )
        inUl = true
      }
      htmlBlocks.push(
        `<li style="margin-bottom:8px;">${renderInlineMarkdownToHtml(escapeHtml(trimmed.slice(2)))}</li>`
      )
      continue
    }

    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
    if (orderedMatch) {
      if (inUl) {
        htmlBlocks.push('</ul>')
        inUl = false
      }
      if (!inOl) {
        htmlBlocks.push(
          '<ol style="margin:12px 0 16px;padding-left:20px;color:#CBD5E1;font-size:14px;line-height:1.65;">'
        )
        inOl = true
      }
      htmlBlocks.push(
        `<li style="margin-bottom:8px;">${renderInlineMarkdownToHtml(escapeHtml(orderedMatch[2]))}</li>`
      )
      continue
    }

    closeLists()
    htmlBlocks.push(
      `<p style="margin:0 0 14px;font-size:14px;line-height:1.68;color:#E2E8F0;">${renderInlineMarkdownToHtml(escapeHtml(trimmed))}</p>`
    )
  }
  closeLists()

  const plainText = markdown
    .replace(/\*\*\[([^\]]+)\]\*\*\s*\(`(https?:\/\/[^`]+)`\)/g, '$1: $2')
    .replace(/###\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')

  const escapedPreview = escapeHtml(previewText)
  const html = `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#080E18;opacity:0;">${escapedPreview}</div>
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background-color:#080E18;color:#E2E8F0;padding:32px 24px;border:1px solid rgba(245,158,11,0.32);border-radius:12px;">
  <div style="padding-bottom:18px;margin-bottom:22px;border-bottom:1px solid rgba(255,255,255,0.09);display:flex;align-items:center;justify-content:space-between;">
    <span style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#F59E0B;font-weight:800;">FORGE ATHLETIC</span>
    <span style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#94A3B8;">MEMBER COACHING DISPATCH</span>
  </div>
  ${htmlBlocks.join('\n  ')}
</div>`

  return { html, text: plainText }
}

// ---------------------------------------------------------------------------
// Suppression Guards (Rules 1 through 8)
// ---------------------------------------------------------------------------

export function evaluateAutomationSuppression(
  templateId: AutomationTemplateId,
  flags: AutomationRecipientFlags
): SuppressionDecision {
  const template = LAUNCH_AUTOMATION_TEMPLATES[templateId]

  // Channel-level contact & opt-out checks
  if (template.channel === 'email') {
    const email = (flags.email ?? '').trim().toLowerCase()
    if (!EMAIL_REGEX.test(email)) {
      return { allowed: false, reason: 'missing_valid_email' }
    }
    if (flags.email_suppressed) {
      return { allowed: false, reason: 'email_suppressed' }
    }
  } else {
    if (flags.sms_suppressed) {
      return { allowed: false, reason: 'sms_suppressed' }
    }
    if (!flags.sms_opt_in) {
      return { allowed: false, reason: 'sms_not_opted_in' }
    }
    const normalizedPhone = toE164(flags.phone ?? undefined)
    if (!normalizedPhone) {
      return { allowed: false, reason: 'missing_valid_phone' }
    }
  }

  switch (templateId) {
    case 'launch_01a_sms':
    case 'launch_01b_email':
      if (flags.standby_released) {
        return { allowed: false, reason: 'standby_spot_released' }
      }
      return { allowed: true }

    case 'rescue_02a_email':
    case 'rescue_02b_sms':
      // Fires ONLY if account_activated == false. Immediately exit if account_activated == true.
      if (flags.account_activated) {
        return { allowed: false, reason: 'account_already_activated' }
      }
      if (flags.standby_released) {
        return { allowed: false, reason: 'standby_spot_released' }
      }
      return { allowed: true }

    case 'screening_03_email':
      // Fires ONLY if account_activated == true AND screening_booked == false.
      if (!flags.account_activated) {
        return { allowed: false, reason: 'account_not_activated' }
      }
      if (flags.screening_booked) {
        return { allowed: false, reason: 'screening_already_booked' }
      }
      return { allowed: true }

    case 'thanksgiving_04_email':
    case 'post_thanksgiving_05_email':
    case 'new_year_phase02_08_email':
      // Fires to all active Founding Members.
      if (!flags.account_activated) {
        return { allowed: false, reason: 'account_not_activated' }
      }
      if (flags.is_founding_member === false) {
        return { allowed: false, reason: 'not_founding_member' }
      }
      return { allowed: true }

    case 'day_30_posture_06_email':
      if (!flags.account_activated) {
        return { allowed: false, reason: 'account_not_activated' }
      }
      if (flags.is_founding_member === false) {
        return { allowed: false, reason: 'not_founding_member' }
      }
      if (!flags.activated_at || Number.isNaN(new Date(flags.activated_at).getTime())) {
        return { allowed: false, reason: 'missing_activated_at' }
      }
      return { allowed: true }

    case 'partner_pass_guest_07_email':
      // Immediate on guest_pass_redeemed == true
      if (!flags.guest_pass_redeemed) {
        return { allowed: false, reason: 'guest_pass_not_redeemed' }
      }
      return { allowed: true }
  }
}

// ---------------------------------------------------------------------------
// Local-Timezone Scheduling Engine
// ---------------------------------------------------------------------------

interface LocalClockParts {
  year: number
  month: number
  day: number
  dateIso: string // YYYY-MM-DD
  hour: number
  minute: number
}

export function getLocalClockParts(instant: Date, timeZone?: string | null): LocalClockParts {
  const safeTz = resolveSafeTimeZone(timeZone)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: safeTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(instant)
  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(p => p.type === type)?.value ?? '00'

  const year = Number(lookup('year'))
  const month = Number(lookup('month'))
  const day = Number(lookup('day'))
  const hour = Number(lookup('hour')) % 24
  const minute = Number(lookup('minute'))
  const dateIso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  return { year, month, day, dateIso, hour, minute }
}

function addDaysToIsoDate(dateIso: string, dayOffset: number): string {
  const [y, m, d] = dateIso.split('-').map(Number)
  const utcNoon = new Date(Date.UTC(y, m - 1, d + dayOffset, 12, 0, 0))
  return utcNoon.toISOString().slice(0, 10)
}

/**
 * Resolves the exact UTC Date corresponding to a local wall-clock date & HH:mm in a recipient's IANA timezone.
 */
export function computeLocalWallClockUtc(
  localDate: string,
  hour: number,
  minute: number,
  timeZone?: string | null
): Date {
  const safeTz = resolveSafeTimeZone(timeZone)
  const [year, month, day] = localDate.split('-').map(Number)
  const desiredUtcWallMs = Date.UTC(year, month - 1, day, hour, minute, 0)

  // Two-pass offset refinement handles DST boundaries cleanly across all IANA zones
  let guessMs = desiredUtcWallMs
  for (let i = 0; i < 2; i += 1) {
    const localAtGuess = getLocalClockParts(new Date(guessMs), safeTz)
    const actualWallMs = Date.UTC(
      localAtGuess.year,
      localAtGuess.month - 1,
      localAtGuess.day,
      localAtGuess.hour,
      localAtGuess.minute,
      0
    )
    const deltaMs = desiredUtcWallMs - actualWallMs
    guessMs += deltaMs
  }

  return new Date(guessMs)
}

export interface ScheduleEvaluation {
  due: boolean
  scheduledAtUtc: Date | null
  targetLocalDate?: string
  reason?: string
}

/**
 * Evaluates whether a template is currently due to fire at `now` for a given recipient.
 * `windowMinutes` bounds how long after the scheduled minute a cron sweep will consider the step due (default: 180 min).
 */
export function evaluateScheduleReadiness(
  templateId: AutomationTemplateId,
  flags: Pick<AutomationRecipientFlags, 'timezone' | 'activated_at' | 'guest_pass_redeemed'>,
  now: Date = new Date(),
  windowMinutes = 180
): ScheduleEvaluation {
  const template = LAUNCH_AUTOMATION_TEMPLATES[templateId]
  const schedule = template.schedule
  const windowMs = windowMinutes * 60 * 1000

  if (schedule.mode === 'event_immediate') {
    const due = Boolean(flags.guest_pass_redeemed)
    return {
      due,
      scheduledAtUtc: due ? now : null,
      reason: due ? undefined : 'awaiting_guest_pass_redemption',
    }
  }

  if (schedule.mode === 'global_instant') {
    const target = new Date(schedule.isoTimestamp)
    const elapsedMs = now.getTime() - target.getTime()
    const due = elapsedMs >= 0 && elapsedMs <= windowMs
    return {
      due,
      scheduledAtUtc: target,
      reason: elapsedMs < 0 ? 'before_global_launch_time' : due ? undefined : 'past_send_window',
    }
  }

  if (schedule.mode === 'local_wall_clock') {
    const target = computeLocalWallClockUtc(
      schedule.localDate,
      schedule.hour,
      schedule.minute,
      flags.timezone
    )
    const elapsedMs = now.getTime() - target.getTime()
    const due = elapsedMs >= 0 && elapsedMs <= windowMs
    return {
      due,
      scheduledAtUtc: target,
      targetLocalDate: schedule.localDate,
      reason: elapsedMs < 0 ? 'before_local_target_time' : due ? undefined : 'past_send_window',
    }
  }

  // relative_day_offset_local (Day-30 Posture Milestone at 09:00 AM Local)
  if (!flags.activated_at) {
    return { due: false, scheduledAtUtc: null, reason: 'missing_activated_at' }
  }
  const activatedInstant = new Date(flags.activated_at)
  if (Number.isNaN(activatedInstant.getTime())) {
    return { due: false, scheduledAtUtc: null, reason: 'invalid_activated_at' }
  }

  const activationLocal = getLocalClockParts(activatedInstant, flags.timezone)
  const targetLocalDate = addDaysToIsoDate(activationLocal.dateIso, schedule.dayOffset)
  const targetUtc = computeLocalWallClockUtc(
    targetLocalDate,
    schedule.hour,
    schedule.minute,
    flags.timezone
  )
  const elapsedMs = now.getTime() - targetUtc.getTime()
  const due = elapsedMs >= 0 && elapsedMs <= windowMs

  return {
    due,
    scheduledAtUtc: targetUtc,
    targetLocalDate,
    reason: elapsedMs < 0 ? 'before_day_30_local_window' : due ? undefined : 'past_send_window',
  }
}

// ---------------------------------------------------------------------------
// Template Rendering (Email + SMS with Full Compliance Footers & Zero Missing Vars)
// ---------------------------------------------------------------------------

export function renderAutomationTemplate(
  templateId: AutomationTemplateId,
  recipient: AutomationRecipientFlags
): RenderedAutomationPayload {
  const template = LAUNCH_AUTOMATION_TEMPLATES[templateId]

  const firstName = extractFirstName(recipient.firstName, 'there')
  const guestFirstName = extractFirstName(
    recipient.guestFirstName ?? recipient.firstName,
    'there'
  )
  const referrerFirstName = extractFirstName(
    recipient.referrerFirstName,
    'Your Forge Partner'
  )
  const expirationDate =
    recipient.expirationDate?.trim() ||
    formatExpirationDate(
      recipient.redeemedAt,
      recipient.trialDays ?? 30,
      recipient.timezone ?? DEFAULT_AUTOMATION_TIMEZONE
    )

  const variableMap: Record<string, string> = {
    'First Name': firstName,
    'Guest First Name': guestFirstName,
    'Referrer First Name': referrerFirstName,
    'Expiration Date': expirationDate,
  }

  if (template.channel === 'sms') {
    const phone = toE164(recipient.phone ?? undefined)
    if (!phone) {
      throw new Error(`Cannot render SMS template ${templateId} without a valid E.164 phone number`)
    }
    const smsBody = interpolateTemplateVariables(template.bodyMarkdownTemplate, variableMap)
    assertZeroUnresolvedPlaceholders(smsBody, `${templateId}.smsBody`)
    if (!/STOP/i.test(smsBody)) {
      throw new Error(`SMS template ${templateId} is missing STOP opt-out compliance instruction`)
    }

    return {
      channel: 'sms',
      templateId,
      to: phone,
      body: smsBody,
    }
  }

  const normalizedEmail = (recipient.email ?? '').trim().toLowerCase()
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new Error(`Cannot render Email template ${templateId} without a valid email address`)
  }

  const subject = interpolateTemplateVariables(template.subjectTemplate ?? '', variableMap)
  const previewText = interpolateTemplateVariables(
    template.previewTextTemplate ?? '',
    variableMap
  )
  const interpolatedMarkdown = interpolateTemplateVariables(
    template.bodyMarkdownTemplate,
    variableMap
  )

  assertZeroUnresolvedPlaceholders(subject, `${templateId}.subject`)
  assertZeroUnresolvedPlaceholders(previewText, `${templateId}.previewText`)
  assertZeroUnresolvedPlaceholders(interpolatedMarkdown, `${templateId}.body`)

  const renderedBody = convertMarkdownBodyToHtmlAndPlainText(
    interpolatedMarkdown,
    previewText
  )
  const withCompliance = appendComplianceFooter(
    renderedBody.html,
    renderedBody.text,
    normalizedEmail
  )

  return {
    channel: 'email',
    templateId,
    to: normalizedEmail,
    subject,
    previewText,
    text: withCompliance.text,
    html: withCompliance.html,
    unsubscribeUrl: withCompliance.unsubUrl,
    headers: {
      'List-Unsubscribe': `<${withCompliance.unsubUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'X-Forge-Template-Id': templateId,
    },
  }
}

// ---------------------------------------------------------------------------
// Provider Delivery Wrappers (Resend / Optional Loops + Twilio)
// ---------------------------------------------------------------------------

export async function deliverAutomationPayload(
  payload: RenderedAutomationPayload,
  options?: {
    dryRun?: boolean
    bypassSmsQuietHours?: boolean
    now?: Date
    timeZone?: string | null
  }
): Promise<{
  delivered: boolean
  skipped?: boolean
  reason?: string
  providerMessageId?: string | null
}> {
  if (options?.dryRun) {
    return { delivered: false, skipped: true, reason: 'dry_run' }
  }

  if (payload.channel === 'sms') {
    const safeTz = resolveSafeTimeZone(options?.timeZone)
    // Launch Blast (01A at 6:00 AM EST) is explicitly scheduled for 6:00 AM EST; all local reminders respect 8am-9pm quiet hours unless bypassed.
    const allowEarlyLaunchBlast = payload.templateId === 'launch_01a_sms'
    if (
      !allowEarlyLaunchBlast &&
      !options?.bypassSmsQuietHours &&
      isWithinSmsQuietHours(options?.now ?? new Date(), safeTz)
    ) {
      return { delivered: false, skipped: true, reason: 'sms_quiet_hours' }
    }

    const res = await sendSms(payload.to, payload.body)
    return {
      delivered: res.sent,
      skipped: res.skipped,
      reason: res.skipped ? 'twilio_not_configured' : undefined,
    }
  }

  // Optional Loops.so transactional bridge if LOOPS_API_KEY + LOOPS_TRANSACTIONAL_ENABLED=1 are set
  if (
    process.env.LOOPS_API_KEY?.trim() &&
    process.env.LOOPS_TRANSACTIONAL_ENABLED === '1'
  ) {
    const res = await fetch('https://app.loops.so/api/v1/transactional', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.LOOPS_API_KEY.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: payload.to,
        transactionalId: payload.templateId,
        dataVariables: {
          subject: payload.subject,
          previewText: payload.previewText,
          unsubscribeUrl: payload.unsubscribeUrl,
        },
      }),
    })
    if (!res.ok) {
      throw new Error(`Loops transactional send failed (${res.status})`)
    }
    return { delivered: true, providerMessageId: `loops:${payload.templateId}` }
  }

  if (!process.env.RESEND_API_KEY?.trim() || !process.env.MARKETING_FROM_EMAIL?.trim()) {
    return { delivered: false, skipped: true, reason: 'resend_not_configured' }
  }

  const resend = new Resend(process.env.RESEND_API_KEY.trim())
  const { data, error } = await resend.emails.send({
    from: process.env.MARKETING_FROM_EMAIL.trim(),
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    replyTo: process.env.MARKETING_REPLY_TO_EMAIL?.trim() || undefined,
    headers: payload.headers,
  })

  if (error) {
    throw new Error(error.message || 'Resend email delivery failed')
  }

  return {
    delivered: true,
    providerMessageId: data?.id ?? null,
  }
}

// ---------------------------------------------------------------------------
// Immediate Event & Suppression Lifecycle Handlers
// ---------------------------------------------------------------------------

export function buildAutomationDedupeKey(
  templateId: AutomationTemplateId,
  recipientIdentifier: string
): string {
  return `forge-auto:${templateId}:${recipientIdentifier.trim().toLowerCase()}`
}

async function hasAlreadyDispatched(
  admin: SupabaseClient,
  dedupeKey: string
): Promise<boolean> {
  if (typeof admin?.from !== 'function') return false
  try {
    const { data } = await admin
      .from('notification_log')
      .select('id')
      .eq('dedupe_key', dedupeKey)
      .maybeSingle()
    if (data?.id) return true
  } catch {
    // gracefully continue if table unavailable
  }

  try {
    const [, templateId, email] = dedupeKey.split(':')
    if (templateId && email && email.includes('@')) {
      const { data } = await admin
        .from('marketing_email_queue')
        .select('id, status')
        .eq('email', email)
        .eq('template_key', templateId)
        .eq('status', 'sent')
        .maybeSingle()
      if (data?.id) return true
    }
  } catch {
    // ignore
  }

  return false
}

async function recordAutomationDispatch(
  admin: SupabaseClient,
  params: {
    userId?: string | null
    email?: string | null
    firstName?: string | null
    templateId: AutomationTemplateId
    channel: AutomationChannel
    dedupeKey: string
    providerMessageId?: string | null
  }
): Promise<void> {
  if (typeof admin?.from !== 'function') return

  if (params.userId) {
    try {
      await admin.from('notification_log').insert({
        user_id: params.userId,
        type: 'weekly_checkin_nudge',
        channels: [params.channel],
        dedupe_key: params.dedupeKey,
      })
    } catch {
      // non-fatal
    }
  }

  if (params.email) {
    try {
      await admin.from('marketing_email_queue').upsert(
        {
          email: params.email.trim().toLowerCase(),
          first_name: params.firstName ?? null,
          template_key: params.templateId,
          source: 'forge_launch_automation_2026',
          status: 'sent',
          attempts: 1,
          provider_message_id: params.providerMessageId ?? null,
          send_after: new Date().toISOString(),
          sent_at: new Date().toISOString(),
          last_error: null,
        },
        { onConflict: 'email,template_key' }
      )
    } catch {
      // non-fatal
    }
  }
}

/**
 * Suppression Hook #1: Immediately exits the 48-Hour Unclaimed Pass Rescue sequence
 * (`rescue_02a_email`, `rescue_02b_sms`) as soon as `account_activated` flips to true.
 */
export async function suppressOnAccountActivated(
  admin: SupabaseClient,
  params: { userId?: string | null; email?: string | null }
): Promise<{ suppressedTemplates: AutomationTemplateId[]; skipped?: boolean }> {
  const templates: AutomationTemplateId[] = ['rescue_02a_email', 'rescue_02b_sms']
  if (typeof admin?.from !== 'function' || !params.email) {
    return { suppressedTemplates: [], skipped: true }
  }

  const normalizedEmail = params.email.trim().toLowerCase()
  try {
    await admin
      .from('marketing_email_queue')
      .update({
        status: 'cancelled',
        last_error: 'Suppressed: account_activated=true',
      })
      .eq('email', normalizedEmail)
      .in('template_key', templates)
      .eq('status', 'pending')
  } catch {
    // graceful fallback when queue table is offline
  }

  return { suppressedTemplates: templates }
}

/**
 * Suppression Hook #2: Immediately suppresses Template 03 (`screening_03_email`)
 * as soon as a member or calendar webhook books their 1-on-1 screening (`screening_booked = true`).
 */
export async function suppressOnScreeningBooked(
  admin: SupabaseClient,
  params: { userId?: string | null; email?: string | null }
): Promise<{ suppressedTemplates: AutomationTemplateId[]; skipped?: boolean }> {
  if (typeof admin?.from !== 'function') {
    return { suppressedTemplates: [], skipped: true }
  }

  let resolvedEmail = params.email?.trim().toLowerCase() || null
  if (!resolvedEmail && params.userId) {
    try {
      const { data: client } = await admin
        .from('clients')
        .select('email')
        .eq('id', params.userId)
        .maybeSingle()
      resolvedEmail = client?.email?.trim().toLowerCase() || null
    } catch {
      // ignore
    }
  }

  if (!resolvedEmail) {
    return { suppressedTemplates: [], skipped: true }
  }

  try {
    await admin
      .from('marketing_email_queue')
      .update({
        status: 'cancelled',
        last_error: 'Suppressed: screening_booked=true',
      })
      .eq('email', resolvedEmail)
      .eq('template_key', 'screening_03_email')
      .eq('status', 'pending')
  } catch {
    // ignore
  }

  return { suppressedTemplates: ['screening_03_email'] }
}

/**
 * Standby Release Hook: Marks a waitlist lead's spot as voluntarily released when they reply "PASS".
 */
export async function releaseWaitlistPassOnReply(
  admin: SupabaseClient,
  params: { phone?: string | null; email?: string | null }
): Promise<{ released: boolean }> {
  if (typeof admin?.from !== 'function') return { released: false }
  const normalizedEmail = params.email?.trim().toLowerCase() || null
  if (normalizedEmail) {
    try {
      await admin
        .from('marketing_email_queue')
        .update({
          status: 'cancelled',
          last_error: 'Suppressed: standby_released (PASS reply)',
        })
        .eq('email', normalizedEmail)
        .in('template_key', ['rescue_02a_email', 'rescue_02b_sms'])
        .eq('status', 'pending')
    } catch {
      // ignore
    }
  }
  return { released: true }
}

/**
 * Immediate Event Trigger (Rule 7 / Template 07):
 * Fires Founding Partner Pass Guest Welcome email immediately when `/invite/[code]` is redeemed.
 */
export async function triggerPartnerPassGuestWelcome(
  admin: SupabaseClient,
  params: {
    guestUserId?: string | null
    guestEmail: string
    guestFirstName?: string | null
    referrerId?: string | null
    referrerFirstName?: string | null
    redeemedAt?: string | null
    trialDays?: number
    timezone?: string | null
    dryRun?: boolean
  }
): Promise<{
  sent: boolean
  skipped?: boolean
  reason?: string
  rendered?: RenderedEmailPayload
}> {
  const normalizedEmail = params.guestEmail.trim().toLowerCase()
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return { sent: false, skipped: true, reason: 'missing_valid_email' }
  }

  let emailSuppressed = false
  if (typeof admin?.from === 'function') {
    emailSuppressed = await isEmailSuppressed(admin, normalizedEmail)
  }

  // Resolve Referrer First Name from database if only referrerId was provided
  let referrerName = params.referrerFirstName?.trim() || ''
  if (!referrerName && params.referrerId && params.referrerId !== 'ambassador' && typeof admin?.from === 'function') {
    try {
      const { data: referrerRow } = await admin
        .from('clients')
        .select('full_name, email')
        .eq('id', params.referrerId)
        .maybeSingle()
      referrerName =
        referrerRow?.full_name || referrerRow?.email?.split('@')[0] || ''
    } catch {
      // ignore
    }
  }

  const recipientFlags: AutomationRecipientFlags = {
    email: normalizedEmail,
    firstName: params.guestFirstName,
    guestFirstName: params.guestFirstName,
    referrerFirstName: referrerName || 'Your Forge Partner',
    redeemedAt: params.redeemedAt ?? new Date().toISOString(),
    trialDays: params.trialDays ?? 30,
    timezone: params.timezone ?? DEFAULT_AUTOMATION_TIMEZONE,
    account_activated: true,
    screening_booked: false,
    guest_pass_redeemed: true,
    sms_opt_in: false,
    email_suppressed: emailSuppressed,
  }

  const guard = evaluateAutomationSuppression('partner_pass_guest_07_email', recipientFlags)
  if (!guard.allowed) {
    return { sent: false, skipped: true, reason: guard.reason }
  }

  const dedupeKey = buildAutomationDedupeKey('partner_pass_guest_07_email', normalizedEmail)
  if (await hasAlreadyDispatched(admin, dedupeKey)) {
    return { sent: false, skipped: true, reason: 'duplicate' }
  }

  const rendered = renderAutomationTemplate(
    'partner_pass_guest_07_email',
    recipientFlags
  ) as RenderedEmailPayload

  const delivery = await deliverAutomationPayload(rendered, {
    dryRun: params.dryRun,
    timeZone: recipientFlags.timezone,
  })

  if (delivery.delivered) {
    await recordAutomationDispatch(admin, {
      userId: params.guestUserId,
      email: normalizedEmail,
      firstName: params.guestFirstName,
      templateId: 'partner_pass_guest_07_email',
      channel: 'email',
      dedupeKey,
      providerMessageId: delivery.providerMessageId,
    })
  }

  return {
    sent: delivery.delivered,
    skipped: delivery.skipped,
    reason: delivery.reason,
    rendered,
  }
}

// ---------------------------------------------------------------------------
// Scheduled Cron Orchestrator (Evaluates Waitlist Leads + Active Founding Members)
// ---------------------------------------------------------------------------

export interface CronDispatchSummary {
  evaluatedAt: string
  dryRun: boolean
  evaluatedRecipients: number
  dispatchedEmails: number
  dispatchedSms: number
  suppressed: number
  notDue: number
  duplicatesSkipped: number
  providerSkipped: number
  errors: number
  templateBreakdown: Record<
    AutomationTemplateId,
    { sent: number; suppressed: number; skipped: number }
  >
}

interface HydratedCronRecipient {
  userId: string | null
  identifier: string
  flags: AutomationRecipientFlags
}

async function hydrateCronRecipients(admin: SupabaseClient): Promise<HydratedCronRecipient[]> {
  if (typeof admin?.from !== 'function') return []

  type WaitlistRow = {
    email: string
    first_name?: string | null
    phone?: string | null
    sms_opt_in?: boolean | null
    timezone?: string | null
    source?: string | null
    created_at?: string | null
  }

  type ClientRow = {
    id: string
    email: string
    full_name?: string | null
    role?: string | null
    timezone?: string | null
    created_at?: string | null
  }

  type PrefsRow = {
    user_id: string
    email_enabled?: boolean | null
    sms_enabled?: boolean | null
    sms_phone?: string | null
    sms_consent_at?: string | null
    timezone?: string | null
  }

  type SessionRow = {
    client_id: string
    status?: string | null
  }

  type SuppressionRow = {
    email: string
  }

  const safeSelect = async <T>(table: string, columns: string, limit = 500): Promise<T[]> => {
    try {
      const { data, error } = await admin.from(table).select(columns).limit(limit)
      if (error || !data) return []
      return data as unknown as T[]
    } catch {
      return []
    }
  }

  const [waitlistRows, clientRows, prefRows, sessionRows, suppressionRows] =
    await Promise.all([
      safeSelect<WaitlistRow>('waitlist', '*', 200),
      safeSelect<ClientRow>('clients', 'id,email,full_name,role,created_at', 500),
      safeSelect<PrefsRow>(
        'notification_preferences',
        'user_id,email_enabled,sms_enabled,sms_phone,sms_consent_at',
        500
      ),
      safeSelect<SessionRow>('sessions', 'client_id,status', 1000),
      safeSelect<SuppressionRow>('email_suppressions', 'email', 1000),
    ])

  const suppressedEmails = new Set(
    suppressionRows
      .map(r => (r.email ?? '').trim().toLowerCase())
      .filter(Boolean)
  )

  const prefsByUserId = new Map<string, PrefsRow>()
  for (const p of prefRows) {
    if (p.user_id) prefsByUserId.set(p.user_id, p)
  }

  const bookedClientIds = new Set<string>()
  for (const s of sessionRows) {
    if (s.client_id && s.status !== 'cancelled') {
      bookedClientIds.add(s.client_id)
    }
  }

  const clientsByEmail = new Map<string, ClientRow>()
  for (const c of clientRows) {
    if (c.role === 'coach') continue
    const norm = (c.email ?? '').trim().toLowerCase()
    if (norm) clientsByEmail.set(norm, c)
  }

  const recipientsByKey = new Map<string, HydratedCronRecipient>()

  // 1. Hydrate Founding Waitlist Leads (capped at 50 Founding Member cohort spots for Launch Blast if > 50, or full waitlist)
  for (const lead of waitlistRows.slice(0, 50)) {
    const email = (lead.email ?? '').trim().toLowerCase()
    if (!email) continue
    const matchedClient = clientsByEmail.get(email)
    const prefs = matchedClient ? prefsByUserId.get(matchedClient.id) : undefined

    const phone = prefs?.sms_phone || lead.phone || null
    const smsOptIn = Boolean(
      (prefs?.sms_enabled && prefs?.sms_consent_at && phone) ||
        (lead.sms_opt_in && phone)
    )

    recipientsByKey.set(email, {
      userId: matchedClient?.id ?? null,
      identifier: email,
      flags: {
        email,
        phone,
        firstName:
          matchedClient?.full_name || lead.first_name || email.split('@')[0],
        timezone: prefs?.timezone || lead.timezone || DEFAULT_AUTOMATION_TIMEZONE,
        account_activated: Boolean(matchedClient?.id),
        screening_booked: matchedClient ? bookedClientIds.has(matchedClient.id) : false,
        guest_pass_redeemed: false,
        sms_opt_in: smsOptIn,
        activated_at: matchedClient?.created_at ?? null,
        is_founding_member: true,
        is_waitlist_lead: true,
        email_suppressed:
          suppressedEmails.has(email) || prefs?.email_enabled === false,
        sms_suppressed: prefs?.sms_enabled === false,
      },
    })
  }

  // 2. Hydrate Active Founding Members who registered directly without a prior waitlist row
  for (const [email, client] of clientsByEmail.entries()) {
    if (recipientsByKey.has(email)) continue
    const prefs = prefsByUserId.get(client.id)
    const phone = prefs?.sms_phone || null
    const smsOptIn = Boolean(prefs?.sms_enabled && prefs?.sms_consent_at && phone)

    recipientsByKey.set(email, {
      userId: client.id,
      identifier: email,
      flags: {
        email,
        phone,
        firstName: client.full_name || email.split('@')[0],
        timezone: prefs?.timezone || DEFAULT_AUTOMATION_TIMEZONE,
        account_activated: true,
        screening_booked: bookedClientIds.has(client.id),
        guest_pass_redeemed: false,
        sms_opt_in: smsOptIn,
        activated_at: client.created_at ?? null,
        is_founding_member: true,
        is_waitlist_lead: false,
        email_suppressed:
          suppressedEmails.has(email) || prefs?.email_enabled === false,
        sms_suppressed: prefs?.sms_enabled === false,
      },
    })
  }

  return Array.from(recipientsByKey.values())
}

const CRON_EVALUATED_TEMPLATES: ReadonlyArray<AutomationTemplateId> = [
  'launch_01a_sms',
  'launch_01b_email',
  'rescue_02a_email',
  'rescue_02b_sms',
  'screening_03_email',
  'thanksgiving_04_email',
  'post_thanksgiving_05_email',
  'day_30_posture_06_email',
  'new_year_phase02_08_email',
]

export async function dispatchDueLaunchAutomations(
  admin: SupabaseClient,
  options?: {
    now?: Date
    dryRun?: boolean
    windowMinutes?: number
    onlyTemplates?: AutomationTemplateId[]
  }
): Promise<CronDispatchSummary> {
  const now = options?.now ?? new Date()
  const dryRun = Boolean(options?.dryRun)
  const windowMinutes = options?.windowMinutes ?? 180
  const activeTemplates = options?.onlyTemplates ?? CRON_EVALUATED_TEMPLATES

  const templateBreakdown = Object.fromEntries(
    ALL_LAUNCH_TEMPLATE_IDS.map(id => [id, { sent: 0, suppressed: 0, skipped: 0 }])
  ) as CronDispatchSummary['templateBreakdown']

  const recipients = await hydrateCronRecipients(admin)

  let dispatchedEmails = 0
  let dispatchedSms = 0
  let suppressed = 0
  let notDue = 0
  let duplicatesSkipped = 0
  let providerSkipped = 0
  let errors = 0

  for (const recipient of recipients) {
    for (const templateId of activeTemplates) {
      // Waitlist-only steps (Launch Blast & Unclaimed Pass Rescue) target waitlist leads
      if (
        (templateId === 'launch_01a_sms' ||
          templateId === 'launch_01b_email' ||
          templateId === 'rescue_02a_email' ||
          templateId === 'rescue_02b_sms') &&
        !recipient.flags.is_waitlist_lead
      ) {
        continue
      }

      const scheduleEval = evaluateScheduleReadiness(
        templateId,
        recipient.flags,
        now,
        windowMinutes
      )
      if (!scheduleEval.due) {
        notDue += 1
        continue
      }

      const suppression = evaluateAutomationSuppression(templateId, recipient.flags)
      if (!suppression.allowed) {
        suppressed += 1
        templateBreakdown[templateId].suppressed += 1
        continue
      }

      const dedupeKey = buildAutomationDedupeKey(templateId, recipient.identifier)
      if (await hasAlreadyDispatched(admin, dedupeKey)) {
        duplicatesSkipped += 1
        templateBreakdown[templateId].skipped += 1
        continue
      }

      try {
        const rendered = renderAutomationTemplate(templateId, recipient.flags)
        const delivery = await deliverAutomationPayload(rendered, {
          dryRun,
          now,
          timeZone: recipient.flags.timezone,
        })

        if (delivery.delivered) {
          if (rendered.channel === 'email') dispatchedEmails += 1
          else dispatchedSms += 1
          templateBreakdown[templateId].sent += 1

          await recordAutomationDispatch(admin, {
            userId: recipient.userId,
            email: recipient.flags.email,
            firstName: recipient.flags.firstName,
            templateId,
            channel: rendered.channel,
            dedupeKey,
            providerMessageId: delivery.providerMessageId,
          })
        } else {
          providerSkipped += 1
          templateBreakdown[templateId].skipped += 1
        }
      } catch (err) {
        errors += 1
        console.error(`[launchSequence] Failed dispatching ${templateId}:`, err)
      }
    }
  }

  return {
    evaluatedAt: now.toISOString(),
    dryRun,
    evaluatedRecipients: recipients.length,
    dispatchedEmails,
    dispatchedSms,
    suppressed,
    notDue,
    duplicatesSkipped,
    providerSkipped,
    errors,
    templateBreakdown,
  }
}

export function getAutomationPortalLinks() {
  const origin = getBaseUrl() || FORGE_CANONICAL_ORIGIN
  return {
    portal: `${origin.replace(/\/$/, '')}/portal`,
    screening: `${origin.replace(/\/$/, '')}/portal/screening`,
  }
}

