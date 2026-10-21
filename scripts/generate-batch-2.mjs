import fs from 'node:fs'
import path from 'node:path'
import { generateForgeExercisePhoto } from './generate-forge-photo.mjs'

const ARTIFACT_DIR = '/Users/scottgordon/.gemini/antigravity-ide/brain/83c81a66-8951-4274-90b5-3967350a4d1f'
const PUBLIC_DIR = path.resolve(process.cwd(), 'public/images/exercises')

const BRAND_LOCKUP_PROMPT = `The first image provided is the ground truth reference for the official Forge Athletic brand identity.
In the background of the gym, mounted centrally or upper-left on the dark carbon navy architectural wall (#080E14), prominently render the exact brand lockup from the reference image:
1. The faceted metallic titanium shield crest enclosing an architectural "F", a glowing golden flame core, and electric cyan telemetry wave contours.
2. Directly beneath the crest, bold metallic titanium block lettering "FORGE" (with clean letter 'G').
3. Directly beneath "FORGE", clean warm gold block lettering "ATHLETIC" (#F59E0B).
Strictly zero extraneous text or labels (NO "Precision Apex Crest" label, NO other words).
The brand lockup must be 100% visible and unobstructed on the dark carbon navy wall behind the athlete.

The setting is an ultra-premium, modern athletic training facility with dark carbon navy wall panels, dark charcoal turf, linear floor markings, and dramatic 5600K key lighting with subtle electric cyan architectural accents. Commercial sports photography shot on Hasselblad H6D-100c, 50mm f/4 lens, hyper-realistic, 8k resolution, razor-sharp focus.`

const WARDROBE_PROMPT = `The athlete is a fit male model. STRICT WARDROBE RULE: SHIRT KEPT ON AT ALL TIMES. The athlete is wearing a fitted charcoal athletic performance crewneck t-shirt with short sleeves (NOT shirtless, NOT bare-chested, NO tank tops, NO sleeveless tops), paired with dark athletic training shorts and clean black training shoes.`

const batch2 = [
  {
    name: 'barbell-back-squat',
    artifactFile: 'barbell_back_squat_v2_pro.jpg',
    publicFiles: ['barbell-back-squat.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing an Olympic Barbell Back Squat in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Deep femur-parallel squat depth inside a modern black power rack.
- Knees tracking outward directly over the second and third toes with grounded heels.
- Olympic barbell secured firmly across the upper trapezius with a tight knurled steel grip and retracted scapulae.
- Upright vertical torso with neutral spine and core braced rock solid.
- The official Forge Athletic metallic shield crest and "FORGE ATHLETIC" lettering are sharply defined, illuminated, and fully visible on the wall behind.`
  },
  {
    name: 'barbell-deadlift',
    artifactFile: 'barbell_deadlift_v2_pro.jpg',
    publicFiles: ['barbell-deadlift.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing an Olympic Barbell Conventional Deadlift in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete and Olympic barbell are positioned on the right side of the 16:9 frame, leaving the dark carbon navy architectural wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Dynamic liftoff initiation position: flat neutral spine from lumbar to cervical crown with lats engaged and locked.
- Olympic barbell positioned directly over the midfoot, clearing shins.
- Hips higher than knees and below shoulders in optimal conventional deadlift setup.
- Hands gripping the knurled bar outside the shins; proud chest and packed chin looking forward-down at floor.
- The official Forge Athletic titanium crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'plank',
    artifactFile: 'forearm_plank_v2_pro.jpg',
    publicFiles: ['plank.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Forearm Plank on a mat in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- Athlete positioned on a black workout mat in the lower foreground at a slight 30-degree angle, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper wall.
- Rigid horizontal plank line from crown of head straight through hips to heels.
- Forearms flat on mat with elbows stacked directly beneath the shoulders at 90 degrees.
- Neutral pelvis with full abdominal core brace and glute contraction, zero hip sag or pike.
- Chin packed looking directly down at mat.
- The official Forge Athletic brand lockup (faceted titanium crest with golden flame core and cyan waves, metallic "FORGE", and warm gold "ATHLETIC") is prominently mounted and 100% visible on the wall behind.`
  },
  {
    name: 'dumbbell-overhead-press',
    artifactFile: 'dumbbell_overhead_press_v2_pro.jpg',
    publicFiles: ['dumbbell-overhead-press.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Standing Dumbbell Overhead Press in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- Athlete standing on the right-third of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Peak overhead lockout position: matte black hex dumbbells pressed directly overhead in line with ears.
- Elbows fully extended, wrists straight and stacked over elbows and shoulders.
- Core locked with ribs pulled down, zero lumbar hyperextension, glutes squeezed.
- Grounded hip-width athletic stance with upright posture and forward gaze.
- The official Forge Athletic master brand crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'dumbbell-bent-over-row',
    artifactFile: 'dumbbell_bent_over_row_v2_pro.jpg',
    publicFiles: ['dumbbell-bent-over-row.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Dumbbell Bent-Over Row in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- Athlete standing on the right-third of the 16:9 frame along the dark turf track, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- 45-degree hip hinge angle with completely flat, neutral spine from sacrum to cervical crown; soft knee bend.
- Matte black hex dumbbells pulled upward toward hips with elbows driving straight back tight against the ribs.
- Scapulae deeply retracted and squeezed into mid-back in peak lat and rhomboid contraction.
- Packed neck looking at floor 4-5 feet ahead.
- The official Forge Athletic titanium shield crest and "FORGE ATHLETIC" block lettering are crisp, illuminated, and completely unobstructed on the wall.`
  }
]

async function run() {
  const force = process.argv.includes('--force')
  console.log(`🚀 Starting Batch 2 Generation (5 movements)...`)
  for (let i = 0; i < batch2.length; i++) {
    const item = batch2[i]
    const artifactPath = path.join(ARTIFACT_DIR, item.artifactFile)
    const primaryPublicPath = path.join(PUBLIC_DIR, item.publicFiles[0])

    if (!force && fs.existsSync(artifactPath)) {
      console.log(`\n[${i + 1}/5] ⏩ Skipping ${item.name} (already generated: ${item.artifactFile})`)
      continue
    }

    console.log(`\n[${i + 1}/5] Generating ${item.name}...`)
    
    await generateForgeExercisePhoto({
      prompt: item.prompt,
      artifactPath,
      publicPath: primaryPublicPath
    })

    for (let j = 1; j < item.publicFiles.length; j++) {
      const secondaryPath = path.join(PUBLIC_DIR, item.publicFiles[j])
      fs.copyFileSync(primaryPublicPath, secondaryPath)
      console.log(`  📋 Copied to secondary: ${secondaryPath}`)
    }

    console.log(`✅ [${i + 1}/5] Finished ${item.name}`)
  }
  console.log(`\n🎉 Batch 2 completed successfully!`)
}

run().catch((err) => {
  console.error('Batch 2 failed:', err)
  process.exit(1)
})
