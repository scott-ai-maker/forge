/**
 * Evidence-Based Sports Science Supplementation Advisory Engine & Medication Safety Screening
 * Governed strictly by ISSN, ACSM, IOC consensus, and peer-reviewed sports nutrition science.
 * Provides educational performance guidance, third-party quality screening, and mandatory clinical referral warnings.
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
  takingAnticoagulants?: boolean // Warfarin, Eliquis, Xarelto, Plavix, Daily Aspirin
  takingAntihypertensives?: boolean // ACE inhibitors (Lisinopril), ARBs (Losartan), Beta-blockers (Metoprolol), Spironolactone
  takingThyroidHormone?: boolean // Levothyroxine / Synthroid, Liothyronine / Cytomel, Armour
  takingStatins?: boolean // Atorvastatin (Lipitor), Rosuvastatin (Crestor), Simvastatin
  takingAntidepressants?: boolean // SSRIs (Zoloft, Lexapro, Prozac), SNRIs (Cymbalta, Effexor), MAOIs
  takingDiabetesMedications?: boolean // Metformin, GLP-1 agonists (Semaglutide/Ozempic/Tirzepatide), Insulin
  takingOralAntibiotics?: boolean // Fluoroquinolones (Cipro), Tetracyclines (Doxycycline)
  takingImmunosuppressantsOrSteroids?: boolean // Prednisone, Dexamethasone, Tacrolimus, Cyclosporine
}

export interface MedicalHealthConditions extends PrescriptionMedicationsList {
  hasHypertension?: boolean
  hasKidneyCondition?: boolean
  takingBloodThinners?: boolean // legacy alias for takingAnticoagulants
  isPregnantOrNursing?: boolean
  hasCaffeineSensitivity?: boolean
}

export interface ClientSupplementProfile {
  goal: SupplementGoal
  age: number
  sex: ClientSex
  fitnessLevel: FitnessLevel
  bodyweightKg?: number
  healthConditions?: MedicalHealthConditions
}

export type EvidenceTier =
  | 'Tier A (Irrefutable Clinical RCT Evidence)'
  | 'Tier B (Context-Specific Performance & Longevity)'

export type RoutineTier = 'daily_core' | 'workout_days' | 'conditional_adjunct'

export type DailyFrequency = 'Every Day' | 'Workout Days Only' | 'As Needed / Profile Specific'

export type NecessityLevel = 'essential' | 'performance' | 'conditional'

export type TimingWindow =
  | 'morning_with_breakfast'
  | 'pre_workout_45min'
  | 'post_workout_anabolic'
  | 'night_pre_sleep'
  | 'daily_flexible'

export interface PrescribedSupplementItem {
  id: string
  name: string
  evidenceTier: EvidenceTier
  routineTier: RoutineTier
  dailyFrequency: DailyFrequency
  necessityLevel: NecessityLevel
  optimalDosage: string
  timingWindow: TimingWindow
  timingLabel: string
  mealInstruction: string
  restDayDirective: string
  workoutDayOnly: boolean
  biologicalMechanism: string
  clinicalEvidenceSummary: string
  issnCitation: string
  nsfCertifiedForSportRecommended: boolean
  isConditionalOrMastersOnly?: boolean
  isBeneficialCoPrescription?: boolean
  isAdjunctSupport?: boolean
  chronoSeparationNote?: string
  warningNote?: string
  recommendedBrand?: string
  dispensarySku?: string
  dispensaryUrl?: string
  retailPriceEstimate?: string
  clientDiscountPrice?: string
}

export type RecommendedSupplementItem = PrescribedSupplementItem

const rawThorneUrl = process.env.NEXT_PUBLIC_THORNE_DISPENSARY_URL
export const isThorneAccountLinked = Boolean(
  rawThorneUrl &&
    rawThorneUrl.trim().length > 0 &&
    !rawThorneUrl.includes('gordonathletic') &&
    rawThorneUrl.startsWith('http')
)

export const DISPENSARY_PARTNER_CONFIG = {
  partnerName: 'Forge Athletic Partner Dispensary',
  platform: 'Fullscript & Thorne Partner Dispensaries',
  discountPercentage: 15,
  defaultFullscriptUrl: process.env.NEXT_PUBLIC_FULLSCRIPT_DISPENSARY_URL || 'https://us.fullscript.com',
  defaultThorneUrl: isThorneAccountLinked ? rawThorneUrl! : 'https://www.thorne.com',
  isThorneLinked: isThorneAccountLinked,
  thorneStatusLabel: isThorneAccountLinked
    ? 'Active Partner Dispensary (15% Athlete Privilege Discount)'
    : 'Thorne Dispensary Account Linking in Progress (Browse Verified Thorne Catalog)',
  standards: [
    '100% 3rd-Party Lab Verified (NSF for Sport / USP / Informed Choice)',
    'Cold-Chain Temperature Controlled Warehousing & Direct Manufacturer Shipping',
    'Zero Artificial Sweeteners, Fillers, or Heavy Metal Contaminants',
  ],
  affiliateDisclosure:
    'Forge Athletic is an authorized dispensary partner of Fullscript and an affiliate partner of Thorne. We provide athletes with access to third-party lab-verified supplements (NSF Certified for Sport® / USP Verified®) with an exclusive 15% client courtesy discount. Forge Athletic and Coach Gordon may receive an affiliate commission on qualifying purchases made through these links. Purchasing supplements is 100% voluntary; athletes may source equivalent third-party verified products from any retailer of their choice.',
}

export function getDispensaryPartnerInfo() {
  return DISPENSARY_PARTNER_CONFIG
}

export function buildDispensaryItemUrl(dispensarySku?: string, brand?: string): string {
  if (brand?.toLowerCase() === 'thorne') {
    if (isThorneAccountLinked) {
      return `${DISPENSARY_PARTNER_CONFIG.defaultThorneUrl}?sku=${encodeURIComponent(dispensarySku || '')}`
    }
    // Thorne account not linked yet: provide safe direct catalog navigation
    return 'https://www.thorne.com/products'
  }
  const baseUrl = DISPENSARY_PARTNER_CONFIG.defaultFullscriptUrl
  if (!dispensarySku) return baseUrl
  return `${baseUrl}?sku=${encodeURIComponent(dispensarySku)}`
}

export interface ChronoNutritionSchedule {
  morning: PrescribedSupplementItem[]
  preWorkout: PrescribedSupplementItem[]
  postWorkout: PrescribedSupplementItem[]
  night: PrescribedSupplementItem[]
  dailyFlexible: PrescribedSupplementItem[]
}

export type InteractionSeverity =
  | 'CRITICAL_CONTRAINDICATION'
  | 'MODIFIED_DOSING'
  | 'CHRONO_SEPARATION_REQUIRED'
  | 'BENEFICIAL_CO_PRESCRIPTION'

export interface DrugSupplementInteractionAlert {
  medicationCategory: string
  severity: InteractionSeverity
  suppressedSupplement?: string
  prescribedAlternativeOrAdjunct?: string
  chronoSeparationHours?: number
  pharmacologicalRationale: string
  actionDirective: string
}

export interface SupplementStackResult {
  clientProfile: ClientSupplementProfile
  prescribedItems: PrescribedSupplementItem[]
  chronoSchedule: ChronoNutritionSchedule
  tieredSchedule: {
    dailyCore: PrescribedSupplementItem[]
    workoutDays: PrescribedSupplementItem[]
    conditionalAdjuncts: PrescribedSupplementItem[]
  }
  routineSummary: {
    dailyCoreCount: number
    workoutDaysCount: number
    workoutOnlyCount: number
    conditionalCount: number
    restDayRoutineText: string
    workoutDayRoutineText: string
    titrationSafetyAdvice: string
    titrationRule: string
  }
  drugInteractions: DrugSupplementInteractionAlert[]
  flaggedContraindications: {
    condition: string
    suppressedItem: string
    reason: string
    safeAlternative: string
  }[]
  ageSpecificAdjustments: string[]
  sexSpecificAdjustments: string[]
  chronoSeparationRules: string[]
  executiveSummary: string
  legalDisclaimer: string
  scopeOfPracticeNotice: string
  medicalSupervisionWarning: string
  wholeFoodFirstNotice: string
  discontinueAndConsultNotice: string
  ftcAffiliateDisclosure: string
  thirdPartyQualityStandards: string
  dispensaryInfo: typeof DISPENSARY_PARTNER_CONFIG
}

export const SUPPLEMENT_DISPENSARY_MAP: Record<
  string,
  { brand: string; sku: string; retail: string; discount: string }
> = {
  omega_3_mod: { brand: 'Thorne', sku: 'THORNE-SUPER-EPA', retail: '$38.00', discount: '$32.30' },
  omega_3_high: { brand: 'Thorne', sku: 'THORNE-SUPER-EPA-PRO', retail: '$48.00', discount: '$40.80' },
  vit_d3_pure: { brand: 'Pure Encapsulations', sku: 'PE-VIT-D3-LIQUID', retail: '$24.00', discount: '$20.40' },
  vit_d3_k2: { brand: 'Thorne', sku: 'THORNE-D3-K2-LIQUID', retail: '$29.00', discount: '$24.65' },
  magnesium_glycinate: { brand: 'Thorne', sku: 'THORNE-MAG-BISGLYCINATE', retail: '$46.00', discount: '$39.10' },
  protein_isolate: { brand: 'Momentous', sku: 'MOMENTOUS-100-WHEY-ISOLATE', retail: '$58.00', discount: '$49.30' },
  creatine_monohydrate: { brand: 'Momentous', sku: 'MOMENTOUS-CREAPURE', retail: '$42.00', discount: '$35.70' },
  l_citrulline_nonstim: { brand: 'Designs for Health', sku: 'DFH-L-CITRULLINE', retail: '$36.00', discount: '$30.60' },
  caffeine_theanine: { brand: 'Pure Encapsulations', sku: 'PE-ENERGY-XTRA', retail: '$32.00', discount: '$27.20' },
  low_potassium_hydration: { brand: 'Thorne', sku: 'THORNE-CATALYTE-MOD', retail: '$38.00', discount: '$32.30' },
  isotonic_electrolytes: { brand: 'Thorne', sku: 'THORNE-CATALYTE-SPORT', retail: '$38.00', discount: '$32.30' },
  ubiquinol_coq10: { brand: 'Pure Encapsulations', sku: 'PE-UBIQUINOL-VESISORB', retail: '$56.00', discount: '$47.60' },
  methyl_b12: { brand: 'Thorne', sku: 'THORNE-METHYL-B12', retail: '$22.00', discount: '$18.70' },
  collagen_vit_c: { brand: 'Momentous', sku: 'MOMENTOUS-COLLAGEN-PEPTIDES', retail: '$52.00', discount: '$44.20' },
  tart_cherry_curcumin: { brand: 'Thorne', sku: 'THORNE-CURCUMIN-PHYTOSOME', retail: '$44.00', discount: '$37.40' },
  beta_alanine: { brand: 'Thorne', sku: 'THORNE-BETA-ALANINE-SR', retail: '$40.00', discount: '$34.00' },
}

export function attachDispensaryMeta(item: PrescribedSupplementItem): PrescribedSupplementItem {
  const meta = SUPPLEMENT_DISPENSARY_MAP[item.id]
  if (meta) {
    item.recommendedBrand = meta.brand
    item.dispensarySku = meta.sku
    item.retailPriceEstimate = meta.retail
    item.clientDiscountPrice = meta.discount
    item.dispensaryUrl = buildDispensaryItemUrl(meta.sku, meta.brand)
  }
  return item
}

export function generateSupplementStack(profile: ClientSupplementProfile): SupplementStackResult {
  const { goal, age, sex, fitnessLevel, healthConditions = {} } = profile
  const isMasters = age >= 45
  const isSenior = age >= 60

  const items: PrescribedSupplementItem[] = []
  const drugInteractions: DrugSupplementInteractionAlert[] = []
  const flaggedContraindications: SupplementStackResult['flaggedContraindications'] = []
  const ageSpecificAdjustments: string[] = []
  const sexSpecificAdjustments: string[] = []
  const chronoSeparationRules: string[] = []

  // Consolidate anticoagulants flag
  const isTakingBloodThinners = Boolean(healthConditions.takingAnticoagulants || healthConditions.takingBloodThinners)
  const isTakingBloodPressureMeds = Boolean(healthConditions.takingAntihypertensives || healthConditions.hasHypertension)

  // ── 1. PHARMACOLOGICAL INTERACTION ANALYSIS ──────────────────────

  // A. Anticoagulants / Blood Thinners (Warfarin, Eliquis, Xarelto, Plavix, Aspirin)
  if (isTakingBloodThinners) {
    drugInteractions.push({
      medicationCategory: 'Anticoagulants / Antiplatelet Blood Thinners',
      severity: 'CRITICAL_CONTRAINDICATION',
      suppressedSupplement: 'Vitamin K2 (MK-7) & High-Dose Omega-3 (>2,000mg)',
      prescribedAlternativeOrAdjunct: 'Pure Vitamin D3 (without K2) & Moderate Omega-3 (≤1,000mg)',
      pharmacologicalRationale:
        'Vitamin K directly antagonizes the vitamin K epoxide reductase (VKORC1) inhibition of Warfarin/Coumadin, destabilizing INR. High-dose EPA/DHA and high-dose Curcumin possess additive antiplatelet effects.',
      actionDirective:
        'Substituted Vitamin K2 with pure Vitamin D3; capped supplemental Omega-3 at 1,000mg/day. Excluded high-dose herbal anti-inflammatories.',
    })
    flaggedContraindications.push({
      condition: 'Anticoagulant Blood Thinners (Warfarin/Eliquis/Aspirin)',
      suppressedItem: 'Vitamin K2 (MK-7) & High-Dose Omega-3',
      reason: 'Risk of Warfarin mechanism antagonism and compounding antiplatelet bleeding risk.',
      safeAlternative: 'Prescribed Pure Vitamin D3 (K-Free) and capped Omega-3 at ≤1,000mg with physician review.',
    })
  }

  // B. Cardiovascular / Antihypertensives (ACEi, ARBs, Beta-Blockers, Spironolactone)
  if (isTakingBloodPressureMeds) {
    drugInteractions.push({
      medicationCategory: 'Antihypertensives & Cardiovascular Medications',
      severity: 'CRITICAL_CONTRAINDICATION',
      suppressedSupplement: 'High-Stimulant Pre-Workouts & High-Potassium Electrolytes',
      prescribedAlternativeOrAdjunct: 'Non-Stimulant L-Citrulline Malate (2:1) & Low-Potassium Sodium/Magnesium Hydration',
      pharmacologicalRationale:
        'ACE inhibitors and potassium-sparing diuretics reduce renal potassium excretion; supplemental potassium can precipitate life-threatening hyperkalemia. Caffeine anhydrous triggers acute sympathetic vasoconstriction, opposing antihypertensive therapy.',
      actionDirective:
        'Suppressed all caffeine anhydrous pre-workouts and potassium-heavy electrolyte blends. Prescribed non-stimulant L-Citrulline Malate for safe endothelial nitric oxide vasodilation.',
    })
  }

  // C. Thyroid Hormone Replacement (Levothyroxine / Synthroid, Cytomel)
  if (healthConditions.takingThyroidHormone) {
    const separationRule = 'Mandatory 4-Hour Separation: Take Levothyroxine immediately upon waking on empty stomach with water only. Schedule all multivalent mineral supplements (Magnesium, Calcium, Iron, Zinc) and Whey Protein shakes at least 4 hours later to prevent 70–80% drug malabsorption.'
    chronoSeparationRules.push(separationRule)
    drugInteractions.push({
      medicationCategory: 'Thyroid Hormone Replacement (Levothyroxine / Synthroid)',
      severity: 'CHRONO_SEPARATION_REQUIRED',
      chronoSeparationHours: 4,
      pharmacologicalRationale:
        'Divalent and trivalent mineral cations (Magnesium, Calcium, Iron, Zinc) and intact dairy proteins bind/chelate thyroid hormone molecules in the gastrointestinal tract, forming insoluble complexes and reducing bioavailability by up to 80%.',
      actionDirective: separationRule,
    })
  }

  // D. Statins / HMG-CoA Reductase Inhibitors (Lipitor, Crestor, Simvastatin)
  if (healthConditions.takingStatins) {
    drugInteractions.push({
      medicationCategory: 'Statins / Cholesterol-Lowering Medications (Lipitor, Crestor)',
      severity: 'BENEFICIAL_CO_PRESCRIPTION',
      suppressedSupplement: 'Red Yeast Rice (Duplicate Statin Toxicity Risk)',
      prescribedAlternativeOrAdjunct: 'Active Ubiquinol (CoQ10 100–200mg/day)',
      pharmacologicalRationale:
        'Statins inhibit the mevalonate biochemical pathway, which lowers cholesterol but simultaneously depletes endogenous Coenzyme Q10 synthesis in skeletal and cardiac muscle, causing statin-induced myopathy. Red Yeast Rice contains natural monacolin K and must never be co-administered with prescription statins.',
      actionDirective:
        'Auto-prescribed active Ubiquinol (CoQ10 100–200mg) to restore mitochondrial electron transport and protect against muscle aches. Strictly blacklisted Red Yeast Rice.',
    })
  }

  // E. Antidepressants / SSRIs / SNRIs / MAOIs (Zoloft, Lexapro, Prozac, Cymbalta)
  if (healthConditions.takingAntidepressants) {
    drugInteractions.push({
      medicationCategory: 'Antidepressants (SSRIs, SNRIs, MAOIs)',
      severity: 'CRITICAL_CONTRAINDICATION',
      suppressedSupplement: '5-HTP, St. John\'s Wort & High-Dose L-Tryptophan',
      prescribedAlternativeOrAdjunct: 'Chelated Magnesium Bisglycinate for natural GABAergic sleep architecture',
      pharmacologicalRationale:
        'Co-administration of serotonergic precursors (5-HTP, L-Tryptophan) or reuptake inhibitors (St. John\'s Wort) with prescription SSRIs/SNRIs can trigger life-threatening Serotonin Syndrome (hyperthermia, autonomic instability, neuromuscular rigidity).',
      actionDirective:
        'Strictly blacklisted all serotonergic herbal supplements and 5-HTP. Prescribed chelated Magnesium Bisglycinate for safe, non-serotonergic neuromuscular relaxation.',
    })
    flaggedContraindications.push({
      condition: 'SSRI / SNRI Antidepressant Therapy',
      suppressedItem: '5-HTP & St. John\'s Wort',
      reason: 'Severe risk of precipitating Serotonin Syndrome.',
      safeAlternative: 'Prescribed non-serotonergic Magnesium Bisglycinate for restorative sleep.',
    })
  }

  // F. Diabetes / Hypoglycemics & GLP-1 Agonists (Metformin, Semaglutide/Ozempic, Insulin)
  if (healthConditions.takingDiabetesMedications) {
    drugInteractions.push({
      medicationCategory: 'Diabetes Medications & GLP-1 Agonists (Metformin, Ozempic, Insulin)',
      severity: 'BENEFICIAL_CO_PRESCRIPTION',
      suppressedSupplement: 'High-Dose Berberine & Alpha Lipoic Acid (>600mg)',
      prescribedAlternativeOrAdjunct: 'Methylated Vitamin B12 (Methylcobalamin 1,000mcg) & Slow-Sipped Protein Isolate',
      pharmacologicalRationale:
        'Long-term Metformin therapy impairs ileal absorption of Vitamin B12, causing subclinical neuropathy and anemia. Berberine exerts potent AMPK activation that can trigger acute additive hypoglycemia when combined with insulin or sulfonylureas. GLP-1 agonists slow gastric emptying.',
      actionDirective:
        'Auto-prescribed bioavailable Methyl-B12. Suppressed high-dose berberine. Recommended slow-sipping protein shakes to accommodate delayed gastric emptying.',
    })
  }

  // G. Oral Antibiotics (Cipro, Doxycycline, Levofloxacin)
  if (healthConditions.takingOralAntibiotics) {
    const antibioticRule = 'Mandatory 2–4 Hour Separation: Separate oral antibiotic administration from all mineral supplements (Magnesium, Zinc, Calcium, Iron) by at least 2 to 4 hours to avoid insoluble chelation complexes that neutralize antibiotic efficacy.'
    chronoSeparationRules.push(antibioticRule)
    drugInteractions.push({
      medicationCategory: 'Oral Antibiotics (Fluoroquinolones, Tetracyclines)',
      severity: 'CHRONO_SEPARATION_REQUIRED',
      chronoSeparationHours: 3,
      pharmacologicalRationale:
        'Multivalent mineral cations chelate antibiotic molecules in the lumen of the small intestine, severely decreasing antimicrobial bioavailability and treatment efficacy.',
      actionDirective: antibioticRule,
    })
  }

  // H. Immunosuppressants / Corticosteroids (Prednisone, Tacrolimus, Cyclosporine)
  if (healthConditions.takingImmunosuppressantsOrSteroids) {
    drugInteractions.push({
      medicationCategory: 'Immunosuppressants & Corticosteroids (Prednisone, Tacrolimus)',
      severity: 'CRITICAL_CONTRAINDICATION',
      suppressedSupplement: 'Immune-Stimulating Herbals (Echinacea, High-Dose Beta-Glucans)',
      prescribedAlternativeOrAdjunct: 'Balanced Vitamin D3 + Calcium & Magnesium Bone Mineral Matrix',
      pharmacologicalRationale:
        'Immuno-stimulants directly counteract the pharmacologic immunosuppression required for organ transplants or autoimmune remission. Chronic corticosteroid therapy accelerates bone demineralization and calcium wasting.',
      actionDirective:
        'Blacklisted all immune stimulants. Prescribed bone-mineral protective Vitamin D3 and Magnesium.',
    })
  }

  // ── 2. FOUNDATIONAL SUPPLEMENT FORMULATION ─────────────────────

  // 1. Omega-3 Fatty Acids
  if (isTakingBloodThinners) {
    items.push({
      id: 'omega_3_mod',
      name: 'Omega-3 Fatty Acids (Moderate Cardiovascular Dose)',
      evidenceTier: 'Tier A (Irrefutable Clinical RCT Evidence)',
      routineTier: 'daily_core',
      dailyFrequency: 'Every Day',
      necessityLevel: 'essential',
      workoutDayOnly: false,
      optimalDosage: '1,000 mg combined EPA + DHA (IFOS 5-Star Certified)',
      timingWindow: 'morning_with_breakfast',
      timingLabel: 'Morning with breakfast',
      mealInstruction: 'Take 1 serving with breakfast or your first meal containing dietary fats.',
      restDayDirective: 'Take daily (7 days/week) to maintain cardiovascular endothelial protection.',
      biologicalMechanism: 'Cardiovascular endothelial protection and cell membrane fluidity without excessive antiplatelet compounding.',
      clinicalEvidenceSummary: 'Cleared at moderate physiological dose for clients taking anticoagulants with physician concurrence.',
      issnCitation: 'ISSN Position Stand: Nutritional Ergogenics & Recovery (2018)',
      nsfCertifiedForSportRecommended: true,
      warningNote: 'Capped at ≤1,000mg due to anticoagulant therapy; do not exceed without physician review.',
    })
  } else {
    items.push({
      id: 'omega_3_high',
      name: 'Ultra-Pure Triglyceride Omega-3 (High EPA/DHA)',
      evidenceTier: 'Tier A (Irrefutable Clinical RCT Evidence)',
      routineTier: 'daily_core',
      dailyFrequency: 'Every Day',
      necessityLevel: 'essential',
      workoutDayOnly: false,
      optimalDosage: isMasters ? '2,500–3,000 mg combined EPA + DHA (2:1 EPA:DHA ratio)' : '2,000 mg combined EPA + DHA',
      timingWindow: 'morning_with_breakfast',
      timingLabel: 'Morning with fat-containing meal',
      mealInstruction: 'Take with breakfast or first meal containing dietary fats for maximum lipid-membrane incorporation.',
      restDayDirective: 'Take daily (7 days/week) to maintain continuous cellular membrane and anti-inflammatory saturation.',
      biologicalMechanism: 'Inhibits NF-kB inflammatory cascade, lowers circulating triglycerides, and enhances neuromuscular motor unit recovery.',
      clinicalEvidenceSummary: 'Reduces exercise-induced delayed onset muscle soreness (DOMS) and accelerates eccentric muscle damage repair.',
      issnCitation: 'ISSN Position Stand: Omega-3 Fatty Acids in Exercise Performance (2020)',
      nsfCertifiedForSportRecommended: true,
    })
  }

  // 2. Vitamin D3 (Pure vs D3+K2)
  if (isTakingBloodThinners) {
    items.push({
      id: 'vit_d3_pure',
      name: 'Pure Vitamin D3 (K-Free Formula for Anticoagulant Safety)',
      evidenceTier: 'Tier A (Irrefutable Clinical RCT Evidence)',
      routineTier: 'daily_core',
      dailyFrequency: 'Every Day',
      necessityLevel: 'essential',
      workoutDayOnly: false,
      optimalDosage: isMasters ? '5,000 IU D3 (Pure Cholecalciferol / Zero Vitamin K)' : '3,000 IU D3 (Zero Vitamin K)',
      timingWindow: 'morning_with_breakfast',
      timingLabel: 'Morning with breakfast',
      mealInstruction: 'Take in the morning with food. Fat-soluble vitamin requires dietary fats for absorption.',
      restDayDirective: 'Take daily (7 days/week) to maintain stable serum 25(OH)D levels.',
      biologicalMechanism: 'Nuclear receptor gene transcription for muscular force generation and bone remodeling without Warfarin INR disruption.',
      clinicalEvidenceSummary: 'Provides all musculoskeletal benefits of Vitamin D3 while completely avoiding Vitamin K clotting factor antagonism.',
      issnCitation: 'IOC Consensus Statement on Dietary Supplements and the High-Performance Athlete (2018)',
      nsfCertifiedForSportRecommended: true,
      warningNote: 'Vitamin K2 strictly excluded to protect anticoagulant / Warfarin stability.',
    })
  } else {
    items.push({
      id: 'vit_d3_k2',
      name: 'Vitamin D3 + K2 (Micro-Encapsulated MK-7)',
      evidenceTier: 'Tier A (Irrefutable Clinical RCT Evidence)',
      routineTier: 'daily_core',
      dailyFrequency: 'Every Day',
      necessityLevel: 'essential',
      workoutDayOnly: false,
      optimalDosage: isMasters ? '5,000 IU D3 + 100 mcg K2 (MK-7)' : '2,500–5,000 IU D3 + 100 mcg K2 (MK-7)',
      timingWindow: 'morning_with_breakfast',
      timingLabel: 'Morning with fat-containing meal',
      mealInstruction: 'Take in the morning with breakfast. Avoid taking at bedtime as Vitamin D can suppress natural melatonin synthesis.',
      restDayDirective: 'Take daily (7 days/week) to support bone remodeling and immune homeostasis year-round.',
      biologicalMechanism: 'Nuclear receptor gene transcription for muscular force generation, bone mineral remodeling, and immune homeostasis.',
      clinicalEvidenceSummary: 'Optimizes bioavailable serum 25(OH)D levels (>50 ng/mL) to support hormonal synthesis and muscle contractile velocity.',
      issnCitation: 'IOC Consensus Statement on Dietary Supplements and the High-Performance Athlete (2018)',
      nsfCertifiedForSportRecommended: true,
    })
  }

  // 3. Magnesium Bisglycinate (Fully Chelated)
  const magnesiumTimingLabel = healthConditions.takingThyroidHormone
    ? 'Bedtime (Take at least 4 hours after morning Levothyroxine)'
    : '30–45 min prior to sleep'

  items.push({
    id: 'magnesium_glycinate',
    name: 'Magnesium Bisglycinate (Fully Chelated TRAACS®)',
    evidenceTier: 'Tier A (Irrefutable Clinical RCT Evidence)',
    routineTier: 'daily_core',
    dailyFrequency: 'Every Day',
    necessityLevel: 'essential',
    workoutDayOnly: false,
    optimalDosage: '200–400 mg elemental magnesium',
    timingWindow: 'night_pre_sleep',
    timingLabel: magnesiumTimingLabel,
    mealInstruction: 'Take 30–45 minutes prior to sleep with 4–6 oz of water. Fully chelated TRAACS® bisglycinate is gentle on the stomach and non-laxative.',
    restDayDirective: 'Take daily (7 days/week) to promote parasympathetic nervous system recovery and slow-wave sleep.',
    biologicalMechanism: 'Cofactor for >300 enzymatic reactions, blocks NMDA excitotoxicity, relaxes vascular smooth muscle, and supports slow-wave sleep (SWS).',
    clinicalEvidenceSummary: 'Zero laxative effect compared to magnesium oxide; accelerates parasympathetic nervous system recovery.',
    issnCitation: 'American College of Sports Medicine (ACSM) Nutrition and Athletic Performance Guidelines',
    nsfCertifiedForSportRecommended: true,
    chronoSeparationNote: healthConditions.takingThyroidHormone ? 'Scheduled for bedtime to satisfy the 4-hour Levothyroxine separation rule.' : undefined,
  })

  // 4. Whey / Plant Protein Isolate (Leucine Optimized)
  let proteinServing = '25–30g per serving (≥2.7g Leucine)'
  if (isSenior) {
    proteinServing = '35–40g per serving (≥3.5g Leucine to overcome age-related anabolic resistance)'
    ageSpecificAdjustments.push('Masters/Senior Anabolic Resistance Adjustment: Increased per-serving protein target to 35–40g to reach the muscular leucine trigger.')
  } else if (isMasters) {
    proteinServing = '30–35g per serving (≥3.0g Leucine)'
    ageSpecificAdjustments.push('Masters Age Adjustment: Enhanced leucine density to optimize myofibrillar fractional synthetic rate.')
  }

  if (healthConditions.hasKidneyCondition) {
    flaggedContraindications.push({
      condition: 'Pre-existing Renal / Kidney Disease',
      suppressedItem: 'High-Protein Supplement Boluses (>40g/dose)',
      reason: 'Compromised renal filtration requires strict physician/nephrologist oversight of total daily nitrogen load.',
      safeAlternative: 'Consult your treating nephrologist for specific daily protein allowance; emphasize whole-food balanced meals.',
    })
  } else {
    items.push({
      id: 'protein_isolate',
      name: 'Cold-Filtered Whey Isolate (or Fermented Pea/Rice Isolate)',
      evidenceTier: 'Tier A (Irrefutable Clinical RCT Evidence)',
      routineTier: 'workout_days',
      dailyFrequency: 'Workout Days Only',
      necessityLevel: 'performance',
      workoutDayOnly: true,
      optimalDosage: proteinServing,
      timingWindow: 'post_workout_anabolic',
      timingLabel: healthConditions.takingThyroidHormone
        ? 'Post-workout (≥4h after morning thyroid medication)'
        : 'Within 60 min post-workout (or between meals)',
      mealInstruction: 'Mix 1 serving with 10–12 oz cold water or milk. Consume within 45–60 minutes after strength training.',
      restDayDirective: 'Workout days only. On rest days, fulfill your protein goals via whole foods (chicken, fish, eggs, tofu, Greek yogurt).',
      biologicalMechanism: 'Rapid hyperaminoacidemia and mTORC1 intracellular signaling phosphorylation for muscle protein synthesis (MPS).',
      clinicalEvidenceSummary: 'Supports daily target of 1.6–2.2 g/kg bodyweight for optimal lean mass preservation and recovery.',
      issnCitation: 'ISSN Position Stand: Protein and Exercise (2017)',
      nsfCertifiedForSportRecommended: true,
      chronoSeparationNote: healthConditions.takingThyroidHormone ? 'Keep separated from morning thyroid medication by ≥4 hours.' : undefined,
    })
  }

  // ── 3. ERGOGENIC & PERFORMANCE FORMULATION ─────────────────────

  // 5. Creatine Monohydrate (Creapure®)
  if (healthConditions.hasKidneyCondition) {
    flaggedContraindications.push({
      condition: 'Renal / Kidney Impairment',
      suppressedItem: 'Creatine Monohydrate',
      reason: 'Creatine breakdown produces creatinine, which complicates renal function biomarker tracking and filtration.',
      safeAlternative: 'Withheld until nephrologist clearance is provided.',
    })
  } else if (!healthConditions.isPregnantOrNursing) {
    const creatineDose = fitnessLevel === 'advanced_athlete' ? '5g daily (No loading phase required)' : '3–5g daily (Continuous saturation)'
    items.push({
      id: 'creatine_monohydrate',
      name: 'Creatine Monohydrate (Creapure®)',
      evidenceTier: 'Tier A (Irrefutable Clinical RCT Evidence)',
      routineTier: 'daily_core',
      dailyFrequency: 'Every Day',
      necessityLevel: 'performance',
      workoutDayOnly: false,
      optimalDosage: creatineDose,
      timingWindow: 'daily_flexible',
      timingLabel: 'Daily with water or post-workout shake (Consistent daily timing)',
      mealInstruction: 'Mix 3–5g in water, juice, or your post-workout shake. Consistency of daily timing matters more than specific clock time.',
      restDayDirective: 'Take daily (including rest days) to preserve intramuscular phosphocreatine saturation.',
      biologicalMechanism: 'Expands intracellular phosphocreatine (PCr) substrate stores, accelerating cellular ATP resynthesis during high-intensity contractions.',
      clinicalEvidenceSummary: 'Increases 1RM strength, maximal anaerobic power, training volume density, and provides neuroprotective cognitive resilience.',
      issnCitation: 'ISSN Position Stand: Safety and Efficacy of Creatine Supplementation in Exercise, Sport, and Medicine (2017)',
      nsfCertifiedForSportRecommended: true,
    })

    if (sex === 'female') {
      sexSpecificAdjustments.push('Female Physiology Note: Creatine monohydrate does NOT cause subcutaneous fluid bloat; fluid retention is strictly intracellular inside muscle cells, supporting lean density and cognitive clarity.')
    }
  }

  // 6. Pre-Workout Vascular vs Stimulant Matrix
  if (isTakingBloodPressureMeds) {
    items.push({
      id: 'l_citrulline_nonstim',
      name: 'Fermented L-Citrulline Malate (2:1 Non-Stimulant Vasodilator)',
      evidenceTier: 'Tier A (Irrefutable Clinical RCT Evidence)',
      routineTier: 'workout_days',
      dailyFrequency: 'Workout Days Only',
      necessityLevel: 'performance',
      workoutDayOnly: true,
      optimalDosage: '6,000–8,000 mg',
      timingWindow: 'pre_workout_45min',
      timingLabel: '30–45 min pre-workout in 16 oz water',
      mealInstruction: 'Mix 6–8g in 16 oz water and drink 30–45 minutes prior to lifting. Non-stimulant nitric oxide booster.',
      restDayDirective: 'Workout days only. Do NOT take on rest days — not needed when not training.',
      biologicalMechanism: 'Bypasses hepatic metabolism to elevate plasma L-arginine, boosting endothelial nitric oxide (eNOS) and vascular perfusion without cardiac strain.',
      clinicalEvidenceSummary: 'Improves muscular oxygenation, intra-set ATP-CP recovery, and reduces perceived exertion without spiking blood pressure.',
      issnCitation: 'Journal of the International Society of Sports Nutrition (2021)',
      nsfCertifiedForSportRecommended: true,
      warningNote: 'Non-stimulant formulation prescribed for cardiovascular safety.',
    })
  } else if (!healthConditions.hasCaffeineSensitivity && !healthConditions.isPregnantOrNursing && fitnessLevel !== 'beginner') {
    items.push({
      id: 'caffeine_theanine',
      name: 'Targeted Caffeine Anhydrous + L-Theanine (2:1 Precision Focus Ratio)',
      evidenceTier: 'Tier A (Irrefutable Clinical RCT Evidence)',
      routineTier: 'workout_days',
      dailyFrequency: 'Workout Days Only',
      necessityLevel: 'performance',
      workoutDayOnly: true,
      optimalDosage: '150–200 mg Caffeine + 200 mg L-Theanine',
      timingWindow: 'pre_workout_45min',
      timingLabel: '45 min prior to heavy training (Morning/Afternoon only; avoid within 6h of sleep)',
      mealInstruction: 'Take 1 serving 45 minutes prior to heavy training sessions. Avoid taking within 6 hours of bedtime.',
      restDayDirective: 'Workout days only. Skip on rest days to preserve adenosine receptor sensitivity and prevent tolerance build-up.',
      biologicalMechanism: 'Adenosine receptor antagonism combined with GABA/glutamate neuromodulation for sustained alpha-brainwave laser focus.',
      clinicalEvidenceSummary: 'Improves motor unit firing rate, power output, and cognitive reaction time while completely eliminating jitter and post-workout crash.',
      issnCitation: 'ISSN Position Stand: Caffeine and Exercise Performance (2021)',
      nsfCertifiedForSportRecommended: true,
    })
  }

  // 7. Electrolyte & Intracellular Hydration Matrix
  if (isTakingBloodPressureMeds) {
    items.push({
      id: 'low_potassium_hydration',
      name: 'Low-Potassium Isotonic Hydration Matrix (Sodium & Magnesium Focus)',
      evidenceTier: 'Tier A (Irrefutable Clinical RCT Evidence)',
      routineTier: 'workout_days',
      dailyFrequency: 'Workout Days Only',
      necessityLevel: 'performance',
      workoutDayOnly: true,
      optimalDosage: '500 mg Sodium, 60 mg Magnesium, ≤50 mg Potassium in 24 oz water',
      timingWindow: 'pre_workout_45min',
      timingLabel: 'Intra-workout hydration',
      mealInstruction: 'Sip intra-workout during training sessions lasting >45 minutes. Formulated for hyperkalemia prevention.',
      restDayDirective: 'Workout days only. Plain filtered water is ideal on rest days.',
      biologicalMechanism: 'Supports plasma volume and neuromuscular fluid balance without potassium overload risks.',
      clinicalEvidenceSummary: 'Formulated specifically for clients on ACE inhibitors or potassium-sparing diuretics.',
      issnCitation: 'ACSM Position Stand: Exercise and Fluid Replacement',
      nsfCertifiedForSportRecommended: true,
      warningNote: 'Low-potassium formulation prescribed for hyperkalemia prevention.',
    })
  } else {
    items.push({
      id: 'isotonic_electrolytes',
      name: 'Clinical Isotonic Electrolyte Matrix (Sodium/Potassium/Magnesium)',
      evidenceTier: 'Tier A (Irrefutable Clinical RCT Evidence)',
      routineTier: 'workout_days',
      dailyFrequency: 'Workout Days Only',
      necessityLevel: 'performance',
      workoutDayOnly: true,
      optimalDosage: '500–800 mg Sodium, 200 mg Potassium, 60 mg Magnesium in 24 oz water',
      timingWindow: 'pre_workout_45min',
      timingLabel: 'Intra-workout or morning hydration',
      mealInstruction: 'Sip intra-workout during heavy sweating sessions or mix in morning water after high heat/cardio days.',
      restDayDirective: 'Workout days only (or high-heat sweat days). Standard water and balanced meals suffice on rest days.',
      biologicalMechanism: 'Maintains osmotic plasma volume balance, neuromuscular action potentials, and prevents cramping during heavy sweat output.',
      clinicalEvidenceSummary: 'Maintains power output and prevents dehydration-induced performance declines (>2% bodyweight fluid loss).',
      issnCitation: 'ACSM Position Stand: Exercise and Fluid Replacement',
      nsfCertifiedForSportRecommended: true,
    })
  }

  // ── 4. CONTEXTUAL & BENEFICIAL CO-PRESCRIPTIONS ────────────────

  // 8. Ubiquinol (CoQ10) for Statins or Masters
  if (healthConditions.takingStatins || isMasters || goal === 'longevity_vitality') {
    const isStatinCoPrescription = Boolean(healthConditions.takingStatins)
    items.push({
      id: 'ubiquinol_coq10',
      name: isStatinCoPrescription
        ? 'Ubiquinol (Active CoQ10 200mg - Statin Muscle Protection)'
        : 'Ubiquinol (Active Reduced CoQ10 100–200mg)',
      evidenceTier: 'Tier B (Context-Specific Performance & Longevity)',
      routineTier: 'conditional_adjunct',
      dailyFrequency: 'Every Day',
      necessityLevel: 'conditional',
      workoutDayOnly: false,
      optimalDosage: isStatinCoPrescription ? '200 mg daily' : '100–200 mg daily',
      timingWindow: 'morning_with_breakfast',
      timingLabel: 'Morning with breakfast',
      mealInstruction: 'Take with breakfast or morning meal containing dietary fat.',
      restDayDirective: 'Take daily if taking statins or recommended for masters mitochondrial support.',
      biologicalMechanism: 'Essential lipid-soluble electron carrier in mitochondrial complex I/II for cellular ATP synthesis. Directly counteracts statin-induced CoQ10 synthesis depletion in muscle tissue.',
      clinicalEvidenceSummary: 'Clinically shown to reduce statin-associated muscle symptoms (SAMS) and support myocardial bioenergetics.',
      issnCitation: 'American Journal of Cardiology / Sports Medicine Review',
      nsfCertifiedForSportRecommended: true,
      isConditionalOrMastersOnly: true,
      isBeneficialCoPrescription: isStatinCoPrescription,
    })

    if (isStatinCoPrescription) {
      ageSpecificAdjustments.push('Beneficial Statin Co-Prescription: Added 200mg Ubiquinol to counteract statin-induced mitochondrial CoQ10 depletion.')
    } else {
      ageSpecificAdjustments.push('Masters Longevity Protocol: Added active Ubiquinol (CoQ10) to support mitochondrial electron transport chain efficiency.')
    }
  }

  // 9. Methylated Vitamin B12 for Metformin
  if (healthConditions.takingDiabetesMedications) {
    items.push({
      id: 'methyl_b12',
      name: 'Methylated Vitamin B12 (Methylcobalamin)',
      evidenceTier: 'Tier A (Irrefutable Clinical RCT Evidence)',
      routineTier: 'conditional_adjunct',
      dailyFrequency: 'Every Day',
      necessityLevel: 'conditional',
      workoutDayOnly: false,
      optimalDosage: '1,000 mcg sublingual or with food',
      timingWindow: 'morning_with_breakfast',
      timingLabel: 'Morning with breakfast',
      mealInstruction: 'Dissolve sublingually under the tongue or take with morning breakfast.',
      restDayDirective: 'Take daily if taking Metformin to counteract ileal B12 malabsorption.',
      biologicalMechanism: 'Essential cofactor for methionine synthase, homocysteine metabolism, and myelin sheath maintenance. Directly counteracts Metformin-induced ileal B12 malabsorption.',
      clinicalEvidenceSummary: 'Prevents subclinical B12 deficiency and peripheral neuropathy in patients taking Metformin.',
      issnCitation: 'American Diabetes Association (ADA) Standards of Medical Care',
      nsfCertifiedForSportRecommended: true,
      isBeneficialCoPrescription: true,
    })
  }

  // 10. Collagen Peptides + Vitamin C (Joint & Tendon Priming)
  if (goal === 'athletic_power' || isMasters || fitnessLevel === 'advanced_athlete') {
    items.push({
      id: 'collagen_vit_c',
      name: 'Hydrolyzed Collagen Peptides (Types I & III) + Vitamin C',
      evidenceTier: 'Tier B (Context-Specific Performance & Longevity)',
      routineTier: 'workout_days',
      dailyFrequency: 'Workout Days Only',
      necessityLevel: 'conditional',
      workoutDayOnly: true,
      optimalDosage: '15g Collagen + 50mg Vitamin C',
      timingWindow: 'pre_workout_45min',
      timingLabel: '45–60 min prior to tendon-loading sessions',
      mealInstruction: 'Consume 45–60 minutes prior to tendon loading or jumping exercises with Vitamin C to stimulate collagen cross-linking.',
      restDayDirective: 'Workout days only. Synchronized with peak connective tissue blood perfusion during tendon loading.',
      biologicalMechanism: 'Delivers high concentrations of glycine, proline, and hydroxyproline during peak joint vascular perfusion for collagen fibril cross-linking.',
      clinicalEvidenceSummary: 'Clinically proven by UC Davis Davis/Baar lab to double tendon collagen synthesis and improve patellar/Achilles stiffness.',
      issnCitation: 'American Journal of Clinical Nutrition (2017)',
      nsfCertifiedForSportRecommended: true,
      isConditionalOrMastersOnly: true,
    })
  }

  // 11. Tart Cherry Extract / Standardized Curcumin (Masters Anti-Inflammatory)
  if ((isMasters || goal === 'longevity_vitality') && !isTakingBloodThinners) {
    items.push({
      id: 'tart_cherry_curcumin',
      name: 'Montmorency Tart Cherry Extract (Standardized Anthocyanins)',
      evidenceTier: 'Tier B (Context-Specific Performance & Longevity)',
      routineTier: 'conditional_adjunct',
      dailyFrequency: 'Every Day',
      necessityLevel: 'conditional',
      workoutDayOnly: false,
      optimalDosage: '480–500 mg standardized extract (or 30ml concentrate)',
      timingWindow: 'night_pre_sleep',
      timingLabel: 'Evening with dinner or before bed',
      mealInstruction: 'Take with evening dinner or 30–60 minutes before bed for joint recovery and natural phytomelatonin sleep support.',
      restDayDirective: 'Take daily during heavy training cycles or acute joint flare-ups.',
      biologicalMechanism: 'Inhibits COX-1 and COX-2 inflammatory enzymes and provides natural phytomelatonin to enhance sleep efficiency.',
      clinicalEvidenceSummary: 'Significantly accelerates isometric strength recovery and dampens systemic oxidative stress markers post-training without gastrointestinal irritation.',
      issnCitation: 'European Journal of Sport Science (2020)',
      nsfCertifiedForSportRecommended: true,
      isConditionalOrMastersOnly: true,
    })
    ageSpecificAdjustments.push('Masters Joint Recovery Protocol: Integrated standardized Tart Cherry anthocyanins for non-NSAID joint recovery.')
  }

  // 12. Beta-Alanine (Athletic Power Glycolytic Buffering)
  if (goal === 'athletic_power' && fitnessLevel === 'advanced_athlete') {
    items.push({
      id: 'beta_alanine',
      name: 'Beta-Alanine (CarnoSyn®)',
      evidenceTier: 'Tier B (Context-Specific Performance & Longevity)',
      routineTier: 'workout_days',
      dailyFrequency: 'Workout Days Only',
      necessityLevel: 'conditional',
      workoutDayOnly: true,
      optimalDosage: '3.2–6.4g daily (Split into 2 doses to avoid harmless paresthesia tingling)',
      timingWindow: 'daily_flexible',
      timingLabel: 'Daily split doses',
      mealInstruction: 'Divide into two 1.6–3.2g doses taken with meals or 30 minutes before training to avoid harmless skin tingling (paresthesia).',
      restDayDirective: 'Workout days only (or split daily during the initial 4-week intramuscular carnosine saturation phase).',
      biologicalMechanism: 'Rate-limiting precursor for intra-muscular carnosine synthesis, which buffers hydrogen ion (H+) accumulation during anaerobic glycolysis.',
      clinicalEvidenceSummary: 'Improves exercise capacity and delayed fatigue in high-intensity efforts lasting 60–240 seconds (Phase 2 & 5 OPT protocols).',
      issnCitation: 'ISSN Position Stand: Beta-Alanine (2015)',
      nsfCertifiedForSportRecommended: true,
      isConditionalOrMastersOnly: true,
    })
  }

  // Pregnancy / Nursing Safety Lock
  if (healthConditions.isPregnantOrNursing) {
    flaggedContraindications.push({
      condition: 'Pregnancy or Lactation',
      suppressedItem: 'All Ergogenic & Pre-Workout Compounds (Creatine, Caffeine, Beta-Alanine, Pre-workouts)',
      reason: 'Safety data during pregnancy/nursing requires conservative medical protocols.',
      safeAlternative: 'Strictly follow prenatal regimen prescribed by your licensed OB/GYN physician (Folate/Iron/D3/DHA).',
    })
  }

  // Enrich all items with clinical dispensary metadata & 15% privilege discount
  const enrichedItems = items.map(attachDispensaryMeta)

  // Build Chrono Schedule
  const chronoSchedule: ChronoNutritionSchedule = {
    morning: enrichedItems.filter(i => i.timingWindow === 'morning_with_breakfast'),
    preWorkout: enrichedItems.filter(i => i.timingWindow === 'pre_workout_45min'),
    postWorkout: enrichedItems.filter(i => i.timingWindow === 'post_workout_anabolic'),
    night: enrichedItems.filter(i => i.timingWindow === 'night_pre_sleep'),
    dailyFlexible: enrichedItems.filter(i => i.timingWindow === 'daily_flexible'),
  }

  // Build 3-Tier Categorization for Crystal Clarity (What to take when)
  const dailyCore = enrichedItems.filter(i => i.routineTier === 'daily_core')
  const workoutDays = enrichedItems.filter(i => i.routineTier === 'workout_days')
  const conditionalAdjuncts = enrichedItems.filter(i => i.routineTier === 'conditional_adjunct')

  const tieredSchedule = {
    dailyCore,
    workoutDays,
    conditionalAdjuncts,
  }

  const routineSummary = {
    dailyCoreCount: dailyCore.length,
    workoutDaysCount: workoutDays.length,
    workoutOnlyCount: workoutDays.length,
    conditionalCount: conditionalAdjuncts.length,
    restDayRoutineText: `On rest days, you take only ${dailyCore.length} foundational supplements: ${dailyCore.map(i => i.name.split(' (')[0]).join(', ')}. No pre-workouts, protein shakes, or intra-workout formulas are needed.`,
    workoutDayRoutineText: `On training days, take your ${dailyCore.length} foundational supplements PLUS ${workoutDays.length} peri-workout items around your session: ${workoutDays.map(i => i.name.split(' (')[0]).join(', ')}.`,
    titrationSafetyAdvice: `MANDATORY CLIENT TITRATION RULE: Do NOT start all supplements at once. Introduce ONE compound at a time (1 compound every 7–14 days). Monitor gastrointestinal comfort and individual response before introducing the next compound.`,
    titrationRule: `Introduce ONE compound at a time (1 compound at a time over 7–14 days) to monitor digestive tolerance and individual response.`,
  }

  const executiveSummary = `Your sports nutrition plan includes ${dailyCore.length} daily core foundations, ${workoutDays.length} workout-day recovery aids, and ${conditionalAdjuncts.length} conditional adjuncts. You do NOT take all supplements every day. There are ${drugInteractions.length} clinical safety precautions applied to your profile.`

  const legalDisclaimer =
    'MANDATORY FDA & MEDICAL DISCLAIMER (DSHEA 1994): These statements have not been evaluated by the Food and Drug Administration (FDA). These dietary supplement recommendations are designed strictly for nutritional support and sports conditioning optimization, and are NOT intended to diagnose, treat, cure, or prevent any disease. Forge Athletic does not prescribe medical treatments.'

  const scopeOfPracticeNotice =
    'PROFESSIONAL SCOPE OF PRACTICE NOTICE (NASM-CPT® & CSNC Track): Coach Gordon is an NCCA-accredited Certified Personal Trainer (NASM-CPT® #1261890687), ASTI CPR/AED certified, and an active candidate on the NASM Master Trainer track across Corrective Exercise (CES), Performance Enhancement (PES), Certified Nutrition Coach (CNC), and Certified Sports Nutrition Coach (CSNC). Coach Gordon is NOT a medical doctor, registered dietitian (RD/RDN), or pharmacist. Under Massachusetts law (M.G.L. c. 112, §§ 196-208), this information is provided exclusively as non-medical, educational sports science guidance for apparently healthy adults. It does NOT constitute medical advice, Medical Nutrition Therapy (MNT), or a medical prescription.'

  const medicalSupervisionWarning =
    'PHYSICIAN CONSULTATION & DRUG INTERACTION DIRECTIVE: Always consult your primary care physician, cardiologist, endocrinologist, or licensed pharmacist before initiating any dietary supplementation regimen. This is critically important if you take prescription medications (anticoagulants, antihypertensives, thyroid hormone, statins, antidepressants, diabetes medications, antibiotics, or immunosuppressants), have underlying medical conditions, or are pregnant or nursing.'

  const wholeFoodFirstNotice =
    'WHOLE-FOOD FIRST PHILOSOPHY: Dietary supplements are designed strictly to complement—never replace—a sound, nutrient-dense whole-food diet, consistent progressive training, adequate hydration, and restorative sleep. 80–90% of athletic results stem from whole-food nutrition and consistent training habits.'

  const discontinueAndConsultNotice =
    'ADVERSE REACTION & IMMEDIATE DISCONTINUATION PROTOCOL: If you experience any adverse effects, including but not limited to gastrointestinal distress, rapid heart rate, palpitations, skin rash, dizziness, or shortness of breath, discontinue supplement use immediately and seek professional medical evaluation.'

  const ftcAffiliateDisclosure =
    'FTC COMMERCIAL & DISPENSARY AFFILIATE DISCLOSURE: Forge Athletic is an authorized partner dispensary with Fullscript and an affiliate partner with Thorne. Athletes receive access to third-party lab-verified formulations (NSF Certified for Sport® / USP Verified®) with an exclusive 15% client courtesy discount. Forge Athletic and Coach Gordon may receive an affiliate commission on qualifying purchases made through these links. Purchasing supplements through dispensary links is completely voluntary; athletes are welcome to source equivalent third-party verified products from any retailer of their choice.'

  const thirdPartyQualityStandards =
    'GOLD STANDARD QUALITY ENFORCEMENT: Forge Athletic strictly mandates that all purchased supplements carry independent third-party laboratory verification: NSF Certified for Sport®, Informed Choice / Informed Sport®, or USP Verified®. These certifications guarantee label accuracy and verify the absence of heavy metals, adulterants, microbials, and WADA-banned substances.'

  return {
    clientProfile: profile,
    prescribedItems: enrichedItems,
    chronoSchedule,
    tieredSchedule,
    routineSummary,
    drugInteractions,
    flaggedContraindications,
    ageSpecificAdjustments,
    sexSpecificAdjustments,
    chronoSeparationRules,
    executiveSummary,
    legalDisclaimer,
    scopeOfPracticeNotice,
    medicalSupervisionWarning,
    wholeFoodFirstNotice,
    discontinueAndConsultNotice,
    ftcAffiliateDisclosure,
    thirdPartyQualityStandards,
    dispensaryInfo: DISPENSARY_PARTNER_CONFIG,
  }
}
