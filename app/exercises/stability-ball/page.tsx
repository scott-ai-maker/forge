'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'
import GaaIcon from '@/components/ui/GaaIcon'

interface StabilityBallExercise {
  id: string
  name: string
  phase: number
  phaseName: string
  sizing: string
  category: 'core' | 'lower' | 'upper'
  tempo: string
  trainer: string
  videoId: string
  muscles: string[]
  cues: string[]
}

const STABILITY_BALL_EXERCISES: StabilityBallExercise[] = [
  {
    id: 'stability-ball-hamstring-curl',
    name: 'Stability Ball Hamstring Curl',
    phase: 1,
    phaseName: 'Phase 1: Stabilization Endurance',
    sizing: '55-65 cm',
    category: 'lower',
    tempo: '4/2/1 (Controlled Eccentric)',
    trainer: 'NASM Edge Master Series',
    videoId: 'Z3cY3d3BBo4',
    muscles: ['Hamstrings', 'Gluteus Maximus', 'Calves', 'Core'],
    cues: [
      'Drive hips upward into full bridge with heels dug firmly into ball center',
      'Curl heels smoothly toward glutes without allowing hips to sag toward floor',
      'Maintain rigid pelvic alignment and slow 4-second eccentric rollout',
    ],
  },
  {
    id: 'stability-ball-push-up',
    name: 'Stability Ball Push-Up',
    phase: 1,
    phaseName: 'Phase 1: Stabilization Endurance',
    sizing: '55-65 cm',
    category: 'upper',
    tempo: '4/2/1 (Slow Eccentric)',
    trainer: 'Sofia Gotzi, PT (TheraBand Protocol)',
    videoId: 'pxpGo3EtwkM',
    muscles: ['Pectoralis Major', 'Triceps', 'Rotator Cuff', 'Anterior Core'],
    cues: [
      'Place palms shoulder-width apart on ball apex, fingers spread wide',
      'Lower chest toward ball over 4 controlled seconds, keeping elbows tucked 45°',
      'Push aggressively through palms without letting the ball roll or wobble',
    ],
  },
  {
    id: 'stability-ball-wall-squat',
    name: 'Stability Ball Wall Squat',
    phase: 1,
    phaseName: 'Phase 1: Stabilization Endurance',
    sizing: '65-75 cm',
    category: 'lower',
    tempo: '4/2/1 (Slow Descent)',
    trainer: 'Chad Blair (TheraBand Protocol)',
    videoId: '2TOqw5wSfgE',
    muscles: ['Quadriceps', 'Gluteus Medius', 'Vastus Medialis', 'Lumbar Erectors'],
    cues: [
      'Position ball snug against small of lower back and smooth wall surface',
      'Walk feet 12-18 inches forward, hip-width apart, toes pointing straight',
      'Descend smoothly to 90° knee flexion while maintaining constant back-to-ball pressure',
    ],
  },
  {
    id: 'stability-ball-crunch',
    name: 'Stability Ball Crunch',
    phase: 1,
    phaseName: 'Phase 1: Stabilization Endurance',
    sizing: '55-65 cm',
    category: 'core',
    tempo: '4/2/1 (2s Peak Hold)',
    trainer: 'NASM Edge Master Series',
    videoId: 'QFLftqPWjoI',
    muscles: ['Rectus Abdominis', 'Transverse Abdominis', 'Internal Obliques'],
    cues: [
      'Lie supine with ball positioned under lumbar curve and thoracic spine draped back',
      'Support head lightly with fingertips; avoid pulling on cervical spine',
      'Exhale and flex spine upward over ball, holding 2-second peak isometric crunch',
    ],
  },
  {
    id: 'stability-ball-dumbbell-chest-press',
    name: 'Stability Ball Dumbbell Chest Press',
    phase: 2,
    phaseName: 'Phase 2: Strength Endurance',
    sizing: '55-65 cm',
    category: 'upper',
    tempo: '2/0/2 (Strength Phase)',
    trainer: 'Performance Health Master Series',
    videoId: 'FfTyQAYrnqM',
    muscles: ['Pectoralis Major', 'Anterior Deltoids', 'Triceps', 'Gluteus Maximus'],
    cues: [
      'Rest head, neck, and upper back firmly on ball with torso parallel to floor in bridge',
      'Squeeze glutes to lock hips horizontal throughout entire bilateral dumbbell press',
      'Press dumbbells in smooth arc directly over chest without flaring elbows past 90°',
    ],
  },
  {
    id: 'stability-ball-prone-cobra',
    name: 'Stability Ball Prone Cobra (W-Y Raise)',
    phase: 1,
    phaseName: 'Phase 1: Stabilization Endurance',
    sizing: '55-65 cm',
    category: 'core',
    tempo: '4/2/1 (Scapular Retraction)',
    trainer: 'Performance Health Master Series',
    videoId: 'j6D0V742sT8',
    muscles: ['Lower Trapezius', 'Rhomboids', 'Infraspinatus', 'Erector Spinae'],
    cues: [
      'Lie prone with chest and pelvis anchored on ball, feet anchored wide against floor',
      'Retract and depress shoulder blades, driving thumbs toward ceiling in W to Y transition',
      'Keep chin tucked in neutral cervical alignment; avoid hyperextending neck',
    ],
  },
  {
    id: 'stability-ball-roll-in',
    name: 'Stability Ball Roll-In / Pike',
    phase: 2,
    phaseName: 'Phase 2: Strength Endurance',
    sizing: '55-65 cm',
    category: 'core',
    tempo: '2/0/2 (Dynamic Core)',
    trainer: 'NASM Edge Master Series',
    videoId: 'ZquTk8GmA_I',
    muscles: ['Rectus Abdominis', 'Iliopsoas', 'Serratus Anterior', 'Shoulders'],
    cues: [
      'Start in rigid push-up plank with shins resting centered on ball apex',
      'Contract core and pull knees toward chest (or pike hips straight up over shoulders)',
      'Control return smoothly without hyperextending lumbar spine at bottom',
    ],
  },
  {
    id: 'stability-ball-back-extension',
    name: 'Stability Ball Back Extension with Rotation',
    phase: 1,
    phaseName: 'Phase 1: Stabilization Endurance',
    sizing: '55-65 cm',
    category: 'core',
    tempo: '4/2/1 (Rotational Control)',
    trainer: 'NASM Edge Master Series',
    videoId: 'b_Iri5nayDk',
    muscles: ['Erector Spinae', 'Internal & External Obliques', 'Multifidus'],
    cues: [
      'Anchor anterior pelvis and thighs on ball with feet braced against wall or floor',
      'Cross arms over chest or fingertips at ears; lower torso over ball curve',
      'Extend spine to neutral alignment, then rotate torso 15-20° under strict control',
    ],
  },
  {
    id: 'stability-ball-loaded-bridge',
    name: 'Stability Ball Loaded Bridge',
    phase: 1,
    phaseName: 'Phase 1: Stabilization Endurance',
    sizing: '55-65 cm',
    category: 'lower',
    tempo: '4/2/1 (2s Peak Squeeze)',
    trainer: 'NASM Edge Master Series',
    videoId: 'wgcyPpK60wc',
    muscles: ['Gluteus Maximus', 'Biceps Femoris', 'Transverse Abdominis'],
    cues: [
      'Upper back and scapulae resting on ball, knees bent at 90°, feet flat on floor',
      'Lower hips toward floor, then drive through heels to full hip extension',
      'Maintain level pelvis without swaying; squeeze glutes intensely at top',
    ],
  },
  {
    id: 'stability-ball-russian-twist',
    name: 'Stability Ball Russian Twist',
    phase: 1,
    phaseName: 'Phase 1: Stabilization Endurance',
    sizing: '55-65 cm',
    category: 'core',
    tempo: '4/2/1 (Anti-Rotation)',
    trainer: 'Performance Health Academy Network',
    videoId: 't3HhJ_LolVg',
    muscles: ['Internal & External Obliques', 'Transverse Abdominis', 'Glutes'],
    cues: [
      'Lie supine in bridge position with head and shoulders supported on ball',
      'Clasp hands straight up over chest; rotate torso onto one shoulder',
      'Keep hips elevated and level with floor throughout rotation; resist hip drop',
    ],
  },
  {
    id: 'stability-ball-scapular-triad',
    name: 'Stability Ball Scapular Triad (Ball Combo I)',
    phase: 1,
    phaseName: 'Phase 1: Stabilization Endurance',
    sizing: '55-65 cm',
    category: 'upper',
    tempo: '4/2/1 (Posterior Chain)',
    trainer: 'NASM Edge Master Series',
    videoId: 'xb3-dysLHpE',
    muscles: ['Middle Trapezius', 'Lower Trapezius', 'Posterior Deltoids', 'Rhomboids'],
    cues: [
      'Chest supported on ball, light dumbbells in hands, neutral head position',
      'Perform controlled Y-raise, T-raise, and W-scapular squeeze sequence',
      'Focus on scapular depression and retraction; avoid shrugging upper traps',
    ],
  },
  {
    id: 'stability-ball-prone-shoulder-press',
    name: 'Stability Ball Prone Shoulder Press',
    phase: 2,
    phaseName: 'Phase 2: Strength Endurance',
    sizing: '55-65 cm',
    category: 'upper',
    tempo: '2/0/2 (Overhead Control)',
    trainer: 'NASM Edge Master Series',
    videoId: 'VZJ0PHuNrYI',
    muscles: ['Deltoids', 'Triceps', 'Erector Spinae', 'Glutes'],
    cues: [
      'Prone on ball with toes anchored to ground, holding light dumbbells at shoulders',
      'Maintain rigid posterior chain line from heels through crown of head',
      'Press weights overhead in scapular plane without arching lumbar spine',
    ],
  },
]

