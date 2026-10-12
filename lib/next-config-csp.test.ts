import { describe, it, expect } from 'vitest'
import nextConfig from '../next.config'

describe('Content Security Policy & CDN Whitelisting (next.config.ts)', () => {
  it('whitelists official NASM exercise CDN domains in remotePatterns', () => {
    const patterns = nextConfig.images?.remotePatterns || []
    const hostnames = patterns.map(p => ('hostname' in p ? p.hostname : ''))

    expect(hostnames).toContain('img.youtube.com')
    expect(hostnames).toContain('i.ytimg.com')
    expect(hostnames).toContain('images.credly.com')
    expect(hostnames).toContain('*.supabase.co')
  })

  it('whitelists official NASM CDN images and YouTube embed domains in Content-Security-Policy', async () => {
    const headersFn = nextConfig.headers
    expect(headersFn).toBeDefined()
    if (!headersFn) return

    const headerConfigs = await headersFn()
    const globalHeader = headerConfigs.find(h => h.source === '/:path*')
    expect(globalHeader).toBeDefined()

    const cspHeader = globalHeader?.headers.find(h => h.key === 'Content-Security-Policy')
    expect(cspHeader).toBeDefined()
    const cspValue = cspHeader?.value || ''

    // img-src must whitelist YouTube CDN
    expect(cspValue).toMatch(/img-src[^;]*https:\/\/img\.youtube\.com/)
    expect(cspValue).toMatch(/img-src[^;]*https:\/\/i\.ytimg\.com/)

    // frame-src must whitelist YouTube embed domains
    expect(cspValue).toMatch(/frame-src[^;]*https:\/\/www\.youtube-nocookie\.com/)
    expect(cspValue).toMatch(/frame-src[^;]*https:\/\/www\.youtube\.com/)

    // media-src must whitelist Supabase
    expect(cspValue).toMatch(/media-src[^;]*https:\/\/\*\.supabase\.co/)
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
