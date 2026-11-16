import type { StrainLevel } from '@/lib/posture-profile-state'
import {
  computeIsotropicViewBox,
  computePlumbDeviationDeg,
  computeThreePoint3DAngleDeg,
  computeThreePointAngleDeg,
  STRAIN_COLORS,
} from '@/lib/desk-ergonomics-engine'

export interface StandingMeshPoint {
  index: number
  id: 'nose' | 'ear' | 'shoulder' | 'elbow' | 'wrist' | 'hip' | 'knee' | 'ankle' | 'foot'
  label: string
  x: number
  y: number
  confidence: number
  occluded: boolean
}

export interface RawMeshNode2D {
  index: number
  x: number
  y: number
  confidence: number
  visible: boolean
}

export interface StandingPostureScanEvaluation {
  score: number
  strainFlag: StrainLevel
  /** Calibrated clinical forward-head angle beyond neutral anatomical stack (0° = stacked) */
  cvaDeg: number
  /** Delta vs. Forge Day-1 reference baseline (8.9°): negative means improved alignment */
  forwardHeadDeltaDeg: number
  /** Forward shoulder protraction / bilateral shoulder level delta in degrees */
  shoulderDeltaDeg: number
  /** Signed lumbo-pelvic & trunk plumb drift in degrees (negative convention matches PostureDeltaSummary) */
  pelvicDriftDeg: number
  /** Standing knee flexion deviation from straight leg (180° = 0° flexion) */
  kneeFlexionDeg: number
  plumbLineX: number
  facingSign: 1 | -1
  cameraAngle: 'lateral' | 'oblique' | 'frontal'
  trackedNodeCount: number
  viewBox: { width: number; height: number }
  landmarks: Record<StandingMeshPoint['id'], StandingMeshPoint>
  allNodes: RawMeshNode2D[]
}

/** Standard MediaPipe 33-landmark BlazePose bone connections for full-body mesh visualization */
export const MEDIAPIPE_POSE_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [7, 2], [2, 0], [0, 5], [5, 8],
  [11, 12], [11, 23], [12, 24], [23, 24],
  [11, 13], [13, 15], [12, 14], [14, 16],
  [23, 25], [25, 27], [27, 29], [29, 31], [27, 31],
  [24, 26], [26, 28], [28, 30], [30, 32], [28, 32],
]

function isVisibleNode(
  lm: { x: number; y: number; visibility?: number } | undefined,
  minVis = 0.28
): boolean {
  if (!lm || !Number.isFinite(lm.x) || !Number.isFinite(lm.y)) return false
  const vis = Number.isFinite(lm.visibility) ? (lm.visibility as number) : 0.85
  return vis >= minVis && lm.x >= -0.02 && lm.x <= 1.02 && lm.y >= -0.02 && lm.y <= 0.995
}

/**
 * Evaluates a 33-point MediaPipe Pose detection on a standing/full-body or upper-body posture image.
 * Returns isotropic 1:1 photo-aligned coordinates for all 33 nodes plus calibrated clinical CVA,
 * thoracic/pelvic plumb drift, shoulder protraction, knee alignment, and 0-100 Posture Score.
 */
