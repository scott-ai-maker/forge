import SwiftUI

/**
 * CNSReadinessComplicationView
 * Daily Central Nervous System (CNS) recovery complications & watch face widgets.
 * High-contrast athletic biometric card for morning readiness check.
 * Forge Athletic
 */
public struct CNSReadinessCardView: View {
    let cns: WatchCnsReadiness

    public var body: some View {
        VStack(spacing: 6) {
            // Header: Category & Tier Label
            HStack {
                HStack(spacing: 4) {
                    Image(systemName: "brain.head.profile")
                        .font(.system(size: 11))
                        .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))
                    Text("CNS READINESS")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))
                }

                Spacer()

                Text(cns.tierLabel.uppercased())
                    .font(.system(size: 9, weight: .black))
                    .foregroundColor(scoreColor)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(scoreColor.opacity(0.2))
                    .cornerRadius(4)
            }

            // Score Row with Large 36pt Numeral and Biometrics
            HStack(alignment: .center) {
                // Large Score
                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text("\(cns.score)")
                        .font(.system(size: 36, weight: .black, design: .rounded))
                        .monospacedDigit()
                        .foregroundColor(scoreColor)
                    Text("%")
                        .font(.system(size: 14, weight: .black))
                        .foregroundColor(scoreColor.opacity(0.8))
                }

                Spacer()

                // HRV & RHR Biometric Pills
                VStack(alignment: .trailing, spacing: 3) {
                    HStack(spacing: 4) {
                        Image(systemName: "waveform.path.ecg")
                            .font(.system(size: 9))
                            .foregroundColor(Color(red: 0.06, green: 0.72, blue: 0.51))
                        Text("HRV \(cns.hrvRmssd) ms")
                            .font(.system(size: 11, weight: .black, design: .monospaced))
                            .foregroundColor(.white)
                    }

                    HStack(spacing: 4) {
                        Image(systemName: "heart.fill")
                            .font(.system(size: 9))
                            .foregroundColor(Color(red: 0.97, green: 0.44, blue: 0.44))
                        Text("RHR \(cns.restingHeartRate) bpm")
                            .font(.system(size: 11, weight: .bold, design: .monospaced))
                            .foregroundColor(.gray)
                    }
                }
            }
        }
        .padding(10)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white.opacity(0.06))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(scoreColor.opacity(0.3), lineWidth: 1)
        )
    }

    private var scoreColor: Color {
        if cns.score >= 80 { return Color(red: 0.06, green: 0.72, blue: 0.51) } // Emerald Green
        if cns.score >= 60 { return Color(red: 0.83, green: 0.63, blue: 0.09) } // Forge Gold
        return Color(red: 0.97, green: 0.44, blue: 0.44) // Crimson Red
    }
}

/**
 * Circular Watch Face Complication
 */
public struct CNSCircularComplicationView: View {
    let score: Int

    public var body: some View {
        ZStack {
            Circle()
                .stroke(Color.white.opacity(0.15), lineWidth: 3.5)
            Circle()
                .trim(from: 0.0, to: CGFloat(score) / 100.0)
                .stroke(
                    score >= 75 ? Color(red: 0.06, green: 0.72, blue: 0.51) : Color(red: 0.83, green: 0.63, blue: 0.09),
                    style: StrokeStyle(lineWidth: 3.5, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))

            VStack(spacing: 0) {
                Text("\(score)")
                    .font(.system(size: 15, weight: .black, design: .rounded))
                    .foregroundColor(.white)
                Text("CNS")
                    .font(.system(size: 8, weight: .black))
                    .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))
            }
        }
    }
}
