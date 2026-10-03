'use client'

import React from 'react'
import { MOBILE_APPS_CONFIG } from '@/lib/mobile-apps-config'
import TrackedCtaLink from './TrackedCtaLink'

interface AppStoreBadgesProps {
  variant?: 'solid' | 'glass' | 'outline' | 'official'
  size?: 'sm' | 'md' | 'lg'
  align?: 'left' | 'center' | 'right'
  className?: string
  style?: React.CSSProperties
  sourceEventPrefix?: string
}

/**
 * Official Apple App Store Vector Badge
 */
export function AppleAppStoreBadgeSvg({ width = 140, height = 42 }: { width?: number; height?: number }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 140 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
      aria-hidden="true"
    >
      {/* Background with rounded corner border */}
      <rect width="140" height="42" rx="7" fill="#000000" />
      <rect x="0.5" y="0.5" width="139" height="41" rx="6.5" stroke="#A6A6A6" strokeWidth="1" />

      {/* Official Apple Logo */}
      <g fill="#FFFFFF">
        <path d="M26.4 20.9c-.03-3.26 2.66-4.83 2.78-4.9-1.52-2.22-3.87-2.52-4.71-2.56-2.01-.2-3.93 1.18-4.95 1.18-1.02 0-2.6-1.16-4.27-1.12-2.19.03-4.22 1.28-5.35 3.25-2.28 3.95-.58 9.8 1.64 13.01 1.09 1.57 2.38 3.33 4.08 3.27 1.64-.07 2.26-1.06 4.24-1.06s2.54 1.06 4.26 1.03c1.76-.04 2.87-1.59 3.94-3.18 1.24-1.82 1.76-3.57 1.79-3.66-.04-.02-3.43-1.32-3.45-5.26z" />
        <path d="M23.1 11.7c.91-1.1 1.52-2.63 1.35-4.15-.01-.04-.04-.04-.08-.04-1.3.05-2.88.87-3.81 1.97-.82.96-1.54 2.51-1.35 4 .01.04.04.04.08.04 1.46-.06 2.91-.72 3.81-1.82z" />
      </g>

      {/* Text: Download on the */}
      <text
        x="41"
        y="14.5"
        fill="#FFFFFF"
        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Icons', 'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="8.5"
        fontWeight="400"
        letterSpacing="-0.1px"
      >
        Download on the
      </text>

      {/* Text: App Store */}
      <text
        x="41"
        y="30"
        fill="#FFFFFF"
        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Icons', 'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="16.5"
        fontWeight="600"
        letterSpacing="-0.4px"
      >
        App Store
      </text>
    </svg>
  )
}

/**
 * Official Google Play Vector Badge
 */
export function GooglePlayBadgeSvg({ width = 140, height = 42 }: { width?: number; height?: number }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 140 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
      aria-hidden="true"
    >
      {/* Background with rounded corner border */}
      <rect width="140" height="42" rx="7" fill="#000000" />
      <rect x="0.5" y="0.5" width="139" height="41" rx="6.5" stroke="#A6A6A6" strokeWidth="1" />

      {/* Google Play 4-Color Icon */}
      <g transform="translate(10, 8.5)">
        <path
          d="M1.37 0.96C1.13 1.22 1 1.62 1 2.14v20.72c0 .52.13.92.37 1.18l.06.06L13.1 12.53v-.26L1.43.9l-.06.06z"
          fill="#00E6FF"
        />
        <path
          d="M16.98 16.41l-3.88-3.88v-.26l3.88-3.88.08.05 4.6 2.62c1.31.75 1.31 1.97 0 2.72l-4.6 2.6-.08.05z"
          fill="#00F076"
        />
        <path
          d="M17.06 16.36L13.1 12.4 1.37 24.14c.43.46 1.16.52 1.98.05l13.71-7.83z"
          fill="#FF3A44"
        />
        <path
          d="M17.06 8.44L3.35.61C2.53.14 1.8.2 1.37.66L13.1 12.4l3.96-3.96z"
          fill="#FFC800"
        />
      </g>

      {/* Text: GET IT ON */}
      <text
        x="40"
        y="14"
        fill="#FFFFFF"
        fontFamily="'Roboto', 'Google Sans', 'Segoe UI', -apple-system, sans-serif"
        fontSize="7.5"
        fontWeight="500"
        letterSpacing="0.8px"
      >
        GET IT ON
      </text>

      {/* Text: Google Play */}
      <text
        x="40"
        y="29.5"
        fill="#FFFFFF"
        fontFamily="'Product Sans', 'Google Sans', 'Roboto', 'Segoe UI', -apple-system, sans-serif"
        fontSize="15"
        fontWeight="600"
        letterSpacing="0.1px"
      >
        Google Play
      </text>
    </svg>
  )
}

