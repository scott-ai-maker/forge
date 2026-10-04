// Normalizes common US/Canada formats (and explicit +country numbers) to E.164; returns null when it cannot be a valid number.
export function toE164(input: string | null | undefined): string | null {
  if (!input) return null
  const trimmed = input.trim()
  const digits = trimmed.replace(/\D/g, '')
  if (trimmed.startsWith('+')) {
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null
  }
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}
