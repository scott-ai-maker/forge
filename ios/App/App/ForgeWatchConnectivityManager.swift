import Foundation
import WatchConnectivity
import HealthKit

/**
 * ForgeWatchConnectivityManager
 * iOS Companion Coordinator for Apple Watch Bi-Directional Synchronization
 * Forge Athletic
 */
@objc public class ForgeWatchConnectivityManager: NSObject, WCSessionDelegate {
    @objc public static let shared = ForgeWatchConnectivityManager()

    // Callbacks for incoming Watch events to be notified to the Capacitor web layer
    public var onSetLoggedFromWatch: (([String: Any]) -> Void)?
    public var onRestActionFromWatch: (([String: Any]) -> Void)?
    public var onHeartRateFromWatch: ((Int, String) -> Void)?
    public var onHeartRateTelemetryFromWatch: (([String: Any]) -> Void)?
    public var onWatchSessionStateChanged: ((Bool) -> Void)?
    public var onWatchSyncDiagnosticsChanged: (([String: Any]) -> Void)?
    public var onEndWorkoutFromWatch: (() -> Void)?
    public var onCancelWorkoutFromWatch: (() -> Void)?
    public var onExerciseSelectedFromWatch: ((String) -> Void)?
    public var onPhaseSelectedFromWatch: ((String) -> Void)?
    public var onStartWorkoutFromWatch: (([String: Any]) -> Void)?
    public var onWarmupDrillToggledFromWatch: (([String: Any]) -> Void)?
    public var onCooldownStretchToggledFromWatch: (([String: Any]) -> Void)?
    public var onCardioCompletedFromWatch: (([String: Any]) -> Void)?
    public var onRpeUpdatedFromWatch: (([String: Any]) -> Void)?
    public var onCameraRemoteCommandFromWatch: (([String: Any]) -> Void)?
    public var onExpressModeToggledFromWatch: (([String: Any]) -> Void)?
    public var onWarmupBatchActionFromWatch: (([String: Any]) -> Void)?
    public var onDeskResetCompletedFromWatch: (([String: Any]) -> Void)?
    public var onJointComfortLoggedFromWatch: (([String: Any]) -> Void)?

    // Persisted diagnostic state for ?debug=telemetry Watch Sync Status pill
    private let kLastWatchTelemetryKey = "Forge_Watch_LastTelemetryTimestamp"
    private let kLastWatchEventTypeKey = "Forge_Watch_LastEventType"
    private(set) public var lastWatchTelemetryTimestamp: String?
    private(set) public var lastWatchEventType: String?
    private(set) public var lastHeartRateBpm: Int?
    private var cachedApplicationContext: [String: Any] = [:]

    private override init() {
        super.init()
        self.lastWatchTelemetryTimestamp = UserDefaults.standard.string(forKey: kLastWatchTelemetryKey)
        self.lastWatchEventType = UserDefaults.standard.string(forKey: kLastWatchEventTypeKey)
    }

    private func recordWatchTelemetryActivity(eventType: String, explicitTimestamp: String? = nil) {
        let ts = explicitTimestamp ?? ISO8601DateFormatter().string(from: Date())
        self.lastWatchTelemetryTimestamp = ts
        self.lastWatchEventType = eventType
        UserDefaults.standard.set(ts, forKey: kLastWatchTelemetryKey)
        UserDefaults.standard.set(eventType, forKey: kLastWatchEventTypeKey)
    }

    @objc public func getSyncDiagnostics() -> [String: Any] {
        guard WCSession.isSupported() else {
            return [
                "supported": false,
                "activationState": "unsupported",
                "activationStateRaw": -1,
                "paired": false,
                "installed": false,
                "reachable": false,
                "outstandingTransfers": 0,
                "lastWatchTelemetryTimestamp": lastWatchTelemetryTimestamp ?? NSNull(),
                "lastWatchEventType": lastWatchEventType ?? NSNull(),
                "lastHeartRateBpm": lastHeartRateBpm ?? NSNull()
            ]
        }

        let session = WCSession.default
        let stateLabel: String
        switch session.activationState {
        case .activated:
            stateLabel = "activated"
        case .inactive:
            stateLabel = "inactive"
        case .notActivated:
            stateLabel = "notActivated"
        @unknown default:
            stateLabel = "notActivated"
        }

        let paired = session.activationState == .activated ? session.isPaired : false
        let installed = session.activationState == .activated ? session.isWatchAppInstalled : false
        let reachable = session.activationState == .activated ? session.isReachable : false

        return [
            "supported": true,
            "activationState": stateLabel,
            "activationStateRaw": session.activationState.rawValue,
            "paired": paired,
            "installed": installed,
            "reachable": reachable,
            "outstandingTransfers": session.outstandingUserInfoTransfers.count,
            "lastWatchTelemetryTimestamp": lastWatchTelemetryTimestamp ?? NSNull(),
            "lastWatchEventType": lastWatchEventType ?? NSNull(),
            "lastHeartRateBpm": lastHeartRateBpm ?? NSNull()
        ]
    }

