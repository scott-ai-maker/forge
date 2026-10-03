'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  NASM_OHSA_MAPPINGS,
  generateCorrectiveExercisePlan,
  calculateNasmCardioZones,
  rateYmcaStepTest,
  compareNasmAssessments,
  type OhsaCompensation,
  type OhsaObservation,
  type StaticPosturalFinding,
  type SingleLegSquatObservation,
  type PushPullObservation,
  type CardioVitalsAssessment,
  type NasmAssessmentRecord,
  type KineticChainCheckpoint,
  type AssessmentComparisonResult,
} from '@/lib/nasm-assessments'
import KineticMobilityRadar from '@/components/fitness/KineticMobilityRadar'
import PosturalDistortionStudio from '@/components/fitness/PosturalDistortionStudio'
import { selectOnFocus, sanitizeNumericInput } from '@/lib/form-input-helpers'
import dynamic from 'next/dynamic'

const AiPostureMeshScannerModal = dynamic(
  () => import('./AiPostureMeshScannerModal'),
  { ssr: false }
)
const AiBodyCompositionScannerModal = dynamic(
  () => import('@/components/fitness/AiBodyCompositionScannerModal'),
  { ssr: false }
)
import { PosturalMeshScanResult } from '@/lib/ai-postural-mesh-scanner'
import GaaIcon from '@/components/ui/GaaIcon'

export type AssessmentTab = 'ohsa' | 'posture' | 'dynamic' | 'cardio' | 'radar' | 'cex' | 'history'

interface NasmAssessmentSuiteProps {
  clientId: string
  clientName?: string
  clientAge?: number
  clientSex?: 'male' | 'female' | 'other'
  initialAssessments: NasmAssessmentRecord[]
  initialSubTab?: AssessmentTab
  onAssessmentSaved?: (newAssessment: NasmAssessmentRecord) => void
}

const CHECKPOINT_LABELS: Record<KineticChainCheckpoint, string> = {
  feet_ankles: '1. Feet & Ankles',
  knees: '2. Knees',
  lphc: '3. Lumbo-Pelvic-Hip (LPHC)',
  shoulders: '4. Shoulders & Thoracic',
  head_neck: '5. Head & Cervical Spine',
}

