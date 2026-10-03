const GENERAL_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Checks whether a value is a valid 36-character hexadecimal UUID string.
 */
export function isValidUuid(val: unknown): boolean {
  if (typeof val !== 'string') return false
  return GENERAL_UUID_REGEX.test(val.trim())
}

/**
 * Returns a trimmed valid UUID string, or null if the value is missing or invalid.
 * Prevents PostgreSQL 'invalid input syntax for type uuid' 500 errors.
 */
export function toValidUuidOrNull(val: unknown): string | null {
  if (typeof val !== 'string') return null
  const trimmed = val.trim()
  return GENERAL_UUID_REGEX.test(trimmed) ? trimmed : null
}
