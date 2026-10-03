'use client'

import React from 'react'

export type GaaIconName =
  // Training, Periodization & Streaks
  | 'overview'
  | 'program'
  | 'periodization'
  | 'assessment'
  | 'movement-screen'
  | 'barbell'
  | 'dumbbell'
  | 'plate'
  | 'flame'
  | 'fire'
  | 'target'
  | 'crosshair'
  | 'trophy'
  | 'award'
  | 'crown'
  | 'star'
  // Autonomics, Biometrics & Recovery
  | 'dna'
  | 'lightning'
  | 'zap'
  | 'heart-rate'
  | 'activity'
  | 'sleep'
  | 'moon'
  | 'sun'
  | 'droplet'
  | 'water'
  | 'scale'
  | 'tape-measure'
  // Nutrition & Ergogenics
  | 'utensils'
  | 'nutrition'
  | 'apple'
  | 'supplements'
  | 'pill'
  // Prescriptions & Safety
  | 'shield'
  | 'shield-check'
  | 'shield-alert'
  | 'toolbox'
  | 'alert-triangle'
  | 'alert-circle'
  | 'lock'
  | 'unlock'
  // Operations, Governance & Sessions
  | 'sessions'
  | 'checkins'
  | 'commerce'
  | 'credit-card'
  | 'calendar'
  | 'clock'
  | 'timer'
  | 'clipboard'
  | 'ticket'
  | 'lifecycle'
  | 'governance'
  | 'audit-trail'
  // Status Telemetry
  | 'status-active'
  | 'status-paused'
  | 'status-inactive'
  | 'status-archived'
  // Media, Audio & Telehealth
  | 'video-studio'
  | 'camera'
  | 'video-off'
  | 'mic'
  | 'mic-off'
  | 'volume'
  | 'volume-2'
  | 'volume-x'
  | 'music'
  | 'headphones'
  | 'play'
  | 'pause'
  | 'stop'
  | 'rotate-ccw'
  | 'phone'
  | 'phone-off'
  // Travel & Hospitality
  | 'travel'
  | 'plane'
  | 'hotel'
  | 'building'
  | 'luggage'
  // Navigation, Search & Controls
  | 'search'
  | 'compass'
  | 'sparkles'
  | 'brain'
  | 'bot'
  | 'lightbulb'
  | 'message'
  | 'message-square'
  | 'user'
  | 'users'
  | 'check'
  | 'close'
  | 'menu'
  | 'grid'
  | 'filter'
  | 'gear'
  | 'settings'
  | 'sliders'
  | 'edit'
  | 'copy'
  | 'book'
  | 'trash'
  | 'plus'
  | 'minus'
  | 'eye'
  | 'eye-off'
  | 'download'
  | 'upload'
  | 'share'
  | 'external-link'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-up'
  | 'chevron-down'
  | 'arrow-right'
  | 'arrow-left'
  | 'arrow-up'
  | 'arrow-down'
  | 'chart'
  | 'bar-chart'
  | 'trending-up'
  | 'radio'
  | 'wifi'
  | 'bluetooth'
  | 'info'
  | 'help-circle'
  // New Additions
  | 'microscope'
  | 'runner'
  | 'bandage'
  | 'rocket'
  | 'shaker'
  | 'drink'
  | 'celebration'
  | 'party'
  | 'watch'
  | 'ruler'
  | 'angle'
  | 'stairs'
  | 'snowflake'
  | 'gem'
  | 'test-tube'
  | 'printer'
  | 'shirt'
  | 'save'
  | 'vibrate'
  | 'folder'
  | 'heart'
  | 'bell'
  | 'globe'
  | 'link'
  | 'bike'
  | 'rower'
  | 'walker'
  | 'stretch'
  | 'foot'
  | 'hand'
  | 'ban'
  | 'bone'
  | 'leg'
  | 'muscle'
  | 'wind'
  | 'handshake'
  | 'leaf'
  | 'laptop'
  | 'pin'
  | 'flag'
  | 'speech'
  | 'hourglass'
  | 'smartphone'
  | 'plane'
  | 'mountain'
  | 'chair'
  | 'refresh'

export type GaaIconTone =
  | 'gold'
  | 'gold-ambient'
  | 'emerald'
  | 'amber'
  | 'ruby'
  | 'cyan'
  | 'purple'
  | 'slate'
  | 'white'
  | 'inherit'
  | 'dark'

export type GaaTone = GaaIconTone

export interface GaaIconProps {
  name: GaaIconName
  size?: number | string
  tone?: GaaIconTone
  strokeWidth?: number
  className?: string
  style?: React.CSSProperties
  'aria-hidden'?: boolean | 'true' | 'false'
}

