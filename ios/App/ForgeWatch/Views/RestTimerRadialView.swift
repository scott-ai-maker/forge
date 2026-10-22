import SwiftUI

/**
 * RestTimerRadialView
 * High-contrast OLED circular countdown, real-time optical BPM from HealthKit,
 * and autonomic 'Ready to Lift' parasympathetic pacer.
 * Forge Athletic
 */
public struct RestTimerRadialView: View {
    @ObservedObject var coordinator = WatchSessionCoordinator.shared
    @ObservedObject var workoutManager = WatchWorkoutManager.shared

    public var body: some View {
        VStack(spacing: 6) {
            // Top: Heart Rate Pill + Tanaka Zone
            HStack(spacing: 6) {
                HStack(spacing: 3) {
                    Image(systemName: "heart.fill")
                        .font(.system(size: 9))
                        .foregroundColor(Color(red: 0.97, green: 0.44, blue: 0.44))
                    Text(workoutManager.currentHeartRate > 0 ? "\(workoutManager.currentHeartRate)" : "--")
                        .font(.system(size: 11, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                    Text("BPM")
                        .font(.system(size: 8, weight: .semibold))
                        .foregroundColor(.gray)
                }

                Text(zoneLabel(zone: workoutManager.currentZone))
                    .font(.system(size: 9, weight: .black))
                    .foregroundColor(zoneColor(zone: workoutManager.currentZone))
                    .padding(.horizontal, 5)
                    .padding(.vertical, 1)
                    .background(zoneColor(zone: workoutManager.currentZone).opacity(0.18))
                    .cornerRadius(4)
            }

            // Radial Countdown Circle
            ZStack {
                Circle()
                    .stroke(Color.white.opacity(0.1), lineWidth: 6)
                    .frame(width: 86, height: 86)

                Circle()
                    .trim(from: 0.0, to: progressValue)
                    .stroke(
                        coordinator.restTimer.isBioPaced
                            ? Color(red: 0.06, green: 0.72, blue: 0.51) // Emerald Green
                            : Color(red: 0.83, green: 0.63, blue: 0.09), // Gold
                        style: StrokeStyle(lineWidth: 6, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .frame(width: 86, height: 86)
                    .animation(.linear(duration: 1.0), value: progressValue)

                VStack(spacing: 0) {
                    Text("\(coordinator.restTimer.remainingSeconds)")
                        .font(.system(size: 28, weight: .black, design: .monospaced))
                        .foregroundColor(.white)

                    Text(coordinator.restTimer.isBioPaced ? "READY" : "REST")
                        .font(.system(size: 9, weight: .black))
                        .foregroundColor(
                            coordinator.restTimer.isBioPaced
                                ? Color(red: 0.06, green: 0.72, blue: 0.51)
                                : Color(red: 0.22, green: 0.74, blue: 0.97)
                        )
                }
            }

            // Quick Pacer Controls (+15s / -15s / Complete)
            HStack(spacing: 8) {
                Button(action: { coordinator.triggerRestAction("minus15") }) {
                    Text("-15")
                        .font(.system(size: 11, weight: .bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 5)
                        .background(Color.white.opacity(0.1))
                        .cornerRadius(6)
                }
                .buttonStyle(PlainButtonStyle())

                Button(action: { coordinator.triggerRestAction("ready") }) {
                    HStack(spacing: 3) {
                        Image(systemName: "forward.fill")
                            .font(.system(size: 8))
                        Text("LIFT")
                            .font(.system(size: 11, weight: .black))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 5)
                    .background(
                        coordinator.restTimer.isBioPaced
                            ? Color(red: 0.06, green: 0.72, blue: 0.51)
                            : Color(red: 0.22, green: 0.74, blue: 0.97)
                    )
                    .foregroundColor(.white)
                    .cornerRadius(6)
                }
                .buttonStyle(PlainButtonStyle())

                Button(action: { coordinator.triggerRestAction("add15") }) {
                    Text("+15")
                        .font(.system(size: 11, weight: .bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 5)
                        .background(Color.white.opacity(0.1))
                        .cornerRadius(6)
                }
                .buttonStyle(PlainButtonStyle())
            }
            .padding(.horizontal, 4)
        }
        .padding(.horizontal, 4)
    }

    private var progressValue: CGFloat {
        guard coordinator.restTimer.totalRestSeconds > 0 else { return 0.0 }
        let current = CGFloat(coordinator.restTimer.remainingSeconds)
        let total = CGFloat(coordinator.restTimer.totalRestSeconds)
        return min(1.0, max(0.0, current / total))
    }

    private func zoneLabel(zone: Int) -> String {
        switch zone {
        case 1: return "Zone 1 (Recov)"
        case 2: return "Zone 2 (VT1)"
        case 3: return "Zone 3 (Peak)"
        default: return "Zone 1"
        }
    }

    private func zoneColor(zone: Int) -> Color {
        switch zone {
        case 1: return Color(red: 0.06, green: 0.72, blue: 0.51) // Green
        case 2: return Color(red: 0.83, green: 0.63, blue: 0.09) // Amber
        case 3: return Color(red: 0.97, green: 0.44, blue: 0.44) // Red
        default: return Color.gray
        }
    }
}
