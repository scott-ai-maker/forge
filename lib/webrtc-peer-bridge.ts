import type { RealtimeChannel } from '@supabase/supabase-js'
import {
  BANDWIDTH_PROFILES,
  ICE_RESTART_BACKOFF_MS,
  detectBrowserNetworkHint,
  enhanceSdpForResilientCoaching,
  evaluateNetworkQuality,
  getBandwidthTierRank,
  minBandwidthTier,
  resolveAdaptiveTierWithHysteresis,
  resolveEffectiveBandwidthTier,
  type BandwidthMode,
  type CoachingSyncPayload,
  type NetworkHealthSample,
  type NetworkQualityGrade,
  type ResolvedBandwidthTier,
} from './live-bandwidth-profiles'
import { trackEvent } from '@/src/lib/telemetry/telemetryClient'

/**
 * Returns vetted STUN servers plus any server-issued ephemeral TURN servers.
 * SECURITY (#30): Unvetted public community TURN relays (`openrelay.metered.ca`)
 * and client-exposed `NEXT_PUBLIC_TURN_*` secrets are strictly prohibited.
 * Enterprise TURN credentials are fetched dynamically from `/api/webrtc/ice-servers`.
 */
export function getIceServers(ephemeralTurnServers?: RTCIceServer[]): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ]

  if (Array.isArray(ephemeralTurnServers) && ephemeralTurnServers.length > 0) {
    return [...ephemeralTurnServers, ...servers]
  }

  return servers
}

export async function fetchAuthenticatedIceServers(timeoutMs = 1500): Promise<RTCIceServer[]> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    return getIceServers()
  }
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null
  try {
    const res = await fetch('/api/webrtc/ice-servers', {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller?.signal,
    })
    if (!res.ok) return getIceServers()
    const payload = (await res.json()) as { iceServers?: RTCIceServer[] }
    if (Array.isArray(payload?.iceServers) && payload.iceServers.length > 0) {
      return payload.iceServers
    }
  } catch {
    // Fall back to vetted STUN servers when offline, timed out, or in test environments
  } finally {
    if (timer) clearTimeout(timer)
  }
  return getIceServers()
}

export const DEFAULT_ICE_SERVERS: RTCIceServer[] = getIceServers()

export const DEFAULT_RTC_CONFIG: RTCConfiguration = {
  iceServers: DEFAULT_ICE_SERVERS,
  iceCandidatePoolSize: 10,
}

export interface LobbyParticipant {
  userId: string
  name: string
  role: 'coach' | 'athlete'
  joinedAt: number
  cameraActive?: boolean
  micActive?: boolean
  teamId?: string
  isSpotlighted?: boolean
  isSpeaking?: boolean
  latencyMs?: number
}

export interface WebRtcSignalPayload {
  type:
    | 'offer'
    | 'answer'
    | 'candidate'
    | 'join'
    | 'ready'
    | 'ready-ack'
    | 'ping'
    | 'pong'
    | 'mute'
    | 'spotlight'
    | 'team-cue'
    | 'circuit-timer'
    | 'bandwidth-mode'
    | 'bandwidth-ceiling'
    | 'ice-restart-request'
    | 'media-ready'
    | 'form-snapshot'
    | 'request-snapshot'
    | 'coaching-sync'
  senderId: string
  senderRole?: 'coach' | 'athlete'
  targetUserId?: string
  senderName?: string
  sdp?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit | null
  timestamp?: number
  rtt?: number
  data?: unknown
}

export interface WebRtcBridgeOptions {
  sessionId: string
  currentUserId: string
  isCoach: boolean
  isPolite?: boolean
  channel?: RealtimeChannel | null
  localStream?: MediaStream | null
  iceServers?: RTCIceServer[]
  initialBandwidthMode?: BandwidthMode
  onRemoteStream?: (stream: MediaStream) => void
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void
  onIceConnectionStateChange?: (state: RTCIceConnectionState) => void
  onLatencyChange?: (rttMs: number) => void
  onNetworkQualityChange?: (
    quality: NetworkQualityGrade,
    effectiveTier: ResolvedBandwidthTier,
    sample: NetworkHealthSample
  ) => void
  onBandwidthModeSignal?: (mode: BandwidthMode, senderId: string) => void
  onFormSnapshot?: (dataUrl: string, timestamp: number, senderId: string) => void
  onSnapshotRequested?: (senderId: string) => void
  onCoachingSync?: (sync: CoachingSyncPayload) => void
  onSignalHeartbeat?: (timestamp: number) => void
  onError?: (err: Error) => void
}

function getRTCPeerConnectionConstructor(): typeof RTCPeerConnection | undefined {
  if (typeof window !== 'undefined' && window.RTCPeerConnection) {
    return window.RTCPeerConnection
  }
  if (typeof globalThis !== 'undefined' && 'RTCPeerConnection' in globalThis) {
    return (globalThis as unknown as { RTCPeerConnection: typeof RTCPeerConnection }).RTCPeerConnection
  }
  return undefined
}

function getRTCSessionDescription(sdp: RTCSessionDescriptionInit): RTCSessionDescription {
  const globalDesc = typeof globalThis !== 'undefined' && 'RTCSessionDescription' in globalThis
    ? (globalThis as unknown as { RTCSessionDescription: typeof RTCSessionDescription }).RTCSessionDescription
    : undefined
  const ctor = (typeof window !== 'undefined' && window.RTCSessionDescription) || globalDesc
  return ctor ? new ctor(sdp) : (sdp as unknown as RTCSessionDescription)
}

function getRTCIceCandidate(cand: RTCIceCandidateInit): RTCIceCandidate {
  const globalCand = typeof globalThis !== 'undefined' && 'RTCIceCandidate' in globalThis
    ? (globalThis as unknown as { RTCIceCandidate: typeof RTCIceCandidate }).RTCIceCandidate
    : undefined
  const ctor = (typeof window !== 'undefined' && window.RTCIceCandidate) || globalCand
  return ctor ? new ctor(cand) : (cand as unknown as RTCIceCandidate)
}

export function isWebRtcSupported(): boolean {
  return !!getRTCPeerConnectionConstructor()
}

