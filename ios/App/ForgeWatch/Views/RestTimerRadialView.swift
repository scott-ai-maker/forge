import SwiftUI
import WatchKit

/**
 * RestTimerRadialView
 * Silent Rest Countdown (30s–90s) on True OLED Black (#000000).
 * Crisp circular progress ring with strict monospaced tabular digits and a silent
 * double-tap haptic pulse (WKHapticType.notification) at 0:00.
 *
 * Forge Athletic — Obsidian (#000000 / #14171F) & Emerald (#10B981) Wrist Design
 */
public struct RestTimerRadialView: View {
    @ObservedObject var coordinator = WatchSessionCoordinator.shared
    @ObservedObject var workoutManager = WatchWorkoutManager.shared

    private let cardSurface = Color(red: 0.078, green: 0.090, blue: 0.122) // #14171F
    private let emeraldPrimary = Color(red: 0.063, green: 0.725, blue: 0.506) // #10B981
    private let amberBadge = Color(red: 0.961, green: 0.620, blue: 0.043) // #F59E0B
    private let coralBadge = Color(red: 0.957, green: 0.247, blue: 0.369) // #F43F5E

    public init() {}

    public var body: some View {
        VStack(spacing: 4) {
            // Top: Live Heart Rate + Silent Recovery Status Pill
            HStack(spacing: 5) {
                HStack(spacing: 3) {
                    Image(systemName: "heart.fill")
                        .font(.system(size: 10))
                        .foregroundColor(heartRateColor)
                    Text(workoutManager.currentHeartRate > 0 ? "\(workoutManager.currentHeartRate)" : "--")
                        .font(.system(size: 12, weight: .black, design: .monospaced))
                        .monospacedDigit()
                        .foregroundColor(.white)
                    Text("BPM")
                        .font(.system(size: 8.5, weight: .bold))
                        .foregroundColor(.gray)
                }
                .padding(.horizontal, 7)
                .padding(.vertical, 3)
                .background(cardSurface)
                .cornerRadius(6)

                Spacer(minLength: 2)

                Text(coordinator.restTimer.isBioPaced ? coordinator.restTimer.badgeText.uppercased() : (isReadyToLift ? "READY" : "SILENT REST"))
                    .font(.system(size: 8.5, weight: .black, design: .rounded))
                    .foregroundColor(isReadyToLift ? emeraldPrimary : amberBadge)
                    .lineLimit(1)
                    .padding(.horizontal, 7)
                    .padding(.vertical, 3)
                    .background((isReadyToLift ? emeraldPrimary : amberBadge).opacity(0.16))
                    .cornerRadius(6)
            }

            Spacer(minLength: 0)

            // Circular Countdown Ring (Tabular Monospaced Numerals)
            ZStack {
                Circle()
                    .stroke(Color.white.opacity(0.10), lineWidth: 7)
                    .frame(width: 112, height: 112)

                Circle()
                    .trim(from: 0.0, to: progressValue)
                    .stroke(
                        ringColor,
                        style: StrokeStyle(lineWidth: 7, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .frame(width: 112, height: 112)
                    .animation(.linear(duration: 0.95), value: progressValue)

                VStack(spacing: 0) {
                    Text(formatMMSS(coordinator.restTimer.remainingSeconds))
                        .font(.system(size: 30, weight: .black, design: .monospaced))
                        .monospacedDigit()
                        .foregroundColor(.white)

                    Text(coordinator.restTimer.isRunning ? (isReadyToLift ? "NEXT SET" : "SILENT HAPTIC") : "PICK REST")
                        .font(.system(size: 8, weight: .black, design: .rounded))
                        .foregroundColor(ringColor)
                }
            }

            Spacer(minLength: 0)

            if coordinator.restTimer.isRunning {
                // Active Rest Controls (-15s, LIFT, +15s)
                HStack(spacing: 6) {
                    Button(action: {
                        coordinator.triggerRestAction("minus15")
                        WKInterfaceDevice.current().play(.click)
                    }) {
                        Text("-15s")
                            .font(.system(size: 11.5, weight: .black, design: .monospaced))
                            .monospacedDigit()
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(cardSurface)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                    .buttonStyle(PlainButtonStyle())

                    Button(action: {
                        coordinator.triggerRestAction("ready")
                        WatchHapticManager.shared.playSuccessKnock()
                    }) {
                        Text("LIFT")
                            .font(.system(size: 12, weight: .black, design: .rounded))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(emeraldPrimary)
                            .foregroundColor(.black)
                            .cornerRadius(8)
                    }
                    .buttonStyle(PlainButtonStyle())

                    Button(action: {
                        coordinator.triggerRestAction("add15")
                        WKInterfaceDevice.current().play(.click)
                    }) {
                        Text("+15s")
                            .font(.system(size: 11.5, weight: .black, design: .monospaced))
                            .monospacedDigit()
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(cardSurface)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            } else {
                // Quick 1-Tap 30s / 60s / 90s Silent Rest Launchers
                HStack(spacing: 6) {
                    ForEach([30, 60, 90], id: \.self) { sec in
                        Button(action: {
                            WKInterfaceDevice.current().play(.click)
                            coordinator.startLocalRestTimer(
                                seconds: sec,
                                exerciseName: coordinator.workoutState.activeExercise?.exerciseName ?? "Rest"
                            )
                        }) {
                            Text("\(sec)s")
                                .font(.system(size: 12, weight: .black, design: .monospaced))
                                .monospacedDigit()
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 8)
                                .background(sec == 60 ? emeraldPrimary : cardSurface)
                                .foregroundColor(sec == 60 ? .black : .white)
                                .cornerRadius(8)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
            }
        }
        .padding(.horizontal, 4)
        .padding(.bottom, 2)
        .background(Color.black.ignoresSafeArea())
    }

    private func formatMMSS(_ seconds: Int) -> String {
        let m = max(0, seconds) / 60
        let s = max(0, seconds) % 60
        return String(format: "%d:%02d", m, s)
    }

    private var progressValue: CGFloat {
        guard coordinator.restTimer.totalRestSeconds > 0 else { return 0.0 }
        let current = CGFloat(coordinator.restTimer.remainingSeconds)
        let total = CGFloat(coordinator.restTimer.totalRestSeconds)
        return min(1.0, max(0.0, current / total))
    }

    private var isReadyToLift: Bool {
        coordinator.restTimer.isBioPaced || (coordinator.restTimer.isRunning && coordinator.restTimer.remainingSeconds <= 10)
    }

    private var ringColor: Color {
        isReadyToLift ? emeraldPrimary : amberBadge
    }

    private var heartRateColor: Color {
        let hr = workoutManager.currentHeartRate
        if hr == 0 { return .gray }
        if hr < 115 { return emeraldPrimary }
        if hr < 145 { return amberBadge }
        return coralBadge
    }
}
