import type { RealtimeChannel } from '@supabase/supabase-js'
import {
  DEFAULT_RTC_CONFIG,
  fetchAuthenticatedIceServers,
  getIceServers,
  type LobbyParticipant,
  type WebRtcSignalPayload,
} from './webrtc-peer-bridge'
import {
  BANDWIDTH_PROFILES,
  ICE_RESTART_BACKOFF_MS,
  computeMultiPeerSenderBudget,
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
  const globalDesc =
    typeof globalThis !== 'undefined' && 'RTCSessionDescription' in globalThis
      ? (globalThis as unknown as { RTCSessionDescription: typeof RTCSessionDescription }).RTCSessionDescription
      : undefined
  const ctor = (typeof window !== 'undefined' && window.RTCSessionDescription) || globalDesc
  return ctor ? new ctor(sdp) : (sdp as unknown as RTCSessionDescription)
}

function getRTCIceCandidate(cand: RTCIceCandidateInit): RTCIceCandidate {
  const globalCand =
    typeof globalThis !== 'undefined' && 'RTCIceCandidate' in globalThis
      ? (globalThis as unknown as { RTCIceCandidate: typeof RTCIceCandidate }).RTCIceCandidate
      : undefined
  const ctor = (typeof window !== 'undefined' && window.RTCIceCandidate) || globalCand
  return ctor ? new ctor(cand) : (cand as unknown as RTCIceCandidate)
}

export interface WebRtcMultiPeerBridgeOptions {
  sessionId: string
  currentUserId: string
  currentUserName?: string
  isCoach: boolean
  /**
   * PRIVACY SAFEGUARD (#30): Defaults to `false` (Coach-Hub Star Topology) so squad athletes
   * connect strictly to the Coach and NEVER establish direct P2P ICE connections that expose
   * residential IP addresses to other squad members.
   */
  allowAthleteToAthleteMesh?: boolean
  iceServers?: RTCIceServer[]
  initialBandwidthMode?: BandwidthMode
  channel?: RealtimeChannel | null
  localStream?: MediaStream | null
  onPeerStream?: (peerId: string, stream: MediaStream, info: LobbyParticipant) => void
  onPeerLeft?: (peerId: string) => void
  onPeerConnectionStateChange?: (peerId: string, state: RTCPeerConnectionState) => void
  onPeerLatencyChange?: (peerId: string, latencyMs: number) => void
  onNetworkQualityChange?: (
    quality: NetworkQualityGrade,
    effectiveTier: ResolvedBandwidthTier,
    sample: NetworkHealthSample
  ) => void
  onTeamCue?: (cue: string, senderName: string) => void
  onSpotlightChange?: (spotlightUserId: string | null) => void
  onMuteDirective?: (muted: boolean) => void
  onCircuitTimerSync?: (data: unknown) => void
  onFormSnapshot?: (dataUrl: string, timestamp: number, senderId: string) => void
  onBandwidthModeSignal?: (mode: BandwidthMode, senderId: string) => void
  onError?: (err: Error) => void
}

export interface PeerAdaptiveHealth {
  peerId: string
  name: string
  quality: NetworkQualityGrade
  effectiveTier: ResolvedBandwidthTier
  remoteCeiling: ResolvedBandwidthTier | null
  latencyMs: number | null
  allocatedVideoBitrate: number
  videoEnabled: boolean
}

interface PeerEntry {
  peerId: string
  name: string
  role: 'coach' | 'athlete'
  pc: RTCPeerConnection
  remoteStream: MediaStream | null
  isPolite: boolean
  makingOffer: boolean
  ignoreOffer: boolean
  isSettingRemoteAnswerPending: boolean
  negotiationPending: boolean
  pendingCandidates: RTCIceCandidateInit[]
  latencyMs: number | null
  iceRestartTimer: ReturnType<typeof setTimeout> | null
  iceRestartAttempts: number
  isRestartingIce: boolean
  quality: NetworkQualityGrade
  effectiveTier: ResolvedBandwidthTier
  remoteCeiling: ResolvedBandwidthTier | null
  consecutiveDegradedSamples: number
  consecutiveHealthySamples: number
  prevPacketsReceived: number
  prevPacketsLost: number
  prevFreezeCount: number
  availableOutgoingBitrate: number | null
  allocatedVideoBitrate: number
}

/**
 * Enterprise Multi-Peer WebRTC Hub/Mesh Bridge for Team & Squad Live Studio.
 * Connects a coach with multiple athletes simultaneously with:
 * - Coach-Hub Star Topology privacy safeguard (#30) by default.
 * - Per-peer + aggregate upload bitrate budgeting so 2–10 mixed-bandwidth athletes never saturate upload.
 * - Spotlight bitrate prioritization, Opus FEC/DTX, DSCP high-priority voice, and per-peer ICE restart backoff.
 */
export class WebRtcMultiPeerBridge {
  private peers = new Map<string, PeerEntry>()
  private options: WebRtcMultiPeerBridgeOptions
  private isDestroyed = false
  private spotlightUserId: string | null = null
  private resolvedIceServers: RTCIceServer[] | null = null
  private bandwidthMode: BandwidthMode = 'auto'
  private aggregateQuality: NetworkQualityGrade = 'excellent'
  private aggregateTier: ResolvedBandwidthTier = 'hd'

