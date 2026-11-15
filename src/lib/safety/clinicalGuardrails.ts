/**
 * Forge Athletic — Client Safety & Brand Safety Guardrail Layer
 *
 * Enforces deterministic clinical boundaries, pain-vs-effort triage,
 * NASM OPT™ progression/intensity caps, Coach Portal `safety_flag` alerts,
 * PII/camera-frame privacy stripping (HIPAA 1996 aligned), and Coach Gordon AI
 * brand-safety output validation.
 */

import { trackEvent } from '@/src/lib/telemetry/telemetryClient'

export const RED_FLAG_KEYWORDS = [
  'sharp pain',
  'shooting',
  'numbness',
  'tingling',
  'dizzy',
  'dizziness',
  'chest pain',
  'pop',
  'popped',
  'swelling',
  'swollen',
] as const

const EMERGENCY_CARDIO_KEYWORDS = [
  'chest pain',
  'chest pressure',
  'dizzy',
  'dizziness',
  'faint',
  'fainting',
  'passed out',
  'blacked out',
  'shortness of breath at rest',
] as const

export type SafetyOverrideSeverity =
  | 'clear'
  | 'joint_regression'
  | 'clinical_stop'
  | 'emergency_911'

export type SafetyTriggerSource =
  | 'in_set_pinchy_button'
  | 'joint_comfort_log'
  | 'ai_chat_red_flag'

export interface ExerciseRegressionChainStep {
  replacementExercise: string
  nextStepDownExercise: string
  prescribedTempo: string
  rationale: string
  jointProtected: string
}

export interface PainTriageInput {
  messageText?: string
  painLevel5?: number | null
  jointComfort10?: number | null
  jointComfort100?: number | null
  pinchyButtonTriggered?: boolean
  exerciseName?: string | null
  jointAreaHint?: string | null
  optPhase?: number | null
}

export interface SafetyOverrideDecision {
  triggered: boolean
  shouldPauseMovement: boolean
  severity: SafetyOverrideSeverity
  matchedKeywords: string[]
  detectedJointArea: string
  headline: string
  calmCoachMessage: string
  clinicalDisclaimer: string
  spokenCueKey: 'safety_pause_check'
  regression: ExerciseRegressionChainStep | null
  requiresCoachPortalAlert: boolean
}

export const CLINICAL_BOUNDARY_DISCLAIMER =
  'Forge Athletic provides evidence-based fitness coaching—not medical diagnosis or physical therapy. Stop any movement causing sharp, popping, swelling, or radiating symptoms and consult a licensed healthcare provider if symptoms persist.'

export const EMERGENCY_CLINICAL_DISCLAIMER =
  'Stop exercising immediately, sit or lie down safely, and call 911 (or local emergency services) if you experience chest pain, acute dizziness, fainting, or shortness of breath. Forge Athletic provides fitness coaching, not emergency medical care.'

