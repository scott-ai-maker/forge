'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { type ClientStatus } from '@/lib/client-lifecycle'
import CoachClientStatusModal from '@/components/coach/CoachClientStatusModal'
import GaaIcon, { type GaaIconName } from '@/components/ui/GaaIcon'

interface CoachClientOverviewStatusCardProps {
  clientId: string
  clientName: string
  currentStatus: ClientStatus
  statusReason?: string | null
  statusUpdatedAt?: string | null
  auditEventCount?: number
}

export default function CoachClientOverviewStatusCard({
  clientId,
  clientName,
  currentStatus,
  statusReason,
  statusUpdatedAt,
  auditEventCount = 0,
}: CoachClientOverviewStatusCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const statusMeta: Record<ClientStatus, { label: string; color: string; icon: GaaIconName; bg: string; description: string }> = {
    active: {
      label: 'Active Client',
      color: '#10B981',
      icon: 'status-active',
      bg: 'rgba(16,185,129,0.12)',
      description: 'Full access to workouts, live booking, weekly check-ins, and studio messaging.',
    },
    paused: {
      label: 'On Temporary Hold',
      color: '#F59E0B',
      icon: 'status-paused',
      bg: 'rgba(245,158,11,0.12)',
      description: 'Training and session booking are on hold. Historical data remains accessible in read-only mode.',
    },
    inactive: {
      label: 'Deactivated / Inactive',
      color: '#EF4444',
      icon: 'status-inactive',
      bg: 'rgba(239,68,68,0.12)',
      description: 'Account access is deactivated. Workout logging & booking disabled. Audit records preserved.',
    },
    archived: {
      label: 'Archived / Alumni',
      color: '#94A3B8',
      icon: 'status-archived',
      bg: 'rgba(148,163,184,0.12)',
      description: 'Account is in cold-storage archive for graduated athletes or past records.',
    },
  }

  const meta = statusMeta[currentStatus] || statusMeta.active

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(16,24,39,0.95) 0%, rgba(9,14,24,0.98) 100%)',
        border: `1.5px solid ${meta.color}55`,
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 10px 30px rgba(0,0,0,0.4), 0 0 20px rgba(0,0,0,0.2)',
      }}
    >
      <div style={{ flex: '1 1 320px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800 }}>
            Client Governance & Studio Standing
          </span>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 4,
              background: meta.bg,
              border: `1px solid ${meta.color}`,
              color: meta.color,
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name={meta.icon} size={13} />
            <span>{meta.label}</span>
          </span>
        </div>

        <div style={{ fontSize: 13, color: '#E2E8F0', lineHeight: 1.4 }}>
          {meta.description}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--gray)' }}>
          {statusReason && (
            <span>
              Reason: <strong style={{ color: '#FFFFFF' }}>{statusReason}</strong>
            </span>
          )}
          {statusUpdatedAt && (
            <span>
              Updated: {new Date(statusUpdatedAt).toLocaleDateString()} at {new Date(statusUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <span>
            Audit Trail: <strong style={{ color: 'var(--gold-lt)' }}>{auditEventCount} recorded event{auditEventCount === 1 ? '' : 's'}</strong>
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <Link
          href={`/coach/clients/${clientId}?tab=lifecycle`}
          className="tactile-btn"
          style={{
            padding: '10px 16px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 6,
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
          }}
        >
          <GaaIcon name="audit-trail" size={14} tone="white" />
          <span>View Audit Trail</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="tactile-btn"
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
            border: 'none',
            borderRadius: 6,
            color: '#000000',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            boxShadow: '0 4px 16px rgba(212,160,23,0.35)',
          }}
        >
          <GaaIcon name="governance" size={14} style={{ color: '#000000', stroke: '#000000' }} />
          <span>Change Status (Activate / Deactivate / Hold)</span>
        </button>
      </div>

      <CoachClientStatusModal
        clientId={clientId}
        clientName={clientName}
        currentStatus={currentStatus}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

