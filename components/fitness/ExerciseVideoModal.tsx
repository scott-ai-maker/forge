'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getNasmClinicalMovementCard } from '@/lib/nasm-clinical-movement-cards'
import { resolveGaaExerciseImage } from '@/lib/nasm-generated-images'
import { isStrengthExercise } from '@/lib/exercise-logging-helpers'
import GaaIcon from '@/components/ui/GaaIcon'

export interface ExerciseModalData {
  name: string
  block?: string | null
  videoUrl?: string | null
  imageUrl?: string | null
  coachingCues?: string[] | null
  description?: string | null
  primaryEquipment?: string[] | null
  instructions?: string[] | null
  target?: string | null
  protocol?: string | null
  phaseLabel?: string | null
}

export interface ExerciseVideoModalProps {
  exercise: ExerciseModalData
  onClose: () => void
}

export default function ExerciseVideoModal({
  exercise,
  onClose,
}: ExerciseVideoModalProps) {
  const [mounted, setMounted] = useState(false)

  const card = getNasmClinicalMovementCard(exercise.name, {
    imageUrl: exercise.imageUrl,
    videoUrl: exercise.videoUrl,
    description: exercise.description || exercise.protocol || exercise.target,
    instructions: exercise.instructions,
    coachingCues: exercise.coachingCues,
    primaryEquipment: exercise.primaryEquipment,
  })

  const [activeMediaTab, setActiveMediaTab] = useState<'photo' | 'video'>(
    card.imageUrl || card.fallbackImageUrl ? 'photo' : 'video'
  )

  useEffect(() => {
    setMounted(true)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!mounted) return null

  const howToSteps =
    exercise.instructions && exercise.instructions.length > 0
      ? exercise.instructions
      : card.howToSteps

  const displayOptPhase = exercise.phaseLabel || card.optPhase

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Official NASM Movement Standards: ${card.name}`}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 100060,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="responsive-modal-surface"
        style={{
          background: 'linear-gradient(180deg, #101626 0%, #090D18 100%)',
          border: '1px solid rgba(212,160,23,0.45)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9)',
          color: '#FFFFFF',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            background: 'rgba(212,160,23,0.05)',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--gold-lt)',
                fontWeight: 800,
              }}
            >
              Official NASM Movement Standards · {card.category}
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 20,
                margin: '2px 0 0',
                color: '#FFFFFF',
                letterSpacing: '0.04em',
                fontWeight: 700,
              }}
            >
              {card.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="✕"
            title="Close modal"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#FFFFFF',
              width: 32,
              height: 32,
              borderRadius: 16,
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Visual Hero: Official GAA Form Photography & NASM Edge Video */}
        <div
          style={{
            background: 'rgba(0,0,0,0.5)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '16px 20px',
          }}
        >
          {card.embedUrl && (card.imageUrl || card.fallbackImageUrl) && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setActiveMediaTab('photo')}
                className="tactile-btn"
                style={{
                  padding: '5px 12px',
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 4,
                  border:
                    activeMediaTab === 'photo'
                      ? '1px solid rgba(212,160,23,0.6)'
                      : '1px solid rgba(255,255,255,0.12)',
                  background:
                    activeMediaTab === 'photo'
                      ? 'rgba(212,160,23,0.18)'
                      : 'rgba(255,255,255,0.04)',
                  color:
                    activeMediaTab === 'photo'
                      ? 'var(--gold-lt)'
                      : 'var(--gray)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <GaaIcon
                  name="book"
                  size={12}
                  tone={activeMediaTab === 'photo' ? 'gold' : 'slate'}
                />
                <span>Verified Form Photo</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMediaTab('video')}
                className="tactile-btn"
                style={{
                  padding: '5px 12px',
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 4,
                  border:
                    activeMediaTab === 'video'
                      ? '1px solid rgba(56,189,248,0.6)'
                      : '1px solid rgba(255,255,255,0.12)',
                  background:
                    activeMediaTab === 'video'
                      ? 'rgba(56,189,248,0.18)'
                      : 'rgba(255,255,255,0.04)',
                  color:
                    activeMediaTab === 'video' ? '#38BDF8' : 'var(--gray)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <GaaIcon
                  name="play"
                  size={12}
                  tone={activeMediaTab === 'video' ? 'cyan' : 'slate'}
                />
                <span>Video Demonstration</span>
              </button>
            </div>
          )}

          {activeMediaTab === 'video' && card.embedUrl ? (
            <div
              style={{
                position: 'relative',
                width: '100%',
                paddingTop: '56.25%',
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid rgba(212,160,23,0.4)',
                background: '#000000',
                marginBottom: 14,
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              }}
            >
              <iframe
                src={card.embedUrl}
                title={`Official NASM Exercise Video: ${card.name}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
              />
            </div>
          ) : card.imageUrl || card.fallbackImageUrl ? (
            <div
              style={{
                width: '100%',
                aspectRatio: '16 / 9',
                maxHeight: 'clamp(220px, 38vh, 340px)',
                height: 'auto',
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid rgba(212,160,23,0.35)',
                backgroundColor: '#0A0E18',
                marginBottom: 14,
                position: 'relative',
                boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
              }}
            >
              <img
                src={
                  resolveGaaExerciseImage(card.name, false) ||
                  card.imageUrl ||
                  card.fallbackImageUrl ||
                  '/images/exercises/image-not-available.jpg'
                }
                alt={card.name}
                loading="lazy"
                decoding="async"
                onError={e => {
                  ;(e.currentTarget as HTMLImageElement).src =
                    '/images/exercises/image-not-available.jpg'
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block',
                }}
              />
              {card.embedUrl && (
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('video')}
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 10,
                    background: 'rgba(0,0,0,0.82)',
                    border: '1px solid rgba(212,160,23,0.55)',
                    color: 'var(--gold-lt)',
                    borderRadius: 5,
                    padding: '6px 12px',
                    fontSize: 11.5,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                  }}
                >
                  <GaaIcon name="play" size={12} tone="gold" />
                  <span>Watch Video Demo</span>
                </button>
              )}
            </div>
          ) : null}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  color: 'var(--gray)',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                }}
              >
                OPT™ Model Periodization
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--gold-lt)',
                  fontWeight: 700,
                  marginTop: 2,
                }}
              >
                {displayOptPhase}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {isStrengthExercise(
                exercise.name || card.name,
                exercise.block
              ) && card.tempo ? (
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      textTransform: 'uppercase',
                      color: 'var(--gray)',
                      fontWeight: 700,
                    }}
                  >
                    Clinical Tempo
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#FFFFFF',
                      fontWeight: 600,
                      marginTop: 2,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <GaaIcon name="watch" size={12} tone="gold" />
                    <span>{card.tempo}</span>
                  </div>
                </div>
              ) : null}

              <div>
                <div
                  style={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    color: 'var(--gray)',
                    fontWeight: 700,
                  }}
                >
                  Required Equipment
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 4,
                    marginTop: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  {card.equipment.map(item => (
                    <span
                      key={item}
                      style={{
                        background: 'rgba(212,160,23,0.15)',
                        color: 'var(--gold)',
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 3,
                        fontWeight: 700,
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {/* Step-by-Step How-To Execution Guide */}
          <div
            style={{
              background: 'rgba(0,0,0,0.35)',
              borderLeft: '3px solid var(--gold)',
              borderRadius: '0 8px 8px 0',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--gold)',
                fontWeight: 800,
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="book" size={14} tone="gold" />
              <span>Step-by-Step How-To Instructions</span>
            </div>
            <div
              style={{
                display: 'grid',
                gap: 8,
                fontSize: 12.5,
                lineHeight: 1.5,
                color: '#E2E8F0',
              }}
            >
              {howToSteps.map((step, sIdx) => (
                <div
                  key={sIdx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      background: 'rgba(212,160,23,0.25)',
                      color: 'var(--gold-lt)',
                      border: '1px solid rgba(212,160,23,0.5)',
                      borderRadius: '50%',
                      width: 22,
                      height: 22,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 800,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {sIdx + 1}
                  </span>
                  <span style={{ flex: 1 }}>
                    {step.replace(/^\d+\.\s*/, '')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Functional Anatomy & Synergies Matrix */}
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--gold-lt)',
                fontWeight: 800,
                marginBottom: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="muscle" size={14} tone="gold" />
              <span>Functional Muscle Synergies & Prime Movers</span>
            </div>
            <div
              className="movement-card-anatomy-grid"
              style={{ fontSize: 12 }}
            >
              <div>
                <span
                  style={{
                    color: 'var(--gray)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <GaaIcon name="target" size={12} tone="gold" /> Prime Mover:
                </span>{' '}
                <span style={{ color: '#FFFFFF', fontWeight: 700 }}>
                  {card.primeMover}
                </span>
              </div>
              <div>
                <span
                  style={{
                    color: 'var(--gray)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <GaaIcon name="handshake" size={12} tone="gold" /> Synergists:
                </span>{' '}
                <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                  {card.synergists.join(', ')}
                </span>
              </div>
              <div>
                <span
                  style={{
                    color: 'var(--gray)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <GaaIcon name="shield-check" size={12} tone="gold" />{' '}
                  Stabilizers:
                </span>{' '}
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {card.stabilizers.join(', ')}
                </span>
              </div>
              <div>
                <span
                  style={{
                    color: 'var(--gray)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <GaaIcon name="rotate-ccw" size={12} tone="gold" />{' '}
                  Antagonists:
                </span>{' '}
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {card.antagonists.join(', ')}
                </span>
              </div>
            </div>
          </div>

          {/* 5 Kinetic Checkpoints Alignment */}
          <div
            style={{
              background: 'rgba(212,160,23,0.04)',
              border: '1px solid rgba(212,160,23,0.2)',
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--gold)',
                fontWeight: 800,
                marginBottom: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="angle" size={14} tone="gold" />
              <span>5 Kinetic Chain Checkpoint Standards</span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                fontSize: 12,
              }}
            >
              <div>
                <strong>1. Feet & Ankles:</strong>{' '}
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {card.kineticCheckpoints.feetAnkles}
                </span>
              </div>
              <div>
                <strong>2. Knees:</strong>{' '}
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {card.kineticCheckpoints.knees}
                </span>
              </div>
              <div>
                <strong>3. LPHC (Pelvis & Spine):</strong>{' '}
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {card.kineticCheckpoints.lphc}
                </span>
              </div>
              <div>
                <strong>4. Shoulders:</strong>{' '}
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {card.kineticCheckpoints.shoulders}
                </span>
              </div>
              <div>
                <strong>5. Head & Neck:</strong>{' '}
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {card.kineticCheckpoints.headNeck}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: 14,
            }}
          >
            {card.videoUrl ? (
              <a
                href={card.videoUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: 'var(--gold-lt)',
                  fontSize: 12,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontWeight: 600,
                }}
              >
                <GaaIcon name="video-studio" size={13} tone="ruby" />
                <span>Open Official NASM Edge Video in YouTube ↗</span>
              </a>
            ) : (
              <span
                style={{
                  color: 'var(--gray)',
                  fontSize: 12,
                  fontStyle: 'italic',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <GaaIcon name="video-studio" size={13} tone="slate" />
                <span>Video Demo Available via NASM Edge</span>
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                marginLeft: 'auto',
                padding: '8px 18px',
                background:
                  'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                color: '#0A0E18',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Back to Workout
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

