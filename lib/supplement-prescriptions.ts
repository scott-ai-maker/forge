/**
 * Forge Athletic — Goal-Based Thorne Partner Storefront Catalog
 *
 * Personalized supplement dosing, chrono-dosing timelines, and automated drug–nutrient
 * interaction / co-prescription engines are intentionally disabled.
 *
 * Athletes are presented solely with optional, general training-goal collections featuring
 * NSF Certified for Sport® Thorne formulations, proximate FTC 16 CFR § 255.5 affiliate disclosures,
 * FDA DSHEA disclaimers, Massachusetts M.G.L. c. 112 § 206 safe-harbor notices, and a mandatory
 * physician/pharmacist consultation banner whenever intake records list medications, conditions,
 * or PAR-Q+ flags.
 */

export type SupplementGoal =
  | 'hypertrophy'
  | 'fat_loss'
  | 'longevity_vitality'
  | 'athletic_power'
  | 'general_health'

export type ClientSex = 'male' | 'female' | 'other'

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced_athlete'

export interface PrescriptionMedicationsList {
  takingAnticoagulants?: boolean
  takingAntihypertensives?: boolean
  takingThyroidHormone?: boolean
  takingStatins?: boolean
  takingAntidepressants?: boolean
  takingDiabetesMedications?: boolean
  takingOralAntibiotics?: boolean
  takingImmunosuppressantsOrSteroids?: boolean
}

export interface MedicalHealthConditions extends PrescriptionMedicationsList {
  hasHypertension?: boolean
  hasKidneyCondition?: boolean
  takingBloodThinners?: boolean
  isPregnantOrNursing?: boolean
  hasCaffeineSensitivity?: boolean
}

export const VALID_SUPPLEMENT_GOALS: readonly SupplementGoal[] = [
  'hypertrophy',
  'fat_loss',
  'longevity_vitality',
  'athletic_power',
  'general_health',
]

export const VALID_CLIENT_SEXES: readonly ClientSex[] = ['male', 'female', 'other']

export const VALID_FITNESS_LEVELS: readonly FitnessLevel[] = [
  'beginner',
  'intermediate',
  'advanced_athlete',
]

export function normalizeSupplementGoal(raw?: unknown): SupplementGoal {
  if (typeof raw !== 'string' || !raw.trim()) return 'hypertrophy'
  const val = raw.trim().toLowerCase()
  if ((VALID_SUPPLEMENT_GOALS as readonly string[]).includes(val)) {
    return val as SupplementGoal
  }
  if (val.includes('fat') || val.includes('weight_loss') || val.includes('weight loss') || val.includes('cut') || val.includes('lean')) {
    return 'fat_loss'
  }
  if (val.includes('power') || val.includes('speed') || val.includes('explosive')) {
    return 'athletic_power'
  }
  if (val.includes('longevity') || val.includes('vitality') || val.includes('masters') || val.includes('posture') || val.includes('joint')) {
    return 'longevity_vitality'
  }
  if (val.includes('health') || val.includes('wellness') || val.includes('maintenance')) {
    return 'general_health'
  }
  return 'hypertrophy'
}

export function normalizeClientSex(raw?: unknown): ClientSex {
  if (typeof raw !== 'string') return 'male'
  const val = raw.trim().toLowerCase()
  if (val === 'female' || val === 'f') return 'female'
  if (val === 'other' || val === 'nonbinary' || val === 'non-binary') return 'other'
  return 'male'
}

export function normalizeFitnessLevel(raw?: unknown): FitnessLevel {
  if (typeof raw !== 'string') return 'intermediate'
  const val = raw.trim().toLowerCase()
  if (val === 'beginner' || val === 'novice' || val === 'foundational') return 'beginner'
  if (val === 'advanced_athlete' || val === 'advanced' || val === 'elite') return 'advanced_athlete'
  return 'intermediate'
}

