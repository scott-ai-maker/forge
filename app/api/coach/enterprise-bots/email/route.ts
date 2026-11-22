import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthzError, getRequestAuthz, requireEnterpriseLeadershipAccess } from '@/lib/authz'
import { EXECUTIVE_BOT_PROFILES } from '@/lib/enterprise-chatbots/knowledge'
import { sendTransactionalEmail } from '@/lib/marketing-email'
import {
  checkSlidingWindowRateLimit,
  resolveRequestSubjectKey,
} from '@/src/lib/security/rateLimiter'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' } as const

const EmailDispatchSchema = z.object({
  botId: z.enum(['b2b-partnerships', 'growth-marketing', 'cfo-revenue', 'enterprise-ops']),
  subject: z.string().trim().min(2).max(160),
  markdownBody: z.string().trim().min(10).max(20000),
  toEmail: z.string().trim().email().optional(),
})

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderPlainMarkdownToSafeHtml(markdown: string): string {
  const escaped = escapeHtml(markdown)
  return escaped
    .split(/\n{2,}/)
    .map(block => {
      const formatted = block
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code style="background:#F1F5F9;padding:1px 4px;border-radius:3px;">$1</code>')
        .replace(/\n/g, '<br />')
      return `<p style="margin:0 0 12px;line-height:1.6;color:#1E293B;font-size:14px;">${formatted}</p>`
    })
    .join('')
}

export async function POST(req: NextRequest) {
  let actorId = ''
  let actorEmail: string | null = null
  try {
    const authz = await getRequestAuthz(req)
    requireEnterpriseLeadershipAccess(authz)
    actorId = authz.user.id
    actorEmail = authz.user.email ?? null
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 401
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const rateCheck = checkSlidingWindowRateLimit({
    namespace: 'enterprise_bot_email_dispatch',
    subjectKey: resolveRequestSubjectKey(req, actorId),
    maxRequests: 20,
    windowMs: 10 * 60 * 1000,
  })
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: `Email dispatch rate limit reached. Try again in ${rateCheck.retryAfterSeconds}s.` },
      { status: 429, headers: { ...NO_STORE_HEADERS, 'Retry-After': String(rateCheck.retryAfterSeconds) } }
    )
  }

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const parsed = EmailDispatchSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid email dispatch payload' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const profile = EXECUTIVE_BOT_PROFILES[parsed.data.botId]
  const recipient =
    parsed.data.toEmail ||
    actorEmail ||
    process.env.MARKETING_INTERNAL_NOTIFY_EMAIL ||
    'scott@forge-athletic.app'

  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:680px;margin:0 auto;padding:24px;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;">
  <div style="border-bottom:2px solid #D4AF37;padding-bottom:14px;margin-bottom:20px;">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#B45309;">Forge Athletic Executive Brief</div>
    <h2 style="margin:6px 0 4px;font-size:18px;color:#0F172A;">${escapeHtml(parsed.data.subject)}</h2>
    <div style="font-size:12px;color:#475569;">From <strong>${escapeHtml(profile.name)}</strong> · ${escapeHtml(profile.title)} (${escapeHtml(profile.email)})</div>
  </div>
  ${renderPlainMarkdownToSafeHtml(parsed.data.markdownBody)}
  <hr style="margin:24px 0 12px;border:0;border-top:1px solid #E2E8F0;" />
  <p style="margin:0;font-size:12px;color:#475569;">
    <strong>${escapeHtml(profile.name)}</strong><br />
    ${escapeHtml(profile.title)} · Forge Athletic<br />
    ${escapeHtml(profile.email)} · ${escapeHtml(profile.departmentAlias)}
  </p>
</div>`.trim()

  const text = [
    `FORGE ATHLETIC EXECUTIVE BRIEF — ${parsed.data.subject}`,
    `From: ${profile.name} (${profile.title}) <${profile.email}>`,
    '',
    parsed.data.markdownBody,
    '',
    '---',
    `${profile.name}`,
    `${profile.title} · Forge Athletic`,
    `${profile.email} · ${profile.departmentAlias}`,
  ].join('\n')

  try {
    const result = await sendTransactionalEmail({
      to: recipient,
      from: profile.formattedFrom,
      replyTo: profile.email,
      subject: `[Forge Athletic] ${parsed.data.subject}`,
      html,
      text,
    })

    return NextResponse.json(
      {
        ok: true,
        from: profile.formattedFrom,
        replyTo: profile.email,
        to: recipient,
        skipped: result.skipped,
        id: result.skipped ? null : result.id,
        message: result.skipped
          ? `Email formatted from ${profile.email} (set RESEND_API_KEY in env to deliver live).`
          : `Sent from ${profile.email} to ${recipient}.`,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error) {
    console.error('[EnterpriseBotEmail] Dispatch failed:', error)
    return NextResponse.json(
      { error: 'Failed to dispatch executive brief email.' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}
