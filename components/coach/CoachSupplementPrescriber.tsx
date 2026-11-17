'use client'

import React, { useEffect, useId, useMemo, useState } from 'react'
import {
  ClientSex,
  FDA_DSHEA_DISCLAIMER,
  FTC_PROXIMATE_AFFILIATE_DISCLOSURE,
  getThorneGoalCollection,
  IntakePhysicianConsultAlert,
  isDispensaryAndSupplementsEnabled,
  MA_SAFE_HARBOR_SCOPE_NOTICE,
  normalizeSupplementGoal,
  SupplementGoal,
} from '@/lib/supplement-prescriptions'
import GaaIcon from '@/components/ui/GaaIcon'

interface CoachSupplementPrescriberProps {
  clientId: string
  clientName?: string
  clientAge?: number
  clientSex?: ClientSex
  onPrescribeSuccess?: () => void
}

const GOAL_OPTIONS: Array<{ value: SupplementGoal; label: string }> = [
  { value: 'hypertrophy', label: 'Strength & Lean Muscle Collection' },
  { value: 'fat_loss', label: 'Lean Composition & Satiety Collection' },
  { value: 'athletic_power', label: 'Power, Conditioning & Hydration Collection' },
  { value: 'longevity_vitality', label: 'Joint Comfort & Active Longevity Collection' },
  { value: 'general_health', label: 'Foundational Daily Wellness Collection' },
]

