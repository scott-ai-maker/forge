import type { SupabaseClient } from '@supabase/supabase-js'
import { notifyUser } from '@/lib/notifications'

export interface ReferralProgram {
  id: string
  slug: string
  name: string
  headline: string
  refereeDiscountCents: number
  refereeTrialDays: number
  referrerRewardCents: number
  isActive: boolean
}

export interface ReferralCodeRecord {
  id: string
  clientId: string
  code: string
  customSlug: string | null
  clicks: number
  signupsCount: number
  conversionsCount: number
  totalRewardsEarnedCents: number
  createdAt: string
  updatedAt: string
}

export interface ReferralAttributionRecord {
  id: string
  referrerId: string
  referralCodeId: string
  refereeId: string | null
  refereeEmail: string | null
  status: 'pending' | 'signed_up' | 'converted' | 'rewarded' | 'flagged'
  source: string
  convertedAt: string | null
  rewardGrantedAt: string | null
  createdAt: string
}

export interface ReferralRewardRecord {
  id: string
  clientId: string
  attributionId: string | null
  rewardType: 'subscription_credit' | 'free_month' | 'form_lab_review' | 'merch_pack' | 'annual_pass'
  amountCents: number
  description: string
  status: 'available' | 'redeemed' | 'expired'
  redeemedAt: string | null
  createdAt: string
}

export interface MilestoneTier {
  level: number
  name: string
  requiredConversions: number
  rewardSummary: string
  rewardDetail: string
  badgeIcon: 'flame' | 'shield' | 'trophy' | 'crown'
  unlocked: boolean
}

export interface ReferralDashboardData {
  code: string
  shareUrl: string
  clicks: number
  signupsCount: number
  conversionsCount: number
  totalRewardsEarnedCents: number
  availableBalanceCents: number
  refereeDiscountCents: number
  refereeTrialDays: number
  milestones: {
    currentTier: MilestoneTier
    nextTier: MilestoneTier | null
    progressToNext: number // 0 to 100 percentage
    allTiers: MilestoneTier[]
  }
  history: Array<{
    id: string
    refereeEmailMasked: string
    status: 'pending' | 'signed_up' | 'converted' | 'rewarded' | 'flagged'
    date: string
  }>
  rewards: Array<{
    id: string
    rewardType: string
    description: string
    amountCents: number
    status: 'available' | 'redeemed' | 'expired'
    createdAt: string
  }>
}

const SAFE_ALPHANUM = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

export const REFERRAL_MILESTONES: ReadonlyArray<Omit<MilestoneTier, 'unlocked'>> = [
  {
    level: 1,
    name: 'Recruit',
    requiredConversions: 1,
    rewardSummary: '$20 Membership Credit',
    rewardDetail: '1 free month of Forge Core or $20 account credit towards any tier.',
    badgeIcon: 'flame',
  },
  {
    level: 2,
    name: 'Lead Athlete',
    requiredConversions: 3,
    rewardSummary: 'Free Form Lab Video Critique',
    rewardDetail: 'Complimentary private biomechanical video audit from Coach Gordon ($49 value).',
    badgeIcon: 'shield',
  },
  {
    level: 3,
    name: 'Sovereign Elite',
    requiredConversions: 5,
    rewardSummary: 'Performance Pack + 3 Months Free',
    rewardDetail: 'Official Forge Athletic apparel pack + 3 full months of membership ($60+ value).',
    badgeIcon: 'trophy',
  },
  {
    level: 4,
    name: 'Founding Ambassador',
    requiredConversions: 10,
    rewardSummary: '1 Year Sovereign Master Access',
    rewardDetail: '365 days of full Forge Athletic membership and permanent Ambassador status.',
    badgeIcon: 'crown',
  },
]

export function normalizeReferralCode(code: string | null | undefined): string {
  if (!code) return ''
  return code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '')
}

export function generateRandomAlphanumeric(length = 4): string {
  let result = ''
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * SAFE_ALPHANUM.length)
    result += SAFE_ALPHANUM[idx]
  }
  return result
}

export function generateReferralCode(clientName?: string | null): string {
  const firstName = (clientName || '').trim().split(/\s+/)[0] || 'FORGE'
  const cleanName = firstName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)

  const prefix = cleanName.length >= 2 ? cleanName : 'FORGE'
  const suffix = generateRandomAlphanumeric(4)
  return `${prefix}-${suffix}`
}

