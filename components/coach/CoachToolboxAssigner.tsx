'use client'

import React, { useState } from 'react'
import {
  getAllToolboxes,
  SpecializedToolbox,
  ToolboxId,
} from '@/lib/specialized-toolboxes'
import { GaaIcon } from '@/components/ui/GaaIcon'

interface CoachToolboxAssignerProps {
  clientId: string
  clientName?: string
  initialPrescribedToolboxId?: ToolboxId | null
  onToolboxAssigned?: (toolboxId: ToolboxId) => void
}

export default function CoachToolboxAssigner({
  clientName = 'Client',
  initialPrescribedToolboxId = 'desk_worker_posture',
  onToolboxAssigned,
}: CoachToolboxAssignerProps) {
  const [selectedId, setSelectedId] = useState<ToolboxId>(initialPrescribedToolboxId ?? 'desk_worker_posture')
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false)

  const toolboxes = getAllToolboxes()
  const activeToolbox: SpecializedToolbox = toolboxes.find(t => t.id === selectedId) ?? toolboxes[0]

  const handleAssign = () => {
    if (onToolboxAssigned) {
      onToolboxAssigned(selectedId)
    }
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  return (
    <div className="glass-card" style={{ padding: '24px 28px', display: 'grid', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 700,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                padding: '4px 10px',
                background: 'rgba(197,160,89,0.15)',
                color: 'var(--gold-lt)',
                border: '1px solid rgba(197,160,89,0.4)',
              }}
            >
              Consultant Prescription Matrix
            </span>
            <span style={{ color: 'var(--gray)', fontSize: 13 }}>
              Targeted Protocol Dispatcher
            </span>
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.04em',
              margin: '6px 0 0',
              color: 'var(--white)',
            }}
          >
            Prescribe Specialized Toolbox: {clientName}
          </h3>
        </div>

        <button
          type="button"
          onClick={handleAssign}
          className="tactile-btn"
          style={{
            padding: '10px 22px',
            background: 'var(--gold)',
            border: 'none',
            color: 'var(--navy)',
            fontFamily: 'var(--font-sans, Raleway), sans-serif',
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          ✓ Assign to Client Portal
        </button>
      </div>

      {savedSuccess && (
        <div style={{ padding: '12px 16px', background: 'rgba(52,211,153,0.15)', border: '1px solid var(--success)', color: 'var(--white)', fontSize: 14 }}>
          ✓ Successfully prescribed <strong>{activeToolbox.title}</strong> to {clientName}&apos;s dashboard.
        </div>
      )}

      {/* Toolbox Grid Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
        {toolboxes.map(tb => {
          const active = selectedId === tb.id
          return (
            <button
              key={tb.id}
              type="button"
              onClick={() => setSelectedId(tb.id)}
              className="tactile-btn"
              style={{
                padding: '14px 16px',
                textAlign: 'left',
                background: active ? 'rgba(197,160,89,0.18)' : 'rgba(8,14,20,0.6)',
                border: active ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
                color: active ? 'var(--gold-lt)' : 'var(--white)',
                cursor: 'pointer',
                display: 'grid',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <GaaIcon name={(tb.icon as any) || 'sparkles'} size={18} tone={active ? 'gold' : 'slate'} />
                <span style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.03em' }}>
                  {tb.title}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--gray)', lineHeight: 1.4 }}>
                {tb.targetCondition}
              </p>
            </button>
          )
        })}
      </div>

      {/* Active Toolbox Prescription Preview Card */}
      <div className="glass-card-gold" style={{ padding: 20, display: 'grid', gap: 14 }}>
        <div>
          <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name={(activeToolbox.icon as any) || 'sparkles'} size={14} tone="gold" />
            <span>Active Prescription Details: {activeToolbox.title}</span>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--white)', fontSize: 14, lineHeight: 1.5 }}>
            {activeToolbox.subtitle}
          </p>
          <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>
            <strong>OPT™ Sports Science Objective:</strong> {activeToolbox.nasmOptFocus}
          </div>
        </div>

        {/* Drill Breakdown */}
        <div style={{ display: 'grid', gap: 10 }}>
          {activeToolbox.keyDrills.map((drill, idx) => (
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
              <div style={{ fontSize: 12, color: 'var(--gray)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <GaaIcon name="pin" size={11} tone="gold" />
                <span>{drill.coachingCue}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '10px 14px', background: 'rgba(197,160,89,0.12)', border: '1px solid rgba(197,160,89,0.3)', color: 'var(--gold-lt)', fontSize: 13 }}>
          <strong>Executive Directive:</strong> {activeToolbox.executiveActionRule}
        </div>
      </div>
    </div>
  )
}

