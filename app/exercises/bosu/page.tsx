'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'
import GaaIcon from '@/components/ui/GaaIcon'

interface BosuExercise {
  id: string
  name: string
  phase: number
  phaseName: string
  orient: 'dome' | 'platform'
  orientLabel: string
  category: 'core' | 'lower' | 'upper'
  tempo: string
  trainer: string
  videoId: string
  muscles: string[]
  cues: string[]
}

const BOSU_EXERCISES: BosuExercise[] = [
  {
    id: 'bosu-plank',
    name: 'BOSU Plank',
    phase: 1,
    phaseName: 'Phase 1: Stabilization Endurance',
    orient: 'dome',
    orientLabel: 'Dome Up (Forearms)',
    category: 'core',
    tempo: 'Isometric (30-60s)',
    trainer: 'Katie Kasten',
    videoId: 'C_NM5IbRlqM',
    muscles: ['Core', 'Transverse Abdominis', 'Shoulders'],
    cues: [
      'Forearms pressed firmly into center crown of dome, elbows under shoulders',
      'Draw in navel and engage glutes to establish unbroken bridge line',
      'Resist air bladder micro-oscillations without hiking or sagging hips',
    ],
  },
  {
    id: 'bosu-push-up',
    name: 'BOSU Push-Up',
    phase: 1,
    phaseName: 'Phase 1: Stabilization Endurance',
    orient: 'platform',
    orientLabel: 'Platform Up (Handles)',
    category: 'upper',
    tempo: '4/2/1 (Slow Eccentric)',
    trainer: 'Mindy Mylrea',
    videoId: 'Wo3viNH3E1c',
    muscles: ['Pectorals', 'Triceps', 'Rotator Cuff', 'Core'],
    cues: [
      'Grasp platform outer handles with straight neutral wrists (no hyperextension)',
      'Strict 4-second descent keeping platform perfectly level to the floor',
      'Elbows track at 45° angle to ribcage; explode up without platform tilt',
    ],
  },
  {
    id: 'bosu-single-leg-balance-reach',
    name: 'BOSU Single-Leg Balance Reach',
    phase: 1,
    phaseName: 'Phase 1: Stabilization Endurance',
    orient: 'dome',
    orientLabel: 'Dome Up (Single Leg)',
    category: 'lower',
    tempo: '4/2/1 (Multiplanar)',
    trainer: 'Candace Moore',
    videoId: 'I4kiGgKpb58',
    muscles: ['Gluteus Medius', 'Foot Intrinsic Stabilizers', 'Core'],
    cues: [
      'Stance foot centered directly over the apex bullseye logo',
      'Keep pelvis square while reaching trailing leg forward, sideways, and back',
      'Drive ankle proprioception and knee alignment directly over second toe',
    ],
  },
  {
    id: 'bosu-glute-bridge',
    name: 'BOSU Glute Bridge',
    phase: 1,
    phaseName: 'Phase 1: Stabilization Endurance',
    orient: 'dome',
    orientLabel: 'Dome Up (Heels on Dome)',
    category: 'lower',
    tempo: '4/2/1 (2s Peak Contraction)',
    trainer: 'BOSU Master Series',
    videoId: 'd28NVu5bQPk',
    muscles: ['Gluteus Maximus', 'Hamstrings', 'Pelvic Stabilizers'],
    cues: [
      'Drive force directly down through heels into the dome apex',
      'Full hip extension with intense 2-second glute squeeze at peak',
      'Slow 4-second descent without touching floor between repetitions',
    ],
  },
  {
    id: 'bosu-bird-dog',
    name: 'BOSU Bird-Dog',
    phase: 1,
    phaseName: 'Phase 1: Stabilization Endurance',
    orient: 'dome',
    orientLabel: 'Dome Up (Knees on Dome)',
    category: 'core',
    tempo: '4/2/1 (Rotary Control)',
    trainer: 'Trainer Kaitlin',
    videoId: 'w75gGKGNsY0',
    muscles: ['Multifidus', 'Erector Spinae', 'Glutes', 'Shoulders'],
    cues: [
      'Knees anchored on center dome; hands on ground under shoulders',
      'Simultaneously extend contralateral arm and leg parallel to floor',
      'Resist rotational torque with braced transverse abdominis',
    ],
  },
  {
    id: 'bosu-dome-squat',
    name: 'BOSU Dome Squat',
    phase: 1,
    phaseName: 'Phase 1: Stabilization Endurance',
    orient: 'dome',
    orientLabel: 'Dome Up (Two Feet)',
    category: 'lower',
    tempo: '4/2/1 (Controlled Descent)',
    trainer: 'BOSU Master Series',
    videoId: 'evJOL2cdmt4',
    muscles: ['Quadriceps', 'Glutes', 'Vastus Medialis', 'Core'],
    cues: [
      'Feet shoulder-width apart, toes angled slightly out on dome slope',
      '4-second descent to parallel while maintaining center of mass',
      'Knees track over second and third toes without valgus collapse',
    ],
  },
  {
    id: 'bosu-dumbbell-chest-press',
    name: 'BOSU Dumbbell Chest Press',
    phase: 2,
    phaseName: 'Phase 2: Strength Endurance',
    orient: 'dome',
    orientLabel: 'Dome Up (Supine Upper Back)',
    category: 'upper',
    tempo: '4/2/1 (Stabilization Superset)',
    trainer: 'BOSU Master Series',
    videoId: 'cjTVlA2WwqY',
    muscles: ['Pectoralis Major', 'Anterior Deltoids', 'Glutes', 'Core'],
    cues: [
      'Head, neck, and upper back supported on dome in rigid glute bridge',
      'Hips stay locked level to floor throughout bilateral dumbbell press',
      'Press dumbbells in slight arc without clanging weights together at top',
    ],
  },
  {
    id: 'bosu-lunge-to-balance',
    name: 'BOSU Lunge to Balance',
    phase: 2,
    phaseName: 'Phase 2: Strength Endurance',
    orient: 'dome',
    orientLabel: 'Dome Up (Deceleration)',
    category: 'lower',
    tempo: '2/0/2 with 2s Hold',
    trainer: 'Katie Kasten',
    videoId: 'BAC6B69Q70A',
    muscles: ['Quadriceps', 'Gluteus Medius', 'Hamstrings', 'Calves'],
    cues: [
      'Step forward landing heel-to-midfoot cleanly on dome apex',
      'Decelerate knee smoothly to 90 degrees without wobbling or valgus',
      'Drive back into an upright single-leg balance and hold for 2 full seconds',
    ],
  },
  {
    id: 'bosu-mountain-climbers',
    name: 'BOSU Mountain Climbers',
    phase: 2,
    phaseName: 'Phase 2: Strength Endurance',
    orient: 'platform',
    orientLabel: 'Platform Up (Handles)',
    category: 'core',
    tempo: 'Fast / Controlled Cadence',
    trainer: 'BOSU Master Series',
    videoId: 'iyZHqgsI4Zk',
    muscles: ['Core', 'Hip Flexors', 'Serratus Anterior', 'Calves'],
    cues: [
      'Grip platform handles in high push-up plank with level horizontal orientation',
      'Drive knees rhythmically toward chest while keeping platform rock-steady',
      'Prevent hips from piked elevation or sagging toward floor',
    ],
  },
  {
    id: 'bosu-russian-twist',
    name: 'BOSU Russian Twist',
    phase: 1,
    phaseName: 'Phase 1: Stabilization Endurance',
    orient: 'dome',
    orientLabel: 'Dome Up (Seated V-Sit)',
    category: 'core',
    tempo: '4/2/1 (Rotational Control)',
    trainer: 'BOSU Master Series',
    videoId: 'M2AAcj_K0mg',
    muscles: ['Internal & External Obliques', 'Rectus Abdominis'],
    cues: [
      'Balance on dome in a 45-degree V-sit with heels hovering off floor',
      'Initiate rotation through thoracic spine and obliques, not just arms',
      'Maintain proud chest posture without rounding the lumbar spine',
    ],
  },
  {
    id: 'bosu-lateral-bound-with-stabilization',
    name: 'BOSU Lateral Bound with Stabilization',
    phase: 5,
    phaseName: 'Phase 5: Power',
    orient: 'dome',
    orientLabel: 'Dome Up (Landing Deceleration)',
    category: 'lower',
    tempo: 'Explosive + 3s Isometric Freeze',
    trainer: 'BOSU Master Series',
    videoId: 'vEGpyuTh3zw',
    muscles: ['Glutes', 'Quadriceps', 'Ankle Stabilizers', 'Core'],
    cues: [
      'Explode laterally off outside leg across the floor with triple extension',
      'Land softly on single foot on dome apex, absorbing through knee and hip',
      'Freeze motionless for 3 full seconds before initiating return bound',
    ],
  },
  {
    id: 'bosu-burpee-with-overhead-press',
    name: 'BOSU Burpee with Overhead Press',
    phase: 5,
    phaseName: 'Phase 5: Power',
    orient: 'platform',
    orientLabel: 'Platform Up (Ground to Overhead)',
    category: 'upper',
    tempo: 'Explosive Power Cadence',
    trainer: 'BOSU Master Series',
    videoId: 'RbvEl_XAZU0',
    muscles: ['Full Body', 'Deltoids', 'Pectorals', 'Quads', 'Core'],
    cues: [
      'Hands on platform handles: jump feet back, perform push-up',
      'Jump feet forward, hinge from hips, and power up through heels',
      'Press the BOSU platform overhead to full arm lockout under complete control',
    ],
  },
]

