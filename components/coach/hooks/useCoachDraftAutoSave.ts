'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export function useCoachDraftAutoSave(
  clientId: string,
  draftPayload: Record<string, unknown> | null,
  debounceMs = 2500,
  isEnabled = true
) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSerializedRef = useRef<string>('')

  const saveDraft = useCallback(async (payload: Record<string, unknown>) => {
    if (!clientId) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/coach/workout-plans/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          draft: payload,
        }),
      })

      if (res.ok) {
        setLastSavedAt(new Date())
        setIsDirty(false)
      }
    } catch {
      // Offline or network hiccup - preserved in memory
    } finally {
      setIsSaving(false)
    }
  }, [clientId])

  useEffect(() => {
    if (!isEnabled || !draftPayload) return

    const serialized = JSON.stringify(draftPayload)
    if (serialized === lastSerializedRef.current) return

    setIsDirty(true)
    lastSerializedRef.current = serialized

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      void saveDraft(draftPayload)
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [draftPayload, debounceMs, isEnabled, saveDraft])

  return {
    isSaving,
    lastSavedAt,
    isDirty,
    saveDraftNow: () => draftPayload && void saveDraft(draftPayload),
  }
}

