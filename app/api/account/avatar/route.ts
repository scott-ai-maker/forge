import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { enforceRateLimit } from '@/lib/rate-limit'
import {
  createSignedFitnessPhotoUrl,
  detectSafeImageMimeFromBytes,
  FITNESS_PHOTO_BUCKET,
  isUserOwnedPhotoPath,
} from '@/lib/fitness-photos'

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const MAX_FILE_BYTES = 5 * 1024 * 1024
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

export async function GET(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const admin = supabaseAdmin()

  const { data: existing, error } = await admin
    .from('clients')
    .select('avatar_path')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const safeAvatarPath = isUserOwnedPhotoPath(existing?.avatar_path ?? null, userId)
    ? existing!.avatar_path
    : null
  const avatarUrl = await createSignedFitnessPhotoUrl(admin, safeAvatarPath)
  return NextResponse.json({ avatarUrl })
}

export async function POST(req: NextRequest) {
  let userId = ''

  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const admin = supabaseAdmin()

  const rl = await enforceRateLimit({
    key: `account_avatar:${userId}`,
    limit: 20,
    windowSeconds: 300,
    route: '/api/account/avatar',
    dimension: 'user',
  })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many avatar updates. Please wait before trying again.' },
      { status: 429, headers: NO_STORE_HEADERS }
    )
  }

  try {
    const formData = await req.formData()
    const file = formData.get('avatar') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No avatar provided.' }, { status: 400, headers: NO_STORE_HEADERS })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Avatar must be PNG, JPEG, or WebP.' }, { status: 400, headers: NO_STORE_HEADERS })
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'Avatar must be 5MB or smaller.' }, { status: 400, headers: NO_STORE_HEADERS })
    }

    const buffer = await file.arrayBuffer()
    const verifiedMime = detectSafeImageMimeFromBytes(buffer)
    if (!verifiedMime) {
      return NextResponse.json(
        { error: 'Avatar contents do not match a valid PNG, JPEG, or WebP image.' },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }

    const ext = verifiedMime === 'image/png' ? 'png' : verifiedMime === 'image/webp' ? 'webp' : 'jpg'
    const filename = `${userId}/account-avatar-${Date.now()}.${ext}`

    const { data: existing } = await admin
      .from('clients')
      .select('avatar_path')
      .eq('id', userId)
      .maybeSingle()

    if (existing?.avatar_path && isUserOwnedPhotoPath(existing.avatar_path, userId)) {
      await admin.storage.from(FITNESS_PHOTO_BUCKET).remove([existing.avatar_path])
    }

    const { data: files } = await admin.storage.from(FITNESS_PHOTO_BUCKET).list(userId)
    if (files && files.length > 0) {
      const staleFiles = files
        .filter(fileEntry => fileEntry.name.startsWith('account-avatar-'))
        .map(fileEntry => `${userId}/${fileEntry.name}`)

      if (staleFiles.length > 0) {
        await admin.storage.from(FITNESS_PHOTO_BUCKET).remove(staleFiles)
      }
    }

    const { error: uploadError } = await admin.storage
      .from(FITNESS_PHOTO_BUCKET)
      .upload(filename, buffer, {
        contentType: verifiedMime,
        upsert: false,
      })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const { error: updateError } = await admin
      .from('clients')
      .update({ avatar_path: filename })
      .eq('id', userId)

    if (updateError) {
      throw new Error(updateError.message)
    }

    const avatarUrl = await createSignedFitnessPhotoUrl(admin, filename)

    return NextResponse.json({ avatarUrl }, { headers: NO_STORE_HEADERS })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Avatar upload failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  let userId = ''

  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const admin = supabaseAdmin()

  const { data: existing, error } = await admin
    .from('clients')
    .select('avatar_path')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (existing?.avatar_path && isUserOwnedPhotoPath(existing.avatar_path, userId)) {
    await admin.storage.from(FITNESS_PHOTO_BUCKET).remove([existing.avatar_path])
  }

  const { error: updateError } = await admin
    .from('clients')
    .update({ avatar_path: null })
    .eq('id', userId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ avatarUrl: null })
}
