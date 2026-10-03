#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUTPUT_DIR = path.resolve(ROOT, 'public/images/exercises')
const BRAND_CREST_PATH = path.resolve(ROOT, 'public/images/gaa-brand-crest.jpg')

function loadEnv() {
  const envPath = path.resolve(ROOT, '.env.local')
  if (!fs.existsSync(envPath)) return {}
  const content = fs.readFileSync(envPath, 'utf8')
  const env = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx !== -1) {
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim()
    }
  }
  return env
}

const env = loadEnv()
const API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY

function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    dryRun: false,
    force: false,
    batch: 10,
    offset: 0,
    only: null,
    model: 'nano-banana-pro-preview',
    phase: null,
    wave: 1,
    exportManifest: false,
    branding: false,
    brandExisting: false,
  }

  for (const arg of args) {
    if (arg === '--dry-run') options.dryRun = true
    else if (arg === '--force') options.force = true
    else if (arg === '--export-manifest') options.exportManifest = true
    else if (arg === '--branding' || arg === '--watermark') options.branding = true
    else if (arg === '--no-branding') options.branding = false
    else if (arg === '--brand-existing') options.brandExisting = true
    else if (arg.startsWith('--wave=')) options.wave = parseInt(arg.split('=')[1], 10) || 1
    else if (arg.startsWith('--batch=')) options.batch = parseInt(arg.split('=')[1], 10) || 10
    else if (arg.startsWith('--offset=')) options.offset = parseInt(arg.split('=')[1], 10) || 0
    else if (arg.startsWith('--only=')) options.only = arg.split('=')[1].split(',').map(s => s.trim().toLowerCase())
    else if (arg.startsWith('--model=')) options.model = arg.split('=')[1].trim()
    else if (arg.startsWith('--phase=')) options.phase = arg.split('=')[1].trim()
    else if (arg === '--help' || arg === '-h') {
      console.log(`
GAA Official NASM Edge Exercise Image Generator
Powered by Gemini Pro Banana & Restored GAA Brand Archetype

Options:
  --wave=<n>          Curated wave of exercises (default: 1 for top 10 foundational compound movements)
  --dry-run           Print prompts without calling Gemini API
  --batch=<n>         Number of images to generate when not using curated wave
  --offset=<n>        Start at index N in NASM catalog
  --only=<names>      Comma-separated list of exercise names or slugs to target
  --force             Overwrite existing image files in public/images/exercises/
  --model=<name>      Gemini image model (default: nano-banana-pro-preview, fallback: gemini-3-pro-image)
  --export-manifest   Generate public/images/exercises/manifest.json of existing images
  --branding          Overlay circular GAA brand crest badge (optional)
  --help              Show this help text
      `)
      process.exit(0)
    }
  }

  return options
}

/**
 * Applies crisp luxury circular GAA brand crest badge watermark
 */
export async function applyGaaBrandingWatermark(inputBufferOrPath, outputPath) {
  if (!fs.existsSync(BRAND_CREST_PATH)) {
    if (typeof inputBufferOrPath === 'string') {
      if (inputBufferOrPath !== outputPath) fs.copyFileSync(inputBufferOrPath, outputPath)
    } else {
      fs.writeFileSync(outputPath, inputBufferOrPath)
    }
    return
  }

  const baseSharp = sharp(inputBufferOrPath)
  const meta = await baseSharp.metadata()
  const imgWidth = meta.width || 1024
  const imgHeight = meta.height || 1024

  // Scale badge proportionally (e.g. ~9.5% of width, between 74px and 108px)
  const badgeSize = Math.round(Math.min(108, Math.max(74, imgWidth * 0.095)))
  const radius = badgeSize / 2
  const padding = Math.round(imgWidth * 0.028) // ~28px margin

  // Precise circular cutout and liquid gold border
  const circleMask = Buffer.from(`
    <svg width="${badgeSize}" height="${badgeSize}">
      <circle cx="${radius}" cy="${radius}" r="${radius - 1}" fill="#fff" />
    </svg>
  `)

  const goldRing = Buffer.from(`
    <svg width="${badgeSize}" height="${badgeSize}">
      <circle cx="${radius}" cy="${radius}" r="${radius - 2}" fill="none" stroke="#D4AF37" stroke-width="2.5" opacity="0.9" />
    </svg>
  `)

  const badge = await sharp(BRAND_CREST_PATH)
    .resize(badgeSize, badgeSize, { fit: 'cover' })
    .composite([
      { input: circleMask, blend: 'dest-in' },
      { input: goldRing, blend: 'over' },
    ])
    .png()
    .toBuffer()

  const left = imgWidth - badgeSize - padding
  const top = padding

  const finalBuffer = await baseSharp
    .composite([
      { input: badge, top, left, blend: 'over' },
    ])
    .jpeg({ quality: 92 })
    .toBuffer()

  fs.writeFileSync(outputPath, finalBuffer)
}

/**
 * Standardizes filename slug from exercise name
 */
export function exerciseToFilename(name) {
  const clean = name.replace(/^How To\s+/i, '').trim()
  return (
    clean
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '.jpg'
  )
}

/**
 * Robust equipment detector that inspects exercise name, description, and provided catalog equipment
 */
export function detectEquipment(exerciseName, description, provided) {
  const nameLower = exerciseName.toLowerCase()
  const cleanDesc = (description || '')
    .toLowerCase()
    .replace(/it band/g, '')
    .replace(/iliotibial band/g, '')
    .replace(/step\s*\d+:?/g, '') // remove "Step 1:", "Step 2:" from triggering box step

  const text = `${nameLower} ${cleanDesc}`
  if (nameLower === 'squat to row') {
    return ['Cable Pulley Station']
  }
  const detected = new Set()

  if (provided && Array.isArray(provided)) {
    for (const p of provided) {
      if (!p || p.toLowerCase() === 'none') continue
      const lowerP = p.toLowerCase()
      if (lowerP.includes('medicine ball') || lowerP.includes('med ball')) detected.add('Matte Black Medicine Ball')
      else if (lowerP.includes('foam roll')) detected.add('High-Density Foam Roller')
      else if (lowerP.includes('dumbbell')) detected.add('Matte Black Dumbbells')
      else if (lowerP.includes('barbell')) detected.add('Knurled Olympic Barbell')
      else if (lowerP.includes('kettlebell')) detected.add('Cast Iron Kettlebell')
      else if (lowerP.includes('ball')) detected.add('Stability Ball')
      else if (lowerP.includes('box') || lowerP.includes('step') || lowerP.includes('platform')) detected.add('Plyometric Box')
      else if (lowerP.includes('bench')) {
        if (text.includes('preacher')) detected.add('Preacher Curl Bench')
        else if (text.includes('incline')) detected.add('Incline Leather Bench')
        else detected.add('Flat Leather Bench')
      }
      else if (lowerP.includes('pull-up') || lowerP.includes('pull up') || lowerP.includes('chin-up')) detected.add('Steel Pull-Up Bar')
      else if (lowerP.includes('row machine') || lowerP.includes('seated row') || lowerP.includes('seated cable row')) detected.add('Matte Black Seated Cable Row Machine')
      else if (lowerP.includes('leg press')) detected.add('Matte Black Leg Press Machine')
      else if (lowerP.includes('leg curl')) detected.add('Matte Black Leg Curl Machine')
      else if (lowerP.includes('leg extension')) detected.add('Matte Black Leg Extension Machine')
      else if (lowerP.includes('lat pulldown')) detected.add('Matte Black Lat Pulldown Machine')
      else if (lowerP.includes('chest press')) detected.add('Matte Black Chest Press Machine')
      else if (lowerP.includes('face pull')) detected.add('Cable Pulley Station')
      else if (lowerP.includes('cable')) detected.add('Cable Pulley Station')
      else if (lowerP.includes('band') || lowerP.includes('tube')) detected.add('Heavy Resistance Band')
      else if (lowerP.includes('plates') || lowerP.includes('collars')) {
        // Subsumed with Olympic barbell
      }
      else detected.add(p)
    }
  }

  // Stability ball
  if (/\b(stability ball|swiss ball|exercise ball|yoga ball|ball crunch|ball cobra|ball combo|ball prone|core ball|ball stretch|ball bridge)\b/.test(text) && !/\b(medicine ball|med ball)\b/.test(text)) {
    detected.add('Stability Ball')
  }

  // Medicine ball
  if (/\b(medicine ball|med ball|slam ball|throw and catch|\bmb\b)\b/.test(text)) {
    detected.add('Matte Black Medicine Ball')
  }

  // Dumbbells
  if (/\b(dumbbell|dumbbells|db|dual dumbbell)\b/.test(text)) {
    detected.add('Matte Black Dumbbells')
  }

  // Barbell
  if (/\b(barbell|olympic bar|trap bar|hex bar|knurled barbell)\b/.test(text)) {
    detected.add('Knurled Olympic Barbell')
  }

  // Kettlebell
  if (/\b(kettlebell|kettlebells|kb)\b/.test(text)) {
    detected.add('Cast Iron Kettlebell')
  }

  // Foam Roller
  if (/\b(foam roll|foam roller|smr|roller)\b/.test(text)) {
    detected.add('High-Density Foam Roller')
  }

  // Seated Row / Cable Row Machine
  if (/\b(seated row|row machine|cable row|machine row|seated machine row)\b/.test(text)) {
    detected.add('Matte Black Seated Cable Row Machine')
  }

  // Leg Press Machine
  if (/\b(leg press|leg press machine)\b/.test(text)) {
    detected.add('Matte Black Leg Press Machine')
  }

  // Leg Curl Machine
  if (/\b(leg curl|lying leg curl|seated leg curl)\b/.test(text)) {
    detected.add('Matte Black Leg Curl Machine')
  }

  // Leg Extension Machine
  if (/\b(leg extension|leg extension machine)\b/.test(text)) {
    detected.add('Matte Black Leg Extension Machine')
  }

  // Chest Press Machine
  if (/\b(chest press machine)\b/.test(text)) {
    detected.add('Matte Black Chest Press Machine')
  }

  // Lat Pulldown
  if (/\b(lat pulldown)\b/.test(text)) {
    detected.add('Matte Black Lat Pulldown Machine')
  }

  // Cable Machine
  if (/\b(cable|pulley|cable crossover|rope extension)\b/.test(text) && !detected.has('Matte Black Seated Cable Row Machine') && !detected.has('Matte Black Lat Pulldown Machine')) {
    detected.add('Cable Pulley Station')
  }

  // Box (not just the word step from prose)
  if (/\b(box jump|depth jump|platform|plyo box|plyometric box|step up|step-up|onto box|jumping onto box)\b/.test(text)) {
    detected.add('Plyometric Box')
  }

  // Flat, Incline, or Preacher Bench
  if (/\b(preacher bench|preacher curl)\b/.test(text)) {
    detected.add('Preacher Curl Bench')
  } else if (/\b(incline bench|incline dumbbell|incline barbell)\b/.test(text)) {
    detected.add('Incline Leather Bench')
  } else if (!nameLower.includes('step up') && (/\b(bench press|on bench|flat bench|bench dips|bench)\b/.test(nameLower) || /\b(flat bench|on a bench|on the bench|chair or bench)\b/.test(cleanDesc))) {
    detected.add('Flat Leather Bench')
  }

  // Pull-Up Bar
  if (nameLower !== 'iron cross' && (/\b(pull up|chin up|hanging leg|hanging knee|toes to bar)\b/.test(nameLower) || /\b(pull up bar|pull-up bar|chin up bar|chin-up bar|hanging from a bar)\b/.test(cleanDesc))) {
    detected.add('Steel Pull-Up Bar')
  }

  // Resistance Band / Tubing
  if (/\b(band walk|banded|resistance band|exercise tubing|mini-band)\b/.test(text)) {
    detected.add('Heavy Resistance Band')
  }

  // Agility Ladder
  if (/\b(agility ladder|ladder drill|crossover ladder|ladder)\b/.test(text)) {
    detected.add('Agility Ladder')
  }

  // Agility Hurdles
  if (/\b(hurdle|hurdles|mini-hurdles)\b/.test(text)) {
    detected.add('Low Agility Mini-Hurdles')
  }

  const list = Array.from(detected)
  if (list.length === 0) return 'bodyweight'
  return list.join(' and ')
}

/**
 * Parses NASM step descriptions into a clean, concise biomechanical summary
 */
function cleanNasmSteps(description) {
  if (!description) return ''
  const lines = description
    .split(/\n+/)
    .map(l => l.trim())
    .filter(Boolean)

  const steps = []
  for (const line of lines) {
    const cleaned = line
      .replace(/^Step\s*\d+:?\s*/i, '')
      .replace(/^Setup:?\s*/i, '')
      .replace(/^Brace\/Position:?\s*/i, '')
      .trim()
    if (cleaned.length > 10) {
      steps.push(cleaned)
    }
  }

  if (steps.length === 0) return description.slice(0, 180)

  // Take the key setup and execution actions
  let combined = steps.slice(0, 2).join(' ')
  if (combined.length > 220) {
    const lastPeriod = combined.lastIndexOf('.', 215)
    if (lastPeriod > 100) {
      combined = combined.slice(0, lastPeriod + 1)
    } else {
      combined = combined.slice(0, 215) + '...'
    }
  }
  return combined
}

/**
 * Restored & Brand-Calibrated Luxury GAA Editorial Prompt Synthesizer
 */
