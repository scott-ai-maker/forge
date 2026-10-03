import { describe, it, expect } from 'vitest'
import { isValidUuid, toValidUuidOrNull } from './uuid-utils'

describe('UUID Utilities', () => {
  it('validates standard UUIDs', () => {
    expect(isValidUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
    expect(isValidUuid('b547ddb7-d1cf-41c6-a67b-1cb2b1be75a3')).toBe(true)
  })

  it('rejects invalid or placeholder strings', () => {
    expect(isValidUuid('demo-plan-1')).toBe(false)
    expect(isValidUuid('default')).toBe(false)
    expect(isValidUuid('')).toBe(false)
    expect(isValidUuid(null)).toBe(false)
    expect(isValidUuid(undefined)).toBe(false)
    expect(isValidUuid(12345)).toBe(false)
  })

  it('normalizes UUID strings with toValidUuidOrNull', () => {
    expect(toValidUuidOrNull('  123e4567-e89b-12d3-a456-426614174000  ')).toBe('123e4567-e89b-12d3-a456-426614174000')
    expect(toValidUuidOrNull('demo-plan-1')).toBeNull()
    expect(toValidUuidOrNull(undefined)).toBeNull()
  })
})
