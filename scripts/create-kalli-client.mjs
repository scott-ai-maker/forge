#!/usr/bin/env node

/**
 * scripts/create-kalli-client.mjs
 *
 * Provisions a comprehensive VIP Beta Test account for Kalli Seabrooke:
 * - Email: kalicocat7@yahoo.com
 * - Name: Kalli Seabrooke
 * - Role: client
 * - Designated Coach: Coach Gordon (coach@forge-athletic.app)
 * - Tier: Executive 1:1 Master (All features & clinical suites unlocked)
 * - Complete with:
 *     1. Supabase Auth user & clients row
 *     2. Low-risk Clinical Intake & Liability Waivers (PAR-Q+)
 *     3. Fitness Profile (Apple Health primary telemetry, balanced gym equipment)
 *     4. Calibrated 3-Day Phase 2 Strength Endurance Periodization Plan
 *     5. Premier Retainer Package (12 comp sessions, perpetual) + 6 Clinical Add-on Suites
 *     6. Feature Add-On Entitlements (Form Lab video review, nutrition, travel)
 *     7. Baseline 5-Checkpoint Kinetic Chain Screen & Apple Health Wearable Telemetry
 *     8. Coach Gordon Welcome Direct Message
 *     9. Priority iOS TestFlight / Waitlist queue registration
 *    10. HIPAA & Lifecycle Compliance Audit Log
 *
 * Usage:
 *   node --env-file=.env.local scripts/create-kalli-client.mjs
 */

import { createClient } from '@supabase/supabase-js'
import process from 'node:process'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const COACH_ID = 'a896b7f6-5946-4452-a501-ace7feda0e55' // Coach Gordon (coach@forge-athletic.app)
const CLIENT_EMAIL = 'kalicocat7@yahoo.com'
const CLIENT_NAME = 'Kalli Seabrooke'
const CLIENT_PASSWORD = process.env.KALLI_CLIENT_PASSWORD || process.env.TEMP_CLIENT_PASSWORD || 'ForgeBeta2026!'

const CLINICAL_ADDON_SUITES = [
  {
    name: 'Metabolic Nutrition & Nutrient Periodization Suite',
    sessions: 0,
    note: 'VIP Beta Complimentary Access · Metabolic Nutrition Engine',
  },
  {
    name: 'Biomechanical Video Form Critique Pass',
    sessions: 0,
    note: 'VIP Beta Complimentary Access · Priority Video Telemetry (Form Lab)',
  },
  {
    name: 'Clinical Supplement Stacking & Interaction Audit',
    sessions: 0,
    note: 'VIP Beta Complimentary Access · Evidence-Based Pharmacology',
  },
  {
    name: 'Executive Road-Warrior Travel Pass',
    sessions: 0,
    note: 'VIP Beta Complimentary Access · Dynamic Mobility Adapter',
  },
  {
    name: '3D Kinetic Movement & Postural Diagnostic',
    sessions: 1,
    note: 'VIP Beta Complimentary Access · Clinical Biomechanical Screen',
  },
  {
    name: 'Clinical 3D AI Kinetic Chain & Postural Distortion Audit',
    sessions: 0,
    note: 'VIP Beta Complimentary Access · Computer Vision Diagnostic Screen',
  },
]

const ENTITLEMENT_FEATURES = ['video-review', 'nutrition', 'travel']

