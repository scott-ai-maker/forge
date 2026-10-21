import fs from 'node:fs'
import path from 'node:path'
import { generateForgeExercisePhoto } from './generate-forge-photo.mjs'

const ARTIFACT_DIR = '/Users/scottgordon/.gemini/antigravity-ide/brain/da9a9a0a-b150-4a23-93f6-0c37282b9d2c'
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

const batch8 = [
  {
    name: 'cable-pallof-press',
    artifactFile: 'cable_pallof_press_v2_pro.jpg',
    publicFiles: ['cable-pallof-press.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Standing Cable Pallof Press in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is standing on the right-third of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Athletic standing stance with feet shoulder-width apart, knees softly flexed, level pelvis, perfectly upright vertical torso with zero torso rotation or lateral spine flexion.
- Both hands clasped firmly around a D-handle connected to a chest-height cable column.
- Arms fully extended straight forward perpendicular to the torso directly in front of the sternum, actively resisting the lateral anti-rotational pull from the cable stack.
- Abdominal core intensely braced, proud chest, forward gaze.
- The official Forge Athletic metallic shield crest and "FORGE ATHLETIC" lettering are sharply defined, illuminated, and fully visible on the wall behind.`
  },
  {
    name: 'overhead-triceps-extension',
    artifactFile: 'overhead_triceps_extension_v2_pro.jpg',
    publicFiles: ['overhead-triceps-extension.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Seated Overhead Dumbbell Triceps Extension in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The flat workout bench with short vertical backrest and athlete are positioned on the right side of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Seated tall on the bench, feet planted flat on the rubber floor, neutral spine with core braced and no excessive lumbar arching.
- Both hands cupping the inner head of a heavy dumbbell in a diamond grip directly overhead.
- Upper arms vertical and tucked neatly close to the temples, elbows pointing up and forward (not flared wide).
- Forearms bent back behind the head to a deep 90-degree stretch turnaround position; shoulders depressed.
- The official Forge Athletic brand lockup (faceted titanium crest with golden flame core and cyan waves, metallic "FORGE", and warm gold "ATHLETIC") is prominently mounted and 100% visible on the wall behind.`
  },
  {
    name: 'incline-dumbbell-curl',
    artifactFile: 'incline_dumbbell_curl_v2_pro.jpg',
    publicFiles: ['incline-dumbbell-curl.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing an Incline Dumbbell Bicep Curl in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The 45-degree incline workout bench and athlete are positioned on the right side of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Seated back on the 45-degree incline adjustable bench with back and head resting comfortably against the pad, feet flat on the floor.
- Upper arms hanging vertically and stationary perpendicular to the floor.
- Curling dumbbells upward in full supination (palms facing up and forward) to peak bicep contraction without swinging the elbows forward.
- Wrists locked straight and neutral; proud chest and focused expression.
- The official Forge Athletic titanium crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'good-mornings',
    artifactFile: 'good_mornings_v2_pro.jpg',
    publicFiles: ['good-mornings.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing an Olympic Barbell Good Morning in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame along the dark turf track, leaving the dark carbon navy architectural wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Standing with feet hip-to-shoulder width apart, soft 15-degree knee bend with shins staying vertical.
- Barbell secured across upper traps/rear deltoids with a secure knurled grip and retracted scapulae.
- Torso hinged forward at the hips to 60-to-70 degrees toward parallel, hips driven back posteriorly in a clean hinge turnaround.
- Spine completely neutral from lumbar to cervical crown, neck packed looking at the floor several feet ahead (zero hyperextension).
- Peak hamstring and glute eccentric loading.
- The official Forge Athletic master brand crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'step-up-to-balance',
    artifactFile: 'step_up_to_balance_v2_pro.jpg',
    publicFiles: ['step-up-to-balance.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Step-Up to Balance in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The 18-inch plyo box and athlete are positioned on the right-third of the 16:9 frame, leaving the dark carbon navy architectural wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Working right foot planted flat and centered on top of an 18-inch plyo box, working leg fully extended with knee tracking straight over the second toe.
- Trail left leg driven up into a 90-degree hip and knee flexed balance position with dorsiflexed ankle.
- Tall vertical torso with neutral spine and level pelvis.
- Holding hex dumbbells securely at sides with shoulders depressed away from ears.
- Standing tall in single-leg equilibrium and perfect postural control.
- The official Forge Athletic titanium shield crest and "FORGE ATHLETIC" block lettering are crisp, illuminated, and completely unobstructed on the wall.`
  }
]

async function run() {
  console.log(`🚀 Starting Batch 8 Generation (5 movements)...`)
  for (let i = 0; i < batch8.length; i++) {
    const item = batch8[i]
    console.log(`\n[${i + 1}/5] Generating ${item.name}...`)
    const artifactPath = path.join(ARTIFACT_DIR, item.artifactFile)
    const primaryPublicPath = path.join(PUBLIC_DIR, item.publicFiles[0])
    
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
  console.log(`\n🎉 Batch 8 completed successfully!`)
}

run().catch((err) => {
  console.error('Batch 8 failed:', err)
  process.exit(1)
})
