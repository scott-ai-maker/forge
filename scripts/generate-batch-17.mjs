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

const batch17 = [
  {
    name: '4-point-quadruped-t-drill',
    artifactFile: 'quadruped_t_drill_v2_pro.jpg',
    publicFiles: ['4-point-quadruped-t-drill.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing 4-Point Quadruped T Drill in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned in the lower-right foreground on a dark workout mat over turf, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper-left.
- Tabletop quadruped position on the mat; right arm abducted 90° laterally in a pure 'T' reach at shoulder height with thumb angled upward towards ceiling.
- Contralateral left leg is extended straight back at hip height forming a dynamic balance line; foot dorsiflexed.
- Supporting left hand is planted directly beneath the shoulder with straight arm and serratus activation.
- Lumbo-pelvic-hip complex is rigidly locked level and flat like a tabletop with zero rotational pelvic tilt or lumbar hyperextension.
- Neutral cervical spine with gaze directed down at the mat, chin tucked.
- The official Forge Athletic metallic shield crest and "FORGE ATHLETIC" lettering are sharply defined and fully visible on the wall behind.`
  },
  {
    name: 'single-leg-hop-stabilization-level-1',
    artifactFile: 'sl_hop_stabilization_level_1_v2_pro.jpg',
    publicFiles: ['single-leg-hop-stabilization-level-1.jpg', 'single-leg-hop-stabilization.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing Single-Leg Hop Stabilization Level 1 in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame along the dark turf agility track, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Captured frozen in a single-leg forward landing absorption hold on the stance leg.
- Stance knee is flexed at a controlled 35° athletic shock-absorption angle, tracking strictly over 2nd and 3rd toes with zero dynamic valgus collapse.
- Non-working leg is held suspended in 90° hip and knee flexion runner balance pose; foot dorsiflexed.
- Square, level hips with athletic slight forward torso lean and neutral spine.
- Arms are positioned in an athletic runner counter-balance freeze.
- Held in strict 3-to-5 second stabilization freeze demonstrating NASM Phase 1 Stabilization Endurance unilateral deceleration.
- The official Forge Athletic titanium crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'push-up-to-3-point-stance',
    artifactFile: 'push_up_to_3_point_stance_v2_pro.jpg',
    publicFiles: ['push-up-to-3-point-stance.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing Push-Up to 3-Point Stance in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned in the lower-right foreground on a dark workout mat, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed in the background.
- Captured at the top lockout position of a push-up in a rigid 3-point tripod stance.
- Hands planted shoulder-width directly under the shoulders on the mat with active scapular protraction and core engagement.
- Grounded foot planted firmly on the ball of the toes in clean black training sneakers.
- Contralateral elevated leg is held horizontally straight back at hip height with glute contracted.
- Pelvis and shoulders remain rigidly horizontal and parallel to the floor, demonstrating supreme anti-rotational core stability with zero hip sagging or pelvic twisting.
- Chin tucked with neutral cervical spine, eyes focused on the mat.
- The official Forge Athletic brand lockup (faceted titanium crest with golden flame core and cyan waves, metallic "FORGE", and warm gold "ATHLETIC") is prominently mounted and 100% visible on the wall behind.`
  },
  {
    name: 'single-leg-romanian-deadlift-to-pnf-pattern',
    artifactFile: 'sl_rdl_to_pnf_pattern_v2_pro.jpg',
    publicFiles: ['single-leg-romanian-deadlift-to-pnf-pattern-1.jpg', 'single-leg-romanian-deadlift-to-pnf-pattern.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing Single-Leg Romanian Deadlift to PNF Pattern in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame along the dark turf track, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Captured at the top standing single-leg balance finish of the movement.
- Stance leg has a soft knee with slight athletic bend tracking over the second toe.
- Lead non-working knee is driven up to hip height at 90° flexion with ankle dorsiflexed.
- A single sleek matte black dumbbell in the contralateral hand is swept smoothly along a diagonal D2 PNF pattern upward across the torso to shoulder/ear height with external rotation (thumb pointing back).
- Contralateral hand is flat across the hip for stabilization.
- Upright tall posture, level hips, and braced core with forward gaze.
- The official Forge Athletic master brand crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'transverse-box-jump-down-to-tuck-jump',
    artifactFile: 'transverse_box_jump_down_tuck_jump_v2_pro.jpg',
    publicFiles: ['transverse-box-jump-down-to-tuck-jump.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing Transverse Box Jump Down to Tuck Jump in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Directly behind the athlete on the dark turf sits a low matte black 12-to-18-inch plyometric box from which the athlete has just stepped off with a 90° rotational turn.
- The athlete is captured suspended mid-air at peak vertical height in an explosive tuck jump rebound.
- Both knees are tucked tight to chest with shins parallel to the ground; hands reaching forward contacting the shins.
- Proud chest, upright vertical torso, forward gaze along the linear track.
- Demonstrates textbook Phase 5 Power transverse rotational plyometric deceleration and immediate elastic vertical rebound.
- The official Forge Athletic titanium shield crest and "FORGE ATHLETIC" block lettering are crisp, illuminated, and completely unobstructed on the wall.`
  }
]

async function run() {
  console.log(`🚀 Starting Batch 17 Generation (5 movements)...`)
  for (let i = 0; i < batch17.length; i++) {
    const item = batch17[i]
    console.log(`\n[${i + 1}/5] Generating ${item.name}...`)
    const artifactPath = path.join(ARTIFACT_DIR, item.artifactFile)
    const primaryPublicPath = path.join(PUBLIC_DIR, item.publicFiles[0])
    
    await generateForgeExercisePhoto({
      prompt: item.prompt,
      artifactPath,
      publicPath: primaryPublicPath
    })

    // If there are secondary files, copy primary to secondary
    for (let j = 1; j < item.publicFiles.length; j++) {
      const secondaryPath = path.join(PUBLIC_DIR, item.publicFiles[j])
      fs.copyFileSync(primaryPublicPath, secondaryPath)
      console.log(`  📋 Copied to secondary: ${secondaryPath}`)
    }

    console.log(`✅ [${i + 1}/5] Finished ${item.name}`)
  }
  console.log(`\n🎉 Batch 17 completed successfully!`)
}

run().catch((err) => {
  console.error('Batch 17 failed:', err)
  process.exit(1)
})
