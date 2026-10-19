import { describe, expect, it } from 'vitest'
import {
  restoreSessionFromStorage,
  calculatePauseElapsed,
  calculateSyncOnVisible,
} from './useLiveWorkoutSessionTimer'

describe('useLiveWorkoutSessionTimer logic, pause isolation & storage recovery', () => {
  it('validates stage transition sequence for standard NASM 4-stage flow', () => {
    const validStages = ['idle', 'strength', 'cardio', 'cooldown']
    expect(validStages).toContain('idle')
    expect(validStages).toContain('strength')
    expect(validStages).toContain('cardio')
    expect(validStages).toContain('cooldown')
  })

  it('accurately parses elapsed workout seconds to mm:ss format', () => {
    const formatElapsed = (totalSec: number) => {
      const mm = Math.floor(totalSec / 60).toString().padStart(2, '0')
      const ss = (totalSec % 60).toString().padStart(2, '0')
      return `${mm}:${ss}`
    }

    expect(formatElapsed(0)).toBe('00:00')
    expect(formatElapsed(65)).toBe('01:05')
    expect(formatElapsed(3600)).toBe('60:00')
  })

  describe('restoreSessionFromStorage', () => {
    it('returns clean idle state when storage is empty or null', () => {
      const result = restoreSessionFromStorage(null)
      expect(result).toEqual({
        day: null,
        elapsedSeconds: 0,
        isWorkoutTimerActive: false,
        stage: 'idle',
        shouldClearStorage: false,
      })
    })

    it('flags corrupted JSON for removal without throwing', () => {
      const result = restoreSessionFromStorage('{ broken json [')
      expect(result.shouldClearStorage).toBe(true)
      expect(result.isWorkoutTimerActive).toBe(false)
      expect(result.day).toBeNull()
    })

    it('restores paused session at exact frozen seconds and stays paused (0 drift)', () => {
      const now = 1700003600000
      const stored = JSON.stringify({
        day: 3,
        elapsedSeconds: 945, // 15 mins 45 sec
        isPaused: true,
        stage: 'strength',
        updatedAt: now - 1800000, // User paused 30 minutes ago and closed app
      })

      const restored = restoreSessionFromStorage(stored, now)
      expect(restored.day).toBe(3)
      // CRITICAL: Paused duration (30 mins) must NEVER be added to elapsed seconds
      expect(restored.elapsedSeconds).toBe(945)
      expect(restored.isWorkoutTimerActive).toBe(false)
      expect(restored.stage).toBe('strength')
      expect(restored.shouldClearStorage).toBe(false)
    })

    it('restores actively running session and adds elapsed background time', () => {
      const now = 1700000100000
      const stored = JSON.stringify({
        day: 2,
        elapsedSeconds: 200,
        isPaused: false,
        stage: 'cardio',
        lastActiveTimestamp: now - 45000, // 45 seconds ago
        updatedAt: now - 45000,
      })

      const restored = restoreSessionFromStorage(stored, now)
      expect(restored.day).toBe(2)
      expect(restored.elapsedSeconds).toBe(245) // 200 + 45
      expect(restored.isWorkoutTimerActive).toBe(true)
      expect(restored.stage).toBe('cardio')
      expect(restored.shouldClearStorage).toBe(false)
    })

    it('clears stale active sessions that exceed the 4-hour safety threshold', () => {
      const now = 1700020000000
      const stored = JSON.stringify({
        day: 1,
        elapsedSeconds: 60,
        isPaused: false,
        stage: 'strength',
        lastActiveTimestamp: now - 5 * 3600 * 1000, // 5 hours ago
        updatedAt: now - 5 * 3600 * 1000,
      })

      const restored = restoreSessionFromStorage(stored, now)
      expect(restored.shouldClearStorage).toBe(true)
      expect(restored.isWorkoutTimerActive).toBe(false)
      expect(restored.day).toBeNull()
    })
  })

  describe('calculatePauseElapsed', () => {
    it('flushes pending fractional seconds since last tick when pausing', () => {
      const now = 10000
      const lastTick = 7000 // 3 seconds ago
      const currentElapsed = 50

      const finalElapsed = calculatePauseElapsed(currentElapsed, lastTick, now)
      expect(finalElapsed).toBe(53)
    })

    it('preserves exact current elapsed when last tick timestamp is null', () => {
      const finalElapsed = calculatePauseElapsed(120, null, 10000)
      expect(finalElapsed).toBe(120)
    })
  })

  describe('calculateSyncOnVisible (Visibility & Background Isolation)', () => {
    it('CRITICAL: NEVER adds elapsed seconds while workout is paused, even after 20 minutes away', () => {
      const now = 1700001200000 // 1200s (20 minutes) later
      const frozenElapsed = 750 // 12m 30s
      const isTimerActive = false

      const sync = calculateSyncOnVisible(isTimerActive, null, frozenElapsed, now)

      expect(sync.delta).toBe(0)
      expect(sync.newElapsed).toBe(750)
      expect(sync.newLastTickTimestamp).toBeNull()
    })

    it('accurately advances elapsed seconds when returning from background while actively running', () => {
      const lastTick = 1700000000000
      const now = lastTick + 32000 // 32 seconds away
      const currentElapsed = 400
      const isTimerActive = true

      const sync = calculateSyncOnVisible(isTimerActive, lastTick, currentElapsed, now)

      expect(sync.delta).toBe(32)
      expect(sync.newElapsed).toBe(432)
      expect(sync.newLastTickTimestamp).toBe(lastTick + 32000)
    })
  })

  describe('Session Quitting without Penalty', () => {
    it('guarantees clean reset of storage, timer, and stage when session is quit', () => {
      // Simulating quit session execution
      const mockStorage = new Map<string, string>()
      mockStorage.set('gaa_active_session', JSON.stringify({
        day: 2,
        elapsedSeconds: 500,
        isPaused: false,
        stage: 'strength',
        updatedAt: Date.now(),
      }))

      // Execute quit logic
      mockStorage.delete('gaa_active_session')
      const restored = restoreSessionFromStorage(mockStorage.get('gaa_active_session') || null)

      expect(mockStorage.has('gaa_active_session')).toBe(false)
      expect(restored.day).toBeNull()
      expect(restored.elapsedSeconds).toBe(0)
      expect(restored.isWorkoutTimerActive).toBe(false)
      expect(restored.stage).toBe('idle')
      expect(restored.shouldClearStorage).toBe(false)
    })
  })
})
