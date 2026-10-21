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

const batch10 = [
  {
    name: 'push-up-plus',
    artifactFile: 'push_up_plus_v2_pro.jpg',
    publicFiles: ['push-up-plus.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Push-Up Plus in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is in the lower-right foreground at a 45-degree angle in a high plank position on a black rubber workout mat, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper-left.
- High push-up plank on mat, arms fully extended with hands directly beneath shoulders, elbows straight without hyperextending.
- Actively demonstrating peak scapular protraction ("the plus"): shoulder blades pushed wide apart across the ribcage, upper back subtly rounded upward to isolate and recruit the serratus anterior muscle.
- Rigid horizontal plank line from the crown of the head through the thoracic spine to the heels; core and glutes engaged.
- Chin tucked with eyes focused straight down at the mat.
- The official Forge Athletic metallic shield crest and "FORGE ATHLETIC" lettering are sharply defined, illuminated, and fully visible on the wall behind.`
  },
  {
    name: 'decline-push-up',
    artifactFile: 'decline_push_up_v2_pro.jpg',
    publicFiles: ['decline-push-up.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Decline Push-Up in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The flat bench and athlete are positioned on the right side of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Feet elevated on a sturdy flat workout bench with toes dug securely into the edge; hands planted on the gym mat slightly wider than shoulder-width directly under the chest.
- Lowered to the bottom turnaround position hovering 2 inches off the mat; elbows tracking back at a clean 45-degree angle (not flared wide).
- Rigid straight diagonal plank line from heels to ears with zero lumbar sagging or piking; abdominal core locked tight.
- Neutral cervical spine with chin packed and focused downward.
- The official Forge Athletic brand lockup (faceted titanium crest with golden flame core and cyan waves, metallic "FORGE", and warm gold "ATHLETIC") is prominently mounted and 100% visible on the wall behind.`
  },
  {
    name: 'incline-push-up',
    artifactFile: 'incline_push_up_v2_pro.jpg',
    publicFiles: ['incline-push-up.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing an Incline Push-Up in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The flat workout bench and athlete are positioned on the right side of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Hands placed shoulder-width apart on the front edge of a sturdy flat bench; feet together planted firmly on the rubber floor behind.
- Lowered to the bottom turnaround position with the lower chest lightly touching the bench edge; elbows tracking back at a clean 45-degree angle.
- Rigid diagonal plank alignment from heels to ears; core braced and glutes squeezed.
- Scapulae smoothly retracted at the bottom; neutral cervical spine with chin packed.
- The official Forge Athletic titanium crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'box-jump-up-with-stabilization',
    artifactFile: 'box_jump_up_with_stabilization_v2_pro.jpg',
    publicFiles: ['box-jump-up-with-stabilization.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Plyometric Box Jump-Up with Stabilization in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The 20-inch plyo box and athlete are positioned on the right-third of the 16:9 frame along the dark turf track, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Captured frozen in the rock-solid 3-second NASM Phase 5 landing stabilization hold on top of a 20-inch wooden/foam plyo box.
- Landed softly with feet shoulder-width apart on midfoot-to-heel in the center of the box.
- Knees flexed into a controlled quarter-to-half squat, tracking straight ahead over the 2nd and 3rd toes (zero valgus collapse).
- Upright chest with neutral spine, hips hinged back, arms reaching forward at chest height for balance.
- Poised, calm, grounded athletic stability demonstrating complete eccentric deceleration.
- The official Forge Athletic master brand crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'foam-roll-adductors',
    artifactFile: 'foam_roll_adductors_v2_pro.jpg',
    publicFiles: ['foam-roll-adductors.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing SMR Foam Roll Adductors (inner thigh) in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned in the lower-right foreground on a workout mat, leaving the dark carbon navy architectural wall and official Forge Athletic brand lockup completely unobstructed on the upper-left.
- Prone on the black rubber mat supported comfortably on forearms in a low-plank foundation.
- Active right leg is abducted laterally at 60-to-90 degrees with knee bent to 90 degrees, resting the inner thigh (adductor complex) directly over a high-density black foam roller oriented parallel to the torso.
- Foam roller positioned midway between groin and medial knee; athlete applying controlled bodyweight compression.
- Pelvis level and parallel to floor, abdominal core braced, neutral spine.
- Calm, focused therapeutic posture.
- The official Forge Athletic titanium shield crest and "FORGE ATHLETIC" block lettering are crisp, illuminated, and completely unobstructed on the wall.`
  }
]

async function run() {
  console.log(`🚀 Starting Batch 10 Generation (5 movements)...`)
  for (let i = 0; i < batch10.length; i++) {
    const item = batch10[i]
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
  console.log(`\n🎉 Batch 10 completed successfully!`)
}

run().catch((err) => {
  console.error('Batch 10 failed:', err)
  process.exit(1)
})
