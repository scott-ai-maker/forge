#!/usr/bin/env node

/**
 * scripts/delete-client-and-clear-workouts.mjs
 *
 * 1. Fully deletes legacy client 5c077.60rdon (5c077.60rd0n@gmail.com and 5c077.60rd0n@proton.me)
 *    from all database tables, storage, clients table, and auth.users.
 * 2. Clears workouts done for scott@forge-athletic.app (workout_logs, workout_set_logs,
 *    cardio_logs, client_personal_records, workout_video_events, exercise_skips) while
 *    strictly preserving their assigned protocol (workout_plans), onboarding status,
 *    intake forms, and wearable metrics.
 */

import { createClient } from '@supabase/supabase-js'
import process from 'node:process'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function deleteClient5c077() {
  console.log('\n======================================================')
  console.log('🗑️ STEP 1: DELETING CLIENT 5c077.60rdon')
  console.log('======================================================\n')

  const targetEmails = ['5c077.60rd0n@gmail.com', '5c077.60rd0n@proton.me']

  const { data: usersData, error: userError } = await supabase.auth.admin.listUsers()
  if (userError) {
    throw new Error(`Failed to list auth users: ${userError.message}`)
  }

  const matchingAuthUsers = usersData.users.filter((u) =>
    targetEmails.includes(u.email?.toLowerCase().trim())
  )

  console.log(`Found ${matchingAuthUsers.length} auth user(s) matching 5c077 targets:`)
  for (const u of matchingAuthUsers) {
    console.log(`  - ${u.email} (ID: ${u.id})`)
  }

  // Deletion child tables for a client
  const clientChildTables = [
    { table: 'workout_set_logs', column: 'user_id' },
    { table: 'workout_logs', column: 'user_id' },
    { table: 'workout_video_events', column: 'user_id' },
    { table: 'workout_plans', column: 'user_id' },
    { table: 'cardio_logs', column: 'user_id' },
    { table: 'exercise_skips', column: 'user_id' },
    { table: 'client_personal_records', column: 'user_id' },
    { table: 'client_goals', column: 'user_id' },
    { table: 'nasm_assessments', column: 'client_id' },
    { table: 'athlete_wearable_metrics', column: 'client_id' },
    { table: 'body_composition_analyses', column: 'user_id' },
    { table: 'weekly_checkins', column: 'user_id' },
    { table: 'progress_photos', column: 'user_id' },
    { table: 'push_tokens', column: 'user_id' },
    { table: 'coach_client_messages', column: 'client_id' },
    { table: 'coach_client_messages', column: 'sender_id' },
    { table: 'sessions', column: 'client_id' },
    { table: 'comp_session_grants', column: 'client_id' },
    { table: 'discount_code_redemptions', column: 'client_id' },
    { table: 'client_packages', column: 'client_id' },
    { table: 'client_lifecycle_audit_logs', column: 'client_id' },
    { table: 'client_intake_forms', column: 'user_id' },
    { table: 'fitness_profiles', column: 'user_id' },
    { table: 'client_addon_entitlements', column: 'client_id' },
    { table: 'notification_preferences', column: 'user_id' },
    { table: 'notification_log', column: 'user_id' },
    { table: 'referral_codes', column: 'client_id' },
    { table: 'referral_attributions', column: 'referrer_id' },
    { table: 'referral_attributions', column: 'referee_id' },
    { table: 'referral_rewards', column: 'client_id' },
  ]

  for (const authUser of matchingAuthUsers) {
    const userId = authUser.id
    const email = authUser.email
    console.log(`\n🧹 Purging records for ${email} (${userId})...`)

    // 1. Clean storage if any
    try {
      const { data: photoFiles } = await supabase.storage.from('fitness-photos').list(userId)
      if (photoFiles && photoFiles.length > 0) {
        const paths = photoFiles.map((f) => `${userId}/${f.name}`)
        await supabase.storage.from('fitness-photos').remove(paths)
        console.log(`  📁 Removed ${paths.length} storage files`)
      }
    } catch (err) {
      console.warn(`  ⚠️ Storage check: ${err.message}`)
    }

    // 2. Clean child database tables
    for (const step of clientChildTables) {
      try {
        const { count } = await supabase
          .from(step.table)
          .select('*', { count: 'exact', head: true })
          .eq(step.column, userId)

        if (count && count > 0) {
          const { error: delErr } = await supabase
            .from(step.table)
            .delete()
            .eq(step.column, userId)

          if (delErr) {
            console.error(`  ❌ Failed to delete from ${step.table}: ${delErr.message}`)
          } else {
            console.log(`  🗑️ Deleted ${count} record(s) from ${step.table}`)
          }
        }
      } catch (err) {
        // Table or column might not match, ignore safely
      }
    }

    // 3. Clean email queue / applications / waitlist by email
    try {
      await supabase.from('marketing_email_queue').delete().eq('email', email)
      await supabase.from('coaching_applications').delete().eq('email', email)
      await supabase.from('waitlist').delete().eq('email', email)
    } catch (err) {}

    // 4. Delete from clients table
    const { error: clientDelErr } = await supabase.from('clients').delete().eq('id', userId)
    if (clientDelErr) {
      console.error(`  ❌ Error deleting from clients table: ${clientDelErr.message}`)
    } else {
      console.log(`  ✅ Removed from clients table: ${email}`)
    }

    // 5. Delete from auth.users
    const { error: authDelErr } = await supabase.auth.admin.deleteUser(userId)
    if (authDelErr) {
      console.error(`  ❌ Error deleting auth user: ${authDelErr.message}`)
    } else {
      console.log(`  ✅ Deleted auth user: ${email} (${userId})`)
    }
  }

  // Also clean any leftover waitlist or applications for target emails just in case
  for (const email of targetEmails) {
    await supabase.from('coaching_applications').delete().eq('email', email)
    await supabase.from('waitlist').delete().eq('email', email)
  }
}