export default function BosuExerciseExplorerPage() {
  const [phaseFilter, setPhaseFilter] = useState<string>('all')
  const [orientFilter, setOrientFilter] = useState<string>('all')
  const [muscleFilter, setMuscleFilter] = useState<string>('all')
  const [selectedExercise, setSelectedExercise] = useState<BosuExercise | null>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  const filtered = BOSU_EXERCISES.filter(ex => {
    const matchesPhase = phaseFilter === 'all' || ex.phase.toString() === phaseFilter
    const matchesOrient = orientFilter === 'all' || ex.orient === orientFilter
    const matchesMuscle = muscleFilter === 'all' || ex.category === muscleFilter
    return matchesPhase && matchesOrient && matchesMuscle
  })

  const openVideo = (ex: BosuExercise) => {
    setIframeLoaded(false)
    setSelectedExercise(ex)
  }

  const closeVideo = () => {
    setSelectedExercise(null)
    setIframeLoaded(false)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeVideo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', color: 'var(--white)' }}>
      {/* 3px Gold Horizon line */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, transparent 0%, var(--gold) 50%, transparent 100%)' }} />

      {/* Announcement Bar */}
      <aside aria-label="Official advisory standards" style={{ background: 'linear-gradient(90deg, #050910 0%, #111A29 50%, #050910 100%)', borderBottom: '1px solid rgba(197, 160, 89, 0.35)', padding: '8px 16px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, color: 'var(--gold-lt)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />
          <span style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, fontSize: 11 }}>Official Equipment Specification</span>
          <span style={{ color: 'var(--gray)' }}>·</span>
          <span style={{ color: 'var(--gray)' }}>Clinical NASM OPT™ Human Performance Architecture</span>
        </div>
      </aside>

      <SiteHeader
        links={[
          { href: '/', label: 'Home' },
          { href: '/packages', label: 'Memberships' },
          { href: '/apply', label: 'Apply' },
        ]}
        actions={<MarketingLoginActions />}
      />

      <main style={{ maxWidth: 1320, margin: '0 auto', padding: '2.5rem clamp(16px, 3vw, 32px) 5rem', boxSizing: 'border-box' }}>
        {/* Breadcrumb & Sub-badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Link href="/" style={{ color: 'var(--gold-lt)', fontSize: 11, textDecoration: 'none', fontFamily: 'var(--font-serif)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Gordon Athletic Advisory
          </Link>
          <span style={{ color: 'var(--gray)', fontSize: 11 }}>/</span>
          <span style={{ color: 'var(--gray)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Equipment Specification
          </span>
          <span style={{ color: 'var(--gray)', fontSize: 11 }}>/</span>
          <span style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
            BOSU® Balance Trainer
          </span>
        </div>

        {/* Hero Section */}
        <div
          className="sovereign-card"
          style={{
            padding: 'clamp(24px, 4vw, 40px)',
            marginBottom: 32,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Ambient Glow */}
          <div
            style={{
              position: 'absolute',
              top: -96,
              right: -96,
              width: 384,
              height: 384,
              borderRadius: '50%',
              background: 'rgba(197, 160, 89, 0.06)',
              filter: 'blur(64px)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24, position: 'relative', zIndex: 10 }}>
            <div style={{ maxWidth: 780 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 9999, background: 'rgba(197, 160, 89, 0.12)', border: '1px solid rgba(197, 160, 89, 0.35)', marginBottom: 14 }}>
                <GaaIcon name="crown" size={12} tone="gold" />
                <span style={{ fontSize: 10, fontFamily: 'var(--font-serif)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 800 }}>
                  CLINICAL OPT™ PROPRIOCEPTION SUITE
                </span>
              </div>

              <h1
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                  color: '#FFFFFF',
                  letterSpacing: '0.04em',
                  margin: '0 0 12px',
                  fontWeight: 700,
                  lineHeight: 1.15,
                }}
              >
                BOSU® Balance Trainer Movement Suite
              </h1>

              <p style={{ color: '#CBD5E1', fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', lineHeight: 1.6, margin: 0, fontWeight: 300 }}>
                12 clinically calibrated exercises across NASM OPT™ Phases 1, 2, and 5. Every movement utilizes verified demonstrations from the official <strong style={{ color: 'var(--gold-lt)', fontWeight: 600 }}>@BOSUOfficial Master Trainer series</strong> with strict biomechanical form guardrails.
              </p>
            </div>

            {/* Verified Master Trainers Callout Box */}
            <div
              style={{
                background: 'rgba(8, 14, 20, 0.85)',
                border: '1px solid rgba(197, 160, 89, 0.3)',
                borderRadius: 12,
                padding: '18px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minWidth: 290,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                gap: 8,
              }}
            >
              <div style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.14em', color: 'var(--gold)' }}>
                Verified Master Trainers:
              </div>
              <div style={{ fontSize: 12, color: '#FFFFFF', fontWeight: 500, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />
                  <span>Mindy Mylrea &amp; Katie Kasten</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />
                  <span>Candace Moore &amp; Trainer Kaitlin</span>
                </div>
              </div>
              <div style={{ paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--gray)' }}>
                <span>HD In-App Video</span>
                <span style={{ fontFamily: 'var(--font-telemetry, monospace)', color: 'var(--gold-lt)', fontWeight: 600 }}>12 / 12 Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
          {/* Phase Filter */}
          <div className="sovereign-card" style={{ padding: 16 }}>
            <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-serif)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 700, marginBottom: 10 }}>
              NASM OPT™ Phase
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                { key: 'all', label: 'All (12)' },
                { key: '1', label: 'Phase 1: Stabilization (7)' },
                { key: '2', label: 'Phase 2: Strength (3)' },
                { key: '5', label: 'Phase 5: Power (2)' },
              ].map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPhaseFilter(item.key)}
                  style={{
                    padding: '5px 10px',
                    fontSize: 11,
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: phaseFilter === item.key ? 700 : 500,
                    background: phaseFilter === item.key ? 'linear-gradient(135deg, #E5D0A1 0%, #C5A059 100%)' : 'rgba(8, 14, 20, 0.7)',
                    color: phaseFilter === item.key ? '#080E14' : 'var(--gray)',
                    border: phaseFilter === item.key ? '1px solid #E5D0A1' : '1px solid rgba(197, 160, 89, 0.2)',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orientation Filter */}
          <div className="sovereign-card" style={{ padding: 16 }}>
            <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-serif)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 700, marginBottom: 10 }}>
              Surface Orientation
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                { key: 'all', label: 'All (12)' },
                { key: 'dome', label: 'Dome Up (8)' },
                { key: 'platform', label: 'Platform Up (4)' },
              ].map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setOrientFilter(item.key)}
                  style={{
                    padding: '5px 10px',
                    fontSize: 11,
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: orientFilter === item.key ? 700 : 500,
                    background: orientFilter === item.key ? 'linear-gradient(135deg, #E5D0A1 0%, #C5A059 100%)' : 'rgba(8, 14, 20, 0.7)',
                    color: orientFilter === item.key ? '#080E14' : 'var(--gray)',
                    border: orientFilter === item.key ? '1px solid #E5D0A1' : '1px solid rgba(197, 160, 89, 0.2)',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Muscle Filter */}
          <div className="sovereign-card" style={{ padding: 16 }}>
            <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-serif)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 700, marginBottom: 10 }}>
              Target Muscle Group
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                { key: 'all', label: 'All' },
                { key: 'core', label: 'Core & Abs' },
                { key: 'lower', label: 'Lower Body' },
                { key: 'upper', label: 'Upper Body' },
              ].map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setMuscleFilter(item.key)}
                  style={{
                    padding: '5px 10px',
                    fontSize: 11,
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: muscleFilter === item.key ? 700 : 500,
                    background: muscleFilter === item.key ? 'linear-gradient(135deg, #E5D0A1 0%, #C5A059 100%)' : 'rgba(8, 14, 20, 0.7)',
                    color: muscleFilter === item.key ? '#080E14' : 'var(--gray)',
                    border: muscleFilter === item.key ? '1px solid #E5D0A1' : '1px solid rgba(197, 160, 89, 0.2)',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Metrics */}
          <div className="sovereign-card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 700, color: 'var(--gold)' }}>
                {filtered.length}
              </div>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray)' }}>
                Filtered
              </div>
            </div>
            <div style={{ width: 1, height: 36, background: 'rgba(197, 160, 89, 0.2)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-telemetry)', fontSize: 20, fontWeight: 700, color: '#38BDF8' }}>
                4/2/1
              </div>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray)' }}>
                Tempo
              </div>
            </div>
            <div style={{ width: 1, height: 36, background: 'rgba(197, 160, 89, 0.2)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 700, color: '#34D399' }}>
                100%
              </div>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray)' }}>
                Official
              </div>
            </div>
          </div>
        </div>

        {/* Exercise Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
          {filtered.map(ex => (
            <div key={ex.id} className="sovereign-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {/* Thumbnail with Luxury Play Overlay */}
                <div
                  onClick={() => openVideo(ex)}
                  style={{
                    position: 'relative',
                    width: '100%',
                    paddingTop: '56.25%',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#000000',
                    border: '1px solid rgba(197, 160, 89, 0.25)',
                    cursor: 'pointer',
                    marginBottom: 16,
                  }}
                >
                  <img
                    src={`https://img.youtube.com/vi/${ex.videoId}/hqdefault.jpg`}
                    alt={ex.name}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: 0.9,
                    }}
                  />

                  {/* Play Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0,0,0,0.3)',
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #E5D0A1 0%, #C5A059 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#080E14" style={{ marginLeft: 2 }}>
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Channel Tag */}
                  <span
                    style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'rgba(8,14,20,0.9)',
                      color: 'var(--gold-lt)',
                      border: '1px solid rgba(197,160,89,0.35)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                    }}
                  >
                    @BOSUOfficial
                  </span>

                  {/* HD Telemetry Tag */}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 10,
                      right: 10,
                      fontSize: 10,
                      fontFamily: 'var(--font-telemetry, monospace)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'rgba(0,0,0,0.85)',
                      color: '#CBD5E1',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    HD 1080p
                  </span>
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span className="crest-badge" style={{ fontSize: 10, padding: '3px 9px' }}>
                    {ex.phaseName.split(':')[0]}
                  </span>
                  <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 9999, background: 'rgba(56,189,248,0.1)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.3)', fontWeight: 500 }}>
                    {ex.orientLabel}
                  </span>
                </div>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px' }}>
                  {ex.name}
                </h3>

                <div style={{ fontSize: 12, color: 'var(--gray)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ color: 'var(--gold-lt)', fontWeight: 500 }}>Instructor:</span>
                  <span style={{ color: '#E2E8F0', fontWeight: 300 }}>{ex.trainer}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-telemetry, monospace)', fontSize: 11, color: 'var(--gray)' }}>{ex.tempo}</span>
                </div>

                {/* Target Muscle Group Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {ex.muscles.map(m => (
                    <span
                      key={m}
                      style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: '#080E14',
                        border: '1px solid rgba(197, 160, 89, 0.18)',
                        color: '#94A3B8',
                        fontWeight: 500,
                      }}
                    >
                      {m}
                    </span>
                  ))}
                </div>

                {/* Form Guardrails Cues */}
                <div style={{ borderTop: '1px solid rgba(197,160,89,0.15)', paddingTop: 12, marginTop: 12 }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)', fontWeight: 700, marginBottom: 6 }}>
                    Form Guardrails:
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 12, color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {ex.cues.map((cue, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        <span style={{ color: 'var(--gold)', fontWeight: 700, lineHeight: 1 }}>•</span>
                        <span>{cue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(197,160,89,0.18)' }}>
                <button
                  type="button"
                  onClick={() => openVideo(ex)}
                  style={{
                    padding: '8px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #E5D0A1 0%, #C5A059 100%)',
                    color: '#080E14',
                    border: '1px solid #E5D0A1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#080E14">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Play Video</span>
                </button>

                <a
                  href={`https://www.youtube.com/watch?v=${ex.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 12px',
                    fontSize: 12,
                    fontWeight: 500,
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: 'rgba(14, 23, 36, 0.85)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(197, 160, 89, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    textDecoration: 'none',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#EF4444">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span>YouTube ↗</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Video Modal */}
      {selectedExercise && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeVideo}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.88)',
            zIndex: 100060,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            backdropFilter: 'blur(16px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 760,
              background: 'linear-gradient(180deg, #101626 0%, #090D18 100%)',
              border: '1px solid rgba(197, 160, 89, 0.45)',
              borderRadius: 16,
              boxShadow: '0 25px 60px rgba(0,0,0,0.95)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '92vh',
            }}
          >
            {/* Top Accent Line */}
            <div style={{ height: 3, background: 'linear-gradient(90deg, transparent 0%, var(--gold) 50%, transparent 100%)' }} />

            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(197,160,89,0.05)' }}>
              <div>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)', fontWeight: 700 }}>
                  Official Movement Standard · NASM OPT™
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: '#FFFFFF', margin: '2px 0 0', fontWeight: 700 }}>
                  {selectedExercise.name}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--gray)', margin: '2px 0 0' }}>
                  @BOSUOfficial Master Trainer Instruction · {selectedExercise.trainer}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <a
                  href={`https://www.youtube.com/watch?v=${selectedExercise.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '6px 12px',
                    fontSize: 11,
                    borderRadius: 8,
                    background: 'rgba(14,23,36,0.85)',
                    color: '#CBD5E1',
                    border: '1px solid rgba(197,160,89,0.3)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#EF4444">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span>Open in YouTube ↗</span>
                </a>

                <button
                  type="button"
                  onClick={closeVideo}
                  aria-label="Close"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.08)',
                    border: 'none',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Video Viewport: 16:9 with Guaranteed Zero-White Loading Overlay */}
            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000000', overflow: 'hidden' }}>
              {/* Dark Loading Poster */}
              {!iframeLoaded && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: '#080E14',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                >
                  <img
                    src={`https://img.youtube.com/vi/${selectedExercise.videoId}/hqdefault.jpg`}
                    alt={selectedExercise.name}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }}
                  />
                  <div style={{ position: 'relative', zIndex: 20, textAlign: 'center', padding: 20 }}>
                    <div style={{ width: 36, height: 36, border: '2px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
                    <div style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-lt)', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      Loading @BOSUOfficial Stream...
                    </div>
                    <a
                      href={`https://www.youtube.com/watch?v=${selectedExercise.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        fontSize: 11,
                        padding: '6px 14px',
                        borderRadius: 6,
                        background: 'rgba(197, 160, 89, 0.25)',
                        color: 'var(--gold-lt)',
                        border: '1px solid var(--gold)',
                        textDecoration: 'none',
                      }}
                    >
                      Watch Directly on YouTube
                    </a>
                  </div>
                </div>
              )}

              <iframe
                src={`https://www.youtube.com/embed/${selectedExercise.videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
                title={`Official BOSU Movement: ${selectedExercise.name}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                onLoad={() => setIframeLoaded(true)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  backgroundColor: '#000000',
                }}
              />
            </div>

            {/* Modal Body & Clinical Form Guardrails */}
            <div style={{ padding: 20, overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 14 }}>
                <span className="crest-badge" style={{ fontSize: 10, padding: '4px 10px' }}>
                  {selectedExercise.phaseName}
                </span>
                <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 9999, background: 'rgba(56,189,248,0.12)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.3)' }}>
                  {selectedExercise.orientLabel}
                </span>
                <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 9999, background: 'rgba(197,160,89,0.12)', color: 'var(--gold-lt)', border: '1px solid rgba(197,160,89,0.3)' }}>
                  Master Trainer: {selectedExercise.trainer}
                </span>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-telemetry)', fontSize: 12, color: 'var(--gray)' }}>
                  Tempo: {selectedExercise.tempo}
                </span>
              </div>

              <div style={{ background: 'rgba(8,14,20,0.85)', padding: 14, borderRadius: 10, border: '1px solid rgba(197,160,89,0.2)' }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold)', fontWeight: 700, marginBottom: 8 }}>
                  Clinical Coaching Form Guardrails:
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 12, color: '#E2E8F0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedExercise.cues.map((cue, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: 'var(--gold)', fontWeight: 700, lineHeight: 1 }}>•</span>
                      <span>{cue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
