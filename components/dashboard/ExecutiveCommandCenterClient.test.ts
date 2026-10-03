import { describe, expect, it } from 'vitest'
import { getBaselineOnboardingBannerState } from './ExecutiveCommandCenterClient'

describe('ExecutiveCommandCenterClient Onboarding Banner Lifecycle Logic', () => {
  it('returns null when onboarding is completed', () => {
    // When isOnboardingCompleted is true
    const result1 = getBaselineOnboardingBannerState({
      isOnboardingCompleted: true,
      isOnboardingStarted: false,
    })
    expect(result1).toBeNull()

    // Even if needsOnboarding was true or draft was present, completion flag takes precedence
    const result2 = getBaselineOnboardingBannerState({
      isOnboardingCompleted: true,
      needsOnboarding: true,
      isOnboardingStarted: true,
      hasLocalDraft: true,
    })
    expect(result2).toBeNull()
  })

  it('falls back to !needsOnboarding when isOnboardingCompleted is undefined', () => {
    // If needsOnboarding is false and isOnboardingCompleted is undefined, considered complete -> null
    const result = getBaselineOnboardingBannerState({
      needsOnboarding: false,
    })
    expect(result).toBeNull()
  })

  it('displays "COMPLETE YOUR BASELINE FITNESS SETUP" and "Start Setup →" when incomplete and unstarted', () => {
    const result = getBaselineOnboardingBannerState({
      isOnboardingCompleted: false,
      isOnboardingStarted: false,
      hasLocalDraft: false,
    })

    expect(result).not.toBeNull()
    expect(result?.title).toBe('COMPLETE YOUR BASELINE FITNESS SETUP')
    expect(result?.buttonText).toBe('Start Setup →')
    expect(result?.eyebrow).toBe('Action Required · Baseline Assessment')
    expect(result?.description).toContain('Provide your baseline vitals')
    expect(result?.href).toBe('/dashboard/onboarding')
  })

  it('displays "CONTINUE YOUR BASELINE FITNESS SETUP" and "Continue Setup →" when incomplete but started on backend', () => {
    const result = getBaselineOnboardingBannerState({
      isOnboardingCompleted: false,
      isOnboardingStarted: true,
      hasLocalDraft: false,
    })

    expect(result).not.toBeNull()
    expect(result?.title).toBe('CONTINUE YOUR BASELINE FITNESS SETUP')
    expect(result?.buttonText).toBe('Continue Setup →')
    expect(result?.eyebrow).toBe('In Progress · Setup Saved')
    expect(result?.description).toContain('Pick up where you left off')
    expect(result?.href).toBe('/dashboard/onboarding')
  })

  it('displays "CONTINUE YOUR BASELINE FITNESS SETUP" and "Continue Setup →" when incomplete but local draft exists', () => {
    const result = getBaselineOnboardingBannerState({
      isOnboardingCompleted: false,
      isOnboardingStarted: false,
      hasLocalDraft: true,
    })

    expect(result).not.toBeNull()
    expect(result?.title).toBe('CONTINUE YOUR BASELINE FITNESS SETUP')
    expect(result?.buttonText).toBe('Continue Setup →')
    expect(result?.eyebrow).toBe('In Progress · Setup Saved')
    expect(result?.description).toContain('Pick up where you left off')
  })
})

