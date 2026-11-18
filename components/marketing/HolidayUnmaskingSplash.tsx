'use client'

import React, { useState, useEffect, useRef, useId } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ForgeIcon from '@/components/ui/ForgeIcon'
import AppSneakPeekShowcase from '@/components/marketing/AppSneakPeekShowcase'
import EverydayMomentsStrip from '@/components/marketing/EverydayMomentsStrip'
import CompleteFeatureEcosystem from '@/components/marketing/CompleteFeatureEcosystem'
import CoachAuthoritySection from '@/components/marketing/CoachAuthoritySection'
import LandingFaqAccordion from '@/components/marketing/LandingFaqAccordion'
import FoundingRateLockPricingGrid from '@/components/packages/FoundingRateLockPricingGrid'
import { useSfxMuted } from '@/lib/sfx-audio'
import {
  calculateTimeRemaining,
  getGoLiveDate,
  HOLIDAY_DEAL_PROMO,
  LAUNCH_CAMPAIGN_INFO,
  TimeRemaining,
} from '@/lib/launch-config'

const SHOWCASE_FILM_CHAPTERS = [
  { code: '01', label: 'Desk Posture & Ergonomics', timeSec: 0 },
  { code: '02', label: 'Joint-First Home Strength', timeSec: 2.5 },
  { code: '03', label: '20m Express & Hotel Travel', timeSec: 5.0 },
  { code: '04', label: 'Async Form Lab & Real Voice', timeSec: 8.2 },
  { code: '05', label: 'The Precision Sanctuary', timeSec: 10.7 },
] as const

