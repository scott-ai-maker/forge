import Foundation
import WatchKit
import WatchConnectivity
import WidgetKit
import HealthKit
import Combine

/**
 * WatchSessionCoordinator
 * WCSession delegate and state coordinator on watchOS for Forge Athletic
 * Forge Athletic
 */
public final class WatchSessionCoordinator: NSObject, ObservableObject, WCSessionDelegate {
    public static let shared = WatchSessionCoordinator()

    @Published public var workoutState: WatchWorkoutState = WatchWorkoutState()
    @Published public var restTimer: WatchRestTimerState = WatchRestTimerState()
    @Published public var cnsReadiness: WatchCnsReadiness = WatchCnsReadiness()
    @Published public var cameraRemote: WatchCameraRemoteState = WatchCameraRemoteState()
    @Published public var companionSummary: WatchCompanionSummary = WatchCompanionSummary()
    @Published public var isPhoneReachable: Bool = false
    @Published public var selectedTab: Int = 1
    @Published public var isCardioIntervalRunning: Bool = false
    @Published public var cardioElapsedSeconds: Int = 0
    @Published public var isCardioCompleted: Bool = false
    @Published public var activeDeepLinkSheet: String? = nil
    @Published public var pendingOfflineTransfersCount: Int = 0
    @Published public var lastPhoneSyncAt: Date? = nil

    private var localTimer: Timer?
    private var cardioTimer: Timer?
    private var lastWarningFiredSeconds: Int = -1

    // Local override tracking to prevent race conditions from in-flight sync payloads
    private var lastLocalPhaseSelectionTime: Date?
    private var lastLocalPhaseSelected: String?
    private var lastLocalExerciseSelectionTime: Date?
    private var lastLocalExerciseIndex: Int?
    private var localDrillOverrides: [String: (isCompleted: Bool, timestamp: Date)] = [:]
    private var localStretchOverrides: [String: (isCompleted: Bool, timestamp: Date)] = [:]

    private let cachedWorkoutKey = "forge_cached_workout_state"
    private let cachedCompanionKey = "forge_cached_companion_summary"

    private override init() {
        super.init()
        restoreCachedWorkoutState()
        restoreCachedCompanionSummary()
        activateSession()
    }

    public func saveCachedCompanionSummary() {
        do {
            let data = try JSONEncoder().encode(self.companionSummary)
            let defaults = UserDefaults.standard
            defaults.set(data, forKey: cachedCompanionKey)
            defaults.set(self.companionSummary.optPhase, forKey: "forge_opt_phase")
            defaults.set(self.companionSummary.optPhaseLabel, forKey: "forge_opt_phase_label")
            defaults.set(self.companionSummary.dailyStreak, forKey: "forge_daily_streak")
            defaults.set(self.companionSummary.jointComfortScore, forKey: "forge_joint_comfort_score")
            defaults.set(self.companionSummary.comfortStatusLabel, forKey: "forge_joint_comfort_label")
            defaults.set(self.cnsReadiness.score, forKey: "forge_cns_score")
            defaults.set(self.cnsReadiness.tierLabel, forKey: "forge_cns_tier")
            WidgetCenter.shared.reloadAllTimelines()
        } catch {
            print("[WatchSessionCoordinator] Error caching companion summary: \(error.localizedDescription)")
        }
    }

    public func restoreCachedCompanionSummary() {
        guard let data = UserDefaults.standard.data(forKey: cachedCompanionKey) else { return }
        if let decoded = try? JSONDecoder().decode(WatchCompanionSummary.self, from: data) {
            self.companionSummary = decoded
        }
    }

    public func saveCachedWorkoutState() {
        do {
            let data = try JSONEncoder().encode(self.workoutState)
            UserDefaults.standard.set(data, forKey: cachedWorkoutKey)
            print("[WatchSessionCoordinator] Saved cached workout state: \(self.workoutState.workoutId), \(self.workoutState.exercises.count) exercises")
        } catch {
            print("[WatchSessionCoordinator] Error caching workout state: \(error.localizedDescription)")
        }
    }

    public func restoreCachedWorkoutState() {
        guard let data = UserDefaults.standard.data(forKey: cachedWorkoutKey) else { return }
        do {
            let cached = try JSONDecoder().decode(WatchWorkoutState.self, from: data)
            if !cached.exercises.isEmpty {
                self.workoutState = cached
                print("[WatchSessionCoordinator] Successfully restored offline workout state with \(cached.exercises.count) exercises")
            }
        } catch {
            print("[WatchSessionCoordinator] Error restoring cached workout state: \(error.localizedDescription)")
        }
    }