/**
 * Enterprise WebRTC Peer Connection Manager for 1:1 Live Coach Gordon Studio.
 * Implements W3C Perfect Negotiation, Opus FEC/DTX voice resilience, DSCP voice priority,
 * anti-flapping hysteresis, asymmetric receiver bandwidth-ceiling pressure signaling,
 * video-freeze detection, and bidirectional exponential-backoff ICE restart.
 */
export class WebRtcPeerBridge {
  private pc: RTCPeerConnection | null = null
  private remoteStream: MediaStream | null = null
  private options: WebRtcBridgeOptions
  private pendingCandidates: RTCIceCandidateInit[] = []
  private isDestroyed = false

  // Perfect Negotiation State
  private isPolite: boolean
  private makingOffer = false
  private inFlightOfferPromise: Promise<RTCSessionDescriptionInit | null> | null = null
  private ignoreOffer = false
  private isSettingRemoteAnswerPending = false
  private negotiationPending = false

  // ICE Debounce, Backoff & Latency State
  private iceRestartTimer: ReturnType<typeof setTimeout> | null = null
  private politeIceFallbackTimer: ReturnType<typeof setTimeout> | null = null
  private isRestartingIce = false
  private iceRestartAttempts = 0
  private lastPingTimestamp = 0
  private latencyMs: number | null = null

  // Adaptive Bandwidth & Network Telemetry State
  private bandwidthMode: BandwidthMode = 'auto'
  private effectiveTier: ResolvedBandwidthTier = 'hd'
  private remoteBandwidthCeiling: ResolvedBandwidthTier | null = null
  private lastBroadcastedCeiling: ResolvedBandwidthTier | null = null
  private networkQuality: NetworkQualityGrade = 'excellent'
  private consecutiveDegradedSamples = 0
  private consecutiveHealthySamples = 0
  private prevPacketsReceived = 0
  private prevPacketsLost = 0
  private prevFreezeCount = 0
  private prevOutboundPacketsSent = 0
  private prevOutboundRetransmitted = 0
  private lastMeasuredOutgoingBitrate: number | null = null

  constructor(options: WebRtcBridgeOptions) {
    this.options = options
    // Athlete is polite (yields on offer glare), Coach is impolite (assertive).
    this.isPolite = options.isPolite ?? !options.isCoach
    this.bandwidthMode = options.initialBandwidthMode ?? 'auto'

    const initialHint = detectBrowserNetworkHint()
    const initialQuality = evaluateNetworkQuality({
      rttMs: initialHint.rttMs ?? null,
      saveData: initialHint.saveData,
      effectiveType: initialHint.effectiveType,
      downlinkMbps: initialHint.downlinkMbps,
    })
    this.networkQuality = initialQuality
    this.effectiveTier = resolveEffectiveBandwidthTier(this.bandwidthMode, initialQuality, 1)
  }

  public setIceServers(servers: RTCIceServer[]): void {
    if (!servers.length) return
    this.options.iceServers = servers
    if (!this.isDestroyed && this.pc && typeof this.pc.setConfiguration === 'function') {
      try {
        this.pc.setConfiguration({
          ...DEFAULT_RTC_CONFIG,
          iceServers: servers,
        })
      } catch {
        // Ignore if browser rejects mid-negotiation reconfiguration
      }
    }
  }

