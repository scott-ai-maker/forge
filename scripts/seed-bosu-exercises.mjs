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
  console.log('The SQL migration file is ready at supabase/migrations/20260923_bosu_library_entries.sql for direct database execution.')
  process.exit(0)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const bosuEquipment = {
  id: 'b0500000-0000-4000-8000-000000000001',
  source: 'licensed_import',
  source_id: 'bosu-balance-trainer',
  slug: 'bosu-balance-trainer',
  name: 'BOSU Balance Trainer',
  description: 'Proprioceptively enriched dynamic balance trainer with an inflatable rubber dome mounted on a rigid circular platform. Both Sides Utilized for balance, core stabilization, and neuromuscular conditioning.',
  media_image_url: 'https://img.youtube.com/vi/evJOL2cdmt4/hqdefault.jpg',
  metadata_json: { category: 'Balance & Stabilization', brand: 'BOSU', modality: 'unstable_surface', source_channel: '@BOSUOfficial', verified_official: true },
  is_active: true,
}

const bosuExercises = [
  {
    id: 'b0500001-0000-4000-8000-000000000001',
    source: 'licensed_import',
    source_id: 'bosu-plank',
    slug: 'bosu-plank',
    name: 'BOSU Plank',
    description: 'Step 1: Setup Place the BOSU Balance Trainer dome-side up on a non-slip floor mat. Kneel in front of the dome and rest your forearms directly across the center crown of the dome, elbows bent 90 degrees directly beneath your shoulders.\n\nStep 2: Brace/Position Step your feet back into a full plank position, feet hip-width apart. Engage your glutes, draw your navel toward your spine, and establish a neutral pelvic tilt.\n\nStep 3: Execute Maintain a rigid isometric bridge line from occiput to heels. Press your forearms actively into the dome to prevent scapular winging, resisting the micro-oscillations of the air bladder.\n\nStep 4: Return/Repeat Hold with steady diaphragmatic breathing for the prescribed duration (20-60 seconds) without allowing hips to sag or hike.',
    coaching_cues: ['Forearms pressed firmly into center of dome', 'Maintain neutral cervical spine and level pelvis', 'Resist dome oscillation with deep transverse abdominis engagement'],
    primary_equipment: ['BOSU Balance Trainer'],
    muscle_groups: ['core', 'abdominals', 'shoulders'],
    media_image_url: 'https://img.youtube.com/vi/C_NM5IbRlqM/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=C_NM5IbRlqM',
    open_externally_only: false,
    metadata_json: { nasm_opt_phase: 1, tempo: 'Isometric', category: 'Core & Stabilization', source_channel: '@BOSUOfficial', trainer: 'Katie Kasten', verified_official: true },
    is_active: true,
  },
  {
    id: 'b0500001-0000-4000-8000-000000000002',
    source: 'licensed_import',
    source_id: 'bosu-push-up',
    slug: 'bosu-push-up',
    name: 'BOSU Push-Up',
    description: 'Step 1: Setup Invert the BOSU Balance Trainer platform-side up (dome on floor). Grasp the outer perimeter handles or platform rim with both hands in a neutral grip, wrists straight.\n\nStep 2: Brace/Position Step feet back into high push-up plank stance, balls of feet anchored, core fully braced, and glutes clamped.\n\nStep 3: Execute Lower your chest toward the center of the platform under a controlled 4-second eccentric count, keeping elbows tucked at 45 degrees and maintaining platform stability.\n\nStep 4: Return/Repeat Press through both palms explosively to full elbow lockout without allowing the platform to wobble, and repeat for prescribed repetitions.',
    coaching_cues: ['Firm grip on platform perimeter handles', 'Elbows track at 45-degree angle to ribcage', 'Strict 4-second descent with level platform control'],
    primary_equipment: ['BOSU Balance Trainer'],
    muscle_groups: ['chest', 'triceps', 'shoulders', 'core'],
    media_image_url: 'https://img.youtube.com/vi/Wo3viNH3E1c/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=Wo3viNH3E1c',
    open_externally_only: false,
    metadata_json: { nasm_opt_phase: 1, tempo: '4/2/1', category: 'Chest & Upper Body', source_channel: '@BOSUOfficial', trainer: 'Mindy Mylrea', verified_official: true },
    is_active: true,
  },
  {
    id: 'b0500001-0000-4000-8000-000000000003',
    source: 'licensed_import',
    source_id: 'bosu-single-leg-balance-reach',
    slug: 'bosu-single-leg-balance-reach',
    name: 'BOSU Single-Leg Balance Reach',
    description: 'Step 1: Setup Place the BOSU dome-side up. Stand centered on the dome with your stance foot aligned over the bullseye logo, hands on hips.\n\nStep 2: Brace/Position Lift the non-support leg so the thigh is parallel to the ground, knee bent 90 degrees. Establish single-leg tripod balance through the heel and forefoot.\n\nStep 3: Execute Slowly reach the non-support leg forward in the sagittal plane, then return to center; reach laterally in the frontal plane, and then transversely behind while maintaining level hips.\n\nStep 4: Return/Repeat Complete prescribed multiplanar reaches with a 4-second tempo before alternating to the opposite leg.',
    coaching_cues: ['Center stance foot directly over dome apex', 'Keep pelvis and shoulders square throughout all reach planes', 'Drive intrinsic foot stabilizers and knee flexion control'],
    primary_equipment: ['BOSU Balance Trainer'],
    muscle_groups: ['glutes', 'calves', 'core', 'hamstrings'],
    media_image_url: 'https://img.youtube.com/vi/I4kiGgKpb58/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=I4kiGgKpb58',
    open_externally_only: false,
    metadata_json: { nasm_opt_phase: 1, tempo: '4/2/1', category: 'Balance & Stabilization', source_channel: '@BOSUOfficial', trainer: 'Candace Moore', verified_official: true },
    is_active: true,
  },
  {
    id: 'b0500001-0000-4000-8000-000000000004',
    source: 'licensed_import',
    source_id: 'bosu-glute-bridge',
    slug: 'bosu-glute-bridge',
    name: 'BOSU Glute Bridge',
    description: 'Step 1: Setup Lie supine on the floor with knees bent, arms resting by your sides, and heels positioned firmly on top of the dome apex of the BOSU Balance Trainer.\n\nStep 2: Brace/Position Draw in your abdominal wall, brace your core, and set your pelvis in neutral alignment.\n\nStep 3: Execute Drive through your heels into the dome to extend hips toward the ceiling until your body forms a straight line from knees through hips to shoulders.\n\nStep 4: Return/Repeat Hold glute contraction at top for 2 seconds, then slowly lower hips under a 4-second eccentric descent without fully unloading at the bottom.',
    coaching_cues: ['Drive force through heels into center of dome', 'Full hip extension with intense glute squeeze at top', 'Control eccentric lowering over 4 full seconds'],
    primary_equipment: ['BOSU Balance Trainer'],
    muscle_groups: ['glutes', 'hamstrings', 'core'],
    media_image_url: 'https://img.youtube.com/vi/d28NVu5bQPk/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=d28NVu5bQPk',
    open_externally_only: false,
    metadata_json: { nasm_opt_phase: 1, tempo: '4/2/1', category: 'Glutes & Hamstrings', source_channel: '@BOSUOfficial', trainer: 'BOSU Master Series', verified_official: true },
    is_active: true,
  },
  {
    id: 'b0500001-0000-4000-8000-000000000005',
    source: 'licensed_import',
    source_id: 'bosu-bird-dog',
    slug: 'bosu-bird-dog',
    name: 'BOSU Bird-Dog',
    description: 'Step 1: Setup Place the BOSU dome-side up. Position your knees on the center of the dome and your hands on the floor directly under your shoulders in a quadruped stance.\n\nStep 2: Brace/Position Engage your transverse abdominis, lock your pelvis level, and draw your shoulder blades back and down.\n\nStep 3: Execute Simultaneously raise your right arm straight forward and your left leg straight back until parallel to the floor, resisting rotational torque from the dome.\n\nStep 4: Return/Repeat Pause for 2 seconds at full extension, return to the dome under control, and alternate contralateral sides for prescribed reps.',
    coaching_cues: ['Maintain neutral spine without lumbar hyperextension', 'Thumb points up on forward arm, toe points down on rear leg', 'Resist pelvic tilting across the unstable dome'],
    primary_equipment: ['BOSU Balance Trainer'],
    muscle_groups: ['core', 'glutes', 'back', 'shoulders'],
    media_image_url: 'https://img.youtube.com/vi/w75gGKGNsY0/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=w75gGKGNsY0',
    open_externally_only: false,
    metadata_json: { nasm_opt_phase: 1, tempo: '4/2/1', category: 'Core & Stabilization', source_channel: '@BOSUOfficial', trainer: 'Trainer Kaitlin', verified_official: true },
    is_active: true,
  },
  {
    id: 'b0500001-0000-4000-8000-000000000006',
    source: 'licensed_import',
    source_id: 'bosu-dome-squat',
    slug: 'bosu-dome-squat',
    name: 'BOSU Dome Squat',
    description: 'Step 1: Setup Place the BOSU dome-side up. Step onto the dome with both feet hip-to-shoulder width apart, toes angled slightly outward, knees softly unlocked.\n\nStep 2: Brace/Position Find your center of mass over the dome, brace your core, keep your chest high, and extend arms forward for counter-balance.\n\nStep 3: Execute Hinge at the hips and bend knees to squat down to parallel under a strict 4-second eccentric tempo, keeping weight evenly distributed across both feet.\n\nStep 4: Return/Repeat Drive through midfoot and heels to return to standing position, extending hips and squeezing glutes at top without hyperextending knees.',
    coaching_cues: ['Chest stays tall with neutral cervical alignment', 'Knees track over second and third toes', 'Maintain constant 4/2/1 tempo throughout all repetitions'],
    primary_equipment: ['BOSU Balance Trainer'],
    muscle_groups: ['quadriceps', 'glutes', 'hamstrings', 'calves', 'core'],
    media_image_url: 'https://img.youtube.com/vi/evJOL2cdmt4/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=evJOL2cdmt4',
    open_externally_only: false,
    metadata_json: { nasm_opt_phase: 1, tempo: '4/2/1', category: 'Lower Body & Quads', source_channel: '@BOSUOfficial', verified_official: true },
    is_active: true,
  },
  {
    id: 'b0500001-0000-4000-8000-000000000007',
    source: 'licensed_import',
    source_id: 'bosu-dumbbell-chest-press',
    slug: 'bosu-dumbbell-chest-press',
    name: 'BOSU Dumbbell Chest Press',
    description: 'Step 1: Setup Sit on the forward slope of the BOSU dome holding a pair of dumbbells at your chest. Walk your feet out and roll back until your upper back, shoulders, and neck are supported by the dome.\n\nStep 2: Brace/Position Press hips up into a rigid bridge, knees bent 90 degrees, glutes locked, and dumbbells held outside shoulders with forearms vertical.\n\nStep 3: Execute Press dumbbells upward in an arc over your chest until elbows reach full extension without clanging weights together.\n\nStep 4: Return/Repeat Lower dumbbells slowly under a 4-second count to chest level while maintaining full glute bridge stability, and repeat.',
    coaching_cues: ['Keep hips elevated in rigid bridge throughout press', 'Control dumbbells with wrists stacked over elbows', 'Squeeze chest at apex of movement'],
    primary_equipment: ['BOSU Balance Trainer', 'Dumbbells'],
    muscle_groups: ['chest', 'triceps', 'shoulders', 'glutes', 'core'],
    media_image_url: 'https://img.youtube.com/vi/cjTVlA2WwqY/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=cjTVlA2WwqY',
    open_externally_only: false,
    metadata_json: { nasm_opt_phase: 2, tempo: '4/2/1', category: 'Chest & Upper Body', source_channel: '@BOSUOfficial', trainer: 'BOSU Master Series', verified_official: true },
    is_active: true,
  },
  {
    id: 'b0500001-0000-4000-8000-000000000008',
    source: 'licensed_import',
    source_id: 'bosu-lunge-to-balance',
    slug: 'bosu-lunge-to-balance',
    name: 'BOSU Lunge to Balance',
    description: 'Step 1: Setup Place BOSU dome-side up. Stand 2-3 feet behind the dome with feet hip-width apart and hands on hips or at chest.\n\nStep 2: Brace/Position Step forward with your lead foot directly onto the center apex of the dome, sinking into a lunge until both knees reach 90-degree flexion.\n\nStep 3: Execute Push forcefully through the lead heel and step straight back up into a single-leg balance on the trailing leg, holding opposite knee at 90 degrees.\n\nStep 4: Return/Repeat Hold the single-leg balance for 2 seconds before stepping back into the next lunge repetition, completing all reps before switching legs.',
    coaching_cues: ['Step accurately onto dome center bullseye', 'Decelerate smoothly into the lunge without knee collapse', 'Stabilize upright single-leg balance for 2 seconds between reps'],
    primary_equipment: ['BOSU Balance Trainer'],
    muscle_groups: ['quadriceps', 'glutes', 'hamstrings', 'calves', 'core'],
    media_image_url: 'https://img.youtube.com/vi/BAC6B69Q70A/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=BAC6B69Q70A',
    open_externally_only: false,
    metadata_json: { nasm_opt_phase: 2, tempo: '2/0/2', category: 'Lower Body & Balance', source_channel: '@BOSUOfficial', trainer: 'Katie Kasten', verified_official: true },
    is_active: true,
  },
  {
    id: 'b0500001-0000-4000-8000-000000000009',
    source: 'licensed_import',
    source_id: 'bosu-mountain-climbers',
    slug: 'bosu-mountain-climbers',
    name: 'BOSU Mountain Climbers',
    description: 'Step 1: Setup Invert the BOSU platform-side up. Grip the handles on the edges of the platform and assume a high plank position.\n\nStep 2: Brace/Position Align shoulders over wrists, draw in abdominal wall, and establish an unbroken spine line.\n\nStep 3: Execute Drive one knee smoothly toward your chest while keeping hips low and the platform stable, then quickly switch legs in a rhythmic running cadence.\n\nStep 4: Return/Repeat Continue alternating knees at a high, controlled tempo for the prescribed time interval (30-45 seconds).',
    coaching_cues: ['Keep platform rock-steady without side-to-side tilting', 'Drive knees straight forward under chest without hiking hips', 'Maintain steady rhythmic breathing and braced core'],
    primary_equipment: ['BOSU Balance Trainer'],
    muscle_groups: ['core', 'hip flexors', 'shoulders', 'calves'],
    media_image_url: 'https://img.youtube.com/vi/iyZHqgsI4Zk/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=iyZHqgsI4Zk',
    open_externally_only: false,
    metadata_json: { nasm_opt_phase: 2, tempo: 'Fast/Controlled', category: 'Core & Conditioning', source_channel: '@BOSUOfficial', verified_official: true },
    is_active: true,
  },
  {
    id: 'b0500001-0000-4000-8000-000000000010',
    source: 'licensed_import',
    source_id: 'bosu-russian-twist',
    slug: 'bosu-russian-twist',
    name: 'BOSU Russian Twist',
    description: 'Step 1: Setup Sit on top of the BOSU dome with knees bent and feet flat on the floor in front of you. Lean back slightly until your core engages, holding a V-sit posture.\n\nStep 2: Brace/Position Lift feet 2-4 inches off the floor to balance solely on the dome. Clasp hands together in front of your chest with elbows slightly bent.\n\nStep 3: Execute Rotate your torso to the right, tapping hands near the dome rim, then rotate across to the left under strict rotary control.\n\nStep 4: Return/Repeat Continue alternating rotations smoothly for prescribed repetitions while maintaining V-sit balance on the dome.',
    coaching_cues: ['Rotate from thoracic spine and obliques, not just arms', 'Keep chest proud and avoid rounding the lumbar spine', 'Maintain steady V-sit balance without feet touching ground'],
    primary_equipment: ['BOSU Balance Trainer'],
    muscle_groups: ['obliques', 'abdominals', 'hip flexors'],
    media_image_url: 'https://img.youtube.com/vi/M2AAcj_K0mg/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=M2AAcj_K0mg',
    open_externally_only: false,
    metadata_json: { nasm_opt_phase: 1, tempo: '4/2/1', category: 'Core & Abdominals', source_channel: '@BOSUOfficial', verified_official: true },
    is_active: true,
  },
  {
    id: 'b0500001-0000-4000-8000-000000000011',
    source: 'licensed_import',
    source_id: 'bosu-lateral-bound-with-stabilization',
    slug: 'bosu-lateral-bound-with-stabilization',
    name: 'BOSU Lateral Bound with Stabilization',
    description: 'Step 1: Setup Place the BOSU dome-side up. Stand to the left side of the dome, balanced on your right leg with knee and hip slightly flexed.\n\nStep 2: Brace/Position Load your right glute and push off forcefully laterally, leaping over and landing on the center apex of the dome with your left foot.\n\nStep 3: Execute Absorb the landing with knee flexed, chest up, and freeze in a single-leg balance for 3 full seconds, establishing complete stability.\n\nStep 4: Return/Repeat Push off the left foot to bound back to the right landing softly, and repeat for prescribed power repetitions.',
    coaching_cues: ['Explode laterally with triple extension of ankle, knee, and hip', 'Land softly on dome apex and freeze for 3 full seconds', 'Resist ankle eversion/inversion using intrinsic foot musculature'],
    primary_equipment: ['BOSU Balance Trainer'],
    muscle_groups: ['quadriceps', 'glutes', 'calves', 'core'],
    media_image_url: 'https://img.youtube.com/vi/vEGpyuTh3zw/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=vEGpyuTh3zw',
    open_externally_only: false,
    metadata_json: { nasm_opt_phase: 5, tempo: 'Explosive with 3s hold', category: 'Plyometrics & Power', source_channel: '@BOSUOfficial', trainer: 'BOSU Master Series', verified_official: true },
    is_active: true,
  },
  {
    id: 'b0500001-0000-4000-8000-000000000012',
    source: 'licensed_import',
    source_id: 'bosu-burpee-with-overhead-press',
    slug: 'bosu-burpee-with-overhead-press',
    name: 'BOSU Burpee with Overhead Press',
    description: 'Step 1: Setup Place BOSU platform-side up on floor. Stand behind the platform with feet shoulder-width apart.\n\nStep 2: Brace/Position Squat down and grip the side handles of the platform firmly. Jump feet back into a push-up plank, perform a push-up, and jump feet back in toward hands.\n\nStep 3: Execute Powerfully stand up out of the squat while lifting the BOSU off the floor, pressing it overhead to full arm lockout.\n\nStep 4: Return/Repeat Lower the BOSU back to the floor with control and immediately initiate the next burpee repetition.',
    coaching_cues: ['Firm grip on platform handles throughout transition', 'Drive through heels to lift and press BOSU overhead', 'Maintain neutral lumbar spine during the hinge and floor transitions'],
    primary_equipment: ['BOSU Balance Trainer'],
    muscle_groups: ['chest', 'shoulders', 'quadriceps', 'glutes', 'core', 'triceps'],
    media_image_url: 'https://img.youtube.com/vi/RbvEl_XAZU0/hqdefault.jpg',
    media_video_url: 'https://www.youtube.com/watch?v=RbvEl_XAZU0',
    open_externally_only: false,
    metadata_json: { nasm_opt_phase: 5, tempo: 'Explosive', category: 'Full Body & Power', source_channel: '@BOSUOfficial', trainer: 'Trainer Kaitlin', verified_official: true },
    is_active: true,
  },
]

async function runSeed() {
  console.log('Seeding BOSU Balance Trainer equipment...')
  const { error: equipErr } = await supabase
    .from('equipment_library_entries')
    .upsert([bosuEquipment], { onConflict: 'id' })

  if (equipErr) {
    console.error('Error upserting equipment:', equipErr.message)
  } else {
    console.log('Successfully upserted BOSU Balance Trainer equipment.')
  }

  console.log('Seeding 12 BOSU exercises...')
  const { error: exErr } = await supabase
    .from('exercise_library_entries')
    .upsert(bosuExercises, { onConflict: 'id' })

  if (exErr) {
    console.error('Error upserting exercises:', exErr.message)
  } else {
    console.log(`Successfully upserted ${bosuExercises.length} BOSU exercises into exercise_library_entries!`)
  }
}

runSeed()
