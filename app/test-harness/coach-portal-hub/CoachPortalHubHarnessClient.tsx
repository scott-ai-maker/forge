'use client'

import React, { useState } from 'react'
import CoachClientHubNavigator from '@/components/coach/CoachClientHubNavigator'
import CoachPeriodizationCockpit from '@/components/coach/CoachPeriodizationCockpit'
import CoachPrescriptionsWorkspace from '@/components/coach/CoachPrescriptionsWorkspace'
import ClientDetailClient from '@/components/coach/ClientDetailClient'
import CoachClientStatusModal from '@/components/coach/CoachClientStatusModal'
import { generate12WeekMacrocycle } from '@/lib/periodization-roadmap'
import type { CoachClientTab } from '@/lib/validation'

const INITIAL_MACROCYCLE = generate12WeekMacrocycle(1, 'Body Recomposition & Maximal Power Output')

export default function CoachPortalHubHarnessClient({ activeTab }: { activeTab: CoachClientTab }) {
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [statusUpdatedCount, setStatusUpdatedCount] = useState(0)

  return (
    <div data-hydrated="true" style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gap: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 24, color: '#FFFFFF' }}>
            Coach Client Hub: Marcus Vance
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gray)' }}>
            Forge Athletic Master Coach Workspace · Status Transitions: <span data-testid="status-updated-count">{statusUpdatedCount}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setStatusModalOpen(true)}
          style={{
            minHeight: 44,
            padding: '10px 18px',
            borderRadius: 6,
            background: 'rgba(212,160,23,0.16)',
            border: '1px solid rgba(212,160,23,0.45)',
            color: 'var(--gold-lt)',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Manage Client Status
        </button>
      </header>

      <CoachClientHubNavigator
        clientId="athlete-marcus-01"
        activeTab={activeTab}
        clientName="Marcus Vance"
        currentStageTab="checkins"
        currentStageNumber={8}
        currentStageTitle="Weekly Follow-Ups"
      />

      {activeTab === 'prescriptions' && (
        <section aria-label="Supplements & Gear Prescriptions">
          <CoachPrescriptionsWorkspace
            clientId="athlete-marcus-01"
            clientName="Marcus Vance"
            initialSubtab="supplements"
          />
        </section>
      )}

      <section aria-label="12-Week Periodization Cockpit">
        <CoachPeriodizationCockpit
          clientId="athlete-marcus-01"
          clientName="Marcus Vance"
          clientGoal="Body Recomposition & Maximal Power Output"
          initialPlan={INITIAL_MACROCYCLE}
        />
      </section>

      <section aria-label="Consultation & Sessions">
        <ClientDetailClient
          clientId="athlete-marcus-01"
          clientName="Marcus Vance"
          sessions={[]}
          packages={[{ id: 'pkg-1', package_name: '12-Session Executive Pack', sessions_remaining: 8, sessions_total: 12 }]}
        />
      </section>

      <CoachClientStatusModal
        clientId="athlete-marcus-01"
        clientName="Marcus Vance"
        currentStatus="active"
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onSuccess={() => setStatusUpdatedCount(c => c + 1)}
      />
    </div>
  )
}
