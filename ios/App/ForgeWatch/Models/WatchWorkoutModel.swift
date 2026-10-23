import Foundation

/**
 * WatchWorkoutModel
 * Core physiological & workout data structures for Forge Athletic watchOS
 * Supports all 4 workout phases: Warm-Up, Lifts/Resistance, Cardio, and Cool-Down
 * Forge Athletic
 */

public struct WatchExerciseInfo: Codable, Identifiable {
    public var id: String { "\(exerciseName)-\(orderIndex)" }
    public let exerciseName: String
    public var block: String?
    public var phaseLabel: String
    public var orderIndex: Int
    public var setNumber: Int
    public var totalSets: Int
    public var prescribedWeight: Double
    public var prescribedReps: Int
    public var repsDisplay: String
    public var targetRpe: Double?
    public var tempo: String? // e.g. "4-2-1-1" or "2-0-2-0"
    public var restSeconds: Int
    public var isCompound: Bool?
    public var isHammerCurl: Bool?
    public var optPhase: Int?
    public var isCompleted: Bool
    public var completedSetsCount: Int

    public init(
        exerciseName: String,
        block: String? = "resistance",
        phaseLabel: String = "RESISTANCE",
        orderIndex: Int = 0,
        setNumber: Int = 1,
        totalSets: Int = 3,
        prescribedWeight: Double = 135.0,
        prescribedReps: Int = 10,
        repsDisplay: String = "10",
        targetRpe: Double? = 8.0,
        tempo: String? = "2-0-2-0",
        restSeconds: Int = 60,
        isCompound: Bool? = false,
        isHammerCurl: Bool? = false,
        optPhase: Int? = 3,
        isCompleted: Bool = false,
        completedSetsCount: Int = 0
    ) {
        self.exerciseName = exerciseName
        self.block = block
        self.phaseLabel = phaseLabel
        self.orderIndex = orderIndex
        self.setNumber = setNumber
        self.totalSets = totalSets
        self.prescribedWeight = prescribedWeight
        self.prescribedReps = prescribedReps
        self.repsDisplay = repsDisplay
        self.targetRpe = targetRpe
        self.tempo = tempo
        self.restSeconds = restSeconds
        self.isCompound = isCompound
        self.isHammerCurl = isHammerCurl
        self.optPhase = optPhase
        self.isCompleted = isCompleted
        self.completedSetsCount = completedSetsCount
    }
}

public struct WatchCardioProtocol: Codable {
    public let modality: String
    public let durationMins: Int
    public let targetZone: Int
    public let targetBpmMin: Int
    public let targetBpmMax: Int

    public init(
        modality: String = "Cardio Zone 2",
        durationMins: Int = 20,
        targetZone: Int = 2,
        targetBpmMin: Int = 125,
        targetBpmMax: Int = 142
    ) {
        self.modality = modality
        self.durationMins = durationMins
        self.targetZone = targetZone
        self.targetBpmMin = targetBpmMin
        self.targetBpmMax = targetBpmMax
    }
}

public struct WatchWarmupDrill: Codable, Identifiable {
    public var id: String { name }
    public let name: String
    public let phaseLabel: String
    public let durationSec: Int
    public let protocolText: String
    public var isCompleted: Bool

    public init(
        name: String,
        phaseLabel: String = "WARM-UP",
        durationSec: Int = 30,
        protocolText: String = "1 set × 30s",
        isCompleted: Bool = false
    ) {
        self.name = name
        self.phaseLabel = phaseLabel
        self.durationSec = durationSec
        self.protocolText = protocolText
        self.isCompleted = isCompleted
    }
}

public struct WatchCooldownStretch: Codable, Identifiable {
    public var id: String { name }
    public let name: String
    public let durationSec: Int
    public let protocolText: String
    public var isCompleted: Bool

    public init(
        name: String,
        durationSec: Int = 30,
        protocolText: String = "Hold for 30s",
        isCompleted: Bool = false
    ) {
        self.name = name
        self.durationSec = durationSec
        self.protocolText = protocolText
        self.isCompleted = isCompleted
    }
}

public struct WatchWorkoutState: Codable {
    public var workoutId: String
    public var dayNumber: Int
    public var focus: String
    public var activePhase: String // "warmup", "resistance", "cardio", "cooldown"
    public var activeExerciseIndex: Int
    public var activeExercise: WatchExerciseInfo?
    public var exercises: [WatchExerciseInfo]
    public var warmupDrills: [WatchWarmupDrill]
    public var cooldownStretches: [WatchCooldownStretch]
    public var cardioProtocol: WatchCardioProtocol?
    public var completedSetsCount: Int
    public var totalSetsCount: Int
    public var isSessionActive: Bool
    public var startedAt: String?

    public init(
        workoutId: String = "active-session",
        dayNumber: Int = 1,
        focus: String = "Athletic Performance",
        activePhase: String = "resistance",
        activeExerciseIndex: Int = 0,
        activeExercise: WatchExerciseInfo? = nil,
        exercises: [WatchExerciseInfo] = [],
        warmupDrills: [WatchWarmupDrill] = [],
        cooldownStretches: [WatchCooldownStretch] = [],
        cardioProtocol: WatchCardioProtocol? = nil,
        completedSetsCount: Int = 0,
        totalSetsCount: Int = 12,
        isSessionActive: Bool = false,
        startedAt: String? = nil
    ) {
        self.workoutId = workoutId
        self.dayNumber = dayNumber
        self.focus = focus
        self.activePhase = activePhase
        self.activeExerciseIndex = activeExerciseIndex
        self.activeExercise = activeExercise
        self.exercises = exercises
        self.warmupDrills = warmupDrills
        self.cooldownStretches = cooldownStretches
        self.cardioProtocol = cardioProtocol
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
