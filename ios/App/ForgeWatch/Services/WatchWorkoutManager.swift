import Foundation
import HealthKit
import Combine

/**
 * WatchWorkoutManager
 * Manages native watchOS HKWorkoutSession and HKLiveWorkoutBuilder for continuous
 * high-frequency biometric sampling and active calorie accumulation.
 * Forge Athletic
 */
public final class WatchWorkoutManager: NSObject, ObservableObject, HKWorkoutSessionDelegate, HKLiveWorkoutBuilderDelegate {
    public static let shared = WatchWorkoutManager()

    public let healthStore = HKHealthStore()
    private var session: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?

    @Published public var isWorkoutActive: Bool = false
    @Published public var currentHeartRate: Int = 0
    @Published public var peakHeartRate: Int = 0
    @Published public var averageHeartRate: Int = 0
    @Published public var recoveryDeltaBpm: Int = 0
    @Published public var activeCalories: Double = 0.0
    @Published public var elapsedSeconds: Int = 0
    @Published public var currentZone: Int = 1 // 1: Recovery, 2: Aerobic, 3: Peak
    @Published public var activeSessionKind: String = "strength"

    private var timer: Timer?
    private var hrSampleSum: Int = 0
    private var hrSampleCount: Int = 0
    private var activeWorkoutIdentifier: String = "active-session"

    private override init() {
        super.init()
    }

    public func requestPermissions(completion: @escaping (Bool) -> Void) {
        var typesToShare: Set<HKSampleType> = [
            HKObjectType.workoutType()
        ]
        if let activeEnergy = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) {
            typesToShare.insert(activeEnergy)
        }
        let typesToRead: Set<HKObjectType> = [
            HKObjectType.workoutType(),
            HKQuantityType.quantityType(forIdentifier: .heartRate)!,
            HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!,
            HKQuantityType.quantityType(forIdentifier: .restingHeartRate)!,
            HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!
        ]

