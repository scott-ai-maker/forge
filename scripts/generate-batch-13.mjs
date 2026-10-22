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

const batch13 = [
  {
    name: 'single-arm-incline-dumbbell-chest-press',
    artifactFile: 'single_arm_incline_dumbbell_chest_press_v2_pro.jpg',
    publicFile: 'single-arm-incline-dumbbell-chest-press.jpg',
    prompt: `Commercial fitness photography of a male athlete performing a Single-Arm Incline Dumbbell Chest Press in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned in the lower-right foreground on a sleek matte black 30-degree incline bench, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper-left.
- Supine on the incline bench with back and hips flush against padding; feet planted flat and wide on the floor.
- Right arm is pressing a sleek matte black dumbbell vertically over the shoulder to full lockout with a neutral straight wrist.
- Contralateral left hand rests flat on the left hip/abdomen actively bracing against rotational torque.
- Head rests against headrest with neutral cervical spine, chin packed.
- The official Forge Athletic metallic shield crest and "FORGE ATHLETIC" lettering are sharply defined and fully visible on the wall behind.`
  },
  {
    name: 'ball-cobra',
    artifactFile: 'ball_cobra_v2_pro.jpg',
    publicFile: 'ball-cobra.jpg',
    prompt: `Commercial fitness photography of a male athlete performing a Ball Cobra in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned in the lower-right foreground on a dark workout mat over the turf, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper-left.
- Prone over a matte black stability ball supporting the pelvis and abdomen.
- Legs extended straight back with toes anchored shoulder-width on the floor in clean black sneakers.
- Chest is lifted slightly off the ball in an elongated straight line from heels through spine to crown of head.
- Arms are abducted 30 degrees with thumbs pointing straight up toward ceiling in external shoulder rotation (scapular retraction and depression).
- Chin tucked in neutral cervical spine with eyes directed toward the floor.
- The official Forge Athletic brand lockup (faceted titanium crest with golden flame core and cyan waves, metallic "FORGE", and warm gold "ATHLETIC") is prominently mounted and 100% visible on the wall behind.`
  },
  {
    name: 'standing-tubing-row',
    artifactFile: 'standing_tubing_row_v2_pro.jpg',
    publicFile: 'standing-tubing-row.jpg',
    prompt: `Commercial fitness photography of a male athlete performing a Standing Tubing Row in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Standing tall in athletic posture with feet shoulder-width apart pointing forward, knees soft, slight forward athletic hip hinge.
- Gripping resistance tubing handles anchored at chest height in front; pulling handles back tight to the ribcage.
- Elbows drive straight back close to the torso with shoulder blades retracted and depressed in full mid-back contraction.
- Proud tall chest, braced core, neutral spine looking forward.
- The official Forge Athletic titanium crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'static-latissimus-dorsi-ball-stretch',
    artifactFile: 'static_latissimus_dorsi_ball_stretch_v2_pro.jpg',
    publicFile: 'static-latissimus-dorsi-ball-stretch.jpg',
    prompt: `Commercial fitness photography of a male athlete performing a Static Latissimus Dorsi Ball Stretch in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned in the lower-right foreground on a dark workout mat, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed in the background.
- Quadruped kneeling position on the mat with knees under hips and hips sitting gently back toward heels.
- Left hand flat on the mat supporting upper body weight.
- Right arm extended forward resting forearm on a matte black stability ball with thumb pointing upward toward ceiling.
- Rolling ball forward into a deep, relaxed static stretch through the right latissimus dorsi.
- Relaxed neutral back, head neutral between arms.
- The official Forge Athletic master brand crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'assisted-single-leg-squat',
    artifactFile: 'assisted_single_leg_squat_v2_pro.jpg',
    publicFile: 'assisted-single-leg-squat.jpg',
    prompt: `Commercial fitness photography of a male athlete performing an Assisted Single-Leg Squat in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Standing on a single leg with stance foot flat pointing straight ahead; stance knee flexed to 80 degrees parallel squat depth.
- Stance knee tracking strictly over 2nd and 3rd toes with zero dynamic knee valgus collapse.
- Non-working leg flexed at 90 degrees hovering cleanly beside/behind body.
- Hands lightly holding a vertical power rack upright post at chest height for balance assistance (light fingertip contact, not pulling bodyweight).
- Proud upright chest, flat neutral spine, forward visual focus.
- The official Forge Athletic titanium shield crest and "FORGE ATHLETIC" block lettering are crisp, illuminated, and completely unobstructed on the wall.`
  }
]

async function run() {
  console.log(`🚀 Starting Batch 13 Generation (5 movements)...`)
  for (let i = 0; i < batch13.length; i++) {
    const item = batch13[i]
    console.log(`\n[${i + 1}/5] Generating ${item.name}...`)
    const artifactPath = path.join(ARTIFACT_DIR, item.artifactFile)
    const publicPath = path.join(PUBLIC_DIR, item.publicFile)
    await generateForgeExercisePhoto({
      prompt: item.prompt,
      artifactPath,
      publicPath
    })
    console.log(`✅ [${i + 1}/5] Finished ${item.name}`)
  }
  console.log(`\n🎉 Batch 13 completed successfully!`)
}

run().catch((err) => {
  console.error('Batch 13 failed:', err)
  process.exit(1)
})
