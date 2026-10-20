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
  sessionDurationMins: number
  equipmentAccess: string[]
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

const COMMON_EQUIPMENT = [
  { id: 'dumbbell', label: 'Dumbbells' },
  { id: 'band', label: 'Resistance Bands' },
  { id: 'stability ball', label: 'Stability Ball' },
  { id: 'kettlebell', label: 'Kettlebells' },
  { id: 'barbell', label: 'Barbell & Rack' },
  { id: 'cable', label: 'Cable Machine' },
  { id: 'pull-up bar', label: 'Pull-Up Bar' },
  { id: 'treadmill', label: 'Treadmill' },
  { id: 'foam roller', label: 'Foam Roller' },
  { id: 'bodyweight', label: 'Bodyweight Only' },
]

const NASM_PHASE_DESCRIPTIONS: Record<number, { title: string; subtitle: string; focus: string }> = {
  1: {
    title: 'Phase 1: Stabilization Endurance',
    subtitle: 'Neuromuscular Efficiency & Core Stability',
    focus: 'High reps (12-20), 4/2/1 controlled tempo, low-to-moderate loads, proprioceptive challenge.',
  },
  2: {
    title: 'Phase 2: Strength Endurance',
    subtitle: 'Contrast Supersets & Metabolic Density',
    focus: 'Superset pairing stable strength (2/0/2, 8-12 reps) with stabilization balance (4/2/1, 8-12 reps).',
  },
  3: {
    title: 'Phase 3: Muscular Development',
    subtitle: 'Hypertrophy & Mechanical Tension',
    focus: 'Moderate reps (6-12), 2/0/2 tempo, 75-85% 1RM, volume accumulation across MEV/MAV landmarks.',
  },
  4: {
    title: 'Phase 4: Maximal Strength',
    subtitle: 'High Motor-Unit Recruitment',
    focus: 'Low reps (1-5), heavy loads (85-100% 1RM), 1/1/1 or 2/0/2 tempo, 2-4 min rest.',
  },
  5: {
    title: 'Phase 5: Power',
    subtitle: 'Post-Activation Potentiation (PAP)',
    focus: 'Heavy strength anchor superset immediately with explosive lightweight movement (X/0/X tempo).',
  },
}

