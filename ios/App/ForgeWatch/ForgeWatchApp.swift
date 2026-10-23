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
            WatchSessionCoordinator.shared.workoutState.activePhase = "warmup"
            WatchSessionCoordinator.shared.refreshFromApplicationContext()
        }
    }

    func applicationDidBecomeActive() {
        WatchSessionCoordinator.shared.refreshFromApplicationContext()
    }
}

/**
 * ForgeWatchApp
 * Standalone companion watchOS application for Forge Athletic
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
        }
    }
}

struct ContentView: View {
    @ObservedObject var coordinator = WatchSessionCoordinator.shared
    @ObservedObject var workoutManager = WatchWorkoutManager.shared

    var body: some View {
        Group {
            if coordinator.workoutState.isSessionActive || workoutManager.isWorkoutActive {
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
                WatchHomeView()
            }
        }
        .background(Color(red: 0.06, green: 0.09, blue: 0.14).ignoresSafeArea()) // #0F172A Obsidian
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

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                // Header Glance with Live Duration
                HStack(spacing: 5) {
                    Circle()
                        .fill(coordinator.isPhoneReachable ? Color(red: 0.06, green: 0.72, blue: 0.51) : Color(red: 0.83, green: 0.63, blue: 0.09))
                        .frame(width: 6, height: 6)

                    Text("SESSION CONTROLS")
                        .font(.system(size: 10, weight: .black, design: .rounded))
                        .foregroundColor(.gray)

                    Spacer()

                    Text(formatTime(workoutManager.elapsedSeconds))
                        .font(.system(size: 11, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                }
                .padding(.horizontal, 4)

                // Large Red END WORKOUT Button
                Button(action: {
                    showEndConfirmation = true
                    WKInterfaceDevice.current().play(.click)
                }) {
                    HStack(spacing: 8) {
                        ZStack {
                            Circle()
                                .fill(Color.white.opacity(0.2))
                                .frame(width: 32, height: 32)
                            Image(systemName: "xmark")
                                .font(.system(size: 14, weight: .black))
                                .foregroundColor(.white)
                        }

                        VStack(alignment: .leading, spacing: 1) {
                            Text("END WORKOUT")
                                .font(.system(size: 13, weight: .black, design: .rounded))
                                .foregroundColor(.white)
                            Text("Save & sync session")
                                .font(.system(size: 9, weight: .medium))
                                .foregroundColor(.white.opacity(0.8))
                        }

                        Spacer()
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 10)
                    .background(
                        LinearGradient(
                            colors: [Color(red: 0.94, green: 0.27, blue: 0.27), Color(red: 0.75, green: 0.15, blue: 0.15)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .cornerRadius(12)
                }
                .buttonStyle(PlainButtonStyle())

                // Amber PAUSE / RESUME Button
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
                                .fill(Color.white.opacity(0.12))
                                .frame(width: 32, height: 32)
                            Image(systemName: workoutManager.isPaused ? "play.fill" : "pause.fill")
                                .font(.system(size: 13, weight: .black))
                                .foregroundColor(Color(red: 0.83, green: 0.63, blue: 0.09))
                        }

                        VStack(alignment: .leading, spacing: 1) {
                            Text(workoutManager.isPaused ? "RESUME" : "PAUSE")
                                .font(.system(size: 13, weight: .black, design: .rounded))
                                .foregroundColor(.white)
                            Text(workoutManager.isPaused ? "Session is paused" : "Pause workout timer")
                                .font(.system(size: 9, weight: .medium))
                                .foregroundColor(.gray)
                        }

                        Spacer()
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 10)
                    .background(Color.white.opacity(0.08))
                    .cornerRadius(12)
                }
                .buttonStyle(PlainButtonStyle())

                // Return to Active Exercise Button
                Button(action: {
                    selectedTab = 1
                    WKInterfaceDevice.current().play(.click)
                }) {
                    HStack(spacing: 6) {
                        Image(systemName: "arrow.right.circle.fill")
                            .font(.system(size: 12))
                        Text("BACK TO LIFT")
                            .font(.system(size: 11, weight: .black, design: .rounded))
                    }
                    .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))
                    .padding(.vertical, 4)
                }
                .buttonStyle(PlainButtonStyle())
            }
            .padding(.horizontal, 4)
        }
        .confirmationDialog("End Workout?", isPresented: $showEndConfirmation, titleVisibility: .visible) {
            Button("End Workout", role: .destructive) {
                coordinator.endSession()
            }
            Button("Cancel", role: .cancel) {}
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
 * Idle dashboard displayed before or between gym workouts
 * Designed with bold watchOS 10 cards and large touch targets
 */
struct WatchHomeView: View {
    @ObservedObject var coordinator = WatchSessionCoordinator.shared
    @ObservedObject var workoutManager = WatchWorkoutManager.shared

    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                // Brand Header with Live iPhone Connection Dot
                HStack(spacing: 5) {
                    Circle()
                        .fill(coordinator.isPhoneReachable ? Color(red: 0.06, green: 0.72, blue: 0.51) : Color(red: 0.83, green: 0.63, blue: 0.09))
                        .frame(width: 7, height: 7)

                    Text("FORGE ATHLETIC")
                        .font(.system(size: 11, weight: .black, design: .rounded))
                        .foregroundColor(.white)

                    Spacer()

                    if coordinator.isPhoneReachable {
                        Image(systemName: "iphone.radiowaves.left.and.right")
                            .font(.system(size: 10))
                            .foregroundColor(Color(red: 0.06, green: 0.72, blue: 0.51))
                    }
                }
                .padding(.horizontal, 4)

