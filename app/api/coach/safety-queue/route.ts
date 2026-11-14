import { NextRequest, NextResponse } from 'next/server'
import { AuthzError, getRequestAuthz, requireRole } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { buildForgeRagCorpusChunks } from '@/src/lib/rag/hybridRagEngine'

export interface CoachSafetyQueueItem {
  eventId: string
  clientId: string
  clientName: string
  eventType: 'safety_flag' | 'escalation_sms' | 'escalation_email'
  occurredAt: string
  severity: 'emergency_911' | 'clinical_stop' | 'joint_regression' | 'priority_24h_sla' | 'email_sla'
  headline: string
  detail: string
  exerciseName: string | null
  swappedToExercise: string | null
}

export async function GET(request: NextRequest) {
  try {
    const authz = await getRequestAuthz(request)
    requireRole(authz.client.role, ['coach'])

    const admin = supabaseAdmin()

    // Strict coach-assignment authorization (HIPAA 1996 safeguard)
    const { data: assignedClients } = await admin
      .from('clients')
      .select('id, full_name, email')
      .eq('designated_coach_id', authz.user.id)
      .eq('role', 'client')

    const clientNameMap = new Map<string, string>()
    for (const c of assignedClients || []) {
      const displayName =
        (typeof c.full_name === 'string' && c.full_name.trim()) ||
        (typeof c.email === 'string' ? c.email.split('@')[0] : 'Member')
      clientNameMap.set(c.id, displayName)
    }

    const assignedIds = Array.from(clientNameMap.keys())
    const items: CoachSafetyQueueItem[] = []

    if (assignedIds.length > 0) {
      const { data: events, error } = await admin
        .from('client_telemetry_events')
        .select('event_id, user_id, event_type, client_timestamp, received_at, payload')
        .in('user_id', assignedIds)
        .in('event_type', ['safety_flag', 'escalation_sms', 'escalation_email'])
        .order('received_at', { ascending: false })
        .limit(20)

      if (!error && Array.isArray(events)) {
        for (const row of events) {
          const p = (row.payload || {}) as Record<string, unknown>
          const clientName = clientNameMap.get(row.user_id) || 'Assigned Member'
          const occurredAt =
            (typeof row.client_timestamp === 'string' && row.client_timestamp) ||
            (typeof row.received_at === 'string' && row.received_at) ||
            new Date().toISOString()

          if (row.event_type === 'safety_flag') {
            const sevRaw = String(p.severity || 'joint_regression')
            const severity: CoachSafetyQueueItem['severity'] =
              sevRaw === 'emergency_911' || sevRaw === 'clinical_stop'
                ? sevRaw
                : 'joint_regression'
            const jointArea =
              typeof p.joint_area === 'string' && p.joint_area ? p.joint_area : 'Joint Check'
            const exerciseName =
              typeof p.exercise_name === 'string' && p.exercise_name ? p.exercise_name : null
            const swappedToExercise =
              typeof p.swapped_to_exercise === 'string' && p.swapped_to_exercise
                ? p.swapped_to_exercise
                : null

            items.push({
              eventId: String(row.event_id),
              clientId: String(row.user_id),
              clientName,
              eventType: 'safety_flag',
              occurredAt,
              severity,
              headline: `${jointArea}${exerciseName ? ` · ${exerciseName}` : ''}`,
              detail:
                typeof p.action_taken === 'string' && p.action_taken
                  ? p.action_taken
                  : swappedToExercise
                    ? `Auto-regressed to ${swappedToExercise}`
                    : 'Paused movement and displayed clinical boundary guidance.',
              exerciseName,
              swappedToExercise,
            })
          } else if (row.event_type === 'escalation_sms' || row.event_type === 'escalation_email') {
            const isSms = row.event_type === 'escalation_sms'
            const activeExercise =
              typeof p.active_exercise === 'string' && p.active_exercise ? p.active_exercise : null
            items.push({
              eventId: String(row.event_id),
              clientId: String(row.user_id),
              clientName,
              eventType: isSms ? 'escalation_sms' : 'escalation_email',
              occurredAt,
              severity: isSms ? 'priority_24h_sla' : 'email_sla',
              headline: isSms
                ? 'Coach Support ($199) · Direct SMS & 24h Priority Thread'
                : `${p.tier_id === 'plus' ? 'Plus ($49)' : 'Core Lab ($19.99)'} · Direct Coach Email`,
              detail:
                typeof p.question_preview === 'string' && p.question_preview
                  ? p.question_preview
                  : 'Member requested personal review with diagnostic context attached.',
              exerciseName: activeExercise,
              swappedToExercise: null,
            })
          }
        }
      }
    }

    const totalLibraryPassages = buildForgeRagCorpusChunks().length
    let indexedVectorCount = 0
    let vectorIndexReady = false
    try {
      const { count, error: vecErr } = await admin
        .from('forge_rag_chunks')
        .select('id', { count: 'exact', head: true })
        .not('embedding', 'is', null)
      if (!vecErr) {
        vectorIndexReady = true
        indexedVectorCount = count ?? 0
      }
    } catch {
      vectorIndexReady = false
    }

    return NextResponse.json({
      ok: true,
      items,
      libraryIndex: {
        totalPassages: totalLibraryPassages,
        indexedCount: indexedVectorCount,
        vectorIndexReady,
      },
    })
  } catch (err) {
    if (err instanceof AuthzError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json(
      { error: 'Unable to load Coach Safety & Escalation queue.' },
      { status: 500 }
    )
  }
}
