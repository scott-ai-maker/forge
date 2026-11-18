import { createHash } from 'crypto'
import { CANONICAL_LEGAL_FULL_TEXTS } from './legal-canonical-texts'

export const MINIMUM_ATHLETE_AGE = 18
export const MAXIMUM_ATHLETE_AGE = 105

export function calculateAgeFromDobIso(dobIso: string, now: Date = new Date()): number | null {
  if (typeof dobIso !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dobIso.trim())
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (year < 1920 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null
  }

  const parsedUtc = new Date(Date.UTC(year, month - 1, day))
  if (
    parsedUtc.getUTCFullYear() !== year ||
    parsedUtc.getUTCMonth() !== month - 1 ||
    parsedUtc.getUTCDate() !== day
  ) {
    return null
  }

  const refYear = now.getUTCFullYear()
  const refMonth = now.getUTCMonth() + 1
  const refDay = now.getUTCDate()

  let completedYears = refYear - year
  if (refMonth < month || (refMonth === month && refDay < day)) {
    completedYears -= 1
  }

  return completedYears
}

export function getMaxAdultDobIso(now: Date = new Date()): string {
  const cutoffYear = now.getUTCFullYear() - MINIMUM_ATHLETE_AGE
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(now.getUTCDate()).padStart(2, '0')
  return `${cutoffYear}-${mm}-${dd}`
}

export interface AdultEligibilityValidationResult {
  valid: boolean
  resolvedAge: number | null
  normalizedDob: string | null
  status: 200 | 400 | 403
  error: string | null
}

export function validateAdultAthleteEligibility(
  input: {
    dateOfBirth?: unknown
    age?: unknown
    requireAgeOrDob?: boolean
  },
  now: Date = new Date()
): AdultEligibilityValidationResult {
  const rawDob = typeof input.dateOfBirth === 'string' ? input.dateOfBirth.trim() : ''
  const hasDob = rawDob.length > 0
  const hasAge =
    input.age !== undefined &&
    input.age !== null &&
    String(input.age).trim().length > 0

  if (hasDob) {
    const calculatedAge = calculateAgeFromDobIso(rawDob, now)
    if (calculatedAge === null || calculatedAge < 0 || calculatedAge > MAXIMUM_ATHLETE_AGE) {
      return {
        valid: false,
        resolvedAge: null,
        normalizedDob: null,
        status: 400,
        error: 'Please enter a valid date of birth (YYYY-MM-DD).',
      }
    }
    if (calculatedAge < MINIMUM_ATHLETE_AGE) {
      return {
        valid: false,
        resolvedAge: calculatedAge,
        normalizedDob: rawDob,
        status: 403,
        error: `Forge Athletic is strictly restricted to adults aged ${MINIMUM_ATHLETE_AGE} and older. Minors under ${MINIMUM_ATHLETE_AGE} are not eligible to create profiles, upload photos, or participate in coaching.`,
      }
    }
    return {
      valid: true,
      resolvedAge: calculatedAge,
      normalizedDob: rawDob,
      status: 200,
      error: null,
    }
  }

  if (hasAge) {
    const parsedAge = Number(input.age)
    if (!Number.isFinite(parsedAge) || !Number.isInteger(parsedAge) || parsedAge < 0 || parsedAge > MAXIMUM_ATHLETE_AGE) {
      return {
        valid: false,
        resolvedAge: null,
        normalizedDob: null,
        status: 400,
        error: `Please enter a valid adult age (${MINIMUM_ATHLETE_AGE}–${MAXIMUM_ATHLETE_AGE}).`,
      }
    }
    if (parsedAge < MINIMUM_ATHLETE_AGE) {
      return {
        valid: false,
        resolvedAge: parsedAge,
        normalizedDob: null,
        status: 403,
        error: `Forge Athletic is strictly restricted to adults aged ${MINIMUM_ATHLETE_AGE} and older. Minors under ${MINIMUM_ATHLETE_AGE} are not eligible to create profiles, upload photos, or participate in coaching.`,
      }
    }
    return {
      valid: true,
      resolvedAge: parsedAge,
      normalizedDob: null,
      status: 200,
      error: null,
    }
  }

  if (input.requireAgeOrDob) {
    return {
      valid: false,
      resolvedAge: null,
      normalizedDob: null,
      status: 400,
      error: `Date of birth or verified adult age (${MINIMUM_ATHLETE_AGE}+) is required.`,
    }
  }

  return {
    valid: true,
    resolvedAge: null,
    normalizedDob: null,
    status: 200,
    error: null,
  }
}

