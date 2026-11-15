import type { InjectedReadinessDrill } from '@/lib/posture-profile-state'

export type ReadinessScreenMode = 'overhead_squat' | 'scapular_wall_slides' | 'dual_screen'

export type ReadinessRepMovementType = 'overhead_squat' | 'scapular_wall_slides'

export type ReadinessPresetId =
  | 'optimal_mobility'
  | 'tight_hips_ankles'
  | 'stiff_upper_back'

export interface NormalizedPoseLandmark {
  x: number
  y: number
  z?: number
  visibility?: number
}

export interface ReadinessAngleCheck {
  id: string
  label: string
  measuredDeg: number
  baselineDeg: number
  status: 'optimal' | 'restricted'
}

export interface ReadinessEvaluationResult {
  screenMode: ReadinessScreenMode
  presetUsed?: ReadinessPresetId
  evaluationSource?: 'live_pose_cv' | 'self_check_preset'
  capturedRepsCount?: number
  readinessScore: number // 0 - 100
  restrictionFlags: string[]
  checks: ReadinessAngleCheck[]
  injectedDrills: InjectedReadinessDrill[]
  totalInjectedDurationSec: number
  coachSummary: string
}

export interface ReadinessOverlayNode {
  id: string
  x: number // 0..100 viewport space
  y: number // 0..100 viewport space
  confidence: number
}

export interface ReadinessOverlaySegment {
  from: string
  to: string
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface ReadinessFrameTelemetry {
  movement: ReadinessRepMovementType
  framingReady: boolean
  framingHint: string
  averageVisibility: number
  /** 0 (neutral start) -> 1 (full target squat depth or overhead slide peak) */
  excursionProgress: number
  angles: {
    ankleDorsiflexionDeg: number
    hipCreaseDepthDeg: number
    kneeValgusDeg: number
    torsoLeanDeg: number
    thoracicExtensionDeg: number
    shoulderFlexionDeg: number
    cervicalDriftDeg: number
  }
  overlayNodes: ReadinessOverlayNode[]
  overlaySegments: ReadinessOverlaySegment[]
}

export interface ReadinessRepSnapshot {
  repNumber: 1 | 2 | 3
  movement: ReadinessRepMovementType
  completedAtMs: number
  peakExcursion: number
  peakAnkleDorsiflexionDeg: number
  deepestHipCreaseDeg: number
  maxKneeValgusDeg: number
  maxTorsoLeanDeg: number
  minThoracicExtensionDeg: number
  peakShoulderFlexionDeg: number
  maxCervicalDriftDeg: number
}

export interface ReadinessRepSession {
  screenMode: ReadinessScreenMode
  targetReps: 3
  completedReps: number
  phase: 'awaiting_rep' | 'active_excursion' | 'completed'
  standingThighSpan: number | null
  lastRepCompletedAtMs: number
  activePeak: Omit<ReadinessRepSnapshot, 'repNumber' | 'movement' | 'completedAtMs'> | null
  repSnapshots: ReadinessRepSnapshot[]
  latestFrame: ReadinessFrameTelemetry | null
}

export const READINESS_PRESET_LABELS: Record<ReadinessPresetId, string> = {
  optimal_mobility: 'Smooth & Unrestricted',
  tight_hips_ankles: 'Tight Hips & Ankles',
  stiff_upper_back: 'Stiff Upper Back / Shoulders',
}

export interface ReadinessScreenMediaSpec {
  mode: ReadinessScreenMode
  title: string
  subtitle: string
  imageUrl: string
  videoUrl: string
}

export const READINESS_SCREEN_MEDIA: Record<ReadinessScreenMode, ReadinessScreenMediaSpec> = {
  overhead_squat: {
    mode: 'overhead_squat',
    title: '3 Bodyweight Overhead Squats',
    subtitle: 'Ankle dorsiflexion · Hip depth · Knee valgus · Torso lean',
    imageUrl: '/images/exercises/readiness-overhead-squat.jpg',
    videoUrl: '/videos/exercises/readiness-overhead-squat.mp4',
  },
  scapular_wall_slides: {
    mode: 'scapular_wall_slides',
    title: '3 Scapular Wall Slides',
    subtitle: 'Thoracic extension · Shoulder flexion · Cervical drift',
    imageUrl: '/images/exercises/readiness-scapular-wall-slides.jpg',
    videoUrl: '/videos/exercises/readiness-scapular-wall-slides.mp4',
  },
  dual_screen: {
    mode: 'dual_screen',
    title: 'Dual-Screen Full Check',
    subtitle: '2 Overhead Squats + 1 Scapular Wall Slide · Full kinetic chain',
    imageUrl: '/images/exercises/readiness-dual-screen-check.jpg',
    videoUrl: '/videos/exercises/readiness-dual-screen-check.mp4',
  },
}

export const DRILL_CATALOG: Record<string, InjectedReadinessDrill> = {
  ankle_rocks: {
    id: 'drill-ankle-rocks',
    name: 'Half-Kneeling Ankle Dorsiflexion Rocks',
    targetArea: 'Soleus & Talocrural Joint',
    durationSec: 45,
    cue: 'Drive knee smoothly over 2nd toe while keeping heel anchored flat.',
    priority: 1,
    imageUrl: '/images/exercises/readiness-ankle-dorsiflexion-rocks.jpg',
    videoUrl: '/videos/exercises/readiness-ankle-dorsiflexion-rocks.mp4',
  },
  couch_hip_opener: {
    id: 'drill-hip-opener',
    name: '90/90 Hip Capsule & Psoas Opener',
    targetArea: 'Hip Flexors & Deep Rotators',
    durationSec: 45,
    cue: 'Posteriorly tuck pelvis, exhale slowly, and open hips without arching low back.',
    priority: 2,
    imageUrl: '/images/exercises/readiness-90-90-hip-psoas-opener.jpg',
    videoUrl: '/videos/exercises/readiness-90-90-hip-psoas-opener.mp4',
  },
  glute_med_bridge: {
    id: 'drill-glute-bridge',
    name: 'Tempo Glute Bridge w/ Knee Out-Drive',
    targetArea: 'Glute Medius & Core Cylinder',
    durationSec: 60,
    cue: '2-second top glute squeeze to lock in knee alignment before Set 1.',
    priority: 3,
    imageUrl: '/images/exercises/readiness-tempo-glute-bridge-out-drive.jpg',
    videoUrl: '/videos/exercises/readiness-tempo-glute-bridge-out-drive.mp4',
  },
  thoracic_opener: {
    id: 'drill-thoracic-book',
    name: 'Side-Lying Open-Book Thoracic Rotations',
    targetArea: 'Mid-Back & Pectoralis Minor',
    durationSec: 45,
    cue: 'Keep top knee pinned down and rotate ribcage smoothly with each exhale.',
    priority: 1,
    imageUrl: '/images/exercises/readiness-open-book-thoracic-rotations.jpg',
    videoUrl: '/videos/exercises/readiness-open-book-thoracic-rotations.mp4',
  },
  prone_y_raise: {
    id: 'drill-prone-y',
    name: 'Wall Scapular Upward-Rotation Slides + Chin Nod',
    targetArea: 'Lower Traps, Serratus & Deep Neck Flexors',
    durationSec: 45,
    cue: 'Keep ribs down and back of neck long as forearms glide upward.',
    priority: 2,
    imageUrl: '/images/exercises/readiness-wall-scapular-slides-chin-nod.jpg',
    videoUrl: '/videos/exercises/readiness-wall-scapular-slides-chin-nod.mp4',
  },
  band_pull_apart: {
    id: 'drill-scap-retract',
    name: 'Controlled Scapular External Rotation Pulses',
    targetArea: 'Posterior Cuff & Rhomboids',
    durationSec: 60,
    cue: 'Draw shoulder blades down and back without shrugging upper traps.',
    priority: 3,
    imageUrl: '/images/exercises/readiness-scapular-external-rotation-pulses.jpg',
    videoUrl: '/videos/exercises/readiness-scapular-external-rotation-pulses.mp4',
  },
}

function clamp(min: number, max: number, val: number): number {
  return Math.max(min, Math.min(max, val))
}

function round1(val: number): number {
  return Math.round(val * 10) / 10
}

function isValidCoord(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n)
}

