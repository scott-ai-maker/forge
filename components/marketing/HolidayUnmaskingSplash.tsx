'use client'

import React, { useState, useEffect, useRef, useId } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ForgeIcon from '@/components/ui/ForgeIcon'
import AppSneakPeekShowcase from '@/components/marketing/AppSneakPeekShowcase'
import EverydayMomentsStrip from '@/components/marketing/EverydayMomentsStrip'
import LandingFaqAccordion from '@/components/marketing/LandingFaqAccordion'
import FoundingRateLockPricingGrid from '@/components/packages/FoundingRateLockPricingGrid'
import { COACH_GORDON_TRUST_PROFILE } from '@/lib/landingSocialProof'
import {
  calculateTimeRemaining,
  getGoLiveDate,
  HOLIDAY_DEAL_PROMO,
  LAUNCH_CAMPAIGN_INFO,
  TimeRemaining,
} from '@/lib/launch-config'

const NAV_ANCHORS = [
  { href: '#movement-lab', label: 'Movement Lab' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
] as const

export default function HolidayUnmaskingSplash({
  previewMode = false,
}: {
  previewMode?: boolean
}) {
  const [mounted, setMounted] = useState(false)
  const [targetDate, setTargetDate] = useState<Date>(() => getGoLiveDate())
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(targetDate)
  )
  const reservationSectionRef = useRef<HTMLDivElement | null>(null)

  // Founding Pass Form State
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [smsConsent, setSmsConsent] = useState(false)
  const [primaryGoal, setPrimaryGoal] = useState('posture_joint_health')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [invalidField, setInvalidField] = useState<'name' | 'email' | null>(null)
  const [copiedSerial, setCopiedSerial] = useState(false)
  const [showSmsInput, setShowSmsInput] = useState(false)
  const [showPrelaunchNotice, setShowPrelaunchNotice] = useState(false)

  const mountTimeRef = useRef<number>(0)

  const nameInputId = useId()
  const emailInputId = useId()
  const phoneInputId = useId()
  const goalSelectId = useId()
  const formErrorId = useId()

  useEffect(() => {
    setMounted(true)
    mountTimeRef.current = Date.now()
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('waitlist') === 'prelaunch') {
        setShowPrelaunchNotice(true)
      }
    }
    const resolvedTarget = getGoLiveDate()
    setTargetDate(resolvedTarget)
    setTimeRemaining(calculateTimeRemaining(resolvedTarget))

    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(resolvedTarget))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const scrollToReservationForm = () => {
    reservationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const input = document.getElementById(nameInputId)
    if (input) input.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setInvalidField(null)

    if (!fullName.trim()) {
      setStatus('error')
      setInvalidField('name')
      setErrorMessage('Please enter your full name.')
      document.getElementById(nameInputId)?.focus()
      return
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus('error')
      setInvalidField('email')
      setErrorMessage('Please enter a valid email address.')
      document.getElementById(emailInputId)?.focus()
      return
    }

    if (showSmsInput && phone.trim() && !smsConsent) {
      setStatus('error')
      setErrorMessage(
        'Please check the optional SMS consent box to receive text alerts, or clear the mobile number field to register by email only.'
      )
      return
    }

    setStatus('submitting')

    try {
      let detectedTz: string | undefined
      try {
        detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone
      } catch {
        // ignore
      }
      const consentedPhone = showSmsInput && smsConsent && phone.trim() ? phone.trim() : undefined

      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          firstName: fullName.trim(),
          trainingLevel: 'intermediate',
          primaryGoal: `[Founding Cohort Pass] Goal: ${primaryGoal}`,
          source: 'holiday_unmasking_drop',
          phone: consentedPhone,
          smsConsent: Boolean(consentedPhone),
          timezone: detectedTz,
          profileType: primaryGoal,
          honeypot,
          startTimeMs: mountTimeRef.current,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setStatus('success')
        setInvalidField(null)
      } else {
        setStatus('error')
        const serverErr =
          typeof data?.error === 'string'
            ? data.error
            : 'Unable to register your reservation. Please try again.'
        setErrorMessage(serverErr)
        if (/email|domain|mail/i.test(serverErr)) {
          setInvalidField('email')
          document.getElementById(emailInputId)?.focus()
        } else if (/name/i.test(serverErr)) {
          setInvalidField('name')
          document.getElementById(nameInputId)?.focus()
        }
      }
    } catch {
      setStatus('error')
      setErrorMessage('Network connection error. Please try again.')
    }
  }

  const deterministicEmailRef = (() => {
    const normalized = email.trim().toLowerCase()
    if (!normalized) return '0001'
    let hash = 0
    for (let i = 0; i < normalized.length; i += 1) {
      hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0
    }
    return String((hash % 9000) + 1000)
  })()
  const formattedSerial = `FORGE-FOUNDING-2027-${deterministicEmailRef}`

  const copyVipSerial = async () => {
    try {
      await navigator.clipboard.writeText(formattedSerial)
      setCopiedSerial(true)
      setTimeout(() => setCopiedSerial(false), 2500)
    } catch {
      // Clipboard API unavailable in restricted context
    }
  }

  return (
    <div
      className="holiday-unmasking-wrapper forge-obsidian-canvas"
      style={{
        minHeight: '100dvh',
        backgroundColor: '#090A0D',
        color: '#F8FAFC',
        position: 'relative',
        overflowX: 'clip',
        fontFamily: 'var(--font-body)',
        paddingBottom: 72,
      }}
    >
      <div
        style={{
          maxWidth: 1160,
          margin: '0 auto',
          padding: '20px 16px 0',
          position: 'relative',
          zIndex: 1,
        }}
        className="sm:px-6"
      >
        {/* 1. TOP NAV */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-5">
          <Link href="/" className="flex items-center gap-3 text-inherit no-underline">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-amber-400/35">
              <Image
                src="/images/brand/forge-crest-mark.png"
                alt="Forge Athletic"
                fill
                sizes="40px"
                style={{ objectFit: 'cover' }}
                priority
              />
            </div>
            <div>
              <div className="font-serif text-xl font-bold uppercase leading-none tracking-[0.04em] text-white">
                Forge Athletic
              </div>
              <div className="mt-1 text-[11px] font-medium text-amber-300/90">
                NASM-CPT® Online Coaching
              </div>
            </div>
          </Link>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <nav
              aria-label="Primary landing page sections"
              className="mr-2 hidden items-center gap-5 text-xs font-semibold text-zinc-300 lg:flex"
            >
              {NAV_ANCHORS.map(anchor => (
                <a
                  key={anchor.href}
                  href={anchor.href}
                  className="inline-flex min-h-[44px] items-center transition-colors hover:text-amber-300"
                >
                  {anchor.label}
                </a>
              ))}
            </nav>

            <Link
              href="/auth/login"
              className="forge-tactile-press inline-flex min-h-[44px] items-center rounded-xl border border-white/10 bg-[#181B22] px-3.5 py-2 text-xs font-medium text-zinc-200 no-underline transition-colors hover:border-white/20 sm:text-[13px]"
            >
              Member Sign In
            </Link>

            <button
              type="button"
              onClick={scrollToReservationForm}
              className="forge-tactile-press inline-flex min-h-[44px] items-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 px-4 py-2 font-serif text-xs font-extrabold uppercase tracking-[0.05em] text-[#090A0D] shadow-[0_2px_12px_rgba(245,158,11,0.28)] sm:text-[13px]"
            >
              Claim Founding Pass
            </button>
          </div>
        </header>

        {/* Mobile Anchor Strip */}
        <nav
          aria-label="Mobile section navigation"
          className="mb-6 flex items-center gap-2 overflow-x-auto rounded-xl border border-white/[0.08] bg-[#111318] px-2.5 py-1 text-xs font-semibold text-zinc-300 lg:hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {NAV_ANCHORS.map(anchor => (
            <a
              key={anchor.href}
              href={anchor.href}
              className="inline-flex min-h-[44px] shrink-0 items-center px-2.5 text-zinc-300 no-underline transition-colors hover:text-amber-300"
            >
              {anchor.label}
            </a>
          ))}
        </nav>

        {showPrelaunchNotice && (
          <div
            role="status"
            className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/40 bg-amber-500/12 px-4 py-3 text-xs text-amber-100"
          >
            <span>
              <strong>Pre-Launch Registration Gate:</strong> Public self-serve account creation opens{' '}
              <strong>{LAUNCH_CAMPAIGN_INFO.dateFormatted} at {LAUNCH_CAMPAIGN_INFO.timeFormatted}</strong>.
              Reserve your Founding Member Pass below to lock in 25% off ({HOLIDAY_DEAL_PROMO.code}).
            </span>
            <button
              type="button"
              onClick={scrollToReservationForm}
              className="rounded-lg bg-amber-400 px-3 py-1.5 font-bold text-[#090A0D]"
            >
              Reserve Now ↓
            </button>
          </div>
        )}

        {previewMode && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-400/35 bg-sky-500/10 px-4 py-2.5 text-xs text-sky-300">
            <span>
              <strong>Preview Mode:</strong> Founding Cohort Pre-Launch view (opens{' '}
              {LAUNCH_CAMPAIGN_INFO.dateFormatted}).
            </span>
            <Link href="/?unmasked=true" className="font-semibold text-white underline">
              View Live Mode →
            </Link>
          </div>
        )}

        {/* 2. HERO + FOUNDING COHORT PASS */}
        <section
          aria-labelledby="hero-headline"
          className="mb-16 grid grid-cols-1 items-start gap-8 lg:grid-cols-12"
        >
          {/* Left Column: Core Value Prop + Countdown + Coach Verification */}
          <div className="lg:col-span-7">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-[#111318] px-3.5 py-1.5 text-xs font-semibold text-amber-200">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
              <span>Founding Cohort (50 Spots) · Opens Monday, Jan 4, 2027</span>
            </div>

            <h1
              id="hero-headline"
              style={{
                fontSize: 'clamp(2.1rem, 1.35rem + 2.8vw, 3.6rem)',
                lineHeight: 1.06,
                textWrap: 'balance',
              }}
              className="font-serif font-extrabold tracking-tight text-white"
            >
              Start 2027 with joint-first precision—not a 3-week resolution.
            </h1>

            <p
              style={{ textWrap: 'pretty' }}
              className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg"
            >
              NASM-certified human coaching paired with local in-browser 33-point phone camera
              posture screening, adaptive 5-Phase OPT™ workouts, and Coach Gordon’s real voice
              pacing every session.
            </p>

            {/* Core Pillars Bullets */}
            <ul className="mt-5 grid grid-cols-1 gap-2.5 text-sm text-zinc-200 sm:grid-cols-2">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-400">✓</span>
                <span>33-point phone camera posture check (zero cloud video upload)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-400">✓</span>
                <span>1-tap Home, Apartment Gym, Bodyweight &amp; Hotel Travel swaps</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-400">✓</span>
                <span>Coach Gordon’s real voice tempo, rest &amp; readiness guidance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-400">✓</span>
                <span>Live 1-on-1 &amp; Team Video Studio (nights &amp; weekends · limited seats) + Async Form Lab</span>
              </li>
            </ul>

            {/* Compact Countdown Bar */}
            <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#111318] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                <span className="font-semibold text-zinc-200">Founding Cohort Opening Countdown</span>
                <span className="font-mono font-semibold text-amber-300">
                  Jan 4, 2027 · 6:00 AM EST
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Days', value: timeRemaining.days },
                  { label: 'Hours', value: timeRemaining.hours },
                  { label: 'Min', value: timeRemaining.minutes },
                  { label: 'Sec', value: timeRemaining.seconds },
                ].map((unit, idx) => (
                  <div
                    key={unit.label}
                    className="rounded-xl border border-white/[0.08] bg-[#181B22] px-2 py-2.5 text-center"
                  >
                    <div
                      className={`font-mono text-xl font-extrabold leading-none tabular-nums sm:text-2xl ${
                        idx === 3 ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
                      {mounted ? String(unit.value).padStart(2, '0') : '--'}
                    </div>
                    <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      {unit.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coach Gordon Credential Bar */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#111318] px-4 py-3">
              <div className="flex items-center gap-3">
                <Image
                  src={COACH_GORDON_TRUST_PROFILE.portraitSrc}
                  alt="Coach Gordon"
                  width={42}
                  height={42}
                  className="h-10 w-10 rounded-full border border-amber-400/40 object-cover object-top"
                />
                <div className="text-xs">
                  <div className="font-bold text-white">
                    {COACH_GORDON_TRUST_PROFILE.name} · {COACH_GORDON_TRUST_PROFILE.verificationBadge}
                  </div>
                  <div className="text-zinc-400">
                    Prior ACE-CPT (2008–2021) · ASTI CPR/AED · Direct Human Oversight
                  </div>
                </div>
              </div>
              <Link
                href="/credentials"
                className="text-xs font-semibold text-amber-300 underline-offset-4 hover:underline"
              >
                Verify Credentials →
              </Link>
            </div>
          </div>

          {/* Right Column: Single Integrated HOLIDAY25 Founding Cohort Registration Card */}
          <div
            ref={reservationSectionRef}
            className="rounded-2xl border border-amber-400/35 bg-[#111318] p-5 sm:p-7 lg:col-span-5"
            style={{
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 20px 48px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-amber-400/25 bg-amber-500/[0.08] px-3.5 py-2 text-xs">
              <span className="font-semibold text-amber-200">Founding Rate Lock</span>
              <span className="font-mono font-bold text-emerald-400">
                Code {HOLIDAY_DEAL_PROMO.code} (25% Off)
              </span>
            </div>

            {status !== 'success' ? (
              <>
                <h2 className="font-serif text-2xl font-bold tracking-tight text-white">
                  Reserve Your Founding Member Pass
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
                  No payment today. Register before Jan 4 to lock in your{' '}
                  <strong>{HOLIDAY_DEAL_PROMO.code}</strong> 25% continuous tier rate, a free 60-min
                  kickoff movement screen (on first paid cycle), and a giftable 30-day Core Lab
                  Partner Pass.
                </p>

                <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
                  <input
                    type="text"
                    name="organization_verification_code"
                    value={honeypot}
                    onChange={e => setHoneypot(e.target.value)}
                    style={{ display: 'none' }}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                  />

                  <div>
                    <label
                      htmlFor={nameInputId}
                      className="mb-1.5 block text-xs font-semibold text-zinc-300"
                    >
                      Full Name *
                    </label>
                    <input
                      id={nameInputId}
                      type="text"
                      required
                      autoComplete="name"
                      aria-invalid={invalidField === 'name' ? 'true' : 'false'}
                      aria-describedby={invalidField === 'name' && errorMessage ? formErrorId : undefined}
                      value={fullName}
                      onChange={e => {
                        setFullName(e.target.value)
                        if (invalidField === 'name' || status === 'error') {
                          setInvalidField(null)
                          setErrorMessage(null)
                          if (status === 'error') setStatus('idle')
                        }
                      }}
                      placeholder="Jordan Smith"
                      className={`min-h-[46px] w-full rounded-xl border bg-[#090A0D] px-3.5 py-2.5 text-base text-white placeholder:text-zinc-500 focus:border-amber-400 ${
                        invalidField === 'name' ? 'border-rose-400/70' : 'border-white/15'
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={emailInputId}
                      className="mb-1.5 block text-xs font-semibold text-zinc-300"
                    >
                      Email Address *
                    </label>
                    <input
                      id={emailInputId}
                      type="email"
                      required
                      autoComplete="email"
                      aria-invalid={invalidField === 'email' ? 'true' : 'false'}
                      aria-describedby={invalidField === 'email' && errorMessage ? formErrorId : undefined}
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value)
                        if (invalidField === 'email' || status === 'error') {
                          setInvalidField(null)
                          setErrorMessage(null)
                          if (status === 'error') setStatus('idle')
                        }
                      }}
                      placeholder="jordan@example.com"
                      className={`min-h-[46px] w-full rounded-xl border bg-[#090A0D] px-3.5 py-2.5 text-base text-white placeholder:text-zinc-500 focus:border-amber-400 ${
                        invalidField === 'email' ? 'border-rose-400/70' : 'border-white/15'
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={goalSelectId}
                      className="mb-1.5 block text-xs font-semibold text-zinc-300"
                    >
                      Primary Training Focus
                    </label>
                    <select
                      id={goalSelectId}
                      value={primaryGoal}
                      onChange={e => setPrimaryGoal(e.target.value)}
                      className="min-h-[46px] w-full cursor-pointer rounded-xl border border-white/15 bg-[#090A0D] px-3.5 py-2.5 text-base text-white focus:border-amber-400"
                    >
                      <option value="posture_joint_health">
                        Posture, Spine &amp; Joint Comfort
                      </option>
                      <option value="functional_strength">
                        Structured Strength &amp; Muscle Progression
                      </option>
                      <option value="energy_conditioning">
                        20-Minute Home Efficiency &amp; Stamina
                      </option>
                      <option value="flexible_training">
                        Consistent Hotel &amp; Travel Training
                      </option>
                    </select>
                  </div>

                  <div>
                    <button
                      type="button"
                      aria-expanded={showSmsInput}
                      onClick={() => setShowSmsInput(prev => !prev)}
                      className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-amber-300 underline-offset-4 hover:underline"
                    >
                      {showSmsInput
                        ? '− Hide SMS launch alert'
                        : '+ Add optional SMS launch alert'}
                    </button>

                    {showSmsInput ? (
                      <div className="mt-1.5 space-y-2.5">
                        <div>
                          <label
                            htmlFor={phoneInputId}
                            className="mb-1.5 block text-xs text-zinc-400"
                          >
                            Mobile Number (Optional)
                          </label>
                          <input
                            id={phoneInputId}
                            type="tel"
                            autoComplete="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="+1 (555) 000-0000"
                            className="min-h-[46px] w-full rounded-xl border border-white/15 bg-[#090A0D] px-3.5 py-2.5 text-base text-white placeholder:text-zinc-500 focus:border-amber-400"
                          />
                        </div>

                        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-amber-400/25 bg-[#090A0D]/90 p-3 text-[11px] leading-relaxed text-zinc-300">
                          <input
                            type="checkbox"
                            checked={smsConsent}
                            onChange={e => setSmsConsent(e.target.checked)}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-amber-400"
                          />
                          <span>
                            By checking this box, I provide prior express written consent to receive automated launch and
                            coaching text messages from <strong>Forge Athletic</strong> at the number provided.{' '}
                            <strong>Consent is not a condition of purchase.</strong> Msg &amp; data rates may apply. Reply{' '}
                            <strong>STOP</strong> to cancel, <strong>HELP</strong> for help. View{' '}
                            <Link href="/terms" className="text-amber-300 underline">
                              Terms
                            </Link>{' '}
                            &amp;{' '}
                            <Link href="/privacy#sms-privacy" className="text-amber-300 underline">
                              Privacy Policy
                            </Link>
                            .
                          </span>
                        </label>
                      </div>
                    ) : null}
                  </div>

                  {errorMessage && (
                    <div
                      id={formErrorId}
                      role="alert"
                      className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-200"
                    >
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="forge-tactile-press inline-flex min-h-[50px] w-full items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 px-5 py-3.5 font-serif text-base font-extrabold tracking-wide text-[#090A0D] shadow-[0_6px_22px_rgba(245,158,11,0.3)] transition hover:brightness-105 disabled:cursor-wait disabled:opacity-70"
                  >
                    {status === 'submitting'
                      ? 'Reserving Founding Member Pass…'
                      : 'Claim Your Founding Member Pass →'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
                  ✓ Founding Reservation Confirmed
                </div>
                <h3 className="font-serif text-2xl font-bold text-white">
                  Welcome to the Founding Cohort, {fullName.split(' ')[0]}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                  Your Founding Member Pass and kickoff movement screening invitation have been sent
                  to <strong>{email}</strong>.
                </p>

                <div className="forge-metallic-pass my-5 rounded-2xl p-5 text-left">
                  <div className="text-xs text-zinc-400">Pass Holder</div>
                  <div className="text-base font-bold text-white">{fullName}</div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 font-mono text-xs">
                    <span className="text-sky-300">{formattedSerial}</span>
                    <span className="font-semibold text-emerald-300">
                      Code {HOLIDAY_DEAL_PROMO.code}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={copyVipSerial}
                  className="forge-tactile-press inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/15 bg-[#181B22] px-4 py-2.5 font-mono text-xs text-zinc-200"
                >
                  <ForgeIcon name="ticket" size={14} />
                  <span>{copiedSerial ? 'Copied Pass Serial' : 'Copy Member Pass Serial'}</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 3. SINGLE FOCUSED INTERACTIVE DEMO (#movement-lab) */}
        <AppSneakPeekShowcase />

        {/* 4. HOW IT FITS REAL LIFE (#how-it-works) */}
        <EverydayMomentsStrip />

        {/* 5. MEMBERSHIP TIERS SUMMARY (#pricing) + TIGHT FAQ (#faq) + FOOTER */}
        <section
          id="pricing"
          aria-labelledby="founding-pricing-heading"
          className="mx-auto my-16 max-w-[1160px] scroll-mt-24 rounded-2xl border border-amber-400/25 bg-[#0E131D] p-5 sm:p-8"
          style={{
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 24px 60px rgba(0, 0, 0, 0.55)',
          }}
        >
          <div className="mx-auto mb-8 max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300">
              Founding Member Continuous Tier Rate Lock
            </span>
            <h2
              id="founding-pricing-heading"
              style={{ textWrap: 'balance' }}
              className="mt-3.5 font-serif text-2xl font-extrabold tracking-tight text-white sm:text-4xl"
            >
              Three Clear Month-to-Month Tiers
            </h2>
            <p className="mx-auto mt-2.5 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
              Lock in 25% off your selected tier with code <strong>{HOLIDAY_DEAL_PROMO.code}</strong>{' '}
              while continuously enrolled, plus a complimentary 60-min kickoff movement screen (on
              first paid cycle) and 1 giftable 30-day Core Lab Partner Pass.
            </p>
          </div>

          <FoundingRateLockPricingGrid
            mode="prelaunch"
            onPrelaunchClaimClick={scrollToReservationForm}
          />

          {/* Live 1-on-1 & Team Video Studio Callout */}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-400/30 bg-[#111318] p-5 text-left">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[10.5px] font-bold uppercase tracking-wider">
                <span className="rounded bg-amber-400/15 px-2 py-0.5 text-amber-300">
                  Live Video Studio · Single &amp; Team
                </span>
                <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-300">
                  Nights &amp; Weekends · Limited Seats
                </span>
              </div>
              <h3 className="mt-2 font-serif text-lg font-bold text-white">
                Live 1-on-1 Sessions ($180) &amp; Small-Group Team Pods ($1,600–$3,500/mo)
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                Add real-time 60fps encrypted WebRTC coaching with Coach Gordon—1-on-1 private sessions ($180 single, $660 4-pack, $1,240 8-pack) or executive Team Live Studio pods (4–6 live athletes per room; up to 10 seats via dual 5-person pods).
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/packages#live-1-on-1"
                className="forge-tactile-press inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-amber-400/45 bg-amber-500/15 px-4 py-2 text-xs font-bold text-amber-200 no-underline transition hover:bg-amber-500/25"
              >
                <span>Live 1:1 Pricing →</span>
              </Link>
              <Link
                href="/corporate"
                className="forge-tactile-press inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/12 px-4 py-2 text-xs font-bold text-emerald-200 no-underline transition hover:bg-emerald-500/22"
              >
                <span>Team Live Training →</span>
              </Link>
            </div>
          </div>

          <div className="mt-7 text-center">
            <Link
              href="/packages"
              className="forge-tactile-press inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/10 px-5 py-2.5 text-xs font-semibold text-amber-200 no-underline transition hover:bg-amber-500/20"
            >
              <span>Compare Full Tier Specifications</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <LandingFaqAccordion />

        <footer className="mt-12 flex flex-col items-center gap-4 border-t border-white/[0.08] pt-8 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-zinc-400">
            <span>NASM-CPT® Certified (#1261890687)</span>
            <span aria-hidden="true">·</span>
            <span>5-Phase NASM OPT™</span>
            <span aria-hidden="true">·</span>
            <span>ASTI CPR/AED Certified</span>
            <span aria-hidden="true">·</span>
            <span>TLS 1.3 &amp; AES-256 Protected</span>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center justify-center gap-5 text-xs text-zinc-300"
          >
            <Link href="/packages" className="inline-flex min-h-[44px] items-center text-inherit no-underline hover:text-amber-300">
              Pricing
            </Link>
            <Link href="/corporate" className="inline-flex min-h-[44px] items-center text-inherit no-underline hover:text-amber-300">
              Team Training
            </Link>
            <Link href="/audit" className="inline-flex min-h-[44px] items-center text-inherit no-underline hover:text-amber-300">
              Movement Screen
            </Link>
            <Link href="/apply" className="inline-flex min-h-[44px] items-center text-inherit no-underline hover:text-amber-300">
              Apply
            </Link>
            <Link href="/credentials" className="inline-flex min-h-[44px] items-center text-inherit no-underline hover:text-amber-300">
              Credentials
            </Link>
            <Link href="/apps" className="inline-flex min-h-[44px] items-center text-inherit no-underline hover:text-amber-300">
              PWA Guide
            </Link>
            <Link href="/privacy" className="inline-flex min-h-[44px] items-center text-inherit no-underline hover:text-amber-300">
              Privacy
            </Link>
            <Link href="/health-privacy" className="inline-flex min-h-[44px] items-center text-inherit no-underline hover:text-amber-300">
              Health Privacy
            </Link>
            <Link href="/terms" className="inline-flex min-h-[44px] items-center text-inherit no-underline hover:text-amber-300">
              Terms
            </Link>
            <Link href="/accessibility" className="inline-flex min-h-[44px] items-center text-inherit no-underline hover:text-amber-300">
              Accessibility
            </Link>
            <Link href="/coach" className="inline-flex min-h-[44px] items-center text-inherit no-underline hover:text-amber-300">
              Coach Portal
            </Link>
          </nav>

          <p className="max-w-2xl text-[11px] leading-relaxed text-zinc-500">
            <strong>Trademark &amp; Non-Affiliation Notice:</strong> NASM®, Optimum Performance
            Training™, OPT™, and Certified Personal Trainer (CPT®) are registered trademarks or
            service marks of the National Academy of Sports Medicine (NASM) and/or Ascend Learning,
            LLC. Forge Athletic Performance LLC is an independent private entity and is not
            affiliated with, sponsored by, or endorsed by NASM or Ascend Learning, LLC.
          </p>

          <div className="text-xs text-zinc-500">
            © {new Date().getFullYear()} Forge Athletic Performance LLC (MA ID #002010312). Built From The Ground Up. Precision Science For Real Lives.
          </div>
        </footer>
      </div>
    </div>
  )
}
