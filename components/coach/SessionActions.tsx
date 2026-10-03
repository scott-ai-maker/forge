'use client'

import { useState } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import VoiceSoapNotesModal from '@/components/coach/VoiceSoapNotesModal'

interface SessionActionsProps {
  sessionId: string
  clientId?: string
  currentStatus: string
  currentNotes: string | null
  clientName?: string
  checkedInAt?: string | null
  checkedOutAt?: string | null
  onUpdate: () => void
}

export default function SessionActions({
  sessionId,
  clientId,
  currentStatus,
  currentNotes,
  clientName = 'Athlete',
  checkedInAt,
  checkedOutAt,
  onUpdate,
}: SessionActionsProps) {
  const [notes, setNotes] = useState(currentNotes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false)

  async function updateSession(patch: { status?: string; notes?: string; checked_in_at?: string | null; checked_out_at?: string | null }) {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/coach/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const errMsg = data.error ?? 'Update failed'
        setError(errMsg)
        throw new Error(errMsg)
      } else {
        if (patch.notes !== undefined) {
          setSavedSuccess(true)
          setTimeout(() => setSavedSuccess(false), 3000)
        }
        onUpdate()
      }
    } finally {
      setLoading(false)
    }
  }

  const canMark = currentStatus === 'scheduled'
  const canCheckIn = currentStatus === 'scheduled' && !checkedInAt
  const canCheckOut = currentStatus === 'scheduled' && Boolean(checkedInAt) && !checkedOutAt

  const btnBase: React.CSSProperties = {
    padding: '6px 12px',
    border: 'none',
    borderRadius: 2,
    fontFamily: 'Raleway, sans-serif',
    fontWeight: 600,
    fontSize: 13,
    minHeight: 40,
    cursor: loading ? 'not-allowed' : 'pointer',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {(canCheckIn || canCheckOut || canMark) && (
        <div className="coach-session-action-row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {clientId && canMark && (
            <a
              href={`/coach/clients/${clientId}/live`}
              className="tactile-btn"
              style={{
                ...btnBase,
                background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
                color: '#fff',
                border: '1px solid rgba(59, 130, 246, 0.5)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                textDecoration: 'none',
              }}
            >
              <GaaIcon name="video-studio" size={13} style={{ color: '#fff' }} />
              <span>Deliver Session ➔</span>
            </a>
          )}
          {canCheckIn && (
            <button
              onClick={() => updateSession({ checked_in_at: new Date().toISOString() })}
              disabled={loading}
              style={{ ...btnBase, background: 'rgba(74,144,226,0.85)', color: '#fff' }}
            >
              Check In
            </button>
          )}
          {canCheckOut && (
            <button
              onClick={() => updateSession({ checked_out_at: new Date().toISOString() })}
              disabled={loading}
              style={{ ...btnBase, background: 'rgba(74,144,226,0.55)', color: '#fff' }}
            >
              Check Out
            </button>
          )}
          {canMark && (
            <button
              onClick={() => updateSession({ status: 'completed' })}
              disabled={loading}
              style={{ ...btnBase, background: 'var(--success)', color: '#080E14', fontWeight: 700 }}
            >
              Mark Complete
            </button>
          )}
          {canMark && (
            <button
              onClick={() => updateSession({ status: 'no_show' })}
              disabled={loading}
              style={{ ...btnBase, background: 'transparent', color: 'var(--error)', border: '1px solid var(--error)' }}
            >
              No Show
            </button>
          )}
          {canMark && (
            <button
              onClick={() => updateSession({ status: 'cancelled' })}
              disabled={loading}
              style={{ ...btnBase, background: 'transparent', color: 'var(--gray)', border: '1px solid var(--navy-lt)' }}
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {checkedInAt && (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--gray)', fontFamily: 'Raleway, sans-serif' }}>
          Checked in: {new Date(checkedInAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          {checkedOutAt && ` · Checked out: ${new Date(checkedOutAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
        </p>
      )}

      <div
        className="coach-session-notes-box"
        style={{
          background: 'rgba(8, 14, 20, 0.6)',
          border: '1px solid var(--navy-lt)',
          borderRadius: 6,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--white)', fontFamily: 'Raleway, sans-serif' }}>
              Clinical Session Notes
            </span>
            <span
              style={{
                fontSize: 10,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: 'var(--gold)',
                background: 'rgba(212, 160, 23, 0.12)',
                padding: '1px 6px',
                borderRadius: 3,
                border: '1px solid rgba(212, 160, 23, 0.3)',
              }}
            >
              NASM S.O.A.P.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsVoiceModalOpen(true)}
            className="tactile-btn"
            style={{
              padding: '6px 12px',
              background: 'linear-gradient(135deg, rgba(212,160,23,0.2) 0%, rgba(212,160,23,0.08) 100%)',
              border: '1px solid var(--gold)',
              borderRadius: 4,
              color: 'var(--gold-lt)',
              fontFamily: 'Raleway, sans-serif',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(212,160,23,0.15)',
            }}
          >
            <GaaIcon name="mic" size={14} tone="gold" />
            <span>Voice S.O.A.P. Dictation &amp; Synthesis</span>
          </button>
        </div>

        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Type quick clinical observations or use Voice S.O.A.P. Dictation above for automated synthesis..."
          rows={3}
          style={{
            width: '100%',
            padding: '8px 10px',
            background: 'var(--navy)',
            border: '1px solid var(--navy-lt)',
            borderRadius: 4,
            color: 'var(--white)',
            fontFamily: 'Raleway, sans-serif',
            fontWeight: 300,
            fontSize: 13.5,
            lineHeight: 1.5,
            resize: 'vertical',
            outline: 'none',
            minHeight: 64,
            boxSizing: 'border-box',
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--gray)' }}>
            AI formats subjective client feedback and biomechanical observations to NASM clinical standards.
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {savedSuccess && (
              <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <GaaIcon name="check" size={13} style={{ color: 'var(--success)' }} /> Notes Saved
              </span>
            )}
            <button
              type="button"
              onClick={() => updateSession({ notes })}
              disabled={loading}
              className="tactile-btn"
              style={{
                padding: '6px 14px',
                background: savedSuccess ? 'var(--success)' : 'var(--gold)',
                color: '#080E14',
                border: 'none',
                borderRadius: 4,
                fontFamily: 'var(--font-sans, Raleway), sans-serif',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background 0.2s ease',
              }}
            >
              <GaaIcon name="check" size={13} style={{ color: '#080E14', stroke: '#080E14' }} />
              <span>{loading ? 'Saving...' : savedSuccess ? 'Saved ✓' : 'Save Notes'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: 12, color: 'var(--error)', margin: 0 }}>
          {error}
        </p>
      )}

      {isVoiceModalOpen && (
        <VoiceSoapNotesModal
          isOpen={isVoiceModalOpen}
          sessionId={sessionId}
          clientName={clientName}
          existingNotes={notes}
          onClose={() => setIsVoiceModalOpen(false)}
          onApplyNotes={async (formattedNotes) => {
            setNotes(formattedNotes)
            await updateSession({ notes: formattedNotes })
          }}
        />
      )}
    </div>
  )
}
