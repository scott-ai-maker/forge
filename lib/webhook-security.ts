import { createHash, createHmac, timingSafeEqual } from 'crypto'

/**
 * Compares two secret strings in constant time without leaking secret length.
 * Hashes both inputs with SHA-256 into fixed 32-byte buffers prior to `timingSafeEqual`.
 */
export function constantTimeSecretMatch(
  provided: string | null | undefined,
  expected: string | null | undefined
): boolean {
  if (typeof provided !== 'string' || typeof expected !== 'string') return false
  const cleanProvided = provided.trim()
  const cleanExpected = expected.trim()
  if (!cleanProvided || !cleanExpected) return false

  const providedDigest = createHash('sha256').update(cleanProvided, 'utf8').digest()
  const expectedDigest = createHash('sha256').update(cleanExpected, 'utf8').digest()
  return timingSafeEqual(providedDigest, expectedDigest)
}

export interface VerifySvixWebhookParams {
  rawBody: string
  headers: Headers
  secret: string | null | undefined
  /** Maximum clock skew / replay window in seconds (default 300s = 5 minutes). */
  toleranceSeconds?: number
  /** Optional legacy static header names accepted ONLY when `secret` is NOT a `whsec_` Svix signing key. */
  legacySecretHeaderNames?: string[]
  nowUnixSeconds?: number
}

/**
 * Verifies Svix-signed webhook payloads (used by Resend and Vital) using HMAC-SHA256
 * over `${svixId}.${svixTimestamp}.${rawBody}` plus replay-window enforcement (#35).
 *
 * Fails closed (`false`) whenever `secret` is missing outside `NODE_ENV === 'test'`.
 */
export function verifySvixWebhookSignature({
  rawBody,
  headers,
  secret,
  toleranceSeconds = 300,
  legacySecretHeaderNames = [],
  nowUnixSeconds = Math.floor(Date.now() / 1000),
}: VerifySvixWebhookParams): boolean {
  const cleanSecret = typeof secret === 'string' ? secret.trim() : ''
  if (!cleanSecret) {
    return process.env.NODE_ENV === 'test'
  }

  const svixId = headers.get('svix-id')?.trim() || headers.get('webhook-id')?.trim()
  const svixTimestamp = headers.get('svix-timestamp')?.trim() || headers.get('webhook-timestamp')?.trim()
  const svixSignature = headers.get('svix-signature')?.trim() || headers.get('webhook-signature')?.trim()

  if (svixId && svixTimestamp && svixSignature) {
    const parsedTs = Number.parseInt(svixTimestamp, 10)
    if (!Number.isFinite(parsedTs)) return false
    if (Math.abs(nowUnixSeconds - parsedTs) > toleranceSeconds) {
      return false
    }

    const secretKeyBytes = cleanSecret.startsWith('whsec_')
      ? Buffer.from(cleanSecret.slice(6), 'base64')
      : Buffer.from(cleanSecret, 'utf8')
    if (secretKeyBytes.length === 0) return false

    const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`
    const expectedBase64 = createHmac('sha256', secretKeyBytes).update(signedContent, 'utf8').digest('base64')

    const candidateSignatures = svixSignature
      .split(/\s+/)
      .map(part => part.trim())
      .filter(part => part.startsWith('v1,'))
      .map(part => part.slice(3))

    return candidateSignatures.some(sig => constantTimeSecretMatch(sig, expectedBase64))
  }

  // If a real Svix `whsec_` signing secret is configured, never downgrade to static header comparison
  if (cleanSecret.startsWith('whsec_')) {
    return false
  }

  // Legacy non-Svix static secret header fallback (constant-time) for non-whsec tokens
  const bearer = headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (bearer && constantTimeSecretMatch(bearer, cleanSecret)) {
    return true
  }
  for (const headerName of legacySecretHeaderNames) {
    const val = headers.get(headerName)?.trim()
    if (val && constantTimeSecretMatch(val, cleanSecret)) {
      return true
    }
  }

  return false
}
