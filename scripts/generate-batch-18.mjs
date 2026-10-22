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

const batch18 = [
  {
    name: 'repeat-tuck-jumps',
    artifactFile: 'repeat_tuck_jumps_v2_pro.jpg',
    publicFile: 'repeat-tuck-jumps.jpg',
    prompt: `Commercial fitness photography of a male athlete performing Repeat Tuck Jumps in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame, leaving the dark carbon navy wall and the official Forge Athletic brand lockup in the background completely unobstructed.
- The athlete is captured at the explosive mid-air apex of flight over the dark turf track.
- Both knees are drawn tight up toward the chest in deep hip flexion with shins horizontal to the floor; hands reaching forward lightly touching the shins.
- Proud chest, upright vertical torso, forward visual gaze with neutral cervical spine.
- Zero torso twisting or pelvic asymmetry, demonstrating perfect Phase 5 Power dynamic stretch-shortening cycle vertical explosion.
- The official Forge Athletic metallic crest and "FORGE ATHLETIC" lettering are sharply focused and fully visible on the wall behind.`
  },
  {
    name: 'frontal-box-jump-down-to-tuck-jump',
    artifactFile: 'frontal_box_jump_down_tuck_jump_v2_pro.jpg',
    publicFile: 'frontal-box-jump-down-to-tuck-jump.jpg',
    prompt: `Commercial fitness photography of a male athlete performing Frontal Box Jump Down to Tuck Jump in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Directly behind the athlete on the dark turf sits a low matte black 12-to-18-inch plyometric box from which the athlete has just stepped off.
- The athlete is captured suspended mid-air at peak vertical height directly in front of the box in rapid elastic rebound.
- Both knees are tucked tight to chest with shins parallel to the ground; hands reaching forward contacting the shins.
- Upright posture, proud chest, forward gaze along the linear track.
- Demonstrates textbook sagittal plyometric depth jump and immediate explosive vertical rebound.
- The official Forge Athletic titanium shield crest and "FORGE ATHLETIC" block lettering are crisp, illuminated, and completely unobstructed on the wall.`
  },
  {
    name: 'inverted-push-up',
    artifactFile: 'inverted_push_up_v2_pro.jpg',
    publicFile: 'inverted-push-up.jpg',
    prompt: `Commercial fitness photography of a male athlete performing an Inverted Push-Up (Decline Push-Up) in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned in the lower-right foreground on a dark workout mat, leaving the upper-left dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed.
- Top lockout position of an inverted decline push-up.
- Feet are elevated behind on a sleek matte black flat workout bench with toes anchored in clean black sneakers.
- Hands are planted shoulder-width on the workout mat directly beneath the shoulders; arms fully extended with active scapular protraction and serratus engagement.
- Body forms a rigid, laser-straight inverted diagonal plank from elevated heels through glutes and braced core to crown of head; zero lumbar sagging or hip piking.
- Neutral neck with chin packed, eyes focused on the mat.
- The official Forge Athletic brand lockup (faceted titanium crest with gold flame and cyan wave, "FORGE" and "ATHLETIC") is prominently mounted and 100% visible on the wall behind.`
  },
  {
    name: 'single-leg-hop-stabilization-level-2',
    artifactFile: 'sl_hop_stabilization_level_2_v2_pro.jpg',
    publicFile: 'single-leg-hop-stabilization-level-2.jpg',
    prompt: `Commercial fitness photography of a male athlete performing Single-Leg Hop Stabilization Level 2 in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame along the dark turf track, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Captured frozen in a dynamic unilateral balance hold on the stance leg.
- Stance knee is flexed at approximately 35° absorbing dynamic impact, tracking strictly over the 2nd and 3rd toes with zero knee valgus collapse.
- Non-working leg is held up in a crisp 90° hip and knee flexion runner balance pose; foot dorsiflexed.
- Square, level pelvis with an athletic slight forward torso lean and neutral spine.
- Arms are positioned in an athletic runner counter-balance freeze.
- Held in strict 3-to-5 second stabilization freeze demonstrating NASM Phase 2 Strength Endurance unilateral deceleration.
- The official Forge Athletic master brand crest and block lettering "FORGE ATHLETIC" are sharply defined and fully visible on the wall.`
  },
  {
    name: 'plank-walkup',
    artifactFile: 'plank_walkup_v2_pro.jpg',
    publicFile: 'plank-walkup.jpg',
    prompt: `Commercial fitness photography of a male athlete performing a Plank Walkup (Commandos) in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned in the lower-right foreground on a dark workout mat over the turf, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed in the background.
- Captured mid-transition between a forearm plank and a high push-up plank.
- One arm is bent at 90° with forearm and elbow flat on the mat, while the contralateral hand is planted flat on the mat with arm extending upward to press the torso off the floor.
- Shoulders and pelvis remain rigidly level and parallel to the floor, displaying exceptional anti-rotational core stability with zero hip swaying or torso twisting.
- Rigid horizontal plank line from heels through contracted glutes and braced core to crown of head; neutral spine, chin packed.
- The official Forge Athletic brand lockup (faceted titanium crest with golden flame core and cyan waves, metallic "FORGE", and warm gold "ATHLETIC") is prominently illuminated and 100% visible on the dark carbon navy wall.`
  }
]

async function run() {
  console.log(`🚀 Starting Batch 18 Generation (5 movements)...`)
  for (let i = 0; i < batch18.length; i++) {
    const item = batch18[i]
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
  console.log(`\n🎉 Batch 18 completed successfully!`)
}

run().catch((err) => {
  console.error('Batch 18 failed:', err)
  process.exit(1)
})
