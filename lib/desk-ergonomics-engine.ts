import type { ErgonomicFlag, SavedWorkstationProfile, StrainLevel } from '@/lib/posture-profile-state'

/**
 * 33-point MediaPipe Pose landmark subset used for lateral seated desk ergonomics
 * (Coordinates normalized into isotropic viewport space; default 0..100, origin top-left).
 */
export interface SeatedPosePoint {
  index: number
  id: 'ear' | 'shoulder' | 'elbow' | 'wrist' | 'hip' | 'knee' | 'ankle'
  label: string
  x: number
  y: number
  confidence: number
  /** True when the joint was out of frame or occluded (e.g. knees under desk) and estimated */
  occluded?: boolean
}

export interface DeskJointAngleMetric {
  id: 'craniovertebral' | 'shoulder_protraction' | 'elbow_wrist' | 'seated_hip'
  title: string
  measuredDegrees: number
  neutralRangeLabel: string
  status: StrainLevel
  colorHex: string
  summary: string
}

export interface WorkstationAdjustment {
  id: string
  priority: 1 | 2 | 3
  area: 'Monitor & Gaze' | 'Chair & Armrests' | 'Pelvis & Hip Angle'
  headline: string
  instruction: string
}

export interface DeskErgonomicsScanResult {
  score: number // 0 - 100
  overallStrain: StrainLevel
  landmarks: Record<SeatedPosePoint['id'], SeatedPosePoint>
  plumbLineX: number
  angles: DeskJointAngleMetric[]
  ergonomicFlags: ErgonomicFlag[]
  adjustments: [WorkstationAdjustment, WorkstationAdjustment, WorkstationAdjustment]
  /** Isotropic SVG viewBox matching the analyzed image's true aspect ratio (defaults to 100x100) */
  viewBox?: { width: number; height: number }
  /** Detected camera orientation relative to the seated athlete */
  cameraAngle?: 'lateral' | 'oblique' | 'frontal'
  /** Count of anatomical landmarks directly visible in frame (out of 7) */
  trackedJointCount?: number
}

export interface DeskErgonomicsEvalOptions {
  viewBox?: { width: number; height: number }
  facingSign?: 1 | -1
  cameraAngle?: 'lateral' | 'oblique' | 'frontal'
  trackedJointCount?: number
  measuredOverrides?: {
    craniovertebralDeg?: number
    shoulderProtractionDeg?: number
    elbowAngleDeg?: number
    seatedHipAngleDeg?: number
  }
}

export const STRAIN_COLORS: Record<StrainLevel, string> = {
  optimal: '#10B981', // Emerald
  amber: '#F59E0B',   // Amber (Mild Strain)
  coral: '#FB7185',   // Coral (High Strain)
}

export const STRAIN_LABELS: Record<StrainLevel, string> = {
  optimal: 'Optimal',
  amber: 'Mild Strain',
  coral: 'High Strain',
}

/**
 * Computes interior angle (in degrees, 0..180) at vertex B formed by 2D segments BA and BC.
 */
export function computeThreePointAngleDeg(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): number {
  const bax = a.x - b.x
  const bay = a.y - b.y
  const bcx = c.x - b.x
  const bcy = c.y - b.y
  const magBA = Math.hypot(bax, bay)
  const magBC = Math.hypot(bcx, bcy)
  if (magBA < 1e-6 || magBC < 1e-6) return 90
  const cosTheta = Math.max(-1, Math.min(1, (bax * bcx + bay * bcy) / (magBA * magBC)))
  return Math.round(((Math.acos(cosTheta) * 180) / Math.PI) * 10) / 10
}

/**
 * Computes interior angle (in degrees, 0..180) at vertex B formed by 3D metric segments BA and BC.
 */
export function computeThreePoint3DAngleDeg(
  a: { x: number; y: number; z?: number },
  b: { x: number; y: number; z?: number },
  c: { x: number; y: number; z?: number }
): number {
  const az = a.z ?? 0
  const bz = b.z ?? 0
  const cz = c.z ?? 0
  const bax = a.x - b.x
  const bay = a.y - b.y
  const baz = az - bz
  const bcx = c.x - b.x
  const bcy = c.y - b.y
  const bcz = cz - bz
  const magBA = Math.hypot(bax, bay, baz)
  const magBC = Math.hypot(bcx, bcy, bcz)
  if (magBA < 1e-6 || magBC < 1e-6) return 90
  const cosTheta = Math.max(
    -1,
    Math.min(1, (bax * bcx + bay * bcy + baz * bcz) / (magBA * magBC))
  )
  return Math.round(((Math.acos(cosTheta) * 180) / Math.PI) * 10) / 10
}

/**
 * Computes acute deviation angle from a vertical plumb line passing through anchor `base` to `top`.
 */
export function computePlumbDeviationDeg(
  base: { x: number; y: number },
  top: { x: number; y: number }
): number {
  const dx = Math.abs(top.x - base.x)
  const dy = Math.max(1e-3, Math.abs(base.y - top.y))
  return Math.round(((Math.atan2(dx, dy) * 180) / Math.PI) * 10) / 10
}

