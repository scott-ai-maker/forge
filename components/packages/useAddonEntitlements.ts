'use client'

import { useCallback, useEffect, useState } from 'react'
import type { FeatureAccess } from '@/lib/addon-entitlements'
import type { ForgeAddonFeature } from '@/lib/forge-addons'

export type AddonFeatureMap = Record<ForgeAddonFeature, FeatureAccess>

export function useAddonEntitlements() {
  const [features, setFeatures] = useState<AddonFeatureMap | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/account/entitlements', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setFeatures(data.features as AddonFeatureMap)
    } catch {
      // Leave features unresolved; the UI keeps showing the locked state.
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { features, loading: features === null, refresh }
}