const SAFE_REGRESSION_CHAINS: Array<{
  match: RegExp
  jointProtected: string
  steps: [string, string]
  tempo: string
  rationale: string
}> = [
  {
    match: /overhead.*press|shoulder press|military press|arnold press|push press/i,
    jointProtected: 'Glenohumeral & Subacromial Shoulder Space',
    steps: ['Landmine / High-Incline Neutral Dumbbell Press', 'Scapular Wall Slide'],
    tempo: '3-1-1-0',
    rationale:
      'Shifts pressing into the scapular plane with neutral humeral rotation to clear subacromial pinch while keeping upper-chest and deltoid stimulus.',
  },
  {
    match: /landmine.*press|high[- ]incline.*neutral.*press/i,
    jointProtected: 'Shoulder Complex',
    steps: ['Scapular Wall Slide', 'Side-Lying External Rotation (Isometric Hold)'],
    tempo: '3-2-1-1',
    rationale:
      'Removes axial compressive load completely and restores upward scapular rotation and lower-trapezius control.',
  },
  {
    match: /bench press|chest press|push[- ]?up|dip|fly/i,
    jointProtected: 'Anterior Shoulder & Acromioclavicular Joint',
    steps: ['Floor Neutral-Grip Dumbbell Press', 'Standing Cable / Band Scapular Punch'],
    tempo: '3-1-1-0',
    rationale:
      'The floor mechanically limits humeral extension past 90 degrees so the anterior capsule stays calm and protected.',
  },
  {
    match: /deadlift|rdl|romanian|good morning|hinge|kettlebell swing|barbell row/i,
    jointProtected: 'Lumbar Spine & Sacroiliac Joint',
    steps: ['Supported Dumbbell Glute Bridge', 'Supine 90/90 Core Dead Bug'],
    tempo: '3-2-1-0',
    rationale:
      'Unloads lumbar shear torque while maintaining full posterior-chain glute recruitment with neutral pelvic support.',
  },
  {
    match: /squat|leg press|hack squat|leg extension|lunge|split squat|step[- ]?up/i,
    jointProtected: 'Patellofemoral Knee & Hip Capsule',
    steps: ['Box-Supported Goblet Squat (Pain-Free Depth)', 'Isometric Wall Sit / Glute Bridge'],
    tempo: '3-2-1-0',
    rationale:
      'Verticalizes tibial shin angle and controls bottom-range joint torque with a repeatable box target.',
  },
  {
    match: /pull[- ]?up|chin[- ]?up|lat pulldown|upright row/i,
    jointProtected: 'Shoulder & Elbow Tendons',
    steps: ['Chest-Supported Neutral-Grip Row', 'Banded Prone Scapular Retraction'],
    tempo: '3-1-1-1',
    rationale:
      'Moves out of end-range overhead elevation into neutral-wrist horizontal pulling for zero shoulder or elbow pinch.',
  },
  {
    match: /curl|tricep|skullcrusher|wrist|plank/i,
    jointProtected: 'Wrist & Elbow Complex',
    steps: ['Neutral-Grip Hammer Curl / Rope Pressdown', 'Forearm Plank / Isometric Cuff Hold'],
    tempo: '3-1-1-0',
    rationale:
      'Aligns the radius and ulna in neutral pronation/supination to relieve wrist and epicondyle strain.',
  },
]

export function detectJointAreaFromText(
  text?: string | null,
  exerciseName?: string | null,
  hint?: string | null
): string {
  if (hint && hint.trim()) return hint.trim()
  const msgLower = (text || '').toLowerCase()
  const combined = `${text || ''} ${exerciseName || ''}`.toLowerCase()
  if (/\b(chest pain|chest pressure|heart|sternum)\b/.test(msgLower)) return 'Chest / Cardiorespiratory'
  if (/\b(dizzy|dizziness|vertigo|lightheaded|faint|fainting)\b/.test(msgLower)) return 'Systemic / Vestibular'
  if (/\b(neck|cervical|trap|trapezius)\b/.test(combined)) return 'Neck & Cervical Spine'
  if (/\b(shoulder|shoulders|rotator|deltoid|overhead|military|landmine|incline|bench)\b/.test(combined))
    return 'Shoulder'
  if (/\b(low back|lower back|lumbar|spine|disc|sciatic|deadlift|rdl|hinge)\b/.test(combined))
    return 'Lower Back (Lumbar)'
  if (/\b(hip|hips|groin|pelvis|glute)\b/.test(combined)) return 'Hip'
  if (/\b(knee|knees|patella|meniscus|squat|lunge)\b/.test(combined)) return 'Knee'
  if (/\b(ankle|achilles|calf|foot)\b/.test(combined)) return 'Ankle & Foot'
  if (/\b(wrist|carpal|hand|elbow|forearm)\b/.test(combined)) return 'Wrist & Elbow'
  return 'Active Working Joint'
}

export function resolveSafeRegressionStep(exerciseName?: string | null): ExerciseRegressionChainStep {
  const cleanName = (exerciseName || '').trim()
  for (const chain of SAFE_REGRESSION_CHAINS) {
    if (chain.match.test(cleanName)) {
      const isAlreadyFirstStep =
        cleanName.toLowerCase() === chain.steps[0].toLowerCase()
      return {
        replacementExercise: isAlreadyFirstStep ? chain.steps[1] : chain.steps[0],
        nextStepDownExercise: chain.steps[1],
        prescribedTempo: chain.tempo,
        rationale: chain.rationale,
        jointProtected: chain.jointProtected,
      }
    }
  }

  return {
    replacementExercise: 'Supported Bodyweight Box Squat / Glute Bridge',
    nextStepDownExercise: 'Supine Diaphragmatic Breathing & Dead Bug',
    prescribedTempo: '3-2-1-0',
    rationale:
      'Reduces joint shear and axial load immediately so we can verify pain-free control across every checkpoint.',
    jointProtected: 'Primary Kinetic Chain',
  }
}

