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
  chest: { anterior: [[216, 182], [296, 182]] },
  deltoids_anterior: { anterior: [[171, 172], [341, 172]] },
  deltoids_lateral: { anterior: [[161, 176], [351, 176]], posterior: [[161, 176], [351, 176]] },
  deltoids_posterior: { posterior: [[171, 172], [341, 172]] },
  biceps: { anterior: [[150, 238], [362, 238]] },
  triceps: { posterior: [[147, 238], [365, 238]] },
  forearms: { anterior: [[122, 317], [390, 317]] },
  abdominals: { anterior: [[256, 277]] },
  obliques: { anterior: [[212, 277], [300, 277]] },
  trapezius: { posterior: [[256, 167]] },
  rhomboids: { posterior: [[236, 197], [276, 197]] },
  latissimus_dorsi: { posterior: [[210, 247], [302, 247]] },
  erector_spinae: { posterior: [[256, 287]] },
  gluteals: { posterior: [[218, 382], [294, 382]] },
  quadriceps: { anterior: [[210, 437], [302, 437]] },
  hamstrings: { posterior: [[210, 477], [302, 477]] },
  calves_gastrocnemius: { posterior: [[208, 602], [304, 602]] },
  tibialis_anterior: { anterior: [[208, 617], [304, 617]] },
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
                        ? 'M254 148 L190 150 C174 158 172 182 176 202 C186 220 220 224 254 218 Z'
                        : 'M254 142 L184 144 C166 152 164 181 168 200 C178 218 216 222 254 216 Z'
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
                        ? 'M258 148 L322 150 C338 158 340 182 336 202 C326 220 292 224 258 218 Z'
                        : 'M258 142 L328 144 C346 152 348 181 344 200 C334 218 296 222 258 216 Z'
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
                        ? 'M195 144 C171 146 159 162 157 184 C155 204 165 214 179 214 C185 196 189 170 195 144 Z'
                        : 'M191 140 C167 142 153 158 151 181 C149 201 159 212 173 212 C181 194 185 166 191 140 Z'
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
                        ? 'M317 144 C341 146 353 162 355 184 C357 204 347 214 333 214 C327 196 323 170 317 144 Z'
                        : 'M321 140 C345 142 359 158 361 181 C363 201 353 212 339 212 C331 194 327 166 321 140 Z'
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
                        ? 'M184 198 L154 202 C142 224 130 252 124 278 C138 282 154 282 162 276 C174 254 180 224 184 198 Z'
                        : 'M182 198 L150 202 C136 224 122 252 114 278 C130 282 148 282 158 276 C170 254 178 224 182 198 Z'
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
                        ? 'M328 198 L358 202 C370 224 382 252 388 278 C374 282 358 282 350 276 C338 254 332 224 328 198 Z'
                        : 'M330 198 L362 202 C376 224 390 252 398 278 C382 282 364 282 354 276 C342 254 334 224 330 198 Z'
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
                        ? 'M162 282 L126 284 C112 308 100 328 94 346 L116 346 C132 328 148 308 162 282 Z'
                        : 'M156 282 L112 284 C96 308 84 328 80 343 L104 343 C120 328 138 308 156 282 Z'
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
                        ? 'M350 282 L386 284 C400 308 412 328 418 346 L396 346 C380 328 364 308 350 282 Z'
                        : 'M356 282 L400 284 C416 308 428 328 432 343 L408 343 C392 328 374 308 356 282 Z'
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
                        ? 'M236 220 L276 220 C278 254 277 296 274 337 C266 346 246 346 238 337 C235 296 234 254 236 220 Z'
                        : 'M235 218 L277 218 C280 252 279 294 275 337 C266 346 246 346 237 337 C233 294 232 252 235 218 Z'
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
                        ? 'M236 222 C216 228 200 250 198 288 C196 316 206 337 236 337 C234 304 234 264 236 222 Z'
                        : 'M234 220 C212 226 194 248 192 286 C190 314 200 337 234 337 C232 304 232 262 234 220 Z'
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
                        ? 'M276 222 C296 228 312 250 314 288 C316 316 306 337 276 337 C278 304 278 264 276 222 Z'
                        : 'M278 220 C300 226 318 248 320 286 C322 314 312 337 278 337 C280 304 280 262 278 220 Z'
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
                        ? 'M210 360 C188 374 178 407 180 447 C182 484 194 514 208 516 C224 514 240 484 240 427 C240 387 230 364 210 360 Z'
                        : 'M210 360 C190 372 178 407 180 444 C182 482 194 514 208 516 C224 514 240 482 240 427 C240 387 230 364 210 360 Z'
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
                        ? 'M302 360 C324 374 334 407 332 447 C330 484 318 514 304 516 C288 514 272 484 272 427 C272 387 282 364 302 360 Z'
                        : 'M302 360 C322 372 334 407 332 444 C330 482 318 514 304 516 C288 514 272 482 272 427 C272 387 282 364 302 360 Z'
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
                        ? 'M208 560 C196 578 190 613 194 658 C196 678 204 686 212 686 C220 686 224 658 224 613 C224 578 218 563 208 560 Z'
                        : 'M208 560 C196 577 190 610 194 650 C196 668 204 674 212 674 C220 674 224 650 224 610 C224 577 218 563 208 560 Z'
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
                        ? 'M304 560 C316 578 322 613 318 658 C316 678 308 686 300 686 C292 686 288 658 288 613 C288 578 294 563 304 560 Z'
                        : 'M304 560 C316 577 322 610 318 650 C316 668 308 674 300 674 C292 674 288 650 288 610 C288 577 294 563 304 560 Z'
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
                        ? 'M236 102 L256 110 L276 102 L330 134 C314 164 290 202 256 240 C222 202 198 164 182 134 Z'
                        : 'M232 102 L256 110 L280 102 L335 134 C318 164 292 202 256 240 C220 202 194 164 177 134 Z'
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
                        ? 'M189 130 C169 140 157 158 155 182 C153 202 163 212 177 210 C183 191 187 161 189 130 Z'
                        : 'M184 128 C165 138 151 156 149 181 C147 201 157 212 171 210 C179 191 181 161 184 128 Z'
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
                        ? 'M323 130 C343 140 355 158 357 182 C359 202 349 212 335 210 C329 191 325 161 323 130 Z'
                        : 'M328 128 C347 138 361 156 363 181 C365 201 355 212 341 210 C333 191 331 161 328 128 Z'
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
                        ? 'M184 194 L146 194 C134 224 118 254 110 280 C124 284 142 284 152 278 C164 254 176 224 184 194 Z'
                        : 'M186 194 L144 194 C130 224 110 254 102 280 C118 284 137 284 147 278 C160 254 174 224 186 194 Z'
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
                        ? 'M328 194 L366 194 C378 224 394 254 402 280 C388 284 370 284 360 278 C348 254 336 224 328 194 Z'
                        : 'M326 194 L368 194 C382 224 402 254 410 280 C394 284 375 284 365 278 C352 254 338 224 326 194 Z'
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
                        ? 'M188 167 C180 199 186 249 194 303 C206 327 224 333 236 329 C238 279 236 229 242 205 C216 181 198 171 188 167 Z'
                        : 'M185 167 C176 200 184 248 193 300 C205 324 224 330 236 326 C238 276 236 228 242 204 C215 180 195 171 185 167 Z'
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
                        ? 'M324 167 C332 199 326 249 318 303 C306 327 288 333 276 329 C274 279 276 229 270 205 C296 181 314 171 324 167 Z'
                        : 'M327 167 C336 200 328 248 319 300 C307 324 288 330 276 326 C274 276 276 228 270 204 C297 180 317 171 327 167 Z'
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
                    d="M246 234 L266 234 L264 340 L248 340 Z"
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
                        ? 'M206 340 C182 357 178 387 184 417 C192 432 218 436 248 422 C250 387 250 357 246 344 C230 338 216 337 206 340 Z'
                        : 'M208 340 C185 357 180 387 186 416 C194 430 220 434 250 420 C252 387 252 357 248 344 C232 338 218 337 208 340 Z'
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
                        ? 'M306 340 C330 357 334 387 328 417 C320 432 294 436 264 422 C262 387 262 357 266 344 C282 338 296 337 306 340 Z'
                        : 'M304 340 C327 357 332 387 326 416 C318 430 292 434 262 420 C260 387 260 357 264 344 C280 338 294 337 304 340 Z'
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
                        ? 'M208 424 C186 439 176 474 180 519 C184 539 196 548 208 548 C224 546 236 524 238 474 C240 444 228 429 208 424 Z'
                        : 'M210 424 C188 439 178 472 182 514 C186 534 198 542 210 542 C226 540 238 520 240 472 C242 444 230 429 210 424 Z'
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
                        ? 'M304 424 C326 439 336 474 332 519 C328 539 316 548 304 548 C288 546 276 524 274 474 C272 444 284 429 304 424 Z'
                        : 'M302 424 C324 439 334 472 330 514 C326 534 314 542 302 542 C286 540 274 520 272 472 C270 444 282 429 302 424 Z'
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
                        ? 'M208 548 C188 568 182 598 186 633 C190 663 200 678 208 678 C218 678 228 648 228 603 C228 568 220 553 208 548 Z'
                        : 'M208 548 C188 568 182 598 186 632 C190 660 200 674 208 674 C218 674 228 647 228 604 C228 570 220 554 208 548 Z'
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
                        ? 'M304 548 C324 568 330 598 326 633 C322 663 312 678 304 678 C294 678 284 648 284 603 C284 568 292 553 304 548 Z'
                        : 'M304 548 C324 568 330 598 326 632 C322 660 312 674 304 674 C294 674 284 647 284 604 C284 570 292 554 304 548 Z'
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
