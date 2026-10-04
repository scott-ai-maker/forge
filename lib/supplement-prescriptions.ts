/**
 * Evidence-Based Sports Science Supplementation Prescription Engine & Pharmacological Interaction Shield
 * Strictly governed by ISSN, ACSM, IOC consensus, and clinical pharmacokinetics standards.
 * Features automated prescription drug-supplement interaction screening and zero-liability FDA protection.
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
  optimalDosage: string
  timingWindow: TimingWindow
  timingLabel: string
  biologicalMechanism: string
  clinicalEvidenceSummary: string
  issnCitation: string
  nsfCertifiedForSportRecommended: boolean
  isConditionalOrMastersOnly?: boolean
  isBeneficialCoPrescription?: boolean
  chronoSeparationNote?: string
  warningNote?: string
  recommendedBrand?: string
  dispensarySku?: string
  dispensaryUrl?: string
  retailPriceEstimate?: string
  clientDiscountPrice?: string
}

export const DISPENSARY_PARTNER_CONFIG = {
  partnerName: 'Gordon Athletic Clinical Dispensary',
  platform: 'Fullscript & Thorne Partner Dispensaries',
  discountPercentage: 15,
  defaultFullscriptUrl: process.env.NEXT_PUBLIC_FULLSCRIPT_DISPENSARY_URL || 'https://us.fullscript.com/welcome/gordonathletic',
  defaultThorneUrl: process.env.NEXT_PUBLIC_THORNE_DISPENSARY_URL || 'https://www.thorne.com/u/gordonathletic',
  standards: [
    '100% 3rd-Party Lab Verified (NSF for Sport / USP / Informed Choice)',
    'Cold-Chain Temperature Controlled Warehousing & Direct Manufacturer Shipping',
    'Zero Artificial Sweeteners, Fillers, or Heavy Metal Contaminants',
  ],
}

export function getDispensaryPartnerInfo() {
  return DISPENSARY_PARTNER_CONFIG
}

export function buildDispensaryItemUrl(dispensarySku?: string): string {
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
  thirdPartyQualityStandards: string
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
    item.dispensaryUrl = buildDispensaryItemUrl(meta.sku)
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
      optimalDosage: '1,000 mg combined EPA + DHA (IFOS 5-Star Certified)',
      timingWindow: 'morning_with_breakfast',
      timingLabel: 'Morning with breakfast',
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
      optimalDosage: isMasters ? '2,500–3,000 mg combined EPA + DHA (2:1 EPA:DHA ratio)' : '2,000 mg combined EPA + DHA',
      timingWindow: 'morning_with_breakfast',
      timingLabel: 'Morning with fat-containing meal',
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
      optimalDosage: isMasters ? '5,000 IU D3 (Pure Cholecalciferol / Zero Vitamin K)' : '3,000 IU D3 (Zero Vitamin K)',
      timingWindow: 'morning_with_breakfast',
      timingLabel: 'Morning with breakfast',
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
      optimalDosage: isMasters ? '5,000 IU D3 + 100 mcg K2 (MK-7)' : '2,500–5,000 IU D3 + 100 mcg K2 (MK-7)',
      timingWindow: 'morning_with_breakfast',
      timingLabel: 'Morning with fat-containing meal',
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
    optimalDosage: '200–400 mg elemental magnesium',
    timingWindow: 'night_pre_sleep',
    timingLabel: magnesiumTimingLabel,
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
      optimalDosage: proteinServing,
      timingWindow: 'post_workout_anabolic',
      timingLabel: healthConditions.takingThyroidHormone
        ? 'Post-workout (≥4h after morning thyroid medication)'
        : 'Within 60 min post-workout (or between meals)',
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
      optimalDosage: creatineDose,
      timingWindow: 'daily_flexible',
      timingLabel: 'Daily with water or post-workout shake (Consistent daily timing)',
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
      optimalDosage: '6,000–8,000 mg',
      timingWindow: 'pre_workout_45min',
      timingLabel: '30–45 min pre-workout in 16 oz water',
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
      optimalDosage: '150–200 mg Caffeine + 200 mg L-Theanine',
      timingWindow: 'pre_workout_45min',
      timingLabel: '45 min prior to heavy training (Morning/Afternoon only; avoid within 6h of sleep)',
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
      optimalDosage: '500 mg Sodium, 60 mg Magnesium, ≤50 mg Potassium in 24 oz water',
      timingWindow: 'pre_workout_45min',
      timingLabel: 'Intra-workout hydration',
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
      optimalDosage: '500–800 mg Sodium, 200 mg Potassium, 60 mg Magnesium in 24 oz water',
      timingWindow: 'pre_workout_45min',
      timingLabel: 'Intra-workout or morning hydration',
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
      optimalDosage: isStatinCoPrescription ? '200 mg daily' : '100–200 mg daily',
      timingWindow: 'morning_with_breakfast',
      timingLabel: 'Morning with breakfast',
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
      optimalDosage: '1,000 mcg sublingual or with food',
      timingWindow: 'morning_with_breakfast',
      timingLabel: 'Morning with breakfast',
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
      optimalDosage: '15g Collagen + 50mg Vitamin C',
      timingWindow: 'pre_workout_45min',
      timingLabel: '45–60 min prior to tendon-loading sessions',
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
      optimalDosage: '480–500 mg standardized extract (or 30ml concentrate)',
      timingWindow: 'night_pre_sleep',
      timingLabel: 'Evening with dinner or before bed',
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
      optimalDosage: '3.2–6.4g daily (Split into 2 doses to avoid harmless paresthesia tingling)',
      timingWindow: 'daily_flexible',
      timingLabel: 'Daily split doses',
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

  const executiveSummary = `This supplement plan is based on your age, profile, goal (${goal.replace(/_/g, ' ')}), and experience level (${fitnessLevel.replace(/_/g, ' ')}). It includes ${enrichedItems.length} evidence-informed options and ${drugInteractions.length} checks for potential interactions with medications.`

  const legalDisclaimer =
    'MANDATORY FDA & MEDICAL DISCLAIMER: The statements and protocols contained herein have not been evaluated by the Food and Drug Administration (FDA). These dietary supplement recommendations are designed for nutritional support and sports performance optimization only, and are NOT intended to diagnose, treat, cure, or prevent any disease. Always consult with your prescribing physician or licensed pharmacist before initiating any dietary supplementation regimen, particularly when co-administering with prescription medications.'

  const thirdPartyQualityStandards =
    'GOLD STANDARD QUALITY ENFORCEMENT: Gordon Athletic Advisory strictly mandates that all purchased supplements carry independent third-party laboratory verification: NSF Certified for Sport®, Informed Choice / Informed Sport®, or USP Verified®. These certifications guarantee label accuracy and verify the absence of heavy metals, adulterants, microbials, and WADA-banned substances.'

  return {
    clientProfile: profile,
    prescribedItems: enrichedItems,
    chronoSchedule,
    drugInteractions,
    flaggedContraindications,
    ageSpecificAdjustments,
    sexSpecificAdjustments,
    chronoSeparationRules,
    executiveSummary,
    legalDisclaimer,
    thirdPartyQualityStandards,
  }
}
