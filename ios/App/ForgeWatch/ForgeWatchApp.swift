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
        .background(Color(red: 0.06, green: 0.09, blue: 0.14).ignoresSafeArea()) // #0F172A Obsidian
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

                // Quick Start Buttons (Large 44pt Touch Targets)
                VStack(spacing: 8) {
                    Button(action: {
                        WKInterfaceDevice.current().play(.start)
                        workoutManager.startWorkout(activityType: .traditionalStrengthTraining)
                        coordinator.workoutState.isSessionActive = true
                    }) {
                        HStack(spacing: 8) {
                            ZStack {
                                Circle()
                                    .fill(Color.black.opacity(0.2))
                                    .frame(width: 28, height: 28)
                                Image(systemName: "dumbbell.fill")
                                    .font(.system(size: 14))
                                    .foregroundColor(.black)
                            }

                            Text("START STRENGTH")
                                .font(.system(size: 13, weight: .black, design: .rounded))
                                .foregroundColor(.black)

                            Spacer()

                            Image(systemName: "play.fill")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.black.opacity(0.6))
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 10)
                        .background(
                            LinearGradient(
                                colors: [Color(red: 0.22, green: 0.74, blue: 0.97), Color(red: 0.15, green: 0.60, blue: 0.85)],
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
