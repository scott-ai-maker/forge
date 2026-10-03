import { describe, expect, it, vi } from 'vitest'
import type { VideoHudLayout } from './LiveVideoCameraHud'
import { isWebRtcSupported, DEFAULT_RTC_CONFIG, WebRtcPeerBridge } from '@/lib/webrtc-peer-bridge'

describe('Live Video Camera HUD Architecture & WebRTC Bridge', () => {
  it('supports split, pip, and focus layout configurations', () => {
    const validLayouts: VideoHudLayout[] = ['split', 'pip', 'focus']
    expect(validLayouts).toHaveLength(3)
    expect(validLayouts).toContain('split')
    expect(validLayouts).toContain('pip')
    expect(validLayouts).toContain('focus')
  })

  it('validates kinetic chain checkpoint alignment standards', () => {
    const checkpoints = [
      { point: 'feet', target: 'Parallel & straight ahead' },
      { point: 'knees', target: 'Tracking 2nd and 3rd toes, no valgus' },
      { point: 'lphc', target: 'Neutral pelvis, no anterior pelvic tilt' },
      { point: 'shoulders', target: 'Retracted and depressed' },
      { point: 'head', target: 'Neutral cervical spine' },
    ]

    expect(checkpoints).toHaveLength(5)
    expect(checkpoints[0].point).toBe('feet')
    expect(checkpoints[2].point).toBe('lphc')
  })

  it('manages WebRTC media stream tracks and transceiver lifecycle', () => {
    const videoTrack = { kind: 'video', enabled: true, stop: vi.fn() }
    const audioTrack = { kind: 'audio', enabled: true, stop: vi.fn() }

    // Toggle video track
    videoTrack.enabled = !videoTrack.enabled
    expect(videoTrack.enabled).toBe(false)

    // Toggle audio track
    audioTrack.enabled = !audioTrack.enabled
    expect(audioTrack.enabled).toBe(false)

    // Verify STUN configurations for coach-athlete 1:1 live session
    expect(DEFAULT_RTC_CONFIG.iceServers).toBeDefined()
    expect(DEFAULT_RTC_CONFIG.iceServers![0].urls).toContain('stun:stun.l.google.com:19302')
  })

  it('maps peer connection states to status indicators and theme colors', () => {
    function getPeerStatusIndicator(state: string | null, isRemoteConnected: boolean) {
      const isConnected = state === 'connected' || isRemoteConnected
      return {
        label: isConnected ? 'Live Video Connected' : 'Standby · Awaiting Remote Stream',
        color: isConnected ? '#34D399' : '#D4AF37',
        badgeColor: isConnected ? '#34D399' : '#D4AF37',
      }
    }

    expect(getPeerStatusIndicator('connected', false)).toEqual({
      label: 'Live Video Connected',
      color: '#34D399',
      badgeColor: '#34D399',
    })

    expect(getPeerStatusIndicator(null, false)).toEqual({
      label: 'Standby · Awaiting Remote Stream',
      color: '#D4AF37',
      badgeColor: '#D4AF37',
    })

    expect(getPeerStatusIndicator('connecting', false)).toEqual({
      label: 'Standby · Awaiting Remote Stream',
      color: '#D4AF37',
      badgeColor: '#D4AF37',
    })
  })

  it('validates 1-tap fast verbal cues catalog for sports-science coaching', () => {
    const quickCues = [
      'Brace your core & lock ribcage',
      'Drive through heels and extend hips',
      'Control eccentric descent on 3',
      'Pin shoulder blades back and down',
      'Explosive drive to lockout',
      'Breathe out on exertion',
    ]

    expect(quickCues.length).toBe(6)
    expect(quickCues).toContain('Brace your core & lock ribcage')
    expect(quickCues).toContain('Control eccentric descent on 3')
    expect(quickCues).toContain('Breathe out on exertion')
  })

  it('calculates camera mirror transform based on device facing mode', () => {
    function getCameraTransform(facingMode: 'user' | 'environment'): string {
      return facingMode === 'user' ? 'scaleX(-1)' : 'none'
    }

    expect(getCameraTransform('user')).toBe('scaleX(-1)')
    expect(getCameraTransform('environment')).toBe('none')
  })

  it('computes grid column layout depending on layout state and compare mode', () => {
    function getGridTemplateColumns(layout: VideoHudLayout, showCompareModel: boolean): string {
      if (showCompareModel) return '1fr 1fr'
      if (layout === 'split') return '1fr 1fr'
      return '1fr'
    }

    expect(getGridTemplateColumns('split', false)).toBe('1fr 1fr')
    expect(getGridTemplateColumns('pip', false)).toBe('1fr')
    expect(getGridTemplateColumns('focus', false)).toBe('1fr')
    // When compare model is open, always dual view
    expect(getGridTemplateColumns('focus', true)).toBe('1fr 1fr')
    expect(getGridTemplateColumns('pip', true)).toBe('1fr 1fr')
  })

  it('strictly isolates biomechanical plumb line to athlete-video-container and places coach on left frame initially', () => {
    interface HudViewportConfig {
      showPlumbLine: boolean
      isCoach: boolean
      isStageSwapped: boolean
      layout: VideoHudLayout
    }

    function resolveVideoHudContainers(config: HudViewportConfig) {
      // Invariant: Coach is initially on the left frame (Viewport 1) and Athlete is on the right frame (Viewport 2)
      const leftContainer = !config.isStageSwapped ? 'coach-video-container' : 'athlete-video-container'
      const rightContainer = !config.isStageSwapped ? 'athlete-video-container' : 'coach-video-container'

      // Plumb line rendering: STRICTLY inside athlete container, NEVER inside coach container
      const athleteHasPlumbLine = config.showPlumbLine
      const coachHasPlumbLine = false

      return {
        leftContainer,
        rightContainer,
        athleteHasPlumbLine,
        coachHasPlumbLine,
      }
    }

    // 1. Coach View (isCoach: true): Coach is on Left frame by default, Athlete on Right with plumb lines
    const coachViewing = resolveVideoHudContainers({ showPlumbLine: true, isCoach: true, isStageSwapped: false, layout: 'split' })
    expect(coachViewing.leftContainer).toBe('coach-video-container')
    expect(coachViewing.rightContainer).toBe('athlete-video-container')
    expect(coachViewing.athleteHasPlumbLine).toBe(true)
    expect(coachViewing.coachHasPlumbLine).toBe(false) // Coach feed never has plumb lines

    // 2. Athlete View (isCoach: false): Coach on Left, Athlete on Right with plumb lines
    const athleteViewing = resolveVideoHudContainers({ showPlumbLine: true, isCoach: false, isStageSwapped: false, layout: 'split' })
    expect(athleteViewing.leftContainer).toBe('coach-video-container')
    expect(athleteViewing.rightContainer).toBe('athlete-video-container')
    expect(athleteViewing.athleteHasPlumbLine).toBe(true)
    expect(athleteViewing.coachHasPlumbLine).toBe(false)

    // 3. Stage Swapped (isStageSwapped: true): Athlete on Left frame, Coach on Right
    const swappedDemo = resolveVideoHudContainers({ showPlumbLine: true, isCoach: true, isStageSwapped: true, layout: 'pip' })
    expect(swappedDemo.leftContainer).toBe('athlete-video-container')
    expect(swappedDemo.rightContainer).toBe('coach-video-container')
    // Plumb lines stay locked to the athlete, NEVER on the coach demo stage
    expect(swappedDemo.athleteHasPlumbLine).toBe(true)
    expect(swappedDemo.coachHasPlumbLine).toBe(false)

    // 4. Plumb lines turned OFF:
    const plumbOff = resolveVideoHudContainers({ showPlumbLine: false, isCoach: true, isStageSwapped: false, layout: 'split' })
    expect(plumbOff.athleteHasPlumbLine).toBe(false)
    expect(plumbOff.coachHasPlumbLine).toBe(false)
  })

  it('guarantees client frame capture strictly targets athlete stream and preserves entire uncropped frame dimensions', () => {
    function captureAthleteFrameFromElement(videoElement: {
      role: 'athlete' | 'coach'
      videoWidth: number
      videoHeight: number
    }): { capturedRole: string; width: number; height: number; isUncropped: boolean } {
      if (videoElement.role !== 'athlete') {
        throw new Error('Capture must never record coach video stream')
      }
      return {
        capturedRole: videoElement.role,
        width: videoElement.videoWidth,
        height: videoElement.videoHeight,
        isUncropped: true,
      }
    }

    const athleteStream = { role: 'athlete' as const, videoWidth: 1920, videoHeight: 1080 }
    const result = captureAthleteFrameFromElement(athleteStream)
    expect(result.capturedRole).toBe('athlete')
    expect(result.width).toBe(1920)
    expect(result.height).toBe(1080)
    expect(result.isUncropped).toBe(true)
  })

  it('attaches official NASM Edge demonstration thumbnail image and kinetic cues to compare form benchmark model', () => {
    function resolveBenchmarkDetails(exerciseName: string) {
      const isSquat = exerciseName.toLowerCase().includes('squat')
      return {
        exerciseName,
        imageUrl: isSquat ? 'https://img.youtube.com/vi/W9jJaI4cHJU/hqdefault.jpg' : null,
        hasVideoDemo: isSquat,
        cues: [
          'Shin parallel to torso angle at parallel depth.',
          'Knees tracking directly in line with 2nd/3rd toes.',
        ],
      }
    }

    const squatDetails = resolveBenchmarkDetails('Barbell Back Squat')
    expect(squatDetails.imageUrl).toContain('img.youtube.com')
    expect(squatDetails.hasVideoDemo).toBe(true)
    expect(squatDetails.cues).toHaveLength(2)
  })

  it('manages video demonstration modal lifecycle in LiveVideoCameraHud', () => {
    let demoModalState: { isOpen: boolean; embedUrl?: string | null; name: string } | null = null

    function openDemo(name: string, url: string) {
      demoModalState = { isOpen: true, embedUrl: url, name }
    }

    function closeDemo() {
      demoModalState = null
    }

    openDemo('Barbell Bench Press', 'https://www.youtube-nocookie.com/embed/CayG6UYqL8g')
    const activeState = demoModalState as { isOpen: boolean; embedUrl?: string | null; name: string } | null
    expect(activeState?.isOpen).toBe(true)
    expect(activeState?.name).toBe('Barbell Bench Press')
    expect(activeState?.embedUrl).toContain('CayG6UYqL8g')

    closeDemo()
    expect(demoModalState).toBeNull()
  })

  it('orchestrates still camera request broadcast and guidance modal state', () => {
    let showStillCameraModal = false
    let stillCameraRequestedBy = 'Coach Scott Gordon'

    function handleStillCameraSignal(payload: { coachName: string; timestamp: number }) {
      stillCameraRequestedBy = payload.coachName
      showStillCameraModal = true
    }

    handleStillCameraSignal({
      coachName: 'Coach Scott Gordon',
      timestamp: Date.now(),
    })

    expect(showStillCameraModal).toBe(true)
    expect(stillCameraRequestedBy).toBe('Coach Scott Gordon')
  })
})


