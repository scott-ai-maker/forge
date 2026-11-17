import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import {
  LEGAL_DOCUMENTS,
  type LegalDocumentType,
  extractRequestIp,
  isValidLegalSignature,
  recordLegalConsentAudit,
} from '@/lib/legal-compliance'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

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
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const admin = supabaseAdmin()
  const { data, error } = await admin
    .from('legal_consent_audit_log')
    .select('id, document_type, document_version, document_sha256, typed_signature, consented_at')
    .eq('user_id', userId)
    .order('consented_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json(
      {
        consents: [],
        currentDocuments: LEGAL_DOCUMENTS,
      },
      { headers: NO_STORE_HEADERS }
    )
  }

  return NextResponse.json(
    {
      consents: data ?? [],
      currentDocuments: LEGAL_DOCUMENTS,
    },
    { headers: NO_STORE_HEADERS }
  )
}

export async function POST(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const rawBody = await req.json().catch(() => null)
  const parsed = PostConsentSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid consent payload' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const { documentTypes, typedSignature, flow } = parsed.data
  const uniqueDocTypes = Array.from(new Set(documentTypes))

  if (uniqueDocTypes.includes('athletic_liability_waiver') && !isValidLegalSignature(typedSignature)) {
    return NextResponse.json(
      {
        error:
          'A valid typed full legal name signature is required to execute the Athletic Liability Waiver under ESIGN / M.G.L. c. 110G.',
      },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const consentedAt = new Date().toISOString()
  const admin = supabaseAdmin()

  const result = await recordLegalConsentAudit({
    adminClient: admin,
    userId,
    documentTypes: uniqueDocTypes,
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

  if (result.recorded === 0) {
    return NextResponse.json(
      { error: 'Unable to record legal consent audit entry right now. Please retry.' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }

  return NextResponse.json(
    {
      success: true,
      recorded: result.recorded,
      consentedAt,
      versions: uniqueDocTypes.map(t => ({
        type: t,
        version: LEGAL_DOCUMENTS[t].version,
        sha256: LEGAL_DOCUMENTS[t].sha256,
      })),
    },
    { headers: NO_STORE_HEADERS }
  )
}
