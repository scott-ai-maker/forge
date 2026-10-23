import SwiftUI

/**
 * CardioZoneView
 * High-contrast Tanaka stage cardio zones, active calories, and real-time optical BPM.
 * Massive 48pt heart rate telemetry designed for instant eye-level glanceability during sprints.
 * Forge Athletic
 */
public struct CardioZoneView: View {
    @ObservedObject var workoutManager = WatchWorkoutManager.shared

    public var body: some View {
        VStack(spacing: 6) {
            // Top Telemetry Header: Elapsed Time & Active Calories
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("ELAPSED")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(.gray)
                    Text(formatElapsed(workoutManager.elapsedSeconds))
                        .font(.system(size: 15, weight: .black, design: .monospaced))
                        .foregroundColor(.white)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text("ACTIVE KCAL")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(.gray)
                    Text("\(Int(workoutManager.activeCalories))")
                        .font(.system(size: 15, weight: .black, design: .monospaced))
                        .foregroundColor(Color(red: 0.97, green: 0.58, blue: 0.22)) // Sunset Orange
                }
            }
            .padding(.horizontal, 6)

            Spacer(minLength: 0)

            // Hero Heart Rate Telemetry
            VStack(spacing: 2) {
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Image(systemName: "heart.fill")
                        .font(.system(size: 24))
                        .foregroundColor(zoneColor(workoutManager.currentZone))

                    Text(workoutManager.currentHeartRate > 0 ? "\(workoutManager.currentHeartRate)" : "--")
                        .font(.system(size: 52, weight: .black, design: .rounded))
                        .monospacedDigit()
                        .foregroundColor(.white)

                    Text("BPM")
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundColor(.gray)
                }

                // Tanaka Zone Badge
                Text(stageTargetName(workoutManager.currentZone))
                    .font(.system(size: 12, weight: .black, design: .rounded))
                    .foregroundColor(zoneColor(workoutManager.currentZone))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(zoneColor(workoutManager.currentZone).opacity(0.18))
                    .cornerRadius(8)
            }

            Spacer(minLength: 0)

            // High-Contrast Segmented Tanaka Stage Gauge
            HStack(spacing: 4) {
                // Zone 1
                VStack(spacing: 3) {
                    Rectangle()
                        .fill(workoutManager.currentZone >= 1 ? Color(red: 0.06, green: 0.72, blue: 0.51) : Color.white.opacity(0.12))
                        .frame(height: 8)
                        .cornerRadius(4)
                    Text("Z1")
                        .font(.system(size: 9, weight: .black))
                        .foregroundColor(workoutManager.currentZone == 1 ? Color(red: 0.06, green: 0.72, blue: 0.51) : .gray)
                }

                // Zone 2
                VStack(spacing: 3) {
                    Rectangle()
                        .fill(workoutManager.currentZone >= 2 ? Color(red: 0.83, green: 0.63, blue: 0.09) : Color.white.opacity(0.12))
                        .frame(height: 8)
                        .cornerRadius(4)
                    Text("Z2")
                        .font(.system(size: 9, weight: .black))
                        .foregroundColor(workoutManager.currentZone == 2 ? Color(red: 0.83, green: 0.63, blue: 0.09) : .gray)
                }

                // Zone 3
                VStack(spacing: 3) {
                    Rectangle()
                        .fill(workoutManager.currentZone >= 3 ? Color(red: 0.97, green: 0.44, blue: 0.44) : Color.white.opacity(0.12))
                        .frame(height: 8)
                        .cornerRadius(4)
                    Text("Z3")
                        .font(.system(size: 9, weight: .black))
                        .foregroundColor(workoutManager.currentZone == 3 ? Color(red: 0.97, green: 0.44, blue: 0.44) : .gray)
                }
            }
            .padding(.horizontal, 4)
        }
        .padding(.horizontal, 4)
        .padding(.bottom, 2)
    }

    private func formatElapsed(_ totalSeconds: Int) -> String {
        let mm = totalSeconds / 60
        let ss = totalSeconds % 60
        return String(format: "%02d:%02d", mm, ss)
    }

    private func stageTargetName(_ zone: Int) -> String {
        switch zone {
        case 1: return "ZONE 1 · AEROBIC BASE"
        case 2: return "ZONE 2 · LACTATE THRESHOLD"
        case 3: return "ZONE 3 · PEAK ANAEROBIC"
        default: return "WARMUP"
        }
    }

    private func zoneColor(_ zone: Int) -> Color {
        switch zone {
        case 1: return Color(red: 0.06, green: 0.72, blue: 0.51) // Emerald Green
        case 2: return Color(red: 0.83, green: 0.63, blue: 0.09) // Forge Gold
        case 3: return Color(red: 0.97, green: 0.44, blue: 0.44) // Crimson Red
        default: return Color.gray
        }
    }
}
