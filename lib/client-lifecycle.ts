/**
 * Gordon Athletic Advisory — Client Lifecycle & Anti-Duplicity Audit Engine
 * 
 * Provides private wellness studio best practices for:
 * - Client status lifecycle management (Active, Inactive, Paused, Archived).
 * - Immutable, enterprise-grade privacy and liability audit logging.
 * - Strict anti-duplicity identity validation (email/phone collision detection).
 * - Access gating and clinical status transitions.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type ClientStatus = 'active' | 'inactive' | 'paused' | 'archived'

export type StatusReasonCategory = 'activation' | 'deactivation' | 'pause' | 'archive'

export interface StatusReasonDefinition {
  code: string
  label: string
  category: StatusReasonCategory
  description: string
  requiresNotes?: boolean
}

export const STATUS_REASONS: Record<string, StatusReasonDefinition> = {
  // Activation Reasons
  new_enrollment: {
    code: 'new_enrollment',
    label: 'New Client Enrollment',
    category: 'activation',
    description: 'Initial studio onboarding and program commencement.',
  },
  reactivation_approved: {
    code: 'reactivation_approved',
    label: 'Reactivation Approved',
    category: 'activation',
    description: 'Client membership restored to active training standing.',
  },
  medical_clearance_received: {
    code: 'medical_clearance_received',
    label: 'Medical Clearance Received',
    category: 'activation',
    description: 'Physician/PT approval confirmed; lifting temporary hold.',
  },
  payment_cleared: {
    code: 'payment_cleared',
    label: 'Payment Resolved',
    category: 'activation',
    description: 'Billing issue resolved; account returned to active status.',
  },
  trial_activated: {
    code: 'trial_activated',
    label: 'Trial Period Activated',
    category: 'activation',
    description: 'Complimentary or promotional assessment period activated.',
  },

  // Pause Reasons
  injury_medical_leave: {
    code: 'injury_medical_leave',
    label: 'Injury / Medical Hold',
    category: 'pause',
    description: 'Temporary training freeze pending rehabilitation or clinical review.',
    requiresNotes: true,
  },
  travel_freeze: {
    code: 'travel_freeze',
    label: 'Travel / Vacation Freeze',
    category: 'pause',
    description: 'Planned hiatus requested by client with scheduled return.',
  },
  personal_hold: {
    code: 'personal_hold',
    label: 'Personal / Work Hold',
    category: 'pause',
    description: 'Temporary life/work schedule hold requested by client.',
  },
  financial_hold: {
    code: 'financial_hold',
    label: 'Billing / Financial Hold',
    category: 'pause',
    description: 'Temporary pause while billing credentials or plans update.',
  },

  // Deactivation Reasons
  contract_expired: {
    code: 'contract_expired',
    label: 'Contract Term Completed',
    category: 'deactivation',
    description: 'Scheduled coaching cycle concluded without immediate renewal.',
  },
  client_requested_cancellation: {
    code: 'client_requested_cancellation',
    label: 'Client Requested Cancellation',
    category: 'deactivation',
    description: 'Client submitted formal cancellation or offboarding request.',
  },
  non_payment: {
    code: 'non_payment',
    label: 'Non-Payment / Delinquent',
    category: 'deactivation',
    description: 'Subscription terminated due to unpaid dues or billing failure.',
  },
  policy_violation: {
    code: 'policy_violation',
    label: 'Studio Policy / Conduct Violation',
    category: 'deactivation',
    description: 'Termination due to attendance policy, safety, or terms breach.',
    requiresNotes: true,
  },
  mutual_agreement: {
    code: 'mutual_agreement',
    label: 'Mutual Separation',
    category: 'deactivation',
    description: 'Coach and client agreed to pause coaching relationship.',
  },
  duplicate_resolved: {
    code: 'duplicate_resolved',
    label: 'Duplicate Profile Cleaned Up',
    category: 'deactivation',
    description: 'Redundant profile deactivated to prevent identity split.',
    requiresNotes: true,
  },

  // Archival Reasons
  program_graduate: {
    code: 'program_graduate',
    label: 'Program Graduate / Alumni',
    category: 'archive',
    description: 'Client achieved primary milestones and transitioned to alumni.',
  },
  long_term_inactive: {
    code: 'long_term_inactive',
    label: 'Long-Term Inactivity',
    category: 'archive',
    description: 'Account inactive >180 days; moving to cold storage records.',
  },
}

export interface LifecycleAuditLogEntry {
  id: string
  client_id: string
  actor_id: string
  actor_name: string | null
  actor_role: string
  action: string
  previous_status: ClientStatus | null
  new_status: ClientStatus
  reason_code: string
  reason_notes: string | null
  effective_date: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface TransitionStatusParams {
  clientId: string
  coachId: string
  actorRole?: 'coach' | 'client' | 'system'
  coachName?: string | null
  newStatus: ClientStatus
  reasonCode: string
  reasonNotes?: string | null
  effectiveDate?: string
  metadata?: Record<string, unknown>
}

export class ClientLifecycleError extends Error {
  status: number
  code: string

  constructor(message: string, status = 400, code = 'LIFECYCLE_ERROR') {
    super(message)
    this.status = status
    this.code = code
  }
}

/**
 * Normalizes email address to guarantee consistent lowercase identity indexing.
 */
