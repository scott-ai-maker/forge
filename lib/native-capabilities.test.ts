import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  hapticTap,
  hapticImpact,
  hapticNotification,
  hapticSelection,
  hapticRestTimerTick,
  getNativeDeviceInfo,
  getNativeBatteryInfo,
  getNativeNetworkStatus,
  subscribeToNetworkStatus,
  requestKeepAwake,
  releaseKeepAwake,
  configureNativeStatusBar,
  onAppResume,
  onAppUrlOpen,
  onAndroidBackButton,
  checkNativeTelemetryReadiness,
} from './native-capabilities'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { Device } from '@capacitor/device'
import { Network } from '@capacitor/network'
import { StatusBar, Style } from '@capacitor/status-bar'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import * as HealthBridge from './native-healthkit-bridge'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
    getPlatform: vi.fn(),
  },
  registerPlugin: vi.fn(() => ({})),
}))

vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    impact: vi.fn(),
    notification: vi.fn(),
    selectionChanged: vi.fn(),
  },
  ImpactStyle: {
    Light: 'LIGHT',
    Medium: 'MEDIUM',
    Heavy: 'HEAVY',
  },
  NotificationType: {
    Success: 'SUCCESS',
    Warning: 'WARNING',
    Error: 'ERROR',
  },
}))

vi.mock('@capacitor/device', () => ({
  Device: {
    getInfo: vi.fn(),
    getBatteryInfo: vi.fn(),
  },
}))

vi.mock('@capacitor/network', () => ({
  Network: {
    getStatus: vi.fn(),
    addListener: vi.fn(),
  },
}))

vi.mock('@capacitor/status-bar', () => ({
  StatusBar: {
    setStyle: vi.fn(),
    setBackgroundColor: vi.fn(),
  },
  Style: {
    Dark: 'DARK',
    Light: 'LIGHT',
  },
}))

vi.mock('@capacitor/app', () => ({
  App: {
    getInfo: vi.fn(),
    addListener: vi.fn(),
  },
}))

