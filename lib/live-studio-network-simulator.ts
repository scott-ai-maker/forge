/**
 * Deterministic Multi-Bandwidth WebRTC Network Simulator for Forge Athletic Live Studio Testing.
 *
 * Recreates realistic client internet conditions (Fiber, Home Wi-Fi, Congested Gym Wi-Fi,
 * Poor Hotel Wi-Fi / 3G, Rural Edge / 2G, Asymmetric Download/Upload, Jittery Cellular,
 * Wi-Fi-to-5G Handoff Dropouts, Video Freezes, and Mixed-Bandwidth Multi-Peer Squads)
 * with zero flaky real-network dependencies.
 */

import type { RealtimeChannel } from '@supabase/supabase-js'
import type { WebRtcSignalPayload } from './webrtc-peer-bridge'

export interface SimulatedNetworkProfile {
  id: string
  label: string
  downlinkMbps: number
  uplinkBps: number
  rttMs: number
  inboundLossRatio: number
  outboundLossRatio: number
  jitterMs: number
  framesPerSecond: number
  freezeIncrementPerTick?: number
  qualityLimitationReason?: 'none' | 'bandwidth' | 'cpu'
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g'
  saveData?: boolean
}

export const REAL_WORLD_NETWORK_PROFILES: Record<string, SimulatedNetworkProfile> = {
  fiber_studio: {
    id: 'fiber_studio',
    label: 'Fiber / Studio Wi-Fi (100 Mbps)',
    downlinkMbps: 100,
    uplinkBps: 12_000_000,
    rttMs: 18,
    inboundLossRatio: 0.001,
    outboundLossRatio: 0.001,
    jitterMs: 3,
    framesPerSecond: 30,
    qualityLimitationReason: 'none',
    effectiveType: '4g',
  },
  home_wifi_good_lte: {
    id: 'home_wifi_good_lte',
    label: 'Average Home Wi-Fi / Good 4G LTE',
    downlinkMbps: 8,
    uplinkBps: 1_800_000,
    rttMs: 85,
    inboundLossRatio: 0.01,
    outboundLossRatio: 0.01,
    jitterMs: 12,
    framesPerSecond: 28,
    qualityLimitationReason: 'none',
    effectiveType: '4g',
  },
  congested_gym_wifi: {
    id: 'congested_gym_wifi',
    label: 'Congested Apartment / Gym Wi-Fi (500 kbps up)',
    downlinkMbps: 1.6,
    uplinkBps: 500_000,
    rttMs: 180,
    inboundLossRatio: 0.035,
    outboundLossRatio: 0.04,
    jitterMs: 28,
    framesPerSecond: 20,
    qualityLimitationReason: 'none',
    effectiveType: '4g',
  },
  hotel_wifi_weak_3g: {
    id: 'hotel_wifi_weak_3g',
    label: 'Poor Hotel Wi-Fi / Weak 3G (220 kbps up)',
    downlinkMbps: 0.45,
    uplinkBps: 220_000,
    rttMs: 320,
    inboundLossRatio: 0.09,
    outboundLossRatio: 0.08,
    jitterMs: 55,
    framesPerSecond: 12,
    qualityLimitationReason: 'bandwidth',
    effectiveType: '3g',
  },
  rural_2g_basement: {
    id: 'rural_2g_basement',
    label: 'Basement Gym / Rural 2G Edge (60 kbps)',
    downlinkMbps: 0.12,
    uplinkBps: 60_000,
    rttMs: 740,
    inboundLossRatio: 0.22,
    outboundLossRatio: 0.2,
    jitterMs: 145,
    framesPerSecond: 2,
    freezeIncrementPerTick: 2,
    qualityLimitationReason: 'bandwidth',
    effectiveType: '2g',
    saveData: true,
  },
  frozen_video_fast_ws: {
    id: 'frozen_video_fast_ws',
    label: 'Frozen Video Stream (Fast WebSocket Ping, Congested Media UDP)',
    downlinkMbps: 4,
    uplinkBps: 900_000,
    rttMs: 420,
    inboundLossRatio: 0.01,
    outboundLossRatio: 0.01,
    jitterMs: 30,
    framesPerSecond: 2,
    freezeIncrementPerTick: 2,
    qualityLimitationReason: 'bandwidth',
    effectiveType: '4g',
  },
}