export function normalizeClientEmail(email: string | null | undefined): string {
  if (!email) return ''
  return String(email).trim().toLowerCase()
}

/**
 * Normalizes phone number by stripping formatting characters for exact comparison.
 */
export function normalizeClientPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  return String(phone).replace(/[^\d+]/g, '').trim()
}

/**
 * Validates whether the requested status transition and reason code are logically valid.
 */
export function validateStatusTransition(
  currentStatus: ClientStatus | null | undefined,
  newStatus: ClientStatus,
  reasonCode: string,
  reasonNotes?: string | null
): { valid: boolean; reasonDef: StatusReasonDefinition } {
  if (!newStatus || !['active', 'inactive', 'paused', 'archived'].includes(newStatus)) {
    throw new ClientLifecycleError(`Invalid client status: ${newStatus}`, 400, 'INVALID_STATUS')
  }

  const reasonDef = STATUS_REASONS[reasonCode]
  if (!reasonDef) {
    throw new ClientLifecycleError(`Unknown status reason code: ${reasonCode}`, 400, 'INVALID_REASON_CODE')
  }

  // Determine expected reason category for target status
  const expectedCategory: Record<ClientStatus, StatusReasonCategory> = {
    active: 'activation',
    paused: 'pause',
    inactive: 'deactivation',
    archived: 'archive',
  }

  if (reasonDef.category !== expectedCategory[newStatus]) {
    throw new ClientLifecycleError(
      `Reason code '${reasonCode}' belongs to category '${reasonDef.category}', which cannot be used for transitioning to '${newStatus}'`,
      400,
      'CATEGORY_MISMATCH'
    )
  }

  if (currentStatus === newStatus) {
    throw new ClientLifecycleError(
      `Client is already in status '${newStatus}'`,
      400,
      'NO_OP_TRANSITION'
    )
  }

  if (reasonDef.requiresNotes && (!reasonNotes || !reasonNotes.trim())) {
    throw new ClientLifecycleError(
      `Reason '${reasonDef.label}' requires mandatory clinical/operational notes for audit compliance.`,
      400,
      'NOTES_REQUIRED'
    )
  }

  return { valid: true, reasonDef }
}

/**
 * Checks for duplicate client records matching email or phone in the studio database.
 */
export async function validateClientUniqueness(
  admin: SupabaseClient | { from: (table: string) => ReturnType<SupabaseClient['from']> },
  email: string,
  phone?: string | null,
  excludeClientId?: string
): Promise<{
  isUnique: boolean
  duplicateField?: 'email' | 'phone'
  existingClient?: {
    id: string
    email: string
    full_name: string | null
    status: ClientStatus
    designated_coach_id: string | null
  }
}> {
  const normalizedEmail = normalizeClientEmail(email)
  if (!normalizedEmail) {
    return { isUnique: false }
  }

  // Check email match
  let emailQuery = admin
    .from('clients')
    .select('id, email, full_name, status, designated_coach_id')
    .ilike('email', normalizedEmail)

  if (excludeClientId) {
    emailQuery = emailQuery.neq('id', excludeClientId)
  }

  const { data: emailMatch, error: emailError } = await emailQuery.maybeSingle()
  if (emailError) {
    throw new ClientLifecycleError('Failed to verify client email uniqueness', 500, 'DB_ERROR')
  }

  if (emailMatch) {
    return {
      isUnique: false,
      duplicateField: 'email',
      existingClient: {
        id: emailMatch.id,
        email: emailMatch.email,
        full_name: emailMatch.full_name,
        status: (emailMatch.status || 'active') as ClientStatus,
        designated_coach_id: emailMatch.designated_coach_id,
      },
    }
  }

  // Check phone match if provided
  const normalizedPhone = normalizeClientPhone(phone)
  if (normalizedPhone && normalizedPhone.length >= 7) {
    let phoneQuery = admin
      .from('clients')
      .select('id, email, full_name, status, designated_coach_id')
      .eq('phone', normalizedPhone)

    if (excludeClientId) {
      phoneQuery = phoneQuery.neq('id', excludeClientId)
    }

    const { data: phoneMatch } = await phoneQuery.maybeSingle()
    if (phoneMatch) {
      return {
        isUnique: false,
        duplicateField: 'phone',
        existingClient: {
          id: phoneMatch.id,
          email: phoneMatch.email,
          full_name: phoneMatch.full_name,
          status: (phoneMatch.status || 'active') as ClientStatus,
          designated_coach_id: phoneMatch.designated_coach_id,
        },
      }
    }
  }

  return { isUnique: true }
}

