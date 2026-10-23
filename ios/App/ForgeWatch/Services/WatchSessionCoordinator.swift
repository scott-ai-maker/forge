import Foundation
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
        let restSecs = workoutState.activeExercise?.restSeconds ?? 60
        startLocalRestTimer(seconds: restSecs, exerciseName: exerciseName)
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
        if !isActive {
            self.endSession(notifyPhone: false)
            return
        }

        let workoutId = dict["workoutId"] as? String ?? "active-session"
        let dayNumber = dict["dayNumber"] as? Int ?? 1
        let focus = dict["focus"] as? String ?? "Strength & Conditioning"
        let completed = dict["completedSets"] as? Int ?? 0
        let total = dict["totalSets"] as? Int ?? 12

        var activeEx: WatchExerciseInfo? = nil
        if let exDict = dict["activeExercise"] as? [String: Any] {
            activeEx = WatchExerciseInfo(
                exerciseName: exDict["exerciseName"] as? String ?? "Exercise",
                setNumber: exDict["setNumber"] as? Int ?? 1,
                totalSets: exDict["totalSets"] as? Int ?? 3,
                prescribedWeight: exDict["prescribedWeight"] as? Double ?? 135.0,
                prescribedReps: exDict["prescribedReps"] as? Int ?? 10,
                targetRpe: exDict["targetRpe"] as? Double ?? 8.0,
                tempo: exDict["tempo"] as? String ?? "2-0-2-0",
                restSeconds: exDict["restSeconds"] as? Int ?? 60,
                isCompound: exDict["isCompound"] as? Bool ?? false,
                isHammerCurl: exDict["isHammerCurl"] as? Bool ?? false,
                optPhase: exDict["optPhase"] as? Int ?? 3
            )
        }

        self.workoutState = WatchWorkoutState(
            workoutId: workoutId,
            dayNumber: dayNumber,
            focus: focus,
            activeExercise: activeEx,
            completedSetsCount: completed,
            totalSetsCount: total,
            isSessionActive: true,
            startedAt: ISO8601DateFormatter().string(from: Date())
        )

        // Ensure background HKWorkoutSession is active to keep optical HR reading
        if !WatchWorkoutManager.shared.isWorkoutActive {
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
