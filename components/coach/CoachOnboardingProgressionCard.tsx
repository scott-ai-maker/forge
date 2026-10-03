'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  type ClientProgressionProfile,
  type ProgressionStageDetail,
  type StageState,
  type CoachGateStatus,
  type CoachAuthorizationGate,
  parseParqAnswers,
} from '@/lib/coach-onboarding-progression'
import { type CoachClientTab } from '@/lib/validation'

export interface RawClientData {
  id: string
  full_name?: string | null
  email?: string | null
  phone?: string | null
  created_at?: string | null
  designated_coach_id?: string | null
  status?: string | null
}

export interface RawIntakeData {
  parq_answers?: unknown
  parq_any_yes?: boolean
  medical_conditions?: string | null
  surgeries_or_injuries?: string | null
  medications?: string | null
  allergies?: string | null
  emergency_contact_phone?: string | null
  primary_physician_phone?: string | null
  consent_signature_name?: string | null
  consent_signed_at?: string | null
}

export interface RawProfileData {
  age?: number | null
  sex?: string | null
  height_cm?: number | null
  weight_kg?: number | null
  waist_cm?: number | null
  neck_cm?: number | null
  hip_cm?: number | null
  fitness_goal?: string | null
  equipment_access?: string[] | null
  cardio_equipment_access?: string[] | null
  training_days_per_week?: number | null
  preferred_training_days?: string[] | null
  preferred_units?: string | null
  injuries_limitations?: string | null
  onboarding_completed_at?: string | null
}

export interface CoachOnboardingProgressionCardProps {
  profile: ClientProgressionProfile
  activeTab?: CoachClientTab
  rawClient?: RawClientData | null
  rawIntake?: RawIntakeData | null
  rawProfile?: RawProfileData | null
  rawAssessment?: any
  rawPlan?: any
  rawSessions?: any[]
  rawPackages?: any[]
  rawBodyComposition?: any
}

const STATE_COLORS: Record<StageState, { border: string; bg: string; text: string; badgeBg: string }> = {
  completed: {
    border: '#10B981',
    bg: 'rgba(16, 185, 129, 0.14)',
    text: '#34D399',
    badgeBg: 'rgba(16, 185, 129, 0.22)',
  },
  in_progress: {
    border: 'var(--gold)',
    bg: 'rgba(212, 160, 23, 0.16)',
    text: 'var(--gold-lt)',
    badgeBg: 'rgba(212, 160, 23, 0.24)',
  },
  blocked: {
    border: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.18)',
    text: '#F87171',
    badgeBg: 'rgba(239, 68, 68, 0.28)',
  },
  pending: {
    border: 'rgba(148, 163, 184, 0.25)',
    bg: 'rgba(148, 163, 184, 0.05)',
    text: '#94A3B8',
    badgeBg: 'rgba(148, 163, 184, 0.12)',
  },
}

const GATE_BADGES: Record<CoachGateStatus, { label: string; bg: string; border: string; text: string; icon: string }> = {
  authorized: {
    label: 'Authorized ✓',
    bg: 'rgba(16, 185, 129, 0.2)',
    border: '#10B981',
    text: '#34D399',
    icon: 'check',
  },
  awaiting_authorization: {
    label: 'Ready to Auth ⚡',
    bg: 'rgba(212, 160, 23, 0.25)',
    border: 'var(--gold)',
    text: 'var(--gold-lt)',
    icon: 'target',
  },
  locked: {
    label: 'Locked 🔒',
    bg: 'rgba(148, 163, 184, 0.1)',
    border: 'rgba(148, 163, 184, 0.3)',
    text: '#94A3B8',
    icon: 'lock',
  },
  blocked: {
    label: 'Clearance Req ⚠️',
    bg: 'rgba(239, 68, 68, 0.25)',
    border: '#EF4444',
    text: '#F87171',
    icon: 'alert-triangle',
  },
}

function formatCmToFtIn(cm?: number | null) {
  if (!cm) return '—'
  const totalInches = Math.round(cm / 2.54)
  const ft = Math.floor(totalInches / 12)
  const inches = totalInches % 12
  return `${ft}'${inches}"`
}

function formatKgToLbs(kg?: number | null) {
  if (!kg) return '—'
  return `${Math.round(kg * 2.20462)} lbs`
}

export function formatCheckpointLabel(checkpoint?: string | null): string {
  if (!checkpoint || typeof checkpoint !== 'string') return ''
  const map: Record<string, string> = {
    feet_ankles: 'Feet & Ankles',
    feet: 'Feet & Ankles',
    knees: 'Knees',
    lphc: 'LPHC',
    lumbar_pelvic_hip: 'LPHC',
    lumbar_spine: 'Lumbar Spine',
    thoracic_spine: 'Thoracic Spine',
    shoulders: 'Shoulders',
    head_neck: 'Head & Neck',
    head_cervical: 'Head & Neck',
    cervical: 'Head & Neck',
  }
  const clean = checkpoint.toLowerCase().trim()
  if (map[clean]) return map[clean]
  return clean.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function formatSyndromeLabel(syndrome?: string | null): string {
  if (!syndrome || typeof syndrome !== 'string') return ''
  const map: Record<string, string> = {
    pronation_distortion: 'Pronation Distortion',
    lower_crossed: 'Lower Crossed Syndrome',
    upper_crossed: 'Upper Crossed Syndrome',
    mixed_distortion: 'Mixed Distortion',
    optimal_alignment: 'Optimal Alignment',
  }
  const clean = syndrome.toLowerCase().trim()
  if (map[clean]) return map[clean]
  return clean.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function formatStaticPostureFinding(finding: unknown): string {
  if (finding == null) return ''
  if (typeof finding === 'string') {
    const trimmed = finding.trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        return formatStaticPostureFinding(parsed)
      } catch {
        // Continue with trimmed string
      }
    }
    return trimmed.replace(/_/g, ' ')
  }

  if (typeof finding === 'object') {
    const f = finding as Record<string, any>

    // 1. Observation + checkpoint pairing
    const observation = typeof f.observation === 'string' ? f.observation.trim() : ''
    const checkpoint = typeof f.checkpoint === 'string' ? formatCheckpointLabel(f.checkpoint) : ''

    if (observation && checkpoint) {
      if (observation.toLowerCase().startsWith(checkpoint.toLowerCase())) {
        return observation
      }
      return `${checkpoint}: ${observation}`
    }

    if (observation) return observation

    // 2. Explicit finding, compensation, label, name, title
    if (typeof f.finding === 'string' && f.finding.trim()) return f.finding.trim().replace(/_/g, ' ')
    if (typeof f.compensation === 'string' && f.compensation.trim()) return f.compensation.trim().replace(/_/g, ' ')
    if (typeof f.label === 'string' && f.label.trim()) return f.label.trim().replace(/_/g, ' ')
    if (typeof f.name === 'string' && f.name.trim()) {
      if (typeof f.clinicalNote === 'string' && f.clinicalNote.trim()) {
        return `${f.name.trim()}: ${f.clinicalNote.trim()}`
      }
      if (f.angleDegrees !== undefined && f.angleDegrees !== null) {
        return `${f.name.trim()} (${f.angleDegrees}°)`
      }
      return f.name.trim()
    }
    if (typeof f.title === 'string' && f.title.trim()) return f.title.trim()
    if (typeof f.clinicalNote === 'string' && f.clinicalNote.trim()) return f.clinicalNote.trim()

    // 3. Distortion syndrome
    if (typeof f.distortionSyndrome === 'string' && f.distortionSyndrome.trim()) {
      return formatSyndromeLabel(f.distortionSyndrome)
    }

    // 4. Standalone checkpoint
    if (checkpoint) return checkpoint

    // 5. Key-value pair like { key: 'kneesValgusInward', value: true }
    if (typeof f.key === 'string' && f.key.trim()) {
      const keyFormatted = f.key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toLowerCase().trim()
      const titleCased = keyFormatted.replace(/\b\w/g, (c: string) => c.toUpperCase())
      if (f.value !== undefined && typeof f.value !== 'boolean') {
        return `${titleCased}: ${f.value}`
      }
      return titleCased
    }

    // Single active boolean key: e.g. { anteriorTilt: true }
    const trueKeys = Object.entries(f).filter(([_, v]) => v === true).map(([k]) => k)
    if (trueKeys.length === 1) {
      return trueKeys[0].replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()).trim()
    }

    // 6. Any other non-empty string value on object
    const stringVals = Object.entries(f)
      .filter(([k, v]) => typeof v === 'string' && v.trim().length > 0 && k !== 'id' && k !== 'client_id' && k !== 'created_at')
      .map(([_, v]) => v.trim())
    if (stringVals.length > 0) {
      return stringVals[0]
    }

    // Safe fallback without [object Object]
    try {
      const json = JSON.stringify(f)
      if (json && json !== '{}') return json
    } catch {
      // ignore
    }

    return ''
  }

  return typeof finding === 'number' || typeof finding === 'boolean' ? String(finding) : ''
}

