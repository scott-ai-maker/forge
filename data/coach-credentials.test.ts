import { describe, it, expect } from 'vitest'
import {
  COACH_CREDENTIALS,
  getFeaturedCredentials,
  getActiveCredentials,
  getCredentialById,
  getCredentialCategories,
  getCredentialStats,
} from './coach-credentials'

describe('data/coach-credentials.ts', () => {
  it('contains the official NCCA-accredited NASM-CPT credential with verified certificate ID and badge', () => {
    const cpt = getCredentialById('nasm-cpt')
    expect(cpt).toBeDefined()
    expect(cpt?.code).toBe('NASM-CPT®')
    expect(cpt?.status).toBe('active')
    expect(cpt?.isNccaAccredited).toBe(true)
    expect(cpt?.certificateNumber).toBe('1261890687')
    expect(cpt?.expirationDate).toBe('October 7, 2028')
    expect(cpt?.verificationUrl).toBe('https://www.credential.net/07f48168-fa30-4a54-bd43-ae0f8a66677b')
    expect(cpt?.badgeImage).toBe('/images/badges/nasm-cpt-badge.png')
    expect(cpt?.certificatePdf).toBe('/documents/credentials/nasm-cpt-certificate.pdf')
    expect(cpt?.featured).toBe(true)
  })

  it('contains the verified ASTI CPR/AED emergency life support credential', () => {
    const cpr = getCredentialById('asti-cpr-aed')
    expect(cpr).toBeDefined()
    expect(cpr?.status).toBe('active')
    expect(cpr?.certificateNumber).toBe('1261890193')
    expect(cpr?.issuerShort).toBe('ASTI')
    expect(cpr?.expirationDate).toBe('October 7, 2028')
    expect(cpr?.certificatePdf).toBe('/documents/credentials/asti-cpr-aed-certificate.pdf')
    expect(cpr?.featured).toBe(true)
  })

  it('contains the completed NASM Learner Orientation record', () => {
    const orientation = getCredentialById('nasm-orientation')
    expect(orientation).toBeDefined()
    expect(orientation?.status).toBe('completed')
    expect(orientation?.certificatePdf).toBe('/documents/credentials/nasm-orientation-record.pdf')
  })

  it('correctly filters featured and active credentials', () => {
    const featured = getFeaturedCredentials()
    expect(featured.length).toBeGreaterThanOrEqual(2)
    expect(featured.some((c) => c.id === 'nasm-cpt')).toBe(true)
    expect(featured.some((c) => c.id === 'asti-cpr-aed')).toBe(true)

    const active = getActiveCredentials()
    expect(active.some((c) => c.id === 'nasm-cpt')).toBe(true)
    expect(active.some((c) => c.id === 'asti-cpr-aed')).toBe(true)
    expect(active.some((c) => c.id === 'nasm-orientation')).toBe(true)
  })

  it('computes accurate category counts and stats', () => {
    const categories = getCredentialCategories()
    expect(categories.length).toBeGreaterThanOrEqual(6)

    const allCat = categories.find((c) => c.key === 'all')
    expect(allCat?.count).toBe(COACH_CREDENTIALS.length)

    const stats = getCredentialStats()
    expect(stats.verifiedCount).toBeGreaterThanOrEqual(2)
    expect(stats.nccaAccredited).toBe(1)
    expect(stats.primaryCredential?.certificateNumber).toBe('1261890687')
    expect(stats.safetyCredential?.certificateNumber).toBe('1261890193')
  })
})