  public init(): RTCPeerConnection | null {
    const RTCPeerConnectionClass = getRTCPeerConnectionConstructor()
    if (!RTCPeerConnectionClass) {
      return null
    }

    try {
      this.pc = new RTCPeerConnectionClass({
        ...DEFAULT_RTC_CONFIG,
        iceServers: this.options.iceServers?.length
          ? this.options.iceServers
          : getIceServers(),
      })

      // Asynchronously upgrade peer configuration with server-authenticated TURN servers when not pre-fetched
      if (!this.options.iceServers?.length && typeof window !== 'undefined' && typeof this.pc.setConfiguration === 'function') {
        void fetchAuthenticatedIceServers().then(authenticatedServers => {
          if (!this.isDestroyed && this.pc && typeof this.pc.setConfiguration === 'function') {
            try {
              this.pc.setConfiguration({
                ...DEFAULT_RTC_CONFIG,
                iceServers: authenticatedServers,
              })
            } catch {
              // Browser may disallow setConfiguration during active negotiation
            }
          }
        })
      }
      const globalMediaStream = typeof globalThis !== 'undefined' && 'MediaStream' in globalThis
        ? (globalThis as unknown as { MediaStream: typeof MediaStream }).MediaStream
        : undefined
      const MediaStreamClass = typeof window !== 'undefined' ? window.MediaStream : globalMediaStream
      this.remoteStream = MediaStreamClass ? new MediaStreamClass() : null

      // Pre-allocate audio & video transceivers with bidirectional sendrecv support
      if (typeof this.pc.addTransceiver === 'function') {
        try {
          this.pc.addTransceiver('audio', { direction: 'sendrecv' })
          this.pc.addTransceiver('video', { direction: 'sendrecv' })
        } catch {
          // Fall back to dynamic track attachment
        }
      }

      // Perfect Negotiation: onnegotiationneeded triggers offer generation automatically
      this.pc.onnegotiationneeded = async () => {
        if (this.isDestroyed || !this.pc || this.isPolite) return
        if (this.makingOffer || this.pc.signalingState !== 'stable') {
          this.negotiationPending = true
          return
        }
        await this.createOffer()
      }

      // Track listeners with live unmute event handling
      this.pc.ontrack = event => {
        if (event.streams && event.streams[0]) {
          this.remoteStream = event.streams[0]
        } else if (event.track) {
          if (!this.remoteStream && MediaStreamClass) {
            this.remoteStream = new MediaStreamClass()
          }
          if (this.remoteStream) {
            const hasTrack = this.remoteStream.getTracks().some(t => t.id === event.track.id)
            if (!hasTrack) {
              this.remoteStream.addTrack(event.track)
            }
          }
        }

        const notifyStream = () => {
          if (this.remoteStream && this.options.onRemoteStream) {
            try {
              const fresh = new (MediaStreamClass || MediaStream)(this.remoteStream.getTracks())
              this.options.onRemoteStream(fresh)
            } catch {
              this.options.onRemoteStream(this.remoteStream)
            }
          }
        }

        if (event.track) {
          event.track.onunmute = () => {
            notifyStream()
          }
        }

        notifyStream()
      }

      // Connection state changes
      this.pc.onconnectionstatechange = () => {
        if (!this.pc || this.isDestroyed) return
        const state = this.pc.connectionState
        if (state === 'connected') {
          this.iceRestartAttempts = 0
          this.isRestartingIce = false
          if (this.politeIceFallbackTimer) {
            clearTimeout(this.politeIceFallbackTimer)
            this.politeIceFallbackTimer = null
          }
        }
        if (this.options.onConnectionStateChange) {
          this.options.onConnectionStateChange(state)
        }
      }

      // ICE connection state changes & exponential-backoff auto-restart on disconnect/fail
      this.pc.oniceconnectionstatechange = () => {
        if (!this.pc || this.isDestroyed) return
        const state = this.pc.iceConnectionState
        this.options.onIceConnectionStateChange?.(state)

        if (state === 'connected' || state === 'completed') {
          if (this.iceRestartTimer) {
            clearTimeout(this.iceRestartTimer)
            this.iceRestartTimer = null
          }
          if (this.politeIceFallbackTimer) {
            clearTimeout(this.politeIceFallbackTimer)
            this.politeIceFallbackTimer = null
          }
          this.isRestartingIce = false
          this.iceRestartAttempts = 0
          return
        }

        if (state === 'disconnected') {
          // Debounce transient cellular/Wi-Fi handoffs before triggering ICE restart
          if (!this.iceRestartTimer && !this.isRestartingIce) {
            const delayMs = ICE_RESTART_BACKOFF_MS[Math.min(this.iceRestartAttempts, ICE_RESTART_BACKOFF_MS.length - 1)]
            this.iceRestartTimer = setTimeout(() => {
              this.iceRestartTimer = null
              if (
                this.pc &&
                (this.pc.iceConnectionState === 'disconnected' || this.pc.iceConnectionState === 'failed')
              ) {
                void this.restartIce()
              }
            }, delayMs)
          }
        } else if (state === 'failed') {
          if (this.iceRestartTimer) {
            clearTimeout(this.iceRestartTimer)
            this.iceRestartTimer = null
          }
          void this.restartIce()
        }
      }

      // ICE candidates generated locally
      this.pc.onicecandidate = event => {
        if (event.candidate && this.options.channel) {
          this.sendSignal({
            type: 'candidate',
            senderId: this.options.currentUserId,
            candidate: event.candidate.toJSON(),
          })
        }
      }

      // Attach initial local stream tracks if provided
      if (this.options.localStream) {
        this.attachLocalStream(this.options.localStream)
      }

      return this.pc
    } catch (err) {
      if (this.options.onError) {
        this.options.onError(err instanceof Error ? err : new Error(String(err)))
      }
      return null
    }
  }

  private sendSignal(payload: WebRtcSignalPayload): void {
    if (this.isDestroyed || !this.options.channel) return
    try {
      void this.options.channel.send({
        type: 'broadcast',
        event: 'webrtc_signal',
        payload: {
          ...payload,
          timestamp: payload.timestamp || Date.now(),
        },
      })
    } catch {
      // Channel send error caught gracefully
    }
  }

  public attachLocalStream(stream: MediaStream): void {
    this.options.localStream = stream
    if (!this.pc) return

    const transceivers = typeof this.pc.getTransceivers === 'function' ? this.pc.getTransceivers() : []

    stream.getTracks().forEach(track => {
      // 1. Check existing transceivers first
      const transceiver = transceivers.find(t =>
        t.sender?.track?.id === track.id ||
        t.sender?.track?.kind === track.kind ||
        t.receiver?.track?.kind === track.kind
      )

      if (transceiver) {
        if (transceiver.direction !== 'sendrecv') {
          transceiver.direction = 'sendrecv'
        }
        void transceiver.sender.replaceTrack(track).catch(() => {})
        if (track.kind === 'video') {
          this.optimizeVideoSender(transceiver.sender, this.effectiveTier)
        } else if (track.kind === 'audio') {
          this.optimizeAudioSender(transceiver.sender, this.effectiveTier)
        }
        return
      }

      // 2. Fall back to existing senders
      const senders = this.pc!.getSenders()
      const existing = senders.find(s => s.track?.kind === track.kind)
      if (existing) {
        void existing.replaceTrack(track).catch(() => {})
        if (track.kind === 'video') {
          this.optimizeVideoSender(existing, this.effectiveTier)
        } else if (track.kind === 'audio') {
          this.optimizeAudioSender(existing, this.effectiveTier)
        }
      } else {
        try {
          const sender = this.pc?.addTrack(track, stream)
          if (sender && track.kind === 'video') {
            this.optimizeVideoSender(sender, this.effectiveTier)
          } else if (sender && track.kind === 'audio') {
            this.optimizeAudioSender(sender, this.effectiveTier)
          }
        } catch {
          // Track already added to peer connection
        }
      }
    })

    if (this.pc.signalingState === 'stable') {
      if (!this.isPolite) {
        void this.createOffer()
      } else {
        // Notify impolite Coach that Athlete's camera/mic tracks are now attached so Coach
        // renegotiates `sendrecv` if initial offer/answer completed before iOS camera permission.
        this.sendSignal({
          type: 'media-ready',
          senderId: this.options.currentUserId,
          timestamp: Date.now(),
        })
      }
    } else {
      this.negotiationPending = true
      if (this.isPolite) {
        this.sendSignal({
          type: 'media-ready',
          senderId: this.options.currentUserId,
          timestamp: Date.now(),
        })
      }
    }
  }

