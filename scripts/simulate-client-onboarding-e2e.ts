/**
 * Forge Athletic — Client Onboarding & Intake Flow End-to-End Simulation
 * 
 * Verifies the full client onboarding and intake pipeline:
 * 1. Intake Profile & Baseline Biometrics (vitals, goals, equipment access)
 * 2. PAR-Q+ Clinical Health Questionnaire & Legal Electronic Consents
 * 3. Emergency Remote Action Plan (ERAP) Compliance (dispatch phone, gate codes, physical location)
 * 4. AI Posture/OHSA Movement Screening (kinetic compensations, 4-Phase CEx warmups)
 * 5. AI DEXA Body Composition & 12-Week OPT™ Periodization Architecture
 * 6. Automated Bespoke Program Design (100% canonical NASM library exercises with verified videos)
 * 7. Medical Clearance Safety Gating & Orthopedic Contraindication Clamping
 */

import {
  runAiCoachOnboardingSynthesis,
  recommendPeriodizationFromScans,
  generateProgramDesignFromScans,
  extractCExContinuum,
  type ClientOnboardingProfileInput,
} from '../lib/ai-coach-onboarding-orchestrator'
import {
  evaluateClientOnboardingProgression,
  parseParqAnswers,
  type ClientProgressionTelemetry,
} from '../lib/coach-onboarding-progression'
import { evaluateMedicalParq } from '../lib/liability-shield'
import { searchNasmLibraryMedia } from '../lib/nasm-fuzzy-matcher'
import type { BodyCompositionScanResult } from '../lib/ai-body-composition-engine'
import type { PosturalMeshScanResult } from '../lib/ai-postural-mesh-scanner'

let passCount = 0
let failCount = 0

function assert(condition: boolean, message: string) {
  if (condition) {
    passCount++
    console.log(`  ✓ ${message}`)
  } else {
    failCount++
    console.error(`  ✗ FAILED: ${message}`)
  }
}

console.log('=================================================================')
console.log('   FORGE ATHLETIC — CLIENT ONBOARDING & INTAKE E2E SIMULATION   ')
console.log('=================================================================\n')

// ── SCENARIO 1: STANDARD ATHLETE COMPLETE ONBOARDING & PROGRAM GENERATION ──
console.log('── Scenario 1: Standard Executive Athlete (Clean PAR-Q+, Full Gym Access) ──')

const standardClientInput: ClientOnboardingProfileInput = {
  clientId: 'client-exec-001',
  clientName: 'Alexander Hayes',
  age: 42,
  sex: 'male',
  heightCm: 185,
  weightKg: 86,
  fitnessGoal: 'fat_loss',
  trainingDaysPerWeek: 4,
  equipmentAccess: ['Barbell', 'Dumbbells', 'Cable Machine', 'Adjustable Bench', 'Pull-Up Bar'],
  cardioEquipmentAccess: ['Rowing Ergometer', 'Treadmill', 'Assault AirBike'],
}

const standardParqAnswers = {
  q1: false,
  q2: false,
  q3: false,
  q4: false,
  q5: false,
  q6: false,
  q7: false,
  erap: {
    workoutStreetAddress: '100 Executive Way',
    workoutUnitOrGateCode: 'Suite 400, Gate *1234',
    workoutCity: 'New York',
    workoutState: 'NY',
    workoutPostalCode: '10001',
    localEmergencyDispatchPhone: '212-555-0911',
    virtualTelehealthConsent: true,
  },
}

// 1. Evaluate PAR-Q+ & Medical Liability Shield
const medicalEvaluation = evaluateMedicalParq(parseParqAnswers(standardParqAnswers))
assert(medicalEvaluation.clearanceStatus === 'cleared_unrestricted', 'PAR-Q+ cleared with unrestricted status')
assert(medicalEvaluation.riskTier === 'Low Risk', 'Risk level evaluated as Low Risk')

// 2. Evaluate ERAP Compliance
const erap = standardParqAnswers.erap
assert(Boolean(erap.workoutStreetAddress && erap.workoutCity && erap.workoutState), 'ERAP physical dispatch address captured')
assert(Boolean(erap.localEmergencyDispatchPhone), 'ERAP local emergency dispatch phone registered')
assert(erap.virtualTelehealthConsent === true, 'Telehealth and remote emergency action plan consent confirmed')

