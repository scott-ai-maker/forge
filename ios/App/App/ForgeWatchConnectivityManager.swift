import Foundation
import WatchConnectivity

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
    public var onWatchSessionStateChanged: ((Bool) -> Void)?
    public var onEndWorkoutFromWatch: (() -> Void)?
    public var onExerciseSelectedFromWatch: ((String) -> Void)?
    public var onPhaseSelectedFromWatch: ((String) -> Void)?

    private override init() {
        super.init()
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

    /**
     * Pushes current workout metadata and the active exercise set to Apple Watch.
     */
    @objc public func sendWorkoutState(workoutData: [String: Any]) {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        guard session.activationState == .activated else { return }

        var payload: [String: Any] = [
            "type": "workoutState",
            "workout": workoutData,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]

        // 1. Guaranteed background application context transfer
        do {
            try session.updateApplicationContext(payload)
        } catch {
            print("[Forge Watch] Error updating application context: \(error.localizedDescription)")
        }

        // 2. High-priority instant message if watch is currently reachable
        if session.isReachable {
            session.sendMessage(payload, replyHandler: nil) { err in
                print("[Forge Watch] Notice sending instant message: \(err.localizedDescription)")
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

        var context = session.applicationContext
        context["cnsReadiness"] = [
            "score": score,
            "rhr": rhr,
            "hrv": hrv,
            "date": ISO8601DateFormatter().string(from: Date())
        ]

        do {
            try session.updateApplicationContext(context)
        } catch {
            print("[Forge Watch] Error syncing CNS readiness to watch: \(error.localizedDescription)")
        }
    }

    // MARK: - WCSessionDelegate (Incoming Messages from Apple Watch)

    public func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error = error {
            print("[Forge Watch] Activation completed with error: \(error.localizedDescription)")
        } else {
            print("[Forge Watch] Activation completed with state: \(activationState.rawValue)")
        }
        DispatchQueue.main.async { [weak self] in
            self?.onWatchSessionStateChanged?(session.isWatchAppInstalled)
        }
    }

    public func sessionDidBecomeInactive(_ session: WCSession) {
        print("[Forge Watch] WCSession did become inactive.")
    }

    public func sessionDidDeactivate(_ session: WCSession) {
        print("[Forge Watch] WCSession did deactivate. Reactivating...")
        WCSession.default.activate()
    }

    public func sessionWatchStateDidChange(_ session: WCSession) {
        DispatchQueue.main.async { [weak self] in
            self?.onWatchSessionStateChanged?(session.isWatchAppInstalled)
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
            switch type {
            case "setLogged":
                // Athlete completed and logged a set directly on their Apple Watch
                if let setData = dict["setData"] as? [String: Any] {
                    self?.onSetLoggedFromWatch?(setData)
                } else {
                    self?.onSetLoggedFromWatch?(dict)
                }

            case "restAction":
                // Athlete tapped 'Ready to Lift', added +15s, or skipped rest on wrist
                self?.onRestActionFromWatch?(dict)

            case "liveHeartRate":
                // Real-time optical HR stream from Apple Watch HKWorkoutSession
                if let bpm = dict["bpm"] as? Int {
                    let ts = (dict["timestamp"] as? String) ?? ISO8601DateFormatter().string(from: Date())
                    self?.onHeartRateFromWatch?(bpm, ts)
                }

            case "endWorkout":
                // Athlete tapped 'End Workout' on Apple Watch
                self?.onEndWorkoutFromWatch?()

            case "exerciseSelected":
                // Athlete selected an exercise from the watch list/stepper
                if let name = dict["exerciseName"] as? String {
                    self?.onExerciseSelectedFromWatch?(name)
                }

            case "phaseSelected":
                // Athlete selected a phase (warmup, resistance, cardio, cooldown) on watch
                if let phase = dict["phase"] as? String {
                    self?.onPhaseSelectedFromWatch?(phase)
                }

            default:
                break
            }
        }
    }
}
