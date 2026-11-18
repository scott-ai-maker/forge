import type { ForgeMembership } from '@/lib/forge-memberships'
import type { ForgeAddon, ForgeAddonFeature } from '@/lib/forge-addons'

export interface AddonEntitlementRow {
  id: string
  addon_id?: string | null
  feature: ForgeAddonFeature
  uses_total: number | null
  uses_remaining: number | null
  expires_at: string
}

export type VerifiedForgeTierId = 'core_lab' | 'plus' | 'coach_support'

export function inferForgeTierFromPackageName(
  packageName?: string | null,
  sessionsRemaining?: number | null
): VerifiedForgeTierId {
  const normalized = String(packageName ?? '').trim().toLowerCase()
  if (
    normalized.includes('coach support') ||
    normalized.includes('transformation direct') ||
    normalized.includes('1:1') ||
    normalized.includes('concierge') ||
    (typeof sessionsRemaining === 'number' && sessionsRemaining > 0)
  ) {
    return 'coach_support'
  }
  if (
    normalized.includes('plus') ||
    normalized.includes('pro athlete') ||
    normalized.includes('hybrid')
  ) {
    return 'plus'
  }
  return 'core_lab'
}

export interface FeatureAccess {
  active: boolean
  expiresAt: string | null
  usesRemaining: number | null
}

export function buildEntitlementGrant(addon: ForgeAddon, clientId: string, stripePaymentId: string, now = new Date()) {
  if (!addon.unlocks || !addon.accessDays) return null
  return {
    client_id: clientId,
    addon_id: addon.id,
    feature: addon.unlocks,
    uses_total: addon.uses ?? null,
    uses_remaining: addon.uses ?? null,
    stripe_payment_id: stripePaymentId,
    granted_at: now.toISOString(),
    expires_at: new Date(now.getTime() + addon.accessDays * 86_400_000).toISOString(),
  }
}

const MEMBERSHIP_GRACE_DAYS = 5
const MEMBERSHIP_CYCLE_DAYS = 30

// One grant per included feature per paid invoice; access runs through the paid cycle plus a short grace window.
export function buildMembershipEntitlementGrants(
  membership: ForgeMembership,
  clientId: string,
  invoiceId: string,
  now = new Date(),
  cycleDays = MEMBERSHIP_CYCLE_DAYS
) {
  const expiresAt = new Date(now.getTime() + (cycleDays + MEMBERSHIP_GRACE_DAYS) * 86_400_000).toISOString()
  return (membership.includedFeatures ?? []).map(({ feature, uses }) => ({
    client_id: clientId,
    addon_id: membership.id,
    feature,
    uses_total: uses ? (cycleDays >= 365 ? uses * 12 : uses) : null,
    uses_remaining: uses ? (cycleDays >= 365 ? uses * 12 : uses) : null,
    stripe_payment_id: `${invoiceId}:${feature}`,
    granted_at: now.toISOString(),
    expires_at: expiresAt,
  }))
}

export function isEntitlementUsable(row: AddonEntitlementRow, now = new Date()) {
  if (new Date(row.expires_at).getTime() <= now.getTime()) return false
  return row.uses_remaining === null || row.uses_remaining > 0
}

// Combines all of a client's purchases for a feature into one access summary.
export function summarizeFeatureAccess(rows: AddonEntitlementRow[], feature: ForgeAddonFeature, now = new Date()): FeatureAccess {
  const usable = rows.filter(row => row.feature === feature && isEntitlementUsable(row, now))
  if (usable.length === 0) return { active: false, expiresAt: null, usesRemaining: null }

  const metered = usable.every(row => row.uses_remaining !== null)
  return {
    active: true,
    expiresAt: usable.map(row => row.expires_at).sort().at(-1) ?? null,
    usesRemaining: metered ? usable.reduce((sum, row) => sum + (row.uses_remaining ?? 0), 0) : null,
  }
}

