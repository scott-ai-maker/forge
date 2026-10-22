import SwiftUI

/**
 * ForgeWatchApp
 * Standalone companion watchOS application for Forge Athletic
 * Forge Athletic
 */
@main
struct ForgeWatchApp: App {
    @StateObject private var coordinator = WatchSessionCoordinator.shared
    @StateObject private var workoutManager = WatchWorkoutManager.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(coordinator)
                .environmentObject(workoutManager)
                .onAppear {
                    coordinator.activateSession()
                    workoutManager.requestPermissions { _ in }
                }
        }
    }
}

struct ContentView: View {
    @ObservedObject var coordinator = WatchSessionCoordinator.shared
    @ObservedObject var workoutManager = WatchWorkoutManager.shared

    @State private var selectedTab: Int = 0

    var body: some View {
        Group {
            if coordinator.workoutState.isSessionActive || workoutManager.isWorkoutActive {
                TabView(selection: $selectedTab) {
                    WorkoutActiveView()
                        .tag(0)

                    RestTimerRadialView()
                        .tag(1)

                    CardioZoneView()
                        .tag(2)

                    TempoMetronomeView()
                        .tag(3)
                }
                .tabViewStyle(PageTabViewStyle())
            } else {
                WatchHomeView()
            }
        }
        .background(Color(red: 0.06, green: 0.09, blue: 0.14).ignoresSafeArea()) // #0F172A
    }
}

/**
 * WatchHomeView
 * Idle dashboard displayed before or between gym workouts
 */
struct WatchHomeView: View {
    @ObservedObject var coordinator = WatchSessionCoordinator.shared
    @ObservedObject var workoutManager = WatchWorkoutManager.shared

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                // Brand Header
                HStack(spacing: 4) {
                    Circle()
                        .fill(Color(red: 0.83, green: 0.63, blue: 0.09)) // Gold
                        .frame(width: 6, height: 6)
                    Text("FORGE ATHLETIC")
                        .font(.system(size: 10, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                    Spacer()
                }

                // Morning CNS Readiness Card
                CNSReadinessCardView(cns: coordinator.cnsReadiness)

                // Quick In-Gym Start Buttons
                VStack(spacing: 6) {
                    Button(action: {
                        workoutManager.startWorkout(activityType: .traditionalStrengthTraining)
                        coordinator.workoutState.isSessionActive = true
                    }) {
                        HStack {
                            Image(systemName: "dumbbell.fill")
                                .font(.system(size: 11))
                            Text("Start Strength")
                                .font(.system(size: 12, weight: .bold))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color(red: 0.22, green: 0.74, blue: 0.97)) // Cyan
                        .foregroundColor(.black)
                        .cornerRadius(8)
                    }
                    .buttonStyle(PlainButtonStyle())

                    Button(action: {
                        workoutManager.startWorkout(activityType: .highIntensityIntervalTraining)
                        coordinator.workoutState.isSessionActive = true
                    }) {
                        HStack {
                            Image(systemName: "bolt.heart.fill")
                                .font(.system(size: 11))
                            Text("Start Cardio")
                                .font(.system(size: 12, weight: .bold))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.white.opacity(0.1))
                        .foregroundColor(.white)
                        .cornerRadius(8)
                    }
                    .buttonStyle(PlainButtonStyle())
                }

                // Connection Status Notice
                Text(coordinator.isPhoneReachable ? "✓ Paired with iPhone" : "Standalone Offline Mode")
                    .font(.system(size: 8, weight: .semibold))
                    .foregroundColor(coordinator.isPhoneReachable ? Color(red: 0.06, green: 0.72, blue: 0.51) : .gray)
                    .padding(.top, 2)
            }
            .padding(.horizontal, 4)
        }
    }
}
