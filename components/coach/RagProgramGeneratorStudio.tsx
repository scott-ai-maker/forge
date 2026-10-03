'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  generateRagNasmProgram,
  GeneratedMacrocyclePlan,
  NASM_OPT_PHASE_STANDARDS,
  parseEquipmentCapabilities,
} from '@/lib/rag-nasm-program-generator'
import { resolveExerciseVideoEmbed, extractYouTubeVideoId } from '@/lib/nasm-exercise-video-catalog'
import { resolveGaaExerciseImage, BRAND_LOGO_FALLBACK_IMAGE } from '@/lib/nasm-generated-images'
import { detectExerciseEquipment } from '@/lib/nasm-equipment-detector'
import { GaaIcon } from '@/components/ui/GaaIcon'
import { selectOnFocus, sanitizeNumericInput, parseNumericInput } from '@/lib/form-input-helpers'
import { parseInjuriesFromText } from '@/lib/sports-injuries'

interface Props {
  clientId?: string
  clientName?: string
  initialGoal?: 'fat_loss' | 'hypertrophy' | 'performance' | 'general_fitness'
  initialPhase?: number
  initialEquipmentAccess?: string[]
  initialSessionsPerWeek?: number | null
  initialCompensations?: string[]
  existingPlan?: {
    id?: string | null
    name?: string | null
    nasm_opt_phase?: number | null
    phase_name?: string | null
    sessions_per_week?: number | null
  } | null
  contraindicationTags?: string[]
  contraindicationNotes?: string[]
  injuriesLimitations?: string | null
  onPlanAssigned?: (plan: GeneratedMacrocyclePlan) => void
}

const EQUIPMENT_PRESETS: Record<string, { label: string; equipment: string[] }> = {
  commercial_gym: {
    label: 'Commercial Gym (Full Barbells, Squat Racks, Cables & Machines)',
    equipment: ['barbell', 'squat rack', 'dumbbell', 'cable', 'machines', 'bench', 'pull-up bar', 'stability ball', 'medicine ball', 'bodyweight'],
  },
  home_barbell: {
    label: 'Home Gym with Barbell & Rack (Barbell, Plates, Rack, Dumbbells & Bench)',
    equipment: ['barbell', 'squat rack', 'dumbbell', 'bench', 'pull-up bar', 'band', 'bodyweight'],
  },
  home_dumbbells: {
    label: 'Home Gym (Dumbbells, Adjustable Bench & Resistance Bands)',
    equipment: ['dumbbell', 'band', 'bench', 'stability ball', 'bodyweight'],
  },
  home_minimal: {
    label: 'Minimalist Home / Travel (Resistance Bands & Bodyweight)',
    equipment: ['band', 'bodyweight', 'stability ball'],
  },
  bodyweight_only: {
    label: 'Bodyweight / Calisthenics Only (No Weights)',
    equipment: ['bodyweight', 'pull-up bar'],
  },
  custom: {
    label: 'Custom Equipment Profile',
    equipment: [],
  },
}

