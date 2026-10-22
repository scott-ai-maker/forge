import SwiftUI

/**
 * CNSReadinessComplicationView
 * Daily Central Nervous System (CNS) recovery complications & watch face widgets
 * Forge Athletic
 */
public struct CNSReadinessCardView: View {
    let cns: WatchCnsReadiness

    public var body: some View {
        VStack(spacing: 4) {
            HStack {
                Text("CNS READINESS")
                    .font(.system(size: 9, weight: .black))
                    .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))
                Spacer()
                Text(cns.tierLabel.uppercased())
                    .font(.system(size: 8, weight: .heavy))
                    .foregroundColor(scoreColor)
                    .padding(.horizontal, 4)
                    .padding(.vertical, 1)
                    .background(scoreColor.opacity(0.2))
                    .cornerRadius(3)
            }

            HStack(alignment: .firstTextBaseline) {
                Text("\(cns.score)%")
                    .font(.system(size: 26, weight: .black, design: .rounded))
                    .foregroundColor(scoreColor)
                Spacer()
                VStack(alignment: .trailing, spacing: 0) {
                    Text("HRV \(cns.hrvRmssd) ms")
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundColor(.white)
                    Text("RHR \(cns.restingHeartRate) bpm")
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundColor(.gray)
                }
            }
        }
        .padding(8)
        .background(Color.white.opacity(0.06))
        .cornerRadius(10)
    }

    private var scoreColor: Color {
        if cns.score >= 80 { return Color(red: 0.06, green: 0.72, blue: 0.51) } // Green
        if cns.score >= 60 { return Color(red: 0.83, green: 0.63, blue: 0.09) } // Gold
        return Color(red: 0.97, green: 0.44, blue: 0.44) // Red
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
                .stroke(Color.white.opacity(0.15), lineWidth: 3)
            Circle()
                .trim(from: 0.0, to: CGFloat(score) / 100.0)
                .stroke(
                    score >= 75 ? Color(red: 0.06, green: 0.72, blue: 0.51) : Color(red: 0.83, green: 0.63, blue: 0.09),
                    style: StrokeStyle(lineWidth: 3, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))

            VStack(spacing: 0) {
                Text("\(score)")
                    .font(.system(size: 13, weight: .black, design: .rounded))
                    .foregroundColor(.white)
                Text("CNS")
                    .font(.system(size: 7, weight: .bold))
                    .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))
            }
        }
    }
}
