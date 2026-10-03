'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  STATUS_REASONS,
  type ClientStatus,
  type StatusReasonCategory,
  type StatusReasonDefinition,
} from '@/lib/client-lifecycle'
import GaaIcon, { type GaaIconName } from '@/components/ui/GaaIcon'

interface CoachClientStatusModalProps {
  clientId: string
  clientName: string
  currentStatus: ClientStatus
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CoachClientStatusModal({
  clientId,
  clientName,
  currentStatus,
  isOpen,
  onClose,
  onSuccess,
}: CoachClientStatusModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedStatus, setSelectedStatus] = useState<ClientStatus>(() => {
    if (currentStatus === 'active') return 'paused'
    return 'active'
  })
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [reasonNotes, setReasonNotes] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  // Category mapping
  const expectedCategory: Record<ClientStatus, StatusReasonCategory> = {
    active: 'activation',
    paused: 'pause',
    inactive: 'deactivation',
    archived: 'archive',
  }

  const category = expectedCategory[selectedStatus]
  const availableReasons = Object.values(STATUS_REASONS).filter(r => r.category === category)
  const currentReasonDef = STATUS_REASONS[selectedReason] as StatusReasonDefinition | undefined

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!selectedReason) {
      setErrorMessage('Please select a structured reason code for audit logging.')
      return
    }

    if (currentReasonDef?.requiresNotes && !reasonNotes.trim()) {
      setErrorMessage('Clinical notes are required for this status change reason.')
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/coach/clients/${clientId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newStatus: selectedStatus,
            reasonCode: selectedReason,
            reasonNotes: reasonNotes.trim() || undefined,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          setErrorMessage(data.error || 'Failed to update client status')
          return
        }

        router.refresh()
        if (onSuccess) onSuccess()
        onClose()
      } catch (err: unknown) {
        const errorObj = err as { message?: string }
        setErrorMessage(errorObj?.message || 'An unexpected error occurred.')
      }
    })
  }

  const statusMeta: Record<ClientStatus, { label: string; color: string; icon: GaaIconName; impact: string }> = {
    active: {
      label: 'Active Client',
      color: '#10B981',
      icon: 'status-active',
      impact: 'Client has full access to training workouts, live session booking, weekly check-ins, and messaging.',
    },
    paused: {
      label: 'Temporary Hold / Paused',
      color: '#F59E0B',
      icon: 'status-paused',
      impact: 'Workouts & live bookings are paused. Client dashboard displays a temporary hold banner. Historical logs remain accessible.',
    },
    inactive: {
      label: 'Deactivated / Inactive',
      color: '#EF4444',
      icon: 'status-inactive',
      impact: 'Client active access is revoked. Booking and workout logging are disabled. Complete records preserved for liability & audit retention.',
    },
    archived: {
      label: 'Archived / Alumni',
      color: '#94A3B8',
      icon: 'status-archived',
      impact: 'Client account is sealed in cold-storage audit status. Used for graduated alumni or past athletes.',
    },
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100050,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 540,
          background: 'linear-gradient(135deg, #0B132B 0%, #050811 100%)',
          border: '1px solid rgba(212,160,23,0.4)',
          borderRadius: 12,
          padding: '24px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 30px rgba(212,160,23,0.15)',
          color: '#FFFFFF',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)' }}>
              Clinical & Operational Lifecycle Audit
            </div>
            <h3 style={{ margin: '4px 0 0', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 20, letterSpacing: '0.04em', color: '#FFFFFF' }}>
              Manage Client Status: {clientName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--gray)', fontSize: 22, cursor: 'pointer', padding: 4 }}
          >
            ✕
          </button>
        </div>

        {/* Current Standing Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--gray)' }}>Current Membership Standing:</span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: statusMeta[currentStatus]?.color || '#10B981',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name={statusMeta[currentStatus]?.icon || 'sparkles'} size={14} tone="inherit" />
            <span>{statusMeta[currentStatus]?.label}</span>
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Target Status Selector */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-lt)', marginBottom: 8 }}>
              1. Select New Target Status:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {(['active', 'paused', 'inactive', 'archived'] as ClientStatus[]).map(st => {
                const isSelected = selectedStatus === st
                const isCurrent = currentStatus === st
                const meta = statusMeta[st]

                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setSelectedStatus(st)
                      setSelectedReason('')
                    }}
                    className="tactile-btn"
                    style={{
                      padding: '12px 6px',
                      borderRadius: 8,
                      background: isSelected ? `${meta.color}22` : 'rgba(255,255,255,0.02)',
                      border: isSelected ? `1.5px solid ${meta.color}` : '1px solid rgba(255,255,255,0.08)',
                      color: isSelected ? meta.color : 'var(--gray)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    <GaaIcon name={meta.icon} size={18} />
                    <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'capitalize' }}>
                      {st}
                    </div>
                    {isCurrent && (
                      <span style={{ fontSize: 9, color: 'var(--gray)', display: 'block' }}>
                        (Current)
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Structured Reason Code Selector */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-lt)', marginBottom: 6 }}>
              2. Structured Audit Reason Code:
            </label>
            <select
              value={selectedReason}
              onChange={e => setSelectedReason(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#060A12',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 6,
                color: '#FFFFFF',
                fontSize: 13,
                outline: 'none',
              }}
              required
            >
              <option value="">-- Select Audit Reason Code --</option>
              {availableReasons.map(r => (
                <option key={r.code} value={r.code}>
                  {r.label} {r.requiresNotes ? '(Requires Notes)' : ''}
                </option>
              ))}
            </select>
            {currentReasonDef && (
              <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 4, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 5 }}>
                <GaaIcon name="lightning" size={11} tone="gold" />
                <span>{currentReasonDef.description}</span>
              </div>
            )}
          </div>

          {/* Clinical / Operational Notes */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-lt)' }}>
                3. Clinical / Operational Notes:
              </label>
              {currentReasonDef?.requiresNotes && (
                <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 800 }}>
                  ● Mandatory for this reason
                </span>
              )}
            </div>
            <textarea
              rows={3}
              value={reasonNotes}
              onChange={e => setReasonNotes(e.target.value)}
              placeholder="Provide context for clinical audit log (e.g. physician recommendations, expected return date, cancellation notes)..."
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#060A12',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 6,
                color: '#FFFFFF',
                fontSize: 12.5,
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>

          {/* Impact Warning Banner */}
          <div
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: `1px solid ${statusMeta[selectedStatus].color}44`,
              borderRadius: 8,
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: statusMeta[selectedStatus].color, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name="shield-check" size={12} tone="inherit" />
              <span>Studio Access Impact:</span>
            </div>
            <div style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.4 }}>
              {statusMeta[selectedStatus].impact}
            </div>
          </div>

          {errorMessage && (
            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', borderRadius: 6, padding: '10px 12px', color: '#FCA5A5', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name="alert-triangle" size={13} tone="ruby" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              className="tactile-btn"
              disabled={isPending}
              style={{
                padding: '10px 18px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 6,
                color: '#FFFFFF',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="tactile-btn"
              disabled={isPending}
              style={{
                padding: '10px 24px',
                background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                border: 'none',
                borderRadius: 6,
                color: '#000000',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(212,160,23,0.35)',
              }}
            >
              {isPending ? 'Logging Audit & Updating...' : 'Record Audit & Transition Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

