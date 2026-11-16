'use client'

import React, { useState } from 'react'
import SanctuaryModeHud from '@/components/fitness/SanctuaryModeHud'
import MuscleRecoveryHeatmap3D from '@/components/fitness/MuscleRecoveryHeatmap3D'
import MindfulMomentModal from '@/components/fitness/MindfulMomentModal'
import CoachSanctuaryAudioNoteModal from '@/components/coach/CoachSanctuaryAudioNoteModal'
import BandResistanceChartModal from '@/components/fitness/BandResistanceChartModal'
import BarbellPlateCalculator from '@/components/fitness/BarbellPlateCalculator'
import ProofOfWorkDossierModal from '@/components/fitness/ProofOfWorkDossierModal'
import { useSanctuaryMode } from '@/components/fitness/hooks/useSanctuaryMode'
import { getDistractionInterceptionCue } from '@/lib/sanctuary-mode-engine'

export default function AuxiliaryLabTestStage() {
  const [isMindfulOpen, setIsMindfulOpen] = useState(false)
  const [isVoiceStudioOpen, setIsVoiceStudioOpen] = useState(false)
  const [isBandMatrixOpen, setIsBandMatrixOpen] = useState(false)
  const [isPlateCalcOpen, setIsPlateCalcOpen] = useState(false)
  const [isPowDossierOpen, setIsPowDossierOpen] = useState(false)
  const [selectedBandLabel, setSelectedBandLabel] = useState<string | null>(null)
  const [mindfulCompletedSummary, setMindfulCompletedSummary] = useState<string | null>(null)
  const [manualInterventionActive, setManualInterventionActive] = useState(false)

  const sanctuary = useSanctuaryMode({
    isWorkoutActive: true,
    isRestActive: false,
    elapsedRestSeconds: 2,
    currentExerciseName: 'Barbell Back Squat',
  })

  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString().split('T')[0]

  return (
    <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 18, maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Auxiliary Modal Launcher Bar */}
      <div
        role="group"
        aria-label="Auxiliary lab modal launchers"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          padding: 12,
          borderRadius: 10,
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(212, 160, 23, 0.35)',
        }}
      >
        <button
          type="button"
          onClick={() => setIsMindfulOpen(true)}
          style={{ minHeight: 44, padding: '8px 12px', borderRadius: 6, background: 'rgba(56, 189, 248, 0.16)', border: '1px solid #38BDF8', color: '#E0F2FE', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
        >
          Open Mindful Moment
        </button>
        <button
          type="button"
          onClick={() => setIsVoiceStudioOpen(true)}
          style={{ minHeight: 44, padding: '8px 12px', borderRadius: 6, background: 'rgba(212, 175, 55, 0.16)', border: '1px solid #D4AF37', color: '#FDE68A', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
        >
          Open Voice Studio
        </button>
        <button
          type="button"
          onClick={() => setIsBandMatrixOpen(true)}
          style={{ minHeight: 44, padding: '8px 12px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.16)', border: '1px solid #10B981', color: '#D1FAE5', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
        >
          Open Band Matrix
        </button>
        <button
          type="button"
          onClick={() => setIsPlateCalcOpen(true)}
          style={{ minHeight: 44, padding: '8px 12px', borderRadius: 6, background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFFFFF', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
        >
          Open Plate Calculator
        </button>
        <button
          type="button"
          onClick={() => setIsPowDossierOpen(true)}
          style={{ minHeight: 44, padding: '8px 12px', borderRadius: 6, background: 'rgba(168, 85, 247, 0.16)', border: '1px solid #A855F7', color: '#F3E8FF', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
        >
          Open Proof of Work
        </button>
        <button
          type="button"
          onClick={() => setManualInterventionActive(true)}
          style={{ minHeight: 44, padding: '8px 12px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.16)', border: '1px solid #F59E0B', color: '#FDE68A', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
        >
          Simulate Distraction Shield
        </button>
      </div>

      {selectedBandLabel && (
        <div role="status" data-testid="selected-band-status" style={{ color: '#34D399', fontSize: 12, fontWeight: 700 }}>
          Selected band: {selectedBandLabel}
        </div>
      )}

      {mindfulCompletedSummary && (
        <div role="status" data-testid="mindful-completed-status" style={{ color: '#38BDF8', fontSize: 12, fontWeight: 700 }}>
          {mindfulCompletedSummary}
        </div>
      )}

      {/* 1. Sanctuary Mode HUD + Distraction Shield + Coach Audio Memos */}
      <SanctuaryModeHud
        isWorkoutActive
        isRestActive={false}
        focusScore={sanctuary.focusScore}
        distractionCount={sanctuary.distractionCount}
        downRegBreathsCompleted={sanctuary.downRegBreathsCompleted}
        breathingState={sanctuary.breathingState}
        cadence={sanctuary.cadence}
        onChangeCadence={sanctuary.setCadence}
        audioBreathPacerEnabled={sanctuary.audioBreathPacerEnabled}
        onToggleAudioBreathPacer={sanctuary.toggleAudioBreathPacer}
        activeIntervention={
          manualInterventionActive
            ? getDistractionInterceptionCue(1, 'Barbell Back Squat')
            : sanctuary.activeIntervention
        }
        onDismissIntervention={() => {
          setManualInterventionActive(false)
          sanctuary.dismissIntervention()
        }}
      />

      {/* 2. 3D Muscle Recovery Heatmap */}
      <MuscleRecoveryHeatmap3D
        initialAge={38}
        initialSex="male"
        clientGoal="Athletic Hypertrophy"
        intake={{
          parq_answers: { takesBloodPressureOrHeartMedication: true },
          medications: 'Lisinopril 10mg daily',
          medical_conditions: 'Stage 1 Chronic Kidney Disease, Mild Hypertension',
        }}
        workoutLogs={[
          { id: 'aux-log-1', session_date: yesterday, session_title: 'Heavy Squat Day', exertion_rpe: 9 },
          { id: 'aux-log-2', session_date: twoDaysAgo, session_title: 'Upper Push Day', exertion_rpe: 8.5 },
        ]}
        workoutSetLogs={[
          { id: 'aux-set-1', session_date: yesterday, exercise_name: 'Barbell Back Squat', set_number: 1, reps: 8, rpe: 9, tempo: '3/1/1' },
          { id: 'aux-set-2', session_date: yesterday, exercise_name: 'Barbell Back Squat', set_number: 2, reps: 8, rpe: 9, tempo: '3/1/1' },
          { id: 'aux-set-3', session_date: twoDaysAgo, exercise_name: 'Barbell Flat Bench Press', set_number: 1, reps: 10, rpe: 8.5, tempo: '2/0/2' },
        ]}
      />

      {/* 3. Mindful Moment Modal */}
      <MindfulMomentModal
        isOpen={isMindfulOpen}
        onClose={() => setIsMindfulOpen(false)}
        onCompleted={res => setMindfulCompletedSummary(`Completed ${res.protocol} (${res.minutes} min)`)}
      />

      {/* 4. Coach Sanctuary In-Ear Voice Studio Modal */}
      <CoachSanctuaryAudioNoteModal
        isOpen={isVoiceStudioOpen}
        onClose={() => setIsVoiceStudioOpen(false)}
        initialExerciseName="Barbell Back Squat"
        initialClientId="client-uat-1"
        initialClientName="Scott Gordon"
      />

      {/* 5. Resistance Band Calibration Matrix Modal */}
      <BandResistanceChartModal
        isOpen={isBandMatrixOpen}
        onClose={() => setIsBandMatrixOpen(false)}
        onSelectBand={band => {
          setSelectedBandLabel(band.colorName)
          setIsBandMatrixOpen(false)
        }}
      />

      {/* 6. Barbell & Plate Loading Calculator Modal */}
      {isPlateCalcOpen && (
        <BarbellPlateCalculator
          isModal
          initialWeightLbs={225}
          onClose={() => setIsPlateCalcOpen(false)}
        />
      )}

      {/* 7. Proof of Work Clinical Dossier Modal */}
      <ProofOfWorkDossierModal
        isOpen={isPowDossierOpen}
        onClose={() => setIsPowDossierOpen(false)}
      />
    </div>
  )
}
