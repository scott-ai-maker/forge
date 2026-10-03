'use client'

import React, { useMemo } from 'react'
import WeeklyCheckinForm from '@/components/fitness/WeeklyCheckinForm'
import ProgressPhotoTimeline from '@/components/fitness/ProgressPhotoTimeline'
import { parseParqMedicationsAndConditions } from '@/lib/muscle-recovery-telemetry'
import { GaaIcon } from '@/components/ui/GaaIcon'
import { HubProfileData } from './FitnessLabDiagnosticsView'

interface ProgressPhotoEntry {
  id: string
  photo_url: string
  taken_at: string
  notes?: string | null
  created_at?: string | null
}

export interface ClientIntakeData {
  parq_answers?: unknown
  parq_any_yes?: boolean
  medical_conditions?: string | null
  medications?: string | null
  surgeries_or_injuries?: string | null
  allergies?: string | null
  [key: string]: unknown
}

interface CoachAdvisoryViewProps {
  units: 'metric' | 'imperial'
  progressPhotos: ProgressPhotoEntry[]
  profile: HubProfileData | null
  intake?: ClientIntakeData | null
  plan?: { nasm_opt_phase?: number; plan_json?: unknown } | null
  bodyfatState: { estimated: string }
  setBodyfatState: React.Dispatch<React.SetStateAction<{ estimated: string }>>
  setStatus: (msg: string | null) => void
}

