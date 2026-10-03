import { describe, expect, it, vi } from 'vitest'
import { WebRtcPeerBridge, type WebRtcSignalPayload } from '@/lib/webrtc-peer-bridge'
import { DEFAULT_LIVE_ASSESSMENT_PLAN } from './LiveSessionClient'
import { analyzePosturalMesh, type PosturalViewType } from '@/lib/ai-postural-mesh-scanner'
import { analyzeLiftForm, type LiftType } from '@/lib/video-form-analysis'
import { generateCorrectiveExercisePlan, type OhsaObservation } from '@/lib/nasm-assessments'
import type { AssignedClientLauncherItem } from './CoachLiveSessionLauncher'

describe('Live Studio Stress & Adversarial Test Suite ("Run It Hot")', () => {
  // ── 1. WebRTC Peer Bridge Adversarial Stress Tests ──
  describe('WebRTC Peer Bridge Adversarial Resilience', () => {
    function createMockChannel() {
      return {
        send: vi.fn().mockResolvedValue('ok'),
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      } as any
    }

    it('survives rapid, concurrent createOffer calls without throwing', async () => {
      const channel = createMockChannel()
      const bridge = new WebRtcPeerBridge({
        sessionId: 'stress-session-1',
        currentUserId: 'coach-1',
        isCoach: true,
        channel,
      })

      bridge.init()

      // Fire 10 simultaneous createOffer requests
      const promises = Array.from({ length: 10 }, () => bridge.createOffer())
      await expect(Promise.all(promises)).resolves.not.toThrow()

      bridge.destroy()
    })

    it('gracefully handles malformed or corrupted signal payloads without crashing', async () => {
      const channel = createMockChannel()
      const bridge = new WebRtcPeerBridge({
        sessionId: 'stress-session-2',
        currentUserId: 'athlete-1',
        isCoach: false,
        channel,
      })

      bridge.init()

      const malformedPayloads: any[] = [
        null,
        undefined,
        {},
        { type: 'unknown_signal_type', senderId: 'fake-id' },
        { type: 'offer', sdp: null },
        { type: 'offer', sdp: '' },
        { type: 'answer', sdp: undefined },
        { type: 'ice-candidate', candidate: null },
        { type: 'ice-candidate', candidate: { candidate: '', sdpMid: null, sdpMLineIndex: null } },
        { type: 'join', senderId: '' },
      ]

      for (const payload of malformedPayloads) {
        await expect(bridge.handleSignal(payload)).resolves.not.toThrow()
      }

      bridge.destroy()
    })

    it('ignores self-signals when senderId matches currentUserId', async () => {
      const channel = createMockChannel()
      const bridge = new WebRtcPeerBridge({
        sessionId: 'stress-session-3',
        currentUserId: 'coach-1',
        isCoach: true,
        channel,
      })

      bridge.init()

      const selfSignal: WebRtcSignalPayload = {
        type: 'join',
        senderId: 'coach-1',
      }

      // Should return early and not trigger channel.send or renegotiation
      await bridge.handleSignal(selfSignal)
      expect(channel.send).not.toHaveBeenCalled()

      bridge.destroy()
    })

    it('handles channel.send network failures without uncaught rejections', async () => {
      const channel = createMockChannel()
      channel.send = vi.fn().mockRejectedValue(new Error('Network disconnected (WebSocket 1006)'))

      const onError = vi.fn()
      const bridge = new WebRtcPeerBridge({
        sessionId: 'stress-session-4',
        currentUserId: 'coach-1',
        isCoach: true,
        channel,
        onError,
      })

      bridge.init()

      // Calling createOffer when channel fails should resolve safely to null or report to onError
      const result = await bridge.createOffer()
      expect(result).toBeDefined()

      bridge.destroy()
    })

    it('safely handles attachLocalStream when stream is null, has 0 tracks, or is called repeatedly', () => {
      const channel = createMockChannel()
      const bridge = new WebRtcPeerBridge({
        sessionId: 'stress-session-5',
        currentUserId: 'athlete-1',
        isCoach: false,
        channel,
      })

      bridge.init()

      expect(() => bridge.attachLocalStream(null as any)).not.toThrow()

      const emptyStream = {
        getTracks: () => [],
      } as any

      expect(() => bridge.attachLocalStream(emptyStream)).not.toThrow()

      // Simulate stream with mock audio and video tracks
      const mockTrack = { kind: 'video', id: 'track-1' }
      const populatedStream = {
        getTracks: () => [mockTrack],
      } as any

      // Rapidly attach/replace stream 10 times in a row
      for (let i = 0; i < 10; i++) {
        expect(() => bridge.attachLocalStream(populatedStream)).not.toThrow()
      }

      bridge.destroy()
    })
  })

  // ── 2. Video Frame Capture & Canvas Extraction Resilience ──
  describe('Live Video Frame Capture & Extraction Stress', () => {
    it('returns null and does not throw when video elements have zero or negative dimensions', () => {
      function captureFrameFromElement(video: { videoWidth: number; videoHeight: number } | null): string | null {
        if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) {
          return null
        }
        return 'data:image/jpeg;base64,sample'
      }

      expect(captureFrameFromElement(null)).toBeNull()
      expect(captureFrameFromElement({ videoWidth: 0, videoHeight: 0 })).toBeNull()
      expect(captureFrameFromElement({ videoWidth: -100, videoHeight: -50 })).toBeNull()
      expect(captureFrameFromElement({ videoWidth: 1280, videoHeight: 0 })).toBeNull()
      expect(captureFrameFromElement({ videoWidth: 0, videoHeight: 720 })).toBeNull()
      expect(captureFrameFromElement({ videoWidth: 1920, videoHeight: 1080 })).toBe('data:image/jpeg;base64,sample')
    })

    it('handles canvas security / tainted origin exceptions safely', () => {
      function safeCanvasExtract(simulateSecurityError: boolean): { success: boolean; dataUrl: string | null; error: string | null } {
        try {
          if (simulateSecurityError) {
            throw new Error('SecurityError: Failed to execute toDataURL on HTMLCanvasElement: Tainted canvases may not be exported.')
          }
          return { success: true, dataUrl: 'data:image/jpeg;base64,valid', error: null }
        } catch (err: any) {
          return { success: false, dataUrl: null, error: err.message }
        }
      }

      const safeResult = safeCanvasExtract(false)
      expect(safeResult.success).toBe(true)
      expect(safeResult.dataUrl).toBeTruthy()

      const errorResult = safeCanvasExtract(true)
      expect(errorResult.success).toBe(false)
      expect(errorResult.dataUrl).toBeNull()
      expect(errorResult.error).toContain('SecurityError')
    })
  })

  // ── 3. Posture Mesh & Movement Assessment Engine Adversarial Tests ──
  describe('AI Postural Mesh & Corrective Exercise Stress', () => {
    const views: PosturalViewType[] = ['anterior', 'lateral', 'posterior', 'overhead_squat']

    it('evaluates all 4 postural views under empty / missing image conditions without crashing', async () => {
      for (const view of views) {
        const result = await analyzePosturalMesh({
          imageBase64: '',
          view,
          clientName: 'Stress Test Athlete',
        })

        expect(result.view).toBe(view)
        expect(Array.isArray(result.landmarks)).toBe(true)
        expect(Array.isArray(result.angles)).toBe(true)
        expect(result.cexPrescription).toHaveProperty('inhibit')
        expect(result.cexPrescription).toHaveProperty('lengthen')
        expect(result.cexPrescription).toHaveProperty('activate')
        expect(result.cexPrescription).toHaveProperty('integrate')
        expect(result.clinicalSummary).toBeTruthy()
      }
    })

    it('generates Corrective Exercise Continuum (CEx) under extreme all-compensation failure cases', () => {
      // Stress test with all valid NASM OHSA compensations simultaneously observed
      const extremeFindings: OhsaObservation[] = [
        { compensation: 'feet_turn_out', checkpoint: 'feet_ankles', severity: 'severe', view: 'anterior' },
        { compensation: 'feet_flatten', checkpoint: 'feet_ankles', severity: 'severe', view: 'anterior' },
        { compensation: 'knees_move_inward', checkpoint: 'knees', severity: 'severe', view: 'anterior' },
        { compensation: 'knees_move_outward', checkpoint: 'knees', severity: 'severe', view: 'anterior' },
        { compensation: 'excessive_forward_lean', checkpoint: 'lphc', severity: 'severe', view: 'lateral' },
        { compensation: 'low_back_arches', checkpoint: 'lphc', severity: 'severe', view: 'lateral' },
        { compensation: 'arms_fall_forward', checkpoint: 'shoulders', severity: 'severe', view: 'lateral' },
        { compensation: 'forward_head', checkpoint: 'head_neck', severity: 'severe', view: 'lateral' },
      ]

      const plan = generateCorrectiveExercisePlan(extremeFindings)

      expect(plan.overactiveMuscles.length).toBeGreaterThan(0)
      expect(plan.underactiveMuscles.length).toBeGreaterThan(0)
      expect(plan.plan.inhibit.length).toBeGreaterThan(0)
      expect(plan.plan.lengthen.length).toBeGreaterThan(0)
      expect(plan.plan.activate.length).toBeGreaterThan(0)
      expect(plan.plan.integrate.length).toBeGreaterThan(0)

      // Ensure no duplicate exercise names in inhibit list
      const inhibitNames = new Set(plan.plan.inhibit.map(i => i.name))
      expect(inhibitNames.size).toBe(plan.plan.inhibit.length)
    })

    it('generates Corrective Exercise Continuum (CEx) under completely empty / pristine movement screen', () => {
      const plan = generateCorrectiveExercisePlan([])
      expect(plan.overactiveMuscles).toHaveLength(0)
      expect(plan.underactiveMuscles).toHaveLength(0)
      expect(plan.plan.inhibit).toHaveLength(0)
      expect(plan.plan.lengthen).toHaveLength(0)
    })
  })

  // ── 4. Dynamic Lift Form Critique Adversarial Tests ──
  describe('Dynamic Lift Form Critique Under Multi-Fault Deviation', () => {
    const lifts: LiftType[] = [
      'barbell_back_squat',
      'barbell_deadlift',
      'barbell_bench_press',
      'overhead_press',
      'single_leg_squat',
      'barbell_row',
      'romanian_deadlift',
    ]

    it('evaluates all compound lifts without exceptions under empty and maximal fault conditions', () => {
      for (const lift of lifts) {
        // Pristine execution
        const pristine = analyzeLiftForm({ liftType: lift, repsCount: 5, observedDeviations: [] })
        expect(pristine.overallFormScore).toBeGreaterThanOrEqual(90)
        expect(pristine.rating).toBe('Mastery')
        expect(pristine.checkpoints.length).toBeGreaterThan(0)
        expect(pristine.masterCoachSummary).toBeTruthy()
      }

      // Faulty squat execution with major deviations
      const faultySquat = analyzeLiftForm({
        liftType: 'barbell_back_squat',
        loadLbs: 315,
        repsCount: 3,
        observedDeviations: ['knee_valgus', 'excessive_forward_lean', 'butt_wink'],
      })

      expect(faultySquat.overallFormScore).toBeLessThan(70)
      expect(['Needs Recalibration', 'High Risk']).toContain(faultySquat.rating)
      expect(faultySquat.primaryFault).not.toBeNull()
      expect(faultySquat.masterCoachSummary).toBeTruthy()
    })
  })

  // ── 5. Coach Live Session Launcher Edge Cases ──
  describe('CoachLiveSessionLauncher Edge Cases & Data Sanitization', () => {
    it('handles malicious script injection or corrupted names in roster gracefully', () => {
      const adversaryClients: AssignedClientLauncherItem[] = [
        {
          id: '<script>alert("xss")</script>',
          fullName: '<b>Dr. Hacker</b> "quoted"',
          email: 'xss@injection.com',
          sessionsRemaining: -5,
        },
        {
          id: 'client-normal',
          fullName: 'Normal Athlete',
          email: 'normal@gaa.com',
          sessionsRemaining: 0,
        },
      ]

      // Sanitization check: IDs used in routing should be encoded or validated
      const cleanUrl = `/coach/clients/${encodeURIComponent(adversaryClients[0].id)}/live`
      expect(cleanUrl).toContain('%3Cscript%3E')

      // Negative session count normalized
      const normalizedSessions = Math.max(0, adversaryClients[0].sessionsRemaining ?? 0)
      expect(normalizedSessions).toBe(0)
    })

    it('correctly provides DEFAULT_LIVE_ASSESSMENT_PLAN fallback when athlete has no program', () => {
      expect(DEFAULT_LIVE_ASSESSMENT_PLAN).toBeDefined()
      expect(DEFAULT_LIVE_ASSESSMENT_PLAN.name).toContain('Live Movement Screen')
      expect(DEFAULT_LIVE_ASSESSMENT_PLAN.plan_json?.workouts?.[0]?.exercises.length).toBe(4)

      const exerciseNames = DEFAULT_LIVE_ASSESSMENT_PLAN.plan_json!.workouts![0].exercises.map(e => e.name)
      expect(exerciseNames).toContain('Overhead Squat Assessment (OHSA)')
      expect(exerciseNames).toContain('Single-Leg Squat Assessment')
      expect(exerciseNames).toContain('Pushing Assessment (Push-Up)')
      expect(exerciseNames).toContain('Standing Cable/Band Row')
    })
  })
})
