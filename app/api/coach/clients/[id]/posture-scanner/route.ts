import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getRequestAuthz, requireRole, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import {
  analyzePosturalMesh,
  sanitizeAthleteFirstName,
} from '@/lib/ai-postural-mesh-scanner'
import {
  checkSlidingWindowRateLimit,
  resolveRequestSubjectKey,
} from '@/src/lib/security/rateLimiter'

const MAX_IMAGE_BASE64_CHARS = 8_000_000
const BASE64_IMAGE_PATTERN =
  /^(?:data:image\/(?:jpeg|jpg|png|webp);base64,)?[A-Za-z0-9+/=\r\n]+$/

const PostureScannerRequestSchema = z.object({
  imageBase64: z.string().optional(),
  view: z.enum(['anterior', 'lateral', 'posterior', 'overhead_squat']).default('anterior'),
  clientName: z.string().max(120).optional(),
})

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
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
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const rateKey = resolveRequestSubjectKey(req, coachId)
  const rate = checkSlidingWindowRateLimit({
    namespace: 'posture-scanner',
    subjectKey: rateKey,
    maxRequests: 24,
    windowMs: 10 * 60 * 1000,
  })
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many posture scan requests. Please wait before scanning again.' },
      {
        status: 429,
        headers: {
          ...NO_STORE_HEADERS,
          'Retry-After': String(rate.retryAfterSeconds),
        },
      }
    )
  }

  const { id: clientId } = await params
  if (!clientId || clientId.length > 128) {
    return NextResponse.json(
      { error: 'Invalid athlete identifier.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const rawBody = await req.json().catch(() => null)
  const parsedBody = PostureScannerRequestSchema.safeParse(rawBody ?? {})
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: 'Invalid posture scan payload or view orientation.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const { imageBase64, view, clientName: bodyClientName } = parsedBody.data
  if (imageBase64 !== undefined) {
    if (imageBase64.length > MAX_IMAGE_BASE64_CHARS) {
      return NextResponse.json(
        { error: 'Posture photo exceeds maximum permitted payload size (6 MB).' },
        { status: 413, headers: NO_STORE_HEADERS }
      )
    }
    if (imageBase64.length > 0 && !BASE64_IMAGE_PATTERN.test(imageBase64)) {
      return NextResponse.json(
        { error: 'Unsupported posture image encoding. Provide JPEG, PNG, or WebP base64 data.' },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }
  }

  const admin = supabaseAdmin()

  try {
    await requireCoachAssignedClient(coachId, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 403
    return NextResponse.json(
      { error: 'Not authorized for this athlete.' },
      { status, headers: NO_STORE_HEADERS }
    )
  }

  const { data: clientRecord } = await admin
    .from('clients')
    .select('full_name')
    .eq('id', clientId)
    .maybeSingle()

  // HIPAA Minimum Necessary: never pass full surname or email to external AI providers
  const clientName = sanitizeAthleteFirstName(
    bodyClientName || clientRecord?.full_name || 'Athlete'
  )

  try {
    const scanResult = await analyzePosturalMesh({
      imageBase64,
      view,
      clientName,
    })

    return NextResponse.json(
      {
        ok: true,
        data: scanResult,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (err: unknown) {
    const errObj = err as { message?: string }
    return NextResponse.json(
      { error: errObj?.message || 'Postural mesh analysis failed.' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}

