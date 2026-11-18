'use client'

import React, { useState } from 'react'
import MindfulMomentModal from '@/components/fitness/MindfulMomentModal'
import CoachSanctuaryAudioNoteModal from '@/components/coach/CoachSanctuaryAudioNoteModal'
import BandResistanceChartModal from '@/components/fitness/BandResistanceChartModal'
import BarbellPlateCalculator from '@/components/fitness/BarbellPlateCalculator'
import ProofOfWorkDossierModal from '@/components/fitness/ProofOfWorkDossierModal'

export default function AuxiliaryLabTestStage() {
  const [isMindfulOpen, setIsMindfulOpen] = useState(false)
  const [isVoiceStudioOpen, setIsVoiceStudioOpen] = useState(false)
  const [isBandMatrixOpen, setIsBandMatrixOpen] = useState(false)
  const [isPlateCalcOpen, setIsPlateCalcOpen] = useState(false)
  const [isPowDossierOpen, setIsPowDossierOpen] = useState(false)
  const [selectedBandLabel, setSelectedBandLabel] = useState<string | null>(null)
  const [mindfulCompletedSummary, setMindfulCompletedSummary] = useState<string | null>(null)

  return (
    <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 18, maxWidth: '100%', boxSizing: 'border-box' }}>
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

      <MindfulMomentModal
        isOpen={isMindfulOpen}
        onClose={() => setIsMindfulOpen(false)}
        onCompleted={res => setMindfulCompletedSummary(`Completed ${res.protocol} (${res.minutes} min)`)}
      />

      <CoachSanctuaryAudioNoteModal
        isOpen={isVoiceStudioOpen}
        onClose={() => setIsVoiceStudioOpen(false)}
        initialExerciseName="Barbell Back Squat"
        initialClientId="client-uat-1"
        initialClientName="Scott Gordon"
      />

      <BandResistanceChartModal
        isOpen={isBandMatrixOpen}
        onClose={() => setIsBandMatrixOpen(false)}
        onSelectBand={band => {
          setSelectedBandLabel(band.colorName)
          setIsBandMatrixOpen(false)
        }}
      />

      {isPlateCalcOpen && (
        <BarbellPlateCalculator
          isModal
          initialWeightLbs={225}
          onClose={() => setIsPlateCalcOpen(false)}
        />
      )}

      <ProofOfWorkDossierModal
        isOpen={isPowDossierOpen}
        onClose={() => setIsPowDossierOpen(false)}
      />
    </div>
  )
}