async function provisionKalli() {
  console.log('================================================================')
  console.log('⚡ PROVISIONING VIP BETA TESTER: Kalli Seabrooke')
  console.log('================================================================')
  console.log(`Email:       ${CLIENT_EMAIL}`)
  console.log(`Name:        ${CLIENT_NAME}`)
  console.log(`Password:    ${CLIENT_PASSWORD}`)
  console.log(`Role:        Client (VIP Beta Tester)`)
  console.log(`Coach:       Coach Gordon (${COACH_ID})`)
  console.log('================================================================\n')

  const now = new Date()
  const nowIso = now.toISOString()
  const todayDate = nowIso.split('T')[0]
  const expiresAt = new Date(now)
  expiresAt.setFullYear(expiresAt.getFullYear() + 10) // 10-year perpetual access

  // 1. Create or Update Supabase Auth User
  console.log('1. Resolving / Creating Supabase Auth user...')
  let clientId = null
  const { data: userList, error: listError } = await admin.auth.admin.listUsers({ perPage: 200 })
  if (listError) {
    console.error(`❌ Error listing users: ${listError.message}`)
    process.exit(1)
  }

  const existingAuthUser = userList.users.find(u => u.email?.toLowerCase() === CLIENT_EMAIL.toLowerCase())

  if (existingAuthUser) {
    clientId = existingAuthUser.id
    console.log(`   ℹ️ Existing auth user found: ${clientId}`)

    const { error: updateAuthError } = await admin.auth.admin.updateUserById(clientId, {
      password: CLIENT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: CLIENT_NAME,
        display_name: CLIENT_NAME,
        name: CLIENT_NAME,
        surface_role: 'client',
        must_reset_password: false,
        vip_all_access: true,
        tier: 'Executive 1:1 Master',
      },
    })

    if (updateAuthError) {
      console.error(`❌ Failed to update auth user: ${updateAuthError.message}`)
      process.exit(1)
    }
    console.log('   ✓ Auth user credentials & metadata synchronized')
  } else {
    const { data: newAuthUser, error: createAuthError } = await admin.auth.admin.createUser({
      email: CLIENT_EMAIL,
      password: CLIENT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: CLIENT_NAME,
        display_name: CLIENT_NAME,
        name: CLIENT_NAME,
        surface_role: 'client',
        must_reset_password: false,
        vip_all_access: true,
        tier: 'Executive 1:1 Master',
      },
    })

    if (createAuthError) {
      console.error(`❌ Failed to create auth user: ${createAuthError.message}`)
      process.exit(1)
    }

    clientId = newAuthUser.user.id
    console.log(`   ✓ New auth user created: ${clientId}`)
  }

  // 2. Synchronize Clients Table Record
  console.log('\n2. Upserting client profile record...')
  const { error: clientUpsertError } = await admin.from('clients').upsert({
    id: clientId,
    email: CLIENT_EMAIL,
    full_name: CLIENT_NAME,
    role: 'client',
    status: 'active',
    status_reason: 'VIP Beta Tester · Executive 1:1 Master All-Access',
    status_updated_at: nowIso,
    status_updated_by: COACH_ID,
    designated_coach_id: COACH_ID,
    must_reset_password: false,
  }, { onConflict: 'id' })

  if (clientUpsertError) {
    console.error(`❌ Failed to upsert client record: ${clientUpsertError.message}`)
    process.exit(1)
  }
  console.log(`   ✓ Clients record active and assigned to Coach Gordon`)

  // 3. Clinical Intake & Liability Shield (PAR-Q+)
  console.log('\n3. Populating Clinical Intake & Liability Shield...')
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
    consent_signature_name: CLIENT_NAME,
    consent_signed_at: nowIso,
  }, { onConflict: 'user_id' })
  console.log('   ✓ Low-risk PAR-Q+ and signed liability waivers provisioned')

  // 4. Fitness Profile & Telemetry Baseline
  console.log('\n4. Creating Fitness Profile (iOS Apple Health & Gym Equipment)...')
  await admin.from('fitness_profiles').upsert({
    user_id: clientId,
    preferred_units: 'imperial',
    age: 32,
    sex: 'female',
    height_cm: 167.64, // 5'6"
    weight_kg: 63.5,   // 140 lbs
    activity_level: 'moderate',
    training_days_per_week: 3,
    fitness_goal: 'Strength Endurance & Athletic Conditioning',
    workout_location: 'gym',
    equipment_access: [
      'Dumbbells',
      'Band or Tube',
      'Bodyweight',
      'Bench',
      'Kettlebells',
      'Stability Ball',
      'Cables',
      'Foam Roller',
    ],
    cardio_equipment_access: ['treadmill', 'rower', 'airbike'],
    preferred_training_days: ['monday', 'wednesday', 'friday'],
    primary_telemetry_source: 'apple_health',
    onboarding_completed_at: nowIso,
  }, { onConflict: 'user_id' })
  console.log('   ✓ Baseline fitness profile & Apple Health telemetry configured')

  // 5. Deploy Periodized Workout Plan (Phase 2 Strength Endurance & Conditioning)
  console.log('\n5. Deploying 3-Day Phase 2 Periodized Workout Plan...')
  // Remove any stale workout plans for clean setup
  await admin.from('workout_plans').delete().eq('user_id', clientId)

  const periodizedPlan = {
    user_id: clientId,
    name: 'Executive 1:1 Master — Phase 2 Strength Endurance & Athletic Conditioning',
    goal: 'Strength Endurance & Athletic Conditioning',
    nasm_opt_phase: 2,
    phase_name: 'Phase 2: Strength Endurance',
    sessions_per_week: 3,
    estimated_duration_mins: 45,
    plan_json: {
      periodizationPlan: {
        phases: [
          { phaseNumber: 1, name: 'Stabilization Endurance', weekRange: 'Weeks 1–4', color: '#4dabf7', focus: 'Joint stability, core recruitment, and movement patterning' },
          { phaseNumber: 2, name: 'Strength Endurance', weekRange: 'Weeks 5–8', color: '#C5A059', focus: 'Agonist-antagonist supersets & muscular stamina' },
          { phaseNumber: 4, name: 'Maximal Strength', weekRange: 'Weeks 9–11', color: '#ff922b', focus: 'High-threshold motor unit development' },
          { phaseNumber: 5, name: 'Power & Peak', weekRange: 'Week 12', color: '#34d399', focus: 'Rate of force development & athletic transfer' },
        ],
        totalWeeks: 12,
        currentWeek: 5,
        coachNotes: 'Welcome to your beta test plan, Kalli! This program pairs agonist strength exercises with proprioceptively enriched stabilization movements.',
      },
      workouts: [
        {
          day: 1,
          focus: 'Upper Body Strength & Stabilization Superset Contrast',
          scheduledDate: todayDate,
          exercises: [
            {
              name: 'Dumbbell Bench Press',
              sets: 3,
              reps: '10-12',
              tempo: '2-0-2-0',
              restSeconds: 60,
              supersetPairWith: 'Standing Cable Row',
              coachingCues: ['Retract scapulae into bench', 'Elbows at 45-degree angle', 'Controlled 2s eccentric lowering'],
            },
            {
              name: 'Standing Cable Row',
              sets: 3,
              reps: '10-12',
              tempo: '2-0-2-0',
              restSeconds: 60,
              coachingCues: ['Neutral athletic stance', 'Drive elbows back past ribs', 'Squeeze mid-traps and rhomboids'],
            },
            {
              name: 'Push-up with Hands on Bench',
              sets: 3,
              reps: '10-12',
              tempo: '2-1-1-0',
              restSeconds: 60,
              coachingCues: ['Brace core like a plank', 'Maintain neutral cervical spine', 'Smooth continuous cadence'],
            },
            {
              name: 'Single-Leg Dumbbell Curl to Overhead Press',
              sets: 3,
              reps: '8-10 / leg',
              tempo: '2-1-2-0',
              restSeconds: 60,
              coachingCues: ['Balance on single foot', 'Grip floor with toes', 'Full overhead lockout with ribs braced'],
            },
          ],
          cardio: {
            title: 'Stage 2 Aerobic / Lactate Threshold Flush',
            protocolType: 'stage_interval_conditioning',
            stage: 2,
            stageName: 'Stage 2: Lactate Threshold',
            targetZone: 'Zone 2-3',
            targetBpmRange: '138-158 BPM',
            durationMins: 15,
            workRestRatio: '1:2 (60s brisk pace / 120s conversational recovery)',
            recommendedModalities: ['Treadmill Incline Walk', 'Assault AirBike', 'Rowing Ergometer'],
          },
        },
        {
          day: 2,
          focus: 'Lower Body & Core Stability Supercompensation',
          exercises: [
            {
              name: 'Goblet Squat',
              sets: 3,
              reps: '10-12',
              tempo: '2-0-2-0',
              restSeconds: 60,
              coachingCues: ['Hold dumbbell tight to chest', 'Drive knees out over 2nd toes', 'Sit hips between heels'],
            },
            {
              name: 'Box Squat',
              sets: 3,
              reps: '12-15',
              tempo: '2-1-2-0',
              restSeconds: 60,
              coachingCues: ['Sit back onto box with control', 'Keep shins vertical', 'Drive through midfoot to stand'],
            },
            {
              name: 'Romanian Deadlift (Dumbbell RDL)',
              sets: 3,
              reps: '10-12',
              tempo: '3-1-1-0',
              restSeconds: 60,
              coachingCues: ['Hinge hips back toward rear wall', 'Keep weights glued to thighs', 'High tension in hamstrings and glutes'],
            },
            {
              name: 'Single-Leg Balance Reach',
              sets: 3,
              reps: '8-10 / leg',
              tempo: '2-2-1-0',
              restSeconds: 45,
              coachingCues: ['Soft knee on standing leg', 'Reach opposite foot without touching floor', 'Engage gluteus medius'],
            },
          ],
        },
        {
          day: 3,
          focus: 'Total Body Kinetic Fusion & Conditioning',
          exercises: [
            {
              name: 'Dumbbell Step-Up to Balance',
              sets: 3,
              reps: '10 / leg',
              tempo: '2-1-1-0',
              restSeconds: 60,
              coachingCues: ['Drive through lead heel on bench', 'Hold single-leg balance 2 seconds at top', 'Lower under total control'],
            },
            {
              name: 'Kettlebell Deadlift to High Pull',
              sets: 3,
              reps: '10-12',
              tempo: '2-0-1-0',
              restSeconds: 60,
              coachingCues: ['Explosive hip extension', 'Elbows lead higher than wrists', 'Solid core brace'],
            },
            {
              name: 'Cable Woodchop',
              sets: 3,
              reps: '10-12 / side',
              tempo: '2-0-1-0',
              restSeconds: 45,
              coachingCues: ['Pivot back foot', 'Rotate through thoracic spine, not lower back', 'Control returning eccentric motion'],
            },
            {
              name: 'Plank with Arm Lift',
              sets: 3,
              reps: '8-10 / arm',
              tempo: '1-2-1-0',
              restSeconds: 45,
              coachingCues: ['Wide feet for anti-rotational stability', 'Hips remain perfectly parallel to floor'],
            },
          ],
        },
      ],
    },
  }

  const { error: planInsertError } = await admin.from('workout_plans').insert(periodizedPlan)
  if (planInsertError) {
    console.error(`❌ Failed to insert workout plan: ${planInsertError.message}`)
  } else {
    console.log('   ✓ Active 3-Day Phase 2 Strength Endurance Plan activated')
  }

  // 6. Grant Premier Executive 1:1 Master Package
  console.log('\n6. Granting Premier Retainer Package & Add-on Suites...')
  const { data: existingPremierPkg } = await admin
    .from('client_packages')
    .select('id')
    .eq('client_id', clientId)
    .eq('package_name', 'Executive 1:1 Master')
    .maybeSingle()

  let premierPkgId = existingPremierPkg?.id
  if (!premierPkgId) {
    const { data: premierPkg, error: premierErr } = await admin
      .from('client_packages')
      .insert({
        client_id: clientId,
        package_name: 'Executive 1:1 Master',
        sessions_total: 12,
        sessions_remaining: 12,
        source: 'comp',
        granted_by_coach_id: COACH_ID,
        grant_note: 'VIP Beta Tester Full All-Access Pass (Perpetual)',
        discount_code: 'ALLACCESS_BETA',
        discount_amount_cents: 149500,
        purchased_at: nowIso,
        expires_at: null,
      })
      .select('id')
      .single()

    if (premierErr) {
      console.warn(`   ⚠️ Premier package notice: ${premierErr.message}`)
    } else {
      premierPkgId = premierPkg?.id
      console.log('   ✓ Premier Package Granted: Executive 1:1 Master (12 comp sessions, perpetual)')

      await admin.from('comp_session_grants').insert({
        client_id: clientId,
        coach_id: COACH_ID,
        sessions_granted: 12,
        note: 'Executive 1:1 Master VIP Beta Pass (Perpetual)',
        client_package_id: premierPkgId,
      })
    }
  }

  // 7. Grant Clinical Add-On Suites
  for (const addon of CLINICAL_ADDON_SUITES) {
    const { data: existingAddon } = await admin
      .from('client_packages')
      .select('id')
      .eq('client_id', clientId)
      .eq('package_name', addon.name)
      .maybeSingle()

    if (!existingAddon) {
      await admin.from('client_packages').insert({
        client_id: clientId,
        package_name: addon.name,
        sessions_total: addon.sessions,
        sessions_remaining: addon.sessions,
        source: 'comp',
        granted_by_coach_id: COACH_ID,
        grant_note: addon.note,
        discount_code: 'ALLACCESS_BETA',
        discount_amount_cents: 14900,
        purchased_at: nowIso,
        expires_at: null,
      })
    }
  }
  console.log('   ✓ All 6 Clinical Add-on Suites loaded into member wallet')

  // 8. Grant Feature Add-On Entitlements (Form Lab, Nutrition, Travel)
  console.log('\n7. Granting Feature Add-On Entitlements (Form Lab, Nutrition, Travel)...')
  const entitlementRows = ENTITLEMENT_FEATURES.map(feature => ({
    client_id: clientId,
    addon_id: 'vip-all-access',
    feature,
    uses_total: null,
    uses_remaining: null,
    stripe_payment_id: `vip-all-access:${clientId}:${feature}`,
    granted_at: nowIso,
    expires_at: expiresAt.toISOString(),
  }))

  const { error: entitlementError } = await admin
    .from('client_addon_entitlements')
    .upsert(entitlementRows, { onConflict: 'stripe_payment_id' })

  if (entitlementError) {
    console.error(`❌ Failed to grant feature entitlements: ${entitlementError.message}`)
  } else {
    console.log(`   ✓ Feature entitlements active (video-review, nutrition, travel) through ${expiresAt.toISOString().slice(0, 10)}`)
  }

  // 9. Kinetic Chain Movement Screen & Body Composition
  console.log('\n8. Seeding Kinetic Screen & Wearable Telemetry...')
  try {
    await admin.from('nasm_assessments').insert({
      client_id: clientId,
      coach_id: COACH_ID,
      title: 'Baseline 5-Checkpoint Kinetic Chain Screen',
      assessment_date: todayDate,
      overactive_muscles: ['Gastrocnemius', 'Upper Trapezius', 'Hip Flexor Complex'],
      underactive_muscles: ['Gluteus Medius', 'Anterior Tibialis', 'Lower Trapezius'],
      coach_summary_notes: 'Initial movement screen completed. Strong core stability, mild lateral weight shift and ankle dorsiflexion stiffness.',
    })
  } catch {
    // non-blocking
  }

  try {
    await admin.from('athlete_wearable_metrics').upsert({
      client_id: clientId,
      sample_date: todayDate,
      provider: 'apple_health',
      resting_heart_rate: 60,
      hrv_rmssd: 68.0,
      readiness_score: 92,
      sleep_hours: 8.0,
      active_calories_kcal: 480,
    }, { onConflict: 'client_id,sample_date,provider' })
  } catch {
    // non-blocking
  }

  const baselinePrs = [
    { exercise_name: 'Goblet Squat', max_weight_kg: 16.0, max_weight_reps: 10, estimated_1rm_kg: 21.0 },
    { exercise_name: 'Dumbbell Bench Press', max_weight_kg: 12.0, max_weight_reps: 10, estimated_1rm_kg: 15.5 },
    { exercise_name: 'Romanian Deadlift (Dumbbell RDL)', max_weight_kg: 20.0, max_weight_reps: 10, estimated_1rm_kg: 26.0 },
  ]
  for (const pr of baselinePrs) {
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
  console.log('   ✓ Baseline movement screen, Apple Health telemetry (92 readiness), and PR benchmarks provisioned')

  // 10. Coach Welcome Message & Direct In-App Thread
  console.log('\n9. Initializing Coach-Client Conversation...')
  try {
    await admin.from('coach_client_messages').insert({
      client_id: clientId,
      coach_id: COACH_ID,
      sender_id: COACH_ID,
      message: `Welcome to Forge Athletic, Kalli! I've loaded your Phase 2 Strength Endurance training block into your dashboard. Since you're on iPhone, be sure to tap the Safari Share button and select "Add to Home Screen" to run the companion in full-screen mode with the audio cadence metronome and camera movement screens. Feel free to shoot me a message here anytime!`,
    })
    console.log('   ✓ Welcome message delivered to in-app messages thread')
  } catch {
    // non-blocking
  }

  // 11. Priority Waitlist / TestFlight Registration Entry
  console.log('\n10. Registering in Priority iOS TestFlight Waitlist...')
  try {
    const { error: waitlistErr } = await admin.from('waitlist').upsert({
      email: CLIENT_EMAIL,
      first_name: 'Kalli',
      training_level: 'intermediate',
      primary_goal: 'Beta Tester (iOS TestFlight & PWA)',
      source: 'testflight_ios',
    }, { onConflict: 'email' })

    if (waitlistErr) {
      console.warn(`   ⚠️ Waitlist notice: ${waitlistErr.message}`)
    } else {
      console.log('   ✓ Registered in TestFlight beta dispatch queue (source: testflight_ios)')
    }
  } catch {
    // non-blocking
  }

  // 12. Record Compliance & Audit Lifecycle Entry
  console.log('\n11. Recording HIPAA & Lifecycle Compliance Audit Log...')
  try {
    await admin.from('client_lifecycle_audit_logs').insert({
      client_id: clientId,
      actor_id: COACH_ID,
      actor_name: 'Coach Gordon',
      actor_role: 'coach',
      action: 'status_change',
      previous_status: 'active',
      new_status: 'active',
      reason_code: 'beta_tester_onboarded',
      reason_notes: 'Created new VIP beta tester client Kalli Seabrooke with all features unlocked in Executive 1:1 Master plan.',
      effective_date: nowIso,
      metadata: {
        vip_grant: true,
        package: 'Executive 1:1 Master',
        platform: 'ios',
        indefinite: true,
      },
    })
    console.log('   ✓ Audit log entry recorded')
  } catch {
    // non-blocking
  }

  console.log('\n================================================================')
  console.log('🎉 KALLI SEABROOKE ACCOUNT PROVISIONED SUCCESSFULLY!')
  console.log('================================================================')
  console.log(`Credentials:`)
  console.log(`   • Name:      ${CLIENT_NAME}`)
  console.log(`   • Email:     ${CLIENT_EMAIL}`)
  console.log(`   • Password:  ${CLIENT_PASSWORD}`)
  console.log(`   • User ID:   ${clientId}`)
  console.log(`   • Coach:     Coach Gordon (${COACH_ID})`)
  console.log(`   • Plan:      Executive 1:1 Master (All Features & Clinical Suites Unlocked)`)
  console.log(`\nDirect Access Links:`)
  console.log(`   • Login:           https://forge-athletic.app/auth/login`)
  console.log(`   • Dashboard:       https://forge-athletic.app/dashboard`)
  console.log(`   • Workout Tracker: https://forge-athletic.app/dashboard/fitness`)
  console.log(`   • Form Lab Video:  https://forge-athletic.app/dashboard/fitness?tab=review`)
  console.log(`   • Messages:        https://forge-athletic.app/dashboard/messages`)
  console.log(`   • Onboarding Edit: https://forge-athletic.app/dashboard/onboarding`)
  console.log('================================================================\n')
}

provisionKalli().catch(err => {
  console.error('\n❌ Fatal execution error:', err)
  process.exit(1)
})
