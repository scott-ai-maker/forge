'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SessionActions from '@/components/coach/SessionActions'
import CoachScheduleSessionModal from '@/components/coach/CoachScheduleSessionModal'
import GaaIcon from '@/components/ui/GaaIcon'

interface Session {
  id: string
  scheduled_at: string
  status: string
  notes: string | null
  duration_mins: number
  checked_in_at?: string | null
  checked_out_at?: string | null
}

interface PackageItem {
  id: string
  package_name: string
  sessions_remaining: number
  sessions_total?: number
}

interface ClientDetailClientProps {
  clientId?: string
  sessions: Session[]
  clientName?: string
  packages?: PackageItem[]
}

export default function ClientDetailClient({ clientId, sessions, clientName = 'Athlete', packages = [] }: ClientDetailClientProps) {
  const router = useRouter()
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [confirmWaiveOpen, setConfirmWaiveOpen] = useState(false)
  const [waivingConsult, setWaivingConsult] = useState(false)
  const [waiverError, setWaiverError] = useState<string | null>(null)

  function handleUpdate() {
    router.refresh()
  }

  async function executeWaiveConsult() {
    if (!clientId) return

    setWaivingConsult(true)
    setWaiverError(null)
    try {
      const res = await fetch(`/api/coach/clients/${clientId}/waive-consult`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to waive consultation')
      }
      router.refresh()
    } catch (err: unknown) {
      const errObj = err as { message?: string }
      setWaiverError(errObj?.message || 'Failed to waive consultation')
    } finally {
      setWaivingConsult(false)
    }
  }

  function statusBadge(status: string) {
    const colors: Record<string, { bg: string; color: string }> = {
      scheduled: { bg: 'rgba(212,160,23,0.15)', color: 'var(--gold)' },
      completed: { bg: 'rgba(72,187,120,0.15)', color: 'var(--success)' },
      cancelled: { bg: 'rgba(138,153,170,0.15)', color: 'var(--gray)' },
      no_show: { bg: 'rgba(255,61,87,0.15)', color: 'var(--error)' },
    }
    const style = colors[status] ?? colors.scheduled
    return (
      <span
        style={{
          fontFamily: 'Raleway, sans-serif',
          fontWeight: 600,
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '3px 8px',
          borderRadius: 2,
          background: style.bg,
          color: style.color,
        }}
      >
        {status.replace('_', ' ')}
      </span>
    )
  }

  const hasCompletedSession = sessions.some(s => s.status === 'completed')
  const isConsultWaived = sessions.some(s =>
    s.notes?.toLowerCase().includes('waived') ||
    s.notes?.toLowerCase().includes('opted out') ||
    s.notes?.toLowerCase().includes('skip consult') ||
    s.notes?.toLowerCase().includes('client does not want') ||
    s.notes?.toLowerCase().includes('async delivery')
  )

  if (sessions.length === 0) {
    return (
      <div
        style={{
          background: 'var(--navy-mid)',
          border: '1px solid var(--navy-lt)',
          padding: '36px 24px',
          textAlign: 'center',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: 'rgba(212,160,23,0.12)',
            border: '1px solid rgba(212,160,23,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(212,160,23,0.15)',
          }}
        >
          <GaaIcon name="calendar" size={24} tone="gold" />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, fontWeight: 700, color: 'var(--white)', letterSpacing: '0.04em' }}>
            NO SESSIONS SCHEDULED YET
          </div>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: 13.5, color: 'var(--gray)', margin: '4px auto 0', maxWidth: 420 }}>
            Schedule a 1:1 movement screen, kinetic chain audit, or telehealth consultation with {clientName}.
          </p>
        </div>

        {clientId && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => setScheduleModalOpen(true)}
              style={{
                padding: '9px 20px',
                background: 'var(--gold)',
                color: '#080E14',
                borderRadius: 4,
                fontSize: 11,
                fontFamily: 'var(--font-sans, Raleway), sans-serif',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="calendar" size={15} tone="slate" />
              <span>+ Schedule Consultation</span>
            </button>
            <button
              type="button"
              onClick={() => setConfirmWaiveOpen(true)}
              disabled={waivingConsult}
              className="tactile-btn"
              style={{
                padding: '9px 20px',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--gold-lt)',
                borderRadius: 4,
                fontSize: 11,
                fontFamily: 'var(--font-sans, Raleway), sans-serif',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                border: '1px solid rgba(212, 160, 23, 0.4)',
                cursor: waivingConsult ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="check" size={15} tone="gold" />
              <span>{waivingConsult ? 'Waiving Consult...' : 'Skip Consult (Client Opted Out) ➔'}</span>
            </button>
          </div>
        )}

        {waiverError && (
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: 12, color: 'var(--error)', margin: '4px 0 0' }}>
            {waiverError}
          </p>
        )}

        {clientId && (
          <CoachScheduleSessionModal
            isOpen={scheduleModalOpen}
            onClose={() => setScheduleModalOpen(false)}
            clientId={clientId}
            clientName={clientName}
            packages={packages}
            onSuccess={handleUpdate}
          />
        )}

        {/* Luxury In-HUD Waive Confirmation Modal */}
        {confirmWaiveOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2, 5, 11, 0.85)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100050,
              padding: 16,
            }}
          >
            <div
              style={{
                background: '#070C16',
                border: '1px solid rgba(212, 160, 23, 0.4)',
                borderRadius: 12,
                maxWidth: 460,
                width: '100%',
                padding: '24px 28px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: 'rgba(212,160,23,0.15)',
                    border: '1px solid rgba(212,160,23,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <GaaIcon name="check" size={16} tone="gold" />
                </div>
                <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.04em' }}>
                  WAIVE LIVE CONSULTATION?
                </div>
              </div>

              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: 13.5, color: 'var(--gray)', lineHeight: 1.5, margin: '0 0 20px' }}>
                Waive live consultation for <strong style={{ color: '#FFFFFF' }}>{clientName}</strong>? This fast-tracks the athlete directly to <strong style={{ color: 'var(--gold-lt)' }}>Stage 8 (Telemetry Monitoring & Weekly Triage)</strong> for asynchronous program delivery.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setConfirmWaiveOpen(false)}
                  disabled={waivingConsult}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 4,
                    color: 'var(--gray-lt)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await executeWaiveConsult()
                    setConfirmWaiveOpen(false)
                  }}
                  disabled={waivingConsult}
                  style={{
                    padding: '8px 18px',
                    background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                    border: 'none',
                    borderRadius: 4,
                    color: '#080E14',
                    fontSize: 12,
                    fontWeight: 800,
                    fontFamily: 'Raleway, sans-serif',
                    cursor: waivingConsult ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(197,160,89,0.35)',
                  }}
                >
                  {waivingConsult ? 'Waiving...' : 'Confirm & Fast-Track ➔'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--white)' }}>
            Coaching Appointments &amp; History
          </span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 10.5,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: hasCompletedSession ? 'rgba(16, 185, 129, 0.15)' : 'rgba(212, 160, 23, 0.15)',
              color: hasCompletedSession ? '#34D399' : 'var(--gold-lt)',
              border: `1px solid ${hasCompletedSession ? 'rgba(16, 185, 129, 0.3)' : 'rgba(212, 160, 23, 0.3)'}`,
            }}
          >
            {hasCompletedSession
              ? (isConsultWaived ? '✓ Consult Waived (Async)' : '✓ Kickoff Delivered')
              : 'Live Kickoff Pending'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {clientId && (
            <button
              type="button"
              onClick={() => setScheduleModalOpen(true)}
              className="tactile-btn"
              style={{
                padding: '7px 15px',
                background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                color: '#080E14',
                borderRadius: 4,
                fontSize: 11,
                fontFamily: 'var(--font-sans, Raleway), sans-serif',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 800,
              }}
            >
              <GaaIcon name="calendar" size={14} tone="slate" />
              <span>+ Schedule Session</span>
            </button>
          )}

          {!hasCompletedSession && clientId && (
            <button
              type="button"
              onClick={() => setConfirmWaiveOpen(true)}
              disabled={waivingConsult}
              style={{
                padding: '7px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--gray-lt)',
                borderRadius: 4,
                fontSize: 11.5,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                cursor: waivingConsult ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
              title="Waive consultation if athlete prefers async program delivery"
            >
              <GaaIcon name="check" size={12} />
              <span>{waivingConsult ? 'Waiving...' : 'Skip / Async Delivery'}</span>
            </button>
          )}
        </div>
      </div>

      {waiverError && (
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: 12, color: 'var(--error)', margin: 0 }}>
          {waiverError}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'rgba(255,255,255,0.06)' }}>
      {sessions.map(session => (
        <div
          key={session.id}
          className="coach-session-card"
          style={{
            background: 'var(--navy-mid)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div
            className="coach-session-card-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: 600,
                  fontSize: 15,
                  color: 'var(--white)',
                }}
              >
                {new Date(session.scheduled_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
              <div
                style={{
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: 13,
                  color: 'var(--gray)',
                  marginTop: 2,
                  overflowWrap: 'anywhere',
                }}
              >
                {new Date(session.scheduled_at).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZoneName: 'short',
                })}{' '}
                · {session.duration_mins} min
              </div>
            </div>
            {statusBadge(session.status)}
          </div>

          <SessionActions
            sessionId={session.id}
            clientId={clientId}
            currentStatus={session.status}
            currentNotes={session.notes}
            clientName={clientName}
            checkedInAt={session.checked_in_at}
            checkedOutAt={session.checked_out_at}
            onUpdate={handleUpdate}
          />
        </div>
      ))}
      </div>

      {/* Luxury In-HUD Waive Confirmation Modal */}
      {confirmWaiveOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 5, 11, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100050,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#070C16',
              border: '1px solid rgba(212, 160, 23, 0.4)',
              borderRadius: 12,
              maxWidth: 460,
              width: '100%',
              padding: '24px 28px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: 'rgba(212,160,23,0.15)',
                  border: '1px solid rgba(212,160,23,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GaaIcon name="check" size={16} tone="gold" />
              </div>
              <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.04em' }}>
                WAIVE LIVE CONSULTATION?
              </div>
            </div>

            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: 13.5, color: 'var(--gray)', lineHeight: 1.5, margin: '0 0 20px' }}>
              Waive live consultation for <strong style={{ color: '#FFFFFF' }}>{clientName}</strong>? This fast-tracks the athlete directly to <strong style={{ color: 'var(--gold-lt)' }}>Stage 8 (Telemetry Monitoring & Weekly Triage)</strong> for asynchronous program delivery.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setConfirmWaiveOpen(false)}
                disabled={waivingConsult}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 4,
                  color: 'var(--gray-lt)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={async () => {
                  await executeWaiveConsult()
                  setConfirmWaiveOpen(false)
                }}
                disabled={waivingConsult}
                style={{
                  padding: '8px 18px',
                  background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                  border: 'none',
                  borderRadius: 4,
                  color: '#080E14',
                  fontSize: 12,
                  fontWeight: 800,
                  fontFamily: 'Raleway, sans-serif',
                  cursor: waivingConsult ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(197,160,89,0.35)',
                }}
              >
                {waivingConsult ? 'Waiving...' : 'Confirm & Fast-Track ➔'}
              </button>
            </div>
          </div>
        </div>
      )}

      {clientId && (
        <CoachScheduleSessionModal
          isOpen={scheduleModalOpen}
          onClose={() => setScheduleModalOpen(false)}
          clientId={clientId}
          clientName={clientName}
          packages={packages}
          onSuccess={handleUpdate}
        />
      )}
    </div>
  )
}
