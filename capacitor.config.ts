import type { CapacitorConfig } from '@capacitor/cli'

const defaultServerUrl = process.env.CAPACITOR_SERVER_URL
  ? (process.env.CAPACITOR_SERVER_URL.includes('/dashboard')
      ? process.env.CAPACITOR_SERVER_URL
      : `${process.env.CAPACITOR_SERVER_URL.replace(/\/$/, '')}/dashboard/fitness?source=native`)
  : 'https://forge-athletic.app/dashboard/fitness?source=native'

const config: CapacitorConfig = {
  appId: 'com.gordonathletic.app',
  appName: 'Forge Athletic',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    url: defaultServerUrl,
    cleartext: true,
    allowNavigation: [
      'forge-athletic.app',
      '*.forge-athletic.app',
      '*.supabase.co',
      'accounts.google.com',
      '*.google.com',
      '*.googleusercontent.com',
      'appleid.apple.com',
      '*.apple.com',
    ],
  },
  ios: {
    contentInset: 'never',
    scrollEnabled: true,
    backgroundColor: '#080E14',
    preferredContentMode: 'mobile',
    scheme: 'com.gordonathletic.app',
  },
  android: {
    backgroundColor: '#080E14',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: process.env.NODE_ENV === 'development',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#080E14',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
    GAAHealthKit: {
      backgroundSyncIntervalMinutes: 60,
      autoSyncOnResume: true,
      endpointUrl: '/api/wearables/sync',
    },
  },
}

export default config
