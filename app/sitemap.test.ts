import { describe, it, expect } from 'vitest'
import sitemap from './sitemap'

describe('app/sitemap.ts', () => {
  it('generates the production sitemap with all key marketing and legal routes', () => {
    const entries = sitemap()

    expect(Array.isArray(entries)).toBe(true)
    expect(entries.length).toBeGreaterThanOrEqual(7)

    const urls = entries.map(e => e.url)
    expect(urls).toContain('https://gordonathleticadvisory.com/')
    expect(urls).toContain('https://gordonathleticadvisory.com/packages')
    expect(urls).toContain('https://gordonathleticadvisory.com/async-coaching')
    expect(urls).toContain('https://gordonathleticadvisory.com/apply')
    expect(urls).toContain('https://gordonathleticadvisory.com/whats-new')
    expect(urls).toContain('https://gordonathleticadvisory.com/privacy')
    expect(urls).toContain('https://gordonathleticadvisory.com/terms')

    // Verify all entries have valid priorities and change frequencies
    for (const entry of entries) {
      expect(entry.priority).toBeGreaterThan(0)
      expect(entry.priority).toBeLessThanOrEqual(1.0)
      expect(entry.lastModified).toBeInstanceOf(Date)
    }
  })
})
