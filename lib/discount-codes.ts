export type DiscountType = 'percent' | 'fixed_amount'

export interface DiscountCodeRecord {
  id: string
  code: string
  description: string | null
  discount_type: DiscountType
  discount_value: number
  is_active: boolean
  max_redemptions: number | null
  redemptions_count: number
  starts_at: string
  expires_at: string | null
  applies_to_package_ids: string[] | null
  restricted_client_id: string | null
}

const SAFE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const BUILT_IN_PROMO_CODES: Readonly<Record<string, DiscountCodeRecord>> = {
  HOLIDAY25: {
    id: 'builtin-holiday25',
    code: 'HOLIDAY25',
    description: '25% Lifetime Rate Lock on any tier + Free 60-Min Pre-Holiday Movement Screen',
    discount_type: 'percent',
    discount_value: 25,
    is_active: true,
    max_redemptions: null,
    redemptions_count: 0,
    starts_at: '2026-11-01T00:00:00-05:00',
    expires_at: '2026-12-31T23:59:59-05:00',
    applies_to_package_ids: null,
    restricted_client_id: null,
  },
}

export function getBuiltInPromoCode(raw: string | null | undefined): DiscountCodeRecord | null {
  const normalized = normalizeDiscountCode(raw)
  if (!normalized) return null
  return BUILT_IN_PROMO_CODES[normalized] ?? null
}

export function normalizeDiscountCode(raw: string | null | undefined) {
  if (!raw) return ''
  return raw.trim().toUpperCase()
}

export function generateDiscountCode(prefix = 'SGF', randomLength = 6) {
  let randomPart = ''
  for (let i = 0; i < randomLength; i += 1) {
    const idx = Math.floor(Math.random() * SAFE_CODE_CHARS.length)
    randomPart += SAFE_CODE_CHARS[idx]
  }
  return `${prefix}-${randomPart}`
}

export function isDiscountCodeActive(code: DiscountCodeRecord, now = new Date()) {
  if (!code.is_active) return false

  const startsAt = new Date(code.starts_at)
  if (!Number.isNaN(startsAt.getTime()) && startsAt.getTime() > now.getTime()) {
    return false
  }

  if (code.expires_at) {
    const expiresAt = new Date(code.expires_at)
    if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < now.getTime()) {
      return false
    }
  }

  if (code.max_redemptions !== null && code.redemptions_count >= code.max_redemptions) {
    return false
  }

  return true
}

export function isDiscountCodeEligibleForPackage(code: DiscountCodeRecord, packageId: string) {
  if (!code.applies_to_package_ids || code.applies_to_package_ids.length === 0) {
    return true
  }
  return code.applies_to_package_ids.includes(packageId)
}

export function calculateDiscountAmountCents(priceCents: number, discountType: DiscountType, discountValue: number) {
  if (priceCents <= 0 || discountValue <= 0) return 0

  if (discountType === 'percent') {
    const pct = Math.min(Math.max(discountValue, 1), 100)
    return Math.floor((priceCents * pct) / 100)
  }

  return Math.min(discountValue, priceCents)
}
