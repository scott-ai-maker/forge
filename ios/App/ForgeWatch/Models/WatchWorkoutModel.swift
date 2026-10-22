import Foundation

/**
 * WatchWorkoutModel
 * Core physiological & workout data structures for Forge Athletic watchOS
 * Forge Athletic
 */

public struct WatchExerciseInfo: Codable, Identifiable {
    public var id: String { "\(exerciseName)-\(setNumber)" }
    public let exerciseName: String
    public let setNumber: Int
    public let totalSets: Int
    public let prescribedWeight: Double
    public let prescribedReps: Int
    public let targetRpe: Double?
    public let tempo: String? // e.g. "4-2-1-1" or "2-0-2-0"
    public let restSeconds: Int
    public let isCompound: Bool?
    public let isHammerCurl: Bool?
    public let optPhase: Int?

    public init(
        exerciseName: String,
        setNumber: Int,
        totalSets: Int,
        prescribedWeight: Double,
        prescribedReps: Int,
        targetRpe: Double? = 8.0,
        tempo: String? = "2-0-2-0",
        restSeconds: Int = 60,
        isCompound: Bool? = false,
        isHammerCurl: Bool? = false,
        optPhase: Int? = 3
    ) {
        self.exerciseName = exerciseName
        self.setNumber = setNumber
        self.totalSets = totalSets
        self.prescribedWeight = prescribedWeight
        self.prescribedReps = prescribedReps
        self.targetRpe = targetRpe
        self.tempo = tempo
        self.restSeconds = restSeconds
        self.isCompound = isCompound
        self.isHammerCurl = isHammerCurl
        self.optPhase = optPhase
    }
}

public struct WatchWorkoutState: Codable {
    public let workoutId: String
    public let dayNumber: Int
    public let focus: String
    public var activeExercise: WatchExerciseInfo?
    public var completedSetsCount: Int
    public var totalSetsCount: Int
    public var isSessionActive: Bool
    public var startedAt: String?

    public init(
        workoutId: String = "active-session",
        dayNumber: Int = 1,
        focus: String = "Athletic Performance",
        activeExercise: WatchExerciseInfo? = nil,
        completedSetsCount: Int = 0,
        totalSetsCount: Int = 12,
        isSessionActive: Bool = false,
        startedAt: String? = nil
    ) {
        self.workoutId = workoutId
        self.dayNumber = dayNumber
        self.focus = focus
        self.activeExercise = activeExercise
        self.completedSetsCount = completedSetsCount
        self.totalSetsCount = totalSetsCount
        self.isSessionActive = isSessionActive
        self.startedAt = startedAt
    }
}

public struct WatchRestTimerState: Codable {
    public var isRunning: Bool
    public var remainingSeconds: Int
    public var totalRestSeconds: Int
    public var exerciseName: String
    public var isBioPaced: Bool
    public var badgeText: String
    public var adaptationReason: String?

    public init(
        isRunning: Bool = false,
        remainingSeconds: Int = 60,
        totalRestSeconds: Int = 60,
        exerciseName: String = "Rest Interval",
        isBioPaced: Bool = false,
        badgeText: String = "Standard Rest",
        adaptationReason: String? = nil
    ) {
        self.isRunning = isRunning
        self.remainingSeconds = remainingSeconds
        self.totalRestSeconds = totalRestSeconds
        self.exerciseName = exerciseName
        self.isBioPaced = isBioPaced
        self.badgeText = badgeText
        self.adaptationReason = adaptationReason
    }
}

public struct WatchCnsReadiness: Codable {
    public let score: Int // 0-100
    public let restingHeartRate: Int
    public let hrvRmssd: Int
    public let date: String

    public var tierLabel: String {
        if score >= 85 { return "Peak" }
        if score >= 70 { return "Optimal" }
        if score >= 50 { return "Moderate" }
        return "Deload Advised"
    }

    public init(score: Int = 85, restingHeartRate: Int = 54, hrvRmssd: Int = 76, date: String = "") {
        self.score = score
        self.restingHeartRate = restingHeartRate
        self.hrvRmssd = hrvRmssd
        self.date = date
    }
}