export default function CoachAdvisoryView({
  units,
  progressPhotos,
  profile,
  intake,
  plan,
  bodyfatState,
  setBodyfatState,
  setStatus,
}: CoachAdvisoryViewProps) {
  // Clinically parse intake medications and conditions
  const parsedMeds = useMemo(() => {
    return parseParqMedicationsAndConditions(
      intake?.parq_answers as Record<string, unknown> | null,
      intake?.medications,
      intake?.medical_conditions
    )
  }, [intake])

  const hasMedications = Boolean(
    (intake?.medications && intake.medications.trim().length > 0 && intake.medications.trim().toLowerCase() !== 'none' && intake.medications.trim().toLowerCase() !== 'n/a') ||
    parsedMeds.hasAnyReportedMedications
  )

  const hasInjuriesOrLimitations = Boolean(
    (profile?.injuries_limitations && profile.injuries_limitations.trim().length > 0 && profile.injuries_limitations.trim().toLowerCase() !== 'none') ||
    (intake?.surgeries_or_injuries && intake.surgeries_or_injuries.trim().length > 0 && intake.surgeries_or_injuries.trim().toLowerCase() !== 'none')
  )

  const hasMedicalConditions = Boolean(
    (intake?.medical_conditions && intake.medical_conditions.trim().length > 0 && intake.medical_conditions.trim().toLowerCase() !== 'none') ||
    intake?.parq_any_yes
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 16 }}>
      {/* Coach Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(212,160,23,0.15) 0%, rgba(13,27,42,0.95) 100%)',
          border: '1px solid rgba(212,160,23,0.35)',
          borderRadius: 8,
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <GaaIcon name="award" size={28} tone="gold" />
          <div>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                letterSpacing: '0.04em',
                fontSize: 22,
                fontWeight: 700,
                color: '#FFFFFF',
              }}
            >
              Coach Scott Gordon · Advisory &amp; Check-In Hub
            </h2>
            <p style={{ margin: '2px 0 0', color: 'var(--gold-lt)', fontSize: 12.5 }}>
              Weekly accountability check-in, performance biofeedback, and direct advisory consultations.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a
            href="/dashboard/messages"
            style={{
              background: 'rgba(212,160,23,0.2)',
              border: '1px solid var(--gold)',
              color: 'var(--gold-lt)',
              fontSize: 12,
              fontWeight: 700,
              padding: '8px 14px',
              borderRadius: 6,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name="message-square" size={13} tone="gold" />
            Message Coach Gordon
          </a>
          <a
            href="/dashboard/book"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
              border: 'none',
              color: '#0A0E18',
              fontSize: 12,
              fontWeight: 800,
              padding: '8px 14px',
              borderRadius: 6,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name="calendar" size={13} tone="dark" />
            Book 1-on-1 Session
          </a>
        </div>
      </div>

      {/* ── ATHLETE PROFILE & CLINICAL SAFEGUARDS CARD ── */}
      <section
        style={{
          border: '1px solid rgba(212,160,23,0.3)',
          background: 'rgba(13,27,42,0.85)',
          borderRadius: 8,
          padding: 'clamp(14px, 2vw, 20px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GaaIcon name="shield-check" size={20} tone="gold" />
            <h3
              style={{
                margin: 0,
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                letterSpacing: '0.04em',
                fontSize: 17,
                fontWeight: 700,
                color: '#FFFFFF',
              }}
            >
              Athlete Baseline &amp; Clinical Safeguards On File
            </h3>
          </div>
          <a
            href="/dashboard/settings"
            style={{
              color: 'var(--gold-lt)',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Update Health Intake →
          </a>
        </div>

        <p style={{ margin: 0, color: 'var(--gray)', fontSize: 13, lineHeight: 1.5 }}>
          Coach Scott Gordon cross-examines your active medications, joint limitations, and clinical intake prior to adjusting your weekly training split, working set volume, and exercise mechanics.
        </p>

        {/* Safeguard Indicators Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 12,
          }}
        >
          {/* Active Training Protocol */}
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <GaaIcon name="target" size={13} tone="gold" />
              <span>Active Goal &amp; Macrocycle</span>
            </div>
            <div style={{ color: '#FFFFFF', fontSize: 13.5, fontWeight: 700 }}>
              {profile?.fitness_goal || 'Body Recomposition & Power'}
            </div>
            <div style={{ color: 'var(--gray)', fontSize: 12 }}>
              {plan?.nasm_opt_phase ? `NASM OPT™ Phase ${plan.nasm_opt_phase}` : 'Active Periodization Split'} · {profile?.training_days_per_week ? `${profile.training_days_per_week} Days / Wk` : '3–4 Sessions / Wk'}
            </div>
          </div>

          {/* Current Medications */}
          <div
            style={{
              background: hasMedications ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.03)',
              border: hasMedications ? '1px solid rgba(52,211,153,0.35)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: hasMedications ? '#34D399' : 'var(--gray)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <GaaIcon name="pill" size={13} tone={hasMedications ? 'emerald' : 'slate'} />
                <span>Current Medications</span>
              </div>
              {hasMedications && (
                <span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(52,211,153,0.15)', color: '#34D399', borderRadius: 4, fontWeight: 700 }}>
                  Shield Active
                </span>
              )}
            </div>
            <div style={{ color: '#FFFFFF', fontSize: 13, lineHeight: 1.4, wordBreak: 'break-word' }}>
              {intake?.medications?.trim() ||
                (parsedMeds.detectedMedicationCategories.length > 0
                  ? parsedMeds.detectedMedicationCategories.join(', ')
                  : 'None reported on file')}
            </div>
            <div style={{ color: hasMedications ? 'var(--gold-lt)' : 'var(--gray)', fontSize: 11.5 }}>
              {hasMedications
                ? 'Monitored for hydration, BP, and supplement interaction safety'
                : 'No prescription medications currently recorded'}
            </div>
          </div>

          {/* Structural Limitations & Injuries */}
          <div
            style={{
              background: hasInjuriesOrLimitations ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.03)',
              border: hasInjuriesOrLimitations ? '1px solid rgba(245,158,11,0.35)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: hasInjuriesOrLimitations ? '#F59E0B' : 'var(--gray)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <GaaIcon name="activity" size={13} tone={hasInjuriesOrLimitations ? 'amber' : 'slate'} />
                <span>Physical Boundaries &amp; Joint Health</span>
              </div>
              {hasInjuriesOrLimitations && (
                <span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(245,158,11,0.15)', color: '#F59E0B', borderRadius: 4, fontWeight: 700 }}>
                  Adapted
                </span>
              )}
            </div>
            <div style={{ color: '#FFFFFF', fontSize: 13, lineHeight: 1.4, wordBreak: 'break-word' }}>
              {[profile?.injuries_limitations?.trim(), intake?.surgeries_or_injuries?.trim()]
                .filter(Boolean)
                .join(' · ') || 'No musculoskeletal restrictions reported'}
            </div>
            <div style={{ color: hasInjuriesOrLimitations ? 'var(--gold-lt)' : 'var(--gray)', fontSize: 11.5 }}>
              {hasInjuriesOrLimitations
                ? 'Exercise loading patterns tailored to joint tolerance'
                : 'Full kinetic chain range of motion cleared'}
            </div>
          </div>

          {/* Medical Considerations & Allergies */}
          <div
            style={{
              background: hasMedicalConditions ? 'rgba(56,189,248,0.06)' : 'rgba(255,255,255,0.03)',
              border: hasMedicalConditions ? '1px solid rgba(56,189,248,0.35)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: hasMedicalConditions ? '#38BDF8' : 'var(--gray)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <GaaIcon name="dna" size={13} tone={hasMedicalConditions ? 'cyan' : 'slate'} />
              <span>Medical Intake &amp; Allergies</span>
            </div>
            <div style={{ color: '#FFFFFF', fontSize: 13, lineHeight: 1.4, wordBreak: 'break-word' }}>
              {intake?.medical_conditions?.trim() ||
                (intake?.parq_any_yes ? 'PAR-Q Medical Consultation Flagged' : 'Cleared for Unrestricted Exercise')}
            </div>
            <div style={{ color: 'var(--gray)', fontSize: 11.5 }}>
              {intake?.allergies?.trim() ? `Allergies: ${intake.allergies.trim()}` : 'No food or contact allergies on file'}
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(212,160,23,0.08)',
            border: '1px solid rgba(212,160,23,0.2)',
            borderRadius: 6,
            padding: '10px 14px',
            fontSize: 12,
            color: 'var(--white)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <GaaIcon name="message-square" size={14} tone="gold" />
          <span>
            Have any of your medications, physical symptoms, or recovery needs changed? Report updates in your weekly check-in notes below so Coach Gordon can adjust your program immediately.
          </span>
        </div>
      </section>

      {/* Weekly Check-In Form */}
      <section style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 'clamp(14px, 2.5vw, 20px)', borderRadius: 8 }}>
        <WeeklyCheckinForm preferredUnits={units} />
      </section>

      {/* Body Composition & Progress Photos */}
      <div style={{ marginTop: 2 }}>
        <ProgressPhotoTimeline
          initialPhotos={progressPhotos}
          canUpload
          subtitle="Upload weekly check-in physique photos for Coach Gordon's assessment."
          bodyFatInputs={{
            sex: profile?.sex,
            heightCm: profile?.height_cm,
            weightKg: profile?.weight_kg,
            waistCm: profile?.waist_cm,
            neckCm: profile?.neck_cm,
            hipCm: profile?.hip_cm,
          }}
          estimatedBodyfat={bodyfatState.estimated || null}
          onEstimatedBodyfat={(value) => {
            setBodyfatState({ estimated: String(value) })
            setStatus(`Approximate body-fat estimate: ${value}%`)
          }}
        />
      </div>
    </div>
  )
}