    public func activate() {
        guard WCSession.isSupported() else {
            print("[Forge Watch] WCSession is not supported on this device.")
            return
        }
        let session = WCSession.default
        session.delegate = self
        session.activate()
        print("[Forge Watch] WCSession activating on iOS.")
    }

    public var isWatchPaired: Bool {
        guard WCSession.isSupported() else { return false }
        return WCSession.default.isPaired
    }

    public var isWatchAppInstalled: Bool {
        guard WCSession.isSupported() else { return false }
        let session = WCSession.default
        return session.activationState == .activated && session.isWatchAppInstalled
    }

    // MARK: - Outbound Payloads (iOS -> Apple Watch)

    private func updateMergedApplicationContext(with additions: [String: Any], session: WCSession) {
        var context = cachedApplicationContext
        for (k, v) in session.applicationContext {
            context[k] = v
        }
        for (k, v) in additions {
            context[k] = v
        }
        cachedApplicationContext = context
        do {
            try session.updateApplicationContext(context)
        } catch {
            print("[Forge Watch] Error updating merged application context: \(error.localizedDescription)")
        }
    }

    /**
     * Pushes current workout metadata and the active exercise set to Apple Watch.
     */
    @objc public func sendWorkoutState(workoutData: [String: Any]) {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        guard session.activationState == .activated else { return }

        let nowIso = ISO8601DateFormatter().string(from: Date())
        let payload: [String: Any] = [
            "type": "workoutState",
            "workout": workoutData,
            "timestamp": nowIso
        ]

        // 1. Guaranteed background application context transfer (preserving cnsReadiness / companionSummary)
        updateMergedApplicationContext(with: [
            "workout": workoutData,
            "timestamp": nowIso
        ], session: session)

        // 2. High-priority instant message if watch is currently reachable
        if session.isReachable {
            session.sendMessage(payload, replyHandler: nil) { err in
                print("[Forge Watch] Notice sending instant message: \(err.localizedDescription)")
            }
        }

        // 3. Queue guaranteed background transferUserInfo (reliable across watch app launches)
        session.transferUserInfo(payload)
    }

    /**
     * Pushes live Wrist Camera Remote state (Quick Posture, Readiness Check, Desk Audit, Form Lab)
     * so the Watch automatically surfaces Framing... -> Locked · Emerald + Start 5s Timer / Stop & Review.
     */
    @objc public func sendCameraRemoteState(cameraData: [String: Any]) {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        guard session.activationState == .activated else { return }

        let nowIso = ISO8601DateFormatter().string(from: Date())
        let payload: [String: Any] = [
            "type": "cameraRemoteState",
            "cameraRemote": cameraData,
            "timestamp": nowIso
        ]

        updateMergedApplicationContext(with: [
            "cameraRemote": cameraData,
            "timestamp": nowIso
        ], session: session)

        if session.isReachable {
            session.sendMessage(payload, replyHandler: nil) { err in
                print("[Forge Watch] Notice sending cameraRemoteState: \(err.localizedDescription)")
            }
        }
    }

    /**
     * Pushes OPT Phase, Daily Streak, Joint Comfort Score, and Ergonomic Flags to Watch complications & Smart Stack.
     */
    @objc public func sendCompanionSummary(summaryData: [String: Any]) {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        guard session.activationState == .activated else { return }

        let nowIso = ISO8601DateFormatter().string(from: Date())
        let payload: [String: Any] = [
            "type": "companionSummary",
            "companionSummary": summaryData,
            "timestamp": nowIso
        ]

        updateMergedApplicationContext(with: [
            "companionSummary": summaryData,
            "timestamp": nowIso
        ], session: session)

        if session.isReachable {
            session.sendMessage(payload, replyHandler: nil, errorHandler: nil)
        }
    }

    /**
     * Wakes & launches the companion Apple Watch application via HealthKit startWatchApp(with:)
     * when the athlete taps Start Workout on their iPhone.
     */
    @objc public func launchWatchAppForActiveWorkout(workoutData: [String: Any]) {
        guard HKHealthStore.isHealthDataAvailable() else {
            print("[Forge Watch] Health data is unavailable on this device.")
            return
        }

        let config = HKWorkoutConfiguration()
        let activePhase = (workoutData["activePhase"] as? String)?.lowercased() ?? "warmup"

        switch activePhase {
        case "cardio":
            config.activityType = .highIntensityIntervalTraining
        case "cooldown", "desk_reset":
            config.activityType = .flexibility
        default:
            config.activityType = .traditionalStrengthTraining
        }
        config.locationType = .indoor

        let healthStore = GAAHealthSyncManager.shared.healthStore
        healthStore.startWatchApp(with: config) { success, error in
            if let error = error {
                print("[Forge Watch] Failed launching watch app via startWatchApp: \(error.localizedDescription)")
            } else {
                print("[Forge Watch] startWatchApp successfully requested (success=\(success))")
            }
        }
    }

    /**
     * Broadcasts real-time rest timer countdown ticks and bio-adaptive pacer states to Apple Watch.
     */
    @objc public func sendRestTimerUpdate(restData: [String: Any]) {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        guard session.activationState == .activated && session.isReachable else { return }

        let payload: [String: Any] = [
            "type": "restTimer",
            "restTimer": restData,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]

        session.sendMessage(payload, replyHandler: nil, errorHandler: nil)
    }