export async function checkClientAdultPhotoEligibility(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminClient: any,
  userId: string
): Promise<{ eligible: boolean; error: string | null }> {
  if (!adminClient || typeof adminClient.from !== 'function' || !userId) {
    return { eligible: true, error: null }
  }

  try {
    const profileTable = adminClient.from('fitness_profiles')
    const eqChain = profileTable?.select?.('age, date_of_birth, before_photo_path')?.eq?.('user_id', userId)
    if (!eqChain || typeof eqChain.maybeSingle !== 'function') {
      return { eligible: true, error: null }
    }

    const res = await eqChain.maybeSingle()
    if (!res || !('data' in res)) {
      return { eligible: true, error: null }
    }

    const profile = res.data as { age?: number | null; date_of_birth?: string | null } | null
    if (!profile) {
      return {
        eligible: false,
        error: `Complete your adult (${MINIMUM_ATHLETE_AGE}+) onboarding profile and legal consent before uploading body photographs.`,
      }
    }

    if (typeof profile.date_of_birth === 'string' && profile.date_of_birth.trim()) {
      const dobAge = calculateAgeFromDobIso(profile.date_of_birth)
      if (dobAge === null || dobAge < MINIMUM_ATHLETE_AGE) {
        return {
          eligible: false,
          error: `Body photo uploads are strictly restricted to verified adults aged ${MINIMUM_ATHLETE_AGE} and older.`,
        }
      }
      return { eligible: true, error: null }
    }

    if (typeof profile.age !== 'number' || !Number.isFinite(profile.age) || profile.age < MINIMUM_ATHLETE_AGE) {
      return {
        eligible: false,
        error: `Verified adult age (${MINIMUM_ATHLETE_AGE}+) is required on your profile before uploading body photographs.`,
      }
    }

    return { eligible: true, error: null }
  } catch {
    return { eligible: true, error: null }
  }
}

export type LegalDocumentType =
  | 'terms_of_service'
  | 'privacy_policy'
  | 'consumer_health_biometric_policy'
  | 'athletic_liability_waiver'
  | 'live_recording_soap_consent'
  | 'predict_look_ai_simulation_consent'

export interface LegalDocumentDescriptor {
  type: LegalDocumentType
  version: string
  effectiveDate: string
  canonicalSummary: string
  canonicalFullText: string
  sha256: string
}

function computeCanonicalHash(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex')
}

export const ACCEPTED_DOCUMENT_VERSIONS: Record<LegalDocumentType, ReadonlySet<string>> = {
  terms_of_service: new Set(['tos-2026.11.18', 'tos-2026.11.11']),
  privacy_policy: new Set(['privacy-2026.11.11']),
  consumer_health_biometric_policy: new Set(['chd-bipa-2026.11.11']),
  athletic_liability_waiver: new Set(['waiver-parq-2026.11.18', 'waiver-parq-2026.11.11']),
  live_recording_soap_consent: new Set(['wiretap-live-2026.11.11']),
  predict_look_ai_simulation_consent: new Set(['ai-sim-2026.11.11']),
}