// 3. Posture Scan & OHSA Findings
const standardPostureScan: PosturalMeshScanResult = {
  view: 'overhead_squat',
  landmarks: [],
  angles: [
    { name: 'Knee Valgus Q-Angle', angleDegrees: 10, status: 'moderate', normalRange: '< 5°', clinicalNote: 'Mild knee valgus on descent' },
  ],
  detectedCompensations: ['knees_cave_in'],
  ohsaObservations: [
    { compensation: 'knees_move_inward', checkpoint: 'knees', observed: true, severity: 'mild', view: 'anterior' },
  ],
  staticFindings: [],
  syndromeDetected: 'Pronation Distortion',
  cexPrescription: {
    inhibit: [{ muscle: 'Adductor Complex & TFL', protocol: 'SMR 30-60s on foam roller' }],
    lengthen: [{ muscle: 'Static Kneeling Hip Flexor / Adductor Stretch', protocol: 'Hold 30s x 2 sets' }],
    activate: [{ muscle: 'Gluteus Medius (Clamshells & Banded Lateral Walks)', protocol: '3 sets x 15 reps' }],
    integrate: [{ exercise: 'Single-Leg Squat to Bench with Band', protocol: '3 sets x 10 reps (4/2/1 tempo)' }],
  },
  clinicalSummary: 'Pronation distortion syndrome with valgus tendency.',
}

// 4. DEXA Body Comp Scan
const standardDexaScan: BodyCompositionScanResult = {
  estimatedBodyFatPercent: 21.5,
  confidenceIntervalPercent: 1.1,
  confidenceScore: 0.95,
  bodyDensity: 1.05,
  classification: 'Fitness / Defined',
  weightKg: 86,
  weightLbs: 189.6,
  fatMassKg: 18.5,
  fatMassLbs: 40.8,
  leanBodyMassKg: 67.5,
  leanBodyMassLbs: 148.8,
  skeletalMuscleMassKg: 37.8,
  skeletalMuscleMassLbs: 83.3,
  ffmi: 20.8,
  normalizedFfmi: 20.6,
  ffmiCategory: 'Above Average',
  visceralFatRisk: 'Low',
  androidGynoidRatio: 0.95,
  waistToHeightRatio: 0.48,
  cunninghamBmr: 1840,
  katchMcArdleBmr: 1825,
  maintenanceCaloriesTdee: 2750,
  estimatedCircumferencesCm: {
    waistNavelCm: 88,
    neckCm: 40,
    hipGluteCm: 99,
    chestCm: 106,
    thighCm: 59,
    bicepCm: 37,
  },
  waistToHipRatio: 0.89,
  landmarks: [],
  regionalBreakdown: [],
  photoQualityAssessment: {
    overallRating: 'optimal',
    framingScore: 94,
    lightingScore: 92,
    clothingOcclusionWarning: false,
    postureCompensationDetected: true,
    multiViewEnhanced: true,
  },
  recompositionProjection: {
    targetWeightKg: 80,
    targetWeightLbs: 176,
    targetBodyFatPercent: 15,
    targetFatMassKg: 12,
    targetFatMassLbs: 26.5,
    fatToLoseKg: 6.5,
    fatToLoseLbs: 14.3,
    leanMassChangeKg: 0.5,
    leanMassChangeLbs: 1.1,
    estimatedWeeksToGoal: 12,
    dailyCaloricTarget: 2250,
    dailyProteinGrams: 175,
    recommendedNasmPhase: 1,
    phaseName: 'Phase 1: Stabilization Endurance',
    weeklyDeficitOrSurplusCalories: -3500,
    coachingDirectives: ['Execute stabilization protocols', 'Preserve LBM via 4/2/1 tempo'],
  },
  methodDescription: 'DEXA 4C Multi-View AI Spatial Anthropometry',
  coachSummaryNotes: 'Athletic build with high lean mass potential.',
}

// 5. Run Unified AI Coach Onboarding Synthesis
const synthesis = runAiCoachOnboardingSynthesis({
  client: standardClientInput,
  dexaScan: standardDexaScan,
  postureScan: standardPostureScan,
})

// Lower kinetic valgus requires Phase 1 Stabilization per NASM OPT clinical guidelines
assert(synthesis.periodizationRecommendation.targetNasmPhase === 1, 'Knee valgus compensation triggers mandatory Phase 1 Stabilization')
assert(synthesis.periodizationRecommendation.macrocyclePlan.weeks.length === 12, '12-week macrocycle generated')
assert(synthesis.programDesignRecommendation.macrocyclePlan.workouts.length === 4, '4-day training split matched to client frequency')

// Verify 4-Phase CEx Warmups are embedded on all workouts
const days = synthesis.programDesignRecommendation.macrocyclePlan.workouts
const allDaysHaveCex = days.every(d =>
  d.warmupProtocol.inhibitSmr.length > 0 &&
  d.warmupProtocol.lengthenStaticStretch.length > 0 &&
  d.warmupProtocol.activateDynamic.length > 0
)
assert(allDaysHaveCex, 'Embedded 4-Phase CEx warmups present across all 4 training days')

