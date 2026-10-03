'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import GaaIcon, { GaaIconName } from '@/components/ui/GaaIcon'
import ReadinessRecoveryTracker from '@/components/fitness/ReadinessRecoveryTracker'
import PeriodizationRoadmapView from '@/components/fitness/PeriodizationRoadmapView'
import MetabolicNutritionProtocol from '@/components/fitness/MetabolicNutritionProtocol'
import ClinicalKineticWarmupModule from '@/components/fitness/ClinicalKineticWarmupModule'
import NasmAssessmentSummary from '@/components/fitness/NasmAssessmentSummary'
import PlyometricPowerStudio from '@/components/fitness/PlyometricPowerStudio'
import AthleticPerformanceStudio from '@/components/fitness/AthleticPerformanceStudio'
import SportsScienceCalculator from '@/components/fitness/SportsScienceCalculator'
import ExecutiveSleepBiometricsHud from '@/components/fitness/ExecutiveSleepBiometricsHud'
import ExecutiveTravelAdapterStudio from '@/components/fitness/ExecutiveTravelAdapterStudio'
import AiBodyCompositionScannerModal from '@/components/fitness/AiBodyCompositionScannerModal'

import { DailyBiometricSummary } from '@/lib/wearables-telemetry'
import type { ExercisePlanItem, TravelLocationScenario } from '@/lib/travel-workout-adapter'
import type { LiftType, VideoCritiqueAnalysis } from '@/lib/video-form-analysis'
import type { NasmAssessmentRecord } from '@/lib/nasm-assessments'
import { calculateFfmi, calculateCunninghamBmr, classifyBodyFat } from '@/lib/ai-body-composition-engine'
import { resolveClientConditioningTier } from '@/lib/muscle-recovery-telemetry'

export interface HubProfileData {
  full_name?: string | null
  sex?: 'male' | 'female' | 'other'
  age?: number
  height_cm?: number
  weight_kg?: number
  waist_cm?: number
  neck_cm?: number
  hip_cm?: number
  resting_heart_rate?: number
  fitness_goal?: string
  preferred_units?: 'metric' | 'imperial'
  training_days_per_week?: number
  target_bodyfat_percent?: number
  before_photo_url?: string
  equipment_access?: string[]
  cardio_equipment_access?: string[]
  experience_level?: string | null
  activity_level?: string | null
  injuries_limitations?: string | null
}

// Dynamic import for heavy MediaPipe AI vision studio
const VideoCritiqueStudio = dynamic(() => import('@/components/fitness/VideoCritiqueStudio'), {
  ssr: false,
  loading: () => (
    <div style={{ padding: 32, textAlign: 'center', background: 'var(--navy-mid)', border: '1px solid var(--navy-lt)', borderRadius: 8 }}>
      <div style={{ marginBottom: 8 }}>
        <GaaIcon name="camera" tone="gold" size={28} />
      </div>
      <div style={{ color: 'var(--gold-lt)', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 16, fontWeight: 700, letterSpacing: '0.04em' }}>
        Loading AI Biomechanical Scanner...
      </div>
      <div style={{ color: 'var(--gray)', fontSize: 12 }}>Initializing neural joint models</div>
    </div>
  ),
})

export type FitnessLabTool =
  | 'readiness'
  | 'sleep'
  | 'roadmap'
  | 'video'
  | 'nutrition'
  | 'assessment'
  | 'performance'
  | 'calculator'
  | 'travel'
  | 'bodycomp'

interface FitnessLabDiagnosticsViewProps {
  activeLabTool: FitnessLabTool
  onSelectTool: (tool: FitnessLabTool) => void
  profile: HubProfileData | null
  intake?: {
    parq_answers?: unknown
    parq_any_yes?: boolean
    medications?: string | null
    medical_conditions?: string | null
    surgeries_or_injuries?: string | null
    allergies?: string | null
    [key: string]: unknown
  } | null
  plan: { nasm_opt_phase?: number; plan_json?: unknown } | null
  latestAssessment: NasmAssessmentRecord | null
  bodyfatState: { estimated: string }
  logs?: Array<{ id?: string; session_date: string; session_title?: string; exertion_rpe?: number; created_at?: string }>
  setLogs?: Array<{ id?: string; session_date: string; exercise_name: string; set_number?: number; reps?: number; rpe?: number; tempo?: string; created_at?: string }>
  plans?: Array<{ id?: string; plan_json?: { workouts?: Array<{ focus: string; exercises: Array<{ name: string; sets: string; reps: string; tempo?: string | null }> }> }; created_at?: string }>
  telemetry?: DailyBiometricSummary | null
  onApplyTravelPlan?: (scenario: TravelLocationScenario, adaptedExercises: ExercisePlanItem[]) => void
  initialLift?: LiftType
  initialCritique?: VideoCritiqueAnalysis | null
  onUpdateBodyfat?: (newVal: number) => void
  initialTab?: 'heatmap' | 'gate' | 'acwr' | 'deload' | '3d'
}

