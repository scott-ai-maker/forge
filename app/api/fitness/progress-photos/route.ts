import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { enforceRateLimit } from '@/lib/rate-limit'
import {
  createSignedFitnessPhotoUrl,
  extractPhotoPathFromLegacyUrl,
  FITNESS_PHOTO_BUCKET,
  isUserOwnedPhotoPath,
  normalizePhotoPath,
} from '@/lib/fitness-photos'
import { checkClientAdultPhotoEligibility } from '@/lib/legal-compliance'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

function isValidIsoCalendarDate(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return false
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return false
  const d = new Date(Date.UTC(year, month - 1, day))
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day
}

function sanitizePhotoNotes(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null
  const cleaned = String(raw)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, 1000)
  return cleaned || null
}

export async function GET(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof AuthzError ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const admin = supabaseAdmin()

  const { data, error } = await admin
    .from('progress_photos')
    .select('id, photo_url, taken_at, notes, created_at')
    .eq('user_id', userId)
    .order('taken_at', { ascending: false })
    .limit(52)

  if (error) {
    return NextResponse.json({ error: 'Failed to load photos' }, { status: 500, headers: NO_STORE_HEADERS })
  }

  const photos = await Promise.all((data ?? []).map(async row => {
    const rawValue = String(row.photo_url ?? '').trim()
    const storedPath = /^https?:\/\//i.test(rawValue)
      ? extractPhotoPathFromLegacyUrl(rawValue)
      : normalizePhotoPath(rawValue)
    const signedUrl =
      storedPath && isUserOwnedPhotoPath(storedPath, userId)
        ? await createSignedFitnessPhotoUrl(admin, storedPath)
        : null

    return {
      ...row,
      photo_url: signedUrl ?? rawValue,
    }
  }))

  return NextResponse.json({ photos }, { headers: NO_STORE_HEADERS })
}

export async function POST(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof AuthzError ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const rl = await enforceRateLimit({
    key: `progress_photos_upload:${userId}`,
    limit: 30,
    windowSeconds: 300,
    route: '/api/fitness/progress-photos',
    dimension: 'user',
  })
  if (!rl.allowed) {
    const retryAfter = Math.max(1, Math.ceil((new Date(rl.resetAt).getTime() - Date.now()) / 1000))
    return NextResponse.json(
      { error: 'Too many progress photo uploads. Please wait before trying again.' },
      { status: 429, headers: { ...NO_STORE_HEADERS, 'Retry-After': String(retryAfter) } }
    )
  }

  const admin = supabaseAdmin()

  const adultEligibility = await checkClientAdultPhotoEligibility(admin, userId)
  if (!adultEligibility.eligible) {
    return NextResponse.json(
      { error: adultEligibility.error || 'Adult age verification (18+) is required before uploading progress photos.' },
      { status: 403, headers: NO_STORE_HEADERS }
    )
  }

  const contentType = req.headers.get('content-type') ?? ''

  let photoValue = ''
  let takenAt = ''
  let notes: string | null = null

  if (contentType.includes('multipart/form-data')) {
    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400, headers: NO_STORE_HEADERS })
    }
    const file = formData.get('photo') as File | null

    if (!file) {
      return NextResponse.json({ error: 'photo is required' }, { status: 400, headers: NO_STORE_HEADERS })
    }

    const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp'])
    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ error: 'Photo must be png, jpeg, or webp' }, { status: 400, headers: NO_STORE_HEADERS })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Photo too large (max 5MB)' }, { status: 400, headers: NO_STORE_HEADERS })
    }

    takenAt = String(formData.get('taken_at') ?? '').trim()
    notes = sanitizePhotoNotes(formData.get('notes'))

    if (!isValidIsoCalendarDate(takenAt)) {
      return NextResponse.json({ error: 'taken_at must be a valid YYYY-MM-DD date' }, { status: 400, headers: NO_STORE_HEADERS })
    }

    const buffer = await file.arrayBuffer()
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const filename = `${userId}/progress-photo-${Date.now()}.${ext}`

    const { error: uploadError } = await admin.storage
      .from(FITNESS_PHOTO_BUCKET)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload progress photo' }, { status: 500, headers: NO_STORE_HEADERS })
    }

    photoValue = filename
  } else {
    let body: Record<string, unknown>
    try {
      const parsed = await req.json()
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400, headers: NO_STORE_HEADERS })
      }
      body = parsed as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400, headers: NO_STORE_HEADERS })
    }
    photoValue = String(body.photo_url ?? '').trim()
    takenAt = String(body.taken_at ?? '').trim()
    notes = sanitizePhotoNotes(body.notes)
  }

  if (!photoValue) {
    return NextResponse.json({ error: 'photo_url is required' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const storedPath = /^https?:\/\//i.test(photoValue)
    ? extractPhotoPathFromLegacyUrl(photoValue)
    : normalizePhotoPath(photoValue)

  if (!storedPath || !isUserOwnedPhotoPath(storedPath, userId)) {
    return NextResponse.json({ error: 'Unauthorized photo path' }, { status: 403, headers: NO_STORE_HEADERS })
  }

  if (!isValidIsoCalendarDate(takenAt)) {
    return NextResponse.json({ error: 'taken_at must be a valid YYYY-MM-DD date' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const { data, error } = await admin
    .from('progress_photos')
    .insert({
      user_id: userId,
      photo_url: storedPath,
      taken_at: takenAt,
      notes,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to save progress photo' }, { status: 500, headers: NO_STORE_HEADERS })
  }

  const signedUrl = isUserOwnedPhotoPath(data.photo_url, userId)
    ? await createSignedFitnessPhotoUrl(admin, data.photo_url)
    : null

  return NextResponse.json(
    { photo: { ...data, photo_url: signedUrl ?? data.photo_url } },
    { status: 201, headers: NO_STORE_HEADERS }
  )
}