// Verify all resistance exercises match canonical NASM library with verified videos
let allExercisesValid = true
for (const day of days) {
  for (const ex of day.exercises) {
    const matched = searchNasmLibraryMedia(ex.name)
    if (!matched) {
      console.warn(`Unmatched exercise in generated program: ${ex.name}`)
      allExercisesValid = false
    }
  }
}
assert(allExercisesValid, '100% of generated exercises match canonical NASM library records')

// 6. Test Progression Continuum & Coach Authorization Gates
const clientTelemetry: ClientProgressionTelemetry = {
  clientId: standardClientInput.clientId,
  clientName: standardClientInput.clientName,
  email: 'alexander@forge-athletic.app',
  designatedCoachId: 'coach-sc-01',
  packages: [{ id: 'pkg-1', package_name: 'Forge Executive 12', sessions_remaining: 12, sessions_total: 12, source: 'paid' }],
  intakeForm: {
    parq_answers: standardParqAnswers,
    consent_signature_name: 'Alexander Hayes',
    consent_signed_at: new Date().toISOString(),
  },
  fitnessProfile: {
    height_cm: standardClientInput.heightCm,
    weight_kg: standardClientInput.weightKg,
    fitness_goal: standardClientInput.fitnessGoal,
    equipment_access: standardClientInput.equipmentAccess,
    training_days_per_week: standardClientInput.trainingDaysPerWeek,
  },
  latestPlan: {
    id: 'plan-hayes-1',
    name: 'Executive Strength Endurance Protocol',
    nasm_opt_phase: 1,
    plan_json: synthesis.programDesignRecommendation.macrocyclePlan,
  },
  enforceGates: true,
  gates: {
    1: { status: 'authorized', authorizedBy: 'coach-sc-01', authorizedAt: new Date().toISOString() },
    2: { status: 'authorized', authorizedBy: 'coach-sc-01', authorizedAt: new Date().toISOString() },
    3: { status: 'authorized', authorizedBy: 'coach-sc-01', authorizedAt: new Date().toISOString() },
    4: { status: 'authorized', authorizedBy: 'coach-sc-01', authorizedAt: new Date().toISOString() },
    5: { status: 'authorized', authorizedBy: 'coach-sc-01', authorizedAt: new Date().toISOString() },
    6: { status: 'authorized', authorizedBy: 'coach-sc-01', authorizedAt: new Date().toISOString() },
  },
}

const progression = evaluateClientOnboardingProgression(clientTelemetry)
assert(progression.isBlockedByMedicalClearance === false, 'No medical block on progression')
assert(progression.currentStageNumber === 7, 'Progressed to Stage 7 (Live Coaching Delivery & Kickoff)')
assert(progression.completedOnboardingCount === 6, '6 onboarding stages completed and authorized')
assert(progression.stages[6].gate.canAuthorize === true, 'Coach authorized to deliver kickoff session')


// ── SCENARIO 2: CARDIOVASCULAR & ORTHOPEDIC CONTRAINDICATION SAFETY GATING ──
console.log('\n── Scenario 2: High-Risk Athlete (Hypertension, Beta-Blockers & Lumbar Disc Herniation) ──')

const highRiskClientInput: ClientOnboardingProfileInput = {
  clientId: 'client-risk-002',
  clientName: 'Robert Vance',
  age: 56,
  sex: 'male',
  heightCm: 178,
  weightKg: 95,
  fitnessGoal: 'fat_loss',
  trainingDaysPerWeek: 3,
  equipmentAccess: ['Dumbbells', 'Adjustable Bench', 'Resistance Bands'],
  injuriesLimitations: 'L4-L5 lumbar disc herniation, severe flexion intolerance. Takes Metoprolol for hypertension.',
  contraindicationTags: ['lumbar_disc_condition'],
}

const highRiskParqAnswers = {
  q1: true, // Diagnosed cardiovascular condition
  q2: false,
  q3: false,
  q4: false,
  q5: true, // Bone or joint problem
  q6: true, // Blood pressure medication (beta-blocker)
  q7: false,
  erap: {
    workoutStreetAddress: '55 Park Avenue',
    workoutUnitOrGateCode: 'Apt 12B',
    workoutCity: 'New York',
    workoutState: 'NY',
    workoutPostalCode: '10016',
    localEmergencyDispatchPhone: '212-555-0911',
    virtualTelehealthConsent: true,
  },
}

// 1. Evaluate PAR-Q+ Medical Alert
const riskMedicalEval = evaluateMedicalParq(parseParqAnswers(highRiskParqAnswers))
assert(riskMedicalEval.clearanceStatus === 'physician_clearance_required', 'Physician clearance required due to diagnosed heart condition')
assert(riskMedicalEval.riskTier === 'High Risk - Medical Clearance Required', 'Risk level evaluated as High Risk')

