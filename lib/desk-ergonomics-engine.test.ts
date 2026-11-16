import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  computePlumbDeviationDeg,
  computeThreePointAngleDeg,
  evaluateDeskErgonomicsFromLandmarks,
  evaluateMediaPipeSeatedPose,
  mapMediaPipe33LandmarksToSeated,
  reconstructScanFromSavedWorkstation,
  SAMPLE_DESK_LANDMARKS,
  type SeatedPosePoint,
} from '@/lib/desk-ergonomics-engine'
import {
  computePostureDailyStreak,
  loadPostureProfileState,
  persistDeskErgonomicFlags,
  POSTURE_PROFILE_STORAGE_KEY,
  recordDeskResetCompletedOnDate,
  rehydratePostureProfileFromServer,
} from '@/lib/posture-profile-state'
import { buildOrderedDeskResetDrills, DeskResetGuidedPlayer } from '@/components/fitness/DeskResetModal'
import { applyEventsToSnapshot, type ClientTelemetrySnapshot } from '@/lib/telemetry-storage'
import TelemetryRingGauge from '@/components/ui/TelemetryRingGauge'

function createMemoryStorage() {
  const store = new Map<string, string>()
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v)
    },
    removeItem: (k: string) => {
      store.delete(k)
    },
    clear: () => store.clear(),
  }
}

