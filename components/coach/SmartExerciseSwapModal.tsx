'use client'

import { useEffect, useId, useRef, useState } from 'react'
import {
  getSmartSubstitutions,
  detectMovementPattern,
  DiscomfortArea,
  ExerciseSubstitution,
} from '@/lib/nasm-exercise-substitution'
import { GaaIcon } from '@/components/ui/GaaIcon'

interface SmartExerciseSwapModalProps {
  currentExerciseName: string
  optPhase?: string
  initialDiscomfort?: DiscomfortArea
  availableEquipment?: string[]
  onSelectSubstitution: (substitution: ExerciseSubstitution) => void
  onClose: () => void
}

function normalizeFilterChipDiscomfort(discomfort?: DiscomfortArea): DiscomfortArea | undefined {
  if (!discomfort) return undefined
  if (discomfort === 'rotator_cuff') return 'shoulder'
  if (discomfort === 'jumpers_knee' || discomfort === 'it_band') return 'knee'
  return discomfort
}

const DISCOMFORT_FILTER_TABS: ReadonlyArray<{
  id: DiscomfortArea | undefined
  label: string
  icon: 'lightning' | 'runner' | 'bandage' | 'shield-check' | 'activity' | 'dumbbell'
}> = [
  { id: undefined, label: 'All Options', icon: 'lightning' },
  { id: 'runners_knee', label: "Runner's Knee", icon: 'runner' },
  { id: 'tennis_elbow', label: 'Tennis Elbow', icon: 'bandage' },
  { id: 'golfers_elbow', label: "Golfer's Elbow", icon: 'bandage' },
  { id: 'shoulder', label: 'Shoulder / Rotator Cuff', icon: 'shield-check' },
  { id: 'lower_back', label: 'Lower Back / Lumbar', icon: 'shield-check' },
  { id: 'knee', label: 'Knee / Patellar Relief', icon: 'activity' },
  { id: 'shin_splints', label: 'Shin Splints', icon: 'activity' },
  { id: 'plantar_fasciitis', label: 'Plantar Fasciitis', icon: 'activity' },
  { id: 'hamstring', label: 'Hamstring Strain', icon: 'activity' },
  { id: 'achilles', label: 'Achilles Tendinopathy', icon: 'activity' },
  { id: 'equipment_busy', label: 'Equipment Busy', icon: 'dumbbell' },
]