export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return 'Athlete'
  const [local, domain] = email.split('@')
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`
  }
  return `${local.slice(0, 2)}***@${domain}`
}

export function calculateMilestoneProgress(conversionsCount: number) {
  const allTiers: MilestoneTier[] = REFERRAL_MILESTONES.map(tier => ({
    ...tier,
    unlocked: conversionsCount >= tier.requiredConversions,
  }))

  const unlockedTiers = allTiers.filter(t => t.unlocked)
  const currentTier = unlockedTiers.length > 0 ? unlockedTiers[unlockedTiers.length - 1] : {
    level: 0,
    name: 'Athlete',
    requiredConversions: 0,
    rewardSummary: 'Start inviting',
    rewardDetail: 'Invite your first workout partner to unlock $20 credit.',
    badgeIcon: 'flame' as const,
    unlocked: true,
  }

  const nextTier = allTiers.find(t => !t.unlocked) || null

  let progressToNext = 100
  if (nextTier) {
    const prevRequired = currentTier.level === 0 ? 0 : currentTier.requiredConversions
    const range = nextTier.requiredConversions - prevRequired
    const completedInRange = conversionsCount - prevRequired
    progressToNext = Math.min(100, Math.max(0, Math.round((completedInRange / range) * 100)))
  }

  return {
    currentTier,
    nextTier,
    progressToNext,
    allTiers,
  }
}

/**
 * Retrieves or generates the user's personal unique referral code.
 */
export async function getOrCreateClientReferralCode(
  admin: SupabaseClient,
  clientId: string,
  clientName?: string | null
): Promise<ReferralCodeRecord> {
  const { data: existing, error: selectError } = await admin
    .from('referral_codes')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle()

  if (selectError) {
    console.error('[referrals:getOrCreate] Select error:', selectError)
  }

  if (existing) {
    return {
      id: existing.id,
      clientId: existing.client_id,
      code: existing.code,
      customSlug: existing.custom_slug,
      clicks: existing.clicks || 0,
      signupsCount: existing.signups_count || 0,
      conversionsCount: existing.conversions_count || 0,
      totalRewardsEarnedCents: existing.total_rewards_earned_cents || 0,
      createdAt: existing.created_at,
      updatedAt: existing.updated_at,
    }
  }

  let codeCandidate = generateReferralCode(clientName)
  let attempts = 0
  while (attempts < 5) {
    const { data: inserted, error: insertError } = await admin
      .from('referral_codes')
      .insert({
        client_id: clientId,
        code: codeCandidate,
      })
      .select('*')
      .single()

    if (!insertError && inserted) {
      return {
        id: inserted.id,
        clientId: inserted.client_id,
        code: inserted.code,
        customSlug: inserted.custom_slug,
        clicks: inserted.clicks || 0,
        signupsCount: inserted.signups_count || 0,
        conversionsCount: inserted.conversions_count || 0,
        totalRewardsEarnedCents: inserted.total_rewards_earned_cents || 0,
        createdAt: inserted.created_at,
        updatedAt: inserted.updated_at,
      }
    }

    // If duplicate code collision, regenerate with extra entropy
    codeCandidate = generateReferralCode(clientName) + generateRandomAlphanumeric(2)
    attempts += 1
  }

  throw new Error('Failed to generate unique referral code after multiple attempts')
}

/**
 * Validates a referral code and retrieves the public offer & referrer info.
 */
export async function validateReferralCode(
  admin: SupabaseClient,
  rawCode: string
): Promise<{
  valid: boolean
  code?: string
  referrerId?: string
  referrerName?: string
  refereeDiscountCents: number
  refereeTrialDays: number
  error?: string
}> {
  const normalized = normalizeReferralCode(rawCode)
  if (!normalized) {
    return {
      valid: false,
      refereeDiscountCents: 2000,
      refereeTrialDays: 30,
      error: 'Referral code is empty',
    }
  }

  const { data: codeRow, error: codeError } = await admin
    .from('referral_codes')
    .select('id, client_id, code, custom_slug')
    .or(`code.eq.${normalized},custom_slug.eq.${normalized.toLowerCase()}`)
    .maybeSingle()

  if (codeError || !codeRow) {
    return {
      valid: false,
      refereeDiscountCents: 2000,
      refereeTrialDays: 30,
      error: 'Invalid or expired referral code',
    }
  }

  // Load referrer's public name
  const { data: clientRow } = await admin
    .from('clients')
    .select('full_name, email')
    .eq('id', codeRow.client_id)
    .maybeSingle()

  const referrerName =
    clientRow?.full_name?.trim() ||
    (clientRow?.email ? clientRow.email.split('@')[0] : 'A Forge Athlete')

  return {
    valid: true,
    code: codeRow.code,
    referrerId: codeRow.client_id,
    referrerName,
    refereeDiscountCents: 2000,
    refereeTrialDays: 30,
  }
}

/**
 * Tracks link clicks asynchronously.
 */
export async function recordReferralClick(
  admin: SupabaseClient,
  rawCode: string
): Promise<void> {
  const normalized = normalizeReferralCode(rawCode)
  if (!normalized) return

  try {
    await admin.rpc('increment_referral_code_clicks', { p_code: normalized })
  } catch (err) {
    console.warn('[referrals:recordClick] Click increment error:', err)
  }
}

/**
 * Attributes a new user registration to a referral code.
 */
export async function attributeReferralSignup(
  admin: SupabaseClient,
  params: {
    code: string
    refereeId: string
    refereeEmail: string
    source?: string
    ipHash?: string
    userAgent?: string
  }
): Promise<{ success: boolean; error?: string }> {
  const { valid, referrerId, code } = await validateReferralCode(admin, params.code)
  if (!valid || !referrerId || !code) {
    return { success: false, error: 'Invalid referral code' }
  }

  // Anti-fraud: cannot refer yourself
  if (referrerId === params.refereeId) {
    return { success: false, error: 'Self-referral is not permitted' }
  }

  // Check if referee was already attributed
  const { data: existing } = await admin
    .from('referral_attributions')
    .select('id')
    .eq('referee_id', params.refereeId)
    .maybeSingle()

  if (existing) {
    return { success: true }
  }

  // Get referral code id
  const { data: codeRow } = await admin
    .from('referral_codes')
    .select('id')
    .eq('code', code)
    .single()

  if (!codeRow) {
    return { success: false, error: 'Referral code not found' }
  }

  const { error: insertError } = await admin.from('referral_attributions').insert({
    referrer_id: referrerId,
    referral_code_id: codeRow.id,
    referee_id: params.refereeId,
    referee_email: params.refereeEmail.toLowerCase().trim(),
    status: 'signed_up',
    source: params.source || 'link',
    ip_hash: params.ipHash || null,
    user_agent: params.userAgent || null,
  })

  if (insertError) {
    console.error('[referrals:attributeSignup] Insert error:', insertError)
    return { success: false, error: insertError.message }
  }

  // Increment signups count on referral_codes
  await admin
    .from('referral_codes')
    .update({ signups_count: (await admin.from('referral_codes').select('signups_count').eq('id', codeRow.id).single()).data?.signups_count + 1 })
    .eq('id', codeRow.id)

  // Notify referrer of new signup
  try {
    await notifyUser({
      userId: referrerId,
      type: 'weekly_checkin_nudge', // Or new referral type
      title: '🎉 New Workout Partner Joined!',
      body: 'Your friend just accepted your VIP pass to Forge Athletic. When they begin their training plan, you unlock your reward!',
      dedupeKey: `ref-signup:${params.refereeId}`,
      url: '/dashboard?openReferrals=true',
    })
  } catch (notifyErr) {
    console.warn('[referrals:attributeSignup] Notification warn:', notifyErr)
  }

  return { success: true }
}

/**
 * Processes conversion when a referred user starts a paid subscription or purchase.
 */
export async function processReferralConversion(
  admin: SupabaseClient,
  params: {
    refereeId: string
    stripeSubscriptionId?: string
    stripePaymentId?: string
    amountPaidCents?: number
  }
): Promise<{
  converted: boolean
  referrerId?: string
  rewardGranted?: boolean
}> {
  // Find attribution row for referee
  const { data: attribution, error: attrError } = await admin
    .from('referral_attributions')
    .select('id, referrer_id, referral_code_id, status, referee_email')
    .eq('referee_id', params.refereeId)
    .maybeSingle()

  if (attrError || !attribution) {
    return { converted: false }
  }

  if (attribution.status === 'rewarded' || attribution.status === 'converted') {
    return { converted: true, referrerId: attribution.referrer_id, rewardGranted: false }
  }

  const referrerId = attribution.referrer_id
  const now = new Date().toISOString()

  // Mark attribution as converted & rewarded
  await admin
    .from('referral_attributions')
    .update({
      status: 'rewarded',
      converted_at: now,
      reward_granted_at: now,
      stripe_subscription_id: params.stripeSubscriptionId || null,
      stripe_payment_id: params.stripePaymentId || null,
    })
    .eq('id', attribution.id)

  // Increment conversions_count and total_rewards_earned_cents on referral_codes
  const { data: codeData } = await admin
    .from('referral_codes')
    .select('id, conversions_count, total_rewards_earned_cents')
    .eq('id', attribution.referral_code_id)
    .single()

  const newConversionsCount = (codeData?.conversions_count || 0) + 1
  const rewardAmountCents = 2000 // $20 credit
  const newTotalRewards = (codeData?.total_rewards_earned_cents || 0) + rewardAmountCents

  await admin
    .from('referral_codes')
    .update({
      conversions_count: newConversionsCount,
      total_rewards_earned_cents: newTotalRewards,
      updated_at: now,
    })
    .eq('id', attribution.referral_code_id)

  // Insert reward record
  await admin.from('referral_rewards').insert({
    client_id: referrerId,
    attribution_id: attribution.id,
    reward_type: 'subscription_credit',
    amount_cents: rewardAmountCents,
    description: `Friend Referral Reward ($20 credit) - Partner conversion #${newConversionsCount}`,
    status: 'available',
  })

  // Check milestone unlocks
  const milestone = REFERRAL_MILESTONES.find(m => m.requiredConversions === newConversionsCount)
  if (milestone) {
    if (milestone.level === 2) {
      // Grant 1 Form Lab Video Review
      await admin.from('client_addon_entitlements').insert({
        client_id: referrerId,
        addon_id: 'milestone-form-lab',
        feature: 'video-review',
        uses_total: 1,
        uses_remaining: 1,
        stripe_payment_id: `milestone:form-lab:${referrerId}:${newConversionsCount}`,
        granted_at: now,
      })
      await admin.from('referral_rewards').insert({
        client_id: referrerId,
        attribution_id: attribution.id,
        reward_type: 'form_lab_review',
        amount_cents: 4900,
        description: 'Level 2 Milestone: Free Form Lab Video Critique by Coach Gordon',
        status: 'available',
      })
    } else if (milestone.level === 3) {
      await admin.from('referral_rewards').insert({
        client_id: referrerId,
        attribution_id: attribution.id,
        reward_type: 'merch_pack',
        amount_cents: 6000,
        description: 'Level 3 Milestone: Official Forge Athletic Performance Apparel Pack',
        status: 'available',
      })
    } else if (milestone.level === 4) {
      await admin.from('referral_rewards').insert({
        client_id: referrerId,
        attribution_id: attribution.id,
        reward_type: 'annual_pass',
        amount_cents: 14900,
        description: 'Level 4 Milestone: 1 Year Sovereign Master Access Pass',
        status: 'available',
      })
    }
  }

  // Notify referrer of reward
  try {
    const friendLabel = maskEmail(attribution.referee_email)
    const milestoneBonus = milestone ? ` Plus, you unlocked ${milestone.name}: ${milestone.rewardSummary}!` : ''
    await notifyUser({
      userId: referrerId,
      type: 'addon_unlocked',
      title: '🏆 $20 Referral Reward Earned!',
      body: `Your friend (${friendLabel}) just subscribed to Forge Athletic! You received a $20 membership credit.${milestoneBonus}`,
      dedupeKey: `ref-reward:${attribution.id}`,
      url: '/dashboard?openReferrals=true',
    })
  } catch (notifyErr) {
    console.warn('[referrals:processConversion] Notification error:', notifyErr)
  }

  return {
    converted: true,
    referrerId,
    rewardGranted: true,
  }
}

