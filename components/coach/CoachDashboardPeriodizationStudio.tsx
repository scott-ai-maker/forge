'use client'

import React, { useState, useMemo } from 'react'
import CoachCustomPeriodizationStudio from '@/components/coach/studio/CoachCustomPeriodizationStudio'
import GaaIcon from '@/components/ui/GaaIcon'

export interface ClientSummaryOption {
  id: string
  fullName: string
  email: string
  goal?: string | null
  phase?: number | null
  phaseName?: string | null
  equipmentAccess?: string[]
  sessionsPerWeek?: number | null
  age?: number | null
  sex?: string | null
  experienceLevel?: string | null
  medicalConditions?: string | null
  contraindications?: string[]
  ohsaCompensations?: string[]
  existingPlan?: {
    id?: string | null
    name?: string | null
    goal?: string | null
    nasm_opt_phase?: number | null
    phase_name?: string | null
    sessions_per_week?: number | null
    plan_json?: Record<string, unknown> | null
  } | null
}

interface CoachDashboardPeriodizationStudioProps {
  clients: ClientSummaryOption[]
  initialSelectedClientId?: string
}

export default function CoachDashboardPeriodizationStudio({
  clients,
  initialSelectedClientId,
}: CoachDashboardPeriodizationStudioProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    if (initialSelectedClientId) return initialSelectedClientId
    return clients[0]?.id || 'sandbox-athlete'
  })

  const selectedClient = useMemo(() => {
    if (selectedClientId === 'sandbox-athlete') {
      return {
        id: 'sandbox-athlete',
        fullName: 'New Athlete / Template Sandbox',
        email: 'sandbox@forgeathletic.com',
        goal: 'General Fitness & Recomposition',
        phase: 1,
        phaseName: 'Phase 1: Stabilization Endurance',
        equipmentAccess: ['dumbbell', 'band', 'stability ball', 'bodyweight'],
        sessionsPerWeek: 3,
        age: 34,
        medicalConditions: null,
        contraindications: [],
        ohsaCompensations: [],
        existingPlan: null,
      } as ClientSummaryOption
    }
    return clients.find(c => c.id === selectedClientId) || clients[0] || {
      id: 'sandbox-athlete',
      fullName: 'New Athlete / Template Sandbox',
      email: 'sandbox@forgeathletic.com',
      goal: 'General Fitness',
      phase: 1,
      phaseName: 'Phase 1: Stabilization Endurance',
      equipmentAccess: ['dumbbell', 'band', 'bodyweight'],
      sessionsPerWeek: 3,
      age: 30,
      medicalConditions: null,
      contraindications: [],
      ohsaCompensations: [],
      existingPlan: null,
    }
  }, [clients, selectedClientId])

  const goalType = useMemo((): 'fat_loss' | 'hypertrophy' | 'performance' | 'general_fitness' => {
    const rawGoal = (selectedClient.goal || '').toLowerCase()
    if (rawGoal.includes('fat') || rawGoal.includes('loss') || rawGoal.includes('lean')) return 'fat_loss'
    if (rawGoal.includes('hyper') || rawGoal.includes('muscle') || rawGoal.includes('mass')) return 'hypertrophy'
    if (rawGoal.includes('power') || rawGoal.includes('athletic') || rawGoal.includes('perf')) return 'performance'
    return 'fat_loss'
  }, [selectedClient.goal])

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* ── Athlete selector ── */}
      <div className="coach-builder-athlete-bar">
        <label htmlFor="coach-studio-client-select" className="coach-builder-athlete-label">
          <GaaIcon name="user" size={14} tone="gold" />
          Building for
        </label>
        <select
          id="coach-studio-client-select"
          value={selectedClientId}
          onChange={e => setSelectedClientId(e.target.value)}
          className="coach-builder-athlete-select"
        >
          <option value="sandbox-athlete">New athlete (template sandbox)</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>
              {c.fullName}
            </option>
          ))}
        </select>
      </div>

      {/* ── Active Studio Instance for Selected Client ── */}
      <CoachCustomPeriodizationStudio
        key={selectedClient.id}
        clientId={selectedClient.id}
        clientName={selectedClient.fullName}
        clientAge={selectedClient.age}
        initialGoal={goalType}
        initialPhase={selectedClient.phase || 1}
        initialEquipmentAccess={selectedClient.equipmentAccess && selectedClient.equipmentAccess.length > 0 ? selectedClient.equipmentAccess : ['dumbbell', 'band', 'bodyweight']}
        initialSessionsPerWeek={selectedClient.sessionsPerWeek || 3}
        initialCompensations={selectedClient.ohsaCompensations}
        contraindicationTags={selectedClient.contraindications}
        contraindicationNotes={selectedClient.medicalConditions ? [selectedClient.medicalConditions] : []}
        injuriesLimitations={selectedClient.medicalConditions}
        existingPlan={selectedClient.existingPlan}
        clientGoalLabel={selectedClient.goal}
        clientPhaseName={selectedClient.phaseName}
        clientSex={selectedClient.sex}
        clientExperienceLevel={selectedClient.experienceLevel}
      />
    </div>
  )
}
