-- Gordon Athletic Advisory: BOSU Balance Trainer Equipment & Exercise Suite Migration
-- Idempotent upsert of BOSU Balance Trainer equipment and 12 NASM OPT-aligned exercises

-- 1. Upsert Equipment: BOSU Balance Trainer
insert into equipment_library_entries (
  id,
  source,
  source_id,
  slug,
  name,
  description,
  media_image_url,
  metadata_json,
  is_active
)
values (
  'b0500000-0000-4000-8000-000000000001',
  'licensed_import',
  'bosu-balance-trainer',
  'bosu-balance-trainer',
  'BOSU Balance Trainer',
  'Proprioceptively enriched dynamic balance trainer with an inflatable rubber dome mounted on a rigid circular platform. Both Sides Utilized for balance, core stabilization, and neuromuscular conditioning.',
  'https://img.youtube.com/vi/evJOL2cdmt4/hqdefault.jpg',
  '{"category": "Balance & Stabilization", "brand": "BOSU", "modality": "unstable_surface", "source_channel": "@BOSUOfficial", "verified_official": true}'::jsonb,
  true
)
on conflict (id)
do update set
  name = excluded.name,
  description = excluded.description,
  media_image_url = excluded.media_image_url,
  metadata_json = excluded.metadata_json,
  updated_at = now();

