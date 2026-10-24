'use client'

import React, { useState, useEffect, useMemo } from 'react'
import type { WatchExerciseItemPayload, WatchCardioProtocolPayload } from '@/lib/native-healthkit-bridge'

export interface AppleWatchSimulatorModalProps {
  isOpen: boolean
  onClose: () => void
  currentExerciseName?: string
  currentSetNumber?: number
  currentTotalSets?: number
  prescribedWeight?: number
  prescribedReps?: number
  tempo?: string
  restSeconds?: number
  isSuperset?: boolean
  supersetRole?: 'A' | 'B'
  exercises?: WatchExerciseItemPayload[]
  activeExerciseIndex?: number
  cardioProtocol?: WatchCardioProtocolPayload
  onSimulateSetLogged?: (data: { exerciseName: string; setIndex: number; reps: number; weightLbs: number; rpe: number }) => void
}

export default function AppleWatchSimulatorModal({
  isOpen,
  onClose,
  currentExerciseName = 'Barbell Bench Press',
  currentSetNumber = 1,
  currentTotalSets = 3,
  prescribedWeight = 185,
  prescribedReps = 10,
  tempo = '2-0-2-0',
  restSeconds = 60,
  isSuperset = false,
  supersetRole,
  exercises,
  activeExerciseIndex = 0,
  cardioProtocol,
  onSimulateSetLogged,
}: AppleWatchSimulatorModalProps) {
  const [activeTab, setActiveTab] = useState<'lift' | 'rest' | 'cardio' | 'tempo' | 'face'>('lift')

  // Station / Exercise Tracking
  const [currentStationIndex, setCurrentStationIndex] = useState<number>(activeExerciseIndex)
  const [completedSetsMap, setCompletedSetsMap] = useState<Record<string, number>>({})

  // Option B: Confirm & Edit state
  const [isConfirmingSet, setIsConfirmingSet] = useState<boolean>(false)
  const [confirmReps, setConfirmReps] = useState<number>(prescribedReps)
  const [confirmWeight, setConfirmWeight] = useState<number>(prescribedWeight)
  const [confirmRpe, setConfirmRpe] = useState<number>(8.0)
  const [crownFocus, setCrownFocus] = useState<'reps' | 'weight'>('reps')

  // Live Toast / Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Simulated Heart Rate & Rest Timer
  const [simulatedHr, setSimulatedHr] = useState<number>(142)
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number>(60)
  const [totalRestSeconds, setTotalRestSeconds] = useState<number>(60)
  const [isRestRunning, setIsRestRunning] = useState<boolean>(false)

  // Simulated Tempo Metronome
  const [tempoRunning, setTempoRunning] = useState<boolean>(false)
  const [tempoPhase, setTempoPhase] = useState<'eccentric' | 'isometric' | 'concentric' | 'reset'>('eccentric')
  const [tempoCount, setTempoCount] = useState<number>(4)

  // Resolve current active exercise from props or list
  const activeEx = useMemo(() => {
    if (exercises && exercises.length > 0) {
      const idx = Math.min(exercises.length - 1, Math.max(0, currentStationIndex))
      return exercises[idx]
    }
    return undefined
  }, [exercises, currentStationIndex])

  const exName = activeEx?.exerciseName || currentExerciseName
  const exTotalSets = activeEx?.totalSets || currentTotalSets
  const exCompletedSets = completedSetsMap[exName] ?? (activeEx?.completedSetsCount ?? 0)
  const exSetNumber = Math.min(exTotalSets, exCompletedSets + 1)
  const exIsSuperset = activeEx?.isSuperset ?? isSuperset
  const exSupersetRole = activeEx?.supersetRole ?? supersetRole
  const exRestSeconds = activeEx?.restSeconds ?? restSeconds
  const isSupersetA = exIsSuperset && (exSupersetRole === 'A' || exRestSeconds <= 0)

  // Sync initial props
  useEffect(() => {
    if (activeEx) {
      setConfirmReps(activeEx.prescribedReps || 10)
      setConfirmWeight(activeEx.prescribedWeight || 135)
    } else {
      setConfirmReps(prescribedReps)
      setConfirmWeight(prescribedWeight)
    }
  }, [activeEx, prescribedReps, prescribedWeight])

  useEffect(() => {
    if (activeExerciseIndex !== undefined) {
      setCurrentStationIndex(activeExerciseIndex)
    }
  }, [activeExerciseIndex])

  // Toast banner auto-dismiss
  useEffect(() => {
    if (!toastMessage) return
    const t = setTimeout(() => setToastMessage(null), 3200)
    return () => clearTimeout(t)
  }, [toastMessage])

  // Rest timer tick
  useEffect(() => {
    if (!isRestRunning) return
    const timer = setInterval(() => {
      setRestSecondsRemaining((prev) => {
        if (prev <= 1) {
          handleRestExpired()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isRestRunning, currentStationIndex, exercises, completedSetsMap])

  // Tempo tick
  useEffect(() => {
    if (!tempoRunning) return
    const timer = setInterval(() => {
      setTempoCount((prev) => {
        if (prev <= 1) {
          setTempoPhase((currPhase) => {
            if (currPhase === 'eccentric') return 'isometric'
            if (currPhase === 'isometric') return 'concentric'
            if (currPhase === 'concentric') return 'reset'
            return 'eccentric'
          })
          return 4
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [tempoRunning])

  if (!isOpen) return null

  const isZone1Recovered = simulatedHr < 115
  const cardioZone = simulatedHr < 120 ? 1 : simulatedHr < 155 ? 2 : 3

  // Orange Action Button handler (Left Edge)
  const handleActionClick = () => {
    if (activeTab === 'lift') {
      if (isConfirmingSet) {
        handleConfirmSetCommit()
      } else {
        handleOpenConfirmSet()
      }
    } else if (activeTab === 'rest') {
      handleCompleteRest()
    } else {
      setActiveTab('lift')
    }
  }

  // Option B: Open Confirm & Edit View
  const handleOpenConfirmSet = () => {
    setIsConfirmingSet(true)
  }

  // Option B: Athlete commits set after verifying/editing reps, weight, RPE
  const handleConfirmSetCommit = () => {
    // 1. Notify phone bridge
    if (onSimulateSetLogged) {
      onSimulateSetLogged({
        exerciseName: exName,
        setIndex: exSetNumber,
        reps: confirmReps,
        weightLbs: confirmWeight,
        rpe: confirmRpe,
      })
    }

    // 2. Increment completed count locally
    const nextCompletedCount = exCompletedSets + 1
    setCompletedSetsMap((prev) => ({
      ...prev,
      [exName]: nextCompletedCount,
    }))

    setIsConfirmingSet(false)

    // 3. CASE 1: Superset 1A (0s rest) -> Immediately flip to 1B!
    if (isSupersetA) {
      const partnerIdx = activeEx?.supersetPartnerIndex ?? currentStationIndex + 1
      if (exercises && partnerIdx < exercises.length) {
        setCurrentStationIndex(partnerIdx)
        const partnerName = exercises[partnerIdx].exerciseName
        setToastMessage(`⚡ 1B: ${partnerName}`)
      } else {
        setToastMessage(`⚡ 1B Next (0s Transition)`)
      }
      // Stay on lift tab! Do not start rest timer!
      setActiveTab('lift')
      return
    }

    // 4. CASE 2: Superset 1B or Standard Lift -> Start Rest Timer
    const restDuration = exRestSeconds > 0 ? exRestSeconds : 60
    setIsRestRunning(true)
    setRestSecondsRemaining(restDuration)
    setTotalRestSeconds(restDuration)
    setActiveTab('rest')
  }

  // Rest Timer Expiration or Manual Skip
  const handleRestExpired = () => {
    setIsRestRunning(false)
    setRestSecondsRemaining(0)

    // If resting after 1B in a superset, check if 1A has remaining sets!
    if (exIsSuperset && exSupersetRole === 'B') {
      const partnerIdx = activeEx?.supersetPartnerIndex ?? currentStationIndex - 1
      if (exercises && partnerIdx >= 0 && partnerIdx < exercises.length) {
        const partnerA = exercises[partnerIdx]
        const partnerADone = (completedSetsMap[partnerA.exerciseName] ?? partnerA.completedSetsCount ?? 0) >= partnerA.totalSets
        if (!partnerADone) {
          // Round-robin back to 1A!
          setCurrentStationIndex(partnerIdx)
          setToastMessage(`⚡ Round ${(completedSetsMap[partnerA.exerciseName] || 0) + 1}: 1A`)
          setActiveTab('lift')
          return
        }
      }
    }

    // Check if all exercises are complete
    if (exercises && exercises.length > 0) {
      const allDone = exercises.every(
        (e) => (completedSetsMap[e.exerciseName] ?? e.completedSetsCount ?? 0) >= e.totalSets
      )
      if (allDone) {
        setToastMessage('✓ All Lifts Done! Advancing...')
        if (cardioProtocol && !cardioProtocol.isCompleted) {
          setActiveTab('cardio')
        } else {
          setActiveTab('lift')
        }
        return
      }
    }

    setActiveTab('lift')
  }

  const handleCompleteRest = () => {
    handleRestExpired()
  }

  const handleCrownScroll = (delta: number) => {
    if (isConfirmingSet) {
      if (crownFocus === 'reps') {
        setConfirmReps((prev) => Math.max(1, Math.min(50, prev + delta)))
      } else {
        setConfirmWeight((prev) => Math.max(0, Math.min(800, prev + delta * 5)))
      }
    } else {
      if (crownFocus === 'reps') {
        setConfirmReps((prev) => Math.max(1, Math.min(50, prev + delta)))
      } else {
        setConfirmWeight((prev) => Math.max(0, Math.min(800, prev + delta * 5)))
      }
    }
  }

  // Station navigation (< and >)
  const handlePrevStation = () => {
    if (!exercises || exercises.length === 0) return
    setCurrentStationIndex((prev) => Math.max(0, prev - 1))
    setIsConfirmingSet(false)
  }

  const handleNextStation = () => {
    if (!exercises || exercises.length === 0) return
    setCurrentStationIndex((prev) => Math.min(exercises.length - 1, prev + 1))
    setIsConfirmingSet(false)
  }

  const isExDone = exCompletedSets >= exTotalSets

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(8, 14, 26, 0.99) 100%)',
          border: '1.5px solid rgba(56, 189, 248, 0.3)',
          borderRadius: 20,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(56, 189, 248, 0.15)',
          maxWidth: 720,
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              ⌚
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.04em' }}>
                FORGE ATHLETIC WATCH HARDWARE SIMULATOR
              </div>
              <div style={{ fontSize: 11, color: '#38BDF8', fontWeight: 600 }}>
                Apple Watch Ultra 49mm · Pocket Companion &amp; Option B Set Confirmation
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close simulator"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'var(--gray)',
              width: 30,
              height: 30,
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body: Watch Hardware Frame + Side Simulator Controls */}
        <div
          style={{
            padding: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 28,
            flexWrap: 'wrap',
          }}
        >
          {/* ── Apple Watch Ultra Physical Chassis ── */}
          <div style={{ position: 'relative', width: 256, height: 320 }}>
            {/* Orange Action Button (Left Edge) */}
            <button
              type="button"
              onClick={handleActionClick}
              title="Apple Watch Ultra Action Button (Log Set / Confirm / Skip Rest)"
              style={{
                position: 'absolute',
                left: -7,
                top: 100,
                width: 7,
                height: 48,
                background: '#FF6B00',
                borderRadius: '4px 0 0 4px',
                border: '1px solid #D95A00',
                cursor: 'pointer',
                boxShadow: '-2px 0 6px rgba(255, 107, 0, 0.6)',
              }}
            />

            {/* Digital Crown (Top-Right Edge) */}
            <div
              style={{
                position: 'absolute',
                right: -9,
                top: 45,
                width: 9,
                height: 44,
                background: 'linear-gradient(180deg, #64748B 0%, #334155 50%, #64748B 100%)',
                borderRadius: '0 4px 4px 0',
                border: '1px solid #475569',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-around',
                padding: '2px 0',
                cursor: 'ns-resize',
              }}
              title="Digital Crown (Scroll up/down to adjust reps/weight)"
              onWheel={(e) => {
                e.preventDefault()
                handleCrownScroll(e.deltaY < 0 ? 1 : -1)
              }}
            >
              <div style={{ height: 1.5, background: '#1E293B', width: '100%' }} />
              <div style={{ height: 1.5, background: '#1E293B', width: '100%' }} />
              <div style={{ height: 1.5, background: '#1E293B', width: '100%' }} />
            </div>

            {/* Side Button (Lower-Right Edge) */}
            <div
              style={{
                position: 'absolute',
                right: -6,
                top: 110,
                width: 6,
                height: 38,
                background: '#475569',
                borderRadius: '0 3px 3px 0',
                border: '1px solid #334155',
              }}
            />

            {/* Outer Titanium Casing */}
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #334155 0%, #1E293B 40%, #0F172A 100%)',
                borderRadius: 48,
                border: '3px solid #64748B',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.9), inset 0 1px 2px rgba(255, 255, 255, 0.2)',
                padding: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Inner OLED Display Bezel */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: '#030712',
                  borderRadius: 38,
                  overflow: 'hidden',
                  border: '1.5px solid #000000',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 10,
                  position: 'relative',
                }}
              >
                {/* Watch Status Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 800, color: '#38BDF8', letterSpacing: '0.04em' }}>9:41</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: '#F87171' }}>♥ {simulatedHr}</span>
                  </div>
                </div>

                {/* Floating Toast Notification */}
                {toastMessage && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 26,
                      left: 10,
                      right: 10,
                      zIndex: 10,
                      background: 'rgba(16, 185, 129, 0.95)',
                      color: '#FFFFFF',
                      fontSize: 8.5,
                      fontWeight: 900,
                      padding: '4px 6px',
                      borderRadius: 6,
                      textAlign: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    }}
                  >
                    {toastMessage}
                  </div>
                )}

                {/* ── TAB 1: ACTIVE LIFT VIEW ── */}
                {activeTab === 'lift' && (
                  <>
                    {/* OPTION B: CONFIRM & EDIT SCREEN */}
                    {isConfirmingSet ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minHeight: 0 }}>
                        {/* Header */}
                        <div style={{ textAlign: 'center' }}>
                          {exIsSuperset && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', padding: '1px 5px', borderRadius: 4, fontSize: 7.5, fontWeight: 900, marginBottom: 2 }}>
                              ⚡ SUPERSET 1{exSupersetRole || 'A'}
                            </div>
                          )}
                          <div style={{ fontSize: 9, fontWeight: 800, color: '#D4A017' }}>
                            CONFIRM SET {exSetNumber} OF {exTotalSets}
                          </div>
                          <div style={{ fontSize: 10.5, fontWeight: 900, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {exName}
                          </div>
                        </div>

                        {/* Quick Reps Stepper */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.06)', borderRadius: 7, padding: '2px 6px' }}>
                          <button
                            type="button"
                            onClick={() => setConfirmReps((r) => Math.max(1, r - 1))}
                            style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#FFF', width: 22, height: 22, borderRadius: 11, fontWeight: 900, fontSize: 11, cursor: 'pointer' }}
                          >
                            -1
                          </button>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 7.5, fontWeight: 900, color: '#94A3B8' }}>REPS</div>
                            <div style={{ fontSize: 17, fontWeight: 900, color: '#38BDF8', lineHeight: 1 }}>{confirmReps}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setConfirmReps((r) => Math.min(50, r + 1))}
                            style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#FFF', width: 22, height: 22, borderRadius: 11, fontWeight: 900, fontSize: 11, cursor: 'pointer' }}
                          >
                            +1
                          </button>
                        </div>

                        {/* Quick Weight Stepper */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.06)', borderRadius: 7, padding: '2px 6px' }}>
                          <button
                            type="button"
                            onClick={() => setConfirmWeight((w) => Math.max(0, w - 5))}
                            style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#FFF', width: 22, height: 22, borderRadius: 11, fontWeight: 900, fontSize: 11, cursor: 'pointer' }}
                          >
                            -5
                          </button>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 7.5, fontWeight: 900, color: '#94A3B8' }}>LBS</div>
                            <div style={{ fontSize: 17, fontWeight: 900, color: '#D4A017', lineHeight: 1 }}>{confirmWeight}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setConfirmWeight((w) => w + 5)}
                            style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#FFF', width: 22, height: 22, borderRadius: 11, fontWeight: 900, fontSize: 11, cursor: 'pointer' }}
                          >
                            +5
                          </button>
                        </div>

                        {/* Quick RPE Pills */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                          <span style={{ fontSize: 7.5, fontWeight: 900, color: '#D4A017' }}>RPE:</span>
                          {[7.0, 8.0, 8.5, 9.0, 10.0].map((rVal) => (
                            <button
                              key={rVal}
                              type="button"
                              onClick={() => setConfirmRpe(rVal)}
                              style={{
                                background: confirmRpe === rVal ? '#D4A017' : 'rgba(255,255,255,0.08)',
                                border: 'none',
                                borderRadius: 4,
                                color: confirmRpe === rVal ? '#000' : '#FFF',
                                fontSize: 8,
                                fontWeight: 800,
                                padding: '2px 4px',
                                cursor: 'pointer',
                              }}
                            >
                              {rVal === 10 ? '10' : rVal}
                            </button>
                          ))}
                        </div>

                        {/* Large Primary Confirm Button */}
                        <button
                          type="button"
                          onClick={handleConfirmSetCommit}
                          style={{
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            border: 'none',
                            borderRadius: 8,
                            color: '#FFFFFF',
                            fontWeight: 900,
                            fontSize: 10,
                            padding: '6px 0',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                            marginTop: 'auto',
                          }}
                        >
                          <span>✓</span>
                          <span>
                            {isSupersetA ? 'CONFIRM → 1B NEXT' : `CONFIRM & REST (${exRestSeconds}s)`}
                          </span>
                        </button>

                        {/* Cancel Button */}
                        <button
                          type="button"
                          onClick={() => setIsConfirmingSet(false)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94A3B8',
                            fontSize: 8.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: 1,
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      /* STANDARD ACTIVE LIFT CARD */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minHeight: 0 }}>
                        {/* Title with station navigation */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                          {exercises && exercises.length > 1 && (
                            <button
                              type="button"
                              onClick={handlePrevStation}
                              disabled={currentStationIndex <= 0}
                              style={{
                                background: 'rgba(255,255,255,0.08)',
                                border: 'none',
                                color: currentStationIndex <= 0 ? 'rgba(255,255,255,0.2)' : '#38BDF8',
                                width: 18,
                                height: 18,
                                borderRadius: 4,
                                fontSize: 9,
                                fontWeight: 900,
                                cursor: currentStationIndex <= 0 ? 'default' : 'pointer',
                              }}
                            >
                              ◀
                            </button>
                          )}

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              {exIsSuperset && (
                                <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', padding: '1px 4px', borderRadius: 3, fontSize: 7, fontWeight: 900 }}>
                                  ⚡ 1{exSupersetRole || 'A'}
                                </span>
                              )}
                              <span style={{ fontSize: 10.5, fontWeight: 900, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {exName}
                              </span>
                            </div>
                            <div style={{ fontSize: 8.5, fontWeight: 800, color: '#38BDF8' }}>
                              Set {exSetNumber} of {exTotalSets}
                              {isExDone && <span style={{ color: '#10B981', marginLeft: 4 }}>✓ COMPLETE</span>}
                            </div>
                          </div>

                          {exercises && exercises.length > 1 && (
                            <button
                              type="button"
                              onClick={handleNextStation}
                              disabled={currentStationIndex >= exercises.length - 1}
                              style={{
                                background: 'rgba(255,255,255,0.08)',
                                border: 'none',
                                color: currentStationIndex >= exercises.length - 1 ? 'rgba(255,255,255,0.2)' : '#38BDF8',
                                width: 18,
                                height: 18,
                                borderRadius: 4,
                                fontSize: 9,
                                fontWeight: 900,
                                cursor: currentStationIndex >= exercises.length - 1 ? 'default' : 'pointer',
                              }}
                            >
                              ▶
                            </button>
                          )}
                        </div>

                        {/* Dual Selector Box */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                          <div
                            onClick={() => setCrownFocus('reps')}
                            style={{
                              background: crownFocus === 'reps' ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255,255,255,0.06)',
                              border: crownFocus === 'reps' ? '1.5px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 8,
                              padding: '3px 2px',
                              textAlign: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ fontSize: 7.5, fontWeight: 900, color: '#94A3B8' }}>REPS</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: crownFocus === 'reps' ? '#38BDF8' : '#FFFFFF', lineHeight: 1.1 }}>
                              {confirmReps}
                            </div>
                          </div>

                          <div
                            onClick={() => setCrownFocus('weight')}
                            style={{
                              background: crownFocus === 'weight' ? 'rgba(212, 160, 23, 0.18)' : 'rgba(255,255,255,0.06)',
                              border: crownFocus === 'weight' ? '1.5px solid #D4A017' : '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 8,
                              padding: '3px 2px',
                              textAlign: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ fontSize: 7.5, fontWeight: 900, color: '#94A3B8' }}>LBS</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: crownFocus === 'weight' ? '#D4A017' : '#FFFFFF', lineHeight: 1.1 }}>
                              {confirmWeight}
                            </div>
                          </div>
                        </div>

                        {/* Plate / Modality breakdown */}
                        {confirmWeight >= 45 && (
                          <div
                            style={{
                              background: 'rgba(255, 255, 255, 0.06)',
                              borderRadius: 6,
                              padding: '2.5px 5px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: 8,
                              fontWeight: 700,
                              color: '#E2E8F0',
                            }}
                          >
                            <span style={{ color: '#D4A017', fontWeight: 900 }}>BARBELL</span>
                            <span>{Math.round((confirmWeight - 45) / 2)} lb / side</span>
                          </div>
                        )}

                        {/* Option B: LOG SET CTA opens Confirm & Edit */}
                        <button
                          type="button"
                          onClick={handleOpenConfirmSet}
                          style={{
                            background: isExDone
                              ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)'
                              : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            border: 'none',
                            borderRadius: 8,
                            color: '#FFFFFF',
                            fontWeight: 900,
                            fontSize: 10.5,
                            padding: '7px 0',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            boxShadow: isExDone ? '0 4px 12px rgba(2, 132, 199, 0.4)' : '0 4px 12px rgba(16, 185, 129, 0.4)',
                            marginTop: 'auto',
                          }}
                        >
                          <span>✓</span>
                          <span>{isExDone ? 'LOG BONUS SET' : `LOG SET ${exSetNumber} OF ${exTotalSets}`}</span>
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* ── TAB 2: BIO-ADAPTIVE REST TIMER VIEW ── */}
                {activeTab === 'rest' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 8, fontWeight: 800, color: isZone1Recovered ? '#10B981' : '#D4A017', background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>
                        {isZone1Recovered ? 'Zone 1 (Recovered)' : 'Zone 2 (Active Rest)'}
                      </span>
                    </div>

                    {/* Circular Timer Ring */}
                    <div style={{ position: 'relative', width: 68, height: 68, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="68" height="68" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="34" cy="34" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
                        <circle
                          cx="34"
                          cy="34"
                          r="28"
                          fill="none"
                          stroke={isZone1Recovered ? '#10B981' : '#D4A017'}
                          strokeWidth="5"
                          strokeDasharray="175.9"
                          strokeDashoffset={175.9 * (1 - (totalRestSeconds > 0 ? restSecondsRemaining / totalRestSeconds : 0))}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div style={{ position: 'absolute', textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                          {restSecondsRemaining}
                        </div>
                        <div style={{ fontSize: 7, fontWeight: 800, color: isZone1Recovered ? '#10B981' : '#38BDF8' }}>
                          {isZone1Recovered ? 'READY' : 'REST'}
                        </div>
                      </div>
                    </div>

                    {/* Quick Pacer Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 1fr', gap: 4, width: '100%' }}>
                      <button
                        type="button"
                        onClick={() => setRestSecondsRemaining((prev) => Math.max(0, prev - 15))}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, color: '#FFF', fontSize: 8.5, fontWeight: 800, padding: '4px 0', cursor: 'pointer' }}
                      >
                        -15
                      </button>
                      <button
                        type="button"
                        onClick={handleCompleteRest}
                        style={{
                          background: isZone1Recovered ? '#10B981' : '#38BDF8',
                          border: 'none',
                          borderRadius: 6,
                          color: '#FFF',
                          fontSize: 9,
                          fontWeight: 900,
                          padding: '4px 0',
                          cursor: 'pointer',
                        }}
                      >
                        LIFT
                      </button>
                      <button
                        type="button"
                        onClick={() => setRestSecondsRemaining((prev) => prev + 15)}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, color: '#FFF', fontSize: 8.5, fontWeight: 800, padding: '4px 0', cursor: 'pointer' }}
                      >
                        +15
                      </button>
                    </div>
                  </div>
                )}

                {/* ── TAB 3: TANAKA STAGE CARDIO VIEW ── */}
                {activeTab === 'cardio' && (
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 8, fontWeight: 700, color: '#94A3B8' }}>TANAKA CARDIO STAGE</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: cardioZone === 3 ? '#F87171' : cardioZone === 2 ? '#D4A017' : '#10B981', lineHeight: 1.1 }}>
                        {simulatedHr} <span style={{ fontSize: 9, color: '#64748B' }}>BPM</span>
                      </div>
                      <div style={{ fontSize: 8.5, fontWeight: 800, color: '#E2E8F0', marginTop: 2 }}>
                        {cardioZone === 1 ? 'Zone 1 · Aerobic Recovery' : cardioZone === 2 ? 'Zone 2 · Lactate Threshold' : 'Zone 3 · Peak Anaerobic'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 3, width: '100%', margin: '4px 0' }}>
                      <div style={{ flex: 1, height: 4, borderRadius: 2, background: cardioZone >= 1 ? '#10B981' : 'rgba(255,255,255,0.1)' }} />
                      <div style={{ flex: 1, height: 4, borderRadius: 2, background: cardioZone >= 2 ? '#D4A017' : 'rgba(255,255,255,0.1)' }} />
                      <div style={{ flex: 1, height: 4, borderRadius: 2, background: cardioZone >= 3 ? '#F87171' : 'rgba(255,255,255,0.1)' }} />
                    </div>

                    <div style={{ fontSize: 7.5, color: '#64748B', textAlign: 'center' }}>
                      Automatic voice ducking over audio
                    </div>
                  </div>
                )}

                {/* ── TAB 4: 4-2-1-1 TEMPO METRONOME VIEW ── */}
                {activeTab === 'tempo' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                    <div style={{ fontSize: 8.5, fontWeight: 800, color: '#38BDF8' }}>NASM OPT™ TEMPO ({tempo})</div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 8.5, fontWeight: 900, color: '#D4A017', textTransform: 'uppercase' }}>
                        {tempoPhase}
                      </div>
                      <div style={{ fontSize: 30, fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                        {tempoCount}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTempoRunning(!tempoRunning)}
                      style={{
                        background: tempoRunning ? '#EF4444' : '#38BDF8',
                        border: 'none',
                        borderRadius: 6,
                        color: '#FFF',
                        fontSize: 9,
                        fontWeight: 900,
                        padding: '4px 10px',
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      {tempoRunning ? 'PAUSE PACER' : 'START CADENCE'}
                    </button>
                  </div>
                )}

                {/* ── TAB 5: WATCH FACE COMPLICATION VIEW ── */}
                {activeTab === 'face' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1 }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        border: '3px solid #10B981',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(16, 185, 129, 0.1)',
                      }}
                    >
                      <span style={{ fontSize: 15, fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>88%</span>
                      <span style={{ fontSize: 6.5, fontWeight: 900, color: '#38BDF8' }}>CNS</span>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 8.5, fontWeight: 800, color: '#10B981' }}>PEAK RECOVERY</div>
                      <div style={{ fontSize: 7.5, color: '#94A3B8' }}>HRV 76ms · RHR 54bpm</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Side Simulator Controls ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 270, flex: 1 }}>
            {/* View Switcher Tabs */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold-lt)', marginBottom: 6, textTransform: 'uppercase' }}>
                Simulator View Mode:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {[
                  { id: 'lift', label: '1. Active Lift' },
                  { id: 'rest', label: '2. Rest Pacer' },
                  { id: 'cardio', label: '3. Cardio' },
                  { id: 'tempo', label: '4. Tempo' },
                  { id: 'face', label: '5. Widget' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    style={{
                      padding: '7px 4px',
                      background: activeTab === tab.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: activeTab === tab.id ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: activeTab === tab.id ? '#38BDF8' : '#94A3B8',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Option B Explanatory Card */}
            <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#38BDF8', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>✓</span> Option B: Confirm &amp; Edit Active
              </div>
              <div style={{ fontSize: 10, color: '#CBD5E1', lineHeight: 1.4 }}>
                Tapping <strong>LOG SET</strong> opens quick steppers to edit reps/weight before final confirmation.
                {isSupersetA && (
                  <span style={{ display: 'block', marginTop: 3, color: '#D4A017', fontWeight: 800 }}>
                    ⚡ Superset 1A: Confirming immediately flips to 1B with 0s rest!
                  </span>
                )}
              </div>
            </div>

            {/* Digital Crown Simulated Controls */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>
                Simulate Digital Crown Spin ({crownFocus === 'reps' ? 'Reps' : 'Weight'}):
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => handleCrownScroll(-1)}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 6,
                    color: '#FFF',
                    fontWeight: 800,
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  ▼ Decrement (-1)
                </button>
                <button
                  type="button"
                  onClick={() => handleCrownScroll(1)}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 6,
                    color: '#FFF',
                    fontWeight: 800,
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  ▲ Increment (+1)
                </button>
              </div>
            </div>

            {/* Simulated Heart Rate Recovery Slider */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: '#FFFFFF' }}>Simulate Optical Heart Rate:</span>
                <span style={{ fontSize: 11.5, fontWeight: 900, color: simulatedHr < 115 ? '#10B981' : '#F87171' }}>
                  {simulatedHr} BPM
                </span>
              </div>
              <input
                type="range"
                min="70"
                max="185"
                value={simulatedHr}
                onChange={(e) => setSimulatedHr(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ fontSize: 9.5, color: '#94A3B8', marginTop: 3 }}>
                {simulatedHr < 115
                  ? '✓ Zone 1 Autonomic Recovery: Rest timer activates "Ready to Lift" double-pulse.'
                  : 'Zone 2/3 Strain: Rest timer continues for full ATP-CP resynthesis.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