    public func activateSession() {
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
            if session.activationState == .activated {
                refreshFromApplicationContext()
            }
        }
    }

    public func refreshFromApplicationContext() {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        if !session.receivedApplicationContext.isEmpty {
            handleIncomingMessage(session.receivedApplicationContext)
        }
    }

    // MARK: - Outbound Actions (Watch -> iPhone)

    /**
     * Athlete logs completed set from Apple Watch (Digital Crown / Tap / Action Button).
     */
    public func logCompletedSet(
        exerciseName: String,
        setIndex: Int,
        reps: Int,
        weightLbs: Double,
        rpe: Double = 8.0,
        rir: Double = 2.0
    ) {
        WatchHapticManager.shared.playSetLoggedConfirmation()

        let payload: [String: Any] = [
            "type": "setLogged",
            "setData": [
                "exerciseName": exerciseName,
                "setIndex": setIndex,
                "reps": reps,
                "weightLbs": weightLbs,
                "rpe": rpe,
                "rir": rir,
                "loggedAt": ISO8601DateFormatter().string(from: Date())
            ]
        ]

        sendToPhone(payload)

        // Advance local completed sets count and launch local bio-adaptive rest timer
        workoutState.completedSetsCount += 1

        var currentExRestSecs = 60

        if var current = workoutState.activeExercise {
            current.completedSetsCount += 1
            currentExRestSecs = current.restSeconds

            let isSupersetPair = current.isSuperset == true
            let isSupersetA = isSupersetPair && (current.supersetRole == "A" || currentExRestSecs <= 0)
            let isSupersetB = isSupersetPair && current.supersetRole == "B"

            if current.completedSetsCount < current.totalSets {
                current.setNumber = min(current.totalSets, current.completedSetsCount + 1)
                workoutState.activeExercise = current
                if workoutState.activeExerciseIndex < workoutState.exercises.count {
                    workoutState.exercises[workoutState.activeExerciseIndex] = current
                }
            } else {
                current.isCompleted = true
                current.setNumber = current.totalSets
                workoutState.activeExercise = current
                if workoutState.activeExerciseIndex < workoutState.exercises.count {
                    workoutState.exercises[workoutState.activeExerciseIndex] = current
                }
            }

            // CASE 1: Superset 1A completed with 0s transition rest
            // Immediately advance to partner 1B WITHOUT starting a rest timer
            if isSupersetA, let partnerIdx = current.supersetPartnerIndex ?? (workoutState.activeExerciseIndex + 1 < workoutState.exercises.count ? workoutState.activeExerciseIndex + 1 : nil), partnerIdx < workoutState.exercises.count {
                workoutState.activeExerciseIndex = partnerIdx
                workoutState.activeExercise = workoutState.exercises[partnerIdx]
                lastLocalExerciseSelectionTime = Date()
                lastLocalExerciseIndex = partnerIdx

                WKInterfaceDevice.current().play(.directionUp)
                sendToPhone([
                    "type": "exerciseSelected",
                    "exerciseName": workoutState.exercises[partnerIdx].exerciseName,
                    "timestamp": ISO8601DateFormatter().string(from: Date())
                ])

                saveCachedWorkoutState()

                // Stay on Tab 1 (Lift view) for immediate execution of 1B
                DispatchQueue.main.async {
                    self.selectedTab = 1
                }
                return
            }

            // CASE 2: Both exercises in superset pair completed, or single exercise completed
            let allSetsDoneForCurrent = current.isCompleted
            var advanceToNextStation = false
            var targetNextIndex = workoutState.activeExerciseIndex + 1

            if isSupersetB {
                let partnerAComplete = current.supersetPartnerIndex != nil && current.supersetPartnerIndex! < workoutState.exercises.count
                    ? workoutState.exercises[current.supersetPartnerIndex!].isCompleted
                    : true
                if allSetsDoneForCurrent && partnerAComplete {
                    advanceToNextStation = true
                    targetNextIndex = max(workoutState.activeExerciseIndex, current.supersetPartnerIndex ?? workoutState.activeExerciseIndex) + 1
                }
            } else if !isSupersetPair && allSetsDoneForCurrent {
                advanceToNextStation = true
                targetNextIndex = workoutState.activeExerciseIndex + 1
            }

            if advanceToNextStation {
                if targetNextIndex < workoutState.exercises.count {
                    workoutState.activeExerciseIndex = targetNextIndex
                    workoutState.activeExercise = workoutState.exercises[targetNextIndex]
                    lastLocalExerciseSelectionTime = Date()
                    lastLocalExerciseIndex = targetNextIndex

                    sendToPhone([
                        "type": "exerciseSelected",
                        "exerciseName": workoutState.exercises[targetNextIndex].exerciseName,
                        "timestamp": ISO8601DateFormatter().string(from: Date())
                    ])
                } else {
                    // All resistance lifts completed for today's session!
                    // Determine next phase: Cardio (if available & unfinished) -> Cool-Down (if available) -> Finish
                    let nextPhase: String
                    if let cardio = workoutState.cardioProtocol, !cardio.isCompleted, !isCardioCompleted {
                        nextPhase = "cardio"
                    } else if !workoutState.cooldownStretches.isEmpty {
                        nextPhase = "cooldown"
                    } else {
                        nextPhase = "cooldown"
                    }

                    workoutState.activePhase = nextPhase
                    lastLocalPhaseSelectionTime = Date()
                    lastLocalPhaseSelected = nextPhase

                    WatchHapticManager.shared.playSuccessKnock()
                    WKInterfaceDevice.current().play(.success)

                    sendToPhone([
                        "type": "phaseSelected",
                        "phase": nextPhase,
                        "timestamp": ISO8601DateFormatter().string(from: Date())
                    ])
                }
            }
        }

        startLocalRestTimer(seconds: currentExRestSecs, exerciseName: exerciseName)

        saveCachedWorkoutState()

        // Automatically navigate to the radial rest timer tab to pace recovery
        DispatchQueue.main.async {
            self.selectedTab = 2
        }
    }

    // MARK: - Exercise & Phase Navigation

    public func selectNextExercise() {
        guard !workoutState.exercises.isEmpty else { return }
        let nextIndex = min(workoutState.exercises.count - 1, workoutState.activeExerciseIndex + 1)
        guard nextIndex != workoutState.activeExerciseIndex else { return }
        workoutState.activeExerciseIndex = nextIndex
        workoutState.activeExercise = workoutState.exercises[nextIndex]
        lastLocalExerciseSelectionTime = Date()
        lastLocalExerciseIndex = nextIndex
        saveCachedWorkoutState()
        WKInterfaceDevice.current().play(.click)

        sendToPhone([
            "type": "exerciseSelected",
            "exerciseName": workoutState.exercises[nextIndex].exerciseName,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ])
    }

    public func selectPreviousExercise() {
        guard !workoutState.exercises.isEmpty else { return }
        let prevIndex = max(0, workoutState.activeExerciseIndex - 1)
        guard prevIndex != workoutState.activeExerciseIndex else { return }
        workoutState.activeExerciseIndex = prevIndex
        workoutState.activeExercise = workoutState.exercises[prevIndex]
        lastLocalExerciseSelectionTime = Date()
        lastLocalExerciseIndex = prevIndex
        saveCachedWorkoutState()
        WKInterfaceDevice.current().play(.click)

        sendToPhone([
            "type": "exerciseSelected",
            "exerciseName": workoutState.exercises[prevIndex].exerciseName,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ])
    }

    public func selectExercise(named name: String) {
        let cleaned = name.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if let idx = workoutState.exercises.firstIndex(where: {
            $0.exerciseName.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() == cleaned
        }) {
            workoutState.activeExerciseIndex = idx
            workoutState.activeExercise = workoutState.exercises[idx]
            workoutState.activePhase = "resistance"
            lastLocalPhaseSelectionTime = Date()
            lastLocalPhaseSelected = "resistance"
            lastLocalExerciseSelectionTime = Date()
            lastLocalExerciseIndex = idx
            saveCachedWorkoutState()
            WKInterfaceDevice.current().play(.click)

            sendToPhone([
                "type": "exerciseSelected",
                "exerciseName": workoutState.exercises[idx].exerciseName,
                "timestamp": ISO8601DateFormatter().string(from: Date())
            ])
        }
    }

    public func updateActiveExerciseEquipmentModality(_ modality: WatchEquipmentModality) {
        if var active = workoutState.activeExercise {
            active.equipmentModality = modality.rawValue
            workoutState.activeExercise = active
            if workoutState.activeExerciseIndex < workoutState.exercises.count {
                workoutState.exercises[workoutState.activeExerciseIndex].equipmentModality = modality.rawValue
            }
            saveCachedWorkoutState()
            WKInterfaceDevice.current().play(.click)

            sendToPhone([
                "type": "modalitySelected",
                "exerciseName": active.exerciseName,
                "equipmentModality": modality.rawValue,
                "timestamp": ISO8601DateFormatter().string(from: Date())
            ])
        }
    }

    public func selectPhase(_ phase: String) {
        lastLocalPhaseSelectionTime = Date()
        lastLocalPhaseSelected = phase
        workoutState.activePhase = phase
        selectedTab = 1
        WKInterfaceDevice.current().play(.click)

        sendToPhone([
            "type": "phaseSelected",
            "phase": phase,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ])
    }

    public func toggleWarmupDrill(named name: String) {
        if let idx = workoutState.warmupDrills.firstIndex(where: { $0.name == name }) {
            workoutState.warmupDrills[idx].isCompleted.toggle()
            let isDone = workoutState.warmupDrills[idx].isCompleted
            localDrillOverrides[name] = (isCompleted: isDone, timestamp: Date())

            if isDone {
                WatchHapticManager.shared.playSuccessKnock()
            } else {
                WKInterfaceDevice.current().play(.click)
            }

            sendToPhone([
                "type": "warmupDrillToggled",
                "drillName": name,
                "isCompleted": isDone,
                "timestamp": ISO8601DateFormatter().string(from: Date())
            ])
        }
    }

    public func completeWarmupDrill(named name: String) {
        if let idx = workoutState.warmupDrills.firstIndex(where: { $0.name == name }) {
            if !workoutState.warmupDrills[idx].isCompleted {
                workoutState.warmupDrills[idx].isCompleted = true
                localDrillOverrides[name] = (isCompleted: true, timestamp: Date())
                WatchHapticManager.shared.playSuccessKnock()

                sendToPhone([
                    "type": "warmupDrillToggled",
                    "drillName": name,
                    "isCompleted": true,
                    "timestamp": ISO8601DateFormatter().string(from: Date())
                ])
            }
        }
    }

    public func toggleCooldownStretch(named name: String) {
        if let idx = workoutState.cooldownStretches.firstIndex(where: { $0.name == name }) {
            workoutState.cooldownStretches[idx].isCompleted.toggle()
            let isDone = workoutState.cooldownStretches[idx].isCompleted
            localStretchOverrides[name] = (isCompleted: isDone, timestamp: Date())

            if isDone {
                WatchHapticManager.shared.playSuccessKnock()
            } else {
                WKInterfaceDevice.current().play(.click)
            }

            sendToPhone([
                "type": "cooldownStretchToggled",
                "stretchName": name,
                "isCompleted": isDone,
                "timestamp": ISO8601DateFormatter().string(from: Date())
            ])
        }
    }

    public func completeCooldownStretch(named name: String) {
        if let idx = workoutState.cooldownStretches.firstIndex(where: { $0.name == name }) {
            if !workoutState.cooldownStretches[idx].isCompleted {
                workoutState.cooldownStretches[idx].isCompleted = true
                localStretchOverrides[name] = (isCompleted: true, timestamp: Date())
                WatchHapticManager.shared.playSuccessKnock()

                sendToPhone([
                    "type": "cooldownStretchToggled",
                    "stretchName": name,
                    "isCompleted": true,
                    "timestamp": ISO8601DateFormatter().string(from: Date())
                ])
            }
        }
    }

    /**
     * Athlete starts workout directly from watch home view.
     * Notifies companion iPhone so the web app switches to the active workout session.
     */
    public func startWorkoutFromWatch(dayNumber: Int, phase: String = "warmup") {
        let payload: [String: Any] = [
            "type": "startWorkout",
            "dayNumber": dayNumber,
            "phase": phase,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]
        sendToPhone(payload)
    }

    // MARK: - Cardio Conditioning Interval Controls

    public func startCardioInterval() {
        cardioTimer?.invalidate()
        isCardioIntervalRunning = true
        WKInterfaceDevice.current().play(.start)

        if !WatchWorkoutManager.shared.isWorkoutActive {
            WatchWorkoutManager.shared.startWorkout(activityType: .highIntensityIntervalTraining)
        }

        cardioTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            if self.isCardioIntervalRunning {
                self.cardioElapsedSeconds += 1

                let prescribedSecs = (self.workoutState.cardioProtocol?.durationMins ?? 20) * 60
                if self.cardioElapsedSeconds == prescribedSecs {
                    WatchHapticManager.shared.playSuccessKnock()
                }
            }
        }
    }

    public func pauseCardioInterval() {
        isCardioIntervalRunning = false
        WKInterfaceDevice.current().play(.stop)
    }

    public func resumeCardioInterval() {
        isCardioIntervalRunning = true
        WKInterfaceDevice.current().play(.start)
    }

    public func resetCardioInterval() {
        cardioTimer?.invalidate()
        cardioTimer = nil
        isCardioIntervalRunning = false
        cardioElapsedSeconds = 0
    }

    public func completeCardioInterval() {
        let elapsed = cardioElapsedSeconds
        resetCardioInterval()
        isCardioCompleted = true
        if workoutState.cardioProtocol != nil {
            workoutState.cardioProtocol?.isCompleted = true
        }

        WatchHapticManager.shared.playSuccessKnock()
        WKInterfaceDevice.current().play(.success)

        let prescribedMins = workoutState.cardioProtocol?.durationMins ?? 20
        let effectiveDurationMins = elapsed >= 45 ? max(1, Int(round(Double(elapsed) / 60.0))) : prescribedMins
        let modality = workoutState.cardioProtocol?.modality ?? "Zone 2 Cardio"
        let zone = workoutState.cardioProtocol?.targetZone ?? 2
        let currentBpm = WatchWorkoutManager.shared.currentHeartRate
        let calories = Int(WatchWorkoutManager.shared.activeCalories)

        let payload: [String: Any] = [
            "type": "cardioCompleted",
            "durationMins": effectiveDurationMins,
            "modality": modality,
            "targetZone": zone,
            "avgHeartRate": currentBpm > 0 ? currentBpm : 0,
            "calories": calories > 0 ? calories : 0,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]
        sendToPhone(payload)
    }

    /**
     * Athlete triggers a rest timer action on wrist ('ready', 'add15', 'minus15', 'skip').
     */
    public func triggerRestAction(_ action: String) {
        let payload: [String: Any] = [
            "type": "restAction",
            "action": action,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]

        sendToPhone(payload)

        switch action {
        case "ready", "skip":
            stopLocalRestTimer()
            DispatchQueue.main.async {
                self.selectedTab = 1
            }
        case "add15":
            restTimer.remainingSeconds += 15
            restTimer.totalRestSeconds += 15
        case "minus15":
            restTimer.remainingSeconds = max(0, restTimer.remainingSeconds - 15)
        default:
            break
        }
    }

    /**
     * Streams optical heart rate samples and session recovery metrics to iPhone.
     */
    public func streamLiveHeartRate(
        bpm: Int,
        activeCalories: Double = 0,
        peakBpm: Int = 0,
        avgBpm: Int = 0,
        recoveryDeltaBpm: Int = 0
    ) {
        let payload: [String: Any] = [
            "type": "liveHeartRate",
            "bpm": bpm,
            "activeCalories": activeCalories,
            "peakBpm": peakBpm,
            "avgBpm": avgBpm,
            "recoveryDeltaBpm": recoveryDeltaBpm,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]

        if WCSession.default.isReachable {
            WCSession.default.sendMessage(payload, replyHandler: nil, errorHandler: nil)
        }

        // Bio-Adaptive check: If rest timer is active and athlete enters Zone 1 early, trigger Ready to Lift
        if restTimer.isRunning && bpm < 115 && restTimer.remainingSeconds > 15 {
            if !restTimer.isBioPaced {
                restTimer.isBioPaced = true
                restTimer.badgeText = "Ready to Lift"
                WatchHapticManager.shared.playReadyToLift()
            }
        }
    }

    /**
     * Updates RPE on the just-completed set from the Digital Crown Plain-English RPE Picker
     * and syncs directly to the iPhone's autoregulation engine.
     */
    public func submitPostSetPlainRpe(exerciseName: String, setIndex: Int, rpe: Double) {
        let rir = max(0.0, 10.0 - rpe)
        let opt = WatchPlainRpeOption.nearest(to: rpe)
        let payload: [String: Any] = [
            "type": "rpeUpdated",
            "exerciseName": exerciseName,
            "setIndex": setIndex,
            "rpe": rpe,
            "rir": rir,
            "plainLabel": opt.badgeTitle,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]
        sendToPhone(payload)

        // Autoregulate active rest timer on wrist if effort was Hard (9) or Max (10)
        if restTimer.isRunning && rpe >= 9.0 && !restTimer.isBioPaced {
            let extraRest = rpe >= 10.0 ? 30 : 15
            restTimer.remainingSeconds += extraRest
            restTimer.totalRestSeconds += extraRest
            restTimer.isBioPaced = true
            restTimer.badgeText = "RPE \(Int(rpe)) +\(extraRest)s"
        }
    }

    /**
     * Triggers remote camera shutter / rep recording / stop & review on the propped iPhone.
     */
    public func sendCameraRemoteCommand(_ command: String) {
        if command == "startTimer5s" {
            cameraRemote.countdownSeconds = 5
            WatchHapticManager.shared.playCameraCountdownTick()
        } else if command == "recordRep" {
            cameraRemote.isRecording = true
            cameraRemote.repCount += 1
            WatchHapticManager.shared.playSetLoggedConfirmation()
        } else if command == "stopAndReview" {
            cameraRemote.isRecording = false
            WatchHapticManager.shared.playSuccessKnock()
        } else if command == "dismissRemote" {
            cameraRemote.isActive = false
        }

        let payload: [String: Any] = [
            "type": "cameraRemoteCommand",
            "command": command,
            "mode": cameraRemote.mode,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]
        sendToPhone(payload)
    }

    /**
     * Toggles 20-Minute Express Workout mode directly from the wrist.
     */
    public func toggleExpress20mMode() {
        let nextVal = !workoutState.expressModeActive
        workoutState.expressModeActive = nextVal
        companionSummary.expressModeActive = nextVal
        WKInterfaceDevice.current().play(.click)
        saveCachedWorkoutState()
        saveCachedCompanionSummary()

        sendToPhone([
            "type": "expressModeToggled",
            "expressModeActive": nextVal,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ])
    }

    /**
     * Skips or batch-completes auto-injected Readiness Warm-Up drills from the wrist and advances to Set 1.
     */
    public func skipOrCompleteReadinessWarmup(markCompleted: Bool) {
        for idx in workoutState.warmupDrills.indices {
            workoutState.warmupDrills[idx].isCompleted = markCompleted
            localDrillOverrides[workoutState.warmupDrills[idx].name] = (isCompleted: markCompleted, timestamp: Date())
        }
        workoutState.activePhase = "resistance"
        lastLocalPhaseSelectionTime = Date()
        lastLocalPhaseSelected = "resistance"
        WKInterfaceDevice.current().play(.directionUp)
        saveCachedWorkoutState()

        sendToPhone([
            "type": "warmupBatchAction",
            "action": markCompleted ? "completeAll" : "skipAll",
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ])
    }

    /**
     * Standalone 5-Minute Desk Reset completion on wrist (works offline via FIFO transferUserInfo).
     */
    public func completeDeskResetSession(durationSec: Int, drillsCompleted: Int) {
        if !companionSummary.deskResetDoneToday {
            companionSummary.dailyStreak = max(1, companionSummary.dailyStreak + 1)
            companionSummary.deskResetDoneToday = true
        }
        workoutState.dailyStreak = companionSummary.dailyStreak
        WatchHapticManager.shared.playSuccessKnock()
        saveCachedCompanionSummary()
        saveCachedWorkoutState()

        let payload: [String: Any] = [
            "type": "deskResetCompleted",
            "durationSec": durationSec,
            "drillsCompleted": drillsCompleted,
            "dailyStreak": companionSummary.dailyStreak,
            "ergonomicFlags": companionSummary.ergonomicFlags,
            "completedAt": ISO8601DateFormatter().string(from: Date())
        ]
        // Always enqueue via transferUserInfo for guaranteed FIFO offline streak delivery, plus instant sendMessage if reachable
        if WCSession.default.isReachable {
            WCSession.default.sendMessage(payload, replyHandler: nil) { [weak self] _ in
                self?.transferUserInfo(payload)
            }
        } else {
            transferUserInfo(payload)
        }
    }

    /**
     * Logs daily 10-second Digital Crown Joint Comfort Check-In (Neck, Lower Back, Hips 1–5)
     * and pushes to iPhone + Coach Gordon's Coach Portal.
     */
    public func logJointComfortCheckIn(neck: Int, lowerBack: Int, hips: Int) {
        let score = WatchCompanionSummary.computeComfortScore(neck: neck, lowerBack: lowerBack, hips: hips)
        companionSummary.neckRating = neck
        companionSummary.lowerBackRating = lowerBack
        companionSummary.hipsRating = hips
        companionSummary.jointComfortScore = score
        companionSummary.updatedAt = ISO8601DateFormatter().string(from: Date())
        WatchHapticManager.shared.playSuccessKnock()
        saveCachedCompanionSummary()

        var painFlags: [String] = []
        if neck <= 2 { painFlags.append("neck_tightness") }
        if lowerBack <= 2 { painFlags.append("lumbar_stiffness") }
        if hips <= 2 { painFlags.append("hip_tightness") }

        let payload: [String: Any] = [
            "type": "jointComfortLogged",
            "jointComfortScore": score,
            "neck": neck,
            "lowerBack": lowerBack,
            "hips": hips,
            "painFlags": painFlags,
            "loggedAt": companionSummary.updatedAt
        ]
        sendToPhone(payload)
    }

    private func sendToPhone(_ payload: [String: Any]) {
        let session = WCSession.default
        if session.isReachable {
            session.sendMessage(payload, replyHandler: nil) { [weak self] _ in
                // Fallback to guaranteed background transfer if instant message fails
                self?.transferUserInfo(payload)
            }
        } else {
            // Phone is unreachable (e.g. in gym locker room) — queue guaranteed system transfer
            transferUserInfo(payload)
        }
    }

    private func transferUserInfo(_ payload: [String: Any]) {
        guard WCSession.isSupported() else { return }
        let transfer = WCSession.default.transferUserInfo(payload)
        DispatchQueue.main.async {
            self.pendingOfflineTransfersCount = WCSession.default.outstandingUserInfoTransfers.count
        }
        let typeStr = (payload["type"] as? String) ?? "unknown"
        print("[WatchSessionCoordinator] Queued offline sync packet '\(typeStr)' (isTransferring=\(transfer.isTransferring), outstanding=\(WCSession.default.outstandingUserInfoTransfers.count))")
    }

    // MARK: - Local Rest Timer Pacing

    public func startLocalRestTimer(seconds: Int, exerciseName: String) {
        localTimer?.invalidate()
        restTimer = WatchRestTimerState(
            isRunning: true,
            remainingSeconds: seconds,
            totalRestSeconds: seconds,
            exerciseName: exerciseName,
            isBioPaced: false,
            badgeText: "Resting"
        )
        lastWarningFiredSeconds = -1

        localTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            if self.restTimer.remainingSeconds > 0 {
                self.restTimer.remainingSeconds -= 1

                // Fire T-10 second warning pulse
                if self.restTimer.remainingSeconds == 10 && self.lastWarningFiredSeconds != 10 {
                    self.lastWarningFiredSeconds = 10
                    WatchHapticManager.shared.playRestEndingWarning()
                }
            } else {
                self.stopLocalRestTimer()
                WatchHapticManager.shared.playRestComplete()

                // If in superset round-robin (just rested after 1B), check if 1A has remaining sets!
                if let active = self.workoutState.activeExercise, active.isSuperset == true, active.supersetRole == "B" {
                    if let partnerIdx = active.supersetPartnerIndex, partnerIdx < self.workoutState.exercises.count {
                        let partnerA = self.workoutState.exercises[partnerIdx]
                        if !partnerA.isCompleted && partnerA.completedSetsCount < partnerA.totalSets {
                            self.workoutState.activeExerciseIndex = partnerIdx
                            self.workoutState.activeExercise = partnerA
                            self.lastLocalExerciseSelectionTime = Date()
                            self.lastLocalExerciseIndex = partnerIdx

                            self.sendToPhone([
                                "type": "exerciseSelected",
                                "exerciseName": partnerA.exerciseName,
                                "timestamp": ISO8601DateFormatter().string(from: Date())
                            ])
                        }
                    }
                }

                // If all lifts in workout are finished, ensure next phase is shown (e.g. Russian Twists complete -> Cardio/Cool-Down)
                if !self.workoutState.exercises.isEmpty && self.workoutState.exercises.allSatisfy({ $0.isCompleted }) {
                    let nextPhase = (self.workoutState.cardioProtocol != nil && !self.isCardioCompleted && !(self.workoutState.cardioProtocol?.isCompleted ?? false)) ? "cardio" : "cooldown"
                    self.workoutState.activePhase = nextPhase
                    self.sendToPhone([
                        "type": "phaseSelected",
                        "phase": nextPhase,
                        "timestamp": ISO8601DateFormatter().string(from: Date())
                    ])
                }

                DispatchQueue.main.async {
                    self.selectedTab = 1
                }
            }
        }
    }

    public func stopLocalRestTimer() {
        localTimer?.invalidate()
        localTimer = nil
        restTimer.isRunning = false
        restTimer.remainingSeconds = 0
    }

    // MARK: - WCSessionDelegate

    public func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async {
            self.isPhoneReachable = session.isReachable
            print("[WatchSessionCoordinator] Session activated: state=\(activationState.rawValue), isReachable=\(session.isReachable), outstandingTransfers=\(session.outstandingUserInfoTransfers.count)")
            if activationState == .activated {
                self.refreshFromApplicationContext()
            }
        }
    }

    public func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isPhoneReachable = session.isReachable
            print("[WatchSessionCoordinator] Reachability changed: isReachable=\(session.isReachable), outstandingTransfers=\(session.outstandingUserInfoTransfers.count)")
        }
    }

    public func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        handleIncomingMessage(message)
    }

    public func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String : Any]) {
        handleIncomingMessage(applicationContext)
    }

    public func session(_ session: WCSession, didReceiveUserInfo userInfo: [String : Any] = [:]) {
        handleIncomingMessage(userInfo)
    }

    public func handleIncomingMessage(_ dict: [String: Any]) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.lastPhoneSyncAt = Date()
            if WCSession.isSupported() {
                self.pendingOfflineTransfersCount = WCSession.default.outstandingUserInfoTransfers.count
            }

            // Cancel Workout Signal from iPhone
            if let type = dict["type"] as? String, type == "cancelWorkout" {
                self.cancelSession(notifyPhone: false)
                return
            }

            // End Workout Signal from iPhone
            if let type = dict["type"] as? String, type == "endWorkout" {
                self.finishSession(notifyPhone: false)
                return
            }

            // Live Wrist Camera Remote Update from iPhone (Quick Posture, Readiness Check, Desk Audit, Form Lab)
            if let camDict = dict["cameraRemote"] as? [String: Any] {
                self.parseCameraRemote(camDict)
            } else if let type = dict["type"] as? String, type == "cameraRemoteState" {
                self.parseCameraRemote(dict)
            }

            // Companion Summary Update (OPT Phase, Daily Streak, Joint Comfort, Express Mode)
            if let compDict = dict["companionSummary"] as? [String: Any] {
                self.parseCompanionSummary(compDict)
            }

            // Workout State Update from iPhone (nested under "workout" or passed top-level)
            if let workoutDict = dict["workout"] as? [String: Any] {
                self.parseWorkoutState(workoutDict)
            } else if dict["workoutId"] != nil || dict["dayNumber"] != nil || dict["exercises"] != nil || dict["warmupDrills"] != nil {
                self.parseWorkoutState(dict)
            }

            // Rest Timer Update from iPhone
            if let restDict = dict["restTimer"] as? [String: Any] {
                self.parseRestTimer(restDict)
            }

            // CNS Readiness Update
            if let cnsDict = dict["cnsReadiness"] as? [String: Any] {
                let score = cnsDict["score"] as? Int ?? 80
                let rhr = cnsDict["rhr"] as? Int ?? 55
                let hrv = cnsDict["hrv"] as? Int ?? 70
                let date = cnsDict["date"] as? String ?? ""
                self.cnsReadiness = WatchCnsReadiness(score: score, restingHeartRate: rhr, hrvRmssd: hrv, date: date)
                self.saveCachedCompanionSummary()
            }
        }
    }

    private func parseCameraRemote(_ dict: [String: Any]) {
        let wasLocked = self.cameraRemote.isLockedEmerald
        let isActive = dict["isActive"] as? Bool ?? false
        let mode = dict["mode"] as? String ?? "quick_posture"
        let modeTitle = dict["modeTitle"] as? String ?? "Camera Scan"
        let framingStatus = dict["framingStatus"] as? String ?? "framing"
        let isRecording = dict["isRecording"] as? Bool ?? false
        let countdownSeconds = dict["countdownSeconds"] as? Int ?? 0
        let repCount = dict["repCount"] as? Int ?? 0
        let targetReps = dict["targetReps"] as? Int ?? 3
        let statusHint = dict["statusHint"] as? String ?? "Step 6–8 ft back into frame"

        let nextState = WatchCameraRemoteState(
            isActive: isActive,
            mode: mode,
            modeTitle: modeTitle,
            framingStatus: framingStatus,
            isRecording: isRecording,
            countdownSeconds: countdownSeconds,
            repCount: repCount,
            targetReps: targetReps,
            statusHint: statusHint
        )
        self.cameraRemote = nextState

        if isActive && nextState.isLockedEmerald && !wasLocked {
            WatchHapticManager.shared.playCameraLockedEmerald()
        }
    }

    private func parseCompanionSummary(_ dict: [String: Any]) {
        if let opt = dict["optPhase"] as? Int {
            companionSummary.optPhase = opt
            companionSummary.optPhaseLabel = (dict["optPhaseLabel"] as? String) ?? WatchCompanionSummary.optPhaseShortName(opt)
        }
        if let streak = dict["dailyStreak"] as? Int {
            companionSummary.dailyStreak = streak
        }
        if let comfort = dict["jointComfortScore"] as? Int {
            companionSummary.jointComfortScore = comfort
        }
        if let express = dict["expressModeActive"] as? Bool {
            companionSummary.expressModeActive = express
            workoutState.expressModeActive = express
        }
        if let deskDone = dict["deskResetDoneToday"] as? Bool {
            companionSummary.deskResetDoneToday = deskDone
        }
        if let flags = dict["ergonomicFlags"] as? [String] {
            companionSummary.ergonomicFlags = flags
        }
        companionSummary.updatedAt = ISO8601DateFormatter().string(from: Date())
        saveCachedCompanionSummary()
    }

    /**
     * Athlete or iPhone finishes and saves the active workout session to HealthKit and training history.
     */
    public func finishSession(notifyPhone: Bool = true) {
        workoutState.isSessionActive = false
        stopLocalRestTimer()
        resetCardioInterval()
        isCardioCompleted = false
        WatchWorkoutManager.shared.finishWorkout()
        WatchHapticManager.shared.playSuccessKnock()

        if notifyPhone {
            let payload: [String: Any] = [
                "type": "endWorkout",
                "timestamp": ISO8601DateFormatter().string(from: Date())
            ]
            sendToPhone(payload)
        }
    }

    /**
     * Athlete or iPhone cancels/discards the workout session without saving to Apple Health.
     */
    public func cancelSession(notifyPhone: Bool = true) {
        workoutState.isSessionActive = false
        stopLocalRestTimer()
        resetCardioInterval()
        isCardioCompleted = false
        WatchWorkoutManager.shared.discardWorkout()
        WKInterfaceDevice.current().play(.failure)

        if notifyPhone {
            let payload: [String: Any] = [
                "type": "cancelWorkout",
                "timestamp": ISO8601DateFormatter().string(from: Date())
            ]
            sendToPhone(payload)
        }
    }

    /**
     * Backward-compatible endSession. Defaults to saving if save == true, or discarding if save == false.
     */
    public func endSession(save: Bool = true, notifyPhone: Bool = true) {
        if save {
            finishSession(notifyPhone: notifyPhone)
        } else {
            cancelSession(notifyPhone: notifyPhone)
        }
    }

    private func parseWorkoutState(_ dict: [String: Any]) {
        let isActive = dict["isSessionActive"] as? Bool ?? true
        let isCancelled = dict["isCancelled"] as? Bool ?? false
        let action = dict["action"] as? String ?? ""
        let workoutId = dict["workoutId"] as? String ?? ""

        if isCancelled || action == "cancelWorkout" {
            self.cancelSession(notifyPhone: false)
            return
        }

        if !isActive && (workoutId.isEmpty || workoutId == "idle") {
            if action == "finishWorkout" {
                self.finishSession(notifyPhone: false)
            } else {
                self.cancelSession(notifyPhone: false)
            }
            return
        }

        let effectiveWorkoutId = workoutId.isEmpty ? "active-session" : workoutId
        let dayNumber = dict["dayNumber"] as? Int ?? 1
        let focus = dict["focus"] as? String ?? "Strength & Conditioning"
        var activePhase = dict["activePhase"] as? String ?? "warmup"
        // If athlete selected a phase locally on the watch within the last 5 seconds, preserve local selection
        if let lastTime = lastLocalPhaseSelectionTime,
           let localPhase = lastLocalPhaseSelected,
           Date().timeIntervalSince(lastTime) < 5.0 {
            activePhase = localPhase
        }

        let completed = dict["completedSets"] as? Int ?? 0
        let total = dict["totalSets"] as? Int ?? 12
        let activeExIndex = dict["activeExerciseIndex"] as? Int ?? 0

        // Parse Full Exercises Array
        var parsedExercises: [WatchExerciseInfo] = []
        if let exArray = dict["exercises"] as? [[String: Any]] {
            for (idx, exDict) in exArray.enumerated() {
                let name = exDict["exerciseName"] as? String ?? "Exercise \(idx + 1)"
                let block = exDict["block"] as? String ?? "resistance"
                let phaseLabel = exDict["phaseLabel"] as? String ?? "RESISTANCE"
                let orderIdx = exDict["orderIndex"] as? Int ?? idx
                let setNum = exDict["setNumber"] as? Int ?? 1
                let totalSets = exDict["totalSets"] as? Int ?? 3
                let weight = exDict["prescribedWeight"] as? Double ?? 135.0
                let reps = exDict["prescribedReps"] as? Int ?? 10
                let repsDisplay = exDict["repsDisplay"] as? String ?? "\(reps)"
                let rpe = exDict["targetRpe"] as? Double ?? 8.0
                let tempo = exDict["tempo"] as? String ?? "2-0-2-0"
                let restSecs = exDict["restSeconds"] as? Int ?? 60
                let isCompound = exDict["isCompound"] as? Bool ?? false
                let isHammer = exDict["isHammerCurl"] as? Bool ?? false
                let opt = exDict["optPhase"] as? Int ?? 3
                var isDone = exDict["isCompleted"] as? Bool ?? false
                var doneSets = exDict["completedSetsCount"] as? Int ?? 0

                // If watch already logged sets locally for this exercise, preserve local progress
                if let existingEx = self.workoutState.exercises.first(where: {
                    $0.exerciseName.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() == name.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
                }) {
                    if existingEx.completedSetsCount > doneSets {
                        doneSets = existingEx.completedSetsCount
                    }
                    if existingEx.isCompleted {
                        isDone = true
                    }
                }
                let targetMuscles = exDict["targetMuscles"] as? String
                let equipment = exDict["equipment"] as? String
                let equipmentModality = exDict["equipmentModality"] as? String
                let setupCue = exDict["setupCue"] as? String
                let movementCues = exDict["movementCues"] as? [String]
                let coachingTip = exDict["coachingTip"] as? String
                let isSuperset = exDict["isSuperset"] as? Bool
                let supersetRole = exDict["supersetRole"] as? String
                let supersetPartnerIndex = exDict["supersetPartnerIndex"] as? Int

                parsedExercises.append(
                    WatchExerciseInfo(
                        exerciseName: name,
                        block: block,
                        phaseLabel: phaseLabel,
                        orderIndex: orderIdx,
                        setNumber: setNum,
                        totalSets: totalSets,
                        prescribedWeight: weight,
                        prescribedReps: reps,
                        repsDisplay: repsDisplay,
                        targetRpe: rpe,
                        tempo: tempo,
                        restSeconds: restSecs,
                        isCompound: isCompound,
                        isHammerCurl: isHammer,
                        optPhase: opt,
                        isCompleted: isDone,
                        completedSetsCount: doneSets,
                        targetMuscles: targetMuscles,
                        equipment: equipment,
                        equipmentModality: equipmentModality,
                        setupCue: setupCue,
                        movementCues: movementCues,
                        coachingTip: coachingTip,
                        isSuperset: isSuperset,
                        supersetRole: supersetRole,
                        supersetPartnerIndex: supersetPartnerIndex
                    )
                )
            }
        }

        // Active exercise
        var activeEx: WatchExerciseInfo? = nil
        if let exDict = dict["activeExercise"] as? [String: Any] {
            let targetMuscles = exDict["targetMuscles"] as? String
            let equipment = exDict["equipment"] as? String
            let equipmentModality = exDict["equipmentModality"] as? String
            let setupCue = exDict["setupCue"] as? String
            let movementCues = exDict["movementCues"] as? [String]
            let coachingTip = exDict["coachingTip"] as? String
            let isSuperset = exDict["isSuperset"] as? Bool
            let supersetRole = exDict["supersetRole"] as? String
            let supersetPartnerIndex = exDict["supersetPartnerIndex"] as? Int

            activeEx = WatchExerciseInfo(
                exerciseName: exDict["exerciseName"] as? String ?? "Exercise",
                block: exDict["block"] as? String ?? "resistance",
                phaseLabel: exDict["phaseLabel"] as? String ?? "RESISTANCE",
                orderIndex: exDict["orderIndex"] as? Int ?? 0,
                setNumber: exDict["setNumber"] as? Int ?? 1,
                totalSets: exDict["totalSets"] as? Int ?? 3,
                prescribedWeight: exDict["prescribedWeight"] as? Double ?? 135.0,
                prescribedReps: exDict["prescribedReps"] as? Int ?? 10,
                repsDisplay: exDict["repsDisplay"] as? String ?? "10",
                targetRpe: exDict["targetRpe"] as? Double ?? 8.0,
                tempo: exDict["tempo"] as? String ?? "2-0-2-0",
                restSeconds: exDict["restSeconds"] as? Int ?? 60,
                isCompound: exDict["isCompound"] as? Bool ?? false,
                isHammerCurl: exDict["isHammerCurl"] as? Bool ?? false,
                optPhase: exDict["optPhase"] as? Int ?? 3,
                isCompleted: exDict["isCompleted"] as? Bool ?? false,
                completedSetsCount: exDict["completedSetsCount"] as? Int ?? 0,
                targetMuscles: targetMuscles,
                equipment: equipment,
                equipmentModality: equipmentModality,
                setupCue: setupCue,
                movementCues: movementCues,
                coachingTip: coachingTip,
                isSuperset: isSuperset,
                supersetRole: supersetRole,
                supersetPartnerIndex: supersetPartnerIndex
            )
        } else if !parsedExercises.isEmpty {
            let safeIdx = min(max(0, activeExIndex), parsedExercises.count - 1)
            activeEx = parsedExercises[safeIdx]
        }

        // Parse Cardio Protocol
        var parsedCardio: WatchCardioProtocol? = nil
        if let cDict = dict["cardioProtocol"] as? [String: Any] {
            let remoteDone = cDict["isCompleted"] as? Bool ?? false
            if remoteDone {
                self.isCardioCompleted = true
            }
            parsedCardio = WatchCardioProtocol(
                modality: cDict["modality"] as? String ?? "Cardio Zone 2",
                durationMins: cDict["durationMins"] as? Int ?? 20,
                targetZone: cDict["targetZone"] as? Int ?? 2,
                targetBpmMin: cDict["targetBpmMin"] as? Int ?? 125,
                targetBpmMax: cDict["targetBpmMax"] as? Int ?? 142,
                isCompleted: remoteDone || self.isCardioCompleted
            )
        }

        // Parse Warmup Drills
        var parsedWarmups: [WatchWarmupDrill] = []
        if let wArray = dict["warmupDrills"] as? [[String: Any]] {
            for w in wArray {
                let name = w["name"] as? String ?? "Warmup Drill"
                let remoteDone = w["isCompleted"] as? Bool ?? false
                let effectiveDone: Bool
                if let override = localDrillOverrides[name], Date().timeIntervalSince(override.timestamp) < 5.0 {
                    effectiveDone = override.isCompleted
                } else {
                    effectiveDone = remoteDone
                }
                parsedWarmups.append(
                    WatchWarmupDrill(
                        name: name,
                        phaseLabel: w["phaseLabel"] as? String ?? "WARM-UP",
                        durationSec: w["durationSec"] as? Int ?? 30,
                        protocolText: w["protocol"] as? String ?? "1 set × 30s",
                        isCompleted: effectiveDone
                    )
                )
            }
        }
        if parsedWarmups.isEmpty {
            let existing = self.workoutState.warmupDrills
            if !existing.isEmpty {
                parsedWarmups = existing
            } else {
                parsedWarmups = WatchWorkoutState.defaultWarmupDrills
            }
        }

        // Parse Cooldown Stretches
        var parsedCooldowns: [WatchCooldownStretch] = []
        if let cdArray = dict["cooldownStretches"] as? [[String: Any]] {
            for cd in cdArray {
                let name = cd["name"] as? String ?? "Static Stretch"
                let remoteDone = cd["isCompleted"] as? Bool ?? false
                let effectiveDone: Bool
                if let override = localStretchOverrides[name], Date().timeIntervalSince(override.timestamp) < 5.0 {
                    effectiveDone = override.isCompleted
                } else {
                    effectiveDone = remoteDone
                }
                parsedCooldowns.append(
                    WatchCooldownStretch(
                        name: name,
                        durationSec: cd["durationSec"] as? Int ?? 30,
                        protocolText: cd["protocol"] as? String ?? "Hold for 30s",
                        isCompleted: effectiveDone
                    )
                )
            }
        }
        if parsedCooldowns.isEmpty {
            let existing = self.workoutState.cooldownStretches
            if !existing.isEmpty {
                parsedCooldowns = existing
            } else {
                parsedCooldowns = WatchWorkoutState.defaultCooldownStretches
            }
        }

        let phoneActiveIndex = dict["activeExerciseIndex"] as? Int ?? 0
        var effectiveActiveExIndex = phoneActiveIndex

        if let lastTime = lastLocalExerciseSelectionTime,
           let localIndex = lastLocalExerciseIndex,
           Date().timeIntervalSince(lastTime) < 15.0 {
            // Respect recent local selection on watch within 15-second window
            effectiveActiveExIndex = localIndex
        } else if self.workoutState.activeExerciseIndex > 0 && phoneActiveIndex == 0 && self.workoutState.workoutId == effectiveWorkoutId {
            // Guard against phone sending default 0 when watch is already progressed into the workout
            if self.workoutState.activeExerciseIndex < parsedExercises.count {
                effectiveActiveExIndex = self.workoutState.activeExerciseIndex
            }
        }

        if !parsedExercises.isEmpty {
            effectiveActiveExIndex = max(0, min(parsedExercises.count - 1, effectiveActiveExIndex))
        } else {
            effectiveActiveExIndex = 0
        }

        let effectiveActiveEx: WatchExerciseInfo?
        if !parsedExercises.isEmpty && parsedExercises.indices.contains(effectiveActiveExIndex) {
            effectiveActiveEx = parsedExercises[effectiveActiveExIndex]
        } else {
            effectiveActiveEx = activeEx ?? parsedExercises.first
        }

        let resolvedOptPhase = (dict["optPhase"] as? Int) ?? effectiveActiveEx?.optPhase ?? self.companionSummary.optPhase
        let resolvedExpressMode = (dict["expressModeActive"] as? Bool) ?? self.workoutState.expressModeActive
        let resolvedStreak = (dict["dailyStreak"] as? Int) ?? self.companionSummary.dailyStreak
        let resolvedInjectedCount = (dict["injectedWarmupCount"] as? Int) ?? self.workoutState.injectedWarmupCount
        if let jointComfort = dict["jointComfortScore"] as? Int {
            self.companionSummary.jointComfortScore = jointComfort
        }
        self.companionSummary.optPhase = resolvedOptPhase
        self.companionSummary.optPhaseLabel = WatchCompanionSummary.optPhaseShortName(resolvedOptPhase)
        self.companionSummary.dailyStreak = resolvedStreak
        self.companionSummary.expressModeActive = resolvedExpressMode
        saveCachedCompanionSummary()

        self.workoutState = WatchWorkoutState(
            workoutId: effectiveWorkoutId,
            dayNumber: dayNumber,
            focus: focus,
            activePhase: activePhase,
            activeExerciseIndex: effectiveActiveExIndex,
            activeExercise: effectiveActiveEx,
            exercises: parsedExercises,
            warmupDrills: parsedWarmups,
            cooldownStretches: parsedCooldowns,
            cardioProtocol: parsedCardio,
            completedSetsCount: completed,
            totalSetsCount: total,
            isSessionActive: isActive,
            startedAt: ISO8601DateFormatter().string(from: Date()),
            optPhase: resolvedOptPhase,
            expressModeActive: resolvedExpressMode,
            dailyStreak: resolvedStreak,
            injectedWarmupCount: resolvedInjectedCount
        )

        // Persist to offline cache on watch so session remains intact if phone stays in locker
        saveCachedWorkoutState()

        // Ensure background HKWorkoutSession is active to keep optical HR reading when session is active
        if isActive && !WatchWorkoutManager.shared.isWorkoutActive {
            WatchWorkoutManager.shared.startWorkout(
                activityType: .traditionalStrengthTraining,
                workoutId: effectiveWorkoutId,
                sessionKind: "strength"
            )
        }
    }

    private func parseRestTimer(_ dict: [String: Any]) {
        let isRunning = dict["isRunning"] as? Bool ?? false
        let remaining = dict["remainingSeconds"] as? Int ?? 0
        let total = dict["restSeconds"] as? Int ?? 60
        let exName = dict["exerciseName"] as? String ?? "Rest Interval"
        let bioPaced = dict["isBioPaced"] as? Bool ?? false
        let badge = dict["badgeText"] as? String ?? "Standard Rest"

        if isRunning && remaining > 0 {
            self.startLocalRestTimer(seconds: remaining, exerciseName: exName)
            self.restTimer.totalRestSeconds = total
            self.restTimer.isBioPaced = bioPaced
            self.restTimer.badgeText = badge
        } else {
            self.stopLocalRestTimer()
        }
    }
}
