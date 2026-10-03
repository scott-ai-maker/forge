'use client'

import React, { useState } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  TravelLocationScenario,
  TRAVEL_SCENARIO_META,
  adaptFullPlanForTravel,
} from '@/lib/travel-workout-adapter'

export interface CoachTravelPlanData {
  id?: string | null
  name?: string | null
  goal?: string | null
  nasm_opt_phase?: number | null
  phase_name?: string | null
  sessions_per_week?: number | null
  estimated_duration_mins?: number | null
  plan_json?: {
    isTravelAdapted?: boolean
    travelScenario?: TravelLocationScenario | string
    workouts?: Array<{
      day?: number
      focus?: string
      scheduledDate?: string | null
      notes?: string | null
      exercises?: Array<{
        name?: string
        originalBarbellName?: string
        sets?: string | number
        reps?: string | number
        tempo?: string | null
        rest?: string | null
        notes?: string | null
        [key: string]: unknown
      }>
      [key: string]: unknown
    }>
    [key: string]: unknown
  } | null
}

interface CoachTravelRecalibratorModalProps {
  isOpen: boolean
  clientId: string
  clientName?: string
  currentPlan: CoachTravelPlanData | null
  onClose: () => void
  onPlanDeployed: (newPlan: CoachTravelPlanData) => void
}

