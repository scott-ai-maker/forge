export interface CoachBackgroundPreset {
  id: string
  name: string
  tagline: string
  category: 'Facility' | 'Executive Suite' | 'Diagnostic Lab' | 'Minimalist' | 'Blur'
  thumbnailStyle: React.CSSProperties
  backgroundStyle: React.CSSProperties
  imageUrl?: string
  isBlur?: boolean
  badge: string
  logoPosition?: 'wall-plaque-right' | 'center-plaque' | 'top-right' | 'center-top'
}

const BRAND_LOGO = '/images/gaa-brand-crest.jpg'

export const COACH_BACKGROUND_PRESETS: CoachBackgroundPreset[] = [
  {
    id: 'olympic-facility',
    name: 'Olympic Performance Facility',
    tagline: 'Calibrated gold plates, custom power racks & Forge Athletic wall crest',
    category: 'Facility',
    imageUrl: '/images/backgrounds/coach-olympic-facility-gaa.jpg',
    badge: 'Autonomous & Performance',
    logoPosition: 'wall-plaque-right',
    thumbnailStyle: {
      backgroundImage: `url('${BRAND_LOGO}'), url(/images/backgrounds/coach-olympic-facility-gaa.jpg)`,
      backgroundSize: '42px 42px, cover',
      backgroundRepeat: 'no-repeat, no-repeat',
      backgroundPosition: 'calc(100% - 24px) 38%, center',
    },
    backgroundStyle: {
      backgroundImage: `url(/images/backgrounds/coach-olympic-facility-gaa.jpg)`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center, center',
    },
  },
  {
    id: 'diagnostic-lab',
    name: 'Biomechanics Diagnostic Lab',
    tagline: 'Dual 3D kinetic wireframe telemetry displays, force plates & illuminated GAA crest',
    category: 'Diagnostic Lab',
    imageUrl: '/images/backgrounds/coach-diagnostic-lab.jpg',
    badge: 'Kinetic Movement Diagnostic',
    logoPosition: 'center-plaque',
    thumbnailStyle: {
      backgroundImage: `url('${BRAND_LOGO}'), url(/images/backgrounds/coach-diagnostic-lab.jpg)`,
      backgroundSize: '42px 42px, cover',
      backgroundRepeat: 'no-repeat, no-repeat',
      backgroundPosition: 'center 38%, center',
    },
    backgroundStyle: {
      backgroundImage: `url(/images/backgrounds/coach-diagnostic-lab.jpg)`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center, center',
    },
  },
  {
    id: 'hybrid-concierge',
    name: 'Hybrid Concierge Sanctuary',
    tagline: 'Walnut wood acoustic slats, brass collar weights, skyline vista & backlit GAA crest',
    category: 'Facility',
    imageUrl: '/images/backgrounds/coach-hybrid-concierge.jpg',
    badge: 'Hybrid Concierge',
    logoPosition: 'center-plaque',
    thumbnailStyle: {
      backgroundImage: `url('${BRAND_LOGO}'), url(/images/backgrounds/coach-hybrid-concierge.jpg)`,
      backgroundSize: '42px 42px, cover',
      backgroundRepeat: 'no-repeat, no-repeat',
      backgroundPosition: 'center 38%, center',
    },
    backgroundStyle: {
      backgroundImage: `url(/images/backgrounds/coach-hybrid-concierge.jpg)`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center, center',
    },
  },
  {
    id: 'executive-suite',
    name: 'Executive 1:1 Master Suite',
    tagline: 'Nero Marquina marble, bespoke power cage, cognac leather lounger & gold GAA crest',
    category: 'Executive Suite',
    imageUrl: '/images/backgrounds/coach-executive-suite.jpg',
    badge: 'Executive 1:1 Master',
    logoPosition: 'center-plaque',
    thumbnailStyle: {
      backgroundImage: `url('${BRAND_LOGO}'), url(/images/backgrounds/coach-executive-suite.jpg)`,
      backgroundSize: '42px 42px, cover',
      backgroundRepeat: 'no-repeat, no-repeat',
      backgroundPosition: 'calc(100% - 24px) 38%, center',
    },
    backgroundStyle: {
      backgroundImage: `url(/images/backgrounds/coach-executive-suite.jpg)`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center, center',
    },
  },
  {
    id: 'corporate-lounge',
    name: 'Corporate Performance Lounge',
    tagline: 'Fluted stone, executive resilience telemetry screens, dusk skyline & illuminated GAA crest',
    category: 'Executive Suite',
    imageUrl: '/images/backgrounds/coach-corporate-lounge.jpg',
    badge: 'Corporate Executive',
    logoPosition: 'center-plaque',
    thumbnailStyle: {
      backgroundImage: `url('${BRAND_LOGO}'), url(/images/backgrounds/coach-corporate-lounge.jpg)`,
      backgroundSize: '42px 42px, cover',
      backgroundRepeat: 'no-repeat, no-repeat',
      backgroundPosition: 'center 38%, center',
    },
    backgroundStyle: {
      backgroundImage: `url(/images/backgrounds/coach-corporate-lounge.jpg)`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center, center',
    },
  },
  {
    id: 'studio-blur',
    name: 'DSLR Portrait Bokeh Blur',
    tagline: 'Authentic 85mm f/1.4 optical depth-of-field background blur with edge anti-aliasing',
    category: 'Blur',
    isBlur: true,
    badge: 'Zoom / Teams Standard',
    thumbnailStyle: {
      background: 'radial-gradient(circle at center, #1E293B 0%, #0F172A 100%)',
      filter: 'blur(1px)',
    },
    backgroundStyle: {
      background: 'rgba(15, 23, 42, 0.8)',
    },
  },
]
