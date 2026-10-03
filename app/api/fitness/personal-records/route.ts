import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'

export interface PersonalRecord {
  exerciseName: string
  maxWeightKg: number
  maxWeightReps: number
  maxWeightDate: string
  maxReps: number | null
  maxRepsWeight: number | null
  maxRepsDate: string | null
  totalSets: number
  firstLoggedDate: string
  latestDate: string
}

export async function GET(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const admin = supabaseAdmin()

  // Fetch all non-warmup weighted sets, last 365 days
  const since = new Date()
  since.setFullYear(since.getFullYear() - 1)
  const sinceDate = since.toISOString().slice(0, 10)

  const { data: setLogs, error } = await admin
    .from('workout_set_logs')
    .select('exercise_name, reps, weight_kg, session_date')
    .eq('user_id', userId)
    .eq('is_warmup', false)
    .gte('session_date', sinceDate)
    .not('weight_kg', 'is', null)
    .order('session_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to load set logs' }, { status: 500 })
  }

  // Aggregate PRs per exercise
  const exerciseMap = new Map<
    string,
    {
      maxWeightKg: number
      maxWeightReps: number
      maxWeightDate: string
      maxReps: number | null
      maxRepsWeight: number | null
      maxRepsDate: string | null
      totalSets: number
      firstLoggedDate: string
      latestDate: string
    }
  >()

  for (const row of setLogs ?? []) {
    if (!row.exercise_name || row.weight_kg == null) continue

    const key = row.exercise_name.trim().toLowerCase()
    const existing = exerciseMap.get(key)
    const weightKg = Number(row.weight_kg)
    const reps = Number(row.reps)
    const date = String(row.session_date)

    if (!existing) {
      exerciseMap.set(key, {
        maxWeightKg: weightKg,
        maxWeightReps: reps,
        maxWeightDate: date,
        maxReps: reps,
        maxRepsWeight: weightKg,
        maxRepsDate: date,
        totalSets: 1,
        firstLoggedDate: date,
        latestDate: date,
      })
      continue
    }

    existing.totalSets += 1

    if (date > existing.latestDate) existing.latestDate = date
    if (date < existing.firstLoggedDate) existing.firstLoggedDate = date

    // Heaviest single set (1RM proxy = weight × reps, for tie-break prefer higher weight)
    if (
      weightKg > existing.maxWeightKg ||
      (weightKg === existing.maxWeightKg && reps > existing.maxWeightReps)
    ) {
      existing.maxWeightKg = weightKg
      existing.maxWeightReps = reps
      existing.maxWeightDate = date
    }

    // Most reps (at any weight, non-warmup)
    if (existing.maxReps === null || reps > existing.maxReps) {
      existing.maxReps = reps
      existing.maxRepsWeight = weightKg
      existing.maxRepsDate = date
    }
  }

  const records: PersonalRecord[] = Array.from(exerciseMap.entries())
    .map(([key, val]) => ({
      exerciseName: key
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      ...val,
    }))
    .sort((a, b) => b.maxWeightKg - a.maxWeightKg)

  return NextResponse.json({ records })
}
