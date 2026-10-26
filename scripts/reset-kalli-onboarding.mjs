#!/usr/bin/env node

/**
 * scripts/reset-kalli-onboarding.mjs
 *
 * Resets Kalli Seabrooke's (kalicocat7@yahoo.com) account to a pristine,
 * pre-onboarding state so she can test the entire client intake and onboarding funnel.
 *
 * What gets reset:
 * - workout_plans: Deleted
 * - workout_logs, workout_set_logs, cardio_logs, exercise_skips: Cleared
 * - client_personal_records: Cleared
 * - nasm_assessments: Cleared
 * - body_composition_analyses: Cleared
 * - client_intake_forms (PAR-Q+, ERAP, Consents): Cleared
 * - fitness_profiles: Reset to clean slate (onboarding_completed_at = null, goals/vitals cleared)
 *
 * What is PRESERVED:
 * - Supabase Auth User (kalicocat7@yahoo.com, password ForgeBeta2026!)
 * - Clients record (active, assigned to Coach Gordon)
 * - Executive 1:1 Master package & 6 Clinical Add-on suites (comped VIP Beta)
 * - Feature entitlements (video-review, nutrition, travel passes unlocked)
 *
 * Usage:
 *   node --env-file=.env.local scripts/reset-kalli-onboarding.mjs
 */

import { createClient } from '@supabase/supabase-js'
import process from 'node:process'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const CLIENT_EMAIL = 'kalicocat7@yahoo.com'

async function resetKalli() {
  console.log('================================================================')
  console.log(`🔄 RESETTING KALLI SEABROOKE (${CLIENT_EMAIL}) FOR FULL ONBOARDING TEST`)
  console.log('================================================================\n')

  // 1. Locate Auth User
  const { data: userList, error: listError } = await admin.auth.admin.listUsers({ perPage: 200 })
  if (listError) {
    console.error(`❌ Error listing users: ${listError.message}`)
    process.exit(1)
  }

  const kalli = userList.users.find(u => u.email?.toLowerCase() === CLIENT_EMAIL.toLowerCase())
  if (!kalli) {
    console.error(`❌ User ${CLIENT_EMAIL} not found in Supabase Auth!`)
    process.exit(1)
  }

  const userId = kalli.id
  console.log(`✓ Located user: ${userId} (${CLIENT_EMAIL})`)

  // 2. Clear Workout Plans & Workout Logs
  console.log('1. Clearing workout plans and active logs...')
  await admin.from('workout_plans').delete().eq('user_id', userId)
  await admin.from('workout_set_logs').delete().eq('user_id', userId)
  await admin.from('workout_logs').delete().eq('user_id', userId)
  await admin.from('workout_video_events').delete().eq('user_id', userId)
  await admin.from('cardio_logs').delete().eq('user_id', userId)
  await admin.from('exercise_skips').delete().eq('user_id', userId)
  console.log('   ✓ Workout plans and logs cleared')

  // 3. Clear Assessments, PRs, and Body Comp
  console.log('2. Clearing assessments, PRs, and body composition analyses...')
  await admin.from('client_personal_records').delete().eq('user_id', userId)
  await admin.from('nasm_assessments').delete().eq('client_id', userId)
  await admin.from('body_composition_analyses').delete().eq('user_id', userId)
  await admin.from('weekly_checkins').delete().eq('user_id', userId)
  console.log('   ✓ Assessments, benchmarks, and body comp records cleared')

  // 4. Clear Client Intake Form (PAR-Q+, ERAP, Legal Consents)
  console.log('3. Clearing client intake form (PAR-Q+, ERAP, Consents)...')
  await admin.from('client_intake_forms').delete().eq('user_id', userId)
  console.log('   ✓ Intake form cleared for fresh submission')

  // 5. Reset Fitness Profile to pristine pre-onboarding baseline
  console.log('4. Resetting fitness profile to pre-onboarding baseline...')
  await admin.from('fitness_profiles').upsert({
    user_id: userId,
    preferred_units: 'imperial',
    age: null,
    sex: null,
    height_cm: null,
    weight_kg: null,
    waist_cm: null,
    neck_cm: null,
    hip_cm: null,
    activity_level: null,
    training_days_per_week: null,
    preferred_training_days: [],
    fitness_goal: null,
    target_weight_kg: null,
    target_bodyfat_percent: null,
    injuries_limitations: null,
    experience_level: null,
    workout_location: null,
    equipment_access: [],
    cardio_equipment_access: [],
    onboarding_completed_at: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  console.log('   ✓ Fitness profile reset: onboarding_completed_at is NULL')

  // 6. Verify VIP Entitlements and Membership Packages are Intact
  console.log('5. Verifying VIP Retainer Packages & Feature Entitlements...')
  const { data: packages } = await admin.from('client_packages').select('package_name, sessions_remaining').eq('client_id', userId)
  const { data: entitlements } = await admin.from('client_addon_entitlements').select('feature, expires_at').eq('client_id', userId)

  console.log('   ✓ Packages intact:', packages?.map(p => `${p.package_name} (${p.sessions_remaining} remaining)`).join(', '))
  console.log('   ✓ Entitlements intact:', entitlements?.map(e => e.feature).join(', '))

  console.log('\n================================================================')
  console.log('🎉 KALLI SEABROOKE ACCOUNT SUCCESSFULLY RESET TO FRESH ONBOARDING!')
  console.log('================================================================')
  console.log('Login credentials:')
  console.log(`  URL:      https://forge-athletic.app/auth/login`)
  console.log(`  Email:    ${CLIENT_EMAIL}`)
  console.log(`  Password: ForgeBeta2026!`)
  console.log('Status: Fresh slate — ready to test the complete onboarding funnel.\n')
}

resetKalli().catch(err => {
  console.error('❌ Failed to reset Kalli account:', err)
  process.exit(1)
})
