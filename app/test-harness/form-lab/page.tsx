'use client'

import React, { useEffect, useState } from 'react'
import VideoCritiqueStudio from '@/components/fitness/VideoCritiqueStudio'
import LiveVideoFormCaptureModal from '@/components/fitness/tracker/LiveVideoFormCaptureModal'
import LiveTelestratorCanvas, {
  type TelestratorColor,
  type TelestratorTool,
} from '@/components/coach/LiveTelestratorCanvas'
import {
  type ForgeTierId,
  resetFormLabCreditsForQa,
  setStoredTierId,
  useTierAccess,
} from '@/lib/tierEntitlements'
import type { LiftType } from '@/lib/video-form-analysis'

export const dynamic = 'force-dynamic'

export default function FormLabTestHarnessPage() {
  const { tierId, remainingFormLabCredits } = useTierAccess()
  const [hydrated, setHydrated] = useState(false)
  const [meterUsage, setMeterUsage] = useState(false)
  const [usageConsumedCount, setUsageConsumedCount] = useState(0)
  const [usageBlockedCount, setUsageBlockedCount] = useState(0)

  const [liveCaptureOpen, setLiveCaptureOpen] = useState(false)
  const [liveCaptureExercise, setLiveCaptureExercise] = useState('Dumbbell RDL')
  const [savedSetNotes, setSavedSetNotes] = useState<string | null>(null)
  const [handedOffLift, setHandedOffLift] = useState<LiftType | null>(null)

  const [telestratorActive, setTelestratorActive] = useState(true)
  const [telestratorTool, setTelestratorTool] = useState<TelestratorTool>('pen')
  const [telestratorColor, setTelestratorColor] = useState<TelestratorColor>('#D4AF37')

  useEffect(() => {
    setHydrated(true)
  }, [])

  const handleSelectTier = (nextTier: ForgeTierId) => {
    setStoredTierId(nextTier)
  }

  return (
    <div
      data-testid="form-lab-harness"
      data-hydrated={hydrated ? 'true' : 'false'}
      className="mx-auto max-w-5xl space-y-6 px-3 py-6 text-zinc-100 sm:px-6"
    >
      {/* Harness Control Deck */}
      <section
        aria-label="Form Lab Diagnostics Controls"
        className="forge-surface-card rounded-2xl p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="forge-eyebrow-micro text-emerald-300">
              Feature #8 Diagnostics Harness
            </div>
            <h1 className="mt-1 text-lg font-bold text-white sm:text-xl">
              Form Lab Video Recorder &amp; Async Coach Critique Studio
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              data-testid="harness-active-tier"
              className="rounded-full border border-white/15 bg-[#181B22] px-3 py-1.5 font-mono font-semibold text-zinc-200"
            >
              Tier: {tierId} ({remainingFormLabCredits} left)
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(['core_lab', 'plus', 'coach_support'] as ForgeTierId[]).map(tier => (
            <button
              key={tier}
              type="button"
              aria-pressed={tierId === tier}
              onClick={() => handleSelectTier(tier)}
              className={`inline-flex min-h-[44px] items-center rounded-xl border px-3.5 py-2 text-xs font-bold uppercase tracking-[0.06em] ${
                tierId === tier
                  ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300'
                  : 'border-white/10 bg-[#181B22] text-zinc-300'
              }`}
            >
              Set Tier: {tier}
            </button>
          ))}

          <button
            type="button"
            onClick={() => resetFormLabCreditsForQa()}
            className="inline-flex min-h-[44px] items-center rounded-xl border border-white/15 bg-[#181B22] px-3.5 py-2 text-xs font-bold text-zinc-200"
          >
            Reset Form Lab Credits
          </button>

          <button
            type="button"
            aria-pressed={meterUsage}
            onClick={() => setMeterUsage(v => !v)}
            className={`inline-flex min-h-[44px] items-center rounded-xl border px-3.5 py-2 text-xs font-bold ${
              meterUsage
                ? 'border-sky-400/50 bg-sky-500/15 text-sky-300'
                : 'border-white/10 bg-[#181B22] text-zinc-300'
            }`}
          >
            API Metering: {meterUsage ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={() => {
              setLiveCaptureExercise('Dumbbell RDL')
              setLiveCaptureOpen(true)
            }}
            className="inline-flex min-h-[44px] items-center rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3.5 py-2 text-xs font-bold text-cyan-200"
          >
            Open In-Workout Form Cam (Dumbbell RDL)
          </button>
        </div>

        {(usageConsumedCount > 0 || usageBlockedCount > 0 || savedSetNotes || handedOffLift) && (
          <div className="mt-3 grid gap-1.5 rounded-xl border border-white/10 bg-[#090A0D] p-3 text-xs text-zinc-300">
            <div data-testid="harness-usage-counters">
              Consumed: {usageConsumedCount} · Blocked: {usageBlockedCount}
            </div>
            {savedSetNotes && (
              <div data-testid="saved-set-notes" className="text-emerald-300">
                {savedSetNotes}
              </div>
            )}
            {handedOffLift && (
              <div data-testid="handed-off-lift" className="text-sky-300">
                Handed Off Lift: {handedOffLift}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Primary Video Critique Studio + Embedded FormLabRecorder */}
      <VideoCritiqueStudio
        initialLift={handedOffLift ?? undefined}
        meterUsage={meterUsage}
        onUsageConsumed={() => setUsageConsumedCount(c => c + 1)}
        onUsageBlocked={() => setUsageBlockedCount(c => c + 1)}
      />

      {/* Coach Telestrator Markup Canvas Stage */}
      <section
        aria-label="Coach Telestrator Markup Preview"
        className="forge-surface-card rounded-2xl p-4 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="forge-eyebrow-micro text-amber-300">
              Coach Critique Studio · Telestrator Vector HUD
            </div>
            <h2 className="mt-0.5 text-base font-bold text-white">
              Asynchronous Coach Frame Markup Stage
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'pen', label: 'Pen' },
                { id: 'arrow', label: 'Vector' },
                { id: 'circle', label: 'Fault Circle' },
                { id: 'protractor', label: '3-Pt Angle' },
              ] as Array<{ id: TelestratorTool; label: string }>
            ).map(tool => (
              <button
                key={tool.id}
                type="button"
                aria-pressed={telestratorTool === tool.id}
                onClick={() => {
                  setTelestratorActive(true)
                  setTelestratorTool(tool.id)
                }}
                className={`inline-flex min-h-[44px] items-center rounded-xl border px-3 py-2 text-xs font-bold ${
                  telestratorTool === tool.id
                    ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
                    : 'border-white/10 bg-[#181B22] text-zinc-300'
                }`}
              >
                {tool.label}
              </button>
            ))}

            {(
              [
                { color: '#D4AF37', name: 'Gold' },
                { color: '#10B981', name: 'Emerald' },
                { color: '#EF4444', name: 'Ruby' },
              ] as Array<{ color: TelestratorColor; name: string }>
            ).map(swatch => (
              <button
                key={swatch.color}
                type="button"
                aria-pressed={telestratorColor === swatch.color}
                onClick={() => setTelestratorColor(swatch.color)}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/15 bg-[#181B22] px-3 py-2 text-xs font-semibold text-zinc-200"
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: swatch.color,
                  }}
                />
                {swatch.name}
              </button>
            ))}
          </div>
        </div>

        <div
          data-testid="harness-telestrator-stage"
          className="relative mt-3 aspect-video w-full overflow-hidden rounded-xl border border-white/15 bg-[#090A0D]"
        >
          <div className="pointer-events-none flex h-full w-full items-center justify-center text-xs text-zinc-500">
            45° Working-Set Frame Buffer · Draw Vectors or 3-Point Joint Angles
          </div>
          <LiveTelestratorCanvas
            isActive={telestratorActive}
            activeTool={telestratorTool}
            activeColor={telestratorColor}
          />
        </div>
      </section>

      {/* In-Workout Live Video Form Capture Modal */}
      <LiveVideoFormCaptureModal
        exerciseName={liveCaptureExercise}
        isOpen={liveCaptureOpen}
        onClose={() => setLiveCaptureOpen(false)}
        onApplyNotes={notes => setSavedSetNotes(notes)}
        onOpenCorrectiveLab={lift => setHandedOffLift(lift)}
      />
    </div>
  )
}