const SAMPLE_OPUS_SDP = [
  'v=0',
  'o=- 4611731400430051336 2 IN IP4 127.0.0.1',
  's=-',
  't=0 0',
  'm=audio 9 UDP/TLS/RTP/SAVPF 111',
  'a=rtpmap:111 opus/48000/2',
  'a=fmtp:111 minptime=10',
  'm=video 9 UDP/TLS/RTP/SAVPF 96',
  'a=rtpmap:96 VP8/90000',
].join('\r\n')

export interface SimulatedSenderRecord {
  kind: 'audio' | 'video'
  track: { id: string; kind: 'audio' | 'video' }
  params: RTCRtpSendParameters & {
    degradationPreference?: string
    encodings: Array<
      RTCRtpEncodingParameters & {
        priority?: string
        networkPriority?: string
      }
    >
  }
  setParametersHistory: Array<Record<string, unknown>>
}

export class SimulatedRTCPeerConnection {
  public signalingState: RTCSignalingState = 'stable'
  public connectionState: RTCPeerConnectionState = 'new'
  public iceConnectionState: RTCIceConnectionState = 'new'
  public localDescription: RTCSessionDescriptionInit | null = null
  public remoteDescription: RTCSessionDescriptionInit | null = null
  public iceServersUsed: RTCIceServer[] = []
  public ontrack: ((event: unknown) => void) | null = null
  public onicecandidate: ((event: { candidate: { toJSON: () => RTCIceCandidateInit } | null }) => void) | null = null
  public onconnectionstatechange: (() => void) | null = null
  public oniceconnectionstatechange: (() => void) | null = null
  public onnegotiationneeded: (() => void) | null = null

  public iceRestartCalls = 0
  public createOfferCalls: Array<RTCOfferOptions | undefined> = []
  public addedCandidates: RTCIceCandidateInit[] = []
  public closed = false

  private senders: SimulatedSenderRecord[] = []
  private profile: SimulatedNetworkProfile = REAL_WORLD_NETWORK_PROFILES.fiber_studio
  private cumulativePacketsRecv = 0
  private cumulativePacketsLost = 0
  private cumulativeFreezeCount = 0
  private cumulativeOutboundPackets = 0
  private cumulativeOutboundRetx = 0

  constructor(config?: RTCConfiguration) {
    this.iceServersUsed = config?.iceServers ?? []
    this.senders = [
      this.createSender('audio', 'sim-audio-track'),
      this.createSender('video', 'sim-video-track'),
    ]
  }

  private createSender(kind: 'audio' | 'video', id: string): SimulatedSenderRecord {
    return {
      kind,
      track: { id, kind },
      params: {
        transactionId: `tx-${kind}`,
        codecs: [],
        headerExtensions: [],
        rtcp: {},
        encodings: [{ active: true, maxBitrate: kind === 'video' ? 2_500_000 : 64_000 }],
      },
      setParametersHistory: [],
    }
  }

  public setNetworkProfile(profile: SimulatedNetworkProfile): void {
    this.profile = profile
  }

  public getVideoSender(): SimulatedSenderRecord {
    return this.senders.find(s => s.kind === 'video')!
  }

  public getAudioSender(): SimulatedSenderRecord {
    return this.senders.find(s => s.kind === 'audio')!
  }

  public addTransceiver(kind: 'audio' | 'video', init?: { direction?: RTCRtpTransceiverDirection }) {
    const sender = this.senders.find(s => s.kind === kind) ?? this.createSender(kind, `sim-${kind}-t`)
    return {
      direction: init?.direction ?? 'sendrecv',
      receiver: { track: { kind } },
      sender: this.wrapSender(sender),
    }
  }

  public getTransceivers() {
    return this.senders.map(s => ({
      direction: 'sendrecv' as RTCRtpTransceiverDirection,
      receiver: { track: { kind: s.kind } },
      sender: this.wrapSender(s),
    }))
  }

