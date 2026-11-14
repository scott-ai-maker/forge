import SwiftUI
import HealthKit
import WatchKit

/**
 * ExtensionDelegate
 * Handles watch app wake & launch from companion iPhone via HealthKit startWatchApp(with:)
 * Forge Athletic
 */
class ExtensionDelegate: NSObject, WKApplicationDelegate {
    func handle(_ workoutConfiguration: HKWorkoutConfiguration) {
        print("[Forge Watch] Launched from iPhone via startWatchApp (activityType=\(workoutConfiguration.activityType.rawValue))")
        DispatchQueue.main.async {
            WatchWorkoutManager.shared.startWorkout(activityType: workoutConfiguration.activityType)
            WatchSessionCoordinator.shared.workoutState.isSessionActive = true
            if WatchSessionCoordinator.shared.workoutState.activePhase.isEmpty {
                WatchSessionCoordinator.shared.workoutState.activePhase = "warmup"
            }
            WatchSessionCoordinator.shared.refreshFromApplicationContext()
        }
    }

    func applicationDidBecomeActive() {
        WatchSessionCoordinator.shared.refreshFromApplicationContext()
    }
}

/**
 * ForgeWatchApp
 * Wrist-First Companion watchOS application for Forge Athletic
 * Forge Athletic
 */
@main
struct ForgeWatchApp: App {
    @WKApplicationDelegateAdaptor(ExtensionDelegate.self) var extensionDelegate
    @StateObject private var coordinator = WatchSessionCoordinator.shared
    @StateObject private var workoutManager = WatchWorkoutManager.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(coordinator)
                .environmentObject(workoutManager)
                .onAppear {
                    coordinator.activateSession()
                    coordinator.refreshFromApplicationContext()
                    workoutManager.requestPermissions { _ in }
                }
                .onOpenURL { url in
                    let host = url.host?.lowercased() ?? url.path.lowercased()
                    if host.contains("desk-reset") {
                        coordinator.activeDeepLinkSheet = "deskReset"
                    } else if host.contains("joint-comfort") {
                        coordinator.activeDeepLinkSheet = "jointComfort"
                    } else if host.contains("camera") {
                        coordinator.activeDeepLinkSheet = "cameraRemote"
                    } else if host.contains("workout") {
                        coordinator.workoutState.isSessionActive = true
                        coordinator.selectedTab = 1
                    }
                }
        }
    }
}

struct ContentView: View {
    @ObservedObject var coordinator = WatchSessionCoordinator.shared
    @ObservedObject var workoutManager = WatchWorkoutManager.shared

    @State private var showCameraRemoteSheet: Bool = false
    @State private var showDeskResetSheet: Bool = false
    @State private var showJointComfortSheet: Bool = false

    var body: some View {
        Group {
            if coordinator.workoutState.isSessionActive || (workoutManager.isWorkoutActive && workoutManager.activeSessionKind != "desk_reset") {
                TabView(selection: $coordinator.selectedTab) {
                    WorkoutControlsView(selectedTab: $coordinator.selectedTab)
                        .tag(0)

                    WorkoutActiveView()
                        .tag(1)

                    RestTimerRadialView()
                        .tag(2)

                    CardioZoneView()
                        .tag(3)

                    TempoMetronomeView()
                        .tag(4)
                }
                .tabViewStyle(PageTabViewStyle())
            } else {
                WatchHomeView(
                    onOpenCameraRemote: { showCameraRemoteSheet = true },
                    onOpenDeskReset: { showDeskResetSheet = true },
                    onOpenJointComfort: { showJointComfortSheet = true }
                )
            }
        }
        .background(Color.black.ignoresSafeArea()) // True OLED #000000 Black
        .sheet(isPresented: $showCameraRemoteSheet) {
            CameraRemoteView()
        }
        .sheet(isPresented: $showDeskResetSheet) {
            DeskResetWristView()
        }
        .sheet(isPresented: $showJointComfortSheet) {
            JointComfortCheckInView()
        }
        .onChange(of: coordinator.cameraRemote.isActive) { _, active in
            showCameraRemoteSheet = active
        }
        .onChange(of: coordinator.activeDeepLinkSheet) { _, route in
            guard let route = route else { return }
            if route == "deskReset" {
                showDeskResetSheet = true
            } else if route == "jointComfort" {
                showJointComfortSheet = true
            } else if route == "cameraRemote" {
                showCameraRemoteSheet = true
            }
            coordinator.activeDeepLinkSheet = nil
        }
    }
}

/**
 * WorkoutControlsView
 * Standard watchOS workout session controls (End / Pause / Summary).
 * Swiping to the leftmost tab provides instant, unmistakable workout termination.
 */
