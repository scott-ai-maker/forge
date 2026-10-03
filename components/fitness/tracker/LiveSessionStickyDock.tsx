'use client'

import React from 'react'
import { evaluateLiveCardioTelemetry } from '@/lib/live-cardio-telemetry'
import { GaaIcon } from '@/components/ui/GaaIcon'

export interface LiveSessionStickyDockProps {
  isWorkoutTimerActive: boolean
  activeWorkoutSessionDay: number | null
  activeWorkout?: { day: number; focus?: string } | null
  elapsedWorkoutSeconds: number
  activeWorkoutStage: 'strength' | 'cardio' | 'cooldown' | 'idle'
  heartRateBpm?: number | null
  userAge?: number
  userWeightKg?: number
  userGender?: 'male' | 'female'
  onPauseResume: () => void
  onStartCardio: () => void
  onFinishLifts: () => void
}

export default function LiveSessionStickyDock({
  isWorkoutTimerActive,
  activeWorkoutSessionDay,
  activeWorkout,
  elapsedWorkoutSeconds,
  activeWorkoutStage,
  heartRateBpm,
  userAge,
  userWeightKg,
  userGender,
  onPauseResume,
  onStartCardio,
  onFinishLifts,
}: LiveSessionStickyDockProps) {
  if (!isWorkoutTimerActive || activeWorkoutSessionDay === null) return null

  const mm = Math.floor(elapsedWorkoutSeconds / 60)
    .toString()
    .padStart(2, '0')
  const ss = (elapsedWorkoutSeconds % 60).toString().padStart(2, '0')

  const hasLiveHr = typeof heartRateBpm === 'number' && heartRateBpm > 0
  const currentBpm = hasLiveHr ? heartRateBpm : 120
  const telemetry = evaluateLiveCardioTelemetry(currentBpm, elapsedWorkoutSeconds, {
    age: userAge || 30,
    weightKg: userWeightKg || 75,
    gender: userGender || 'male',
  })

  return (
    <aside
      aria-label="Active Live Workout Session Bar"
      role="region"
      className="live-session-sticky-dock"
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99998,
        maxWidth: 'calc(100vw - 20px)',
        width: 560,
        background: 'linear-gradient(135deg, rgba(14,23,36,0.98) 0%, rgba(8,14,20,0.98) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(16,185,129,0.5)',
        borderRadius: 12,
        padding: '10px 16px',
        boxShadow: '0 12px 35px rgba(0,0,0,0.8), 0 0 25px rgba(16,185,129,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flexWrap: 'wrap' }}>
        {/* Session Time */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontSize: 10,
                color: '#34D399',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Day {activeWorkoutSessionDay} In Progress
            </span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 18,
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <GaaIcon name="watch" size={14} tone="white" /> {mm}:{ss}
          </div>
        </div>

        {/* Live Heart Rate & NASM Zone Telemetry */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            padding: '4px 8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ animation: hasLiveHr ? 'pulse 1.2s infinite' : 'none', display: 'inline-flex' }}>
              <GaaIcon name="heart" size={13} tone={hasLiveHr ? 'ruby' : 'white'} />
            </span>
            {hasLiveHr ? (
              <span style={{ fontSize: 12, fontWeight: 900, color: '#F87171' }}>
                {telemetry.currentBpm} <span style={{ fontSize: 9.5, color: '#94A3B8' }}>BPM</span>
              </span>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8' }}>
                -- <span style={{ fontSize: 9.5, color: '#64748B' }}>BPM</span>
              </span>
            )}
          </div>

          {hasLiveHr ? (
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 800,
                color: telemetry.zoneColor,
                background: 'rgba(255,255,255,0.06)',
                padding: '1px 5px',
                borderRadius: 3,
                border: `1px solid ${telemetry.zoneColor}40`,
              }}
              title={telemetry.zoneDescription}
            >
              {telemetry.zoneCode === 'zone1' ? 'Zone 1' : telemetry.zoneCode === 'zone2' ? 'Zone 2 (VT1)' : telemetry.zoneCode === 'zone3' ? 'Zone 3 (VT2)' : 'Recovery'} ({telemetry.hrPercentMax}%)
            </div>
          ) : (
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: '#64748B',
                background: 'rgba(255,255,255,0.03)',
                padding: '1px 5px',
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              title="Awaiting live Apple Watch or Bluetooth HR telemetry"
            >
              Live Telemetry
            </div>
          )}

          <div style={{ fontSize: 11, fontWeight: 800, color: '#FBBF24', marginLeft: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
            <GaaIcon name="flame" size={12} tone="amber" /> {telemetry.caloriesBurned} <span style={{ fontSize: 9.5, color: '#94A3B8' }}>kcal</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {activeWorkoutStage === 'strength' && activeWorkout && (
          <button
            type="button"
            onClick={onStartCardio}
            className="tactile-btn"
            style={{
              background: 'linear-gradient(135deg, rgba(212,160,23,0.25) 0%, rgba(170,130,10,0.35) 100%)',
              border: '1px solid #D4AF37',
              color: '#FFFFFF',
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 700,
              fontSize: 11,
              padding: '6px 10px',
              borderRadius: 5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <GaaIcon name="headphones" size={13} tone="gold" />
            <span>➔ Cardio</span>
          </button>
        )}

        {activeWorkoutStage === 'cardio' && (
          <button
            type="button"
            onClick={onStartCardio}
            className="tactile-btn"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
              border: 'none',
              color: '#0A0E18',
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 800,
              fontSize: 11,
              padding: '6px 10px',
              borderRadius: 5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <GaaIcon name="headphones" size={13} tone="dark" />
            <span>Coach in Ear</span>
          </button>
        )}

        <button
          type="button"
          onClick={onPauseResume}
          className="tactile-btn"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#FFFFFF',
            padding: '7px 12px',
            borderRadius: 5,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <GaaIcon name={isWorkoutTimerActive ? 'pause' : 'play'} size={11} tone="white" />
          {isWorkoutTimerActive ? 'Pause' : 'Resume'}
        </button>

        <button
          type="button"
          onClick={onFinishLifts}
          className="tactile-btn"
          style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            border: '1px solid #10B981',
            color: '#FFFFFF',
            fontFamily: 'Raleway, sans-serif',
            fontWeight: 800,
            fontSize: 11,
            padding: '7px 14px',
            borderRadius: 5,
            cursor: 'pointer',
            boxShadow: '0 0 12px rgba(16,185,129,0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <GaaIcon name="trophy" size={13} tone="white" />
          <span>End Workout ✓</span>
        </button>
      </div>
    </aside>
  )
}
