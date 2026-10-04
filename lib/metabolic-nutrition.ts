/**
 * Precision Metabolic Nutrition & Thermogenic Macro Engine
 * 
 * Based on NASM CPT-7:
 * - Chapter 9: Nutrition & Energy Balance (Table 9.2 Protein Guidelines: 1.4 - 2.0 g/kg)
 * - Appendix B: Energy Balance, Hydration & Nutrient Timing
 * - Mifflin-St Jeor & Katch-McArdle BMR Algorithms
 * - OPT™ Phase-Synchronized Macronutrient Architecture
 */

export type NasmOptPhase =
  | 'phase1_stabilization'
  | 'phase2_strength_endurance'
  | 'phase3_hypertrophy'
  | 'phase4_maximal_strength'
  | 'phase5_power'

export type NutritionGoal = 'fat_loss' | 'hypertrophy' | 'maintenance' | 'athletic_power'
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active'

export interface MetabolicProfileInput {
  weightLbs: number
  heightInches?: number
  age?: number
  sex?: 'male' | 'female' | 'other'
  bodyFatPercent?: number
  activityLevel?: ActivityLevel
  goal?: NutritionGoal
  phase?: NasmOptPhase
  calorieDeficitCalories?: number
}

export interface MetabolicEnergyAnalysis {
  weightLbs: number
  weightKg: number
  bmrCalories: number
  bmrMethod: 'Mifflin-St Jeor' | 'Katch-McArdle'
  tdeeCalories: number
  activityMultiplier: number
  neatCalories: number
  eatCalories: number
  tefCalories: number
  targetCalories: number
  calorieDelta: number
  goalLabel: string
}

export interface PrecisionMacroPrescription {
  targetCalories: number
  proteinGrams: number
  proteinCalories: number
  proteinPct: number
  proteinPerLb: number
  carbGrams: number
  carbCalories: number
  carbPct: number
  fatGrams: number
  fatCalories: number
  fatPct: number
  phaseTitle: string
  keyFocus: string
  periWorkoutTiming: {
    preWorkout: string
    intraWorkout: string
    postWorkout: string
  }
  hydrationTargetLiters: number
  hydrationTargetOz: number
  sweatRateGuideline: string
}

export interface DiningProtocol {
  venueType: string
  title: string
  recommendedOrders: string[]
  pitfallsToAvoid: string[]
  executiveRule: string
}

export const EXECUTIVE_DINING_PLAYBOOK: DiningProtocol[] = [
  {
    venueType: 'steakhouse',
    title: 'High-End Steakhouse Protocol',
    recommendedOrders: [
      'Filet Mignon (6–8 oz) or Center-Cut NY Strip (Charred / No added butter basting)',
      'Jumbo Lump Crab Cocktail or Grilled Wild Sea Bass as lean protein alternatives',
      'Double sides: Steamed Asparagus, Sautéed Spinach (Olive oil light), and Baked Sweet Potato (Dry)',
    ],
    pitfallsToAvoid: [
      'Creamed spinach or au gratin potatoes (contain 40g+ hidden inflammatory seed oils & heavy cream)',
      'Truffle butter coatings (adds 300+ unaccounted empty fat calories)',
    ],
    executiveRule: 'Request meat prepared "dry-broiled with salt and pepper only" and dressing/sauce on the side.',
  },
  {
    venueType: 'airport_travel',
    title: 'Airport & First-Class Travel Nutrition',
    recommendedOrders: [
      'Pre-pack unsalted raw almonds, single-serve whey isolate packets, and electrolyte hydration tabs',
      'Terminal dining: Roasted salmon / chicken breast salad with olive oil & lemon juice',
      'Hydration: 500ml water + pinch of pink Himalayan salt per 2 hours of flight time',
    ],
    pitfallsToAvoid: [
      'In-flight refined pasta/bread meals (causes high-altitude fluid retention and lethargy)',
      'Airport smoothies (often blend 50g+ refined syrup sugars)',
    ],
    executiveRule: 'Fast during short flights (<4 hours) or strictly consume clean whole protein + mineral water.',
  },
  {
    venueType: 'business_dinner_alcohol',
    title: 'Executive Dinner & Alcohol Mitigation',
    recommendedOrders: [
      'Tequila Blanco or Mezcal with club soda and two fresh limes (Lowest congener / glycemic index)',
      'Dry Red Wine (Cabernet Sauvignon or Pinot Noir) — limited to 1 glass',
      'Alternate every cocktail with 1 full glass of sparkling mineral water with lime',
    ],
    pitfallsToAvoid: [
      'Sugary cocktail syrups, Old Fashioneds, margaritas with triple sec, and beer',
      'Late-night carbohydrate gorging post-dinner (shuts down overnight fat oxidation and GH release)',
    ],
    executiveRule: 'Cap at 2 drinks maximum. Drink 500ml water with electrolytes before sleep to protect HRV.',
  },
]

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
}

/**
 * Calculates BMR, TDEE, NEAT, EAT, TEF using Mifflin-St Jeor or Katch-McArdle
 */
