import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { detectSafeImageMimeFromBytes } from '@/lib/fitness-photos'

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8')

describe('White-Box AppSec Hardening Regression Suite', () => {
  it('Finding 1: enforces strict APNs hex deviceToken validation & safe URL encoding', () => {
    const pushRoute = read('app/api/account/push-token/route.ts')
    expect(pushRoute).toContain('IOS_APNS_TOKEN_RE = /^[a-fA-F0-9]{64,200}$/')
    expect(pushRoute).toContain("ALLOWED_PLATFORMS = new Set(['ios', 'android', 'web'])")
    expect(pushRoute).toContain('existingToken?.user_id && existingToken.user_id !== userId')

    const pushLib = read('lib/push-notifications.ts')
    expect(pushLib).toContain('APNS_HEX_RE.test(token.device_token)')
    expect(pushLib).toContain('encodeURIComponent(token.device_token)')
  })

  it('Finding 2: checks server-authoritative app_metadata and DB clients.must_reset_password in proxy.ts & blocks protocol-relative redirects', () => {
    const proxySrc = read('proxy.ts')
    expect(proxySrc).toContain('user.app_metadata?.must_reset_password === true')
    expect(proxySrc).toContain(".select('must_reset_password')")

    const resetForm = read('components/auth/ResetPasswordForm.tsx')
    expect(resetForm).toContain("!candidate.startsWith('//')")
  })

  it('Finding 3: enforces protectCSRF(req) on POST /api/account/sms-consent', () => {
    const smsConsent = read('app/api/account/sms-consent/route.ts')
    expect(smsConsent).toContain("import { protectCSRF } from '@/lib/csrf'")
    expect(smsConsent).toContain('const csrf = await protectCSRF(req)')
  })

  it('Finding 4: validates PNG, JPEG, and WebP binary magic bytes and rejects spoofed HTML/SVG payloads', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d])
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])
    const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50])
    const svg = new TextEncoder().encode('<svg onload="alert(1)"></svg>')

    expect(detectSafeImageMimeFromBytes(png)).toBe('image/png')
    expect(detectSafeImageMimeFromBytes(jpeg)).toBe('image/jpeg')
    expect(detectSafeImageMimeFromBytes(webp)).toBe('image/webp')
    expect(detectSafeImageMimeFromBytes(svg)).toBeNull()

    const avatarRoute = read('app/api/account/avatar/route.ts')
    expect(avatarRoute).toContain('detectSafeImageMimeFromBytes')
    expect(avatarRoute).toContain('enforceRateLimit')
  })

  it('Finding 5: hardens CSP with frame-ancestors/form-action and removes retired YouTube & client Gemini origins', () => {
    const nextConfig = read('next.config.ts')
    expect(nextConfig).toContain("frame-ancestors 'self'")
    expect(nextConfig).toContain("form-action 'self'")
    expect(nextConfig).not.toContain('img.youtube.com')
    expect(nextConfig).not.toContain('i.ytimg.com')
    expect(nextConfig).not.toContain('youtube-nocookie.com')
    expect(nextConfig).not.toContain('generativelanguage.googleapis.com')
  })

  it('Finding 6: removes production coach-specific password-reset hint and rate-limits sensitive mutations', () => {
    const pwReset = read('app/api/auth/password-reset/route.ts')
    expect(pwReset).not.toContain('1-Click Coach Fast Pass on the login page')

    expect(read('app/api/stripe/checkout/route.ts')).toContain("route: '/api/stripe/checkout'")
    expect(read('app/api/stripe/portal/route.ts')).toContain("route: '/api/stripe/portal'")
    expect(read('app/api/messages/route.ts')).toContain("route: '/api/messages'")
    expect(read('app/api/account/delete/route.ts')).toContain("route: '/api/account/delete'")
  })
})
