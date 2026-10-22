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

const batch16 = [
  {
    name: 'repeat-hurdle-jumps',
    artifactFile: 'repeat_hurdle_jumps_v2_pro.jpg',
    publicFile: 'repeat-hurdle-jumps.jpg',
    prompt: `Commercial fitness photography of a male athlete performing Repeat Hurdle Jumps in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame along the dark turf track, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Suspended mid-air at peak clearance altitude over an 8-to-10-inch neon cyan and black agility mini-hurdle along the track.
- Both knees are driven upward toward chest height; feet parallel and shoulder-width apart pointing straight ahead.
- Arms driving forward and upward in athletic synchronization.
- Upright torso, proud chest, neutral spine, forward visual focus along the track.
- Demonstrates explosive linear plyometric agility and rapid stretch-shortening cycle rebound.
- The official Forge Athletic metallic shield crest and "FORGE ATHLETIC" lettering are sharply defined and fully visible on the wall behind.`
  },
  {
    name: 'push-up-with-staggered-hands',
    artifactFile: 'push_up_with_staggered_hands_v2_pro.jpg',
    publicFile: 'push-up-with-staggered-hands.jpg',
    prompt: `Commercial fitness photography of a male athlete performing Push-Up with Staggered Hands in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned in the lower-right foreground on a dark workout mat, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper-left.
- High push-up plank position with an obvious, visually distinct 10-to-12-inch asymmetrical stagger of the hands on the mat.
- Lead right hand is placed forward well ahead of the shoulder line toward the front corner of the mat; trailing left hand is placed back directly beside the mid-chest/ribs.
- Shoulders and pelvis remain rigidly level and parallel to the floor with zero rotational tilt or hip sagging, displaying exceptional anti-rotational core stability.
- Solid unbroken horizontal plank line from heels through glutes and braced core to crown of head.
- Chin packed with eyes focused down at the mat.
- The official Forge Athletic brand lockup (faceted titanium crest with golden flame core and cyan waves, metallic "FORGE", and warm gold "ATHLETIC") is prominently mounted and 100% visible on the wall behind.`
  },
  {
    name: 'active-standing-hip-flexor',
    artifactFile: 'active_standing_hip_flexor_v2_pro.jpg',
    publicFile: 'active-standing-hip-flexor.jpg',
    prompt: `Commercial fitness photography of a male athlete performing an Active Standing Hip Flexor Stretch in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Athletic split stance on the floor; front lead foot flat with soft knee bent at approximately 45 degrees.
- Rear leg extended straight behind with ball of foot grounded in black training shoe; trailing glute is actively contracted in posterior pelvic tilt to reciprocally inhibit and open the hip flexor complex.
- Ipsilateral rear arm reaching straight overhead toward ceiling with a subtle lateral reach, lengthening the fascial line through the psoas.
- Contralateral hand resting lightly on the hip or lead thigh.
- Proud tall chest, upright spine, neutral neck looking forward.
- The official Forge Athletic titanium crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'single-leg-scaption',
    artifactFile: 'single_leg_scaption_v2_pro.jpg',
    publicFile: 'single-leg-scaption.jpg',
    prompt: `Commercial fitness photography of a male athlete performing Single-Leg Scaption in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame along the turf track, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Standing in a disciplined single-leg balance hold on the stance leg; stance knee soft with slight athletic bend tracking over second toe.
- Non-working leg is flexed at 90 degrees at hip and knee, hovering cleanly beside the stance leg.
- Holding two sleek matte black dumbbells raised to shoulder height at a 45-degree angle forward of the torso in the true scapular plane (scaption).
- Thumbs are pointing straight up toward ceiling in external shoulder rotation; scapulae retracted and depressed.
- Level hips, tall proud posture, locked core with eyes looking forward.
- The official Forge Athletic master brand crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'half-kneeling-tubing-rotation',
    artifactFile: 'half_kneeling_tubing_rotation_v2_pro.jpg',
    publicFile: 'half-kneeling-tubing-rotation.jpg',
    prompt: `Commercial fitness photography of a male athlete performing Half Kneeling Tubing Rotation in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned in the lower-right foreground on a dark workout mat, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper-left.
- Disciplined half-kneeling 90/90 stance; trailing knee directly under hip on the mat with trailing glute contracted in posterior pelvic tilt; front lead foot flat with knee stacked over ankle.
- Holding resistance tubing handles with both hands extended forward at chest height with soft elbows.
- Torso rotated smoothly across over the front lead leg demonstrating pure thoracic rotation while hips and pelvis remain rigidly locked square forward without swaying.
- Proud chest, upright vertical spine, neutral cervical spine with chin tucked.
- The official Forge Athletic brand lockup (faceted titanium crest with golden flame core and cyan waves, metallic "FORGE", and warm gold "ATHLETIC") is prominently mounted and 100% visible on the wall behind.`
  }
]

async function run() {
  console.log(`🚀 Starting Batch 16 Generation (5 movements)...`)
  for (let i = 0; i < batch16.length; i++) {
    const item = batch16[i]
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
  console.log(`\n🎉 Batch 16 completed successfully!`)
}

run().catch((err) => {
  console.error('Batch 16 failed:', err)
  process.exit(1)
})
