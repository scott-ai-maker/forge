'use client'

import React, { useState } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import CoachToolboxAssigner from './CoachToolboxAssigner'
import CoachSupplementPrescriber from './CoachSupplementPrescriber'
import CoachCardioPrescriber from './CoachCardioPrescriber'
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
  clientAge = 35,
  clientSex = 'male',
  initialSubtab = 'toolboxes',
}: CoachPrescriptionsWorkspaceProps) {
  const [activeSubtab, setActiveSubtab] = useState<'toolboxes' | 'supplements' | 'cardio'>(initialSubtab)

  return (
    <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header & Mode Switcher ──────────────────────────────── */}
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
              Prescriptions &amp; Clinical Toolkits
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
              Rx Workspace
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
            ATHLETE PRESCRIPTION &amp; TOOLBOX PROTOCOLS
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--gray)' }}>
            Prescribe targeted movement relief toolkits and evidence-based clinical ergogenic supplement regimens.
          </p>
        </div>

        {/* In-Tab Mode Switcher Pills */}
        <div
          style={{
            display: 'inline-flex',
            padding: 4,
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            gap: 4,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveSubtab('toolboxes')}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              background: activeSubtab === 'toolboxes'
                ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)'
                : 'transparent',
              border: activeSubtab === 'toolboxes'
                ? '1px solid #10B981'
                : '1px solid transparent',
              color: activeSubtab === 'toolboxes' ? '#34D399' : 'var(--gray-lt)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
            }}
          >
            <GaaIcon name="toolbox" size={14} tone={activeSubtab === 'toolboxes' ? 'emerald' : 'slate'} />
            <span>Specialized Toolboxes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubtab('supplements')}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              background: activeSubtab === 'supplements'
                ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)'
                : 'transparent',
              border: activeSubtab === 'supplements'
                ? '1px solid #10B981'
                : '1px solid transparent',
              color: activeSubtab === 'supplements' ? '#34D399' : 'var(--gray-lt)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
            }}
          >
            <GaaIcon name="supplements" size={14} tone={activeSubtab === 'supplements' ? 'emerald' : 'slate'} />
            <span>Clinical Supplements</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubtab('cardio')}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              background: activeSubtab === 'cardio'
                ? 'linear-gradient(135deg, rgba(212, 160, 23, 0.3) 0%, rgba(170, 130, 10, 0.2) 100%)'
                : 'transparent',
              border: activeSubtab === 'cardio'
                ? '1px solid #D4AF37'
                : '1px solid transparent',
              color: activeSubtab === 'cardio' ? '#D4AF37' : 'var(--gray-lt)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
            }}
          >
            <GaaIcon name="headphones" size={14} tone={activeSubtab === 'cardio' ? 'gold' : 'slate'} />
            <span>AI Voice Cardio</span>
          </button>
        </div>
      </div>

      {/* ── Active Sub-Workspace ─────────────────────────────────── */}
      <div>
        {activeSubtab === 'toolboxes' ? (
          <CoachToolboxAssigner clientId={clientId} clientName={clientName} />
        ) : activeSubtab === 'supplements' ? (
          <CoachSupplementPrescriber
            clientId={clientId}
            clientName={clientName}
            clientAge={clientAge}
            clientSex={clientSex}
          />
        ) : (
          <CoachCardioPrescriber
            clientId={clientId}
            clientName={clientName}
            clientAge={clientAge}
          />
        )}
      </div>
    </div>
  )
}
