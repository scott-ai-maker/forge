#!/usr/bin/env node

/**
 * scripts/restart-scott-client.ts
 *
 * Restarts and provisions Scott Gordon's personal client account(s):
 * - 5c077.60rd0n@gmail.com (Personal Client Account)
 * - scott@forge-athletic.app (Forge Athletic Client Account)
 *
 * Sets up the exact pristine post-onboarding state with everything filled out:
 * 1. Auth user & client record with designated coach (Coach Gordon).
 * 2. Complete PAR-Q+, ERAP, and medical intake records (BP med Losartan, etc.).
 * 3. Complete fitness profile (54yo, 6'1", 308 lbs, home equipment, 4 days/wk).
 * 4. DEXA 4C body composition scan on record (26.4% body fat).
 * 5. Full VIP packages and feature entitlements (Executive 1:1 Master).
 * 6. Clean slate on workout logs/history (clears old logs/sets/skips/PRs).
 * 7. Freshly auto-generated NASM OPT workout plan based on onboarding profile.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/restart-scott-client.ts
 */

import { createClient } from '@supabase/supabase-js'
import process from 'node:process'
import { autoGenerateOrUpdateClientWorkoutPlan } from '../lib/client-plan-auto-generator'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const COACH_ID = 'a896b7f6-5946-4452-a501-ace7feda0e55' // Coach Gordon
const CLIENT_PASSWORD = process.env.SCOTT_CLIENT_PASSWORD || process.env.TEMP_CLIENT_PASSWORD || 'ForgeAthlete2026!'

const TARGET_ACCOUNTS = [
  {
    email: '5c077.60rd0n@gmail.com',
    fullName: 'Scott Gordon',
  },
  {
    email: 'scott@forge-athletic.app',
    fullName: 'Scott Gordon',
  },
]

const CLINICAL_ADDON_SUITES = [
  {
    name: 'Metabolic Nutrition & Nutrient Periodization Suite',
    sessions: 0,
    note: 'VIP Complimentary Access · Metabolic Nutrition Engine',
  },
  {
    name: 'Biomechanical Video Form Critique Pass',
    sessions: 0,
    note: 'VIP Complimentary Access · Priority Video Telemetry',
  },
  {
    name: 'Clinical Supplement Stacking & Interaction Audit',
    sessions: 0,
    note: 'VIP Complimentary Access · Evidence-Based Pharmacology',
  },
  {
    name: 'Executive Road-Warrior Travel Pass',
    sessions: 0,
    note: 'VIP Complimentary Access · Dynamic Mobility Adapter',
  },
  {
    name: '3D Kinetic Movement & Postural Diagnostic',
    sessions: 1,
    note: 'VIP Complimentary Access · Clinical Biomechanical Screen',
  },
  {
    name: 'Clinical 3D AI Kinetic Chain & Postural Distortion Audit',
    sessions: 0,
    note: 'VIP Complimentary Access · Computer Vision Diagnostic Screen',
  },
]

const ENTITLEMENT_FEATURES = ['video-review', 'nutrition', 'travel']