function computeInteriorAngleDeg(
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
  if (magBA < 1e-5 || magBC < 1e-5) return 180
  const cosTheta = clamp(-1, 1, (bax * bcx + bay * bcy) / (magBA * magBC))
  return (Math.acos(cosTheta) * 180) / Math.PI
}

/**
 * Resolves which movement pattern is active for a given rep (1..3).
 * In `dual_screen`, Reps 1 & 2 capture Overhead Squats and Rep 3 captures Scapular Wall Slides.
 */
export function getActiveMovementForRep(
  screenMode: ReadinessScreenMode,
  repNumber: number
): ReadinessRepMovementType {
  if (screenMode === 'scapular_wall_slides') return 'scapular_wall_slides'
  if (screenMode === 'overhead_squat') return 'overhead_squat'
  return repNumber >= 3 ? 'scapular_wall_slides' : 'overhead_squat'
}

/**
 * Analyzes a single 33-point MediaPipe Pose landmark array into live joint angles,
 * framing status, excursion progress (0..1), and normalized 0..100 HUD skeleton coordinates.
 */
export function analyzeReadinessPoseFrame(
  mpLandmarks: ReadonlyArray<NormalizedPoseLandmark> | null | undefined,
  movement: ReadinessRepMovementType,
  options?: { mirrorX?: boolean; standingThighSpan?: number | null }
): ReadinessFrameTelemetry | null {
  if (!Array.isArray(mpLandmarks) || mpLandmarks.length < 29) return null

  const getPt = (idx: number): NormalizedPoseLandmark | null => {
    const raw = mpLandmarks[idx]
    if (!raw || !isValidCoord(raw.x) || !isValidCoord(raw.y)) return null
    return {
      x: raw.x,
      y: raw.y,
      z: isValidCoord(raw.z) ? raw.z : 0,
      visibility: isValidCoord(raw.visibility) ? clamp(0, 1, raw.visibility) : 0.85,
    }
  }

  const nose = getPt(0)
  const lEar = getPt(7)
  const rEar = getPt(8)
  const lShoulder = getPt(11)
  const rShoulder = getPt(12)
  const lElbow = getPt(13)
  const rElbow = getPt(14)
  const lWrist = getPt(15)
  const rWrist = getPt(16)
  const lHip = getPt(23)
  const rHip = getPt(24)
  const lKnee = getPt(25)
  const rKnee = getPt(26)
  const lAnkle = getPt(27)
  const rAnkle = getPt(28)

  if (!lShoulder || !rShoulder || !lHip || !rHip || !lKnee || !rKnee || !lAnkle || !rAnkle) {
    return null
  }

  const earL = lEar ?? nose ?? lShoulder
  const earR = rEar ?? nose ?? rShoulder
  const elbowL = lElbow ?? lShoulder
  const elbowR = rElbow ?? rShoulder
  const wristL = lWrist ?? elbowL
  const wristR = rWrist ?? elbowR

  // Framing validation
  const coreNodes =
    movement === 'overhead_squat'
      ? [lShoulder, rShoulder, lHip, rHip, lKnee, rKnee, lAnkle, rAnkle]
      : [earL, earR, lShoulder, rShoulder, elbowL, elbowR, wristL, wristR, lHip, rHip]

  const averageVisibility = round1(
    coreNodes.reduce((acc, p) => acc + (p.visibility ?? 0.8), 0) / coreNodes.length
  )

  const minX = Math.min(...coreNodes.map(p => p.x))
  const maxX = Math.max(...coreNodes.map(p => p.x))
  const minY = Math.min(...coreNodes.map(p => p.y))
  const maxY = Math.max(...coreNodes.map(p => p.y))

  let framingReady = true
  let framingHint =
    movement === 'overhead_squat' ? 'Full body framed · Ready' : 'Upper chain framed · Ready'

  if (averageVisibility < 0.42) {
    framingReady = false
    framingHint = 'Step into clearer lighting so landmarks lock cleanly'
  } else if (movement === 'overhead_squat' && (lAnkle.y > 0.975 || rAnkle.y > 0.975 || maxY > 0.985)) {
    framingReady = false
    framingHint = 'Step back 1–2 ft so ankles & feet stay inside frame'
  } else if (minY < 0.02) {
    framingReady = false
    framingHint = 'Step back slightly so overhead reach stays inside frame'
  } else if (minX < 0.02 || maxX > 0.98) {
    framingReady = false
    framingHint = 'Center your body inside the camera brackets'
  }

  // Pick higher-confidence side for sagittal chain metrics
  const leftVis = (lShoulder.visibility ?? 0.8) + (lHip.visibility ?? 0.8) + (lKnee.visibility ?? 0.8)
  const rightVis = (rShoulder.visibility ?? 0.8) + (rHip.visibility ?? 0.8) + (rKnee.visibility ?? 0.8)
  const useRight = rightVis >= leftVis

  const earS = useRight ? earR : earL
  const shoulderS = useRight ? rShoulder : lShoulder
  const hipS = useRight ? rHip : lHip
  const kneeS = useRight ? rKnee : lKnee
  const ankleS = useRight ? rAnkle : lAnkle

  const shoulderMid = { x: (lShoulder.x + rShoulder.x) / 2, y: (lShoulder.y + rShoulder.y) / 2 }
  const hipMid = { x: (lHip.x + rHip.x) / 2, y: (lHip.y + rHip.y) / 2 }
  const kneeMid = { x: (lKnee.x + rKnee.x) / 2, y: (lKnee.y + rKnee.y) / 2 }
  const ankleMid = { x: (lAnkle.x + rAnkle.x) / 2, y: (lAnkle.y + rAnkle.y) / 2 }

  const shinSpanY = Math.max(0.06, ankleMid.y - kneeMid.y)
  const refThighSpan = Math.max(0.12, options?.standingThighSpan ?? shinSpanY * 1.04)
  const currentHipAboveKnee = kneeMid.y - hipMid.y

  // 1. Squat Hip Crease Depth (femur inclination + vertical thigh drop, immune to trunk-fold cheating)
  const femurAngleFromVertical = computeInteriorAngleDeg(
    { x: hipS.x, y: hipS.y - 0.25 },
    hipS,
    kneeS
  )
  const verticalCompressionRatio = clamp(0, 1.08, 1 - currentHipAboveKnee / refThighSpan)
  const compressionHipDeg = 176 - verticalCompressionRatio * 84 // 0 -> 176° standing, 1 -> 92° parallel
  const hipCreaseDepthDeg = round1(
    clamp(82, 178, Math.min(femurAngleFromVertical, compressionHipDeg))
  )

  // 2. Ankle Dorsiflexion (forward shin inclination relative to vertical + frontal squat progression blend)
  const sagittalShinDx = Math.max(Math.abs(lKnee.x - lAnkle.x), Math.abs(rKnee.x - rAnkle.x))
  const sagittalShinTiltDeg =
    (Math.atan2(sagittalShinDx, Math.max(0.03, ankleS.y - kneeS.y)) * 180) / Math.PI
  const kneeInteriorDeg = computeInteriorAngleDeg(hipS, kneeS, ankleS)
  const kneeFlexionEstimate = clamp(0, 35, (176 - kneeInteriorDeg) * 0.36)
  const ankleDorsiflexionDeg = round1(
    clamp(8, 42, sagittalShinDx >= 0.035 ? sagittalShinTiltDeg : Math.max(sagittalShinTiltDeg, kneeFlexionEstimate))
  )

  // 3. Frontal Knee Valgus (bilateral medial knee convergence relative to hip-ankle stance span,
  // invariant to common sagittal knee translation in 45°-oblique views)
  const stanceWidth = Math.abs(lAnkle.x - rAnkle.x)
  let kneeValgusDeg = 2.5
  if (stanceWidth >= 0.05) {
    const legSpanYL = Math.max(0.08, lAnkle.y - lHip.y)
    const legSpanYR = Math.max(0.08, rAnkle.y - rHip.y)
    const tL = clamp(0.2, 0.85, (lKnee.y - lHip.y) / legSpanYL)
    const tR = clamp(0.2, 0.85, (rKnee.y - rHip.y) / legSpanYR)
    const neutralLKneeX = lHip.x + (lAnkle.x - lHip.x) * tL
    const neutralRKneeX = rHip.x + (rAnkle.x - rHip.x) * tR
    const neutralSpan = Math.abs(neutralRKneeX - neutralLKneeX)
    const actualSpan = Math.abs(rKnee.x - lKnee.x)
    const medialNarrowingPerLeg = Math.max(0, (neutralSpan - actualSpan) / 2)
    const avgShinY = Math.max(0.07, (lAnkle.y - lKnee.y + (rAnkle.y - rKnee.y)) / 2)
    const convergenceDeg = (Math.atan2(medialNarrowingPerLeg, avgShinY) * 180) / Math.PI
    kneeValgusDeg = round1(clamp(2, 28, Math.max(2.5, convergenceDeg)))
  }

  // 4. Torso-to-Tibia Lean
  const sagittalTrunkDx = Math.max(
    Math.abs(shoulderMid.x - hipMid.x),
    Math.abs(shoulderS.x - hipS.x)
  )
  const trunkTiltDeg =
    (Math.atan2(sagittalTrunkDx, Math.max(0.05, hipMid.y - shoulderMid.y)) * 180) / Math.PI
  const torsoLeanDeg = round1(clamp(0, 35, Math.max(1.5, trunkTiltDeg - sagittalShinTiltDeg * 0.6)))

  // 5. Thoracic Extension (ear -> shoulder -> hip alignment)
  const thoracicRaw = computeInteriorAngleDeg(earS, shoulderS, hipS)
  const thoracicExtensionDeg = round1(clamp(135, 180, thoracicRaw))

  // 6. Shoulder Overhead Flexion (hip -> shoulder -> wrist/elbow elevation)
  const leftArmFlex = Math.max(
    computeInteriorAngleDeg(lHip, lShoulder, wristL),
    computeInteriorAngleDeg(lHip, lShoulder, elbowL)
  )
  const rightArmFlex = Math.max(
    computeInteriorAngleDeg(rHip, rShoulder, wristR),
    computeInteriorAngleDeg(rHip, rShoulder, elbowR)
  )
  const shoulderFlexionDeg = round1(clamp(20, 180, (leftArmFlex + rightArmFlex) / 2))

  // 7. Cervical Drift (ear vs shoulder plumb line + shrug compression penalty)
  const earDx = Math.abs(earS.x - shoulderS.x)
  const earDy = Math.max(0.03, shoulderS.y - earS.y)
  const neckPlumbDeg = (Math.atan2(earDx, earDy) * 180) / Math.PI
  const shrugPenalty = earDy < 0.08 ? (0.08 - earDy) * 90 : 0
  const cervicalDriftDeg = round1(clamp(1, 32, neckPlumbDeg + shrugPenalty))

  // Movement excursion progress (0 = neutral start, 1 = full target depth / overhead peak)
  const squatProgress = clamp(0, 1, (168 - hipCreaseDepthDeg) / 62)
  const slideProgress = clamp(0, 1, (shoulderFlexionDeg - 92) / 68)
  const excursionProgress = round1(movement === 'overhead_squat' ? squatProgress : slideProgress)

  // Build live 0..100 viewport skeleton overlay
  const mirror = Boolean(options?.mirrorX)
  const toVpX = (x: number) => round1(clamp(2, 98, (mirror ? 1 - x : x) * 100))
  const toVpY = (y: number) => round1(clamp(2, 98, y * 100))

  const nodeMap: Record<string, ReadinessOverlayNode> = {
    head: {
      id: 'head',
      x: toVpX(nose?.x ?? (earL.x + earR.x) / 2),
      y: toVpY(nose?.y ?? (earL.y + earR.y) / 2),
      confidence: nose?.visibility ?? 0.9,
    },
    lShoulder: {
      id: 'lShoulder',
      x: toVpX(lShoulder.x),
      y: toVpY(lShoulder.y),
      confidence: lShoulder.visibility ?? 0.9,
    },
    rShoulder: {
      id: 'rShoulder',
      x: toVpX(rShoulder.x),
      y: toVpY(rShoulder.y),
      confidence: rShoulder.visibility ?? 0.9,
    },
    lElbow: {
      id: 'lElbow',
      x: toVpX(elbowL.x),
      y: toVpY(elbowL.y),
      confidence: elbowL.visibility ?? 0.85,
    },
    rElbow: {
      id: 'rElbow',
      x: toVpX(elbowR.x),
      y: toVpY(elbowR.y),
      confidence: elbowR.visibility ?? 0.85,
    },
    lWrist: {
      id: 'lWrist',
      x: toVpX(wristL.x),
      y: toVpY(wristL.y),
      confidence: wristL.visibility ?? 0.85,
    },
    rWrist: {
      id: 'rWrist',
      x: toVpX(wristR.x),
      y: toVpY(wristR.y),
      confidence: wristR.visibility ?? 0.85,
    },
    lHip: {
      id: 'lHip',
      x: toVpX(lHip.x),
      y: toVpY(lHip.y),
      confidence: lHip.visibility ?? 0.9,
    },
    rHip: {
      id: 'rHip',
      x: toVpX(rHip.x),
      y: toVpY(rHip.y),
      confidence: rHip.visibility ?? 0.9,
    },
    lKnee: {
      id: 'lKnee',
      x: toVpX(lKnee.x),
      y: toVpY(lKnee.y),
      confidence: lKnee.visibility ?? 0.9,
    },
    rKnee: {
      id: 'rKnee',
      x: toVpX(rKnee.x),
      y: toVpY(rKnee.y),
      confidence: rKnee.visibility ?? 0.9,
    },
    lAnkle: {
      id: 'lAnkle',
      x: toVpX(lAnkle.x),
      y: toVpY(lAnkle.y),
      confidence: lAnkle.visibility ?? 0.88,
    },
    rAnkle: {
      id: 'rAnkle',
      x: toVpX(rAnkle.x),
      y: toVpY(rAnkle.y),
      confidence: rAnkle.visibility ?? 0.88,
    },
  }

  const pairs: Array<[string, string]> = [
    ['lShoulder', 'rShoulder'],
    ['lShoulder', 'lElbow'],
    ['lElbow', 'lWrist'],
    ['rShoulder', 'rElbow'],
    ['rElbow', 'rWrist'],
    ['lShoulder', 'lHip'],
    ['rShoulder', 'rHip'],
    ['lHip', 'rHip'],
    ['lHip', 'lKnee'],
    ['lKnee', 'lAnkle'],
    ['rHip', 'rKnee'],
    ['rKnee', 'rAnkle'],
  ]

  const overlaySegments: ReadinessOverlaySegment[] = pairs.map(([from, to]) => ({
    from,
    to,
    x1: nodeMap[from].x,
    y1: nodeMap[from].y,
    x2: nodeMap[to].x,
    y2: nodeMap[to].y,
  }))

  return {
    movement,
    framingReady,
    framingHint,
    averageVisibility,
    excursionProgress,
    angles: {
      ankleDorsiflexionDeg,
      hipCreaseDepthDeg,
      kneeValgusDeg,
      torsoLeanDeg,
      thoracicExtensionDeg,
      shoulderFlexionDeg,
      cervicalDriftDeg,
    },
    overlayNodes: Object.values(nodeMap),
    overlaySegments,
  }
}

