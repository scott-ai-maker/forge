'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { clearOfflineQueue } from '@/lib/offline-sync-queue'
import { teardownNativeHealthSyncOnLogout } from '@/lib/native-healthkit-bridge'
import { clearTelemetryQueue } from '@/src/lib/telemetry/telemetryClient'

const EXPLICIT_SENSITIVE_STORAGE_KEYS = [
  'forge_posture_profile_v1',
  'forge_tier_preview_v1',
  'gaa_parq_answers',
  'gaa_baseline_onboarding_draft',
  'gaa_custom_spotify_links_v1',
]

const SENSITIVE_STORAGE_PREFIXES = [
  'sgf_posture_photos_',
  'forge_posture_',
  'forge_health_',
  'forge_intake_',
  'forge_parq_',
  'gaa_parq_',
  'gaa_health_',
  'gaa_posture_',
]

export function purgeClientHealthStorageOnLogout(): void {
  if (typeof window === 'undefined') return

  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      for (const key of EXPLICIT_SENSITIVE_STORAGE_KEYS) {
        storage.removeItem(key)
      }
      const keysToRemove: string[] = []
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i)
        if (key && SENSITIVE_STORAGE_PREFIXES.some(prefix => key.startsWith(prefix))) {
          keysToRemove.push(key)
        }
      }
      for (const key of keysToRemove) {
        storage.removeItem(key)
      }
    } catch {
      // Ignore storage access errors in restricted private-browsing contexts
    }
  }
}

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    clearOfflineQueue()
    purgeClientHealthStorageOnLogout()
    await Promise.allSettled([
      clearTelemetryQueue(),
      teardownNativeHealthSyncOnLogout(),
    ])
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="tactile-btn"
      style={{
        padding: '6px 14px',
        background: 'rgba(13, 27, 42, 0.55)',
        border: '1px solid var(--navy-lt)',
        borderRadius: 4,
        color: 'var(--gray)',
        fontFamily: 'Raleway, sans-serif',
        fontWeight: 600,
        fontSize: 12,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      Sign Out
    </button>
  )
}
