/**
 * Adaptive Low-Bandwidth & Audio-First Coaching Engine for Forge Athletic Live Studio.
 *
 * Enables seamless 1:1 and Squad live coaching across constrained cellular, basement gym Wi-Fi,
 * and rural connections without black screens or premature disconnection lockouts.
 */

export type BandwidthMode = 'auto' | 'hd' | 'sd' | 'low_data' | 'audio_first'

export type ResolvedBandwidthTier = 'hd' | 'sd' | 'low_data' | 'audio_first'

export type NetworkQualityGrade = 'excellent' | 'good' | 'constrained' | 'critical'

export type ConnectionBannerState =
  | 'none'
  | 'low_bandwidth_active'
  | 'reconnecting_grace'
  | 'nasm_failsafe'

export interface BandwidthProfileSpec {
  tier: ResolvedBandwidthTier
  label: string
  shortLabel: string
  estimatedKbps: string
  description: string
  videoEnabled: boolean
  maxVideoBitrate: number
  maxAudioBitrate: number
  maxFramerate: number
  scaleResolutionDownBy: number
  degradationPreference: 'maintain-framerate' | 'balanced' | 'maintain-resolution'
  cameraWidthIdeal: number
  cameraHeightIdeal: number
  cameraFrameRateIdeal: number
  snapshotIntervalMs: number | null
}

export interface NetworkHealthSample {
  rttMs: number | null
  packetLossRatio?: number | null
  availableOutgoingBitrate?: number | null
  framesPerSecond?: number | null
  qualityLimitationReason?: string | null
  saveData?: boolean
  effectiveType?: string | null
  downlinkMbps?: number | null
}

export interface CoachingSyncPayload {
  exerciseName?: string
  optPhase?: string
  tempo?: string
  restRemaining?: number | null
  quickCue?: string | null
  timestamp: number
}

/**
 * Grace window (ms) before escalating a transient WebRTC ICE/Peer disconnect
 * into a hard red NASM Fail-Safe banner. Longer than the 4,000ms ICE auto-restart
 * debounce so transient cellular handoffs self-heal or step down to Audio-First smoothly.
 */
export const DISCONNECT_FAILSAFE_GRACE_MS = 6500

/**
 * Max age (ms) for considering incoming Realtime signaling heartbeats active
 * when operating in ultra-low-bandwidth Audio-First / Snapshot coaching mode.
 */
export const SIGNALING_HEARTBEAT_TTL_MS = 16000

export const BANDWIDTH_PROFILES: Record<ResolvedBandwidthTier, BandwidthProfileSpec> = {
  hd: {
    tier: 'hd',
    label: 'Studio HD',
    shortLabel: 'HD',
    estimatedKbps: '~1,800 kbps',
    description: '720p 30fps full biomechanical video & studio audio',
    videoEnabled: true,
    maxVideoBitrate: 2_000_000,
    maxAudioBitrate: 64_000,
    maxFramerate: 30,
    scaleResolutionDownBy: 1,
    degradationPreference: 'maintain-framerate',
    cameraWidthIdeal: 1280,
    cameraHeightIdeal: 720,
    cameraFrameRateIdeal: 30,
    snapshotIntervalMs: null,
  },
  sd: {
    tier: 'sd',
    label: 'Adaptive SD',
    shortLabel: 'SD',
    estimatedKbps: '~450 kbps',
    description: '360p 20fps balanced video for moderate gym Wi-Fi / LTE',
    videoEnabled: true,
    maxVideoBitrate: 450_000,
    maxAudioBitrate: 48_000,
    maxFramerate: 20,
    scaleResolutionDownBy: 2,
    degradationPreference: 'balanced',
    cameraWidthIdeal: 640,
    cameraHeightIdeal: 360,
    cameraFrameRateIdeal: 20,
    snapshotIntervalMs: null,
  },
  low_data: {
    tier: 'low_data',
    label: 'Low Data Video',
    shortLabel: 'Low Data',
    estimatedKbps: '~140 kbps',
    description: 'Quarter-res 12fps stream + periodic posture keyframes',
    videoEnabled: true,
    maxVideoBitrate: 140_000,
    maxAudioBitrate: 36_000,
    maxFramerate: 12,
    scaleResolutionDownBy: 3,
    degradationPreference: 'maintain-resolution',
    cameraWidthIdeal: 480,
    cameraHeightIdeal: 270,
    cameraFrameRateIdeal: 12,
    snapshotIntervalMs: 6000,
  },
  audio_first: {
    tier: 'audio_first',
    label: 'Audio + Form Snapshots',
    shortLabel: 'Audio-First',
    estimatedKbps: '~36 kbps',
    description: 'Crystal-clear voice coaching + live cues + periodic form check snapshots',
    videoEnabled: false,
    maxVideoBitrate: 45_000,
    maxAudioBitrate: 32_000,
    maxFramerate: 5,
    scaleResolutionDownBy: 4,
    degradationPreference: 'maintain-resolution',
    cameraWidthIdeal: 360,
    cameraHeightIdeal: 202,
    cameraFrameRateIdeal: 8,
    snapshotIntervalMs: 4500,
  },
}