export default function CoachAiIntakeDrawer({
  isOpen,
  onClose,
  initialData,
  clientName,
  onSynthesize,
  isSynthesizing,
  error,
}: CoachAiIntakeDrawerProps) {
  const clientFirstName = clientName.trim().split(/\s+/)[0] || clientName

  // Form State
  const [goal, setGoal] = useState<'fat_loss' | 'hypertrophy' | 'performance' | 'general_fitness'>(
    initialData?.goal || 'fat_loss'
  )
  const [targetNasmPhase, setTargetNasmPhase] = useState<number>(initialData?.targetNasmPhase || 1)
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState<number>(initialData?.trainingDaysPerWeek || 3)
  const [sessionDurationMins, setSessionDurationMins] = useState<number>(initialData?.sessionDurationMins || 45)
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'elite'>(
    initialData?.experienceLevel || 'intermediate'
  )
  const [clientAge, setClientAge] = useState<string>(
    initialData?.clientAge ? String(initialData.clientAge) : '35'
  )
  const [clientSex, setClientSex] = useState<'male' | 'female'>(initialData?.clientSex || 'female')
  const [equipmentAccess, setEquipmentAccess] = useState<string[]>(
    initialData?.equipmentAccess || ['dumbbell', 'band', 'stability ball', 'bodyweight']
  )
  const [coachGuidanceNotes, setCoachGuidanceNotes] = useState<string>(
    initialData?.coachGuidanceNotes || ''
  )

  // Sync when initialData changes or drawer opens
  useEffect(() => {
    if (isOpen) {
      if (initialData?.goal) setGoal(initialData.goal)
      if (initialData?.targetNasmPhase) setTargetNasmPhase(initialData.targetNasmPhase)
      if (initialData?.trainingDaysPerWeek) setTrainingDaysPerWeek(initialData.trainingDaysPerWeek)
      if (initialData?.sessionDurationMins) setSessionDurationMins(initialData.sessionDurationMins)
      if (initialData?.experienceLevel) setExperienceLevel(initialData.experienceLevel)
      if (initialData?.clientAge) setClientAge(String(initialData.clientAge))
      if (initialData?.clientSex) setClientSex(initialData.clientSex)
      if (initialData?.equipmentAccess) setEquipmentAccess(initialData.equipmentAccess)
      if (initialData?.coachGuidanceNotes !== undefined) setCoachGuidanceNotes(initialData.coachGuidanceNotes)
    }
  }, [isOpen, initialData])

  // Escape key listener to close modal
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSynthesizing) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, isSynthesizing, onClose])

  const toggleEquipment = (id: string) => {
    setEquipmentAccess(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ageNum = parseInt(clientAge, 10)
    const formData: CoachAiIntakeFormData = {
      clientName,
      clientAge: isNaN(ageNum) ? undefined : ageNum,
      clientSex,
      goal,
      targetNasmPhase,
      trainingDaysPerWeek,
      sessionDurationMins,
      experienceLevel,
      equipmentAccess: equipmentAccess.length > 0 ? equipmentAccess : ['bodyweight'],
      coachGuidanceNotes: coachGuidanceNotes.trim(),
    }
    await onSynthesize(formData)
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`NASM OPT Program Intake · ${clientName}`}
      className="coach-intake-overlay fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(10px)',
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

      <aside
        className="coach-intake-panel relative w-full h-full overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #0B132B 0%, #060A14 100%)',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.8)',
          boxSizing: 'border-box',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <header
          className="px-6 py-5 flex items-center justify-between border-b"
          style={{
            background: 'rgba(10, 18, 35, 0.8)',
            borderColor: 'rgba(212, 160, 23, 0.25)',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                color: 'var(--gold-lt, #F5D061)',
                fontWeight: 800,
                letterSpacing: '0.08em',
              }}
            >
              Coach Gordon AI Custom Periodization Studio
            </div>
            <h2
              id="intake-drawer-title"
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 22,
                color: '#FFFFFF',
                margin: '4px 0 0',
              }}
            >
              NASM OPT™ Periodization Intake · {clientName}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSynthesizing}
            aria-label="Close intake dialog"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 700,
              cursor: isSynthesizing ? 'not-allowed' : 'pointer',
            }}
          >
            ✕ Close
          </button>
        </header>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {error && (
            <div
              className="p-3.5 rounded-lg flex items-start gap-3"
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#FCA5A5',
                fontSize: 13,
              }}
            >
              <GaaIcon name="alert-triangle" size={16} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
              <div>{error}</div>
            </div>
          )}

          {/* Section 1: Client Demographics */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              1. Athlete Profile & Demographics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  min="14"
                  max="95"
                  value={clientAge}
                  onChange={e => setClientAge(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:border-amber-400 outline-none"
                  placeholder="35"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Biological Sex
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setClientSex('female')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition ${
                      clientSex === 'female'
                        ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Female
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientSex('male')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition ${
                      clientSex === 'male'
                        ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Male
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Primary Goal */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              2. Primary Goal
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'fat_loss', label: 'Fat Loss & Definition', icon: '🔥' },
                { id: 'hypertrophy', label: 'Hypertrophy & Muscle Growth', icon: '💪' },
                { id: 'performance', label: 'Athletic Performance & Power', icon: '⚡' },
                { id: 'general_fitness', label: 'Longevity & General Fitness', icon: '🎯' },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGoal(item.id as typeof goal)}
                  className={`p-3 rounded-lg border text-left transition flex items-center gap-2.5 ${
                    goal === item.id
                      ? 'bg-amber-400/15 border-amber-400 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="text-xs font-semibold">{item.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Section 3: NASM OPT Phase */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                3. NASM OPT™ Target Phase
              </h3>
              <span className="text-xs text-amber-300 font-semibold">
                Phase {targetNasmPhase}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map(phase => (
                <button
                  key={phase}
                  type="button"
                  onClick={() => setTargetNasmPhase(phase)}
                  className={`py-2 px-1 text-center rounded-lg border font-bold text-xs transition ${
                    targetNasmPhase === phase
                      ? 'bg-amber-400 text-slate-950 border-amber-400 shadow'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  Phase {phase}
                </button>
              ))}
            </div>

            {NASM_PHASE_DESCRIPTIONS[targetNasmPhase] && (
              <div
                className="p-3.5 rounded-lg border"
                style={{
                  background: 'rgba(212, 160, 23, 0.08)',
                  borderColor: 'rgba(212, 160, 23, 0.3)',
                }}
              >
                <div className="text-xs font-bold text-amber-300">
                  {NASM_PHASE_DESCRIPTIONS[targetNasmPhase].title}
                </div>
                <div className="text-xs text-slate-300 font-medium mt-0.5">
                  {NASM_PHASE_DESCRIPTIONS[targetNasmPhase].subtitle}
                </div>
                <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {NASM_PHASE_DESCRIPTIONS[targetNasmPhase].focus}
                </div>
              </div>
            )}
          </section>

          {/* Section 4: Frequency, Duration & Experience */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              4. Volume & Schedule
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Days / Week
                </label>
                <select
                  value={trainingDaysPerWeek}
                  onChange={e => setTrainingDaysPerWeek(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-amber-400 outline-none"
                >
                  <option value={2}>2 Days / Week</option>
                  <option value={3}>3 Days / Week</option>
                  <option value={4}>4 Days / Week</option>
                  <option value={5}>5 Days / Week</option>
                  <option value={6}>6 Days / Week</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Session Length
                </label>
                <select
                  value={sessionDurationMins}
                  onChange={e => setSessionDurationMins(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-amber-400 outline-none"
                >
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={e => setExperienceLevel(e.target.value as typeof experienceLevel)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-amber-400 outline-none"
                >
                  <option value="beginner">Beginner (&lt; 1 yr)</option>
                  <option value="intermediate">Intermediate (1-3 yrs)</option>
                  <option value="advanced">Advanced (3+ yrs)</option>
                  <option value="elite">Elite Athlete</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 5: Equipment Access */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                5. Equipment Available
              </h3>
              <span className="text-xs text-slate-400">
                {equipmentAccess.length} selected
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMMON_EQUIPMENT.map(eq => {
                const isSelected = equipmentAccess.includes(eq.id)
                return (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => toggleEquipment(eq.id)}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition text-left flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-400/15 border-amber-400 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{eq.label}</span>
                    <span className="text-xs">{isSelected ? '✓' : '+'}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Section 6: Coach Guidance Notes */}
          <section className="space-y-2">
            <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              6. Coach Guidance & Clinical Directives
            </h3>
            <textarea
              rows={3}
              value={coachGuidanceNotes}
              onChange={e => setCoachGuidanceNotes(e.target.value)}
              placeholder="e.g. Focus on glute medius activation, prioritize overhead shoulder safety, keep rest intervals strictly under 60 seconds."
              className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs leading-relaxed focus:border-amber-400 outline-none resize-none placeholder:text-slate-500"
            />
          </section>

          {/* Actions Footer */}
          <div
            className="sticky bottom-0 z-10 pt-4 pb-2 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent flex items-center justify-end gap-3 border-t border-slate-800"
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSynthesizing}
              className="py-3 px-5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 font-semibold text-xs hover:bg-slate-800 transition disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSynthesizing}
              className="py-3 px-6 rounded-lg font-bold text-xs uppercase tracking-wider text-slate-950 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #F5D061 0%, #D4A017 100%)',
              }}
            >
              {isSynthesizing ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Drafting {clientFirstName}&apos;s program...
                </>
              ) : (
                <>
                  <GaaIcon name="lightning" size={14} style={{ color: '#0A0E18' }} />
                  Draft {clientFirstName}&apos;s program with AI
                </>
              )}
            </button>
          </div>
        </form>
      </aside>
    </div>
  )
}
