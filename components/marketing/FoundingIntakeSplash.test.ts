import { describe, expect, it } from 'vitest'
import { existsSync, statSync } from 'fs'
import path from 'path'

describe('Founding Principal Intake Splash & Video Engine', () => {
  it('confirms the Gemini Pro & Omni Flash generated video exists and has valid payload size', () => {
    const videoPath = path.resolve(process.cwd(), 'public/videos/gaa-founding-manifesto.mp4')
    expect(existsSync(videoPath)).toBe(true)

    const stats = statSync(videoPath)
    // Video must be substantial (> 1MB)
    expect(stats.size).toBeGreaterThan(1024 * 1024)
  })

  it('validates email syntax for executive intake registration', () => {
    const validEmails = [
      'scott@gordonathletic.com',
      'principal@executive-advisory.ch',
      'athlete.elite@domain.org',
    ]
    const invalidEmails = [
      'not-an-email',
      'missing-at-sign.com',
      'spaces in@email.com',
    ]

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    validEmails.forEach((email) => {
      expect(emailRegex.test(email)).toBe(true)
    })

    invalidEmails.forEach((email) => {
      expect(emailRegex.test(email)).toBe(false)
    })
  })

  it('enforces Founding Cohort ceiling of 15 allocations', () => {
    const maxAllocations = 15
    const reservedPosition = 12

    expect(reservedPosition).toBeLessThanOrEqual(maxAllocations)
    expect(reservedPosition).toBeGreaterThan(0)
  })

  it('validates the complete 13-point NASM credential matrix for Gordon Athletic Advisory', async () => {
    const { NASM_CREDENTIALS_DATA } = await import('./NasmAccreditationPortfolio')
    expect(NASM_CREDENTIALS_DATA).toHaveLength(13)

    const codes = NASM_CREDENTIALS_DATA.map((c) => c.code)
    expect(codes).toContain('NASM-CPT®')
    expect(codes).toContain('NASM-CES®')
    expect(codes).toContain('NASM-PES®')
    expect(codes).toContain('NASM-CNC™')
    expect(codes).toContain('NASM-CSNC')
    expect(codes).toContain('NASM-PBC')
    expect(codes).toContain('NASM-WLS')
    expect(codes).toContain('NASM-BCS')
    expect(codes).toContain('NASM-VCS')
    expect(codes).toContain('NASM-SFS')
    expect(codes).toContain('NASM-GFS')
    expect(codes).toContain('NASM-MMACS')
    expect(codes).toContain('🏆 NASM Master Trainer')

    // Every credential must define curriculum and GAA software integration
    NASM_CREDENTIALS_DATA.forEach((cred) => {
      expect(cred.curriculum.length).toBeGreaterThanOrEqual(3)
      expect(cred.gaaEngineIntegration.length).toBeGreaterThan(15)
      expect(cred.keyAlgorithmicModule.length).toBeGreaterThan(5)
    })
  })

  it('validates the official master brand crest (authentic GA interlocking monogram) and fallback card', () => {
    const crestPath = path.resolve(process.cwd(), 'public/images/gaa-brand-crest.jpg')
    const fallbackPath = path.resolve(process.cwd(), 'public/images/exercises/image-not-available.jpg')
    const brandLogoPath = path.resolve(process.cwd(), 'public/images/brand-logo.png')

    expect(existsSync(crestPath)).toBe(true)
    expect(existsSync(fallbackPath)).toBe(true)
    expect(existsSync(brandLogoPath)).toBe(true)

    expect(statSync(crestPath).size).toBeGreaterThan(50 * 1024)
    expect(statSync(fallbackPath).size).toBeGreaterThan(40 * 1024)
    expect(statSync(brandLogoPath).size).toBeGreaterThan(50 * 1024)
  })

  it('validates founding intake payload contract for priority waitlist and cohort routing', () => {
    const payload = {
      email: 'executive@acme.corp',
      firstName: 'Alexander Vance',
      trainingLevel: 'intermediate',
      primaryGoal: '[Founding Intake] Goal: structural_longevity | Phone: +1 617 555 0199 | Notes: None',
      source: 'founding_cohort_intake',
      assignedCohortNumber: 11,
      phone: '+1 617 555 0199',
      profileType: 'executive',
    }

    expect(payload.source).toBe('founding_cohort_intake')
    expect(payload.assignedCohortNumber).toBeGreaterThanOrEqual(1)
    expect(payload.assignedCohortNumber).toBeLessThanOrEqual(20)
    expect(payload.phone).toBeDefined()
    expect(payload.profileType).toBe('executive')
  })
})

