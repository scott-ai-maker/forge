import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthzError, getRequestAuthz, requireCoachAssignedClient, requireRole } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { checkClientMedicalClearanceGate } from '@/lib/liability-shield'
import { buildForgeRagCorpusChunks } from '@/src/lib/rag/hybridRagEngine'

export interface CoachSafetyQueueItem {
  eventId: string
  clientId: string
  clientName: string
  clientStatus?: 'active' | 'inactive' | 'paused' | 'archived'
  eventType: 'safety_flag' | 'escalation_sms' | 'escalation_email'
  occurredAt: string
  severity: 'emergency_911' | 'clinical_stop' | 'joint_regression' | 'priority_24h_sla' | 'email_sla'
  headline: string
  detail: string
  exerciseName: string | null
  swappedToExercise: string | null
  acknowledgedAt?: string | null
  triageAction?: string | null
}

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

const SafetyQueuePatchSchema = z.object({
  eventId: z.string().min(1).max(128),
  clientId: z.string().min(1).max(128),
  action: z.enum(['acknowledge', 'acknowledge_and_pause_training', 'release_injury_hold']),
  notes: z.string().max(1000).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const authz = await getRequestAuthz(request)
    requireRole(authz.client.role, ['coach'])

    const includeAcknowledged =
      request.nextUrl?.searchParams?.get('includeAcknowledged') === 'true'

    const admin = supabaseAdmin()

    // Strict coach-assignment authorization (HIPAA 1996 safeguard)
    const { data: assignedClients } = await admin
      .from('clients')
      .select('id, full_name, email, status')
      .eq('designated_coach_id', authz.user.id)
      .eq('role', 'client')

    const clientNameMap = new Map<string, string>()
    const clientStatusMap = new Map<string, CoachSafetyQueueItem['clientStatus']>()
    for (const c of assignedClients || []) {
      const displayName =
        (typeof c.full_name === 'string' && c.full_name.trim()) ||
        (typeof c.email === 'string' ? c.email.split('@')[0] : 'Member')
      clientNameMap.set(c.id, displayName)
      const st = (c as { status?: string }).status
      if (st === 'active' || st === 'inactive' || st === 'paused' || st === 'archived') {
        clientStatusMap.set(c.id, st)
      } else {
        clientStatusMap.set(c.id, 'active')
      }
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
          const acknowledgedAt =
            typeof p.acknowledged_at === 'string' && p.acknowledged_at ? p.acknowledged_at : null

          if (acknowledgedAt && !includeAcknowledged) {
            continue
          }

          const clientName = clientNameMap.get(row.user_id) || 'Assigned Member'
          const clientStatus = clientStatusMap.get(row.user_id) || 'active'
          const triageAction =
            typeof p.triage_action === 'string' && p.triage_action ? p.triage_action : null
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
              clientStatus,
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
              acknowledgedAt,
              triageAction,
            })
          } else if (row.event_type === 'escalation_sms' || row.event_type === 'escalation_email') {
            const isSms = row.event_type === 'escalation_sms'
            const activeExercise =
              typeof p.active_exercise === 'string' && p.active_exercise ? p.active_exercise : null
            items.push({
              eventId: String(row.event_id),
              clientId: String(row.user_id),
              clientName,
              clientStatus,
              eventType: isSms ? 'escalation_sms' : 'escalation_email',
              occurredAt,
              severity: isSms ? 'priority_24h_sla' : 'email_sla',
              headline: isSms
                ? 'Coach Support · Direct SMS & 24h Priority Thread'
                : `${p.tier_id === 'plus' ? 'Plus' : 'Core Lab'} · Direct Coach Note`,
              detail:
                typeof p.question_preview === 'string' && p.question_preview
                  ? p.question_preview
                  : 'Member requested personal review with diagnostic context attached.',
              exerciseName: activeExercise,
              swappedToExercise: null,
              acknowledgedAt,
              triageAction,
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

    return NextResponse.json(
      {
        ok: true,
        items,
        libraryIndex: {
          totalPassages: totalLibraryPassages,
          indexedCount: indexedVectorCount,
          vectorIndexReady,
        },
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (err) {
    if (err instanceof AuthzError) {
      return NextResponse.json({ error: err.message }, { status: err.status, headers: NO_STORE_HEADERS })
    }
    return NextResponse.json(
      { error: 'Unable to load Coach Safety & Escalation queue.' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authz = await getRequestAuthz(request)
    requireRole(authz.client.role, ['coach'])

    const rawBody = await request.json().catch(() => null)
    const parsed = SafetyQueuePatchSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Valid eventId, clientId, and triage action are required.' },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }

    const { eventId, clientId, action, notes } = parsed.data
    const cleanNotes = (notes || '').replace(/<[^>]*>/g, '').trim()

    // Strict coach-assignment check (HIPAA 1996 safeguard)
    await requireCoachAssignedClient(authz.user.id, clientId)

    const admin = supabaseAdmin()

    const { data: eventRow, error: eventErr } = await admin
      .from('client_telemetry_events')
      .select('event_id, user_id, event_type, payload')
      .eq('event_id', eventId)
      .eq('user_id', clientId)
      .maybeSingle()

    if (eventErr || !eventRow) {
      return NextResponse.json(
        { error: 'Safety queue event not found for this assigned athlete.' },
        { status: 404, headers: NO_STORE_HEADERS }
      )
    }

    const existingPayload =
      eventRow.payload && typeof eventRow.payload === 'object' && !Array.isArray(eventRow.payload)
        ? (eventRow.payload as Record<string, unknown>)
        : {}

    const isCriticalSafetyFlag =
      eventRow.event_type === 'safety_flag' &&
      (existingPayload.severity === 'emergency_911' || existingPayload.severity === 'clinical_stop')

    if (isCriticalSafetyFlag && action === 'acknowledge' && cleanNotes.length < 10) {
      return NextResponse.json(
        {
          error:
            'Critical clinical-stop safety flags require either pausing the workout plan ("acknowledge_and_pause_training") or documenting at least 10 characters of clinical clearance rationale.',
        },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }

    const nowIso = new Date().toISOString()

    if (action === 'release_injury_hold') {
      const medicalGate = await checkClientMedicalClearanceGate(admin, clientId)
      if (medicalGate.blocked) {
        return NextResponse.json(
          {
            error:
              medicalGate.reason ||
              'Cannot release injury hold while an uncleared PAR-Q+ Phase 0 Medical Clearance Hold is active.',
          },
          { status: 409, headers: NO_STORE_HEADERS }
        )
      }
    }

    const updatedPayload: Record<string, unknown> = {
      ...existingPayload,
      acknowledged_at: nowIso,
      acknowledged_by: authz.user.id,
      triage_action: action,
      ...(cleanNotes ? { triage_notes: cleanNotes } : {}),
    }

    const { error: updateEventErr } = await admin
      .from('client_telemetry_events')
      .update({ payload: updatedPayload })
      .eq('event_id', eventId)
      .eq('user_id', clientId)

    if (updateEventErr) {
      return NextResponse.json(
        { error: 'Failed to persist safety queue acknowledgment.' },
        { status: 500, headers: NO_STORE_HEADERS }
      )
    }

    let updatedClientStatus: CoachSafetyQueueItem['clientStatus'] | undefined = undefined

    if (action === 'acknowledge_and_pause_training') {
      const { data: currentClient } = await admin
        .from('clients')
        .select('status')
        .eq('id', clientId)
        .maybeSingle()

      const previousStatus = (currentClient as { status?: string } | null)?.status || 'active'

      const { error: pauseErr } = await admin
        .from('clients')
        .update({
          status: 'paused',
          status_reason: 'injury_medical_leave',
          status_updated_at: nowIso,
          status_updated_by: authz.user.id,
        })
        .eq('id', clientId)

      if (pauseErr) {
        return NextResponse.json(
          { error: 'Failed to place athlete training program on Injury / Medical Hold.' },
          { status: 500, headers: NO_STORE_HEADERS }
        )
      }

      updatedClientStatus = 'paused'

      try {
        await admin.from('client_lifecycle_audit_logs').insert({
          client_id: clientId,
          actor_id: authz.user.id,
          actor_name: authz.client.full_name || 'Coach Gordon',
          actor_role: 'coach',
          action: 'pause',
          previous_status: previousStatus,
          new_status: 'paused',
          reason_code: 'injury_medical_leave',
          reason_notes:
            cleanNotes ||
            `Safety queue red-flag triage (${eventId}): active workout logging paused pending coach/medical review.`,
          effective_date: nowIso,
          metadata: { source: 'safety_queue_triage', eventId },
        })
      } catch {
        // Non-fatal if audit table mock omitted in isolated test
      }

      try {
        await admin.from('coach_client_messages').insert({
          client_id: clientId,
          coach_id: authz.user.id,
          sender_id: authz.user.id,
          message_body: `[INJURY / SAFETY HOLD ACTIVE]\nI reviewed your safety flag and placed your active resistance program on temporary hold so we protect your joints while evaluating next steps.${
            cleanNotes ? `\n\nCoach Note: ${cleanNotes}` : ''
          }`,
        })
      } catch {
        // Non-fatal
      }
    } else if (action === 'release_injury_hold') {
      const { error: resumeErr } = await admin
        .from('clients')
        .update({
          status: 'active',
          status_reason: 'medical_clearance_received',
          status_updated_at: nowIso,
          status_updated_by: authz.user.id,
        })
        .eq('id', clientId)

      if (resumeErr) {
        return NextResponse.json(
          { error: 'Failed to reactivate athlete training status.' },
          { status: 500, headers: NO_STORE_HEADERS }
        )
      }

      updatedClientStatus = 'active'

      try {
        await admin.from('client_lifecycle_audit_logs').insert({
          client_id: clientId,
          actor_id: authz.user.id,
          actor_name: authz.client.full_name || 'Coach Gordon',
          actor_role: 'coach',
          action: 'activation',
          previous_status: 'paused',
          new_status: 'active',
          reason_code: 'medical_clearance_received',
          reason_notes: cleanNotes || `Safety queue hold released (${eventId}).`,
          effective_date: nowIso,
          metadata: { source: 'safety_queue_triage', eventId },
        })
      } catch {
        // Non-fatal
      }
    }

    return NextResponse.json(
      {
        ok: true,
        eventId,
        clientId,
        action,
        acknowledgedAt: nowIso,
        clientStatus: updatedClientStatus,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (err) {
    if (err instanceof AuthzError) {
      return NextResponse.json({ error: err.message }, { status: err.status, headers: NO_STORE_HEADERS })
    }
    return NextResponse.json(
      { error: 'Unable to update Coach Safety & Escalation queue item.' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}
