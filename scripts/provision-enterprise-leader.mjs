#!/usr/bin/env node
/**
 * scripts/provision-enterprise-leader.mjs
 *
 * Provisions or updates a HIPAA-isolated Forge Athletic Executive Leadership account
 * in Supabase Auth + `clients` table (keeps `role = 'client'` so non-clinical executives
 * access `/enterprise` zero-PII dashboards & AI board without clinical PHI exposure).
 *
 * Usage:
 *   node --env-file=.env.local scripts/provision-enterprise-leader.mjs \
 *     --email lisa.gordon1@outlook.com \
 *     --name "Lisa Gordon" \
 *     --title "VP of Customer Success & Enterprise Accounts"
 */

import crypto from 'node:crypto'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

function parseArg(flag, fallback = '') {
  const idx = process.argv.indexOf(flag)
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return String(process.argv[idx + 1]).trim()
  }
  return fallback
}

const email = parseArg('--email').toLowerCase()
const fullName = parseArg('--name', 'Forge Athletic Executive')
const title = parseArg('--title', 'Executive Leadership')

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('❌ Please provide a valid --email address.')
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function findUserByEmail(targetEmail) {
  let page = 1
  const perPage = 200
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(`Failed to list auth users: ${error.message}`)
    const match = (data?.users ?? []).find(u => u.email?.toLowerCase() === targetEmail)
    if (match) return match
    if (!data?.users || data.users.length < perPage) break
    page += 1
  }
  return null
}

async function main() {
  const existing = await findUserByEmail(email)
  let userId = ''
  let createdNew = false

  if (existing) {
    userId = existing.id
    const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
      email_confirm: true,
      app_metadata: {
        ...(existing.app_metadata || {}),
        enterprise_leader: true,
        enterprise_title: title,
      },
      user_metadata: {
        ...(existing.user_metadata || {}),
        full_name: fullName,
        display_name: fullName,
        surface_role: 'client',
      },
    })
    if (updateErr) throw new Error(`Failed to update auth user: ${updateErr.message}`)
  } else {
    createdNew = true
    const tempPassword = `Fg!${crypto.randomBytes(18).toString('base64url')}9A`
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      app_metadata: {
        enterprise_leader: true,
        enterprise_title: title,
        must_reset_password: true,
      },
      user_metadata: {
        full_name: fullName,
        display_name: fullName,
        surface_role: 'client',
        must_reset_password: true,
      },
    })
    if (createErr || !created?.user) {
      throw new Error(`Failed to create auth user: ${createErr?.message || 'unknown error'}`)
    }
    userId = created.user.id
  }

  // Upsert HIPAA-isolated `clients` row (role remains 'client', never clinical 'coach')
  const { error: clientErr } = await admin
    .from('clients')
    .upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        role: 'client',
        status: 'active',
        ...(createdNew ? { must_reset_password: true } : {}),
      },
      { onConflict: 'id' }
    )

  if (clientErr) {
    throw new Error(`Failed to upsert clients row: ${clientErr.message}`)
  }

  const productionOrigin =
    process.env.EMAIL_LINK_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://forge-athletic.app'

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: `${productionOrigin.replace(/\/$/, '')}/auth/reset-password?required=1&next=/enterprise`,
    },
  })

  if (linkErr) {
    console.warn(`⚠️ User provisioned, but recovery link generation failed: ${linkErr.message}`)
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        action: createdNew ? 'created' : 'updated',
        userId,
        email,
        fullName,
        title,
        dbRole: 'client',
        hipaaIsolated: true,
        portalLoginUrl: `${productionOrigin.replace(/\/$/, '')}/enterprise/login`,
        recoveryLinkGenerated: Boolean(linkData?.properties?.action_link),
      },
      null,
      2
    )
  )
}

main().catch(err => {
  console.error('❌ Provisioning failed:', err.message)
  process.exit(1)
})
