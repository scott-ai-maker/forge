import type { RealtimeChannel } from '@supabase/supabase-js'
import {
  DEFAULT_RTC_CONFIG,
  getIceServers,
  type LobbyParticipant,
  type WebRtcSignalPayload,
} from './webrtc-peer-bridge'

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
  channel?: RealtimeChannel | null
  localStream?: MediaStream | null
  onPeerStream?: (peerId: string, stream: MediaStream, info: LobbyParticipant) => void
  onPeerLeft?: (peerId: string) => void
  onPeerConnectionStateChange?: (peerId: string, state: RTCPeerConnectionState) => void
  onPeerLatencyChange?: (peerId: string, latencyMs: number) => void
  onTeamCue?: (cue: string, senderName: string) => void
  onSpotlightChange?: (spotlightUserId: string | null) => void
  onMuteDirective?: (muted: boolean) => void
  onCircuitTimerSync?: (data: unknown) => void
  onError?: (err: Error) => void
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
}

/**
 * Enterprise Multi-Peer WebRTC Mesh Bridge for Team & Squad Live Studio.
 * Connects a coach with multiple athletes simultaneously:
 * - Deterministic polite/impolite role negotiation per peer pair.
 * - Targeted WebRTC signaling via targetUserId in shared Realtime channel.
 * - Per-peer connection state, latency monitoring, and automatic ICE restarts.
 * - Broadcast channels for team-wide mute, spotlight, circuit timer, and spoken cues.
 */
export class WebRtcMultiPeerBridge {
  private peers = new Map<string, PeerEntry>()
  private options: WebRtcMultiPeerBridgeOptions
  private isDestroyed = false
  private spotlightUserId: string | null = null

  constructor(options: WebRtcMultiPeerBridgeOptions) {
    this.options = options
  }

  public init(): boolean {
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

    const existing = this.peers.get(peerId)
    if (existing) return existing

    const RTCPeerConnectionClass = getRTCPeerConnectionConstructor()
    if (!RTCPeerConnectionClass) return null

    try {
      const pc = new RTCPeerConnectionClass({
        ...DEFAULT_RTC_CONFIG,
        iceServers: getIceServers(),
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
        if (this.isDestroyed || !entry.pc) return
        try {
          entry.makingOffer = true
          const offer = await entry.pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          })
          if (entry.pc.signalingState !== 'stable') {
            entry.negotiationPending = true
            return
          }
          await entry.pc.setLocalDescription(offer)
          this.sendSignal({
            type: 'offer',
            senderId: this.options.currentUserId,
            senderName: this.options.currentUserName,
            targetUserId: peerId,
            sdp: entry.pc.localDescription || offer,
          })
        } catch (err) {
          this.options.onError?.(err instanceof Error ? err : new Error(String(err)))
        } finally {
          entry.makingOffer = false
        }
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
        if (pc && this.options.onPeerConnectionStateChange) {
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

      // ICE Connection Auto-Restart
      pc.oniceconnectionstatechange = () => {
        if (!pc || this.isDestroyed) return
        const state = pc.iceConnectionState
        if (state === 'failed') {
          void this.restartIceForPeer(peerId)
        }
      }

      // Attach current local stream tracks to this peer
      if (this.options.localStream) {
        this.attachStreamToPeer(entry, this.options.localStream)
      }

      return entry
    } catch (err) {
      this.options.onError?.(err instanceof Error ? err : new Error(String(err)))
      return null
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

    try {
      entry.makingOffer = true
      const offer = await entry.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })
      if (entry.pc.signalingState !== 'stable') return null
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
    if (!entry || !entry.pc || this.isDestroyed) return

    try {
      if ('restartIce' in entry.pc && typeof (entry.pc as { restartIce?: () => void }).restartIce === 'function') {
        ;(entry.pc as { restartIce: () => void }).restartIce()
      } else {
        const offer = await entry.pc.createOffer({ iceRestart: true })
        if (entry.pc.signalingState !== 'stable') return
        await entry.pc.setLocalDescription(offer)
        this.sendSignal({
          type: 'offer',
          senderId: this.options.currentUserId,
          targetUserId: peerId,
          sdp: entry.pc.localDescription || offer,
        })
      }
    } catch (err) {
      this.options.onError?.(err instanceof Error ? err : new Error(String(err)))
    }
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
      // 1. Team Broadcast Signals (No peer connection needed)
      if (payload.type === 'spotlight') {
        const spotlightId = (payload.data as string | null) ?? null
        this.spotlightUserId = spotlightId
        this.options.onSpotlightChange?.(spotlightId)
        return
      }

      if (payload.type === 'mute') {
        const isMuted = Boolean((payload.data as { muted?: boolean })?.muted ?? true)
        this.options.onMuteDirective?.(isMuted)
        return
      }

      if (payload.type === 'team-cue') {
        const cueText = String(payload.data || '')
        this.options.onTeamCue?.(cueText, payload.senderName || 'Coach')
        return
      }

      if (payload.type === 'circuit-timer') {
        this.options.onCircuitTimerSync?.(payload.data)
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

      // 3. Presence & Handshake Discovery
      if (payload.type === 'join' || payload.type === 'ready') {
        const entry = this.getOrCreatePeer(payload.senderId, payload.senderName)
        this.sendSignal({
          type: 'ready-ack',
          senderId: this.options.currentUserId,
          senderName: this.options.currentUserName,
          targetUserId: payload.senderId,
        })
        if (entry && !entry.isPolite && entry.pc.signalingState === 'stable' && entry.pc.connectionState !== 'connected') {
          void this.createOfferForPeer(payload.senderId)
        }
        return
      }

      if (payload.type === 'ready-ack') {
        const entry = this.getOrCreatePeer(payload.senderId, payload.senderName)
        if (entry && !entry.isPolite && entry.pc.signalingState === 'stable' && entry.pc.connectionState !== 'connected') {
          void this.createOfferForPeer(payload.senderId)
        }
        return
      }

      // 4. Perfect Negotiation SDP Offer
      if (payload.type === 'offer' && payload.sdp) {
        const entry = this.getOrCreatePeer(payload.senderId, payload.senderName)
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

        const answer = await entry.pc.createAnswer()
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