export const DEFAULT_THORNE_DISPENSARY_URL = 'https://www.thorne.com/u/forgeathletic'
export const DEFAULT_THORNE_AFFILIATE_ID = 'PR2650699'

const rawThorneUrl =
  process.env.NEXT_PUBLIC_THORNE_DISPENSARY_URL?.trim() || DEFAULT_THORNE_DISPENSARY_URL

const rawThorneAffiliateId =
  process.env.NEXT_PUBLIC_THORNE_AFFILIATE_ID?.trim() || DEFAULT_THORNE_AFFILIATE_ID

export const isThorneAccountLinked = Boolean(
  rawThorneUrl &&
    rawThorneUrl.trim().length > 0 &&
    !rawThorneUrl.includes('gordonathletic') &&
    rawThorneUrl.startsWith('http')
)

export const isDispensaryAndSupplementsEnabled =
  process.env.NEXT_PUBLIC_DISPENSARY_ENABLED !== 'false'

export const FTC_PROXIMATE_AFFILIATE_DISCLOSURE =
  'Optional Partner Benefit (FTC 16 CFR § 255.5): Ordering through our Thorne storefront is 100% voluntary and applies an automatic 15% Forge Athletic member courtesy discount. Forge Athletic earns a partner commission on qualifying purchases at no extra cost to you. You may purchase equivalent third-party tested products from any retailer.'

export const FDA_DSHEA_DISCLAIMER =
  'FDA DSHEA Disclaimer: Statements regarding dietary supplements have not been evaluated by the U.S. Food and Drug Administration and are not intended to diagnose, treat, cure, or prevent any disease.'

export const MA_SAFE_HARBOR_SCOPE_NOTICE =
  'Non-Medical Scope Notice (M.G.L. c. 112, § 206): Forge Athletic provides general athletic conditioning and educational storefront links—not medical advice, pharmacy counseling, or Medical Nutrition Therapy (MNT). Serving sizes, allergen details, and ingredient warnings are governed strictly by Thorne’s official Supplement Facts label.'

export const WADA_NSF_SPORT_NOTICE =
  'Drug-Tested Athletes: All listed Thorne options carry NSF Certified for Sport® batch testing; NCAA, WADA, USADA, and military athletes remain responsible for verifying current lot certifications prior to use.'

export const DISPENSARY_PARTNER_CONFIG = {
  partnerName: 'Forge Athletic × Thorne Partner Storefront',
  platform: 'Thorne Partner Storefront',
  discountPercentage: 15,
  isEnabled: isDispensaryAndSupplementsEnabled,
  approvalProgressPercent: 100,
  approvalEstimatedDaysRemaining: 0,
  approvalStatusBanner:
    'Thorne Partner Storefront — Optional 15% Forge Athletic Member Discount',
  defaultThorneUrl: isThorneAccountLinked ? rawThorneUrl : 'https://www.thorne.com',
  isThorneLinked: isThorneAccountLinked,
  thorneStatusLabel: isThorneAccountLinked
    ? 'Optional Thorne Partner Storefront (15% Member Courtesy Discount)'
    : 'Browse Thorne Catalog',
  standards: [
    'NSF Certified for Sport® Third-Party Batch Testing',
    'Direct Manufacturer Fulfillment & Official Supplement Facts Labeling',
    'Stimulant-Free Curated Collections — Zero Personalized Dosing Prescriptions',
  ],
  affiliateDisclosure: FTC_PROXIMATE_AFFILIATE_DISCLOSURE,
}

export function getDispensaryPartnerInfo() {
  return DISPENSARY_PARTNER_CONFIG
}

export const THORNE_SKU_PRODUCT_PATHS: Record<string, string> = {
  SP608: '/products/dp/super-epa',
  D138: '/products/dp/d-5-000-vitamin-d-capsule',
  M204: '/products/dp/magnesium-bisglycinate',
  SP110: '/products/dp/whey-protein-isolate-chocolate',
  SF903: '/products/dp/creatine',
  SF911P: '/products/dp/daily-electrolytes-30-stick-variety-pack',
  SP686: '/products/dp/collagen-fit',
  SF907: '/products/dp/beta-alanine-sr',
}

