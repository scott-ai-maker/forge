import { describe, expect, it, vi } from 'vitest'
import {
  BANDWIDTH_PROFILES,
  DISCONNECT_FAILSAFE_GRACE_MS,
  applyCameraBandwidthConstraints,
  evaluateConnectionBannerState,
  evaluateNetworkQuality,
  formatSnapshotAge,
  resolveEffectiveBandwidthTier,
} from './live-bandwidth-profiles'

describe('lib/live-bandwidth-profiles', () => {
  describe('evaluateNetworkQuality', () => {
    it('returns excellent for low-latency, zero-loss studio Wi-Fi / 5G', () => {
      expect(
        evaluateNetworkQuality({
          rttMs: 42,
          packetLossRatio: 0.002,
          availableOutgoingBitrate: 2_500_000,
          downlinkMbps: 25,
          effectiveType: '4g',
        })
      ).toBe('excellent')
    })

    it('returns good for moderate latency (120-259ms) or minor loss (2-5%)', () => {
      expect(evaluateNetworkQuality({ rttMs: 165, packetLossRatio: 0.01 })).toBe('good')
      expect(evaluateNetworkQuality({ rttMs: 60, packetLossRatio: 0.03 })).toBe('good')
      expect(evaluateNetworkQuality({ rttMs: 60, downlinkMbps: 1.8 })).toBe('good')
    })

    it('returns constrained for Data Saver, 3G, encoder bandwidth limitation, or 6%+ loss', () => {
      expect(evaluateNetworkQuality({ rttMs: 45, saveData: true })).toBe('constrained')
      expect(evaluateNetworkQuality({ rttMs: 80, effectiveType: '3g' })).toBe('constrained')
      expect(evaluateNetworkQuality({ rttMs: 90, qualityLimitationReason: 'bandwidth' })).toBe('constrained')
      expect(evaluateNetworkQuality({ rttMs: 290 })).toBe('constrained')
      expect(evaluateNetworkQuality({ rttMs: 80, packetLossRatio: 0.08 })).toBe('constrained')
      expect(evaluateNetworkQuality({ rttMs: 80, availableOutgoingBitrate: 280_000 })).toBe('constrained')
    })

    it('returns critical for 2G, <250 kbps downlink, >=650ms RTT, or >=18% packet loss', () => {
      expect(evaluateNetworkQuality({ rttMs: 120, effectiveType: '2g' })).toBe('critical')
      expect(evaluateNetworkQuality({ rttMs: 120, effectiveType: 'slow-2g' })).toBe('critical')
      expect(evaluateNetworkQuality({ rttMs: 120, downlinkMbps: 0.15 })).toBe('critical')
      expect(evaluateNetworkQuality({ rttMs: 710 })).toBe('critical')
      expect(evaluateNetworkQuality({ rttMs: 100, packetLossRatio: 0.22 })).toBe('critical')
      expect(evaluateNetworkQuality({ rttMs: 100, availableOutgoingBitrate: 85_000 })).toBe('critical')
    })
  })

  describe('resolveEffectiveBandwidthTier', () => {
    it('honors explicit coach or athlete manual mode overrides', () => {
      expect(resolveEffectiveBandwidthTier('hd', 'critical', 5)).toBe('hd')
      expect(resolveEffectiveBandwidthTier('sd', 'excellent', 1)).toBe('sd')
      expect(resolveEffectiveBandwidthTier('low_data', 'excellent', 1)).toBe('low_data')
      expect(resolveEffectiveBandwidthTier('audio_first', 'excellent', 1)).toBe('audio_first')
    })

    it('adapts smoothly in auto mode across network quality grades', () => {
      expect(resolveEffectiveBandwidthTier('auto', 'excellent', 1)).toBe('hd')
      expect(resolveEffectiveBandwidthTier('auto', 'good', 1)).toBe('hd')
      expect(resolveEffectiveBandwidthTier('auto', 'good', 2)).toBe('sd')
      expect(resolveEffectiveBandwidthTier('auto', 'constrained', 1)).toBe('low_data')
      expect(resolveEffectiveBandwidthTier('auto', 'critical', 1)).toBe('low_data')
      expect(resolveEffectiveBandwidthTier('auto', 'critical', 2)).toBe('audio_first')
    })
  })

  describe('evaluateConnectionBannerState', () => {
    it('suppresses hair-trigger red NASM banner during transient <6.5s disconnects', () => {
      expect(
        evaluateConnectionBannerState({
          peerConnectionState: 'disconnected',
          disconnectedDurationMs: 1200,
          effectiveTier: 'hd',
          networkQuality: 'good',
          hasRecentSignalingHeartbeat: true,
        })
      ).toBe('reconnecting_grace')
    })

    it('escalates to nasm_failsafe when disconnected beyond the grace window in video tiers', () => {
      expect(
        evaluateConnectionBannerState({
          peerConnectionState: 'disconnected',
          disconnectedDurationMs: DISCONNECT_FAILSAFE_GRACE_MS + 500,
          effectiveTier: 'hd',
          networkQuality: 'critical',
          hasRecentSignalingHeartbeat: false,
        })
      ).toBe('nasm_failsafe')
    })

    it('keeps Audio-First sessions in calm low_bandwidth_active state when signaling heartbeats are alive', () => {
      expect(
        evaluateConnectionBannerState({
          peerConnectionState: 'disconnected',
          disconnectedDurationMs: DISCONNECT_FAILSAFE_GRACE_MS + 1000,
          effectiveTier: 'audio_first',
          networkQuality: 'critical',
          hasRecentSignalingHeartbeat: true,
        })
      ).toBe('low_bandwidth_active')
    })

    it('surfaces low_bandwidth_active status when training in low_data or audio_first while connected', () => {
      expect(
        evaluateConnectionBannerState({
          peerConnectionState: 'connected',
          disconnectedDurationMs: 0,
          effectiveTier: 'low_data',
          networkQuality: 'constrained',
          hasRecentSignalingHeartbeat: true,
        })
      ).toBe('low_bandwidth_active')

      expect(
        evaluateConnectionBannerState({
          peerConnectionState: 'connected',
          disconnectedDurationMs: 0,
          effectiveTier: 'hd',
          networkQuality: 'excellent',
          hasRecentSignalingHeartbeat: true,
        })
      ).toBe('none')
    })
  })

  describe('profiles, camera constraints & snapshot age helpers', () => {
    it('defines progressively lower bitrates from HD down to Audio-First (~36 kbps)', () => {
      expect(BANDWIDTH_PROFILES.hd.maxVideoBitrate).toBe(2_500_000)
      expect(BANDWIDTH_PROFILES.hd.degradationPreference).toBe('maintain-resolution')
      expect(BANDWIDTH_PROFILES.hd.cameraWidthIdeal).toBe(1920)
      expect(BANDWIDTH_PROFILES.hd.cameraHeightIdeal).toBe(1080)
      expect(BANDWIDTH_PROFILES.hd.maxVideoBitrate).toBeGreaterThan(BANDWIDTH_PROFILES.sd.maxVideoBitrate)
      expect(BANDWIDTH_PROFILES.sd.maxVideoBitrate).toBeGreaterThan(BANDWIDTH_PROFILES.low_data.maxVideoBitrate)
      expect(BANDWIDTH_PROFILES.audio_first.videoEnabled).toBe(false)
      expect(BANDWIDTH_PROFILES.audio_first.snapshotIntervalMs).toBe(4500)
      expect(BANDWIDTH_PROFILES.low_data.snapshotIntervalMs).toBe(6000)
    })

    it('applies adaptive resolution and framerate constraints to local video tracks', async () => {
      const applyConstraints = vi.fn().mockResolvedValue(undefined)
      const mockStream = {
        getVideoTracks: () => [{ applyConstraints }],
      } as unknown as MediaStream

      await applyCameraBandwidthConstraints(mockStream, 'low_data')
      expect(applyConstraints).toHaveBeenCalledWith({
        width: { ideal: 480 },
        height: { ideal: 270 },
        frameRate: { ideal: 12, max: 12 },
      })
    })

    it('formats snapshot timestamps cleanly for HUD badges', () => {
      const now = 1_000_000
      expect(formatSnapshotAge(null, now)).toBe('Live')
      expect(formatSnapshotAge(now - 1500, now)).toBe('Just now')
      expect(formatSnapshotAge(now - 8000, now)).toBe('8s ago')
      expect(formatSnapshotAge(now - 125_000, now)).toBe('2m ago')
    })
  })
})