export function calculateEnergyExpenditure(input: MetabolicProfileInput): MetabolicEnergyAnalysis {
  const weightLbs = Math.max(80, input.weightLbs || 180)
  const weightKg = weightLbs / 2.20462
  const heightCm = (input.heightInches || 70) * 2.54
  const age = input.age || 35
  const sex = input.sex || 'male'
  const activity = input.activityLevel || 'moderately_active'
  const goal = input.goal || 'fat_loss'

  let bmr = 0
  let bmrMethod: MetabolicEnergyAnalysis['bmrMethod'] = 'Mifflin-St Jeor'

  if (input.bodyFatPercent && input.bodyFatPercent > 3 && input.bodyFatPercent < 60) {
    // Katch-McArdle Formula: BMR = 370 + 21.6 * LBM(kg)
    const lbmKg = weightKg * (1 - input.bodyFatPercent / 100)
    bmr = Math.round(370 + 21.6 * lbmKg)
    bmrMethod = 'Katch-McArdle'
  } else {
    // Mifflin-St Jeor Formula
    if (sex === 'female') {
      bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161)
    } else {
      bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5)
    }
  }

  const multiplier = ACTIVITY_MULTIPLIERS[activity]
  const tdee = Math.round(bmr * multiplier)

  // Caloric adjustment based on goal
  let delta = 0
  let goalLabel = 'Maintenance & Metabolic Equilibrium'
  if (input.calorieDeficitCalories !== undefined) {
    delta = -Math.max(0, input.calorieDeficitCalories)
    goalLabel = `Caloric Deficit for Fat Loss (-${Math.abs(delta)} kcal)`
  } else if (goal === 'fat_loss') {
    delta = -500 // standard 1 lb/week fat loss deficit
    goalLabel = 'Caloric Deficit for Fat Oxidation (-500 kcal)'
  } else if (goal === 'hypertrophy') {
    delta = 350 // lean mass gain surplus
    goalLabel = 'Caloric Surplus for Hypertrophy (+350 kcal)'
  } else if (goal === 'athletic_power') {
    delta = 200 // power performance fuel
    goalLabel = 'Energy Availability for Athletic Power (+200 kcal)'
  }

  const targetCalories = Math.max(1200, tdee + delta)
  const tefCalories = Math.round(targetCalories * 0.1) // 10% TEF
  const eatCalories = Math.round((tdee - bmr) * 0.4)
  const neatCalories = Math.round((tdee - bmr) * 0.6)

  return {
    weightLbs,
    weightKg: Math.round(weightKg * 10) / 10,
    bmrCalories: bmr,
    bmrMethod,
    tdeeCalories: tdee,
    activityMultiplier: multiplier,
    neatCalories,
    eatCalories,
    tefCalories,
    targetCalories,
    calorieDelta: delta,
    goalLabel,
  }
}

/**
 * Calculates precision macronutrient grams, percentages, and nutrient timing
 * Based on NASM CPT-7 Table 9.2 (Protein: 1.4 - 2.0 g/kg / 0.65 - 0.90 g/lb total weight, or 1.0 g/lb LBM)
 */
