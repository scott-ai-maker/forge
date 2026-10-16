import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  isWebRtcSupported,
  DEFAULT_RTC_CONFIG,
  DEFAULT_ICE_SERVERS,
  getIceServers,
  WebRtcPeerBridge,
} from './webrtc-peer-bridge'

type MockTrack = {
  kind: string
  id: string
  stop: ReturnType<typeof vi.fn>
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
}

type MockStream = {
  getTracks: ReturnType<typeof vi.fn>
  addTrack: ReturnType<typeof vi.fn>
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
}

type MockSender = {
  track: MockTrack
  replaceTrack: ReturnType<typeof vi.fn>
  getParameters: ReturnType<typeof vi.fn>
  setParameters: ReturnType<typeof vi.fn>
}

interface MockPcState {
  ontrack: ((ev: unknown) => void) | null
  onicecandidate: ((ev: unknown) => void) | null
  onconnectionstatechange: (() => void) | null
  oniceconnectionstatechange: (() => void) | null
  onnegotiationneeded: (() => void) | null
  signalingState: string
  connectionState: string
  iceConnectionState: string
  localDescription: { type: string; sdp: string } | null
  remoteDescription: { type: string; sdp: string } | null
  getSenders: ReturnType<typeof vi.fn>
  addTrack: ReturnType<typeof vi.fn>
  createOffer: ReturnType<typeof vi.fn>
  setLocalDescription: ReturnType<typeof vi.fn>
  setRemoteDescription: ReturnType<typeof vi.fn>
  createAnswer: ReturnType<typeof vi.fn>
  addIceCandidate: ReturnType<typeof vi.fn>
  restartIce: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
}

type BridgeChannel = NonNullable<ConstructorParameters<typeof WebRtcPeerBridge>[0]['channel']>

function setupMockWebRtc(overrides: Partial<MockPcState> = {}) {
  const mockTrack: MockTrack = {
    kind: 'video',
    id: 'trk-1',
    stop: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }

  const mockStream: MockStream = {
    getTracks: vi.fn().mockReturnValue([mockTrack]),
    addTrack: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }

  const mockSender: MockSender = {
    track: mockTrack,
    replaceTrack: vi.fn().mockResolvedValue(undefined),
    getParameters: vi.fn().mockReturnValue({ encodings: [{}] }),
    setParameters: vi.fn().mockResolvedValue(undefined),
  }

  const mockPc: MockPcState = {
    ontrack: null,
    onicecandidate: null,
    onconnectionstatechange: null,
    oniceconnectionstatechange: null,
    onnegotiationneeded: null,
    signalingState: 'stable',
    connectionState: 'connected',
    iceConnectionState: 'connected',
    localDescription: { type: 'offer', sdp: 'mock-local-sdp' },
    remoteDescription: null,
    getSenders: vi.fn().mockReturnValue([mockSender]),
    addTrack: vi.fn().mockReturnValue(mockSender),
    createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-offer-sdp' }),
    setLocalDescription: vi.fn().mockResolvedValue(undefined),
    setRemoteDescription: vi.fn().mockImplementation((desc: { type: string; sdp: string }) => {
      mockPc.remoteDescription = desc
      return Promise.resolve()
    }),
    createAnswer: vi.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-answer-sdp' }),
    addIceCandidate: vi.fn().mockResolvedValue(undefined),
    restartIce: vi.fn(),
    close: vi.fn(),
    ...overrides,
  }

  const g = globalThis as unknown as Record<string, unknown>
  const originalWindow = g.window
  const originalMediaStream = g.MediaStream
  const originalRTCPeerConnection = g.RTCPeerConnection
  const originalRTCSessionDescription = g.RTCSessionDescription
  const originalRTCIceCandidate = g.RTCIceCandidate

  function MockRTCPeerConnection() {
    return mockPc
  }
  function MockMediaStream() {
    return mockStream
  }
  function MockRTCSessionDescription(this: Record<string, unknown>, sdp: Record<string, unknown>) {
    Object.assign(this, sdp)
  }
  function MockRTCIceCandidate(this: Record<string, unknown>, cand: Record<string, unknown>) {
    Object.assign(this, cand)
  }

  g.RTCPeerConnection = MockRTCPeerConnection
  g.MediaStream = MockMediaStream
  g.RTCSessionDescription = MockRTCSessionDescription
  g.RTCIceCandidate = MockRTCIceCandidate
  g.window = {
    RTCPeerConnection: MockRTCPeerConnection,
    MediaStream: MockMediaStream,
    RTCSessionDescription: MockRTCSessionDescription,
    RTCIceCandidate: MockRTCIceCandidate,
  }

  return {
    mockPc,
    mockStream: mockStream as unknown as MediaStream,
    mockTrack: mockTrack as unknown as MediaStreamTrack,
    mockSender,
    cleanup: () => {
      g.window = originalWindow
      g.MediaStream = originalMediaStream
      g.RTCPeerConnection = originalRTCPeerConnection
      g.RTCSessionDescription = originalRTCSessionDescription
      g.RTCIceCandidate = originalRTCIceCandidate
    },
  }
}