function sanitizeSeatedPoint(
  pt: SeatedPosePoint | undefined,
  fallback: SeatedPosePoint,
  maxX = 100,
  maxY = 100
): SeatedPosePoint {
  if (!pt) return fallback
  const x = Number.isFinite(pt.x) ? Math.max(0, Math.min(maxX, pt.x)) : fallback.x
  const y = Number.isFinite(pt.y) ? Math.max(0, Math.min(maxY, pt.y)) : fallback.y
  const confidence = Number.isFinite(pt.confidence)
    ? Math.max(0, Math.min(1, pt.confidence))
    : fallback.confidence
  return {
    ...fallback,
    ...pt,
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
  }
}

/**
 * Evaluates 33-point seated lateral landmarks into 4 joint angle metrics, a 0-100 Workstation Ergonomics Score,
 * ergonomic flags (`forward_head`, `rounded_shoulders`, `hip_flexor_tightness`), and 3 concrete adjustments.
 */
export function evaluateDeskErgonomicsFromLandmarks(
  rawLandmarks: Record<SeatedPosePoint['id'], SeatedPosePoint>,
  options?: DeskErgonomicsEvalOptions
): DeskErgonomicsScanResult {
  const vbWidth = options?.viewBox?.width && Number.isFinite(options.viewBox.width) ? options.viewBox.width : 100
  const vbHeight = options?.viewBox?.height && Number.isFinite(options.viewBox.height) ? options.viewBox.height : 100
  const maxX = Math.max(100, vbWidth)
  const maxY = Math.max(100, vbHeight)

  const landmarks: Record<SeatedPosePoint['id'], SeatedPosePoint> = {
    ear: sanitizeSeatedPoint(rawLandmarks?.ear, SAMPLE_DESK_LANDMARKS.optimal_setup.ear, maxX, maxY),
    shoulder: sanitizeSeatedPoint(rawLandmarks?.shoulder, SAMPLE_DESK_LANDMARKS.optimal_setup.shoulder, maxX, maxY),
    elbow: sanitizeSeatedPoint(rawLandmarks?.elbow, SAMPLE_DESK_LANDMARKS.optimal_setup.elbow, maxX, maxY),
    wrist: sanitizeSeatedPoint(rawLandmarks?.wrist, SAMPLE_DESK_LANDMARKS.optimal_setup.wrist, maxX, maxY),
    hip: sanitizeSeatedPoint(rawLandmarks?.hip, SAMPLE_DESK_LANDMARKS.optimal_setup.hip, maxX, maxY),
    knee: sanitizeSeatedPoint(rawLandmarks?.knee, SAMPLE_DESK_LANDMARKS.optimal_setup.knee, maxX, maxY),
    ankle: sanitizeSeatedPoint(rawLandmarks?.ankle, SAMPLE_DESK_LANDMARKS.optimal_setup.ankle, maxX, maxY),
  }
  const { ear, shoulder, elbow, wrist, hip, knee } = landmarks

  // Determine facing direction (is subject facing right -> +1, or left -> -1)
  const facingSign = options?.facingSign ?? (knee.x >= hip.x ? 1 : -1)

  // 1. Craniovertebral / Forward Head Angle (ear vs. shoulder vertical plumb line)
  const rawForwardHeadOffset = (ear.x - shoulder.x) * facingSign
  const computedForwardHeadDeg =
    rawForwardHeadOffset <= 0
      ? Math.round(computePlumbDeviationDeg(shoulder, ear) * 0.4 * 10) / 10
      : computePlumbDeviationDeg(shoulder, ear)
  const forwardHeadDeg =
    options?.measuredOverrides?.craniovertebralDeg !== undefined
      ? Math.round(Math.max(0, options.measuredOverrides.craniovertebralDeg) * 10) / 10
      : computedForwardHeadDeg

  const cvStatus: StrainLevel =
    forwardHeadDeg <= 8 ? 'optimal' : forwardHeadDeg <= 20 ? 'amber' : 'coral'

  // 2. Shoulder Elevation & Protraction (forward rounding toward screen vs. gentle backrest recline)
  const rawShoulderForwardOffset = (shoulder.x - hip.x) * facingSign
  const rawTorsoPlumbDeg = computePlumbDeviationDeg(hip, shoulder)
  const protractionDeg =
    rawShoulderForwardOffset > 0
      ? rawTorsoPlumbDeg
      : Math.max(0, Math.round((rawTorsoPlumbDeg - 12) * 10) / 10)
  const neckGap = Math.abs(shoulder.y - ear.y)
  const torsoVerticalSpan = Math.abs(hip.y - shoulder.y)
  // Scale relaxed neck-to-shoulder vertical threshold proportionally when subject sits further from lens
  const minRelaxedNeckGap =
    torsoVerticalSpan > 8 ? Math.min(11, Math.max(4.5, torsoVerticalSpan * 0.3)) : 11
  const elevationPenaltyDeg =
    neckGap < minRelaxedNeckGap
      ? Math.round((minRelaxedNeckGap - neckGap) * 1.5 * 10) / 10
      : 0
  const computedShoulderDeg = Math.round((protractionDeg + elevationPenaltyDeg) * 10) / 10
  const effectiveShoulderDeg =
    options?.measuredOverrides?.shoulderProtractionDeg !== undefined
      ? Math.round(Math.max(0, options.measuredOverrides.shoulderProtractionDeg) * 10) / 10
      : computedShoulderDeg

  const shoulderStatus: StrainLevel =
    effectiveShoulderDeg <= 7 ? 'optimal' : effectiveShoulderDeg <= 14 ? 'amber' : 'coral'

  // 3. Elbow & Wrist Desk Angle (shoulder -> elbow -> wrist vs. 90°–115° neutral)
  const armOccluded = Boolean(elbow.occluded || wrist.occluded)
  const elbowAngleDeg =
    options?.measuredOverrides?.elbowAngleDeg !== undefined
      ? Math.round(options.measuredOverrides.elbowAngleDeg * 10) / 10
      : armOccluded
        ? 98
        : computeThreePointAngleDeg(shoulder, elbow, wrist)
  const elbowDistFromNeutral =
    elbowAngleDeg >= 90 && elbowAngleDeg <= 115
      ? 0
      : elbowAngleDeg < 90
        ? 90 - elbowAngleDeg
        : elbowAngleDeg - 115

  const elbowStatus: StrainLevel =
    elbowDistFromNeutral <= 5 ? 'optimal' : elbowDistFromNeutral <= 18 ? 'amber' : 'coral'

  // 4. Seated Pelvic & Hip Angle (shoulder -> hip -> knee vs. 95°–110° neutral)
  const hipOrKneeOccluded = Boolean(hip.occluded || knee.occluded)
  const hipAngleDeg =
    options?.measuredOverrides?.seatedHipAngleDeg !== undefined
      ? Math.round(options.measuredOverrides.seatedHipAngleDeg * 10) / 10
      : hipOrKneeOccluded
        ? 100
        : computeThreePointAngleDeg(shoulder, hip, knee)
  const hipDistFromNeutral =
    hipAngleDeg >= 95 && hipAngleDeg <= 110
      ? 0
      : hipAngleDeg < 95
        ? 95 - hipAngleDeg
        : hipAngleDeg - 110

  const hipStatus: StrainLevel =
    hipDistFromNeutral <= 4 ? 'optimal' : hipDistFromNeutral <= 12 ? 'amber' : 'coral'

  const angles: DeskJointAngleMetric[] = [
    {
      id: 'craniovertebral',
      title: 'Forward Head / Craniovertebral',
      measuredDegrees: forwardHeadDeg,
      neutralRangeLabel: '0°–8° plumb',
      status: cvStatus,
      colorHex: STRAIN_COLORS[cvStatus],
      summary:
        cvStatus === 'optimal'
          ? 'Ear stacked cleanly over shoulder.'
          : cvStatus === 'amber'
            ? `Head drifts ${forwardHeadDeg}° forward toward screen.`
            : `Pronounced ${forwardHeadDeg}° forward head load on cervical spine.`,
    },
    {
      id: 'shoulder_protraction',
      title: 'Shoulder Elevation & Protraction',
      measuredDegrees: effectiveShoulderDeg,
      neutralRangeLabel: '0°–7° stacked',
      status: shoulderStatus,
      colorHex: STRAIN_COLORS[shoulderStatus],
      summary:
        shoulderStatus === 'optimal'
          ? 'Shoulders relaxed and aligned over hips.'
          : shoulderStatus === 'amber'
            ? 'Mild upper-trap elevation and forward rounding.'
            : 'Shoulders protracted and elevated reaching for keyboard.',
    },
    {
      id: 'elbow_wrist',
      title: 'Elbow & Wrist Desk Angle',
      measuredDegrees: elbowAngleDeg,
      neutralRangeLabel: '90°–115° neutral',
      status: elbowStatus,
      colorHex: STRAIN_COLORS[elbowStatus],
      summary:
        armOccluded && options?.measuredOverrides?.elbowAngleDeg === undefined
          ? 'Forearms occluded by desk — neutral 98° reference applied.'
          : elbowStatus === 'optimal'
            ? `Forearms supported at ${elbowAngleDeg}° neutral reach.`
            : elbowAngleDeg < 90
              ? `Desk too high (${elbowAngleDeg}° compressed elbow angle).`
              : `Keyboard too far forward (${elbowAngleDeg}° extended reach).`,
    },
    {
      id: 'seated_hip',
      title: 'Seated Pelvic & Hip Angle',
      measuredDegrees: hipAngleDeg,
      neutralRangeLabel: '95°–110° open',
      status: hipStatus,
      colorHex: STRAIN_COLORS[hipStatus],
      summary:
        hipOrKneeOccluded && options?.measuredOverrides?.seatedHipAngleDeg === undefined
          ? 'Knees under desk — neutral 100° hip reference applied.'
          : hipStatus === 'optimal'
            ? `Open ${hipAngleDeg}° hip angle supports neutral lumbar curve.`
            : hipAngleDeg < 95
              ? `Closed ${hipAngleDeg}° hip angle shortens hip flexors.`
              : `Slouched ${hipAngleDeg}° posterior pelvic tilt flattens low back.`,
    },
  ]

  // Ergonomic flags for 5-Min Desk Reset drill pre-loading
  const ergonomicFlags: ErgonomicFlag[] = []
  if (cvStatus !== 'optimal') ergonomicFlags.push('forward_head')
  if (shoulderStatus !== 'optimal' || elbowStatus === 'coral') ergonomicFlags.push('rounded_shoulders')
  if (hipStatus !== 'optimal') ergonomicFlags.push('hip_flexor_tightness')

  // Compute 0-100 Workstation Ergonomics Score
  const penalty =
    Math.min(30, Math.max(0, forwardHeadDeg - 5) * 1.4) +
    Math.min(25, Math.max(0, effectiveShoulderDeg - 5) * 1.3) +
    Math.min(20, elbowDistFromNeutral * 1.0) +
    Math.min(25, hipDistFromNeutral * 1.2)
  const score = Math.max(32, Math.min(99, Math.round(100 - penalty)))

  const overallStrain: StrainLevel =
    angles.some(a => a.status === 'coral')
      ? 'coral'
      : angles.some(a => a.status === 'amber')
        ? 'amber'
        : 'optimal'

  // 3 Concrete Workstation Adjustments
  const adjustments: [WorkstationAdjustment, WorkstationAdjustment, WorkstationAdjustment] = [
    {
      id: 'adj-monitor',
      priority: 1,
      area: 'Monitor & Gaze',
      headline:
        cvStatus === 'optimal'
          ? 'Keep top third of monitor at eye height'
          : `Raise screen ${cvStatus === 'coral' ? '3–4 inches' : '1.5–2 inches'} & bring to arm's length`,
      instruction:
        cvStatus === 'optimal'
          ? 'Maintain screen distance ~22–26 inches from eyes so chin stays gently tucked.'
          : 'Place a riser or laptop stand so the top bezel meets horizontal eye level and use an external keyboard.',
    },
    {
      id: 'adj-elbows',
      priority: 2,
      area: 'Chair & Armrests',
      headline:
        elbowStatus === 'optimal' && shoulderStatus === 'optimal'
          ? 'Keep keyboard 4 inches from desk edge'
          : elbowAngleDeg < 90
            ? 'Raise chair 1–2 inches so elbows open to 95°–100°'
            : 'Slide keyboard 3–4 inches closer to relax upper traps',
      instruction:
        'Set armrests just beneath relaxed elbows so shoulders drop away from ears with wrists flat.',
    },
    {
      id: 'adj-hips',
      priority: 3,
      area: 'Pelvis & Hip Angle',
      headline:
        hipStatus === 'optimal'
          ? 'Maintain slight open hip wedge (95°–105°)'
          : hipAngleDeg < 95
            ? 'Elevate seat pan slightly so hips sit 1–2 inches above knees'
            : 'Sit back against lumbar support with feet flat on floor or footrest',
      instruction:
        'Unlocks psoas tension and preserves natural lumbar curve during deep-focus blocks.',
    },
  ]

  return {
    score,
    overallStrain,
    landmarks,
    plumbLineX: hip.occluded ? shoulder.x : hip.x,
    angles,
    ergonomicFlags,
    adjustments,
    ...(options?.viewBox ? { viewBox: options.viewBox } : {}),
    ...(options?.cameraAngle ? { cameraAngle: options.cameraAngle } : {}),
    ...(options?.trackedJointCount !== undefined ? { trackedJointCount: options.trackedJointCount } : {}),
  }
}