        healthStore.requestAuthorization(toShare: typesToShare, read: typesToRead) { success, _ in
            DispatchQueue.main.async {
                completion(success)
            }
        }
    }

    public func startWorkout(
        activityType: HKWorkoutActivityType = .traditionalStrengthTraining,
        workoutId: String = "active-session",
        sessionKind: String = "strength"
    ) {
        guard session == nil else { return }

        let configuration = HKWorkoutConfiguration()
        configuration.activityType = activityType
        configuration.locationType = .indoor

        activeWorkoutIdentifier = workoutId
        activeSessionKind = sessionKind
        peakHeartRate = 0
        averageHeartRate = 0
        recoveryDeltaBpm = 0
        hrSampleSum = 0
        hrSampleCount = 0

        do {
            session = try HKWorkoutSession(healthStore: healthStore, configuration: configuration)
            builder = session?.associatedWorkoutBuilder()

            session?.delegate = self
            builder?.delegate = self
            builder?.dataSource = HKLiveWorkoutDataSource(healthStore: healthStore, workoutConfiguration: configuration)

            let startDate = Date()
            let metadata: [String: Any] = [
                HKMetadataKeyIndoorWorkout: true,
                HKMetadataKeyExternalUUID: "\(workoutId)-\(Int(startDate.timeIntervalSince1970))",
                "ForgeAthletic_Source": "watchOS",
                "ForgeAthletic_WorkoutID": workoutId,
                "ForgeAthletic_SessionKind": sessionKind
            ]
            builder?.addMetadata(metadata) { _, _ in }

            session?.startActivity(with: startDate)
            builder?.beginCollection(withStart: startDate) { [weak self] success, _ in
                DispatchQueue.main.async {
                    if success {
                        self?.isWorkoutActive = true
                        self?.startElapsedTimer()
                    }
                }
            }
        } catch {
            print("[Forge Watch] Error starting HKWorkoutSession: \(error.localizedDescription)")
        }
    }

    @Published public var isPaused: Bool = false

    public func pauseWorkout() {
        session?.pause()
        isPaused = true
        stopElapsedTimer()
    }

    public func resumeWorkout() {
        session?.resume()
        isPaused = false
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            DispatchQueue.main.async {
                self?.elapsedSeconds += 1
            }
        }
    }

    /**
     * Completes and saves the workout session to Apple Health store.
     */
    public func endWorkout(completion: (() -> Void)? = nil) {
        finishWorkout(completion: completion)
    }

    public func finishWorkout(completion: (() -> Void)? = nil) {
        guard let session = session, let builder = builder else {
            isPaused = false
            completion?()
            return
        }

        isPaused = false
        stopElapsedTimer()
        let finishMetadata: [String: Any] = [
            "ForgeAthletic_Source": "watchOS",
            "ForgeAthletic_WorkoutID": activeWorkoutIdentifier,
            "ForgeAthletic_SessionKind": activeSessionKind,
            "ForgeAthletic_PeakBPM": peakHeartRate,
            "ForgeAthletic_AvgBPM": averageHeartRate
        ]
        builder.addMetadata(finishMetadata) { _, _ in }
        session.end()
        builder.endCollection(withEnd: Date()) { [weak self] _, _ in
            builder.finishWorkout { _, _ in
                DispatchQueue.main.async {
                    self?.isWorkoutActive = false
                    self?.isPaused = false
                    self?.session = nil
                    self?.builder = nil
                    completion?()
                }
            }
        }
    }

    /**
     * Cancels/discards the workout session.
     * Instructs HKLiveWorkoutBuilder to discard all collected telemetry so NOTHING is saved to Apple Health.
     */
    public func discardWorkout(completion: (() -> Void)? = nil) {
        guard let session = session, let builder = builder else {
            isPaused = false
            isWorkoutActive = false
            stopElapsedTimer()
            completion?()
            return
        }

        isPaused = false
        stopElapsedTimer()
        session.end()
        builder.discardWorkout()
        DispatchQueue.main.async { [weak self] in
            self?.isWorkoutActive = false
            self?.isPaused = false
            self?.session = nil
            self?.builder = nil
            completion?()
        }
    }

    private func startElapsedTimer() {
        timer?.invalidate()
        elapsedSeconds = 0
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            DispatchQueue.main.async {
                self?.elapsedSeconds += 1
            }
        }
    }

    private func stopElapsedTimer() {
        timer?.invalidate()
        timer = nil
    }

    // MARK: - HKWorkoutSessionDelegate

    public func workoutSession(_ workoutSession: HKWorkoutSession, didChangeTo toState: HKWorkoutSessionState, from fromState: HKWorkoutSessionState, date: Date) {
        DispatchQueue.main.async {
            self.isWorkoutActive = (toState == .running || toState == .paused)
            self.isPaused = (toState == .paused)
        }
    }

    public func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
        print("[Forge Watch] HKWorkoutSession failed: \(error.localizedDescription)")
    }

    // MARK: - HKLiveWorkoutBuilderDelegate

    public func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}

    public func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf collectedTypes: Set<HKSampleType>) {
        for type in collectedTypes {
            guard let quantityType = type as? HKQuantityType else { continue }

            DispatchQueue.main.async {
                // Heart Rate
                if quantityType == HKQuantityType.quantityType(forIdentifier: .heartRate) {
                    let statistics = workoutBuilder.statistics(for: quantityType)
                    if let sample = statistics?.mostRecentQuantity() {
                        let bpm = Int(round(sample.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))))
                        self.currentHeartRate = bpm
                        if bpm > self.peakHeartRate {
                            self.peakHeartRate = bpm
                        }
                        if bpm > 0 {
                            self.hrSampleSum += bpm
                            self.hrSampleCount += 1
                            self.averageHeartRate = Int(round(Double(self.hrSampleSum) / Double(max(1, self.hrSampleCount))))
                            self.recoveryDeltaBpm = max(0, self.peakHeartRate - bpm)
                        }
                        self.updateCardioZone(bpm: bpm)

                        // Stream real-time heart rate + session recovery metrics to iPhone session coordinator
                        WatchSessionCoordinator.shared.streamLiveHeartRate(
                            bpm: bpm,
                            activeCalories: self.activeCalories,
                            peakBpm: self.peakHeartRate,
                            avgBpm: self.averageHeartRate,
                            recoveryDeltaBpm: self.recoveryDeltaBpm
                        )
                    }
                }

                // Active Energy Burned
                if quantityType == HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) {
                    let statistics = workoutBuilder.statistics(for: quantityType)
                    if let sum = statistics?.sumQuantity() {
                        let kcal = sum.doubleValue(for: .kilocalorie())
                        self.activeCalories = round(kcal * 10) / 10
                    }
                }
            }
        }
    }

    private func updateCardioZone(bpm: Int) {
        let maxHr = 185.0 // Tanaka formula baseline for active adult
        let percent = Double(bpm) / maxHr
        let newZone: Int
        if percent < 0.65 {
            newZone = 1 // Recovery
        } else if percent < 0.85 {
            newZone = 2 // Aerobic / Lactate Threshold
        } else {
            newZone = 3 // Peak Anaerobic
        }

        if newZone != self.currentZone {
            self.currentZone = newZone
            WatchHapticManager.shared.playCardioZoneBoundary(zone: newZone)
        }
    }
}