export default function CoachSupplementPrescriber({
  clientId,
  clientName = 'Client',
  onPrescribeSuccess,
}: CoachSupplementPrescriberProps) {
  const fieldPrefix = useId()
  const goalSelectId = `${fieldPrefix}-goal`
  const noteInputId = `${fieldPrefix}-note`

  const [goal, setGoal] = useState<SupplementGoal>('hypertrophy')
  const [customCoachNote, setCustomCoachNote] = useState('')
  const [consultAlert, setConsultAlert] = useState<IntakePhysicianConsultAlert | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [statusBanner, setStatusBanner] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadAthleteGoalAndIntake() {
      try {
        const res = await fetch(`/api/coach/clients/${encodeURIComponent(clientId)}/supplements`, {
          cache: 'no-store',
        })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        if (data?.goal) {
          setGoal(normalizeSupplementGoal(data.goal))
        }
        if (data?.physicianConsultAlert) {
          setConsultAlert(data.physicianConsultAlert as IntakePhysicianConsultAlert)
        }
      } catch {
        // Ignore transient network errors
      }
    }
    if (clientId) {
      void loadAthleteGoalAndIntake()
    }
    return () => {
      cancelled = true
    }
  }, [clientId])

  const collection = useMemo(() => getThorneGoalCollection(goal), [goal])

  async function handleShareCollectionLink() {
    if (!clientId || !isDispensaryAndSupplementsEnabled) return
    setIsSending(true)
    setStatusBanner(null)
    try {
      const res = await fetch(`/api/coach/clients/${encodeURIComponent(clientId)}/supplements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          customCoachNote: customCoachNote.trim() || undefined,
        }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatusBanner({
          tone: 'err',
          text: payload?.error || 'Could not share Thorne storefront link.',
        })
        return
      }
      setStatusBanner({
        tone: 'ok',
        text: `Shared optional ${collection.title} link to ${clientName}'s Messages with FTC & DSHEA notices.`,
      })
      setCustomCoachNote('')
      onPrescribeSuccess?.()
    } catch {
      setStatusBanner({
        tone: 'err',
        text: 'Network error while sharing Thorne storefront link.',
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section
      aria-label="Share Optional Thorne Partner Collection"
      style={{
        background: 'rgba(13, 21, 35, 0.96)',
        border: '1px solid rgba(212, 160, 23, 0.3)',
        borderRadius: 12,
        padding: 20,
        display: 'grid',
        gap: 16,
      }}
    >
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#34D399', marginBottom: 4 }}>
          Goal-Only Thorne Storefront · Custom Dosing Disabled
        </div>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, color: 'var(--white)' }}>
          Share Suggested Thorne Goal Collection with {clientName}
        </h3>
        <p style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--gray)', lineHeight: 1.55 }}>
          Individualized supplement dosing and medication overrides are disabled for scope-of-practice safety. You may share a general, stimulant-free NSF Certified for Sport® Thorne collection matched to {clientName}&apos;s training goal.
        </p>
      </div>

      {consultAlert?.requiresPhysicianConsultNotice && (
        <div
          role="note"
          style={{
            padding: '12px 14px',
            borderRadius: 8,
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1.5px solid rgba(245, 158, 11, 0.5)',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <GaaIcon name="shield" size={16} tone="amber" />
          <div style={{ fontSize: 12, lineHeight: 1.5, color: '#FDE68A' }}>
            <strong style={{ display: 'block', marginBottom: 2 }}>{consultAlert.headline}</strong>
            <span>{consultAlert.message} (Read-only from athlete intake; automatically included if shared.)</span>
          </div>
        </div>
      )}

      <fieldset
        style={{
          margin: 0,
          padding: 16,
          borderRadius: 8,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          background: 'rgba(255, 255, 255, 0.03)',
          display: 'grid',
          gap: 14,
        }}
      >
        <legend style={{ padding: '0 8px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-lt)' }}>
          Thorne Goal Collection Configuration
        </legend>

        <div style={{ display: 'grid', gap: 6 }}>
          <label htmlFor={goalSelectId} style={{ fontSize: 12, fontWeight: 700, color: 'var(--white)' }}>
            Goal Collection
          </label>
          <select
            id={goalSelectId}
            value={goal}
            onChange={e => setGoal(normalizeSupplementGoal(e.target.value))}
            style={{
              minHeight: 44,
              padding: '8px 12px',
              borderRadius: 6,
              background: '#0B1322',
              border: '1px solid rgba(212, 160, 23, 0.45)',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {GOAL_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label htmlFor={noteInputId} style={{ fontSize: 12, fontWeight: 700, color: 'var(--white)' }}>
            Optional General Whole-Food / Hydration Note (Do not enter dosages or medical advice)
          </label>
          <textarea
            id={noteInputId}
            rows={2}
            maxLength={400}
            value={customCoachNote}
            onChange={e => setCustomCoachNote(e.target.value)}
            placeholder="e.g., Prioritize whole-food protein first; review any Thorne label with your physician if needed."
            style={{
              padding: '10px 12px',
              borderRadius: 6,
              background: '#0B1322',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              color: '#FFFFFF',
              fontSize: 12.5,
              resize: 'vertical',
            }}
          />
        </div>
      </fieldset>

      {/* Collection Preview */}
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--white)' }}>
          Included in {collection.title}:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
          {collection.products.map(p => (
            <div
              key={p.id}
              style={{
                padding: 12,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.09)',
                fontSize: 12,
              }}
            >
              <strong style={{ display: 'block', color: '#FFFFFF', marginBottom: 4 }}>{p.name}</strong>
              <span style={{ display: 'block', color: '#34D399', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                {p.certificationBadge} · {p.memberDiscountPrice} (15% off)
              </span>
              <span style={{ color: 'var(--gray)', fontSize: 11.5 }}>{p.labelGuidance}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Proximate Disclosures & Send Button */}
      <div style={{ display: 'grid', gap: 10, padding: 12, borderRadius: 8, background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p style={{ margin: 0, fontSize: 11.5, color: '#CBD5E1', lineHeight: 1.5 }}>
          {FTC_PROXIMATE_AFFILIATE_DISCLOSURE} {FDA_DSHEA_DISCLAIMER} {MA_SAFE_HARBOR_SCOPE_NOTICE}
        </p>

        {statusBanner && (
          <div
            role="status"
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              background: statusBanner.tone === 'ok' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.14)',
              color: statusBanner.tone === 'ok' ? '#6EE7B7' : '#FCA5A5',
              border: `1px solid ${statusBanner.tone === 'ok' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            }}
          >
            {statusBanner.text}
          </div>
        )}

        <div>
          <button
            type="button"
            disabled={isSending || !isDispensaryAndSupplementsEnabled}
            onClick={handleShareCollectionLink}
            style={{
              minHeight: 44,
              padding: '10px 18px',
              borderRadius: 6,
              background: !isDispensaryAndSupplementsEnabled ? 'rgba(245, 158, 11, 0.15)' : 'var(--gold)',
              border: 'none',
              color: '#080E14',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: isSending || !isDispensaryAndSupplementsEnabled ? 'not-allowed' : 'pointer',
            }}
          >
            {isSending ? 'Sharing Storefront Link…' : `Share ${collection.title} Link to Messages`}
          </button>
        </div>
      </div>
    </section>
  )
}
