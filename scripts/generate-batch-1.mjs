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

const batch1 = [
  {
    name: 'goblet-squat',
    artifactFile: 'goblet_squat_v2_pro.jpg',
    publicFiles: ['goblet-squat.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Goblet Squat in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Deep parallel femur depth, knees tracking outward directly over the second and third toes.
- Perfectly upright vertical chest, elbows tucked neatly inside the knees.
- Holding a matte black cast iron kettlebell by the horns close against the sternum.
- Heels grounded flat, core firmly braced, forward gaze.
- The official Forge Athletic metallic shield crest and "FORGE ATHLETIC" lettering are sharply defined, illuminated, and fully visible on the wall behind.`
  },
  {
    name: 'floor-bridge',
    artifactFile: 'glute_bridge_v2_pro.jpg',
    publicFiles: [
      'floor-bridge.jpg',
      'glute-bridge.jpg'
    ],
    prompt: `Commercial fitness photography of a male athlete performing a Floor Glute Bridge on a mat in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- Athlete positioned on a black workout mat in the lower foreground at a slight 30-degree angle, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper wall.
- Bilateral feet flat on the floor with knees flexed at 90 degrees; arms resting on mat at 45 degrees for stability.
- Peak hip extension driven by full gluteus maximus contraction, forming a clean straight diagonal line from knees through hips to shoulders.
- Flat abdominal wall with ribs held down, zero lumbar hyperextension.
- The official Forge Athletic titanium crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'push-up',
    artifactFile: 'push_up_v2_pro.jpg',
    publicFiles: ['push-up.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Standard Push-Up on a mat in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- Athlete positioned in the lower-right foreground at a 30-degree angle, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper-left.
- Bottom turnaround position hovering two inches above the black workout mat.
- Perfectly rigid plank line from crown of head straight through hips and knees to heels.
- Clean 45-degree elbow tracking relative to torso (not flared wide), forearms vertical.
- Neutral cervical spine with chin packed and eyes cast down-forward.
- The official Forge Athletic brand lockup (faceted titanium crest with golden flame core and cyan waves, metallic "FORGE", and warm gold "ATHLETIC") is prominently mounted and 100% visible on the wall behind.`
  },
  {
    name: 'single-leg-reach-sagittal',
    artifactFile: 'single_leg_reach_sagittal_v2_pro.jpg',
    publicFiles: [
      'single-leg-reach-sagittal.jpg',
      'single-leg-balance-reach-frontal-plane.jpg'
    ],
    prompt: `Commercial fitness photography of a male athlete performing a Single-Leg Balance Reach in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- Athlete standing on the right-third of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Single-leg balance foundation: planted foot flat on rubber floor with soft knee flexion tracking straight over second toe.
- Level hips and squared pelvis; hands on hips maintaining stable posture.
- Contralateral non-stance foot reaching straight forward in the sagittal plane hovering just above the floor.
- Tall vertical torso with neutral spine and focused forward expression.
- The official Forge Athletic master brand crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'barbell-bench-press',
    artifactFile: 'barbell_bench_press_v2_pro.jpg',
    publicFiles: ['barbell-bench-press.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing an Olympic Barbell Flat Bench Press in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The Olympic bench station and athlete are positioned on the right side of the 16:9 frame, leaving the dark carbon navy architectural wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Supine on the flat bench with feet planted firmly on the floor.
- Barbell at bottom chest touchpoint over the lower sternum.
- Forearms strictly vertical perpendicular to the floor, wrists straight over knurled steel bar.
- Scapulae deeply retracted and depressed into the pad; natural stable lumbar arch.
- The official Forge Athletic titanium shield crest and "FORGE ATHLETIC" block lettering are crisp, illuminated, and completely unobstructed on the wall.`
  }
]

async function run() {
  const force = process.argv.includes('--force')
  console.log(`🚀 Starting Batch 1 Generation (5 movements)...`)
  for (let i = 0; i < batch1.length; i++) {
    const item = batch1[i]
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
  console.log(`\n🎉 Batch 1 completed successfully!`)
}

run().catch((err) => {
  console.error('Batch 1 failed:', err)
  process.exit(1)
})
