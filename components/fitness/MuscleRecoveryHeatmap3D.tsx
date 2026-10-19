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

export const MUSCLE_TARGET_COORDINATES: Record<MuscleZoneId, { anterior?: [number, number][]; posterior?: [number, number][] }> = {
  chest: { anterior: [[216, 190], [296, 190]] },
  deltoids_anterior: { anterior: [[164, 180], [348, 180]] },
  deltoids_lateral: { anterior: [[154, 184], [358, 184]], posterior: [[154, 184], [358, 184]] },
  deltoids_posterior: { posterior: [[164, 180], [348, 180]] },
  biceps: { anterior: [[138, 246], [374, 246]] },
  triceps: { posterior: [[135, 246], [377, 246]] },
  forearms: { anterior: [[110, 325], [402, 325]] },
  abdominals: { anterior: [[256, 285]] },
  obliques: { anterior: [[212, 285], [300, 285]] },
  trapezius: { posterior: [[256, 175]] },
  rhomboids: { posterior: [[236, 205], [276, 205]] },
  latissimus_dorsi: { posterior: [[210, 255], [302, 255]] },
  erector_spinae: { posterior: [[256, 295]] },
  gluteals: { posterior: [[218, 390], [294, 390]] },
  quadriceps: { anterior: [[210, 445], [302, 445]] },
  hamstrings: { posterior: [[210, 485], [302, 485]] },
  calves_gastrocnemius: { posterior: [[208, 610], [304, 610]] },
  tibialis_anterior: { anterior: [[208, 625], [304, 625]] },
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
    return null
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
              flexWrap: 'wrap',
            }}
          >
            Muscle recovery map
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
              Model estimate
            </span>
          </h3>
          <p style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 0 }}>
            Estimated from logged workouts, not measured muscle recovery.
          </p>
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
              {liveExtraction.totalSetsAnalyzed > 0 ? `${telemetry.overallBodyReadinessScore}%` : 'No data'}
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
              aria-pressed={perspective === 'anterior'}
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
              aria-pressed={perspective === 'posterior'}
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
                {daysSinceLastWorkout ?? '--'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', maxWidth: 100, marginTop: 4 }}>
                Days Since Last Lift
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 30, fontWeight: 700, lineHeight: 1, color: '#10B981' }}>
                {liveExtraction.totalSetsAnalyzed > 0 ? freshCount : '--'}
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
                        ? 'M254 156 L190 158 C174 166 172 190 176 210 C186 228 220 232 254 226 Z'
                        : 'M254 150 L184 152 C166 160 164 189 168 208 C178 226 216 230 254 224 Z'
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
                        ? 'M258 156 L322 158 C338 166 340 190 336 210 C326 228 292 232 258 226 Z'
                        : 'M258 150 L328 152 C346 160 348 189 344 208 C334 226 296 230 258 224 Z'
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
                        ? 'M188 152 C164 154 152 170 150 192 C148 212 158 222 172 222 C178 204 182 178 188 152 Z'
                        : 'M184 148 C160 150 146 166 144 189 C142 209 152 220 166 220 C174 202 178 174 184 148 Z'
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
                        ? 'M324 152 C348 154 360 170 362 192 C364 212 354 222 340 222 C334 204 330 178 324 152 Z'
                        : 'M328 148 C352 150 366 166 368 189 C370 209 360 220 346 220 C338 202 334 174 328 148 Z'
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
                        ? 'M172 206 L142 210 C130 232 118 260 112 286 C126 290 142 290 150 284 C162 262 168 232 172 206 Z'
                        : 'M170 206 L138 210 C124 232 110 260 102 286 C118 290 136 290 146 284 C158 262 166 232 170 206 Z'
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
                        ? 'M340 206 L370 210 C382 232 394 260 400 286 C386 290 370 290 362 284 C350 262 344 232 340 206 Z'
                        : 'M342 206 L374 210 C388 232 402 260 410 286 C394 290 376 290 366 284 C354 262 346 232 342 206 Z'
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
                        ? 'M150 290 L114 292 C100 316 88 336 82 354 L104 354 C120 336 136 316 150 290 Z'
                        : 'M144 290 L100 292 C84 316 72 336 68 351 L92 351 C108 336 126 316 144 290 Z'
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
                        ? 'M362 290 L398 292 C412 316 424 336 430 354 L408 354 C392 336 376 316 362 290 Z'
                        : 'M368 290 L412 292 C428 316 440 336 444 351 L420 351 C404 336 386 316 368 290 Z'
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
                        ? 'M236 228 L276 228 C278 262 277 304 274 345 C266 354 246 354 238 345 C235 304 234 262 236 228 Z'
                        : 'M235 226 L277 226 C280 260 279 302 275 345 C266 354 246 354 237 345 C233 302 232 260 235 226 Z'
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
                        ? 'M236 230 C216 236 200 258 198 296 C196 324 206 345 236 345 C234 312 234 272 236 230 Z'
                        : 'M234 228 C212 234 194 256 192 294 C190 322 200 345 234 345 C232 312 232 270 234 228 Z'
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
                        ? 'M276 230 C296 236 312 258 314 296 C316 324 306 345 276 345 C278 312 278 272 276 230 Z'
                        : 'M278 228 C300 234 318 256 320 294 C322 322 312 345 278 345 C280 312 280 270 278 228 Z'
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
                        ? 'M210 368 C188 382 178 415 180 455 C182 492 194 522 208 524 C224 522 240 492 240 435 C240 395 230 372 210 368 Z'
                        : 'M210 368 C190 380 178 415 180 452 C182 490 194 522 208 524 C224 522 240 490 240 435 C240 395 230 372 210 368 Z'
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
                        ? 'M302 368 C324 382 334 415 332 455 C330 492 318 522 304 524 C288 522 272 492 272 435 C272 395 282 372 302 368 Z'
                        : 'M302 368 C322 380 334 415 332 452 C330 490 318 522 304 524 C288 522 272 490 272 435 C272 395 282 372 302 368 Z'
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
                        ? 'M208 568 C196 586 190 621 194 666 C196 686 204 694 212 694 C220 694 224 666 224 621 C224 586 218 571 208 568 Z'
                        : 'M208 568 C196 585 190 618 194 658 C196 676 204 682 212 682 C220 682 224 658 224 618 C224 585 218 571 208 568 Z'
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
                        ? 'M304 568 C316 586 322 621 318 666 C316 686 308 694 300 694 C292 694 288 666 288 621 C288 586 294 571 304 568 Z'
                        : 'M304 568 C316 585 322 618 318 658 C316 676 308 682 300 682 C292 682 288 658 288 618 C288 585 294 571 304 568 Z'
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
                        ? 'M236 110 L256 118 L276 110 L330 142 C314 172 290 210 256 248 C222 210 198 172 182 142 Z'
                        : 'M232 110 L256 118 L280 110 L335 142 C318 172 292 210 256 248 C220 210 194 172 177 142 Z'
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
                        ? 'M182 138 C162 148 150 166 148 190 C146 210 156 220 170 218 C176 199 180 169 182 138 Z'
                        : 'M177 136 C158 146 144 164 142 189 C140 209 150 220 164 218 C172 199 174 169 177 136 Z'
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
                        ? 'M330 138 C350 148 362 166 364 190 C366 210 356 220 342 218 C336 199 332 169 330 138 Z'
                        : 'M335 136 C354 146 368 164 370 189 C372 209 362 220 348 218 C340 199 338 169 335 136 Z'
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
                        ? 'M172 202 L134 202 C122 232 106 262 98 288 C112 292 130 292 140 286 C152 262 164 232 172 202 Z'
                        : 'M174 202 L132 202 C118 232 98 262 90 288 C106 292 125 292 135 286 C148 262 162 232 174 202 Z'
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
                        ? 'M340 202 L378 202 C390 232 406 262 414 288 C400 292 382 292 372 286 C360 262 348 232 340 202 Z'
                        : 'M338 202 L380 202 C394 232 414 262 422 288 C406 292 387 292 377 286 C364 262 350 232 338 202 Z'
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
                        ? 'M188 175 C180 207 186 257 194 311 C206 335 224 341 236 337 C238 287 236 237 242 213 C216 189 198 179 188 175 Z'
                        : 'M185 175 C176 208 184 256 193 308 C205 332 224 338 236 334 C238 284 236 236 242 212 C215 188 195 179 185 175 Z'
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
                        ? 'M324 175 C332 207 326 257 318 311 C306 335 288 341 276 337 C274 287 276 237 270 213 C296 189 314 179 324 175 Z'
                        : 'M327 175 C336 208 328 256 319 308 C307 332 288 338 276 334 C274 284 276 236 270 212 C297 188 317 179 327 175 Z'
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
                    d="M246 242 L266 242 L264 348 L248 348 Z"
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
                        ? 'M206 348 C182 365 178 395 184 425 C192 440 218 444 248 430 C250 395 250 365 246 352 C230 346 216 345 206 348 Z'
                        : 'M208 348 C185 365 180 395 186 424 C194 438 220 442 250 428 C252 395 252 365 248 352 C232 346 218 345 208 348 Z'
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
                        ? 'M306 348 C330 365 334 395 328 425 C320 440 294 444 264 430 C262 395 262 365 266 352 C282 346 296 345 306 348 Z'
                        : 'M304 348 C327 365 332 395 326 424 C318 438 292 442 262 428 C260 395 260 365 264 352 C280 346 294 345 304 348 Z'
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
                        ? 'M208 432 C186 447 176 482 180 527 C184 547 196 556 208 556 C224 554 236 532 238 482 C240 452 228 437 208 432 Z'
                        : 'M210 432 C188 447 178 480 182 522 C186 542 198 550 210 550 C226 548 238 528 240 480 C242 452 230 437 210 432 Z'
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
                        ? 'M304 432 C326 447 336 482 332 527 C328 547 316 556 304 556 C288 554 276 532 274 482 C272 452 284 437 304 432 Z'
                        : 'M302 432 C324 447 334 480 330 522 C326 542 314 550 302 550 C286 548 274 528 272 480 C270 452 282 437 302 432 Z'
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
                        ? 'M208 556 C188 576 182 606 186 641 C190 671 200 686 208 686 C218 686 228 656 228 611 C228 576 220 561 208 556 Z'
                        : 'M208 556 C188 576 182 606 186 640 C190 668 200 682 208 682 C218 682 228 655 228 612 C228 578 220 562 208 556 Z'
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
                        ? 'M304 556 C324 576 330 606 326 641 C322 671 312 686 304 686 C294 686 284 656 284 611 C284 576 292 561 304 556 Z'
                        : 'M304 556 C324 576 330 606 326 640 C322 668 312 682 304 682 C294 682 284 655 284 612 C284 578 292 562 304 556 Z'
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
          <details
            className="fitness-card-disclosure"
            style={{
              background: 'rgba(10,16,28,0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14,
              padding: '22px',
            }}
          >
            <summary>Recovery simulation &amp; advanced inputs</summary>
            <p style={{ color: 'var(--gray)', fontSize: 12 }}>Model estimates, not measured recovery. Adjustments are exploratory and are not saved.</p>
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
                aria-label="Recovery simulation hours ahead"
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
                    aria-pressed={timeLapseHoursOffset === offset}
                    onClick={() => setTimeLapseHoursOffset(offset)}
                    style={{
                      padding: '3px 8px',
                      minWidth: 44,
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
                  Logged workout inputs
                </span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                {liveExtraction.totalSetsAnalyzed > 0
                  ? `${liveExtraction.totalSetsAnalyzed} Sets / ${liveExtraction.workoutCount} Workouts Ingested`
                  : 'No logged training data'}
              </span>
            </div>

            {/* Age & Conditioning Sliders (Auto-Chosen for Client) */}
            <div className="fitness-lab-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, marginBottom: 16 }}>
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
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))',
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
          </details>
        </div>
      </div>
    </div>
  )
}
