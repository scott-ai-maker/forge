#!/usr/bin/env node

/**
 * Reset / Clear all workout and profile data for a specific client
 * Usage: node --env-file=.env.local scripts/clear-client-data.mjs [client_email]
 */

import { createClient } from '@supabase/supabase-js'
import process from 'node:process'

const targetEmail = (process.argv[2] || 'athlete@example.com').toLowerCase().trim()

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function clearClientData() {
  console.log(`\n========================================`)
  console.log(`🧹 CLEARING CLIENT DATA FOR: ${targetEmail}`)
  console.log(`========================================\n`)

  // 1. Locate User
  const { data: usersData, error: userError } = await supabase.auth.admin.listUsers()
  if (userError) {
    console.error('❌ Error listing auth users:', userError)
    process.exit(1)
  }

  const authUser = usersData.users.find((u) => u.email?.toLowerCase() === targetEmail)
  if (!authUser) {
    console.error(`❌ User with email "${targetEmail}" not found in auth.users!`)
    process.exit(1)
  }

  const userId = authUser.id
  console.log(`✅ Located Auth User: ID=${userId}, Email=${authUser.email}`)

  // 2. Storage cleanup (fitness-photos)
  console.log(`\n📁 Cleaning Storage bucket: fitness-photos...`)
  try {
    const { data: photoFiles, error: listErr } = await supabase.storage
      .from('fitness-photos')
      .list(userId)

    if (listErr) {
      console.warn(`  ⚠️ Could not list storage files: ${listErr.message}`)
    } else if (photoFiles && photoFiles.length > 0) {
      const pathsToDelete = photoFiles.map((f) => `${userId}/${f.name}`)
      const { error: removeErr } = await supabase.storage
        .from('fitness-photos')
        .remove(pathsToDelete)

      if (removeErr) {
        console.error(`  ❌ Failed to remove files: ${removeErr.message}`)
      } else {
        console.log(`  ✅ Removed ${pathsToDelete.length} storage files:`, pathsToDelete)
      }
    } else {
      console.log(`  ℹ️ No files in storage bucket for user.`)
    }
  } catch (err) {
    console.error(`  ❌ Error cleaning storage:`, err.message)
  }

  // 3. Database tables to clean
  const deletionSteps = [
    { table: 'workout_set_logs', column: 'user_id', label: 'Workout Set Logs' },
    { table: 'workout_logs', column: 'user_id', label: 'Workout Logs' },
    { table: 'workout_video_events', column: 'user_id', label: 'Workout Video Events' },
    { table: 'workout_plans', column: 'user_id', label: 'Workout Plans' },
    { table: 'cardio_logs', column: 'user_id', label: 'Cardio Logs' },
    { table: 'exercise_skips', column: 'user_id', label: 'Exercise Skips' },
    { table: 'client_personal_records', column: 'user_id', label: 'Client Personal Records' },
    { table: 'client_goals', column: 'user_id', label: 'Client Goals' },
    { table: 'nasm_assessments', column: 'client_id', label: 'NASM Assessments' },
    { table: 'athlete_wearable_metrics', column: 'client_id', label: 'Athlete Wearable Metrics' },
    { table: 'body_composition_analyses', column: 'user_id', label: 'Body Composition Analyses' },
    { table: 'weekly_checkins', column: 'user_id', label: 'Weekly Check-ins' },
    { table: 'progress_photos', column: 'user_id', label: 'Progress Photo Records' },
    { table: 'push_tokens', column: 'user_id', label: 'Push Tokens' },
    { table: 'coach_client_messages', column: 'client_id', label: 'Coach Messages (as client)' },
    { table: 'coach_client_messages', column: 'sender_id', label: 'Coach Messages (as sender)' },
    { table: 'sessions', column: 'client_id', label: 'Booked Sessions' },
    { table: 'comp_session_grants', column: 'client_id', label: 'Comp Session Grants' },
    { table: 'discount_code_redemptions', column: 'client_id', label: 'Discount Code Redemptions' },
    { table: 'client_packages', column: 'client_id', label: 'Client Packages' },
    { table: 'client_lifecycle_audit_logs', column: 'client_id', label: 'Lifecycle Audit Logs' },
    { table: 'client_intake_forms', column: 'user_id', label: 'Client Intake Form (PAR-Q / Consent)' },
    { table: 'fitness_profiles', column: 'user_id', label: 'Fitness Profile (Onboarding / Measurements)' },
    { table: 'marketing_email_queue', column: 'email', value: targetEmail, label: 'Marketing Email Queue' },
    { table: 'coaching_applications', column: 'email', value: targetEmail, label: 'Coaching Applications' },
  ]

  console.log(`\n🗄️ Deleting client table records...`)
  for (const step of deletionSteps) {
    const val = step.value !== undefined ? step.value : userId
    try {
      // First count existing
      const { count: beforeCount } = await supabase
        .from(step.table)
        .select('*', { count: 'exact', head: true })
        .eq(step.column, val)

      if (beforeCount && beforeCount > 0) {
        const { error: delErr } = await supabase
          .from(step.table)
          .delete()
          .eq(step.column, val)

        if (delErr) {
          console.error(`  ❌ Error deleting from ${step.table} (${step.label}): ${delErr.message}`)
        } else {
          console.log(`  ✅ Deleted ${beforeCount} record(s) from ${step.table} (${step.label})`)
        }
      } else {
        console.log(`  ℹ️ 0 records in ${step.table} (${step.label})`)
      }
    } catch (e) {
      console.error(`  ❌ Exception deleting from ${step.table}:`, e.message)
    }
  }

  // 4. Reset client profile metadata in clients table
  console.log(`\n👤 Resetting clients table record to clean state...`)
  const { data: updatedClient, error: clientUpdateErr } = await supabase
    .from('clients')
    .update({
      avatar_path: null,
      status: 'active',
      status_reason: null,
      status_updated_at: new Date().toISOString(),
      status_updated_by: null,
    })
    .eq('id', userId)
    .select()
    .single()

  if (clientUpdateErr) {
    console.error(`❌ Failed to reset clients record:`, clientUpdateErr.message)
  } else {
    console.log(`✅ Clients record reset successfully:`, updatedClient)
  }

  console.log(`\n🎉 DONE! Client ${targetEmail} is now completely fresh and ready for new onboarding and workouts.\n`)
}

clearClientData().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
