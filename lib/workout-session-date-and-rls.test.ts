import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  resolveEffectiveWorkoutSessionDate,
  filterSetLogsForMicrocycleWeek,
  resolveWorkoutDayCompletion,
} from '@/lib/fitness'

describe('resolveEffectiveWorkoutSessionDate (repeating microcycle date guard)', () => {
  it('replaces stale past Week 1 scheduledDate values with today so Week 2+ workouts record cleanly', () => {
    expect(resolveEffectiveWorkoutSessionDate('2026-10-12', '2026-11-02')).toBe('2026-11-02')
    expect(resolveEffectiveWorkoutSessionDate('2026-10-15', '2026-11-10')).toBe('2026-11-10')
    expect(resolveEffectiveWorkoutSessionDate('2026-10-18', '2026-11-13')).toBe('2026-11-13')
  })

  it('returns today when scheduledDate is null, undefined, blank, or malformed', () => {
    expect(resolveEffectiveWorkoutSessionDate(null, '2026-11-13')).toBe('2026-11-13')
    expect(resolveEffectiveWorkoutSessionDate(undefined, '2026-11-13')).toBe('2026-11-13')
    expect(resolveEffectiveWorkoutSessionDate('   ', '2026-11-13')).toBe('2026-11-13')
    expect(resolveEffectiveWorkoutSessionDate('10/12/2026', '2026-11-13')).toBe('2026-11-13')
  })

  it('preserves scheduledDate when it matches today or is a future scheduled date', () => {
    expect(resolveEffectiveWorkoutSessionDate('2026-11-13', '2026-11-13')).toBe('2026-11-13')
    expect(resolveEffectiveWorkoutSessionDate('2026-11-16', '2026-11-13')).toBe('2026-11-16')
  })

  it('keeps Week 4 set logs and workout completions distinct from Week 3 logs', () => {
    const planWorkouts = [
      { day: 1, focus: 'Posterior Chain Stabilization', scheduledDate: '2026-10-12' },
      { day: 2, focus: 'Multiplanar Balance', scheduledDate: '2026-10-15' },
      { day: 3, focus: 'Gluteal Dominance', scheduledDate: '2026-10-18' },
    ]
    const priorLogs = Array.from({ length: 9 }, (_, idx) => {
      const week = Math.floor(idx / 3) + 1
      const day = (idx % 3) + 1
      return {
        id: `log-w${week}-d${day}`,
        completed: true,
        workout_plan_id: 'plan-1',
        session_date: `2026-10-${String(10 + idx * 2).padStart(2, '0')}`,
        session_title: `Day ${day}: ${planWorkouts[day - 1].focus}`,
        notes: `[workout-day:${day}] [workout-week:${week}] Completed from current workout plan.`,
      }
    })

    // Before completing Day 1 in Week 4, Day 1 must evaluate as unfinished
    const beforeWeek4 = resolveWorkoutDayCompletion({
      day: 1,
      planWorkouts,
      workoutLogs: priorLogs,
      currentWeek: 4,
      sessionsPerWeek: 3,
      planId: 'plan-1',
    })
    expect(beforeWeek4.isCompleted).toBe(false)

    // Completing Day 1 on 2026-11-02 using resolveEffectiveWorkoutSessionDate records Week 4 cleanly
    const week4SessionDate = resolveEffectiveWorkoutSessionDate(
      planWorkouts[0].scheduledDate,
      '2026-11-02'
    )
    expect(week4SessionDate).toBe('2026-11-02')

    const week4Sets = filterSetLogsForMicrocycleWeek({
      setLogs: [
        {
          id: 's-w3',
          session_date: '2026-10-22',
          exercise_name: 'Goblet Squat',
          reps: 12,
          notes: '[workout-day:1] [workout-week:3]',
        },
        {
          id: 's-w4',
          session_date: week4SessionDate,
          exercise_name: 'Goblet Squat',
          reps: 12,
          notes: '[workout-day:1] [workout-week:4]',
        },
      ],
      workoutLogs: priorLogs,
      currentWeek: 4,
      sessionsPerWeek: 3,
      workoutDay: 1,
    })
    expect(week4Sets.map(s => s.id)).toEqual(['s-w4'])
  })
})

describe('Client portal RLS recursion immunity (42P17 safeguard)', () => {
  const repoRoot = process.cwd()

  it('uses authenticated user-scoped supabaseAdmin() for client_packages across client portal server pages', () => {
    const pages = [
      'app/(dashboard)/dashboard/page.tsx',
      'app/(dashboard)/dashboard/book/page.tsx',
      'app/(dashboard)/dashboard/settings/page.tsx',
      'app/(dashboard)/dashboard/fitness/page.tsx',
      'app/(dashboard)/dashboard/dossier/page.tsx',
    ]

    for (const relPath of pages) {
      const source = fs.readFileSync(path.join(repoRoot, relPath), 'utf8')
      expect(source).toContain('supabase.auth.getUser()')
      expect(source).toContain('supabaseAdmin')
      expect(source).not.toMatch(/\bsupabase\s*\.\s*from\(\s*['"]client_packages['"]\s*\)/)
      expect(source).not.toMatch(/\bsupabase\s*\.\s*from\(\s*['"]clients['"]\s*\)/)
    }
  })
})
