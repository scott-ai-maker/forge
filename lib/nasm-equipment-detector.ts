/**
 * Gordon Athletic Advisory — Biomechanical Equipment & Modality Detector
 * Accurately classifies required training equipment and environmental tools from exercise names and instructions.
 * Dissects modifiers like Dumbbell, Barbell, Stability/Yoga Ball, Cable, Bands, Kettlebell, Foam Roller, etc.
 */

export function detectExerciseEquipment(
  exerciseName: string,
  description?: string | null,
  _providedEquipment?: string[] | null
): string[] {
  const nameLower = exerciseName.toLowerCase()
  // Clean description to avoid anatomical false positives like "IT band" or "iliotibial band"
  const cleanDesc = (description || '')
    .toLowerCase()
    .replace(/it band/g, '')
    .replace(/iliotibial band/g, '')

  const text = `${nameLower} ${cleanDesc}`
  const detected = new Set<string>()

  // 1. Stability / Yoga / Swiss / Exercise Ball
  if (
    /\b(stability ball|swiss ball|exercise ball|yoga ball|ball crunch|ball cobra|ball combo|ball prone|core ball|ball stretch|ball bridge|theraband ball|theraband stability ball)\b/.test(text) ||
    nameLower.includes('on ball') ||
    nameLower.includes('on stability ball')
  ) {
    detected.add('Stability Ball')
  }

  // 1b. BOSU Balance Trainer / BOSU Ball
  if (/\b(bosu|balance trainer)\b/.test(text)) {
    detected.add('BOSU Balance Trainer')
  }

  // 2. Dumbbells
  if (
    /\b(dumbbell|dumbbells|db|dual dumbbell|kroc row)\b/.test(nameLower) ||
    /\b(dumbbell|dumbbells)\b/.test(text)
  ) {
    detected.add('Dumbbells')
  }

  // 3. Barbell
  if (
    /\b(barbell|trap bar|hex bar|olympic bar|ez bar|landmine)\b/.test(text) ||
    /\bbb\b/.test(nameLower)
  ) {
    detected.add('Barbell')
  }

  // 4. Squat Rack / Power Rack (Barbell Squats & Overhead Presses racked)
  if (
    /\b(back squat|front squat|barbell squat|rack squat|power rack|squat rack|smith machine)\b/.test(nameLower) ||
    (detected.has('Barbell') && /\bsquat\b/.test(nameLower))
  ) {
    detected.add('Squat Rack')
  }

  // 5. Kettlebell
  if (
    /\b(kettlebell|kettlebells|kb)\b/.test(nameLower) ||
    /\b(kettlebell|kettlebells)\b/.test(text)
  ) {
    detected.add('Kettlebell')
  }

  // 6. Resistance Band / Tubing (Strictly exclude anatomical IT Band)
  if (
    /\b(resistance band|resistance bands|banded|loop band|mini band|superband|tubing)\b/.test(text) ||
    /\bband (assisted|resisted|walk|row|pull|squat|press|curl|push|fly|stretch|dislocate|pull-apart|pulldown)\b/.test(text) ||
    /\bband\b/.test(nameLower)
  ) {
    detected.add('Resistance Band')
  }

  // 7. Cable Machine / Pulley
  if (
    /\b(cable|pulley|crossover|lat pulldown|pulldown|face pull|cable chop|cable lift)\b/.test(text)
  ) {
    detected.add('Cable Machine')
  }

  // 8. Adjustable Bench (Flat, Incline, Decline)
  if (
    (/\b(bench|incline|decline|preacher|chest supported|bulgarian split squat|hip thrust)\b/.test(text)) &&
    !detected.has('Stability Ball') &&
    !/\b(floor|mat|standing)\b/.test(nameLower)
  ) {
    detected.add('Adjustable Bench')
  }

  // 9. Medicine Ball
  if (
    /\b(medicine ball|slam ball|wall ball)\b/.test(text) ||
    /\bmb\b/.test(nameLower)
  ) {
    detected.add('Medicine Ball')
  }

  // 10. Box / Step / Platform
  if (
    /\b(box jump|box squat|depth jump|plyo box|hurdle)\b/.test(text) ||
    (/\b(step up|step-up)\b/.test(text) && !text.includes('reverse lunge'))
  ) {
    detected.add('Plyo Box / Step')
  }

  // 11. Foam Roller / SMR Tools
  if (
    /\b(foam roll|foam roller|smr|massage roller|massage ball|lacrosse ball)\b/.test(text) ||
    nameLower.startsWith('inhibit') ||
    nameLower.includes('smr')
  ) {
    detected.add('Foam Roller')
  }

  // 12. Pull-Up Bar / Suspension
  if (
    /\b(pull up|pull-up|chin up|chin-up|inverted row|trx|suspension)\b/.test(text)
  ) {
    detected.add('Pull-Up Bar')
  }

  // 13. Weight Machines (Leg Press, Leg Extension, Leg Curl, Smith Machine, etc.)
  const isBallOrBandExercise = detected.has('Stability Ball') || detected.has('Resistance Band')
  if (
    (/\b(leg press|leg extension|leg curl|hack squat|pec deck|chest press machine|seated row machine|smith machine|lat pulldown machine)\b/.test(text) ||
     (/\bmachine\b/.test(text) && !text.includes('cable'))) &&
    !isBallOrBandExercise
  ) {
    detected.add('Weight Machine')
  }

  // 14. Cardio Ergometers
  if (/\btreadmill\b/.test(text)) detected.add('Treadmill')
  if (/\b(rower|rowing ergometer|concept2)\b/.test(text)) detected.add('Rowing Ergometer')
  if (/\b(airbike|air bike|assault bike|echo bike|airdyne)\b/.test(text)) detected.add('Assault AirBike')
  if (/\b(stationary bike|spin bike|cycling|cycle)\b/.test(text)) detected.add('Stationary Bike')
  if (/\b(stair climber|stairmaster)\b/.test(text)) detected.add('Stair Climber')

  // 15. SAQ Cones / Agility Ladder
  if (/\b(ladder|ladder drill)\b/.test(text)) {
    detected.add('Agility Ladder')
  }
  if (/\b(t-drill|t drill|cone|slalom|pro agility|shuttle)\b/.test(text)) {
    detected.add('Agility Cones')
  }

  // If no external equipment detected, tag as Bodyweight
  if (detected.size === 0) {
    detected.add('Bodyweight')
  }

  return Array.from(detected)
}

