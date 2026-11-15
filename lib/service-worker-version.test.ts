import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { syncServiceWorkerVersion } from '../scripts/sync-sw-version.mjs'

describe('Automated Service Worker Version & Cache Sync Engine', () => {
  const rootDir = process.cwd()
  const pkgPath = resolve(rootDir, 'package.json')
  const swPath = resolve(rootDir, 'public/sw.js')

  it('verifies public/sw.js exists and has required PWA precache assets', () => {
    expect(existsSync(swPath)).toBe(true)
    const swContent = readFileSync(swPath, 'utf8')

    expect(swContent).toContain('/offline.html')
    expect(swContent).toContain('/manifest.webmanifest')
    expect(swContent).toContain('/manifest.json')
    expect(swContent).toContain('/apple-touch-icon.png')
    expect(swContent).toContain('/images/icon-192.png')
    expect(swContent).toContain('/images/icon-512.png')
    expect(swContent).toContain('/images/icon-maskable-512.png')
    expect(swContent).toContain('/images/icon-monochrome.png')
    expect(swContent).toContain('/images/offline-companion-hero.jpg')
    expect(swContent).toContain('/images/shortcuts/shortcut-workout.png')
  })

  it('verifies public/sw.js cache VERSION matches package.json version exactly', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    const expectedTag = `gaa-v${pkg.version}`

    const swContent = readFileSync(swPath, 'utf8')
    const match = swContent.match(/const\s+VERSION\s*=\s*['"]([^'"]+)['"]/)

    expect(match).not.toBeNull()
    expect(match![1]).toBe(expectedTag)
  })

  it('syncServiceWorkerVersion executes idempotently without unintended modifications', () => {
    const result = syncServiceWorkerVersion()
    expect(result.appVersion).toBeTruthy()
    expect(result.targetVersionTag).toBe(`gaa-v${result.appVersion}`)
    expect(result.changed).toBe(false)
  })

  it('enforces strict NetworkOnly bypasses, Cache-Control privacy checks, and same-origin notification URLs in public/sw.js', () => {
    const swContent = readFileSync(swPath, 'utf8')

    // Never cache /api/* or /_next/image (prevents ignoreSearch collisions & private signed URL caching)
    expect(swContent).toContain("url.pathname.startsWith('/api/telemetry')")
    expect(swContent).toContain("url.pathname.startsWith('/api/')")
    expect(swContent).toContain("url.pathname.startsWith('/_next/image')")
    expect(swContent).toContain("!cc.includes('no-store')")
    expect(swContent).toContain("!cc.includes('private')")

    // Extract and test normalizeSafeNotificationUrl against external phishing/open-redirect URLs
    const fnMatch = swContent.match(
      /function\s+normalizeSafeNotificationUrl\(rawUrl\)\s*\{[\s\S]*?\n\}/
    )
    expect(fnMatch).not.toBeNull()

    const evalNormalize = new Function(
      'self',
      `${fnMatch![0]}; return normalizeSafeNotificationUrl;`
    )({ location: { origin: 'https://forge-athletic.app' } }) as (rawUrl: unknown) => string

    expect(evalNormalize('https://evil.example/steal-token')).toBe('/dashboard/live')
    expect(evalNormalize('//evil.example/open-redirect')).toBe('/dashboard/live')
    expect(evalNormalize('javascript:alert(1)')).toBe('/dashboard/live')
    expect(evalNormalize('/dashboard/fitness?workspace=train#sets')).toBe(
      '/dashboard/fitness?workspace=train#sets'
    )
    expect(evalNormalize('')).toBe('/dashboard/live')
  })
})
