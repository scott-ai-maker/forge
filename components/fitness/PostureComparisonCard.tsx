'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import {
  ArrowUpRight,
  Bell,
  Check,
  Columns,
  GripVertical,
  Layers,
  Maximize2,
  ScanLine,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react'
import {
  loadPostureProfileState,
  POSTURE_PROFILE_EVENT,
  runQuickPostureCheckDelta,
} from '@/lib/posture-profile-state'
import { getUpgradeTriggerCopy, useTierAccess } from '@/lib/tierEntitlements'
import TierUpgradeModal from '@/components/packages/TierUpgradeModal'
import { playForgeTactileTone } from '@/lib/sfx-audio'

export interface PostureComparisonViewerProps {
  sandboxMode?: boolean
  onRequestUpgrade?: () => void
  showPostScanBanner?: boolean
}

const DAY30_REMINDER_KEY = 'forge_posture_day30_reminder_v1'

function PostureSilhouetteSvg({
  variant,
  opacity = 1,
}: {
  variant: 'baseline' | 'current' | 'day30_ghost'
  opacity?: number
}) {
  const isBaseline = variant === 'baseline'
  const isGhost = variant === 'day30_ghost'
  const headCx = isBaseline ? 117 : 101
  const shoulderX = isBaseline ? 108 : 100
  const elbowX = isBaseline ? 104 : 99
  const wristX = isBaseline ? 109 : 101
  const hipX = 100
  const kneeX = 101
  const ankleX = 100
  const strokeColor = isBaseline ? '#FBBF24' : '#34D399'
  const glowColor = isBaseline ? 'rgba(251,191,36,0.22)' : 'rgba(52,211,153,0.22)'
  const glowFilterId = `mesh-glow-${variant}`

  return (
    <svg
      viewBox="0 0 280 260"
      className="h-full w-full select-none"
      style={{ opacity }}
      aria-hidden="true"
    >
      <defs>
        <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {[40, 80, 120, 160, 200, 240].map(gx => (
        <line key={`vx-${gx}`} x1={gx} y1={10} x2={gx} y2={250} stroke="rgba(255,255,255,0.035)" strokeWidth={0.8} />
      ))}
      {[44, 88, 132, 176, 220].map(gy => (
        <line key={`hy-${gy}`} x1={16} y1={gy} x2={264} y2={gy} stroke="rgba(255,255,255,0.035)" strokeWidth={0.8} />
      ))}

      <path
        d="M 20 28 L 20 16 L 32 16 M 248 16 L 260 16 L 260 28 M 20 232 L 20 244 L 32 244 M 248 244 L 260 244 L 260 232"
        fill="none"
        stroke={isGhost ? 'rgba(52,211,153,0.4)' : isBaseline ? 'rgba(251,191,36,0.5)' : 'rgba(52,211,153,0.6)'}
        strokeWidth={1.4}
        strokeLinecap="round"
      />

      <ellipse cx={140} cy={135} rx={52} ry={95} fill={glowColor} opacity={isGhost ? 0.16 : 0.32} />

      <line
        x1={140}
        y1={14}
        x2={140}
        y2={246}
        stroke="rgba(56,189,248,0.45)"
        strokeWidth={1.1}
        strokeDasharray="4 3"
      />

      <g transform="translate(40, 0)">
        {/* Fitted Dark Slate Crewneck Athletic Shirt & Shorts (Strict Wardrobe Standard) */}
        <path
          d={`M ${shoulderX - 22} 72 Q ${shoulderX} 65 ${shoulderX + 22} 72 L ${hipX + 18} 144 L ${hipX - 18} 144 Z`}
          fill={isGhost ? 'rgba(24,27,34,0.35)' : '#181B22'}
          stroke={isGhost ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.18)'}
          strokeWidth={1.1}
          strokeDasharray={isGhost ? '4 3' : undefined}
        />
        <path
          d={`M ${shoulderX - 22} 72 L ${shoulderX - 30} 102 L ${shoulderX - 17} 105 L ${shoulderX - 14} 82 Z`}
          fill={isGhost ? 'rgba(24,27,34,0.3)' : '#181B22'}
          stroke={isGhost ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.14)'}
          strokeWidth={0.9}
          strokeDasharray={isGhost ? '3 3' : undefined}
        />
        <path
          d={`M ${shoulderX + 22} 72 L ${shoulderX + 30} 102 L ${shoulderX + 17} 105 L ${shoulderX + 14} 82 Z`}
          fill={isGhost ? 'rgba(24,27,34,0.3)' : '#181B22'}
          stroke={isGhost ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.14)'}
          strokeWidth={0.9}
          strokeDasharray={isGhost ? '3 3' : undefined}
        />
        <path
          d={`M ${hipX - 18} 144 L ${hipX + 18} 144 L ${kneeX + 15} 186 L ${hipX + 2} 186 L ${hipX} 163 L ${hipX - 2} 186 L ${kneeX - 15} 186 Z`}
          fill={isGhost ? 'rgba(17,19,24,0.35)' : '#111318'}
          stroke={isGhost ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.15)'}
          strokeWidth={1}
          strokeDasharray={isGhost ? '4 3' : undefined}
        />

        <line x1={kneeX - 8} y1={186} x2={ankleX - 8} y2={234} stroke={isGhost ? 'rgba(52,211,153,0.3)' : '#272B36'} strokeWidth={6} strokeLinecap="round" strokeDasharray={isGhost ? '4 4' : undefined} />
        <line x1={kneeX + 8} y1={186} x2={ankleX + 8} y2={234} stroke={isGhost ? 'rgba(52,211,153,0.3)' : '#272B36'} strokeWidth={6} strokeLinecap="round" strokeDasharray={isGhost ? '4 4' : undefined} />

        <circle
          cx={headCx}
          cy={43}
          r={14.5}
          fill={isGhost ? 'rgba(24,27,34,0.3)' : '#181B22'}
          stroke={strokeColor}
          strokeWidth={1.6}
          strokeDasharray={isGhost ? '4 3' : undefined}
        />

        <polygon
          points={`${shoulderX - 16},78 ${shoulderX + 16},78 ${hipX + 13},144 ${hipX - 13},144`}
          fill={glowColor}
          fillOpacity={isGhost ? 0.35 : 0.7}
          stroke={strokeColor}
          strokeOpacity={isGhost ? 0.45 : 0.55}
          strokeWidth={0.95}
          strokeDasharray={isGhost ? '3 2.5' : undefined}
        />
        <line x1={shoulderX - 16} y1={78} x2={hipX + 13} y2={144} stroke={strokeColor} strokeOpacity={0.28} strokeWidth={0.8} />
        <line x1={shoulderX + 16} y1={78} x2={hipX - 13} y2={144} stroke={strokeColor} strokeOpacity={0.28} strokeWidth={0.8} />

        <polyline
          points={`${headCx},43 ${shoulderX},78 ${hipX},144 ${kneeX},194 ${ankleX},236`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={isGhost ? '4 3' : undefined}
          filter={`url(#${glowFilterId})`}
        />
        <polyline
          points={`${shoulderX},78 ${elbowX},112 ${wristX},142`}
          fill="none"
          stroke={strokeColor}
          strokeOpacity={0.78}
          strokeWidth={1.6}
          strokeDasharray="3 2"
        />

        {/* Dark Pill Degree Badge Over Anatomical Landmark */}
        <line x1={headCx + 15} y1={43} x2={headCx + 38} y2={35} stroke={strokeColor} strokeWidth={0.95} />
        <rect
          x={headCx + 38}
          y={24}
          width={62}
          height={18}
          rx={5}
          fill="rgba(9, 10, 13, 0.85)"
          stroke={strokeColor}
          strokeOpacity={0.75}
          strokeWidth={0.9}
        />
        <text
          x={headCx + 69}
          y={35.5}
          textAnchor="middle"
          fill={isGhost ? '#6EE7B7' : '#F8FAFC'}
          fontSize="7.8"
          fontFamily="monospace"
          fontWeight="700"
        >
          {isGhost ? 'TARGET ≤4°' : isBaseline ? 'CVA +8.9°' : 'CVA +4.4°'}
        </text>

        {/* Dual-Ring Joint Nodes (Solid Core + Translucent Outer Halo + Confidence Opacity) */}
        {[
          { x: headCx, y: 43, conf: 0.98 },
          { x: shoulderX, y: 78, conf: 0.96 },
          { x: shoulderX - 16, y: 78, conf: 0.92 },
          { x: shoulderX + 16, y: 78, conf: 0.92 },
          { x: elbowX, y: 112, conf: 0.88 },
          { x: hipX, y: 144, conf: 0.96 },
          { x: hipX - 13, y: 144, conf: 0.9 },
          { x: hipX + 13, y: 144, conf: 0.9 },
          { x: kneeX, y: 194, conf: 0.94 },
          { x: ankleX, y: 236, conf: 0.9 },
        ].map((pt, idx) => (
          <g key={idx} opacity={isGhost ? 0.55 : pt.conf}>
            <circle cx={pt.x} cy={pt.y} r={5.6} fill={strokeColor} fillOpacity={0.22} />
            <circle cx={pt.x} cy={pt.y} r={2.8} fill={strokeColor} stroke="#090A0D" strokeWidth={1.1} />
          </g>
        ))}
      </g>
    </svg>
  )
}

export function PostureComparisonInteractiveStage({
  sandboxMode = false,
  onRequestUpgrade,
  showPostScanBanner = false,
}: PostureComparisonViewerProps) {
  const [viewMode, setViewMode] = useState<'overlay' | 'side_by_side' | 'day1_preview'>('overlay')
  const [splitPct, setSplitPct] = useState(54)
  const [delta, setDelta] = useState(() => loadPostureProfileState().postureDelta)
  const [day30ReminderArmed, setDay30ReminderArmed] = useState(false)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef(false)

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem(DAY30_REMINDER_KEY) === '1') {
        setDay30ReminderArmed(true)
      }
    } catch {
      // ignore
    }
  }, [])

  const handleRunQuickScan = () => {
    const updated = runQuickPostureCheckDelta()
    setDelta(updated)
    if (viewMode === 'day1_preview') {
      setViewMode('overlay')
    }
    playForgeTactileTone('success')
  }

  const handleArmDay30Reminder = () => {
    const next = !day30ReminderArmed
    setDay30ReminderArmed(next)
    try {
      if (typeof window !== 'undefined') {
        if (next) localStorage.setItem(DAY30_REMINDER_KEY, '1')
        else localStorage.removeItem(DAY30_REMINDER_KEY)
      }
    } catch {
      // ignore
    }
    playForgeTactileTone('chime')
  }

  const updateSplitFromClientX = (clientX: number) => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect || rect.width <= 0) return
    const rawPct = ((clientX - rect.left) / rect.width) * 100
    setSplitPct(Math.round(Math.max(6, Math.min(94, rawPct))))
  }

  const baselineDeg = 8.9
  const currentDeg = Number(Math.max(1.5, baselineDeg + delta.forwardHeadDeltaDeg).toFixed(1))
  const postScanCopy = getUpgradeTriggerCopy('post_scan_flag', 'core_lab')

  return (
    <div className="space-y-3.5 text-zinc-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="group"
          aria-label="Posture comparison view mode"
          className="inline-flex flex-wrap rounded-xl border border-white/[0.08] bg-[#090A0D] p-1"
        >
          <button
            type="button"
            onClick={() => setViewMode('overlay')}
            aria-pressed={viewMode === 'overlay'}
            className={`forge-tactile-press inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors duration-150 ${
              viewMode === 'overlay'
                ? 'bg-[#181B22] text-emerald-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers size={13} strokeWidth={1.75} aria-hidden="true" /> Overlay Slider
          </button>
          <button
            type="button"
            onClick={() => setViewMode('side_by_side')}
            aria-pressed={viewMode === 'side_by_side'}
            className={`forge-tactile-press inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors duration-150 ${
              viewMode === 'side_by_side'
                ? 'bg-[#181B22] text-emerald-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Columns size={13} strokeWidth={1.75} aria-hidden="true" /> Side-by-Side
          </button>
          <button
            type="button"
            onClick={() => setViewMode('day1_preview')}
            aria-pressed={viewMode === 'day1_preview'}
            className={`forge-tactile-press inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors duration-150 ${
              viewMode === 'day1_preview'
                ? 'bg-[#181B22] text-emerald-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UserCheck size={13} strokeWidth={1.75} aria-hidden="true" /> Day-1 vs Day-30
          </button>
        </div>

        <button
          type="button"
          onClick={handleRunQuickScan}
          className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300 transition-colors duration-150 hover:border-emerald-400/40 hover:bg-emerald-500/18"
        >
          <ScanLine size={14} strokeWidth={1.75} aria-hidden="true" /> Run 2-Min Quick Check
        </button>
      </div>

      {viewMode === 'overlay' ? (
        <div
          ref={stageRef}
          onPointerDown={e => {
            if ((e.target as HTMLElement).tagName === 'INPUT') return
            draggingRef.current = true
            e.currentTarget.setPointerCapture?.(e.pointerId)
            updateSplitFromClientX(e.clientX)
          }}
          onPointerMove={e => {
            if (!draggingRef.current) return
            updateSplitFromClientX(e.clientX)
          }}
          onPointerUp={() => {
            draggingRef.current = false
          }}
          onPointerCancel={() => {
            draggingRef.current = false
          }}
          style={{ touchAction: 'pan-y' }}
          className="relative h-64 w-full cursor-ew-resize overflow-hidden rounded-2xl border border-white/[0.08] bg-[#090A0D] sm:h-72"
        >
          <div className="absolute inset-0 flex items-center justify-center p-3">
            <PostureSilhouetteSvg variant="current" />
          </div>

          <div
            className="absolute inset-0 flex items-center justify-center bg-[#0D1017]/95 p-3"
            style={{ clipPath: `inset(0 ${100 - splitPct}% 0 0)` }}
          >
            <PostureSilhouetteSvg variant="baseline" />
          </div>

          {/* Vertical Laser-Hairline Divider + 44px Circular Thumb Grip */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-px bg-gradient-to-b from-emerald-300/30 via-emerald-400 to-emerald-300/30 shadow-[0_0_12px_rgba(52,211,153,0.9)]"
            style={{ left: `${splitPct}%` }}
          >
            <div className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-400/60 bg-[#111318]/90 text-emerald-300 shadow-[0_4px_18px_rgba(0,0,0,0.75),0_0_16px_rgba(52,211,153,0.3)] backdrop-blur-md">
              <GripVertical size={16} strokeWidth={1.75} />
            </div>
          </div>

          <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-amber-500/30 bg-black/75 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider tabular-nums text-amber-300 backdrop-blur-md">
            Baseline ({baselineDeg}°)
          </div>
          <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-emerald-500/30 bg-black/75 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider tabular-nums text-emerald-300 backdrop-blur-md">
            Current ({currentDeg}°)
          </div>

          <div className="absolute inset-x-3 bottom-2.5 rounded-xl border border-white/10 bg-[#111318]/85 px-3.5 py-2 backdrop-blur-xl">
            <label className="flex items-center gap-3 text-[11px] font-semibold text-zinc-200">
              <span className="shrink-0">Scrub Mesh</span>
              <input
                type="range"
                min={6}
                max={94}
                value={splitPct}
                onChange={e => setSplitPct(Number(e.target.value))}
                aria-label="Compare baseline and current 33-point posture alignment"
                style={{ touchAction: 'pan-y' }}
                className="h-2 flex-1 cursor-ew-resize accent-emerald-400"
              />
              <span className="w-10 text-right font-mono font-bold tabular-nums text-emerald-300">
                {splitPct}%
              </span>
            </label>
          </div>
        </div>
      ) : viewMode === 'side_by_side' ? (
        <div className="grid h-64 grid-cols-2 gap-2.5 sm:h-72">
          <div className="relative flex flex-col items-center justify-center rounded-2xl border border-amber-500/25 bg-[#090A0D] p-2">
            <span className="absolute left-2.5 top-2.5 rounded-full border border-amber-500/30 bg-black/75 px-2.5 py-0.5 font-mono text-[10px] font-bold tabular-nums text-amber-300 backdrop-blur-md">
              Baseline · {baselineDeg}°
            </span>
            <PostureSilhouetteSvg variant="baseline" />
          </div>
          <div className="relative flex flex-col items-center justify-center rounded-2xl border border-emerald-500/25 bg-[#090A0D] p-2">
            <span className="absolute left-2.5 top-2.5 rounded-full border border-emerald-500/30 bg-black/75 px-2.5 py-0.5 font-mono text-[10px] font-bold tabular-nums text-emerald-300 backdrop-blur-md">
              Current · {currentDeg}°
            </span>
            <PostureSilhouetteSvg variant="current" />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-[#090A0D] p-3.5 sm:p-4">
          <div className="grid h-56 grid-cols-2 gap-2.5 sm:h-64">
            <div className="relative flex flex-col items-center justify-center rounded-xl border border-amber-500/25 bg-[#111318] p-2">
              <span className="absolute left-2.5 top-2.5 rounded-full border border-amber-500/30 bg-black/75 px-2.5 py-0.5 font-mono text-[10px] font-bold tabular-nums text-amber-300 backdrop-blur-md">
                Day-1 Baseline ({baselineDeg}°)
              </span>
              <PostureSilhouetteSvg variant="baseline" />
            </div>

            <div className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-500/35 bg-[#111318]/50 p-2">
              <span className="absolute left-2.5 top-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Day-30 Target Preview
              </span>
              <PostureSilhouetteSvg variant="day30_ghost" />
            </div>
          </div>

          <div className="mt-3 flex flex-col justify-between gap-2.5 rounded-xl border border-white/[0.07] bg-[#111318] p-3 sm:flex-row sm:items-center">
            <div className="text-xs leading-relaxed text-zinc-300">
              <strong className="text-white">Day-1 Baseline Locked:</strong> Consistent 5-minute desk
              resets and Phase 01 stabilization typically reduce forward-head drift by{' '}
              <span className="font-mono font-bold tabular-nums text-emerald-300">3.5°–5.0°</span> in
              30 days.
            </div>
            <button
              type="button"
              onClick={handleArmDay30Reminder}
              aria-pressed={day30ReminderArmed}
              className={`forge-tactile-press inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors duration-150 ${
                day30ReminderArmed
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                  : 'border-white/12 bg-[#181B22] text-white hover:border-white/20 hover:bg-[#1D212A]'
              }`}
            >
              {day30ReminderArmed ? (
                <>
                  <Check size={14} strokeWidth={1.75} aria-hidden="true" /> Day-30 Reminder Set
                </>
              ) : (
                <>
                  <Bell size={14} strokeWidth={1.75} aria-hidden="true" /> Set Day-30 Reminder
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-xl border border-white/[0.07] bg-[#181B22] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
            Forward Head
          </div>
          <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-emerald-300">
            {delta.forwardHeadDeltaDeg.toFixed(1)}°
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-[#181B22] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
            Posture Score
          </div>
          <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-white">
            {delta.overallPostureScore}/100
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-[#181B22] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
            Pelvic Drift
          </div>
          <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-amber-300">
            {delta.pelvicTiltDeltaDeg.toFixed(1)}° ({delta.strainFlag.toUpperCase()})
          </div>
        </div>
      </div>

      {!sandboxMode && showPostScanBanner && delta.strainFlag !== 'optimal' ? (
        <div className="flex flex-col justify-between gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2 text-xs text-amber-100">
            <Sparkles size={15} strokeWidth={1.75} className="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
            <span>{postScanCopy.bannerCopy}</span>
          </div>
          <button
            type="button"
            onClick={onRequestUpgrade}
            className="forge-tactile-press inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider text-[#090A0D] transition-colors duration-150 hover:bg-amber-300"
          >
            Upgrade to Plus <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  )
}

export interface PostureComparisonCardProps {
  sandboxMode?: boolean
  externalModalOpen?: boolean
  onExternalModalClose?: () => void
}

export default function PostureComparisonCard({
  sandboxMode = false,
  externalModalOpen = false,
  onExternalModalClose,
}: PostureComparisonCardProps) {
  const { tierId, shouldShowTrigger } = useTierAccess()
  const [modalOpen, setModalOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [delta, setDelta] = useState(() => loadPostureProfileState().postureDelta)
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()

  const isDialogShown = modalOpen || externalModalOpen

  useEffect(() => {
    if (sandboxMode) return
    const sync = () => setDelta(loadPostureProfileState().postureDelta)
    sync()
    window.addEventListener(POSTURE_PROFILE_EVENT, sync)
    return () => window.removeEventListener(POSTURE_PROFILE_EVENT, sync)
  }, [sandboxMode])

  useEffect(() => {
    if (sandboxMode) return
    const dialog = dialogRef.current
    if (!dialog) return
    if (isDialogShown && !dialog.open) {
      dialog.showModal()
    } else if (!isDialogShown && dialog.open) {
      dialog.close()
    }
  }, [isDialogShown, sandboxMode])

  if (sandboxMode) {
    return <PostureComparisonInteractiveStage sandboxMode />
  }

  const closeFullScreenModal = () => {
    setModalOpen(false)
    onExternalModalClose?.()
  }

  const baselineDeg = 8.9
  const currentDeg = Number(Math.max(1.5, baselineDeg + delta.forwardHeadDeltaDeg).toFixed(1))
  const showPostScanBanner = shouldShowTrigger('post_scan_flag') && delta.strainFlag !== 'optimal'

  return (
    <>
      <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-4 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
              33-Point Posture Mesh Delta
            </div>
            <div className="mt-0.5 text-sm font-bold tabular-nums text-white">
              Forward Head {delta.forwardHeadDeltaDeg.toFixed(1)}° · Score {delta.overallPostureScore}/100
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="forge-tactile-press inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300 transition-colors duration-150 hover:border-emerald-400/40 hover:bg-emerald-500/18"
          >
            <Maximize2 size={14} strokeWidth={1.75} aria-hidden="true" /> Compare
          </button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-xl border border-white/[0.06] bg-[#181B22] px-3 py-2">
            <span className="block text-[10px] uppercase tracking-wider text-zinc-400">
              Baseline → Now
            </span>
            <span className="font-mono font-bold tabular-nums text-emerald-300">
              {baselineDeg}° → {currentDeg}°
            </span>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-[#181B22] px-3 py-2">
            <span className="block text-[10px] uppercase tracking-wider text-zinc-400">
              Shoulder Delta
            </span>
            <span className="font-mono font-bold tabular-nums text-white">
              {delta.shoulderSymmetryDeltaDeg.toFixed(1)}°
            </span>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-[#181B22] px-3 py-2">
            <span className="block text-[10px] uppercase tracking-wider text-zinc-400">
              Strain Status
            </span>
            <span
              className={`font-mono font-bold ${
                delta.strainFlag === 'optimal'
                  ? 'text-emerald-300'
                  : delta.strainFlag === 'amber'
                    ? 'text-amber-300'
                    : 'text-rose-300'
              }`}
            >
              {delta.strainFlag.toUpperCase()}
            </span>
          </div>
        </div>

        {showPostScanBanner ? (
          <div className="mt-3 flex items-center justify-between gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-[11px] text-amber-100">
            <span className="leading-relaxed">
              Want Coach Gordon to verify your form on this? Upgrade to Plus for 2 monthly Form Lab reviews.
            </span>
            <button
              type="button"
              onClick={() => setUpgradeOpen(true)}
              className="forge-tactile-press inline-flex min-h-[38px] shrink-0 items-center rounded-xl bg-amber-400 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#090A0D]"
            >
              Plus →
            </button>
          </div>
        ) : null}
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby={headingId}
        onClose={closeFullScreenModal}
        onClick={e => {
          if (e.target === e.currentTarget) closeFullScreenModal()
        }}
        className="forge-glass-modal m-0 h-dvh max-h-dvh w-screen max-w-none overscroll-contain p-0 text-zinc-100 sm:m-auto sm:h-auto sm:max-h-[92dvh] sm:w-[min(94vw,660px)] sm:rounded-2xl"
      >
        <div className="flex h-full flex-col overflow-y-auto overscroll-contain p-4 sm:p-6">
          <div className="mb-3.5 flex items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                Interactive 33-Point Comparison
              </span>
              <h2 id={headingId} className="font-serif text-lg font-bold tracking-tight text-white">
                Posture Alignment Side-by-Side &amp; Overlay
              </h2>
            </div>
            <button
              type="button"
              onClick={closeFullScreenModal}
              aria-label="Close posture comparison modal"
              className="forge-tactile-press inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#181B22] text-zinc-200 transition-colors duration-150 hover:border-white/15 hover:bg-[#1D212A]"
            >
              <X size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>

          <PostureComparisonInteractiveStage
            showPostScanBanner={showPostScanBanner}
            onRequestUpgrade={() => {
              closeFullScreenModal()
              setUpgradeOpen(true)
            }}
          />
        </div>
      </dialog>

      <TierUpgradeModal
        open={upgradeOpen}
        triggerContext="post_scan_flag"
        currentTier={tierId}
        onClose={() => setUpgradeOpen(false)}
      />
    </>
  )
}
