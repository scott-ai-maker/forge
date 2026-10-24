import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Recalculates and synchronizes client_personal_records for a given user and list of exercises.
 * Queries remaining valid non-warmup sets from workout_set_logs.
 * If no sets remain, deletes the PR row.
 * If sets remain, computes true max weight, max reps, estimated 1RM, first/latest dates, and upserts.
 */
export async function syncDatabasePersonalRecordsForExercises(
  supabase: SupabaseClient,
  userId: string,
  exerciseNames: string[]
): Promise<void> {
  if (!exerciseNames || exerciseNames.length === 0) return

  const uniqueExercises = [...new Set(exerciseNames.map(e => e.trim()))].filter(Boolean)

  for (const exName of uniqueExercises) {
    const { data: remaining, error: selectErr } = await supabase
      .from('workout_set_logs')
      .select('exercise_name, reps, weight_kg, session_date, created_at')
      .eq('user_id', userId)
      .ilike('exercise_name', exName)
      .eq('is_warmup', false)
      .gt('weight_kg', 0)
      .gt('reps', 0)

    if (selectErr) {
      console.error(`[syncDatabasePersonalRecords] Error querying sets for ${exName}:`, selectErr)
      continue
    }

    if (!remaining || remaining.length === 0) {
      const { error: delErr } = await supabase
        .from('client_personal_records')
        .delete()
        .eq('user_id', userId)
        .ilike('exercise_name', exName)

      if (delErr) {
        console.error(`[syncDatabasePersonalRecords] Error deleting PR for ${exName}:`, delErr)
      }
    } else {
      const sorted = [...remaining].sort((a, b) => {
        const wDiff = (Number(b.weight_kg) || 0) - (Number(a.weight_kg) || 0)
        if (wDiff !== 0) return wDiff
        const rDiff = (Number(b.reps) || 0) - (Number(a.reps) || 0)
        if (rDiff !== 0) return rDiff
        const dateA = a.session_date || a.created_at || ''
        const dateB = b.session_date || b.created_at || ''
        return dateB.localeCompare(dateA)
      })

      const top = sorted[0]
      const maxWeightKg = Number(top.weight_kg) || 0
      const maxWeightReps = Number(top.reps) || 0
      const maxWeightDate = top.session_date || top.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10)

      let max1rm = 0
      for (const row of remaining) {
        const w = Number(row.weight_kg) || 0
        const r = Number(row.reps) || 0
        const e1rm = Math.round(w * (1.0 + (r / 30.0)) * 100) / 100
        if (e1rm > max1rm) max1rm = e1rm
      }

      const dates = remaining
        .map(r => r.session_date || r.created_at?.slice(0, 10))
        .filter((d): d is string => Boolean(d))
        .sort()
      const firstDate = dates[0] || maxWeightDate
      const latestDate = dates[dates.length - 1] || maxWeightDate

      const { error: upsertErr } = await supabase
        .from('client_personal_records')
        .upsert(
          {
            user_id: userId,
            exercise_name: top.exercise_name,
            max_weight_kg: maxWeightKg,
            max_weight_reps: maxWeightReps,
            max_weight_date: maxWeightDate,
            estimated_1rm_kg: max1rm,
            total_sets_logged: remaining.length,
            first_logged_date: firstDate,
            latest_logged_date: latestDate,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,exercise_name' }
        )

      if (upsertErr) {
        console.error(`[syncDatabasePersonalRecords] Error upserting PR for ${exName}:`, upsertErr)
      }
    }
  }
}
