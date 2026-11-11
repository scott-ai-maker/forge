/**
 * Forge Athletic — NASM RAG Home-Gym Architect & Client Needs Builder
 *
 * Synthesizes Forge Athletic's ingested NASM Home Gym Design (HGD), CPT7 OPT™, CES3 Corrective,
 * and Sport-Specific RAG knowledge base (`lib/nasm-rag-knowledge-base.ts`) with authorized
 * zero-inventory fulfillment partners:
 *   - REP Fitness (Commercial home-gym racks, benches, QuickDraw™ dumbbells, Adonis™ cable tower, bars & bumpers)
 *   - Crossover Symmetry (15% off medical-grade scapular & hip neuromuscular systems)
 *   - Perform Better (10% off First Place® SMR rollers, mini-bands, superbands & Airex® balance pads)
 */

import { queryNasmRagLibrary, type RagDocumentMetadata } from './nasm-rag-knowledge-base'
import { parseEquipmentCapabilities } from './nasm-equipment-detector'
import type { NasmAssessmentRecord } from './nasm-assessments'
import {
  generateEquipmentPrescription,
  isEquipmentDispensaryEnabled,
  type EquipmentPartnerConfig,
  type EquipmentPartnerId,
  type PrescribedEquipmentItem,
} from './equipment-prescriptions'

export type HomeGymSpaceType =
  | 'corner_apartment'
  | 'spare_room_office'
  | 'garage_basement'

export type HomeGymCeilingHeight =
  | 'low_under_84in'
  | 'standard_84_to_95in'
  | 'tall_96in_plus'

export type HomeGymFloorLevel =
  | 'ground_slab'
  | 'upper_floor_wood_condo'

export type HomeGymBudgetTier =
  | 'essential_under_750'
  | 'studio_1500'
  | 'functional_3000'
  | 'sanctuary_5000'

export type HomeGymPrimaryGoal =
  | 'fat_loss'
  | 'hypertrophy'
  | 'maximal_strength'
  | 'athletic_power'
  | 'posture_longevity'
  | 'golf_rotational'

export type HomeGymHouseholdUsers =
  | 'solo_athlete'
  | 'couple_shared'
  | 'family_multi_user'

export type HomeGymModalityPreference =
  | 'dumbbells_bench'
  | 'cables_functional'
  | 'barbell_rack'
  | 'kettlebell_conditioning'
  | 'corrective_mobility'

export type HomeGymClientConcern =
  | 'apartment_noise'
  | 'floor_protection'
  | 'low_ceiling'
  | 'solo_safety'
  | 'minimal_clutter'
  | 'joint_friendly'

export interface HomeGymBuilderNeedsInput {
  athleteName?: string | null
  spaceType?: HomeGymSpaceType
  ceilingHeight?: HomeGymCeilingHeight
  floorLevel?: HomeGymFloorLevel
  budgetTier?: HomeGymBudgetTier
  customMaxBudgetUsd?: number | null
  primaryGoal?: HomeGymPrimaryGoal
  householdUsers?: HomeGymHouseholdUsers
  preferredModalities?: HomeGymModalityPreference[]
  concerns?: HomeGymClientConcern[]
  assessment?: NasmAssessmentRecord | null
  ownedEquipment?: string[] | null
  optPhase?: number | null
  injuriesLimitations?: string | null
}

export interface HomeGymSiteSpecItem {
  id: string
  category: 'Spatial Clearance' | 'Ceiling & Vertical' | 'Flooring & Acoustics' | 'Safety & Delivery'
  title: string
  specification: string
  ragSourceId: string
}

export interface RagCitationBadge {
  id: string
  title: string
  category: string
  appliedRule: string
}

export interface HomeGymBuildLineItem extends PrescribedEquipmentItem {
  priorityScore: number
  architectRationale: string
  shippingClass: 'Parcel Ground' | 'Curbside LTL Freight / Heavy Parcel'
}

export interface RagHomeGymBlueprint {
  isEnabled: boolean
  blueprintTitle: string
  architectSummaryMemo: string
  resolvedBudgetCapUsd: number
  resolvedBudgetFormatted: string
  partners: Record<EquipmentPartnerId, EquipmentPartnerConfig>
  ownedCoreAssets: HomeGymBuildLineItem[]
  phase1ImmediateBuild: HomeGymBuildLineItem[]
  phase2ExpansionRoadmap: HomeGymBuildLineItem[]
  phase1RetailTotalUsd: number
  phase1MemberTotalUsd: number
  phase1RetailFormatted: string
  phase1MemberFormatted: string
  phase1MemberSavingsUsd: number
  phase1MemberSavingsFormatted: string
  remainingBudgetHeadroomUsd: number
  remainingBudgetHeadroomFormatted: string
  optUnlockPercentage: number
  unlockedCapabilitySummary: string
  unlockedMovementFamilies: string[]
  siteEngineeringSpecs: HomeGymSiteSpecItem[]
  ragCitations: RagCitationBadge[]
  ftcAffiliateDisclosure: string
  voluntarySourcingNotice: string
}

