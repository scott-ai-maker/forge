/**
 * NASM Athletic Agility & Neuromuscular Performance Testing Engine
 * 
 * Based on NASM CPT-7:
 * - Chapter 12: Speed, Agility, and Quickness (SAQ)
 * - Chapter 13: Athletic Performance Assessments
 * - Official Normative Tables:
 *   - Davies Upper-Body Agility & Stabilization Test
 *   - Shark Skill Single-Leg Neuromuscular Agility Test
 *   - 5-10-5 Pro Shuttle (Change of Direction & Deceleration)
 *   - 1-Minute Push-Up Muscular Endurance Test
 */

export interface DaviesTestResult {
  averageTouches: number
  trial1: number
  trial2: number
  trial3: number
  fitnessRating: 'Elite' | 'Excellent' | 'Above Average' | 'Average' | 'Below Average' | 'Poor'
  score: number // 0 - 100
  recommendations: string[]
}

export interface SharkSkillResult {
  rightLegTimeSeconds: number
  rightLegAdjustedSeconds: number
  rightLegRating: 'Excellent' | 'Good' | 'Average' | 'Below Average'
  leftLegTimeSeconds: number
  leftLegAdjustedSeconds: number
  leftLegRating: 'Excellent' | 'Good' | 'Average' | 'Below Average'
  asymmetryPercent: number
  dominantLeg: 'right' | 'left' | 'symmetrical'
  score: number // 0 - 100
  coachingCues: string[]
}

export interface ProShuttleResult {
  timeSeconds: number
  rating: 'Elite / Pro' | 'Excellent' | 'Good' | 'Average' | 'Below Average'
  score: number // 0 - 100
  decelerationEfficiency: string
}

export interface PushUpEnduranceResult {
  reps: number
  rating: 'Excellent' | 'Good' | 'Above Average' | 'Average' | 'Below Average' | 'Poor'
  score: number // 0 - 100
}

export interface CompositeAthleticProfile {
  overallAthleticismScore: number // 0 - 100
  tier: 'Elite Competitor' | 'Advanced Athlete' | 'Functional Performer' | 'Developing Athlete'
  upperAgilityScore: number
  lowerAgilityScore: number
  decelerationSpeedScore: number
  muscularEnduranceScore: number
  recommendedOptPhase: string
  actionableInsights: string[]
}

/**
 * 1. DAVIES UPPER-BODY AGILITY TEST
 * Push-up position with 36" (91.4 cm) tape lines. 3 trials of 15 seconds.
 * NASM Norms (CPT-7 Table 13.1):
 * Men: >35 (Excellent), 30-34 (Above Avg), 25-29 (Avg), 20-24 (Below Avg), <20 (Poor)
 * Women: >30 (Excellent), 25-29 (Above Avg), 20-24 (Avg), 15-19 (Below Avg), <15 (Poor)
 */
export function evaluateDaviesTest(
  trial1: number,
  trial2: number,
  trial3: number,
  sex: 'male' | 'female' | 'other' = 'male'
): DaviesTestResult {
  const avg = Math.round(((trial1 + trial2 + trial3) / 3) * 10) / 10
  const isFemale = sex === 'female'

  let fitnessRating: DaviesTestResult['fitnessRating'] = 'Average'
  let score = 70

  if (!isFemale) {
    if (avg >= 38) { fitnessRating = 'Elite'; score = 98 }
    else if (avg >= 35) { fitnessRating = 'Excellent'; score = 90 }
    else if (avg >= 30) { fitnessRating = 'Above Average'; score = 80 }
    else if (avg >= 25) { fitnessRating = 'Average'; score = 70 }
    else if (avg >= 20) { fitnessRating = 'Below Average'; score = 55 }
    else { fitnessRating = 'Poor'; score = 40 }
  } else {
    if (avg >= 34) { fitnessRating = 'Elite'; score = 98 }
    else if (avg >= 30) { fitnessRating = 'Excellent'; score = 90 }
    else if (avg >= 25) { fitnessRating = 'Above Average'; score = 80 }
    else if (avg >= 20) { fitnessRating = 'Average'; score = 70 }
    else if (avg >= 15) { fitnessRating = 'Below Average'; score = 55 }
    else { fitnessRating = 'Poor'; score = 40 }
  }

  const recommendations: string[] = []
  if (score < 75) {
    recommendations.push('Strengthen scapulothoracic stabilizers (Serratus Anterior & Lower Trapezius).')
    recommendations.push('Incorporate Phase 1 Stability Ball Push-ups and prone scaption before high-velocity loading.')
  } else {
    recommendations.push('Upper extremity stability is optimal. Safe for Phase 5 Medicine Ball Chest Pass & Plyometric push-ups.')
  }

  return {
    averageTouches: avg,
    trial1,
    trial2,
    trial3,
    fitnessRating,
    score,
    recommendations,
  }
}

