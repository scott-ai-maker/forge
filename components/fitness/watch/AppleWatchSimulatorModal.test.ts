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

  it('verifies Option B Confirm & Edit and superset transitions in AppleWatchSimulatorModal', () => {
    const content = fs.readFileSync(modalPath, 'utf8')

    // Option B Confirm & Edit state
    expect(content).toContain('isConfirmingSet')
    expect(content).toContain('confirmReps')
    expect(content).toContain('confirmWeight')
    expect(content).toContain('confirmRpe')
    expect(content).toContain('CONFIRM SET')
    expect(content).toContain('Option B: Confirm & Edit')

    // Superset immediate 0s transition
    expect(content).toContain('isSupersetA')
    expect(content).toContain('CONFIRM → 1B NEXT')
    expect(content).toContain('currentStationIndex')
    expect(content).toContain('handlePrevStation')
    expect(content).toContain('handleNextStation')
  })

  it('verifies Swift WatchSessionCoordinator implements superset alternation and auto-phase advance', () => {
    const content = fs.readFileSync(coordinatorPath, 'utf8')

    // Immediate 0s transition for 1A
    expect(content).toContain('isSupersetA')
    expect(content).toContain('isSupersetB')
    expect(content).toContain('supersetPartnerIndex')
    expect(content).toContain('WKInterfaceDevice.current().play(.directionUp)')

    // Rest completion round-robin return to 1A
    expect(content).toContain('partnerIdx < self.workoutState.exercises.count')
    expect(content).toContain('partnerA.completedSetsCount < partnerA.totalSets')

    // Auto-advance when all lifts done (e.g. Russian Twists complete)
    expect(content).toContain('workoutState.exercises.allSatisfy({ $0.isCompleted })')
    expect(content).toContain('type": "phaseSelected"')
  })

  it('verifies Swift WorkoutActiveView includes ConfirmSetSheetView and superset badges', () => {
    const activeViewPath = path.resolve(process.cwd(), 'ios/App/ForgeWatch/Views/WorkoutActiveView.swift')
    expect(fs.existsSync(activeViewPath)).toBe(true)
    const content = fs.readFileSync(activeViewPath, 'utf8')

    expect(content).toContain('case confirmSet')
    expect(content).toContain('ConfirmSetSheetView')
    expect(content).toContain('activeSheet = .confirmSet')
    expect(content).toContain('SUPERSET 1')
  })

  it('verifies native-healthkit-bridge includes superset payload properties', () => {
    const bridgePath = path.resolve(process.cwd(), 'lib/native-healthkit-bridge.ts')
    expect(fs.existsSync(bridgePath)).toBe(true)
    const content = fs.readFileSync(bridgePath, 'utf8')

    expect(content).toContain('isSuperset?: boolean')
    expect(content).toContain("supersetRole?: 'A' | 'B'")
    expect(content).toContain('supersetPartnerIndex?: number')
  })
})
