import type { GeneratedExerciseItem, GeneratedMacrocyclePlan } from './rag-nasm-program-generator'

export const COACH_DISPLAY_NAME = 'Coach Gordon'

export interface PersonalizationContext {
  clientName?: string
  goal?: string
  targetPhase?: number
  kineticCompensations?: string[]
  injuriesLimitations?: string
  contraindicationTags?: string[]
  movementSuperpowers?: string[]
  functionalDemands?: string
}

type CompensationKey = 'knee_valgus' | 'arms_forward' | 'low_back' | 'forward_lean' | 'feet_turn_out' | 'shoulder_elevation' | 'head_forward'

const COMPENSATION_MATCHERS: Array<{ key: CompensationKey; pattern: RegExp; label: string }> = [
  { key: 'knee_valgus', pattern: /valgus|knees?[ _-]*(cave|move in|in\b)/i, label: 'knees caving in' },
  { key: 'arms_forward', pattern: /arms?[ _-]*fall[ _-]*forward/i, label: 'arms drifting forward overhead' },
  { key: 'low_back', pattern: /pelvic[ _-]*tilt|low(er)?[ _-]*back[ _-]*arch/i, label: 'lower back arching' },
  { key: 'forward_lean', pattern: /forward[ _-]*lean/i, label: 'excessive forward lean' },
  { key: 'feet_turn_out', pattern: /feet?[ _-]*(turn|flatten)/i, label: 'feet turning out' },
  { key: 'shoulder_elevation', pattern: /shoulder[ _-]*elevat/i, label: 'shoulders shrugging up' },
  { key: 'head_forward', pattern: /head[ _-]*forward|forward[ _-]*head/i, label: 'head drifting forward' },
]

function detectCompensations(compensations: string[] | undefined) {
  const found = new Map<CompensationKey, string>()
  for (const raw of compensations ?? []) {
    for (const matcher of COMPENSATION_MATCHERS) {
      if (matcher.pattern.test(raw) && !found.has(matcher.key)) {
        found.set(matcher.key, matcher.label)
      }
    }
  }
  return found
}

function firstName(clientName?: string) {
  const name = (clientName || '').trim().split(/\s+/)[0]
  return name && !/^(new|template|athlete)$/i.test(name) ? name : ''
}

function normalizeGoal(goal?: string) {
  const g = (goal || '').toLowerCase()
  if (/fat|loss|lean|weight/.test(g)) return 'fat_loss'
  if (/hypertroph|muscle|build/.test(g)) return 'hypertrophy'
  if (/strength/.test(g)) return 'strength'
  if (/perform|power|sport|athlet/.test(g)) return 'performance'
  return 'general_fitness'
}

function limitationText(ctx: PersonalizationContext) {
  const text = (ctx.injuriesLimitations || '').trim()
  if (text) return text.replace(/\.$/, '')
  const tags = (ctx.contraindicationTags ?? []).filter(Boolean)
  return tags.length > 0 ? tags.join(', ') : ''
}

const GOAL_RESISTANCE_REASON: Record<string, string> = {
  fat_loss: 'Big-muscle work that drives the metabolic burn behind your fat-loss goal.',
  hypertrophy: 'Focused volume on the muscles you want to build — this is where your shape changes.',
  strength: 'Builds the raw strength you came here for, one controlled rep at a time.',
  performance: 'Develops the force and control that carries over to how you perform.',
  general_fitness: 'Builds balanced, real-world strength so everyday life feels easier.',
}

const PHASE_SHORT_NAME: Record<number, string> = {
  1: 'stability',
  2: 'strength endurance',
  3: 'muscle building',
  4: 'maximal strength',
  5: 'power',
}

/**
 * Builds a one-sentence, client-facing reason an exercise is in this athlete's plan.
 */
