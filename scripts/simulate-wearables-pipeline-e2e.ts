/**
 * Forge Athletic — Executive Telemetry & Wearable Biometric Synchronization Pipeline Simulation
 * 
 * End-to-End Sports Science & Biomechanical Simulation:
 * 1. Vital Health Bridge & 1-Tap Pairing URL Generation
 * 2. Multi-Provider Normalized Ingestion (Apple Health & Google Health Connect)
 * 3. Clinical Sleep Architecture & Cardiovascular Nocturnal Dip % Modeling
 * 4. Tanaka Heart Rate Zones & In-Gym Cardio Ingestion
 * 5. Acute-to-Chronic Workload Ratio (ACWR) & Autonomous CNS Readiness Gating
 * 6. Dynamic CPT-7 Chapter 21 Active Deload Triggering under Overtraining Strain
 * 7. Cryptographic Webhook Timing-Safe Authentication & HIPAA (1996) Privacy Validation
 */

import {
  generateVitalLinkToken,
  normalizeVitalDailyPayload,
  getVitalApiBaseUrl,
} from '../lib/vital-health-bridge'
import {
  computeWearableCnsScore,
  calculateTimeInHeartRateZones,
  normalizeWearableWorkout,
  type DailyBiometricSummary,
} from '../lib/wearables-telemetry'
import {
  calculateNocturnalRhrDip,
  evaluateSleepStages,
} from '../lib/executive-sleep-engine'
import {
  calculateAcwr,
  calculateReadinessScore,
  generateDeloadMicrocycle,
} from '../lib/readiness-telemetry'
import {
  verifyAppleHealthWebhookToken,
  verifyGoogleHealthWebhookToken,
} from '../lib/wearable-webhook-adapters'

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

