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

    private var localTimer: Timer?
    private var lastWarningFiredSeconds: Int = -1

    private override init() {
        super.init()
        activateSession()
    }

    public func activateSession() {
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
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
            WKInterfaceDevice.current().play(.click)

            sendToPhone([
                "type": "exerciseSelected",
                "exerciseName": name,
                "timestamp": ISO8601DateFormatter().string(from: Date())
            ])
        }
    }

    public func selectPhase(_ phase: String) {
        workoutState.activePhase = phase
        WKInterfaceDevice.current().play(.click)

        sendToPhone([
            "type": "phaseSelected",
            "phase": phase,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ])
    }

    public func completeWarmupDrill(named name: String) {
        if let idx = workoutState.warmupDrills.firstIndex(where: { $0.name == name }) {
            workoutState.warmupDrills[idx].isCompleted = true
            WatchHapticManager.shared.playSuccessKnock()
        }
    }

    public func completeCooldownStretch(named name: String) {
        if let idx = workoutState.cooldownStretches.firstIndex(where: { $0.name == name }) {
            workoutState.cooldownStretches[idx].isCompleted = true
            WatchHapticManager.shared.playSuccessKnock()
        }
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
            transferUserInfo(payload)
        }
    }

    private func transferUserInfo(_ payload: [String: Any]) {
        WCSession.default.transferUserInfo(payload)
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
        }
    }

    public func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isPhoneReachable = session.isReachable
        }
    }

    public func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        handleIncomingMessage(message)
    }

    public func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String : Any]) {
        handleIncomingMessage(applicationContext)
    }

    private func handleIncomingMessage(_ dict: [String: Any]) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            // End Workout Signal from iPhone
            if let type = dict["type"] as? String, type == "endWorkout" {
                self.endSession(notifyPhone: false)
                return
            }

            // Workout State Update from iPhone
            if let workoutDict = dict["workout"] as? [String: Any] {
                self.parseWorkoutState(workoutDict)
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
     * Athlete or iPhone ends the active workout session.
     */
    public func endSession(notifyPhone: Bool = true) {
        workoutState.isSessionActive = false
        stopLocalRestTimer()
        WatchWorkoutManager.shared.endWorkout()
        WatchHapticManager.shared.playSuccessKnock()

        if notifyPhone {
            let payload: [String: Any] = [
                "type": "endWorkout",
                "timestamp": ISO8601DateFormatter().string(from: Date())
            ]
            sendToPhone(payload)
        }
    }

    private func parseWorkoutState(_ dict: [String: Any]) {
        let isActive = dict["isSessionActive"] as? Bool ?? true
        let workoutId = dict["workoutId"] as? String ?? ""
        if !isActive && (workoutId.isEmpty || workoutId == "idle") {
            self.endSession(notifyPhone: false)
            return
        }

        let effectiveWorkoutId = workoutId.isEmpty ? "active-session" : workoutId
        let dayNumber = dict["dayNumber"] as? Int ?? 1
        let focus = dict["focus"] as? String ?? "Strength & Conditioning"
        let activePhase = dict["activePhase"] as? String ?? "resistance"
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
                        completedSetsCount: doneSets
                    )
                )
            }
        }

        // Active exercise
        var activeEx: WatchExerciseInfo? = nil
        if let exDict = dict["activeExercise"] as? [String: Any] {
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
                completedSetsCount: exDict["completedSetsCount"] as? Int ?? 0
            )
        } else if !parsedExercises.isEmpty {
            let safeIdx = min(max(0, activeExIndex), parsedExercises.count - 1)
            activeEx = parsedExercises[safeIdx]
        }

        // Parse Cardio Protocol
        var parsedCardio: WatchCardioProtocol? = nil
        if let cDict = dict["cardioProtocol"] as? [String: Any] {
            parsedCardio = WatchCardioProtocol(
                modality: cDict["modality"] as? String ?? "Cardio Zone 2",
                durationMins: cDict["durationMins"] as? Int ?? 20,
                targetZone: cDict["targetZone"] as? Int ?? 2,
                targetBpmMin: cDict["targetBpmMin"] as? Int ?? 125,
                targetBpmMax: cDict["targetBpmMax"] as? Int ?? 142
            )
        }

        // Parse Warmup Drills
        var parsedWarmups: [WatchWarmupDrill] = []
        if let wArray = dict["warmupDrills"] as? [[String: Any]] {
            for w in wArray {
                parsedWarmups.append(
                    WatchWarmupDrill(
                        name: w["name"] as? String ?? "Warmup Drill",
                        phaseLabel: w["phaseLabel"] as? String ?? "WARM-UP",
                        durationSec: w["durationSec"] as? Int ?? 30,
                        protocolText: w["protocol"] as? String ?? "1 set × 30s",
                        isCompleted: w["isCompleted"] as? Bool ?? false
                    )
                )
            }
        }
        if parsedWarmups.isEmpty {
            parsedWarmups = [
                WatchWarmupDrill(name: "Foam Rolling SMR", phaseLabel: "1. INHIBIT", durationSec: 60, protocolText: "Static pressure on tight trigger points"),
                WatchWarmupDrill(name: "Dynamic Arm & Hip Swings", phaseLabel: "2. LENGTHEN", durationSec: 30, protocolText: "2 sets × 10 reps"),
                WatchWarmupDrill(name: "Core Bridge / Plank", phaseLabel: "3. ACTIVATE", durationSec: 45, protocolText: "1 set × 45s hold")
            ]
        }

        // Parse Cooldown Stretches
        var parsedCooldowns: [WatchCooldownStretch] = []
        if let cdArray = dict["cooldownStretches"] as? [[String: Any]] {
            for cd in cdArray {
                parsedCooldowns.append(
                    WatchCooldownStretch(
                        name: cd["name"] as? String ?? "Static Stretch",
                        durationSec: cd["durationSec"] as? Int ?? 30,
                        protocolText: cd["protocol"] as? String ?? "Hold for 30s",
                        isCompleted: cd["isCompleted"] as? Bool ?? false
                    )
                )
            }
        }
        if parsedCooldowns.isEmpty {
            parsedCooldowns = [
                WatchCooldownStretch(name: "Static Kneeling Hip Flexor Stretch", durationSec: 30, protocolText: "Hold 30s per side"),
                WatchCooldownStretch(name: "Doorway Pectoral Stretch", durationSec: 30, protocolText: "Hold 30s"),
                WatchCooldownStretch(name: "Diaphragmatic Parasympathetic Reset", durationSec: 60, protocolText: "4-7-8 breathing tempo")
            ]
        }

        self.workoutState = WatchWorkoutState(
            workoutId: effectiveWorkoutId,
            dayNumber: dayNumber,
            focus: focus,
            activePhase: activePhase,
            activeExerciseIndex: activeExIndex,
            activeExercise: activeEx,
            exercises: parsedExercises.isEmpty && activeEx != nil ? [activeEx!] : parsedExercises,
            warmupDrills: parsedWarmups,
            cooldownStretches: parsedCooldowns,
            cardioProtocol: parsedCardio,
            completedSetsCount: completed,
            totalSetsCount: total,
            isSessionActive: isActive,
            startedAt: ISO8601DateFormatter().string(from: Date())
        )

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
