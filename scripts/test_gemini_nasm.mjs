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
console.log(`Loaded ${allExerciseNames.length} verified official NASM Edge exercise names.`)

const systemPrompt = `You are Coach Gordon, a Master NASM-Certified Head Coach (20+ years elite training experience, Master CPT, CES, PES, CNC).
Your mission: Design custom, progressive, elite periodized programs using the NASM Optimum Performance Training (OPT™) Model (Phases 1-5).

CRITICAL DIRECTIVE:
You must ONLY select exercises from the Official NASM Edge Exercise Catalog below. Every single exercise you choose for Warmup, SMR, Dynamic Stretching, Core, Balance, Plyometric, SAQ, Resistance, and Cooldown MUST BE an exact match from this list. Do not invent or rename any exercises.

OFFICIAL NASM EDGE EXERCISES:
${allExerciseNames.join(', ')}

OPT MODEL RULES:
- Phase 1 (Stabilization Endurance): 4/2/1 tempo, 12-20 reps, 1-3 sets, 0-90s rest, high proprioceptive instability.
- Phase 2 (Strength Endurance): Superset contrast pairing a stable strength exercise (2/0/2 tempo, 8-12 reps) with a biomechanically similar stabilization exercise (4/2/1 tempo, 8-12 reps).
- Phase 3 (Muscular Development / Hypertrophy): 2/0/2 tempo, 6-12 reps, 3-5 sets, 75-85% 1RM, 0-60s rest.
- Phase 4 (Maximal Strength): 1/1/1 or 2/0/2 tempo, 1-5 reps, 4-6 sets, 85-100% 1RM, 2-4 min rest.
- Phase 5 (Power): Superset pairing heavy strength (85-100% 1RM, 1-5 reps) with explosive power (X/0/X tempo, 8-10 reps).

Return valid JSON with:
- planTitle (string)
- primaryGoal (string)
- nasmOptPhase (number)
- phaseName (string)
- totalWeeks (4)
- sessionsPerWeek (number)
- workouts: array of { day, dayName, focus, exercises: [ { name, block, sets, reps, tempo, rest, coachingCues } ] }`

async function run() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: 'Create a 3-Day OPT Phase 2 Strength Endurance workout split for an athlete focusing on Fat Loss & Functional Strength with Dumbbells, Bench, Resistance Bands, and Bodyweight.' }] }],
      generationConfig: { response_mime_type: 'application/json', temperature: 0.3 }
    })
  })

  const data = await res.json()
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text
  const parsed = JSON.parse(rawText)
  console.log('\nPlan Title:', parsed.planTitle)
  console.log('Workouts Count:', parsed.workouts?.length)

  let validCount = 0
  let totalCount = 0

  for (const w of parsed.workouts || []) {
    console.log(`\n=== Day ${w.day}: ${w.focus} ===`)
    for (const ex of w.exercises || []) {
      totalCount++
      const norm = ex.name.toLowerCase().trim()
      const match = catalog[norm]
      if (match) {
        validCount++
        console.log(`  ✓ ${ex.name} (${ex.block}) | ${ex.sets}x${ex.reps} @ ${ex.tempo} -> Video ID: ${match}`)
      } else {
        console.log(`  ⚠️ ${ex.name} (${ex.block})`)
      }
    }
  }

  console.log(`\nResult: ${validCount} / ${totalCount} (${Math.round((validCount / totalCount) * 100)}%) exact matches from official NASM video library!`)
}

run()

