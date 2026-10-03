/**
 * Gordon Athletic Advisory — RPE & RIR Exertion Science Engine
 * 
 * Based on NASM Resistance Training Concepts, Borg CR10 Scale,
 * and Modern Reps-In-Reserve (RIR) / RPE Velocity Science (Zourdos et al., Helms et al.).
 * 
 * Maps perceived exertion (RPE 1.0 - 10.0) to corresponding Reps In Reserve (RIR 0 - 5+),
 * provides physiological fatigue risk stratification, and enforces biomechanical guardrails.
 */

export type FatigueTier = 'recovery' | 'moderate' | 'high' | 'maximal'

export interface RpeScalePoint {
  rpe: number
  rir: number
  shortLabel: string
  effortDescription: string
  respiratoryPattern: string
  fatigueTier: FatigueTier
  colorHex: string
  bgTint: string
  borderColor: string
}

export const RPE_SCALE_POINTS: RpeScalePoint[] = [
  {
    rpe: 6.0,
    rir: 4.0,
    shortLabel: 'Speed / Warm-up',
    effortDescription: '4+ reps left in reserve. Fast concentric bar speed with effortless control.',
    respiratoryPattern: 'Controlled diaphragmatic breathing; full nasal inhale.',
    fatigueTier: 'recovery',
    colorHex: '#34D399',
    bgTint: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  {
    rpe: 6.5,
    rir: 3.5,
    shortLabel: 'Light Working',
    effortDescription: 'Definite 3-4 reps in reserve. Technical proficiency and stabilization emphasis.',
    respiratoryPattern: 'Cadenced exhale through sticking point without strain.',
    fatigueTier: 'recovery',
    colorHex: '#10B981',
    bgTint: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  {
    rpe: 7.0,
    rir: 3.0,
    shortLabel: 'Crisp Intent',
    effortDescription: '3 reps remaining. Strong bar acceleration; minimal involuntary deceleration.',
    respiratoryPattern: 'Paced breath brace; crisp reset at starting position.',
    fatigueTier: 'moderate',
    colorHex: '#38BDF8',
    bgTint: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  {
    rpe: 7.5,
    rir: 2.5,
    shortLabel: 'Moderate Stimulus',
    effortDescription: '2-3 reps left. Noticeable muscular engagement with crisp kinetic alignment.',
    respiratoryPattern: 'Focused intra-abdominal pressure bracing on descent.',
    fatigueTier: 'moderate',
    colorHex: '#60A5FA',
    bgTint: 'rgba(96, 165, 250, 0.12)',
    borderColor: 'rgba(96, 165, 250, 0.35)',
  },
  {
    rpe: 8.0,
    rir: 2.0,
    shortLabel: 'Solid Hypertrophy',
    effortDescription: '2 clean reps in reserve. Ideal sweet spot for hypertrophy & strength volume.',
    respiratoryPattern: 'Firm Valsalva brace through lockout; controlled recovery exhale.',
    fatigueTier: 'moderate',
    colorHex: '#D4AF37',
    bgTint: 'rgba(212, 175, 55, 0.16)',
    borderColor: 'rgba(212, 175, 55, 0.45)',
  },
  {
    rpe: 8.5,
    rir: 1.5,
    shortLabel: 'Vigorous Load',
    effortDescription: 'Definitely 1 rep left, possibly 2. Bar velocity slows moderately near completion.',
    respiratoryPattern: 'Deep diaphragmatic expansion; explosive mechanical exhale.',
    fatigueTier: 'high',
    colorHex: '#F59E0B',
    bgTint: 'rgba(245, 158, 11, 0.16)',
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  {
    rpe: 9.0,
    rir: 1.0,
    shortLabel: 'Heavy Working Set',
    effortDescription: 'Only 1 rep remaining in the tank. Requires intense focus and technical discipline.',
    respiratoryPattern: 'Maximum intra-abdominal brace; strict core anti-extension.',
    fatigueTier: 'high',
    colorHex: '#F97316',
    bgTint: 'rgba(249, 115, 22, 0.18)',
    borderColor: 'rgba(249, 115, 22, 0.5)',
  },
  {
    rpe: 9.5,
    rir: 0.5,
    shortLabel: 'Near Maximal',
    effortDescription: 'Could not do another full rep, but could take slightly more load. High strain.',
    respiratoryPattern: 'Extreme pressure Valsalva; involuntary grunting / vocalization.',
    fatigueTier: 'maximal',
    colorHex: '#EF4444',
    bgTint: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.6)',
  },
  {
    rpe: 10.0,
    rir: 0.0,
    shortLabel: 'Max Effort / Failure',
    effortDescription: 'Absolute maximum exertion. 0 reps in reserve. Bar speed reached lowest threshold.',
    respiratoryPattern: 'Full autonomic limit; prolonged post-set hyperventilation.',
    fatigueTier: 'maximal',
    colorHex: '#DC2626',
    bgTint: 'rgba(220, 38, 38, 0.24)',
    borderColor: 'rgba(220, 38, 38, 0.75)',
  },
]

/**
 * Normalizes an RPE input string or number to a clamped float between 1.0 and 10.0.
 */
export function normalizeRpeValue(input: number | string | null | undefined): number {
  if (input === null || input === undefined || input === '') return 7.0
  const parsed = typeof input === 'number' ? input : parseFloat(String(input).trim())
  if (isNaN(parsed)) return 7.0
  return Math.min(10.0, Math.max(1.0, Math.round(parsed * 10) / 10))
}

/**
 * Normalizes an RIR input string or number to a clamped float between 0.0 and 6.0.
 */
export function normalizeRirValue(input: number | string | null | undefined): number {
  if (input === null || input === undefined || input === '') return 2.0
  const parsed = typeof input === 'number' ? input : parseFloat(String(input).trim())
  if (isNaN(parsed)) return 2.0
  return Math.min(6.0, Math.max(0.0, Math.round(parsed * 10) / 10))
}

/**
 * Resolves the closest RpeScalePoint for any numeric or string RPE value.
 */
export function getRpeScalePoint(rpeInput: number | string | null | undefined): RpeScalePoint {
  const norm = normalizeRpeValue(rpeInput)
  
  // If below 6.0, synthesize a low-tier warmup scale point
  if (norm < 6.0) {
    return {
      rpe: norm,
      rir: Math.min(6.0, Math.round((10.0 - norm) * 10) / 10),
      shortLabel: 'Kinetic Warm-up / Prep',
      effortDescription: `${Math.round(10 - norm)}+ reps in reserve. Active mobility, joint lubrication, and neuromuscular prep.`,
      respiratoryPattern: 'Effortless rhythmic nasal breathing.',
      fatigueTier: 'recovery',
      colorHex: '#10B981',
      bgTint: 'rgba(16, 185, 129, 0.12)',
      borderColor: 'rgba(16, 185, 129, 0.35)',
    }
  }

  // Find exact or closest scale point
  let closest = RPE_SCALE_POINTS[0]
  let minDiff = Math.abs(norm - closest.rpe)

  for (let i = 1; i < RPE_SCALE_POINTS.length; i++) {
    const pt = RPE_SCALE_POINTS[i]
    const diff = Math.abs(norm - pt.rpe)
    if (diff < minDiff) {
      minDiff = diff
      closest = pt
    }
  }

  return closest
}

/**
 * Maps an RPE value to its expected scientific Reps In Reserve (RIR).
 * Formula: RIR = max(0, 10.0 - RPE)
 */
export function mapRpeToRir(rpe: number): number {
  const clamped = Math.min(10, Math.max(1, rpe))
  const rir = Math.round((10 - clamped) * 10) / 10
  return Math.max(0, rir)
}

/**
 * Maps an RIR value to its expected scientific RPE.
 * Formula: RPE = max(1, 10.0 - RIR)
 */
export function mapRirToRpe(rir: number): number {
  const clamped = Math.min(6, Math.max(0, rir))
  const rpe = Math.round((10 - clamped) * 10) / 10
  return Math.max(1, rpe)
}

export interface FatigueSafetyNotice {
  hasWarning: boolean
  level: 'info' | 'caution' | 'critical'
  title: string
  message: string
}

/**
 * Evaluates athlete fatigue and produces clinical safety guidance.
 * Applies GAA Biomechanical Guardrails for hammer curls (neutral grip, zero supination).
 */
export function getFatigueSafetyNotice(
  exerciseName: string,
  rpe: number,
  rir?: number
): FatigueSafetyNotice | null {
  const normRpe = normalizeRpeValue(rpe)
  const normRir = rir !== undefined ? normalizeRirValue(rir) : mapRpeToRir(normRpe)
  const isHammer = exerciseName.toLowerCase().includes('hammer curl')

  if (normRpe >= 9.5 || normRir <= 0.5) {
    return {
      hasWarning: true,
      level: 'critical',
      title: '⚠️ CNS Peak Strain — Form Breakdown Advisory',
      message: isHammer
        ? 'Maximal exertion reached. Guardrail: Maintain STRICT neutral hammer grip (palms facing inward toward each other) with ZERO twisting or supination. Dumbbells must stay vertical with thumbs pointing up.'
        : 'Zero or near-zero reps in reserve. Heavy central nervous system strain. Protect your kinetic chain: avoid lumbar hyperextension, valgus knee collapse, or neck straining.',
    }
  }

  if (normRpe >= 8.5 || normRir <= 1.5) {
    return {
      hasWarning: false,
      level: 'caution',
      title: '🔥 High Intensity Working Set',
      message: isHammer
        ? 'Heavy set. Lock elbows at sides and keep palms facing inward with neutral wrist alignment. No swinging momentum.'
        : 'High mechanical tension zone. Involuntary deceleration expected. Maintain strict tempo control and abdominal brace.',
    }
  }

  if (normRpe >= 7.0 && normRpe <= 8.0) {
    return {
      hasWarning: false,
      level: 'info',
      title: '⚡ Athletic Hypertrophy & Strength Sweet Spot',
      message: 'Optimal balance of motor unit recruitment and low neurological fatigue. Ideal for progressive overload accumulation.',
    }
  }

  return null
}
