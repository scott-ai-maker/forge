'use client'

import React, { useState, useMemo, useEffect } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  BiologicalSex,
  ConditioningLevel,
  PerspectiveView,
  MuscleZoneId,
  RecoverySupplementKey,
  SUPPLEMENT_RECOVERY_EFFECTS,
  MuscleTrainingStrain,
  calculateMuscleRecoveryTelemetry,
  MuscleRecoveryState,
  extractMuscleStrainsFromWorkoutLogs,
  resolveClientConditioningTier,
  parseParqMedicationsAndConditions,
  getGoalRecommendedRecoverySupplements,
  screenRecoverySupplementsForContraindications,
} from '@/lib/muscle-recovery-telemetry'

interface Props {
  initialAge?: number
  initialSex?: BiologicalSex
  initialConditioning?: ConditioningLevel
  clientGoal?: string
  intake?: {
    parq_answers?: unknown
    medications?: string | null
    medical_conditions?: string | null
    allergies?: string | null
  } | null
  profile?: {
    age?: number
    sex?: 'male' | 'female' | 'other'
    experience_level?: string | null
    activity_level?: string | null
    fitness_goal?: string | null
  } | null
  workoutLogs?: Array<{ id?: string; session_date: string; session_title?: string; exertion_rpe?: number; created_at?: string }>
  workoutSetLogs?: Array<{ id?: string; session_date: string; exercise_name: string; set_number?: number; reps?: number; rpe?: number; tempo?: string; created_at?: string }>
  workoutPlans?: Array<{ id?: string; plan_json?: { workouts?: Array<{ focus: string; exercises: Array<{ name: string; sets: string; reps: string; tempo?: string | null }> }> }; created_at?: string }>
  className?: string
}

const MUSCLE_TARGET_COORDINATES: Record<MuscleZoneId, { anterior?: [number, number][]; posterior?: [number, number][] }> = {
  chest: { anterior: [[216, 195], [296, 195]] },
  deltoids_anterior: { anterior: [[164, 185], [348, 185]] },
  deltoids_lateral: { anterior: [[154, 190], [358, 190]], posterior: [[154, 190], [358, 190]] },
  deltoids_posterior: { posterior: [[164, 185], [348, 185]] },
  biceps: { anterior: [[138, 260], [374, 260]] },
  triceps: { posterior: [[135, 260], [377, 260]] },
  forearms: { anterior: [[110, 335], [402, 335]] },
  abdominals: { anterior: [[256, 300]] },
  obliques: { anterior: [[212, 300], [300, 300]] },
  trapezius: { posterior: [[256, 180]] },
  rhomboids: { posterior: [[236, 210], [276, 210]] },
  latissimus_dorsi: { posterior: [[210, 270], [302, 270]] },
  erector_spinae: { posterior: [[256, 310]] },
  gluteals: { posterior: [[218, 415], [294, 415]] },
  quadriceps: { anterior: [[210, 465], [302, 465]] },
  hamstrings: { posterior: [[210, 520], [302, 520]] },
  calves_gastrocnemius: { posterior: [[208, 650], [304, 650]] },
  tibialis_anterior: { anterior: [[208, 650], [304, 650]] },
}

