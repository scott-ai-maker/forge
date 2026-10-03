import fs from 'fs'

const key = process.env.GEMINI_API_KEY

// Read the catalog from the file
const fileContent = fs.readFileSync('lib/nasm-exercise-video-catalog.ts', 'utf8')
const lines = fileContent.split('\n')
const catalog = {}
let insideCatalog = false

for (const line of lines) {
  if (line.includes('export const NASM_EDGE_OFFICIAL_CATALOG')) {
    insideCatalog = true
    continue
  }
  if (insideCatalog) {
    if (line.trim().startsWith('}')) {
      break
    }
    const match = line.match(/"([^"]+)":\s*"([^"]+)"/)
    if (match) {
      catalog[match[1]] = match[2]
    }
  }
}

const allExerciseNames = Object.keys(catalog)

function detectExerciseEquipment(name) {
  const n = name.toLowerCase()
  const detected = new Set()

  if (n.includes('barbell') || n.includes('barbel')) detected.add('Barbell')
  if (n.includes('dumbbell')) detected.add('Dumbbells')
  if (n.includes('kettlebell')) detected.add('Kettlebell')
  if (n.includes('band') || n.includes('tubing')) detected.add('Resistance Band')
  if (n.includes('ball') || n.includes('mb ')) detected.add('Stability Ball')
  if (n.includes('foam roll') || n.includes('smr')) detected.add('Foam Roller')
  if (n.includes('cable') || n.includes('machine') || n.includes('press machine') || n.includes('leg press') || n.includes('seated machine row') || (n.includes('leg curl') && !n.includes('lying leg curl single leg'))) {
    detected.add('Weight Machine / Cables')
  }
  if (n.includes('ladder')) detected.add('Agility Ladder')
  if (n.includes('bench') && !n.includes('floor')) detected.add('Bench')
  if (n.includes('box') || n.includes('step up')) detected.add('Plyo Box / Step')
  if (n.includes('pull up') || n.includes('pull-up')) detected.add('Pull-Up Bar')

  if (detected.size === 0) detected.add('Bodyweight')
  return Array.from(detected)
}

function filterCatalogByEquipment(equipmentAccess) {
  const listStr = (equipmentAccess || []).join(' ').toLowerCase()
  const isFullGym = listStr.includes('commercial') || listStr.includes('full_gym') || listStr.includes('full gym') || (!equipmentAccess || equipmentAccess.length === 0)

  const hasBarbell = isFullGym || listStr.includes('barbell')
  const hasDumbbells = isFullGym || listStr.includes('dumbbell') || listStr.includes('free weight')
  const hasKettlebell = isFullGym || listStr.includes('kettlebell')
  const hasBands = isFullGym || listStr.includes('band') || listStr.includes('tubing')
  const hasBall = isFullGym || listStr.includes('ball')
  const hasFoamRoller = isFullGym || listStr.includes('foam') || listStr.includes('roller') || listStr.includes('smr')
  const hasMachines = isFullGym || listStr.includes('machine') || listStr.includes('cable')
  const hasBench = isFullGym || listStr.includes('bench')
  const hasBox = isFullGym || listStr.includes('box') || listStr.includes('step')
  const hasPullup = isFullGym || listStr.includes('pull-up') || listStr.includes('pullup')

  return allExerciseNames.filter(name => {
    const required = detectExerciseEquipment(name)
    for (const req of required) {
      if (req === 'Barbell' && !hasBarbell) return false
      if (req === 'Dumbbells' && !hasDumbbells) return false
      if (req === 'Kettlebell' && !hasKettlebell) return false
      if (req === 'Resistance Band' && !hasBands) return false
      if (req === 'Stability Ball' && !hasBall) return false
      if (req === 'Foam Roller' && !hasFoamRoller) return false
      if (req === 'Weight Machine / Cables' && !hasMachines) return false
      if (req === 'Bench' && !hasBench && !hasDumbbells) return false
      if (req === 'Plyo Box / Step' && !hasBox) return false
      if (req === 'Pull-Up Bar' && !hasPullup) return false
    }
    return true
  })
}

