import SwiftUI

/**
 * TempoMetronomeView
 * Visual contraction pacer and synchronous Taptic metronome for NASM OPT™ tempos
 * Forge Athletic
 */
public struct TempoMetronomeView: View {
    @ObservedObject var coordinator = WatchSessionCoordinator.shared

    @State private var isPacing: Bool = false
    @State private var currentPhaseName: String = "Eccentric"
    @State private var phaseSecondsRemaining: Int = 4
    @State private var currentPhaseIndex: Int = 0 // 0: Eccentric, 1: Iso-bottom, 2: Concentric, 3: Iso-top
    @State private var timer: Timer?

    // Default 4-2-1-1 tempo numbers
    @State private var eccentricSeconds: Int = 4
    @State private var isoBottomSeconds: Int = 2
    @State private var concentricSeconds: Int = 1
    @State private var isoTopSeconds: Int = 1

    public var body: some View {
        VStack(spacing: 8) {
            // Header
            HStack {
                Text("NASM TEMPO")
                    .font(.system(size: 10, weight: .black))
                    .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))
                Spacer()
                Text("\(eccentricSeconds)-\(isoBottomSeconds)-\(concentricSeconds)-\(isoTopSeconds)")
                    .font(.system(size: 11, weight: .bold, design: .monospaced))
                    .foregroundColor(.white)
            }
            .padding(.horizontal, 4)

            // Dynamic Visual Contraction Pacer
            VStack(spacing: 2) {
                Text(currentPhaseName.uppercased())
                    .font(.system(size: 11, weight: .black))
                    .foregroundColor(phaseColor)

                Text("\(phaseSecondsRemaining)")
                    .font(.system(size: 34, weight: .black, design: .rounded))
                    .foregroundColor(.white)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(phaseColor.opacity(0.12))
            .cornerRadius(10)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(phaseColor.opacity(0.6), lineWidth: 1.5)
            )

            // Start / Stop Cadence Button
            Button(action: togglePacing) {
                HStack(spacing: 4) {
                    Image(systemName: isPacing ? "pause.fill" : "play.fill")
                        .font(.system(size: 10, weight: .black))
                    Text(isPacing ? "PAUSE PACER" : "START CADENCE")
                        .font(.system(size: 11, weight: .black))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 6)
                .background(isPacing ? Color.red.opacity(0.8) : Color(red: 0.22, green: 0.74, blue: 0.97))
                .foregroundColor(.white)
                .cornerRadius(8)
            }
            .buttonStyle(PlainButtonStyle())
        }
        .padding(.horizontal, 4)
        .onAppear(perform: parsePrescribedTempo)
        .onDisappear {
            stopPacing()
        }
    }

    private var phaseColor: Color {
        switch currentPhaseIndex {
        case 0: return Color(red: 0.22, green: 0.74, blue: 0.97) // Cyan Lowering
        case 1: return Color(red: 0.83, green: 0.63, blue: 0.09) // Gold Hold
        case 2: return Color(red: 0.06, green: 0.72, blue: 0.51) // Green Explode
        case 3: return Color.gray
        default: return Color.white
        }
    }

    private func parsePrescribedTempo() {
        let tempoStr = coordinator.workoutState.activeExercise?.tempo ?? "4-2-1-1"
        let parts = tempoStr.split(separator: "-").compactMap { Int($0) }
        if parts.count == 4 {
            eccentricSeconds = parts[0]
            isoBottomSeconds = parts[1]
            concentricSeconds = parts[2]
            isoTopSeconds = parts[3]
        }
    }

    private func togglePacing() {
        if isPacing {
            stopPacing()
        } else {
            startPacing()
        }
    }

    private func startPacing() {
        isPacing = true
        currentPhaseIndex = 0
        currentPhaseName = "Eccentric (Lower)"
        phaseSecondsRemaining = eccentricSeconds

        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            tickPacer()
        }
    }

    private func stopPacing() {
        isPacing = false
        timer?.invalidate()
        timer = nil
    }

    private func tickPacer() {
        phaseSecondsRemaining -= 1

        let phaseKey = currentPhaseIndex == 0 ? "eccentric" : currentPhaseIndex == 1 ? "isometric" : "concentric"
        WatchHapticManager.shared.playTempoBeat(phase: phaseKey)

        if phaseSecondsRemaining <= 0 {
            advancePhase()
        }
    }

    private func advancePhase() {
        currentPhaseIndex = (currentPhaseIndex + 1) % 4
        switch currentPhaseIndex {
        case 0:
            currentPhaseName = "Eccentric (Lower)"
            phaseSecondsRemaining = max(1, eccentricSeconds)
        case 1:
            currentPhaseName = "Isometric (Hold)"
            phaseSecondsRemaining = max(1, isoBottomSeconds)
        case 2:
            currentPhaseName = "Concentric (Drive)"
            phaseSecondsRemaining = max(1, concentricSeconds)
        case 3:
            currentPhaseName = "Reset"
            phaseSecondsRemaining = max(1, isoTopSeconds)
        default:
            break
        }
    }
}
