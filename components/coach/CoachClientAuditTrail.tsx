'use client'

import React, { useState } from 'react'
import {
  STATUS_REASONS,
  type ClientStatus,
  type LifecycleAuditLogEntry,
} from '@/lib/client-lifecycle'
import CoachClientStatusModal from '@/components/coach/CoachClientStatusModal'
import { GaaIcon } from '@/components/ui/GaaIcon'

interface CoachClientAuditTrailProps {
  clientId: string
  clientName: string
  currentStatus: ClientStatus
  statusReason?: string | null
  statusUpdatedAt?: string | null
  auditLogs: LifecycleAuditLogEntry[]
}

export default function CoachClientAuditTrail({
  clientId,
  clientName,
  currentStatus,
  statusReason,
  statusUpdatedAt,
  auditLogs = [],
}: CoachClientAuditTrailProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const statusBadge = (status: ClientStatus) => {
    const config: Record<ClientStatus, { label: string; color: string; icon: 'status-active' | 'status-paused' | 'status-inactive' | 'folder'; tone: 'emerald' | 'amber' | 'ruby' | 'slate'; bg: string }> = {
      active: { label: 'Active', color: '#10B981', icon: 'status-active', tone: 'emerald', bg: 'rgba(16,185,129,0.12)' },
      paused: { label: 'Paused / Hold', color: '#F59E0B', icon: 'status-paused', tone: 'amber', bg: 'rgba(245,158,11,0.12)' },
      inactive: { label: 'Inactive / Deactivated', color: '#EF4444', icon: 'status-inactive', tone: 'ruby', bg: 'rgba(239,68,68,0.12)' },
      archived: { label: 'Archived', color: '#94A3B8', icon: 'folder', tone: 'slate', bg: 'rgba(148,163,184,0.12)' },
    }
    const item = config[status] || config.active

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 6,
          background: item.bg,
          border: `1px solid ${item.color}44`,
          color: item.color,
          fontSize: 12,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        <GaaIcon name={item.icon} tone={item.tone} size={11} />
        <span>{item.label}</span>
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Current Standing Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16,24,39,0.95) 0%, rgba(9,14,24,0.98) 100%)',
          border: '1px solid rgba(212,160,23,0.35)',
          borderRadius: 12,
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        }}
      >
        <div>
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 4 }}>
            Clinical & Concierge Governance
          </div>
          <h3 style={{ margin: '0 0 8px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 20, letterSpacing: '0.04em', color: '#FFFFFF' }}>
            Client Lifecycle Standing: {clientName}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>{statusBadge(currentStatus)}</div>
            {statusReason && (
              <span style={{ fontSize: 13, color: '#CBD5E1' }}>
                Reason: <strong>{statusReason}</strong>
              </span>
            )}
            {statusUpdatedAt && (
              <span style={{ fontSize: 11.5, color: 'var(--gray)' }}>
                (Updated {new Date(statusUpdatedAt).toLocaleDateString()} at {new Date(statusUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="tactile-btn"
          style={{
            padding: '12px 22px',
            background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
            border: 'none',
            borderRadius: 7,
            color: '#000000',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 16px rgba(212,160,23,0.35)',
          }}
        >
          <GaaIcon name="shield-check" size={14} tone="inherit" />
          <span>Change Client Status</span>
        </button>
      </div>

      {/* Audit History Timeline */}
      <div
        style={{
          background: '#0D1726',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
              <GaaIcon name="folder" size={15} tone="gold" />
              <span>Immutable Lifecycle Audit Trail</span>
            </h4>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--gray)' }}>
              Full chronological log of all membership activations, deactivations, pauses, and policy transitions.
            </p>
          </div>
          <span style={{ fontSize: 11.5, color: 'var(--gold-lt)', fontWeight: 700, background: 'rgba(212,160,23,0.1)', padding: '3px 8px', borderRadius: 4 }}>
            {auditLogs.length} Recorded Event{auditLogs.length === 1 ? '' : 's'}
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.1)' }}>
            <div style={{ marginBottom: 8 }}><GaaIcon name="folder" size={28} tone="slate" /></div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginBottom: 2 }}>No Lifecycle Transitions Logged Yet</div>
            <div style={{ fontSize: 12, color: 'var(--gray)' }}>
              Initial account creation was recorded. Future status transitions will be immutably cataloged here.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {auditLogs.map((log) => {
              const reasonDef = STATUS_REASONS[log.reason_code]
              const dateObj = new Date(log.effective_date || log.created_at)

              return (
                <div
                  key={log.id}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', textTransform: 'capitalize' }}>
                        {log.action.replace('_', ' ')}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        {log.previous_status && (
                          <>
                            <span style={{ color: 'var(--gray)', textTransform: 'uppercase', fontSize: 11 }}>
                              {log.previous_status}
                            </span>
                            <span style={{ color: 'var(--gold-lt)' }}>➔</span>
                          </>
                        )}
                        <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 11, color: '#10B981' }}>
                          {log.new_status}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: 11.5, color: 'var(--gray)' }}>
                      {dateObj.toLocaleDateString()} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div style={{ fontSize: 12.5, color: '#CBD5E1' }}>
                    Reason: <strong>{reasonDef?.label || log.reason_code}</strong>
                    {reasonDef?.description && (
                      <span style={{ color: 'var(--gray)', marginLeft: 6 }}>
                        ({reasonDef.description})
                      </span>
                    )}
                  </div>

                  {log.reason_notes && (
                    <div
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        borderLeft: '3px solid var(--gold)',
                        padding: '8px 12px',
                        borderRadius: '0 6px 6px 0',
                        fontSize: 12,
                        color: '#E2E8F0',
                        fontStyle: 'italic',
                      }}
                    >
                      &quot;{log.reason_notes}&quot;
                    </div>
                  )}

                  <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2, display: 'flex', gap: 12 }}>
                    <span>Actor: <strong>{log.actor_name || 'Coach'}</strong> ({log.actor_role})</span>
                    {Boolean(log.metadata?.ip) && <span>IP: {String(log.metadata?.ip)}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
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