export function buildDispensaryItemUrl(
  dispensarySku?: string,
  _brand?: string,
  productPath?: string
): string {
  if (isThorneAccountLinked) {
    const resolvedPath =
      productPath || (dispensarySku ? THORNE_SKU_PRODUCT_PATHS[dispensarySku] : undefined)
    if (resolvedPath) {
      const normalizedPath = resolvedPath.startsWith('/') ? resolvedPath : `/${resolvedPath}`
      return `https://www.thorne.com${normalizedPath}?affid=${encodeURIComponent(rawThorneAffiliateId)}`
    }
    if (!dispensarySku) return DISPENSARY_PARTNER_CONFIG.defaultThorneUrl
    const separator = DISPENSARY_PARTNER_CONFIG.defaultThorneUrl.includes('?') ? '&' : '?'
    return `${DISPENSARY_PARTNER_CONFIG.defaultThorneUrl}${separator}sku=${encodeURIComponent(dispensarySku)}`
  }
  return 'https://www.thorne.com/products'
}

export interface ThorneCatalogProduct {
  id: string
  sku: string
  name: string
  category: string
  certificationBadge: 'NSF Certified for Sport®'
  overview: string
  labelGuidance: string
  retailPriceEstimate: string
  memberDiscountPrice: string
  productUrl: string
}

export interface ThorneGoalCollection {
  goal: SupplementGoal
  title: string
  subtitle: string
  storefrontUrl: string
  products: ThorneCatalogProduct[]
}

