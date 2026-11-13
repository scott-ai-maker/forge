'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { ArrowUpRight, Columns, Layers, Maximize2, ScanLine, Sparkles, X } from 'lucide-react'
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

function PostureSilhouetteSvg({
  variant,
  opacity = 1,
}: {
  variant: 'baseline' | 'current'
  opacity?: number
}) {
  const isBaseline = variant === 'baseline'
  const headCx = isBaseline ? 117 : 101
  const shoulderX = isBaseline ? 108 : 100
  const elbowX = isBaseline ? 104 : 99
  const wristX = isBaseline ? 109 : 101
  const hipX = 100
  const kneeX = 101
  const ankleX = 100
  const strokeColor = isBaseline ? '#F59E0B' : '#34D399'
  const glowColor = isBaseline ? 'rgba(245,158,11,0.22)' : 'rgba(52,211,153,0.22)'

  return (
    <svg
      viewBox="0 0 280 260"
      className="h-full w-full select-none"
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Tactical LiDAR Reticle Grid */}
      {[40, 80, 120, 160, 200, 240].map(gx => (
        <line key={`vx-${gx}`} x1={gx} y1={10} x2={gx} y2={250} stroke="rgba(56,189,248,0.06)" strokeWidth={0.8} />
      ))}
      {[44, 88, 132, 176, 220].map(gy => (
        <line key={`hy-${gy}`} x1={16} y1={gy} x2={264} y2={gy} stroke="rgba(56,189,248,0.06)" strokeWidth={0.8} />
      ))}

      {/* Viewfinder Optical Corner Brackets */}
      <path d="M 20 28 L 20 16 L 32 16 M 248 16 L 260 16 L 260 28 M 20 232 L 20 244 L 32 244 M 248 244 L 260 244 L 260 232" fill="none" stroke="rgba(148,163,184,0.35)" strokeWidth={1.2} />

      {/* Ambient Depth Halo */}
      <ellipse cx={140} cy={135} rx={52} ry={95} fill={glowColor} opacity={0.35} />

      {/* Gravitational Plumb Reference Axis */}
      <line
        x1={140}
        y1={14}
        x2={140}
        y2={246}
        stroke="rgba(56,189,248,0.5)"
        strokeWidth={1.2}
        strokeDasharray="4 3"
      />

      <g transform="translate(40, 0)">
        {/* Fitted Dark Slate Crewneck Athletic Shirt & Shorts (Strict Wardrobe Standard) */}
        <path
          d={`M ${shoulderX - 22} 72 Q ${shoulderX} 65 ${shoulderX + 22} 72 L ${hipX + 18} 144 L ${hipX - 18} 144 Z`}
          fill="#1E293B"
          stroke="rgba(148,163,184,0.32)"
          strokeWidth={1.1}
        />
        <path
          d={`M ${shoulderX - 22} 72 L ${shoulderX - 30} 102 L ${shoulderX - 17} 105 L ${shoulderX - 14} 82 Z`}
          fill="#1E293B"
          stroke="rgba(148,163,184,0.22)"
          strokeWidth={0.9}
        />
        <path
          d={`M ${shoulderX + 22} 72 L ${shoulderX + 30} 102 L ${shoulderX + 17} 105 L ${shoulderX + 14} 82 Z`}
          fill="#1E293B"
          stroke="rgba(148,163,184,0.22)"
          strokeWidth={0.9}
        />
        <path
          d={`M ${hipX - 18} 144 L ${hipX + 18} 144 L ${kneeX + 15} 186 L ${hipX + 2} 186 L ${hipX} 163 L ${hipX - 2} 186 L ${kneeX - 15} 186 Z`}
          fill="#0F172A"
          stroke="rgba(148,163,184,0.25)"
          strokeWidth={1}
        />

        {/* Lower Legs & Athletic Shoes */}
        <line x1={kneeX - 8} y1={186} x2={ankleX - 8} y2={234} stroke="#334155" strokeWidth={6} strokeLinecap="round" />
        <line x1={kneeX + 8} y1={186} x2={ankleX + 8} y2={234} stroke="#334155" strokeWidth={6} strokeLinecap="round" />

        {/* Cranial Silhouette */}
        <circle cx={headCx} cy={43} r={14.5} fill="#1E293B" stroke={strokeColor} strokeWidth={1.6} />

        {/* 33-Point Triangulated Kinetic Mesh */}
        <polygon
          points={`${shoulderX - 16},78 ${shoulderX + 16},78 ${hipX + 13},144 ${hipX - 13},144`}
          fill={glowColor}
          stroke={strokeColor}
          strokeOpacity={0.45}
          strokeWidth={0.9}
        />
        <line x1={shoulderX - 16} y1={78} x2={hipX + 13} y2={144} stroke={strokeColor} strokeOpacity={0.28} strokeWidth={0.8} />
        <line x1={shoulderX + 16} y1={78} x2={hipX - 13} y2={144} stroke={strokeColor} strokeOpacity={0.28} strokeWidth={0.8} />

        {/* Sagittal Plumb Spine & Arm Chain */}
        <polyline
          points={`${headCx},43 ${shoulderX},78 ${hipX},144 ${kneeX},194 ${ankleX},236`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={`${shoulderX},78 ${elbowX},112 ${wristX},142`}
          fill="none"
          stroke={strokeColor}
          strokeOpacity={0.75}
          strokeWidth={1.6}
          strokeDasharray="3 2"
        />

        {/* Craniovertebral Angle Telemetry Callout */}
        <line x1={headCx + 15} y1={43} x2={headCx + 42} y2={35} stroke={strokeColor} strokeWidth={0.9} />
        <rect x={headCx + 42} y={25} width={54} height={16} rx={3} fill="#05080F" stroke={strokeColor} strokeWidth={0.8} />
        <text x={headCx + 69} y={35.5} textAnchor="middle" fill={strokeColor} fontSize="7.5" fontFamily="monospace" fontWeight="700">
          {isBaseline ? 'CVA +8.9°' : 'CVA +4.4°'}
        </text>

        {[
          { x: headCx, y: 43 },
          { x: shoulderX, y: 78 },
          { x: shoulderX - 16, y: 78 },
          { x: shoulderX + 16, y: 78 },
          { x: elbowX, y: 112 },
          { x: hipX, y: 144 },
          { x: hipX - 13, y: 144 },
          { x: hipX + 13, y: 144 },
          { x: kneeX, y: 194 },
          { x: ankleX, y: 236 },
        ].map((pt, idx) => (
          <circle key={idx} cx={pt.x} cy={pt.y} r={3.2} fill="#080E14" stroke={strokeColor} strokeWidth={1.5} />
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
  const [viewMode, setViewMode] = useState<'overlay' | 'side_by_side'>('overlay')
  const [splitPct, setSplitPct] = useState(54)
  const [delta, setDelta] = useState(() => loadPostureProfileState().postureDelta)

  const handleRunQuickScan = () => {
    const updated = runQuickPostureCheckDelta()
    setDelta(updated)
    playForgeTactileTone('success')
  }

  const baselineDeg = 8.9
  const currentDeg = Number(Math.max(1.5, baselineDeg + delta.forwardHeadDeltaDeg).toFixed(1))
  const postScanCopy = getUpgradeTriggerCopy('post_scan_flag', 'core_lab')

  return (
    <div className="space-y-3 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-white/15 bg-slate-950 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('overlay')}
            aria-pressed={viewMode === 'overlay'}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition ${
              viewMode === 'overlay' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Layers size={13} /> Overlay Slider
          </button>
          <button
            type="button"
            onClick={() => setViewMode('side_by_side')}
            aria-pressed={viewMode === 'side_by_side'}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition ${
              viewMode === 'side_by_side' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Columns size={13} /> Side-by-Side
          </button>
        </div>

        <button
          type="button"
          onClick={handleRunQuickScan}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/25"
        >
          <ScanLine size={13} /> Run 2-Min Quick Check
        </button>
      </div>

      {viewMode === 'overlay' ? (
        <div className="relative h-64 w-full overflow-hidden rounded-xl border border-white/15 bg-[#070B12] sm:h-72">
          <div className="absolute inset-0 flex items-center justify-center p-3">
            <PostureSilhouetteSvg variant="current" />
          </div>

          <div
            className="absolute inset-0 flex items-center justify-center bg-[#0B111C]/90 p-3"
            style={{ clipPath: `inset(0 ${100 - splitPct}% 0 0)` }}
          >
            <PostureSilhouetteSvg variant="baseline" />
          </div>

          <div
            className="pointer-events-none absolute inset-y-0 w-0.5 bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.85)]"
            style={{ left: `${splitPct}%` }}
          />

          <div className="pointer-events-none absolute left-2.5 top-2.5 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
            Baseline ({baselineDeg}°)
          </div>
          <div className="pointer-events-none absolute right-2.5 top-2.5 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
            Current ({currentDeg}°)
          </div>

          <div className="absolute inset-x-3 bottom-2.5 rounded-lg border border-white/15 bg-slate-950/85 px-3 py-1.5 backdrop-blur">
            <label className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-200">
              <span className="shrink-0">Scrub Mesh</span>
              <input
                type="range"
                min={5}
                max={95}
                value={splitPct}
                onChange={e => setSplitPct(Number(e.target.value))}
                aria-label="Compare baseline and current 33-point posture alignment"
                style={{ touchAction: 'none' }}
                className="h-2 flex-1 cursor-ew-resize accent-amber-400"
              />
              <span className="w-9 text-right font-mono text-amber-300">{splitPct}%</span>
            </label>
          </div>
        </div>
      ) : (
        <div className="grid h-64 grid-cols-2 gap-2 sm:h-72">
          <div className="relative flex flex-col items-center justify-center rounded-xl border border-amber-400/30 bg-[#0A101B] p-2">
            <span className="absolute left-2 top-2 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-200">
              Baseline · {baselineDeg}°
            </span>
            <PostureSilhouetteSvg variant="baseline" />
          </div>
          <div className="relative flex flex-col items-center justify-center rounded-xl border border-emerald-400/30 bg-[#070E16] p-2">
            <span className="absolute left-2 top-2 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
              Current · {currentDeg}°
            </span>
            <PostureSilhouetteSvg variant="current" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Forward Head</div>
          <div className="mt-0.5 font-mono text-sm font-extrabold text-emerald-300">
            {delta.forwardHeadDeltaDeg.toFixed(1)}°
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Posture Score</div>
          <div className="mt-0.5 font-mono text-sm font-extrabold text-white">
            {delta.overallPostureScore}/100
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Pelvic Drift</div>
          <div className="mt-0.5 font-mono text-sm font-extrabold text-amber-300">
            {delta.pelvicTiltDeltaDeg.toFixed(1)}° ({delta.strainFlag.toUpperCase()})
          </div>
        </div>
      </div>

      {!sandboxMode && showPostScanBanner && delta.strainFlag !== 'optimal' ? (
        <div className="flex flex-col justify-between gap-2.5 rounded-xl border border-amber-400/35 bg-amber-500/10 p-3 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2 text-xs text-amber-100">
            <Sparkles size={15} className="mt-0.5 shrink-0 text-amber-300" />
            <span>{postScanCopy.bannerCopy}</span>
          </div>
          <button
            type="button"
            onClick={onRequestUpgrade}
            className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-950 transition hover:bg-amber-300"
          >
            Upgrade to Plus <ArrowUpRight size={13} />
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
      <div className="rounded-xl border border-white/10 bg-[#0A121E] p-3.5 text-slate-100">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-amber-300">
              33-Point Posture Mesh Delta
            </div>
            <div className="mt-0.5 text-sm font-bold text-white">
              Forward Head {delta.forwardHeadDeltaDeg.toFixed(1)}° · Score {delta.overallPostureScore}/100
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/15 px-3 py-2 text-xs font-bold text-amber-200 transition hover:bg-amber-400/25"
          >
            <Maximize2 size={13} /> Compare
          </button>
        </div>

        <div className="mt-2.5 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-lg bg-black/35 px-2.5 py-1.5">
            <span className="block text-[10px] text-slate-400">Baseline → Now</span>
            <span className="font-mono font-bold text-emerald-300">
              {baselineDeg}° → {currentDeg}°
            </span>
          </div>
          <div className="rounded-lg bg-black/35 px-2.5 py-1.5">
            <span className="block text-[10px] text-slate-400">Shoulder Delta</span>
            <span className="font-mono font-bold text-white">
              {delta.shoulderSymmetryDeltaDeg.toFixed(1)}°
            </span>
          </div>
          <div className="rounded-lg bg-black/35 px-2.5 py-1.5">
            <span className="block text-[10px] text-slate-400">Strain Status</span>
            <span className="font-mono font-bold text-amber-300">
              {delta.strainFlag.toUpperCase()}
            </span>
          </div>
        </div>

        {showPostScanBanner ? (
          <div className="mt-2.5 flex items-center justify-between gap-2 rounded-lg border border-amber-400/30 bg-amber-500/10 px-2.5 py-2 text-[11px] text-amber-100">
            <span className="line-clamp-2">
              Want Coach Gordon to verify your form on this? Upgrade to Plus for 2 monthly Form Lab reviews.
            </span>
            <button
              type="button"
              onClick={() => setUpgradeOpen(true)}
              className="shrink-0 rounded-md bg-amber-400 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-950"
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
        className="m-0 h-dvh max-h-dvh w-screen max-w-none overscroll-contain bg-[#060A11] p-0 text-slate-100 sm:m-auto sm:h-auto sm:max-h-[92dvh] sm:w-[min(94vw,640px)] sm:rounded-2xl sm:border sm:border-white/15"
      >
        <div className="flex h-full flex-col overflow-y-auto overscroll-contain p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-amber-300">
                Interactive 33-Point Comparison
              </span>
              <h2 id={headingId} className="font-serif text-lg font-bold text-white">
                Posture Alignment Side-by-Side &amp; Overlay
              </h2>
            </div>
            <button
              type="button"
              onClick={closeFullScreenModal}
              aria-label="Close posture comparison modal"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 transition hover:bg-white/10"
            >
              <X size={16} />
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
