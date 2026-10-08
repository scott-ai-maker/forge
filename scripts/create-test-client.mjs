#!/usr/bin/env node
/**
 * scripts/create-test-client.mjs
 *
 * Provisions a new test athlete / client in Supabase.
 * Supports configurable credentials, assigned/unassigned coach status,
 * and either full VIP provisioning (intake, fitness, workouts, packages)
 * or fresh/blank state for onboarding flow testing.
 *
 * Usage:
 *   node --env-file=.env.local scripts/create-test-client.mjs [options]
 *   npm run client:new -- [options]
 *
 * Options:
 *   --email <email>          Custom email (default: auto-generated timestamped email)
 *   --name <name>            Full name (default: "Jordan Lee (Test)")
 *   --password <password>    Password (default: "TestAthlete2026!GAA")
 *   --blank                  Create a blank client without intake/workouts (test signup & onboarding)
 *   --unassigned             Do not assign a coach (leaves client in triage queue)
 *   --coach <email>          Specific coach email to assign (default: scott.gordon72@outlook.com)
 *   --status <status>        Status: active | pending | paused | archived (default: active)
 *   --tier <tier>            Membership tier (default: "Executive 1:1 Master")
 *   --help                   Display help
 */

import { createClient } from '@supabase/supabase-js'
import process from 'node:process'

function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    email: null,
    name: 'Jordan Lee (Test)',
    password: process.env.DEFAULT_TEST_CLIENT_PASSWORD || 'TestAthlete2026!GAA',
    blank: false,
    unassigned: false,
    coachEmail: process.env.TEST_COACH_EMAIL || 'scott.gordon72@outlook.com',
    status: 'active',
    tier: 'Executive 1:1 Master',
    help: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--help' || arg === '-h') {
      options.help = true
    } else if (arg === '--email' && args[i + 1]) {
      options.email = args[++i].trim()
    } else if (arg === '--name' && args[i + 1]) {
      options.name = args[++i].trim()
    } else if (arg === '--password' && args[i + 1]) {
      options.password = args[++i].trim()
    } else if (arg === '--coach' && args[i + 1]) {
      options.coachEmail = args[++i].trim()
    } else if (arg === '--status' && args[i + 1]) {
      options.status = args[++i].trim()
    } else if (arg === '--tier' && args[i + 1]) {
      options.tier = args[++i].trim()
    } else if (arg === '--blank') {
      options.blank = true
    } else if (arg === '--unassigned') {
      options.unassigned = true
    }
  }

  if (!options.email) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const timestamp = Date.now().toString().slice(-4)
    options.email = `test.client.${timestamp}${randomSuffix}@gordonathleticadvisory.com`
  }

  return options
}

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