struct WorkoutControlsView: View {
    @ObservedObject var coordinator = WatchSessionCoordinator.shared
    @ObservedObject var workoutManager = WatchWorkoutManager.shared
    @Binding var selectedTab: Int

    @State private var showEndConfirmation: Bool = false

    private let cardSurface = Color(red: 0.078, green: 0.090, blue: 0.122) // #14171F
    private let emeraldPrimary = Color(red: 0.063, green: 0.725, blue: 0.506) // #10B981
    private let amberBadge = Color(red: 0.961, green: 0.620, blue: 0.043) // #F59E0B
    private let coralBadge = Color(red: 0.957, green: 0.247, blue: 0.369) // #F43F5E

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                HStack(spacing: 5) {
                    Circle()
                        .fill(coordinator.isPhoneReachable ? emeraldPrimary : amberBadge)
                        .frame(width: 6, height: 6)

                    Text("SESSION CONTROLS")
                        .font(.system(size: 10, weight: .black, design: .rounded))
                        .foregroundColor(.gray)

                    Spacer()

                    Text(formatTime(workoutManager.elapsedSeconds))
                        .font(.system(size: 11, weight: .bold, design: .monospaced))
                        .monospacedDigit()
                        .foregroundColor(.white)
                }
                .padding(.horizontal, 4)

                // Large Coral END WORKOUT Button
                Button(action: {
                    showEndConfirmation = true
                    WKInterfaceDevice.current().play(.click)
                }) {
                    HStack(spacing: 8) {
                        ZStack {
                            Circle()
                                .fill(Color.white.opacity(0.2))
                                .frame(width: 30, height: 30)
                            Image(systemName: "xmark")
                                .font(.system(size: 13, weight: .black))
                                .foregroundColor(.white)
                        }

                        VStack(alignment: .leading, spacing: 1) {
                            Text("END WORKOUT")
                                .font(.system(size: 12.5, weight: .black, design: .rounded))
                                .foregroundColor(.white)
                            Text("Save & close Exercise ring")
                                .font(.system(size: 8.5, weight: .medium))
                                .foregroundColor(.white.opacity(0.82))
                        }

                        Spacer()
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 10)
                    .background(coralBadge)
                    .cornerRadius(12)
                }
                .buttonStyle(PlainButtonStyle())

                // Pause / Resume Card (#14171F)
                Button(action: {
                    WKInterfaceDevice.current().play(.click)
                    if workoutManager.isPaused {
                        workoutManager.resumeWorkout()
                    } else {
                        workoutManager.pauseWorkout()
                    }
                }) {
                    HStack(spacing: 8) {
                        ZStack {
                            Circle()
                                .fill(amberBadge.opacity(0.18))
                                .frame(width: 30, height: 30)
                            Image(systemName: workoutManager.isPaused ? "play.fill" : "pause.fill")
                                .font(.system(size: 12, weight: .black))
                                .foregroundColor(amberBadge)
                        }

                        VStack(alignment: .leading, spacing: 1) {
                            Text(workoutManager.isPaused ? "RESUME" : "PAUSE")
                                .font(.system(size: 12.5, weight: .black, design: .rounded))
                                .foregroundColor(.white)
                            Text(workoutManager.isPaused ? "Session paused" : "Pause workout timer")
                                .font(.system(size: 8.5, weight: .medium))
                                .foregroundColor(.gray)
                        }

                        Spacer()
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 10)
                    .background(cardSurface)
                    .cornerRadius(12)
                }
                .buttonStyle(PlainButtonStyle())

                // 20m Express Quick Toggle on Controls Tab
                Button(action: {
                    coordinator.toggleExpress20mMode()
                }) {
                    HStack(spacing: 6) {
                        Image(systemName: "bolt.fill")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(coordinator.workoutState.expressModeActive ? emeraldPrimary : amberBadge)
                        Text(coordinator.workoutState.expressModeActive ? "20m Express · ON" : "Switch to 20m Express")
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                        Spacer()
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 9)
                    .background(cardSurface)
                    .cornerRadius(11)
                    .overlay(
                        RoundedRectangle(cornerRadius: 11)
                            .stroke(coordinator.workoutState.expressModeActive ? emeraldPrimary.opacity(0.5) : Color.white.opacity(0.08), lineWidth: 1)
                    )
                }
                .buttonStyle(PlainButtonStyle())

