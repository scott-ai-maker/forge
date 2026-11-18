import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { evaluateMedicalParq, ParqAnswers } from '@/lib/liability-shield'
import { FOUNDING_PRICING_CARDS } from '@/lib/landingSocialProof'
import { FORGE_TIER_ENTITLEMENTS } from '@/lib/tierEntitlements'

const REPO_ROOT = process.cwd()
const PARQ_MODAL_PATH = path.join(REPO_ROOT, 'components/fitness/MedicalParqModal.tsx')
const AUTH_FORM_PATH = path.join(REPO_ROOT, 'components/auth/AuthForm.tsx')
const SIGNUP_PAGE_PATH = path.join(REPO_ROOT, 'app/auth/signup/page.tsx')

describe('Feature #1 — Auth, HIPAA PAR-Q+ Modal & 3-Tier Founding Signup Contracts', () => {
  const parqSource = fs.readFileSync(PARQ_MODAL_PATH, 'utf8')
  const authFormSource = fs.readFileSync(AUTH_FORM_PATH, 'utf8')
  const signupPageSource = fs.readFileSync(SIGNUP_PAGE_PATH, 'utf8')

  it('renders MedicalParqModal as a native modal <dialog> with accessible checkbox toggles and ESIGN gating', () => {
    expect(parqSource).toContain('<dialog')
    expect(parqSource).toContain('dialog.showModal()')
    expect(parqSource).not.toContain('role="dialog"')
    expect(parqSource).not.toContain('aria-modal')
    expect(parqSource).toContain('aria-label="Close medical screening"')
    expect(parqSource).toContain('<fieldset')
    expect(parqSource).toContain('<legend')
    expect(parqSource).toContain('type="checkbox"')
    expect(parqSource).toContain('htmlFor="parq-orthopedic-notes"')
    expect(parqSource).toContain('id="parq-orthopedic-notes"')
    expect(parqSource).toContain('role="status"')
    expect(parqSource).toContain('aria-live="polite"')
  })

  it('stratifies PAR-Q+ clearance accurately across unrestricted, orthopedic-modified, and physician-clearance tiers', () => {
    const cleanAnswers: ParqAnswers = {
      hasHeartCondition: false,
      experiencesChestPain: false,
      experiencesDizzinessOrSyncope: false,
      hasBoneOrJointProblem: false,
      takesBloodPressureOrHeartMedication: false,
      hasChronicSpinalOrDiscCondition: false,
      hasRecentSurgeryOrInjury: false,
      reportedConditionsNotes: '',
      signedWaiverName: 'Jordan Vance',
      signedAt: '2026-11-15T12:00:00.000Z',
    }
    const cleanEval = evaluateMedicalParq(cleanAnswers)
    expect(cleanEval.clearanceStatus).toBe('cleared_unrestricted')
    expect(cleanEval.maxAllowedOptPhase).toBe(5)

    const orthoEval = evaluateMedicalParq({
      ...cleanAnswers,
      hasBoneOrJointProblem: true,
      hasChronicSpinalOrDiscCondition: true,
    })
    expect(orthoEval.clearanceStatus).toBe('cleared_with_modifications')
    expect(orthoEval.maxAllowedOptPhase).toBeLessThan(5)

    const cardiacEval = evaluateMedicalParq({
      ...cleanAnswers,
      hasHeartCondition: true,
    })
    expect(cardiacEval.clearanceStatus).toBe('physician_clearance_required')
    expect(cardiacEval.maxAllowedOptPhase).toBe(0)
    expect(cardiacEval.exercisePermitted).toBe(false)
  })

  it('wires Founding Rate Lock ?plan=core_lab|plus|coach_support from landing cards through /auth/signup and AuthForm', () => {
    expect(FOUNDING_PRICING_CARDS.map(c => c.ctaHref)).toEqual([
      '/auth/signup?plan=core_lab',
      '/auth/signup?plan=plus',
      '/auth/signup?plan=coach_support',
    ])
    expect(FORGE_TIER_ENTITLEMENTS.core_lab.foundingPriceFormatted).toBe('$49.00')
    expect(FORGE_TIER_ENTITLEMENTS.plus.foundingPriceFormatted).toBe('$99.00')
    expect(FORGE_TIER_ENTITLEMENTS.coach_support.foundingPriceFormatted).toBe('$299.00')

    const packagesPageSource = fs.readFileSync(path.join(REPO_ROOT, 'app/packages/page.tsx'), 'utf8')
    expect(packagesPageSource).toContain("lowPrice: '49.00'")
    expect(packagesPageSource).toContain("price: '99.00'")
    expect(packagesPageSource).toContain("price: '299.00'")
    expect(packagesPageSource).not.toContain("'19.99'")

    expect(signupPageSource).toContain('selected-founding-plan-banner')
    expect(signupPageSource).toContain('Founding Member Rate Lock')
    expect(signupPageSource).toContain('selectedPlan={selectedPlanId}')

    expect(authFormSource).toContain('selected_founding_plan')
    expect(authFormSource).toContain('aria-pressed={showPassword}')
    expect(authFormSource).toContain('id="password-constraints"')
    expect(authFormSource).toContain('id="password-toggle-warning"')
  })

  it('enforces WA MHMDA / NV SB 370 / IL BIPA unbundled Consumer Health & Biometric consent and homepage /health-privacy links', () => {
    expect(authFormSource).toContain('id="legal-consent-checkbox"')
    expect(authFormSource).toContain('id="health-biometric-consent-checkbox"')
    expect(authFormSource).toContain('Standalone Consumer Health &amp; Biometric Data Consent:')

    const homeSource = fs.readFileSync(path.join(REPO_ROOT, 'app/page.tsx'), 'utf8')
    const splashSource = fs.readFileSync(
      path.join(REPO_ROOT, 'components/marketing/HolidayUnmaskingSplash.tsx'),
      'utf8'
    )
    const healthPrivacySource = fs.readFileSync(
      path.join(REPO_ROOT, 'app/health-privacy/page.tsx'),
      'utf8'
    )

    expect(homeSource).toContain('href="/health-privacy"')
    expect(splashSource).toContain('href="/health-privacy"')
    expect(healthPrivacySource).toContain('Google LLC (Gemini API)')
    expect(healthPrivacySource).not.toContain('Leonardo Interactive Pty Ltd')
    expect(healthPrivacySource).toContain('ElevenLabs Inc.')
    expect(healthPrivacySource).toContain('Twilio Inc.')
    expect(healthPrivacySource).toContain('Resend, Inc.')
  })
})
