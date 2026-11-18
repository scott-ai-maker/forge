'use client'

import { useId, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

interface DeleteAccountSectionProps {
  userEmail: string
}

export default function DeleteAccountSection({ userEmail }: DeleteAccountSectionProps) {
  const inputId = useId()
  const [confirmText, setConfirmText] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canConfirm = confirmText.trim().toUpperCase() === 'DELETE' && !deleting

  async function handleDeleteAccount() {
    if (!canConfirm) return
    setDeleting(true)
    setError(null)

    try {
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.deleted) {
        setError(data?.error || 'Unable to delete account right now. Please try again or email scott@forge-athletic.app.')
        setDeleting(false)
        return
      }

      try {
        window.localStorage.clear()
        window.sessionStorage.clear()
      } catch {
        // ignore storage errors
      }

      try {
        const supabase = createClient()
        await supabase.auth.signOut()
      } catch {
        // ignore signOut errors since auth user is already deleted server-side
      }

      window.location.href = '/auth/login?deleted=1'
    } catch {
      setError('Network error while deleting your account. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div
      id="delete-account-section"
      style={{
        marginTop: 28,
        padding: '20px 22px',
        borderRadius: 12,
        border: '1px solid rgba(248, 113, 113, 0.35)',
        background: 'rgba(127, 29, 29, 0.14)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 620 }}>
          <span
            style={{
              fontSize: 10.5,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#FCA5A5',
              fontWeight: 800,
            }}
          >
            Permanent Data &amp; Biometric Destruction (BIPA / WA MHMDA / CCPA)
          </span>
          <h4
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 17,
              margin: '4px 0 6px',
              color: '#FFFFFF',
              letterSpacing: '0.03em',
            }}
          >
            DELETE ACCOUNT &amp; ALL HEALTH / BIOMETRIC DATA
          </h4>
          <p style={{ margin: 0, fontSize: 12.5, color: '#E2E8F0', lineHeight: 1.55 }}>
            Permanently deletes your Forge Athletic login ({userEmail}), workout logs, PAR-Q+ &amp; orthopedic records,
            33-point posture/ergonomic telemetry, private body/progress photos, voice notes, active Stripe subscriptions
            &amp; customer profile, and connected wearable OAuth links. Only pseudonymized legal waiver/arbitration defense
            hashes and statutory tax records are retained where required by law.
          </p>
        </div>

        {!expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            style={{
              minHeight: 44,
              padding: '10px 18px',
              borderRadius: 8,
              border: '1px solid rgba(248, 113, 113, 0.5)',
              background: 'rgba(239, 68, 68, 0.16)',
              color: '#FECACA',
              fontSize: 12.5,
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Delete Account…
          </button>
        )}
      </div>

      {expanded && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid rgba(248, 113, 113, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <label
            htmlFor={inputId}
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#FECACA',
              lineHeight: 1.45,
            }}
          >
            Type <code style={{ color: '#FFFFFF', fontWeight: 800 }}>DELETE</code> below to confirm permanent, irreversible deletion:
          </label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              id={inputId}
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              autoComplete="off"
              style={{
                flex: '1 1 200px',
                maxWidth: 280,
                padding: '10px 14px',
                borderRadius: 6,
                border: '1px solid rgba(248, 113, 113, 0.45)',
                background: 'rgba(8, 14, 24, 0.9)',
                color: '#FFFFFF',
                fontSize: 16,
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={!canConfirm}
              style={{
                minHeight: 44,
                padding: '10px 18px',
                borderRadius: 6,
                border: 'none',
                background: canConfirm ? '#EF4444' : 'rgba(239, 68, 68, 0.3)',
                color: '#FFFFFF',
                fontSize: 12.5,
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: canConfirm ? 'pointer' : 'not-allowed',
              }}
            >
              {deleting ? 'Deleting Account & Media…' : 'Permanently Delete My Account'}
            </button>
            <button
              type="button"
              onClick={() => {
                setExpanded(false)
                setConfirmText('')
                setError(null)
              }}
              disabled={deleting}
              style={{
                minHeight: 44,
                padding: '10px 14px',
                borderRadius: 6,
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: 'transparent',
                color: '#CBD5E1',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
          {error && (
            <p role="alert" style={{ margin: 0, fontSize: 12.5, color: '#FCA5A5' }}>
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
