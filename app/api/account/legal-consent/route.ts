import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { protectCSRF } from '@/lib/csrf'
import {
  LEGAL_DOCUMENTS,
  type LegalDocumentType,
  extractRequestIp,
  recordLegalConsentAudit,
} from '@/lib/legal-compliance'

const VALID_DOC_TYPES = [
  'terms_of_service',
  'privacy_policy',
  'consumer_health_biometric_policy',
  'athletic_liability_waiver',
  'live_recording_soap_consent',
  'predict_look_ai_simulation_consent',
] as const satisfies readonly LegalDocumentType[]

const PostConsentSchema = z.object({
  documentTypes: z.array(z.enum(VALID_DOC_TYPES)).min(1).max(6),
  ageVerified18Plus: z.literal(true, {
    error: 'You must confirm you are at least 18 years of age (or legal age of majority).',
  }),
  affirmativeAssent: z.literal(true, {
    error: 'Explicit affirmative consent is required.',
  }),
  typedSignature: z.string().trim().min(2).max(120).optional(),
  flow: z.string().trim().max(64).optional(),
})

export async function GET(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const admin = supabaseAdmin()
  const { data, error } = await admin
    .from('legal_consent_audit_log')
    .select('id, document_type, document_version, document_sha256, typed_signature, consented_at')
    .eq('user_id', userId)
    .order('consented_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({
      consents: [],
      currentDocuments: LEGAL_DOCUMENTS,
    })
  }

  return NextResponse.json({
    consents: data ?? [],
    currentDocuments: LEGAL_DOCUMENTS,
  })
}

export async function POST(req: NextRequest) {
  const csrf = await protectCSRF(req)
  if (!csrf.valid) return csrf.error

  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const rawBody = await req.json().catch(() => null)
  const parsed = PostConsentSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid consent payload' },
      { status: 400 }
    )
  }

  const { documentTypes, typedSignature, flow } = parsed.data
  const consentedAt = new Date().toISOString()
  const admin = supabaseAdmin()

  const result = await recordLegalConsentAudit({
    adminClient: admin,
    userId,
    documentTypes,
    typedSignature: typedSignature ?? null,
    ipAddress: extractRequestIp(req.headers),
    userAgent: req.headers.get('user-agent'),
    consentedAt,
    metadata: {
      flow: flow || 'authenticated_consent_gate',
      ageVerified18Plus: true,
      affirmativeAssent: true,
    },
  })

  return NextResponse.json({
    success: true,
    recorded: result.recorded,
    consentedAt,
    versions: documentTypes.map(t => ({
      type: t,
      version: LEGAL_DOCUMENTS[t].version,
      sha256: LEGAL_DOCUMENTS[t].sha256,
    })),
  })
}