  private optimizeVideoSender(sender: RTCRtpSender, tier: ResolvedBandwidthTier = this.effectiveTier): void {
    try {
      const spec = BANDWIDTH_PROFILES[tier]
      const params = sender.getParameters()
      if (!params.encodings || params.encodings.length === 0) {
        params.encodings = [{}]
      }
      const enc = params.encodings[0] as RTCRtpEncodingParameters & {
        priority?: 'very-low' | 'low' | 'medium' | 'high'
        networkPriority?: 'very-low' | 'low' | 'medium' | 'high'
      }

      // Cap video bitrate safely below measured outgoing pipe when operating in auto mode
      let targetBitrate = spec.maxVideoBitrate
      if (
        this.bandwidthMode === 'auto' &&
        typeof this.lastMeasuredOutgoingBitrate === 'number' &&
        this.lastMeasuredOutgoingBitrate > 0
      ) {
        const safeVideoPipe = Math.max(45_000, Math.round(this.lastMeasuredOutgoingBitrate * 0.8 - spec.maxAudioBitrate))
        targetBitrate = Math.min(spec.maxVideoBitrate, safeVideoPipe)
      }

      enc.maxBitrate = targetBitrate
      enc.priority = spec.videoNetworkPriority
      enc.networkPriority = spec.videoNetworkPriority

      if (tier !== 'hd') {
        enc.active = spec.videoEnabled
        if (spec.maxFramerate > 0) {
          enc.maxFramerate = spec.maxFramerate
        }
        enc.scaleResolutionDownBy = spec.scaleResolutionDownBy
      } else {
        enc.active = true
        enc.maxFramerate = 30
        enc.scaleResolutionDownBy = 1
      }
      ;(params as RTCRtpSendParameters & { degradationPreference?: string }).degradationPreference =
        spec.degradationPreference
      void sender.setParameters(params).catch(() => {})
    } catch {
      // Optional browser optimization
    }
  }

  private optimizeAudioSender(sender: RTCRtpSender, tier: ResolvedBandwidthTier = this.effectiveTier): void {
    try {
      const spec = BANDWIDTH_PROFILES[tier]
      const params = sender.getParameters()
      if (!params.encodings || params.encodings.length === 0) {
        params.encodings = [{}]
      }
      const enc = params.encodings[0] as RTCRtpEncodingParameters & {
        priority?: 'very-low' | 'low' | 'medium' | 'high'
        networkPriority?: 'very-low' | 'low' | 'medium' | 'high'
      }
      enc.active = true
      enc.maxBitrate = spec.maxAudioBitrate
      // Voice ALWAYS takes DSCP priority over video so coaching cues remain clear on congested links
      enc.priority = spec.audioNetworkPriority
      enc.networkPriority = spec.audioNetworkPriority
      void sender.setParameters(params).catch(() => {})
    } catch {
      // Optional browser optimization
    }
  }

  public getBandwidthMode(): BandwidthMode {
    return this.bandwidthMode
  }

  public getEffectiveTier(): ResolvedBandwidthTier {
    return this.effectiveTier
  }

  public getNetworkQuality(): NetworkQualityGrade {
    return this.networkQuality
  }

  public getRemoteBandwidthCeiling(): ResolvedBandwidthTier | null {
    return this.remoteBandwidthCeiling
  }

  public getIceRestartAttempts(): number {
    return this.iceRestartAttempts
  }

  public applyBandwidthTier(tier: ResolvedBandwidthTier): void {
    this.effectiveTier = tier
    if (!this.pc || this.isDestroyed) return

    try {
      const senders = typeof this.pc.getSenders === 'function' ? this.pc.getSenders() : []
      senders.forEach(sender => {
        if (sender.track?.kind === 'video') {
          this.optimizeVideoSender(sender, tier)
        } else if (sender.track?.kind === 'audio') {
          this.optimizeAudioSender(sender, tier)
        }
      })
    } catch {
      // Graceful fallback
    }
  }

  public setBandwidthMode(mode: BandwidthMode, broadcastToPeer = true): ResolvedBandwidthTier {
    this.bandwidthMode = mode
    if (mode !== 'auto') {
      this.remoteBandwidthCeiling = null
    }
    const baseTier = resolveEffectiveBandwidthTier(mode, this.networkQuality, this.consecutiveDegradedSamples || 1)
    const nextTier = mode === 'auto' ? minBandwidthTier(baseTier, this.remoteBandwidthCeiling) : baseTier
    this.applyBandwidthTier(nextTier)

    if (broadcastToPeer) {
      this.sendSignal({
        type: 'bandwidth-mode',
        senderId: this.options.currentUserId,
        data: {
          mode,
          effectiveTier: nextTier,
        },
      })
    }
    return nextTier
  }

  public sendFormSnapshot(dataUrl: string): void {
    if (!dataUrl || this.isDestroyed) return
    this.sendSignal({
      type: 'form-snapshot',
      senderId: this.options.currentUserId,
      timestamp: Date.now(),
      data: { dataUrl },
    })
  }

  public requestPeerSnapshot(): void {
    if (this.isDestroyed) return
    this.sendSignal({
      type: 'request-snapshot',
      senderId: this.options.currentUserId,
      timestamp: Date.now(),
    })
  }

  public sendCoachingSync(sync: Omit<CoachingSyncPayload, 'timestamp'>): void {
    if (this.isDestroyed) return
    this.sendSignal({
      type: 'coaching-sync',
      senderId: this.options.currentUserId,
      timestamp: Date.now(),
      data: {
        ...sync,
        timestamp: Date.now(),
      } satisfies CoachingSyncPayload,
    })
  }