export const SAMPLE_DESK_LANDMARKS: Record<
  'typical_strain' | 'optimal_setup',
  Record<SeatedPosePoint['id'], SeatedPosePoint>
> = {
  typical_strain: {
    ear: { index: 8, id: 'ear', label: 'Right Ear (7/8)', x: 47.5, y: 20, confidence: 0.97 },
    shoulder: { index: 12, id: 'shoulder', label: 'Right Shoulder (11/12)', x: 38.5, y: 34, confidence: 0.96 },
    elbow: { index: 14, id: 'elbow', label: 'Right Elbow (13/14)', x: 44, y: 53, confidence: 0.95 },
    wrist: { index: 16, id: 'wrist', label: 'Right Wrist (15/16)', x: 63, y: 49, confidence: 0.94 },
    hip: { index: 24, id: 'hip', label: 'Right Hip (23/24)', x: 34, y: 63, confidence: 0.96 },
    knee: { index: 26, id: 'knee', label: 'Right Knee (25/26)', x: 61, y: 60, confidence: 0.95 },
    ankle: { index: 28, id: 'ankle', label: 'Right Ankle (27/28)', x: 62, y: 88, confidence: 0.92 },
  },
  optimal_setup: {
    ear: { index: 8, id: 'ear', label: 'Right Ear (7/8)', x: 37.5, y: 19, confidence: 0.98 },
    shoulder: { index: 12, id: 'shoulder', label: 'Right Shoulder (11/12)', x: 36.5, y: 35, confidence: 0.97 },
    elbow: { index: 14, id: 'elbow', label: 'Right Elbow (13/14)', x: 38, y: 54, confidence: 0.96 },
    wrist: { index: 16, id: 'wrist', label: 'Right Wrist (15/16)', x: 56, y: 55, confidence: 0.96 },
    hip: { index: 24, id: 'hip', label: 'Right Hip (23/24)', x: 35.5, y: 63, confidence: 0.97 },
    knee: { index: 26, id: 'knee', label: 'Right Knee (25/26)', x: 62, y: 67, confidence: 0.96 },
    ankle: { index: 28, id: 'ankle', label: 'Right Ankle (27/28)', x: 62, y: 89, confidence: 0.94 },
  },
}

