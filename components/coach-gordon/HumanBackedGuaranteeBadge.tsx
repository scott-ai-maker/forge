'use client'

import React, { useState } from 'react'
import { Mail, MessageSquare, ShieldCheck, Smartphone } from 'lucide-react'
import { useTierAccess } from '@/lib/tierEntitlements'
import CoachEscalationModal, { type EscalationTelemetryContext } from './CoachEscalationModal'
import AudioModeSelector from '@/components/audio/AudioModeSelector'

export interface HumanBackedGuaranteeBadgeProps {
  optPhase?: number | null
  activeExercise?: string | null
  onOpenCoachAssistant?: () => void
}

export default function HumanBackedGuaranteeBadge({
  optPhase = 2,
  activeExercise = null,
  onOpenCoachAssistant,
}: HumanBackedGuaranteeBadgeProps) {
  const { tierId } = useTierAccess()
  const [escalationOpen, setEscalationOpen] = useState(false)
  const isCoachSupport = tierId === 'coach_support'

  const telemetryOverride: EscalationTelemetryContext = {
    optPhase,
    activeExercise,
  }

  return (
    <>
      <div
        data-testid="human-backed-guarantee-badge"
        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-500/20 bg-[#111318] px-3.5 py-2.5 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/12 text-emerald-300">
            <ShieldCheck size={15} strokeWidth={1.85} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-300">
              Human-Backed Guarantee
            </div>
            <p className="truncate text-xs font-medium text-zinc-200">
              AI guides every rep · Coach Gordon is 1 tap away
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <AudioModeSelector compact />

          {onOpenCoachAssistant ? (
            <button
              type="button"
              onClick={onOpenCoachAssistant}
              className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/12 bg-[#181B22] px-3 py-2 text-xs font-bold text-zinc-100 transition-colors hover:border-white/20 hover:bg-[#1D212A]"
            >
              <MessageSquare size={13} strokeWidth={1.8} className="text-emerald-300" aria-hidden="true" />
              <span>Coach AI</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setEscalationOpen(true)}
            data-testid="dashboard-message-real-coach-btn"
            className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/12 px-3 py-2 text-xs font-bold text-emerald-200 transition-colors hover:bg-emerald-500/20"
          >
            {isCoachSupport ? (
              <Smartphone size={13} strokeWidth={1.85} aria-hidden="true" />
            ) : (
              <Mail size={13} strokeWidth={1.85} aria-hidden="true" />
            )}
            <span>{isCoachSupport ? 'Text Coach (24h)' : 'Message Real Coach Gordon'}</span>
          </button>
        </div>
      </div>

      <CoachEscalationModal
        open={escalationOpen}
        onClose={() => setEscalationOpen(false)}
        sourceContext="dashboard_guarantee"
        telemetryOverride={telemetryOverride}
      />
    </>
  )
}
