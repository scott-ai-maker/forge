'use client'

import React from 'react'

interface ForgeBrandMarkProps {
  size?: number
  className?: string
  style?: React.CSSProperties
  withGlow?: boolean
  variant?: 'vector' | 'raster'
}

export default function ForgeBrandMark({
  size = 48,
  className = '',
  style = {},
  withGlow = true,
}: ForgeBrandMarkProps) {
  const gradientId = React.useId()
  const clipId = React.useId()

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
        filter: withGlow
          ? `drop-shadow(0 2px ${size * 0.18}px rgba(245, 158, 11, 0.45)) drop-shadow(0 0 ${size * 0.12}px rgba(56, 189, 248, 0.35))`
          : undefined,
        borderRadius: Math.round(size * 0.18),
        overflow: 'hidden',
        ...style,
      }}
      aria-hidden="true"
    >
      <defs>
        {/* Kinetic Forge Gradient: Forged Steel to Flame Amber */}
        <linearGradient id={gradientId} x1="12" y1="14" x2="88" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="45%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>

        <clipPath id={clipId}>
          <rect x="0" y="0" width="100" height="100" rx="18" />
        </clipPath>

        {/* Heavy Foundation Base (The Anvil / Ground) */}
        {/* Vertical Spine of the "F" */}
      </defs>

      {/* Embedded Concept 1 Master Brand Image */}
      <image
        href="/images/brand/logo-concept-1-kinetic-f.jpg"
        x="0"
        y="0"
        width="100"
        height="100"
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clipId})`}
      />

      {/* Sleek Golden Border Frame */}
      <rect
        x="1.5"
        y="1.5"
        width="97"
        height="97"
        rx="17"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.5"
      />
    </svg>
  )
}
