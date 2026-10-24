import fs from 'fs'
import path from 'path'
import { NASM_COMPLETE_LIBRARY, normalizeExerciseQuery, searchNasmLibraryMedia, EXERCISE_ALIASES } from '../lib/nasm-fuzzy-matcher'
import { NASM_MOVEMENT_PROFILES, getNasmClinicalMovementCard } from '../lib/nasm-clinical-movement-cards'

interface AuditFinding {
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  type: string
  exerciseId?: string
  exerciseName: string
  details: string
  recommendation: string
}

const findings: AuditFinding[] = []

console.log('=== FORGE ATHLETIC COMPREHENSIVE EXERCISE AUDIT ===')
console.log(`Auditing ${NASM_COMPLETE_LIBRARY.length} library exercises...\n`)

// 1. AUDIT OF NASM_COMPLETE_LIBRARY
for (const ex of NASM_COMPLETE_LIBRARY) {
  const nameLower = ex.name.toLowerCase()
  const descLower = (ex.description || '').toLowerCase()
  const eq = (ex.primaryEquipment || []).map(e => e.toLowerCase())
  const mg = (ex.muscleGroups || []).map(m => m.toLowerCase())

  // A. Unilateral vs Bilateral (Single-Arm)
  if (nameLower.includes('single arm') || nameLower.includes('single-arm') || nameLower.includes('one arm') || nameLower.includes('one-arm')) {
    // Check if description uses plural dumbbells, both hands, each hand, both arms
    if (descLower.includes('dumbbells') || descLower.includes('both hands') || descLower.includes('both arms') || descLower.includes('each hand') || descLower.includes('in each arm')) {
      findings.push({
        severity: 'HIGH',
        type: 'UNILATERAL_PLURAL_MISMATCH',
        exerciseId: ex.id,
        exerciseName: ex.name,
        details: `Single-arm exercise description mentions plural dumbbells or both hands/arms.`,
        recommendation: 'Update description to strictly refer to singular arm/dumbbell.',
      })
    }
  }

  // B. Unilateral vs Bilateral (Single-Leg)
  if (nameLower.includes('single leg') || nameLower.includes('single-leg') || nameLower.includes('one leg') || nameLower.includes('one-leg')) {
    if (descLower.includes('both feet flat') || descLower.includes('both legs straight') || (descLower.includes('feet shoulder-width') && !descLower.includes('balance') && !descLower.includes('lift'))) {
      findings.push({
        severity: 'MEDIUM',
        type: 'UNILATERAL_LEG_MISMATCH',
        exerciseId: ex.id,
        exerciseName: ex.name,
        details: `Single-leg exercise description may cue bilateral foot positioning without clarifying single-leg stance.`,
        recommendation: 'Ensure setup explicitly cues single-leg stance or lifting non-working leg.',
      })
    }
  }

  // C. Equipment Mismatch
  if (nameLower.includes('barbell') && !eq.some(e => e.includes('barbell') || e.includes('olympic bar')) && eq.length > 0) {
    findings.push({
      severity: 'HIGH',
      type: 'EQUIPMENT_MISMATCH',
      exerciseId: ex.id,
      exerciseName: ex.name,
      details: `Name contains "Barbell" but primaryEquipment does not include Barbell: [${eq.join(', ')}]`,
      recommendation: 'Add Barbell to primaryEquipment.',
    })
  }

  if (nameLower.includes('dumbbell') && !eq.some(e => e.includes('dumbbell')) && eq.length > 0) {
    findings.push({
      severity: 'HIGH',
      type: 'EQUIPMENT_MISMATCH',
      exerciseId: ex.id,
      exerciseName: ex.name,
      details: `Name contains "Dumbbell" but primaryEquipment does not include Dumbbell: [${eq.join(', ')}]`,
      recommendation: 'Add Dumbbell to primaryEquipment.',
    })
  }

  if (nameLower.includes('cable') && !eq.some(e => e.includes('cable') || e.includes('pulley')) && eq.length > 0) {
    findings.push({
      severity: 'HIGH',
      type: 'EQUIPMENT_MISMATCH',
      exerciseId: ex.id,
      exerciseName: ex.name,
      details: `Name contains "Cable" but primaryEquipment does not include Cable: [${eq.join(', ')}]`,
      recommendation: 'Add Cable to primaryEquipment.',
    })
  }

  if (nameLower.includes('tubing') || nameLower.includes('band')) {
    if (!eq.some(e => e.includes('tubing') || e.includes('band')) && eq.length > 0) {
      findings.push({
        severity: 'HIGH',
        type: 'EQUIPMENT_MISMATCH',
        exerciseId: ex.id,
        exerciseName: ex.name,
        details: `Name contains "Tubing" or "Band" but primaryEquipment does not include Band/Tubing: [${eq.join(', ')}]`,
        recommendation: 'Add Resistance Band / Tubing to primaryEquipment.',
      })
    }
  }

  // D. Body Position Mismatch
  if (nameLower.includes('prone') && !descLower.includes('prone') && !descLower.includes('stomach') && !descLower.includes('face down')) {
    findings.push({
      severity: 'HIGH',
      type: 'BODY_POSITION_MISMATCH',
      exerciseId: ex.id,
      exerciseName: ex.name,
      details: `Name specifies "Prone" but description does not cue prone / stomach / face down positioning.`,
      recommendation: 'Correct body positioning in description.',
    })
  }

  if (nameLower.includes('supine') && !descLower.includes('supine') && !descLower.includes('back') && !descLower.includes('face up')) {
    findings.push({
      severity: 'HIGH',
      type: 'BODY_POSITION_MISMATCH',
      exerciseId: ex.id,
      exerciseName: ex.name,
      details: `Name specifies "Supine" but description does not cue supine / back positioning.`,
      recommendation: 'Correct body positioning in description.',
    })
  }

  if (nameLower.includes('seated') && !descLower.includes('seat') && !descLower.includes('sit') && !descLower.includes('bench')) {
    findings.push({
      severity: 'HIGH',
      type: 'BODY_POSITION_MISMATCH',
      exerciseId: ex.id,
      exerciseName: ex.name,
      details: `Name specifies "Seated" but description does not cue sitting or bench seating.`,
      recommendation: 'Ensure starting stance cues seated positioning.',
    })
  }

  if (nameLower.includes('incline') && !descLower.includes('incline') && !descLower.includes('elevated') && !descLower.includes('lean forward')) {
    findings.push({
      severity: 'HIGH',
      type: 'BENCH_ANGLE_MISMATCH',
      exerciseId: ex.id,
      exerciseName: ex.name,
      details: `Name specifies "Incline" but description does not mention an incline bench, angle, or elevated surface.`,
      recommendation: 'Update setup to specify 45-degree incline bench angle.',
    })
  }

  if (nameLower.includes('decline') && !descLower.includes('decline') && !descLower.includes('elevated')) {
    findings.push({
      severity: 'HIGH',
      type: 'BENCH_ANGLE_MISMATCH',
      exerciseId: ex.id,
      exerciseName: ex.name,
      details: `Name specifies "Decline" but description does not mention decline bench or elevated surface.`,
      recommendation: 'Update setup to specify decline bench.',
    })
  }

  // E. Movement Pattern Mismatch
  if (nameLower.includes('squat') && !descLower.includes('squat') && !descLower.includes('hip') && !descLower.includes('knee') && !descLower.includes('lower body')) {
    findings.push({
      severity: 'HIGH',
      type: 'PATTERN_MISMATCH',
      exerciseId: ex.id,
      exerciseName: ex.name,
      details: `Name specifies "Squat" but description does not describe squatting kinematics.`,
      recommendation: 'Review description kinematics.',
    })
  }

  if (nameLower.includes('deadlift') && !descLower.includes('deadlift') && !descLower.includes('hinge') && !descLower.includes('hip') && !descLower.includes('lift')) {
    findings.push({
      severity: 'HIGH',
      type: 'PATTERN_MISMATCH',
      exerciseId: ex.id,
      exerciseName: ex.name,
      details: `Name specifies "Deadlift" but description does not describe deadlift/hinge kinematics.`,
      recommendation: 'Review description kinematics.',
    })
  }

  if (nameLower.includes('biceps curl') && (descLower.includes('triceps') || descLower.includes('overhead press'))) {
    findings.push({
      severity: 'HIGH',
      type: 'PATTERN_MISMATCH',
      exerciseId: ex.id,
      exerciseName: ex.name,
      details: `Biceps curl description mentions triceps extension or overhead press.`,
      recommendation: 'Ensure flexion at elbow joint targeting biceps brachii.',
    })
  }

  // F. Contradictory Limb Cues
  if (descLower.includes('left leg') && descLower.includes('right leg')) {
    const leftMatches = (descLower.match(/left leg/g) || []).length
    const rightMatches = (descLower.match(/right leg/g) || []).length
    if (Math.abs(leftMatches - rightMatches) > 3) {
      findings.push({
        severity: 'LOW',
        type: 'LIMB_ASYMMETRY_CHECK',
        exerciseId: ex.id,
        exerciseName: ex.name,
        details: `Limb cues mention left leg ${leftMatches} times and right leg ${rightMatches} times.`,
        recommendation: 'Verify bilateral switching cue is symmetrical.',
      })
    }
  }

  // G. Dangerous or Biomechanically Unsound Cues
  if (descLower.includes('arch your back') && !descLower.includes('do not arch') && !descLower.includes('avoid arching')) {
    findings.push({
      severity: 'HIGH',
      type: 'CONTRAINDICATED_CUE',
      exerciseId: ex.id,
      exerciseName: ex.name,
      details: `Description may cue excessive lumbar arching without caveat.`,
      recommendation: 'Change to "maintain neutral lumbar spine".',
    })
  }

  if (descLower.includes('lock your knees') && !descLower.includes('do not lock') && !descLower.includes('avoid locking')) {
    findings.push({
      severity: 'HIGH',
      type: 'CONTRAINDICATED_CUE',
      exerciseId: ex.id,
      exerciseName: ex.name,
      details: `Description may cue locking knees.`,
      recommendation: 'Change to "extend knees fully without hyperextending".',
    })
  }

  // H. Media Verification
  if (!ex.videoUrl && !ex.imageUrl) {
    findings.push({
      severity: 'MEDIUM',
      type: 'MISSING_MEDIA',
      exerciseId: ex.id,
      exerciseName: ex.name,
      details: `No video URL and no image URL available.`,
      recommendation: 'Assign certified visual asset.',
    })
  }
}