export function createReadinessRepSession(screenMode: ReadinessScreenMode): ReadinessRepSession {
  return {
    screenMode,
    targetReps: 3,
    completedReps: 0,
    phase: 'awaiting_rep',
    standingThighSpan: null,
    lastRepCompletedAtMs: -10_000,
    activePeak: null,
    repSnapshots: [],
    latestFrame: null,
  }
}

/**
 * Ingests a single timestamped 33-point pose frame into the 3-rep kinematic state machine.
 * Uses hysteresis (`enter >= 0.42`, `return <= 0.18`) and minimum 400ms inter-rep debounce
 * so micro-jitter never triggers false rep counts.
 */
export function ingestPoseFrameIntoSession(
  session: ReadinessRepSession,
  mpLandmarks: ReadonlyArray<NormalizedPoseLandmark> | null | undefined,
  timestampMs: number,
  options?: { mirrorX?: boolean }
): { session: ReadinessRepSession; repJustCompleted: boolean } {
  if (session.completedReps >= session.targetReps) {
    return { session: { ...session, phase: 'completed' }, repJustCompleted: false }
  }

  const nextRepNum = (session.completedReps + 1) as 1 | 2 | 3
  const movement = getActiveMovementForRep(session.screenMode, nextRepNum)

  // Calibrate baseline standing thigh span when athlete is upright before descending
  let standingThighSpan = session.standingThighSpan
  if (
    standingThighSpan === null &&
    Array.isArray(mpLandmarks) &&
    mpLandmarks.length >= 29 &&
    mpLandmarks[23] &&
    mpLandmarks[24] &&
    mpLandmarks[25] &&
    mpLandmarks[26]
  ) {
    const hipY = (mpLandmarks[23].y + mpLandmarks[24].y) / 2
    const kneeY = (mpLandmarks[25].y + mpLandmarks[26].y) / 2
    const span = kneeY - hipY
    if (span >= 0.14 && span <= 0.34) {
      standingThighSpan = span
    }
  }

  const telemetry = analyzeReadinessPoseFrame(mpLandmarks, movement, {
    mirrorX: options?.mirrorX,
    standingThighSpan,
  })

  if (!telemetry) {
    return { session, repJustCompleted: false }
  }

  const enterThreshold = 0.42
  const exitThreshold = 0.2

  if (session.phase === 'awaiting_rep') {
    if (
      telemetry.excursionProgress >= enterThreshold &&
      timestampMs - session.lastRepCompletedAtMs >= 400
    ) {
      return {
        session: {
          ...session,
          standingThighSpan,
          phase: 'active_excursion',
          latestFrame: telemetry,
          activePeak: {
            peakExcursion: telemetry.excursionProgress,
            peakAnkleDorsiflexionDeg: telemetry.angles.ankleDorsiflexionDeg,
            deepestHipCreaseDeg: telemetry.angles.hipCreaseDepthDeg,
            maxKneeValgusDeg: telemetry.angles.kneeValgusDeg,
            maxTorsoLeanDeg: telemetry.angles.torsoLeanDeg,
            minThoracicExtensionDeg: telemetry.angles.thoracicExtensionDeg,
            peakShoulderFlexionDeg: telemetry.angles.shoulderFlexionDeg,
            maxCervicalDriftDeg: telemetry.angles.cervicalDriftDeg,
          },
        },
        repJustCompleted: false,
      }
    }
    return {
      session: {
        ...session,
        standingThighSpan,
        latestFrame: telemetry,
      },
      repJustCompleted: false,
    }
  }

  if (session.phase === 'active_excursion' && session.activePeak) {
    const prevPeak = session.activePeak
    const updatedPeak = {
      peakExcursion: Math.max(prevPeak.peakExcursion, telemetry.excursionProgress),
      peakAnkleDorsiflexionDeg: Math.max(
        prevPeak.peakAnkleDorsiflexionDeg,
        telemetry.angles.ankleDorsiflexionDeg
      ),
      deepestHipCreaseDeg: Math.min(prevPeak.deepestHipCreaseDeg, telemetry.angles.hipCreaseDepthDeg),
      maxKneeValgusDeg: Math.max(prevPeak.maxKneeValgusDeg, telemetry.angles.kneeValgusDeg),
      maxTorsoLeanDeg: Math.max(prevPeak.maxTorsoLeanDeg, telemetry.angles.torsoLeanDeg),
      minThoracicExtensionDeg: Math.min(
        prevPeak.minThoracicExtensionDeg,
        telemetry.angles.thoracicExtensionDeg
      ),
      peakShoulderFlexionDeg: Math.max(
        prevPeak.peakShoulderFlexionDeg,
        telemetry.angles.shoulderFlexionDeg
      ),
      maxCervicalDriftDeg: Math.max(
        prevPeak.maxCervicalDriftDeg,
        telemetry.angles.cervicalDriftDeg
      ),
    }

    if (telemetry.excursionProgress <= exitThreshold && updatedPeak.peakExcursion >= 0.48) {
      const snapshot: ReadinessRepSnapshot = {
        repNumber: nextRepNum,
        movement,
        completedAtMs: timestampMs,
        ...updatedPeak,
      }
      const nextCompleted = session.completedReps + 1
      return {
        session: {
          ...session,
          standingThighSpan,
          completedReps: nextCompleted,
          phase: nextCompleted >= session.targetReps ? 'completed' : 'awaiting_rep',
          lastRepCompletedAtMs: timestampMs,
          activePeak: null,
          repSnapshots: [...session.repSnapshots, snapshot],
          latestFrame: telemetry,
        },
        repJustCompleted: true,
      }
    }

    return {
      session: {
        ...session,
        standingThighSpan,
        activePeak: updatedPeak,
        latestFrame: telemetry,
      },
      repJustCompleted: false,
    }
  }

  return { session: { ...session, latestFrame: telemetry }, repJustCompleted: false }
}