  public getSenders() {
    return this.senders.map(s => this.wrapSender(s))
  }

  private wrapSender(record: SimulatedSenderRecord) {
    return {
      track: record.track,
      replaceTrack: async (nextTrack: { id: string; kind: 'audio' | 'video' } | null) => {
        if (nextTrack) record.track = nextTrack
      },
      getParameters: () => JSON.parse(JSON.stringify(record.params)),
      setParameters: async (next: SimulatedSenderRecord['params']) => {
        record.params = JSON.parse(JSON.stringify(next))
        record.setParametersHistory.push(JSON.parse(JSON.stringify(next)))
      },
    }
  }

  public addTrack(track: { id: string; kind: 'audio' | 'video' }) {
    let existing = this.senders.find(s => s.kind === track.kind)
    if (!existing) {
      existing = this.createSender(track.kind, track.id)
      this.senders.push(existing)
    } else {
      existing.track = track
    }
    return this.wrapSender(existing)
  }

  public setConfiguration(config: RTCConfiguration) {
    this.iceServersUsed = config.iceServers ?? []
  }

  public restartIce() {
    this.iceRestartCalls += 1
  }

  public async createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit> {
    this.createOfferCalls.push(options)
    return { type: 'offer', sdp: SAMPLE_OPUS_SDP }
  }

  public async createAnswer(): Promise<RTCSessionDescriptionInit> {
    return { type: 'answer', sdp: SAMPLE_OPUS_SDP }
  }

  public async setLocalDescription(desc: RTCSessionDescriptionInit) {
    if (desc.type === 'rollback') {
      this.signalingState = 'stable'
      return
    }
    this.localDescription = desc
    this.signalingState = desc.type === 'offer' ? 'have-local-offer' : 'stable'
  }

  public async setRemoteDescription(desc: RTCSessionDescriptionInit) {
    this.remoteDescription = desc
    this.signalingState = desc.type === 'offer' ? 'have-remote-offer' : 'stable'
  }

  public async addIceCandidate(cand: RTCIceCandidateInit) {
    this.addedCandidates.push(cand)
  }

  public emitIceState(iceState: RTCIceConnectionState, connState?: RTCPeerConnectionState) {
    this.iceConnectionState = iceState
    this.oniceconnectionstatechange?.()
    if (connState) {
      this.connectionState = connState
      this.onconnectionstatechange?.()
    }
  }

  public async getStats(): Promise<Map<string, Record<string, unknown>>> {
    const p = this.profile
    const tickPackets = 120
    const lostPackets = Math.round(tickPackets * p.inboundLossRatio)
    const recvPackets = Math.max(0, tickPackets - lostPackets)
    this.cumulativePacketsRecv += recvPackets
    this.cumulativePacketsLost += lostPackets
    this.cumulativeFreezeCount += p.freezeIncrementPerTick ?? 0
    this.cumulativeOutboundPackets += tickPackets
    this.cumulativeOutboundRetx += Math.round(tickPackets * p.outboundLossRatio)

    const report = new Map<string, Record<string, unknown>>()
    report.set('pair-1', {
      type: 'candidate-pair',
      state: 'succeeded',
      currentRoundTripTime: p.rttMs / 1000,
      availableOutgoingBitrate: p.uplinkBps,
    })
    report.set('in-video-1', {
      type: 'inbound-rtp',
      kind: 'video',
      packetsReceived: this.cumulativePacketsRecv,
      packetsLost: this.cumulativePacketsLost,
      framesPerSecond: p.framesPerSecond,
      jitter: p.jitterMs / 1000,
      freezeCount: this.cumulativeFreezeCount,
    })
    report.set('remote-in-video-1', {
      type: 'remote-inbound-rtp',
      kind: 'video',
      fractionLost: p.outboundLossRatio,
      roundTripTime: p.rttMs / 1000,
      jitter: p.jitterMs / 1000,
    })
    report.set('out-video-1', {
      type: 'outbound-rtp',
      kind: 'video',
      packetsSent: this.cumulativeOutboundPackets,
      retransmittedPacketsSent: this.cumulativeOutboundRetx,
      qualityLimitationReason: p.qualityLimitationReason ?? 'none',
    })
    return report
  }

