import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { analyzeBodyCompositionFromImages } from '@/lib/ai-body-composition-engine'
import { protectCSRF } from '@/lib/csrf'

export async function POST(req: NextRequest) {
  const csrf = await protectCSRF(req)
  if (!csrf.valid) return csrf.error

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))

  if (!body.sex || !body.heightCm || !body.weightKg) {
    return NextResponse.json({ error: 'sex, heightCm, and weightKg are required' }, { status: 400 })
  }

  const scanResult = await analyzeBodyCompositionFromImages({
    sex: body.sex,
    heightCm: Number(body.heightCm),
    weightKg: Number(body.weightKg),
    age: body.age ? Number(body.age) : undefined,
    waistCm: body.waistCm ? Number(body.waistCm) : undefined,
    neckCm: body.neckCm ? Number(body.neckCm) : undefined,
    hipCm: body.hipCm ? Number(body.hipCm) : undefined,
    chestCm: body.chestCm ? Number(body.chestCm) : undefined,
    thighCm: body.thighCm ? Number(body.thighCm) : undefined,
    anteriorPhotoBase64: body.anteriorPhotoBase64 || body.photoDataUrl,
    lateralPhotoBase64: body.lateralPhotoBase64,
    posteriorPhotoBase64: body.posteriorPhotoBase64,
    photoDataUrl: body.photoDataUrl,
    clientName: body.clientName,
    targetBodyFatPercent: body.targetBodyFatPercent ? Number(body.targetBodyFatPercent) : undefined,
  })

  const { data, error } = await supabaseAdmin()
    .from('body_composition_analyses')
    .insert({
      user_id: user.id,
      photo_data_url: body.photoDataUrl ?? body.anteriorPhotoBase64 ?? null,
      estimated_bodyfat_percent: scanResult.estimatedBodyFatPercent,
      method: scanResult.methodDescription,
      confidence_score: scanResult.confidenceScore,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    analysis: {
      ...data,
      scan_result: scanResult,
    },
    scanResult,
  })
}
