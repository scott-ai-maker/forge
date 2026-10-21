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

const batch5 = [
  {
    name: 'barbell-bicep-curl',
    artifactFile: 'barbell_bicep_curl_v2_pro.jpg',
    publicFiles: ['barbell-bicep-curl.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Standing Barbell Bicep Curl in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is standing on the right-third of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Hip-width athletic stance with soft knees and neutral pelvis.
- Supinated underhand grip on an Olympic barbell, shoulder-width apart.
- Upper arms and elbows pinned firmly against the lateral ribcage acting as stationary hinges.
- Curling barbell upward to upper chest in peak bicep contraction with rigid core and zero backward lumbar sway.
- The official Forge Athletic metallic shield crest and "FORGE ATHLETIC" lettering are sharply defined, illuminated, and fully visible on the wall behind.`
  },
  {
    name: 'seated-row',
    artifactFile: 'seated_cable_row_v2_pro.jpg',
    publicFiles: ['seated-row.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Seated Cable Row in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The seated cable row station and athlete are positioned on the right side of the 16:9 frame, leaving the dark carbon navy architectural wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Upright 90-degree torso with neutral lumbar spine, feet planted firmly against the footplates with knees softly flexed.
- Holding close-grip V-handle pulled into lower abdomen/navel.
- Elbows driving straight back tight to the torso; scapulae deeply retracted and depressed into the mid-back in peak lat and rhomboid contraction.
- The official Forge Athletic titanium crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'face-pull',
    artifactFile: 'standing_cable_face_pull_v2_pro.jpg',
    publicFiles: ['face-pull.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Standing Cable Face Pull in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The cable column and athlete are positioned on the right side of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Balanced staggered athletic stance with core braced.
- High cable pulley at eye/upper-chest level fitted with a rope attachment.
- Pulling the rope attachment apart toward eye level with elbows flared high and wide (90 degrees abduction).
- Full shoulder external rotation with thumbs pointing back, rear deltoids and rhomboids fully loaded, zero backward torso sway.
- The official Forge Athletic brand lockup (faceted titanium crest with golden flame core and cyan waves, metallic "FORGE", and warm gold "ATHLETIC") is prominently mounted and 100% visible on the wall behind.`
  },
  {
    name: 'dead-bug',
    artifactFile: 'dead_bug_v2_pro.jpg',
    publicFiles: ['dead-bug.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing the Dead Bug core exercise on a mat in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- Athlete positioned on a black workout mat in the lower foreground at a slight 30-degree angle, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper wall.
- Supine on mat with entire lumbar spine glued flat to the floor (posterior pelvic tilt, abdominal drawing-in maneuver).
- Right arm reaching straight overhead parallel to the floor hovering two inches above mat; contralateral left leg extended straight forward hovering two inches off ground.
- Contralateral left arm vertical toward ceiling and right knee bent at 90 degrees tabletop directly over hip.
- Packed chin, neutral neck.
- The official Forge Athletic master brand crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'cable-crossover',
    artifactFile: 'standing_cable_crossover_v2_pro.jpg',
    publicFiles: ['cable-crossover.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Standing Cable Crossover (Chest Fly) in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- Staggered athletic split stance in the center-right of the 16:9 frame with a 15-degree forward torso lean, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Neutral spine and braced core.
- Dual D-handles brought together in front of the sternum in a wide hugging arc.
- Elbows maintain a fixed 15-degree micro-bend throughout the arc without pressing; peak pectoral contraction and squeeze.
- The official Forge Athletic titanium shield crest and "FORGE ATHLETIC" block lettering are crisp, illuminated, and completely unobstructed on the wall.`
  }
]

async function run() {
  const force = process.argv.includes('--force')
  console.log(`🚀 Starting Batch 5 Generation (5 movements)...`)
  for (let i = 0; i < batch5.length; i++) {
    const item = batch5[i]
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
  console.log(`\n🎉 Batch 5 completed successfully!`)
}

run().catch((err) => {
  console.error('Batch 5 failed:', err)
  process.exit(1)
})
