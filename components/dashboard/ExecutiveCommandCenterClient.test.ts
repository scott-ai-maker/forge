import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  getBaselineOnboardingBannerState,
  hasSavedOnboardingDraft,
  resolveCommandCenterHeroMeta,
} from './ExecutiveCommandCenterClient'

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

  it('recognizes both Forge and legacy onboarding localStorage draft keys safely', () => {
    expect(hasSavedOnboardingDraft(null)).toBe(false)
    expect(
      hasSavedOnboardingDraft({
        getItem: key => (key === 'forge_baseline_onboarding_draft' ? '{"step":2}' : null),
      })
    ).toBe(true)
    expect(
      hasSavedOnboardingDraft({
        getItem: key => (key === 'gaa_baseline_onboarding_draft' ? '{"step":1}' : null),
      })
    ).toBe(true)
    expect(
      hasSavedOnboardingDraft({
        getItem: () => {
          throw new Error('SecurityError')
        },
      })
    ).toBe(false)
  })

  it('caps Today Workout Hero lift count to <= 4 and duration to 20m when Express Mode is active', () => {
    const standard = resolveCommandCenterHeroMeta({
      expressMode: false,
      activeDayExerciseCount: 6,
      activeWorkoutDurationMins: 58,
      planEstimatedDurationMins: 60,
    })
    expect(standard).toEqual({ displayedLiftCount: 6, estimatedMins: 58 })

    const express = resolveCommandCenterHeroMeta({
      expressMode: true,
      activeDayExerciseCount: 6,
      activeWorkoutDurationMins: 58,
      planEstimatedDurationMins: 60,
    })
    expect(express).toEqual({ displayedLiftCount: 4, estimatedMins: 20 })

    const shortExpress = resolveCommandCenterHeroMeta({
      expressMode: true,
      activeDayExerciseCount: 3,
      activeWorkoutDurationMins: 35,
    })
    expect(shortExpress).toEqual({ displayedLiftCount: 3, estimatedMins: 20 })
  })

  it('enforces HIPAA coach role checks, membership status projection, and 28-day chronic ACWR in dashboard server routes', () => {
    const dashboardPageSrc = fs.readFileSync(
      path.join(process.cwd(), 'app/(dashboard)/dashboard/page.tsx'),
      'utf8'
    )
    expect(dashboardPageSrc).toContain("'full_name, email, role, status, status_reason'")
    expect(dashboardPageSrc).not.toContain('user_metadata?.surface_role')
    expect(dashboardPageSrc).toContain('twentyEightDaysAgoDateStr')
    expect(dashboardPageSrc).toContain('chronicWorkloadTonnage')
    expect(dashboardPageSrc).toContain('hrv_rmssd_ms')

    const dossierPageSrc = fs.readFileSync(
      path.join(process.cwd(), 'app/(dashboard)/dashboard/dossier/page.tsx'),
      'utf8'
    )
    expect(dossierPageSrc).not.toContain('user_metadata?.surface_role')
    expect(dossierPageSrc).toContain("eq('designated_coach_id', user.id)")
  })
})

