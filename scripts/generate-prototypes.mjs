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

const prototypes = [
  {
    name: 'squat-to-overhead-reach',
    artifactFile: 'squat_to_overhead_reach_v2_pro.jpg',
    publicFiles: ['squat-to-overhead-reach.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Squat to Overhead Reach & Scaption in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is standing in the center-right of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Bilateral standing foundation, tall vertical posture with neutral pelvis and core braced.
- Arms elevated in the true NASM scapular plane (30 to 45 degrees anterior to the frontal plane in a high V angle) directly overhead.
- External rotation: thumbs pointed upward and subtly backward to preserve subacromial clearance.
- Traps and shoulders depressed away from the ears, proud chest.
- The official Forge Athletic metallic shield crest and "FORGE ATHLETIC" lettering are sharply defined, illuminated, and fully visible on the wall behind.`
  },
  {
    name: 'dumbbell-romanian-deadlift',
    artifactFile: 'dumbbell_romanian_deadlift_v2_pro.jpg',
    publicFiles: ['dumbbell-romanian-deadlift.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Dumbbell Romanian Deadlift (RDL) in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- Athlete positioned on the right-third of the 16:9 frame along the dark turf track, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Hip hinge geometry: hips driven posteriorly into a clean hinge turnaround point.
- Shins remain vertical with a soft 15-degree knee flex (differentiating a hinge from a squat).
- Neutral cervical and lumbar alignment; eyes cast forward-down on the floor (~5 ft ahead) with chin packed.
- Matte black hex dumbbells tracking millimeters off the anterior shins with lats engaged.
- The official Forge Athletic titanium crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  }
]

async function run() {
  const force = process.argv.includes('--force')
  console.log(`🚀 Starting Prototypes Generation (2 movements)...`)
  for (let i = 0; i < prototypes.length; i++) {
    const item = prototypes[i]
    const artifactPath = path.join(ARTIFACT_DIR, item.artifactFile)
    const primaryPublicPath = path.join(PUBLIC_DIR, item.publicFiles[0])

    if (!force && fs.existsSync(artifactPath)) {
      console.log(`\n[${i + 1}/2] ⏩ Skipping ${item.name} (already generated: ${item.artifactFile})`)
      continue
    }

    console.log(`\n[${i + 1}/2] Generating ${item.name}...`)
    
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

    console.log(`✅ [${i + 1}/2] Finished ${item.name}`)
  }
  console.log(`\n🎉 Prototypes completed successfully!`)
}

run().catch((err) => {
  console.error('Prototypes failed:', err)
  process.exit(1)
})
