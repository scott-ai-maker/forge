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
    @Published public var activeCalories: Double = 0.0
    @Published public var elapsedSeconds: Int = 0
    @Published public var currentZone: Int = 1 // 1: Recovery, 2: Aerobic, 3: Peak

    private var timer: Timer?

    private override init() {
        super.init()
    }

    public func requestPermissions(completion: @escaping (Bool) -> Void) {
        let typesToShare: Set = [
            HKQuantityType.workoutType()
        ]
        let typesToRead: Set = [
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

    public func startWorkout(activityType: HKWorkoutActivityType = .traditionalStrengthTraining) {
        guard session == nil else { return }

        let configuration = HKWorkoutConfiguration()
        configuration.activityType = activityType
        configuration.locationType = .indoor

        do {
            session = try HKWorkoutSession(healthStore: healthStore, configuration: configuration)
            builder = session?.associatedWorkoutBuilder()

            session?.delegate = self
            builder?.delegate = self
            builder?.dataSource = HKLiveWorkoutDataSource(healthStore: healthStore, workoutConfiguration: configuration)

            let startDate = Date()
            session?.startActivity(with: startDate)
            builder?.beginCollection(withStart: startDate) { [weak self] success, error in
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

    public func endWorkout(completion: (() -> Void)? = nil) {
        guard let session = session, let builder = builder else {
            isPaused = false
            completion?()
            return
        }

        isPaused = false
        stopElapsedTimer()
        session.end()
        builder.endCollection(withEnd: Date()) { [weak self] success, error in
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
                        self.updateCardioZone(bpm: bpm)

                        // Stream real-time heart rate to iPhone session coordinator
                        WatchSessionCoordinator.shared.streamLiveHeartRate(bpm: bpm)
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
