'use client'

import React from 'react'

export type TelemetryTone = 'emerald' | 'amber' | 'coral' | 'cyan'

interface TelemetryRingGaugeProps {
  score: number
  max?: number
  size?: number
  strokeWidth?: number
  tone?: TelemetryTone
  label?: string
  unit?: string
  showMax?: boolean
  className?: string
}

const TONE_MAP: Record<TelemetryTone, { stroke: string; glow: string; textClass: string }> = {
  emerald: {
    stroke: '#34D399',
    glow: 'rgba(52, 211, 153, 0.35)',
    textClass: 'text-emerald-300',
  },
  amber: {
    stroke: '#FBBF24',
    glow: 'rgba(251, 191, 36, 0.32)',
    textClass: 'text-amber-300',
  },
  coral: {
    stroke: '#FB7185',
    glow: 'rgba(251, 113, 133, 0.35)',
    textClass: 'text-rose-300',
  },
  cyan: {
    stroke: '#38BDF8',
    glow: 'rgba(56, 189, 248, 0.32)',
    textClass: 'text-sky-300',
  },
}

export default function TelemetryRingGauge({
  score,
  max = 100,
  size = 64,
  strokeWidth = 5,
  tone = 'emerald',
  label,
  unit = '',
  showMax = false,
  className = '',
}: TelemetryRingGaugeProps) {
  const clamped = Math.max(0, Math.min(max, score))
  const ratio = max > 0 ? clamped / max : 0
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - ratio)
  const palette = TONE_MAP[tone]

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      aria-label={label ? `${label}: ${clamped} out of ${max}` : undefined}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 transform"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={palette.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="forge-ring-arc"
          style={{
            filter: `drop-shadow(0 0 6px ${palette.glow})`,
            ['--ring-circumference' as string]: `${circumference}`,
            ['--ring-offset' as string]: `${dashOffset}`,
          }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className={`font-mono text-sm font-bold tabular-nums ${palette.textClass}`}>
          {clamped}
          {unit}
        </span>
        {showMax ? (
          <span className="mt-0.5 font-mono text-[9px] font-medium tabular-nums text-zinc-400">
            /{max}
          </span>
        ) : null}
      </div>
    </div>
  )
}