/**
 * Returns comprehensive referral data for the member dashboard.
 */
export async function getClientReferralDashboard(
  admin: SupabaseClient,
  clientId: string,
  baseUrl = 'https://forgeathletic.com'
): Promise<ReferralDashboardData> {
  const codeRecord = await getOrCreateClientReferralCode(admin, clientId)

  const [
    { data: attributions },
    { data: rewards },
  ] = await Promise.all([
    admin
      .from('referral_attributions')
      .select('id, referee_email, status, created_at')
      .eq('referrer_id', clientId)
      .order('created_at', { ascending: false })
      .limit(20),
    admin
      .from('referral_rewards')
      .select('id, reward_type, description, amount_cents, status, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false }),
  ])

  const availableBalanceCents = (rewards || [])
    .filter(r => r.status === 'available')
    .reduce((sum, r) => sum + (r.amount_cents || 0), 0)

  const conversionsCount = codeRecord.conversionsCount || 0
  const milestones = calculateMilestoneProgress(conversionsCount)

  const shareUrl = `${baseUrl.replace(/\/$/, '')}/r/${codeRecord.customSlug || codeRecord.code}`

  return {
    code: codeRecord.code,
    shareUrl,
    clicks: codeRecord.clicks || 0,
    signupsCount: codeRecord.signupsCount || 0,
    conversionsCount,
    totalRewardsEarnedCents: codeRecord.totalRewardsEarnedCents || 0,
    availableBalanceCents,
    refereeDiscountCents: 2000,
    refereeTrialDays: 30,
    milestones,
    history: (attributions || []).map(a => ({
      id: a.id,
      refereeEmailMasked: maskEmail(a.referee_email),
      status: a.status,
      date: a.created_at,
    })),
    rewards: (rewards || []).map(r => ({
      id: r.id,
      rewardType: r.reward_type,
      description: r.description,
      amountCents: r.amount_cents,
      status: r.status,
      createdAt: r.created_at,
    })),
  }
}
