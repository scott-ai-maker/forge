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

  it('verifies Wrist Camera Remote, Plain-English RPE Crown Picker, Desk Reset & Joint Comfort views', () => {
    const cameraView = fs.readFileSync(
      path.resolve(process.cwd(), 'ios/App/ForgeWatch/Views/CameraRemoteView.swift'),
      'utf8'
    )
    expect(cameraView).toContain('Start 5s Timer')
    expect(cameraView).toContain('Record Rep')
    expect(cameraView).toContain('Stop & Review')

    const modelContent = fs.readFileSync(
      path.resolve(process.cwd(), 'ios/App/ForgeWatch/Models/WatchWorkoutModel.swift'),
      'utf8'
    )
    expect(modelContent).toContain('Locked · Emerald')
    expect(modelContent).toContain('Framing...')
    expect(modelContent).toContain('Easy · 6')
    expect(modelContent).toContain('Moderate · 7')
    expect(modelContent).toContain('Challenging · 8')
    expect(modelContent).toContain('Hard · 9')
    expect(modelContent).toContain('Max · 10')

    const deskResetView = fs.readFileSync(
      path.resolve(process.cwd(), 'ios/App/ForgeWatch/Views/DeskResetWristView.swift'),
      'utf8'
    )
    expect(deskResetView).toContain('5-MIN DESK RESET')
    expect(deskResetView).toContain('.flexibility')
    expect(deskResetView).toContain('.monospacedDigit()')

    const comfortView = fs.readFileSync(
      path.resolve(process.cwd(), 'ios/App/ForgeWatch/Views/JointComfortCheckInView.swift'),
      'utf8'
    )
    expect(comfortView).toContain('Neck')
    expect(comfortView).toContain('Lower Back')
    expect(comfortView).toContain('Hips')
    expect(comfortView).toContain('digitalCrownRotation')
  })

  it('verifies WidgetKit Smart Stack widgets (OPT Phase & Streak, Joint Comfort, 5-Min Desk Reset)', () => {
    const content = fs.readFileSync(widgetsPath, 'utf8')
    expect(content).toContain('OPTPhaseStreakWidget')
    expect(content).toContain('JointComfortWidget')
    expect(content).toContain('DeskResetQuickLaunchWidget')
    expect(content).toContain('forgewatch://desk-reset')
    expect(content).toContain('forgewatch://joint-comfort')
  })

  it('verifies HealthKit ring closure, workout deduplication metadata, and TestFlight Info.plist / AppIcon audit', () => {
    const watchWorkoutMgr = fs.readFileSync(
      path.resolve(process.cwd(), 'ios/App/ForgeWatch/Services/WatchWorkoutManager.swift'),
      'utf8'
    )
    expect(watchWorkoutMgr).toContain('.activeEnergyBurned')
    expect(watchWorkoutMgr).toContain('ForgeAthletic_Source')

    const iosHealthSync = fs.readFileSync(
      path.resolve(process.cwd(), 'ios/App/App/GAAHealthSyncManager.swift'),
      'utf8'
    )
    expect(iosHealthSync).toContain('ForgeAthletic_Source')
    expect(iosHealthSync).toContain('watchWorkoutAlreadySaved')

    const watchInfoPlist = fs.readFileSync(
      path.resolve(process.cwd(), 'ios/App/ForgeWatch/Info.plist'),
      'utf8'
    )
    expect(watchInfoPlist).toContain('WKCompanionAppBundleIdentifier')
    expect(watchInfoPlist).toContain('$(WK_COMPANION_APP_BUNDLE_IDENTIFIER)')
    expect(watchInfoPlist).toContain('WKRunsIndependentlyOfCompanionApp')
    expect(watchInfoPlist).toContain('NSHealthShareUsageDescription')
    expect(watchInfoPlist).toContain('NSHealthUpdateUsageDescription')

    const pbxproj = fs.readFileSync(
      path.resolve(process.cwd(), 'ios/App/App.xcodeproj/project.pbxproj'),
      'utf8'
    )
    const marketingVersions = Array.from(pbxproj.matchAll(/MARKETING_VERSION = ([^;]+);/g)).map(m => m[1])
    expect(marketingVersions.length).toBeGreaterThanOrEqual(4)
    expect(new Set(marketingVersions).size).toBe(1)

    const buildVersions = Array.from(pbxproj.matchAll(/CURRENT_PROJECT_VERSION = ([^;]+);/g)).map(m => m[1])
    expect(buildVersions.length).toBeGreaterThanOrEqual(4)
    expect(new Set(buildVersions).size).toBe(1)

    // Verify all watchOS AppIcon PNGs exist and Contents.json has 1024x1024 watch-marketing + launcher icons
    const iconDir = path.resolve(process.cwd(), 'ios/App/ForgeWatch/Assets.xcassets/AppIcon.appiconset')
    const contentsJson = JSON.parse(fs.readFileSync(path.join(iconDir, 'Contents.json'), 'utf8')) as {
      images: Array<{ filename: string; idiom: string; role?: string; size: string }>
    }
    expect(contentsJson.images.length).toBeGreaterThanOrEqual(17)
    expect(
      contentsJson.images.some(
        img => (img.idiom === 'watch-marketing' || img.role === 'watch-marketing') && img.size === '1024x1024'
      )
    ).toBe(true)
    for (const img of contentsJson.images) {
      expect(fs.existsSync(path.join(iconDir, img.filename))).toBe(true)
    }
  })

  it('verifies ?debug=telemetry Watch Sync Status pill and round-trip WatchConnectivity bridge helpers', async () => {
    const drawerContent = fs.readFileSync(
      path.resolve(process.cwd(), 'components/telemetry/TelemetryDiagnosticsDrawer.tsx'),
      'utf8'
    )
    expect(drawerContent).toContain('telemetry-watch-sync-pill')
    expect(drawerContent).toContain('telemetry-watch-activation-state')
    expect(drawerContent).toContain('telemetry-watch-paired-status')
    expect(drawerContent).toContain('telemetry-watch-reachable-status')
    expect(drawerContent).toContain('telemetry-watch-last-timestamp')

    const bridge = await import('@/lib/native-healthkit-bridge')
    const ts = bridge.recordClientWatchTelemetryTimestamp('deskResetCompleted', '2026-11-14T13:30:00.000Z', 128)
    expect(ts).toBe('2026-11-14T13:30:00.000Z')
    const diag = await bridge.getAppleWatchSyncDiagnostics()
    expect(diag.lastWatchTelemetryTimestamp).toBe('2026-11-14T13:30:00.000Z')
    expect(diag.lastWatchEventType).toBe('deskResetCompleted')
    expect(diag.lastHeartRateBpm).toBe(128)
  })
})
