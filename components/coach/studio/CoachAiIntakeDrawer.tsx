'use client'

import React, { useState, useEffect } from 'react'
import { GaaIcon } from '@/components/ui/GaaIcon'

export interface CoachAiIntakeFormData {
  clientName: string
  clientAge?: number
  clientSex?: 'male' | 'female'
  goal: 'fat_loss' | 'hypertrophy' | 'performance' | 'general_fitness'
  targetNasmPhase: number
  trainingDaysPerWeek: number
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  equipmentAccess: string[]

  lifestyleRhythm: {
    workStyle: 'sedentary_desk' | 'active_standing' | 'travel_intensive'
    dailyRhythm: 'early_morning' | 'mid_day' | 'evening'
    sessionDurationMins: number
  }
  movementSuperpowers: string[]
  strictExclusions: string[]
  functionalDemands: string
  nutritionPhilosophy: 'precision_nutrition_hand_portion' | 'macro_calorie_tracking' | 'intuitive_chrono'
  dualCardioSplit: {
    sweatyFinisherModality: string
    freshNeatWalkMinutes: number
    freshNeatNotes?: string
  }
  coachGuidanceNotes: string
}

export interface CoachAiIntakeDrawerProps {
  isOpen: boolean
  onClose: () => void
  initialData?: Partial<CoachAiIntakeFormData>
  clientName: string
  clientId: string
  onSynthesize: (data: CoachAiIntakeFormData) => Promise<void>
  isSynthesizing: boolean
}

const COMMON_SUPERPOWERS = [
  'Burpees',
  'Pull-Ups',
  'Kettlebell Swings',
  'Push-Ups',
  'Box Jumps',
  'Deadlifts',
  'Reebok Step Aerobics',
  'Battle Ropes',
]

const COMMON_EXCLUSIONS = [
  'Mountain Climbers',
  'Running / Jogging',
  'Forward Lunges (Runner\'s Knee)',
  'Overhead Press (Shoulder Impingement)',
  'Deep Barbell Back Squats',
  'Burpees',
  'Box Jump Rebounds',
]

const COMMON_EQUIPMENT = [
  { id: 'dumbbell', label: 'Dumbbells' },
  { id: 'band', label: 'Resistance Bands' },
  { id: 'reebok step', label: 'Reebok Step' },
  { id: 'stability ball', label: 'Stability Ball' },
  { id: 'kettlebell', label: 'Kettlebells' },
  { id: 'barbell', label: 'Barbell & Rack' },
  { id: 'cable', label: 'Cable Machine' },
  { id: 'pull-up bar', label: 'Pull-Up Bar' },
  { id: 'treadmill', label: 'Treadmill' },
  { id: 'foam roller', label: 'Foam Roller' },
]