export function computeIsotropicViewBox(
  imageWidth?: number,
  imageHeight?: number
): { width: number; height: number } {
  if (
    !imageWidth ||
    !imageHeight ||
    !Number.isFinite(imageWidth) ||
    !Number.isFinite(imageHeight) ||
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    return { width: 100, height: 100 }
  }
  const aspect = Math.max(0.45, Math.min(2.4, imageWidth / imageHeight))
  if (aspect >= 1) {
    return { width: Math.round(aspect * 1000) / 10, height: 100 }
  }
  return { width: 100, height: Math.round((100 / aspect) * 10) / 10 }
}

function isLandmarkVisibleInFrame(
  lm: { x: number; y: number; visibility?: number } | undefined,
  minVisibility = 0.3
): boolean {
  if (!lm || !Number.isFinite(lm.x) || !Number.isFinite(lm.y)) return false
  const vis = Number.isFinite(lm.visibility) ? (lm.visibility as number) : 0.85
  return vis >= minVisibility && lm.x >= -0.02 && lm.x <= 1.02 && lm.y >= -0.02 && lm.y <= 0.99
}

/**
 * Maps MediaPipe 33-point normalized landmarks (0..1) into isotropic viewport space.
 * Selects whichever side profile (left vs. right) has higher visibility/confidence.
 */