export function calculatePrecisionMacros(input: MetabolicProfileInput): PrecisionMacroPrescription {
  const energy = calculateEnergyExpenditure(input)
  const { weightLbs, targetCalories } = energy
  const phase = input.phase || 'phase1_stabilization'
  const goal = input.goal || 'fat_loss'

  // Standard NASM Evidence-Based Protein Targets (CPT-7 Table 9.2)
  // Fat Loss (Deficit): 0.85 g/lb (~1.87 g/kg) - preserves nitrogen balance
  // Hypertrophy: 0.80 g/lb (~1.76 g/kg) - maximizes muscle protein synthesis (MPS)
  // Athletic Power: 0.75 g/lb (~1.65 g/kg)
  // Maintenance: 0.70 g/lb (~1.54 g/kg)
  let proteinPerLb = 0.75
  if (goal === 'fat_loss') proteinPerLb = 0.85
  else if (goal === 'hypertrophy') proteinPerLb = 0.80
  else if (goal === 'athletic_power') proteinPerLb = 0.75
  else proteinPerLb = 0.70

  let proteinGrams = Math.round(weightLbs * proteinPerLb)

  // If body fat % is provided, anchor protein precisely to Lean Body Mass (LBM)
  if (input.bodyFatPercent && input.bodyFatPercent > 5 && input.bodyFatPercent < 55) {
    const lbmLbs = weightLbs * (1 - input.bodyFatPercent / 100)
    // 1.0g per lb of LBM in a deficit, 0.90g per lb of LBM in surplus
    const lbmMultiplier = goal === 'fat_loss' ? 1.0 : (goal === 'hypertrophy' ? 0.92 : 0.85)
    proteinGrams = Math.round(lbmLbs * lbmMultiplier)
    proteinPerLb = Math.round((proteinGrams / weightLbs) * 100) / 100
  }

  const proteinCalories = proteinGrams * 4

  // Fat allotment (20 - 35% of total daily calories, min 0.3g per lb)
  let fatPct = 0.28
  if (phase === 'phase1_stabilization') fatPct = 0.30
  else if (phase === 'phase4_maximal_strength' || phase === 'phase5_power') fatPct = 0.25

  let fatCalories = Math.round(targetCalories * fatPct)
  let fatGrams = Math.round(fatCalories / 9)

  // Ensure healthy hormone baseline fat minimum (0.3g / lb)
  const minFatGrams = Math.round(weightLbs * 0.3)
  if (fatGrams < minFatGrams) {
    fatGrams = minFatGrams
    fatCalories = fatGrams * 9
  }

  // Carbohydrate allotment (remainder of calories)
  const remainingCalories = Math.max(0, targetCalories - (proteinCalories + fatCalories))
  const carbGrams = Math.round(remainingCalories / 4)
  const carbCalories = carbGrams * 4

  const totalCal = proteinCalories + fatCalories + carbCalories
  const proteinPct = Math.round((proteinCalories / totalCal) * 100)
  const actualFatPct = Math.round((fatCalories / totalCal) * 100)
  const carbPct = Math.round((carbCalories / totalCal) * 100)

  // Phase details
  let phaseTitle = 'Phase 1: Stabilization Endurance'
  let keyFocus = 'Anti-inflammatory whole foods, high fiber, oxidative mitochondrial health.'
  if (phase === 'phase2_strength_endurance') {
    phaseTitle = 'Phase 2: Strength Endurance'
    keyFocus = 'Moderate carb replenishment to sustain superset volume and lactate clearance.'
  } else if (phase === 'phase3_hypertrophy') {
    phaseTitle = 'Phase 3: Hypertrophy'
    keyFocus = 'Maximizing muscle protein synthesis (MPS) with 4-5 protein doses rich in leucine.'
  } else if (phase === 'phase4_maximal_strength') {
    phaseTitle = 'Phase 4: Maximal Strength'
    keyFocus = 'Phosphagen replenishment (creatine monohydrate) and high CNS glycogen availability.'
  } else if (phase === 'phase5_power') {
    phaseTitle = 'Phase 5: Power & PAP'
    keyFocus = 'High-velocity carbohydrate fueling for fast-twitch motor unit recruitment.'
  }

  // Hydration Target (NASM: 0.65 oz per lb baseline + 16-24 oz per lb sweat loss)
  const hydrationTargetOz = Math.round(weightLbs * 0.65)
  const hydrationTargetLiters = Math.round((hydrationTargetOz * 0.0295735) * 10) / 10

  return {
    targetCalories,
    proteinGrams,
    proteinCalories,
    proteinPct,
    proteinPerLb,
    carbGrams,
    carbCalories,
    carbPct,
    fatGrams,
    fatCalories,
    fatPct: actualFatPct,
    phaseTitle,
    keyFocus,
    periWorkoutTiming: {
      preWorkout: `1–2 hours prior: 30–50g complex carbohydrates (oatmeal / sweet potato) + 25–30g lean protein. Keep fats <10g for fast digestion.`,
      intraWorkout: `Sessions >60 mins: Sip 500ml water with electrolytes (sodium + potassium + magnesium) and 15–30g cyclic dextrin.`,
      postWorkout: `0–45 min window: 25–35g fast-digesting protein (whey isolate or high-leucine plant blend) + 35–50g carbohydrates to trigger muscle protein synthesis & glycogen replenishment.`,
    },
    hydrationTargetLiters,
    hydrationTargetOz,
    sweatRateGuideline: `Weigh in pre- and post-workout. Drink 16–24 oz (500–750 mL) of water/electrolyte solution for every pound of bodyweight lost during training.`,
  }
}

/**
 * Legacy adapter function for backward compatibility
 */
export function calculatePhaseMacros(
  bodyweightLbs: number,
  goal: 'fat_loss' | 'hypertrophy' | 'maintenance' | 'athletic_power',
  phase: NasmOptPhase = 'phase1_stabilization'
) {
  const macros = calculatePrecisionMacros({
    weightLbs: bodyweightLbs,
    goal,
    phase,
  })

  return {
    phase,
    phaseTitle: macros.phaseTitle,
    calorieTarget: macros.targetCalories,
    proteinGrams: macros.proteinGrams,
    carbGrams: macros.carbGrams,
    fatGrams: macros.fatGrams,
    carbPercentage: macros.carbPct / 100,
    proteinPercentage: macros.proteinPct / 100,
    fatPercentage: macros.fatPct / 100,
    primaryFocus: macros.keyFocus,
    periWorkoutTiming: macros.periWorkoutTiming.preWorkout,
    keySupplements: [
      'Whey Protein Isolate (25–30g post-workout)',
      'Creatine Monohydrate (5g daily)',
      'Omega-3 Fish Oil (2,000mg EPA/DHA)',
      'Electrolyte Mineral Complex',
    ],
  }
}
