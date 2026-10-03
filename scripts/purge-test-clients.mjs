#!/usr/bin/env node

/**
 * scripts/purge-test-clients.mjs
 *
 * Safely removes test clients and stale throwaway test accounts,
 * while strictly preserving Scott, Lisa, Jen, and Connor.
 *
 * Usage:
 *   node --env-file=.env.local scripts/purge-test-clients.mjs
 */

import { createClient } from '@supabase/supabase-js'
import process from 'node:process'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PROTECTED_EMAILS = new Set([
  'scott.gordon72@outlook.com', // Master Coach Scott Gordon
  '5c077.60rd0n@gmail.com',    // Scott Gordon (Client)
  '5c077.60rd0n@proton.me',    // Scott Gordon (Proton reserve)
  'da_mona_lisa@msn.com',       // Lisa Gordon
  'rainvilj@hotmail.com',       // Jennifer Rainville
  'connor.gordon2002@gmail.com',// Connor Gordon
])

const MASTER_COACH_ID = 'c4fc28e1-ff8d-493c-a8f5-a7f852f4e536'

const DELETION_TABLES = [
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
  { table: 'client_intake_forms', column: 'user_id', label: 'Client Intake Form' },
  { table: 'fitness_profiles', column: 'user_id', label: 'Fitness Profile' },
]

async function cleanUserStorage(userId) {
  try {
    const { data: photoFiles, error: listErr } = await supabase.storage
      .from('fitness-photos')
      .list(userId)

    if (listErr) {
      console.warn(`  ⚠️ Could not list storage files for ${userId}: ${listErr.message}`)
      return
    }

    if (photoFiles && photoFiles.length > 0) {
      const pathsToDelete = photoFiles.map((f) => `${userId}/${f.name}`)
      const { error: removeErr } = await supabase.storage
        .from('fitness-photos')
        .remove(pathsToDelete)

      if (removeErr) {
        console.error(`  ❌ Failed to remove files for ${userId}: ${removeErr.message}`)
      } else {
        console.log(`  📁 Removed ${pathsToDelete.length} storage file(s) for ${userId}`)
      }
    }
  } catch (err) {
    console.error(`  ❌ Storage cleanup error for ${userId}:`, err.message)
  }
}

async function purgeUserData(userId, email) {
  if (PROTECTED_EMAILS.has(email.toLowerCase())) {
    throw new Error(`CRITICAL GUARD: Attempted to purge protected email ${email}`)
  }

  // 1. Clean storage
  await cleanUserStorage(userId)

  // 2. Clean child database records
  for (const step of DELETION_TABLES) {
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
          console.error(`  ❌ Error deleting from ${step.table}: ${delErr.message}`)
        } else {
          console.log(`  🗑️ Deleted ${count} record(s) from ${step.table}`)
        }
      }
    } catch (e) {
      console.error(`  ❌ Exception deleting from ${step.table}:`, e.message)
    }
  }

  // 3. Delete from marketing_email_queue and coaching_applications by email
  try {
    await supabase.from('marketing_email_queue').delete().eq('email', email)
    await supabase.from('coaching_applications').delete().eq('email', email)
  } catch (e) {
    // Non-blocking
  }

  // 4. Delete from clients table
  const { error: clientDelErr } = await supabase
    .from('clients')
    .delete()
    .eq('id', userId)

  if (clientDelErr) {
    console.error(`  ❌ Error deleting client record ${email}: ${clientDelErr.message}`)
  } else {
    console.log(`  ✅ Removed from clients table: ${email}`)
  }

  // 5. Delete from auth.users
  const { error: authDelErr } = await supabase.auth.admin.deleteUser(userId)
  if (authDelErr) {
    console.error(`  ❌ Error deleting auth user ${email}: ${authDelErr.message}`)
  } else {
    console.log(`  ✅ Deleted auth user: ${email} (${userId})`)
  }
}

