/**
 * Forge Athletic — Client Intake Archetype Templates
 * 
 * Pre-calibrated client profiles covering diverse fitness levels, lifestyle constraints,
 * orthopedic considerations, and sports science goals across NASM OPT™ Phases 1 through 5.
 */

import type { CoachAiIntakeFormData } from '@/components/coach/studio/CoachAiIntakeDrawer'

export type TemplateCategory =
  | 'desk_executive'
  | 'joint_longevity'
  | 'parent_functional'
  | 'metabolic_reboot'
  | 'hypertrophy_physique'
  | 'rotational_athletic'
  | 'endurance_runner'
  | 'minimalist_travel'
  | 'strength_neural'
  | 'caregiver_physical'

export interface IntakeTemplateCategoryInfo {
  id: TemplateCategory
  label: string
  icon: string
  description: string
}

export const INTAKE_TEMPLATE_CATEGORIES: IntakeTemplateCategoryInfo[] = [
  {
    id: 'desk_executive',
    label: 'Desk & Executive Posture',
    icon: 'briefcase',
    description: 'Reversing prolonged sitting, forward head tilt, and hip flexor tightness.',
  },
  {
    id: 'joint_longevity',
    label: 'Joint Health & Longevity (50+)',
    icon: 'shield',
    description: 'Low-impact stabilization, knee/back preservation, and fall prevention.',
  },
  {
    id: 'parent_functional',
    label: 'Busy Parent & Real-World Armor',
    icon: 'users',
    description: 'Lifting toddlers, asymmetrical carrying, and high-yield 30m workouts.',
  },
  {
    id: 'metabolic_reboot',
    label: 'Beginner Reboot & Metabolic Health',
    icon: 'sun',
    description: 'Gentle progressive overload, body recomposition, and zero calorie counting.',
  },
  {
    id: 'hypertrophy_physique',
    label: 'Physique & Muscle Architecture',
    icon: 'dumbbell',
    description: 'Hypertrophy biomechanics, mechanical tension, and controlled tempos.',
  },
  {
    id: 'rotational_athletic',
    label: 'Rotational Sport (Golf & Racquet)',
    icon: 'activity',
    description: 'Thoracic mobility, hip hinge power, and kinetic chain transfer.',
  },
  {
    id: 'endurance_runner',
    label: 'Runner & Cyclist Durability',
    icon: 'compass',
    description: 'Single-leg stability, gluteus medius strength, and IT band defense.',
  },
  {
    id: 'minimalist_travel',
    label: 'Hotel & Minimalist Home',
    icon: 'navigation',
    description: '100% portable bodyweight and loop bands for travel or small spaces.',
  },
  {
    id: 'caregiver_physical',
    label: 'Physical Caregiver & Support',
    icon: 'heart',
    description: 'Assisted patient/parent transfers, grip stamina, and loved movements.',
  },
  {
    id: 'strength_neural',
    label: 'Maximal Strength & Neural Force',
    icon: 'zap',
    description: 'Heavy compound lifts, 85-100% 1RM neural drive, and pristine bar paths.',
  },
]

export interface IntakeClientTemplate {
  id: string
  name: string
  shortLabel: string
  category: TemplateCategory
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  nasmOptPhase: 1 | 2 | 3 | 4 | 5
  phaseName: string
  badge: string
  icon: string
  tagline: string
  description: string
  targetAudience: string
  estimatedDurationMins: number
  trainingDaysPerWeek: number
  equipmentSummary: string
  formData: Omit<CoachAiIntakeFormData, 'clientName'> & {
    suggestedAge?: number
    suggestedSex?: 'male' | 'female'
  }
}