    /**
     * Pushes daily CNS Readiness score & autonomic recovery metrics to Apple Watch complications.
     */
    @objc public func sendCnsReadiness(score: Int, rhr: Int, hrv: Int) {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        guard session.activationState == .activated else { return }

        updateMergedApplicationContext(with: [
            "cnsReadiness": [
                "score": score,
                "rhr": rhr,
                "hrv": hrv,
                "date": ISO8601DateFormatter().string(from: Date())
            ]
        ], session: session)
    }

    // MARK: - WCSessionDelegate (Incoming Messages from Apple Watch)

    public func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error = error {
            print("[Forge Watch] Activation completed with error: \(error.localizedDescription)")
        } else {
            print("[Forge Watch] Activation completed with state: \(activationState.rawValue)")
        }
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.onWatchSessionStateChanged?(session.isWatchAppInstalled)
            self.onWatchSyncDiagnosticsChanged?(self.getSyncDiagnostics())
        }
    }

    public func sessionDidBecomeInactive(_ session: WCSession) {
        print("[Forge Watch] WCSession did become inactive.")
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.onWatchSyncDiagnosticsChanged?(self.getSyncDiagnostics())
        }
    }

    public func sessionDidDeactivate(_ session: WCSession) {
        print("[Forge Watch] WCSession did deactivate. Reactivating...")
        WCSession.default.activate()
    }

    public func sessionWatchStateDidChange(_ session: WCSession) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.onWatchSessionStateChanged?(session.isWatchAppInstalled)
            self.onWatchSyncDiagnosticsChanged?(self.getSyncDiagnostics())
        }
    }

    public func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.onWatchSyncDiagnosticsChanged?(self.getSyncDiagnostics())
        }
    }

    public func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        handleIncomingWatchMessage(message)
    }

    public func session(_ session: WCSession, didReceiveUserInfo userInfo: [String : Any] = [:]) {
        handleIncomingWatchMessage(userInfo)
    }

    public func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String : Any]) {
        handleIncomingWatchMessage(applicationContext)
    }

    private func handleIncomingWatchMessage(_ dict: [String: Any]) {
        guard let type = dict["type"] as? String else { return }

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            let incomingTs = (dict["timestamp"] as? String)
                ?? (dict["loggedAt"] as? String)
                ?? (dict["completedAt"] as? String)
            self.recordWatchTelemetryActivity(eventType: type, explicitTimestamp: incomingTs)

            switch type {
            case "setLogged":
                if let setData = dict["setData"] as? [String: Any] {
                    self.onSetLoggedFromWatch?(setData)
                } else {
                    self.onSetLoggedFromWatch?(dict)
                }

            case "rpeUpdated":
                self.onRpeUpdatedFromWatch?(dict)

            case "restAction":
                self.onRestActionFromWatch?(dict)

            case "liveHeartRate":
                if let bpm = dict["bpm"] as? Int {
                    let ts = (dict["timestamp"] as? String) ?? ISO8601DateFormatter().string(from: Date())
                    self.lastHeartRateBpm = bpm
                    self.onHeartRateFromWatch?(bpm, ts)
                    self.onHeartRateTelemetryFromWatch?([
                        "heartRate": bpm,
                        "activeCalories": (dict["activeCalories"] as? Double) ?? 0.0,
                        "peakBpm": (dict["peakBpm"] as? Int) ?? bpm,
                        "avgBpm": (dict["avgBpm"] as? Int) ?? bpm,
                        "recoveryDeltaBpm": (dict["recoveryDeltaBpm"] as? Int) ?? 0,
                        "timestamp": ts
                    ])
                }

            case "cameraRemoteCommand":
                self.onCameraRemoteCommandFromWatch?(dict)

            case "expressModeToggled":
                self.onExpressModeToggledFromWatch?(dict)

            case "warmupBatchAction":
                self.onWarmupBatchActionFromWatch?(dict)

            case "deskResetCompleted":
                self.onDeskResetCompletedFromWatch?(dict)

            case "jointComfortLogged":
                self.onJointComfortLoggedFromWatch?(dict)

            case "endWorkout":
                self.onEndWorkoutFromWatch?()

            case "cancelWorkout":
                self.onCancelWorkoutFromWatch?()

            case "exerciseSelected":
                if let name = dict["exerciseName"] as? String {
                    self.onExerciseSelectedFromWatch?(name)
                }

            case "phaseSelected":
                if let phase = dict["phase"] as? String {
                    self.onPhaseSelectedFromWatch?(phase)
                }

            case "startWorkout":
                self.onStartWorkoutFromWatch?(dict)

            case "warmupDrillToggled":
                self.onWarmupDrillToggledFromWatch?(dict)

            case "cooldownStretchToggled":
                self.onCooldownStretchToggledFromWatch?(dict)

            case "cardioCompleted":
                self.onCardioCompletedFromWatch?(dict)

            default:
                break
            }

            self.onWatchSyncDiagnosticsChanged?(self.getSyncDiagnostics())
        }
    }
}
