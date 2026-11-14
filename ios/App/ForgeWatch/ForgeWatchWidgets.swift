import WidgetKit
import SwiftUI

/**
 * ForgeWatchWidgets
 * WidgetKit Smart Stack & Watch Face Complications for Forge Athletic:
 * 1. OPTPhaseStreakWidget — Current OPT Phase & Daily Streak
 * 2. JointComfortWidget — Live Joint Comfort Score (0–100)
 * 3. DeskResetQuickLaunchWidget — 1-Tap "5-Min Desk Reset" Complication
 * 4. CNSReadinessWidget — Autonomic CNS Readiness Score
 *
 * Forge Athletic — Obsidian & Emerald Wearable Suite
 */

// MARK: - Shared Complication Entry & Provider

public struct ForgeCompanionWidgetEntry: TimelineEntry {
    public let date: Date
    public let optPhase: Int
    public let optPhaseLabel: String
    public let dailyStreak: Int
    public let jointComfortScore: Int
    public let comfortLabel: String
    public let deskResetDoneToday: Bool
}

public struct ForgeCompanionTimelineProvider: TimelineProvider {
    public typealias Entry = ForgeCompanionWidgetEntry

    public init() {}

    public func placeholder(in context: Context) -> ForgeCompanionWidgetEntry {
        ForgeCompanionWidgetEntry(
            date: Date(),
            optPhase: 1,
            optPhaseLabel: "Stabilization",
            dailyStreak: 5,
            jointComfortScore: 84,
            comfortLabel: "Fluid",
            deskResetDoneToday: false
        )
    }

    public func getSnapshot(in context: Context, completion: @escaping (ForgeCompanionWidgetEntry) -> Void) {
        completion(loadCurrentEntry())
    }

    public func getTimeline(in context: Context, completion: @escaping (Timeline<ForgeCompanionWidgetEntry>) -> Void) {
        let entry = loadCurrentEntry()
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 20, to: Date()) ?? Date()
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func loadCurrentEntry() -> ForgeCompanionWidgetEntry {
        let summary = WatchSessionCoordinator.shared.companionSummary
        return ForgeCompanionWidgetEntry(
            date: Date(),
            optPhase: max(1, summary.optPhase),
            optPhaseLabel: summary.optPhaseLabel,
            dailyStreak: summary.dailyStreak,
            jointComfortScore: summary.jointComfortScore,
            comfortLabel: summary.comfortStatusLabel,
            deskResetDoneToday: summary.deskResetDoneToday
        )
    }
}

// MARK: - 1. Current OPT Phase & Daily Streak Widget

public struct OPTPhaseStreakWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    public var entry: ForgeCompanionWidgetEntry

    private let emerald = Color(red: 0.063, green: 0.725, blue: 0.506)
    private let amber = Color(red: 0.961, green: 0.620, blue: 0.043)

    public init(entry: ForgeCompanionWidgetEntry) {
        self.entry = entry
    }

    public var body: some View {
        Group {
            switch family {
            case .accessoryCircular:
                ZStack {
                    AccessoryWidgetBackground()
                    VStack(spacing: 0) {
                        Text("P0\(entry.optPhase)")
                            .font(.system(size: 12, weight: .black, design: .monospaced))
                            .monospacedDigit()
                            .foregroundColor(emerald)
                        Text("\(entry.dailyStreak)d🔥")
                            .font(.system(size: 9, weight: .bold, design: .monospaced))
                            .monospacedDigit()
                            .foregroundColor(.white)
                    }
                }
            case .accessoryRectangular:
                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        Text("FORGE · OPT PHASE 0\(entry.optPhase)")
                            .font(.system(size: 9, weight: .black, design: .rounded))
                            .foregroundColor(emerald)
                        Spacer()
                    }
                    Text(entry.optPhaseLabel)
                        .font(.system(size: 12, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                        .lineLimit(1)
                    Text("Daily Streak: \(entry.dailyStreak)d")
                        .font(.system(size: 9.5, weight: .bold, design: .monospaced))
                        .monospacedDigit()
                        .foregroundColor(amber)
                }
            case .accessoryCorner:
                Text("P0\(entry.optPhase)")
                    .font(.system(size: 11, weight: .black, design: .monospaced))
                    .monospacedDigit()
                    .foregroundColor(emerald)
                    .widgetLabel {
                        Text("OPT · \(entry.dailyStreak)d Streak")
                    }
            default:
                Text("OPT P0\(entry.optPhase) · \(entry.dailyStreak)d")
                    .monospacedDigit()
            }
        }
        .widgetURL(URL(string: "forgewatch://workout"))
        .containerBackground(Color.black, for: .widget)
    }
}