export function evaluateStandingPostureFromMediaPipe(
  mpLandmarks: Array<{ x: number; y: number; z?: number; visibility?: number }>,
  options?: {
    imageWidth?: number
    imageHeight?: number
    worldLandmarks?: Array<{ x: number; y: number; z?: number; visibility?: number }>
    baselineCvaDeg?: number
  }
): StandingPostureScanEvaluation | null {
  if (!Array.isArray(mpLandmarks) || mpLandmarks.length < 29) return null

  const baselineCvaDeg = options?.baselineCvaDeg ?? 8.9
  const vb = computeIsotropicViewBox(options?.imageWidth, options?.imageHeight)

  const allNodes: RawMeshNode2D[] = mpLandmarks.slice(0, 33).map((lm, index) => {
    const visible = isVisibleNode(lm, 0.25)
    const sx = lm && Number.isFinite(lm.x) ? lm.x : 0.5
    const sy = lm && Number.isFinite(lm.y) ? lm.y : 0.5
    const conf = lm && Number.isFinite(lm.visibility) ? (lm.visibility as number) : 0.85
    return {
      index,
      x: Math.round(Math.max(1, Math.min(vb.width - 1, sx * vb.width)) * 10) / 10,
      y: Math.round(Math.max(1, Math.min(vb.height - 1, sy * vb.height)) * 10) / 10,
      confidence: Math.round(Math.max(0, Math.min(1, conf)) * 100) / 100,
      visible,
    }
  })

  const trackedNodeCount = allNodes.filter(n => n.visible).length

  // Choose higher-confidence lateral profile (Right vs Left)
  const leftVis =
    (mpLandmarks[7]?.visibility ?? 0.5) +
    (mpLandmarks[11]?.visibility ?? 0.5) +
    (mpLandmarks[23]?.visibility ?? 0.5) +
    (mpLandmarks[25]?.visibility ?? 0.4) * 0.5
  const rightVis =
    (mpLandmarks[8]?.visibility ?? 0.5) +
    (mpLandmarks[12]?.visibility ?? 0.5) +
    (mpLandmarks[24]?.visibility ?? 0.5) +
    (mpLandmarks[26]?.visibility ?? 0.4) * 0.5
  const useRight = rightVis >= leftVis
  const sidePrefix = useRight ? 'Right' : 'Left'

  const idx = useRight
    ? { nose: 0, ear: 8, shoulder: 12, elbow: 14, wrist: 16, hip: 24, knee: 26, ankle: 28, foot: 32 }
    : { nose: 0, ear: 7, shoulder: 11, elbow: 13, wrist: 15, hip: 23, knee: 25, ankle: 27, foot: 31 }

  const makePt = (
    id: StandingMeshPoint['id'],
    label: string,
    minVis = 0.28
  ): StandingMeshPoint => {
    const node = allNodes[idx[id]]
    const raw = mpLandmarks[idx[id]]
    return {
      index: idx[id],
      id,
      label,
      x: node?.x ?? vb.width / 2,
      y: node?.y ?? vb.height / 2,
      confidence: node?.confidence ?? 0.85,
      occluded: !isVisibleNode(raw, minVis),
    }
  }

  const landmarks: Record<StandingMeshPoint['id'], StandingMeshPoint> = {
    nose: makePt('nose', 'Nose', 0.25),
    ear: makePt('ear', `${sidePrefix} Ear`, 0.25),
    shoulder: makePt('shoulder', `${sidePrefix} Shoulder`, 0.25),
    elbow: makePt('elbow', `${sidePrefix} Elbow`, 0.28),
    wrist: makePt('wrist', `${sidePrefix} Wrist`, 0.25),
    hip: makePt('hip', `${sidePrefix} Hip`, 0.25),
    knee: makePt('knee', `${sidePrefix} Knee`, 0.3),
    ankle: makePt('ankle', `${sidePrefix} Ankle`, 0.3),
    foot: makePt('foot', `${sidePrefix} Foot`, 0.28),
  }

  if (landmarks.ear.occluded && landmarks.shoulder.occluded) {
    return null
  }

  // Determine facing direction (+1 right, -1 left) from nose-to-ear, foot-to-ankle, and forearm
  let dirScore = 0
  if (!landmarks.nose.occluded && !landmarks.ear.occluded) {
    dirScore += ((landmarks.nose.x - landmarks.ear.x) / vb.width) * 3.0
  }
  if (!landmarks.foot.occluded && !landmarks.ankle.occluded) {
    dirScore += ((landmarks.foot.x - landmarks.ankle.x) / vb.width) * 1.8
  }
  if (!landmarks.wrist.occluded && !landmarks.hip.occluded) {
    dirScore += ((landmarks.wrist.x - landmarks.hip.x) / vb.width) * 0.6
  }
  const facingSign: 1 | -1 = dirScore >= 0 ? 1 : -1

  // Classify camera orientation: lateral vs oblique vs frontal
  const shL = mpLandmarks[11]
  const shR = mpLandmarks[12]
  const earL = mpLandmarks[7]
  const earR = mpLandmarks[8]
  const hipL = mpLandmarks[23]
  const hipR = mpLandmarks[24]

  const bothShouldersVis = isVisibleNode(shL, 0.45) && isVisibleNode(shR, 0.45)
  const bothEarsVis = isVisibleNode(earL, 0.35) && isVisibleNode(earR, 0.35)
  const shoulderSpanX = bothShouldersVis ? Math.abs(shL.x - shR.x) * vb.width : 0
  const midEarY = bothEarsVis ? ((earL.y + earR.y) / 2) * vb.height : landmarks.ear.y
  const midShY = bothShouldersVis ? ((shL.y + shR.y) / 2) * vb.height : landmarks.shoulder.y
  const headNeckSpanY = Math.max(5, Math.abs(midShY - midEarY))
  const minShX = bothShouldersVis ? Math.min(shL.x, shR.x) : 0
  const maxShX = bothShouldersVis ? Math.max(shL.x, shR.x) : 0
  const noseBetweenShoulders =
    bothShouldersVis &&
    !landmarks.nose.occluded &&
    mpLandmarks[0].x > minShX + (maxShX - minShX) * 0.22 &&
    mpLandmarks[0].x < maxShX - (maxShX - minShX) * 0.22

  let cameraAngle: 'lateral' | 'oblique' | 'frontal' = 'lateral'
  if (bothShouldersVis && shoulderSpanX > headNeckSpanY * 1.2 && noseBetweenShoulders) {
    cameraAngle = 'frontal'
  } else if (bothShouldersVis && shoulderSpanX > headNeckSpanY * 0.48) {
    cameraAngle = 'oblique'
  }

  // Fallback reference hip if cropped in upper-body shot
  if (landmarks.hip.occluded) {
    const neckH = Math.max(8, Math.abs(landmarks.shoulder.y - landmarks.ear.y))
    landmarks.hip = {
      ...landmarks.hip,
      x: landmarks.shoulder.x,
      y: Math.min(vb.height - 2, Math.round((landmarks.shoulder.y + neckH * 2.15) * 10) / 10),
      occluded: true,
    }
  }

  let cvaDeg = 0
  let trunkLeanDeg = 0
  let hipShiftDeg = 0
  let shoulderDeltaDeg = 0
  let kneeFlexionDeg = 0

  const world = options?.worldLandmarks
  const hasWorld = Array.isArray(world) && world.length >= 29

  if (cameraAngle === 'frontal') {
    const neckRatio2D = headNeckSpanY / Math.max(10, shoulderSpanX)
    const foreshortenCv = Math.max(0, (0.37 - neckRatio2D) * 75)
    // Bilateral shoulder tilt in degrees
    const shTiltDeg = bothShouldersVis
      ? (Math.atan2(Math.abs(shL.y - shR.y) * vb.height, Math.max(8, shoulderSpanX)) * 180) / Math.PI
      : 0
    shoulderDeltaDeg = Math.round(shTiltDeg * 10) / 10

    if (hasWorld && world[7] && world[8] && world[11] && world[12]) {
      const wEar = {
        x: (world[7].x + world[8].x) / 2,
        y: (world[7].y + world[8].y) / 2,
        z: ((world[7].z ?? 0) + (world[8].z ?? 0)) / 2,
      }
      const wSh = {
        x: (world[11].x + world[12].x) / 2,
        y: (world[11].y + world[12].y) / 2,
        z: ((world[11].z ?? 0) + (world[12].z ?? 0)) / 2,
      }
      const wNose = world[0]
      let fx = 0
      let fz = -1
      if (wNose) {
        const rx = wNose.x - wEar.x
        const rz = (wNose.z ?? 0) - wEar.z
        const fMag = Math.hypot(rx, rz)
        if (fMag > 1e-4) {
          fx = rx / fMag
          fz = rz / fMag
        }
      }
      const fwdHeadM = (wEar.x - wSh.x) * fx + (wEar.z - wSh.z) * fz
      const neckHeightM = Math.max(0.08, Math.abs(wSh.y - wEar.y))
      const rawWorldCv = Math.max(
        0,
        ((Math.atan2(Math.max(0, fwdHeadM), neckHeightM) * 180) / Math.PI) - 5.5
      )
      cvaDeg = Math.max(rawWorldCv, foreshortenCv)

      if (world[23] && world[24]) {
        const wHip = {
          x: (world[23].x + world[24].x) / 2,
          y: (world[23].y + world[24].y) / 2,
          z: ((world[23].z ?? 0) + (world[24].z ?? 0)) / 2,
        }
        const fwdTrunkM = Math.abs((wSh.x - wHip.x) * fx + (wSh.z - wHip.z) * fz)
        const trunkHeightM = Math.max(0.18, Math.abs(wHip.y - wSh.y))
        trunkLeanDeg = Math.max(0, ((Math.atan2(fwdTrunkM, trunkHeightM) * 180) / Math.PI) - 1.5)
      }
    } else {
      cvaDeg = foreshortenCv
      trunkLeanDeg = shTiltDeg * 0.8
    }

    if (hasWorld && !landmarks.hip.occluded && !landmarks.knee.occluded && !landmarks.ankle.occluded) {
      const hW = world[landmarks.hip.index]
      const kW = world[landmarks.knee.index]
      const aW = world[landmarks.ankle.index]
      if (hW && kW && aW) {
        kneeFlexionDeg = Math.max(0, 180 - computeThreePoint3DAngleDeg(hW, kW, aW))
      }
    }
  } else if (cameraAngle === 'oblique') {
    const midEar = bothEarsVis
      ? { x: ((earL.x + earR.x) / 2) * vb.width, y: ((earL.y + earR.y) / 2) * vb.height }
      : landmarks.ear
    const midSh = {
      x: ((shL.x + shR.x) / 2) * vb.width,
      y: ((shL.y + shR.y) / 2) * vb.height,
    }
    const estFullBiacromial = headNeckSpanY * 1.95
    const cosYaw = Math.min(0.75, shoulderSpanX / Math.max(12, estFullBiacromial))
    const sinYaw = Math.max(0.55, Math.sqrt(Math.max(0.3, 1 - cosYaw * cosYaw)))

    const midCvOffset = ((midEar.x - midSh.x) * facingSign) / sinYaw
    const midNeckDy = Math.max(1e-3, Math.abs(midSh.y - midEar.y))
    const rawObliqueCv = (Math.atan2(Math.abs(midCvOffset), midNeckDy) * 180) / Math.PI
    cvaDeg = midCvOffset <= 0 ? 0 : Math.max(0, rawObliqueCv - 8.5)

    if (isVisibleNode(hipL, 0.3) && isVisibleNode(hipR, 0.3)) {
      const midHip = {
        x: ((hipL.x + hipR.x) / 2) * vb.width,
        y: ((hipL.y + hipR.y) / 2) * vb.height,
      }
      const midTrunkDx = Math.abs(midSh.x - midHip.x) / sinYaw
      const midTrunkDy = Math.max(1e-3, Math.abs(midHip.y - midSh.y))
      trunkLeanDeg = Math.max(0, ((Math.atan2(midTrunkDx, midTrunkDy) * 180) / Math.PI) - 1.5)
      shoulderDeltaDeg = Math.round(trunkLeanDeg * 10) / 10
    }
  } else {
    // Pure lateral standing view: calibrate tragion (7/8) vs. glenohumeral center (11/12) (~8.5° offset)
    const rawCvOffset = (landmarks.ear.x - landmarks.shoulder.x) * facingSign
    const rawCvDeg = computePlumbDeviationDeg(landmarks.shoulder, landmarks.ear)
    cvaDeg = rawCvOffset <= 0 ? 0 : Math.max(0, rawCvDeg - 8.5)

    if (!landmarks.hip.occluded) {
      const rawTrunkDeg = computePlumbDeviationDeg(landmarks.hip, landmarks.shoulder)
      trunkLeanDeg = Math.max(0, rawTrunkDeg - 1.5)
      const fwdShOffset = (landmarks.shoulder.x - landmarks.hip.x) * facingSign
      shoulderDeltaDeg =
        fwdShOffset > 0
          ? Math.round(rawTrunkDeg * 10) / 10
          : Math.round(Math.max(0, rawTrunkDeg - 3) * 10) / 10
    }

    if (!landmarks.hip.occluded && !landmarks.ankle.occluded) {
      const rawHipAnkleDeg = computePlumbDeviationDeg(landmarks.ankle, landmarks.hip)
      hipShiftDeg = Math.max(0, rawHipAnkleDeg - 2.5)
    }

    if (!landmarks.hip.occluded && !landmarks.knee.occluded && !landmarks.ankle.occluded) {
      const kneeInterior = computeThreePointAngleDeg(landmarks.hip, landmarks.knee, landmarks.ankle)
      kneeFlexionDeg = Math.max(0, Math.round((180 - kneeInterior) * 10) / 10)
    }
  }

  cvaDeg = Math.round(cvaDeg * 10) / 10
  const effectivePelvicTrunkDeg = Math.round(Math.max(trunkLeanDeg, hipShiftDeg * 0.9) * 10) / 10
  const kneePenaltyDeg = Math.max(0, kneeFlexionDeg - 7)

  // Compute 0-100 Standing Posture Alignment Score
  const penalty =
    Math.min(44, Math.max(0, cvaDeg - 3.0) * 2.0) +
    Math.min(32, Math.max(0, effectivePelvicTrunkDeg - 2.5) * 2.3) +
    Math.min(16, kneePenaltyDeg * 1.1)
  const score = Math.max(34, Math.min(99, Math.round(100 - penalty)))

  const strainFlag: StrainLevel =
    cvaDeg > 18 || effectivePelvicTrunkDeg > 10.5 || score < 60
      ? 'coral'
      : cvaDeg > 7.5 || effectivePelvicTrunkDeg > 4.5 || score < 86
        ? 'amber'
        : 'optimal'

  // Plumb line anchors through ankle (gravity base of support) when visible, otherwise hip/shoulder
  const plumbLineX =
    cameraAngle === 'frontal'
      ? Math.round((vb.width / 2) * 10) / 10
      : !landmarks.ankle.occluded
        ? landmarks.ankle.x
        : !landmarks.hip.occluded
          ? landmarks.hip.x
          : landmarks.shoulder.x

  const forwardHeadDeltaDeg = Number((cvaDeg - baselineCvaDeg).toFixed(1))
  const pelvicDriftDeg = Number((-Math.max(0.4, effectivePelvicTrunkDeg)).toFixed(1))

  return {
    score,
    strainFlag,
    cvaDeg,
    forwardHeadDeltaDeg,
    shoulderDeltaDeg: Number((-Math.max(0.3, shoulderDeltaDeg)).toFixed(1)),
    pelvicDriftDeg,
    kneeFlexionDeg,
    plumbLineX,
    facingSign,
    cameraAngle,
    trackedNodeCount,
    viewBox: vb,
    landmarks,
    allNodes,
  }
}

export function getStrainHexColor(strain: StrainLevel): string {
  return STRAIN_COLORS[strain]
}
