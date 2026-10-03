'use client'

import React from 'react'

interface CoachTabSkeletonProps {
  label?: string
  height?: number | string
}

export default function CoachTabSkeleton({
  label = 'Loading workspace module...',
  height = 360,
}: CoachTabSkeletonProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        border: '1px solid var(--navy-lt)',
        background: 'var(--navy-mid)',
        padding: '32px 24px',
        minHeight: height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        borderRadius: 4,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          border: '3px solid rgba(212,160,23,0.2)',
          borderTopColor: 'var(--gold)',
          borderRadius: '50%',
          animation: 'coachTabSpin 0.75s linear infinite',
        }}
      />
      <p
        style={{
          margin: 0,
          fontFamily: 'Raleway, sans-serif',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--gray)',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </p>
      <style jsx global>{`
        @keyframes coachTabSpin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
