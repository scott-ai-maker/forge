'use client'

import React from 'react'
import GaaIcon from '@/components/ui/GaaIcon'

interface FitnessProfileData {
  height_cm?: number | null
  weight_kg?: number | null
  age?: number | null
  sex?: string | null
  fitness_goal?: string | null
  equipment_access?: string[] | null
  cardio_equipment_access?: string[] | null
  training_days_per_week?: number | null
  preferred_training_days?: string[] | null
  injuries_limitations?: string | null
  waist_cm?: number | null
  neck_cm?: number | null
  hip_cm?: number | null
  preferred_units?: string | null
}

interface BodyCompositionData {
  id?: string
  estimated_bodyfat_percent?: number | null
  method?: string | null
  confidence_score?: number | null
  created_at?: string
}

interface CoachAthleteVitalsEnvironmentalCardProps {
  clientId: string
  clientName: string
  fitnessProfile: FitnessProfileData | null | undefined
  latestBodyComposition?: BodyCompositionData | null
  preferredUnits?: 'metric' | 'imperial'
}

export default function CoachAthleteVitalsEnvironmentalCard({
  clientId,
  clientName: _clientName,
  fitnessProfile,
  latestBodyComposition,
  preferredUnits = 'imperial',
}: CoachAthleteVitalsEnvironmentalCardProps) {
  const heightCm = Number(fitnessProfile?.height_cm ?? 0)
  const weightKg = Number(fitnessProfile?.weight_kg ?? 0)
  const age = fitnessProfile?.age ? Number(fitnessProfile.age) : null
  const sex = fitnessProfile?.sex ? String(fitnessProfile.sex).trim() : null

  // Height conversions
  let heightDisplay = '—'
  if (heightCm > 0) {
    const totalInches = Math.round(heightCm / 2.54)
    const feet = Math.floor(totalInches / 12)
    const inches = totalInches % 12
    heightDisplay = `${feet}' ${inches}" (${heightCm} cm)`
  }

  // Weight conversions
  let weightDisplay = '—'
  if (weightKg > 0) {
    const lbs = Math.round(weightKg * 2.20462 * 10) / 10
    weightDisplay = preferredUnits === 'metric'
      ? `${weightKg} kg (${lbs} lbs)`
      : `${lbs} lbs (${weightKg} kg)`
  }

  // BMI Calculation
  let bmiDisplay: string | null = null
  let bmiCategory: string | null = null
  let bmiTone: string = 'var(--gray)'
  if (heightCm > 0 && weightKg > 0) {
    const bmiVal = Number((weightKg / Math.pow(heightCm / 100, 2)).toFixed(1))
    bmiDisplay = `${bmiVal} kg/m²`
    if (bmiVal < 18.5) {
      bmiCategory = 'Underweight'
      bmiTone = '#38BDF8'
    } else if (bmiVal < 25) {
      bmiCategory = 'Normal Weight'
      bmiTone = '#34D399'
    } else if (bmiVal < 30) {
      bmiCategory = 'Overweight'
      bmiTone = 'var(--gold)'
    } else {
      bmiCategory = 'Obese / Elevated'
      bmiTone = '#F87171'
    }
  }

  // Body Composition
  const bodyFatPercent = latestBodyComposition?.estimated_bodyfat_percent !== undefined && latestBodyComposition?.estimated_bodyfat_percent !== null
    ? Number(latestBodyComposition.estimated_bodyfat_percent)
    : null

  const equipmentList = Array.isArray(fitnessProfile?.equipment_access)
    ? fitnessProfile.equipment_access.filter(Boolean)
    : []

  const cardioList = Array.isArray(fitnessProfile?.cardio_equipment_access)
    ? fitnessProfile.cardio_equipment_access.filter(Boolean)
    : []

  const trainingDays = fitnessProfile?.training_days_per_week ? Number(fitnessProfile.training_days_per_week) : null
  const preferredDays = Array.isArray(fitnessProfile?.preferred_training_days)
    ? fitnessProfile.preferred_training_days.filter(Boolean)
    : []

  const limitations = String(fitnessProfile?.injuries_limitations ?? '').trim()
  const hasVitalsRecorded = heightCm > 0 && weightKg > 0

  return (
    <div
      className="coach-athlete-vitals-card"
      style={{
        background: 'linear-gradient(135deg, rgba(14, 22, 36, 0.98) 0%, rgba(9, 15, 26, 0.98) 100%)',
        border: '1px solid rgba(212, 160, 23, 0.28)',
        borderRadius: 10,
        padding: '20px 24px',
        marginBottom: 24,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* ── Card Header ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          paddingBottom: 16,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: 'rgba(212, 160, 23, 0.15)',
              border: '1px solid var(--gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GaaIcon name="overview" size={18} tone="gold" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2
                style={{
                  fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--white)',
                  margin: 0,
                  letterSpacing: '0.04em',
                }}
              >
                ATHLETE BIOMETRICS &amp; ENVIRONMENTAL READINESS
              </h2>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  background: hasVitalsRecorded ? 'rgba(16, 185, 129, 0.18)' : 'rgba(212, 160, 23, 0.2)',
                  color: hasVitalsRecorded ? '#34D399' : 'var(--gold-lt)',
                  border: `1px solid ${hasVitalsRecorded ? '#10B981' : 'var(--gold)'}`,
                }}
              >
                {hasVitalsRecorded ? 'Stage 3 Verified' : 'Vitals Incomplete'}
              </span>
            </div>
            <p style={{ margin: '2px 0 0', color: 'var(--gray)', fontSize: 12 }}>
              Anthropometric vitals, calculated BMI, target schedule, and facility equipment inventory.
            </p>
          </div>
        </div>

        {/* Quick launcher action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <a
            href={`/coach/clients/${clientId}?tab=assessment&subtab=bodycomp#workspace-tab-content`}
            className="tactile-btn"
            style={{
              padding: '6px 12px',
              borderRadius: 4,
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid #38BDF8',
              color: '#38BDF8',
              fontSize: 11.5,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span>Launch AI DEXA</span>
            <span>➔</span>
          </a>

          <a
            href={`/coach/clients/${clientId}?tab=onboarding#workspace-tab-content`}
            className="tactile-btn"
            style={{
              padding: '6px 12px',
              borderRadius: 4,
              background: 'rgba(212, 160, 23, 0.12)',
              border: '1px solid var(--gold)',
              color: 'var(--gold-lt)',
              fontSize: 11.5,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span>Onboarding Studio</span>
            <span>➔</span>
          </a>
        </div>
      </div>

      {/* ── Vitals & Anthropometrics Grid ─────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div style={vitalCardStyle}>
          <span style={vitalLabelStyle}>Height</span>
          <span style={vitalValueStyle}>{heightDisplay}</span>
        </div>

        <div style={vitalCardStyle}>
          <span style={vitalLabelStyle}>Weight</span>
          <span style={vitalValueStyle}>{weightDisplay}</span>
        </div>

        <div style={vitalCardStyle}>
          <span style={vitalLabelStyle}>Age &amp; Sex</span>
          <span style={vitalValueStyle}>
            {age ? `${age} yrs` : '—'} {sex ? `• ${sex.charAt(0).toUpperCase() + sex.slice(1)}` : ''}
          </span>
        </div>

        <div style={vitalCardStyle}>
          <span style={vitalLabelStyle}>Body Mass Index (BMI)</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={vitalValueStyle}>{bmiDisplay || '—'}</span>
            {bmiCategory && (
              <span style={{ fontSize: 11, fontWeight: 700, color: bmiTone }}>
                ({bmiCategory})
              </span>
            )}
          </div>
        </div>

        <div style={vitalCardStyle}>
          <span style={vitalLabelStyle}>AI DEXA Body Fat</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={vitalValueStyle}>
              {bodyFatPercent !== null ? `${bodyFatPercent}%` : 'Pending Scan'}
            </span>
            {latestBodyComposition?.method && (
              <span style={{ fontSize: 10, color: 'var(--gray)' }}>
                ({latestBodyComposition.method})
              </span>
            )}
          </div>
        </div>

        {(fitnessProfile?.waist_cm || fitnessProfile?.neck_cm || fitnessProfile?.hip_cm) && (
          <div style={vitalCardStyle}>
            <span style={vitalLabelStyle}>Circumferences</span>
            <span style={{ fontSize: 13, color: 'var(--white)', fontWeight: 600 }}>
              {[
                fitnessProfile.waist_cm ? `W: ${fitnessProfile.waist_cm}cm` : null,
                fitnessProfile.neck_cm ? `N: ${fitnessProfile.neck_cm}cm` : null,
                fitnessProfile.hip_cm ? `H: ${fitnessProfile.hip_cm}cm` : null,
              ].filter(Boolean).join(' • ')}
            </span>
          </div>
        )}
      </div>

      {/* ── Training Directive & Schedule ─────────────────────────── */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.025)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 8,
          padding: '14px 16px',
          marginBottom: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
        }}
      >
        <div>
          <span style={vitalLabelStyle}>Primary Athletic Goal</span>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold-lt)', marginTop: 4 }}>
            {fitnessProfile?.fitness_goal || 'No primary goal defined'}
          </div>
        </div>

        <div>
          <span style={vitalLabelStyle}>Training Schedule &amp; Frequency</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--white)', marginTop: 4 }}>
            {trainingDays ? `${trainingDays} sessions / week` : 'Frequency not set'}
            {preferredDays.length > 0 && (
              <span style={{ color: 'var(--gray)', fontSize: 12, marginLeft: 8 }}>
                ({preferredDays.join(', ')})
              </span>
            )}
          </div>
        </div>

        <div>
          <span style={vitalLabelStyle}>Orthopedic Limitations / Contraindications</span>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: limitations ? '#FCA5A5' : '#34D399',
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {limitations ? (
              <>
                <GaaIcon name="alert-triangle" size={13} tone="ruby" />
                <span>{limitations}</span>
              </>
            ) : (
              <>
                <GaaIcon name="check" size={13} tone="emerald" />
                <span>None reported (full exercise clearance)</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Environmental Readiness & Equipment Inventory ─────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={vitalLabelStyle}>
            Equipment &amp; Facility Modalities ({equipmentList.length + cardioList.length} configured)
          </span>
          <a
            href={`/coach/clients/${clientId}?tab=program#workspace-tab-content`}
            style={{ fontSize: 11, color: 'var(--gold-lt)', textDecoration: 'none', fontWeight: 700 }}
          >
            Edit in Program Workspace ➔
          </a>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {equipmentList.length === 0 && cardioList.length === 0 ? (
            <span style={{ fontSize: 12, color: 'var(--gray)', fontStyle: 'italic' }}>
              No equipment logged yet. Open Program Workspace to configure gym access.
            </span>
          ) : (
            <>
              {equipmentList.map(eq => (
                <span
                  key={eq}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: 'var(--white)',
                    fontSize: 11.5,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <GaaIcon name="dumbbell" size={11} tone="gold" />
                  {eq.replace(/_/g, ' ')}
                </span>
              ))}
              {cardioList.map(cardio => (
                <span
                  key={cardio}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    color: '#38BDF8',
                    fontSize: 11.5,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <GaaIcon name="runner" size={11} tone="cyan" />
                  {cardio.replace(/_/g, ' ')}
                </span>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const vitalCardStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.25)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 6,
  padding: '10px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const vitalLabelStyle: React.CSSProperties = {
  fontFamily: 'Raleway, sans-serif',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--gray)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const vitalValueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-telemetry, monospace)',
  fontSize: 17,
  fontWeight: 700,
  color: 'var(--white)',
  letterSpacing: '0.03em',
}

