import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Credentials Page Architecture', () => {
  const credentialsPagePath = path.resolve(process.cwd(), 'app/credentials/page.tsx')
  const showcaseComponentPath = path.resolve(process.cwd(), 'components/credentials/CoachCredentialsShowcase.tsx')
  const dataPath = path.resolve(process.cwd(), 'data/coach-credentials.ts')
  const pageSource = fs.readFileSync(credentialsPagePath, 'utf8')
  const showcaseSource = fs.readFileSync(showcaseComponentPath, 'utf8')
  const dataSource = fs.readFileSync(dataPath, 'utf8')

  it('renders metadata and JSON-LD structured data for Coach Scott Gordon', () => {
    expect(pageSource).toContain('Coach Scott Gordon, B.S., NASM-CPT | Verified Credentials')
    expect(pageSource).toContain('hasCredential')
    expect(pageSource).toContain('EducationalOccupationalCredential')
    expect(pageSource).toContain('alumniOf')
    expect(pageSource).toContain('University of Phoenix')
    expect(pageSource).toContain('Bachelor of Science in Information Technology')
    expect(pageSource).toContain('1261890687')
    expect(pageSource).toContain('https://www.credential.net/07f48168-fa30-4a54-bd43-ae0f8a66677b')
  })

  it('embeds CoachCredentialsShowcase and explains NCCA accreditation standards', () => {
    expect(pageSource).toContain('<CoachCredentialsShowcase />')
    expect(pageSource).toContain('NCCA Gold Standard Accreditation')
    expect(pageSource).toContain('The OPT™ 5-Phase Periodization')
    expect(pageSource).toContain('Client Safety &amp; Emergency Readiness')
  })

  it('displays authentic badge and certificate verification triggers in CoachCredentialsShowcase', () => {
    expect(dataSource).toContain('nasm-cpt-badge.png')
    expect(dataSource).toContain('1261890687')
    expect(dataSource).toContain('1261890193')
    expect(showcaseSource).toContain('Verify on Credential.net')
    expect(showcaseSource).toContain('View Certificate')
    expect(showcaseSource).toContain('handleCopyCertificateNumber')
  })

  it('integrates Credly verified digital badge portfolio and structured data', () => {
    expect(pageSource).toContain('https://www.credly.com/users/scott-gordon.1dfe2f10/badges/credly')
    expect(pageSource).toContain('AWS Certified Solutions Architect – Associate')
    expect(pageSource).toContain('IBM AI Developer Professional Certificate')
    expect(pageSource).toContain('Cryptographic Verification &amp; Credly Portfolio')
    expect(showcaseSource).toContain('CREDLY_PROFILE_URL')
    expect(showcaseSource).toContain('CREDLY_BADGES_TOTAL')
    expect(showcaseSource).toContain('Verify All 34 on Credly.com')
    expect(showcaseSource).toContain('Filter AI &amp; Cloud')
    expect(dataSource).toContain('https://images.credly.com/images/0e284c3f-5164-4b21-8660-0d84737941bc/image.png')
  })
})

