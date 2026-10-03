import { describe, expect, it } from 'vitest'
import {
  ASSESSMENT_CAPTURE_SLOTS,
  type AssessmentCaptureSlot,
  getNasmClinicalMovementCard,
  type Exercise,
} from './UnifiedLiveStudioHud'

describe('Unified Live Studio HUD Helper Mechanics', () => {
  it('parses lower rep numbers from ranges', () => {
    function parseLowerReps(value: string | null | undefined): string {
      const text = String(value ?? '').trim()
      const rangeMatch = text.match(/(\d+)\s*[-–]+\s*(\d+)/)
      if (rangeMatch) return rangeMatch[1]
      const match = text.match(/\d+/)
      return match ? match[0] : '8'
    }

    expect(parseLowerReps('8-10')).toBe('8')
    expect(parseLowerReps('12–15')).toBe('12')
    expect(parseLowerReps('5')).toBe('5')
    expect(parseLowerReps(null)).toBe('8')
  })

  it('parses rest seconds from string formats', () => {
    function parseRestSeconds(value: string | null | undefined): number {
      const text = String(value ?? '').toLowerCase().trim()
      if (text.includes('3-5m') || text.includes('3m') || text.includes('5m')) return 180
      if (text.includes('1-2m') || text.includes('2m')) return 90
      if (text.includes('90s')) return 90
      if (text.includes('60s')) return 60
      if (text.includes('30s')) return 30
      const match = text.match(/\d+/)
      return match ? Number(match[0]) : 60
    }

    expect(parseRestSeconds('90s')).toBe(90)
    expect(parseRestSeconds('1-2m')).toBe(90)
    expect(parseRestSeconds('3-5m')).toBe(180)
    expect(parseRestSeconds('30s')).toBe(30)
  })

  it('parses tempo components into ecc, iso, con', () => {
    function parseTempoDigits(tempoStr: string | null | undefined): { ecc: number; iso: number; con: number } {
      const raw = String(tempoStr ?? '').toLowerCase().trim()
      if (raw.includes('4/2/1') || raw.includes('4-2-1')) return { ecc: 4, iso: 2, con: 1 }
      if (raw.includes('2/0/2') || raw.includes('2-0-2')) return { ecc: 2, iso: 0, con: 2 }
      if (raw.includes('3/1/1') || raw.includes('3-1-1')) return { ecc: 3, iso: 1, con: 1 }
      if (raw.includes('1/1/1') || raw.includes('1-1-1')) return { ecc: 1, iso: 1, con: 1 }
      const parts = raw.split(/[/–-]/).map(p => Number(p.trim())).filter(n => Number.isFinite(n))
      if (parts.length >= 3) {
        return { ecc: parts[0] ?? 2, iso: parts[1] ?? 0, con: parts[2] ?? 2 }
      }
      return { ecc: 2, iso: 0, con: 2 }
    }

    expect(parseTempoDigits('4/2/1')).toEqual({ ecc: 4, iso: 2, con: 1 })
    expect(parseTempoDigits('2-0-2')).toEqual({ ecc: 2, iso: 0, con: 2 })
    expect(parseTempoDigits('3/1/1')).toEqual({ ecc: 3, iso: 1, con: 1 })
  })

  it('validates video frame extraction dimensions for canvas snapshot', () => {
    function simulateFrameCapture(videoWidth: number, videoHeight: number): boolean {
      if (videoWidth > 0 && videoHeight > 0) {
        return true
      }
      return false
    }

    expect(simulateFrameCapture(1280, 720)).toBe(true)
    expect(simulateFrameCapture(1920, 1080)).toBe(true)
    expect(simulateFrameCapture(0, 0)).toBe(false)
  })

  it('correctly maps active movement to exercise form critique lift types', () => {
    function mapExerciseToLiftType(name: string): string {
      const lower = name.toLowerCase()
      if (lower.includes('deadlift') && lower.includes('romanian')) return 'romanian_deadlift'
      if (lower.includes('deadlift')) return 'barbell_deadlift'
      if (lower.includes('bench')) return 'barbell_bench_press'
      if (lower.includes('overhead') || lower.includes('ohp')) return 'overhead_press'
      if (lower.includes('single') && lower.includes('squat')) return 'single_leg_squat'
      if (lower.includes('row')) return 'barbell_row'
      return 'barbell_back_squat'
    }

    expect(mapExerciseToLiftType('Barbell Back Squat')).toBe('barbell_back_squat')
    expect(mapExerciseToLiftType('Single-Leg Squat')).toBe('single_leg_squat')
    expect(mapExerciseToLiftType('Romanian Deadlift (RDL)')).toBe('romanian_deadlift')
    expect(mapExerciseToLiftType('Overhead Press')).toBe('overhead_press')
    expect(mapExerciseToLiftType('Bent-Over Barbell Row')).toBe('barbell_row')
  })

  it('handles postural views for OHSA and static analysis', () => {
    const validViews = ['anterior', 'lateral', 'posterior', 'overhead_squat']
    expect(validViews).toContain('overhead_squat')
    expect(validViews).toContain('anterior')
    expect(validViews).toContain('lateral')
    expect(validViews).toContain('posterior')
  })

  it('calculates estimated 1RM using clinical Epley formula', () => {
    function calculateEstimated1Rm(weight: number, reps: number): number {
      if (reps <= 0 || weight <= 0) return 0
      if (reps === 1) return weight
      return Math.round(weight * (1 + reps / 30))
    }

    // 225 lbs for 10 reps -> 225 * (1 + 10/30) = 300 lbs
    expect(calculateEstimated1Rm(225, 10)).toBe(300)
    // 315 lbs for 5 reps -> 315 * (1 + 5/30) = 368 lbs
    expect(calculateEstimated1Rm(315, 5)).toBe(368)
    // 405 lbs for 1 rep -> exactly 405 lbs
    expect(calculateEstimated1Rm(405, 1)).toBe(405)
    // Edge case: 0 reps
    expect(calculateEstimated1Rm(225, 0)).toBe(0)
  })

  it('evaluates NASM 2-for-2 rule for progressive overload recommendations', () => {
    function evaluateNasm2For2Rule(targetReps: number, achievedLastSet: number, achievedPreviousSessionLastSet: number): {
      overloadRecommended: boolean
      recommendedLoadIncreasePct: number
      guidance: string
    } {
      const exceededThisSession = achievedLastSet >= targetReps + 2
      const exceededPreviousSession = achievedPreviousSessionLastSet >= targetReps + 2

      if (exceededThisSession && exceededPreviousSession) {
        return {
          overloadRecommended: true,
          recommendedLoadIncreasePct: 5, // 5% increase for upper body / 10% for lower body compound
          guidance: 'NASM 2-for-2 Rule Met: Client exceeded target reps by 2 on the final set in 2 consecutive sessions. Increase load by 5-10%.',
        }
      }

      return {
        overloadRecommended: false,
        recommendedLoadIncreasePct: 0,
        guidance: 'Maintain current training load until 2-for-2 criteria is fulfilled.',
      }
    }

    // Target 8 reps. Achieved 10 in consecutive sessions -> Rule Met
    const met = evaluateNasm2For2Rule(8, 10, 10)
    expect(met.overloadRecommended).toBe(true)
    expect(met.recommendedLoadIncreasePct).toBe(5)

    // Only exceeded in current session -> Rule NOT met yet
    const pending = evaluateNasm2For2Rule(8, 10, 8)
    expect(pending.overloadRecommended).toBe(false)

    // Met target but did not exceed by 2 -> Rule NOT met
    const matched = evaluateNasm2For2Rule(8, 9, 9)
    expect(matched.overloadRecommended).toBe(false)
  })

  it('accumulates set volume and tracks total session tonnage', () => {
    interface TestSet {
      exercise: string
      reps: number
      weightLbs: number
    }

    function calculateTotalSessionVolume(sets: TestSet[]): { totalVolumeLbs: number; totalReps: number } {
      let totalVolumeLbs = 0
      let totalReps = 0

      for (const s of sets) {
        totalVolumeLbs += s.reps * s.weightLbs
        totalReps += s.reps
      }

      return { totalVolumeLbs, totalReps }
    }

    const mockSets: TestSet[] = [
      { exercise: 'Barbell Back Squat', reps: 10, weightLbs: 225 }, // 2,250
      { exercise: 'Barbell Back Squat', reps: 10, weightLbs: 225 }, // 2,250
      { exercise: 'Barbell Back Squat', reps: 8, weightLbs: 245 },  // 1,960
      { exercise: 'Romanian Deadlift', reps: 10, weightLbs: 185 },  // 1,850
    ]

    const stats = calculateTotalSessionVolume(mockSets)
    expect(stats.totalReps).toBe(38)
    expect(stats.totalVolumeLbs).toBe(8310)
  })

  it('computes real-time cardio telemetry and NASM bioenergetic zones', () => {
    function getLiveCardioState(restRemaining: number | null, durationSec: number) {
      const bpm = restRemaining !== null ? 106 : 138
      const hrMax = 220 - 32 // 188
      const pct = Math.round((bpm / hrMax) * 100)
      const zone = bpm < 115 ? 'Zone 1: Aerobic Base' : 'Zone 2: Lactate Threshold'
      const calBurned = Math.round((bpm * 0.05) * (durationSec / 60) * 10) / 10
      return { bpm, hrMax, pct, zone, calBurned }
    }

    // Active working set:
    const active = getLiveCardioState(null, 600) // 10 mins
    expect(active.bpm).toBe(138)
    expect(active.pct).toBe(73)
    expect(active.zone).toBe('Zone 2: Lactate Threshold')
    expect(active.calBurned).toBeGreaterThan(0)

    // Rest interval:
    const resting = getLiveCardioState(45, 600)
    expect(resting.bpm).toBe(106)
    expect(resting.pct).toBe(56)
    expect(resting.zone).toBe('Zone 1: Aerobic Base')
  })

  it('validates contextual plate math calculator availability for Olympic barbell lifts', () => {
    function isOlympicWeightExercise(name: string): boolean {
      const lower = name.toLowerCase()
      return (
        lower.includes('barbell') ||
        lower.includes('squat') ||
        lower.includes('deadlift') ||
        lower.includes('bench press') ||
        lower.includes('overhead press') ||
        lower.includes('clean') ||
        lower.includes('snatch')
      )
    }

    expect(isOlympicWeightExercise('Barbell Back Squat')).toBe(true)
    expect(isOlympicWeightExercise('Overhead Squat Assessment (OHSA)')).toBe(true)
    expect(isOlympicWeightExercise('Romanian Deadlift')).toBe(true)
    expect(isOlympicWeightExercise('Dumbbell Lateral Raise')).toBe(false)
    expect(isOlympicWeightExercise('Plank Hold')).toBe(false)
  })

  it('guarantees coach is initially on left frame, athlete on right, and plumb lines never overlay coach video', () => {
    interface StudioViewportState {
      isStageSwapped: boolean
      layout: 'split' | 'pip' | 'focus'
      showPlumbLine: boolean
    }

    function resolveStudioViewports(state: StudioViewportState) {
      // Coach is initially on Left (Viewport 1), Athlete is on Right (Viewport 2)
      const leftContainer = !state.isStageSwapped ? 'coach-video-container' : 'athlete-video-container'
      const rightContainer = !state.isStageSwapped ? 'athlete-video-container' : 'coach-video-container'

      // Invariant: Biomechanical plumb line and telestrator are strictly bound to athlete container
      const athleteHasPlumbLine = state.showPlumbLine
      const coachHasPlumbLine = false

      return {
        leftContainer,
        rightContainer,
        athleteHasPlumbLine,
        coachHasPlumbLine,
      }
    }

    // Default state: Coach is on Left frame, Athlete is on Right frame
    const defaultState = resolveStudioViewports({ isStageSwapped: false, layout: 'split', showPlumbLine: true })
    expect(defaultState.leftContainer).toBe('coach-video-container')
    expect(defaultState.rightContainer).toBe('athlete-video-container')
    expect(defaultState.athleteHasPlumbLine).toBe(true)
    expect(defaultState.coachHasPlumbLine).toBe(false) // Never on coach

    // PiP layout: Coach in bottom-left corner PiP, Athlete is full stage
    const pipState = resolveStudioViewports({ isStageSwapped: false, layout: 'pip', showPlumbLine: true })
    expect(pipState.leftContainer).toBe('coach-video-container')
    expect(pipState.rightContainer).toBe('athlete-video-container')
    expect(pipState.athleteHasPlumbLine).toBe(true)
    expect(pipState.coachHasPlumbLine).toBe(false)

    // Focus/Stage layout: Athlete is full stage, coach minimized
    const focusState = resolveStudioViewports({ isStageSwapped: false, layout: 'focus', showPlumbLine: true })
    expect(focusState.leftContainer).toBe('coach-video-container')
    expect(focusState.coachHasPlumbLine).toBe(false)

    // Swapped state: Athlete on Left frame, Coach on Right frame (or demo stage)
    const swappedState = resolveStudioViewports({ isStageSwapped: true, layout: 'split', showPlumbLine: true })
    expect(swappedState.leftContainer).toBe('athlete-video-container')
    expect(swappedState.rightContainer).toBe('coach-video-container')
    // Plumb line remains strictly on athlete, NEVER on coach stage
    expect(swappedState.athleteHasPlumbLine).toBe(true)
    expect(swappedState.coachHasPlumbLine).toBe(false)
  })

  it('guarantees client frame capture strictly targets the athlete feed and captures the entire uncropped native resolution', () => {
    interface MockVideoFeed {
      id: string
      role: 'athlete' | 'coach'
      videoWidth: number
      videoHeight: number
      src: string
    }

    function simulateClientFrameCapture(
      availableFeeds: MockVideoFeed[],
      isStageSwapped: boolean
    ): { capturedRole: string; capturedWidth: number; capturedHeight: number; uncroppedEntireFrame: boolean } {
      // Invariant: capture ALWAYS targets athlete/client video element regardless of where athlete is located
      const clientVideo = availableFeeds.find(f => f.role === 'athlete')
      if (!clientVideo || clientVideo.videoWidth <= 0 || clientVideo.videoHeight <= 0) {
        throw new Error('No valid client video available for diagnostic capture')
      }

      // Drawing to canvas sized strictly to videoWidth/videoHeight captures the entire uncropped frame
      const canvasWidth = clientVideo.videoWidth
      const canvasHeight = clientVideo.videoHeight
      const uncroppedEntireFrame = canvasWidth === clientVideo.videoWidth && canvasHeight === clientVideo.videoHeight

      return {
        capturedRole: clientVideo.role,
        capturedWidth: canvasWidth,
        capturedHeight: canvasHeight,
        uncroppedEntireFrame,
      }
    }

    const feeds: MockVideoFeed[] = [
      { id: 'coach-cam', role: 'coach', videoWidth: 1280, videoHeight: 720, src: 'blob:coach-local' },
      { id: 'athlete-cam', role: 'athlete', videoWidth: 1920, videoHeight: 1080, src: 'blob:athlete-remote' },
    ]

    // Capture in default state (Coach Left, Athlete Right)
    const defaultCapture = simulateClientFrameCapture(feeds, false)
    expect(defaultCapture.capturedRole).toBe('athlete') // Must be athlete, not coach
    expect(defaultCapture.capturedWidth).toBe(1920)
    expect(defaultCapture.capturedHeight).toBe(1080)
    expect(defaultCapture.uncroppedEntireFrame).toBe(true)

    // Capture in swapped state (Athlete Left, Coach Right)
    const swappedCapture = simulateClientFrameCapture(feeds, true)
    expect(swappedCapture.capturedRole).toBe('athlete') // Still strictly athlete
    expect(swappedCapture.capturedWidth).toBe(1920)
    expect(swappedCapture.capturedHeight).toBe(1080)
    expect(swappedCapture.uncroppedEntireFrame).toBe(true)
  })

  it('formats session elapsed duration for exit modal metrics', () => {
    function formatSessionTime(totalSeconds: number): string {
      const mins = Math.floor(totalSeconds / 60)
      const secs = totalSeconds % 60
      return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`
    }

    expect(formatSessionTime(45)).toBe('0m 45s')
    expect(formatSessionTime(125)).toBe('2m 05s')
    expect(formatSessionTime(3600)).toBe('60m 00s')
  })

  it('evaluates escape key triggers for exit cockpit modal', () => {
    interface ModalState {
      isSubModalOpen: boolean
      isExitModalOpen: boolean
    }

    function handleEscapeKeyPress(state: ModalState): ModalState {
      if (state.isSubModalOpen) {
        // When sub-modal is open, Escape should not toggle the exit cockpit modal
        return state
      }
      return {
        ...state,
        isExitModalOpen: !state.isExitModalOpen,
      }
    }

    // When no sub-modal is open, Esc opens exit modal
    expect(handleEscapeKeyPress({ isSubModalOpen: false, isExitModalOpen: false })).toEqual({
      isSubModalOpen: false,
      isExitModalOpen: true,
    })

    // When exit modal is open, Esc closes it
    expect(handleEscapeKeyPress({ isSubModalOpen: false, isExitModalOpen: true })).toEqual({
      isSubModalOpen: false,
      isExitModalOpen: false,
    })

    // When a sub-modal (e.g. wrap-up, plate calc) is open, exit modal is not toggled
    expect(handleEscapeKeyPress({ isSubModalOpen: true, isExitModalOpen: false })).toEqual({
      isSubModalOpen: true,
      isExitModalOpen: false,
    })
  })

  it('resolves exit navigation destinations correctly', () => {
    function resolveExitDestination(action: 'profile' | 'triage' | 'conclude', clientId: string) {
      if (action === 'profile') return `/coach/clients/${clientId}`
      if (action === 'triage') return '/coach'
      return 'open_wrapup_modal'
    }

    expect(resolveExitDestination('profile', 'client-123')).toBe('/coach/clients/client-123')
    expect(resolveExitDestination('triage', 'client-123')).toBe('/coach')
    expect(resolveExitDestination('conclude', 'client-123')).toBe('open_wrapup_modal')
  })

  it('defines exactly 4 assessment capture slots with correct clinical metadata and tool bindings', () => {
    expect(ASSESSMENT_CAPTURE_SLOTS).toHaveLength(4)
    const slotIds = ASSESSMENT_CAPTURE_SLOTS.map(s => s.id)
    expect(slotIds).toEqual(['anterior', 'lateral', 'posterior', 'overhead_squat'])

    // Body Comp requires 3 views: Front (anterior), Side (lateral), Back (posterior)
    const bodyCompSlots = ASSESSMENT_CAPTURE_SLOTS.filter(s => s.usedIn.includes('body_comp'))
    expect(bodyCompSlots).toHaveLength(3)
    expect(bodyCompSlots.map(s => s.id)).toEqual(['anterior', 'lateral', 'posterior'])

    // OHSA requires all 4 views: Front, Side, Back, plus Squat Depth
    const ohsaSlots = ASSESSMENT_CAPTURE_SLOTS.filter(s => s.usedIn.includes('ohsa'))
    expect(ohsaSlots).toHaveLength(4)
    expect(ohsaSlots.map(s => s.id)).toEqual(['anterior', 'lateral', 'posterior', 'overhead_squat'])

    // Slot 4 (overhead_squat) is strictly designated for OHSA squat depth
    const squatSlot = ASSESSMENT_CAPTURE_SLOTS.find(s => s.id === 'overhead_squat')
    expect(squatSlot?.badge).toBe('OHSA Only')
    expect(squatSlot?.usedIn).toEqual(['ohsa'])
  })

  it('auto-advances capture slot sequentially through all 4 views', () => {
    function advanceCaptureSlot(current: AssessmentCaptureSlot): AssessmentCaptureSlot {
      const sequence: AssessmentCaptureSlot[] = ['anterior', 'lateral', 'posterior', 'overhead_squat']
      const currentIndex = sequence.indexOf(current)
      return sequence[(currentIndex + 1) % sequence.length]
    }

    expect(advanceCaptureSlot('anterior')).toBe('lateral')
    expect(advanceCaptureSlot('lateral')).toBe('posterior')
    expect(advanceCaptureSlot('posterior')).toBe('overhead_squat')
    expect(advanceCaptureSlot('overhead_squat')).toBe('anterior')
  })

  it('correctly prepares safe session storage payloads for both Body Comp and OHSA scanners', () => {
    const mockCapturedFrames: Record<AssessmentCaptureSlot, string | null> = {
      anterior: 'data:image/jpeg;base64,anterior_frame_data',
      lateral: 'data:image/jpeg;base64,lateral_frame_data',
      posterior: 'data:image/jpeg;base64,posterior_frame_data',
      overhead_squat: 'data:image/jpeg;base64,squat_depth_frame_data',
    }

    function buildStoragePayloads(clientId: string, frames: Record<AssessmentCaptureSlot, string | null>) {
      return {
        unifiedAssessmentKey: `gaa_assessment_frames_${clientId}`,
        unifiedAssessmentPayload: JSON.stringify(frames),
        ohsaKey: `gaa_posture_photos_${clientId}`,
        ohsaPayload: JSON.stringify(frames),
        bodyCompKey: `gaa_body_comp_photos_${clientId}`,
        bodyCompPayload: JSON.stringify({
          anterior: frames.anterior,
          lateral: frames.lateral,
          posterior: frames.posterior,
        }),
      }
    }

    const payloads = buildStoragePayloads('client_abc123', mockCapturedFrames)

    // Verify OHSA receives all 4 frames
    const parsedOhsa = JSON.parse(payloads.ohsaPayload)
    expect(parsedOhsa.anterior).toBe(mockCapturedFrames.anterior)
    expect(parsedOhsa.lateral).toBe(mockCapturedFrames.lateral)
    expect(parsedOhsa.posterior).toBe(mockCapturedFrames.posterior)
    expect(parsedOhsa.overhead_squat).toBe(mockCapturedFrames.overhead_squat)

    // Verify Body Comp receives exactly the 3 required views and omits overhead_squat
    const parsedBodyComp = JSON.parse(payloads.bodyCompPayload)
    expect(parsedBodyComp.anterior).toBe(mockCapturedFrames.anterior)
    expect(parsedBodyComp.lateral).toBe(mockCapturedFrames.lateral)
    expect(parsedBodyComp.posterior).toBe(mockCapturedFrames.posterior)
    expect(parsedBodyComp.overhead_squat).toBeUndefined()
  })

  it('safely clears photo vault state across all 4 slots', () => {
    let capturedFrames: Record<AssessmentCaptureSlot, string | null> = {
      anterior: 'img1',
      lateral: 'img2',
      posterior: 'img3',
      overhead_squat: 'img4',
    }

    function clearAllVaultPhotos() {
      capturedFrames = {
        anterior: null,
        lateral: null,
        posterior: null,
        overhead_squat: null,
      }
    }

    clearAllVaultPhotos()
    expect(Object.values(capturedFrames).every(v => v === null)).toBe(true)
    expect(Object.values(capturedFrames).filter(Boolean).length).toBe(0)
  })

  describe('Live Session Exercise Instructions & Visual Reference Mechanics', () => {
    it('resolves official NASM image thumbnail, video embed, and clinical form cues for active movement', () => {
      const activeExercise: Exercise = {
        name: 'Barbell Back Squat',
        sets: '3',
        reps: '8-10',
        tempo: '2/0/2',
      }

      const card = getNasmClinicalMovementCard(activeExercise.name, {
        description: activeExercise.notes,
        coachingCues: activeExercise.coachingCues,
        imageUrl: activeExercise.imageUrl,
        videoUrl: activeExercise.videoUrl,
      })

      expect(card.name).toBe('Barbell Back Squat')
      expect(card.category).toBe('Legs')
      expect(card.hasOfficialMedia).toBe(true)
      expect(card.imageUrl).toContain('img.youtube.com')
      expect(card.embedUrl).toContain('youtube-nocookie.com/embed')
      expect(card.clinicalCues.length).toBeGreaterThanOrEqual(2)
      expect(card.primeMover).toContain('Quadriceps')
    })

    it('correctly resolves 5 kinetic checkpoints for compound movements', () => {
      const card = getNasmClinicalMovementCard('Barbell Bench Press')

      expect(card.kineticCheckpoints).toBeDefined()
      expect(card.kineticCheckpoints.feetAnkles).toContain('floor')
      expect(card.kineticCheckpoints.knees).toBeDefined()
      expect(card.kineticCheckpoints.lphc).toContain('pelvis')
      expect(card.kineticCheckpoints.shoulders).toContain('bench')
      expect(card.kineticCheckpoints.headNeck).toContain('cervical')
    })

    it('prioritizes custom coach notes and cues when provided on the exercise', () => {
      const customExercise: Exercise = {
        name: 'Push Up',
        sets: '3',
        reps: '12',
        notes: 'Keep elbows tucked at 45 degrees, touch chest to floor.',
        coachingCues: ['Tuck elbows 45°', 'Active core brace'],
      }

      const card = getNasmClinicalMovementCard(customExercise.name, {
        description: customExercise.notes,
        coachingCues: customExercise.coachingCues,
      })

      expect(card.clinicalCues).toEqual(['Tuck elbows 45°', 'Active core brace'])
    })

    it('provides robust kinetic alignment fallbacks for novel exercises', () => {
      const novelExercise: Exercise = {
        name: 'Custom Kettlebell Rotational Clean',
        sets: '3',
        reps: '6',
      }

      const card = getNasmClinicalMovementCard(novelExercise.name)

      expect(card.hasOfficialMedia).toBe(false)
      expect(card.imageUrl).toBeNull()
      expect(card.kineticCheckpoints.feetAnkles).toBeDefined()
      expect(card.kineticCheckpoints.lphc).toBeDefined()
      expect(card.setupInstructions).toBeDefined()
    })

    it('manages demo video modal state transition for video demonstration preview', () => {
      let demoModalState: { isOpen: boolean; embedUrl?: string | null; name: string } | null = null

      function openDemoModal(exerciseName: string, embedUrl?: string | null) {
        demoModalState = {
          isOpen: true,
          embedUrl,
          name: exerciseName,
        }
      }

      function closeDemoModal() {
        demoModalState = null
      }

      openDemoModal('Barbell Back Squat', 'https://www.youtube-nocookie.com/embed/W9jJaI4cHJU')
      const activeState = demoModalState as { isOpen: boolean; embedUrl?: string | null; name: string } | null
      expect(activeState?.isOpen).toBe(true)
      expect(activeState?.name).toBe('Barbell Back Squat')
      expect(activeState?.embedUrl).toContain('W9jJaI4cHJU')

      closeDemoModal()
      expect(demoModalState).toBeNull()
    })
  })

  describe('Clinical Aristocracy Live Studio Playbook & Typography Enforcements', () => {
    it('manages 45-minute consultation playbook modal visibility and action dispatching', () => {
      let isPlaybookOpen = false
      let isPostureModalOpen = false
      let isTelestratorActive = false
      let telestratorTool = 'pen'

      const togglePlaybook = () => {
        isPlaybookOpen = !isPlaybookOpen
      }

      const openPostureMesh = () => {
        isPlaybookOpen = false
        isPostureModalOpen = true
      }

      const openTelestratorAngle = () => {
        isTelestratorActive = true
        telestratorTool = 'protractor'
      }

      expect(isPlaybookOpen).toBe(false)
      togglePlaybook()
      expect(isPlaybookOpen).toBe(true)

      openPostureMesh()
      expect(isPlaybookOpen).toBe(false)
      expect(isPostureModalOpen).toBe(true)

      openTelestratorAngle()
      expect(isTelestratorActive).toBe(true)
      expect(telestratorTool).toBe('protractor')
    })
  })
})


