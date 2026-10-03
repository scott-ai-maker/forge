import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { generatePredictionImage, uploadInitImageFromBuffer } from '@/lib/leonardo'
import { protectCSRF } from '@/lib/csrf'
import {
  createSignedFitnessPhotoUrl,
  extractPhotoPathFromLegacyUrl,
  FITNESS_PHOTO_BUCKET,
  normalizePhotoPath,
} from '@/lib/fitness-photos'
import {
  enforceRateLimit,
  getClientIp,
  getPositiveIntEnv,
} from '@/lib/rate-limit'

function retryAfterSeconds(resetAt: string) {
  const ms = new Date(resetAt).getTime() - Date.now()
  return Math.max(1, Math.ceil(ms / 1000))
}

export async function POST(req: NextRequest) {
  const csrf = await protectCSRF(req)
  if (!csrf.valid) return csrf.error

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userLimit = getPositiveIntEnv('RATE_LIMIT_PREDICT_LOOK_USER_LIMIT', 5)
  const userWindowSeconds = getPositiveIntEnv('RATE_LIMIT_PREDICT_LOOK_USER_WINDOW_SECONDS', 60 * 60)
  const ipLimit = getPositiveIntEnv('RATE_LIMIT_PREDICT_LOOK_IP_LIMIT', 10)
  const ipWindowSeconds = getPositiveIntEnv('RATE_LIMIT_PREDICT_LOOK_IP_WINDOW_SECONDS', 60 * 60)

  const ip = getClientIp(req)
  const ipResult = await enforceRateLimit({
    key: `predict_look:ip:${ip}`,
    limit: ipLimit,
    windowSeconds: ipWindowSeconds,
    route: '/api/fitness/predict-look',
    dimension: 'ip',
  })

  if (!ipResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSeconds(ipResult.resetAt)),
        },
      }
    )
  }

  const userResult = await enforceRateLimit({
    key: `predict_look:user:${user.id}`,
    limit: userLimit,
    windowSeconds: userWindowSeconds,
    route: '/api/fitness/predict-look',
    dimension: 'user',
  })

  if (!userResult.allowed) {
    return NextResponse.json(
      { error: 'Prediction limit reached for this hour. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSeconds(userResult.resetAt)),
        },
      }
    )
  }

  // Fetch user profile for context
  const { data: profile, error: profileError } = await supabaseAdmin()
    .from('fitness_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 400 })
  }

  const body = await req.json()
  const { targetBodyfatPercent, fitnessGoal, notes } = body ?? {}

  if (!targetBodyfatPercent || !fitnessGoal) {
    return NextResponse.json({ error: 'targetBodyfatPercent and fitnessGoal are required' }, { status: 400 })
  }

  const goalDescriptions = {
    'fat-loss': 'lean defined musculature, visible abdominal tone, natural athletic proportions',
    'muscle-gain': 'noticeable lean muscle gain, stronger shoulders and arms, natural athletic look',
    'performance': 'functional athletic build, balanced musculature, agile and powerful appearance',
    'general-fitness': 'fit healthy physique with good muscle tone and low body fat',
  } as const

  const goalDescription =
    typeof fitnessGoal === 'string' && fitnessGoal in goalDescriptions
      ? goalDescriptions[fitnessGoal as keyof typeof goalDescriptions]
      : 'athletic fit physique'

  const ageContext = profile.age ? `${profile.age} year old` : 'fit'
  const sexContext = profile.sex === 'male' ? 'man' : profile.sex === 'female' ? 'woman' : 'person'
  const bodyContext = profile.weight_kg && profile.height_cm ? `${Math.round(profile.height_cm)}cm tall` : ''

  const rawNotes = typeof notes === 'string' ? notes.trim().slice(0, 200) : ''
  const sanitizedNotes = rawNotes.replace(/[^\w\s.,!?-]/g, '')

  // When we have a before photo, use img2img — prompt describes ONLY the target physique
  // (no "transformation" or "before/after" language, which causes compositing)
  const prompt = [
    `Professional fitness photography of a ${ageContext} ${sexContext}${bodyContext ? `, ${bodyContext}` : ''}.`,
    `${goalDescription}.`,
    `${targetBodyfatPercent}% body fat.`,
    'Exactly one person in frame, single subject only.',
    'Preserve the same person identity, face structure, skin tone, and body frame from the source photo.',
    'Natural realistic human anatomy, no exaggerated bodybuilding proportions.',
    'Studio-quality photograph with professional lighting.',
    'Wearing dark athletic wear.',
    'Natural human features, realistic skin tone, confident posture.',
    'Sharp focus, clean neutral background.',
    sanitizedNotes ? `Context: ${sanitizedNotes}.` : '',
  ]
    .filter(Boolean)
    .join(' ')

  try {
    // Upload before photo to Leonardo as init image if available (enables img2img)
    let initImageId: string | undefined
    const beforePhotoPath = normalizePhotoPath(
      (profile as { before_photo_path?: string }).before_photo_path
        ?? extractPhotoPathFromLegacyUrl((profile as { before_photo_url?: string }).before_photo_url)
    )

    if (beforePhotoPath) {
      try {
        const { data: storageBlob, error: downloadError } = await supabaseAdmin()
          .storage
          .from(FITNESS_PHOTO_BUCKET)
          .download(beforePhotoPath)

        if (downloadError || !storageBlob) {
          throw new Error(downloadError?.message ?? 'Missing before photo blob')
        }

        const contentType = storageBlob.type || 'image/jpeg'
        const imageBuffer = await storageBlob.arrayBuffer()
        initImageId = await uploadInitImageFromBuffer(imageBuffer, contentType)
      } catch (uploadErr) {
        // Non-fatal: fall back to txt2img if upload fails
        console.error('Init image upload failed, falling back to txt2img:', uploadErr)
      }
    }

    const imageUrl = await generatePredictionImage(prompt, initImageId)
    const beforePhotoUrl = await createSignedFitnessPhotoUrl(supabase, beforePhotoPath)
    return NextResponse.json({ 
      imageUrl, 
      prompt,
      beforePhotoUrl,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate prediction image'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