const TONE_COLORS: Record<GaaIconTone, { stroke: string; fill?: string }> = {
  gold: { stroke: 'url(#gaa-grad-gold)', fill: 'rgba(197, 160, 89, 0.18)' },
  'gold-ambient': { stroke: 'url(#gaa-grad-gold)', fill: 'rgba(229, 208, 161, 0.24)' },
  emerald: { stroke: 'url(#gaa-grad-emerald)', fill: 'rgba(16, 185, 129, 0.18)' },
  amber: { stroke: 'url(#gaa-grad-amber)', fill: 'rgba(245, 158, 11, 0.18)' },
  ruby: { stroke: 'url(#gaa-grad-ruby)', fill: 'rgba(239, 68, 68, 0.18)' },
  cyan: { stroke: 'url(#gaa-grad-cyan)', fill: 'rgba(56, 189, 248, 0.18)' },
  purple: { stroke: 'url(#gaa-grad-purple)', fill: 'rgba(192, 132, 252, 0.18)' },
  slate: { stroke: '#94A3B8', fill: 'rgba(148, 163, 184, 0.14)' },
  white: { stroke: '#F8FAFC', fill: 'rgba(248, 250, 252, 0.14)' },
  inherit: { stroke: 'currentColor', fill: 'none' },
  dark: { stroke: '#080E14', fill: 'none' },
}