const THORNE_PRODUCTS: Record<string, ThorneCatalogProduct> = {
  creatine: {
    id: 'creatine',
    sku: 'SF903',
    name: 'Thorne Creatine',
    category: 'Strength & Cellular Energy',
    certificationBadge: 'NSF Certified for Sport®',
    overview: 'Micronized creatine monohydrate supporting general resistance-training work capacity and lean mass.',
    labelGuidance: 'Follow Thorne Supplement Facts label & your physician’s direction.',
    retailPriceEstimate: '$44.00',
    memberDiscountPrice: '$37.40',
    productUrl: buildDispensaryItemUrl('SF903', 'Thorne', THORNE_SKU_PRODUCT_PATHS.SF903),
  },
  whey_isolate: {
    id: 'whey_isolate',
    sku: 'SP110',
    name: 'Thorne Whey Protein Isolate',
    category: 'Dietary Protein Support',
    certificationBadge: 'NSF Certified for Sport®',
    overview: 'Convenient supplemental protein option to help meet daily dietary protein targets alongside whole foods.',
    labelGuidance: 'Follow Thorne Supplement Facts label & your physician’s direction.',
    retailPriceEstimate: '$65.00',
    memberDiscountPrice: '$55.25',
    productUrl: buildDispensaryItemUrl('SP110', 'Thorne', THORNE_SKU_PRODUCT_PATHS.SP110),
  },
  magnesium_bisglycinate: {
    id: 'magnesium_bisglycinate',
    sku: 'M204',
    name: 'Thorne Magnesium Bisglycinate',
    category: 'Evening Relaxation & Recovery',
    certificationBadge: 'NSF Certified for Sport®',
    overview: 'Well-absorbed chelated magnesium powder supporting normal muscle function and evening wind-down routines.',
    labelGuidance: 'Follow Thorne Supplement Facts label & your physician’s direction.',
    retailPriceEstimate: '$52.00',
    memberDiscountPrice: '$44.20',
    productUrl: buildDispensaryItemUrl('M204', 'Thorne', THORNE_SKU_PRODUCT_PATHS.M204),
  },
  daily_electrolytes: {
    id: 'daily_electrolytes',
    sku: 'SF911P',
    name: 'Thorne Daily Electrolytes',
    category: 'Sweat & Hydration Replenishment',
    certificationBadge: 'NSF Certified for Sport®',
    overview: 'Zero-sugar, stimulant-free electrolyte stick packs designed to replenish fluid and minerals lost in sweat.',
    labelGuidance: 'Follow Thorne Supplement Facts label & your physician’s direction.',
    retailPriceEstimate: '$40.00',
    memberDiscountPrice: '$34.00',
    productUrl: buildDispensaryItemUrl('SF911P', 'Thorne', THORNE_SKU_PRODUCT_PATHS.SF911P),
  },
  super_epa: {
    id: 'super_epa',
    sku: 'SP608',
    name: 'Thorne Super EPA',
    category: 'Essential Fatty Acids',
    certificationBadge: 'NSF Certified for Sport®',
    overview: 'Molecularly distilled EPA/DHA fish oil supporting general cardiovascular and joint wellness alongside whole-food fish intake.',
    labelGuidance: 'Follow Thorne Supplement Facts label & your physician’s direction.',
    retailPriceEstimate: '$45.00',
    memberDiscountPrice: '$38.25',
    productUrl: buildDispensaryItemUrl('SP608', 'Thorne', THORNE_SKU_PRODUCT_PATHS.SP608),
  },
  collagen_fit: {
    id: 'collagen_fit',
    sku: 'SP686',
    name: 'Thorne Collagen Fit',
    category: 'Connective Tissue & Mobility',
    certificationBadge: 'NSF Certified for Sport®',
    overview: 'Unflavored grass-fed collagen peptides formulated to support tendons, ligaments, and joint mobility.',
    labelGuidance: 'Follow Thorne Supplement Facts label & your physician’s direction.',
    retailPriceEstimate: '$56.00',
    memberDiscountPrice: '$47.60',
    productUrl: buildDispensaryItemUrl('SP686', 'Thorne', THORNE_SKU_PRODUCT_PATHS.SP686),
  },
  beta_alanine: {
    id: 'beta_alanine',
    sku: 'SF907',
    name: 'Thorne Beta-Alanine-SR',
    category: 'High-Output Conditioning',
    certificationBadge: 'NSF Certified for Sport®',
    overview: 'Sustained-release, stimulant-free beta-alanine supporting high-intensity conditioning intervals.',
    labelGuidance: 'Follow Thorne Supplement Facts label & your physician’s direction.',
    retailPriceEstimate: '$46.00',
    memberDiscountPrice: '$39.10',
    productUrl: buildDispensaryItemUrl('SF907', 'Thorne', THORNE_SKU_PRODUCT_PATHS.SF907),
  },
  vitamin_d: {
    id: 'vitamin_d',
    sku: 'D138',
    name: 'Thorne Vitamin D-5000',
    category: 'Foundational Micronutrient',
    certificationBadge: 'NSF Certified for Sport®',
    overview: 'Standalone Vitamin D3 option (without added Vitamin K) for general bone and immune support when verified with lab work.',
    labelGuidance: 'Follow Thorne Supplement Facts label & your physician’s direction.',
    retailPriceEstimate: '$20.00',
    memberDiscountPrice: '$17.00',
    productUrl: buildDispensaryItemUrl('D138', 'Thorne', THORNE_SKU_PRODUCT_PATHS.D138),
  },
}

