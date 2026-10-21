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

const batch9 = [
  {
    name: 'single-leg-floor-bridge',
    artifactFile: 'single_leg_floor_bridge_v2_pro.jpg',
    publicFiles: ['single-leg-floor-bridge.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Single-Leg Floor Bridge in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is in the lower-right foreground on a black workout mat at a 45-degree angle, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper-left.
- Supine on the mat with arms relaxed at 45 degrees, palms down for stability.
- Planted right foot flat on the floor with knee flexed at 90 degrees; right glute maximally contracted to drive the hips up into full extension.
- Straight diagonal line from working right knee through pelvis to shoulders.
- Non-working left leg is extended straight forward with thighs parallel, knee straight, toes dorsiflexed.
- Pelvis completely level with zero pelvic tilt or hip drop; neutral lumbar spine.
- The official Forge Athletic metallic shield crest and "FORGE ATHLETIC" lettering are sharply defined, illuminated, and fully visible on the wall behind.`
  },
  {
    name: 'squat-jump-with-stabilization',
    artifactFile: 'squat_jump_with_stabilization_v2_pro.jpg',
    publicFiles: ['squat-jump-with-stabilization.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing Squat Jump with Stabilization in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame along the dark turf track, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Captured frozen in a controlled, rock-solid 3-to-5 second landing stabilization hold following an explosive vertical squat jump.
- Feet parallel and shoulder-width apart pointing straight ahead; knees bent into an athletic half-squat landing posture absorbing impact directly over the 2nd and 3rd toes (zero knee valgus collapse or flaring).
- Hips hinged back, chest upright, abdominal core firmly braced.
- Arms extended forward at chest height for dynamic counter-balance.
- Demonstrates textbook Phase 5 kinetic chain deceleration and balance.
- The official Forge Athletic brand lockup (faceted titanium crest with golden flame core and cyan waves, metallic "FORGE", and warm gold "ATHLETIC") is prominently mounted and 100% visible on the wall behind.`
  },
  {
    name: 'single-arm-dumbbell-chest-press',
    artifactFile: 'single_arm_dumbbell_chest_press_v2_pro.jpg',
    publicFiles: ['single-arm-dumbbell-chest-press.jpg', 'single-arm-dumbbell-bench-press.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Single-Arm Dumbbell Flat Bench Press in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The flat workout bench and athlete are positioned in the lower-right foreground at a 45-degree three-quarter angle, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper-left.
- Supine on the flat bench with both feet firmly planted flat on the rubber floor.
- Pressing a heavy urethane dumbbell vertically over the chest in the right hand at full lockout with a neutral wrist.
- Contralateral left hand rests flat across the left hip/abdominal wall actively resisting rotational torque.
- Pelvis, shoulders, and spine remain completely flat and pinned to the bench with zero torso rotation.
- Retracted scapulae, proud chest, neutral cervical spine with head flat on pad.
- The official Forge Athletic titanium crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'squat-to-row',
    artifactFile: 'squat_to_row_v2_pro.jpg',
    publicFiles: ['squat-to-row.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Squat to Cable Row in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is standing on the right-third of the 16:9 frame facing a dual cable column, leaving the dark carbon navy architectural wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Captured at the dynamic standing completion phase of the movement: transitioning smoothly from a parallel squat into full standing hip extension combined with a dual-handle row.
- Feet shoulder-width apart, knees soft and stable, hips fully extended, chest proud and tall.
- Dual cable handles pulled into the sides of the ribcage with elbows driving straight back close to the torso.
- Scapulae powerfully retracted and depressed into the mid-back; core rigidly braced.
- The official Forge Athletic master brand crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'kettlebell-front-squat',
    artifactFile: 'kettlebell_front_squat_v2_pro.jpg',
    publicFiles: ['kettlebell-front-squat.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Dual Kettlebell Front Squat in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame along the dark turf track, leaving the dark carbon navy architectural wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Athletic squat stance with feet shoulder-width apart, toes turned out slightly.
- Holding two competition kettlebells in a textbook front rack position (bell resting in the bicep/chest pocket, thumbs tucked to the sternum, elbows held tight and vertical against the torso).
- Descended to a deep femur-parallel squat depth; chest held high against the anterior load.
- Knees tracking cleanly over the 2nd and 3rd toes; heels firmly grounded; neutral lumbar spine.
- The official Forge Athletic titanium shield crest and "FORGE ATHLETIC" block lettering are crisp, illuminated, and completely unobstructed on the wall.`
  }
]

async function run() {
  console.log(`🚀 Starting Batch 9 Generation (5 movements)...`)
  for (let i = 0; i < batch9.length; i++) {
    const item = batch9[i]
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
  console.log(`\n🎉 Batch 9 completed successfully!`)
}

run().catch((err) => {
  console.error('Batch 9 failed:', err)
  process.exit(1)
})
