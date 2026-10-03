import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { calculateReadinessScore } from '@/lib/readiness-telemetry'

export async function POST(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  try {
    const body = await req.json()
    const toNumOrNull = (val: unknown) => {
      if (val === null || val === undefined || val === '') return null
      const n = Number(val)
      return Number.isFinite(n) ? n : null
    }

    const evaluation = calculateReadinessScore({
      sleepHours: toNumOrNull(body.sleep_hours),
      sleepQuality: toNumOrNull(body.sleep_quality),
      restingHeartRate: toNumOrNull(body.resting_heart_rate),
      baselineRhr: toNumOrNull(body.baseline_rhr),
      sorenessLevel: toNumOrNull(body.soreness_level),
      stressLevel: toNumOrNull(body.stress_level),
      recentWorkloadUnits: Array.isArray(body.recent_workload_units) ? body.recent_workload_units : null,
      chronicAvgWeeklyWorkload: toNumOrNull(body.chronic_avg_weekly_workload),
    })

    return NextResponse.json({
      success: true,
      evaluation: {
        ...evaluation,
        userId,
        loggedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to evaluate readiness'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