export default function GaaIcon({
  name,
  size = 18,
  tone = 'inherit',
  strokeWidth = 1.5,
  className = '',
  style = {},
  'aria-hidden': ariaHidden = true,
}: GaaIconProps) {
  const toneCfg = TONE_COLORS[tone] || TONE_COLORS.inherit
  const strokeColor = toneCfg.stroke
  const fillColor = toneCfg.fill ?? 'none'

  const svgProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: strokeColor,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': ariaHidden,
    className: `gaa-icon ${className}`.trim(),
    style: {
      display: 'inline-block',
      verticalAlign: 'middle',
      flexShrink: 0,
      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))',
      ...style,
    },
  }

  const renderShape = () => {
    switch (name) {
      // ── Training, Periodization & Streaks ──
      case 'overview':
        return (
          <>
            <rect x="3" y="3" width="7" height="9" rx="1.5" fill={fillColor} />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" fill={fillColor} />
            <rect x="3" y="16" width="7" height="5" rx="1.5" />
          </>
        )

      case 'program':
      case 'barbell':
      case 'dumbbell':
        return (
          <>
            <path d="M6 5v14M18 5v14M2 9v6M22 9v6M6 12h12M2 12h4M18 12h4" />
            <rect x="4" y="7" width="2" height="10" rx="0.5" fill={fillColor} />
            <rect x="18" y="7" width="2" height="10" rx="0.5" fill={fillColor} />
          </>
        )

      case 'plate':
        return (
          <>
            <circle cx="12" cy="12" r="9" fill={fillColor} />
            <circle cx="12" cy="12" r="3" fill={strokeColor} />
            <circle cx="12" cy="12" r="6" strokeDasharray="2 3" strokeOpacity="0.4" />
          </>
        )

      case 'periodization':
        return (
          <>
            <path d="M3 17c3.5-8 7.5-8 10 0s6.5 8 8-4" />
            <circle cx="3" cy="17" r="2" fill={strokeColor} />
            <circle cx="13" cy="17" r="2" fill={fillColor} />
            <circle cx="21" cy="13" r="2" fill={strokeColor} />
            <path d="M3 21h18" strokeDasharray="2 2" strokeOpacity="0.4" />
          </>
        )

      case 'flame':
      case 'fire':
        return (
          <path
            d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"
            fill={fillColor}
          />
        )

      case 'target':
      case 'crosshair':
        return (
          <>
            <circle cx="12" cy="12" r="9" fill={fillColor} />
            <circle cx="12" cy="12" r="5" />
            <circle cx="12" cy="12" r="1.5" fill={strokeColor} />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </>
        )

      case 'trophy':
      case 'award':
        return (
          <>
            <path d="M6 9H4a2 2 0 0 1-2-2V5h4v4ZM18 9h2a2 2 0 0 0 2-2V5h-4v4Z" />
            <path d="M6 4h12v6a6 6 0 0 1-12 0V4Z" fill={fillColor} />
            <path d="M12 16v3M8 21h8" />
          </>
        )

      case 'crown':
        return (
          <>
            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" fill={fillColor} />
            <rect x="5" y="18" width="14" height="2" rx="0.5" fill={strokeColor} />
          </>
        )

      case 'star':
        return (
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            fill={fillColor}
          />
        )

      // ── Movement & Biometrics ──
      case 'assessment':
      case 'movement-screen':
        return (
          <>
            <circle cx="12" cy="5" r="2.5" fill={fillColor} />
            <path d="M12 7.5v8M8 11l4-2 4 2M9 21l3-5.5 3 5.5" />
            <circle cx="12" cy="12" r="7.5" strokeDasharray="3 3" strokeOpacity="0.35" />
          </>
        )

      case 'heart-rate':
      case 'activity':
        return <path d="M22 12h-4l-3 9L9 3l-3 9H2" />

      case 'sleep':
      case 'moon':
        return (
          <>
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill={fillColor} />
            <path d="M19 3v4M21 5h-4" strokeWidth={1.25} />
          </>
        )

      case 'sun':
        return (
          <>
            <circle cx="12" cy="12" r="4" fill={fillColor} />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </>
        )

      case 'dna':
        return (
          <>
            <path d="M4 6c4 4 8 4 12 0s8-4 12 0" />
            <path d="M4 18c4-4 8-4 12 0s8 4 12 0" />
            <line x1="6" y1="8" x2="6" y2="16" fill={fillColor} />
            <line x1="12" y1="5" x2="12" y2="19" fill={fillColor} />
            <line x1="18" y1="8" x2="18" y2="16" fill={fillColor} />
            <circle cx="6" cy="12" r="1.5" fill={strokeColor} />
            <circle cx="18" cy="12" r="1.5" fill={strokeColor} />
          </>
        )

      case 'lightning':
      case 'zap':
        return (
          <path
            d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"
            fill={fillColor}
          />
        )

      case 'droplet':
      case 'water':
        return (
          <path
            d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
            fill={fillColor}
          />
        )

      case 'scale':
      case 'tape-measure':
        return (
          <>
            <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1ZM2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1ZM7 21h10M12 3v18M3 7h18" />
            <circle cx="12" cy="3" r="1.5" fill={strokeColor} />
          </>
        )

      // ── Nutrition & Ergogenics ──
      case 'utensils':
      case 'nutrition':
        return (
          <>
            <path d="M18 2v20M21 15V2a3 3 0 0 0-3 3M18 5H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4v7" />
            <path d="M6 2v6M10 2v6" />
          </>
        )

      case 'apple':
        return (
          <>
            <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" fill={fillColor} />
            <path d="M10 2c1 .5 2 2 2 5" />
          </>
        )

      case 'supplements':
      case 'pill':
        return (
          <>
            <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
            <path d="m8.5 8.5 7 7" />
            <path d="m4.5 12.5 5 5" fill={fillColor} />
          </>
        )

      // ── Prescriptions & Safety ──
      case 'shield':
      case 'shield-check':
        return (
          <>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill={fillColor} />
            <path d="m9 12 2 2 4-4" />
          </>
        )

      case 'shield-alert':
        return (
          <>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill={fillColor} />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </>
        )

      case 'toolbox':
        return (
          <>
            <rect x="2" y="7" width="20" height="14" rx="2" fill={fillColor} />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20M12 11v4" />
          </>
        )

      case 'alert-triangle':
      case 'alert-circle':
        return (
          <>
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" fill={fillColor} />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </>
        )

      case 'lock':
        return (
          <>
            <rect x="3" y="11" width="18" height="11" rx="2" fill={fillColor} />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </>
        )

      case 'unlock':
        return (
          <>
            <rect x="3" y="11" width="18" height="11" rx="2" fill={fillColor} />
            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
          </>
        )

      // ── Operations, Governance & Sessions ──
      case 'calendar':
      case 'sessions':
        return (
          <>
            <rect x="3" y="4" width="18" height="18" rx="2" fill={fillColor} />
            <path d="M16 2v4M8 2v4M3 10h18M12 14v4M12 14h3" />
          </>
        )

      case 'clock':
      case 'timer':
        return (
          <>
            <circle cx="12" cy="12" r="9" fill={fillColor} />
            <polyline points="12 6 12 12 16 14" />
          </>
        )

      case 'checkins':
      case 'clipboard':
        return (
          <>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" fill={fillColor} />
            <path d="m9 14 2 2 4-4" />
          </>
        )

      case 'commerce':
      case 'credit-card':
        return (
          <>
            <rect x="2" y="5" width="20" height="14" rx="2" fill={fillColor} />
            <line x1="2" y1="10" x2="22" y2="10" />
            <rect x="5" y="13" width="4" height="3" rx="0.5" fill={fillColor} />
          </>
        )

      case 'ticket':
        return (
          <>
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" fill={fillColor} />
            <path d="M13 5v2M13 11v2M13 17v2" strokeDasharray="2 2" />
          </>
        )

      case 'lifecycle':
      case 'governance':
        return (
          <>
            <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1ZM2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1ZM7 21h10M12 3v18M3 7h18" />
            <circle cx="12" cy="3" r="1.5" fill={strokeColor} />
          </>
        )

      case 'audit-trail':
        return (
          <>
            <circle cx="12" cy="12" r="9" fill={fillColor} />
            <polyline points="12 7 12 12 15 15" />
            <path d="M3 12h2M19 12h2M12 3v2M12 19v2" strokeOpacity="0.5" />
          </>
        )

      // ── Status Telemetry Rings ──
      case 'status-active':
        return (
          <>
            <circle cx="12" cy="12" r="9" stroke="#10B981" strokeOpacity="0.25" fill="rgba(16,185,129,0.12)" />
            <circle cx="12" cy="12" r="5" fill="#10B981" stroke="#34D399" />
          </>
        )

      case 'status-paused':
        return (
          <>
            <circle cx="12" cy="12" r="9" stroke="#F59E0B" strokeOpacity="0.25" fill="rgba(245,158,11,0.12)" />
            <rect x="9.5" y="8" width="2" height="8" rx="0.5" fill="#F59E0B" stroke="#FCD34D" strokeWidth={0.5} />
            <rect x="12.5" y="8" width="2" height="8" rx="0.5" fill="#F59E0B" stroke="#FCD34D" strokeWidth={0.5} />
          </>
        )

      case 'status-inactive':
        return (
          <>
            <circle cx="12" cy="12" r="9" stroke="#EF4444" strokeOpacity="0.25" fill="rgba(239,68,68,0.12)" />
            <circle cx="12" cy="12" r="4.5" fill="#EF4444" stroke="#F87171" />
          </>
        )

      case 'status-archived':
        return (
          <>
            <circle cx="12" cy="12" r="9" stroke="#94A3B8" strokeOpacity="0.25" fill="rgba(148,163,184,0.12)" />
            <rect x="8.5" y="8.5" width="7" height="7" rx="1" fill="#94A3B8" stroke="#CBD5E1" strokeWidth={0.5} />
          </>
        )

      // ── Media, Audio & Telehealth Studio ──
      case 'video-studio':
        return (
          <>
            <rect x="2" y="5" width="14" height="14" rx="2" fill={fillColor} />
            <polygon points="22 7 16 12 22 17 22 7" fill={fillColor} />
          </>
        )

      case 'camera':
        return (
          <>
            <path
              d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"
              fill={fillColor}
            />
            <circle cx="12" cy="13" r="3" />
          </>
        )

      case 'video-off':
        return (
          <>
            <path d="M16 16v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1" />
            <polygon points="22 7 16 12 22 17 22 7" fill={fillColor} />
            <line x1="2" y1="2" x2="22" y2="22" />
          </>
        )

      case 'mic':
        return (
          <>
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" fill={fillColor} />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" />
          </>
        )

      case 'mic-off':
        return (
          <>
            <line x1="2" y1="2" x2="22" y2="22" />
            <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
            <path d="M5 10v2a7 7 0 0 0 12 5" />
            <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </>
        )

      case 'volume':
      case 'volume-2':
        return (
          <>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill={fillColor} />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        )

      case 'volume-x':
        return (
          <>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill={fillColor} />
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </>
        )

      case 'music':
        return (
          <>
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" fill={fillColor} />
            <circle cx="18" cy="16" r="3" fill={fillColor} />
          </>
        )

      case 'headphones':
        return (
          <>
            <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" fill={fillColor} />
          </>
        )

      case 'play':
        return <polygon points="6 3 20 12 6 21 6 3" fill={fillColor} />

      case 'pause':
        return (
          <>
            <rect x="6" y="4" width="4" height="16" rx="1" fill={fillColor} />
            <rect x="14" y="4" width="4" height="16" rx="1" fill={fillColor} />
          </>
        )

      case 'stop':
        return <rect x="5" y="5" width="14" height="14" rx="2" fill={fillColor} />

      case 'rotate-ccw':
        return (
          <>
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </>
        )

      case 'phone':
        return (
          <path
            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
            fill={fillColor}
          />
        )

      case 'phone-off':
        return (
          <>
            <line x1="2" y1="2" x2="22" y2="22" />
            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
          </>
        )

      // ── Travel & Hospitality ──
      case 'travel':
      case 'plane':
        return (
          <>
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.8-.2-1.5.2-1.8.9l-.5 1.2 5.5 3.5-3.5 3.5-2.2-.4c-.5-.1-1 .2-1.2.7l-.4.8 3.5 2 2 3.5c.2.2.7-.7.6-1.2l-.4-2.2 3.5-3.5 3.5 5.5 1.2-.5c.7-.3 1.1-1 .9-1.8Z" fill={fillColor} />
          </>
        )

      case 'hotel':
      case 'building':
        return (
          <>
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18ZM2 22h20M10 6h4M10 10h4M10 14h4M10 18h4" />
          </>
        )

      case 'luggage':
        return (
          <>
            <rect x="6" y="7" width="12" height="14" rx="2" fill={fillColor} />
            <path d="M9 7V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3M6 12h12M9 21v1M15 21v1" />
          </>
        )

      // ── Navigation, Search, AI & System ──
      case 'search':
        return (
          <>
            <circle cx="11" cy="11" r="7" fill={fillColor} />
            <path d="m20 20-3.5-3.5" />
            <circle cx="11" cy="11" r="3" strokeOpacity="0.3" />
          </>
        )

      case 'compass':
        return (
          <>
            <circle cx="12" cy="12" r="9" fill={fillColor} />
            <polygon
              points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
              fill={strokeColor}
              fillOpacity="0.35"
            />
          </>
        )

      case 'sparkles':
        return (
          <path
            d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"
            fill={fillColor}
          />
        )

      case 'brain':
      case 'bot':
        return (
          <>
            <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" fill={fillColor} />
            <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" fill={fillColor} />
            <path d="M12 5v14" />
          </>
        )

      case 'lightbulb':
        return (
          <>
            <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4.5 12.4c.9.8 1.5 1.9 1.5 3.1v.5h6v-.5c0-1.2.6-2.3 1.5-3.1A7 7 0 0 0 12 2z" fill={fillColor} />
          </>
        )

      case 'message':
      case 'message-square':
        return (
          <>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill={fillColor} />
            <path d="M8 10h8M8 14h4" strokeOpacity="0.5" />
          </>
        )

      case 'user':
        return (
          <>
            <circle cx="12" cy="7" r="4" fill={fillColor} />
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          </>
        )

      case 'users':
        return (
          <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" fill={fillColor} />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </>
        )

      case 'check':
        return <polyline points="20 6 9 17 4 12" />

      case 'close':
        return <path d="M18 6 6 18M6 6l12 12" />

      case 'menu':
        return <path d="M3 12h18M3 6h18M3 18h18" />

      case 'grid':
        return (
          <>
            <rect x="3" y="3" width="7" height="7" rx="1" fill={fillColor} />
            <rect x="14" y="3" width="7" height="7" rx="1" fill={fillColor} />
            <rect x="14" y="14" width="7" height="7" rx="1" fill={fillColor} />
            <rect x="3" y="14" width="7" height="7" rx="1" fill={fillColor} />
          </>
        )

      case 'filter':
        return <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" fill={fillColor} />

      case 'gear':
      case 'settings':
      case 'sliders':
        return (
          <>
            <circle cx="12" cy="12" r="3" fill={fillColor} />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </>
        )

      case 'edit':
        return (
          <>
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" fill={fillColor} />
          </>
        )

      case 'copy':
        return (
          <>
            <rect x="9" y="9" width="13" height="13" rx="2" fill={fillColor} />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </>
        )

      case 'book':
        return (
          <>
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" fill={fillColor} />
            <path d="M6 6h10M6 10h10M6 14h6" />
          </>
        )

      case 'trash':
        return (
          <>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" fill={fillColor} />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </>
        )

      case 'plus':
        return <path d="M12 5v14M5 12h14" />

      case 'minus':
        return <path d="M5 12h14" />

      case 'eye':
        return (
          <>
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" fill={fillColor} />
            <circle cx="12" cy="12" r="3" />
          </>
        )

      case 'eye-off':
        return (
          <>
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </>
        )

      case 'download':
        return (
          <>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </>
        )

      case 'upload':
        return (
          <>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </>
        )

      case 'share':
        return (
          <>
            <circle cx="18" cy="5" r="3" fill={fillColor} />
            <circle cx="6" cy="12" r="3" fill={fillColor} />
            <circle cx="18" cy="19" r="3" fill={fillColor} />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </>
        )

      case 'external-link':
        return (
          <>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
          </>
        )

      case 'chevron-right':
        return <polyline points="9 18 15 12 9 6" />

      case 'chevron-left':
        return <polyline points="15 18 9 12 15 6" />

      case 'chevron-up':
        return <polyline points="18 15 12 9 6 15" />

      case 'chevron-down':
        return <polyline points="6 9 12 15 18 9" />

      case 'arrow-right':
        return <path d="M5 12h14M12 5l7 7-7 7" />

      case 'arrow-left':
        return <path d="M19 12H5M12 19l-7-7 7-7" />

      case 'arrow-up':
        return <path d="M12 19V5M5 12l7-7 7 7" />

      case 'arrow-down':
        return <path d="M12 5v14M19 12l-7 7-7-7" />

      case 'chart':
      case 'bar-chart':
      case 'trending-up':
        return (
          <>
            <path d="M3 3v18h18" />
            <rect x="7" y="12" width="3" height="6" rx="0.5" fill={fillColor} />
            <rect x="12" y="8" width="3" height="10" rx="0.5" fill={fillColor} />
            <rect x="17" y="5" width="3" height="13" rx="0.5" fill={fillColor} />
            <path d="m7 11 5-4 5 2 3-5" strokeOpacity="0.8" />
          </>
        )

      case 'radio':
      case 'wifi':
      case 'bluetooth':
        return (
          <>
            <circle cx="12" cy="12" r="2" fill={strokeColor} />
            <path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 7.76a6 6 0 0 0 0 8.49" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" strokeOpacity="0.6" />
          </>
        )

      case 'info':
        return (
          <>
            <circle cx="12" cy="12" r="9" fill={fillColor} />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </>
        )

      case 'help-circle':
        return (
          <>
            <circle cx="12" cy="12" r="9" fill={fillColor} />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </>
        )


      // ── New Icons ──
      case 'microscope':
        return (
          <>
            <path d="M6 18h8" />
            <path d="M3 22h18" />
            <path d="M14 22a7 7 0 1 0 0-14h-1" />
            <path d="M9 14h2" />
            <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" fill={fillColor} />
            <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
          </>
        )

      case 'runner':
        return (
          <>
            <circle cx="15" cy="5" r="2" fill={fillColor} />
            <path d="M11 21v-4l-3-2V9l3 2 5-2 1.5 2.5" />
            <path d="M16 11l-3-2-2.5 3.5 2.5 3 2 5" />
            <path d="M6 14l2.5-3" />
          </>
        )

      case 'bandage':
        return (
          <>
            <path d="M10 20.24l-3.24-3.24a6 6 0 1 1 8.48-8.48L18.48 11.76a6 6 0 1 1-8.48 8.48Z" fill={fillColor} />
            <path d="M10 8l6 6" />
            <path d="M8 10l6 6" />
            <path d="M12 14l-2-2" />
          </>
        )

      case 'rocket':
        return (
          <>
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2l.5-.5a2.5 2.5 0 0 0-1.56-4.22h-1.5V13a2.5 2.5 0 0 0-1.44-2.28c-.5.5-1 1-1.5 1.5Z" />
            <path d="M12 15l-3-3a5.95 5.95 0 0 1-1.74-3.95A10.22 10.22 0 0 1 9.5 2 10.22 10.22 0 0 1 22 4.5a10.22 10.22 0 0 1-2.5 7.76A5.95 5.95 0 0 1 15.5 14L12.5 17" fill={fillColor} />
            <circle cx="15.5" cy="8.5" r="1.5" fill={strokeColor} />
          </>
        )

      case 'shaker':
      case 'drink':
        return (
          <>
            <path d="M5 8l1.5 12c.1.8.8 1.4 1.6 1.4h7.8c.8 0 1.5-.6 1.6-1.4L19 8" fill={fillColor} />
            <path d="M6 8h12M9 4V2h6v2M7 4h10v4H7z" />
            <path d="M8 12v5M12 12v6M16 12v5" strokeDasharray="2 2" strokeOpacity="0.4" />
          </>
        )

      case 'celebration':
      case 'party':
        return (
          <>
            <path d="M5 2l1.5 2M8 4l2 1.5M11 6l1.5 2M15 8l2 1.5" strokeDasharray="1 2" strokeOpacity="0.6" />
            <path d="M10 21l3-12 5 2-3 12a1.8 1.8 0 0 1-2.3.9l-1.8-.7a1.8 1.8 0 0 1-.9-2.2Z" fill={fillColor} />
            <path d="M18.8 8l2-5-5 2Z" fill={strokeColor} />
          </>
        )

      case 'watch':
        return (
          <>
            <rect x="7" y="5" width="10" height="14" rx="3" fill={fillColor} />
            <path d="M9 5V2h6v3M9 19v3h6v-3M16 12h1" />
          </>
        )

      case 'ruler':
      case 'angle':
        return (
          <>
            <path d="M21 3l-6 6-9-9L2 4l9 9-6 6 4 4 6-6 9 9 4-4-9-9 6-6Z" fill={fillColor} />
            <circle cx="12" cy="12" r="2" fill={strokeColor} />
          </>
        )

      case 'stairs':
        return (
          <>
            <path d="M2 20h4v-4h4v-4h4V8h4V4" />
            <path d="M6 20v-4M10 16v-4M14 12V8M18 8V4" strokeDasharray="2 2" strokeOpacity="0.3" />
            <rect x="18" y="4" width="4" height="4" fill={fillColor} />
            <rect x="14" y="8" width="4" height="4" fill={fillColor} />
            <rect x="10" y="12" width="4" height="4" fill={fillColor} />
            <rect x="6" y="16" width="4" height="4" fill={fillColor} />
          </>
        )

      case 'snowflake':
        return (
          <>
            <path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9L4.9 19.1" />
            <path d="M9 4l3 3 3-3M15 20l-3-3-3 3M4 9l3 3-3 3M20 15l-3-3 3-3" strokeOpacity="0.6" />
          </>
        )

      case 'gem':
        return (
          <>
            <path d="M6 3h12l4 6-10 12L2 9l4-6Z" fill={fillColor} />
            <path d="M2 9h20M12 21V9M6 3l3 6M18 3l-3 6" />
          </>
        )

      case 'test-tube':
        return (
          <>
            <path d="M9 2v16a3 3 0 0 0 6 0V2" fill={fillColor} />
            <path d="M7 2h10M9 8h6M9 14h6" />
          </>
        )

      case 'printer':
        return (
          <>
            <path d="M6 9V2h12v7" />
            <rect x="4" y="9" width="16" height="8" rx="2" fill={fillColor} />
            <path d="M8 17H6a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
            <path d="M8 13h8v9H8z" fill={fillColor} />
            <line x1="10" y1="16" x2="14" y2="16" />
            <line x1="10" y1="19" x2="14" y2="19" />
          </>
        )

      case 'shirt':
        return (
          <>
            <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" fill={fillColor} />
          </>
        )

      case 'save':
        return (
          <>
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" fill={fillColor} />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </>
        )

      case 'vibrate':
        return (
          <>
            <rect x="7" y="4" width="10" height="16" rx="2" fill={fillColor} />
            <path d="M2 9v6M22 9v6M5 7v10M19 7v10" strokeOpacity="0.6" />
          </>
        )

      case 'folder':
        return (
          <>
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill={fillColor} />
          </>
        )

      case 'heart':
        return (
          <>
            <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" fill={fillColor} />
          </>
        )

      case 'bell':
        return (
          <>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill={fillColor} />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </>
        )

      case 'globe':
        return (
          <>
            <circle cx="12" cy="12" r="10" fill={fillColor} />
            <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(90 12 12)" />
            <path d="M2 12h20" />
          </>
        )

      case 'link':
        return (
          <>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" fill={fillColor} />
          </>
        )

      case 'bike':
        return (
          <>
            <circle cx="5.5" cy="17.5" r="3.5" fill={fillColor} />
            <circle cx="18.5" cy="17.5" r="3.5" fill={fillColor} />
            <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2" />
            <path d="M10.5 13.5l-3 4M10 9L6.5 5h-2" />
          </>
        )

      case 'rower':
        return (
          <>
            <circle cx="9" cy="6" r="2" fill={fillColor} />
            <path d="M5 20h14" strokeOpacity="0.4" />
            <path d="M7 11l4 2 4-2" />
            <path d="M11 13l-1.5 5M11 13V9l-3 3-2-2" />
            <path d="M14.5 13l2.5 5" />
            <path d="M16 11l2.5-3" />
          </>
        )

      case 'walker':
        return (
          <>
            <circle cx="15" cy="5" r="2" fill={fillColor} />
            <path d="M11 21v-4l-3-2V9l3 2 5-2 1.5 2.5" />
            <path d="M16 11l-3-2-2.5 3.5 2.5 3 2 5" />
            <path d="M6 14l2.5-3" />
            <path d="M2 21h20" strokeOpacity="0.3" transform="rotate(-5 12 21)" />
          </>
        )

      case 'stretch':
        return (
          <>
            <circle cx="12" cy="5" r="2" fill={fillColor} />
            <path d="M12 7v7l4 4" />
            <path d="M12 14l-4 4" />
            <path d="M12 9h4l3 3" />
            <path d="M12 9H8l-3 3" />
          </>
        )

      case 'foot':
        return (
          <>
            <path d="M9 13.5C9 15.5 10 19 10 20c0 1.1.9 2 2 2s2-.9 2-2V9c0-1.7-1.3-3-3-3H7a2 2 0 0 0-2 2v6" fill={fillColor} />
            <path d="M11 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM16 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18.5 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM21 10.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zM22.5 12.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" fill={strokeColor} stroke="none" />
          </>
        )

      case 'hand':
        return (
          <>
            <path d="M18 10V6a2 2 0 0 0-4 0v4M14 10V4a2 2 0 0 0-4 0v6M10 10V5a2 2 0 0 0-4 0v9M6 14v-2a2 2 0 0 0-4 0v3c0 3.3 2.7 6 6 6h4c3.3 0 6-2.7 6-6v-5" fill={fillColor} />
          </>
        )

      case 'ban':
        return (
          <>
            <circle cx="12" cy="12" r="10" fill={fillColor} />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </>
        )

      case 'bone':
        return (
          <>
            <path d="M17 10c.7-.7 1.4-.7 2.1 0s.7 1.4 0 2.1l-2.1 2.1c-.7.7-.7 1.4 0 2.1s1.4.7 2.1 0l1.4-1.4c1.4-1.4 1.4-3.7 0-5.1s-3.7-1.4-5.1 0L17 10ZM7 14c-.7.7-1.4.7-2.1 0s-.7-1.4 0-2.1l2.1-2.1c.7-.7.7-1.4 0-2.1s-1.4-.7-2.1 0L3.5 9.1c-1.4 1.4-1.4 3.7 0 5.1s3.7 1.4 5.1 0L7 14Z" fill={fillColor} />
            <path d="M7 14l10-10M5.6 15.4l9.9-9.9" strokeOpacity="0.4" />
          </>
        )

      case 'leg':
        return (
          <>
            <path d="M11 2a2 2 0 0 1 2 2v9c0 1.1-.9 2-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2ZM11 15v5c0 1.1.9 2 2 2h3" fill={fillColor} />
            <path d="M15 11h2" strokeOpacity="0.5" />
          </>
        )

      case 'muscle':
        return (
          <>
            <path d="M21 15a4 4 0 0 0-4-4h-3M3 15v2c0 2.8 2.2 5 5 5h3c2.8 0 5-2.2 5-5v-1" fill={fillColor} />
            <path d="M9 13v-3a4 4 0 0 1 4-4h4" />
          </>
        )

      case 'wind':
        return (
          <>
            <path d="M14.5 4h-8.8C3.1 4 1 6 1 8.5S3.1 13 5.7 13h5.8M17.5 10h-11C4 10 2 12 2 14.5S4 19 6.5 19h7M9.5 16h-4M21 8.5C21 6 18.9 4 16.3 4H15" strokeOpacity="0.8" />
            <path d="M22 14.5C22 12 19.9 10 17.3 10H16" />
          </>
        )

      case 'handshake':
        return (
          <>
            <path d="M18 10L14 6l-3 3-5-5-3 3 5 5-2 2a4.2 4.2 0 0 0 0 6h0a4.2 4.2 0 0 0 6 0l2-2 5 5 3-3-5-5 3-3Z" fill={fillColor} />
            <path d="M11 13l2-2" />
          </>
        )

      case 'leaf':
        return (
          <>
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 1 8.3A9.2 9.2 0 0 1 11 20z" fill={fillColor} />
            <path d="M11 20v-9M11 16l3-3M11 12l2.5-2.5" />
          </>
        )

      case 'laptop':
        return (
          <>
            <rect x="3" y="4" width="18" height="12" rx="2" fill={fillColor} />
            <path d="M2 20h20" />
          </>
        )

      case 'pin':
        return (
          <>
            <circle cx="12" cy="12" r="5" fill={fillColor} />
            <path d="M12 2v5M12 17v5M2 12h5M17 12h5" />
          </>
        )

      case 'flag':
        return (
          <>
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill={fillColor} />
            <line x1="4" y1="22" x2="4" y2="15" />
          </>
        )

      case 'speech':
        return (
          <>
            <path d="M21 11a9 9 0 0 1-9 9c-2.4 0-4.6-.9-6.3-2.4L2 19l1.4-3.7A9 9 0 0 1 2 11a9 9 0 0 1 18 0z" fill={fillColor} />
            <path d="M8 11h.01M12 11h.01M16 11h.01" />
          </>
        )

      case 'hourglass':
        return (
          <>
            <path d="M6 2v6l4 4-4 4v6h12v-6l-4-4 4-4V2Z" fill={fillColor} />
            <path d="M6 2h12M6 22h12" />
          </>
        )

      case 'smartphone':
        return (
          <>
            <rect x="5" y="2" width="14" height="20" rx="2" fill={fillColor} />
            <path d="M12 18h.01" />
          </>
        )

      case 'plane':
        return (
          <>
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.6-.1-1.2.1-1.5.6l-.6.9 5.8 3.3-3 3-2.2-.4c-.4-.1-.8.1-1 .4l-.6.7 3.3 2 2 3.3.7-.6c.3-.2.5-.6.4-1l-.4-2.2 3-3 3.3 5.8.9-.6c.5-.3.7-.9.6-1.5z" fill={fillColor} />
          </>
        )

      case 'mountain':
        return (
          <>
            <path d="m8 3 4 8 5-5 5 15H2L8 3z" fill={fillColor} />
            <path d="M4.14 15.08 7.5 11l4.5 5 4-4 3.86 5.08" />
          </>
        )

      case 'chair':
        return (
          <>
            <path d="M6 3v10h12V3" fill={fillColor} />
            <path d="M6 13h12v4H6z" fill={fillColor} />
            <path d="M6 17v4M18 17v4" />
          </>
        )

      case 'refresh':
        return (
          <>
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </>
        )

      default:
        return (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4M12 16h.01" />
          </>
        )
    }
  }

  return (
    <svg {...svgProps}>
      <defs>
        <linearGradient id="gaa-grad-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5E3B8" />
          <stop offset="50%" stopColor="#C5A059" />
          <stop offset="100%" stopColor="#8A6B29" />
        </linearGradient>
        <linearGradient id="gaa-grad-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="gaa-grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A7F3D0" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="gaa-grad-amber" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="gaa-grad-ruby" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FECACA" />
          <stop offset="50%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
        <linearGradient id="gaa-grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E9D5FF" />
          <stop offset="50%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#7E22CE" />
        </linearGradient>
      </defs>
      {renderShape()}
    </svg>
  )
}

export { GaaIcon }