export const BUDGET_TIER_CAPS: Record<HomeGymBudgetTier, number> = {
  essential_under_750: 750,
  studio_1500: 1500,
  functional_3000: 3000,
  sanctuary_5000: 5000,
}

function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`
}

export function mapProfileGoalToHomeGymGoal(rawGoal?: string | null): HomeGymPrimaryGoal {
  const g = (rawGoal || '').toLowerCase()
  if (g.includes('golf') || g.includes('rotat')) return 'golf_rotational'
  if (g.includes('power') || g.includes('sport') || g.includes('athlet')) return 'athletic_power'
  if (g.includes('max') || g.includes('strength')) return 'maximal_strength'
  if (g.includes('hypertrophy') || g.includes('muscle') || g.includes('physique')) return 'hypertrophy'
  if (g.includes('posture') || g.includes('corrective') || g.includes('longevity') || g.includes('mobility')) {
    return 'posture_longevity'
  }
  return 'fat_loss'
}

/**
 * Retrieves relevant NASM RAG documents for the client's space, orthopedic screen, and training goal.
 */
function retrieveHomeGymRagContext(
  primaryGoal: HomeGymPrimaryGoal,
  optPhase: number,
  hasCorrectiveNeed: boolean
): RagCitationBadge[] {
  const hgdDocs = queryNasmRagLibrary({ goal: 'home_gym' })
  const citations: RagCitationBadge[] = []
  const seen = new Set<string>()

  const pushDoc = (doc: RagDocumentMetadata | undefined, appliedRule: string) => {
    if (!doc || seen.has(doc.id)) return
    seen.add(doc.id)
    citations.push({
      id: doc.id,
      title: doc.title,
      category: doc.category,
      appliedRule,
    })
  }

  pushDoc(
    hgdDocs.find(d => d.id === 'hgd_2_home_gym_discovery_assessment_'),
    'Calibrates equipment selection to household users, modality preferences, and budget stratification.'
  )
  pushDoc(
    hgdDocs.find(d => d.id === 'hgd_5_nasm_hgd_site_questionnaire_pd'),
    'Enforces ceiling height clearances, upper-floor acoustic dampening, and doorway/freight routing.'
  )
  pushDoc(
    hgdDocs.find(d => d.id === 'hgd_3_nasm_exercise_observation_work'),
    'Defines 36-inch barbell safety buffer zones, bench arc radius, and dynamic movement clearance.'
  )
  pushDoc(
    hgdDocs.find(d => d.id === 'hgd_4_nasm_hgd_invoice_template_pdf'),
    'Structures itemized procurement bill of materials with parcel vs. LTL freight classification.'
  )

  if (hasCorrectiveNeed || primaryGoal === 'posture_longevity') {
    const cesDocs = queryNasmRagLibrary({ goal: 'corrective' })
    pushDoc(
      cesDocs.find(d => d.id === 'ces3_master_study_guide') || cesDocs[0],
      'Prioritizes 4-Phase Corrective Exercise Continuum hardware (Inhibit SMR, Lengthen, Activate, Integrate).'
    )
  }

  if (primaryGoal === 'golf_rotational') {
    const golfDocs = queryNasmRagLibrary({ goal: 'golf' })
    pushDoc(
      golfDocs[0],
      'Integrates transverse-plane cable vectors and thoracic/scapular mobility tools for rotational power.'
    )
  } else {
    const modalitiesDoc = queryNasmRagLibrary({ keyword: 'Exercise Modalities' })[0]
    pushDoc(
      modalitiesDoc,
      `Matches free-weight, cable, and proprioceptive modalities to NASM OPT™ Phase ${optPhase} progressions.`
    )
  }

  return citations
}

/**
 * Generates a personalized, NASM HGD RAG-grounded Home-Gym Blueprint across
 * REP Fitness, Crossover Symmetry, and Perform Better.
 */
export function buildRagHomeGymBlueprint(
  input: HomeGymBuilderNeedsInput = {}
): RagHomeGymBlueprint {
  const spaceType: HomeGymSpaceType = input.spaceType ?? 'spare_room_office'
  const ceilingHeight: HomeGymCeilingHeight = input.ceilingHeight ?? 'standard_84_to_95in'
  const floorLevel: HomeGymFloorLevel = input.floorLevel ?? 'ground_slab'
  const budgetTier: HomeGymBudgetTier = input.budgetTier ?? 'studio_1500'
  const primaryGoal: HomeGymPrimaryGoal = input.primaryGoal ?? 'hypertrophy'
  const householdUsers: HomeGymHouseholdUsers = input.householdUsers ?? 'solo_athlete'
  const modalities = new Set<HomeGymModalityPreference>(
    input.preferredModalities && input.preferredModalities.length > 0
      ? input.preferredModalities
      : ['dumbbells_bench', 'corrective_mobility']
  )
  const concerns = new Set<HomeGymClientConcern>(input.concerns ?? [])

  if (ceilingHeight === 'low_under_84in') {
    concerns.add('low_ceiling')
  }
  if (floorLevel === 'upper_floor_wood_condo') {
    concerns.add('apartment_noise')
    concerns.add('floor_protection')
  }

  const resolvedBudgetCapUsd =
    typeof input.customMaxBudgetUsd === 'number' && Number.isFinite(input.customMaxBudgetUsd) && input.customMaxBudgetUsd >= 150
      ? Math.min(15000, Math.round(input.customMaxBudgetUsd))
      : BUDGET_TIER_CAPS[budgetTier]

  const effectiveOptPhase =
    input.optPhase ??
    (primaryGoal === 'maximal_strength'
      ? 4
      : primaryGoal === 'athletic_power' || primaryGoal === 'golf_rotational'
      ? 5
      : primaryGoal === 'hypertrophy'
      ? 3
      : primaryGoal === 'posture_longevity'
      ? 1
      : 2)

  const basePrescription = generateEquipmentPrescription({
    assessment: input.assessment ?? null,
    ownedEquipment: input.ownedEquipment ?? null,
    optPhase: effectiveOptPhase,
    goal: primaryGoal,
  })

  const injuryLower = (input.injuriesLimitations || '').toLowerCase()
  const hasShoulderConcern =
    injuryLower.includes('shoulder') ||
    injuryLower.includes('rotator') ||
    injuryLower.includes('impingement') ||
    injuryLower.includes('neck')
  const hasKneeOrBackConcern =
    injuryLower.includes('knee') ||
    injuryLower.includes('hip') ||
    injuryLower.includes('back') ||
    injuryLower.includes('lumbar') ||
    injuryLower.includes('sciatic')

  const hasCorrectiveNeed =
    basePrescription.hasActiveAssessmentMapping ||
    hasShoulderConcern ||
    hasKneeOrBackConcern ||
    concerns.has('joint_friendly')

  const ragCitations = retrieveHomeGymRagContext(primaryGoal, effectiveOptPhase, hasCorrectiveNeed)

  // Determine mutually exclusive Rack & Bench tier choices before scoring
  const canFitFullBarbellFootprint =
    spaceType !== 'corner_apartment' && ceilingHeight !== 'low_under_84in'

  const preferredBenchId =
    resolvedBudgetCapUsd <= 1050 || spaceType === 'corner_apartment'
      ? 'rep_ab3100_bench'
      : 'rep_ab3000_fid_bench'
  const excludedBenchId =
    preferredBenchId === 'rep_ab3100_bench' ? 'rep_ab3000_fid_bench' : 'rep_ab3100_bench'

  const preferredRackId =
    resolvedBudgetCapUsd >= 2600 && ceilingHeight === 'tall_96in_plus'
      ? 'rep_pr4000_power_rack'
      : 'rep_pr1100_rack'
  const excludedRackId =
    preferredRackId === 'rep_pr4000_power_rack' ? 'rep_pr1100_rack' : 'rep_pr4000_power_rack'

  const canFitAdonisCableTower = ceilingHeight !== 'low_under_84in'

  const heavyFreightIds = new Set<string>([
    'rep_adonis_cable_tower',
    'rep_pr4000_power_rack',
    'rep_pr1100_rack',
    'rep_black_bumper_plates',
    'rep_ab3000_fid_bench',
  ])

  const scoredPool: Array<HomeGymBuildLineItem & { eligibleForPhase1Space: boolean }> = []

  for (const item of basePrescription.prescribedItems) {
    if (item.id === excludedBenchId && !item.alreadyOwned) continue
    if (item.id === excludedRackId && !item.alreadyOwned) continue

    let score = 40
    let rationale = item.prescribedReasons[0] || item.clinicalMechanism
    let eligibleForPhase1Space = true

    switch (item.id) {
      case 'pb_eva_foam_roller': {
        score = 98
        rationale =
          'NASM Phase 1 Inhibit (SMR) essential: prepares hypertonic myofascial tissue before every home session in negligible floor space.'
        break
      }

      case 'pb_mini_band_pack': {
        score = hasCorrectiveNeed || modalities.has('corrective_mobility') ? 94 : 82
        rationale =
          'Zero-footprint progressive activation loops for ankle, gluteus medius, and scapular warm-ups across all household users.'
        break
      }

      case 'cs_shoulder_system': {
        const assessmentEssential = item.necessityTier === 'essential_corrective'
        if (assessmentEssential || hasShoulderConcern || primaryGoal === 'golf_rotational' || primaryGoal === 'posture_longevity') {
          score = 95
          rationale =
            'High-priority scapular & rotator cuff centration system mounted to any door or wall stud—critical for upper-quarter longevity.'
        } else if (modalities.has('corrective_mobility') || concerns.has('joint_friendly')) {
          score = 80
        } else {
          score = 56
        }
        break
      }

      case 'cs_hip_halo': {
        const assessmentEssential = item.necessityTier === 'essential_corrective'
        if (assessmentEssential || hasKneeOrBackConcern || primaryGoal === 'posture_longevity') {
          score = 93
          rationale =
            'Prescribed gluteal & LPHC Reactive Neuromuscular Training (RNT) loop to protect knee tracking and lumbar stability.'
        } else {
          score = 68
        }
        break
      }

      case 'pb_trigger_point_ball': {
        score = hasCorrectiveNeed ? 84 : 60
        rationale =
          'Focal plantar fascia, piriformis, and pec-minor release sphere complementing broad EVA foam rolling.'
        break
      }

      case 'pb_superband_stretch_assist': {
        score = modalities.has('corrective_mobility') || spaceType === 'corner_apartment' ? 79 : 62
        rationale =
          'Enables Phase 2 PNF hamstring/ankle mobility distraction plus standing Pallof presses and band rows.'
        break
      }

      case 'pb_airex_balance_pad': {
        score =
          effectiveOptPhase === 1 || primaryGoal === 'posture_longevity' || primaryGoal === 'golf_rotational'
            ? 81
            : 52
        rationale =
          'NASM Chapter 17 proprioceptive destabilization surface for single-leg balance and ankle/knee reflex stabilization.'
        break
      }

      case 'rep_quickdraw_dumbbells': {
        score = 97
        rationale =
          householdUsers !== 'solo_athlete'
            ? 'Replaces 10 pairs of dumbbells in 2 sq ft with instant Lock-N-Load™ weight changes between household training partners.'
            : 'Core home-gym workhorse: unlocks unilateral stabilization, hypertrophy, and 2.5 lb micro-progression in 2 sq ft.'
        break
      }

      case 'rep_ab3000_fid_bench':
      case 'rep_ab3100_bench': {
        score = modalities.has('dumbbells_bench') || primaryGoal === 'hypertrophy' || primaryGoal === 'maximal_strength' ? 91 : 85
        rationale =
          item.id === 'rep_ab3100_bench'
            ? 'Compact, mobile 700 lb FI bench maximizing budget headroom while unlocking incline pressing and chest-supported rows.'
            : 'Commercial 1,000 lb FID bench (-12° decline to 85° upright) supporting spine-sparing rows, Y/T/I raises, and multi-angle pressing.'
        break
      }

      case 'rep_adjustable_kettlebell': {
        if (
          modalities.has('kettlebell_conditioning') ||
          primaryGoal === 'fat_loss' ||
          primaryGoal === 'athletic_power' ||
          concerns.has('minimal_clutter')
        ) {
          score = 88
          rationale =
            '5-in-1 cast-iron kettlebell delivering metabolic swings, goblet squats, and anti-rotation carries with zero floor clutter.'
        } else {
          score = 72
        }
        break
      }

      case 'rep_adonis_cable_tower': {
        eligibleForPhase1Space = canFitAdonisCableTower && spaceType !== 'corner_apartment'
        if (
          modalities.has('cables_functional') ||
          primaryGoal === 'golf_rotational' ||
          primaryGoal === 'hypertrophy' ||
          concerns.has('joint_friendly') ||
          concerns.has('apartment_noise')
        ) {
          score = 89
          rationale =
            'Whisper-quiet selectorized pulley column (80.7" H) unlocking constant-tension rows, face pulls, Pallof presses, and rotational chops.'
        } else {
          score = 66
        }
        break
      }

      case 'rep_pr4000_power_rack':
      case 'rep_pr1100_rack': {
        eligibleForPhase1Space = canFitFullBarbellFootprint
        if (
          modalities.has('barbell_rack') ||
          primaryGoal === 'maximal_strength' ||
          primaryGoal === 'athletic_power' ||
          concerns.has('solo_safety')
        ) {
          score = 87
          rationale =
            item.id === 'rep_pr1100_rack'
              ? '84-inch 4-post safety cage engineered to clear standard residential ceilings while safeguarding unspotted solo squats and presses.'
              : 'Flagship 3" × 3" 11-gauge modular rack with Westside 1" bench-zone spacing for lifetime unspotted heavy compound safety.'
        } else {
          score = 58
        }
        break
      }

      case 'rep_colorado_barbell': {
        eligibleForPhase1Space = canFitFullBarbellFootprint
        if (modalities.has('barbell_rack') || primaryGoal === 'maximal_strength' || primaryGoal === 'athletic_power') {
          score = 86
          rationale =
            '20kg composite-bushing bar offering quiet, wrist-friendly sleeve rotation and balanced dual-knurl grip.'
        } else {
          score = 57
        }
        break
      }

      case 'rep_black_bumper_plates': {
        eligibleForPhase1Space = canFitFullBarbellFootprint
        if (modalities.has('barbell_rack') || primaryGoal === 'maximal_strength' || primaryGoal === 'athletic_power') {
          score = 85
          rationale =
            concerns.has('apartment_noise') || concerns.has('floor_protection')
              ? 'High-priority virgin-rubber bumper set absorbing impact vibration and eliminating iron plate clatter on residential floors.'
              : '160 lb virgin-rubber Olympic plate set (45s/25s/10s) pairing with the Colorado™ 20kg Bar for 205 lb total axial load.'
        } else {
          score = 56
        }
        break
      }
    }

    scoredPool.push({
      ...item,
      priorityScore: score,
      architectRationale: rationale,
      shippingClass: heavyFreightIds.has(item.id)
        ? 'Curbside LTL Freight / Heavy Parcel'
        : 'Parcel Ground',
      eligibleForPhase1Space,
    })
  }

  scoredPool.sort((a, b) => b.priorityScore - a.priorityScore)

  const ownedCoreAssets: HomeGymBuildLineItem[] = []
  const phase1ImmediateBuild: HomeGymBuildLineItem[] = []
  const phase2ExpansionRoadmap: HomeGymBuildLineItem[] = []

  let runningSpendUsd = 0

  // Separate already-owned items ($0 spend) first so we know exact capabilities
  const unownedCandidates: Array<HomeGymBuildLineItem & { eligibleForPhase1Space: boolean }> = []
  for (const candidate of scoredPool) {
    const { eligibleForPhase1Space, ...cleanItem } = candidate
    if (candidate.alreadyOwned) {
      ownedCoreAssets.push(cleanItem)
    } else {
      unownedCandidates.push({ ...cleanItem, eligibleForPhase1Space })
    }
  }

  // Group Barbell + Plates (+ Rack if unowned) so we never prescribe orphan bumper plates without a barbell
  const ownsBarbell = ownedCoreAssets.some(i => i.id === 'rep_colorado_barbell')
  const barbellBundleIds = new Set(['rep_pr4000_power_rack', 'rep_pr1100_rack', 'rep_colorado_barbell', 'rep_black_bumper_plates'])

  const barbellGroup = unownedCandidates.filter(c => barbellBundleIds.has(c.id))
  const nonBarbellCandidates = unownedCandidates.filter(c => !barbellBundleIds.has(c.id))

  // Pass 1: Pack highest-priority non-barbell items that fit space & budget
  // Wait: if the athlete explicitly asked for `barbell_rack` or `maximal_strength`, evaluate barbell group at its natural priority score!
  const unifiedQueue: Array<
    | { kind: 'single'; item: HomeGymBuildLineItem & { eligibleForPhase1Space: boolean }; score: number }
    | { kind: 'barbell_pack'; items: Array<HomeGymBuildLineItem & { eligibleForPhase1Space: boolean }>; score: number }
  > = nonBarbellCandidates.map(item => ({ kind: 'single', item, score: item.priorityScore }))

  if (barbellGroup.length > 0) {
    const topBarbellScore = Math.max(...barbellGroup.map(b => b.priorityScore))
    unifiedQueue.push({
      kind: 'barbell_pack',
      items: barbellGroup,
      score: topBarbellScore,
    })
  }

  unifiedQueue.sort((a, b) => b.score - a.score)

  for (const entry of unifiedQueue) {
    if (entry.kind === 'single') {
      const { eligibleForPhase1Space, ...cleanItem } = entry.item
      if (
        eligibleForPhase1Space &&
        runningSpendUsd + cleanItem.clientDiscountPriceUsd <= resolvedBudgetCapUsd
      ) {
        phase1ImmediateBuild.push(cleanItem)
        runningSpendUsd = Math.round((runningSpendUsd + cleanItem.clientDiscountPriceUsd) * 100) / 100
      } else {
        phase2ExpansionRoadmap.push(cleanItem)
      }
    } else {
      // Barbell pack: try full pack (Rack + Bar + Bumpers), or if ownsBarbell try Bumpers/Rack individually
      const allSpaceEligible = entry.items.every(i => i.eligibleForPhase1Space)
      const fullPackCost = entry.items.reduce((s, i) => s + i.clientDiscountPriceUsd, 0)

      if (allSpaceEligible && runningSpendUsd + fullPackCost <= resolvedBudgetCapUsd) {
        for (const raw of entry.items) {
          const { eligibleForPhase1Space: _elig, ...cleanItem } = raw
          phase1ImmediateBuild.push(cleanItem)
          runningSpendUsd = Math.round((runningSpendUsd + cleanItem.clientDiscountPriceUsd) * 100) / 100
        }
      } else if (allSpaceEligible && ownsBarbell) {
        for (const raw of entry.items) {
          const { eligibleForPhase1Space: _elig, ...cleanItem } = raw
          if (runningSpendUsd + cleanItem.clientDiscountPriceUsd <= resolvedBudgetCapUsd) {
            phase1ImmediateBuild.push(cleanItem)
            runningSpendUsd = Math.round((runningSpendUsd + cleanItem.clientDiscountPriceUsd) * 100) / 100
          } else {
            phase2ExpansionRoadmap.push(cleanItem)
          }
        }
      } else {
        // Check if Barbell + Bumper Plates (landmine / floor deadlift / clean setup) fits without Rack
        const barAndPlates = entry.items.filter(
          i => i.id === 'rep_colorado_barbell' || i.id === 'rep_black_bumper_plates'
        )
        const barPlatesCost = barAndPlates.reduce((s, i) => s + i.clientDiscountPriceUsd, 0)
        if (
          allSpaceEligible &&
          barAndPlates.length === 2 &&
          !concerns.has('solo_safety') &&
          runningSpendUsd + barPlatesCost <= resolvedBudgetCapUsd
        ) {
          for (const raw of entry.items) {
            const { eligibleForPhase1Space: _elig, ...cleanItem } = raw
            if (raw.id === 'rep_colorado_barbell' || raw.id === 'rep_black_bumper_plates') {
              phase1ImmediateBuild.push(cleanItem)
              runningSpendUsd = Math.round((runningSpendUsd + cleanItem.clientDiscountPriceUsd) * 100) / 100
            } else {
              phase2ExpansionRoadmap.push(cleanItem)
            }
          }
        } else {
          for (const raw of entry.items) {
            const { eligibleForPhase1Space: _elig, ...cleanItem } = raw
            phase2ExpansionRoadmap.push(cleanItem)
          }
        }
      }
    }
  }

  // Compute combined equipment capabilities unlocked after Phase 1 + Owned Assets
  const combinedEquipmentTokens: string[] = [
    ...(input.ownedEquipment ?? []),
    ...ownedCoreAssets.flatMap(i => i.ownedEquipmentMatchTerms),
    ...phase1ImmediateBuild.flatMap(i => i.ownedEquipmentMatchTerms),
  ]
  const caps = parseEquipmentCapabilities(combinedEquipmentTokens)

  const unlockedMovementFamilies: string[] = []
  let optUnlockScore = 35 // Bodyweight baseline
  if (caps.hasFoamRoller) {
    optUnlockScore += 10
    unlockedMovementFamilies.push('Phase 1 Inhibit (SMR Myofascial Release)')
  }
  if (caps.hasBands || phase1ImmediateBuild.some(i => i.partnerId === 'crossover_symmetry')) {
    optUnlockScore += 12
    unlockedMovementFamilies.push('Phase 3 Isolated Scapular, Rotator Cuff & Gluteal Activation')
  }
  if (caps.hasDumbbells) {
    optUnlockScore += 18
    unlockedMovementFamilies.push('Unilateral & Bilateral Free-Weight Stabilization / Hypertrophy (5–60 lb)')
  }
  if (caps.hasBench) {
    optUnlockScore += 8
    unlockedMovementFamilies.push('Multi-Angle Incline/Flat Pressing & Spine-Supported Rows')
  }
  if (caps.hasKettlebell) {
    optUnlockScore += 5
    unlockedMovementFamilies.push('Ballistic Hip-Hinge Power, Goblet Squats & Loaded Carries')
  }
  if (caps.hasCables) {
    optUnlockScore += 7
    unlockedMovementFamilies.push('Constant-Tension Pulley Rows, Face Pulls & Rotational Chops/Lifts')
  }
  if (caps.hasBarbell && caps.hasSquatRack) {
    optUnlockScore += 5
    unlockedMovementFamilies.push('Phases 4–5 Maximal Axial Barbell Squats, Presses & Rack Pulls')
  }
  const optUnlockPercentage = Math.min(100, optUnlockScore)

  // Build NASM HGD Site, Clearance & Safety Specifications (`hgd_3` & `hgd_5`)
  const siteEngineeringSpecs: HomeGymSiteSpecItem[] = []

  if (spaceType === 'corner_apartment') {
    siteEngineeringSpecs.push({
      id: 'spec_footprint_compact',
      category: 'Spatial Clearance',
      title: 'Compact 5\' × 6\' Dynamic Exercise Radius',
      specification:
        'Maintain a minimum 36-inch unobstructed arc in front of your adjustable bench and wall/door cord anchor. Store QuickDraw™ cradles flush against the baseboard when not in session.',
      ragSourceId: 'hgd_3_nasm_exercise_observation_work',
    })
  } else if (spaceType === 'spare_room_office') {
    siteEngineeringSpecs.push({
      id: 'spec_footprint_room',
      category: 'Spatial Clearance',
      title: '8\' × 8\' Multi-Planar Studio Buffer Zone',
      specification:
        'Position taller hardware (Adonis™ Cable Tower or PR-1100 Rack) along a load-bearing perimeter wall, preserving a 6\' × 6\' center lane for single-leg squats, lunges, and SMR rolling.',
      ragSourceId: 'hgd_3_nasm_exercise_observation_work',
    })
  } else {
    siteEngineeringSpecs.push({
      id: 'spec_footprint_garage',
      category: 'Spatial Clearance',
      title: '10\' × 12\' Barbell & Rack Safety Perimeter',
      specification:
        'An 86.6" Olympic barbell requires 7 ft of shaft length plus 30–36 inches of lateral plate-loading clearance per side (minimum 12 ft total width) to eliminate wall strikes and tripping hazards.',
      ragSourceId: 'hgd_3_nasm_exercise_observation_work',
    })
  }

  if (ceilingHeight === 'low_under_84in') {
    siteEngineeringSpecs.push({
      id: 'spec_ceiling_low',
      category: 'Ceiling & Vertical',
      title: 'Sub-84" Low-Ceiling Guardrail Active',
      specification:
        'Full-height power racks (84"–93") and 80.7" cable towers were automatically withheld from Phase 1. Perform overhead presses seated at 75°–85° on your REP bench or half-kneeling to protect ceiling joists.',
      ragSourceId: 'hgd_5_nasm_hgd_site_questionnaire_pd',
    })
  } else if (ceilingHeight === 'standard_84_to_95in') {
    siteEngineeringSpecs.push({
      id: 'spec_ceiling_std',
      category: 'Ceiling & Vertical',
      title: '84"–95" Residential Joist Verification',
      specification:
        'Clears the REP Adonis™ Cable Tower (80.7" H) and REP PR-1100 (84" H) or PR-4000 80" upright option. Verify overhead light fixtures/garage door tracks and use seated Z-presses if standing barbell lockout touches 92"+.',
      ragSourceId: 'hgd_5_nasm_hgd_site_questionnaire_pd',
    })
  } else {
    siteEngineeringSpecs.push({
      id: 'spec_ceiling_tall',
      category: 'Ceiling & Vertical',
      title: '96"+ Full Overhead & Bar Muscle-Up Clearance',
      specification:
        'Supports full 93-inch REP PR-4000 uprights, dead-hang pull-ups without knee flexion, and standing overhead barbell/kettlebell lockout.',
      ragSourceId: 'hgd_5_nasm_hgd_site_questionnaire_pd',
    })
  }

  if (floorLevel === 'upper_floor_wood_condo' || concerns.has('apartment_noise') || concerns.has('floor_protection')) {
    siteEngineeringSpecs.push({
      id: 'spec_floor_acoustic',
      category: 'Flooring & Acoustics',
      title: 'Upper-Floor Acoustic & Subfloor Load Dispersion',
      specification:
        'Lay 3/4" vulcanized rubber stall mats over a high-density EVA acoustic underlayment to distribute point loads across floor joists and dampen decibel transmission. Never drop free weights on suspended wood subfloors.',
      ragSourceId: 'hgd_5_nasm_hgd_site_questionnaire_pd',
    })
  } else {
    siteEngineeringSpecs.push({
      id: 'spec_floor_slab',
      category: 'Flooring & Acoustics',
      title: 'Concrete Slab Vapor & Knurl Protection',
      specification:
        'Install 4\' × 6\' 3/4" non-porous vulcanized rubber mats beneath bench/rack feet to prevent concrete dusting, protect barbell knurling, and provide high-friction foot traction.',
      ragSourceId: 'hgd_5_nasm_hgd_site_questionnaire_pd',
    })
  }

  const hasLtlInPhase1 = phase1ImmediateBuild.some(
    i => i.shippingClass === 'Curbside LTL Freight / Heavy Parcel'
  )
  siteEngineeringSpecs.push({
    id: 'spec_safety_delivery',
    category: 'Safety & Delivery',
    title: hasLtlInPhase1
      ? 'Curbside Freight Access & Unspotted Safety Protocol'
      : 'Standard Parcel Delivery & Door/Wall Anchor Check',
    specification: hasLtlInPhase1
      ? 'Measure exterior/stairway doorway widths (minimum 32"–36" clear) prior to REP Fitness delivery, and always set rack safety straps/pins 1 inch below bottom squat/bench depth when training solo.'
      : 'All Phase 1 items ship via standard ground parcel with zero freight dock requirements. Inspect Crossover Symmetry door-strap hinge side (close door toward you when possible) or anchor into a solid wood stud.',
    ragSourceId: 'hgd_5_nasm_hgd_site_questionnaire_pd',
  })

  const phase1RetailTotalUsd =
    Math.round(phase1ImmediateBuild.reduce((s, i) => s + i.retailPriceUsd, 0) * 100) / 100
  const phase1MemberTotalUsd =
    Math.round(phase1ImmediateBuild.reduce((s, i) => s + i.clientDiscountPriceUsd, 0) * 100) / 100
  const phase1MemberSavingsUsd = Math.max(
    0,
    Math.round((phase1RetailTotalUsd - phase1MemberTotalUsd) * 100) / 100
  )
  const remainingBudgetHeadroomUsd = Math.max(
    0,
    Math.round((resolvedBudgetCapUsd - phase1MemberTotalUsd) * 100) / 100
  )

  const spaceLabel =
    spaceType === 'corner_apartment'
      ? 'Compact Corner Studio'
      : spaceType === 'spare_room_office'
      ? 'Dedicated Spare-Room Studio'
      : 'Garage / Basement Sanctuary'

  const firstName = (input.athleteName || 'Athlete').trim().split(' ')[0]
  const blueprintTitle = `${firstName}'s ${spaceLabel} · OPT™ Phase ${effectiveOptPhase} Blueprint`

  const architectSummaryMemo = `Designed via Forge Athletic's NASM Home Gym Design (HGD) & OPT™ RAG Knowledge Base for a ${spaceLabel.toLowerCase()} within your ${formatUsd(
    resolvedBudgetCapUsd
  )} target budget. ${
    ownedCoreAssets.length > 0
      ? `We credited ${ownedCoreAssets.length} piece${ownedCoreAssets.length === 1 ? '' : 's'} you already own at $0.00 so 100% of your budget goes toward high-impact gaps—`
      : 'Phase 1 prioritizes zero-redundancy foundational hardware—'
  }unlocking ${optUnlockPercentage}% of NASM OPT™ Phases 1–5 movement capabilities across REP Fitness, Crossover Symmetry, and Perform Better.`

  return {
    isEnabled: isEquipmentDispensaryEnabled,
    blueprintTitle,
    architectSummaryMemo,
    resolvedBudgetCapUsd,
    resolvedBudgetFormatted: formatUsd(resolvedBudgetCapUsd),
    partners: basePrescription.partners,
    ownedCoreAssets,
    phase1ImmediateBuild,
    phase2ExpansionRoadmap: phase2ExpansionRoadmap.slice(0, 6),
    phase1RetailTotalUsd,
    phase1MemberTotalUsd,
    phase1RetailFormatted: formatUsd(phase1RetailTotalUsd),
    phase1MemberFormatted: formatUsd(phase1MemberTotalUsd),
    phase1MemberSavingsUsd,
    phase1MemberSavingsFormatted: formatUsd(phase1MemberSavingsUsd),
    remainingBudgetHeadroomUsd,
    remainingBudgetHeadroomFormatted: formatUsd(remainingBudgetHeadroomUsd),
    optUnlockPercentage,
    unlockedCapabilitySummary: caps.summaryLabel,
    unlockedMovementFamilies,
    siteEngineeringSpecs,
    ragCitations,
    ftcAffiliateDisclosure: basePrescription.ftcAffiliateDisclosure,
    voluntarySourcingNotice: basePrescription.voluntarySourcingNotice,
  }
}

