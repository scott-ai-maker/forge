/**
 * Forge Athletic — Prescribed Corrective & Home-Gym Equipment Dispensary Engine
 *
 * Maps NASM Overhead Squat Assessment (OHSA), Static Postural Distortion Syndromes,
 * Single-Leg Squat / Push-Pull findings, 4-Phase Corrective Exercise Continuum protocols,
 * and NASM OPT™ Phases 1–5 strength progressions directly to zero-inventory, direct-fulfilled partners:
 * - Crossover Symmetry (PT / Coach Pro Program — 15% Athlete Privilege Discount)
 * - Perform Better (Functional & Corrective Equipment Partner — 10% Athlete Privilege Discount)
 * - REP Fitness (Superfiliate Home-Gym Partner — Authorized Direct LTL/Parcel Fulfillment)
 */

import type {
  NasmAssessmentRecord,
  OhsaCompensation,
} from './nasm-assessments'

export type EquipmentPartnerId = 'crossover_symmetry' | 'perform_better' | 'rep_fitness'

export type EquipmentContinuumCategory =
  | 'inhibit_smr'
  | 'lengthen_mobility'
  | 'activate_stabilize'
  | 'integrate_stabilization'
  | 'rep_home_gym'

export type EquipmentNecessityTier =
  | 'essential_corrective'
  | 'targeted_adjunct'
  | 'home_gym_foundation'

export interface EquipmentPartnerConfig {
  id: EquipmentPartnerId
  brandName: string
  programName: string
  discountPercentage: number
  perkBadgeText: string
  baseUrl: string
  promoCode?: string
  affiliateId?: string
  isPartnerAccountLinked: boolean
  statusBadgeLabel: string
  fulfillmentNote: string
}

export interface EquipmentCatalogItem {
  id: string
  sku: string
  name: string
  partnerId: EquipmentPartnerId
  partnerBrand: string
  category: EquipmentContinuumCategory
  categoryLabel: string
  nasmPhaseAlignment: string
  productPath: string
  retailPriceUsd: number
  discountPercentage: number
  clientDiscountPriceUsd: number
  retailPriceFormatted: string
  clientPriceFormatted: string
  clinicalMechanism: string
  usageProtocol: string
  targetCheckpoints: string[]
  /** Canonical equipment tokens matched against `fitness_profiles.equipment_access` */
  ownedEquipmentMatchTerms: string[]
}

export interface PrescribedEquipmentItem extends EquipmentCatalogItem {
  necessityTier: EquipmentNecessityTier
  necessityLabel: string
  prescribedReasons: string[]
  alreadyOwned: boolean
  dispensaryUrl: string
  promoCode?: string
}

export type HomeGymBuildoutTierId =
  | 'tier1_compact_studio'
  | 'tier2_cable_corrective'
  | 'tier3_full_sanctuary'

export interface HomeGymBuildoutTierSummary {
  id: HomeGymBuildoutTierId
  badge: string
  title: string
  subtitle: string
  footprintLabel: string
  optPhasesUnlocked: string
  itemIds: string[]
  items: PrescribedEquipmentItem[]
  ownedCount: number
  totalCount: number
  fullPackageTotalUsd: number
  fullPackageTotalFormatted: string
  remainingUnownedUsd: number
  remainingUnownedFormatted: string
}

export interface EquipmentPrescriptionResult {
  isEnabled: boolean
  partners: Record<EquipmentPartnerId, EquipmentPartnerConfig>
  prescribedItems: PrescribedEquipmentItem[]
  assessmentMatchedItems: PrescribedEquipmentItem[]
  homeGymFoundationItems: PrescribedEquipmentItem[]
  homeGymTiers: HomeGymBuildoutTierSummary[]
  estimatedKitRetailTotalFormatted: string
  estimatedKitMemberTotalFormatted: string
  estimatedSavingsFormatted: string
  hasActiveAssessmentMapping: boolean
  ftcAffiliateDisclosure: string
  voluntarySourcingNotice: string
}

export interface EquipmentPrescriptionInput {
  assessment?: NasmAssessmentRecord | null
  ownedEquipment?: string[] | null
  optPhase?: number | null
  goal?: string | null
}

export const DEFAULT_CROSSOVER_SYMMETRY_URL = 'https://crossoversymmetry.com'
export const DEFAULT_PERFORM_BETTER_URL = 'https://www.performbetter.com'
export const DEFAULT_REP_FITNESS_URL = 'https://repfitness.com'

const rawCrossoverUrl =
  process.env.NEXT_PUBLIC_CROSSOVER_SYMMETRY_URL?.trim() || DEFAULT_CROSSOVER_SYMMETRY_URL
const rawCrossoverCode =
  process.env.NEXT_PUBLIC_CROSSOVER_SYMMETRY_CODE?.trim() || ''

const rawPerformBetterUrl =
  process.env.NEXT_PUBLIC_PERFORM_BETTER_URL?.trim() || DEFAULT_PERFORM_BETTER_URL
const rawPerformBetterAffiliateId =
  process.env.NEXT_PUBLIC_PERFORM_BETTER_AFFILIATE_ID?.trim() || ''
const rawPerformBetterCode =
  process.env.NEXT_PUBLIC_PERFORM_BETTER_CODE?.trim() || ''

const rawRepFitnessUrl =
  process.env.NEXT_PUBLIC_REP_FITNESS_URL?.trim() || DEFAULT_REP_FITNESS_URL
const rawRepFitnessAffiliateId =
  process.env.NEXT_PUBLIC_REP_FITNESS_AFFILIATE_ID?.trim() || ''
const rawRepFitnessAffiliateParam =
  process.env.NEXT_PUBLIC_REP_FITNESS_AFFILIATE_PARAM?.trim() || 'a_aid'
const rawRepFitnessCode =
  process.env.NEXT_PUBLIC_REP_FITNESS_CODE?.trim() || ''
const rawRepFitnessDiscountPct = Math.max(
  0,
  Math.min(50, Number(process.env.NEXT_PUBLIC_REP_FITNESS_DISCOUNT_PCT || 0) || 0)
)

export const isEquipmentDispensaryEnabled =
  process.env.NEXT_PUBLIC_EQUIPMENT_DISPENSARY_ENABLED !== 'false' &&
  process.env.NEXT_PUBLIC_DISPENSARY_ENABLED !== 'false'

function isCustomPartnerLinkConfigured(url: string, defaultHostUrl: string, codeOrAffId: string): boolean {
  const normalized = url.replace(/\/+$/, '')
  const defaultNormalized = defaultHostUrl.replace(/\/+$/, '')
  if (codeOrAffId.length > 0) return true
  return normalized.startsWith('http') && normalized !== defaultNormalized
}