export default function RagProgramGeneratorStudio({
  clientId,
  clientName = 'Client',
  initialGoal = 'hypertrophy',
  initialPhase = 3,
  initialEquipmentAccess,
  initialSessionsPerWeek,
  initialCompensations = [],
  existingPlan = null,
  contraindicationTags = [],
  contraindicationNotes = [],
  injuriesLimitations = null,
  onPlanAssigned,
}: Props) {
  const [goal, setGoal] = useState<'fat_loss' | 'hypertrophy' | 'performance' | 'general_fitness'>(initialGoal)
  const [phase, setPhase] = useState<number>(initialPhase)
  const [overwriteExisting, setOverwriteExisting] = useState<boolean>(Boolean(existingPlan))
  const [daysPerWeek, setDaysPerWeek] = useState<number>(() => {
    if (initialSessionsPerWeek && initialSessionsPerWeek >= 2 && initialSessionsPerWeek <= 6) {
      return initialSessionsPerWeek
    }
    if (existingPlan?.sessions_per_week && existingPlan.sessions_per_week >= 2 && existingPlan.sessions_per_week <= 6) {
      return existingPlan.sessions_per_week
    }
    return 4
  })
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced' | 'elite'>('advanced')
  const [cardioBlendStyle, setCardioBlendStyle] = useState<'integrated_finishers' | 'dedicated_conditioning' | 'minimal_flush' | 'none'>('integrated_finishers')
  const [clientAge, setClientAge] = useState<string>('35')

  // Resolve all contraindication tags and sports injury limitations
  const detectedInjuries = useMemo(() => parseInjuriesFromText(injuriesLimitations), [injuriesLimitations])
  const effectiveContraindicationTags = useMemo(
    () => Array.from(new Set([...contraindicationTags, ...detectedInjuries.selectedInjuryIds])),
    [contraindicationTags, detectedInjuries]
  )

  // Equipment selection
  const [equipmentPreset, setEquipmentPreset] = useState<string>(() => {
    if (!initialEquipmentAccess || initialEquipmentAccess.length === 0) return 'commercial_gym'
    const listStr = initialEquipmentAccess.join(' ').toLowerCase()
    if (!listStr.includes('barbell') && !listStr.includes('cable') && (listStr.includes('dumbbell') || listStr.includes('free weight'))) {
      return 'home_dumbbells'
    }
    if (!listStr.includes('barbell') && !listStr.includes('dumbbell') && listStr.includes('band')) {
      return 'home_minimal'
    }
    if (!listStr.includes('barbell') && !listStr.includes('dumbbell') && !listStr.includes('band')) {
      return 'bodyweight_only'
    }
    return 'commercial_gym'
  })

  const [equipment, setEquipment] = useState<string[]>(() => {
    if (initialEquipmentAccess && initialEquipmentAccess.length > 0) {
      return initialEquipmentAccess
    }
    return ['barbell', 'squat rack', 'dumbbell', 'cable', 'machines', 'bench', 'pull-up bar', 'stability ball', 'medicine ball', 'bodyweight']
  })

  // 1RM Benchmarks
  const [bench1RM, setBench1RM] = useState<string>('225')
  const [squat1RM, setSquat1RM] = useState<string>('315')
  const [deadlift1RM, setDeadlift1RM] = useState<string>('385')

  // Kinetic Compensations from Movement Screen
  const [kneesCaveIn, setKneesCaveIn] = useState<boolean>(() =>
    initialCompensations.some(c => c.toLowerCase().includes('knees_cave_in') || c.toLowerCase().includes('valgus'))
  )
  const [forwardLean, setForwardLean] = useState<boolean>(() =>
    initialCompensations.some(c => c.toLowerCase().includes('forward_lean'))
  )
  const [armsFallForward, setArmsFallForward] = useState<boolean>(() =>
    initialCompensations.some(c => c.toLowerCase().includes('arms_fall_forward'))
  )

  // Generated Plan State
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedMacrocyclePlan>(() => {
    const compensations: string[] = []
    if (initialCompensations.some(c => c.toLowerCase().includes('knees_cave_in') || c.toLowerCase().includes('valgus'))) {
      compensations.push('knees_cave_in')
    }
    if (initialCompensations.some(c => c.toLowerCase().includes('forward_lean'))) {
      compensations.push('excessive_forward_lean')
    }
    if (initialCompensations.some(c => c.toLowerCase().includes('arms_fall_forward'))) {
      compensations.push('arms_fall_forward')
    }

    const eqList = initialEquipmentAccess && initialEquipmentAccess.length > 0
      ? initialEquipmentAccess
      : ['barbell', 'squat rack', 'dumbbell', 'cable', 'machines', 'bench', 'pull-up bar', 'stability ball', 'medicine ball', 'bodyweight']

    const initialDays = (initialSessionsPerWeek && initialSessionsPerWeek >= 2 && initialSessionsPerWeek <= 6)
      ? initialSessionsPerWeek
      : (existingPlan?.sessions_per_week && existingPlan.sessions_per_week >= 2 && existingPlan.sessions_per_week <= 6
          ? existingPlan.sessions_per_week
          : 4)

    return generateRagNasmProgram({
      clientName,
      clientAge: 35,
      goal: initialGoal,
      targetNasmPhase: initialPhase,
      trainingDaysPerWeek: initialDays,
      experienceLevel: 'advanced',
      equipmentAccess: eqList,
      cardioBlendStyle: 'integrated_finishers',
      knownBenchmarks: {
        'Bench Press': { weightLbs: 225, reps: 1 },
        'Squat': { weightLbs: 315, reps: 1 },
        'Deadlift': { weightLbs: 385, reps: 1 },
      },
      kineticCompensations: compensations,
      contraindicationTags: effectiveContraindicationTags,
      injuriesLimitations: injuriesLimitations || undefined,
    })
  })

  // Sync state and regenerate plan when initialPhase or initialGoal prop changes from parent
  useEffect(() => {
    if (initialPhase && initialPhase !== phase) {
      setPhase(initialPhase)
      const compensations: string[] = []
      if (kneesCaveIn) compensations.push('knees_cave_in')
      if (forwardLean) compensations.push('excessive_forward_lean')
      if (armsFallForward) compensations.push('arms_fall_forward')

      const updated = generateRagNasmProgram({
        clientName,
        clientAge: parseNumericInput(clientAge, 35),
        goal,
        targetNasmPhase: initialPhase,
        trainingDaysPerWeek: daysPerWeek,
        experienceLevel: experience,
        equipmentAccess: equipment,
        cardioBlendStyle,
        knownBenchmarks: {
          'Bench Press': { weightLbs: parseNumericInput(bench1RM, 225), reps: 1 },
          'Squat': { weightLbs: parseNumericInput(squat1RM, 315), reps: 1 },
          'Deadlift': { weightLbs: parseNumericInput(deadlift1RM, 385), reps: 1 },
        },
        kineticCompensations: compensations,
        contraindicationTags: effectiveContraindicationTags,
        injuriesLimitations: injuriesLimitations || undefined,
      })
      setGeneratedPlan(updated)
      setActiveDayTab(1)
    }
  }, [
    initialPhase,
    phase,
    kneesCaveIn,
    forwardLean,
    armsFallForward,
    clientName,
    clientAge,
    goal,
    daysPerWeek,
    experience,
    equipment,
    cardioBlendStyle,
    bench1RM,
    squat1RM,
    deadlift1RM,
    effectiveContraindicationTags,
    injuriesLimitations,
  ])

  useEffect(() => {
    if (initialGoal && initialGoal !== goal) {
      setGoal(initialGoal)
      const compensations: string[] = []
      if (kneesCaveIn) compensations.push('knees_cave_in')
      if (forwardLean) compensations.push('excessive_forward_lean')
      if (armsFallForward) compensations.push('arms_fall_forward')

      const updated = generateRagNasmProgram({
        clientName,
        clientAge: parseNumericInput(clientAge, 35),
        goal: initialGoal,
        targetNasmPhase: phase,
        trainingDaysPerWeek: daysPerWeek,
        experienceLevel: experience,
        equipmentAccess: equipment,
        cardioBlendStyle,
        knownBenchmarks: {
          'Bench Press': { weightLbs: parseNumericInput(bench1RM, 225), reps: 1 },
          'Squat': { weightLbs: parseNumericInput(squat1RM, 315), reps: 1 },
          'Deadlift': { weightLbs: parseNumericInput(deadlift1RM, 385), reps: 1 },
        },
        kineticCompensations: compensations,
        contraindicationTags: effectiveContraindicationTags,
        injuriesLimitations: injuriesLimitations || undefined,
      })
      setGeneratedPlan(updated)
      setActiveDayTab(1)
    }
  }, [
    initialGoal,
    goal,
    kneesCaveIn,
    forwardLean,
    armsFallForward,
    clientName,
    clientAge,
    phase,
    daysPerWeek,
    experience,
    equipment,
    cardioBlendStyle,
    bench1RM,
    squat1RM,
    deadlift1RM,
    effectiveContraindicationTags,
    injuriesLimitations,
  ])

  // Active Selected Day in Tab
  const [activeDayTab, setActiveDayTab] = useState<number>(1)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [applyStatus, setApplyStatus] = useState<string | null>(null)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [activeVideoModal, setActiveVideoModal] = useState<{ title: string; embedUrl: string; externalUrl: string } | null>(null)

  const handlePresetChange = (presetKey: string) => {
    setEquipmentPreset(presetKey)
    if (presetKey !== 'custom' && EQUIPMENT_PRESETS[presetKey]) {
      setEquipment(EQUIPMENT_PRESETS[presetKey].equipment)
    }
  }

  const handleToggleEquipmentModality = (modality: string) => {
    setEquipmentPreset('custom')
    setEquipment(prev => {
      const exists = prev.some(item => item.toLowerCase() === modality.toLowerCase())
      if (exists) {
        return prev.filter(item => item.toLowerCase() !== modality.toLowerCase())
      } else {
        return [...prev, modality]
      }
    })
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setApplyStatus(null)
    setApplyError(null)

    const compensations: string[] = []
    if (kneesCaveIn) compensations.push('knees_cave_in')
    if (forwardLean) compensations.push('excessive_forward_lean')
    if (armsFallForward) compensations.push('arms_fall_forward')

    try {
      const res = await fetch('/api/coach/ai-architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientAge: parseNumericInput(clientAge, 35),
          goal,
          targetNasmPhase: phase,
          trainingDaysPerWeek: daysPerWeek,
          experienceLevel: experience,
          equipmentAccess: equipment,
          cardioBlendStyle,
          knownBenchmarks: {
            'Bench Press': { weightLbs: parseNumericInput(bench1RM, 225), reps: 1 },
            'Squat': { weightLbs: parseNumericInput(squat1RM, 315), reps: 1 },
            'Deadlift': { weightLbs: parseNumericInput(deadlift1RM, 385), reps: 1 },
          },
          kineticCompensations: compensations,
          contraindicationTags: effectiveContraindicationTags,
          injuriesLimitations: injuriesLimitations || undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (res.ok && data.plan) {
        setGeneratedPlan(data.plan)
        setActiveDayTab(1)
        setApplyStatus(`✓ Coach Gordon (Master NASM Head Coach) designed a custom OPT Phase ${data.plan.nasmOptPhase} macrocycle with 100% official CDN videos.`)
        setIsGenerating(false)
        return
      } else if (data.error) {
        console.warn('AI Architect returned error, falling back:', data.error)
      }
    } catch (fetchErr) {
      console.warn('Network error calling AI Architect, falling back:', fetchErr)
    }

    const plan = generateRagNasmProgram({
      clientName,
      clientAge: parseNumericInput(clientAge, 35),
      goal,
      targetNasmPhase: phase,
      trainingDaysPerWeek: daysPerWeek,
      experienceLevel: experience,
      equipmentAccess: equipment,
      cardioBlendStyle,
      knownBenchmarks: {
        'Bench Press': { weightLbs: parseNumericInput(bench1RM, 225), reps: 1 },
        'Squat': { weightLbs: parseNumericInput(squat1RM, 315), reps: 1 },
        'Deadlift': { weightLbs: parseNumericInput(deadlift1RM, 385), reps: 1 },
      },
      kineticCompensations: compensations,
      contraindicationTags: effectiveContraindicationTags,
      injuriesLimitations: injuriesLimitations || undefined,
    })

    setGeneratedPlan(plan)
    setActiveDayTab(1)
    setIsGenerating(false)
  }

  const handleAssignPlan = async () => {
    if (!clientId) {
      setApplyStatus(`✓ Generated plan ready for review: ${generatedPlan.planTitle}`)
      if (onPlanAssigned) {
        onPlanAssigned(generatedPlan)
      }
      return
    }

    setIsSaving(true)
    setApplyStatus(null)
    setApplyError(null)

    try {
      const workoutsPayload = generatedPlan.workouts.map(w => {
        const cardioNote = w.cardioProtocol
          ? `\n\nIntegrated Cardio: ${w.cardioProtocol.title} (${w.cardioProtocol.durationMins}m in ${w.cardioProtocol.targetZone})\n• Modalities: ${w.cardioProtocol.recommendedModalities.join(', ')}\n• Rationale: ${w.cardioProtocol.metabolicRationale}`
          : ''

        return {
          day: w.day,
          focus: w.focus,
          notes: `${w.dailyPeriodizationMemo}\n\nWarmup: Inhibit (${w.warmupProtocol.inhibitSmr.join(', ')}) -> Lengthen (${w.warmupProtocol.lengthenStaticStretch.join(', ')}) -> Activate (${w.warmupProtocol.activateDynamic.join(', ')})${cardioNote}`,
          exercises: w.exercises.map(ex => ({
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            tempo: ex.tempo,
            rest: ex.rest,
            notes: ex.targetLoadLbs ? `Prescribed Load: ${ex.targetLoadLbs} lbs` : undefined,
            description: ex.nasmClinicalSource,
            primaryEquipment: detectExerciseEquipment(ex.name, ex.nasmClinicalSource),
          })),
          cardioProtocol: w.cardioProtocol ?? null,
        }
      })

      const csrfCookie = typeof document !== 'undefined'
        ? document.cookie.split('; ').find(row => row.startsWith('csrf-session='))?.split('=')[1]
        : null

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (csrfCookie) {
        headers['x-csrf-token'] = csrfCookie
      }

      const res = await fetch('/api/coach/workout-plans', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          clientId,
          name: generatedPlan.planTitle,
          goal: generatedPlan.primaryGoal,
          nasmOptPhase: Number(generatedPlan.nasmOptPhase),
          phaseName: generatedPlan.phaseName,
          sessionsPerWeek: Number(generatedPlan.sessionsPerWeek),
          estimatedDurationMins: 55,
          overwrite: overwriteExisting,
          targetPlanId: overwriteExisting && existingPlan?.id ? existingPlan.id : undefined,
          workouts: workoutsPayload,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || `Failed to deploy plan (status: ${res.status}).`)
      }

      if (data.isOverwritten) {
        setApplyStatus(`✓ Successfully overwritten active program with "${generatedPlan.planTitle}" for ${clientName}!`)
      } else {
        setApplyStatus(`✓ Successfully deployed "${generatedPlan.planTitle}" to ${clientName}'s active programming!`)
      }

      if (onPlanAssigned) {
        onPlanAssigned(generatedPlan)
      }
    } catch (err: unknown) {
      const errObj = err as { message?: string }
      setApplyError(errObj?.message || 'Error deploying generated plan.')
    } finally {
      setIsSaving(false)
    }
  }

  const activeDay = generatedPlan?.workouts.find(w => w.day === activeDayTab) || generatedPlan?.workouts[0]
  const eqCaps = parseEquipmentCapabilities(equipment)
  const blendSummary = generatedPlan?.strengthCardioBlendSummary

  const MODALITY_TAGS = [
    { key: 'barbell', label: 'Barbell & Squat Rack' },
    { key: 'dumbbell', label: 'Dumbbells' },
    { key: 'cable', label: 'Cable Machine' },
    { key: 'band', label: 'Resistance Bands' },
    { key: 'stability ball', label: 'Stability Ball' },
    { key: 'bosu', label: 'BOSU Balance Trainer' },
    { key: 'bench', label: 'Adjustable Bench' },
    { key: 'pull-up bar', label: 'Pull-Up Bar' },
    { key: 'medicine ball', label: 'Medicine Ball' },
    { key: 'kettlebell', label: 'Kettlebell' },
    { key: 'machines', label: 'Weight Machines' },
  ]

  return (
    <div
      style={{
        display: 'grid',
        gap: 20,
        background: 'linear-gradient(180deg, rgba(8,14,24,0.95) 0%, rgba(4,8,15,0.98) 100%)',
        border: '1px solid rgba(212,160,23,0.3)',
        borderRadius: 12,
        padding: 'clamp(14px, 3vw, 24px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* ── Studio Header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 700,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                padding: '4px 10px',
                background: 'rgba(212,160,23,0.15)',
                color: 'var(--gold-lt)',
                border: '1px solid rgba(212,160,23,0.4)',
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <GaaIcon name="bot" size={13} tone="gold" />
              <span>Coach Gordon · Master NASM AI Persona</span>
            </span>
            <span style={{ color: 'var(--gray)', fontSize: 13 }}>
              20+ Yrs Master CPT · Strict OPT™ Periodization · 100% Official NASM Edge CDN Media
            </span>
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '0.04em',
              margin: '6px 0 0',
              color: '#FFFFFF',
            }}
          >
            Coach Gordon · Master NASM AI Head Coach
          </h3>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{
            background: 'linear-gradient(135deg, #D4A017, #B8860B)',
            color: '#080E18',
            fontFamily: 'Raleway, sans-serif',
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '12px 24px',
            border: 'none',
            borderRadius: 6,
            cursor: isGenerating ? 'wait' : 'pointer',
            boxShadow: '0 4px 14px rgba(212,160,23,0.4)',
            transition: 'all 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {isGenerating ? (
            'Coach Gordon is Architecting Plan...'
          ) : (
            <>
              <GaaIcon name="lightning" size={14} tone="inherit" />
              <span>Generate OPT Program with Coach Gordon</span>
            </>
          )}
        </button>
      </div>

      {/* ── Active PAR-Q Biomechanical Limitations Notice ────────────── */}
      {(contraindicationTags.length > 0 || contraindicationNotes.length > 0) && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(20,10,10,0.85) 100%)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 8,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <GaaIcon name="shield-check" size={12} tone="ruby" />
                <span>PAR-Q Health Shield Active ({contraindicationTags.length + contraindicationNotes.length} limitation{contraindicationTags.length + contraindicationNotes.length === 1 ? '' : 's'})</span>
              </span>
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--white)', fontSize: 13 }}>
              {contraindicationNotes.join(' · ') || 'Active joint or cardiovascular contraindications detected on file.'}
            </p>
            <p style={{ margin: '2px 0 0', color: 'var(--gold-lt)', fontSize: 12 }}>
              ✓ Master NASM Coach Gordon automatically replaces all contraindicated exercises with safe biomechanical alternatives.
            </p>
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              background: 'rgba(239,68,68,0.2)',
              color: '#FCA5A5',
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid rgba(239,68,68,0.3)',
            }}
          >
            Auto-Substitutions Enforced
          </span>
        </div>
      )}

      {/* ── Active Plan Deployment Mode Selector ──────────────────────── */}
      {existingPlan && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(212,160,23,0.1) 0%, rgba(10,14,24,0.9) 100%)',
            border: '1px solid rgba(212,160,23,0.35)',
            borderRadius: 8,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name="gear" size={12} tone="gold" />
              <span>Client Program Deployment Mode</span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: '#FFFFFF' }}>
              Client already has an active program: <strong>{existingPlan.name || 'Personalized Routine'}</strong> (Phase {existingPlan.nasm_opt_phase ?? 1})
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setOverwriteExisting(true)}
              style={{
                padding: '7px 14px',
                borderRadius: 4,
                border: overwriteExisting ? '1.5px solid var(--gold)' : '1px solid rgba(255,255,255,0.15)',
                background: overwriteExisting ? 'var(--gold)' : 'rgba(255,255,255,0.05)',
                color: overwriteExisting ? '#0A0E18' : 'var(--white)',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              ✓ Overwrite Active Program (Recommended)
            </button>
            <button
              type="button"
              onClick={() => setOverwriteExisting(false)}
              style={{
                padding: '7px 14px',
                borderRadius: 4,
                border: !overwriteExisting ? '1.5px solid var(--gold)' : '1px solid rgba(255,255,255,0.15)',
                background: !overwriteExisting ? 'var(--gold)' : 'rgba(255,255,255,0.05)',
                color: !overwriteExisting ? '#0A0E18' : 'var(--white)',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              + Save as New Version
            </button>
          </div>
        </div>
      )}

      {/* ── Inputs Grid ───────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
          gap: 14,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8,
          padding: '16px',
        }}
      >
        {/* Goal */}
        <div>
          <label style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 600 }}>
            Training Objective
          </label>
          <select
            value={goal}
            onChange={e => setGoal(e.target.value as 'fat_loss' | 'hypertrophy' | 'performance' | 'general_fitness')}
            style={{ width: '100%', background: '#0A0F1D', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 10px', borderRadius: 6, marginTop: 4, fontSize: 13 }}
          >
            <option value="fat_loss">Fat Loss & Metabolic Stabilization (55/45 Blend)</option>
            <option value="hypertrophy">Muscular Development (80/20 Strength Blend)</option>
            <option value="performance">Max Strength & Athletic Power (65/35 Blend)</option>
            <option value="general_fitness">General Health & Longevity (50/50 Blend)</option>
          </select>
        </div>

        {/* Phase */}
        <div>
          <label style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 600 }}>
            Target NASM OPT™ Phase
          </label>
          <select
            value={phase}
            onChange={e => setPhase(Number(e.target.value))}
            style={{ width: '100%', background: '#0A0F1D', color: '#FFFFFF', border: '1px solid rgba(212,160,23,0.4)', padding: '8px 10px', borderRadius: 6, marginTop: 4, fontSize: 13 }}
          >
            {Object.entries(NASM_OPT_PHASE_STANDARDS).map(([p, meta]) => (
              <option key={p} value={p}>
                Phase {p}: {meta.phaseName}
              </option>
            ))}
          </select>
        </div>

        {/* Weekly Frequency */}
        <div>
          <label style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 600 }}>
            Weekly Frequency
          </label>
          <select
            value={daysPerWeek}
            onChange={e => setDaysPerWeek(Number(e.target.value))}
            style={{ width: '100%', background: '#0A0F1D', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 10px', borderRadius: 6, marginTop: 4, fontSize: 13 }}
          >
            <option value={2}>2 Days / Week (Full Body Split)</option>
            <option value={3}>3 Days / Week (Total Body Wave)</option>
            <option value={4}>4 Days / Week (Upper / Lower Split)</option>
            <option value={5}>5 Days / Week (Body Part Specialization)</option>
            <option value={6}>6 Days / Week (Push / Pull / Legs)</option>
          </select>
        </div>

        {/* Experience */}
        <div>
          <label style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 600 }}>
            Athlete Conditioning Tier
          </label>
          <select
            value={experience}
            onChange={e => setExperience(e.target.value as 'beginner' | 'intermediate' | 'advanced' | 'elite')}
            style={{ width: '100%', background: '#0A0F1D', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 10px', borderRadius: 6, marginTop: 4, fontSize: 13 }}
          >
            <option value="beginner">Beginner (Establish joint stability)</option>
            <option value="intermediate">Intermediate (Strength progression)</option>
            <option value="advanced">Advanced (High work capacity)</option>
            <option value="elite">Elite Master (Complex PAP / Power)</option>
          </select>
        </div>

        {/* Cardio Blend Style */}
        <div>
          <label style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 700 }}>
            Strength / Cardio Blend Mode
          </label>
          <select
            value={cardioBlendStyle}
            onChange={e => setCardioBlendStyle(e.target.value as 'integrated_finishers' | 'dedicated_conditioning' | 'minimal_flush' | 'none')}
            style={{ width: '100%', background: '#0A0F1D', color: '#FFFFFF', border: '1px solid rgba(212,160,23,0.4)', padding: '8px 10px', borderRadius: 6, marginTop: 4, fontSize: 13, fontWeight: 600 }}
          >
            <option value="integrated_finishers">Post-Lift Finishers (Recommended)</option>
            <option value="dedicated_conditioning">Dedicated Stage Conditioning Days</option>
            <option value="minimal_flush">Minimal Aerobic Flush (Hypertrophy)</option>
            <option value="none">Pure Strength Only (Zero Cardio)</option>
          </select>
        </div>
      </div>

      {/* ── Equipment & Modality Selection ──────────────────────────────── */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(212,160,23,0.3)',
          borderRadius: 8,
          padding: '14px 16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Equipment Availability Profile & Training Environment
          </div>
          <span style={{ fontSize: 11, color: eqCaps.isHomeDumbbellOnly || eqCaps.isBandsOnly || eqCaps.isBodyweightOnly ? '#38BDF8' : 'var(--gray)' }}>
            Active Profile: <strong>{eqCaps.summaryLabel}</strong>
          </span>
        </div>

        {/* Quick Presets Dropdown */}
        <div style={{ marginBottom: 12 }}>
          <select
            value={equipmentPreset}
            onChange={e => handlePresetChange(e.target.value)}
            style={{
              width: '100%',
              background: '#0A0F1D',
              color: '#FFFFFF',
              border: '1px solid rgba(212,160,23,0.4)',
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {Object.entries(EQUIPMENT_PRESETS).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Modality Checkbox Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {MODALITY_TAGS.map(tag => {
            const isChecked = equipment.some(e => e.toLowerCase() === tag.key.toLowerCase())
            return (
              <button
                key={tag.key}
                type="button"
                onClick={() => handleToggleEquipmentModality(tag.key)}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '5px 10px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  border: isChecked ? '1px solid rgba(212,160,23,0.6)' : '1px solid rgba(255,255,255,0.12)',
                  background: isChecked ? 'rgba(212,160,23,0.18)' : 'rgba(255,255,255,0.03)',
                  color: isChecked ? 'var(--gold-lt)' : 'var(--gray)',
                  transition: 'all 0.15s ease',
                }}
              >
                {isChecked ? '✓' : '+'} {tag.label}
              </button>
            )
          })}
        </div>

        {/* Smart Adaptation Notification */}
        {(eqCaps.isHomeDumbbellOnly || eqCaps.isBandsOnly || eqCaps.isBodyweightOnly || !eqCaps.hasBarbell) && (
          <div
            style={{
              marginTop: 10,
              padding: '8px 12px',
              background: 'rgba(56,189,248,0.08)',
              borderLeft: '3px solid #38BDF8',
              borderRadius: 4,
              fontSize: 11,
              color: '#BAE6FD',
              lineHeight: 1.4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <GaaIcon name="travel" size={14} tone="cyan" />
              <div>
                <strong>Home/Travel Adaptation Active:</strong> All compound exercises automatically substituted for dumbbells, resistance bands, and bodyweight progressions. Olympic barbells, squat racks, and heavy cable machines excluded from prescription.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Benchmarks & Movement Screen Toggles ────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 14 }}>
        {/* 1RM Inputs */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
            Client 1RM Benchmarks & Age
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 70px), 1fr))', gap: 8 }}>
            <div>
              <label style={{ fontSize: 10, color: 'var(--gray)' }}>Age</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                onFocus={selectOnFocus}
                value={clientAge}
                onChange={e => setClientAge(sanitizeNumericInput(e.target.value))}
                style={{ width: '100%', background: '#0A0F1D', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 8px', borderRadius: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--gray)' }}>Bench (lbs)</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                onFocus={selectOnFocus}
                value={bench1RM}
                onChange={e => setBench1RM(sanitizeNumericInput(e.target.value))}
                style={{ width: '100%', background: '#0A0F1D', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 8px', borderRadius: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--gray)' }}>Squat (lbs)</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                onFocus={selectOnFocus}
                value={squat1RM}
                onChange={e => setSquat1RM(sanitizeNumericInput(e.target.value))}
                style={{ width: '100%', background: '#0A0F1D', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 8px', borderRadius: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--gray)' }}>Deadlift (lbs)</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                onFocus={selectOnFocus}
                value={deadlift1RM}
                onChange={e => setDeadlift1RM(sanitizeNumericInput(e.target.value))}
                style={{ width: '100%', background: '#0A0F1D', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 8px', borderRadius: 4 }}
              />
            </div>
          </div>
        </div>

        {/* Kinetic Screen Checkpoints */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
            OHSA Kinetic Screen (Auto-Inject Warmups)
          </div>
          <div style={{ display: 'grid', gap: 6, fontSize: 11 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={kneesCaveIn} onChange={e => setKneesCaveIn(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              <span>Knees Cave In (Knee Valgus / Overactive Adductors)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={forwardLean} onChange={e => setForwardLean(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              <span>Excessive Forward Lean (Overactive Hip Flexors & Soleus)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={armsFallForward} onChange={e => setArmsFallForward(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              <span>Arms Fall Forward (Overactive Latissimus Dorsi & Pectorals)</span>
            </label>
          </div>
        </div>
      </div>

      {/* ── Status Notifications ───────────────────────────────────────── */}
      {applyStatus && (
        <div
          style={{
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid #10B981',
            color: '#10B981',
            padding: '12px 18px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {applyStatus}
        </div>
      )}

      {applyError && (
        <div
          style={{
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid #EF4444',
            color: '#EF4444',
            padding: '12px 18px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          ✕ {applyError}
        </div>
      )}

      {/* ── Generated Plan Output ─────────────────────────────────────── */}
      {generatedPlan && (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Plan Banner */}
          <div
            style={{
              background: 'radial-gradient(ellipse at center, rgba(212,160,23,0.15) 0%, rgba(10,16,28,0.7) 100%)',
              border: '1px solid rgba(212,160,23,0.45)',
              borderRadius: 8,
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                  Active Mesocycle Blueprint · {generatedPlan.primaryGoal} · {eqCaps.summaryLabel}
                </div>
                <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 22, fontWeight: 700, margin: '2px 0 6px', color: '#FFFFFF', letterSpacing: '0.04em' }}>
                  {generatedPlan.planTitle}
                </h4>
                <div style={{ fontSize: 12, color: 'var(--gray)', maxWidth: 700 }}>
                  {NASM_OPT_PHASE_STANDARDS[generatedPlan.nasmOptPhase]?.systemDescription}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAssignPlan}
                disabled={isSaving}
                style={{
                  background: overwriteExisting ? 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)' : 'rgba(16,185,129,0.2)',
                  border: overwriteExisting ? '1px solid #D4AF37' : '1px solid #10B981',
                  color: overwriteExisting ? '#0A0E18' : '#10B981',
                  borderRadius: 6,
                  padding: '10px 20px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: isSaving ? 'wait' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: overwriteExisting ? '0 4px 14px rgba(212,160,23,0.4)' : '0 4px 12px rgba(16,185,129,0.2)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {isSaving ? 'Deploying...' : overwriteExisting ? '✓ Deploy & Overwrite Active Program' : '✓ Deploy as New Version'}
              </button>
            </div>

            {/* Strength / Cardio Blend Summary Bar */}
            {blendSummary && (
              <div
                style={{
                  marginTop: 16,
                  padding: '12px 14px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(212,160,23,0.25)',
                  borderRadius: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <GaaIcon name="dna" size={12} tone="gold" />
                    <span>Periodized Strength &amp; Cardio Blend: <span style={{ color: '#FFFFFF' }}>{blendSummary.blendRatio}</span></span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <GaaIcon name="watch" size={12} tone="gold" />
                    <span>Total Weekly Cardio Volume: <strong style={{ color: 'var(--gold-lt)' }}>~{blendSummary.weeklyCardioMinutes} Mins / Week</strong></span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.1)', marginBottom: 8 }}>
                  <div style={{ width: `${blendSummary.strengthPct}%`, background: 'linear-gradient(90deg, #D4A017, #F59E0B)' }} title="Strength Training" />
                  <div style={{ width: `${blendSummary.cardioPct}%`, background: 'linear-gradient(90deg, #38BDF8, #0284C7)' }} title="Cardiorespiratory Conditioning" />
                </div>

                <div style={{ fontSize: 11, color: '#E2E8F0', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GaaIcon name="shield-check" size={13} tone="gold" />
                  <span><strong>Concurrent Interference Shield:</strong> {blendSummary.interferenceShieldStrategy}</span>
                </div>
              </div>
            )}

            {/* Evidence-Based Methodology Citations Dropdown */}
            {generatedPlan.ragSourcesCited && generatedPlan.ragSourcesCited.length > 0 && (
              <details style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 14, paddingTop: 10, cursor: 'pointer' }}>
                <summary
                  style={{
                    fontSize: 11,
                    color: 'var(--gold-lt)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    userSelect: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: 'rgba(212,160,23,0.08)',
                    border: '1px solid rgba(212,160,23,0.2)',
                  }}
                >
                  <GaaIcon name="folder" size={12} tone="gold" />
                  <span>Sports Science Evidence Sources ({generatedPlan.ragSourcesCited.length})</span>
                  <span style={{ fontSize: 9 }}>▾</span>
                </summary>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {generatedPlan.ragSourcesCited.map((cite, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 10,
                        background: 'rgba(255,255,255,0.06)',
                        padding: '3px 8px',
                        borderRadius: 4,
                        color: 'rgba(255,255,255,0.8)',
                      }}
                    >
                      {cite}
                    </span>
                  ))}
                </div>
              </details>
            )}
          </div>

          {/* Day Navigation Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10 }}>
            {generatedPlan.workouts.map(w => (
              <button
                key={w.day}
                type="button"
                onClick={() => setActiveDayTab(w.day)}
                style={{
                  background: activeDayTab === w.day ? 'linear-gradient(135deg, rgba(212,160,23,0.4), rgba(212,160,23,0.18))' : 'rgba(255,255,255,0.04)',
                  color: activeDayTab === w.day ? 'var(--gold-lt)' : 'var(--gray)',
                  border: activeDayTab === w.day ? '1px solid rgba(212,160,23,0.55)' : '1px solid rgba(255,255,255,0.08)',
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                Day {w.day}: {w.focus}
              </button>
            ))}
          </div>

          {/* Active Day Content */}
          {activeDay && (
            <div style={{ display: 'grid', gap: 18 }}>
              {/* ── 1. Clinical Kinetic Warmup Protocol with Official NASM Video/Image Cards ── */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.09) 0%, rgba(10,24,20,0.85) 100%)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderLeft: '4px solid #10B981',
                  borderRadius: 8,
                  padding: '16px 18px',
                  display: 'grid',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontSize: 12, color: '#10B981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <GaaIcon name="lightning" size={13} tone="emerald" />
                    Clinical Kinetic Warmup Protocol (Inhibit → Lengthen → Activate)
                  </div>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                    Prepare neuromuscular system & correct kinetic compensations
                  </span>
                </div>

                {/* SMR / Inhibit Cards */}
                {activeDay.warmupProtocol.inhibitSmr.length > 0 && (
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ fontSize: 11, color: '#FBBF24', fontWeight: 700, textTransform: 'uppercase' }}>
                      1. SMR / Self-Myofascial Release (Inhibit · Hold tender spots 30–60s)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 8 }}>
                      {activeDay.warmupProtocol.inhibitSmr.map((item, idx) => {
                        const videoRes = resolveExerciseVideoEmbed(item)
                        const ytId = extractYouTubeVideoId(videoRes.externalUrl) || extractYouTubeVideoId(videoRes.embedUrl)
                        const gaaImage = resolveGaaExerciseImage(item, false)
                        const imgUrl = (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null) || gaaImage || BRAND_LOGO_FALLBACK_IMAGE
                        const hasVideo = Boolean(videoRes.embedUrl || videoRes.externalUrl)

                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              background: 'rgba(0,0,0,0.3)',
                              border: '1px solid rgba(251,191,36,0.2)',
                              borderRadius: 6,
                              padding: '8px 10px',
                            }}
                          >
                            <div
                              onClick={() => {
                                if (hasVideo) {
                                  setActiveVideoModal({ title: item, embedUrl: videoRes.embedUrl, externalUrl: videoRes.externalUrl })
                                }
                              }}
                              style={{
                                position: 'relative',
                                width: 'clamp(84px, 12vw, 108px)',
                                aspectRatio: '16 / 10',
                                minWidth: 'clamp(84px, 12vw, 108px)',
                                height: 'auto',
                                borderRadius: 6,
                                overflow: 'hidden',
                                backgroundColor: '#0a0f1d',
                                border: '1px solid rgba(251,191,36,0.3)',
                                cursor: hasVideo ? 'pointer' : 'default',
                                flexShrink: 0,
                              }}
                              title={hasVideo ? `Watch official NASM demo for ${item}` : item}
                            >
                              <img
                                src={imgUrl}
                                alt={item}
                                loading="lazy"
                                decoding="async"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = BRAND_LOGO_FALLBACK_IMAGE
                                }}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  aspectRatio: '16 / 10',
                                  objectFit: 'cover',
                                  objectPosition: 'center',
                                  display: 'block',
                                }}
                              />
                              {hasVideo && (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <GaaIcon name="play" size={12} tone="white" />
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item}
                              </div>
                              <div style={{ fontSize: 10, color: '#FBBF24' }}>1 Set · Hold 30–60s on tender points</div>
                            </div>
                            {hasVideo && (
                              <button
                                type="button"
                                onClick={() => setActiveVideoModal({ title: item, embedUrl: videoRes.embedUrl, externalUrl: videoRes.externalUrl })}
                                style={{ fontSize: 10, padding: '4px 8px', borderRadius: 4, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)', color: '#FCD34D', cursor: 'pointer' }}
                              >
                                Demo
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Static Stretch / Lengthen Cards */}
                {activeDay.warmupProtocol.lengthenStaticStretch.length > 0 && (
                  <div style={{ display: 'grid', gap: 6, marginTop: 4 }}>
                    <div style={{ fontSize: 11, color: '#10B981', fontWeight: 700, textTransform: 'uppercase' }}>
                      2. Static Stretching (Lengthen · Hold 30s per side)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 8 }}>
                      {activeDay.warmupProtocol.lengthenStaticStretch.map((item, idx) => {
                        const videoRes = resolveExerciseVideoEmbed(item)
                        const ytId = extractYouTubeVideoId(videoRes.externalUrl) || extractYouTubeVideoId(videoRes.embedUrl)
                        const gaaImage = resolveGaaExerciseImage(item, false)
                        const imgUrl = (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null) || gaaImage || BRAND_LOGO_FALLBACK_IMAGE
                        const hasVideo = Boolean(videoRes.embedUrl || videoRes.externalUrl)

                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              background: 'rgba(0,0,0,0.3)',
                              border: '1px solid rgba(16,185,129,0.2)',
                              borderRadius: 6,
                              padding: '8px 10px',
                            }}
                          >
                            <div
                              onClick={() => {
                                if (hasVideo) {
                                  setActiveVideoModal({ title: item, embedUrl: videoRes.embedUrl, externalUrl: videoRes.externalUrl })
                                }
                              }}
                              style={{
                                position: 'relative',
                                width: 'clamp(84px, 12vw, 108px)',
                                aspectRatio: '16 / 10',
                                minWidth: 'clamp(84px, 12vw, 108px)',
                                height: 'auto',
                                borderRadius: 6,
                                overflow: 'hidden',
                                backgroundColor: '#0a0f1d',
                                border: '1px solid rgba(16,185,129,0.3)',
                                cursor: hasVideo ? 'pointer' : 'default',
                                flexShrink: 0,
                              }}
                              title={hasVideo ? `Watch official NASM demo for ${item}` : item}
                            >
                              <img
                                src={imgUrl}
                                alt={item}
                                loading="lazy"
                                decoding="async"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = BRAND_LOGO_FALLBACK_IMAGE
                                }}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  aspectRatio: '16 / 10',
                                  objectFit: 'cover',
                                  objectPosition: 'center',
                                  display: 'block',
                                }}
                              />
                              {hasVideo && (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <GaaIcon name="play" size={12} tone="white" />
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item}
                              </div>
                              <div style={{ fontSize: 10, color: '#10B981' }}>1–2 Sets · 30s Static Hold</div>
                            </div>
                            {hasVideo && (
                              <button
                                type="button"
                                onClick={() => setActiveVideoModal({ title: item, embedUrl: videoRes.embedUrl, externalUrl: videoRes.externalUrl })}
                                style={{ fontSize: 10, padding: '4px 8px', borderRadius: 4, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#6EE7B7', cursor: 'pointer' }}
                              >
                                Demo
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Dynamic Activation Cards */}
                {activeDay.warmupProtocol.activateDynamic.length > 0 && (
                  <div style={{ display: 'grid', gap: 6, marginTop: 4 }}>
                    <div style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 700, textTransform: 'uppercase' }}>
                      3. Dynamic & Stabilization Activation (Activate · 10–12 reps @ 4/2/1 tempo)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 8 }}>
                      {activeDay.warmupProtocol.activateDynamic.map((item, idx) => {
                        const videoRes = resolveExerciseVideoEmbed(item)
                        const ytId = extractYouTubeVideoId(videoRes.externalUrl) || extractYouTubeVideoId(videoRes.embedUrl)
                        const gaaImage = resolveGaaExerciseImage(item, false)
                        const imgUrl = (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null) || gaaImage || BRAND_LOGO_FALLBACK_IMAGE
                        const hasVideo = Boolean(videoRes.embedUrl || videoRes.externalUrl)

                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              background: 'rgba(0,0,0,0.3)',
                              border: '1px solid rgba(212,160,23,0.2)',
                              borderRadius: 6,
                              padding: '8px 10px',
                            }}
                          >
                            <div
                              onClick={() => {
                                if (hasVideo) {
                                  setActiveVideoModal({ title: item, embedUrl: videoRes.embedUrl, externalUrl: videoRes.externalUrl })
                                }
                              }}
                              style={{
                                position: 'relative',
                                width: 'clamp(84px, 12vw, 108px)',
                                aspectRatio: '16 / 10',
                                minWidth: 'clamp(84px, 12vw, 108px)',
                                height: 'auto',
                                borderRadius: 6,
                                overflow: 'hidden',
                                backgroundColor: '#0a0f1d',
                                border: '1px solid rgba(212,160,23,0.3)',
                                cursor: hasVideo ? 'pointer' : 'default',
                                flexShrink: 0,
                              }}
                              title={hasVideo ? `Watch official NASM demo for ${item}` : item}
                            >
                              <img
                                src={imgUrl}
                                alt={item}
                                loading="lazy"
                                decoding="async"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = BRAND_LOGO_FALLBACK_IMAGE
                                }}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  aspectRatio: '16 / 10',
                                  objectFit: 'cover',
                                  objectPosition: 'center',
                                  display: 'block',
                                }}
                              />
                              {hasVideo && (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <GaaIcon name="play" size={12} tone="white" />
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--gold-lt)' }}>1–2 Sets · 10–12 Reps @ 4/2/1</div>
                            </div>
                            {hasVideo && (
                              <button
                                type="button"
                                onClick={() => setActiveVideoModal({ title: item, embedUrl: videoRes.embedUrl, externalUrl: videoRes.externalUrl })}
                                style={{ fontSize: 10, padding: '4px 8px', borderRadius: 4, background: 'rgba(212,160,23,0.15)', border: '1px solid rgba(212,160,23,0.4)', color: 'var(--gold-lt)', cursor: 'pointer' }}
                              >
                                Demo
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ── 2. Core, Balance & Resistance Training Exercises ── */}
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--gold-lt)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GaaIcon name="lightning" size={14} tone="gold" />
                  Phase {activeDay.nasmOptPhase} Movement Protocols & Supersets
                </div>

                {activeDay.exercises.map((ex, idx) => {
                  const videoRes = resolveExerciseVideoEmbed(ex.name, ex.videoUrl)
                  const ytId = extractYouTubeVideoId(videoRes.externalUrl) || extractYouTubeVideoId(videoRes.embedUrl)
                  const gaaImage = resolveGaaExerciseImage(ex.name, false)
                  const validCustomExImg = (ex.imageUrl && !ex.imageUrl.startsWith('/images/exercises/')) ? ex.imageUrl : null
                  const imgUrl = (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null) || gaaImage || validCustomExImg || BRAND_LOGO_FALLBACK_IMAGE

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        background: ex.supersetPairWith ? 'rgba(212,160,23,0.08)' : 'rgba(255,255,255,0.03)',
                        border: ex.supersetPairWith ? '1px solid rgba(212,160,23,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 8,
                        padding: '12px 16px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: '1 1 260px', minWidth: 0 }}>
                        {imgUrl && (
                          <div
                            onClick={() => setActiveVideoModal({ title: ex.name, embedUrl: videoRes.embedUrl, externalUrl: videoRes.externalUrl })}
                            style={{
                              position: 'relative',
                              width: 'clamp(96px, 14vw, 128px)',
                              aspectRatio: '16 / 10',
                              minWidth: 'clamp(96px, 14vw, 128px)',
                              height: 'auto',
                              borderRadius: 6,
                              overflow: 'hidden',
                              backgroundImage: `url(${imgUrl})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              cursor: 'pointer',
                              border: '1px solid rgba(212,160,23,0.3)',
                              flexShrink: 0,
                            }}
                            title={`Watch official NASM demo for ${ex.name}`}
                          >
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <GaaIcon name="play" size={14} tone="white" />
                            </div>
                          </div>
                        )}

                        <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{ex.name}</span>
                            {ex.supersetPairWith && (
                              <span style={{ fontSize: 10, background: 'rgba(212,160,23,0.25)', color: 'var(--gold-lt)', padding: '2px 6px', borderRadius: 4, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <GaaIcon name="link" size={10} tone="gold" /> SUPERSET
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
                            {ex.coachingCues.join(' · ')}
                          </div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                            Source: {ex.nasmClinicalSource}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase' }}>Sets × Reps</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>
                            {ex.sets} × {ex.reps}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase' }}>Tempo</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold-lt)' }}>{ex.tempo}</div>
                        </div>

                        <div>
                          <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase' }}>Rest</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{ex.rest}</div>
                        </div>

                        {ex.targetLoadLbs && (
                          <div style={{ background: 'rgba(212,160,23,0.15)', border: '1px solid rgba(212,160,23,0.4)', padding: '4px 10px', borderRadius: 6 }}>
                            <div style={{ fontSize: 9, color: 'var(--gold-lt)', textTransform: 'uppercase' }}>Load</div>
                            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 16, color: 'var(--gold-lt)' }}>
                              {ex.targetLoadLbs} LBS
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setActiveVideoModal({ title: ex.name, embedUrl: videoRes.embedUrl, externalUrl: videoRes.externalUrl })}
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '6px 12px',
                            borderRadius: 4,
                            background: 'rgba(212,160,23,0.15)',
                            border: '1px solid rgba(212,160,23,0.4)',
                            color: 'var(--gold-lt)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <GaaIcon name="play" size={10} tone="inherit" /> Demo
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ── 3. Postural Cool-Down & Regeneration Protocol Cards ── */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(13,27,42,0.85) 100%)',
                  border: '1px solid rgba(59,130,246,0.25)',
                  borderLeft: '4px solid #3B82F6',
                  borderRadius: 8,
                  padding: '16px 18px',
                  display: 'grid',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontSize: 12, color: '#60A5FA', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <GaaIcon name="stretch" size={13} tone="cyan" />
                    Postural Cool-Down & Parasympathetic Regeneration
                  </div>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                    Down-regulate CNS, release myofascial tension & restore resting muscle length
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 8 }}>
                  {/* Cooldown SMR Cards */}
                  {activeDay.warmupProtocol.inhibitSmr.map((smrName, idx) => {
                    const videoRes = resolveExerciseVideoEmbed(smrName)
                    const ytId = extractYouTubeVideoId(videoRes.externalUrl) || extractYouTubeVideoId(videoRes.embedUrl)
                    const gaaImage = resolveGaaExerciseImage(smrName, false)
                    const imgUrl = (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null) || gaaImage || BRAND_LOGO_FALLBACK_IMAGE
                    const hasVideo = Boolean(videoRes.embedUrl || videoRes.externalUrl)

                    return (
                      <div
                        key={`cd-smr-${idx}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(96,165,250,0.2)',
                          borderRadius: 6,
                          padding: '8px 10px',
                        }}
                      >
                        <div
                          onClick={() => {
                            if (hasVideo) {
                              setActiveVideoModal({ title: smrName, embedUrl: videoRes.embedUrl, externalUrl: videoRes.externalUrl })
                            }
                          }}
                          style={{
                            position: 'relative',
                            width: 'clamp(84px, 12vw, 108px)',
                            aspectRatio: '16 / 10',
                            minWidth: 'clamp(84px, 12vw, 108px)',
                            height: 'auto',
                            borderRadius: 6,
                            overflow: 'hidden',
                            backgroundColor: '#0a0f1d',
                            border: '1px solid rgba(96,165,250,0.3)',
                            cursor: hasVideo ? 'pointer' : 'default',
                            flexShrink: 0,
                          }}
                          title={hasVideo ? `Watch official NASM demo for ${smrName}` : smrName}
                        >
                          <img
                            src={imgUrl}
                            alt={smrName}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = BRAND_LOGO_FALLBACK_IMAGE
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              aspectRatio: '16 / 10',
                              objectFit: 'cover',
                              objectPosition: 'center',
                              display: 'block',
                            }}
                          />
                          {hasVideo && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <GaaIcon name="play" size={12} tone="white" />
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {smrName}
                          </div>
                          <div style={{ fontSize: 10, color: '#60A5FA' }}>SMR · 60s slow rolling per tight zone</div>
                        </div>
                        {hasVideo && (
                          <button
                            type="button"
                            onClick={() => setActiveVideoModal({ title: smrName, embedUrl: videoRes.embedUrl, externalUrl: videoRes.externalUrl })}
                            style={{ fontSize: 10, padding: '4px 8px', borderRadius: 4, background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.4)', color: '#93C5FD', cursor: 'pointer' }}
                          >
                            Demo
                          </button>
                        )}
                      </div>
                    )
                  })}

                  {/* Cooldown Static Stretch Cards */}
                  {activeDay.warmupProtocol.lengthenStaticStretch.map((stretchName, idx) => {
                    const videoRes = resolveExerciseVideoEmbed(stretchName)
                    const ytId = extractYouTubeVideoId(videoRes.externalUrl) || extractYouTubeVideoId(videoRes.embedUrl)
                    const gaaImage = resolveGaaExerciseImage(stretchName, false)
                    const imgUrl = (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null) || gaaImage || BRAND_LOGO_FALLBACK_IMAGE
                    const hasVideo = Boolean(videoRes.embedUrl || videoRes.externalUrl)

                    return (
                      <div
                        key={`cd-stretch-${idx}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(96,165,250,0.2)',
                          borderRadius: 6,
                          padding: '8px 10px',
                        }}
                      >
                        <div
                          onClick={() => {
                            if (hasVideo) {
                              setActiveVideoModal({ title: stretchName, embedUrl: videoRes.embedUrl, externalUrl: videoRes.externalUrl })
                            }
                          }}
                          style={{
                            position: 'relative',
                            width: 'clamp(84px, 12vw, 108px)',
                            aspectRatio: '16 / 10',
                            minWidth: 'clamp(84px, 12vw, 108px)',
                            height: 'auto',
                            borderRadius: 6,
                            overflow: 'hidden',
                            backgroundColor: '#0a0f1d',
                            border: '1px solid rgba(96,165,250,0.3)',
                            cursor: hasVideo ? 'pointer' : 'default',
                            flexShrink: 0,
                          }}
                          title={hasVideo ? `Watch official NASM demo for ${stretchName}` : stretchName}
                        >
                          <img
                            src={imgUrl}
                            alt={stretchName}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = BRAND_LOGO_FALLBACK_IMAGE
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              aspectRatio: '16 / 10',
                              objectFit: 'cover',
                              objectPosition: 'center',
                              display: 'block',
                            }}
                          />
                          {hasVideo && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <GaaIcon name="play" size={12} tone="white" />
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {stretchName}
                          </div>
                          <div style={{ fontSize: 10, color: '#60A5FA' }}>Static Stretch · 30s deep hold</div>
                        </div>
                        {hasVideo && (
                          <button
                            type="button"
                            onClick={() => setActiveVideoModal({ title: stretchName, embedUrl: videoRes.embedUrl, externalUrl: videoRes.externalUrl })}
                            style={{ fontSize: 10, padding: '4px 8px', borderRadius: 4, background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.4)', color: '#93C5FD', cursor: 'pointer' }}
                          >
                            Demo
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── 4. Integrated NASM Cardiorespiratory & Metabolic Finisher Card ── */}
              {activeDay.cardioProtocol && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(2,132,199,0.12) 0%, rgba(10,18,34,0.9) 100%)',
                    border: '1px solid rgba(56,189,248,0.4)',
                    borderRadius: 8,
                    padding: '16px 20px',
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          padding: '3px 8px',
                          background: '#0284C7',
                          color: '#FFFFFF',
                          borderRadius: 4,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <GaaIcon name="lightning" size={11} tone="white" /> Stage {activeDay.cardioProtocol.stage} Cardio
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>
                        {activeDay.cardioProtocol.title}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12 }}>
                      <span style={{ background: 'rgba(56,189,248,0.18)', color: '#38BDF8', padding: '4px 10px', borderRadius: 4, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <GaaIcon name="watch" size={11} tone="cyan" /> {activeDay.cardioProtocol.durationMins} MINS
                      </span>
                      <span style={{ background: 'rgba(212,160,23,0.18)', color: 'var(--gold-lt)', padding: '4px 10px', borderRadius: 4, fontWeight: 700 }}>
                        {activeDay.cardioProtocol.targetRpe}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 8, fontSize: 12 }}>
                    <div>
                      <span style={{ color: 'var(--gray)', fontSize: 11 }}>Target HR Zone: </span>
                      <strong style={{ color: '#38BDF8' }}>{activeDay.cardioProtocol.targetZone}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--gray)', fontSize: 11 }}>Work/Rest Ratio: </span>
                      <strong style={{ color: '#FFFFFF' }}>{activeDay.cardioProtocol.workRestRatio}</strong>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: '#E2E8F0', lineHeight: 1.4 }}>
                    <strong style={{ color: 'var(--gold-lt)' }}>Metabolic Rationale: </strong>
                    {activeDay.cardioProtocol.metabolicRationale}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 600 }}>Recommended Modalities:</span>
                    {activeDay.cardioProtocol.recommendedModalities.map((mod, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 11,
                          background: 'rgba(255,255,255,0.06)',
                          color: '#FFFFFF',
                          padding: '3px 8px',
                          borderRadius: 4,
                          border: '1px solid rgba(255,255,255,0.1)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <GaaIcon name="bike" size={11} tone="inherit" /> {mod}
                      </span>
                    ))}
                  </div>

                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                    Timing: {activeDay.cardioProtocol.timingGuideline} · Source: {activeDay.cardioProtocol.nasmChapterSource}
                  </div>
                </div>
              )}

              {/* ── 5. 4-Week Periodization Roadmap ── */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8,
                  padding: '14px 18px',
                  marginTop: 8,
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
                  Mesocycle Periodization Roadmap (Weeks 1–4)
                </div>
                <div style={{ display: 'grid', gap: 6, fontSize: 12 }}>
                  {generatedPlan.periodizationWeeklyMemos.map((memo, idx) => (
                    <div key={idx} style={{ color: '#E2E8F0' }}>
                      • {memo}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── 6. Official NASM Edge High-Definition Video Player Modal ── */}
          {activeVideoModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: 16,
              }}
              onClick={() => setActiveVideoModal(null)}
            >
              <div
                style={{
                  background: '#0B132B',
                  border: '1px solid rgba(212,160,23,0.4)',
                  borderRadius: 12,
                  width: '100%',
                  maxWidth: 720,
                  overflow: 'hidden',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <GaaIcon name="video-studio" size={15} tone="gold" />
                    NASM Edge Movement Standard: {activeVideoModal.title}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveVideoModal(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--gray)', fontSize: 20, cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    src={activeVideoModal.embedUrl}
                    title={activeVideoModal.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
                <div style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--gray)' }}>Official NASM Edge Instructor Video Production</span>
                  <a href={activeVideoModal.externalUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--gold-lt)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    Open in YouTube <GaaIcon name="link" size={11} tone="gold" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