console.log(`Library Audit Completed: Found ${findings.length} findings across 351 exercises.\n`)

// 2. AUDIT OF PROGRAM-PRESCRIBED EXERCISES ACROSS GENERATORS
const prescribedExerciseSources: { source: string; exercises: string[] }[] = []

// Extract from travel adapter
const travelAdapterPath = path.resolve(__dirname, '../lib/travel-workout-adapter.ts')
if (fs.existsSync(travelAdapterPath)) {
  const content = fs.readFileSync(travelAdapterPath, 'utf-8')
  const matches = content.match(/exerciseName:\s*'([^']+)'/g) || []
  const exercises = matches.map(m => m.replace(/exerciseName:\s*'/, '').replace(/'$/, ''))
  prescribedExerciseSources.push({ source: 'travel-workout-adapter.ts', exercises })
}

// Extract from fitness.ts
const fitnessPath = path.resolve(__dirname, '../lib/fitness.ts')
if (fs.existsSync(fitnessPath)) {
  const content = fs.readFileSync(fitnessPath, 'utf-8')
  const matches = content.match(/exercise:\s*'([^']+)'/g) || []
  const exercises = matches.map(m => m.replace(/exercise:\s*'/, '').replace(/'$/, ''))
  prescribedExerciseSources.push({ source: 'fitness.ts', exercises })
}