export function mapMediaPipe33LandmarksToSeated(
  mpLandmarks: Array<{ x: number; y: number; visibility?: number }>,
  options?: { imageWidth?: number; imageHeight?: number }
): Record<SeatedPosePoint['id'], SeatedPosePoint> | null {
  if (!Array.isArray(mpLandmarks) || mpLandmarks.length < 29) return null

  const vb = computeIsotropicViewBox(options?.imageWidth, options?.imageHeight)
  const leftConf =
    (mpLandmarks[7]?.visibility ?? 0.5) +
    (mpLandmarks[11]?.visibility ?? 0.5) +
    (mpLandmarks[13]?.visibility ?? 0.4) * 0.5 +
    (mpLandmarks[23]?.visibility ?? 0.5)
  const rightConf =
    (mpLandmarks[8]?.visibility ?? 0.5) +
    (mpLandmarks[12]?.visibility ?? 0.5) +
    (mpLandmarks[14]?.visibility ?? 0.4) * 0.5 +
    (mpLandmarks[24]?.visibility ?? 0.5)
  const useRight = rightConf >= leftConf

  const idx = useRight
    ? { ear: 8, shoulder: 12, elbow: 14, wrist: 16, hip: 24, knee: 26, ankle: 28 }
    : { ear: 7, shoulder: 11, elbow: 13, wrist: 15, hip: 23, knee: 25, ankle: 27 }

  const sidePrefix = useRight ? 'Right' : 'Left'
  const toPt = (
    key: SeatedPosePoint['id'],
    labelSuffix: string,
    minVis = 0.28
  ): SeatedPosePoint => {
    const raw = mpLandmarks[idx[key]]
    const visible = isLandmarkVisibleInFrame(raw, minVis)
    const safeX = raw && Number.isFinite(raw.x) ? raw.x : 0.5
    const safeY = raw && Number.isFinite(raw.y) ? raw.y : 0.5
    const safeVis =
      raw && Number.isFinite(raw.visibility) ? (raw.visibility as number) : 0.88
    return {
      index: idx[key],
      id: key,
      label: `${sidePrefix} ${labelSuffix}`,
      x: Math.round(Math.max(1.5, Math.min(vb.width - 1.5, safeX * vb.width)) * 10) / 10,
      y: Math.round(Math.max(1.5, Math.min(vb.height - 1.5, safeY * vb.height)) * 10) / 10,
      confidence: Math.round(Math.max(0, Math.min(1, safeVis)) * 100) / 100,
      occluded: !visible,
    }
  }

  return {
    ear: toPt('ear', 'Ear', 0.25),
    shoulder: toPt('shoulder', 'Shoulder', 0.25),
    elbow: toPt('elbow', 'Elbow', 0.28),
    wrist: toPt('wrist', 'Wrist', 0.25),
    hip: toPt('hip', 'Hip', 0.25),
    knee: toPt('knee', 'Knee', 0.32),
    ankle: toPt('ankle', 'Ankle', 0.3),
  }
}

/**
 * Full camera-aware MediaPipe seated posture evaluator.
 * - Preserves exact 1:1 isotropic pixel alignment with the captured/uploaded photo (`viewBox`).
 * - Handles lateral side-profile, 3/4 oblique desk views (canceling shoulder-width yaw bias via
 *   bilateral spinal midpoints), frontal laptop webcams (via 3D metric `worldLandmarks`), and
 *   under-desk knee/arm occlusion without inventing fake penalties.
 */
