import SwiftUI
import WatchKit

/**
 * JointComfortCheckInView
 * 2-Screen, <10-Second Digital Crown Joint Comfort Check-In:
 * - Screen 1: Rate Neck, Lower Back, and Hips (1–5 scale via Digital Crown rotation)
 * - Screen 2: Instant composite Joint Comfort Score (0–100) + 1-tap Sync to iPhone & Coach Portal
 *
 * Forge Athletic — Obsidian (#000000 / #14171F) & Emerald (#10B981) Wrist Design
 */
public struct JointComfortCheckInView: View {
    @ObservedObject var coordinator = WatchSessionCoordinator.shared
    @Environment(\.dismiss) private var dismiss

    private enum Region: Int, CaseIterable, Identifiable {
        case neck = 0
        case lowerBack = 1
        case hips = 2

        var id: Int { rawValue }

        var title: String {
            switch self {
            case .neck: return "Neck"
            case .lowerBack: return "Lower Back"
            case .hips: return "Hips"
            }
        }
    }

    @State private var stepScreen: Int = 1 // 1 = Crown Ratings, 2 = Score Summary & Save
    @State private var selectedRegion: Region = .neck
    @State private var neckValue: Double = 4.0
    @State private var lowerBackValue: Double = 4.0
    @State private var hipsValue: Double = 4.0
    @State private var crownScalar: Double = 4.0

    private let cardSurface = Color(red: 0.078, green: 0.090, blue: 0.122) // #14171F
    private let emeraldPrimary = Color(red: 0.063, green: 0.725, blue: 0.506) // #10B981
    private let amberBadge = Color(red: 0.961, green: 0.620, blue: 0.043) // #F59E0B
    private let coralBadge = Color(red: 0.957, green: 0.247, blue: 0.369) // #F43F5E

    public init() {}