                // Morning CNS Readiness Card
                CNSReadinessCardView(cns: coordinator.cnsReadiness)

                // Prescribed Workout Glance
                if coordinator.workoutState.dayNumber > 0 {
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text("DAY \(coordinator.workoutState.dayNumber)")
                                .font(.system(size: 10, weight: .black, design: .rounded))
                                .foregroundColor(Color(red: 0.83, green: 0.69, blue: 0.22))
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color(red: 0.83, green: 0.69, blue: 0.22).opacity(0.18))
                                .cornerRadius(4)

                            Spacer()

                            Text(coordinator.isPhoneReachable ? "LIVE SYNCED" : "PRESCRIBED")
                                .font(.system(size: 8.5, weight: .bold, design: .monospaced))
                                .foregroundColor(coordinator.isPhoneReachable ? Color(red: 0.06, green: 0.72, blue: 0.51) : .gray)
                        }

                        Text(coordinator.workoutState.focus)
                            .font(.system(size: 12, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                            .lineLimit(2)

                        // 4-Phase Plan Summary Glance (Warm-Up, Lifts, Cardio, Cool-Down)
                        HStack(spacing: 4) {
                            HStack(spacing: 2) {
                                Circle().fill(Color(red: 0.97, green: 0.58, blue: 0.11)).frame(width: 5, height: 5)
                                Text("\(coordinator.workoutState.warmupDrills.count) WARM")
                                    .font(.system(size: 8, weight: .black, design: .rounded))
                                    .foregroundColor(.white.opacity(0.85))
                            }
                            Text("·").font(.system(size: 8)).foregroundColor(.gray)
                            HStack(spacing: 2) {
                                Circle().fill(Color(red: 0.22, green: 0.74, blue: 0.97)).frame(width: 5, height: 5)
                                Text("\(coordinator.workoutState.exercises.count) LIFTS")
                                    .font(.system(size: 8, weight: .black, design: .rounded))
                                    .foregroundColor(.white.opacity(0.85))
                            }
                            Text("·").font(.system(size: 8)).foregroundColor(.gray)
                            HStack(spacing: 2) {
                                Circle().fill(Color(red: 0.20, green: 0.78, blue: 0.55)).frame(width: 5, height: 5)
                                Text("\(coordinator.workoutState.cooldownStretches.count) COOL")
                                    .font(.system(size: 8, weight: .black, design: .rounded))
                                    .foregroundColor(.white.opacity(0.85))
                            }
                        }
                        .padding(.top, 2)
                    }
                    .padding(8)
                    .background(Color.white.opacity(0.06))
                    .cornerRadius(10)
                }

                // Quick Start Buttons (Large 44pt Touch Targets)
                VStack(spacing: 8) {
                    Button(action: {
                        WKInterfaceDevice.current().play(.start)
                        workoutManager.startWorkout(activityType: .traditionalStrengthTraining)
                        coordinator.workoutState.isSessionActive = true
                        coordinator.workoutState.activePhase = "warmup"
                        coordinator.selectedTab = 1
                        coordinator.startWorkoutFromWatch(dayNumber: coordinator.workoutState.dayNumber, phase: "warmup")
                    }) {
                        HStack(spacing: 8) {
                            ZStack {
                                Circle()
                                    .fill(Color.black.opacity(0.2))
                                    .frame(width: 28, height: 28)
                                Image(systemName: "play.fill")
                                    .font(.system(size: 12))
                                    .foregroundColor(.black)
                            }

                            Text(coordinator.workoutState.dayNumber > 0 ? "START DAY \(coordinator.workoutState.dayNumber)" : "START WORKOUT")
                                .font(.system(size: 12.5, weight: .black, design: .rounded))
                                .foregroundColor(.black)

                            Spacer()

                            Image(systemName: "chevron.right")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.black.opacity(0.6))
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 10)
                        .background(
                            LinearGradient(
                                colors: [Color(red: 0.83, green: 0.69, blue: 0.22), Color(red: 0.67, green: 0.51, blue: 0.04)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .cornerRadius(12)
                    }
                    .buttonStyle(PlainButtonStyle())

                    Button(action: {
                        WKInterfaceDevice.current().play(.start)
                        workoutManager.startWorkout(activityType: .highIntensityIntervalTraining)
                        coordinator.workoutState.isSessionActive = true
                        coordinator.workoutState.activePhase = "cardio"
                        coordinator.selectedTab = 1
                        coordinator.startWorkoutFromWatch(dayNumber: coordinator.workoutState.dayNumber, phase: "cardio")
                    }) {
                        HStack(spacing: 8) {
                            ZStack {
                                Circle()
                                    .fill(Color(red: 0.97, green: 0.44, blue: 0.44).opacity(0.2))
                                    .frame(width: 28, height: 28)
                                Image(systemName: "bolt.heart.fill")
                                    .font(.system(size: 14))
                                    .foregroundColor(Color(red: 0.97, green: 0.44, blue: 0.44))
                            }

                            Text("START CARDIO")
                                .font(.system(size: 13, weight: .black, design: .rounded))
                                .foregroundColor(.white)

                            Spacer()

                            Image(systemName: "play.fill")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.gray)
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 10)
                        .background(Color.white.opacity(0.08))
                        .cornerRadius(12)
                    }
                    .buttonStyle(PlainButtonStyle())
                }

                // Connection Subtext
                Text(coordinator.isPhoneReachable ? "Connected to iPhone Live Session" : "Standalone HealthKit Workout")
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundColor(.gray)
                    .padding(.top, 2)
            }
            .padding(.horizontal, 4)
        }
    }
}
