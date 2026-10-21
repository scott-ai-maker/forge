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

const batch7 = [
  {
    name: 'barbell-hip-thrust',
    artifactFile: 'barbell_hip_thrust_v2_pro.jpg',
    publicFiles: ['barbell-hip-thrust.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing an Olympic Barbell Hip Thrust in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete and padded hip thrust bench are positioned on the right side of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper-left.
- Upper back anchored firmly across a low padded workout bench at the inferior scapular border.
- Bilateral feet flat on the dark rubber floor with vertical shins forming a clean 90-degree knee angle at peak lockout.
- Barbell with a thick protective foam pad centered securely over the anterior hip crease, hands securing the bar.
- Full hip extension driven by maximum gluteus maximus contraction with a posterior pelvic tilt; flat abdomen with ribs pulled down.
- Chin tucked with gaze directed forward across the knees, avoiding lumbar or cervical hyperextension.
- The official Forge Athletic metallic shield crest and "FORGE ATHLETIC" lettering are sharply defined, illuminated, and fully visible on the wall behind.`
  },
  {
    name: 'lat-pulldown',
    artifactFile: 'lat_pulldown_v2_pro.jpg',
    publicFiles: ['lat-pulldown.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Wide-Grip Cable Lat Pulldown in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The lat pulldown cable station and athlete are positioned on the right side of the 16:9 frame, leaving the dark carbon navy architectural wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Seated tall on the station bench with thighs secured snug under padded leg rollers, feet flat on the floor.
- Wide overhand pronated grip on the ergonomic pulldown bar.
- Subtle 10-to-15-degree thoracic extension with neutral lumbar spine.
- The bar is pulled smoothly down to upper clavicle / chest level, elbows driving straight down and back toward the lateral ribcage in peak latissimus dorsi and rhomboid retraction.
- Scapulae firmly depressed and retracted; proud chest.
- The official Forge Athletic titanium crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'triceps-pushdown',
    artifactFile: 'triceps_pushdown_v2_pro.jpg',
    publicFiles: ['triceps-pushdown.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Standing Cable Triceps Rope Pushdown in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The cable column and athlete are positioned on the right side of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Athletic hip-width stance with a slight 10-to-15-degree forward torso hinge, knees softly unlocked, neutral spine.
- High cable pulley fitted with a heavy-duty braided rope attachment.
- Upper arms and elbows pinned firmly against the lateral ribcage acting as stationary hinges.
- Forearms extending fully downward to complete elbow lockout, wrists neutral with hands flaring slightly outward at peak triceps contraction.
- Shoulders depressed away from the ears, core braced.
- The official Forge Athletic brand lockup (faceted titanium crest with golden flame core and cyan waves, metallic "FORGE", and warm gold "ATHLETIC") is prominently mounted and 100% visible on the wall behind.`
  },
  {
    name: 'single-leg-romanian-deadlift',
    artifactFile: 'single_leg_romanian_deadlift_v2_pro.jpg',
    publicFiles: ['single-leg-romanian-deadlift.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Single-Leg Romanian Deadlift (SL RDL) in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on the right-third of the 16:9 frame along the dark turf track, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Standing on a single leg with grounded tripod foot and soft 15-to-20-degree knee bend; shin maintains vertical alignment.
- Trailing non-stance leg extends straight back in line with the torso, forming a clean horizontal T-shape parallel to the floor.
- Hips and pelvis completely square to the floor (zero outward hip rotation or flare); neutral spine from sacrum to cervical crown.
- Holding matte black hex dumbbells tracking vertically along the anterior shin with lats actively engaged.
- Peak hamstring and glute eccentric loading on the stance leg.
- The official Forge Athletic master brand crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'floor-prone-cobra',
    artifactFile: 'floor_prone_cobra_v2_pro.jpg',
    publicFiles: ['floor-prone-cobra.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Floor Prone Cobra on a black mat in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is positioned on a dark mat in the lower foreground at a slight 30-degree angle, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper wall.
- Lying prone on the mat with legs extended straight, toes resting lightly on the mat, glutes and core lightly contracted.
- Chest elevated 3 to 4 inches off the mat via lower/mid-trapezius and rhomboid activation.
- Arms extended straight back alongside hips, palms rotated outward with thumbs pointing directly toward the ceiling in full shoulder external rotation.
- Chin tucked, maintaining a long neutral cervical spine with eyes cast directly at the mat (no neck hyperextension).
- The official Forge Athletic titanium shield crest and "FORGE ATHLETIC" block lettering are crisp, illuminated, and completely unobstructed on the wall.`
  }
]

async function run() {
  const force = process.argv.includes('--force')
  console.log(`🚀 Starting Batch 7 Generation (5 movements)...`)
  for (let i = 0; i < batch7.length; i++) {
    const item = batch7[i]
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
  console.log(`\n🎉 Batch 7 completed successfully!`)
}

run().catch((err) => {
  console.error('Batch 7 failed:', err)
  process.exit(1)
})
