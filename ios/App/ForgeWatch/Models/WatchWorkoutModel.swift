import Foundation

/**
 * WatchWorkoutModel
 * Core physiological & workout data structures for Forge Athletic watchOS
 * Supports all 4 workout phases: Warm-Up, Lifts/Resistance, Cardio, and Cool-Down
 * Forge Athletic
 */

public enum WatchEquipmentModality: String, CaseIterable, Identifiable, Codable {
    case barbell = "Barbell"
    case dumbbell = "Dumbbell"
    case cable = "Cable"
    case bands = "Bands"
    case bodyweight = "Bodyweight"
    case kettlebell = "Kettlebell"

    public var id: String { rawValue }

    public var displayName: String { rawValue }

    public var iconName: String {
        switch self {
        case .barbell: return "scalemass.fill"
        case .dumbbell: return "dumbbell.fill"
        case .cable: return "cable.connector.horizontal"
        case .bands: return "waveform.path"
        case .bodyweight: return "figure.walk"
        case .kettlebell: return "flame.fill"
        }
    }

    public var shortBadge: String {
        switch self {
        case .barbell: return "BARBELL"
        case .dumbbell: return "DUMBBELL"
        case .cable: return "CABLE"
        case .bands: return "BANDS"
        case .bodyweight: return "BODYWEIGHT"
        case .kettlebell: return "KETTLEBELL"
        }
    }

    public var weightUnitLabel: String {
        switch self {
        case .barbell: return "TOTAL LBS"
        case .dumbbell: return "PER DB"
        case .cable: return "STACK LBS"
        case .bands: return "TENSION"
        case .bodyweight: return "ADDED LBS"
        case .kettlebell: return "KB LBS"
        }
    }

    public var defaultWeight: Double {
        switch self {
        case .barbell: return 135.0
        case .dumbbell: return 25.0
        case .cable: return 40.0
        case .bands: return 25.0
        case .bodyweight: return 0.0
        case .kettlebell: return 35.0
        }
    }

    public var stepIncrement: Double {
        switch self {
        case .barbell: return 5.0
        case .dumbbell: return 5.0
        case .cable: return 5.0
        case .bands: return 5.0
        case .bodyweight: return 5.0
        case .kettlebell: return 5.0
        }
    }
}

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
    public var targetMuscles: String?
    public var equipment: String?
    public var equipmentModality: String?
    public var setupCue: String?
    public var movementCues: [String]?
    public var coachingTip: String?
    public var isSuperset: Bool?
    public var supersetRole: String?
    public var supersetPartnerIndex: Int?

    public var detectedModality: WatchEquipmentModality {
        if let explicit = equipmentModality?.lowercased() {
            if explicit.contains("dumbbell") || explicit.contains("db") { return .dumbbell }
            if explicit.contains("cable") || explicit.contains("pulley") || explicit.contains("machine") { return .cable }
            if explicit.contains("band") || explicit.contains("tubing") { return .bands }
            if explicit.contains("bodyweight") || explicit.contains("bw") || explicit.contains("calisthenics") { return .bodyweight }
            if explicit.contains("kettlebell") || explicit.contains("kb") { return .kettlebell }
            if explicit.contains("barbell") || explicit.contains("bb") { return .barbell }
        }

        let combined = "\(exerciseName) \(equipment ?? "")".lowercased()
        if combined.contains("dumbbell") || combined.contains("db ") || combined.hasPrefix("db") || combined.contains("dual db") {
            return .dumbbell
        }
        if combined.contains("cable") || combined.contains("pulley") || combined.contains("lat pulldown") ||
           combined.contains("pushdown") || combined.contains("cable crossover") || combined.contains("cable fly") {
            return .cable
        }
        if combined.contains("band") || combined.contains("tubing") || combined.contains("pull-apart") {
            return .bands
        }
        if combined.contains("kettlebell") || combined.contains("kb ") || combined.hasPrefix("kb") {
            return .kettlebell
        }
        if combined.contains("pull up") || combined.contains("pull-up") || combined.contains("chin up") || combined.contains("chin-up") ||
           combined.contains("push up") || combined.contains("push-up") || combined.contains("dip") || combined.contains("hanging") ||
           combined.contains("plank") || combined.contains("crunch") || combined.contains("bodyweight") {
            return .bodyweight
        }
        return .barbell
    }

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
        completedSetsCount: Int = 0,
        targetMuscles: String? = nil,
        equipment: String? = nil,
        equipmentModality: String? = nil,
        setupCue: String? = nil,
        movementCues: [String]? = nil,
        coachingTip: String? = nil,
        isSuperset: Bool? = false,
        supersetRole: String? = nil,
        supersetPartnerIndex: Int? = nil
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
        self.targetMuscles = targetMuscles
        self.equipment = equipment
        self.equipmentModality = equipmentModality
        self.setupCue = setupCue
        self.movementCues = movementCues
        self.coachingTip = coachingTip
        self.isSuperset = isSuperset
        self.supersetRole = supersetRole
        self.supersetPartnerIndex = supersetPartnerIndex
    }
}

