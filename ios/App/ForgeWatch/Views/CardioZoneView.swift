import SwiftUI

/**
 * CardioZoneView
 * Real-time Tanaka stage cardio zones, active calories, and boundary pacing
 * Forge Athletic
 */
public struct CardioZoneView: View {
    @ObservedObject var workoutManager = WatchWorkoutManager.shared

    public var body: some View {
        VStack(spacing: 6) {
            // Top Telemetry Header
            HStack {
                VStack(alignment: .leading, spacing: 1) {
                    Text("TIME")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundColor(.gray)
                    Text(formatElapsed(workoutManager.elapsedSeconds))
                        .font(.system(size: 13, weight: .heavy, design: .monospaced))
                        .foregroundColor(.white)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 1) {
                    Text("CALORIES")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundColor(.gray)
                    Text("\(Int(workoutManager.activeCalories))")
                        .font(.system(size: 13, weight: .heavy, design: .monospaced))
                        .foregroundColor(Color(red: 0.97, green: 0.58, blue: 0.22))
                }
            }
            .padding(.horizontal, 6)

            // Huge Heart Rate Display
            VStack(spacing: 0) {
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text(workoutManager.currentHeartRate > 0 ? "\(workoutManager.currentHeartRate)" : "--")
                        .font(.system(size: 38, weight: .black, design: .rounded))
                        .foregroundColor(zoneColor(workoutManager.currentZone))

                    Text("BPM")
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundColor(.gray)
                }

                Text(stageTargetName(workoutManager.currentZone))
                    .font(.system(size: 10, weight: .heavy))
                    .foregroundColor(zoneColor(workoutManager.currentZone))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(zoneColor(workoutManager.currentZone).opacity(0.18))
                    .cornerRadius(6)
            }

            // 3-Zone Segmented Bar
            HStack(spacing: 3) {
                // Zone 1
                Rectangle()
                    .fill(workoutManager.currentZone == 1 ? Color(red: 0.06, green: 0.72, blue: 0.51) : Color.white.opacity(0.1))
                    .frame(height: 6)
                    .cornerRadius(3)

                // Zone 2
                Rectangle()
                    .fill(workoutManager.currentZone == 2 ? Color(red: 0.83, green: 0.63, blue: 0.09) : Color.white.opacity(0.1))
                    .frame(height: 6)
                    .cornerRadius(3)

                // Zone 3
                Rectangle()
                    .fill(workoutManager.currentZone == 3 ? Color(red: 0.97, green: 0.44, blue: 0.44) : Color.white.opacity(0.1))
                    .frame(height: 6)
                    .cornerRadius(3)
            }
            .padding(.horizontal, 6)
            .padding(.top, 2)

            Text("Tanaka Bio-Feedback · Coach Gordon Voice Ducking")
                .font(.system(size: 8, weight: .medium))
                .foregroundColor(.gray)
                .lineLimit(1)
        }
        .padding(.horizontal, 4)
    }

    private func formatElapsed(_ totalSeconds: Int) -> String {
        let mm = totalSeconds / 60
        let ss = totalSeconds % 60
        return String(format: "%02d:%02d", mm, ss)
    }

    private func stageTargetName(_ zone: Int) -> String {
        switch zone {
        case 1: return "Zone 1 · Aerobic Recovery"
        case 2: return "Zone 2 · Lactate Threshold (VT1)"
        case 3: return "Zone 3 · Peak Anaerobic (VT2)"
        default: return "Zone 1 · Base"
        }
    }

    private func zoneColor(_ zone: Int) -> Color {
        switch zone {
        case 1: return Color(red: 0.06, green: 0.72, blue: 0.51)
        case 2: return Color(red: 0.83, green: 0.63, blue: 0.09)
        case 3: return Color(red: 0.97, green: 0.44, blue: 0.44)
        default: return Color.gray
        }
    }
}
