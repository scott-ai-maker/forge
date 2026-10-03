'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { PeriodizationAutoTriageAction } from '@/lib/coach-triage'
import GaaIcon from '@/components/ui/GaaIcon'

interface CoachClientTriageBannerProps {
  clientId: string
  clientName: string
  acwrRatio?: number | null
  acwrZone?: 'Under-training' | 'Sweet Spot' | 'Overreaching' | 'Danger Zone' | 'No Data'
  readinessScore?: number | null
  suggestedAction: PeriodizationAutoTriageAction
  suggestedLabel?: string
  primaryReason: string
}

export default function CoachClientTriageBanner({
  clientId,
  clientName,
  acwrRatio,
  acwrZone,
  readinessScore,
  suggestedAction,
  suggestedLabel,
  primaryReason,
}: CoachClientTriageBannerProps) {
  const [isExecuting, setIsExecuting] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isDismissed, setIsDismissed] = useState<boolean>(false)

  if (isDismissed) return null
  if ((!acwrZone || acwrZone === 'Sweet Spot' || acwrZone === 'No Data') && !suggestedAction) return null

  const isDanger = acwrZone === 'Danger Zone' || (typeof readinessScore === 'number' && readinessScore < 50)
  const isOverreaching = acwrZone === 'Overreaching' || (typeof readinessScore === 'number' && readinessScore < 70)

  const bannerBorder = isDanger ? 'rgba(239, 68, 68, 0.5)' : isOverreaching ? 'rgba(212, 160, 23, 0.5)' : 'rgba(52, 211, 153, 0.5)'
  const bannerBg = isDanger ? 'rgba(239, 68, 68, 0.08)' : isOverreaching ? 'rgba(212, 160, 23, 0.08)' : 'rgba(52, 211, 153, 0.08)'
  const badgeBg = isDanger ? 'rgba(239, 68, 68, 0.2)' : isOverreaching ? 'rgba(212, 160, 23, 0.2)' : 'rgba(52, 211, 153, 0.2)'
  const badgeColor = isDanger ? '#F87171' : isOverreaching ? 'var(--gold-lt)' : '#34D399'

  const handleExecute = async () => {
    if (!suggestedAction) return
    setIsExecuting(true)
    try {
      const res = await fetch(`/api/coach/clients/${clientId}/periodization/auto-triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: suggestedAction }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setSuccessMessage(data.message || `Auto-triage calibrated for ${clientName}. Client notified via concierge.`)
      } else {
        alert(data.error || 'Failed to execute auto-triage action')
      }
    } catch {
      alert('Network error executing auto-triage')
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div
      style={{
        padding: '16px 20px',
        marginBottom: 20,
        background: bannerBg,
        border: `1px solid ${bannerBorder}`,
        borderRadius: 8,
        display: 'grid',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <GaaIcon name={isDanger ? 'status-inactive' : isOverreaching ? 'status-paused' : 'heart-rate'} tone={isDanger ? 'ruby' : isOverreaching ? 'amber' : 'emerald'} size={16} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 8px',
              background: badgeBg,
              color: badgeColor,
              border: `1px solid ${badgeColor}`,
              borderRadius: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            ACWR {typeof acwrRatio === 'number' ? acwrRatio.toFixed(2) : '--'} · {acwrZone}
          </span>
          <span style={{ fontSize: 12, color: 'var(--gray)' }}>
            Readiness: <strong style={{ color: '#FFFFFF' }}>{typeof readinessScore === 'number' ? `${readinessScore}%` : '--'}</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          style={{ background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          <GaaIcon name="close" size={12} tone="slate" />
          <span>Dismiss</span>
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <p style={{ margin: 0, color: '#FFFFFF', fontSize: 13.5, lineHeight: 1.5, fontWeight: 500 }}>
            {primaryReason}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {suggestedAction && !successMessage && (
            <button
              type="button"
              disabled={isExecuting}
              onClick={handleExecute}
              className="sgf-button sgf-button-gold"
              style={{ padding: '8px 16px', fontSize: 12.5, fontWeight: 700 }}
            >
              {isExecuting ? 'Calibrating...' : suggestedLabel || 'Execute Auto-Triage'}
            </button>
          )}

          <Link
            href={`/coach/clients/${clientId}?tab=periodization`}
            className="sgf-button sgf-button-secondary"
            style={{ padding: '8px 14px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <GaaIcon name="periodization" size={14} tone="gold" />
            <span>Open Periodization Architect</span>
            <GaaIcon name="arrow-right" size={11} tone="gold" />
          </Link>
        </div>
      </div>

      {successMessage && (
        <div
          style={{
            marginTop: 4,
            padding: '10px 14px',
            background: 'rgba(52,211,153,0.15)',
            border: '1px solid #34d399',
            borderRadius: 6,
            color: '#34d399',
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          ✓ {successMessage}
        </div>
      )}
    </div>
  )
}