export function getEquipmentPartnersConfig(): Record<EquipmentPartnerId, EquipmentPartnerConfig> {
  const crossoverLinked = isCustomPartnerLinkConfigured(
    rawCrossoverUrl,
    DEFAULT_CROSSOVER_SYMMETRY_URL,
    rawCrossoverCode
  )
  const performBetterLinked = isCustomPartnerLinkConfigured(
    rawPerformBetterUrl,
    DEFAULT_PERFORM_BETTER_URL,
    rawPerformBetterAffiliateId || rawPerformBetterCode
  )
  const repFitnessLinked = isCustomPartnerLinkConfigured(
    rawRepFitnessUrl,
    DEFAULT_REP_FITNESS_URL,
    rawRepFitnessAffiliateId || rawRepFitnessCode
  )

  return {
    crossover_symmetry: {
      id: 'crossover_symmetry',
      brandName: 'Crossover Symmetry',
      programName: 'Crossover Symmetry PT / Coach Pro Network',
      discountPercentage: 15,
      perkBadgeText: '15% OFF',
      baseUrl: rawCrossoverUrl.startsWith('http') ? rawCrossoverUrl : DEFAULT_CROSSOVER_SYMMETRY_URL,
      promoCode: rawCrossoverCode || undefined,
      isPartnerAccountLinked: crossoverLinked,
      statusBadgeLabel: crossoverLinked
        ? 'Crossover Symmetry Pro Partner · 15% Athlete Privilege Active'
        : 'Crossover Symmetry Clinical Catalog · 15% Pro Partner Tier',
      fulfillmentNote: 'Direct factory fulfillment · Medical-grade sleeved resistance cords & wall/door mounts.',
    },
    perform_better: {
      id: 'perform_better',
      brandName: 'Perform Better',
      programName: 'Perform Better Functional & Clinical Pro Program',
      discountPercentage: 10,
      perkBadgeText: '10% OFF',
      baseUrl: rawPerformBetterUrl.startsWith('http') ? rawPerformBetterUrl : DEFAULT_PERFORM_BETTER_URL,
      promoCode: rawPerformBetterCode || undefined,
      affiliateId: rawPerformBetterAffiliateId || undefined,
      isPartnerAccountLinked: performBetterLinked,
      statusBadgeLabel: performBetterLinked
        ? 'Perform Better Pro Partner · 10% Athlete Privilege Active'
        : 'Perform Better Functional Catalog · 10% Pro Partner Tier',
      fulfillmentNote: 'Direct warehouse drop-shipping · Commercial SMR, mini-bands & stabilization tools.',
    },
    rep_fitness: {
      id: 'rep_fitness',
      brandName: 'REP Fitness',
      programName: 'REP Fitness Superfiliate Home-Gym Partner',
      discountPercentage: rawRepFitnessDiscountPct,
      perkBadgeText: rawRepFitnessDiscountPct > 0 ? `${rawRepFitnessDiscountPct}% OFF` : 'FREE US SHIPPING',
      baseUrl: rawRepFitnessUrl.startsWith('http') ? rawRepFitnessUrl : DEFAULT_REP_FITNESS_URL,
      promoCode: rawRepFitnessCode || undefined,
      affiliateId: rawRepFitnessAffiliateId || undefined,
      isPartnerAccountLinked: repFitnessLinked,
      statusBadgeLabel: repFitnessLinked
        ? 'REP Fitness Official Partner · Direct Home-Gym Freight Active'
        : 'REP Fitness Home-Gym Architecture · Free US Shipping',
      fulfillmentNote: 'Direct parcel & curbside LTL freight · Commercial 11-gauge racks, benches, cables & dumbbells.',
    },
  }
}

