'use client'

import React from 'react'

interface ForgeBrandMarkProps {
  size?: number
  className?: string
  style?: React.CSSProperties
  withGlow?: boolean
}

export default function ForgeBrandMark({
  size = 48,
  className = '',
  style = {},
  withGlow = true,
}: ForgeBrandMarkProps) {
  const gradientId = React.useId()
  const glowId = React.useId()

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        flexShrink: 0,
        filter: withGlow ? `drop-shadow(0 0 ${size * 0.15}px rgba(245, 158, 11, 0.45))` : undefined,
        ...style,
      }}
      aria-hidden="true"
    >
      <defs>
        {/* Kinetic Forge Gradient: Forged Steel to Flame Amber */}
        <linearGradient id={gradientId} x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>

        <linearGradient id={`${gradientId}-steel`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        <linearGradient id={`${gradientId}-accent`} x1="20" y1="0" x2="80" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer Hexagonal Shield Background */}
      <rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="22"
        fill={`url(#${gradientId}-steel)`}
        stroke={`url(#${gradientId})`}
        strokeWidth="2.5"
      />

      {/* Ambient Inner Heat Glow */}
      <circle cx="50" cy="50" r="40" fill={`url(#${glowId})`} />

      {/* The FORGE Kinetic Monogram: Anvil Base + Dynamic "F" + Upward Apex Vector */}
      {/* 1. Heavy Foundation Base (The Anvil / Ground) */}
      <path
        d="M26 76H74L68 66H32L26 76Z"
        fill={`url(#${gradientId})`}
      />

      {/* 2. Vertical Spine of the "F" */}
      <path
        d="M28 24H42V62H28V24Z"
        fill="#F8FAFC"
      />

      {/* 3. Top Driving Crossbar & Arrowhead Apex */}
      <path
        d="M42 24H76L66 36H42V24Z"
        fill={`url(#${gradientId})`}
      />

      {/* 4. Mid Crossbar (Kinetic Surge) */}
      <path
        d="M42 42H64L56 52H42V42Z"
        fill={`url(#${gradientId}-accent)`}
      />

      {/* 5. Center Core Spark Dot */}
      <polygon
        points="70,47 74,41 78,47 74,53"
        fill="#F59E0B"
      />
    </svg>
  )
}