  constructor(options: WebRtcMultiPeerBridgeOptions) {
    this.options = options
    this.bandwidthMode = options.initialBandwidthMode ?? 'auto'
    if (options.iceServers?.length) {
      this.resolvedIceServers = options.iceServers
    }
    const hint = detectBrowserNetworkHint()
    this.aggregateQuality = evaluateNetworkQuality({
      rttMs: hint.rttMs ?? null,
      saveData: hint.saveData,
      effectiveType: hint.effectiveType,
      downlinkMbps: hint.downlinkMbps,
    })
    this.aggregateTier = resolveEffectiveBandwidthTier(this.bandwidthMode, this.aggregateQuality, 1)
  }

  public setIceServers(servers: RTCIceServer[]): void {
    if (!servers.length) return
    this.resolvedIceServers = servers
    this.options.iceServers = servers
    if (this.isDestroyed) return
    for (const entry of this.peers.values()) {
      if (typeof entry.pc.setConfiguration === 'function') {
        try {
          entry.pc.setConfiguration({ ...DEFAULT_RTC_CONFIG, iceServers: servers })
        } catch {
          // Ignore if browser rejects mid-negotiation reconfiguration
        }
      }
    }
  }

  public init(): boolean {
    if (!this.resolvedIceServers && typeof window !== 'undefined') {
      void fetchAuthenticatedIceServers().then(servers => {
        if (this.isDestroyed) return
        this.resolvedIceServers = servers
        for (const entry of this.peers.values()) {
          if (typeof entry.pc.setConfiguration === 'function') {
            try {
              entry.pc.setConfiguration({ ...DEFAULT_RTC_CONFIG, iceServers: servers })
            } catch {
              // Ignore if browser rejects mid-negotiation reconfiguration
            }
          }
        }
      })
    }
    return !!getRTCPeerConnectionConstructor()
  }

  private sendSignal(payload: WebRtcSignalPayload): void {
    if (this.isDestroyed || !this.options.channel) return
    try {
      void this.options.channel.send({
        type: 'broadcast',
        event: 'webrtc_signal',
        payload: {
          ...payload,
          senderRole: payload.senderRole || (this.options.isCoach ? 'coach' : 'athlete'),
          timestamp: payload.timestamp || Date.now(),
        },
      })
    } catch {
      // Channel send error caught gracefully
    }
  }

