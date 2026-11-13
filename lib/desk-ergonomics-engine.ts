import type { ErgonomicFlag, StrainLevel } from '@/lib/posture-profile-state'

/**
 * 33-point MediaPipe Pose landmark subset used for lateral seated desk ergonomics
 * (Coordinates normalized 0..100 in viewport space; origin top-left).
 */
export interface SeatedPosePoint {
  index: number
  id: 'ear' | 'shoulder' | 'elbow' | 'wrist' | 'hip' | 'knee' | 'ankle'
  label: string
  x: number
  y: number
  confidence: number
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
 * Computes interior angle (in degrees, 0..180) at vertex B formed by segments BA and BC.
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

/**
 * Evaluates 33-point seated lateral landmarks into 4 joint angle metrics, a 0-100 Workstation Ergonomics Score,
 * ergonomic flags (`forward_head`, `rounded_shoulders`, `hip_flexor_tightness`), and 3 concrete adjustments.
 */
export function evaluateDeskErgonomicsFromLandmarks(
  landmarks: Record<SeatedPosePoint['id'], SeatedPosePoint>
): DeskErgonomicsScanResult {
  const { ear, shoulder, elbow, wrist, hip, knee } = landmarks

  // Determine facing direction (is subject facing right -> knee.x > hip.x, or left -> knee.x < hip.x)
  const facingSign = knee.x >= hip.x ? 1 : -1

  // 1. Craniovertebral / Forward Head Angle (ear vs. shoulder vertical plumb line)
  const rawForwardHeadOffset = (ear.x - shoulder.x) * facingSign
  const forwardHeadDeg =
    rawForwardHeadOffset <= 0
      ? Math.round(computePlumbDeviationDeg(shoulder, ear) * 0.4 * 10) / 10
      : computePlumbDeviationDeg(shoulder, ear)

  const cvStatus: StrainLevel =
    forwardHeadDeg <= 8 ? 'optimal' : forwardHeadDeg <= 16 ? 'amber' : 'coral'

  // 2. Shoulder Elevation & Protraction (shoulder relative to ear & hip plumb line)
  const protractionDeg = computePlumbDeviationDeg(hip, shoulder)
  const neckGap = Math.abs(shoulder.y - ear.y)
  const elevationPenaltyDeg = neckGap < 11 ? Math.round((11 - neckGap) * 1.5 * 10) / 10 : 0
  const effectiveShoulderDeg = Math.round((protractionDeg + elevationPenaltyDeg) * 10) / 10

  const shoulderStatus: StrainLevel =
    effectiveShoulderDeg <= 7 ? 'optimal' : effectiveShoulderDeg <= 14 ? 'amber' : 'coral'

  // 3. Elbow & Wrist Desk Angle (shoulder -> elbow -> wrist vs. 90°–105° neutral)
  const elbowAngleDeg = computeThreePointAngleDeg(shoulder, elbow, wrist)
  const elbowDistFromNeutral =
    elbowAngleDeg >= 90 && elbowAngleDeg <= 105
      ? 0
      : elbowAngleDeg < 90
        ? 90 - elbowAngleDeg
        : elbowAngleDeg - 105

  const elbowStatus: StrainLevel =
    elbowDistFromNeutral <= 4 ? 'optimal' : elbowDistFromNeutral <= 14 ? 'amber' : 'coral'

  // 4. Seated Pelvic & Hip Angle (shoulder -> hip -> knee vs. 95°–110° neutral)
  const hipAngleDeg = computeThreePointAngleDeg(shoulder, hip, knee)
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
      neutralRangeLabel: '90°–105° neutral',
      status: elbowStatus,
      colorHex: STRAIN_COLORS[elbowStatus],
      summary:
        elbowStatus === 'optimal'
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
        hipStatus === 'optimal'
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
    plumbLineX: hip.x,
    angles,
    ergonomicFlags,
    adjustments,
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

/**
 * Maps MediaPipe 33-point normalized landmarks (0..1) into our 0..100 viewport space.
 * Selects whichever side profile (left vs. right) has higher visibility/confidence.
 */
export function mapMediaPipe33LandmarksToSeated(
  mpLandmarks: Array<{ x: number; y: number; visibility?: number }>
): Record<SeatedPosePoint['id'], SeatedPosePoint> | null {
  if (!Array.isArray(mpLandmarks) || mpLandmarks.length < 29) return null

  const leftConf = (mpLandmarks[7]?.visibility ?? 0.5) + (mpLandmarks[11]?.visibility ?? 0.5) + (mpLandmarks[23]?.visibility ?? 0.5)
  const rightConf = (mpLandmarks[8]?.visibility ?? 0.5) + (mpLandmarks[12]?.visibility ?? 0.5) + (mpLandmarks[24]?.visibility ?? 0.5)
  const useRight = rightConf >= leftConf

  const idx = useRight
    ? { ear: 8, shoulder: 12, elbow: 14, wrist: 16, hip: 24, knee: 26, ankle: 28 }
    : { ear: 7, shoulder: 11, elbow: 13, wrist: 15, hip: 23, knee: 25, ankle: 27 }

  const sidePrefix = useRight ? 'Right' : 'Left'
  const toPt = (key: SeatedPosePoint['id'], labelSuffix: string): SeatedPosePoint => {
    const raw = mpLandmarks[idx[key]] || { x: 0.5, y: 0.5, visibility: 0.8 }
    return {
      index: idx[key],
      id: key,
      label: `${sidePrefix} ${labelSuffix}`,
      x: Math.round(Math.max(4, Math.min(96, raw.x * 100)) * 10) / 10,
      y: Math.round(Math.max(4, Math.min(96, raw.y * 100)) * 10) / 10,
      confidence: Math.round((raw.visibility ?? 0.88) * 100) / 100,
    }
  }

  return {
    ear: toPt('ear', 'Ear'),
    shoulder: toPt('shoulder', 'Shoulder'),
    elbow: toPt('elbow', 'Elbow'),
    wrist: toPt('wrist', 'Wrist'),
    hip: toPt('hip', 'Hip'),
    knee: toPt('knee', 'Knee'),
    ankle: toPt('ankle', 'Ankle'),
  }
}

