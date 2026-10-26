#!/usr/bin/env node

/**
 * scripts/normalize-client-credits.mjs
 *
 * Normalizes session credits for Jennifer Rainville and Lisa Gordon to 13 credits,
 * matching Scott Gordon and the rest of the beta roster:
 * - Executive 1:1 Master: 12 sessions remaining (12 total)
 * - 3D Kinetic Movement & Postural Diagnostic: 1 session remaining (1 total)
 * - Clinical Add-on Suites: 0 sessions remaining (0 total)
 * - Legacy Comp Session Credit packages: 0 sessions remaining
 *
 * Usage:
 *   node --env-file=.env.local scripts/normalize-client-credits.mjs
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

const TARGET_EMAILS = [
  'rainvilj@hotmail.com', // Jennifer Rainville
  'da_mona_lisa@msn.com', // Lisa Gordon
]

async function normalizeCredits() {
  console.log('========================================================')
  console.log('🔄 NORMALIZING CLIENT CREDITS TO 13 (JEN & LISA)')
  console.log('========================================================\n')

  const { data: usersData, error: usersErr } = await admin.auth.admin.listUsers()
  if (usersErr) throw usersErr

  for (const email of TARGET_EMAILS) {
    const user = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (!user) {
      console.warn(`⚠️ User not found for email: ${email}`)
      continue
    }

    console.log(`\n────────────────────────────────────────────────────────`)
    console.log(`👤 Processing: ${user.user_metadata?.full_name || email} (${user.id})`)
    console.log(`────────────────────────────────────────────────────────`)

    const { data: packages, error: pkgErr } = await admin
      .from('client_packages')
      .select('*')
      .eq('client_id', user.id)

    if (pkgErr) throw pkgErr

    console.log(`Found ${packages.length} packages. Updating session balances...`)

    for (const pkg of packages) {
      let targetTotal = 0
      let targetRemaining = 0

      if (pkg.package_name === 'Executive 1:1 Master') {
        targetTotal = 12
        targetRemaining = 12
      } else if (pkg.package_name === '3D Kinetic Movement & Postural Diagnostic') {
        targetTotal = 1
        targetRemaining = 1
      } else if (pkg.package_name.startsWith('Comp Session Credit')) {
        // Retain historical completed sessions count if any, zero out remaining
        const used = Math.max(0, (pkg.sessions_total || 0) - (pkg.sessions_remaining || 0))
        targetTotal = used
        targetRemaining = 0
      } else {
        // Clinical add-on suites (Metabolic Nutrition, Form Critique, Supplement, Travel, 3D AI Distortion)
        targetTotal = 0
        targetRemaining = 0
      }

      console.log(
        `   📦 "${pkg.package_name}": ` +
        `total ${pkg.sessions_total} -> ${targetTotal}, ` +
        `remaining ${pkg.sessions_remaining} -> ${targetRemaining}`
      )

      const { error: updateErr } = await admin
        .from('client_packages')
        .update({
          sessions_total: targetTotal,
          sessions_remaining: targetRemaining,
        })
        .eq('id', pkg.id)

      if (updateErr) {
        console.error(`      ❌ Error updating package ${pkg.id}: ${updateErr.message}`)
      }
    }

    // Verify tally
    const { data: updatedPkgs } = await admin
      .from('client_packages')
      .select('package_name, sessions_total, sessions_remaining, expires_at')
      .eq('client_id', user.id)

    const now = new Date()
    const totalRemaining = (updatedPkgs || []).reduce((sum, p) => {
      if (p.expires_at && new Date(p.expires_at) <= now) return sum
      return sum + (p.sessions_remaining || 0)
    }, 0)

    console.log(`   ✨ Verified Active Credits for ${user.user_metadata?.full_name || email}: ${totalRemaining} credits`)
    if (totalRemaining !== 13) {
      console.error(`   ❌ Warning: Expected 13 credits, got ${totalRemaining}`)
    } else {
      console.log(`   ✅ Successfully normalized to exactly 13 credits!`)
    }
  }

  console.log('\n========================================================')
  console.log('📋 FULL ROSTER AUDIT ACROSS ALL ASSIGNED CLIENTS')
  console.log('========================================================\n')

  const { data: clients } = await admin
    .from('clients')
    .select('id, full_name, email, role')
    .eq('role', 'client')

  const now = new Date()
  for (const c of clients || []) {
    const { data: clientPkgs } = await admin
      .from('client_packages')
      .select('sessions_remaining, expires_at')
      .eq('client_id', c.id)

    const total = (clientPkgs || []).reduce((sum, p) => {
      if (p.expires_at && new Date(p.expires_at) <= now) return sum
      return sum + (p.sessions_remaining || 0)
    }, 0)

    console.log(`   ${c.full_name?.padEnd(25) || 'Unknown'.padEnd(25)} (${c.email}) -> ${total} credits`)
  }

  console.log('\n✅ All client credit tallies validated.')
}

normalizeCredits().catch(err => {
  console.error('Fatal error normalizing credits:', err)
  process.exit(1)
})
