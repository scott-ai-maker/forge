import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Capacitor } from '@capacitor/core'
import {
  isNativePlatform,
  isNativeIOS,
  isNativeAndroid,
  isPwaStandalone,
  isCompanionApp,
  isHelperApp,
  canMakePurchases,
  getCompanionPlatform,
  getHelperPlatform,
  COMPANION_BILLING_DISCLOSURE,
  WEB_PORTAL_URL,
} from './native-companion'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
    getPlatform: vi.fn(),
  },
}))

describe('lib/native-companion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete (global as { window?: unknown }).window
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete (global as { window?: unknown }).window
  })

  it('exports valid web portal constants and compliant disclosure text', () => {
    expect(WEB_PORTAL_URL).toBe('https://forge-athletic.app')
    expect(COMPANION_BILLING_DISCLOSURE).toContain('Gym Companion')
    expect(COMPANION_BILLING_DISCLOSURE).toContain('forge-athletic.app')
  })

  describe('when running in Web browser environment', () => {
    beforeEach(() => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('web')
      ;(global as unknown as { window: unknown }).window = {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
        navigator: {} as Navigator,
        location: { search: '' } as Location,
      }
    })

    it('identifies as non-native web', () => {
      expect(isNativePlatform()).toBe(false)
      expect(isPwaStandalone()).toBe(false)
      expect(isCompanionApp()).toBe(false)
      expect(isHelperApp()).toBe(false)
      expect(isNativeIOS()).toBe(false)
      expect(isNativeAndroid()).toBe(false)
      expect(getCompanionPlatform()).toBe('web')
      expect(getHelperPlatform()).toBe('web')
    })

    it('permits purchases on web', () => {
      expect(canMakePurchases()).toBe(true)
    })
  })

  describe('when running in iOS native companion shell', () => {
    beforeEach(() => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('ios')
    })

    it('identifies as native iOS companion app', () => {
      expect(isNativePlatform()).toBe(true)
      expect(isCompanionApp()).toBe(true)
      expect(isHelperApp()).toBe(true)
      expect(isNativeIOS()).toBe(true)
      expect(isNativeAndroid()).toBe(false)
      expect(getCompanionPlatform()).toBe('ios')
      expect(getHelperPlatform()).toBe('ios')
    })

    it('strictly forbids in-app purchases on iOS companion', () => {
      expect(canMakePurchases()).toBe(false)
    })
  })

  describe('when running in Android native companion shell', () => {
    beforeEach(() => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android')
    })

    it('identifies as native Android companion app', () => {
      expect(isNativePlatform()).toBe(true)
      expect(isCompanionApp()).toBe(true)
      expect(isHelperApp()).toBe(true)
      expect(isNativeIOS()).toBe(false)
      expect(isNativeAndroid()).toBe(true)
      expect(getCompanionPlatform()).toBe('android')
      expect(getHelperPlatform()).toBe('android')
    })

    it('strictly forbids in-app purchases on Android companion', () => {
      expect(canMakePurchases()).toBe(false)
    })
  })

  describe('when running in standalone PWA helper app mode', () => {
    beforeEach(() => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('web')
    })

    it('detects standalone PWA via CSS display-mode: standalone media query', () => {
      ;(global as unknown as { window: unknown }).window = {
        matchMedia: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(display-mode: standalone)',
        })),
        navigator: {} as Navigator,
        location: { search: '' } as Location,
      }

      expect(isPwaStandalone()).toBe(true)
      expect(isCompanionApp()).toBe(true)
      expect(isHelperApp()).toBe(true)
      expect(getCompanionPlatform()).toBe('pwa')
      expect(getHelperPlatform()).toBe('pwa')
      expect(canMakePurchases()).toBe(false)
    })

    it('detects standalone PWA via iOS Safari navigator.standalone', () => {
      ;(global as unknown as { window: unknown }).window = {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
        navigator: { standalone: true } as unknown as Navigator,
        location: { search: '' } as Location,
      }

      expect(isPwaStandalone()).toBe(true)
      expect(isCompanionApp()).toBe(true)
      expect(isHelperApp()).toBe(true)
      expect(getCompanionPlatform()).toBe('pwa')
      expect(canMakePurchases()).toBe(false)
    })

    it('detects standalone PWA via URL query flag (source=pwa)', () => {
      ;(global as unknown as { window: unknown }).window = {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
        navigator: {} as Navigator,
        location: { search: '?source=pwa' } as Location,
      }

      expect(isPwaStandalone()).toBe(true)
      expect(isCompanionApp()).toBe(true)
      expect(isHelperApp()).toBe(true)
      expect(getCompanionPlatform()).toBe('pwa')
      expect(canMakePurchases()).toBe(false)
    })

    it('detects companion mode via URL query flag (mode=companion)', () => {
      ;(global as unknown as { window: unknown }).window = {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
        navigator: {} as Navigator,
        location: { search: '?mode=companion' } as Location,
      }

      expect(isPwaStandalone()).toBe(true)
      expect(isCompanionApp()).toBe(true)
      expect(isHelperApp()).toBe(true)
      expect(getCompanionPlatform()).toBe('pwa')
      expect(canMakePurchases()).toBe(false)
    })
  })
})
