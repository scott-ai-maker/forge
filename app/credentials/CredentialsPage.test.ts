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
    expect(pageSource).toContain('Coach Scott Gordon | Verified Credentials')
    expect(pageSource).toContain('hasCredential')
    expect(pageSource).toContain('EducationalOccupationalCredential')
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
})
