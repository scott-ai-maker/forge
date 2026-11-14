import SwiftUI
import WatchKit

/**
 * TempoMetronomeView
 * Silent Haptic NASM OPT™ Phase 01 Tempo Metronome (`3-1-1`, `4-2-1`, or `4-2-1-0`).
 * Guides slow-eccentric lowering, bottom pause, and concentric drive via rhythmic
 * WKHapticType pulses (.directionDown / .click / .directionUp) without staring at a screen.
 *
 * Forge Athletic — Obsidian (#000000 / #14171F) & Emerald (#10B981) Wrist Design
 */
public struct TempoMetronomeView: View {
    @ObservedObject var coordinator = WatchSessionCoordinator.shared

    @State private var isPacing: Bool = false
    @State private var currentPhaseName: String = "Eccentric (Lower)"
    @State private var phaseSecondsRemaining: Int = 4
    @State private var currentPhaseIndex: Int = 0 // 0: Eccentric, 1: Iso-bottom, 2: Concentric, 3: Iso-top
    @State private var beatInCurrentPhase: Int = 1
    @State private var timer: Timer?

    // Supports both 3-part ("3-1-1", "4-2-1") and 4-part ("4-2-1-0") NASM tempos
    @State private var eccentricSeconds: Int = 4
    @State private var isoBottomSeconds: Int = 2
    @State private var concentricSeconds: Int = 1
    @State private var isoTopSeconds: Int = 0

    private let cardSurface = Color(red: 0.078, green: 0.090, blue: 0.122) // #14171F
    private let emeraldPrimary = Color(red: 0.063, green: 0.725, blue: 0.506) // #10B981
    private let amberBadge = Color(red: 0.961, green: 0.620, blue: 0.043) // #F59E0B
    private let coralBadge = Color(red: 0.957, green: 0.247, blue: 0.369) // #F43F5E

    public init() {}