export function buildPersonalReason(exercise: GeneratedExerciseItem, ctx: PersonalizationContext): string {
  const name = exercise.name.toLowerCase()
  const comps = detectCompensations(ctx.kineticCompensations)
  const limitation = limitationText(ctx)

  if (exercise.contraindicationReplacedFrom) {
    return limitation
      ? `Chosen instead of ${exercise.contraindicationReplacedFrom} to protect your ${limitation.toLowerCase()} while still training the same pattern.`
      : `Chosen instead of ${exercise.contraindicationReplacedFrom} so you get the same benefit with less joint stress.`
  }

  const superpower = (ctx.movementSuperpowers ?? []).find(power =>
    name.includes(power.replace(/_/g, ' ').toLowerCase().replace(/s$/, ''))
  )
  if (superpower) {
    return `You told me you're great at ${superpower.replace(/_/g, ' ')} — so we're using that strength to push your conditioning.`
  }

  const isUpperPull = /row|pull|lat|rear|face pull|reverse fly|ys?\b|t-raise|w-raise/.test(name)
  const isLowerKneeDominant = /squat|lunge|step|split|leg press|single[- ]leg/.test(name)
  const isHipDominant = /bridge|glute|hip thrust|hinge|deadlift|rdl|clam|band walk|tube walk/.test(name)
  const isCore = /plank|dead bug|bird dog|crunch|core|march|pallof|bracing|drawing/.test(name)
  const isSmr = /foam|smr|roll|release/.test(name)
  const isStretch = /stretch/.test(name)

  if (exercise.block === 'warmup') {
    if (isSmr && comps.has('arms_forward') && /lat|pec|chest|thoracic/.test(name)) {
      return 'Releases the tight lats and chest that pull your arms forward overhead — so the rest of today moves cleaner.'
    }
    if (isSmr && comps.has('knee_valgus') && /adductor|tfl|it band|calf|calves/.test(name)) {
      return 'Releases the tissue that pulls your knees inward, so your knees track better in every leg exercise today.'
    }
    if ((isSmr || isStretch) && comps.has('low_back') && /hip flexor|quad|psoas|lat/.test(name)) {
      return 'Lengthens the tight hip flexors that tip your pelvis and load your lower back.'
    }
    return 'Gets your joints and nervous system ready so every rep after this counts.'
  }

  if (exercise.block === 'cooldown') {
    return 'Brings your heart rate down and restores length to what you just trained, so you recover faster for next session.'
  }

  if (exercise.block === 'saq') {
    return 'Sharpens your reaction, footwork, and coordination — the athletic qualities that keep you quick and resilient.'
  }

  if (comps.has('arms_forward') && isUpperPull) {
    return 'Strengthens your upper back to correct the arms-forward drift I saw in your movement screen.'
  }
  if (comps.has('knee_valgus') && (isLowerKneeDominant || isHipDominant)) {
    return 'Trains your glutes to keep your knees tracking straight — directly targeting the knee cave from your screen.'
  }
  if (comps.has('low_back') && (isHipDominant || isCore)) {
    return 'Builds the glute and deep-core strength that takes pressure off your lower back.'
  }

  if (exercise.block === 'core_balance') {
    if (limitation && /back|spine|lumbar|disc/i.test(limitation)) {
      return 'Strengthens the deep core that protects your lower back, so you can train harder without flare-ups.'
    }
    if (limitation && /knee|ankle/i.test(limitation)) {
      return 'Builds ankle, knee, and hip control so your joints stay stable under load.'
    }
    return 'Builds the stability that keeps you injury-free as the work gets harder.'
  }

  return GOAL_RESISTANCE_REASON[normalizeGoal(ctx.goal)]
}

/**
 * Builds a short, warm note from the coach to the athlete, delivered with the plan.
 */
export function buildCoachPersonalNote(ctx: PersonalizationContext): string {
  const name = firstName(ctx.clientName)
  const comps = [...detectCompensations(ctx.kineticCompensations).values()]
  const limitation = limitationText(ctx)
  const goal = normalizeGoal(ctx.goal)
  const phaseName = ctx.targetPhase ? PHASE_SHORT_NAME[ctx.targetPhase] : undefined

  const goalLine: Record<string, string> = {
    fat_loss: 'Everything here is pointed at helping you lean out in a way you can actually sustain.',
    hypertrophy: 'Everything here is pointed at building the muscle you want — with smart, steady progression.',
    strength: 'Everything here is pointed at getting you genuinely stronger, safely.',
    performance: 'Everything here is pointed at making you a more powerful, resilient athlete.',
    general_fitness: 'Everything here is pointed at helping you feel stronger and move better in everyday life.',
  }

  const sentences = [
    `${name ? `${name}, ` : ''}I built this program around you — not a template.`,
    goalLine[goal],
  ]

  if (comps.length > 0) {
    sentences.push(`Your movement screen showed ${comps.slice(0, 2).join(' and ')}, so I've woven in specific work to fix that.`)
  }
  if (limitation) {
    sentences.push(`I've also planned around your ${limitation.toLowerCase()} — if anything ever feels off, tell me and we'll adjust.`)
  }
  if (ctx.functionalDemands) {
    sentences.push(`I kept your real life in mind too (${ctx.functionalDemands.trim().replace(/\.$/, '')}).`)
  }
  if (phaseName) {
    sentences.push(`We're starting in a ${phaseName} phase, so own the tempo and quality of every rep.`)
  }
  sentences.push(`Tap "Why this is in your plan" on any exercise to see my reasoning. I'm in your corner. — ${COACH_DISPLAY_NAME}`)

  return sentences.join(' ')
}

/**
 * Ensures every plan carries a personal coach note and a client-facing reason for every exercise.
 * Existing values (from the AI or the coach) are preserved.
 */
export function personalizePlan(plan: GeneratedMacrocyclePlan, ctx: PersonalizationContext): GeneratedMacrocyclePlan {
  const phaseCtx: PersonalizationContext = {
    ...ctx,
    targetPhase: ctx.targetPhase ?? (Number(plan.nasmOptPhase) || undefined),
    goal: ctx.goal ?? plan.primaryGoal,
  }

  return {
    ...plan,
    coachPersonalNote: plan.coachPersonalNote?.trim() ? plan.coachPersonalNote : buildCoachPersonalNote(phaseCtx),
    workouts: plan.workouts.map(workout => ({
      ...workout,
      exercises: workout.exercises.map(exercise => ({
        ...exercise,
        whyForYou: exercise.whyForYou?.trim() ? exercise.whyForYou : buildPersonalReason(exercise, phaseCtx),
      })),
    })),
  }
}
