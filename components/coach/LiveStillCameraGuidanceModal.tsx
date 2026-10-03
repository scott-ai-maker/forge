'use client'

import { useState } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  detectStillCameraPlatform,
  IOS_STILL_CAMERA_STEPS,
  ANDROID_STILL_CAMERA_STEPS,
  type MobileCameraPlatform,
} from '@/lib/camera-still-mode'

interface LiveStillCameraGuidanceModalProps {
  isOpen: boolean
  onClose: () => void
  requestedByCoachName?: string
}

export default function LiveStillCameraGuidanceModal({
  isOpen,
  onClose,
  requestedByCoachName = 'Coach Scott Gordon',
}: LiveStillCameraGuidanceModalProps) {
  const initialPlatform = detectStillCameraPlatform()
  const [selectedPlatform, setSelectedPlatform] = useState<MobileCameraPlatform>(
    initialPlatform === 'android' ? 'android' : 'ios'
  )

  if (!isOpen) return null

  const steps = selectedPlatform === 'android' ? ANDROID_STILL_CAMERA_STEPS : IOS_STILL_CAMERA_STEPS

  return (
    <div
      data-testid="still-camera-guidance-modal"
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(4, 7, 14, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #0A0F1D 0%, #060912 100%)',
          border: '1px solid rgba(212, 175, 55, 0.45)',
          borderRadius: 16,
          maxWidth: 520,
          width: '100%',
          boxShadow: '0 24px 60px rgba(0,0,0,0.85), 0 0 30px rgba(212,175,55,0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header Ribbon */}
        <div
          style={{
            background: 'rgba(212, 175, 55, 0.08)',
            borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid var(--gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(212,175,55,0.3)',
              }}
            >
              <GaaIcon name="camera" size={18} tone="gold" />
            </div>
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
                Kinetic Chain Alignment Protocol
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                  fontSize: 17,
                  letterSpacing: '0.04em',
                  color: '#FFFFFF',
                  margin: '2px 0 0',
                }}
              >
                Still Camera Required
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#9CA3AF',
            }}
          >
            <GaaIcon name="close" size={14} tone="white" />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Coach Request Callout */}
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 10,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 16 }}>🎯</span>
            <p style={{ margin: 0, fontSize: 13, color: '#E0F2FE', lineHeight: 1.45 }}>
              <strong style={{ color: '#93C5FD' }}>{requestedByCoachName}</strong> needs a static wide-angle view. Phone auto-zoom / auto-follow (Center Stage) disrupts kinetic chain tracking and moves joint alignment reference points.
            </p>
          </div>

          {/* Device Tabs */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 8,
              padding: 3,
              gap: 4,
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedPlatform('ios')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: selectedPlatform === 'ios' ? 'var(--gold)' : 'transparent',
                color: selectedPlatform === 'ios' ? '#0A0E18' : '#9CA3AF',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              iPhone / iPad (iOS)
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlatform('android')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: selectedPlatform === 'android' ? 'var(--gold)' : 'transparent',
                color: selectedPlatform === 'android' ? '#0A0E18' : '#9CA3AF',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Android (Samsung / Pixel)
            </button>
          </div>

          {/* Step-by-Step Instructions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {steps.map(step => (
              <div
                key={step.step}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'rgba(212,175,55,0.2)',
                    border: '1px solid var(--gold)',
                    color: 'var(--gold-lt)',
                    fontSize: 11,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {step.step}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#D1D5DB', marginTop: 2, lineHeight: 1.4 }}>
                    {step.instruction}
                  </div>
                  {step.detail && (
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3, fontStyle: 'italic' }}>
                      {step.detail}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Reassurance Footer */}
          <p style={{ margin: 0, fontSize: 11.5, color: '#9CA3AF', lineHeight: 1.4, textAlign: 'center' }}>
            💡 Your browser remembers this preference. Once toggled off, your camera will stay locked in a still frame for all future live sessions.
          </p>

          {/* Action Button */}
          <button
            type="button"
            onClick={onClose}
            data-testid="still-camera-dismiss-btn"
            style={{
              padding: '12px',
              background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
              border: 'none',
              borderRadius: 8,
              color: '#0A0E18',
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(212,175,55,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <GaaIcon name="check" size={15} tone="inherit" />
            <span>Got It · Camera Is Still</span>
          </button>
        </div>
      </div>
    </div>
  )
}

