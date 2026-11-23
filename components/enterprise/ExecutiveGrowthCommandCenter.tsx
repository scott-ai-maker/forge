'use client'

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import {
  Briefcase,
  Building2,
  Check,
  Copy,
  Download,
  Mail,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import {
  EXECUTIVE_BOT_ORDER,
  EXECUTIVE_BOT_PROFILES,
  FORGE_LEADERSHIP_TEAM,
} from '@/lib/enterprise-chatbots/knowledge'
import type {
  DeliverableMode,
  EnterpriseTelemetrySnapshot,
  ExecutiveBotId,
  ExecutiveChatResponse,
} from '@/lib/enterprise-chatbots/types'

interface ExecutiveThreadMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  deliverableTitle?: string
  deliverableMode?: DeliverableMode
  engineMode?: 'gemini_ai' | 'deterministic_playbook'
  suggestedFollowUps?: string[]
  createdAt: string
}

export interface ExecutiveGrowthCommandCenterProps {
  initialTelemetry: EnterpriseTelemetrySnapshot
  viewerPersona?: 'scott' | 'lisa'
}

const LISA_CS_QUICK_PROMPTS: Record<
  ExecutiveBotId,
  Array<{ id: string; label: string; prompt: string; deliverableMode: DeliverableMode }>
> = {
  'b2b-partnerships': [
    {
      id: 'lisa-b2b-qbr',
      label: '90-Day Pilot Kickoff & QBR Deck (Lisa)',
      prompt:
        'As Lisa Gordon (VP of Customer Success & Enterprise Accounts), build a 90-day corporate pilot kickoff checklist and Quarterly Business Review (QBR) executive agenda to convert a 10-seat biotech pilot into a $35,000/yr annual renewal.',
      deliverableMode: 'playbook',
    },
  ],
  'cfo-revenue': [
    {
      id: 'lisa-cs-nrr',
      label: 'Onboarding & 14-Day Save Playbook (Lisa)',
      prompt:
        'As Lisa Gordon (VP of Customer Success), design a weekly non-clinical member health check cadence for inactive-14d and low-credit members, including a warm Core Lab ($49/mo) downsell save email that protects Net Revenue Retention.',
      deliverableMode: 'outreach_draft',
    },
  ],
  'enterprise-ops': [
    {
      id: 'lisa-cs-sop',
      label: 'CS Handoff & CRM Hygiene SOP (Lisa)',
      prompt:
        'As Lisa Gordon (VP of Customer Success with an IT/Business background), create a clean CRM/account health tracking SOP and sales-to-onboarding handoff workflow that keeps client PHI strictly separated inside clinical coaching.',
      deliverableMode: 'playbook',
    },
  ],
  'growth-marketing': [
    {
      id: 'lisa-cs-referrals',
      label: 'Member Milestone & Referral Ask (Lisa)',
      prompt:
        'Draft a warm, non-pushy 60-day member check-in email from Lisa Gordon celebrating onboarding consistency and introducing our Founding Partner Pass referral and corporate team option.',
      deliverableMode: 'outreach_draft',
    },
  ],
}

const DELIVERABLE_MODES: Array<{ id: DeliverableMode; label: string }> = [
  { id: 'advisory', label: 'Executive Briefing' },
  { id: 'playbook', label: 'Executable Playbook' },
  { id: 'social_pack', label: 'Weekly Social Pack' },
  { id: 'outreach_draft', label: 'Outreach Copy' },
  { id: 'financial_model', label: 'Financial Model' },
  { id: 'compliance_checklist', label: 'Compliance Audit' },
]

const ACCENT_STYLES: Record<
  'gold' | 'emerald' | 'cyan' | 'purple',
  { border: string; bg: string; badge: string; text: string }
> = {
  gold: {
    border: 'border-amber-400/45',
    bg: 'bg-amber-400/12',
    badge: 'border-amber-400/35 bg-amber-400/15 text-amber-200',
    text: 'text-amber-300',
  },
  emerald: {
    border: 'border-emerald-400/45',
    bg: 'bg-emerald-400/12',
    badge: 'border-emerald-400/35 bg-emerald-400/15 text-emerald-200',
    text: 'text-emerald-300',
  },
  cyan: {
    border: 'border-sky-400/45',
    bg: 'bg-sky-400/12',
    badge: 'border-sky-400/35 bg-sky-400/15 text-sky-200',
    text: 'text-sky-300',
  },
  purple: {
    border: 'border-violet-400/45',
    bg: 'bg-violet-400/12',
    badge: 'border-violet-400/35 bg-violet-400/15 text-violet-200',
    text: 'text-violet-300',
  },
}

