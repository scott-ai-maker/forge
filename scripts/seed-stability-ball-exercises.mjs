import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// 1. Read environment variables from .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim()
      if (!process.env[key]) {
        process.env[key] = val
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dgzdubbrneqfdleprjfr.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
  console.log('Notice: SUPABASE_SERVICE_ROLE_KEY is not set in environment or .env.local.')
  console.log('The SQL migration file is ready at supabase/migrations/20260923_stability_ball_library_entries.sql for direct database execution.')
  process.exit(0)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const stabilityBallEquipment = {
  id: 'b0500000-0000-4000-8000-000000000002',
  source: 'licensed_import',
  source_id: 'theraband-stability-ball',
  slug: 'theraband-stability-ball',
  name: 'TheraBand Stability Ball',
  description: 'TheraBand Pro Series SCP (Slow Deflate Technology) Exercise Ball. Engineered for clinical rehabilitation, core stabilization, and neuromuscular control across calibrated diameter progressions.',
  media_image_url: 'https://img.youtube.com/vi/FfTyQAYrnqM/hqdefault.jpg',
  metadata_json: { category: 'Balance & Stabilization', brand: 'TheraBand', manufacturer: 'Performance Health', modality: 'slow_deflate_ball', verified_official: true },
  is_active: true,
}

const stabilityBallExercises = [
  {
    id: 'b0500002-0000-4000-8000-000000000001',
    source: 'licensed_import',
    source_id: 'stability-ball-hamstring-curl',
    slug: 'stability-ball-hamstring-curl',
    name: 'Stability Ball Hamstring Curl',
    description: 'Step 1: Setup Lie supine on floor with heels and lower calves centered on the TheraBand Stability Ball, arms extended at your sides for lateral stability.\n\nStep 2: Brace/Position Drive hips upward into full bridge alignment, forming a straight line from shoulders to heels.\n\nStep 3: Execute Curl heels smoothly toward glutes by flexing knees while maintaining elevated hip extension. Avoid sagging hips toward the floor.\n\nStep 4: Return/Repeat Slowly extend legs back out over 4 controlled seconds to starting bridge position and repeat.',
    coaching_cues: ['Drive hips upward into full bridge with heels dug firmly into ball center', 'Curl heels smoothly toward glutes without allowing hips to sag toward floor', 'Maintain rigid pelvic alignment and slow 4-second eccentric rollout'],
    primary_equipment: ['Stability Ball'],
    muscle_groups: ['hamstrings', 'gluteus maximus', 'calves', 'core'],
    media_image_url: 'https://img.youtube.com/vi/Z3cY3d3BBo4/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=Z3cY3d3BBo4',
    metadata_json: { nasm_opt_phase: 1, tempo: '4/2/1', category: 'lower', sizing: '55-65 cm', source_author: 'NASM Edge Master Series' },
    is_active: true,
  },
  {
    id: 'b0500002-0000-4000-8000-000000000002',
    source: 'licensed_import',
    source_id: 'stability-ball-push-up',
    slug: 'stability-ball-push-up',
    name: 'Stability Ball Push-Up',
    description: 'Step 1: Setup Place hands shoulder-width apart on the apex of the TheraBand Stability Ball, fingers spread wide and wrists in neutral alignment.\n\nStep 2: Brace/Position Extend feet behind you into a push-up plank, feet hip-width apart. Engage core and glutes to lock spine in neutral.\n\nStep 3: Execute Lower chest toward ball over 4 controlled seconds, keeping elbows tracking at a 45-degree angle to ribcage.\n\nStep 4: Return/Repeat Press aggressively through palms to full arm extension without allowing the ball to roll or wobble.',
    coaching_cues: ['Place palms shoulder-width apart on ball apex, fingers spread wide', 'Lower chest toward ball over 4 controlled seconds, keeping elbows tucked 45°', 'Push aggressively through palms without letting the ball roll or wobble'],
    primary_equipment: ['Stability Ball'],
    muscle_groups: ['pectorals', 'triceps', 'rotator cuff', 'anterior core'],
    media_image_url: 'https://img.youtube.com/vi/pxpGo3EtwkM/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=pxpGo3EtwkM',
    metadata_json: { nasm_opt_phase: 1, tempo: '4/2/1', category: 'upper', sizing: '55-65 cm', source_author: 'Sofia Gotzi, PT (TheraBand Protocol)' },
    is_active: true,
  },
  {
    id: 'b0500002-0000-4000-8000-000000000003',
    source: 'licensed_import',
    source_id: 'stability-ball-wall-squat',
    slug: 'stability-ball-wall-squat',
    name: 'Stability Ball Wall Squat',
    description: 'Step 1: Setup Place the TheraBand Stability Ball against a smooth wall, positioned snug against the lumbar curve of your lower back.\n\nStep 2: Brace/Position Walk feet forward 12-18 inches, shoulder-width apart with toes pointing straight ahead.\n\nStep 3: Execute Squat down smoothly by flexing hips and knees until thighs are parallel to floor, allowing ball to roll up spine.\n\nStep 4: Return/Repeat Drive upward through midfoot and heels back to standing, maintaining constant pressure against the ball.',
    coaching_cues: ['Position ball snug against small of lower back and smooth wall surface', 'Walk feet 12-18 inches forward, hip-width apart, toes pointing straight', 'Descend smoothly to 90° knee flexion while maintaining constant back-to-ball pressure'],
    primary_equipment: ['Stability Ball'],
    muscle_groups: ['quadriceps', 'gluteus medius', 'vastus medialis', 'lumbar erectors'],
    media_image_url: 'https://img.youtube.com/vi/2TOqw5wSfgE/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=2TOqw5wSfgE',
    metadata_json: { nasm_opt_phase: 1, tempo: '4/2/1', category: 'lower', sizing: '65-75 cm', source_author: 'Chad Blair (TheraBand Protocol)' },
    is_active: true,
  },
  {
    id: 'b0500002-0000-4000-8000-000000000004',
    source: 'licensed_import',
    source_id: 'stability-ball-crunch',
    slug: 'stability-ball-crunch',
    name: 'Stability Ball Crunch',
    description: 'Step 1: Setup Sit on the TheraBand Stability Ball and roll forward until ball supports your lumbar spine and middle back, feet flat on floor.\n\nStep 2: Brace/Position Support head lightly with fingertips or cross arms over chest. Allow spine to gently drape back over curvature.\n\nStep 3: Execute Contract abdominals to flex thoracic spine upward over ball, curling ribcage toward pelvis with 2-second peak isometric hold.\n\nStep 4: Return/Repeat Lower under control back over curvature to full abdominal stretch and repeat.',
    coaching_cues: ['Lie supine with ball positioned under lumbar curve and thoracic spine draped back', 'Support head lightly with fingertips; avoid pulling on cervical spine', 'Exhale and flex spine upward over ball, holding 2-second peak isometric crunch'],
    primary_equipment: ['Stability Ball'],
    muscle_groups: ['rectus abdominis', 'transverse abdominis', 'internal obliques'],
    media_image_url: 'https://img.youtube.com/vi/QFLftqPWjoI/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=QFLftqPWjoI',
    metadata_json: { nasm_opt_phase: 1, tempo: '4/2/1', category: 'core', sizing: '55-65 cm', source_author: 'NASM Edge Master Series' },
    is_active: true,
  },
  {
    id: 'b0500002-0000-4000-8000-000000000005',
    source: 'licensed_import',
    source_id: 'stability-ball-dumbbell-chest-press',
    slug: 'stability-ball-dumbbell-chest-press',
    name: 'Stability Ball Dumbbell Chest Press',
    description: 'Step 1: Setup Hold dumbbells at shoulders and sit on ball. Roll forward into a supine bridge with head, neck, and upper back firmly supported.\n\nStep 2: Brace/Position Contract glutes and core so torso and thighs form a rigid table-top parallel to floor.\n\nStep 3: Execute Press dumbbells upward in a slight arc directly over mid-chest, stopping just short of full elbow lockout.\n\nStep 4: Return/Repeat Lower dumbbells smoothly over 2 seconds until elbows reach 90 degrees, maintaining rigid level hips throughout.',
    coaching_cues: ['Rest head, neck, and upper back firmly on ball with torso parallel to floor in bridge', 'Squeeze glutes to lock hips horizontal throughout entire bilateral dumbbell press', 'Press dumbbells in smooth arc directly over chest without flaring elbows past 90°'],
    primary_equipment: ['Stability Ball', 'Dumbbells'],
    muscle_groups: ['pectoralis major', 'anterior deltoids', 'triceps', 'gluteus maximus'],
    media_image_url: 'https://img.youtube.com/vi/FfTyQAYrnqM/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=FfTyQAYrnqM',
    metadata_json: { nasm_opt_phase: 2, tempo: '2/0/2', category: 'upper', sizing: '55-65 cm', source_author: 'Performance Health Master Series' },
    is_active: true,
  },
  {
    id: 'b0500002-0000-4000-8000-000000000006',
    source: 'licensed_import',
    source_id: 'stability-ball-prone-cobra',
    slug: 'stability-ball-prone-cobra',
    name: 'Stability Ball Prone Cobra (W-Y Raise)',
    description: 'Step 1: Setup Lie prone over the TheraBand Stability Ball with chest and abdomen supported, feet anchored wide against floor for balance.\n\nStep 2: Brace/Position Keep neck neutral with chin tucked. Arms hang loosely toward floor.\n\nStep 3: Execute Retract and depress shoulder blades, lifting chest slightly off ball and driving arms upward in a W-to-Y trajectory thumbs up.\n\nStep 4: Return/Repeat Hold 2 seconds at peak contraction, then lower slowly back to start.',
    coaching_cues: ['Lie prone with chest and pelvis anchored on ball, feet anchored wide against floor', 'Retract and depress shoulder blades, driving thumbs toward ceiling in W to Y transition', 'Keep chin tucked in neutral cervical alignment; avoid hyperextending neck'],
    primary_equipment: ['Stability Ball'],
    muscle_groups: ['lower trapezius', 'rhomboids', 'infraspinatus', 'erector spinae'],
    media_image_url: 'https://img.youtube.com/vi/j6D0V742sT8/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=j6D0V742sT8',
    metadata_json: { nasm_opt_phase: 1, tempo: '4/2/1', category: 'core', sizing: '55-65 cm', source_author: 'Performance Health Master Series' },
    is_active: true,
  },
  {
    id: 'b0500002-0000-4000-8000-000000000007',
    source: 'licensed_import',
    source_id: 'stability-ball-roll-in',
    slug: 'stability-ball-roll-in',
    name: 'Stability Ball Roll-In / Pike',
    description: 'Step 1: Setup Start in a rigid push-up plank with shins resting on the apex of the TheraBand Stability Ball and hands on floor.\n\nStep 2: Brace/Position Brace abdominal wall and stabilize shoulders directly over wrists.\n\nStep 3: Execute Pull knees inward toward chest (or pike hips upward) by contracting abdominals, rolling ball forward onto tops of toes.\n\nStep 4: Return/Repeat Slowly roll ball back out to starting plank line without sagging hips.',
    coaching_cues: ['Start in rigid push-up plank with shins resting centered on ball apex', 'Contract core and pull knees toward chest (or pike hips straight up over shoulders)', 'Control return smoothly without hyperextending lumbar spine at bottom'],
    primary_equipment: ['Stability Ball'],
    muscle_groups: ['rectus abdominis', 'iliopsoas', 'serratus anterior', 'shoulders'],
    media_image_url: 'https://img.youtube.com/vi/ZquTk8GmA_I/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=ZquTk8GmA_I',
    metadata_json: { nasm_opt_phase: 2, tempo: '2/0/2', category: 'core', sizing: '55-65 cm', source_author: 'NASM Edge Master Series' },
    is_active: true,
  },
  {
    id: 'b0500002-0000-4000-8000-000000000008',
    source: 'licensed_import',
    source_id: 'stability-ball-back-extension',
    slug: 'stability-ball-back-extension',
    name: 'Stability Ball Back Extension with Rotation',
    description: 'Step 1: Setup Position anterior pelvis and thighs over ball, feet anchored firmly against base of wall or floor.\n\nStep 2: Brace/Position Cross arms over chest or place fingertips by ears, draping upper torso forward over ball.\n\nStep 3: Execute Extend spine to neutral alignment, then smoothly rotate torso 15-20 degrees to one side by contracting obliques.\n\nStep 4: Return/Repeat Rotate back to center, lower torso over ball curve, and alternate rotation on subsequent repetitions.',
    coaching_cues: ['Anchor anterior pelvis and thighs on ball with feet braced against wall or floor', 'Cross arms over chest or fingertips at ears; lower torso over ball curve', 'Extend spine to neutral alignment, then rotate torso 15-20° under strict control'],
    primary_equipment: ['Stability Ball'],
    muscle_groups: ['erector spinae', 'internal obliques', 'external obliques', 'multifidus'],
    media_image_url: 'https://img.youtube.com/vi/b_Iri5nayDk/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=b_Iri5nayDk',
    metadata_json: { nasm_opt_phase: 1, tempo: '4/2/1', category: 'core', sizing: '55-65 cm', source_author: 'NASM Edge Master Series' },
    is_active: true,
  },
  {
    id: 'b0500002-0000-4000-8000-000000000009',
    source: 'licensed_import',
    source_id: 'stability-ball-loaded-bridge',
    slug: 'stability-ball-loaded-bridge',
    name: 'Stability Ball Loaded Bridge',
    description: 'Step 1: Setup Support upper back and shoulders on the TheraBand Stability Ball, knees bent at 90 degrees with feet flat on floor.\n\nStep 2: Brace/Position Optionally place a dumbbell or plate across hips, holding it securely with both hands.\n\nStep 3: Execute Lower hips toward floor, then drive through heels to full hip extension, squeezing glutes hard for 2 seconds at top.\n\nStep 4: Return/Repeat Lower hips under control over 4 seconds and repeat without bouncing.',
    coaching_cues: ['Upper back and scapulae resting on ball, knees bent at 90°, feet flat on floor', 'Lower hips toward floor, then drive through heels to full hip extension', 'Maintain level pelvis without swaying; squeeze glutes intensely at top'],
    primary_equipment: ['Stability Ball'],
    muscle_groups: ['gluteus maximus', 'biceps femoris', 'transverse abdominis'],
    media_image_url: 'https://img.youtube.com/vi/wgcyPpK60wc/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=wgcyPpK60wc',
    metadata_json: { nasm_opt_phase: 1, tempo: '4/2/1', category: 'lower', sizing: '55-65 cm', source_author: 'NASM Edge Master Series' },
    is_active: true,
  },
  {
    id: 'b0500002-0000-4000-8000-000000000010',
    source: 'licensed_import',
    source_id: 'stability-ball-russian-twist',
    slug: 'stability-ball-russian-twist',
    name: 'Stability Ball Russian Twist',
    description: 'Step 1: Setup Lie supine with head and shoulders centered on ball in a rigid bridge, knees at 90 degrees and feet flat.\n\nStep 2: Brace/Position Clasp hands together straight above chest with arms extended.\n\nStep 3: Execute Rotate torso smoothly onto one shoulder while keeping hips elevated and level to the floor.\n\nStep 4: Return/Repeat Pause at 45-degree shoulder roll, rotate back across center to opposite shoulder, and repeat.',
    coaching_cues: ['Lie supine in bridge position with head and shoulders supported on ball', 'Clasp hands straight up over chest; rotate torso onto one shoulder', 'Keep hips elevated and level with floor throughout rotation; resist hip drop'],
    primary_equipment: ['Stability Ball'],
    muscle_groups: ['internal obliques', 'external obliques', 'transverse abdominis', 'glutes'],
    media_image_url: 'https://img.youtube.com/vi/t3HhJ_LolVg/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=t3HhJ_LolVg',
    metadata_json: { nasm_opt_phase: 1, tempo: '4/2/1', category: 'core', sizing: '55-65 cm', source_author: 'Performance Health Academy Network' },
    is_active: true,
  },
  {
    id: 'b0500002-0000-4000-8000-000000000011',
    source: 'licensed_import',
    source_id: 'stability-ball-scapular-triad',
    slug: 'stability-ball-scapular-triad',
    name: 'Stability Ball Scapular Triad (Ball Combo I)',
    description: 'Step 1: Setup Lie prone with chest supported on the TheraBand Stability Ball, light dumbbells in hand, neck neutral.\n\nStep 2: Brace/Position Brace core and anchor toes to floor.\n\nStep 3: Execute Raise arms in Y-scaption (45 degrees), then T-abduction (90 degrees), then W-retraction, squeezing rhomboids and lower traps.\n\nStep 4: Return/Repeat Lower smoothly between each phase, ensuring upper trapezius remains relaxed.',
    coaching_cues: ['Chest supported on ball, light dumbbells in hands, neutral head position', 'Perform controlled Y-raise, T-raise, and W-scapular squeeze sequence', 'Focus on scapular depression and retraction; avoid shrugging upper traps'],
    primary_equipment: ['Stability Ball', 'Dumbbells'],
    muscle_groups: ['middle trapezius', 'lower trapezius', 'posterior deltoids'],
    media_image_url: 'https://img.youtube.com/vi/xb3-dysLHpE/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=xb3-dysLHpE',
    metadata_json: { nasm_opt_phase: 1, tempo: '4/2/1', category: 'upper', sizing: '55-65 cm', source_author: 'NASM Edge Master Series' },
    is_active: true,
  },
  {
    id: 'b0500002-0000-4000-8000-000000000012',
    source: 'licensed_import',
    source_id: 'stability-ball-prone-shoulder-press',
    slug: 'stability-ball-prone-shoulder-press',
    name: 'Stability Ball Prone Shoulder Press',
    description: 'Step 1: Setup Lie prone on the TheraBand Stability Ball, balls of feet anchored on floor, holding light dumbbells at shoulder level.\n\nStep 2: Brace/Position Establish unbroken line from heels through head, activating glutes and erectors.\n\nStep 3: Execute Press dumbbells forward and overhead in line with torso plane, fully extending arms without arching lower back.\n\nStep 4: Return/Repeat Pull dumbbells smoothly back to shoulder level over 2 seconds and repeat.',
    coaching_cues: ['Prone on ball with toes anchored to ground, holding light dumbbells at shoulders', 'Maintain rigid posterior chain line from heels through crown of head', 'Press weights overhead in scapular plane without arching lumbar spine'],
    primary_equipment: ['Stability Ball', 'Dumbbells'],
    muscle_groups: ['deltoids', 'triceps', 'erector spinae', 'glutes'],
    media_image_url: 'https://img.youtube.com/vi/VZJ0PHuNrYI/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=VZJ0PHuNrYI',
    metadata_json: { nasm_opt_phase: 2, tempo: '2/0/2', category: 'upper', sizing: '55-65 cm', source_author: 'NASM Edge Master Series' },
    is_active: true,
  },
]

async function seed() {
  console.log('Seeding TheraBand Stability Ball Equipment into equipment_library_entries...')
  const { error: equipErr } = await supabase
    .from('equipment_library_entries')
    .upsert(stabilityBallEquipment, { onConflict: 'id' })
  if (equipErr) {
    console.error('Error upserting equipment:', equipErr.message)
  } else {
    console.log('✓ Successfully upserted TheraBand Stability Ball equipment record.')
  }

  console.log('Seeding 12 TheraBand Stability Ball Exercises into exercise_library_entries...')
  let successCount = 0
  for (const ex of stabilityBallExercises) {
    const { error: exErr } = await supabase
      .from('exercise_library_entries')
      .upsert(ex, { onConflict: 'id' })
    if (exErr) {
      console.error(`Error upserting ${ex.name}:`, exErr.message)
    } else {
      successCount++
      console.log(`✓ [${successCount}/12] Upserted: ${ex.name}`)
    }
  }

  console.log(`\nTheraBand Stability Ball database seeding completed: ${successCount}/12 exercises active.`)
}

seed().catch((err) => {
  console.error('Seeding execution failed:', err)
  process.exit(1)
})
