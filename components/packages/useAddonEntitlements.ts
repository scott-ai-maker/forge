'use client'

import { useCallback, useEffect, useState } from 'react'
import type { FeatureAccess } from '@/lib/addon-entitlements'
import type { ForgeAddonFeature } from '@/lib/forge-addons'

export type AddonFeatureMap = Record<ForgeAddonFeature, FeatureAccess>

export function useAddonEntitlements(enabled = true) {
  const [features, setFeatures] = useState<AddonFeatureMap | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('/api/account/entitlements', { cache: 'no-store' })
      if (res.status === 401) {
        console.warn('Add-on access check requires a signed-in session.')
        setFeatures(null)
        setError('Please sign in to check access to this tool, then retry.')
        return
      }
      if (!res.ok) throw new Error(`Entitlements request failed (${res.status})`)
      const data = await res.json()
      setFeatures(data.features as AddonFeatureMap)
    } catch (error) {
      console.error('Add-on access check failed:', error)
      setError('Could not check access to this tool. Please try again.')
    }
  }, [])

  useEffect(() => {
    if (enabled) void refresh()
  }, [enabled, refresh])

  return { features, loading: features === null, error, refresh }
}
