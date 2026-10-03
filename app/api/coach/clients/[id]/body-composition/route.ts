import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { analyzeBodyCompositionFromImages } from '@/lib/ai-body-composition-engine'

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
    return NextResponse.json({ error: message }, { status })
  }

  const { id: clientId } = await params
  const body = await req.json().catch(() => ({}))

  const admin = supabaseAdmin()

  try {
    await requireCoachAssignedClient(coachId, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 403
    return NextResponse.json({ error: 'Not authorized for this athlete.' }, { status })
  }

  // Fetch client fitness profile for biometrics
  const [{ data: clientRecord }, { data: profileRecord }] = await Promise.all([
    admin.from('clients').select('full_name, email').eq('id', clientId).maybeSingle(),
    admin.from('fitness_profiles').select('*').eq('user_id', clientId).maybeSingle(),
  ])

  const sex = (body.sex || profileRecord?.sex || 'male') as 'male' | 'female' | 'other'
  const heightCm = Number(body.heightCm || profileRecord?.height_cm || 178)
  const weightKg = Number(body.weightKg || profileRecord?.weight_kg || 80)
  const age = Number(body.age || profileRecord?.age || 32)
  const clientName = body.clientName || clientRecord?.full_name || 'Athlete'

  try {
    const scanResult = await analyzeBodyCompositionFromImages({
      sex,
      heightCm,
      weightKg,
      age,
      waistCm: body.waistCm ? Number(body.waistCm) : profileRecord?.waist_cm,
      neckCm: body.neckCm ? Number(body.neckCm) : profileRecord?.neck_cm,
      hipCm: body.hipCm ? Number(body.hipCm) : profileRecord?.hip_cm,
      chestCm: body.chestCm ? Number(body.chestCm) : undefined,
      thighCm: body.thighCm ? Number(body.thighCm) : undefined,
      anteriorPhotoBase64: body.anteriorPhotoBase64 || body.photoDataUrl,
      lateralPhotoBase64: body.lateralPhotoBase64,
      posteriorPhotoBase64: body.posteriorPhotoBase64,
      photoDataUrl: body.photoDataUrl,
      clientName,
      targetBodyFatPercent: body.targetBodyFatPercent ? Number(body.targetBodyFatPercent) : profileRecord?.target_bodyfat_percent,
    })

    // Optionally save to database
    if (body.saveRecord !== false) {
      await admin.from('body_composition_analyses').insert({
        user_id: clientId,
        photo_data_url: body.photoDataUrl ?? body.anteriorPhotoBase64 ?? null,
        estimated_bodyfat_percent: scanResult.estimatedBodyFatPercent,
        method: scanResult.methodDescription,
        confidence_score: scanResult.confidenceScore,
      })
    }

    return NextResponse.json({
      ok: true,
      data: scanResult,
    })
  } catch (err: unknown) {
    const errObj = err as { message?: string }
    return NextResponse.json(
      { error: errObj?.message || 'Body composition scan failed.' },
      { status: 500 }
    )
  }
}

