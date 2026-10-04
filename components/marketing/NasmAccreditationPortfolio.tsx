'use client'

import React, { useState, useMemo } from 'react'
import GaaIcon, { GaaIconName } from '@/components/ui/GaaIcon'

export type CredentialCategory = 'all' | 'clinical' | 'performance' | 'metabolic' | 'specialized'

export interface NasmCredential {
  id: string
  code: string
  title: string
  category: CredentialCategory
  categoryLabel: string
  badgeTone: string
  icon: GaaIconName
  status: string
  statusType: 'board_review' | 'candidate' | 'specialization' | 'pinnacle'
  summary: string
  curriculum: string[]
  gaaEngineIntegration: string
  keyAlgorithmicModule: string
}

export const NASM_CREDENTIALS_DATA: NasmCredential[] = [
  {
    id: 'cpt',
    code: 'NASM-CPT®',
    title: 'Certified Personal Trainer',
    category: 'clinical',
    categoryLabel: 'Clinical & Biomechanics',
    badgeTone: '#C5A059',
    icon: 'award',
    status: 'Board Review Finalization',
    statusType: 'board_review',
    summary: 'Core foundation of the Optimum Performance Training (OPT™) model spanning 5 physiological periodization phases.',
    curriculum: [
      '5-Phase OPT™ Periodization Architecture',
      'Kinetic Chain Anatomy & Dynamic Posture',
      'Neuromuscular Stabilization & Proprioception',
      'Acute Training Variable Modulation (Tempo, Reps, Rest)',
    ],
    gaaEngineIntegration: 'Powers the core program generation engine (`lib/nasm-opt-exercise-selection.ts`), tempo constraints (4-2-1-1 to explosive), and automated progression logic.',
    keyAlgorithmicModule: 'OPT™ 5-Phase Periodization Engine',
  },
  {
    id: 'ces',
    code: 'NASM-CES®',
    title: 'Corrective Exercise Specialist',
    category: 'clinical',
    categoryLabel: 'Clinical & Biomechanics',
    badgeTone: '#60A5FA',
    icon: 'movement-screen',
    status: 'Board Review Finalization',
    statusType: 'board_review',
    summary: 'Systematic movement diagnostics and kinetic restoration through the clinical 4-Step Corrective Exercise Continuum.',
    curriculum: [
      'Overhead Squat Assessment (OHSA) 5 Checkpoints',
      'Phase 1: Inhibit (Self-Myofascial Release / SMR)',
      'Phase 2: Lengthen (Static & Neuromuscular Stretch)',
      'Phase 3: Activate (Isolated Strengthening & Isometrics)',
      'Phase 4: Integrate (Dynamic Multi-Planar Integration)',
    ],
    gaaEngineIntegration: 'Drives the AI Posture & OHSA Diagnostics Suite, kinetic chain compensation alerts (LPHC, knee valgus, asymmetrical weight shift), and auto-prescribed 4-phase CEx warmups.',
    keyAlgorithmicModule: 'OHSA 5-Point Diagnostic & CEx Protocol Generator',
  },
  {
    id: 'pes',
    code: 'NASM-PES®',
    title: 'Performance Enhancement Specialist',
    category: 'performance',
    categoryLabel: 'Athletic Performance',
    badgeTone: '#F59E0B',
    icon: 'lightning',
    status: 'Board Review Finalization',
    statusType: 'board_review',
    summary: 'Athletic development, speed and agility training, and plans that progress over time.',
    curriculum: [
      'Rate of Force Development (RFD) & Explosive Power',
      'Speed, Agility, and Quickness (SAQ) Mechanics',
      'Olympic Lifting Derivatives & Ground Reaction Forces',
      'Triphasic & Contrast Training Periodization',
    ],
    gaaEngineIntegration: 'Powers the Athletic Performance Studio (`components/fitness/AthleticPerformanceStudio.tsx`) and field power diagnostics (Margaria-Kalamen, Pro Agility 5-10-5, reactive jump profiling).',
    keyAlgorithmicModule: 'SAQ & Neuromuscular Power Matrix',
  },
  {
    id: 'cnc',
    code: 'NASM-CNC™',
    title: 'Certified Nutrition Coach',
    category: 'metabolic',
    categoryLabel: 'Metabolic & Nutrition',
    badgeTone: '#34D399',
    icon: 'apple',
    status: 'Board Review Finalization',
    statusType: 'board_review',
    summary: 'Clinical macronutrient periodization, bioenergetic math (TDEE, BMR, NEAT, TEF), and behavioral dietary adherence.',
    curriculum: [
      'Macronutrient Periodization & Caloric Allocation',
      'Metabolic Expenditure Math (BMR, NEAT, TEF, EAT)',
      'Hydration Physiology & Micronutrient Sufficiency',
      'Eating habits and practical nutrition choices',
    ],
    gaaEngineIntegration: 'Supports GAA nutrition estimates, meal planning, and progress tracking.',
    keyAlgorithmicModule: 'Bioenergetic TDEE & Macro Allocation Algorithm',
  },
  {
    id: 'csnc',
    code: 'NASM-CSNC',
    title: 'Certified Sports Nutrition Coach',
    category: 'metabolic',
    categoryLabel: 'Metabolic & Nutrition',
    badgeTone: '#10B981',
    icon: 'utensils',
    status: 'Candidate Track',
    statusType: 'candidate',
    summary: 'Advanced athletic nutrient timing, glycogen supercompensation, intra-workout kinetics, and competition fueling.',
    curriculum: [
      'Glycogen Supercompensation & Depletion Cycling',
      'Intra-Session Fueling & Exogenous Carb Kinetics',
      'Electrolyte Osmolality & Thermoregulation',
      'Ergogenic Aids & Evidence-Based Supplement Protocols',
    ],
    gaaEngineIntegration: 'Regulates pre/intra/post-workout nutritional timing algorithms for high-output athletic conditioning.',
    keyAlgorithmicModule: 'Peri-Workout Nutrient Timing Engine',
  },
  {
    id: 'pbc',
    code: 'NASM-PBC',
    title: 'Physique & Bodybuilding Coach',
    category: 'performance',
    categoryLabel: 'Athletic Performance',
    badgeTone: '#EC4899',
    icon: 'dumbbell',
    status: 'Specialization Track',
    statusType: 'specialization',
    summary: 'Hypertrophy biomechanics, stimulus-to-fatigue ratios (SFR), volume landmarks (MEV/MAV/MRV), and structural symmetry.',
    curriculum: [
      'Volume Landmarks (MEV, MAV, MRV Periodization)',
      'Stimulus-to-Fatigue Ratio (SFR) Optimization',
      'Resistance Curve Vectoring & Peak Tension Matching',
      'Intra-Set Stretch Loading & Muscle Architecture',
    ],
    gaaEngineIntegration: 'Guides Phase 3 Muscular Development programming with optimal joint angles, peak tension curves, and hypertrophy loading.',
    keyAlgorithmicModule: 'Volume Landmark (MEV/MAV/MRV) Optimizer',
  },
  {
    id: 'wls',
    code: 'NASM-WLS',
    title: 'Weight Loss Specialist',
    category: 'metabolic',
    categoryLabel: 'Metabolic & Nutrition',
    badgeTone: '#06B6D4',
    icon: 'scale',
    status: 'Specialization Track',
    statusType: 'specialization',
    summary: 'Adaptive thermogenesis defense, reverse dieting protocols, hormone mitigation (leptin/ghrelin), and lean tissue defense.',
    curriculum: [
      'Adaptive Thermogenesis & Metabolic Rate Preservation',
      'NEAT (Non-Exercise Activity) Defense Mechanisms',
      'Reverse Dieting & Caloric Step-Up Protocols',
      'Hormonal Optimization During Caloric Deficits',
    ],
    gaaEngineIntegration: 'Powers fat loss periodization microcycles without metabolic crash or muscle catabolism.',
    keyAlgorithmicModule: 'Metabolic Adaptation & NEAT Preserver',
  },
  {
    id: 'bcs',
    code: 'NASM-BCS',
    title: 'Behavior Change Specialist',
    category: 'clinical',
    categoryLabel: 'Clinical & Biomechanics',
    badgeTone: '#A855F7',
    icon: 'brain',
    status: 'Specialization Track',
    statusType: 'specialization',
    summary: 'Neuroscience of adherence, Transtheoretical Stages of Change, motivational interviewing, and habit architecture.',
    curriculum: [
      'Transtheoretical Model (Stages of Change Dynamics)',
      'Motivational interviewing and supportive coaching',
      'Habit Stacking & Implementation Intentions',
      'Decision-making, habit building, and consistency',
    ],
    gaaEngineIntegration: 'Calibrates AI Coach Gordon’s cognitive tone, weekly check-in responsiveness, and client barrier friction resolution.',
    keyAlgorithmicModule: 'Adherence Friction Scoring & Cognitive Coach Tone',
  },
  {
    id: 'vcs',
    code: 'NASM-VCS',
    title: 'Virtual Coaching Specialist',
    category: 'specialized',
    categoryLabel: 'Lifespan & Specialized',
    badgeTone: '#3B82F6',
    icon: 'video-studio',
    status: 'Specialization Track',
    statusType: 'specialization',
    summary: 'Remote coaching workflows, asynchronous biomechanical video review, digital studio ergonomics, and telehealth delivery.',
    curriculum: [
      'Asynchronous Video Movement Analysis & Feedback',
      'Remote Biomechanical Cues & Voice Telemetry',
      'WebRTC Studio Lighting, Framing & Optical Truth',
      'Digital Telehealth Client Onboarding Protocols',
    ],
    gaaEngineIntegration: 'Standardizes the 1:1 Live WebRTC Consultation Studio and asynchronous video movement review pipelines.',
    keyAlgorithmicModule: 'WebRTC Studio Diagnostics & Voice Cues Engine',
  },
  {
    id: 'sfs',
    code: 'NASM-SFS',
    title: 'Senior Fitness Specialist',
    category: 'specialized',
    categoryLabel: 'Lifespan & Specialized',
    badgeTone: '#F97316',
    icon: 'shield-check',
    status: 'Specialization Track',
    statusType: 'specialization',
    summary: 'Longevity biomechanics, fall prevention, osteopenia/sarcopenia mitigation, and joint-friendly loading adaptations.',
    curriculum: [
      'Joint Longevity & Cartilage Protection Protocols',
      'Proprioceptive Balance Progressions & Fall Defense',
      'Osteopenia & Sarcopenia Neuromuscular Defense',
      'Contraindicated Movement Swapping Matrix',
    ],
    gaaEngineIntegration: 'Supports mobility and healthy-aging tools, with exercise options adapted to a person’s needs.',
    keyAlgorithmicModule: 'Joint Preservation & Contraindication Swapper',
  },
  {
    id: 'gfs',
    code: 'NASM-GFS',
    title: 'Golf Fitness Specialist',
    category: 'specialized',
    categoryLabel: 'Lifespan & Specialized',
    badgeTone: '#84CC16',
    icon: 'target',
    status: 'Specialization Track',
    statusType: 'specialization',
    summary: 'Rotational kinetics, thoracic spine mobility, X-Factor stretch mechanics, and kinetic ground power transfer.',
    curriculum: [
      'Transverse Plane Rotational Power Delivery',
      'Thoracic Spine Mobility & Pelvic Dissociation',
      'X-Factor Stretch Biomechanics & Coil Mechanics',
      'Ground Reaction Force Vectoring for Swings',
    ],
    gaaEngineIntegration: 'Supplies rotational kinetic chain screening and transverse power conditioning for rotational athletes.',
    keyAlgorithmicModule: 'Transverse Plane Rotational Diagnostics',
  },
  {
    id: 'mmacs',
    code: 'NASM-MMACS',
    title: 'MMA Conditioning Specialist',
    category: 'performance',
    categoryLabel: 'Athletic Performance',
    badgeTone: '#EF4444',
    icon: 'crosshair',
    status: 'Specialization Track',
    statusType: 'specialization',
    summary: 'Multi-planar combat conditioning, 3-system energy conditioning, rotational anti-flexion, and neck/grip endurance.',
    curriculum: [
      'Tri-System Bioenergetics (ATP-PC, Glycolytic, Aerobic)',
      'Cervical Spine Stabilization & Whiplash Defense',
      'Anti-Rotational & Anti-Lateral Core Bracing',
      'Sustained Isometric Grip & Kinetic Clamping',
    ],
    gaaEngineIntegration: 'Powers functional combat conditioning modules and multi-planar athletic resilience.',
    keyAlgorithmicModule: 'Tri-System Intermittent Conditioning Engine',
  },
  {
    id: 'master',
    code: '🏆 NASM Master Trainer',
    title: 'Master Performance Director (Pinnacle Status)',
    category: 'clinical',
    categoryLabel: 'Clinical & Biomechanics',
    badgeTone: '#EAB308',
    icon: 'crown',
    status: 'Advanced credential pathway',
    statusType: 'pinnacle',
    summary: 'The pinnacle practitioner credential awarded upon mastering the comprehensive NASM continuum across assessment, correction, performance, and nutrition.',
    curriculum: [
      'Full-Spectrum Kinetic Chain Synthesis',
      'Master Clinical Diagnostic Screening',
      'Macro-to-Micro Periodization Architecture',
      'Integrated Human Performance Ecosystem Leadership',
    ],
    gaaEngineIntegration: 'Informs coaching recommendations, movement screening, and training plans across Gordon Athletic Advisory.',
    keyAlgorithmicModule: 'Integrated Training and Performance Plan',
  },
]

