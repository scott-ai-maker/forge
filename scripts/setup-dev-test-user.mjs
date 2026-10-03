#!/usr/bin/env node
/**
 * scripts/setup-dev-test-user.mjs
 * 
 * Provisions or updates an elite Test Athlete user in Supabase with ALL features,
 * packages, clinical add-ons, onboarding, and telemetry enabled.
 * 
 * Usage:
 *   node --env-file=.env.local scripts/setup-dev-test-user.mjs
 */

import { createClient } from '@supabase/supabase-js'
import process from 'node:process'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TEST_ATHLETE_EMAIL = process.env.TEST_USER_EMAIL || 'test.athlete@gordonathleticadvisory.com'
const TEST_ATHLETE_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestAthlete2026!GAA'
const TEST_ATHLETE_NAME = 'Alexander Vance'

const COACH_EMAIL = process.env.TEST_COACH_EMAIL || 'scott.gordon72@outlook.com'
const COACH_PASSWORD = process.env.TEST_COACH_PASSWORD || 'CoachGordon2026!GAA'
const COACH_NAME = 'Coach Scott Gordon'

const CLINICAL_ADDONS = [
  {
    name: 'Metabolic Nutrition & Nutrient Periodization Suite',
    sessions: 0,
    note: 'VIP All-Access · Metabolic Nutrition & Macro Targets',
  },
  {
    name: 'Biomechanical Video Form Critique Pass',
    sessions: 0,
    note: 'VIP All-Access · AI & Coach Kinetic Video Critique',
  },
  {
    name: 'Clinical Supplement Stacking & Interaction Audit',
    sessions: 0,
    note: 'VIP All-Access · Evidence-Based Pharmacology & Dispensaries',
  },
  {
    name: 'Executive Road-Warrior Travel Pass',
    sessions: 0,
    note: 'VIP All-Access · Hotel & Bodyweight Dynamic Recalibration',
  },
  {
    name: '3D Kinetic Movement & Postural Diagnostic',
    sessions: 1,
    note: 'VIP All-Access · Computer Vision OHSA Diagnostic Screen',
  },
  {
    name: 'Clinical 3D AI Kinetic Chain & Postural Distortion Audit',
    sessions: 0,
    note: 'VIP All-Access · Full Body Segment Alignment Audit',
  },
]

async function findOrCreateUser(email, password, displayName, role) {
  const { data: users, error: listError } = await admin.auth.admin.listUsers({ perPage: 200 })
  if (listError) {
    throw new Error(`Failed to query auth users: ${listError.message}`)
  }

  const existing = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (existing) {
    console.log(`   Found existing user: ${email} (${existing.id})`)
    await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: {
        ...(existing.user_metadata || {}),
        full_name: displayName,
        display_name: displayName,
        surface_role: role,
        must_reset_password: false,
        vip_all_access: true,
        tier: 'Executive 1:1 Master',
      },
    })
    return existing.id
  }

  console.log(`   Creating user: ${email}...`)
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: displayName,
      display_name: displayName,
      surface_role: role,
      must_reset_password: false,
      vip_all_access: true,
      tier: 'Executive 1:1 Master',
    },
  })

  if (createError) {
    throw new Error(`Failed to create ${email}: ${createError.message}`)
  }

  return created.user.id
}