// Extract from coach-programs.ts
const coachProgramsPath = path.resolve(__dirname, '../lib/coach-programs.ts')
if (fs.existsSync(coachProgramsPath)) {
  const content = fs.readFileSync(coachProgramsPath, 'utf-8')
  const matches = content.match(/exercise:\s*'([^']+)'/g) || []
  const exercises = matches.map(m => m.replace(/exercise:\s*'/, '').replace(/'$/, ''))
  prescribedExerciseSources.push({ source: 'coach-programs.ts', exercises })
}

// Extract from rag-nasm-program-generator.ts
const ragPath = path.resolve(__dirname, '../lib/rag-nasm-program-generator.ts')
if (fs.existsSync(ragPath)) {
  const content = fs.readFileSync(ragPath, 'utf-8')
  const matches = content.match(/name:\s*'([^']+)'/g) || []
  const exercises = matches.map(m => m.replace(/name:\s*'/, '').replace(/'$/, ''))
  prescribedExerciseSources.push({ source: 'rag-nasm-program-generator.ts', exercises })
}

const allPrescribed = new Set<string>()
for (const src of prescribedExerciseSources) {
  for (const ex of src.exercises) {
    if (ex && ex.length > 2 && !ex.includes('${') && !ex.includes('return') && !ex.includes('phase')) {
      allPrescribed.add(ex)
    }
  }
}

console.log(`Auditing ${allPrescribed.size} prescribed exercises across all program generators...\n`)

