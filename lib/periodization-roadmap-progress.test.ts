import { describe, expect, it } from 'vitest'
import {
  calculateActiveMicrocycleProgress,
  syncMacrocycleWithCompletedWorkouts,
  generate12WeekMacrocycle,
} from './periodization-roadmap'

describe('Fluid Microcycle Periodization Progression Engine', () => {
  describe('calculateActiveMicrocycleProgress', () => {
    it('initializes at Week 1, Session 1 when 0 workouts are completed', () => {
      const progress = calculateActiveMicrocycleProgress(0, 4, 12)
      expect(progress.currentWeek).toBe(1)
      expect(progress.sessionInWeek).toBe(1)
      expect(progress.completedInCurrentWeek).toBe(0)
      expect(progress.progressInWeekPercent).toBe(0)
      expect(progress.displayLabel).toBe('Week 1 · Session 1 of 4')
      expect(progress.isMicrocycleComplete).toBe(false)
    })

    it('correctly reads Week 1, Session 3 when 2 of 4 workouts are completed', () => {
      // The user's exact scenario: client did 2 of 4 workouts
      const progress = calculateActiveMicrocycleProgress(2, 4, 12)
      expect(progress.currentWeek).toBe(1)
      expect(progress.sessionInWeek).toBe(3)
      expect(progress.completedInCurrentWeek).toBe(2)
      expect(progress.progressInWeekPercent).toBe(50)
      expect(progress.displayLabel).toBe('Week 1 · Session 3 of 4')
      expect(progress.isMicrocycleComplete).toBe(false)
    })

    it('correctly reads Week 1, Session 4 when 3 of 4 workouts are completed', () => {
      const progress = calculateActiveMicrocycleProgress(3, 4, 12)
      expect(progress.currentWeek).toBe(1)
      expect(progress.sessionInWeek).toBe(4)
      expect(progress.completedInCurrentWeek).toBe(3)
      expect(progress.progressInWeekPercent).toBe(75)
      expect(progress.displayLabel).toBe('Week 1 · Session 4 of 4')
      expect(progress.isMicrocycleComplete).toBe(false)
    })

    it('advances immediately to Week 2, Session 1 once all 4 workouts of Week 1 are logged', () => {
      const progress = calculateActiveMicrocycleProgress(4, 4, 12)
      expect(progress.currentWeek).toBe(2)
      expect(progress.sessionInWeek).toBe(1)
      expect(progress.completedInCurrentWeek).toBe(0)
      expect(progress.progressInWeekPercent).toBe(0)
      expect(progress.displayLabel).toBe('Week 2 · Session 1 of 4')
      expect(progress.isMicrocycleComplete).toBe(true)
    })

    it('reads Week 2, Session 3 when 6 total workouts are completed (4 from W1 + 2 from W2)', () => {
      const progress = calculateActiveMicrocycleProgress(6, 4, 12)
      expect(progress.currentWeek).toBe(2)
      expect(progress.sessionInWeek).toBe(3)
      expect(progress.completedInCurrentWeek).toBe(2)
      expect(progress.progressInWeekPercent).toBe(50)
      expect(progress.displayLabel).toBe('Week 2 · Session 3 of 4')
      expect(progress.isMicrocycleComplete).toBe(false)
    })

    it('handles varying sessionsPerWeek (e.g. 3 sessions/week split)', () => {
      // 0 completed -> W1 S1
      expect(calculateActiveMicrocycleProgress(0, 3, 12).displayLabel).toBe('Week 1 · Session 1 of 3')
      // 1 completed -> W1 S2
      expect(calculateActiveMicrocycleProgress(1, 3, 12).displayLabel).toBe('Week 1 · Session 2 of 3')
      // 2 completed -> W1 S3
      expect(calculateActiveMicrocycleProgress(2, 3, 12).displayLabel).toBe('Week 1 · Session 3 of 3')
      // 3 completed -> W2 S1
      expect(calculateActiveMicrocycleProgress(3, 3, 12).displayLabel).toBe('Week 2 · Session 1 of 3')
      // 5 completed -> W2 S3
      expect(calculateActiveMicrocycleProgress(5, 3, 12).displayLabel).toBe('Week 2 · Session 3 of 3')
      // 6 completed -> W3 S1
      expect(calculateActiveMicrocycleProgress(6, 3, 12).displayLabel).toBe('Week 3 · Session 1 of 3')
    })

    it('clamps currentWeek at totalMacrocycleWeeks upon macrocycle completion', () => {
      // 12 weeks * 4 sessions = 48 workouts. Completed 52.
      const progress = calculateActiveMicrocycleProgress(52, 4, 12)
      expect(progress.currentWeek).toBe(12)
    })

    it('accepts overrideCompletedInWeek to synchronize with active week assigned workouts', () => {
      // 5 workouts total in DB (4 from W1 + 1 legacy cardio test). Week 2 has 0 workouts done.
      const progress = calculateActiveMicrocycleProgress(5, 4, 12, 0)
      expect(progress.currentWeek).toBe(2)
      expect(progress.sessionInWeek).toBe(1)
      expect(progress.completedInCurrentWeek).toBe(0)
      expect(progress.progressInWeekPercent).toBe(0)
      expect(progress.displayLabel).toBe('Week 2 · Session 1 of 4')

      // Week 2 with 1 workout done
      const progress1 = calculateActiveMicrocycleProgress(6, 4, 12, 1)
      expect(progress1.currentWeek).toBe(2)
      expect(progress1.sessionInWeek).toBe(2)
      expect(progress1.completedInCurrentWeek).toBe(1)
      expect(progress1.progressInWeekPercent).toBe(25)
      expect(progress1.displayLabel).toBe('Week 2 · Session 2 of 4')
    })
  })

  describe('syncMacrocycleWithCompletedWorkouts', () => {
    it('synchronizes a 12-week macrocycle week statuses to reflect client completion volume', () => {
      const baseMacrocycle = generate12WeekMacrocycle(1)
      // Client has completed 6 workouts on a 4-day schedule -> Week 2 active
      const synced = syncMacrocycleWithCompletedWorkouts(baseMacrocycle, 6, 4)

      expect(synced.currentWeek).toBe(2)

      const week1 = synced.weeks.find(w => w.weekNumber === 1)
      const week2 = synced.weeks.find(w => w.weekNumber === 2)
      const week3 = synced.weeks.find(w => w.weekNumber === 3)

      expect(week1?.status).toBe('completed')
      expect(week2?.status).toBe('current')
      expect(week3?.status).toBe('upcoming')
    })

    it('preserves existing custom coach notes and deload weeks when syncing', () => {
      const baseMacrocycle = generate12WeekMacrocycle(1)
      baseMacrocycle.coachNotes = 'Custom coach prescription: focus on 4/2/1 tempo'
      baseMacrocycle.weeks[1].isDeloadWeek = true

      const synced = syncMacrocycleWithCompletedWorkouts(baseMacrocycle, 10, 4)
      expect(synced.currentWeek).toBe(3)
      expect(synced.coachNotes).toBe('Custom coach prescription: focus on 4/2/1 tempo')
      expect(synced.weeks[1].isDeloadWeek).toBe(true)
      expect(synced.weeks.find(w => w.weekNumber === 1)?.status).toBe('completed')
      expect(synced.weeks.find(w => w.weekNumber === 2)?.status).toBe('completed')
      expect(synced.weeks.find(w => w.weekNumber === 3)?.status).toBe('current')
    })
  })
})