export default function NasmAssessmentSuite({
  clientId,
  clientName = 'Client',
  clientAge = 30,
  clientSex = 'other',
  initialAssessments,
  initialSubTab,
  onAssessmentSaved,
}: NasmAssessmentSuiteProps) {
  const [activeTab, setActiveTab] = useState<AssessmentTab>(initialSubTab || 'ohsa')

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab)
    }
  }, [initialSubTab])
  const [assessments, setAssessments] = useState<NasmAssessmentRecord[]>(initialAssessments)
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(
    initialAssessments[0]?.id ?? null
  )

  // Re-Assessment Comparison State
  const [compareMode, setCompareMode] = useState<boolean>(false)
  const [compareBaselineId, setCompareBaselineId] = useState<string | null>(
    initialAssessments[initialAssessments.length - 1]?.id ?? null
  )
  const [compareFollowUpId, setCompareFollowUpId] = useState<string | null>(
    initialAssessments[0]?.id ?? null
  )

  // Current In-Progress Assessment Form State
  const [assessmentDate, setAssessmentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  )
  const [assessmentTitle, setAssessmentTitle] = useState<string>(
    'NASM Comprehensive Movement Assessment'
  )
  const [selectedOhsaFindings, setSelectedOhsaFindings] = useState<Map<OhsaCompensation, OhsaObservation>>(
    new Map()
  )
  const [staticPostureFindings, setStaticPostureFindings] = useState<StaticPosturalFinding[]>([])
  const [slsLeft, setSlsLeft] = useState<SingleLegSquatObservation>({
    leg: 'left',
    kneeValgus: false,
    pelvicDrop: false,
    pelvicRotation: false,
    torsoLean: false,
  })
  const [slsRight, setSlsRight] = useState<SingleLegSquatObservation>({
    leg: 'right',
    kneeValgus: false,
    pelvicDrop: false,
    pelvicRotation: false,
    torsoLean: false,
  })
  const [pushingFinding, setPushingFinding] = useState<PushPullObservation>({
    assessmentType: 'pushing',
    lowBackArches: false,
    shouldersElevate: false,
    headMigratesForward: false,
    scapularWinging: false,
  })
  const [pullingFinding, setPullingFinding] = useState<PushPullObservation>({
    assessmentType: 'pulling',
    lowBackArches: false,
    shouldersElevate: false,
    headMigratesForward: false,
    scapularWinging: false,
  })

  // Cardio / Vitals State
  const [restingHr, setRestingHr] = useState<string>('68')
  const [systolicBp, setSystolicBp] = useState<string>('120')
  const [diastolicBp, setDiastolicBp] = useState<string>('80')
  const [ymcaPulse, setYmcaPulse] = useState<string>('')
  const [coachNotes, setCoachNotes] = useState<string>('')
  const [saving, setSaving] = useState<boolean>(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Computed CEx Plan from current findings
  const ohsaList = useMemo(
    () => Array.from(selectedOhsaFindings.values()),
    [selectedOhsaFindings]
  )

  const computedCEx = useMemo(() => {
    return generateCorrectiveExercisePlan(ohsaList)
  }, [ohsaList])

  // Computed Cardio Zones
  const cardioZones = useMemo(() => {
    const rHr = Number(restingHr) || 70
    return calculateNasmCardioZones(clientAge, rHr)
  }, [clientAge, restingHr])

  // Computed YMCA Step Test rating
  const stepTestRating = useMemo(() => {
    const pulse = Number(ymcaPulse)
    if (!pulse || pulse < 40) return null
    return rateYmcaStepTest(pulse, clientAge, clientSex)
  }, [ymcaPulse, clientAge, clientSex])

  // Computed Re-Assessment Comparison Result
  const comparisonResult: AssessmentComparisonResult | null = useMemo(() => {
    if (!compareMode || !compareBaselineId || !compareFollowUpId) return null
    const base = assessments.find(a => a.id === compareBaselineId)
    const follow = assessments.find(a => a.id === compareFollowUpId)
    if (!base || !follow) return null
    return compareNasmAssessments(base, follow)
  }, [compareMode, compareBaselineId, compareFollowUpId, assessments])

  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false)
  const [isBodyCompModalOpen, setIsBodyCompModalOpen] = useState<boolean>(false)

  const handleApplyScanResult = (scanResult: PosturalMeshScanResult) => {
    setSelectedOhsaFindings(prev => {
      const next = new Map(prev)
      scanResult.ohsaObservations.forEach(obs => {
        next.set(obs.compensation, {
          compensation: obs.compensation,
          checkpoint: obs.checkpoint,
          view: obs.view,
          severity: obs.severity,
        })
      })
      return next
    })

    if (scanResult.staticFindings?.length) {
      setStaticPostureFindings(scanResult.staticFindings)
    }

    if (scanResult.clinicalSummary) {
      setCoachNotes(prev =>
        prev
          ? `${prev}\n\n[AI Mesh Scan Summary]: ${scanResult.clinicalSummary}`
          : `[AI Mesh Scan Summary]: ${scanResult.clinicalSummary}`
      )
    }

    setActiveTab('ohsa')
  }

  function handlePrintReport() {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  function toggleOhsaCompensation(comp: OhsaCompensation) {
    const mapping = NASM_OHSA_MAPPINGS[comp]
    if (!mapping) return

    setSelectedOhsaFindings(prev => {
      const next = new Map(prev)
      if (next.has(comp)) {
        next.delete(comp)
      } else {
        next.set(comp, {
          compensation: comp,
          view: mapping.view,
          checkpoint: mapping.checkpoint,
          severity: 'moderate',
        })
      }
      return next
    })
  }

  function setCompensationSeverity(comp: OhsaCompensation, severity: 'mild' | 'moderate' | 'severe') {
    setSelectedOhsaFindings(prev => {
      const next = new Map(prev)
      const existing = next.get(comp)
      if (existing) {
        next.set(comp, { ...existing, severity })
      }
      return next
    })
  }

  async function handleSaveAssessment() {
    setSaving(true)
    setErrorMessage(null)
    setSaveSuccess(null)

    const cardioVitalsData: CardioVitalsAssessment = {
      restingHeartRateBpm: restingHr ? Number(restingHr) : null,
      bloodPressureSystolic: systolicBp ? Number(systolicBp) : null,
      bloodPressureDiastolic: diastolicBp ? Number(diastolicBp) : null,
      stepTestRecoveryHrBpm: ymcaPulse ? Number(ymcaPulse) : null,
      cardioFitnessRating: stepTestRating,
    }

    try {
      const res = await fetch(`/api/coach/clients/${clientId}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_date: assessmentDate,
          title: assessmentTitle,
          static_posture: staticPostureFindings,
          ohsa_findings: ohsaList,
          single_leg_squat: [slsLeft, slsRight],
          push_pull: [pushingFinding, pullingFinding],
          cardio_vitals: cardioVitalsData,
          coach_summary_notes: coachNotes,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error ?? 'Failed to save assessment')
      }

      const savedData: NasmAssessmentRecord = await res.json()
      setAssessments(prev => [savedData, ...prev])
      setSelectedAssessmentId(savedData.id)
      setSaveSuccess('NASM Assessment and Corrective Protocol successfully saved!')
      if (onAssessmentSaved) {
        onAssessmentSaved(savedData)
      }
      setActiveTab('cex')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error saving assessment')
    } finally {
      setSaving(false)
    }
  }

  const selectedAssessment = assessments.find(a => a.id === selectedAssessmentId) ?? assessments[0]

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Header Toolbar */}
      <div
        className="glass-card"
        style={{
          padding: 'clamp(14px, 3.5vw, 24px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 700,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                padding: '4px 10px',
                background: 'rgba(197,160,89,0.15)',
                color: 'var(--gold-lt)',
                border: '1px solid rgba(197,160,89,0.4)',
              }}
            >
              NASM OPT™ Protocol
            </span>
            <span style={{ color: 'var(--gray)', fontSize: 13 }}>
              Kinetic Chain Movement Diagnostics
            </span>
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontWeight: 700,
              fontSize: 'clamp(20px, 3vw, 26px)',
              letterSpacing: '0.04em',
              margin: '6px 0 0',
              color: 'var(--white)',
            }}
          >
            Kinetic Chain Assessment Suite
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--gray)', fontSize: 13 }}>
            Client: <strong style={{ color: 'var(--white)' }}>{clientName}</strong> · Age: {clientAge} · Recorded Assessments: {assessments.length}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="tactile-btn"
            style={{
              padding: '10px 18px',
              background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
              border: 'none',
              color: '#080E14',
              fontFamily: 'Raleway, sans-serif',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              alignSelf: 'flex-end',
              boxShadow: '0 4px 14px rgba(197, 160, 89, 0.35)',
            }}
          >
            <GaaIcon name="camera" size={14} style={{ color: '#080E14', stroke: '#080E14' }} />
            <span>AI Posture & OHSA Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBodyCompModalOpen(true)}
            className="tactile-btn"
            style={{
              padding: '10px 18px',
              background: 'linear-gradient(135deg, rgba(56,189,248,0.2) 0%, rgba(56,189,248,0.08) 100%)',
              border: '1px solid #38BDF8',
              color: '#38BDF8',
              fontFamily: 'Raleway, sans-serif',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              alignSelf: 'flex-end',
              boxShadow: '0 4px 14px rgba(56, 189, 248, 0.25)',
            }}
          >
            <GaaIcon name="dna" size={14} style={{ color: '#38BDF8' }} />
            <span>AI DEXA Body Comp Scan</span>
          </button>

          <button
            type="button"
            onClick={handlePrintReport}
            className="tactile-btn"
            style={{
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--white)',
              fontFamily: 'Raleway, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              alignSelf: 'flex-end',
            }}
          >
            <GaaIcon name="download" size={13} tone="white" />
            <span>Print / Export PDF</span>
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <label style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Date</label>
            <input
              type="date"
              value={assessmentDate}
              onChange={e => setAssessmentDate(e.target.value)}
              style={{
                padding: '7px 12px',
                background: 'rgba(8,14,20,0.6)',
                border: '1px solid var(--navy-lt)',
                color: 'var(--white)',
                fontSize: 13,
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleSaveAssessment}
            disabled={saving}
            className="tactile-btn"
            style={{
              padding: '10px 22px',
              background: 'var(--gold)',
              border: 'none',
              color: 'var(--navy)',
              fontFamily: 'var(--font-sans, Raleway), sans-serif',
              fontSize: 12,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 800,
              alignSelf: 'flex-end',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name="check" size={14} style={{ color: 'var(--navy)', stroke: 'var(--navy)' }} />
            <span>{saving ? 'Saving...' : 'Save NASM Assessment'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(52,211,153,0.12)',
            border: '1px solid var(--success)',
            color: 'var(--white)',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name="check" size={14} tone="emerald" />
              <span>{saveSuccess}</span>
            </span>
            <a
              href={`/coach/clients/${clientId}?tab=periodization#workspace-tab-content`}
              style={{
                padding: '4px 12px',
                borderRadius: 4,
                background: 'var(--gold)',
                color: '#080E14',
                fontSize: 12,
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>Proceed to Stage 5: Periodization Architecture ➔</span>
            </a>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccess(null)}
            style={{ background: 'transparent', border: 'none', color: 'var(--gray)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <GaaIcon name="close" size={14} tone="slate" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(248,113,113,0.12)',
            border: '1px solid var(--error)',
            color: 'var(--white)',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <GaaIcon name="alert-triangle" size={14} tone="ruby" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* AI Coach Forwarding Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(212,160,23,0.15) 0%, rgba(14,24,39,0.95) 100%)',
          border: '1px solid var(--gold)',
          borderRadius: 8,
          padding: '12px 18px',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#080E14' }}>
            <GaaIcon name="brain" size={14} style={{ color: '#080E14' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--white)' }}>
              Movement Screen: Powered Exclusively by AI Posture &amp; OHSA Scanner
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray)' }}>
              {selectedOhsaFindings.size > 0 || staticPostureFindings.length > 0
                ? `${selectedOhsaFindings.size} kinetic compensations & ${staticPostureFindings.length} postural findings detected. 4-Phase CEx continuum active.`
                : 'Capture Anterior, Lateral, Posterior & OHSA frames to auto-compile 4-Phase CEx and synthesize Periodization.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a
            href={`/coach/clients/${clientId}?tab=onboarding#workspace-tab-content`}
            className="tactile-btn"
            style={{
              padding: '6px 14px',
              borderRadius: 4,
              background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
              color: '#080E14',
              fontSize: 11.5,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>Launch AI Coach Fast-Track Flow</span>
            <span>➔</span>
          </a>
          <a
            href={`/coach/clients/${clientId}?tab=periodization#workspace-tab-content`}
            style={{
              fontSize: 11.5,
              color: 'var(--gold-lt)',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Open Periodization ➔
          </a>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="responsive-tabs-scroll" style={{ display: 'flex', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
        {[
          { key: 'ohsa', label: '1. AI Overhead Squat (OHSA)', badge: ohsaList.length > 0 ? String(ohsaList.length) : null },
          { key: 'posture', label: '2. AI Posture & Distortion Syndromes', badge: 'Mesh Scanner' },
          { key: 'dynamic', label: '3. SLS & Push/Pull', badge: null },
          { key: 'cardio', label: '4. Cardio & Vitals', badge: restingHr ? 'HR' : null },
          { key: 'cex', label: '5. Prescribed 4-Phase CEx Continuum', badge: `${computedCEx.overactiveMuscles.length} Impaired` },
          { key: 'history', label: `History (${assessments.length})`, badge: null },
        ].map(tab => {
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as AssessmentTab)}
              className="tactile-btn"
              style={{
                padding: '10px 16px',
                border: active ? '1px solid rgba(197,160,89,0.55)' : '1px solid rgba(255,255,255,0.08)',
                background: active ? 'rgba(197,160,89,0.12)' : 'rgba(14,23,36,0.6)',
                color: active ? 'var(--gold-lt)' : 'var(--white)',
                fontFamily: 'Raleway, sans-serif',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.06em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  style={{
                    background: active ? 'var(--gold)' : 'rgba(255,255,255,0.12)',
                    color: active ? 'var(--navy)' : 'var(--white)',
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 10,
                    fontWeight: 800,
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab 1: Overhead Squat Assessment (OHSA) */}
      {activeTab === 'ohsa' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 18 }}>
            <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 20, color: 'var(--white)', letterSpacing: '0.04em' }}>
              NASM Overhead Squat Assessment (OHSA)
            </h3>
            <p style={{ margin: 0, color: 'var(--gray)', fontSize: 13, lineHeight: 1.5 }}>
              Instruct the client to stand with feet shoulder-width apart, arms raised overhead with elbows extended. Have them perform 5 repetitions while observing from the Anterior, Lateral, and Posterior views. Tap all observed compensations.
            </p>
          </div>

          {/* Grouped by Kinetic Chain Checkpoints */}
          {(Object.keys(CHECKPOINT_LABELS) as KineticChainCheckpoint[]).map(checkpoint => {
            const mappingsForCheckpoint = Object.values(NASM_OHSA_MAPPINGS).filter(
              m => m.checkpoint === checkpoint
            )
            if (mappingsForCheckpoint.length === 0) return null

            return (
              <div
                key={checkpoint}
                style={{
                  border: '1px solid var(--navy-lt)',
                  background: 'var(--navy-mid)',
                  padding: 16,
                  display: 'grid',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4
                    style={{
                      margin: 0,
                      fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                      fontWeight: 700,
                      fontSize: 15,
                      color: 'var(--gold-lt)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {CHECKPOINT_LABELS[checkpoint]}
                  </h4>
                  <span style={{ fontSize: 12, color: 'var(--gray)', textTransform: 'uppercase' }}>
                    {mappingsForCheckpoint[0]?.view} view
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 12 }}>
                  {mappingsForCheckpoint.map(m => {
                    const isSelected = selectedOhsaFindings.has(m.compensation)
                    const finding = selectedOhsaFindings.get(m.compensation)

                    return (
                      <div
                        key={m.compensation}
                        style={{
                          border: isSelected ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
                          background: isSelected ? 'rgba(212,160,23,0.1)' : 'rgba(255,255,255,0.03)',
                          padding: 14,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: 10,
                          cursor: 'pointer',
                        }}
                        onClick={() => toggleOhsaCompensation(m.compensation)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                          <div>
                            <div style={{ fontWeight: 700, color: isSelected ? 'var(--gold-lt)' : 'var(--white)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <GaaIcon name={isSelected ? 'check' : 'target'} size={13} tone={isSelected ? 'gold' : 'slate'} />
                              <span>{m.label}</span>
                            </div>
                            <div style={{ color: 'var(--gray)', fontSize: 12, marginTop: 4 }}>
                              View: <strong style={{ color: 'var(--white)' }}>{m.view.toUpperCase()}</strong>
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div
                            style={{
                              marginTop: 6,
                              paddingTop: 8,
                              borderTop: '1px solid rgba(212,160,23,0.2)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8,
                            }}
                            onClick={e => e.stopPropagation()}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase' }}>Severity:</span>
                              {(['mild', 'moderate', 'severe'] as const).map(sev => (
                                <button
                                  key={sev}
                                  type="button"
                                  onClick={() => setCompensationSeverity(m.compensation, sev)}
                                  style={{
                                    padding: '3px 8px',
                                    border: finding?.severity === sev ? '1px solid var(--gold)' : '1px solid var(--navy-lt)',
                                    background: finding?.severity === sev ? 'var(--gold)' : 'var(--navy)',
                                    color: finding?.severity === sev ? 'var(--navy)' : 'var(--white)',
                                    fontSize: 10,
                                    fontFamily: 'Raleway, sans-serif',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {sev}
                                </button>
                              ))}
                            </div>

                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
                              <span style={{ color: '#ff6b6b', fontWeight: 600 }}>Overactive:</span> {m.overactiveMuscles.join(', ')}
                            </div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
                              <span style={{ color: '#51cf66', fontWeight: 600 }}>Underactive:</span> {m.underactiveMuscles.join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tab 2: Static Posture & Distortion Syndromes */}
      {activeTab === 'posture' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <PosturalDistortionStudio />
        </div>
      )}

      {/* Tab 3: Single-Leg Squat & Push/Pull Screen */}
      {activeTab === 'dynamic' && (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Single Leg Squat */}
          <div style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 18 }}>
            <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 20, color: 'var(--white)', letterSpacing: '0.04em' }}>
              Single-Leg Squat Assessment (SLS)
            </h3>
            <p style={{ margin: '0 0 14px', color: 'var(--gray)', fontSize: 13 }}>
              Assesses dynamic ankle and hip stability, knee valgus, and pelvic control under unilateral loading.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
              {/* Left Leg */}
              <div style={{ border: '1px solid rgba(255,255,255,0.08)', padding: 14, background: 'rgba(255,255,255,0.02)' }}>
                <h4 style={{ margin: '0 0 10px', color: 'var(--gold-lt)', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 15, letterSpacing: '0.04em' }}>
                  Left Leg Squat
                </h4>
                <div style={{ display: 'grid', gap: 8 }}>
                  {[
                    { key: 'kneeValgus', label: 'Knee moves inward (Valgus)' },
                    { key: 'pelvicDrop', label: 'Contralateral pelvic drop' },
                    { key: 'pelvicRotation', label: 'Pelvic rotation / hike' },
                    { key: 'torsoLean', label: 'Excessive torso lateral lean' },
                  ].map(item => (
                    <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--white)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(slsLeft[item.key as keyof SingleLegSquatObservation])}
                        onChange={e => setSlsLeft(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Right Leg */}
              <div style={{ border: '1px solid rgba(255,255,255,0.08)', padding: 14, background: 'rgba(255,255,255,0.02)' }}>
                <h4 style={{ margin: '0 0 10px', color: 'var(--gold-lt)', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 15, letterSpacing: '0.04em' }}>
                  Right Leg Squat
                </h4>
                <div style={{ display: 'grid', gap: 8 }}>
                  {[
                    { key: 'kneeValgus', label: 'Knee moves inward (Valgus)' },
                    { key: 'pelvicDrop', label: 'Contralateral pelvic drop' },
                    { key: 'pelvicRotation', label: 'Pelvic rotation / hike' },
                    { key: 'torsoLean', label: 'Excessive torso lateral lean' },
                  ].map(item => (
                    <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--white)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(slsRight[item.key as keyof SingleLegSquatObservation])}
                        onChange={e => setSlsRight(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pushing & Pulling Assessments */}
          <div style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 18 }}>
            <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 20, color: 'var(--white)', letterSpacing: '0.04em' }}>
              Pushing & Pulling Movement Screens
            </h3>
            <p style={{ margin: '0 0 14px', color: 'var(--gray)', fontSize: 13 }}>
              Evaluates scapular stabilization, lumbo-pelvic control, and cervical alignment under horizontal push/pull loading (e.g. Standing Cable Chest Press & Standing Cable Row).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
              {/* Pushing */}
              <div style={{ border: '1px solid rgba(255,255,255,0.08)', padding: 14, background: 'rgba(255,255,255,0.02)' }}>
                <h4 style={{ margin: '0 0 10px', color: 'var(--gold-lt)', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 15, letterSpacing: '0.04em' }}>
                  Pushing Assessment
                </h4>
                <div style={{ display: 'grid', gap: 8 }}>
                  {[
                    { key: 'lowBackArches', label: 'Low back arches (LPHC compensation)' },
                    { key: 'shouldersElevate', label: 'Shoulders elevate (Upper trap dominance)' },
                    { key: 'headMigratesForward', label: 'Head migrates forward' },
                    { key: 'scapularWinging', label: 'Scapular winging (Serratus anterior weakness)' },
                  ].map(item => (
                    <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--white)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(pushingFinding[item.key as keyof PushPullObservation])}
                        onChange={e => setPushingFinding(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Pulling */}
              <div style={{ border: '1px solid rgba(255,255,255,0.08)', padding: 14, background: 'rgba(255,255,255,0.02)' }}>
                <h4 style={{ margin: '0 0 10px', color: 'var(--gold-lt)', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 15, letterSpacing: '0.04em' }}>
                  Pulling Assessment
                </h4>
                <div style={{ display: 'grid', gap: 8 }}>
                  {[
                    { key: 'lowBackArches', label: 'Low back arches (Lumbar extension)' },
                    { key: 'shouldersElevate', label: 'Shoulders elevate' },
                    { key: 'headMigratesForward', label: 'Head migrates forward' },
                    { key: 'scapularWinging', label: 'Scapular winging / loss of retraction' },
                  ].map(item => (
                    <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--white)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(pullingFinding[item.key as keyof PushPullObservation])}
                        onChange={e => setPullingFinding(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Cardiorespiratory Fitness & Heart Rate Zones */}
      {activeTab === 'cardio' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 18 }}>
            <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 20, color: 'var(--white)', letterSpacing: '0.04em' }}>
              NASM Cardiorespiratory & Vitals Calculator
            </h3>
            <p style={{ margin: 0, color: 'var(--gray)', fontSize: 13, lineHeight: 1.5 }}>
              Calculate client physiological benchmarks, aerobic training zones (Zone 1, Zone 2, Zone 3), and YMCA 3-Minute Step Test recovery rating.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 16 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 6 }}>
                Resting Heart Rate (BPM)
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                onFocus={selectOnFocus}
                value={restingHr}
                onChange={e => setRestingHr(sanitizeNumericInput(e.target.value))}
                style={{ width: '100%', padding: '8px 10px', background: 'var(--navy)', border: '1px solid var(--navy-lt)', color: 'var(--white)', fontSize: 16 }}
              />
            </div>

            <div style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 16 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 6 }}>
                Blood Pressure (Systolic / Diastolic)
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  onFocus={selectOnFocus}
                  value={systolicBp}
                  onChange={e => setSystolicBp(sanitizeNumericInput(e.target.value))}
                  placeholder="120"
                  style={{ width: '100%', padding: '8px 10px', background: 'var(--navy)', border: '1px solid var(--navy-lt)', color: 'var(--white)', fontSize: 16 }}
                />
                <span style={{ color: 'var(--gray)' }}>/</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  onFocus={selectOnFocus}
                  value={diastolicBp}
                  onChange={e => setDiastolicBp(sanitizeNumericInput(e.target.value))}
                  placeholder="80"
                  style={{ width: '100%', padding: '8px 10px', background: 'var(--navy)', border: '1px solid var(--navy-lt)', color: 'var(--white)', fontSize: 16 }}
                />
              </div>
            </div>

            <div style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 16 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 6 }}>
                YMCA 3-Min Step Recovery Pulse (1-min bpm)
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                onFocus={selectOnFocus}
                value={ymcaPulse}
                onChange={e => setYmcaPulse(sanitizeNumericInput(e.target.value))}
                placeholder="e.g. 96"
                style={{ width: '100%', padding: '8px 10px', background: 'var(--navy)', border: '1px solid var(--navy-lt)', color: 'var(--white)', fontSize: 16 }}
              />
              {stepTestRating && (
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: stepTestRating === 'excellent' || stepTestRating === 'very_good' ? 'var(--success)' : stepTestRating === 'good' || stepTestRating === 'average' ? 'var(--gold)' : 'var(--error)', textTransform: 'uppercase' }}>
                  Cardio Fitness Rating: {stepTestRating.replace('_', ' ')}
                </div>
              )}
            </div>
          </div>

          {/* 3-Zone Cardiorespiratory Chart */}
          <div style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 18 }}>
            <h4 style={{ margin: '0 0 12px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 16, color: 'var(--gold-lt)', letterSpacing: '0.04em' }}>
              NASM 3-Stage Target Heart Rate Zones (Max HR: {cardioZones.hrMaxBpm} BPM)
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              {/* Zone 1 */}
              <div style={{ border: '1px solid rgba(74,144,226,0.3)', background: 'rgba(74,144,226,0.08)', padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#90beff', fontSize: 14 }}>{cardioZones.zone1.name}</span>
                  <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 700, fontSize: 15, color: 'var(--white)' }}>
                    {cardioZones.zone1.minBpm} - {cardioZones.zone1.maxBpm} BPM
                  </span>
                </div>
                <p style={{ margin: '8px 0 4px', fontSize: 12, color: 'var(--white)', lineHeight: 1.4 }}>
                  {cardioZones.zone1.description}
                </p>
                <div style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 600 }}>
                  Aligned with: {cardioZones.zone1.nasmOptPhase}
                </div>
              </div>

              {/* Zone 2 */}
              <div style={{ border: '1px solid rgba(212,160,23,0.3)', background: 'rgba(212,160,23,0.08)', padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--gold-lt)', fontSize: 14 }}>{cardioZones.zone2.name}</span>
                  <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 700, fontSize: 15, color: 'var(--white)' }}>
                    {cardioZones.zone2.minBpm} - {cardioZones.zone2.maxBpm} BPM
                  </span>
                </div>
                <p style={{ margin: '8px 0 4px', fontSize: 12, color: 'var(--white)', lineHeight: 1.4 }}>
                  {cardioZones.zone2.description}
                </p>
                <div style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 600 }}>
                  Aligned with: {cardioZones.zone2.nasmOptPhase}
                </div>
              </div>

              {/* Zone 3 */}
              <div style={{ border: '1px solid rgba(255,61,87,0.3)', background: 'rgba(255,61,87,0.08)', padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#ff8a9a', fontSize: 14 }}>{cardioZones.zone3.name}</span>
                  <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 700, fontSize: 15, color: 'var(--white)' }}>
                    {cardioZones.zone3.minBpm} - {cardioZones.zone3.maxBpm} BPM
                  </span>
                </div>
                <p style={{ margin: '8px 0 4px', fontSize: 12, color: 'var(--white)', lineHeight: 1.4 }}>
                  {cardioZones.zone3.description}
                </p>
                <div style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 600 }}>
                  Aligned with: {cardioZones.zone3.nasmOptPhase}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: 5-Axis Kinetic Mobility Radar Telemetry */}
      {activeTab === 'radar' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <KineticMobilityRadar
            assessment={{
              ohsa_findings: ohsaList,
              cardio_vitals: {
                stepTestRecoveryHrBpm: ymcaPulse ? Number(ymcaPulse) : undefined,
              },
            }}
          />
        </div>
      )}

      {/* Tab 6: Prescribed Corrective Exercise Continuum (CEx) */}
      {activeTab === 'cex' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 20, color: 'var(--white)', letterSpacing: '0.04em' }}>
                  NASM 4-Phase Corrective Exercise Continuum (CEx)
                </h3>
                <p style={{ margin: 0, color: 'var(--gray)', fontSize: 13 }}>
                  Algorithmically prescribed from {ohsaList.length} movement compensation{ohsaList.length === 1 ? '' : 's'}.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <a
                  href={`/coach/clients/${clientId}?tab=periodization#workspace-tab-content`}
                  className="tactile-btn"
                  style={{
                    padding: '7px 14px',
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                    color: '#080E14',
                    fontSize: 12,
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>Proceed to Stage 5: Periodization ➔</span>
                </a>
                <div style={{ padding: '4px 10px', background: 'rgba(255,107,107,0.15)', border: '1px solid #ff6b6b', fontSize: 12, color: '#ff6b6b', fontWeight: 700 }}>
                  {computedCEx.overactiveMuscles.length} Overactive Muscles
                </div>
                <div style={{ padding: '4px 10px', background: 'rgba(81,207,102,0.15)', border: '1px solid #51cf66', fontSize: 12, color: '#51cf66', fontWeight: 700 }}>
                  {computedCEx.underactiveMuscles.length} Underactive Muscles
                </div>
              </div>
            </div>

            {/* Muscle Breakdown Pill Badges */}
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 12 }}>
              <div style={{ border: '1px solid rgba(255,107,107,0.2)', padding: 10, background: 'rgba(255,107,107,0.04)' }}>
                <div style={{ fontSize: 11, color: '#ff6b6b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>
                  Hyperactive / Shortened (Inhibit & Lengthen)
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {computedCEx.overactiveMuscles.map(m => (
                    <span key={m} style={{ background: 'rgba(255,107,107,0.12)', color: 'var(--white)', padding: '2px 8px', fontSize: 11, borderRadius: 2 }}>
                      {m}
                    </span>
                  ))}
                  {computedCEx.overactiveMuscles.length === 0 && <span style={{ color: 'var(--gray)', fontSize: 12 }}>None detected</span>}
                </div>
              </div>

              <div style={{ border: '1px solid rgba(81,207,102,0.2)', padding: 10, background: 'rgba(81,207,102,0.04)' }}>
                <div style={{ fontSize: 11, color: '#51cf66', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>
                  Inhibited / Underactive (Activate & Integrate)
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {computedCEx.underactiveMuscles.map(m => (
                    <span key={m} style={{ background: 'rgba(81,207,102,0.12)', color: 'var(--white)', padding: '2px 8px', fontSize: 11, borderRadius: 2 }}>
                      {m}
                    </span>
                  ))}
                  {computedCEx.underactiveMuscles.length === 0 && <span style={{ color: 'var(--gray)', fontSize: 12 }}>None detected</span>}
                </div>
              </div>
            </div>
          </div>

          {/* 4 Continuum Phases */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {/* Phase 1: Inhibit */}
            <div style={{ border: '1px solid rgba(212,160,23,0.3)', background: 'var(--navy-mid)', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ margin: 0, color: 'var(--gold-lt)', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 15, letterSpacing: '0.04em' }}>
                  1. INHIBIT (SMR / Release)
                </h4>
                <span style={{ fontSize: 11, color: 'var(--gray)' }}>30-60s hold</span>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {computedCEx.plan.inhibit.map((item, idx) => (
                  <div key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: 13 }}>{item.name}</div>
                    <div style={{ color: 'var(--gold)', fontSize: 11, marginTop: 2 }}>Target: {item.targetMuscle}</div>
                    <div style={{ color: 'var(--gray)', fontSize: 11, marginTop: 2 }}>{item.coachingCues[0]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase 2: Lengthen */}
            <div style={{ border: '1px solid rgba(74,144,226,0.3)', background: 'var(--navy-mid)', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ margin: 0, color: '#90beff', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 15, letterSpacing: '0.04em' }}>
                  2. LENGTHEN (Static Stretch)
                </h4>
                <span style={{ fontSize: 11, color: 'var(--gray)' }}>30s hold</span>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {computedCEx.plan.lengthen.map((item, idx) => (
                  <div key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: 13 }}>{item.name}</div>
                    <div style={{ color: '#90beff', fontSize: 11, marginTop: 2 }}>Target: {item.targetMuscle}</div>
                    <div style={{ color: 'var(--gray)', fontSize: 11, marginTop: 2 }}>{item.coachingCues[0]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase 3: Activate */}
            <div style={{ border: '1px solid rgba(81,207,102,0.3)', background: 'var(--navy-mid)', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ margin: 0, color: '#51cf66', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 15, letterSpacing: '0.04em' }}>
                  3. ACTIVATE (Isolated Strengthening)
                </h4>
                <span style={{ fontSize: 11, color: 'var(--gray)' }}>Tempo 4/2/1</span>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {computedCEx.plan.activate.map((item, idx) => (
                  <div key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: 13 }}>{item.name}</div>
                    <div style={{ color: '#51cf66', fontSize: 11, marginTop: 2 }}>
                      {item.sets ?? '1-2'} sets · {item.repsOrDuration} · Tempo: {item.tempo ?? '4/2/1'}
                    </div>
                    <div style={{ color: 'var(--gray)', fontSize: 11, marginTop: 2 }}>{item.coachingCues[0]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase 4: Integrate */}
            <div style={{ border: '1px solid rgba(160,110,255,0.3)', background: 'var(--navy-mid)', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ margin: 0, color: '#c084fc', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 15, letterSpacing: '0.04em' }}>
                  4. INTEGRATE (Dynamic Movement)
                </h4>
                <span style={{ fontSize: 11, color: 'var(--gray)' }}>Controlled 2/1/2</span>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {computedCEx.plan.integrate.map((item, idx) => (
                  <div key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: 13 }}>{item.name}</div>
                    <div style={{ color: '#c084fc', fontSize: 11, marginTop: 2 }}>
                      {item.sets ?? '2'} sets · {item.repsOrDuration}
                    </div>
                    <div style={{ color: 'var(--gray)', fontSize: 11, marginTop: 2 }}>{item.coachingCues[0]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coach Summary Notes */}
          <div style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 18 }}>
            <h4 style={{ margin: '0 0 8px', color: 'var(--gold-lt)', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 15, letterSpacing: '0.04em' }}>
              Coach Assessment Notes & Client Prescription
            </h4>
            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Assessment Title
                </label>
                <input
                  type="text"
                  value={assessmentTitle}
                  onChange={e => setAssessmentTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', background: 'var(--navy)', border: '1px solid var(--navy-lt)', color: 'var(--white)', fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Summary Notes & Action Plan
                </label>
                <textarea
                  value={coachNotes}
                  onChange={e => setCoachNotes(e.target.value)}
                  rows={3}
                  placeholder="Notes on client movement quality, pain triggers, cues that clicked, and next reassessment date..."
                  style={{ width: '100%', padding: '8px 10px', background: 'var(--navy)', border: '1px solid var(--navy-lt)', color: 'var(--white)', fontSize: 14, fontFamily: 'inherit' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Assessment History Timeline & Re-Assessment Comparison */}
      {activeTab === 'history' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div
            className="glass-card"
            style={{
              padding: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, fontWeight: 700, color: 'var(--white)', letterSpacing: '0.04em' }}>
                NASM Assessment History & Progression Log
              </h3>
              <p style={{ margin: 0, color: 'var(--gray)', fontSize: 13 }}>
                Compare baseline movement screens against follow-up reassessments to demonstrate client kinetic chain improvements.
              </p>
            </div>

            {assessments.length >= 2 && (
              <button
                type="button"
                onClick={() => setCompareMode(prev => !prev)}
                className="tactile-btn"
                style={{
                  padding: '10px 18px',
                  background: compareMode ? 'var(--gold)' : 'rgba(197,160,89,0.15)',
                  border: '1px solid var(--gold)',
                  color: compareMode ? 'var(--navy)' : 'var(--gold-lt)',
                  fontFamily: 'var(--font-sans, Raleway), sans-serif',
                  fontSize: 12,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {compareMode ? (
                  <>
                    <GaaIcon name="close" size={13} style={{ color: 'var(--navy)', stroke: 'var(--navy)' }} />
                    <span>Exit Comparison View</span>
                  </>
                ) : (
                  <>
                    <GaaIcon name="rotate-ccw" size={13} tone="gold" />
                    <span>Compare 2 Assessments</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Comparison Mode Active Card */}
          {compareMode && (
            <div className="glass-card-gold" style={{ padding: 22, display: 'grid', gap: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <h4 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, fontWeight: 700, color: 'var(--gold-lt)', letterSpacing: '0.04em' }}>
                  Movement Re-Assessment Progress Delta
                </h4>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 2, letterSpacing: '0.08em' }}>
                      1. Baseline (Old)
                    </label>
                    <select
                      value={compareBaselineId ?? ''}
                      onChange={e => setCompareBaselineId(e.target.value)}
                      style={{ padding: '7px 12px', background: 'rgba(8,14,20,0.7)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--white)', fontSize: 13 }}
                    >
                      {assessments.map(a => (
                        <option key={a.id} value={a.id}>
                          {new Date(a.assessment_date).toLocaleDateString()} — {a.title ?? 'Assessment'} ({a.ohsa_findings?.length ?? 0} comps)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 2, letterSpacing: '0.08em' }}>
                      2. Follow-Up (New)
                    </label>
                    <select
                      value={compareFollowUpId ?? ''}
                      onChange={e => setCompareFollowUpId(e.target.value)}
                      style={{ padding: '7px 12px', background: 'rgba(8,14,20,0.7)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--white)', fontSize: 13 }}
                    >
                      {assessments.map(a => (
                        <option key={a.id} value={a.id}>
                          {new Date(a.assessment_date).toLocaleDateString()} — {a.title ?? 'Assessment'} ({a.ohsa_findings?.length ?? 0} comps)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {comparisonResult && (
                <div style={{ display: 'grid', gap: 16 }}>
                  {/* Scorecard Hero */}
                  <div className="tabular-nums" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <div style={{ background: 'rgba(8,14,20,0.6)', padding: '16px 20px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>Movement Score Delta</div>
                      <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 32, color: comparisonResult.overallMovementScoreDelta >= 0 ? 'var(--success)' : '#ff6b6b', marginTop: 4 }}>
                        {comparisonResult.overallMovementScoreDelta >= 0 ? `+${comparisonResult.overallMovementScoreDelta}%` : `${comparisonResult.overallMovementScoreDelta}%`}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray)' }}>
                        {comparisonResult.baselineCompensationsCount} comps → {comparisonResult.followUpCompensationsCount} comps
                      </div>
                    </div>

                    <div style={{ background: 'rgba(8,14,20,0.6)', padding: '16px 20px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>Resolved Faults</div>
                      <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 32, color: 'var(--success)', marginTop: 4 }}>
                        {comparisonResult.resolvedCompensations.length}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray)' }}>Compensations normalized</div>
                    </div>

                    <div style={{ background: 'rgba(8,14,20,0.6)', padding: '16px 20px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>Cardio / Recovery Pulse</div>
                      <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 32, color: 'var(--gold-lt)', marginTop: 4 }}>
                        {comparisonResult.cardioDelta.recoveryPulseDelta !== null
                          ? `${comparisonResult.cardioDelta.recoveryPulseDelta > 0 ? '+' : ''}${comparisonResult.cardioDelta.recoveryPulseDelta} bpm`
                          : 'N/A'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray)' }}>YMCA step recovery delta</div>
                    </div>
                  </div>

                  {/* Summary Callout */}
                  <div style={{ padding: '12px 16px', background: 'rgba(72,187,120,0.1)', border: '1px solid rgba(72,187,120,0.3)', color: 'var(--white)', fontSize: 13, lineHeight: 1.5 }}>
                    <strong>Progress Summary:</strong> {comparisonResult.summary}
                  </div>

                  {/* Detailed Lists */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                    {/* Resolved */}
                    <div style={{ background: 'var(--navy)', padding: 14, border: '1px solid rgba(72,187,120,0.3)' }}>
                      <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <GaaIcon name="check" size={13} tone="emerald" />
                        <span>Resolved ({comparisonResult.resolvedCompensations.length})</span>
                      </div>
                      {comparisonResult.resolvedCompensations.length === 0 ? (
                        <div style={{ color: 'var(--gray)', fontSize: 12 }}>None yet</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {comparisonResult.resolvedCompensations.map(r => (
                            <div key={r.compensation} style={{ fontSize: 12, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <GaaIcon name="check" size={11} tone="emerald" />
                              <span>{r.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Ongoing */}
                    <div style={{ background: 'var(--navy)', padding: 14, border: '1px solid rgba(212,160,23,0.3)' }}>
                      <div style={{ color: 'var(--gold-lt)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <GaaIcon name="timer" size={13} tone="gold" />
                        <span>In Progress ({comparisonResult.persistentCompensations.length})</span>
                      </div>
                      {comparisonResult.persistentCompensations.length === 0 ? (
                        <div style={{ color: 'var(--gray)', fontSize: 12 }}>All baseline faults resolved!</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {comparisonResult.persistentCompensations.map(p => (
                            <div key={p.compensation} style={{ fontSize: 12, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <GaaIcon name="target" size={11} tone="gold" />
                              <span>{p.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* New */}
                    <div style={{ background: 'var(--navy)', padding: 14, border: '1px solid rgba(255,107,107,0.3)' }}>
                      <div style={{ color: '#ff6b6b', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <GaaIcon name="alert-triangle" size={13} tone="ruby" />
                        <span>New Focus ({comparisonResult.newCompensations.length})</span>
                      </div>
                      {comparisonResult.newCompensations.length === 0 ? (
                        <div style={{ color: 'var(--gray)', fontSize: 12 }}>No new faults detected</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {comparisonResult.newCompensations.map(n => (
                            <div key={n.compensation} style={{ fontSize: 12, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <GaaIcon name="alert-triangle" size={11} tone="ruby" />
                              <span>{n.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {assessments.length === 0 ? (
            <div style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 24, textAlign: 'center' }}>
              <p style={{ color: 'var(--gray)', margin: 0 }}>No assessments on record yet. Complete the OHSA above and tap Save Assessment.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {assessments.map(asm => {
                const isSelected = selectedAssessment?.id === asm.id
                return (
                  <div
                    key={asm.id}
                    onClick={() => setSelectedAssessmentId(asm.id)}
                    style={{
                      border: isSelected ? '1px solid var(--gold)' : '1px solid var(--navy-lt)',
                      background: isSelected ? 'rgba(212,160,23,0.06)' : 'var(--navy-mid)',
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: isSelected ? 'var(--gold-lt)' : 'var(--white)', fontSize: 16 }}>
                          {asm.title ?? 'NASM Movement Assessment'}
                        </div>
                        <div style={{ color: 'var(--gray)', fontSize: 12, marginTop: 2 }}>
                          Recorded on {new Date(asm.assessment_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ padding: '3px 8px', background: 'rgba(212,160,23,0.15)', color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700 }}>
                          {asm.ohsa_findings?.length ?? 0} Compensations
                        </span>
                        {asm.cardio_vitals?.cardioFitnessRating && (
                          <span style={{ padding: '3px 8px', background: 'rgba(72,187,120,0.15)', color: 'var(--success)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                            Rating: {asm.cardio_vitals.cardioFitnessRating}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Overactive / Underactive Snapshot */}
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, flexWrap: 'wrap' }}>
                      <div style={{ color: '#ff6b6b' }}>
                        <strong>Overactive:</strong> {(asm.overactive_muscles ?? []).slice(0, 4).join(', ') || 'None'}
                      </div>
                      <div style={{ color: '#51cf66' }}>
                        <strong>Underactive:</strong> {(asm.underactive_muscles ?? []).slice(0, 4).join(', ') || 'None'}
                      </div>
                    </div>

                    {asm.coach_summary_notes && (
                      <div style={{ fontSize: 12, color: 'var(--gray)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
                        <strong>Coach Note:</strong> {asm.coach_summary_notes}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Printable Report Document (Hidden on screen, styled for Print/PDF export) */}
      <div
        className="nasm-print-report-container"
        style={{
          display: 'none',
        }}
      >
        <div style={{ borderBottom: '2px solid #0D1B2A', paddingBottom: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0D1B2A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Gordon Athletic Advisory
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#555' }}>
              NASM Kinetic Chain Movement Assessment & Corrective Exercise Prescription
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, color: '#333' }}>
            <div><strong>Client:</strong> {clientName}</div>
            <div><strong>Date:</strong> {new Date(assessmentDate).toLocaleDateString()}</div>
            <div><strong>Protocol:</strong> NASM OPT™ / CES</div>
          </div>
        </div>

        {/* Vitals Summary */}
        <div style={{ background: '#f4f5f7', padding: 12, marginBottom: 16, border: '1px solid #ddd', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 10, fontSize: 12 }}>
          <div><strong>Resting HR:</strong> {restingHr || 'N/A'} bpm</div>
          <div><strong>Blood Pressure:</strong> {systolicBp}/{diastolicBp} mmHg</div>
          <div><strong>YMCA Step Recovery:</strong> {ymcaPulse ? `${ymcaPulse} bpm` : 'N/A'}</div>
          <div><strong>Cardio Rating:</strong> {stepTestRating ? stepTestRating.toUpperCase() : 'N/A'}</div>
        </div>

        {/* OHSA Compensations & Muscle Imbalances */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 14, textTransform: 'uppercase', borderBottom: '1px solid #ccc', paddingBottom: 4 }}>
            1. Movement Screen Findings (Overhead Squat & Static Posture)
          </h3>
          {ohsaList.length === 0 ? (
            <p style={{ fontSize: 12, color: '#555', margin: 0 }}>No kinetic chain compensations detected.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12 }}>
              {ohsaList.map(o => {
                const map = NASM_OHSA_MAPPINGS[o.compensation]
                return (
                  <li key={o.compensation} style={{ marginBottom: 4 }}>
                    <strong>{map?.label ?? o.compensation}</strong> ({o.view} view, {CHECKPOINT_LABELS[o.checkpoint]}) — <em>{o.severity}</em>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Muscle Balance Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 14, marginBottom: 16, fontSize: 12 }}>
          <div style={{ border: '1px solid #ffcccc', background: '#fff5f5', padding: 10 }}>
            <strong style={{ color: '#c53030', textTransform: 'uppercase' }}>Overactive / Shortened (Inhibit & Lengthen):</strong>
            <p style={{ margin: '4px 0 0', color: '#2d3748' }}>
              {computedCEx.overactiveMuscles.join(', ') || 'None'}
            </p>
          </div>
          <div style={{ border: '1px solid #c6f6d5', background: '#f0fff4', padding: 10 }}>
            <strong style={{ color: '#276749', textTransform: 'uppercase' }}>Underactive / Lengthened (Activate & Integrate):</strong>
            <p style={{ margin: '4px 0 0', color: '#2d3748' }}>
              {computedCEx.underactiveMuscles.join(', ') || 'None'}
            </p>
          </div>
        </div>

        {/* 4-Phase Corrective Protocol */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 14, textTransform: 'uppercase', borderBottom: '1px solid #ccc', paddingBottom: 4 }}>
            2. Prescribed 4-Phase Corrective Exercise Continuum (CEx)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 12, fontSize: 11 }}>
            {/* Phase 1: Inhibit */}
            <div style={{ border: '1px solid #ddd', padding: 8 }}>
              <div style={{ fontWeight: 800, color: '#0D1B2A', borderBottom: '1px solid #eee', paddingBottom: 2, marginBottom: 4 }}>
                PHASE 1: INHIBIT (SMR / FOAM ROLL)
              </div>
              {computedCEx.plan.inhibit.map(item => (
                <div key={item.name} style={{ marginBottom: 4 }}>
                  <strong>• {item.name}</strong> ({item.targetMuscle}) — {item.repsOrDuration}
                </div>
              ))}
            </div>

            {/* Phase 2: Lengthen */}
            <div style={{ border: '1px solid #ddd', padding: 8 }}>
              <div style={{ fontWeight: 800, color: '#0D1B2A', borderBottom: '1px solid #eee', paddingBottom: 2, marginBottom: 4 }}>
                PHASE 2: LENGTHEN (STATIC STRETCH)
              </div>
              {computedCEx.plan.lengthen.map(item => (
                <div key={item.name} style={{ marginBottom: 4 }}>
                  <strong>• {item.name}</strong> ({item.targetMuscle}) — {item.repsOrDuration}
                </div>
              ))}
            </div>

            {/* Phase 3: Activate */}
            <div style={{ border: '1px solid #ddd', padding: 8 }}>
              <div style={{ fontWeight: 800, color: '#0D1B2A', borderBottom: '1px solid #eee', paddingBottom: 2, marginBottom: 4 }}>
                PHASE 3: ACTIVATE (ISOLATED STRENGTH)
              </div>
              {computedCEx.plan.activate.map(item => (
                <div key={item.name} style={{ marginBottom: 4 }}>
                  <strong>• {item.name}</strong> — {item.sets} sets x {item.repsOrDuration} (Tempo: {item.tempo})
                </div>
              ))}
            </div>

            {/* Phase 4: Integrate */}
            <div style={{ border: '1px solid #ddd', padding: 8 }}>
              <div style={{ fontWeight: 800, color: '#0D1B2A', borderBottom: '1px solid #eee', paddingBottom: 2, marginBottom: 4 }}>
                PHASE 4: INTEGRATE (DYNAMIC MOVEMENT)
              </div>
              {computedCEx.plan.integrate.map(item => (
                <div key={item.name} style={{ marginBottom: 4 }}>
                  <strong>• {item.name}</strong> — {item.sets} sets x {item.repsOrDuration} (Tempo: {item.tempo})
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coach Summary & Signature */}
        {coachNotes && (
          <div style={{ borderTop: '1px solid #ccc', paddingTop: 8, fontSize: 11, color: '#444' }}>
            <strong>Coach Notes:</strong> {coachNotes}
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#777', borderTop: '1px solid #eee', paddingTop: 8 }}>
          <div>Gordon Athletic Advisory · private human performance advisory</div>
          <div>Page 1 of 1</div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .nasm-print-report-container,
          .nasm-print-report-container * {
            visibility: visible !important;
          }
          .nasm-print-report-container {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 20px !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
          }
        }
      `}</style>

      <AiPostureMeshScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        clientId={clientId}
        clientName={clientName}
        onApplyScan={handleApplyScanResult}
      />

      <AiBodyCompositionScannerModal
        isOpen={isBodyCompModalOpen}
        onClose={() => setIsBodyCompModalOpen(false)}
        clientId={clientId}
        clientName={clientName}
        initialSex={clientSex}
        initialAge={clientAge}
        isCoachView
      />
    </div>
  )
}


