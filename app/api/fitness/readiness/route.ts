import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireActiveClient, requireRole, AuthzError } from '@/lib/authz'
import { calculateReadinessScore } from '@/lib/readiness-telemetry'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

export async function POST(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    requireActiveClient(authz.client)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  let body: Record<string, unknown>
  try {
    const parsed = await req.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400, headers: NO_STORE_HEADERS })
    }
    body = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const parseBoundedNum = (
    val: unknown,
    field: string,
    min: number,
    max: number
  ): { ok: true; value: number | null } | { ok: false; error: string } => {
    if (val === null || val === undefined || val === '') return { ok: true, value: null }
    const n = Number(val)
    if (!Number.isFinite(n) || n < min || n > max) {
      return { ok: false, error: `${field} must be between ${min} and ${max}` }
    }
    return { ok: true, value: n }
  }

  const sleepHours = parseBoundedNum(body.sleep_hours, 'sleep_hours', 0, 24)
  if (!sleepHours.ok) return NextResponse.json({ error: sleepHours.error }, { status: 400, headers: NO_STORE_HEADERS })
  const sleepQuality = parseBoundedNum(body.sleep_quality, 'sleep_quality', 1, 10)
  if (!sleepQuality.ok) return NextResponse.json({ error: sleepQuality.error }, { status: 400, headers: NO_STORE_HEADERS })
  const restingHeartRate = parseBoundedNum(body.resting_heart_rate, 'resting_heart_rate', 25, 240)
  if (!restingHeartRate.ok) return NextResponse.json({ error: restingHeartRate.error }, { status: 400, headers: NO_STORE_HEADERS })
  const baselineRhr = parseBoundedNum(body.baseline_rhr, 'baseline_rhr', 25, 240)
  if (!baselineRhr.ok) return NextResponse.json({ error: baselineRhr.error }, { status: 400, headers: NO_STORE_HEADERS })
  const sorenessLevel = parseBoundedNum(body.soreness_level, 'soreness_level', 1, 10)
  if (!sorenessLevel.ok) return NextResponse.json({ error: sorenessLevel.error }, { status: 400, headers: NO_STORE_HEADERS })
  const stressLevel = parseBoundedNum(body.stress_level, 'stress_level', 1, 10)
  if (!stressLevel.ok) return NextResponse.json({ error: stressLevel.error }, { status: 400, headers: NO_STORE_HEADERS })
  const chronicWorkload = parseBoundedNum(body.chronic_avg_weekly_workload, 'chronic_avg_weekly_workload', 0, 1_000_000)
  if (!chronicWorkload.ok) return NextResponse.json({ error: chronicWorkload.error }, { status: 400, headers: NO_STORE_HEADERS })

  let recentWorkloadUnits: number[] | null = null
  if (body.recent_workload_units != null) {
    if (!Array.isArray(body.recent_workload_units) || body.recent_workload_units.length > 60) {
      return NextResponse.json(
        { error: 'recent_workload_units must be an array of at most 60 daily workload values' },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }
    const sanitized: number[] = []
    for (const entry of body.recent_workload_units) {
      const n = Number(entry)
      if (!Number.isFinite(n) || n < 0 || n > 500_000) {
        return NextResponse.json(
          { error: 'recent_workload_units entries must be non-negative finite numbers' },
          { status: 400, headers: NO_STORE_HEADERS }
        )
      }
      sanitized.push(n)
    }
    recentWorkloadUnits = sanitized
  }

  try {
    const evaluation = calculateReadinessScore({
      sleepHours: sleepHours.value,
      sleepQuality: sleepQuality.value,
      restingHeartRate: restingHeartRate.value,
      baselineRhr: baselineRhr.value,
      sorenessLevel: sorenessLevel.value,
      stressLevel: stressLevel.value,
      recentWorkloadUnits,
      chronicAvgWeeklyWorkload: chronicWorkload.value,
    })

    return NextResponse.json(
      {
        success: true,
        evaluation: {
          ...evaluation,
          userId,
          loggedAt: new Date().toISOString(),
        },
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to evaluate readiness'
    return NextResponse.json({ error: message }, { status: 400, headers: NO_STORE_HEADERS })
  }
}

