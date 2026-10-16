import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { getOrCreateClientReferralCode } from '@/lib/referrals'
import { getTrustedAppBaseUrl } from '@/lib/app-base-url'
import { sendTransactionalEmail } from '@/lib/marketing-email'

export const dynamic = 'force-dynamic'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)
    const body = await req.json().catch(() => ({}))

    const rawEmails: unknown = body?.emails
    const personalNote: string = typeof body?.personalNote === 'string' ? body.personalNote.trim().slice(0, 300) : ''

    if (!Array.isArray(rawEmails) || rawEmails.length === 0) {
      return NextResponse.json({ error: 'Please provide at least one email address' }, { status: 400 })
    }

    if (rawEmails.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 invitations can be sent at once' }, { status: 400 })
    }

    const cleanEmails = rawEmails
      .filter((e): e is string => typeof e === 'string' && EMAIL_REGEX.test(e.trim()))
      .map(e => e.trim().toLowerCase())

    if (cleanEmails.length === 0) {
      return NextResponse.json({ error: 'No valid email addresses provided' }, { status: 400 })
    }

    const admin = supabaseAdmin()
    const { data: clientRow } = await admin
      .from('clients')
      .select('full_name, email')
      .eq('id', authz.user.id)
      .maybeSingle()

    const inviterName = clientRow?.full_name?.trim() || clientRow?.email?.split('@')[0] || 'A fellow athlete'

    const codeRecord = await getOrCreateClientReferralCode(admin, authz.user.id, inviterName)

    let baseUrl = 'https://forgeathletic.com'
    try {
      baseUrl = getTrustedAppBaseUrl()
    } catch {
      // fallback
    }

    const inviteLink = `${baseUrl.replace(/\/$/, '')}/r/${codeRecord.customSlug || codeRecord.code}`

    let sentCount = 0
    const errors: string[] = []

    for (const email of cleanEmails) {
      // Anti-self-invite check
      if (email === clientRow?.email?.toLowerCase()) {
        continue
      }

      const subject = `${inviterName} sent you a 30-Day VIP Pass to Forge Athletic`
      const noteHtml = personalNote
        ? `<blockquote style="margin: 16px 0; padding: 12px 16px; border-left: 3px solid #C5A059; background: #0F172A; color: #E2E8F0; font-style: italic;">"${personalNote}"</blockquote>`
        : ''
      const noteText = personalNote ? `\nPersonal note from ${inviterName}: "${personalNote}"\n` : ''

      const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #080E14; color: #F8FAFC; border: 1px solid rgba(197, 160, 89, 0.3); border-radius: 8px; overflow: hidden;">
  <div style="background: #0B131E; padding: 24px; text-align: center; border-bottom: 1px solid rgba(197, 160, 89, 0.2);">
    <h1 style="margin: 0; color: #C5A059; font-size: 22px; letter-spacing: 0.1em; font-weight: 700;">FORGE ATHLETIC</h1>
    <p style="margin: 6px 0 0; color: #94A3B8; font-size: 13px;">Evidence-Led Periodization &amp; Performance Telemetry</p>
  </div>
  <div style="padding: 32px 24px;">
    <h2 style="margin: 0 0 16px; color: #F8FAFC; font-size: 20px;">You've Been Invited to Train.</h2>
    <p style="margin: 0 0 16px; color: #CBD5E1; font-size: 15px; line-height: 1.6;">
      <strong>${inviterName}</strong> has gifted you an exclusive <strong>30-Day Extended VIP Pass</strong> (normally 7 days) + <strong>$20 Welcome Credit</strong> to Forge Athletic.
    </p>
    ${noteHtml}
    <div style="background: rgba(197, 160, 89, 0.08); border: 1px dashed rgba(197, 160, 89, 0.4); border-radius: 6px; padding: 18px; margin: 24px 0;">
      <h3 style="margin: 0 0 8px; color: #C5A059; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em;">What's Included in Your VIP Pass:</h3>
      <ul style="margin: 0; padding-left: 20px; color: #CBD5E1; font-size: 14px; line-height: 1.7;">
        <li>Automated NASM OPT™ Strength &amp; Conditioning Program</li>
        <li>Form Lab AI &amp; 3D Postural Mesh Audits</li>
        <li>1RM Progression Matrix &amp; Pacing Metronome</li>
        <li>$20 Membership Credit applied at checkout</li>
      </ul>
    </div>
    <div style="text-align: center; margin: 32px 0 24px;">
      <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #C5A059 0%, #DFBA73 100%); color: #080E14; padding: 14px 28px; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 6px; letter-spacing: 0.04em;">
        Claim Your 30-Day VIP Pass →
      </a>
    </div>
    <p style="margin: 0; color: #64748B; font-size: 12px; text-align: center;">
      Invitation Code: <strong style="color: #94A3B8;">${codeRecord.code}</strong>
    </p>
  </div>
</div>
`

      const text = `
FORGE ATHLETIC
Evidence-Led Periodization & Performance Telemetry

${inviterName} has gifted you an exclusive 30-Day Extended VIP Pass (normally 7 days) + $20 Welcome Credit to Forge Athletic.
${noteText}
What's Included:
- Automated NASM OPT™ Strength & Conditioning Program
- Form Lab AI & 3D Postural Mesh Audits
- 1RM Progression Matrix & Pacing Metronome
- $20 Membership Credit applied at checkout

Claim your pass here:
${inviteLink}

Invitation Code: ${codeRecord.code}
`

      try {
        await sendTransactionalEmail({
          to: email,
          subject,
          html,
          text,
        })
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
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'Failed to send invitations'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
