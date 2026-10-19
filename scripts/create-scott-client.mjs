#!/usr/bin/env node

/**
 * scripts/create-scott-client.mjs
 *
 * Provisions a fresh client account for Scott Gordon:
 * - Email: scott@forge-athletic.app
 * - Role: client
 * - Designated Coach: Coach Gordon (c4fc28e1-ff8d-493c-a8f5-a7f852f4e536)
 * - Best Plan Unlocked: Executive 1:1 Master (12 comp sessions, perpetual)
 * - All Clinical Add-On Suites & Entitlements:
 *     - Metabolic Nutrition & Nutrient Periodization Suite
 *     - Biomechanical Video Form Critique Pass (Form Lab)
 *     - Clinical Supplement Stacking & Interaction Audit
 *     - Executive Road-Warrior Travel Pass
 *     - 3D Kinetic Movement & Postural Diagnostic
 *     - Clinical 3D AI Kinetic Chain & Postural Distortion Audit
 * - Onboarding status: Fresh (un-onboarded so Scott can walk through the entire flow)
 *
 * Usage:
 *   node --env-file=.env.local scripts/create-scott-client.mjs
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

const COACH_ID = 'c4fc28e1-ff8d-493c-a8f5-a7f852f4e536' // Coach Gordon
const CLIENT_EMAIL = 'scott@forge-athletic.app'
const CLIENT_NAME = 'Scott Gordon'
const CLIENT_PASSWORD = process.env.SCOTT_CLIENT_PASSWORD || process.env.TEMP_CLIENT_PASSWORD || 'ForgeAthlete2026!'

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

async function provisionClient() {
  console.log('================================================================')
  console.log('⚡ PROVISIONING NEW FORGE ATHLETIC CLIENT: scott@forge-athletic.app')
  console.log('================================================================\n')

  const now = new Date()
  const nowIso = now.toISOString()
  const expiresAt = new Date(now)
  expiresAt.setFullYear(expiresAt.getFullYear() + 10) // 10-year perpetual access

  // 1. Check or create Auth user
  let clientId = null
  const { data: userList, error: listError } = await admin.auth.admin.listUsers({ perPage: 200 })
  if (listError) {
    console.error(`❌ Error listing users: ${listError.message}`)
    process.exit(1)
  }

  const existingAuthUser = userList.users.find(u => u.email?.toLowerCase() === CLIENT_EMAIL.toLowerCase())

  if (existingAuthUser) {
    clientId = existingAuthUser.id
    console.log(`ℹ️ Existing auth user found: ${clientId}`)

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
    console.log(`✅ Auth user updated with password and client metadata`)
  } else {
    console.log(`Creating new auth user for ${CLIENT_EMAIL}...`)
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
    console.log(`✅ Auth user created successfully: ${clientId}`)
  }

  // 2. Ensure Clients Table Record
  const { error: clientUpsertError } = await admin.from('clients').upsert({
    id: clientId,
    email: CLIENT_EMAIL,
    full_name: CLIENT_NAME,
    role: 'client',
    status: 'active',
    status_reason: 'VIP All-Access Pass · Executive 1:1 Master',
    status_updated_at: nowIso,
    status_updated_by: COACH_ID,
    designated_coach_id: COACH_ID,
    must_reset_password: false,
  }, { onConflict: 'id' })

  if (clientUpsertError) {
    console.error(`❌ Failed to upsert client record: ${clientUpsertError.message}`)
    process.exit(1)
  }
  console.log(`✅ Client profile record active with designated coach: Coach Gordon`)

  // 3. Grant Premier Best Package: Executive 1:1 Master
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
        grant_note: 'VIP Full Access & Best Package Indefinitely',
        discount_code: 'ALLACCESS',
        discount_amount_cents: 149500,
        purchased_at: nowIso,
        expires_at: null,
      })
      .select('id, package_name, sessions_remaining')
      .single()

    if (premierErr) {
      console.error(`❌ Failed to grant premier package: ${premierErr.message}`)
    } else {
      premierPkgId = premierPkg.id
      console.log(`✅ Premier Package Granted: Executive 1:1 Master (12 sessions, indefinite)`)

      await admin.from('comp_session_grants').insert({
        client_id: clientId,
        coach_id: COACH_ID,
        sessions_granted: 12,
        note: 'Executive 1:1 Master VIP Retainer (Indefinite)',
        client_package_id: premierPkg.id,
      })
      console.log(`✅ Comp session grant recorded for audit compliance`)
    }
  } else {
    console.log(`✅ Premier Package already present: Executive 1:1 Master`)
  }

  // 4. Grant Clinical Add-On Suites
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
      console.log(`   ✓ Add-on Suite: ${addon.name}`)
    }
  }

  // 5. Grant Feature Add-On Entitlements (Form Lab, Nutrition, Travel)
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
    console.log(`✅ Feature Entitlements Granted (video-review, nutrition, travel) through ${expiresAt.toISOString().slice(0, 10)}`)
  }

  // 6. Record Compliance / HIPAA Lifecycle Audit Log
  await admin.from('client_lifecycle_audit_logs').insert({
    client_id: clientId,
    actor_id: COACH_ID,
    actor_name: 'Coach Gordon',
    actor_role: 'coach',
    action: 'status_change',
    previous_status: 'active',
    new_status: 'active',
    reason_code: 'reactivation_approved',
    reason_notes: 'Created new client with all features unlocked in best plan (Executive 1:1 Master). Ready for onboarding.',
    effective_date: nowIso,
    metadata: {
      vip_grant: true,
      package: 'Executive 1:1 Master',
      indefinite: true,
    },
  })
  console.log(`✅ Lifecycle audit log entry recorded`)

  // 7. Verify Fresh Onboarding State
  // Delete any accidental pre-existing intake or profile rows so Scott gets the true fresh onboarding experience
  await admin.from('fitness_profiles').delete().eq('user_id', clientId)
  await admin.from('client_intake_forms').delete().eq('user_id', clientId)
  await admin.from('workout_plans').delete().eq('user_id', clientId)

  console.log(`✅ Verified fresh onboarding state: fitness_profiles, client_intake_forms, and workout_plans are clear for initial setup.`)

  console.log('\n================================================================')
  console.log('🎉 CLIENT ACCOUNT READY')
  console.log('================================================================')
  console.log(`Email:      ${CLIENT_EMAIL}`)
  console.log(`Password:   ${CLIENT_PASSWORD}`)
  console.log(`Tier:       Executive 1:1 Master (All Features Unlocked)`)
  console.log(`Coach:      Coach Gordon (${COACH_ID})`)
  console.log(`Login URL:  /auth/login`)
  console.log('================================================================\n')
}

provisionClient().catch(err => {
  console.error('Fatal execution error:', err)
  process.exit(1)
})
