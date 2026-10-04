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
}: GaaMasterWatermarkSealProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/brand/logo-concept-1-kinetic-f.jpg"
      alt=""
      aria-hidden="true"
      className={`gaa-master-seal ${className}`.trim()}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.2,
        objectFit: 'cover',
        opacity,
        pointerEvents: 'none',
        userSelect: 'none',
        ...style,
      }}
    />
  )
}
