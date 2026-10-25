import { supabaseAdmin } from '@/lib/supabase'
import { generateSundayDossier } from '@/lib/sunday-dossier-engine'
import { buildProofOfWorkDossier, encodeProofOfWorkToken } from '@/lib/proof-of-work-dossier-engine'
import { notifyUser } from '@/lib/notifications'

export interface SundayDossierDispatchResult {
  weekEndingDate: string
  clientsConsidered: number
  dispatchedCount: number
  skippedCount: number
  errors: { clientId: string; error: string }[]
}

/**
 * Sunday 7:00 PM Performance Dossier Dispatcher
 *
 * Runs automatically every Sunday evening to:
 * 1. Calculate acute 7-day tonnage, sets, ACWR workload ratio, and recovery index.
 * 2. Generate a certified Clinical Proof of Work Dossier with cryptographic signature.
 * 3. Encode a zero-friction URL-safe token.
 * 4. Dispatch multichannel notifications (push and transactional email) with 1-tap review.
 */
export async function dispatchSundayPerformanceDossiers(
  referenceDate = new Date()
): Promise<SundayDossierDispatchResult> {
  const admin = supabaseAdmin()
  const weekEndingIso = referenceDate.toISOString().slice(0, 10)

  // 7-day acute window, 28-day chronic window
  const sevenDaysAgo = new Date(referenceDate.getTime() - 7 * 86_400_000)
  const twentyEightDaysAgo = new Date(referenceDate.getTime() - 28 * 86_400_000)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10)
  const twentyEightDaysAgoStr = twentyEightDaysAgo.toISOString().slice(0, 10)

  const { data: clients, error: clientsError } = await admin
    .from('clients')
    .select('id, full_name, email, role')
    .eq('role', 'client')

  if (clientsError) {
    throw new Error(`Failed to load clients: ${clientsError.message}`)
  }

  let dispatchedCount = 0
  let skippedCount = 0
  const errors: { clientId: string; error: string }[] = []

  for (const client of clients ?? []) {
    try {
      const dedupeKey = `sunday-dossier:${weekEndingIso}:${client.id}`

      // Skip if already notified this week
      const { data: existingLog } = await admin
        .from('notification_log')
        .select('id')
        .eq('dedupe_key', dedupeKey)
        .maybeSingle()

      if (existingLog) {
        skippedCount++
        continue
      }

      // Gather client's performance and biometric telemetry
      const [
        { data: setLogs },
        { data: cardioLogs },
        { data: recentPrs },
        { data: latestPlan },
        { data: profile },
        { data: wearableMetric },
      ] = await Promise.all([
        admin
          .from('workout_set_logs')
          .select('session_date, weight_lbs, reps, is_warmup, rpe, exercise_name, notes')
          .eq('user_id', client.id)
          .gte('session_date', twentyEightDaysAgoStr)
          .order('session_date', { ascending: false }),
        admin
          .from('cardio_logs')
          .select('session_date, activity_type, duration_mins, avg_heart_rate')
          .eq('user_id', client.id)
          .gte('session_date', sevenDaysAgoStr)
          .order('session_date', { ascending: false }),
        admin
          .from('personal_records')
          .select('exercise_name, weight_lbs, reps, achieved_at')
          .eq('user_id', client.id)
          .gte('achieved_at', sevenDaysAgo.toISOString())
          .order('achieved_at', { ascending: false }),
        admin
          .from('workout_plans')
          .select('nasm_opt_phase, phase_name, goal')
          .eq('user_id', client.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        admin
          .from('fitness_profiles')
          .select('fitness_goal')
          .eq('user_id', client.id)
          .maybeSingle(),
        admin
          .from('athlete_wearable_metrics')
          .select('resting_heart_rate, hrv_rmssd_ms')
          .eq('client_id', client.id)
          .order('sample_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      const athleteName = client.full_name?.trim() || client.email?.split('@')[0] || 'Athlete'
      const firstName = athleteName.split(' ')[0]
      const currentPlanPhase = latestPlan?.phase_name
        ? `Phase ${latestPlan.nasm_opt_phase}: ${latestPlan.phase_name}`
        : (profile?.fitness_goal || 'Phase 1: Stabilization Endurance')

      const restingHr = wearableMetric?.resting_heart_rate ?? 54
      const hrvBaseline = wearableMetric?.hrv_rmssd_ms ?? 68

      // Acute vs Chronic Tonnage calculation
      const acuteSetLogs = (setLogs ?? []).filter(s => (s.session_date ?? '') >= sevenDaysAgoStr)
      const chronicTonnageSum = (setLogs ?? []).reduce(
        (acc, s) => acc + (s.is_warmup ? 0 : (s.weight_lbs ?? 0) * (s.reps ?? 0)),
        0
      )
      const chronicWorkloadTonnage = Math.round(chronicTonnageSum / 4)

      const dossierMetrics = generateSundayDossier(
        athleteName,
        currentPlanPhase,
        acuteSetLogs,
        cardioLogs ?? [],
        recentPrs ?? [],
        4,
        restingHr,
        hrvBaseline,
        chronicWorkloadTonnage
      )

      const powDossier = buildProofOfWorkDossier({
        athleteName,
        athleteEmail: client.email,
        optPhase: latestPlan?.nasm_opt_phase ?? 1,
        phaseName: latestPlan?.phase_name ?? 'Stabilization Endurance',
        setLogs: acuteSetLogs,
        cardioLogs: cardioLogs ?? [],
        personalRecords: recentPrs ?? [],
      })

      const shareToken = encodeProofOfWorkToken(powDossier)

      let title: string
      let body: string

      if (dossierMetrics.totalTonnageLbs > 0) {
        title = 'Weekly Performance Dossier Ready'
        body = `${firstName}, you moved ${dossierMetrics.totalTonnageLbs.toLocaleString()} lbs across ${dossierMetrics.totalWorkingSets} sets this week (${dossierMetrics.adherencePct}% adherence). Tap to review your verified proof of work.`
      } else {
        title = 'Weekly Training & Recovery Briefing'
        body = `${firstName}, your weekly sports science briefing is ready. Check your upcoming OPT™ phase and recovery benchmarks for next week.`
      }

      const notifyResult = await notifyUser({
        userId: client.id,
        type: 'sunday_dossier_ready',
        title,
        body,
        url: `/dashboard/dossier`,
        data: {
          shareToken,
          totalTonnage: String(dossierMetrics.totalTonnageLbs),
          workingSets: String(dossierMetrics.totalWorkingSets),
          adherencePct: String(dossierMetrics.adherencePct),
        },
        dedupeKey,
      })

      if (notifyResult.channels.length > 0) {
        dispatchedCount++
      } else {
        skippedCount++
      }
    } catch (clientErr) {
      const errorMsg = clientErr instanceof Error ? clientErr.message : 'Unknown dispatch error'
      errors.push({ clientId: client.id, error: errorMsg })
    }
  }

  return {
    weekEndingDate: weekEndingIso,
    clientsConsidered: (clients ?? []).length,
    dispatchedCount,
    skippedCount,
    errors,
  }
}
