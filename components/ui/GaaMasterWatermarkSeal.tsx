'use client'

import React from 'react'

interface GaaMasterWatermarkSealProps {
  size?: number
  opacity?: number
  className?: string
  style?: React.CSSProperties
  subtitle?: string
}

export default function GaaMasterWatermarkSeal({
  size = 120,
  opacity = 0.12,
  className = '',
  style = {},
  subtitle = 'PRECISION SPORTS SCIENCE',
}: GaaMasterWatermarkSealProps) {
  return (
    <div
      className={`gaa-master-seal ${className}`.trim()}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        border: '1.5px solid var(--gold)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: size * 0.08,
        textAlign: 'center',
        background: 'radial-gradient(circle at 50% 50%, rgba(197, 160, 89, 0.15) 0%, transparent 80%)',
        boxShadow: '0 0 20px rgba(197, 160, 89, 0.15)',
        opacity,
        pointerEvents: 'none',
        userSelect: 'none',
        ...style,
      }}
    >
      <div
        className="font-serif"
        style={{
          fontSize: size * 0.18,
          color: 'var(--gold-lt)',
          letterSpacing: '0.14em',
          lineHeight: 1,
          fontWeight: 700,
        }}
      >
        FORGE
      </div>
      <div
        style={{
          width: size * 0.5,
          height: 1,
          background: 'var(--gold)',
          margin: `${size * 0.03}px 0`,
          opacity: 0.7,
        }}
      />
      <div
        style={{
          fontFamily: 'var(--font-heading, Barlow Condensed), sans-serif',
          fontSize: Math.max(7, size * 0.06),
          fontWeight: 800,
          color: '#FFFFFF',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          lineHeight: 1.15,
        }}
      >
        {subtitle}
      </div>
      <div
        style={{
          fontSize: Math.max(6, size * 0.045),
          color: 'var(--gold-lt)',
          letterSpacing: '0.12em',
          marginTop: size * 0.02,
          whiteSpace: 'nowrap',
        }}
      >
        ★ BUILT FROM THE GROUND UP ★
      </div>
    </div>
  )
}

