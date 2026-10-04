import type { ForgeMembership } from '@/lib/forge-memberships'
import type { ForgeAddon, ForgeAddonFeature } from '@/lib/forge-addons'

export interface AddonEntitlementRow {
  id: string
  feature: ForgeAddonFeature
  uses_total: number | null
  uses_remaining: number | null
  expires_at: string
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
export function buildMembershipEntitlementGrants(membership: ForgeMembership, clientId: string, invoiceId: string, now = new Date()) {
  const expiresAt = new Date(now.getTime() + (MEMBERSHIP_CYCLE_DAYS + MEMBERSHIP_GRACE_DAYS) * 86_400_000).toISOString()
  return (membership.includedFeatures ?? []).map(({ feature, uses }) => ({
    client_id: clientId,
    addon_id: membership.id,
    feature,
    uses_total: uses ?? null,
    uses_remaining: uses ?? null,
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
    .select('id, feature, uses_total, uses_remaining, expires_at')
    .eq('client_id', clientId)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true })

  if (error) throw new Error(`Failed loading add-on entitlements: ${error.message}`)
  return (data ?? []) as AddonEntitlementRow[]
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
