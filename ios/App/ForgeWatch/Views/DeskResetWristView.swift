import SwiftUI
import HealthKit
import WatchKit

/**
 * DeskResetWristView
 * Standalone 5-Minute Desk Reset on Apple Watch.
 * Works completely offline when the iPhone is in another room:
 * - Starts an `.flexibility` HKWorkoutSession to close the Apple Fitness Exercise ring
 * - Delivers silent haptic interval chimes (30s / 45s per mobility drill)
 * - Queues completion via `transferUserInfo` so the daily streak updates reliably on next sync
 *
 * Forge Athletic — Obsidian (#000000 / #14171F) & Emerald (#10B981) Wrist Design
 */
public struct DeskResetWristView: View {
    @ObservedObject var coordinator = WatchSessionCoordinator.shared
    @ObservedObject var workoutManager = WatchWorkoutManager.shared
    @Environment(\.dismiss) private var dismiss

    @State private var intervalChoiceSec: Int = 45
    @State private var drills: [WatchDeskResetDrill] = []
    @State private var currentDrillIndex: Int = 0
    @State private var remainingSec: Int = 45
    @State private var totalElapsedSec: Int = 0
    @State private var isRunning: Bool = false
    @State private var isCompleted: Bool = false
    @State private var drillTimer: Timer? = nil

    private let cardSurface = Color(red: 0.078, green: 0.090, blue: 0.122) // #14171F
    private let emeraldPrimary = Color(red: 0.063, green: 0.725, blue: 0.506) // #10B981
    private let amberBadge = Color(red: 0.961, green: 0.620, blue: 0.043) // #F59E0B

    public init() {}