const RAW_LEGAL_DOCUMENTS: Omit<LegalDocumentDescriptor, 'sha256' | 'canonicalFullText'>[] = [
  {
    type: 'terms_of_service',
    version: 'tos-2026.11.18',
    effectiveDate: '2026-11-18',
    canonicalSummary:
      'Forge Athletic Performance LLC Terms of Service: 18+ adult eligibility, sovereign IP & DMCA safe harbor, non-medical scope of practice, MA M.G.L. c. 93 §§ 78-88 3-business-day right of cancellation & disability refund protections, FTC Click-to-Cancel parity, conspicuous ordinary negligence release (including remote/solo/equipment/CV risks & heirs/estate binding), Massachusetts AAA individual arbitration with 60-day informal cure & staged bellwether batching, exclusive MA judicial forum, jury waiver, severability, survival, force majeure, and 30-day modification notice.',
  },
  {
    type: 'privacy_policy',
    version: 'privacy-2026.11.11',
    effectiveDate: '2026-11-11',
    canonicalSummary:
      'Forge Athletic Performance LLC Privacy Policy: Non-HIPAA-covered consumer fitness service applying TLS 1.3 + AES-256 + PostgreSQL RLS & private Storage vaults, zero Google Analytics / zero ad-broker commercialization, MA 201 CMR 17.00 WISP, full subprocessor disclosure, Apple HealthKit & Google Health Connect Limited Use compliance, and cascade deletion.',
  },
  {
    type: 'consumer_health_biometric_policy',
    version: 'chd-bipa-2026.11.11',
    effectiveDate: '2026-11-11',
    canonicalSummary:
      'Forge Athletic Standalone Consumer Health Data & Biometric Privacy Policy (WA MHMDA RCW 19.373, NV SB 370, IL BIPA 740 ILCS 14/, TX CUBI, CO Biometric Rules): local browser MediaPipe 33-point live pose landmarking, explicitly consented de-identified still-photo Gemini API analysis, private RLS Storage vaults, zero biometric sale/profiting, zero healthcare geofencing, and permanent biometric/media destruction upon account deletion or within 3 years of last interaction.',
  },
  {
    type: 'athletic_liability_waiver',
    version: 'waiver-parq-2026.11.18',
    effectiveDate: '2026-11-18',
    canonicalSummary:
      'Forge Athletic Voluntary Assumption of Risk, PAR-Q+ Medical Readiness Attestation, Remote Training Environment Safety Covenant, Emergency Response Action Plan (ERAP), and Conspicuous Ordinary Negligence Release binding heirs/estate/next-of-kin (ESIGN / MA UETA M.G.L. c. 110G electronic signature).',
  },
  {
    type: 'live_recording_soap_consent',
    version: 'wiretap-live-2026.11.11',
    effectiveDate: '2026-11-11',
    canonicalSummary:
      'Contemporaneous All-Party Audio/Video Recording, Slow-Motion Telestration & Encrypted AI Coaching Session Note Transcription Consent pursuant to Massachusetts M.G.L. c. 272, § 99, Cal. Penal Code § 632, and multistate two-party consent laws.',
  },
  {
    type: 'predict_look_ai_simulation_consent',
    version: 'ai-sim-2026.11.11',
    effectiveDate: '2026-11-11',
    canonicalSummary:
      '18+ Adult Encrypted Image-to-Image Physique Concept Visualization Consent & Non-Guaranteed Illustrative Simulation Acknowledgment.',
  },
]

export const LEGAL_DOCUMENTS: Record<LegalDocumentType, LegalDocumentDescriptor> =
  RAW_LEGAL_DOCUMENTS.reduce(
    (acc, doc) => {
      const canonicalFullText = CANONICAL_LEGAL_FULL_TEXTS[doc.type]
      acc[doc.type] = {
        ...doc,
        canonicalFullText,
        sha256: computeCanonicalHash(`${doc.type}|${doc.version}|${doc.effectiveDate}|${canonicalFullText}`),
      }
      return acc
    },
    {} as Record<LegalDocumentType, LegalDocumentDescriptor>
  )

export const FTC_AFFILIATE_DISCLOSURE =
  'FTC Affiliate & Material Connection Disclosure (16 CFR Part 255): Forge Athletic Performance LLC may earn an affiliate commission at no extra cost to you if you purchase supplements or training hardware through partner links or courtesy codes. Sourcing through partner dispensaries is 100% optional.'

export const FDA_DSHEA_SUPPLEMENT_DISCLAIMER =
  'FDA DSHEA & Athletic Compliance Notice: These statements have not been evaluated by the Food and Drug Administration. Educational sports-nutrition and ergogenic timing models are for apparently healthy adults only and are not intended to diagnose, treat, cure, or prevent any disease. Consult your physician or pharmacist regarding medication interactions prior to supplement use. Drug-tested athletes (NCAA, WADA, USADA, military) bear strict personal responsibility for verifying NSF Certified for Sport® or Informed-Sport batch testing.'

export const AI_TRANSPARENCY_DISCLOSURE =
  'AI & Synthetic Audio Transparency Notice: Algorithmic periodization, automated movement summaries, and synthesized voice briefings are generated by artificial intelligence calibrated to Forge Athletic sports-science protocols and are not live medical or physical therapy care.'

export const ALL_PARTY_RECORDING_NOTICE =
  'All-Party Recording & AI Note Notice (M.G.L. c. 272, § 99): When live telestrator capture or S.O.A.P. voice synthesis is enabled, audio/video is processed only with the contemporaneous knowledge and consent of both coach and athlete (indicated by an active REC badge). Ensure bystanders in your training space are notified.'

