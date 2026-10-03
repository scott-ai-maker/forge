/**
 * Gordon Athletic Advisory — Still Camera & Auto-Zoom Prevention Engine
 *
 * Provides programmatic W3C PTZ / digital zoom locking to 1.0x (unzoomed, static wide),
 * platform detection (iOS vs. Android), step-by-step guidance metadata for disabling
 * Apple Center Stage (iOS Control Center) and Samsung Auto-Framing (Video Call Effects),
 * and real-time signaling event contracts between Coach and Athlete.
 */

export const STILL_CAMERA_REQUEST_EVENT = 'still_camera_request'

export interface StillCameraRequestPayload {
  coachName: string
  timestamp: number
  reason?: string
}

export type MobileCameraPlatform = 'ios' | 'android' | 'desktop'

export interface StillCameraGuideStep {
  step: number
  title: string
  instruction: string
  detail?: string
}

export const IOS_STILL_CAMERA_STEPS: StillCameraGuideStep[] = [
  {
    step: 1,
    title: 'Open Control Center',
    instruction: 'Swipe down from the top-right corner of your iPhone/iPad screen while in this session.',
    detail: 'Do not close the browser; simply pull down the Control Center shade.',
  },
  {
    step: 2,
    title: 'Tap Video Effects',
    instruction: 'Tap the green camera icon or "Video Effects" pill at the top of Control Center.',
    detail: 'This control only appears when your camera is actively streaming.',
  },
  {
    step: 3,
    title: 'Turn Center Stage OFF',
    instruction: 'Tap "Center Stage" to toggle it OFF. Also make sure "Portrait" mode is OFF.',
    detail: 'Apple will remember this preference for GAA Live Studio so your camera stays completely still.',
  },
]

export const ANDROID_STILL_CAMERA_STEPS: StillCameraGuideStep[] = [
  {
    step: 1,
    title: 'Open Video Call Effects',
    instruction: 'Tap the floating camera effects icon on your screen, or swipe down your notification shade.',
    detail: 'Samsung One UI and Google Pixel show video controls when the camera is engaged.',
  },
  {
    step: 2,
    title: 'Disable Auto-Framing',
    instruction: 'Toggle "Auto-framing" or "Auto-zoom" to OFF.',
    detail: 'This locks the camera to a fixed, unzoomed wide angle for movement analysis.',
  },
  {
    step: 3,
    title: 'Return to Studio',
    instruction: 'Swipe up or tap back to return to your live coaching feed.',
    detail: 'Your full body from overhead extension to feet will now remain in still view.',
  },
]

/**
 * Detects whether the current device is iOS (iPhone/iPad/iPod), Android, or Desktop.
 */
export function detectStillCameraPlatform(userAgent?: string): MobileCameraPlatform {
  const ua = (
    userAgent ||
    (typeof navigator !== 'undefined' ? navigator.userAgent || navigator.vendor || '' : '')
  ).toLowerCase()

  // Detect iOS (including iPadOS where userAgent says Macintosh but has touch points)
  const isIos =
    /iphone|ipad|ipod/.test(ua) ||
    (typeof navigator !== 'undefined' &&
      navigator.platform === 'MacIntel' &&
      navigator.maxTouchPoints > 1)

  if (isIos) {
    return 'ios'
  }

  if (/android/.test(ua)) {
    return 'android'
  }

  return 'desktop'
}

/**
 * Applies W3C PTZ (Pan/Tilt/Zoom) constraints to lock the camera to 1.0x (unzoomed, static wide).
 * Hardware/OS auto-framing (Apple Center Stage, Samsung Video Effects) cannot be toggled via JS,
 * but this ensures any browser/driver-level digital zoom is forcefully constrained to 1.0x still.
 */
export async function applyStillCameraConstraints(track: MediaStreamTrack | null | undefined): Promise<boolean> {
  if (!track || track.kind !== 'video') return false

  try {
    if (typeof track.getCapabilities !== 'function' || typeof track.applyConstraints !== 'function') {
      return false
    }

    const capabilities = track.getCapabilities() as {
      zoom?: { min?: number; max?: number }
      pan?: { min?: number; max?: number }
      tilt?: { min?: number; max?: number }
    }

    const advancedConstraints: Record<string, unknown> = {}
    let hasApplied = false

    if (capabilities?.zoom) {
      // Force zoom to minimum (typically 1.0x wide field of view)
      const minZoom = typeof capabilities.zoom.min === 'number' ? capabilities.zoom.min : 1.0
      advancedConstraints.zoom = minZoom
      hasApplied = true
    }

    if (capabilities?.pan && typeof capabilities.pan.min === 'number') {
      advancedConstraints.pan = 0
      hasApplied = true
    }

    if (capabilities?.tilt && typeof capabilities.tilt.min === 'number') {
      advancedConstraints.tilt = 0
      hasApplied = true
    }

    if (hasApplied) {
      await track.applyConstraints({
        advanced: [advancedConstraints],
      } as MediaTrackConstraints)
      return true
    }

    return false
  } catch (err) {
    // PTZ constraints are gracefully ignored on hardware that doesn't permit programmatic zoom override
    console.debug('Still camera constraints application skipped:', err)
    return false
  }
}

