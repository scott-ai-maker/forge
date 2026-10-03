import type { RealtimeChannel } from '@supabase/supabase-js'

export function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    // Public community TURN relay fallbacks for mobile cellular / symmetric NAT traversal
    {
      urls: [
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
}

export interface WebRtcSignalPayload {
  type: 'offer' | 'answer' | 'candidate' | 'join' | 'ready' | 'ready-ack' | 'ping' | 'pong'
  senderId: string
  sdp?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit | null
  timestamp?: number
  rtt?: number
}

export interface WebRtcBridgeOptions {
  sessionId: string
  currentUserId: string
  isCoach: boolean
  isPolite?: boolean
  channel?: RealtimeChannel | null
  localStream?: MediaStream | null
  onRemoteStream?: (stream: MediaStream) => void
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void
  onIceConnectionStateChange?: (state: RTCIceConnectionState) => void
  onLatencyChange?: (rttMs: number) => void
  onError?: (err: Error) => void
}

function getRTCPeerConnectionConstructor(): typeof RTCPeerConnection | undefined {
  if (typeof window !== 'undefined' && window.RTCPeerConnection) {
    return window.RTCPeerConnection
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).RTCPeerConnection) {
    return (globalThis as any).RTCPeerConnection
  }
  return undefined
}

function getRTCSessionDescription(sdp: RTCSessionDescriptionInit): RTCSessionDescription {
  const ctor = (typeof window !== 'undefined' && window.RTCSessionDescription) || (globalThis as any).RTCSessionDescription
  return ctor ? new ctor(sdp) : (sdp as unknown as RTCSessionDescription)
}

function getRTCIceCandidate(cand: RTCIceCandidateInit): RTCIceCandidate {
  const ctor = (typeof window !== 'undefined' && window.RTCIceCandidate) || (globalThis as any).RTCIceCandidate
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
  private ignoreOffer = false
  private isSettingRemoteAnswerPending = false

  // ICE Debounce & Latency State
  private iceRestartTimer: ReturnType<typeof setTimeout> | null = null
  private isRestartingIce = false
  private lastPingTimestamp = 0
  private latencyMs: number | null = null

  constructor(options: WebRtcBridgeOptions) {
    this.options = options
    // Athlete is polite (yields on offer glare), Coach is impolite (assertive).
    this.isPolite = options.isPolite ?? !options.isCoach
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
      const MediaStreamClass = typeof window !== 'undefined' ? window.MediaStream : (globalThis as any).MediaStream
      this.remoteStream = MediaStreamClass ? new MediaStreamClass() : null

      // Perfect Negotiation: onnegotiationneeded triggers offer generation automatically
      this.pc.onnegotiationneeded = async () => {
        if (this.isDestroyed || !this.pc) return
        try {
          this.makingOffer = true
          const offer = await this.pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          })
          if (this.pc.signalingState !== 'stable') return
          await this.pc.setLocalDescription(offer)
          this.sendSignal({
            type: 'offer',
            senderId: this.options.currentUserId,
            sdp: this.pc.localDescription || offer,
          })
        } catch (err) {
          this.options.onError?.(err instanceof Error ? err : new Error(String(err)))
        } finally {
          this.makingOffer = false
        }
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

        if (event.track) {
          event.track.onunmute = () => {
            if (this.remoteStream && this.options.onRemoteStream) {
              this.options.onRemoteStream(this.remoteStream)
            }
          }
        }

        if (this.remoteStream && this.options.onRemoteStream) {
          this.options.onRemoteStream(this.remoteStream)
        }
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
    const senders = this.pc.getSenders()

    stream.getTracks().forEach(track => {
      const existing = senders.find(s => s.track?.kind === track.kind)
      if (existing) {
        Promise.resolve(existing.replaceTrack(track)).catch(() => {})
      } else {
        try {
          const sender = this.pc?.addTrack(track, stream)
          if (sender && track.kind === 'video') {
            this.optimizeVideoSender(sender)
          }
        } catch {
          // Track already added to peer connection
        }
      }
    })
  }

  private optimizeVideoSender(sender: RTCRtpSender): void {
    try {
      const params = sender.getParameters()
      if (!params.encodings || params.encodings.length === 0) {
        params.encodings = [{}]
      }
      // Cap at 2.0 Mbps to prevent bufferbloat and packet drops on fluctuating networks
      params.encodings[0].maxBitrate = 2000000
      ;(params as any).degradationPreference = 'maintain-framerate'
      void sender.setParameters(params).catch(() => {})
    } catch {
      // Optional browser optimization
    }
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
      if (typeof (this.pc as any).restartIce === 'function') {
        ;(this.pc as any).restartIce()
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
    try {
      this.makingOffer = true
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })
      if (this.pc.signalingState !== 'stable') return null
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
    }
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
    if (this.isDestroyed || !this.pc || payload.senderId === this.options.currentUserId) {
      return
    }

    try {
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