                Button(action: {
                    selectedTab = 1
                    WKInterfaceDevice.current().play(.click)
                }) {
                    HStack(spacing: 5) {
                        Image(systemName: "arrow.right.circle.fill")
                            .font(.system(size: 11))
                        Text("BACK TO HUD")
                            .font(.system(size: 10.5, weight: .black, design: .rounded))
                    }
                    .foregroundColor(emeraldPrimary)
                    .padding(.vertical, 3)
                }
                .buttonStyle(PlainButtonStyle())
            }
            .padding(.horizontal, 4)
        }
        .background(Color.black.ignoresSafeArea())
        .confirmationDialog("Workout Options", isPresented: $showEndConfirmation, titleVisibility: .visible) {
            Button("Save & Finish", role: .none) {
                coordinator.finishSession()
            }
            Button("Discard / Cancel", role: .destructive) {
                coordinator.cancelSession()
            }
            Button("Resume Workout", role: .cancel) {}
        } message: {
            Text("Discarding exits without saving to Apple Health or Forge Athletic.")
        }
    }

    private func formatTime(_ totalSeconds: Int) -> String {
        let m = totalSeconds / 60
        let s = totalSeconds % 60
        return String(format: "%02d:%02d", m, s)
    }
}

/**
 * WatchHomeView
 * Wrist-First Companion Home ("Never a Shrunken Phone")
 * Focused strictly on the 4 high-frequency wrist moments:
 * 1. Hands-Free Camera Scan / Form Lab Remote (when phone propped 6–8 ft away)
 * 2. Active Workout / 20m Express Launch
 * 3. Standalone 5-Minute Desk Reset
 * 4. 10-Second Digital Crown Joint Comfort Check-In
 */
struct WatchHomeView: View {
    @ObservedObject var coordinator = WatchSessionCoordinator.shared
    @ObservedObject var workoutManager = WatchWorkoutManager.shared

    let onOpenCameraRemote: () -> Void
    let onOpenDeskReset: () -> Void
    let onOpenJointComfort: () -> Void

    private let cardSurface = Color(red: 0.078, green: 0.090, blue: 0.122) // #14171F
    private let emeraldPrimary = Color(red: 0.063, green: 0.725, blue: 0.506) // #10B981
    private let amberBadge = Color(red: 0.961, green: 0.620, blue: 0.043) // #F59E0B

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                // Header: Forge Athletic + Sync Status + Streak
                HStack(spacing: 5) {
                    Circle()
                        .fill(coordinator.isPhoneReachable ? emeraldPrimary : amberBadge)
                        .frame(width: 6, height: 6)

                    Text("FORGE ATHLETIC")
                        .font(.system(size: 10.5, weight: .black, design: .rounded))
                        .foregroundColor(.white)

                    Spacer()

                    Text("OPT P\(coordinator.companionSummary.optPhase) · \(coordinator.companionSummary.dailyStreak)d")
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                        .monospacedDigit()
                        .foregroundColor(emeraldPrimary)
                }
                .padding(.horizontal, 4)

                // Moment 1: Live Camera Remote Pill (Auto-surfaces when iPhone enters scan / Form Lab)
                if coordinator.cameraRemote.isActive {
                    Button(action: onOpenCameraRemote) {
                        HStack(spacing: 7) {
                            Image(systemName: "viewfinder")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(.black)
                            VStack(alignment: .leading, spacing: 1) {
                                Text("WRIST CAMERA REMOTE")
                                    .font(.system(size: 9, weight: .black, design: .rounded))
                                    .foregroundColor(.black.opacity(0.75))
                                Text(coordinator.cameraRemote.framingDisplayLabel)
                                    .font(.system(size: 11.5, weight: .black, design: .rounded))
                                    .foregroundColor(.black)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.black)
                        }
                        .padding(9)
                        .background(emeraldPrimary)
                        .cornerRadius(12)
                    }
                    .buttonStyle(PlainButtonStyle())
                }

                // Moment 2: Today's Workout + 20m Express Wrist Launcher
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text("DAY \(max(1, coordinator.workoutState.dayNumber))")
                            .font(.system(size: 9.5, weight: .black, design: .monospaced))
                            .monospacedDigit()
                            .foregroundColor(emeraldPrimary)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(emeraldPrimary.opacity(0.16))
                            .cornerRadius(5)

                        Spacer()