export interface EquipmentCapabilities {
  hasBarbell: boolean
  hasSquatRack: boolean
  hasDumbbells: boolean
  hasCables: boolean
  hasMachines: boolean
  hasBands: boolean
  hasStabilityBall: boolean
  hasBench: boolean
  hasPullupBar: boolean
  hasMedicineBall: boolean
  hasKettlebell: boolean
  hasFoamRoller: boolean
  hasBox: boolean
  hasBosu: boolean
  isFullGym: boolean
  isHomeDumbbellOnly: boolean
  isBandsOnly: boolean
  isBodyweightOnly: boolean
  summaryLabel: string
}

export function normalizeEquipmentAlias(item?: string | null): string {
  const normalized = String(item ?? '').trim().toLowerCase()
  if (!normalized) return ''
  if (normalized === 'cable-machine') return 'cable machine'
  if (normalized === 'medicine-ball') return 'medicine ball'
  if (normalized === 'dumbbells') return 'dumbbell'
  if (normalized === 'kettlebells') return 'kettlebell'
  if (normalized === 'bands') return 'band'
  if (normalized === 'machines') return 'machine'
  if (normalized === 'trx') return 'suspension'
  if (normalized === 'bosu' || normalized === 'bosu-ball' || normalized === 'bosu ball' || normalized === 'bosu balance trainer') return 'bosu'
  if (normalized === 'stability ball' || normalized === 'stability-ball' || normalized === 'swiss ball' || normalized === 'exercise ball' || normalized === 'theraband stability ball' || normalized === 'theraband ball') return 'stability ball'
  return normalized
}

