'use client'

import React, { useState, useMemo } from 'react'
import CoachCustomPeriodizationStudio from '@/components/coach/studio/CoachCustomPeriodizationStudio'
import GaaIcon from '@/components/ui/GaaIcon'
import type { GeneratedMacrocyclePlan } from '@/lib/rag-nasm-program-generator'

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

  const [notification, setNotification] = useState<string | null>(null)

  const selectedClient = useMemo(() => {
    if (selectedClientId === 'sandbox-athlete') {
      return {
        id: 'sandbox-athlete',
        fullName: 'New Athlete / Template Sandbox',
        email: 'sandbox@forgeathletic.com',
        goal: 'General Fitness & Recomposition',
        phase: 1,
        phaseName: 'Phase 1: Stabilization Endurance',
        equipmentAccess: ['dumbbell', 'band', 'reebok step', 'stability ball', 'bodyweight'],
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

  const handlePlanAssigned = (plan: GeneratedMacrocyclePlan) => {
    setNotification(`✓ Successfully synthesized & deployed "${plan.planTitle}" for ${selectedClient.fullName}!`)
    setTimeout(() => setNotification(null), 6000)
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* ── Top Athlete Selector & Studio Header ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(20,28,48,0.95) 0%, rgba(10,14,24,0.98) 100%)',
          border: '1px solid rgba(212,160,23,0.35)',
          borderRadius: 12,
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'rgba(212,160,23,0.15)',
              border: '1px solid var(--gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GaaIcon name="brain" size={24} tone="gold" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: 800,
                  background: 'rgba(212,160,23,0.2)',
                  color: 'var(--gold-lt)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  border: '1px solid rgba(212,160,23,0.4)',
                }}
              >
                Gemini 3.8 Flash Engine
              </span>
              <span style={{ color: 'var(--gray)', fontSize: 12 }}>
                NASM OPT™ Periodization Studio
              </span>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontWeight: 700,
                fontSize: 20,
                color: '#FFFFFF',
                margin: '4px 0 0',
                letterSpacing: '0.03em',
              }}
            >
              COACH GORDON AI CUSTOM PROGRAM STUDIO
            </h2>
          </div>
        </div>

        {/* Client Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 280 }}>
          <label
            htmlFor="coach-studio-client-select"
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--gold-lt)',
              whiteSpace: 'nowrap',
            }}
          >
            Target Athlete:
          </label>
          <select
            id="coach-studio-client-select"
            value={selectedClientId}
            onChange={e => setSelectedClientId(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'var(--navy)',
              border: '1px solid rgba(212,160,23,0.5)',
              borderRadius: 8,
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="sandbox-athlete">★ Sandbox Mode / New Athlete Template</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.fullName} ({c.email})
              </option>
            ))}
          </select>
        </div>
      </div>

      {notification && (
        <div
          style={{
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid #10B981',
            color: '#34D399',
            padding: '12px 18px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {notification}
        </div>
      )}

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
        onPlanAssigned={handlePlanAssigned}
      />
    </div>
  )
}
