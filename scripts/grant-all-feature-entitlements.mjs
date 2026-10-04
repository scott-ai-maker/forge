#!/usr/bin/env node

/**
 * Grants unlimited, long-lived access to every add-on gated feature
 * (nutrition, video-review, travel) for the VIP test clients.
 * Safe to re-run: grants are keyed by a stable stripe_payment_id.
 *
 * Usage:
 * node --env-file=.env.local scripts/grant-all-feature-entitlements.mjs
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

const EMAILS = ['da_mona_lisa@msn.com', 'rainvilj@hotmail.com', '5c077.60rd0n@gmail.com']
const FEATURES = ['nutrition', 'video-review', 'travel']
const ACCESS_YEARS = 10

const { data: clients, error: lookupError } = await admin
  .from('clients')
  .select('id, email')
  .in('email', EMAILS)

if (lookupError) {
  console.error(`❌ Client lookup failed: ${lookupError.message}`)
  process.exit(1)
}

const found = new Set((clients ?? []).map(c => c.email.toLowerCase()))
for (const email of EMAILS) {
  if (!found.has(email)) console.warn(`⚠️ No client found for ${email}`)
}

const now = new Date()
const expiresAt = new Date(now)
expiresAt.setFullYear(expiresAt.getFullYear() + ACCESS_YEARS)

const rows = (clients ?? []).flatMap(client =>
  FEATURES.map(feature => ({
    client_id: client.id,
    addon_id: 'vip-all-access',
    feature,
    uses_total: null,
    uses_remaining: null,
    stripe_payment_id: `vip-all-access:${client.id}:${feature}`,
    granted_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  }))
)

const { error } = await admin
  .from('client_addon_entitlements')
  .upsert(rows, { onConflict: 'stripe_payment_id' })

if (error) {
  console.error(`❌ Grant failed: ${error.message}`)
  process.exit(1)
}

console.log(`✅ Granted ${FEATURES.join(', ')} to ${found.size} client(s), expiring ${expiresAt.toISOString().slice(0, 10)}`)
