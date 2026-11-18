/**
 * Forge Athletic AI Postural Distortion & OHSA Movement Mesh Scanner Engine
 * Analyzes postural photos and squat video frames using computer-vision landmark
 * tracking and NASM CPT-7 clinical sports-science diagnostics.
 */

import { OhsaCompensation, StaticPosturalFinding, KineticChainCheckpoint } from './nasm-assessments'
import { sanitizePiiString } from '@/src/lib/safety/clinicalGuardrails'

export type PosturalViewType = 'anterior' | 'lateral' | 'posterior' | 'overhead_squat'

export const VALID_POSTURAL_VIEWS: readonly PosturalViewType[] = [
  'anterior',
  'lateral',
  'posterior',
  'overhead_squat',
] as const

export interface LandmarkPoint {
  id: string
  name: string
  x: number // percentage (0 - 100)
  y: number // percentage (0 - 100)
  confidence: number
}

export interface BiomechanicalAngle {
  name: string
  angleDegrees: number
  status: 'optimal' | 'mild' | 'moderate' | 'severe'
  normalRange: string
  clinicalNote: string
}

export interface PosturalMeshScanResult {
  view: PosturalViewType
  postureScore?: number
  landmarks: LandmarkPoint[]
  angles: BiomechanicalAngle[]
  detectedCompensations: string[]
  ohsaObservations: Array<{
    compensation: OhsaCompensation
    checkpoint: KineticChainCheckpoint
    observed: boolean
    severity: 'mild' | 'moderate' | 'severe'
    view: 'anterior' | 'lateral' | 'posterior'
  }>
  staticFindings: StaticPosturalFinding[]
  syndromeDetected?: 'Lower Crossed' | 'Upper Crossed' | 'Pronation Distortion' | 'Optimal Alignment'
  cexPrescription: {
    inhibit: Array<{ muscle: string; protocol: string }>
    lengthen: Array<{ muscle: string; protocol: string }>
    activate: Array<{ muscle: string; protocol: string }>
    integrate: Array<{ exercise: string; protocol: string }>
  }
  isUnverifiedFallback?: boolean
  clinicalSummary: string
}

export interface ScanPostureParams {
  imageBase64?: string
  imageUrl?: string
  view: PosturalViewType
  clientName?: string
}

export interface PosturalViewInstruction {
  id: PosturalViewType
  label: string
  subtitle: string
  desc: string
  whatClientDoes: string
  stanceAndFeet: string
  armsAndHands: string
  headAndGaze: string
  photoMoment: string
  cameraSetup: string
  aiFocusAreas: string[]
  proTip: string
}

