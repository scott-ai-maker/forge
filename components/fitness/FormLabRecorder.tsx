'use client'

import React, { useState } from 'react'
import { ArrowUpRight, Camera, CheckCircle2, Lock, Sparkles, Video } from 'lucide-react'
import { useTierAccess } from '@/lib/tierEntitlements'
import TierUpgradeModal from '@/components/packages/TierUpgradeModal'
import { playForgeTactileTone } from '@/lib/sfx-audio'
import { trackEvent } from '@/src/lib/telemetry/telemetryClient'

export interface FormLabRecorderProps {
  selectedLiftLabel?: string
  onSubmitted?: () => void
}

export default function FormLabRecorder({
  selectedLiftLabel = 'Primary Compound Lift',
  onSubmitted,
}: FormLabRecorderProps) {
  const { tierId, entitlements, remainingFormLabCredits, spendFormLabCredit } = useTierAccess()
  const [clipNotes, setClipNotes] = useState('')
  const [submittedClips, setSubmittedClips] = useState<
    Array<{ id: string; lift: string; note: string; status: string }>
  >([])
  const [submittedConfirmation, setSubmittedConfirmation] = useState<string | null>(null)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  const outOfCredits = remainingFormLabCredits <= 0
  const nextTierName = tierId === 'core_lab' ? 'Plus ($49/mo)' : 'Coach Support ($199/mo)'

  const handleSubmitForCoachReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (outOfCredits) {
      setUpgradeModalOpen(true)
      return
    }
    const result = spendFormLabCredit()
    if (!result.allowed) {
      setUpgradeModalOpen(true)
      return
    }
    playForgeTactileTone('success')
    const statusLabel = entitlements.priority24hSla ? '24h Priority Queue' : 'Telestrator Queue'
    const trimmedNote = clipNotes.trim()
    void trackEvent('form_lab_uploaded', {
      lift_name: selectedLiftLabel,
      camera_angle: 'front_45',
      priority_sla: Boolean(entitlements.priority24hSla),
      has_notes: trimmedNote.length > 0,
    })
    setSubmittedClips(prev => [
      {
        id: `${Date.now()}`,
        lift: selectedLiftLabel,
        note: trimmedNote || '45° front-diagonal working set (3–5 reps)',
        status: statusLabel,
      },
      ...prev,
    ])
    setSubmittedConfirmation(
      entitlements.priority24hSla
        ? `Priority 24h Form Lab review queued for Coach Gordon (${result.remaining} monthly credits left).`
        : `Form Lab clip queued for Coach Gordon telestrator review (${result.remaining} credits left).`
    )
    setClipNotes('')
    onSubmitted?.()
  }

  return (
    <section className="forge-surface-card rounded-2xl p-4 text-zinc-100 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
            <Video size={18} strokeWidth={1.75} />
          </span>
          <div>
            <div className="forge-eyebrow-micro text-emerald-300">
              Async Biomechanics · Form Lab
            </div>
            <div className="mt-0.5 text-sm font-bold tracking-tight text-white sm:text-base">
              Coach Gordon Form Lab Review Queue
            </div>
            <div className="text-xs text-zinc-400">{entitlements.formLabCreditLabel}</div>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-bold tabular-nums ${
            outOfCredits
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
          }`}
        >
          {remainingFormLabCredits} of {entitlements.monthlyFormLabCredits} Credits Remaining
        </span>
      </div>

      {/* Motivating Empty Form Lab Queue State: 45°-Angle Camera Setup Illustration + Coach Gordon's Tip */}
      {submittedClips.length === 0 ? (
        <div className="mt-4 grid grid-cols-1 items-center gap-4 rounded-2xl border border-white/10 bg-[#181B22]/85 p-3.5 sm:grid-cols-[188px_1fr] sm:p-4">
          {/* 45°-Angle Camera Setup Illustration (Athlete in fitted charcoal crewneck t-shirt, shorts & black shoes) */}
          <div className="relative mx-auto w-full max-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-[#090A0D] p-2">
            <svg
              viewBox="0 0 180 116"
              aria-label="45-degree front-diagonal camera setup illustration"
              className="h-auto w-full"
            >
              {/* Subtle studio floor perspective grid */}
              <line x1="12" y1="98" x2="168" y2="98" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              <line x1="36" y1="74" x2="156" y2="98" stroke="rgba(52,211,153,0.22)" strokeWidth="0.9" strokeDasharray="3 2" />
              <line x1="36" y1="74" x2="128" y2="28" stroke="rgba(52,211,153,0.38)" strokeWidth="0.9" strokeDasharray="3 2" />
              {/* Shaded 45° optical cone */}
              <polygon
                points="36,74 128,28 156,98"
                fill="rgba(16,185,129,0.08)"
              />

              {/* 45° Angle Arc Badge */}
              <path
                d="M 56 78 A 22 22 0 0 0 53 65"
                fill="none"
                stroke="#34D399"
                strokeWidth="1.2"
              />
              <rect x="57" y="62" width="24" height="12" rx="4" fill="rgba(9,10,13,0.9)" stroke="rgba(52,211,153,0.5)" strokeWidth="0.7" />
              <text x="69" y="70.5" textAnchor="middle" fill="#6EE7B7" fontSize="7.2" fontWeight="800" style={{ fontVariantNumeric: 'tabular-nums' }}>
                45°
              </text>

              {/* Hip-Height Phone Tripod (Left Foreground) */}
              <line x1="28" y1="76" x2="20" y2="98" stroke="#71717A" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="28" y1="76" x2="28" y2="98" stroke="#71717A" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="28" y1="76" x2="36" y2="98" stroke="#71717A" strokeWidth="1.6" strokeLinecap="round" />
              <rect x="23" y="62" width="10" height="15" rx="2.2" fill="#181B22" stroke="#34D399" strokeWidth="1.2" />
              <circle cx="33" cy="69" r="2" fill="#34D399" />

              {/* Athlete Performing Squat in Fitted Charcoal Performance Crewneck T-Shirt + Dark Shorts + Black Shoes */}
              <g>
                {/* Barbell across upper back */}
                <line x1="98" y1="44" x2="158" y2="44" stroke="#A1A1AA" strokeWidth="2.1" strokeLinecap="round" />
                <rect x="102" y="37" width="4.5" height="14" rx="1.2" fill="#3F3F46" stroke="#71717A" strokeWidth="0.7" />
                <rect x="149.5" y="37" width="4.5" height="14" rx="1.2" fill="#3F3F46" stroke="#71717A" strokeWidth="0.7" />

                {/* Head */}
                <circle cx="128" cy="33" r="6" fill="#52525B" stroke="#E4E4E7" strokeWidth="0.8" />

                {/* Fitted Charcoal Crewneck Performance T-Shirt Torso & Short Sleeves */}
                <path
                  d="M 118 42 Q 128 40 138 42 L 143 51 L 138 53 L 136 48 L 135 64 L 120 64 L 120 48 L 117 53 L 112 51 Z"
                  fill="#27272A"
                  stroke="#A1A1AA"
                  strokeWidth="0.85"
                  strokeLinejoin="round"
                />
                {/* Crewneck collar */}
                <path d="M 124 41.5 Q 128 44 132 41.5" fill="none" stroke="#E4E4E7" strokeWidth="0.9" />

                {/* Forearms gripping barbell */}
                <line x1="114" y1="51" x2="110" y2="44" stroke="#A1A1AA" strokeWidth="2" strokeLinecap="round" />
                <line x1="141" y1="51" x2="146" y2="44" stroke="#A1A1AA" strokeWidth="2" strokeLinecap="round" />

                {/* Athletic Training Shorts */}
                <path
                  d="M 120 64 L 135 64 L 139 76 L 130 76 L 127.5 70 L 125 76 L 116 76 Z"
                  fill="#181B22"
                  stroke="#71717A"
                  strokeWidth="0.85"
                />

                {/* Lower legs + Clean Black Training Shoes */}
                <line x1="120" y1="76" x2="119" y2="93" stroke="#A1A1AA" strokeWidth="2.4" strokeLinecap="round" />
                <line x1="135" y1="76" x2="137" y2="93" stroke="#A1A1AA" strokeWidth="2.4" strokeLinecap="round" />
                <rect x="113" y="93" width="10" height="4.2" rx="1.8" fill="#090A0D" stroke="#71717A" strokeWidth="0.8" />
                <rect x="133" y="93" width="10" height="4.2" rx="1.8" fill="#090A0D" stroke="#71717A" strokeWidth="0.8" />

                {/* Dual-ring CV joint nodes */}
                {[
                  { x: 128, y: 44 },
                  { x: 127, y: 65 },
                  { x: 120, y: 76 },
                  { x: 119, y: 93 },
                ].map((pt, i) => (
                  <g key={i}>
                    <circle cx={pt.x} cy={pt.y} r="3" fill="rgba(52,211,153,0.22)" />
                    <circle cx={pt.x} cy={pt.y} r="1.4" fill="#090A0D" stroke="#34D399" strokeWidth="0.8" />
                  </g>
                ))}
              </g>

              <text x="14" y="14" fill="#A1A1AA" fontSize="6.5" fontWeight="700" letterSpacing="0.08em">
                HIP-HEIGHT · 6–8 FT AWAY
              </text>
            </svg>
          </div>

          {/* Coach Gordon's Tip on What Lift to Film First */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-emerald-300">
                <Sparkles size={11} strokeWidth={1.75} /> Queue Empty · Ready for Your First Clip
              </span>
              <span className="font-mono text-[11px] font-semibold tabular-nums text-zinc-400">
                45° Front-Diagonal Setup
              </span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-200 sm:text-[13px]">
              <strong className="font-semibold text-white">Coach Gordon&apos;s Tip — What to Film First:</strong>{' '}
              Prop your phone at hip height 6–8 ft away at a <span className="font-mono text-emerald-300">45°</span> front-diagonal angle and film 3–5 working reps of your primary{' '}
              <strong className="text-white">Squat, Trap-Bar/Conventional Deadlift, or Overhead Press</strong> so ankles, knees, lumbar spine, and bar path stay fully visible.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {[
                '45° Squat Working Set (5 reps)',
                'Deadlift Hinge & Lockout Check',
                'Overhead Press Rib-Stack Check',
              ].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setClipNotes(preset)}
                  className="forge-tactile-press inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-white/10 bg-[#090A0D] px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition-colors duration-150 hover:border-emerald-400/35 hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                >
                  <Camera size={11} strokeWidth={1.75} className="text-emerald-400" />
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <ul className="mt-3.5 space-y-1.5">
          {submittedClips.map(clip => (
            <li
              key={clip.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/25 bg-[#181B22] px-3.5 py-2.5 text-xs"
            >
              <div className="min-w-0">
                <span className="font-semibold text-white">{clip.lift}</span>
                <span className="ml-2 text-zinc-400">· {clip.note}</span>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10.5px] font-semibold text-emerald-300">
                {clip.status}
              </span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmitForCoachReview} className="mt-3.5 flex flex-col gap-2.5 sm:flex-row">
        <input
          type="text"
          value={clipNotes}
          onChange={e => setClipNotes(e.target.value)}
          placeholder={`Optional note for Coach Gordon on ${selectedLiftLabel} (e.g., bottom hip shift)…`}
          aria-label="Form Lab coaching note"
          className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-white/10 bg-[#181B22] px-3.5 py-2 text-base text-white placeholder:text-zinc-500 transition-colors duration-150 hover:border-white/15 focus:border-emerald-400/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
        />

        {outOfCredits && tierId !== 'coach_support' ? (
          <button
            type="button"
            onClick={() => setUpgradeModalOpen(true)}
            className="forge-tactile-press inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 transition-colors duration-150 hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
          >
            <Lock size={13} strokeWidth={1.75} /> Unlock More Reviews in {nextTierName} <ArrowUpRight size={14} strokeWidth={1.75} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={outOfCredits}
            className="forge-tactile-press inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.08em] tabular-nums text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors duration-150 hover:bg-emerald-300 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
          >
            Submit Clip to Form Lab ({remainingFormLabCredits} Left)
          </button>
        )}
      </form>

      {submittedConfirmation ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-200">
          <CheckCircle2 size={15} strokeWidth={1.75} className="shrink-0 text-emerald-300" />
          <span className="tabular-nums">{submittedConfirmation}</span>
        </div>
      ) : null}

      <TierUpgradeModal
        open={upgradeModalOpen}
        triggerContext="form_lab_credit_depletion"
        currentTier={tierId}
        onClose={() => setUpgradeModalOpen(false)}
      />
    </section>
  )
}
