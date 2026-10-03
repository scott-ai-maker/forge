-- Migration: 20260923_stability_ball_library_entries.sql
-- Description: Adds TheraBand Pro Series SCP Stability Ball equipment specification and 12 clinical NASM OPT movement library entries.

-- 1. Upsert TheraBand Stability Ball into equipment_library_entries
INSERT INTO equipment_library_entries (
  id,
  source,
  source_id,
  slug,
  name,
  description,
  media_image_url,
  metadata_json,
  is_active
) VALUES (
  'b0500000-0000-4000-8000-000000000002',
  'licensed_import',
  'theraband-stability-ball',
  'theraband-stability-ball',
  'TheraBand Stability Ball',
  'TheraBand Pro Series SCP (Slow Deflate Technology) Exercise Ball. Engineered for clinical rehabilitation, core stabilization, and neuromuscular control across calibrated diameter progressions.',
  'https://img.youtube.com/vi/FfTyQAYrnqM/hqdefault.jpg',
  '{"category": "Balance & Stabilization", "brand": "TheraBand", "manufacturer": "Performance Health", "modality": "slow_deflate_ball", "verified_official": true}'::jsonb,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  media_image_url = EXCLUDED.media_image_url,
  metadata_json = EXCLUDED.metadata_json,
  is_active = true;

-- 2. Upsert 12 Clinical NASM OPT Stability Ball Exercises
INSERT INTO exercise_library_entries (
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
  metadata_json,
  is_active
) VALUES
(
  'b0500002-0000-4000-8000-000000000001',
  'licensed_import',
  'stability-ball-hamstring-curl',
  'stability-ball-hamstring-curl',
  'Stability Ball Hamstring Curl',
  'Step 1: Setup Lie supine on floor with heels and lower calves centered on the TheraBand Stability Ball, arms extended at your sides for lateral stability.

Step 2: Brace/Position Drive hips upward into full bridge alignment, forming a straight line from shoulders to heels.

Step 3: Execute Curl heels smoothly toward glutes by flexing knees while maintaining elevated hip extension. Avoid sagging hips toward the floor.

Step 4: Return/Repeat Slowly extend legs back out over 4 controlled seconds to starting bridge position and repeat.',
  ARRAY['Drive hips upward into full bridge with heels dug firmly into ball center', 'Curl heels smoothly toward glutes without allowing hips to sag toward floor', 'Maintain rigid pelvic alignment and slow 4-second eccentric rollout'],
  ARRAY['Stability Ball'],
  ARRAY['hamstrings', 'gluteus maximus', 'calves', 'core'],
  'https://img.youtube.com/vi/Z3cY3d3BBo4/hqdefault.jpg',
  'https://www.youtube.com/watch?v=Z3cY3d3BBo4',
  '{"nasm_opt_phase": 1, "tempo": "4/2/1", "category": "lower", "sizing": "55-65 cm", "source_author": "NASM Edge Master Series"}'::jsonb,
  true
),
(
  'b0500002-0000-4000-8000-000000000002',
  'licensed_import',
  'stability-ball-push-up',
  'stability-ball-push-up',
  'Stability Ball Push-Up',
  'Step 1: Setup Place hands shoulder-width apart on the apex of the TheraBand Stability Ball, fingers spread wide and wrists in neutral alignment.

Step 2: Brace/Position Extend feet behind you into a push-up plank, feet hip-width apart. Engage core and glutes to lock spine in neutral.

Step 3: Execute Lower chest toward ball over 4 controlled seconds, keeping elbows tracking at a 45-degree angle to ribcage.

Step 4: Return/Repeat Press aggressively through palms to full arm extension without allowing the ball to roll or wobble.',
  ARRAY['Place palms shoulder-width apart on ball apex, fingers spread wide', 'Lower chest toward ball over 4 controlled seconds, keeping elbows tucked 45°', 'Push aggressively through palms without letting the ball roll or wobble'],
  ARRAY['Stability Ball'],
  ARRAY['pectorals', 'triceps', 'rotator cuff', 'anterior core'],
  'https://img.youtube.com/vi/pxpGo3EtwkM/hqdefault.jpg',
  'https://www.youtube.com/watch?v=pxpGo3EtwkM',
  '{"nasm_opt_phase": 1, "tempo": "4/2/1", "category": "upper", "sizing": "55-65 cm", "source_author": "Sofia Gotzi, PT (TheraBand Protocol)"}'::jsonb,
  true
),
(
  'b0500002-0000-4000-8000-000000000003',
  'licensed_import',
  'stability-ball-wall-squat',
  'stability-ball-wall-squat',
  'Stability Ball Wall Squat',
  'Step 1: Setup Place the TheraBand Stability Ball against a smooth wall, positioned snug against the lumbar curve of your lower back.

Step 2: Brace/Position Walk feet forward 12-18 inches, shoulder-width apart with toes pointing straight ahead.

Step 3: Execute Squat down smoothly by flexing hips and knees until thighs are parallel to floor, allowing ball to roll up spine.

Step 4: Return/Repeat Drive upward through midfoot and heels back to standing, maintaining constant pressure against the ball.',
  ARRAY['Position ball snug against small of lower back and smooth wall surface', 'Walk feet 12-18 inches forward, hip-width apart, toes pointing straight', 'Descend smoothly to 90° knee flexion while maintaining constant back-to-ball pressure'],
  ARRAY['Stability Ball'],
  ARRAY['quadriceps', 'gluteus medius', 'vastus medialis', 'lumbar erectors'],
  'https://img.youtube.com/vi/2TOqw5wSfgE/hqdefault.jpg',
  'https://www.youtube.com/watch?v=2TOqw5wSfgE',
  '{"nasm_opt_phase": 1, "tempo": "4/2/1", "category": "lower", "sizing": "65-75 cm", "source_author": "Chad Blair (TheraBand Protocol)"}'::jsonb,
  true
),
(
  'b0500002-0000-4000-8000-000000000004',
  'licensed_import',
  'stability-ball-crunch',
  'stability-ball-crunch',
  'Stability Ball Crunch',
  'Step 1: Setup Sit on the TheraBand Stability Ball and roll forward until ball supports your lumbar spine and middle back, feet flat on floor.

Step 2: Brace/Position Support head lightly with fingertips or cross arms over chest. Allow spine to gently drape back over curvature.

Step 3: Execute Contract abdominals to flex thoracic spine upward over ball, curling ribcage toward pelvis with 2-second peak isometric hold.

Step 4: Return/Repeat Lower under control back over curvature to full abdominal stretch and repeat.',
  ARRAY['Lie supine with ball positioned under lumbar curve and thoracic spine draped back', 'Support head lightly with fingertips; avoid pulling on cervical spine', 'Exhale and flex spine upward over ball, holding 2-second peak isometric crunch'],
  ARRAY['Stability Ball'],
  ARRAY['rectus abdominis', 'transverse abdominis', 'internal obliques'],
  'https://img.youtube.com/vi/QFLftqPWjoI/hqdefault.jpg',
  'https://www.youtube.com/watch?v=QFLftqPWjoI',
  '{"nasm_opt_phase": 1, "tempo": "4/2/1", "category": "core", "sizing": "55-65 cm", "source_author": "NASM Edge Master Series"}'::jsonb,
  true
),
(
  'b0500002-0000-4000-8000-000000000005',
  'licensed_import',
  'stability-ball-dumbbell-chest-press',
  'stability-ball-dumbbell-chest-press',
  'Stability Ball Dumbbell Chest Press',
  'Step 1: Setup Hold dumbbells at shoulders and sit on ball. Roll forward into a supine bridge with head, neck, and upper back firmly supported.

Step 2: Brace/Position Contract glutes and core so torso and thighs form a rigid table-top parallel to floor.

Step 3: Execute Press dumbbells upward in a slight arc directly over mid-chest, stopping just short of full elbow lockout.

Step 4: Return/Repeat Lower dumbbells smoothly over 2 seconds until elbows reach 90 degrees, maintaining rigid level hips throughout.',
  ARRAY['Rest head, neck, and upper back firmly on ball with torso parallel to floor in bridge', 'Squeeze glutes to lock hips horizontal throughout entire bilateral dumbbell press', 'Press dumbbells in smooth arc directly over chest without flaring elbows past 90°'],
  ARRAY['Stability Ball', 'Dumbbells'],
  ARRAY['pectoralis major', 'anterior deltoids', 'triceps', 'gluteus maximus'],
  'https://img.youtube.com/vi/FfTyQAYrnqM/hqdefault.jpg',
  'https://www.youtube.com/watch?v=FfTyQAYrnqM',
  '{"nasm_opt_phase": 2, "tempo": "2/0/2", "category": "upper", "sizing": "55-65 cm", "source_author": "Performance Health Master Series"}'::jsonb,
  true
),
(
  'b0500002-0000-4000-8000-000000000006',
  'licensed_import',
  'stability-ball-prone-cobra',
  'stability-ball-prone-cobra',
  'Stability Ball Prone Cobra (W-Y Raise)',
  'Step 1: Setup Lie prone over the TheraBand Stability Ball with chest and abdomen supported, feet anchored wide against floor for balance.

Step 2: Brace/Position Keep neck neutral with chin tucked. Arms hang loosely toward floor.

Step 3: Execute Retract and depress shoulder blades, lifting chest slightly off ball and driving arms upward in a W-to-Y trajectory thumbs up.

Step 4: Return/Repeat Hold 2 seconds at peak contraction, then lower slowly back to start.',
  ARRAY['Lie prone with chest and pelvis anchored on ball, feet anchored wide against floor', 'Retract and depress shoulder blades, driving thumbs toward ceiling in W to Y transition', 'Keep chin tucked in neutral cervical alignment; avoid hyperextending neck'],
  ARRAY['Stability Ball'],
  ARRAY['lower trapezius', 'rhomboids', 'infraspinatus', 'erector spinae'],
  'https://img.youtube.com/vi/j6D0V742sT8/hqdefault.jpg',
  'https://www.youtube.com/watch?v=j6D0V742sT8',
  '{"nasm_opt_phase": 1, "tempo": "4/2/1", "category": "core", "sizing": "55-65 cm", "source_author": "Performance Health Master Series"}'::jsonb,
  true
),
(
  'b0500002-0000-4000-8000-000000000007',
  'licensed_import',
  'stability-ball-roll-in',
  'stability-ball-roll-in',
  'Stability Ball Roll-In / Pike',
  'Step 1: Setup Start in a rigid push-up plank with shins resting on the apex of the TheraBand Stability Ball and hands on floor.

Step 2: Brace/Position Brace abdominal wall and stabilize shoulders directly over wrists.

Step 3: Execute Pull knees inward toward chest (or pike hips upward) by contracting abdominals, rolling ball forward onto tops of toes.

Step 4: Return/Repeat Slowly roll ball back out to starting plank line without sagging hips.',
  ARRAY['Start in rigid push-up plank with shins resting centered on ball apex', 'Contract core and pull knees toward chest (or pike hips straight up over shoulders)', 'Control return smoothly without hyperextending lumbar spine at bottom'],
  ARRAY['Stability Ball'],
  ARRAY['rectus abdominis', 'iliopsoas', 'serratus anterior', 'shoulders'],
  'https://img.youtube.com/vi/ZquTk8GmA_I/hqdefault.jpg',
  'https://www.youtube.com/watch?v=ZquTk8GmA_I',
  '{"nasm_opt_phase": 2, "tempo": "2/0/2", "category": "core", "sizing": "55-65 cm", "source_author": "NASM Edge Master Series"}'::jsonb,
  true
),
(
  'b0500002-0000-4000-8000-000000000008',
  'licensed_import',
  'stability-ball-back-extension',
  'stability-ball-back-extension',
  'Stability Ball Back Extension with Rotation',
  'Step 1: Setup Position anterior pelvis and thighs over ball, feet anchored firmly against base of wall or floor.

Step 2: Brace/Position Cross arms over chest or place fingertips by ears, draping upper torso forward over ball.

Step 3: Execute Extend spine to neutral alignment, then smoothly rotate torso 15-20 degrees to one side by contracting obliques.

Step 4: Return/Repeat Rotate back to center, lower torso over ball curve, and alternate rotation on subsequent repetitions.',
  ARRAY['Anchor anterior pelvis and thighs on ball with feet braced against wall or floor', 'Cross arms over chest or fingertips at ears; lower torso over ball curve', 'Extend spine to neutral alignment, then rotate torso 15-20° under strict control'],
  ARRAY['Stability Ball'],
  ARRAY['erector spinae', 'internal obliques', 'external obliques', 'multifidus'],
  'https://img.youtube.com/vi/b_Iri5nayDk/hqdefault.jpg',
  'https://www.youtube.com/watch?v=b_Iri5nayDk',
  '{"nasm_opt_phase": 1, "tempo": "4/2/1", "category": "core", "sizing": "55-65 cm", "source_author": "NASM Edge Master Series"}'::jsonb,
  true
),
(
  'b0500002-0000-4000-8000-000000000009',
  'licensed_import',
  'stability-ball-loaded-bridge',
  'stability-ball-loaded-bridge',
  'Stability Ball Loaded Bridge',
  'Step 1: Setup Support upper back and shoulders on the TheraBand Stability Ball, knees bent at 90 degrees with feet flat on floor.

Step 2: Brace/Position Optionally place a dumbbell or plate across hips, holding it securely with both hands.

Step 3: Execute Lower hips toward floor, then drive through heels to full hip extension, squeezing glutes hard for 2 seconds at top.

Step 4: Return/Repeat Lower hips under control over 4 seconds and repeat without bouncing.',
  ARRAY['Upper back and scapulae resting on ball, knees bent at 90°, feet flat on floor', 'Lower hips toward floor, then drive through heels to full hip extension', 'Maintain level pelvis without swaying; squeeze glutes intensely at top'],
  ARRAY['Stability Ball'],
  ARRAY['gluteus maximus', 'biceps femoris', 'transverse abdominis'],
  'https://img.youtube.com/vi/wgcyPpK60wc/hqdefault.jpg',
  'https://www.youtube.com/watch?v=wgcyPpK60wc',
  '{"nasm_opt_phase": 1, "tempo": "4/2/1", "category": "lower", "sizing": "55-65 cm", "source_author": "NASM Edge Master Series"}'::jsonb,
  true
),
(
  'b0500002-0000-4000-8000-000000000010',
  'licensed_import',
  'stability-ball-russian-twist',
  'stability-ball-russian-twist',
  'Stability Ball Russian Twist',
  'Step 1: Setup Lie supine with head and shoulders centered on ball in a rigid bridge, knees at 90 degrees and feet flat.

Step 2: Brace/Position Clasp hands together straight above chest with arms extended.

Step 3: Execute Rotate torso smoothly onto one shoulder while keeping hips elevated and level to the floor.

Step 4: Return/Repeat Pause at 45-degree shoulder roll, rotate back across center to opposite shoulder, and repeat.',
  ARRAY['Lie supine in bridge position with head and shoulders supported on ball', 'Clasp hands straight up over chest; rotate torso onto one shoulder', 'Keep hips elevated and level with floor throughout rotation; resist hip drop'],
  ARRAY['Stability Ball'],
  ARRAY['internal obliques', 'external obliques', 'transverse abdominis', 'glutes'],
  'https://img.youtube.com/vi/t3HhJ_LolVg/hqdefault.jpg',
  'https://www.youtube.com/watch?v=t3HhJ_LolVg',
  '{"nasm_opt_phase": 1, "tempo": "4/2/1", "category": "core", "sizing": "55-65 cm", "source_author": "Performance Health Academy Network"}'::jsonb,
  true
),
(
  'b0500002-0000-4000-8000-000000000011',
  'licensed_import',
  'stability-ball-scapular-triad',
  'stability-ball-scapular-triad',
  'Stability Ball Scapular Triad (Ball Combo I)',
  'Step 1: Setup Lie prone with chest supported on the TheraBand Stability Ball, light dumbbells in hand, neck neutral.

Step 2: Brace/Position Brace core and anchor toes to floor.

Step 3: Execute Raise arms in Y-scaption (45 degrees), then T-abduction (90 degrees), then W-retraction, squeezing rhomboids and lower traps.

Step 4: Return/Repeat Lower smoothly between each phase, ensuring upper trapezius remains relaxed.',
  ARRAY['Chest supported on ball, light dumbbells in hands, neutral head position', 'Perform controlled Y-raise, T-raise, and W-scapular squeeze sequence', 'Focus on scapular depression and retraction; avoid shrugging upper traps'],
  ARRAY['Stability Ball', 'Dumbbells'],
  ARRAY['middle trapezius', 'lower trapezius', 'posterior deltoids'],
  'https://img.youtube.com/vi/xb3-dysLHpE/hqdefault.jpg',
  'https://www.youtube.com/watch?v=xb3-dysLHpE',
  '{"nasm_opt_phase": 1, "tempo": "4/2/1", "category": "upper", "sizing": "55-65 cm", "source_author": "NASM Edge Master Series"}'::jsonb,
  true
),
(
  'b0500002-0000-4000-8000-000000000012',
  'licensed_import',
  'stability-ball-prone-shoulder-press',
  'stability-ball-prone-shoulder-press',
  'Stability Ball Prone Shoulder Press',
  'Step 1: Setup Lie prone on the TheraBand Stability Ball, balls of feet anchored on floor, holding light dumbbells at shoulder level.

Step 2: Brace/Position Establish unbroken line from heels through head, activating glutes and erectors.

Step 3: Execute Press dumbbells forward and overhead in line with torso plane, fully extending arms without arching lower back.

Step 4: Return/Repeat Pull dumbbells smoothly back to shoulder level over 2 seconds and repeat.',
  ARRAY['Prone on ball with toes anchored to ground, holding light dumbbells at shoulders', 'Maintain rigid posterior chain line from heels through crown of head', 'Press weights overhead in scapular plane without arching lumbar spine'],
  ARRAY['Stability Ball', 'Dumbbells'],
  ARRAY['deltoids', 'triceps', 'erector spinae', 'glutes'],
  'https://img.youtube.com/vi/VZJ0PHuNrYI/hqdefault.jpg',
  'https://www.youtube.com/watch?v=VZJ0PHuNrYI',
  '{"nasm_opt_phase": 2, "tempo": "2/0/2", "category": "upper", "sizing": "55-65 cm", "source_author": "NASM Edge Master Series"}'::jsonb,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  coaching_cues = EXCLUDED.coaching_cues,
  primary_equipment = EXCLUDED.primary_equipment,
  muscle_groups = EXCLUDED.muscle_groups,
  media_image_url = EXCLUDED.media_image_url,
  media_video_url = EXCLUDED.media_video_url,
  metadata_json = EXCLUDED.metadata_json,
  is_active = true;