export default function FitnessLabDiagnosticsView({
  activeLabTool,
  onSelectTool,
  profile,
  intake,
  plan,
  latestAssessment,
  bodyfatState,
  logs = [],
  setLogs = [],
  plans = [],
  telemetry,
  onApplyTravelPlan,
  initialLift,
  initialCritique,
  onUpdateBodyfat,
  initialTab,
}: FitnessLabDiagnosticsViewProps) {
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false)

  const weightKg = profile?.weight_kg || 80
  const heightCm = profile?.height_cm || 178
  const sex = profile?.sex || 'male'
  const currentBf = Number(bodyfatState.estimated) || 15.0

  const fatMassKg = Math.round(weightKg * (currentBf / 100) * 10) / 10
  const leanMassKg = Math.round((weightKg - fatMassKg) * 10) / 10
  const fatMassLbs = Math.round(fatMassKg * 2.20462)
  const leanMassLbs = Math.round(leanMassKg * 2.20462)
  const { ffmi, category: ffmiCategory } = calculateFfmi(leanMassKg, heightCm)
  const cunninghamBmr = calculateCunninghamBmr(leanMassKg)
  const classification = classifyBodyFat(currentBf, sex)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
      {/* Lab Header */}
      <div style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(13,27,42,0.95) 100%)', border: '1px solid rgba(56,189,248,0.35)', borderRadius: 8, padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <GaaIcon name="compass" tone="cyan" size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', letterSpacing: '0.04em', fontSize: 22, fontWeight: 700, color: '#FFFFFF' }}>
              Gordon Athletic Advisory · Sports Science &amp; Fitness Lab
            </h2>
            <p style={{ margin: '2px 0 0', color: '#93C5FD', fontSize: 12 }}>
              Clinical recovery matrix, AI DEXA body composition, periodization roadmap, and sports performance diagnostic tools.
            </p>
          </div>
        </div>
      </div>

      {/* Lab Sub-Tool Selector Snap Rail (Sticky for Zero-Scroll Switching) */}
      <div
        className="luxury-snap-rail luxury-snap-rail-responsive"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'rgba(8, 14, 20, 0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '8px 4px',
          borderRadius: 8,
          border: '1px solid rgba(56,189,248,0.25)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        }}
      >
        {[
          { id: 'bodycomp' as const, icon: 'dna' as GaaIconName, title: 'AI DEXA Body Comp', desc: '4C Vision & FFMI', highlight: true },
          { id: 'readiness' as const, icon: 'dna' as GaaIconName, title: '3D Recovery Matrix', desc: 'CNS & Muscle Heatmap' },
          { id: 'video' as const, icon: 'camera' as GaaIconName, title: 'Form & Correctives', desc: 'Kinetic Faults & CEx' },
          { id: 'roadmap' as const, icon: 'periodization' as GaaIconName, title: '12-Wk Periodization', desc: 'OPT™ Phase Roadmap' },
          { id: 'nutrition' as const, icon: 'supplements' as GaaIconName, title: 'OPT™ Nutrition', desc: 'Macros & Dining Out' },
          { id: 'travel' as const, icon: 'travel' as GaaIconName, title: 'Hotel Gym Adapter', desc: 'On-the-Road Equipment' },
          { id: 'assessment' as const, icon: 'movement-screen' as GaaIconName, title: 'Mobility Radar', desc: 'Overhead Squat Screen' },
        ].map(tool => {
          const isSelected = activeLabTool === tool.id
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelectTool(tool.id)}
              className={`tactile-btn ${isSelected ? '' : 'luxury-snap-item'}`}
              style={{
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(56,189,248,0.25) 0%, rgba(56,189,248,0.08) 100%)'
                  : (tool.highlight ? 'rgba(212,160,23,0.08)' : 'rgba(255,255,255,0.03)'),
                border: isSelected
                  ? '1px solid #38BDF8'
                  : (tool.highlight ? '1px solid rgba(212,160,23,0.3)' : '1px solid rgba(255,255,255,0.08)'),
                borderRadius: 6,
                padding: '8px 10px',
                textAlign: 'left',
                cursor: 'pointer',
                color: isSelected ? '#38BDF8' : (tool.highlight ? 'var(--gold-lt)' : '#FFFFFF'),
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                minWidth: 150,
                boxShadow: isSelected ? '0 0 12px rgba(56,189,248,0.3)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <GaaIcon name={tool.icon} tone={isSelected ? 'cyan' : (tool.highlight ? 'gold' : 'slate')} size={14} />
                <span style={{ fontFamily: 'var(--font-sans, Raleway), sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1.1 }}>{tool.title}</span>
              </div>
              <div style={{ fontSize: 9.5, color: isSelected ? '#BAE6FD' : 'var(--gray)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tool.desc}</div>
            </button>
          )
        })}
      </div>

      {/* Active Lab Tool Container */}
      <div style={{ marginTop: 4 }}>
        {/* ── AI DEXA BODY COMPOSITION STUDIO ── */}
        {activeLabTool === 'bodycomp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                background: 'linear-gradient(180deg, #0A0E18 0%, #060912 100%)',
                border: '1px solid rgba(212,160,23,0.35)',
                borderRadius: 12,
                padding: 'clamp(16px, 3vw, 24px)',
                color: '#FFFFFF',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 700 }}>
                    Sports Science Diagnostic Suite
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 22, fontWeight: 700, letterSpacing: '0.04em', margin: '4px 0 0' }}>
                    AI DEXA-Vision Body Composition &amp; Recomposition Engine
                  </h3>
                  <p style={{ margin: '4px 0 0', color: 'var(--gray)', fontSize: 13 }}>
                    Multi-view spatial anthropometry, anatomical computer vision definition analysis, and Cunningham Lean Mass metabolism.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsScannerModalOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, #D4A017 0%, #F59E0B 100%)',
                    color: '#000000',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 20px',
                    fontFamily: 'var(--font-sans, Raleway), sans-serif',
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 20px rgba(212,160,23,0.35)',
                  }}
                >
                  <GaaIcon name="camera" size={18} />
                  <span>Launch Live DEXA Vision Scanner</span>
                </button>
              </div>

              {/* Current Status Cockpit Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.3)', borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 700 }}>Body Fat %</div>
                  <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 30, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1, marginTop: 4 }}>
                    {currentBf}%
                  </div>
                  <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>{classification} · {fatMassLbs} lbs fat</div>
                </div>

                <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 11, color: '#93C5FD', textTransform: 'uppercase', fontWeight: 700 }}>Lean Body Mass</div>
                  <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 30, fontWeight: 700, color: '#38BDF8', lineHeight: 1.1, marginTop: 4 }}>
                    {leanMassLbs} <span style={{ fontSize: 16, fontFamily: 'var(--font-sans, Raleway), sans-serif', fontWeight: 600 }}>lbs</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray)' }}>{leanMassKg} kg LBM</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>Fat-Free Mass Index (FFMI)</div>
                  <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 30, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1, marginTop: 4 }}>
                    {ffmi}
                  </div>
                  <div style={{ fontSize: 11, color: '#38BDF8' }}>{ffmiCategory}</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>Cunningham BMR</div>
                  <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 30, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1, marginTop: 4 }}>
                    {cunninghamBmr} <span style={{ fontSize: 16, fontFamily: 'var(--font-sans, Raleway), sans-serif', fontWeight: 600 }}>kcal</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray)' }}>TDEE: ~{Math.round(cunninghamBmr * 1.55)} kcal</div>
                </div>
              </div>

              {/* Protocol Highlights */}
              <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 14 }}>
                <h4 style={{ margin: '0 0 8px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 16, fontWeight: 700, color: '#D4A017', letterSpacing: '0.04em' }}>
                  Clinical DEXA Standards &amp; Computer Vision Architecture
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, fontSize: 12, color: 'var(--gray)' }}>
                  <div>
                    <strong style={{ color: '#FFF' }}>1. 3D Spatial Anthropometry:</strong> Multi-view fusion (Anterior, Lateral, Posterior) eliminates sagittal depth distortion and accounts for abdominal lordosis vs true adipose.
                  </div>
                  <div>
                    <strong style={{ color: '#FFF' }}>2. 7-Zone Anatomical Definition:</strong> Inspects linea alba, deltoid cap striations, serratus anterior, and gluteal-femoral crease depth.
                  </div>
                  <div>
                    <strong style={{ color: '#FFF' }}>3. Cunningham LBM Metabolism:</strong> Calculates basal metabolic needs from lean muscle mass (BMR = 370 + 21.6 × LBM kg) rather than generic total weight formulas.
                  </div>
                </div>
              </div>
            </div>

            <AiBodyCompositionScannerModal
              isOpen={isScannerModalOpen}
              onClose={() => setIsScannerModalOpen(false)}
              initialSex={profile?.sex}
              initialHeightCm={profile?.height_cm}
              initialWeightKg={profile?.weight_kg}
              initialAge={profile?.age}
              initialWaistCm={profile?.waist_cm}
              initialNeckCm={profile?.neck_cm}
              initialHipCm={profile?.hip_cm}
              onApplyScan={scan => {
                onUpdateBodyfat?.(scan.estimatedBodyFatPercent)
              }}
            />
          </div>
        )}

        {activeLabTool === 'readiness' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: 'rgba(212,160,23,0.06)',
                border: '1px solid rgba(212,160,23,0.25)',
                borderRadius: 6,
                marginBottom: 16,
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <GaaIcon name="radio" size={16} tone="gold" />
                <span style={{ fontSize: 12, color: 'var(--white)', fontWeight: 600 }}>
                  Biometric Telemetry &amp; Autonomous Modulations
                </span>
              </div>
              <a
                href="/dashboard/settings?tab=wearables"
                style={{
                  fontSize: 11,
                  color: 'var(--gold-lt)',
                  textDecoration: 'none',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                Configure Wearable Bridges →
              </a>
            </div>
            <ReadinessRecoveryTracker
              initialAge={profile?.age ?? 35}
              initialSex={(profile?.sex as 'male' | 'female') ?? 'male'}
              initialConditioning={resolveClientConditioningTier(profile, plan, logs?.length)}
              clientGoal={profile?.fitness_goal ?? (plan?.plan_json as { goal?: string })?.goal ?? 'Body Recomposition & Maximal Power Output'}
              intake={intake}
              profile={profile}
              workoutLogs={logs}
              workoutSetLogs={setLogs}
              workoutPlans={plans}
              telemetry={telemetry}
              initialTab={initialTab}
            />
          </div>
        )}

        {activeLabTool === 'sleep' && (
          <ExecutiveSleepBiometricsHud telemetry={telemetry} />
        )}

        {activeLabTool === 'roadmap' && (
          <PeriodizationRoadmapView
            clientGoal={profile?.fitness_goal ?? 'Body Recomposition & Maximal Power Output'}
          />
        )}

        {activeLabTool === 'video' && (
          <VideoCritiqueStudio initialLift={initialLift} initialCritique={initialCritique} />
        )}

        {activeLabTool === 'nutrition' && (
          <MetabolicNutritionProtocol
            bodyweightLbs={profile?.weight_kg ? Math.round(profile.weight_kg * 2.20462) : 185}
            goal={profile?.fitness_goal?.toLowerCase().includes('muscle') || profile?.fitness_goal?.toLowerCase().includes('hypertrophy') ? 'hypertrophy' : (profile?.fitness_goal?.toLowerCase().includes('power') ? 'athletic_power' : 'fat_loss')}
            initialAge={profile?.age ?? 35}
            initialSex={profile?.sex ?? 'male'}
            initialHeightInches={profile?.height_cm ? Math.round(profile.height_cm / 2.54) : 70}
            initialBodyFat={Number(bodyfatState.estimated) || 16}
            telemetry={telemetry}
            intake={intake}
          />
        )}

        {activeLabTool === 'assessment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ClinicalKineticWarmupModule latestAssessment={latestAssessment} />
            <NasmAssessmentSummary assessment={latestAssessment ?? null} />
          </div>
        )}

        {activeLabTool === 'performance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <PlyometricPowerStudio
              initialOptPhase={plan?.nasm_opt_phase ?? 1}
              athleteBodyweightLbs={profile?.weight_kg ? Math.round(profile.weight_kg * 2.20462) : 185}
            />
            <AthleticPerformanceStudio
              initialSex={profile?.sex ?? 'male'}
              initialAge={profile?.age ?? 30}
            />
          </div>
        )}

        {activeLabTool === 'calculator' && (
          <SportsScienceCalculator />
        )}

        {activeLabTool === 'travel' && (
          <ExecutiveTravelAdapterStudio plan={plan} onApplyTravelPlan={onApplyTravelPlan} />
        )}
      </div>
    </div>
  )
}
