'use client'

import React, { useState, useEffect, useRef, useId } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ForgeIcon, { ForgeIconName } from '@/components/ui/ForgeIcon'
import AppSneakPeekShowcase from '@/components/marketing/AppSneakPeekShowcase'
import ClientOutcomesShowcase from '@/components/marketing/ClientOutcomesShowcase'
import FoundingRateLockPricingGrid from '@/components/packages/FoundingRateLockPricingGrid'
import { COACH_GORDON_TRUST_PROFILE } from '@/lib/landingSocialProof'
import { useSfxMuted } from '@/lib/sfx-audio'
import {
  calculateTimeRemaining,
  getGoLiveDate,
  HOLIDAY_DEAL_PROMO,
  LAUNCH_CAMPAIGN_INFO,
  TimeRemaining,
} from '@/lib/launch-config'

const SNEAK_PEEKS: Array<{
  id: string
  tag: string
  title: string
  icon: ForgeIconName
  subtitle: string
  bullets: string[]
  metric: string
  metricLabel: string
}> = [
    {
      id: 'opt-engine',
      tag: 'Phase 01–05 Architecture',
      title: 'The Biomechanical OPT™ Engine',
      icon: 'periodization',
      subtitle: 'Collegiate-grade NASM periodization adapted dynamically to your daily joint kinematics.',
      bullets: [
        'Five-phase progression: Stabilization Endurance through Maximum Power',
        'Continuous kinetic chain screening detecting hip, knee, and shoulder compensations',
        'Real-time load and RPE autoregulation tailored to your recovery state',
      ],
      metric: '5 PHASES',
      metricLabel: 'Periodized Science',
    },
    {
      id: 'ai-telemetry',
      tag: 'Autonomous Vision & Tracking',
      title: 'Gordon AI Movement Telemetry',
      icon: 'activity',
      subtitle: 'Asynchronous video analysis and bar velocity telemetry with zero wearable friction.',
      bullets: [
        'Frame-by-frame bar path tracking and concentric velocity profiling',
        'Joint angle trajectory diagnostics comparing against gold-standard biomechanics',
        'Voice-guided live workout copilot providing tempo cadence and form cues',
      ],
      metric: '< 180ms',
      metricLabel: 'Telemetry Latency',
    },
    {
      id: 'metabolic-recovery',
      tag: 'Real Life & Schedule Fit',
      title: 'Metabolic Health & Sleep Recovery',
      icon: 'moon',
      subtitle: 'Engineered for busy workdays, family schedules, and holiday commitments.',
      bullets: [
        'Simple metabolic primer routines to stay energized and burn fuel efficiently during holiday meals',
        'Circadian rhythm and sleep recovery protocols to wake up refreshed without caffeine crashes',
        'Active-rest cardio pacing to clear fatigue without wrecking joints or overtraining',
      ],
      metric: '100% PRACTICAL',
      metricLabel: 'Schedule & Routine Fit',
    },
    {
      id: 'live-studio',
      tag: '1-on-1 Personalized Coaching',
      title: 'Private Coach Gordon Live Studio',
      icon: 'crosshair',
      subtitle: 'Encrypted sub-100ms WebRTC interactive video coaching sessions directly into your home gym or workout space.',
      bullets: [
        'Zero commute friction: train live from home, apartment gym, or hotel with Coach Gordon in real time',
        'Dual-camera multi-angle form validation with instantaneous slow-motion replays and telestration',
        'Real-time biometric HUD and corrective cues from Coach Gordon (18+ years experience, NASM-CPT since 2008)',
        'Strictly limited seat roster: Dedicated booking reserved exclusively for nights and weekends',
      ],
      metric: '1-ON-1',
      metricLabel: 'Nights & Weekends · Limited Seats',
    },
  ]