  /**
   * Initializes or retrieves an existing RTCPeerConnection for a specific remote peer.
   */
  public getOrCreatePeer(peerId: string, peerName = 'Teammate', role: 'coach' | 'athlete' = 'athlete'): PeerEntry | null {
    if (this.isDestroyed || peerId === this.options.currentUserId) return null

    // Enforce Coach-Hub Star Topology by default (#30): block direct athlete-to-athlete P2P IP exposure
    if (!this.options.isCoach && role !== 'coach' && !this.options.allowAthleteToAthleteMesh) {
      return null
    }

    const existing = this.peers.get(peerId)
    if (existing) return existing

    const RTCPeerConnectionClass = getRTCPeerConnectionConstructor()
    if (!RTCPeerConnectionClass) return null

    try {
      const configuredIceServers = this.resolvedIceServers?.length
        ? this.resolvedIceServers
        : this.options.iceServers?.length
          ? this.options.iceServers
          : getIceServers()
      const hasTurnRelay = configuredIceServers.some(server => {
        const urls = Array.isArray(server.urls) ? server.urls : [server.urls]
        return urls.some(u => typeof u === 'string' && (u.startsWith('turn:') || u.startsWith('turns:')))
      })
      const pc = new RTCPeerConnectionClass({
        ...DEFAULT_RTC_CONFIG,
        iceServers: configuredIceServers,
        ...(!this.options.isCoach && role !== 'coach' && hasTurnRelay
          ? { iceTransportPolicy: 'relay' as RTCIceTransportPolicy }
          : {}),
      })

      const globalMediaStream =
        typeof globalThis !== 'undefined' && 'MediaStream' in globalThis
          ? (globalThis as unknown as { MediaStream: typeof MediaStream }).MediaStream
          : undefined
      const MediaStreamClass = typeof window !== 'undefined' ? window.MediaStream : globalMediaStream
      const remoteStream = MediaStreamClass ? new MediaStreamClass() : null

      // In Coach <-> Athlete, Athlete is polite, Coach is impolite.
      // Between two athletes, alphabetical order guarantees deterministic tie-breaking.
      const isPolite = this.options.isCoach
        ? false
        : role === 'coach'
          ? true
          : this.options.currentUserId > peerId

      const entry: PeerEntry = {
        peerId,
        name: peerName,
        role,
        pc,
        remoteStream,
        isPolite,
        makingOffer: false,
        ignoreOffer: false,
        isSettingRemoteAnswerPending: false,
        negotiationPending: false,
        pendingCandidates: [],
        latencyMs: null,
        iceRestartTimer: null,
        iceRestartAttempts: 0,
        isRestartingIce: false,
        quality: this.aggregateQuality,
        effectiveTier: this.aggregateTier,
        remoteCeiling: null,
        consecutiveDegradedSamples: 0,
        consecutiveHealthySamples: 0,
        prevPacketsReceived: 0,
        prevPacketsLost: 0,
        prevFreezeCount: 0,
        availableOutgoingBitrate: null,
        allocatedVideoBitrate: BANDWIDTH_PROFILES[this.aggregateTier].maxVideoBitrate,
      }

      this.peers.set(peerId, entry)

      // Pre-allocate audio & video transceivers
      if (typeof pc.addTransceiver === 'function') {
        try {
          pc.addTransceiver('audio', { direction: 'sendrecv' })
          pc.addTransceiver('video', { direction: 'sendrecv' })
        } catch {
          // Dynamic fallback
        }
      }

      // Perfect Negotiation
      pc.onnegotiationneeded = async () => {
        if (this.isDestroyed || !entry.pc || entry.isPolite) return
        if (entry.makingOffer || entry.pc.signalingState !== 'stable') {
          entry.negotiationPending = true
          return
        }
        await this.createOfferForPeer(peerId)
      }

      // Track listeners
      pc.ontrack = event => {
        if (event.streams && event.streams[0]) {
          entry.remoteStream = event.streams[0]
        } else if (event.track) {
          if (!entry.remoteStream && MediaStreamClass) {
            entry.remoteStream = new MediaStreamClass()
          }
          if (entry.remoteStream) {
            const hasTrack = entry.remoteStream.getTracks().some(t => t.id === event.track.id)
            if (!hasTrack) {
              entry.remoteStream.addTrack(event.track)
            }
          }
        }

        const notify = () => {
          if (entry.remoteStream && this.options.onPeerStream) {
            const participant: LobbyParticipant = {
              userId: peerId,
              name: entry.name,
              role: entry.role,
              joinedAt: Date.now(),
            }
            try {
              const fresh = new (MediaStreamClass || MediaStream)(entry.remoteStream.getTracks())
              this.options.onPeerStream(peerId, fresh, participant)
            } catch {
              this.options.onPeerStream(peerId, entry.remoteStream, participant)
            }
          }
        }

        if (event.track) {
          event.track.onunmute = notify
        }
        notify()
      }

      // Connection state changes
      pc.onconnectionstatechange = () => {
        if (!pc || this.isDestroyed) return
        if (pc.connectionState === 'connected') {
          entry.iceRestartAttempts = 0
          entry.isRestartingIce = false
        }
        if (this.options.onPeerConnectionStateChange) {
          this.options.onPeerConnectionStateChange(peerId, pc.connectionState)
        }
      }

      // ICE Candidates
      pc.onicecandidate = event => {
        if (event.candidate && this.options.channel) {
          this.sendSignal({
            type: 'candidate',
            senderId: this.options.currentUserId,
            targetUserId: peerId,
            candidate: event.candidate.toJSON(),
          })
        }
      }

      // ICE Connection Auto-Restart (both disconnected debounce + failed)
      pc.oniceconnectionstatechange = () => {
        if (!pc || this.isDestroyed) return
        const state = pc.iceConnectionState
        if (state === 'connected' || state === 'completed') {
          if (entry.iceRestartTimer) {
            clearTimeout(entry.iceRestartTimer)
            entry.iceRestartTimer = null
          }
          entry.iceRestartAttempts = 0
          entry.isRestartingIce = false
          return
        }

        if (state === 'disconnected') {
          if (!entry.iceRestartTimer && !entry.isRestartingIce) {
            const delayMs =
              ICE_RESTART_BACKOFF_MS[Math.min(entry.iceRestartAttempts, ICE_RESTART_BACKOFF_MS.length - 1)]
            entry.iceRestartTimer = setTimeout(() => {
              entry.iceRestartTimer = null
              if (
                entry.pc &&
                (entry.pc.iceConnectionState === 'disconnected' || entry.pc.iceConnectionState === 'failed')
              ) {
                void this.restartIceForPeer(peerId)
              }
            }, delayMs)
          }
        } else if (state === 'failed') {
          if (entry.iceRestartTimer) {
            clearTimeout(entry.iceRestartTimer)
            entry.iceRestartTimer = null
          }
          void this.restartIceForPeer(peerId)
        }
      }

      // Attach current local stream tracks to this peer & rebalance multi-peer upload budget
      if (this.options.localStream) {
        this.attachStreamToPeer(entry, this.options.localStream)
      }
      this.rebalanceAllPeerSenders()

      return entry
    } catch (err) {
      this.options.onError?.(err instanceof Error ? err : new Error(String(err)))
      return null
    }
  }

  private getAggregateUplinkEstimate(): number | null {
    let maxMeasured: number | null = null
    for (const peer of this.peers.values()) {
      if (peer.availableOutgoingBitrate != null && peer.availableOutgoingBitrate > 0) {
        maxMeasured =
          maxMeasured === null
            ? peer.availableOutgoingBitrate
            : Math.max(maxMeasured, peer.availableOutgoingBitrate)
      }
    }
    return maxMeasured
  }

