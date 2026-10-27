import { describe, expect, it, vi, beforeAll, afterAll } from 'vitest'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { WebRtcMultiPeerBridge } from './webrtc-multi-peer-bridge'
import type { WebRtcSignalPayload } from './webrtc-peer-bridge'

describe('WebRtcMultiPeerBridge Team Mesh Architecture', () => {
  const originalRTCPeerConnection = globalThis.RTCPeerConnection

  beforeAll(() => {
    class MockRTCPeerConnection {
      signalingState = 'stable'
      connectionState = 'new'
      iceConnectionState = 'new'
      addTransceiver = vi.fn()
      addTrack = vi.fn()
      getSenders = vi.fn().mockReturnValue([])
      getTransceivers = vi.fn().mockReturnValue([])
      createOffer = vi.fn().mockResolvedValue({ type: 'offer', sdp: 'v=0...' })
      createAnswer = vi.fn().mockResolvedValue({ type: 'answer', sdp: 'v=0...' })
      setLocalDescription = vi.fn().mockResolvedValue(undefined)
      setRemoteDescription = vi.fn().mockResolvedValue(undefined)
      addIceCandidate = vi.fn().mockResolvedValue(undefined)
      close = vi.fn()
    }
    globalThis.RTCPeerConnection = MockRTCPeerConnection as unknown as typeof RTCPeerConnection
  })

  afterAll(() => {
    globalThis.RTCPeerConnection = originalRTCPeerConnection
  })

  function createMockChannel() {
    return {
      send: vi.fn().mockResolvedValue('ok'),
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    } as unknown as RealtimeChannel
  }

  it('initializes and detects webRTC support', () => {
    const channel = createMockChannel()
    const bridge = new WebRtcMultiPeerBridge({
      sessionId: 'team-squad-1',
      currentUserId: 'coach-1',
      currentUserName: 'Coach Gordon',
      isCoach: true,
      channel,
    })

    const supported = bridge.init()
    expect(supported).toBe(true)
    expect(bridge.getConnectedPeerCount()).toBe(0)

    bridge.destroy()
  })

  it('creates isolated peer connections for distinct teammates', () => {
    const channel = createMockChannel()
    const bridge = new WebRtcMultiPeerBridge({
      sessionId: 'team-squad-2',
      currentUserId: 'coach-1',
      currentUserName: 'Coach Gordon',
      isCoach: true,
      channel,
    })

    bridge.init()

    const peerA = bridge.getOrCreatePeer('athlete-a', 'Athlete Alpha')
    const peerB = bridge.getOrCreatePeer('athlete-b', 'Athlete Beta')

    expect(peerA).toBeDefined()
    expect(peerB).toBeDefined()
    expect(peerA?.peerId).toBe('athlete-a')
    expect(peerB?.peerId).toBe('athlete-b')
    expect(bridge.getConnectedPeerCount()).toBe(2)

    // Getting existing peer does not duplicate connection
    const peerARetrieved = bridge.getOrCreatePeer('athlete-a')
    expect(peerARetrieved).toBe(peerA)
    expect(bridge.getConnectedPeerCount()).toBe(2)

    bridge.destroy()
    expect(bridge.getConnectedPeerCount()).toBe(0)
  })

  it('filters signals targeted to other peers', async () => {
    const channel = createMockChannel()
    const bridge = new WebRtcMultiPeerBridge({
      sessionId: 'team-squad-3',
      currentUserId: 'athlete-a',
      currentUserName: 'Athlete Alpha',
      isCoach: false,
      channel,
    })

    bridge.init()

    // Signal targeted to athlete-b, should be ignored by athlete-a
    const signalForOther: WebRtcSignalPayload = {
      type: 'offer',
      senderId: 'coach-1',
      targetUserId: 'athlete-b',
    }

    await bridge.handleSignal(signalForOther)
    expect(bridge.getConnectedPeerCount()).toBe(0)

    bridge.destroy()
  })

  it('handles broadcast signals: team mute, spotlight, team cues, and circuit timer', async () => {
    const channel = createMockChannel()
    const onMuteDirective = vi.fn()
    const onSpotlightChange = vi.fn()
    const onTeamCue = vi.fn()
    const onCircuitTimerSync = vi.fn()

    const bridge = new WebRtcMultiPeerBridge({
      sessionId: 'team-squad-4',
      currentUserId: 'athlete-a',
      isCoach: false,
      channel,
      onMuteDirective,
      onSpotlightChange,
      onTeamCue,
      onCircuitTimerSync,
    })

    bridge.init()

    // 1. Mute broadcast
    await bridge.handleSignal({
      type: 'mute',
      senderId: 'coach-1',
      targetUserId: '*',
      data: { muted: true },
    })
    expect(onMuteDirective).toHaveBeenCalledWith(true)

    // 2. Spotlight broadcast
    await bridge.handleSignal({
      type: 'spotlight',
      senderId: 'coach-1',
      targetUserId: '*',
      data: 'athlete-b',
    })
    expect(onSpotlightChange).toHaveBeenCalledWith('athlete-b')
    expect(bridge.getSpotlightedUserId()).toBe('athlete-b')

    // 3. Team Cue broadcast
    await bridge.handleSignal({
      type: 'team-cue',
      senderId: 'coach-1',
      senderName: 'Coach Gordon',
      targetUserId: '*',
      data: 'Sync your cadence on this set!',
    })
    expect(onTeamCue).toHaveBeenCalledWith('Sync your cadence on this set!', 'Coach Gordon')

    // 4. Circuit Timer broadcast
    const mockTimer = { workSeconds: 45, restSeconds: 15, currentRound: 2, totalRounds: 4, phase: 'work' }
    await bridge.handleSignal({
      type: 'circuit-timer',
      senderId: 'coach-1',
      targetUserId: '*',
      data: mockTimer,
    })
    expect(onCircuitTimerSync).toHaveBeenCalledWith(mockTimer)

    bridge.destroy()
  })

  it('dispatches coach broadcast methods over channel', () => {
    const channel = createMockChannel()
    const bridge = new WebRtcMultiPeerBridge({
      sessionId: 'team-squad-5',
      currentUserId: 'coach-1',
      currentUserName: 'Coach Gordon',
      isCoach: true,
      channel,
    })

    bridge.init()

    bridge.muteAllAthletes(true)
    expect(channel.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'broadcast',
        event: 'webrtc_signal',
        payload: expect.objectContaining({
          type: 'mute',
          targetUserId: '*',
          data: { muted: true },
        }),
      })
    )

    bridge.broadcastSpotlight('athlete-3')
    expect(channel.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'broadcast',
        event: 'webrtc_signal',
        payload: expect.objectContaining({
          type: 'spotlight',
          targetUserId: '*',
          data: 'athlete-3',
        }),
      })
    )

    bridge.broadcastTeamCue('Chest up, drive through the floor!')
    expect(channel.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'broadcast',
        event: 'webrtc_signal',
        payload: expect.objectContaining({
          type: 'team-cue',
          targetUserId: '*',
          data: 'Chest up, drive through the floor!',
        }),
      })
    )

    bridge.destroy()
  })
})
