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

const batch4 = [
  {
    name: 'barbell-front-squat',
    artifactFile: 'barbell_front_squat_v2_pro.jpg',
    publicFiles: [
      'barbell-front-squat.jpg',
      'barbell-front-squat-with-clean-position.jpg',
      'barbell-front-squat-with-crossed-arms.jpg'
    ],
    prompt: `Commercial fitness photography of a male athlete performing an Olympic Barbell Front Squat in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Olympic barbell secured in a clean front-rack position across the anterior deltoids and clavicles.
- Elbows driven high and pointing forward parallel to the rubber floor.
- Deep femur-parallel squat depth with knees tracking outward directly over the second and third toes.
- Perfectly upright vertical torso with braced core, grounded flat heels.
- The official Forge Athletic metallic shield crest and "FORGE ATHLETIC" lettering are sharply defined, illuminated, and fully visible on the wall behind.`
  },
  {
    name: 'incline-dumbbell-bench-press',
    artifactFile: 'incline_dumbbell_bench_press_v2_pro.jpg',
    publicFiles: [
      'incline-dumbbell-bench-press.jpg',
      'two-arm-incline-dumbbell-chest-press.jpg'
    ],
    prompt: `Commercial fitness photography of a male athlete performing an Incline Dumbbell Bench Press in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The 30-degree incline bench and athlete are positioned on the right side of the 16:9 frame, leaving the dark carbon navy architectural wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Seated back on the 30-degree incline bench, feet planted flat on floor, back and head supported.
- Holding heavy matte black hex dumbbells touching outside upper chest at bottom turnaround point.
- Forearms vertical perpendicular to floor, elbows at 45-degree angle to torso, scapulae retracted firmly into pad.
- The official Forge Athletic titanium crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'dumbbell-hammer-curl',
    artifactFile: 'dumbbell_hammer_curl_v2_pro.jpg',
    publicFiles: ['dumbbell-hammer-curl.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Standing Dumbbell Hammer Curl in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- Athlete standing on the right-third of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Strict neutral grip: palms facing directly inward toward each other with thumbs pointed straight up.
- Matte black hex dumbbells held strictly vertical (top bell pointing to ceiling, bottom bell to floor; zero supination).
- Elbows pinned tightly against the lateral ribcage with forearms at 90-degree mid-to-peak flexion, loading the brachioradialis and brachialis.
- Rigid shoulder-width athletic stance with neutral spine and zero momentum.
- The official Forge Athletic brand lockup (faceted titanium crest with golden flame core and cyan waves, metallic "FORGE", and warm gold "ATHLETIC") is prominently mounted and 100% visible on the wall behind.`
  },
  {
    name: 'bird-dog',
    artifactFile: 'bird_dog_v2_pro.jpg',
    publicFiles: [
      'bird-dog.jpg',
      'quadruped-opposite-arm-leg-raise.jpg'
    ],
    prompt: `Commercial fitness photography of a male athlete performing the Bird Dog (Quadruped Opposite Arm & Leg Raise) on a mat in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- Athlete positioned on a black workout mat in the lower foreground at a slight 30-degree angle, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper wall.
- Table-top quadruped stance on mat with knees under hips and hands under shoulders.
- Right arm extended straight forward in line with spine with thumb pointed up; contralateral left leg extended straight back with toes pointed down.
- Completely flat neutral spine, zero pelvic rotation or lumbar hyperextension, packed chin.
- The official Forge Athletic master brand crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'static-kneeling-hip-flexor-stretch',
    artifactFile: 'static_kneeling_hip_flexor_stretch_v2_pro.jpg',
    publicFiles: [
      'static-kneeling-hip-flexor-stretch.jpg',
      'active-kneeling-hip-flexor.jpg'
    ],
    prompt: `Commercial fitness photography of a male athlete performing a Half-Kneeling Hip Flexor & Latissimus Stretch on a mat in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- Athlete positioned in the center-right of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- 90/90 half-kneeling posture on a black mat (front foot flat with knee at 90 degrees; back knee down with trailing hip in extension).
- Posterior pelvic tilt engaged with glute squeezed to mobilize the deep psoas.
- Ipsilateral arm reaching high overhead with subtle lateral flexion stretching the lateral fascial chain and latissimus dorsi.
- Tall, proud posture with neutral spine.
- The official Forge Athletic titanium shield crest and "FORGE ATHLETIC" block lettering are crisp, illuminated, and completely unobstructed on the wall.`
  }
]

async function run() {
  const force = process.argv.includes('--force')
  console.log(`🚀 Starting Batch 4 Generation (5 movements)...`)
  for (let i = 0; i < batch4.length; i++) {
    const item = batch4[i]
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
  console.log(`\n🎉 Batch 4 completed successfully!`)
}

run().catch((err) => {
  console.error('Batch 4 failed:', err)
  process.exit(1)
})