export function evaluateMediaPipeSeatedPose(
  mpLandmarks: Array<{ x: number; y: number; z?: number; visibility?: number }>,
  options?: {
    imageWidth?: number
    imageHeight?: number
    worldLandmarks?: Array<{ x: number; y: number; z?: number; visibility?: number }>
  }
): DeskErgonomicsScanResult | null {
  const vb = computeIsotropicViewBox(options?.imageWidth, options?.imageHeight)
  const mapped = mapMediaPipe33LandmarksToSeated(mpLandmarks, {
    imageWidth: options?.imageWidth,
    imageHeight: options?.imageHeight,
  })
  if (!mapped) return null

  // Require at least the head/ear and shoulder to be meaningfully visible in the image
  if (mapped.ear.occluded && mapped.shoulder.occluded) {
    return null
  }

  const nose = mpLandmarks[0]
  const earL = mpLandmarks[7]
  const earR = mpLandmarks[8]
  const shL = mpLandmarks[11]
  const shR = mpLandmarks[12]
  const hipL = mpLandmarks[23]
  const hipR = mpLandmarks[24]

  // Determine facing direction (+1 right, -1 left) from head gaze, forearm reach, and visible thigh
  let dirScore = 0
  const chosenEarRaw = mpLandmarks[mapped.ear.index]
  if (
    nose &&
    chosenEarRaw &&
    Number.isFinite(nose.x) &&
    Number.isFinite(chosenEarRaw.x) &&
    (nose.visibility ?? 0.8) >= 0.3
  ) {
    dirScore += (nose.x - chosenEarRaw.x) * 2.5
  }
  if (!mapped.wrist.occluded && !mapped.shoulder.occluded) {
    dirScore += ((mapped.wrist.x - mapped.shoulder.x) / vb.width) * 1.2
  }
  if (!mapped.knee.occluded && !mapped.hip.occluded) {
    dirScore += ((mapped.knee.x - mapped.hip.x) / vb.width) * 1.5
  }
  const facingSign: 1 | -1 = dirScore >= 0 ? 1 : -1

  // If hip is cropped below the frame (e.g. chest-up laptop shot), place reference hip below shoulder
  if (mapped.hip.occluded) {
    const neckSpan = Math.max(8, Math.abs(mapped.shoulder.y - mapped.ear.y))
    mapped.hip = {
      ...mapped.hip,
      x: mapped.shoulder.x,
      y: Math.min(vb.height - 2, Math.round((mapped.shoulder.y + neckSpan * 1.95) * 10) / 10),
      occluded: true,
    }
  }
  // If knee is occluded under the desk, keep reference knee aligned with facingSign so direction never flips
  if (mapped.knee.occluded) {
    mapped.knee = {
      ...mapped.knee,
      x: Math.max(
        2,
        Math.min(vb.width - 2, Math.round((mapped.hip.x + facingSign * 24) * 10) / 10)
      ),
      y: Math.min(vb.height - 2, Math.round((mapped.hip.y + 3) * 10) / 10),
      occluded: true,
    }
    mapped.ankle = {
      ...mapped.ankle,
      x: mapped.knee.x,
      y: Math.min(vb.height - 1.5, Math.round((mapped.knee.y + 22) * 10) / 10),
      occluded: true,
    }
  }

  // Classify camera angle: lateral (side profile) vs oblique (3/4 angle) vs frontal (straight-on webcam)
  const bothShouldersVisible =
    isLandmarkVisibleInFrame(shL, 0.45) && isLandmarkVisibleInFrame(shR, 0.45)
  const bothEarsVisible =
    isLandmarkVisibleInFrame(earL, 0.35) && isLandmarkVisibleInFrame(earR, 0.35)

  const shoulderSpanX = bothShouldersVisible ? Math.abs(shL.x - shR.x) * vb.width : 0
  const midEarY =
    bothEarsVisible
      ? ((earL.y + earR.y) / 2) * vb.height
      : mapped.ear.y
  const midShY =
    bothShouldersVisible
      ? ((shL.y + shR.y) / 2) * vb.height
      : mapped.shoulder.y
  const headNeckSpanY = Math.max(5, Math.abs(midShY - midEarY))
  const minShX = bothShouldersVisible ? Math.min(shL.x, shR.x) : 0
  const maxShX = bothShouldersVisible ? Math.max(shL.x, shR.x) : 0
  const noseBetweenShoulders =
    bothShouldersVisible &&
    nose &&
    Number.isFinite(nose.x) &&
    nose.x > minShX + (maxShX - minShX) * 0.22 &&
    nose.x < maxShX - (maxShX - minShX) * 0.22

  let cameraAngle: 'lateral' | 'oblique' | 'frontal' = 'lateral'
  if (bothShouldersVisible && shoulderSpanX > headNeckSpanY * 1.2 && noseBetweenShoulders) {
    cameraAngle = 'frontal'
  } else if (bothShouldersVisible && shoulderSpanX > headNeckSpanY * 0.48) {
    cameraAngle = 'oblique'
  }

  const measuredOverrides: NonNullable<DeskErgonomicsEvalOptions['measuredOverrides']> = {}
  const world = options?.worldLandmarks
  const hasWorld = Array.isArray(world) && world.length >= 29

  if (cameraAngle === 'frontal') {
    // Frontal webcam: horizontal X difference between ear and shoulder reflects clavicle width, NOT forward head!
    // Measure sagittal posture from 3D metric worldLandmarks + cervical foreshortening ratio.
    const neckRatio2D = headNeckSpanY / Math.max(10, shoulderSpanX)
    const foreshortenCvDeg = Math.max(0, (0.37 - neckRatio2D) * 75)

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
      const forwardHeadMeters = (wEar.x - wSh.x) * fx + (wEar.z - wSh.z) * fz
      const neckHeightMeters = Math.max(0.08, Math.abs(wSh.y - wEar.y))
      // Subtract ~5.5° anatomical GHUM 3D tragion-to-glenohumeral baseline offset
      const rawWorldCvDeg = Math.max(
        0,
        ((Math.atan2(Math.max(0, forwardHeadMeters), neckHeightMeters) * 180) / Math.PI) - 5.5
      )
      measuredOverrides.craniovertebralDeg = Math.max(rawWorldCvDeg, foreshortenCvDeg)

      if (world[23] && world[24]) {
        const wHip = {
          x: (world[23].x + world[24].x) / 2,
          y: (world[23].y + world[24].y) / 2,
          z: ((world[23].z ?? 0) + (world[24].z ?? 0)) / 2,
        }
        const forwardTrunkMeters = (wSh.x - wHip.x) * fx + (wSh.z - wHip.z) * fz
        const trunkHeightMeters = Math.max(0.18, Math.abs(wHip.y - wSh.y))
        const rawWorldTrunkDeg =
          forwardTrunkMeters > 0
            ? (Math.atan2(forwardTrunkMeters, trunkHeightMeters) * 180) / Math.PI
            : 0
        const shrugDeg = Math.max(0, (0.34 - neckRatio2D) * 45)
        measuredOverrides.shoulderProtractionDeg = rawWorldTrunkDeg + shrugDeg
      }
    } else {
      measuredOverrides.craniovertebralDeg = foreshortenCvDeg
      measuredOverrides.shoulderProtractionDeg = Math.max(0, (0.34 - neckRatio2D) * 45)
    }

    if (hasWorld && !mapped.elbow.occluded && !mapped.wrist.occluded) {
      const sIdx = mapped.shoulder.index
      const eIdx = mapped.elbow.index
      const wIdx = mapped.wrist.index
      if (world[sIdx] && world[eIdx] && world[wIdx]) {
        measuredOverrides.elbowAngleDeg = computeThreePoint3DAngleDeg(
          world[sIdx],
          world[eIdx],
          world[wIdx]
        )
      }
    }
    if (hasWorld && !mapped.hip.occluded && !mapped.knee.occluded) {
      const sIdx = mapped.shoulder.index
      const hIdx = mapped.hip.index
      const kIdx = mapped.knee.index
      if (world[sIdx] && world[hIdx] && world[kIdx]) {
        measuredOverrides.seatedHipAngleDeg = computeThreePoint3DAngleDeg(
          world[sIdx],
          world[hIdx],
          world[kIdx]
        )
      }
    }
  } else if (cameraAngle === 'oblique') {
    // 3/4 oblique desk view: bilateral spinal midpoints cancel out clavicle/pelvic width yaw offset!
    const midEar = bothEarsVisible
      ? { x: ((earL.x + earR.x) / 2) * vb.width, y: ((earL.y + earR.y) / 2) * vb.height }
      : mapped.ear
    const midSh = {
      x: ((shL.x + shR.x) / 2) * vb.width,
      y: ((shL.y + shR.y) / 2) * vb.height,
    }
    // Estimate sin(yaw) foreshortening factor so oblique angles match true 90° sagittal degrees
    const estFullBiacromial = headNeckSpanY * 1.95
    const cosYaw = Math.min(0.75, shoulderSpanX / Math.max(12, estFullBiacromial))
    const sinYaw = Math.max(0.55, Math.sqrt(Math.max(0.3, 1 - cosYaw * cosYaw)))

    const midCvOffset = ((midEar.x - midSh.x) * facingSign) / sinYaw
    const midNeckDy = Math.max(1e-3, Math.abs(midSh.y - midEar.y))
    const rawObliqueCvDeg = (Math.atan2(Math.abs(midCvOffset), midNeckDy) * 180) / Math.PI
    let obliqueBackrestReclineDeg = 0
    if (isLandmarkVisibleInFrame(hipL, 0.3) && isLandmarkVisibleInFrame(hipR, 0.3)) {
      const midHip = {
        x: ((hipL.x + hipR.x) / 2) * vb.width,
        y: ((hipL.y + hipR.y) / 2) * vb.height,
      }
      const midTrunkOffset = ((midSh.x - midHip.x) * facingSign) / sinYaw
      const midTrunkDy = Math.max(1e-3, Math.abs(midHip.y - midSh.y))
      const rawObliqueTrunkDeg =
        (Math.atan2(Math.abs(midTrunkOffset), midTrunkDy) * 180) / Math.PI
      if (midTrunkOffset < 0) {
        obliqueBackrestReclineDeg = Math.min(10, rawObliqueTrunkDeg)
      }
      const protraction =
        midTrunkOffset > 0 ? rawObliqueTrunkDeg : Math.max(0, rawObliqueTrunkDeg - 12)
      measuredOverrides.shoulderProtractionDeg = protraction
    }
    // Subtract ~9.5° human anatomical tragion-to-glenohumeral offset + gentle backrest recline balance
    measuredOverrides.craniovertebralDeg =
      midCvOffset <= 0
        ? 0
        : Math.max(0, rawObliqueCvDeg - 9.5 - obliqueBackrestReclineDeg * 0.7)

    // Use 3D metric interior angles for elbow & hip in oblique views to avoid 2D perspective foreshortening
    if (hasWorld && !mapped.elbow.occluded && !mapped.wrist.occluded) {
      const sIdx = mapped.shoulder.index
      const eIdx = mapped.elbow.index
      const wIdx = mapped.wrist.index
      if (world[sIdx] && world[eIdx] && world[wIdx]) {
        measuredOverrides.elbowAngleDeg = computeThreePoint3DAngleDeg(
          world[sIdx],
          world[eIdx],
          world[wIdx]
        )
      }
    }
    if (hasWorld && !mapped.hip.occluded && !mapped.knee.occluded) {
      const sIdx = mapped.shoulder.index
      const hIdx = mapped.hip.index
      const kIdx = mapped.knee.index
      if (world[sIdx] && world[hIdx] && world[kIdx]) {
        measuredOverrides.seatedHipAngleDeg = computeThreePoint3DAngleDeg(
          world[sIdx],
          world[hIdx],
          world[kIdx]
        )
      }
    }
  } else {
    // Lateral side-profile: calibrate MediaPipe's glenohumeral shoulder center (11/12) vs. tragion ear (7/8).
    // In upright human anatomy, tragion sits ~9.5° anterior to the glenohumeral joint center, plus gentle
    // backrest recline shifts the shoulder behind the hip plumb while the head stays level over the pelvis.
    const rawLateralCvOffset = (mapped.ear.x - mapped.shoulder.x) * facingSign
    const rawLateralCvDeg = computePlumbDeviationDeg(mapped.shoulder, mapped.ear)
    const rawTrunkOffset = (mapped.shoulder.x - mapped.hip.x) * facingSign
    const backrestReclineDeg =
      !mapped.hip.occluded && rawTrunkOffset < 0
        ? Math.min(10, computePlumbDeviationDeg(mapped.hip, mapped.shoulder))
        : 0
    measuredOverrides.craniovertebralDeg =
      rawLateralCvOffset <= 0
        ? 0
        : Math.max(0, rawLateralCvDeg - 9.5 - backrestReclineDeg * 0.7)
  }

  const trackedJointCount = Object.values(mapped).filter(pt => !pt.occluded).length

  return evaluateDeskErgonomicsFromLandmarks(mapped, {
    viewBox: vb,
    facingSign,
    cameraAngle,
    trackedJointCount,
    measuredOverrides,
  })
}

