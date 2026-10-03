'use client'

import React, { useState } from 'react'
import {
  CARDIO_PATTERNS,
  buildCardioSession,
  type CardioPatternId,
} from '@/lib/coach-cardio-engine'
import { playCardioVoiceCue, stopCardioVoiceCue } from '@/lib/coach-cardio-voiceover'
import { GaaIcon } from '@/components/ui/GaaIcon'

export interface CoachCardioPrescriberProps {
  clientId: string
  clientName?: string
  clientAge?: number
  onSavedPrescription?: () => void
}

export default function CoachCardioPrescriber({
  clientId,
  clientName = 'Athlete',
  clientAge = 35,
  onSavedPrescription,
}: CoachCardioPrescriberProps) {
  const [selectedPatternId, setSelectedPatternId] = useState<CardioPatternId>('zone2_aerobic_engine')
  const [durationMins, setDurationMins] = useState<number>(20)
  const [customNotes, setCustomNotes] = useState<string>('')
  const [isAudioPreviewPlaying, setIsAudioPreviewPlaying] = useState<boolean>(false)
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)

  const activePattern = CARDIO_PATTERNS[selectedPatternId]

  const sessionPreview = buildCardioSession({
    patternId: selectedPatternId,
    durationMinutes: durationMins,
    athleteName: clientName,
    clientNotes: customNotes,
  })

  // Test Voiceover Audio
  const handleTestVoiceover = async () => {
    if (isAudioPreviewPlaying) {
      stopCardioVoiceCue()
      setIsAudioPreviewPlaying(false)
      return
    }

    const testCue = sessionPreview.intervals[0]?.voiceCues.startCue || sessionPreview.personalizedIntro
    setIsAudioPreviewPlaying(true)

    await playCardioVoiceCue(testCue, {
      onStart: () => setIsAudioPreviewPlaying(true),
      onEnded: () => setIsAudioPreviewPlaying(false),
    })
  }

  // Save Prescription
  const handleSavePrescription = () => {
    try {
      if (typeof window !== 'undefined') {
        const key = `gaa_cardio_rx_${clientId}`
        localStorage.setItem(
          key,
          JSON.stringify({
            patternId: selectedPatternId,
            durationMinutes: durationMins,
            notes: customNotes || activePattern.coachMemoTemplate,
            prescribedAt: new Date().toISOString(),
          })
        )
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3500)
      onSavedPrescription?.()
    } catch {
      // Fallback
    }
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(14, 22, 36, 0.98) 0%, rgba(8, 14, 24, 0.98) 100%)',
        border: '1px solid rgba(212,160,23,0.3)',
        borderRadius: 12,
        padding: 'clamp(14px, 2.5vw, 22px)',
        color: '#FFFFFF',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* ── Prescription Header ────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 14,
          marginBottom: 18,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#D4AF37',
              }}
            >
              ElevenLabs AI Voiceover Suite
            </span>
            <span
              style={{
                padding: '2px 7px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 900,
                background: 'rgba(56,189,248,0.15)',
                color: '#38BDF8',
                border: '1px solid rgba(56,189,248,0.3)',
              }}
            >
              Modality Agnostic &middot; RPE Breathing
            </span>
          </div>

          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: '#FFFFFF',
            }}
          >
            PRESCRIBE AI COACH GORDON CARDIO FOR {clientName.toUpperCase()}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--gray)' }}>
            Select an evidence-based cardio pattern and configure custom session length. Coach Gordon&rsquo;s cloned voice guides RPE, breathing mechanics, and real-time accountability in their ear.
          </p>
        </div>

        {/* Action Buttons: Preview & Save */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={handleTestVoiceover}
            style={{
              background: isAudioPreviewPlaying ? '#EF4444' : 'rgba(212,160,23,0.15)',
              border: isAudioPreviewPlaying ? '1px solid #EF4444' : '1px solid #D4AF37',
              color: isAudioPreviewPlaying ? '#FFFFFF' : '#D4AF37',
              borderRadius: 6,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name={isAudioPreviewPlaying ? 'volume-x' : 'headphones'} size={14} tone="inherit" />
            <span>{isAudioPreviewPlaying ? 'Stop Voice' : 'Preview Voiceover'}</span>
          </button>

          <button
            type="button"
            onClick={handleSavePrescription}
            style={{
              background: saveSuccess ? '#10B981' : 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
              color: '#0A0E18',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              fontSize: 12.5,
              fontWeight: 900,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(212,160,23,0.3)',
            }}
          >
            <GaaIcon name="shield-check" size={14} tone="dark" />
            <span>{saveSuccess ? '✓ Prescribed' : 'Save Prescription'}</span>
          </button>
        </div>
      </div>

      {/* ── Pattern Selection Grid ─────────────────────────────────── */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontSize: 11.5, color: 'var(--gold-lt)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          1. Select Cardiorespiratory Pattern:
        </label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: 10,
            marginTop: 8,
          }}
        >
          {Object.values(CARDIO_PATTERNS).map(pattern => {
            const isSelected = selectedPatternId === pattern.id
            return (
              <button
                key={pattern.id}
                type="button"
                onClick={() => {
                  setSelectedPatternId(pattern.id)
                  setDurationMins(pattern.defaultDurationMins)
                }}
                style={{
                  background: isSelected ? 'rgba(212,160,23,0.15)' : 'rgba(255,255,255,0.02)',
                  border: isSelected ? '2px solid #D4AF37' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: 12,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#D4AF37', fontWeight: 900, textTransform: 'uppercase' }}>
                    {pattern.category}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--gray)' }}>
                    RPE {pattern.targetRpeRange[0]}–{pattern.targetRpeRange[1]}
                  </span>
                </div>

                <div style={{ fontSize: 13, fontWeight: 800, color: isSelected ? '#D4AF37' : '#FFFFFF', margin: '4px 0 2px' }}>
                  {pattern.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray-lt)', lineHeight: 1.3 }}>
                  {pattern.subtitle}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Duration & Customization ───────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
          gap: 16,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8,
          padding: 14,
          marginBottom: 18,
        }}
      >
        {/* Duration Selector */}
        <div>
          <label style={{ fontSize: 11.5, color: 'var(--gold-lt)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            2. Prescribed Session Length (Minutes):
          </label>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {(activePattern.allowedDurations || [10, 15, 20, 30, 45]).map(mins => (
              <button
                key={mins}
                type="button"
                onClick={() => setDurationMins(mins)}
                style={{
                  background: durationMins === mins ? '#D4AF37' : 'rgba(255,255,255,0.05)',
                  color: durationMins === mins ? '#0A0E18' : '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {mins} Mins
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 6 }}>
            Client can also adjust on the fly if schedule changes.
          </div>
        </div>

        {/* Personalized Coach Notes */}
        <div>
          <label style={{ fontSize: 11.5, color: 'var(--gold-lt)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            3. Personalized Coach Directive / Memo:
          </label>
          <textarea
            value={customNotes}
            onChange={e => setCustomNotes(e.target.value)}
            placeholder={activePattern.coachMemoTemplate}
            rows={3}
            style={{
              width: '100%',
              marginTop: 6,
              background: '#0F172A',
              border: '1px solid rgba(212,160,23,0.3)',
              borderRadius: 6,
              padding: '8px 10px',
              fontSize: 12,
              color: '#FFFFFF',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />
        </div>
      </div>

      {/* ── Generated Session Breakdown Preview ────────────────────── */}
      <div
        style={{
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(212,160,23,0.25)',
          borderRadius: 8,
          padding: 14,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 800, textTransform: 'uppercase' }}>
            Prescription Summary &middot; {sessionPreview.durationMinutes} Minutes ({sessionPreview.intervals.length} Segments)
          </span>
          <span style={{ fontSize: 11, color: '#34D399', fontWeight: 700 }}>
            Peak Target: RPE {sessionPreview.maxRpe} / 10
          </span>
        </div>

        {/* Interval timeline cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 8 }}>
          {sessionPreview.intervals.map((interval, idx) => (
            <div
              key={interval.id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6,
                padding: '8px 10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--gray)' }}>
                <span>#{idx + 1}</span>
                <span style={{ color: '#D4AF37', fontWeight: 800 }}>RPE {interval.targetRpe}</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF', margin: '3px 0' }}>
                {interval.title}
              </div>
              <div style={{ fontSize: 9.5, color: 'var(--gray-lt)' }}>
                {Math.round(interval.durationSeconds)}s &middot; {interval.breathingProfile.intensityLabel}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