export default function CoachAiIntakeDrawer({
  isOpen,
  onClose,
  initialData,
  clientName,
  onSynthesize,
  isSynthesizing,
}: CoachAiIntakeDrawerProps) {
  // Form State
  const [goal, setGoal] = useState<'fat_loss' | 'hypertrophy' | 'performance' | 'general_fitness'>(
    initialData?.goal || 'fat_loss'
  )
  const [targetNasmPhase, setTargetNasmPhase] = useState<number>(initialData?.targetNasmPhase || 1)
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState<number>(initialData?.trainingDaysPerWeek || 3)
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'elite'>(
    initialData?.experienceLevel || 'intermediate'
  )
  const [clientAge, setClientAge] = useState<string>(
    initialData?.clientAge ? String(initialData.clientAge) : '42'
  )
  const [clientSex, setClientSex] = useState<'male' | 'female'>(initialData?.clientSex || 'female')

  // Lifestyle & Rhythm
  const [workStyle, setWorkStyle] = useState<'sedentary_desk' | 'active_standing' | 'travel_intensive'>(
    initialData?.lifestyleRhythm?.workStyle || 'sedentary_desk'
  )
  const [dailyRhythm, setDailyRhythm] = useState<'early_morning' | 'mid_day' | 'evening'>(
    initialData?.lifestyleRhythm?.dailyRhythm || 'early_morning'
  )
  const [sessionDurationMins, setSessionDurationMins] = useState<number>(
    initialData?.lifestyleRhythm?.sessionDurationMins || 35
  )

  // Superpowers & Exclusions
  const [superpowers, setSuperpowers] = useState<string[]>(
    initialData?.movementSuperpowers || ['Burpees', 'Reebok Step Aerobics']
  )
  const [newSuperpower, setNewSuperpower] = useState('')

  const [exclusions, setExclusions] = useState<string[]>(
    initialData?.strictExclusions || ['Mountain Climbers', 'Running / Jogging']
  )
  const [newExclusion, setNewExclusion] = useState('')

  // Functional Real-World Demands
  const [functionalDemands, setFunctionalDemands] = useState<string>(
    initialData?.functionalDemands ||
      'Assists elderly father on weekends with mobility transfers; requires robust hip hinge, grip, and posterior chain endurance.'
  )

  // Equipment
  const [equipmentAccess, setEquipmentAccess] = useState<string[]>(
    initialData?.equipmentAccess || ['dumbbell', 'band', 'reebok step', 'stability ball', 'bodyweight']
  )

  // Nutrition Philosophy
  const [nutritionPhilosophy, setNutritionPhilosophy] = useState<
    'precision_nutrition_hand_portion' | 'macro_calorie_tracking' | 'intuitive_chrono'
  >(initialData?.nutritionPhilosophy || 'precision_nutrition_hand_portion')

  // Dual Cardio
  const [sweatyFinisherModality, setSweatyFinisherModality] = useState<string>(
    initialData?.dualCardioSplit?.sweatyFinisherModality || '10-Minute Reebok Step Metabolic Flush'
  )
  const [freshNeatWalkMinutes, setFreshNeatWalkMinutes] = useState<number>(
    initialData?.dualCardioSplit?.freshNeatWalkMinutes || 30
  )
  const [freshNeatNotes, setFreshNeatNotes] = useState<string>(
    initialData?.dualCardioSplit?.freshNeatNotes ||
      'Dedicated morning sunshine walking ritual to visit father; clean, fresh, non-sweaty.'
  )

  // Coach Guidance Notes
  const [coachGuidanceNotes, setCoachGuidanceNotes] = useState<string>(
    initialData?.coachGuidanceNotes ||
      'Incorporate Reebok step for aerobic warm-up/finisher. Protect patellofemoral tracking (substitute forward lunges with step-ups or reverse lunges). Keep sessions crisp at 35 mins.'
  )

  // Presets applicator
  const applyPreset = (presetName: 'jennifer' | 'scott' | 'lisa') => {
    if (presetName === 'jennifer') {
      setGoal('fat_loss')
      setTargetNasmPhase(1)
      setTrainingDaysPerWeek(3)
      setExperienceLevel('intermediate')
      setClientAge('46')
      setClientSex('female')
      setWorkStyle('sedentary_desk')
      setDailyRhythm('early_morning')
      setSessionDurationMins(35)
      setSuperpowers(['Burpees', 'Reebok Step Aerobics'])
      setExclusions(['Mountain Climbers', 'Running / Jogging', 'Forward Lunges (Runner\'s Knee)'])
      setFunctionalDemands('Assists elderly father on weekends; needs posterior chain and hinge integrity.')
      setEquipmentAccess(['dumbbell', 'band', 'reebok step', 'stability ball', 'bodyweight'])
      setNutritionPhilosophy('precision_nutrition_hand_portion')
      setSweatyFinisherModality('10-Minute Reebok Step Metabolic Flush')
      setFreshNeatWalkMinutes(30)
      setFreshNeatNotes('Morning walk to father\'s home; non-sweaty NEAT to clear mind.')
      setCoachGuidanceNotes('Incorporate Reebok Step into metabolic finishers. Burpees are loved—program them! Strictly exclude mountain climbers and running. Protect patellofemoral tracking.')
    } else if (presetName === 'scott') {
      setGoal('hypertrophy')
      setTargetNasmPhase(2)
      setTrainingDaysPerWeek(4)
      setExperienceLevel('advanced')
      setClientAge('38')
      setClientSex('male')
      setWorkStyle('sedentary_desk')
      setDailyRhythm('early_morning')
      setSessionDurationMins(45)
      setSuperpowers(['Pull-Ups', 'Kettlebell Swings'])
      setExclusions(['Behind-the-Neck Press', 'Upright Rows (Impingement)'])
      setFunctionalDemands('Sedentary AI engineer sitting 10+ hours/day; thoracic stiffness and anterior pelvic tilt.')
      setEquipmentAccess(['barbell', 'squat rack', 'dumbbell', 'cable', 'bench', 'pull-up bar', 'bodyweight'])
      setNutritionPhilosophy('precision_nutrition_hand_portion')
      setSweatyFinisherModality('12-Minute Assault Bike Zone 2 Flush')
      setFreshNeatWalkMinutes(45)
      setFreshNeatNotes('Early morning outdoor sunshine walk for circadian entrainment.')
      setCoachGuidanceNotes('Emphasize thoracic extension, glute activation, and scapular retraction to counteract desk posture. Supersets for time efficiency.')
    } else if (presetName === 'lisa') {
      setGoal('fat_loss')
      setTargetNasmPhase(1)
      setTrainingDaysPerWeek(3)
      setExperienceLevel('beginner')
      setClientAge('52')
      setClientSex('female')
      setWorkStyle('active_standing')
      setDailyRhythm('mid_day')
      setSessionDurationMins(30)
      setSuperpowers(['Glute Bridges', 'Resistance Band Rows'])
      setExclusions(['Forward Lunges (Runner\'s Knee)', 'Jump Squats', 'Running / Jogging'])
      setFunctionalDemands('School teacher on feet all day; bilateral knee patellofemoral aching.')
      setEquipmentAccess(['dumbbell', 'band', 'stability ball', 'bodyweight'])
      setNutritionPhilosophy('precision_nutrition_hand_portion')
      setSweatyFinisherModality('8-Minute Incline Treadmill Glute Walk')
      setFreshNeatWalkMinutes(30)
      setFreshNeatNotes('Evening neighborhood stroll with dog for cortisol regulation.')
      setCoachGuidanceNotes('Knee-friendly stabilization. Zero high-impact jumping or lunging. Bias glute medius and VMO activation.')
    }
  }

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSynthesizing) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSynthesizing, onClose])

  if (!isOpen) return null

  const toggleSuperpower = (item: string) => {
    setSuperpowers(prev =>
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    )
  }

  const addCustomSuperpower = () => {
    if (newSuperpower.trim() && !superpowers.includes(newSuperpower.trim())) {
      setSuperpowers(prev => [...prev, newSuperpower.trim()])
      setNewSuperpower('')
    }
  }

  const toggleExclusion = (item: string) => {
    setExclusions(prev =>
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    )
  }

  const addCustomExclusion = () => {
    if (newExclusion.trim() && !exclusions.includes(newExclusion.trim())) {
      setExclusions(prev => [...prev, newExclusion.trim()])
      setNewExclusion('')
    }
  }

  const toggleEquipment = (id: string) => {
    setEquipmentAccess(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: CoachAiIntakeFormData = {
      clientName,
      clientAge: Number(clientAge) || undefined,
      clientSex,
      goal,
      targetNasmPhase,
      trainingDaysPerWeek,
      experienceLevel,
      equipmentAccess,
      lifestyleRhythm: {
        workStyle,
        dailyRhythm,
        sessionDurationMins,
      },
      movementSuperpowers: superpowers,
      strictExclusions: exclusions,
      functionalDemands,
      nutritionPhilosophy,
      dualCardioSplit: {
        sweatyFinisherModality,
        freshNeatWalkMinutes,
        freshNeatNotes,
      },
      coachGuidanceNotes,
    }
    await onSynthesize(payload)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intake-drawer-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100005,
        background: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={e => {
        if (e.target === e.currentTarget && !isSynthesizing) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 780,
          height: '100%',
          background: 'linear-gradient(180deg, #0B132B 0%, #060A14 100%)',
          borderLeft: '1px solid rgba(212, 160, 23, 0.4)',
          boxShadow: '-10px 0 50px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(212, 160, 23, 0.25)',
            background: 'rgba(10, 18, 35, 0.8)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--gold-lt, #F5D061)',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="target" size={13} style={{ color: 'var(--gold-lt, #F5D061)' }} />
              Coach Gordon AI Custom Periodization Studio
            </div>
            <h2
              id="intake-drawer-title"
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 22,
                color: '#FFFFFF',
                margin: '4px 0 0',
                letterSpacing: '0.03em',
              }}
            >
              Deep Personalization Intake · {clientName}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSynthesizing}
            aria-label="Close Intake Drawer"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 13,
              fontWeight: 700,
              cursor: isSynthesizing ? 'not-allowed' : 'pointer',
              opacity: isSynthesizing ? 0.5 : 1,
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Quick Presets Ribbon */}
        <div
          style={{
            padding: '10px 24px',
            background: 'rgba(212, 160, 23, 0.08)',
            borderBottom: '1px solid rgba(212, 160, 23, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            overflowX: 'auto',
          }}
        >
          <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--gold-lt, #F5D061)', fontWeight: 800, whiteSpace: 'nowrap' }}>
            Quick Athlete Presets:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('jennifer')}
            style={{
              padding: '4px 10px',
              fontSize: 11,
              borderRadius: 4,
              border: '1px solid rgba(212,160,23,0.4)',
              background: 'rgba(10,18,35,0.7)',
              color: '#FFFFFF',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            ⭐ Jennifer (Step + Burpee, Elder Care)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('scott')}
            style={{
              padding: '4px 10px',
              fontSize: 11,
              borderRadius: 4,
              border: '1px solid rgba(212,160,23,0.4)',
              background: 'rgba(10,18,35,0.7)',
              color: '#FFFFFF',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            ⚡ Scott (Sedentary AI Eng, Posture)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('lisa')}
            style={{
              padding: '4px 10px',
              fontSize: 11,
              borderRadius: 4,
              border: '1px solid rgba(212,160,23,0.4)',
              background: 'rgba(10,18,35,0.7)',
              color: '#FFFFFF',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            🛡️ Lisa (Knee Relief, Glute Medius)
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
          }}
        >
          {/* Section 1: Core Framework */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--gold-lt, #F5D061)', fontWeight: 800, letterSpacing: '0.08em' }}>
              1. NASM OPT™ Core Macrocycle Structure
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Primary Goal</label>
                <select
                  value={goal}
                  onChange={e => setGoal(e.target.value as CoachAiIntakeFormData['goal'])}
                  style={{
                    width: '100%',
                    background: '#0D1629',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    fontSize: 12,
                  }}
                >
                  <option value="fat_loss">Fat Loss & Definition</option>
                  <option value="hypertrophy">Hypertrophy & Lean Mass</option>
                  <option value="performance">Athletic Performance</option>
                  <option value="general_fitness">General Fitness</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 4 }}>NASM OPT™ Phase</label>
                <select
                  value={targetNasmPhase}
                  onChange={e => setTargetNasmPhase(Number(e.target.value))}
                  style={{
                    width: '100%',
                    background: '#0D1629',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    fontSize: 12,
                  }}
                >
                  <option value={1}>Phase 1: Stabilization Endurance (4/2/1)</option>
                  <option value={2}>Phase 2: Strength Endurance (2/0/2 superset)</option>
                  <option value={3}>Phase 3: Muscular Development (2/0/2)</option>
                  <option value={4}>Phase 4: Maximal Strength (Explosive/Rest 3m)</option>
                  <option value={5}>Phase 5: Power & PAP Contrast</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Days Per Week</label>
                <select
                  value={trainingDaysPerWeek}
                  onChange={e => setTrainingDaysPerWeek(Number(e.target.value))}
                  style={{
                    width: '100%',
                    background: '#0D1629',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    fontSize: 12,
                  }}
                >
                  <option value={2}>2 Days / Week</option>
                  <option value={3}>3 Days / Week (Optimal Balance)</option>
                  <option value={4}>4 Days / Week (Upper/Lower Split)</option>
                  <option value={5}>5 Days / Week</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={e => setExperienceLevel(e.target.value as CoachAiIntakeFormData['experienceLevel'])}
                  style={{
                    width: '100%',
                    background: '#0D1629',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    fontSize: 12,
                  }}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="elite">Elite Athlete</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Lifestyle & Rhythm */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--gold-lt, #F5D061)', fontWeight: 800, letterSpacing: '0.08em' }}>
              2. Lifestyle Rhythms & Time Budget
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Daily Work Style</label>
                <select
                  value={workStyle}
                  onChange={e => setWorkStyle(e.target.value as CoachAiIntakeFormData['lifestyleRhythm']['workStyle'])}
                  style={{
                    width: '100%',
                    background: '#0D1629',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    fontSize: 12,
                  }}
                >
                  <option value="sedentary_desk">Sedentary Desk / Screen Job</option>
                  <option value="active_standing">Active Standing / Physical</option>
                  <option value="travel_intensive">Frequent Travel / Road Warrior</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Daily Rhythm</label>
                <select
                  value={dailyRhythm}
                  onChange={e => setDailyRhythm(e.target.value as CoachAiIntakeFormData['lifestyleRhythm']['dailyRhythm'])}
                  style={{
                    width: '100%',
                    background: '#0D1629',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    fontSize: 12,
                  }}
                >
                  <option value="early_morning">Early Morning Riser (5am–7am)</option>
                  <option value="mid_day">Mid-Day / Lunch Window</option>
                  <option value="evening">Evening / After Work</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Session Target Duration</label>
                <select
                  value={sessionDurationMins}
                  onChange={e => setSessionDurationMins(Number(e.target.value))}
                  style={{
                    width: '100%',
                    background: '#0D1629',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    fontSize: 12,
                  }}
                >
                  <option value={30}>30 Minutes (High Density)</option>
                  <option value={35}>35 Minutes (Crisp Athletic Standard)</option>
                  <option value={45}>45 Minutes (Full Meso Session)</option>
                  <option value={60}>60 Minutes (Comprehensive)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Movement Superpowers */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#34D399', fontWeight: 800, letterSpacing: '0.08em' }}>
                ⭐ 3. Movement Superpowers (Inject & Celebrate)
              </div>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>Exercises the athlete thrives on</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {COMMON_SUPERPOWERS.map(item => {
                const active = superpowers.includes(item)
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleSuperpower(item)}
                    style={{
                      padding: '5px 10px',
                      fontSize: 12,
                      borderRadius: 20,
                      border: active ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.12)',
                      background: active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      color: active ? '#6EE7B7' : '#CBD5E1',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {active ? '✓' : '+'} {item}
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input
                type="text"
                value={newSuperpower}
                onChange={e => setNewSuperpower(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomSuperpower()
                  }
                }}
                placeholder="Add custom superpower (e.g. Incline Bench, Step-Ups)..."
                style={{
                  flex: 1,
                  background: '#0D1629',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 12,
                }}
              />
              <button
                type="button"
                onClick={addCustomSuperpower}
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid #10B981',
                  color: '#6EE7B7',
                  borderRadius: 6,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Section 4: Strict Exclusions */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#F87171', fontWeight: 800, letterSpacing: '0.08em' }}>
                🚫 4. Strict Exclusions (Zero Tolerance Blacklist)
              </div>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>Hated or pain-inducing movements</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {COMMON_EXCLUSIONS.map(item => {
                const active = exclusions.includes(item)
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleExclusion(item)}
                    style={{
                      padding: '5px 10px',
                      fontSize: 12,
                      borderRadius: 20,
                      border: active ? '1px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.12)',
                      background: active ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      color: active ? '#FCA5A5' : '#CBD5E1',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {active ? '✕' : '+'} {item}
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input
                type="text"
                value={newExclusion}
                onChange={e => setNewExclusion(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomExclusion()
                  }
                }}
                placeholder="Add custom exclusion (e.g. Romanian Deadlifts, Sissy Squats)..."
                style={{
                  flex: 1,
                  background: '#0D1629',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 12,
                }}
              />
              <button
                type="button"
                onClick={addCustomExclusion}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #EF4444',
                  color: '#FCA5A5',
                  borderRadius: 6,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Section 5: Real-World Demands */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--gold-lt, #F5D061)', fontWeight: 800, letterSpacing: '0.08em' }}>
              5. Real-World Functional Demands & Family Responsibilities
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>
              Physical context outside the gym (e.g., caring for elderly parents, lifting toddlers, yard work) so Coach Gordon biases posterior chain and joint integrity.
            </p>
            <textarea
              rows={2}
              value={functionalDemands}
              onChange={e => setFunctionalDemands(e.target.value)}
              placeholder="e.g. Assists elderly father on weekends with mobility transfers; requires robust hip hinge, grip, and posterior chain endurance."
              style={{
                width: '100%',
                background: '#0D1629',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 6,
                padding: '8px 10px',
                fontSize: 12,
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Section 6: Equipment & Quirks */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--gold-lt, #F5D061)', fontWeight: 800, letterSpacing: '0.08em' }}>
              6. Available Equipment & Home Quirks
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {COMMON_EQUIPMENT.map(item => {
                const active = equipmentAccess.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleEquipment(item.id)}
                    style={{
                      padding: '5px 10px',
                      fontSize: 12,
                      borderRadius: 6,
                      border: active ? '1px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.12)',
                      background: active ? 'rgba(212, 160, 23, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      color: active ? 'var(--gold-lt, #F5D061)' : '#CBD5E1',
                      cursor: 'pointer',
                    }}
                  >
                    {active ? '✓ ' : ''}{item.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 7: Nutrition Philosophy */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(212, 160, 23, 0.3)',
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--gold-lt, #F5D061)', fontWeight: 800, letterSpacing: '0.08em' }}>
                7. Nutrition Mindset & Philosophy
              </div>
              <span
                style={{
                  fontSize: 10,
                  background: 'rgba(212,160,23,0.2)',
                  color: 'var(--gold-lt)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                No Rigid Counting Required
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 6,
                  border:
                    nutritionPhilosophy === 'precision_nutrition_hand_portion'
                      ? '1px solid var(--gold)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  background:
                    nutritionPhilosophy === 'precision_nutrition_hand_portion'
                      ? 'rgba(212, 160, 23, 0.15)'
                      : 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="nutritionPhilosophy"
                  checked={nutritionPhilosophy === 'precision_nutrition_hand_portion'}
                  onChange={() => setNutritionPhilosophy('precision_nutrition_hand_portion')}
                  style={{ marginTop: 2 }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                    Precision Nutrition Hand-Portion Architecture (Recommended)
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                    Uses visual cues: Palms (Protein), Fists (Veggies), Cupped Hands (Smart Carbs), Thumbs (Healthy Fats) + Hara Hachi Bu (80% Fullness Cue). Zero rigid calorie counting.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 6,
                  border:
                    nutritionPhilosophy === 'macro_calorie_tracking'
                      ? '1px solid var(--gold)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  background:
                    nutritionPhilosophy === 'macro_calorie_tracking'
                      ? 'rgba(212, 160, 23, 0.15)'
                      : 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="nutritionPhilosophy"
                  checked={nutritionPhilosophy === 'macro_calorie_tracking'}
                  onChange={() => setNutritionPhilosophy('macro_calorie_tracking')}
                  style={{ marginTop: 2 }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                    Gram & Calorie Macro Tracking
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                    For athletes who prefer food scales, precise daily calorie surplus/deficit, and macro gram breakdowns.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 6,
                  border:
                    nutritionPhilosophy === 'intuitive_chrono'
                      ? '1px solid var(--gold)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  background:
                    nutritionPhilosophy === 'intuitive_chrono'
                      ? 'rgba(212, 160, 23, 0.15)'
                      : 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="nutritionPhilosophy"
                  checked={nutritionPhilosophy === 'intuitive_chrono'}
                  onChange={() => setNutritionPhilosophy('intuitive_chrono')}
                  style={{ marginTop: 2 }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                    Intuitive & Chrono-Nutrition
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                    Focuses on circadian meal timing, whole-food density, and hunger satiety biofeedback.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Section 8: Dual Cardio Protocol */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#38BDF8', fontWeight: 800, letterSpacing: '0.08em' }}>
              🏃 8. Dual-Cardio Protocol Architecture
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                  Sweaty In-Home Session Finisher Modality
                </label>
                <input
                  type="text"
                  value={sweatyFinisherModality}
                  onChange={e => setSweatyFinisherModality(e.target.value)}
                  placeholder="e.g. 10-Minute Reebok Step Metabolic Flush"
                  style={{
                    width: '100%',
                    background: '#0D1629',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    fontSize: 12,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                  Fresh NEAT Daily Walking Ritual (Minutes)
                </label>
                <input
                  type="number"
                  min={10}
                  max={90}
                  value={freshNeatWalkMinutes}
                  onChange={e => setFreshNeatWalkMinutes(Number(e.target.value))}
                  style={{
                    width: '100%',
                    background: '#0D1629',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    fontSize: 12,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                Fresh NEAT Walking Notes / Social Context
              </label>
              <input
                type="text"
                value={freshNeatNotes}
                onChange={e => setFreshNeatNotes(e.target.value)}
                placeholder="e.g. Dedicated morning walking ritual to visit father; clean, fresh, non-sweaty."
                style={{
                  width: '100%',
                  background: '#0D1629',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  fontSize: 12,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Section 9: Coach Gordon Guidance Notes */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--gold-lt, #F5D061)', fontWeight: 800, letterSpacing: '0.08em' }}>
              9. Coach Gordon Clinical Directives & Biomechanical Guardrails
            </div>
            <textarea
              rows={3}
              value={coachGuidanceNotes}
              onChange={e => setCoachGuidanceNotes(e.target.value)}
              placeholder="Provide clinical direction, specific cues, injury protections, or phase transitions..."
              style={{
                width: '100%',
                background: '#0D1629',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 6,
                padding: '8px 10px',
                fontSize: 12,
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Action Button Footer inside Drawer */}
          <div
            style={{
              paddingTop: 12,
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSynthesizing}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#CBD5E1',
                borderRadius: 8,
                padding: '12px 20px',
                fontSize: 13,
                fontWeight: 700,
                cursor: isSynthesizing ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSynthesizing}
              style={{
                background: isSynthesizing
                  ? 'rgba(212, 160, 23, 0.5)'
                  : 'linear-gradient(135deg, #D4A017 0%, #B8860B 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#0A0E18',
                borderRadius: 8,
                padding: '12px 28px',
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: '0.04em',
                cursor: isSynthesizing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 20px rgba(212, 160, 23, 0.35)',
              }}
            >
              {isSynthesizing ? (
                <>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 14,
                      height: 14,
                      border: '2px solid #0A0E18',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  Synthesizing Master NASM OPT™ Program...
                </>
              ) : (
                <>
                  <GaaIcon name="lightning" size={15} style={{ color: '#0A0E18' }} />
                  Synthesize with Gemini 3.8 Flash
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