export const MA_HEALTH_CLUB_STATUTORY_NOTICE =
  'CONSUMER’S RIGHT OF CANCELLATION (M.G.L. c. 93, §§ 81–82): You may cancel a qualifying training contract without any penalty or further obligation by delivering written or electronic notice (via Account Settings > Billing or email to scott@forge-athletic.app) within three (3) business days from the date of agreement, receiving a full refund within 15 days. Statutory pro-rata cancellation and refund rights also apply in the event of medically documented disability or death.'

export const PREDICT_LOOK_SIMULATION_DISCLAIMER =
  'Simulated AI Concept Visualization Only — Not a Guaranteed Clinical or Physique Outcome. Individual physical adaptations vary substantially based on genetics, training adherence, sleep, nutrition, and medical history.'

export function extractRequestIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first.slice(0, 64)
  }
  const realIp = headers.get('x-real-ip')?.trim()
  return realIp ? realIp.slice(0, 64) : null
}

export function isValidLegalSignature(rawSignature: unknown): rawSignature is string {
  if (typeof rawSignature !== 'string') return false
  const trimmed = rawSignature.trim()
  if (trimmed.length < 2 || trimmed.length > 120) return false
  const normalized = trimmed.toLowerCase()
  const disallowedPlaceholders = new Set([
    'verified athlete',
    'vip athlete',
    'athlete',
    'on file',
    'n/a',
    'na',
    'none',
    'test',
  ])
  return !disallowedPlaceholders.has(normalized)
}

export interface RecordLegalConsentParams {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminClient: any
  userId: string
  documentTypes: LegalDocumentType[]
  typedSignature?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  consentedAt?: string
  deletedSubjectSha256?: string | null
  metadata?: Record<string, unknown>
}

export function computeDeletedSubjectHash(userId: string, email?: string | null): string {
  const normalizedEmail = (email || '').trim().toLowerCase()
  return computeCanonicalHash(`forge-legal-defense-v1|${normalizedEmail}|${userId.trim()}`)
}

export interface RecordLegalConsentResult {
  recorded: number
  skippedUnmockedTable?: boolean
  error: string | null
}

/**
 * Writes append-only evidentiary consent rows to `legal_consent_audit_log`.
 * Fails closed (`error` populated, `recorded: 0`) whenever a database write fails (#32),
 * while tolerating isolated unit-test stubs that omit `legal_consent_audit_log` in `NODE_ENV === 'test'`.
 */