public struct WatchCardioProtocol: Codable {
    public let modality: String
    public let durationMins: Int
    public let targetZone: Int
    public let targetBpmMin: Int
    public let targetBpmMax: Int
    public var isCompleted: Bool

    public init(
        modality: String = "Cardio Zone 2",
        durationMins: Int = 20,
        targetZone: Int = 2,
        targetBpmMin: Int = 125,
        targetBpmMax: Int = 142,
        isCompleted: Bool = false
    ) {
        self.modality = modality
        self.durationMins = durationMins
        self.targetZone = targetZone
        self.targetBpmMin = targetBpmMin
        self.targetBpmMax = targetBpmMax
        self.isCompleted = isCompleted
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

    public static let defaultWarmupDrills: [WatchWarmupDrill] = [
        WatchWarmupDrill(name: "SMR Calves & Thoracic Spine", phaseLabel: "1. INHIBIT", durationSec: 30, protocolText: "Hold tender spots 30-60s"),
        WatchWarmupDrill(name: "Kneeling Hip Flexor & Lat Stretch", phaseLabel: "2. LENGTHEN", durationSec: 30, protocolText: "Static hold 30s per side"),
        WatchWarmupDrill(name: "Glute Bridge / Bird-Dog", phaseLabel: "3. ACTIVATE", durationSec: 45, protocolText: "1-2 sets × 12-15 (4-2-1 tempo)")
    ]

    public static let defaultCooldownStretches: [WatchCooldownStretch] = [
        WatchCooldownStretch(name: "Static Kneeling Hip Flexor Stretch", durationSec: 30, protocolText: "Hold 30s per side (no bouncing)"),
        WatchCooldownStretch(name: "Doorway Pectoral & Lat Stretch", durationSec: 30, protocolText: "Hold 30s per side"),
        WatchCooldownStretch(name: "Diaphragmatic Parasympathetic Reset", durationSec: 60, protocolText: "4-7-8 breathing cadence")
    ]

    public init(
        workoutId: String = "active-session",
        dayNumber: Int = 1,
        focus: String = "Athletic Performance",
        activePhase: String = "warmup",
        activeExerciseIndex: Int = 0,
        activeExercise: WatchExerciseInfo? = nil,
        exercises: [WatchExerciseInfo] = [],
        warmupDrills: [WatchWarmupDrill] = WatchWorkoutState.defaultWarmupDrills,
        cooldownStretches: [WatchCooldownStretch] = WatchWorkoutState.defaultCooldownStretches,
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
        self.warmupDrills = warmupDrills.isEmpty ? WatchWorkoutState.defaultWarmupDrills : warmupDrills
        self.cooldownStretches = cooldownStretches.isEmpty ? WatchWorkoutState.defaultCooldownStretches : cooldownStretches
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
