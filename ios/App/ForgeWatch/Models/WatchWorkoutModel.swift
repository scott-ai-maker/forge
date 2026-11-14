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
    public var optPhaseValue: Int?
    public var expressModeValue: Bool?
    public var dailyStreakValue: Int?
    public var injectedWarmupCountValue: Int?

    public var optPhase: Int {
        get { optPhaseValue ?? activeExercise?.optPhase ?? 1 }
        set { optPhaseValue = newValue }
    }

    public var expressModeActive: Bool {
        get { expressModeValue ?? false }
        set { expressModeValue = newValue }
    }

    public var dailyStreak: Int {
        get { dailyStreakValue ?? 0 }
        set { dailyStreakValue = newValue }
    }

    public var injectedWarmupCount: Int {
        get { injectedWarmupCountValue ?? 0 }
        set { injectedWarmupCountValue = newValue }
    }

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
        startedAt: String? = nil,
        optPhase: Int = 1,
        expressModeActive: Bool = false,
        dailyStreak: Int = 0,
        injectedWarmupCount: Int = 0
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
        self.optPhaseValue = optPhase
        self.expressModeValue = expressModeActive
        self.dailyStreakValue = dailyStreak
        self.injectedWarmupCountValue = injectedWarmupCount
    }
}

/**
 * WatchPlainRpeOption
 * Plain-English Digital Crown RPE scale synced directly to the iPhone autoregulation engine.
 */
public struct WatchPlainRpeOption: Identifiable, Equatable {
    public let rpe: Double
    public let plainLabel: String
    public let badgeTitle: String
    public let coachingDetail: String

    public var id: Double { rpe }

    public static let allOptions: [WatchPlainRpeOption] = [
        WatchPlainRpeOption(rpe: 6.0, plainLabel: "Easy", badgeTitle: "Easy · 6", coachingDetail: "4+ reps in reserve · Warm/speed feel"),
        WatchPlainRpeOption(rpe: 7.0, plainLabel: "Moderate", badgeTitle: "Moderate · 7", coachingDetail: "3 reps in reserve · Crisp bar speed"),
        WatchPlainRpeOption(rpe: 8.0, plainLabel: "Challenging", badgeTitle: "Challenging · 8", coachingDetail: "2 reps in reserve · Optimal target"),
        WatchPlainRpeOption(rpe: 9.0, plainLabel: "Hard", badgeTitle: "Hard · 9", coachingDetail: "1 rep in reserve · Heavy effort"),
        WatchPlainRpeOption(rpe: 10.0, plainLabel: "Max", badgeTitle: "Max · 10", coachingDetail: "0 reps left · Autoregulates next rest")
    ]

    public static func nearest(to value: Double) -> WatchPlainRpeOption {
        allOptions.min(by: { abs($0.rpe - value) < abs($1.rpe - value) }) ?? allOptions[2]
    }
}

/**
 * WatchCameraRemoteState
 * Live Wrist Remote state when the iPhone is propped 6–8 ft away for CV scans or Form Lab.
 */
public struct WatchCameraRemoteState: Codable, Equatable {
    public var isActive: Bool
    public var mode: String // "quick_posture" | "readiness_check" | "desk_audit" | "form_lab"
    public var modeTitle: String
    public var framingStatus: String // "framing" | "locked"
    public var isRecording: Bool
    public var countdownSeconds: Int
    public var repCount: Int
    public var targetReps: Int
    public var statusHint: String

    public var isLockedEmerald: Bool {
        framingStatus.lowercased() == "locked"
    }

    public var framingDisplayLabel: String {
        isLockedEmerald ? "Locked · Emerald" : "Framing..."
    }

    public var isFormLabMode: Bool {
        mode == "form_lab" || mode == "readiness_check"
    }

    public var primaryTriggerLabel: String {
        if mode == "form_lab" {
            return isRecording ? "Record Rep" : "Record Rep"
        }
        if mode == "readiness_check" {
            return isRecording ? "Rep \(max(1, repCount))/\(max(3, targetReps))" : "Start 5s Timer"
        }
        return countdownSeconds > 0 ? "Timer \(countdownSeconds)s…" : "Start 5s Timer"
    }

    public init(
        isActive: Bool = false,
        mode: String = "quick_posture",
        modeTitle: String = "2-Min Posture Check",
        framingStatus: String = "framing",
        isRecording: Bool = false,
        countdownSeconds: Int = 0,
        repCount: Int = 0,
        targetReps: Int = 3,
        statusHint: String = "Step 6–8 ft back into frame"
    ) {
        self.isActive = isActive
        self.mode = mode
        self.modeTitle = modeTitle
        self.framingStatus = framingStatus
        self.isRecording = isRecording
        self.countdownSeconds = countdownSeconds
        self.repCount = repCount
        self.targetReps = targetReps
        self.statusHint = statusHint
    }
}

/**
 * WatchDeskResetDrill
 * Prioritized standalone seated mobility drills for the 5-Minute Desk Reset on wrist.
 */
public struct WatchDeskResetDrill: Identifiable, Codable, Equatable {
    public let id: String
    public let title: String
    public let cue: String
    public let targetArea: String
    public let durationSec: Int

