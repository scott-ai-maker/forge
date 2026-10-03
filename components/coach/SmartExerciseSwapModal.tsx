'use client'

import { useState } from 'react'
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
  onSelectSubstitution: (substitution: ExerciseSubstitution) => void
  onClose: () => void
}

export default function SmartExerciseSwapModal({
  currentExerciseName,
  optPhase = 'Phase 2: Strength Endurance',
  initialDiscomfort,
  onSelectSubstitution,
  onClose,
}: SmartExerciseSwapModalProps) {
  const [selectedDiscomfort, setSelectedDiscomfort] = useState<DiscomfortArea | undefined>(initialDiscomfort)

  const pattern = detectMovementPattern(currentExerciseName)
  const substitutions = getSmartSubstitutions(currentExerciseName, optPhase, selectedDiscomfort)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100004,
        background: 'rgba(4,7,14,0.88)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          maxWidth: 680,
          width: '100%',
          background: 'linear-gradient(180deg, #0D1629 0%, #080D1A 100%)',
          border: '1px solid rgba(212,160,23,0.5)',
          borderRadius: 14,
          padding: 24,
          boxShadow: '0 25px 70px rgba(0,0,0,0.9)',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)', fontWeight: 800 }}>
              NASM Smart Biomechanical Substitution Engine
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 20, margin: '4px 0 0', color: '#FFFFFF', letterSpacing: '0.04em' }}>
              SUBSTITUTE: {currentExerciseName}
            </h2>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
              Pattern: <strong style={{ color: 'var(--gold-lt)', textTransform: 'capitalize' }}>{pattern.replace('_', ' ')}</strong> · {optPhase}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#FFFFFF',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
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
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: undefined, label: 'All Options', icon: 'lightning' as const },
              { id: 'runners_knee' as DiscomfortArea, label: "Runner's Knee", icon: 'runner' as const },
              { id: 'tennis_elbow' as DiscomfortArea, label: 'Tennis Elbow', icon: 'bandage' as const },
              { id: 'golfers_elbow' as DiscomfortArea, label: "Golfer's Elbow", icon: 'bandage' as const },
              { id: 'shoulder' as DiscomfortArea, label: 'Shoulder / Rotator Cuff', icon: 'shield-check' as const },
              { id: 'lower_back' as DiscomfortArea, label: 'Lower Back / Lumbar', icon: 'shield-check' as const },
              { id: 'knee' as DiscomfortArea, label: 'Knee / Patellar Relief', icon: 'activity' as const },
              { id: 'shin_splints' as DiscomfortArea, label: 'Shin Splints', icon: 'activity' as const },
              { id: 'plantar_fasciitis' as DiscomfortArea, label: 'Plantar Fasciitis', icon: 'activity' as const },
              { id: 'hamstring_strain' as DiscomfortArea, label: 'Hamstring Strain', icon: 'activity' as const },
              { id: 'achilles' as DiscomfortArea, label: 'Achilles Tendinopathy', icon: 'activity' as const },
              { id: 'equipment_busy' as DiscomfortArea, label: 'Equipment Busy', icon: 'dumbbell' as const },
            ].map(tab => (
              <button
                key={String(tab.id)}
                type="button"
                onClick={() => setSelectedDiscomfort(tab.id)}
                style={{
                  padding: '5px 10px',
                  background: selectedDiscomfort === tab.id ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
                  color: selectedDiscomfort === tab.id ? '#0A0E18' : '#FFFFFF',
                  border: selectedDiscomfort === tab.id ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'all 0.15s ease',
                }}
              >
                <GaaIcon name={tab.icon} size={12} tone={selectedDiscomfort === tab.id ? 'dark' : 'gold'} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Substitution Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {substitutions.map((sub, idx) => (
            <div
              key={idx}
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
              <div style={{ flex: 1, minWidth: 260 }}>
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
                onClick={() => {
                  onSelectSubstitution(sub)
                  onClose()
                }}
                className="tactile-btn"
                style={{
                  padding: '8px 16px',
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
    </div>
  )
}