const NAV_ANCHORS = [
  { href: '#sneak-peek', label: 'Sneak Peek' },
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#coach', label: 'Coach' },
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
  const [videoMuted, setVideoMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement | null>(null)
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
  const [activeChapterCode, setActiveChapterCode] = useState<string>('01')
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [copiedSerial, setCopiedSerial] = useState(false)

  // Global SFX Muted state (strictly defaults to SFX MUTED = true)
  const { sfxMuted, soundEnabled, toggleSfxMuted, playTone } = useSfxMuted()
  const [showSmsInput, setShowSmsInput] = useState(false)

  const mountTimeRef = useRef<number>(0)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const nameInputId = useId()
  const emailInputId = useId()
  const phoneInputId = useId()
  const goalSelectId = useId()
  const formErrorId = useId()

  useEffect(() => {
    setMounted(true)
    mountTimeRef.current = Date.now()
    const resolvedTarget = getGoLiveDate()
    setTargetDate(resolvedTarget)
    setTimeRemaining(calculateTimeRemaining(resolvedTarget))

    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(resolvedTarget))
    }, 1000)

    const reducedMotionQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null
    const syncVideoMotion = (prefersReduced: boolean) => {
      setPrefersReducedMotion(prefersReduced)
      const video = videoRef.current
      if (!video) return
      if (prefersReduced) {
        video.removeAttribute('autoplay')
        video.pause()
      }
    }
    if (reducedMotionQuery) {
      syncVideoMotion(reducedMotionQuery.matches)
    }
    const onMotionChange = (event: MediaQueryListEvent) => syncVideoMotion(event.matches)
    reducedMotionQuery?.addEventListener('change', onMotionChange)

    return () => {
      clearInterval(timer)
      reducedMotionQuery?.removeEventListener('change', onMotionChange)
    }
  }, [])

  const playTactileTone = (type: 'tick' | 'chime' | 'success') => {
    playTone(type)
  }

  // Subtle Ambient Constellation Canvas (respects prefers-reduced-motion)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    const nodeCount = Math.min(Math.floor(width / 36), 44)
    const particles = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.4 + 0.7,
      alpha: Math.random() * 0.45 + 0.18,
    }))

    let mouseX = -9999
    let mouseY = -9999

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        const dx = mouseX - p.x
        const dy = mouseY - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 130 && dist > 0) {
          const force = (130 - dist) / 130
          p.x -= (dx / dist) * force * 0.65
          p.y -= (dy / dist) * force * 0.65
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(245, 158, 11, ${p.alpha})`
        ctx.fill()

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dist2 = Math.hypot(p.x - p2.x, p.y - p2.y)
          if (dist2 < 115) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(245, 158, 11, ${(1 - dist2 / 115) * 0.1})`
            ctx.lineWidth = 0.75
            ctx.stroke()
          }
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
    }
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
      playTactileTone('tick')
      document.getElementById(nameInputId)?.focus()
      return
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus('error')
      setInvalidField('email')
      setErrorMessage('Please enter a valid email address.')
      playTactileTone('tick')
      document.getElementById(emailInputId)?.focus()
      return
    }

    if (showSmsInput && phone.trim() && !smsConsent) {
      setStatus('error')
      setErrorMessage(
        'Please check the optional SMS consent box to receive text alerts, or clear the mobile number field to register by email only.'
      )
      playTactileTone('tick')
      return
    }

    setStatus('submitting')
    playTactileTone('chime')

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
        playTactileTone('success')
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
  const formattedSerial = `FORGE-HOLIDAY-2026-${deterministicEmailRef}`

  const copyVipSerial = async () => {
    try {
      await navigator.clipboard.writeText(formattedSerial)
      setCopiedSerial(true)
      playTactileTone('chime')
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
        paddingBottom: 96,
      }}
    >
      {/* Background Constellation Canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.5,
        }}
      />

      {/* Subtle Atmospheric Radial Glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '-12%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90vw',
          maxWidth: 1200,
          height: 520,
          background:
            'radial-gradient(ellipse at top, rgba(16, 185, 129, 0.07) 0%, rgba(245, 158, 11, 0.07) 42%, transparent 68%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '20px 16px 0',
          position: 'relative',
          zIndex: 1,
        }}
        className="sm:px-6"
      >
        {/* Top Navigation Bar */}
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-5 sm:mb-8">
          <div className="flex items-center gap-3.5">
            <Link
              href="/"
              className="flex items-center gap-3 text-inherit no-underline"
            >
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-amber-400/35 shadow-[0_0_16px_rgba(245,158,11,0.2)]">
                <Image
                  src="/images/brand/forge-crest-mark.png"
                  alt="Forge Athletic Monogram"
                  fill
                  sizes="44px"
                  style={{ objectFit: 'cover' }}
                  priority
                />
              </div>
              <div>
                <div className="font-serif text-xl font-bold uppercase leading-none tracking-[0.04em] text-white sm:text-[22px]">
                  Forge Athletic
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-300/90">
                  Precision Science For Real Lives
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Smooth-Scroll Anchor Navigation + Audio & Auth Actions */}
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5">
            <nav
              aria-label="Primary landing page sections"
              className="mr-2 hidden items-center gap-4 text-xs font-semibold text-zinc-300 lg:flex"
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

            {/* Audio Toggle (Strictly defaults to SFX MUTED) */}
            <button
              type="button"
              onClick={toggleSfxMuted}
              aria-label="Sound effects"
              aria-pressed={soundEnabled}
              title={soundEnabled ? 'Audio feedback enabled' : 'Enable subtle audio feedback'}
              className="forge-tactile-press inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border px-3 py-2 font-mono text-[11px] transition-colors"
              style={{
                background: soundEnabled ? 'rgba(16, 185, 129, 0.12)' : '#181B22',
                borderColor: soundEnabled ? 'rgba(52, 211, 153, 0.35)' : 'rgba(255, 255, 255, 0.1)',
                color: soundEnabled ? '#6EE7B7' : '#A1A1AA',
              }}
            >
              <ForgeIcon name={soundEnabled ? 'flame' : 'lock'} size={13} />
              <span className="hidden sm:inline">{sfxMuted ? 'SFX MUTED' : 'SFX ON'}</span>
            </button>

            <Link
              href="/auth/login"
              className="forge-tactile-press inline-flex min-h-[44px] items-center rounded-xl border border-white/10 bg-[#181B22] px-3.5 py-2 text-xs font-medium text-zinc-200 no-underline transition-colors hover:border-white/20 sm:text-[13px]"
            >
              Member Sign In
            </Link>

            <Link
              href="/coach"
              className="forge-tactile-press inline-flex min-h-[44px] items-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 px-3.5 py-2 font-serif text-xs font-bold uppercase tracking-[0.05em] text-[#090A0D] no-underline shadow-[0_2px_12px_rgba(245,158,11,0.28)] sm:px-4 sm:text-[13px]"
            >
              Coach Portal
            </Link>
          </div>
        </header>

        {/* Mobile / Tablet Smooth-Scroll Anchor Strip (375px–1023px viewports) */}
        <nav
          aria-label="Mobile section navigation"
          className="mb-6 flex items-center gap-1.5 overflow-x-auto rounded-xl border border-white/[0.08] bg-[#111318] px-2.5 py-1 text-xs font-semibold text-zinc-300 lg:hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {NAV_ANCHORS.map(anchor => (
            <a
              key={anchor.href}
              href={anchor.href}
              className="inline-flex min-h-[44px] shrink-0 items-center px-2 text-zinc-300 no-underline transition-colors hover:text-amber-300"
            >
              {anchor.label}
            </a>
          ))}
        </nav>

        {/* Preview Banner if explicitly previewing */}
        {previewMode && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-400/35 bg-sky-500/10 px-4 py-2.5 font-mono text-xs text-sky-300">
            <div className="flex items-center gap-2">
              <ForgeIcon name="crosshair" size={15} />
              <span>
                <strong>PREVIEW MODE:</strong> Pre-launch Founding Cohort experience. Site opens automatically on{' '}
                {LAUNCH_CAMPAIGN_INFO.dateFormatted}.
              </span>
            </div>
            <Link href="/?unmasked=true" className="font-semibold text-white underline">
              View Live Mode &rarr;
            </Link>
          </div>
        )}

        {/* 1. HERO SECTION (Outcome-First & Grounded) */}
        <section
          aria-labelledby="hero-headline"
          className="mx-auto mb-16 max-w-[1160px]"
        >
          <div className="mx-auto max-w-4xl text-center">
            {/* Eyebrow Badge */}
            <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-amber-400/40 bg-[#111318] px-4 py-2 shadow-[0_4px_20px_rgba(245,158,11,0.12)]">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-200 sm:text-xs">
                FOUNDING COHORT (50 SPOTS) · OPENS MONDAY, JAN 4, 2027 AT 6:00 AM EST
              </span>
            </div>

            {/* Main Headline */}
            <h1
              id="hero-headline"
              style={{
                fontSize: 'clamp(2.15rem, 1.35rem + 3.4vw, 4.25rem)',
                lineHeight: 1.04,
                textWrap: 'balance',
              }}
              className="mx-auto font-serif font-extrabold tracking-tight text-white"
            >
              Start 2027 with joint-first precision—not a 3-week resolution.
            </h1>

            {/* Subheadline */}
            <p
              style={{
                fontSize: 'clamp(1rem, 0.92rem + 0.45vw, 1.22rem)',
                lineHeight: 1.6,
                textWrap: 'pretty',
              }}
              className="mx-auto mt-5 max-w-3xl text-zinc-300"
            >
              A real NASM-certified personal trainer at your side—combining 33-point phone camera
              posture screening, Coach Gordon’s real voice pacing every rep, and direct email or
              text access whenever you want human eyes on your training.
            </p>

            {/* Primary Jump CTA + Secondary Sneak Peek Link */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={scrollToReservationForm}
                className="forge-tactile-press inline-flex min-h-[50px] items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 px-6 py-3.5 font-serif text-base font-extrabold tracking-wide text-[#090A0D] shadow-[0_8px_28px_rgba(245,158,11,0.3)] transition hover:brightness-105 sm:px-7 sm:text-lg"
              >
                Claim Your Founding Member Pass →
              </button>
              <a
                href="#sneak-peek"
                className="forge-tactile-press inline-flex min-h-[50px] items-center justify-center rounded-xl border border-white/15 bg-[#111318] px-5 py-3.5 text-sm font-semibold text-zinc-200 no-underline transition hover:border-amber-400/40 hover:text-white"
              >
                Explore Interactive App Preview
              </a>
            </div>

            {/* Trust Micro-Copy Beneath CTA */}
            <p
              style={{ textWrap: 'pretty' }}
              className="mx-auto mt-4 max-w-2xl text-xs leading-relaxed text-zinc-400 sm:text-[13px]"
            >
              Includes your Founding Member Continuous Tier Rate Lock, a complimentary 1-on-1
              kickoff movement screening with Coach Gordon, and 1 free 30-day Founding
              Partner Pass to gift a spouse or friend.
            </p>
          </div>

          {/* Countdown Clock HUD */}
          <div
            className="mx-auto mt-9 max-w-3xl rounded-2xl border border-white/[0.08] bg-[#111318] p-4 sm:p-6"
            style={{
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 20px 48px rgba(0, 0, 0, 0.55)',
            }}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] pb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-400">
              <div className="flex items-center gap-2">
                <ForgeIcon name="clock" size={15} style={{ color: '#34D399' }} />
                <span>Founding Cohort Opening Countdown</span>
              </div>
              <div className="font-semibold tabular-nums text-amber-300">
                Monday, Jan 4, 2027 · 6:00 AM EST
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[
                { label: 'DAYS', value: timeRemaining.days },
                { label: 'HOURS', value: timeRemaining.hours },
                { label: 'MINUTES', value: timeRemaining.minutes },
                { label: 'SECONDS', value: timeRemaining.seconds },
              ].map((unit, idx) => (
                <div
                  key={unit.label}
                  className="rounded-xl border border-white/[0.08] bg-[#181B22] px-2 py-3.5 text-center sm:py-4"
                  style={{ boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)' }}
                >
                  <div
                    className={`font-mono font-extrabold leading-none tabular-nums ${
                      idx === 3 ? 'text-emerald-400' : 'text-white'
                    }`}
                    style={{ fontSize: 'clamp(1.5rem, 1rem + 2.4vw, 2.75rem)' }}
                  >
                    {mounted ? String(unit.value).padStart(2, '0') : '--'}
                  </div>
                  <div className="mt-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                    {unit.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Two-Column Hero Lower Deck: Founding Pass Form + Product Film */}
          <div
            ref={reservationSectionRef}
            className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-12"
          >
            {/* LEFT (5 cols): Founding Member Pass Reservation Form */}
            <div
              className="rounded-2xl border border-amber-400/30 bg-[#111318] p-5 sm:p-7 lg:col-span-5"
              style={{
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 20px 48px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Cohort Registration Header */}
              <div className="mb-5 flex items-center justify-between gap-2 rounded-xl border border-amber-400/25 bg-amber-500/[0.08] px-3.5 py-2">
                <div className="flex items-center gap-2">
                  <ForgeIcon name="crown" size={15} style={{ color: '#F59E0B' }} />
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-300">
                    Founding Launch Registration
                  </span>
                </div>
                <span className="font-mono text-xs font-bold tabular-nums text-emerald-400">
                  Open · Code {HOLIDAY_DEAL_PROMO.code}
                </span>
              </div>

              {status !== 'success' ? (
                <>
                  <h2 className="font-serif text-2xl font-bold tracking-tight text-white">
                    Reserve Your Founding Member Pass
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
                    No payment today. Register ahead of Monday, Jan 4 to receive your{' '}
                    {HOLIDAY_DEAL_PROMO.code} 25% Rate Lock code and private kickoff
                    screening link from Coach Gordon.
                  </p>

                  <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
                    {/* Honeypot field */}
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
                        className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-300"
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
                        className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-300"
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
                        className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-300"
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
                          Posture, Spine &amp; Joint Comfort (Desk &amp; Daily Life)
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

                    {/* Form Friction Guardrail: Collapsed Optional SMS Launch Alert */}
                    <div>
                      <button
                        type="button"
                        aria-expanded={showSmsInput}
                        onClick={() => setShowSmsInput(prev => !prev)}
                        className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-amber-300 underline-offset-4 hover:underline"
                      >
                        <span>
                          {showSmsInput
                            ? '− Hide SMS launch alert'
                            : '+ Add SMS launch alert (optional)'}
                        </span>
                      </button>

                      {showSmsInput ? (
                        <div className="mt-1.5 space-y-2.5">
                          <div>
                            <label
                              htmlFor={phoneInputId}
                              className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.1em] text-zinc-400"
                            >
                              Mobile Number (Optional Launch &amp; Account SMS)
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
                              <strong>Consent is not a condition of purchase.</strong> Msg &amp; data rates may apply. Msg
                              frequency varies. Reply <strong>STOP</strong> to cancel, <strong>HELP</strong> for help. View{' '}
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

                    <p className="text-xs leading-relaxed text-zinc-400">
                      Includes your 25% Founding Rate Lock (valid while continuously enrolled on
                      your selected tier), a complimentary 1-on-1 movement screening with Coach
                      Gordon, and 1 free 30-day Founding Partner Pass to gift a spouse or friend.
                    </p>
                  </form>
                </>
              ) : (
                /* Minted Founding Member Pass Confirmation */
                <div className="text-center">
                  <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                    ✓ Founding Reservation Confirmed
                  </div>

                  <h3 className="font-serif text-2xl font-bold text-white">
                    Welcome to the Founding Cohort, {fullName.split(' ')[0]}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                    Your Founding Member Pass and kickoff movement screening invitation have
                    been sent to <strong>{email}</strong>.
                  </p>

                  <div className="forge-metallic-pass relative my-5 overflow-hidden rounded-2xl p-5 text-left">
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-400"
                    />
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 overflow-hidden rounded-lg border border-amber-400/50">
                          <Image
                            src="/images/brand/forge-crest-mark.png"
                            alt=""
                            width={32}
                            height={32}
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                        <div>
                          <div className="font-serif text-sm font-bold uppercase tracking-wider text-white">
                            Forge Athletic
                          </div>
                          <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-amber-300">
                            Founding Cohort Pass
                          </div>
                        </div>
                      </div>
                      <span className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-1 font-mono text-[11px] text-amber-300">
                        VERIFIED PASS
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                        Pass Holder
                      </div>
                      <div className="text-base font-bold text-white">{fullName}</div>
                    </div>

                    <div className="flex flex-wrap items-end justify-between gap-2 border-t border-white/10 pt-3">
                      <div>
                        <div className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                          Credential Serial
                        </div>
                        <div className="font-mono text-xs font-semibold text-sky-300">
                          {formattedSerial}
                        </div>
                      </div>
                      <div className="font-mono text-[10px] font-semibold text-emerald-300">
                        ● 25% Rate Lock ({HOLIDAY_DEAL_PROMO.code})
                      </div>
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

            {/* RIGHT (7 cols): Product Film Stage */}
            <div className="overflow-hidden rounded-2xl border border-white/12 bg-[#0B0E14] shadow-2xl lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] bg-[#111318] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-200">
                    Forge Athletic · Product Walkthrough Film
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextMuted = !videoMuted
                    setVideoMuted(nextMuted)
                    if (videoRef.current) {
                      videoRef.current.muted = nextMuted
                      if (!nextMuted) {
                        videoRef.current.play().catch(() => {})
                      }
                    }
                  }}
                  aria-label={videoMuted ? 'Unmute showcase video audio' : 'Mute showcase video audio'}
                  className="forge-tactile-press inline-flex min-h-[44px] items-center rounded-lg border border-amber-400/45 bg-amber-500/15 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-200"
                >
                  {videoMuted ? 'Unmute Audio' : 'Audio On'}
                </button>
              </div>

              {/* 16:9 Cinema Video Viewport (Explicit aspect-ratio prevents CLS) */}
              <div
                style={{ aspectRatio: '16 / 9' }}
                className="relative w-full overflow-hidden bg-[#05080D]"
              >
                <video
                  ref={videoRef}
                  autoPlay={!prefersReducedMotion}
                  loop
                  muted={videoMuted}
                  playsInline
                  width={1280}
                  height={720}
                  preload="metadata"
                  poster="/images/forge-black-friday-showcase-poster.jpg"
                  aria-label="Forge Athletic ecosystem walkthrough video"
                  className="block h-full w-full object-cover"
                >
                  <source src="/videos/forge-black-friday-showcase.mp4" type="video/mp4" />
                  <track
                    kind="captions"
                    src="/captions/forge-showcase.vtt"
                    srcLang="en"
                    label="English captions"
                  />
                </video>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#090A0D]/95 via-[#090A0D]/60 to-transparent px-4 pb-3.5 pt-10">
                  <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-300">
                    Camera Diagnostics · Real Voice Pacing · Direct Coaching
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-200 sm:text-sm">
                    33-point posture scans, 5-minute desk resets, 20-minute express workouts, and
                    async Form Lab video coaching.
                  </p>
                </div>
              </div>

              {/* 5-Chapter Film Scrubber */}
              <div className="grid grid-cols-1 gap-1.5 border-t border-white/[0.08] bg-[#111318] p-3 sm:grid-cols-2 xl:grid-cols-3">
                {SHOWCASE_FILM_CHAPTERS.map(ch => {
                  const isActiveChapter = activeChapterCode === ch.code
                  return (
                    <button
                      key={ch.code}
                      type="button"
                      aria-pressed={isActiveChapter}
                      onClick={() => {
                        setActiveChapterCode(ch.code)
                        if (videoRef.current) {
                          videoRef.current.currentTime = ch.timeSec
                          videoRef.current.play().catch(() => {})
                        }
                        playTactileTone('tick')
                      }}
                      className={`forge-tactile-press flex min-h-[44px] items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition ${
                        isActiveChapter
                          ? 'border-amber-400/50 bg-amber-500/15'
                          : 'border-white/[0.08] bg-[#181B22] hover:border-amber-400/40'
                      }`}
                    >
                      <span className="rounded bg-amber-400 px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-[#090A0D]">
                        {ch.code}
                      </span>
                      <span className="truncate font-mono text-[11px] font-medium text-zinc-200">
                        {ch.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 2. INTERACTIVE 4-TAB SNEAK PEEK SHOWCASE (#sneak-peek) */}
        <AppSneakPeekShowcase />

        {/* 3. "A REAL TRAINER AT YOUR SIDE" — EVERYDAY MOMENTS STRIP (#how-it-works) */}
        <EverydayMomentsStrip />

        {/* 4. COMPLETE FEATURE ECOSYSTEM ("EVERYTHING INSIDE YOUR MEMBERSHIP", #features) */}
        <CompleteFeatureEcosystem />

        {/* 5. HUMAN AUTHORITY & EVERYDAY SOCIAL PROOF (#coach) */}
        <CoachAuthoritySection />

        {/* 6. STREAMLINED 3-TIER PRICING MATRIX (#pricing) */}
        <section
          id="pricing"
          aria-labelledby="founding-pricing-heading"
          className="mx-auto my-16 max-w-[1160px] scroll-mt-24 rounded-2xl border border-amber-400/25 bg-[#0E131D] p-5 sm:p-8"
          style={{
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 24px 60px rgba(0, 0, 0, 0.55)',
          }}
        >
          <div className="mx-auto mb-8 max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-amber-500/10 px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300">
              Founding Member Lifetime Rate Lock
            </span>
            <h2
              id="founding-pricing-heading"
              style={{ textWrap: 'balance' }}
              className="mt-3.5 font-serif text-2xl font-extrabold tracking-tight text-white sm:text-4xl"
            >
              Permanent Pre-Launch Pricing Across Three Clear Tiers
            </h2>
            <p className="mx-auto mt-2.5 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
              Founding Cohort members lock in pre-launch monthly rates for as long as continuous
              active enrollment on their selected tier is maintained, alongside a complimentary
              kickoff movement screening and 1 free 30-day Founding Partner Pass.
            </p>
          </div>

          <FoundingRateLockPricingGrid
            mode="prelaunch"
            onPrelaunchClaimClick={scrollToReservationForm}
          />

          <div className="mt-7 text-center">
            <Link
              href="/packages"
              className="forge-tactile-press inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/10 px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-amber-200 no-underline transition hover:bg-amber-500/20"
            >
              <span>Compare Full Tier Specifications</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        {/* BRAND PHILOSOPHY: The Precision Training Sanctuary */}
        <section
          aria-labelledby="manifesto-title"
          className="mx-auto my-16 max-w-[1160px] rounded-2xl border border-white/10 bg-[#111318] p-6 sm:p-9"
          style={{
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 20px 48px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div className="mx-auto mb-8 max-w-3xl text-center">
            <div className="mb-3 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-amber-200">
              <span>CLINICAL SPORTS SCIENCE</span>
              <span>·</span>
              <span>CALM CONSISTENCY</span>
              <span>·</span>
              <span>HUMAN STEWARDSHIP</span>
            </div>
            <h2
              id="manifesto-title"
              style={{ textWrap: 'balance' }}
              className="font-serif text-2xl font-extrabold tracking-tight text-white sm:text-4xl"
            >
              The Precision Training Sanctuary
            </h2>
            <p className="mx-auto mt-2.5 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
              Built around NASM Virtual Coaching standards, Forge Athletic focuses on two things
              alone: practical biomechanics tools and attentive human coaching—without noisy social
              feeds, leaderboards, or fitness-industry hype.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-white/[0.08] bg-[#181B22] p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/35 bg-amber-500/10 text-amber-300">
                <ForgeIcon name="lock" size={18} />
              </div>
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-300">
                Calm Focus
              </div>
              <h3 className="mt-1 font-serif text-lg font-bold text-white">
                Uninterrupted Flow State
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-300 sm:text-sm">
                Hands-free voice tempo cues and quiet rest pacing keep your phone propped across the
                room so you can focus on clean reps and steady breathing.
              </p>
            </div>

            <div className="rounded-xl border border-amber-400/25 bg-[#181B22] p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/35 bg-amber-500/15 text-amber-300">
                <ForgeIcon name="zap" size={18} />
              </div>
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-300">
                Hybrid Craft
              </div>
              <h3 className="mt-1 font-serif text-lg font-bold text-white">
                Best Tools × Best Coaching
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-300 sm:text-sm">
                Browser-based 33-point MediaPipe tracking handles live posture angles and daily
                readiness checks locally on your device, while Coach Gordon oversees Form Lab
                reviews, safety alerts, and progression.
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#181B22] p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-400/35 bg-emerald-500/10 text-emerald-300">
                <ForgeIcon name="target" size={18} />
              </div>
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
                Measured Progress
              </div>
              <h3 className="mt-1 font-serif text-lg font-bold text-white">
                Results-Driven Flywheel
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-300 sm:text-sm">
                Degree-by-degree posture improvements, comfortable joints, and steady 5-Phase OPT™
                milestones compound week after week—at home or on the road.
              </p>
            </div>
          </div>
        </section>

        {/* 7. UPDATED FAQ ACCORDION (#faq) */}
        <LandingFaqAccordion />

        {/* Bottom Accreditation & Trust Footer */}
        <footer className="mt-12 flex flex-col items-center gap-4 border-t border-white/[0.08] pt-8 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[11px] text-zinc-400">
            <span>NASM-CPT® CERTIFIED (#1261890687)</span>
            <span aria-hidden="true">·</span>
            <span>5-PHASE NASM OPT™ ARCHITECTURE</span>
            <span aria-hidden="true">·</span>
            <span>ASTI CPR/AED CERTIFIED</span>
            <span aria-hidden="true">·</span>
            <span>TLS 1.3 &amp; AES-256 PROTECTED</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-zinc-300">
            <Link href="/credentials" className="inline-flex min-h-[44px] items-center text-inherit no-underline hover:text-amber-300">
              Credentials
            </Link>
            <Link href="/packages" className="inline-flex min-h-[44px] items-center text-inherit no-underline hover:text-amber-300">
              Packages
            </Link>
            <Link href="/privacy" className="inline-flex min-h-[44px] items-center text-inherit no-underline hover:text-amber-300">
              Privacy Policy
            </Link>
            <Link href="/health-privacy" className="inline-flex min-h-[44px] items-center text-inherit no-underline hover:text-amber-300">
              Consumer Health Data Privacy
            </Link>
            <Link href="/terms" className="inline-flex min-h-[44px] items-center text-inherit no-underline hover:text-amber-300">
              Terms of Service
            </Link>
            <Link href="/auth/login" className="inline-flex min-h-[44px] items-center text-inherit no-underline hover:text-amber-300">
              Member Sign In
            </Link>
          </div>

          <div className="font-mono text-[11px] text-zinc-500">
            © {new Date().getFullYear()} Forge Athletic. Built From The Ground Up. Precision Science For Real Lives.
          </div>
        </footer>
      </div>
    </div>
  )
}
