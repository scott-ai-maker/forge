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

const batch11 = [
  {
    name: 'incline-barbell-bench-press',
    artifactFile: 'incline_barbell_bench_press_v2_pro.jpg',
    publicFiles: ['incline-barbell-bench-press.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing an Olympic Incline Barbell Bench Press in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete and 30-degree incline Olympic bench are positioned on the right side of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Supine on the 30-degree incline bench with feet planted flat and firmly on the rubber gym floor.
- Scapulae firmly retracted and depressed into the padded backrest with a natural athletic arch in the lumbar spine.
- Athlete is holding the Olympic barbell at the chest turnaround point or mid-press, lowered smoothly toward the upper chest (clavicle / upper sternum).
- Forearms strictly vertical under the bar, wrists neutral and straight, thumbs wrapped securely around the knurled steel bar.
- Head resting back against the headrest in neutral cervical spine.
- The official Forge Athletic metallic shield crest and "FORGE ATHLETIC" lettering are sharply defined and fully visible on the wall behind.`
  },
  {
    name: 'close-grip-bench-press',
    artifactFile: 'close_grip_bench_press_v2_pro.jpg',
    publicFiles: ['close-grip-bench-press.jpg', 'close-grip-barbell-bench-press.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Close-Grip Barbell Bench Press in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete on the flat Olympic bench is positioned in the lower-right foreground of the 16:9 frame at a 45-degree three-quarter perspective, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the upper-left.
- Athlete is supine on the flat bench with feet firmly planted flat on the floor.
- Grasping the Olympic barbell with an overhand grip narrower-than-shoulder-width (~12 inches apart with clear space between hands; clean non-impinging width).
- Arms extended pressing the bar straight up directly over the chest and shoulders at lockout.
- Elbows kept neatly tucked toward the torso (~30 degrees abduction) showing pure triceps engagement without excessive flare.
- Scapulae retracted into the bench pad, chest open, neutral cervical spine with head flat on pad.
- The official Forge Athletic brand lockup (faceted titanium crest with golden flame core and cyan waves, metallic "FORGE", and warm gold "ATHLETIC") is prominently mounted and 100% visible on the wall behind.`
  },
  {
    name: 'dumbbell-preacher-curl',
    artifactFile: 'dumbbell_preacher_curl_v2_pro.jpg',
    publicFiles: ['dumbbell-preacher-curl.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Dumbbell Preacher Curl in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is seated at a commercial preacher curl station positioned on the right side of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Seated tall with chest snug against the top edge of the 45-degree angled preacher pad, feet flat on the floor.
- Back of right upper arm and triceps resting fully flush and immobilized against the angled pad eliminating body momentum.
- Right arm is curling a sleek urethane dumbbell into full supination (palm facing shoulder) at peak bicep contraction (90-to-100 degrees elbow flexion).
- Wrist is locked completely straight and neutral (zero wrist flexion/curling).
- Contralateral left hand resting lightly on the bench frame for balance.
- Focused expression, proud posture, and isolated peak bicep contraction.
- The official Forge Athletic titanium crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'leg-press-calf-raise',
    artifactFile: 'leg_press_calf_raise_v2_pro.jpg',
    publicFiles: ['leg-press-calf-raise.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Leg Press Calf Raise in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The commercial 45-degree sled leg press is positioned in the lower-right foreground, leaving the dark carbon navy architectural wall and official Forge Athletic brand lockup completely unobstructed on the upper-left.
- Athlete is seated securely in the 45-degree leg press with back and pelvis flat against the padded backrest, hands gripping side safety handles.
- Balls of both feet are placed firmly along the bottom edge of the sled footplate, with heels extending off into space.
- Knees extended with a safe, soft 5-degree micro-bend (never locked or hyperextended).
- Ankle joints driven into maximal plantarflexion (pushing through the balls of the feet onto the toes) showcasing textbook gastrocnemius and soleus contraction.
- The official Forge Athletic master brand crest and block lettering "FORGE ATHLETIC" are illuminated and 100% visible on the wall behind.`
  },
  {
    name: 'static-upper-trapezius-stretch',
    artifactFile: 'static_upper_trapezius_stretch_v2_pro.jpg',
    publicFiles: ['static-upper-trapezius-stretch.jpg'],
    prompt: `Commercial fitness photography of a male athlete performing a Seated Static Upper Trapezius and Neck Lateral Flexion Stretch in an ultra-premium gym.

${BRAND_LOCKUP_PROMPT}

${WARDROBE_PROMPT}

POSITIONING & BIOMECHANICAL FORM:
- The athlete is seated on a flat workout bench positioned on the right-third of the 16:9 frame, leaving the dark carbon navy wall and official Forge Athletic brand lockup completely unobstructed on the left.
- Seated tall with textbook upright posture, shoulders depressed away from the ears, chest proud, neutral lumbar spine.
- Right hand firmly grips the underside of the flat bench seat to anchor and actively depress the right shoulder and clavicle.
- Head is gently laterally flexed toward the left shoulder (ear toward left shoulder), feeling a smooth, therapeutic stretch across the right upper trapezius and neck.
- Left hand rests gently on the crown of the head providing light, controlled guidance (no aggressive pulling).
- Face relaxed and calm, displaying professional corrective flexibility form.
- The official Forge Athletic titanium shield crest and "FORGE ATHLETIC" block lettering are crisp, illuminated, and completely unobstructed on the wall.`
  }
]

async function run() {
  console.log(`🚀 Starting Batch 11 Generation (5 movements)...`)
  for (let i = 0; i < batch11.length; i++) {
    const item = batch11[i]
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
  console.log(`\n🎉 Batch 11 completed successfully!`)
}

run().catch((err) => {
  console.error('Batch 11 failed:', err)
  process.exit(1)
})
