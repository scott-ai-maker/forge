import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { getOrCreateClientReferralCode } from '@/lib/referrals'
import { getTrustedAppBaseUrl } from '@/lib/app-base-url'
import { sendCommercialInviteEmail } from '@/lib/marketing-email'
import {
  checkSlidingWindowRateLimit,
  resolveRequestSubjectKey,
} from '@/src/lib/security/rateLimiter'

export const dynamic = 'force-dynamic'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitizeHeaderText(raw: string): string {
  return raw.replace(/[\r\n\u0000-\u001F\u007F]+/g, ' ').trim()
}

export async function POST(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)

    // Per-user and per-IP rate limiting to prevent open spam relay abuse
    const userRate = checkSlidingWindowRateLimit({
      namespace: 'referrals-invite-user',
      subjectKey: authz.user.id,
      maxRequests: 10,
      windowMs: 24 * 60 * 60 * 1000,
    })
    const ipRate = checkSlidingWindowRateLimit({
      namespace: 'referrals-invite-ip',
      subjectKey: resolveRequestSubjectKey(req),
      maxRequests: 15,
      windowMs: 60 * 60 * 1000,
    })

    if (!userRate.allowed || !ipRate.allowed) {
      const retrySeconds = Math.max(userRate.retryAfterSeconds, ipRate.retryAfterSeconds, 60)
      return NextResponse.json(
        { error: 'Referral invitation limit reached. Please wait before sending additional invites.' },
        { status: 429, headers: { 'Retry-After': String(retrySeconds) } }
      )
    }

    const body = await req.json().catch(() => ({}))

    const rawEmails: unknown = body?.emails
    const rawNote = typeof body?.personalNote === 'string' ? body.personalNote.trim().slice(0, 300) : ''
    const personalNote = sanitizeHeaderText(rawNote)

    if (!Array.isArray(rawEmails) || rawEmails.length === 0) {
      return NextResponse.json({ error: 'Please provide at least one email address' }, { status: 400 })
    }

    if (rawEmails.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 invitations can be sent at once' }, { status: 400 })
    }

    const cleanEmails = Array.from(
      new Set(
        rawEmails
          .filter((e): e is string => typeof e === 'string' && EMAIL_REGEX.test(e.trim()))
          .map(e => e.trim().toLowerCase())
      )
    )

    if (cleanEmails.length === 0) {
      return NextResponse.json({ error: 'No valid email addresses provided' }, { status: 400 })
    }

    const admin = supabaseAdmin()
    const { data: clientRow } = await admin
      .from('clients')
      .select('full_name, email')
      .eq('id', authz.user.id)
      .maybeSingle()

    const rawInviterName =
      clientRow?.full_name?.trim() || clientRow?.email?.split('@')[0] || 'A fellow athlete'
    const inviterName = sanitizeHeaderText(rawInviterName).slice(0, 80) || 'A fellow athlete'
    const safeInviterHtml = escapeHtml(inviterName)
    const safeNoteHtml = personalNote ? escapeHtml(personalNote) : ''

    const codeRecord = await getOrCreateClientReferralCode(admin, authz.user.id, inviterName)
    const safeCodeHtml = escapeHtml(codeRecord.code)

    let baseUrl = 'https://forge-athletic.app'
    try {
      baseUrl = getTrustedAppBaseUrl()
    } catch {
      // fallback to canonical forge-athletic.app domain
    }

    const inviteLink = `${baseUrl.replace(/\/$/, '')}/r/${encodeURIComponent(
      codeRecord.customSlug || codeRecord.code
    )}`
    const safeInviteLinkHtml = escapeHtml(inviteLink)

    let sentCount = 0
    let suppressedCount = 0
    const errors: string[] = []

    for (const email of cleanEmails) {
      // Anti-self-invite check
      if (email === clientRow?.email?.toLowerCase()) {
        continue
      }

      const subject = `${inviterName} sent you a 30-Day Extended Free Trial Pass to Forge Athletic`
      const noteHtml = safeNoteHtml
        ? `<blockquote style="margin: 16px 0; padding: 12px 16px; border-left: 3px solid #C5A059; background: #0F172A; color: #E2E8F0; font-style: italic;">&ldquo;${safeNoteHtml}&rdquo;</blockquote>`
        : ''
      const noteText = personalNote ? `\nPersonal note from ${inviterName}: "${personalNote}"\n` : ''

      const ftcDisclosureText = `FTC Material Connection Disclosure (16 CFR § 255.5): ${inviterName} is a Forge Athletic member and may earn referral rewards or account credits if you enroll in a paid membership after your 30-day free trial.`

      const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #080E14; color: #F8FAFC; border: 1px solid rgba(197, 160, 89, 0.3); border-radius: 8px; overflow: hidden;">
  <div style="background: #0B131E; padding: 24px; text-align: center; border-bottom: 1px solid rgba(197, 160, 89, 0.2);">
    <h1 style="margin: 0; color: #C5A059; font-size: 22px; letter-spacing: 0.1em; font-weight: 700;">FORGE ATHLETIC</h1>
    <p style="margin: 6px 0 0; color: #94A3B8; font-size: 13px;">Evidence-Led Periodization &amp; Performance Telemetry</p>
  </div>
  <div style="padding: 32px 24px;">
    <h2 style="margin: 0 0 16px; color: #F8FAFC; font-size: 20px;">You&rsquo;ve Been Invited to Train.</h2>
    <p style="margin: 0 0 16px; color: #CBD5E1; font-size: 15px; line-height: 1.6;">
      <strong>${safeInviterHtml}</strong> has gifted you an exclusive <strong>30-Day Extended Free Trial Pass</strong> (normally 7 days) to Forge Athletic ($0.00 due at signup; cancel anytime in 1 click before Day 30).
    </p>
    ${noteHtml}
    <div style="background: rgba(197, 160, 89, 0.08); border: 1px dashed rgba(197, 160, 89, 0.4); border-radius: 6px; padding: 18px; margin: 24px 0;">
      <h3 style="margin: 0 0 8px; color: #C5A059; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em;">What&rsquo;s Included in Your 30-Day Pass:</h3>
      <ul style="margin: 0; padding-left: 20px; color: #CBD5E1; font-size: 14px; line-height: 1.7;">
        <li>Personalized 5-Phase NASM OPT&trade; Strength &amp; Conditioning Plan</li>
        <li>33-Point Posture &amp; Desk Ergonomics Camera Checks</li>
        <li>1RM Progression Matrix &amp; Voice-Paced Tempo Guidance</li>
        <li>Month-to-month flexibility with 1-click online cancellation ($0 fees)</li>
      </ul>
    </div>
    <div style="text-align: center; margin: 32px 0 24px;">
      <a href="${safeInviteLinkHtml}" style="display: inline-block; background: linear-gradient(135deg, #C5A059 0%, #DFBA73 100%); color: #080E14; padding: 14px 28px; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 6px; letter-spacing: 0.04em;">
        Claim Your 30-Day Free Trial Pass &rarr;
      </a>
    </div>
    <p style="margin: 0 0 12px; color: #64748B; font-size: 12px; text-align: center;">
      Invitation Code: <strong style="color: #94A3B8;">${safeCodeHtml}</strong>
    </p>
    <p style="margin: 0; color: #94A3B8; font-size: 11px; line-height: 1.5;">
      ${escapeHtml(ftcDisclosureText)}
    </p>
  </div>
</div>
`

      const text = [
        'FORGE ATHLETIC',
        'Evidence-Led Periodization & Performance Telemetry',
        '',
        `${inviterName} has gifted you an exclusive 30-Day Extended Free Trial Pass (normally 7 days) to Forge Athletic ($0.00 due at signup; cancel anytime in 1 click before Day 30).`,
        noteText,
        "What's Included:",
        '- Personalized 5-Phase NASM OPT™ Strength & Conditioning Plan',
        '- 33-Point Posture & Desk Ergonomics Camera Checks',
        '- 1RM Progression Matrix & Voice-Paced Tempo Guidance',
        '- Month-to-month flexibility with 1-click online cancellation ($0 fees)',
        '',
        'Claim your pass here:',
        inviteLink,
        '',
        `Invitation Code: ${codeRecord.code}`,
        '',
        ftcDisclosureText,
      ].join('\n')

      try {
        const delivery = await sendCommercialInviteEmail(admin, {
          to: email,
          subject,
          html,
          text,
        })

        if (delivery.skipped && delivery.reason === 'suppressed') {
          suppressedCount += 1
          continue
        }

        sentCount += 1

        // Record pending attribution
        await admin.from('referral_attributions').insert({
          referrer_id: authz.user.id,
          referral_code_id: codeRecord.id,
          referee_email: email,
          status: 'pending',
          source: 'email_invite',
        })
      } catch (err) {
        console.error(`[referrals:invite] Failed sending invite to ${email}:`, err)
        errors.push(email)
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      suppressedCount: suppressedCount > 0 ? suppressedCount : undefined,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'Failed to send referral invitations'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