/**
 * Evaluates member pain logs, 1-tap "Joint Feels Pinchy" triggers, and Coach Gordon AI
 * red-flag keywords (`sharp pain`, `shooting`, `numbness`, `tingling`, `dizzy`, `dizziness`,
 * `chest pain`, `pop`, `swelling`).
 */
export function evaluatePainAndRedFlagTriage(input: PainTriageInput): SafetyOverrideDecision {
  const normalizedText = (input.messageText || '').toLowerCase()

  const matchedKeywords: string[] = []
  for (const kw of RED_FLAG_KEYWORDS) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`\\b${escaped}\\b`, 'i')
    if (regex.test(normalizedText)) {
      matchedKeywords.push(kw)
    }
  }

  const isEmergencyCardio = EMERGENCY_CARDIO_KEYWORDS.some(kw => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`\\b${escaped}\\b`, 'i').test(normalizedText)
  })

  const highPain5 = typeof input.painLevel5 === 'number' && input.painLevel5 >= 4
  const lowComfort10 = typeof input.jointComfort10 === 'number' && input.jointComfort10 <= 4
  const lowComfort100 = typeof input.jointComfort100 === 'number' && input.jointComfort100 <= 40

  const detectedJointArea = detectJointAreaFromText(
    input.messageText,
    input.exerciseName,
    input.jointAreaHint
  )

  if (isEmergencyCardio) {
    return {
      triggered: true,
      shouldPauseMovement: true,
      severity: 'emergency_911',
      matchedKeywords: matchedKeywords.length > 0 ? matchedKeywords : ['emergency_symptom'],
      detectedJointArea,
      headline: 'Immediate Safety Pause — Stop All Exercise Now',
      calmCoachMessage:
        "Pause your workout right here, set any weights down safely, and sit or lie down comfortably. We never train through chest pain or dizziness—please seek immediate medical attention or call 911 if symptoms don't resolve right away.",
      clinicalDisclaimer: EMERGENCY_CLINICAL_DISCLAIMER,
      spokenCueKey: 'safety_pause_check',
      regression: null,
      requiresCoachPortalAlert: true,
    }
  }

  if (matchedKeywords.length > 0 || highPain5) {
    const regression = resolveSafeRegressionStep(input.exerciseName)
    return {
      triggered: true,
      shouldPauseMovement: true,
      severity: 'clinical_stop',
      matchedKeywords:
        matchedKeywords.length > 0
          ? matchedKeywords
          : [`pain_${input.painLevel5}_of_5`],
      detectedJointArea,
      headline: `Movement Paused — Protecting Your ${detectedJointArea}`,
      calmCoachMessage: input.exerciseName
        ? `Let's pause ${input.exerciseName} right away—we never push through sharp, popping, or radiating joint pain. Take a calm breath; we can either stop loading that area completely today or switch to ${regression.replacementExercise} only if 100% symptom-free.`
        : `Let's pause loading your ${detectedJointArea.toLowerCase()} right away—we never push through sharp, popping, or radiating pain. Your long-term joint health always comes before any single workout.`,
      clinicalDisclaimer: CLINICAL_BOUNDARY_DISCLAIMER,
      spokenCueKey: 'safety_pause_check',
      regression,
      requiresCoachPortalAlert: true,
    }
  }

  if (input.pinchyButtonTriggered || lowComfort10 || lowComfort100) {
    const regression = resolveSafeRegressionStep(input.exerciseName)
    return {
      triggered: true,
      shouldPauseMovement: true,
      severity: 'joint_regression',
      matchedKeywords: input.pinchyButtonTriggered
        ? ['joint_feels_pinchy']
        : ['low_joint_comfort'],
      detectedJointArea,
      headline: input.exerciseName
        ? `Safe Regression Applied — ${regression.replacementExercise}`
        : `Joint Protection Active — ${detectedJointArea}`,
      calmCoachMessage: input.exerciseName
        ? `Good call flagging that early. I paused ${input.exerciseName} and swapped your remaining sets to ${regression.replacementExercise} (${regression.prescribedTempo} tempo). ${regression.rationale}`
        : `Saw your ${detectedJointArea.toLowerCase()} comfort is low today, so I capped axial load and prioritized supported, joint-friendly variations.`,
      clinicalDisclaimer: CLINICAL_BOUNDARY_DISCLAIMER,
      spokenCueKey: 'safety_pause_check',
      regression,
      requiresCoachPortalAlert: true,
    }
  }

  return {
    triggered: false,
    shouldPauseMovement: false,
    severity: 'clear',
    matchedKeywords: [],
    detectedJointArea,
    headline: 'Cleared to Train',
    calmCoachMessage: '',
    clinicalDisclaimer: CLINICAL_BOUNDARY_DISCLAIMER,
    spokenCueKey: 'safety_pause_check',
    regression: null,
    requiresCoachPortalAlert: false,
  }
}