interface PrescribedAudit {
  name: string
  matchedInLibrary: boolean
  matchedName?: string
  cardCategory: string
  cardPrimeMover: string
  cardHasCheckpoints: boolean
  flag?: string
}

const prescribedAudits: PrescribedAudit[] = []

for (const name of Array.from(allPrescribed).sort()) {
  const libraryMatch = searchNasmLibraryMedia(name)
  const card = getNasmClinicalMovementCard(name)

  const audit: PrescribedAudit = {
    name,
    matchedInLibrary: !!libraryMatch,
    matchedName: libraryMatch?.record.name,
    cardCategory: card.category,
    cardPrimeMover: card.primeMover,
    cardHasCheckpoints: !!card.kineticCheckpoints?.feetAnkles && !!card.kineticCheckpoints?.lphc,
  }

  // Check category plausibility
  const lowerName = name.toLowerCase()
  const isRenegade = lowerName.includes('renegade')
  const isSquatPress = lowerName.includes('squat to') && (lowerName.includes('press') || lowerName.includes('reach'))

  if (!isRenegade && !isSquatPress && (lowerName.includes('squat') || lowerName.includes('lunge') || lowerName.includes('leg press') || lowerName.includes('calf')) && card.category !== 'Legs' && card.category !== 'Plyometrics') {
    audit.flag = `MISCLASSIFIED_LEG: Category is ${card.category}`
  } else if (!isRenegade && (lowerName.includes('bench press') || lowerName.includes('chest press') || lowerName.includes('push up') || lowerName.includes('push-up')) && card.category !== 'Chest') {
    audit.flag = `MISCLASSIFIED_CHEST: Category is ${card.category}`
  } else if (!isRenegade && (lowerName.includes('row') || lowerName.includes('pulldown') || lowerName.includes('pull-up') || lowerName.includes('pull up')) && card.category !== 'Back') {
    audit.flag = `MISCLASSIFIED_BACK: Category is ${card.category}`
  } else if (!isSquatPress && (lowerName.includes('shoulder press') || lowerName.includes('overhead press') || lowerName.includes('lateral raise') || lowerName.includes('military press')) && card.category !== 'Shoulders') {
    audit.flag = `MISCLASSIFIED_SHOULDERS: Category is ${card.category}`
  } else if ((lowerName.includes('stretch') || lowerName.includes('roll') || lowerName.includes('foam')) && card.category !== 'Flexibility/SMR' && !lowerName.includes('stretch pause')) {
    audit.flag = `MISCLASSIFIED_FLEX: Category is ${card.category}`
  } else if ((lowerName.includes('bicep curl') || lowerName.includes('tricep')) && card.category !== 'Arms') {
    audit.flag = `MISCLASSIFIED_ARMS: Category is ${card.category}`
  }

  prescribedAudits.push(audit)
}

// Print Findings
console.log('=== FINDINGS IN COMPLETE NASM LIBRARY ===')
if (findings.length === 0) {
  console.log('No discrepancies found in NASM complete library.')
} else {
  for (const f of findings) {
    console.log(`[${f.severity}] ${f.type} - "${f.exerciseName}" (${f.exerciseId || 'N/A'})`)
    console.log(`  Details: ${f.details}`)
    console.log(`  Recommendation: ${f.recommendation}\n`)
  }
}

console.log('=== FINDINGS IN PRESCRIBED EXERCISES ===')
const flaggedPrescribed = prescribedAudits.filter(p => p.flag || !p.matchedInLibrary)
console.log(`Total Prescribed: ${prescribedAudits.length}`)
console.log(`Matched directly or via alias in official library: ${prescribedAudits.filter(p => p.matchedInLibrary).length}`)
console.log(`Unmatched in library: ${prescribedAudits.filter(p => !p.matchedInLibrary).length}`)
console.log(`Biomechanical classification flags: ${prescribedAudits.filter(p => !!p.flag).length}\n`)

for (const p of prescribedAudits) {
  if (p.flag || !p.matchedInLibrary) {
    console.log(`Exercise: "${p.name}"`)
    console.log(`  Matched in Library: ${p.matchedInLibrary ? `YES -> "${p.matchedName}"` : 'NO'}`)
    console.log(`  Card Category: ${p.cardCategory}`)
    console.log(`  Prime Mover: ${p.cardPrimeMover}`)
    if (p.flag) console.log(`  ⚠️ FLAG: ${p.flag}`)
    console.log('')
  }
}