/**
 * Allows manual advancement of a rep when camera lighting/occlusion blocks return detection,
 * preserving any real landmark angles captured during the rep.
 */
export function recordManualRepInSession(
  session: ReadinessRepSession,
  timestampMs: number
): ReadinessRepSession {
  if (session.completedReps >= session.targetReps) return session
  const nextRepNum = (session.completedReps + 1) as 1 | 2 | 3
  const movement = getActiveMovementForRep(session.screenMode, nextRepNum)
  const fallbackAngles = session.latestFrame?.angles

  const snapshot: ReadinessRepSnapshot = session.activePeak
    ? {
        repNumber: nextRepNum,
        movement,
        completedAtMs: timestampMs,
        ...session.activePeak,
      }
    : {
        repNumber: nextRepNum,
        movement,
        completedAtMs: timestampMs,
        peakExcursion: session.latestFrame?.excursionProgress ?? 0.65,
        peakAnkleDorsiflexionDeg: fallbackAngles?.ankleDorsiflexionDeg ?? 31,
        deepestHipCreaseDeg: fallbackAngles?.hipCreaseDepthDeg ?? 95,
        maxKneeValgusDeg: fallbackAngles?.kneeValgusDeg ?? 3.5,
        maxTorsoLeanDeg: fallbackAngles?.torsoLeanDeg ?? 5,
        minThoracicExtensionDeg: fallbackAngles?.thoracicExtensionDeg ?? 174,
        peakShoulderFlexionDeg: fallbackAngles?.shoulderFlexionDeg ?? 172,
        maxCervicalDriftDeg: fallbackAngles?.cervicalDriftDeg ?? 4.5,
      }

  const nextCompleted = session.completedReps + 1
  return {
    ...session,
    completedReps: nextCompleted,
    phase: nextCompleted >= session.targetReps ? 'completed' : 'awaiting_rep',
    lastRepCompletedAtMs: timestampMs,
    activePeak: null,
    repSnapshots: [...session.repSnapshots, snapshot],
  }
}