export const POSTURAL_VIEW_INSTRUCTIONS: Record<PosturalViewType, PosturalViewInstruction> = {
  anterior: {
    id: 'anterior',
    label: '1. Anterior View',
    subtitle: 'Front-Facing Static Alignment',
    desc: 'Shoulder level, Q-angle valgus/varus, subtalar pronation',
    whatClientDoes: 'Stand facing directly toward the camera, barefoot, relaxed, looking straight ahead.',
    stanceAndFeet: 'Barefoot, feet hip-width apart and pointing straight ahead (2nd toe aligned parallel). Distribute body weight evenly 50/50 across both feet.',
    armsAndHands: 'Arms hanging naturally and relaxed at the sides, elbows soft, palms facing gently inward toward thighs.',
    headAndGaze: 'Head level, eyes focused straight ahead at eye level (do not tilt head down to look at the camera).',
    photoMoment: 'Take a normal breath and stand in natural, resting posture. Avoid forcing an unnatural "military" chest-out stance.',
    cameraSetup: '8–10 feet away, lens leveled at navel/mid-torso height. Entire body from crown of head to bare feet must be in frame.',
    aiFocusAreas: [
      'Shoulder height symmetry (elevation vs. depression)',
      'Sternal notch & clavicle horizontal alignment',
      'Pelvic level (Anterior Superior Iliac Spine / ASIS height)',
      'Patella tracking (neutral vs. valgus caving vs. varus bowing Q-angle)',
      'Subtalar joint neutral & medial longitudinal arch integrity',
    ],
    proTip: 'Instruct: "Stand naturally as if waiting for an elevator." Form-fitting athletic wear or shorts allows AI to track knee and hip landmarks accurately.',
  },
  lateral: {
    id: 'lateral',
    label: '2. Lateral View',
    subtitle: 'Side Profile Gravitational Plumb Line',
    desc: 'Forward head, thoracic kyphosis, anterior pelvic tilt',
    whatClientDoes: 'Turn 90° so your side profile faces the camera, barefoot, looking straight forward at eye level.',
    stanceAndFeet: 'Barefoot, feet hip-width apart, pointed straight ahead. Weight balanced evenly between heels and balls of feet.',
    armsAndHands: 'Arms resting relaxed at sides with thumbs pointing forward. Keep hands free (do not place hands in pockets or cross arms).',
    headAndGaze: 'Head in neutral position, looking straight forward parallel to the floor. Chin level (neither tucked nor jutting forward).',
    photoMoment: 'Exhale gently into your everyday standing posture. Do not suck in stomach or artificially hyperextend the spine.',
    cameraSetup: '8–10 feet away, lens centered at mid-torso (navel level). Capture full vertical silhouette from ear to heels.',
    aiFocusAreas: [
      'External auditory meatus (ear canal) alignment over shoulder (acromion)',
      'Cervical spine curve & craniovertebral forward head angle',
      'Thoracic kyphosis curve (upper back rounding / thoracic flexion)',
      'Lumbar lordosis depth & anterior/posterior pelvic tilt angle',
      'Knee joint extension (hyperextension vs. neutral soft flexion)',
    ],
    proTip: 'The lateral view is the primary diagnostic for Upper Crossed and Lower Crossed syndromes. Ensure hair does not cover the earlobe.',
  },
  posterior: {
    id: 'posterior',
    label: '3. Posterior View',
    subtitle: 'Rear-Facing Kinetic & Scapular Symmetry',
    desc: 'Scapular winging, calcaneal eversion, asymmetric shift',
    whatClientDoes: 'Turn completely around with your back facing directly toward the camera, barefoot, arms at sides.',
    stanceAndFeet: 'Barefoot, feet hip-width apart, pointing straight ahead. Heels and Achilles tendons clearly visible.',
    armsAndHands: 'Arms resting naturally at sides, elbows slightly relaxed, palms angled slightly backward.',
    headAndGaze: 'Head centered over cervical spine, looking straight ahead into the distance (away from camera).',
    photoMoment: 'Stand relaxed with equal 50/50 weight on both feet.',
    cameraSetup: '8–10 feet away, lens centered at mid-torso, framing full rear profile from skull base down to the floor.',
    aiFocusAreas: [
      'C7 vertebra & spine lateral alignment (lateral spinal shift or scoliosis)',
      'Scapular symmetry, medial border winging, and elevation/depression',
      'Posterior Superior Iliac Spine (PSIS) and gluteal fold level',
      'Popliteal fossa (knee crease) horizontal alignment',
      'Achilles tendon verticality and calcaneal eversion/inversion (rear foot pronation)',
    ],
    proTip: 'Ensure pant hems or shorts do not drape over the ankles so the AI can track calcaneal angles and Achilles tendon verticality.',
  },
  overhead_squat: {
    id: 'overhead_squat',
    label: '4. Overhead Squat (OHSA)',
    subtitle: 'Dynamic 5 Kinetic Chain Inflection Point',
    desc: 'Arms fall forward, excessive forward lean, knee collapse',
    whatClientDoes: 'Raise arms straight overhead, squat down to chair height, and pause for 2 seconds at the bottom.',
    stanceAndFeet: 'Barefoot, feet shoulder-width apart, toes pointing straight ahead (parallel, 2nd toe forward).',
    armsAndHands: 'Raise both arms straight overhead with elbows locked and thumbs pointing backward (bisecting ears in "Y" or "I" position).',
    headAndGaze: 'Head neutral, eyes focused forward on an eye-level spot on the wall.',
    photoMoment: 'Perform 5 slow squat reps (2 sec down, 1 sec pause, 2 sec up). Capture photo at the bottom inflection point (thighs parallel to floor) on rep 3 or 4.',
    cameraSetup: '8–10 feet away, lens centered at waist/navel level. Ensure full overhead arm extension and feet remain in frame throughout the squat.',
    aiFocusAreas: [
      'Upper Body: Arms falling forward past ears (latissimus dorsi / pectoralis tightness)',
      'Torso: Excessive forward trunk lean relative to tibia angle (weak core/anterior tibialis, tight soleus/hip flexors)',
      'LPHC: Low back arching (anterior pelvic tilt) or rounding (butt wink / posterior tilt)',
      'Knees: Knee valgus (inward collapse) or varus (outward bowing)',
      'Feet: Heel lift, arch collapse (pronation), or feet turning outward',
    ],
    proTip: 'Instruct: "Squat as if sitting into a chair while reaching your fingers toward the ceiling. Keep heels firmly planted." Capture photo at the bottom of the squat.',
  },
}