/**
 * Dispatches a high-priority `safety_flag` event to Coach Gordon's Coach Portal
 * so the real Coach Gordon sees the exact exercise, joint area, action taken, and timestamp.
 */
export async function dispatchSafetyFlagTelemetry(params: {
  decision: SafetyOverrideDecision
  triggerSource: SafetyTriggerSource
  exerciseName?: string | null
  swappedToExercise?: string | null
  painLevel5?: number | null
  comfortScore100?: number | null
  optPhase?: number | null
  clientNote?: string | null
}): Promise<string | null> {
  if (!params.decision.triggered) return null

  const actionTaken =
    params.decision.severity === 'emergency_911'
      ? 'Workout paused immediately · Emergency medical directive shown'
      : params.swappedToExercise
        ? `Paused ${params.exerciseName || 'exercise'} & regressed to ${params.swappedToExercise}`
        : `Paused aggravating movement (${params.decision.detectedJointArea}) & displayed clinical boundary`

  const envelope = await trackEvent(
    'safety_flag',
    {
      severity:
        params.decision.severity === 'clear'
          ? 'joint_regression'
          : params.decision.severity,
      trigger_source: params.triggerSource,
      exercise_name: params.exerciseName ?? null,
      swapped_to_exercise: params.swappedToExercise ?? null,
      joint_area: params.decision.detectedJointArea,
      pain_level_5: params.painLevel5 ?? null,
      comfort_score_100: params.comfortScore100 ?? null,
      matched_keywords: params.decision.matchedKeywords,
      opt_phase: params.optPhase ?? null,
      action_taken: actionTaken,
      client_note: params.clientNote ? sanitizePiiString(params.clientNote).slice(0, 240) : null,
    },
    { immediate: true }
  )
  return envelope?.event_id ?? null
}

export interface ProgressionCapInput {
  currentOptPhase: number
  targetOptPhase?: number
  phase1CompletedSessions?: number
  stabilizationCertified?: boolean
  readinessIndex?: number | null
  jointComfortScore100?: number | null
  jointComfort10?: number | null
  requestedLoadIncreasePct?: number
}

export interface ProgressionAndIntensityCapResult {
  heavyPhaseBlocked: boolean
  effectiveMaxOptPhase: number
  intensityAutoCapped: boolean
  recommendedLoadDeltaPct: number
  maxAllowedRpe: number
  enforcedTempo: string | null
  reasons: string[]
  coachExplanation: string
}

/**
 * Deterministic Load & Progression Caps:
 * 1. Enforces Phase 01 stabilization prerequisites before unlocking heavy Phase 03/04 loads.
 * 2. Auto-caps session intensity when `Forge Readiness Index < 65` or `Joint Comfort <= 4/10` (`<= 40/100`).
 */
