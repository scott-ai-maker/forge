import { describe, expect, it, vi } from 'vitest'
import {
  IOS_STILL_CAMERA_STEPS,
  ANDROID_STILL_CAMERA_STEPS,
} from '@/lib/camera-still-mode'

describe('LiveStillCameraGuidanceModal Architecture', () => {
  it('supplies complete instructions for iOS Center Stage eradication', () => {
    expect(IOS_STILL_CAMERA_STEPS).toHaveLength(3)
    const titles = IOS_STILL_CAMERA_STEPS.map(s => s.title)
    expect(titles).toContain('Open Control Center')
    expect(titles).toContain('Tap Video Effects')
    expect(titles).toContain('Turn Center Stage OFF')
  })

  it('supplies complete instructions for Android Auto-Framing eradication', () => {
    expect(ANDROID_STILL_CAMERA_STEPS).toHaveLength(3)
    const titles = ANDROID_STILL_CAMERA_STEPS.map(s => s.title)
    expect(titles).toContain('Open Video Call Effects')
    expect(titles).toContain('Disable Auto-Framing')
    expect(titles).toContain('Return to Studio')
  })

  it('formats coach request prompt dynamically', () => {
    function formatCoachRequest(coachName: string) {
      return `${coachName} needs a static wide-angle view. Phone auto-zoom / auto-follow (Center Stage) disrupts kinetic chain tracking.`
    }

    expect(formatCoachRequest('Coach Scott Gordon')).toContain('Coach Scott Gordon')
    expect(formatCoachRequest('Coach Scott Gordon')).toContain('Center Stage')
  })
})

