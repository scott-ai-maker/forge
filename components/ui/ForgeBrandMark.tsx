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
  variant = 'vector',
}: ForgeBrandMarkProps) {
  const gradientId = React.useId()
  const glowId = React.useId()

  if (variant === 'raster') {
    return (
      <img
        src="/images/brand/logo-concept-1-kinetic-f.jpg"
        alt="Forge Athletic Brand Mark"
        width={size}
        height={size}
        className={className}
        style={{
          width: size,
          height: size,
          objectFit: 'cover',
          borderRadius: Math.round(size * 0.18),
          border: '1.5px solid rgba(245, 158, 11, 0.45)',
          flexShrink: 0,
          filter: withGlow
            ? `drop-shadow(0 4px ${size * 0.2}px rgba(245, 158, 11, 0.45)) drop-shadow(0 0 ${size * 0.12}px rgba(56, 189, 248, 0.3))`
            : undefined,
          ...style,
        }}
      />
    )
  }

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

        {/* Specular Apex Gradient */}
        <linearGradient id={`${gradientId}-flame`} x1="20" y1="15" x2="85" y2="35" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#FB923C" />
        </linearGradient>

        {/* Deep Forged Steel Gradient */}
        <linearGradient id={`${gradientId}-steel`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="50%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#070A0F" />
        </linearGradient>

        {/* Electric Biomechanics Cyan Accent */}
        <linearGradient id={`${gradientId}-accent`} x1="30" y1="42" x2="75" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        {/* Metallic Bevel Spine Gradient */}
        <linearGradient id={`${gradientId}-spine`} x1="25" y1="20" x2="48" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>

        {/* Radial Ambient Core Glow */}
        <radialGradient id={glowId} cx="50%" cy="45%" r="48%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.22" />
          <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#070A0F" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── 1. Aerodynamic Hexagonal Shield Frame ── */}
      <path
        d="M50 4L92 24V76L50 96L8 76V24L50 4Z"
        fill={`url(#${gradientId}-steel)`}
        stroke="rgba(245, 158, 11, 0.35)"
        strokeWidth="1.5"
      />

      {/* Precision Inner Border with Cyan-to-Amber Sheen */}
      <path
        d="M50 8L88 26V74L50 92L12 74V26L50 8Z"
        stroke={`url(#${gradientId})`}
        strokeWidth="1"
        strokeOpacity="0.4"
      />

      {/* Ambient Core Energy Glow */}
      <circle cx="50" cy="48" r="34" fill={`url(#${glowId})`} />

      {/* ── 2. The FORGE Kinetic Monogram: Anvil Foundation + Dynamic "F" + Upward Apex ── */}

      {/* Heavy Foundation Base (The Anvil / Ground) */}
      {/* Sleek, forward-sheared aerodynamic anvil base block */}
      <path
        d="M22 80L30 70H70L78 80H22Z"
        fill={`url(#${gradientId})`}
      />
      {/* Anvil Precision Bevel Highlight */}
      <line
        x1="30"
        y1="70"
        x2="70"
        y2="70"
        stroke="#FCD34D"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Vertical Spine of the "F" */}
      {/* Dynamic athletic forward slant with chamfered power cut */}
      <path
        d="M26 66L35 22H47L38 66H26Z"
        fill={`url(#${gradientId}-spine)`}
      />

      {/* Top Driving Crossbar & Arrowhead Apex */}
      {/* Aggressive aerodynamic wing driving upward and forward */}
      <path
        d="M44 22H78L68 34H41.5L44 22Z"
        fill={`url(#${gradientId}-flame)`}
      />
      {/* Top Edge Specular White Highlight */}
      <line
        x1="44"
        y1="22"
        x2="78"
        y2="22"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Mid Crossbar (Kinetic Surge) */}
      {/* High-voltage cyan speed wing creating an upward aerodynamic delta */}
      <path
        d="M40 42H66L58 52H38L40 42Z"
        fill={`url(#${gradientId}-accent)`}
      />
      {/* Cyan Specular Highlight */}
      <line
        x1="40"
        y1="42"
        x2="66"
        y2="42"
        stroke="#E0F2FE"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Apex Kinetic Spark Ember */}
      {/* Precision 4-point laser diamond nestled at the forward thrust */}
      <polygon
        points="74,44 78,38 82,44 78,50"
        fill="#F59E0B"
      />
      <circle cx="78" cy="44" r="1.5" fill="#FFFFFF" />
    </svg>
  )
}
