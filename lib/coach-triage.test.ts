import { describe, expect, it } from 'vitest'
import { calculateAcwrFromWorkoutLogs, evaluateClientTriage, sortTriageQueue } from './coach-triage'

describe('coach-triage', () => {
  it('assigns RED priority to client with medical red flag or joint pain report', () => {
    const res = evaluateClientTriage({
      clientId: 'c1',
      clientName: 'Alex Mercer',
      email: 'alex@example.com',
      daysSinceLastCheckin: 3,
      hasMedicalRedFlag: true,
    })

    expect(res.priority).toBe('red')
    expect(res.priorityRank).toBe(1)
    expect(res.primaryReason).toContain('medical symptom')
  })

  it('assigns AMBER priority to client with pending video critique', () => {
    const res = evaluateClientTriage({
      clientId: 'c2',
      clientName: 'Sarah Jenkins',
      email: 'sarah@example.com',
      daysSinceLastCheckin: 2,
      hasPendingVideoCritique: true,
      readinessScore: 85,
    })

    expect(res.priority).toBe('amber')
    expect(res.priorityRank).toBe(2)
  })

  it('sorts triage queue with RED clients at the top, followed by AMBER, then GREEN', () => {
    const greenClient = evaluateClientTriage({
      clientId: 'cg',
      clientName: 'Green Client',
      email: 'g@example.com',
      daysSinceLastCheckin: 1,
      readinessScore: 90,
      completionRate14d: 95,
    })

    const redClient = evaluateClientTriage({
      clientId: 'cr',
      clientName: 'Red Client',
      email: 'r@example.com',
      daysSinceLastCheckin: 10,
    })

    const amberClient = evaluateClientTriage({
      clientId: 'ca',
      clientName: 'Amber Client',
      email: 'a@example.com',
      daysSinceLastCheckin: 2,
      hasPendingVideoCritique: true,
    })

    const sorted = sortTriageQueue([greenClient, redClient, amberClient])

    expect(sorted[0].clientId).toBe('cr')
    expect(sorted[1].clientId).toBe('ca')
    expect(sorted[2].clientId).toBe('cg')
  })

  it('triggers RED priority and suggested 1-Click Restorative Deload when ACWR spikes >= 1.50', () => {
    const res = evaluateClientTriage({
      clientId: 'c3',
      clientName: 'Marcus Vance',
      email: 'marcus@example.com',
      daysSinceLastCheckin: 1,
      acwrRatio: 1.58,
      readinessScore: 72,
    })

    expect(res.priority).toBe('red')
    expect(res.acwrZone).toBe('Danger Zone')
    expect(res.primaryReason).toContain('ACWR Danger Spike (1.58)')
    expect(res.suggestedPeriodizationAction).toBe('insert_deload')
    expect(res.suggestedActionLabel).toContain('1-Click Restorative Deload')
  })

  it('triggers suggested Setback Protocol when client reports severe fatigue or joint pain', () => {
    const res = evaluateClientTriage({
      clientId: 'c4',
      clientName: 'Elena Rostova',
      email: 'elena@example.com',
      daysSinceLastCheckin: 2,
      reportedPainInLogs: true,
    })

    expect(res.priority).toBe('red')
    expect(res.suggestedPeriodizationAction).toBe('setback_protocol')
    expect(res.suggestedActionLabel).toContain('1-Click Setback Protocol')
  })

  it('triggers suggested Fast-Track Phase transition for high responders', () => {
    const res = evaluateClientTriage({
      clientId: 'c5',
      clientName: 'David Chen',
      email: 'david@example.com',
      daysSinceLastCheckin: 1,
      completionRate14d: 100,
      readinessScore: 88,
      hasAchievedOverload: true,
    })

    expect(res.priority).toBe('green')
    expect(res.suggestedPeriodizationAction).toBe('accelerate_phase')
    expect(res.suggestedActionLabel).toContain('1-Click Fast-Track Phase')
  })

  it('correctly identifies clients needing Sunday triage or suffering high CNS fatigue', () => {
    const recentCheckinClient = evaluateClientTriage({
      clientId: 'c6',
      clientName: 'Sunday Checkin',
      email: 'sunday@example.com',
      daysSinceLastCheckin: 1,
      readinessScore: 82,
    })

    const highFatigueClient = evaluateClientTriage({
      clientId: 'c7',
      clientName: 'High Fatigue',
      email: 'fatigue@example.com',
      daysSinceLastCheckin: 4,
      readinessScore: 52,
    })

    const recoveredClient = evaluateClientTriage({
      clientId: 'c8',
      clientName: 'Recovered Athlete',
      email: 'rec@example.com',
      daysSinceLastCheckin: 5,
      readinessScore: 88,
    })

    const isSundayOrFatigue = (c: typeof recentCheckinClient) =>
      c.daysSinceLastCheckin <= 2 || (typeof c.readinessScore === 'number' && c.readinessScore > 0 && c.readinessScore < 60) || c.hasReportedPain || c.acwrZone === 'Danger Zone'

    expect(isSundayOrFatigue(recentCheckinClient)).toBe(true)
    expect(isSundayOrFatigue(highFatigueClient)).toBe(true)
    expect(isSundayOrFatigue(recoveredClient)).toBe(false)
  })

  it('calculateAcwrFromWorkoutLogs returns hasData: false, acwrRatio: null, and acwrZone: No Data when no logs exist', () => {
    const res = calculateAcwrFromWorkoutLogs([], [])
    expect(res.hasData).toBe(false)
    expect(res.acwrRatio).toBeNull()
    expect(res.acuteWorkloadUnits).toBe(0)
    expect(res.chronicWorkloadUnits).toBe(0)
    expect(res.acwrZone).toBe('No Data')
  })

  it('evaluateClientTriage with acwrRatio: null and readinessScore: null does not trigger false red priority or under-training', () => {
    const res = evaluateClientTriage({
      clientId: 'c_null',
      clientName: 'New Client No Telemetry',
      email: 'nodata@example.com',
      daysSinceLastCheckin: 3,
      readinessScore: null,
      acwrRatio: null,
    })

    expect(res.priority).toBe('green')
    expect(res.acwrZone).toBe('No Data')
    expect(res.readinessScore).toBeNull()
    expect(res.primaryReason).not.toContain('fatigue')
    expect(res.primaryReason).not.toContain('Under-training')
  })

  it('sortTriageQueue prioritizes clients with real low recovery scores over clients without telemetry data', () => {
    const fatigued = evaluateClientTriage({
      clientId: 'c_fatigued',
      clientName: 'Fatigued Client',
      email: 'fatigued@example.com',
      daysSinceLastCheckin: 3,
      readinessScore: 45, // Red priority from fatigue
    })

    const noTelemetry = evaluateClientTriage({
      clientId: 'c_no_telemetry',
      clientName: 'No Telemetry Client',
      email: 'notel@example.com',
      daysSinceLastCheckin: 3,
      readinessScore: null, // Green priority
    })

    const sorted = sortTriageQueue([noTelemetry, fatigued])
    expect(sorted[0].clientId).toBe('c_fatigued')
    expect(sorted[1].clientId).toBe('c_no_telemetry')
  })

  it('protects new athletes during Week 1 cold-start calibration from artificial 4.00 ACWR spike', () => {
    // 2 workouts logged in current week (3 and 2 days ago), 0 prior history
    const now = Date.now()
    const ONE_DAY_MS = 1000 * 60 * 60 * 24
    const setLogs = [
      { session_date: new Date(now - 3 * ONE_DAY_MS).toISOString(), reps: 15, weight_lbs: 50, rpe: 7 },
      { session_date: new Date(now - 2 * ONE_DAY_MS).toISOString(), reps: 14, weight_lbs: 50, rpe: 7 },
    ]

    const res = calculateAcwrFromWorkoutLogs([], setLogs, now)
    expect(res.hasData).toBe(true)
    expect(res.isCalibrating).toBe(true)
    expect(res.acwrRatio).toBe(1.00) // Calibrated to 1.00, not 4.00
    expect(res.acwrZone).toBe('Sweet Spot')
    expect(res.acuteWorkloadUnits).toBe(res.chronicWorkloadUnits)
  })
})


