/**
 * Gordon Athletic Advisory — Screen Wake Lock Utility
 * 
 * Manages W3C Screen Wake Lock API to prevent devices from auto-dimming
 * and sleeping during workouts, cardio runs, and live athletic sessions.
 * Gracefully handles visibility changes and unsupported platforms.
 */

let wakeLockSentinel: any = null

/**
 * Requests a screen wake lock from the browser.
 * Returns true if acquired successfully, false otherwise.
 */
export async function requestScreenWakeLock(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  if (!('wakeLock' in navigator)) return false

  try {
    // If already holding an active sentinel that is not released, return true
    if (wakeLockSentinel && !wakeLockSentinel.released) {
      return true
    }

    const lock = await (navigator as any).wakeLock.request('screen')
    wakeLockSentinel = lock

    lock.addEventListener('release', () => {
      if (wakeLockSentinel === lock) {
        wakeLockSentinel = null
      }
    })

    return true
  } catch {
    wakeLockSentinel = null
    return false
  }
}

/**
 * Releases any currently held screen wake lock.
 */
export async function releaseScreenWakeLock(): Promise<void> {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release()
    } catch {
      // Ignore release errors
    }
    wakeLockSentinel = null
  }
}

/**
 * Returns true if a screen wake lock is currently active.
 */
export function isScreenWakeLockActive(): boolean {
  return !!(wakeLockSentinel && !wakeLockSentinel.released)
}
