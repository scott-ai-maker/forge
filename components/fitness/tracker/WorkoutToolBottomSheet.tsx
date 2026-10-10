'use client'

import React, { useEffect, useCallback } from 'react'
import GaaIcon, { GaaIconName } from '@/components/ui/GaaIcon'

export type WorkoutToolTab = 'form' | 'warmup' | 'intensity' | 'science' | 'telemetry'

export interface WorkoutToolBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  activeTool: WorkoutToolTab
  onSelectTool: (tool: WorkoutToolTab) => void
  exerciseName: string
  availableTools?: WorkoutToolTab[]
  triggerHaptic?: (type: 'tap' | 'heavy' | 'success') => void
  children: React.ReactNode
}

interface ToolMeta {
  title: string
  shortLabel: string
  icon: GaaIconName
  tone: 'gold' | 'emerald' | 'amber' | 'cyan' | 'slate' | 'white'
  accentColor: string
}

const TOOL_CONFIG: Record<WorkoutToolTab, ToolMeta> = {
  form: {
    title: 'Form & NASM Clinical Technique',
    shortLabel: 'Form Guide',
    icon: 'book',
    tone: 'gold',
    accentColor: '#D4AF37',
  },
  warmup: {
    title: 'Warm-Up Ramp Progression Wizard',
    shortLabel: 'Warmup & Plates',
    icon: 'sparkles',
    tone: 'gold',
    accentColor: '#F59E0B',
  },
  intensity: {
    title: 'Intensity Protocols (Drop Sets & Myo-Reps)',
    shortLabel: 'Intensity Sets',
    icon: 'flame',
    tone: 'amber',
    accentColor: '#F59E0B',
  },
  science: {
    title: 'Sports Science & Autoregulation',
    shortLabel: 'Science & Deload',
    icon: 'award',
    tone: 'cyan',
    accentColor: '#38BDF8',
  },
  telemetry: {
    title: 'Advanced Telemetry & Cadence Metronome',
    shortLabel: 'Telemetry & 1RM',
    icon: 'settings',
    tone: 'slate',
    accentColor: '#94A3B8',
  },
}

export default function WorkoutToolBottomSheet({
  isOpen,
  onClose,
  activeTool,
  onSelectTool,
  exerciseName,
  availableTools = ['form', 'warmup', 'intensity', 'science', 'telemetry'],
  triggerHaptic,
  children,
}: WorkoutToolBottomSheetProps) {
  // Handle escape key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (!isOpen) return
    window.addEventListener('keydown', handleKeyDown)

    // Lock body scrolling when bottom sheet is open
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const currentToolMeta = TOOL_CONFIG[activeTool] ?? TOOL_CONFIG.warmup

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${currentToolMeta.title} - ${exerciseName}`}
      data-testid="workout-tool-bottom-sheet"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100060,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* ── Backdrop Scrim (Tap to Dismiss) ── */}
      <div
        data-testid="bottom-sheet-backdrop"
        onClick={() => {
          triggerHaptic?.('tap')
          onClose()
        }}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(5, 9, 17, 0.78)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* ── Native-Style Modal Bottom Sheet Surface ── */}
      <div
        data-testid="bottom-sheet-surface"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 680,
          maxHeight: 'min(88vh, 840px)',
          background: 'linear-gradient(180deg, #0F172A 0%, #070B14 100%)',
          borderTop: '1px solid rgba(212, 160, 23, 0.4)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -12px 48px rgba(0, 0, 0, 0.85), 0 0 24px rgba(212, 160, 23, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1,
          overflow: 'hidden',
          animation: 'workoutSheetSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* CSS Keyframe for hardware-accelerated slide-up */}
        <style>{`
          @keyframes workoutSheetSlideUp {
            from {
              transform: translateY(100%);
              opacity: 0.9;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}</style>

        {/* ── Top Drag Indicator Pill (Apple iOS / Android HIG standard) ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 8,
            paddingBottom: 4,
            cursor: 'pointer',
          }}
          onClick={onClose}
          aria-hidden="true"
        >
          <div
            style={{
              width: 40,
              height: 4.5,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.28)',
            }}
          />
        </div>

        {/* ── Header: Tool Identity, Exercise Name & Close Button ── */}
        <div
          style={{
            padding: '8px 16px 10px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name={currentToolMeta.icon} size={14} tone={currentToolMeta.tone} />
              <h2
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  fontWeight: 800,
                  color: currentToolMeta.accentColor,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentToolMeta.title}
              </h2>
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: '#94A3B8',
                fontWeight: 600,
                marginTop: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span>Target:</span>
              <span style={{ color: '#F1F5F9', fontWeight: 700 }}>{exerciseName}</span>
            </div>
          </div>

          {/* Tactile Close Button */}
          <button
            type="button"
            data-testid="bottom-sheet-close-btn"
            onClick={() => {
              triggerHaptic?.('tap')
              onClose()
            }}
            className="tactile-btn"
            aria-label="Close tools sheet"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <GaaIcon name="close" size={14} tone="white" />
          </button>
        </div>

        {/* ── Segmented Navigation Strip (Switch tools without leaving sheet) ── */}
        <div
          data-testid="bottom-sheet-tab-strip"
          style={{
            padding: '8px 14px',
            background: 'rgba(7, 11, 20, 0.7)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}
        >
          {availableTools.map(toolKey => {
            const meta = TOOL_CONFIG[toolKey]
            if (!meta) return null
            const isActive = activeTool === toolKey
            return (
              <button
                key={toolKey}
                type="button"
                data-testid={`sheet-tab-${toolKey}`}
                onClick={() => {
                  triggerHaptic?.('tap')
                  onSelectTool(toolKey)
                }}
                className="tactile-btn"
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  border: isActive ? `1.5px solid ${meta.accentColor}` : '1px solid rgba(255, 255, 255, 0.1)',
                  background: isActive ? 'rgba(212, 160, 23, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? meta.accentColor : '#94A3B8',
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <GaaIcon name={meta.icon} size={11} tone={isActive ? meta.tone : 'slate'} />
                <span>{meta.shortLabel}</span>
              </button>
            )
          })}
        </div>

        {/* ── Scrollable Content Area with Safe-Area Padding ── */}
        <div
          data-testid="bottom-sheet-content"
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            padding: '14px 16px calc(24px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