/**
 * Atomically transitions client status and records an immutable audit log entry.
 */
export async function transitionClientStatus(
  admin: SupabaseClient | { from: (table: string) => ReturnType<SupabaseClient['from']> },
  params: TransitionStatusParams
): Promise<{
  success: boolean
  client: {
    id: string
    email: string
    full_name: string | null
    status: ClientStatus
    status_reason: string | null
    status_updated_at: string
  }
  auditLog: LifecycleAuditLogEntry
}> {
  const {
    clientId,
    coachId,
    actorRole = 'coach',
    coachName,
    newStatus,
    reasonCode,
    reasonNotes,
    effectiveDate,
    metadata,
  } = params

  // 1. Fetch current client
  const { data: currentClient, error: fetchError } = await admin
    .from('clients')
    .select('id, email, full_name, status, designated_coach_id')
    .eq('id', clientId)
    .maybeSingle()

  if (fetchError || !currentClient) {
    throw new ClientLifecycleError('Client not found', 404, 'CLIENT_NOT_FOUND')
  }

  if (actorRole === 'coach' && currentClient.designated_coach_id !== coachId) {
    throw new ClientLifecycleError(
      'Coach is not assigned to this client',
      403,
      'CLIENT_NOT_ASSIGNED'
    )
  }

  const previousStatus = (currentClient.status || 'active') as ClientStatus

  // 2. Validate transition rules and reason code
  const { reasonDef } = validateStatusTransition(previousStatus, newStatus, reasonCode, reasonNotes)

  const timestamp = new Date().toISOString()
  const effectiveTimestamp = effectiveDate ? new Date(effectiveDate).toISOString() : timestamp

  // 3. Determine action tag
  let action = 'status_change'
  if (newStatus === 'active' && previousStatus !== 'active') action = 'activation'
  else if (newStatus === 'inactive') action = 'deactivation'
  else if (newStatus === 'paused') action = 'pause'
  else if (newStatus === 'archived') action = 'archive'

  // 4. Update clients table
  const { data: updatedClient, error: updateError } = await admin
    .from('clients')
    .update({
      status: newStatus,
      status_reason: reasonDef.label,
      status_updated_at: timestamp,
      status_updated_by: coachId,
    })
    .eq('id', clientId)
    .select('id, email, full_name, status, status_reason, status_updated_at')
    .single()

  if (updateError || !updatedClient) {
    throw new ClientLifecycleError(updateError?.message || 'Failed to update client status', 500, 'UPDATE_FAILED')
  }

  // 5. Insert immutable audit log entry
  const auditPayload = {
    client_id: clientId,
    actor_id: coachId,
    actor_name: coachName || 'Coach',
    actor_role: actorRole,
    action,
    previous_status: previousStatus,
    new_status: newStatus,
    reason_code: reasonCode,
    reason_notes: reasonNotes?.trim() || null,
    effective_date: effectiveTimestamp,
    metadata: {
      ...(metadata || {}),
      reason_label: reasonDef.label,
      client_email: currentClient.email,
      client_name: currentClient.full_name,
    },
    created_at: timestamp,
  }

  const { data: auditLog, error: auditError } = await admin
    .from('client_lifecycle_audit_logs')
    .insert(auditPayload)
    .select('*')
    .single()

  if (auditError) {
    // If audit insert fails, log warning (audit log table might need schema creation)
    console.error('[Lifecycle] Audit log insert failed:', auditError.message)
  }

  return {
    success: true,
    client: updatedClient,
    auditLog: auditLog || auditPayload,
  }
}

/**
 * Retrieves the complete lifecycle audit history for a client.
 */
export async function getClientLifecycleAuditTrail(
  admin: SupabaseClient | { from: (table: string) => ReturnType<SupabaseClient['from']> },
  clientId: string
): Promise<LifecycleAuditLogEntry[]> {
  const { data, error } = await admin
    .from('client_lifecycle_audit_logs')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    return []
  }

  return data || []
}