export const THORNE_GOAL_COLLECTIONS: Record<SupplementGoal, ThorneGoalCollection> = {
  hypertrophy: {
    goal: 'hypertrophy',
    title: 'Strength & Lean Muscle Collection',
    subtitle: 'Stimulant-free NSF Certified for Sport® staples commonly paired with progressive resistance training.',
    storefrontUrl: DISPENSARY_PARTNER_CONFIG.defaultThorneUrl,
    products: [
      THORNE_PRODUCTS.creatine,
      THORNE_PRODUCTS.whey_isolate,
      THORNE_PRODUCTS.magnesium_bisglycinate,
    ],
  },
  fat_loss: {
    goal: 'fat_loss',
    title: 'Lean Composition & Satiety Collection',
    subtitle: 'Whole-food-adjacent protein, hydration, and essential fatty acid options for body-recomposition phases.',
    storefrontUrl: DISPENSARY_PARTNER_CONFIG.defaultThorneUrl,
    products: [
      THORNE_PRODUCTS.whey_isolate,
      THORNE_PRODUCTS.daily_electrolytes,
      THORNE_PRODUCTS.super_epa,
    ],
  },
  athletic_power: {
    goal: 'athletic_power',
    title: 'Power, Conditioning & Hydration Collection',
    subtitle: 'Stimulant-free NSF Certified for Sport® options supporting output, repeatability, and sweat replenishment.',
    storefrontUrl: DISPENSARY_PARTNER_CONFIG.defaultThorneUrl,
    products: [
      THORNE_PRODUCTS.creatine,
      THORNE_PRODUCTS.daily_electrolytes,
      THORNE_PRODUCTS.beta_alanine,
    ],
  },
  longevity_vitality: {
    goal: 'longevity_vitality',
    title: 'Joint Comfort & Active Longevity Collection',
    subtitle: 'Connective-tissue, essential fatty acid, and evening recovery staples for lifelong movement quality.',
    storefrontUrl: DISPENSARY_PARTNER_CONFIG.defaultThorneUrl,
    products: [
      THORNE_PRODUCTS.collagen_fit,
      THORNE_PRODUCTS.super_epa,
      THORNE_PRODUCTS.magnesium_bisglycinate,
    ],
  },
  general_health: {
    goal: 'general_health',
    title: 'Foundational Daily Wellness Collection',
    subtitle: 'Simple everyday NSF Certified for Sport® basics to complement a nutrient-dense whole-food diet.',
    storefrontUrl: DISPENSARY_PARTNER_CONFIG.defaultThorneUrl,
    products: [
      THORNE_PRODUCTS.vitamin_d,
      THORNE_PRODUCTS.super_epa,
      THORNE_PRODUCTS.magnesium_bisglycinate,
    ],
  },
}

export interface SupplementIntakeScreeningInput {
  parq_any_yes?: boolean | null
  parq_answers?: unknown
  medications?: string | null
  medical_conditions?: string | null
  allergies?: string | null
}

const ANTICOAGULANT_OR_BLEEDING_PATTERN =
  /\b(warfarin|coumadin|eliquis|apixaban|xarelto|rivaroxaban|pradaxa|dabigatran|plavix|clopidogrel|heparin|lovenox|enoxaparin|brilinta|ticagrelor|anticoagulant|blood\s*thinner|bleeding\s*disorder|hemophilia)\b/i

const RENAL_IMPAIRMENT_PATTERN =
  /\b(ckd|chronic\s*kidney|renal\s*failure|renal\s*insufficiency|dialysis|kidney\s*disease|nephropathy|single\s*kidney)\b/i

const PREGNANCY_OR_LACTATION_PATTERN =
  /\b(pregnant|pregnancy|prenatal|trimester|breastfeeding|nursing|lactating|postpartum\s*nursing)\b/i

const DAIRY_WHEY_ALLERGY_PATTERN =
  /\b(dairy\s*allergy|milk\s*allergy|whey\s*allergy|casein\s*allergy|anaphylaxis.*milk|anaphylaxis.*dairy)\b/i