export default function StabilityBallPage() {
  const [activeTab, setActiveTab] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedExercise, setSelectedExercise] = useState<StabilityBallExercise | null>(null)
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false)

  const openVideo = (ex: StabilityBallExercise) => {
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

  const filteredExercises = STABILITY_BALL_EXERCISES.filter((ex) => {
    let matchesTab = true
    if (activeTab === 'phase1') matchesTab = ex.phase === 1
    else if (activeTab === 'phase2') matchesTab = ex.phase === 2
    else if (activeTab === 'core') matchesTab = ex.category === 'core'
    else if (activeTab === 'upper') matchesTab = ex.category === 'upper'
    else if (activeTab === 'lower') matchesTab = ex.category === 'lower'

    const query = searchQuery.toLowerCase().trim()
    const matchesQuery =
      query === '' ||
      ex.name.toLowerCase().includes(query) ||
      ex.trainer.toLowerCase().includes(query) ||
      ex.muscles.some((m) => m.toLowerCase().includes(query)) ||
      ex.cues.some((c) => c.toLowerCase().includes(query))

    return matchesTab && matchesQuery
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', color: 'var(--white)' }}>
      {/* 3px Crimson & Gold Horizon Line */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, transparent 0%, #E31837 35%, var(--gold) 50%, #E31837 65%, transparent 100%)' }} />

      {/* Official Announcement Bar */}
      <aside aria-label="Official advisory standards" style={{ background: 'linear-gradient(90deg, #180509 0%, #260A10 50%, #180509 100%)', borderBottom: '1px solid rgba(227, 24, 55, 0.35)', padding: '8px 16px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, color: '#fda4af' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E31837', boxShadow: '0 0 8px #E31837', display: 'inline-block' }} />
          <span style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, fontSize: 11 }}>Official Equipment Specification</span>
          <span style={{ color: 'var(--gray)' }}>·</span>
          <span style={{ fontWeight: 600, color: '#FFFFFF' }}>TheraBand® Pro Series SCP® Stability Ball</span>
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
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Link href="/" style={{ color: 'var(--gold-lt)', fontSize: 11, textDecoration: 'none', fontFamily: 'var(--font-serif)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Gordon Athletic Advisory
          </Link>
          <span style={{ color: 'var(--gray)', fontSize: 11 }}>/</span>
          <span style={{ color: 'var(--gray)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Equipment Specification
          </span>
          <span style={{ color: 'var(--gray)', fontSize: 11 }}>/</span>
          <span style={{ color: '#fda4af', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
            TheraBand® Pro Series SCP®
          </span>
        </div>

        {/* Hero Banner Section */}
        <div
          className="sovereign-card"
          style={{
            padding: 'clamp(24px, 4vw, 40px)',
            marginBottom: 28,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Ambient Crimson Glow */}
          <div
            style={{
              position: 'absolute',
              top: -96,
              right: -96,
              width: 420,
              height: 420,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(227, 24, 55, 0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24, position: 'relative', zIndex: 10 }}>
            <div style={{ maxWidth: 780 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 9999, background: 'rgba(227, 24, 55, 0.12)', border: '1px solid rgba(227, 24, 55, 0.35)', marginBottom: 14 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E31837' }} />
                <span style={{ fontSize: 10, fontFamily: 'var(--font-serif)', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fda4af', fontWeight: 800 }}>
                  PERFORMANCE HEALTH · OFFICIAL THERABAND® STANDARD
                </span>
              </div>

              <h1
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                  color: '#FFFFFF',
                  letterSpacing: '0.02em',
                  margin: '0 0 12px',
                  fontWeight: 700,
                  lineHeight: 1.15,
                }}
              >
                TheraBand® Pro Series SCP® Stability Ball
              </h1>

              <p style={{ color: '#CBD5E1', fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', lineHeight: 1.6, margin: 0, fontWeight: 300 }}>
                12 clinically calibrated movements across NASM OPT™ Phases 1 (Stabilization Endurance) and 2 (Strength Endurance). Engineered with slow-deflate SCP® security matrix, exact color-diameter sizing, and strict spinal-stabilization guardrails.
              </p>
            </div>

            {/* Performance Health Callout Box */}
            <div
              style={{
                background: 'rgba(8, 14, 20, 0.85)',
                border: '1px solid rgba(227, 24, 55, 0.3)',
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
              <div style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.14em', color: '#fda4af' }}>
                Verified Master Instruction:
              </div>
              <div style={{ fontSize: 12, color: '#FFFFFF', fontWeight: 500, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E31837', display: 'inline-block' }} />
                  <span>Performance Health Master Series</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E31837', display: 'inline-block' }} />
                  <span>Sofia Gotzi, PT &amp; Chad Blair (TheraBand)</span>
                </div>
              </div>
              <div style={{ paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--gray)' }}>
                <span>HD Video Coverage</span>
                <span style={{ fontFamily: 'var(--font-telemetry, monospace)', color: '#fda4af', fontWeight: 600 }}>12 / 12 Movements</span>
              </div>
            </div>
          </div>
        </div>

        {/* Slow-Deflate Sizing Matrix Card */}
        <div
          className="sovereign-card"
          style={{
            padding: '16px 20px',
            marginBottom: 28,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'rgba(13, 18, 28, 0.75)',
            border: '1px solid rgba(227, 24, 55, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontFamily: 'var(--font-telemetry, monospace)', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fda4af', fontWeight: 600, marginBottom: 10 }}>
            <span>⚡</span>
            <span>TheraBand Slow-Deflate (SCP®) Color-Diameter Sizing Progression</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
            {[
              { size: '45 cm', color: '#FBBF24', name: 'Yellow', height: "Athletes < 5'0\" (< 152 cm)" },
              { size: '55 cm', color: '#EF4444', name: 'Red', height: "Athletes 5'1\" - 5'6\" (155-168 cm)" },
              { size: '65 cm', color: '#10B981', name: 'Green', height: "Athletes 5'7\" - 6'1\" (170-185 cm)" },
              { size: '75 cm', color: '#3B82F6', name: 'Blue', height: "Athletes 6'2\" - 6'8\" (188-203 cm)" },
              { size: '85 cm', color: '#94A3B8', name: 'Silver', height: "Athletes > 6'8\" (> 203 cm)" },
            ].map((item) => (
              <div
                key={item.size}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 12px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: 11,
                  fontFamily: 'var(--font-telemetry, monospace)',
                  color: '#CBD5E1',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{item.size} ({item.name}):</span>
                <span>{item.height}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Controls & Search Strip */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            marginBottom: 28,
            paddingBottom: 20,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              { id: 'all', label: 'All Movements (12)' },
              { id: 'phase1', label: 'Phase 1: Stabilization (8)' },
              { id: 'phase2', label: 'Phase 2: Strength Endurance (4)' },
              { id: 'core', label: 'Core (5)' },
              { id: 'upper', label: 'Upper Body (4)' },
              { id: 'lower', label: 'Lower Body (3)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: 'var(--font-telemetry, monospace)',
                  cursor: 'pointer',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  background: activeTab === tab.id ? 'linear-gradient(135deg, #E31837 0%, #b91c1c 100%)' : 'rgba(8, 14, 20, 0.7)',
                  color: activeTab === tab.id ? '#FFFFFF' : 'var(--gray)',
                  border: activeTab === tab.id ? '1px solid #E31837' : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: activeTab === tab.id ? '0 0 12px rgba(227, 24, 55, 0.4)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ minWidth: 260 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movements, cues, trainers..."
              style={{
                width: '100%',
                padding: '7px 14px',
                borderRadius: 8,
                background: 'rgba(8, 14, 20, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                fontSize: 12,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Exercises Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
          {filteredExercises.map((ex) => {
            const isPhase1 = ex.phase === 1
            const channelBadge = ex.trainer.includes('TheraBand') || ex.trainer.includes('Performance')
              ? 'TheraBand® Official'
              : 'NASM Edge'

            return (
              <div
                key={ex.id}
                className="sovereign-card"
                style={{
                  padding: 22,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 16,
                }}
              >
                <div>
                  {/* Thumbnail Container with Play Overlay */}
                  <div
                    onClick={() => openVideo(ex)}
                    style={{
                      position: 'relative',
                      width: '100%',
                      paddingTop: '56.25%',
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: '#000000',
                      border: '1px solid rgba(227, 24, 55, 0.25)',
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
                        background: 'rgba(0, 0, 0, 0.35)',
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #E31837 0%, #b91c1c 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 16px rgba(227, 24, 55, 0.6)',
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF" style={{ marginLeft: 2, flexShrink: 0 }}>
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
                        fontFamily: 'var(--font-telemetry, monospace)',
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: 'rgba(8, 14, 20, 0.9)',
                        color: '#fda4af',
                        border: '1px solid rgba(227, 24, 55, 0.4)',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      {channelBadge}
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
                        background: 'rgba(0, 0, 0, 0.85)',
                        color: '#CBD5E1',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      HD 1080p
                    </span>
                  </div>

                  {/* Header Badges: Phase & Tempo */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span
                      style={{
                        fontSize: 10,
                        padding: '3px 9px',
                        borderRadius: 6,
                        fontWeight: 600,
                        fontFamily: 'var(--font-telemetry, monospace)',
                        textTransform: 'uppercase',
                        background: isPhase1 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                        color: isPhase1 ? '#34d399' : '#60a5fa',
                        border: isPhase1 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                      }}
                    >
                      {ex.phaseName.split(':')[0]}
                    </span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-telemetry, monospace)', color: 'var(--gray)' }}>
                      {ex.tempo.split(' ')[0]}
                    </span>
                  </div>

                  {/* Exercise Title */}
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: '0 0 6px' }}>
                    {ex.name}
                  </h3>

                  {/* Instructor & Sizing Info */}
                  <div style={{ fontSize: 12, color: 'var(--gray)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span style={{ color: '#fda4af', fontWeight: 500 }}>Protocol:</span>
                    <span style={{ color: '#E2E8F0', fontWeight: 300 }}>{ex.trainer}</span>
                    <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-telemetry, monospace)', fontSize: 11, color: '#fda4af' }}>
                      {ex.sizing}
                    </span>
                  </div>

                  {/* Target Muscle Group Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {ex.muscles.map((m) => (
                      <span
                        key={m}
                        style={{
                          fontSize: 10,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: '#080E14',
                          border: '1px solid rgba(227, 24, 55, 0.18)',
                          color: '#94A3B8',
                          fontWeight: 500,
                        }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>

                  {/* Biomechanical Guardrails Cues Box */}
                  <div style={{ background: 'rgba(0, 0, 0, 0.35)', borderLeft: '2px solid #E31837', padding: '10px 12px', borderRadius: '0 8px 8px 0', marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-telemetry, monospace)', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fda4af', fontWeight: 700, marginBottom: 6 }}>
                      Biomechanical Guardrails:
                    </div>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 12, color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {ex.cues.map((cue, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                          <span style={{ color: '#E31837', fontWeight: 700, lineHeight: 1 }}>•</span>
                          <span>{cue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <button
                    type="button"
                    onClick={() => openVideo(ex)}
                    style={{
                      padding: '8px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      borderRadius: 10,
                      cursor: 'pointer',
                      background: 'linear-gradient(135deg, #E31837 0%, #b91c1c 100%)',
                      color: '#FFFFFF',
                      border: '1px solid #E31837',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: '0 4px 12px rgba(227, 24, 55, 0.3)',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF" style={{ flexShrink: 0 }}>
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
                      border: '1px solid rgba(227, 24, 55, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      textDecoration: 'none',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#EF4444" style={{ flexShrink: 0 }}>
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    <span>YouTube ↗</span>
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Video Modal Player with Zero-White Loading State */}
      {selectedExercise && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeVideo}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.88)',
            zIndex: 100060,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            backdropFilter: 'blur(16px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 760,
              background: 'linear-gradient(180deg, #101626 0%, #090D18 100%)',
              border: '1px solid rgba(227, 24, 55, 0.45)',
              borderRadius: 16,
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '92vh',
            }}
          >
            {/* Top Crimson Accent Line */}
            <div style={{ height: 3, background: 'linear-gradient(90deg, transparent 0%, #E31837 50%, transparent 100%)' }} />

            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(227, 24, 55, 0.06)' }}>
              <div>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-telemetry, monospace)', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#fda4af', fontWeight: 700 }}>
                  Official Movement Standard · NASM OPT™
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: '#FFFFFF', margin: '2px 0 0', fontWeight: 700 }}>
                  {selectedExercise.name}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--gray)', margin: '2px 0 0' }}>
                  {selectedExercise.trainer} · Ball Size: {selectedExercise.sizing}
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
                    background: 'rgba(14, 23, 36, 0.85)',
                    color: '#CBD5E1',
                    border: '1px solid rgba(227, 24, 55, 0.3)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#EF4444" style={{ flexShrink: 0 }}>
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
                    background: 'rgba(255, 255, 255, 0.08)',
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

            {/* Video Viewport: 16:9 with Zero-White Loading Overlay */}
            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000000', overflow: 'hidden' }}>
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
                    <div style={{ width: 36, height: 36, border: '2px solid #E31837', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
                    <div style={{ fontFamily: 'var(--font-serif)', color: '#fda4af', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      Loading Video Demonstration...
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
                        background: 'rgba(227, 24, 55, 0.25)',
                        color: '#fda4af',
                        border: '1px solid #E31837',
                        textDecoration: 'none',
                      }}
                    >
                      Watch Directly on YouTube
                    </a>
                  </div>
                </div>
              )}

              <iframe
                src={`https://www.youtube-nocookie.com/embed/${selectedExercise.videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
                title={`TheraBand Stability Ball Movement: ${selectedExercise.name}`}
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
                <span
                  style={{
                    fontSize: 10,
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontWeight: 600,
                    fontFamily: 'var(--font-telemetry, monospace)',
                    background: selectedExercise.phase === 1 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                    color: selectedExercise.phase === 1 ? '#34d399' : '#60a5fa',
                    border: selectedExercise.phase === 1 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                  }}
                >
                  {selectedExercise.phaseName}
                </span>
                <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 9999, background: 'rgba(227, 24, 55, 0.12)', color: '#fda4af', border: '1px solid rgba(227, 24, 55, 0.3)' }}>
                  Protocol: {selectedExercise.trainer}
                </span>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-telemetry, monospace)', fontSize: 12, color: 'var(--gray)' }}>
                  Tempo: {selectedExercise.tempo} · Sizing: {selectedExercise.sizing}
                </span>
              </div>

              <div style={{ background: 'rgba(8, 14, 20, 0.85)', padding: 14, borderRadius: 10, border: '1px solid rgba(227, 24, 55, 0.2)' }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#fda4af', fontWeight: 700, marginBottom: 8 }}>
                  Clinical Coaching Form Guardrails:
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 12, color: '#E2E8F0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedExercise.cues.map((cue, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: '#E31837', fontWeight: 700, lineHeight: 1 }}>•</span>
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
