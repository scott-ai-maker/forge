'use client'

import React, { useState, useEffect, useRef } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  parseMovementTempo,
  PrecisionCadenceScheduler,
} from '@/lib/web-audio-cadence-engine'

export interface RepCadenceMetronomeProps {
  tempo: string
  targetReps: number | string
  exerciseName?: string
  onCompleteReps?: (completedReps: number) => void
  triggerHaptic?: (type: 'tap' | 'heavy' | 'success') => void
}

export default function RepCadenceMetronome({
  tempo,
  targetReps,
  onCompleteReps,
  triggerHaptic,
}: RepCadenceMetronomeProps) {
  const parsedTempo = parseMovementTempo(tempo)
  const totalRepsNum = typeof targetReps === 'number' ? targetReps : (parseInt(String(targetReps).replace(/\D/g, ''), 10) || 8)

  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [currentRep, setCurrentRep] = useState<number>(0)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0)
  const schedulerRef = useRef<PrecisionCadenceScheduler | null>(null)

  // Cleanup scheduler on unmount
  useEffect(() => {
    return () => {
      if (schedulerRef.current) {
        schedulerRef.current.stop()
      }
    }
  }, [])

  const handleStart = () => {
    triggerHaptic?.('heavy')
    if (schedulerRef.current) {
      schedulerRef.current.stop()
    }

    const scheduler = new PrecisionCadenceScheduler({
      eccentricSec: parsedTempo.eccentricSec,
      isometricSec: parsedTempo.isometricSec,
      concentricSec: parsedTempo.concentricSec,
      preCountSec: 3,
      totalReps: totalRepsNum,
      soundEnabled: true,
      onPhaseChange: (_phase, rep, sec) => {
        setCurrentRep(rep)
        setSecondsRemaining(sec)
        triggerHaptic?.('tap')
      },
      onComplete: () => {
        setIsRunning(false)
        setCurrentRep(0)
        setSecondsRemaining(0)
        triggerHaptic?.('success')
        onCompleteReps?.(totalRepsNum)
      },
    })

    schedulerRef.current = scheduler
    scheduler.start()
    setIsRunning(true)
  }

  const handleStop = () => {
    triggerHaptic?.('tap')
    if (schedulerRef.current) {
      schedulerRef.current.stop()
    }
    setIsRunning(false)
    setCurrentRep(0)
    setSecondsRemaining(0)
  }

  return (
    <div style={{ marginTop: 6 }} aria-label="Movement Cadence Metronome">
      {!isRunning ? (
        <button
          type="button"
          onClick={handleStart}
          className="tactile-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid #38BDF8',
            color: '#38BDF8',
            fontSize: 10.5,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 4,
            cursor: 'pointer',
          }}
          title={`Start audio cadence pacing (${parsedTempo.raw})`}
        >
          <GaaIcon name="play" size={10} tone="cyan" />
          <span>Start Tempo ({parsedTempo.raw})</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleStop}
          className="tactile-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(56, 189, 248, 0.25)',
            border: '1px solid #38BDF8',
            color: '#38BDF8',
            fontSize: 10.5,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 4,
            cursor: 'pointer',
          }}
          title="Stop cadence metronome"
        >
          <GaaIcon name="stop" size={9} tone="cyan" />
          <span>Rep {currentRep}/{totalRepsNum} ({secondsRemaining}s) · Stop</span>
        </button>
      )}
    </div>
  )
}
