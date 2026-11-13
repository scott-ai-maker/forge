'use client'

import React from 'react'
import ForgeIcon from '@/components/ui/ForgeIcon'
import {
  BANDWIDTH_MODE_OPTIONS,
  BANDWIDTH_PROFILES,
  type BandwidthMode,
  type ConnectionBannerState,
  type NetworkQualityGrade,
  type ResolvedBandwidthTier,
} from '@/lib/live-bandwidth-profiles'

export interface LiveBandwidthSelectorPillProps {
  bandwidthMode: BandwidthMode
  effectiveTier: ResolvedBandwidthTier
  networkQuality: NetworkQualityGrade
  onChangeMode: (mode: BandwidthMode) => void
  compact?: boolean
}

export function LiveBandwidthSelectorPill({
  bandwidthMode,
  effectiveTier,
  networkQuality,
  onChangeMode,
  compact = false,
}: LiveBandwidthSelectorPillProps) {
  const tierSpec = BANDWIDTH_PROFILES[effectiveTier]
  const dotColor =
    networkQuality === 'critical'
      ? '#F87171'
      : networkQuality === 'constrained' || effectiveTier === 'low_data' || effectiveTier === 'audio_first'
      ? '#FBBF24'
      : '#34D399'

  return (
    <div
      data-testid="bandwidth-mode-selector"
      title={`Adaptive Bandwidth Mode · Active Tier: ${tierSpec.label} (${tierSpec.estimatedKbps})`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: compact ? '2px 6px' : '3px 8px',
        borderRadius: 6,
        background:
          effectiveTier === 'audio_first' || effectiveTier === 'low_data'
            ? 'rgba(16, 185, 129, 0.14)'
            : 'rgba(255, 255, 255, 0.06)',
        border:
          effectiveTier === 'audio_first' || effectiveTier === 'low_data'
            ? '1px solid rgba(52, 211, 153, 0.45)'
            : '1px solid rgba(212, 160, 23, 0.35)',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: dotColor,
          boxShadow: `0 0 6px ${dotColor}`,
          flexShrink: 0,
        }}
      />
      <select
        aria-label="Live Studio Bandwidth Mode"
        data-testid="bandwidth-mode-select"
        value={bandwidthMode}
        onChange={e => onChangeMode(e.target.value as BandwidthMode)}
        style={{
          background: 'transparent',
          border: 'none',
          color: effectiveTier === 'audio_first' || effectiveTier === 'low_data' ? '#34D399' : 'var(--gold-lt)',
          fontSize: compact ? 10 : 11,
          fontWeight: 800,
          cursor: 'pointer',
          outline: 'none',
          paddingRight: 2,
        }}
      >
        {BANDWIDTH_MODE_OPTIONS.map(opt => (
          <option key={opt.mode} value={opt.mode} style={{ background: '#0A0E18', color: '#FFFFFF' }}>
            {opt.mode === 'auto'
              ? compact
                ? `Auto (${tierSpec.shortLabel})`
                : `Signal: Auto (${tierSpec.shortLabel})`
              : `${opt.label} (${BANDWIDTH_PROFILES[opt.mode].estimatedKbps})`}
          </option>
        ))}
      </select>
    </div>
  )
}

export interface LiveAdaptiveConnectionBannerProps {
  bannerState: ConnectionBannerState
  effectiveTier: ResolvedBandwidthTier
  isCoach: boolean
  failsafeTestId: string
  onSwitchBandwidthMode: (mode: BandwidthMode) => void
  onReconnect?: () => void
  onSendOrRequestSnapshot?: () => void
}

