import type { WorkoutCalendarEntry } from '@/components/fitness/WorkoutCalendarView'

interface ScheduledProgram {
  calendar?: Array<{
    scheduledDate?: string | null
    day: number
    focus: string
    exerciseCount: number
    durationMins: number
  }>
  workouts?: Array<{
    scheduledDate?: string | null
    day: number
    focus: string
    exercises: unknown[]
  }>
}

export interface ScheduledSessionItem {
  id?: string
  scheduled_at: string
  duration_mins?: number | null
  notes?: string | null
  status?: string | null
}

export function buildWorkoutSchedule(
  program?: ScheduledProgram | null,
  sessions?: ScheduledSessionItem[] | null
): WorkoutCalendarEntry[] {
  let entries: WorkoutCalendarEntry[] = []

  if (program?.calendar?.length) {
    entries = program.calendar.filter(item => item.scheduledDate).map(item => ({
      date: String(item.scheduledDate),
      title: `Day ${item.day}: ${item.focus}`,
      subtitle: `${item.exerciseCount} exercise${item.exerciseCount === 1 ? '' : 's'} • ${item.durationMins} mins`,
      workoutDay: item.day,
    }))
  } else {
    entries = (program?.workouts ?? []).filter(workout => workout.scheduledDate).map(workout => ({
      date: String(workout.scheduledDate),
      title: `Day ${workout.day}: ${workout.focus}`,
      subtitle: `${workout.exercises.length} exercise${workout.exercises.length === 1 ? '' : 's'}`,
      workoutDay: workout.day,
    }))
  }

  if (sessions && sessions.length > 0) {
    const sessionEntries: WorkoutCalendarEntry[] = sessions
      .filter(s => s.status === 'scheduled')
      .map(s => {
        const d = new Date(s.scheduled_at)
        const dateStr = s.scheduled_at.split('T')[0]
        const timeStr = d.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'America/New_York',
        })
        return {
          date: dateStr,
          title: 'Diagnostic Live Studio Session',
          subtitle: `Coach Gordon · ${timeStr} ET (${s.duration_mins || 60}m)`,
        }
      })
    entries = [...entries, ...sessionEntries]
  }

  return entries.sort((a, b) => a.date.localeCompare(b.date))
}