    public var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            if isCompleted {
                completionView
            } else if isRunning || totalElapsedSec > 0 {
                activePlayerView
            } else {
                setupLauncherView
            }
        }
        .onAppear {
            rebuildRoutine()
        }
        .onDisappear {
            drillTimer?.invalidate()
            drillTimer = nil
        }
    }

    private var setupLauncherView: some View {
        ScrollView {
            VStack(spacing: 8) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text("5-MIN DESK RESET")
                            .font(.system(size: 10, weight: .black, design: .rounded))
                            .foregroundColor(emeraldPrimary)
                        Spacer()
                        Text("🔥 \(coordinator.companionSummary.dailyStreak)d")
                            .font(.system(size: 10, weight: .bold, design: .monospaced))
                            .monospacedDigit()
                            .foregroundColor(amberBadge)
                    }

                    Text("Standalone Mobility")
                        .font(.system(size: 14, weight: .black, design: .rounded))
                        .foregroundColor(.white)

                    Text("Silent wrist haptics · Closes Exercise ring · Syncs offline")
                        .font(.system(size: 9.5, weight: .medium))
                        .foregroundColor(.gray)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(9)
                .background(cardSurface)
                .cornerRadius(12)

                // Drill Interval Cadence Toggle (30s vs 45s)
                HStack(spacing: 6) {
                    ForEach([30, 45], id: \.self) { sec in
                        let selected = intervalChoiceSec == sec
                        Button(action: {
                            intervalChoiceSec = sec
                            rebuildRoutine()
                            WKInterfaceDevice.current().play(.click)
                        }) {
                            Text("\(sec)s Chimes")
                                .font(.system(size: 10.5, weight: .black, design: .rounded))
                                .monospacedDigit()
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 7)
                                .background(selected ? emeraldPrimary.opacity(0.22) : cardSurface)
                                .foregroundColor(selected ? emeraldPrimary : .gray)
                                .cornerRadius(9)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 9)
                                        .stroke(selected ? emeraldPrimary : Color.white.opacity(0.08), lineWidth: 1)
                                )
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }

                // Start 5-Min Desk Reset CTA
                Button(action: beginResetSession) {
                    HStack(spacing: 6) {
                        Image(systemName: "play.fill")
                            .font(.system(size: 12, weight: .bold))
                        Text("Start 5-Min Reset")
                            .font(.system(size: 13, weight: .black, design: .rounded))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 11)
                    .background(emeraldPrimary)
                    .foregroundColor(.black)
                    .cornerRadius(12)
                }
                .buttonStyle(PlainButtonStyle())
            }
            .padding(.horizontal, 4)
        }
    }

    private var activePlayerView: some View {
        let currentDrill = drills.indices.contains(currentDrillIndex)
            ? drills[currentDrillIndex]
            : WatchDeskResetDrill(id: "reset", title: "Cervical Chin Tuck", cue: "Tall spine, smooth nasal breath.", targetArea: "Neck & Spine", durationSec: intervalChoiceSec)
        let drillDuration = max(1, currentDrill.durationSec)
        let progress = Double(remainingSec) / Double(drillDuration)

        return VStack(spacing: 6) {
            HStack {
                Text("DRILL \(currentDrillIndex + 1)/\(max(1, drills.count))")
                    .font(.system(size: 9.5, weight: .black, design: .monospaced))
                    .monospacedDigit()
                    .foregroundColor(emeraldPrimary)

                Spacer()

                HStack(spacing: 3) {
                    Image(systemName: "heart.fill")
                        .font(.system(size: 9))
                        .foregroundColor(emeraldPrimary)
                    Text(workoutManager.currentHeartRate > 0 ? "\(workoutManager.currentHeartRate)" : "--")
                        .font(.system(size: 10.5, weight: .bold, design: .monospaced))
                        .monospacedDigit()
                        .foregroundColor(.white)
                }
            }
            .padding(.horizontal, 4)

            // Circular Countdown Ring
            ZStack {
                Circle()
                    .stroke(Color.white.opacity(0.10), lineWidth: 6)

                Circle()
                    .trim(from: 0.0, to: CGFloat(max(0.0, min(1.0, progress))))
                    .stroke(emeraldPrimary, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .animation(.linear(duration: 0.9), value: remainingSec)

                VStack(spacing: 1) {
                    Text(formatMMSS(remainingSec))
                        .font(.system(size: 22, weight: .black, design: .monospaced))
                        .monospacedDigit()
                        .foregroundColor(.white)

                    Text(currentDrill.targetArea.uppercased())
                        .font(.system(size: 7.5, weight: .bold, design: .rounded))
                        .foregroundColor(.gray)
                        .lineLimit(1)
                }
            }
            .frame(width: 82, height: 82)

            VStack(spacing: 2) {
                Text(currentDrill.title)
                    .font(.system(size: 12, weight: .black, design: .rounded))
                    .foregroundColor(.white)
                    .lineLimit(1)

                Text(currentDrill.cue)
                    .font(.system(size: 9.5, weight: .medium))
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
            }
            .padding(.horizontal, 4)

            HStack(spacing: 6) {
                Button(action: togglePause) {
                    Image(systemName: isRunning ? "pause.fill" : "play.fill")
                        .font(.system(size: 12, weight: .bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(cardSurface)
                        .foregroundColor(.white)
                        .cornerRadius(9)
                }
                .buttonStyle(PlainButtonStyle())

                Button(action: advanceOrFinish) {
                    Text(currentDrillIndex + 1 < drills.count ? "Next" : "Finish")
                        .font(.system(size: 11.5, weight: .black, design: .rounded))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(emeraldPrimary)
                        .foregroundColor(.black)
                        .cornerRadius(9)
                }
                .buttonStyle(PlainButtonStyle())
            }
            .padding(.horizontal, 4)
        }
        .padding(.vertical, 2)
    }

    private var completionView: some View {
        VStack(spacing: 8) {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 28))
                .foregroundColor(emeraldPrimary)

            Text("DESK RESET LOGGED")
                .font(.system(size: 13, weight: .black, design: .rounded))
                .foregroundColor(.white)

            Text("Streak: \(coordinator.companionSummary.dailyStreak)d · Queued to Forge")
                .font(.system(size: 10, weight: .semibold, design: .monospaced))
                .monospacedDigit()
                .foregroundColor(emeraldPrimary)

            Button(action: { dismiss() }) {
                Text("Done")
                    .font(.system(size: 12.5, weight: .black, design: .rounded))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(emeraldPrimary)
                    .foregroundColor(.black)
                    .cornerRadius(10)
            }
            .buttonStyle(PlainButtonStyle())
            .padding(.horizontal, 6)
        }
        .padding(10)
    }

    private func rebuildRoutine() {
        let built = WatchDeskResetDrill.prioritizedRoutine(
            ergonomicFlags: coordinator.companionSummary.ergonomicFlags,
            intervalSec: intervalChoiceSec
        )
        drills = built
        currentDrillIndex = 0
        remainingSec = built.first?.durationSec ?? intervalChoiceSec
    }

    private func beginResetSession() {
        if drills.isEmpty { rebuildRoutine() }
        isRunning = true
        currentDrillIndex = 0
        remainingSec = drills.first?.durationSec ?? intervalChoiceSec
        WatchHapticManager.shared.playDeskResetIntervalChime()

        if !workoutManager.isWorkoutActive {
            workoutManager.requestPermissions { _ in
                workoutManager.startWorkout(
                    activityType: .flexibility,
                    workoutId: "desk-reset-\(Int(Date().timeIntervalSince1970))",
                    sessionKind: "desk_reset"
                )
            }
        }

        startTickTimer()
    }

    private func startTickTimer() {
        drillTimer?.invalidate()
        drillTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            guard isRunning else { return }
            totalElapsedSec += 1
            if remainingSec > 1 {
                remainingSec -= 1
            } else {
                advanceOrFinish()
            }
        }
    }

    private func togglePause() {
        isRunning.toggle()
        WKInterfaceDevice.current().play(.click)
    }

    private func advanceOrFinish() {
        if currentDrillIndex + 1 < drills.count {
            currentDrillIndex += 1
            remainingSec = drills[currentDrillIndex].durationSec
            WatchHapticManager.shared.playDeskResetIntervalChime()
        } else {
            drillTimer?.invalidate()
            drillTimer = nil
            isRunning = false
            isCompleted = true
            if workoutManager.activeSessionKind == "desk_reset" {
                workoutManager.finishWorkout()
            }
            coordinator.completeDeskResetSession(
                durationSec: max(300, totalElapsedSec),
                drillsCompleted: drills.count
            )
        }
    }

    private func formatMMSS(_ secs: Int) -> String {
        let m = secs / 60
        let s = secs % 60
        return String(format: "%d:%02d", m, s)
    }
}