describe('Feature #6: Desk Ergonomics Engine, State Sync & Guided 5-Min Desk Reset', () => {
  beforeEach(() => {
    const localStorageMock = createMemoryStorage()
    vi.stubGlobal('window', {
      localStorage: localStorageMock,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  })

  it('computes 3-point interior joint angles and plumb-line deviations accurately', () => {
    expect(computeThreePointAngleDeg({ x: 0, y: 10 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(90)
    expect(computeThreePointAngleDeg({ x: 5, y: 5 }, { x: 5, y: 5 }, { x: 10, y: 5 })).toBe(90)
    expect(computePlumbDeviationDeg({ x: 40, y: 60 }, { x: 40, y: 30 })).toBe(0)
    expect(computePlumbDeviationDeg({ x: 40, y: 60 }, { x: 70, y: 30 })).toBe(45)
  })

  it('scores optimal seated setup cleanly (0 ergonomic flags) vs typical strain setup', () => {
    const optimal = evaluateDeskErgonomicsFromLandmarks(SAMPLE_DESK_LANDMARKS.optimal_setup)
    expect(optimal.overallStrain).toBe('optimal')
    expect(optimal.ergonomicFlags).toEqual([])
    expect(optimal.score).toBeGreaterThanOrEqual(92)
    expect(optimal.angles.every(a => a.status === 'optimal')).toBe(true)

    const strained = evaluateDeskErgonomicsFromLandmarks(SAMPLE_DESK_LANDMARKS.typical_strain)
    expect(strained.overallStrain).not.toBe('optimal')
    expect(strained.score).toBeLessThan(optimal.score)
    expect(strained.ergonomicFlags).toContain('forward_head')
    expect(strained.ergonomicFlags).toContain('rounded_shoulders')
    expect(strained.ergonomicFlags).toContain('hip_flexor_tightness')
  })

  it('does NOT penalize gentle ergonomic backrest recline (100°–106° open hip) as forward shoulder protraction', () => {
    const reclinedErgonomic: Record<SeatedPosePoint['id'], SeatedPosePoint> = {
      ...SAMPLE_DESK_LANDMARKS.optimal_setup,
      // Facing right (knee.x = 62 > hip.x = 35.5); shoulder reclined slightly behind hip (x = 31.5, ~8.1° recline)
      ear: { ...SAMPLE_DESK_LANDMARKS.optimal_setup.ear, x: 32.0, y: 19 },
      shoulder: { ...SAMPLE_DESK_LANDMARKS.optimal_setup.shoulder, x: 31.5, y: 35 },
      elbow: { ...SAMPLE_DESK_LANDMARKS.optimal_setup.elbow, x: 34.0, y: 54 },
      wrist: { ...SAMPLE_DESK_LANDMARKS.optimal_setup.wrist, x: 52.0, y: 55 },
    }
    const result = evaluateDeskErgonomicsFromLandmarks(reclinedErgonomic)
    const shoulderMetric = result.angles.find(a => a.id === 'shoulder_protraction')!
    expect(shoulderMetric.status).toBe('optimal')
    expect(result.ergonomicFlags).not.toContain('rounded_shoulders')
  })

  it('handles left-facing subjects and sanitizes NaN / Infinity MediaPipe coordinates without NaN output', () => {
    const leftFacing: Record<SeatedPosePoint['id'], SeatedPosePoint> = {
      ear: { index: 7, id: 'ear', label: 'Left Ear', x: 52.5, y: 20, confidence: 0.96 },
      shoulder: { index: 11, id: 'shoulder', label: 'Left Shoulder', x: 61.5, y: 34, confidence: 0.96 },
      elbow: { index: 13, id: 'elbow', label: 'Left Elbow', x: 56, y: 53, confidence: 0.95 },
      wrist: { index: 15, id: 'wrist', label: 'Left Wrist', x: 37, y: 49, confidence: 0.94 },
      hip: { index: 23, id: 'hip', label: 'Left Hip', x: 66, y: 63, confidence: 0.96 },
      knee: { index: 25, id: 'knee', label: 'Left Knee', x: 39, y: 60, confidence: 0.95 },
      ankle: { index: 27, id: 'ankle', label: 'Left Ankle', x: 38, y: 88, confidence: 0.92 },
    }
    const leftEval = evaluateDeskErgonomicsFromLandmarks(leftFacing)
    const rightEval = evaluateDeskErgonomicsFromLandmarks(SAMPLE_DESK_LANDMARKS.typical_strain)
    expect(leftEval.score).toBe(rightEval.score)
    expect(leftEval.ergonomicFlags).toEqual(rightEval.ergonomicFlags)

    const corrupted: Record<SeatedPosePoint['id'], SeatedPosePoint> = {
      ...SAMPLE_DESK_LANDMARKS.optimal_setup,
      ear: { ...SAMPLE_DESK_LANDMARKS.optimal_setup.ear, x: Number.NaN, y: Number.POSITIVE_INFINITY },
    }
    const safeEval = evaluateDeskErgonomicsFromLandmarks(corrupted)
    expect(Number.isFinite(safeEval.score)).toBe(true)
    expect(safeEval.angles.every(a => Number.isFinite(a.measuredDegrees))).toBe(true)
  })

  it('maps 33-point MediaPipe landmarks by higher side confidence and reconstructs saved workstations', () => {
    expect(mapMediaPipe33LandmarksToSeated([])).toBeNull()

    const mp33 = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.2 }))
    // Give left profile (7, 11, 23) higher visibility than right (8, 12, 24)
    mp33[7] = { x: 0.62, y: 0.2, visibility: 0.98 }
    mp33[11] = { x: 0.63, y: 0.35, visibility: 0.97 }
    mp33[13] = { x: 0.61, y: 0.54, visibility: 0.95 }
    mp33[15] = { x: 0.44, y: 0.55, visibility: 0.95 }
    mp33[23] = { x: 0.64, y: 0.63, visibility: 0.97 }
    mp33[25] = { x: 0.38, y: 0.67, visibility: 0.96 }
    mp33[27] = { x: 0.38, y: 0.89, visibility: 0.94 }

    const mapped = mapMediaPipe33LandmarksToSeated(mp33)
    expect(mapped).not.toBeNull()
    expect(mapped?.ear.label).toBe('Left Ear')

    const reconstructed = reconstructScanFromSavedWorkstation({
      id: 'ws-1',
      label: 'Executive Standing Desk',
      score: 96,
      strainLevel: 'optimal',
      ergonomicFlags: [],
      craniovertebralDeg: 4.2,
      shoulderProtractionDeg: 3.1,
      elbowAngleDeg: 98,
      seatedHipAngleDeg: 103,
      savedAt: '2026-11-15T12:00:00Z',
    })
    expect(reconstructed.score).toBe(96)
    expect(reconstructed.overallStrain).toBe('optimal')
    expect(reconstructed.angles[0].measuredDegrees).toBe(4.2)
  })

  it('clears resolved ergonomicFlags and updates same-named workstation in place upon re-audit', () => {
    persistDeskErgonomicFlags(['forward_head', 'hip_flexor_tightness'], {
      label: 'Home Desk',
      score: 58,
      strainLevel: 'coral',
      ergonomicFlags: ['forward_head', 'hip_flexor_tightness'],
      craniovertebralDeg: 28,
      shoulderProtractionDeg: 12,
      elbowAngleDeg: 112,
      seatedHipAngleDeg: 85,
    })
    let state = loadPostureProfileState()
    expect(state.ergonomicFlags).toEqual(['forward_head', 'hip_flexor_tightness'])
    expect(state.workstationProfiles).toHaveLength(1)

    // Re-auditing "Home Desk" after raising monitor clears resolved flags & updates profile in place
    persistDeskErgonomicFlags([], {
      label: 'home desk',
      score: 97,
      strainLevel: 'optimal',
      ergonomicFlags: [],
      craniovertebralDeg: 3.2,
      shoulderProtractionDeg: 2.0,
      elbowAngleDeg: 97,
      seatedHipAngleDeg: 102,
    })
    state = loadPostureProfileState()
    expect(state.ergonomicFlags).toEqual([])
    expect(state.workstationProfiles).toHaveLength(1)
    expect(state.workstationProfiles[0].score).toBe(97)
    expect(state.postureDelta.strainFlag).toBe('optimal')

    // Rehydration maps moderate_strain -> amber accurately
    window.localStorage.removeItem(POSTURE_PROFILE_STORAGE_KEY)
    const rehydrated = rehydratePostureProfileFromServer({
      snapshot: {
        deskWorkstationScore: 76,
        deskStrainLevel: 'moderate_strain',
        deskStrainFlags: ['rounded_shoulders'],
      },
    })
    expect(rehydrated?.postureDelta.strainFlag).toBe('amber')
    expect(rehydrated?.ergonomicFlags).toEqual(['rounded_shoulders'])
  })

  it('orders 5-Min Desk Reset drills by active flags, records daily streak, and renders semantic <progress> & role="img" ring', () => {
    const ordered = buildOrderedDeskResetDrills(['rounded_shoulders', 'hip_flexor_tightness'])
    expect(ordered[0].targetFlag).toBe('rounded_shoulders')
    expect(ordered[1].targetFlag).toBe('hip_flexor_tightness')
    expect(ordered).toHaveLength(4)

    const updated = recordDeskResetCompletedOnDate('2026-11-15')
    expect(computePostureDailyStreak(updated, '2026-11-15')).toBe(1)

    const playerHtml = renderToStaticMarkup(
      React.createElement(DeskResetGuidedPlayer, { activeFlags: ['forward_head'] })
    )
    expect(playerHtml).toContain('class="forge-progress-bar"')
    expect(playerHtml).toContain('aria-current="step"')

    const ringHtml = renderToStaticMarkup(
      React.createElement(TelemetryRingGauge, {
        score: 94,
        max: 100,
        label: 'Workstation Score 94 out of 100',
      })
    )
    expect(ringHtml).toContain('role="img"')
    expect(ringHtml).toContain('aria-label="Workstation Score 94 out of 100"')
    expect(ringHtml).not.toContain('out of 100: 94 out of 100')
  })

  it('rolls up desk_ergonomics_completed and desk_reset_completed in server telemetry snapshot', () => {
    const empty: ClientTelemetrySnapshot = {
      userId: 'athlete-1',
      latestReadinessScore: null,
      latestReadinessMovement: null,
      latestReadinessAt: null,
      jointComfortHistory: [],
      deskWorkstationScore: null,
      deskStrainLevel: null,
      deskStrainFlags: [],
      deskAngles: {},
      deskAuditedAt: null,
      postureDelta: {},
      safetyFlags: [],
      injectedWarmupDrills: [],
      optPhase: null,
      expressModeActive: false,
      environmentProfile: 'home_gym',
      lastWorkoutCompletedAt: null,
      lastSyncedAt: null,
      lastPlatform: null,
      lastAppVersion: null,
    }

    const rolled = applyEventsToSnapshot(
      empty,
      [
        {
          event_id: '11111111-1111-4111-8111-111111111111',
          event_type: 'desk_ergonomics_completed',
          session_id: 'sess-1',
          client_timestamp: '2026-11-15T16:00:00.000Z',
          timezone_offset_mins: -300,
          platform: 'desktop_web',
          app_version: '1.0.0',
          payload: {
            workstation_score: 64,
            strain_level: 'high_strain',
            strain_flags: ['forward_head', 'rounded_shoulders'],
            ear_shoulder_angle_deg: 29.5,
            shoulder_protraction_deg: 8.9,
            elbow_angle_deg: 112.4,
            seated_hip_angle_deg: 86.2,
          },
        },
        {
          event_id: '22222222-2222-4222-8222-222222222222',
          event_type: 'desk_reset_completed',
          session_id: 'sess-1',
          client_timestamp: '2026-11-15T16:06:00.000Z',
          timezone_offset_mins: -300,
          platform: 'desktop_web',
          app_version: '1.0.0',
          payload: {
            duration_sec: 300,
            drills_completed: 4,
            strain_flags_targeted: ['forward_head'],
            environment_profile: 'hotel_travel',
          },
        },
      ],
      '2026-11-15T16:06:01.000Z'
    )

    expect(rolled.deskWorkstationScore).toBe(64)
    expect(rolled.deskStrainLevel).toBe('high_strain')
    expect(rolled.deskStrainFlags).toEqual(['forward_head', 'rounded_shoulders'])
    expect(rolled.deskAngles.earShoulderDeg).toBe(29.5)
    expect(rolled.environmentProfile).toBe('hotel_travel')
  })

  it('evaluates real MediaPipe poses accurately across aspect ratios, 3/4 oblique angles, frontal webcams, and occluded desk legs', () => {
    // 1. Same physical posture in 16:9 landscape (1280x720) vs 3:4 portrait (900x1200) produces identical angles & score
    const makePoseFromPixelCoords = (
      ptsPx: Record<number, { x: number; y: number; visibility?: number }>,
      w: number,
      h: number
    ) => {
      const arr = Array.from({ length: 33 }, () => ({ x: 0.5, y: 1.2, visibility: 0.05 }))
      for (const [idxStr, pt] of Object.entries(ptsPx)) {
        arr[Number(idxStr)] = { x: pt.x / w, y: pt.y / h, visibility: pt.visibility ?? 0.96 }
      }
      return arr
    }

    // Upright right-facing lateral posture in pixel coordinates
    const uprightPx = {
      0: { x: 425, y: 205, visibility: 0.98 }, // Nose ahead of ear
      8: { x: 375, y: 190, visibility: 0.98 }, // Right ear
      12: { x: 368, y: 350, visibility: 0.98 }, // Right shoulder
      14: { x: 382, y: 540, visibility: 0.96 }, // Right elbow
      16: { x: 560, y: 550, visibility: 0.96 }, // Right wrist
      24: { x: 358, y: 630, visibility: 0.97 }, // Right hip
      26: { x: 620, y: 665, visibility: 0.95 }, // Right knee
      28: { x: 620, y: 890, visibility: 0.93 }, // Right ankle
    }
    const landscapeEval = evaluateMediaPipeSeatedPose(
      makePoseFromPixelCoords(uprightPx, 1600, 1000),
      { imageWidth: 1600, imageHeight: 1000 }
    )!
    const portraitEval = evaluateMediaPipeSeatedPose(
      makePoseFromPixelCoords(uprightPx, 900, 1200),
      { imageWidth: 900, imageHeight: 1200 }
    )!
    expect(landscapeEval.score).toBeGreaterThanOrEqual(92)
    expect(portraitEval.score).toBe(landscapeEval.score)
    expect(landscapeEval.viewBox).toEqual({ width: 160, height: 100 })
    expect(portraitEval.viewBox).toEqual({ width: 100, height: 133.3 })

    // 2. Slouched lateral posture produces distinctly lower score than upright posture
    const slouchedPx = {
      ...uprightPx,
      0: { x: 540, y: 230, visibility: 0.98 },
      8: { x: 485, y: 215, visibility: 0.98 }, // Pronounced forward head
      12: { x: 405, y: 355, visibility: 0.98 }, // Rounded shoulder ahead of hip
      16: { x: 645, y: 495, visibility: 0.96 }, // Over-extended reach
      26: { x: 615, y: 590, visibility: 0.95 }, // Closed hip angle
    }
    const slouchedEval = evaluateMediaPipeSeatedPose(
      makePoseFromPixelCoords(slouchedPx, 1600, 1000),
      { imageWidth: 1600, imageHeight: 1000 }
    )!
    expect(slouchedEval.score).toBeLessThan(landscapeEval.score - 25)
    expect(slouchedEval.ergonomicFlags).toContain('forward_head')

    // 3. Under-desk occluded knees (low visibility / out of frame) do NOT trigger a fake hip tilt penalty
    const underDeskOccludedPx = {
      0: { x: 425, y: 205, visibility: 0.98 },
      8: { x: 375, y: 190, visibility: 0.98 },
      12: { x: 368, y: 350, visibility: 0.98 },
      14: { x: 382, y: 540, visibility: 0.96 },
      16: { x: 560, y: 550, visibility: 0.96 },
      24: { x: 358, y: 630, visibility: 0.90 },
      // Knee & ankle occluded below desk (y > h, visibility = 0.04)
      26: { x: 355, y: 1180, visibility: 0.04 },
      28: { x: 355, y: 1450, visibility: 0.02 },
    }
    const occludedEval = evaluateMediaPipeSeatedPose(
      makePoseFromPixelCoords(underDeskOccludedPx, 1280, 960),
      { imageWidth: 1280, imageHeight: 960 }
    )!
    expect(occludedEval.landmarks.knee.occluded).toBe(true)
    expect(occludedEval.ergonomicFlags).not.toContain('hip_flexor_tightness')
    expect(occludedEval.score).toBeGreaterThanOrEqual(92)

    // 4. Frontal webcam view uses 3D worldLandmarks instead of misinterpreting clavicle width as forward head
    const frontal2D = Array.from({ length: 33 }, () => ({ x: 0.5, y: 1.2, visibility: 0.05 }))
    frontal2D[0] = { x: 0.5, y: 0.3, visibility: 0.99 }
    frontal2D[7] = { x: 0.56, y: 0.29, visibility: 0.92 }
    frontal2D[8] = { x: 0.44, y: 0.29, visibility: 0.92 }
    frontal2D[11] = { x: 0.64, y: 0.47, visibility: 0.98 }
    frontal2D[12] = { x: 0.36, y: 0.47, visibility: 0.98 }

    const makeFrontalWorld = (earForwardZ: number, shForwardZ: number) => {
      const w = Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0, visibility: 0.5 }))
      w[0] = { x: 0, y: -0.58, z: earForwardZ - 0.12, visibility: 0.99 }
      w[7] = { x: 0.075, y: -0.57, z: earForwardZ, visibility: 0.92 }
      w[8] = { x: -0.075, y: -0.57, z: earForwardZ, visibility: 0.92 }
      w[11] = { x: 0.19, y: -0.39, z: shForwardZ, visibility: 0.98 }
      w[12] = { x: -0.19, y: -0.39, z: shForwardZ, visibility: 0.98 }
      w[23] = { x: 0.13, y: 0, z: 0, visibility: 0.85 }
      w[24] = { x: -0.13, y: 0, z: 0, visibility: 0.85 }
      return w
    }

    const frontalUpright = evaluateMediaPipeSeatedPose(frontal2D, {
      imageWidth: 1280,
      imageHeight: 960,
      worldLandmarks: makeFrontalWorld(-0.02, 0),
    })!
    expect(frontalUpright.cameraAngle).toBe('frontal')
    expect(frontalUpright.score).toBeGreaterThanOrEqual(90)

    const frontalTurtled = evaluateMediaPipeSeatedPose(frontal2D, {
      imageWidth: 1280,
      imageHeight: 960,
      worldLandmarks: makeFrontalWorld(-0.14, -0.04),
    })!
    expect(frontalTurtled.score).toBeLessThan(frontalUpright.score - 15)
    expect(frontalTurtled.ergonomicFlags).toContain('forward_head')
  })
})
