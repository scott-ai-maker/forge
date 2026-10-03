import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Forge Athletic',
    short_name: 'Forge',
    description: 'Training tools, performance telemetry, and movement coaching from Forge Athletic.',
    start_url: '/dashboard/fitness?source=pwa',
    id: '/companion',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'window-controls-overlay'],
    background_color: '#080E14',
    theme_color: '#080E14',
    orientation: 'portrait',
    categories: ['fitness', 'health', 'lifestyle', 'sports'],
    icons: [
      {
        src: '/images/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/images/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
    shortcuts: [
      {
        name: "Today's Workout",
        short_name: 'Workout',
        description: 'Execute active workout & set logger',
        url: '/dashboard/fitness?source=pwa&workspace=train',
        icons: [{ src: '/images/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Biometrics & Readiness',
        short_name: 'Biometrics',
        description: 'View wearable telemetry & recovery',
        url: '/dashboard/fitness?source=pwa&workspace=readiness',
        icons: [{ src: '/images/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Concierge Messages',
        short_name: 'Messages',
        description: 'Direct encrypted line with Coach Gordon',
        url: '/dashboard/messages?source=pwa',
        icons: [{ src: '/images/icon-192.png', sizes: '192x192' }],
      },
    ],
  }
}
