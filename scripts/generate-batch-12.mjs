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

const batch12 = [
  {
    name: 'single-leg-squat-touchdown',
    artifactFile: 'single_leg_squat_touchdown_v2_pro.jpg',
    publicFiles: ['single-leg-squat-touchdown.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Single-Leg Squat Touchdown in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame along the dark turf track, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Textbook NASM Single-Leg Squat Touchdown: standing balance on the left stance leg; knee bent into a deep parallel single-leg squat tracking strictly over the 2nd and 3rd toes (zero knee valgus collapse).
- Non-working right leg is bent at 90 degrees at hip and knee, hovering cleanly beside/behind the body (NOT kicked forward like a pistol squat).
- Right contralateral hand reaches across the body down to lightly touch a small neon cyan target cone on the floor just in front of the supporting foot.
- Contralateral left arm is extended out for dynamic counterbalance; proud chest, flat neutral spine, level hips.
- The official Forge Athletic metallic shield crest and "FORGE ATHLETIC" lettering are sharply defined and fully visible on the wall behind.`
  },
  {
    name: 'reverse-lunge-to-single-arm-row',
    artifactFile: 'reverse_lunge_to_single_arm_row_v2_pro.jpg',
    publicFiles: ['reverse-lunge-to-single-arm-row.jpg', 'reverse-lunge-to-row.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Reverse Lunge to Single-Arm Row in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Lunged back in a deep athletic split squat; lead knee bent at 90 degrees tracking directly over the second toe; rear trailing knee hovering 2 inches above the turf with rear heel elevated.
- Contralateral hand is gripping a cable row handle pulling it back tight to the side of the ribcage at the bottom turnaround of the lunge.
- Driving elbow straight back with full scapular retraction and depression.
- Tall upright posture, neutral spine, tight core brace with forward gaze.
- The official Forge Athletic brand lockup (faceted titanium crest with golden flame core and cyan waves, metallic "FORGE", and warm gold "ATHLETIC") is prominently mounted and 100% visible on the wall behind.`
  },
  {
    name: 'single-leg-press',
    artifactFile: 'single_leg_press_v2_pro.jpg',
    publicFiles: ['single-leg-press.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Single-Leg 45-Degree Leg Press in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned in the lower-right foreground in a commercial 45-degree leg press machine, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper-left.
- Seated in the 45-degree incline machine with back and hips firmly supported against the padded backrest; hands gripping the side safety handles.
- Active right foot placed flat in the center of the heavy-duty sled footplate; knee flexed to 90 degrees tracking strictly in line with 2nd and 3rd toes (zero inward valgus tilt).
- Non-working left leg is rested comfortably off the sled on the footrest.
- Pelvis stable against the seat with zero lumbar rounding.
- The official Forge Athletic titanium crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'tuck-jump-with-stabilization',
    artifactFile: 'tuck_jump_with_stabilization_v2_pro.jpg',
    publicFiles: ['tuck-jump-with-stabilization.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing Tuck Jump with Stabilization in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame along the dark turf track, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Captured frozen in a rock-solid, quiet landing stabilization hold following an explosive tuck jump.
- Feet planted shoulder-width apart pointing straight ahead; knees soft and flexed into an athletic quarter-to-half squat absorbing impact over the 2nd and 3rd toes (zero valgus collapse).
- Hips hinged back, chest upright, core firmly braced.
- Arms extended forward in front of chest in a dynamic counter-balance freeze; held for strict 3-to-5 second stabilization.
- Demonstrates textbook Phase 5 Power kinetic chain deceleration.
- The official Forge Athletic master brand crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'seated-machine-row-close-grip',
    artifactFile: 'seated_machine_row_close_grip_v2_pro.jpg',
    publicFiles: ['seated-machine-row-close-grip.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing Seated Close-Grip Cable Machine Row in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned in the lower-right foreground at a low cable row station, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper-left.
- Seated tall and upright on the bench with feet braced on footrests, knees slightly bent.
- Gripping a sleek close-grip V-bar attachment with palms facing each other (neutral grip).
- Pulling the handle smoothly to the lower abdomen/sternum; elbows driving tight close to the ribcage.
- Scapulae powerfully retracted and depressed in full mid-back rhomboid and lat contraction.
- Upright spine with natural lumbar curve (zero excessive backward leaning or rounding); head neutral.
- The official Forge Athletic titanium shield crest and "FORGE ATHLETIC" block lettering are crisp, illuminated, and completely unobstructed on the wall.`
  }
]

async function run() {
  console.log(`🚀 Starting Batch 12 Generation (5 movements)...`)
  for (let i = 0; i < batch12.length; i++) {
    const item = batch12[i]
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
  console.log(`\n🎉 Batch 12 completed successfully!`)
}

run().catch((err) => {
  console.error('Batch 12 failed:', err)
  process.exit(1)
})