/**
 * 2. SHARK SKILL TEST (9-Box Grid Single-Leg Neuromuscular Agility)
 * 3x3 grid (12" boxes). Hop to each box and back to center in sequence.
 * 0.10s penalty added per fault (hands off hips, non-hopping foot down, line touch, wrong box).
 */
export function evaluateSharkSkillTest(
  rightLegSeconds: number,
  rightLegPenalties: number,
  leftLegSeconds: number,
  leftLegPenalties: number
): SharkSkillResult {
  const rAdj = Math.round((rightLegSeconds + rightLegPenalties * 0.1) * 100) / 100
  const lAdj = Math.round((leftLegSeconds + leftLegPenalties * 0.1) * 100) / 100

  const rateTime = (sec: number): SharkSkillResult['rightLegRating'] => {
    if (sec < 9.0) return 'Excellent'
    if (sec <= 11.5) return 'Good'
    if (sec <= 14.0) return 'Average'
    return 'Below Average'
  }

  const rRating = rateTime(rAdj)
  const lRating = rateTime(lAdj)

  // Asymmetry % = |R - L| / Max(R, L) * 100
  const diff = Math.abs(rAdj - lAdj)
  const maxTime = Math.max(rAdj, lAdj, 1)
  const asymmetryPercent = Math.round((diff / maxTime) * 1000) / 10

  let dominantLeg: SharkSkillResult['dominantLeg'] = 'symmetrical'
  if (asymmetryPercent > 8) {
    dominantLeg = rAdj < lAdj ? 'right' : 'left'
  }

  // Calculate score (0-100)
  const avgTime = (rAdj + lAdj) / 2
  let score = 70
  if (avgTime < 8.5) score = 95
  else if (avgTime < 10.0) score = 85
  else if (avgTime < 12.0) score = 75
  else if (avgTime < 14.0) score = 65
  else score = 50

  if (asymmetryPercent > 15) score = Math.max(40, score - 15)

  const cues: string[] = []
  if (asymmetryPercent > 12) {
    cues.push(`Significant bilateral deficit detected (${asymmetryPercent}% asymmetry). Weaker side (${dominantLeg === 'right' ? 'Left' : 'Right'} Leg) requires dedicated unilateral balance loading.`)
    cues.push('Prescribe Single-Leg Balance Reach and Multiplanar Hop with 3-Second Isometric Stabilization.')
  } else {
    cues.push('Bilateral neuromuscular coordination is well balanced across both lower extremities.')
    cues.push('Candidate for Phase 5 Multiplanar Box Jumps and Ice Skaters.')
  }

  return {
    rightLegTimeSeconds: rightLegSeconds,
    rightLegAdjustedSeconds: rAdj,
    rightLegRating: rRating,
    leftLegTimeSeconds: leftLegSeconds,
    leftLegAdjustedSeconds: lAdj,
    leftLegRating: lRating,
    asymmetryPercent,
    dominantLeg,
    score,
    coachingCues: cues,
  }
}

/**
 * 3. 5-10-5 PRO SHUTTLE TEST
 * Measures lateral change of direction, linear deceleration, and acceleration.
 */