/**
 * Official Apple Monochrome Logo SVG
 */
export function AppleLogoIcon({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 170 170" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.31-6.19-9.35-11.1-20.14-14.73-32.36-3.63-12.22-5.45-23.76-5.45-34.62 0-14.36 3.75-26.4 11.24-36.12 7.49-9.72 16.94-14.71 28.35-14.97 4.12 0 8.94 1.05 14.46 3.17 5.52 2.12 9.07 3.24 10.66 3.35 2.12-.11 5.86-1.28 11.22-3.53 5.36-2.25 9.94-3.27 13.73-3.08 12.87.65 22.86 5.34 29.98 14.07-11.45 6.91-17.07 16.5-16.85 28.77.22 9.89 4.07 18.17 11.55 24.84 7.48 6.67 16.32 10.45 26.52 11.35-2.25 7.18-5.29 14.74-9.12 22.68zM119.22 33.15c0-7.39 2.65-14.28 7.95-20.67 5.3-6.39 11.83-10.41 19.59-12.06.33 1.09.49 2.17.49 3.26 0 7.39-2.77 14.49-8.31 21.31-5.54 6.82-12.22 10.79-20.03 11.91-.44-1.2-.69-2.45-.69-3.75z"
        fill={color}
      />
    </svg>
  )
}

/**
 * Official Android Robot Head SVG
 */
export function AndroidLogoIcon({ size = 24, color = '#3DDC84' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Antennas */}
      <line x1="6.5" y1="4.5" x2="4.5" y2="1.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="17.5" y1="4.5" x2="19.5" y2="1.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* Head */}
      <path d="M2 13C2 7.477 6.477 3 12 3s10 4.477 10 10H2z" fill={color} />
      {/* Eyes */}
      <circle cx="7" cy="8.2" r="1.2" fill="#0A0E18" />
      <circle cx="17" cy="8.2" r="1.2" fill="#0A0E18" />
    </svg>
  )
}

export default function AppStoreBadges({
  size = 'md',
  align = 'left',
  className = '',
  style = {},
  sourceEventPrefix = 'marketing',
}: AppStoreBadgesProps) {
  const badgeWidth = size === 'sm' ? 125 : size === 'lg' ? 165 : 145
  const badgeHeight = size === 'sm' ? 38 : size === 'lg' ? 48 : 42

  const justifyMap: Record<string, string> = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  }

  return (
    <div
      className={`app-store-badges-group ${className}`}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: size === 'sm' ? 10 : 14,
        alignItems: 'center',
        justifyContent: justifyMap[align] || 'flex-start',
        ...style,
      }}
    >
      {/* ── Official Apple App Store Badge ── */}
      <TrackedCtaLink
        href={MOBILE_APPS_CONFIG.ios.url}
        target="_blank"
        rel="noopener noreferrer"
        eventName={`${sourceEventPrefix}_app_store_click`}
        eventPayload={{ platform: 'ios', bundleId: MOBILE_APPS_CONFIG.ios.bundleId }}
        className="tactile-btn official-app-store-badge"
        aria-label="Download on the App Store"
        style={{
          display: 'inline-block',
          textDecoration: 'none',
          lineHeight: 0,
          transition: 'transform 0.15s ease, filter 0.15s ease',
          borderRadius: 7,
          overflow: 'hidden',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.6)',
        }}
      >
        <AppleAppStoreBadgeSvg width={badgeWidth} height={badgeHeight} />
      </TrackedCtaLink>

      {/* ── Official Google Play Badge ── */}
      <TrackedCtaLink
        href={MOBILE_APPS_CONFIG.android.url}
        target="_blank"
        rel="noopener noreferrer"
        eventName={`${sourceEventPrefix}_play_store_click`}
        eventPayload={{ platform: 'android', bundleId: MOBILE_APPS_CONFIG.android.bundleId }}
        className="tactile-btn official-google-play-badge"
        aria-label="Get it on Google Play"
        style={{
          display: 'inline-block',
          textDecoration: 'none',
          lineHeight: 0,
          transition: 'transform 0.15s ease, filter 0.15s ease',
          borderRadius: 7,
          overflow: 'hidden',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.6)',
        }}
      >
        <GooglePlayBadgeSvg width={badgeWidth} height={badgeHeight} />
      </TrackedCtaLink>
    </div>
  )
}
