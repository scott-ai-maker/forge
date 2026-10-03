'use client'

import React, { useState, useMemo } from 'react'
import {
  diagnosePosturalDistortions,
  PosturalObservationsInput,
  PosturalSyndromeDiagnosis,
} from '@/lib/postural-distortion-engine'
import { GaaIcon } from '@/components/ui/GaaIcon'

export default function PosturalDistortionStudio() {
  const [activeView, setActiveView] = useState<'screener' | 'synergy' | 'cex'>('screener')

  // Checkpoint 1: Feet & Ankles
  const [feetFlatten, setFeetFlatten] = useState<boolean>(true)
  const [feetTurnOut, setFeetTurnOut] = useState<boolean>(false)
  const [heelsElevate, setHeelsElevate] = useState<boolean>(false)

  // Checkpoint 2: Knees
  const [kneesValgus, setKneesValgus] = useState<boolean>(true)
  const [kneesVarus, setKneesVarus] = useState<boolean>(false)
  const [kneesHyperextend, setKneesHyperextend] = useState<boolean>(false)

  // Checkpoint 3: LPHC
  const [anteriorTilt, setAnteriorTilt] = useState<boolean>(true)
  const [posteriorTilt, setPosteriorTilt] = useState<boolean>(false)
  const [forwardLean, setForwardLean] = useState<boolean>(false)
  const [asymShift, setAsymShift] = useState<boolean>(false)

  // Checkpoint 4: Shoulders
  const [roundedShoulders, setRoundedShoulders] = useState<boolean>(false)
  const [shouldersElevated, setShouldersElevated] = useState<boolean>(false)
  const [scapularWinging, setScapularWinging] = useState<boolean>(false)
  const [armsFallForward, setArmsFallForward] = useState<boolean>(false)

  // Checkpoint 5: Head & Neck
  const [forwardHead, setForwardHead] = useState<boolean>(false)
  const [cervicalHyperextend, setCervicalHyperextend] = useState<boolean>(false)

  // Pre-set Presets
  const handleLoadPreset = (preset: 'pronation' | 'lower' | 'upper' | 'mixed' | 'optimal') => {
    // Reset all
    setFeetFlatten(false); setFeetTurnOut(false); setHeelsElevate(false)
    setKneesValgus(false); setKneesVarus(false); setKneesHyperextend(false)
    setAnteriorTilt(false); setPosteriorTilt(false); setForwardLean(false); setAsymShift(false)
    setRoundedShoulders(false); setShouldersElevated(false); setScapularWinging(false); setArmsFallForward(false)
    setForwardHead(false); setCervicalHyperextend(false)

    if (preset === 'pronation') {
      setFeetFlatten(true); setFeetTurnOut(true); setKneesValgus(true)
    } else if (preset === 'lower') {
      setAnteriorTilt(true); setForwardLean(true); setKneesHyperextend(true)
    } else if (preset === 'upper') {
      setRoundedShoulders(true); setShouldersElevated(true); setForwardHead(true); setArmsFallForward(true)
    } else if (preset === 'mixed') {
      setFeetFlatten(true); setKneesValgus(true); setAnteriorTilt(true); setRoundedShoulders(true); setForwardHead(true)
    }
  }

  const diagnosis: PosturalSyndromeDiagnosis = useMemo(() => {
    const input: PosturalObservationsInput = {
      feetFlattenOrPronate: feetFlatten,
      feetTurnOut,
      heelsElevate,
      kneesValgusInward: kneesValgus,
      kneesVarusOutward: kneesVarus,
      kneesHyperextended: kneesHyperextend,
      anteriorPelvicTilt: anteriorTilt,
      posteriorPelvicTilt: posteriorTilt,
      excessiveForwardLean: forwardLean,
      asymmetricWeightShift: asymShift,
      roundedShouldersProtracted: roundedShoulders,
      shouldersElevated,
      scapularWinging,
      armsFallForward,
      forwardHeadCarriage: forwardHead,
      cervicalHyperextension: cervicalHyperextend,
    }
    return diagnosePosturalDistortions(input)
  }, [
    feetFlatten, feetTurnOut, heelsElevate,
    kneesValgus, kneesVarus, kneesHyperextend,
    anteriorTilt, posteriorTilt, forwardLean, asymShift,
    roundedShoulders, shouldersElevated, scapularWinging, armsFallForward,
    forwardHead, cervicalHyperextend
  ])

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #0D1424 0%, #070B14 100%)',
        border: '1px solid rgba(212,160,23,0.3)',
        borderRadius: 12,
        padding: '24px',
        color: '#FFFFFF',
        boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
      }}
    >
      {/* ── Studio Header ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                color: '#0A0E18',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              NASM CPT-7 Ch 11 & CES
            </span>
            <span style={{ fontSize: 12, color: 'var(--gold-lt)', fontWeight: 600 }}>
              Kinetic Chain Checkpoints & Muscle Synergy Decoder
            </span>
          </div>

          <h3
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.04em',
              margin: '6px 0 0',
              color: '#FFFFFF',
            }}
          >
            POSTURAL DISTORTION & MUSCLE SYNERGY DIAGNOSTIC STUDIO
          </h3>
        </div>

        {/* View Navigation */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'screener', label: '5-Checkpoint Screen', icon: 'microscope' as const },
            { id: 'synergy', label: 'Synergy Decoder Matrix', icon: 'lightning' as const },
            { id: 'cex', label: '4-Phase CEx Protocol', icon: 'shield-check' as const },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveView(tab.id as 'screener' | 'synergy' | 'cex')}
              style={{
                background: activeView === tab.id ? 'var(--gold)' : 'rgba(255,255,255,0.05)',
                color: activeView === tab.id ? '#0A0E18' : 'var(--gray)',
                border: activeView === tab.id ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name={tab.icon} size={14} tone={activeView === tab.id ? 'dark' : 'slate'} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Diagnosis Hero Banner ────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(212,160,23,0.12) 0%, rgba(13,20,36,0.95) 100%)',
          border: '1px solid rgba(212,160,23,0.4)',
          borderRadius: 10,
          padding: '20px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: 20,
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>
            Clinical Postural Classification
          </div>
          <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 22, fontWeight: 700, margin: '4px 0', color: '#FFF', letterSpacing: '0.04em' }}>
            {diagnosis.title}
          </h4>
          <div style={{ fontSize: 14, fontWeight: 700, color: diagnosis.severityScore > 40 ? '#EF4444' : '#34D399' }}>
            {diagnosis.kineticChainDysfunctionLevel} ({diagnosis.severityScore}% Dysfunction Score)
          </div>
          <p style={{ margin: '8px 0 0', color: 'var(--gray)', fontSize: 12, lineHeight: 1.5 }}>
            {diagnosis.clinicalSummary}
          </p>
        </div>

        {/* Injury Risk Pills */}
        <div style={{ background: 'rgba(0,0,0,0.4)', padding: 16, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 11, color: '#F87171', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="alert-triangle" size={13} tone="ruby" /> Associated Musculoskeletal Injury Risks
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {diagnosis.injuryRisks.map((risk, rIdx) => (
              <span
                key={rIdx}
                style={{
                  fontSize: 11,
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#FCA5A5',
                  padding: '3px 8px',
                  borderRadius: 4,
                }}
              >
                {risk}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Diagnostic Presets ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <span style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Diagnostic Presets:
        </span>
        {[
          { id: 'pronation', label: 'Pronation Distortion' },
          { id: 'lower', label: 'Lower Crossed (APT)' },
          { id: 'upper', label: 'Upper Crossed (Forward Head)' },
          { id: 'mixed', label: 'Mixed Syndromes' },
          { id: 'optimal', label: 'Optimal Posture' },
        ].map(preset => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handleLoadPreset(preset.id as 'pronation' | 'lower' | 'upper' | 'mixed' | 'optimal')}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: '#FFF',
              padding: '4px 10px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* ── VIEW 1: 5-CHECKPOINT SCREENER ────────────────────────────── */}
      {activeView === 'screener' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 14 }}>
          {/* Checkpoint 1 */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 12, color: 'var(--gold-lt)', fontWeight: 700, marginBottom: 8 }}>
              1. Feet & Ankles
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={feetFlatten} onChange={e => setFeetFlatten(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              Feet Flatten / Evert (Pronation)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={feetTurnOut} onChange={e => setFeetTurnOut(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              Feet Turn Outward
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={heelsElevate} onChange={e => setHeelsElevate(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              Heels Rise Early
            </label>
          </div>

          {/* Checkpoint 2 */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 12, color: '#60A5FA', fontWeight: 700, marginBottom: 8 }}>
              2. Knee Complex
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={kneesValgus} onChange={e => setKneesValgus(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              Knees Move Inward (Valgus)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={kneesVarus} onChange={e => setKneesVarus(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              Knees Move Outward (Varus)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={kneesHyperextend} onChange={e => setKneesHyperextend(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              Knees Hyperextended (Genu Recurvatum)
            </label>
          </div>

          {/* Checkpoint 3 */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 12, color: '#34D399', fontWeight: 700, marginBottom: 8 }}>
              3. Lumbo-Pelvic-Hip (LPHC)
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={anteriorTilt} onChange={e => setAnteriorTilt(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              Anterior Pelvic Tilt (Hyperlordosis)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={posteriorTilt} onChange={e => setPosteriorTilt(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              Posterior Pelvic Tilt (Flat-Back)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={forwardLean} onChange={e => setForwardLean(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              Excessive Forward Trunk Lean
            </label>
          </div>

          {/* Checkpoint 4 */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 12, color: '#F59E0B', fontWeight: 700, marginBottom: 8 }}>
              4. Shoulders & Thoracic
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={roundedShoulders} onChange={e => setRoundedShoulders(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              Rounded / Protracted Shoulders
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={shouldersElevated} onChange={e => setShouldersElevated(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              Shoulders Elevated / Shrugged
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={armsFallForward} onChange={e => setArmsFallForward(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              Arms Fall Forward (Lat Dominance)
            </label>
          </div>

          {/* Checkpoint 5 */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 12, color: '#A78BFA', fontWeight: 700, marginBottom: 8 }}>
              5. Head & Cervical Spine
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={forwardHead} onChange={e => setForwardHead(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              Forward Head Carriage
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={cervicalHyperextend} onChange={e => setCervicalHyperextend(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              Cervical Spine Hyperextension
            </label>
          </div>
        </div>
      )}

      {/* ── VIEW 2: SYNERGY DECODER MATRIX ──────────────────────────── */}
      {activeView === 'synergy' && (
        <div style={{ display: 'grid', gap: 16 }}>
          {diagnosis.synergyAnalysis.map((syn, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: 18,
                display: 'grid',
                gap: 12,
              }}
            >
              <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, fontWeight: 700, color: 'var(--gold-lt)', letterSpacing: '0.04em' }}>
                {syn.muscleGroup}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 14 }}>
                {/* Overactive Column */}
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#F87171', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                    Overactive (Shortened / Hypertonic)
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 16, color: '#FCA5A5', fontSize: 12, lineHeight: 1.6 }}>
                    {syn.overactiveMuscles.map((m, mIdx) => (
                      <li key={mIdx}>{m}</li>
                    ))}
                  </ul>
                </div>

                {/* Underactive Column */}
                <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 6, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#34D399', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
                    Underactive (Lengthened / Inhibited)
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 16, color: '#A7F3D0', fontSize: 12, lineHeight: 1.6 }}>
                    {syn.underactiveMuscles.map((m, mIdx) => (
                      <li key={mIdx}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 6, fontSize: 12, color: 'var(--gray)', lineHeight: 1.5 }}>
                <strong style={{ color: '#FFF' }}>Reciprocal Inhibition Mechanism: </strong>
                {syn.reciprocalInhibitionMechanism}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── VIEW 3: 4-PHASE CEX PROTOCOL ────────────────────────────── */}
      {activeView === 'cex' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 14 }}>
          {/* 1. Inhibit */}
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 11, color: '#F87171', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
              1. Inhibit (SMR / Trigger Point)
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {diagnosis.correctiveProtocol.inhibit.map((item, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#FFF' }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--gold-lt)' }}>{item.protocol}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>{item.coachingCue}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Lengthen */}
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 11, color: '#60A5FA', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
              2. Lengthen (Static Stretch)
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {diagnosis.correctiveProtocol.lengthen.map((item, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#FFF' }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--gold-lt)' }}>{item.protocol}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>{item.coachingCue}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Activate */}
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 11, color: '#34D399', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
              3. Activate (Isolated Strength)
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {diagnosis.correctiveProtocol.activate.map((item, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#FFF' }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--gold-lt)' }}>{item.protocol}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>{item.coachingCue}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Integrate */}
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
              4. Integrate (Kinetic Chain)
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {diagnosis.correctiveProtocol.integrate.map((item, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#FFF' }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--gold-lt)' }}>{item.protocol}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>{item.coachingCue}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