    public init(id: String, title: String, cue: String, targetArea: String, durationSec: Int) {
        self.id = id
        self.title = title
        self.cue = cue
        self.targetArea = targetArea
        self.durationSec = durationSec
    }

    public static func prioritizedRoutine(ergonomicFlags: [String], intervalSec: Int = 45) -> [WatchDeskResetDrill] {
        let hasForwardHead = ergonomicFlags.contains(where: { $0.contains("head") || $0.contains("cervical") || $0.contains("monitor") })
        let hasHipTightness = ergonomicFlags.contains(where: { $0.contains("hip") || $0.contains("pelv") || $0.contains("lumbar") })

        var drills: [WatchDeskResetDrill] = [
            WatchDeskResetDrill(
                id: "chin_tuck_retraction",
                title: "Cervical Chin Tuck",
                cue: "Draw crown tall; glide chin straight back for 3s holds.",
                targetArea: "Neck & Deep Flexors",
                durationSec: intervalSec
            ),
            WatchDeskResetDrill(
                id: "thoracic_chair_extension",
                title: "Thoracic Open-Book",
                cue: "Hands behind head; exhale gently over upper chair back.",
                targetArea: "Mid-Back & Chest",
                durationSec: intervalSec
            ),
            WatchDeskResetDrill(
                id: "seated_figure_four_hip",
                title: "Seated Hip Unload",
                cue: "Cross ankle over knee; hinge tall spine forward smoothly.",
                targetArea: "Hips & Glutes",
                durationSec: intervalSec
            ),
            WatchDeskResetDrill(
                id: "scapular_wall_glide",
                title: "Scapular W-Squeeze",
                cue: "Tuck elbows to ribs; externally rotate thumbs back.",
                targetArea: "Lower Traps & Shoulders",
                durationSec: intervalSec
            ),
            WatchDeskResetDrill(
                id: "diaphragmatic_rib_reset",
                title: "360° Rib Breath Reset",
                cue: "4s nasal inhale into lower ribs, 6s slow exhale.",
                targetArea: "Lumbar & Autonomic Tone",
                durationSec: intervalSec
            ),
            WatchDeskResetDrill(
                id: "standing_hip_extension",
                title: "Standing Hip Opener",
                cue: "Step one foot back, squeeze glute, reach arm overhead.",
                targetArea: "Anterior Hip Flexors",
                durationSec: max(30, 300 - intervalSec * 5)
            )
        ]

        if hasHipTightness && !hasForwardHead {
            let hipDrill = drills.remove(at: 2)
            drills.insert(hipDrill, at: 0)
        }
        return drills
    }
}

/**
 * WatchCompanionSummary
 * Unified wrist glance state for Smart Stack widgets, complications, and home cards.
 */
public struct WatchCompanionSummary: Codable, Equatable {
    public var optPhase: Int
    public var optPhaseLabel: String
    public var dailyStreak: Int
    public var jointComfortScore: Int // 0-100
    public var neckRating: Int // 1-5
    public var lowerBackRating: Int // 1-5
    public var hipsRating: Int // 1-5
    public var expressModeActive: Bool
    public var deskResetDoneToday: Bool
    public var ergonomicFlags: [String]
    public var updatedAt: String

    public var comfortStatusLabel: String {
        if jointComfortScore >= 80 { return "Fluid" }
        if jointComfortScore >= 60 { return "Good" }
        if jointComfortScore >= 40 { return "Tight" }
        return "Protect"
    }

    public init(
        optPhase: Int = 1,
        optPhaseLabel: String = "Stabilization",
        dailyStreak: Int = 1,
        jointComfortScore: Int = 82,
        neckRating: Int = 4,
        lowerBackRating: Int = 4,
        hipsRating: Int = 4,
        expressModeActive: Bool = false,
        deskResetDoneToday: Bool = false,
        ergonomicFlags: [String] = [],
        updatedAt: String = ""
    ) {
        self.optPhase = optPhase
        self.optPhaseLabel = optPhaseLabel
        self.dailyStreak = dailyStreak
        self.jointComfortScore = jointComfortScore
        self.neckRating = neckRating
        self.lowerBackRating = lowerBackRating
        self.hipsRating = hipsRating
        self.expressModeActive = expressModeActive
        self.deskResetDoneToday = deskResetDoneToday
        self.ergonomicFlags = ergonomicFlags
        self.updatedAt = updatedAt
    }

    public static func computeComfortScore(neck: Int, lowerBack: Int, hips: Int) -> Int {
        let clampedNeck = min(5, max(1, neck))
        let clampedBack = min(5, max(1, lowerBack))
        let clampedHips = min(5, max(1, hips))
        let avg = Double(clampedNeck + clampedBack + clampedHips) / 3.0
        return Int(round(((avg - 1.0) / 4.0) * 100.0))
    }

    public static func optPhaseShortName(_ phase: Int) -> String {
        switch phase {
        case 1: return "Stabilization"
        case 2: return "Strength End."
        case 3: return "Hypertrophy"
        case 4: return "Max Strength"
        case 5: return "Power"
        default: return "OPT Phase \(phase)"
        }
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