export default function NasmAccreditationPortfolio() {
  const [selectedCategory, setSelectedCategory] = useState<CredentialCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>('ces')

  const categories: { key: CredentialCategory; label: string; count: number }[] = useMemo(() => [
    { key: 'all', label: 'All Credentials', count: NASM_CREDENTIALS_DATA.length },
    { key: 'clinical', label: 'Clinical & Biomechanics', count: NASM_CREDENTIALS_DATA.filter((c) => c.category === 'clinical').length },
    { key: 'performance', label: 'Athletic Performance', count: NASM_CREDENTIALS_DATA.filter((c) => c.category === 'performance').length },
    { key: 'metabolic', label: 'Metabolic & Nutrition', count: NASM_CREDENTIALS_DATA.filter((c) => c.category === 'metabolic').length },
    { key: 'specialized', label: 'Lifespan & Specialized', count: NASM_CREDENTIALS_DATA.filter((c) => c.category === 'specialized').length },
  ], [])

  const filteredCredentials = useMemo(() => {
    return NASM_CREDENTIALS_DATA.filter((cred) => {
      const matchesCategory = selectedCategory === 'all' || cred.category === selectedCategory
      const query = searchQuery.trim().toLowerCase()
      if (!query) return matchesCategory

      const matchesSearch =
        cred.code.toLowerCase().includes(query) ||
        cred.title.toLowerCase().includes(query) ||
        cred.summary.toLowerCase().includes(query) ||
        cred.keyAlgorithmicModule.toLowerCase().includes(query) ||
        cred.curriculum.some((item) => item.toLowerCase().includes(query))

      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery])

  return (
    <section
      id="accreditation-portfolio"
      style={{
        marginBottom: 56,
        padding: 'clamp(20px, 4vw, 36px)',
        background: 'linear-gradient(180deg, rgba(14, 23, 36, 0.75) 0%, rgba(8, 14, 24, 0.95) 100%)',
        border: '1px solid rgba(197, 160, 89, 0.35)',
        borderRadius: 14,
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 14px',
            borderRadius: 20,
            background: 'rgba(197, 160, 89, 0.12)',
            border: '1px solid rgba(197, 160, 89, 0.3)',
            marginBottom: 12,
          }}
        >
          <GaaIcon name="shield-check" size={14} tone="gold" />
          <span
            style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--gold-lt)',
            }}
          >
            Sports Science Pedigree · Board Accreditations In Progress
          </span>
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
            fontSize: 'clamp(1.5rem, 3.2vw, 2.2rem)',
            fontWeight: 700,
            color: '#FFFFFF',
            margin: '4px 0 10px',
            letterSpacing: '0.02em',
          }}
        >
          The 13-Point NASM® Clinical &amp; Performance Portfolio
        </h2>

        <p
          style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: 14,
            color: '#94A3B8',
            maxWidth: 720,
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          Every algorithmic periodization model, kinetic movement screen, and corrective protocol inside Gordon Athletic Advisory is anchored to the following National Academy of Sports Medicine accreditations currently concluding formal board completion.
        </p>
      </div>

      {/* Summary Telemetry Badges */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          { label: 'Total Accreditations', value: '13 Specialized', note: 'OPT™ Ecosystem' },
          { label: 'Diagnostic Continuum', value: '4-Step CEx', note: 'Inhibit · Lengthen · Activate · Integrate' },
          { label: 'Kinetic Screen Scope', value: '5 Checkpoints', note: 'Foot/Ankle to Cervical Spine' },
          { label: 'Periodization Architecture', value: '5 OPT™ Phases', note: 'Stabilization to Peak Power' },
        ].map((stat, idx) => (
          <div
            key={idx}
            style={{
              background: 'rgba(8, 14, 24, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              padding: '12px 14px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#64748B',
                marginBottom: 4,
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--gold-lt)',
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-telemetry, monospace)',
                color: '#94A3B8',
                marginTop: 2,
              }}
            >
              {stat.note}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Category Filter Pills & Search */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.key
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: isActive ? 'rgba(197, 160, 89, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                  border: isActive ? '1px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: isActive ? 'var(--gold-lt)' : '#CBD5E1',
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>{cat.label}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: 'var(--font-telemetry, monospace)',
                    opacity: 0.8,
                    background: isActive ? 'rgba(197, 160, 89, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                    padding: '1px 5px',
                    borderRadius: 4,
                  }}
                >
                  {cat.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Quick Search */}
        <div style={{ minWidth: 200, flex: '1 1 200px', maxWidth: 280 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search credential or topic..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '6px 12px',
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              fontFamily: 'Raleway, sans-serif',
              fontSize: 12,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Grid of Credentials */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        {filteredCredentials.map((cred) => {
          const isExpanded = expandedId === cred.id
          const isPinnacle = cred.statusType === 'pinnacle'

          return (
            <div
              key={cred.id}
              onClick={() => setExpandedId(isExpanded ? null : cred.id)}
              style={{
                background: isExpanded
                  ? 'rgba(19, 30, 48, 0.95)'
                  : isPinnacle
                  ? 'linear-gradient(135deg, rgba(30, 24, 10, 0.8) 0%, rgba(14, 23, 36, 0.85) 100%)'
                  : 'rgba(14, 23, 36, 0.75)',
                border: isExpanded
                  ? `1.5px solid ${cred.badgeTone}`
                  : isPinnacle
                  ? '1.5px solid rgba(234, 179, 8, 0.6)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 10,
                padding: '16px 18px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isExpanded
                  ? `0 10px 24px rgba(0, 0, 0, 0.4), 0 0 16px ${cred.badgeTone}22`
                  : 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Top Row: Icon + Code + Status */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 10,
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 6,
                      background: `${cred.badgeTone}20`,
                      border: `1px solid ${cred.badgeTone}60`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <GaaIcon name={cred.icon} size={16} tone="gold" />
                  </div>
                  <div>
                    <span
                      style={{
                        fontFamily: 'var(--font-telemetry, monospace)',
                        fontSize: 14,
                        fontWeight: 800,
                        color: cred.badgeTone,
                        letterSpacing: '0.04em',
                        display: 'block',
                      }}
                    >
                      {cred.code}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: 'Raleway, sans-serif',
                        color: '#64748B',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {cred.categoryLabel}
                    </span>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 9,
                    fontFamily: 'var(--font-telemetry, monospace)',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 4,
                    background: isPinnacle ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    color: isPinnacle ? '#FEF08A' : '#94A3B8',
                    border: isPinnacle
                      ? '1px solid rgba(234, 179, 8, 0.5)'
                      : '1px solid rgba(255, 255, 255, 0.12)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cred.status}
                </span>
              </div>

              {/* Title & Summary */}
              <h3
                style={{
                  fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  margin: '0 0 6px',
                }}
              >
                {cred.title}
              </h3>
              <p
                style={{
                  fontSize: 12,
                  color: '#94A3B8',
                  lineHeight: 1.5,
                  margin: '0 0 10px',
                }}
              >
                {cred.summary}
              </p>

              {/* Algorithmic Module Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  fontFamily: 'var(--font-telemetry, monospace)',
                  color: 'var(--gold-lt)',
                  background: 'rgba(197, 160, 89, 0.08)',
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid rgba(197, 160, 89, 0.2)',
                  marginBottom: isExpanded ? 14 : 0,
                }}
              >
                <GaaIcon name="brain" size={12} tone="gold" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cred.keyAlgorithmicModule}
                </span>
              </div>

              {/* Expanded Curriculum & GAA Software Integration Details */}
              {isExpanded && (
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    animation: 'fadeIn 0.2s ease',
                  }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 10,
                        fontFamily: 'Raleway, sans-serif',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--gold-lt)',
                        marginBottom: 6,
                      }}
                    >
                      Scientific Curriculum Focus
                    </span>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: 16,
                        fontSize: 12,
                        color: '#CBD5E1',
                        lineHeight: 1.5,
                      }}
                    >
                      {cred.curriculum.map((point, pIdx) => (
                        <li key={pIdx} style={{ marginBottom: 3 }}>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 10,
                        fontFamily: 'Raleway, sans-serif',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: '#60A5FA',
                        marginBottom: 4,
                      }}
                    >
                      GAA Engine &amp; Advisory Integration
                    </span>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: '#94A3B8',
                        lineHeight: 1.55,
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      {cred.gaaEngineIntegration}
                    </p>
                  </div>
                </div>
              )}

              {/* Tap to inspect prompt */}
              <div
                style={{
                  marginTop: 10,
                  fontSize: 10,
                  color: isExpanded ? 'var(--gold-lt)' : '#64748B',
                  textAlign: 'right',
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: 600,
                }}
              >
                {isExpanded ? '▲ Collapse details' : '▼ Tap to inspect curriculum & software engine'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Direct Call to Action to Lock Founding Allocation */}
      <div
        style={{
          background: 'rgba(8, 14, 24, 0.9)',
          border: '1px solid rgba(197, 160, 89, 0.3)',
          borderRadius: 8,
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 15,
              fontWeight: 700,
              color: '#FFFFFF',
            }}
          >
            Ready to start moving toward your goals?
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
            Join the early-access list for membership updates and introductory pricing. The first group is limited to 15 spots.
          </div>
        </div>

        <a
          href="#intake-form"
          className="sgf-button sgf-button-gold"
          style={{
            padding: '10px 18px',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>Reserve Founding Allocation</span>
          <span>↓</span>
        </a>
      </div>

      {/* Nominative Fair Use Legal Notice */}
      <div
        style={{
          marginTop: 18,
          padding: '10px 14px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 6,
          fontSize: 11,
          color: '#64748B',
          lineHeight: 1.5,
          fontFamily: 'Raleway, sans-serif',
        }}
      >
        <strong style={{ color: '#94A3B8' }}>Legal Non-Affiliation &amp; Nominative Fair Use:</strong> NASM®, Optimum Performance Training™, OPT™, Corrective Exercise Specialist (CES®), Performance Enhancement Specialist (PES®), Certified Nutrition Coach (CNC™), and Certified Personal Trainer (CPT®) are registered trademarks or service marks of the National Academy of Sports Medicine (NASM) and/or Ascend Learning, LLC. Gordon Athletic Advisory LLC and Scott Gordon Fitness are independent private entities and are not affiliated with, sponsored by, or endorsed by NASM or Ascend Learning, LLC. All references to NASM credentials and the OPT™ model are made strictly for educational, methodological compatibility, and scientific periodization reference purposes under the Nominative Fair Use doctrine.
      </div>
    </section>
  )
}
