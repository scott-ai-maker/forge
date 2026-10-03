'use client'

import React, { useState } from 'react'
import GaaIcon, { type GaaIconName } from '@/components/ui/GaaIcon'
import {
  getToolboxById,
  SpecializedToolbox,
  ToolboxId,
} from '@/lib/specialized-toolboxes'

interface PrescribedToolboxBannerProps {
  toolboxId?: ToolboxId | null
}

export default function PrescribedToolboxBanner({
  toolboxId = 'desk_worker_posture',
}: PrescribedToolboxBannerProps) {
  const [expanded, setExpanded] = useState<boolean>(false)

  if (!toolboxId) return null

  const toolbox: SpecializedToolbox = getToolboxById(toolboxId)

  const iconNameMap: Record<ToolboxId, GaaIconName> = {
    desk_worker_posture: 'user',
    frequent_flyer_travel: 'plane',
    knee_bulletproofing: 'shield',
    lumbar_sparing_core: 'target',
    metabolic_refeed: 'nutrition',
  }

  const iconName: GaaIconName = iconNameMap[toolbox.id] || 'shield'

  return (
    <div
      className="glass-card-gold"
      style={{
        padding: '20px 24px',
        display: 'grid',
        gap: 14,
        marginBottom: 20,
        border: '1px solid var(--gold)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(212,160,23,0.15)', border: '1px solid rgba(212,160,23,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GaaIcon name={iconName} size={22} tone="gold" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: 700,
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  padding: '2px 8px',
                  background: 'rgba(197,160,89,0.2)',
                  color: 'var(--gold-lt)',
                  border: '1px solid var(--gold)',
                }}
              >
                Coach Prescription
              </span>
              <span style={{ color: 'var(--gray)', fontSize: 12 }}>
                Specialized Human Performance Protocol
              </span>
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: '0.04em',
                margin: '4px 0 0',
                color: 'var(--white)',
              }}
            >
              {toolbox.title}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="tactile-btn"
          style={{
            padding: '8px 16px',
            background: 'var(--gold)',
            border: 'none',
            color: 'var(--navy)',
            fontFamily: 'Raleway, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {expanded ? (
            <>
              <GaaIcon name="chevron-up" size={10} style={{ color: '#0A0E18', stroke: '#0A0E18' }} />
              <span>Collapse Drills</span>
            </>
          ) : (
            <>
              <GaaIcon name="chevron-down" size={10} style={{ color: '#0A0E18', stroke: '#0A0E18' }} />
              <span>Open Prescribed Drills</span>
            </>
          )}
        </button>
      </div>

      <p style={{ margin: 0, color: 'var(--gray)', fontSize: 14, lineHeight: 1.6 }}>
        {toolbox.subtitle}
      </p>

      {expanded && (
        <div style={{ display: 'grid', gap: 14, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14 }}>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {toolbox.keyDrills.map((drill, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 14px',
                  background: 'rgba(8,14,20,0.6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'grid',
                  gap: 4,
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: 13 }}>
                  {idx + 1}. {drill.name}
                </div>
                <div className="tabular-nums" style={{ fontSize: 11, color: 'var(--gold-lt)' }}>
                  Protocol: {drill.protocol}
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray)', display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                  <GaaIcon name="target" size={12} tone="gold" />
                  <span>{drill.coachingCue}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '10px 14px', background: 'rgba(197,160,89,0.12)', border: '1px solid rgba(197,160,89,0.3)', color: 'var(--gold-lt)', fontSize: 13 }}>
            <strong>Master Directive:</strong> {toolbox.executiveActionRule}
          </div>
        </div>
      )}
    </div>
  )
}

