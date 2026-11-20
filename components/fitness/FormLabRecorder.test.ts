import { beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  consumeFormLabCredit,
  FORGE_TIER_ENTITLEMENTS,
  getRemainingFormLabCredits,
  getUpgradeTriggerCopy,
  resetFormLabCreditsForQa,
} from '@/lib/tierEntitlements'

describe('FormLabRecorder Credit Metering, Watch Remote Guard & Hardware Safety', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear()
    }
    resetFormLabCreditsForQa()
  })

  it('enforces tier-specific Form Lab credit allowances and upgrade escalation paths', () => {
    expect(FORGE_TIER_ENTITLEMENTS.core_lab.monthlyFormLabCredits).toBe(1)
    expect(FORGE_TIER_ENTITLEMENTS.plus.monthlyFormLabCredits).toBe(4)
    expect(FORGE_TIER_ENTITLEMENTS.coach_support.monthlyFormLabCredits).toBe(8)
    expect(FORGE_TIER_ENTITLEMENTS.coach_support.priority24hSla).toBe(true)

    expect(getUpgradeTriggerCopy('form_lab_credit_depletion', 'core_lab').recommendedTier).toBe(
      'plus'
    )
    expect(getUpgradeTriggerCopy('form_lab_credit_depletion', 'plus').recommendedTier).toBe(
      'coach_support'
    )
  })

  it('gates passive Apple Watch active broadcasts, enforces 100MB video cap, and keeps male SVG athlete shirted', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'components/fitness/FormLabRecorder.tsx'),
      'utf-8'
    )

    // Watch camera remote activates ONLY when cameraDrawerOpen || watchRecordingActive
    expect(source).toContain('const shouldBeActive = cameraDrawerOpen || watchRecordingActive')
    expect(source).toContain('MAX_VIDEO_FILE_BYTES = 100 * 1024 * 1024')
    expect(source).toContain('TELEMETRY_CAMERA_RELEASE_EVENT')
    expect(source).toContain("trackEvent(\n        'form_lab_uploaded'")
    expect(source).toContain('{ immediate: true }')
    expect(source).toContain('role="status"')
    expect(source).toContain('aria-live="polite"')
    expect(source).not.toContain('min-h-[36px]')

    // Brand & athlete wardrobe compliance (fitted charcoal crewneck t-shirt)
    expect(source).toContain('Fitted Charcoal Crewneck Performance T-Shirt')
    expect(source).not.toContain('Gordon Athletic')
    expect(source).not.toContain('GAA')

    // Verify helper credit functions remain safe in SSR/Node when window is absent
    if (typeof window !== 'undefined') {
      expect(getRemainingFormLabCredits('core_lab')).toBe(1)
      const first = consumeFormLabCredit('core_lab')
      expect(first.allowed).toBe(true)
      expect(first.remaining).toBe(0)
      const second = consumeFormLabCredit('core_lab')
      expect(second.allowed).toBe(false)
    } else {
      expect(getRemainingFormLabCredits('core_lab')).toBe(1)
    }
  })
})
