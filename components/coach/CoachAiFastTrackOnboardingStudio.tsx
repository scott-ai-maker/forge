'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  type ClientOnboardingProfileInput,
  type UnifiedAiOnboardingSynthesis,
  runAiCoachOnboardingSynthesis,
} from '@/lib/ai-coach-onboarding-orchestrator'
import type { BodyCompositionScanResult } from '@/lib/ai-body-composition-engine'
import type { PosturalMeshScanResult } from '@/lib/ai-postural-mesh-scanner'
import { resolveGaaExerciseImage, BRAND_LOGO_FALLBACK_IMAGE } from '@/lib/nasm-generated-images'

const AiPostureMeshScannerModal = dynamic(
  () => import('./AiPostureMeshScannerModal'),
  { ssr: false }
)
const AiBodyCompositionScannerModal = dynamic(
  () => import('@/components/fitness/AiBodyCompositionScannerModal'),
  { ssr: false }
)

interface CoachAiFastTrackOnboardingStudioProps {
  clientId: string
  clientName: string
  age?: number
  sex?: 'male' | 'female' | 'other'
  heightCm?: number
  weightKg?: number
  fitnessGoal?: string
  trainingDaysPerWeek?: number
  equipmentAccess?: string[]
  cardioEquipmentAccess?: string[]
  injuriesLimitations?: string | null
  contraindicationTags?: string[]
  initialDexaScan?: BodyCompositionScanResult | null
  initialPostureScan?: PosturalMeshScanResult | null
  currentOptPhase?: number | null
  onProgramDeployed?: () => void
}

