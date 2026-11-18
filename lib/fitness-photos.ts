import { randomUUID } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export const FITNESS_PHOTO_BUCKET = 'fitness-photos'
export const FITNESS_PHOTO_SIGNED_URL_TTL_SECONDS = 60 * 60

export function normalizePhotoPath(path: string | null | undefined): string {
  const raw = String(path ?? '').trim()
  if (!raw) return ''

  // Reject control chars, backslashes, URL query/hash fragments, and any percent-encoded tokens
  if (/[\u0000-\u001F\u007F\\?#%]/.test(raw)) {
    return ''
  }

  const trimmed = raw.replace(/^\/+/, '')
  if (!trimmed) return ''

  const segments = trimmed.split('/')
  if (segments.some(seg => !seg || seg === '.' || seg === '..')) {
    return ''
  }

  return segments.join('/')
}

export function isUserOwnedPhotoPath(
  path: string | null | undefined,
  userId: string | null | undefined
): boolean {
  const cleanUserId = String(userId ?? '').trim()
  if (!cleanUserId || cleanUserId.includes('/') || cleanUserId.includes('\\') || cleanUserId === '.' || cleanUserId === '..') {
    return false
  }

  const normalized = normalizePhotoPath(path)
  if (!normalized) return false

  const segments = normalized.split('/')
  if (segments.length !== 2) return false
  if (segments[0] !== cleanUserId) return false

  return /^[a-zA-Z0-9._-]+$/.test(segments[1])
}

export function extractPhotoPathFromLegacyUrl(input: string | null | undefined) {
  const raw = String(input ?? '').trim()
  if (!raw) return null

  // Reject raw or percent-encoded traversal tokens before WHATWG URL collapses dot-segments
  const withoutQuery = raw.split(/[?#]/)[0] ?? ''
  if (/(?:^|[\\/])\.\.(?:[\\/]|$)|%2e|%25|%2f|%5c|\\/i.test(withoutQuery)) {
    return null
  }

  try {
    const url = new URL(raw)
    const markers = [
      `/storage/v1/object/public/${FITNESS_PHOTO_BUCKET}/`,
      `/storage/v1/object/authenticated/${FITNESS_PHOTO_BUCKET}/`,
      `/storage/v1/object/sign/${FITNESS_PHOTO_BUCKET}/`,
    ]

    const matched = markers.find(marker => url.pathname.includes(marker))
    if (!matched) return null

    const idx = url.pathname.indexOf(matched)
    if (idx < 0) return null

    const pathPart = url.pathname.slice(idx + matched.length)
    const decoded = decodeURIComponent(pathPart)
    const normalized = normalizePhotoPath(decoded)
    return normalized || null
  } catch {
    return null
  }
}

export async function createSignedFitnessPhotoUrl(
  supabase: SupabaseClient,
  path: string | null | undefined
) {
  const normalized = normalizePhotoPath(path)
  if (!normalized) return null

  const { data, error } = await supabase.storage
    .from(FITNESS_PHOTO_BUCKET)
    .createSignedUrl(normalized, FITNESS_PHOTO_SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) {
    return null
  }

  return data.signedUrl
}

export async function createSignedFitnessPhotoUrlsBatch(
  supabase: SupabaseClient,
  paths: (string | null | undefined)[]
): Promise<(string | null)[]> {
  const normalizedList = paths.map(p => normalizePhotoPath(p))
  const uniqueValidPaths = Array.from(new Set(normalizedList.filter(Boolean) as string[]))

  if (uniqueValidPaths.length === 0) {
    return paths.map(() => null)
  }

  const { data, error } = await supabase.storage
    .from(FITNESS_PHOTO_BUCKET)
    .createSignedUrls(uniqueValidPaths, FITNESS_PHOTO_SIGNED_URL_TTL_SECONDS)

  if (error || !data) {
    return paths.map(() => null)
  }

  const urlMap = new Map<string, string>()
  for (const item of data) {
    if (item?.signedUrl && item?.path) {
      urlMap.set(item.path, item.signedUrl)
    }
  }

  return normalizedList.map(p => (p ? urlMap.get(p) ?? null : null))
}

const MAX_VAULT_PHOTO_BYTES = 15 * 1024 * 1024

type MinimalStorageUploadClient = {
  storage?: {
    from: (bucket: string) => {
      upload: (
        path: string,
        body: Buffer,
        options: { contentType: string; upsert: boolean }
      ) => Promise<{ data?: { path?: string } | null; error?: unknown }>
    }
  }
}

/**
 * Ensures body-composition reference images are NEVER persisted as raw inline
 * `data:image/...;base64` blobs inside PostgreSQL (`body_composition_analyses.photo_data_url`).
 * Uploads decoded image bytes into the private RLS-protected `fitness-photos` bucket
 * under `${userId}/bodycomp-...` and returns ONLY the private object path (or `null`).
 */
export async function persistBodyCompPhotoToPrivateVault(
  supabase: MinimalStorageUploadClient | SupabaseClient | null | undefined,
  userId: string | null | undefined,
  rawPhotoDataUrlOrPath: string | null | undefined
): Promise<string | null> {
  const cleanUserId = String(userId ?? '').trim()
  if (
    !cleanUserId ||
    cleanUserId.includes('/') ||
    cleanUserId.includes('\\') ||
    cleanUserId === '.' ||
    cleanUserId === '..'
  ) {
    return null
  }

  const raw = String(rawPhotoDataUrlOrPath ?? '').trim()
  if (!raw) return null

  if (isUserOwnedPhotoPath(raw, cleanUserId)) {
    return normalizePhotoPath(raw) || null
  }

  const legacyPath = extractPhotoPathFromLegacyUrl(raw)
  if (legacyPath && isUserOwnedPhotoPath(legacyPath, cleanUserId)) {
    return legacyPath
  }

  const dataUriMatch = raw.match(
    /^data:image\/(jpeg|jpg|png|webp)(?:;charset=[^;,]+)?;base64,([A-Za-z0-9+/=\r\n\s]+)$/i
  )
  if (!dataUriMatch) {
    return null
  }

  const rawSubtype = dataUriMatch[1].toLowerCase()
  const ext = rawSubtype === 'jpg' ? 'jpeg' : rawSubtype
  const fileExt = ext === 'jpeg' ? 'jpg' : ext
  const contentType = `image/${ext}`
  const base64Clean = dataUriMatch[2].replace(/\s+/g, '')
  if (!base64Clean) return null

  const bytes = Buffer.from(base64Clean, 'base64')
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_VAULT_PHOTO_BYTES) {
    return null
  }

  if (!supabase?.storage || typeof supabase.storage.from !== 'function') {
    return null
  }

  const objectPath = `${cleanUserId}/bodycomp-${Date.now()}-${randomUUID().slice(0, 8)}.${fileExt}`
  try {
    const bucketClient = supabase.storage.from(FITNESS_PHOTO_BUCKET)
    if (!bucketClient || typeof bucketClient.upload !== 'function') {
      return null
    }
    const { error } = await bucketClient.upload(objectPath, bytes, {
      contentType,
      upsert: false,
    })
    if (error) {
      return null
    }
    return objectPath
  } catch {
    return null
  }
}