export function normalizeEquipmentAccess(items?: string[]): string[] {
  if (!Array.isArray(items)) return []
  return [...new Set(items.map(item => normalizeEquipmentAlias(item)).filter(Boolean))]
}

/**
 * Parses client equipment array into detailed capability flags.
 * Single source of truth across all workout generators and guardrails.
 */
export function parseEquipmentCapabilities(equipmentList?: string[]): EquipmentCapabilities {
  if (!equipmentList || equipmentList.length === 0) {
    return {
      hasBarbell: true,
      hasSquatRack: true,
      hasDumbbells: true,
      hasCables: true,
      hasMachines: true,
      hasBands: true,
      hasStabilityBall: true,
      hasBench: true,
      hasPullupBar: true,
      hasMedicineBall: true,
      hasKettlebell: true,
      hasFoamRoller: true,
      hasBox: true,
      hasBosu: true,
      isFullGym: true,
      isHomeDumbbellOnly: false,
      isBandsOnly: false,
      isBodyweightOnly: false,
      summaryLabel: 'Commercial Gym (Full Equipment)',
    }
  }

  const listStr = equipmentList.join(' ').toLowerCase()
  const isFullGym = listStr.includes('commercial') || listStr.includes('full_gym') || listStr.includes('full gym')

  const hasBarbell = isFullGym || listStr.includes('barbell') || listStr.includes('olympic') || listStr.includes('trap bar')
  const hasSquatRack = isFullGym || listStr.includes('squat rack') || listStr.includes('power rack') || listStr.includes('rack') || listStr.includes('smith')
  const hasDumbbells = isFullGym || listStr.includes('dumbbell') || listStr.includes('free weight') || listStr.includes('dumbbells')
  const hasCables = isFullGym || listStr.includes('cable') || listStr.includes('pulley') || listStr.includes('lat pulldown')
  const hasMachines = isFullGym || listStr.includes('machine') || listStr.includes('leg press')
  const hasBands = isFullGym || listStr.includes('band') || listStr.includes('tubing') || listStr.includes('loop')
  const hasStabilityBall = isFullGym || listStr.includes('stability ball') || listStr.includes('swiss ball') || listStr.includes('exercise ball') || listStr.includes('yoga ball')
  const hasBench = isFullGym || listStr.includes('bench')
  const hasPullupBar = isFullGym || listStr.includes('pull-up') || listStr.includes('pullup') || listStr.includes('chin-up')
  const hasMedicineBall = isFullGym || listStr.includes('medicine ball') || listStr.includes('slam ball')
  const hasKettlebell = isFullGym || listStr.includes('kettlebell') || listStr.includes('kb')
  const hasFoamRoller = isFullGym || listStr.includes('foam') || listStr.includes('roller') || listStr.includes('smr')
  const hasBox = isFullGym || listStr.includes('box') || listStr.includes('step') || listStr.includes('bench')
  const hasBosu = isFullGym || listStr.includes('bosu') || listStr.includes('balance trainer')

  const isBodyweightOnly = !hasBarbell && !hasDumbbells && !hasCables && !hasMachines && !hasBands && !hasKettlebell
  const isBandsOnly = !hasBarbell && !hasDumbbells && !hasCables && !hasMachines && !hasKettlebell && hasBands
  const isHomeDumbbellOnly = !hasBarbell && !hasCables && !hasMachines && (hasDumbbells || hasKettlebell)

  let summaryLabel = 'Commercial Gym (Full Equipment)'
  if (isBodyweightOnly) summaryLabel = 'Bodyweight & Calisthenics'
  else if (isBandsOnly) summaryLabel = 'Minimalist Home / Travel Bands'
  else if (isHomeDumbbellOnly) summaryLabel = 'Home Gym (Dumbbells & Bands)'
  else if (!hasBarbell && hasCables) summaryLabel = 'Apartment Gym (Cables & Dumbbells)'
  else if (hasBarbell && !hasCables) summaryLabel = 'Home Garage Gym (Barbell & Dumbbells)'

  return {
    hasBarbell,
    hasSquatRack,
    hasDumbbells,
    hasCables,
    hasMachines,
    hasBands,
    hasStabilityBall,
    hasBench,
    hasPullupBar,
    hasMedicineBall,
    hasKettlebell,
    hasFoamRoller,
    hasBox,
    hasBosu,
    isFullGym,
    isHomeDumbbellOnly,
    isBandsOnly,
    isBodyweightOnly,
    summaryLabel,
  }
}