export default function MuscleRecoveryHeatmap3D({
  initialAge = 38,
  initialSex = 'male',
  initialConditioning,
  clientGoal,
  intake,
  profile,
  workoutLogs = [],
  workoutSetLogs = [],
  workoutPlans = [],
}: Props) {
  // Asynchronously hydrate client intake if not passed via props
  const [fetchedIntake, setFetchedIntake] = useState<Props['intake'] | null>(null)
  useEffect(() => {
    if (!intake) {
      fetch('/api/fitness/profile')
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (data?.intake) setFetchedIntake(data.intake)
        })
        .catch(() => {})
    }
  }, [intake])

  const activeIntake = intake ?? fetchedIntake

  // Automatically determine client's chronological age and conditioning tier from profile
  const autoResolvedAge =
    typeof profile?.age === 'number' && profile.age > 0 ? profile.age : initialAge

  const autoResolvedConditioning =
    initialConditioning ??
    resolveClientConditioningTier(
      profile,
      (workoutPlans?.[0] as { nasm_opt_phase?: number; phase_name?: string } | undefined) ?? null,
      workoutLogs?.length
    )

  // Biological Inputs
  const [sex] = useState<BiologicalSex>(initialSex)
  const [age, setAge] = useState<number>(autoResolvedAge)
  const [conditioning, setConditioning] = useState<ConditioningLevel>(autoResolvedConditioning)
  const [perspective, setPerspective] = useState<PerspectiveView>('anterior')

  // Synchronize when profile props change
  useEffect(() => {
    if (typeof profile?.age === 'number' && profile.age > 0) {
      setAge(profile.age)
    } else if (initialAge) {
      setAge(initialAge)
    }
  }, [profile?.age, initialAge])

  useEffect(() => {
    const tier =
      initialConditioning ??
      resolveClientConditioningTier(
        profile,
        (workoutPlans?.[0] as { nasm_opt_phase?: number; phase_name?: string } | undefined) ?? null,
        workoutLogs?.length
      )
    setConditioning(tier)
  }, [initialConditioning, profile, workoutPlans, workoutLogs?.length])

  // Time-Lapse Resolution Offset (0 = Live Now, +12h, +24h, +48h, +72h)
  const [timeLapseHoursOffset, setTimeLapseHoursOffset] = useState<number>(0)

  // Ingest Live Real Workout Data
  const liveExtraction = useMemo(() => {
    return extractMuscleStrainsFromWorkoutLogs({
      workoutLogs,
      workoutSetLogs,
      workoutPlans,
      hoursOffset: timeLapseHoursOffset,
    })
  }, [workoutLogs, workoutSetLogs, workoutPlans, timeLapseHoursOffset])

  // Telemetry always runs on live workout data (data source / scenario selector removed)
  const activeStrains = liveExtraction.strains

  // Parse PAR-Q medications and health conditions
  const medicalProfile = useMemo(() => {
    return parseParqMedicationsAndConditions(
      activeIntake?.parq_answers as Record<string, unknown> | undefined,
      activeIntake?.medications,
      activeIntake?.medical_conditions
    )
  }, [activeIntake])

  // Resolve client's fitness goal
  const effectiveGoal =
    clientGoal ||
    profile?.fitness_goal ||
    (workoutPlans?.[0]?.plan_json as { goal?: string })?.goal ||
    'hypertrophy'

  // Goal-recommended supplements
  const goalRecommendedSupps = useMemo(() => {
    return getGoalRecommendedRecoverySupplements(effectiveGoal, age >= 45)
  }, [effectiveGoal, age])

  // Screen goal-recommended supplements against PAR-Q medications
  const screeningResult = useMemo(() => {
    return screenRecoverySupplementsForContraindications(goalRecommendedSupps, medicalProfile)
  }, [goalRecommendedSupps, medicalProfile])

  // Screen all available recovery supplements so contraindicated ones cannot be toggled
  const allSupplementsScreening = useMemo(() => {
    return screenRecoverySupplementsForContraindications(
      Object.keys(SUPPLEMENT_RECOVERY_EFFECTS) as RecoverySupplementKey[],
      medicalProfile
    )
  }, [medicalProfile])

  // Supplement Stacking State: auto-selected to goal-matching, safe supplements
  const [activeSupplements, setActiveSupplements] = useState<RecoverySupplementKey[]>(() => {
    return screeningResult.allowedSupplements.length > 0
      ? screeningResult.allowedSupplements
      : ['whey_leucine', 'magnesium']
  })

  // Synchronize active supplements when goal or medication screening updates
  useEffect(() => {
    setActiveSupplements(prev => {
      const sanitized = prev.filter(
        key => !allSupplementsScreening.contraindicatedSupplements.some(c => c.key === key)
      )
      return sanitized.length > 0 ? sanitized : screeningResult.allowedSupplements
    })
  }, [screeningResult, allSupplementsScreening])

  // Selected Muscle for Deep Dive HUD
  const [selectedMuscleId, setSelectedMuscleId] = useState<MuscleZoneId>('chest')
  const [hoveredMuscleId, setHoveredMuscleId] = useState<MuscleZoneId | null>(null)

  // Calculate Telemetry
  const telemetry = useMemo(() => {
    return calculateMuscleRecoveryTelemetry({
      age,
      sex,
      conditioning,
      activeSupplements,
      strains: activeStrains,
    })
  }, [age, sex, conditioning, activeSupplements, activeStrains])

  const selectedMuscle: MuscleRecoveryState | undefined = telemetry.muscles[selectedMuscleId]
  const activeDetailMuscle: MuscleRecoveryState | undefined =
    (hoveredMuscleId && telemetry.muscles[hoveredMuscleId]) || selectedMuscle

  // Fresh vs Fatigued muscle counts
  const allMuscles = Object.values(telemetry.muscles)
  const freshCount = allMuscles.filter(m => m.recoveryPercentage >= 85).length

  const daysSinceLastWorkout = useMemo(() => {
    if (liveExtraction.lastWorkoutDate) {
      const diffMs = Date.now() - new Date(liveExtraction.lastWorkoutDate).getTime()
      return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)))
    }
    return 4 // Fully rested baseline
  }, [liveExtraction.lastWorkoutDate])

  const toggleSupplement = (key: RecoverySupplementKey) => {
    const isContraindicated = allSupplementsScreening.contraindicatedSupplements.some(c => c.key === key)
    if (isContraindicated) return
    setActiveSupplements(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]))
  }

  // Get dynamic overlay opacity for fatigued muscles
  const getOverlayOpacity = (zoneId: MuscleZoneId) => {
    const isSelected = selectedMuscleId === zoneId || hoveredMuscleId === zoneId
    const muscle = telemetry.muscles[zoneId]
    if (!muscle) return 0
    // If no active strain on this muscle and fully recovered, keep it transparent to show authentic body base
    if (muscle.recoveryPercentage >= 95 && activeStrains.every((s: MuscleTrainingStrain) => s.muscleId !== zoneId)) {
      return isSelected ? 0.35 : 0
    }
    if (isSelected) return 0.85
    if (muscle.recoveryPercentage < 30) return 0.75
    if (muscle.recoveryPercentage < 60) return 0.65
    return 0.55
  }

  const getMuscleStroke = (zoneId: MuscleZoneId) => {
    if (selectedMuscleId === zoneId || hoveredMuscleId === zoneId) {
      return '#FFFFFF'
    }
    return 'rgba(255,255,255,0.18)'
  }

  const getMuscleStrokeWidth = (zoneId: MuscleZoneId) => {
    if (selectedMuscleId === zoneId || hoveredMuscleId === zoneId) {
      return 2
    }
    return 0.6
  }

  const muscleLoggedSession = activeDetailMuscle ? liveExtraction.muscleLastTrained[activeDetailMuscle.muscleId] : undefined

  return (
    <div
      style={{
        display: 'grid',
        gap: 24,
        background: 'linear-gradient(180deg, #0A0E18 0%, #05080F 100%)',
        border: '1px solid rgba(212,160,23,0.35)',
        borderRadius: 16,
        padding: 'clamp(10px, 2.5vw, 22px)',
        color: '#FFFFFF',
        boxShadow: '0 25px 60px rgba(0,0,0,0.75)',
      }}
    >
      {/* ── Header Cockpit ──────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 18,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--gold-lt)',
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Forge Athletic · Biomechanical Supercompensation
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 22,
              letterSpacing: '0.04em',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            3D Anatomical Muscle Recovery Matrix
            <span
              style={{
                fontSize: 11,
                background: 'linear-gradient(135deg, rgba(212,160,23,0.25), rgba(212,160,23,0.08))',
                color: 'var(--gold-lt)',
                padding: '4px 10px',
                borderRadius: 4,
                border: '1px solid rgba(212,160,23,0.4)',
                fontFamily: 'system-ui, sans-serif',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Advanced settings
            </span>
          </h3>
        </div>

        {/* Global System Readiness Score Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '8px 16px',
            borderRadius: 8,
          }}
        >
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              System Readiness
            </div>
            <div
              style={{
                fontFamily: 'var(--font-telemetry, monospace)',
                fontSize: 24,
                fontWeight: 700,
                color:
                  telemetry.overallBodyReadinessScore >= 80
                    ? '#10B981'
                    : telemetry.overallBodyReadinessScore >= 50
                    ? '#FBBF24'
                    : '#DC2626',
              }}
            >
              {telemetry.overallBodyReadinessScore}%
            </div>
          </div>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background:
                telemetry.overallBodyReadinessScore >= 80
                  ? '#10B981'
                  : telemetry.overallBodyReadinessScore >= 50
                  ? '#FBBF24'
                  : '#DC2626',
              boxShadow: `0 0 12px ${
                telemetry.overallBodyReadinessScore >= 80 ? '#10B981' : '#DC2626'
              }`,
            }}
          />
        </div>
      </div>

      {/* ── Main Viewport Grid ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))',
          gap: 22,
          alignItems: 'start',
        }}
      >
        {/* ── Left Column: Authentic Mobile-Style Anatomical Viewport ──── */}
        <div
          style={{
            position: 'relative',
            background: 'radial-gradient(ellipse at 50% 30%, #151A27 0%, #090C14 85%)',
            border: '1px solid rgba(212,160,23,0.3)',
            borderRadius: 16,
            padding: 'clamp(12px, 3vw, 24px) clamp(6px, 1.8vw, 16px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: 660,
            overflow: 'hidden',
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.85), 0 15px 35px rgba(0,0,0,0.6)',
          }}
        >
          {/* Top Segmented Navigation (Anterior / Posterior) */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              maxWidth: 320,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 30,
              padding: 4,
              marginBottom: 16,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <button
              type="button"
              onClick={() => setPerspective('anterior')}
              style={{
                flex: 1,
                background: perspective === 'anterior' ? 'linear-gradient(180deg, rgba(212,160,23,0.35), rgba(212,160,23,0.15))' : 'transparent',
                color: perspective === 'anterior' ? 'var(--gold-lt)' : 'var(--gray)',
                border: perspective === 'anterior' ? '1px solid rgba(212,160,23,0.45)' : '1px solid transparent',
                borderRadius: 24,
                padding: '7px 0',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Anterior (Front)
            </button>
            <button
              type="button"
              onClick={() => setPerspective('posterior')}
              style={{
                flex: 1,
                background: perspective === 'posterior' ? 'linear-gradient(180deg, rgba(212,160,23,0.35), rgba(212,160,23,0.15))' : 'transparent',
                color: perspective === 'posterior' ? 'var(--gold-lt)' : 'var(--gray)',
                border: perspective === 'posterior' ? '1px solid rgba(212,160,23,0.45)' : '1px solid transparent',
                borderRadius: 24,
                padding: '7px 0',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Posterior (Back)
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              maxWidth: 320,
              marginBottom: 12,
              padding: '0 8px',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 30, fontWeight: 700, lineHeight: 1, color: '#FFFFFF' }}>
                {daysSinceLastWorkout}
              </div>
              <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', maxWidth: 100, marginTop: 4 }}>
                Days Since Last Lift
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 30, fontWeight: 700, lineHeight: 1, color: '#10B981' }}>
                {freshCount}
              </div>
              <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', maxWidth: 100, marginTop: 4 }}>
                Fresh Muscle Groups
              </div>
            </div>
          </div>

          {/* ── AUTHENTIC HIGH-RES ANATOMY CANVAS WITH DYNAMIC HEATMAP OVERLAYS ── */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 360, margin: '0 auto', aspectRatio: '2/3' }}>
            <svg
              viewBox="0 0 512 768"
              style={{
                width: '100%',
                height: '100%',
                filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.95))',
                userSelect: 'none',
              }}
            >
              <defs>
                {/* Glow Filter for Active Muscle Selection */}
                <filter id="muscleOverlayGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="hudNeonGlow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="5" result="glow" />
                  <feComposite in="SourceGraphic" in2="glow" operator="over" />
                </filter>

                {/* Volumetric Biomechanical Gradients for True Sports Science Lab Depth */}
                <radialGradient id="grad_chest_left" cx="42%" cy="46%" r="58%">
                  <stop offset="0%" stopColor={telemetry.muscles.chest.colorHex} stopOpacity="0.88" />
                  <stop offset="70%" stopColor={telemetry.muscles.chest.colorHex} stopOpacity="0.62" />
                  <stop offset="100%" stopColor={telemetry.muscles.chest.colorHex} stopOpacity="0.32" />
                </radialGradient>
                <radialGradient id="grad_chest_right" cx="58%" cy="46%" r="58%">
                  <stop offset="0%" stopColor={telemetry.muscles.chest.colorHex} stopOpacity="0.88" />
                  <stop offset="70%" stopColor={telemetry.muscles.chest.colorHex} stopOpacity="0.62" />
                  <stop offset="100%" stopColor={telemetry.muscles.chest.colorHex} stopOpacity="0.32" />
                </radialGradient>

                <radialGradient id="grad_delt_ant_left" cx="45%" cy="45%" r="55%">
                  <stop offset="0%" stopColor={telemetry.muscles.deltoids_anterior.colorHex} stopOpacity="0.88" />
                  <stop offset="75%" stopColor={telemetry.muscles.deltoids_anterior.colorHex} stopOpacity="0.58" />
                  <stop offset="100%" stopColor={telemetry.muscles.deltoids_anterior.colorHex} stopOpacity="0.28" />
                </radialGradient>
                <radialGradient id="grad_delt_ant_right" cx="55%" cy="45%" r="55%">
                  <stop offset="0%" stopColor={telemetry.muscles.deltoids_anterior.colorHex} stopOpacity="0.88" />
                  <stop offset="75%" stopColor={telemetry.muscles.deltoids_anterior.colorHex} stopOpacity="0.58" />
                  <stop offset="100%" stopColor={telemetry.muscles.deltoids_anterior.colorHex} stopOpacity="0.28" />
                </radialGradient>

                <linearGradient id="grad_bicep_left" x1="60%" y1="0%" x2="20%" y2="100%">
                  <stop offset="0%" stopColor={telemetry.muscles.biceps.colorHex} stopOpacity="0.85" />
                  <stop offset="50%" stopColor={telemetry.muscles.biceps.colorHex} stopOpacity="0.7" />
                  <stop offset="100%" stopColor={telemetry.muscles.biceps.colorHex} stopOpacity="0.35" />
                </linearGradient>
                <linearGradient id="grad_bicep_right" x1="40%" y1="0%" x2="80%" y2="100%">
                  <stop offset="0%" stopColor={telemetry.muscles.biceps.colorHex} stopOpacity="0.85" />
                  <stop offset="50%" stopColor={telemetry.muscles.biceps.colorHex} stopOpacity="0.7" />
                  <stop offset="100%" stopColor={telemetry.muscles.biceps.colorHex} stopOpacity="0.35" />
                </linearGradient>

                <linearGradient id="grad_forearm_left" x1="70%" y1="0%" x2="20%" y2="100%">
                  <stop offset="0%" stopColor={telemetry.muscles.forearms.colorHex} stopOpacity="0.82" />
                  <stop offset="60%" stopColor={telemetry.muscles.forearms.colorHex} stopOpacity="0.65" />
                  <stop offset="100%" stopColor={telemetry.muscles.forearms.colorHex} stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="grad_forearm_right" x1="30%" y1="0%" x2="80%" y2="100%">
                  <stop offset="0%" stopColor={telemetry.muscles.forearms.colorHex} stopOpacity="0.82" />
                  <stop offset="60%" stopColor={telemetry.muscles.forearms.colorHex} stopOpacity="0.65" />
                  <stop offset="100%" stopColor={telemetry.muscles.forearms.colorHex} stopOpacity="0.3" />
                </linearGradient>

                <linearGradient id="grad_abs" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor={telemetry.muscles.abdominals.colorHex} stopOpacity="0.88" />
                  <stop offset="50%" stopColor={telemetry.muscles.abdominals.colorHex} stopOpacity="0.72" />
                  <stop offset="100%" stopColor={telemetry.muscles.abdominals.colorHex} stopOpacity="0.4" />
                </linearGradient>

                <linearGradient id="grad_oblique_left" x1="80%" y1="0%" x2="20%" y2="100%">
                  <stop offset="0%" stopColor={telemetry.muscles.obliques.colorHex} stopOpacity="0.82" />
                  <stop offset="100%" stopColor={telemetry.muscles.obliques.colorHex} stopOpacity="0.35" />
                </linearGradient>
                <linearGradient id="grad_oblique_right" x1="20%" y1="0%" x2="80%" y2="100%">
                  <stop offset="0%" stopColor={telemetry.muscles.obliques.colorHex} stopOpacity="0.82" />
                  <stop offset="100%" stopColor={telemetry.muscles.obliques.colorHex} stopOpacity="0.35" />
                </linearGradient>

                <linearGradient id="grad_quad_left" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor={telemetry.muscles.quadriceps.colorHex} stopOpacity="0.88" />
                  <stop offset="70%" stopColor={telemetry.muscles.quadriceps.colorHex} stopOpacity="0.7" />
                  <stop offset="100%" stopColor={telemetry.muscles.quadriceps.colorHex} stopOpacity="0.35" />
                </linearGradient>
                <linearGradient id="grad_quad_right" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor={telemetry.muscles.quadriceps.colorHex} stopOpacity="0.88" />
                  <stop offset="70%" stopColor={telemetry.muscles.quadriceps.colorHex} stopOpacity="0.7" />
                  <stop offset="100%" stopColor={telemetry.muscles.quadriceps.colorHex} stopOpacity="0.35" />
                </linearGradient>

                <linearGradient id="grad_tib_left" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor={telemetry.muscles.tibialis_anterior.colorHex} stopOpacity="0.82" />
                  <stop offset="100%" stopColor={telemetry.muscles.tibialis_anterior.colorHex} stopOpacity="0.35" />
                </linearGradient>
                <linearGradient id="grad_tib_right" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor={telemetry.muscles.tibialis_anterior.colorHex} stopOpacity="0.82" />
                  <stop offset="100%" stopColor={telemetry.muscles.tibialis_anterior.colorHex} stopOpacity="0.35" />
                </linearGradient>

                {/* Posterior Volumetric Gradients */}
                <radialGradient id="grad_trap" cx="50%" cy="30%" r="70%">
                  <stop offset="0%" stopColor={telemetry.muscles.trapezius.colorHex} stopOpacity="0.9" />
                  <stop offset="65%" stopColor={telemetry.muscles.trapezius.colorHex} stopOpacity="0.65" />
                  <stop offset="100%" stopColor={telemetry.muscles.trapezius.colorHex} stopOpacity="0.3" />
                </radialGradient>

                <radialGradient id="grad_delt_post_left" cx="45%" cy="45%" r="55%">
                  <stop offset="0%" stopColor={telemetry.muscles.deltoids_posterior.colorHex} stopOpacity="0.88" />
                  <stop offset="75%" stopColor={telemetry.muscles.deltoids_posterior.colorHex} stopOpacity="0.58" />
                  <stop offset="100%" stopColor={telemetry.muscles.deltoids_posterior.colorHex} stopOpacity="0.28" />
                </radialGradient>
                <radialGradient id="grad_delt_post_right" cx="55%" cy="45%" r="55%">
                  <stop offset="0%" stopColor={telemetry.muscles.deltoids_posterior.colorHex} stopOpacity="0.88" />
                  <stop offset="75%" stopColor={telemetry.muscles.deltoids_posterior.colorHex} stopOpacity="0.58" />
                  <stop offset="100%" stopColor={telemetry.muscles.deltoids_posterior.colorHex} stopOpacity="0.28" />
                </radialGradient>

                <linearGradient id="grad_tricep_left" x1="70%" y1="0%" x2="20%" y2="100%">
                  <stop offset="0%" stopColor={telemetry.muscles.triceps.colorHex} stopOpacity="0.85" />
                  <stop offset="60%" stopColor={telemetry.muscles.triceps.colorHex} stopOpacity="0.68" />
                  <stop offset="100%" stopColor={telemetry.muscles.triceps.colorHex} stopOpacity="0.35" />
                </linearGradient>
                <linearGradient id="grad_tricep_right" x1="30%" y1="0%" x2="80%" y2="100%">
                  <stop offset="0%" stopColor={telemetry.muscles.triceps.colorHex} stopOpacity="0.85" />
                  <stop offset="60%" stopColor={telemetry.muscles.triceps.colorHex} stopOpacity="0.68" />
                  <stop offset="100%" stopColor={telemetry.muscles.triceps.colorHex} stopOpacity="0.35" />
                </linearGradient>

                <linearGradient id="grad_lat_left" x1="40%" y1="0%" x2="80%" y2="100%">
                  <stop offset="0%" stopColor={telemetry.muscles.latissimus_dorsi.colorHex} stopOpacity="0.88" />
                  <stop offset="70%" stopColor={telemetry.muscles.latissimus_dorsi.colorHex} stopOpacity="0.62" />
                  <stop offset="100%" stopColor={telemetry.muscles.latissimus_dorsi.colorHex} stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="grad_lat_right" x1="60%" y1="0%" x2="20%" y2="100%">
                  <stop offset="0%" stopColor={telemetry.muscles.latissimus_dorsi.colorHex} stopOpacity="0.88" />
                  <stop offset="70%" stopColor={telemetry.muscles.latissimus_dorsi.colorHex} stopOpacity="0.62" />
                  <stop offset="100%" stopColor={telemetry.muscles.latissimus_dorsi.colorHex} stopOpacity="0.3" />
                </linearGradient>

                <linearGradient id="grad_erector" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor={telemetry.muscles.erector_spinae.colorHex} stopOpacity="0.85" />
                  <stop offset="100%" stopColor={telemetry.muscles.erector_spinae.colorHex} stopOpacity="0.4" />
                </linearGradient>

                <radialGradient id="grad_glute_left" cx="55%" cy="45%" r="55%">
                  <stop offset="0%" stopColor={telemetry.muscles.gluteals.colorHex} stopOpacity="0.9" />
                  <stop offset="70%" stopColor={telemetry.muscles.gluteals.colorHex} stopOpacity="0.65" />
                  <stop offset="100%" stopColor={telemetry.muscles.gluteals.colorHex} stopOpacity="0.3" />
                </radialGradient>
                <radialGradient id="grad_glute_right" cx="45%" cy="45%" r="55%">
                  <stop offset="0%" stopColor={telemetry.muscles.gluteals.colorHex} stopOpacity="0.9" />
                  <stop offset="70%" stopColor={telemetry.muscles.gluteals.colorHex} stopOpacity="0.65" />
                  <stop offset="100%" stopColor={telemetry.muscles.gluteals.colorHex} stopOpacity="0.3" />
                </radialGradient>

                <linearGradient id="grad_ham_left" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor={telemetry.muscles.hamstrings.colorHex} stopOpacity="0.88" />
                  <stop offset="70%" stopColor={telemetry.muscles.hamstrings.colorHex} stopOpacity="0.65" />
                  <stop offset="100%" stopColor={telemetry.muscles.hamstrings.colorHex} stopOpacity="0.35" />
                </linearGradient>
                <linearGradient id="grad_ham_right" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor={telemetry.muscles.hamstrings.colorHex} stopOpacity="0.88" />
                  <stop offset="70%" stopColor={telemetry.muscles.hamstrings.colorHex} stopOpacity="0.65" />
                  <stop offset="100%" stopColor={telemetry.muscles.hamstrings.colorHex} stopOpacity="0.35" />
                </linearGradient>

                <radialGradient id="grad_calf_left" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor={telemetry.muscles.calves_gastrocnemius.colorHex} stopOpacity="0.88" />
                  <stop offset="75%" stopColor={telemetry.muscles.calves_gastrocnemius.colorHex} stopOpacity="0.6" />
                  <stop offset="100%" stopColor={telemetry.muscles.calves_gastrocnemius.colorHex} stopOpacity="0.3" />
                </radialGradient>
                <radialGradient id="grad_calf_right" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor={telemetry.muscles.calves_gastrocnemius.colorHex} stopOpacity="0.88" />
                  <stop offset="75%" stopColor={telemetry.muscles.calves_gastrocnemius.colorHex} stopOpacity="0.6" />
                  <stop offset="100%" stopColor={telemetry.muscles.calves_gastrocnemius.colorHex} stopOpacity="0.3" />
                </radialGradient>
              </defs>

              {/* 1. Underlying Authentic High-Definition Mannequin Base Image */}
              <image
                href={`/images/anatomy/${sex}-${perspective}.jpg`}
                x="0"
                y="0"
                width="512"
                height="768"
                preserveAspectRatio="xMidYMid slice"
                style={{ opacity: 0.98 }}
              />

              {/* 2. Interactive Precision Muscle Overlays */}
              {perspective === 'anterior' && (
                <g id="anteriorOverlays" style={{ mixBlendMode: 'screen' }}>
                  {/* Chest (Left & Right Pectoralis Major) */}
                  <path
                    d={
                      sex === 'female'
                        ? 'M254 162 L190 164 C174 172 172 196 176 216 C186 234 220 238 254 232 Z'
                        : 'M254 156 L184 158 C166 166 164 195 168 214 C178 232 216 236 254 230 Z'
                    }
                    fill="url(#grad_chest_left)"
                    opacity={getOverlayOpacity('chest')}
                    stroke={getMuscleStroke('chest')}
                    strokeWidth={getMuscleStrokeWidth('chest')}
                    filter={selectedMuscleId === 'chest' || hoveredMuscleId === 'chest' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('chest')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('chest')}
                  />
                  <path
                    d={
                      sex === 'female'
                        ? 'M258 162 L322 164 C338 172 340 196 336 216 C326 234 292 238 258 232 Z'
                        : 'M258 156 L328 158 C346 166 348 195 344 214 C334 232 296 236 258 230 Z'
                    }
                    fill="url(#grad_chest_right)"
                    opacity={getOverlayOpacity('chest')}
                    stroke={getMuscleStroke('chest')}
                    strokeWidth={getMuscleStrokeWidth('chest')}
                    filter={selectedMuscleId === 'chest' || hoveredMuscleId === 'chest' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('chest')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('chest')}
                  />

                  {/* Anterior Deltoids (Shoulders Left & Right) */}
                  <path
                    d={
                      sex === 'female'
                        ? 'M188 158 C164 160 152 176 150 198 C148 218 158 228 172 228 C178 210 182 184 188 158 Z'
                        : 'M184 154 C160 156 146 172 144 195 C142 215 152 226 166 226 C174 208 178 180 184 154 Z'
                    }
                    fill="url(#grad_delt_ant_left)"
                    opacity={getOverlayOpacity('deltoids_anterior')}
                    stroke={getMuscleStroke('deltoids_anterior')}
                    strokeWidth={getMuscleStrokeWidth('deltoids_anterior')}
                    filter={selectedMuscleId === 'deltoids_anterior' || hoveredMuscleId === 'deltoids_anterior' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('deltoids_anterior')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('deltoids_anterior')}
                  />
                  <path
                    d={
                      sex === 'female'
                        ? 'M324 158 C348 160 360 176 362 198 C364 218 354 228 340 228 C334 210 330 184 324 158 Z'
                        : 'M328 154 C352 156 366 172 368 195 C370 215 360 226 346 226 C338 208 334 180 328 154 Z'
                    }
                    fill="url(#grad_delt_ant_right)"
                    opacity={getOverlayOpacity('deltoids_anterior')}
                    stroke={getMuscleStroke('deltoids_anterior')}
                    strokeWidth={getMuscleStrokeWidth('deltoids_anterior')}
                    filter={selectedMuscleId === 'deltoids_anterior' || hoveredMuscleId === 'deltoids_anterior' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('deltoids_anterior')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('deltoids_anterior')}
                  />

                  {/* Biceps (Anterior Upper Arms Left & Right) */}
                  <path
                    d={
                      sex === 'female'
                        ? 'M172 224 L142 228 C130 250 118 278 112 304 C126 308 142 308 150 302 C162 280 168 250 172 224 Z'
                        : 'M170 224 L138 228 C124 250 110 278 102 304 C118 308 136 308 146 302 C158 280 166 250 170 224 Z'
                    }
                    fill="url(#grad_bicep_left)"
                    opacity={getOverlayOpacity('biceps')}
                    stroke={getMuscleStroke('biceps')}
                    strokeWidth={getMuscleStrokeWidth('biceps')}
                    filter={selectedMuscleId === 'biceps' || hoveredMuscleId === 'biceps' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('biceps')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('biceps')}
                  />
                  <path
                    d={
                      sex === 'female'
                        ? 'M340 224 L370 228 C382 250 394 278 400 304 C386 308 370 308 362 302 C350 280 344 250 340 224 Z'
                        : 'M342 224 L374 228 C388 250 402 278 410 304 C394 308 376 308 366 302 C354 280 346 250 342 224 Z'
                    }
                    fill="url(#grad_bicep_right)"
                    opacity={getOverlayOpacity('biceps')}
                    stroke={getMuscleStroke('biceps')}
                    strokeWidth={getMuscleStrokeWidth('biceps')}
                    filter={selectedMuscleId === 'biceps' || hoveredMuscleId === 'biceps' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('biceps')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('biceps')}
                  />

                  {/* Forearms (Left & Right - Elbow to Wrist) */}
                  <path
                    d={
                      sex === 'female'
                        ? 'M150 304 L114 306 C100 330 88 350 82 368 L104 368 C120 350 136 330 150 304 Z'
                        : 'M144 304 L100 306 C84 330 72 350 68 365 L92 365 C108 350 126 330 144 304 Z'
                    }
                    fill="url(#grad_forearm_left)"
                    opacity={getOverlayOpacity('forearms')}
                    stroke={getMuscleStroke('forearms')}
                    strokeWidth={getMuscleStrokeWidth('forearms')}
                    filter={selectedMuscleId === 'forearms' || hoveredMuscleId === 'forearms' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('forearms')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('forearms')}
                  />
                  <path
                    d={
                      sex === 'female'
                        ? 'M362 304 L398 306 C412 330 424 350 430 368 L408 368 C392 350 376 330 362 304 Z'
                        : 'M368 304 L412 306 C428 330 440 350 444 365 L420 365 C404 350 386 330 368 304 Z'
                    }
                    fill="url(#grad_forearm_right)"
                    opacity={getOverlayOpacity('forearms')}
                    stroke={getMuscleStroke('forearms')}
                    strokeWidth={getMuscleStrokeWidth('forearms')}
                    filter={selectedMuscleId === 'forearms' || hoveredMuscleId === 'forearms' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('forearms')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('forearms')}
                  />

                  {/* Rectus Abdominis (Core 6-Pack) */}
                  <path
                    d={
                      sex === 'female'
                        ? 'M236 242 L276 242 C278 278 277 320 274 365 C266 374 246 374 238 365 C235 320 234 278 236 242 Z'
                        : 'M235 238 L277 238 C280 275 279 320 275 365 C266 374 246 374 237 365 C233 320 232 275 235 238 Z'
                    }
                    fill="url(#grad_abs)"
                    opacity={getOverlayOpacity('abdominals')}
                    stroke={getMuscleStroke('abdominals')}
                    strokeWidth={getMuscleStrokeWidth('abdominals')}
                    filter={selectedMuscleId === 'abdominals' || hoveredMuscleId === 'abdominals' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('abdominals')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('abdominals')}
                  />

                  {/* Obliques & Serratus (Flanks Left & Right) */}
                  <path
                    d={
                      sex === 'female'
                        ? 'M236 244 C216 250 200 274 198 312 C196 342 206 364 236 364 C234 328 234 286 236 244 Z'
                        : 'M234 240 C212 246 194 270 192 310 C190 340 200 365 234 365 C232 330 232 285 234 240 Z'
                    }
                    fill="url(#grad_oblique_left)"
                    opacity={getOverlayOpacity('obliques')}
                    stroke={getMuscleStroke('obliques')}
                    strokeWidth={getMuscleStrokeWidth('obliques')}
                    filter={selectedMuscleId === 'obliques' || hoveredMuscleId === 'obliques' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('obliques')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('obliques')}
                  />
                  <path
                    d={
                      sex === 'female'
                        ? 'M276 244 C296 250 312 274 314 312 C316 342 306 364 276 364 C278 328 278 286 276 244 Z'
                        : 'M278 240 C300 246 318 270 320 310 C322 340 312 365 278 365 C280 330 280 285 278 240 Z'
                    }
                    fill="url(#grad_oblique_right)"
                    opacity={getOverlayOpacity('obliques')}
                    stroke={getMuscleStroke('obliques')}
                    strokeWidth={getMuscleStrokeWidth('obliques')}
                    filter={selectedMuscleId === 'obliques' || hoveredMuscleId === 'obliques' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('obliques')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('obliques')}
                  />

                  {/* Quadriceps (Thighs Left & Right) */}
                  <path
                    d={
                      sex === 'female'
                        ? 'M210 386 C188 400 178 435 180 475 C182 515 194 550 208 552 C224 550 240 515 240 455 C240 415 230 390 210 386 Z'
                        : 'M210 386 C190 398 178 435 180 475 C182 515 194 550 208 552 C224 550 240 515 240 455 C240 415 230 390 210 386 Z'
                    }
                    fill="url(#grad_quad_left)"
                    opacity={getOverlayOpacity('quadriceps')}
                    stroke={getMuscleStroke('quadriceps')}
                    strokeWidth={getMuscleStrokeWidth('quadriceps')}
                    filter={selectedMuscleId === 'quadriceps' || hoveredMuscleId === 'quadriceps' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('quadriceps')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('quadriceps')}
                  />
                  <path
                    d={
                      sex === 'female'
                        ? 'M302 386 C324 400 334 435 332 475 C330 515 318 550 304 552 C288 550 272 515 272 455 C272 415 282 390 302 386 Z'
                        : 'M302 386 C322 398 334 435 332 475 C330 515 318 550 304 552 C288 550 272 515 272 455 C272 415 282 390 302 386 Z'
                    }
                    fill="url(#grad_quad_right)"
                    opacity={getOverlayOpacity('quadriceps')}
                    stroke={getMuscleStroke('quadriceps')}
                    strokeWidth={getMuscleStrokeWidth('quadriceps')}
                    filter={selectedMuscleId === 'quadriceps' || hoveredMuscleId === 'quadriceps' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('quadriceps')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('quadriceps')}
                  />

                  {/* Tibialis Anterior (Front Shins Left & Right) */}
                  <path
                    d={
                      sex === 'female'
                        ? 'M208 592 C196 610 190 645 194 690 C196 710 204 718 212 718 C220 718 224 690 224 645 C224 610 218 595 208 592 Z'
                        : 'M208 592 C196 610 190 645 194 690 C196 710 204 718 212 718 C220 718 224 690 224 645 C224 610 218 595 208 592 Z'
                    }
                    fill="url(#grad_tib_left)"
                    opacity={getOverlayOpacity('tibialis_anterior')}
                    stroke={getMuscleStroke('tibialis_anterior')}
                    strokeWidth={getMuscleStrokeWidth('tibialis_anterior')}
                    filter={selectedMuscleId === 'tibialis_anterior' || hoveredMuscleId === 'tibialis_anterior' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('tibialis_anterior')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('tibialis_anterior')}
                  />
                  <path
                    d={
                      sex === 'female'
                        ? 'M304 592 C316 610 322 645 318 690 C316 710 308 718 300 718 C292 718 288 690 288 645 C288 610 294 595 304 592 Z'
                        : 'M304 592 C316 610 322 645 318 690 C316 710 308 718 300 718 C292 718 288 690 288 645 C288 610 294 595 304 592 Z'
                    }
                    fill="url(#grad_tib_right)"
                    opacity={getOverlayOpacity('tibialis_anterior')}
                    stroke={getMuscleStroke('tibialis_anterior')}
                    strokeWidth={getMuscleStrokeWidth('tibialis_anterior')}
                    filter={selectedMuscleId === 'tibialis_anterior' || hoveredMuscleId === 'tibialis_anterior' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('tibialis_anterior')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('tibialis_anterior')}
                  />
                </g>
              )}

              {/* 3. POSTERIOR MUSCLE OVERLAYS */}
              {perspective === 'posterior' && (
                <g id="posteriorOverlays" style={{ mixBlendMode: 'screen' }}>
                  {/* Upper & Mid Trapezius (Diamond Kite Shape) */}
                  <path
                    d={
                      sex === 'female'
                        ? 'M236 112 L256 120 L276 112 L330 144 C314 175 290 215 256 256 C222 215 198 175 182 144 Z'
                        : 'M232 110 L256 118 L280 110 L335 142 C318 175 292 215 256 256 C220 215 194 175 177 142 Z'
                    }
                    fill="url(#grad_trap)"
                    opacity={getOverlayOpacity('trapezius')}
                    stroke={getMuscleStroke('trapezius')}
                    strokeWidth={getMuscleStrokeWidth('trapezius')}
                    filter={selectedMuscleId === 'trapezius' || hoveredMuscleId === 'trapezius' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('trapezius')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('trapezius')}
                  />

                  {/* Posterior Deltoids (Rear Shoulders Left & Right) */}
                  <path
                    d={
                      sex === 'female'
                        ? 'M182 144 C162 154 150 172 148 196 C146 216 156 226 170 224 C176 205 180 175 182 144 Z'
                        : 'M177 142 C158 152 144 170 142 195 C140 215 150 226 164 224 C172 205 174 175 177 142 Z'
                    }
                    fill="url(#grad_delt_post_left)"
                    opacity={getOverlayOpacity('deltoids_posterior')}
                    stroke={getMuscleStroke('deltoids_posterior')}
                    strokeWidth={getMuscleStrokeWidth('deltoids_posterior')}
                    filter={selectedMuscleId === 'deltoids_posterior' || hoveredMuscleId === 'deltoids_posterior' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('deltoids_posterior')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('deltoids_posterior')}
                  />
                  <path
                    d={
                      sex === 'female'
                        ? 'M330 144 C350 154 362 172 364 196 C366 216 356 226 342 224 C336 205 332 175 330 144 Z'
                        : 'M335 142 C354 152 368 170 370 195 C372 215 362 226 348 224 C340 205 338 175 335 142 Z'
                    }
                    fill="url(#grad_delt_post_right)"
                    opacity={getOverlayOpacity('deltoids_posterior')}
                    stroke={getMuscleStroke('deltoids_posterior')}
                    strokeWidth={getMuscleStrokeWidth('deltoids_posterior')}
                    filter={selectedMuscleId === 'deltoids_posterior' || hoveredMuscleId === 'deltoids_posterior' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('deltoids_posterior')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('deltoids_posterior')}
                  />

                  {/* Triceps (Posterior Upper Arms Left & Right) */}
                  <path
                    d={
                      sex === 'female'
                        ? 'M172 220 L134 220 C122 250 106 280 98 306 C112 310 130 310 140 304 C152 280 164 250 172 220 Z'
                        : 'M174 220 L132 220 C118 250 98 280 90 306 C106 310 125 310 135 304 C148 280 162 250 174 220 Z'
                    }
                    fill="url(#grad_tricep_left)"
                    opacity={getOverlayOpacity('triceps')}
                    stroke={getMuscleStroke('triceps')}
                    strokeWidth={getMuscleStrokeWidth('triceps')}
                    filter={selectedMuscleId === 'triceps' || hoveredMuscleId === 'triceps' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('triceps')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('triceps')}
                  />
                  <path
                    d={
                      sex === 'female'
                        ? 'M340 220 L378 220 C390 250 406 280 414 306 C400 310 382 310 372 304 C360 280 348 250 340 220 Z'
                        : 'M338 220 L380 220 C394 250 414 280 422 306 C406 310 387 310 377 304 C364 280 350 250 338 220 Z'
                    }
                    fill="url(#grad_tricep_right)"
                    opacity={getOverlayOpacity('triceps')}
                    stroke={getMuscleStroke('triceps')}
                    strokeWidth={getMuscleStrokeWidth('triceps')}
                    filter={selectedMuscleId === 'triceps' || hoveredMuscleId === 'triceps' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('triceps')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('triceps')}
                  />

                  {/* Latissimus Dorsi (Lats V-Taper Wings Left & Right) */}
                  <path
                    d={
                      sex === 'female'
                        ? 'M188 188 C180 220 186 270 194 324 C206 348 224 354 236 350 C238 300 236 250 242 226 C216 202 198 192 188 188 Z'
                        : 'M185 185 C176 220 184 270 193 325 C205 350 224 356 236 352 C238 300 236 250 242 225 C215 200 195 190 185 185 Z'
                    }
                    fill="url(#grad_lat_left)"
                    opacity={getOverlayOpacity('latissimus_dorsi')}
                    stroke={getMuscleStroke('latissimus_dorsi')}
                    strokeWidth={getMuscleStrokeWidth('latissimus_dorsi')}
                    filter={selectedMuscleId === 'latissimus_dorsi' || hoveredMuscleId === 'latissimus_dorsi' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('latissimus_dorsi')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('latissimus_dorsi')}
                  />
                  <path
                    d={
                      sex === 'female'
                        ? 'M324 188 C332 220 326 270 318 324 C306 348 288 354 276 350 C274 300 276 250 270 226 C296 202 314 192 324 188 Z'
                        : 'M327 185 C336 220 328 270 319 325 C307 350 288 356 276 352 C274 300 276 250 270 225 C297 200 317 190 327 185 Z'
                    }
                    fill="url(#grad_lat_right)"
                    opacity={getOverlayOpacity('latissimus_dorsi')}
                    stroke={getMuscleStroke('latissimus_dorsi')}
                    strokeWidth={getMuscleStrokeWidth('latissimus_dorsi')}
                    filter={selectedMuscleId === 'latissimus_dorsi' || hoveredMuscleId === 'latissimus_dorsi' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('latissimus_dorsi')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('latissimus_dorsi')}
                  />

                  {/* Erector Spinae / Lower Back Spinal Pillars */}
                  <path
                    d="M246 256 L266 256 L264 365 L248 365 Z"
                    fill="url(#grad_erector)"
                    opacity={getOverlayOpacity('erector_spinae')}
                    stroke={getMuscleStroke('erector_spinae')}
                    strokeWidth={getMuscleStrokeWidth('erector_spinae')}
                    filter={selectedMuscleId === 'erector_spinae' || hoveredMuscleId === 'erector_spinae' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('erector_spinae')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('erector_spinae')}
                  />

                  {/* Gluteals (Gluteus Maximus Left & Right) */}
                  <path
                    d={
                      sex === 'female'
                        ? 'M206 368 C182 385 178 415 184 445 C192 460 218 464 248 450 C250 415 250 385 246 372 C230 366 216 365 206 368 Z'
                        : 'M208 368 C185 385 180 415 186 445 C194 460 220 464 250 450 C252 415 252 385 248 372 C232 366 218 365 208 368 Z'
                    }
                    fill="url(#grad_glute_left)"
                    opacity={getOverlayOpacity('gluteals')}
                    stroke={getMuscleStroke('gluteals')}
                    strokeWidth={getMuscleStrokeWidth('gluteals')}
                    filter={selectedMuscleId === 'gluteals' || hoveredMuscleId === 'gluteals' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('gluteals')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('gluteals')}
                  />
                  <path
                    d={
                      sex === 'female'
                        ? 'M306 368 C330 385 334 415 328 445 C320 460 294 464 264 450 C262 415 262 385 266 372 C282 366 296 365 306 368 Z'
                        : 'M304 368 C327 385 332 415 326 445 C318 460 292 464 262 450 C260 415 260 385 264 372 C280 366 294 365 304 368 Z'
                    }
                    fill="url(#grad_glute_right)"
                    opacity={getOverlayOpacity('gluteals')}
                    stroke={getMuscleStroke('gluteals')}
                    strokeWidth={getMuscleStrokeWidth('gluteals')}
                    filter={selectedMuscleId === 'gluteals' || hoveredMuscleId === 'gluteals' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('gluteals')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('gluteals')}
                  />

                  {/* Hamstrings (Posterior Thighs Left & Right) */}
                  <path
                    d={
                      sex === 'female'
                        ? 'M208 460 C186 475 176 510 180 555 C184 575 196 584 208 584 C224 582 236 560 238 510 C240 480 228 465 208 460 Z'
                        : 'M210 460 C188 475 178 510 182 555 C186 575 198 584 210 584 C226 582 238 560 240 510 C242 480 230 465 210 460 Z'
                    }
                    fill="url(#grad_ham_left)"
                    opacity={getOverlayOpacity('hamstrings')}
                    stroke={getMuscleStroke('hamstrings')}
                    strokeWidth={getMuscleStrokeWidth('hamstrings')}
                    filter={selectedMuscleId === 'hamstrings' || hoveredMuscleId === 'hamstrings' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('hamstrings')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('hamstrings')}
                  />
                  <path
                    d={
                      sex === 'female'
                        ? 'M304 460 C326 475 336 510 332 555 C328 575 316 584 304 584 C288 582 276 560 274 510 C272 480 284 465 304 460 Z'
                        : 'M302 460 C324 475 334 510 330 555 C326 575 314 584 302 584 C286 582 274 560 272 510 C270 480 282 465 302 460 Z'
                    }
                    fill="url(#grad_ham_right)"
                    opacity={getOverlayOpacity('hamstrings')}
                    stroke={getMuscleStroke('hamstrings')}
                    strokeWidth={getMuscleStrokeWidth('hamstrings')}
                    filter={selectedMuscleId === 'hamstrings' || hoveredMuscleId === 'hamstrings' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('hamstrings')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('hamstrings')}
                  />

                  {/* Calves (Gastrocnemius Left & Right) */}
                  <path
                    d={
                      sex === 'female'
                        ? 'M208 590 C188 610 182 640 186 675 C190 705 200 720 208 720 C218 720 228 690 228 645 C228 610 220 595 208 590 Z'
                        : 'M208 590 C188 610 182 640 186 675 C190 705 200 720 208 720 C218 720 228 690 228 645 C228 610 220 595 208 590 Z'
                    }
                    fill="url(#grad_calf_left)"
                    opacity={getOverlayOpacity('calves_gastrocnemius')}
                    stroke={getMuscleStroke('calves_gastrocnemius')}
                    strokeWidth={getMuscleStrokeWidth('calves_gastrocnemius')}
                    filter={selectedMuscleId === 'calves_gastrocnemius' || hoveredMuscleId === 'calves_gastrocnemius' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('calves_gastrocnemius')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('calves_gastrocnemius')}
                  />
                  <path
                    d={
                      sex === 'female'
                        ? 'M304 590 C324 610 330 640 326 675 C322 705 312 720 304 720 C294 720 284 690 284 645 C284 610 292 595 304 590 Z'
                        : 'M304 590 C324 610 330 640 326 675 C322 705 312 720 304 720 C294 720 284 690 284 645 C284 610 292 595 304 590 Z'
                    }
                    fill="url(#grad_calf_right)"
                    opacity={getOverlayOpacity('calves_gastrocnemius')}
                    stroke={getMuscleStroke('calves_gastrocnemius')}
                    strokeWidth={getMuscleStrokeWidth('calves_gastrocnemius')}
                    filter={selectedMuscleId === 'calves_gastrocnemius' || hoveredMuscleId === 'calves_gastrocnemius' ? 'url(#hudNeonGlow)' : undefined}
                    style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={() => setHoveredMuscleId('calves_gastrocnemius')}
                    onMouseLeave={() => setHoveredMuscleId(null)}
                    onClick={() => setSelectedMuscleId('calves_gastrocnemius')}
                  />
                </g>
              )}

              {/* 4. Sports Science Biomechanical Crosshair Target Reticles */}
              {(() => {
                const activeId = hoveredMuscleId || selectedMuscleId
                if (!activeId) return null
                const coords = MUSCLE_TARGET_COORDINATES[activeId]?.[perspective]
                if (!coords || coords.length === 0) return null
                const muscleColor = telemetry.muscles[activeId]?.colorHex || '#10B981'

                return (
                  <g id="hudTargetReticles" style={{ pointerEvents: 'none' }}>
                    {coords.map(([cx, cy], idx) => (
                      <g key={`${activeId}-${idx}`}>
                        {/* Pulsing Concentric Outer HUD Ring */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r="16"
                          fill="none"
                          stroke={muscleColor}
                          strokeWidth="1.2"
                          strokeDasharray="4 3"
                          opacity="0.85"
                        />
                        {/* Inner Precision Crosshair Ring */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r="6"
                          fill="none"
                          stroke="#FFFFFF"
                          strokeWidth="1.2"
                          opacity="0.9"
                        />
                        {/* Center Pin Dot */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r="2.5"
                          fill={muscleColor}
                        />
                        {/* Target Reticle Crosshair Ticks */}
                        <line x1={cx - 20} y1={cy} x2={cx - 10} y2={cy} stroke={muscleColor} strokeWidth="1.2" />
                        <line x1={cx + 10} y1={cy} x2={cx + 20} y2={cy} stroke={muscleColor} strokeWidth="1.2" />
                        <line x1={cx} y1={cy - 20} x2={cx} y2={cy - 10} stroke={muscleColor} strokeWidth="1.2" />
                        <line x1={cx} y1={cy + 10} x2={cx} y2={cy + 20} stroke={muscleColor} strokeWidth="1.2" />
                      </g>
                    ))}
                  </g>
                )
              })()}
            </svg>

            {/* Floating 3D Rotate Perspective Button (Bottom-Left) */}
            <button
              type="button"
              onClick={() => setPerspective(p => (p === 'anterior' ? 'posterior' : 'anterior'))}
              title="Rotate 3D Body Perspective"
              style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
                transition: 'transform 0.2s, background 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.08)'
                e.currentTarget.style.background = 'rgba(212,160,23,0.3)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.14)'
              }}
            >
              ↻
            </button>
          </div>
        </div>

        {/* ── Right Column: Selected Muscle Telemetry & Restorative Protocol HUD ── */}
        <div style={{ display: 'grid', gap: 16 }}>
          {activeDetailMuscle && (
            <div
              style={{
                background: 'rgba(10,16,28,0.75)',
                border: `1px solid ${activeDetailMuscle.colorHex}66`,
                borderRadius: 14,
                padding: '22px',
                position: 'relative',
                boxShadow: `0 10px 30px ${activeDetailMuscle.colorHex}22`,
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Muscle Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
                    {activeDetailMuscle.perspective.toUpperCase()} BIOMECHANICAL ZONE
                  </div>
                  <h4
                    style={{
                      fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                      fontSize: 22,
                      letterSpacing: '0.03em',
                      margin: 0,
                      color: '#FFFFFF',
                    }}
                  >
                    {activeDetailMuscle.displayName}
                  </h4>
                </div>

                <div
                  style={{
                    background: `${activeDetailMuscle.colorHex}22`,
                    border: `1px solid ${activeDetailMuscle.colorHex}`,
                    color: activeDetailMuscle.colorHex,
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {activeDetailMuscle.readinessRating}
                </div>
              </div>

              {/* Recovery Status Progress Bar */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: 'var(--gray)' }}>Supercompensation Velocity:</span>
                  <span style={{ fontWeight: 700, color: activeDetailMuscle.colorHex }}>
                    {activeDetailMuscle.recoveryPercentage}% Rebuilt
                  </span>
                </div>
                <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${activeDetailMuscle.recoveryPercentage}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${activeDetailMuscle.colorHex}99, ${activeDetailMuscle.colorHex})`,
                      boxShadow: `0 0 10px ${activeDetailMuscle.colorHex}`,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>

              {/* Timing & Fatigue Metrics Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: 12,
                  marginBottom: 18,
                }}
              >
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Time Remaining</div>
                  <div style={{ fontSize: 18, fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 700, color: activeDetailMuscle.colorHex, marginTop: 4 }}>
                    {activeDetailMuscle.hoursRemaining === 0 ? '0h (Fully Ready)' : `${activeDetailMuscle.hoursRemaining} Hours`}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hours Elapsed</div>
                  <div style={{ fontSize: 18, fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>
                    {activeDetailMuscle.hoursElapsed}h Post-Lift
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Target Supercomp</div>
                  <div style={{ fontSize: 18, fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 700, color: 'var(--gold-lt)', marginTop: 4 }}>
                    {activeDetailMuscle.adjustedTotalRecoveryHours}h Window
                  </div>
                </div>
              </div>

              {/* Physiological Status Banner */}
              <div
                style={{
                  background: 'rgba(212,160,23,0.08)',
                  borderLeft: `4px solid ${activeDetailMuscle.colorHex}`,
                  padding: '12px 14px',
                  borderRadius: 6,
                  fontSize: 13,
                  marginBottom: 16,
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: 'var(--gold-lt)' }}>Physiological State: </strong>
                <span>{activeDetailMuscle.statusTitle}</span>
              </div>

              {/* Real Logged Workout History Badge for this Muscle */}
              {muscleLoggedSession && (
                <div
                  style={{
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <GaaIcon name="barbell" size={12} tone="cyan" />
                      <span>Real Logged Workout Data</span>
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                      {muscleLoggedSession.hoursAgo}h ago
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                    {muscleLoggedSession.exerciseName}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>
                    {muscleLoggedSession.totalSets} {muscleLoggedSession.totalSets === 1 ? 'Set' : 'Sets'} recorded on {muscleLoggedSession.sessionDate} · Avg RPE {muscleLoggedSession.averageRpe}
                  </div>
                </div>
              )}

              {/* Prescribed NASM Restorative Protocol */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--gold-lt)',
                    fontWeight: 700,
                    marginBottom: 10,
                  }}
                >
                  Prescribed NASM Restorative Protocol
                </div>
                <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                  <div>
                    <strong style={{ color: '#FBBF24' }}>1. Inhibit (SMR / Release): </strong>
                    <span style={{ color: '#E2E8F0' }}>{activeDetailMuscle.restorativeProtocol.inhibitSmr}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#10B981' }}>2. Lengthen (Static Stretch): </strong>
                    <span style={{ color: '#E2E8F0' }}>{activeDetailMuscle.restorativeProtocol.lengthenStretch}</span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--gray)' }}>Prescribed Dose: </strong>
                    <span style={{ color: '#FFFFFF' }}>{activeDetailMuscle.restorativeProtocol.dosage}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Multi-Factor Recovery Simulator & Dynamic Time-Lapse ─────────────────────────── */}
          <div
            style={{
              background: 'rgba(10,16,28,0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14,
              padding: '22px',
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--gold-lt)',
                fontWeight: 700,
                marginBottom: 14,
              }}
            >
              Dynamic Telemetry & Time-Lapse Resolution
            </div>

            {/* Time-Lapse Hours Ahead Slider */}
            <div
              style={{
                background: 'rgba(212,160,23,0.06)',
                border: '1px solid rgba(212,160,23,0.25)',
                borderRadius: 8,
                padding: '12px 14px',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-lt)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <GaaIcon name="hourglass" size={12} tone="gold" />
                  <span>Time-Lapse Resolution:</span>
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: timeLapseHoursOffset === 0 ? '#10B981' : '#38BDF8' }}>
                  {timeLapseHoursOffset === 0 ? 'Live (Now)' : `+${timeLapseHoursOffset} Hours Forward`}
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={72}
                step={2}
                value={timeLapseHoursOffset}
                onChange={e => setTimeLapseHoursOffset(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--gold)' }}
              />

              {/* Quick Jump Buttons */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {[0, 12, 24, 36, 48, 72].map(offset => (
                  <button
                    key={offset}
                    type="button"
                    onClick={() => setTimeLapseHoursOffset(offset)}
                    style={{
                      padding: '3px 8px',
                      fontSize: 10.5,
                      fontWeight: 700,
                      borderRadius: 4,
                      cursor: 'pointer',
                      border: timeLapseHoursOffset === offset ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.15)',
                      background: timeLapseHoursOffset === offset ? 'rgba(212,160,23,0.25)' : 'rgba(255,255,255,0.04)',
                      color: timeLapseHoursOffset === offset ? 'var(--gold-lt)' : '#CBD5E1',
                    }}
                  >
                    {offset === 0 ? 'Now' : `+${offset}h`}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Client Telemetry Status (Data Source & Training Scenario Dropdown Removed) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }} />
                <span style={{ fontSize: 12, color: '#E2E8F0', fontWeight: 600 }}>
                  Live Client Telemetry Active
                </span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                {liveExtraction.totalSetsAnalyzed > 0
                  ? `${liveExtraction.totalSetsAnalyzed} Sets / ${liveExtraction.workoutCount} Workouts Ingested`
                  : 'Fully Supercompensated & Rested'}
              </span>
            </div>

            {/* Age & Conditioning Sliders (Auto-Chosen for Client) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--gray)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span>Chronological Age:</span>
                    <span
                      style={{
                        fontSize: 9.5,
                        background: 'rgba(212,160,23,0.18)',
                        color: 'var(--gold-lt)',
                        border: '1px solid rgba(212,160,23,0.35)',
                        padding: '1px 5px',
                        borderRadius: 3,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                      }}
                    >
                      Auto-Calibrated
                    </span>
                  </span>
                  <strong style={{ color: 'var(--gold-lt)' }}>{age} yrs</strong>
                </div>
                <input
                  type="range"
                  min={18}
                  max={75}
                  value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--gold)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--gray)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span>Conditioning Tier:</span>
                    <span
                      style={{
                        fontSize: 9.5,
                        background: 'rgba(212,160,23,0.18)',
                        color: 'var(--gold-lt)',
                        border: '1px solid rgba(212,160,23,0.35)',
                        padding: '1px 5px',
                        borderRadius: 3,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                      }}
                    >
                      Auto-Calibrated
                    </span>
                  </span>
                  <strong style={{ color: 'var(--gold-lt)', textTransform: 'capitalize' }}>{conditioning}</strong>
                </div>
                <select
                  value={conditioning}
                  onChange={e => setConditioning(e.target.value as ConditioningLevel)}
                  style={{
                    width: '100%',
                    background: '#070D18',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255,255,255,0.2)',
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  <option value="beginner">Beginner (+30% recovery time needed)</option>
                  <option value="intermediate">Intermediate (Baseline reference)</option>
                  <option value="advanced">Advanced (-15% accelerated clearance)</option>
                  <option value="elite">Advanced (-25% accelerated clearance)</option>
                </select>
              </div>
            </div>

            {/* Evidence-Based Supplement Stack Toggles */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 12,
                  marginBottom: 10,
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--gray)', fontWeight: 600 }}>Active Recovery Supplement Stack:</span>
                  <span
                    style={{
                      fontSize: 10,
                      background: 'rgba(212,160,23,0.15)',
                      color: 'var(--gold-lt)',
                      border: '1px solid rgba(212,160,23,0.3)',
                      padding: '1px 6px',
                      borderRadius: 4,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  >
                    Goal: {effectiveGoal.replace(/_/g, ' ')}
                  </span>
                </div>
                <span
                  style={{
                    background: 'rgba(16,185,129,0.15)',
                    border: '1px solid #10B981',
                    color: '#10B981',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 4,
                  }}
                >
                  +{telemetry.netRecoverySpeedBonusPercentage}% Faster Recovery
                </span>
              </div>

              {/* PAR-Q Pharmacological Shield Alert if Any Contraindications Detected */}
              {allSupplementsScreening.contraindicatedSupplements.length > 0 && (
                <div
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.35)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#F87171', fontSize: 11.5, fontWeight: 700 }}>
                    <GaaIcon name="shield" size={13} tone="ruby" />
                    <span>PAR-Q Pharmacological Safety Shield Active</span>
                  </div>
                  <div style={{ color: '#CBD5E1', fontSize: 11, marginTop: 4, lineHeight: 1.45 }}>
                    {allSupplementsScreening.contraindicatedSupplements.map(item => (
                      <div key={item.key} style={{ marginTop: 3 }}>
                        <span style={{ color: '#F87171', fontWeight: 700 }}>⛔ {item.supplementName}:</span>{' '}
                        Withheld due to reported {item.medicationCategory}. {item.reason} ({item.clinicalDirective})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chrono-Separation Timing Directives (e.g. Thyroid / Antibiotics) */}
              {allSupplementsScreening.chronoSeparationNotes.length > 0 && (
                <div
                  style={{
                    background: 'rgba(56,189,248,0.08)',
                    border: '1px solid rgba(56,189,248,0.3)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38BDF8', fontSize: 11, fontWeight: 700 }}>
                    <GaaIcon name="clock" size={12} tone="cyan" />
                    <span>Chrono-Separation Dosing Guidance</span>
                  </div>
                  <div style={{ color: '#E2E8F0', fontSize: 10.5, marginTop: 3, lineHeight: 1.4 }}>
                    {allSupplementsScreening.chronoSeparationNotes.map((note, i) => (
                      <div key={i}>{note.note}</div>
                    ))}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                  gap: 8,
                }}
              >
                {(Object.entries(SUPPLEMENT_RECOVERY_EFFECTS) as [RecoverySupplementKey, (typeof SUPPLEMENT_RECOVERY_EFFECTS)[RecoverySupplementKey]][]).map(
                  ([key, effect]) => {
                    const isContraindicated = allSupplementsScreening.contraindicatedSupplements.some(c => c.key === key)
                    const contraindicationItem = allSupplementsScreening.contraindicatedSupplements.find(c => c.key === key)
                    const isGoalMatch = goalRecommendedSupps.includes(key)
                    const isChecked = activeSupplements.includes(key) && !isContraindicated

                    return (
                      <label
                        key={key}
                        title={isContraindicated ? `Withheld: ${contraindicationItem?.reason}` : undefined}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          background: isContraindicated
                            ? 'rgba(239,68,68,0.04)'
                            : isChecked
                            ? 'rgba(212,160,23,0.12)'
                            : 'rgba(255,255,255,0.03)',
                          border: isContraindicated
                            ? '1px dashed rgba(239,68,68,0.45)'
                            : isChecked
                            ? '1px solid rgba(212,160,23,0.5)'
                            : '1px solid rgba(255,255,255,0.08)',
                          padding: '8px 10px',
                          borderRadius: 6,
                          fontSize: 11,
                          cursor: isContraindicated ? 'not-allowed' : 'pointer',
                          opacity: isContraindicated ? 0.6 : 1,
                          transition: 'all 0.15s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isContraindicated}
                          onChange={() => toggleSupplement(key)}
                          style={{ accentColor: 'var(--gold)' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                            <div style={{ color: isContraindicated ? '#F87171' : isChecked ? 'var(--gold-lt)' : '#FFFFFF', fontWeight: 600 }}>
                              {effect.name}
                            </div>
                            {isGoalMatch && !isContraindicated && (
                              <span style={{ fontSize: 8.5, background: 'rgba(212,160,23,0.2)', color: 'var(--gold-lt)', border: '1px solid rgba(212,160,23,0.4)', padding: '0 4px', borderRadius: 2, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                Goal Fit
                              </span>
                            )}
                            {isContraindicated && (
                              <span style={{ fontSize: 8.5, background: 'rgba(239,68,68,0.2)', color: '#F87171', border: '1px solid rgba(239,68,68,0.4)', padding: '0 4px', borderRadius: 2, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                Shielded
                              </span>
                            )}
                          </div>
                          <div style={{ color: isContraindicated ? '#FCA5A5' : 'var(--gray)', fontSize: 10 }}>
                            {isContraindicated ? 'Withheld (PAR-Q safety shield)' : `-${effect.reductionPercentage}% recovery time`}
                          </div>
                        </div>
                      </label>
                    )
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