public struct OPTPhaseStreakWidget: Widget {
    public let kind: String = "ForgeAthletic_OPTPhaseStreakWidget"

    public init() {}

    public var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ForgeCompanionTimelineProvider()) { entry in
            OPTPhaseStreakWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("OPT Phase & Streak")
        .description("Current NASM OPT training phase and daily consistency streak for Forge Athletic.")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryCorner])
    }
}

// MARK: - 2. Live Joint Comfort Score Widget

public struct JointComfortWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    public var entry: ForgeCompanionWidgetEntry

    private let emerald = Color(red: 0.063, green: 0.725, blue: 0.506)
    private let amber = Color(red: 0.961, green: 0.620, blue: 0.043)
    private let coral = Color(red: 0.957, green: 0.247, blue: 0.369)

    public init(entry: ForgeCompanionWidgetEntry) {
        self.entry = entry
    }

    private var toneColor: Color {
        if entry.jointComfortScore >= 75 { return emerald }
        if entry.jointComfortScore >= 50 { return amber }
        return coral
    }

    public var body: some View {
        Group {
            switch family {
            case .accessoryCircular:
                ZStack {
                    AccessoryWidgetBackground()
                    Circle()
                        .trim(from: 0.0, to: CGFloat(entry.jointComfortScore) / 100.0)
                        .stroke(toneColor, style: StrokeStyle(lineWidth: 3.5, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                        .padding(3)
                    VStack(spacing: 0) {
                        Text("\(entry.jointComfortScore)")
                            .font(.system(size: 13, weight: .black, design: .monospaced))
                            .monospacedDigit()
                            .foregroundColor(.white)
                        Text("JNT")
                            .font(.system(size: 7, weight: .black))
                            .foregroundColor(toneColor)
                    }
                }
            case .accessoryRectangular:
                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        Text("JOINT COMFORT")
                            .font(.system(size: 9, weight: .black, design: .rounded))
                            .foregroundColor(toneColor)
                        Spacer()
                        Text(entry.comfortLabel.uppercased())
                            .font(.system(size: 8.5, weight: .bold))
                            .foregroundColor(.gray)
                    }
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(entry.jointComfortScore)/100")
                            .font(.system(size: 15, weight: .black, design: .monospaced))
                            .monospacedDigit()
                            .foregroundColor(.white)
                        Text("10s Check-In")
                            .font(.system(size: 9.5, weight: .medium))
                            .foregroundColor(emerald)
                    }
                    Text("Tap to log Neck · Back · Hips")
                        .font(.system(size: 8.5, weight: .medium))
                        .foregroundColor(.gray)
                }
            case .accessoryCorner:
                Text("\(entry.jointComfortScore)")
                    .font(.system(size: 11, weight: .black, design: .monospaced))
                    .monospacedDigit()
                    .foregroundColor(toneColor)
                    .widgetLabel {
                        Text("Joint Comfort · \(entry.comfortLabel)")
                    }
            default:
                Text("Comfort \(entry.jointComfortScore)/100")
                    .monospacedDigit()
            }
        }
        .widgetURL(URL(string: "forgewatch://joint-comfort"))
        .containerBackground(Color.black, for: .widget)
    }
}

public struct JointComfortWidget: Widget {
    public let kind: String = "ForgeAthletic_JointComfortWidget"

    public init() {}

    public var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ForgeCompanionTimelineProvider()) { entry in
            JointComfortWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Joint Comfort Score")
        .description("Live daily Joint Comfort Score with 1-tap 10-second Digital Crown check-in.")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryCorner])
    }
}

// MARK: - 3. 1-Tap 5-Min Desk Reset Quick-Launch Complication

public struct DeskResetQuickLaunchEntryView: View {
    @Environment(\.widgetFamily) var family
    public var entry: ForgeCompanionWidgetEntry

    private let emerald = Color(red: 0.063, green: 0.725, blue: 0.506)

    public init(entry: ForgeCompanionWidgetEntry) {
        self.entry = entry
    }

