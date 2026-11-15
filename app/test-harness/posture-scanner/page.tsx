'use client'

import React, { useState } from 'react'
import PostureComparisonCard from '@/components/fitness/PostureComparisonCard'
import PosturalDistortionStudio from '@/components/fitness/PosturalDistortionStudio'
import AiPostureMeshScannerModal from '@/components/coach/AiPostureMeshScannerModal'
import type { PosturalMeshScanResult } from '@/lib/ai-postural-mesh-scanner'

export const dynamic = 'force-dynamic'

export default function PostureScannerTestHarnessPage() {
  const [scannerOpen, setScannerOpen] = useState(false)
  const [appliedScan, setAppliedScan] = useState<PosturalMeshScanResult | null>(null)

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: '#090A0D',
        color: '#F8FAFC',
        padding: 'clamp(12px, 3vw, 24px)',
        overflowX: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          display: 'grid',
          gap: 24,
        }}
      >
        <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#34D399' }}>
              Forge Athletic Feature #5 Diagnostics Harness
            </p>
            <h1 style={{ margin: '4px 0 0', fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800 }}>
              33-Point AI Posture Mesh Scanner &amp; Alignment Comparison
            </h1>
          </div>

          <button
            type="button"
            data-testid="open-ai-posture-scanner-btn"
            onClick={() => setScannerOpen(true)}
            style={{
              minHeight: 45,
              padding: '10px 18px',
              borderRadius: 10,
              border: '1px solid rgba(197, 160, 89, 0.5)',
              background: 'rgba(197, 160, 89, 0.16)',
              color: '#FDE68A',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Launch 33-Point AI Posture Mesh Scanner
          </button>
        </header>

        {appliedScan ? (
          <section
            data-testid="applied-scan-summary"
            aria-label="Applied AI posture scan summary"
            style={{
              padding: 16,
              borderRadius: 12,
              border: '1px solid rgba(52, 211, 153, 0.45)',
              background: 'rgba(16, 185, 129, 0.1)',
              display: 'grid',
              gap: 6,
            }}
          >
            <div style={{ fontWeight: 800, color: '#6EE7B7', fontSize: 14 }}>
              Applied to NASM Assessment: {appliedScan.syndromeDetected} (Score {appliedScan.postureScore}/100)
            </div>
            <div style={{ fontSize: 12, color: '#CBD5E1' }}>
              Compensations ({appliedScan.ohsaObservations.length}):{' '}
              {appliedScan.ohsaObservations.map(o => o.compensation).join(', ') || 'None'}
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', whiteSpace: 'pre-line' }}>
              {appliedScan.clinicalSummary}
            </div>
          </section>
        ) : null}

        <section aria-label="Before and after posture alignment comparison">
          <PostureComparisonCard />
        </section>

        <section aria-label="Postural distortion and muscle synergy studio">
          <PosturalDistortionStudio />
        </section>
      </div>

      <AiPostureMeshScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        clientId="uat-posture-athlete"
        clientName="Julian Mercer"
        onApplyScan={result => setAppliedScan(result)}
      />
    </main>
  )
}