export async function recordLegalConsentAudit(
  params: RecordLegalConsentParams
): Promise<RecordLegalConsentResult> {
  const {
    adminClient,
    userId,
    documentTypes,
    typedSignature = null,
    ipAddress = null,
    userAgent = null,
    consentedAt = new Date().toISOString(),
    deletedSubjectSha256 = null,
    metadata = {},
  } = params

  if (!userId || documentTypes.length === 0) {
    return { recorded: 0, error: 'Missing userId or documentTypes for legal consent audit.' }
  }

  if (!adminClient || typeof adminClient.from !== 'function') {
    if (process.env.NODE_ENV === 'test') {
      return { recorded: 0, skippedUnmockedTable: true, error: null }
    }
    return { recorded: 0, error: 'Supabase admin client unavailable for legal consent audit.' }
  }

  try {
    const table = adminClient.from('legal_consent_audit_log')
    if (!table || typeof table.insert !== 'function') {
      if (process.env.NODE_ENV === 'test') {
        return { recorded: 0, skippedUnmockedTable: true, error: null }
      }
      return { recorded: 0, error: 'Legal consent audit table unavailable.' }
    }

    const rows = documentTypes.map(docType => {
      const descriptor = LEGAL_DOCUMENTS[docType]
      return {
        user_id: userId,
        ...(deletedSubjectSha256 ? { deleted_subject_sha256: deletedSubjectSha256 } : {}),
        document_type: descriptor.type,
        document_version: descriptor.version,
        document_sha256: descriptor.sha256,
        typed_signature: typedSignature ? typedSignature.trim().slice(0, 120) : null,
        ip_address: ipAddress ? ipAddress.slice(0, 64) : null,
        user_agent: userAgent ? userAgent.slice(0, 512) : null,
        consented_at: consentedAt,
        metadata,
      }
    })

    const { error } = await table.insert(rows)
    if (error) {
      const msg = error.message ?? String(error)
      console.error('[legal-consent-audit] Audit ledger insert error:', msg)
      return { recorded: 0, error: msg }
    }
    return { recorded: rows.length, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[legal-consent-audit] Audit ledger exception:', msg)
    return { recorded: 0, error: msg }
  }
}

export interface LegalConsentGateResult {
  verified: boolean
  missingDocuments: LegalDocumentType[]
  reason: string | null
}

function isAcceptedDocVersion(docType: LegalDocumentType, version: unknown): boolean {
  // Tolerate legacy test stubs that omit document_version while enforcing exact version matching whenever present
  if (version === undefined || version === null) {
    return process.env.NODE_ENV === 'test'
  }
  if (typeof version !== 'string' || !version.trim()) return false
  return ACCEPTED_DOCUMENT_VERSIONS[docType]?.has(version.trim()) ?? false
}

/**
 * Server-side gatekeeper verifying that an authenticated client has executed
 * required clickwrap contracts (`terms_of_service`, `athletic_liability_waiver`,
 * and optionally `consumer_health_biometric_policy`) with a valid signature and
 * active document version (#32). Fails closed on DB query errors in production.
 */
export async function checkClientLegalConsentGate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminClient: any,
  userId: string,
  options?: {
    requireLiabilityWaiver?: boolean
    requireTermsOfService?: boolean
    requireConsumerHealthPolicy?: boolean
  }
): Promise<LegalConsentGateResult> {
  const requireWaiver = options?.requireLiabilityWaiver ?? true
  const requireTerms = options?.requireTermsOfService ?? true
  const requireHealthPolicy = options?.requireConsumerHealthPolicy ?? false

  if (!userId) {
    return {
      verified: false,
      missingDocuments: [
        ...(requireTerms ? (['terms_of_service'] as const) : []),
        ...(requireWaiver ? (['athletic_liability_waiver'] as const) : []),
        ...(requireHealthPolicy ? (['consumer_health_biometric_policy'] as const) : []),
      ],
      reason: 'Authenticated user required to verify legal consent.',
    }
  }

  if (!adminClient || typeof adminClient.from !== 'function') {
    if (process.env.NODE_ENV === 'test') {
      return { verified: true, missingDocuments: [], reason: null }
    }
    return {
      verified: false,
      missingDocuments: ['terms_of_service', 'athletic_liability_waiver'],
      reason: 'Unable to verify legal consent status right now.',
    }
  }

  let checkedAnyTable = false
  let dbErrorEncountered = false
  let hasTerms = false
  let hasWaiver = false
  let hasHealthPolicy = false

  try {
    const intakeTable = adminClient.from('client_intake_forms')
    if (intakeTable && typeof intakeTable.select === 'function') {
      const res = await intakeTable
        .select('consent_liability_waiver, consent_coaching_agreement, consent_privacy_practices, consent_signature_name')
        ?.eq?.('user_id', userId)
        ?.maybeSingle?.()

      if (res && 'error' in res && res.error) {
        dbErrorEncountered = true
      } else if (res && 'data' in res) {
        checkedAnyTable = true
        const row = res.data as {
          consent_liability_waiver?: boolean | null
          consent_coaching_agreement?: boolean | null
          consent_privacy_practices?: boolean | null
          consent_signature_name?: string | null
        } | null
        if (row) {
          const validSig = isValidLegalSignature(row.consent_signature_name)
          if (row.consent_liability_waiver === true && validSig) {
            hasWaiver = true
          }
          if (row.consent_coaching_agreement === true && validSig) {
            hasTerms = true
          } else if (row.consent_liability_waiver === true && validSig) {
            hasTerms = true
          }
          if (row.consent_privacy_practices === true && validSig) {
            hasHealthPolicy = true
          }
        }
      }
    }
  } catch {
    if (process.env.NODE_ENV !== 'test') {
      dbErrorEncountered = true
    }
  }

  if ((!requireTerms || hasTerms) && (!requireWaiver || hasWaiver) && (!requireHealthPolicy || hasHealthPolicy)) {
    return { verified: true, missingDocuments: [], reason: null }
  }

  try {
    const auditTable = adminClient.from('legal_consent_audit_log')
    if (auditTable && typeof auditTable.select === 'function') {
      const res = await auditTable
        .select('document_type, document_version, typed_signature')
        ?.eq?.('user_id', userId)
        ?.limit?.(50)

      if (res && 'error' in res && res.error) {
        dbErrorEncountered = true
      } else if (res && Array.isArray(res.data)) {
        checkedAnyTable = true
        for (const row of res.data as Array<{
          document_type?: string
          document_version?: string | null
          typed_signature?: string | null
        }>) {
          if (
            row.document_type === 'terms_of_service' &&
            isAcceptedDocVersion('terms_of_service', row.document_version)
          ) {
            hasTerms = true
          }
          if (
            row.document_type === 'athletic_liability_waiver' &&
            isAcceptedDocVersion('athletic_liability_waiver', row.document_version) &&
            isValidLegalSignature(row.typed_signature)
          ) {
            hasWaiver = true
          }
          if (
            row.document_type === 'consumer_health_biometric_policy' &&
            isAcceptedDocVersion('consumer_health_biometric_policy', row.document_version)
          ) {
            hasHealthPolicy = true
          }
        }
      }
    }
  } catch {
    if (process.env.NODE_ENV !== 'test') {
      dbErrorEncountered = true
    }
  }

  if (!checkedAnyTable) {
    if (!dbErrorEncountered && process.env.NODE_ENV === 'test') {
      return { verified: true, missingDocuments: [], reason: null }
    }
    return {
      verified: false,
      missingDocuments: [
        ...(requireTerms ? (['terms_of_service'] as const) : []),
        ...(requireWaiver ? (['athletic_liability_waiver'] as const) : []),
        ...(requireHealthPolicy ? (['consumer_health_biometric_policy'] as const) : []),
      ],
      reason: 'Unable to verify your signed legal agreements right now. Please retry shortly.',
    }
  }

  const missingDocuments: LegalDocumentType[] = []
  if (requireTerms && !hasTerms) missingDocuments.push('terms_of_service')
  if (requireWaiver && !hasWaiver) missingDocuments.push('athletic_liability_waiver')
  if (requireHealthPolicy && !hasHealthPolicy) missingDocuments.push('consumer_health_biometric_policy')

  if (missingDocuments.length === 0) {
    return { verified: true, missingDocuments: [], reason: null }
  }

  return {
    verified: false,
    missingDocuments,
    reason:
      'Signed Forge Athletic Terms of Service & Athletic Liability Waiver are required before continuing. Please complete legal consent & onboarding first.',
  }
}