/**
 * Reconstructs a full visual + clinical `DeskErgonomicsScanResult` from a persisted `SavedWorkstationProfile`
 * so users can toggle between saved desks ("Home Desk", "Office Standing Desk") and inspect their metrics.
 */
export function reconstructScanFromSavedWorkstation(
  profile: SavedWorkstationProfile
): DeskErgonomicsScanResult {
  const baseTemplate =
    profile.strainLevel === 'optimal'
      ? SAMPLE_DESK_LANDMARKS.optimal_setup
      : SAMPLE_DESK_LANDMARKS.typical_strain

  const baseEval = evaluateDeskErgonomicsFromLandmarks(baseTemplate)
  const cvDeg = profile.craniovertebralDeg
  const shoulderDeg = profile.shoulderProtractionDeg
  const elbowDeg = profile.elbowAngleDeg
  const hipDeg = profile.seatedHipAngleDeg

  const cvStatus: StrainLevel = cvDeg <= 8 ? 'optimal' : cvDeg <= 20 ? 'amber' : 'coral'
  const shoulderStatus: StrainLevel =
    shoulderDeg <= 7 ? 'optimal' : shoulderDeg <= 14 ? 'amber' : 'coral'
  const elbowDist =
    elbowDeg >= 90 && elbowDeg <= 115 ? 0 : elbowDeg < 90 ? 90 - elbowDeg : elbowDeg - 115
  const elbowStatus: StrainLevel =
    elbowDist <= 5 ? 'optimal' : elbowDist <= 18 ? 'amber' : 'coral'
  const hipDist =
    hipDeg >= 95 && hipDeg <= 110 ? 0 : hipDeg < 95 ? 95 - hipDeg : hipDeg - 110
  const hipStatus: StrainLevel = hipDist <= 4 ? 'optimal' : hipDist <= 12 ? 'amber' : 'coral'

  const angles: DeskJointAngleMetric[] = [
    {
      ...baseEval.angles[0],
      measuredDegrees: cvDeg,
      status: cvStatus,
      colorHex: STRAIN_COLORS[cvStatus],
    },
    {
      ...baseEval.angles[1],
      measuredDegrees: shoulderDeg,
      status: shoulderStatus,
      colorHex: STRAIN_COLORS[shoulderStatus],
    },
    {
      ...baseEval.angles[2],
      measuredDegrees: elbowDeg,
      status: elbowStatus,
      colorHex: STRAIN_COLORS[elbowStatus],
    },
    {
      ...baseEval.angles[3],
      measuredDegrees: hipDeg,
      status: hipStatus,
      colorHex: STRAIN_COLORS[hipStatus],
    },
  ]

  return {
    ...baseEval,
    score: profile.score,
    overallStrain: profile.strainLevel,
    angles,
    ergonomicFlags: Array.isArray(profile.ergonomicFlags) ? profile.ergonomicFlags : [],
  }
}