    public var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            if stepScreen == 1 {
                screenOneCrownFlow
            } else {
                screenTwoConfirmFlow
            }
        }
        .onAppear {
            neckValue = Double(coordinator.companionSummary.neckRating)
            lowerBackValue = Double(coordinator.companionSummary.lowerBackRating)
            hipsValue = Double(coordinator.companionSummary.hipsRating)
            crownScalar = neckValue
        }
    }

    private var screenOneCrownFlow: some View {
        VStack(spacing: 6) {
            HStack {
                Text("JOINT COMFORT · 1/2")
                    .font(.system(size: 9, weight: .black, design: .rounded))
                    .foregroundColor(emeraldPrimary)
                Spacer()
                Text("CROWN 1–5")
                    .font(.system(size: 8.5, weight: .bold, design: .monospaced))
                    .foregroundColor(.gray)
            }
            .padding(.horizontal, 4)

            // 3 Region Chips (Tap to switch focus, turn Digital Crown to dial 1–5)
            VStack(spacing: 5) {
                ForEach(Region.allCases) { region in
                    let rating = ratingFor(region)
                    let isFocused = selectedRegion == region
                    Button(action: {
                        selectedRegion = region
                        crownScalar = Double(rating)
                        WKInterfaceDevice.current().play(.click)
                    }) {
                        HStack {
                            Text(region.title)
                                .font(.system(size: 11.5, weight: .bold, design: .rounded))
                                .foregroundColor(.white)

                            Spacer()

                            Text("\(plainComfortWord(rating)) · \(rating)")
                                .font(.system(size: 11, weight: .black, design: .monospaced))
                                .monospacedDigit()
                                .foregroundColor(colorForRating(rating))
                        }
                        .padding(.horizontal, 9)
                        .padding(.vertical, 6)
                        .background(isFocused ? emeraldPrimary.opacity(0.16) : cardSurface)
                        .cornerRadius(9)
                        .overlay(
                            RoundedRectangle(cornerRadius: 9)
                                .stroke(isFocused ? emeraldPrimary : Color.white.opacity(0.08), lineWidth: isFocused ? 1.5 : 1)
                        )
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .focusable(true)
            .digitalCrownRotation(
                $crownScalar,
                from: 1.0,
                through: 5.0,
                by: 1.0,
                sensitivity: .low,
                isContinuous: false,
                isHapticFeedbackEnabled: true
            )
            .onChange(of: crownScalar) { _, newValue in
                let rounded = Double(min(5, max(1, Int(round(newValue)))))
                switch selectedRegion {
                case .neck: neckValue = rounded
                case .lowerBack: lowerBackValue = rounded
                case .hips: hipsValue = rounded
                }
            }

            Button(action: {
                WKInterfaceDevice.current().play(.click)
                stepScreen = 2
            }) {
                HStack(spacing: 5) {
                    Text("Review Score")
                        .font(.system(size: 12, weight: .black, design: .rounded))
                    Image(systemName: "arrow.right")
                        .font(.system(size: 11, weight: .bold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 9)
                .background(emeraldPrimary)
                .foregroundColor(.black)
                .cornerRadius(10)
            }
            .buttonStyle(PlainButtonStyle())
        }
        .padding(.horizontal, 4)
    }

    private var screenTwoConfirmFlow: some View {
        let neckInt = Int(round(neckValue))
        let backInt = Int(round(lowerBackValue))
        let hipsInt = Int(round(hipsValue))
        let score = WatchCompanionSummary.computeComfortScore(
            neck: neckInt,
            lowerBack: backInt,
            hips: hipsInt
        )
        let scoreColor = score >= 75 ? emeraldPrimary : (score >= 50 ? amberBadge : coralBadge)

        return VStack(spacing: 8) {
            HStack {
                Button(action: { stepScreen = 1 }) {
                    Text("← Edit")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.gray)
                }
                .buttonStyle(PlainButtonStyle())

                Spacer()

                Text("2/2 · READY")
                    .font(.system(size: 9, weight: .black, design: .monospaced))
                    .foregroundColor(emeraldPrimary)
            }
            .padding(.horizontal, 4)

            VStack(spacing: 3) {
                Text("\(score)")
                    .font(.system(size: 34, weight: .black, design: .monospaced))
                    .monospacedDigit()
                    .foregroundColor(scoreColor)

                Text("JOINT COMFORT SCORE")
                    .font(.system(size: 8.5, weight: .black, design: .rounded))
                    .foregroundColor(.gray)

                Text("N:\(neckInt) · LB:\(backInt) · H:\(hipsInt)")
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                    .monospacedDigit()
                    .foregroundColor(.white.opacity(0.85))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(cardSurface)
            .cornerRadius(12)

            Button(action: {
                coordinator.logJointComfortCheckIn(
                    neck: neckInt,
                    lowerBack: backInt,
                    hips: hipsInt
                )
                dismiss()
            }) {
                HStack(spacing: 5) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 13, weight: .bold))
                    Text("Log & Sync")
                        .font(.system(size: 12.5, weight: .black, design: .rounded))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(emeraldPrimary)
                .foregroundColor(.black)
                .cornerRadius(11)
            }
            .buttonStyle(PlainButtonStyle())
        }
        .padding(.horizontal, 4)
    }

    private func ratingFor(_ region: Region) -> Int {
        switch region {
        case .neck: return Int(round(neckValue))
        case .lowerBack: return Int(round(lowerBackValue))
        case .hips: return Int(round(hipsValue))
        }
    }

    private func plainComfortWord(_ rating: Int) -> String {
        switch rating {
        case 5: return "Fluid"
        case 4: return "Good"
        case 3: return "Fair"
        case 2: return "Tight"
        default: return "Stiff"
        }
    }

    private func colorForRating(_ rating: Int) -> Color {
        if rating >= 4 { return emeraldPrimary }
        if rating == 3 { return amberBadge }
        return coralBadge
    }
}
