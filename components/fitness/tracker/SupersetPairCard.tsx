'use client'

import React, { useState, useMemo } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import { SupersetPair } from '@/lib/superset-pairing-engine'
import SetProgressionMatrix, { LoggedSetData } from './SetProgressionMatrix'
import PlateAdjustmentPresets from './PlateAdjustmentPresets'
import RpeRirExertionSelector from './RpeRirExertionSelector'
import RepCadenceMetronome from './RepCadenceMetronome'
import IntensityProtocolDrawer from './IntensityProtocolDrawer'
import OneRepMaxPercentageMatrix from './OneRepMaxPercentageMatrix'
import AutoregulationDeloadAdvisor from './AutoregulationDeloadAdvisor'
import WarmUpRampDrawer from './WarmUpRampDrawer'
import { resolveGaaExerciseImage } from '@/lib/nasm-generated-images'
import { getNasmClinicalMovementCard } from '@/lib/nasm-clinical-movement-cards'
import { selectOnFocus, sanitizeNumericInput } from '@/lib/form-input-helpers'
import { calculate1Rm } from '@/lib/progressive-overload-engine'
import { calculateBioAdaptiveRestInterval } from '@/lib/bio-adaptive-rest-pacer'
import { parsePrescribedWorkingReps } from '@/lib/warmup-auto-populator'

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
  onOpenPlateCalculator?: (targetWeightLbs: number) => void
  onOpenVideoModal?: (exerciseName: string) => void
  triggerHaptic?: (type: 'tap' | 'heavy' | 'success') => void
}

