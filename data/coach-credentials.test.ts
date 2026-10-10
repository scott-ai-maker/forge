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

  it('contains the accredited Bachelor of Science in Information Technology academic degree', () => {
    const bsit = getCredentialById('uop-bsit')
    expect(bsit).toBeDefined()
    expect(bsit?.code).toBe('BSIT · B.S.')
    expect(bsit?.title).toBe('Bachelor of Science in Information Technology')
    expect(bsit?.issuerShort).toBe('UOPX')
    expect(bsit?.category).toBe('academic')
    expect(bsit?.status).toBe('completed')
    expect(bsit?.gpa).toBe('3.72')
    expect(bsit?.conferredDate).toBe('September 2020')
    expect(bsit?.featured).toBe(true)
    expect(bsit?.coursework?.length).toBeGreaterThanOrEqual(10)
  })

  it('correctly filters featured and active credentials', () => {
    const featured = getFeaturedCredentials()
    expect(featured.length).toBeGreaterThanOrEqual(3)
    expect(featured.some((c) => c.id === 'nasm-cpt')).toBe(true)
    expect(featured.some((c) => c.id === 'asti-cpr-aed')).toBe(true)
    expect(featured.some((c) => c.id === 'uop-bsit')).toBe(true)

    const active = getActiveCredentials()
    expect(active.some((c) => c.id === 'nasm-cpt')).toBe(true)
    expect(active.some((c) => c.id === 'asti-cpr-aed')).toBe(true)
    expect(active.some((c) => c.id === 'nasm-orientation')).toBe(true)
    expect(active.some((c) => c.id === 'uop-bsit')).toBe(true)
  })

  it('contains verified AWS and IBM Cloud & AI engineering credentials from Credly', () => {
    const aws = getCredentialById('aws-solutions-architect')
    expect(aws).toBeDefined()
    expect(aws?.issuerShort).toBe('AWS')
    expect(aws?.category).toBe('engineering')
    expect(aws?.featured).toBe(true)
    expect(aws?.badgeImage).toContain('images.credly.com')

    const ibmAi = getCredentialById('ibm-ai-developer')
    expect(ibmAi).toBeDefined()
    expect(ibmAi?.issuerShort).toBe('IBM')
    expect(ibmAi?.category).toBe('engineering')

    const ibmMl = getCredentialById('ibm-machine-learning')
    expect(ibmMl).toBeDefined()
    expect(ibmMl?.issuerShort).toBe('IBM')
    expect(ibmMl?.issueDate).toBe('October 9, 2026')
  })

  it('computes accurate category counts and stats including Credly portfolio', () => {
    const categories = getCredentialCategories()
    expect(categories.length).toBeGreaterThanOrEqual(8)

    const allCat = categories.find((c) => c.key === 'all')
    expect(allCat?.count).toBe(COACH_CREDENTIALS.length)

    const academicCat = categories.find((c) => c.key === 'academic')
    expect(academicCat?.count).toBe(1)

    const engCat = categories.find((c) => c.key === 'engineering')
    expect(engCat?.count).toBeGreaterThanOrEqual(5)

    const stats = getCredentialStats()
    expect(stats.verifiedCount).toBeGreaterThanOrEqual(2)
    expect(stats.nccaAccredited).toBe(1)
    expect(stats.engineeringCount).toBeGreaterThanOrEqual(5)
    expect(stats.credlyTotalCount).toBe(34)
    expect(stats.primaryCredential?.certificateNumber).toBe('1261890687')
    expect(stats.safetyCredential?.certificateNumber).toBe('1261890193')
    expect(stats.academicDegree?.id).toBe('uop-bsit')
    expect(stats.flagshipCloudCredential?.id).toBe('aws-solutions-architect')
    expect(stats.flagshipAiCredential?.id).toBe('ibm-ai-developer')
  })
})