  private applySenderBudgetForEntry(entry: PeerEntry): void {
    if (!entry.pc || this.isDestroyed) return
    const peerCount = Math.max(1, this.peers.size)
    const isSpotlighted = this.spotlightUserId === entry.peerId
    const desiredTier =
      this.bandwidthMode !== 'auto'
        ? this.bandwidthMode
        : minBandwidthTier(entry.effectiveTier, entry.remoteCeiling)

    // Estimate Coach's shared upload capacity from the highest-bandwidth peer path,
    // then also respect this individual peer's own end-to-end path ceiling.
    const aggregateUplink = this.getAggregateUplinkEstimate() ?? entry.availableOutgoingBitrate
    const budget = computeMultiPeerSenderBudget({
      tier: desiredTier,
      peerCount,
      isSpotlighted,
      availableOutgoingBitrate: aggregateUplink,
    })

    let finalVideoBitrate = budget.maxVideoBitrate
    if (
      budget.videoEnabled &&
      entry.availableOutgoingBitrate != null &&
      entry.availableOutgoingBitrate > 0
    ) {
      const individualPathCap = Math.max(
        70_000,
        Math.round(entry.availableOutgoingBitrate * 0.82 - budget.maxAudioBitrate)
      )
      finalVideoBitrate = Math.min(finalVideoBitrate, individualPathCap)
    }

    entry.effectiveTier = budget.effectiveTier
    entry.allocatedVideoBitrate = finalVideoBitrate

    const spec = BANDWIDTH_PROFILES[budget.effectiveTier]

    try {
      const senders = typeof entry.pc.getSenders === 'function' ? entry.pc.getSenders() : []
      senders.forEach(sender => {
        const params = sender.getParameters()
        if (!params.encodings || params.encodings.length === 0) {
          params.encodings = [{}]
        }
        const enc = params.encodings[0] as RTCRtpEncodingParameters & {
          priority?: 'very-low' | 'low' | 'medium' | 'high'
          networkPriority?: 'very-low' | 'low' | 'medium' | 'high'
        }

        if (sender.track?.kind === 'video') {
          enc.active = budget.videoEnabled
          enc.maxBitrate = finalVideoBitrate
          if (budget.maxFramerate > 0) enc.maxFramerate = budget.maxFramerate
          enc.scaleResolutionDownBy = budget.scaleResolutionDownBy
          enc.priority = isSpotlighted ? 'medium' : spec.videoNetworkPriority
          enc.networkPriority = isSpotlighted ? 'medium' : spec.videoNetworkPriority
          ;(params as RTCRtpSendParameters & { degradationPreference?: string }).degradationPreference =
            spec.degradationPreference
          void sender.setParameters(params).catch(() => {})
        } else if (sender.track?.kind === 'audio') {
          enc.active = true
          enc.maxBitrate = budget.maxAudioBitrate
          enc.priority = 'high'
          enc.networkPriority = 'high'
          void sender.setParameters(params).catch(() => {})
        }
      })
    } catch {
      // Optional browser sender tuning
    }
  }

  public rebalanceAllPeerSenders(): void {
    for (const entry of this.peers.values()) {
      this.applySenderBudgetForEntry(entry)
    }
  }

  private attachStreamToPeer(entry: PeerEntry, stream: MediaStream): void {
    if (!entry.pc) return
    const transceivers = typeof entry.pc.getTransceivers === 'function' ? entry.pc.getTransceivers() : []

    stream.getTracks().forEach(track => {
      const transceiver = transceivers.find(
        t =>
          t.sender?.track?.id === track.id ||
          t.sender?.track?.kind === track.kind ||
          t.receiver?.track?.kind === track.kind
      )

      if (transceiver) {
        if (transceiver.direction !== 'sendrecv') {
          transceiver.direction = 'sendrecv'
        }
        void transceiver.sender.replaceTrack(track).catch(() => {})
        return
      }

      const senders = entry.pc.getSenders()
      const existing = senders.find(s => s.track?.kind === track.kind)
      if (existing) {
        void existing.replaceTrack(track).catch(() => {})
      } else {
        try {
          entry.pc.addTrack(track, stream)
        } catch {
          // Already attached
        }
      }
    })
    this.applySenderBudgetForEntry(entry)
  }

  public attachLocalStream(stream: MediaStream): void {
    this.options.localStream = stream
    for (const entry of this.peers.values()) {
      this.attachStreamToPeer(entry, stream)
      if (entry.pc.signalingState === 'stable' && !entry.isPolite) {
        void this.createOfferForPeer(entry.peerId)
      }
    }
  }

  public async createOfferForPeer(peerId: string): Promise<RTCSessionDescriptionInit | null> {
    const entry = this.peers.get(peerId)
    if (!entry || !entry.pc || this.isDestroyed) return null
    if (entry.makingOffer || entry.pc.signalingState !== 'stable') {
      entry.negotiationPending = true
      return null
    }

    try {
      entry.makingOffer = true
      const hasTransceivers = typeof entry.pc.addTransceiver === 'function'
      const rawOffer = await entry.pc.createOffer(
        hasTransceivers
          ? undefined
          : {
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
            }
      )
      if (entry.pc.signalingState !== 'stable') {
        entry.negotiationPending = true
        return null
      }
      const offer: RTCSessionDescriptionInit = {
        ...rawOffer,
        sdp: rawOffer.sdp
          ? enhanceSdpForResilientCoaching(rawOffer.sdp, entry.effectiveTier)
          : rawOffer.sdp,
      }
      await entry.pc.setLocalDescription(offer)

      this.sendSignal({
        type: 'offer',
        senderId: this.options.currentUserId,
        senderName: this.options.currentUserName,
        targetUserId: peerId,
        sdp: entry.pc.localDescription || offer,
      })
      return offer
    } catch (err) {
      this.options.onError?.(err instanceof Error ? err : new Error(String(err)))
      return null
    } finally {
      entry.makingOffer = false
    }
  }

