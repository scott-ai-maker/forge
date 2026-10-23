import SwiftUI

/**
 * RestTimerRadialView
 * High-contrast, edge-to-edge OLED circular countdown with autonomic recovery pacer.
 * Large 50pt numerals designed for 2-foot glanceability from the gym bench.
 * Forge Athletic
 */
public struct RestTimerRadialView: View {
    @ObservedObject var coordinator = WatchSessionCoordinator.shared
    @ObservedObject var workoutManager = WatchWorkoutManager.shared

    public var body: some View {
        VStack(spacing: 4) {
            // Top: Heart Rate Recovery Telemetry Pill
            HStack(spacing: 6) {
                HStack(spacing: 4) {
                    Image(systemName: "heart.fill")
                        .font(.system(size: 11))
                        .foregroundColor(heartRateColor)
                    Text(workoutManager.currentHeartRate > 0 ? "\(workoutManager.currentHeartRate)" : "--")
                        .font(.system(size: 13, weight: .black, design: .monospaced))
                        .foregroundColor(.white)
                    Text("BPM")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(.gray)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(Color.white.opacity(0.08))
                .cornerRadius(6)

                // Autonomic Status Pill
                Text(coordinator.restTimer.isBioPaced ? "ZONE 1 · READY" : (isReadyToLift ? "READY TO LIFT" : "RECOVERING"))
                    .font(.system(size: 9.5, weight: .black))
                    .foregroundColor(isReadyToLift ? Color(red: 0.06, green: 0.72, blue: 0.51) : Color(red: 0.83, green: 0.63, blue: 0.09))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(
                        (isReadyToLift ? Color(red: 0.06, green: 0.72, blue: 0.51) : Color(red: 0.83, green: 0.63, blue: 0.09)).opacity(0.18)
                    )
                    .cornerRadius(6)
            }

            Spacer(minLength: 0)

            // Massive Edge-to-Edge Radial Countdown Circle
            ZStack {
                // Background Track
                Circle()
                    .stroke(Color.white.opacity(0.12), lineWidth: 8)
                    .frame(width: 128, height: 128)

                // Animated Progress Ring
                Circle()
                    .trim(from: 0.0, to: progressValue)
                    .stroke(
                        ringColor,
                        style: StrokeStyle(lineWidth: 8, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .frame(width: 128, height: 128)
                    .animation(.linear(duration: 1.0), value: progressValue)

                // Massive Center Digits
                VStack(spacing: 0) {
                    Text("\(coordinator.restTimer.remainingSeconds)")
                        .font(.system(size: 46, weight: .black, design: .rounded))
                        .monospacedDigit()
                        .foregroundColor(.white)

                    Text(isReadyToLift ? "READY" : "REST")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(ringColor)
                        .padding(.top, -4)
                }
            }
            .padding(.vertical, 2)

            Spacer(minLength: 0)

            // Pacer Action Controls (-15s, LIFT NOW, +15s)
            HStack(spacing: 8) {
                // Minus 15s Button
                Button(action: {
                    coordinator.triggerRestAction("minus15")
                    WKInterfaceDevice.current().play(.click)
                }) {
                    Text("-15")
                        .font(.system(size: 13, weight: .black, design: .rounded))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.white.opacity(0.12))
                        .foregroundColor(.white)
                        .cornerRadius(8)
                }
                .buttonStyle(PlainButtonStyle())

                // Big Hero LIFT NOW / Next Set Button
                Button(action: {
                    coordinator.triggerRestAction("ready")
                    WatchHapticManager.shared.playSuccessKnock()
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: "forward.fill")
                            .font(.system(size: 10, weight: .bold))
                        Text("LIFT")
                            .font(.system(size: 13, weight: .black, design: .rounded))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(
                        isReadyToLift
                            ? Color(red: 0.06, green: 0.72, blue: 0.51) // Emerald Green
                            : Color(red: 0.22, green: 0.74, blue: 0.97) // Cyan
                    )
                    .foregroundColor(isReadyToLift ? .white : .black)
                    .cornerRadius(8)
                }
                .buttonStyle(PlainButtonStyle())

                // Plus 15s Button
                Button(action: {
                    coordinator.triggerRestAction("add15")
                    WKInterfaceDevice.current().play(.click)
                }) {
                    Text("+15")
                        .font(.system(size: 13, weight: .black, design: .rounded))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.white.opacity(0.12))
                        .foregroundColor(.white)
                        .cornerRadius(8)
                }
                .buttonStyle(PlainButtonStyle())
            }
            .padding(.horizontal, 4)
        }
        .padding(.horizontal, 4)
        .padding(.bottom, 2)
    }

    private var progressValue: CGFloat {
        guard coordinator.restTimer.totalRestSeconds > 0 else { return 0.0 }
        let current = CGFloat(coordinator.restTimer.remainingSeconds)
        let total = CGFloat(coordinator.restTimer.totalRestSeconds)
        return min(1.0, max(0.0, current / total))
    }

    private var isReadyToLift: Bool {
        return coordinator.restTimer.isBioPaced || coordinator.restTimer.remainingSeconds <= 15
    }

    private var ringColor: Color {
        if isReadyToLift {
            return Color(red: 0.06, green: 0.72, blue: 0.51) // Emerald Green
        }
        return Color(red: 0.83, green: 0.63, blue: 0.09) // Forge Gold
    }

    private var heartRateColor: Color {
        let hr = workoutManager.currentHeartRate
        if hr == 0 { return .gray }
        if hr < 115 { return Color(red: 0.06, green: 0.72, blue: 0.51) }
        if hr < 145 { return Color(red: 0.83, green: 0.63, blue: 0.09) }
        return Color(red: 0.97, green: 0.44, blue: 0.44)
    }
}
