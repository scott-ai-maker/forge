'use client'

import React from 'react'
import CoachToolboxAssigner from './CoachToolboxAssigner'
import { ClientSex } from '@/lib/supplement-prescriptions'

interface CoachPrescriptionsWorkspaceProps {
  clientId: string
  clientName?: string
  clientAge?: number
  clientSex?: ClientSex
  initialSubtab?: 'toolboxes' | 'supplements' | 'cardio'
}

export default function CoachPrescriptionsWorkspace({
  clientId,
  clientName = 'Client',
}: CoachPrescriptionsWorkspaceProps) {
  return (
    <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header ──────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(14, 22, 36, 0.96) 0%, rgba(8, 14, 24, 0.96) 100%)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          borderRadius: 12,
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#34D399',
              }}
            >
              Athlete Protocols &amp; Toolkits
            </span>
            <span
              style={{
                padding: '2px 7px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 900,
                background: 'rgba(52, 211, 153, 0.15)',
                color: '#34D399',
                border: '1px solid rgba(52, 211, 153, 0.3)',
              }}
            >
              Specialized Toolboxes
            </span>
          </div>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: 'var(--white)',
            }}
          >
            SPECIALIZED RELIEF &amp; RECOVERY TOOLBOXES
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--gray)' }}>
            Configure targeted movement relief toolkits (Desk Worker, Low Back, Travel, and Sleep) for this athlete.
          </p>
        </div>
      </div>

      {/* ── Active Sub-Workspace ─────────────────────────────────── */}
      <div>
        <CoachToolboxAssigner clientId={clientId} clientName={clientName} />
      </div>
    </div>
  )
}
