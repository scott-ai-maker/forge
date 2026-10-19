'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import { triggerHaptic } from '@/lib/offline-sync-queue'

export interface HoldToQuitWorkoutButtonProps {
  onQuit: () => void
  label?: string
  size?: 'sm' | 'md' | 'lg'
  compact?: boolean
  disabled?: boolean
  style?: React.CSSProperties
  holdDurationMs?: number
  ariaLabel?: string
}

/**
 * Tactical Hold-To-Quit Button.
 * Requires an intentional press-and-hold (default 1.2s) to quit or discard
 * an active workout session without penalty or recording a workout.
 * Prevents accidental taps while sweating or handling mobile devices.
 */
export default function HoldToQuitWorkoutButton({
  onQuit,
  label = 'Quit',
  size = 'sm',
  compact = false,
  disabled = false,
  style = {},
  holdDurationMs = 1200,
  ariaLabel = 'Press and hold for 1.2 seconds to quit workout session without penalty',
}: HoldToQuitWorkoutButtonProps) {
  const [holdProgress, setHoldProgress] = useState<number>(0)
  const [isHolding, setIsHolding] = useState<boolean>(false)
  const [showTapHint, setShowTapHint] = useState<boolean>(false)

  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const holdStartTimeRef = useRef<number>(0)
  const tapHintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearHoldTimer = useCallback(() => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current)
      holdIntervalRef.current = null
    }
  }, [])

  const startHold = useCallback((e?: React.SyntheticEvent) => {
    if (disabled) return
    if (e && 'touches' in e && Array.isArray((e as unknown as { touches: unknown[] }).touches) && (e as unknown as { touches: unknown[] }).touches.length > 1) return

    clearHoldTimer()
    holdStartTimeRef.current = Date.now()
    setIsHolding(true)
    setHoldProgress(0)

    try {
      triggerHaptic('tap')
    } catch {}

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartTimeRef.current
      const progress = Math.min(100, (elapsed / holdDurationMs) * 100)
      setHoldProgress(progress)

      if (progress >= 100) {
        clearHoldTimer()
        setIsHolding(false)
        setHoldProgress(0)
        try {
          triggerHaptic('heavy')
          if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate?.([50, 40, 90])
          }
        } catch {}
        onQuit()
      }
    }, 25)
  }, [clearHoldTimer, disabled, holdDurationMs, onQuit])

  const cancelHold = useCallback(() => {
    const elapsed = Date.now() - holdStartTimeRef.current
    clearHoldTimer()

    // If tapped briefly (<380ms) without completing, show tactile helper
    if (isHolding && elapsed > 0 && elapsed < 380) {
      setShowTapHint(true)
      if (tapHintTimeoutRef.current) clearTimeout(tapHintTimeoutRef.current)
      tapHintTimeoutRef.current = setTimeout(() => {
        setShowTapHint(false)
      }, 2200)
    }

    setIsHolding(false)
    setHoldProgress(0)
  }, [clearHoldTimer, isHolding])

  useEffect(() => {
    return () => {
      clearHoldTimer()
      if (tapHintTimeoutRef.current) clearTimeout(tapHintTimeoutRef.current)
    }
  }, [clearHoldTimer])

  // Key navigation support (Enter / Space press and hold)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      if (!isHolding) {
        startHold()
      }
    }
  }, [isHolding, startHold])

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      cancelHold()
    }
  }, [cancelHold])

  const padding = size === 'lg' ? '12px 18px' : size === 'md' ? '9px 14px' : '7px 11px'
  const fontSize = size === 'lg' ? 13 : size === 'md' ? 12 : 11

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        role="button"
        aria-label={ariaLabel}
        disabled={disabled}
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
        onTouchCancel={cancelHold}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onContextMenu={e => e.preventDefault()}
        className="tactile-btn"
        style={{
          position: 'relative',
          overflow: 'hidden',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
          background: isHolding
            ? 'rgba(239, 68, 68, 0.22)'
            : 'rgba(239, 68, 68, 0.1)',
          border: isHolding
            ? '1px solid #EF4444'
            : '1px solid rgba(239, 68, 68, 0.35)',
          color: isHolding ? '#FEE2E2' : '#FCA5A5',
          fontFamily: 'var(--font-sans, Raleway), sans-serif',
          fontWeight: 800,
          fontSize,
          padding,
          borderRadius: 5,
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          letterSpacing: '0.02em',
          transition: 'border-color 0.15s ease, background 0.15s ease',
          boxShadow: isHolding ? '0 0 14px rgba(239, 68, 68, 0.45)' : 'none',
          ...style,
        }}
      >
        {/* Animated Progress Fill Bar */}
        {isHolding && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: `${holdProgress}%`,
              background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.45) 0%, rgba(220, 38, 38, 0.75) 100%)',
              transition: 'width 25ms linear',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}

        {/* Foreground Content */}
        <span
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <GaaIcon name="close" size={size === 'lg' ? 13 : 11} tone={isHolding ? 'ruby' : 'ruby'} />
          {!compact && (
            <span>
              {isHolding
                ? `${Math.round(holdProgress)}% Holding...`
                : label}
            </span>
          )}
          {compact && isHolding && (
            <span style={{ fontSize: 9.5 }}>{Math.round(holdProgress)}%</span>
          )}
        </span>
      </button>

      {/* Micro-hint on accidental short tap */}
      {showTapHint && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 5,
            padding: '4px 8px',
            fontSize: 10,
            fontWeight: 700,
            color: '#FECACA',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            zIndex: 99999,
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          Hold to quit without penalty
        </div>
      )}
    </div>
  )
}