/**
 * Validates whether an exercise matches the athlete's equipment capabilities.
 * Canonical implementation used across OPT selection, AI coaches, and generator studios.
 */
export function doesExerciseMatchEquipment(
  exercise: { name?: string | null; description?: string | null; primaryEquipment?: string[] | null; primary_equipment?: string[] | null },
  availableEquipment: string[] | EquipmentCapabilities
): boolean {
  const caps = Array.isArray(availableEquipment)
    ? parseEquipmentCapabilities(availableEquipment)
    : availableEquipment

  if (caps.isFullGym) return true

  const rawList = exercise.primaryEquipment ?? exercise.primary_equipment
  const required = (Array.isArray(rawList) && rawList.length > 0)
    ? rawList
    : detectExerciseEquipment(exercise.name || '', exercise.description || null)

  if (required.length === 0 || (required.length === 1 && (required[0].toLowerCase() === 'bodyweight' || required[0].toLowerCase() === 'none'))) {
    return true
  }

  for (const item of required) {
    const lower = String(item).toLowerCase().trim()
    if (lower === 'bodyweight' || lower === 'none') continue
    if (lower.includes('barbell') && !caps.hasBarbell) return false
    if (lower.includes('squat rack') && !caps.hasSquatRack) return false
    if (lower.includes('dumbbell') && !caps.hasDumbbells) return false
    if (lower.includes('kettlebell') && !caps.hasKettlebell && !caps.hasDumbbells) return false
    if (lower.includes('band') && !caps.hasBands) return false
    if ((lower.includes('stability ball') || lower.includes('swiss ball')) && !caps.hasStabilityBall) return false
    if ((lower.includes('bosu') || lower.includes('balance trainer')) && !caps.hasBosu) return false
    if (lower.includes('foam roller') && !caps.hasFoamRoller) return false
    if ((lower.includes('plyo box') || lower.includes('step') || lower.includes('box')) && !caps.hasBox) return false
    if ((lower.includes('machine') || lower.includes('press machine') || lower.includes('curl machine')) && !lower.includes('cable') && !caps.hasMachines) return false
    if ((lower.includes('cable') || lower.includes('pulley')) && !caps.hasCables && !caps.hasMachines) return false
    if (lower.includes('bench') && !caps.hasBench && !caps.hasDumbbells) return false
    if ((lower.includes('pull-up') || lower.includes('pullup') || lower.includes('chin-up') || lower.includes('suspension') || lower.includes('trx')) && !caps.hasPullupBar) return false
  }

  return true
}

export interface CardioEquipmentCapabilities {
  hasTreadmill: boolean
  hasStationaryBike: boolean
  hasAirBike: boolean
  hasRower: boolean
  hasElliptical: boolean
  hasStairmaster: boolean
  hasSkiErg: boolean
  hasJumpRope: boolean
  hasOutdoorRunning: boolean
  hasOutdoorCycling: boolean
  hasSwimming: boolean
  hasHiking: boolean
  isBodyweightCardioOnly: boolean
  availableCardioCount: number
}