function renderBotIcon(botId: ExecutiveBotId) {
  switch (botId) {
    case 'b2b-partnerships':
      return <Building2 size={16} strokeWidth={1.8} aria-hidden="true" />
    case 'growth-marketing':
      return <TrendingUp size={16} strokeWidth={1.8} aria-hidden="true" />
    case 'cfo-revenue':
      return <Briefcase size={16} strokeWidth={1.8} aria-hidden="true" />
    case 'enterprise-ops':
      return <ShieldCheck size={16} strokeWidth={1.8} aria-hidden="true" />
  }
}

function renderInlineFormatting(line: string): React.ReactNode {
  const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-amber-200"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>
  })
}

function renderExecutiveMarkdown(markdown: string): React.ReactNode {
  const lines = markdown.split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const raw = lines[i]
    const trimmed = raw.trim()

    if (!trimmed) {
      i++
      continue
    }

    // Markdown table block
    if (trimmed.startsWith('|') && i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim())
        i++
      }
      const parsedRows = tableLines
        .map(row =>
          row
            .replace(/^\||\|$/g, '')
            .split('|')
            .map(cell => cell.trim())
        )
        .filter(cells => !cells.every(c => /^:?-{2,}:?$/.test(c)))

      if (parsedRows.length > 0) {
        const [headerRow, ...bodyRows] = parsedRows
        blocks.push(
          <div key={`tbl-${i}`} className="my-3 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-white/[0.05] text-[11px] uppercase tracking-wider text-zinc-300">
                <tr>
                  {headerRow.map((h, hIdx) => (
                    <th key={hIdx} scope="col" className="border-b border-white/10 px-3 py-2 font-semibold">
                      {renderInlineFormatting(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-white/[0.06] last:border-b-0">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-zinc-200">
                        {renderInlineFormatting(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        continue
      }
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      blocks.push(
        <h4 key={`h4-${i}`} className="mt-3.5 mb-1.5 text-xs font-bold uppercase tracking-[0.08em] text-amber-300">
          {renderInlineFormatting(trimmed.slice(4))}
        </h4>
      )
      i++
      continue
    }
    if (trimmed.startsWith('## ')) {
      blocks.push(
        <h3 key={`h3-${i}`} className="mt-2 mb-2 font-serif text-sm font-bold tracking-wide text-white">
          {renderInlineFormatting(trimmed.slice(3))}
        </h3>
      )
      i++
      continue
    }

    // Bullet / checklist list
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''))
        i++
      }
      blocks.push(
        <ul key={`ul-${i}`} className="my-2 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-zinc-200">
          {items.map((item, idx) => (
            <li key={idx}>{renderInlineFormatting(item)}</li>
          ))}
        </ul>
      )
      continue
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
        i++
      }
      blocks.push(
        <ol key={`ol-${i}`} className="my-2 list-decimal space-y-1.5 pl-5 text-xs leading-relaxed text-zinc-200">
          {items.map((item, idx) => (
            <li key={idx}>{renderInlineFormatting(item)}</li>
          ))}
        </ol>
      )
      continue
    }

    // Standard paragraph
    blocks.push(
      <p key={`p-${i}`} className="my-1.5 text-xs leading-relaxed text-zinc-200">
        {renderInlineFormatting(trimmed)}
      </p>
    )
    i++
  }

  return blocks
}