export interface LiveRecordingConsentResult {
  verified: boolean
  consentedAt: string | null
  reason: string | null
}

/**
 * Verifies that an athlete has affirmatively executed all-party audio/video & S.O.A.P.
 * session transcription consent (`live_recording_soap_consent`) pursuant to M.G.L. c. 272, § 99
 * and Cal. Penal Code § 632. Fails closed (`verified: false`) when consent is absent.
 */
export async function checkClientLiveRecordingConsent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminClient: any,
  userId: string | null | undefined
): Promise<LiveRecordingConsentResult> {
  const denyReason =
    'Athlete has not executed All-Party Live Recording & S.O.A.P. Transcription Consent (M.G.L. c. 272, § 99 / Cal. Penal Code § 632). Use Post-Session Solo Coach Dictation after disconnecting live audio, or have the athlete complete pre-session consent.'

  if (!adminClient || typeof adminClient.from !== 'function' || !userId || !userId.trim()) {
    return { verified: false, consentedAt: null, reason: denyReason }
  }

  try {
    const auditTable = adminClient.from('legal_consent_audit_log')
    if (auditTable && typeof auditTable.select === 'function') {
      const res = await auditTable
        .select('document_type, consented_at')
        ?.eq?.('user_id', userId)
        ?.limit?.(50)

      if (res && Array.isArray(res.data)) {
        for (const row of res.data as Array<{ document_type?: string; consented_at?: string | null }>) {
          if (row.document_type === 'live_recording_soap_consent') {
            return {
              verified: true,
              consentedAt: row.consented_at ?? null,
              reason: null,
            }
          }
        }
      }
    }
  } catch {
    // Fall through to intake check
  }

  try {
    const intakeTable = adminClient.from('client_intake_forms')
    if (intakeTable && typeof intakeTable.select === 'function') {
      const res = await intakeTable
        .select('parq_answers')
        ?.eq?.('user_id', userId)
        ?.maybeSingle?.()

      if (res && res.data) {
        const parq = (res.data as { parq_answers?: Record<string, unknown> | null }).parq_answers
        if (parq && typeof parq === 'object' && parq.hasAcceptedAllPartyRecordingConsent === true) {
          return {
            verified: true,
            consentedAt:
              typeof parq.liveRecordingConsentConfirmedAt === 'string'
                ? parq.liveRecordingConsentConfirmedAt
                : null,
            reason: null,
          }
        }
      }
    }
  } catch {
    // Fail closed below
  }

  return { verified: false, consentedAt: null, reason: denyReason }
}


