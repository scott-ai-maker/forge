'use client'

import React from 'react'

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number
  className?: string
}

/**
 * Official Apple Mark SVG
 */
export function AppleLogo({ size = 20, style, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 170 170"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      {...props}
    >
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.94-12.04-14.58-6.19-9.5-11.09-20.74-14.71-33.72-3.62-12.98-5.43-25.13-5.43-36.46 0-14.99 3.8-27.42 11.41-37.3 7.6-9.88 17.2-14.9 28.78-15.08 4.35 0 9.29 1.13 14.81 3.4 5.53 2.27 9.17 3.44 10.93 3.52 1.54 0 5.42-1.29 11.66-3.88 6.23-2.58 11.53-3.72 15.89-3.4 11.75.87 21.05 5.3 27.9 13.3-10.23 6.19-15.24 14.78-15.02 25.77.22 8.7 3.51 15.93 9.87 21.69 6.36 5.76 13.88 9.07 22.56 9.93-2.17 6.32-4.8 12.63-7.9 18.92zm-35.03-106.8c0-4.02 1.4-8.08 4.2-12.18 2.8-4.1 6.54-7.1 11.23-9 1.22 4.47 1.09 8.84-.39 13.1-1.48 4.26-4.22 7.82-8.22 10.68-2.02 1.43-4.18 2.37-6.48 2.82-.26-1.74-.34-3.55-.34-5.42z" />
    </svg>
  )
}

/**
 * Official Apple Health App Icon (Red Heart on White / Dark rounded tile)
 */
export function AppleHealthIcon({ size = 28, style, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: '22.5%', ...style }}
      {...props}
    >
      <defs>
        <linearGradient id="appleHealthBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F2F2F7" />
        </linearGradient>
        <linearGradient id="appleHealthHeart" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF2D55" />
          <stop offset="100%" stopColor="#E00034" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22.5" fill="url(#appleHealthBg)" />
      <path
        d="M50 78C48.5 76.5 24 57.5 24 40.5C24 30.5 31.5 23 41.5 23C46.5 23 50 25.5 50 25.5C50 25.5 53.5 23 58.5 23C68.5 23 76 30.5 76 40.5C76 57.5 51.5 76.5 50 78Z"
        fill="url(#appleHealthHeart)"
      />
    </svg>
  )
}

/**
 * Official Android Robot Mark SVG
 */
export function AndroidLogo({ size = 20, style, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      {...props}
    >
      <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h4v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v6c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-6C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-6c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM9 5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
    </svg>
  )
}

/**
 * Official Health Connect by Android Icon
 */
export function HealthConnectIcon({ size = 28, style, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: '22.5%', ...style }}
      {...props}
    >
      <defs>
        <linearGradient id="hcBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22.5" fill="url(#hcBg)" />
      {/* 4 Colored Health Connect Rings/Petals */}
      <circle cx="50" cy="36" r="14" fill="#4285F4" fillOpacity="0.9" />
      <circle cx="64" cy="50" r="14" fill="#34A853" fillOpacity="0.9" />
      <circle cx="50" cy="64" r="14" fill="#EA4335" fillOpacity="0.9" />
      <circle cx="36" cy="50" r="14" fill="#FBBC05" fillOpacity="0.9" />
      <circle cx="50" cy="50" r="8" fill="#FFFFFF" />
    </svg>
  )
}

/**
 * Official "Works with Apple Health" Badge Component
 */
export function WorksWithAppleHealthBadge({ height = 36, style }: { height?: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: '#000000',
        color: '#FFFFFF',
        border: '1px solid rgba(255,255,255,0.25)',
        borderRadius: 8,
        padding: '0 14px',
        height,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        userSelect: 'none',
        ...style,
      }}
    >
      <AppleHealthIcon size={20} />
      <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
        <div style={{ fontSize: 8.5, letterSpacing: '0.02em', textTransform: 'uppercase', opacity: 0.8, fontWeight: 500 }}>
          Works with
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Apple Health
        </div>
      </div>
    </div>
  )
}

/**
 * Official "Health Connect by Android" Badge Component
 */
export function HealthConnectBadge({ height = 36, style }: { height?: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: '#000000',
        color: '#FFFFFF',
        border: '1px solid rgba(255,255,255,0.25)',
        borderRadius: 8,
        padding: '0 14px',
        height,
        fontFamily: 'Google Sans, Roboto, sans-serif',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        userSelect: 'none',
        ...style,
      }}
    >
      <HealthConnectIcon size={20} />
      <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
        <div style={{ fontSize: 8.5, letterSpacing: '0.02em', textTransform: 'uppercase', opacity: 0.8, fontWeight: 500 }}>
          Integrated with
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>
          Health Connect
        </div>
      </div>
    </div>
  )
}
