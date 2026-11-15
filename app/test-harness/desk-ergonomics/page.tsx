'use client'

import React, { useEffect, useState } from 'react'
import DeskErgonomicsAudit from '@/components/fitness/DeskErgonomicsAudit'
import DeskResetModal, { DeskResetSlotCard } from '@/components/fitness/DeskResetModal'
import type { ErgonomicFlag } from '@/lib/posture-profile-state'

export const dynamic = 'force-dynamic'

export default function DeskErgonomicsTestHarnessPage() {
  const [hydrated, setHydrated] = useState(false)
  const [deskResetOpen, setDeskResetOpen] = useState(false)
  const [overrideFlags, setOverrideFlags] = useState<ErgonomicFlag[] | undefined>(undefined)
  const [capOneDesk, setCapOneDesk] = useState(false)
  const [upgradePromptTriggered, setUpgradePromptTriggered] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  return (
    <main
      data-hydrated={hydrated ? 'true' : 'false'}
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
          maxWidth: 1080,
          margin: '0 auto',
          display: 'grid',
          gap: 20,
        }}
      >
        <header
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#34D399',
              }}
            >
              Forge Athletic Feature #6 Diagnostics Harness
            </p>
            <h1 style={{ margin: '4px 0 0', fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800 }}>
              Desk Ergonomics Audit &amp; Guided 5-Minute Desk Reset
            </h1>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              type="button"
              data-testid="toggle-workstation-cap-btn"
              aria-pressed={capOneDesk}
              onClick={() => {
                setCapOneDesk(prev => !prev)
                setUpgradePromptTriggered(false)
              }}
              style={{
                minHeight: 44,
                padding: '8px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.16)',
                background: capOneDesk ? 'rgba(245, 158, 11, 0.18)' : '#181B22',
                color: capOneDesk ? '#FDE68A' : '#E4E4E7',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {capOneDesk ? 'Tier Cap: Core Lab (1 Desk Max)' : 'Tier Cap: Plus (Unlimited Desks)'}
            </button>
          </div>
        </header>

        {upgradePromptTriggered ? (
          <div
            role="status"
            data-testid="workstation-limit-upgrade-banner"
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid rgba(245, 158, 11, 0.45)',
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#FDE68A',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Upgrade Triggered: Core Lab includes 1 saved workstation — upgrade to Plus for unlimited workstation profiles.
          </div>
        ) : null}

        <DeskResetSlotCard
          promotedHero
          onLaunchReset={() => {
            setOverrideFlags(undefined)
            setDeskResetOpen(true)
          }}
        />

        <section aria-label="Desk Ergonomics Camera Audit Studio">
          <DeskErgonomicsAudit
            maxSavedProfiles={capOneDesk ? 1 : null}
            onUpgradeWorkstationLimit={() => setUpgradePromptTriggered(true)}
            onLaunchDeskReset={flags => {
              setOverrideFlags(flags)
              setDeskResetOpen(true)
            }}
          />
        </section>
      </div>

      <DeskResetModal
        open={deskResetOpen}
        onClose={() => setDeskResetOpen(false)}
        overrideFlags={overrideFlags}
      />
    </main>
  )
}