export function evaluateProShuttle(
  timeSeconds: number,
  sex: 'male' | 'female' | 'other' = 'male'
): ProShuttleResult {
  const isFemale = sex === 'female'
  let rating: ProShuttleResult['rating'] = 'Average'
  let score = 70
  let decelerationEfficiency = 'Standard deceleration and plant mechanics.'

  if (!isFemale) {
    if (timeSeconds < 4.25) { rating = 'Elite / Pro'; score = 98; decelerationEfficiency = 'Explosive triple flexion plant with instantaneous re-acceleration.' }
    else if (timeSeconds <= 4.55) { rating = 'Excellent'; score = 88; decelerationEfficiency = 'Strong center of mass drop and rapid hip turn.' }
    else if (timeSeconds <= 4.85) { rating = 'Good'; score = 78; decelerationEfficiency = 'Functional deceleration with minor hip lag during plant.' }
    else if (timeSeconds <= 5.20) { rating = 'Average'; score = 68; decelerationEfficiency = 'Moderate deceleration time; emphasize ankle stiffness and low center of gravity.' }
    else { rating = 'Below Average'; score = 50; decelerationEfficiency = 'High center of mass plant; risk of knee valgus during rapid directional shifts.' }
  } else {
    if (timeSeconds < 4.50) { rating = 'Elite / Pro'; score = 98; decelerationEfficiency = 'Explosive triple flexion plant with instantaneous re-acceleration.' }
    else if (timeSeconds <= 4.80) { rating = 'Excellent'; score = 88; decelerationEfficiency = 'Strong center of mass drop and rapid hip turn.' }
    else if (timeSeconds <= 5.15) { rating = 'Good'; score = 78; decelerationEfficiency = 'Functional deceleration with minor hip lag during plant.' }
    else if (timeSeconds <= 5.50) { rating = 'Average'; score = 68; decelerationEfficiency = 'Moderate deceleration time; emphasize ankle stiffness and low center of gravity.' }
    else { rating = 'Below Average'; score = 50; decelerationEfficiency = 'High center of mass plant; risk of knee valgus during rapid directional shifts.' }
  }

  return {
    timeSeconds,
    rating,
    score,
    decelerationEfficiency,
  }
}

/**
 * 4. 1-MINUTE PUSH-UP ENDURANCE TEST
 * Measures upper body muscular endurance and core lumbo-pelvic stabilization under fatigue.
 */
export function evaluatePushUpEndurance(
  reps: number,
  sex: 'male' | 'female' | 'other' = 'male',
  age: number = 30
): PushUpEnduranceResult {
  const isFemale = sex === 'female'
  let rating: PushUpEnduranceResult['rating'] = 'Average'
  let score = 70

  // Age-bracketed thresholds (ACSM / NASM CPT standards)
  if (!isFemale) {
    if (age < 30) {
      if (reps >= 45) { rating = 'Excellent'; score = 98 }
      else if (reps >= 35) { rating = 'Good'; score = 88 }
      else if (reps >= 25) { rating = 'Above Average'; score = 78 }
      else if (reps >= 18) { rating = 'Average'; score = 68 }
      else if (reps >= 10) { rating = 'Below Average'; score = 50 }
      else { rating = 'Poor'; score = 35 }
    } else if (age < 40) {
      if (reps >= 40) { rating = 'Excellent'; score = 98 }
      else if (reps >= 30) { rating = 'Good'; score = 88 }
      else if (reps >= 22) { rating = 'Above Average'; score = 78 }
      else if (reps >= 15) { rating = 'Average'; score = 68 }
      else if (reps >= 8) { rating = 'Below Average'; score = 50 }
      else { rating = 'Poor'; score = 35 }
    } else if (age < 50) {
      if (reps >= 35) { rating = 'Excellent'; score = 98 }
      else if (reps >= 25) { rating = 'Good'; score = 88 }
      else if (reps >= 18) { rating = 'Above Average'; score = 78 }
      else if (reps >= 12) { rating = 'Average'; score = 68 }
      else if (reps >= 6) { rating = 'Below Average'; score = 50 }
      else { rating = 'Poor'; score = 35 }
    } else {
      if (reps >= 30) { rating = 'Excellent'; score = 98 }
      else if (reps >= 20) { rating = 'Good'; score = 88 }
      else if (reps >= 14) { rating = 'Above Average'; score = 78 }
      else if (reps >= 9) { rating = 'Average'; score = 68 }
      else if (reps >= 4) { rating = 'Below Average'; score = 50 }
      else { rating = 'Poor'; score = 35 }
    }
  } else {
    if (age < 30) {
      if (reps >= 30) { rating = 'Excellent'; score = 98 }
      else if (reps >= 22) { rating = 'Good'; score = 88 }
      else if (reps >= 15) { rating = 'Above Average'; score = 78 }
      else if (reps >= 10) { rating = 'Average'; score = 68 }
      else if (reps >= 5) { rating = 'Below Average'; score = 50 }
      else { rating = 'Poor'; score = 35 }
    } else if (age < 40) {
      if (reps >= 27) { rating = 'Excellent'; score = 98 }
      else if (reps >= 19) { rating = 'Good'; score = 88 }
      else if (reps >= 13) { rating = 'Above Average'; score = 78 }
      else if (reps >= 8) { rating = 'Average'; score = 68 }
      else if (reps >= 4) { rating = 'Below Average'; score = 50 }
      else { rating = 'Poor'; score = 35 }
    } else if (age < 50) {
      if (reps >= 24) { rating = 'Excellent'; score = 98 }
      else if (reps >= 16) { rating = 'Good'; score = 88 }
      else if (reps >= 11) { rating = 'Above Average'; score = 78 }
      else if (reps >= 6) { rating = 'Average'; score = 68 }
      else if (reps >= 3) { rating = 'Below Average'; score = 50 }
      else { rating = 'Poor'; score = 35 }
    } else {
      if (reps >= 20) { rating = 'Excellent'; score = 98 }
      else if (reps >= 13) { rating = 'Good'; score = 88 }
      else if (reps >= 8) { rating = 'Above Average'; score = 78 }
      else if (reps >= 4) { rating = 'Average'; score = 68 }
      else if (reps >= 2) { rating = 'Below Average'; score = 50 }
      else { rating = 'Poor'; score = 35 }
    }
  }

  return {
    reps,
    rating,
    score,
  }
}