export default function SmartExerciseSwapModal({
  currentExerciseName,
  optPhase = 'Phase 2: Strength Endurance',
  initialDiscomfort,
  availableEquipment,
  onSelectSubstitution,
  onClose,
}: SmartExerciseSwapModalProps) {
  const [selectedDiscomfort, setSelectedDiscomfort] = useState<DiscomfortArea | undefined>(() =>
    normalizeFilterChipDiscomfort(initialDiscomfort)
  )
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (typeof dialog.showModal === 'function' && !dialog.open) {
      try {
        dialog.showModal()
      } catch {
        dialog.setAttribute('open', '')
      }
    }

    const handleNativeClose = () => {
      dialog.returnValue = ''
      onCloseRef.current()
    }
    dialog.addEventListener('close', handleNativeClose)

    // Light-dismiss coordinate fallback for browsers lacking <dialog closedby="any">
    let handleBackdropClick: ((event: MouseEvent) => void) | null = null
    if (typeof HTMLDialogElement !== 'undefined' && !('closedBy' in HTMLDialogElement.prototype)) {
      handleBackdropClick = (event: MouseEvent) => {
        if (event.target !== dialog) return
        const rect = dialog.getBoundingClientRect()
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        if (!isDialogContent) {
          if (typeof dialog.close === 'function') {
            dialog.close()
          } else {
            onCloseRef.current()
          }
        }
      }
      dialog.addEventListener('click', handleBackdropClick)
    }

    return () => {
      dialog.removeEventListener('close', handleNativeClose)
      if (handleBackdropClick) {
        dialog.removeEventListener('click', handleBackdropClick)
      }
    }
  }, [])

  const pattern = detectMovementPattern(currentExerciseName)
  const substitutions = getSmartSubstitutions(
    currentExerciseName,
    optPhase,
    selectedDiscomfort,
    availableEquipment
  )

  const handleDismiss = () => {
    const dialog = dialogRef.current
    if (dialog?.open && typeof dialog.close === 'function') {
      dialog.close()
    } else {
      onClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      data-testid="smart-exercise-swap-modal"
      className="forge-glass-modal"
      {...({ closedby: 'any' } as Record<string, string>)}
      style={{
        zIndex: 100004,
        margin: 'auto',
        maxWidth: 680,
        width: 'min(680px, calc(100vw - 32px))',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'linear-gradient(180deg, #0D1629 0%, #080D1A 100%)',
        border: '1px solid rgba(212,160,23,0.5)',
        borderRadius: 14,
        padding: 0,
        color: '#FFFFFF',
        boxShadow: '0 25px 70px rgba(0,0,0,0.9)',
      }}
    >
      <div
        style={{
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)', fontWeight: 800 }}>
              NASM Smart Biomechanical Substitution Engine
            </div>
            <h2
              id={headingId}
              style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 20, margin: '4px 0 0', color: '#FFFFFF', letterSpacing: '0.04em' }}
            >
              SUBSTITUTE: {currentExerciseName}
            </h2>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
              Pattern: <strong style={{ color: 'var(--gold-lt)', textTransform: 'capitalize' }}>{pattern.replace('_', ' ')}</strong> · {optPhase}
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close exercise substitution dialog"
            style={{
              minHeight: 45,
              minWidth: 45,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#FFFFFF',
              borderRadius: 6,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Discomfort / Constraint Filter Bar */}
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700, marginBottom: 6 }}>
            Filter by Joint Discomfort, Sports Injury, or Constraint:
          </div>
          <div role="group" aria-label="Joint discomfort or equipment constraint filter" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {DISCOMFORT_FILTER_TABS.map(tab => {
              const isPressed = selectedDiscomfort === tab.id
              return (
                <button
                  key={String(tab.id)}
                  type="button"
                  aria-pressed={isPressed}
                  onClick={() => setSelectedDiscomfort(tab.id)}
                  style={{
                    minHeight: 45,
                    padding: '8px 12px',
                    background: isPressed ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
                    color: isPressed ? '#0A0E18' : '#FFFFFF',
                    border: isPressed ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <GaaIcon name={tab.icon} size={12} tone={isPressed ? 'dark' : 'gold'} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Substitution Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {substitutions.map((sub, idx) => (
            <div
              key={idx}
              data-testid={`swap-option-card-${idx}`}
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 10,
                      background:
                        sub.benefitTag === 'Pain-Free Regression'
                          ? 'rgba(52,211,153,0.15)'
                          : sub.benefitTag === 'Machine / Cable Swap'
                          ? 'rgba(59,130,246,0.15)'
                          : 'rgba(212,160,23,0.15)',
                      color:
                        sub.benefitTag === 'Pain-Free Regression'
                          ? '#34D399'
                          : sub.benefitTag === 'Machine / Cable Swap'
                          ? '#60A5FA'
                          : 'var(--gold-lt)',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                    }}
                  >
                    {sub.benefitTag}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                    Tempo: <strong style={{ color: '#FFFFFF' }}>{sub.prescribedTempo}</strong>
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                    · {sub.equipmentRequired}
                  </span>
                </div>

                <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 18, color: '#FFFFFF', margin: '4px 0 2px' }}>
                  {sub.name}
                </div>

                <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
                  {sub.reasoning}
                </p>
              </div>

              <button
                type="button"
                aria-label={`Select substitution ${sub.name}`}
                onClick={() => {
                  onSelectSubstitution(sub)
                  handleDismiss()
                }}
                className="tactile-btn"
                style={{
                  minHeight: 45,
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #D4AF37 0%, #8A6508 100%)',
                  color: '#0A0E18',
                  border: 'none',
                  borderRadius: 6,
                  fontFamily: 'var(--font-sans, Raleway), sans-serif',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Select Substitution →
              </button>
            </div>
          ))}
        </div>
      </div>
    </dialog>
  )
}