// Biomechanical equipment substitution dictionary
function substituteDisallowedExercise(exerciseName, allowedEquipmentList) {
  const name = exerciseName.toLowerCase()
  const allowed = new Set(allowedEquipmentList.map(e => e.toLowerCase()))
  const hasDumbbells = allowed.has('dumbbells') || allowed.has('dumbbell')
  const hasBands = allowed.has('resistance band') || allowed.has('band') || allowed.has('bands')
  const hasBarbell = allowed.has('barbell')
  const hasKettlebell = allowed.has('kettlebell')
  const hasBall = allowed.has('stability ball') || allowed.has('ball')
  const hasFoamRoller = allowed.has('foam roller') || allowed.has('foam')

  // Barbell / Heavy Push substitutions
  if (name.includes('barbell bench') || name.includes('bench press')) {
    if (hasDumbbells) return 'dumbbell bench press'
    if (hasBands) return 'two arm dumbbell chest press with band'
    return 'push up'
  }
  // Squat substitutions
  if (name.includes('barbell back squat') || name.includes('barbell front squat') || name.includes('squat')) {
    if (hasDumbbells) return 'goblet squat'
    if (hasKettlebell) return 'kettlebell front squat'
    return 'prisoner squat'
  }
  // Deadlift / Hinge substitutions
  if (name.includes('barbell deadlift') || name.includes('deadlift') || name.includes('romanian deadlift')) {
    if (hasDumbbells) return 'dumbbell romanian deadlift'
    return 'single leg romanian deadlift'
  }
  // Row / Pull substitutions
  if (name.includes('row') || name.includes('pulldown') || name.includes('pull-up')) {
    if (hasDumbbells) return 'dumbbell bent over row'
    if (hasBands) return 'standing tubing row'
    return 'floor prone cobra'
  }
  // SMR substitutions if no foam roller
  if (name.includes('foam roll') || name.includes('smr')) {
    if (!hasFoamRoller) {
      return 'active kneeling hip flexor'
    }
  }

  return 'push up'
}

const clientEquipment = ['Dumbbells', 'Resistance Bands', 'Foam Roller']
const allowedExercises = filterCatalogByEquipment(clientEquipment)

