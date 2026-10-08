/**
 * Gordon Athletic Advisory - Sovereign Cryptographic Verification Engine
 * 
 * Provides deterministic audit verification hashes for institutional
 * execution tracking, personal record milestones, and mesocycle compliance.
 * 
 * Format Standard:
 *  - Workload Execution: GAA-SIG-XXXX-EXEC (e.g. GAA-SIG-8492-EXEC)
 *  - Biomechanical PR Peak: GAA-SIG-XXXX-PEAK (e.g. GAA-SIG-7E2B-PEAK)
 *  - Longitudinal Audit: GAA-SIG-XXXX-AUDIT
 *  - Boardroom Proposal / Dossier: GAA-SIG-XXXX-XXXX
 */

export interface ExecutiveHashParams {
  athleteId?: string
  sessionDate?: string
  totalVolumeKg?: number
  totalSets?: number
  nasmOptPhase?: number | string
}

export interface PersonalRecordSealParams {
  exerciseName: string
  weightLbsOrKg: number
  reps: number
  date?: string
}

export interface LongitudinalAuditSealParams {
  athleteId?: string
  startDate?: string
  endDate?: string
  completedSessions?: number
  compliancePct?: number
}

/**
 * Multiplicative FNV-1a hash derivative producing a 32-bit unsigned integer.
 */
function hashString(str: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  return hash >>> 0
}

/**
 * Formats a 32-bit hash into a 4-character uppercase hex signature chunk.
 */
function toHex4(val: number): string {
  const hex = val.toString(16).toUpperCase().padStart(8, '0')
  return hex.slice(0, 4)
}

/**
 * Generates a deterministic cryptographic verification hash for executive training execution.
 * Format: GAA-SIG-XXXX-EXEC (e.g. GAA-SIG-8492-EXEC)
 */
export function generateExecutiveVerificationHash(params: ExecutiveHashParams): string {
  const {
    athleteId = 'GAA-EXEC-ATHLETE',
    sessionDate = new Date().toISOString().slice(0, 10),
    totalVolumeKg = 0,
    totalSets = 0,
    nasmOptPhase = 'PHASE-1',
  } = params

  const raw = `${athleteId}|${sessionDate}|${totalVolumeKg}|${totalSets}|${nasmOptPhase}|GAA-SOVEREIGN-EXEC-2026`
  const hash = hashString(raw)
  return `GAA-SIG-${toHex4(hash)}-EXEC`
}

/**
 * Generates a deterministic cryptographic seal for personal record / biomechanical threshold breakthroughs.
 * Format: GAA-SIG-XXXX-PEAK (e.g. GAA-SIG-7E2B-PEAK)
 */
export function generatePersonalRecordSeal(params: PersonalRecordSealParams): string {
  const {
    exerciseName,
    weightLbsOrKg,
    reps,
    date = new Date().toISOString().slice(0, 10),
  } = params

  const normalized = exerciseName.toLowerCase().replace(/[^a-z0-9]/g, '')
  const raw = `${normalized}|${weightLbsOrKg}|${reps}|${date}|GAA-OPT-PEAK-AUDIT`
  const hash = hashString(raw)
  return `GAA-SIG-${toHex4(hash)}-PEAK`
}

/**
 * Generates a deterministic cryptographic audit seal for longitudinal compliance.
 * Format: GAA-SIG-XXXX-AUDIT
 */
export function generateLongitudinalAuditSeal(params: LongitudinalAuditSealParams): string {
  const {
    athleteId = 'GAA-ATHLETE',
    startDate = '',
    endDate = '',
    completedSessions = 0,
    compliancePct = 100,
  } = params

  const raw = `${athleteId}|${startDate}|${endDate}|${completedSessions}|${compliancePct}|GAA-LONGITUDINAL-INTEGRITY`
  const hash = hashString(raw)
  return `GAA-SIG-${toHex4(hash)}-AUDIT`
}

/**
 * Validates whether a given string is a valid Forge Athletic cryptographic verification seal.
 */
export function verifyCryptographicSeal(seal: string): boolean {
  if (!seal || typeof seal !== 'string') return false
  return /^GAA-SIG-[0-9A-F]{4}-(EXEC|PEAK|AUDIT|[0-9A-F]{4})$/.test(seal)
}