export default function CoachOnboardingProgressionCard({
  profile,
  activeTab,
  rawClient: initialClient,
  rawIntake: initialIntake,
  rawProfile: initialProfile,
  rawAssessment: initialAssessment,
  rawPlan: initialPlan,
  rawSessions: initialSessions = [],
  rawPackages: initialPackages = [],
  rawBodyComposition: initialBodyComp,
}: CoachOnboardingProgressionCardProps) {
  const router = useRouter()

  const [isExpanded, setIsExpanded] = useState(true)
  const [isCardCollapsed, setIsCardCollapsed] = useState<boolean>(() => {
    return profile.isFullyOnboarded && activeTab !== 'onboarding'
  })
  const [selectedStageNumber, setSelectedStageNumber] = useState<number>(() => {
    const matching = profile.stages.find(s => s.actionTab === activeTab)
    return matching ? matching.stageNumber : profile.currentStageNumber
  })

  // Dynamic gate tracking state
  const [localGates, setLocalGates] = useState<Record<number, CoachAuthorizationGate>>(() => {
    const map: Record<number, CoachAuthorizationGate> = {}
    for (const stage of profile.stages) {
      map[stage.stageNumber] = stage.gate
    }
    return map
  })

  // Local copy of editable data to provide instant optimistic feedback
  const [clientData, setClientData] = useState<RawClientData | null>(initialClient || null)
  const [intakeData, setIntakeData] = useState<RawIntakeData | null>(initialIntake || null)
  const [profileData, setProfileData] = useState<RawProfileData | null>(initialProfile || null)
  const [assessmentData, setAssessmentData] = useState<any>(initialAssessment || null)
  const [planData, setPlanData] = useState<any>(initialPlan || null)
  const [sessionsData] = useState<any[]>(initialSessions)
  const [packagesData] = useState<any[]>(initialPackages)
  const [bodyCompData] = useState<any>(initialBodyComp)

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState<Record<string, any>>({})

  // Gate actions state
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const [isReopening, setIsReopening] = useState(false)
  const [isSavingData, setIsSavingData] = useState(false)
  const [gateNotes, setGateNotes] = useState('')
  const [clinicalClearanceChecked, setClinicalClearanceChecked] = useState(false)
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Synchronize when activeTab or profile changes
  useEffect(() => {
    const matching = profile.stages.find(s => s.actionTab === activeTab)
    if (matching) {
      setSelectedStageNumber(matching.stageNumber)
    } else {
      setSelectedStageNumber(profile.currentStageNumber)
    }
    if (activeTab === 'onboarding') {
      setIsCardCollapsed(false)
    }
  }, [activeTab, profile.currentStageNumber, profile.stages])

  // Sync initial props
  useEffect(() => {
    if (initialClient) setClientData(initialClient)
    if (initialIntake) setIntakeData(initialIntake)
    if (initialProfile) setProfileData(initialProfile)
    if (initialAssessment) setAssessmentData(initialAssessment)
    if (initialPlan) setPlanData(initialPlan)

    const map: Record<number, CoachAuthorizationGate> = {}
    for (const stage of profile.stages) {
      map[stage.stageNumber] = stage.gate
    }
    setLocalGates(map)
  }, [initialClient, initialIntake, initialProfile, initialAssessment, initialPlan, profile.stages])

  const selectedStage: ProgressionStageDetail =
    profile.stages.find(s => s.stageNumber === selectedStageNumber) || profile.stages[0]

  const currentGate: CoachAuthorizationGate = localGates[selectedStageNumber] || selectedStage.gate

  // Initialize edit form when opening edit mode
  const handleOpenEdit = useCallback(() => {
    const initialValues: Record<string, any> = {}
    if (selectedStageNumber === 1) {
      initialValues.phone = clientData?.phone || ''
      initialValues.fitnessGoal = profileData?.fitness_goal || ''
      initialValues.trainingDaysPerWeek = profileData?.training_days_per_week || 4
      initialValues.preferredTrainingDays = profileData?.preferred_training_days || []
    } else if (selectedStageNumber === 2) {
      initialValues.medicalConditions = intakeData?.medical_conditions || ''
      initialValues.surgeriesOrInjuries = intakeData?.surgeries_or_injuries || ''
      initialValues.medications = intakeData?.medications || ''
      initialValues.allergies = intakeData?.allergies || ''
      initialValues.primaryPhysicianPhone = intakeData?.primary_physician_phone || ''
      initialValues.emergencyContactPhone = intakeData?.emergency_contact_phone || ''
    } else if (selectedStageNumber === 3) {
      initialValues.age = profileData?.age || 30
      initialValues.sex = profileData?.sex || 'male'
      initialValues.heightCm = profileData?.height_cm || 175
      initialValues.weightKg = profileData?.weight_kg || 75
      initialValues.waistCm = profileData?.waist_cm || ''
      initialValues.neckCm = profileData?.neck_cm || ''
      initialValues.hipCm = profileData?.hip_cm || ''
      initialValues.preferredUnits = profileData?.preferred_units || 'imperial'
    } else if (selectedStageNumber === 4) {
      initialValues.coachSummaryNotes = assessmentData?.coach_summary_notes || ''
    } else if (selectedStageNumber === 5) {
      initialValues.nasmOptPhase = planData?.nasm_opt_phase || 1
      initialValues.phaseName = planData?.phase_name || 'Phase 1: Stabilization Endurance'
      initialValues.sessionsPerWeek = planData?.sessions_per_week || 3
    } else if (selectedStageNumber === 6) {
      initialValues.planName = planData?.name || ''
      initialValues.sessionsPerWeek = planData?.sessions_per_week || 3
    } else if (selectedStageNumber === 7) {
      initialValues.notes = sessionsData[0]?.notes || ''
    }
    setEditFormData(initialValues)
    setIsEditing(true)
    setActionFeedback(null)
  }, [selectedStageNumber, clientData, intakeData, profileData, assessmentData, planData, sessionsData])

  // Save modified parameters
  const handleSaveData = async () => {
    setIsSavingData(true)
    setActionFeedback(null)
    try {
      const res = await fetch(`/api/coach/clients/${profile.clientId}/onboarding-gates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageNumber: selectedStageNumber,
          action: 'update_data',
          data: editFormData,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Failed to update stage parameters')
      }

      // Update local state optimistically
      if (selectedStageNumber === 1) {
        if (clientData && editFormData.phone !== undefined) {
          setClientData({ ...clientData, phone: editFormData.phone })
        }
        if (profileData) {
          setProfileData({
            ...profileData,
            fitness_goal: editFormData.fitnessGoal ?? profileData.fitness_goal,
            training_days_per_week: editFormData.trainingDaysPerWeek ?? profileData.training_days_per_week,
            preferred_training_days: editFormData.preferredTrainingDays ?? profileData.preferred_training_days,
          })
        }
      } else if (selectedStageNumber === 2 && intakeData) {
        setIntakeData({
          ...intakeData,
          medical_conditions: editFormData.medicalConditions ?? intakeData.medical_conditions,
          surgeries_or_injuries: editFormData.surgeriesOrInjuries ?? intakeData.surgeries_or_injuries,
          medications: editFormData.medications ?? intakeData.medications,
          allergies: editFormData.allergies ?? intakeData.allergies,
          primary_physician_phone: editFormData.primaryPhysicianPhone ?? intakeData.primary_physician_phone,
          emergency_contact_phone: editFormData.emergencyContactPhone ?? intakeData.emergency_contact_phone,
        })
      } else if (selectedStageNumber === 3 && profileData) {
        setProfileData({
          ...profileData,
          age: Number(editFormData.age) || profileData.age,
          sex: editFormData.sex ?? profileData.sex,
          height_cm: Number(editFormData.heightCm) || profileData.height_cm,
          weight_kg: Number(editFormData.weightKg) || profileData.weight_kg,
          waist_cm: editFormData.waistCm ? Number(editFormData.waistCm) : null,
          neck_cm: editFormData.neckCm ? Number(editFormData.neckCm) : null,
          hip_cm: editFormData.hipCm ? Number(editFormData.hipCm) : null,
          preferred_units: editFormData.preferredUnits ?? profileData.preferred_units,
        })
      } else if (selectedStageNumber === 4 && assessmentData) {
        setAssessmentData({
          ...assessmentData,
          coach_summary_notes: editFormData.coachSummaryNotes ?? assessmentData.coach_summary_notes,
        })
      } else if (selectedStageNumber === 5 && planData) {
        setPlanData({
          ...planData,
          nasm_opt_phase: Number(editFormData.nasmOptPhase) || planData.nasm_opt_phase,
          phase_name: editFormData.phaseName ?? planData.phase_name,
          sessions_per_week: Number(editFormData.sessionsPerWeek) || planData.sessions_per_week,
        })
      } else if (selectedStageNumber === 6 && planData) {
        setPlanData({
          ...planData,
          name: editFormData.planName ?? planData.name,
          sessions_per_week: Number(editFormData.sessionsPerWeek) || planData.sessions_per_week,
        })
      }

      setActionFeedback({ type: 'success', message: `Step ${selectedStageNumber} parameters updated and saved.` })
      setIsEditing(false)
      router.refresh()
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Error updating parameters' })
    } finally {
      setIsSavingData(false)
    }
  }

  // Authorize Gate Action
  const handleAuthorizeGate = async () => {
    setIsAuthorizing(true)
    setActionFeedback(null)
    try {
      const res = await fetch(`/api/coach/clients/${profile.clientId}/onboarding-gates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageNumber: selectedStageNumber,
          action: 'authorize',
          notes: gateNotes,
          clinicalClearanceVerified: selectedStageNumber === 2 ? clinicalClearanceChecked : undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Failed to authorize onboarding stage gate')
      }

      // Optimistically update gate status
      setLocalGates(prev => {
        const next = { ...prev }
        next[selectedStageNumber] = {
          ...next[selectedStageNumber],
          status: 'authorized',
          authorizedAt: new Date().toISOString(),
          notes: gateNotes,
        }
        if (selectedStageNumber < 7 && next[selectedStageNumber + 1]) {
          next[selectedStageNumber + 1] = {
            ...next[selectedStageNumber + 1],
            status: 'awaiting_authorization',
            canAuthorize: true,
          }
        }
        return next
      })

      setActionFeedback({
        type: 'success',
        message: selectedStageNumber === 7
          ? '🎉 Onboarding Stage 7 authorized! Athlete has graduated to Full Coaching & Maintenance (7/7 Complete)!'
          : `✓ Stage ${selectedStageNumber} authorized! Advancing automatically to Step ${selectedStageNumber + 1}...`,
      })

      setGateNotes('')

      // Automatically advance to the next step
      if (selectedStageNumber < 7) {
        setTimeout(() => {
          setSelectedStageNumber(selectedStageNumber + 1)
        }, 600)
      }

      router.refresh()
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Authorization failed' })
    } finally {
      setIsAuthorizing(false)
    }
  }

  // Reopen Gate Action
  const handleReopenGate = async () => {
    if (!confirm(`Are you sure you want to reopen Stage ${selectedStageNumber}? This will reset authorization for Stage ${selectedStageNumber} and all subsequent stages.`)) {
      return
    }

    setIsReopening(true)
    setActionFeedback(null)
    try {
      const res = await fetch(`/api/coach/clients/${profile.clientId}/onboarding-gates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageNumber: selectedStageNumber,
          action: 'reopen',
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Failed to reopen gate')
      }

      setLocalGates(prev => {
        const next = { ...prev }
        for (let s = selectedStageNumber; s <= 7; s++) {
          if (next[s]) {
            next[s] = {
              ...next[s],
              status: s === selectedStageNumber ? 'awaiting_authorization' : 'locked',
              authorizedAt: null,
              authorizedBy: null,
            }
          }
        }
        return next
      })

      setActionFeedback({ type: 'success', message: `Stage ${selectedStageNumber} has been reopened for coach review.` })
      router.refresh()
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to reopen gate' })
    } finally {
      setIsReopening(false)
    }
  }

  const handleActionNavigation = (e: React.MouseEvent, targetHref: string, targetTab?: string) => {
    // If the link points to a standalone page (e.g. /dossier, /live, /messages), allow standard navigation
    if (targetHref.startsWith('/') && !targetHref.includes('?tab=') && !targetHref.includes('#workspace-tab-content')) {
      return
    }

    const el = document.getElementById('workspace-tab-content')

    if (activeTab && targetTab && activeTab === targetTab) {
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      if (targetHref.includes('subtab=') || targetHref.includes('#')) {
        window.location.href = targetHref
      }
      return
    }

    window.location.href = targetHref
  }

  // Extract PAR-Q parsed answers
  const parsedParq = parseParqAnswers(intakeData?.parq_answers, intakeData)
  const parqSummaryList = [
    { key: 'q1', label: 'Heart condition diagnosed by physician', answer: parsedParq.hasHeartCondition },
    { key: 'q2', label: 'Chest pain during exertion or at rest', answer: parsedParq.experiencesChestPain },
    { key: 'q3', label: 'Dizziness, loss of balance, or syncope', answer: parsedParq.experiencesDizzinessOrSyncope },
    { key: 'q4', label: 'Bone or joint problem aggravated by movement', answer: parsedParq.hasBoneOrJointProblem },
    { key: 'q5', label: 'Prescription medications for blood pressure / heart', answer: parsedParq.takesBloodPressureOrHeartMedication },
    { key: 'q6', label: 'Chronic spinal or disc condition', answer: parsedParq.hasChronicSpinalOrDiscCondition },
    { key: 'q7', label: 'Recent surgery or major injury in past 12 months', answer: parsedParq.hasRecentSurgeryOrInjury },
  ]
  const hasParqRisk = parqSummaryList.some(q => q.answer)

  // Memoized safe arrays for Phase 4 movement & posture assessments
  const ohsaFindingsList = useMemo(() => {
    if (!assessmentData?.ohsa_findings) return []
    if (Array.isArray(assessmentData.ohsa_findings)) return assessmentData.ohsa_findings
    if (typeof assessmentData.ohsa_findings === 'string') {
      try {
        const parsed = JSON.parse(assessmentData.ohsa_findings)
        if (Array.isArray(parsed)) return parsed
        return [assessmentData.ohsa_findings]
      } catch {
        return [assessmentData.ohsa_findings]
      }
    }
    return []
  }, [assessmentData?.ohsa_findings])

  const staticPostureList = useMemo(() => {
    if (!assessmentData?.static_posture) return []
    if (Array.isArray(assessmentData.static_posture)) return assessmentData.static_posture
    if (typeof assessmentData.static_posture === 'string') {
      try {
        const parsed = JSON.parse(assessmentData.static_posture)
        if (Array.isArray(parsed)) return parsed
        return [assessmentData.static_posture]
      } catch {
        return [assessmentData.static_posture]
      }
    }
    return []
  }, [assessmentData?.static_posture])

  // Render a button for a stage
  const renderStageButton = (stage: ProgressionStageDetail) => {
    const style = STATE_COLORS[stage.state]
    const isSelected = stage.stageNumber === selectedStageNumber
    const isCurrentPhase = stage.stageNumber === profile.currentStageNumber
    const isActiveTab = stage.actionTab === activeTab

    const gate = localGates[stage.stageNumber] || stage.gate
    const gateBadge = GATE_BADGES[gate.status] || GATE_BADGES.locked

    return (
      <button
        key={stage.id}
        type="button"
        onClick={() => {
          setSelectedStageNumber(stage.stageNumber)
          setIsExpanded(true)
          setIsEditing(false)
          setActionFeedback(null)
        }}
        style={{
          background: isCurrentPhase && isActiveTab
            ? 'linear-gradient(135deg, rgba(212, 160, 23, 0.32) 0%, rgba(212, 160, 23, 0.16) 100%)'
            : isCurrentPhase
            ? 'rgba(212, 160, 23, 0.18)'
            : isActiveTab
            ? 'rgba(56, 189, 248, 0.16)'
            : isSelected
            ? style.bg
            : 'rgba(255, 255, 255, 0.02)',
          border: isCurrentPhase && isActiveTab
            ? '2px solid var(--gold)'
            : isCurrentPhase
            ? '2px dashed var(--gold)'
            : isActiveTab
            ? '2px solid #38BDF8'
            : isSelected
            ? `1.5px solid ${style.border}`
            : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: isCurrentPhase
            ? '0 0 14px rgba(212, 160, 23, 0.35)'
            : isActiveTab
            ? '0 0 10px rgba(56, 189, 248, 0.25)'
            : 'none',
          borderRadius: 8,
          padding: '10px 8px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
          position: 'relative',
        }}
      >
        {/* Top Floating Badge: Focus / Viewing */}
        {isCurrentPhase && (
          <div
            style={{
              position: 'absolute',
              top: -6,
              right: -4,
              background: 'var(--gold)',
              color: '#080E14',
              fontSize: 8.5,
              fontWeight: 900,
              letterSpacing: '0.04em',
              padding: '1px 5px',
              borderRadius: 3,
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
              zIndex: 2,
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            {isActiveTab ? (
              <>
                <GaaIcon name="star" size={8} tone="inherit" />
                <span>FOCUS</span>
              </>
            ) : (
              'FOCUS'
            )}
          </div>
        )}
        {!isCurrentPhase && isActiveTab && (
          <div
            style={{
              position: 'absolute',
              top: -6,
              right: -4,
              background: '#38BDF8',
              color: '#080E14',
              fontSize: 8.5,
              fontWeight: 900,
              letterSpacing: '0.04em',
              padding: '1px 5px',
              borderRadius: 3,
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
              zIndex: 2,
              textTransform: 'uppercase',
            }}
          >
            VIEWING
          </div>
        )}

        {/* Step indicator circle */}
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: gate.status === 'authorized'
              ? '#10B981'
              : gate.status === 'blocked'
              ? '#EF4444'
              : isCurrentPhase
              ? 'var(--gold)'
              : stage.state === 'completed'
              ? '#10B981'
              : 'rgba(255,255,255,0.1)',
            color: gate.status === 'authorized' || isCurrentPhase || stage.state === 'completed'
              ? '#080E14'
              : 'var(--white)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 900,
            margin: '0 auto 6px',
            boxShadow: isCurrentPhase ? '0 0 8px var(--gold)' : 'none',
          }}
        >
          {gate.status === 'authorized' ? '✓' : gate.status === 'blocked' ? '!' : stage.stageNumber}
        </div>

        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: isCurrentPhase ? 'var(--gold-lt)' : isActiveTab ? '#38BDF8' : isSelected ? style.text : 'var(--white)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {stage.shortTitle}
        </div>

        {/* Authorization Gate Tag for Phases 1-7 */}
        {stage.category === 'onboarding_phase' && (
          <div
            style={{
              fontSize: 8.5,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: gateBadge.bg,
              border: `1px solid ${gateBadge.border}`,
              color: gateBadge.text,
              marginTop: 4,
              padding: '1px 3px',
              borderRadius: 3,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={`Coach Gate: ${gate.status}`}
          >
            {gateBadge.label}
          </div>
        )}
      </button>
    )
  }

  // ── "Focus Mode": Compact Ribbon for Graduated Athletes ──────
  if (isCardCollapsed && profile.isFullyOnboarded) {
    return (
      <div
        className="coach-onboarding-progression-card coach-onboarding-collapsed-ribbon"
        style={{
          background: 'linear-gradient(135deg, rgba(14, 22, 36, 0.95) 0%, rgba(8, 13, 22, 0.95) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 10,
          padding: '10px 18px',
          marginBottom: 20,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 9px',
              borderRadius: 4,
              background: 'rgba(16,185,129,0.16)',
              border: '1px solid rgba(16,185,129,0.35)',
              color: '#34D399',
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            <span>✓</span>
            <span>All 7 Onboarding Gates Authorized · Graduate (7/7)</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 9px',
              borderRadius: 4,
              background: 'rgba(56,189,248,0.12)',
              border: '1px solid rgba(56,189,248,0.3)',
              color: '#38BDF8',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38BDF8' }} />
            <span>Phase {profile.currentStageNumber}: {profile.currentStageShortTitle}</span>
            <span style={{ color: 'var(--gray)', fontSize: 10 }}>· Maintenance Active</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => setIsCardCollapsed(false)}
            style={{
              padding: '6px 12px',
              borderRadius: 4,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'var(--white)',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span>View Authorization Gates &amp; Continuum</span>
            <GaaIcon name="chevron-down" size={11} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="coach-onboarding-progression-card"
      style={{
        background: 'linear-gradient(135deg, rgba(14, 22, 36, 0.98) 0%, rgba(8, 13, 22, 0.98) 100%)',
        border: '1px solid rgba(212, 160, 23, 0.35)',
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 24,
        boxShadow: '0 12px 36px rgba(0,0,0,0.45), 0 0 24px rgba(212,160,23,0.08)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 10.5,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--gold-lt)',
                fontWeight: 800,
              }}
            >
              Athlete Onboarding &amp; Compliance Continuum
            </span>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 10.5,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: profile.isFullyOnboarded
                  ? 'rgba(16,185,129,0.2)'
                  : 'rgba(212,160,23,0.2)',
                color: profile.isFullyOnboarded ? '#34D399' : 'var(--gold-lt)',
                border: `1px solid ${profile.isFullyOnboarded ? '#10B981' : 'var(--gold)'}`,
              }}
            >
              {profile.isFullyOnboarded
                ? 'Onboarding Complete (7/7) · Maintenance & Compliance'
                : `In Onboarding (${profile.completedOnboardingCount}/7 Gates Authorized)`}
            </span>
          </div>

          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontWeight: 700,
              fontSize: 'clamp(18px, 2.4vw, 24px)',
              letterSpacing: '0.04em',
              color: 'var(--white)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <span>STAGE {selectedStage.stageNumber}:</span>
            <span style={{ color: 'var(--gold)' }}>{selectedStage.title}</span>
          </h2>
        </div>

        {/* Progress and Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Coach Authorization
            </div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 20, color: 'var(--white)', lineHeight: 1 }}>
              {profile.completedOnboardingCount} / 7{' '}
              <span style={{ fontSize: 14, color: profile.isFullyOnboarded ? '#34D399' : 'var(--gold-lt)' }}>
                ({profile.onboardingProgressPercent}%)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: '9px 12px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--white)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>{isExpanded ? 'Hide Details' : 'Inspect Details & Gate'}</span>
            <GaaIcon name={isExpanded ? 'chevron-down' : 'chevron-right'} size={12} />
          </button>

          {profile.isFullyOnboarded && (
            <button
              type="button"
              onClick={() => setIsCardCollapsed(true)}
              style={{
                padding: '9px 12px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--gray-lt)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              title="Minimize onboarding card to a compact ribbon"
            >
              <span>Minimize</span>
              <GaaIcon name="chevron-up" size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 6,
            marginBottom: 14,
            fontSize: 12.5,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: actionFeedback.type === 'success' ? 'rgba(16,185,129,0.16)' : 'rgba(239,68,68,0.16)',
            border: `1px solid ${actionFeedback.type === 'success' ? '#10B981' : '#EF4444'}`,
            color: actionFeedback.type === 'success' ? '#34D399' : '#FCA5A5',
          }}
        >
          <GaaIcon name={actionFeedback.type === 'success' ? 'check' : 'alert-triangle'} size={14} />
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* ── 9-Stage Stepper Buttons ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)' }}>
            7-Phase Onboarding Continuum · Click Step to View &amp; Authorize Gate
          </span>
          <span style={{ fontSize: 10, color: 'var(--gray)', fontWeight: 700 }}>
            {profile.completedOnboardingCount}/7 Phases Authorized
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))',
            gap: 8,
            marginBottom: 10,
          }}
        >
          {profile.stages.filter(s => s.category === 'onboarding_phase').map(renderStageButton)}
        </div>

        {/* Phases 8-9 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0 6px' }}>
          <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#38BDF8' }}>
            Maintenance &amp; Compliance Pillars · Phases 8–9 (Post-Onboarding)
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 8,
          }}
        >
          {profile.stages.filter(s => s.category === 'maintenance_compliance').map(renderStageButton)}
        </div>
      </div>

      {/* ── Expanded Inspector & Authorization Gate ───────────────── */}
      {isExpanded && (
        <div
          style={{
            background: 'rgba(8, 14, 24, 0.85)',
            border: '1px solid rgba(212, 160, 23, 0.25)',
            borderRadius: 10,
            padding: '18px 20px',
            marginTop: 14,
          }}
        >
          {/* 1. COACH AUTHORIZATION GATE CONTROL BAR */}
          {selectedStage.category === 'onboarding_phase' && (
            <div
              style={{
                background: currentGate.status === 'authorized'
                  ? 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,40,30,0.4) 100%)'
                  : currentGate.status === 'blocked'
                  ? 'linear-gradient(135deg, rgba(239,68,68,0.14) 0%, rgba(50,10,10,0.4) 100%)'
                  : currentGate.status === 'awaiting_authorization'
                  ? 'linear-gradient(135deg, rgba(212,160,23,0.16) 0%, rgba(40,30,10,0.4) 100%)'
                  : 'rgba(255,255,255,0.03)',
                border: `1.5px solid ${currentGate.status === 'authorized' ? '#10B981' : currentGate.status === 'blocked' ? '#EF4444' : currentGate.status === 'awaiting_authorization' ? 'var(--gold)' : 'rgba(148,163,184,0.3)'}`,
                borderRadius: 8,
                padding: '16px 18px',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 14,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold-lt)' }}>
                      Coach Authorization Gate · Step {selectedStage.stageNumber} of 7
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        background: GATE_BADGES[currentGate.status].bg,
                        border: `1px solid ${GATE_BADGES[currentGate.status].border}`,
                        color: GATE_BADGES[currentGate.status].text,
                      }}
                    >
                      {GATE_BADGES[currentGate.status].label}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, color: 'var(--white)', fontWeight: 600 }}>
                    {currentGate.status === 'authorized' && (
                      <span style={{ color: '#34D399' }}>
                        ✓ Step {selectedStage.stageNumber} accepted and authorized by coach.
                        {currentGate.authorizedAt && ` (${new Date(currentGate.authorizedAt).toLocaleDateString()})`}
                      </span>
                    )}
                    {currentGate.status === 'awaiting_authorization' && (
                      <span style={{ color: 'var(--gold-lt)' }}>
                        ⚡ All step criteria satisfied. Authorize this gate to automatically progress the athlete to Step {selectedStage.stageNumber < 7 ? selectedStage.stageNumber + 1 : 'Graduation'}.
                      </span>
                    )}
                    {currentGate.status === 'locked' && (
                      <span style={{ color: '#94A3B8' }}>
                        🔒 Locked: Step {selectedStage.stageNumber - 1} must be authorized by a coach before this gate unlocks.
                      </span>
                    )}
                    {currentGate.status === 'blocked' && (
                      <span style={{ color: '#F87171' }}>
                        ⚠️ Clinical Blocker: Athlete flagged cardiovascular/medical risks on PAR-Q+. Physician clearance verification required before authorizing.
                      </span>
                    )}
                  </div>
                </div>

                {/* Gate Action Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {currentGate.status === 'awaiting_authorization' && (
                    <button
                      type="button"
                      disabled={isAuthorizing || (selectedStage.stageNumber === 2 && hasParqRisk && !clinicalClearanceChecked)}
                      onClick={handleAuthorizeGate}
                      className="tactile-btn"
                      style={{
                        padding: '9px 18px',
                        borderRadius: 6,
                        background: (selectedStage.stageNumber === 2 && hasParqRisk && !clinicalClearanceChecked)
                          ? 'rgba(255,255,255,0.1)'
                          : selectedStage.stageNumber === 7
                          ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                        color: (selectedStage.stageNumber === 2 && hasParqRisk && !clinicalClearanceChecked)
                          ? '#94A3B8'
                          : '#080E14',
                        fontSize: 12.5,
                        fontWeight: 900,
                        border: 'none',
                        cursor: (selectedStage.stageNumber === 2 && hasParqRisk && !clinicalClearanceChecked) ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                      }}
                    >
                      {isAuthorizing ? (
                        <span>Authorizing Gate...</span>
                      ) : selectedStage.stageNumber === 7 ? (
                        <span>Authorize &amp; Finalize Onboarding (7/7) ✓</span>
                      ) : (
                        <span>Authorize Step {selectedStage.stageNumber} &amp; Progress ➔</span>
                      )}
                    </button>
                  )}

                  {currentGate.status === 'blocked' && selectedStage.stageNumber === 2 && (
                    <button
                      type="button"
                      disabled={isAuthorizing || !clinicalClearanceChecked}
                      onClick={handleAuthorizeGate}
                      className="tactile-btn"
                      style={{
                        padding: '9px 18px',
                        borderRadius: 6,
                        background: clinicalClearanceChecked ? 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)' : 'rgba(255,255,255,0.1)',
                        color: clinicalClearanceChecked ? '#080E14' : '#94A3B8',
                        fontSize: 12.5,
                        fontWeight: 800,
                        cursor: clinicalClearanceChecked ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {isAuthorizing ? 'Authorizing...' : 'Authorize with Physician Clearance ➔'}
                    </button>
                  )}

                  {currentGate.status === 'authorized' && (
                    <button
                      type="button"
                      disabled={isReopening}
                      onClick={handleReopenGate}
                      style={{
                        padding: '7px 12px',
                        borderRadius: 5,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        color: 'var(--gray-lt)',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <span>Re-open / Revise Gate ↺</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Special Checkbox for Step 2 Physician Clearance Verification */}
              {selectedStage.stageNumber === 2 && (currentGate.status === 'blocked' || (currentGate.status === 'awaiting_authorization' && hasParqRisk)) && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 10,
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <input
                    type="checkbox"
                    id="clinical-clearance-check"
                    checked={clinicalClearanceChecked}
                    onChange={e => setClinicalClearanceChecked(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="clinical-clearance-check" style={{ fontSize: 12, color: 'var(--white)', cursor: 'pointer', fontWeight: 600 }}>
                    I confirm that the athlete's physician medical clearance documentation has been verified and logged in records.
                  </label>
                </div>
              )}
            </div>
          )}

          {/* 2. DETAILS AT A GLANCE & INLINE EDITOR HEADER */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 16,
              paddingBottom: 10,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                  fontWeight: 700,
                  fontSize: 17,
                  color: 'var(--white)',
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>STAGE {selectedStage.stageNumber} PARAMETERS &amp; TELEMETRY</span>
                <span style={{ fontSize: 12, color: 'var(--gold-lt)', fontFamily: 'system-ui, sans-serif' }}>
                  {isEditing ? '(Inline Editing Mode)' : '(Details at a Glance)'}
                </span>
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--gray)' }}>
                {selectedStage.summary}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {selectedStage.category === 'onboarding_phase' && (
                <>
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={handleOpenEdit}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 5,
                        background: 'rgba(212,160,23,0.12)',
                        border: '1px solid var(--gold)',
                        color: 'var(--gold-lt)',
                        fontSize: 11.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <GaaIcon name="edit" size={12} />
                      <span>Edit Parameters</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 5,
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.14)',
                          color: 'var(--gray)',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSavingData}
                        onClick={handleSaveData}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 5,
                          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                          border: 'none',
                          color: '#FFFFFF',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: isSavingData ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <GaaIcon name="check" size={12} />
                        <span>{isSavingData ? 'Saving...' : 'Save Parameters'}</span>
                      </button>
                    </>
                  )}
                </>
              )}

              <a
                href={selectedStage.actionHref}
                onClick={e => handleActionNavigation(e, selectedStage.actionHref, selectedStage.actionTab)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 5,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--white)',
                  fontSize: 11.5,
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <span>{selectedStage.actionLabel}</span>
                <span>➔</span>
              </a>
            </div>
          </div>

          {/* 3. AT-A-GLANCE STAGE DETAILS / INLINE EDIT PANELS */}
          <div style={{ marginBottom: 18 }}>
            {/* ── PHASE 1: INTAKE & CLAIM ── */}
            {selectedStage.stageNumber === 1 && (
              <div>
                {!isEditing ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    <div style={infoCardStyle}>
                      <div style={infoLabelStyle}>Athlete Contact &amp; Identity</div>
                      <div style={infoValueStyle}>{clientData?.full_name || 'Athlete'}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>{clientData?.email || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-lt)', marginTop: 2 }}>Phone: {clientData?.phone || 'Not provided'}</div>
                    </div>
                    <div style={infoCardStyle}>
                      <div style={infoLabelStyle}>Active Package / Tier</div>
                      <div style={infoValueStyle}>{packagesData[0]?.package_name || 'Individual Coaching'}</div>
                      <div style={{ fontSize: 12, color: '#34D399', marginTop: 2, fontWeight: 700 }}>
                        {packagesData[0]?.sessions_remaining ?? 0} Sessions Remaining
                      </div>
                    </div>
                    <div style={infoCardStyle}>
                      <div style={infoLabelStyle}>Fitness Goal &amp; Frequency</div>
                      <div style={infoValueStyle}>{profileData?.fitness_goal || 'Body Recomposition'}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-lt)', marginTop: 2 }}>
                        {profileData?.training_days_per_week || 4} days/week commitment
                      </div>
                    </div>
                    <div style={infoCardStyle}>
                      <div style={infoLabelStyle}>Designated Coach Status</div>
                      <div style={{ ...infoValueStyle, color: clientData?.designated_coach_id ? '#34D399' : 'var(--gold-lt)' }}>
                        {clientData?.designated_coach_id ? '✓ Assigned & Verified' : 'Pending Claim'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
                        Status: <span style={{ textTransform: 'capitalize', color: 'var(--white)' }}>{clientData?.status || 'Active'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    <div>
                      <label style={fieldLabelStyle}>Phone Number</label>
                      <input
                        type="text"
                        value={editFormData.phone || ''}
                        onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                        style={inputStyle}
                        placeholder="(555) 000-0000"
                      />
                    </div>
                    <div>
                      <label style={fieldLabelStyle}>Fitness Goal</label>
                      <input
                        type="text"
                        value={editFormData.fitnessGoal || ''}
                        onChange={e => setEditFormData({ ...editFormData, fitnessGoal: e.target.value })}
                        style={inputStyle}
                        placeholder="e.g. Strength Endurance & Fat Loss"
                      />
                    </div>
                    <div>
                      <label style={fieldLabelStyle}>Training Days Per Week</label>
                      <input
                        type="number"
                        min={1}
                        max={7}
                        value={editFormData.trainingDaysPerWeek || 4}
                        onChange={e => setEditFormData({ ...editFormData, trainingDaysPerWeek: Number(e.target.value) })}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── PHASE 2: CLINICAL LIABILITY SHIELD & PAR-Q+ ── */}
            {selectedStage.stageNumber === 2 && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 14 }}>
                  {/* Immutable Client Digital Affirmation Card */}
                  <div style={{ ...infoCardStyle, border: '1px solid rgba(212,160,23,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <GaaIcon name="lock" size={13} tone="gold" />
                      <span style={{ fontSize: 10.5, fontWeight: 900, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Athlete Legal Affirmation (Client-Only / Immutable)
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 8 }}>
                      Digitally signed by the client. Legally binding liability waiver cannot be edited or modified by coach.
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 6, border: '1px dashed rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: 11, color: 'var(--gray)' }}>Digital Waiver Signature:</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--white)', fontWeight: 700, margin: '2px 0' }}>
                        {intakeData?.consent_signature_name || 'No digital signature on record'}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--gray)' }}>
                        Signed At:{' '}
                        <span style={{ color: 'var(--white)' }}>
                          {intakeData?.consent_signed_at ? new Date(intakeData.consent_signed_at).toLocaleString() : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PAR-Q+ Self-Reported Questionnaire Card */}
                  <div style={{ ...infoCardStyle, border: '1px solid rgba(56,189,248,0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <GaaIcon name="shield" size={13} style={{ color: '#38BDF8' }} />
                      <span style={{ fontSize: 10.5, fontWeight: 900, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        PAR-Q+ Clinical Responses (Client Self-Reported / Immutable)
                      </span>
                    </div>
                    <div style={{ display: 'grid', gap: 4, maxHeight: 150, overflowY: 'auto', paddingRight: 4 }}>
                      {parqSummaryList.map(item => (
                        <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ color: item.answer ? '#FCA5A5' : 'var(--gray-lt)', maxWidth: '80%' }}>{item.label}</span>
                          <span style={{
                            padding: '1px 5px',
                            borderRadius: 3,
                            fontSize: 9.5,
                            fontWeight: 900,
                            background: item.answer ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.15)',
                            color: item.answer ? '#F87171' : '#34D399',
                          }}>
                            {item.answer ? 'YES (FLAG)' : 'NO'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Coach Clinical Notes & Clearance (Editable) */}
                {!isEditing ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    <div style={infoCardStyle}>
                      <div style={infoLabelStyle}>Reported Medical Conditions</div>
                      <div style={{ fontSize: 12.5, color: 'var(--white)' }}>{intakeData?.medical_conditions || 'None reported'}</div>
                    </div>
                    <div style={infoCardStyle}>
                      <div style={infoLabelStyle}>Surgeries or Injuries</div>
                      <div style={{ fontSize: 12.5, color: 'var(--white)' }}>{intakeData?.surgeries_or_injuries || 'None reported'}</div>
                    </div>
                    <div style={infoCardStyle}>
                      <div style={infoLabelStyle}>Physician &amp; Emergency Phone</div>
                      <div style={{ fontSize: 12, color: 'var(--white)' }}>
                        Doctor: {intakeData?.primary_physician_phone || '—'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gray-lt)', marginTop: 2 }}>
                        Emergency: {intakeData?.emergency_contact_phone || '—'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    <div>
                      <label style={fieldLabelStyle}>Medical Conditions Notes</label>
                      <textarea
                        value={editFormData.medicalConditions || ''}
                        onChange={e => setEditFormData({ ...editFormData, medicalConditions: e.target.value })}
                        style={{ ...inputStyle, height: 60 }}
                        placeholder="Clinical notes / physician clearance details"
                      />
                    </div>
                    <div>
                      <label style={fieldLabelStyle}>Surgeries or Injuries</label>
                      <textarea
                        value={editFormData.surgeriesOrInjuries || ''}
                        onChange={e => setEditFormData({ ...editFormData, surgeriesOrInjuries: e.target.value })}
                        style={{ ...inputStyle, height: 60 }}
                        placeholder="Past procedures, joint replacements, sprains"
                      />
                    </div>
                    <div>
                      <label style={fieldLabelStyle}>Primary Physician Phone</label>
                      <input
                        type="text"
                        value={editFormData.primaryPhysicianPhone || ''}
                        onChange={e => setEditFormData({ ...editFormData, primaryPhysicianPhone: e.target.value })}
                        style={inputStyle}
                        placeholder="(555) 000-0000"
                      />
                    </div>
                    <div>
                      <label style={fieldLabelStyle}>Emergency Contact Phone</label>
                      <input
                        type="text"
                        value={editFormData.emergencyContactPhone || ''}
                        onChange={e => setEditFormData({ ...editFormData, emergencyContactPhone: e.target.value })}
                        style={inputStyle}
                        placeholder="(555) 000-0000"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── PHASE 3: BASELINE BIOMETRICS & READINESS ── */}
            {selectedStage.stageNumber === 3 && (
              <div>
                {!isEditing ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div style={infoCardStyle}>
                      <div style={infoLabelStyle}>Anthropometrics &amp; Vitals</div>
                      <div style={infoValueStyle}>
                        {profileData?.height_cm ? `${profileData.height_cm} cm (${formatCmToFtIn(profileData.height_cm)})` : '—'}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--white)', marginTop: 2, fontWeight: 700 }}>
                        {profileData?.weight_kg ? `${profileData.weight_kg} kg (${formatKgToLbs(profileData.weight_kg)})` : '—'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 3 }}>
                        Age: {profileData?.age || '—'} · Sex: {profileData?.sex || '—'} · Units: {profileData?.preferred_units || 'imperial'}
                      </div>
                    </div>
                    <div style={infoCardStyle}>
                      <div style={infoLabelStyle}>Circumferences (cm)</div>
                      <div style={{ fontSize: 12.5, color: 'var(--white)', display: 'grid', gap: 3 }}>
                        <div>Waist: {profileData?.waist_cm ? `${profileData.waist_cm} cm` : 'Pending'}</div>
                        <div>Neck: {profileData?.neck_cm ? `${profileData.neck_cm} cm` : 'Pending'}</div>
                        <div>Hip: {profileData?.hip_cm ? `${profileData.hip_cm} cm` : 'Pending'}</div>
                      </div>
                    </div>
                    <div style={infoCardStyle}>
                      <div style={infoLabelStyle}>Body Composition / DEXA</div>
                      <div style={{ ...infoValueStyle, color: bodyCompData?.estimated_bodyfat_percent ? '#38BDF8' : 'var(--gray)' }}>
                        {bodyCompData?.estimated_bodyfat_percent ? `${bodyCompData.estimated_bodyfat_percent}% Body Fat` : 'No Scan Recorded'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
                        {bodyCompData?.method || 'Calibrated 4C Vision Analysis'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <div>
                      <label style={fieldLabelStyle}>Height (cm)</label>
                      <input
                        type="number"
                        value={editFormData.heightCm || ''}
                        onChange={e => setEditFormData({ ...editFormData, heightCm: Number(e.target.value) })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={fieldLabelStyle}>Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editFormData.weightKg || ''}
                        onChange={e => setEditFormData({ ...editFormData, weightKg: Number(e.target.value) })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={fieldLabelStyle}>Waist (cm)</label>
                      <input
                        type="number"
                        value={editFormData.waistCm || ''}
                        onChange={e => setEditFormData({ ...editFormData, waistCm: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={fieldLabelStyle}>Age</label>
                      <input
                        type="number"
                        value={editFormData.age || ''}
                        onChange={e => setEditFormData({ ...editFormData, age: Number(e.target.value) })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={fieldLabelStyle}>Sex</label>
                      <select
                        value={editFormData.sex || 'male'}
                        onChange={e => setEditFormData({ ...editFormData, sex: e.target.value })}
                        style={inputStyle}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={fieldLabelStyle}>Preferred Units</label>
                      <select
                        value={editFormData.preferredUnits || 'imperial'}
                        onChange={e => setEditFormData({ ...editFormData, preferredUnits: e.target.value })}
                        style={inputStyle}
                      >
                        <option value="imperial">Imperial (lb/in)</option>
                        <option value="metric">Metric (kg/cm)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── PHASE 4: NASM MOVEMENT SCREEN & TESTING SUITE ── */}
            {selectedStage.stageNumber === 4 && (
              <div>
                {!isEditing ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                    <div style={infoCardStyle}>
                      <div style={infoLabelStyle}>Overhead Squat Assessment (OHSA)</div>
                      <div style={{ fontSize: 12.5, color: 'var(--white)', marginTop: 4 }}>
                        {ohsaFindingsList.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxHeight: 160, overflowY: 'auto', paddingRight: 2 }}>
                            {ohsaFindingsList.map((f: any, idx: number) => {
                              const label = typeof f === 'string'
                                ? f.replace(/_/g, ' ')
                                : (f?.compensation ? String(f.compensation).replace(/_/g, ' ') : f?.observation || f?.name || f?.label || 'Compensation')
                              return (
                                <span key={idx} style={{ padding: '2px 6px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 3, fontSize: 11, color: '#FCA5A5', lineHeight: 1.4 }}>
                                  {label}
                                </span>
                              )
                            })}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--gray)' }}>No OHSA compensations flagged</span>
                        )}
                      </div>
                    </div>
                    <div style={infoCardStyle}>
                      <div style={infoLabelStyle}>Static Posture &amp; Kinetic Chain</div>
                      <div style={{ fontSize: 12.5, color: 'var(--white)', marginTop: 4 }}>
                        {staticPostureList.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxHeight: 160, overflowY: 'auto', paddingRight: 2 }}>
                            {staticPostureList.map((f: any, idx: number) => {
                              const label = formatStaticPostureFinding(f)
                              if (!label) return null
                              return (
                                <span
                                  key={idx}
                                  style={{
                                    padding: '2px 6px',
                                    background: 'rgba(212,160,23,0.15)',
                                    border: '1px solid rgba(212,160,23,0.35)',
                                    borderRadius: 3,
                                    fontSize: 11,
                                    color: 'var(--gold-lt)',
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {label}
                                </span>
                              )
                            })}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--gray)' }}>Optimal posture baseline</span>
                        )}
                      </div>
                    </div>
                    <div style={infoCardStyle}>
                      <div style={infoLabelStyle}>Coach Assessment Notes</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-lt)', marginTop: 4, fontStyle: 'italic' }}>
                        {assessmentData?.coach_summary_notes || 'No assessment summary notes entered yet.'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={fieldLabelStyle}>Coach Assessment Summary Notes</label>
                    <textarea
                      value={editFormData.coachSummaryNotes || ''}
                      onChange={e => setEditFormData({ ...editFormData, coachSummaryNotes: e.target.value })}
                      style={{ ...inputStyle, height: 70 }}
                      placeholder="Enter OHSA findings summary, overactive/underactive muscle cues, or corrective exercise priorities"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── PHASE 5: 12-WEEK OPT PERIODIZATION ARCHITECTURE ── */}
            {selectedStage.stageNumber === 5 && (
              <div>
                {!isEditing ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    <div style={infoCardStyle}>
                      <div style={infoLabelStyle}>Assigned NASM OPT™ Phase</div>
                      <div style={{ ...infoValueStyle, color: 'var(--gold)' }}>
                        Phase {planData?.nasm_opt_phase || 1}: {planData?.phase_name || 'Stabilization Endurance'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 3 }}>
                        Target: Joint stability, postural control, and neuromuscular efficiency
                      </div>
                    </div>
                    <div style={infoCardStyle}>
                      <div style={infoLabelStyle}>Weekly Training Frequency</div>
                      <div style={infoValueStyle}>
                        {planData?.sessions_per_week || 3} Sessions / Week
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 3 }}>
                        Recommended split based on initial recovery profile
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div>
                      <label style={fieldLabelStyle}>NASM OPT™ Phase</label>
                      <select
                        value={editFormData.nasmOptPhase || 1}
                        onChange={e => {
                          const phase = Number(e.target.value)
                          const names: Record<number, string> = {
                            1: 'Phase 1: Stabilization Endurance',
                            2: 'Phase 2: Strength Endurance',
                            3: 'Phase 3: Muscular Development',
                            4: 'Phase 4: Maximal Strength',
                            5: 'Phase 5: Power',
                          }
                          setEditFormData({
                            ...editFormData,
                            nasmOptPhase: phase,
                            phaseName: names[phase] || `Phase ${phase}`,
                          })
                        }}
                        style={inputStyle}
                      >
                        <option value={1}>Phase 1: Stabilization Endurance</option>
                        <option value={2}>Phase 2: Strength Endurance</option>
                        <option value={3}>Phase 3: Muscular Development</option>
                        <option value={4}>Phase 4: Maximal Strength</option>
                        <option value={5}>Phase 5: Power</option>
                      </select>
                    </div>
                    <div>
                      <label style={fieldLabelStyle}>Sessions Per Week</label>
                      <input
                        type="number"
                        min={1}
                        max={7}
                        value={editFormData.sessionsPerWeek || 3}
                        onChange={e => setEditFormData({ ...editFormData, sessionsPerWeek: Number(e.target.value) })}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── PHASE 6: PROGRAM DESIGN WORKSPACE ── */}
            {selectedStage.stageNumber === 6 && (
              <div>
                {!isEditing ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    <div style={infoCardStyle}>
                      <div style={infoLabelStyle}>Active Workout Plan</div>
                      <div style={infoValueStyle}>{planData?.name || 'Assigned Periodized Plan'}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
                        Phase {planData?.nasm_opt_phase || 1} · {planData?.sessions_per_week || 3} Days/Week
                      </div>
                    </div>
                    <div style={infoCardStyle}>
                      <div style={infoLabelStyle}>Prescription Workouts</div>
                      <div style={{ fontSize: 13, color: 'var(--white)', fontWeight: 700 }}>
                        {planData?.plan_json?.workouts?.length || 3} Custom Workouts Structured
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray-lt)', marginTop: 2 }}>
                        CEx routines and kinetic chain integration active
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={fieldLabelStyle}>Program Plan Title</label>
                    <input
                      type="text"
                      value={editFormData.planName || ''}
                      onChange={e => setEditFormData({ ...editFormData, planName: e.target.value })}
                      style={inputStyle}
                      placeholder="e.g. 12-Week Stabilization & Core Power"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── PHASE 7: LIVE COACHING DELIVERY KICKOFF ── */}
            {selectedStage.stageNumber === 7 && (
              <div>
                {!isEditing ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    <div style={infoCardStyle}>
                      <div style={infoLabelStyle}>Kickoff Session Status</div>
                      <div style={{ ...infoValueStyle, color: sessionsData[0]?.status === 'completed' ? '#34D399' : 'var(--gold)' }}>
                        {sessionsData[0]?.status ? sessionsData[0].status.toUpperCase() : 'SCHEDULED'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
                        {sessionsData[0]?.scheduled_at ? new Date(sessionsData[0].scheduled_at).toLocaleString() : 'Kickoff session scheduled'}
                      </div>
                    </div>
                    <div style={infoCardStyle}>
                      <div style={infoLabelStyle}>Kickoff &amp; SOAP Delivery Notes</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-lt)', fontStyle: 'italic' }}>
                        {sessionsData[0]?.notes || 'No kickoff session notes recorded.'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={fieldLabelStyle}>Coach Kickoff &amp; Delivery Notes</label>
                    <textarea
                      value={editFormData.notes || ''}
                      onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })}
                      style={{ ...inputStyle, height: 70 }}
                      placeholder="Enter live kickoff notes, athlete cues, or voice SOAP summary"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── PHASE 8: SUNDAY INTELLIGENCE DOSSIER & TRIAGE ── */}
            {selectedStage.stageNumber === 8 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <div style={{ ...infoCardStyle, border: '1px solid rgba(212,160,23,0.35)', background: 'linear-gradient(135deg, rgba(212,160,23,0.12) 0%, rgba(14,24,39,0.98) 100%)' }}>
                  <div style={infoLabelStyle}>Sunday Intelligence Dossier</div>
                  <div style={{ ...infoValueStyle, color: 'var(--gold-lt)' }}>
                    Active Telemetry &amp; S.O.A.P.
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--gray-lt)', margin: '4px 0 10px' }}>
                    ACWR workload ratios, kinetic movement pattern distribution, and clinical notes.
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <a
                      href={`/coach/clients/${profile.clientId}/dossier`}
                      className="tactile-btn"
                      style={{
                        padding: '6px 12px',
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                        color: '#080E14',
                        fontSize: 11,
                        fontWeight: 800,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 2px 8px rgba(212,160,23,0.3)',
                      }}
                    >
                      <GaaIcon name="crown" size={12} tone="inherit" />
                      <span>Launch Sunday Dossier (PDF)</span>
                      <span>➔</span>
                    </a>
                  </div>
                </div>

                <div style={infoCardStyle}>
                  <div style={infoLabelStyle}>Weekly Biofeedback Review</div>
                  <div style={{ ...infoValueStyle, color: '#38BDF8' }}>
                    Weekly Check-Ins Console
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--gray)', margin: '4px 0 10px' }}>
                    Review athlete self-reported sleep, stress, soreness, and coach notes.
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <a
                      href={`/coach/clients/${profile.clientId}?tab=checkins#workspace-tab-content`}
                      className="tactile-btn"
                      style={{
                        padding: '6px 12px',
                        borderRadius: 4,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'var(--white)',
                        fontSize: 11,
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>Review Check-Ins Workspace</span>
                      <span>➔</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* ── PHASE 9: LIFECYCLE GOVERNANCE & RETENTION ── */}
            {selectedStage.stageNumber >= 9 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div style={infoCardStyle}>
                  <div style={infoLabelStyle}>Lifecycle Stage</div>
                  <div style={{ ...infoValueStyle, color: '#38BDF8' }}>
                    {selectedStage.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
                    Continuous athlete adherence, readiness triage, and retention audit
                  </div>
                </div>
                <div style={infoCardStyle}>
                  <div style={infoLabelStyle}>Maintenance Governance</div>
                  <div style={{ fontSize: 12.5, color: '#34D399', fontWeight: 700 }}>
                    ✓ 7/7 Onboarding Complete
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray-lt)', marginTop: 2 }}>
                    Athlete is in active training lifecycle
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. STAGE MILESTONES CHECKLIST */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray-lt)', marginBottom: 8 }}>
              Required Stage Milestones &amp; Actions
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {selectedStage.milestones.map(m => {
                const targetHref = m.actionHref || selectedStage.actionHref
                return (
                  <a
                    key={m.key}
                    href={targetHref}
                    onClick={e => handleActionNavigation(e, targetHref, selectedStage.actionTab)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: m.completed ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${m.completed ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      textDecoration: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: m.completed ? '#10B981' : 'var(--gray)', fontWeight: 900, fontSize: 12 }}>
                        {m.completed ? '✓' : '○'}
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: m.completed ? 'var(--white)' : 'var(--gray-lt)' }}>
                        {m.label}
                      </span>
                      {m.detail && <span style={{ fontSize: 11, color: 'var(--gray)' }}>· {m.detail}</span>}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 800 }}>
                      {m.actionLabel || 'Execute'} ➔
                    </span>
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const infoCardStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 8,
  padding: '12px 14px',
}

const infoLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--gray)',
  marginBottom: 4,
}

const infoValueStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--white)',
}

const fieldLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 10.5,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--gold-lt)',
  marginBottom: 4,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(0, 0, 0, 0.4)',
  border: '1px solid rgba(212, 160, 23, 0.4)',
  borderRadius: 6,
  padding: '8px 10px',
  color: '#FFFFFF',
  fontSize: 13,
  outline: 'none',
}