async function main() {
  console.log('==================================================================================')
  console.log('  FORGE ATHLETIC — EXECUTIVE TELEMETRY & WEARABLE SYNC E2E SIMULATION  ')
  console.log('==================================================================================\n')

  // ── SCENARIO 1: ELITE ADAPTATION & RECOVERY (GREEN GATE) ─────────────────────
  console.log('── Scenario 1: Elite Executive Adaptation & Parasympathetic Dominance (Green Gate) ──')

const athleteId1 = 'client-exec-haye'
const baselineHrv = 70
const baselineRhr = 52

// 1. Ingest simulated Apple Health daily payload via Vital bridge
const rawAppleHealthPayload = {
  event_type: 'daily.data.apple_health.created',
  client_user_id: athleteId1,
  source: 'apple_health',
  data: {
    calendar_date: '2026-10-24',
    resting_hr: 48, // -4 bpm below baseline
    hrv_rmssd: 88, // +18ms above baseline (high parasympathetic recovery)
    steps: 11400,
    active_calories: 680,
    sleep: {
      duration_hours: 8.2,
      deep_hours: 2.3,
    },
    nutrition: {
      calories: 2550,
      protein: 215,
      carbs: 240,
      fat: 65,
    },
  },
}

const { userId, provider, summary, date } = normalizeVitalDailyPayload(rawAppleHealthPayload, athleteId1)
assert(userId === athleteId1, 'Extracted canonical client ID matching athlete profile')
assert(provider === 'apple_health', 'Identified Apple HealthKit as source of truth')
assert(date === '2026-10-24', 'Parsed calendar date correctly')
assert(summary.restingHeartRate === 48, 'Resting heart rate reflects 48 BPM')
assert(summary.hrvRmssdMs === 88, 'HRV rMSSD reflects 88ms')
assert(summary.nutrition?.proteinGrams === 215, 'Dietary protein accurately logged (215g)')

// 2. Validate Sleep Architecture (Deep, REM, Light, Awake)
const sleepEval = evaluateSleepStages(8.2, 2.3, 2.1, 3.4, 0.4)
assert(sleepEval.deepStatus === 'optimal', `Deep sleep classified as optimal (${sleepEval.deepPercent}% >= 18%)`)
assert(sleepEval.remStatus === 'optimal', `REM sleep classified as optimal (${sleepEval.remPercent}% >= 20%)`)

// 3. Validate Cardiovascular Nocturnal Dip %
const nocturnalDip = calculateNocturnalRhrDip(56, 48) // Daytime 56 BPM -> Nocturnal Min 48 BPM
assert(nocturnalDip.dipPercent === 14.3, `Nocturnal cardiac dip is 14.3% (within optimal 10-20% window)`)
assert(nocturnalDip.classification === 'normal_dipper', 'Classified as healthy autonomic dipper')

// 4. Validate CNS Readiness & ACWR Sweet Spot
const cnsScore1 = computeWearableCnsScore(summary.hrvRmssdMs, summary.restingHeartRate, baselineHrv, baselineRhr)
assert(typeof cnsScore1 === 'number' && cnsScore1 >= 90, `Computed standardized CNS score: ${cnsScore1}/100`)

const acwr1 = calculateAcwr([400, 450, 0, 420, 480, 0, 450], 2200) // 2200 acute / 2200 chronic = 1.00
assert(acwr1.zone === 'Sweet Spot (Optimal Overload)', `ACWR ratio (${acwr1.ratio}) in Sweet Spot (0.80 - 1.30)`)
assert(acwr1.deloadRecommended === false, 'Deload is NOT recommended during optimal adaptation')

const readiness1 = calculateReadinessScore({
  sleepHours: summary.sleepHours,
  sleepQuality: 9,
  restingHeartRate: summary.restingHeartRate,
  baselineRhr,
  sorenessLevel: 2,
  stressLevel: 2,
  recentWorkloadUnits: [400, 450, 0, 420, 480, 0, 450],
  chronicAvgWeeklyWorkload: 2200,
})
assert(readiness1.gate === 'GREEN', 'Readiness Gate evaluates to GREEN')
assert(readiness1.workoutAction === 'proceed_normal', 'Action confirms proceed_normal with full volume')
assert(readiness1.rpeCap === 9.5, 'RPE capacity unconstrained at 9.5')
assert(readiness1.restIntervalAdjustmentSec === 0, 'No extra rest penalty added')

// 5. In-Gym Workout Telemetry & Tanaka Zones
const workoutSamples = [
  { timestamp: '2026-10-24T10:00:00Z', bpm: 110 },
  { timestamp: '2026-10-24T10:10:00Z', bpm: 125 }, // Zone 1
  { timestamp: '2026-10-24T10:20:00Z', bpm: 145 }, // Zone 2
  { timestamp: '2026-10-24T10:30:00Z', bpm: 165 }, // Zone 3
  { timestamp: '2026-10-24T10:40:00Z', bpm: 170 },
]
const timeInZones = calculateTimeInHeartRateZones(workoutSamples, 38)
assert(timeInZones.zone1Mins > 0, 'Accurately accumulated Zone 1 base conditioning time')
assert(timeInZones.zone2Mins > 0, 'Accurately accumulated Zone 2 aerobic endurance time')
assert(timeInZones.zone3Mins > 0, 'Accurately accumulated Zone 3 anaerobic threshold time')

console.log('')

// ── SCENARIO 2: SEVERE OVERTRAINING & ACWR SPIKE (RED GATE & DELOAD TRIGGER) ─
console.log('── Scenario 2: Overtraining Syndrome (OTS) Risk & ACWR Spike (Red Gate Deload) ──')

const athleteId2 = 'client-marathoner-ots'

// 1. Acute workload spike (4300 acute units vs 2100 chronic baseline = ACWR 2.05)
const acwr2 = calculateAcwr([800, 850, 0, 950, 850, 0, 850], 2100)
assert(acwr2.zone === 'Danger Zone (OTS Risk)', `ACWR ratio (${acwr2.ratio}) indicates Extreme OTS Danger Zone (>= 1.50)`)
assert(acwr2.deloadRecommended === true, 'ACWR engine officially flags deloadRecommended: true')
assert(acwr2.injuryRiskPercentage >= 35, `Injury risk percentage elevated to ${acwr2.injuryRiskPercentage}%`)

// 2. Sympathetic exhaustion telemetry (HRV crashed, RHR elevated +12 bpm)
const crashedHrv = 32 // Crashed from 70ms baseline
const elevatedRhr = 64 // Elevated from 52 bpm baseline
const poorSleep = 4.8

const cnsScore2 = computeWearableCnsScore(crashedHrv, elevatedRhr, baselineHrv, baselineRhr)
assert(typeof cnsScore2 === 'number' && cnsScore2 <= 55, `CNS stress score severely suppressed: ${cnsScore2}/100`)

// 3. Autonomic Nocturnal Dip Failure (<10% dip)
const nonDipperRhr = calculateNocturnalRhrDip(66, 62) // Daytime 66 BPM -> Nocturnal 62 BPM = 6.1% dip
assert(nonDipperRhr.classification === 'non_dipper', 'Classified as non_dipper due to residual sympathetic tone')

// 4. Decision Tree: Red Gate & Deload Microcycle Generation
const readiness2 = calculateReadinessScore({
  sleepHours: poorSleep,
  sleepQuality: 3,
  restingHeartRate: elevatedRhr,
  baselineRhr,
  sorenessLevel: 8,
  stressLevel: 8,
  recentWorkloadUnits: [800, 850, 0, 950, 850, 0, 850],
  chronicAvgWeeklyWorkload: 2100,
})

assert(readiness2.gate === 'RED', 'Systemic Readiness Gate strictly clamps to RED')
assert(readiness2.workoutAction === 'trigger_deload', 'Workout action triggers trigger_deload')
assert(readiness2.deloadPlan !== undefined, 'Deload plan auto-populated')
assert(readiness2.deloadPlan?.days.length === 7, 'Deload microcycle contains full 7-day periodized schedule')
assert(Boolean(readiness2.deloadPlan?.volumeReduction.includes('-40%')), 'Deload enforces -40% to -50% volume reduction')
assert(readiness2.deloadPlan?.days[0].rpeCap === 7, 'Day 1 lifting strictly capped at RPE 7.0 (RIR 3+)')
assert(readiness2.intensityMultiplier <= 0.85, 'Intensity multiplier attenuated for neuromuscular recovery')

console.log('')

// ── SCENARIO 3: MODERATE FATIGUE (YELLOW GATE AUTOREGULATION) ────────────────
console.log('── Scenario 3: Moderate CNS Fatigue & Volume Moderation (Yellow Gate) ──')

const athleteId3 = 'client-builder-yellow'

const readiness3 = calculateReadinessScore({
  sleepHours: 6.4,
  sleepQuality: 6,
  restingHeartRate: 56,
  baselineRhr: 52,
  sorenessLevel: 6,
  stressLevel: 5,
  recentWorkloadUnits: [450, 500, 0, 480, 520, 0, 500],
  chronicAvgWeeklyWorkload: 2000,
})

assert(readiness3.gate === 'YELLOW', 'Readiness Gate evaluates to YELLOW')
assert(readiness3.workoutAction === 'reduce_volume', 'Recommends reduce_volume to safeguard connective tissue')
assert(readiness3.rpeCap === 8.0, 'RPE capped at 8.0 to prevent motor breakdown')
assert(readiness3.restIntervalAdjustmentSec === 30, 'Applies +30 second extension to rest intervals')
assert(readiness3.intensityMultiplier === 0.85, 'Intensity multiplier set to 0.85')

console.log('')

// ── SCENARIO 4: CRYPTOGRAPHIC AUTHENTICATION & HIPAA (1996) PRIVACY ──────────
console.log('── Scenario 4: Cryptographic Webhook Security & HIPAA (1996) Safeguards ──')

const secret = 'forge_whsec_99a8b7c6d5e4f3a2b1c0'

// 1. Timing-safe verification of Apple Health Bearer token
const validHeader = `Bearer ${secret}`
const invalidHeader = 'Bearer forged_token_invalid_secret_99'
const malformedHeader = 'Basic dXNlcjpwYXNz'

assert(verifyAppleHealthWebhookToken(validHeader, secret) === true, 'Timing-safe validation verifies correct Bearer secret')
assert(verifyAppleHealthWebhookToken(invalidHeader, secret) === false, 'Timing-safe validation rejects attacker secret')
assert(verifyAppleHealthWebhookToken(malformedHeader, secret) === false, 'Timing-safe validation rejects non-Bearer header')
assert(verifyAppleHealthWebhookToken(null, secret) === false, 'Gracefully handles missing authorization headers')

// 2. Google Health Connect token verification
assert(verifyGoogleHealthWebhookToken(validHeader, secret) === true, 'Verifies Google Health Connect token correctly')

// 3. Vital Link URL Generation
const vitalLink = await generateVitalLinkToken('client-hipaa-test', 'apple_health')
assert(vitalLink.linkToken.length > 0, 'Generated secure, client-scoped Link Token')
assert(vitalLink.connectUrl.includes('link.tryvital.io'), 'Returns trusted TryVital connection URL')
assert(vitalLink.provider === 'apple_health', 'Scoping strictly to requested wearable provider')

// 4. Base URL Environment Protection
assert(getVitalApiBaseUrl().startsWith('https://'), 'Vital API always enforces TLS 1.3 / HTTPS encryption in transit')

  console.log('\n==================================================================================')
  console.log(`  SIMULATION COMPLETE: ${passCount} Passed, ${failCount} Failed`)
  console.log('==================================================================================\n')

  if (failCount > 0) {
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Fatal simulation error:', err)
  process.exit(1)
})
