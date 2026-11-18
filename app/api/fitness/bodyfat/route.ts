import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { analyzeBodyCompositionFromImages } from '@/lib/ai-body-composition-engine'
import { persistBodyCompPhotoToPrivateVault } from '@/lib/fitness-photos'
import { extractRequestIp, recordLegalConsentAudit } from '@/lib/legal-compliance'
import { protectCSRF } from '@/lib/csrf'
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }
const MAX_BODYFAT_PAYLOAD_BYTES = 15 * 1024 * 1024 // 15 MB for up to 3 base64 scan views

function parseOptionalBoundedNumber(
  raw: unknown,
  min: number,
  max: number,
  label: string
): { value: number | undefined; error?: string } {
  if (raw === undefined || raw === null || raw === '') {
    return { value: undefined }
  }
  const num = Number(raw)
  if (!Number.isFinite(num) || num < min || num > max) {
    return { value: undefined, error: `${label} must be between ${min} and ${max}` }
  }
  return { value: num }
}

export async function POST(req: NextRequest) {
  const csrf = await protectCSRF(req)
  if (!csrf.valid) return csrf.error

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isDev = process.env.NODE_ENV !== 'production'
  const allowAnonPreview = process.env.NEXT_PUBLIC_ALLOW_ANON_PREVIEW === 'true'
  const isTestHarness =
    isDev && allowAnonPreview && Boolean(req.headers.get('referer')?.includes('/test-harness/'))

  if (!user && !isTestHarness) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
  }

  const contentLength = Number(req.headers.get('content-length') || 0)
  if (Number.isFinite(contentLength) && contentLength > MAX_BODYFAT_PAYLOAD_BYTES) {
    return NextResponse.json(
      { error: 'Scan payload exceeds 15MB limit' },
      { status: 413, headers: NO_STORE_HEADERS }
    )
  }

  const ip = getClientIp(req)
  const rl = await enforceRateLimit({
    key: `fitness_bodyfat:${user?.id ?? ip}`,
    limit: 20,
    windowSeconds: 300,
    route: '/api/fitness/bodyfat',
    dimension: user ? 'user' : 'ip',
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
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  if (Buffer.byteLength(rawText, 'utf8') > MAX_BODYFAT_PAYLOAD_BYTES) {
    return NextResponse.json(
      { error: 'Scan payload exceeds 15MB limit' },
      { status: 413, headers: NO_STORE_HEADERS }
    )
  }

  let body: Record<string, unknown> = {}
  if (rawText.trim()) {
    try {
      const parsed = JSON.parse(rawText)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400, headers: NO_STORE_HEADERS })
      }
      body = parsed as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400, headers: NO_STORE_HEADERS })
    }
  }

  if (body.sex === undefined || body.sex === null || body.sex === '' ||
      body.heightCm === undefined || body.heightCm === null || body.heightCm === '' ||
      body.weightKg === undefined || body.weightKg === null || body.weightKg === '') {
    return NextResponse.json(
      { error: 'sex, heightCm, and weightKg are required' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  if (body.sex !== 'male' && body.sex !== 'female' && body.sex !== 'other') {
    return NextResponse.json(
      { error: 'sex must be male, female, or other' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const heightCm = Number(body.heightCm)
  if (!Number.isFinite(heightCm) || heightCm < 100 || heightCm > 260) {
    return NextResponse.json(
      { error: 'heightCm must be between 100 and 260' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const weightKg = Number(body.weightKg)
  if (!Number.isFinite(weightKg) || weightKg < 25 || weightKg > 350) {
    return NextResponse.json(
      { error: 'weightKg must be between 25 and 350' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const ageParsed = parseOptionalBoundedNumber(body.age, 18, 110, 'age')
  const waistParsed = parseOptionalBoundedNumber(body.waistCm, 35, 250, 'waistCm')
  const neckParsed = parseOptionalBoundedNumber(body.neckCm, 20, 80, 'neckCm')
  const hipParsed = parseOptionalBoundedNumber(body.hipCm, 45, 250, 'hipCm')
  const chestParsed = parseOptionalBoundedNumber(body.chestCm, 45, 250, 'chestCm')
  const thighParsed = parseOptionalBoundedNumber(body.thighCm, 25, 150, 'thighCm')
  const targetBfParsed = parseOptionalBoundedNumber(body.targetBodyFatPercent, 4, 55, 'targetBodyFatPercent')

  const firstValidationError =
    ageParsed.error ||
    waistParsed.error ||
    neckParsed.error ||
    hipParsed.error ||
    chestParsed.error ||
    thighParsed.error ||
    targetBfParsed.error

  if (firstValidationError) {
    return NextResponse.json({ error: firstValidationError }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const sanitizedClientName =
    typeof body.clientName === 'string'
      ? body.clientName.replace(/[\u0000-\u001F\u007F<>]/g, '').trim().slice(0, 80) || undefined
      : undefined

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

  if (user && body.biometricScanConsent === true) {
    await recordLegalConsentAudit({
      adminClient: supabaseAdmin(),
      userId: user.id,
      documentTypes: ['consumer_health_biometric_policy'],
      ipAddress: extractRequestIp(req.headers),
      userAgent: req.headers.get('user-agent'),
      metadata: {
        flow: 'athlete_body_composition_scan',
        hasPhotoPayload,
      },
    })
  }

  const scanResult = await analyzeBodyCompositionFromImages({
    sex: body.sex,
    heightCm,
    weightKg,
    age: ageParsed.value,
    waistCm: waistParsed.value,
    neckCm: neckParsed.value,
    hipCm: hipParsed.value,
    chestCm: chestParsed.value,
    thighCm: thighParsed.value,
    anteriorPhotoBase64: anteriorPhoto || photoDataUrl,
    lateralPhotoBase64: lateralPhoto,
    posteriorPhotoBase64: posteriorPhoto,
    photoDataUrl,
    clientName: sanitizedClientName,
    targetBodyFatPercent: targetBfParsed.value,
  })

  let insertedData: Record<string, unknown> = {}
  if (user && !scanResult.isRejected) {
    const admin = supabaseAdmin()
    const vaultPhotoPath = await persistBodyCompPhotoToPrivateVault(
      admin,
      user.id,
      photoDataUrl ?? anteriorPhoto ?? null
    )
    const { data, error } = await admin
      .from('body_composition_analyses')
      .insert({
        user_id: user.id,
        photo_data_url: vaultPhotoPath,
        estimated_bodyfat_percent: scanResult.estimatedBodyFatPercent,
        method: scanResult.methodDescription,
        confidence_score: scanResult.confidenceScore,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save body composition analysis.' },
        { status: 500, headers: NO_STORE_HEADERS }
      )
    }
    insertedData = (data as Record<string, unknown>) || {}
  }

  return NextResponse.json(
    {
      analysis: {
        ...insertedData,
        estimated_bodyfat_percent: scanResult.estimatedBodyFatPercent,
        scan_result: scanResult,
        is_rejected: scanResult.isRejected ?? false,
        rejection_reason: scanResult.rejectionReason ?? null,
      },
      scanResult,
      isRejected: scanResult.isRejected ?? false,
      rejectionReason: scanResult.rejectionReason ?? null,
    },
    { headers: NO_STORE_HEADERS }
  )
}