export function synthesizeNasmPrompt(entry) {
  const cleanName = entry.name.replace(/^How To\s+/i, '').trim()
  const equipment = detectEquipment(cleanName, entry.description, entry.primaryEquipment)
  let steps = cleanNasmSteps(entry.description)
  const muscles = (entry.muscleGroups && entry.muscleGroups.length > 0)
    ? `Engaging ${entry.muscleGroups.slice(0, 3).join(', ')}.`
    : ''

  let actionPhrase = `performing ${cleanName} with ${equipment}`
  if (equipment === 'bodyweight') {
    actionPhrase = `performing a bodyweight ${cleanName} on black athletic turf`
  } else if (equipment.includes('Foam Roller')) {
    actionPhrase = `performing ${cleanName} with a ${equipment} on black athletic turf`
  } else if (equipment.includes('Machine') || equipment.includes('Station') || equipment.includes('Pull-Up Bar')) {
    actionPhrase = `performing ${cleanName} on a ${equipment}`
  }

  let gripCue = ''
  const lowerName = cleanName.toLowerCase()
  if (lowerName.includes('single leg romanian deadlift')) {
    actionPhrase = actionPhrase.replace('Matte Black Dumbbells', 'a Matte Black Dumbbell')
    gripCue = 'Strict contralateral loading: athlete balances on their right leg with a slight knee bend, hinging forward at the hips with a flat back, holding a single matte black dumbbell in the opposite left hand (contralateral hand) directly in front of the stance leg with an overhand pronated grip (palms facing towards the thigh/shin). The free right arm extends out for balance, and the non-stance left leg extends straight back behind the torso.'
  } else if (lowerName.includes('romanian deadlift') || lowerName.includes('rdl')) {
  } else if (lowerName.includes('romanian deadlift') || /\brdl\b/.test(lowerName)) {
    gripCue = 'Athlete is captured mid-movement hinging at the hips with a flat back and slight knee bend. Overhand pronated grip with palms facing directly towards the thighs, knuckles facing forward away from the body; the dumbbells are held directly in front of the thighs and shins (strictly in front of the legs, not at the sides).'
  } else if (lowerName.includes('bent over row') && lowerName.includes('pronated')) {
    gripCue = 'Overhand pronated grip with knuckles facing forward and palms facing towards the body; athlete hinges forward at the hips with a flat spine, pulling the barbell up towards the lower abdomen.'
  } else if (lowerName.includes('rear fly')) {
    gripCue = 'Athlete hinges forward at the hips with a flat back, arms hanging with elbows slightly bent, raising the dumbbells smoothly out to the sides in a reverse fly motion to target the posterior deltoids.'
  } else if (lowerName.includes('bench dips')) {
    gripCue = 'Athlete sits with hands grasping the front edge of the bench, fingers pointing forward, lowering the hips with a tall upright torso and elbows flexing to 90 degrees.'
  } else if (lowerName.includes('front squat with crossed arms')) {
    gripCue = 'Crossed-arms front squat grip: The knurled barbell rests securely on the front of the shoulders, and the athlete has their arms crossed in an X-shape directly across the chest with hands resting on top of the bar across opposite shoulders (right hand securing the bar at the left shoulder, left hand securing the bar at the right shoulder). Elbows are lifted high pointing straight forward parallel to the floor (strictly crossed forearms in an X, NOT an Olympic clean grip, fingertips NOT under the bar). The athlete is squatting to parallel depth with a proud, tall upright torso.'
  } else if (lowerName.includes('front squat')) {
    gripCue = 'Athlete holds weights in the front rack position at chest height with elbows high and core braced, squatting down to parallel depth with an upright torso.'
  } else if (lowerName.includes('preacher curl')) {
    gripCue = 'Athlete sits at the preacher curl bench with upper arms resting flush on the angled pad, curling matte black dumbbells smoothly with a supinated underhand grip and elbows stable.'
  } else if (lowerName.includes('good morning')) {
    gripCue = 'Barbell resting securely across the upper traps, athlete hinges forward at the hips with a flat spine and soft knees until the torso is near parallel with the floor.'
  } else if (lowerName.includes('close grip bench press')) {
    gripCue = 'Athlete lies supine on the flat bench with an overhand grip shoulder-width apart on the knurled barbell, keeping elbows tucked close to the torso during the press to emphasize the triceps.'
  } else if (lowerName.includes('renegade row')) {
    gripCue = 'Athlete holds a solid high plank position supporting weight on two flat-bottomed kettlebells, rowing one kettlebell up to the ribs while locking the core and hips to prevent rotation.'
  } else if (lowerName.includes('kettlebell clean')) {
    gripCue = 'Athlete drives hips forward from a hinge, guiding the kettlebell into a smooth front rack position against the shoulder and forearm with a neutral wrist.'
  } else if (lowerName.includes('kettlebell swing')) {
    gripCue = 'Athlete hinges explosively at the hips, driving through the hips and glutes to swing the kettlebell forward to chest height with a flat back and packed shoulders.'
  } else if (lowerName.includes('foam roll adductors')) {
    gripCue = 'Athlete lies prone on the floor in a modified plank with one leg abducted 90 degrees out to the side, gently rolling the high-density foam roller along the inner thigh and adductor complex.'
  }

  let shotFraming = 'High-end luxury fitness photography of a single solo athlete (strictly one individual person in frame, no second person, no duplicates, no conjoined bodies)'
  if (lowerName.includes('single arm dumbbell chest press') || lowerName.includes('single arm dumbbell bench')) {
    shotFraming = 'Elevated 45-degree three-quarter diagonal perspective shot looking across the leather bench (strictly NOT a side profile, NOT a lateral view). High-end luxury fitness photography of a single solo athlete (strictly one person in frame)'
    actionPhrase = 'performing a unilateral single-arm chest press on a Flat Leather Bench with strictly ONE single Matte Black Dumbbell (only 1 dumbbell in the entire photograph)'
    steps = 'Athlete lies flat on the bench with feet flat on the floor. In one hand, the athlete presses a single matte black dumbbell upward above the chest. The opposite hand is completely empty and rests flat on the athlete\'s stomach/torso.'
    gripCue = 'CRITICAL BIOMECHANICS & SINGLE DUMBBELL RULES: Exactly one arm is extended holding and pressing ONE single matte black dumbbell. The other arm is bent with the empty hand resting relaxed on the athlete\'s abdomen. Strictly only 1 dumbbell exists in the entire image; no second dumbbell anywhere.'
  } else if (lowerName.includes('alternating dumbbell bench press')) {
    gripCue = 'Athlete lies supine on a flat bench holding dumbbells over chest, lowering and pressing one arm at a time in an alternating cadence while maintaining level shoulders.'
  } else if (lowerName.includes('face pull')) {
    gripCue = 'Athlete stands in an athletic staggered stance facing the high cable pulley, grasping the rope attachment with neutral thumbs-backward grip, pulling toward the bridge of the nose while flaring elbows high and externally rotating the shoulders.'
  } else if (lowerName.includes('cable crossover')) {
    gripCue = 'Athlete stands centered between dual cable towers in an athletic split stance, gripping both D-handles and smoothly drawing arms forward and downward in a wide hugging arc across the chest.'
  } else if (lowerName.includes('chest press machine')) {
    gripCue = 'Athlete sits upright with back flat against the vertical pad, gripping the horizontal handles at mid-chest level, smoothly pressing handles forward until arms are extended with packed shoulders.'
  } else if (lowerName.includes('leg press calf raise')) {
    gripCue = 'Athlete sits securely in the leg press sled, placing the balls of both feet along the bottom edge of the footplate with heels hanging off; pressing through the forefeet into full ankle extension with knees straight but unlocked.'
  } else if (lowerName.includes('seated machine row')) {
    gripCue = 'Athlete sits facing the chest support pad with feet flat, grasping the parallel close-grip neutral handles, rowing back until elbows pass the torso while retracting the scapulae.'
  } else if (lowerName.includes('band assisted pull up')) {
    gripCue = 'PERFECT VERTICAL PLUMB ALIGNMENT & BAND ASSISTANCE: A heavy continuous loop resistance band is anchored over the steel pull-up bar, hanging completely vertical straight down. The bottom loop of the band is placed under the soles of the feet. CRITICAL POSTURE: The athlete\'s entire body hangs in a plumb vertical line directly beneath the pull-up bar (feet held together, legs hanging straight down directly under the hips and shoulders, strictly NOT swinging forward, NOT kicked out at an angle, NOT angled away). The heavy rubber band stretches vertically straight down under the feet, providing vertical upward assistance as the athlete pulls smoothly up to the bar with an overhand wide grip.'
  } else if (lowerName === 'squat jump with stabilization') {
    gripCue = 'Dynamic power stabilization on open turf: The athlete lands softly on the forefeet rolling to heels in a balanced quarter squat with chest upright, arms bent in front for balance, holding the landing stabilization for 3 seconds. The floor is wide open, clean black athletic turf with strictly ZERO clutter, NO plate racks, NO barbell plates, and NO equipment on the ground anywhere near the athlete.'
  } else if (lowerName === 'ball crunch') {
    gripCue = 'Athlete lies supine with the lumbar spine draped naturally over the apex of the stability ball, knees bent at 90 degrees with feet flat on the turf, arms crossed over chest, curling the ribcage toward the pelvis.'
  } else if (lowerName.includes('ball cobra')) {
    gripCue = 'Athlete lies prone with abdomen and pelvis centered over the stability ball, toes grounded on the floor, lifting the chest and extending the thoracic spine with thumbs pointed toward the ceiling and shoulder blades retracted.'
  } else if (lowerName.includes('band walking')) {
    actionPhrase = actionPhrase.replace('Heavy Resistance Band', 'a closed elastic mini-loop resistance band')
    gripCue = 'Continuous closed mini-loop band: A small circular closed-loop elastic mini-band is wrapped around both legs just above the knees (or around both lower calves/ankles). The closed loop stretches horizontally between both legs, maintaining constant lateral abduction tension. The athlete is in an athletic quarter-squat taking controlled steps on wide open black athletic turf. Strictly a closed circular mini-band around the legs; NOT an anchored band, NOT attached to any wall, post, or floor.'
  } else if (lowerName.includes('single leg press')) {
    actionPhrase = 'performing a Unilateral Single Leg Press on a Matte Black Leg Press Machine'
    gripCue = 'CRITICAL UNILATERAL SINGLE-LEG FORM: The athlete sits securely in the 45-degree leg press sled with back supported. Exactly ONE single foot (the active right foot) is placed firmly in the center of the footplate pressing the sled upward with the knee aligned over the foot. The other non-working leg (left leg) is completely off the footplate, bent comfortably with foot resting on the lower floor frame (strictly only ONE foot touches the sled footplate, only ONE leg is pressing).'
  } else if (lowerName === 'lying leg curl') {
    gripCue = 'Athlete lies prone on the angled bench of the machine with hips pressed firmly down, legs fully extended with the padded lever resting against the lower Achilles/calves, curling the roller smoothly toward the glutes while keeping the pelvis anchored.'
  } else if (lowerName.includes('kettlebell goblet squat')) {
    gripCue = 'Athlete holds a single cast iron kettlebell upside down by the horns against the sternum with elbows tucked tightly, squatting to parallel depth with a proud upright chest and knees tracking over toes.'
  } else if (lowerName.includes('kettlebell push press')) {
    actionPhrase = 'performing a Kettlebell Push Press with strictly ONE single Matte Black Kettlebell'
    steps = 'Athlete holds a single matte black kettlebell in the rack position at the shoulder and performs a dynamic push press.'
    gripCue = 'Unilateral kettlebell push press: Athlete stands with feet hip-width apart, holding strictly ONE single matte black kettlebell in the rack position at the shoulder with a firm closed-fist grip on the handle and the bell resting against the outside forearm. Athlete performs a shallow 2-to-3 inch knee dip and drives explosively upward through the legs, pressing the kettlebell straight overhead to full vertical elbow lockout with bicep next to ear, free arm extended out to side for balance, core braced and spine neutral.'
  } else if (lowerName === 'push press' || (lowerName.includes('push press') && !lowerName.includes('dumbbell') && !lowerName.includes('kettlebell'))) {
    gripCue = 'Athlete dips into a shallow quarter squat with knees soft and torso upright, then drives explosively through the legs while driving the barbell forcefully overhead to full elbow lockout.'
  } else if (lowerName.includes('single arm kettlebell high pull')) {
    actionPhrase = 'performing a Single Arm Kettlebell High Pull with strictly ONE single Matte Black Kettlebell on black athletic turf'
    steps = 'Athlete explosively hinges and pulls a single matte black kettlebell upward with one arm.'
    gripCue = 'Explosive unilateral kettlebell high pull: Athlete stands in an athletic stance over black athletic turf, driving explosively through the hips and legs from a shallow hinge to propel strictly ONE single matte black kettlebell upward along the torso. Athlete pulls the kettlebell up to upper chest / collarbone level with the working elbow flared high and outside above the wrist and handle, free arm extending out for balance, chest proud, eyes forward.'
  } else if (lowerName === 'kettlebell overhead press' || (lowerName.includes('kettlebell overhead press') && !lowerName.includes('reciprocating'))) {
    gripCue = 'CRITICAL CLOSED HANDLE GRIP: Athlete stands tall with core braced, pressing a cast iron kettlebell vertically overhead to full elbow lockout. The athlete has a firm, strong closed grip with fingers and thumb wrapped tightly around the curved kettlebell handle (firm closed fist grip around the handle, NOT an open palm, fingers NOT splayed upward). The weighted iron bell rests securely against the outside of the wrist/forearm in a proper kettlebell overhead lockout.'
  } else if (lowerName.includes('reverse lunge to single arm row')) {
    actionPhrase = actionPhrase.replace('Matte Black Dumbbells', 'strictly ONE single Matte Black Dumbbell')
    gripCue = 'Unilateral dumbbell lunge row: Athlete steps back into a deep reverse lunge on black athletic turf while holding strictly ONE single matte black dumbbell in the hand opposite the front stance leg, rowing the dumbbell up to the ribcage with elbow tucked as the rear knee lowers.'
  } else if (lowerName.includes('pike push up')) {
    gripCue = 'Athlete assumes a high pike position with hips lifted high in an inverted V-shape on black athletic turf, hands shoulder-width apart, lowering the crown of the head toward the floor between the hands and pressing back up.'
  } else if (lowerName === 'incline push up') {
    gripCue = 'Athlete places hands shoulder-width apart on the elevated flat leather bench in an incline plank position, keeping a rigid straight line from heels to head, lowering chest to the bench and pressing back up.'
  } else if (lowerName.includes('single leg squat touchdown')) {
    gripCue = 'Athlete balances on one leg, hinging at the hips and squatting to reach forward and touch the turf with the opposite hand while extending the free leg straight back behind them in a controlled unilateral motion.'
  } else if (lowerName.includes('kettlebell jerk')) {
    gripCue = 'Olympic kettlebell lift: Athlete dips slightly at the hips and knees, drives upward explosively, and drops under the kettlebell into a second shallow dip to catch the kettlebell with arm fully locked out overhead.'
  } else if (lowerName.includes('decline push up')) {
    actionPhrase = 'performing a Decline Push Up with feet elevated on a Flat Leather Bench on black athletic turf'
    gripCue = 'Athlete places toes/balls of feet elevated on the flat leather bench with hands placed shoulder-width apart on the black athletic turf in a decline push-up angle, maintaining a rigid straight body line while lowering chest toward the turf and pressing back up.'
  } else if (lowerName.includes('supported bent over dumbbell row')) {
    actionPhrase = 'performing a Bench-Supported Single Arm Dumbbell Row on a Flat Leather Bench with strictly ONE single Matte Black Dumbbell'
    steps = 'Athlete places one knee and supporting hand firmly on a flat leather bench with back flat and parallel to the bench, with the opposite foot planted on the floor.'
    gripCue = 'Bench-supported unilateral row: Athlete holds strictly ONE single matte black dumbbell in the free working hand, rowing the dumbbell smoothly up toward the hip and lower ribcage with elbow tucked tightly to the torso, squeezing the lat at the peak contraction.'
  } else if (lowerName.includes('barbel row supinated') || lowerName.includes('barbell row supinated')) {
    gripCue = 'Underhand supinated barbell grip: Athlete hinges forward at the hips with a flat spine, holding the knurled barbell with an underhand grip (palms facing forward/away from the thighs, thumbs pointing outward), rowing the bar smoothly toward the lower abdomen with elbows tucked close to the torso.'
  } else if (lowerName.includes('box jump up with stabilization frontal')) {
    actionPhrase = 'performing Box Jump Up With Stabilization Frontal next to a Plyometric Box on black athletic turf'
    gripCue = 'Frontal plane lateral box jump: Athlete stands sideways next to a black plyometric box on black athletic turf, loading hips in a shallow quarter squat, exploding laterally and vertically off both feet to land softly on top of the plyo box in a balanced quarter squat, holding the stabilization landing for 3 seconds.'
  } else if (lowerName.includes('box jump up with stabilization')) {
  } else if (lowerName.includes('box jump up with stabilization transverse')) {
    actionPhrase = 'performing Box Jump Up With Stabilization Transverse onto a Plyometric Box on black athletic turf'
    steps = 'Athlete stands perpendicular to a black plyometric box, jumps with a 90-degree transverse rotation, and lands softly on top of the box.'
    gripCue = 'Rotational transverse box jump: Athlete stands perpendicular (at a 90-degree angle) to a black plyometric box on black athletic turf, loading hips in a shallow quarter squat, exploding upward while rotating 90 degrees in mid-air in the transverse plane, landing softly on top of the plyo box facing forward in a controlled quarter squat, holding the landing stabilization for 3 seconds.'
  } else if (lowerName === 'box jump up with stabilization' || lowerName.includes('box jump up with stabilization')) {
    actionPhrase = 'performing Box Jump Up With Stabilization onto a Plyometric Box on black athletic turf'
    gripCue = 'Dynamic power stabilization on plyo box: Athlete explodes vertically from the floor and lands softly on top of the black plyometric box in a controlled quarter squat, holding the balanced landing posture with chest upright and knees aligned for 3 seconds.'
  } else if (lowerName.includes('plank walkup')) {
    gripCue = 'Athlete starts in a forearm plank on the black athletic turf, transitioning smoothly one hand at a time up into a high push-up plank and back down to forearms while locking the core and hips to prevent torso sway.'
  } else if (lowerName.includes('archer push up')) {
    gripCue = 'Athlete starts in a wide push-up position on black athletic turf, shifting the body smoothly to one side, fully bending that arm to lower the chest while extending the opposite arm straight out to the side with palm grounded.'
  } else if (lowerName === 'squat to row' || (lowerName.includes('squat to row') && !lowerName.includes('single leg') && !lowerName.includes('single arm'))) {
    actionPhrase = 'performing Squat To Row on a Cable Pulley Station'
    steps = 'Captured in a single continuous camera shot (strictly one continuous frame, strictly NOT a split screen, NOT a diptych, strictly only ONE solo athlete in frame).'
    gripCue = 'Dynamic compound movement: Athlete rises from a squat with knees slightly bent and core braced, powerfully rowing dual cable D-handles back alongside the lower ribcage with elbows driven back, chest held high, and shoulder blades retracted, facing the matte black cable pulley station with taut cables extending to the pulley.'
  } else if (lowerName.includes('single leg seated leg curl')) {
    actionPhrase = 'performing a Single Leg Seated Leg Curl for hamstrings on a Matte Black Seated Leg Curl Machine'
    steps = 'Athlete sits in the machine with back against the backrest and the thigh stabilization pad clamped across the right thigh.'
    gripCue = 'CRITICAL UNILATERAL SINGLE-LEG FORM: Exactly ONE single leg (the active right leg) is on the machine with the back of the ankle/Achilles resting on the roller pad, curling the pad down toward the floor. The other non-working leg (left leg) is completely OFF the roller pad, bent at 90 degrees with the foot resting flat on the gym floor beside the machine (strictly only ONE leg is on the roller pad). Athlete holds the seat handles with an upright, braced torso.'
  } else if (lowerName.includes('tuck jump with stabilization')) {
    gripCue = 'Dynamic power stabilization: Athlete explodes vertically off the black turf, bringing knees high toward the chest in mid-air, then extends legs to land softly forefoot-to-heel in a balanced quarter squat, holding the landing stabilization for 3 seconds on wide open turf.'
  } else if (lowerName.includes('depth jump transverse')) {
    actionPhrase = 'performing Depth Jump Transverse with a Plyometric Box on black athletic turf'
    steps = 'Athlete steps down off a plyometric box and instantly rebounds with a 90-degree transverse rotational jump.'
    gripCue = 'Transverse plyometrics: Athlete steps down off a 12-inch plyometric box onto the black athletic turf, instantly absorbing the landing with soft knees and immediately exploding upward while rotating 90 degrees in mid-air in the transverse plane, arms driving upward dynamically.'
  } else if (lowerName === 'depth jump') {
    actionPhrase = 'performing a Depth Jump with a Plyometric Box on black athletic turf'
    gripCue = 'Reactive plyometrics: Athlete steps down off a 12-inch plyometric box onto the black athletic turf, instantly absorbing the landing in a shallow dip and exploding vertically upward into the air with maximum power.'
  } else if (lowerName === 'side plank') {
    actionPhrase = 'holding a Side Plank on black athletic turf'
    gripCue = 'Lateral core stability: Athlete balances in a side plank on the black athletic turf, resting forearm flat on the ground with elbow directly under the shoulder, feet stacked, and hips lifted to form a rigid diagonal straight line from heels to head.'
  } else if (lowerName === 'bird dog') {
    actionPhrase = 'performing Bird Dog on black athletic turf'
    gripCue = 'Quadruped core stability: Athlete is positioned on hands and knees on the black athletic turf with neutral flat spine, simultaneously extending the right arm straight forward and left leg straight back parallel to the floor, holding for a controlled pause.'
  } else if (lowerName === 'dead bug') {
    actionPhrase = 'performing Dead Bug on black athletic turf'
    steps = 'Athlete lies supine on black athletic turf with lower back pressed flat against the ground and core braced.'
    gripCue = 'CRITICAL CONTRALATERAL CORE BIOMECHANICS: The movement is strictly contralateral (opposite arm and opposite leg, never same-side limbs). The athlete extends their RIGHT arm straight overhead past the ear toward the floor, while simultaneously extending their LEFT leg straight out hovering just above the turf. Meanwhile, the opposite limbs remain in the starting table-top position: the LEFT arm points vertically straight up toward the ceiling, and the RIGHT knee remains bent at a 90-degree angle directly over the hip.'
  } else if (lowerName === 'russian twist') {
    actionPhrase = 'performing Russian Twist on black athletic turf'
    gripCue = 'Rotational core stability: Athlete sits in a balanced V-sit posture on the black athletic turf with knees bent and feet hovering off the ground, rotating the torso under control with hands clasped at the chest.'
  } else if (lowerName === 'squat jump') {
    actionPhrase = 'performing an explosive Squat Jump on black athletic turf'
    gripCue = 'Dynamic vertical power: Athlete descends into a parallel squat on the black athletic turf and explosively drives upward with triple extension of the hips, knees, and ankles, jumping vertically into the air and landing softly forefoot-to-heel.'
  } else if (lowerName === 'tuck jump') {
    actionPhrase = 'performing a Tuck Jump on black athletic turf'
    gripCue = 'Airborne plyometrics: Athlete explodes vertically off the black athletic turf, tucking both knees up toward the chest in mid-air with upright posture, then extending legs to absorb the landing softly on the turf.'
  } else if (lowerName.includes('standing tubing row')) {
    actionPhrase = 'performing a Standing Tubing Row with Resistance Bands on black athletic turf'
    steps = 'Stand with feet shoulder-width apart facing a secure forward anchor point, holding resistance band handles with arms extended forward at chest height.'
    gripCue = 'Resistance band row: Athlete stands tall on black athletic turf facing a taut resistance band anchor, holding band handles with arms extended forward, rowing elbows back close to the ribs and squeezing the upper back muscles.'
  } else if (lowerName.includes('assisted single leg squat')) {
    actionPhrase = 'performing an Assisted Single Leg Squat with Suspension Straps on black athletic turf'
    steps = 'Athlete stands on one leg holding suspension handles in front at chest height with light tension for balance.'
    gripCue = 'Unilateral assisted squat: Athlete balances on one leg on black athletic turf holding suspension handles in front for light assistance, descending into a single-leg squat to parallel while the non-working leg extends forward.'
  } else if (lowerName.includes('ball crunch arms crossed')) {
    actionPhrase = 'performing a Stability Ball Crunch with Arms Crossed'
    gripCue = 'Core flexion on stability ball: Athlete lies supine with middle back draped across the apex of the stability ball, feet flat on the turf, arms crossed over the chest with hands on opposite shoulders, curling the ribcage toward the hips.'
  } else if (lowerName.includes('barbell bench press with chains')) {
    actionPhrase = 'performing a Barbell Bench Press with Chains on a Flat Leather Bench'
    gripCue = 'Accommodating resistance: Athlete lies on a flat leather bench gripping a knurled Olympic barbell, with heavy steel chains draped from each end of the barbell sleeve touching the gym floor at the chest touch and lifting off the floor at lockout.'
  } else if (lowerName.includes('two arm incline dumbbell chest press')) {
    actionPhrase = 'performing a Two Arm Incline Dumbbell Chest Press on an Incline Leather Bench'
    gripCue = 'Bilateral incline pressing: Athlete lies back on a 45-degree incline leather bench with feet planted firmly on the floor, holding two matte black dumbbells, pressing both dumbbells smoothly upward and inward toward lockout directly over the upper chest.'
  } else if (lowerName.includes('single arm incline dumbbell chest press')) {
    actionPhrase = 'performing a Single Arm Incline Dumbbell Chest Press on an Incline Leather Bench with strictly ONE single Matte Black Dumbbell'
    steps = 'Athlete reclines on a 45-degree incline leather bench with feet planted firmly on the floor, maintaining a rigid core.'
    gripCue = 'CRITICAL UNILATERAL INCLINE PRESS FORM: Exactly ONE single matte black dumbbell is held in the active pressing right hand, pressing it vertically upward above the chest. The non-working left arm rests comfortably across the athlete\'s torso or on the hip (strictly only ONE dumbbell in the entire frame, strictly unilateral loading).'
  } else if (lowerName.includes('incline push up with rotation')) {
    actionPhrase = 'performing an Incline Push Up With Rotation on a Flat Leather Bench'
    gripCue = 'Incline rotational push-up: Athlete places hands on the flat leather bench, executes an incline push-up, and at the top rotates the chest upward while extending the upper arm vertically toward the ceiling in a stable T-plank rotation.'
  } else if (lowerName.includes('push up with staggered hands')) {
    actionPhrase = 'performing a Push Up With Staggered Hands on black athletic turf with BOTH hands planted firmly on the floor'
    gripCue = 'CRITICAL STAGGERED HANDS FORM: BOTH hands are planted flat on the black athletic turf supporting bodyweight simultaneously (strictly NEITHER hand is lifted off the turf, not a one-arm pushup). The athlete’s left hand is positioned approximately 6 inches forward ahead of the shoulder line, while the right hand is positioned back near the lower ribcage. Both palms press flat into the turf with fingers spread forward, body held in a rigid push-up plank from toes to shoulders.'
  } else if (lowerName.includes('short lever side plank')) {
    actionPhrase = 'holding a Short Lever Side Plank on black athletic turf'
    gripCue = 'Modified short lever side plank: Athlete rests on the forearm with elbow directly under the shoulder, bottom knee bent at 90 degrees supporting bodyweight on the turf, hips elevated high to form a straight line from knees to shoulders.'
  } else if (lowerName.includes('plank with knees down')) {
    actionPhrase = 'holding a modified Plank With Knees Down on black athletic turf'
    gripCue = 'CRITICAL KNEES-DOWN FORM: The athlete is supported on their FOREARMS and KNEES on the black athletic turf. Strictly supported on the knees, NOT on the toes! The athlete’s knees are planted firmly on the black turf with lower legs and feet resting on or slightly elevated behind the knees. Core is braced in a straight diagonal line from knees through hips to shoulders, elbows directly beneath shoulders.'
  } else if (lowerName.includes('step up to balance frontal curl to overhead press')) {
    actionPhrase = 'performing Step Up To Balance Frontal Curl To Overhead Press on a Plyometric Box'
    gripCue = 'Multiplanar dynamic balance: Athlete steps laterally onto the plyometric box into a single-leg balance, curling matte black dumbbells to shoulders and pressing them directly overhead in full standing balance.'
  } else if (lowerName.includes('box squat curl to overhead press')) {
    actionPhrase = 'performing Box Squat Curl To Overhead Press with a Plyometric Box and Matte Black Dumbbells'
    gripCue = 'Compound power transition: Athlete rises from a box squat off the plyometric box, driving through the heels to stand while curling matte black dumbbells to the shoulders and pressing them overhead to lockout.'
  } else if (lowerName.includes('static latissimus dorsi ball stretch')) {
    actionPhrase = 'performing a Static Latissimus Dorsi Ball Stretch with a Stability Ball on black athletic turf'
    gripCue = 'Lat stretch on stability ball: Athlete kneels on the black athletic turf with hips sinking back toward heels, extending arms forward with pinky sides of hands resting on top of a stability ball, gently depressing the chest for a deep stretch through the lats.'
  } else if (lowerName.includes('static butterfly stretch')) {
    actionPhrase = 'performing a Static Butterfly Stretch on black athletic turf'
    gripCue = 'Adductor flexibility stretch: Athlete sits tall on the black athletic turf with soles of the feet pressed together, knees falling outward toward the floor, hands gently grasping ankles while maintaining a straight upright spine.'
  } else if (lowerName.includes('lateral band walking')) {
    actionPhrase = 'performing Lateral Band Walking on black athletic turf with an elastic resistance mini-loop band'
    gripCue = 'CRITICAL MINI-LOOP FORM: A closed elastic mini-loop band is looped around both legs just above the knees. Athlete is in an athletic quarter-squat stance with feet hip-to-shoulder width apart, core braced, chest up, stepping laterally across the black turf while maintaining continuous outward abduction tension on the band, strictly keeping toes pointed straight ahead without inward knee collapse.'
  } else if (lowerName.includes('straight arm plank')) {
    actionPhrase = 'holding a Straight Arm Plank (High Plank) on black athletic turf'
    gripCue = 'High push-up plank: Athlete supports bodyweight on PALMS and toes on the black athletic turf. Palms are flat directly beneath shoulders with fingers pointing forward, arms straight with elbows unlocked, torso rigid forming a perfectly straight line from heels through glutes and spine to head, abs braced, glutes engaged.'
  } else if (lowerName.includes('plank with arm reach')) {
    actionPhrase = 'performing a Plank With Arm Reach on black athletic turf'
    gripCue = 'Anti-rotational stability: Athlete holds a straight-arm high plank position and reaches ONE arm (the right arm) straight forward parallel to the floor in line with the shoulder, while the remaining three points of contact (left palm and both feet on toes) hold the hips and torso perfectly square and level to the floor without hip rotation or dipping.'
  } else if (lowerName.includes('push up with rotation')) {
    actionPhrase = 'performing a Push Up With Rotation on black athletic turf'
    gripCue = 'Rotational push-up: Athlete presses up from a push-up on black athletic turf, and at top extension rotates the chest and torso sideways toward the camera into a side plank T-pose, reaching the top arm straight up toward the ceiling with eyes tracking the upper hand, feet stacked or slightly staggered, hips elevated high.'
  } else if (lowerName.includes('push up plus')) {
    actionPhrase = 'performing a Push Up Plus on black athletic turf'
    gripCue = 'Serratus anterior activation: Athlete is at the top lockout of a straight-arm push-up on black athletic turf, pressing palms actively into the floor to maximally protract the scapulae, gently rounding the upper thoracic spine upward while keeping the rest of the body in a rigid plank line.'
  } else if (lowerName.includes('box squat') && !lowerName.includes('curl')) {
    actionPhrase = 'performing a Box Squat with a Plyometric Box on black athletic turf'
    gripCue = 'Controlled depth squat: Athlete stands in front of a sturdy matte black GAA plyometric box, hips hinged back and knees bent tracking over toes, lowering until glutes lightly touch the top of the box with an upright braced torso and arms held extended in front for counterbalance, ready to drive back up through heels.'
  } else if (lowerName.includes('dumbbell squat to overhead press')) {
    actionPhrase = 'performing a Dumbbell Squat To Overhead Press with Matte Black Dumbbells'
    gripCue = 'Compound thruster power: Athlete holds two matte black dumbbells at shoulder height, descends into a parallel squat with upright chest, then explosively drives upward through heels to standing while pressing both dumbbells overhead to full lockout in one continuous fluid athletic kinetic chain.'
  } else if (lowerName.includes('reverse lunge to balance')) {
    actionPhrase = 'holding the single-leg standing balance of a Reverse Lunge To Balance on black athletic turf'
    gripCue = 'CRITICAL SINGLE-LEG BALANCE POSE: Athlete stands tall balanced exclusively on ONE single foot (left foot) on the black athletic turf. The opposite right leg is lifted high off the floor with the right hip and right knee flexed to 90 degrees directly in front at hip height (thigh parallel to floor, foot dorsiflexed). Strictly single-leg standing balance, right foot completely in the air off the turf. Torso is tall, vertical, and proud with core braced, arms held in dynamic athletic runner position.'
  } else if (lowerName.includes('two arm standing cable fly')) {
    actionPhrase = 'performing a Two Arm Standing Cable Fly at a dual cable crossover station with arms extended in a wide chest fly arc'
    gripCue = 'CRITICAL CHEST FLY FORM: Athlete stands facing forward between two cable stacks in a stable staggered athletic stance. Both arms are extended outward to the sides and forward in a wide hugging arc with only a slight soft bend at the elbows, bringing the D-handles forward until hands meet directly in front of the chest/sternum. The arms are extended wide (NOT pulled into the chest or bent at 90 degrees), actively squeezing the pectorals.'
  } else if (lowerName.includes('barbell front squat with clean position')) {
    actionPhrase = 'performing a Barbell Front Squat With Clean Position using a Knurled Olympic Barbell'
    gripCue = 'CRITICAL CLEAN RACK POSITION: The athlete racks a knurled Olympic barbell across the anterior deltoids and clavicles using an Olympic clean fingertip grip with elbows driven high and forward parallel to the floor (strictly clean grip, NOT crossed arms). Deep parallel squat depth, knees tracking over toes, upright vertical spine.'
  } else if (lowerName === 'romanian deadlift') {
    actionPhrase = 'performing a Barbell Romanian Deadlift with a Knurled Olympic Barbell'
    gripCue = 'Bilateral barbell hip hinge: Athlete holds a knurled Olympic barbell with an overhand double-pronated grip, hinging deeply at the hips while pushing glutes back, back flat and neutral, lowering the bar just below knees along the shins with soft knee bend, shins vertical.'
  } else if (lowerName === 'leg press') {
    actionPhrase = 'performing a 45-Degree Leg Press on a Matte Black Plate-Loaded Leg Press Machine'
    gripCue = 'Bilateral leg press depth: Athlete is seated in the padded 45-degree leg press machine, back flat against pad, feet placed shoulder-width apart in the center of the sled platform, knees tracking in line with toes bent to 90 degrees at the bottom of the pressing stroke without hips lifting off the seat.'
  } else if (lowerName.includes('squat thrust burpees')) {
    actionPhrase = 'performing Squat Thrust Burpees on black athletic turf'
    gripCue = 'Dynamic plyometric burpee: Athlete is in the dynamic kick-back phase with hands planted firmly on the black athletic turf directly beneath shoulders, kicking feet back into a rigid plank with core braced, ready to jump feet forward and explode vertically.'
  } else if (lowerName === 'dumbbell hammer curl' || lowerName === 'hammer curl') {
    shotFraming = 'Full-body three-quarter perspective photography of a single solo athlete (strictly one individual person in frame, full head to toe visible, no second person, no duplicates)'
    actionPhrase = 'performing a Dumbbell Hammer Curl with Matte Black Dumbbells'
    steps = 'Athlete stands tall with feet shoulder-width apart and core braced, elbows tucked close to ribcage, curling two matte black dumbbells upward into a strict vertical hammer curl.'
    gripCue = 'CRITICAL HAMMER CURL BIOMECHANICS: Strict neutral hammer grip where palms face directly inward toward each other throughout the entire movement. STRICTLY ZERO TWISTING of the wrists, zero supination, zero pronation (dumbbells must NOT be turned horizontal; palms must NEVER face upward toward the ceiling). Both dumbbells are oriented strictly vertically (top head pointing straight up toward ceiling, bottom head pointing down toward floor). Thumbs point straight up toward the ceiling. Forearms are flexed at 90 degrees with elbows pinned closely against the ribcage, maintaining palms facing directly inward toward each other in pure vertical hammer grip.'
  } else if (lowerName.includes('single leg hammer curl')) {
    actionPhrase = 'performing a Single Leg Hammer Curl with Matte Black Dumbbells'
    gripCue = 'CRITICAL HAMMER CURL BIOMECHANICS ON SINGLE LEG: Athlete balances steadily on one standing leg (right leg) with knee softly flexed, opposite left knee bent at 90 degrees with foot hovering off the floor, upright posture. Holding matte black dumbbells with a STRICT NEUTRAL HAMMER GRIP: palms face directly inward toward the body throughout the entire curl. STRICTLY ZERO TWISTING and no rotation of the wrist or dumbbell (no supination). The dumbbells remain oriented strictly vertically (heads pointing straight up and down, never horizontal). Thumbs point straight up toward the ceiling as the dumbbell is curled toward the shoulder with elbow pinned to the ribcage.'
  } else if (lowerName.includes('hammer curl to lateral raise')) {
    actionPhrase = 'performing a Hammer Curl To Lateral Raise with Matte Black Dumbbells'
    gripCue = 'CRITICAL HAMMER CURL EXECUTION IN COMBO: Athlete stands tall with feet shoulder-width apart, core braced. Athlete performs the hammer curl phase: curling two matte black dumbbells upward toward the shoulders with palms facing directly inward toward each other throughout the curl. STRICTLY ZERO TWISTING and zero rotation of the dumbbells (no supination). Both dumbbells remain oriented strictly vertically (heads pointing straight up and down, never turned horizontal) with thumbs pointing up toward the ceiling and elbows tucked close to the torso, capturing the clean hammer curl before the lateral raise transition.'
  } else if (lowerName.includes('single arm standing chest press')) {
    actionPhrase = 'performing a Single Arm Standing Chest Press with strictly ONE Matte Black Dumbbell'
    steps = 'Athlete stands tall with feet shoulder-width apart, core braced, holding strictly ONE matte black dumbbell in the active pressing right hand at chest level.'
    gripCue = 'CRITICAL UNILATERAL DUMBBELL PRESS FORM: Exactly ONE single matte black dumbbell is pressed horizontally forward at chest height until the arm is fully extended with wrist straight. The non-working left arm rests calmly on the hip or by the side (strictly only ONE dumbbell in the entire frame).'
  } else if (lowerName.includes('incline stance row')) {
    actionPhrase = 'performing an Incline Stance Row with Matte Black Dumbbells'
    gripCue = 'Athletic staggered-stance row: Athlete sets up in a split-stance lunge hinge on black athletic turf, torso angled forward at 45 degrees with spine flat and neutral, rowing two matte black dumbbells upward into the lower ribcage with elbows driven back.'
  } else if (lowerName.includes('lying leg curl single leg')) {
    actionPhrase = 'performing a Lying Leg Curl Single Leg on a Matte Black Lying Leg Curl Machine'
    gripCue = 'Unilateral prone leg curl: Athlete lies face down on the padded machine gripping the side handles, hips pressed firmly to the pad. One leg curls the roller pad up toward the glutes to 90 degrees of knee flexion, while the opposite non-working leg remains extended flat on the bench.'
  } else if (lowerName.includes('double kettlebell clean')) {
    actionPhrase = 'performing a Double Kettlebell Clean with two Cast Iron Kettlebells'
    gripCue = 'CRITICAL DOUBLE RACK POSITION: Athlete catches TWO cast iron kettlebells simultaneously in the clean front rack position at chest height. Both kettlebells rest snugly in the crook of the elbows against the chest/deltoids, thumbs near the collarbones, standing tall with glutes and core locked.'
  } else if (lowerName.includes('half get up with kettlebell')) {
    actionPhrase = 'performing a Half Get Up With Kettlebell on black athletic turf'
    gripCue = 'CRITICAL TURKISH GET-UP HALF PHASE: Athlete lies on black athletic turf with right knee bent and foot flat on the floor, left leg extended flat at a 45-degree angle. Athlete has propped torso up onto the left forearm and palm, while the right arm is locked perfectly vertical toward the ceiling supporting a cast iron kettlebell, eyes locked upward on the bell.'
  } else if (lowerName.includes('barbell bench press with bands')) {
    actionPhrase = 'performing a Barbell Bench Press With Bands on a flat leather bench with a Knurled Olympic Barbell'
    gripCue = 'Accommodating resistance setup: Athlete lies supine on a flat leather bench pressing a knurled Olympic barbell at mid-chest level. Two heavy resistance bands are anchored to heavy floor pins below and looped around the barbell sleeves on both sides, adding variable tension throughout the press.'
  } else if (lowerName.includes('hand to hand kettlebell swing')) {
    actionPhrase = 'performing a Hand To Hand Kettlebell Swing with a Cast Iron Kettlebell on black athletic turf'
    gripCue = 'Dynamic hand-to-hand transition: Athlete stands in an athletic hip-hinged stance, having driven the cast iron kettlebell up to chest height. At the top apex of the swing, the athlete transitions the kettlebell smoothly from the right hand to the left hand in mid-air with eyes focused on the bell, hips fully extended, core rigid.'
  } else if (lowerName.includes('dumbbell rack carry')) {
    actionPhrase = 'performing a Dumbbell Rack Carry with two Matte Black Dumbbells on black athletic turf'
    gripCue = 'Front rack carry posture: Athlete walks forward tall with a proud vertical posture on the black athletic turf, holding two matte black dumbbells up in the front rack position with the dumbbell heads resting comfortably at the anterior shoulders, elbows tucked forward, core braced, steps measured and deliberate.'
  } else if (lowerName.includes('bent elbow dumbbell lateral raise')) {
    actionPhrase = 'performing a Bent Elbow Dumbbell Lateral Raise with Matte Black Dumbbells'
    gripCue = 'CRITICAL BENT ELBOW FORM: Athlete stands tall with feet shoulder-width apart and core braced, holding two matte black dumbbells. Both elbows are bent at a fixed 90-degree angle with palms facing inward, raising both arms laterally out to the sides until upper arms and elbows reach shoulder height (elbows maintaining the 90-degree bend throughout, NOT straight arms).'
  } else if (lowerName.includes('inverted push up')) {
    actionPhrase = 'performing an Inverted Push Up (Decline Push Up) with feet elevated on a Flat Leather Bench on black athletic turf'
    gripCue = 'Decline inverted push-up: Athlete assumes a decline push-up position with toes placed on top of a flat leather bench and hands planted flat on the black athletic turf directly beneath shoulders, lowering the chest toward the turf in a rigid diagonal plank line from feet to head.'
  } else if (lowerName.includes('push up to 3 point stance')) {
    actionPhrase = 'performing a Push Up To 3 Point Stance on black athletic turf'
    gripCue = 'CRITICAL 3-POINT STANCE FORM: Athlete is at the top lockout of a push-up with palms flat on the black athletic turf directly under shoulders. Athlete lifts ONE leg (the right leg) off the floor, extending it out slightly to the side hovering a foot above the turf, supporting bodyweight on exactly THREE points of contact (two hands and one foot) while maintaining a level, square pelvis.'
  } else if (lowerName.includes('single leg balance reach frontal plane')) {
    actionPhrase = 'performing a Single Leg Balance Reach Frontal Plane on black athletic turf'
    gripCue = 'Frontal plane balance reach: Athlete stands balanced tall on the left foot on black athletic turf with hands on hips and core braced. The right leg reaches straight out laterally to the right side hovering just above the turf in the frontal plane, hips remaining level and square without tilting.'
  } else if (lowerName.includes('smr hamstrings')) {
    actionPhrase = 'performing Self Myofascial Release on Hamstrings with a High-Density Foam Roller on black athletic turf'
    gripCue = 'Hamstring foam rolling: Athlete sits on black athletic turf with hands placed behind hips supporting bodyweight, legs extended forward. A high-density black foam roller is positioned beneath the middle of the hamstrings (back of thighs), gently rolling between the knees and glutes with hips slightly elevated.'
  } else if (lowerName.includes('smr piriformis')) {
    actionPhrase = 'performing Self Myofascial Release on Piriformis with a High-Density Foam Roller on black athletic turf'
    gripCue = 'Figure-4 piriformis roll: Athlete sits on the black athletic turf with a high-density foam roller directly under the right glute. Athlete crosses the right ankle over the left knee in a figure-4 position, leaning slightly onto the right hip to target the piriformis with hands supporting bodyweight on the turf.'
  } else if (lowerName.includes('double kettlebell snatch')) {
    actionPhrase = 'performing a Double Kettlebell Snatch with two Cast Iron Kettlebells'
    gripCue = 'CRITICAL DUAL OVERHEAD LOCKOUT: Athlete has snatched TWO cast iron kettlebells simultaneously, locking both kettlebells fully overhead in one powerful explosive drive. Both arms are locked straight vertically with wrists neutral and kettlebells resting against the backs of the forearms, core braced, glutes squeezed, standing tall in a strong lockout.'
  } else if (lowerName.includes('band push up')) {
    actionPhrase = 'performing a Band Push Up on black athletic turf with a Heavy Resistance Band'
    gripCue = 'CRITICAL RESISTANCE BAND PLACEMENT: A flat elastic resistance band is stretched horizontally across the athlete’s upper back/scapulae, with both ends pinned firmly flat against the black athletic turf under the athlete’s palms. As the athlete presses upward to full push-up lockout, the band stretches taut across the back providing accommodating resistance.'
  } else if (lowerName.includes('quadruped opposite arm leg raise')) {
    actionPhrase = 'performing a Quadruped Opposite Arm Leg Raise (Bird Dog) on black athletic turf'
    gripCue = 'CRITICAL CONTRALATERAL FORM: Athlete starts on hands and knees (tabletop quadruped) on the black athletic turf with hands under shoulders and knees under hips. Athlete extends the RIGHT arm straight forward in line with the ear and the LEFT leg straight backward in line with the hip simultaneously, forming a horizontal line parallel to the turf while maintaining a flat neutral spine and level pelvis.'
  } else if (lowerName.includes('single leg hop stabilization level 1') || lowerName === 'single leg hop stabilization') {
    actionPhrase = 'performing a Single Leg Hop Stabilization on black athletic turf'
    gripCue = 'Unilateral plyometric landing: Athlete has hopped forward and landed softly on ONE single leg (the right leg) on the black athletic turf, holding a rock-solid single-leg balance landing with knee softly flexed, chest upright, hands on hips, opposite leg hovering off the ground.'
  } else if (lowerName.includes('single leg hop stabilization level 2')) {
    actionPhrase = 'performing a Single Leg Hop Stabilization Level 2 on black athletic turf'
    gripCue = 'Dynamic unilateral stick landing: Athlete has completed a forward single-leg hop and holds a rock-solid single-leg balance landing on the right foot, knee bent at 20-30 degrees in athletic alignment over toes, chest upright, hands on hips, opposite knee hovering bent at 90 degrees with total dynamic postural stability.'
  } else if (lowerName.includes('single leg cobra to hip extension')) {
    actionPhrase = 'performing a Single Leg Cobra To Hip Extension on black athletic turf'
    gripCue = 'Posterior chain activation: Athlete lies prone on the black athletic turf with chest elevated in a prone cobra, arms extended alongside torso with thumbs up. Athlete lifts ONE extended straight leg upward several inches off the floor through glute contraction while keeping pelvis flat against the turf.'
  } else if (lowerName.includes('repeat squat jumps transverse') || lowerName.includes('repeat squat jump transverse')) {
    actionPhrase = 'performing Repeat Squat Jumps Transverse on black athletic turf'
    steps = 'Athlete performs continuous, rhythmic squat jumps rotating 90 degrees in the transverse plane.'
    gripCue = 'Transverse plane rotational repeat squat jumps: Athlete dips into a quarter squat loading hips and swinging arms back, then explodes vertically while rotating 90 degrees in mid-air across the transverse plane, achieving full triple extension at the peak before landing softly with knees tracking over toes and immediately rebounding.'
  } else if (lowerName.includes('repeat squat jumps frontal') || lowerName.includes('repeat squat jump frontal')) {
    actionPhrase = 'performing Repeat Squat Jumps Frontal on black athletic turf'
    steps = 'Athlete performs continuous, rhythmic squat jumps moving laterally side-to-side across the frontal plane.'
    gripCue = 'Frontal plane lateral repeat squat jumps: Athlete dips into a quarter squat loading hips and swinging arms back, then explodes laterally sideways and vertically across the frontal plane, achieving full triple extension at the peak with arms extended overhead before landing softly on both feet and immediately rebounding laterally.'
  } else if (lowerName === 'repeat squat jumps' || lowerName.includes('repeat squat jump')) {
    actionPhrase = 'performing Repeat Squat Jumps on black athletic turf'
    gripCue = 'Dynamic explosive plyometrics: Athlete is captured at the explosive vertical apex of a squat jump above black athletic turf, displaying full triple extension through ankles, knees, and hips, arms extended overhead with athletic power, eyes forward.'
  } else if (lowerName.includes('reverse crunch to knee up with rotation')) {
    actionPhrase = 'performing a Reverse Crunch To Knee Up With Rotation on black athletic turf'
    gripCue = 'Rotational core crunch: Athlete lies supine on black athletic turf with arms resting at sides. Athlete flexes hips and knees to 90 degrees, curling the pelvis up off the floor and rotating the knees slightly toward one side to engage the obliques while pressing palms into turf for stability.'
  } else if (lowerName.includes('active kneeling hip flexor')) {
    actionPhrase = 'performing an Active Kneeling Hip Flexor Stretch on black athletic turf'
    gripCue = 'Dynamic psoas stretch: Athlete assumes a tall half-kneeling stance on the black athletic turf with rear knee down on a pad, front knee bent at 90 degrees with foot flat. Athlete tucks the pelvis under (posterior tilt), squeezing the glute on the kneeling side and gently shifting hips forward while keeping torso perfectly vertical.'
  } else if (lowerName.includes('static upper trapezius stretch')) {
    actionPhrase = 'performing a Static Upper Trapezius Stretch on black athletic turf'
    gripCue = 'Cervical lateral flexion: Athlete sits tall with upright posture on black athletic turf, gently placing one hand over the crown of the head to draw the ear toward the shoulder, depressing the opposite shoulder downward to create a gentle static stretch along the upper trapezius.'
  } else if (lowerName.includes('smr peroneals')) {
    actionPhrase = 'performing Self Myofascial Release on Peroneals with a High-Density Foam Roller on black athletic turf'
    gripCue = 'Lateral calf foam rolling: Athlete lies side-lying on black athletic turf with a high-density black foam roller placed beneath the lateral side of the lower leg (peroneals between knee and ankle), supporting bodyweight with forearm and top foot placed on the turf in front.'
  } else if (lowerName.includes('activation ball prone wide row')) {
    actionPhrase = 'performing an Activation Ball Prone Wide Row with a Stability Ball and Matte Black Dumbbells'
    gripCue = 'Prone ball wide row: Athlete lies chest-down on a matte black GAA stability ball with toes dug into the black athletic turf for stability, holding two matte black dumbbells. Athlete pulls elbows wide out to the sides at 90 degrees, squeezing the rhomboids and rear deltoids at the top of the wide row.'
  } else if (lowerName.includes('repeat hurdle jump frontal') || lowerName.includes('repeat hurdle jumps frontal')) {
    actionPhrase = 'performing Repeat Hurdle Jump Frontal over low agility mini-hurdles on black athletic turf'
    steps = 'Athlete bounds continuously and laterally back and forth over a low agility mini-hurdle in the frontal plane.'
    gripCue = 'Frontal plane lateral hurdle bounding: Athlete is captured mid-air in dynamic lateral flight leaping sideways cleanly over a matte black 6-inch agility hurdle on black athletic turf, driving knees up with rhythmic explosive power, athletic arms pumping for momentum, landing softly on the balls of the feet and instantly rebounding sideways.'
  } else if (lowerName === 'repeat hurdle jumps') {
    actionPhrase = 'performing Repeat Hurdle Jumps over low agility hurdles on black athletic turf'
    gripCue = 'Continuous plyometric hurdles: Athlete is caught in dynamic mid-air bound leaping forward cleanly over a low 6-inch matte black agility hurdle on the black turf, driving knees up with rhythmic explosive triple extension, athletic arms swinging in opposition, eyes focused forward, ready to rebound immediately on landing.'
  } else if (lowerName.includes('repeat tuck jumps')) {
    actionPhrase = 'performing Repeat Tuck Jumps on black athletic turf'
    gripCue = 'Mid-air explosive tuck jump apex: Athlete is captured at the explosive vertical apex of a tuck jump, pulling both knees up tightly toward the chest with hips flexed, thighs parallel to the ground, chest tall and upright, arms bent in front for balance, suspended in air with high power.'
  } else if (lowerName.includes('active standing hip flexor')) {
    actionPhrase = 'performing an Active Standing Hip Flexor Stretch on black athletic turf'
    steps = 'Athlete stands in a forward-and-back lunge split stance on black athletic turf, facing forward down the turf.'
    gripCue = 'CRITICAL SAGITTAL SPLIT HIP FLEXOR STRETCH: Strictly forward-and-back lunge split stance (strictly NOT a side or lateral lunge). The athlete stands with the left leg forward (foot flat on the turf with knee bent at 90 degrees) and the right leg extended straight back behind the body with the rear heel elevated. The pelvis is tucked into an active posterior pelvic tilt (squeezing the right glute) to stretch the right anterior hip flexor and psoas. Torso is completely upright and vertical, chest tall and proud, with both hands resting on hips, facing directly forward down the length of the turf.'
  } else if (lowerName.includes('single leg romanian deadlift to pnf pattern 1') || lowerName === 'single leg romanian deadlift to pnf pattern') {
    actionPhrase = 'performing a Single Leg Romanian Deadlift To PNF Pattern on black athletic turf'
    gripCue = 'Unilateral balance hinge and diagonal reach: Standing on the right leg with a soft knee, athlete hinges forward at the hips with the left leg extended straight back in line with the torso parallel to the turf; opposite hand reaches down in a PNF diagonal pattern, maintaining a flat neutral back, square hips, and engaged core.'
  } else if (lowerName.includes('single leg romanian deadlift to pnf pattern 2')) {
    actionPhrase = 'performing a Single Leg Romanian Deadlift To PNF Pattern 2 with a Matte Black Dumbbell on black athletic turf'
    gripCue = 'Unilateral balance hinge and rotational reach: Standing on the right leg with soft knee, athlete hinges forward at the hips with the left leg extended straight back in line with torso parallel to turf; holding a matte black dumbbell in the left hand, athlete rotates torso across to the right hip in a PNF pattern, engaging glutes and hamstrings with a flat neutral spine.'
  } else if (lowerName.includes('quadruped arm raise')) {
    actionPhrase = 'performing a Quadruped Arm Raise on black athletic turf'
    gripCue = 'All-fours core stabilization: Athlete is in a quadruped tabletop position on knees and hands on black athletic turf. Keeping both knees grounded and hips level, athlete raises ONE arm straight forward in line with the ear and parallel to the floor, thumb pointed up, with zero torso rotation and rigid spinal alignment.'
  } else if (lowerName.includes('clamshells')) {
    actionPhrase = 'performing Clamshells on a black athletic mat'
    steps = 'Athlete lies on their side on a dark gym mat with hips and shoulders stacked vertically.'
    gripCue = 'CRITICAL CLAMSHELL ABDUCTION EXECUTION: Athlete lies on their side on a dark gym mat with head resting comfortably on the extended bottom arm, knees bent at 90 degrees, and feet/heels touching together. The athlete lifts and abducts the top knee high up toward the ceiling (opened wide at a 45-degree angle like an open clamshell), while keeping both heels and feet glued firmly together and the pelvis/hips stacked vertically without rolling backward, actively contracting and showcasing the gluteus medius.'
  } else if (lowerName.includes('static levator scapulae stretch')) {
    actionPhrase = 'performing a Static Levator Scapulae Stretch on black athletic turf'
    gripCue = 'Cervical rotation and flexion: Athlete sits tall with upright posture on black athletic turf. Athlete rotates head 45 degrees to the right and tucks chin down toward the right collarbone/armpit, resting the right hand gently on the crown of the head to deepen the stretch along the posterior-lateral neck, opposite left shoulder relaxed downward.'
  } else if (lowerName.includes('half kneeling tubing rotation')) {
    actionPhrase = 'performing a Half Kneeling Tubing Rotation with Resistance Tubing on black athletic turf'
    gripCue = 'Rotational core power: Athlete is in a tall half-kneeling 90/90 stance on black athletic turf with rear knee down on a pad. Resistance tubing is anchored to a matte black rig at chest height. Holding the tubing handle with both hands extended in front of the chest, athlete rotates torso across the front lead leg while keeping the pelvis, hips, and lower body rock-solid and stable.'
  } else if (lowerName.includes('dumbbell bent over extention') || lowerName.includes('dumbbell bent over extension')) {
    actionPhrase = 'performing a Dumbbell Bent Over Tricep Extension with Matte Black Dumbbells'
    gripCue = 'Bent-over tricep kickback: Athlete hinges at the hips with a flat back at 45 degrees, knees softly bent. Athlete has upper arms pinned high against the ribcage parallel to the torso, and extends both forearms straight backward with matte black dumbbells, locking out elbows and squeezing the triceps and posterior deltoids at the top.'
  } else if (lowerName.includes('lying leg curl two leg concentric single leg eccentric')) {
    actionPhrase = 'performing a Lying Leg Curl Two Leg Concentric Single Leg Eccentric on a Matte Black Lying Leg Curl Machine'
    steps = 'Athlete lies prone on the angled machine bench gripping front handles with hips anchored to pad.'
    gripCue = 'CRITICAL SINGLE-LEG ECCENTRIC CONTROL: The athlete lies prone on the padded bench with pelvis pressed down. The active right leg is curled upward with the knee flexed at 60 to 75 degrees, actively holding and lowering the padded roller pad under intense hamstring tension, while the non-working left leg is extended straight and resting on the bench, demonstrating single-leg eccentric hamstring control.'
  } else if (lowerName.includes('activation medial hamstring')) {
    actionPhrase = 'performing an Activation Medial Hamstring on black athletic turf'
    gripCue = 'Targeted hamstring activation: Athlete stands on one leg and hinges at the hips with a flat back, extending the opposite leg straight back in line with torso with foot slightly internally rotated to activate the medial hamstring, maintaining square hips and erect posture.'
  } else if (lowerName.includes('active supine biceps femoris')) {
    actionPhrase = 'performing an Active Supine Biceps Femoris Stretch on a black athletic mat'
    gripCue = 'Active isolated hamstring stretch: Athlete lies supine on a dark gym mat with lower back flat against the floor. Athlete holds the back of one thigh with hands, extending the knee straight upward toward the ceiling to create an active dynamic stretch in the hamstring/biceps femoris, opposite leg extended flat on mat.'
  } else if (lowerName.includes('active lat ball')) {
    actionPhrase = 'performing an Active Lat Ball Stretch on black athletic turf with a Stability Ball'
    gripCue = 'Dynamic latissimus dorsi stretch: Athlete kneels tall on black athletic turf behind a matte black stability ball, rolling the ball forward with both arms extended and thumbs pointed upward, depressing the chest toward the turf to stretch the latissimus dorsi with a flat neutral spine.'
  } else if (lowerName.includes('single leg balance reach transverse')) {
    actionPhrase = 'performing a Single Leg Balance Reach Transverse on black athletic turf'
    gripCue = 'Multiplanar single-leg balance: Standing on the right leg with soft knee and hands on hips, athlete reaches the left foot across in the transverse plane (rotational reach) while maintaining dynamic balance, upright posture, and level shoulders on black athletic turf.'
  } else if (lowerName.includes('single leg lift and chop')) {
    actionPhrase = 'performing a Single Leg Lift And Chop with a Matte Black Medicine Ball on black athletic turf'
    gripCue = 'Rotational core balance: Athlete balances on the right leg with left knee lifted to 90 degrees at hip height. Holding a matte black GAA medicine ball with both hands, athlete rotates torso diagonally, chopping the ball down toward the hip while maintaining rock-solid single-leg balance.'
  } else if (lowerName.includes('ball combo i')) {
    actionPhrase = 'performing Ball Combo I on a Stability Ball on black athletic turf'
    gripCue = 'Scapular stabilization on ball: Athlete lies chest-down (prone) on a matte black stability ball with toes dug into turf for stability, raising both arms upward and outward into a high Y-position with thumbs pointing toward the ceiling, retracting and depressing scapulae.'
  } else if (lowerName.includes('supported bent over dumbbell extension')) {
    actionPhrase = 'performing a Supported Bent Over Dumbbell Extension on a Flat Leather Bench'
    gripCue = 'Bench-supported tricep kickback: Athlete supports body on a flat leather bench with left knee and left hand, right foot on turf, back flat and horizontal. Right upper arm is pinned high against the ribcage, extending the right forearm straight back with a matte black dumbbell to full elbow lockout, squeezing the triceps.'
  } else if (lowerName.includes('ladder jumping jacks')) {
    actionPhrase = 'performing Ladder Jumping Jacks on an Agility Ladder on black athletic turf'
    gripCue = 'Dynamic footwork agility: Athlete is captured mid-jump over a matte black agility ladder laid flat on black athletic turf, feet straddling the ladder rungs with arms raised outward in jumping jack coordination, displaying quick athletic footwork and upright posture.'
  } else if (lowerName.includes('depth jump frontal')) {
    actionPhrase = 'performing a Depth Jump Frontal off a Plyo Box on black athletic turf'
    steps = 'Athlete stands on a matte black 18-inch plyo box, steps off to land softly on black turf, and instantly rebounds into a maximal vertical leap.'
    gripCue = 'Explosive vertical plyometric rebound: Athlete has stepped off a matte black GAA 18-inch plyometric box and is captured at the explosive vertical apex of the rebound jump directly in front of the box, reaching both arms straight up toward the ceiling with full triple extension through the ankles, knees, and hips, eyes fixed forward.'
  } else if (lowerName.includes('incline stance single arm row')) {
    actionPhrase = 'performing an Incline Stance Single Arm Row with a Matte Black Dumbbell'
    steps = 'Athlete hinges at the hips into a 45-degree forward torso incline, resting one hand on the forward thigh for solid bracing.'
    gripCue = 'Single-arm dumbbell row: Athlete holds a solid 45-degree forward torso incline with flat neutral spine. Left hand rests firmly on the left thigh for support. With the right hand holding a matte black dumbbell, athlete pulls the dumbbell upward to the hip, pinning the right elbow tight against the ribcage and retracting the right scapula with intense lat contraction.'
  } else if (lowerName.includes('medicine ball push up to 3 point')) {
    actionPhrase = 'performing a Medicine Ball Push Up To 3 Point on black athletic turf'
    steps = 'Athlete performs a push-up with one hand atop a medicine ball, then rotates into a side 3-point plank.'
    gripCue = 'Dynamic rotational core push-up: Athlete starts with the right hand planted firmly on a matte black GAA medicine ball and left hand on the turf; pushing up explosively, athlete rotates torso upward to the left, extending the left arm straight toward the ceiling in a 3-point side plank T-stabilization, stacking shoulders vertically while maintaining a rigid core and level hips.'
  } else if (lowerName === 'single leg throw and catch') {
    actionPhrase = 'performing a Single Leg Throw And Catch with a Matte Black Medicine Ball on black athletic turf'
    steps = 'Athlete balances on one leg with upright posture, holding a medicine ball at chest height.'
    gripCue = 'Unilateral dynamic balance and ball toss: Athlete balances with rock-solid stability on the right leg with slight knee bend on black athletic turf, with the left knee flexed at 90 degrees and hovering at hip height. Torso is tall and upright. Athlete holds a matte black GAA medicine ball at chest level with both hands, captured in dynamic athletic balance releasing or catching the ball with total postural control.'
  } else if (lowerName.includes('activation standing glute max')) {
    actionPhrase = 'performing an Activation Standing Glute Max on black athletic turf'
    steps = 'Athlete stands tall on one leg with hands on hips, extending the opposite straight leg backward.'
    gripCue = 'Targeted gluteus maximus activation: Athlete stands upright on the right leg with a soft knee on black athletic turf, hands placed on hips for balance. Athlete extends the left leg straight backward 12 to 15 inches off the floor through pure gluteus maximus contraction, keeping the hips perfectly square and the lumbar spine completely neutral without lower back hyperextension.'
  } else if (lowerName.includes('smr lateral thigh')) {
    actionPhrase = 'performing Self Myofascial Release on Lateral Thigh with a High-Density Foam Roller on black athletic turf'
    steps = 'Athlete lies on their side with a high-density black foam roller positioned under the outer lateral thigh.'
    gripCue = 'Lateral thigh foam rolling: Athlete is side-lying on black athletic turf with a high-density black foam roller placed beneath the lateral side of the bottom right thigh (between hip and knee). Athlete supports upper body on the right forearm, with the left top leg crossed over with foot flat on the turf in front for stability and pressure control, slowly rolling along the IT band and vastus lateralis.'
  } else if (lowerName.includes('smr thoracic spine')) {
    actionPhrase = 'performing Self Myofascial Release on Thoracic Spine with a High-Density Foam Roller on black athletic turf'
    steps = 'Athlete lies supine with knees bent and a high-density black foam roller placed horizontally across the mid-upper back.'
    gripCue = 'Thoracic spine foam rolling: Athlete lies supine on black athletic turf with knees bent and feet flat on the floor, hips elevated slightly off the turf. A high-density black foam roller is placed horizontally across the upper back (thoracic spine below shoulder blades). Athlete crosses arms over chest with hands on opposite shoulders, extending upper spine gently over the roller with relaxed neck and shoulders.'
  } else if (lowerName.includes('step up to balance frontal') && !lowerName.includes('curl')) {
    actionPhrase = 'performing a Step Up To Balance Frontal on a Matte Black Plyo Box'
    steps = 'Athlete steps up onto a sturdy plyo box and drives the trailing knee up to hip level in a tall single-leg balance.'
    gripCue = 'Frontal plane step-up to unilateral balance: Athlete steps up onto a sturdy matte black GAA plyometric box with the right foot, extending the right hip and knee to full vertical lockout at the top of the box. The left knee is driven upward to hip height at 90 degrees of flexion in a tall, upright, confident single-leg balance pose, chest proud, shoulders back, hands in athletic running arm posture.'
  } else if (lowerName.includes('zig zag shuffle')) {
    actionPhrase = 'performing a Zig Zag Shuffle on black athletic turf'
    steps = 'Athlete moves laterally and diagonally in a low, athletic ready stance across black turf.'
    gripCue = 'Agility cutting footwork: Athlete is captured in a low, explosive athletic ready stance on black athletic turf, knees deeply bent and hips back, planting hard off the outside foot to change direction along an agility zig-zag pattern, torso forward at 45 degrees, arms bent in athletic ready position, eyes focused sharply ahead.'
  } else if (lowerName.includes('activation medial gastrocnemius')) {
    actionPhrase = 'performing an Activation Medial Gastrocnemius on black athletic turf'
    steps = 'Athlete stands tall with feet hip-width apart, rising onto the balls of the feet with emphasis on inner foot pressure.'
    gripCue = 'Medial calf peak contraction: Athlete stands tall on black athletic turf with feet hip-width apart and toes pointing slightly outward (subtle external rotation). Athlete rises high onto the balls of the feet into full plantarflexion, driving weight through the first metatarsal (big toe ball) to maximally isolate and squeeze the medial head of the gastrocnemius, holding a peak calf contraction with chest tall and hands on hips.'
  } else if (lowerName.includes('transverse box jump down to tuck jump')) {
    actionPhrase = 'performing a Transverse Box Jump Down To Tuck Jump with a Plyometric Box on black athletic turf'
    steps = 'Athlete stands on a matte black 18-inch plyo box, steps down with a 90-degree transverse rotation, and immediately rebounds into an explosive vertical tuck jump.'
    gripCue = 'Multiplanar plyometric rebound: Athlete has stepped off a matte black GAA 18-inch plyometric box with a 90-degree transverse rotation and is captured at the explosive vertical apex of the tuck jump directly beside the box, pulling both knees up tightly toward the chest with thighs parallel to the turf, chest tall, arms bent in front for balance.'
  } else if (lowerName.includes('repeat hurdle jumps transverse')) {
    actionPhrase = 'performing Repeat Hurdle Jumps Transverse over low agility hurdles on black athletic turf'
    steps = 'Athlete bounds continuously and rhythmically over a low agility mini-hurdle with 90-degree transverse body alignment.'
    gripCue = 'Transverse plyometric bounding: Athlete is captured mid-air leaping cleanly over a matte black 6-inch agility hurdle on black turf with body oriented transversely, driving knees up with rhythmic explosive power, athletic arms pumping in opposition, eyes focused forward, ready to rebound immediately on landing.'
  } else if (lowerName.includes('4 point quadruped t drill')) {
    actionPhrase = 'performing a 4 Point Quadruped T Drill on black athletic turf'
    steps = 'Athlete begins in a quadruped tabletop position on hands and knees, extending opposite arm and leg out laterally into a T shape.'
    gripCue = 'Quadruped lateral T-stabilization: Athlete is in a tabletop quadruped pose on black athletic turf with left hand and right knee grounded. The right arm is extended straight out to the side at shoulder height and the left leg is extended straight out laterally at hip height, creating a wide horizontal T-shape with the limbs parallel to the turf while maintaining a rock-solid flat neutral spine.'
  } else if (lowerName.includes('frontal box jump down to tuck jump')) {
    actionPhrase = 'performing a Frontal Box Jump Down To Tuck Jump with a Plyometric Box on black athletic turf'
    steps = 'Athlete steps off a plyo box in the frontal plane and instantly explodes into a vertical tuck jump.'
    gripCue = 'Frontal plyometric rebound: Athlete has stepped down off a matte black GAA 18-inch plyometric box and is captured at the vertical apex of the explosive rebound tuck jump directly in front of the box, pulling both knees up high toward the chest, thighs parallel to turf, arms bent in athletic balance, eyes forward.'
  } else if (lowerName.includes('single leg throw and catch transverse 1')) {
    actionPhrase = 'performing a Single Leg Throw And Catch Transverse 1 with a Matte Black Medicine Ball on black athletic turf'
    steps = 'Athlete balances on one leg with upright posture, rotating torso to throw and catch a medicine ball across the transverse plane.'
    gripCue = 'Transverse rotational single-leg balance: Standing with rock-solid stability on the right leg with slight knee bend on black athletic turf, opposite left knee flexed at 90 degrees at hip level. Torso rotates 45 degrees to the right side of the standing leg, holding a matte black GAA medicine ball at chest level with both hands in dynamic throwing/catching motion with total rotational core control.'
  } else if (lowerName.includes('leg circuit frontal')) {
    actionPhrase = 'performing a Leg Circuit Frontal on black athletic turf'
    steps = 'Athlete stands tall on one leg and performs a controlled straight-leg abduction in the frontal plane.'
    gripCue = 'Frontal plane unilateral leg abduction: Athlete stands tall and upright on the left leg with hands on hips on black athletic turf, lifting the straight right leg outward to the side in the frontal plane to 45 degrees of abduction, maintaining a level pelvis, erect spine, and engaged gluteus medius.'
  } else if (lowerName.includes('activation posterior tibialis')) {
    actionPhrase = 'performing an Activation Posterior Tibialis with a Resistance Band on black athletic turf'
    steps = 'Athlete performs active foot inversion against band tension to isolate and activate the posterior tibialis.'
    gripCue = 'Posterior tibialis isolation: Athlete sits upright on black athletic turf with legs extended forward. A matte black GAA resistance band is looped around the forefoot of the active right foot; athlete actively inverts the foot (pulling the sole and big toe inward and upward against band resistance), intensely contracting the posterior tibialis along the medial lower leg and inner ankle.'
  } else if (lowerName.includes('single leg throw and catch transverse 2')) {
    actionPhrase = 'performing a Single Leg Throw And Catch Transverse 2 with a Matte Black Medicine Ball on black athletic turf'
    steps = 'Athlete balances on one leg with the trailing leg hovering behind, rotating torso across the transverse plane holding a medicine ball.'
    gripCue = 'Dynamic transverse balance and rotational toss: Athlete balances on the left leg with slight knee bend on black athletic turf, right leg hovering slightly behind with knee flexed. Athlete holds a matte black GAA medicine ball at chest level with both hands, dynamically rotating the torso across the transverse plane with rock-solid anti-rotational core stability and level shoulders.'
  } else if (lowerName.includes('mb figure 8')) {
    actionPhrase = 'performing an MB Figure 8 with a Matte Black Medicine Ball on black athletic turf'
    steps = 'Athlete stands in an athletic ready stance, moving a medicine ball smoothly in a continuous figure-8 rotational pattern around the torso and hips.'
    gripCue = 'Dynamic rotational medicine ball tracking: Athlete stands with feet shoulder-width apart in an athletic quarter-squat on black athletic turf with flat neutral back and braced core. Holding a matte black GAA medicine ball with both hands, athlete guides the ball smoothly through a figure-8 loop across the body from hip to opposite shoulder, eyes tracking the ball with fluid core rotational control.'
  } else if (lowerName.includes('crossover ladder drill')) {
    actionPhrase = 'performing an In In Out Out Crossover Ladder Drill on an Agility Ladder on black athletic turf'
    steps = 'Athlete performs rapid multi-directional crossover footwork through an agility ladder laid flat on turf.'
    gripCue = 'High-speed agility ladder crossover: Athlete is captured in mid-stride over a matte black agility ladder laid flat on black athletic turf, knees bent in a low athletic ready stance, feet executing a rapid crossover step into and out of the ladder rungs with sharp footwork precision, arms pumping in rhythm, eyes focused down the ladder.'
  } else if (lowerName.includes('activation anterior tibialis')) {
    actionPhrase = 'performing an Activation Anterior Tibialis on a Flat Leather Bench'
    steps = 'Athlete sits tall on a flat leather bench with knees bent at 90 degrees and heels planted firmly on black athletic turf.'
    gripCue = 'Anterior tibialis dorsiflexion: Athlete sits upright on a flat leather bench with hands resting on thighs. Keeping heels glued to the black athletic turf, athlete pulls both forefeet and toes strongly upward toward the shins into maximal active ankle dorsiflexion, intensely contracting and highlighting the anterior tibialis muscle along the front of the shins.'
  } else if (lowerName.includes('single leg romanian deadlift single arm curl to overhead press')) {
    actionPhrase = 'performing a Single Leg Romanian Deadlift Single Arm Curl To Overhead Press with a Matte Black Dumbbell on black athletic turf'
    steps = 'Athlete balances on one leg, seamlessly flowing from a single-leg hip hinge into a standing single-arm curl and vertical overhead press.'
    gripCue = 'Contralateral single-leg curl to overhead press: Athlete balances on the right leg on black athletic turf with the left knee flexed at 90 degrees at hip level in a tall upright single-leg balance. With the left hand holding a matte black dumbbell, athlete presses the dumbbell straight overhead to vertical lockout, right arm balancing out to the side, maintaining a flat neutral spine and squared shoulders.'
  } else if (lowerName.includes('single leg romanian deadlift curl to overhead press')) {
    actionPhrase = 'performing a Single Leg Romanian Deadlift Curl To Overhead Press with Matte Black Dumbbells on black athletic turf'
    steps = 'Athlete balances on one leg, transitioning smoothly from a single-leg hip hinge into a standing bicep curl and vertical overhead press.'
    gripCue = 'Unilateral balance curl to overhead press: Athlete balances with rock-solid stability on the right leg on black athletic turf with the left knee driven upward to hip height at 90 degrees in a tall single-leg balance pose. Athlete presses a matte black dumbbell directly overhead with the arm locked out vertically above the shoulder, opposite arm balancing at the side, displaying complete multi-joint stability and tall upright posture.'
  } else if (lowerName.includes('dumbbell combination curl')) {
    actionPhrase = 'performing a Dumbbell Combination Curl with Matte Black Dumbbells'
    steps = 'Athlete stands tall with feet shoulder-width apart, elbows pinned close to torso, curling dumbbells with precision.'
    gripCue = 'Bilateral bicep curl apex: Athlete stands tall with upright posture on black athletic turf, elbows pinned tight against the sides of the ribcage. Both forearms are curled upward to shoulder height with palms supinated facing the shoulders, holding matte black GAA dumbbells with an intense peak contraction in the biceps brachii, neutral wrists, chest proud.'
  } else if (lowerName.includes('quadruped march')) {
    actionPhrase = 'performing a Quadruped March on black athletic turf'
    steps = 'Athlete starts on all fours in tabletop position, marching opposite knee and hand rhythmically off the turf with core stability.'
    gripCue = 'All-fours contralateral march: Athlete maintains a tabletop quadruped pose on black athletic turf with hands under shoulders and flat neutral spine. Athlete lifts the left hand a few inches off the floor reaching forward and hovers the right knee a few inches off the turf driving slightly forward, holding a stable contralateral hover with zero pelvic shift or lumbar rotation.'
  } else if (lowerName.includes('floor prone cobra')) {
    actionPhrase = 'performing a Floor Prone Cobra on black athletic turf'
    steps = 'Athlete lies prone face-down on black athletic turf, lifting chest and extending arms along torso with thumbs toward the ceiling.'
    gripCue = 'Prone postural cobra: Athlete lies face-down on black athletic turf with toes grounded. Athlete elevates the chest and head a few inches off the turf through thoracic extension, extending both arms back along the sides of the torso with arms externally rotated and thumbs pointing straight up toward the ceiling, actively retracting and depressing the scapulae with neutral cervical alignment.'
  } else if (lowerName.includes('single leg balance reach multiplanar')) {
    actionPhrase = 'performing a Single Leg Balance Reach Multiplanar on black athletic turf'
    steps = 'Athlete balances on one leg with hands on hips, reaching the opposite leg dynamically through multiplanar space.'
    gripCue = 'Multiplanar balance reach: Standing tall and upright on the right leg with a soft knee on black athletic turf, hands firmly on hips. The left foot is actively reaching forward and outward hovering just above the turf in a controlled reach, maintaining a level pelvis, erect tall posture, and unwavering single-leg dynamic stability.'
  } else if (lowerName.includes('static 3d kneeling hip flexor stretch')) {
    actionPhrase = 'performing a Static 3D Kneeling Hip Flexor Stretch on black athletic turf'
    steps = 'Athlete assumes a tall half-kneeling 90/90 stance, tucking the pelvis and gently extending and side-bending the torso.'
    gripCue = 'Tri-planar psoas stretch: Athlete is in a tall half-kneeling 90/90 stance on black athletic turf with rear right knee down on a dark pad and left foot flat forward. Athlete engages a posterior pelvic tilt squeezing the right glute, extending the right arm overhead and gently side-bending and rotating the torso slightly to the left to produce a deep 3D multi-planar stretch across the right anterior hip flexor and abdominal wall.'
  } else if (lowerName.includes('sternocleidomastoid stretch')) {
    actionPhrase = 'performing a Sternocleidomastoid Stretch on black athletic turf'
    steps = 'Athlete stands or sits tall with upright posture, tilting and rotating the head gently to stretch the sternocleidomastoid.'
    gripCue = 'Cervical extension and lateral rotation: Athlete stands tall on black athletic turf with shoulders depressed and retracted, hands resting comfortably at sides. Athlete tilts the head slightly backward and to the left while rotating the chin slightly upward to the right, creating a focused, gentle static stretch along the right anterior-lateral neck (sternocleidomastoid muscle).'
  } else if (lowerName === 'leg circuit') {
    actionPhrase = 'performing a Leg Circuit with Matte Black Dumbbells on black athletic turf'
    steps = 'Athlete performs a dynamic lower body circuit holding dumbbells at sides with tall posture.'
    gripCue = 'Lower body compound circuit: Athlete is captured in a deep athletic walking lunge on black athletic turf, front thigh parallel to the floor, rear knee hovering 2 inches off the turf, holding two matte black dumbbells at sides with arms extended straight down, chest upright and proud, core braced, eyes forward.'
  } else if (lowerName.includes('ice skater with stabilization')) {
    actionPhrase = 'performing Ice Skater With Stabilization on black athletic turf'
    steps = 'Athlete bounds laterally across black athletic turf and freezes in a single-leg landing stabilization.'
    gripCue = 'Lateral bounding plyometric stabilization: Athlete bounds laterally across the black athletic turf, landing softly on the left leg in a balanced quarter squat (knee flexed ~45° tracking over second toe). The right leg is swept behind the body without touching the floor (curtsey position in mid-air), right arm reached across the torso toward the left knee, left arm extended out for counter-balance, chest proud, holding the balanced single-leg landing stabilization for 3 seconds.'
  } else if (lowerName.includes('two ins ladder drill') || lowerName.includes('two in ladder')) {
    actionPhrase = 'performing Two Ins Ladder Drill on an Agility Ladder laid flat on black athletic turf'
    steps = 'Athlete moves rapidly through an agility ladder placing both feet in each rung with quick footwork.'
    gripCue = 'High-speed footwork ladder drill: Athlete performs rapid footwork along a black agility ladder laid flat on the turf, stepping both feet into each ladder rung (two feet in each square) in rapid succession on the balls of the feet with knees bent, chest forward, low athletic center of gravity, and arms pumping dynamically at 90 degrees.'
  } else if (lowerName.includes('power step up')) {
    actionPhrase = 'performing a Power Step Up on a Plyometric Box on black athletic turf'
    steps = 'Athlete explosively drives off one foot on top of a plyometric box, launching vertically into the air.'
    gripCue = 'Explosive unilateral plyometric step up: Athlete places one foot firmly on top of a sturdy black plyometric box on black athletic turf, driving explosively through the elevated heel to launch vertically upward into the air. At the vertical apex of the jump, the opposite non-working leg drives aggressively upward with knee flexed to 90 degrees at hip level, arms swinging explosively for height, landing softly back on the box with control.'
  } else if (lowerName.includes('quadruped leg raise')) {
    actionPhrase = 'performing a Quadruped Leg Raise on black athletic turf'
    steps = 'Athlete maintains a tabletop quadruped stance on black turf, lifting one extended leg backward and upward with glute activation.'
    gripCue = 'Unilateral quadruped hip extension: Athlete maintains an all-fours tabletop pose on black athletic turf with hands under shoulders, knees under hips, and a rigid neutral spine. Athlete extends the right leg straight back and lifts it to hip height, contracting the gluteus maximus while maintaining perfectly square hips and zero pelvic rotation or lumbar hyperextension, eyes fixed to the turf.'
  } else if (lowerName.includes('active standing adductor')) {
    actionPhrase = 'performing an Active Standing Adductor exercise on black athletic turf'
    steps = 'Athlete stands tall on one leg with hands on hips, actively adducting and abducting the opposite straight leg in the frontal plane.'
    gripCue = 'Frontal plane hip control: Athlete stands tall and upright on the left leg with hands on hips on black athletic turf. Athlete sweeps the straight right leg dynamically across the midline of the body in controlled adduction, keeping the pelvis level, chest proud, core engaged, and gaze forward.'
  } else if (lowerName.includes('single leg single arm scaption')) {
    actionPhrase = 'performing a Single Leg Single Arm Scaption with strictly ONE single Matte Black Dumbbell on black athletic turf'
    steps = 'Athlete balances on one leg while raising a single dumbbell at a 45-degree angle in the scapular plane.'
    gripCue = 'Contralateral single-leg scaption: Athlete balances with rock-solid stability on the right leg with slight knee bend on black athletic turf. Holding strictly ONE single matte black dumbbell in the opposite left hand, athlete raises the arm straight to shoulder height in the scapular plane (30 to 45 degrees forward of the torso) with thumb pointing upward (neutral grip), right arm extended out for balance, spine erect, chest proud.'
  } else if (lowerName.includes('activation standing shoulder ext rotation')) {
    actionPhrase = 'performing an Activation Standing Shoulder External Rotation with a Heavy Resistance Band'
    steps = 'Athlete stands tall holding a resistance band with elbows bent at 90 degrees and pinned to the ribcage, rotating forearms outward.'
    gripCue = 'Rotator cuff external rotation: Athlete stands tall on black athletic turf with feet shoulder-width apart. Holding a matte black GAA resistance band with palms supinated (facing upward), athlete keeps elbows pinned firmly to the sides of the ribcage while pulling the band apart by externally rotating forearms outward, intensely squeezing the infraspinatus and posterior rotator cuff with scapular retraction.'
  } else if (lowerName.includes('reverse lunge to row')) {
    actionPhrase = 'performing a Reverse Lunge To Row with Matte Black Dumbbells on black athletic turf'
    steps = 'Athlete steps back into a reverse lunge while simultaneously rowing dumbbells into the ribcage.'
    gripCue = 'Compound lunge row: Athlete steps back into a deep reverse lunge on black athletic turf with the front knee stacked over the ankle and rear knee hovering 2 inches off the turf. At the bottom of the lunge, athlete rows two matte black dumbbells smoothly up to the ribcage with elbows driving back and shoulder blades retracting, torso held tall and upright with strong core bracing.'
  } else if (lowerName.includes('modified push up')) {
    actionPhrase = 'performing a Modified Push Up on black athletic turf'
    steps = 'Athlete assumes a kneeling push-up position with a rigid straight line from head to knees.'
    gripCue = 'Kneeling push-up mechanics: Athlete assumes a modified push-up position with knees resting comfortably on black athletic turf and hands placed slightly wider than shoulder-width. Athlete maintains a rigid straight plank line from knees through hips to shoulders, lowering the chest until hovering 2 inches off the turf with elbows tracking at 45 degrees, pressing back up smoothly with core locked.'
  } else if (lowerName.includes('split stance row')) {
    actionPhrase = 'performing a Split Stance Row with strictly ONE single Matte Black Dumbbell on black athletic turf'
    steps = 'Athlete assumes an athletic split stance with torso hinged forward at 45 degrees, rowing a dumbbell to the ribcage.'
    gripCue = 'Unilateral split stance row: Athlete sets up in an athletic split stance on black athletic turf (left foot forward, right foot back) with torso hinged forward at a flat 45-degree angle. Holding strictly ONE single matte black dumbbell in the right hand, athlete rows the dumbbell smoothly up toward the hip with elbow tucked tight to the body and lat contracted, left forearm resting lightly on the forward thigh for support.'
  } else if (lowerName.includes('activation ball prone shoulder press')) {
    actionPhrase = 'performing an Activation Ball Prone Shoulder Press face-down on a Stability Ball with Matte Black Dumbbells'
    steps = 'CRITICAL PRONE ORIENTATION (STOMACH AND CHEST RESTING ON THE BALL, NEVER ON BACK, NEVER SUPINE): Athlete lies completely face-down with stomach and torso resting over the apex of a matte black stability ball, legs extended behind with toes anchored on black athletic turf.'
    gripCue = 'Prone overhead Y-press on ball: Captured in a single continuous camera frame from a 45-degree angle. Athlete lies prone face-down with chest resting on the stability ball, neck in neutral alignment looking toward the turf. Holding strictly two lightweight matte black dumbbells, athlete raises and presses both arms forward and overhead in a Y-formation in line with the torso, contracting the posterior deltoids, middle/lower trapezius, and upper back (strictly prone on stomach, NOT lying on back, NOT bench pressing).'
  } else if (lowerName.includes('prisoner squat calf raise')) {
    actionPhrase = 'performing a Prisoner Squat Calf Raise on black athletic turf'
    steps = 'Athlete performs a bodyweight squat with hands behind head, rising seamlessly into an explosive calf raise.'
    gripCue = 'Prisoner squat to plantarflexion: Athlete stands with feet shoulder-width apart, fingers interlaced lightly behind the head with elbows flared wide in a prisoner position. Athlete squats to parallel depth with a proud upright chest, then extends powerfully through hips and knees, continuing seamlessly onto the balls of the feet into full active plantarflexion (calf raise), squeezing the calves at peak height.'
  } else if (lowerName.includes('half kneeling throw and catch')) {
    actionPhrase = 'performing a Half Kneeling Throw And Catch with a Matte Black Medicine Ball on black athletic turf'
    steps = 'Athlete assumes a half-kneeling 90/90 stance on black turf, holding a matte black medicine ball at chest level.'
    gripCue = 'Rotational half-kneeling core drill: Athlete assumes a stable half-kneeling position on black athletic turf with rear knee down on a pad and front foot planted firmly. Holding a matte black GAA medicine ball at chest level with both hands, athlete dynamically rotates the torso across the transverse plane in a powerful throwing and catching motion while maintaining rock-solid anti-rotational pelvic stability.'
  } else if (lowerName.includes('one ins ladder drill') || lowerName.includes('one in ladder')) {
    actionPhrase = 'performing One Ins Ladder Drill on an Agility Ladder laid flat on black athletic turf'
    steps = 'Athlete performs rapid linear footwork stepping one foot into each agility ladder rung down the turf.'
    gripCue = 'High-cadence single-foot ladder drill: Athlete is captured in dynamic forward motion along a black agility ladder laid flat on black athletic turf, placing exactly ONE foot in each square ("one in") in rapid sprint cadence on the balls of the feet, knees driving upward, chest forward, arms pumping at 90 degrees with razor-sharp agility.'
  } else if (lowerName.includes('incline stance curl to overhead press')) {
    actionPhrase = 'performing an Incline Stance Curl To Overhead Press with Matte Black Dumbbells and an Incline Leather Bench'
    steps = 'Athlete leans back against an incline leather bench with dumbbells at sides, curling to shoulders and pressing overhead.'
    gripCue = 'Incline bicep curl to vertical press: Athlete leans back against an incline leather bench with back supported and core braced. Athlete curls two matte black dumbbells upward with palms supinated (facing shoulders), then smoothly transitions at shoulder height to press both dumbbells straight overhead to full vertical elbow lockout, maintaining neutral wrists, flat back, and squared shoulders.'
  } else if (lowerName.includes('long lever ball crunch')) {
    actionPhrase = 'performing a Long Lever Ball Crunch lying on back on a mat on black athletic turf while holding a Stability Ball overhead in hands'
    steps = 'Athlete lies on back on a workout mat with knees bent and feet flat on the ground. Athlete holds a stability ball in both hands with arms stretched straight overhead behind head (long lever arm), curling shoulder blades off the mat.'
    gripCue = 'CRITICAL FLOOR MAT ORIENTATION: Athlete is NOT lying on the ball. Athlete\'s back is resting flat on a workout mat on the turf with knees bent at 90 degrees and feet flat. Both hands grip the sides of a matte black GAA stability ball, holding it with elbows straight overhead past the ears in an extended long lever. Athlete contracts the abdominals to curl the head and upper shoulders off the mat, driving the ball upward toward the ceiling and knees in controlled spinal flexion.'
  } else if (lowerName.includes('step up to balance sagital') || lowerName.includes('step up to balance sagittal')) {
    actionPhrase = 'performing Step Up To Balance Sagital standing tall on a Plyometric Box on black athletic turf'
    steps = 'Athlete stands fully erect and upright on top of a plyometric box on one straight leg, holding a runner balance pose with the opposite knee bent at 90 degrees.'
    gripCue = 'CRITICAL UPRIGHT SINGLE-LEG POSTURE: Athlete stands fully tall and upright on top of a matte black GAA plyometric box, NOT squatting, standing leg completely straight and extended with locked hip and knee. Athlete balances gracefully on this single straight stance leg, with the opposite non-weight-bearing leg lifted into the air with knee bent at a sharp 90-degree angle at hip height in a classic runner stabilization posture, hands on hips or at sides, chest tall and proud.'
  } else if (lowerName.includes('split jerk')) {
    actionPhrase = 'performing a Split Jerk with a Knurled Olympic Barbell in an elite sports performance facility'
    steps = 'Athlete explosively drives an Olympic barbell from front rack into an overhead split jerk catch.'
    gripCue = 'Olympic split jerk catch apex: Athlete is captured at the explosive catch of a split jerk, pressing a knurled Olympic barbell with matte black GAA bumper plates straight overhead to rigid vertical lockout directly over the ears. Feet are split in a dynamic staggered lunge (front shin vertical, rear knee softly bent with heel elevated), core locked in steel-like stability, eyes focused forward.'
  } else if (lowerName.includes('lunge to balance frontal')) {
    actionPhrase = 'performing a Lunge To Balance Frontal on black athletic turf'
    steps = 'Athlete steps laterally into a frontal plane side lunge, then pushes powerfully back into a single-leg balance.'
    gripCue = 'Frontal plane lateral lunge to balance: Athlete steps out laterally into a deep side lunge on black athletic turf, sitting hips back over the bent leg with trailing leg straight, then pushes explosively off the lateral heel to return to a tall single-leg balance on the stance leg, driving the opposite knee up to hip level at 90 degrees with hands on hips and level pelvis.'
  } else if (lowerName === 'iron cross' || lowerName.includes('iron cross')) {
    actionPhrase = 'performing an Iron Cross dynamic mobility stretch on black athletic turf'
    steps = 'Athlete lies supine with arms outstretched in a T-position, rotating one leg across the hips to touch the floor on the opposite side while keeping both shoulders pinned.'
    gripCue = 'Side angle view of supine hip crossover stretch: Athlete lies flat on back on black athletic turf with arms outstretched to the sides forming a T-shape. Left leg remains straight and resting flat along the turf. The right leg is lifted and swept across the hips to the left side, foot reaching toward the left hand to stretch the glute, IT band, and lumbar spine. Both shoulders remain pinned flat to the turf with chest facing up, demonstrating elite rotational flexibility.'
  } else if (lowerName === 'jumping jacks' || lowerName.includes('jumping jack')) {
    actionPhrase = 'performing Jumping Jacks on black athletic turf'
    steps = 'Athlete jumps rhythmically spreading feet shoulder-width apart while raising arms overhead.'
    gripCue = 'Dynamic plyometric jumping jack: Athlete is captured in mid-air at the wide apex of a jumping jack over black athletic turf, feet spread slightly wider than shoulder-width, arms swept overhead in a wide symmetrical V with elbows softly extended, core braced, landing softly on the balls of the feet with rhythmic athletic precision.'
  } else if (lowerName.includes('supine biceps femoris stretch')) {
    actionPhrase = 'performing a Supine Biceps Femoris Stretch on black athletic turf'
    steps = 'Athlete lies supine on black turf, gently holding the back of one extended straight leg to stretch the hamstring.'
    gripCue = 'Supine hamstring stretch: Athlete lies flat on back on black athletic turf with the non-working leg extended flat on the ground. Athlete elevates the straight active leg toward the ceiling, clasping both hands behind the thigh/calf to gently draw the leg toward the chest into a deep, relaxing stretch along the biceps femoris (hamstrings), maintaining a relaxed neck and flat pelvis.'
  } else if (lowerName.includes('core ball crunch')) {
    actionPhrase = 'performing a Core Ball Crunch on a Stability Ball on black athletic turf'
    steps = 'Athlete lies supine with lower back draped over a stability ball, curling upper torso toward hips in controlled abdominal flexion.'
    gripCue = 'Stability ball core crunch: Athlete is positioned supine over a matte black GAA stability ball with feet planted shoulder-width apart flat on the floor, knees bent at 90 degrees. Lower back is supported by the curve of the ball. With fingertips lightly touching temples and elbows wide, athlete contracts the abdominal wall to curl the ribcage toward the pelvis, chin tucked slightly, exhaling into full core contraction without pulling on the neck.'
  } else if (lowerName.includes('latissimus dorsi ball stretch')) {
    actionPhrase = 'performing a Latissimus Dorsi Ball Stretch with a Stability Ball on black athletic turf'
    steps = 'Athlete kneels in front of a stability ball, extending one arm forward on the ball with thumb up to stretch the latissimus dorsi.'
    gripCue = 'Kneeling lat stretch on ball: Athlete is in a tall kneeling stance on a mat over black athletic turf in front of a matte black GAA stability ball. Athlete reaches the active arm forward onto the ball with the thumb pointing toward the ceiling (neutral wrist), then sinks the hips back toward the heels and lowers the torso toward the floor, feeling an expansive deep stretch along the lateral ribcage and latissimus dorsi while bracing core.'
  } else if (lowerName.includes('static standing adductor stretch')) {
    actionPhrase = 'performing a Static Standing Adductor Stretch on black athletic turf'
    steps = 'Athlete stands in a wide lateral stance, bending one knee and shifting hips sideways while keeping the opposite leg straight to stretch the inner thigh.'
    gripCue = 'Standing adductor groin stretch: Athlete assumes a wide athletic stance on black turf, toes pointing forward. Athlete hinges at the hips and bends the right knee, sitting back into a shallow side squat while keeping the left leg completely straight and extended laterally, left foot grounded. Hands rest securely on the right thigh or hips, maintaining an upright flat back and feeling a sustained static stretch through the left adductor (inner thigh).'
  } else if (lowerName.includes('supine dumbbell extension')) {
    actionPhrase = 'performing a Supine Dumbbell Extension with Matte Black Dumbbells on a Flat Leather Bench'
    steps = 'Athlete lies supine on a flat leather bench holding dumbbells overhead, flexing elbows to lower weights toward temples in a triceps extension.'
    gripCue = 'Bench skull crusher / tricep extension: Athlete lies flat on back on a sleek matte black GAA leather bench with feet firmly planted on the floor. Holding two matte black dumbbells with a neutral grip (palms facing each other), athlete\'s upper arms remain perfectly vertical and motionless perpendicular to the torso. Forearms hinge at the elbows to lower the dumbbells under control down beside the ears, then press smoothly back to full tricep extension lockout.'
  } else if (lowerName.includes('dumbbell ball combo ii') || lowerName.includes('dumbbell ball combo 2')) {
    actionPhrase = 'performing Dumbbell Ball Combo II with Matte Black Dumbbells on a Stability Ball on black athletic turf'
    steps = 'Athlete lies prone chest-down over a stability ball holding light dumbbells, raising arms laterally into a T-pose scapular retraction.'
    gripCue = 'Prone stability ball T-raise / reverse fly: Athlete lies chest-down (prone) over a matte black GAA stability ball with torso supported and legs extended straight behind, toes braced on the black turf. Holding light matte black dumbbells with thumbs pointed up toward the ceiling, athlete raises both arms straight out laterally in line with the shoulders into a rigid T-formation, deeply retracting the shoulder blades and squeezing the mid-trapezius and rhomboids with a long neutral cervical spine.'
  } else if (lowerName.includes('medicine ball step over push up')) {
    actionPhrase = 'performing a Medicine Ball Step Over Push Up with a Matte Black Medicine Ball on black athletic turf'
    steps = 'Athlete assumes a push-up plank with one hand elevated on a medicine ball, lowering into a chest press before stepping hand over the ball.'
    gripCue = 'Asymmetrical plyometric push-up: Athlete maintains a rigid straight-line plank on black turf with toes grounded. Left hand is planted flat on the turf while the right hand is firmly balanced atop a matte black GAA medicine ball. Athlete lowers the chest to hover just above the turf with elbows tracking at 45 degrees, then drives explosively upward to extend arms, dynamically stepping the hand over the ball in fluid unilateral stabilization.'
  } else if (lowerName === 'lunge to balance' || (lowerName.includes('lunge to balance') && !lowerName.includes('frontal') && !lowerName.includes('reverse') && !lowerName.includes('transverse'))) {
    actionPhrase = 'performing a Lunge To Balance on black athletic turf'
    steps = 'Athlete lunges forward, then drives forcefully off the front foot straight into a tall single-leg balance with opposite knee raised to hip height.'
    gripCue = 'Sagittal lunge to single-leg balance: Athlete steps forward into a deep forward lunge on black athletic turf, knees bent at 90 degrees with front shin vertical. Athlete pushes explosively off the front heel to rise into a tall standing single-leg balance pose on the lead leg, driving the trailing knee upward in the sagittal plane to hip level at 90 degrees flexion, hands on hips, core braced with erect posture and level hips.'
  } else if (lowerName.includes('seated single arm dumbbell tricep extension')) {
    actionPhrase = 'performing a Seated Single Arm Dumbbell Tricep Extension with a Matte Black Dumbbell on a Flat Leather Bench'
    steps = 'Athlete sits tall on a flat bench holding one dumbbell overhead, lowering it behind the head and pressing back up.'
    gripCue = 'Unilateral overhead tricep extension: Athlete sits tall and upright on a matte black GAA flat leather bench with feet flat on the turf. With one arm, athlete holds a single matte black dumbbell overhead with upper arm held vertical close to the ear. Bending solely at the elbow, athlete lowers the dumbbell behind the head under strict control, then contracts the triceps to press the dumbbell back to vertical lockout overhead, non-working hand resting on the thigh.'
  } else if (lowerName.includes('kettlebell crush curl with squat') || lowerName.includes('crush curl')) {
    actionPhrase = 'performing a Kettlebell Crush Curl With Squat with a Cast Iron Kettlebell on black athletic turf'
    steps = 'Athlete holds a kettlebell in a crush grip against the chest while descending into a squat, performing a bicep curl at parallel depth.'
    gripCue = 'Isometric crush curl in deep squat: Athlete holds a matte black GAA cast iron kettlebell bottoms-up or by the body between palms in an active crush grip against the chest, elbows tucked. Athlete sinks into a parallel athletic squat with thighs parallel to turf, chest upright, holding the squat isometric while lowering the kettlebell to arm extension and curling it back up powerfully to the chest, testing bicep strength and hip mobility.'
  } else if (lowerName.includes('transverse slalom')) {
    actionPhrase = 'performing a Transverse Slalom drill with a Matte Black Medicine Ball on black athletic turf'
    steps = 'Athlete performs multi-directional transverse bounding and pivoting across black turf while holding a medicine ball at chest level.'
    gripCue = 'Transverse agility slalom drill: Athlete holds a matte black GAA medicine ball firmly at chest level with both hands in a low, athletic ready stance on black turf. Athlete explosively bounds laterally and dynamically through the transverse plane, pivoting on the balls of the feet with rapid deceleration and directional change, rotating hips and core while maintaining an upright posture and locked-in ball control.'
  } else if (lowerName.includes('static 90 90 hamstring stretch') || lowerName.includes('90 90 hamstring')) {
    actionPhrase = 'performing a Static 90 90 Hamstring Stretch on black athletic turf'
    steps = 'Athlete sits on turf with one leg extended straight and opposite knee bent at 90 degrees, hinging forward from hips with a flat back toward the straight foot.'
    gripCue = 'Seated unilateral hamstring stretch: Athlete sits tall on black athletic turf with the active leg extended straight forward, toes pointed up. The opposite non-working leg is flexed at the knee at a 90-degree angle resting flat on the ground. Athlete hinges forward from the hips with a proud chest and neutral spine, gently reaching both hands along the shin toward the foot of the extended leg to stretch the hamstring, avoiding rounding of the back.'
  } else if (lowerName === 'single leg squat') {
    actionPhrase = 'performing a Single Leg Squat on black athletic turf'
    steps = 'Athlete balances on one leg with opposite leg extended forward, descending into a single-leg squat while keeping knee aligned over foot.'
    gripCue = 'Unilateral single-leg squat balance: Athlete stands on the right leg on black athletic turf with the left leg extended straight forward off the ground in a pistol squat progression. Athlete sinks hips back and down into a deep single-leg squat with right knee tracking directly over the toes, chest tall and upright, arms extended forward at chest height for dynamic counterbalance, core braced.'
  } else if (lowerName.includes('activation serratus push up') || lowerName.includes('serratus push up')) {
    actionPhrase = 'performing an Activation Serratus Push Up on black athletic turf'
    steps = 'Athlete holds a high plank push-up position with arms straight, protracting and retracting the shoulder blades to isolate the serratus anterior.'
    gripCue = 'Scapular push-up (push up plus): Athlete maintains a rigid straight-line high plank position on black turf with hands beneath shoulders, toes planted, and elbows locked completely straight. Movement occurs strictly at the shoulder blades: athlete lets the chest drop slightly by squeezing shoulder blades together (retraction), then pushes aggressively through the palms into the turf to spread shoulder blades wide and dome the upper back (protraction), isolating the serratus anterior.'
  } else if (lowerName.includes('reciprocating kettlebell overhead press')) {
    actionPhrase = 'performing a Reciprocating Kettlebell Overhead Press with Cast Iron Kettlebells in an elite sports performance facility'
    steps = 'Athlete stands tall with two kettlebells at shoulder height, simultaneously pressing one overhead while lowering the opposite kettlebell.'
    gripCue = 'Alternating reciprocating kettlebell press: Athlete stands with feet shoulder-width apart, holding two matte black GAA cast iron kettlebells in rack position at shoulder height. In a continuous reciprocal rhythm, the athlete presses one kettlebell straight overhead to locked extension while the opposite kettlebell is lowered under control to the front rack, alternating smoothly with an upright torso, braced abs, and packed shoulders.'
  } else if (lowerName.includes('activation ball prone shoulder ext rotation')) {
    actionPhrase = 'performing Activation Ball Prone Shoulder Ext Rotation on a Stability Ball on black athletic turf'
    steps = 'Athlete lies prone chest-down on a stability ball, externally rotating forearms upward with elbows bent at 90 degrees.'
    gripCue = 'Prone external rotation for rotator cuff: Athlete lies chest-down (prone) centered over a matte black GAA stability ball with legs extended behind and toes braced on the turf. Upper arms are abducted to shoulder level with elbows bent at 90 degrees (field goal / L-shape). Keeping elbows at shoulder height, athlete externally rotates forearms upward toward the ceiling so thumbs point up, squeezing the posterior deltoid, infraspinatus, and teres minor.'
  } else if (lowerName.includes('static 3d standing hip flexor stretch')) {
    actionPhrase = 'performing a Static 3D Standing Hip Flexor Stretch on black athletic turf'
    steps = 'Athlete assumes a staggered split stance, tucking pelvis and gently pressing hips forward while reaching arm overhead to stretch hip flexors.'
    gripCue = 'Multi-planar standing hip flexor stretch: Athlete assumes a staggered split stance on black turf with rear leg extended straight and heel slightly elevated, front knee softly bent. Athlete engages glutes to create a posterior pelvic tilt, pressing hips gently forward. Athlete elevates the arm on the rear-leg side overhead and adds a subtle side bend and torso rotation across the front hip, opening the iliopsoas and rectus femoris across all three planes of motion.'
  } else if (lowerName.includes('static standing adductor magnus')) {
    actionPhrase = 'performing a Static Standing Adductor Magnus stretch on black athletic turf'
    steps = 'Athlete takes a wide lateral stance, bending one knee and sitting hips back while keeping opposite leg straight to deeply stretch the inner thigh.'
    gripCue = 'Standing deep adductor stretch: Athlete assumes a wide lateral straddle stance on black turf with feet parallel and flat. Shifting bodyweight sideways, athlete bends the right knee deeply and sits hips back as if squatting to that side, while keeping the left leg fully extended and straight with foot grounded, feeling a sustained stretch along the inner thigh (adductor magnus) with hands resting on the bent thigh and spine neutral.'
  } else if (lowerName.includes('squat jump with stabilization transverse')) {
    actionPhrase = 'performing a Squat Jump With Stabilization Transverse on black athletic turf'
    steps = 'Athlete explodes into a vertical squat jump, rotating 90 degrees in mid-air to land softly in a balanced quarter squat and holding for 3 seconds.'
    gripCue = 'Transverse plyometric rotation and landing: Athlete descends into a quarter squat on open black turf, explodes vertically into the air, and dynamically rotates the entire body 90 degrees in the transverse plane mid-flight. Athlete lands softly on the balls of both feet rolling to heels in a balanced quarter squat, knees aligned over toes, arms forward for balance, holding perfect motionless stabilization for 3 seconds.'
  } else if (lowerName.includes('lunge to balance transverse')) {
    actionPhrase = 'performing a Lunge To Balance Transverse single-leg balance pose on black athletic turf'
    steps = 'Athlete steps out into a transverse lunge and returns to a tall upright single-leg balance pose with opposite knee lifted to 90 degrees at hip level.'
    gripCue = 'CRITICAL TALL SINGLE-LEG BALANCE POSE: Athlete is captured holding the final tall standing single-leg balance on one straight stance leg on black athletic turf. Torso is fully upright, chest tall, hands on hips. The opposite non-weight-bearing leg is lifted with the knee bent at a crisp 90-degree angle at hip height, core braced with hips level and square.'
  } else if (lowerName.includes('single arm standing row with rotation')) {
    actionPhrase = 'performing a Single Arm Standing Row With Rotation with a Matte Black Dumbbell on black athletic turf'
    steps = 'Athlete stands in an athletic staggered stance holding a dumbbell, rowing into the ribcage while rotating the torso smoothly.'
    gripCue = 'Dynamic transverse dumbbell row: Athlete stands in an athletic staggered stance on black athletic turf hinged slightly at the hips with a flat back, holding a single matte black GAA dumbbell with arm extended toward the floor. Athlete rows the dumbbell smoothly upward to the hip with elbow tucked close to the body, retracting the shoulder blade and rotating the torso slightly across the transverse plane, bracing core with hips square.'
  } else if (lowerName.includes('squat jump with stabilization frontal')) {
    actionPhrase = 'performing a Squat Jump With Stabilization Frontal on black athletic turf'
    steps = 'Athlete explodes into a lateral squat jump across the frontal plane, landing softly in a balanced quarter squat and holding for 3 seconds.'
    gripCue = 'Frontal plane lateral squat jump and landing: Athlete descends into a quarter squat on open black turf, explodes upward and laterally across the frontal plane, and lands softly on both feet in a balanced quarter squat with chest upright and arms forward for balance, holding motionless landing stabilization for 3 seconds on wide open turf.'
  } else if (lowerName.includes('static 3d standing tfl stretch') || lowerName.includes('standing tfl stretch')) {
    actionPhrase = 'performing a Static 3D Standing TFL Stretch on black athletic turf'
    steps = 'Athlete stands in a staggered stance with rear leg crossed behind, leaning torso to the side with arm overhead to stretch the tensor fascia latae.'
    gripCue = 'Standing TFL and lateral hip stretch: Athlete stands upright on black turf, crossing the right leg behind the left leg with both feet flat. Athlete pushes the right hip outward to the side and reaches the right arm overhead in a gentle lateral side bend to the left, feeling a focused static stretch along the tensor fascia latae (TFL) and IT band on the outer right hip, maintaining a tall posture and braced core.'
  } else if (lowerName.includes('static erector spinae stretch') || lowerName.includes('erector spinae stretch')) {
    actionPhrase = 'performing a Static Erector Spinae Stretch on black athletic turf'
    steps = 'Athlete hinges forward from hips with soft knees, resting hands on thighs while gently rounding lower back to stretch the spinal erectors.'
    gripCue = 'Spinal erector decompression stretch: Athlete stands with feet hip-width apart and knees softly unlocked on black turf. Athlete hinges forward from the hips with hands braced securely on the lower thighs above the knees, allowing the lumbar spine to relax into gentle flexion with chin softly tucked, creating a soothing decompression and elongation through the erector spinae along the lower and middle back.'
  } else if (lowerName.includes('static kneeling hip flexor stretch')) {
    actionPhrase = 'performing a Static Kneeling Hip Flexor Stretch on black athletic turf'
    steps = 'Athlete kneels in a 90/90 half-kneeling stance on a mat, tucking pelvis and pressing hips forward to stretch the rear hip flexor.'
    gripCue = 'Half-kneeling psoas hip flexor stretch: Athlete assumes a clean 90/90 half-kneeling position on a mat over black turf, rear knee on the ground directly below the hip, front foot planted flat with shin vertical. With an upright tall torso and hands on the front thigh, athlete engages the glute on the kneeling side to tilt the pelvis posteriorly, gently shifting hips forward to create an isolated static stretch across the anterior hip flexors (iliopsoas).'
  } else if (lowerName.includes('static pectoral ball stretch') || lowerName.includes('pectoral ball stretch')) {
    actionPhrase = 'performing a Static Pectoral Ball Stretch with a Stability Ball on black athletic turf'
    steps = 'Athlete kneels beside a stability ball with one arm bent at 90 degrees resting on the ball, rotating chest away to stretch the pectorals.'
    gripCue = 'Kneeling stability ball chest stretch: Athlete is in a kneeling position on a mat on black turf beside a matte black GAA stability ball. Athlete places the right forearm and elbow bent at 90 degrees on the apex of the ball at shoulder level, then gently sinks the chest toward the turf and rotates the torso slightly away, producing an expansive stretch across the right pectoralis major and anterior deltoid while keeping core braced.'
  } else if (lowerName.includes('self myofascial release smr tensor fascia latae') || lowerName.includes('smr tensor fascia latae')) {
    actionPhrase = 'performing Self Myofascial Release SMR Tensor Fascia Latae with a High-Density Foam Roller on black athletic turf'
    steps = 'Athlete lies semi-prone on turf with a foam roller positioned under the lateral hip, rolling gently over the tensor fascia latae.'
    gripCue = 'Foam rolling lateral hip (TFL): Athlete lies in a side-lying / semi-prone position on black turf, placing a matte black GAA high-density foam roller directly under the front-outer hip just below the pelvis bone (tensor fascia latae). Supporting bodyweight on the forearms and opposite planted foot, athlete applies controlled pressure and rolls slowly over the TFL, relaxing the surrounding musculature.'
  } else if (lowerName.includes('180 jump with stabilization') || lowerName.includes('180 jump')) {
    actionPhrase = 'performing a 180 Jump With Stabilization on black athletic turf'
    steps = 'Athlete jumps explosively, rotating 180 degrees in mid-air to land facing the opposite direction in a balanced quarter squat, holding for 3 seconds.'
    gripCue = '180-degree rotational jump stabilization: Athlete descends into an athletic quarter squat on open black athletic turf, drives explosively into the air, and executes a full 180-degree mid-air rotation. Athlete lands softly on the forefeet rolling to heels in a balanced quarter squat facing the opposite direction, knees aligned over toes, arms forward for counterbalance, holding rock-solid motionless stabilization for 3 seconds.'
  } else if (lowerName.includes('static seated calf stretch') || lowerName.includes('seated calf stretch')) {
    actionPhrase = 'performing a Static Seated Calf Stretch on black athletic turf'
    steps = 'Athlete sits on turf with legs extended straight, pulling toes back into active dorsiflexion and reaching forward to stretch the calves.'
    gripCue = 'Seated gastrocnemius calf stretch: Athlete sits tall on black athletic turf with both legs extended straight out in front. Athlete actively flexes the feet pulling the toes back toward the shins (dorsiflexion), and hinges forward from the hips with a flat back, reaching hands forward to hold the balls of the feet/toes, feeling a focused static stretch through the calves (gastrocnemius and soleus).'
  } else if (lowerName === 'prisoner squat' || (lowerName.includes('prisoner squat') && !lowerName.includes('calf raise'))) {
    actionPhrase = 'performing a Prisoner Squat on black athletic turf'
    steps = 'Athlete squats to parallel depth with fingers interlaced behind the head and elbows flared wide in a prisoner position.'
    gripCue = 'Prisoner squat to parallel: Athlete stands with feet shoulder-width apart, toes pointing slightly outward. Hands are placed behind the head with fingers lightly interlaced and elbows pushed wide back to open the chest. Athlete descends smoothly by bending at hips and knees until thighs are parallel to the black athletic turf, knees tracking directly over toes, keeping a proud upright chest, then drives through the heels to standing lockout.'
  } else if (lowerName.includes('kettlebell deadlift')) {
    actionPhrase = 'performing a Kettlebell Deadlift with a Cast Iron Kettlebell on black athletic turf'
    steps = 'Athlete stands over a kettlebell between feet, hinging hips back with a flat spine, gripping handle with both hands and extending to lockout.'
    gripCue = 'Bilateral kettlebell deadlift: Athlete stands in an athletic stance with feet hip-to-shoulder-width apart over a single matte black GAA cast iron kettlebell positioned between the midfeet. Athlete hinges deeply at the hips and bends knees with a flat horizontal spine and packed lats, grasping the kettlebell handle firmly with both hands in a double-overhand grip. Driving forcefully through the heels, athlete extends hips and knees simultaneously to stand tall at full lockout with shoulders back.'
  } else if (lowerName.includes('smr latissimus dorsi') || lowerName.includes('self myofascial release smr latissimus dorsi')) {
    actionPhrase = 'performing Self Myofascial Release SMR Latissimus Dorsi with a High-Density Foam Roller on black athletic turf'
    steps = 'Athlete lies on side with a foam roller under the mid-axillary area just below the armpit, arm extended overhead.'
    gripCue = 'Foam rolling latissimus dorsi: Athlete lies side-lying on black athletic turf with a matte black GAA high-density foam roller positioned horizontally beneath the mid-axillary side of the ribcage just under the armpit. Athlete extends the bottom arm straight overhead along the turf with palm facing inward/upward, opposite foot planted in front for support, gently rolling between mid-ribs and armpit while relaxing the latissimus dorsi.'
  } else if (lowerName.includes('two arm dumbbell chest press with band')) {
    actionPhrase = 'performing a Two Arm Dumbbell Chest Press With Band on a Flat Leather Bench'
    steps = 'Athlete lies supine on a flat bench with a resistance band looped across the upper back and held under dumbbells, pressing upward.'
    gripCue = 'Accommodating band chest press: Athlete lies flat on a sleek black leather bench with feet firmly planted. A continuous resistance band is wrapped securely across the upper back with the ends looped through the palms under two matte black GAA dumbbells. Athlete presses both dumbbells smoothly upward from chest level toward full lockout directly over the mid-chest against the progressive band tension.'
  } else if (lowerName.includes('static standing quadriceps stretch') || lowerName.includes('standing quadriceps stretch')) {
    actionPhrase = 'performing a Static Standing Quadriceps Stretch on black athletic turf'
    steps = 'Athlete stands tall on one leg, bending opposite knee and pulling heel toward glutes while keeping knees together.'
    gripCue = 'Standing quadriceps stretch: Athlete balances tall on the left foot on black athletic turf, bending the right knee and reaching back with the right hand to grasp the right ankle/foot. Athlete gently draws the heel toward the glute while maintaining a neutral pelvis with knees aligned side by side, chest tall and core braced, free arm resting on the hip or extended slightly for balance.'
  } else if (lowerName.includes('in in out out ladder drill')) {
    actionPhrase = 'performing the In In Out Out Ladder Drill on an agility ladder on black athletic turf'
    steps = 'Athlete executes rapid footwork stepping both feet in and both feet out of agility ladder rungs in high-cadence athletic rhythm.'
    gripCue = 'Agility ladder precision footwork: Athlete is captured mid-stride in an athletic quarter-squat over a flat agility ladder on black turf. Athlete steps rhythmically two feet into the ladder square then two feet out to the sides with explosive fast-twitch cadence, knees softly bent, chest proud, athletic runner arms driving in counter-tempo.'
  } else if (lowerName.includes('kettlebell clean to press')) {
    actionPhrase = 'performing a Kettlebell Clean To Press with strictly ONE single Matte Black Kettlebell on black athletic turf'
    steps = 'Athlete drives a kettlebell from the hips into a clean rack position at the shoulder and presses vertically overhead.'
    gripCue = 'Unilateral kettlebell clean and press: Athlete stands tall on black athletic turf holding strictly ONE single matte black GAA kettlebell in the rack position against the shoulder and forearm with a firm closed-fist grip, having just cleaned the bell from between the feet. In a powerful, fluid motion, athlete presses the kettlebell vertically overhead to full elbow lockout with bicep adjacent to the ear, free arm counterbalancing out to the side.'
  } else if (lowerName.includes('kettlebell floor press')) {
    actionPhrase = 'performing a Kettlebell Floor Press with strictly ONE single Matte Black Kettlebell on black athletic turf'
    steps = 'Athlete lies supine on the floor with knees bent, pressing a kettlebell upward from the floor to vertical lockout.'
    gripCue = 'Unilateral kettlebell floor press: Athlete lies flat on back on black athletic turf with knees bent and feet flat on the floor. Holding strictly ONE single matte black GAA kettlebell in the right hand with a tight closed-fist vertical grip, athlete presses the kettlebell straight upward until the right arm is fully locked out above the chest. The left arm rests flat on the floor or across the abdomen; the right tricep lightly contacts the floor at the base of the press.'
  } else if (lowerName.includes('ali shuffle ladder drill')) {
    actionPhrase = 'performing the Ali Shuffle Ladder Drill on an agility ladder on black athletic turf'
    steps = 'Athlete performs rapid scissor-action footwork forward and back across agility ladder rungs in rhythmic boxer cadence.'
    gripCue = 'Boxer Ali shuffle agility: Athlete stands in an athletic stance laterally across an agility ladder on black turf, executing rapid alternating scissor jumps with feet switching front-to-back over the ladder rungs. Body is light on the balls of the feet with knees springy, chest upright, and athletic boxer arms pumping in synchronized counter-balance.'
  } else if (lowerName.includes('repeat squat jumps multiplanar')) {
    actionPhrase = 'performing Repeat Squat Jumps Multiplanar on black athletic turf'
    steps = 'Athlete performs continuous explosive squat jumps across multiple planes, absorbing force softly in an athletic quarter squat.'
    gripCue = 'Multiplanar plyometric jumping: Athlete is captured at the explosive takeoff / soft landing transition of continuous squat jumps on wide open black athletic turf. Hips and knees flex into an athletic quarter squat absorbing ground reaction forces, feet shoulder-width, arms swinging dynamically forward and upward to generate vertical lift, torso braced and posture immaculate.'
  } else if (lowerName.includes('bent over dumbbell rear fly with neutral grip')) {
    actionPhrase = 'performing a Bent Over Dumbbell Rear Fly With Neutral Grip with Matte Black Dumbbells'
    steps = 'Athlete hinges at hips with flat back, raising dumbbells out to sides with neutral grip (palms facing inward).'
    gripCue = 'CRITICAL NEUTRAL GRIP REAR DELT FLY: Athlete hinges forward at the hips to a 45-degree angle with a flat, neutral spine and knees slightly bent. Holding two matte black GAA dumbbells, athlete raises both arms outward to the sides in a wide reverse-fly arc leading with the elbows. CRITICAL GRIP: Palms face directly inward toward each other throughout the entire movement (neutral grip), squeezing the posterior deltoids and rhomboids at top contraction.'
  } else if (lowerName === 'slalom' || (lowerName.includes('slalom') && !lowerName.includes('transverse'))) {
    actionPhrase = 'performing the Slalom Agility Drill on black athletic turf'
    steps = 'Athlete bounds rhythmically side-to-side in a dynamic slalom path across black athletic turf with rapid deceleration.'
    gripCue = 'Lateral slalom bounding: Athlete bounds dynamically across black athletic turf in a continuous zig-zag slalom pattern, planting the outside foot forcefully with knee aligned over toes to absorb momentum, torso pitched forward in an athletic sprint angle, arms pumping in aggressive counter-tempo, eyes locked forward.'
  } else if (lowerName.includes('box jump down to tuck jump')) {
    actionPhrase = 'performing a Box Jump Down To Tuck Jump with a Plyometric Box on black athletic turf'
    steps = 'Athlete steps off a plyometric box, absorbs landing on turf, and immediately explodes vertically into a tuck jump.'
    gripCue = 'Depth drop to reactive tuck jump: Athlete steps off a sturdy matte black GAA plyometric box onto black athletic turf, absorbs the ground impact softly with knees bent, and immediately rebounds explosively straight up into the air, pulling both knees high toward the chest in an athletic tuck jump apex with arms driving upward.'
  } else if (lowerName.includes('repeat ice skater')) {
    actionPhrase = 'performing Repeat Ice Skater bounds on black athletic turf'
    steps = 'Athlete bounds rhythmically side-to-side in continuous lateral skater jumps, absorbing force softly on single leg.'
    gripCue = 'Continuous lateral speed skater bounds: Athlete is captured in mid-bound leaping laterally across black athletic turf in an athletic speed-skating posture, loading powerfully onto the lead bent leg while the trailing leg sweeps behind, arms pumping across the torso in aggressive counter-balance.'
  } else if (lowerName.includes('single leg reach sagittal')) {
    actionPhrase = 'performing a Single Leg Reach Sagittal on black athletic turf'
    steps = 'Athlete balances on one leg, hinging at the hips and reaching both hands forward in the sagittal plane while the rear leg extends back.'
    gripCue = 'Sagittal single-leg hinge and reach: Athlete balances steadily on the left leg on black athletic turf with a slight knee bend, hinging deeply at the hips with a flat horizontal spine. Both arms reach straight forward parallel to the turf in the sagittal plane while the right leg extends straight back behind the body forming a straight line from hands to rear heel.'
  } else if (lowerName.includes('static posterior shoulder stretch')) {
    actionPhrase = 'performing a Static Posterior Shoulder Stretch on black athletic turf'
    steps = 'Athlete brings one arm across the chest horizontally, using the other arm to gently pull the elbow closer to the torso.'
    gripCue = 'Posterior deltoid horizontal adduction stretch: Athlete stands tall on black athletic turf with feet shoulder-width apart. Athlete draws the right arm straight across the chest horizontally at shoulder height, using the left forearm/hand to gently pull the right arm closer to the torso, feeling an isolated static stretch across the posterior deltoid and rotator cuff, shoulders relaxed down.'
  } else if (lowerName.includes('smr quadriceps') || lowerName.includes('self myofascial release smr quadriceps')) {
    actionPhrase = 'performing Self Myofascial Release SMR Quadriceps with a High-Density Foam Roller on black athletic turf'
    steps = 'Athlete lies prone on turf with a foam roller positioned under the anterior thigh, rolling between pelvis and knee.'
    gripCue = 'Foam rolling quadriceps: Athlete lies face down in a modified low plank supporting bodyweight on the forearms on black athletic turf, placing a matte black GAA high-density foam roller directly under the front of the right thigh (quadriceps). Athlete gently rolls along the anterior thigh between the hip crease and just above the kneecap with core braced.'
  } else if (lowerName.includes('dumbbell push press')) {
    actionPhrase = 'performing a Dumbbell Push Press with Matte Black Dumbbells'
    steps = 'Athlete dips into a shallow knee bend and drives explosively upward through legs to press dumbbells overhead to full lockout.'
    gripCue = 'Dynamic bilateral dumbbell push press: Athlete stands tall with feet shoulder-width apart, holding two matte black GAA dumbbells in the front rack position at shoulders with neutral-to-semi-pronated grip. Athlete performs a quick 2-to-3 inch knee dip and drives explosively through the heels, driving both dumbbells vertically overhead to full elbow lockout with core locked and spine neutral.'
  } else if (lowerName.includes('kettlebell arm bar')) {
    actionPhrase = 'performing a Kettlebell Arm Bar with strictly ONE single Matte Black Kettlebell on black athletic turf'
    steps = 'Athlete lies on floor with kettlebell pressed vertically, rolling onto side while keeping arm locked plumb toward ceiling.'
    gripCue = 'Kettlebell shoulder stabilization arm bar: Athlete lies on the left side on black athletic turf with head resting on the extended left arm. In the right hand, athlete holds strictly ONE single matte black GAA kettlebell with a firm closed grip, locking the right arm completely vertical in a plumb line toward the ceiling. Athlete packs the right shoulder into the socket, chest opened to the side, maintaining steady upward lockout.'
  } else if (lowerName.includes('plyometric push up')) {
    actionPhrase = 'performing a Plyometric Push Up on black athletic turf'
    steps = 'Athlete explodes upward from the bottom of a push-up with sufficient force that hands leave the floor in mid-air.'
    gripCue = 'Explosive push-up launch: Athlete explodes powerfully upward from the bottom of a push-up on black athletic turf, propelling the upper body into the air so both hands are clearly lifted several inches off the turf in mid-air with body maintained in a rigid, straight plank line from head to heels, landing softly with elbows unlocking.'
  } else if (lowerName === 'box jumps' || lowerName.includes('box jumps')) {
    actionPhrase = 'performing Box Jumps on a Plyometric Box on black athletic turf'
    steps = 'Athlete descends into a quarter squat and explodes vertically, landing softly on top of a plyometric box.'
    gripCue = 'Explosive plyometric box jump: Athlete explodes vertically off black athletic turf and lands softly on top of a sturdy matte black GAA plyometric box in a quiet, balanced quarter-squat with knees aligned over toes, chest upright, arms forward for balance, holding landing control before standing tall.'
  } else if (lowerName.includes('single leg squat to row')) {
    actionPhrase = 'performing a Single Leg Squat To Row at a Cable Pulley Station on black athletic turf'
    steps = 'Athlete balances on one leg holding a cable handle, squatting down while extending arm and rowing handle back upon standing.'
    gripCue = 'Unilateral dynamic cable squat to row: Athlete balances tall on the right leg on black athletic turf facing a matte black GAA cable station, holding a single D-handle in the left hand with arm extended forward. Athlete descends into a single-leg squat, then drives forcefully through the right heel to stand while pulling the cable handle smoothly back to the left ribcage with elbow tucked, chest proud.'
  } else if (lowerName.includes('squat to single arm row')) {
    actionPhrase = 'performing a Squat To Single Arm Row with strictly ONE single Matte Black Dumbbell on black athletic turf'
    steps = 'Athlete squats to parallel depth holding a dumbbell in one hand, rowing the dumbbell to the ribcage as they rise from the squat.'
    gripCue = 'Bilateral squat to unilateral dumbbell row: Athlete stands in an athletic stance with feet shoulder-width apart over black athletic turf, holding strictly ONE single matte black GAA dumbbell in the right hand. Athlete squats to parallel depth with chest proud, and drives through heels to standing while rowing the dumbbell smoothly up to the right hip with elbow tucked, left arm resting on the hip for stability.'
  } else if (lowerName.includes('single leg throw and catch frontal')) {
    actionPhrase = 'performing Single Leg Throw And Catch Frontal with a Matte Black Medicine Ball on black athletic turf'
    steps = 'Athlete balances on one leg facing the frontal plane, tossing and catching a medicine ball while maintaining balance.'
    gripCue = 'Frontal single-leg medicine ball stabilization: Athlete balances steadily on one single leg on black athletic turf facing the camera, holding a matte black GAA medicine ball with both hands at chest level, executing a controlled toss and catch across the frontal plane with core locked and hip level.'
  } else if (lowerName.includes('w in in out out')) {
    actionPhrase = 'performing the W In In Out Out Ladder Drill on an agility ladder on black athletic turf'
    steps = 'Athlete moves in a W-pattern stepping into and out of agility ladder rungs with high-cadence footwork.'
    gripCue = 'Multi-directional W ladder footwork: Athlete navigates a flat agility ladder on black athletic turf in a zig-zag W-pattern, rapidly stepping both feet into each square and diagonally out, staying light on the balls of the feet with athletic runner arms pumping.'
  } else if (lowerName.includes('side lying leg raise')) {
    actionPhrase = 'performing a Side Lying Leg Raise on black athletic turf'
    steps = 'Athlete lies on side with head supported, raising top straight leg toward ceiling to 45 degrees with neutral spine.'
    gripCue = 'Gluteus medius hip abduction: Athlete lies on the left side on black athletic turf with left arm bent supporting the head and right hand braced in front for stability. Athlete raises the straight right leg laterally toward the ceiling to approximately 45 degrees with toes pointing slightly downward/forward to isolate the gluteus medius, pelvis stacked vertically with zero rotation.'
  } else if (lowerName.includes('incline dumbbell curl')) {
    actionPhrase = 'performing an Incline Dumbbell Curl on an Incline Leather Bench with Matte Black Dumbbells'
    steps = 'Athlete reclines on a 45-degree incline bench with arms hanging, curling dumbbells smoothly upward with supinated palms.'
    gripCue = 'Seated incline bicep curl: Athlete reclines back against a 45-degree sleek black leather bench with feet flat on the floor, holding two matte black GAA dumbbells with arms hanging vertically. Keeping elbows pinned stationary, athlete curls both dumbbells upward toward shoulders, supinating palms so palms face the shoulders at the apex of peak bicep contraction.'
  } else if (lowerName.includes('squat jump with stabilization multiplanar')) {
    actionPhrase = 'performing a Squat Jump With Stabilization Multiplanar on black athletic turf'
    steps = 'Athlete jumps explosively, rotating into a new plane in mid-air, landing softly in a quarter squat and holding for 3 seconds.'
    gripCue = 'Multiplanar rotational jump stabilization: Athlete descends into a quarter squat on open black athletic turf, drives explosively into the air while rotating smoothly across the transverse/frontal plane, and lands softly on both feet in a balanced quarter squat, holding a rock-solid 3-second motionless freeze.'
  } else if (lowerName.includes("child's pose") || lowerName.includes('childs pose')) {
    actionPhrase = "performing Child's Pose on a black workout mat on black athletic turf"
    steps = 'Athlete kneels with hips sitting back on heels, folding torso forward with arms extended along the floor.'
    gripCue = 'Restorative spinal elongation: Athlete kneels on a black workout mat on black athletic turf with big toes touching and knees spread comfortably apart. Athlete sinks hips back onto the heels and folds the torso forward between the thighs, extending both arms straight forward along the mat with palms flat, resting forehead gently toward the mat to decompress the spine and elongate the latissimus dorsi.'
  } else if (lowerName.includes('seated leg curl')) {
    actionPhrase = 'performing a Seated Leg Curl on a Matte Black Leg Curl Machine'
    steps = 'Athlete sits in machine with thighs secured under pad, curling the padded lever downward beneath the knees toward glutes.'
    gripCue = 'Machine hamstring isolation: Athlete sits upright in the sleek matte black GAA seated leg curl machine with back against the backrest and the contoured thigh pad secured firmly over the lower quadriceps. Grasping the side stabilizing handles, athlete curls the lower roller pad smoothly downward and backward beneath the seat, squeezing the hamstrings at peak contraction.'
  } else if (lowerName.includes('medicine ball bent over chest pass')) {
    actionPhrase = 'performing a Medicine Ball Bent Over Chest Pass on black athletic turf'
    steps = 'Athlete hinges forward holding a medicine ball at chest, explosively pushing the ball downward into the floor.'
    gripCue = 'Explosive sagittal chest pass slam: Athlete stands in a powerful hinged athletic stance on black athletic turf with hips back and knees bent, holding a matte black GAA medicine ball at the chest with both hands and elbows tucked. Athlete explosively chest-passes the ball straight downward into the turf with maximum upper body and core power.'
  } else if (lowerName.includes('lunge jump')) {
    actionPhrase = 'performing a Lunge Jump on black athletic turf'
    steps = 'Athlete explodes vertically from a lunge, switching legs in mid-air and landing softly into the opposite lunge.'
    gripCue = 'Plyometric split jump switch: Athlete explodes into the air from a deep lunge on black athletic turf, switching legs dynamically in mid-flight with a tall upright torso and arms pumping in counter-rhythm, landing softly with front and back knees bent to 90 degrees in a balanced opposite lunge.'
  } else if (lowerName.includes('renegade row to push up') || lowerName.includes('dumbbell renegade row to push up')) {
    actionPhrase = 'performing a Dumbbell Renegade Row To Push Up with Matte Black Dumbbells on black athletic turf'
    steps = 'Athlete in a high plank on dumbbells executes a push-up, then rows one dumbbell to the ribcage without rotating hips.'
    gripCue = 'Compound renegade row push-up: Athlete holds a rigid high push-up plank on black athletic turf gripping two flat-bottomed matte black GAA dumbbells directly beneath shoulders, feet set slightly wider than hip-width. Athlete executes a strict chest-to-turf push-up, presses back to plank, and smoothly rows one dumbbell up to the ribcage with elbow tucked close and hips locked completely square to the floor.'
  }

  const prompt = [
    `${shotFraming} ${actionPhrase} in an elite sports performance facility.`,
    `Clinical NASM biomechanics: ${steps} ${gripCue} ${muscles}`.trim(),
    `Athlete wears minimalist dark slate athletic apparel with prominent GAA (Gordon Athletic Advisory) monogram apex branding.`,
    `All facility equipment and plates feature sleek matte black finishes with subtle Gordon Athletic Advisory architectural accents; strictly zero generic third-party logos (no Nike, Adidas, Under Armour, Gymshark, Rogue); all branding is exclusively Gordon Athletic Advisory (GAA).`,
    `Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.`,
  ].join(' ')

  return prompt
}