export const BANDWIDTH_MODE_OPTIONS: Array<{ mode: BandwidthMode; label: string; hint: string }> = [
  { mode: 'auto', label: 'Auto Adapt', hint: 'Automatically scales HD → Low Data → Audio-First' },
  { mode: 'hd', label: 'Studio HD', hint: '720p 30fps (~1.8 Mbps)' },
  { mode: 'sd', label: 'Balanced SD', hint: '360p 20fps (~450 kbps)' },
  { mode: 'low_data', label: 'Low Data', hint: '12fps + Form Keyframes (~140 kbps)' },
  { mode: 'audio_first', label: 'Audio + Snap', hint: 'Voice Priority + Form Snapshots (~36 kbps)' },
]

interface BrowserNetworkInformation {
  saveData?: boolean
  effectiveType?: string
  downlink?: number
  rtt?: number
  addEventListener?: (type: string, listener: () => void) => void
  removeEventListener?: (type: string, listener: () => void) => void
}

export function getNavigatorConnection(): BrowserNetworkInformation | null {
  if (typeof navigator === 'undefined') return null
  const nav = navigator as Navigator & {
    connection?: BrowserNetworkInformation
    mozConnection?: BrowserNetworkInformation
    webkitConnection?: BrowserNetworkInformation
  }
  return nav.connection || nav.mozConnection || nav.webkitConnection || null
}

/**
 * Reads non-intrusive browser Network Information hints (Data Saver, 2G/3G cellular, downlink).
 */
export function detectBrowserNetworkHint(): Partial<NetworkHealthSample> {
  const conn = getNavigatorConnection()
  if (!conn) return {}
  return {
    saveData: Boolean(conn.saveData),
    effectiveType: typeof conn.effectiveType === 'string' ? conn.effectiveType : null,
    downlinkMbps: typeof conn.downlink === 'number' && Number.isFinite(conn.downlink) ? conn.downlink : null,
    rttMs: typeof conn.rtt === 'number' && conn.rtt > 0 ? conn.rtt : null,
  }
}

/**
 * Classifies live connection telemetry into actionable quality grades.
 */
export function evaluateNetworkQuality(sample: NetworkHealthSample): NetworkQualityGrade {
  const {
    rttMs,
    packetLossRatio,
    availableOutgoingBitrate,
    qualityLimitationReason,
    saveData,
    effectiveType,
    downlinkMbps,
  } = sample

  const normalizedType = effectiveType?.toLowerCase() ?? null

  // Critical: 2G / slow-2G, ultra-low uplink/downlink (<250 kbps), extreme RTT (>=650ms), or heavy loss (>=18%)
  if (
    normalizedType === 'slow-2g' ||
    normalizedType === '2g' ||
    (downlinkMbps != null && downlinkMbps > 0 && downlinkMbps < 0.25) ||
    (availableOutgoingBitrate != null && availableOutgoingBitrate > 0 && availableOutgoingBitrate < 110_000) ||
    (rttMs != null && rttMs >= 650) ||
    (packetLossRatio != null && packetLossRatio >= 0.18)
  ) {
    return 'critical'
  }

  // Constrained: Data Saver enabled, 3G, low bandwidth (<1.1 Mbps), elevated RTT (>=260ms), loss (>=6%), or encoder bandwidth-limited
  if (
    saveData === true ||
    normalizedType === '3g' ||
    (downlinkMbps != null && downlinkMbps > 0 && downlinkMbps < 1.1) ||
    (availableOutgoingBitrate != null && availableOutgoingBitrate > 0 && availableOutgoingBitrate < 450_000) ||
    (rttMs != null && rttMs >= 260) ||
    (packetLossRatio != null && packetLossRatio >= 0.06) ||
    qualityLimitationReason === 'bandwidth'
  ) {
    return 'constrained'
  }

  // Good: Moderate latency (120-259ms) or minor packet loss (2-5%)
  if (
    (rttMs != null && rttMs >= 120) ||
    (packetLossRatio != null && packetLossRatio >= 0.02) ||
    (downlinkMbps != null && downlinkMbps > 0 && downlinkMbps < 2.5)
  ) {
    return 'good'
  }

  return 'excellent'
}

/**
 * Resolves the concrete transmission profile from user/coach mode selection + live network grade.
 */