function CopyDeliverableButton({
  text,
  label,
}: {
  text: string
  label: string
}) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [liveMessage, setLiveMessage] = useState('')
  const lastAnnouncedRef = useRef('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleCopy = async () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    let ok = false
    try {
      await navigator.clipboard.writeText(text)
      ok = true
    } catch {
      ok = false
    }

    setStatus(ok ? 'copied' : 'failed')
    let announcement = ok ? 'Copied' : 'Copy failed'
    if (announcement === lastAnnouncedRef.current) {
      announcement += '\u00A0'
    }
    lastAnnouncedRef.current = announcement
    setLiveMessage(announcement)

    timerRef.current = setTimeout(() => {
      setStatus('idle')
      setLiveMessage('')
    }, 2200)
  }

  return (
    <span className="relative inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => void handleCopy()}
        aria-label={`Copy ${label}`}
        data-copied={status === 'copied' ? '' : undefined}
        data-failed={status === 'failed' ? '' : undefined}
        className="inline-flex min-h-[36px] min-w-[36px] items-center gap-1.5 rounded-lg border border-white/15 bg-[#111827] px-2.5 py-1.5 text-[11px] font-semibold text-zinc-200 transition-colors hover:border-amber-400/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
      >
        {status === 'copied' ? (
          <Check size={13} className="text-emerald-400" aria-hidden="true" />
        ) : (
          <Copy size={13} aria-hidden="true" />
        )}
        <span>{status === 'copied' ? 'Copied' : status === 'failed' ? 'Retry Copy' : 'Copy'}</span>
      </button>
      <span
        role="status"
        className={`forge-copy-status-tip font-mono text-[10px] font-semibold ${
          status === 'failed' ? 'text-rose-300' : 'text-emerald-300'
        } ${liveMessage ? 'opacity-100' : 'opacity-0'}`}
      >
        {liveMessage}
      </span>
    </span>
  )
}

