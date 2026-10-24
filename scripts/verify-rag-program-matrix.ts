import {
  generateRagNasmProgram,
  type RagProgramGenerationRequest,
  type GeneratedMacrocyclePlan,
  type GeneratedExerciseItem,
} from '../lib/rag-nasm-program-generator'
import { searchNasmLibraryMedia } from '../lib/nasm-fuzzy-matcher'
import { getNasmClinicalMovementCard } from '../lib/nasm-clinical-movement-cards'

interface TestScenario {
  name: string
  request: RagProgramGenerationRequest
  expectedPhase: number
  forbiddenTerms?: string[]
  requiredKeywords?: string[]
}

const TEST_SCENARIOS: TestScenario[] = [
  // ── 1. ALL 5 NASM OPT™ PHASES (Commercial Gym) ──────────────────────────
  {
    name: 'Phase 1: Stabilization Endurance (Fat Loss / Beginner)',
    request: {
      clientName: 'Phase 1 Athlete',
      goal: 'fat_loss',
      targetNasmPhase: 1,
      experienceLevel: 'beginner',
      trainingDaysPerWeek: 3,
    },
    expectedPhase: 1,
  },
  {
    name: 'Phase 2: Strength Endurance (Fat Loss / Intermediate)',
    request: {
      clientName: 'Phase 2 Athlete',
      goal: 'fat_loss',
      targetNasmPhase: 2,
      experienceLevel: 'intermediate',
      trainingDaysPerWeek: 4,
    },
    expectedPhase: 2,
  },
  {
    name: 'Phase 3: Muscular Development / Hypertrophy (Advanced)',
    request: {
      clientName: 'Phase 3 Athlete',
      goal: 'hypertrophy',
      targetNasmPhase: 3,
      experienceLevel: 'advanced',
      trainingDaysPerWeek: 4,
      knownBenchmarks: {
        'Bench Press': { weightLbs: 225, reps: 5 },
        'Squat': { weightLbs: 315, reps: 5 },
      },
    },
    expectedPhase: 3,
  },
  {
    name: 'Phase 4: Maximal Strength (Intermediate / Performance)',
    request: {
      clientName: 'Phase 4 Athlete',
      goal: 'performance',
      targetNasmPhase: 4,
      experienceLevel: 'advanced',
      trainingDaysPerWeek: 4,
      knownBenchmarks: {
        'Bench Press': { weightLbs: 245, reps: 3 },
        'Squat': { weightLbs: 335, reps: 3 },
      },
    },
    expectedPhase: 4,
  },
  {
    name: 'Phase 5: Athletic Power & PAP (Elite / Performance)',
    request: {
      clientName: 'Phase 5 Athlete',
      goal: 'performance',
      targetNasmPhase: 5,
      experienceLevel: 'elite',
      trainingDaysPerWeek: 4,
      knownBenchmarks: {
        'Squat': { weightLbs: 365, reps: 2 },
        'Bench Press': { weightLbs: 275, reps: 2 },
      },
    },
    expectedPhase: 5,
  },

  // ── 2. EQUIPMENT RESTRICTIONS ───────────────────────────────────────────
  {
    name: 'Equipment: Home Dumbbells & Bench Only (Phase 3 Hypertrophy)',
    request: {
      clientName: 'Home Athlete',
      goal: 'hypertrophy',
      targetNasmPhase: 3,
      trainingDaysPerWeek: 4,
      equipmentAccess: ['dumbbell', 'bench', 'stability ball', 'bodyweight', 'band'],
    },
    expectedPhase: 3,
    forbiddenTerms: ['barbell', 'squat rack', 'leg press', 'cable machine'],
  },
  {
    name: 'Equipment: Minimalist Travel Bands Suite (Phase 2 Strength Endurance)',
    request: {
      clientName: 'Traveling Athlete',
      goal: 'fat_loss',
      targetNasmPhase: 2,
      trainingDaysPerWeek: 3,
      equipmentAccess: ['band', 'bodyweight', 'stability ball'],
    },
    expectedPhase: 2,
    forbiddenTerms: ['barbell', 'dumbbell', 'leg press', 'squat rack'],
  },
  {
    name: 'Equipment: Bodyweight Calisthenics Only (Phase 1 Stabilization)',
    request: {
      clientName: 'Bodyweight Athlete',
      goal: 'general_fitness',
      targetNasmPhase: 1,
      trainingDaysPerWeek: 3,
      equipmentAccess: ['bodyweight'],
    },
    expectedPhase: 1,
    forbiddenTerms: ['barbell', 'dumbbell', 'cable', 'leg press'],
  },

  // ── 3. ORTHOPEDIC CONTRAINDICATIONS & SAFETY GATES ──────────────────────
  {
    name: 'Orthopedic: Patellofemoral Runner Knee Protection',
    request: {
      clientName: 'Runner Knee Athlete',
      goal: 'fat_loss',
      targetNasmPhase: 2,
      trainingDaysPerWeek: 3,
      contraindicationTags: ['knee_patellofemoral'],
      injuriesLimitations: 'Severe anterior knee pain and patellofemoral tracking issue. Avoid deep knee shearing.',
    },
    expectedPhase: 2,
    forbiddenTerms: ['leg extension', 'jump squat', 'box jumps', 'tuck jump'],
  },
  {
    name: 'Orthopedic: Lumbar Disc / Low Back Protection',
    request: {
      clientName: 'Lumbar Spine Athlete',
      goal: 'hypertrophy',
      targetNasmPhase: 3,
      trainingDaysPerWeek: 3,
      contraindicationTags: ['lumbar_disc_condition'],
      injuriesLimitations: 'L4-L5 herniation, lumbar flexion intolerance. No loaded spinal flexion or shear.',
    },
    expectedPhase: 3,
    forbiddenTerms: ['good morning', 'jefferson curl', 'hyperextension', 'torso rotation'],
  },
  {
    name: 'Orthopedic: Shoulder Impingement Protection',
    request: {
      clientName: 'Shoulder Impingement Athlete',
      goal: 'fat_loss',
      targetNasmPhase: 1,
      trainingDaysPerWeek: 3,
      contraindicationTags: ['shoulder_impingement'],
      injuriesLimitations: 'Subacromial impingement, pain with overhead press and upright rows.',
    },
    expectedPhase: 1,
    forbiddenTerms: ['upright row', 'barbell overhead press', 'behind the neck'],
  },
  {
    name: 'Clinical: Hypertension / Beta-Blockers (RPE Pacing & SMR Protection)',
    request: {
      clientName: 'Cardiovascular Health Athlete',
      goal: 'fat_loss',
      targetNasmPhase: 1,
      trainingDaysPerWeek: 3,
      hasHeartMedications: true,
      injuriesLimitations: 'Takes Atenolol for high blood pressure. RPE must replace heart rate zones.',
    },
    expectedPhase: 1,
  },

  // ── 4. TRAINING FREQUENCY & SPLIT CONTINUUM (2 to 6 Days) ────────────────
  {
    name: 'Frequency: 2-Day Minimalist Full Body (Phase 1 Stabilization)',
    request: {
      clientName: 'Busy Executive',
      goal: 'general_fitness',
      targetNasmPhase: 1,
      trainingDaysPerWeek: 2,
    },
    expectedPhase: 1,
  },
  {
    name: 'Frequency: 5-Day High-Volume Split (Phase 3 Hypertrophy)',
    request: {
      clientName: 'Bodybuilding Athlete',
      goal: 'hypertrophy',
      targetNasmPhase: 3,
      trainingDaysPerWeek: 5,
    },
    expectedPhase: 3,
  },
  {
    name: 'Frequency: 6-Day Elite Athletic Microcycle (Phase 5 Power)',
    request: {
      clientName: 'Decathlete',
      goal: 'performance',
      targetNasmPhase: 5,
      experienceLevel: 'elite',
      trainingDaysPerWeek: 6,
    },
    expectedPhase: 5,
  },

  // ── 5. OHSA KINETIC CHAIN COMPENSATIONS ──────────────────────────────────
  {
    name: 'OHSA Compensation: Knees Cave In (Valgus Collapse)',
    request: {
      clientName: 'Knee Valgus Athlete',
      goal: 'fat_loss',
      targetNasmPhase: 1,
      trainingDaysPerWeek: 3,
      kineticCompensations: ['knees_cave_in'],
    },
    expectedPhase: 1,
  },
  {
    name: 'OHSA Compensation: Excessive Forward Lean & Arms Fall Forward',
    request: {
      clientName: 'Forward Lean Athlete',
      goal: 'general_fitness',
      targetNasmPhase: 1,
      trainingDaysPerWeek: 3,
      kineticCompensations: ['excessive_forward_lean', 'arms_fall_forward'],
    },
    expectedPhase: 1,
  },
  {
    name: 'OHSA Compensation: Feet Turn Out & Asymmetrical Weight Shift',
    request: {
      clientName: 'Asymmetrical Athlete',
      goal: 'fat_loss',
      targetNasmPhase: 1,
      trainingDaysPerWeek: 3,
      kineticCompensations: ['feet_turn_out', 'asymmetrical_weight_shift'],
    },
    expectedPhase: 1,
  },

  // ── 6. EXTENDED ORTHOPEDIC & MEDICAL CONDITIONS ──────────────────────────
  {
    name: 'Orthopedic: Cervical Spine Strain / Upper Trapezius Hypertonicity',
    request: {
      clientName: 'Desk Worker Neck Pain',
      goal: 'general_fitness',
      targetNasmPhase: 1,
      trainingDaysPerWeek: 3,
      contraindicationTags: ['cervical_spine_strain'],
      injuriesLimitations: 'Severe neck tightness and upper trap spasm. Avoid heavy shoulder shrugs and behind-the-neck loads.',
    },
    expectedPhase: 1,
  },
  {
    name: 'Orthopedic: Patellar Tendinopathy (Jumper Knee)',
    request: {
      clientName: 'Basketball Jumper',
      goal: 'performance',
      targetNasmPhase: 2,
      trainingDaysPerWeek: 3,
      contraindicationTags: ['patellar_tendinopathy'],
      injuriesLimitations: 'Inferior patellar pole pain aggravated by rapid deceleration and deep open-chain leg extensions.',
    },
    expectedPhase: 2,
  },
  {
    name: 'Orthopedic: IT Band Friction Syndrome',
    request: {
      clientName: 'Marathon Runner',
      goal: 'fat_loss',
      targetNasmPhase: 2,
      trainingDaysPerWeek: 3,
      contraindicationTags: ['it_band_syndrome'],
      injuriesLimitations: 'Lateral knee friction pain at 30 degrees flexion. Needs TFL SMR and glute medius activation.',
    },
    expectedPhase: 2,
  },
  {
    name: 'Orthopedic: Meniscus Tear (Conservative Management)',
    request: {
      clientName: 'Masters Athlete Meniscus',
      goal: 'general_fitness',
      targetNasmPhase: 1,
      trainingDaysPerWeek: 3,
      contraindicationTags: ['meniscus_tear_conservative'],
      injuriesLimitations: 'Degenerative medial meniscus tear. No deep knee flexion past 90 degrees or loaded pivoting.',
    },
    expectedPhase: 1,
  },
  {
    name: 'Orthopedic: Tennis Elbow (Lateral Epicondylitis)',
    request: {
      clientName: 'Tennis Player',
      goal: 'hypertrophy',
      targetNasmPhase: 3,
      trainingDaysPerWeek: 3,
      contraindicationTags: ['tennis_elbow'],
      injuriesLimitations: 'Lateral epicondyle tenderness. Strict neutral hammer grip on arm work, zero pronated reverse curls.',
    },
    expectedPhase: 3,
  },
  {
    name: 'Orthopedic: Achilles Tendinopathy & Plantar Fasciitis',
    request: {
      clientName: 'Runner Foot Pain',
      goal: 'fat_loss',
      targetNasmPhase: 1,
      trainingDaysPerWeek: 3,
      contraindicationTags: ['achilles_tendinopathy', 'plantar_fasciitis'],
      injuriesLimitations: 'Morning heel stiffness and mid-portion Achilles tenderness. Avoid explosive stretch-shortening impacts.',
    },
    expectedPhase: 1,
  },
  {
    name: 'Special Population: Osteoporosis / Bone Mineral Density Shield',
    request: {
      clientName: 'Senior Client',
      goal: 'general_fitness',
      targetNasmPhase: 1,
      trainingDaysPerWeek: 3,
      contraindicationTags: ['osteoporosis_osteopenia'],
      injuriesLimitations: 'Low bone mineral density (osteopenia T-score -2.1). Avoid loaded spinal flexion and high-risk balance falls.',
    },
    expectedPhase: 1,
  },
  {
    name: 'Special Population: Prenatal / Pregnancy (Second Trimester)',
    request: {
      clientName: 'Prenatal Client',
      clientSex: 'female',
      goal: 'general_fitness',
      targetNasmPhase: 1,
      trainingDaysPerWeek: 3,
      contraindicationTags: ['pregnancy_prenatal'],
      injuriesLimitations: 'Second trimester pregnancy (20 weeks). Avoid supine positions after 1st trimester, high-impact plyometrics, and Valsalva maneuver.',
    },
    expectedPhase: 1,
  },
]

