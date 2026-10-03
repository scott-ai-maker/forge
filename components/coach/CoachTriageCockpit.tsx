'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  ClientTriageSummary,
  PeriodizationAutoTriageAction,
  sortTriageQueue,
} from '@/lib/coach-triage'
import { generateConsultantMemo } from '@/lib/coach-consultant-memo'
import { GaaIcon } from '@/components/ui/GaaIcon'

interface CoachTriageCockpitProps {
  initialClients: ClientTriageSummary[]
  onOpenConsultantMemo?: (clientId: string) => void
}

export default function CoachTriageCockpit({
  initialClients,
  onOpenConsultantMemo,
}: CoachTriageCockpitProps) {
  const [isHydrated, setIsHydrated] = useState(false)
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const [filterPriority, setFilterPriority] = useState<'all' | 'red' | 'amber' | 'green' | 'fatigue_triage'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedDetailsClientId, setExpandedDetailsClientId] = useState<string | null>(null)
  const [executingClientId, setExecutingClientId] = useState<string | null>(null)
  const [actionSuccessFeedback, setActionSuccessFeedback] = useState<Record<string, string>>({})
  const [activeMemoClient, setActiveMemoClient] = useState<ClientTriageSummary | null>(null)
  const [memoCustomNote, setMemoCustomNote] = useState('')
  const [generatedMemoText, setGeneratedMemoText] = useState('')
  const [isDispatchingMemo, setIsDispatchingMemo] = useState(false)

  const sorted = useMemo(() => sortTriageQueue(initialClients), [initialClients])

  const redCount = sorted.filter(c => c.priority === 'red').length
  const amberCount = sorted.filter(c => c.priority === 'amber').length
  const greenCount = sorted.filter(c => c.priority === 'green').length
  const fatigueTriageCount = sorted.filter(
    c => c.daysSinceLastCheckin <= 2 || (typeof c.readinessScore === 'number' && c.readinessScore > 0 && c.readinessScore < 60) || c.hasReportedPain || c.acwrZone === 'Danger Zone'
  ).length

  const filteredClients = useMemo(() => {
    return sorted.filter(c => {
      const matchesPriority =
        filterPriority === 'all'
          ? true
          : filterPriority === 'fatigue_triage'
            ? (c.daysSinceLastCheckin <= 2 || (typeof c.readinessScore === 'number' && c.readinessScore > 0 && c.readinessScore < 60) || c.hasReportedPain || c.acwrZone === 'Danger Zone')
            : c.priority === filterPriority
      if (!matchesPriority) return false

      const query = searchQuery.trim().toLowerCase()
      if (!query) return true

      return (
        c.clientName.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.primaryReason.toLowerCase().includes(query) ||
        c.recommendedAction.toLowerCase().includes(query) ||
        (c.suggestedActionLabel && c.suggestedActionLabel.toLowerCase().includes(query)) ||
        (c.acwrZone && c.acwrZone.toLowerCase().includes(query))
      )
    })
  }, [sorted, filterPriority, searchQuery])

  const handleDispatchConsultantMemo = async () => {
    if (!activeMemoClient) return
    setIsDispatchingMemo(true)
    try {
      const textToDispatch = generatedMemoText || generateConsultantMemo({
        clientName: activeMemoClient.clientName,
        optPhase: activeMemoClient.currentOptPhase || 1,
        totalSetsLogged: Math.round(((activeMemoClient.adherencePercent || 80) / 100) * 36),
        targetSetsPlanned: 36,
        avgReadiness: activeMemoClient.readinessScore || 80,
        cexStreakDays: 5,
        coachCustomNotes: memoCustomNote.trim() || undefined,
      }).fullMemoMarkdown

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: activeMemoClient.clientId,
          message_body: textToDispatch,
        }),
      })
      if (res.ok) {
        setActionSuccessFeedback(prev => ({
          ...prev,
          [activeMemoClient.clientId]: `✓ Executive Memo dispatched to ${activeMemoClient.clientName}'s app inbox!`,
        }))
        setActiveMemoClient(null)
        setGeneratedMemoText('')
        setMemoCustomNote('')
      } else {
        alert('Failed to dispatch memo to athlete messages.')
      }
    } catch {
      alert('Network error dispatching consultant memo.')
    } finally {
      setIsDispatchingMemo(false)
    }
  }

  const handleExecuteAutoTriage = async (
    clientId: string,
    action: PeriodizationAutoTriageAction,
    clientName: string
  ) => {
    if (!action) return
    setExecutingClientId(clientId)
    try {
      const res = await fetch(`/api/coach/clients/${clientId}/periodization/auto-triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setActionSuccessFeedback(prev => ({
          ...prev,
          [clientId]: data.message || `Auto-triage calibrated for ${clientName}`,
        }))
      } else {
        alert(data.error || 'Failed to execute auto-triage action')
      }
    } catch {
      alert('Network error executing auto-triage')
    } finally {
      setExecutingClientId(null)
    }
  }

  const [selectedDirectiveClientId, setSelectedDirectiveClientId] = useState<string | null>(null)
  const [customDirectiveText, setCustomDirectiveText] = useState('')
  const [isSendingDirective, setIsSendingDirective] = useState(false)

  const handleSendCoachDirective = async (clientId: string, clientName: string) => {
    if (!customDirectiveText.trim()) return
    setIsSendingDirective(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          message_body: `Coach Scott Gordon Direct Directive: ${customDirectiveText.trim()}`,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setActionSuccessFeedback(prev => ({
          ...prev,
          [clientId]: `✓ Directive dispatched to ${clientName}'s app inbox!`,
        }))
        setCustomDirectiveText('')
        setSelectedDirectiveClientId(null)
      } else {
        alert(data.error || 'Failed to dispatch directive')
      }
    } catch {
      alert('Network error dispatching directive')
    } finally {
      setIsSendingDirective(false)
    }
  }

  return (
    <div data-testid="coach-triage-cockpit" data-hydrated={isHydrated ? "true" : "false"} style={{ display: 'grid', gap: 18 }}>
      {/* Cockpit Header */}
      <div className="glass-card" style={{ padding: 'clamp(14px, 3vw, 22px)' }}>
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
                  borderRadius: 4,
                }}
              >
                Executive Consultant Cockpit
              </span>
              <span style={{ color: 'var(--gray)', fontSize: 13 }}>
                High-Leverage Multi-Client Triage Queue & ACWR Auto-Triage
              </span>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontWeight: 700,
                fontSize: 24,
                letterSpacing: '0.04em',
                margin: '6px 0 0',
                color: 'var(--white)',
              }}
            >
              Master Coach Daily Triage Cockpit
            </h2>
          </div>
        </div>
        <p style={{ margin: '8px 0 0', color: 'var(--gray)', fontSize: 13, lineHeight: 1.5, maxWidth: 780 }}>
          Synthesizes ACWR workload danger spikes, readiness telemetry, joint compensation flags, and pending critiques into instant 1-click clinical interventions.
        </p>
      </div>

      {/* 4 Triage Metric Pill Cards */}
      <div className="coach-triage-pills-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 12 }}>
        <button
          type="button"
          onClick={() => setFilterPriority(filterPriority === 'red' ? 'all' : 'red')}
          className="tactile-btn tabular-nums coach-triage-pill"
          style={{
            padding: '16px 20px',
            textAlign: 'left',
            background: filterPriority === 'red' ? 'rgba(248,113,113,0.2)' : 'rgba(8,14,20,0.6)',
            border: filterPriority === 'red' ? '2px solid var(--error)' : '1px solid rgba(248,113,113,0.3)',
            cursor: 'pointer',
            display: 'grid',
            gap: 2,
            borderRadius: 8,
          }}
        >
          <div style={{ color: 'var(--error)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="status-inactive" size={12} tone="ruby" />
            <span>Urgent Action</span>
          </div>
          <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 32, color: 'var(--white)', lineHeight: 1 }}>
            {redCount} <span style={{ fontSize: 13, fontFamily: 'Raleway, sans-serif', fontWeight: 600, color: 'var(--gray)' }}>Clients</span>
          </div>
          <div className="coach-triage-pill-hint" style={{ fontSize: 11, color: 'var(--gray)' }}>ACWR &gt; 1.50, pain flags, high fatigue</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterPriority(filterPriority === 'fatigue_triage' ? 'all' : 'fatigue_triage')}
          className="tactile-btn tabular-nums coach-triage-pill"
          style={{
            padding: '16px 20px',
            textAlign: 'left',
            background: filterPriority === 'fatigue_triage' ? 'rgba(251,191,36,0.2)' : 'rgba(8,14,20,0.6)',
            border: filterPriority === 'fatigue_triage' ? '2px solid #f59e0b' : '1px solid rgba(251,191,36,0.35)',
            cursor: 'pointer',
            display: 'grid',
            gap: 2,
            borderRadius: 8,
          }}
        >
          <div style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="activity" size={12} tone="amber" />
            <span>Sunday Triage / Fatigue</span>
          </div>
          <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 32, color: 'var(--white)', lineHeight: 1 }}>
            {fatigueTriageCount} <span style={{ fontSize: 13, fontFamily: 'Raleway, sans-serif', fontWeight: 600, color: 'var(--gray)' }}>Clients</span>
          </div>
          <div className="coach-triage-pill-hint" style={{ fontSize: 11, color: 'var(--gray)' }}>Check-in &le;48h, CNS &lt;60%, acute soreness</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterPriority(filterPriority === 'amber' ? 'all' : 'amber')}
          className="tactile-btn tabular-nums coach-triage-pill"
          style={{
            padding: '16px 20px',
            textAlign: 'left',
            background: filterPriority === 'amber' ? 'rgba(197,160,89,0.2)' : 'rgba(8,14,20,0.6)',
            border: filterPriority === 'amber' ? '2px solid var(--gold)' : '1px solid rgba(197,160,89,0.3)',
            cursor: 'pointer',
            display: 'grid',
            gap: 2,
            borderRadius: 8,
          }}
        >
          <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="status-paused" size={12} tone="amber" />
            <span>Attention</span>
          </div>
          <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 32, color: 'var(--white)', lineHeight: 1 }}>
            {amberCount} <span style={{ fontSize: 13, fontFamily: 'Raleway, sans-serif', fontWeight: 600, color: 'var(--gray)' }}>Clients</span>
          </div>
          <div className="coach-triage-pill-hint" style={{ fontSize: 11, color: 'var(--gray)' }}>Overreaching, pending video critique</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterPriority(filterPriority === 'green' ? 'all' : 'green')}
          className="tactile-btn tabular-nums coach-triage-pill"
          style={{
            padding: '16px 20px',
            textAlign: 'left',
            background: filterPriority === 'green' ? 'rgba(52,211,153,0.2)' : 'rgba(8,14,20,0.6)',
            border: filterPriority === 'green' ? '2px solid var(--success)' : '1px solid rgba(52,211,153,0.3)',
            cursor: 'pointer',
            display: 'grid',
            gap: 2,
            borderRadius: 8,
          }}
        >
          <div style={{ color: 'var(--success)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="status-active" size={12} tone="emerald" />
            <span>Autonomous / Accelerated</span>
          </div>
          <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 32, color: 'var(--white)', lineHeight: 1 }}>
            {greenCount} <span style={{ fontSize: 13, fontFamily: 'Raleway, sans-serif', fontWeight: 600, color: 'var(--gray)' }}>Clients</span>
          </div>
          <div className="coach-triage-pill-hint" style={{ fontSize: 11, color: 'var(--gray)' }}>&gt;90% compliance, hitting PRs</div>
        </button>
      </div>

      {/* Triage Queue List */}
      <div className="glass-card" style={{ padding: 20, display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 18, color: 'var(--white)', letterSpacing: '0.04em' }}>
              Active Action Queue ({filteredClients.length} of {sorted.length} Clients)
            </h3>
            <span style={{ fontSize: 11, color: 'var(--gray)', fontFamily: 'Raleway, sans-serif' }}>
              Ordered by Clinical Priority: Red Danger Spikes → Amber Attention → Green Autonomous
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search athlete or trigger (e.g. Deload, Pain)..."
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                fontFamily: 'Raleway, sans-serif',
                fontSize: 12,
                outline: 'none',
                minWidth: 220,
              }}
            />

            {(filterPriority !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setFilterPriority('all')
                  setSearchQuery('')
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--gold-lt)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {filteredClients.map((client) => {
            const isRed = client.priority === 'red'
            const isAmber = client.priority === 'amber'
            const badgeColor = isRed ? 'var(--error)' : isAmber ? 'var(--gold-lt)' : 'var(--success)'
            const badgeBg = isRed ? 'rgba(248,113,113,0.15)' : isAmber ? 'rgba(197,160,89,0.15)' : 'rgba(52,211,153,0.15)'
            const isExecuting = executingClientId === client.clientId
            const successMsg = actionSuccessFeedback[client.clientId]

            return (
              <div
                key={client.clientId}
                style={{
                  padding: '18px 20px',
                  background: 'rgba(14,23,36,0.7)',
                  border: `1px solid ${isRed ? 'rgba(248,113,113,0.4)' : isAmber ? 'rgba(197,160,89,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 8,
                  display: 'grid',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--white)' }}>
                        {client.clientName}
                      </span>
                      <span
                        style={{
                          padding: '2px 8px',
                          background: badgeBg,
                          border: `1px solid ${badgeColor}`,
                          color: badgeColor,
                          fontFamily: 'Raleway, sans-serif',
                          fontWeight: 700,
                          fontSize: 10,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          borderRadius: 4,
                        }}
                      >
                        {client.priority.toUpperCase()} PRIORITY
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--gray)' }}>
                        OPT Phase {client.currentOptPhase}
                      </span>

                      {/* ACWR Telemetry Badge */}
                      {client.acwrRatio !== undefined && client.acwrRatio !== null ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 8px',
                            background:
                              client.acwrZone === 'Danger Zone'
                                ? 'rgba(239,68,68,0.2)'
                                : client.acwrZone === 'Overreaching'
                                ? 'rgba(212,160,23,0.2)'
                                : 'rgba(52,211,153,0.15)',
                            border:
                              client.acwrZone === 'Danger Zone'
                                ? '1px solid #ef4444'
                                : client.acwrZone === 'Overreaching'
                                ? '1px solid var(--gold)'
                                : '1px solid #34d399',
                            color:
                              client.acwrZone === 'Danger Zone'
                                ? '#f87171'
                                : client.acwrZone === 'Overreaching'
                                ? 'var(--gold-lt)'
                                : '#34d399',
                            borderRadius: 4,
                          }}
                        >
                          ACWR: {client.acwrRatio.toFixed(2)} ({client.acwrZone})
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 8px',
                            background: 'rgba(148,163,184,0.12)',
                            border: '1px solid rgba(148,163,184,0.3)',
                            color: '#94A3B8',
                            borderRadius: 4,
                          }}
                        >
                          ACWR: No Data
                        </span>
                      )}
                    </div>

                    <p style={{ margin: '6px 0 0', color: isRed ? '#ff8787' : 'var(--gray)', fontSize: 13, lineHeight: 1.4 }}>
                      {client.primaryReason}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 12, color: 'var(--gold-lt)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <GaaIcon name="pin" size={11} tone="gold" />
                        <span>Action: {client.recommendedAction}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedDetailsClientId(expandedDetailsClientId === client.clientId ? null : client.clientId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#94A3B8',
                          fontSize: 11,
                          fontFamily: 'Raleway, sans-serif',
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'underline',
                          textUnderlineOffset: 2,
                        }}
                      >
                        {expandedDetailsClientId === client.clientId ? '▲ Hide Workload Telemetry' : '▼ Workload Telemetry & Flags'}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <div className="tabular-nums" style={{ textAlign: 'right', fontSize: 12 }}>
                      <div style={{ color: 'var(--white)' }}>
                        <strong>{client.readinessScore}%</strong> Readiness
                      </div>
                      <div style={{ color: 'var(--gray)' }}>
                        {client.adherencePercent}% Adherence
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {/* 1-Click Auto-Triage Periodization Action Button */}
                      {client.suggestedPeriodizationAction && !successMsg && (
                        <button
                          type="button"
                          disabled={isExecuting}
                          onClick={() =>
                            handleExecuteAutoTriage(
                              client.clientId,
                              client.suggestedPeriodizationAction!,
                              client.clientName
                            )
                          }
                          className="sgf-button sgf-button-gold"
                          style={{
                            padding: '8px 14px',
                            fontSize: 12,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <GaaIcon name="lightning" size={13} tone="inherit" />
                          <span>{isExecuting ? 'Calibrating...' : client.suggestedActionLabel || '1-Click Calibrate'}</span>
                        </button>
                      )}

                      {successMsg && (
                        <span
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(52,211,153,0.15)',
                            border: '1px solid #34d399',
                            color: '#34d399',
                            fontSize: 11,
                            fontWeight: 700,
                            borderRadius: 4,
                          }}
                        >
                          ✓ Synced with Athlete
                        </span>
                      )}

                      {/* 1-Tap Quick Executive Consultant Memo Launcher */}
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenConsultantMemo) {
                            onOpenConsultantMemo(client.clientId)
                          } else {
                            setActiveMemoClient(client)
                            const initial = generateConsultantMemo({
                              clientName: client.clientName,
                              optPhase: client.currentOptPhase || 1,
                              totalSetsLogged: Math.round(((client.adherencePercent || 80) / 100) * 36),
                              targetSetsPlanned: 36,
                              avgReadiness: client.readinessScore || 80,
                              cexStreakDays: 5,
                            })
                            setGeneratedMemoText(initial.fullMemoMarkdown)
                          }
                        }}
                        className="tactile-btn"
                        style={{
                          padding: '8px 14px',
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: 'var(--white)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          borderRadius: 4,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                        title={`Synthesize & Dispatch Executive Memo for ${client.clientName}`}
                      >
                        <GaaIcon name="mic" size={13} tone="gold" />
                        <span>Memo</span>
                      </button>

                      {/* 1-Tap Quick Voice Directive / Message Dispatch to Athlete */}
                      <button
                        type="button"
                        onClick={() => setSelectedDirectiveClientId(selectedDirectiveClientId === client.clientId ? null : client.clientId)}
                        className="tactile-btn"
                        style={{
                          padding: '8px 14px',
                          background: selectedDirectiveClientId === client.clientId ? 'rgba(212,160,23,0.3)' : 'rgba(212,160,23,0.12)',
                          border: '1px solid rgba(212,160,23,0.4)',
                          color: 'var(--gold-lt, #fef08a)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <GaaIcon name="lightning" size={12} tone="gold" />
                        <span>Directive</span>
                      </button>

                      {/* 1-Click Launch Live Diagnostic Consultation Studio */}
                      <Link
                        href={`/coach/clients/${client.clientId}/live`}
                        className="tactile-btn"
                        style={{
                          padding: '8px 14px',
                          background: 'linear-gradient(135deg, rgba(197,160,89,0.2) 0%, rgba(197,160,89,0.06) 100%)',
                          border: '1px solid rgba(197,160,89,0.45)',
                          color: 'var(--gold-lt)',
                          fontFamily: 'Raleway, sans-serif',
                          fontSize: 12,
                          fontWeight: 700,
                          textDecoration: 'none',
                          borderRadius: 4,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        }}
                        title={`Launch 45-Min Live Diagnostic Consultation Playbook with ${client.clientName}`}
                      >
                        <GaaIcon name="video-studio" size={13} tone="gold" />
                        <span>Live Studio</span>
                      </Link>

                      <Link
                        href={`/coach/clients/${client.clientId}`}
                        className="tactile-btn"
                        style={{
                          padding: '8px 14px',
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          color: 'var(--white)',
                          fontFamily: 'Raleway, sans-serif',
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: 'none',
                          borderRadius: 4,
                        }}
                      >
                        Open Lab →
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Expanded Clinical Telemetry & Diagnostics Drawer */}
                {expandedDetailsClientId === client.clientId && (
                  <div
                    style={{
                      padding: '14px 16px',
                      background: 'rgba(8, 14, 24, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 6,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: 12,
                      animation: 'fadeIn 0.15s ease',
                    }}
                  >
                    <div>
                      <span style={{ display: 'block', fontSize: 10, color: '#64748B', textTransform: 'uppercase', fontFamily: 'Raleway, sans-serif', fontWeight: 700 }}>
                        Acute Workload (7d)
                      </span>
                      <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 14, color: 'var(--gold-lt)', fontWeight: 700 }}>
                        {client.acuteWorkloadUnits?.toLocaleString() || 'Baseline'} <span style={{ fontSize: 10, color: '#94A3B8' }}>units</span>
                      </span>
                    </div>

                    <div>
                      <span style={{ display: 'block', fontSize: 10, color: '#64748B', textTransform: 'uppercase', fontFamily: 'Raleway, sans-serif', fontWeight: 700 }}>
                        Chronic Workload (28d)
                      </span>
                      <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 14, color: '#FFFFFF', fontWeight: 700 }}>
                        {client.chronicWorkloadUnits?.toLocaleString() || 'Baseline'} <span style={{ fontSize: 10, color: '#94A3B8' }}>units/wk</span>
                      </span>
                    </div>

                    <div>
                      <span style={{ display: 'block', fontSize: 10, color: '#64748B', textTransform: 'uppercase', fontFamily: 'Raleway, sans-serif', fontWeight: 700 }}>
                        Days Since Log
                      </span>
                      <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 14, color: client.daysSinceLastCheckin > 7 ? '#F87171' : '#FFFFFF', fontWeight: 700 }}>
                        {client.daysSinceLastCheckin} <span style={{ fontSize: 10, color: '#94A3B8' }}>days</span>
                      </span>
                    </div>

                    <div>
                      <span style={{ display: 'block', fontSize: 10, color: '#64748B', textTransform: 'uppercase', fontFamily: 'Raleway, sans-serif', fontWeight: 700 }}>
                        Joint Discomfort
                      </span>
                      <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: 12, color: client.hasReportedPain ? '#F87171' : '#34D399', fontWeight: 700 }}>
                        {client.hasReportedPain ? '⚠️ Flagged in Notes' : '✓ None Reported'}
                      </span>
                    </div>

                    <div>
                      <span style={{ display: 'block', fontSize: 10, color: '#64748B', textTransform: 'uppercase', fontFamily: 'Raleway, sans-serif', fontWeight: 700 }}>
                        Medical Clearance
                      </span>
                      <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: 12, color: client.hasMedicalRedFlag ? '#F87171' : '#34D399', fontWeight: 700 }}>
                        {client.hasMedicalRedFlag ? '🚨 Physician Review' : '✓ Cleared'}
                      </span>
                    </div>

                    <div>
                      <span style={{ display: 'block', fontSize: 10, color: '#64748B', textTransform: 'uppercase', fontFamily: 'Raleway, sans-serif', fontWeight: 700 }}>
                        OPT Progression
                      </span>
                      <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 13, color: 'var(--gold-lt)', fontWeight: 700 }}>
                        Phase {client.currentOptPhase}
                      </span>
                    </div>
                  </div>
                )}

                {/* Inline 1-Tap Coach Scott Directive Dispatcher */}
                {selectedDirectiveClientId === client.clientId && (
                  <div
                    style={{
                      padding: '14px 16px',
                      background: 'rgba(10, 14, 24, 0.95)',
                      border: '1px solid rgba(212, 160, 23, 0.4)',
                      borderRadius: 6,
                      display: 'grid',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-lt, #fef08a)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <GaaIcon name="lightning" size={13} tone="gold" />
                        <span>1-Tap Coach Scott Gordon Direct Intervention</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedDirectiveClientId(null)}
                        style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 14, cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {[
                        'Hold on heavy loads today. I am reviewing your movement memo and will calibrate your protocol.',
                        'Great instinct checking in. Let us auto-regulate to Phase 1 tempo and check back tomorrow.',
                        'Take today as an active recovery day with 20 minutes Zone 2 walking and hydration.',
                      ].map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setCustomDirectiveText(preset)}
                          style={{
                            padding: '4px 10px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#d1d5db',
                            fontSize: 11,
                            borderRadius: 14,
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          &ldquo;{preset.slice(0, 45)}...&rdquo;
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        value={customDirectiveText}
                        onChange={e => setCustomDirectiveText(e.target.value)}
                        placeholder={`Direct note to ${client.clientName}...`}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: 6,
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#FFFFFF',
                          fontSize: 12,
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        disabled={isSendingDirective || !customDirectiveText.trim()}
                        onClick={() => handleSendCoachDirective(client.clientId, client.clientName)}
                        className="sgf-button sgf-button-gold"
                        style={{ padding: '8px 16px', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <GaaIcon name="rocket" size={13} tone="inherit" />
                        <span>{isSendingDirective ? 'Dispatching...' : 'Dispatch'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Instant Success Banner if Action Executed */}
                {successMsg && (
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(52,211,153,0.1)',
                      borderLeft: '3px solid #34d399',
                      borderRadius: 4,
                      fontSize: 12,
                      color: '#A7F3D0',
                    }}
                  >
                    <strong>Success:</strong> {successMsg}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Executive Consultant Memo Studio Modal ── */}
      {activeMemoClient && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="memo-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(4,8,14,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveMemoClient(null)
            }
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: 680,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#0a121d',
              border: '1px solid rgba(212,160,23,0.4)',
              borderRadius: 12,
              padding: 'clamp(16px, 3vw, 24px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: 'Raleway, sans-serif',
                      fontWeight: 700,
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      padding: '3px 8px',
                      background: 'rgba(212,160,23,0.15)',
                      color: 'var(--gold-lt)',
                      border: '1px solid rgba(212,160,23,0.35)',
                      borderRadius: 4,
                    }}
                  >
                    Phase {activeMemoClient.currentOptPhase} Telemetry
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                    Check-in: {activeMemoClient.daysSinceLastCheckin}d ago
                  </span>
                  <span style={{ fontSize: 11, color: typeof activeMemoClient.readinessScore === 'number' && activeMemoClient.readinessScore < 60 ? 'var(--error)' : 'var(--success)' }}>
                    Readiness: {typeof activeMemoClient.readinessScore === 'number' ? `${activeMemoClient.readinessScore}%` : '--'}
                  </span>
                </div>
                <h3
                  id="memo-modal-title"
                  style={{
                    fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                    fontWeight: 700,
                    fontSize: 20,
                    margin: '6px 0 0',
                    color: 'var(--white)',
                  }}
                >
                  Executive Memo: {activeMemoClient.clientName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveMemoClient(null)}
                aria-label="Close memo modal"
                className="tactile-btn"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'var(--gray)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                ✕
              </button>
            </div>

            {/* Coach Quick Note Input */}
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Coach Special Directive / Audio Note
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={memoCustomNote}
                  onChange={(e) => setMemoCustomNote(e.target.value)}
                  placeholder="e.g., Dial in 4/2/1 tempo on goblet squats; protect right knee..."
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    color: 'var(--white)',
                    fontSize: 13,
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const regenerated = generateConsultantMemo({
                      clientName: activeMemoClient.clientName,
                      optPhase: activeMemoClient.currentOptPhase || 1,
                      totalSetsLogged: Math.round(((activeMemoClient.adherencePercent || 80) / 100) * 36),
                      targetSetsPlanned: 36,
                      avgReadiness: activeMemoClient.readinessScore || 80,
                      cexStreakDays: 5,
                      coachCustomNotes: memoCustomNote.trim() || undefined,
                    })
                    setGeneratedMemoText(regenerated.fullMemoMarkdown)
                  }}
                  className="tactile-btn"
                  style={{
                    background: 'rgba(212,160,23,0.2)',
                    border: '1px solid rgba(212,160,23,0.4)',
                    color: 'var(--gold-lt)',
                    fontWeight: 700,
                    fontSize: 11,
                    padding: '0 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <GaaIcon name="rotate-ccw" size={12} tone="gold" />
                  <span>Update AI Memo</span>
                </button>
              </div>
            </div>

            {/* Formatted Memo Content Textarea / Preview */}
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Executive Briefing Markdown (Review & Edit)
              </label>
              <textarea
                value={generatedMemoText}
                onChange={(e) => setGeneratedMemoText(e.target.value)}
                rows={11}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(212,160,23,0.25)',
                  borderRadius: 6,
                  padding: '12px',
                  color: 'var(--white)',
                  fontFamily: 'var(--font-telemetry, monospace)',
                  fontSize: 12,
                  lineHeight: 1.5,
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setActiveMemoClient(null)}
                className="tactile-btn"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'var(--white)',
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '10px 18px',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDispatchingMemo || !generatedMemoText.trim()}
                onClick={handleDispatchConsultantMemo}
                className="sgf-button sgf-button-gold"
                style={{
                  padding: '10px 20px',
                  fontSize: 12,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <GaaIcon name="rocket" size={13} tone="inherit" />
                <span>{isDispatchingMemo ? 'Dispatching to App...' : 'Dispatch to Athlete Inbox'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