export function filterContraindicatedThorneProducts(
  products: ThorneGoalCollection['products'],
  intake?: SupplementIntakeScreeningInput | null
): ThorneGoalCollection['products'] {
  if (!intake) return products
  const combined = [
    intake.medications ?? '',
    intake.medical_conditions ?? '',
    intake.allergies ?? '',
    typeof intake.parq_answers === 'object' && intake.parq_answers && !Array.isArray(intake.parq_answers)
      ? String((intake.parq_answers as Record<string, unknown>).reportedConditionsNotes ?? '')
      : '',
  ]
    .join(' ')
    .trim()

  if (!combined) return products

  if (PREGNANCY_OR_LACTATION_PATTERN.test(combined)) {
    return []
  }

  const excludedSkus = new Set<string>()
  if (ANTICOAGULANT_OR_BLEEDING_PATTERN.test(combined)) {
    excludedSkus.add(THORNE_PRODUCTS.super_epa.sku)
  }
  if (RENAL_IMPAIRMENT_PATTERN.test(combined)) {
    excludedSkus.add(THORNE_PRODUCTS.creatine.sku)
    excludedSkus.add(THORNE_PRODUCTS.whey_isolate.sku)
    excludedSkus.add(THORNE_PRODUCTS.magnesium_bisglycinate.sku)
  }
  if (DAIRY_WHEY_ALLERGY_PATTERN.test(combined)) {
    excludedSkus.add(THORNE_PRODUCTS.whey_isolate.sku)
  }

  if (excludedSkus.size === 0) return products
  return products.filter(p => !excludedSkus.has(p.sku))
}

export function getThorneGoalCollection(
  rawGoal?: unknown,
  intake?: SupplementIntakeScreeningInput | null
): ThorneGoalCollection {
  const goal = normalizeSupplementGoal(rawGoal)
  const base = THORNE_GOAL_COLLECTIONS[goal]
  if (!intake) return base
  return {
    ...base,
    products: filterContraindicatedThorneProducts(base.products, intake),
  }
}

export interface IntakePhysicianConsultAlert {
  requiresPhysicianConsultNotice: boolean
  reasons: string[]
  headline: string
  message: string
}

function hasMeaningfulIntakeText(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const cleaned = value.trim().toLowerCase()
  if (!cleaned) return false
  return !['none', 'n/a', 'na', 'no', 'nil', 'nothing', '-'].includes(cleaned)
}

export function evaluateIntakePhysicianConsultFlag(intake?: {
  parq_any_yes?: boolean | null
  parq_answers?: unknown
  medications?: string | null
  medical_conditions?: string | null
  allergies?: string | null
} | null): IntakePhysicianConsultAlert {
  const reasons: string[] = []

  const anyParqAnswerYes =
    intake?.parq_answers && typeof intake.parq_answers === 'object' && !Array.isArray(intake.parq_answers)
      ? Object.values(intake.parq_answers as Record<string, unknown>).some(v => v === true)
      : false

  if (intake?.parq_any_yes === true || anyParqAnswerYes) {
    reasons.push('PAR-Q+ medical screening flag')
  }
  if (hasMeaningfulIntakeText(intake?.medications)) {
    reasons.push('reported medications')
  }
  if (hasMeaningfulIntakeText(intake?.medical_conditions)) {
    reasons.push('reported medical conditions')
  }
  if (hasMeaningfulIntakeText(intake?.allergies)) {
    reasons.push('reported allergies')
  }

  const requiresPhysicianConsultNotice = reasons.length > 0

  return {
    requiresPhysicianConsultNotice,
    reasons,
    headline: requiresPhysicianConsultNotice
      ? 'Physician or Pharmacist Review Required Before Purchasing'
      : 'Consult Your Healthcare Provider Before Adding Any Supplement',
    message: requiresPhysicianConsultNotice
      ? `Your intake record includes ${reasons.join(', ')}. Forge Athletic does not perform drug–supplement interaction screening or provide medical advice—please review every Thorne Supplement Facts label directly with your prescribing physician or licensed pharmacist before ordering.`
      : 'Forge Athletic does not prescribe supplements or calculate individualized dosages. Review any product’s Supplement Facts label with your healthcare provider before use, especially if your health or medication status changes.',
  }
}
