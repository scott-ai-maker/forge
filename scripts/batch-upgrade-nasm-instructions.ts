import fs from 'fs'
import path from 'path'
import { getNasmClinicalMovementCard } from '../lib/nasm-clinical-movement-cards'

interface NasmLibraryRecord {
  id: string
  name: string
  slug: string
  description: string | null
  coachingCues: string[] | null
  primaryEquipment: string[] | null
  muscleGroups: string[] | null
  imageUrl: string | null
  videoId: string | null
  videoUrl: string | null
}

const libraryPath = path.resolve(process.cwd(), 'scripts/nasm-complete-library.json')
const officialDescsPath = path.resolve(process.cwd(), 'scripts/nasm-official-video-descriptions.json')
const fuzzyMatcherPath = path.resolve(process.cwd(), 'lib/nasm-fuzzy-matcher.ts')

const library: NasmLibraryRecord[] = JSON.parse(fs.readFileSync(libraryPath, 'utf8'))
const officialDescs: Record<string, { name: string; videoId: string; rawDescription: string }> = fs.existsSync(officialDescsPath)
  ? JSON.parse(fs.readFileSync(officialDescsPath, 'utf8'))
  : {}

console.log(`Starting clinical instruction upgrade across ${library.length} exercises...`)

// Helper to clean descriptions and split into 4 steps
function formatFourSteps(step1: string, step2: string, step3: string, step4: string): string {
  const cleanStep = (label: string, text: string) => {
    let t = text.replace(/^Step\s*\d+\s*:\s*/i, '').replace(/^(Setup|Brace\/Position|Execute|Return\/Repeat)\s*:\s*/i, '').trim()
    return `${label} ${t}`
  }
  return [
    cleanStep('Step 1: Setup', step1),
    cleanStep('Step 2: Brace/Position', step2),
    cleanStep('Step 3: Execute', step3),
    cleanStep('Step 4: Return/Repeat', step4),
  ].join('\n\n')
}

let upgradedCount = 0