                        Button(action: {
                            coordinator.toggleExpress20mMode()
                        }) {
                            HStack(spacing: 3) {
                                Image(systemName: "bolt.fill")
                                    .font(.system(size: 8))
                                Text("20m Express")
                                    .font(.system(size: 8.5, weight: .bold, design: .rounded))
                            }
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2.5)
                            .background(coordinator.workoutState.expressModeActive ? emeraldPrimary : Color.white.opacity(0.08))
                            .foregroundColor(coordinator.workoutState.expressModeActive ? .black : .gray)
                            .cornerRadius(5)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }

                    Text(coordinator.workoutState.focus)
                        .font(.system(size: 12.5, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                        .lineLimit(1)

                    Button(action: {
                        WKInterfaceDevice.current().play(.start)
                        let isCardioDay = coordinator.workoutState.exercises.isEmpty
                        workoutManager.startWorkout(
                            activityType: isCardioDay ? .highIntensityIntervalTraining : .traditionalStrengthTraining,
                            workoutId: coordinator.workoutState.workoutId,
                            sessionKind: isCardioDay ? "cardio" : "strength"
                        )
                        coordinator.workoutState.isSessionActive = true
                        coordinator.workoutState.activePhase = "warmup"
                        coordinator.selectedTab = 1
                        coordinator.startWorkoutFromWatch(dayNumber: coordinator.workoutState.dayNumber, phase: "warmup")
                    }) {
                        HStack(spacing: 6) {
                            Image(systemName: "play.fill")
                                .font(.system(size: 11, weight: .bold))
                            Text(coordinator.workoutState.expressModeActive ? "START 20M EXPRESS" : "START WORKOUT")
                                .font(.system(size: 12, weight: .black, design: .rounded))
                                .monospacedDigit()
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 9)
                        .background(emeraldPrimary)
                        .foregroundColor(.black)
                        .cornerRadius(10)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                .padding(9)
                .background(cardSurface)
                .cornerRadius(12)

                // Moment 3: Standalone 5-Minute Desk Reset
                Button(action: onOpenDeskReset) {
                    HStack(spacing: 8) {
                        ZStack {
                            Circle()
                                .fill(emeraldPrimary.opacity(0.18))
                                .frame(width: 28, height: 28)
                            Image(systemName: "figure.seated.side.right")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(emeraldPrimary)
                        }

                        VStack(alignment: .leading, spacing: 1) {
                            Text("5-Min Desk Reset")
                                .font(.system(size: 12, weight: .black, design: .rounded))
                                .foregroundColor(.white)
                            Text(coordinator.companionSummary.deskResetDoneToday ? "Done today · Haptic mobility" : "30s/45s silent wrist chimes")
                                .font(.system(size: 9, weight: .medium))
                                .foregroundColor(.gray)
                                .lineLimit(1)
                        }

                        Spacer()

                        Image(systemName: "chevron.right")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.gray)
                    }
                    .padding(9)
                    .background(cardSurface)
                    .cornerRadius(12)
                }
                .buttonStyle(PlainButtonStyle())

                // Moment 4: 10-Second Digital Crown Joint Comfort Check-In
                Button(action: onOpenJointComfort) {
                    HStack(spacing: 8) {
                        ZStack {
                            Circle()
                                .fill(amberBadge.opacity(0.18))
                                .frame(width: 28, height: 28)
                            Text("\(coordinator.companionSummary.jointComfortScore)")
                                .font(.system(size: 10, weight: .black, design: .monospaced))
                                .monospacedDigit()
                                .foregroundColor(coordinator.companionSummary.jointComfortScore >= 75 ? emeraldPrimary : amberBadge)
                        }

                        VStack(alignment: .leading, spacing: 1) {
                            Text("Joint Comfort")
                                .font(.system(size: 12, weight: .black, design: .rounded))
                                .foregroundColor(.white)
                            Text("10s Crown · Neck / Back / Hips")
                                .font(.system(size: 9, weight: .medium))
                                .foregroundColor(.gray)
                                .lineLimit(1)
                        }

                        Spacer()

                        Image(systemName: "digitalcrown.arrow.clockwise.fill")
                            .font(.system(size: 11))
                            .foregroundColor(emeraldPrimary)
                    }
                    .padding(9)
                    .background(cardSurface)
                    .cornerRadius(12)
                }
                .buttonStyle(PlainButtonStyle())

                // Biometric Readiness Glance
                CNSReadinessCardView(cns: coordinator.cnsReadiness)

                // Offline Queue / Sync Footer
                Text(
                    coordinator.isPhoneReachable
                        ? "Live iPhone Sync Ready"
                        : (coordinator.pendingOfflineTransfersCount > 0
                            ? "Offline · \(coordinator.pendingOfflineTransfersCount) queued for sync"
                            : "Standalone Wrist Mode Ready")
                )
                .font(.system(size: 8.5, weight: .semibold, design: .monospaced))
                .monospacedDigit()
                .foregroundColor(.gray)
                .padding(.top, 1)
            }
            .padding(.horizontal, 4)
        }
        .background(Color.black.ignoresSafeArea())
    }
}
