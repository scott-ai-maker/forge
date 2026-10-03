'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import GaaIcon from '@/components/ui/GaaIcon'
import GaaMasterWatermarkSeal from '@/components/ui/GaaMasterWatermarkSeal'
import {
  TutorialAudience,
  TutorialStep,
  CLIENT_TUTORIAL_STEPS,
  COACH_TUTORIAL_STEPS,
} from '@/lib/tutorials-data'

interface InteractiveFeatureTutorialModalProps {
  isOpen: boolean
  initialAudience?: TutorialAudience
  onClose: () => void
}

export default function InteractiveFeatureTutorialModal({
  isOpen,
  initialAudience = 'client',
  onClose,
}: InteractiveFeatureTutorialModalProps) {
  const [audience, setAudience] = useState<TutorialAudience>(initialAudience)
  const [stepIndex, setStepIndex] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  // Keep audience in sync with props
  useEffect(() => {
    setAudience(initialAudience)
  }, [initialAudience])

  // Get current active steps based on selected audience
  const steps: TutorialStep[] = audience === 'coach' ? COACH_TUTORIAL_STEPS : CLIENT_TUTORIAL_STEPS
  const currentStep = steps[stepIndex] || steps[0]

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`gaa_${audience}_tutorial_completed`, 'true')
        if (dontShowAgain) {
          localStorage.setItem('gaa_tutorial_auto_launch_disabled', 'true')
        }
      } catch {}
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100050,
        background: 'rgba(4, 7, 13, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 680,
          background: 'linear-gradient(180deg, rgba(14, 23, 38, 0.98) 0%, rgba(8, 14, 24, 0.99) 100%)',
          border: '1.5px solid var(--gold)',
          borderTop: '1px solid rgba(255, 255, 255, 0.25)',
          borderRadius: 14,
          padding: 'clamp(20px, 3.5vw, 32px)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.9), 0 0 35px rgba(197, 160, 89, 0.15)',
          display: 'grid',
          gap: 18,
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Background Engraved Watermark Seal */}
        <div style={{ position: 'absolute', top: -20, right: -20, zIndex: 0, pointerEvents: 'none' }}>
          <GaaMasterWatermarkSeal size={180} opacity={0.06} subtitle="FEATURE TUTORIAL" />
        </div>

        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: 800,
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.16em',
                  padding: '3px 8px',
                  background: 'rgba(197, 160, 89, 0.15)',
                  color: 'var(--gold-lt)',
                  border: '1px solid rgba(197, 160, 89, 0.4)',
                  borderRadius: 4,
                }}
              >
                {currentStep.badge}
              </span>

              {/* Audience Toggle Pill */}
              <div style={{ display: 'inline-flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 6, padding: 2, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <button
                  type="button"
                  onClick={() => { setAudience('client'); setStepIndex(0); }}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 4,
                    fontSize: 10.5,
                    fontWeight: 700,
                    background: audience === 'client' ? 'var(--gold)' : 'transparent',
                    color: audience === 'client' ? '#080E14' : 'var(--gray)',
                    cursor: 'pointer',
                  }}
                >
                  Athlete Tour
                </button>
                <button
                  type="button"
                  onClick={() => { setAudience('coach'); setStepIndex(0); }}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 4,
                    fontSize: 10.5,
                    fontWeight: 700,
                    background: audience === 'coach' ? 'var(--gold)' : 'transparent',
                    color: audience === 'coach' ? '#080E14' : 'var(--gray)',
                    cursor: 'pointer',
                  }}
                >
                  Coach Tour
                </button>
              </div>
            </div>

            <h3
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 22,
                letterSpacing: '0.04em',
                margin: '6px 0 0',
                color: '#FFFFFF',
                lineHeight: 1.2,
              }}
            >
              {currentStep.title}
            </h3>
            <div style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 700 }}>
              {currentStep.subtitle}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'var(--gray)',
              width: 32,
              height: 32,
              borderRadius: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close Tutorial (You can reopen anytime from the header)"
          >
            <GaaIcon name="close" size={14} tone="slate" />
          </button>
        </div>

        {/* Feature Hero Presentation */}
        <div
          style={{
            background: 'rgba(8, 14, 24, 0.75)',
            border: '1px solid rgba(197, 160, 89, 0.2)',
            borderRadius: 10,
            padding: '16px 18px',
            display: 'grid',
            gap: 12,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Main Description */}
          <p style={{ margin: 0, fontSize: 13, color: '#E2E8F0', lineHeight: 1.55 }}>
            {currentStep.description}
          </p>

          {/* Key Feature Bullet Points */}
          <div style={{ display: 'grid', gap: 6 }}>
            {currentStep.features.map((feat, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#CBD5E1' }}>
                <GaaIcon name="check" size={12} tone="gold" />
                <span>{feat}</span>
              </div>
            ))}
          </div>

          {/* Pro Tip Box if available */}
          {currentStep.proTip && (
            <div
              style={{
                padding: '8px 12px',
                background: 'rgba(197, 160, 89, 0.1)',
                borderLeft: '3px solid var(--gold)',
                borderRadius: 4,
                fontSize: 11.5,
                color: 'var(--gold-lt)',
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6,
              }}
            >
              <GaaIcon name="lightbulb" size={12} tone="gold" />
              <div>
                <strong>Advisory Pro Tip:</strong> {currentStep.proTip}
              </div>
            </div>
          )}
        </div>

        {/* Step Indicator Progress Dots */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
          {steps.map((s, idx) => {
            const isActive = idx === stepIndex
            const isCompleted = idx < stepIndex

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStepIndex(idx)}
                style={{
                  width: isActive ? 28 : 10,
                  height: 10,
                  borderRadius: 5,
                  background: isActive
                    ? 'linear-gradient(90deg, var(--gold) 0%, var(--gold-lt) 100%)'
                    : isCompleted
                    ? 'rgba(197, 160, 89, 0.5)'
                    : 'rgba(255, 255, 255, 0.12)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 0 10px rgba(197, 160, 89, 0.6)' : 'none',
                }}
                title={`Jump to ${s.title}`}
              />
            )
          })}
        </div>

        {/* Bottom Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, position: 'relative', zIndex: 1 }}>
          {/* Left: Quick Jump Link & Auto-launch Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            {currentStep.deepLink && (
              <Link
                href={currentStep.deepLink}
                onClick={onClose}
                className="tactile-btn"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--gold-lt)',
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>{currentStep.actionLabel || 'Go to Feature'} →</span>
              </Link>
            )}
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--gray)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                style={{ accentColor: 'var(--gold)', cursor: 'pointer' }}
              />
              <span>Don&apos;t show again automatically</span>
            </label>
          </div>

          {/* Right: Step Navigation Controls */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={handlePrev}
              disabled={stepIndex === 0}
              className="tactile-btn"
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: stepIndex === 0 ? 'rgba(255, 255, 255, 0.2)' : '#FFFFFF',
                fontSize: 12,
                fontWeight: 700,
                cursor: stepIndex === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              ← Previous
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="tactile-btn"
              style={{
                padding: '8px 18px',
                borderRadius: 6,
                background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                border: 'none',
                color: '#080E14',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(197, 160, 89, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {stepIndex === steps.length - 1 ? (
                <>
                  <GaaIcon name="check" size={12} style={{ color: '#080E14', stroke: '#080E14' }} />
                  <span>Finish Tour</span>
                </>
              ) : (
                <span>Next Feature →</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

