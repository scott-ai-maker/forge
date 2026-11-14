'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  MessageSquare,
  Send,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react'
import { useTierAccess } from '@/lib/tierEntitlements'
import {
  getTodayIsoDate,
  loadPostureProfileState,
} from '@/lib/posture-profile-state'

export interface EscalationTelemetryContext {
  optPhase?: number | null
  jointComfortScore?: number | null
  readinessIndex?: number | null
  postureFlags?: string[]
  environmentProfile?: string | null
  expressModeActive?: boolean
  activeExercise?: string | null
  safetyFlagActive?: boolean
}

export interface CoachEscalationModalProps {
  open: boolean
  onClose: () => void
  sourceContext?:
    | 'assistant_drawer'
    | 'post_scan_results'
    | 'safety_override'
    | 'dashboard_guarantee'
  initialQuestion?: string
  telemetryOverride?: EscalationTelemetryContext
}

export default function CoachEscalationModal({
  open,
  onClose,
  sourceContext = 'assistant_drawer',
  initialQuestion = '',
  telemetryOverride,
}: CoachEscalationModalProps) {
  const { tierId, entitlements } = useTierAccess()
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()
  const questionInputId = useId()

  const [question, setQuestion] = useState(initialQuestion)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [dispatchResult, setDispatchResult] = useState<{
    slaBadge: string
    responseWindowCopy: string
    mailtoHref: string
    smsHref: string
    messagesThreadHref: string
    channelUsed: 'email' | 'sms_priority'
  } | null>(null)

  useEffect(() => {
    if (initialQuestion) {
      setQuestion(initialQuestion)
    }
  }, [initialQuestion])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      setErrorMsg(null)
      setDispatchResult(null)
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const postureState = typeof window !== 'undefined' ? loadPostureProfileState() : null
  const todayIso = getTodayIsoDate()
  const todayLog = postureState?.dailyLogs?.[todayIso]

  const mergedTelemetry: EscalationTelemetryContext = {
    optPhase: telemetryOverride?.optPhase ?? 2,
    jointComfortScore:
      telemetryOverride?.jointComfortScore ?? todayLog?.jointComfortScore ?? null,
    readinessIndex:
      telemetryOverride?.readinessIndex ?? todayLog?.readinessScore ?? null,
    postureFlags:
      telemetryOverride?.postureFlags ??
      postureState?.ergonomicFlags.map(f => f.replace(/_/g, ' ')) ??
      [],
    environmentProfile:
      telemetryOverride?.environmentProfile ??
      postureState?.environmentProfile ??
      'home_gym',
    expressModeActive:
      telemetryOverride?.expressModeActive ??
      Boolean(postureState?.expressModeActive),
    activeExercise: telemetryOverride?.activeExercise ?? null,
    safetyFlagActive: Boolean(telemetryOverride?.safetyFlagActive),
  }

  const isCoachSupport = tierId === 'coach_support'
  const expectedWindowLabel = isCoachSupport
    ? 'Priority 24h SLA · Direct SMS + Priority In-App Thread'
    : tierId === 'plus'
      ? 'Plus Direct Email · Expected reply within 1 business day'
      : 'Core Lab Direct Email · Expected reply within 24–48 business hours'

  const buildLocalMailtoFallback = () => {
    const subject = `[${isCoachSupport ? '24h Priority' : tierId === 'plus' ? 'Plus' : 'Core Lab'}] Forge Athletic Question for Coach Gordon`
    const body = `${question.trim() || 'Hi Coach Gordon — could you take a look at my latest training metrics?'}\n\n--- Forge Athletic Telemetry Summary ---\n• OPT Phase: Phase 0${mergedTelemetry.optPhase || 2}${mergedTelemetry.expressModeActive ? ' (20m Express)' : ''}\n• Joint Comfort: ${mergedTelemetry.jointComfortScore != null ? `${mergedTelemetry.jointComfortScore}/100` : 'Not logged'}\n• Readiness Index: ${mergedTelemetry.readinessIndex != null ? `${mergedTelemetry.readinessIndex}/100` : 'Pending'}\n• Posture/Desk Flags: ${mergedTelemetry.postureFlags?.length ? mergedTelemetry.postureFlags.join(', ') : 'Optimal'}${mergedTelemetry.activeExercise ? `\n• Exercise: ${mergedTelemetry.activeExercise}` : ''}`
    return `mailto:coach@forge-athletic.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const buildLocalSmsHref = () => {
    const smsText = `[Forge 24h Priority] ${(question.trim() || 'Quick check-in on my training today').slice(0, 180)} | Phase 0${mergedTelemetry.optPhase || 2} · Comfort ${mergedTelemetry.jointComfortScore ?? '—'}/100`
    return `sms:?&body=${encodeURIComponent(smsText)}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (question.trim().length < 3) {
      setErrorMsg('Please write a short note or question (at least 3 characters) for Coach Gordon.')
      return
    }
    setSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/coach/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId,
          channel: isCoachSupport ? 'sms_priority' : 'email',
          sourceContext,
          question: question.trim(),
          telemetrySummary: mergedTelemetry,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setErrorMsg(data?.error || 'Could not reach relay right now—use the 1-tap direct launch button below.')
      } else {
        setDispatchResult({
          slaBadge: data.slaBadge,
          responseWindowCopy: data.responseWindowCopy,
          mailtoHref: data.mailtoHref,
          smsHref: data.smsHref,
          messagesThreadHref: data.messagesThreadHref || '/dashboard/messages',
          channelUsed: data.channelUsed,
        })
      }
    } catch {
      setErrorMsg('Offline right now—tap below to open your email or SMS client with your telemetry pre-filled.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onClose={onClose}
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
      data-testid="coach-escalation-modal"
      className="forge-glass-modal m-0 h-dvh max-h-dvh w-screen max-w-none overscroll-contain p-0 text-zinc-100 sm:m-auto sm:h-auto sm:max-h-[92dvh] sm:w-[min(94vw,560px)] sm:rounded-2xl"
    >
      <div className="max-h-dvh overflow-y-auto overscroll-contain p-4 sm:max-h-[90dvh] sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3.5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10.5px] font-bold uppercase tracking-wider text-emerald-300">
                <ShieldCheck size={12} strokeWidth={1.85} aria-hidden="true" />
                {entitlements.name}
              </span>
              {isCoachSupport ? (
                <span className="rounded-full border border-amber-400/45 bg-amber-400/15 px-2.5 py-0.5 font-mono text-[10.5px] font-extrabold uppercase tracking-wider text-amber-300">
                  ⚡ 24h SLA · Direct SMS + Priority Thread
                </span>
              ) : (
                <span className="rounded-full border border-white/15 bg-[#181B22] px-2.5 py-0.5 font-mono text-[10.5px] font-semibold text-zinc-300">
                  Direct Email Channel
                </span>
              )}
            </div>
            <h2 id={headingId} className="mt-1.5 font-serif text-lg font-bold tracking-tight text-white">
              Message Real Coach Gordon
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-300">
              <Clock size={12} strokeWidth={1.75} className="shrink-0 text-emerald-300" aria-hidden="true" />
              <span>{expectedWindowLabel}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close message composer"
            className="forge-tactile-press inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#181B22] text-zinc-200 transition-colors hover:border-white/20 hover:bg-[#1D212A]"
          >
            <X size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        {/* Auto-Attached Sanitized Telemetry Card */}
        <div className="mt-3.5 rounded-xl border border-white/10 bg-[#111318] p-3">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-emerald-300">
            Auto-Attached Diagnostic Summary (Zero Raw Photos)
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            <div className="rounded-lg border border-white/[0.06] bg-[#181B22] px-2.5 py-1.5">
              <span className="block text-[10px] uppercase text-zinc-400">OPT™ Phase</span>
              <span className="font-mono font-bold tabular-nums text-white">
                Phase 0{mergedTelemetry.optPhase || 2}
                {mergedTelemetry.expressModeActive ? ' · 20m' : ''}
              </span>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-[#181B22] px-2.5 py-1.5">
              <span className="block text-[10px] uppercase text-zinc-400">Joint Comfort</span>
              <span className="font-mono font-bold tabular-nums text-emerald-300">
                {mergedTelemetry.jointComfortScore != null
                  ? `${mergedTelemetry.jointComfortScore}/100`
                  : 'Not logged'}
              </span>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-[#181B22] px-2.5 py-1.5">
              <span className="block text-[10px] uppercase text-zinc-400">Readiness</span>
              <span className="font-mono font-bold tabular-nums text-amber-300">
                {mergedTelemetry.readinessIndex != null
                  ? `${mergedTelemetry.readinessIndex}/100`
                  : 'Pending'}
              </span>
            </div>
          </div>
          {(mergedTelemetry.postureFlags && mergedTelemetry.postureFlags.length > 0) ||
          mergedTelemetry.activeExercise ? (
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-zinc-300">
              {mergedTelemetry.activeExercise ? (
                <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 font-medium text-sky-200">
                  Lift: {mergedTelemetry.activeExercise}
                </span>
              ) : null}
              {mergedTelemetry.postureFlags?.map(flag => (
                <span
                  key={flag}
                  className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-medium text-amber-200"
                >
                  Flag: {flag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Form or Confirmation */}
        {dispatchResult ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 space-y-3 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-4"
          >
            <div className="flex items-start gap-2.5">
              <CheckCircle2
                size={19}
                strokeWidth={1.85}
                className="mt-0.5 shrink-0 text-emerald-300"
                aria-hidden="true"
              />
              <div>
                <div className="text-sm font-bold text-white">
                  Sent to Coach Gordon ({dispatchResult.slaBadge})
                </div>
                <p className="mt-1 text-xs leading-relaxed text-zinc-200">
                  {dispatchResult.responseWindowCopy}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {isCoachSupport ? (
                <>
                  <a
                    href={dispatchResult.smsHref}
                    className="forge-tactile-press inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider text-zinc-950"
                  >
                    <Smartphone size={14} strokeWidth={1.85} aria-hidden="true" />
                    Open Native SMS Line
                  </a>
                  <Link
                    href={dispatchResult.messagesThreadHref}
                    onClick={onClose}
                    className="forge-tactile-press inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-[#181B22] px-3.5 py-2 text-xs font-bold text-white"
                  >
                    <MessageSquare size={14} strokeWidth={1.85} aria-hidden="true" />
                    Open 24h Priority Thread
                  </Link>
                </>
              ) : (
                <a
                  href={dispatchResult.mailtoHref}
                  className="forge-tactile-press inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-[#181B22] px-3.5 py-2 text-xs font-semibold text-zinc-100 hover:bg-[#1D212A]"
                >
                  <ExternalLink size={13} strokeWidth={1.8} aria-hidden="true" />
                  Also Open in Mail App
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="forge-tactile-press min-h-[44px] rounded-xl border border-white/15 bg-[#090A0D] px-4 py-2 text-xs font-semibold text-zinc-200"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label
                htmlFor={questionInputId}
                className="block text-xs font-bold text-zinc-200"
              >
                {isCoachSupport
                  ? 'Your Priority Note / Question for Coach Gordon'
                  : 'Your Direct Email Note to Coach Gordon'}
              </label>
              <textarea
                id={questionInputId}
                rows={4}
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="Tell Coach Gordon how a movement felt, ask for a form or travel adjustment, or flag any joint soreness..."
                className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#181B22] p-3 text-base text-white placeholder:text-zinc-500 focus:border-emerald-400/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
              />
            </div>

            {errorMsg ? (
              <div role="alert" className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                {errorMsg}
              </div>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={submitting}
                className="forge-tactile-press inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-zinc-950 shadow-[0_6px_20px_rgba(52,211,153,0.2)] transition-colors hover:bg-emerald-300 disabled:opacity-60"
              >
                <Send size={14} strokeWidth={1.85} aria-hidden="true" />
                <span>
                  {submitting
                    ? 'Sending to Coach Gordon…'
                    : isCoachSupport
                      ? 'Send Priority Text + 24h Thread'
                      : 'Send Direct Email to Coach Gordon'}
                </span>
              </button>

              {isCoachSupport ? (
                <a
                  href={buildLocalSmsHref()}
                  className="forge-tactile-press inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/12 px-3.5 py-2.5 text-xs font-bold text-amber-200 hover:bg-amber-500/20"
                >
                  <Smartphone size={14} strokeWidth={1.8} aria-hidden="true" />
                  1-Tap SMS App
                </a>
              ) : (
                <a
                  href={buildLocalMailtoFallback()}
                  className="forge-tactile-press inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-[#181B22] px-3.5 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-[#1D212A]"
                >
                  <Mail size={14} strokeWidth={1.8} aria-hidden="true" />
                  Open Mail App
                </a>
              )}
            </div>
          </form>
        )}
      </div>
    </dialog>
  )
}