  public async restartIceForPeer(peerId: string): Promise<void> {
    const entry = this.peers.get(peerId)
    if (!entry || !entry.pc || this.isDestroyed || entry.isRestartingIce) return
    if (entry.iceRestartAttempts >= ICE_RESTART_BACKOFF_MS.length) return

    entry.isRestartingIce = true
    entry.iceRestartAttempts += 1
    const cooldown =
      ICE_RESTART_BACKOFF_MS[Math.min(entry.iceRestartAttempts - 1, ICE_RESTART_BACKOFF_MS.length - 1)]
    setTimeout(() => {
      entry.isRestartingIce = false
    }, cooldown)

    if (this.bandwidthMode === 'auto' && entry.iceRestartAttempts >= 2) {
      entry.effectiveTier = entry.iceRestartAttempts >= 3 ? 'audio_first' : 'low_data'
      this.applySenderBudgetForEntry(entry)
    }

    try {
      if (entry.isPolite) {
        this.sendSignal({
          type: 'ice-restart-request',
          senderId: this.options.currentUserId,
          targetUserId: peerId,
          timestamp: Date.now(),
        })
      } else {
        if ('restartIce' in entry.pc && typeof (entry.pc as { restartIce?: () => void }).restartIce === 'function') {
          try {
            ;(entry.pc as { restartIce: () => void }).restartIce()
          } catch {}
        }
        if (entry.pc.signalingState === 'have-local-offer') {
          try {
            await entry.pc.setLocalDescription({ type: 'rollback' })
          } catch {
            return
          }
        }
        if (entry.pc.signalingState === 'stable') {
          const rawOffer = await entry.pc.createOffer({ iceRestart: true })
          if (entry.pc.signalingState === 'stable') {
            const offer: RTCSessionDescriptionInit = {
              ...rawOffer,
              sdp: rawOffer.sdp
                ? enhanceSdpForResilientCoaching(rawOffer.sdp, entry.effectiveTier)
                : rawOffer.sdp,
            }
            await entry.pc.setLocalDescription(offer)
            this.sendSignal({
              type: 'offer',
              senderId: this.options.currentUserId,
              targetUserId: peerId,
              sdp: entry.pc.localDescription || offer,
            })
          }
        }
      }
    } catch (err) {
      this.options.onError?.(err instanceof Error ? err : new Error(String(err)))
    }
  }

  public async restartIceForAllPeers(): Promise<void> {
    for (const peerId of Array.from(this.peers.keys())) {
      await this.restartIceForPeer(peerId)
    }
  }