export default function CoachAiFastTrackOnboardingStudio({
  clientId,
  clientName,
  age = 32,
  sex = 'male',
  heightCm = 178,
  weightKg = 80,
  fitnessGoal = 'Body Recomposition & Joint Longevity',
  trainingDaysPerWeek = 4,
  equipmentAccess = ['Commercial Gym'],
  cardioEquipmentAccess = [],
  injuriesLimitations = null,
  contraindicationTags = [],
  initialDexaScan = null,
  initialPostureScan = null,
  currentOptPhase = 1,
  onProgramDeployed,
}: CoachAiFastTrackOnboardingStudioProps) {
  const [dexaScan, setDexaScan] = useState<BodyCompositionScanResult | null>(initialDexaScan)
  const [postureScan, setPostureScan] = useState<PosturalMeshScanResult | null>(initialPostureScan)

  const [isPostureModalOpen, setIsPostureModalOpen] = useState<boolean>(false)
  const [isDexaModalOpen, setIsDexaModalOpen] = useState<boolean>(false)

  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false)
  const [synthesis, setSynthesis] = useState<UnifiedAiOnboardingSynthesis | null>(null)

  const [isDeploying, setIsDeploying] = useState<boolean>(false)
  const [deploySuccess, setDeploySuccess] = useState<string | null>(null)
  const [deployError, setDeployError] = useState<string | null>(null)

  const [activePreviewTab, setActivePreviewTab] = useState<'periodization' | 'program' | 'cex'>('periodization')

  const clientProfile: ClientOnboardingProfileInput = {
    clientId,
    clientName,
    age,
    sex,
    heightCm,
    weightKg,
    fitnessGoal,
    trainingDaysPerWeek,
    equipmentAccess,
    cardioEquipmentAccess,
    injuriesLimitations: injuriesLimitations || undefined,
    contraindicationTags,
  }

  // Auto-synthesize when scans are updated or available
  useEffect(() => {
    try {
      const result = runAiCoachOnboardingSynthesis({
        client: clientProfile,
        dexaScan,
        postureScan,
      })
      setSynthesis(result)
    } catch (err) {
      console.error('Failed to run AI coach synthesis:', err)
    }
  }, [dexaScan, postureScan, clientId])

  // Handlers for modal callbacks
  const handleApplyPostureScan = (scanResult: PosturalMeshScanResult) => {
    setPostureScan(scanResult)
    setIsPostureModalOpen(false)
  }

  const handleApplyDexaScan = (scanResult: BodyCompositionScanResult) => {
    setDexaScan(scanResult)
    setIsDexaModalOpen(false)
  }

  // Quick Demo Simulators for instant coach testing
  const handleSimulatePostureScan = () => {
    const mockScan: PosturalMeshScanResult = {
      view: 'overhead_squat',
      landmarks: [],
      angles: [
        { name: 'Knee Valgus Q-Angle', angleDegrees: 11, status: 'moderate', normalRange: '< 5°', clinicalNote: 'Medial knee collapse' },
        { name: 'Pelvic Incline Angle', angleDegrees: 14, status: 'moderate', normalRange: '5° - 10°', clinicalNote: 'Anterior pelvic tilt' },
      ],
      detectedCompensations: ['knees_cave_in', 'excessive_forward_lean', 'low_back_arches'],
      ohsaObservations: [
        { compensation: 'knees_move_inward', checkpoint: 'knees', observed: true, severity: 'moderate', view: 'anterior' },
        { compensation: 'excessive_forward_lean', checkpoint: 'lphc', observed: true, severity: 'moderate', view: 'lateral' },
        { compensation: 'low_back_arches', checkpoint: 'lphc', observed: true, severity: 'moderate', view: 'lateral' },
      ],
      staticFindings: [
        { checkpoint: 'knees', observation: 'Bilateral knee valgus tracking medial', distortionSyndrome: 'lower_crossed' },
        { checkpoint: 'lphc', observation: 'Anterior pelvic tilt with hyperlordosis', distortionSyndrome: 'lower_crossed' },
      ],
      syndromeDetected: 'Lower Crossed',
      cexPrescription: {
        inhibit: [
          { muscle: 'Adductor Complex & TFL', protocol: 'SMR 30-60s per leg' },
          { muscle: 'Gastrocnemius & Soleus', protocol: 'SMR 30-60s on roller' },
        ],
        lengthen: [
          { muscle: 'Static Hip Flexor / Psoas Stretch', protocol: 'Hold 30s x 2 sets' },
          { muscle: 'Static Standing Adductor Stretch', protocol: 'Hold 30s x 2 sets' },
        ],
        activate: [
          { muscle: 'Gluteus Medius / Minimus', protocol: 'Banded Side-Lying Clamshell 3x15' },
          { muscle: 'Anterior Tibialis', protocol: 'Single-Leg Balance to Reach 3x10' },
        ],
        integrate: [
          { exercise: 'Ball Squat to Overhead Press', protocol: '3 sets x 12 reps (4/2/1 tempo)' },
          { exercise: 'Single-Leg RDL to Balance', protocol: '3 sets x 10 reps/side (3/2/1 tempo)' },
        ],
      },
      clinicalSummary: 'Lower Crossed Syndrome observed with bilateral knee valgus and excessive forward lean.',
    }
    setPostureScan(mockScan)
  }

  const handleSimulateDexaScan = () => {
    const mockScan: BodyCompositionScanResult = {
      estimatedBodyFatPercent: 23.8,
      confidenceIntervalPercent: 1.1,
      confidenceScore: 0.96,
      bodyDensity: 1.045,
      classification: 'Elevated Fat Mass',
      weightKg: weightKg,
      weightLbs: Math.round(weightKg * 2.20462),
      fatMassKg: Math.round(weightKg * 0.238),
      fatMassLbs: Math.round(weightKg * 2.20462 * 0.238),
      leanBodyMassKg: Math.round(weightKg * (1 - 0.238)),
      leanBodyMassLbs: Math.round(weightKg * 2.20462 * (1 - 0.238)),
      skeletalMuscleMassKg: 34.5,
      skeletalMuscleMassLbs: 76,
      ffmi: 20.4,
      normalizedFfmi: 20.2,
      ffmiCategory: 'Average',
      visceralFatRisk: 'Moderate',
      androidGynoidRatio: 1.02,
      waistToHeightRatio: 0.51,
      cunninghamBmr: 1740,
      katchMcArdleBmr: 1715,
      maintenanceCaloriesTdee: 2550,
      estimatedCircumferencesCm: { waistNavelCm: 86, neckCm: 40, hipGluteCm: 100, chestCm: 102, thighCm: 58, bicepCm: 35 },
      waistToHipRatio: 0.86,
      landmarks: [],
      regionalBreakdown: [],
      photoQualityAssessment: { overallRating: 'optimal', framingScore: 92, lightingScore: 90, clothingOcclusionWarning: false, postureCompensationDetected: true, multiViewEnhanced: true },
      recompositionProjection: {
        targetWeightKg: 76,
        targetWeightLbs: 168,
        targetBodyFatPercent: 16,
        targetFatMassKg: 12.16,
        targetFatMassLbs: 26.9,
        fatToLoseKg: 6.35,
        fatToLoseLbs: 14,
        leanMassChangeKg: 0.9,
        leanMassChangeLbs: 2,
        estimatedWeeksToGoal: 14,
        dailyCaloricTarget: 2150,
        dailyProteinGrams: 165,
        recommendedNasmPhase: 1,
        phaseName: 'Phase 1: Stabilization Endurance',
        weeklyDeficitOrSurplusCalories: -3500,
        coachingDirectives: ['Create 400 kcal deficit', 'Preserve LBM via 4/2/1 tempo stabilization'],
      },
      methodDescription: 'DEXA 4C Multi-View AI Spatial Anthropometry',
      coachSummaryNotes: 'DEXA calibrated scan indicates elevated fat mass with average muscularity.',
    }
    setDexaScan(mockScan)
  }

  // 1-Click Deploy: Apply Periodization and Program to athlete
  const handleDeployToAthlete = async () => {
    if (!synthesis) return
    setIsDeploying(true)
    setDeployError(null)
    setDeploySuccess(null)

    try {
      const res = await fetch(`/api/coach/clients/${clientId}/ai-onboarding-orchestrator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_all',
          periodizationRecommendation: synthesis.periodizationRecommendation,
          programDesignRecommendation: synthesis.programDesignRecommendation,
          dexaScan,
          postureScan,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to deploy AI coach programming.')
      }

      setDeploySuccess(data.message || `✓ Successfully deployed AI periodization & 4-Phase CEx program for ${clientName}! Advancing to Stage 7: Delivery Kickoff...`)
      if (onProgramDeployed) {
        onProgramDeployed()
      } else if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = `/coach/clients/${clientId}?tab=sessions#workspace-tab-content`
        }, 1200)
      }
    } catch (err: unknown) {
      const errObj = err as { message?: string }
      setDeployError(errObj?.message || 'Failed to deploy AI coach program.')
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <div
      className="coach-ai-fast-track-studio"
      style={{
        background: 'linear-gradient(135deg, rgba(14,24,39,0.98) 0%, rgba(8,13,22,0.99) 100%)',
        border: '1.5px solid rgba(212,160,23,0.4)',
        borderRadius: 12,
        padding: '24px 26px',
        marginBottom: 28,
        boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
      }}
    >
      {/* ── Studio Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800 }}>
              AI Coach Scott Gordon • Rapid Onboarding Engine
            </span>
            <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(212,160,23,0.2)', border: '1px solid var(--gold)', color: 'var(--gold-lt)', fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <GaaIcon name="lightning" size={10} tone="gold" />
              <span>Fast-Track Pipeline</span>
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 'clamp(20px, 2.6vw, 26px)', color: 'var(--white)', margin: 0, letterSpacing: '0.04em' }}>
            AI SCANNERS ➔ PERIODIZATION ➔ PROGRAM DESIGN CONTINUUM
          </h2>
          <p style={{ color: 'var(--gray)', fontSize: 13, margin: '6px 0 0', maxWidth: 880, lineHeight: 1.5 }}>
            Exclusive dual-scanner flow: AI Posture &amp; OHSA Scanner + AI DEXA Body Comp Scanner. AI Coach Scott Gordon synthesizes both scans to recommend 12-week OPT™ periodization and generate bespoke programs with integrated 4-phase CEx warmups in seconds.
          </p>
        </div>

        {/* 1-Click Fast Deploy Button */}
        {synthesis && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleDeployToAthlete}
              disabled={isDeploying}
              className="tactile-btn"
              style={{
                padding: '12px 22px',
                borderRadius: 6,
                background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                color: '#080E14',
                fontSize: 13,
                fontWeight: 900,
                cursor: isDeploying ? 'wait' : 'pointer',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 6px 20px rgba(212,160,23,0.4)',
                opacity: isDeploying ? 0.7 : 1,
              }}
            >
              <GaaIcon name="rocket" size={16} style={{ color: '#080E14' }} />
              <span>{isDeploying ? 'Deploying Program...' : '1-Click Deploy: Apply Periodization & Publish'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Success / Error Banner ── */}
      {deploySuccess && (
        <div
          style={{
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid #10B981',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            color: '#10B981',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <GaaIcon name="target" size={18} tone="gold" />
            <span>{deploySuccess}</span>
          </div>
          <a
            href={`/coach/clients/${clientId}?tab=sessions#workspace-tab-content`}
            style={{
              padding: '6px 14px',
              background: '#10B981',
              color: '#080E14',
              borderRadius: 4,
              fontWeight: 800,
              fontSize: 12,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>Proceed to Stage 7: Delivery Kickoff ➔</span>
          </a>
        </div>
      )}

      {deployError && (
        <div
          style={{
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid #EF4444',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#EF4444',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <GaaIcon name="alert-triangle" size={16} tone="ruby" />
          <span>{deployError}</span>
        </div>
      )}

      {/* ── Step 1: Dual Exclusive AI Scanners HUD ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Scanner 1: AI Posture & OHSA Movement Scanner */}
        <div
          style={{
            background: 'var(--navy-mid)',
            border: postureScan ? '1px solid rgba(56,189,248,0.4)' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '18px 20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GaaIcon name="movement-screen" size={16} tone="gold" />
              </div>
              <div>
                <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#38BDF8', fontWeight: 800, letterSpacing: '0.08em' }}>
                  Stage 4 Movement Screen
                </span>
                <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 16, color: 'var(--white)', margin: 0, letterSpacing: '0.04em' }}>
                  AI POSTURE &amp; OHSA SCANNER
                </h3>
              </div>
            </div>

            <span
              style={{
                padding: '3px 8px',
                borderRadius: 4,
                fontSize: 10.5,
                fontWeight: 800,
                background: postureScan ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                border: postureScan ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                color: postureScan ? '#10B981' : 'var(--gray)',
              }}
            >
              {postureScan ? '✓ Scanned & Analyzed' : 'Pending Screen'}
            </span>
          </div>

          {postureScan ? (
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '10px 12px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase' }}>Syndrome Detected</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold-lt)' }}>{postureScan.syndromeDetected || 'Lower Crossed'}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 4 }}>Compensations:</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {postureScan.detectedCompensations.map(c => (
                  <span key={c} style={{ padding: '2px 6px', background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 4, fontSize: 10.5, color: '#38BDF8', fontWeight: 700 }}>
                    {c.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#10B981', fontWeight: 700 }}>
                ✓ 4-Phase CEx Warmup Matrix Auto-Compiled
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--gray)', margin: '0 0 14px', lineHeight: 1.4 }}>
              Exclusive scanner for 5 kinetic chain checkpoints &amp; dynamic overhead squat. Detects compensations and compiles 4-phase CEx.
            </p>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsPostureModalOpen(true)}
              style={{
                flex: '1 1 auto',
                padding: '9px 14px',
                borderRadius: 6,
                background: 'rgba(56,189,248,0.15)',
                border: '1px solid #38BDF8',
                color: '#38BDF8',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {postureScan ? 'Re-Run AI Posture Scanner' : 'Launch AI Posture & OHSA Scanner'}
            </button>
            {!postureScan && (
              <button
                type="button"
                onClick={handleSimulatePostureScan}
                style={{
                  padding: '9px 12px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'var(--gray-lt)',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <GaaIcon name="lightning" size={12} tone="inherit" />
                <span>Instant Sim</span>
              </button>
            )}
          </div>
        </div>

        {/* Scanner 2: AI DEXA Body Comp Scanner */}
        <div
          style={{
            background: 'var(--navy-mid)',
            border: dexaScan ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '18px 20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GaaIcon name="dna" size={16} tone="gold" />
              </div>
              <div>
                <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#C084FC', fontWeight: 800, letterSpacing: '0.08em' }}>
                  Stage 3 Body Composition
                </span>
                <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 16, color: 'var(--white)', margin: 0, letterSpacing: '0.04em' }}>
                  AI DEXA BODY COMP SCANNER
                </h3>
              </div>
            </div>

            <span
              style={{
                padding: '3px 8px',
                borderRadius: 4,
                fontSize: 10.5,
                fontWeight: 800,
                background: dexaScan ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                border: dexaScan ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                color: dexaScan ? '#10B981' : 'var(--gray)',
              }}
            >
              {dexaScan ? '✓ Scanned & Calibrated' : 'Pending Scan'}
            </span>
          </div>

          {dexaScan ? (
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '10px 12px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase' }}>DEXA Body Fat %</span>
                <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--gold-lt)' }}>
                  {dexaScan.estimatedBodyFatPercent}% (±{dexaScan.confidenceIntervalPercent}%)
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, fontSize: 11, color: 'var(--gray)', marginBottom: 6 }}>
                <div>LBM: <strong style={{ color: 'var(--white)' }}>{dexaScan.leanBodyMassLbs} lbs</strong></div>
                <div>FFMI: <strong style={{ color: 'var(--white)' }}>{dexaScan.ffmi}</strong></div>
                <div>BMR: <strong style={{ color: 'var(--white)' }}>{dexaScan.cunninghamBmr} kcal</strong></div>
              </div>
              <div style={{ fontSize: 11, color: '#C084FC', fontWeight: 700 }}>
                Classification: {dexaScan.classification}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--gray)', margin: '0 0 14px', lineHeight: 1.4 }}>
              Exclusive gold-standard DEXA 4C vision scanner. Computes body fat %, Lean Body Mass, FFMI, and Cunningham metabolic rate.
            </p>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsDexaModalOpen(true)}
              style={{
                flex: '1 1 auto',
                padding: '9px 14px',
                borderRadius: 6,
                background: 'rgba(168,85,247,0.15)',
                border: '1px solid #A855F7',
                color: '#C084FC',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {dexaScan ? 'Re-Run AI DEXA Scanner' : 'Launch AI DEXA Body Comp Scanner'}
            </button>
            {!dexaScan && (
              <button
                type="button"
                onClick={handleSimulateDexaScan}
                style={{
                  padding: '9px 12px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'var(--gray-lt)',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <GaaIcon name="lightning" size={12} tone="inherit" />
                <span>Instant Sim</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Step 2 & 3: AI Coach Periodization & Program Synthesis Cockpit ── */}
      {synthesis && (
        <div
          style={{
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid rgba(212,160,23,0.3)',
            borderRadius: 10,
            padding: '20px 22px',
          }}
        >
          {/* Clinical Rationale Callout */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(212,160,23,0.1) 0%, rgba(14,24,39,0.8) 100%)',
              borderLeft: '4px solid var(--gold)',
              borderRadius: '0 8px 8px 0',
              padding: '14px 18px',
              marginBottom: 18,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 800, letterSpacing: '0.08em' }}>
                AI Coach Scott Gordon • Dual-Diagnostic Synthesis
              </span>
              <span style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 700 }}>
                Target: {synthesis.periodizationRecommendation.targetPhaseName}
              </span>
            </div>
            <p style={{ color: 'var(--white)', fontSize: 13, margin: '0 0 8px', lineHeight: 1.5, fontWeight: 600 }}>
              {synthesis.periodizationRecommendation.clinicalRationale.summary}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10, fontSize: 11.5, color: 'var(--gray-lt)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <GaaIcon name="dna" size={13} tone="gold" />
                <div><strong>DEXA Assessment:</strong> {synthesis.periodizationRecommendation.clinicalRationale.bodyCompAnalysis}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <GaaIcon name="runner" size={13} tone="cyan" />
                <div><strong>Movement Assessment:</strong> {synthesis.periodizationRecommendation.clinicalRationale.postureOhsaAnalysis}</div>
              </div>
            </div>
          </div>

          {/* Tab Navigation for Preview: Periodization Roadmap vs Program Design vs 4-Phase CEx */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActivePreviewTab('periodization')}
              style={{
                padding: '6px 14px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                background: activePreviewTab === 'periodization' ? 'rgba(212,160,23,0.2)' : 'transparent',
                border: activePreviewTab === 'periodization' ? '1px solid var(--gold)' : '1px solid transparent',
                color: activePreviewTab === 'periodization' ? 'var(--gold-lt)' : 'var(--gray)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="calendar" size={13} tone={activePreviewTab === 'periodization' ? 'gold' : 'slate'} />
              <span>Stage 5: 12-Week Periodization Macrocycle</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePreviewTab('cex')}
              style={{
                padding: '6px 14px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                background: activePreviewTab === 'cex' ? 'rgba(56,189,248,0.2)' : 'transparent',
                border: activePreviewTab === 'cex' ? '1px solid #38BDF8' : '1px solid transparent',
                color: activePreviewTab === 'cex' ? '#38BDF8' : 'var(--gray)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="stretch" size={13} tone={activePreviewTab === 'cex' ? 'cyan' : 'slate'} />
              <span>4-Phase CEx Warmup Matrix</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePreviewTab('program')}
              style={{
                padding: '6px 14px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                background: activePreviewTab === 'program' ? 'rgba(16,185,129,0.2)' : 'transparent',
                border: activePreviewTab === 'program' ? '1px solid #10B981' : '1px solid transparent',
                color: activePreviewTab === 'program' ? '#10B981' : 'var(--gray)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="dumbbell" size={13} tone={activePreviewTab === 'program' ? 'emerald' : 'slate'} />
              <span>Stage 6: Program Design ({synthesis.programDesignRecommendation.macrocyclePlan.workouts.length} Workout Days)</span>
            </button>
          </div>

          {/* Preview Tab 1: Periodization Macrocycle */}
          {activePreviewTab === 'periodization' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 14 }}>
                {synthesis.periodizationRecommendation.macrocyclePlan.weeks.map(w => (
                  <div
                    key={w.weekNumber}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: w.weekNumber === 1 ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 6,
                      padding: '8px 10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--gray)' }}>
                      <span>Wk {w.weekNumber}</span>
                      <span style={{ color: 'var(--gold-lt)', fontWeight: 800 }}>P{w.phaseNumber}</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--white)', marginTop: 2 }}>{w.primaryAdaptation}</div>
                    <div style={{ fontSize: 9.5, color: 'var(--gray)', marginTop: 2 }}>{w.volumeIntensity}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray)' }}>
                Cardio Strategy: <strong style={{ color: 'var(--white)' }}>{synthesis.periodizationRecommendation.clinicalRationale.weeklyCardioPrescription}</strong>
              </div>
            </div>
          )}

          {/* Preview Tab 2: 4-Phase CEx Warmup Matrix */}
          {activePreviewTab === 'cex' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#f87171', textTransform: 'uppercase', marginBottom: 8 }}>1. Inhibit (SMR)</div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {synthesis.programDesignRecommendation.embeddedCEx.inhibit.map((item, i) => {
                      const imgUrl = resolveGaaExerciseImage(item, true) || BRAND_LOGO_FALLBACK_IMAGE
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.25)', padding: '4px 6px', borderRadius: 4 }}>
                          <img
                            src={imgUrl}
                            alt={item}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = BRAND_LOGO_FALLBACK_IMAGE }}
                            style={{ width: 'clamp(54px, 7vw, 70px)', aspectRatio: '16 / 10', height: 'auto', minWidth: 'clamp(54px, 7vw, 70px)', borderRadius: 4, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(248,113,113,0.3)', backgroundColor: '#0a0f1d' }}
                          />
                          <span style={{ fontSize: 11.5, color: 'var(--white)', wordBreak: 'break-word' }}>{item}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: 8 }}>2. Lengthen (Static)</div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {synthesis.programDesignRecommendation.embeddedCEx.lengthen.map((item, i) => {
                      const imgUrl = resolveGaaExerciseImage(item, true) || BRAND_LOGO_FALLBACK_IMAGE
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.25)', padding: '4px 6px', borderRadius: 4 }}>
                          <img
                            src={imgUrl}
                            alt={item}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = BRAND_LOGO_FALLBACK_IMAGE }}
                            style={{ width: 'clamp(54px, 7vw, 70px)', aspectRatio: '16 / 10', height: 'auto', minWidth: 'clamp(54px, 7vw, 70px)', borderRadius: 4, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(251,191,36,0.3)', backgroundColor: '#0a0f1d' }}
                          />
                          <span style={{ fontSize: 11.5, color: 'var(--white)', wordBreak: 'break-word' }}>{item}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', marginBottom: 8 }}>3. Activate (Isolated)</div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {synthesis.programDesignRecommendation.embeddedCEx.activate.map((item, i) => {
                      const imgUrl = resolveGaaExerciseImage(item, true) || BRAND_LOGO_FALLBACK_IMAGE
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.25)', padding: '4px 6px', borderRadius: 4 }}>
                          <img
                            src={imgUrl}
                            alt={item}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = BRAND_LOGO_FALLBACK_IMAGE }}
                            style={{ width: 'clamp(54px, 7vw, 70px)', aspectRatio: '16 / 10', height: 'auto', minWidth: 'clamp(54px, 7vw, 70px)', borderRadius: 4, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(56,189,248,0.3)', backgroundColor: '#0a0f1d' }}
                          />
                          <span style={{ fontSize: 11.5, color: 'var(--white)', wordBreak: 'break-word' }}>{item}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: 8 }}>4. Integrate (Dynamic)</div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {synthesis.programDesignRecommendation.embeddedCEx.integrate.map((item, i) => {
                      const imgUrl = resolveGaaExerciseImage(item, true) || BRAND_LOGO_FALLBACK_IMAGE
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.25)', padding: '4px 6px', borderRadius: 4 }}>
                          <img
                            src={imgUrl}
                            alt={item}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = BRAND_LOGO_FALLBACK_IMAGE }}
                            style={{ width: 'clamp(54px, 7vw, 70px)', aspectRatio: '16 / 10', height: 'auto', minWidth: 'clamp(54px, 7vw, 70px)', borderRadius: 4, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(52,211,153,0.3)', backgroundColor: '#0a0f1d' }}
                          />
                          <span style={{ fontSize: 11.5, color: 'var(--white)', wordBreak: 'break-word' }}>{item}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--gray)' }}>
                * Every workout day automatically begins with these customized 4-Phase CEx warmup progressions to eliminate compensations.
              </div>
            </div>
          )}

          {/* Preview Tab 3: Program Design & Resistance Days */}
          {activePreviewTab === 'program' && (
            <div style={{ display: 'grid', gap: 12 }}>
              {synthesis.programDesignRecommendation.macrocyclePlan.workouts.map(w => (
                <div
                  key={w.day}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 6,
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold-lt)' }}>
                      Day {w.day}: {w.dayName} — {w.focus}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--gray)' }}>{w.exercises.length} Exercises • 55 min</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 8 }}>{w.dailyPeriodizationMemo}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {w.exercises.slice(0, 5).map((ex, i) => (
                      <span key={i} style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: 4, fontSize: 10.5, color: 'var(--white)' }}>
                        {ex.name} ({ex.sets}x{ex.reps} @ {ex.tempo})
                      </span>
                    ))}
                    {w.exercises.length > 5 && (
                      <span style={{ padding: '2px 8px', fontSize: 10.5, color: 'var(--gray)' }}>+{w.exercises.length - 5} more</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {isPostureModalOpen && (
        <AiPostureMeshScannerModal
          isOpen={isPostureModalOpen}
          onClose={() => setIsPostureModalOpen(false)}
          clientId={clientId}
          clientName={clientName}
          onApplyScan={handleApplyPostureScan}
        />
      )}

      {isDexaModalOpen && (
        <AiBodyCompositionScannerModal
          isOpen={isDexaModalOpen}
          onClose={() => setIsDexaModalOpen(false)}
          clientId={clientId}
          clientName={clientName}
          initialSex={sex}
          initialHeightCm={heightCm}
          initialWeightKg={weightKg}
          initialAge={age}
          onApplyScan={handleApplyDexaScan}
          isCoachView
        />
      )}
    </div>
  )
}

