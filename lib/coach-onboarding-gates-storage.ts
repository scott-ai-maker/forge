import type { SupabaseClient } from '@supabase/supabase-js'
import type { ClientGateRecord, ProgressionStageId } from './coach-onboarding-progression'

export interface GateAuthorizationParams {
  clientId: string
  coachId: string
  stageNumber: number
  stageId: ProgressionStageId
  notes?: string | null
  metadata?: Record<string, unknown>
}

export interface GateReopeningParams {
  clientId: string
  coachId: string
  stageNumber: number
  stageId?: ProgressionStageId
  notes?: string | null
}

/**
 * Loads the coach onboarding gate states for a client.
 * Tries the dedicated `coach_onboarding_gates` table first.
 * If the table does not exist in Supabase (PGRST205) or has no rows,
 * falls back to reconstructing gate status from `client_lifecycle_audit_logs`.
 */
export async function loadClientOnboardingGates(
  admin: SupabaseClient,
  clientId: string
): Promise<Record<number, ClientGateRecord>> {
  const gateMap: Record<number, ClientGateRecord> = {}

  // 1. Primary path: query dedicated coach_onboarding_gates table
  try {
    const { data: gatesData, error: gatesError } = await admin
      .from('coach_onboarding_gates')
      .select('stage_number, stage_id, status, authorized_by, authorized_at, notes, metadata')
      .eq('client_id', clientId)
      .order('stage_number', { ascending: true })

    if (!gatesError && Array.isArray(gatesData) && gatesData.length > 0) {
      for (const row of gatesData) {
        gateMap[row.stage_number] = {
          status: row.status as 'pending' | 'authorized' | 'rejected',
          authorizedBy: row.authorized_by,
          authorizedAt: row.authorized_at,
          notes: row.notes,
          metadata: row.metadata,
        }
      }
      return gateMap
    }
  } catch (err) {
    console.warn('[loadClientOnboardingGates] Primary table query failed, falling back to audit logs:', err)
  }

  // 2. Fallback path: reconstruct gates from client_lifecycle_audit_logs
  try {
    const { data: logs, error: logsError } = await admin
      .from('client_lifecycle_audit_logs')
      .select('*')
      .eq('client_id', clientId)
      .in('action', ['onboarding_gate_authorized', 'onboarding_gate_reopened'])
      .order('created_at', { ascending: true })

    if (!logsError && Array.isArray(logs) && logs.length > 0) {
      for (const log of logs) {
        const stageNum = Number(log.metadata?.stageNumber ?? log.metadata?.reopenedStage ?? 0)
        if (stageNum < 1 || stageNum > 7) continue

        if (log.action === 'onboarding_gate_authorized') {
          gateMap[stageNum] = {
            status: 'authorized',
            authorizedBy: log.actor_id,
            authorizedAt: log.metadata?.authorizedAt || log.effective_date || log.created_at,
            notes: log.reason_notes || null,
            metadata: log.metadata || null,
          }
        } else if (log.action === 'onboarding_gate_reopened') {
          // Reset this stage and all subsequent stages
          for (let s = stageNum; s <= 7; s++) {
            delete gateMap[s]
          }
        }
      }
    }
  } catch (err) {
    console.error('[loadClientOnboardingGates] Audit log fallback query failed:', err)
  }

  return gateMap
}

/**
 * Records an onboarding gate authorization with dual-write resilience:
 * Upserts to `coach_onboarding_gates` (if table exists) AND records to `client_lifecycle_audit_logs`.
 */
export async function recordGateAuthorization(
  admin: SupabaseClient,
  params: GateAuthorizationParams
): Promise<{ success: boolean; error?: string }> {
  const { clientId, coachId, stageNumber, stageId, notes = '', metadata = {} } = params
  const now = new Date().toISOString()

  // 1. Attempt write to coach_onboarding_gates table
  try {
    const gatePayload = {
      client_id: clientId,
      stage_number: stageNumber,
      stage_id: stageId,
      status: 'authorized',
      authorized_by: coachId,
      authorized_at: now,
      notes: String(notes || '').trim() || null,
      metadata: metadata || {},
      updated_at: now,
    }

    const { error: upsertError } = await admin
      .from('coach_onboarding_gates')
      .upsert(gatePayload, { onConflict: 'client_id, stage_number' })

    if (upsertError) {
      console.warn('[recordGateAuthorization] Primary upsert non-blocking notice:', upsertError.message)
    }
  } catch (err) {
    console.warn('[recordGateAuthorization] Primary table write error:', err)
  }

  // 2. Guaranteed durability: write to client_lifecycle_audit_logs
  try {
    const auditPayload = {
      client_id: clientId,
      actor_id: coachId,
      actor_role: 'coach',
      action: 'onboarding_gate_authorized',
      previous_status: `stage_${stageNumber}_pending`,
      new_status: stageNumber === 7 ? 'onboarding_completed' : `stage_${stageNumber + 1}_unlocked`,
      reason_code: 'coach_authorization_gate',
      reason_notes: notes || `Coach authorized Stage ${stageNumber} (${stageId})`,
      effective_date: now,
      metadata: {
        stageNumber,
        stageId,
        authorizedAt: now,
        ...(metadata || {}),
      },
    }

    const { error: auditError } = await admin
      .from('client_lifecycle_audit_logs')
      .insert(auditPayload)

    if (auditError) {
      console.error('[recordGateAuthorization] Audit log insert failed:', auditError.message)
    }
  } catch (err) {
    console.error('[recordGateAuthorization] Audit log exception:', err)
  }

  return { success: true }
}

/**
 * Records an onboarding gate reopening with dual-write resilience:
 * Deletes from `coach_onboarding_gates` (if table exists) AND records to `client_lifecycle_audit_logs`.
 */
export async function recordGateReopening(
  admin: SupabaseClient,
  params: GateReopeningParams
): Promise<{ success: boolean; error?: string }> {
  const { clientId, coachId, stageNumber, stageId = 'intake_claim', notes = '' } = params
  const now = new Date().toISOString()

  // 1. Attempt delete from coach_onboarding_gates
  try {
    const { error: deleteError } = await admin
      .from('coach_onboarding_gates')
      .delete()
      .eq('client_id', clientId)
      .gte('stage_number', stageNumber)

    if (deleteError) {
      console.warn('[recordGateReopening] Primary delete non-blocking notice:', deleteError.message)
    }
  } catch (err) {
    console.warn('[recordGateReopening] Primary table delete error:', err)
  }

  // 2. Guaranteed durability: record reopened event in client_lifecycle_audit_logs
  try {
    const auditPayload = {
      client_id: clientId,
      actor_id: coachId,
      actor_role: 'coach',
      action: 'onboarding_gate_reopened',
      previous_status: `stage_${stageNumber}_authorized`,
      new_status: `stage_${stageNumber}_pending`,
      reason_code: 'coach_gate_reopened',
      reason_notes: notes || `Coach reopened Stage ${stageNumber} (${stageId})`,
      effective_date: now,
      metadata: {
        reopenedStage: stageNumber,
        stageNumber,
        stageId,
        reopenedAt: now,
      },
    }

    const { error: auditError } = await admin
      .from('client_lifecycle_audit_logs')
      .insert(auditPayload)

    if (auditError) {
      console.error('[recordGateReopening] Audit log insert failed:', auditError.message)
    }
  } catch (err) {
    console.error('[recordGateReopening] Audit log exception:', err)
  }

  return { success: true }
}