    public var body: some View {
        VStack(spacing: 5) {
            // Header: Prescribed NASM Tempo + Quick Phase 01 Presets (3-1-1 / 4-2-1)
            HStack(spacing: 4) {
                Text("TEMPO")
                    .font(.system(size: 10, weight: .black, design: .rounded))
                    .foregroundColor(emeraldPrimary)

                Spacer()

                ForEach(["3-1-1", "4-2-1"], id: \.self) { preset in
                    let isActivePreset = formattedTempoLabel == preset
                    Button(action: {
                        applyTempoString(preset)
                        WKInterfaceDevice.current().play(.click)
                    }) {
                        Text(preset)
                            .font(.system(size: 9.5, weight: .black, design: .monospaced))
                            .monospacedDigit()
                            .padding(.horizontal, 5)
                            .padding(.vertical, 2)
                            .background(isActivePreset ? emeraldPrimary : cardSurface)
                            .foregroundColor(isActivePreset ? .black : .white.opacity(0.85))
                            .cornerRadius(5)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .padding(.horizontal, 4)

            Spacer(minLength: 0)

            // Tactile Contraction Phase Card (#14171F + High-Contrast Phase Border)
            VStack(spacing: 1) {
                Text(currentPhaseName.uppercased())
                    .font(.system(size: 11.5, weight: .black, design: .rounded))
                    .foregroundColor(phaseColor)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)

                Text("\(phaseSecondsRemaining)")
                    .font(.system(size: 46, weight: .black, design: .monospaced))
                    .monospacedDigit()
                    .foregroundColor(.white)
                    .padding(.vertical, -2)

                Text(formattedTempoLabel)
                    .font(.system(size: 9.5, weight: .bold, design: .monospaced))
                    .monospacedDigit()
                    .foregroundColor(.gray)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 6)
            .background(cardSurface)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(phaseColor.opacity(0.85), lineWidth: 1.5)
            )

            Spacer(minLength: 0)

            // Start / Pause Silent Haptic Metronome Button
            Button(action: togglePacing) {
                HStack(spacing: 6) {
                    Image(systemName: isPacing ? "pause.fill" : "waveform.path")
                        .font(.system(size: 11.5, weight: .bold))
                    Text(isPacing ? "PAUSE HAPTICS" : "START HAPTIC TEMPO")
                        .font(.system(size: 11.5, weight: .black, design: .rounded))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 9)
                .background(isPacing ? coralBadge : emeraldPrimary)
                .foregroundColor(isPacing ? .white : .black)
                .cornerRadius(10)
            }
            .buttonStyle(PlainButtonStyle())
        }
        .padding(.horizontal, 4)
        .padding(.bottom, 2)
        .background(Color.black.ignoresSafeArea())
        .onAppear(perform: parsePrescribedTempo)
        .onChange(of: coordinator.workoutState.activeExercise?.tempo) { _, _ in
            parsePrescribedTempo()
        }
        .onDisappear {
            stopPacing()
        }
    }

    private var formattedTempoLabel: String {
        if isoTopSeconds > 0 {
            return "\(eccentricSeconds)-\(isoBottomSeconds)-\(concentricSeconds)-\(isoTopSeconds)"
        }
        return "\(eccentricSeconds)-\(isoBottomSeconds)-\(concentricSeconds)"
    }

    private var phaseColor: Color {
        switch currentPhaseIndex {
        case 0: return Color(red: 0.22, green: 0.74, blue: 0.97) // Lowering
        case 1: return amberBadge // Isometric Pause
        case 2: return emeraldPrimary // Concentric Drive
        default: return Color.gray
        }
    }

    private func parsePrescribedTempo() {
        let tempoStr = coordinator.workoutState.activeExercise?.tempo ?? "4-2-1"
        applyTempoString(tempoStr)
    }

    private func applyTempoString(_ tempoStr: String) {
        let parts = tempoStr.split(separator: "-").compactMap { Int($0) }
        if parts.count >= 4 {
            eccentricSeconds = max(1, parts[0])
            isoBottomSeconds = max(0, parts[1])
            concentricSeconds = max(1, parts[2])
            isoTopSeconds = max(0, parts[3])
        } else if parts.count == 3 {
            eccentricSeconds = max(1, parts[0])
            isoBottomSeconds = max(0, parts[1])
            concentricSeconds = max(1, parts[2])
            isoTopSeconds = 0
        }
        if !isPacing {
            currentPhaseIndex = 0
            currentPhaseName = "Eccentric (Lower)"
            phaseSecondsRemaining = eccentricSeconds
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
        beatInCurrentPhase = 1
        currentPhaseName = "Eccentric (Lower)"
        phaseSecondsRemaining = eccentricSeconds
        WatchHapticManager.shared.playTempoBeat(phase: "eccentric", beatInPhase: 1)

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
        if phaseSecondsRemaining > 1 {
            phaseSecondsRemaining -= 1
            beatInCurrentPhase += 1
            WatchHapticManager.shared.playTempoBeat(phase: phaseHapticKey(currentPhaseIndex), beatInPhase: beatInCurrentPhase)
        } else {
            advancePhase()
        }
    }

    private func advancePhase() {
        var nextIdx = (currentPhaseIndex + 1) % 4
        // Skip 0-second isometric phases cleanly (e.g., 3-0-1 or 3-1-1 with 0s top pause)
        var guardCounter = 0
        while durationForPhase(nextIdx) <= 0 && guardCounter < 4 {
            nextIdx = (nextIdx + 1) % 4
            guardCounter += 1
        }

        currentPhaseIndex = nextIdx
        beatInCurrentPhase = 1
        phaseSecondsRemaining = max(1, durationForPhase(nextIdx))

        switch nextIdx {
        case 0: currentPhaseName = "Eccentric (Lower)"
        case 1: currentPhaseName = "Isometric (Pause)"
        case 2: currentPhaseName = "Concentric (Drive)"
        default: currentPhaseName = "Top Reset"
        }

        WatchHapticManager.shared.playTempoBeat(phase: phaseHapticKey(nextIdx), beatInPhase: 1)
    }

    private func durationForPhase(_ idx: Int) -> Int {
        switch idx {
        case 0: return eccentricSeconds
        case 1: return isoBottomSeconds
        case 2: return concentricSeconds
        default: return isoTopSeconds
        }
    }

    private func phaseHapticKey(_ idx: Int) -> String {
        switch idx {
        case 0: return "eccentric"
        case 1: return "isometric"
        case 2: return "concentric"
        default: return "top"
        }
    }
}
