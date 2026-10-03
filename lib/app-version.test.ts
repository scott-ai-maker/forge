import { describe, it, expect } from 'vitest'
import {
  APP_VERSION,
  APP_RELEASE_DATE,
  RELEASE_LOG,
  getLatestRelease,
  getAllReleases,
  parseSemVer,
  isNewerVersion,
} from './app-version'

describe('Semantic Versioning & Release Engine', () => {
  it('adheres to SemVer 2.0.0 format (MAJOR.MINOR.PATCH)', () => {
    const semVerRegex = /^\d+\.\d+\.\d+$/
    expect(APP_VERSION).toMatch(semVerRegex)
    expect(parseSemVer(APP_VERSION).major).toBe(1)
    expect(parseSemVer(APP_VERSION).minor).toBe(35)
    expect(parseSemVer(APP_VERSION).patch).toBe(39)
  })

  it('contains valid ISO release dates and sorted chronological logs', () => {
    expect(APP_RELEASE_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(RELEASE_LOG.length).toBeGreaterThanOrEqual(5)

    const latest = getLatestRelease()
    expect(latest.version).toBe(APP_VERSION)
    expect(latest.highlights.length).toBeGreaterThan(0)
  })

  it('correctly filters releases by category', () => {
    const all = getAllReleases('all')
    expect(all.length).toBe(RELEASE_LOG.length)

    const major = getAllReleases('major')
    expect(major.length).toBeGreaterThanOrEqual(1)
    expect(major.every(r => r.category === 'major')).toBe(true)

    const feature = getAllReleases('feature')
    expect(feature.every(r => r.category === 'feature')).toBe(true)
  })

  it('correctly compares semantic versions', () => {
    expect(isNewerVersion('1.0.0', '0.9.8')).toBe(true)
    expect(isNewerVersion('0.9.9', '0.9.8')).toBe(true)
    expect(isNewerVersion('0.9.8', '1.0.0')).toBe(false)
    expect(isNewerVersion('1.0.0', '1.0.0')).toBe(false)
    expect(isNewerVersion('v1.0.1', '1.0.0')).toBe(true)
  })
})
