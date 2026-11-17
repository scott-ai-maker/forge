'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

interface MandatoryLegalClickwrapGateProps {
  defaultFullName?: string | null
}

export default function MandatoryLegalClickwrapGate({
  defaultFullName,
}: MandatoryLegalClickwrapGateProps) {
  const router = useRouter()
  const [acceptedTermsAndWaiver, setAcceptedTermsAndWaiver] = useState(false)
  const [acceptedHealthPrivacy, setAcceptedHealthPrivacy] = useState(false)
  const [typedSignature, setTypedSignature] = useState(defaultFullName?.trim() || '')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!acceptedTermsAndWaiver || !acceptedHealthPrivacy) {
      setErrorMessage(
        'Please review and check both agreement boxes below before accessing Forge Athletic.'
      )
      return
    }

    if (typedSignature.trim().length < 2) {
      setErrorMessage(
        'Please enter your full legal first and last name as your electronic signature.'
      )
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/account/legal-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentTypes: [
            'terms_of_service',
            'privacy_policy',
            'consumer_health_biometric_policy',
            'athletic_liability_waiver',
          ],
          ageVerified18Plus: true,
          affirmativeAssent: true,
          typedSignature: typedSignature.trim(),
          flow: 'oauth_mandatory_clickwrap_gate',
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.success) {
        setErrorMessage(
          json.error || 'Unable to save your legal consent right now. Please retry.'
        )
        return
      }
      router.push('/dashboard/onboarding')
      router.refresh()
    } catch {
      setErrorMessage('Network error while recording your electronic signature. Please retry.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section
      data-testid="mandatory-legal-clickwrap-gate"
      aria-labelledby="mandatory-clickwrap-heading"
      className="mx-auto my-8 max-w-2xl rounded-2xl border border-amber-400/45 bg-zinc-950/95 p-6 text-zinc-100 shadow-2xl sm:p-8"
    >
      <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-amber-300">
        Required Account Activation Step · ESIGN &amp; Massachusetts Clickwrap Notice
      </div>
      <h1
        id="mandatory-clickwrap-heading"
        className="mt-1.5 font-serif text-xl font-bold text-white sm:text-2xl"
      >
        Review &amp; Execute Forge Athletic Member Agreements
      </h1>
      <p className="mt-2 text-xs leading-relaxed text-zinc-300 sm:text-sm">
        Before accessing workouts, movement assessments, or coaching features, please review and affirmatively accept our governing agreements below.
      </p>

      <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-950/20 p-4 text-xs leading-relaxed text-amber-100">
        <strong className="uppercase tracking-wider text-amber-300">
          Important Legal Notice (Please Read Carefully):
        </strong>{' '}
        The{' '}
        <a
          href="/terms"
          target="_blank"
          rel="noreferrer"
          className="font-bold text-amber-200 underline hover:text-white"
        >
          Terms of Service
        </a>{' '}
        contain a <strong>Voluntary Assumption of Risk &amp; Release of Liability</strong> (including ordinary negligence to the fullest extent permitted by law), a <strong>Mandatory Binding Individual Arbitration Clause</strong>, and a <strong>Class-Action Waiver</strong>. Forge Athletic coaching is educational fitness guidance for adults <strong>18+</strong> and is not medical advice, physical therapy, or medical nutrition therapy.
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-500/50 bg-red-950/40 px-4 py-3 text-xs font-semibold text-red-200"
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/12 bg-white/[0.03] p-3.5 text-xs leading-relaxed text-zinc-200">
          <input
            type="checkbox"
            checked={acceptedTermsAndWaiver}
            onChange={e => setAcceptedTermsAndWaiver(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-400"
          />
          <span>
            I confirm that I am at least <strong>18 years of age</strong> (or the age of legal majority in my jurisdiction) and I have read and affirmatively agree to the Forge Athletic{' '}
            <a
              href="/terms"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-amber-300 underline"
            >
              Terms of Service &amp; Athletic Liability Waiver
            </a>{' '}
            (including Mandatory Individual Arbitration &amp; Class-Action Waiver) and{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-amber-300 underline"
            >
              Privacy Policy
            </a>
            .
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/12 bg-white/[0.03] p-3.5 text-xs leading-relaxed text-zinc-200">
          <input
            type="checkbox"
            checked={acceptedHealthPrivacy}
            onChange={e => setAcceptedHealthPrivacy(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-400"
          />
          <span>
            <strong>Standalone Consumer Health &amp; Biometric Data Authorization:</strong> I separately consent to Forge Athletic collecting and processing my fitness, PAR-Q+ health readiness, and posture/movement data solely to deliver coaching services as described in the{' '}
            <a
              href="/health-privacy"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-amber-300 underline"
            >
              Consumer Health &amp; Biometric Data Policy
            </a>
            .
          </span>
        </label>

        <div>
          <label
            htmlFor="clickwrap-typed-signature"
            className="block text-xs font-bold uppercase tracking-[0.08em] text-zinc-300"
          >
            Typed Full Legal Name Signature (ESIGN / M.G.L. c. 110G) *
          </label>
          <input
            id="clickwrap-typed-signature"
            type="text"
            required
            value={typedSignature}
            onChange={e => setTypedSignature(e.target.value)}
            placeholder="Type your full legal first and last name"
            className="mt-1.5 w-full min-h-[44px] rounded-xl border border-white/15 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-emerald-400 px-5 py-3 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? 'Recording Legal Signature...'
              : 'Execute Agreements & Continue to PAR-Q+ Onboarding →'}
          </button>
        </div>
      </form>
    </section>
  )
}
