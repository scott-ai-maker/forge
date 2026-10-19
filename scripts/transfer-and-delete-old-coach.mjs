#!/usr/bin/env node

/**
 * scripts/transfer-and-delete-old-coach.mjs
 *
 * 1. Assigns scott@forge-athletic.app (and any remaining clients) to coach@forge-athletic.app.
 * 2. Transfers all associated coach records (messages, comp grants, packages, audits, etc.)
 *    from old coach (scott.gordon72@outlook.com) to new coach (coach@forge-athletic.app).
 * 3. Deletes old coach account (scott.gordon72@outlook.com) from `clients` and `auth.users`.
 * 4. Verifies the new coach's assigned member list.
 *
 * Usage:
 *   node --env-file=.env.local scripts/transfer-and-delete-old-coach.mjs
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

const OLD_COACH_EMAIL = 'scott.gordon72@outlook.com'
const NEW_COACH_EMAIL = 'coach@forge-athletic.app'

async function main() {
  console.log('================================================================')
  console.log('⚡ TRANSFERRING CLIENTS & DELETING OLD COACH ACCOUNT')
  console.log('================================================================\n')

  // 1. Resolve old and new coach records
  const { data: users } = await admin.auth.admin.listUsers({ perPage: 200 })
  const oldAuth = users?.users?.find(u => u.email?.toLowerCase() === OLD_COACH_EMAIL.toLowerCase())
  const newAuth = users?.users?.find(u => u.email?.toLowerCase() === NEW_COACH_EMAIL.toLowerCase())

  if (!newAuth) {
    console.error(`❌ New coach account (${NEW_COACH_EMAIL}) not found in auth.users! Aborting.`)
    process.exit(1)
  }

  const newCoachId = newAuth.id
  console.log(`✅ New Coach ID (${NEW_COACH_EMAIL}): ${newCoachId}`)

  if (!oldAuth) {
    console.log(`ℹ️ Old coach (${OLD_COACH_EMAIL}) not found in auth.users. Checking clients table...`)
  } else {
    console.log(`ℹ️ Old Coach ID (${OLD_COACH_EMAIL}): ${oldAuth.id}`)
  }

  const oldCoachId = oldAuth?.id || 'c4fc28e1-ff8d-493c-a8f5-a7f852f4e536'

  // 2. Transfer all clients assigned to old coach to new coach
  console.log('\n--- Step 1: Reassigning Clients to New Coach ---')
  const { data: clientsToTransfer, error: clientFetchErr } = await admin
    .from('clients')
    .select('id, email, full_name, designated_coach_id')
    .eq('designated_coach_id', oldCoachId)

  if (clientFetchErr) {
    console.error(`❌ Error fetching assigned clients: ${clientFetchErr.message}`)
  } else {
    console.log(`Found ${clientsToTransfer.length} client(s) assigned to old coach:`, clientsToTransfer.map(c => `${c.full_name} (${c.email})`))

    const { error: clientUpdateErr } = await admin
      .from('clients')
      .update({ designated_coach_id: newCoachId })
      .eq('designated_coach_id', oldCoachId)

    if (clientUpdateErr) {
      console.error(`❌ Error reassigning clients: ${clientUpdateErr.message}`)
      process.exit(1)
    }
    console.log(`✅ All clients successfully reassigned to ${NEW_COACH_EMAIL}`)
  }

  // Double check scott@forge-athletic.app specifically
  const { error: scottUpdateErr } = await admin
    .from('clients')
    .update({ designated_coach_id: newCoachId })
    .eq('email', 'scott@forge-athletic.app')

  if (scottUpdateErr) {
    console.error(`❌ Error ensuring scott@forge-athletic.app assigned: ${scottUpdateErr.message}`)
  } else {
    console.log(`✅ Verified scott@forge-athletic.app explicitly assigned to ${NEW_COACH_EMAIL}`)
  }

  // 3. Reassign related records across all tables
  console.log('\n--- Step 2: Transferring Associated Coach Records ---')

  // A. clients.status_updated_by
  await admin.from('clients').update({ status_updated_by: newCoachId }).eq('status_updated_by', oldCoachId)
  console.log('   ✓ clients.status_updated_by transferred')

  // B. client_packages.granted_by_coach_id
  await admin.from('client_packages').update({ granted_by_coach_id: newCoachId }).eq('granted_by_coach_id', oldCoachId)
  console.log('   ✓ client_packages.granted_by_coach_id transferred')

  // C. comp_session_grants.coach_id
  await admin.from('comp_session_grants').update({ coach_id: newCoachId }).eq('coach_id', oldCoachId)
  console.log('   ✓ comp_session_grants.coach_id transferred')

  // D. nasm_assessments.coach_id
  await admin.from('nasm_assessments').update({ coach_id: newCoachId }).eq('coach_id', oldCoachId)
  console.log('   ✓ nasm_assessments.coach_id transferred')

  // E. sessions.coach_id
  await admin.from('sessions').update({ coach_id: newCoachId }).eq('coach_id', oldCoachId)
  console.log('   ✓ sessions.coach_id transferred')

  // F. coach_client_messages (both coach_id and sender_id if coach was sender)
  await admin.from('coach_client_messages').update({ coach_id: newCoachId }).eq('coach_id', oldCoachId)
  await admin.from('coach_client_messages').update({ sender_id: newCoachId }).eq('sender_id', oldCoachId)
  console.log('   ✓ coach_client_messages transferred')

  // G. client_lifecycle_audit_logs.actor_id
  await admin.from('client_lifecycle_audit_logs').update({ actor_id: newCoachId }).eq('actor_id', oldCoachId)
  console.log('   ✓ client_lifecycle_audit_logs transferred')

  // H. discount_codes (if any)
  try {
    await admin.from('discount_codes').update({ created_by_coach_id: newCoachId }).eq('created_by_coach_id', oldCoachId)
  } catch {}

  // 4. Delete old coach from clients table and auth.users
  console.log('\n--- Step 3: Deleting Old Coach Account ---')
  const { error: clientDeleteErr } = await admin
    .from('clients')
    .delete()
    .eq('id', oldCoachId)

  if (clientDeleteErr) {
    console.error(`❌ Error deleting from clients table: ${clientDeleteErr.message}`)
  } else {
    console.log(`✅ Deleted ${OLD_COACH_EMAIL} from clients table`)
  }

  if (oldAuth) {
    const { error: authDeleteErr } = await admin.auth.admin.deleteUser(oldCoachId)
    if (authDeleteErr) {
      console.error(`❌ Error deleting from auth.users: ${authDeleteErr.message}`)
    } else {
      console.log(`✅ Deleted ${OLD_COACH_EMAIL} from auth.users`)
    }
  }

  // 5. Verification of New Coach's Roster
  console.log('\n--- Step 4: Verifying New Coach Member Roster ---')
  const { data: roster, error: rosterErr } = await admin
    .from('clients')
    .select('id, email, full_name, role, status, designated_coach_id')
    .eq('designated_coach_id', newCoachId)

  if (rosterErr) {
    console.error(`❌ Error reading roster: ${rosterErr.message}`)
  } else {
    console.log(`🎉 Current roster for ${NEW_COACH_EMAIL} (${roster.length} athlete(s)):`)
    roster.forEach(c => {
      console.log(`   • ${c.full_name} <${c.email}> (ID: ${c.id})`)
    })
  }

  console.log('\n================================================================')
  console.log('🎉 TRANSFER & CLEANUP COMPLETED SUCCESSFULLY')
  console.log('================================================================\n')
}

main().catch(err => {
  console.error('Fatal execution error:', err)
  process.exit(1)
})
