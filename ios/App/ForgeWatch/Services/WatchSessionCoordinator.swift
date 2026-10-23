import Foundation
import WatchKit
import WatchConnectivity
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
    @Published public var isPhoneReachable: Bool = false
    @Published public var selectedTab: Int = 1
    @Published public var isCardioIntervalRunning: Bool = false
    @Published public var cardioElapsedSeconds: Int = 0
    @Published public var isCardioCompleted: Bool = false

    private var localTimer: Timer?
    private var cardioTimer: Timer?
    private var lastWarningFiredSeconds: Int = -1

    // Local override tracking to prevent race conditions from in-flight sync payloads
    private var lastLocalPhaseSelectionTime: Date?
    private var lastLocalPhaseSelected: String?
    private var localDrillOverrides: [String: (isCompleted: Bool, timestamp: Date)] = [:]
    private var localStretchOverrides: [String: (isCompleted: Bool, timestamp: Date)] = [:]

    private let cachedWorkoutKey = "forge_cached_workout_state"

    private override init() {
        super.init()
        restoreCachedWorkoutState()
        activateSession()
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

        if var current = workoutState.activeExercise {
            current.completedSetsCount += 1
            if current.setNumber < current.totalSets {
                current.setNumber += 1
            } else {
                current.isCompleted = true
            }
            workoutState.activeExercise = current
            if workoutState.activeExerciseIndex < workoutState.exercises.count {
                workoutState.exercises[workoutState.activeExerciseIndex] = current
            }
        }

        let restSecs = workoutState.activeExercise?.restSeconds ?? 60
        startLocalRestTimer(seconds: restSecs, exerciseName: exerciseName)

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
        WKInterfaceDevice.current().play(.click)

        sendToPhone([
            "type": "exerciseSelected",
            "exerciseName": workoutState.exercises[prevIndex].exerciseName,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ])
    }

    public func selectExercise(named name: String) {
        if let idx = workoutState.exercises.firstIndex(where: { $0.exerciseName.lowercased() == name.lowercased() }) {
            workoutState.activeExerciseIndex = idx
            workoutState.activeExercise = workoutState.exercises[idx]
            workoutState.activePhase = "resistance"
            lastLocalPhaseSelectionTime = Date()
            lastLocalPhaseSelected = "resistance"
            WKInterfaceDevice.current().play(.click)

            sendToPhone([
                "type": "exerciseSelected",
                "exerciseName": name,
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
     * Streams optical heart rate samples to iPhone.
     */
    public func streamLiveHeartRate(bpm: Int) {
        let payload: [String: Any] = [
            "type": "liveHeartRate",
            "bpm": bpm,
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
        let transfer = WCSession.default.transferUserInfo(payload)
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
            }
        }
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
                let isDone = exDict["isCompleted"] as? Bool ?? false
                let doneSets = exDict["completedSetsCount"] as? Int ?? 0
                let targetMuscles = exDict["targetMuscles"] as? String
                let equipment = exDict["equipment"] as? String
                let setupCue = exDict["setupCue"] as? String
                let movementCues = exDict["movementCues"] as? [String]
                let coachingTip = exDict["coachingTip"] as? String

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
                        setupCue: setupCue,
                        movementCues: movementCues,
                        coachingTip: coachingTip
                    )
                )
            }
        }

        // Active exercise
        var activeEx: WatchExerciseInfo? = nil
        if let exDict = dict["activeExercise"] as? [String: Any] {
            let targetMuscles = exDict["targetMuscles"] as? String
            let equipment = exDict["equipment"] as? String
            let setupCue = exDict["setupCue"] as? String
            let movementCues = exDict["movementCues"] as? [String]
            let coachingTip = exDict["coachingTip"] as? String

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
                setupCue: setupCue,
                movementCues: movementCues,
                coachingTip: coachingTip
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

        self.workoutState = WatchWorkoutState(
            workoutId: effectiveWorkoutId,
            dayNumber: dayNumber,
            focus: focus,
            activePhase: activePhase,
            activeExerciseIndex: activeExIndex,
            activeExercise: parsedExercises.isEmpty ? nil : activeEx,
            exercises: parsedExercises,
            warmupDrills: parsedWarmups,
            cooldownStretches: parsedCooldowns,
            cardioProtocol: parsedCardio,
            completedSetsCount: completed,
            totalSetsCount: total,
            isSessionActive: isActive,
            startedAt: ISO8601DateFormatter().string(from: Date())
        )

        // Persist to offline cache on watch so session remains intact if phone stays in locker
        saveCachedWorkoutState()

        // Ensure background HKWorkoutSession is active to keep optical HR reading when session is active
        if isActive && !WatchWorkoutManager.shared.isWorkoutActive {
            WatchWorkoutManager.shared.startWorkout()
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