export function LiveAdaptiveConnectionBanner({
  bannerState,
  effectiveTier,
  isCoach,
  failsafeTestId,
  onSwitchBandwidthMode,
  onReconnect,
  onSendOrRequestSnapshot,
}: LiveAdaptiveConnectionBannerProps) {
  if (bannerState === 'none') {
    return null
  }

  const tierSpec = BANDWIDTH_PROFILES[effectiveTier]

  if (bannerState === 'low_bandwidth_active') {
    return (
      <div
        data-testid="low-bandwidth-active-banner"
        style={{
          position: 'absolute',
          top: 40,
          left: 8,
          zIndex: 24,
          background: 'rgba(6, 14, 20, 0.88)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(52, 211, 153, 0.45)',
          borderRadius: 6,
          padding: '4px 9px',
          color: '#E2E8F0',
          fontSize: 10.5,
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          maxWidth: 'calc(100% - 16px)',
          flexWrap: 'wrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.45)',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#34D399',
            boxShadow: '0 0 6px #34D399',
            flexShrink: 0,
          }}
        />
        <span>
          <strong style={{ color: '#34D399' }}>{tierSpec.shortLabel} Mode</strong> ({tierSpec.estimatedKbps}) · Voice &amp; Live Cues Active
        </span>
        {onSendOrRequestSnapshot && (
          <button
            type="button"
            onClick={onSendOrRequestSnapshot}
            style={{
              padding: '2px 7px',
              background: 'rgba(212, 160, 23, 0.18)',
              border: '1px solid rgba(212, 160, 23, 0.45)',
              borderRadius: 4,
              color: 'var(--gold-lt)',
              fontSize: 9.5,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {isCoach ? 'Snap Form' : 'Send Form Snap'}
          </button>
        )}
        {effectiveTier !== 'audio_first' ? (
          <button
            type="button"
            onClick={() => onSwitchBandwidthMode('audio_first')}
            style={{
              padding: '2px 7px',
              background: 'rgba(16, 185, 129, 0.18)',
              border: '1px solid rgba(52, 211, 153, 0.45)',
              borderRadius: 4,
              color: '#34D399',
              fontSize: 9.5,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Audio-First
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSwitchBandwidthMode('auto')}
            style={{
              padding: '2px 7px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 4,
              color: '#FFFFFF',
              fontSize: 9.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Try Video
          </button>
        )}
      </div>
    )
  }

  if (bannerState === 'reconnecting_grace') {
    return (
      <div
        data-testid="low-bandwidth-recovery-banner"
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          right: 12,
          background: 'rgba(120, 53, 15, 0.92)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(251, 191, 36, 0.65)',
          borderRadius: 8,
          padding: '8px 12px',
          color: '#FEF3C7',
          fontSize: 11,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          zIndex: 25,
          boxShadow: '0 4px 16px rgba(0,0,0,0.55)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ForgeIcon name="lightning" size={15} tone="amber" />
          <span>
            <strong style={{ color: '#FDE68A' }}>Low Signal Detected:</strong> Optimizing bandwidth &amp; keeping voice audio connected…
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            onSwitchBandwidthMode('audio_first')
            onReconnect?.()
          }}
          style={{
            padding: '4px 10px',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            border: '1px solid #34D399',
            borderRadius: 5,
            color: '#FFFFFF',
            fontSize: 10.5,
            fontWeight: 800,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Train in Audio + Snapshots Mode
        </button>
      </div>
    )
  }

  // Sustained unrecovered link failure -> NASM Fail-Safe with immediate Audio-First recovery escape hatch
  return (
    <div
      data-testid={failsafeTestId}
      style={{
        position: 'absolute',
        bottom: 12,
        left: 12,
        right: 12,
        background: 'rgba(185, 28, 28, 0.95)',
        border: '1px solid #FCA5A5',
        borderRadius: 8,
        padding: '9px 12px',
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        zIndex: 25,
        boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 240px' }}>
        <ForgeIcon name="alert-triangle" size={16} tone="inherit" />
        <span>
          <strong>NASM Fail-Safe:</strong>{' '}
          {isCoach
            ? 'Live link interrupted. Instruct athlete to pause working reps, or switch to Audio-First Coaching for low signal.'
            : 'Connection dropped. Pause working reps & rack load safely, or continue in Low-Bandwidth Audio-First Mode.'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => {
            onSwitchBandwidthMode('audio_first')
            onReconnect?.()
          }}
          style={{
            padding: '4px 10px',
            background: '#10B981',
            border: '1px solid #6EE7B7',
            borderRadius: 5,
            color: '#04120B',
            fontSize: 10.5,
            fontWeight: 900,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Continue in Audio-First (~36 kbps)
        </button>
        {onReconnect && (
          <button
            type="button"
            onClick={onReconnect}
            style={{
              padding: '4px 9px',
              background: 'rgba(255,255,255,0.16)',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: 5,
              color: '#FFFFFF',
              fontSize: 10.5,
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Reconnect
          </button>
        )}
      </div>
    </div>
  )
}