async function restartAccount(account: { email: string; fullName: string }) {
  const { email, fullName } = account
  console.log(`\n======================================================`)
  console.log(`⚡ RESTARTING ACCOUNT: ${email}`)
  console.log(`======================================================`)

  const now = new Date()
  const nowIso = now.toISOString()
  const expiresAt = new Date(now)
  expiresAt.setFullYear(expiresAt.getFullYear() + 10) // 10 years

  // 1. Ensure Auth User
  let clientId: string
  const { data: userList, error: listError } = await admin.auth.admin.listUsers({ perPage: 200 })
  if (listError) {
    throw new Error(`Failed to list auth users: ${listError.message}`)
  }

  const existingAuth = userList.users.find(u => u.email?.toLowerCase().trim() === email.toLowerCase().trim())
  if (existingAuth) {
    clientId = existingAuth.id
    console.log(`✓ Existing auth user found: ${clientId}`)

    const { error: updateAuthErr } = await admin.auth.admin.updateUserById(clientId, {
      password: CLIENT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        display_name: fullName,
        name: fullName,
        surface_role: 'client',
        must_reset_password: false,
        vip_all_access: true,
        tier: 'Executive 1:1 Master',
      },
    })
    if (updateAuthErr) {
      console.warn(`⚠️ Error updating auth metadata: ${updateAuthErr.message}`)
    } else {
      console.log(`✓ Auth credentials & metadata synced (Password set)`)
    }
  } else {
    console.log(`Creating new auth user for ${email}...`)
    const { data: newAuth, error: createAuthErr } = await admin.auth.admin.createUser({
      email,
      password: CLIENT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        display_name: fullName,
        name: fullName,
        surface_role: 'client',
        must_reset_password: false,
        vip_all_access: true,
        tier: 'Executive 1:1 Master',
      },
    })
    if (createAuthErr || !newAuth.user) {
      throw new Error(`Failed to create auth user: ${createAuthErr?.message}`)
    }
    clientId = newAuth.user.id
    console.log(`✓ New auth user created: ${clientId}`)
  }

  // 2. Clear previous workout logs & activity to give a clean post-onboarding slate
  console.log(`\n🧹 Clearing previous workout execution history...`)
  const childActivityTables = [
    { table: 'workout_set_logs', column: 'user_id' },
    { table: 'workout_logs', column: 'user_id' },
    { table: 'workout_video_events', column: 'user_id' },
    { table: 'cardio_logs', column: 'user_id' },
    { table: 'exercise_skips', column: 'user_id' },
    { table: 'client_personal_records', column: 'user_id' },
    { table: 'weekly_checkins', column: 'user_id' },
  ]
  for (const step of childActivityTables) {
    try {
      const { count } = await admin
        .from(step.table)
        .select('*', { count: 'exact', head: true })
        .eq(step.column, clientId)
      if (count && count > 0) {
        await admin.from(step.table).delete().eq(step.column, clientId)
        console.log(`  ✓ Cleared ${count} record(s) from ${step.table}`)
      }
    } catch {
      // safe fallback
    }
  }

  // 3. Upsert Client Record
  console.log(`\n👤 Upserting client record...`)
  const { error: clientErr } = await admin.from('clients').upsert({
    id: clientId,
    email,
    full_name: fullName,
    role: 'client',
    status: 'active',
    status_reason: 'VIP All-Access Pass · Executive 1:1 Master',
    status_updated_at: nowIso,
    status_updated_by: COACH_ID,
    designated_coach_id: COACH_ID,
    must_reset_password: false,
  }, { onConflict: 'id' })

  if (clientErr) {
    throw new Error(`Failed to upsert client record: ${clientErr.message}`)
  }
  console.log(`✓ Client record active and assigned to Coach Gordon (${COACH_ID})`)

  // 4. Upsert Intake Form (PAR-Q+, Medical History, ERAP, Consents)
  console.log(`\n📋 Upserting client intake form (PAR-Q+, ERAP & medical history)...`)
  const intakePayload = {
    user_id: clientId,
    parq_answers: {
      q1: false,
      q2: false,
      q3: false,
      q4: false,
      q5: false,
      q6: true, // Blood pressure medication
      q7: false,
      erap: {
        workoutStreetAddress: '70 Green Briar Road',
        workoutCity: 'Fitchburg,MA,01420',
        workoutState: 'MA',
        workoutPostalCode: '01420',
        workoutUnitOrGateCode: '',
        virtualTelehealthConsent: true,
        localEmergencyDispatchPhone: '978-534-7560',
      },
    },
    parq_any_yes: true,
    medical_conditions: 'High blood pressure, OCD, anxiety disorder',
    medications: 'Losartan 100 mg, Zoloft 100 mg, Atvorstatin 10mg',
    surgeries_or_injuries: 'Unbilical hernia surgury',
    allergies: null,
    emergency_contact_name: 'Lisa Gordon',
    emergency_contact_phone: '978-333-9556',
    primary_physician_name: null,
    primary_physician_phone: null,
    consent_liability_waiver: true,
    consent_informed_consent: true,
    consent_privacy_practices: true,
    consent_coaching_agreement: true,
    consent_emergency_care: true,
    consent_signature_name: fullName,
    consent_signed_at: nowIso,
    created_at: nowIso,
    updated_at: nowIso,
  }

  const { error: intakeErr } = await admin
    .from('client_intake_forms')
    .upsert(intakePayload, { onConflict: 'user_id' })

  if (intakeErr) {
    throw new Error(`Failed to upsert client intake: ${intakeErr.message}`)
  }
  console.log(`✓ Client intake form saved with full PAR-Q+, ERAP, and medical history`)

  // 5. Upsert Fitness Profile (Completed Onboarding Baseline)
  console.log(`\n🏋️ Upserting baseline fitness profile...`)
  const profilePayload = {
    user_id: clientId,
    age: 54,
    sex: 'male',
    height_cm: 185.42, // 6'1"
    weight_kg: 139.71, // 308 lbs
    waist_cm: 111.76,  // 44"
    neck_cm: 48.26,   // 19"
    hip_cm: null,
    activity_level: 'moderate',
    training_days_per_week: 4,
    preferred_training_days: ['monday', 'tuesday', 'thursday', 'friday'],
    fitness_goal: 'fat-loss',
    target_weight_kg: 108.86, // 240 lbs
    target_bodyfat_percent: 12,
    injuries_limitations: 'Sedentary AI engineer (desk worker); prescription blood pressure medication (strict rhythmic breathing, avoid prolonged Valsalva); deconditioned joint tolerance',
    experience_level: 'beginner',
    workout_location: 'home',
    equipment_access: [
      'Bodyweight',
      'Bench',
      'Foam Roller',
      'Band or Tube',
      'BOSU Balance Trainer',
      'Stability Ball',
      'Dumbbells',
      'Medicine Ball',
    ],
    cardio_equipment_access: ['treadmill'],
    preferred_units: 'imperial',
    primary_telemetry_source: 'apple_health',
    onboarding_completed_at: nowIso,
    updated_at: nowIso,
  }

  const { error: profileErr } = await admin
    .from('fitness_profiles')
    .upsert(profilePayload, { onConflict: 'user_id' })

  if (profileErr) {
    throw new Error(`Failed to upsert fitness profile: ${profileErr.message}`)
  }
  console.log(`✓ Fitness profile saved (54yo male, 6'1", 308 lbs, home equipment, 4 days/wk, beginner)`)

  // 6. Ensure DEXA 4C Body Composition Scan on Record
  console.log(`\n🔬 Ingesting DEXA 4C Body Composition Scan...`)
  const { data: existingScan } = await admin
    .from('body_composition_analyses')
    .select('id')
    .eq('user_id', clientId)
    .limit(1)
    .maybeSingle()

  if (!existingScan) {
    await admin.from('body_composition_analyses').insert({
      user_id: clientId,
      estimated_bodyfat_percent: 26.4,
      confidence_score: 0.95,
      method: 'DEXA 4C Vision Scan',
      created_at: nowIso,
    })
    console.log(`✓ DEXA 4C scan inserted (~26.4% BF, ~225 lbs LBM)`)
  } else {
    console.log(`✓ DEXA scan already present on record`)
  }

  // 7. Ensure VIP Packages & Clinical Add-Ons
  console.log(`\n🎁 Ensuring Executive 1:1 Master VIP packages & feature passes...`)
  const { data: existingPremierPkg } = await admin
    .from('client_packages')
    .select('id')
    .eq('client_id', clientId)
    .eq('package_name', 'Executive 1:1 Master')
    .maybeSingle()

  if (!existingPremierPkg) {
    const { data: premierPkg } = await admin
      .from('client_packages')
      .insert({
        client_id: clientId,
        package_name: 'Executive 1:1 Master',
        sessions_total: 12,
        sessions_remaining: 12,
        source: 'comp',
        granted_by_coach_id: COACH_ID,
        grant_note: 'VIP Full Access & Best Package Indefinitely',
        discount_code: 'ALLACCESS',
        discount_amount_cents: 149500,
        purchased_at: nowIso,
        expires_at: null,
      })
      .select('id')
      .single()

    if (premierPkg) {
      await admin.from('comp_session_grants').insert({
        client_id: clientId,
        coach_id: COACH_ID,
        sessions_granted: 12,
        note: 'Executive 1:1 Master VIP Retainer (Indefinite)',
        client_package_id: premierPkg.id,
      })
    }
  }

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
        discount_code: 'ALLACCESS',
        discount_amount_cents: 14900,
        purchased_at: nowIso,
        expires_at: null,
      })
    }
  }

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
  await admin.from('client_addon_entitlements').upsert(entitlementRows, { onConflict: 'stripe_payment_id' })
  console.log(`✓ All VIP packages & feature entitlements active`)

  // 8. Auto-Generate Pristine Onboarding Workout Plan
  console.log(`\n⚙️ Auto-generating pristine onboarding workout plan...`)
  // Remove any legacy uncertified or certified plan to force clean generation from onboarding
  await admin.from('workout_plans').delete().eq('user_id', clientId)

  const planResult = await autoGenerateOrUpdateClientWorkoutPlan({
    clientId,
    trigger: 'onboarding',
  })

  console.log(`✓ Plan Generated:`)
  console.log(`  - Status: ${planResult.status}`)
  console.log(`  - Target NASM OPT Phase: ${planResult.nasmOptPhase} (${planResult.phaseName})`)
  console.log(`  - Sessions: ${planResult.sessionsPerWeek} days/week`)
  console.log(`  - Message: ${planResult.message}`)

  console.log(`\n🎉 ACCOUNT READY: ${email}`)
}

async function main() {
  for (const account of TARGET_ACCOUNTS) {
    await restartAccount(account)
  }

  console.log('\n======================================================')
  console.log('🏁 ALL CLIENT ACCOUNTS RESTARTED TO ONBOARDED BASELINE')
  console.log('======================================================')
  console.log('You can now log in using either:')
  console.log('1. 5c077.60rd0n@gmail.com')
  console.log('2. scott@forge-athletic.app')
  console.log(`Password: ForgeAthlete2026!`)
  console.log('Experience Level: Beginner (Ready for testing)')
  console.log('======================================================\n')
}

main().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