export const INTAKE_CLIENT_TEMPLATES: IntakeClientTemplate[] = [
  // 1. Executive Desk Reversal
  {
    id: 'executive_desk_reversal',
    name: 'Executive Desk Reversal & Postural Armor',
    shortLabel: 'Executive Desk Worker',
    category: 'desk_executive',
    fitnessLevel: 'intermediate',
    nasmOptPhase: 1,
    phaseName: 'Phase 1 · Stabilization Endurance',
    badge: 'Most Popular',
    icon: 'briefcase',
    tagline: 'Antidote to 10-hour sitting days: opens chest, reactivates glutes, and builds core endurance.',
    description: 'Designed for professionals spending long hours at computers. Reverses Upper and Lower Crossed Syndromes, activates dormant glutes, and restores cervical alignment without demanding hours away from work.',
    targetAudience: 'Tech executives, engineers, attorneys, finance professionals',
    estimatedDurationMins: 35,
    trainingDaysPerWeek: 4,
    equipmentSummary: 'Dumbbells, Cable, Squat Rack, Bench, Bodyweight',
    formData: {
      goal: 'general_fitness',
      targetNasmPhase: 1,
      trainingDaysPerWeek: 4,
      experienceLevel: 'intermediate',
      suggestedAge: 40,
      suggestedSex: 'male',
      lifestyleRhythm: {
        workStyle: 'sedentary_desk',
        dailyRhythm: 'early_morning',
        sessionDurationMins: 35,
      },
      movementSuperpowers: ['Pull-Ups', 'Kettlebell Swings'],
      strictExclusions: ['Behind-the-Neck Press', 'Upright Rows (Impingement)'],
      functionalDemands: 'Prolonged sitting 9-11 hours daily; anterior pelvic tilt, tight hip flexors, thoracic kyphosis.',
      equipmentAccess: ['dumbbell', 'cable', 'barbell', 'squat rack', 'bench', 'pull-up bar', 'bodyweight'],
      nutritionPhilosophy: 'precision_nutrition_hand_portion',
      dualCardioSplit: {
        sweatyFinisherModality: '10-Minute Incline Treadmill Glute Walk',
        freshNeatWalkMinutes: 40,
        freshNeatNotes: 'Early morning sunlight walk for circadian clock setting and posture reset.',
      },
      coachGuidanceNotes: 'Emphasize thoracic extension, gluteus medius firing, and deep cervical flexor activation. Keep rest intervals crisp to preserve training density.',
    },
  },

  // 2. Active Aging & Joint Longevity
  {
    id: 'active_aging_longevity',
    name: 'Active Aging, Joint Preservation & Balance (50+)',
    shortLabel: 'Active Aging / Longevity',
    category: 'joint_longevity',
    fitnessLevel: 'beginner',
    nasmOptPhase: 1,
    phaseName: 'Phase 1 · Stabilization & Balance',
    badge: 'Joint Shield',
    icon: 'shield',
    tagline: 'Low-impact joint defense, multi-planar balance, bone mineral density, and fall prevention.',
    description: 'Tailored for clients 50+ or individuals navigating osteoarthritis, chondromalacia, or past joint replacements. Prioritizes proprioceptive challenge on stable bases, glute medius armor, and zero compressive spinal loading.',
    targetAudience: 'Adults 50+, seniors, individuals with chronic joint stiffness or past injuries',
    estimatedDurationMins: 30,
    trainingDaysPerWeek: 3,
    equipmentSummary: 'Resistance Bands, Light Dumbbells, Stability Ball, Bodyweight',
    formData: {
      goal: 'general_fitness',
      targetNasmPhase: 1,
      trainingDaysPerWeek: 3,
      experienceLevel: 'beginner',
      suggestedAge: 58,
      suggestedSex: 'female',
      lifestyleRhythm: {
        workStyle: 'active_standing',
        dailyRhythm: 'mid_day',
        sessionDurationMins: 30,
      },
      movementSuperpowers: ['Resistance Band Rows', 'Stability Ball Wall Squats', 'Single-Leg Balance Reach'],
      strictExclusions: ['Jump Squats', 'Box Jump Rebounds', 'Deep Barbell Back Squats', 'Forward Lunges (Runner\'s Knee)'],
      functionalDemands: 'Maintaining active independence, navigating stairs pain-free, carrying groceries, playing with grandchildren.',
      equipmentAccess: ['dumbbell', 'band', 'stability ball', 'foam roller', 'bodyweight'],
      nutritionPhilosophy: 'precision_nutrition_hand_portion',
      dualCardioSplit: {
        sweatyFinisherModality: '10-Minute Recumbent Bike or Low-Impact Walk',
        freshNeatWalkMinutes: 30,
        freshNeatNotes: 'Gentle neighborhood walk with spouse or pet; focus on upright posture and diaphragmatic breathing.',
      },
      coachGuidanceNotes: 'Zero joint shear stress. Incorporate 4/2/1 tempo holds to develop tendon stiffness and joint stability. Warmup SMR on IT band and calves is mandatory.',
    },
  },

  // 3. Busy Parent Durability
  {
    id: 'busy_parent_durability',
    name: 'Busy Parent Functional Armor & Time-Yield Protocol',
    shortLabel: 'Busy Parent Functional',
    category: 'parent_functional',
    fitnessLevel: 'intermediate',
    nasmOptPhase: 2,
    phaseName: 'Phase 2 · Strength Endurance',
    badge: 'Time Efficient',
    icon: 'users',
    tagline: 'High-yield 30-minute contrast supersets engineered around chaotic family schedules and asymmetrical lifting.',
    description: 'Built for parents juggling young children, work, and sleep fluctuations. Focuses on anti-rotational core armor, unilateral balance, hip hinge strength for toddler pickups, and metabolic supersets that maximize EPOC in minimum time.',
    targetAudience: 'Parents with infants, toddlers, or school-age children with limited free time',
    estimatedDurationMins: 30,
    trainingDaysPerWeek: 3,
    equipmentSummary: 'Dumbbells, Kettlebells, Resistance Bands, Bodyweight',
    formData: {
      goal: 'fat_loss',
      targetNasmPhase: 2,
      trainingDaysPerWeek: 3,
      experienceLevel: 'intermediate',
      suggestedAge: 36,
      suggestedSex: 'female',
      lifestyleRhythm: {
        workStyle: 'sedentary_desk',
        dailyRhythm: 'early_morning',
        sessionDurationMins: 30,
      },
      movementSuperpowers: ['Push-Ups', 'Kettlebell Swings', 'Deadlifts'],
      strictExclusions: ['Mountain Climbers', 'Overhead Barbell Squats'],
      functionalDemands: 'Carrying toddlers on one hip, loading car seats/strollers, floor-to-standing transitions with zero lower back strain.',
      equipmentAccess: ['dumbbell', 'kettlebell', 'band', 'bodyweight'],
      nutritionPhilosophy: 'precision_nutrition_hand_portion',
      dualCardioSplit: {
        sweatyFinisherModality: '8-Minute Kettlebell Swings & Bodyweight Metcon',
        freshNeatWalkMinutes: 25,
        freshNeatNotes: 'Stroller walk or family park stroll; non-sweaty daily movement habit.',
      },
      coachGuidanceNotes: 'Prioritize contrast supersets (e.g. dumbbell chest press on floor paired with stability push-ups). Protect the lumbar spine with Pallof presses and dead bugs.',
    },
  },

  // 4. Metabolic Kickstart & Beginner Reboot
  {
    id: 'metabolic_reboot_beginner',
    name: 'Metabolic Kickstart & Habit Foundation (Gentle Reboot)',
    shortLabel: 'Beginner Metabolic Reboot',
    category: 'metabolic_reboot',
    fitnessLevel: 'beginner',
    nasmOptPhase: 1,
    phaseName: 'Phase 1 · Stabilization Endurance',
    badge: 'Gentle Start',
    icon: 'sun',
    tagline: 'Empowering entry point returning to fitness: builds confidence, joint safety, and sustainable momentum.',
    description: 'Designed for beginners or individuals returning from a multi-year exercise hiatus. Eliminates intimidation, shaming, and injury risk with approachable movements, gradual progression, and a visual hand-portion nutrition guide without calorie counting.',
    targetAudience: 'Deconditioned adults, post-rehab graduates, postpartum mothers (cleared by MD)',
    estimatedDurationMins: 30,
    trainingDaysPerWeek: 3,
    equipmentSummary: 'Dumbbells, Resistance Bands, Reebok Step/Bench, Bodyweight',
    formData: {
      goal: 'fat_loss',
      targetNasmPhase: 1,
      trainingDaysPerWeek: 3,
      experienceLevel: 'beginner',
      suggestedAge: 44,
      suggestedSex: 'female',
      lifestyleRhythm: {
        workStyle: 'sedentary_desk',
        dailyRhythm: 'early_morning',
        sessionDurationMins: 30,
      },
      movementSuperpowers: ['Glute Bridges', 'Resistance Band Rows', 'Incline Push-Ups on Bench'],
      strictExclusions: ['Burpees', 'Box Jump Rebounds', 'Mountain Climbers', 'Heavy Barbells'],
      functionalDemands: 'Climbing stairs without breathless fatigue, carrying groceries without back spasms, regaining daily vitality.',
      equipmentAccess: ['dumbbell', 'band', 'reebok step', 'stability ball', 'bodyweight'],
      nutritionPhilosophy: 'precision_nutrition_hand_portion',
      dualCardioSplit: {
        sweatyFinisherModality: '8-Minute Gentle Incline Walk Flush',
        freshNeatWalkMinutes: 25,
        freshNeatNotes: 'Daily 25-minute morning or evening walk in clean clothes to build non-exercise momentum.',
      },
      coachGuidanceNotes: 'Coach with high EQ and positive reinforcement. Keep RPE at 6-7/10. Reinforce the 80% fullness cue (Hara Hachi Bu) rather than calorie counting.',
    },
  },

  // 5. Physique Architecture & Hypertrophy Split
  {
    id: 'physique_hypertrophy_pro',
    name: 'Physique Architecture & Hypertrophy Split',
    shortLabel: 'Hypertrophy & Physique',
    category: 'hypertrophy_physique',
    fitnessLevel: 'advanced',
    nasmOptPhase: 3,
    phaseName: 'Phase 3 · Muscular Development',
    badge: 'Muscle Building',
    icon: 'dumbbell',
    tagline: 'Maximizes mechanical tension, volume landmarks (MEV to MRV), and myofibrillar protein synthesis.',
    description: 'Engineered for intermediate and advanced lifters focused on aesthetic muscle architecture, proportional symmetry, and progressive overload. Uses 2/0/2 tempos, 75-85% 1RM loads, 6-12 rep ranges, and dedicated low-interference cardio.',
    targetAudience: 'Experienced lifters, bodybuilding enthusiasts, body recomposition seekers',
    estimatedDurationMins: 50,
    trainingDaysPerWeek: 4,
    equipmentSummary: 'Full Commercial Gym (Barbells, Racks, Cables, Dumbbells, Benches)',
    formData: {
      goal: 'hypertrophy',
      targetNasmPhase: 3,
      trainingDaysPerWeek: 4,
      experienceLevel: 'advanced',
      suggestedAge: 32,
      suggestedSex: 'male',
      lifestyleRhythm: {
        workStyle: 'sedentary_desk',
        dailyRhythm: 'evening',
        sessionDurationMins: 50,
      },
      movementSuperpowers: ['Deadlifts', 'Pull-Ups', 'Dumbbells', 'Cable Lateral Raises'],
      strictExclusions: ['Burpees', 'Olympic Snatches'],
      functionalDemands: 'High mechanical tension tolerance; managing systemic CNS fatigue across upper/lower splits.',
      equipmentAccess: ['barbell', 'squat rack', 'dumbbell', 'cable', 'bench', 'pull-up bar', 'bodyweight'],
      nutritionPhilosophy: 'precision_nutrition_hand_portion',
      dualCardioSplit: {
        sweatyFinisherModality: '12-Minute Incline Treadmill or Assault Bike Interference Shield Flush',
        freshNeatWalkMinutes: 35,
        freshNeatNotes: 'Daily steps to keep insulin sensitivity high without cannibalizing muscle gains.',
      },
      coachGuidanceNotes: 'Target 3-4 sets of 8-12 reps with controlled eccentrics. Maintain strict adherence to 60-90s rest intervals to maximize metabolic accumulation and cellular swelling.',
    },
  },

  // 6. Rotational Athlete & Dynamic Power (Golf, Tennis, Pickleball)
  {
    id: 'rotational_power_athlete',
    name: 'Rotational Sport & Dynamic Power (Golf, Tennis, Pickleball)',
    shortLabel: 'Rotational Power (Golf/Racquet)',
    category: 'rotational_athletic',
    fitnessLevel: 'intermediate',
    nasmOptPhase: 5,
    phaseName: 'Phase 5 · Power & PAP Contrast',
    badge: 'Rotational Power',
    icon: 'activity',
    tagline: 'Develops rotational clubhead speed, ground reaction force transfer, and thoracic spinal armor.',
    description: 'Designed for recreational and competitive golfers, tennis, and pickleball players. Pairs high-load compound anchors with explosive rotational medicine ball releases at X/0/X tempo to elevate Rate of Force Development (RFD) and shield the lower back.',
    targetAudience: 'Golfers, tennis players, pickleballers, rotational athletes wanting speed and durability',
    estimatedDurationMins: 45,
    trainingDaysPerWeek: 3,
    equipmentSummary: 'Kettlebells, Dumbbells, Cable Machine, Bands, Medicine Ball',
    formData: {
      goal: 'performance',
      targetNasmPhase: 5,
      trainingDaysPerWeek: 3,
      experienceLevel: 'intermediate',
      suggestedAge: 46,
      suggestedSex: 'male',
      lifestyleRhythm: {
        workStyle: 'sedentary_desk',
        dailyRhythm: 'early_morning',
        sessionDurationMins: 45,
      },
      movementSuperpowers: ['Kettlebell Swings', 'Deadlifts', 'Battle Ropes'],
      strictExclusions: ['Behind-the-Neck Press', 'Locked-Spine Seated Torso Machines'],
      functionalDemands: 'High rotational velocity demands; protecting lumbar spine via hip hinge and thoracic disassociation.',
      equipmentAccess: ['dumbbell', 'kettlebell', 'cable', 'band', 'bodyweight', 'bench'],
      nutritionPhilosophy: 'precision_nutrition_hand_portion',
      dualCardioSplit: {
        sweatyFinisherModality: '10-Minute Multi-Planar Lateral Agility & Shuffle Finisher',
        freshNeatWalkMinutes: 35,
        freshNeatNotes: 'Outdoor walking to maintain foot and ankle mobility.',
      },
      coachGuidanceNotes: 'Focus on Post-Activation Potentiation (PAP): Heavy trap-bar deadlift or goblet squat paired immediately with explosive rotational power throw. Enforce full hip extension.',
    },
  },

  // 7. Endurance Runner & Cyclist Durability Armor
  {
    id: 'endurance_runner_shield',
    name: 'Endurance Runner & Cyclist Durability Shield',
    shortLabel: 'Runner & Cyclist Shield',
    category: 'endurance_runner',
    fitnessLevel: 'intermediate',
    nasmOptPhase: 2,
    phaseName: 'Phase 2 · Strength Endurance',
    badge: 'Injury Armor',
    icon: 'compass',
    tagline: 'Single-leg stability, gluteus medius strength, and Achilles/patellar tendon resilience without heavy legs.',
    description: 'Created for distance runners, marathoners, and cyclists whose sport already provides massive cardiovascular volume. Fortifies structural weak links—gluteus medius, foot arches, hamstrings, and calves—to prevent IT band friction, runner\'s knee, and shin splints.',
    targetAudience: 'Distance runners, 5K-to-marathon runners, triathletes, road/gravel cyclists',
    estimatedDurationMins: 35,
    trainingDaysPerWeek: 2,
    equipmentSummary: 'Dumbbells, Resistance Bands, Step, Foam Roller, Bodyweight',
    formData: {
      goal: 'performance',
      targetNasmPhase: 2,
      trainingDaysPerWeek: 2,
      experienceLevel: 'intermediate',
      suggestedAge: 39,
      suggestedSex: 'female',
      lifestyleRhythm: {
        workStyle: 'sedentary_desk',
        dailyRhythm: 'early_morning',
        sessionDurationMins: 35,
      },
      movementSuperpowers: ['Resistance Bands', 'Glute Bridges', 'Single-Leg Balance Reach'],
      strictExclusions: ['Treadmill Sprints (Already running high mileage)', 'Box Jump Rebounds'],
      functionalDemands: 'Absorbing 3-4x bodyweight ground impact thousands of times per mile; preventing overuse injuries.',
      equipmentAccess: ['dumbbell', 'band', 'reebok step', 'foam roller', 'bodyweight'],
      nutritionPhilosophy: 'precision_nutrition_hand_portion',
      dualCardioSplit: {
        sweatyFinisherModality: '8-Minute Hip Mobility & Ankle Dorsiflexion Active Recovery',
        freshNeatWalkMinutes: 20,
        freshNeatNotes: 'Low-impact active recovery flush on non-running days.',
      },
      coachGuidanceNotes: 'Unilateral focus is mandatory. Prescribe single-leg Romanian deadlifts, step-ups to balance, and lateral band walks. Do not program high-volume hypertrophy that impairs running economy.',
    },
  },

  // 8. Hotel & Minimalist Home
  {
    id: 'minimalist_travel_hotel',
    name: 'Minimalist Home & Frequent Traveler Protocol',
    shortLabel: 'Hotel & Minimalist',
    category: 'minimalist_travel',
    fitnessLevel: 'intermediate',
    nasmOptPhase: 1,
    phaseName: 'Phase 1 · Stabilization & Density',
    badge: '100% Portable',
    icon: 'navigation',
    tagline: 'Zero bulky equipment needed: loop bands and bodyweight engineered for hotel rooms and tight living spaces.',
    description: 'Engineered for business travelers living out of suitcases or athletes with minimal home footprint. Generates high metabolic density and muscle recruitment through 4/2/1 tempo manipulation, unilateral leverage, and loop resistance bands.',
    targetAudience: 'Consultants, remote workers, frequent flyers, apartment dwellers',
    estimatedDurationMins: 25,
    trainingDaysPerWeek: 4,
    equipmentSummary: 'Resistance Bands, Bodyweight, Towel / Furniture Anchors',
    formData: {
      goal: 'general_fitness',
      targetNasmPhase: 1,
      trainingDaysPerWeek: 4,
      experienceLevel: 'intermediate',
      suggestedAge: 35,
      suggestedSex: 'male',
      lifestyleRhythm: {
        workStyle: 'travel_intensive',
        dailyRhythm: 'early_morning',
        sessionDurationMins: 25,
      },
      movementSuperpowers: ['Push-Ups', 'Burpees', 'Plank Variations'],
      strictExclusions: ['Barbell Squats', 'Cable Tower Movements', 'Heavy Machines'],
      functionalDemands: 'Frequent airport travel, irregular hotel gym availability, overcoming jetlag.',
      equipmentAccess: ['band', 'bodyweight'],
      nutritionPhilosophy: 'precision_nutrition_hand_portion',
      dualCardioSplit: {
        sweatyFinisherModality: '8-Minute Hotel Room Bodyweight Metcon',
        freshNeatWalkMinutes: 30,
        freshNeatNotes: 'City exploration walk upon arrival to entrain circadian rhythms and beat travel fatigue.',
      },
      coachGuidanceNotes: 'Leverage 4-second eccentrics and 2-second isometric holds to generate mechanical tension without heavy iron. Keep transitions between sets under 30 seconds.',
    },
  },

  // 9. Physical Caregiver & Elder Support
  {
    id: 'caregiver_physical_support',
    name: 'Physical Caregiver & Heavy Lift Resilience',
    shortLabel: 'Caregiver & Physical Support',
    category: 'caregiver_physical',
    fitnessLevel: 'intermediate',
    nasmOptPhase: 1,
    phaseName: 'Phase 1 · Stabilization & Hinge Integrity',
    badge: 'Real-World Stamina',
    icon: 'heart',
    tagline: 'Fortifies posterior chain, grip, and knee tracking for assisted transfers, lifting, and emotional stamina.',
    description: 'Developed specifically for individuals caring for elderly parents or physically dependent family members. Combines beloved movements (Reebok step, burpees) with bulletproof hip hinge integrity and patellofemoral tracking safeguards.',
    targetAudience: 'Family caregivers, nurses, physical therapists, elder care advocates',
    estimatedDurationMins: 35,
    trainingDaysPerWeek: 3,
    equipmentSummary: 'Dumbbells, Resistance Bands, Reebok Step, Stability Ball, Bodyweight',
    formData: {
      goal: 'fat_loss',
      targetNasmPhase: 1,
      trainingDaysPerWeek: 3,
      experienceLevel: 'intermediate',
      suggestedAge: 46,
      suggestedSex: 'female',
      lifestyleRhythm: {
        workStyle: 'sedentary_desk',
        dailyRhythm: 'early_morning',
        sessionDurationMins: 35,
      },
      movementSuperpowers: ['Burpees', 'Reebok Step Aerobics'],
      strictExclusions: ['Mountain Climbers', 'Running / Jogging', 'Forward Lunges (Runner\'s Knee)'],
      functionalDemands: 'Assisting elderly family member on weekends with mobility transfers; requires robust hip hinge, grip, and posterior chain endurance.',
      equipmentAccess: ['dumbbell', 'band', 'reebok step', 'stability ball', 'bodyweight'],
      nutritionPhilosophy: 'precision_nutrition_hand_portion',
      dualCardioSplit: {
        sweatyFinisherModality: '10-Minute Reebok Step Metabolic Flush',
        freshNeatWalkMinutes: 30,
        freshNeatNotes: 'Dedicated morning walk to visit family; clean, fresh, non-sweaty mindset ritual.',
      },
      coachGuidanceNotes: 'Incorporate Reebok Step for aerobic warm-up and finishers. Burpees are loved—program them safely! Strictly exclude mountain climbers and running. Protect patellofemoral tracking.',
    },
  },

  // 10. Maximal Strength & Neural Force
  {
    id: 'maximal_strength_neural',
    name: 'Maximal Strength & Neural Force Architecture',
    shortLabel: 'Maximal Strength (Phase 4)',
    category: 'strength_neural',
    fitnessLevel: 'advanced',
    nasmOptPhase: 4,
    phaseName: 'Phase 4 · Maximal Strength',
    badge: 'Heavy Force',
    icon: 'zap',
    tagline: 'High motor unit recruitment: 85-100% 1RM loads, 1-5 reps, 2-4 minute rest intervals, and pristine mechanics.',
    description: 'Designed for advanced strength trainees and powerlifters aiming to increase maximal force production. Emphasizes compound spinal-braced movements (squat, bench, deadlift, overhead press) with long restorative rest periods and zero junk volume.',
    targetAudience: 'Powerlifters, strength athletes, advanced trainees seeking pure force capacity',
    estimatedDurationMins: 55,
    trainingDaysPerWeek: 4,
    equipmentSummary: 'Full Commercial Gym (Heavy Barbells, Racks, Chalk, Platform)',
    formData: {
      goal: 'performance',
      targetNasmPhase: 4,
      trainingDaysPerWeek: 4,
      experienceLevel: 'advanced',
      suggestedAge: 30,
      suggestedSex: 'male',
      lifestyleRhythm: {
        workStyle: 'sedentary_desk',
        dailyRhythm: 'evening',
        sessionDurationMins: 55,
      },
      movementSuperpowers: ['Deadlifts', 'Push-Ups', 'Pull-Ups'],
      strictExclusions: ['High-Rep Burpees', 'Long Slow Cardio on Lift Days'],
      functionalDemands: 'High intra-abdominal pressure bracing; maximal neural output without structural compensation.',
      equipmentAccess: ['barbell', 'squat rack', 'bench', 'pull-up bar', 'dumbbell', 'bodyweight'],
      nutritionPhilosophy: 'precision_nutrition_hand_portion',
      dualCardioSplit: {
        sweatyFinisherModality: '8-Minute Zone 1 Recovery Bike Flush',
        freshNeatWalkMinutes: 30,
        freshNeatNotes: 'Low-intensity recovery walking to aid venous return without fatigue.',
      },
      coachGuidanceNotes: 'Enforce NASM Phase 4 acute variables: 85-100% 1RM intensity, 1-5 reps, 4-6 sets, 2-4 minutes rest. Prioritize intra-abdominal bracing and pristine bar trajectories.',
    },
  },

  // 11. Knee Patellofemoral & Runner's Knee Shield
  {
    id: 'knee_rehab_patellofemoral',
    name: 'Knee Patellofemoral & Joint Longevity Shield',
    shortLabel: 'Knee Shield / Patellofemoral',
    category: 'joint_longevity',
    fitnessLevel: 'beginner',
    nasmOptPhase: 1,
    phaseName: 'Phase 1 · Corrective & Stabilization',
    badge: 'Zero Knee Pain',
    icon: 'shield',
    tagline: 'Substitutes high-shear movements with VMO activation, glute medius firing, and pain-free quad loading.',
    description: 'Tailored for clients with anterior knee pain, chondromalacia, or standing fatigue. Strictly banishes forward lunges and high-impact jumping in favor of step-ups to balance, stability ball wall squats, and glute activation.',
    targetAudience: 'Teachers, nurses, runners with patellofemoral tracking issues, post-ACL rehab',
    estimatedDurationMins: 30,
    trainingDaysPerWeek: 3,
    equipmentSummary: 'Dumbbells, Resistance Bands, Stability Ball, Bodyweight',
    formData: {
      goal: 'fat_loss',
      targetNasmPhase: 1,
      trainingDaysPerWeek: 3,
      experienceLevel: 'beginner',
      suggestedAge: 52,
      suggestedSex: 'female',
      lifestyleRhythm: {
        workStyle: 'active_standing',
        dailyRhythm: 'mid_day',
        sessionDurationMins: 30,
      },
      movementSuperpowers: ['Glute Bridges', 'Resistance Band Rows', 'Single-Leg Balance Reach'],
      strictExclusions: ['Forward Lunges (Runner\'s Knee)', 'Jump Squats', 'Running / Jogging', 'Box Jump Rebounds'],
      functionalDemands: 'Standing on feet 6-8 hours daily; bilateral patellofemoral aching during stairs or prolonged standing.',
      equipmentAccess: ['dumbbell', 'band', 'stability ball', 'foam roller', 'bodyweight'],
      nutritionPhilosophy: 'precision_nutrition_hand_portion',
      dualCardioSplit: {
        sweatyFinisherModality: '8-Minute Incline Treadmill Glute Walk',
        freshNeatWalkMinutes: 30,
        freshNeatNotes: 'Evening neighborhood stroll with family or pet for parasympathetic calming.',
      },
      coachGuidanceNotes: 'Knee-friendly stabilization. Zero high-impact jumping or forward lunging. Bias gluteus medius and VMO activation via clamshells and band walks.',
    },
  },
]

/**
 * Helper to fetch a template by its ID.
 */
export function getIntakeTemplateById(templateId: string): IntakeClientTemplate | undefined {
  return INTAKE_CLIENT_TEMPLATES.find(t => t.id === templateId)
}

/**
 * Helper to filter templates by category.
 */
export function getIntakeTemplatesByCategory(category: TemplateCategory | 'all'): IntakeClientTemplate[] {
  if (category === 'all') return INTAKE_CLIENT_TEMPLATES
  return INTAKE_CLIENT_TEMPLATES.filter(t => t.category === category)
}
