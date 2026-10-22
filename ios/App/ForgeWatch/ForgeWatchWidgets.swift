import WidgetKit
import SwiftUI

/**
 * ForgeWatchWidgets
 * WidgetKit Complications for Apple Watch faces (Modular, Ultra, Infograph, Wayfinder)
 * Forge Athletic
 */

public struct CNSReadinessEntry: TimelineEntry {
    public let date: Date
    public let score: Int
    public let restingHeartRate: Int
    public let hrvRmssd: Int
    public let tierLabel: String
}

public struct CNSReadinessTimelineProvider: TimelineProvider {
    public typealias Entry = CNSReadinessEntry

    public init() {}

    public func placeholder(in context: Context) -> CNSReadinessEntry {
        CNSReadinessEntry(date: Date(), score: 85, restingHeartRate: 54, hrvRmssd: 76, tierLabel: "Peak")
    }

    public func getSnapshot(in context: Context, completion: @escaping (CNSReadinessEntry) -> Void) {
        let entry = CNSReadinessEntry(date: Date(), score: 85, restingHeartRate: 54, hrvRmssd: 76, tierLabel: "Peak")
        completion(entry)
    }

    public func getTimeline(in context: Context, completion: @escaping (Timeline<CNSReadinessEntry>) -> Void) {
        let coord = WatchSessionCoordinator.shared.cnsReadiness
        let entry = CNSReadinessEntry(
            date: Date(),
            score: coord.score,
            restingHeartRate: coord.restingHeartRate,
            hrvRmssd: coord.hrvRmssd,
            tierLabel: coord.tierLabel
        )
        // Refresh every 30 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

public struct CNSReadinessWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    public var entry: CNSReadinessTimelineProvider.Entry

    public init(entry: CNSReadinessTimelineProvider.Entry) {
        self.entry = entry
    }

    public var body: some View {
        switch family {
        case .accessoryCircular:
            ZStack {
                AccessoryWidgetBackground()
                Circle()
                    .trim(from: 0.0, to: CGFloat(entry.score) / 100.0)
                    .stroke(
                        entry.score >= 75 ? Color(red: 0.06, green: 0.72, blue: 0.51) : Color(red: 0.83, green: 0.63, blue: 0.09),
                        style: StrokeStyle(lineWidth: 3.5, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .padding(3)

                VStack(spacing: 0) {
                    Text("\(entry.score)")
                        .font(.system(size: 13, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                    Text("CNS")
                        .font(.system(size: 7, weight: .black))
                        .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))
                }
            }

        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text("FORGE")
                        .font(.system(size: 9, weight: .black))
                        .foregroundColor(Color(red: 0.83, green: 0.63, blue: 0.09))
                    Spacer()
                    Text(entry.tierLabel.uppercased())
                        .font(.system(size: 8, weight: .heavy))
                        .foregroundColor(scoreColor)
                }

                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text("\(entry.score)%")
                        .font(.system(size: 16, weight: .black, design: .rounded))
                        .foregroundColor(scoreColor)
                    Text("CNS Readiness")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(.white)
                }

                Text("HRV \(entry.hrvRmssd)ms · RHR \(entry.restingHeartRate)bpm")
                    .font(.system(size: 8.5, weight: .medium))
                    .foregroundColor(.gray)
            }
            .padding(2)

        case .accessoryCorner:
            Text("\(entry.score)%")
                .font(.system(size: 11, weight: .black))
                .foregroundColor(scoreColor)
                .widgetLabel {
                    Text("CNS \(entry.tierLabel)")
                        .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))
                }

        case .accessoryInline:
            Text("CNS \(entry.score)% · \(entry.tierLabel)")

        default:
            Text("\(entry.score)%")
        }
    }

    private var scoreColor: Color {
        if entry.score >= 80 { return Color(red: 0.06, green: 0.72, blue: 0.51) }
        if entry.score >= 60 { return Color(red: 0.83, green: 0.63, blue: 0.09) }
        return Color(red: 0.97, green: 0.44, blue: 0.44)
    }
}

public struct CNSReadinessWidget: Widget {
    public let kind: String = "ForgeAthletic_CNSReadinessWidget"

    public init() {}

    public var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CNSReadinessTimelineProvider()) { entry in
            CNSReadinessWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("CNS Readiness")
        .description("Daily Central Nervous System recovery and autonomic readiness score from Forge Athletic.")
        .supportedFamilies([
            .accessoryCircular,
            .accessoryRectangular,
            .accessoryCorner,
            .accessoryInline
        ])
    }
}
