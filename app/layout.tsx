import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Raleway, Cinzel } from 'next/font/google'
import './globals.css'
import MobilePortraitLock from '@/components/ui/MobilePortraitLock'
import ServiceWorkerRegistrar from '@/components/ui/ServiceWorkerRegistrar'
import PwaInstallPrompt from '@/components/ui/PwaInstallPrompt'

const cinzel = Cinzel({
  weight: ['500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cinzel',
})

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bebas',
})

const raleway = Raleway({
  weight: ['300', '400', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-raleway',
})

export const metadata: Metadata = {
  title: {
    default: 'Forge Athletic | Precision Sports Science For Real Lives',
    template: '%s | Forge Athletic',
  },
  description: 'Precision sports science for real lives — 5-phase NASM OPT™ periodization, 33-point 3D AI biomechanical screening, automated telemetry, and elite performance tools.',
  metadataBase: new URL('https://gordonathleticadvisory.com'),
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/images/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/images/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Forge Athletic',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Forge Athletic | Precision Sports Science For Real Lives',
    description: 'Olympic-caliber sports science and biomechanics engineered for real lives. 5-phase NASM OPT™ macrocycles, MediaPipe 3D AI biomechanics, and automated progression.',
    url: 'https://gordonathleticadvisory.com',
    siteName: 'Forge Athletic',
    type: 'website',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1344,
        height: 768,
        alt: 'Forge Athletic precision sports science visual',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Forge Athletic | Precision Sports Science For Real Lives',
    description: 'Olympic-caliber sports science and biomechanics engineered for real lives. 5-phase NASM OPT™ macrocycles, MediaPipe 3D AI biomechanics, and automated progression.',
    images: ['/images/og-image.jpg'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#080E14',
  viewportFit: 'cover',
}

const gaaStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'SportsActivityLocation',
  name: 'Forge Athletic',
  alternateName: 'Forge Athletic LLC',
  description: 'Precision sports science for real lives — 5-phase NASM OPT™ periodization, MediaPipe 33-point 3D AI biomechanical screening, and automated progression.',
  url: 'https://gordonathleticadvisory.com',
  logo: 'https://gordonathleticadvisory.com/images/icon-512.png',
  image: 'https://gordonathleticadvisory.com/images/og-image.jpg',
  founder: {
    '@type': 'Person',
    name: 'Scott Gordon',
    jobTitle: 'Head Coach & Founder',
  },
  knowsAbout: [
    'NASM OPT 5-Phase Periodization',
    'MediaPipe 33-Point 3D Postural & Kinetic Chain Screening',
    'Overhead Squat Biomechanical Diagnostics',
    'Closed-Loop Wearable Telemetry (Apple HealthKit & Health Connect)',
    'Tanaka Stage Cardiorespiratory Conditioning',
    'Ergogenic Chrono-Dosing & Travel Recalibration',
    'Executive Physique & Athletic Longevity Architecture',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${bebasNeue.variable} ${raleway.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Apple iOS PWA / Standalone Web App Splash Screens */}
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1290-2796.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1179-2556.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1284-2778.png" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1170-2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1125-2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1242-2688.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-828-1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1242-2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-750-1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-640-1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-2048-2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1668-2388.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1640-2360.png" media="(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1620-2160.png" media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1536-2048.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1488-2266.png" media="(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(gaaStructuredData) }}
        />
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#C5A059] focus:text-[#080E14] focus:font-bold focus:rounded focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>
        <MobilePortraitLock />
        <ServiceWorkerRegistrar />
        <PwaInstallPrompt />
        {children}
      </body>
    </html>
  )
}

