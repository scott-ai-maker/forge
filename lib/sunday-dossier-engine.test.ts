import { describe, expect, it } from 'vitest'
import { generateSundayDossier } from './sunday-dossier-engine'

describe('Sunday Intelligence Dossier Engine', () => {
  it('correctly aggregates tonnage, working sets, and adherence for a full week', () => {
    const sampleSets = [
      { session_date: '2026-08-18', weight_lbs: 225, reps: 8, is_warmup: false, rpe: 8 }, // 1800 lbs
      { session_date: '2026-08-18', weight_lbs: 225, reps: 8, is_warmup: false, rpe: 8 }, // 1800 lbs
      { session_date: '2026-08-18', weight_lbs: 135, reps: 10, is_warmup: true, rpe: 5 }, // warm-up skipped from tonnage
      { session_date: '2026-08-20', weight_lbs: 315, reps: 5, is_warmup: false, rpe: 8.5 }, // 1575 lbs
      { session_date: '2026-08-22', weight_lbs: 185, reps: 10, is_warmup: false, rpe: 7.5 }, // 1850 lbs
    ]

    const sampleCardio = [
      { session_date: '2026-08-19', activity_type: 'Zone 2 Rower', duration_mins: 35, avg_heart_rate: 132 },
      { session_date: '2026-08-21', activity_type: 'Incline Treadmill Walk', duration_mins: 25, avg_heart_rate: 125 },
    ]

    const samplePrs = [
      { exercise_name: 'Barbell Deadlift', weight_lbs: 405, reps: 3, achieved_at: '2026-08-20' },
    ]

    const dossier = generateSundayDossier(
      'Alexander Vance',
      'Phase 3: Muscular Development',
      sampleSets,
      sampleCardio,
      samplePrs,
      4,
      52,
      74
    )

    // Expected tonnage: 1800 + 1800 + 1575 + 1850 = 7025 lbs
    expect(dossier.totalTonnageLbs).toBe(7025)
    expect(dossier.totalWorkingSets).toBe(4)
    expect(dossier.totalCardioMins).toBe(60)
    expect(dossier.zone2CardioMins).toBe(60)
    // 3 lift days (18, 20, 22) + 2 cardio days (19, 21) = 5 active session dates / 4 target = 100% adherence (capped)
    expect(dossier.adherencePct).toBe(100)
    expect(dossier.recoveryIndexScore).toBeGreaterThanOrEqual(80)
    expect(dossier.executiveSummary.length).toBeGreaterThanOrEqual(3)
    expect(dossier.nextWeekFocus).toContain('small increase (2.5–5%)')
  })

  it('handles empty / rest week gracefully with baseline calibration message', () => {
    const dossier = generateSundayDossier(
      'New Athlete',
      'Phase 1: Stabilization Endurance',
      [],
      [],
      [],
      4,
      62,
      55
    )

    expect(dossier.totalTonnageLbs).toBe(0)
    expect(dossier.totalWorkingSets).toBe(0)
    expect(dossier.completedSessions).toBe(0)
    expect(dossier.adherencePct).toBe(0)
    expect(dossier.acwrRatio).toBeNull()
    expect(dossier.acwrZone).toBe('No Data')
    expect(dossier.acwrStatusMessage).toContain('Not enough recent workout data')
    expect(dossier.executiveSummary[0]).toContain('not enough workout data')
    expect(dossier.authSignature).toMatch(/^GAA-SIG-[0-9A-F]{4}-[0-9A-F]{4}$/)
    expect(dossier.soapRecord.subjective).toBeTruthy()
    expect(dossier.soapRecord.plan).toBeTruthy()
  })

  describe('classifyExerciseKineticPattern', () => {
    it('accurately classifies exercises across the 5 fundamental kinetic planes', async () => {
      const { classifyExerciseKineticPattern } = await import('./sunday-dossier-engine')

      // Push
      expect(classifyExerciseKineticPattern('Barbell Bench Press')).toBe('push')
      expect(classifyExerciseKineticPattern('Dumbbell Shoulder Press')).toBe('push')
      expect(classifyExerciseKineticPattern('Tricep Pushdown')).toBe('push')

      // Pull
      expect(classifyExerciseKineticPattern('Barbell Bent-Over Row')).toBe('pull')
      expect(classifyExerciseKineticPattern('Neutral Grip Lat Pulldown')).toBe('pull')
      expect(classifyExerciseKineticPattern('Dumbbell Hammer Curl')).toBe('pull')

      // Squat
      expect(classifyExerciseKineticPattern('Barbell Back Squat')).toBe('squat')
      expect(classifyExerciseKineticPattern('Walking Lunges')).toBe('squat')
      expect(classifyExerciseKineticPattern('Leg Press')).toBe('squat')

      // Hinge
      expect(classifyExerciseKineticPattern('Barbell Romanian Deadlift')).toBe('hinge')
      expect(classifyExerciseKineticPattern('Barbell Hip Thrust')).toBe('hinge')
      expect(classifyExerciseKineticPattern('Kettlebell Swing')).toBe('hinge')

      // Carry & Core
      expect(classifyExerciseKineticPattern('Farmer Carry')).toBe('carry_core')
      expect(classifyExerciseKineticPattern('Plank')).toBe('carry_core')
      expect(classifyExerciseKineticPattern('Pallof Press')).toBe('push') // contains press -> push
    })
  })

  describe('computeKineticDistribution', () => {
    it('calculates set counts and exact integer percentages across planes, ignoring warm-ups', async () => {
      const { computeKineticDistribution } = await import('./sunday-dossier-engine')

      const sets = [
        { session_date: '2026-08-18', exercise_name: 'Barbell Bench Press', is_warmup: false },
        { session_date: '2026-08-18', exercise_name: 'Incline Dumbbell Press', is_warmup: false },
        { session_date: '2026-08-18', exercise_name: 'Warmup Pushup', is_warmup: true }, // ignored
        { session_date: '2026-08-20', exercise_name: 'Barbell Row', is_warmup: false },
        { session_date: '2026-08-22', exercise_name: 'Barbell Back Squat', is_warmup: false },
        { session_date: '2026-08-22', exercise_name: 'Barbell Deadlift', is_warmup: false },
      ]

      const dist = computeKineticDistribution(sets)
      expect(dist.totalSets).toBe(5)
      expect(dist.pushSets).toBe(2)
      expect(dist.pullSets).toBe(1)
      expect(dist.squatSets).toBe(1)
      expect(dist.hingeSets).toBe(1)
      expect(dist.pushPct).toBe(40)
      expect(dist.pullPct).toBe(20)
      expect(dist.squatPct).toBe(20)
      expect(dist.hingePct).toBe(20)
    })
  })

  describe('generateCryptographicDossierSignature', () => {
    it('generates a valid, deterministic sovereign signature hash', async () => {
      const { generateCryptographicDossierSignature } = await import('./sunday-dossier-engine')

      const sig1 = generateCryptographicDossierSignature('Alexander Vance', 50000, 4)
      const sig2 = generateCryptographicDossierSignature('Alexander Vance', 50000, 4)
      const sig3 = generateCryptographicDossierSignature('Alexander Vance', 50001, 4)

      expect(sig1).toMatch(/^GAA-SIG-[0-9A-F]{4}-[0-9A-F]{4}$/)
      expect(sig1).toBe(sig2) // Deterministic
      expect(sig1).not.toBe(sig3) // Sensitive to workload variance
    })
  })

  describe('ACWR Sports Science Telemetry', () => {
    it('calculates Sweet Spot (0.80–1.30) when acute matches chronic workload', () => {
      const sets = [
        { session_date: '2026-08-18', weight_lbs: 200, reps: 10, is_warmup: false, rpe: 8 }, // 2000 lbs
        { session_date: '2026-08-20', weight_lbs: 200, reps: 10, is_warmup: false, rpe: 8 }, // 2000 lbs
        { session_date: '2026-08-22', weight_lbs: 200, reps: 10, is_warmup: false, rpe: 8 }, // 2000 lbs
      ]

      // Acute tonnage = 6000 lbs. If chronic baseline is 6000 lbs -> ACWR = 1.00 (Sweet Spot)
      const dossier = generateSundayDossier(
        'Athlete',
        'Phase 2: Strength Endurance',
        sets,
        [],
        [],
        3,
        50,
        70,
        6000
      )

      expect(dossier.acwrRatio).toBe(1)
      expect(dossier.acwrZone).toBe('Sweet Spot')
      expect(dossier.acwrStatusMessage).toContain('within your usual range')
    })

    it('flags Danger Zone (>=1.50) when acute workload spikes significantly over chronic baseline', () => {
      const sets = [
        { session_date: '2026-08-18', weight_lbs: 500, reps: 10, is_warmup: false, rpe: 9 }, // 5000 lbs
        { session_date: '2026-08-20', weight_lbs: 500, reps: 10, is_warmup: false, rpe: 9 }, // 5000 lbs
      ]

      // Acute tonnage = 10000 lbs. Chronic baseline = 5000 lbs -> ACWR = 2.00 (Danger Zone)
      const dossier = generateSundayDossier(
        'Athlete',
        'Phase 4: Maximal Strength',
        sets,
        [],
        [],
        2,
        55,
        65,
        5000
      )

      expect(dossier.acwrRatio).toBe(2)
      expect(dossier.acwrZone).toBe('Danger Zone')
      expect(dossier.acwrStatusMessage).toContain('much higher than usual')
    })

    it('reports No Data and null ACWR ratio when no working sets are logged', () => {
      const dossier = generateSundayDossier(
        'New Athlete',
        'Phase 1: Stabilization Endurance',
        [],
        [],
        [],
        3,
        50,
        70,
        0
      )

      expect(dossier.acwrRatio).toBeNull()
      expect(dossier.acwrZone).toBe('No Data')
      expect(dossier.acwrStatusMessage).toContain('Not enough recent workout data')
      expect(dossier.soapRecord.objective).toContain('not enough data yet')
      expect(dossier.soapRecord.assessment).toContain('not enough training data yet')
    })

    it('synthesizes clinical S.O.A.P. notes integrating ACWR and recovery indices', () => {
      const sets = [
        { session_date: '2026-08-18', weight_lbs: 225, reps: 8, is_warmup: false, rpe: 8, exercise_name: 'Bench Press' },
      ]

      const dossier = generateSundayDossier(
        'Victor Sterling',
        'Phase 1: Stabilization Endurance',
        sets,
        [],
        [],
        1,
        52,
        75
      )

      expect(dossier.soapRecord.subjective).toContain('Phase 1: Stabilization Endurance')
      expect(dossier.soapRecord.objective).toContain('You lifted 1,800 pounds')
      expect(dossier.soapRecord.assessment).toContain('within your usual range')
      expect(dossier.soapRecord.plan).toContain('Practice each movement with control')
    })
  })
})
