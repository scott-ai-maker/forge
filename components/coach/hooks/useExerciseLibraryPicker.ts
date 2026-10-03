'use client'

import { useState, useMemo, useCallback } from 'react'
import type { ExerciseLibraryRecord } from '@/lib/coach-programs'

export interface CategorizedExercise {
  record: ExerciseLibraryRecord
  category: string
  equipmentKey: string
}

export interface PickerTarget {
  dayId: string
  exerciseId: string
}

export const EXERCISE_SEARCH_ALIASES: Record<string, string[]> = {
  squat: ['back squat', 'front squat', 'goblet squat', 'air squat'],
  deadlift: ['rdl', 'romanian deadlift', 'hinge', 'trap bar'],
  bench: ['bench press', 'flat press', 'chest press'],
  row: ['cable row', 'seated row', 'db row', 'dumbbell row'],
  press: ['ohp', 'overhead press', 'shoulder press'],
  pullup: ['pull-up', 'chin-up', 'chin up', 'lat pull'],
  lunge: ['split squat', 'reverse lunge', 'walking lunge'],
  plank: ['core brace', 'hollow hold', 'anti-extension'],
  hamstring: ['ham curl', 'leg curl', 'rdl'],
  glute: ['hip thrust', 'bridge', 'glute bridge'],
  calf: ['calf raise', 'standing calf', 'seated calf'],
}

export function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function tokenizeSearch(value: string) {
  return normalizeSearchText(value).split(' ').filter(Boolean)
}

export function boundedEditDistance(a: string, b: string, maxDistance: number) {
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1
  if (a === b) return 0

  const dp: number[] = Array.from({ length: b.length + 1 }, (_, i) => i)

  for (let i = 1; i <= a.length; i += 1) {
    let prev = dp[0]
    dp[0] = i
    let rowMin = dp[0]

    for (let j = 1; j <= b.length; j += 1) {
      const temp = dp[j]
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost)
      prev = temp
      rowMin = Math.min(rowMin, dp[j])
    }

    if (rowMin > maxDistance) return maxDistance + 1
  }

  return dp[b.length]
}

export function getSearchMatchScore(query: string, item: CategorizedExercise) {
  if (!query) return { matched: true, score: 0 }

  const normalizedQuery = normalizeSearchText(query)
  const name = normalizeSearchText(item.record.name)
  const equipment = normalizeSearchText((item.record.primary_equipment || []).join(' '))
  const aliases = Object.entries(EXERCISE_SEARCH_ALIASES)
    .filter(([key]) => name.includes(key))
    .flatMap(([, values]) => values)
  const aliasText = normalizeSearchText(aliases.join(' '))

  if (name === normalizedQuery) return { matched: true, score: 120 }
  if (name.startsWith(normalizedQuery)) return { matched: true, score: 100 }
  if (name.includes(normalizedQuery)) return { matched: true, score: 88 }
  if (aliasText.includes(normalizedQuery)) return { matched: true, score: 78 }
  if (equipment.includes(normalizedQuery)) return { matched: true, score: 68 }

  const queryTokens = tokenizeSearch(normalizedQuery)
  const nameTokens = tokenizeSearch(name)
  const aliasTokens = tokenizeSearch(aliasText)

  const tokenPrefixHit = queryTokens.some(
    queryToken =>
      nameTokens.some(token => token.startsWith(queryToken)) ||
      aliasTokens.some(token => token.startsWith(queryToken))
  )
  if (tokenPrefixHit) return { matched: true, score: 62 }

  if (normalizedQuery.length >= 4) {
    const distanceTargetTokens = [...nameTokens, ...aliasTokens].filter(token => token.length >= 4)
    const fuzzyHit = distanceTargetTokens.some(token => boundedEditDistance(token, normalizedQuery, 2) <= 2)
    if (fuzzyHit) return { matched: true, score: 52 }
  }

  return { matched: false, score: 0 }
}

export function useExerciseLibraryPicker(exercises: ExerciseLibraryRecord[]) {
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedEquipmentFilter, setSelectedEquipmentFilter] = useState<string>('all')
  const [activeVideoExercise, setActiveVideoExercise] = useState<{
    name: string
    videoUrl?: string | null
    coachingCues?: string[] | null
    description?: string | null
    primaryEquipment?: string[] | null
  } | null>(null)

  const categorizedExercises: CategorizedExercise[] = useMemo(() => {
    return exercises.map(ex => {
      const equip = (ex.primary_equipment || [])[0] || 'bodyweight'
      const cat = (ex.muscle_groups || [])[0] || 'General Strength'
      return {
        record: ex,
        category: cat,
        equipmentKey: equip,
      }
    })
  }, [exercises])

  const filteredExercises = useMemo(() => {
    return categorizedExercises
      .filter(item => {
        if (selectedCategory !== 'all' && item.category !== selectedCategory) return false
        if (selectedEquipmentFilter !== 'all' && !item.record.primary_equipment?.includes(selectedEquipmentFilter)) {
          return false
        }
        return true
      })
      .map(item => ({ item, match: getSearchMatchScore(searchQuery, item) }))
      .filter(({ match }) => match.matched)
      .sort((a, b) => b.match.score - a.match.score)
      .map(({ item }) => item.record)
  }, [categorizedExercises, searchQuery, selectedCategory, selectedEquipmentFilter])

  const openPicker = useCallback((dayId: string, exerciseId: string) => {
    setPickerTarget({ dayId, exerciseId })
    setSearchQuery('')
  }, [])

  const closePicker = useCallback(() => {
    setPickerTarget(null)
    setSearchQuery('')
  }, [])

  return {
    pickerTarget,
    openPicker,
    closePicker,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedEquipmentFilter,
    setSelectedEquipmentFilter,
    filteredExercises,
    activeVideoExercise,
    setActiveVideoExercise,
  }
}