export function evaluateProgressionAndIntensityCaps(
  input: ProgressionCapInput
): ProgressionAndIntensityCapResult {
  const reasons: string[] = []
  const desiredPhase = input.targetOptPhase ?? input.currentOptPhase ?? 1
  const phase1Done =
    Boolean(input.stabilizationCertified) ||
    (typeof input.phase1CompletedSessions === 'number' && input.phase1CompletedSessions >= 6)

  let heavyPhaseBlocked = false
  let effectiveMaxOptPhase = desiredPhase

  if (desiredPhase >= 3 && !phase1Done) {
    heavyPhaseBlocked = true
    effectiveMaxOptPhase = Math.min(desiredPhase, 2)
    reasons.push(
      'Phase 01 Stabilization Endurance prerequisites must be completed before unlocking heavy Phase 03/04 loads.'
    )
  }

  const normalizedComfort10 =
    typeof input.jointComfort10 === 'number'
      ? input.jointComfort10
      : typeof input.jointComfortScore100 === 'number'
        ? input.jointComfortScore100 / 10
        : null

  const lowReadiness =
    typeof input.readinessIndex === 'number' && input.readinessIndex < 65
  const lowJointComfort =
    normalizedComfort10 !== null && normalizedComfort10 <= 4

  const intensityAutoCapped = lowReadiness || lowJointComfort

  let recommendedLoadDeltaPct = input.requestedLoadIncreasePct ?? 0
  let maxAllowedRpe = effectiveMaxOptPhase >= 4 ? 8.5 : 8.0
  let enforcedTempo: string | null = null

  if (heavyPhaseBlocked && recommendedLoadDeltaPct > 5) {
    recommendedLoadDeltaPct = 5
    enforcedTempo = '3-1-1-0'
  }

  if (intensityAutoCapped) {
    if (lowJointComfort && lowReadiness) {
      recommendedLoadDeltaPct = -20
      maxAllowedRpe = 6.5
      enforcedTempo = '3-2-1-0'
      reasons.push(
        `Session intensity auto-capped (-20% load, max RPE 6.5) because Readiness Index is ${input.readinessIndex}/100 and Joint Comfort is ${Math.round((normalizedComfort10 ?? 4) * 10)}/100.`
      )
    } else if (lowJointComfort) {
      recommendedLoadDeltaPct = -15
      maxAllowedRpe = 7.0
      enforcedTempo = '3-2-1-0'
      reasons.push(
        `Session intensity auto-capped (-15% load, max RPE 7.0) to protect joints while Joint Comfort is <= 4/10.`
      )
    } else {
      recommendedLoadDeltaPct = -15
      maxAllowedRpe = 7.0
      enforcedTempo = '3-1-1-0'
      reasons.push(
        `Session intensity auto-capped (-15% load, max RPE 7.0) because Forge Readiness Index (${input.readinessIndex}/100) is below 65.`
      )
    }
  } else if (recommendedLoadDeltaPct > 10) {
    // Prevent unsafe single-session load jumps (>10%) even when well-recovered
    recommendedLoadDeltaPct = 7.5
    reasons.push(
      'Single-session load progression capped at +7.5% to protect connective tissue adaptation.'
    )
  }

  const coachExplanation =
    reasons.length > 0
      ? reasons.join(' ')
      : 'Readiness, joint comfort, and OPT™ stabilization prerequisites are clear for standard progression.'

  return {
    heavyPhaseBlocked,
    effectiveMaxOptPhase,
    intensityAutoCapped,
    recommendedLoadDeltaPct,
    maxAllowedRpe,
    enforcedTempo,
    reasons,
    coachExplanation,
  }
}

export const BRAND_SAFETY_SYSTEM_DIRECTIVES = `
Paramount Forge Athletic Clinical & Brand Safety Guardrails (Strict Enforcement):
1. NEVER diagnose injuries, pathology, tears, herniations, or medical conditions. Always frame guidance as NASM movement coaching and refer acute/persistent symptoms to a licensed physician or physical therapist.
2. NEVER prescribe extreme diets, starvation calories (< 1,200 kcal/day), crash fasting, unverified supplements, peptides, SARMs, steroids, or prescription medications.
3. NEVER use toxic "no pain, no gain", "stop making excuses", or shaming language. Maintain Coach Gordon's calm, encouraging, 18-year NASM veteran voice at all times ("Earn the right to add load", "A smart modification beats a skipped workout every time").
4. NEVER request or reference raw camera images, personal phone numbers, email addresses, or medical record identifiers.
5. NEVER use technical AI/database acronyms such as "RAG", "pgvector", "BM25", or "vector database" when speaking to a client—always speak naturally in plain coaching language ("my coaching experience", "sports science principles", or "your training plan").
6. NEVER ask clinical diagnostic or symptom-probing questions (never ask "Where does it hurt?", "Rate your pain 1–10", "What kind of pain is it?", "Is the pain sharp or dull?", "Does the pain radiate?", or "Describe your symptoms"). Keep check-in questions strictly focused on 100% comfortable movement execution, equipment availability, or effort/tempo readiness, and instruct the client to stop immediately and consult a licensed physician or physical therapist if anything feels less than 100% comfortable.
7. NEVER refer to the platform or company as legacy internal names—always use "Forge Athletic" (or "Forge").
`.trim()

