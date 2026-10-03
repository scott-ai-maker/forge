import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  requestScreenWakeLock,
  releaseScreenWakeLock,
  isScreenWakeLockActive,
} from './screen-wake-lock'

describe('lib/screen-wake-lock', () => {
  const originalWindow = global.window
  const originalNavigator = global.navigator

  beforeEach(async () => {
    await releaseScreenWakeLock()
    vi.restoreAllMocks()
  })

  afterEach(async () => {
    await releaseScreenWakeLock()
    Object.defineProperty(global, 'window', {
      value: originalWindow,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    })
  })

  it('returns false gracefully if navigator or wakeLock is not available', async () => {
    Object.defineProperty(global, 'window', {
      value: {},
      configurable: true,
      writable: true,
    })
    Object.defineProperty(global, 'navigator', {
      value: {},
      configurable: true,
      writable: true,
    })

    const acquired = await requestScreenWakeLock()
    expect(acquired).toBe(false)
    expect(isScreenWakeLockActive()).toBe(false)
  })

  it('acquires and releases wake lock when navigator.wakeLock is supported', async () => {
    let released = false
    const mockSentinel = {
      get released() {
        return released
      },
      release: vi.fn().mockImplementation(async () => {
        released = true
      }),
      addEventListener: vi.fn(),
    }

    const mockRequest = vi.fn().mockResolvedValue(mockSentinel)

    Object.defineProperty(global, 'window', {
      value: {},
      configurable: true,
      writable: true,
    })
    Object.defineProperty(global, 'navigator', {
      value: {
        wakeLock: {
          request: mockRequest,
        },
      },
      configurable: true,
      writable: true,
    })

    const acquired = await requestScreenWakeLock()
    expect(acquired).toBe(true)
    expect(mockRequest).toHaveBeenCalledWith('screen')
    expect(isScreenWakeLockActive()).toBe(true)

    // Re-requesting when already active returns true without duplicate request
    const reacquired = await requestScreenWakeLock()
    expect(reacquired).toBe(true)
    expect(mockRequest).toHaveBeenCalledTimes(1)

    // Release wake lock
    await releaseScreenWakeLock()
    expect(mockSentinel.release).toHaveBeenCalled()
    expect(isScreenWakeLockActive()).toBe(false)
  })

  it('handles request failure without throwing and leaves state inactive', async () => {
    const mockRequest = vi.fn().mockRejectedValue(new Error('NotAllowedError: permission denied'))

    Object.defineProperty(global, 'window', {
      value: {},
      configurable: true,
      writable: true,
    })
    Object.defineProperty(global, 'navigator', {
      value: {
        wakeLock: {
          request: mockRequest,
        },
      },
      configurable: true,
      writable: true,
    })

    const acquired = await requestScreenWakeLock()
    expect(acquired).toBe(false)
    expect(isScreenWakeLockActive()).toBe(false)
  })
})
