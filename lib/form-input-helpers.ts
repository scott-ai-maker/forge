import type React from 'react'

export interface NumericSanitizeOptions {
  allowDecimals?: boolean
  allowNegative?: boolean
  maxDecimals?: number
}

/**
 * Automatically highlights/selects all text in an input on focus/click/tap.
 * This ensures that typing immediately replaces any existing number or placeholder,
 * preventing annoying '05' or accidental appending.
 */
export function selectOnFocus(event: React.FocusEvent<HTMLInputElement>): void {
  event.target.select()
}

/**
 * Sanitizes numeric input strings in real time:
 * 1. Strips unwanted leading zeros before another digit (e.g. '05' -> '5', '0135' -> '135').
 * 2. Preserves valid single zero ('0'), decimal starts ('0.', '0.5'), and empty states ('').
 * 3. Restricts non-numeric characters and enforces single decimal points.
 * 4. Respects negative values if configured.
 */
export function sanitizeNumericInput(
  value: string | number | null | undefined,
  options: NumericSanitizeOptions = {}
): string {
  if (value === null || value === undefined) return ''

  const { allowDecimals = true, allowNegative = false, maxDecimals } = options
  let str = String(value).trim()

  if (str === '') return ''

  const isNegative = allowNegative && str.startsWith('-')
  if (isNegative) {
    str = str.slice(1)
  }

  if (allowDecimals) {
    const parts = str.split('.')
    const integerRaw = parts[0].replace(/\D/g, '')
    if (parts.length > 1) {
      let decimalRaw = parts.slice(1).join('').replace(/\D/g, '')
      if (typeof maxDecimals === 'number' && maxDecimals >= 0) {
        decimalRaw = decimalRaw.slice(0, maxDecimals)
      }
      str = `${integerRaw}.${decimalRaw}`
    } else {
      str = integerRaw
    }
  } else {
    str = str.replace(/\D/g, '')
  }

  if (str === '') {
    return isNegative ? '-' : ''
  }

  // Strip redundant leading zeros before other digits:
  // e.g. "05" -> "5", "007" -> "7", "00" -> "0"
  // Keep "0" if single zero.
  // Keep "0." or "0.X" if decimal.
  if (/^0+[1-9]/.test(str)) {
    str = str.replace(/^0+/, '')
  } else if (/^0{2,}$/.test(str)) {
    str = '0'
  }

  return isNegative ? `-${str}` : str
}

/**
 * Safely parses string/number inputs into a finite number with a fallback.
 * Useful for calculations where an empty string ('') should evaluate to a default
 * without forcing that default back into the UI input field.
 */
export function parseNumericInput(
  value: string | number | null | undefined,
  fallback = 0
): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback
  }
  if (!value || typeof value !== 'string') {
    return fallback
  }
  const trimmed = value.trim()
  if (trimmed === '' || trimmed === '-') {
    return fallback
  }
  const parsed = parseFloat(trimmed)
  return Number.isFinite(parsed) ? parsed : fallback
}

