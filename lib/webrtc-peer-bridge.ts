import type { RealtimeChannel } from '@supabase/supabase-js'
import {
  BANDWIDTH_PROFILES,
  detectBrowserNetworkHint,
  evaluateNetworkQuality,
  resolveEffectiveBandwidthTier,
  type BandwidthMode,
  type CoachingSyncPayload,
  type NetworkHealthSample,
  type NetworkQualityGrade,
  type ResolvedBandwidthTier,
} from './live-bandwidth-profiles'
import { trackEvent } from '@/src/lib/telemetry/telemetryClient'

export function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    // Public community TURN relay fallbacks for mobile cellular / symmetric NAT traversal
    {
      urls: [
        'turn:relay.metered.ca:80',
        'turn:relay.metered.ca:443',
        'turns:relay.metered.ca:443?transport=tcp',
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turns:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ]

  // Optional custom TURN relay from environment variable
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_TURN_URL) {
    servers.unshift({
      urls: process.env.NEXT_PUBLIC_TURN_URL.split(',').map(s => s.trim()),
      username: process.env.NEXT_PUBLIC_TURN_USERNAME || undefined,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL || undefined,
    })
  }

  return servers
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
    | 'form-snapshot'
    | 'request-snapshot'
    | 'coaching-sync'
  senderId: string
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
 * Implements the W3C Perfect Negotiation Pattern with polite/impolite role assignment,
 * robust glare handling, dynamic renegotiation on late track attachment, symmetric presence handshake,
 * and automatic ICE restarts.
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

  // ICE Debounce & Latency State
  private iceRestartTimer: ReturnType<typeof setTimeout> | null = null
  private isRestartingIce = false
  private lastPingTimestamp = 0
  private latencyMs: number | null = null

  // Adaptive Bandwidth & Network Telemetry State
  private bandwidthMode: BandwidthMode = 'auto'
  private effectiveTier: ResolvedBandwidthTier = 'hd'
  private networkQuality: NetworkQualityGrade = 'excellent'
  private consecutiveDegradedSamples = 0
  private prevPacketsReceived = 0
  private prevPacketsLost = 0

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

  public init(): RTCPeerConnection | null {
    const RTCPeerConnectionClass = getRTCPeerConnectionConstructor()
    if (!RTCPeerConnectionClass) {
      return null
    }

    try {
      this.pc = new RTCPeerConnectionClass({
        ...DEFAULT_RTC_CONFIG,
        iceServers: getIceServers(),
      })
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
        if (this.pc && this.options.onConnectionStateChange) {
          this.options.onConnectionStateChange(this.pc.connectionState)
        }
      }

      // ICE connection state changes & debounced auto-restart on disconnect
      this.pc.oniceconnectionstatechange = () => {
        if (!this.pc || this.isDestroyed) return
        const state = this.pc.iceConnectionState
        this.options.onIceConnectionStateChange?.(state)

        if (state === 'connected' || state === 'completed') {
          if (this.iceRestartTimer) {
            clearTimeout(this.iceRestartTimer)
            this.iceRestartTimer = null
          }
          this.isRestartingIce = false
          return
        }

        if (state === 'disconnected') {
          // Debounce transient network fluctuations (wait 4s for natural recovery before restart)
          if (!this.iceRestartTimer && !this.isRestartingIce) {
            this.iceRestartTimer = setTimeout(() => {
              this.iceRestartTimer = null
              if (
                this.pc &&
                (this.pc.iceConnectionState === 'disconnected' || this.pc.iceConnectionState === 'failed')
              ) {
                void this.restartIce()
              }
            }, 4000)
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
      }
    } else {
      this.negotiationPending = true
    }
  }

  private optimizeVideoSender(sender: RTCRtpSender, tier: ResolvedBandwidthTier = this.effectiveTier): void {
    try {
      const spec = BANDWIDTH_PROFILES[tier]
      const params = sender.getParameters()
      if (!params.encodings || params.encodings.length === 0) {
        params.encodings = [{}]
      }
      params.encodings[0].maxBitrate = spec.maxVideoBitrate
      if (tier !== 'hd') {
        params.encodings[0].active = spec.videoEnabled
        if (spec.maxFramerate > 0) {
          params.encodings[0].maxFramerate = spec.maxFramerate
        }
        params.encodings[0].scaleResolutionDownBy = spec.scaleResolutionDownBy
      } else {
        params.encodings[0].active = true
        params.encodings[0].maxFramerate = 30
        params.encodings[0].scaleResolutionDownBy = 1
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
      params.encodings[0].active = true
      params.encodings[0].maxBitrate = spec.maxAudioBitrate
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
    const nextTier = resolveEffectiveBandwidthTier(mode, this.networkQuality, this.consecutiveDegradedSamples || 1)
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
   * Samples RTCPeerConnection WebRTC RTP telemetry + browser network hints to grade link health
   * and auto-adapt bitrate/resolution before packet starvation triggers blackouts.
   */
  public async sampleNetworkHealth(): Promise<NetworkHealthSample | null> {
    if (this.isDestroyed || !this.pc) return null

    const browserHint = detectBrowserNetworkHint()
    let packetLossRatio: number | null = null
    let availableOutgoingBitrate: number | null = null
    let framesPerSecond: number | null = null
    let qualityLimitationReason: string | null = null
    let statsRttMs: number | null = null

    if (typeof this.pc.getStats === 'function') {
      try {
        const report = await this.pc.getStats()
        report.forEach((stat: Record<string, unknown>) => {
          if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
            if (typeof stat.currentRoundTripTime === 'number') {
              statsRttMs = Math.round(stat.currentRoundTripTime * 1000)
            }
            if (typeof stat.availableOutgoingBitrate === 'number') {
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
          } else if (stat.type === 'outbound-rtp' && stat.kind === 'video') {
            if (typeof stat.qualityLimitationReason === 'string' && stat.qualityLimitationReason !== 'none') {
              qualityLimitationReason = stat.qualityLimitationReason
            }
          }
        })
      } catch {
        // Ignore getStats errors on unsupported environments
      }
    }

    const rttMs = this.latencyMs ?? statsRttMs ?? browserHint.rttMs ?? null
    const sample: NetworkHealthSample = {
      rttMs,
      packetLossRatio,
      availableOutgoingBitrate,
      framesPerSecond,
      qualityLimitationReason,
      saveData: browserHint.saveData,
      effectiveType: browserHint.effectiveType,
      downlinkMbps: browserHint.downlinkMbps,
    }

    const nextQuality = evaluateNetworkQuality(sample)
    if (nextQuality === 'constrained' || nextQuality === 'critical') {
      this.consecutiveDegradedSamples = Math.min(10, this.consecutiveDegradedSamples + 1)
    } else if (nextQuality === 'good') {
      this.consecutiveDegradedSamples = Math.max(1, this.consecutiveDegradedSamples)
    } else {
      this.consecutiveDegradedSamples = 0
    }

    const nextTier = resolveEffectiveBandwidthTier(
      this.bandwidthMode,
      nextQuality,
      Math.max(1, this.consecutiveDegradedSamples)
    )

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
        packet_loss_ratio: sample.packetLossRatio ?? null,
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

  public async restartIce(): Promise<void> {
    if (!this.pc || this.isDestroyed || this.isRestartingIce) return
    this.isRestartingIce = true
    try {
      if ('restartIce' in this.pc && typeof (this.pc as { restartIce?: () => void }).restartIce === 'function') {
        ;(this.pc as { restartIce: () => void }).restartIce()
      } else {
        const offer = await this.pc.createOffer({ iceRestart: true })
        if (this.pc.signalingState !== 'stable') return
        await this.pc.setLocalDescription(offer)
        this.sendSignal({
          type: 'offer',
          senderId: this.options.currentUserId,
          sdp: this.pc.localDescription || offer,
        })
      }
    } catch (err) {
      this.options.onError?.(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setTimeout(() => {
        this.isRestartingIce = false
      }, 5000)
    }
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
        const offer = await this.pc.createOffer(
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
        // If impolite peer (Coach), only trigger offer if NOT already connected and in stable state
        const isAlreadyConnected = this.pc.connectionState === 'connected'
        if (!this.isPolite && this.pc.signalingState === 'stable' && !isAlreadyConnected) {
          void this.createOffer()
        }
        return
      }

      if (payload.type === 'ready-ack') {
        // Peer acknowledged presence: only trigger offer if NOT already connected
        const isAlreadyConnected = this.pc.connectionState === 'connected'
        if (!this.isPolite && this.pc.signalingState === 'stable' && !isAlreadyConnected) {
          void this.createOffer()
        }
        return
      }

      // Offer received: Perfect Negotiation Pattern
      if (payload.type === 'offer' && payload.sdp) {
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

        const answer = await this.pc.createAnswer()
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

