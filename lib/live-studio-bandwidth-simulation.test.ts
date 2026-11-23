import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BANDWIDTH_PROFILES,
  DISCONNECT_FAILSAFE_GRACE_MS,
  computeMultiPeerSenderBudget,
  enhanceSdpForResilientCoaching,
  evaluateConnectionBannerState,
  evaluateNetworkQuality,
  resolveAdaptiveTierWithHysteresis,
} from './live-bandwidth-profiles'
import { WebRtcPeerBridge } from './webrtc-peer-bridge'
import { WebRtcMultiPeerBridge } from './webrtc-multi-peer-bridge'
import {
  REAL_WORLD_NETWORK_PROFILES,
  SimulatedRTCPeerConnection,
  SimulatedSignalingBus,
  installSimulatedWebRtcEnvironment,
} from './live-studio-network-simulator'

describe('Forge Athletic Live Studio — Comprehensive Multi-Bandwidth Client Simulation Suite', () => {
  let env: ReturnType<typeof installSimulatedWebRtcEnvironment>

  beforeEach(() => {
    vi.useFakeTimers()
    env = installSimulatedWebRtcEnvironment()
  })

  afterEach(() => {
    env.cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  function createPair(options?: {
    coachIceServers?: RTCIceServer[]
    athleteIceServers?: RTCIceServer[]
  }) {
    const bus = new SimulatedSignalingBus()
    const coachRef: { current: WebRtcPeerBridge | null } = { current: null }
    const athleteRef: { current: WebRtcPeerBridge | null } = { current: null }

    const coachSnapshots: string[] = []
    const athleteSnapshots: string[] = []
    const coachQualityEvents: Array<{ quality: string; tier: string }> = []
    const athleteQualityEvents: Array<{ quality: string; tier: string }> = []

    const coachChannel = bus.createChannelFor('coach-gordon', payload => coachRef.current?.handleSignal(payload))
    const athleteChannel = bus.createChannelFor('athlete-1', payload => athleteRef.current?.handleSignal(payload))

    const coachBridge = new WebRtcPeerBridge({
      sessionId: 'live-athlete-1',
      currentUserId: 'coach-gordon',
      isCoach: true,
      channel: coachChannel,
      iceServers: options?.coachIceServers,
      onFormSnapshot: url => coachSnapshots.push(url),
      onNetworkQualityChange: (quality, tier) => coachQualityEvents.push({ quality, tier }),
    })
    coachRef.current = coachBridge

    const athleteBridge = new WebRtcPeerBridge({
      sessionId: 'live-athlete-1',
      currentUserId: 'athlete-1',
      isCoach: false,
      channel: athleteChannel,
      iceServers: options?.athleteIceServers,
      onFormSnapshot: url => athleteSnapshots.push(url),
      onNetworkQualityChange: (quality, tier) => athleteQualityEvents.push({ quality, tier }),
    })
    athleteRef.current = athleteBridge

    const coachPc = coachBridge.init() as unknown as SimulatedRTCPeerConnection
    const athletePc = athleteBridge.init() as unknown as SimulatedRTCPeerConnection

    return {
      bus,
      coachBridge,
      athleteBridge,
      coachPc,
      athletePc,
      coachSnapshots,
      athleteSnapshots,
      coachQualityEvents,
      athleteQualityEvents,
    }
  }

  it('Scenario 1 (Fiber / Studio Wi-Fi): sustains full Studio HD (2.5 Mbps, 30fps) with DSCP high-priority audio & Opus FEC', async () => {
    const { coachBridge, athleteBridge, coachPc, athletePc } = createPair()
    coachPc.setNetworkProfile(REAL_WORLD_NETWORK_PROFILES.fiber_studio)
    athletePc.setNetworkProfile(REAL_WORLD_NETWORK_PROFILES.fiber_studio)

    await athleteBridge.announcePresence()
    await coachBridge.sampleNetworkHealth()
    await athleteBridge.sampleNetworkHealth()

    expect(coachBridge.getEffectiveTier()).toBe('hd')
    expect(athleteBridge.getEffectiveTier()).toBe('hd')
    expect(coachBridge.getNetworkQuality()).toBe('excellent')

    // Verify Opus FEC & mono voice resilience injected into negotiated SDP
    expect(coachPc.localDescription?.sdp).toContain('useinbandfec=1')
    expect(coachPc.localDescription?.sdp).toContain('stereo=0')
    expect(athletePc.localDescription?.sdp).toContain('useinbandfec=1')

    // Verify Audio sender gets high networkPriority while Video gets medium/low
    coachBridge.applyBandwidthTier('hd')
    expect(coachPc.getAudioSender().params.encodings[0].networkPriority).toBe('high')
    expect(coachPc.getVideoSender().params.encodings[0].networkPriority).toBe('medium')

    coachBridge.destroy()
    athleteBridge.destroy()
  })

  it('Scenario 2 (Congested Apartment / Gym Wi-Fi ~500 kbps up): smoothly steps down to SD without freezing or flapping', async () => {
    const { coachBridge, athleteBridge, coachPc, athletePc } = createPair()
    coachPc.setNetworkProfile(REAL_WORLD_NETWORK_PROFILES.congested_gym_wifi)
    athletePc.setNetworkProfile(REAL_WORLD_NETWORK_PROFILES.congested_gym_wifi)

    await coachBridge.sampleNetworkHealth()
    await coachBridge.sampleNetworkHealth()

    expect(coachBridge.getNetworkQuality()).toBe('good')
    expect(coachBridge.getEffectiveTier()).toBe('sd')
    // Measured outgoing bitrate (~500 kbps) safely bounds video sender below pipe ceiling
    expect(coachPc.getVideoSender().params.encodings[0].maxBitrate).toBeLessThanOrEqual(450_000)
    expect(coachPc.getAudioSender().params.encodings[0].networkPriority).toBe('high')

    coachBridge.destroy()
    athleteBridge.destroy()
  })

  it('Scenario 3 (Poor Hotel Wi-Fi / Weak 3G ~220 kbps up): adapts to Low Data (140 kbps, 12fps) + form snapshots', async () => {
    const { coachBridge, athleteBridge, coachPc, athletePc, coachSnapshots } = createPair()
    coachPc.setNetworkProfile(REAL_WORLD_NETWORK_PROFILES.hotel_wifi_weak_3g)
    athletePc.setNetworkProfile(REAL_WORLD_NETWORK_PROFILES.hotel_wifi_weak_3g)

    await athleteBridge.sampleNetworkHealth()
    expect(athleteBridge.getNetworkQuality()).toBe('constrained')
    expect(athleteBridge.getEffectiveTier()).toBe('low_data')
    expect(athletePc.getVideoSender().params.encodings[0].maxBitrate).toBeLessThanOrEqual(140_000)
    expect(athletePc.getVideoSender().params.encodings[0].maxFramerate).toBe(12)
    expect(athletePc.getVideoSender().params.encodings[0].scaleResolutionDownBy).toBe(3)

    // Form snapshots still deliver over signaling channel even when video is throttled
    athleteBridge.sendFormSnapshot('data:image/jpeg;base64,hotel3gframe')
    expect(coachSnapshots).toContain('data:image/jpeg;base64,hotel3gframe')

    coachBridge.destroy()
    athleteBridge.destroy()
  })

  it('Scenario 4 (Rural 2G / Basement Gym ~60 kbps, 740ms RTT, 22% loss): auto-engages Audio-First (~36 kbps + Opus DTX/FEC) without red NASM panic', async () => {
    const { coachBridge, athleteBridge, athletePc } = createPair()
    athletePc.setNetworkProfile(REAL_WORLD_NETWORK_PROFILES.rural_2g_basement)

    await athleteBridge.sampleNetworkHealth()
    expect(athleteBridge.getEffectiveTier()).toBe('low_data')

    await athleteBridge.sampleNetworkHealth()
    expect(athleteBridge.getNetworkQuality()).toBe('critical')
    expect(athleteBridge.getEffectiveTier()).toBe('audio_first')

    // Video RTP paused, audio stays active with high networkPriority & low bitrate
    expect(athletePc.getVideoSender().params.encodings[0].active).toBe(false)
    expect(athletePc.getAudioSender().params.encodings[0].active).toBe(true)
    expect(athletePc.getAudioSender().params.encodings[0].maxBitrate).toBe(BANDWIDTH_PROFILES.audio_first.maxAudioBitrate)
    expect(athletePc.getAudioSender().params.encodings[0].networkPriority).toBe('high')

    // Opus DTX + FEC enabled on Audio-First SDP
    const audioFirstSdp = enhanceSdpForResilientCoaching(
      'm=audio 9 UDP/TLS/RTP/SAVPF 111\r\na=rtpmap:111 opus/48000/2\r\na=fmtp:111 minptime=10',
      'audio_first'
    )
    expect(audioFirstSdp).toContain('useinbandfec=1')
    expect(audioFirstSdp).toContain('usedtx=1')
    expect(audioFirstSdp).toContain(`maxaveragebitrate=${BANDWIDTH_PROFILES.audio_first.maxAudioBitrate}`)

    // Banner remains calm `low_bandwidth_active` when signaling heartbeat is alive
    expect(
      evaluateConnectionBannerState({
        peerConnectionState: 'disconnected',
        disconnectedDurationMs: DISCONNECT_FAILSAFE_GRACE_MS + 2000,
        effectiveTier: 'audio_first',
        networkQuality: 'critical',
        hasRecentSignalingHeartbeat: true,
      })
    ).toBe('low_bandwidth_active')

    coachBridge.destroy()
    athleteBridge.destroy()
  })

  it('Scenario 5 (Asymmetric Link: Fiber Coach vs. 2G/3G Athlete): Athlete pressure signal caps Coach outbound video automatically', async () => {
    const { coachBridge, athleteBridge, coachPc, athletePc } = createPair()
    // Coach has Gigabit Fiber; Athlete is on terrible Hotel Wi-Fi / 3G
    coachPc.setNetworkProfile(REAL_WORLD_NETWORK_PROFILES.fiber_studio)
    athletePc.setNetworkProfile(REAL_WORLD_NETWORK_PROFILES.hotel_wifi_weak_3g)

    await coachBridge.sampleNetworkHealth()
    expect(coachBridge.getEffectiveTier()).toBe('hd')

    // Athlete samples constrained inbound quality -> automatically transmits `bandwidth-ceiling` to Coach
    await athleteBridge.sampleNetworkHealth()
    expect(coachBridge.getRemoteBandwidthCeiling()).toBe('low_data')
    expect(coachBridge.getEffectiveTier()).toBe('low_data')
    expect(coachPc.getVideoSender().params.encodings[0].maxBitrate).toBeLessThanOrEqual(140_000)

    // Athlete recovers to Fiber for 3 clean samples -> ceiling lifts and Coach steps back up smoothly
    athletePc.setNetworkProfile(REAL_WORLD_NETWORK_PROFILES.fiber_studio)
    await athleteBridge.sampleNetworkHealth()
    await athleteBridge.sampleNetworkHealth()
    await athleteBridge.sampleNetworkHealth()
    expect(coachBridge.getRemoteBandwidthCeiling()).toBeNull()

    coachBridge.destroy()
    athleteBridge.destroy()
  })

  it('Scenario 6 (Frozen Video Stream Masked by Fast WebSocket Ping): detects media RTT + freezeCount and steps down immediately', async () => {
    const { coachBridge, coachPc } = createPair()
    // Simulate fast 35ms WebSocket pong while actual WebRTC UDP media is 420ms RTT & freezing at 2fps
    await coachBridge.handleSignal({
      type: 'pong',
      senderId: 'athlete-1',
      timestamp: Date.now() - 35,
    })
    coachPc.setNetworkProfile(REAL_WORLD_NETWORK_PROFILES.frozen_video_fast_ws)

    const sample = await coachBridge.sampleNetworkHealth()
    // Must prefer WebRTC media RTT (420ms) over fast 35ms WebSocket ping!
    expect(sample?.rttMs).toBe(420)
    expect(sample?.videoFreezeCountDelta).toBe(2)
    expect(coachBridge.getNetworkQuality()).toBe('constrained')
    expect(coachBridge.getEffectiveTier()).toBe('low_data')

    coachBridge.destroy()
  })

  it('Scenario 7 (Jittery / Flapping Cellular Connection): anti-flapping hysteresis prevents HD <-> Low-Data thrashing', async () => {
    const { athleteBridge, athletePc } = createPair()

    // Drop to low_data on poor hotel Wi-Fi
    athletePc.setNetworkProfile(REAL_WORLD_NETWORK_PROFILES.hotel_wifi_weak_3g)
    await athleteBridge.sampleNetworkHealth()
    expect(athleteBridge.getEffectiveTier()).toBe('low_data')

    // Single brief spike of clean fiber should NOT immediately jump back to HD!
    athletePc.setNetworkProfile(REAL_WORLD_NETWORK_PROFILES.fiber_studio)
    await athleteBridge.sampleNetworkHealth()
    expect(athleteBridge.getEffectiveTier()).toBe('low_data')
    await athleteBridge.sampleNetworkHealth()
    expect(athleteBridge.getEffectiveTier()).toBe('low_data')

    // 3rd consecutive clean sample climbs ONE tier at a time (low_data -> sd, never abrupt jump to hd)
    await athleteBridge.sampleNetworkHealth()
    expect(athleteBridge.getEffectiveTier()).toBe('sd')

    // Verify pure hysteresis progression from audio_first -> low_data -> sd -> hd
    expect(
      resolveAdaptiveTierWithHysteresis({
        mode: 'auto',
        currentTier: 'audio_first',
        quality: 'excellent',
        consecutiveDegradedSamples: 0,
        consecutiveHealthySamples: 3,
      })
    ).toBe('low_data')

    athleteBridge.destroy()
  })

  it('Scenario 8 (Cellular Wi-Fi -> 5G Handoff & Polite Athlete ICE Restart Recovery): self-heals via bidirectional ice-restart-request', async () => {
    const { bus, coachBridge, athleteBridge, coachPc, athletePc } = createPair()
    coachPc.setNetworkProfile(REAL_WORLD_NETWORK_PROFILES.home_wifi_good_lte)
    athletePc.setNetworkProfile(REAL_WORLD_NETWORK_PROFILES.home_wifi_good_lte)

    await athleteBridge.announcePresence()
    // Let initial offer/answer handshake settle before simulating mid-session handoff
    for (let i = 0; i < 6; i += 1) {
      await Promise.resolve()
    }
    const initialCoachOffers = coachPc.createOfferCalls.length

    // Athlete's phone switches from Wi-Fi to 5G -> ICE transitions to failed
    athletePc.emitIceState('failed', 'disconnected')
    for (let i = 0; i < 6; i += 1) {
      await Promise.resolve()
    }

    // Athlete (polite peer) MUST send `ice-restart-request` to Coach, and Coach MUST send `{ iceRestart: true }` offer!
    expect(bus.sentSignals.some(s => s.type === 'ice-restart-request' && s.senderId === 'athlete-1')).toBe(true)
    expect(coachPc.createOfferCalls.length).toBeGreaterThan(initialCoachOffers)
    expect(coachPc.createOfferCalls[coachPc.createOfferCalls.length - 1]).toEqual({ iceRestart: true })

    // ICE reconnects -> attempt counter resets cleanly to 0
    athletePc.emitIceState('connected', 'connected')
    expect(athleteBridge.getIceRestartAttempts()).toBe(0)

    coachBridge.destroy()
    athleteBridge.destroy()
  })

  it('Scenario 9 (Repeated Unstable Drops): steps down bandwidth during exponential backoff to protect voice coaching', async () => {
    const { coachBridge, coachPc } = createPair()
    expect(coachBridge.getEffectiveTier()).toBe('hd')

    // Attempt 1
    await coachBridge.restartIce()
    expect(coachBridge.getIceRestartAttempts()).toBe(1)

    // Advance past attempt 1 backoff cooldown -> Attempt 2 steps down to low_data
    vi.advanceTimersByTime(3000)
    await coachBridge.restartIce()
    expect(coachBridge.getIceRestartAttempts()).toBe(2)
    expect(coachBridge.getEffectiveTier()).toBe('low_data')

    // Advance past attempt 2 backoff cooldown -> Attempt 3 steps down to audio_first
    vi.advanceTimersByTime(5000)
    await coachBridge.restartIce()
    expect(coachBridge.getIceRestartAttempts()).toBe(3)
    expect(coachBridge.getEffectiveTier()).toBe('audio_first')

    coachPc.emitIceState('connected', 'connected')
    expect(coachBridge.getIceRestartAttempts()).toBe(0)
    coachBridge.destroy()
  })

  it('Scenario 10 (Multi-Peer Team Studio with 4 Mixed-Bandwidth Athletes): divides Coach upload budget, prioritizes Spotlight, isolates 2G athlete', async () => {
    const bus = new SimulatedSignalingBus()
    const coachMultiRef: { current: WebRtcMultiPeerBridge | null } = { current: null }
    const coachChannel = bus.createChannelFor('coach-gordon', payload => coachMultiRef.current?.handleSignal(payload))

    const coachMulti = new WebRtcMultiPeerBridge({
      sessionId: 'team-exec-cohort',
      currentUserId: 'coach-gordon',
      currentUserName: 'Coach Gordon',
      isCoach: true,
      channel: coachChannel,
    })
    coachMultiRef.current = coachMulti
    coachMulti.init()

    // Connect 4 athletes with wildly different network conditions
    coachMulti.getOrCreatePeer('athlete-fiber', 'Alex (Fiber)', 'athlete')
    coachMulti.getOrCreatePeer('athlete-lte', 'Jordan (LTE)', 'athlete')
    coachMulti.getOrCreatePeer('athlete-3g', 'Taylor (3G Hotel)', 'athlete')
    coachMulti.getOrCreatePeer('athlete-2g', 'Morgan (2G Basement)', 'athlete')

    // Assign realistic network profiles per peer PC (Coach on 2.0 Mbps residential upload!)
    const [pcFiber, pcLte, pc3g, pc2g] = env.createdPcs
    pcFiber.setNetworkProfile({ ...REAL_WORLD_NETWORK_PROFILES.fiber_studio, uplinkBps: 2_000_000 })
    pcLte.setNetworkProfile({ ...REAL_WORLD_NETWORK_PROFILES.home_wifi_good_lte, uplinkBps: 2_000_000 })
    pc3g.setNetworkProfile(REAL_WORLD_NETWORK_PROFILES.hotel_wifi_weak_3g)
    pc2g.setNetworkProfile(REAL_WORLD_NETWORK_PROFILES.rural_2g_basement)

    // Spotlight Alex (Fiber) so they receive higher video priority
    coachMulti.broadcastSpotlight('athlete-fiber')

    // Run 2 health samples so Morgan (2G) drops to audio_first while Alex/Jordan keep smooth video
    await coachMulti.sampleNetworkHealth()
    await coachMulti.sampleNetworkHealth()

    const summary = coachMulti.getPeerHealthSummary()
    const fiberHealth = summary.find(p => p.peerId === 'athlete-fiber')!
    const lteHealth = summary.find(p => p.peerId === 'athlete-lte')!
    const weak3gHealth = summary.find(p => p.peerId === 'athlete-3g')!
    const edge2gHealth = summary.find(p => p.peerId === 'athlete-2g')!

    // Spotlighted Fiber athlete gets MORE bitrate than non-spotlighted LTE athlete, and NEVER blasts 2.5 Mbps per peer!
    expect(fiberHealth.videoEnabled).toBe(true)
    expect(fiberHealth.allocatedVideoBitrate).toBeGreaterThan(lteHealth.allocatedVideoBitrate)
    expect(fiberHealth.allocatedVideoBitrate).toBeLessThan(1_000_000)

    // Total aggregate video bitrate across all 4 peers stays safely within Coach's 2 Mbps upload!
    const totalActiveVideoBps = summary
      .filter(p => p.videoEnabled)
      .reduce((sum, p) => sum + p.allocatedVideoBitrate, 0)
    expect(totalActiveVideoBps).toBeLessThanOrEqual(2_000_000)

    // Weak 3G athlete is throttled to Low Data; 2G athlete drops cleanly to Audio-First
    expect(weak3gHealth.effectiveTier).toBe('low_data')
    expect(edge2gHealth.effectiveTier).toBe('audio_first')
    expect(edge2gHealth.videoEnabled).toBe(false)

    // Every single peer keeps audio networkPriority = 'high'
    for (const pc of [pcFiber, pcLte, pc3g, pc2g]) {
      expect(pc.getAudioSender().params.encodings[0].networkPriority).toBe('high')
    }

    // Asymmetric ceiling from an individual squad athlete caps ONLY that athlete's stream
    await coachMulti.handleSignal({
      type: 'bandwidth-ceiling',
      senderId: 'athlete-lte',
      data: { maxTier: 'low_data' },
    })
    const updatedSummary = coachMulti.getPeerHealthSummary()
    expect(updatedSummary.find(p => p.peerId === 'athlete-lte')?.effectiveTier).toBe('low_data')
    expect(updatedSummary.find(p => p.peerId === 'athlete-fiber')?.videoEnabled).toBe(true)

    coachMulti.destroy()
  })

  it('Scenario 11 (Multi-Peer Upload Budget Math): drops cleanly to Audio-First if total squad upload cannot support video + voice', () => {
    // 8 athletes on a 400 kbps upload pipe -> cannot sustain 8 video streams without starving voice -> Audio-First!
    const starved = computeMultiPeerSenderBudget({
      tier: 'hd',
      peerCount: 8,
      availableOutgoingBitrate: 400_000,
    })
    expect(starved.effectiveTier).toBe('audio_first')
    expect(starved.videoEnabled).toBe(false)

    // 4 athletes on a 3 Mbps upload pipe -> Spotlight gets more share than non-spotlight
    const spotlight = computeMultiPeerSenderBudget({
      tier: 'hd',
      peerCount: 4,
      isSpotlighted: true,
      availableOutgoingBitrate: 3_000_000,
    })
    const regular = computeMultiPeerSenderBudget({
      tier: 'hd',
      peerCount: 4,
      isSpotlighted: false,
      availableOutgoingBitrate: 3_000_000,
    })
    expect(spotlight.maxVideoBitrate).toBeGreaterThan(regular.maxVideoBitrate)
    expect(regular.effectiveTier).toBe('sd')
  })

  it('Scenario 12 (Telemetry Quality Classifier): detects outbound packet loss, severe jitter, and video freezes', () => {
    expect(evaluateNetworkQuality({ rttMs: 50, outboundPacketLossRatio: 0.2 })).toBe('critical')
    expect(evaluateNetworkQuality({ rttMs: 50, outboundPacketLossRatio: 0.08 })).toBe('constrained')
    expect(evaluateNetworkQuality({ rttMs: 50, jitterMs: 130 })).toBe('critical')
    expect(evaluateNetworkQuality({ rttMs: 50, jitterMs: 55 })).toBe('constrained')
    expect(evaluateNetworkQuality({ rttMs: 50, videoFreezeCountDelta: 1, framesPerSecond: 15 })).toBe('constrained')
    expect(evaluateNetworkQuality({ rttMs: 50, videoFreezeCountDelta: 3, framesPerSecond: 2 })).toBe('critical')
  })
})
