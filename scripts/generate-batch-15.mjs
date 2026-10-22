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

const batch15 = [
  {
    name: 'repeat-squat-jumps',
    artifactFile: 'repeat_squat_jumps_v2_pro.jpg',
    publicFile: 'repeat-squat-jumps.jpg',
    prompt: `Commercial fitness photography of a male athlete performing Repeat Squat Jumps in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame along the dark turf track, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Suspended mid-air at peak flight altitude in full athletic triple extension (hips, knees, and ankles fully extended).
- Feet shoulder-width apart pointing straight ahead with ankles plantarflexed.
- Arms swung forcefully overhead toward the ceiling in synchronized propulsion.
- Proud high chest, braced core, neutral cervical spine with forward visual focus.
- Demonstrates textbook Phase 5 Power reactive continuous stretch-shortening cycle vertical jumping.
- The official Forge Athletic metallic shield crest and "FORGE ATHLETIC" lettering are sharply defined and fully visible on the wall behind.`
  },
  {
    name: 'archer-push-up',
    artifactFile: 'archer_push_up_v2_pro.jpg',
    publicFile: 'archer-push-up.jpg',
    prompt: `Commercial fitness photography of a male athlete performing an Archer Push-Up in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned in the lower-right foreground on a dark workout mat, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper-left.
- Captured at the bottom turnaround of a wide-stance archer push-up.
- Right arm is deeply flexed to 90 degrees with hand directly beneath the chest and elbow tracking at 45 degrees, bearing the primary unilateral pressing load.
- Left arm is extended completely straight out laterally with palm flat on the mat.
- Shoulders and pelvis remain rigidly level and parallel to the floor with zero rotational tilting or hip sagging.
- Solid unbroken horizontal plank line from heels through contracted glutes and braced core to crown of head; chin packed.
- The official Forge Athletic brand lockup (faceted titanium crest with golden flame core and cyan waves, metallic "FORGE", and warm gold "ATHLETIC") is prominently mounted and 100% visible on the wall behind.`
  },
  {
    name: 'forward-and-back-band-walking',
    artifactFile: 'forward_and_back_band_walking_v2_pro.jpg',
    publicFile: 'forward-and-back-band-walking.jpg',
    prompt: `Commercial fitness photography of a male athlete performing Forward and Back Band Walking (Monster Walks) in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame along the dark turf agility track, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Athletic quarter-squat posture with knees bent at approximately 45 degrees and hips hinged back.
- A neon cyan resistance mini-band is looped taut around the lower thighs just above the knees.
- Stepping forward along the track while keeping continuous lateral abduction tension on the band; knees tracking strictly in line with 2nd and 3rd toes with zero valgus collapse.
- Upright proud chest, hands held together in front of chest in athletic ready position, eyes looking forward.
- The official Forge Athletic titanium crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'kettlebell-overhead-press',
    artifactFile: 'kettlebell_overhead_press_v2_pro.jpg',
    publicFile: 'kettlebell-overhead-press.jpg',
    prompt: `Commercial fitness photography of a male athlete performing a Kettlebell Overhead Press in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Tall standing athletic posture with feet shoulder-width apart pointing straight ahead.
- Right arm is pressing a sleek matte black kettlebell into full vertical overhead lockout directly aligned over the shoulder joint.
- The kettlebell body rests against the back of the forearm with a solid neutral straight wrist; shoulder packed and locked into socket.
- Left arm held at the side with a clenched athletic fist maintaining full-body tension.
- Core and glutes rigidly braced with zero lumbar hyperextension; proud chest, chin packed.
- The official Forge Athletic master brand crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'plank-with-knees-down',
    artifactFile: 'plank_with_knees_down_v2_pro.jpg',
    publicFile: 'plank-with-knees-down.jpg',
    prompt: `Commercial fitness photography of a male athlete performing a Plank with Knees Down (Modified Forearm Plank) in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned in the lower-right foreground on a dark workout mat, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed in the background.
- Disciplined prone modified forearm plank on the mat.
- Forearms flat and parallel on the mat with elbows stacked directly beneath the shoulders; palms down.
- Knees resting hip-width apart on the mat; feet relaxed behind.
- Core and glutes actively engaged with navel drawn in, forming an unbroken straight diagonal line from knees through hips and spine to crown of head (zero lumbar sagging or hip piking).
- Scapulae stable and protracted, chin packed with eyes focused between the forearms.
- The official Forge Athletic brand lockup (faceted titanium crest with golden flame core and cyan waves, metallic "FORGE", and warm gold "ATHLETIC") is prominently mounted and 100% visible on the wall behind.`
  }
]

async function run() {
  console.log(`🚀 Starting Batch 15 Generation (5 movements)...`)
  for (let i = 0; i < batch15.length; i++) {
    const item = batch15[i]
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
  console.log(`\n🎉 Batch 15 completed successfully!`)
}

run().catch((err) => {
  console.error('Batch 15 failed:', err)
  process.exit(1)
})
