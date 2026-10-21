import fs from 'node:fs'
import path from 'node:path'
import { generateForgeExercisePhoto } from './generate-forge-photo.mjs'

const ARTIFACT_DIR = '/Users/scottgordon/.gemini/antigravity-ide/brain/83c81a66-8951-4274-90b5-3967350a4d1f'
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

const batch6 = [
  {
    name: 'reverse-lunge-to-balance',
    artifactFile: 'reverse_lunge_to_balance_v2_pro.jpg',
    publicFiles: ['reverse-lunge-to-balance.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Reverse Lunge to Balance in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right side of the 16:9 frame, leaving the dark carbon navy architectural wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Dynamic balance pose: standing tall on grounded single leg with foot flat and ankle stable.
- Trail leg driven up into single-leg balance so the knee is flexed 90 degrees at hip level with dorsiflexed ankle.
- Upright vertical torso with neutral spine and squared pelvis.
- Dynamic running arm drive with arms flexed at 90 degrees (contralateral arm forward, trailing arm back).
- The official Forge Athletic titanium crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'side-plank',
    artifactFile: 'side_plank_v2_pro.jpg',
    publicFiles: ['side-plank.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Side Plank on a mat in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned in the lower-right foreground at a 30-degree angle, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper-left.
- Supporting forearm flat on the black workout mat with elbow stacked directly beneath the shoulder at 90 degrees.
- Hips lifted high forming a rigid, straight diagonal line from ear through shoulder, hip, and stacked feet.
- Top arm resting extended along the lateral thigh.
- Neutral cervical spine with chin packed, core braced, zero hip sag.
- The official Forge Athletic metallic shield crest and "FORGE ATHLETIC" lettering are sharply defined, illuminated, and fully visible on the wall behind.`
  },
  {
    name: 'single-leg-squat',
    artifactFile: 'single_leg_squat_v2_pro.jpg',
    publicFiles: ['single-leg-squat.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Single-Leg Squat (Pistol Squat) in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame, leaving the dark carbon navy architectural wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Balancing stance leg descending to femur-parallel depth with knee tracking directly in line with second toe (zero valgus collapse).
- Non-working leg extended straight forward hovering cleanly above the rubber floor.
- Upright athletic torso with slight natural hip hinge, core tightly braced.
- Arms reaching straight forward at shoulder height for counterbalance.
- The official Forge Athletic brand lockup (faceted titanium crest with golden flame core and cyan waves, metallic "FORGE", and warm gold "ATHLETIC") is prominently mounted and 100% visible on the wall behind.`
  },
  {
    name: 'stability-ball-hamstring-curl',
    artifactFile: 'stability_ball_hamstring_curl_v2_pro.jpg',
    publicFiles: ['stability-ball-hamstring-curl.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Stability Ball Hamstring Curl in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- Athlete on a dark workout mat in the lower-right foreground, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper-left.
- Supine on the mat with upper back and head flat, arms relaxed out at 45 degrees for stability.
- Hips elevated high in full glute bridge extension.
- Heels dug firmly into the top of a dark matte stability ball, curling the ball in tightly toward the glutes with knees at 90 degrees flexion at peak hamstring contraction while maintaining elevated bridge.
- The official Forge Athletic master brand crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'clamshells',
    artifactFile: 'clamshells_v2_pro.jpg',
    publicFiles: ['clamshells.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing Side-Lying Clamshells on a black mat in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- Athlete positioned on a mat in the lower foreground at a 30-degree angle, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper wall.
- Side-lying on mat with hips flexed at 45 degrees and knees flexed at 90 degrees.
- Feet and heels glued together; top knee rotated open into 45 degrees abduction in peak gluteus medius contraction.
- Pelvis stacked strictly vertical with zero posterior rolling or pelvis rotation.
- Head resting comfortably on the lower arm.
- The official Forge Athletic titanium shield crest and "FORGE ATHLETIC" block lettering are crisp, illuminated, and completely unobstructed on the wall.`
  }
]

async function run() {
  const force = process.argv.includes('--force')
  console.log(`🚀 Starting Batch 6 Generation (5 movements)...`)
  for (let i = 0; i < batch6.length; i++) {
    const item = batch6[i]
    const artifactPath = path.join(ARTIFACT_DIR, item.artifactFile)
    const primaryPublicPath = path.join(PUBLIC_DIR, item.publicFiles[0])

    if (!force && fs.existsSync(artifactPath)) {
      console.log(`\n[${i + 1}/5] ⏩ Skipping ${item.name} (already generated: ${item.artifactFile})`)
      continue
    }

    console.log(`\n[${i + 1}/5] Generating ${item.name}...`)
    
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
  console.log(`\n🎉 Batch 6 completed successfully!`)
}

run().catch((err) => {
  console.error('Batch 6 failed:', err)
  process.exit(1)
})