export function summarizeAllFeatureAccess(rows: AddonEntitlementRow[], now = new Date()): Record<ForgeAddonFeature, FeatureAccess> {
  return {
    'video-review': summarizeFeatureAccess(rows, 'video-review', now),
    nutrition: summarizeFeatureAccess(rows, 'nutrition', now),
    travel: summarizeFeatureAccess(rows, 'travel', now),
  }
}

export async function loadClientEntitlements(clientId: string): Promise<AddonEntitlementRow[]> {
  const { supabaseAdmin } = await import('@/lib/supabase')
  const { data, error } = await supabaseAdmin()
    .from('client_addon_entitlements')
    .select('id, addon_id, feature, uses_total, uses_remaining, expires_at')
    .eq('client_id', clientId)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true })

  if (error) throw new Error(`Failed loading add-on entitlements: ${error.message}`)
  return (data ?? []) as AddonEntitlementRow[]
}

export async function resolveClientActiveTier(
  clientId: string,
  entitlementRows?: AddonEntitlementRow[]
): Promise<VerifiedForgeTierId> {
  let highest: VerifiedForgeTierId = 'core_lab'
  const rows = entitlementRows ?? (await loadClientEntitlements(clientId).catch(() => []))

  for (const row of rows) {
    const addonId = String(row.addon_id ?? '').toLowerCase()
    if (addonId === 'forge-transformation-direct' || addonId.includes('coach_support')) {
      return 'coach_support'
    }
    if (addonId === 'forge-pro-athlete' || addonId.includes('plus')) {
      highest = 'plus'
    }
  }

  try {
    const { supabaseAdmin } = await import('@/lib/supabase')
    const nowMs = Date.now()
    const { data: pkgRows } = await supabaseAdmin()
      .from('client_packages')
      .select('package_name, sessions_remaining, expires_at')
      .eq('client_id', clientId)
      .order('purchased_at', { ascending: false })

    for (const pkg of pkgRows ?? []) {
      if (pkg.expires_at && new Date(pkg.expires_at).getTime() <= nowMs) continue
      const inferred = inferForgeTierFromPackageName(pkg.package_name, pkg.sessions_remaining)
      if (inferred === 'coach_support') return 'coach_support'
      if (inferred === 'plus') highest = 'plus'
    }
  } catch {
    // Fallback to entitlement rows if client_packages query fails
  }

  return highest
}

// Consumes one use from the soonest-expiring metered entitlement. Compare-and-set avoids double-spend on concurrent requests.
export async function consumeFeatureUse(clientId: string, feature: ForgeAddonFeature): Promise<boolean> {
  const { supabaseAdmin } = await import('@/lib/supabase')
  const admin = supabaseAdmin()
  const rows = (await loadClientEntitlements(clientId)).filter(row => row.feature === feature && isEntitlementUsable(row))

  for (const row of rows) {
    if (row.uses_remaining === null) return true
    const { data } = await admin
      .from('client_addon_entitlements')
      .update({ uses_remaining: row.uses_remaining - 1 })
      .eq('id', row.id)
      .eq('uses_remaining', row.uses_remaining)
      .select('id')
    if (data && data.length > 0) return true
  }
  return false
}

export async function refundFeatureUse(clientId: string, feature: ForgeAddonFeature) {
  const { supabaseAdmin } = await import('@/lib/supabase')
  const admin = supabaseAdmin()
  const { data } = await admin
    .from('client_addon_entitlements')
    .select('id, uses_remaining, uses_total')
    .eq('client_id', clientId)
    .eq('feature', feature)
    .not('uses_remaining', 'is', null)
    .order('granted_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (data && data.uses_total !== null && (data.uses_remaining ?? 0) < data.uses_total) {
    await admin.from('client_addon_entitlements').update({ uses_remaining: (data.uses_remaining ?? 0) + 1 }).eq('id', data.id)
  }
}
