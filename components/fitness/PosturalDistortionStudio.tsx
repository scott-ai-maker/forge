'use client'

import React, { useId, useState, useMemo } from 'react'
import {
  diagnosePosturalDistortions,
  PosturalObservationsInput,
  PosturalSyndromeDiagnosis,
} from '@/lib/postural-distortion-engine'
import { GaaIcon } from '@/components/ui/GaaIcon'

type PresetId = 'pronation' | 'lower' | 'upper' | 'mixed' | 'optimal'

function CheckpointCheckboxRow({
  id,
  checked,
  onChange,
  label,
}: {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 44,
        padding: '4px 0',
      }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{
          accentColor: 'var(--gold)',
          width: 18,
          height: 18,
          flexShrink: 0,
          cursor: 'pointer',
        }}
      />
      <label
        htmlFor={id}
        style={{
          fontSize: 12.5,
          lineHeight: 1.35,
          color: '#F1F5F9',
          cursor: 'pointer',
          flex: 1,
          padding: '8px 0',
        }}
      >
        {label}
      </label>
    </div>
  )
}

export default function PosturalDistortionStudio() {
  const uid = useId()
  const [activeView, setActiveView] = useState<'screener' | 'synergy' | 'cex'>('screener')
  const [selectedPreset, setSelectedPreset] = useState<PresetId | null>(null)

  // Checkpoint 1: Feet & Ankles (default unscanned/unchecked so zero synthetic conditions are pre-populated)
  const [feetFlatten, setFeetFlatten] = useState<boolean>(false)
  const [feetTurnOut, setFeetTurnOut] = useState<boolean>(false)
  const [heelsElevate, setHeelsElevate] = useState<boolean>(false)

  // Checkpoint 2: Knees
  const [kneesValgus, setKneesValgus] = useState<boolean>(false)
  const [kneesVarus, setKneesVarus] = useState<boolean>(false)
  const [kneesHyperextend, setKneesHyperextend] = useState<boolean>(false)

  // Checkpoint 3: LPHC
  const [anteriorTilt, setAnteriorTilt] = useState<boolean>(false)
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
  const handleLoadPreset = (preset: PresetId) => {
    setSelectedPreset(preset)
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
      className="postural-distortion-studio"
      style={{
        background: 'linear-gradient(180deg, #0D1424 0%, #070B14 100%)',
        border: '1px solid rgba(212,160,23,0.3)',
        borderRadius: 12,
        padding: 'clamp(14px, 3vw, 24px)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
              NASM CPT-7 Ch 11 Movement Screen
            </span>
            <span style={{ fontSize: 12, color: 'var(--gold-lt)', fontWeight: 600 }}>
              Kinetic Chain Checkpoints & Muscle Synergy Decoder
            </span>
          </div>

          <h3
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 'clamp(16px, 2.5vw, 20px)',
              fontWeight: 700,
              letterSpacing: '0.04em',
              margin: '6px 0 0',
              color: '#FFFFFF',
            }}
          >
            POSTURAL ALIGNMENT &amp; MUSCLE SYNERGY SCREENING STUDIO
          </h3>
          <p style={{ margin: '6px 0 0', fontSize: 11.5, color: '#94A3B8', lineHeight: 1.45 }}>
            Educational NASM fitness movement screen—not physical therapy, chiropractic care, or orthopedic diagnosis (M.G.L. c. 112, §§ 23A–23Q). Stop immediately if any movement causes sharp or radiating pain.
          </p>
        </div>

        {/* View Navigation */}
        <div
          role="group"
          aria-label="Postural distortion studio views"
          style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
        >
          {[
            { id: 'screener', label: '5-Checkpoint Screen', icon: 'microscope' as const },
            { id: 'synergy', label: 'Synergy Decoder Matrix', icon: 'lightning' as const },
            { id: 'cex', label: '4-Phase CEx Protocol', icon: 'shield-check' as const },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={activeView === tab.id}
              onClick={() => setActiveView(tab.id as 'screener' | 'synergy' | 'cex')}
              style={{
                background: activeView === tab.id ? 'var(--gold)' : 'rgba(255,255,255,0.05)',
                color: activeView === tab.id ? '#0A0E18' : 'var(--gray)',
                border: activeView === tab.id ? '1.5px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                minHeight: 44,
                padding: '8px 14px',
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
        aria-live="polite"
        style={{
          background: 'linear-gradient(135deg, rgba(212,160,23,0.12) 0%, rgba(13,20,36,0.95) 100%)',
          border: '1px solid rgba(212,160,23,0.4)',
          borderRadius: 10,
          padding: 'clamp(14px, 2.5vw, 20px) clamp(14px, 3vw, 24px)',
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
          <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 'clamp(18px, 2.5vw, 22px)', fontWeight: 700, margin: '4px 0', color: '#FFF', letterSpacing: '0.04em' }}>
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
            {diagnosis.injuryRisks.length > 0 ? (
              diagnosis.injuryRisks.map((risk, rIdx) => (
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
              ))
            ) : (
              <span
                style={{
                  fontSize: 11,
                  background: 'rgba(52,211,153,0.15)',
                  border: '1px solid rgba(52,211,153,0.35)',
                  color: '#6EE7B7',
                  padding: '3px 8px',
                  borderRadius: 4,
                }}
              >
                Low soft-tissue strain risk under controlled loading
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Diagnostic Presets ──────────────────────────────────── */}
      <div
        role="group"
        aria-label="Diagnostic posture presets"
        style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}
      >
        <span style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Diagnostic Presets:
        </span>
        {[
          { id: 'pronation' as const, label: 'Pronation Distortion' },
          { id: 'lower' as const, label: 'Lower Crossed (APT)' },
          { id: 'upper' as const, label: 'Upper Crossed (Forward Head)' },
          { id: 'mixed' as const, label: 'Mixed Syndromes' },
          { id: 'optimal' as const, label: 'Optimal Posture' },
        ].map(preset => {
          const isActivePreset = selectedPreset === preset.id
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={isActivePreset}
              onClick={() => handleLoadPreset(preset.id)}
              style={{
                background: isActivePreset ? 'rgba(212,160,23,0.2)' : 'rgba(255,255,255,0.06)',
                border: isActivePreset ? '1.5px solid var(--gold)' : '1px solid rgba(255,255,255,0.14)',
                color: isActivePreset ? 'var(--gold-lt)' : '#FFF',
                minHeight: 44,
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: isActivePreset ? 800 : 600,
                cursor: 'pointer',
              }}
            >
              {preset.label}
            </button>
          )
        })}
      </div>

      {/* ── VIEW 1: 5-CHECKPOINT SCREENER ────────────────────────────── */}
      {activeView === 'screener' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 14 }}>
          {/* Checkpoint 1 */}
          <fieldset style={{ margin: 0, minWidth: 0, background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
            <legend style={{ padding: '0 4px', fontSize: 12, color: 'var(--gold-lt)', fontWeight: 700 }}>
              1. Feet & Ankles
            </legend>
            <CheckpointCheckboxRow
              id={`${uid}-feet-flatten`}
              checked={feetFlatten}
              onChange={v => {
                setSelectedPreset(null)
                setFeetFlatten(v)
              }}
              label="Feet Flatten / Evert (Pronation)"
            />
            <CheckpointCheckboxRow
              id={`${uid}-feet-turn-out`}
              checked={feetTurnOut}
              onChange={v => {
                setSelectedPreset(null)
                setFeetTurnOut(v)
              }}
              label="Feet Turn Outward"
            />
            <CheckpointCheckboxRow
              id={`${uid}-heels-elevate`}
              checked={heelsElevate}
              onChange={v => {
                setSelectedPreset(null)
                setHeelsElevate(v)
              }}
              label="Heels Rise Early"
            />
          </fieldset>

          {/* Checkpoint 2 */}
          <fieldset style={{ margin: 0, minWidth: 0, background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
            <legend style={{ padding: '0 4px', fontSize: 12, color: '#60A5FA', fontWeight: 700 }}>
              2. Knee Complex
            </legend>
            <CheckpointCheckboxRow
              id={`${uid}-knees-valgus`}
              checked={kneesValgus}
              onChange={v => {
                setSelectedPreset(null)
                setKneesValgus(v)
                if (v) setKneesVarus(false)
              }}
              label="Knees Move Inward (Valgus)"
            />
            <CheckpointCheckboxRow
              id={`${uid}-knees-varus`}
              checked={kneesVarus}
              onChange={v => {
                setSelectedPreset(null)
                setKneesVarus(v)
                if (v) setKneesValgus(false)
              }}
              label="Knees Move Outward (Varus)"
            />
            <CheckpointCheckboxRow
              id={`${uid}-knees-hyperextend`}
              checked={kneesHyperextend}
              onChange={v => {
                setSelectedPreset(null)
                setKneesHyperextend(v)
              }}
              label="Knees Hyperextended (Genu Recurvatum)"
            />
          </fieldset>

          {/* Checkpoint 3 */}
          <fieldset style={{ margin: 0, minWidth: 0, background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
            <legend style={{ padding: '0 4px', fontSize: 12, color: '#34D399', fontWeight: 700 }}>
              3. Lumbo-Pelvic-Hip (LPHC)
            </legend>
            <CheckpointCheckboxRow
              id={`${uid}-anterior-tilt`}
              checked={anteriorTilt}
              onChange={v => {
                setSelectedPreset(null)
                setAnteriorTilt(v)
                if (v) setPosteriorTilt(false)
              }}
              label="Anterior Pelvic Tilt (Hyperlordosis)"
            />
            <CheckpointCheckboxRow
              id={`${uid}-posterior-tilt`}
              checked={posteriorTilt}
              onChange={v => {
                setSelectedPreset(null)
                setPosteriorTilt(v)
                if (v) setAnteriorTilt(false)
              }}
              label="Posterior Pelvic Tilt (Flat-Back)"
            />
            <CheckpointCheckboxRow
              id={`${uid}-forward-lean`}
              checked={forwardLean}
              onChange={v => {
                setSelectedPreset(null)
                setForwardLean(v)
              }}
              label="Excessive Forward Trunk Lean"
            />
            <CheckpointCheckboxRow
              id={`${uid}-asym-shift`}
              checked={asymShift}
              onChange={v => {
                setSelectedPreset(null)
                setAsymShift(v)
              }}
              label="Asymmetric Weight Shift"
            />
          </fieldset>

          {/* Checkpoint 4 */}
          <fieldset style={{ margin: 0, minWidth: 0, background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
            <legend style={{ padding: '0 4px', fontSize: 12, color: '#F59E0B', fontWeight: 700 }}>
              4. Shoulders & Thoracic
            </legend>
            <CheckpointCheckboxRow
              id={`${uid}-rounded-shoulders`}
              checked={roundedShoulders}
              onChange={v => {
                setSelectedPreset(null)
                setRoundedShoulders(v)
              }}
              label="Rounded / Protracted Shoulders"
            />
            <CheckpointCheckboxRow
              id={`${uid}-shoulders-elevated`}
              checked={shouldersElevated}
              onChange={v => {
                setSelectedPreset(null)
                setShouldersElevated(v)
              }}
              label="Shoulders Elevated / Shrugged"
            />
            <CheckpointCheckboxRow
              id={`${uid}-scapular-winging`}
              checked={scapularWinging}
              onChange={v => {
                setSelectedPreset(null)
                setScapularWinging(v)
              }}
              label="Scapular Winging"
            />
            <CheckpointCheckboxRow
              id={`${uid}-arms-fall-forward`}
              checked={armsFallForward}
              onChange={v => {
                setSelectedPreset(null)
                setArmsFallForward(v)
              }}
              label="Arms Fall Forward (Lat Dominance)"
            />
          </fieldset>

          {/* Checkpoint 5 */}
          <fieldset style={{ margin: 0, minWidth: 0, background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
            <legend style={{ padding: '0 4px', fontSize: 12, color: '#A78BFA', fontWeight: 700 }}>
              5. Head & Cervical Spine
            </legend>
            <CheckpointCheckboxRow
              id={`${uid}-forward-head`}
              checked={forwardHead}
              onChange={v => {
                setSelectedPreset(null)
                setForwardHead(v)
              }}
              label="Forward Head Carriage"
            />
            <CheckpointCheckboxRow
              id={`${uid}-cervical-hyperextend`}
              checked={cervicalHyperextend}
              onChange={v => {
                setSelectedPreset(null)
                setCervicalHyperextend(v)
              }}
              label="Cervical Spine Hyperextension"
            />
          </fieldset>
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
