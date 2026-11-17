'use client'

import React, { useState } from 'react'

export interface InitialErapCheckinValues {
  workoutStreetAddress?: string
  workoutUnitOrGateCode?: string
  workoutCity?: string
  workoutState?: string
  workoutPostalCode?: string
  localEmergencyDispatchPhone?: string
  hasAcceptedVirtualTelehealthConsent?: boolean
  isErapComplete?: boolean
}

interface LivePreSessionErapGateProps {
  athleteName: string
  coachName: string
  hasExistingIntake: boolean
  initialErap?: InitialErapCheckinValues
  initialEmergencyContactName?: string
  initialEmergencyContactPhone?: string
  children: React.ReactNode
}

function hasCompleteSavedErap(
  erap: InitialErapCheckinValues | undefined,
  emergencyContactName: string,
  emergencyContactPhone: string,
  hasExistingIntake: boolean
): boolean {
  if (!erap || !hasExistingIntake) return false
  const street = (erap.workoutStreetAddress ?? '').trim()
  const city = (erap.workoutCity ?? '').trim()
  const state = (erap.workoutState ?? '').trim()
  const postal = (erap.workoutPostalCode ?? '').trim()
  const dispatchDigits = (erap.localEmergencyDispatchPhone ?? '').replace(/\D/g, '')
  const emergencyPhoneDigits = emergencyContactPhone.replace(/\D/g, '')

  return (
    street.length >= 4 &&
    city.length >= 2 &&
    state.length >= 2 &&
    postal.length >= 3 &&
    dispatchDigits.length >= 10 &&
    emergencyContactName.trim().length >= 2 &&
    emergencyPhoneDigits.length >= 7
  )
}

