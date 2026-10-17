'use client'

import React, { useState, useEffect, useRef, useId } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ForgeIcon, { ForgeIconName } from '@/components/ui/ForgeIcon'
import {
  calculateTimeRemaining,
  getGoLiveDate,
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
    ],
    metric: '1-ON-1',
    metricLabel: 'Direct Coach Access',
  },
]

const FOUNDING_PERKS = [
  {
    icon: 'crown' as ForgeIconName,
    title: 'Lifetime Rate Lock',
    description: 'Founding Members permanently retain their pre-launch dues for the entire lifetime of their membership.',
  },
  {
    icon: 'assessment' as ForgeIconName,
    title: 'Pre-Holiday 1-on-1 Screening',
    description: 'Guaranteed 60-minute remote movement diagnostic and 3D kinetic audit with Coach Gordon before Thanksgiving.',
  },
  {
    icon: 'zap' as ForgeIconName,
    title: 'Tier 1 Priority Beta',
    description: 'Immediate first-day access on Friday, November 20 to the complete Forge web and native mobile coaching suite.',
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

  // Sound design state (Web Audio API)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)

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

  // Web Audio Synthesizer (subtle, elegant audio feedback)
  const playTactileTone = (type: 'tick' | 'chime' | 'success') => {
    if (!soundEnabled) return
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        audioCtxRef.current = new AudioContextClass()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const now = ctx.currentTime

      if (type === 'tick') {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(540, now)
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.04)
        gain.gain.setValueAtTime(0.04, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.04)
      } else if (type === 'chime') {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(440, now)
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12)
        gain.gain.setValueAtTime(0.06, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.15)
      } else if (type === 'success') {
        // Warm two-tone harmonic chime
        ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(freq, now + i * 0.08)
          gain.gain.setValueAtTime(0.08, now + i * 0.08)
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.5)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now + i * 0.08)
          osc.stop(now + i * 0.08 + 0.5)
        })
      }
    } catch {
      // AudioContext unavailable or restricted; silently fall back
    }
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
      className="holiday-unmasking-wrapper"
      style={{
        minHeight: '100vh',
        backgroundColor: '#06090F',
        color: '#F8FAFC',
        position: 'relative',
        overflowX: 'clip',
        fontFamily: 'var(--font-body)',
        paddingBottom: 80,
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
          opacity: 0.65,
        }}
      />

      {/* Atmospheric Radial Glows */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90vw',
          maxWidth: 1200,
          height: 600,
          background: 'radial-gradient(ellipse at center, rgba(245, 158, 11, 0.16) 0%, rgba(56, 189, 248, 0.04) 45%, transparent 70%)',
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
                  src="/images/brand/logo-concept-1-kinetic-f.jpg"
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled
                setSoundEnabled(next)
                if (next) playTactileTone('chime')
              }}
              aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
              title={soundEnabled ? 'Audio feedback enabled' : 'Click to enable audio feedback'}
              style={{
                background: soundEnabled ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: soundEnabled
                  ? '1px solid rgba(245, 158, 11, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.12)',
                color: soundEnabled ? '#FBBF24' : '#94A3B8',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 12,
                fontFamily: 'var(--font-telemetry)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
            >
              <ForgeIcon name={soundEnabled ? 'flame' : 'lock'} size={14} />
              <span>{soundEnabled ? 'SFX ON' : 'SFX MUTED'}</span>
            </button>

            {/* Direct Member Entrance */}
            <Link
              href="/auth/login"
              style={{
                textDecoration: 'none',
                color: '#E2E8F0',
                fontSize: 13,
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                padding: '8px 14px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.2s ease',
              }}
            >
              Member Sign In
            </Link>

            {/* Coach Portal Link */}
            <Link
              href="/coach"
              style={{
                textDecoration: 'none',
                color: '#080E14',
                fontSize: 13,
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                padding: '8px 16px',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                boxShadow: '0 2px 10px rgba(245, 158, 11, 0.3)',
                transition: 'transform 0.15s ease',
              }}
            >
              Coach Portal
            </Link>
          </div>
        </header>

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
              EARLY ACCESS // HOLIDAY PRE-LAUNCH
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
              margin: '0 0 20px',
              fontWeight: 700,
            }}
          >
            Precision Science. Unbreakable Bodies.
          </p>

          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.15rem)',
              lineHeight: 1.6,
              color: '#94A3B8',
              margin: '0 auto 36px',
              maxWidth: 720,
            }}
          >
            <strong>Don’t wait for January to repair what November broke.</strong> Forge Athletic
            is opening 50 early Founding Member spots to help everyday people, busy parents,
            and desk workers build lasting strength, joint resilience, and energy before the holiday rush—delivered 100% remotely to your home gym or workout space with zero commute friction.
          </p>

          {/* COUNTDOWN TICKER HUD */}
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(8, 14, 20, 0.98) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: 16,
              padding: '28px 20px',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(245, 158, 11, 0.2)',
              maxWidth: 760,
              margin: '0 auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 16,
                marginBottom: 20,
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: 12,
                fontFamily: 'var(--font-telemetry)',
                letterSpacing: '0.1em',
                color: '#CBD5E1',
                textTransform: 'uppercase',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ForgeIcon name="clock" size={15} style={{ color: '#F59E0B' }} />
                <span>UNMASKING COUNTDOWN</span>
              </div>
              <div style={{ color: '#FBBF24', fontWeight: 600 }}>
                {LAUNCH_CAMPAIGN_INFO.dateFormatted} · {LAUNCH_CAMPAIGN_INFO.timeFormatted}
              </div>
            </div>

            {/* Countdown Digits */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
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
                    background: 'rgba(8, 14, 24, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 12,
                    padding: '16px 8px',
                    textAlign: 'center',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-telemetry)',
                      fontSize: 'clamp(2rem, 5vw, 3.25rem)',
                      fontWeight: 800,
                      lineHeight: 1,
                      color: idx === 3 ? '#F59E0B' : '#F8FAFC',
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
                      letterSpacing: '0.18em',
                      color: '#64748B',
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
                Timed 1 week before Thanksgiving to build momentum before the holiday routine changes.
              </span>
            </div>
          </div>
        </section>

        {/* TWO COLUMN GRID: Reservation & Sneak Peek Radar */}
        <div
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
                        fontSize: 14,
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
                        fontSize: 14,
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
                        fontSize: 14,
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

                  {/* Optional Mobile Phone for SMS Drop Notice */}
                  <div style={{ marginBottom: 24 }}>
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
                      Mobile Phone (Optional for launch text alert)
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
                        fontSize: 14,
                        outline: 'none',
                      }}
                    />
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
                  style={{
                    background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 50%, #080E14 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.6)',
                    borderRadius: 14,
                    padding: '24px 20px',
                    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.8), 0 0 24px rgba(245, 158, 11, 0.25)',
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
                          src="/images/brand/logo-concept-1-kinetic-f.jpg"
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
                      ● ACTIVE PRIORITY
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
                  DROP: NOV 20, 2026
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

        {/* BRAND MANIFESTO: The Zero-Distraction Sanctuary */}
        <section
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
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#FCA5A5',
                fontFamily: 'var(--font-telemetry)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              <span>✕ NO SOCIAL MEDIA</span>
              <span>·</span>
              <span>ZERO DISTRACTIONS</span>
              <span>·</span>
              <span>100% COACHING</span>
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
              The Anti-Distraction Gym Sanctuary
            </h2>

            <p
              style={{
                fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
                lineHeight: 1.6,
                color: '#CBD5E1',
                margin: '0 auto',
              }}
            >
              We don&apos;t buy paid social ads. We don&apos;t build endless feeds or pay fitness influencers to pose.
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
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#F87171',
                }}
              >
                <ForgeIcon name="lock" size={18} />
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-telemetry)',
                  fontSize: 10,
                  color: '#F87171',
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
                Zero Feeds. Pure Flow.
              </h3>
              <p
                style={{
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: '#94A3B8',
                  margin: 0,
                }}
              >
                No doom-scrolling between sets. No dopamine traps or camera circus. The gym is sacred ground for mechanical tension, heart rate control, and mental clarity.
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

        {/* 100% REMOTE PERFORMANCE OFFERINGS ARCHITECTURE */}
        <section
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
              Asset-Light · 100% Remote Performance Model
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
              Zero Commute. Master Coaching Anywhere.
            </h2>
            <p
              style={{
                fontSize: 14,
                color: '#94A3B8',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              We operate without physical gym overhead so you get master-level coaching at superior value. Train in your private home gym, apartment fitness center, or hotel while traveling—with personalized periodization, computer-vision movement audits, and encrypted WebRTC video.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
              marginBottom: 28,
            }}
          >
            {/* Core Tier Card */}
            <div
              style={{
                background: 'rgba(8, 14, 20, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: '20px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: 10, color: '#38BDF8', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                    Foundation
                  </span>
                  <span style={{ fontSize: 10, color: '#34D399', background: 'rgba(52, 211, 153, 0.12)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-telemetry)' }}>
                    7-Day Free Trial
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px' }}>
                  Core Lab
                </h3>
                <div style={{ fontFamily: 'var(--font-telemetry)', fontSize: 22, fontWeight: 800, color: '#F59E0B', marginBottom: 12 }}>
                  $19.99 <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>/ mo</span>
                </div>
                <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
                  Autonomous 5-phase NASM OPT™ periodization, 33-point posture screen, and dynamic equipment swaps for home or travel.
                </p>
              </div>
            </div>

            {/* Plus Tier Card */}
            <div
              style={{
                background: 'rgba(8, 14, 20, 0.85)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: 12,
                padding: '20px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: 10, color: '#FBBF24', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                    Guided Hybrid
                  </span>
                  <span style={{ fontSize: 10, color: '#FBBF24', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-telemetry)' }}>
                    Most Popular
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px' }}>
                  Plus
                </h3>
                <div style={{ fontFamily: 'var(--font-telemetry)', fontSize: 22, fontWeight: 800, color: '#F59E0B', marginBottom: 12 }}>
                  $49.00 <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>/ mo</span>
                </div>
                <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
                  Everything in Core + full Nutrition Periodization, Travel Pass hotel swaps, and 2 Form Lab video reviews per month.
                </p>
              </div>
            </div>

            {/* Coach Support Card */}
            <div
              style={{
                background: 'rgba(8, 14, 20, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: '20px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: 10, color: '#F472B6', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                    Master Coaching
                  </span>
                  <span style={{ fontSize: 10, color: '#F87171', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-telemetry)' }}>
                    Capped at 25
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px' }}>
                  Coach Support
                </h3>
                <div style={{ fontFamily: 'var(--font-telemetry)', fontSize: 22, fontWeight: 800, color: '#F59E0B', marginBottom: 12 }}>
                  $199.00 <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>/ mo</span>
                </div>
                <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
                  Direct messaging with Coach Gordon (24h SLA), custom plan certification, and 8 Form Lab video audits per month.
                </p>
              </div>
            </div>

            {/* 1:1 Live Telehealth Studio Card */}
            <div
              style={{
                background: 'rgba(8, 14, 20, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: '20px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-telemetry)', fontSize: 10, color: '#34D399', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                    1:1 Telehealth
                  </span>
                  <span style={{ fontSize: 10, color: '#38BDF8', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-telemetry)' }}>
                    WebRTC 60fps
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px' }}>
                  Live Studio
                </h3>
                <div style={{ fontFamily: 'var(--font-telemetry)', fontSize: 22, fontWeight: 800, color: '#F59E0B', marginBottom: 12 }}>
                  $180 <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>/ session</span>
                </div>
                <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
                  Private 60-min live virtual coaching with slow-mo telestration. 4-session pack at $660 ($165/ea) or 8-pack at $1,240 ($155/ea).
                </p>
              </div>
            </div>
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
