/**
 * Adaptive Low-Bandwidth & Audio-First Coaching Engine for Forge Athletic Live Studio.
 *
 * Enables seamless 1:1 and Multi-Peer Team live coaching across Fiber, Home Wi-Fi,
 * Congested Apartment/Gym Wi-Fi, Hotel Wi-Fi, Weak 3G/LTE, Rural 2G, Asymmetric links,
 * and Cellular Handoffs without black screens, encoder stalls, or premature lockouts.
 */

export type BandwidthMode = 'auto' | 'hd' | 'sd' | 'low_data' | 'audio_first'

export type ResolvedBandwidthTier = 'hd' | 'sd' | 'low_data' | 'audio_first'

export type NetworkQualityGrade = 'excellent' | 'good' | 'constrained' | 'critical'

export type ConnectionBannerState =
  | 'none'
  | 'low_bandwidth_active'
  | 'reconnecting_grace'
  | 'nasm_failsafe'

export const BANDWIDTH_TIER_ORDER: readonly ResolvedBandwidthTier[] = [
  'audio_first',
  'low_data',
  'sd',
  'hd',
] as const

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
  videoNetworkPriority: 'low' | 'medium' | 'high'
  audioNetworkPriority: 'high'
  opusUseDtx: boolean
}

export interface NetworkHealthSample {
  rttMs: number | null
  packetLossRatio?: number | null
  outboundPacketLossRatio?: number | null
  jitterMs?: number | null
  availableOutgoingBitrate?: number | null
  framesPerSecond?: number | null
  videoFreezeCountDelta?: number | null
  qualityLimitationReason?: string | null
  saveData?: boolean
  effectiveType?: string | null
  downlinkMbps?: number | null
  remoteBandwidthCeiling?: ResolvedBandwidthTier | null
  peerCount?: number
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
 * into a hard red NASM Fail-Safe banner. Longer than the ICE auto-restart
 * debounce so transient cellular handoffs self-heal or step down to Audio-First smoothly.
 */
export const DISCONNECT_FAILSAFE_GRACE_MS = 6500

/**
 * Max age (ms) for considering incoming Realtime signaling heartbeats active
 * when operating in ultra-low-bandwidth Audio-First / Snapshot coaching mode.
 */
export const SIGNALING_HEARTBEAT_TTL_MS = 16000

/**
 * Consecutive healthy telemetry samples required before stepping UP one bandwidth tier.
 * Prevents visible resolution/camera flapping on jittery Wi-Fi or LTE links.
 */
export const RECOVERY_STEP_UP_SAMPLES = 3

/**
 * Exponential backoff delays (ms) for automatic ICE restart retries.
 */
export const ICE_RESTART_BACKOFF_MS: readonly number[] = [2500, 4500, 7500, 11000, 15000] as const

export const BANDWIDTH_PROFILES: Record<ResolvedBandwidthTier, BandwidthProfileSpec> = {
  hd: {
    tier: 'hd',
    label: 'Studio HD',
    shortLabel: 'HD',
    estimatedKbps: '~2,500 kbps',
    description: '1080p 30fps cinema studio video & 48kHz isolated voice',
    videoEnabled: true,
    maxVideoBitrate: 2_500_000,
    maxAudioBitrate: 64_000,
    maxFramerate: 30,
    scaleResolutionDownBy: 1,
    degradationPreference: 'maintain-resolution',
    cameraWidthIdeal: 1920,
    cameraHeightIdeal: 1080,
    cameraFrameRateIdeal: 30,
    snapshotIntervalMs: null,
    videoNetworkPriority: 'medium',
    audioNetworkPriority: 'high',
    opusUseDtx: false,
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
    videoNetworkPriority: 'low',
    audioNetworkPriority: 'high',
    opusUseDtx: true,
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
    videoNetworkPriority: 'low',
    audioNetworkPriority: 'high',
    opusUseDtx: true,
  },
  audio_first: {
    tier: 'audio_first',
    label: 'Audio + Form Snapshots',
    shortLabel: 'Audio-First',
    estimatedKbps: '~36 kbps',
    description: 'Crystal-clear voice coaching + live cues + periodic form check snapshots',
    videoEnabled: false,
    maxVideoBitrate: 45_000,
    maxAudioBitrate: 28_000,
    maxFramerate: 5,
    scaleResolutionDownBy: 4,
    degradationPreference: 'maintain-resolution',
    cameraWidthIdeal: 360,
    cameraHeightIdeal: 202,
    cameraFrameRateIdeal: 8,
    snapshotIntervalMs: 4500,
    videoNetworkPriority: 'low',
    audioNetworkPriority: 'high',
    opusUseDtx: true,
  },
}

export const BANDWIDTH_MODE_OPTIONS: Array<{ mode: BandwidthMode; label: string; hint: string }> = [
  { mode: 'auto', label: 'Auto Adapt', hint: 'Automatically scales HD → SD → Low Data → Audio-First' },
  { mode: 'hd', label: 'Studio HD', hint: '1080p 30fps (~2.5 Mbps)' },
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

export function getBandwidthTierRank(tier: ResolvedBandwidthTier): number {
  return BANDWIDTH_TIER_ORDER.indexOf(tier)
}

export function minBandwidthTier(
  a: ResolvedBandwidthTier,
  b: ResolvedBandwidthTier | null | undefined
): ResolvedBandwidthTier {
  if (!b) return a
  return getBandwidthTierRank(a) <= getBandwidthTierRank(b) ? a : b
}

export function stepDownBandwidthTier(current: ResolvedBandwidthTier): ResolvedBandwidthTier {
  const idx = getBandwidthTierRank(current)
  return BANDWIDTH_TIER_ORDER[Math.max(0, idx - 1)]
}

export function stepUpBandwidthTier(current: ResolvedBandwidthTier): ResolvedBandwidthTier {
  const idx = getBandwidthTierRank(current)
  return BANDWIDTH_TIER_ORDER[Math.min(BANDWIDTH_TIER_ORDER.length - 1, idx + 1)]
}

/**
 * Classifies live connection telemetry (inbound + outbound loss, RTT, jitter, video freezes,
 * encoder bandwidth limitation, and browser radio hints) into actionable quality grades.
 */
export function evaluateNetworkQuality(sample: NetworkHealthSample): NetworkQualityGrade {
  const {
    rttMs,
    packetLossRatio,
    outboundPacketLossRatio,
    jitterMs,
    availableOutgoingBitrate,
    framesPerSecond,
    videoFreezeCountDelta,
    qualityLimitationReason,
    saveData,
    effectiveType,
    downlinkMbps,
  } = sample

  const normalizedType = effectiveType?.toLowerCase() ?? null
  const worstLoss = Math.max(packetLossRatio ?? 0, outboundPacketLossRatio ?? 0)
  const hasLoss = packetLossRatio != null || outboundPacketLossRatio != null

  // Critical: 2G / slow-2G, ultra-low uplink/downlink (<250 kbps), extreme RTT (>=650ms),
  // heavy packet loss (>=18%), severe jitter (>=120ms), or sustained video freeze with severe stall
  if (
    normalizedType === 'slow-2g' ||
    normalizedType === '2g' ||
    (downlinkMbps != null && downlinkMbps > 0 && downlinkMbps < 0.25) ||
    (availableOutgoingBitrate != null && availableOutgoingBitrate > 0 && availableOutgoingBitrate < 110_000) ||
    (rttMs != null && rttMs >= 650) ||
    (hasLoss && worstLoss >= 0.18) ||
    (jitterMs != null && jitterMs >= 120) ||
    ((videoFreezeCountDelta ?? 0) >= 3 && framesPerSecond != null && framesPerSecond <= 3)
  ) {
    return 'critical'
  }

  // Constrained: Data Saver enabled, 3G, low bandwidth (<1.1 Mbps), elevated RTT (>=260ms),
  // loss (>=6%), jitter (>=45ms), video freeze events, stalled framerate (<=5fps), or encoder bandwidth-limited
  if (
    saveData === true ||
    normalizedType === '3g' ||
    (downlinkMbps != null && downlinkMbps > 0 && downlinkMbps < 1.1) ||
    (availableOutgoingBitrate != null && availableOutgoingBitrate > 0 && availableOutgoingBitrate < 450_000) ||
    (rttMs != null && rttMs >= 260) ||
    (hasLoss && worstLoss >= 0.06) ||
    (jitterMs != null && jitterMs >= 45) ||
    (videoFreezeCountDelta != null && videoFreezeCountDelta >= 1) ||
    (framesPerSecond != null && framesPerSecond > 0 && framesPerSecond <= 5) ||
    qualityLimitationReason === 'bandwidth'
  ) {
    return 'constrained'
  }

  // Good: Moderate latency (120-259ms), minor loss (2-5%), moderate uplink (<1.8 Mbps), or moderate downlink (<2.5 Mbps)
  if (
    (rttMs != null && rttMs >= 120) ||
    (hasLoss && worstLoss >= 0.02) ||
    (jitterMs != null && jitterMs >= 25) ||
    (availableOutgoingBitrate != null && availableOutgoingBitrate > 0 && availableOutgoingBitrate < 1_500_000) ||
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

export interface AdaptiveHysteresisInput {
  mode: BandwidthMode
  currentTier: ResolvedBandwidthTier
  quality: NetworkQualityGrade
  consecutiveDegradedSamples: number
  consecutiveHealthySamples: number
  remoteBandwidthCeiling?: ResolvedBandwidthTier | null
  videoFreezeCountDelta?: number | null
}

/**
 * Anti-flapping bandwidth tier resolver:
 * - Steps DOWN rapidly when congestion, freezes, or loss hit so coaching audio never drops.
 * - Steps UP conservatively (one tier at a time after `RECOVERY_STEP_UP_SAMPLES` clean samples)
 *   so jittery Wi-Fi/LTE never thrashes between HD and Low Data.
 * - Always respects asymmetric receiver pressure (`remoteBandwidthCeiling`) in `auto` mode.
 */
export function resolveAdaptiveTierWithHysteresis(
  input: AdaptiveHysteresisInput
): ResolvedBandwidthTier {
  const {
    mode,
    currentTier,
    quality,
    consecutiveDegradedSamples,
    consecutiveHealthySamples,
    remoteBandwidthCeiling,
    videoFreezeCountDelta,
  } = input

  if (mode !== 'auto') {
    return mode
  }

  const target = resolveEffectiveBandwidthTier('auto', quality, Math.max(1, consecutiveDegradedSamples))
  const cappedTarget = minBandwidthTier(target, remoteBandwidthCeiling)
  const currentRank = getBandwidthTierRank(currentTier)
  const targetRank = getBandwidthTierRank(cappedTarget)

  // Immediate freeze protection: step down at least 1 tier if video is actively freezing
  if ((videoFreezeCountDelta ?? 0) >= 1 && currentRank > 0 && targetRank >= currentRank) {
    return minBandwidthTier(stepDownBandwidthTier(currentTier), remoteBandwidthCeiling)
  }

  // Fast step-down on congestion
  if (targetRank < currentRank) {
    return cappedTarget
  }

  // Conservative step-up: only climb 1 tier per RECOVERY_STEP_UP_SAMPLES clean intervals
  if (targetRank > currentRank) {
    if (consecutiveHealthySamples >= RECOVERY_STEP_UP_SAMPLES) {
      return minBandwidthTier(stepUpBandwidthTier(currentTier), cappedTarget)
    }
    return currentTier
  }

  return cappedTarget
}

/**
 * Computes per-peer video bitrate, framerate, and resolution scale for Multi-Peer Team Studio
 * so a coach on residential upload (e.g. 2–5 Mbps) never saturates their uplink across 2–10 athletes.
 */
export interface MultiPeerSenderBudget {
  maxVideoBitrate: number
  maxAudioBitrate: number
  maxFramerate: number
  scaleResolutionDownBy: number
  videoEnabled: boolean
  effectiveTier: ResolvedBandwidthTier
}

export function computeMultiPeerSenderBudget(params: {
  tier: ResolvedBandwidthTier
  peerCount: number
  isSpotlighted?: boolean
  availableOutgoingBitrate?: number | null
}): MultiPeerSenderBudget {
  const { tier, peerCount, isSpotlighted = false, availableOutgoingBitrate } = params
  const spec = BANDWIDTH_PROFILES[tier]
  const safePeers = Math.max(1, peerCount)

  if (!spec.videoEnabled) {
    return {
      maxVideoBitrate: spec.maxVideoBitrate,
      maxAudioBitrate: spec.maxAudioBitrate,
      maxFramerate: spec.maxFramerate,
      scaleResolutionDownBy: spec.scaleResolutionDownBy,
      videoEnabled: false,
      effectiveTier: 'audio_first',
    }
  }

  // Total upload ceiling: either 78% of measured availableOutgoingBitrate or a conservative 2.5 Mbps cap
  const totalUploadBudget =
    typeof availableOutgoingBitrate === 'number' && availableOutgoingBitrate > 0
      ? Math.max(80_000, Math.round(availableOutgoingBitrate * 0.78))
      : Math.max(spec.maxVideoBitrate, 2_500_000)

  // Reserve guaranteed audio headroom per peer first so voice NEVER starves
  const totalAudioReserve = safePeers * spec.maxAudioBitrate
  const remainingVideoBudget = Math.max(0, totalUploadBudget - totalAudioReserve)

  if (remainingVideoBudget < safePeers * 70_000) {
    return {
      maxVideoBitrate: BANDWIDTH_PROFILES.audio_first.maxVideoBitrate,
      maxAudioBitrate: BANDWIDTH_PROFILES.audio_first.maxAudioBitrate,
      maxFramerate: BANDWIDTH_PROFILES.audio_first.maxFramerate,
      scaleResolutionDownBy: BANDWIDTH_PROFILES.audio_first.scaleResolutionDownBy,
      videoEnabled: false,
      effectiveTier: 'audio_first',
    }
  }

  // Spotlighted peer receives 1.5x share when multiple peers are connected
  const spotlightBoost = safePeers > 1 && isSpotlighted ? 1.45 : 1.0
  const fairPerPeerVideo = Math.round((remainingVideoBudget / safePeers) * spotlightBoost)
  const cappedBitrate = Math.min(spec.maxVideoBitrate, Math.max(95_000, fairPerPeerVideo))

  if (cappedBitrate < 220_000) {
    return {
      maxVideoBitrate: cappedBitrate,
      maxAudioBitrate: BANDWIDTH_PROFILES.low_data.maxAudioBitrate,
      maxFramerate: Math.min(spec.maxFramerate, 12),
      scaleResolutionDownBy: Math.max(spec.scaleResolutionDownBy, 3),
      videoEnabled: true,
      effectiveTier: 'low_data',
    }
  }

  if (cappedBitrate < 700_000) {
    return {
      maxVideoBitrate: cappedBitrate,
      maxAudioBitrate: BANDWIDTH_PROFILES.sd.maxAudioBitrate,
      maxFramerate: Math.min(spec.maxFramerate, 20),
      scaleResolutionDownBy: Math.max(spec.scaleResolutionDownBy, 2),
      videoEnabled: true,
      effectiveTier: 'sd',
    }
  }

  return {
    maxVideoBitrate: cappedBitrate,
    maxAudioBitrate: spec.maxAudioBitrate,
    maxFramerate: spec.maxFramerate,
    scaleResolutionDownBy: spec.scaleResolutionDownBy,
    videoEnabled: true,
    effectiveTier: tier,
  }
}

/**
 * Enhances WebRTC SDP Opus parameters for voice coaching resilience across poor connections:
 * - Enables in-band Forward Error Correction (`useinbandfec=1`) on all tiers to recover lost voice packets.
 * - Enables Discontinuous Transmission (`usedtx=1`) on SD / Low Data / Audio-First to save ~50% audio bandwidth during silence.
 * - Enforces mono voice (`stereo=0`) & caps `maxaveragebitrate` cleanly per tier.
 */
export function enhanceSdpForResilientCoaching(
  sdp: string,
  tier: ResolvedBandwidthTier
): string {
  if (!sdp || typeof sdp !== 'string') return sdp
  const spec = BANDWIDTH_PROFILES[tier]
  const lines = sdp.split(/\r?\n/)

  // Find Opus payload type (e.g. `a=rtpmap:111 opus/48000/2`)
  let opusPt: string | null = null
  for (const line of lines) {
    const match = line.match(/^a=rtpmap:(\d+)\s+opus\/48000/i)
    if (match) {
      opusPt = match[1]
      break
    }
  }
  if (!opusPt) return sdp

  const fmtpPrefix = `a=fmtp:${opusPt} `
  const desiredParams: Record<string, string> = {
    useinbandfec: '1',
    stereo: '0',
    'sprop-stereo': '0',
    maxaveragebitrate: String(spec.maxAudioBitrate),
  }
  if (spec.opusUseDtx) {
    desiredParams.usedtx = '1'
  }

  let foundFmtp = false
  const updated = lines.map(line => {
    if (!line.startsWith(fmtpPrefix)) return line
    foundFmtp = true
    const rawParams = line.slice(fmtpPrefix.length).trim()
    const paramMap = new Map<string, string>()
    if (rawParams) {
      for (const pair of rawParams.split(';')) {
        const trimmed = pair.trim()
        if (!trimmed) continue
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx > 0) {
          paramMap.set(trimmed.slice(0, eqIdx).trim().toLowerCase(), trimmed.slice(eqIdx + 1).trim())
        }
      }
    }
    for (const [k, v] of Object.entries(desiredParams)) {
      paramMap.set(k, v)
    }
    if (!spec.opusUseDtx) {
      paramMap.delete('usedtx')
    }
    const serialized = Array.from(paramMap.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join(';')
    return `${fmtpPrefix}${serialized}`
  })

  if (!foundFmtp) {
    const rtpmapIdx = updated.findIndex(line => new RegExp(`^a=rtpmap:${opusPt}\\s+opus/48000`, 'i').test(line))
    if (rtpmapIdx >= 0) {
      const serialized = Object.entries(desiredParams)
        .map(([k, v]) => `${k}=${v}`)
        .join(';')
      updated.splice(rtpmapIdx + 1, 0, `${fmtpPrefix}${serialized}`)
    }
  }

  const lineEnding = sdp.includes('\r\n') ? '\r\n' : '\n'
  return updated.join(lineEnding)
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
