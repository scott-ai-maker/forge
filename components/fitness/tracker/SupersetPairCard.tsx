'use client'

import React, { useState, useMemo } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import { SupersetPair } from '@/lib/superset-pairing-engine'
import SetProgressionMatrix, { LoggedSetData } from './SetProgressionMatrix'
import { resolveGaaExerciseImage } from '@/lib/nasm-generated-images'
import { getNasmClinicalMovementCard } from '@/lib/nasm-clinical-movement-cards'
import { selectOnFocus, sanitizeNumericInput } from '@/lib/form-input-helpers'
import { calculateBioAdaptiveRestInterval } from '@/lib/bio-adaptive-rest-pacer'
import { parsePrescribedWorkingReps } from '@/lib/warmup-auto-populator'
import { isTimedStaticStretch, isFoamRollerExercise } from '@/lib/exercise-logging-helpers'
import { mapRirToRpe } from '@/lib/rpe-exertion-scale'

export interface SupersetDraftState {
  weight: string
  reps: string
  setNumber: string
  rpe: string
  rir: string
  tempo: string
  notes: string
  isWarmup: boolean
}

export interface SupersetPairCardProps {
  pair: SupersetPair
  sessionDate: string
  units: 'imperial' | 'metric'
  setLogsA: LoggedSetData[]
  setLogsB: LoggedSetData[]
  nasmOptPhase?: number
  onLogSet: (exercise: SupersetPair['exerciseA'], draft: SupersetDraftState & { restSeconds: number }) => void
  onOpenVideoModal?: (exerciseName: string) => void
  triggerHaptic?: (type: 'tap' | 'heavy' | 'success') => void
}