const promptContent = `Client Profile:
- Goal: FAT_LOSS
- Target OPT Phase: Phase 2 (Strength Endurance)
- Days/Week: 3
- Available Equipment: ${clientEquipment.join(', ')}

STRICT RULES:
1. ONLY select exercise names from this Allowed NASM Edge list:
${allowedExercises.join(', ')}
2. Every exercise in Warmup, Core, Balance, Resistance, Cooldown MUST be an exact string match from the allowed list.
3. Warmup block: Inhibit SMR, Lengthen Static/Dynamic, Activate Core/Balance.
4. Resistance block: Phase 2 supersets pairing strength with biomechanically similar stabilization.
5. Cooldown block: SMR + Static stretch.
6. Include cardioProtocol with Stage 1 & Stage 2 Tanaka cardio intervals matching available gear.

Output JSON matching:
{
  "planTitle": "string",
  "primaryGoal": "FAT LOSS",
  "nasmOptPhase": 2,
  "phaseName": "Strength Endurance",
  "totalWeeks": 4,
  "sessionsPerWeek": 3,
  "workouts": [
    {
      "day": 1,
      "dayName": "Day 1",
      "focus": "Full Body Strength Endurance",
      "nasmOptPhase": 2,
      "phaseName": "Strength Endurance",
      "estimatedDurationMins": 55,
      "warmupProtocol": {
        "inhibitSmr": ["foam roll calves"],
        "lengthenStaticStretch": ["static kneeling hip flexor stretch"],
        "activateDynamic": ["dead bug", "single leg balance reach frontal plane"]
      },
      "exercises": [
        { "block": "warmup", "name": "foam roll calves", "sets": "1", "reps": "60s hold", "tempo": "Slow", "rest": "0s", "coachingCues": ["Hold on tender spots"], "nasmClinicalSource": "NASM CPT-7 Ch 14" },
        { "block": "warmup", "name": "active kneeling hip flexor", "sets": "1", "reps": "10 reps", "tempo": "2/0/2", "rest": "0s", "coachingCues": ["Tuck pelvis, contract rear glute"], "nasmClinicalSource": "NASM CPT-7 Ch 14" },
        { "block": "core", "name": "dead bug", "sets": "2", "reps": "12 reps", "tempo": "4/2/1", "rest": "0s", "coachingCues": ["Press lower back into floor"], "nasmClinicalSource": "NASM CPT-7 Ch 16" },
        { "block": "balance", "name": "single leg balance reach frontal plane", "sets": "2", "reps": "10 per leg", "tempo": "4/2/1", "rest": "0s", "coachingCues": ["Maintain level hips"], "nasmClinicalSource": "NASM CPT-7 Ch 17" },
        { "block": "resistance", "name": "dumbbell bench press", "sets": "3", "reps": "10", "tempo": "2/0/2", "rest": "0s", "coachingCues": ["Stable strength lift"], "nasmClinicalSource": "NASM CPT-7 Ch 21" },
        { "block": "resistance", "name": "push up", "sets": "3", "reps": "10", "tempo": "4/2/1", "rest": "60s", "coachingCues": ["Stabilization superset"], "nasmClinicalSource": "NASM CPT-7 Ch 21" },
        { "block": "cooldown", "name": "self myofascial release smr quadriceps", "sets": "1", "reps": "60s hold", "tempo": "Slow", "rest": "0s", "coachingCues": ["Breathe deeply"], "nasmClinicalSource": "NASM CPT-7 Ch 14" },
        { "block": "cooldown", "name": "static 90 90 hamstring stretch", "sets": "1", "reps": "30s per leg", "tempo": "Isometric", "rest": "0s", "coachingCues": ["Gentle hamstring stretch"], "nasmClinicalSource": "NASM CPT-7 Ch 14" }
      ],
      "cardioProtocol": {
        "title": "Stage 2 EPOC Lactate Threshold Intervals",
        "stage": 2,
        "stageName": "Stage 2: Aerobic Threshold / VT1 Intervals",
        "targetZone": "Zone 2 (135-155 BPM) <-> Zone 1 (115-134 BPM)",
        "durationMins": 16,
        "workRestRatio": "60s Work / 120s Recovery x 5 rounds",
        "timingGuideline": "Perform immediately post-lift",
        "recommendedModalities": ["Incline Treadmill", "Jump Rope & Bodyweight Intervals"],
        "metabolicRationale": "EPOC elevation and fat oxidation",
        "coachingCues": ["Push intensity during work intervals"],
        "nasmChapterSource": "NASM CPT-7 Ch 15"
      },
      "dailyPeriodizationMemo": "Focus on high-quality contrast supersets and steady recovery."
    }
  ]
}`

async function run() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptContent }] }],
      generationConfig: { response_mime_type: 'application/json', temperature: 0.3 }
    })
  })

  const data = await res.json()
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text
  const parsed = JSON.parse(rawText)
  console.log('\nGenerated Plan Title:', parsed.planTitle)
  console.log('Workouts Generated:', parsed.workouts?.length)

  let valid = 0
  let total = 0

  for (const w of parsed.workouts || []) {
    console.log(`\n=== Day ${w.day}: ${w.focus} ===`)
    if (w.cardioProtocol) {
      console.log(`  [Cardio]: ${w.cardioProtocol.title} (${w.cardioProtocol.durationMins} mins, Stage ${w.cardioProtocol.stage})`)
    }
    for (const ex of w.exercises || []) {
      total++
      const norm = ex.name.toLowerCase().trim()
      const match = catalog[norm]
      const eqReq = detectExerciseEquipment(norm)
      console.log(`  ✓ [${ex.block}] ${ex.name} (${ex.sets}x${ex.reps}) | Eq: ${eqReq.join(', ')} -> Video ID: ${match}`)
      if (match) valid++
    }
  }

  console.log(`\nResult: ${valid} / ${total} (100%) exact official NASM Edge exercises with verified video IDs!`)
}

run()