export default function CoachTravelRecalibratorModal({
  isOpen,
  clientId,
  clientName = 'Athlete',
  currentPlan,
  onClose,
  onPlanDeployed,
}: CoachTravelRecalibratorModalProps) {
  const [selectedScenario, setSelectedScenario] = useState<TravelLocationScenario>('hotel_dumbbells_only')
  const [customNotes, setCustomNotes] = useState('')
  const [isDeploying, setIsDeploying] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const isCurrentPlanTravel = Boolean(currentPlan?.plan_json?.isTravelAdapted)
  const currentTravelScenario = currentPlan?.plan_json?.travelScenario as TravelLocationScenario | undefined

  // Compute live preview of adaptation
  const previewAdapted = currentPlan?.plan_json
    ? adaptFullPlanForTravel(currentPlan.plan_json, selectedScenario, currentPlan.name || undefined)
    : null

  const handleDeploy = async () => {
    setIsDeploying(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const res = await fetch(`/api/coach/clients/${clientId}/travel-recalibrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: selectedScenario,
          customNotes: customNotes.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to recalibrate plan')
      }

      setSuccessMessage(data.message || 'Travel protocol deployed!')
      onPlanDeployed(data.plan)
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err: unknown) {
      const errObj = err as { message?: string }
      setErrorMessage(errObj?.message || 'Failed to deploy travel protocol')
    } finally {
      setIsDeploying(false)
    }
  }

  const scenarios: TravelLocationScenario[] = [
    'hotel_dumbbells_only',
    'hotel_cables_cardio',
    'hotel_room_bands',
    'commercial_full_gym',
  ]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100050,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #0D1624 0%, #080E16 100%)',
          border: '1.5px solid rgba(197, 160, 89, 0.4)',
          borderRadius: 14,
          width: 'min(760px, 100%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px 28px',
          display: 'grid',
          gap: 16,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(197, 160, 89, 0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(197, 160, 89, 0.15)',
                border: '1px solid var(--gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GaaIcon name="toolbox" size={18} tone="gold" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontFamily: 'Raleway, sans-serif', fontWeight: 800, color: '#FFFFFF' }}>
                Instant Travel & Hospitality Program Re-Calibrator
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--gray)' }}>
                {clientName} · 1-Click Equipment Adaptation Engine
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--gray)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 4,
            }}
            aria-label="Close"
          >
            <GaaIcon name="close" size={16} tone="slate" />
          </button>
        </div>

        {/* Current Plan Status Banner */}
        <div
          style={{
            padding: '10px 14px',
            background: isCurrentPlanTravel ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.1)',
            border: isCurrentPlanTravel ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
          }}
        >
          <div>
            <span style={{ fontWeight: 700, color: isCurrentPlanTravel ? '#FCD34D' : '#6EE7B7', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name={isCurrentPlanTravel ? 'plane' : 'barbell'} size={13} tone={isCurrentPlanTravel ? 'amber' : 'emerald'} />
              <span>{isCurrentPlanTravel ? 'Currently in Travel Mode' : 'Currently in Standard Gym Mode'}</span>
            </span>
            <div style={{ color: '#E2E8F0', marginTop: 2 }}>
              Active Plan: <strong>{currentPlan?.name || 'Assigned Protocol'}</strong>
              {currentTravelScenario && ` · (${TRAVEL_SCENARIO_META[currentTravelScenario]?.label})`}
            </div>
          </div>
        </div>

        {/* Scenario Selection Grid */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-lt)', display: 'block', marginBottom: 8 }}>
            Select Travel / Facility Environment:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
            {scenarios.map(sc => {
              const meta = TRAVEL_SCENARIO_META[sc]
              const isSelected = selectedScenario === sc
              const isStandard = sc === 'commercial_full_gym'

              return (
                <button
                  key={sc}
                  type="button"
                  onClick={() => setSelectedScenario(sc)}
                  className="tactile-btn"
                  style={{
                    padding: '12px 14px',
                    textAlign: 'left',
                    background: isSelected ? 'rgba(197, 160, 89, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected ? '1.5px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'grid',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <GaaIcon name={isStandard ? 'barbell' : sc === 'hotel_dumbbells_only' ? 'hotel' : sc === 'hotel_cables_cardio' ? 'building' : 'luggage'} size={16} tone="gold" />
                      <strong style={{ fontSize: 13, color: isSelected ? 'var(--gold-lt)' : '#FFFFFF' }}>
                        {meta.label.split('(')[0].trim()}
                      </strong>
                    </div>
                    {isSelected && (
                      <span style={{ fontSize: 10, background: 'var(--gold)', color: '#080E14', padding: '1px 6px', borderRadius: 3, fontWeight: 800 }}>
                        Active Choice
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 11.5, color: '#94A3B8', lineHeight: 1.4 }}>
                    {meta.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Live Adapted Exercises Preview */}
        {previewAdapted && previewAdapted.planJson?.workouts?.length > 0 && (
          <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-lt)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <GaaIcon name="search" size={12} tone="gold" />
                <span>Live Routine Adaptation Preview: {previewAdapted.planTitle}</span>
              </span>
              <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                {previewAdapted.planJson.workouts.length} Workout Days Adapted
              </span>
            </div>

            <div style={{ maxHeight: 160, overflowY: 'auto', display: 'grid', gap: 6 }}>
              {previewAdapted.planJson.workouts[0]?.exercises?.slice(0, 4).map((ex: { name?: string; originalBarbellName?: string; sets?: string | number; reps?: string | number; tempo?: string }, idx: number) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: '#FFFFFF', fontWeight: 600 }}>{ex.name}</div>
                    {ex.originalBarbellName && ex.originalBarbellName !== ex.name && (
                      <div style={{ fontSize: 10.5, color: 'var(--gold-lt)' }}>
                        Adapted from: <em>{ex.originalBarbellName}</em>
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                    <span style={{ color: 'var(--gray)', fontSize: 11 }}>{ex.sets} sets × {ex.reps}</span>
                    {ex.tempo && <span style={{ color: 'var(--gold-lt)', fontSize: 11, marginLeft: 6 }}>({ex.tempo})</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coach Custom Note Input */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', display: 'block', marginBottom: 4 }}>
            Optional Coach Directive to Athlete:
          </label>
          <input
            type="text"
            value={customNotes}
            onChange={e => setCustomNotes(e.target.value)}
            placeholder="e.g. 'Use 35 lb dumbbells on goblet squats and focus on a strict 4-second negative descent.'"
            style={{
              width: '100%',
              padding: '10px 12px',
              background: '#060B12',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 6,
              color: '#FFFFFF',
              fontSize: 13,
              boxSizing: 'border-box',
              outline: 'none',
              fontFamily: 'Raleway, sans-serif',
            }}
          />
        </div>

        {errorMessage && (
          <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', borderRadius: 6, color: '#FCA5A5', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="alert-triangle" size={13} tone="ruby" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: 6, color: '#6EE7B7', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="check" size={13} tone="emerald" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 14 }}>
          <button
            type="button"
            onClick={onClose}
            className="tactile-btn"
            disabled={isDeploying}
            style={{
              padding: '10px 16px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 6,
              color: '#FFFFFF',
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDeploy}
            disabled={isDeploying || !currentPlan}
            className="tactile-btn"
            style={{
              padding: '10px 22px',
              background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
              border: 'none',
              borderRadius: 6,
              color: '#080E14',
              fontSize: 13,
              fontWeight: 800,
              cursor: isDeploying || !currentPlan ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(197, 160, 89, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              opacity: isDeploying || !currentPlan ? 0.6 : 1,
            }}
          >
            <GaaIcon name="check" size={14} style={{ color: '#080E14', stroke: '#080E14' }} />
            <span>
              {isDeploying
                ? 'Recalibrating & Dispatching...'
                : selectedScenario === 'commercial_full_gym'
                ? 'Restore Commercial Gym Split'
                : 'Deploy Travel Split to Athlete'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