export default function SupersetPairCard({
  pair,
  sessionDate,
  units,
  setLogsA,
  setLogsB,
  onLogSet,
  onOpenVideoModal,
  triggerHaptic,
}: SupersetPairCardProps) {
  const [activeSub, setActiveSub] = useState<'A' | 'B'>('A')
  const [weightError, setWeightError] = useState('')

  const defaultRepsA = parsePrescribedWorkingReps(pair.exerciseA.reps || '10')
  const defaultRepsB = parsePrescribedWorkingReps(pair.exerciseB.reps || '10')

  const [drafts, setDrafts] = useState<Record<'A' | 'B', SupersetDraftState>>({
    A: {
      weight: '',
      reps: String(defaultRepsA),
      setNumber: '1',
      rpe: '',
      rir: '',
      tempo: pair.exerciseA.tempo || '2/0/2',
      notes: '',
      isWarmup: false,
    },
    B: {
      weight: '',
      reps: String(defaultRepsB),
      setNumber: '1',
      rpe: '',
      rir: '',
      tempo: pair.exerciseB.tempo || '2/0/2',
      notes: '',
      isWarmup: false,
    },
  })

  const currentEx = activeSub === 'A' ? pair.exerciseA : pair.exerciseB
  const currentDraft = drafts[activeSub]
  const currentLoggedSets = activeSub === 'A' ? setLogsA : setLogsB

  const cardA = getNasmClinicalMovementCard(pair.exerciseA.name)
  const cardB = getNasmClinicalMovementCard(pair.exerciseB.name)

  const targetSetsA = parseInt(String(pair.exerciseA.sets || '3'), 10) || 3
  const targetSetsB = parseInt(String(pair.exerciseB.sets || '3'), 10) || 3

  const completedSetsA = setLogsA.filter(s => !s.is_warmup && (!s.session_date || s.session_date === sessionDate)).length
  const completedSetsB = setLogsB.filter(s => !s.is_warmup && (!s.session_date || s.session_date === sessionDate)).length

  const isTimedCurrent = isTimedStaticStretch(currentEx.name, currentEx.block, currentEx.reps) || isFoamRollerExercise(currentEx.name)

  const projectedRestB = useMemo(() => {
    const rirB = drafts.B.rir ? Number(drafts.B.rir) : undefined
    const rpeB = drafts.B.rpe ? Number(drafts.B.rpe) : (rirB !== undefined ? mapRirToRpe(rirB) : undefined)
    return calculateBioAdaptiveRestInterval({
      exerciseName: pair.exerciseB.name,
      baseRestSeconds: pair.compoundRestSeconds,
      rpe: rpeB,
      rir: rirB,
      isWarmup: drafts.B.isWarmup,
    })
  }, [pair.exerciseB.name, pair.compoundRestSeconds, drafts.B.rpe, drafts.B.rir, drafts.B.isWarmup])

  const handleLogActiveSet = () => {
    if (!currentDraft.weight.trim() || !Number.isFinite(Number(currentDraft.weight)) || Number(currentDraft.weight) < 0) {
      setWeightError('Enter the weight used, or enter 0 for bodyweight / no added load.')
      return
    }
    setWeightError('')
    triggerHaptic?.('success')
    const restToApply = activeSub === 'A' ? pair.transitionRestSeconds : pair.compoundRestSeconds

    const rirVal = currentDraft.rir?.trim()
    const rpeVal = currentDraft.rpe?.trim()
    const mappedRpe = !rpeVal && rirVal && Number.isFinite(Number(rirVal))
      ? String(mapRirToRpe(Number(rirVal)))
      : currentDraft.rpe

    onLogSet(currentEx, {
      ...currentDraft,
      rpe: mappedRpe,
      restSeconds: restToApply,
    })
    setDrafts(prev => ({ ...prev, [activeSub]: { ...prev[activeSub], rpe: '', rir: '' } }))

    // Advance flow:
    // If A completed -> flip to B with same set number
    // If B completed -> flip back to A and increment set number
    if (activeSub === 'A') {
      setActiveSub('B')
    } else {
      setActiveSub('A')
      const nextSet = String(Number(currentDraft.setNumber) + 1)
      setDrafts(prev => ({
        A: { ...prev.A, setNumber: nextSet },
        B: { ...prev.B, setNumber: nextSet },
      }))
    }
  }

  const thumbImgA = resolveGaaExerciseImage(pair.exerciseA.name, false) || cardA.imageUrl || cardA.fallbackImageUrl || '/images/exercises/image-not-available.jpg'
  const thumbImgB = resolveGaaExerciseImage(pair.exerciseB.name, false) || cardB.imageUrl || cardB.fallbackImageUrl || '/images/exercises/image-not-available.jpg'

  return (
    <div
      className="fitness-superset-card"
      data-testid="superset-pair-card"
      style={{
        marginBottom: 16,
        background: 'linear-gradient(135deg, rgba(20, 26, 42, 0.95) 0%, rgba(10, 15, 26, 0.98) 100%)',
        border: '1.5px solid rgba(56, 189, 248, 0.4)',
        borderRadius: 10,
        padding: '14px 16px',
        minWidth: 0,
        maxWidth: '100%',
        boxSizing: 'border-box',
        boxShadow: '0 8px 24px rgba(0,0,0,0.6), 0 0 16px rgba(56, 189, 248, 0.12)',
      }}
      aria-label={`Superset Pair: ${pair.pairLabel}`}
    >
      {/* ── Superset Header Bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                background: 'rgba(56, 189, 248, 0.2)',
                color: '#38BDF8',
                border: '1px solid rgba(56, 189, 248, 0.5)',
                padding: '2px 7px',
                borderRadius: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <GaaIcon name="lightning" size={10} tone="cyan" />
              <span>{pair.pairLabel}</span>
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: '#E2E8F0' }}>
              {pair.categoryTitle}
            </span>
          </div>
          <details className="fitness-card-disclosure">
            <summary>Why this pairing</summary>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 6px' }}>{pair.rationale}</p>
          </details>
        </div>

        {/* Transition Rest vs Compound Rest Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span
            className="font-telemetry"
            style={{
              fontSize: 10,
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '2px 7px',
              borderRadius: 3,
              color: '#7DD3FC',
              fontWeight: 700,
            }}
            title="Immediate transition rest between 1A and 1B"
          >
            A ➔ B: {pair.transitionRestSeconds}s
          </span>
          <span
            className="font-telemetry"
            style={{
              fontSize: 10,
              background: projectedRestB.isBioPaced ? 'rgba(212, 160, 23, 0.28)' : 'rgba(212, 160, 23, 0.15)',
              border: projectedRestB.isBioPaced ? '1px solid rgba(212, 160, 23, 0.7)' : '1px solid rgba(212, 160, 23, 0.35)',
              padding: '2px 7px',
              borderRadius: 3,
              color: 'var(--gold-lt)',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
            title={projectedRestB.isBioPaced ? `Bio-Paced Compound Rest: ${projectedRestB.adaptationReason}` : 'Full restorative rest interval after completing 1B'}
          >
            {projectedRestB.isBioPaced && <GaaIcon name="lightning" size={9} tone="gold" />}
            Compound Rest: {projectedRestB.finalRestSeconds}s{projectedRestB.isBioPaced ? ` (${projectedRestB.deltaSeconds > 0 ? `+${projectedRestB.deltaSeconds}` : projectedRestB.deltaSeconds}s Bio-Paced)` : ''}
          </span>
        </div>
      </div>

      {/* ── Sub-Exercise Switcher Tabs (1A vs 1B) ── */}
      <div className="fitness-superset-switcher" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
        {/* Tab 1A */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic?.('tap')
            setActiveSub('A')
          }}
          className="tactile-btn"
          aria-pressed={activeSub === 'A'}
          style={{
            padding: '8px 10px',
            borderRadius: 6,
            background: activeSub === 'A' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
            border: activeSub === 'A' ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
            color: activeSub === 'A' ? '#FFFFFF' : '#94A3B8',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minWidth: 0,
            minHeight: 44,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbImgA}
            alt={pair.exerciseA.name}
            width={34}
            height={34}
            loading="lazy"
            onError={e => {
              ;(e.currentTarget as HTMLImageElement).src = '/images/exercises/image-not-available.jpg'
            }}
            style={{ width: 34, height: 34, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 9.5, fontWeight: 900, color: activeSub === 'A' ? '#38BDF8' : '#64748B', textTransform: 'uppercase' }}>
                Exercise A
              </span>
              {activeSub !== 'A' && <span style={{ fontSize: 9.5, color: completedSetsA >= targetSetsA ? '#34D399' : 'var(--gray)', fontWeight: 700 }}>
                {completedSetsA}/{targetSetsA}
              </span>}
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, overflowWrap: 'anywhere' }}>
              {pair.exerciseA.name}
            </div>
          </div>
        </button>

        {/* Tab 1B */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic?.('tap')
            setActiveSub('B')
          }}
          className="tactile-btn"
          aria-pressed={activeSub === 'B'}
          style={{
            padding: '8px 10px',
            borderRadius: 6,
            background: activeSub === 'B' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
            border: activeSub === 'B' ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
            color: activeSub === 'B' ? '#FFFFFF' : '#94A3B8',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minWidth: 0,
            minHeight: 44,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbImgB}
            alt={pair.exerciseB.name}
            width={34}
            height={34}
            loading="lazy"
            onError={e => {
              ;(e.currentTarget as HTMLImageElement).src = '/images/exercises/image-not-available.jpg'
            }}
            style={{ width: 34, height: 34, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 9.5, fontWeight: 900, color: activeSub === 'B' ? '#38BDF8' : '#64748B', textTransform: 'uppercase' }}>
                Exercise B
              </span>
              {activeSub !== 'B' && <span style={{ fontSize: 9.5, color: completedSetsB >= targetSetsB ? '#34D399' : 'var(--gray)', fontWeight: 700 }}>
                {completedSetsB}/{targetSetsB}
              </span>}
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, overflowWrap: 'anywhere' }}>
              {pair.exerciseB.name}
            </div>
          </div>
        </button>
      </div>

      <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 6 }}>
        {currentEx.sets} sets × {currentEx.reps} · Tempo {currentDraft.tempo}
      </div>
      {/* ── Active Sub-Exercise Set Progression Matrix ── */}
      <SetProgressionMatrix
        targetSets={currentEx.sets || 3}
        sessionDate={sessionDate}
        currentSetNumber={Number(currentDraft.setNumber) || 1}
        loggedSets={currentLoggedSets}
        units={units}
        onSelectSet={(setNum, prefillWeight, prefillReps) => {
          setDrafts(prev => ({
            ...prev,
            [activeSub]: {
              ...prev[activeSub],
              setNumber: String(setNum),
              weight: prefillWeight || prev[activeSub].weight,
              reps: prefillReps || prev[activeSub].reps,
            },
          }))
        }}
        onAddSet={nextSetNum => {
          setDrafts(prev => ({
            ...prev,
            [activeSub]: {
              ...prev[activeSub],
              setNumber: String(nextSetNum),
            },
          }))
        }}
        triggerHaptic={triggerHaptic}
      />

      {/* ── Inline Set Inputs: Reps, Weight & Steppers ── */}
      <div className="fitness-superset-load-inputs fitness-primary-set-inputs" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 8 }}>
        {/* Reps */}
        <div>
          <label style={{ fontSize: 10.5, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700, marginBottom: 4, display: 'block' }}>
            Reps ({activeSub})
          </label>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                triggerHaptic?.('tap')
                const cur = Number(currentDraft.reps) || 8
                setDrafts(prev => ({ ...prev, [activeSub]: { ...prev[activeSub], reps: String(Math.max(1, cur - 1)) } }))
              }}
              style={{ width: 32, height: 38, borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF', cursor: 'pointer', fontWeight: 800 }}
              aria-label="Decrease reps"
            >
              −
            </button>
            <input
              type="text"
              aria-label="Number of reps"
              inputMode="numeric"
              onFocus={selectOnFocus}
              value={currentDraft.reps}
              onChange={e => {
                const val = sanitizeNumericInput(e.target.value)
                setDrafts(prev => ({ ...prev, [activeSub]: { ...prev[activeSub], reps: val } }))
              }}
              style={{ flex: 1, height: 38, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#FFFFFF', textAlign: 'center', fontWeight: 800, fontSize: 13 }}
            />
            <button
              type="button"
              onClick={() => {
                triggerHaptic?.('tap')
                const cur = Number(currentDraft.reps) || 8
                setDrafts(prev => ({ ...prev, [activeSub]: { ...prev[activeSub], reps: String(cur + 1) } }))
              }}
              style={{ width: 32, height: 38, borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF', cursor: 'pointer', fontWeight: 800 }}
              aria-label="Increase reps"
            >
              +
            </button>
          </div>
        </div>

        {/* Weight */}
        <div>
          <label style={{ fontSize: 10.5, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700, marginBottom: 4, display: 'block' }}>
            Weight ({units === 'imperial' ? 'lb' : 'kg'})
          </label>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                triggerHaptic?.('tap')
                const step = units === 'imperial' ? 5 : 2.5
                const cur = Number(currentDraft.weight) || 0
                setDrafts(prev => ({ ...prev, [activeSub]: { ...prev[activeSub], weight: String(Math.max(0, cur - step)) } }))
              }}
              style={{ width: 32, height: 38, borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF', cursor: 'pointer', fontWeight: 800 }}
              aria-label="Decrease weight"
            >
              −
            </button>
            <input
              type="text"
              inputMode="decimal"
              aria-label={`Weight in ${units === 'imperial' ? 'pounds' : 'kilograms'}`}
              placeholder="—"
              title="Enter the weight used, or 0 for bodyweight / no added load."
              onFocus={selectOnFocus}
              value={currentDraft.weight}
              onChange={e => {
                const val = sanitizeNumericInput(e.target.value)
                setDrafts(prev => ({ ...prev, [activeSub]: { ...prev[activeSub], weight: val } }))
              }}
              style={{ flex: 1, height: 38, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#FFFFFF', textAlign: 'center', fontWeight: 800, fontSize: 13 }}
            />
            <button
              type="button"
              onClick={() => {
                triggerHaptic?.('tap')
                const step = units === 'imperial' ? 5 : 2.5
                const cur = Number(currentDraft.weight) || 0
                setDrafts(prev => ({ ...prev, [activeSub]: { ...prev[activeSub], weight: String(cur + step) } }))
              }}
              style={{ width: 32, height: 38, borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF', cursor: 'pointer', fontWeight: 800 }}
              aria-label="Increase weight"
            >
              +
            </button>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--gray)', marginTop: 3 }}>
            0 = no added load
          </div>
        </div>
      </div>

      {/* Video Demonstration Modal Trigger */}
      {onOpenVideoModal && (
        <div style={{ marginTop: 8, textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => onOpenVideoModal(currentEx.name)}
            aria-label={`Watch demonstration for ${currentEx.name}`}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--gold-lt)',
              fontSize: 10.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              minHeight: 44,
            }}
          >
            <GaaIcon name="play" size={11} tone="gold" />
            <span>Watch demonstration</span>
          </button>
        </div>
      )}

      <div data-testid="superset-set-details" className="fitness-inline-set-controls" style={{ marginTop: 8 }}>
        {!isTimedCurrent ? (
          <div>
            <label style={{ fontSize: 10.5, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700, marginBottom: 4, display: 'block' }}>
              RiR
            </label>
            <input
              aria-label="Reps in reserve (0-6)"
              placeholder="Optional (0–6)"
              title="RiR: how many more reps you could perform (0-6)."
              type="text"
              inputMode="decimal"
              value={currentDraft.rir}
              onFocus={selectOnFocus}
              onChange={event => {
                const value = sanitizeNumericInput(event.target.value)
                setDrafts(prev => ({ ...prev, [activeSub]: { ...prev[activeSub], rir: value } }))
              }}
              style={{ width: '100%', minWidth: 0, minHeight: 44, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#FFFFFF', fontSize: 16, padding: 8, boxSizing: 'border-box' }}
            />
          </div>
        ) : (
          <div>
            <label style={{ fontSize: 10.5, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700, marginBottom: 4, display: 'block' }}>
              RPE
            </label>
            <input
              aria-label="Rate of perceived exertion (1-10)"
              placeholder="Optional (1–10)"
              title="RPE: how hard this set felt (1-10)."
              type="text"
              inputMode="decimal"
              value={currentDraft.rpe}
              onFocus={selectOnFocus}
              onChange={event => {
                const value = sanitizeNumericInput(event.target.value)
                setDrafts(prev => ({ ...prev, [activeSub]: { ...prev[activeSub], rpe: value } }))
              }}
              style={{ width: '100%', minWidth: 0, minHeight: 44, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#FFFFFF', fontSize: 16, padding: 8, boxSizing: 'border-box' }}
            />
          </div>
        )}
      </div>
      {/* ── 1-Tap Log Set & Auto-Advance Button ── */}
      <div style={{ marginTop: 12 }}>
        {weightError && <p role="alert" style={{ color: '#FCA5A5', fontSize: 12 }}>{weightError}</p>}
        <button
          type="button"
          onClick={handleLogActiveSet}
          className="tactile-btn"
          style={{
            width: '100%',
            minHeight: 44,
            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            border: '1px solid #38BDF8',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 12.5,
            padding: '11px 16px',
            borderRadius: 6,
            cursor: 'pointer',
            boxShadow: '0 0 14px rgba(56, 189, 248, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <GaaIcon name="lightning" size={13} tone="white" />
          <span>
            Log set & start rest
          </span>
        </button>
      </div>

    </div>
  )
}