describe('lib/webrtc-peer-bridge', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('provides default STUN and fallback TURN servers in RTC configuration', () => {
    const servers = getIceServers()
    expect(servers.length).toBeGreaterThanOrEqual(4)
    expect(servers.some(s => Array.isArray(s.urls) ? s.urls.some(u => u.includes('stun.l.google.com')) : s.urls.includes('stun.l.google.com'))).toBe(true)
    expect(servers.some(s => Array.isArray(s.urls) ? s.urls.some(u => u.includes('openrelay.metered.ca')) : s.urls.includes('openrelay.metered.ca'))).toBe(true)
    expect(DEFAULT_RTC_CONFIG.iceServers).toEqual(DEFAULT_ICE_SERVERS)
    expect(DEFAULT_RTC_CONFIG.iceCandidatePoolSize).toBe(10)
  })

  it('detects WebRTC support correctly based on window context', () => {
    expect(isWebRtcSupported()).toBe(false)
  })

  it('initializes and manages RTCPeerConnection lifecycle with Perfect Negotiation Pattern', async () => {
    const { mockPc, mockStream, cleanup } = setupMockWebRtc()

    try {
      expect(isWebRtcSupported()).toBe(true)

      const channelMock = {
        send: vi.fn().mockResolvedValue(undefined),
      }
      const remoteStreamCb = vi.fn()
      const connectionStateCb = vi.fn()

      const coachBridge = new WebRtcPeerBridge({
        sessionId: 'session-123',
        currentUserId: 'coach-1',
        isCoach: true,
        channel: channelMock as unknown as BridgeChannel,
        localStream: mockStream,
        onRemoteStream: remoteStreamCb,
        onConnectionStateChange: connectionStateCb,
      })

      const pc = coachBridge.init()
      expect(pc).toBe(mockPc)

      // 1. Test presence announcement
      await coachBridge.announcePresence()
      expect(channelMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            type: 'ready',
            senderId: 'coach-1',
          }),
        })
      )

      // 2. Test offer creation
      const offer = await coachBridge.createOffer()
      expect(offer).toEqual({ type: 'offer', sdp: 'mock-offer-sdp' })
      expect(channelMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            type: 'offer',
            senderId: 'coach-1',
          }),
        })
      )

      // 3. Test handling answer signal
      await coachBridge.handleSignal({
        type: 'answer',
        senderId: 'client-1',
        sdp: { type: 'answer', sdp: 'remote-answer-sdp' },
      })
      expect(mockPc.setRemoteDescription).toHaveBeenCalled()

      // 4. Test symmetric presence: newcomer joins/announces ready
      await coachBridge.handleSignal({
        type: 'ready',
        senderId: 'client-1',
      })
      expect(channelMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            type: 'ready-ack',
            senderId: 'coach-1',
          }),
        })
      )

      // 5. Test handling ICE candidate
      await coachBridge.handleSignal({
        type: 'candidate',
        senderId: 'client-1',
        candidate: { candidate: 'candidate:1 1 UDP ...', sdpMid: '0', sdpMLineIndex: 0 },
      })
      expect(mockPc.addIceCandidate).toHaveBeenCalled()

      // 6. Test automatic ICE restart
      await coachBridge.restartIce()
      expect(mockPc.restartIce).toHaveBeenCalled()

      // 7. Test polite peer rollback on offer collision (Athlete role)
      const athleteBridge = new WebRtcPeerBridge({
        sessionId: 'session-123',
        currentUserId: 'athlete-1',
        isCoach: false, // isPolite = true
        channel: channelMock as unknown as BridgeChannel,
      })
      athleteBridge.init()

      // Simulate offer collision: athlete is in mid-offer
      ;(athleteBridge as unknown as { makingOffer: boolean }).makingOffer = true
      await athleteBridge.handleSignal({
        type: 'offer',
        senderId: 'coach-1',
        sdp: { type: 'offer', sdp: 'incoming-coach-offer' },
      })
      // Polite peer rolls back local description and creates answer
      expect(mockPc.setLocalDescription).toHaveBeenCalledWith({ type: 'rollback' })
      expect(mockPc.createAnswer).toHaveBeenCalled()

      // Cleanup
      coachBridge.destroy()
      athleteBridge.destroy()
      expect(mockPc.close).toHaveBeenCalled()
    } finally {
      cleanup()
    }
  })

  it('handles ping and pong signals for real-time RTT latency measurement', async () => {
    const { cleanup } = setupMockWebRtc()

    try {
      const channelMock = {
        send: vi.fn().mockResolvedValue(undefined),
      }
      const latencyCb = vi.fn()

      const bridge = new WebRtcPeerBridge({
        sessionId: 'session-ping-1',
        currentUserId: 'coach-1',
        isCoach: true,
        channel: channelMock as unknown as BridgeChannel,
        onLatencyChange: latencyCb,
      })
      bridge.init()

      // 1. sendPing sends ping signal with timestamp
      bridge.sendPing()
      expect(channelMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            type: 'ping',
            senderId: 'coach-1',
            timestamp: expect.any(Number),
          }),
        })
      )

      // 2. Incoming ping from peer automatically sends pong back with matching timestamp
      channelMock.send.mockClear()
      await bridge.handleSignal({
        type: 'ping',
        senderId: 'client-1',
        timestamp: 998877,
      })
      expect(channelMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            type: 'pong',
            senderId: 'coach-1',
            timestamp: 998877,
          }),
        })
      )

      // 3. Incoming pong from peer updates latency and fires callback
      const now = Date.now()
      await bridge.handleSignal({
        type: 'pong',
        senderId: 'client-1',
        timestamp: now - 35,
      })
      expect(latencyCb).toHaveBeenCalledWith(expect.any(Number))
      const reportedRtt = latencyCb.mock.calls[0][0]
      expect(reportedRtt).toBeGreaterThanOrEqual(30)
      expect(bridge.getLatency()).toBe(reportedRtt)

      bridge.destroy()
    } finally {
      cleanup()
    }
  })

  it('suppresses createOffer renegotiation when peer connection is already connected', async () => {
    const { mockPc, cleanup } = setupMockWebRtc({
      connectionState: 'connected',
    })

    try {
      const channelMock = {
        send: vi.fn().mockResolvedValue(undefined),
      }

      const coachBridge = new WebRtcPeerBridge({
        sessionId: 'session-reneg-1',
        currentUserId: 'coach-1',
        isCoach: true,
        channel: channelMock as unknown as BridgeChannel,
      })
      coachBridge.init()

      // When connectionState is 'connected', incoming 'ready' must NOT trigger createOffer
      await coachBridge.handleSignal({
        type: 'ready',
        senderId: 'client-1',
      })
      expect(channelMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            type: 'ready-ack',
            senderId: 'coach-1',
          }),
        })
      )
      expect(mockPc.createOffer).not.toHaveBeenCalled()

      // When connectionState is 'connected', incoming 'ready-ack' must NOT trigger createOffer
      channelMock.send.mockClear()
      await coachBridge.handleSignal({
        type: 'ready-ack',
        senderId: 'client-1',
      })
      expect(mockPc.createOffer).not.toHaveBeenCalled()

      // However, if connectionState is NOT connected (e.g. 'new' or 'disconnected'), incoming 'ready' DOES trigger offer
      mockPc.connectionState = 'new'
      await coachBridge.handleSignal({
        type: 'ready',
        senderId: 'client-1',
      })
      expect(mockPc.createOffer).toHaveBeenCalledTimes(1)

      coachBridge.destroy()
    } finally {
      cleanup()
    }
  })

  it('debounces ICE restart on transient network disconnection and cancels on recovery', async () => {
    vi.useFakeTimers()
    const { mockPc, cleanup } = setupMockWebRtc()

    try {
      const bridge = new WebRtcPeerBridge({
        sessionId: 'session-ice-debounce',
        currentUserId: 'coach-1',
        isCoach: true,
      })
      bridge.init()

      // Case 1: Transient drop - disconnected for 2 seconds, then reconnects
      mockPc.iceConnectionState = 'disconnected'
      mockPc.oniceconnectionstatechange?.()
      expect(mockPc.restartIce).not.toHaveBeenCalled()

      // Advance 2 seconds (still before 4s debounce timeout)
      vi.advanceTimersByTime(2000)
      expect(mockPc.restartIce).not.toHaveBeenCalled()

      // Reconnects back to 'connected'
      mockPc.iceConnectionState = 'connected'
      mockPc.oniceconnectionstatechange?.()

      // Advance past the original 4s window - restart should NOT fire because it reconnected
      vi.advanceTimersByTime(3000)
      expect(mockPc.restartIce).not.toHaveBeenCalled()

      // Case 2: Persistent drop - stays disconnected for full 4+ seconds
      mockPc.iceConnectionState = 'disconnected'
      mockPc.oniceconnectionstatechange?.()
      expect(mockPc.restartIce).not.toHaveBeenCalled()

      // Advance past 4s debounce
      vi.advanceTimersByTime(4001)
      expect(mockPc.restartIce).toHaveBeenCalledTimes(1)

      // Advance past 5s restart cooldown
      vi.advanceTimersByTime(5001)

      // Case 3: Hard failure ('failed') triggers immediate restart
      mockPc.restartIce.mockClear()
      mockPc.iceConnectionState = 'failed'
      mockPc.oniceconnectionstatechange?.()
      expect(mockPc.restartIce).toHaveBeenCalledTimes(1)

      bridge.destroy()
    } finally {
      vi.useRealTimers()
      cleanup()
    }
  })

  it('optimizes video sender bitrate and degradation preference', () => {
    const { mockPc, mockSender, cleanup } = setupMockWebRtc({
      getSenders: vi.fn().mockReturnValue([]),
    })

    try {
      const bridge = new WebRtcPeerBridge({
        sessionId: 'session-video-opt',
        currentUserId: 'coach-1',
        isCoach: true,
      })
      bridge.init()

      const mockVideoStream = {
        getTracks: vi.fn().mockReturnValue([{ kind: 'video', id: 'vid-1' }]),
      }
      bridge.attachLocalStream(mockVideoStream as unknown as MediaStream)

      expect(mockPc.addTrack).toHaveBeenCalled()
      expect(mockSender.setParameters).toHaveBeenCalledWith(
        expect.objectContaining({
          encodings: [
            expect.objectContaining({
              maxBitrate: 2000000,
            }),
          ],
          degradationPreference: 'maintain-framerate',
        })
      )

      bridge.destroy()
    } finally {
      cleanup()
    }
  })
})
