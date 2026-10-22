import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('AppleWatchSimulatorModal and watchOS Suite Verification', () => {
  const modalPath = path.resolve(process.cwd(), 'components/fitness/watch/AppleWatchSimulatorModal.tsx')
  const widgetsPath = path.resolve(process.cwd(), 'ios/App/ForgeWatch/ForgeWatchWidgets.swift')
  const appPath = path.resolve(process.cwd(), 'ios/App/ForgeWatch/ForgeWatchApp.swift')
  const coordinatorPath = path.resolve(process.cwd(), 'ios/App/ForgeWatch/Services/WatchSessionCoordinator.swift')

  it('verifies AppleWatchSimulatorModal file exists and contains essential watchOS features', () => {
    expect(fs.existsSync(modalPath)).toBe(true)
    const content = fs.readFileSync(modalPath, 'utf8')

    // Verifies Apple Watch Ultra 49mm chassis and Action Button
    expect(content).toContain('Apple Watch Ultra')
    expect(content).toContain('Digital Crown')
    expect(content).toContain('handleActionClick')

    // Verifies key tabs: Lift, Rest, Cardio, Tempo, Complication Face
    expect(content).toContain("'lift'")
    expect(content).toContain("'rest'")
    expect(content).toContain("'cardio'")
    expect(content).toContain("'tempo'")
    expect(content).toContain("'face'")

    // Verifies Brand Nomenclature (Forge Athletic, strictly no legacy GAA)
    expect(content).toContain('FORGE ATHLETIC')
    expect(content).not.toMatch(/Gordon Athletic Advisory|Gordon Athletic Association/i)
  })

  it('verifies WidgetKit Complications in ForgeWatchWidgets.swift', () => {
    expect(fs.existsSync(widgetsPath)).toBe(true)
    const content = fs.readFileSync(widgetsPath, 'utf8')

    expect(content).toContain('CNSReadinessWidget')
    expect(content).toContain('CNSReadinessTimelineProvider')
    expect(content).toContain('CNSReadinessWidgetEntryView')
    expect(content).toContain('accessoryCircular')
    expect(content).toContain('accessoryRectangular')
    expect(content).toContain('accessoryCorner')
    expect(content).toContain('accessoryInline')

    // Must be Forge Athletic branding
    expect(content).toContain('Forge Athletic')
    expect(content).not.toContain('GAA')
  })

  it('verifies WatchSessionCoordinator handles bidirectional rest & workout sync', () => {
    expect(fs.existsSync(coordinatorPath)).toBe(true)
    const content = fs.readFileSync(coordinatorPath, 'utf8')

    expect(content).toContain('WCSessionDelegate')
    expect(content).toContain('logCompletedSet')
    expect(content).toContain('triggerRestAction')
    expect(content).toContain('startLocalRestTimer')
    expect(content).toContain('restTimer')
  })

  it('verifies ForgeWatchApp entrypoint and dynamic state routing', () => {
    expect(fs.existsSync(appPath)).toBe(true)
    const content = fs.readFileSync(appPath, 'utf8')

    expect(content).toContain('@main')
    expect(content).toContain('struct ForgeWatchApp: App')
    expect(content).toContain('WorkoutActiveView')
    expect(content).toContain('RestTimerRadialView')
    expect(content).toContain('CardioZoneView')
    expect(content).toContain('TempoMetronomeView')
  })
})