async function main() {
  const options = parseArgs()

  if (options.help) {
    console.log(`
Forge Athletic — Test Client Provisioning Tool

Usage:
  node --env-file=.env.local scripts/create-test-client.mjs [options]
  npm run client:new -- [options]

Options:
  --email <email>          Custom email address (default: auto-generated)
  --name <name>            Client display name (default: "Jordan Lee (Test)")
  --password <password>    Password (default: "TestAthlete2026!GAA")
  --blank                  Create minimal empty client (for testing onboarding/signup)
  --unassigned             Do not assign a coach (leaves client in triage queue)
  --coach <email>          Designated coach email (default: scott.gordon72@outlook.com)
  --status <status>        Client status: active | pending | paused | archived (default: active)
  --tier <tier>            Membership tier (default: "Executive 1:1 Master")
  --help                   Show this help message
`)
    process.exit(0)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('\n=============================================================')
  console.log('⚡ CREATING NEW TEST CLIENT')
  console.log('=============================================================')
  console.log(`Email:       ${options.email}`)
  console.log(`Name:        ${options.name}`)
  console.log(`Password:    ${options.password}`)
  console.log(`Mode:        ${options.blank ? 'Blank (Un-onboarded for signup flow)' : 'Full VIP (Intake, Workouts, Packages)'}`)
  console.log(`Assignment:  ${options.unassigned ? 'Unassigned (Triage queue)' : `Assigned to ${options.coachEmail}`}`)
  console.log('=============================================================\n')

  const nowIso = new Date().toISOString()
  const todayDate = nowIso.split('T')[0]

  // 1. Resolve Coach if assigned
  let coachId = null
  if (!options.unassigned && options.coachEmail) {
    console.log(`1. Resolving designated coach (${options.coachEmail})...`)
    const { data: users, error: coachListError } = await admin.auth.admin.listUsers({ perPage: 200 })
    if (!coachListError && users?.users) {
      const found = users.users.find(u => u.email?.toLowerCase() === options.coachEmail.toLowerCase())
      if (found) {
        coachId = found.id
        console.log(`   ✓ Found coach ID: ${coachId}`)
      } else {
        console.warn(`   ⚠️ Coach ${options.coachEmail} not found in auth.users. Client will be unassigned.`)
      }
    }
  }

  // 2. Create Auth User
  console.log(`\n2. Creating Supabase Auth User (${options.email})...`)
  const { data: authCreated, error: createError } = await admin.auth.admin.createUser({
    email: options.email,
    password: options.password,
    email_confirm: true,
    user_metadata: {
      full_name: options.name,
      display_name: options.name,
      surface_role: 'client',
      must_reset_password: false,
      vip_all_access: !options.blank,
      tier: options.tier,
    },
  })

  if (createError) {
    console.error(`❌ Failed to create auth user: ${createError.message}`)
    process.exit(1)
  }

  const clientId = authCreated.user.id
  console.log(`   ✓ Auth user created successfully: ${clientId}`)

  // 3. Upsert Clients Table Record
  console.log(`\n3. Provisioning Client Record...`)
  const { error: clientError } = await admin.from('clients').upsert({
    id: clientId,
    email: options.email,
    full_name: options.name,
    role: 'client',
    status: options.status,
    status_reason: options.blank ? 'New Blank Test Client' : 'VIP All-Access Test Athlete',
    status_updated_at: nowIso,
    status_updated_by: coachId,
    designated_coach_id: coachId,
    must_reset_password: false,
  }, { onConflict: 'id' })

  if (clientError) {
    console.error(`❌ Failed to insert client record: ${clientError.message}`)
    // Cleanup auth user
    await admin.auth.admin.deleteUser(clientId)
    process.exit(1)
  }
  console.log(`   ✓ Clients record synchronized (status: ${options.status}, coach: ${coachId || 'unassigned'})`)

  // If blank mode requested, stop here
  if (options.blank) {
    console.log('\n=============================================================')
    console.log('🎉 BLANK TEST CLIENT CREATED SUCCESSFULLY!')
    console.log('=============================================================')
    printCredentials(options, clientId)
    return
  }

  // 4. Clinical Intake & PAR-Q+ Waivers
  console.log(`\n4. Populating Clinical Intake & Liability Shield...`)
  await admin.from('client_intake_forms').upsert({
    user_id: clientId,
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
    emergency_contact_name: 'Emergency Contact',
    emergency_contact_phone: '555-0199',
    consent_liability_waiver: true,
    consent_informed_consent: true,
    consent_privacy_practices: true,
    consent_coaching_agreement: true,
    consent_emergency_care: true,
    consent_signature_name: options.name,
    consent_signed_at: nowIso,
  }, { onConflict: 'user_id' })
  console.log(`   ✓ Low-risk PAR-Q+ and signed liability waivers provisioned`)

  // 5. Baseline Fitness Profile & Onboarding
  console.log(`\n5. Creating Fitness Profile & Biometric Baseline...`)
  await admin.from('fitness_profiles').upsert({
    user_id: clientId,
    preferred_units: 'imperial',
    age: 30,
    sex: 'male',
    height_cm: 180.34, // 5'11"
    weight_kg: 81.65,  // 180 lbs
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
  console.log(`   ✓ Full gym equipment profile & onboarding completed`)

  // 6. Deploy NASM OPT Periodization Plan
  console.log(`\n6. Deploying NASM OPT™ Workout Plan...`)
  const masterPlan = {
    user_id: clientId,
    name: `${options.tier} — Phase 2 Strength Endurance & Power Contrast`,
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
        coachNotes: 'Calibrated for performance, joint longevity, and metabolic recovery.',
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
      ],
    },
  }
  await admin.from('workout_plans').insert(masterPlan)
  console.log(`   ✓ Active 4-phase periodization workout plan configured`)

  // 7. Grant Retainer Package & Add-ons
  console.log(`\n7. Granting Retainer Packages & Add-On Passes...`)
  let premierPkgId = null
  try {
    const { data: premierPkg } = await admin.from('client_packages').insert({
      client_id: clientId,
      package_name: options.tier,
      sessions_total: 12,
      sessions_remaining: 12,
      source: 'comp',
      granted_by_coach_id: coachId,
      grant_note: 'Test Client VIP All-Access Pass',
      discount_code: 'DEVTESTCLIENT',
      purchased_at: nowIso,
      expires_at: null,
    }).select('id').single()
    premierPkgId = premierPkg?.id
    console.log(`   ✓ ${options.tier} Package granted (12 sessions, perpetual)`)
  } catch (err) {
    console.warn(`   ⚠️ Package grant notice: ${err.message}`)
  }

  for (const addon of CLINICAL_ADDONS) {
    try {
      await admin.from('client_packages').insert({
        client_id: clientId,
        package_name: addon.name,
        sessions_total: addon.sessions,
        sessions_remaining: addon.sessions,
        source: 'comp',
        granted_by_coach_id: coachId,
        grant_note: addon.note,
        discount_code: 'DEVTESTCLIENT',
        purchased_at: nowIso,
        expires_at: null,
      })
    } catch {
      // non-blocking
    }
  }
  console.log(`   ✓ Clinical Add-On passes loaded`)

  // 8. Assessments & Body Comp
  console.log(`\n8. Seeding Kinetic Screen & 3D Body Composition...`)
  try {
    await admin.from('nasm_assessments').insert({
      client_id: clientId,
      coach_id: coachId,
      title: 'Baseline 5-Checkpoint Kinetic Chain Screen',
      assessment_date: todayDate,
      overactive_muscles: ['Gastrocnemius', 'Soleus', 'Upper Trapezius'],
      underactive_muscles: ['Gluteus Medius', 'Gluteus Maximus', 'Lower Trapezius'],
      coach_summary_notes: 'Initial movement screen completed. Excellent shoulder mobility, minor hip hinge imbalance.',
    })
  } catch {
    // non-blocking
  }

  try {
    await admin.from('body_composition_analyses').insert({
      user_id: clientId,
      estimated_bodyfat_percent: 14.2,
      method: '3D AI Computer Vision Scan',
      confidence_score: 0.96,
    })
  } catch {
    // non-blocking
  }
  console.log(`   ✓ Baseline OHSA screen and 3D body fat (14.2%) created`)

  // 9. Personal Records & Wearables Telemetry
  console.log(`\n9. Seeding Personal Records & Health Telemetry...`)
  const prs = [
    { exercise_name: 'Barbell Bench Press', max_weight_kg: 95.0, max_weight_reps: 5, estimated_1rm_kg: 110.0 },
    { exercise_name: 'Trap Bar Deadlift', max_weight_kg: 150.0, max_weight_reps: 5, estimated_1rm_kg: 173.0 },
    { exercise_name: 'Barbell Back Squat', max_weight_kg: 120.0, max_weight_reps: 5, estimated_1rm_kg: 138.5 },
  ]
  for (const pr of prs) {
    try {
      await admin.from('client_personal_records').upsert({
        user_id: clientId,
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
      client_id: clientId,
      sample_date: todayDate,
      provider: 'apple_health',
      resting_heart_rate: 56,
      hrv_rmssd: 72.0,
      readiness_score: 88,
      sleep_hours: 7.8,
      active_calories_kcal: 620,
    }, { onConflict: 'client_id,sample_date,provider' })
  } catch {
    // non-blocking
  }
  console.log(`   ✓ Baseline PRs and Apple Health telemetry (88 readiness score) saved`)

  // 10. Welcome message & Scheduled Session
  if (coachId) {
    console.log(`\n10. Initializing Coach-Client Conversation & Live Session...`)
    try {
      await admin.from('coach_client_messages').insert({
        client_id: clientId,
        coach_id: coachId,
        sender_id: coachId,
        message: `Welcome to Forge Athletic, ${options.name.split(' ')[0]}! Your custom Phase 2 training plan is now loaded in your dashboard. Feel free to message me anytime if you have any questions before our upcoming session.`,
      })
    } catch {
      // non-blocking
    }

    try {
      const sessionStart = new Date(Date.now() + 24 * 3600 * 1000).toISOString()
      await admin.from('sessions').insert({
        client_id: clientId,
        package_id: premierPkgId,
        scheduled_at: sessionStart,
        duration_mins: 45,
        status: 'scheduled',
        notes: 'Initial 1:1 Live Telehealth Coaching Session & Form Assessment',
      })
    } catch {
      // non-blocking
    }
    console.log(`   ✓ Direct message thread and scheduled 1:1 Live Session created`)
  }

  console.log('\n=============================================================')
  console.log('🎉 TEST CLIENT SETUP COMPLETE!')
  console.log('=============================================================')
  printCredentials(options, clientId)
}

function printCredentials(options, clientId) {
  const baseUrl = process.env.MARKETING_BASE_URL || 'http://localhost:3000'
  console.log(`Client Credentials:`)
  console.log(`   • ID:       ${clientId}`)
  console.log(`   • Name:     ${options.name}`)
  console.log(`   • Email:    ${options.email}`)
  console.log(`   • Password: ${options.password}`)
  console.log(`   • Role:     Client`)
  console.log(`   • Status:   ${options.status}`)
  console.log(`   • Mode:     ${options.blank ? 'Blank / Un-onboarded' : 'Full VIP All-Access'}`)
  console.log(`\nLogin Link:`)
  console.log(`   • ${baseUrl}/auth/login`)
  console.log(`\nDirect Dashboard Links:`)
  console.log(`   • Overview:       ${baseUrl}/dashboard`)
  console.log(`   • Fitness & Log:  ${baseUrl}/dashboard/fitness`)
  console.log(`   • Live Telehealth:${baseUrl}/dashboard/live`)
  console.log(`   • Messages:       ${baseUrl}/dashboard/messages`)
  if (options.blank) {
    console.log(`   • Onboarding:     ${baseUrl}/dashboard/onboarding`)
  }
  console.log('=============================================================\n')
}

main().catch((err) => {
  console.error('\n❌ Fatal error creating test client:', err)
  process.exit(1)
})