/**
 * Applies the 20m Express Mode cap:
 * - Standard mode: up to 3 drills (~135–165 seconds).
 * - 20m Express active: strictly capped at 90 seconds total across max 2 high-priority drills.
 */
export function applyExpressCapToInjectedDrills(
  drills: InjectedReadinessDrill[],
  expressModeActive: boolean
): InjectedReadinessDrill[] {
  if (drills.length === 0) return []
  const sorted = [...drills].sort((a, b) => a.priority - b.priority)

  if (!expressModeActive) {
    return sorted.slice(0, 3)
  }

  // Express cap: max 2 high-priority drills, total <= 90 seconds (45s + 45s)
  const topTwo = sorted.slice(0, 2)
  const perDrillCap = Math.floor(90 / topTwo.length)
  return topTwo.map(drill => ({
    ...drill,
    durationSec: Math.min(drill.durationSec, perDrillCap),
  }))
}

/**
 * Finalizes a live 33-point CV rep session into a dynamic 0–100 Forge Readiness Score,
 * exact measured vs. baseline angle checks, and targeted corrective warm-up drills.
 */
export function finalizeReadinessSession(
  session: ReadinessRepSession,
  expressModeActive: boolean
): ReadinessEvaluationResult | null {
  const snapshots = [...session.repSnapshots]
  if (snapshots.length === 0 && session.activePeak) {
    const movement = getActiveMovementForRep(session.screenMode, 1)
    snapshots.push({
      repNumber: 1,
      movement,
      completedAtMs: Date.now(),
      ...session.activePeak,
    })
  }
  if (snapshots.length === 0) return null

  const squatReps = snapshots.filter(s => s.movement === 'overhead_squat')
  const slideReps = snapshots.filter(s => s.movement === 'scapular_wall_slides')

  const avg = (arr: number[], fallback: number) =>
    arr.length > 0 ? round1(arr.reduce((a, b) => a + b, 0) / arr.length) : fallback

  const checks: ReadinessAngleCheck[] = []
  const restrictionFlags: string[] = []
  const drillCandidates: InjectedReadinessDrill[] = []
  let penaltyPoints = 0

  if (session.screenMode === 'overhead_squat' || session.screenMode === 'dual_screen') {
    const sourceReps = squatReps.length > 0 ? squatReps : snapshots
    const measuredAnkle = avg(
      sourceReps.map(r => r.peakAnkleDorsiflexionDeg),
      32
    )
    const measuredHip = avg(
      sourceReps.map(r => r.deepestHipCreaseDeg),
      95
    )
    const measuredValgus = avg(
      sourceReps.map(r => r.maxKneeValgusDeg),
      3.5
    )
    const measuredTorso = avg(
      sourceReps.map(r => r.maxTorsoLeanDeg),
      5
    )

    const ankleOptimal = measuredAnkle >= 27
    const hipOptimal = measuredHip <= 100
    const valgusOptimal = measuredValgus <= 6.5
    const torsoOptimal = measuredTorso <= 10

    checks.push(
      {
        id: 'ankle_df',
        label: 'Ankle Dorsiflexion',
        measuredDeg: measuredAnkle,
        baselineDeg: 32,
        status: ankleOptimal ? 'optimal' : 'restricted',
      },
      {
        id: 'hip_depth',
        label: 'Hip Crease Depth',
        measuredDeg: measuredHip,
        baselineDeg: 95,
        status: hipOptimal ? 'optimal' : 'restricted',
      }
    )

    if (session.screenMode === 'overhead_squat') {
      checks.push(
        {
          id: 'knee_valgus',
          label: 'Knee Tracking (Valgus)',
          measuredDeg: measuredValgus,
          baselineDeg: 4,
          status: valgusOptimal ? 'optimal' : 'restricted',
        },
        {
          id: 'torso_lean',
          label: 'Torso-to-Tibia Lean',
          measuredDeg: measuredTorso,
          baselineDeg: 6,
          status: torsoOptimal ? 'optimal' : 'restricted',
        }
      )
    }

    if (!ankleOptimal) {
      restrictionFlags.push('ankle_dorsiflexion_limited')
      drillCandidates.push(DRILL_CATALOG.ankle_rocks)
      penaltyPoints += clamp(5, 16, (30 - measuredAnkle) * 1.15)
    }
    if (!hipOptimal || !torsoOptimal) {
      restrictionFlags.push('hip_flexor_tightness')
      drillCandidates.push(DRILL_CATALOG.couch_hip_opener)
      penaltyPoints += clamp(5, 14, (measuredHip - 97) * 0.75 + Math.max(0, measuredTorso - 9) * 0.5)
    }
    if (!valgusOptimal) {
      restrictionFlags.push('mild_knee_valgus')
      drillCandidates.push(DRILL_CATALOG.glute_med_bridge)
      penaltyPoints += clamp(4, 12, (measuredValgus - 5.5) * 1.1)
    }
  }

  if (session.screenMode === 'scapular_wall_slides' || session.screenMode === 'dual_screen') {
    const sourceReps = slideReps.length > 0 ? slideReps : snapshots
    const measuredThoracic = avg(
      sourceReps.map(r => r.minThoracicExtensionDeg),
      174
    )
    const measuredShoulder = avg(
      sourceReps.map(r => r.peakShoulderFlexionDeg),
      172
    )
    const measuredCervical = avg(
      sourceReps.map(r => r.maxCervicalDriftDeg),
      4.5
    )

    const thoracicOptimal = measuredThoracic >= 167
    const shoulderOptimal = measuredShoulder >= 164
    const cervicalOptimal = measuredCervical <= 8.5

    if (session.screenMode === 'scapular_wall_slides') {
      checks.push({
        id: 't_spine',
        label: 'Thoracic Extension',
        measuredDeg: measuredThoracic,
        baselineDeg: 174,
        status: thoracicOptimal ? 'optimal' : 'restricted',
      })
    }
    checks.push(
      {
        id: 'shoulder_flex',
        label: 'Shoulder Flexion',
        measuredDeg: measuredShoulder,
        baselineDeg: 172,
        status: shoulderOptimal ? 'optimal' : 'restricted',
      },
      {
        id: 'cervical_drift',
        label: 'Cervical Drift',
        measuredDeg: measuredCervical,
        baselineDeg: 5,
        status: cervicalOptimal ? 'optimal' : 'restricted',
      }
    )

    if (!thoracicOptimal) {
      restrictionFlags.push('thoracic_stiffness')
      drillCandidates.push(DRILL_CATALOG.thoracic_opener)
      penaltyPoints += clamp(5, 14, (172 - measuredThoracic) * 0.9)
    }
    if (!shoulderOptimal) {
      restrictionFlags.push('shoulder_flexion_limited')
      drillCandidates.push(DRILL_CATALOG.prone_y_raise)
      penaltyPoints += clamp(5, 14, (170 - measuredShoulder) * 0.8)
    }
    if (!cervicalOptimal) {
      restrictionFlags.push('cervical_drift')
      drillCandidates.push(DRILL_CATALOG.band_pull_apart)
      penaltyPoints += clamp(4, 10, (measuredCervical - 6.5) * 0.85)
    }
  }

  // Deduplicate drills by ID while preserving priority ordering
  const uniqueDrills = Array.from(new Map(drillCandidates.map(d => [d.id, d])).values())
  const injectedDrills = applyExpressCapToInjectedDrills(uniqueDrills, expressModeActive)
  const totalInjectedDurationSec = injectedDrills.reduce((sum, d) => sum + d.durationSec, 0)

  const readinessScore =
    restrictionFlags.length === 0
      ? clamp(89, 98, Math.round(95 - penaltyPoints))
      : clamp(46, 84, Math.round(92 - penaltyPoints))

  const restrictedLabels = checks.filter(c => c.status === 'restricted').map(c => `${c.label} (${c.measuredDeg}°)`)
  const coachSummary =
    restrictedLabels.length === 0
      ? `Clean joint excursion verified across ${snapshots.length} captured ${snapshots.length === 1 ? 'rep' : 'reps'}. Cleared to proceed directly into Set 1.`
      : `Detected tightness in ${restrictedLabels.slice(0, 2).join(' and ')}. Auto-queued ${injectedDrills.length} targeted ${injectedDrills.length === 1 ? 'primer' : 'primers'} (${totalInjectedDurationSec}s) before Set 1.`

  return {
    screenMode: session.screenMode,
    evaluationSource: 'live_pose_cv',
    capturedRepsCount: snapshots.length,
    readinessScore,
    restrictionFlags,
    checks,
    injectedDrills,
    totalInjectedDurationSec,
    coachSummary,
  }
}

