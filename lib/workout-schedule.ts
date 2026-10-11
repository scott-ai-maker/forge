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

export function buildWorkoutSchedule(program?: ScheduledProgram | null): WorkoutCalendarEntry[] {
  if (program?.calendar?.length) {
    return program.calendar.filter(item => item.scheduledDate).map(item => ({
      date: String(item.scheduledDate),
      title: `Day ${item.day}: ${item.focus}`,
      subtitle: `${item.exerciseCount} exercise${item.exerciseCount === 1 ? '' : 's'} • ${item.durationMins} mins`,
      workoutDay: item.day,
    }))
  }
  return (program?.workouts ?? []).filter(workout => workout.scheduledDate).map(workout => ({
    date: String(workout.scheduledDate),
    title: `Day ${workout.day}: ${workout.focus}`,
    subtitle: `${workout.exercises.length} exercise${workout.exercises.length === 1 ? '' : 's'}`,
    workoutDay: workout.day,
  }))
}