interface ValidationIssue {
  scenario: string
  day: number
  exercise: string
  issue: string
  details?: unknown
}

async function runValidation() {
  console.log('=================================================================')
  console.log('   FORGE ATHLETIC — NASM OPT™ PROGRAM GENERATOR AUDIT MATRIX    ')
  console.log('=================================================================\n')

  const issues: ValidationIssue[] = []
  let totalExercisesValidated = 0
  const uniqueExercises = new Set<string>()

  for (const scenario of TEST_SCENARIOS) {
    console.log(`Auditing Scenario: "${scenario.name}"...`)
    let plan: GeneratedMacrocyclePlan

    try {
      plan = generateRagNasmProgram(scenario.request)
    } catch (err) {
      issues.push({
        scenario: scenario.name,
        day: 0,
        exercise: 'PROGRAM_GENERATION',
        issue: `Crash during program generation: ${err instanceof Error ? err.message : String(err)}`,
      })
      continue
    }

    // 1. Verify Phase Integrity
    if (plan.nasmOptPhase !== scenario.expectedPhase) {
      issues.push({
        scenario: scenario.name,
        day: 0,
        exercise: 'PHASE_CHECK',
        issue: `Expected phase ${scenario.expectedPhase}, got ${plan.nasmOptPhase}`,
      })
    }

    // 2. Verify Workouts Generated
    const expectedDays = scenario.request.trainingDaysPerWeek ?? 4
    if (plan.workouts.length !== expectedDays) {
      issues.push({
        scenario: scenario.name,
        day: 0,
        exercise: 'WORKOUT_DAYS_COUNT',
        issue: `Expected ${expectedDays} workout days, got ${plan.workouts.length}`,
      })
    }

    // 3. Inspect every exercise in every workout
    for (const workout of plan.workouts) {
      for (const ex of workout.exercises) {
        totalExercisesValidated++
        uniqueExercises.add(ex.name)

        // A. Forbidden terms check (equipment / contraindications)
        if (scenario.forbiddenTerms) {
          const lowerName = ex.name.toLowerCase()
          for (const forbidden of scenario.forbiddenTerms) {
            if (lowerName.includes(forbidden.toLowerCase())) {
              issues.push({
                scenario: scenario.name,
                day: workout.day,
                exercise: ex.name,
                issue: `Contains forbidden equipment/contraindicated term: "${forbidden}"`,
              })
            }
          }
        }

        // B. Search canonical library match
        const libraryMatch = searchNasmLibraryMedia(ex.name)
        if (!libraryMatch) {
          issues.push({
            scenario: scenario.name,
            day: workout.day,
            exercise: ex.name,
            issue: `Unmatched in official NASM/Forge Athletic complete library`,
          })
        }

        // C. Clinical movement card resolution
        const card = getNasmClinicalMovementCard(ex.name, {
          imageUrl: ex.imageUrl,
          videoUrl: ex.videoUrl,
          coachingCues: ex.coachingCues,
        })

        if (!card.category || card.category === ('Unknown' as unknown)) {
          issues.push({
            scenario: scenario.name,
            day: workout.day,
            exercise: ex.name,
            issue: `Missing valid movement card category`,
          })
        }

        if (!card.primeMover || card.primeMover.trim() === '') {
          issues.push({
            scenario: scenario.name,
            day: workout.day,
            exercise: ex.name,
            issue: `Missing prime mover kinesiology on movement card`,
          })
        }

        if (!card.kineticCheckpoints || !card.kineticCheckpoints.lphc) {
          issues.push({
            scenario: scenario.name,
            day: workout.day,
            exercise: ex.name,
            issue: `Incomplete kinetic chain checkpoints`,
          })
        }

        // D. Media Integrity
        if (!card.hasOfficialMedia) {
          issues.push({
            scenario: scenario.name,
            day: workout.day,
            exercise: ex.name,
            issue: `Missing official media (no video embed or clinical image)`,
          })
        }

        // E. Coaching Cues Check
        if (!ex.coachingCues || ex.coachingCues.length === 0) {
          issues.push({
            scenario: scenario.name,
            day: workout.day,
            exercise: ex.name,
            issue: `Empty coaching cues array in generated exercise item`,
          })
        }

        // Check for common typo / limb contradictory strings in cues
        const allCueText = (ex.coachingCues || []).join(' ')
        if (/one one foot/i.test(allCueText)) {
          issues.push({
            scenario: scenario.name,
            day: workout.day,
            exercise: ex.name,
            issue: `Typo "one one foot" detected in coaching cues`,
          })
        }
        if (/single[\s-]leg/i.test(ex.name) && /both knees|knees collapse/i.test(allCueText)) {
          issues.push({
            scenario: scenario.name,
            day: workout.day,
            exercise: ex.name,
            issue: `Plural knee cues detected on single-leg movement`,
          })
        }
        if (/single[\s-]arm/i.test(ex.name) && /both elbows|keep elbows under dumbbells/i.test(allCueText)) {
          issues.push({
            scenario: scenario.name,
            day: workout.day,
            exercise: ex.name,
            issue: `Plural elbow/dumbbell cues detected on single-arm movement`,
          })
        }
      }
    }
  }

  console.log('\n=================================================================')
  console.log('                    AUDIT MATRIX SUMMARY                         ')
  console.log('=================================================================')
  console.log(`Scenarios Tested:           ${TEST_SCENARIOS.length}`)
  console.log(`Total Exercises Audited:    ${totalExercisesValidated}`)
  console.log(`Unique Exercises Tested:    ${uniqueExercises.size}`)
  console.log(`Issues / Flagged Items:     ${issues.length}\n`)

  if (issues.length === 0) {
    console.log('✅ 100% PERFECT PASS! All 5 NASM OPT phases, equipment variations,')
    console.log('   and orthopedic safety gates generated flawless movement cards,')
    console.log('   verified canonical library records, and clean coaching cues.')
  } else {
    console.log(`❌ FOUND ${issues.length} ISSUE(S):`)
    for (const issue of issues) {
      console.log(`\n[${issue.scenario}] Day ${issue.day}: "${issue.exercise}"`)
      console.log(`  -> Issue: ${issue.issue}`)
    }
    process.exit(1)
  }
}

runValidation().catch(err => {
  console.error('Fatal error in audit matrix runner:', err)
  process.exit(1)
})