  public close() {
    this.closed = true
    this.connectionState = 'closed'
    this.iceConnectionState = 'closed'
  }
}

/**
 * In-memory Realtime signaling bus that delivers broadcast `webrtc_signal` payloads
 * between all registered peers (Coach + 1..N Athletes) with full history inspection.
 */
export class SimulatedSignalingBus {
  private subscribers = new Map<string, (payload: WebRtcSignalPayload) => Promise<void> | void>()
  public sentSignals: WebRtcSignalPayload[] = []

  public createChannelFor(
    userId: string,
    onSignal: (payload: WebRtcSignalPayload) => Promise<void> | void
  ): RealtimeChannel {
    this.subscribers.set(userId, onSignal)
    return {
      send: async (msg: { event: string; payload: WebRtcSignalPayload }) => {
        if (msg.event === 'webrtc_signal') {
          this.sentSignals.push(msg.payload)
          for (const [subId, handler] of this.subscribers.entries()) {
            if (subId === userId) continue
            if (
              msg.payload.targetUserId &&
              msg.payload.targetUserId !== '*' &&
              msg.payload.targetUserId !== subId
            ) {
              continue
            }
            await handler(msg.payload)
          }
        }
        return 'ok'
      },
    } as unknown as RealtimeChannel
  }
}

/**
 * Installs `SimulatedRTCPeerConnection` & `MediaStream` into `globalThis` for deterministic tests,
 * returning all created PC instances and a cleanup callback.
 */
export function installSimulatedWebRtcEnvironment() {
  const createdPcs: SimulatedRTCPeerConnection[] = []
  const origPC = (globalThis as Record<string, unknown>).RTCPeerConnection
  const origMS = (globalThis as Record<string, unknown>).MediaStream
  const origDesc = (globalThis as Record<string, unknown>).RTCSessionDescription
  const origCand = (globalThis as Record<string, unknown>).RTCIceCandidate

  class TrackedPC extends SimulatedRTCPeerConnection {
    constructor(config?: RTCConfiguration) {
      super(config)
      createdPcs.push(this)
    }
  }

  class MockMediaStream {
    private tracks: Array<{ id: string; kind: string; stop?: () => void }>
    constructor(tracks: Array<{ id: string; kind: string; stop?: () => void }> = []) {
      this.tracks = [...tracks]
    }
    getTracks() {
      return this.tracks
    }
    getVideoTracks() {
      return this.tracks.filter(t => t.kind === 'video')
    }
    getAudioTracks() {
      return this.tracks.filter(t => t.kind === 'audio')
    }
    addTrack(track: { id: string; kind: string; stop?: () => void }) {
      this.tracks.push(track)
    }
  }

  ;(globalThis as Record<string, unknown>).RTCPeerConnection = TrackedPC
  ;(globalThis as Record<string, unknown>).MediaStream = MockMediaStream
  ;(globalThis as Record<string, unknown>).RTCSessionDescription = function (d: RTCSessionDescriptionInit) {
    return d
  }
  ;(globalThis as Record<string, unknown>).RTCIceCandidate = function (c: RTCIceCandidateInit) {
    return c
  }

  return {
    createdPcs,
    cleanup: () => {
      if (origPC !== undefined) (globalThis as Record<string, unknown>).RTCPeerConnection = origPC
      else delete (globalThis as Record<string, unknown>).RTCPeerConnection
      if (origMS !== undefined) (globalThis as Record<string, unknown>).MediaStream = origMS
      else delete (globalThis as Record<string, unknown>).MediaStream
      if (origDesc !== undefined) (globalThis as Record<string, unknown>).RTCSessionDescription = origDesc
      else delete (globalThis as Record<string, unknown>).RTCSessionDescription
      if (origCand !== undefined) (globalThis as Record<string, unknown>).RTCIceCandidate = origCand
      else delete (globalThis as Record<string, unknown>).RTCIceCandidate
    },
  }
}
