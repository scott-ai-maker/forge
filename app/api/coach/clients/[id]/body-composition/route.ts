import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { analyzeBodyCompositionFromImages } from '@/lib/ai-body-composition-engine'
import { persistBodyCompPhotoToPrivateVault } from '@/lib/fitness-photos'
import { extractRequestIp, recordLegalConsentAudit } from '@/lib/legal-compliance'
import { enforceRateLimit } from '@/lib/rate-limit'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }
const MAX_BODY_COMP_PAYLOAD_BYTES = 15 * 1024 * 1024 // 15 MB

function parseOptionalBounded(
  raw: unknown,
  min: number,
  max: number,
  label: string
): { value: number | undefined; error?: string } {
  if (raw === undefined || raw === null || raw === '') return { value: undefined }
  const num = Number(raw)
  if (!Number.isFinite(num) || num < min || num > max) {
    return { value: undefined, error: `${label} must be between ${min} and ${max}` }
  }
  return { value: num }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let coachId = ''
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach'])
    coachId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof AuthzError ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const { id: clientId } = await params
  const admin = supabaseAdmin()

  try {
    await requireCoachAssignedClient(coachId, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 403
    return NextResponse.json({ error: 'Not authorized for this athlete.' }, { status, headers: NO_STORE_HEADERS })
  }

  const contentLength = Number(req.headers.get('content-length') || 0)
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_COMP_PAYLOAD_BYTES) {
    return NextResponse.json(
      { error: 'Scan payload exceeds 15MB limit.' },
      { status: 413, headers: NO_STORE_HEADERS }
    )
  }

  const rl = await enforceRateLimit({
    key: `coach_body_comp:${coachId}:${clientId}`,
    limit: 20,
    windowSeconds: 300,
    route: '/api/coach/clients/[id]/body-composition',
    dimension: 'user',
  })
  if (!rl.allowed) {
    const retryAfter = Math.max(1, Math.ceil((new Date(rl.resetAt).getTime() - Date.now()) / 1000))
    return NextResponse.json(
      { error: 'Too many body composition scans. Please wait before scanning again.' },
      { status: 429, headers: { ...NO_STORE_HEADERS, 'Retry-After': String(retryAfter) } }
    )
  }

  let rawText = ''
  try {
    rawText = await req.text()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  if (Buffer.byteLength(rawText, 'utf8') > MAX_BODY_COMP_PAYLOAD_BYTES) {
    return NextResponse.json(
      { error: 'Scan payload exceeds 15MB limit.' },
      { status: 413, headers: NO_STORE_HEADERS }
    )
  }

  let body: Record<string, unknown> = {}
  if (rawText.trim()) {
    try {
      const parsed = JSON.parse(rawText)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400, headers: NO_STORE_HEADERS })
      }
      body = parsed as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400, headers: NO_STORE_HEADERS })
    }
  }

  if (body.sex !== undefined && body.sex !== null && body.sex !== '' &&
      body.sex !== 'male' && body.sex !== 'female' && body.sex !== 'other') {
    return NextResponse.json(
      { error: 'sex must be male, female, or other.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const heightParsed = parseOptionalBounded(body.heightCm, 100, 260, 'heightCm')
  const weightParsed = parseOptionalBounded(body.weightKg, 25, 350, 'weightKg')
  const ageParsed = parseOptionalBounded(body.age, 18, 110, 'age')
  const waistParsed = parseOptionalBounded(body.waistCm, 35, 250, 'waistCm')
  const neckParsed = parseOptionalBounded(body.neckCm, 20, 80, 'neckCm')
  const hipParsed = parseOptionalBounded(body.hipCm, 45, 250, 'hipCm')
  const chestParsed = parseOptionalBounded(body.chestCm, 45, 250, 'chestCm')
  const thighParsed = parseOptionalBounded(body.thighCm, 25, 150, 'thighCm')
  const targetBfParsed = parseOptionalBounded(body.targetBodyFatPercent, 4, 55, 'targetBodyFatPercent')

  const validationError =
    heightParsed.error ||
    weightParsed.error ||
    ageParsed.error ||
    waistParsed.error ||
    neckParsed.error ||
    hipParsed.error ||
    chestParsed.error ||
    thighParsed.error ||
    targetBfParsed.error

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400, headers: NO_STORE_HEADERS })
  }

  // Fetch client fitness profile for biometrics
  const [{ data: clientRecord }, { data: profileRecord }] = await Promise.all([
    admin.from('clients').select('full_name, email').eq('id', clientId).maybeSingle(),
    admin.from('fitness_profiles').select('*').eq('user_id', clientId).maybeSingle(),
  ])

  const sex = ((body.sex as string) || profileRecord?.sex || 'male') as 'male' | 'female' | 'other'
  const heightCm = heightParsed.value ?? Number(profileRecord?.height_cm || 178)
  const weightKg = weightParsed.value ?? Number(profileRecord?.weight_kg || 80)
  const age = ageParsed.value ?? Number(profileRecord?.age || 32)
  const rawName = typeof body.clientName === 'string' && body.clientName.trim()
    ? body.clientName
    : clientRecord?.full_name || 'Athlete'
  const clientName = rawName.replace(/[\u0000-\u001F\u007F<>]/g, '').trim().slice(0, 80) || 'Athlete'

  const anteriorPhoto = typeof body.anteriorPhotoBase64 === 'string' ? body.anteriorPhotoBase64 : undefined
  const lateralPhoto = typeof body.lateralPhotoBase64 === 'string' ? body.lateralPhotoBase64 : undefined
  const posteriorPhoto = typeof body.posteriorPhotoBase64 === 'string' ? body.posteriorPhotoBase64 : undefined
  const photoDataUrl = typeof body.photoDataUrl === 'string' ? body.photoDataUrl : undefined

  const hasPhotoPayload = Boolean(
    (anteriorPhoto && anteriorPhoto.trim()) ||
      (lateralPhoto && lateralPhoto.trim()) ||
      (posteriorPhoto && posteriorPhoto.trim()) ||
      (photoDataUrl && photoDataUrl.trim())
  )
  if (
    body.biometricScanConsent === false ||
    (hasPhotoPayload && body.biometricScanConsent !== true)
  ) {
    return NextResponse.json(
      {
        error:
          'Standalone Biometric & Consumer Health Scan Release (IL BIPA 740 ILCS 14/15(b), WA MHMDA RCW 19.373, TX CUBI) is required before analyzing body-composition photographs.',
      },
      { status: 403, headers: NO_STORE_HEADERS }
    )
  }

  if (body.biometricScanConsent === true) {
    await recordLegalConsentAudit({
      adminClient: admin,
      userId: coachId,
      documentTypes: ['consumer_health_biometric_policy'],
      ipAddress: extractRequestIp(req.headers),
      userAgent: req.headers.get('user-agent'),
      metadata: {
        flow: 'coach_body_composition_scan',
        athleteClientId: clientId,
        hasPhotoPayload,
      },
    })
  }

  try {
    const scanResult = await analyzeBodyCompositionFromImages({
      sex,
      heightCm,
      weightKg,
      age,
      waistCm: waistParsed.value ?? profileRecord?.waist_cm,
      neckCm: neckParsed.value ?? profileRecord?.neck_cm,
      hipCm: hipParsed.value ?? profileRecord?.hip_cm,
      chestCm: chestParsed.value,
      thighCm: thighParsed.value,
      anteriorPhotoBase64: anteriorPhoto || photoDataUrl,
      lateralPhotoBase64: lateralPhoto,
      posteriorPhotoBase64: posteriorPhoto,
      photoDataUrl,
      clientName,
      targetBodyFatPercent: targetBfParsed.value ?? profileRecord?.target_bodyfat_percent,
    })

    // Optionally save to database only if scan is compliant and not rejected
    if (body.saveRecord !== false && !scanResult.isRejected) {
      const vaultPhotoPath = await persistBodyCompPhotoToPrivateVault(
        admin,
        clientId,
        photoDataUrl ?? anteriorPhoto ?? null
      )
      await admin.from('body_composition_analyses').insert({
        user_id: clientId,
        photo_data_url: vaultPhotoPath,
        estimated_bodyfat_percent: scanResult.estimatedBodyFatPercent,
        method: scanResult.methodDescription,
        confidence_score: scanResult.confidenceScore,
      })
    }

    return NextResponse.json(
      {
        ok: true,
        data: scanResult,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch {
    return NextResponse.json(
      { error: 'Body composition scan failed.' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}

