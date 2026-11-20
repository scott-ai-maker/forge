import { describe, it, expect } from 'vitest'
import nextConfig from '../next.config'

describe('Content Security Policy & CDN Whitelisting (next.config.ts)', () => {
  it('whitelists trusted image CDN domains and excludes retired YouTube domains in remotePatterns', () => {
    const patterns = nextConfig.images?.remotePatterns || []
    const hostnames = patterns.map(p => ('hostname' in p ? p.hostname : ''))

    expect(hostnames).not.toContain('img.youtube.com')
    expect(hostnames).not.toContain('i.ytimg.com')
    expect(hostnames).toContain('images.credly.com')
    expect(hostnames).toContain('*.supabase.co')
  })

  it('enforces hardened Content-Security-Policy without retired YouTube or client Gemini origins', async () => {
    const headersFn = nextConfig.headers
    expect(headersFn).toBeDefined()
    if (!headersFn) return

    const headerConfigs = await headersFn()
    const globalHeader = headerConfigs.find(h => h.source === '/:path*')
    expect(globalHeader).toBeDefined()

    const cspHeader = globalHeader?.headers.find(h => h.key === 'Content-Security-Policy')
    expect(cspHeader).toBeDefined()
    const cspValue = cspHeader?.value || ''

    // Retired YouTube & client-side Gemini origins must be excluded
    expect(cspValue).not.toContain('img.youtube.com')
    expect(cspValue).not.toContain('i.ytimg.com')
    expect(cspValue).not.toContain('youtube-nocookie.com')
    expect(cspValue).not.toContain('www.youtube.com')
    expect(cspValue).not.toContain('generativelanguage.googleapis.com')

    // Clickjacking & form-hijacking defenses
    expect(cspValue).toContain("frame-ancestors 'self'")
    expect(cspValue).toContain("form-action 'self'")

    // media-src must whitelist Supabase
    expect(cspValue).toMatch(/media-src[^;]*https:\/\/\*\.supabase\.co/)

    // Strict Zero-GA / Zero-Third-Party-Model-CDN Sanctuary enforcement (#46, #52, #55)
    expect(cspValue).not.toContain('googletagmanager.com')
    expect(cspValue).not.toContain('google-analytics.com')
    expect(cspValue).not.toContain('analytics.google.com')
    expect(cspValue).not.toContain('storage.googleapis.com')
    expect(cspValue).not.toContain('cdn.jsdelivr.net')
    expect(cspValue).not.toContain("'unsafe-eval'")
    expect(cspValue).toContain("'wasm-unsafe-eval'")
  })

  it('does not permanently lock static images with immutable cache-control', async () => {
    const headersFn = nextConfig.headers
    if (!headersFn) return

    const headerConfigs = await headersFn()
    const imagesHeader = headerConfigs.find(h => h.source === '/images/:path*')
    expect(imagesHeader).toBeDefined()

    const cacheHeader = imagesHeader?.headers.find(h => h.key === 'Cache-Control')
    expect(cacheHeader).toBeDefined()
    // Should NOT be immutable for 1 year (which caused stale GAA logo retention)
    expect(cacheHeader?.value).not.toContain('immutable')
    expect(cacheHeader?.value).toContain('stale-while-revalidate')
  })
})