const PROHIBITED_SYMPTOM_PROBING_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  {
    pattern: /\b(where|how\s+bad(ly)?)\s+does\s+(it|that|your\s+[a-z]+)\s+hurt[^.?!]*[.?!]?/gi,
    replacement:
      'Does that adjusted movement setup feel 100% smooth and comfortable—and remember, if there is any discomfort at all, stop immediately and check in with a licensed physician or physical therapist.',
  },
  {
    pattern: /\brate\s+your\s+pain\b[^.?!]*[.?!]?/gi,
    replacement:
      'Confirm the movement feels 100% comfortable before continuing, and stop immediately if any discomfort is present.',
  },
  {
    pattern:
      /\b(what\s+(kind|type)\s+of\s+pain|is\s+(the|your|it)\s+pain\s+(sharp|dull|throbbing|aching)|does\s+(the|your|that)\s+pain\s+(radiate|spread|shoot|travel)|describe\s+(the|your)\s+(pain|symptoms))\b[^.?!]*[.?!]?/gi,
    replacement:
      'If you notice any sharp, radiating, or persistent symptoms, stop the exercise right away and have a licensed physician or physical therapist evaluate it.',
  },
]

const PROHIBITED_DIAGNOSIS_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  {
    pattern: /\byou (definitely |clearly |likely )?have a (torn|ruptured|herniated|bulging|pinched|fractured)\s+[a-z\s]+/gi,
    replacement:
      'those symptoms warrant an evaluation from a licensed physician or physical therapist so we never guess at structural tissue status',
  },
  {
    pattern: /\bi diagnose you with\b[^.?!]*/gi,
    replacement:
      'as your fitness coach I stay strictly within movement coaching and leave medical diagnosis to your physician',
  },
]

const PROHIBITED_EXTREME_DIET_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  {
    pattern: /\b(eat|drop to|consume)\s+(only\s+)?([3-9]\d{2}|1[01]\d{2})\s*(kcal|calories)\b/gi,
    replacement:
      'fuel sustainably with balanced protein pacing (30–40g per meal) rather than extreme low-calorie restriction',
  },
  {
    pattern: /\b(water fast for \d+ days|starvation diet|dry fast|take (sarms|anavar|trenbolone|clenbuterol|ephedrine))\b/gi,
    replacement:
      'stick with sustainable whole-food fueling, hydration, and third-party tested basics',
  },
]

const PROHIBITED_TOXIC_LANGUAGE_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  {
    pattern: /\bno pain,?\s*no gain\b/gi,
    replacement: 'smart mechanics build lasting strength',
  },
  {
    pattern: /\bpush through the (sharp )?pain\b/gi,
    replacement: 'listen to your joints and regress to a pain-free range',
  },
  {
    pattern: /\b(stop making excuses|don'?t be weak|man up|suck it up)\b/gi,
    replacement: "let's meet your body right where it is today",
  },
]

export interface BrandSafetyValidationResult {
  cleanText: string
  wasModified: boolean
  violationsTriggered: string[]
}

/**
 * Post-generation validator ensuring Coach Gordon AI output never contains
 * medical diagnoses, starvation diets/unverified compounds, or toxic "no pain, no gain" language.
 */