export default function LivePreSessionErapGate({
  athleteName,
  coachName,
  hasExistingIntake,
  initialErap,
  initialEmergencyContactName = '',
  initialEmergencyContactPhone = '',
  children,
}: LivePreSessionErapGateProps) {
  const initialDispatch =
    initialErap?.localEmergencyDispatchPhone &&
    initialErap.localEmergencyDispatchPhone.replace(/\D/g, '').length >= 10
      ? initialErap.localEmergencyDispatchPhone
      : ''

  const savedComplete = hasCompleteSavedErap(
    { ...initialErap, localEmergencyDispatchPhone: initialDispatch },
    initialEmergencyContactName,
    initialEmergencyContactPhone,
    hasExistingIntake
  )

  const [sessionConfirmed, setSessionConfirmed] = useState(false)
  const [isEditingLocation, setIsEditingLocation] = useState(!savedComplete)
  const [workoutStreetAddress, setWorkoutStreetAddress] = useState(
    initialErap?.workoutStreetAddress ?? ''
  )
  const [workoutUnitOrGateCode, setWorkoutUnitOrGateCode] = useState(
    initialErap?.workoutUnitOrGateCode ?? ''
  )
  const [workoutCity, setWorkoutCity] = useState(initialErap?.workoutCity ?? '')
  const [workoutState, setWorkoutState] = useState(initialErap?.workoutState ?? '')
  const [workoutPostalCode, setWorkoutPostalCode] = useState(
    initialErap?.workoutPostalCode ?? ''
  )
  const [localEmergencyDispatchPhone, setLocalEmergencyDispatchPhone] =
    useState(initialDispatch)
  const [emergencyContactName, setEmergencyContactName] = useState(
    initialEmergencyContactName
  )
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    initialEmergencyContactPhone
  )
  const [typedSignature, setTypedSignature] = useState('')
  const [acceptedSafetyCovenant, setAcceptedSafetyCovenant] = useState(false)
  const [acceptedAllPartyRecordingConsent, setAcceptedAllPartyRecordingConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (sessionConfirmed) {
    return <>{children}</>
  }

  const handleConfirmSessionErap = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!acceptedSafetyCovenant) {
      setErrorMessage(
        'Please check the pre-session emergency location & immediate rack-on-disconnect acknowledgment before entering Live Studio.'
      )
      return
    }

    if (!acceptedAllPartyRecordingConsent) {
      setErrorMessage(
        'Please check the separate All-Party Live Coaching & Session Note Consent (M.G.L. c. 272, § 99 / Cal. Penal Code § 632) before entering Live Studio.'
      )
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/account/erap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutStreetAddress,
          workoutUnitOrGateCode,
          workoutCity,
          workoutState,
          workoutPostalCode,
          localEmergencyDispatchPhone,
          emergencyContactName,
          emergencyContactPhone,
          hasAcceptedVirtualTelehealthConsent: true,
          hasAcceptedAllPartyRecordingConsent: true,
          typedSignature: hasExistingIntake ? undefined : typedSignature,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorMessage(
          json.error || 'Unable to verify your Emergency Response Action Plan. Please check all fields.'
        )
        return
      }
      setSessionConfirmed(true)
    } catch {
      setErrorMessage('Network error while saving your Emergency Response Action Plan. Please retry.')
    } finally {
      setSubmitting(false)
    }
  }

  const formattedSavedAddress = [
    workoutStreetAddress.trim(),
    workoutUnitOrGateCode.trim() ? `(${workoutUnitOrGateCode.trim()})` : '',
    [workoutCity.trim(), workoutState.trim(), workoutPostalCode.trim()].filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <section
      data-testid="live-pre-session-erap-gate"
      aria-labelledby="pre-session-erap-heading"
      className="forge-surface-card rounded-2xl border border-amber-400/40 bg-zinc-950/95 p-5 shadow-2xl sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-amber-300">
            NASM Virtual Coaching Safety Standard · Pre-Session ERAP Check-In
          </div>
          <h2
            id="pre-session-erap-heading"
            className="mt-1 font-serif text-lg font-bold text-white sm:text-xl"
          >
            Confirm Your Current Physical Training Location, {athleteName}
          </h2>
          <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-zinc-300 sm:text-sm">
            Because {coachName} coaches remotely, dialing 911 from the coach&apos;s phone connects to the coach&apos;s municipal dispatch rather than your city. Confirming your exact physical workout address and local 10-digit police/EMS dispatch number ensures immediate emergency response before your camera or microphone activates.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-500/50 bg-red-950/40 px-4 py-3 text-xs font-semibold leading-relaxed text-red-200 sm:text-sm"
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleConfirmSessionErap} className="mt-5 space-y-5">
        {!isEditingLocation && savedComplete ? (
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-950/20 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1.5">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-emerald-300">
                  Saved Training Location &amp; Dispatch Profile
                </div>
                <div className="text-sm font-bold text-white sm:text-base">
                  {formattedSavedAddress}
                </div>
                <div className="text-xs text-zinc-300">
                  <strong>Local 10-Digit Emergency Dispatch:</strong> {localEmergencyDispatchPhone}
                </div>
                <div className="text-xs text-zinc-300">
                  <strong>Primary Emergency Contact:</strong> {emergencyContactName} · {emergencyContactPhone}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingLocation(true)}
                className="min-h-[44px] rounded-xl border border-white/20 bg-white/5 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.06em] text-zinc-100 transition-colors hover:bg-white/10"
              >
                Training Elsewhere Today? Update Address
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="erap-street"
                className="block text-xs font-bold uppercase tracking-[0.08em] text-zinc-300"
              >
                Physical Street Address Where You Are Training Today *
              </label>
              <input
                id="erap-street"
                type="text"
                required
                value={workoutStreetAddress}
                onChange={e => setWorkoutStreetAddress(e.target.value)}
                placeholder="e.g. 125 Newbury St (Home, Hotel, Office, or Gym)"
                className="mt-1.5 w-full min-h-[44px] rounded-xl border border-white/15 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="erap-unit"
                className="block text-xs font-bold uppercase tracking-[0.08em] text-zinc-300"
              >
                Apt / Suite / Floor / Gate Access Code
              </label>
              <input
                id="erap-unit"
                type="text"
                value={workoutUnitOrGateCode}
                onChange={e => setWorkoutUnitOrGateCode(e.target.value)}
                placeholder="e.g. Apt 4B · Gate #1942"
                className="mt-1.5 w-full min-h-[44px] rounded-xl border border-white/15 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="erap-city"
                className="block text-xs font-bold uppercase tracking-[0.08em] text-zinc-300"
              >
                City *
              </label>
              <input
                id="erap-city"
                type="text"
                required
                value={workoutCity}
                onChange={e => setWorkoutCity(e.target.value)}
                placeholder="e.g. Boston"
                className="mt-1.5 w-full min-h-[44px] rounded-xl border border-white/15 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="erap-state"
                className="block text-xs font-bold uppercase tracking-[0.08em] text-zinc-300"
              >
                State / Province *
              </label>
              <input
                id="erap-state"
                type="text"
                required
                value={workoutState}
                onChange={e => setWorkoutState(e.target.value)}
                placeholder="e.g. MA"
                className="mt-1.5 w-full min-h-[44px] rounded-xl border border-white/15 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="erap-postal"
                className="block text-xs font-bold uppercase tracking-[0.08em] text-zinc-300"
              >
                ZIP / Postal Code *
              </label>
              <input
                id="erap-postal"
                type="text"
                required
                value={workoutPostalCode}
                onChange={e => setWorkoutPostalCode(e.target.value)}
                placeholder="e.g. 02116"
                className="mt-1.5 w-full min-h-[44px] rounded-xl border border-white/15 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="erap-dispatch"
                className="block text-xs font-bold uppercase tracking-[0.08em] text-amber-300"
              >
                Local Municipal Police / EMS 10-Digit Dispatch Number (Not 911) *
              </label>
              <input
                id="erap-dispatch"
                type="tel"
                required
                value={localEmergencyDispatchPhone}
                onChange={e => setLocalEmergencyDispatchPhone(e.target.value)}
                placeholder="e.g. 617-343-4911 (Local 10-digit emergency / security desk line)"
                className="mt-1.5 w-full min-h-[44px] rounded-xl border border-amber-400/40 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-zinc-400">
                Enter your city&apos;s 10-digit emergency dispatch line (or hotel/building 24/7 security emergency desk) so a remote coach outside your area code can route local EMS directly to you.
              </p>
            </div>

            <div>
              <label
                htmlFor="erap-ec-name"
                className="block text-xs font-bold uppercase tracking-[0.08em] text-zinc-300"
              >
                Emergency Contact Full Name *
              </label>
              <input
                id="erap-ec-name"
                type="text"
                required
                value={emergencyContactName}
                onChange={e => setEmergencyContactName(e.target.value)}
                placeholder="e.g. Jordan Taylor"
                className="mt-1.5 w-full min-h-[44px] rounded-xl border border-white/15 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="erap-ec-phone"
                className="block text-xs font-bold uppercase tracking-[0.08em] text-zinc-300"
              >
                Emergency Contact Phone *
              </label>
              <input
                id="erap-ec-phone"
                type="tel"
                required
                value={emergencyContactPhone}
                onChange={e => setEmergencyContactPhone(e.target.value)}
                placeholder="e.g. 617-555-0192"
                className="mt-1.5 w-full min-h-[44px] rounded-xl border border-white/15 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            {!hasExistingIntake && (
              <div className="sm:col-span-2">
                <label
                  htmlFor="erap-signature"
                  className="block text-xs font-bold uppercase tracking-[0.08em] text-zinc-300"
                >
                  Typed Full Legal Name Signature (ESIGN / M.G.L. c. 110G) *
                </label>
                <input
                  id="erap-signature"
                  type="text"
                  required
                  value={typedSignature}
                  onChange={e => setTypedSignature(e.target.value)}
                  placeholder="Type your full legal first and last name"
                  className="mt-1.5 w-full min-h-[44px] rounded-xl border border-white/15 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
                />
              </div>
            )}
          </div>
        )}

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-xs leading-relaxed text-zinc-200">
          <input
            type="checkbox"
            checked={acceptedSafetyCovenant}
            onChange={e => setAcceptedSafetyCovenant(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-400"
          />
          <span>
            I confirm that I am physically located at the training address above right now, my 8×8 ft floor perimeter is clear of slip/trip hazards, I will <strong>immediately and safely rack all weights</strong> if video or audio latency/disconnection occurs (understanding a remote coach cannot physically spot me), and I authorize Forge Athletic Performance LLC to contact local emergency services and my emergency contact in an acute medical event.
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-950/15 p-3.5 text-xs leading-relaxed text-zinc-200">
          <input
            type="checkbox"
            checked={acceptedAllPartyRecordingConsent}
            onChange={e => setAcceptedAllPartyRecordingConsent(e.target.checked)}
            data-testid="all-party-recording-consent-checkbox"
            className="mt-0.5 h-5 w-5 shrink-0 accent-amber-400"
          />
          <span>
            <strong>All-Party Live Coaching &amp; Session Note Consent (M.G.L. c. 272, § 99 / Cal. Penal Code § 632):</strong> I affirmatively consent to 1:1 visual form-replay buffering, slow-motion telestrator coaching capture, and contemporaneous session S.O.A.P. note transcription during this live session, and I confirm that any bystanders in my training space have been notified.
          </span>
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <a
            href="/dashboard"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-zinc-200 hover:bg-white/10"
          >
            ← Return to Dashboard
          </a>

          <button
            type="submit"
            disabled={submitting}
            data-testid="confirm-erap-enter-studio-btn"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-400 px-5 py-2.5 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? 'Verifying Location & Safety Profile...'
              : 'Confirm Location & Enter 1:1 Live Studio →'}
          </button>
        </div>
      </form>
    </section>
  )
}