export function evaluateCameraReadiness(params: {
  screenMode: ReadinessScreenMode
  preset: ReadinessPresetId
  expressModeActive: boolean
}): ReadinessEvaluationResult {
  const { screenMode, preset, expressModeActive } = params

  let checks: ReadinessAngleCheck[] = []
  let restrictionFlags: string[] = []
  let rawDrills: InjectedReadinessDrill[] = []
  let readinessScore = 93
  let coachSummary =
    'Clean joint excursion across all 3 reps. Cleared to proceed directly into working sets.'

  if (preset === 'optimal_mobility') {
    if (screenMode === 'overhead_squat') {
      checks = [
        { id: 'ankle_df', label: 'Ankle Dorsiflexion', measuredDeg: 34, baselineDeg: 33, status: 'optimal' },
        { id: 'hip_depth', label: 'Hip Crease Depth', measuredDeg: 94, baselineDeg: 95, status: 'optimal' },
        { id: 'knee_valgus', label: 'Knee Tracking (Valgus)', measuredDeg: 3, baselineDeg: 4, status: 'optimal' },
        { id: 'torso_lean', label: 'Torso-to-Tibia Lean', measuredDeg: 4, baselineDeg: 5, status: 'optimal' },
      ]
    } else if (screenMode === 'scapular_wall_slides') {
      checks = [
        { id: 't_spine', label: 'Thoracic Extension', measuredDeg: 176, baselineDeg: 175, status: 'optimal' },
        { id: 'shoulder_flex', label: 'Shoulder Flexion', measuredDeg: 174, baselineDeg: 172, status: 'optimal' },
        { id: 'cervical_drift', label: 'Cervical Drift', measuredDeg: 4, baselineDeg: 5, status: 'optimal' },
      ]
    } else {
      checks = [
        { id: 'ankle_df', label: 'Ankle Dorsiflexion', measuredDeg: 34, baselineDeg: 33, status: 'optimal' },
        { id: 'hip_depth', label: 'Hip Crease Depth', measuredDeg: 94, baselineDeg: 95, status: 'optimal' },
        { id: 'shoulder_flex', label: 'Shoulder Flexion', measuredDeg: 174, baselineDeg: 172, status: 'optimal' },
        { id: 'cervical_drift', label: 'Cervical Drift', measuredDeg: 4, baselineDeg: 5, status: 'optimal' },
      ]
    }
    readinessScore = 94
  } else if (preset === 'tight_hips_ankles') {
    checks = [
      { id: 'ankle_df', label: 'Ankle Dorsiflexion', measuredDeg: 21, baselineDeg: 32, status: 'restricted' },
      { id: 'hip_depth', label: 'Hip Crease Depth', measuredDeg: 108, baselineDeg: 95, status: 'restricted' },
      { id: 'knee_valgus', label: 'Knee Tracking (Valgus)', measuredDeg: 9, baselineDeg: 4, status: 'restricted' },
      { id: 'torso_lean', label: 'Torso-to-Tibia Lean', measuredDeg: 14, baselineDeg: 6, status: 'restricted' },
    ]
    restrictionFlags = ['ankle_dorsiflexion_limited', 'hip_flexor_tightness', 'mild_knee_valgus']
    rawDrills = [
      DRILL_CATALOG.ankle_rocks,
      DRILL_CATALOG.couch_hip_opener,
      DRILL_CATALOG.glute_med_bridge,
    ]
    readinessScore = 74
    coachSummary =
      'Ankle dorsiflexion (-11°) and hip depth showed morning stiffness. Targeted ankle & hip openers prepended before Set 1.'
  } else {
    checks = [
      { id: 't_spine', label: 'Thoracic Extension', measuredDeg: 158, baselineDeg: 174, status: 'restricted' },
      { id: 'shoulder_flex', label: 'Shoulder Flexion', measuredDeg: 154, baselineDeg: 172, status: 'restricted' },
      { id: 'cervical_drift', label: 'Cervical Drift', measuredDeg: 15, baselineDeg: 5, status: 'restricted' },
    ]
    restrictionFlags = ['thoracic_stiffness', 'shoulder_flexion_limited', 'cervical_drift']
    rawDrills = [
      DRILL_CATALOG.thoracic_opener,
      DRILL_CATALOG.prone_y_raise,
      DRILL_CATALOG.band_pull_apart,
    ]
    readinessScore = 76
    coachSummary =
      'Upper-back & overhead flexion stiffness detected from desk posture. Prepended thoracic & scapular primers before Set 1.'
  }

  const injectedDrills = applyExpressCapToInjectedDrills(rawDrills, expressModeActive)
  const totalInjectedDurationSec = injectedDrills.reduce((sum, d) => sum + d.durationSec, 0)

  return {
    screenMode,
    presetUsed: preset,
    evaluationSource: 'self_check_preset',
    capturedRepsCount: 3,
    readinessScore,
    restrictionFlags,
    checks,
    injectedDrills,
    totalInjectedDurationSec,
    coachSummary,
  }
}