export function sanitizeAthleteFirstName(rawName?: string): string {
  if (!rawName || typeof rawName !== 'string') return 'Athlete'
  const scrubbed = sanitizePiiString(rawName).trim()
  if (!scrubbed || scrubbed.includes('[REDACTED')) return 'Athlete'
  const firstToken = scrubbed.split(/\s+/)[0]?.replace(/[^a-zA-Z'-]/g, '')
  return firstToken && firstToken.length >= 2 ? firstToken : 'Athlete'
}

/**
 * Analyzes posture or movement photos to detect kinetic chain compensations.
 */
export async function analyzePosturalMesh(
  params: ScanPostureParams
): Promise<PosturalMeshScanResult> {
  const { imageBase64, view, clientName = 'Athlete' } = params
  if (!imageBase64 || !imageBase64.trim()) {
    throw new Error('A captured or uploaded posture photograph is required to run postural mesh analysis.')
  }
  const safeView: PosturalViewType = VALID_POSTURAL_VIEWS.includes(view) ? view : 'anterior'
  const safeAthleteLabel = sanitizeAthleteFirstName(clientName)
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY

  if (apiKey && imageBase64) {
    try {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')
      const mimeType = imageBase64.includes('image/png')
        ? 'image/png'
        : imageBase64.includes('image/webp')
          ? 'image/webp'
          : 'image/jpeg'

      const prompt = `You are Coach Gordon, Head Coach & Director of Human Performance at Forge Athletic (NASM-CPT® #1261890687, B.S. IT).
You analyze movement and posture with deep empathy, compassionate encouragement, and orthopedic safety (never catastrophizing or body-shaming; focus on empowering corrective progressions and longevity).
Analyze this athlete's ${safeView.replace('_', ' ')} posture / movement screen.
Extract anatomical landmarks (x, y coordinates in percentages 0-100), measure biomechanical deviation angles, and identify NASM kinetic chain compensations.

Return valid JSON adhering to:
{
  "syndromeDetected": "Lower Crossed" | "Upper Crossed" | "Pronation Distortion" | "Optimal Alignment",
  "landmarks": [
    {"id": "c7", "name": "C7 Cervical Vertebra", "x": 50, "y": 22, "confidence": 0.95},
    {"id": "l_shoulder", "name": "Left Shoulder", "x": 42, "y": 28, "confidence": 0.92},
    {"id": "r_shoulder", "name": "Right Shoulder", "x": 58, "y": 28, "confidence": 0.92},
    {"id": "l_hip", "name": "Left ASIS", "x": 44, "y": 48, "confidence": 0.9},
    {"id": "r_hip", "name": "Right ASIS", "x": 56, "y": 48, "confidence": 0.9},
    {"id": "l_knee", "name": "Left Patella", "x": 45, "y": 68, "confidence": 0.94},
    {"id": "r_knee", "name": "Right Patella", "x": 55, "y": 68, "confidence": 0.94},
    {"id": "l_ankle", "name": "Left Lateral Malleolus", "x": 44, "y": 90, "confidence": 0.96},
    {"id": "r_ankle", "name": "Right Lateral Malleolus", "x": 56, "y": 90, "confidence": 0.96}
  ],
  "angles": [
    {"name": "Forward Head Deviation", "angleDegrees": 18, "status": "moderate", "normalRange": "< 10°", "clinicalNote": "Craniovertebral angle indicates forward cervical migration"},
    {"name": "Pelvic Incline Angle", "angleDegrees": 14, "status": "moderate", "normalRange": "5° - 10°", "clinicalNote": "Anterior pelvic tilt with increased lumbar lordosis"},
    {"name": "Knee Valgus Q-Angle", "angleDegrees": 9, "status": "mild", "normalRange": "< 5°", "clinicalNote": "Mild medial knee collapse on descent"}
  ],
  "detectedCompensations": ["knees_cave_in", "excessive_forward_lean", "low_back_arches", "arms_fall_forward"],
  "clinicalSummary": "Comprehensive kinetic chain analysis..."
}`

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1200,
            responseMimeType: 'application/json',
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (rawText) {
          const parsed = JSON.parse(rawText)
          return formatScanResult(parsed, safeView, safeAthleteLabel)
        }
      }
    } catch {
      // Fallback to deterministic synthesis
    }
  }

  return generateDeterministicPostureScan(safeView, safeAthleteLabel)
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const num = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.max(min, Math.min(max, num))
}

function mapCompensationToken(token: string): {
  compensation: OhsaCompensation
  checkpoint: KineticChainCheckpoint
  view: 'anterior' | 'lateral' | 'posterior'
} {
  const lower = token.toLowerCase()
  if (lower.includes('lean')) {
    return { compensation: 'excessive_forward_lean', checkpoint: 'lphc', view: 'lateral' }
  }
  if (lower.includes('round') || lower.includes('posterior') || lower.includes('wink')) {
    return { compensation: 'low_back_rounds', checkpoint: 'lphc', view: 'lateral' }
  }
  if (lower.includes('arch') || lower.includes('anterior_tilt') || lower.includes('back')) {
    return { compensation: 'low_back_arches', checkpoint: 'lphc', view: 'lateral' }
  }
  if (lower.includes('shift') || lower.includes('asym')) {
    return { compensation: 'asymmetrical_weight_shift', checkpoint: 'lphc', view: 'posterior' }
  }
  if (lower.includes('arms')) {
    return { compensation: 'arms_fall_forward', checkpoint: 'shoulders', view: 'lateral' }
  }
  if (lower.includes('shrug') || lower.includes('shoulder_elev') || lower.includes('shoulders_elevate')) {
    return { compensation: 'shoulders_elevate', checkpoint: 'shoulders', view: 'posterior' }
  }
  if (lower.includes('head') || lower.includes('cervical')) {
    return { compensation: 'forward_head', checkpoint: 'head_neck', view: 'lateral' }
  }
  if (lower.includes('heel')) {
    return { compensation: 'heels_rise', checkpoint: 'feet_ankles', view: 'posterior' }
  }
  if (lower.includes('flatten') || lower.includes('pronat') || lower.includes('evert')) {
    return { compensation: 'feet_flatten', checkpoint: 'feet_ankles', view: 'posterior' }
  }
  if (lower.includes('feet') || lower.includes('turn')) {
    return { compensation: 'feet_turn_out', checkpoint: 'feet_ankles', view: 'anterior' }
  }
  if (lower.includes('outward') || lower.includes('varus') || lower.includes('bow')) {
    return { compensation: 'knees_move_outward', checkpoint: 'knees', view: 'anterior' }
  }
  return { compensation: 'knees_move_inward', checkpoint: 'knees', view: 'anterior' }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatScanResult(parsed: any, view: PosturalViewType, clientName: string): PosturalMeshScanResult {
  const validSyndromes = new Set([
    'Lower Crossed',
    'Upper Crossed',
    'Pronation Distortion',
    'Optimal Alignment',
  ])
  const syndromeDetected: PosturalMeshScanResult['syndromeDetected'] = validSyndromes.has(
    parsed?.syndromeDetected
  )
    ? parsed.syndromeDetected
    : 'Lower Crossed'
  const isOptimal = syndromeDetected === 'Optimal Alignment'

  const rawCompensations: string[] = Array.isArray(parsed?.detectedCompensations)
    ? parsed.detectedCompensations.filter((c: unknown): c is string => typeof c === 'string' && c.trim().length > 0)
    : isOptimal
      ? []
      : ['knees_cave_in', 'excessive_forward_lean']

  const compensations =
    !isOptimal && rawCompensations.length === 0
      ? ['knees_cave_in', 'excessive_forward_lean']
      : rawCompensations

  const seenOhsa = new Set<OhsaCompensation>()
  const ohsaObservations: PosturalMeshScanResult['ohsaObservations'] = []
  for (const c of compensations) {
    const mapped = mapCompensationToken(c)
    if (!seenOhsa.has(mapped.compensation)) {
      seenOhsa.add(mapped.compensation)
      ohsaObservations.push({
        compensation: mapped.compensation,
        checkpoint: mapped.checkpoint,
        observed: true,
        severity: 'moderate',
        view: mapped.view,
      })
    }
  }

  const staticFindings: StaticPosturalFinding[] = []
  if (!isOptimal) {
    if (syndromeDetected === 'Upper Crossed' || compensations.some(c => c.includes('head') || c.includes('arms'))) {
      staticFindings.push({
        checkpoint: 'head_neck',
        observation: 'Forward head migration noted',
        distortionSyndrome: 'upper_crossed',
      })
    }
    if (syndromeDetected === 'Lower Crossed' || compensations.some(c => c.includes('arch') || c.includes('lean') || c.includes('back'))) {
      staticFindings.push({
        checkpoint: 'lphc',
        observation: 'Anterior pelvic tilt with lumbar extension',
        distortionSyndrome: 'lower_crossed',
      })
    }
    if (syndromeDetected === 'Pronation Distortion' || compensations.some(c => c.includes('knee') || c.includes('feet') || c.includes('flatten'))) {
      staticFindings.push(
        {
          checkpoint: 'knees',
          observation: 'Bilateral knee valgus tracking medial to 2nd toe',
          distortionSyndrome: 'pronation_distortion',
        },
        {
          checkpoint: 'feet_ankles',
          observation: 'Mild subtalar pronation and eversion',
          distortionSyndrome: 'pronation_distortion',
        }
      )
    }
  }

  const rawLandmarks: LandmarkPoint[] =
    Array.isArray(parsed?.landmarks) && parsed.landmarks.length > 0
      ? parsed.landmarks.map((pt: Partial<LandmarkPoint>, idx: number) => ({
          id: typeof pt?.id === 'string' && pt.id ? pt.id : `joint_${idx}`,
          name: typeof pt?.name === 'string' && pt.name ? pt.name : `Landmark ${idx + 1}`,
          x: Number(clampNumber(pt?.x, 0, 100, 50).toFixed(1)),
          y: Number(clampNumber(pt?.y, 0, 100, 50).toFixed(1)),
          confidence: Number(clampNumber(pt?.confidence, 0, 1, 0.9).toFixed(2)),
        }))
      : getDefaultLandmarks(view)

  const validStatuses = new Set(['optimal', 'mild', 'moderate', 'severe'])
  const rawAngles: BiomechanicalAngle[] =
    Array.isArray(parsed?.angles) && parsed.angles.length > 0
      ? parsed.angles.map((ang: Partial<BiomechanicalAngle>, idx: number) => ({
          name: typeof ang?.name === 'string' && ang.name ? ang.name : `Joint Angle ${idx + 1}`,
          angleDegrees: Number(clampNumber(ang?.angleDegrees, 0, 180, 8).toFixed(1)),
          status: validStatuses.has(ang?.status as string)
            ? (ang.status as BiomechanicalAngle['status'])
            : 'moderate',
          normalRange: typeof ang?.normalRange === 'string' && ang.normalRange ? ang.normalRange : '< 10°',
          clinicalNote:
            typeof ang?.clinicalNote === 'string' && ang.clinicalNote
              ? sanitizePiiString(ang.clinicalNote)
              : 'Kinetic chain alignment checkpoint evaluated',
        }))
      : getDefaultAngles(view)

  const anglePenalty = rawAngles.reduce((acc, ang) => {
    if (ang.status === 'severe') return acc + 10
    if (ang.status === 'moderate') return acc + 6
    if (ang.status === 'mild') return acc + 3
    return acc
  }, 0)
  const postureScore = isOptimal
    ? Math.max(90, 96 - anglePenalty)
    : Math.max(48, Math.min(92, 92 - anglePenalty - compensations.length * 3))

  const cexPrescription = isOptimal
    ? {
        inhibit: [{ muscle: 'Global Posterior Chain Maintenance', protocol: 'Foam roll flush 30s per region' }],
        lengthen: [{ muscle: 'Dynamic Thoracic & Hip Opener', protocol: 'World’s Greatest Stretch 5 reps/side' }],
        activate: [{ muscle: 'Deep Core & Gluteal Stabilizers', protocol: 'Bird Dog & Supine Bridge 2x10' }],
        integrate: [{ exercise: 'Goblet Squat to Overhead Reach', protocol: '2 sets x 10 reps (3/1/1 tempo)' }],
      }
    : {
        inhibit: [
          { muscle: 'Gastrocnemius & Soleus', protocol: 'SMR 30-60s per tender spot' },
          { muscle: 'Tensor Fasciae Latae (TFL) / IT Band', protocol: 'SMR 30-60s on foam roller' },
          { muscle: 'Latissimus Dorsi', protocol: 'SMR 30-60s under axillary border' },
        ],
        lengthen: [
          { muscle: 'Static Gastrocnemius Stretch', protocol: 'Hold 30s x 2 sets' },
          { muscle: 'Half-Kneeling Hip Flexor Stretch', protocol: 'Hold 30s x 2 sets with posterior pelvic tilt' },
          { muscle: 'Static Ball Latissimus Stretch', protocol: 'Hold 30s x 2 sets' },
        ],
        activate: [
          { muscle: 'Gluteus Medius / Minimus', protocol: 'Banded Side-Lying Clamshells 3x12-15' },
          { muscle: 'Vastus Medialis Oblique (VMO)', protocol: 'Single-Leg Balance to Reach 3x10' },
          { muscle: 'Lower Trapezius & Serratus Anterior', protocol: 'Prone Cobra / Y-Raises 3x12' },
        ],
        integrate: [
          { exercise: 'Squat to Overhead Press with Tubing', protocol: '3 sets x 12 reps (4/2/1 tempo)' },
          { exercise: 'Single-Leg Romanian Deadlift to Balance', protocol: '3 sets x 10 reps/side (3/2/1 tempo)' },
        ],
      }

  const safeSummary =
    typeof parsed?.clinicalSummary === 'string' && parsed.clinicalSummary.trim().length > 0
      ? sanitizePiiString(parsed.clinicalSummary.trim())
      : isOptimal
        ? `Biomechanical scan for ${sanitizeAthleteFirstName(clientName)} demonstrates balanced alignment across kinetic checkpoints.`
        : `Biomechanical scan for ${sanitizeAthleteFirstName(clientName)} indicates kinetic chain compensations consistent with ${syndromeDetected}. 4-Phase CEx continuum calibrated to restore neuromuscular efficiency.`

  return {
    view,
    postureScore,
    landmarks: rawLandmarks,
    angles: rawAngles,
    detectedCompensations: compensations,
    ohsaObservations,
    staticFindings,
    syndromeDetected,
    cexPrescription,
    clinicalSummary: safeSummary,
  }
}

function getDefaultLandmarks(view: PosturalViewType): LandmarkPoint[] {
  if (view === 'lateral') {
    return [
      { id: 'ear', name: 'External Auditory Meatus', x: 44, y: 16, confidence: 0.95 },
      { id: 'c7', name: 'C7 Cervical Vertebra', x: 48, y: 24, confidence: 0.92 },
      { id: 'shoulder', name: 'Acromion Process', x: 49, y: 30, confidence: 0.94 },
      { id: 'hip', name: 'Greater Trochanter', x: 50, y: 52, confidence: 0.96 },
      { id: 'knee', name: 'Lateral Femoral Condyle', x: 51, y: 72, confidence: 0.95 },
      { id: 'ankle', name: 'Lateral Malleolus', x: 50, y: 92, confidence: 0.98 },
    ]
  }

  return [
    { id: 'head', name: 'Cranial Center', x: 50, y: 14, confidence: 0.95 },
    { id: 'l_shoulder', name: 'Left Acromion', x: 38, y: 28, confidence: 0.93 },
    { id: 'r_shoulder', name: 'Right Acromion', x: 62, y: 28, confidence: 0.93 },
    { id: 'l_hip', name: 'Left ASIS', x: 42, y: 50, confidence: 0.95 },
    { id: 'r_hip', name: 'Right ASIS', x: 58, y: 50, confidence: 0.95 },
    { id: 'l_knee', name: 'Left Patella', x: 44, y: 70, confidence: 0.96 },
    { id: 'r_knee', name: 'Right Patella', x: 56, y: 70, confidence: 0.96 },
    { id: 'l_ankle', name: 'Left Medial Malleolus', x: 42, y: 92, confidence: 0.97 },
    { id: 'r_ankle', name: 'Right Medial Malleolus', x: 58, y: 92, confidence: 0.97 },
  ]
}

function getDefaultAngles(view: PosturalViewType): BiomechanicalAngle[] {
  if (view === 'lateral') {
    return [
      { name: 'Craniovertebral (Forward Head)', angleDegrees: 18, status: 'moderate', normalRange: '< 10°', clinicalNote: 'Forward head posture with cervical extension' },
      { name: 'Pelvic Incline (Anterior Tilt)', angleDegrees: 14, status: 'moderate', normalRange: '5° - 10°', clinicalNote: 'Hyperlordosis indicating overactive psoas / rectus femoris' },
      { name: 'Knee Hyperextension', angleDegrees: 4, status: 'optimal', normalRange: '0° - 5°', clinicalNote: 'Knee sagittal alignment within normal limits' },
    ]
  }

  return [
    { name: 'Patellofemoral Q-Angle (Valgus)', angleDegrees: 8.5, status: 'moderate', normalRange: '< 5°', clinicalNote: 'Medial knee collapse relative to 2nd metatarsal' },
    { name: 'Shoulder Transverse Level', angleDegrees: 2.5, status: 'optimal', normalRange: '< 3°', clinicalNote: 'Bilateral shoulder height symmetric' },
    { name: 'Foot Progression Angle', angleDegrees: 14, status: 'moderate', normalRange: '5° - 10°', clinicalNote: 'External tibial torsion / foot turn-out' },
  ]
}

function generateDeterministicPostureScan(view: PosturalViewType, clientName: string): PosturalMeshScanResult {
  const safeName = sanitizeAthleteFirstName(clientName)
  const neutralResult = formatScanResult(
    {
      syndromeDetected: 'Optimal Alignment',
      landmarks: [],
      angles: [],
      detectedCompensations: [],
      clinicalSummary: `Automated AI vision landmark extraction was unavailable for ${safeName}. No synthetic postural distortion syndrome was inferred—complete manual visual OHSA checkpoint observation before saving assessment findings.`,
    },
    view,
    safeName
  )

  return {
    ...neutralResult,
    landmarks: [],
    angles: [],
    isUnverifiedFallback: true,
  }
}
