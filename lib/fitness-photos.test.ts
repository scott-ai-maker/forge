import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it, vi } from 'vitest'
import {
  extractPhotoPathFromLegacyUrl,
  isUserOwnedPhotoPath,
  normalizePhotoPath,
  persistBodyCompPhotoToPrivateVault,
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
    expect(schemaSql).toContain('body_comp_no_inline_base64_chk')
    expect(schemaSql).not.toMatch(/on\s+coach_onboarding_gates[\s\S]{0,80}using\s*\(\s*true\s*\)/i)
  })

  it('uploads Base64 body-composition photos to private fitness-photos bucket and never returns raw data URIs', async () => {
    const uploadMock = vi.fn().mockResolvedValue({ data: { path: 'ok' }, error: null })
    const mockStorageClient = {
      storage: {
        from: (bucket: string) => {
          expect(bucket).toBe('fitness-photos')
          return { upload: uploadMock }
        },
      },
    }

    const base64Jpeg = 'data:image/jpeg;base64,' + Buffer.from('fake-jpeg-bytes').toString('base64')
    const storedPath = await persistBodyCompPhotoToPrivateVault(mockStorageClient, 'user-123', base64Jpeg)
    expect(storedPath).toMatch(/^user-123\/bodycomp-\d+-[a-f0-9]+\.jpg$/)
    expect(storedPath?.startsWith('data:')).toBe(false)
    expect(uploadMock).toHaveBeenCalledTimes(1)

    // Cross-user path or external URL must be rejected
    await expect(
      persistBodyCompPhotoToPrivateVault(mockStorageClient, 'user-123', 'other-user/photo.jpg')
    ).resolves.toBeNull()
    await expect(
      persistBodyCompPhotoToPrivateVault(mockStorageClient, 'user-123', 'https://attacker.example/photo.jpg')
    ).resolves.toBeNull()

    // Storage failure fails closed to null rather than writing raw Base64 to Postgres
    const failingClient = {
      storage: {
        from: () => ({ upload: vi.fn().mockResolvedValue({ data: null, error: new Error('Upload failed') }) }),
      },
    }
    await expect(
      persistBodyCompPhotoToPrivateVault(failingClient, 'user-123', base64Jpeg)
    ).resolves.toBeNull()
  })
})