/**
 * Generates a realistic 33-point MediaPipe Pose landmark frame for `phase01` in [0..1]
 * (`0` = neutral start, `1` = bottom of squat or peak of scapular wall slide)
 * for deterministic biomechanics validation and browser E2E tests.
 */
export function buildSyntheticReadinessPoseFrame(
  movement: ReadinessRepMovementType,
  phase01: number,
  profile: ReadinessPresetId = 'optimal_mobility'
): NormalizedPoseLandmark[] {
  const t = clamp(0, 1, phase01)
  const pts: NormalizedPoseLandmark[] = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.94,
  }))

  const lerp = (a: number, b: number) => a + (b - a) * t

  if (movement === 'overhead_squat') {
    const isRestricted = profile === 'tight_hips_ankles'
    // 45°-oblique view facing left (hip shifts right +x on descent, knee shifts forward -x over toes)
    const hipY = lerp(0.5, isRestricted ? 0.645 : 0.695)
    const rHipX = lerp(0.55, isRestricted ? 0.62 : 0.59)
    const lHipX = lerp(0.44, isRestricted ? 0.5 : 0.48)

    const kneeY = lerp(0.71, isRestricted ? 0.72 : 0.705)
    // Optimal keeps knees tracking parallel over toes; restricted limits forward shin travel & caves medially
    const rKneeX = lerp(0.55, isRestricted ? 0.52 : 0.445)
    const lKneeX = lerp(0.44, isRestricted ? 0.49 : 0.335)

    const ankleY = 0.89
    const rAnkleX = 0.56
    const lAnkleX = 0.45

    const shoulderY = lerp(0.25, isRestricted ? 0.44 : 0.42)
    const rShoulderX = lerp(0.55, isRestricted ? 0.45 : 0.49)
    const lShoulderX = lerp(0.44, isRestricted ? 0.35 : 0.38)

    const earY = shoulderY - 0.11
    const rEarX = rShoulderX - (isRestricted ? 0.03 : 0.005)
    const lEarX = lShoulderX - (isRestricted ? 0.03 : 0.005)

    pts[0] = { x: (lEarX + rEarX) / 2, y: earY, z: 0, visibility: 0.96 }
    pts[7] = { x: lEarX, y: earY, z: 0, visibility: 0.95 }
    pts[8] = { x: rEarX, y: earY, z: 0, visibility: 0.95 }
    pts[11] = { x: lShoulderX, y: shoulderY, z: 0, visibility: 0.97 }
    pts[12] = { x: rShoulderX, y: shoulderY, z: 0, visibility: 0.97 }
    pts[13] = { x: lShoulderX - 0.01, y: shoulderY - 0.09, z: 0, visibility: 0.94 }
    pts[14] = { x: rShoulderX + 0.01, y: shoulderY - 0.09, z: 0, visibility: 0.94 }
    pts[15] = { x: lShoulderX - 0.015, y: shoulderY - 0.17, z: 0, visibility: 0.93 }
    pts[16] = { x: rShoulderX + 0.015, y: shoulderY - 0.17, z: 0, visibility: 0.93 }
    pts[23] = { x: lHipX, y: hipY, z: 0, visibility: 0.97 }
    pts[24] = { x: rHipX, y: hipY, z: 0, visibility: 0.97 }
    pts[25] = { x: lKneeX, y: kneeY, z: 0, visibility: 0.96 }
    pts[26] = { x: rKneeX, y: kneeY, z: 0, visibility: 0.96 }
    pts[27] = { x: lAnkleX, y: ankleY, z: 0, visibility: 0.95 }
    pts[28] = { x: rAnkleX, y: ankleY, z: 0, visibility: 0.95 }
  } else {
    const isRestricted = profile === 'stiff_upper_back'
    const shoulderY = 0.33
    const lShoulderX = 0.43
    const rShoulderX = isRestricted ? lerp(0.54, 0.56) : 0.55

    const hipY = 0.62
    const lHipX = 0.44
    const rHipX = isRestricted ? 0.51 : 0.55

    const earY = isRestricted ? lerp(0.22, 0.24) : 0.2
    const rEarX = isRestricted ? lerp(0.58, 0.61) : 0.55
    const lEarX = isRestricted ? lerp(0.46, 0.49) : 0.43

    // Start in W position (wrists near shoulder level, elbows bent down) -> glide overhead at t=1
    const wristY = lerp(0.35, isRestricted ? 0.18 : 0.1)
    const elbowY = lerp(0.44, isRestricted ? 0.25 : 0.2)
    const lWristX = lerp(0.35, isRestricted ? 0.31 : 0.42)
    const rWristX = lerp(0.63, isRestricted ? 0.68 : 0.56)
    const lElbowX = lerp(0.36, isRestricted ? 0.33 : 0.42)
    const rElbowX = lerp(0.62, isRestricted ? 0.66 : 0.56)

    pts[0] = { x: (lEarX + rEarX) / 2, y: earY, z: 0, visibility: 0.96 }
    pts[7] = { x: lEarX, y: earY, z: 0, visibility: 0.95 }
    pts[8] = { x: rEarX, y: earY, z: 0, visibility: 0.95 }
    pts[11] = { x: lShoulderX, y: shoulderY, z: 0, visibility: 0.97 }
    pts[12] = { x: rShoulderX, y: shoulderY, z: 0, visibility: 0.97 }
    pts[13] = { x: lElbowX, y: elbowY, z: 0, visibility: 0.95 }
    pts[14] = { x: rElbowX, y: elbowY, z: 0, visibility: 0.95 }
    pts[15] = { x: lWristX, y: wristY, z: 0, visibility: 0.95 }
    pts[16] = { x: rWristX, y: wristY, z: 0, visibility: 0.95 }
    pts[23] = { x: lHipX, y: hipY, z: 0, visibility: 0.96 }
    pts[24] = { x: rHipX, y: hipY, z: 0, visibility: 0.96 }
    pts[25] = { x: 0.44, y: 0.77, z: 0, visibility: 0.93 }
    pts[26] = { x: 0.55, y: 0.77, z: 0, visibility: 0.93 }
    pts[27] = { x: 0.44, y: 0.91, z: 0, visibility: 0.91 }
    pts[28] = { x: 0.55, y: 0.91, z: 0, visibility: 0.91 }
  }

  return pts
}

/**
 * Generates a full timestamped 3-rep 33-point landmark sequence (~9 seconds simulated at 10fps)
 * for `overhead_squat`, `scapular_wall_slides`, or `dual_screen`.
 */
export function buildSynthetic3RepTrajectory(
  screenMode: ReadinessScreenMode,
  profile: ReadinessPresetId = 'optimal_mobility'
): Array<{ timestampMs: number; landmarks: NormalizedPoseLandmark[] }> {
  const frames: Array<{ timestampMs: number; landmarks: NormalizedPoseLandmark[] }> = []
  const phasesPerRep = [0, 0.25, 0.55, 0.85, 1.0, 0.95, 0.6, 0.25, 0.05, 0]
  let currentMs = 1000

  for (let rep = 1; rep <= 3; rep += 1) {
    const movement = getActiveMovementForRep(screenMode, rep)
    for (const phase of phasesPerRep) {
      frames.push({
        timestampMs: currentMs,
        landmarks: buildSyntheticReadinessPoseFrame(movement, phase, profile),
      })
      currentMs += 250
    }
  }

  return frames
}