export default function SupersetPairCard({
  pair,
  sessionDate,
  units,
  setLogsA,
  setLogsB,
  nasmOptPhase,
  onLogSet,
  onOpenPlateCalculator,
  onOpenVideoModal,
  triggerHaptic,
}: SupersetPairCardProps) {
  const [activeSub, setActiveSub] = useState<'A' | 'B'>('A')
  const [openRamp, setOpenRamp] = useState(false)

  const defaultRepsA = parseInt(String(pair.exerciseA.reps || '10').replace(/[^0-9]/g, ''), 10) || 10
  const defaultRepsB = parseInt(String(pair.exerciseB.reps || '10').replace(/[^0-9]/g, ''), 10) || 10

  const [drafts, setDrafts] = useState<Record<'A' | 'B', SupersetDraftState>>({
    A: {
      weight: units === 'imperial' ? '135' : '60',
      reps: String(defaultRepsA),
      setNumber: '1',
      rpe: '8',
      rir: '2',
      tempo: pair.exerciseA.tempo || '2/0/2',
      notes: '',
      isWarmup: false,
    },
    B: {
      weight: units === 'imperial' ? '135' : '60',
      reps: String(defaultRepsB),
      setNumber: '1',
      rpe: '8',
      rir: '2',
      tempo: pair.exerciseB.tempo || '2/0/2',
      notes: '',
      isWarmup: false,
    },
  })

  const currentEx = activeSub === 'A' ? pair.exerciseA : pair.exerciseB
  const currentDraft = drafts[activeSub]
  const currentLoggedSets = activeSub === 'A' ? setLogsA : setLogsB

  const activeHistoricalMax1RmLbs = useMemo(() => {
    return currentLoggedSets.reduce((max, log) => {
      const w = (log.weight_kg ?? 0) * 2.20462
      const r = Number(log.reps) || 0
      if (w <= 0 || r <= 0 || log.is_warmup) return max
      const calc = calculate1Rm(w, r)
      return Math.max(max, calc.average1RmLbs)
    }, 0)
  }, [currentLoggedSets])

  const cardA = getNasmClinicalMovementCard(pair.exerciseA.name)
  const cardB = getNasmClinicalMovementCard(pair.exerciseB.name)
  const activeCard = activeSub === 'A' ? cardA : cardB

  const targetSetsA = parseInt(String(pair.exerciseA.sets || '3'), 10) || 3
  const targetSetsB = parseInt(String(pair.exerciseB.sets || '3'), 10) || 3

  const completedSetsA = setLogsA.filter(s => !s.is_warmup && (!s.session_date || s.session_date === sessionDate)).length
  const completedSetsB = setLogsB.filter(s => !s.is_warmup && (!s.session_date || s.session_date === sessionDate)).length

  const projectedRestB = useMemo(() => {
    return calculateBioAdaptiveRestInterval({
      exerciseName: pair.exerciseB.name,
      baseRestSeconds: pair.compoundRestSeconds,
      rpe: drafts.B.rpe,
      rir: drafts.B.rir,
      isWarmup: drafts.B.isWarmup,
    })
  }, [pair.exerciseB.name, pair.compoundRestSeconds, drafts.B.rpe, drafts.B.rir, drafts.B.isWarmup])

  const handleLogActiveSet = () => {
    triggerHaptic?.('success')
    const restToApply = activeSub === 'A' ? pair.transitionRestSeconds : pair.compoundRestSeconds

    onLogSet(currentEx, {
      ...currentDraft,
      restSeconds: restToApply,
    })

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
      style={{
        marginBottom: 16,
        background: 'linear-gradient(135deg, rgba(20, 26, 42, 0.95) 0%, rgba(10, 15, 26, 0.98) 100%)',
        border: '1.5px solid rgba(56, 189, 248, 0.4)',
        borderRadius: 10,
        padding: '14px 16px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>
            {pair.rationale}
          </div>
        </div>

        {/* Transition Rest vs Compound Rest Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {/* Tab 1A */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic?.('tap')
            setActiveSub('A')
          }}
          className="tactile-btn"
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
          }}
        >
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
                Exercise 1A
              </span>
              <span style={{ fontSize: 9.5, color: completedSetsA >= targetSetsA ? '#34D399' : 'var(--gray)', fontWeight: 700 }}>
                {completedSetsA}/{targetSetsA}
              </span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
          }}
        >
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
                Exercise 1B
              </span>
              <span style={{ fontSize: 9.5, color: completedSetsB >= targetSetsB ? '#34D399' : 'var(--gray)', fontWeight: 700 }}>
                {completedSetsB}/{targetSetsB}
              </span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {pair.exerciseB.name}
            </div>
          </div>
        </button>
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

      {/* ── Progressive Warm-Up Ramp-Up Wizard for Active Sub-Exercise ── */}
      <WarmUpRampDrawer
        exerciseKey={`ss-${pair.id}-${activeSub}`}
        exerciseName={currentEx.name}
        draftWeight={currentDraft.weight}
        oneRmLbs={activeHistoricalMax1RmLbs > 0 ? activeHistoricalMax1RmLbs : undefined}
        units={units}
        isOpen={openRamp}
        onToggle={() => setOpenRamp(prev => !prev)}
        prescribedReps={currentEx.reps}
        onPopulateWorkingWeight={(workingWeight, targetReps) => {
          triggerHaptic?.('success')
          setDrafts(prev => ({
            ...prev,
            [activeSub]: {
              ...prev[activeSub],
              weight: workingWeight,
              reps: targetReps || parsePrescribedWorkingReps(currentEx.reps),
              isWarmup: false,
              setNumber: '1',
              notes: '',
            },
          }))
        }}
        onLogWarmupStage={(stageWeight, reps, restSecs, stageNum, totalStages, stageTitle) => {
          const stageTag = totalStages && stageTitle
            ? `[Superset WarmUp ${stageNum}/${totalStages}: ${stageTitle}]`
            : `[Superset Warm-up Stage ${stageNum}]`
          const isFinalStage = Boolean(totalStages && stageNum >= totalStages)

          onLogSet(currentEx, {
            ...currentDraft,
            weight: stageWeight,
            reps: String(reps),
            restSeconds: restSecs,
            isWarmup: true,
            notes: stageTag,
          })

          if (isFinalStage) {
            setTimeout(() => {
              setDrafts(prev => ({
                ...prev,
                [activeSub]: {
                  ...prev[activeSub],
                  weight: currentDraft.weight,
                  reps: parsePrescribedWorkingReps(currentEx.reps),
                  isWarmup: false,
                  setNumber: '1',
                  notes: '',
                },
              }))
            }, 100)
          }
        }}
        triggerHaptic={triggerHaptic}
      />

      {/* ── Inline Set Inputs: Reps, Weight & Steppers ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
        {/* Reps */}
        <div>
          <label style={{ fontSize: 10.5, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700, marginBottom: 4, display: 'block' }}>
            Reps ({activeSub === 'A' ? '1A' : '1B'})
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
        </div>
      </div>

      {/* ── Plate Adjustment Presets for Active Sub-Exercise ── */}
      <PlateAdjustmentPresets
        exerciseName={currentEx.name}
        currentWeight={currentDraft.weight}
        units={units}
        onChangeWeight={newWeight => {
          setDrafts(prev => ({ ...prev, [activeSub]: { ...prev[activeSub], weight: newWeight } }))
        }}
        onOpenPlateCalculator={onOpenPlateCalculator}
        triggerHaptic={triggerHaptic}
      />

      {/* ── Interactive RPE & RIR Exertion Selector for Active Sub-Exercise ── */}
      <RpeRirExertionSelector
        exerciseName={currentEx.name}
        currentRpe={currentDraft.rpe}
        currentRir={currentDraft.rir}
        onChangeRpe={rpeVal => {
          setDrafts(prev => ({ ...prev, [activeSub]: { ...prev[activeSub], rpe: rpeVal } }))
        }}
        onChangeRir={rirVal => {
          setDrafts(prev => ({ ...prev, [activeSub]: { ...prev[activeSub], rir: rirVal } }))
        }}
        triggerHaptic={triggerHaptic}
      />

      {/* ── Interactive Rep Cadence & Tempo Metronome for Active Sub-Exercise ── */}
      <RepCadenceMetronome
        tempo={currentDraft.tempo || currentEx.tempo || '2/0/2'}
        targetReps={currentDraft.reps || currentEx.reps || 8}
        exerciseName={currentEx.name}
        weightKg={
          units === 'imperial'
            ? (parseFloat(currentDraft.weight) || 0) * 0.453592
            : (parseFloat(currentDraft.weight) || 0)
        }
        units={units}
        nasmOptPhase={nasmOptPhase}
        onCompleteReps={completedReps => {
          setDrafts(prev => ({
            ...prev,
            [activeSub]: { ...prev[activeSub], reps: String(completedReps) },
          }))
        }}
        triggerHaptic={triggerHaptic}
      />

      {/* ── Advanced Intensity Protocols (Drop Sets & Rest-Pause) for Active Sub-Exercise ── */}
      <IntensityProtocolDrawer
        exerciseName={currentEx.name}
        currentWeight={currentDraft.weight}
        currentReps={currentDraft.reps}
        units={units}
        nasmOptPhase={nasmOptPhase}
        onLogIntensitySet={protocolData => {
          const primaryWeight = units === 'imperial'
            ? String(protocolData.initialWeightLbs)
            : String(Math.round((protocolData.initialWeightLbs / 2.20462) * 10) / 10)
          const updatedDraft = {
            ...currentDraft,
            weight: primaryWeight,
            reps: String(protocolData.totalReps),
            notes: protocolData.notes || '',
            restSeconds: activeSub === 'A' ? pair.transitionRestSeconds : pair.compoundRestSeconds,
          }
          onLogSet(currentEx, updatedDraft)
          if (activeSub === 'A') {
            setActiveSub('B')
          } else {
            setActiveSub('A')
            setDrafts(prev => ({
              A: { ...prev.A, setNumber: String(Number(prev.A.setNumber) + 1) },
              B: { ...prev.B, setNumber: String(Number(prev.B.setNumber) + 1) },
            }))
          }
        }}
        triggerHaptic={triggerHaptic}
      />

      {/* ── Interactive 1RM Percentage & Target Load Matrix for Active Sub-Exercise ── */}
      <OneRepMaxPercentageMatrix
        exerciseName={currentEx.name}
        currentWeight={currentDraft.weight}
        currentReps={currentDraft.reps}
        historicalMax1RmLbs={activeHistoricalMax1RmLbs > 0 ? activeHistoricalMax1RmLbs : undefined}
        units={units}
        isWarmup={currentDraft.isWarmup}
        onApplyLoad={(appliedWeight, appliedReps) => {
          setDrafts(prev => ({
            ...prev,
            [activeSub]: {
              ...prev[activeSub],
              weight: appliedWeight,
              reps: appliedReps,
            },
          }))
        }}
        triggerHaptic={triggerHaptic}
      />

      {/* ── Dynamic Autoregulation & Deload Advisor for Active Sub-Exercise ── */}
      <AutoregulationDeloadAdvisor
        exerciseName={currentEx.name}
        currentDraftWeight={currentDraft.weight}
        currentDraftReps={currentDraft.reps}
        targetReps={currentEx.reps}
        completedSets={currentLoggedSets.map((s, idx) => ({
          setNumber: typeof s.set_number === 'number' ? s.set_number : idx + 1,
          weightLbs: (s.weight_kg ?? 0) * 2.20462,
          weightKg: s.weight_kg ?? undefined,
          reps: Number(s.reps) || 0,
          rpe: s.rpe,
          rir: s.rir,
          isWarmup: s.is_warmup,
          sessionDate: s.session_date,
        }))}
        units={units}
        onApplyDeloadWeight={newWeight => {
          setDrafts(prev => ({
            ...prev,
            [activeSub]: { ...prev[activeSub], weight: newWeight },
          }))
        }}
        onApplyRepCap={newReps => {
          setDrafts(prev => ({
            ...prev,
            [activeSub]: { ...prev[activeSub], reps: newReps },
          }))
        }}
        onOpenDropSet={stages => {
          if (!stages?.length) return
          const firstWeight = units === 'imperial' ? String(stages[0].weightLbs) : String(Math.round(stages[0].weightLbs / 2.20462))
          setDrafts(prev => ({
            ...prev,
            [activeSub]: {
              ...prev[activeSub],
              weight: firstWeight,
            },
          }))
        }}
        onApplyClusterSet={clusterPlan => {
          setDrafts(prev => ({
            ...prev,
            [activeSub]: {
              ...prev[activeSub],
              reps: String(clusterPlan.repsPerCluster),
            },
          }))
        }}
        onApplyMyoReps={myoPlan => {
          setDrafts(prev => ({
            ...prev,
            [activeSub]: {
              ...prev[activeSub],
              reps: String(myoPlan.activationReps),
            },
          }))
        }}
        triggerHaptic={triggerHaptic}
      />

      {/* ── 1-Tap Log Set & Auto-Advance Button ── */}
      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          onClick={handleLogActiveSet}
          className="tactile-btn"
          style={{
            width: '100%',
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
            Log Set {currentDraft.setNumber} for {activeSub === 'A' ? '1A' : '1B'} ({currentDraft.weight} {units === 'imperial' ? 'lb' : 'kg'} × {currentDraft.reps}) ➔ {activeSub === 'A' ? `Rest ${pair.transitionRestSeconds}s & Advance to 1B` : `Rest ${pair.compoundRestSeconds}s & Next Round`}
          </span>
        </button>
      </div>

      {/* Video Demonstration Modal Trigger */}
      {onOpenVideoModal && (
        <div style={{ marginTop: 8, textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => onOpenVideoModal(currentEx.name)}
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
            }}
          >
            <GaaIcon name="play" size={11} tone="gold" />
            <span>Watch NASM Demonstration for {currentEx.name}</span>
          </button>
        </div>
      )}
    </div>
  )
}
