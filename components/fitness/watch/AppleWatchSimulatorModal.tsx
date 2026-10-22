'use client'

import React, { useState, useEffect } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'

export interface AppleWatchSimulatorModalProps {
  isOpen: boolean
  onClose: () => void
  currentExerciseName?: string
  currentSetNumber?: number
  currentTotalSets?: number
  prescribedWeight?: number
  prescribedReps?: number
  tempo?: string
  onSimulateSetLogged?: (data: { exerciseName: string; setIndex: number; reps: number; weightLbs: number; rpe: number }) => void
}

export default function AppleWatchSimulatorModal({
  isOpen,
  onClose,
  currentExerciseName = 'Barbell Bench Press',
  currentSetNumber = 2,
  currentTotalSets = 4,
  prescribedWeight = 185,
  prescribedReps = 10,
  tempo = '2-0-2-0',
  onSimulateSetLogged,
}: AppleWatchSimulatorModalProps) {
  const [activeTab, setActiveTab] = useState<'lift' | 'rest' | 'cardio' | 'tempo' | 'face'>('lift')
  const [reps, setReps] = useState<number>(prescribedReps)
  const [weight, setWeight] = useState<number>(prescribedWeight)
  const [crownFocus, setCrownFocus] = useState<'reps' | 'weight'>('reps')

  // Simulated Heart Rate & Rest Timer
  const [simulatedHr, setSimulatedHr] = useState<number>(142)
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number>(60)
  const [totalRestSeconds, setTotalRestSeconds] = useState<number>(60)
  const [isRestRunning, setIsRestRunning] = useState<boolean>(false)

  // Simulated Tempo Metronome
  const [tempoRunning, setTempoRunning] = useState<boolean>(false)
  const [tempoPhase, setTempoPhase] = useState<'eccentric' | 'isometric' | 'concentric' | 'reset'>('eccentric')
  const [tempoCount, setTempoCount] = useState<number>(4)

  // Synchronize initial props
  useEffect(() => {
    setReps(prescribedReps)
    setWeight(prescribedWeight)
  }, [prescribedReps, prescribedWeight])

  // Rest timer tick
  useEffect(() => {
    if (!isRestRunning) return
    const timer = setInterval(() => {
      setRestSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsRestRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isRestRunning])

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

  const handleActionClick = () => {
    if (activeTab === 'lift') {
      handleLogSet()
    } else if (activeTab === 'rest') {
      handleCompleteRest()
    } else {
      setActiveTab('lift')
    }
  }

  const handleLogSet = () => {
    if (onSimulateSetLogged) {
      onSimulateSetLogged({
        exerciseName: currentExerciseName,
        setIndex: currentSetNumber,
        reps,
        weightLbs: weight,
        rpe: 8.5,
      })
    }
    // Launch rest timer and flip to rest view
    setIsRestRunning(true)
    setRestSecondsRemaining(60)
    setTotalRestSeconds(60)
    setActiveTab('rest')
  }

  const handleCompleteRest = () => {
    setIsRestRunning(false)
    setRestSecondsRemaining(0)
    setActiveTab('lift')
  }

  const handleCrownScroll = (delta: number) => {
    if (crownFocus === 'reps') {
      setReps((prev) => Math.max(1, Math.min(50, prev + delta)))
    } else {
      setWeight((prev) => Math.max(0, Math.min(800, prev + delta * 5)))
    }
  }

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
          maxWidth: 680,
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
                Apple Watch Ultra 49mm · Titanium Chassis &amp; Taptic Simulator
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
          <div style={{ position: 'relative', width: 250, height: 310 }}>
            {/* Orange Action Button (Left Edge) */}
            <button
              type="button"
              onClick={handleActionClick}
              title="Apple Watch Ultra Action Button (Log Set / Quick Lift)"
              style={{
                position: 'absolute',
                left: -7,
                top: 95,
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
              title="Digital Crown (Scroll up/down to adjust value)"
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
                  padding: 12,
                  position: 'relative',
                }}
              >
                {/* Watch Status Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 800, color: '#38BDF8', letterSpacing: '0.04em' }}>9:41</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: '#F87171' }}>♥ {simulatedHr}</span>
                  </div>
                </div>

                {/* ── TAB 1: ACTIVE LIFT VIEW ── */}
                {activeTab === 'lift' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minHeight: 0 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 900, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {currentExerciseName}
                      </div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#38BDF8' }}>
                        Set {currentSetNumber} of {currentTotalSets}
                      </div>
                    </div>

                    {/* Dual Selector Box */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <div
                        onClick={() => setCrownFocus('reps')}
                        style={{
                          background: crownFocus === 'reps' ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255,255,255,0.06)',
                          border: crownFocus === 'reps' ? '1.5px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 8,
                          padding: '4px 2px',
                          textAlign: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: 8, fontWeight: 900, color: '#94A3B8' }}>REPS</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: crownFocus === 'reps' ? '#38BDF8' : '#FFFFFF', lineHeight: 1.1 }}>
                          {reps}
                        </div>
                      </div>

                      <div
                        onClick={() => setCrownFocus('weight')}
                        style={{
                          background: crownFocus === 'weight' ? 'rgba(212, 160, 23, 0.18)' : 'rgba(255,255,255,0.06)',
                          border: crownFocus === 'weight' ? '1.5px solid #D4A017' : '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 8,
                          padding: '4px 2px',
                          textAlign: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: 8, fontWeight: 900, color: '#94A3B8' }}>LBS</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: crownFocus === 'weight' ? '#D4A017' : '#FFFFFF', lineHeight: 1.1 }}>
                          {weight}
                        </div>
                      </div>
                    </div>

                    {/* LOG SET Button */}
                    <button
                      type="button"
                      onClick={handleLogSet}
                      style={{
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: 8,
                        color: '#FFFFFF',
                        fontWeight: 900,
                        fontSize: 11,
                        padding: '7px 0',
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
                      <span>LOG SET</span>
                    </button>
                  </div>
                )}

                {/* ── TAB 2: BIO-ADAPTIVE REST TIMER VIEW ── */}
                {activeTab === 'rest' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 8.5, fontWeight: 800, color: isZone1Recovered ? '#10B981' : '#D4A017', background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4 }}>
                        {isZone1Recovered ? 'Zone 1 (Recovered)' : 'Zone 2 (Active Rest)'}
                      </span>
                    </div>

                    {/* Circular Timer Ring */}
                    <div style={{ position: 'relative', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
                        <circle
                          cx="36"
                          cy="36"
                          r="30"
                          fill="none"
                          stroke={isZone1Recovered ? '#10B981' : '#D4A017'}
                          strokeWidth="5"
                          strokeDasharray="188.4"
                          strokeDashoffset={188.4 * (1 - (totalRestSeconds > 0 ? restSecondsRemaining / totalRestSeconds : 0))}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div style={{ position: 'absolute', textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                          {restSecondsRemaining}
                        </div>
                        <div style={{ fontSize: 7.5, fontWeight: 800, color: isZone1Recovered ? '#10B981' : '#38BDF8' }}>
                          {isZone1Recovered ? 'READY' : 'REST'}
                        </div>
                      </div>
                    </div>

                    {/* Quick Pacer Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 1fr', gap: 4, width: '100%' }}>
                      <button
                        type="button"
                        onClick={() => setRestSecondsRemaining((prev) => Math.max(0, prev - 15))}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, color: '#FFF', fontSize: 9, fontWeight: 800, padding: '4px 0', cursor: 'pointer' }}
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
                          fontSize: 9.5,
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
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, color: '#FFF', fontSize: 9, fontWeight: 800, padding: '4px 0', cursor: 'pointer' }}
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
                      <div style={{ fontSize: 8.5, fontWeight: 700, color: '#94A3B8' }}>TANAKA CARDIO STAGE</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: cardioZone === 3 ? '#F87171' : cardioZone === 2 ? '#D4A017' : '#10B981', lineHeight: 1.1 }}>
                        {simulatedHr} <span style={{ fontSize: 10, color: '#64748B' }}>BPM</span>
                      </div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#E2E8F0', marginTop: 2 }}>
                        {cardioZone === 1 ? 'Zone 1 · Aerobic Recovery' : cardioZone === 2 ? 'Zone 2 · Lactate Threshold' : 'Zone 3 · Peak Anaerobic'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 3, width: '100%', margin: '6px 0' }}>
                      <div style={{ flex: 1, height: 5, borderRadius: 2, background: cardioZone >= 1 ? '#10B981' : 'rgba(255,255,255,0.1)' }} />
                      <div style={{ flex: 1, height: 5, borderRadius: 2, background: cardioZone >= 2 ? '#D4A017' : 'rgba(255,255,255,0.1)' }} />
                      <div style={{ flex: 1, height: 5, borderRadius: 2, background: cardioZone >= 3 ? '#F87171' : 'rgba(255,255,255,0.1)' }} />
                    </div>

                    <div style={{ fontSize: 8, color: '#64748B', textAlign: 'center' }}>
                      Automatic voice ducking over Spotify
                    </div>
                  </div>
                )}

                {/* ── TAB 4: 4-2-1-1 TEMPO METRONOME VIEW ── */}
                {activeTab === 'tempo' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: '#38BDF8' }}>NASM OPT™ TEMPO</div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 9, fontWeight: 900, color: '#D4A017', textTransform: 'uppercase' }}>
                        {tempoPhase}
                      </div>
                      <div style={{ fontSize: 32, fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
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
                        fontSize: 9.5,
                        fontWeight: 900,
                        padding: '5px 12px',
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
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1 }}>
                    <div
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: '50%',
                        border: '3px solid #10B981',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(16, 185, 129, 0.1)',
                      }}
                    >
                      <span style={{ fontSize: 16, fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>88%</span>
                      <span style={{ fontSize: 7, fontWeight: 900, color: '#38BDF8' }}>CNS</span>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#10B981' }}>PEAK RECOVERY</div>
                      <div style={{ fontSize: 8, color: '#94A3B8' }}>HRV 76ms · RHR 54bpm</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Side Simulator Controls ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 260, flex: 1 }}>
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

            {/* Digital Crown Simulated Controls */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#FFFFFF', marginBottom: 6 }}>
                Simulate Digital Crown Spin ({crownFocus === 'reps' ? 'Reps' : 'Weight'}):
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => handleCrownScroll(-1)}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 6,
                    color: '#FFF',
                    fontWeight: 800,
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
                    padding: '8px 0',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 6,
                    color: '#FFF',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  ▲ Increment (+1)
                </button>
              </div>
            </div>

            {/* Simulated Heart Rate Recovery Slider */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#FFFFFF' }}>Simulate Optical Heart Rate:</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: simulatedHr < 115 ? '#10B981' : '#F87171' }}>
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
              <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>
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