-- 2. Upsert 12 NASM OPT BOSU Exercises
insert into exercise_library_entries (
  id,
  source,
  source_id,
  slug,
  name,
  description,
  coaching_cues,
  primary_equipment,
  muscle_groups,
  media_image_url,
  media_video_url,
  open_externally_only,
  metadata_json,
  is_active
)
values
(
  'b0500001-0000-4000-8000-000000000001',
  'licensed_import',
  'bosu-plank',
  'bosu-plank',
  'BOSU Plank',
  'Step 1: Setup Place the BOSU Balance Trainer dome-side up on a non-slip floor mat. Kneel in front of the dome and rest your forearms directly across the center crown of the dome, elbows bent 90 degrees directly beneath your shoulders.

Step 2: Brace/Position Step your feet back into a full plank position, feet hip-width apart. Engage your glutes, draw your navel toward your spine, and establish a neutral pelvic tilt.

Step 3: Execute Maintain a rigid isometric bridge line from occiput to heels. Press your forearms actively into the dome to prevent scapular winging, resisting the micro-oscillations of the air bladder.

Step 4: Return/Repeat Hold with steady diaphragmatic breathing for the prescribed duration (20-60 seconds) without allowing hips to sag or hike.',
  array['Forearms pressed firmly into center of dome', 'Maintain neutral cervical spine and level pelvis', 'Resist dome oscillation with deep transverse abdominis engagement'],
  array['BOSU Balance Trainer'],
  array['core', 'abdominals', 'shoulders'],
  'https://img.youtube.com/vi/C_NM5IbRlqM/hqdefault.jpg',
  'https://www.youtube.com/watch?v=C_NM5IbRlqM',
  false,
  '{"nasm_opt_phase": 1, "tempo": "Isometric", "category": "Core & Stabilization", "source_channel": "@BOSUOfficial", "trainer": "Katie Kasten", "verified_official": true}'::jsonb,
  true
),
(
  'b0500001-0000-4000-8000-000000000002',
  'licensed_import',
  'bosu-push-up',
  'bosu-push-up',
  'BOSU Push-Up',
  'Step 1: Setup Invert the BOSU Balance Trainer platform-side up (dome on floor). Grasp the outer perimeter handles or platform rim with both hands in a neutral grip, wrists straight.

Step 2: Brace/Position Step feet back into high push-up plank stance, balls of feet anchored, core fully braced, and glutes clamped.

Step 3: Execute Lower your chest toward the center of the platform under a controlled 4-second eccentric count, keeping elbows tucked at 45 degrees and maintaining platform stability.

Step 4: Return/Repeat Press through both palms explosively to full elbow lockout without allowing the platform to wobble, and repeat for prescribed repetitions.',
  array['Firm grip on platform perimeter handles', 'Elbows track at 45-degree angle to ribcage', 'Strict 4-second descent with level platform control'],
  array['BOSU Balance Trainer'],
  array['chest', 'triceps', 'shoulders', 'core'],
  'https://img.youtube.com/vi/Wo3viNH3E1c/hqdefault.jpg',
  'https://www.youtube.com/watch?v=Wo3viNH3E1c',
  false,
  '{"nasm_opt_phase": 1, "tempo": "4/2/1", "category": "Chest & Upper Body", "source_channel": "@BOSUOfficial", "trainer": "Mindy Mylrea", "verified_official": true}'::jsonb,
  true
),
(
  'b0500001-0000-4000-8000-000000000003',
  'licensed_import',
  'bosu-single-leg-balance-reach',
  'bosu-single-leg-balance-reach',
  'BOSU Single-Leg Balance Reach',
  'Step 1: Setup Place the BOSU dome-side up. Stand centered on the dome with your stance foot aligned over the bullseye logo, hands on hips.

Step 2: Brace/Position Lift the non-support leg so the thigh is parallel to the ground, knee bent 90 degrees. Establish single-leg tripod balance through the heel and forefoot.

Step 3: Execute Slowly reach the non-support leg forward in the sagittal plane, then return to center; reach laterally in the frontal plane, and then transversely behind while maintaining level hips.

Step 4: Return/Repeat Complete prescribed multiplanar reaches with a 4-second tempo before alternating to the opposite leg.',
  array['Center stance foot directly over dome apex', 'Keep pelvis and shoulders square throughout all reach planes', 'Drive intrinsic foot stabilizers and knee flexion control'],
  array['BOSU Balance Trainer'],
  array['glutes', 'calves', 'core', 'hamstrings'],
  'https://img.youtube.com/vi/I4kiGgKpb58/hqdefault.jpg',
  'https://www.youtube.com/watch?v=I4kiGgKpb58',
  false,
  '{"nasm_opt_phase": 1, "tempo": "4/2/1", "category": "Balance & Stabilization", "source_channel": "@BOSUOfficial", "trainer": "Candace Moore", "verified_official": true}'::jsonb,
  true
),
(
  'b0500001-0000-4000-8000-000000000004',
  'licensed_import',
  'bosu-glute-bridge',
  'bosu-glute-bridge',
  'BOSU Glute Bridge',
  'Step 1: Setup Lie supine on the floor with knees bent, arms resting by your sides, and heels positioned firmly on top of the dome apex of the BOSU Balance Trainer.

Step 2: Brace/Position Draw in your abdominal wall, brace your core, and set your pelvis in neutral alignment.

Step 3: Execute Drive through your heels into the dome to extend hips toward the ceiling until your body forms a straight line from knees through hips to shoulders.

Step 4: Return/Repeat Hold glute contraction at top for 2 seconds, then slowly lower hips under a 4-second eccentric descent without fully unloading at the bottom.',
  array['Drive force through heels into center of dome', 'Full hip extension with intense glute squeeze at top', 'Control eccentric lowering over 4 full seconds'],
  array['BOSU Balance Trainer'],
  array['glutes', 'hamstrings', 'core'],
  'https://img.youtube.com/vi/d28NVu5bQPk/hqdefault.jpg',
  'https://www.youtube.com/watch?v=d28NVu5bQPk',
  false,
  '{"nasm_opt_phase": 1, "tempo": "4/2/1", "category": "Glutes & Hamstrings", "source_channel": "@BOSUOfficial", "trainer": "BOSU Master Series", "verified_official": true}'::jsonb,
  true
),
(
  'b0500001-0000-4000-8000-000000000005',
  'licensed_import',
  'bosu-bird-dog',
  'bosu-bird-dog',
  'BOSU Bird-Dog',
  'Step 1: Setup Place the BOSU dome-side up. Position your knees on the center of the dome and your hands on the floor directly under your shoulders in a quadruped stance.

Step 2: Brace/Position Engage your transverse abdominis, lock your pelvis level, and draw your shoulder blades back and down.

Step 3: Execute Simultaneously raise your right arm straight forward and your left leg straight back until parallel to the floor, resisting rotational torque from the dome.

Step 4: Return/Repeat Pause for 2 seconds at full extension, return to the dome under control, and alternate contralateral sides for prescribed reps.',
  array['Maintain neutral spine without lumbar hyperextension', 'Thumb points up on forward arm, toe points down on rear leg', 'Resist pelvic tilting across the unstable dome'],
  array['BOSU Balance Trainer'],
  array['core', 'glutes', 'back', 'shoulders'],
  'https://img.youtube.com/vi/w75gGKGNsY0/hqdefault.jpg',
  'https://www.youtube.com/watch?v=w75gGKGNsY0',
  false,
  '{"nasm_opt_phase": 1, "tempo": "4/2/1", "category": "Core & Stabilization", "source_channel": "@BOSUOfficial", "trainer": "Trainer Kaitlin", "verified_official": true}'::jsonb,
  true
),
(
  'b0500001-0000-4000-8000-000000000006',
  'licensed_import',
  'bosu-dome-squat',
  'bosu-dome-squat',
  'BOSU Dome Squat',
  'Step 1: Setup Place the BOSU dome-side up. Step onto the dome with both feet hip-to-shoulder width apart, toes angled slightly outward, knees softly unlocked.

Step 2: Brace/Position Find your center of mass over the dome, brace your core, keep your chest high, and extend arms forward for counter-balance.

Step 3: Execute Hinge at the hips and bend knees to squat down to parallel under a strict 4-second eccentric tempo, keeping weight evenly distributed across both feet.

Step 4: Return/Repeat Drive through midfoot and heels to return to standing position, extending hips and squeezing glutes at top without hyperextending knees.',
  array['Chest stays tall with neutral cervical alignment', 'Knees track over second and third toes', 'Maintain constant 4/2/1 tempo throughout all repetitions'],
  array['BOSU Balance Trainer'],
  array['quadriceps', 'glutes', 'hamstrings', 'calves', 'core'],
  'https://img.youtube.com/vi/evJOL2cdmt4/hqdefault.jpg',
  'https://www.youtube.com/watch?v=evJOL2cdmt4',
  false,
  '{"nasm_opt_phase": 1, "tempo": "4/2/1", "category": "Lower Body & Quads", "source_channel": "@BOSUOfficial", "verified_official": true}'::jsonb,
  true
),
(
  'b0500001-0000-4000-8000-000000000007',
  'licensed_import',
  'bosu-dumbbell-chest-press',
  'bosu-dumbbell-chest-press',
  'BOSU Dumbbell Chest Press',
  'Step 1: Setup Sit on the forward slope of the BOSU dome holding a pair of dumbbells at your chest. Walk your feet out and roll back until your upper back, shoulders, and neck are supported by the dome.

Step 2: Brace/Position Press hips up into a rigid bridge, knees bent 90 degrees, glutes locked, and dumbbells held outside shoulders with forearms vertical.

Step 3: Execute Press dumbbells upward in an arc over your chest until elbows reach full extension without clanging weights together.

Step 4: Return/Repeat Lower dumbbells slowly under a 4-second count to chest level while maintaining full glute bridge stability, and repeat.',
  array['Keep hips elevated in rigid bridge throughout press', 'Control dumbbells with wrists stacked over elbows', 'Squeeze chest at apex of movement'],
  array['BOSU Balance Trainer', 'Dumbbells'],
  array['chest', 'triceps', 'shoulders', 'glutes', 'core'],
  'https://img.youtube.com/vi/cjTVlA2WwqY/hqdefault.jpg',
  'https://www.youtube.com/watch?v=cjTVlA2WwqY',
  false,
  '{"nasm_opt_phase": 2, "tempo": "4/2/1", "category": "Chest & Upper Body", "source_channel": "@BOSUOfficial", "trainer": "BOSU Master Series", "verified_official": true}'::jsonb,
  true
),
(
  'b0500001-0000-4000-8000-000000000008',
  'licensed_import',
  'bosu-lunge-to-balance',
  'bosu-lunge-to-balance',
  'BOSU Lunge to Balance',
  'Step 1: Setup Place BOSU dome-side up. Stand 2-3 feet behind the dome with feet hip-width apart and hands on hips or at chest.

Step 2: Brace/Position Step forward with your lead foot directly onto the center apex of the dome, sinking into a lunge until both knees reach 90-degree flexion.

Step 3: Execute Push forcefully through the lead heel and step straight back up into a single-leg balance on the trailing leg, holding opposite knee at 90 degrees.

Step 4: Return/Repeat Hold the single-leg balance for 2 seconds before stepping back into the next lunge repetition, completing all reps before switching legs.',
  array['Step accurately onto dome center bullseye', 'Decelerate smoothly into the lunge without knee collapse', 'Stabilize upright single-leg balance for 2 seconds between reps'],
  array['BOSU Balance Trainer'],
  array['quadriceps', 'glutes', 'hamstrings', 'calves', 'core'],
  'https://img.youtube.com/vi/BAC6B69Q70A/hqdefault.jpg',
  'https://www.youtube.com/watch?v=BAC6B69Q70A',
  false,
  '{"nasm_opt_phase": 2, "tempo": "2/0/2", "category": "Lower Body & Balance", "source_channel": "@BOSUOfficial", "trainer": "Trainer Kaitlin", "verified_official": true}'::jsonb,
  true
),
(
  'b0500001-0000-4000-8000-000000000009',
  'licensed_import',
  'bosu-mountain-climbers',
  'bosu-mountain-climbers',
  'BOSU Mountain Climbers',
  'Step 1: Setup Invert the BOSU platform-side up. Grip the handles on the edges of the platform and assume a high plank position.

Step 2: Brace/Position Align shoulders over wrists, draw in abdominal wall, and establish an unbroken spine line.

Step 3: Execute Drive one knee smoothly toward your chest while keeping hips low and the platform stable, then quickly switch legs in a rhythmic running cadence.

Step 4: Return/Repeat Continue alternating knees at a high, controlled tempo for the prescribed time interval (30-45 seconds).',
  array['Keep platform rock-steady without side-to-side tilting', 'Drive knees straight forward under chest without hiking hips', 'Maintain steady rhythmic breathing and braced core'],
  array['BOSU Balance Trainer'],
  array['core', 'hip flexors', 'shoulders', 'calves'],
  'https://img.youtube.com/vi/iyZHqgsI4Zk/hqdefault.jpg',
  'https://www.youtube.com/watch?v=iyZHqgsI4Zk',
  false,
  '{"nasm_opt_phase": 2, "tempo": "Fast/Controlled", "category": "Core & Conditioning", "source_channel": "@BOSUOfficial", "verified_official": true}'::jsonb,
  true
),
(
  'b0500001-0000-4000-8000-000000000010',
  'licensed_import',
  'bosu-russian-twist',
  'bosu-russian-twist',
  'BOSU Russian Twist',
  'Step 1: Setup Sit on top of the BOSU dome with knees bent and feet flat on the floor in front of you. Lean back slightly until your core engages, holding a V-sit posture.

Step 2: Brace/Position Lift feet 2-4 inches off the floor to balance solely on the dome. Clasp hands together in front of your chest with elbows slightly bent.

Step 3: Execute Rotate your torso to the right, tapping hands near the dome rim, then rotate across to the left under strict rotary control.

Step 4: Return/Repeat Continue alternating rotations smoothly for prescribed repetitions while maintaining V-sit balance on the dome.',
  array['Rotate from thoracic spine and obliques, not just arms', 'Keep chest proud and avoid rounding the lumbar spine', 'Maintain steady V-sit balance without feet touching ground'],
  array['BOSU Balance Trainer'],
  array['obliques', 'abdominals', 'hip flexors'],
  'https://img.youtube.com/vi/M2AAcj_K0mg/hqdefault.jpg',
  'https://www.youtube.com/watch?v=M2AAcj_K0mg',
  false,
  '{"nasm_opt_phase": 1, "tempo": "4/2/1", "category": "Core & Abdominals", "source_channel": "@BOSUOfficial", "verified_official": true}'::jsonb,
  true
),
(
  'b0500001-0000-4000-8000-000000000011',
  'licensed_import',
  'bosu-lateral-bound-with-stabilization',
  'bosu-lateral-bound-with-stabilization',
  'BOSU Lateral Bound with Stabilization',
  'Step 1: Setup Place the BOSU dome-side up. Stand to the left side of the dome, balanced on your right leg with knee and hip slightly flexed.

Step 2: Brace/Position Load your right glute and push off forcefully laterally, leaping over and landing on the center apex of the dome with your left foot.

Step 3: Execute Absorb the landing with knee flexed, chest up, and freeze in a single-leg balance for 3 full seconds, establishing complete stability.

Step 4: Return/Repeat Push off the left foot to bound back to the right landing softly, and repeat for prescribed power repetitions.',
  array['Explode laterally with triple extension of ankle, knee, and hip', 'Land softly on dome apex and freeze for 3 full seconds', 'Resist ankle eversion/inversion using intrinsic foot musculature'],
  array['BOSU Balance Trainer'],
  array['quadriceps', 'glutes', 'calves', 'core'],
  'https://img.youtube.com/vi/vEGpyuTh3zw/hqdefault.jpg',
  'https://www.youtube.com/watch?v=vEGpyuTh3zw',
  false,
  '{"nasm_opt_phase": 5, "tempo": "Explosive with 3s hold", "category": "Plyometrics & Power", "source_channel": "@BOSUOfficial", "trainer": "BOSU Master Series", "verified_official": true}'::jsonb,
  true
),
(
  'b0500001-0000-4000-8000-000000000012',
  'licensed_import',
  'bosu-burpee-with-overhead-press',
  'bosu-burpee-with-overhead-press',
  'BOSU Burpee with Overhead Press',
  'Step 1: Setup Place BOSU platform-side up on floor. Stand behind the platform with feet shoulder-width apart.

Step 2: Brace/Position Squat down and grip the side handles of the platform firmly. Jump feet back into a push-up plank, perform a push-up, and jump feet back in toward hands.

Step 3: Execute Powerfully stand up out of the squat while lifting the BOSU off the floor, pressing it overhead to full arm lockout.

Step 4: Return/Repeat Lower the BOSU back to the floor with control and immediately initiate the next burpee repetition.',
  array['Firm grip on platform handles throughout transition', 'Drive through heels to lift and press BOSU overhead', 'Maintain neutral lumbar spine during the hinge and floor transitions'],
  array['BOSU Balance Trainer'],
  array['chest', 'shoulders', 'quadriceps', 'glutes', 'core', 'triceps'],
  'https://img.youtube.com/vi/RbvEl_XAZU0/hqdefault.jpg',
  'https://www.youtube.com/watch?v=RbvEl_XAZU0',
  false,
  '{"nasm_opt_phase": 5, "tempo": "Explosive", "category": "Full Body & Power", "source_channel": "@BOSUOfficial", "trainer": "Trainer Kaitlin", "verified_official": true}'::jsonb,
  true
)
on conflict (id)
do update set
  name = excluded.name,
  description = excluded.description,
  coaching_cues = excluded.coaching_cues,
  primary_equipment = excluded.primary_equipment,
  muscle_groups = excluded.muscle_groups,
  media_image_url = excluded.media_image_url,
  media_video_url = excluded.media_video_url,
  open_externally_only = excluded.open_externally_only,
  metadata_json = excluded.metadata_json,
  updated_at = now();