for (const ex of library) {
  const norm = ex.name.toLowerCase().trim()
  const rawYt = officialDescs[norm]?.rawDescription || ''
  const currentDesc = ex.description || ''

  // 1. Specific High-Priority Movement Corrections
  if (norm === '4 point quadruped t drill') {
    ex.description = formatFourSteps(
      'Assume an all-four quadruped position on your hands and the balls of your feet with hands directly beneath shoulders, knees under hips, and two cones set up laterally.',
      'Engage your core with the drawing-in maneuver, level your pelvis, and maintain a neutral spine with knees hovering slightly off the ground.',
      'Crawl forward under control to the midpoint between the two cones, then crawl laterally to touch each cone.',
      'Return to the midpoint and crawl backward in the quadruped position to the start, maintaining a flat back throughout.'
    )
    upgradedCount++
    continue
  }

  if (norm === 'close grip bench press') {
    ex.description = formatFourSteps(
      'Lie flat on the bench with feet flat on the floor, grasping the barbell with a shoulder-width or slightly narrower-than-shoulder-width grip.',
      'Unrack the barbell directly over your shoulders with straight arms, retract and depress your shoulder blades, and brace your core.',
      'Inhale and lower the barbell under control to your lower sternum, keeping your elbows tucked tightly against your ribs at a 30-degree to 45-degree angle.',
      'Exhale and press the bar forcefully upward by extending your elbows, contracting your triceps at the top without flaring your shoulders, then repeat.'
    )
    upgradedCount++
    continue
  }

  if (norm === 'single leg scaption') {
    ex.description = formatFourSteps(
      'Stand on one leg with a slight bend in the knee, lifting the non-stance foot off the floor, holding light dumbbells at your sides with thumbs pointing upward.',
      'Engage your core, level your pelvis by contracting the gluteus medius of your stance leg, and maintain an upright posture with shoulders packed.',
      'Raise your arms diagonally forward in the scapular plane at a 30-to-45-degree angle until they reach shoulder height, keeping thumbs up.',
      'Lower the dumbbells slowly back to your sides in a 4-second controlled eccentric motion, maintaining single-leg balance throughout before switching legs.'
    )
    upgradedCount++
    continue
  }

  if (norm === 'single leg romanian deadlift curl to overhead press') {
    ex.description = formatFourSteps(
      'Stand on one leg with a slight bend in the knee, lifting the opposite foot slightly off the ground, holding dumbbells at your sides.',
      'Engage your core and gluteals, level your pelvis, and maintain a neutral spine with your chest proud.',
      'Hinge forward at the hips to lower the weights along your shins while extending the non-working leg straight back; return to upright balance, curl the weights to your shoulders, and press overhead.',
      'Lower the weights under control back to your shoulders, uncurl them to your sides, and repeat for the desired repetitions before switching legs.'
    )
    upgradedCount++
    continue
  }

  if (norm === 'single leg romanian deadlift single arm curl to overhead press') {
    ex.description = formatFourSteps(
      'Stand on your stance leg with a slight knee bend, holding a dumbbell in the opposite hand, lifting the non-working foot slightly off the floor.',
      'Engage your core and gluteals, keeping your hips and shoulders squared to prevent trunk rotation.',
      'Hinge at the hips, lowering the dumbbell toward your stance foot while extending the non-working leg back; return upright, perform a single-arm bicep curl, and press the dumbbell overhead.',
      'Lower the dumbbell with control back to shoulder height, uncurl to the start, and repeat before alternating sides.'
    )
    upgradedCount++
    continue
  }

  if (norm === 'single leg romanian deadlift to pnf pattern 2') {
    ex.description = formatFourSteps(
      'Stand on one leg with a slight knee bend, holding a light dumbbell or cable handle at the opposite hip, lifting the non-working foot off the ground.',
      'Engage your core and level your pelvis, maintaining single-leg stabilization throughout the movement.',
      'Hinge forward at the hips into a single-leg deadlift; as you return to upright standing, draw your arm diagonally upward across your body into PNF Pattern 2 (external rotation and abduction).',
      'Lower the weight diagonally back across your torso to the opposite hip under control, and repeat before switching legs.'
    )
    upgradedCount++
    continue
  }

  if (norm === 'single leg hop stabilization level 1') {
    ex.description = formatFourSteps(
      'Stand on one leg in an athletic posture with a slight knee bend, lifting the opposite foot off the ground with hips level.',
      'Draw in your abdominal wall, contract the gluteus medius of your stance leg, and pack your shoulders down.',
      'Hop forward a short distance, landing softly on the entire foot with weight evenly distributed from heel to toe, ensuring the knee tracks over your second and third toes.',
      'Hold the single-leg landing position for 2 full seconds to stabilize without wobbling or letting your knee cave inward, then reset and repeat.'
    )
    upgradedCount++
    continue
  }

  if (norm === 'single leg hop stabilization level 2') {
    ex.description = formatFourSteps(
      'Stand on one leg in an athletic stance with knee softly unlocked and core braced.',
      'Engage your gluteals and abdominal wall, keeping your pelvis level and opposite knee lifted.',
      'Hop forward landing softly on the opposite leg with weight centered over the midfoot, holding the landing for 2 seconds to establish complete dynamic stabilization.',
      'Immediately hop backward to the starting leg, holding the landing for 2 seconds before initiating the next repetition.'
    )
    upgradedCount++
    continue
  }

  if (norm === 'activation ball prone shoulder ext rotation') {
    ex.description = formatFourSteps(
      'Lie prone over a stability ball with hips and pelvis supported on the ball and toes planted on the floor for stability.',
      'Contract your glutes and push your hips firmly into the ball while maintaining neutral spinal alignment from head to heels.',
      'Start with elbows bent at a 90-degree right angle parallel with your shoulders; rotate your forearms and hands upward toward the ceiling by contracting your rotator cuff.',
      'Hold the peak external rotation for 1–2 seconds, then slowly lower your forearms back to parallel with control.'
    )
    upgradedCount++
    continue
  }

  if (norm === 'activation ball prone shoulder press') {
    ex.description = formatFourSteps(
      'Lie face down over a stability ball with hips and pelvis resting on the ball and legs extended behind you.',
      'Contract your glutes and push your hips into the stability ball while maintaining neutral alignment throughout your cervical and lumbar spine.',
      'Start with elbows bent at a right angle and parallel with your shoulders; press your hands and arms forward away from your head within a comfortable pain-free range.',
      'Slowly return your elbows back to shoulder level under control, squeezing your scapular retractors, and repeat.'
    )
    upgradedCount++
    continue
  }

  if (norm === 'activation ball prone wide row') {
    ex.description = formatFourSteps(
      'Lie face down over a stability ball with hips supported and feet anchored to the floor shoulder-width apart.',
      'Contract your glutes and push your hips into the ball, bracing your core to keep your spine straight and neutral.',
      'Contract the muscles of your upper back and posterior deltoids to pull your hands and elbows wide toward your torso, keeping elbows out at 90 degrees.',
      'Hold peak contraction for 1 second, then slowly extend your arms back to the starting position with control.'
    )
    upgradedCount++
    continue
  }

  if (norm === 'activation medial gastrocnemius') {
    ex.description = formatFourSteps(
      'Stand upright on the edge of a step or platform with your toes pointing slightly inward toward the midline.',
      'Engage your core and maintain an upright posture with knees straight but not hyperextended.',
      'Push forcefully through the balls of your feet to lift your heels upward into full plantarflexion, targeting the medial head of the calves.',
      'Hold the top contraction for 1 second, then lower your heels under control to the start position and repeat.'
    )
    upgradedCount++
    continue
  }

  if (norm === 'activation medial hamstring') {
    ex.description = formatFourSteps(
      'Lie prone or position yourself in a hamstring curl station with the resistance pad resting against the back of your lower legs.',
      'Maintain alignment across your hips and lumbar spine without arching your lower back, and internally rotate your feet slightly inward.',
      'Perform a hamstring curl by flexing your knees, driving your heels toward your glutes while maintaining slight internal tibial rotation.',
      'Hold peak contraction for 1 second, then slowly lower the resistance through a 3-second eccentric return.'
    )
    upgradedCount++
    continue
  }

  if (norm === 'activation posterior tibialis') {
    ex.description = formatFourSteps(
      'Sit comfortably on a bench or chair with your working foot elevated slightly off the floor.',
      'Maintain an upright posture and keep your lower leg still to isolate movement at the ankle joint.',
      'Point your toe downward into plantarflexion and sweep your foot inward toward the midline of your body, as if drawing the letter "J" with your big toe.',
      'Hold the peak inversion contraction for 1–2 seconds, then slowly return to the neutral starting position and repeat.'
    )
    upgradedCount++
    continue
  }

  if (norm === 'activation serratus push up') {
    ex.description = formatFourSteps(
      'Assume a standard push-up plank position with arms fully extended and hands directly beneath your shoulders.',
      'Maintain rigid alignment from your head through your spine and hips with your core braced and glutes squeezed.',
      'Without bending your elbows, push your hands forcefully into the floor to protract your shoulder blades and raise your upper torso toward the ceiling.',
      'Allow your shoulder blades to retract back together under control while keeping your arms straight throughout, then repeat.'
    )
    upgradedCount++
    continue
  }

  if (norm === 'static standing adductor magnus') {
    ex.description = formatFourSteps(
      'Stand in a wide lateral stance with both feet pointing straight ahead, hands on hips or thighs.',
      'Keep your torso upright and core engaged, maintaining a neutral lumbar spine.',
      'Shift your body weight to one side by bending that knee while keeping the opposite leg completely straight with the foot flat on the floor.',
      'Hold the static stretch in the adductor of the straight leg for 20–30 seconds without bouncing, then switch to the opposite side.'
    )
    upgradedCount++
    continue
  }

  // 2. Check for single-leg movements that cue bilateral stance
  if (norm.includes('single leg') || norm.includes('single-leg')) {
    const descLower = currentDesc.toLowerCase()
    if (!descLower.includes('single leg') && !descLower.includes('one leg') && !descLower.includes('lift') && !descLower.includes('balance on')) {
      const steps = currentDesc.split('\n\n')
      if (steps.length >= 4) {
        steps[0] = steps[0].replace(/Step 1:\s*(Setup\s*)?/i, 'Step 1: Setup Stand on one leg with a slight knee bend, lifting the opposite foot off the floor, ')
        steps[1] = steps[1].replace(/Step 2:\s*(Brace\/Position\s*)?/i, 'Step 2: Brace/Position Engage your core, level your pelvis with your stance glute, and maintain single-leg balance. ')
        ex.description = steps.join('\n\n')
        upgradedCount++
        continue
      }
    }
  }

  // 3. Check for single-arm movements that cue both arms
  if (norm.includes('single arm') || norm.includes('single-arm')) {
    const descLower = currentDesc.toLowerCase()
    if (descLower.includes('both hands') || descLower.includes('in each hand') || descLower.includes('both arms')) {
      ex.description = currentDesc
        .replace(/in each hand/gi, 'in your working hand')
        .replace(/both hands/gi, 'your working hand')
        .replace(/both arms/gi, 'your working arm')
      upgradedCount++
      continue
    }
  }

  // 4. Check for SMR movements that cue dynamic reps instead of pressure holds
  if (norm.includes('foam roll') || norm.includes('smr') || norm.includes('self myofascial')) {
    if (currentDesc.includes('desired number of repetitions') || currentDesc.includes('repeat for repetitions')) {
      ex.description = currentDesc
        .replace(/repeat for the desired number of repetitions/gi, 'hold on any tender spots for 30–60 seconds to allow autogenic inhibition')
        .replace(/repeat for repetitions/gi, 'hold on tender areas for 30–60 seconds')
      upgradedCount++
      continue
    }
  }
}