  /**
   * Samples WebRTC RTP telemetry across ALL connected squad peers independently,
   * adapting each peer's bitrate + upload share without letting one slow athlete crash fiber teammates.
   */
  public async sampleNetworkHealth(): Promise<NetworkHealthSample | null> {
    if (this.isDestroyed || this.peers.size === 0) return null

    const browserHint = detectBrowserNetworkHint()
    let worstRttMs: number | null = null
    let worstLoss: number | null = null
    let minAvailableOutgoingBitrate: number | null = null
    let worstQuality: NetworkQualityGrade = 'excellent'
    let lowestTier: ResolvedBandwidthTier = 'hd'

    const qualitySeverity: Record<NetworkQualityGrade, number> = {
      excellent: 0,
      good: 1,
      constrained: 2,
      critical: 3,
    }

    for (const entry of this.peers.values()) {
      let statsRttMs: number | null = null
      let remoteRttMs: number | null = null
      let packetLossRatio: number | null = null
      let outboundPacketLossRatio: number | null = null
      let jitterMs: number | null = null
      let availableOutgoingBitrate: number | null = null
      let framesPerSecond: number | null = null
      let videoFreezeCountDelta: number | null = null
      let qualityLimitationReason: string | null = null

      if (typeof entry.pc.getStats === 'function') {
        try {
          const report = await entry.pc.getStats()
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
              const deltaRecv = received - entry.prevPacketsReceived
              const deltaLost = lost - entry.prevPacketsLost
              if (deltaRecv + deltaLost > 10 && deltaRecv >= 0 && deltaLost >= 0) {
                packetLossRatio = deltaLost / (deltaRecv + deltaLost)
              }
              entry.prevPacketsReceived = received
              entry.prevPacketsLost = lost
              if (typeof stat.framesPerSecond === 'number') framesPerSecond = stat.framesPerSecond
              if (typeof stat.jitter === 'number') {
                const ms = Math.round(stat.jitter * 1000)
                jitterMs = jitterMs === null ? ms : Math.max(jitterMs, ms)
              }
              if (typeof stat.freezeCount === 'number') {
                videoFreezeCountDelta = Math.max(0, stat.freezeCount - entry.prevFreezeCount)
                entry.prevFreezeCount = stat.freezeCount
              }
            } else if (stat.type === 'remote-inbound-rtp') {
              if (typeof stat.fractionLost === 'number') {
                outboundPacketLossRatio =
                  outboundPacketLossRatio === null
                    ? stat.fractionLost
                    : Math.max(outboundPacketLossRatio, stat.fractionLost)
              }
              if (typeof stat.roundTripTime === 'number') {
                const ms = Math.round(stat.roundTripTime * 1000)
                remoteRttMs = remoteRttMs === null ? ms : Math.max(remoteRttMs, ms)
              }
            } else if (stat.type === 'outbound-rtp' && stat.kind === 'video') {
              if (typeof stat.qualityLimitationReason === 'string' && stat.qualityLimitationReason !== 'none') {
                qualityLimitationReason = stat.qualityLimitationReason
              }
            }
          })
        } catch {
          // Ignore getStats errors
        }
      }

      const webrtcRtt =
        statsRttMs !== null || remoteRttMs !== null ? Math.max(statsRttMs ?? 0, remoteRttMs ?? 0) : null
      const peerRtt = webrtcRtt ?? entry.latencyMs ?? browserHint.rttMs ?? null
      entry.availableOutgoingBitrate = availableOutgoingBitrate

      const peerSample: NetworkHealthSample = {
        rttMs: peerRtt,
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
        remoteBandwidthCeiling: entry.remoteCeiling,
        peerCount: this.peers.size,
      }

      const peerQuality = evaluateNetworkQuality(peerSample)
      if (peerQuality === 'constrained' || peerQuality === 'critical') {
        entry.consecutiveDegradedSamples = Math.min(10, entry.consecutiveDegradedSamples + 1)
        entry.consecutiveHealthySamples = 0
      } else {
        entry.consecutiveDegradedSamples = 0
        entry.consecutiveHealthySamples = Math.min(10, entry.consecutiveHealthySamples + 1)
      }

      entry.quality = peerQuality
      entry.effectiveTier = resolveAdaptiveTierWithHysteresis({
        mode: this.bandwidthMode,
        currentTier: entry.effectiveTier,
        quality: peerQuality,
        consecutiveDegradedSamples: Math.max(1, entry.consecutiveDegradedSamples),
        consecutiveHealthySamples: entry.consecutiveHealthySamples,
        remoteBandwidthCeiling: entry.remoteCeiling,
        videoFreezeCountDelta,
      })

      if (peerRtt !== null) worstRttMs = worstRttMs === null ? peerRtt : Math.max(worstRttMs, peerRtt)
      const combinedLoss = Math.max(packetLossRatio ?? 0, outboundPacketLossRatio ?? 0)
      if (packetLossRatio !== null || outboundPacketLossRatio !== null) {
        worstLoss = worstLoss === null ? combinedLoss : Math.max(worstLoss, combinedLoss)
      }
      if (availableOutgoingBitrate !== null) {
        minAvailableOutgoingBitrate =
          minAvailableOutgoingBitrate === null
            ? availableOutgoingBitrate
            : Math.min(minAvailableOutgoingBitrate, availableOutgoingBitrate)
      }
      if (qualitySeverity[peerQuality] > qualitySeverity[worstQuality]) {
        worstQuality = peerQuality
      }
    }

    // Apply per-peer sender budgets in a second pass once every peer's uplink estimate is fresh
    for (const entry of this.peers.values()) {
      this.applySenderBudgetForEntry(entry)
      if (getBandwidthTierRank(entry.effectiveTier) < getBandwidthTierRank(lowestTier)) {
        lowestTier = entry.effectiveTier
      }
    }

    const aggregateSample: NetworkHealthSample = {
      rttMs: worstRttMs,
      packetLossRatio: worstLoss,
      availableOutgoingBitrate: minAvailableOutgoingBitrate,
      peerCount: this.peers.size,
      saveData: browserHint.saveData,
      effectiveType: browserHint.effectiveType,
      downlinkMbps: browserHint.downlinkMbps,
    }

    const changed = worstQuality !== this.aggregateQuality || lowestTier !== this.aggregateTier
    this.aggregateQuality = worstQuality
    this.aggregateTier = lowestTier
    if (changed) {
      this.options.onNetworkQualityChange?.(this.aggregateQuality, this.aggregateTier, aggregateSample)
    }

    return aggregateSample
  }

  public getEffectiveTier(): ResolvedBandwidthTier {
    return this.aggregateTier
  }

  public getBandwidthMode(): BandwidthMode {
    return this.bandwidthMode
  }

  public getNetworkQuality(): NetworkQualityGrade {
    return this.aggregateQuality
  }

  public getPeerHealthSummary(): PeerAdaptiveHealth[] {
    return Array.from(this.peers.values()).map(entry => ({
      peerId: entry.peerId,
      name: entry.name,
      quality: entry.quality,
      effectiveTier: entry.effectiveTier,
      remoteCeiling: entry.remoteCeiling,
      latencyMs: entry.latencyMs,
      allocatedVideoBitrate: entry.allocatedVideoBitrate,
      videoEnabled: BANDWIDTH_PROFILES[entry.effectiveTier].videoEnabled,
    }))
  }

  private async drainPendingCandidates(entry: PeerEntry): Promise<void> {
    while (entry.pendingCandidates.length > 0) {
      const cand = entry.pendingCandidates.shift()
      if (cand) {
        try {
          await entry.pc.addIceCandidate(getRTCIceCandidate(cand))
        } catch {
          // Stale candidate dropped
        }
      }
    }
  }

  /**
   * Handles incoming Realtime WebRTC signal and routes to specific peer connection.
   */
  public async handleSignal(payload: WebRtcSignalPayload): Promise<void> {
    if (this.isDestroyed || !payload || payload.senderId === this.options.currentUserId) {
      return
    }

    // Filter signals targeted to a specific peer
    if (
      payload.targetUserId &&
      payload.targetUserId !== '*' &&
      payload.targetUserId !== this.options.currentUserId
    ) {
      return
    }

    try {
      // 1. Team Broadcast Signals (Coach-originated only; ignore spoofed athlete directives)
      if (payload.type === 'spotlight') {
        if (payload.senderRole === 'athlete') return
        const spotlightId = (payload.data as string | null) ?? null
        this.spotlightUserId = spotlightId
        this.rebalanceAllPeerSenders()
        this.options.onSpotlightChange?.(spotlightId)
        return
      }

      if (payload.type === 'mute') {
        if (payload.senderRole === 'athlete') return
        const isMuted = Boolean((payload.data as { muted?: boolean })?.muted ?? true)
        this.options.onMuteDirective?.(isMuted)
        return
      }

      if (payload.type === 'team-cue') {
        if (payload.senderRole === 'athlete') return
        const cueText = String(payload.data || '')
        this.options.onTeamCue?.(cueText, payload.senderName || 'Coach')
        return
      }

      if (payload.type === 'circuit-timer') {
        if (payload.senderRole === 'athlete') return
        this.options.onCircuitTimerSync?.(payload.data)
        return
      }

      if (payload.type === 'bandwidth-mode' && payload.data) {
        const incoming = payload.data as { mode?: BandwidthMode }
        if (incoming.mode) {
          this.setBandwidthMode(incoming.mode, false)
          this.options.onBandwidthModeSignal?.(incoming.mode, payload.senderId)
        }
        return
      }

      if (payload.type === 'bandwidth-ceiling' && payload.data) {
        const incoming = payload.data as { maxTier?: ResolvedBandwidthTier }
        const entry = this.peers.get(payload.senderId)
        if (entry && incoming.maxTier && incoming.maxTier in BANDWIDTH_PROFILES) {
          entry.remoteCeiling = incoming.maxTier === 'hd' ? null : incoming.maxTier
          this.applySenderBudgetForEntry(entry)
        }
        return
      }

      if (payload.type === 'ice-restart-request') {
        const entry = this.peers.get(payload.senderId)
        if (entry && !entry.isPolite) {
          entry.isRestartingIce = false
          await this.restartIceForPeer(payload.senderId)
        }
        return
      }

      if (payload.type === 'form-snapshot' && payload.data) {
        const snap = payload.data as { dataUrl?: string }
        if (snap.dataUrl) {
          this.options.onFormSnapshot?.(snap.dataUrl, payload.timestamp || Date.now(), payload.senderId)
        }
        return
      }

      // 2. Latency Ping / Pong
      if (payload.type === 'ping') {
        this.sendSignal({
          type: 'pong',
          senderId: this.options.currentUserId,
          targetUserId: payload.senderId,
          timestamp: payload.timestamp,
        })
        return
      }

      if (payload.type === 'pong') {
        if (payload.timestamp) {
          const rtt = Math.max(0, Date.now() - payload.timestamp)
          const entry = this.peers.get(payload.senderId)
          if (entry) {
            entry.latencyMs = rtt
          }
          this.options.onPeerLatencyChange?.(payload.senderId, rtt)
        }
        return
      }

      const resolvedSenderRole: 'coach' | 'athlete' =
        payload.senderRole || (this.options.isCoach ? 'athlete' : 'coach')

      // 3. Presence & Handshake Discovery
      if (payload.type === 'join' || payload.type === 'ready') {
        const entry = this.getOrCreatePeer(payload.senderId, payload.senderName, resolvedSenderRole)
        if (!entry) return
        this.sendSignal({
          type: 'ready-ack',
          senderId: this.options.currentUserId,
          senderName: this.options.currentUserName,
          targetUserId: payload.senderId,
        })
        if (!entry.isPolite && entry.pc.signalingState === 'stable' && entry.pc.connectionState !== 'connected') {
          void this.createOfferForPeer(payload.senderId)
        }
        return
      }

      if (payload.type === 'ready-ack') {
        const entry = this.getOrCreatePeer(payload.senderId, payload.senderName, resolvedSenderRole)
        if (entry && !entry.isPolite && entry.pc.signalingState === 'stable' && entry.pc.connectionState !== 'connected') {
          void this.createOfferForPeer(payload.senderId)
        }
        return
      }

      // 4. Perfect Negotiation SDP Offer
      if (payload.type === 'offer' && payload.sdp) {
        const entry = this.getOrCreatePeer(payload.senderId, payload.senderName, resolvedSenderRole)
        if (!entry) return

        const readyForOffer =
          !entry.makingOffer &&
          (entry.pc.signalingState === 'stable' || entry.isSettingRemoteAnswerPending)
        const offerCollision = !readyForOffer

        entry.ignoreOffer = !entry.isPolite && offerCollision
        if (entry.ignoreOffer) return

        if (offerCollision && entry.isPolite) {
          try {
            await entry.pc.setLocalDescription({ type: 'rollback' })
          } catch {
            // Rollback supported implicitly
          }
        }

        entry.isSettingRemoteAnswerPending = true
        await entry.pc.setRemoteDescription(getRTCSessionDescription(payload.sdp))
        entry.isSettingRemoteAnswerPending = false

        await this.drainPendingCandidates(entry)

        const rawAnswer = await entry.pc.createAnswer()
        const answer: RTCSessionDescriptionInit = {
          ...rawAnswer,
          sdp: rawAnswer.sdp
            ? enhanceSdpForResilientCoaching(rawAnswer.sdp, entry.effectiveTier)
            : rawAnswer.sdp,
        }
        await entry.pc.setLocalDescription(answer)

        this.sendSignal({
          type: 'answer',
          senderId: this.options.currentUserId,
          targetUserId: payload.senderId,
          sdp: entry.pc.localDescription || answer,
        })
        return
      }

      // 5. SDP Answer
      if (payload.type === 'answer' && payload.sdp) {
        const entry = this.peers.get(payload.senderId)
        if (!entry) return

        await entry.pc.setRemoteDescription(getRTCSessionDescription(payload.sdp))
        await this.drainPendingCandidates(entry)
        if (entry.negotiationPending) {
          entry.negotiationPending = false
          if (!entry.isPolite && entry.pc.signalingState === 'stable') {
            void this.createOfferForPeer(payload.senderId)
          }
        }
        return
      }

      // 6. ICE Candidate
      if (payload.type === 'candidate' && payload.candidate) {
        const entry = this.peers.get(payload.senderId)
        if (!entry) return

        try {
          if (entry.pc.remoteDescription && entry.pc.remoteDescription.type) {
            await entry.pc.addIceCandidate(getRTCIceCandidate(payload.candidate))
          } else {
            entry.pendingCandidates.push(payload.candidate)
          }
        } catch (err) {
          if (!entry.ignoreOffer) {
            this.options.onError?.(err instanceof Error ? err : new Error(String(err)))
          }
        }
      }
    } catch (err) {
      this.options.onError?.(err instanceof Error ? err : new Error(String(err)))
    }
  }

  // ── Team Control Broadcast Methods ──

  public muteAllAthletes(muted = true): void {
    this.sendSignal({
      type: 'mute',
      senderId: this.options.currentUserId,
      targetUserId: '*',
      data: { muted },
    })
  }

  public broadcastSpotlight(userId: string | null): void {
    this.spotlightUserId = userId
    this.rebalanceAllPeerSenders()
    this.sendSignal({
      type: 'spotlight',
      senderId: this.options.currentUserId,
      targetUserId: '*',
      data: userId,
    })
  }

  public broadcastTeamCue(cueText: string): void {
    this.sendSignal({
      type: 'team-cue',
      senderId: this.options.currentUserId,
      senderName: this.options.currentUserName || 'Coach Gordon',
      targetUserId: '*',
      data: cueText,
    })
  }

  public broadcastCircuitTimer(timerData: unknown): void {
    this.sendSignal({
      type: 'circuit-timer',
      senderId: this.options.currentUserId,
      targetUserId: '*',
      data: timerData,
    })
  }

  public setBandwidthMode(mode: BandwidthMode, broadcast = true): ResolvedBandwidthTier {
    this.bandwidthMode = mode
    const tier = resolveEffectiveBandwidthTier(mode, this.aggregateQuality, 1)
    this.aggregateTier = tier
    for (const entry of this.peers.values()) {
      entry.effectiveTier = tier
      if (mode !== 'auto') entry.remoteCeiling = null
      this.applySenderBudgetForEntry(entry)
    }
    if (broadcast) {
      this.sendSignal({
        type: 'bandwidth-mode',
        senderId: this.options.currentUserId,
        targetUserId: '*',
        data: { mode, effectiveTier: tier },
      })
    }
    return tier
  }

  public broadcastCoachingSync(sync: Omit<CoachingSyncPayload, 'timestamp'>): void {
    this.sendSignal({
      type: 'coaching-sync',
      senderId: this.options.currentUserId,
      targetUserId: '*',
      data: {
        ...sync,
        timestamp: Date.now(),
      } satisfies CoachingSyncPayload,
    })
  }

  public requestAllSnapshots(): void {
    this.sendSignal({
      type: 'request-snapshot',
      senderId: this.options.currentUserId,
      targetUserId: '*',
      timestamp: Date.now(),
    })
  }

  public sendPingToAll(): void {
    const now = Date.now()
    for (const peerId of this.peers.keys()) {
      this.sendSignal({
        type: 'ping',
        senderId: this.options.currentUserId,
        targetUserId: peerId,
        timestamp: now,
      })
    }
  }

  public removePeer(peerId: string): void {
    const entry = this.peers.get(peerId)
    if (!entry) return

    if (entry.iceRestartTimer) {
      clearTimeout(entry.iceRestartTimer)
    }
    if (entry.pc) {
      entry.pc.ontrack = null
      entry.pc.onicecandidate = null
      entry.pc.onconnectionstatechange = null
      entry.pc.oniceconnectionstatechange = null
      entry.pc.onnegotiationneeded = null
      entry.pc.close()
    }
    if (entry.remoteStream) {
      entry.remoteStream.getTracks().forEach(t => t.stop())
    }
    this.peers.delete(peerId)
    this.rebalanceAllPeerSenders()
    this.options.onPeerLeft?.(peerId)
  }

  public getPeerStream(peerId: string): MediaStream | null {
    return this.peers.get(peerId)?.remoteStream ?? null
  }

  public getAllPeerStreams(): Map<string, MediaStream> {
    const result = new Map<string, MediaStream>()
    for (const [id, entry] of this.peers.entries()) {
      if (entry.remoteStream) {
        result.set(id, entry.remoteStream)
      }
    }
    return result
  }

  public getConnectedPeerCount(): number {
    return this.peers.size
  }

  public getSpotlightedUserId(): string | null {
    return this.spotlightUserId
  }

  public destroy(): void {
    this.isDestroyed = true
    for (const peerId of Array.from(this.peers.keys())) {
      this.removePeer(peerId)
    }
    this.peers.clear()
  }
}