async function main() {
  console.log('🚀 Starting Test Client Purge Pipeline\n')
  console.log('🔒 Protected Emails (Will NEVER be removed):')
  for (const email of PROTECTED_EMAILS) {
    console.log(`   - ${email}`)
  }
  console.log('')

  // 1. Fetch all clients
  const { data: allClients, error: clientsErr } = await supabase
    .from('clients')
    .select('id, email, full_name, role, designated_coach_id')

  if (clientsErr) {
    console.error('❌ Failed to fetch clients:', clientsErr)
    process.exit(1)
  }

  // Identify test clients in clients table
  const testClients = allClients.filter(
    (c) => !PROTECTED_EMAILS.has(c.email?.toLowerCase().trim())
  )

  console.log(`📋 Found ${testClients.length} test client(s) in clients table:`)
  for (const tc of testClients) {
    console.log(`   - ${tc.full_name || '(unnamed)'} | ${tc.email} | ID: ${tc.id}`)
  }
  console.log('')

  // 2. Purge each test client
  for (const tc of testClients) {
    console.log(`\n🧹 Purging test client: ${tc.email}...`)
    await purgeUserData(tc.id, tc.email)
  }

  // 3. Clean stale throwaway test accounts in auth.users
  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers()
  if (usersErr) {
    console.error('❌ Failed to list auth users:', usersErr)
  } else {
    const staleAuthUsers = usersData.users.filter(
      (u) => !PROTECTED_EMAILS.has(u.email?.toLowerCase().trim())
    )

    if (staleAuthUsers.length > 0) {
      console.log(`\n🧹 Cleaning ${staleAuthUsers.length} remaining stale test auth user(s)...`)
      for (const su of staleAuthUsers) {
        const email = su.email || su.id
        if (PROTECTED_EMAILS.has(email.toLowerCase())) continue
        const { error: delErr } = await supabase.auth.admin.deleteUser(su.id)
        if (delErr) {
          console.error(`  ❌ Failed to delete auth user ${email}: ${delErr.message}`)
        } else {
          console.log(`  ✅ Deleted stale auth user: ${email}`)
        }
      }
    }
  }

  // 4. Update Connor Gordon profile in clients table
  console.log('\n👤 Updating Connor Gordon client record...')
  const { data: connorClient, error: connorFindErr } = await supabase
    .from('clients')
    .select('id, email, full_name, designated_coach_id')
    .eq('email', 'connor.gordon2002@gmail.com')
    .single()

  if (connorFindErr || !connorClient) {
    console.warn('⚠️ Connor Gordon record not found in clients table:', connorFindErr?.message)
  } else {
    const { data: updatedConnor, error: connorUpdateErr } = await supabase
      .from('clients')
      .update({
        full_name: 'Connor Gordon',
        designated_coach_id: MASTER_COACH_ID,
      })
      .eq('id', connorClient.id)
      .select()
      .single()

    if (connorUpdateErr) {
      console.error('❌ Failed to update Connor Gordon:', connorUpdateErr.message)
    } else {
      console.log('✅ Connor Gordon updated successfully:')
      console.log(`   Name: ${updatedConnor.full_name}`)
      console.log(`   Email: ${updatedConnor.email}`)
      console.log(`   Coach: ${updatedConnor.designated_coach_id}`)
    }
  }

  // 5. Final verification & summary
  console.log('\n========================================')
  console.log('📊 FINAL ACTIVE CLIENT ROSTER IN DATABASE')
  console.log('========================================')

  const { data: finalClients, error: finalErr } = await supabase
    .from('clients')
    .select('id, email, full_name, role, designated_coach_id, status')
    .order('role', { ascending: false })

  if (finalErr) {
    console.error('❌ Error fetching final roster:', finalErr.message)
  } else {
    for (const c of finalClients) {
      const roleIcon = c.role === 'coach' ? '🏋️ Coach' : '👤 Client'
      const coachInfo = c.designated_coach_id ? ` → Coach: ${c.designated_coach_id}` : ''
      console.log(`  ${roleIcon} | ${c.full_name} | ${c.email}${coachInfo}`)
    }
  }

  const { data: finalAuth } = await supabase.auth.admin.listUsers()
  console.log(`\nTotal remaining auth users: ${finalAuth?.users?.length || 0}`)
  for (const u of finalAuth?.users || []) {
    console.log(`  🔑 ${u.email} (${u.id})`)
  }

  console.log('\n🎉 Done! All test clients removed, real clients fully preserved.')
}

main().catch((err) => {
  console.error('Fatal execution error:', err)
  process.exit(1)
})