function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`
}

function computeDiscountedUsd(retailUsd: number, discountPct: number): number {
  if (discountPct <= 0) return retailUsd
  return Math.round(retailUsd * (1 - discountPct / 100) * 100) / 100
}

export function buildEquipmentDispensaryUrl(
  partnerId: EquipmentPartnerId,
  productPath: string
): string {
  const partners = getEquipmentPartnersConfig()
  const partner = partners[partnerId]
  const cleanBase = partner.baseUrl.replace(/\/+$/, '')
  const cleanPath = productPath.startsWith('/') ? productPath : `/${productPath}`

  let targetUrl = `${cleanBase}${cleanPath}`
  try {
    const parsedBase = new URL(cleanBase)
    targetUrl = `${parsedBase.origin}${cleanPath}`
    const composed = new URL(targetUrl)
    parsedBase.searchParams.forEach((val, key) => {
      composed.searchParams.set(key, val)
    })
    if (parsedBase.hash) {
      composed.hash = parsedBase.hash
    }
    targetUrl = composed.toString()
  } catch {
    targetUrl = `${cleanBase}${cleanPath}`
  }

  const urlObj = (() => {
    try {
      return new URL(targetUrl)
    } catch {
      return null
    }
  })()

  if (!urlObj) return targetUrl

  if (partnerId === 'crossover_symmetry' && partner.promoCode) {
    urlObj.searchParams.set('discount', partner.promoCode)
  }
  if (partnerId === 'perform_better') {
    if (partner.affiliateId) {
      urlObj.searchParams.set('affid', partner.affiliateId)
    }
    if (partner.promoCode) {
      urlObj.searchParams.set('code', partner.promoCode)
    }
  }
  if (partnerId === 'rep_fitness') {
    if (partner.affiliateId) {
      urlObj.searchParams.set(rawRepFitnessAffiliateParam || 'a_aid', partner.affiliateId)
    }
    if (partner.promoCode) {
      urlObj.searchParams.set('discount', partner.promoCode)
    }
  }

  return urlObj.toString()
}

interface RawCatalogSeed {
  id: string
  sku: string
  name: string
  partnerId: EquipmentPartnerId
  partnerBrand: string
  category: EquipmentContinuumCategory
  categoryLabel: string
  nasmPhaseAlignment: string
  productPath: string
  retailPriceUsd: number
  discountPercentage: number
  clinicalMechanism: string
  usageProtocol: string
  targetCheckpoints: string[]
  ownedEquipmentMatchTerms: string[]
}

const RAW_EQUIPMENT_SEEDS: RawCatalogSeed[] = [
  // ── CLINICAL CORRECTIVE & MOBILITY HARDWARE (CROSSOVER SYMMETRY & PERFORM BETTER) ──
  {
    id: 'pb_eva_foam_roller',
    sku: 'PB-SMR-36',
    name: 'First Place® High-Density EVA Foam Roller (36" × 6")',
    partnerId: 'perform_better',
    partnerBrand: 'Perform Better',
    category: 'inhibit_smr',
    categoryLabel: 'Phase 1: Inhibit (SMR)',
    nasmPhaseAlignment: 'NASM CEx Phase 1 (Inhibit) · Pre-Workout Autogenic Inhibition',
    productPath: '/First-Place-6-Round-EVA-Foam-Roller/',
    retailPriceUsd: 29.95,
    discountPercentage: 10,
    clinicalMechanism:
      'Closed-cell high-durometer EVA cylinder sustains uniform mechanical pressure over hypertonic myofascial tissue, stimulating Golgi tendon organs (GTO) to induce autogenic inhibition without core compression.',
    usageProtocol: 'Roll slowly (1 inch/sec) across overactive tissue; hold tender trigger points static for 30–60 seconds prior to static stretching.',
    targetCheckpoints: ['Foot & Ankle (Gastrocnemius/Soleus)', 'Knee (TFL / IT Band / Adductors)', 'LPHC (Piriformis / Hip Flexors)', 'Thoracic Spine & Latissimus Dorsi'],
    ownedEquipmentMatchTerms: ['foam roller', 'smr roller', 'eva roller'],
  },
  {
    id: 'pb_trigger_point_ball',
    sku: 'PB-TPB-01',
    name: 'Targeted Myofascial Trigger-Point Massage Ball',
    partnerId: 'perform_better',
    partnerBrand: 'Perform Better',
    category: 'inhibit_smr',
    categoryLabel: 'Phase 1: Inhibit (Focal SMR)',
    nasmPhaseAlignment: 'NASM CEx Phase 1 (Inhibit) · Deep Focal Trigger-Point Release',
    productPath: '/Lacrosse-Ball/',
    retailPriceUsd: 9.95,
    discountPercentage: 10,
    clinicalMechanism:
      'Small-diameter firm sphere concentrates shear and ischemic compression into narrow anatomical pockets (plantar fascia, pectoralis minor, posterior deltoid/infraspinatus, and piriformis) inaccessible to broad foam cylinders.',
    usageProtocol: 'Pin against wall or floor on focal tender spot for 30–60 seconds while maintaining slow diaphragmatic nasal breathing.',
    targetCheckpoints: ['Plantar Fascia & Posterior Tibialis', 'Pectoralis Minor & Anterior Shoulder', 'Deep Lateral Hip Rotators'],
    ownedEquipmentMatchTerms: ['massage ball', 'lacrosse ball', 'trigger point ball'],
  },
  {
    id: 'cs_shoulder_system',
    sku: 'CS-IND-SHLDR',
    name: 'Crossover Symmetry® Individual Shoulder System',
    partnerId: 'crossover_symmetry',
    partnerBrand: 'Crossover Symmetry',
    category: 'activate_stabilize',
    categoryLabel: 'Phase 3: Scapular & Rotator Cuff Activation',
    nasmPhaseAlignment: 'NASM CEx Phases 3–4 (Activate & Integrate) · Upper Crossed Protocol',
    productPath: '/products/individual-package',
    retailPriceUsd: 199.0,
    discountPercentage: 15,
    clinicalMechanism:
      'Dual eye-level & knee-level anchored medical-grade resistance cords engineered for the 7-drill scapular neuromuscular sequence (Row, Reverse Fly, Pulldown, 90/90, Scaption, Incline Plus, Victory), restoring upward rotation and glenohumeral centration.',
    usageProtocol: 'Perform Activation sequence (1 × 8–12 reps at 4/2/2 tempo) before upper-body pressing, overhead lifts, or desk-posture corrective blocks.',
    targetCheckpoints: ['Shoulders & Scapulae (Lower/Mid Trapezius, Serratus Anterior)', 'Rotator Cuff (Infraspinatus / Teres Minor)', 'Cervical & Thoracic Posture'],
    ownedEquipmentMatchTerms: ['crossover symmetry'],
  },
  {
    id: 'cs_hip_halo',
    sku: 'CS-HIP-HALO',
    name: 'Crossover Symmetry® Hip & Core System (Hip Halo™)',
    partnerId: 'crossover_symmetry',
    partnerBrand: 'Crossover Symmetry',
    category: 'activate_stabilize',
    categoryLabel: 'Phase 3: Gluteal & LPHC Activation',
    nasmPhaseAlignment: 'NASM CEx Phases 3–4 (Activate & Integrate) · Knee Valgus & LPHC Protocol',
    productPath: '/products/hip-core-system',
    retailPriceUsd: 39.95,
    discountPercentage: 15,
    clinicalMechanism:
      'Non-rolling woven elastic hip loop provides high-torque abduction tension above the patella for Reactive Neuromuscular Training (RNT), recruiting gluteus medius, gluteus maximus, and deep external rotators to eliminate dynamic knee valgus.',
    usageProtocol: 'Use for lateral tube walks, monster walks, glute bridges, and RNT goblet squats (2 × 12–15 controlled reps with 2-second isometric peak).',
    targetCheckpoints: ['Knee Alignment (Anti-Valgus RNT)', 'LPHC & Pelvis (Gluteus Medius / Maximus)'],
    ownedEquipmentMatchTerms: ['hip halo', 'hip circle', 'glute band', 'fabric band'],
  },
  {
    id: 'pb_mini_band_pack',
    sku: 'PB-MB-SET4',
    name: 'First Place® Clinical Mini-Band Set (4 Progressive Tensions)',
    partnerId: 'perform_better',
    partnerBrand: 'Perform Better',
    category: 'activate_stabilize',
    categoryLabel: 'Phase 3: Distal & Isolated Activation',
    nasmPhaseAlignment: 'NASM CEx Phase 3 (Activate) · Isolated Intramuscular Coordination',
    productPath: '/First-Place-Mini-Band/',
    retailPriceUsd: 14.95,
    discountPercentage: 10,
    clinicalMechanism:
      'Color-coded Yellow/Green/Blue/Black 9" × 2" progressive resistance loops allow low-load, high-precision isolated strengthening (4/2/2/1 tempo) of anterior/posterior tibialis, medial hamstrings, and scapular retractors without compensatory synergist dominance.',
    usageProtocol: 'Select tension permitting strict 4-second eccentric and 2-second isometric hold for 10–15 reps without joint compensation.',
    targetCheckpoints: ['Foot & Ankle (Dorsiflexion / Inversion)', 'Knee & Hip Stabilizers', 'Wrist / Forearm / Scapular Wall Slides'],
    ownedEquipmentMatchTerms: ['mini band', 'mini-band', 'loop band'],
  },
  {
    id: 'pb_superband_stretch_assist',
    sku: 'PB-SB-41',
    name: 'First Place® 41" Superband (Mobility, Stretch & Row Kit)',
    partnerId: 'perform_better',
    partnerBrand: 'Perform Better',
    category: 'lengthen_mobility',
    categoryLabel: 'Phase 2 & 4: Lengthen & Dynamic Integration',
    nasmPhaseAlignment: 'NASM CEx Phases 2 & 4 (Lengthen / Integrate) · PNF & Integrated Pulling',
    productPath: '/First-Place-Superbands/',
    retailPriceUsd: 24.95,
    discountPercentage: 10,
    clinicalMechanism:
      'Continuous 41-inch heavy-duty latex loop enables supine static/neuromuscular hamstring & calf lengthening, talocrural ankle joint mobilization, anti-rotation Pallof presses, and standing integrated rows.',
    usageProtocol: 'Use for 30-second supine static/PNF stretches (Phase 2) and standing squat-to-row or Pallof core integration drills (Phase 4).',
    targetCheckpoints: ['Hamstring & Gastrocnemius Flexibility', 'Ankle Dorsiflexion Mobilization', 'LPHC Anti-Rotation & Integrated Row'],
    ownedEquipmentMatchTerms: ['superband', 'pull-up band', 'stretch strap'],
  },
  {
    id: 'pb_airex_balance_pad',
    sku: 'PB-AIREX-BP',
    name: 'Airex® Proprioceptive Balance Pad (OPT™ Phase 1 Stabilization)',
    partnerId: 'perform_better',
    partnerBrand: 'Perform Better',
    category: 'integrate_stabilization',
    categoryLabel: 'OPT™ Phase 1: Proprioceptive Stabilization',
    nasmPhaseAlignment: 'NASM OPT™ Phase 1 (Stabilization Endurance) · Neuromuscular Control',
    productPath: '/Balance-Pad/',
    retailPriceUsd: 69.95,
    discountPercentage: 10,
    clinicalMechanism:
      'Compliant closed-cell destabilizing foam surface increases mechanoreceptor afferent feedback at the foot/ankle complex, training reflex co-contraction across the ankle, knee, and LPHC during single-leg balance reaches and split squats.',
    usageProtocol: 'Perform barefoot or in flat training shoes for single-leg balance multiplanar reaches and Phase 1 stabilization progressions.',
    targetCheckpoints: ['Intrinsic Foot & Ankle Mechanoreceptors', 'Single-Leg Knee & Pelvic Control'],
    ownedEquipmentMatchTerms: ['balance pad', 'airex', 'bosu'],
  },

  // ── REP FITNESS HOME-GYM ARCHITECTURE SUITE (PHASES 1–5) ───────────────────
  {
    id: 'rep_quickdraw_dumbbells',
    sku: 'REP-QD-DB',
    name: 'REP QuickDraw™ Adjustable Dumbbells (5–50 lb / 5–60 lb Pair)',
    partnerId: 'rep_fitness',
    partnerBrand: 'REP Fitness',
    category: 'rep_home_gym',
    categoryLabel: 'REP Home Gym · Tier 1 Starter Anchor',
    nasmPhaseAlignment: 'NASM OPT™ Phases 1–5 · Unilateral Stabilization, Hypertrophy & Power',
    productPath: '/products/quickdraw-adjustable-dumbbell-lb',
    retailPriceUsd: 495.99,
    discountPercentage: rawRepFitnessDiscountPct,
    clinicalMechanism:
      'Heavy-duty steel Lock-N-Load™ switches change weight in 2.5 lb / 5 lb micro-increments within seconds—unlocking unilateral NASM stabilization presses, tempo hypertrophy rows, Bulgarian split squats, and progressive overload in 2 sq ft of floor space.',
    usageProtocol: 'Core home-gym workhorse replacing an entire 10-pair commercial dumbbell rack with drop-tested steel durability.',
    targetCheckpoints: ['Bilateral & Unilateral Scapular/Core Symmetry', 'Micro-Loadable Progressive Overload (2.5 lb steps)'],
    ownedEquipmentMatchTerms: ['dumbbell', 'dumbbells', 'quickdraw'],
  },
  {
    id: 'rep_ab3000_fid_bench',
    sku: 'REP-AB-3000',
    name: 'REP AB-3000 2.0 FID Adjustable Weight Bench (1,000 lb Rated)',
    partnerId: 'rep_fitness',
    partnerBrand: 'REP Fitness',
    category: 'rep_home_gym',
    categoryLabel: 'REP Home Gym · Tier 1 Starter Anchor',
    nasmPhaseAlignment: 'NASM OPT™ Phases 2–4 · Multi-Angle Pressing, Prone Y/T/I & Split Squats',
    productPath: '/products/ab-3000-fid-adjustable-bench',
    retailPriceUsd: 349.99,
    discountPercentage: rawRepFitnessDiscountPct,
    clinicalMechanism:
      '8-angle ladder back pad (-12° decline to 85° upright) and 5-angle seat pad support chest-supported scapular rows (eliminating lumbar shear), 30°/45° incline presses, prone lower-trap Y-raises, and rear-foot-elevated split squats.',
    usageProtocol: 'Pair with QuickDraw™ Dumbbells as the minimum two-piece foundation for a complete Forge Athletic home studio.',
    targetCheckpoints: ['Lumbar-Sparing Chest-Supported Rows', 'Multi-Angle Pectoral & Anterior Deltoid Mechanics'],
    ownedEquipmentMatchTerms: ['adjustable bench', 'weight bench', 'fid bench', 'incline bench'],
  },
  {
    id: 'rep_adjustable_kettlebell',
    sku: 'REP-ADJ-KB',
    name: 'REP Adjustable Cast-Iron Kettlebell (20–40 lb / 16–24 kg)',
    partnerId: 'rep_fitness',
    partnerBrand: 'REP Fitness',
    category: 'rep_home_gym',
    categoryLabel: 'REP Home Gym · Loaded Integration & Conditioning',
    nasmPhaseAlignment: 'NASM CEx Phase 4 (Integrate) & OPT™ Phase 5 Ballistic Power',
    productPath: '/products/adjustable-kettlebells',
    retailPriceUsd: 159.99,
    discountPercentage: rawRepFitnessDiscountPct,
    clinicalMechanism:
      'Internal cast-iron plate mechanism consolidates 5 competition-sized kettlebells into a single matte powder-coated shell—ideal for anteriorly loaded goblet squats, single-leg RDLs, anti-lateral-flexion suitcase carries, and hip-hinge swings.',
    usageProtocol: 'Dial lighter loads for single-leg balance/RDL control and heavier settings for goblet squats, carries, and swings.',
    targetCheckpoints: ['Posterior Chain Hip Hinge Mechanics', 'Frontal-Plane Quadratus Lumborum Core Bracing'],
    ownedEquipmentMatchTerms: ['kettlebell', 'kettlebells'],
  },
  {
    id: 'rep_adonis_cable_tower',
    sku: 'REP-ADONIS',
    name: 'REP Adonis™ Compact Single-Stack Functional Cable Tower',
    partnerId: 'rep_fitness',
    partnerBrand: 'REP Fitness',
    category: 'rep_home_gym',
    categoryLabel: 'REP Home Gym · Tier 2 Functional Pulley Upgrade',
    nasmPhaseAlignment: 'NASM CEx Phase 4 (Integrate) & OPT™ Phases 1–3 Cable Vector Training',
    productPath: '/products/adonis-cable-tower',
    retailPriceUsd: 1999.99,
    discountPercentage: rawRepFitnessDiscountPct,
    clinicalMechanism:
      '3" × 3" 11-gauge steel selectorized pulley column with 33 trolley heights provides constant-tension horizontal and diagonal resistance vectors for standing squat-to-rows, face pulls, Pallof presses, and transverse-plane chops/lifts.',
    usageProtocol: 'Unlocks every commercial cable movement in Forge Athletic programming within a compact wall/corner footprint.',
    targetCheckpoints: ['Constant-Tension Scapular Retraction', 'Transverse-Plane Rotational LPHC Control'],
    ownedEquipmentMatchTerms: ['cable machine', 'cable tower', 'functional trainer', 'adonis'],
  },
  {
    id: 'rep_pr4000_power_rack',
    sku: 'REP-PR-4000',
    name: 'REP PR-4000 Modular 3" × 3" 11-Gauge Power Rack',
    partnerId: 'rep_fitness',
    partnerBrand: 'REP Fitness',
    category: 'rep_home_gym',
    categoryLabel: 'REP Home Gym · Tier 3 Full Strength Sanctuary',
    nasmPhaseAlignment: 'NASM OPT™ Phases 3–5 · Hypertrophy, Maximal Strength & Barbell Safety',
    productPath: '/products/pr-4000-power-rack-pre-selected',
    retailPriceUsd: 799.94,
    discountPercentage: rawRepFitnessDiscountPct,
    clinicalMechanism:
      'Laser-cut Westside 1" bench-zone hole spacing and 1,000 lb rackable capacity enable unspotted solo safety during heavy back/front squats, pin presses, rack pulls, and pull-ups—upgradeable later with Ares™/Athena® cable stacks.',
    usageProtocol: 'Set safety straps/pins 1 inch below bottom ROM on every solo barbell compound session.',
    targetCheckpoints: ['Solo Heavy Compound Safety', 'Full-Body Axial Strength & Pull-Up Progression'],
    ownedEquipmentMatchTerms: ['squat rack', 'power rack', 'half rack'],
  },
  {
    id: 'rep_colorado_barbell',
    sku: 'REP-COL-20KG',
    name: 'REP Colorado™ 20kg All-Purpose Composite Bushing Barbell',
    partnerId: 'rep_fitness',
    partnerBrand: 'REP Fitness',
    category: 'rep_home_gym',
    categoryLabel: 'REP Home Gym · Tier 3 Full Strength Sanctuary',
    nasmPhaseAlignment: 'NASM OPT™ Phases 2–5 · Compound Strength & Clean/Press Mechanics',
    productPath: '/products/colorado-bar-20kg',
    retailPriceUsd: 299.99,
    discountPercentage: rawRepFitnessDiscountPct,
    clinicalMechanism:
      '28.5mm 190k PSI shaft with medium volcano knurling, dual IPF/IWF markings, and smooth composite bushings protects wrist/elbow joints during dynamic transitions while maintaining secure grip on deadlifts, squats, and presses.',
    usageProtocol: 'Pair with the PR-4000 or PR-1100 Rack and bumper plates for Phases 3, 4, and 5 barbell programming.',
    targetCheckpoints: ['Wrist-Friendly Sleeve Rotation', 'Balanced Power & Olympic Grip Ergonomics'],
    ownedEquipmentMatchTerms: ['barbell', 'olympic bar', 'colorado bar'],
  },
  {
    id: 'rep_ab3100_bench',
    sku: 'REP-AB-3100',
    name: 'REP AB-3100 FI Adjustable Weight Bench (Compact 700 lb Rated)',
    partnerId: 'rep_fitness',
    partnerBrand: 'REP Fitness',
    category: 'rep_home_gym',
    categoryLabel: 'REP Home Gym · Compact Value Bench',
    nasmPhaseAlignment: 'NASM OPT™ Phases 1–4 · Flat-to-Incline Pressing & Supported Rows',
    productPath: '/products/ab-3100-adjustable-weight-bench',
    retailPriceUsd: 269.99,
    discountPercentage: rawRepFitnessDiscountPct,
    clinicalMechanism:
      '6-angle ladder back pad (0° flat to 85° upright) and 3-angle seat pad in a low-profile 17.5" IPF-height frame with rear transport wheels—ideal for compact rooms and streamlined starter budgets.',
    usageProtocol: 'Roll in and out of tight corners or racks for flat/incline dumbbell presses, chest-supported rows, and split squats.',
    targetCheckpoints: ['Compact Footprint Storage', 'Spine-Supported Multi-Angle Pressing'],
    ownedEquipmentMatchTerms: ['adjustable bench', 'weight bench', 'incline bench', 'ab-3100'],
  },
  {
    id: 'rep_pr1100_rack',
    sku: 'REP-PR-1100',
    name: 'REP PR-1100 Compact Home Power Rack (84" Height · 700 lb Rated)',
    partnerId: 'rep_fitness',
    partnerBrand: 'REP Fitness',
    category: 'rep_home_gym',
    categoryLabel: 'REP Home Gym · Low-Ceiling & Value Rack',
    nasmPhaseAlignment: 'NASM OPT™ Phases 2–5 · Safe Enclosed Barbell Training & Pull-Ups',
    productPath: '/products/pr-1100-power-rack',
    retailPriceUsd: 379.99,
    discountPercentage: rawRepFitnessDiscountPct,
    clinicalMechanism:
      '84-inch upright height clears standard 7.5-ft to 8-ft residential/basement ceilings while providing full 4-post safety chrome bars and multi-grip pull-up arch in a 48" × 47" footprint.',
    usageProtocol: 'Position safety bars 1 inch below squat/bench bottom ROM for unspotted solo home barbell sessions.',
    targetCheckpoints: ['7.5-ft Ceiling Clearance Compatibility', 'Enclosed 4-Post Solo Barbell Safety'],
    ownedEquipmentMatchTerms: ['squat rack', 'power rack', 'half rack', 'pr-1100'],
  },
  {
    id: 'rep_black_bumper_plates',
    sku: 'REP-BMP-160',
    name: 'REP Black Virgin-Rubber Bumper Plate Set (160 lb Starter: 45s/25s/10s)',
    partnerId: 'rep_fitness',
    partnerBrand: 'REP Fitness',
    category: 'rep_home_gym',
    categoryLabel: 'REP Home Gym · Acoustic Floor-Safe Loading',
    nasmPhaseAlignment: 'NASM OPT™ Phases 2–5 · Quiet Deadlifts, Squats & Barbell Progression',
    productPath: '/products/black-bumper-plate-pairs',
    retailPriceUsd: 389.97,
    discountPercentage: rawRepFitnessDiscountPct,
    clinicalMechanism:
      'Low-odor virgin rubber durometer with hooked stainless-steel inserts absorbs floor impact and dampens acoustic clatter (205 lb total load on a 20kg bar), protecting residential subfloors and neighbors.',
    usageProtocol: 'Essential axial load companion for the Colorado™ 20kg Barbell and PR-1100 / PR-4000 Power Racks.',
    targetCheckpoints: ['Acoustic Vibration Dampening', 'Standard 450mm Deadlift Pull Height'],
    ownedEquipmentMatchTerms: ['bumper plates', 'weight plates', 'olympic plates'],
  },
]

export const EQUIPMENT_DISPENSARY_CATALOG: EquipmentCatalogItem[] = RAW_EQUIPMENT_SEEDS.map(seed => {
  const clientDiscountPriceUsd = computeDiscountedUsd(seed.retailPriceUsd, seed.discountPercentage)
  return {
    ...seed,
    clientDiscountPriceUsd,
    retailPriceFormatted: formatUsd(seed.retailPriceUsd),
    clientPriceFormatted: formatUsd(clientDiscountPriceUsd),
  }
})

const UPPER_BODY_COMPENSATIONS = new Set<OhsaCompensation>([
  'arms_fall_forward',
  'shoulders_elevate',
  'forward_head',
])

const KNEE_LPHC_COMPENSATIONS = new Set<OhsaCompensation>([
  'knees_move_inward',
  'knees_move_outward',
  'asymmetrical_weight_shift',
  'low_back_arches',
  'low_back_rounds',
  'excessive_forward_lean',
])

const FOOT_ANKLE_COMPENSATIONS = new Set<OhsaCompensation>([
  'feet_turn_out',
  'feet_flatten',
  'heels_rise',
])

const COMPENSATION_LABELS: Record<OhsaCompensation, string> = {
  feet_turn_out: 'Feet Turn Out',
  feet_flatten: 'Feet Flatten (Pronation)',
  heels_rise: 'Heels Rise',
  knees_move_inward: 'Knees Move Inward (Valgus)',
  knees_move_outward: 'Knees Move Outward (Varus)',
  excessive_forward_lean: 'Excessive Forward Lean',
  low_back_arches: 'Low Back Arches (Anterior Pelvic Tilt)',
  low_back_rounds: 'Low Back Rounds (Posterior Pelvic Tilt)',
  asymmetrical_weight_shift: 'Asymmetrical Weight Shift',
  arms_fall_forward: 'Arms Fall Forward',
  shoulders_elevate: 'Shoulders Elevate',
  forward_head: 'Forward Head Migrates',
}

function matchesOwnedEquipment(item: EquipmentCatalogItem, ownedEquipment?: string[] | null): boolean {
  if (!ownedEquipment || ownedEquipment.length === 0) return false
  const normalizedOwned = ownedEquipment.map(eq => String(eq || '').toLowerCase().trim()).filter(Boolean)
  return item.ownedEquipmentMatchTerms.some(term =>
    normalizedOwned.some(owned => owned.includes(term))
  )
}

/**
 * Generates an athlete's personalized corrective & home-gym equipment prescription
 * synchronized with their NASM assessment findings, 4-phase corrective plan, OPT™ phase, and owned gear.
 */
export function generateEquipmentPrescription(
  input: EquipmentPrescriptionInput = {}
): EquipmentPrescriptionResult {
  const { assessment, ownedEquipment, optPhase, goal } = input
  const partners = getEquipmentPartnersConfig()
  const goalLower = (goal || '').toLowerCase()

  const ohsaComps = new Set<OhsaCompensation>(
    (assessment?.ohsa_findings ?? []).map(f => f.compensation)
  )
  const distortionSyndromes = new Set<string>(
    (assessment?.static_posture ?? [])
      .map(s => s.distortionSyndrome)
      .filter((d): d is NonNullable<typeof d> => Boolean(d && d !== 'none'))
  )

  const slsHasValgusOrPelvicDrop = (assessment?.single_leg_squat ?? []).some(
    s => s.kneeValgus || s.pelvicDrop || s.torsoLean
  )
  const pushPullHasUpperComp = (assessment?.push_pull ?? []).some(
    p => p.shouldersElevate || p.headMigratesForward || p.scapularWinging
  )

  const inhibitCount = assessment?.prescribed_correctives?.inhibit?.length ?? 0
  const lengthenCount = assessment?.prescribed_correctives?.lengthen?.length ?? 0
  const activateCount = assessment?.prescribed_correctives?.activate?.length ?? 0
  const integrateCount = assessment?.prescribed_correctives?.integrate?.length ?? 0

  const hasUpperFindings =
    Array.from(ohsaComps).some(c => UPPER_BODY_COMPENSATIONS.has(c)) ||
    distortionSyndromes.has('upper_crossed') ||
    pushPullHasUpperComp

  const hasKneeOrLphcFindings =
    Array.from(ohsaComps).some(c => KNEE_LPHC_COMPENSATIONS.has(c)) ||
    distortionSyndromes.has('lower_crossed') ||
    distortionSyndromes.has('pronation_distortion') ||
    slsHasValgusOrPelvicDrop

  const hasFootAnkleFindings =
    Array.from(ohsaComps).some(c => FOOT_ANKLE_COMPENSATIONS.has(c)) ||
    distortionSyndromes.has('pronation_distortion')

  const hasAnyAssessment = Boolean(
    assessment &&
      (ohsaComps.size > 0 ||
        distortionSyndromes.size > 0 ||
        slsHasValgusOrPelvicDrop ||
        pushPullHasUpperComp ||
        inhibitCount + lengthenCount + activateCount + integrateCount > 0)
  )

  const prescribedItems: PrescribedEquipmentItem[] = EQUIPMENT_DISPENSARY_CATALOG.map(catalogItem => {
    const partner = partners[catalogItem.partnerId]
    const alreadyOwned = matchesOwnedEquipment(catalogItem, ownedEquipment)
    const reasons: string[] = []
    let necessityTier: EquipmentNecessityTier = 'home_gym_foundation'

    switch (catalogItem.id) {
      case 'pb_eva_foam_roller': {
        necessityTier = 'essential_corrective'
        if (inhibitCount > 0) {
          reasons.push(
            `Required to execute your ${inhibitCount} prescribed Phase 1 Inhibit (SMR) exercise${inhibitCount === 1 ? '' : 's'}.`
          )
        } else if ((assessment?.overactive_muscles?.length ?? 0) > 0) {
          reasons.push(
            `Targets hypertonic tissue identified in your screen (${assessment!.overactive_muscles.slice(0, 3).join(', ')}).`
          )
        } else {
          reasons.push('Foundational Phase 1 SMR tool for pre-session myofascial preparation and recovery.')
        }
        break
      }

      case 'pb_trigger_point_ball': {
        if (hasFootAnkleFindings || hasUpperFindings) {
          necessityTier = 'targeted_adjunct'
          if (hasFootAnkleFindings) {
            reasons.push('Targets plantar fascia & posterior tibialis trigger points tied to foot/ankle OHSA findings.')
          }
          if (hasUpperFindings) {
            reasons.push('Isolates pectoralis minor & posterior shoulder capsule tension prior to overhead work.')
          }
        } else {
          reasons.push('Precision focal SMR tool for plantar fascia, piriformis, and scapular trigger points.')
        }
        break
      }

      case 'cs_shoulder_system': {
        if (hasUpperFindings) {
          necessityTier = 'essential_corrective'
          const matchedLabels = Array.from(ohsaComps)
            .filter(c => UPPER_BODY_COMPENSATIONS.has(c))
            .map(c => COMPENSATION_LABELS[c])
          if (matchedLabels.length > 0) {
            reasons.push(`Prescribed directly for OHSA finding: ${matchedLabels.join(' & ')}.`)
          }
          if (distortionSyndromes.has('upper_crossed')) {
            reasons.push('Addresses Upper Crossed postural pattern via lower/mid trapezius & serratus activation.')
          }
          if (pushPullHasUpperComp) {
            reasons.push('Corrects scapular elevation/winging observed during dynamic push/pull screening.')
          }
        } else {
          reasons.push('Clinical rotator cuff & scapular pre-hab system for upper-body pressing longevity.')
        }
        break
      }

      case 'cs_hip_halo': {
        if (hasKneeOrLphcFindings) {
          necessityTier = 'essential_corrective'
          const matchedLabels = Array.from(ohsaComps)
            .filter(c => KNEE_LPHC_COMPENSATIONS.has(c))
            .map(c => COMPENSATION_LABELS[c])
          if (matchedLabels.length > 0) {
            reasons.push(`Prescribed directly for OHSA finding: ${matchedLabels.join(' & ')}.`)
          }
          if (slsHasValgusOrPelvicDrop) {
            reasons.push('Reinforces single-leg frontal-plane knee and pelvic stability via glute medius RNT.')
          }
        } else {
          reasons.push('Heavy-duty woven gluteal loop for lower-body warm-ups and squat alignment.')
        }
        break
      }

      case 'pb_mini_band_pack': {
        if (activateCount > 0 || hasFootAnkleFindings || hasKneeOrLphcFindings) {
          necessityTier = 'essential_corrective'
          if (activateCount > 0) {
            reasons.push(
              `Provides progressive light-to-heavy tensions for your ${activateCount} Phase 3 Activate drill${activateCount === 1 ? '' : 's'}.`
            )
          }
          if (hasFootAnkleFindings) {
            reasons.push('Enables isolated ankle dorsiflexion and tibialis activation drills.')
          }
        } else {
          necessityTier = 'targeted_adjunct'
          reasons.push('Compact travel and home-gym resistance loops for isolated joint activation.')
        }
        break
      }

      case 'pb_superband_stretch_assist': {
        if (lengthenCount > 0 || integrateCount > 0) {
          necessityTier = 'targeted_adjunct'
          reasons.push(
            'Supports Phase 2 assisted hamstring/calf lengthening and Phase 4 standing integrated band rows.'
          )
        } else {
          reasons.push('Versatile 41" band for mobility distraction, Pallof core bracing, and travel rows.')
        }
        break
      }

      case 'pb_airex_balance_pad': {
        if (optPhase === 1 || hasFootAnkleFindings || slsHasValgusOrPelvicDrop) {
          necessityTier = 'targeted_adjunct'
          if (optPhase === 1) {
            reasons.push('Synchronized with your active NASM OPT™ Phase 1 (Stabilization Endurance) mesocycle.')
          }
          if (hasFootAnkleFindings || slsHasValgusOrPelvicDrop) {
            reasons.push('Trains foot/ankle mechanoreceptors and single-leg proprioceptive control.')
          }
        } else {
          reasons.push('Proprioceptive foam pad for single-leg balance and joint bulletproofing.')
        }
        break
      }

      case 'rep_quickdraw_dumbbells': {
        necessityTier = 'home_gym_foundation'
        reasons.push(
          'Primary home-gym strength anchor: unlocks unilateral stabilization, hypertrophy supersets, and 2.5 lb micro-loading across all 5 NASM OPT™ phases.'
        )
        break
      }

      case 'rep_ab3000_fid_bench': {
        necessityTier = 'home_gym_foundation'
        reasons.push(
          'Pairs with QuickDraw™ Dumbbells to unlock chest-supported scapular rows, prone Y/T/I activation, incline/decline pressing, and split squats.'
        )
        break
      }

      case 'rep_adjustable_kettlebell': {
        necessityTier = 'home_gym_foundation'
        if (integrateCount > 0 || goalLower.includes('power') || goalLower.includes('fat')) {
          reasons.push(
            'Consolidates 5 kettlebells into 1 footprint for your Phase 4 integrated goblet squats, single-leg RDLs, carries, and metabolic swings.'
          )
        } else {
          reasons.push('Space-saving 5-in-1 cast-iron kettlebell for goblet squats, hinges, and core carries.')
        }
        break
      }

      case 'rep_adonis_cable_tower': {
        necessityTier = 'home_gym_foundation'
        reasons.push(
          'Brings commercial constant-tension cable rows, face pulls, Pallof presses, and rotational chops/lifts into a compact home-gym corner.'
        )
        break
      }

      case 'rep_pr4000_power_rack': {
        necessityTier = 'home_gym_foundation'
        if ((optPhase && optPhase >= 3) || goalLower.includes('hypertrophy') || goalLower.includes('strength') || goalLower.includes('power')) {
          reasons.push(
            'Commercial 3" × 3" 11-gauge centerpiece for unspotted solo safety on heavy squats, overhead presses, rack pulls, and pull-ups.'
          )
        } else {
          reasons.push('Modular lifetime home-gym rack upgradeable with lat pulldown or Ares™/Athena® cables.')
        }
        break
      }

      case 'rep_colorado_barbell': {
        necessityTier = 'home_gym_foundation'
        reasons.push(
          'Flagship 20kg multi-purpose barbell engineered to pair with the PR-4000 or PR-1100 Power Rack for Phases 2–5 axial strength and power.'
        )
        break
      }

      case 'rep_ab3100_bench': {
        necessityTier = 'home_gym_foundation'
        reasons.push(
          'Streamlined flat-to-incline 700 lb rated bench for compact home studios and value-conscious starter builds.'
        )
        break
      }

      case 'rep_pr1100_rack': {
        necessityTier = 'home_gym_foundation'
        reasons.push(
          '84-inch 4-post home power rack engineered specifically for residential basements/rooms and sub-$1,500 barbell sanctuaries.'
        )
        break
      }

      case 'rep_black_bumper_plates': {
        necessityTier = 'home_gym_foundation'
        reasons.push(
          'Quiet virgin-rubber Olympic bumper plates (45/25/10 lb pairs) protecting home flooring while unlocking 205 lb barbell loading.'
        )
        break
      }
    }

    const necessityLabel =
      necessityTier === 'essential_corrective'
        ? 'Tier 1 · Essential Corrective Hardware'
        : necessityTier === 'targeted_adjunct'
        ? 'Tier 2 · Targeted Mobility Adjunct'
        : 'Tier 3 · REP Fitness Home-Gym Architecture'

    return {
      ...catalogItem,
      necessityTier,
      necessityLabel,
      prescribedReasons: reasons,
      alreadyOwned,
      dispensaryUrl: buildEquipmentDispensaryUrl(catalogItem.partnerId, catalogItem.productPath),
      promoCode: partner.promoCode,
    }
  })

  const tierRank: Record<EquipmentNecessityTier, number> = {
    essential_corrective: 0,
    targeted_adjunct: 1,
    home_gym_foundation: 2,
  }

  const sortedItems = [...prescribedItems].sort((a, b) => {
    if (a.alreadyOwned !== b.alreadyOwned) return a.alreadyOwned ? 1 : -1
    return tierRank[a.necessityTier] - tierRank[b.necessityTier]
  })

  const assessmentMatchedItems = sortedItems.filter(
    item => item.necessityTier === 'essential_corrective' || item.necessityTier === 'targeted_adjunct'
  )
  const homeGymFoundationItems = sortedItems.filter(
    item => item.necessityTier === 'home_gym_foundation'
  )

  const unownedCoreItems = sortedItems.filter(
    item => !item.alreadyOwned && item.necessityTier === 'essential_corrective'
  )
  const kitBasis = unownedCoreItems.length > 0 ? unownedCoreItems : assessmentMatchedItems.slice(0, 3)

  const retailSum = kitBasis.reduce((sum, item) => sum + item.retailPriceUsd, 0)
  const memberSum = kitBasis.reduce((sum, item) => sum + item.clientDiscountPriceUsd, 0)
  const savingsSum = Math.max(0, retailSum - memberSum)

  const itemById = new Map(sortedItems.map(item => [item.id, item]))

  const tierBlueprints: Array<{
    id: HomeGymBuildoutTierId
    badge: string
    title: string
    subtitle: string
    footprintLabel: string
    optPhasesUnlocked: string
    itemIds: string[]
  }> = [
    {
      id: 'tier1_compact_studio',
      badge: 'Tier 1 · Starter Studio',
      title: 'Compact Apartment & Office Kit',
      subtitle:
        'QuickDraw™ Dumbbells, AB-3000 2.0 FID Bench, Adjustable Kettlebell, SMR Foam Roller & Mini-Bands.',
      footprintLabel: '~25 sq ft footprint',
      optPhasesUnlocked: 'Unlocks 85% of Phases 1–3 Stabilization & Hypertrophy',
      itemIds: [
        'rep_quickdraw_dumbbells',
        'rep_ab3000_fid_bench',
        'rep_adjustable_kettlebell',
        'pb_eva_foam_roller',
        'pb_mini_band_pack',
      ],
    },
    {
      id: 'tier2_cable_corrective',
      badge: 'Tier 2 · Functional Suite',
      title: 'Cable & Clinical Corrective Studio',
      subtitle:
        'Adds the REP Adonis™ Cable Tower plus Crossover Symmetry® Shoulder & Hip Halo™ Systems.',
      footprintLabel: '~50 sq ft footprint',
      optPhasesUnlocked: 'Unlocks Standing Cable Vectors & Full CEx Pre-Hab',
      itemIds: [
        'rep_quickdraw_dumbbells',
        'rep_ab3000_fid_bench',
        'rep_adjustable_kettlebell',
        'rep_adonis_cable_tower',
        'cs_shoulder_system',
        'cs_hip_halo',
        'pb_eva_foam_roller',
      ],
    },
    {
      id: 'tier3_full_sanctuary',
      badge: 'Tier 3 · Flagship Gym',
      title: 'Complete Performance Sanctuary',
      subtitle:
        'Full REP PR-4000 11-Gauge Power Rack, Colorado™ 20kg Barbell, 160 lb Black Bumper Plates, Adonis™ Cable Tower, Bench, Dumbbells & CEx Suite.',
      footprintLabel: '~100 sq ft garage / gym room',
      optPhasesUnlocked: 'Unlocks 100% of NASM OPT™ Phases 1–5 (Max Strength & Power)',
      itemIds: [
        'rep_pr4000_power_rack',
        'rep_colorado_barbell',
        'rep_black_bumper_plates',
        'rep_adonis_cable_tower',
        'rep_quickdraw_dumbbells',
        'rep_ab3000_fid_bench',
        'rep_adjustable_kettlebell',
        'cs_shoulder_system',
        'cs_hip_halo',
        'pb_eva_foam_roller',
      ],
    },
  ]

  const homeGymTiers: HomeGymBuildoutTierSummary[] = tierBlueprints.map(bp => {
    const tierItems = bp.itemIds
      .map(id => itemById.get(id))
      .filter((it): it is PrescribedEquipmentItem => Boolean(it))
    const fullPackageTotalUsd =
      Math.round(tierItems.reduce((s, it) => s + it.clientDiscountPriceUsd, 0) * 100) / 100
    const remainingUnownedUsd =
      Math.round(
        tierItems
          .filter(it => !it.alreadyOwned)
          .reduce((s, it) => s + it.clientDiscountPriceUsd, 0) * 100
      ) / 100
    const ownedCount = tierItems.filter(it => it.alreadyOwned).length

    return {
      id: bp.id,
      badge: bp.badge,
      title: bp.title,
      subtitle: bp.subtitle,
      footprintLabel: bp.footprintLabel,
      optPhasesUnlocked: bp.optPhasesUnlocked,
      itemIds: bp.itemIds,
      items: tierItems,
      ownedCount,
      totalCount: tierItems.length,
      fullPackageTotalUsd,
      fullPackageTotalFormatted: formatUsd(fullPackageTotalUsd),
      remainingUnownedUsd,
      remainingUnownedFormatted: formatUsd(remainingUnownedUsd),
    }
  })

  return {
    isEnabled: isEquipmentDispensaryEnabled,
    partners,
    prescribedItems: sortedItems,
    assessmentMatchedItems,
    homeGymFoundationItems,
    homeGymTiers,
    estimatedKitRetailTotalFormatted: formatUsd(retailSum),
    estimatedKitMemberTotalFormatted: formatUsd(memberSum),
    estimatedSavingsFormatted: formatUsd(savingsSum),
    hasActiveAssessmentMapping: hasAnyAssessment,
    ftcAffiliateDisclosure:
      'FTC AFFILIATE & PRACTITIONER DISCLOSURE: Forge Athletic partners with REP Fitness (authorized home-gym architecture with free US shipping), Crossover Symmetry (15% athlete courtesy discount), and Perform Better (10% athlete courtesy discount) to provide direct-fulfilled strength and corrective hardware without inventory markups. Forge Athletic may receive a partner referral commission on qualifying orders placed through dispensary links.',
    voluntarySourcingNotice:
      '100% VOLUNTARY SOURCING: Purchasing through Forge Athletic partner links is completely optional. Athletes are welcome to train at a commercial facility or source equivalent equipment from any manufacturer of their choice.',
  }
}
