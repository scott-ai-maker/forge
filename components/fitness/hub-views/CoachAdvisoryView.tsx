'use client'

import React, { useMemo } from 'react'
import WeeklyCheckinForm, { WeeklyCheckin } from '@/components/fitness/WeeklyCheckinForm'
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
  initialCheckin?: WeeklyCheckin | null
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
  initialCheckin,
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
    <div className="fitness-coach-view" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
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
              Your coach
            </h2>
            <p style={{ margin: '2px 0 0', color: 'var(--gold-lt)', fontSize: 12.5 }}>
              Check in with Coach Gordon, share updates, or book a session.
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
            Message coach
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
            Book a session
          </a>
        </div>
      </div>

      <WeeklyCheckinForm preferredUnits={units} initialCheckin={initialCheckin} />

      {/* ── ATHLETE PROFILE & CLINICAL SAFEGUARDS CARD ── */}
      <details
        className="fitness-card-disclosure fitness-coach-health"
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
        <summary>Health &amp; training details on file</summary>
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
              Your intake summary
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
          Review the information you shared with your coach. Update your intake when your health or training needs change. This summary is not medical clearance.
        </p>

        {/* Safeguard Indicators Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
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
              {profile?.fitness_goal || 'Goal not recorded'}
            </div>
            <div style={{ color: 'var(--gray)', fontSize: 12 }}>
              {plan?.nasm_opt_phase ? `NASM OPT™ Phase ${plan.nasm_opt_phase}` : 'Phase not recorded'} · {profile?.training_days_per_week ? `${profile.training_days_per_week} Days / Wk` : 'Frequency not recorded'}
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
                  Reported
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
                ? 'Discuss medication-related training questions with your clinician and coach'
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
                  Reported
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
                ? 'Tell your coach about changes in pain or movement tolerance'
                : 'Update your intake if pain or limitations develop'}
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
                (intake?.parq_any_yes ? 'PAR-Q Medical Consultation Flagged' : 'No medical conditions recorded')}
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
            Report changes to medications, symptoms, or recovery in your check-in notes. For urgent health concerns, contact a medical professional.
          </span>
        </div>
      </details>

      {/* Body Composition & Progress Photos */}
      <details className="fitness-card-disclosure fitness-progress-panel">
        <summary>Progress photos &amp; body composition</summary>
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
      </details>
    </div>
  )
}