async function generateWithGemini(prompt, destPath, preferredModel, applyBranding) {
  const modelsToTry = [preferredModel, 'nano-banana-pro-preview', 'gemini-3-pro-image'].filter(
    (v, i, a) => a.indexOf(v) === i
  )

  let lastError = null

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['IMAGE'],
          },
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`API ${res.status} [${model}]: ${errText}`)
      }

      const data = await res.json()
      const parts = data.candidates?.[0]?.content?.parts || []
      const imgPart = parts.find(p => p.inlineData)
      if (!imgPart || !imgPart.inlineData?.data) {
        throw new Error(`No image payload returned in model ${model}`)
      }

      const buffer = Buffer.from(imgPart.inlineData.data, 'base64')
      if (applyBranding) {
        await applyGaaBrandingWatermark(buffer, destPath)
      } else {
        fs.writeFileSync(destPath, buffer)
      }
      return model
    } catch (err) {
      lastError = err
      // Try next model if available
    }
  }

  throw lastError || new Error('Image generation failed across all candidate models.')
}

async function main() {
  const options = parseArgs()

  console.log('🏛️  GAA Master NASM Edge Exercise Image Studio')
  console.log(`⚡ Model: ${options.model} | Mode: ${options.dryRun ? 'DRY-RUN (Simulated)' : 'PRODUCTION'}`)
  console.log(`🏷️  GAA Watermark Branding: ${options.branding ? 'ENABLED (Official Crest)' : 'DISABLED'}`)
  console.log(`📂 Target Directory: ${OUTPUT_DIR}\n`)

  if (!options.dryRun && !options.brandExisting && !options.exportManifest && !API_KEY) {
    console.error('❌ Error: Missing GEMINI_API_KEY in .env.local')
    process.exit(1)
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // Handle stamping branding onto existing images
  if (options.brandExisting) {
    console.log('🏷️  Applying official GAA brand crest watermark to existing exercise images...')
    const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.jpg') && !f.includes('.branded.'))
    let brandedCount = 0
    for (const f of files) {
      const p = path.join(OUTPUT_DIR, f)
      try {
        await applyGaaBrandingWatermark(p, p)
        brandedCount++
      } catch (err) {
        console.error(`  ❌ Failed to brand ${f}:`, err.message)
      }
    }
    console.log(`✨ Successfully branded ${brandedCount}/${files.length} images with the official GAA crest!\n`)
    process.exit(0)
  }

  // Load official library
  const catalogPath = path.resolve(ROOT, 'scripts/nasm-complete-library.json')
  if (!fs.existsSync(catalogPath)) {
    console.error('❌ Error: Missing scripts/nasm-complete-library.json')
    process.exit(1)
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
  console.log(`Loaded ${catalog.length} official NASM Edge library entries.`)

  // Handle export manifest
  if (options.exportManifest) {
    console.log('📦 Exporting public/images/exercises/manifest.json...')
    const existingFiles = new Set(
      fs.existsSync(OUTPUT_DIR) ? fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png')) : []
    )

    const manifest = {}
    for (const item of catalog) {
      const filename = exerciseToFilename(item.name)
      if (existingFiles.has(filename)) {
        manifest[item.name.toLowerCase()] = `/images/exercises/${filename}`
      }
    }

    const manifestPath = path.join(OUTPUT_DIR, 'manifest.json')
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
    console.log(`✅ Exported manifest with ${Object.keys(manifest).length} mapped exercises to ${manifestPath}`)

    const tsPath = path.resolve(ROOT, 'lib/nasm-generated-images.ts')
    const tsContent = `/**
 * Gordon Athletic Advisory — Verified Master Generated Exercise Images
 * 100% synchronized with official NASM Edge catalog and GAA luxury brand aesthetic.
 * Auto-generated by scripts/generate-nasm-edge-exercises.mjs
 */
export const VERIFIED_GAA_EXERCISE_IMAGES: Record<string, string> = ${JSON.stringify(manifest, null, 2)}
`
    fs.writeFileSync(tsPath, tsContent)
    console.log(`✅ Exported TypeScript mapping to ${tsPath}\n`)
    process.exit(0)
  }

  const CURATED_WAVES = {
    1: [
      'Dumbbell Romanian Deadlift',
      'Push Up',
      'Goblet Squat',
      'Bulgarian Split Squat',
      'Seated Row',
      'Barbell Deadlift',
      'Incline Barbell Bench Press',
      'Plank',
      'Single Leg Scaption',
      'Dumbbell Lateral Raise',
    ],
    2: [
      'Barbell Back Squat',
      'Barbell Bench Press',
      'Pull Up',
      'Barbell Overhead Press',
      'Dumbbell Bent Over Row',
      'Dumbbell Bench Press',
      'Barbell Bicep Curl',
      'Floor Bridge',
      'Dumbbell Overhead Press',
      'Dumbbell Hammer Curl',
    ],
    3: [
      'Incline Dumbbell Bench Press',
      'Foam Roll Latissimus Dorsi',
      'Kettlebell Front Squat',
      'Bent Over Dumbbell Rear Fly',
      'Single Leg Romanian Deadlift',
      'Dumbbell Front Squat',
      'Foam Roll Calves',
      'Bench Dips',
      'Barbell Bent Over Row Pronated',
      'Single Leg Floor Bridge',
    ],
    4: [
      'Kettlebell Clean',
      'Single Arm Kettlebell Swing',
      'Close Grip Bench Press',
      'Good Mornings',
      'Dumbbell Preacher Curl',
      'Foam Roll Adductors',
      'Barbell Front Squat With Crossed Arms',
      'Kettlebell Renegade Row',
      'Single Arm Dumbbell Chest Press',
      'Alternating Dumbbell Bench Press',
    ],
    5: [
      'Chest Press Machine',
      'Face Pull',
      'Cable Crossover',
      'Leg Press Calf Raise',
      'Seated Machine Row Close Grip',
      'Band Assisted Pull Up',
      'Squat Jump With Stabilization',
      'Ball Crunch',
      'Ball Cobra',
      'Forward And Back Band Walking',
    ],
    6: [
      'Single Leg Press',
      'Lying Leg Curl',
      'Kettlebell Goblet Squat',
      'Push Press',
      'Kettlebell Overhead Press',
      'Reverse Lunge To Single Arm Row',
      'Pike Push Up',
      'Incline Push Up',
      'Single Leg Squat Touchdown',
      'Kettlebell Jerk',
    ],
    7: [
      'Decline Push Up',
      'Supported Bent Over Dumbbell Row',
      'Bent Over Barbel Row Supinated',
      'Box Jump Up With Stabilization Frontal',
      'Plank Walkup',
      'Archer Push Up',
      'Squat To Row',
      'Single Leg Seated Leg Curl',
      'Tuck Jump With Stabilization',
      'Depth Jump',
    ],
    8: [
      'Side Plank',
      'Bird Dog',
      'Dead Bug',
      'Russian Twist',
      'Squat Jump',
      'Tuck Jump',
      'Standing Tubing Row',
      'Assisted Single Leg Squat',
      'Ball Crunch Arms Crossed',
      'Barbell Bench Press With Chains',
    ],
    9: [
      'Two Arm Incline Dumbbell Chest Press',
      'Single Arm Incline Dumbbell Chest Press',
      'Incline Push Up With Rotation',
      'Push Up With Staggered Hands',
      'Short Lever Side Plank',
      'Plank With Knees Down',
      'Step Up To Balance Frontal Curl To Overhead Press',
      'Box Squat Curl To Overhead Press',
      'Static Latissimus Dorsi Ball Stretch',
      'Static Butterfly Stretch',
    ],
    10: [
      'Lateral Band Walking',
      'Straight Arm Plank',
      'Plank With Arm Reach',
      'Push Up With Rotation',
      'Push Up Plus',
      'Box Squat',
      'Dumbbell Squat To Overhead Press',
      'Reverse Lunge To Balance',
      'Two Arm Standing Cable Fly',
      'Barbell Front Squat With Clean Position',
    ],
    11: [
      'Romanian Deadlift',
      'Leg Press',
      'Squat Thrust Burpees',
      'Single Leg Hammer Curl',
      'Hammer Curl To Lateral Raise',
      'Single Arm Standing Chest Press',
      'Incline Stance Row',
      'Lying Leg Curl Single Leg',
      'Double Kettlebell Clean',
      'Half Get Up With Kettlebell',
    ],
    12: [
      'Barbell Bench Press With Bands',
      'Hand To Hand Kettlebell Swing',
      'Dumbbell Rack Carry',
      'Bent Elbow Dumbbell Lateral Raise',
      'Inverted Push Up',
      'Push Up To 3 Point Stance',
      'Single Leg Balance Reach Frontal Plane',
      'Self Myofascial Release Smr Hamstrings',
      'Self Myofascial Release Smr Piriformis',
      'Double Kettlebell Snatch',
    ],
    13: [
      'Band Push Up',
      'Quadruped Opposite Arm Leg Raise',
      'Single Leg Hop Stabilization Level 1',
      'Single Leg Cobra To Hip Extension',
      'Repeat Squat Jumps',
      'Reverse Crunch To Knee Up With Rotation',
      'Active Kneeling Hip Flexor',
      'Static Upper Trapezius Stretch',
      'Self Myofascial Release Smr Peroneals',
      'Activation Ball Prone Wide Row',
    ],
    14: [
      'Repeat Hurdle Jumps',
      'Repeat Tuck Jumps',
      'Active Standing Hip Flexor',
      'Single Leg Hop Stabilization Level 2',
      'Single Leg Romanian Deadlift To Pnf Pattern 1',
      'Quadruped Arm Raise',
      'Clamshells',
      'Static Levator Scapulae Stretch',
      'Half Kneeling Tubing Rotation',
      'Dumbbell Bent Over Extention',
    ],
    15: [
      'Single Leg Romanian Deadlift To Pnf Pattern 2',
      'Lying Leg Curl Two Leg Concentric Single Leg Eccentric',
      'Activation Medial Hamstring',
      'Active Supine Biceps Femoris',
      'Active Lat Ball',
      'Single Leg Balance Reach Transverse',
      'Single Leg Lift And Chop',
      'Ball Combo I',
      'Supported Bent Over Dumbbell Extension',
      'Ladder Jumping Jacks',
    ],
    16: [
      'Depth Jump Frontal',
      'Incline Stance Single Arm Row',
      'Medicine Ball Push Up To 3 Point',
      'Single Leg Throw And Catch',
      'Activation Standing Glute Max',
      'Self Myofascial Release Smr Lateral Thigh',
      'Self Myofascial Release Smr Thoracic Spine',
      'Step Up To Balance Frontal',
      'Zig Zag Shuffle',
      'Activation Medial Gastrocnemius',
    ],
    17: [
      'Transverse Box Jump Down To Tuck Jump',
      'Repeat Hurdle Jumps Transverse',
      '4 Point Quadruped T Drill',
      'Frontal Box Jump Down To Tuck Jump',
      'Single Leg Throw And Catch Transverse 1',
      'Leg Circuit Frontal',
      'Activation Posterior Tibialis',
      'Single Leg Throw And Catch Transverse 2',
      'Mb Figure 8',
      'In In Out Out Crossover Ladder Drill',
    ],
    18: [
      'Activation Anterior Tibialis',
      'Single Leg Romanian Deadlift Curl To Overhead Press',
      'Dumbbell Combination Curl',
      'Quadruped March',
      'Floor Prone Cobra',
      'Single Leg Balance Reach Multiplanar',
      'Single Leg Romanian Deadlift Single Arm Curl To Overhead Press',
      'Static 3d Kneeling Hip Flexor Stretch',
      'Sternocleidomastoid Stretch',
      'Leg Circuit',
    ],
    19: [
      'Ice Skater With Stabilization',
      'Kettlebell Push Press',
      'Single Arm Kettlebell High Pull',
      'Box Jump Up With Stabilization Transverse',
      'Depth Jump Transverse',
      'Repeat Hurdle Jump Frontal',
      'Two Ins Ladder Drill',
      'Power Step Up',
      'Repeat Squat Jumps Frontal',
      'Box Jump Up With Stabilization',
    ],
    20: [
      'Quadruped Leg Raise',
      'Repeat Squat Jumps Transverse',
      'Active Standing Adductor',
      'Single Leg Single Arm Scaption',
      'Activation Standing Shoulder Ext Rotation',
      'Reverse Lunge To Row',
      'Modified Push Up',
      'Split Stance Row',
      'Activation Ball Prone Shoulder Press',
      'Prisoner Squat Calf Raise',
    ],
    21: [
      'Half Kneeling Throw And Catch',
      'One Ins Ladder Drill',
      'Incline Stance Curl To Overhead Press',
      'Long Lever Ball Crunch',
      'Step Up To Balance Sagital',
      'Split Jerk',
      'Lunge To Balance Frontal',
      'Iron Cross',
      'Jumping Jacks',
      'Supine Biceps Femoris Stretch',
    ],
    22: [
      'Core Ball Crunch',
      'Latissimus Dorsi Ball Stretch',
      'Static Standing Adductor Stretch',
      'Supine Dumbbell Extension',
      'Dumbbell Ball Combo Ii',
      'Medicine Ball Step Over Push Up',
      'Lunge To Balance',
      'Seated Single Arm Dumbbell Tricep Extension',
      'Kettlebell Crush Curl With Squat',
      'Transverse Slalom',
    ],
    23: [
      'Static 90 90 Hamstring Stretch',
      'Single Leg Squat',
      'Activation Serratus Push Up',
      'Reciprocating Kettlebell Overhead Press',
      'Activation Ball Prone Shoulder Ext Rotation',
      'Static 3d Standing Hip Flexor Stretch',
      'Static Standing Adductor Magnus',
      'Squat Jump With Stabilization Transverse',
      'Lunge To Balance Transverse',
      'Single Arm Standing Row With Rotation',
    ],
    24: [
      'Squat Jump With Stabilization Frontal',
      'Static 3d Standing Tfl Stretch',
      'Static Erector Spinae Stretch',
      'Static Kneeling Hip Flexor Stretch',
      'Static Pectoral Ball Stretch',
      'Self Myofascial Release Smr Tensor Fascia Latae',
      '180 Jump With Stabilization',
      'Static Seated Calf Stretch',
      'Prisoner Squat',
      'Kettlebell Deadlift',
    ],
    25: [
      'Self Myofascial Release Smr Latissimus Dorsi',
      'Two Arm Dumbbell Chest Press With Band',
      'Static Standing Quadriceps Stretch',
      'In In Out Out Ladder Drill',
      'Kettlebell Clean To Press',
      'Kettlebell Floor Press',
      'Ali Shuffle Ladder Drill',
      'Repeat Squat Jumps Multiplanar',
      'Bent Over Dumbbell Rear Fly With Neutral Grip',
      'Slalom',
    ],
    26: [
      'Box Jump Down To Tuck Jump',
      'Repeat Ice Skater',
      'Single Leg Reach Sagittal',
      'Static Posterior Shoulder Stretch',
      'Self Myofascial Release Smr Quadriceps',
      'Dumbbell Push Press',
      'Kettlebell Arm Bar',
      'Plyometric Push Up',
      'Box Jumps',
      'Single Leg Squat To Row',
    ],
    27: [
      'Squat To Single Arm Row',
      'Single Leg Throw And Catch Frontal',
      'W In In Out Out',
      'Side Lying Leg Raise',
      'Incline Dumbbell Curl',
      'Squat Jump With Stabilization Multiplanar',
      "Child's Pose",
      'Seated Leg Curl',
      'Medicine Ball Bent Over Chest Pass',
      'Lunge Jump',
      'Dumbbell Renegade Row To Push Up',
    ],
  }

  // Filter if needed
  let queue = catalog

  if (options.only && options.only.length > 0) {
    const exactMatches = catalog.filter(item => {
      const slug = exerciseToFilename(item.name).replace(/\.jpg$/, '')
      const name = item.name.toLowerCase()
      const rawSlug = (item.slug || '').toLowerCase()
      return options.only.some(q => name === q || slug === q || rawSlug === q)
    })
    if (exactMatches.length > 0) {
      queue = exactMatches
    } else {
      queue = catalog.filter(item => {
        const slug = exerciseToFilename(item.name).replace(/\.jpg$/, '')
        const name = item.name.toLowerCase()
        return options.only.some(q => name.includes(q) || slug.includes(q))
      })
    }
    console.log(`Filtered to ${queue.length} items matching --only filter.`)
  } else if (options.wave && CURATED_WAVES[options.wave]) {
    const seenFilenames = new Set()
    queue = []
    for (const targetName of CURATED_WAVES[options.wave]) {
      const match = catalog.find(item => item.name.toLowerCase() === targetName.toLowerCase())
      if (match) {
        const fn = exerciseToFilename(match.name)
        if (!seenFilenames.has(fn)) {
          seenFilenames.add(fn)
          queue.push(match)
        }
      }
    }
    console.log(`Curated Wave ${options.wave}: Filtered to ${queue.length} foundational exercises.`)
  } else {
    queue = queue.slice(options.offset, options.offset + options.batch)
  }

  console.log(`Queue size for this run: ${queue.length} exercises.\n`)

  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i]
    const filename = exerciseToFilename(item.name)
    const destPath = path.join(OUTPUT_DIR, filename)
    const indexStr = `[${String(i + 1).padStart(2)}/${queue.length}]`
    const prompt = synthesizeNasmPrompt(item)

    console.log(`${indexStr} Exercise: "${item.name}"`)
    console.log(`     Target: ${filename}`)
    console.log(`     NASM CDN Reference: ${item.imageUrl || 'N/A'}`)
    console.log(`     Equipment Detected: ${detectEquipment(item.name, item.description, item.primaryEquipment)}`)
    console.log(`     GAA Watermark: ${options.branding ? 'Enabled (Top-Right Crest)' : 'Disabled'}`)
    console.log(`     Prompt:\n     "${prompt}"\n`)

    if (options.dryRun) {
      successCount++
      continue
    }

    if (fs.existsSync(destPath) && !options.force) {
      console.log(`     ⏭️  File already exists, skipping. Use --force to regenerate.\n`)
      skipCount++
      continue
    }

    try {
      console.log(`     ⏳ Generating image with ${options.model}...`)
      const usedModel = await generateWithGemini(prompt, destPath, options.model, options.branding)
      const sizeKb = Math.round(fs.statSync(destPath).size / 1024)
      console.log(`     ✅ Generated & Branded: ${filename} (${sizeKb} KB via ${usedModel})\n`)
      successCount++
    } catch (err) {
      console.error(`     ❌ Generation failed: ${err.message}\n`)
      errorCount++
    }

    // Rate-limiting delay between generative calls
    if (i < queue.length - 1) {
      await new Promise(r => setTimeout(r, 2500))
    }
  }

  if (successCount > 0 && !options.dryRun) {
    console.log('🔄 Automatically updating manifest.json and lib/nasm-generated-images.ts...')
    const existingFiles = new Set(
      fs.existsSync(OUTPUT_DIR) ? fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png')) : []
    )

    const manifest = {}
    for (const item of catalog) {
      const filename = exerciseToFilename(item.name)
      if (existingFiles.has(filename)) {
        manifest[item.name.toLowerCase()] = `/images/exercises/${filename}`
      }
    }

    const manifestPath = path.join(OUTPUT_DIR, 'manifest.json')
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

    const tsPath = path.resolve(ROOT, 'lib/nasm-generated-images.ts')
    const tsContent = `/**
 * Gordon Athletic Advisory — Verified Master Generated Exercise Images
 * 100% synchronized with official NASM Edge catalog and GAA luxury brand aesthetic.
 * Auto-generated by scripts/generate-nasm-edge-exercises.mjs
 */
export const VERIFIED_GAA_EXERCISE_IMAGES: Record<string, string> = ${JSON.stringify(manifest, null, 2)}
`
    fs.writeFileSync(tsPath, tsContent)
    console.log(`✅ Synced manifest with ${Object.keys(manifest).length} verified exercises.\n`)
  }

  console.log('──────────────────────────────────────────────────')
  console.log(`✨ Run Complete: ${successCount} successful, ${skipCount} skipped, ${errorCount} errors.`)
}

if (process.argv[1] && (process.argv[1].endsWith('generate-nasm-edge-exercises.mjs') || process.argv[1] === fileURLToPath(import.meta.url))) {
  main().catch(err => {
    console.error('Fatal error in generator script:', err)
    process.exit(1)
  })
}