export function validateCoachBrandSafetyOutput(rawText: string): BrandSafetyValidationResult {
  let cleanText = rawText || ''
  const violationsTriggered: string[] = []

  for (const rule of PROHIBITED_DIAGNOSIS_PATTERNS) {
    if (rule.pattern.test(cleanText)) {
      violationsTriggered.push('medical_diagnosis_blocked')
      cleanText = cleanText.replace(rule.pattern, rule.replacement)
    }
    rule.pattern.lastIndex = 0
  }

  for (const rule of PROHIBITED_EXTREME_DIET_PATTERNS) {
    if (rule.pattern.test(cleanText)) {
      violationsTriggered.push('extreme_diet_or_compound_blocked')
      cleanText = cleanText.replace(rule.pattern, rule.replacement)
    }
    rule.pattern.lastIndex = 0
  }

  for (const rule of PROHIBITED_TOXIC_LANGUAGE_PATTERNS) {
    if (rule.pattern.test(cleanText)) {
      violationsTriggered.push('toxic_coaching_language_blocked')
      cleanText = cleanText.replace(rule.pattern, rule.replacement)
    }
    rule.pattern.lastIndex = 0
  }

  for (const rule of PROHIBITED_SYMPTOM_PROBING_PATTERNS) {
    if (rule.pattern.test(cleanText)) {
      violationsTriggered.push('clinical_symptom_probing_blocked')
      cleanText = cleanText.replace(rule.pattern, rule.replacement)
    }
    rule.pattern.lastIndex = 0
  }

  // Scrub internal technical AI/retrieval acronyms so client copy always stays warm and plain-spoken
  if (/\b(RAG\s+(library|knowledge\s+base|engine|system)|RAG|pgvector|BM25)\b/.test(cleanText)) {
    violationsTriggered.push('technical_jargon_scrubbed')
    cleanText = cleanText
      .replace(/\bRAG\s+(library|knowledge\s+base|engine|system)\b/g, 'coaching methodology')
      .replace(/\bRAG\b/g, 'coaching system')
      .replace(/\b(pgvector|BM25)\b/gi, 'coaching system')
  }

  // Enforce Forge Athletic brand nomenclature on all generated coaching text & voice scripts
  if (/\b(Gordon\s+Athletic(\s+Advisory)?|GAA)\b/i.test(cleanText)) {
    violationsTriggered.push('legacy_brand_token_rewritten')
    cleanText = cleanText
      .replace(/\bGordon\s+Athletic(\s+Advisory)?\b/gi, 'Forge Athletic')
      .replace(/\bGAA\b/g, 'Forge Athletic')
      .replace(/\bForge Athletic\s+Forge Athletic\b/g, 'Forge Athletic')
  }

  return {
    cleanText,
    wasModified: violationsTriggered.length > 0,
    violationsTriggered: Array.from(new Set(violationsTriggered)),
  }
}

export function sanitizePiiString(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
    .replace(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g, '[REDACTED_PHONE]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]')
    .replace(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, '[STRIPPED_CAMERA_FRAME]')
}

const RAW_FRAME_OR_PII_KEYS = new Set([
  'attachedimage',
  'imagedataurl',
  'capturedimagesrc',
  'rawframe',
  'videoframe',
  'cameraframe',
  'base64image',
  'email',
  'phone',
  'phonenumber',
  'ssn',
  'streetaddress',
  'address',
  'accesstoken',
  'authorization',
])

/**
 * Strips all PII and raw camera frames before sending structured telemetry context to AI endpoints.
 * Keeps only athlete first name (if provided) and non-identifying sports-science context.
 */
export function stripPiiAndRawFramesFromCoachContext<T extends Record<string, unknown>>(
  context: T
): Partial<T> {
  const walk = (val: unknown, keyName?: string): unknown => {
    if (keyName && RAW_FRAME_OR_PII_KEYS.has(keyName.toLowerCase())) {
      return undefined
    }
    if (typeof val === 'string') {
      if (val.startsWith('data:image/') || val.startsWith('blob:')) {
        return undefined
      }
      if (keyName?.toLowerCase() === 'athletename' || keyName?.toLowerCase() === 'firstname') {
        const firstOnly = sanitizePiiString(val).trim().split(/\s+/)[0] || 'Member'
        return firstOnly.slice(0, 24)
      }
      return sanitizePiiString(val)
    }
    if (Array.isArray(val)) {
      return val.map(item => walk(item)).filter(item => item !== undefined)
    }
    if (val && typeof val === 'object') {
      const cleaned: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        const nextVal = walk(v, k)
        if (nextVal !== undefined) {
          cleaned[k] = nextVal
        }
      }
      return cleaned
    }
    return val
  }

  return (walk(context) as Partial<T>) || {}
}