console.log(`Upgraded ${upgradedCount} exercises with textbook-accurate NASM clinical cues.`)

// Save updated library
fs.writeFileSync(libraryPath, JSON.stringify(library, null, 2))
console.log(`Saved updated library to ${libraryPath}`)

// Update lib/nasm-fuzzy-matcher.ts
const existingFuzzyMatcherCode = fs.readFileSync(fuzzyMatcherPath, 'utf8')
const marker = 'export const NASM_COMPLETE_LIBRARY: NasmLibraryRecord[] = ['
const splitIdx = existingFuzzyMatcherCode.indexOf(marker)
const endMarker = 'export function normalizeExerciseQuery(name: string): string {'
const endSplitIdx = existingFuzzyMatcherCode.indexOf(endMarker)

if (splitIdx !== -1 && endSplitIdx !== -1) {
  const header = existingFuzzyMatcherCode.slice(0, splitIdx)
  const trailer = existingFuzzyMatcherCode.slice(endSplitIdx)
  const updatedCode = `${header}export const NASM_COMPLETE_LIBRARY: NasmLibraryRecord[] = ${JSON.stringify(library, null, 2)}\n\n/**\n * Normalizes an exercise name for heuristic matching.\n * Strips superset suffixes "(Strength 1A)", "(Stability 1B)", parentheticals, phase markers, and punctuation.\n */\n${trailer}`
  fs.writeFileSync(fuzzyMatcherPath, updatedCode)
  console.log(`Saved updated ${fuzzyMatcherPath}`)
}
