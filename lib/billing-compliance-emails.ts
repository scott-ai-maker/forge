import { MA_HEALTH_CLUB_STATUTORY_NOTICE } from '@/lib/legal-compliance'
import { getBaseUrl, sendTransactionalEmail } from '@/lib/marketing-email'

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function formatUsdFromCents(cents: number): string {
  const safe = Number.isFinite(cents) ? Math.max(cents, 0) : 0
  return `$${(safe / 100).toFixed(2)}`
}

export function formatBillingDateUtc(unixSeconds?: number | null): string {
  if (!unixSeconds || !Number.isFinite(unixSeconds)) {
    return 'your scheduled billing date'
  }
  return new Date(unixSeconds * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export interface SubscriptionConfirmationEmailInput {
  packageName: string
  recurringAmountCents: number
  cadence: 'monthly' | 'annual'
  trialDays?: number | null
  discountCode?: string | null
  baseUrl?: string
}

export function buildSubscriptionConfirmationEmail(input: SubscriptionConfirmationEmailInput): {
  subject: string
  html: string
  text: string
} {
  const baseUrl = (input.baseUrl || getBaseUrl()).replace(/\/+$/, '')
  const cancelUrl = `${baseUrl}/dashboard/settings`
  const intervalLabel = input.cadence === 'annual' ? 'year' : 'month'
  const recurringRate = `${formatUsdFromCents(input.recurringAmountCents)}/${intervalLabel}`
  const hasTrial = Boolean(input.trialDays && input.trialDays > 0)
  const safePlan = escapeHtml(input.packageName)
  const safeCode = input.discountCode ? escapeHtml(input.discountCode) : null

  const trialSummaryText = hasTrial
    ? `${input.trialDays}-day free trial ($0.00 charged today). Unless you cancel before your ${input.trialDays}-day trial ends, your payment method will automatically be charged ${recurringRate} and renew each ${intervalLabel} until cancelled.`
    : `Billed today at ${recurringRate}, then automatically renewing each ${intervalLabel} at ${recurringRate} unless cancelled prior to the renewal date.`

  const rateLockText = safeCode
    ? `Promotional Rate Lock (${input.discountCode}): Your discounted ${recurringRate} rate remains locked for as long as continuous active enrollment on your selected ${input.packageName} tier is maintained. Switching tiers or re-subscribing after cancellation bills at the then-current published rate.`
    : 'Month-to-Month Flexibility: There is zero multi-month lock-in or early-termination penalty.'

  const text = [
    `Forge Athletic — Subscription Confirmation & Cancellation Rights (${input.packageName})`,
    '',
    'Thank you for enrolling with Forge Athletic Performance LLC. Please retain this confirmation for your records.',
    '',
    `Plan: ${input.packageName}`,
    `Recurring Rate & Cadence: ${recurringRate} (auto-renewing ${input.cadence})`,
    `Billing Schedule: ${trialSummaryText}`,
    rateLockText,
    '',
    'HOW TO CANCEL ANYTIME ($0 CANCELLATION FEES):',
    `- 1-Click Online Cancellation: ${cancelUrl} (Account Settings > Billing > Cancel Membership)`,
    '- Email Cancellation: Email scott@forge-athletic.app from your registered account email prior to your next billing date.',
    '',
    'MASSACHUSETTS STATUTORY 3-BUSINESS-DAY RIGHT OF CANCELLATION:',
    MA_HEALTH_CLUB_STATUTORY_NOTICE,
    '',
    `Review full Terms of Service: ${baseUrl}/terms`,
  ].join('\n')

  const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0F172A; line-height: 1.6; max-width: 620px;">
  <h2 style="margin: 0 0 12px; color: #0F172A;">Forge Athletic Subscription Confirmation</h2>
  <p style="margin: 0 0 14px;">Thank you for enrolling with <strong>Forge Athletic Performance LLC</strong>. Please retain this email as your recurring subscription summary and statutory cancellation notice.</p>
  <div style="background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px; padding: 14px 16px; margin: 0 0 16px;">
    <p style="margin: 0 0 6px;"><strong>Membership Plan:</strong> ${safePlan}</p>
    <p style="margin: 0 0 6px;"><strong>Recurring Charge:</strong> ${escapeHtml(recurringRate)} (${input.cadence === 'annual' ? 'annual' : 'month-to-month'} auto-renewal)</p>
    <p style="margin: 0 0 6px;"><strong>Schedule:</strong> ${escapeHtml(trialSummaryText)}</p>
    <p style="margin: 0;"><strong>Rate Terms:</strong> ${escapeHtml(rateLockText)}</p>
  </div>
  <h3 style="margin: 0 0 6px; font-size: 15px;">1-Click Online Cancellation ($0 Fees)</h3>
  <p style="margin: 0 0 14px;">You may cancel recurring renewals at any time before your next billing date via <a href="${escapeHtml(cancelUrl)}">Account Settings &gt; Billing</a> or by emailing <a href="mailto:scott@forge-athletic.app">scott@forge-athletic.app</a>.</p>
  <div style="background: #FFFBEB; border: 1px solid #F59E0B; border-radius: 8px; padding: 12px 14px; margin: 0 0 14px; font-size: 13px;">
    <strong>Massachusetts Statutory Right of Cancellation (M.G.L. c. 93, &sect;&sect; 80&ndash;82):</strong><br />
    ${escapeHtml(MA_HEALTH_CLUB_STATUTORY_NOTICE)}
  </div>
  <p style="margin: 0; font-size: 12px; color: #475569;">Terms of Service: <a href="${escapeHtml(`${baseUrl}/terms`)}">${escapeHtml(`${baseUrl}/terms`)}</a></p>
</div>`

  return {
    subject: `[Forge Athletic] Subscription Confirmation & Cancellation Rights — ${input.packageName}`,
    html,
    text,
  }
}

export interface TrialEndingReminderEmailInput {
  packageName: string
  recurringAmountCents: number
  cadence: 'monthly' | 'annual'
  trialEndUnix: number | null
  baseUrl?: string
}

export function buildTrialEndingReminderEmail(input: TrialEndingReminderEmailInput): {
  subject: string
  html: string
  text: string
} {
  const baseUrl = (input.baseUrl || getBaseUrl()).replace(/\/+$/, '')
  const cancelUrl = `${baseUrl}/dashboard/settings`
  const intervalLabel = input.cadence === 'annual' ? 'year' : 'month'
  const recurringRate = `${formatUsdFromCents(input.recurringAmountCents)}/${intervalLabel}`
  const formattedDate = formatBillingDateUtc(input.trialEndUnix)
  const safePlan = escapeHtml(input.packageName)

  const text = [
    `Reminder: Your Forge Athletic ${input.packageName} free trial ends on ${formattedDate}.`,
    '',
    `Unless you cancel before ${formattedDate}, your payment method on file will automatically be charged ${recurringRate} and continue renewing each ${intervalLabel} until cancelled.`,
    '',
    `Cancel anytime in 1 click ($0 fees): ${cancelUrl}`,
    'Or email scott@forge-athletic.app before your trial ends.',
  ].join('\n')

  const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0F172A; line-height: 1.6; max-width: 620px;">
  <h2 style="margin: 0 0 12px;">Your Forge Athletic Free Trial Ends Soon</h2>
  <p style="margin: 0 0 12px;">Your <strong>${safePlan}</strong> free trial is scheduled to end on <strong>${escapeHtml(formattedDate)}</strong>.</p>
  <p style="margin: 0 0 14px;">Unless you cancel prior to <strong>${escapeHtml(formattedDate)}</strong>, your payment method will automatically be charged <strong>${escapeHtml(recurringRate)}</strong> and renew each ${intervalLabel} until cancelled.</p>
  <p style="margin: 0 0 12px;"><strong>Want to cancel with $0 fees?</strong> Visit <a href="${escapeHtml(cancelUrl)}">Account Settings &gt; Billing</a> or email <a href="mailto:scott@forge-athletic.app">scott@forge-athletic.app</a>.</p>
</div>`

  return {
    subject: `[Forge Athletic] Reminder: Your ${input.packageName} free trial ends ${formattedDate}`,
    html,
    text,
  }
}

export interface UpcomingRenewalEmailInput {
  packageName: string
  amountDueCents: number
  cadence: 'monthly' | 'annual'
  renewalUnix: number | null
  baseUrl?: string
}

export function buildUpcomingRenewalNoticeEmail(input: UpcomingRenewalEmailInput): {
  subject: string
  html: string
  text: string
} {
  const baseUrl = (input.baseUrl || getBaseUrl()).replace(/\/+$/, '')
  const cancelUrl = `${baseUrl}/dashboard/settings`
  const formattedAmount = formatUsdFromCents(input.amountDueCents)
  const formattedDate = formatBillingDateUtc(input.renewalUnix)
  const safePlan = escapeHtml(input.packageName)

  const text = [
    `Upcoming Forge Athletic Membership Renewal — ${input.packageName}`,
    '',
    `Your ${input.packageName} (${input.cadence}) subscription is scheduled to renew automatically on ${formattedDate} for ${formattedAmount}.`,
    '',
    `To update your payment method or cancel before ${formattedDate} with $0 cancellation fees, visit: ${cancelUrl}`,
    'Or email scott@forge-athletic.app prior to your renewal date.',
  ].join('\n')

  const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0F172A; line-height: 1.6; max-width: 620px;">
  <h2 style="margin: 0 0 12px;">Upcoming Forge Athletic Subscription Renewal</h2>
  <p style="margin: 0 0 12px;">Your <strong>${safePlan}</strong> (${escapeHtml(input.cadence)}) membership is scheduled to renew automatically on <strong>${escapeHtml(formattedDate)}</strong> for <strong>${escapeHtml(formattedAmount)}</strong>.</p>
  <p style="margin: 0;">To manage billing or cancel before renewal with $0 fees, visit <a href="${escapeHtml(cancelUrl)}">Account Settings &gt; Billing</a> or email <a href="mailto:scott@forge-athletic.app">scott@forge-athletic.app</a>.</p>
</div>`

  return {
    subject: `[Forge Athletic] Upcoming ${input.packageName} Renewal on ${formattedDate}`,
    html,
    text,
  }
}

export async function dispatchDeduplicatedBillingComplianceEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  params: {
    userId: string
    toEmail: string | null
    dedupeKey: string
    logType: string
    subject: string
    html: string
    text: string
  }
): Promise<{ sent: boolean; skippedReason?: string }> {
  try {
    let recipient = params.toEmail?.trim() || null
    if (!recipient && admin && typeof admin.from === 'function') {
      const { data: clientRow } = await admin
        .from('clients')
        .select('email')
        .eq('id', params.userId)
        .maybeSingle()
      if (typeof clientRow?.email === 'string' && !clientRow.email.endsWith('@placeholder.local')) {
        recipient = clientRow.email.trim()
      }
    }

    if (!recipient || recipient.endsWith('@placeholder.local')) {
      return { sent: false, skippedReason: 'missing_recipient' }
    }

    if (admin && typeof admin.from === 'function') {
      const { data: existing } = await admin
        .from('notification_log')
        .select('id')
        .eq('dedupe_key', params.dedupeKey)
        .maybeSingle()
      if (existing?.id) {
        return { sent: false, skippedReason: 'duplicate' }
      }
    }

    const sendRes = await sendTransactionalEmail({
      to: recipient,
      subject: params.subject,
      html: params.html,
      text: params.text,
    })

    if ('skipped' in sendRes && sendRes.skipped) {
      return { sent: false, skippedReason: 'email_not_configured' }
    }

    if (admin && typeof admin.from === 'function') {
      await admin.from('notification_log').insert({
        user_id: params.userId,
        type: params.logType,
        channels: ['email'],
        dedupe_key: params.dedupeKey,
      })
    }

    return { sent: true }
  } catch (err) {
    console.warn(`[billing-compliance-email] Failed dispatching ${params.logType}:`, err)
    return { sent: false, skippedReason: 'error' }
  }
}
