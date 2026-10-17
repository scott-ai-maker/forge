'use client'

import React, { useState, useEffect } from 'react'
import { GaaIcon } from '@/components/ui/GaaIcon'
import {
  INTAKE_CLIENT_TEMPLATES,
  INTAKE_TEMPLATE_CATEGORIES,
  getIntakeTemplateById,
  type IntakeClientTemplate,
  type TemplateCategory,
} from '@/lib/coach-intake-templates'

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
  error?: string | null
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
  error,
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

  // Template State & Selection
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<TemplateCategory | 'all'>('all')
  const [templateSearchTerm, setTemplateSearchTerm] = useState('')
  const [templateLoadedNotice, setTemplateLoadedNotice] = useState<string | null>(null)

  const activeTemplate = selectedTemplateId ? getIntakeTemplateById(selectedTemplateId) : null

  // Apply an Archetype Template
  const applyTemplate = (template: IntakeClientTemplate) => {
    setSelectedTemplateId(template.id)
    const { formData } = template

    setGoal(formData.goal)
    setTargetNasmPhase(formData.targetNasmPhase)
    setTrainingDaysPerWeek(formData.trainingDaysPerWeek)
    setExperienceLevel(formData.experienceLevel)

    // Only set suggested age & sex for template/sandbox clients to preserve existing athlete demographics
    const isSandboxProfile = !clientName || /^(new|template|athlete)$/i.test(clientName.trim())
    if (isSandboxProfile) {
      if (formData.suggestedAge) setClientAge(String(formData.suggestedAge))
      if (formData.suggestedSex) setClientSex(formData.suggestedSex)
    }

    setWorkStyle(formData.lifestyleRhythm.workStyle)
    setDailyRhythm(formData.lifestyleRhythm.dailyRhythm)
    setSessionDurationMins(formData.lifestyleRhythm.sessionDurationMins)

    setSuperpowers([...formData.movementSuperpowers])
    setExclusions([...formData.strictExclusions])
    setFunctionalDemands(formData.functionalDemands)
    setEquipmentAccess([...formData.equipmentAccess])
    setNutritionPhilosophy(formData.nutritionPhilosophy)

    setSweatyFinisherModality(formData.dualCardioSplit.sweatyFinisherModality)
    setFreshNeatWalkMinutes(formData.dualCardioSplit.freshNeatWalkMinutes)
    setFreshNeatNotes(formData.dualCardioSplit.freshNeatNotes || '')

    setCoachGuidanceNotes(formData.coachGuidanceNotes)
    setTemplateLoadedNotice(`Loaded archetype: ${template.name} (${template.phaseName} · ${formData.trainingDaysPerWeek}d/wk)`)
    setIsTemplateModalOpen(false)
  }

  // Backward compatibility with legacy quick presets
  const applyPreset = (presetName: 'jennifer' | 'scott' | 'lisa') => {
    const idMap: Record<string, string> = {
      jennifer: 'caregiver_physical_support',
      scott: 'executive_desk_reversal',
      lisa: 'knee_rehab_patellofemoral',
    }
    const template = getIntakeTemplateById(idMap[presetName])
    if (template) {
      applyTemplate(template)
    }
  }

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isTemplateModalOpen) {
          setIsTemplateModalOpen(false)
        } else if (isOpen && !isSynthesizing) {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSynthesizing, isTemplateModalOpen, onClose])

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  if (!isOpen) return null

  const draftFirstName = clientName.trim().split(/\s+/)[0] ?? ''
  const draftTarget = !draftFirstName || /^(new|template|athlete)$/i.test(draftFirstName)
    ? 'the program'
    : `${draftFirstName}'s program`

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
      className="coach-intake-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100005,
        background: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={e => {
        if (e.target === e.currentTarget && !isSynthesizing) onClose()
      }}
    >
      <style>{`
        .coach-intake-overlay { padding: clamp(12px, 3vw, 32px); }
        .coach-intake-panel {
          width: 100%;
          max-width: 920px;
          max-height: min(92vh, 1100px);
          border: 1px solid rgba(212, 160, 23, 0.4);
          border-radius: 14px;
        }
        @media (max-width: 640px) {
          .coach-intake-overlay { padding: 0; }
          .coach-intake-panel { max-width: none; height: 100dvh; max-height: none; border: 0; border-radius: 0; }
        }
      `}</style>
      <div
        className="coach-intake-panel"
        style={{
          background: 'linear-gradient(180deg, #0B132B 0%, #060A14 100%)',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.8)',
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

        {/* Client Archetype Templates Header & Shelf */}
        <div
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(180deg, rgba(212, 160, 23, 0.12) 0%, rgba(10, 18, 35, 0.8) 100%)',
            borderBottom: '1px solid rgba(212, 160, 23, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--gold-lt, #F5D061)', fontWeight: 800, letterSpacing: '0.05em' }}>
                📋 Client Archetype Templates
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: 'rgba(212, 160, 23, 0.2)',
                  color: '#FDE68A',
                  padding: '2px 8px',
                  borderRadius: 10,
                  border: '1px solid rgba(212, 160, 23, 0.35)',
                }}
              >
                11 Pre-Calibrated Profiles
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsTemplateModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, rgba(212,160,23,0.2) 0%, rgba(184,134,11,0.1) 100%)',
                border: '1px solid rgba(212, 160, 23, 0.4)',
                borderRadius: 6,
                padding: '5px 12px',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--gold-lt, #F5D061)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <GaaIcon name="search" size={12} style={{ color: 'var(--gold-lt, #F5D061)' }} />
              Browse All 11 Archetypes ↗
            </button>
          </div>

          {/* Quick Scrollable Template Chips */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 4,
              scrollbarWidth: 'thin',
            }}
          >
            {INTAKE_CLIENT_TEMPLATES.map(template => {
              const isSelected = selectedTemplateId === template.id
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  title={`${template.name} — ${template.tagline}`}
                  style={{
                    padding: '6px 12px',
                    fontSize: 11,
                    borderRadius: 6,
                    border: isSelected
                      ? '1px solid #D4A017'
                      : '1px solid rgba(255, 255, 255, 0.12)',
                    background: isSelected
                      ? 'rgba(212, 160, 23, 0.25)'
                      : 'rgba(10, 18, 35, 0.85)',
                    color: isSelected ? '#FFFFFF' : '#CBD5E1',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: isSelected ? '0 0 12px rgba(212, 160, 23, 0.3)' : 'none',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 13 }}>
                    {template.id === 'executive_desk_reversal' && '💼'}
                    {template.id === 'active_aging_longevity' && '🧘'}
                    {template.id === 'busy_parent_durability' && '👶'}
                    {template.id === 'metabolic_reboot_beginner' && '☀️'}
                    {template.id === 'physique_hypertrophy_pro' && '🏋️'}
                    {template.id === 'rotational_power_athlete' && '⚡'}
                    {template.id === 'endurance_runner_shield' && '🏃'}
                    {template.id === 'minimalist_travel_hotel' && '✈️'}
                    {template.id === 'caregiver_physical_support' && '❤️'}
                    {template.id === 'maximal_strength_neural' && '🔥'}
                    {template.id === 'knee_rehab_patellofemoral' && '🛡️'}
                  </span>
                  <span style={{ fontWeight: isSelected ? 800 : 600 }}>{template.shortLabel}</span>
                  <span
                    style={{
                      fontSize: 9,
                      padding: '1px 5px',
                      borderRadius: 4,
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: isSelected ? '#FDE68A' : '#94A3B8',
                    }}
                  >
                    Phase {template.nasmOptPhase}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Active Template Notice Banner */}
          {templateLoadedNotice && (
            <div
              style={{
                background: 'rgba(212, 160, 23, 0.12)',
                border: '1px solid rgba(212, 160, 23, 0.3)',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 11,
                color: '#FDE68A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <GaaIcon name="shield-check" size={13} style={{ color: '#D4A017' }} />
                <span>{templateLoadedNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTemplateId(null)
                  setTemplateLoadedNotice(null)
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#CBD5E1',
                  fontSize: 10,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '2px 4px',
                }}
              >
                Dismiss
              </button>
            </div>
          )}
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

          {/* Active Synthesis Progress Feedback */}
          {isSynthesizing && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(212,160,23,0.15) 0%, rgba(184,134,11,0.08) 100%)',
                border: '1px solid rgba(212,160,23,0.4)',
                borderRadius: 8,
                padding: '12px 16px',
                color: '#FDE68A',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginTop: 12,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 16,
                  height: 16,
                  border: '2px solid #D4A017',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  flexShrink: 0,
                }}
              />
              <div>
                <strong>Forge Athletic AI Architect</strong> is structuring your 4-week NASM OPT™ program, verifying official movement CDN links, and applying orthopedic safeguards...
              </div>
            </div>
          )}

          {/* Inline Synthesis Error Banner */}
          {error && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(185,28,28,0.1) 100%)',
                border: '1px solid #EF4444',
                borderRadius: 8,
                padding: '12px 16px',
                color: '#FCA5A5',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginTop: 12,
                marginBottom: 4,
              }}
            >
              <GaaIcon name="alert-triangle" size={18} style={{ color: '#EF4444', flexShrink: 0 }} />
              <div>
                <strong>Synthesis Error:</strong> {error}
              </div>
            </div>
          )}

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
                  Drafting {draftTarget}…
                </>
              ) : (
                <>
                  <GaaIcon name="lightning" size={15} style={{ color: '#0A0E18' }} />
                  Draft {draftTarget} with AI
                </>
              )}
            </button>
          </div>
        </form>

        {/* Full Template Explorer Modal */}
        {isTemplateModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-modal-title"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100015,
              background: 'rgba(3, 7, 18, 0.9)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={e => {
              if (e.target === e.currentTarget) setIsTemplateModalOpen(false)
            }}
          >
            <div
              style={{
                background: '#0B132B',
                border: '1px solid rgba(212, 160, 23, 0.35)',
                borderRadius: 14,
                width: '100%',
                maxWidth: 1040,
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 70px rgba(0, 0, 0, 0.8), 0 0 50px rgba(212, 160, 23, 0.2)',
                overflow: 'hidden',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(15, 23, 42, 0.7)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h2
                      id="template-modal-title"
                      style={{
                        margin: 0,
                        fontSize: 20,
                        fontWeight: 800,
                        color: '#FFFFFF',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      Client Intake Archetypes
                    </h2>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: 'rgba(212, 160, 23, 0.2)',
                        color: 'var(--gold-lt, #F5D061)',
                        padding: '3px 10px',
                        borderRadius: 12,
                        border: '1px solid rgba(212, 160, 23, 0.4)',
                      }}
                    >
                      11 Clinical & Lifestyle Profiles
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#94A3B8' }}>
                    Select a pre-calibrated client archetype to auto-populate goals, acute OPT variables, safeguards, and nutrition.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#CBD5E1',
                    borderRadius: 8,
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ✕ Close
                </button>
              </div>

              {/* Search & Category Filter Bar */}
              <div
                style={{
                  padding: '16px 24px',
                  background: 'rgba(10, 18, 35, 0.6)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {/* Search Input */}
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={templateSearchTerm}
                    onChange={e => setTemplateSearchTerm(e.target.value)}
                    placeholder="Search templates by goal, sport, injury, equipment (e.g. knee, golf, desk, runner, hotel)..."
                    style={{
                      width: '100%',
                      background: '#070D1E',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: 8,
                      padding: '10px 16px 10px 38px',
                      fontSize: 13,
                      color: '#FFFFFF',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  <div style={{ position: 'absolute', left: 14, top: 12, pointerEvents: 'none' }}>
                    <GaaIcon name="search" size={15} style={{ color: '#64748B' }} />
                  </div>
                  {templateSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setTemplateSearchTerm('')}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: 10,
                        background: 'transparent',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Category Filter Chips */}
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    overflowX: 'auto',
                    paddingBottom: 2,
                    scrollbarWidth: 'thin',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveCategoryFilter('all')}
                    style={{
                      padding: '5px 12px',
                      fontSize: 11,
                      borderRadius: 6,
                      border: activeCategoryFilter === 'all'
                        ? '1px solid #D4A017'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      background: activeCategoryFilter === 'all'
                        ? 'rgba(212, 160, 23, 0.25)'
                        : 'rgba(255, 255, 255, 0.04)',
                      color: activeCategoryFilter === 'all' ? '#FFFFFF' : '#94A3B8',
                      fontWeight: activeCategoryFilter === 'all' ? 800 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    All Archetypes ({INTAKE_CLIENT_TEMPLATES.length})
                  </button>

                  {INTAKE_TEMPLATE_CATEGORIES.map(cat => {
                    const count = INTAKE_CLIENT_TEMPLATES.filter(t => t.category === cat.id).length
                    const isActive = activeCategoryFilter === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategoryFilter(cat.id)}
                        style={{
                          padding: '5px 12px',
                          fontSize: 11,
                          borderRadius: 6,
                          border: isActive
                            ? '1px solid #D4A017'
                            : '1px solid rgba(255, 255, 255, 0.1)',
                          background: isActive
                            ? 'rgba(212, 160, 23, 0.25)'
                            : 'rgba(255, 255, 255, 0.04)',
                          color: isActive ? '#FFFFFF' : '#94A3B8',
                          fontWeight: isActive ? 800 : 500,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {cat.label} ({count})
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Templates Grid Content */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px 24px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
                  gap: 16,
                  alignContent: 'start',
                }}
              >
                {(() => {
                  const filtered = INTAKE_CLIENT_TEMPLATES.filter(t => {
                    const matchesCategory = activeCategoryFilter === 'all' || t.category === activeCategoryFilter
                    if (!matchesCategory) return false

                    if (!templateSearchTerm.trim()) return true
                    const q = templateSearchTerm.toLowerCase().trim()
                    return (
                      t.name.toLowerCase().includes(q) ||
                      t.tagline.toLowerCase().includes(q) ||
                      t.description.toLowerCase().includes(q) ||
                      t.targetAudience.toLowerCase().includes(q) ||
                      t.equipmentSummary.toLowerCase().includes(q) ||
                      t.formData.strictExclusions.some(e => e.toLowerCase().includes(q)) ||
                      t.formData.movementSuperpowers.some(s => s.toLowerCase().includes(q))
                    )
                  })

                  if (filtered.length === 0) {
                    return (
                      <div
                        style={{
                          gridColumn: '1 / -1',
                          padding: '40px 20px',
                          textAlign: 'center',
                          color: '#94A3B8',
                        }}
                      >
                        <GaaIcon name="search" size={28} style={{ color: '#475569', marginBottom: 12 }} />
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#E2E8F0' }}>No matching archetypes found</div>
                        <p style={{ fontSize: 13, marginTop: 4 }}>
                          Try clearing your search query or selecting a different category filter.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setTemplateSearchTerm('')
                            setActiveCategoryFilter('all')
                          }}
                          style={{
                            marginTop: 12,
                            padding: '8px 16px',
                            borderRadius: 6,
                            background: 'rgba(212, 160, 23, 0.2)',
                            border: '1px solid rgba(212, 160, 23, 0.4)',
                            color: '#FDE68A',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Reset Filters
                        </button>
                      </div>
                    )
                  }

                  return filtered.map(t => {
                    const isSelected = selectedTemplateId === t.id
                    return (
                      <div
                        key={t.id}
                        style={{
                          background: isSelected
                            ? 'linear-gradient(135deg, rgba(212, 160, 23, 0.18) 0%, rgba(15, 23, 42, 0.95) 100%)'
                            : 'rgba(15, 23, 42, 0.75)',
                          border: isSelected
                            ? '1.5px solid #D4A017'
                            : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 10,
                          padding: '16px 18px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: 14,
                          boxShadow: isSelected
                            ? '0 8px 24px rgba(212, 160, 23, 0.25)'
                            : '0 4px 12px rgba(0, 0, 0, 0.2)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {/* Top Badges */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                color: 'var(--gold-lt, #F5D061)',
                                letterSpacing: '0.04em',
                              }}
                            >
                              {t.phaseName}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                background: 'rgba(212, 160, 23, 0.2)',
                                color: '#FDE68A',
                                padding: '2px 8px',
                                borderRadius: 10,
                                border: '1px solid rgba(212, 160, 23, 0.35)',
                              }}
                            >
                              {t.badge}
                            </span>
                          </div>

                          {/* Template Name & Tagline */}
                          <div>
                            <h3
                              style={{
                                margin: 0,
                                fontSize: 15,
                                fontWeight: 800,
                                color: '#FFFFFF',
                                lineHeight: 1.3,
                              }}
                            >
                              {t.name}
                            </h3>
                            <p
                              style={{
                                margin: '6px 0 0 0',
                                fontSize: 12,
                                color: '#94A3B8',
                                lineHeight: 1.45,
                              }}
                            >
                              {t.tagline}
                            </p>
                          </div>

                          {/* Pills Meta */}
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: '#E2E8F0',
                                padding: '2px 7px',
                                borderRadius: 4,
                              }}
                            >
                              Level: {t.fitnessLevel.toUpperCase()}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: '#E2E8F0',
                                padding: '2px 7px',
                                borderRadius: 4,
                              }}
                            >
                              {t.trainingDaysPerWeek} Days/Wk
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: '#E2E8F0',
                                padding: '2px 7px',
                                borderRadius: 4,
                              }}
                            >
                              {t.estimatedDurationMins} Mins/Session
                            </span>
                          </div>

                          {/* Target Audience & Equipment */}
                          <div style={{ fontSize: 11, color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div>
                              <strong style={{ color: '#F1F5F9' }}>Ideal For:</strong> {t.targetAudience}
                            </div>
                            <div>
                              <strong style={{ color: '#F1F5F9' }}>Equipment:</strong> {t.equipmentSummary}
                            </div>
                          </div>

                          {/* Movement Superpowers & Exclusions Preview */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                              <span style={{ color: '#34D399', fontWeight: 700 }}>★ Included:</span>
                              {t.formData.movementSuperpowers.slice(0, 3).map(sp => (
                                <span
                                  key={sp}
                                  style={{
                                    fontSize: 10,
                                    background: 'rgba(52, 211, 153, 0.12)',
                                    color: '#A7F3D0',
                                    padding: '1px 6px',
                                    borderRadius: 3,
                                  }}
                                >
                                  {sp}
                                </span>
                              ))}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                              <span style={{ color: '#F87171', fontWeight: 700 }}>✕ Banished:</span>
                              {t.formData.strictExclusions.slice(0, 2).map(ex => (
                                <span
                                  key={ex}
                                  style={{
                                    fontSize: 10,
                                    background: 'rgba(248, 113, 113, 0.12)',
                                    color: '#FECACA',
                                    padding: '1px 6px',
                                    borderRadius: 3,
                                  }}
                                >
                                  {ex}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* CTA Button */}
                        <button
                          type="button"
                          onClick={() => applyTemplate(t)}
                          style={{
                            marginTop: 6,
                            width: '100%',
                            padding: '10px 16px',
                            borderRadius: 6,
                            background: isSelected
                              ? 'linear-gradient(135deg, #D4A017 0%, #B8860B 100%)'
                              : 'linear-gradient(135deg, rgba(212, 160, 23, 0.25) 0%, rgba(184, 134, 11, 0.15) 100%)',
                            border: '1px solid rgba(212, 160, 23, 0.4)',
                            color: isSelected ? '#0A0E18' : 'var(--gold-lt, #F5D061)',
                            fontSize: 12,
                            fontWeight: 800,
                            letterSpacing: '0.03em',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            boxShadow: isSelected ? '0 4px 15px rgba(212, 160, 23, 0.4)' : 'none',
                          }}
                        >
                          {isSelected ? (
                            <>✓ Active Archetype Selected</>
                          ) : (
                            <>
                              <GaaIcon name="lightning" size={13} style={{ color: isSelected ? '#0A0E18' : 'var(--gold-lt, #F5D061)' }} />
                              Apply This Archetype
                            </>
                          )}
                        </button>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

