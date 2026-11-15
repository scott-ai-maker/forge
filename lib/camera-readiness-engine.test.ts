import { describe, expect, it } from 'vitest'
import {
  analyzeReadinessPoseFrame,
  applyExpressCapToInjectedDrills,
  buildSynthetic3RepTrajectory,
  buildSyntheticReadinessPoseFrame,
  createReadinessRepSession,
  evaluateCameraReadiness,
  finalizeReadinessSession,
  getActiveMovementForRep,
  ingestPoseFrameIntoSession,
  recordManualRepInSession,
} from '@/lib/camera-readiness-engine'

describe('30-Second Camera Readiness Check — 33-Point Biomechanical Engine', () => {
  it('validates framing boundaries and low-visibility landmark safety guards', () => {
    expect(analyzeReadinessPoseFrame(null, 'overhead_squat')).toBeNull()
    expect(analyzeReadinessPoseFrame([], 'overhead_squat')).toBeNull()

    const standing = buildSyntheticReadinessPoseFrame('overhead_squat', 0, 'optimal_mobility')
    const valid = analyzeReadinessPoseFrame(standing, 'overhead_squat')
    expect(valid).not.toBeNull()
    expect(valid!.framingReady).toBe(true)
    expect(valid!.overlayNodes).toHaveLength(13)
    expect(valid!.overlaySegments).toHaveLength(12)

    // Cut off ankles below viewport bottom -> framingReady becomes false with step-back hint
    const clippedAnkles = standing.map((pt, idx) =>
      idx === 27 || idx === 28 ? { ...pt, y: 0.99 } : pt
    )
    const clippedTelemetry = analyzeReadinessPoseFrame(clippedAnkles, 'overhead_squat')
    expect(clippedTelemetry!.framingReady).toBe(false)
    expect(clippedTelemetry!.framingHint).toContain('ankles')

    // Low visibility -> framingReady becomes false with lighting hint
    const darkFrame = standing.map(pt => ({ ...pt, visibility: 0.25 }))
    const darkTelemetry = analyzeReadinessPoseFrame(darkFrame, 'overhead_squat')
    expect(darkTelemetry!.framingReady).toBe(false)
    expect(darkTelemetry!.framingHint).toContain('lighting')
  })

  it('mirrors normalized 0..100 HUD skeleton X coordinates when front selfie camera is active', () => {
    const frame = buildSyntheticReadinessPoseFrame('overhead_squat', 0.5, 'optimal_mobility')
    const unmirrored = analyzeReadinessPoseFrame(frame, 'overhead_squat', { mirrorX: false })!
    const mirrored = analyzeReadinessPoseFrame(frame, 'overhead_squat', { mirrorX: true })!

    const lShoulderUnmirrored = unmirrored.overlayNodes.find(n => n.id === 'lShoulder')!
    const lShoulderMirrored = mirrored.overlayNodes.find(n => n.id === 'lShoulder')!
    expect(lShoulderMirrored.x).toBeCloseTo(100 - lShoulderUnmirrored.x, 1)
    expect(lShoulderMirrored.y).toBeCloseTo(lShoulderUnmirrored.y, 1)
  })

  it('distinguishes optimal vs. restricted Overhead Squat biomechanics across 3 live reps', () => {
    // 1. Optimal mobility 3-rep trajectory
    let optSession = createReadinessRepSession('overhead_squat')
    for (const step of buildSynthetic3RepTrajectory('overhead_squat', 'optimal_mobility')) {
      optSession = ingestPoseFrameIntoSession(optSession, step.landmarks, step.timestampMs).session
    }
    expect(optSession.completedReps).toBe(3)
    expect(optSession.phase).toBe('completed')

    const optEval = finalizeReadinessSession(optSession, false)!
    expect(optEval.evaluationSource).toBe('live_pose_cv')
    expect(optEval.capturedRepsCount).toBe(3)
    expect(optEval.readinessScore).toBeGreaterThanOrEqual(89)
    expect(optEval.restrictionFlags).toEqual([])
    expect(optEval.injectedDrills).toHaveLength(0)
    expect(optEval.checks.every(c => c.status === 'optimal')).toBe(true)

    // 2. Tight hips & ankles + knee valgus 3-rep trajectory
    let restrictedSession = createReadinessRepSession('overhead_squat')
    for (const step of buildSynthetic3RepTrajectory('overhead_squat', 'tight_hips_ankles')) {
      restrictedSession = ingestPoseFrameIntoSession(
        restrictedSession,
        step.landmarks,
        step.timestampMs
      ).session
    }
    expect(restrictedSession.completedReps).toBe(3)

    const restrictedEval = finalizeReadinessSession(restrictedSession, false)!
    expect(restrictedEval.readinessScore).toBeLessThan(85)
    expect(restrictedEval.restrictionFlags).toContain('ankle_dorsiflexion_limited')
    expect(restrictedEval.restrictionFlags).toContain('hip_flexor_tightness')
    expect(restrictedEval.restrictionFlags).toContain('mild_knee_valgus')
    expect(restrictedEval.injectedDrills).toHaveLength(3)

    // With 20m Express Mode enabled, caps drills strictly to 2 drills and <= 90s
    const expressEval = finalizeReadinessSession(restrictedSession, true)!
    expect(expressEval.injectedDrills).toHaveLength(2)
    expect(expressEval.totalInjectedDurationSec).toBeLessThanOrEqual(90)
  })

  it('distinguishes optimal vs. stiff upper-back Scapular Wall Slides across 3 live reps', () => {
    let optSession = createReadinessRepSession('scapular_wall_slides')
    for (const step of buildSynthetic3RepTrajectory('scapular_wall_slides', 'optimal_mobility')) {
      optSession = ingestPoseFrameIntoSession(optSession, step.landmarks, step.timestampMs).session
    }
    expect(optSession.completedReps).toBe(3)
    const optEval = finalizeReadinessSession(optSession, false)!
    expect(optEval.readinessScore).toBeGreaterThanOrEqual(89)
    expect(optEval.restrictionFlags).toEqual([])
    expect(optEval.injectedDrills).toHaveLength(0)

    let stiffSession = createReadinessRepSession('scapular_wall_slides')
    for (const step of buildSynthetic3RepTrajectory('scapular_wall_slides', 'stiff_upper_back')) {
      stiffSession = ingestPoseFrameIntoSession(
        stiffSession,
        step.landmarks,
        step.timestampMs
      ).session
    }
    expect(stiffSession.completedReps).toBe(3)
    const stiffEval = finalizeReadinessSession(stiffSession, false)!
    expect(stiffEval.readinessScore).toBeLessThan(85)
    expect(stiffEval.restrictionFlags).toContain('thoracic_stiffness')
    expect(stiffEval.restrictionFlags).toContain('shoulder_flexion_limited')
    expect(stiffEval.restrictionFlags).toContain('cervical_drift')
    expect(stiffEval.injectedDrills.length).toBeGreaterThanOrEqual(2)
  })

  it('combines 2 Overhead Squats + 1 Scapular Wall Slide in Dual-Screen Full Check mode', () => {
    expect(getActiveMovementForRep('dual_screen', 1)).toBe('overhead_squat')
    expect(getActiveMovementForRep('dual_screen', 2)).toBe('overhead_squat')
    expect(getActiveMovementForRep('dual_screen', 3)).toBe('scapular_wall_slides')

    let dualSession = createReadinessRepSession('dual_screen')
    // Feed 2 tight squat reps + 1 stiff wall slide rep
    let ts = 1000
    for (let rep = 1; rep <= 3; rep += 1) {
      const movement = getActiveMovementForRep('dual_screen', rep)
      const profile = movement === 'overhead_squat' ? 'tight_hips_ankles' : 'stiff_upper_back'
      for (const p of [0, 0.4, 0.85, 1, 0.6, 0.1, 0]) {
        dualSession = ingestPoseFrameIntoSession(
          dualSession,
          buildSyntheticReadinessPoseFrame(movement, p, profile),
          ts
        ).session
        ts += 250
      }
    }

    expect(dualSession.completedReps).toBe(3)
    const dualEval = finalizeReadinessSession(dualSession, false)!
    expect(dualEval.checks.map(c => c.id)).toEqual([
      'ankle_df',
      'hip_depth',
      'shoulder_flex',
      'cervical_drift',
    ])
    expect(dualEval.restrictionFlags).toContain('ankle_dorsiflexion_limited')
    expect(dualEval.restrictionFlags).toContain('shoulder_flexion_limited')
    expect(dualEval.injectedDrills).toHaveLength(3)
  })

  it('suppresses micro-jitter false reps via hysteresis and 400ms inter-rep debounce, and supports manual rep lock', () => {
    let session = createReadinessRepSession('overhead_squat')
    // Shallow wobble (phase 0 -> 0.2 -> 0) must NOT count as a rep
    for (const [idx, p] of [0, 0.15, 0.22, 0.1, 0].entries()) {
      session = ingestPoseFrameIntoSession(
        session,
        buildSyntheticReadinessPoseFrame('overhead_squat', p, 'optimal_mobility'),
        1000 + idx * 200
      ).session
    }
    expect(session.completedReps).toBe(0)

    // Manual rep step advances cleanly and allows early finalization
    session = recordManualRepInSession(session, 3000)
    expect(session.completedReps).toBe(1)
    const earlyEval = finalizeReadinessSession(session, false)
    expect(earlyEval).not.toBeNull()
    expect(earlyEval!.capturedRepsCount).toBe(1)

    // Preset evaluation & Express cap remain deterministic
    const presetEval = evaluateCameraReadiness({
      screenMode: 'overhead_squat',
      preset: 'tight_hips_ankles',
      expressModeActive: true,
    })
    expect(presetEval.evaluationSource).toBe('self_check_preset')
    expect(applyExpressCapToInjectedDrills(presetEval.injectedDrills, true)).toHaveLength(2)
  })
})