const FOUNDING_PERKS = [
  {
    icon: 'crown' as ForgeIconName,
    title: '25% Lifetime Rate Lock',
    description: 'Founding Members permanently lock in 25% off any membership tier (Code: HOLIDAY25) for the entire lifetime of their membership.',
  },
  {
    icon: 'assessment' as ForgeIconName,
    title: 'Free 60-Min Pre-Holiday Screening',
    description: 'Complimentary 60-minute remote movement diagnostic and 3D kinetic audit with Coach Gordon before Thanksgiving.',
  },
  {
    icon: 'zap' as ForgeIconName,
    title: 'Tier 1 Priority Beta',
    description: 'Immediate first-day access on Black Friday, November 27 to the complete Forge web and native mobile coaching suite.',
  },
  {
    icon: 'ticket' as ForgeIconName,
    title: 'Founding Partner Pass',
    description: 'Complimentary 30-day guest invitation pass to gift to a family member, friend, or workout partner.',
  },
]

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
  const [activePeekIndex, setActivePeekIndex] = useState(0)
  const [videoMuted, setVideoMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const reservationSectionRef = useRef<HTMLDivElement | null>(null)

  // Form State
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [primaryGoal, setPrimaryGoal] = useState('posture_joint_health')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [assignedPassNumber, setAssignedPassNumber] = useState<number>(42)
  const [copiedSerial, setCopiedSerial] = useState(false)

  // Global SFX Muted state (strictly defaults to SFX MUTED = true)
  const { sfxMuted, soundEnabled, toggleSfxMuted, playTone } = useSfxMuted()
  const [showSmsInput, setShowSmsInput] = useState(false)
  const [portraitLoadFailed, setPortraitLoadFailed] = useState(false)

  const mountTimeRef = useRef<number>(0)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const nameInputId = useId()
  const emailInputId = useId()
  const phoneInputId = useId()
  const goalSelectId = useId()

  useEffect(() => {
    setMounted(true)
    mountTimeRef.current = Date.now()
    const resolvedTarget = getGoLiveDate()
    setTargetDate(resolvedTarget)
    setTimeRemaining(calculateTimeRemaining(resolvedTarget))

    // Assign randomized cohort serial between 14 and 49
    setAssignedPassNumber(Math.floor(Math.random() * 36) + 14)

    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(resolvedTarget))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const playTactileTone = (type: 'tick' | 'chime' | 'success') => {
    playTone(type)
  }

  // Interactive Kinetic Spark Canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Respect reduced motion
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

    // Generate constellation nodes
    const nodeCount = Math.min(Math.floor(width / 32), 48)
    const particles = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.5 + 0.8,
      alpha: Math.random() * 0.5 + 0.2,
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

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy

        // Wrap around boundaries
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        // Mouse subtle interaction
        const dx = mouseX - p.x
        const dy = mouseY - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 140) {
          const force = (140 - dist) / 140
          p.x -= (dx / dist) * force * 0.8
          p.y -= (dy / dist) * force * 0.8
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(245, 158, 11, ${p.alpha})`
        ctx.fill()

        // Connect nearby nodes
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dist2 = Math.hypot(p.x - p2.x, p.y - p2.y)
          if (dist2 < 120) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(245, 158, 11, ${(1 - dist2 / 120) * 0.12})`
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus('error')
      setErrorMessage('Please enter a valid email address.')
      playTactileTone('tick')
      return
    }

    if (!fullName.trim()) {
      setStatus('error')
      setErrorMessage('Please enter your full name.')
      playTactileTone('tick')
      return
    }

    setStatus('submitting')
    playTactileTone('chime')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          firstName: fullName.trim(),
          trainingLevel: 'intermediate',
          primaryGoal: `[Holiday Unmasking Drop] Goal: ${primaryGoal} | Phone: ${phone || 'N/A'}`,
          source: 'holiday_unmasking_drop',
          assignedCohortNumber: assignedPassNumber,
          phone: phone.trim() || undefined,
          profileType: primaryGoal,
          honeypot,
          startTimeMs: mountTimeRef.current,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setStatus('success')
        playTactileTone('success')
      } else {
        setStatus('error')
        setErrorMessage(data?.error || 'Unable to register your reservation. Please try again.')
      }
    } catch {
      setStatus('error')
      setErrorMessage('Network connection error. Please try again.')
    }
  }

  const copyVipSerial = async () => {
    const serial = `FORGE-HOLIDAY-2026-${String(assignedPassNumber).padStart(4, '0')}`
    try {
      await navigator.clipboard.writeText(serial)
      setCopiedSerial(true)
      playTactileTone('chime')
      setTimeout(() => setCopiedSerial(false), 2500)
    } catch {
      // Fallback
    }
  }

  const formattedSerial = `FORGE-HOLIDAY-2026-${String(assignedPassNumber).padStart(4, '0')}`

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
      {/* Background Interactive Constellation Canvas */}
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
          opacity: 0.55,
        }}
      />

      {/* Atmospheric Radial Glows */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '-12%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90vw',
          maxWidth: 1200,
          height: 560,
          background: 'radial-gradient(ellipse at top, rgba(16, 185, 129, 0.08) 0%, rgba(245, 158, 11, 0.08) 42%, transparent 68%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: 1160,
          margin: '0 auto',
          padding: '24px 20px 0',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Top Navigation Bar */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 24,
            marginBottom: 36,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  boxShadow: '0 0 16px rgba(245, 158, 11, 0.25)',
                }}
              >
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
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    lineHeight: 1.1,
                    textTransform: 'uppercase',
                  }}
                >
                  Forge Athletic
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-telemetry)',
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    color: '#C5A059',
                    textTransform: 'uppercase',
                  }}
                >
                  Precision Science For Real Lives
                </div>
              </div>
            </Link>
            <div
              style={{
                display: 'none',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 9999,
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                fontSize: 11,
                fontFamily: 'var(--font-telemetry)',
                color: '#FBBF24',
                letterSpacing: '0.08em',
              }}
              className="lg:flex"
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: '#34D399',
                  boxShadow: '0 0 8px #34D399',
                }}
              />
              FOUNDING SPOTS OPEN
            </div>
          </div>

          {/* Smooth-Scroll Anchor Navigation + Audio & Auth Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <nav
              aria-label="Primary landing page sections"
              className="hidden items-center gap-4 text-xs font-semibold text-slate-300 md:flex"
            >
              <a href="#sneak-peek" className="transition hover:text-amber-300">
                Sneak Peek
              </a>
              <a href="#how-it-works" className="transition hover:text-amber-300">
                How It Works
              </a>
              <a href="#coach" className="transition hover:text-amber-300">
                Coach
              </a>
              <a href="#pricing" className="transition hover:text-amber-300">
                Pricing
              </a>
            </nav>

            {/* Audio Toggle (Strictly defaults to SFX MUTED) */}
            <button
              type="button"
              onClick={toggleSfxMuted}
              aria-label="Sound effects"
              aria-pressed={soundEnabled}
              title={soundEnabled ? 'Audio feedback enabled' : 'Click to enable audio feedback'}
              className="forge-tactile-press"
              style={{
                minHeight: 44,
                minWidth: 44,
                background: soundEnabled ? 'rgba(16, 185, 129, 0.12)' : '#181B22',
                border: soundEnabled
                  ? '1px solid rgba(52, 211, 153, 0.35)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                color: soundEnabled ? '#6EE7B7' : '#A1A1AA',
                borderRadius: 12,
                padding: '10px 14px',
                fontSize: 12,
                fontFamily: 'var(--font-telemetry)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background-color 0.15s ease, border-color 0.15s ease',
              }}
            >
              <ForgeIcon name={soundEnabled ? 'flame' : 'lock'} size={14} />
              <span>{sfxMuted ? 'SFX MUTED' : 'SFX ON'}</span>
            </button>

            {/* Direct Member Entrance */}
            <Link
              href="/auth/login"
              className="forge-tactile-press"
              style={{
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: '#E4E4E7',
                fontSize: 13,
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                padding: '10px 15px',
                borderRadius: 12,
                background: '#181B22',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'background-color 0.15s ease, border-color 0.15s ease',
              }}
            >
              Member Sign In
            </Link>

            {/* Coach Portal Link */}
            <Link
              href="/coach"
              className="forge-tactile-press"
              style={{
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: '#090A0D',
                fontSize: 13,
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                padding: '10px 16px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                boxShadow: '0 2px 12px rgba(245, 158, 11, 0.3)',
              }}
            >
              Coach Portal
            </Link>
          </div>
        </header>

        {/* Mobile Smooth-Scroll Anchor Strip (375px / 430px viewports) */}
        <nav
          aria-label="Mobile section navigation"
          className="mb-6 flex items-center justify-between gap-2 overflow-x-auto rounded-xl border border-white/[0.08] bg-[#111318] px-3 py-1.5 text-xs font-semibold text-zinc-300 md:hidden"
        >
          <a href="#sneak-peek" className="inline-flex min-h-[44px] shrink-0 items-center px-1.5 hover:text-emerald-300">
            Sneak Peek
          </a>
          <a href="#how-it-works" className="inline-flex min-h-[44px] shrink-0 items-center px-1.5 hover:text-emerald-300">
            How It Works
          </a>
          <a href="#coach" className="inline-flex min-h-[44px] shrink-0 items-center px-1.5 hover:text-emerald-300">
            Coach
          </a>
          <a href="#pricing" className="inline-flex min-h-[44px] shrink-0 items-center px-1.5 hover:text-emerald-300">
            Pricing
          </a>
        </nav>

        {/* Preview Banner if explicitly previewing */}
        {previewMode && (
          <div
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38BDF8',
              fontSize: 12,
              fontFamily: 'var(--font-telemetry)',
              marginBottom: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ForgeIcon name="crosshair" size={16} />
              <span>
                <strong>PREVIEW MODE ACTIVE:</strong> Visitors currently see this Parked Unmasking Splash Page. Full site unmasks automatically on {LAUNCH_CAMPAIGN_INFO.dateFormatted}.
              </span>
            </div>
            <Link
              href="/?unmasked=true"
              style={{
                color: '#F8FAFC',
                textDecoration: 'underline',
                fontWeight: 600,
              }}
            >
              Force View Full Site &rarr;
            </Link>
          </div>
        )}

        {/* HERO SECTION: The Holiday Pre-Launch Unmasking */}
        <section
          style={{
            textAlign: 'center',
            maxWidth: 880,
            margin: '0 auto 48px',
            position: 'relative',
          }}
          aria-labelledby="unmasking-title"
        >
          {/* Eyebrow Beacon */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 9999,
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.15)',
              marginBottom: 24,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#F59E0B',
                boxShadow: '0 0 10px #F59E0B',
                animation: 'pulse 2s infinite',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-telemetry)',
                fontSize: 11,
                letterSpacing: '0.16em',
                color: '#FDE68A',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              EARLY ACCESS // BLACK FRIDAY UNMASKING EVENT
            </span>
          </div>

          {/* Main Title */}
          <h1
            id="unmasking-title"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.75rem, 7vw, 5.5rem)',
              fontWeight: 800,
              letterSpacing: '0.02em',
              lineHeight: 0.95,
              textTransform: 'uppercase',
              margin: '0 0 20px',
              background: 'linear-gradient(180deg, #FFFFFF 20%, #E2E8F0 60%, #94A3B8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            THE UNMASKING
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.25rem, 3vw, 1.85rem)',
              color: '#FBBF24',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              margin: '0 0 12px',
              fontWeight: 700,
            }}
          >
            Pain-Free Joints, Desk Posture Relief &amp; 20-Minute Home Workouts
          </p>

          <p
            style={{
              fontFamily: 'var(--font-telemetry)',
              fontSize: 12,
              color: '#E2E8F0',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: '0 0 16px',
            }}
          >
            Precision Science. Unbreakable Bodies. · Launch: Friday, November 20, 2026 · 06:00 AM EST
          </p>

          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.15rem)',
              lineHeight: 1.6,
              color: '#94A3B8',
              margin: '0 auto 18px',
              maxWidth: 720,
            }}
          >
            <strong>Don’t wait for January to repair what November broke.</strong> Undo desk neck and lower-back stiffness in 5 minutes, build real strength at home or in hotel gyms in 20 minutes, and lock in permanent <strong>Founding Member Lifetime Rate Lock</strong> pricing plus a <strong>Free 60-Min Pre-Holiday Movement Screen</strong> with Coach Gordon ahead of our <strong>Friday, November 20, 2026 · 06:00 AM EST</strong> launch.
          </p>

          {/* Collapsible "How the Science Works" Accordion (Plain-English First, Deep NASM Science On Demand) */}
          <details
            className="forge-science-accordion mx-auto mb-7 max-w-2xl rounded-xl border border-white/15 bg-slate-950/75 text-left"
          >
            <summary className="flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-wider text-amber-300">
              <span>How the Science Works (NASM OPT™ &amp; 33-Point Vision)</span>
              <span aria-hidden="true" className="text-slate-400">+</span>
            </summary>
            <div className="space-y-2 border-t border-white/10 px-4 py-3.5 text-xs leading-relaxed text-slate-300">
              <p>
                <strong>33-Point Computer-Vision Screening:</strong> Using your phone or laptop camera locally, Forge measures craniovertebral head angle, shoulder protraction, hip depth, and knee tracking so tightness is addressed before heavy loading.
              </p>
              <p>
                <strong>5-Phase NASM OPT™ Progression:</strong> Every plan starts by stabilizing joints and deep core musculature (Phase 01), then progresses systematically through Strength Endurance (Phase 02), Hypertrophy (Phase 03), Maximal Strength (Phase 04), and Power (Phase 05).
              </p>
            </div>
          </details>

          {/* HYPER-REALISTIC BRAND SHOWCASE CINEMA STAGE */}
          <div
            style={{
              maxWidth: 880,
              margin: '0 auto 32px',
              borderRadius: 18,
              overflow: 'hidden',
              background: '#05080D',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.75), 0 0 40px rgba(245, 158, 11, 0.16)',
              position: 'relative',
              textAlign: 'left',
            }}
          >
            {/* Cinema Top Telemetry Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                background: 'rgba(8, 14, 24, 0.95)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#EF4444',
                    boxShadow: '0 0 8px #EF4444',
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-telemetry)',
                    fontSize: 11,
                    letterSpacing: '0.12em',
                    color: '#F8FAFC',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  FORGE ATHLETIC // BLACK FRIDAY SHOWCASE FILM (1080P CINEMA)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-telemetry)',
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    color: '#38BDF8',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    padding: '3px 8px',
                    borderRadius: 6,
                    textTransform: 'uppercase',
                  }}
                >
                  Posture Relief · 20m Home &amp; Travel · 1-on-1 Coaching
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const nextMuted = !videoMuted
                    setVideoMuted(nextMuted)
                    if (videoRef.current) {
                      videoRef.current.muted = nextMuted
                      if (!nextMuted) {
                        videoRef.current.play().catch(() => { })
                      }
                    }
                  }}
                  aria-label={videoMuted ? 'Unmute showcase video audio' : 'Mute showcase video audio'}
                  style={{
                    background: videoMuted
                      ? 'rgba(245, 158, 11, 0.18)'
                      : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.5)',
                    color: videoMuted ? '#FBBF24' : '#080E14',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontFamily: 'var(--font-telemetry)',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                  }}
                >
                  {videoMuted ? '🔇 UNMUTE SOUND' : '🔊 SOUND ON'}
                </button>
              </div>
            </div>

            {/* 16:9 Cinema Video Viewport */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16 / 9',
                backgroundColor: '#05080D',
                overflow: 'hidden',
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                loop
                muted={videoMuted}
                playsInline
                preload="auto"
                poster="/images/forge-black-friday-showcase-poster.jpg?v=7"
                aria-label="Forge Athletic Holistic Coaching Showcase Video"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              >
                <source src="/videos/forge-black-friday-showcase.mp4?v=7" type="video/mp4" />
                <source src="/videos/gaa-founding-manifesto.mp4" type="video/mp4" />
              </video>

              {/* Subtle Bottom Vignette & Direct Conversion Overlay */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  padding: '24px 20px 16px',
                  background: 'linear-gradient(180deg, transparent 0%, rgba(6, 9, 15, 0.85) 60%, rgba(6, 9, 15, 0.96) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-telemetry)',
                      fontSize: 10,
                      letterSpacing: '0.14em',
                      color: '#FBBF24',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}
                  >
                    BLACK FRIDAY EVENT · {LAUNCH_CAMPAIGN_INFO.dateFormatted}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#F8FAFC',
                    }}
                  >
                    Desk posture relief, joint-friendly 20m home &amp; travel strength, nutrition, and 1-on-1 coaching anywhere.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    reservationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    const input = document.getElementById(nameInputId)
                    if (input) input.focus()
                  }}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#080E14',
                    fontFamily: 'var(--font-heading)',
                    fontSize: 14,
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)',
                  }}
                >
                  Lock In 25% Off ({HOLIDAY_DEAL_PROMO.code}) &rarr;
                </button>
              </div>
            </div>

            {/* Interactive 5-Act Film Chapter Scrubber Strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 6,
                padding: '10px 14px',
                background: 'rgba(8, 14, 24, 0.96)',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {[
                { code: '01', label: 'Desk Posture & Ergonomics', timeSec: 0 },
                { code: '02', label: 'Joint-First Home Strength', timeSec: 2.5 },
                { code: '03', label: '20-Min Travel & Recovery', timeSec: 5.0 },
                { code: '04', label: '1-on-1 Live Coaching', timeSec: 8.2 },
                { code: '05', label: 'The Forge Sanctuary', timeSec: 10.7 },
              ].map(ch => (
                <button
                  key={ch.code}
                  type="button"
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = ch.timeSec
                      videoRef.current.play().catch(() => {})
                    }
                    playTactileTone('tick')
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(245, 158, 11, 0.28)',
                    borderRadius: 6,
                    padding: '6px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-telemetry)',
                      fontSize: 10,
                      fontWeight: 800,
                      color: '#080E14',
                      background: '#F59E0B',
                      padding: '1px 5px',
                      borderRadius: 4,
                    }}
                  >
                    {ch.code}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-telemetry)',
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: '#E2E8F0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {ch.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* HOLIDAY DEAL CALLOUT PILL */}
          <div
            style={{
              maxWidth: 760,
              margin: '0 auto 28px',
              padding: '14px 20px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(15, 23, 42, 0.92) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              boxShadow: '0 8px 28px rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'var(--font-telemetry)',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#080E14',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
                  padding: '4px 10px',
                  borderRadius: 6,
                }}
              >
                HOLIDAY DEAL UNLOCKED
              </span>
              <span style={{ fontSize: 13.5, color: '#F8FAFC', fontWeight: 600 }}>
                {HOLIDAY_DEAL_PROMO.headline}
              </span>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-telemetry)',
                fontSize: 12,
                fontWeight: 700,
                color: '#34D399',
                background: 'rgba(52, 211, 153, 0.12)',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                padding: '4px 10px',
                borderRadius: 6,
                letterSpacing: '0.08em',
              }}
            >
              PROMO CODE: {HOLIDAY_DEAL_PROMO.code}
            </span>
          </div>

          {/* COUNTDOWN TICKER HUD */}
          <div
            style={{
              background: '#111318',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: '28px 20px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 20px 52px rgba(0, 0, 0, 0.65)',
              maxWidth: 760,
              margin: '0 auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
                paddingBottom: 16,
                marginBottom: 20,
                borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
                fontSize: 11,
                fontFamily: 'var(--font-telemetry)',
                letterSpacing: '0.12em',
                color: '#A1A1AA',
                textTransform: 'uppercase',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ForgeIcon name="clock" size={15} style={{ color: '#34D399' }} />
                <span>UNMASKING COUNTDOWN</span>
              </div>
              <div style={{ color: '#FBBF24', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {LAUNCH_CAMPAIGN_INFO.dateFormatted} · {LAUNCH_CAMPAIGN_INFO.timeFormatted}
              </div>
            </div>

            {/* Countdown Digits */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 10,
              }}
            >
              {[
                { label: 'DAYS', value: timeRemaining.days },
                { label: 'HOURS', value: timeRemaining.hours },
                { label: 'MINUTES', value: timeRemaining.minutes },
                { label: 'SECONDS', value: timeRemaining.seconds },
              ].map((unit, idx) => (
                <div
                  key={unit.label}
                  style={{
                    background: '#181B22',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    padding: '16px 8px',
                    textAlign: 'center',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    className="tabular-nums"
                    style={{
                      fontFamily: 'var(--font-telemetry)',
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: 'clamp(1.85rem, 5vw, 3.25rem)',
                      fontWeight: 800,
                      lineHeight: 1,
                      color: idx === 3 ? '#34D399' : '#F8FAFC',
                      letterSpacing: '-0.02em',
                      marginBottom: 6,
                    }}
                  >
                    {mounted ? String(unit.value).padStart(2, '0') : '--'}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-telemetry)',
                      fontSize: 10,
                      letterSpacing: '0.14em',
                      color: '#A1A1AA',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    {unit.label}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 18,
                fontSize: 12,
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span style={{ color: '#34D399' }}>✓</span>
              <span>
                Reserve your Founding Member Pass before our Black Friday Unmasking Event (Nov 27) to lock in your 25% Lifetime Rate Lock (Code: {HOLIDAY_DEAL_PROMO.code}) and schedule your free 1-on-1 movement screen.
              </span>
            </div>
          </div>

          {/* BLACK FRIDAY DOORBUSTER VAULT: PROMO BRANDING PACKAGE */}
          <div
            style={{
              maxWidth: 880,
              margin: '28px auto 0',
              borderRadius: 18,
              background: 'linear-gradient(145deg, rgba(245, 158, 11, 0.16) 0%, rgba(15, 23, 42, 0.96) 45%, rgba(8, 14, 24, 0.99) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.55)',
              boxShadow: '0 20px 56px rgba(0, 0, 0, 0.65), 0 0 32px rgba(245, 158, 11, 0.14)',
              padding: '28px 24px',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top Ribbon */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
                paddingBottom: 16,
                marginBottom: 20,
                borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-telemetry)',
                    fontSize: 10.5,
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#080E14',
                    background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
                    padding: '4px 10px',
                    borderRadius: 6,
                  }}
                >
                  🔥 BLACK FRIDAY DOORBUSTER VAULT
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-telemetry)',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: '#FDE68A',
                    textTransform: 'uppercase',
                  }}
                >
                  MUST JOIN ON BLACK FRIDAY (NOV 27) TO UNLOCK DEEP DISCOUNTS
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-telemetry)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#F87171',
                  background: 'rgba(239, 68, 68, 0.14)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  padding: '4px 10px',
                  borderRadius: 6,
                  letterSpacing: '0.08em',
                }}
              >
                STRICTLY 50 PASSES · NEVER REPEATED
              </span>
            </div>

            <div style={{ marginBottom: 22 }}>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(1.5rem, 3.2vw, 2.15rem)',
                  fontWeight: 800,
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  color: '#FFFFFF',
                  margin: '0 0 8px',
                }}
              >
                The Only Day All Year We Drop Prices By 25% For Life + Include $279 In Free Bonuses
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: '#CBD5E1',
                }}
              >
                We never discount our coaching during the year. When the doors open on <strong>Black Friday, November 27 at 06:00 AM EST</strong>, Founding Pass holders get a <strong>72-hour priority window</strong> to activate their membership with our deepest discount ever—before rates permanently return to full retail price.
              </p>
            </div>

            {/* 3-Pillar Value Bundle Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: 14,
                marginBottom: 22,
              }}
            >
              <div
                style={{
                  background: 'rgba(8, 14, 24, 0.9)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: 12,
                  padding: '16px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-telemetry)',
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#FBBF24',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  VALUED AT UP TO $900/YR SAVINGS
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    marginBottom: 6,
                  }}
                >
                  1. 25% Lifetime Rate Lock
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: '#94A3B8', lineHeight: 1.5 }}>
                  Lock in <strong>Core at $36.75/mo</strong> (reg. $49), <strong>Plus at $74.25/mo</strong> (reg. $99), or <strong>Coach Support at $224.25/mo</strong> (reg. $299) for as long as you remain a member.
                </p>
              </div>

              <div
                style={{
                  background: 'rgba(8, 14, 24, 0.9)',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  borderRadius: 12,
                  padding: '16px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-telemetry)',
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#34D399',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  $180 RETAIL VALUE · INCLUDED FREE
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    marginBottom: 6,
                  }}
                >
                  2. Free 60-Min Live Screen
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: '#94A3B8', lineHeight: 1.5 }}>
                  Private 1-on-1 HD video session with Coach Gordon for a full 33-point 3D posture, spine, and joint assessment before your first workout.
                </p>
              </div>

              <div
                style={{
                  background: 'rgba(8, 14, 24, 0.9)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: 12,
                  padding: '16px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-telemetry)',
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#38BDF8',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  $99 RETAIL VALUE · INCLUDED FREE
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    marginBottom: 6,
                  }}
                >
                  3. Free 30-Day Partner Pass
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: '#94A3B8', lineHeight: 1.5 }}>
                  Receive a complimentary 30-day guest pass on Black Friday to gift to a spouse, family member, or training partner at zero cost.
                </p>
              </div>
            </div>

            {/* 3-Step Black Friday Activation Timeline */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 10,
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: 12, fontFamily: 'var(--font-telemetry)' }}>
                <span style={{ color: '#FBBF24', fontWeight: 700 }}>
                  STEP 1: Reserve Free Pass Today ($0)
                </span>
                <span style={{ color: '#64748B' }}>&rarr;</span>
                <span style={{ color: '#38BDF8', fontWeight: 700 }}>
                  STEP 2: Get Private Link Thanksgiving Night
                </span>
                <span style={{ color: '#64748B' }}>&rarr;</span>
                <span style={{ color: '#34D399', fontWeight: 700 }}>
                  STEP 3: Join Black Friday (Nov 27) &amp; Lock In {HOLIDAY_DEAL_PROMO.code}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  reservationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  const input = document.getElementById(nameInputId)
                  if (input) input.focus()
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: '1px solid rgba(245, 158, 11, 0.6)',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#FBBF24',
                  fontFamily: 'var(--font-telemetry)',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Reserve Spot Now ($0 Today) &darr;
              </button>
            </div>
          </div>
        </section>

        {/* INTERACTIVE 4-TAB SNEAK PEEK SHOWCASE (100% Read-Only Sandbox) */}
        <AppSneakPeekShowcase />

        {/* TWO COLUMN GRID: Reservation & Sneak Peek Radar */}
        <div
          ref={reservationSectionRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 28,
            marginBottom: 64,
          }}
        >
          {/* LEFT: Founding Reservation Form / Member Pass */}
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(8, 14, 20, 0.95) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 16,
              padding: '32px 24px',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(245, 158, 11, 0.15)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Scarcity / Cohort Counter Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                borderRadius: 8,
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                marginBottom: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ForgeIcon name="crown" size={16} style={{ color: '#F59E0B' }} />
                <span
                  style={{
                    fontFamily: 'var(--font-telemetry)',
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    color: '#FBBF24',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  First 50 Founding Members
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-telemetry)',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#34D399',
                }}
              >
                12 of 50 Spots Left
              </span>
            </div>

            {status !== 'success' ? (
              <>
                <h2
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    margin: '0 0 8px',
                    color: '#FFFFFF',
                  }}
                >
                  Claim Your Founding Member Pass
                </h2>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: '#94A3B8',
                    margin: '0 0 24px',
                  }}
                >
                  Lock in early access built around your schedule and environment. Train at home, in an apartment fitness center, or while traveling with guaranteed remote pre-holiday movement screening with Coach Gordon and permanent Founding Member pricing.
                </p>

                <form onSubmit={handleSubmit} noValidate>
                  {/* Honeypot field for bot trapping */}
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

                  {/* Full Name */}
                  <div style={{ marginBottom: 16 }}>
                    <label
                      htmlFor={nameInputId}
                      style={{
                        display: 'block',
                        fontFamily: 'var(--font-telemetry)',
                        fontSize: 11,
                        letterSpacing: '0.1em',
                        color: '#CBD5E1',
                        textTransform: 'uppercase',
                        marginBottom: 6,
                      }}
                    >
                      Full Name *
                    </label>
                    <input
                      id={nameInputId}
                      type="text"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. Jordan Smith"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 8,
                        background: 'rgba(8, 14, 24, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        fontSize: 16,
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => (e.target.style.borderColor = '#F59E0B')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
                    />
                  </div>

                  {/* Email */}
                  <div style={{ marginBottom: 16 }}>
                    <label
                      htmlFor={emailInputId}
                      style={{
                        display: 'block',
                        fontFamily: 'var(--font-telemetry)',
                        fontSize: 11,
                        letterSpacing: '0.1em',
                        color: '#CBD5E1',
                        textTransform: 'uppercase',
                        marginBottom: 6,
                      }}
                    >
                      Email Address *
                    </label>
                    <input
                      id={emailInputId}
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="jordan@example.com"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 8,
                        background: 'rgba(8, 14, 24, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        fontSize: 16,
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => (e.target.style.borderColor = '#F59E0B')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
                    />
                  </div>

                  {/* Primary Focus */}
                  <div style={{ marginBottom: 16 }}>
                    <label
                      htmlFor={goalSelectId}
                      style={{
                        display: 'block',
                        fontFamily: 'var(--font-telemetry)',
                        fontSize: 11,
                        letterSpacing: '0.1em',
                        color: '#CBD5E1',
                        textTransform: 'uppercase',
                        marginBottom: 6,
                      }}
                    >
                      Your Primary Training Goal
                    </label>
                    <select
                      id={goalSelectId}
                      value={primaryGoal}
                      onChange={e => setPrimaryGoal(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 8,
                        background: '#0B1320',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        fontSize: 16,
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="posture_joint_health">Posture, Spine & Joint Health (Desk & Daily Life)</option>
                      <option value="functional_strength">Strength & Muscle Building (Beginner to Advanced)</option>
                      <option value="energy_conditioning">Cardio Stamina, Energy & Conditioning</option>
                      <option value="flexible_training">Flexible Remote Training (Home Gym, Apartment, or Travel)</option>
                    </select>
                  </div>

                  {/* Collapsible Optional SMS Launch Alert Toggle (Friction Reduction) */}
                  <div style={{ marginBottom: 22 }}>
                    <button
                      type="button"
                      aria-expanded={showSmsInput}
                      onClick={() => setShowSmsInput(prev => !prev)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 underline-offset-4 hover:underline"
                    >
                      <span>{showSmsInput ? '− Hide SMS launch alert' : '+ Add SMS launch alert (optional)'}</span>
                    </button>

                    {showSmsInput ? (
                      <div style={{ marginTop: 10 }}>
                        <label
                          htmlFor={phoneInputId}
                          style={{
                            display: 'block',
                            fontFamily: 'var(--font-telemetry)',
                            fontSize: 11,
                            letterSpacing: '0.1em',
                            color: '#94A3B8',
                            textTransform: 'uppercase',
                            marginBottom: 6,
                          }}
                        >
                          Mobile Phone (Optional for Nov 20 launch text)
                        </label>
                        <input
                          id={phoneInputId}
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: 8,
                            background: 'rgba(8, 14, 24, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#FFFFFF',
                            fontSize: 16,
                            outline: 'none',
                          }}
                        />
                      </div>
                    ) : null}
                  </div>

                  {errorMessage && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#FCA5A5',
                        fontSize: 13,
                        marginBottom: 16,
                      }}
                    >
                      {errorMessage}
                    </div>
                  )}

                  {/* Submit Action */}
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      color: '#080E14',
                      fontFamily: 'var(--font-heading)',
                      fontSize: 17,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      cursor: status === 'submitting' ? 'wait' : 'pointer',
                      boxShadow: '0 4px 18px rgba(245, 158, 11, 0.35)',
                      transition: 'all 0.2s ease',
                      opacity: status === 'submitting' ? 0.7 : 1,
                    }}
                  >
                    {status === 'submitting' ? 'CLAIMING FOUNDING PASS...' : 'CLAIM FOUNDING MEMBER PASS →'}
                  </button>

                  <div
                    style={{
                      marginTop: 14,
                      fontSize: 11,
                      color: '#64748B',
                      textAlign: 'center',
                      fontFamily: 'var(--font-telemetry)',
                    }}
                  >
                    🔒 STRICT PRIVACY · ZERO MARKETING SPAM · EARLY ACCESS ONLY
                  </div>
                </form>
              </>
            ) : (
              /* MINTED 3D HOLOGRAPHIC MEMBER PASS STATE */
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 12px',
                    borderRadius: 9999,
                    background: 'rgba(52, 211, 153, 0.15)',
                    border: '1px solid rgba(52, 211, 153, 0.35)',
                    color: '#34D399',
                    fontFamily: 'var(--font-telemetry)',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    marginBottom: 18,
                  }}
                >
                  ✓ FOUNDING RESERVATION CONFIRMED
                </div>

                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 24,
                    fontWeight: 700,
                    margin: '0 0 8px',
                    color: '#FFFFFF',
                  }}
                >
                  Welcome as a Founding Member, {fullName.split(' ')[0]}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: '#94A3B8',
                    margin: '0 0 24px',
                    lineHeight: 1.5,
                  }}
                >
                  Your unmasking credentials are confirmed. A priority intake invitation has been dispatched to <strong>{email}</strong>.
                </p>

                {/* Holographic Member Card */}
                <div
                  className="forge-metallic-pass"
                  style={{
                    borderRadius: 16,
                    padding: '24px 20px',
                    textAlign: 'left',
                    position: 'relative',
                    overflow: 'hidden',
                    marginBottom: 20,
                  }}
                >
                  {/* Metallic Shimmer Bar */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: 'linear-gradient(90deg, #F59E0B, #FBBF24, #38BDF8, #F59E0B)',
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          overflow: 'hidden',
                          border: '1px solid rgba(245, 158, 11, 0.5)',
                        }}
                      >
                        <Image
                          src="/images/brand/forge-crest-mark.png"
                          alt=""
                          width={32}
                          height={32}
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 16,
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            color: '#F8FAFC',
                          }}
                        >
                          FORGE ATHLETIC
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-telemetry)',
                            fontSize: 9,
                            color: '#C5A059',
                            letterSpacing: '0.12em',
                          }}
                        >
                          FOUNDING PASS // EARLY ACCESS
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-telemetry)',
                        fontSize: 11,
                        color: '#FBBF24',
                        background: 'rgba(245, 158, 11, 0.1)',
                        padding: '4px 8px',
                        borderRadius: 6,
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                      }}
                    >
                      FOUNDING MEMBER #{String(assignedPassNumber).padStart(2, '0')}
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-telemetry)',
                        fontSize: 10,
                        color: '#64748B',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      PASS HOLDER
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#F8FAFC',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {fullName}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      paddingTop: 14,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-telemetry)',
                          fontSize: 9,
                          color: '#64748B',
                          letterSpacing: '0.08em',
                        }}
                      >
                        CREDENTIAL SERIAL
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-telemetry)',
                          fontSize: 12,
                          color: '#38BDF8',
                          letterSpacing: '0.05em',
                          fontWeight: 600,
                        }}
                      >
                        {formattedSerial}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-telemetry)',
                        fontSize: 10,
                        color: '#34D399',
                        fontWeight: 600,
                      }}
                    >
                      ● 25% RATE LOCK ({HOLIDAY_DEAL_PROMO.code})
                    </div>
                  </div>
                </div>

                {/* Copy Serial Button */}
                <button
                  type="button"
                  onClick={copyVipSerial}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#E2E8F0',
                    borderRadius: 8,
                    padding: '10px 18px',
                    fontSize: 13,
                    fontFamily: 'var(--font-telemetry)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                  }}
                >
                  <ForgeIcon name="ticket" size={14} />
                  <span>{copiedSerial ? 'COPIED TO CLIPBOARD!' : 'COPY MEMBER PASS SERIAL'}</span>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Classified Sneak Peek Radar */}
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(8, 14, 20, 0.95) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 16,
              padding: '32px 24px',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-telemetry)',
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    color: '#38BDF8',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <ForgeIcon name="crosshair" size={14} />
                  <span>RADAR // SNEAK PEEK ARCHITECTURE</span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-telemetry)',
                    fontSize: 11,
                    color: '#94A3B8',
                  }}
                >
                  DROP: BLACK FRIDAY, NOV 27
                </div>
              </div>

              {/* Tabs for Sneak Peeks */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 6,
                  marginBottom: 24,
                }}
              >
                {SNEAK_PEEKS.map((peek, i) => (
                  <button
                    key={peek.id}
                    type="button"
                    onClick={() => {
                      setActivePeekIndex(i)
                      playTactileTone('tick')
                    }}
                    style={{
                      background:
                        activePeekIndex === i ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border:
                        activePeekIndex === i
                          ? '1px solid rgba(245, 158, 11, 0.5)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                      color: activePeekIndex === i ? '#FBBF24' : '#64748B',
                      borderRadius: 8,
                      padding: '8px 4px',
                      fontSize: 11,
                      fontFamily: 'var(--font-telemetry)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <ForgeIcon name={peek.icon} size={15} />
                    <span>0{i + 1}</span>
                  </button>
                ))}
              </div>

              {/* Active Tab Content Card */}
              {(() => {
                const current = SNEAK_PEEKS[activePeekIndex]
                return (
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-telemetry)',
                        fontSize: 11,
                        letterSpacing: '0.12em',
                        color: '#F59E0B',
                        textTransform: 'uppercase',
                        marginBottom: 6,
                      }}
                    >
                      {current.tag}
                    </div>
                    <h3
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 24,
                        fontWeight: 700,
                        margin: '0 0 10px',
                        color: '#FFFFFF',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {current.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 14,
                        lineHeight: 1.55,
                        color: '#CBD5E1',
                        margin: '0 0 20px',
                      }}
                    >
                      {current.subtitle}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                      {current.bullets.map((b, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            fontSize: 13,
                            color: '#94A3B8',
                            lineHeight: 1.45,
                          }}
                        >
                          <span style={{ color: '#F59E0B', marginTop: 1 }}>▹</span>
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: 10,
                        background: 'rgba(8, 14, 24, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--font-telemetry)',
                            fontSize: 10,
                            color: '#64748B',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {current.metricLabel}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-telemetry)',
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#F8FAFC',
                          }}
                        >
                          {current.metric}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontFamily: 'var(--font-telemetry)',
                          color: '#34D399',
                        }}
                      >
                        [ UNMASKING READY ]
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Coach Gordon Anchor */}
            <div
              style={{
                marginTop: 28,
                paddingTop: 18,
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid rgba(245, 158, 11, 0.5)',
                  flexShrink: 0,
                }}
              >
                <Image
                  src="/images/hero-personal-coaching-45wk-goal.jpg"
                  alt="Coach Gordon"
                  fill
                  sizes="48px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#F8FAFC',
                  }}
                >
                  Directly Led by Coach Gordon
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#94A3B8',
                  }}
                >
                  NASM-CPT® Since 2008 · 18+ Years Dedicated Coaching · Master Trainer Track
                </div>
              </div>
              <Link
                href="/credentials"
                style={{
                  fontSize: 12,
                  fontFamily: 'var(--font-telemetry)',
                  color: '#FBBF24',
                  textDecoration: 'none',
                }}
              >
                Verify &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* HUMAN TRUST & CLIENT OUTCOMES GRID (#coach) */}
        <section
          id="coach"
          className="mb-16 scroll-mt-24 rounded-2xl border border-amber-400/30 bg-[#0A111C] p-6 shadow-2xl sm:p-8"
          aria-labelledby="coach-trust-heading"
        >
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[200px_1fr]">
            {/* Portrait Frame (aspect-square + 'CG' Monogram Fallback) */}
            <div className="mx-auto w-40 sm:w-48 lg:mx-0 lg:w-full">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-amber-400/50 bg-slate-900 shadow-lg">
                {!portraitLoadFailed ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={COACH_GORDON_TRUST_PROFILE.portraitSrc}
                    alt="Coach Gordon — NASM-CPT Since 2008"
                    onError={() => setPortraitLoadFailed(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 font-serif text-4xl font-bold tracking-widest text-amber-300">
                    {COACH_GORDON_TRUST_PROFILE.monogram}
                  </div>
                )}
                <span className="absolute bottom-2 left-2 rounded-md border border-amber-400/40 bg-slate-950/85 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                  {COACH_GORDON_TRUST_PROFILE.monogram}
                </span>
              </div>
            </div>

            {/* Coach Gordon Verification & 3-Sentence Philosophy */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-200">
                  ✓ {COACH_GORDON_TRUST_PROFILE.verificationBadge}
                </span>
                <span className="text-xs text-slate-400">
                  {COACH_GORDON_TRUST_PROFILE.secondaryCredentials}
                </span>
              </div>

              <h2
                id="coach-trust-heading"
                className="mt-3 font-serif text-2xl font-bold text-white sm:text-3xl"
              >
                Joint-First Coaching Led Directly by {COACH_GORDON_TRUST_PROFILE.name}
              </h2>

              <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-200">
                {COACH_GORDON_TRUST_PROFILE.philosophySentences.map((sentence, idx) => (
                  <p key={idx}>{sentence}</p>
                ))}
              </div>
            </div>
          </div>

          {/* 3-Card Client Outcomes Grid */}
          <div className="mt-8 border-t border-white/10 pt-4">
            <ClientOutcomesShowcase />
          </div>
        </section>

        {/* BRAND MANIFESTO: The Zero-Distraction Sanctuary (#how-it-works) */}
        <section
          id="how-it-works"
          className="scroll-mt-24"
          style={{
            marginBottom: 64,
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(8, 14, 24, 0.98) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 18,
            padding: '40px 28px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(245, 158, 11, 0.2)',
            position: 'relative',
            overflow: 'hidden',
          }}
          aria-labelledby="manifesto-title"
        >
          {/* Subtle Ambient Glow */}
          <div
            style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 36px', position: 'relative' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 14px',
                borderRadius: 9999,
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#FDE68A',
                fontFamily: 'var(--font-telemetry)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              <span>CLINICAL SPORTS SCIENCE</span>
              <span>·</span>
              <span>DEEP KINETIC FLOW</span>
              <span>·</span>
              <span>100% BESPOKE COACHING</span>
            </div>

            <h2
              id="manifesto-title"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.85rem, 4vw, 2.75rem)',
                fontWeight: 800,
                letterSpacing: '0.03em',
                lineHeight: 1.1,
                textTransform: 'uppercase',
                margin: '0 0 14px',
                color: '#FFFFFF',
              }}
            >
              The Precision Training Sanctuary
            </h2>

            <p
              style={{
                fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
                lineHeight: 1.6,
                color: '#CBD5E1',
                margin: '0 auto',
              }}
            >
              Engineered around NASM Virtual Coaching best practices, Forge Athletic brings clinical-grade sports science and master coach guidance directly to your workout.
              We pour 100% of our energy into two things: <strong>the world&apos;s best sports science tools</strong> and <strong>the highest quality coaching</strong>—giving you an extraordinary training experience with zero noise.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
              position: 'relative',
            }}
          >
            {/* Pillar 1: Pure In-Gym Focus */}
            <div
              style={{
                background: 'rgba(8, 14, 20, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FBBF24',
                }}
              >
                <ForgeIcon name="lock" size={18} />
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-telemetry)',
                  fontSize: 10,
                  color: '#FBBF24',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                THE FOCUS SANCTUARY
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  margin: 0,
                  letterSpacing: '0.02em',
                }}
              >
                Uninterrupted Flow State
              </h3>
              <p
                style={{
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: '#94A3B8',
                  margin: 0,
                }}
              >
                Every second between sets is dialed in for autonomic recovery, diaphragmatic breathwork, and nervous system replenishment. Hands on the bar, mind in the muscle, eyes on real physical progress.
              </p>
            </div>

            {/* Pillar 2: Human & AI Symbiosis */}
            <div
              style={{
                background: 'rgba(8, 14, 20, 0.8)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 14,
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FBBF24',
                }}
              >
                <ForgeIcon name="zap" size={18} />
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-telemetry)',
                  fontSize: 10,
                  color: '#FBBF24',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                THE GOLD STANDARD
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  margin: 0,
                  letterSpacing: '0.02em',
                }}
              >
                Best Tools × Best Coaching
              </h3>
              <p
                style={{
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: '#94A3B8',
                  margin: 0,
                }}
              >
                Sub-180ms computational AI handles bar velocity, posture mesh diagnostics, and dynamic load adaptation—steered by Coach Gordon&apos;s 18+ years of clinical human stewardship.
              </p>
            </div>

            {/* Pillar 3: Organic Word-of-Mouth & Results */}
            <div
              style={{
                background: 'rgba(8, 14, 20, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(52, 211, 153, 0.12)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34D399',
                }}
              >
                <ForgeIcon name="target" size={18} />
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-telemetry)',
                  fontSize: 10,
                  color: '#34D399',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                UNDENIABLE PROOF
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  margin: 0,
                  letterSpacing: '0.02em',
                }}
              >
                Results-Driven Flywheel
              </h3>
              <p
                style={{
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: '#94A3B8',
                  margin: 0,
                }}
              >
                Powered by high-intent search discovery, peer recommendations, and a goal-achieving app that delivers measurable PRs and pain-free joints. Nothing but the best will do.
              </p>
            </div>
          </div>
        </section>

        {/* FOUNDING MEMBER PRIVILEGES SECTION */}
        <section
          style={{
            marginBottom: 64,
          }}
          aria-labelledby="perks-title"
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div
              style={{
                fontFamily: 'var(--font-telemetry)',
                fontSize: 11,
                letterSpacing: '0.14em',
                color: '#F59E0B',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Guaranteed Pre-Launch Privileges
            </div>
            <h2
              id="perks-title"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                margin: 0,
                color: '#FFFFFF',
              }}
            >
              Why Claim Your Founding Pass Now
            </h2>
            <p
              style={{
                fontSize: 14,
                color: '#94A3B8',
                maxWidth: 620,
                margin: '8px auto 0',
                lineHeight: 1.5,
              }}
            >
              Built for real people with busy schedules, everyday lifters, and anyone wanting evidence-led personal training that actually fits their life.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 20,
            }}
          >
            {FOUNDING_PERKS.map((perk, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  padding: '24px 20px',
                  backdropFilter: 'blur(12px)',
                  transition: 'border-color 0.2s',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FBBF24',
                    marginBottom: 16,
                  }}
                >
                  <ForgeIcon name={perk.icon} size={20} />
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                    color: '#F8FAFC',
                    margin: '0 0 8px',
                  }}
                >
                  {perk.title}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: '#94A3B8',
                    margin: 0,
                  }}
                >
                  {perk.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 100% REMOTE PERFORMANCE OFFERINGS ARCHITECTURE (#pricing) */}
        <section
          id="pricing"
          className="scroll-mt-24"
          style={{
            marginBottom: 64,
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.75) 0%, rgba(8, 14, 24, 0.95) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 16,
            padding: '36px 24px',
            boxShadow: '0 20px 48px rgba(0, 0, 0, 0.5)',
          }}
          aria-labelledby="remote-offerings-title"
        >
          <div style={{ textAlign: 'center', maxWidth: 740, margin: '0 auto 28px' }}>
            <div
              style={{
                fontFamily: 'var(--font-telemetry)',
                fontSize: 11,
                letterSpacing: '0.14em',
                color: '#F59E0B',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Founding Member Lifetime Rate Lock · Zero Commute Remote Coaching
            </div>
            <h2
              id="remote-offerings-title"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.75rem, 4vw, 2.4rem)',
                fontWeight: 700,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                margin: '0 0 12px',
                color: '#FFFFFF',
              }}
            >
              Lock In Founding Pricing Before November 20 Launch
            </h2>
            <p
              style={{
                fontSize: 14,
                color: '#94A3B8',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Founding Members lock in pre-launch pricing for life—your monthly rate never increases after launch day. Train at home, in an apartment gym, or on the road.
            </p>
          </div>

          <div style={{ marginBottom: 28 }}>
            <FoundingRateLockPricingGrid
              mode="prelaunch"
              onPrelaunchClaimClick={() => {
                reservationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link
              href="/packages"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                borderRadius: 8,
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#FBBF24',
                fontFamily: 'var(--font-telemetry)',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <span>Explore Complete Tier Comparison Matrix</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </section>

        {/* BOTTOM ACCREDITATION & TRUST FOOTER */}
        <footer
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: 32,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 24,
              fontSize: 12,
              fontFamily: 'var(--font-telemetry)',
              color: '#64748B',
            }}
          >
            <span>NASM-CPT® CERTIFIED</span>
            <span>·</span>
            <span>EVIDENCE-LED PERIODIZATION</span>
            <span>·</span>
            <span>ASTI CPR/AED COMPLIANT</span>
            <span>·</span>
            <span>STRICTLY PRIVATE & AES-256 ENCRYPTED</span>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 20,
              fontSize: 12,
              color: '#94A3B8',
            }}
          >
            <Link href="/credentials" style={{ color: 'inherit', textDecoration: 'none' }}>
              Credentials
            </Link>
            <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>
              Privacy Policy
            </Link>
            <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>
              Terms of Service
            </Link>
            <Link href="/auth/login" style={{ color: 'inherit', textDecoration: 'none' }}>
              Member Portal
            </Link>
          </div>

          <div
            style={{
              fontSize: 11,
              color: '#475569',
              fontFamily: 'var(--font-telemetry)',
            }}
          >
            © {new Date().getFullYear()} Forge Athletic. Built From The Ground Up. Precision Science For Real Lives.
          </div>
        </footer>
      </div>
    </div>
  )
}