async function main() {
  console.log('\n=============================================================')
  console.log('🌟 PROVISIONING DEV TEST USER WITH ALL FEATURES ENABLED')
  console.log('=============================================================\n')

  const nowIso = new Date().toISOString()
  const todayDate = nowIso.split('T')[0]

  // 1. Resolve or Create Coach
  console.log(`1. Coach Account Provisioning (${COACH_EMAIL})`)
  const coachId = await findOrCreateUser(COACH_EMAIL, COACH_PASSWORD, COACH_NAME, 'coach')
  await admin.from('clients').upsert({
    id: coachId,
    email: COACH_EMAIL,
    name: COACH_NAME,
    role: 'coach',
    status: 'active',
    must_reset_password: false,
  }, { onConflict: 'id' })
  console.log(`   ✅ Coach profile verified: ${coachId}\n`)

  // 2. Resolve or Create Athlete User
  console.log(`2. Athlete Account Provisioning (${TEST_ATHLETE_EMAIL})`)
  const athleteId = await findOrCreateUser(TEST_ATHLETE_EMAIL, TEST_ATHLETE_PASSWORD, TEST_ATHLETE_NAME, 'client')
  console.log(`   ✅ Auth user verified: ${athleteId}\n`)

  // 3. Ensure Client Record & Coach Assignment
  console.log(`3. Synchronizing Client Standing & Role`)
  await admin.from('clients').upsert({
    id: athleteId,
    email: TEST_ATHLETE_EMAIL,
    name: TEST_ATHLETE_NAME,
    role: 'client',
    status: 'active',
    status_reason: 'VIP Dev Test Athlete (All Features Enabled)',
    status_updated_at: nowIso,
    status_updated_by: coachId,
    designated_coach_id: coachId,
    must_reset_password: false,
  }, { onConflict: 'id' })
  console.log(`   ✅ Client status set to ACTIVE with designated coach assigned\n`)

  // 4. Clinical Intake & PAR-Q+ Waivers
  console.log(`4. Clinical Intake, Consents & Liability Shield`)
  await admin.from('client_intake_forms').upsert({
    user_id: athleteId,
    parq_answers: {
      hasHeartCondition: false,
      chestPainPhysicalActivity: false,
      chestPainNoActivity: false,
      loseBalanceDizziness: false,
      boneOrJointProblem: false,
      bloodPressureMedication: false,
      otherReasonNotToExercise: false,
    },
    parq_any_yes: false,
    emergency_contact_name: 'Sarah Vance',
    emergency_contact_phone: '555-0199',
    consent_liability_waiver: true,
    consent_informed_consent: true,
    consent_privacy_practices: true,
    consent_coaching_agreement: true,
    consent_emergency_care: true,
    consent_signature_name: TEST_ATHLETE_NAME,
    consent_signed_at: nowIso,
  }, { onConflict: 'user_id' })
  console.log(`   ✅ PAR-Q cleared (low-risk) and all liability waivers signed\n`)

  // 5. Completed Fitness Profile
  console.log(`5. Baseline Fitness Profile & Onboarding`)
  await admin.from('fitness_profiles').upsert({
    user_id: athleteId,
    preferred_units: 'imperial',
    age: 32,
    sex: 'male',
    height_cm: 182.88, // 6'0"
    weight_kg: 83.91,  // 185 lbs
    activity_level: 'high',
    training_days_per_week: 4,
    fitness_goal: 'Athletic Hypertrophy & Stability',
    workout_location: 'gym',
    equipment_access: [
      'Bodyweight',
      'Band or Tube',
      'Dumbbells',
      'Foam Roller',
      'Stability Ball',
      'Barbell',
      'Cables',
      'Bench',
      'Kettlebells',
      'Pull-up Bar',
    ],
    cardio_equipment_access: ['treadmill', 'rower', 'airbike'],
    preferred_training_days: ['monday', 'tuesday', 'thursday', 'friday'],
    primary_telemetry_source: 'apple_health',
    onboarding_completed_at: nowIso,
  }, { onConflict: 'user_id' })
  console.log(`   ✅ Onboarding marked complete with full gym equipment & biometric baseline\n`)

  // 6. Active NASM OPT™ Workout Plan
  console.log(`6. Deploying NASM OPT™ Master Periodization Plan`)
  const masterPlan = {
    user_id: athleteId,
    name: 'Executive 1:1 Master — Phase 2 Strength Endurance & Power Contrast',
    goal: 'Athletic Hypertrophy & Stability',
    nasm_opt_phase: 2,
    phase_name: 'Phase 2: Strength Endurance',
    sessions_per_week: 4,
    estimated_duration_mins: 60,
    plan_json: {
      periodizationPlan: {
        phases: [
          { phaseNumber: 1, name: 'Stabilization Endurance', weekRange: 'Weeks 1–4', color: '#4dabf7', focus: 'Movement quality & joint integrity' },
          { phaseNumber: 2, name: 'Strength Endurance', weekRange: 'Weeks 5–8', color: '#C5A059', focus: 'Agonist-antagonist supersets & capacity' },
          { phaseNumber: 4, name: 'Maximal Strength', weekRange: 'Weeks 9–11', color: '#ff922b', focus: 'High-threshold motor unit recruitment' },
          { phaseNumber: 5, name: 'Power & Peak', weekRange: 'Week 12', color: '#34d399', focus: 'Rate of force development' },
        ],
        totalWeeks: 12,
        currentWeek: 5,
        coachNotes: 'Calibrated for executive performance, joint longevity, and metabolic recovery.',
      },
      workouts: [
        {
          day: 1,
          focus: 'Push / Pull Supercompensation Contrast',
          scheduledDate: todayDate,
          exercises: [
            {
              name: 'Barbell Bench Press',
              sets: 4,
              reps: '8-10',
              tempo: '2-0-2-0',
              restSeconds: 60,
              supersetPairWith: 'Standing Cable Row',
              coachingCues: ['Retract scapulae into bench', 'Drive heels into floor', 'Controlled 2s eccentric lowering'],
            },
            {
              name: 'Standing Cable Row',
              sets: 4,
              reps: '10-12',
              tempo: '2-0-2-0',
              restSeconds: 60,
              coachingCues: ['Neutral athletic stance', 'Drive elbows past torso', 'Squeeze mid-traps and rhomboids'],
            },
            {
              name: 'Barbell Back Squat',
              sets: 4,
              reps: '8-10',
              tempo: '2-0-2-0',
              restSeconds: 75,
              coachingCues: ['Chest proud', 'Knees tracking 2nd toe', 'Drive through midfoot'],
            },
            {
              name: 'Romanian Deadlift (RDL)',
              sets: 3,
              reps: '10-12',
              tempo: '3-1-1-0',
              restSeconds: 60,
              coachingCues: ['Hinge hips back toward wall', 'Keep bar glued to thighs', 'High hamstring tension'],
            },
          ],
          cardio: {
            title: 'Stage 2 Lactate Threshold Intervals',
            protocolType: 'stage_interval_conditioning',
            stage: 2,
            stageName: 'Stage 2: Lactate Threshold',
            targetZone: 'Zone 2-3',
            targetBpmRange: '145-165 BPM',
            durationMins: 15,
            workRestRatio: '1:2 (60s ON / 120s OFF)',
            recommendedModalities: ['Treadmill Incline Sprints', 'Assault AirBike', 'Rowing Ergometer'],
          },
        },
        {
          day: 2,
          focus: 'Posterior Chain & Unilateral Strength',
          exercises: [
            { name: 'Trap Bar Deadlift', sets: 4, reps: '6-8', tempo: '2-1-1-0', restSeconds: 90 },
            { name: 'Bulgarian Split Squat', sets: 3, reps: '10-12 / leg', tempo: '2-0-2-0', restSeconds: 60 },
            { name: 'Incline Dumbbell Press', sets: 4, reps: '8-10', tempo: '2-0-2-0', restSeconds: 60 },
            { name: 'Wide-Grip Lat Pulldown', sets: 4, reps: '10-12', tempo: '2-0-2-0', restSeconds: 60 },
          ],
        },
        {
          day: 3,
          focus: 'Tanaka Zone 2 Aerobic Engine & Recovery',
          exercises: [
            { name: 'Zone 2 Incline Ruck / Rower', sets: 1, reps: '35 mins', tempo: '65-75% HRmax' },
            { name: 'Paloff Press with Band', sets: 3, reps: '12 / side', tempo: '3-2-3-0' },
            { name: 'McGill Curl-Up Matrix', sets: 3, reps: '45s hold', tempo: 'Isometric' },
          ],
        },
        {
          day: 4,
          focus: 'Athletic Power & Dynamic Joint Integrity',
          exercises: [
            { name: 'Dumbbell Push Press', sets: 4, reps: '6-8', tempo: '1-0-X-0', restSeconds: 75 },
            { name: 'Medicine Ball Overhead Slam', sets: 4, reps: '10', tempo: 'Explosive' },
            { name: 'Goblet Squat with 1s Pause', sets: 3, reps: '12', tempo: '2-1-2-0' },
          ],
        },
      ],
    },
  }

  const { data: existingPlans } = await admin.from('workout_plans').select('id').eq('user_id', athleteId)
  if (!existingPlans || existingPlans.length === 0) {
    await admin.from('workout_plans').insert(masterPlan)
    console.log(`   ✅ Inserted 4-day Master Periodization plan with exercises & coaching cues\n`)
  } else {
    await admin.from('workout_plans').update(masterPlan).eq('id', existingPlans[0].id)
    console.log(`   ✅ Updated existing workout plan with latest NASM OPT programming\n`)
  }

  // 7. Assessments & Body Composition
  console.log(`7. Seeding Movement Assessments & 3D Body Composition`)
  try {
    const { data: existingAssessment } = await admin
      .from('nasm_assessments')
      .select('id')
      .eq('client_id', athleteId)
      .limit(1)

    if (!existingAssessment || existingAssessment.length === 0) {
      await admin.from('nasm_assessments').insert({
        client_id: athleteId,
        coach_id: coachId,
        title: 'Baseline 5-Checkpoint Kinetic Chain Screen',
        assessment_date: todayDate,
        overactive_muscles: ['Gastrocnemius', 'Soleus', 'Tensor Fasciae Latae', 'Upper Trapezius'],
        underactive_muscles: ['Gluteus Medius', 'Gluteus Maximus', 'Anterior Tibialis', 'Lower Trapezius'],
        coach_summary_notes: 'Good athletic symmetry. Mild anterior pelvic tilt during deep squat depth; target glute activation in warm-up.',
      })
    }
  } catch (err) {
    console.warn(`   ⚠️ Assessment seed notice: ${err.message}`)
  }

  try {
    const { data: existingBodyComp } = await admin
      .from('body_composition_analyses')
      .select('id')
      .eq('user_id', athleteId)
      .limit(1)

    if (!existingBodyComp || existingBodyComp.length === 0) {
      await admin.from('body_composition_analyses').insert({
        user_id: athleteId,
        estimated_bodyfat_percent: 13.8,
        method: '3D AI Computer Vision Scan',
        confidence_score: 0.98,
      })
    }
  } catch (err) {
    console.warn(`   ⚠️ Body comp seed notice: ${err.message}`)
  }
  console.log(`   ✅ Baseline OHSA screen and 3D bodyfat (13.8%) configured\n`)

  // 8. Grant Premier Packages & 500 Live Consult Sessions
  console.log(`8. Granting Premier Retainer & Clinical Add-On Suites`)
  let premierPkgId = null
  try {
    const { data: existingPkgs } = await admin
      .from('client_packages')
      .select('id, package_name, sessions_remaining')
      .eq('client_id', athleteId)
      .eq('package_name', 'Executive 1:1 Master')
      .limit(1)

    if (!existingPkgs || existingPkgs.length === 0) {
      const { data: premierPkg } = await admin.from('client_packages').insert({
        client_id: athleteId,
        package_name: 'Executive 1:1 Master',
        sessions_total: 12,
        sessions_remaining: 12,
        source: 'comp',
        granted_by_coach_id: coachId,
        grant_note: 'VIP Dev Test User · Indefinite All-Access Pass',
        discount_code: 'DEVALLACCESS',
        purchased_at: nowIso,
        expires_at: null,
      }).select('id, package_name, sessions_remaining').single()
      premierPkgId = premierPkg?.id
      console.log(`   ✅ Premier Retainer created: ${premierPkg?.package_name} (${premierPkg?.sessions_remaining} sessions, perpetual)`)
    } else {
      premierPkgId = existingPkgs[0].id
      await admin.from('client_packages').update({
        sessions_total: 12,
        sessions_remaining: 12,
        expires_at: null,
      }).eq('id', premierPkgId)
      console.log(`   ✅ Premier Retainer confirmed: ${existingPkgs[0].package_name} (12 sessions, perpetual)`)
    }
  } catch (err) {
    console.warn(`   ⚠️ Package grant notice: ${err.message}`)
  }

  for (const addon of CLINICAL_ADDONS) {
    try {
      const { data: existingAddon } = await admin
        .from('client_packages')
        .select('id')
        .eq('client_id', athleteId)
        .eq('package_name', addon.name)
        .limit(1)

      if (!existingAddon || existingAddon.length === 0) {
        await admin.from('client_packages').insert({
          client_id: athleteId,
          package_name: addon.name,
          sessions_total: addon.sessions,
          sessions_remaining: addon.sessions,
          source: 'comp',
          granted_by_coach_id: coachId,
          grant_note: addon.note,
          discount_code: 'DEVALLACCESS',
          purchased_at: nowIso,
          expires_at: null,
        })
      }
      console.log(`   ✅ Clinical Add-On: ${addon.name} (${addon.sessions} consults)`)
    } catch (err) {
      console.warn(`   ⚠️ Add-on notice: ${addon.name}: ${err.message}`)
    }
  }
  console.log('')

  // 9. Personal Records & Wearables Telemetry
  console.log(`9. Telemetry & Personal Records Baseline`)
  const prs = [
    { exercise_name: 'Barbell Bench Press', max_weight_kg: 102.06, max_weight_reps: 5, estimated_1rm_kg: 118.0 },
    { exercise_name: 'Trap Bar Deadlift', max_weight_kg: 165.56, max_weight_reps: 5, estimated_1rm_kg: 191.0 },
    { exercise_name: 'Barbell Back Squat', max_weight_kg: 133.81, max_weight_reps: 5, estimated_1rm_kg: 154.5 },
  ]
  for (const pr of prs) {
    try {
      await admin.from('client_personal_records').upsert({
        user_id: athleteId,
        exercise_name: pr.exercise_name,
        max_weight_kg: pr.max_weight_kg,
        max_weight_reps: pr.max_weight_reps,
        max_weight_date: todayDate,
        estimated_1rm_kg: pr.estimated_1rm_kg,
        first_logged_date: todayDate,
        latest_logged_date: todayDate,
      }, { onConflict: 'user_id,exercise_name' })
    } catch {
      // non-blocking
    }
  }

  try {
    await admin.from('athlete_wearable_metrics').upsert({
      client_id: athleteId,
      sample_date: todayDate,
      provider: 'apple_health',
      resting_heart_rate: 54,
      hrv_rmssd: 78.5,
      readiness_score: 92,
      sleep_hours: 8.1,
      active_calories_kcal: 680,
    }, { onConflict: 'client_id,sample_date,provider' })
  } catch {
    // non-blocking
  }
  console.log(`   ✅ Personal records (225 Bench, 365 Deadlift, 295 Squat) and daily telemetry (92% recovery, 78 HRV) loaded\n`)

  // 10. Coach-Athlete Direct Message & Scheduled Session
  console.log(`10. Messaging & Live Session Telehealth Setup`)
  try {
    const { data: existingMsg } = await admin
      .from('coach_client_messages')
      .select('id')
      .eq('client_id', athleteId)
      .limit(1)

    if (!existingMsg || existingMsg.length === 0) {
      await admin.from('coach_client_messages').insert({
        client_id: athleteId,
        coach_id: coachId,
        sender_id: coachId,
        message: 'Welcome to Gordon Athletic Advisory, Alexander! Your Phase 2 Strength Endurance protocol is live. Let me know once you complete your dynamic warmup.',
      })
    }
  } catch {
    // non-blocking
  }

  try {
    const { data: existingSession } = await admin
      .from('sessions')
      .select('id')
      .eq('client_id', athleteId)
      .eq('status', 'scheduled')
      .limit(1)

    if (!existingSession || existingSession.length === 0) {
      const sessionStart = new Date(Date.now() + 86400 * 1000).toISOString()
      await admin.from('sessions').insert({
        client_id: athleteId,
        package_id: premierPkgId || null,
        scheduled_at: sessionStart,
        duration_mins: 45,
        status: 'scheduled',
        notes: '1:1 Live Telehealth Coaching Session · Kinetic Chain Alignment Screen',
      })
    }
  } catch {
    // non-blocking
  }
  console.log(`   ✅ Welcome message in thread and scheduled 1:1 Live Session created\n`)

  console.log('=============================================================')
  console.log('🎉 DEV TEST USER SETUP COMPLETE!')
  console.log('=============================================================\n')
  console.log(`Athlete Login Credentials:`)
  console.log(`   • URL:      http://localhost:3000/auth/login`)
  console.log(`   • Email:    ${TEST_ATHLETE_EMAIL}`)
  console.log(`   • Password: ${TEST_ATHLETE_PASSWORD}`)
  console.log(`   • Role:     Client (Access to /dashboard, /dashboard/fitness, /dashboard/live, etc.)`)
  console.log(`\nCoach Login Credentials:`)
  console.log(`   • Email:    ${COACH_EMAIL}`)
  console.log(`   • Password: ${COACH_PASSWORD}`)
  console.log(`   • Role:     Coach (Access to /coach, client triage, program design, etc.)`)
  console.log(`\n1-Click Quick Demo Login:`)
  console.log(`   • Visit:    http://localhost:3000/api/auth/demo\n`)
}

main().catch(err => {
  console.error('❌ Setup error:', err)
  process.exit(1)
})

