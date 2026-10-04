'use client'

import { useEffect, useState } from 'react'
import { NOTIFICATION_CATEGORIES } from '@/lib/notification-catalog'

type Prefs = {
  pushEnabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
  smsPhone: string
  mutedCategories: string[]
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '12px 0',
  borderBottom: '1px solid var(--navy-lt)',
  color: '#FFFFFF',
  fontSize: 14,
}

export default function NotificationPreferencesStudio({ defaultPhone = '' }: { defaultPhone?: string }) {
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/account/notification-preferences')
      .then((res) => res.json())
      .then((data: Prefs) => {
        if (!active) return
        setPrefs({ ...data, smsPhone: data.smsPhone || defaultPhone })
        setConsent(data.smsEnabled)
      })
      .catch(() => active && setStatus({ kind: 'error', text: 'Could not load notification settings.' }))
    return () => {
      active = false
    }
  }, [defaultPhone])

  if (!prefs) return <p style={{ color: 'var(--gray)', fontSize: 14 }}>Loading notification settings…</p>

  const update = (patch: Partial<Prefs>) => setPrefs({ ...prefs, ...patch })
  const toggleCategory = (id: string) =>
    update({
      mutedCategories: prefs.mutedCategories.includes(id)
        ? prefs.mutedCategories.filter((c) => c !== id)
        : [...prefs.mutedCategories, id],
    })

  async function save() {
    if (!prefs) return
    setSaving(true)
    setStatus(null)
    try {
      const res = await fetch('/api/account/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...prefs, smsConsent: consent }),
      })
      const data = await res.json().catch(() => ({}))
      setStatus(res.ok ? { kind: 'ok', text: 'Notification settings saved.' } : { kind: 'error', text: data.error ?? 'Could not save.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h4 style={{ margin: '0 0 4px', color: '#FFFFFF', fontSize: 15 }}>How should we reach you?</h4>
      <label style={rowStyle}>
        <input type="checkbox" checked={prefs.pushEnabled} onChange={(e) => update({ pushEnabled: e.target.checked })} />
        <span>Push notifications</span>
      </label>
      <label style={rowStyle}>
        <input type="checkbox" checked={prefs.emailEnabled} onChange={(e) => update({ emailEnabled: e.target.checked })} />
        <span>Email</span>
      </label>
      <label style={rowStyle}>
        <input
          type="checkbox"
          checked={prefs.smsEnabled}
          onChange={(e) => {
            update({ smsEnabled: e.target.checked })
            if (!e.target.checked) setConsent(false)
          }}
        />
        <span>
          Text messages
          <small style={{ display: 'block', color: 'var(--gray)' }}>
            Only for time-sensitive items: your coach going live and payment problems.
          </small>
        </span>
      </label>
      {prefs.smsEnabled && (
        <div style={{ padding: '12px 0 4px 28px' }}>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Mobile number"
            value={prefs.smsPhone}
            onChange={(e) => update({ smsPhone: e.target.value })}
            style={{ width: '100%', maxWidth: 280, padding: '10px 12px', borderRadius: 8 }}
          />
          <label style={{ ...rowStyle, borderBottom: 'none', fontSize: 12, color: 'var(--gray)' }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>
              I agree to receive account text messages from Forge Athletic at this number. Message frequency varies. Msg &amp; data
              rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of purchase.
            </span>
          </label>
        </div>
      )}

      <h4 style={{ margin: '20px 0 4px', color: '#FFFFFF', fontSize: 15 }}>What should we tell you about?</h4>
      {NOTIFICATION_CATEGORIES.map((cat) => (
        <label key={cat.id} style={rowStyle}>
          <input
            type="checkbox"
            checked={!cat.mutable || !prefs.mutedCategories.includes(cat.id)}
            disabled={!cat.mutable}
            onChange={() => toggleCategory(cat.id)}
          />
          <span>
            {cat.label}
            <small style={{ display: 'block', color: 'var(--gray)' }}>{cat.description}</small>
          </span>
        </label>
      ))}

      <button type="button" onClick={save} disabled={saving} className="btn-gold" style={{ marginTop: 16 }}>
        {saving ? 'Saving…' : 'Save notification settings'}
      </button>
      {status && (
        <p role="status" style={{ marginTop: 10, fontSize: 13, color: status.kind === 'ok' ? '#6EE7B7' : '#FCA5A5' }}>
          {status.text}
        </p>
      )}
    </div>
  )
}