  /**
   * Samples RTCPeerConnection WebRTC RTP telemetry (inbound + outbound loss, RTT, jitter,
   * freezeCount, availableOutgoingBitrate, qualityLimitationReason) + browser radio hints,
   * applies anti-flapping hysteresis, and signals asymmetric receiver ceilings to the remote sender.
   */
  public async sampleNetworkHealth(): Promise<NetworkHealthSample | null> {
    if (this.isDestroyed || !this.pc) return null

    const browserHint = detectBrowserNetworkHint()
    let packetLossRatio: number | null = null
    let outboundPacketLossRatio: number | null = null
    let availableOutgoingBitrate: number | null = null
    let framesPerSecond: number | null = null
    let qualityLimitationReason: string | null = null
    let statsRttMs: number | null = null
    let remoteRttMs: number | null = null
    let jitterMs: number | null = null
    let videoFreezeCountDelta: number | null = null

    if (typeof this.pc.getStats === 'function') {
      try {
        const report = await this.pc.getStats()
        report.forEach((stat: Record<string, unknown>) => {
          if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
            if (typeof stat.currentRoundTripTime === 'number' && Number.isFinite(stat.currentRoundTripTime)) {
              statsRttMs = Math.round(stat.currentRoundTripTime * 1000)
            }
            if (typeof stat.availableOutgoingBitrate === 'number' && Number.isFinite(stat.availableOutgoingBitrate)) {
              availableOutgoingBitrate = stat.availableOutgoingBitrate
            }
          } else if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
            const received = typeof stat.packetsReceived === 'number' ? stat.packetsReceived : 0
            const lost = typeof stat.packetsLost === 'number' ? Math.max(0, stat.packetsLost) : 0
            const deltaRecv = received - this.prevPacketsReceived
            const deltaLost = lost - this.prevPacketsLost
            if (deltaRecv + deltaLost > 10 && deltaRecv >= 0 && deltaLost >= 0) {
              packetLossRatio = deltaLost / (deltaRecv + deltaLost)
            }
            this.prevPacketsReceived = received
            this.prevPacketsLost = lost
            if (typeof stat.framesPerSecond === 'number') {
              framesPerSecond = stat.framesPerSecond
            }
            if (typeof stat.jitter === 'number' && Number.isFinite(stat.jitter)) {
              const ms = Math.round(stat.jitter * 1000)
              jitterMs = jitterMs === null ? ms : Math.max(jitterMs, ms)
            }
            if (typeof stat.freezeCount === 'number' && Number.isFinite(stat.freezeCount)) {
              const deltaFreeze = Math.max(0, stat.freezeCount - this.prevFreezeCount)
              this.prevFreezeCount = stat.freezeCount
              videoFreezeCountDelta = deltaFreeze
            }
          } else if (stat.type === 'remote-inbound-rtp') {
            if (typeof stat.fractionLost === 'number' && Number.isFinite(stat.fractionLost)) {
              outboundPacketLossRatio =
                outboundPacketLossRatio === null
                  ? stat.fractionLost
                  : Math.max(outboundPacketLossRatio, stat.fractionLost)
            }
            if (typeof stat.roundTripTime === 'number' && Number.isFinite(stat.roundTripTime)) {
              const ms = Math.round(stat.roundTripTime * 1000)
              remoteRttMs = remoteRttMs === null ? ms : Math.max(remoteRttMs, ms)
            }
            if (typeof stat.jitter === 'number' && Number.isFinite(stat.jitter)) {
              const ms = Math.round(stat.jitter * 1000)
              jitterMs = jitterMs === null ? ms : Math.max(jitterMs, ms)
            }
          } else if (stat.type === 'outbound-rtp' && stat.kind === 'video') {
            if (typeof stat.qualityLimitationReason === 'string' && stat.qualityLimitationReason !== 'none') {
              qualityLimitationReason = stat.qualityLimitationReason
            }
            if (typeof stat.packetsSent === 'number' && typeof stat.retransmittedPacketsSent === 'number') {
              const deltaSent = stat.packetsSent - this.prevOutboundPacketsSent
              const deltaRetx = stat.retransmittedPacketsSent - this.prevOutboundRetransmitted
              if (deltaSent > 15 && deltaRetx >= 0) {
                const retxRatio = deltaRetx / deltaSent
                outboundPacketLossRatio =
                  outboundPacketLossRatio === null ? retxRatio : Math.max(outboundPacketLossRatio, retxRatio)
              }
              this.prevOutboundPacketsSent = stat.packetsSent
              this.prevOutboundRetransmitted = stat.retransmittedPacketsSent
            }
          }
        })
      } catch {
        // Ignore getStats errors on unsupported environments
      }
    }

    // Prefer true WebRTC UDP media RTT over WebSocket signaling ping so media congestion is never masked
    const webrtcMediaRtt =
      statsRttMs !== null || remoteRttMs !== null
        ? Math.max(statsRttMs ?? 0, remoteRttMs ?? 0)
        : null
    const rttMs = webrtcMediaRtt ?? this.latencyMs ?? browserHint.rttMs ?? null
    this.lastMeasuredOutgoingBitrate = availableOutgoingBitrate

    const sample: NetworkHealthSample = {
      rttMs,
      packetLossRatio,
      outboundPacketLossRatio,
      jitterMs,
      availableOutgoingBitrate,
      framesPerSecond,
      videoFreezeCountDelta,
      qualityLimitationReason,
      saveData: browserHint.saveData,
      effectiveType: browserHint.effectiveType,
      downlinkMbps: browserHint.downlinkMbps,
      remoteBandwidthCeiling: this.remoteBandwidthCeiling,
    }

    const nextQuality = evaluateNetworkQuality(sample)
    if (nextQuality === 'constrained' || nextQuality === 'critical') {
      this.consecutiveDegradedSamples = Math.min(10, this.consecutiveDegradedSamples + 1)
      this.consecutiveHealthySamples = 0
    } else if (nextQuality === 'good') {
      // Moderate link: allow step-down to SD if previously HD, or gradual recovery from audio_first/low_data
      if (this.effectiveTier === 'hd') {
        this.consecutiveDegradedSamples = Math.min(10, this.consecutiveDegradedSamples + 1)
        this.consecutiveHealthySamples = 0
      } else {
        this.consecutiveDegradedSamples = 0
        this.consecutiveHealthySamples = Math.min(10, this.consecutiveHealthySamples + 1)
      }
    } else {
      this.consecutiveDegradedSamples = 0
      this.consecutiveHealthySamples = Math.min(10, this.consecutiveHealthySamples + 1)
    }

    const nextTier = resolveAdaptiveTierWithHysteresis({
      mode: this.bandwidthMode,
      currentTier: this.effectiveTier,
      quality: nextQuality,
      consecutiveDegradedSamples: Math.max(1, this.consecutiveDegradedSamples),
      consecutiveHealthySamples: this.consecutiveHealthySamples,
      remoteBandwidthCeiling: this.remoteBandwidthCeiling,
      videoFreezeCountDelta,
    })

    // Asymmetric Receiver Pressure Signaling:
    // If our INBOUND stream or downlink is under pressure, tell the remote sender to cap its outbound video!
    if (this.bandwidthMode === 'auto') {
      const inboundPressureQuality = evaluateNetworkQuality({
        rttMs,
        packetLossRatio,
        jitterMs,
        framesPerSecond,
        videoFreezeCountDelta,
        saveData: browserHint.saveData,
        effectiveType: browserHint.effectiveType,
        downlinkMbps: browserHint.downlinkMbps,
      })

      let desiredRemoteCeiling: ResolvedBandwidthTier | null = null
      if (inboundPressureQuality === 'critical') {
        desiredRemoteCeiling = this.consecutiveDegradedSamples >= 2 ? 'audio_first' : 'low_data'
      } else if (inboundPressureQuality === 'constrained') {
        desiredRemoteCeiling = 'low_data'
      } else if (inboundPressureQuality === 'good' && browserHint.downlinkMbps != null && browserHint.downlinkMbps < 2.0) {
        desiredRemoteCeiling = 'sd'
      } else if (this.consecutiveHealthySamples >= 3) {
        desiredRemoteCeiling = 'hd'
      }

      if (desiredRemoteCeiling && desiredRemoteCeiling !== this.lastBroadcastedCeiling) {
        // Only broadcast ceiling when tightening, or when lifting a previously tightened ceiling
        if (desiredRemoteCeiling !== 'hd' || this.lastBroadcastedCeiling !== null) {
          this.lastBroadcastedCeiling = desiredRemoteCeiling === 'hd' ? null : desiredRemoteCeiling
          this.sendSignal({
            type: 'bandwidth-ceiling',
            senderId: this.options.currentUserId,
            data: { maxTier: desiredRemoteCeiling },
          })
        }
      }
    }

    const changed = nextQuality !== this.networkQuality || nextTier !== this.effectiveTier
    this.networkQuality = nextQuality
    if (nextTier !== this.effectiveTier) {
      this.applyBandwidthTier(nextTier)
    }

    if (changed) {
      this.options.onNetworkQualityChange?.(this.networkQuality, this.effectiveTier, sample)
      const profile = BANDWIDTH_PROFILES[this.effectiveTier]
      void trackEvent('live_studio_telemetry', {
        bitrate_kbps:
          typeof sample.availableOutgoingBitrate === 'number'
            ? Math.round(sample.availableOutgoingBitrate / 1000)
            : Math.round((profile?.maxVideoBitrate ?? 1_500_000) / 1000),
        resolution: profile
          ? `${profile.cameraWidthIdeal}x${profile.cameraHeightIdeal}`
          : null,
        fps: sample.framesPerSecond ?? profile?.maxFramerate ?? null,
        rtt_ms: sample.rttMs,
        packet_loss_ratio: sample.packetLossRatio ?? sample.outboundPacketLossRatio ?? null,
        quality_grade: this.networkQuality,
        studio_lut_preset: 'live_webrtc_adaptive',
        background_mode: this.effectiveTier,
      })
    }
    return sample
  }

  public sendPing(): void {
    if (this.isDestroyed || !this.options.channel) return
    this.lastPingTimestamp = Date.now()
    this.sendSignal({
      type: 'ping',
      senderId: this.options.currentUserId,
      timestamp: this.lastPingTimestamp,
    })
  }

  public getLatency(): number | null {
    return this.latencyMs
  }

  public async announcePresence(): Promise<void> {
    this.sendSignal({
      type: 'ready',
      senderId: this.options.currentUserId,
    })
  }

  /**
   * Bidirectional ICE Restart with exponential backoff & automatic bandwidth protection:
   * - If called on the polite peer (Athlete), requests an ICE restart from the Coach immediately
   *   AND schedules a direct `{ iceRestart: true }` fallback if the Coach doesn't reply in 2s.
   * - If called on the impolite peer (Coach), immediately generates and transmits an explicit
   *   `{ iceRestart: true }` offer with Opus FEC/DTX preserved.
   * - Steps down bandwidth in `auto` mode after repeated instability so voice stays alive.
   */
  public async restartIce(): Promise<void> {
    if (!this.pc || this.isDestroyed || this.isRestartingIce) return
    if (this.iceRestartAttempts >= ICE_RESTART_BACKOFF_MS.length) return

    this.isRestartingIce = true
    this.iceRestartAttempts += 1
    const cooldown = ICE_RESTART_BACKOFF_MS[Math.min(this.iceRestartAttempts - 1, ICE_RESTART_BACKOFF_MS.length - 1)]
    setTimeout(() => {
      this.isRestartingIce = false
    }, cooldown)

    // Auto-protect voice on repeated ICE instability in `auto` mode
    if (this.bandwidthMode === 'auto') {
      if (this.iceRestartAttempts >= 3 && this.effectiveTier !== 'audio_first') {
        this.applyBandwidthTier('audio_first')
        this.options.onNetworkQualityChange?.('critical', 'audio_first', { rttMs: this.latencyMs })
      } else if (this.iceRestartAttempts === 2 && getBandwidthTierRank(this.effectiveTier) > getBandwidthTierRank('low_data')) {
        this.applyBandwidthTier('low_data')
        this.options.onNetworkQualityChange?.('constrained', 'low_data', { rttMs: this.latencyMs })
      }
    }

    try {
      if (this.isPolite) {
        // Ask impolite Coach to generate the authoritative ICE-restart offer
        this.sendSignal({
          type: 'ice-restart-request',
          senderId: this.options.currentUserId,
          timestamp: Date.now(),
        })
        // Fallback: if still disconnected after 2s, send an explicit ICE restart offer directly
        if (this.politeIceFallbackTimer) clearTimeout(this.politeIceFallbackTimer)
        this.politeIceFallbackTimer = setTimeout(() => {
          this.politeIceFallbackTimer = null
          if (
            !this.isDestroyed &&
            this.pc &&
            (this.pc.iceConnectionState === 'disconnected' || this.pc.iceConnectionState === 'failed')
          ) {
            void this.sendExplicitIceRestartOffer()
          }
        }, 2000)
      } else {
        await this.sendExplicitIceRestartOffer()
      }
    } catch (err) {
      this.options.onError?.(err instanceof Error ? err : new Error(String(err)))
    }
  }

  private async sendExplicitIceRestartOffer(): Promise<void> {
    if (!this.pc || this.isDestroyed) return
    if ('restartIce' in this.pc && typeof (this.pc as { restartIce?: () => void }).restartIce === 'function') {
      try {
        ;(this.pc as { restartIce: () => void }).restartIce()
      } catch {
        // Proceed with explicit createOffer({ iceRestart: true })
      }
    }
    // Recover cleanly if a previous offer was left half-open during a network handoff
    if (this.pc.signalingState === 'have-local-offer') {
      try {
        await this.pc.setLocalDescription({ type: 'rollback' })
      } catch {
        return
      }
    }
    if (this.pc.signalingState !== 'stable') return
    const offer = await this.pc.createOffer({ iceRestart: true })
    if (!this.pc || this.pc.signalingState !== 'stable') return
    const enhancedOffer: RTCSessionDescriptionInit = {
      ...offer,
      sdp: offer.sdp ? enhanceSdpForResilientCoaching(offer.sdp, this.effectiveTier) : offer.sdp,
    }
    await this.pc.setLocalDescription(enhancedOffer)
    this.sendSignal({
      type: 'offer',
      senderId: this.options.currentUserId,
      sdp: this.pc.localDescription || enhancedOffer,
    })
  }

  public async createOffer(): Promise<RTCSessionDescriptionInit | null> {
    if (!this.pc || this.isDestroyed) return null
    if (this.inFlightOfferPromise) {
      return this.inFlightOfferPromise
    }
    if (this.makingOffer || this.pc.signalingState !== 'stable') {
      this.negotiationPending = true
      return null
    }
    this.makingOffer = true
    this.inFlightOfferPromise = (async () => {
      try {
        if (!this.pc || this.isDestroyed) return null
        const hasTransceivers = typeof this.pc.addTransceiver === 'function'
        const rawOffer = await this.pc.createOffer(
          hasTransceivers
            ? undefined
            : {
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
              }
        )
        if (!this.pc || this.pc.signalingState !== 'stable') {
          this.negotiationPending = true
          return null
        }
        const offer: RTCSessionDescriptionInit = {
          ...rawOffer,
          sdp: rawOffer.sdp
            ? enhanceSdpForResilientCoaching(rawOffer.sdp, this.effectiveTier)
            : rawOffer.sdp,
        }
        await this.pc.setLocalDescription(offer)

        this.sendSignal({
          type: 'offer',
          senderId: this.options.currentUserId,
          sdp: this.pc.localDescription || offer,
        })
        return offer
      } catch (err) {
        this.options.onError?.(err instanceof Error ? err : new Error(String(err)))
        return null
      } finally {
        this.makingOffer = false
        this.inFlightOfferPromise = null
      }
    })()
    return this.inFlightOfferPromise
  }

  private async drainPendingCandidates(): Promise<void> {
    if (!this.pc) return
    while (this.pendingCandidates.length > 0) {
      const cand = this.pendingCandidates.shift()
      if (cand) {
        try {
          await this.pc.addIceCandidate(getRTCIceCandidate(cand))
        } catch {
          // Dropped stale candidate
        }
      }
    }
  }

  public async handleSignal(payload: WebRtcSignalPayload): Promise<void> {
    if (
      this.isDestroyed ||
      !this.pc ||
      !payload ||
      payload.senderId === this.options.currentUserId ||
      (payload.targetUserId && payload.targetUserId !== '*' && payload.targetUserId !== this.options.currentUserId)
    ) {
      return
    }

    try {
      this.options.onSignalHeartbeat?.(Date.now())

      // Bidirectional Adaptive Bandwidth Mode Synchronization
      if (payload.type === 'bandwidth-mode' && payload.data) {
        const incoming = payload.data as { mode?: BandwidthMode }
        if (incoming.mode) {
          this.setBandwidthMode(incoming.mode, false)
          this.options.onBandwidthModeSignal?.(incoming.mode, payload.senderId)
        }
        return
      }

      // Asymmetric Receiver Bandwidth Ceiling (caps outbound video without leaving `auto` mode)
      if (payload.type === 'bandwidth-ceiling' && payload.data) {
        const incoming = payload.data as { maxTier?: ResolvedBandwidthTier }
        if (incoming.maxTier && incoming.maxTier in BANDWIDTH_PROFILES) {
          this.remoteBandwidthCeiling = incoming.maxTier === 'hd' ? null : incoming.maxTier
          if (this.bandwidthMode === 'auto') {
            const nextTier = minBandwidthTier(
              resolveEffectiveBandwidthTier('auto', this.networkQuality, Math.max(1, this.consecutiveDegradedSamples)),
              this.remoteBandwidthCeiling
            )
            if (nextTier !== this.effectiveTier) {
              this.applyBandwidthTier(nextTier)
              this.options.onNetworkQualityChange?.(this.networkQuality, nextTier, {
                rttMs: this.latencyMs,
                remoteBandwidthCeiling: this.remoteBandwidthCeiling,
              })
            }
          }
        }
        return
      }

      // Remote peer (typically polite Athlete) requested an authoritative ICE restart
      if (payload.type === 'ice-restart-request') {
        if (!this.isPolite) {
          this.isRestartingIce = false
          await this.sendExplicitIceRestartOffer()
        }
        return
      }

      // Remote polite peer attached local camera/mic tracks after initial handshake -> renegotiate sendrecv
      if (payload.type === 'media-ready') {
        if (!this.isPolite) {
          if (this.pc.signalingState === 'stable') {
            void this.createOffer()
          } else {
            this.negotiationPending = true
          }
        }
        return
      }

      // Low-Bandwidth Periodic Form Snapshot Delivery
      if (payload.type === 'form-snapshot' && payload.data) {
        const snap = payload.data as { dataUrl?: string }
        if (snap.dataUrl) {
          this.options.onFormSnapshot?.(snap.dataUrl, payload.timestamp || Date.now(), payload.senderId)
        }
        return
      }

      if (payload.type === 'request-snapshot') {
        this.options.onSnapshotRequested?.(payload.senderId)
        return
      }

      // Lightweight Coaching Exercise / Tempo / Rest Telemetry Sync (<300B)
      if (payload.type === 'coaching-sync' && payload.data) {
        this.options.onCoachingSync?.(payload.data as CoachingSyncPayload)
        return
      }

      // Lightweight Ping/Pong for RTT latency measurement without triggering renegotiation
      if (payload.type === 'ping') {
        this.sendSignal({
          type: 'pong',
          senderId: this.options.currentUserId,
          timestamp: payload.timestamp,
        })
        return
      }

      if (payload.type === 'pong') {
        if (payload.timestamp) {
          const rtt = Math.max(0, Date.now() - payload.timestamp)
          this.latencyMs = rtt
          this.options.onLatencyChange?.(rtt)
        }
        return
      }

      // Symmetric presence handshake: responds to peer arrival
      if (payload.type === 'join' || payload.type === 'ready') {
        this.sendSignal({
          type: 'ready-ack',
          senderId: this.options.currentUserId,
        })
        const isAlreadyConnected = this.pc.connectionState === 'connected'
        if (!this.isPolite && this.pc.signalingState === 'stable' && !isAlreadyConnected) {
          void this.createOffer()
        }
        return
      }

      if (payload.type === 'ready-ack') {
        const isAlreadyConnected = this.pc.connectionState === 'connected'
        if (!this.isPolite && this.pc.signalingState === 'stable' && !isAlreadyConnected) {
          void this.createOffer()
        }
        return
      }

      // Offer received: Perfect Negotiation Pattern
      if (payload.type === 'offer' && payload.sdp) {
        if (this.politeIceFallbackTimer) {
          clearTimeout(this.politeIceFallbackTimer)
          this.politeIceFallbackTimer = null
        }

        const readyForOffer =
          !this.makingOffer &&
          (this.pc.signalingState === 'stable' || this.isSettingRemoteAnswerPending)
        const offerCollision = !readyForOffer

        this.ignoreOffer = !this.isPolite && offerCollision
        if (this.ignoreOffer) {
          return
        }

        if (offerCollision && this.isPolite) {
          try {
            await this.pc.setLocalDescription({ type: 'rollback' })
          } catch {
            // Implicit rollback supported by standard implementations
          }
        }

        this.isSettingRemoteAnswerPending = true
        await this.pc.setRemoteDescription(getRTCSessionDescription(payload.sdp))
        this.isSettingRemoteAnswerPending = false

        await this.drainPendingCandidates()

        // Ensure local camera/mic tracks are bound to sendrecv transceivers BEFORE creating the answer
        // so iOS/WebKit never answers with `recvonly` when local media is already live.
        if (this.options.localStream && typeof this.pc.getTransceivers === 'function') {
          const currentTransceivers = this.pc.getTransceivers()
          for (const track of this.options.localStream.getTracks()) {
            const match = currentTransceivers.find(
              t =>
                t.sender?.track?.id === track.id ||
                t.sender?.track?.kind === track.kind ||
                t.receiver?.track?.kind === track.kind
            )
            if (match) {
              if (match.direction !== 'sendrecv') {
                match.direction = 'sendrecv'
              }
              if (match.sender?.track?.id !== track.id) {
                try {
                  await match.sender.replaceTrack(track)
                } catch {}
              }
            }
          }
        }

        const rawAnswer = await this.pc.createAnswer()
        const answer: RTCSessionDescriptionInit = {
          ...rawAnswer,
          sdp: rawAnswer.sdp
            ? enhanceSdpForResilientCoaching(rawAnswer.sdp, this.effectiveTier)
            : rawAnswer.sdp,
        }
        await this.pc.setLocalDescription(answer)

        this.sendSignal({
          type: 'answer',
          senderId: this.options.currentUserId,
          sdp: this.pc.localDescription || answer,
        })
        return
      }

      // Answer received: complete negotiation
      if (payload.type === 'answer' && payload.sdp) {
        await this.pc.setRemoteDescription(getRTCSessionDescription(payload.sdp))
        await this.drainPendingCandidates()
        if (this.negotiationPending) {
          this.negotiationPending = false
          if (!this.isPolite && this.pc.signalingState === 'stable') {
            void this.createOffer()
          }
        }
        return
      }

      // ICE candidate received
      if (payload.type === 'candidate' && payload.candidate) {
        try {
          if (this.pc.remoteDescription && this.pc.remoteDescription.type) {
            await this.pc.addIceCandidate(getRTCIceCandidate(payload.candidate))
          } else {
            this.pendingCandidates.push(payload.candidate)
          }
        } catch (err) {
          if (!this.ignoreOffer) {
            this.options.onError?.(err instanceof Error ? err : new Error(String(err)))
          }
        }
      }
    } catch (err) {
      this.options.onError?.(err instanceof Error ? err : new Error(String(err)))
    }
  }

  public getRemoteStream(): MediaStream | null {
    return this.remoteStream
  }

  public getPeerConnection(): RTCPeerConnection | null {
    return this.pc
  }

  public destroy(): void {
    this.isDestroyed = true
    if (this.iceRestartTimer) {
      clearTimeout(this.iceRestartTimer)
      this.iceRestartTimer = null
    }
    if (this.politeIceFallbackTimer) {
      clearTimeout(this.politeIceFallbackTimer)
      this.politeIceFallbackTimer = null
    }
    if (this.pc) {
      this.pc.ontrack = null
      this.pc.onicecandidate = null
      this.pc.onconnectionstatechange = null
      this.pc.oniceconnectionstatechange = null
      this.pc.onnegotiationneeded = null
      this.pc.close()
      this.pc = null
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(t => t.stop())
      this.remoteStream = null
    }
    this.pendingCandidates = []
  }
}

export { WebRtcMultiPeerBridge, type WebRtcMultiPeerBridgeOptions } from './webrtc-multi-peer-bridge'