describe('Native Capabilities & Telemetry Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Hardware Haptics Engine', () => {
    it('dispatches light impact on native mobile tap', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      await hapticTap()
      expect(Haptics.impact).toHaveBeenCalledWith({ style: ImpactStyle.Light })
    })

    it('dispatches variable impacts (heavy, medium, light)', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)

      await hapticImpact('heavy')
      expect(Haptics.impact).toHaveBeenCalledWith({ style: ImpactStyle.Heavy })

      await hapticImpact('medium')
      expect(Haptics.impact).toHaveBeenCalledWith({ style: ImpactStyle.Medium })

      await hapticImpact('light')
      expect(Haptics.impact).toHaveBeenCalledWith({ style: ImpactStyle.Light })
    })

    it('dispatches notifications (success, warning, error)', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)

      await hapticNotification('SUCCESS')
      expect(Haptics.notification).toHaveBeenCalledWith({ type: NotificationType.Success })

      await hapticNotification('WARNING')
      expect(Haptics.notification).toHaveBeenCalledWith({ type: NotificationType.Warning })

      await hapticNotification('ERROR')
      expect(Haptics.notification).toHaveBeenCalledWith({ type: NotificationType.Error })
    })

    it('dispatches selection tick and rest timer tick', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)

      await hapticSelection()
      expect(Haptics.selectionChanged).toHaveBeenCalled()

      await hapticRestTimerTick()
      expect(Haptics.impact).toHaveBeenCalledWith({ style: ImpactStyle.Medium })
    })
  })

  describe('Device & Battery Telemetry', () => {
    it('queries native iOS device information', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('ios')
      vi.mocked(Device.getInfo).mockResolvedValue({
        model: 'iPhone 16 Pro',
        platform: 'ios',
        operatingSystem: 'ios',
        osVersion: '18.2',
        manufacturer: 'Apple',
        isVirtual: false,
        memUsed: 1024,
      } as any)
      vi.mocked(App.getInfo).mockResolvedValue({
        version: '1.36.1',
        build: '42',
        id: 'com.gordonathletic.app',
        name: 'Forge Athletic',
      })

      const info = await getNativeDeviceInfo()
      expect(info.model).toBe('iPhone 16 Pro')
      expect(info.platform).toBe('ios')
      expect(info.osVersion).toBe('18.2')
      expect(info.manufacturer).toBe('Apple')
      expect(info.appVersion).toBe('1.36.1')
    })

    it('queries native Android device information', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android')
      vi.mocked(Device.getInfo).mockResolvedValue({
        model: 'Pixel 9 Pro',
        platform: 'android',
        operatingSystem: 'android',
        osVersion: '15.0',
        manufacturer: 'Google',
        isVirtual: false,
        memUsed: 2048,
      } as any)
      vi.mocked(App.getInfo).mockResolvedValue({
        version: '1.36.1',
        build: '42',
        id: 'com.gordonathletic.app',
        name: 'Forge Athletic',
      })

      const info = await getNativeDeviceInfo()
      expect(info.model).toBe('Pixel 9 Pro')
      expect(info.platform).toBe('android')
      expect(info.manufacturer).toBe('Google')
    })

    it('queries native battery telemetry with percentage conversion', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Device.getBatteryInfo).mockResolvedValue({
        batteryLevel: 0.85,
        isCharging: true,
      })

      const battery = await getNativeBatteryInfo()
      expect(battery.batteryLevelPercent).toBe(85)
      expect(battery.isCharging).toBe(true)
    })
  })

  describe('Network Telemetry & Connectivity', () => {
    it('retrieves network status', async () => {
      vi.mocked(Network.getStatus).mockResolvedValue({
        connected: true,
        connectionType: 'wifi',
      })

      const net = await getNativeNetworkStatus()
      expect(net.connected).toBe(true)
      expect(net.connectionType).toBe('wifi')
    })

    it('subscribes to network status changes and returns unsubscribe cleanup', async () => {
      const mockRemove = vi.fn()
      vi.mocked(Network.addListener).mockResolvedValue({ remove: mockRemove })

      const callback = vi.fn()
      const unsubscribe = subscribeToNetworkStatus(callback)

      expect(typeof unsubscribe).toBe('function')
    })
  })

  describe('Screen Keep-Awake & Wake Lock', () => {
    it('requests screen wake lock safely', async () => {
      const mockRelease = vi.fn()
      const mockWakeLock = {
        release: mockRelease,
        addEventListener: vi.fn(),
      }
      const requestMock = vi.fn().mockResolvedValue(mockWakeLock)
      vi.stubGlobal('navigator', {
        wakeLock: { request: requestMock },
      })

      try {
        const granted = await requestKeepAwake()
        expect(granted).toBe(true)
        expect(requestMock).toHaveBeenCalledWith('screen')

        await releaseKeepAwake()
        expect(mockRelease).toHaveBeenCalled()
      } finally {
        vi.unstubAllGlobals()
      }
    })
  })

  describe('Native Status Bar Theming', () => {
    it('configures dark obsidian status bar on iOS', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('ios')

      await configureNativeStatusBar()
      expect(StatusBar.setStyle).toHaveBeenCalledWith({ style: Style.Dark })
      expect(StatusBar.setBackgroundColor).not.toHaveBeenCalled()
    })

    it('configures dark obsidian status bar on Android with background color', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android')

      await configureNativeStatusBar()
      expect(StatusBar.setStyle).toHaveBeenCalledWith({ style: Style.Dark })
      expect(StatusBar.setBackgroundColor).toHaveBeenCalledWith({ color: '#080E14' })
    })
  })

  describe('App Lifecycle & Deep Linking', () => {
    it('subscribes to onAppResume on native mobile', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(App.addListener).mockImplementation(((event: string, cb: any) => {
        if (event === 'appStateChange') {
          // Simulate active state
          cb({ isActive: true })
        }
        return Promise.resolve({ remove: vi.fn() })
      }) as any)

      const callback = vi.fn()
      onAppResume(callback)

      // Allow microtask to resolve
      await new Promise(r => setTimeout(r, 0))
      expect(callback).toHaveBeenCalled()
    })

    it('subscribes to onAppUrlOpen for deep linking', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(App.addListener).mockImplementation(((event: string, cb: any) => {
        if (event === 'appUrlOpen') {
          cb({ url: 'forge://workout/start' })
        }
        return Promise.resolve({ remove: vi.fn() })
      }) as any)

      const callback = vi.fn()
      onAppUrlOpen(callback)

      await new Promise(r => setTimeout(r, 0))
      expect(callback).toHaveBeenCalledWith('forge://workout/start')
    })

    it('intercepts backButton on Android', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android')
      vi.mocked(App.addListener).mockImplementation(((event: string, cb: any) => {
        if (event === 'backButton') {
          cb({ canGoBack: true })
        }
        return Promise.resolve({ remove: vi.fn() })
      }) as any)

      const handler = vi.fn()
      onAndroidBackButton(handler)

      await new Promise(r => setTimeout(r, 0))
      expect(handler).toHaveBeenCalledWith(true)
    })
  })

  describe('Unified Telemetry Readiness Diagnostic Harness', () => {
    it('verifies telemetry readiness report on native iOS with HealthKit', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('ios')

      vi.spyOn(HealthBridge, 'isNativeHealthKitAvailable').mockResolvedValue(true)
      vi.spyOn(HealthBridge, 'getNativeHealthKitStatus').mockResolvedValue({
        authorized: true,
        status: 'authorized',
      })
      vi.spyOn(HealthBridge, 'getNativeTelemetryDiagnostics').mockResolvedValue({
        platform: 'ios',
        healthKitAvailable: true,
        authorizationStatus: 'authorized',
        backgroundDeliveryEnabled: true,
        backgroundSyncIntervalMinutes: 60,
        backendUrl: 'https://forge-athletic.app/api/wearables/sync',
        lastSyncTimestamp: '2026-10-10T11:00:00.000Z',
        telemetryReady: true,
      })

      vi.mocked(Device.getInfo).mockResolvedValue({
        model: 'iPhone 16 Pro',
        platform: 'ios',
        operatingSystem: 'ios',
        osVersion: '18.2',
        manufacturer: 'Apple',
        isVirtual: false,
      } as any)
      vi.mocked(Device.getBatteryInfo).mockResolvedValue({
        batteryLevel: 0.9,
        isCharging: false,
      })
      vi.mocked(Network.getStatus).mockResolvedValue({
        connected: true,
        connectionType: 'wifi',
      })

      const report = await checkNativeTelemetryReadiness()

      expect(report.isNative).toBe(true)
      expect(report.platform).toBe('ios')
      expect(report.healthHardwareAvailable).toBe(true)
      expect(report.authorizationStatus).toBe('authorized')
      expect(report.backgroundDeliveryActive).toBe(true)
      expect(report.telemetryReady).toBe(true)
      expect(report.battery.levelPercent).toBe(90)
      expect(report.network.connected).toBe(true)
      expect(report.diagnosticsSummary).toContain('IOS telemetry is FULLY ACTIVE')
    })

    it('verifies telemetry readiness report on native Android with Health Connect', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android')

      vi.spyOn(HealthBridge, 'isNativeHealthKitAvailable').mockResolvedValue(true)
      vi.spyOn(HealthBridge, 'getNativeHealthKitStatus').mockResolvedValue({
        authorized: true,
        status: 'authorized',
      })
      vi.spyOn(HealthBridge, 'getNativeTelemetryDiagnostics').mockResolvedValue({
        platform: 'android',
        healthKitAvailable: true,
        authorizationStatus: 'authorized',
        backgroundDeliveryEnabled: true,
        backgroundSyncIntervalMinutes: 60,
        backendUrl: 'https://forge-athletic.app/api/wearables/sync',
        lastSyncTimestamp: '2026-10-10T11:00:00.000Z',
        telemetryReady: true,
      })

      vi.mocked(Device.getInfo).mockResolvedValue({
        model: 'Pixel 9 Pro',
        platform: 'android',
        operatingSystem: 'android',
        osVersion: '15.0',
        manufacturer: 'Google',
        isVirtual: false,
      } as any)
      vi.mocked(Device.getBatteryInfo).mockResolvedValue({
        batteryLevel: 0.75,
        isCharging: true,
      })
      vi.mocked(Network.getStatus).mockResolvedValue({
        connected: true,
        connectionType: 'cellular',
      })

      const report = await checkNativeTelemetryReadiness()

      expect(report.isNative).toBe(true)
      expect(report.platform).toBe('android')
      expect(report.telemetryReady).toBe(true)
      expect(report.battery.levelPercent).toBe(75)
      expect(report.battery.isCharging).toBe(true)
      expect(report.network.connectionType).toBe('cellular')
      expect(report.diagnosticsSummary).toContain('ANDROID telemetry is FULLY ACTIVE')
    })
  })
})
