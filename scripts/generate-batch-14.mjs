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

const batch14 = [
  {
    name: 'pike-push-up',
    artifactFile: 'pike_push_up_v2_pro.jpg',
    publicFile: 'pike-push-up.jpg',
    prompt: `Commercial fitness photography of a male athlete performing a Pike Push-Up in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned in the lower-right foreground on a dark workout mat, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper-left.
- Crisp inverted V-shape pike posture on the mat with hips driven high toward the ceiling; feet grounded on balls of toes.
- Captured at the bottom turnaround position of the pike press: elbows flexed to 90 degrees tracking backward, crown of head hovering just forward of the hands forming an equilateral tripod.
- Anterior deltoids and upper pectorals fully engaged under loaded tension.
- Neutral cervical spine with chin packed, eyes looking toward feet.
- The official Forge Athletic metallic shield crest and "FORGE ATHLETIC" lettering are sharply defined and fully visible on the wall behind.`
  },
  {
    name: 'band-push-up',
    artifactFile: 'band_push_up_v2_pro.jpg',
    publicFile: 'band-push-up.jpg',
    prompt: `Commercial fitness photography of a male athlete performing a Band Push-Up in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned in the lower-right foreground on a dark workout mat, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper-left.
- Top lockout position of a push-up with variable elastic resistance.
- A neon cyan resistance loop band is stretched taut across the athlete's upper back/scapulae and pinned firmly under both palms on the mat.
- Arms are fully extended with active scapular protraction and serratus activation against the band tension.
- Rigid, unbroken horizontal plank line from heels through contracted glutes and braced core to crown of head; zero lumbar sagging.
- Chin tucked with neutral neck, eyes focused down at the mat.
- The official Forge Athletic brand lockup (faceted titanium crest with golden flame core and cyan waves, metallic "FORGE", and warm gold "ATHLETIC") is prominently mounted and 100% visible on the wall behind.`
  },
  {
    name: 'incline-push-up-with-rotation',
    artifactFile: 'incline_push_up_with_rotation_v2_pro.jpg',
    publicFile: 'incline-push-up-with-rotation.jpg',
    prompt: `Commercial fitness photography of a male athlete performing Incline Push-Up with Rotation in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Captured at the peak rotational finish of an incline push-up on a sleek matte black flat workout bench.
- Supporting left hand is planted on the bench edge directly under the shoulder.
- Torso and hips are rotated open in a side-plank T-formation; top right arm is extended vertically toward the ceiling in line with the shoulders.
- Proud open chest, staggered feet on the rubber floor maintaining a rigid diagonal side-plank with zero hip sag.
- Eyes focused upward toward the raised hand.
- The official Forge Athletic titanium crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'static-butterfly-stretch',
    artifactFile: 'static_butterfly_stretch_v2_pro.jpg',
    publicFile: 'static-butterfly-stretch.jpg',
    prompt: `Commercial fitness photography of a male athlete performing a Static Butterfly Stretch in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned in the lower-right foreground on a dark workout mat, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed in the background.
- Seated tall on the mat with soles of feet pressed firmly together in front; knees flexed and splayed wide toward the floor in deep adductor stretch.
- Hands are grasping the ankles with forearms/elbows gently guiding the stretch downward.
- Sitting in the tallest position possible with chest driven high and flat neutral spine (zero slouching or kyphotic curve).
- Shoulders depressed, chin packed, eyes looking forward.
- The official Forge Athletic master brand crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'depth-jump',
    artifactFile: 'depth_jump_v2_pro.jpg',
    publicFile: 'depth-jump.jpg',
    prompt: `Commercial fitness photography of a male athlete performing a Depth Jump in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Directly behind the athlete on the dark turf sits a sleek matte black 18-inch plyometric box from which the athlete has just stepped off.
- The athlete is captured landing on the turf in a dynamic athletic quarter-squat amortization posture.
- Feet flat, shoulder-width apart, pointing straight ahead; knees bent at 45 degrees tracking strictly over 2nd and 3rd toes with zero valgus collapse.
- Hips hinged back, proud upright chest, neutral spine; arms cocked back ready to violently drive overhead for an immediate reactive vertical rebound jump.
- Demonstrates textbook Phase 5 Power reactive ground contact amortization.
- The official Forge Athletic titanium shield crest and "FORGE ATHLETIC" block lettering are crisp, illuminated, and completely unobstructed on the wall.`
  }
]

async function run() {
  console.log(`🚀 Starting Batch 14 Generation (5 movements)...`)
  for (let i = 0; i < batch14.length; i++) {
    const item = batch14[i]
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
  console.log(`\n🎉 Batch 14 completed successfully!`)
}

run().catch((err) => {
  console.error('Batch 14 failed:', err)
  process.exit(1)
})
