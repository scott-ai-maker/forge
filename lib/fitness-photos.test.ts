import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import {
  extractPhotoPathFromLegacyUrl,
  isUserOwnedPhotoPath,
  normalizePhotoPath,
} from '@/lib/fitness-photos'

describe('fitness-photos path normalization & traversal defense', () => {
  it('normalizes valid relative bucket paths', () => {
    expect(normalizePhotoPath('user-1/progress-photo-123.jpg')).toBe('user-1/progress-photo-123.jpg')
    expect(normalizePhotoPath('/user-1/before-photo-456.webp')).toBe('user-1/before-photo-456.webp')
  })

  it('rejects dot-dot, percent-encoded, backslash, and nested segment traversal payloads', () => {
    expect(normalizePhotoPath('user-1/../victim-2/before-photo-1.jpg')).toBe('')
    expect(normalizePhotoPath('user-1/%2e%2e/victim-2/before-photo-1.jpg')).toBe('')
    expect(normalizePhotoPath('user-1/%252e%252e/victim-2/before-photo-1.jpg')).toBe('')
    expect(normalizePhotoPath('user-1\\..\\victim-2\\before-photo-1.jpg')).toBe('')
    expect(normalizePhotoPath('user-1/./progress-photo-1.jpg')).toBe('')
    expect(normalizePhotoPath('user-1//progress-photo-1.jpg')).toBe('')
    expect(normalizePhotoPath('user-1/progress-photo-1.jpg?evil=1')).toBe('')
  })

  it('enforces strict two-segment user ownership in isUserOwnedPhotoPath', () => {
    expect(isUserOwnedPhotoPath('user-1/progress-photo-1700.jpg', 'user-1')).toBe(true)
    expect(isUserOwnedPhotoPath('user-2/progress-photo-1700.jpg', 'user-1')).toBe(false)
    expect(isUserOwnedPhotoPath('user-1/../user-2/progress-photo-1700.jpg', 'user-1')).toBe(false)
    expect(isUserOwnedPhotoPath('user-1/nested/progress-photo-1700.jpg', 'user-1')).toBe(false)
    expect(isUserOwnedPhotoPath('user-1', 'user-1')).toBe(false)
  })

  it('blocks traversal inside legacy Supabase Storage URLs', () => {
    expect(
      extractPhotoPathFromLegacyUrl(
        'https://proj.supabase.co/storage/v1/object/sign/fitness-photos/user-1/before-photo-1.jpg?token=abc'
      )
    ).toBe('user-1/before-photo-1.jpg')

    expect(
      extractPhotoPathFromLegacyUrl(
        'https://proj.supabase.co/storage/v1/object/sign/fitness-photos/user-1/%2e%2e/victim-2/before-photo-1.jpg'
      )
    ).toBeNull()

    expect(
      extractPhotoPathFromLegacyUrl(
        'https://proj.supabase.co/storage/v1/object/public/fitness-photos/user-1/%252e%252e/victim-2/before-photo-1.jpg'
      )
    ).toBeNull()
  })

  it('enforces RLS on email_suppressions, client_lifecycle_audit_logs, and coach_onboarding_gates in schema.sql', () => {
    const schemaSql = readFileSync(resolve(process.cwd(), 'supabase/schema.sql'), 'utf8')
    expect(schemaSql).toContain('alter table email_suppressions enable row level security;')
    expect(schemaSql).toContain('alter table client_lifecycle_audit_logs enable row level security;')
    expect(schemaSql).toContain('alter table coach_onboarding_gates enable row level security;')
    expect(schemaSql).not.toMatch(/on\s+coach_onboarding_gates[\s\S]{0,80}using\s*\(\s*true\s*\)/i)
  })
})
