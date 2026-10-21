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

const batch3 = [
  {
    name: 'bulgarian-split-squat',
    artifactFile: 'bulgarian_split_squat_v2_pro.jpg',
    publicFiles: ['bulgarian-split-squat.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Bulgarian Split Squat in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete and bench are positioned on the right-third of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Rear foot elevated with laces down on a flat workout bench; lead foot planted flat on the floor with front knee tracking directly over the second toe at 90-degree femur-parallel depth.
- Upright vertical torso with neutral spine and core braced.
- Holding heavy matte black hex dumbbells securely at sides with arms straight.
- The official Forge Athletic metallic shield crest and "FORGE ATHLETIC" lettering are sharply defined, illuminated, and fully visible on the wall behind.`
  },
  {
    name: 'pull-up',
    artifactFile: 'strict_pull_up_v2_pro.jpg',
    publicFiles: [
      'pull-up.jpg',
      'band-assisted-pull-up.jpg'
    ],
    prompt: `Commercial fitness photography of a male athlete performing a Strict Pull-Up on a pull-up bar in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The pull-up rig and athlete are positioned on the right side of the 16:9 frame, leaving the dark carbon navy architectural wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Overhand pronated grip on the steel bar, hands slightly wider than shoulder width.
- Peak top contraction position: chin cleanly cleared above the bar, chest lifted proud, elbows driving down toward the lateral ribs.
- Legs straight or softly crossed at ankles with rigid core and zero kipping or swinging.
- The official Forge Athletic titanium crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'dumbbell-lateral-raise',
    artifactFile: 'dumbbell_lateral_raise_v2_pro.jpg',
    publicFiles: ['dumbbell-lateral-raise.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Standing Dumbbell Lateral Raise in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- Athlete standing on the right-third of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Solid athletic hip-width stance with soft knees.
- Dumbbells elevated laterally to shoulder height in the scapular plane (slight 15-degree anterior forward angle) with soft elbow micro-flexion.
- Upper traps depressed, medial deltoids maximally loaded, wrists neutral.
- Rigid vertical torso with zero swinging or momentum.
- The official Forge Athletic brand lockup (faceted titanium crest with golden flame core and cyan waves, metallic "FORGE", and warm gold "ATHLETIC") is prominently mounted and 100% visible on the wall behind.`
  },
  {
    name: 'russian-twist',
    artifactFile: 'russian_twist_v2_pro.jpg',
    publicFiles: ['russian-twist.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Seated Russian Twist on a mat in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- Athlete positioned on a black workout mat in the lower foreground at a slight 30-degree angle, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper wall.
- Seated in a 45-degree reclined V-sit balance with neutral spine; feet elevated hovering slightly off the mat with knees bent.
- Smooth thoracic rotation holding a matte black medicine ball close to the abdomen, rotating toward the foreground side.
- Chest proud, chin packed, obliques and core braced rock solid.
- The official Forge Athletic master brand crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'foam-roll-calves',
    artifactFile: 'foam_roll_calves_v2_pro.jpg',
    publicFiles: ['foam-roll-calves.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing SMR Foam Rolling on Calves on a black mat in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- Athlete positioned on a mat in the lower foreground at a slight 30-degree angle, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper wall.
- Seated on mat with arms supporting upper body weight behind hips, shoulders depressed.
- Dark high-density foam roller positioned directly under the mid-belly of the gastrocnemius/soleus calf complex.
- Opposite foot planted flat on the floor to modulate pressure and roll smoothly along the muscle tissue.
- Tall, neutral spinal posture.
- The official Forge Athletic titanium shield crest and "FORGE ATHLETIC" block lettering are crisp, illuminated, and completely unobstructed on the wall.`
  }
]

async function run() {
  const force = process.argv.includes('--force')
  console.log(`🚀 Starting Batch 3 Generation (5 movements)...`)
  for (let i = 0; i < batch3.length; i++) {
    const item = batch3[i]
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
  console.log(`\n🎉 Batch 3 completed successfully!`)
}

run().catch((err) => {
  console.error('Batch 3 failed:', err)
  process.exit(1)
})