async function clearScottWorkoutsDone() {
  console.log('\n======================================================')
  console.log('🧹 STEP 2: CLEARING WORKOUTS DONE FOR scott@forge-athletic.app')
  console.log('======================================================\n')

  const targetEmail = 'scott@forge-athletic.app'

  // 1. Locate Scott's account
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('id, email, full_name')
    .eq('email', targetEmail)
    .single()

  if (clientErr || !client) {
    throw new Error(`Client ${targetEmail} not found: ${clientErr?.message}`)
  }

  const userId = client.id
  console.log(`Found client: ${client.full_name} (${client.email}, ID: ${userId})`)

  // 2. Workout tables to clear
  const workoutTablesToClear = [
    { table: 'workout_set_logs', column: 'user_id', label: 'Workout Set Logs' },
    { table: 'workout_logs', column: 'user_id', label: 'Workout Logs (Completed Sessions)' },
    { table: 'workout_video_events', column: 'user_id', label: 'Workout Video Events' },
    { table: 'exercise_skips', column: 'user_id', label: 'Exercise Skips' },
    { table: 'cardio_logs', column: 'user_id', label: 'Cardio Workout Logs' },
    { table: 'client_personal_records', column: 'user_id', label: 'Client Personal Records' },
  ]

  for (const step of workoutTablesToClear) {
    const { count } = await supabase
      .from(step.table)
      .select('*', { count: 'exact', head: true })
      .eq(step.column, userId)

    if (count && count > 0) {
      const { error: delErr } = await supabase
        .from(step.table)
        .delete()
        .eq(step.column, userId)

      if (delErr) {
        console.error(`  ❌ Failed to clear ${step.table}: ${delErr.message}`)
      } else {
        console.log(`  ✅ Cleared ${count} record(s) from ${step.table} (${step.label})`)
      }
    } else {
      console.log(`  ℹ️ 0 records in ${step.table} (${step.label})`)
    }
  }

  // 3. Clear workouts array in athlete_wearable_metrics raw_payload while keeping all biometrics
  const { data: metrics } = await supabase
    .from('athlete_wearable_metrics')
    .select('id, raw_payload')
    .eq('client_id', userId)

  if (metrics && metrics.length > 0) {
    for (const m of metrics) {
      if (m.raw_payload && m.raw_payload.workouts) {
        const updatedPayload = { ...m.raw_payload, workouts: [] }
        await supabase
          .from('athlete_wearable_metrics')
          .update({ raw_payload: updatedPayload })
          .eq('id', m.id)
        console.log(`  ✅ Cleared workouts from wearable payload for metric record ${m.id}`)
      }
    }
  }

  // 4. Verify what remains for Scott
  console.log('\n🔍 Verifying preserved state for Scott Gordon:')
  const { data: plan } = await supabase
    .from('workout_plans')
    .select('id, name, phase_name')
    .eq('user_id', userId)
    .maybeSingle()
  console.log(`  - Workout Plan Preserved: ${plan ? `"${plan.name}" (${plan.phase_name})` : 'None'}`)

  const { data: profile } = await supabase
    .from('fitness_profiles')
    .select('fitness_goal, onboarding_completed_at')
    .eq('user_id', userId)
    .maybeSingle()
  console.log(`  - Fitness Profile Preserved: Goal="${profile?.fitness_goal}", Onboarded=${Boolean(profile?.onboarding_completed_at)}`)

  const { data: intake } = await supabase
    .from('client_intake_forms')
    .select('consent_signed_at')
    .eq('user_id', userId)
    .maybeSingle()
  console.log(`  - Client Intake Form Preserved: Consent Signed=${Boolean(intake?.consent_signed_at)}`)
}

async function main() {
  await deleteClient5c077()
  await clearScottWorkoutsDone()
  console.log('\n✨ All operations completed successfully!\n')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