/**
 * Parses client cardio equipment and general equipment arrays into cardio capability flags.
 */
export function parseCardioEquipmentCapabilities(
  cardioEquipmentList?: string[],
  generalEquipmentList?: string[]
): CardioEquipmentCapabilities {
  const combined = [
    ...(Array.isArray(cardioEquipmentList) ? cardioEquipmentList : []),
    ...(Array.isArray(generalEquipmentList) ? generalEquipmentList : []),
  ]
  const str = combined.join(' ').toLowerCase()
  const isFullGym = str.includes('commercial') || str.includes('full_gym') || str.includes('full gym')

  const hasExplicitList = combined.length > 0 && !combined.every(c => c === 'bodyweight' || c === 'bands')

  const hasTreadmill = isFullGym || str.includes('treadmill') || str.includes('woodway') || str.includes('running machine')
  const hasAirBike = isFullGym || str.includes('assault-bike') || str.includes('assault bike') || str.includes('airbike') || str.includes('air bike') || str.includes('airdyne') || str.includes('echo bike')
  const hasStationaryBike = isFullGym || hasAirBike || str.includes('stationary-bike') || str.includes('stationary bike') || str.includes('spin bike') || str.includes('peloton') || str.includes('bike') || str.includes('cycling')
  const hasRower = isFullGym || str.includes('rowing-machine') || str.includes('rowing machine') || str.includes('rower') || str.includes('concept2') || str.includes('water rower')
  const hasElliptical = isFullGym || str.includes('elliptical') || str.includes('cross-trainer') || str.includes('cross trainer') || str.includes('arc trainer')
  const hasStairmaster = isFullGym || str.includes('stairmaster') || str.includes('stair climber') || str.includes('stair-climber') || str.includes('stepmill') || str.includes('stairs')
  const hasSkiErg = isFullGym || str.includes('ski-erg') || str.includes('ski erg') || str.includes('skierg')
  const hasJumpRope = isFullGym || str.includes('jump-rope') || str.includes('jump rope') || str.includes('speed rope') || str.includes('skipping rope')
  const hasOutdoorRunning = isFullGym || str.includes('outdoor-running') || str.includes('outdoor running') || str.includes('outdoor run') || str.includes('running') || str.includes('track') || (!hasExplicitList && !str.includes('home'))
  const hasOutdoorCycling = isFullGym || str.includes('outdoor-cycling') || str.includes('outdoor cycling') || str.includes('road cycling') || str.includes('road bike')
  const hasSwimming = isFullGym || str.includes('swimming') || str.includes('pool') || str.includes('swim')
  const hasHiking = isFullGym || str.includes('hiking') || str.includes('trail') || str.includes('trails') || str.includes('ruck')

  const machineCount = (hasTreadmill ? 1 : 0) + (hasStationaryBike ? 1 : 0) + (hasRower ? 1 : 0) + (hasElliptical ? 1 : 0) + (hasStairmaster ? 1 : 0) + (hasSkiErg ? 1 : 0)
  const isBodyweightCardioOnly = machineCount === 0 && !hasOutdoorCycling && !hasSwimming
  const availableCardioCount = machineCount + (hasJumpRope ? 1 : 0) + (hasOutdoorRunning ? 1 : 0) + (hasOutdoorCycling ? 1 : 0) + (hasSwimming ? 1 : 0) + (hasHiking ? 1 : 0)

  return {
    hasTreadmill,
    hasStationaryBike,
    hasAirBike,
    hasRower,
    hasElliptical,
    hasStairmaster,
    hasSkiErg,
    hasJumpRope,
    hasOutdoorRunning,
    hasOutdoorCycling,
    hasSwimming,
    hasHiking,
    isBodyweightCardioOnly,
    availableCardioCount,
  }
}