export default function ExecutiveGrowthCommandCenter({
  initialTelemetry,
  viewerPersona = 'scott',
}: ExecutiveGrowthCommandCenterProps) {
  const [activeBotId, setActiveBotId] = useState<ExecutiveBotId>(
    viewerPersona === 'lisa' ? 'cfo-revenue' : 'b2b-partnerships'
  )
  const [deliverableMode, setDeliverableMode] = useState<DeliverableMode>('playbook')
  const [telemetry, setTelemetry] = useState<EnterpriseTelemetrySnapshot>(initialTelemetry)
  const [refreshingTelemetry, setRefreshingTelemetry] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [loadingBotId, setLoadingBotId] = useState<ExecutiveBotId | null>(null)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [emailDispatchState, setEmailDispatchState] = useState<
    Record<string, { status: 'sending' | 'sent' | 'error'; detail?: string }>
  >({})
  const [threadsByBot, setThreadsByBot] = useState<Record<ExecutiveBotId, ExecutiveThreadMessage[]>>({
    'b2b-partnerships': [],
    'growth-marketing': [],
    'cfo-revenue': [],
    'enterprise-ops': [],
  })

  const promptInputId = useId()
  const modeSelectId = useId()
  const tabRefs = useRef<Record<ExecutiveBotId, HTMLButtonElement | null>>({
    'b2b-partnerships': null,
    'growth-marketing': null,
    'cfo-revenue': null,
    'enterprise-ops': null,
  })
  const threadEndRef = useRef<HTMLDivElement | null>(null)

  const activeBot = EXECUTIVE_BOT_PROFILES[activeBotId]
  const activeAccent = ACCENT_STYLES[activeBot.accentTone]
  const activeMessages = useMemo(
    () => threadsByBot[activeBotId] ?? [],
    [threadsByBot, activeBotId]
  )
  const isBusy = loadingBotId === activeBotId

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeMessages.length, isBusy])

  const refreshTelemetry = useCallback(async () => {
    setRefreshingTelemetry(true)
    try {
      const res = await fetch('/api/coach/enterprise-bots', { method: 'GET' })
      if (res.ok) {
        const data = (await res.json()) as { telemetry?: EnterpriseTelemetrySnapshot }
        if (data.telemetry) {
          setTelemetry(data.telemetry)
        }
      }
    } catch {
      // keep existing telemetry snapshot
    } finally {
      setRefreshingTelemetry(false)
    }
  }, [])

  const submitPrompt = useCallback(
    async (rawText: string, overrideMode?: DeliverableMode) => {
      const trimmed = rawText.trim()
      if (!trimmed || loadingBotId !== null) return

      const targetBot = activeBotId
      const targetMode = overrideMode ?? deliverableMode
      setErrorText(null)
      setInputValue('')
      setLoadingBotId(targetBot)

      const userMsg: ExecutiveThreadMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        text: trimmed,
        deliverableMode: targetMode,
        createdAt: new Date().toISOString(),
      }

      const priorHistory = (threadsByBot[targetBot] ?? []).slice(-8).map(m => ({
        role: m.role,
        text: m.text,
      }))

      setThreadsByBot(prev => ({
        ...prev,
        [targetBot]: [...(prev[targetBot] ?? []), userMsg],
      }))

      try {
        const res = await fetch('/api/coach/enterprise-bots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botId: targetBot,
            message: trimmed,
            deliverableMode: targetMode,
            history: priorHistory,
          }),
        })

        const data = (await res.json().catch(() => null)) as
          | (ExecutiveChatResponse & { ok?: boolean; error?: string })
          | null

        if (!res.ok || !data?.replyMarkdown) {
          setErrorText(data?.error || 'Could not reach the executive advisor. Please try again.')
          return
        }

        if (data.telemetry) {
          setTelemetry(data.telemetry)
        }

        const assistantMsg: ExecutiveThreadMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: data.replyMarkdown,
          deliverableTitle: data.deliverableTitle,
          deliverableMode: data.deliverableMode,
          engineMode: data.engineMode,
          suggestedFollowUps: data.suggestedFollowUps,
          createdAt: new Date().toISOString(),
        }

        setThreadsByBot(prev => ({
          ...prev,
          [targetBot]: [...(prev[targetBot] ?? []), assistantMsg],
        }))
      } catch {
        setErrorText('Network interruption while consulting advisor. Please retry.')
      } finally {
        setLoadingBotId(null)
      }
    },
    [activeBotId, deliverableMode, loadingBotId, threadsByBot]
  )

  const handleDownloadMarkdown = (title: string, content: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const blob = new Blob([`# ${title}\n\n${content}\n`], {
      type: 'text/markdown;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `forge-athletic-${slug || 'playbook'}.md`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  const handleEmailDeliverable = async (msgId: string, subject: string, markdownBody: string) => {
    setEmailDispatchState(prev => ({
      ...prev,
      [msgId]: { status: 'sending' },
    }))
    try {
      const res = await fetch('/api/coach/enterprise-bots/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: activeBotId,
          subject,
          markdownBody,
        }),
      })
      const data = (await res.json().catch(() => null)) as { message?: string; error?: string } | null
      if (!res.ok) {
        setEmailDispatchState(prev => ({
          ...prev,
          [msgId]: { status: 'error', detail: data?.error || 'Dispatch failed' },
        }))
        return
      }
      setEmailDispatchState(prev => ({
        ...prev,
        [msgId]: { status: 'sent', detail: data?.message || `Sent from ${activeBot.email}` },
      }))
    } catch {
      setEmailDispatchState(prev => ({
        ...prev,
        [msgId]: { status: 'error', detail: 'Network error sending email' },
      }))
    }
  }

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const nextIdx =
      e.key === 'ArrowRight'
        ? (idx + 1) % EXECUTIVE_BOT_ORDER.length
        : (idx - 1 + EXECUTIVE_BOT_ORDER.length) % EXECUTIVE_BOT_ORDER.length
    const nextId = EXECUTIVE_BOT_ORDER[nextIdx]
    setActiveBotId(nextId)
    tabRefs.current[nextId]?.focus()
  }

  return (
    <section
      aria-labelledby="enterprise-growth-suite-heading"
      data-testid="executive-growth-command-center"
      className="space-y-4"
    >
      {/* Header + Live Aggregated Telemetry Banner */}
      <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-[#0E1827] via-[#0A111D] to-[#080E17] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/35 bg-amber-400/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300">
              <Sparkles size={11} aria-hidden="true" />
              <span>
                {viewerPersona === 'lisa'
                  ? 'VP Customer Success Workspace · Zero PII / Zero PHI'
                  : 'Founding Principal Enterprise Board · Zero PII / Zero PHI'}
              </span>
            </div>
            <h2
              id="enterprise-growth-suite-heading"
              className="mt-2 font-serif text-xl font-bold tracking-wide text-white sm:text-2xl"
            >
              FORGE ATHLETIC ENTERPRISE GROWTH SUITE
            </h2>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-zinc-300">
              Four specialized executive chatbots calibrated to Forge Athletic&apos;s $585k → $4.75M ARR roadmap,
              Massachusetts W-2 &amp; HIPAA governance, and live aggregated practice metrics.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refreshTelemetry()}
            disabled={refreshingTelemetry}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/15 bg-[#121A28] px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:border-amber-400/40 hover:text-white disabled:opacity-60"
          >
            <RefreshCw
              size={13}
              className={refreshingTelemetry ? 'animate-spin text-amber-300' : 'text-amber-300'}
              aria-hidden="true"
            />
            <span>{refreshingTelemetry ? 'Syncing…' : 'Sync Live Telemetry'}</span>
          </button>
        </div>

        {/* Live Zero-PII KPI Strip */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-white/[0.08] bg-[#0B121E]/90 p-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">Launch Runway</div>
            <div className="mt-1 font-mono text-lg font-bold tabular-nums text-amber-300">
              {telemetry.launchMode === 'public_live' ? 'LIVE' : `${telemetry.daysUntilGoLive}d`}
            </div>
            <div className="text-[10.5px] text-zinc-400">
              {telemetry.launchMode === 'public_live' ? 'Public enrollment open' : 'To Jan 4, 2027'}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#0B121E]/90 p-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">Waitlist Demand</div>
            <div className="mt-1 font-mono text-lg font-bold tabular-nums text-emerald-300">
              {telemetry.waitlistLeadsCount}
            </div>
            <div className="text-[10.5px] text-zinc-400">
              {telemetry.coachingApplicationsCount} quiz applications
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#0B121E]/90 p-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">Verified MRR</div>
            <div className="mt-1 font-mono text-lg font-bold tabular-nums text-amber-300">
              ${(telemetry.verifiedMonthlyRecurringRevenueUsd ?? 0).toLocaleString()}/mo
            </div>
            <div className="text-[10.5px] text-zinc-400">
              ${(telemetry.verifiedAnnualRecurringRevenueUsd ?? 0).toLocaleString()}/yr ARR · {telemetry.legacyRetainerClientsCount ?? 0} longtime
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#0B121E]/90 p-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">Paying Roster</div>
            <div className="mt-1 font-mono text-lg font-bold tabular-nums text-white">
              {telemetry.activeAssignedClients}
              <span className="text-xs font-normal text-zinc-400">/{telemetry.coachSupportCap}</span>
            </div>
            <div className="text-[10.5px] text-zinc-400">
              {telemetry.coachSupportUtilizationPct}% cap · excl. exec team
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#0B121E]/90 p-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">Retention Risk</div>
            <div className="mt-1 font-mono text-lg font-bold tabular-nums text-rose-300">
              {telemetry.inactive14dClientsCount}
            </div>
            <div className="text-[10.5px] text-zinc-400">
              14d inactive · {telemetry.lowCreditClientsCount} low credits
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#0B121E]/90 p-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">Weekly Studio</div>
            <div className="mt-1 font-mono text-lg font-bold tabular-nums text-white">
              {telemetry.sessionsThisWeek}
            </div>
            <div className="text-[10.5px] text-zinc-400">
              {telemetry.unreadClientMessagesCount} unread SLA msgs
            </div>
          </div>
        </div>

        {/* Real Human Executive Leadership Strip (Scott Gordon & Lisa Gordon) */}
        <div className="mt-4 grid grid-cols-1 gap-2.5 border-t border-white/10 pt-4 md:grid-cols-2">
          {FORGE_LEADERSHIP_TEAM.map(leader => (
            <div
              key={leader.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0B121E]/90 p-3"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-amber-400/45 bg-slate-900">
                <Image
                  src={leader.avatarPath}
                  alt={leader.avatarAlt}
                  fill
                  sizes="48px"
                  className="object-cover object-top"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-white">{leader.name}</span>
                  <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                    Leadership · Indefinite All-Access
                  </span>
                </div>
                <div className="truncate text-[11px] font-semibold text-amber-200">{leader.title}</div>
                <div className="truncate font-mono text-[10px] text-zinc-400">
                  {leader.email}
                  {leader.departmentAlias ? ` · ${leader.departmentAlias}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4-Advisor Specialist Selector Tabs */}
      <div
        role="tablist"
        aria-label="Enterprise Growth Executive Advisors"
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4"
      >
        {EXECUTIVE_BOT_ORDER.map((botId, idx) => {
          const bot = EXECUTIVE_BOT_PROFILES[botId]
          const isSelected = activeBotId === botId
          const style = ACCENT_STYLES[bot.accentTone]
          const msgCount = (threadsByBot[botId] ?? []).filter(m => m.role === 'assistant').length

          return (
            <button
              key={botId}
              ref={el => {
                tabRefs.current[botId] = el
              }}
              type="button"
              role="tab"
              id={`exec-tab-${botId}`}
              aria-selected={isSelected}
              aria-controls="exec-bot-workspace-panel"
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setActiveBotId(botId)}
              onKeyDown={e => handleTabKeyDown(e, idx)}
              data-testid={`exec-bot-tab-${botId}`}
              className={`flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
                isSelected
                  ? `${style.border} ${style.bg}`
                  : 'border-white/10 bg-[#0D1624] hover:border-white/25 hover:bg-[#111D2F]'
              }`}
            >
              <div className="flex w-full items-center gap-3">
                <div className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border ${isSelected ? style.border : 'border-white/15'}`}>
                  <Image
                    src={bot.avatarPath}
                    alt={bot.avatarAlt}
                    fill
                    sizes="48px"
                    className="object-cover object-top"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider ${style.text}`}>
                      {renderBotIcon(botId)}
                      <span>{bot.shortLabel}</span>
                    </span>
                    {msgCount > 0 ? (
                      <span className="rounded-full border border-white/15 bg-black/30 px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                        {msgCount}
                      </span>
                    ) : null}
                  </div>
                  <div className="truncate text-sm font-bold text-white">{bot.name}</div>
                  <div className="truncate text-[11px] font-medium text-zinc-400">{bot.roleLabel}</div>
                </div>
              </div>
              <p className="text-[11.5px] leading-relaxed text-zinc-300">{bot.tagline}</p>
            </button>
          )
        })}
      </div>

      {/* Active Advisor Workspace */}
      <div
        id="exec-bot-workspace-panel"
        role="tabpanel"
        aria-labelledby={`exec-tab-${activeBotId}`}
        className="grid grid-cols-1 gap-4 lg:grid-cols-12"
      >
        {/* Left Column: Brief Playbooks & Focus */}
        <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0B121F] p-4 lg:col-span-4">
          <div className="flex items-start gap-3.5">
            <div className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border ${activeAccent.border}`}>
              <Image
                src={activeBot.avatarPath}
                alt={activeBot.avatarAlt}
                fill
                sizes="64px"
                className="object-cover object-top"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-serif text-base font-bold text-white">{activeBot.name}</div>
              <div className={`mt-0.5 text-[11.5px] font-semibold ${activeAccent.text}`}>
                {activeBot.title}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10.5px] text-zinc-300">
                <a
                  href={`mailto:${activeBot.email}`}
                  className="inline-flex items-center gap-1 text-amber-200 underline-offset-2 hover:underline"
                >
                  <Mail size={11} aria-hidden="true" />
                  <span>{activeBot.email}</span>
                </a>
                <span className="text-zinc-500">·</span>
                <span className="text-zinc-400">{activeBot.departmentAlias}</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-400">{activeBot.background}</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-zinc-300">{activeBot.mission}</p>

          <div className="flex flex-wrap gap-1.5">
            {activeBot.keyMetricsFocus.map(metric => (
              <span
                key={metric}
                className="rounded-lg border border-white/10 bg-[#121C2E] px-2 py-1 font-mono text-[10px] font-medium text-zinc-300"
              >
                {metric}
              </span>
            ))}
          </div>

          {activeBotId === 'growth-marketing' ? (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Human-in-the-Loop Social Engine
                </span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-200">
                  5-Min Review
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-300">
                Drafts 3 LinkedIn posts, 2 Reels/Shorts scripts, 1 carousel, and safe comment/DM replies—ready to copy,
                download, or email to your inbox.
              </p>
              <button
                type="button"
                disabled={loadingBotId !== null}
                onClick={() => {
                  const socialPrompt = activeBot.quickPrompts.find(
                    qp => qp.id === 'growth-weekly-social-pack'
                  )
                  setDeliverableMode('social_pack')
                  void submitPrompt(
                    socialPrompt?.prompt ||
                      'Generate this week’s complete Forge Athletic Social Media Pack for LinkedIn, Reels/Shorts, and safe DM replies.',
                    'social_pack'
                  )
                }}
                className="mt-2.5 inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-3 py-2 text-xs font-extrabold uppercase tracking-wider text-zinc-950 transition hover:bg-emerald-300 disabled:opacity-50"
              >
                <Sparkles size={13} aria-hidden="true" />
                <span>Generate Weekly Social Pack</span>
              </button>
            </div>
          ) : null}

          <div className="border-t border-white/10 pt-3">
            <h3 className="mb-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-zinc-400">
              1-Tap Enterprise Playbooks
            </h3>
            <div className="space-y-2">
              {[
                ...(viewerPersona === 'lisa' ? LISA_CS_QUICK_PROMPTS[activeBotId] : []),
                ...activeBot.quickPrompts,
              ].map(qp => (
                <button
                  key={qp.id}
                  type="button"
                  disabled={loadingBotId !== null}
                  onClick={() => {
                    setDeliverableMode(qp.deliverableMode)
                    void submitPrompt(qp.prompt, qp.deliverableMode)
                  }}
                  className="w-full min-h-[44px] rounded-xl border border-white/10 bg-[#121C2E] px-3 py-2.5 text-left transition-colors hover:border-amber-400/45 hover:bg-[#17243A] disabled:opacity-50"
                >
                  <div className="text-xs font-bold text-white">{qp.label}</div>
                  <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-zinc-400">
                    {qp.prompt}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Executive Thread & Composer */}
        <div className="flex min-h-[540px] flex-col rounded-2xl border border-white/10 bg-[#0A101B] lg:col-span-8">
          {/* Deliverable Mode Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#0E1626] px-4 py-3">
            <div className="flex items-center gap-2">
              <label
                htmlFor={modeSelectId}
                className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-zinc-400"
              >
                Output Format
              </label>
              <select
                id={modeSelectId}
                value={deliverableMode}
                onChange={e => setDeliverableMode(e.target.value as DeliverableMode)}
                className="min-h-[36px] rounded-lg border border-white/15 bg-[#131E31] px-2.5 py-1 text-xs font-semibold text-white focus-visible:outline-2 focus-visible:outline-amber-400"
              >
                {DELIVERABLE_MODES.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <span className="font-mono text-[10px] text-zinc-400">
              Telemetry source: {telemetry.dataSource === 'live_supabase' ? 'Live Supabase (Aggregated)' : 'Baseline Model'}
            </span>
          </div>

          {/* Messages Log */}
          <div
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-busy={isBusy}
            className="flex-1 space-y-4 overflow-y-auto p-4"
            style={{ maxHeight: 540 }}
          >
            {activeMessages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-[#0F1726]/70 p-6 text-center">
                <div className={`relative mx-auto mb-3 h-16 w-16 overflow-hidden rounded-2xl border ${activeAccent.border}`}>
                  <Image
                    src={activeBot.avatarPath}
                    alt={activeBot.avatarAlt}
                    fill
                    sizes="64px"
                    className="object-cover object-top"
                  />
                </div>
                <h3 className="font-serif text-base font-bold text-white">
                  {activeBot.name} · {activeBot.roleLabel}
                </h3>
                <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-zinc-400">
                  Select a 1-tap playbook on the left or issue a custom strategic directive below. Every brief
                  automatically incorporates your live aggregated Forge Athletic telemetry and can be copied or
                  downloaded as Markdown.
                </p>
              </div>
            ) : (
              activeMessages.map(msg => (
                <article
                  key={msg.id}
                  className={`rounded-2xl border p-4 ${
                    msg.role === 'user'
                      ? 'ml-auto max-w-[88%] border-amber-400/30 bg-amber-400/10 text-zinc-100'
                      : 'border-white/10 bg-[#111929] text-zinc-100'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <>
                      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                          <div className={`relative h-7 w-7 shrink-0 overflow-hidden rounded-lg border ${activeAccent.border}`}>
                            <Image
                              src={activeBot.avatarPath}
                              alt=""
                              fill
                              sizes="28px"
                              className="object-cover object-top"
                            />
                          </div>
                          <span className={`font-mono text-[10.5px] font-bold uppercase tracking-wider ${activeAccent.text}`}>
                            {msg.deliverableTitle || activeBot.name}
                          </span>
                          <span className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9.5px] text-zinc-400">
                            {msg.engineMode === 'gemini_ai' ? 'Gemini ZDR' : 'Structured Playbook'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <CopyDeliverableButton
                            text={msg.text}
                            label={msg.deliverableTitle || activeBot.name}
                          />
                          <button
                            type="button"
                            disabled={emailDispatchState[msg.id]?.status === 'sending'}
                            onClick={() =>
                              void handleEmailDeliverable(
                                msg.id,
                                msg.deliverableTitle || activeBot.name,
                                msg.text
                              )
                            }
                            aria-label={`Email ${msg.deliverableTitle || activeBot.name} from ${activeBot.email}`}
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-white/15 bg-[#111827] px-2.5 py-1.5 text-[11px] font-semibold text-zinc-200 transition-colors hover:border-amber-400/50 hover:text-white disabled:opacity-60"
                          >
                            <Mail size={13} aria-hidden="true" />
                            <span>
                              {emailDispatchState[msg.id]?.status === 'sending'
                                ? 'Sending…'
                                : emailDispatchState[msg.id]?.status === 'sent'
                                  ? 'Emailed'
                                  : 'Email Brief'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadMarkdown(msg.deliverableTitle || activeBot.name, msg.text)
                            }
                            aria-label={`Download ${msg.deliverableTitle || activeBot.name} as Markdown`}
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-white/15 bg-[#111827] px-2.5 py-1.5 text-[11px] font-semibold text-zinc-200 transition-colors hover:border-amber-400/50 hover:text-white"
                          >
                            <Download size={13} aria-hidden="true" />
                            <span>.md</span>
                          </button>
                        </div>
                      </div>
                      {emailDispatchState[msg.id]?.detail ? (
                        <div
                          role="status"
                          className={`mb-2 rounded-lg border px-2.5 py-1 font-mono text-[10.5px] ${
                            emailDispatchState[msg.id]?.status === 'error'
                              ? 'border-rose-500/35 bg-rose-500/10 text-rose-200'
                              : 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
                          }`}
                        >
                          {emailDispatchState[msg.id]?.detail}
                        </div>
                      ) : null}

                      <div>{renderExecutiveMarkdown(msg.text)}</div>

                      {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/[0.08] pt-3">
                          {msg.suggestedFollowUps.map(follow => (
                            <button
                              key={follow}
                              type="button"
                              disabled={loadingBotId !== null}
                              onClick={() => void submitPrompt(follow)}
                              className="min-h-[36px] rounded-lg border border-white/12 bg-[#0B121F] px-2.5 py-1 text-left text-[11px] font-medium text-zinc-200 transition-colors hover:border-amber-400/45 hover:text-white disabled:opacity-50"
                            >
                              {follow} →
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-xs leading-relaxed text-white">{msg.text}</p>
                  )}
                </article>
              ))
            )}

            {isBusy ? (
              <div
                role="progressbar"
                aria-label="Drafting executive brief"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111929] px-3.5 py-3 text-xs text-zinc-300"
              >
                <Sparkles size={14} className="animate-pulse text-amber-300" aria-hidden="true" />
                <span>
                  {activeBot.name} is synthesizing live Forge Athletic metrics and drafting your deliverable…
                </span>
              </div>
            ) : null}

            <div ref={threadEndRef} />
          </div>

          {/* Error Banner */}
          {errorText ? (
            <div
              role="alert"
              className="mx-4 mb-2 rounded-xl border border-rose-500/40 bg-rose-500/12 px-3 py-2 text-xs text-rose-200"
            >
              {errorText}
            </div>
          ) : null}

          {/* Input Composer */}
          <form
            onSubmit={e => {
              e.preventDefault()
              void submitPrompt(inputValue)
            }}
            className="border-t border-white/10 bg-[#0E1626] p-3.5"
          >
            <label htmlFor={promptInputId} className="sr-only">
              Brief {activeBot.name}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <textarea
                id={promptInputId}
                rows={2}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void submitPrompt(inputValue)
                  }
                }}
                placeholder={`Direct ${activeBot.name} (e.g. "Build a Q1 Boston biotech outreach plan for 3 cohorts")…`}
                className="min-h-[48px] flex-1 resize-y rounded-xl border border-white/15 bg-[#090F1A] px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-amber-400"
              />
              <button
                type="submit"
                disabled={isBusy || !inputValue.trim()}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-zinc-950 transition-colors hover:bg-amber-300 disabled:opacity-50"
              >
                <Send size={14} aria-hidden="true" />
                <span>Send Brief</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
