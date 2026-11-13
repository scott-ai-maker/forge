'use client'

import { useCallback, useEffect, useState } from 'react'
import type {
  AutomationTemplateId,
  RenderedAutomationPayload,
  SuppressionDecision,
} from '@/lib/automations/launchSequence'

interface PreviewItem {
  id: AutomationTemplateId
  code: string
  step: number
  name: string
  channel: 'email' | 'sms'
  suppression: SuppressionDecision
  schedule: {
    due: boolean
    scheduledAtUtc: string | null
    targetLocalDate: string | null
    reason: string | null
  }
  rendered: RenderedAutomationPayload
}

interface ProviderStatus {
  resendConfigured: boolean
  fromEmail: string | null
  twilioConfigured: boolean
}

export default function LaunchEmailsHarnessClient() {
  const [items, setItems] = useState<PreviewItem[]>([])
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null)
  const [selectedId, setSelectedId] = useState<AutomationTemplateId>('launch_01b_email')
  const [viewMode, setViewMode] = useState<'html' | 'text' | 'headers'>('html')

  // Personalization & simulation controls
  const [firstName, setFirstName] = useState('Scott')
  const [guestFirstName, setGuestFirstName] = useState('Jordan')
  const [referrerFirstName, setReferrerFirstName] = useState('Scott')
  const [expirationDate, setExpirationDate] = useState('December 20, 2026')
  const [timezone, setTimezone] = useState('America/New_York')
  const [accountActivated, setAccountActivated] = useState(false)
  const [screeningBooked, setScreeningBooked] = useState(false)
  const [smsOptIn, setSmsOptIn] = useState(true)
  const [guestPassRedeemed, setGuestPassRedeemed] = useState(true)

  // Live test delivery controls
  const [toEmail, setToEmail] = useState('')
  const [toPhone, setToPhone] = useState('')
  const [sending, setSending] = useState(false)
  const [sendFeedback, setSendFeedback] = useState<string | null>(null)

  const refreshPreviews = useCallback(async () => {
    const params = new URLSearchParams({
      firstName,
      guestFirstName,
      referrerFirstName,
      expirationDate,
      timezone,
      account_activated: String(accountActivated),
      screening_booked: String(screeningBooked),
      sms_opt_in: String(smsOptIn),
      guest_pass_redeemed: String(guestPassRedeemed),
    })

    const res = await fetch(`/api/test-harness/launch-emails?${params.toString()}`)
    if (!res.ok) return
    const data = (await res.json()) as {
      providerStatus: ProviderStatus
      items: PreviewItem[]
    }
    setProviderStatus(data.providerStatus)
    setItems(data.items)
  }, [
    firstName,
    guestFirstName,
    referrerFirstName,
    expirationDate,
    timezone,
    accountActivated,
    screeningBooked,
    smsOptIn,
    guestPassRedeemed,
  ])

  useEffect(() => {
    void refreshPreviews()
  }, [refreshPreviews])

  const selected = items.find(i => i.id === selectedId) ?? items[0] ?? null

  async function handleSendTest(sendAllEmails: boolean) {
    if (!selected && !sendAllEmails) return
    setSending(true)
    setSendFeedback(null)

    try {
      const res = await fetch('/api/test-harness/launch-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: sendAllEmails ? undefined : selected?.id,
          sendAllEmails,
          prefixTestTag: true,
          toEmail,
          toPhone,
          firstName,
          guestFirstName,
          referrerFirstName,
          expirationDate,
          timezone,
        }),
      })
      const json = (await res.json()) as {
        success?: boolean
        error?: string
        results?: Array<{
          code: string
          delivered: boolean
          reason?: string
          error?: string
        }>
      }

      if (!res.ok) {
        setSendFeedback(`Error: ${json.error ?? 'Request failed'}`)
        return
      }

      const deliveredCount = (json.results ?? []).filter(r => r.delivered).length
      const totalCount = (json.results ?? []).length
      const failures = (json.results ?? [])
        .filter(r => !r.delivered)
        .map(r => `${r.code}: ${r.error ?? r.reason ?? 'skipped'}`)

      if (failures.length === 0) {
        setSendFeedback(`Sent ${deliveredCount}/${totalCount} test dispatch(es) cleanly.`)
      } else {
        setSendFeedback(
          `Delivered ${deliveredCount}/${totalCount}. Issues: ${failures.join(' · ')}`
        )
      }
    } catch (err) {
      setSendFeedback(err instanceof Error ? err.message : 'Network error sending test')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#060B14] text-slate-100">
      <header className="border-b border-amber-500/25 bg-[#0A1220] px-6 py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-bold tracking-widest text-amber-400 uppercase">
              Forge Athletic · Dev Automation Studio
            </p>
            <h1 className="text-xl font-bold text-white">
              Launch, Rescue, Referral &amp; Retention Email/SMS Inspector
            </h1>
          </div>
          {providerStatus && (
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span
                className={`rounded-full border px-3 py-1 ${
                  providerStatus.resendConfigured
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                }`}
              >
                {providerStatus.resendConfigured
                  ? `✓ Resend Ready (${providerStatus.fromEmail ?? 'default sender'})`
                  : '⚠ RESEND_API_KEY missing in .env.local'}
              </span>
              <span
                className={`rounded-full border px-3 py-1 ${
                  providerStatus.twilioConfigured
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-600 bg-slate-800/70 text-slate-300'
                }`}
              >
                {providerStatus.twilioConfigured ? '✓ Twilio SMS Ready' : '○ Twilio Optional'}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-12">
        <aside className="space-y-6 lg:col-span-4" aria-label="Template catalog and test controls">
          <section className="rounded-xl border border-slate-800 bg-[#0B1322] p-4">
            <h2 className="mb-3 font-mono text-xs font-bold tracking-wider text-amber-400 uppercase">
              1. Select Template (Nov 20 – Jan 1)
            </h2>
            <ul className="space-y-1.5">
              {items.map(item => {
                const isActive = selected?.id === item.id
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                        isActive
                          ? 'border-amber-400 bg-amber-500/15 font-semibold text-white'
                          : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="truncate pr-2">
                        <span className="mr-2 font-mono text-xs text-amber-300">{item.code}</span>
                        {item.name}
                      </span>
                      <span className="shrink-0 rounded border border-slate-700 px-1.5 py-0.5 font-mono text-[11px] uppercase">
                        {item.channel}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-800 bg-[#0B1322] p-4">
            <h2 className="mb-3 font-mono text-xs font-bold tracking-wider text-amber-400 uppercase">
              2. Personalization &amp; Suppression Flags
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="var-first-name" className="mb-1 block text-xs text-slate-300">
                  First Name
                </label>
                <input
                  id="var-first-name"
                  type="text"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-base text-white"
                />
              </div>
              <div>
                <label htmlFor="var-guest-name" className="mb-1 block text-xs text-slate-300">
                  Guest First Name
                </label>
                <input
                  id="var-guest-name"
                  type="text"
                  value={guestFirstName}
                  onChange={e => setGuestFirstName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-base text-white"
                />
              </div>
              <div>
                <label htmlFor="var-referrer-name" className="mb-1 block text-xs text-slate-300">
                  Referrer Name
                </label>
                <input
                  id="var-referrer-name"
                  type="text"
                  value={referrerFirstName}
                  onChange={e => setReferrerFirstName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-base text-white"
                />
              </div>
              <div>
                <label htmlFor="var-exp-date" className="mb-1 block text-xs text-slate-300">
                  Expiration Date
                </label>
                <input
                  id="var-exp-date"
                  type="text"
                  value={expirationDate}
                  onChange={e => setExpirationDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-base text-white"
                />
              </div>
            </div>

            <div className="mt-3">
              <label htmlFor="var-timezone" className="mb-1 block text-xs text-slate-300">
                Recipient IANA Timezone
              </label>
              <select
                id="var-timezone"
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-base text-white"
              >
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Chicago">America/Chicago (CST)</option>
                <option value="America/Denver">America/Denver (MST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              </select>
            </div>

            <fieldset className="mt-4 space-y-2 border-t border-slate-800 pt-3">
              <legend className="font-mono text-xs text-slate-400">
                Toggle User State Flags (Live Suppression Check)
              </legend>
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={accountActivated}
                  onChange={e => setAccountActivated(e.target.checked)}
                />
                <span>account_activated</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={screeningBooked}
                  onChange={e => setScreeningBooked(e.target.checked)}
                />
                <span>screening_booked</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={smsOptIn}
                  onChange={e => setSmsOptIn(e.target.checked)}
                />
                <span>sms_opt_in</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={guestPassRedeemed}
                  onChange={e => setGuestPassRedeemed(e.target.checked)}
                />
                <span>guest_pass_redeemed</span>
              </label>
            </fieldset>
          </section>

          <section className="rounded-xl border border-amber-500/30 bg-[#0B1322] p-4">
            <h2 className="mb-3 font-mono text-xs font-bold tracking-wider text-amber-400 uppercase">
              3. Send Real Test to Your Inbox / Phone
            </h2>
            <div className="space-y-3">
              <div>
                <label htmlFor="test-to-email" className="mb-1 block text-xs text-slate-300">
                  Destination Test Email (Resend)
                </label>
                <input
                  id="test-to-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@yourdomain.com"
                  value={toEmail}
                  onChange={e => setToEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-base text-white"
                />
              </div>
              <div>
                <label htmlFor="test-to-phone" className="mb-1 block text-xs text-slate-300">
                  Destination Test Mobile (Optional Twilio SMS)
                </label>
                <input
                  id="test-to-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+16175550199"
                  value={toPhone}
                  onChange={e => setToPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-base text-white"
                />
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  disabled={sending || (!toEmail && selected?.channel === 'email')}
                  onClick={() => void handleSendTest(false)}
                  className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
                >
                  {sending ? 'Sending...' : `Send Selected (${selected?.code ?? '...'})`}
                </button>
                <button
                  type="button"
                  disabled={sending || !toEmail}
                  onClick={() => void handleSendTest(true)}
                  className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-50"
                >
                  Send All 8 Emails to This Inbox
                </button>
              </div>
              {sendFeedback && (
                <p className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-slate-200">
                  {sendFeedback}
                </p>
              )}
            </div>
          </section>
        </aside>

        <section className="space-y-4 lg:col-span-8" aria-label="Rendered message preview">
          {selected ? (
            <div className="rounded-xl border border-slate-800 bg-[#0B1322] p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Template {selected.code} · {selected.name}
                  </h2>
                  <p className="font-mono text-xs text-slate-400">
                    Scheduled UTC:{' '}
                    {selected.schedule.scheduledAtUtc ?? 'Immediate on /invite/[code] redemption'}
                  </p>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 font-mono text-xs font-bold ${
                    selected.suppression.allowed
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                      : 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                  }`}
                >
                  {selected.suppression.allowed
                    ? '✓ ELIGIBLE TO SEND'
                    : `✕ SUPPRESSED (${selected.suppression.reason})`}
                </span>
              </div>

              {selected.rendered.channel === 'email' ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-sm">
                    <p>
                      <span className="font-mono text-xs text-slate-400">Subject: </span>
                      <strong className="text-white">{selected.rendered.subject}</strong>
                    </p>
                    <p className="mt-1">
                      <span className="font-mono text-xs text-slate-400">Preview Text: </span>
                      <span className="text-slate-300">{selected.rendered.previewText}</span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {(['html', 'text', 'headers'] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setViewMode(mode)}
                        className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-bold uppercase ${
                          viewMode === mode
                            ? 'border-amber-400 bg-amber-500/15 text-amber-300'
                            : 'border-slate-700 bg-slate-900 text-slate-400'
                        }`}
                      >
                        {mode === 'html'
                          ? 'HTML Email Render'
                          : mode === 'text'
                            ? 'Plain Text + Footer'
                            : 'Headers & Unsubscribe'}
                      </button>
                    ))}
                  </div>

                  {viewMode === 'html' && (
                    <iframe
                      title={`Rendered HTML preview for ${selected.name}`}
                      srcDoc={selected.rendered.html}
                      className="h-[680px] w-full rounded-xl border border-slate-800 bg-[#080E18]"
                    />
                  )}

                  {viewMode === 'text' && (
                    <pre
                      role="region"
                      aria-label="Plain text email body"
                      tabIndex={0}
                      className="max-h-[680px] overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs whitespace-pre-wrap text-slate-200"
                    >
                      <code>{selected.rendered.text}</code>
                    </pre>
                  )}

                  {viewMode === 'headers' && (
                    <pre
                      role="region"
                      aria-label="Email compliance headers"
                      tabIndex={0}
                      className="overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-300"
                    >
                      <code>{JSON.stringify(selected.rendered.headers, null, 2)}</code>
                    </pre>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mx-auto max-w-md rounded-2xl border border-slate-700 bg-slate-950 p-5">
                    <p className="mb-2 font-mono text-xs text-slate-400">
                      SMS Bubble Preview · {selected.rendered.body.length} chars
                    </p>
                    <p className="rounded-2xl bg-amber-500/15 p-4 text-sm leading-relaxed text-amber-100">
                      {selected.rendered.body}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Loading launch sequence templates...</p>
          )}
        </section>
      </main>
    </div>
  )
}