/**
 * COMPOSITE ATHLETICISM CALCULATOR
 * Blends upper agility, lower agility, deceleration, and muscular endurance.
 */
export function calculateCompositeAthleticProfile(
  davies?: DaviesTestResult | null,
  shark?: SharkSkillResult | null,
  shuttle?: ProShuttleResult | null,
  pushups?: PushUpEnduranceResult | null
): CompositeAthleticProfile {
  const upperScore = davies?.score ?? 70
  const lowerScore = shark?.score ?? 70
  const decelScore = shuttle?.score ?? 70
  const enduranceScore = pushups?.score ?? 70

  const overallScore = Math.round(
    upperScore * 0.25 + lowerScore * 0.30 + decelScore * 0.25 + enduranceScore * 0.20
  )

  let tier: CompositeAthleticProfile['tier'] = 'Functional Performer'
  let recommendedOptPhase = 'Phase 2: Strength Endurance'

  if (overallScore >= 88) {
    tier = 'Elite Competitor'
    recommendedOptPhase = 'Phase 5: Power & Post-Activation Potentiation (PAP)'
  } else if (overallScore >= 78) {
    tier = 'Advanced Athlete'
    recommendedOptPhase = 'Phase 4: Maximal Strength / Phase 5 Intro'
  } else if (overallScore >= 65) {
    tier = 'Functional Performer'
    recommendedOptPhase = 'Phase 2: Strength Endurance / Phase 3 Hypertrophy'
  } else {
    tier = 'Developing Athlete'
    recommendedOptPhase = 'Phase 1: Stabilization Endurance & Correctives'
  }

  const insights: string[] = []
  if (lowerScore < 70) insights.push('Prioritize single-leg balance and multiplanar deceleration mechanics.')
  if (upperScore < 70) insights.push('Reinforce kinetic chain pushing stability and scapulothoracic alignment.')
  if (decelScore < 70) insights.push('Develop change-of-direction (COD) ankle stiffness and low-center-of-gravity plants.')
  if (enduranceScore >= 85 && upperScore >= 85) insights.push('Upper kinetic chain is primed for high-velocity explosive power.')

  return {
    overallAthleticismScore: overallScore,
    tier,
    upperAgilityScore: upperScore,
    lowerAgilityScore: lowerScore,
    decelerationSpeedScore: decelScore,
    muscularEnduranceScore: enduranceScore,
    recommendedOptPhase,
    actionableInsights: insights.length > 0 ? insights : ['All athletic movement dimensions operating at or above target benchmarks.'],
  }
}