export function resolveEffectiveBandwidthTier(
  mode: BandwidthMode,
  quality: NetworkQualityGrade,
  consecutiveDegradedSamples = 1
): ResolvedBandwidthTier {
  if (mode !== 'auto') {
    return mode
  }

  if (quality === 'critical') {
    return consecutiveDegradedSamples >= 2 ? 'audio_first' : 'low_data'
  }

  if (quality === 'constrained') {
    return 'low_data'
  }

  if (quality === 'good') {
    return consecutiveDegradedSamples >= 2 ? 'sd' : 'hd'
  }

  return 'hd'
}

export interface EvaluateBannerParams {
  peerConnectionState: RTCPeerConnectionState | null
  disconnectedDurationMs: number
  effectiveTier: ResolvedBandwidthTier
  networkQuality: NetworkQualityGrade
  hasRecentSignalingHeartbeat: boolean
  gracePeriodMs?: number
}

/**
 * Determines whether to show no banner, a calm Low-Bandwidth Active status,
 * an Amber Stabilizing grace banner, or the Red NASM Fail-Safe banner.
 *
 * Prevents hair-trigger red NASM banners during brief mobile LTE handoffs or
 * intentional Audio-First / Low-Data training sessions.
 */
export function evaluateConnectionBannerState({
  peerConnectionState,
  disconnectedDurationMs,
  effectiveTier,
  networkQuality,
  hasRecentSignalingHeartbeat,
  gracePeriodMs = DISCONNECT_FAILSAFE_GRACE_MS,
}: EvaluateBannerParams): ConnectionBannerState {
  if (peerConnectionState === 'failed') {
    if (effectiveTier === 'audio_first' && hasRecentSignalingHeartbeat && disconnectedDurationMs < gracePeriodMs) {
      return 'reconnecting_grace'
    }
    return 'nasm_failsafe'
  }

  if (peerConnectionState === 'disconnected') {
    if (disconnectedDurationMs < gracePeriodMs) {
      return 'reconnecting_grace'
    }
    if (effectiveTier === 'audio_first' && hasRecentSignalingHeartbeat) {
      return 'low_bandwidth_active'
    }
    return 'nasm_failsafe'
  }

  if (
    effectiveTier === 'audio_first' ||
    effectiveTier === 'low_data' ||
    networkQuality === 'constrained' ||
    networkQuality === 'critical'
  ) {
    return 'low_bandwidth_active'
  }

  return 'none'
}

/**
 * Applies resolution/framerate throttling to an existing local camera stream so low-bandwidth
 * devices conserve battery, thermal headroom, and uplink queue pressure.
 *
 * Note: In `audio_first` mode we keep the local camera track enabled at low framerate if possible
 * so periodic 10 KB form-check snapshots can still be captured locally while WebRTC RTP video
 * transmission is paused at the RTCRtpSender layer (`encoding.active = false`).
 */
export async function applyCameraBandwidthConstraints(
  stream: MediaStream | null,
  tier: ResolvedBandwidthTier
): Promise<void> {
  if (!stream) return
  const spec = BANDWIDTH_PROFILES[tier]
  const videoTracks = stream.getVideoTracks()
  for (const track of videoTracks) {
    if (typeof track.applyConstraints === 'function') {
      try {
        await track.applyConstraints({
          width: { ideal: spec.cameraWidthIdeal },
          height: { ideal: spec.cameraHeightIdeal },
          frameRate: { ideal: spec.cameraFrameRateIdeal, max: Math.max(8, spec.cameraFrameRateIdeal) },
        })
      } catch {
        // Hardware driver may ignore dynamic constraint resize on fixed webcams; sender scaling handles the rest
      }
    }
  }
}

/**
 * Captures an ultra-lightweight (~8–14 KB) JPEG posture/form check frame from a `<video>` element
 * for periodic transmission in `low_data` and `audio_first` coaching modes.
 */
export function captureLowBandwidthSnapshot(
  videoEl: HTMLVideoElement | null,
  maxWidth = 360,
  jpegQuality = 0.48
): string | null {
  if (!videoEl || typeof document === 'undefined') return null
  const vw = videoEl.videoWidth
  const vh = videoEl.videoHeight
  if (!vw || !vh || vw <= 0 || vh <= 0) return null

  try {
    const scale = Math.min(1, maxWidth / vw)
    const targetW = Math.max(160, Math.round(vw * scale))
    const targetH = Math.max(90, Math.round(vh * scale))

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(videoEl, 0, 0, targetW, targetH)
    return canvas.toDataURL('image/jpeg', jpegQuality)
  } catch {
    return null
  }
}

/**
 * Formats relative age of a periodic form snapshot for HUD badges (e.g. "Just now", "4s ago").
 */
export function formatSnapshotAge(capturedAtMs: number | null | undefined, nowMs = Date.now()): string {
  if (!capturedAtMs) return 'Live'
  const sec = Math.max(0, Math.floor((nowMs - capturedAtMs) / 1000))
  if (sec <= 2) return 'Just now'
  if (sec < 60) return `${sec}s ago`
  return `${Math.floor(sec / 60)}m ago`
}