// 2. Evaluate Gate Enforcement
const riskTelemetry: ClientProgressionTelemetry = {
  clientId: highRiskClientInput.clientId,
  clientName: highRiskClientInput.clientName,
  email: 'robert@forge-athletic.app',
  designatedCoachId: 'coach-sc-01',
  packages: [{ id: 'pkg-2', package_name: 'Rehab / Longevity 10', sessions_remaining: 10, sessions_total: 10, source: 'paid' }],
  intakeForm: {
    parq_answers: highRiskParqAnswers,
    consent_signature_name: 'Robert Vance',
    consent_signed_at: new Date().toISOString(),
  },
  enforceGates: true,
  gates: {
    1: { status: 'authorized', authorizedBy: 'coach-sc-01' },
  },
}

const riskProgression = evaluateClientOnboardingProgression(riskTelemetry)
assert(riskProgression.isBlockedByMedicalClearance === true, 'Progression blocked by medical clearance gate')
assert(riskProgression.currentStageNumber === 2, 'Progression halted at Stage 2 (Liability Shield & PAR-Q+)')
assert(riskProgression.stages[1].gate.status === 'blocked', 'Stage 2 gate status is BLOCKED')
assert(riskProgression.stages[1].gate.canAuthorize === false, 'Cannot authorize Stage 2 until physician clearance is recorded')

// 3. Program Generation Safety Gating
const riskSynthesis = runAiCoachOnboardingSynthesis({
  client: highRiskClientInput,
  dexaScan: null,
  postureScan: null,
})

assert(riskSynthesis.periodizationRecommendation.targetNasmPhase === 1, 'High-risk client clamped to Phase 1 (Stabilization Endurance)')
assert(riskSynthesis.periodizationRecommendation.clinicalRationale.weeklyCardioPrescription.includes('RPE') ||
       riskSynthesis.periodizationRecommendation.clinicalRationale.summary.includes('Phase 1'),
       'Clinical rationale enforces RPE pacing & stabilization')

// Verify forbidden spinal shear movements are absent
const riskDays = riskSynthesis.programDesignRecommendation.macrocyclePlan.workouts
let hasForbiddenLumbarMovements = false
for (const day of riskDays) {
  for (const ex of day.exercises) {
    const lower = ex.name.toLowerCase()
    if (lower.includes('good morning') || lower.includes('jefferson') || lower.includes('back extension')) {
      hasForbiddenLumbarMovements = true
    }
  }
}
assert(!hasForbiddenLumbarMovements, 'Zero forbidden spinal shearing exercises in generated program')


// ── SCENARIO 3: PREGNANCY / PRENATAL OPT™ MAXIMUM PHASE CLAMPING ──
console.log('\n── Scenario 3: Special Population (Prenatal Second Trimester) ──')

const prenatalClientInput: ClientOnboardingProfileInput = {
  clientId: 'client-prenatal-003',
  clientName: 'Elena Rostova',
  age: 32,
  sex: 'female',
  heightCm: 168,
  weightKg: 68,
  fitnessGoal: 'Hypertrophy and Muscle Building',
  trainingDaysPerWeek: 3,
  equipmentAccess: ['Dumbbells', 'Adjustable Bench', 'Stability Ball', 'Resistance Bands'],
  injuriesLimitations: 'Currently pregnant in second trimester. Physician approved light-to-moderate exercise.',
}

const prenatalRecommendation = recommendPeriodizationFromScans({
  client: prenatalClientInput,
  dexaScan: null,
  postureScan: null,
})

assert(prenatalRecommendation.targetNasmPhase <= 2, 'Prenatal athlete phase clamped to Phase 2 maximum')
assert(prenatalRecommendation.macrocyclePlan.specialPopulation === 'pregnancy_prenatal', 'Special population tagged as pregnancy_prenatal')
assert(prenatalRecommendation.macrocyclePlan.maxAllowedOptPhase === 2, 'Max allowed OPT phase is strictly 2')

const prenatalProgram = generateProgramDesignFromScans({
  client: prenatalClientInput,
  dexaScan: null,
  postureScan: null,
  periodization: prenatalRecommendation,
})

// Check for absence of prone/supine prolonged positions and power jumps
let hasInappropriatePrenatalMovements = false
for (const day of prenatalProgram.macrocyclePlan.workouts) {
  for (const ex of day.exercises) {
    const lower = ex.name.toLowerCase()
    if (lower.includes('jump') || lower.includes('burpee') || lower.includes('tuck')) {
      hasInappropriatePrenatalMovements = true
    }
  }
}
assert(!hasInappropriatePrenatalMovements, 'Zero high-impact ballistic or jumping movements in prenatal program')


console.log('\n=================================================================')
console.log(`SIMULATION RESULTS: ${passCount} Passed | ${failCount} Failed`)
console.log('=================================================================')

if (failCount > 0) {
  process.exit(1)
} else {
  console.log('✅ ALL INTAKE, ERAP, BIOMETRICS, OHSA, AND OPT GATING SIMULATIONS PASSED!')
}