    public var body: some View {
        Group {
            switch family {
            case .accessoryCircular:
                ZStack {
                    AccessoryWidgetBackground()
                    VStack(spacing: 1) {
                        Image(systemName: "figure.seated.side.right")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(emerald)
                        Text("5M")
                            .font(.system(size: 9, weight: .black, design: .monospaced))
                            .monospacedDigit()
                            .foregroundColor(.white)
                    }
                }
            case .accessoryRectangular:
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 4) {
                        Image(systemName: "figure.seated.side.right")
                            .font(.system(size: 9.5, weight: .bold))
                            .foregroundColor(emerald)
                        Text("5-MIN DESK RESET")
                            .font(.system(size: 9, weight: .black, design: .rounded))
                            .foregroundColor(emerald)
                    }
                    Text(entry.deskResetDoneToday ? "Completed Today ✓" : "Tap for Silent Mobility")
                        .font(.system(size: 11.5, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                        .lineLimit(1)
                    Text("30s/45s Haptic Chimes · Streak \(entry.dailyStreak)d")
                        .font(.system(size: 8.5, weight: .medium, design: .monospaced))
                        .monospacedDigit()
                        .foregroundColor(.gray)
                }
            case .accessoryCorner:
                Text("5m")
                    .font(.system(size: 11, weight: .black, design: .monospaced))
                    .monospacedDigit()
                    .foregroundColor(emerald)
                    .widgetLabel {
                        Text("5-Min Desk Reset")
                    }
            default:
                Text("5-Min Desk Reset")
            }
        }
        .widgetURL(URL(string: "forgewatch://desk-reset"))
        .containerBackground(Color.black, for: .widget)
    }
}

public struct DeskResetQuickLaunchWidget: Widget {
    public let kind: String = "ForgeAthletic_DeskResetWidget"

    public init() {}

    public var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ForgeCompanionTimelineProvider()) { entry in
            DeskResetQuickLaunchEntryView(entry: entry)
        }
        .configurationDisplayName("5-Min Desk Reset")
        .description("1-tap quick launch for Forge Athletic's standalone 5-Minute Desk Reset mobility routine.")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryCorner])
    }
}

// MARK: - 4. CNS Readiness Complication (Autonomic Recovery)

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
        Group {
            switch family {
            case .accessoryCircular:
                ZStack {
                    AccessoryWidgetBackground()
                    Circle()
                        .trim(from: 0.0, to: CGFloat(entry.score) / 100.0)
                        .stroke(
                            entry.score >= 75 ? Color(red: 0.063, green: 0.725, blue: 0.506) : Color(red: 0.961, green: 0.620, blue: 0.043),
                            style: StrokeStyle(lineWidth: 3.5, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))
                        .padding(3)

                    VStack(spacing: 0) {
                        Text("\(entry.score)")
                            .font(.system(size: 13, weight: .black, design: .monospaced))
                            .monospacedDigit()
                            .foregroundColor(.white)
                        Text("CNS")
                            .font(.system(size: 7, weight: .black))
                            .foregroundColor(Color(red: 0.063, green: 0.725, blue: 0.506))
                    }
                }

            case .accessoryRectangular:
                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        Text("FORGE")
                            .font(.system(size: 9, weight: .black))
                            .foregroundColor(Color(red: 0.063, green: 0.725, blue: 0.506))
                        Spacer()
                        Text(entry.tierLabel.uppercased())
                            .font(.system(size: 8, weight: .heavy))
                            .foregroundColor(scoreColor)
                    }

                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(entry.score)%")
                            .font(.system(size: 16, weight: .black, design: .monospaced))
                            .monospacedDigit()
                            .foregroundColor(scoreColor)
                        Text("CNS Readiness")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(.white)
                    }

                    Text("HRV \(entry.hrvRmssd)ms · RHR \(entry.restingHeartRate)bpm")
                        .font(.system(size: 8.5, weight: .medium, design: .monospaced))
                        .monospacedDigit()
                        .foregroundColor(.gray)
                }
                .padding(2)

            case .accessoryCorner:
                Text("\(entry.score)%")
                    .font(.system(size: 11, weight: .black, design: .monospaced))
                    .monospacedDigit()
                    .foregroundColor(scoreColor)
                    .widgetLabel {
                        Text("CNS \(entry.tierLabel)")
                            .foregroundColor(Color(red: 0.063, green: 0.725, blue: 0.506))
                    }

            case .accessoryInline:
                Text("CNS \(entry.score)% · \(entry.tierLabel)")
                    .monospacedDigit()

            default:
                Text("\(entry.score)%")
                    .monospacedDigit()
            }
        }
        .containerBackground(Color.black, for: .widget)
    }

    private var scoreColor: Color {
        if entry.score >= 80 { return Color(red: 0.063, green: 0.725, blue: 0.506) }
        if entry.score >= 60 { return Color(red: 0.961, green: 0.620, blue: 0.043) }
        return Color(red: 0.957, green: 0.247, blue: 0.369)
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

public struct ForgeWatchWidgetBundle: WidgetBundle {
    public init() {}

    public var body: some Widget {
        OPTPhaseStreakWidget()
        JointComfortWidget()
        DeskResetQuickLaunchWidget()
        CNSReadinessWidget()
    }
}
