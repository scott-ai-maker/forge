import Foundation
import HealthKit
import Security
import UIKit

/**
 * GAAHealthSyncManager
 * Native HealthKit Background Delivery & Biometric Telemetry Coordinator
 * Forge Athletic
 */
@objc public class GAAHealthSyncManager: NSObject {
    @objc public static let shared = GAAHealthSyncManager()

    public let healthStore = HKHealthStore()
    private var isObserversRegistered = false
    private var isBackgroundDeliveryEnabled = false
    private var observerQueries: [HKObserverQuery] = []
    
    // UserDefaults Keys (non-secret configuration only; authToken lives exclusively in iOS Keychain)
    private let defaults = UserDefaults.standard
    private let kBackendUrlKey = "GAA_HealthKit_BackendUrl"
    private let kBackendBaseUrlKey = "GAA_HealthKit_BackendBaseUrl"
    private let kLegacyAuthTokenKey = "GAA_HealthKit_AuthToken"
    private let kUserIdKey = "GAA_HealthKit_UserId"

    // Keychain Identifiers
    private let kKeychainService = "com.forgeathletic.healthkit.auth"
    private let kKeychainAccount = "bearer_auth_token"

    // Pinned HTTPS Backend Origins (never plaintext http:// or arbitrary third-party domains)
    private static let allowedHosts: Set<String> = [
        "forge-athletic.app",
        "www.forge-athletic.app"
    ]
    
    public static let defaultBaseUrl = "https://forge-athletic.app"
    public static let defaultEndpoint = "https://forge-athletic.app/api/wearables/sync"

    // Configuration
    public var backendUrl: String = GAAHealthSyncManager.defaultEndpoint
    public var authToken: String? = nil
    public var currentUserId: String? = nil
    
    // Notification callback for when fresh data is ingested
    public var onTelemetryUpdated: (([String: Any]) -> Void)?

    private override init() {
        super.init()
        let savedUrl = defaults.string(forKey: kBackendUrlKey)
        self.backendUrl = sanitizeUrl(savedUrl ?? GAAHealthSyncManager.defaultEndpoint)
        self.currentUserId = defaults.string(forKey: kUserIdKey)

        // Migrate and purge any legacy plaintext UserDefaults token into Keychain
        if let legacyToken = defaults.string(forKey: kLegacyAuthTokenKey), !legacyToken.isEmpty {
            saveTokenToKeychain(legacyToken)
            defaults.removeObject(forKey: kLegacyAuthTokenKey)
        } else {
            defaults.removeObject(forKey: kLegacyAuthTokenKey)
        }
        self.authToken = readTokenFromKeychain()
    }

    private let syncLock = DispatchQueue(label: "com.gordonathletic.healthkit.syncLock")

    // MARK: - Keychain Secure Token Storage (OWASP MASVS-STORAGE)

    private func saveTokenToKeychain(_ token: String) {
        deleteTokenFromKeychain()
        guard let data = token.data(using: .utf8) else { return }
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: kKeychainService,
            kSecAttrAccount as String: kKeychainAccount,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]
        SecItemAdd(query as CFDictionary, nil)
    }

    private func readTokenFromKeychain() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: kKeychainService,
            kSecAttrAccount as String: kKeychainAccount,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        guard status == errSecSuccess, let data = item as? Data else {
            return nil
        }
        return String(data: data, encoding: .utf8)
    }

    private func deleteTokenFromKeychain() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: kKeychainService,
            kSecAttrAccount as String: kKeychainAccount
        ]
        SecItemDelete(query as CFDictionary)
    }

    private func isAllowedHost(_ host: String) -> Bool {
        let lower = host.lowercased()
        return GAAHealthSyncManager.allowedHosts.contains(lower)
    }

    public func sanitizeUrl(_ input: String) -> String {
        let trimmed = input.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.hasPrefix("/") {
            let savedBase = defaults.string(forKey: kBackendBaseUrlKey) ?? GAAHealthSyncManager.defaultBaseUrl
            if let baseUrl = URL(string: savedBase),
               baseUrl.scheme?.lowercased() == "https",
               let baseHost = baseUrl.host,
               isAllowedHost(baseHost) {
                return "https://\(baseHost.lowercased())\(trimmed)"
            }
            return "\(GAAHealthSyncManager.defaultBaseUrl)\(trimmed)"
        }
        if let url = URL(string: trimmed),
           url.scheme?.lowercased() == "https",
           let host = url.host?.lowercased(),
           isAllowedHost(host) {
            defaults.set("https://\(host)", forKey: kBackendBaseUrlKey)
            return trimmed
        }
        return GAAHealthSyncManager.defaultEndpoint
    }

    public func updateConfiguration(endpoint: String?, token: String?, userId: String?) {
        if let token = token {
            let cleanToken = token.trimmingCharacters(in: .whitespacesAndNewlines)
            if cleanToken.isEmpty {
                self.authToken = nil
                deleteTokenFromKeychain()
            } else {
                self.authToken = cleanToken
                saveTokenToKeychain(cleanToken)
            }
            defaults.removeObject(forKey: kLegacyAuthTokenKey)
        }
        if let userId = userId {
            let cleanUid = userId.trimmingCharacters(in: .whitespacesAndNewlines)
            if cleanUid.isEmpty {
                self.currentUserId = nil
                defaults.removeObject(forKey: kUserIdKey)
            } else {
                self.currentUserId = cleanUid
                defaults.set(cleanUid, forKey: kUserIdKey)
            }
        }
        if let endpoint = endpoint, !endpoint.isEmpty {
            let sanitized = sanitizeUrl(endpoint)
            self.backendUrl = sanitized
            defaults.set(sanitized, forKey: kBackendUrlKey)
        }
    }

    /**
     * Purges Keychain credentials, stops active HKObserverQuery instances, and disables
     * HealthKit background delivery immediately upon user sign-out.
     */
    public func clearSessionAndStopBackgroundSync(completion: ((Bool) -> Void)? = nil) {
        self.authToken = nil
        self.currentUserId = nil
        deleteTokenFromKeychain()
        defaults.removeObject(forKey: kLegacyAuthTokenKey)
        defaults.removeObject(forKey: kUserIdKey)

        for query in observerQueries {
            healthStore.stop(query)
        }
        observerQueries.removeAll()
        isObserversRegistered = false
        isBackgroundDeliveryEnabled = false

        guard isHealthDataAvailable() else {
            completion?(true)
            return
        }

        healthStore.disableAllBackgroundDelivery { success, _ in
            DispatchQueue.main.async {
                completion?(success)
            }
        }
    }

    // MARK: - HealthKit Types Definition
    
    public var readTypes: Set<HKObjectType> {
        var types = Set<HKObjectType>()
        
        // Quantity Types (Disclosed Autonomic Vitals & Training Workload Metrics Only — Apple Guideline 5.1.3)
        let quantityIdentifiers: [HKQuantityTypeIdentifier] = [
            .heartRate,
            .restingHeartRate,
            .heartRateVariabilitySDNN,
            .activeEnergyBurned,
            .basalEnergyBurned,
            .stepCount,
            .distanceWalkingRunning
        ]
        
        for id in quantityIdentifiers {
            if let qType = HKObjectType.quantityType(forIdentifier: id) {
                types.insert(qType)
            }
        }
        
        // Category Types (Sleep Recovery Duration & Stages)
        if let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
            types.insert(sleepType)
        }
        
        // Workout Type
        types.insert(HKObjectType.workoutType())
        
        return types
    }
    
    public var writeTypes: Set<HKSampleType> {
        var types = Set<HKSampleType>()
        types.insert(HKObjectType.workoutType())
        if let activeEnergy = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned) {
            types.insert(activeEnergy)
        }
        if let distance = HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning) {
            types.insert(distance)
        }
        return types
    }

    // MARK: - Availability & Authorization
    
    public func isHealthDataAvailable() -> Bool {
        return HKHealthStore.isHealthDataAvailable()
    }

    public func requestAuthorization(completion: @escaping (Bool, Error?) -> Void) {
        guard isHealthDataAvailable() else {
            completion(false, NSError(domain: "com.gordonathletic.healthkit", code: 1, userInfo: [NSLocalizedDescriptionKey: "HealthKit is not available on this device."]))
            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.healthStore.requestAuthorization(toShare: self.writeTypes, read: self.readTypes) { [weak self] success, error in
                if success {
                    self?.enableBackgroundDelivery { _, bgError in
                        if let bgError = bgError {
                            print("[Forge HealthKit] Background delivery warning: \(bgError.localizedDescription)")
                        } else {
                            print("[Forge HealthKit] Background delivery enabled successfully.")
                        }
                    }
                    self?.registerBackgroundObservers()
                }
                DispatchQueue.main.async {
                    completion(success, error)
                }
            }
        }
    }

    // MARK: - Native Background Delivery Setup
    
    public func enableBackgroundDelivery(completion: @escaping (Bool, Error?) -> Void) {
        guard isHealthDataAvailable() else {
            completion(false, nil)
            return
        }

        let bgIdentifiers: [HKQuantityTypeIdentifier] = [
            .restingHeartRate,
            .heartRateVariabilitySDNN,
            .activeEnergyBurned,
            .stepCount
        ]

        let group = DispatchGroup()
        var overallError: Error?

        for id in bgIdentifiers {
            if let sampleType = HKObjectType.quantityType(forIdentifier: id) {
                group.enter()
                healthStore.enableBackgroundDelivery(for: sampleType, frequency: .immediate) { success, error in
                    if let error = error {
                        overallError = error
                    }
                    group.leave()
                }
            }
        }

        if let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
            group.enter()
            healthStore.enableBackgroundDelivery(for: sleepType, frequency: .immediate) { success, error in
                if let error = error {
                    overallError = error
                }
                group.leave()
            }
        }

        group.enter()
        healthStore.enableBackgroundDelivery(for: HKObjectType.workoutType(), frequency: .immediate) { success, error in
            if let error = error {
                overallError = error
            }
            group.leave()
        }

        group.notify(queue: .main) { [weak self] in
            let success = (overallError == nil)
            self?.isBackgroundDeliveryEnabled = success
            completion(success, overallError)
        }
    }

    // MARK: - Register Background Observers (Called on App Launch)
    
    public func registerBackgroundObservers() {
        guard isHealthDataAvailable() else { return }
        if isObserversRegistered { return }
        isObserversRegistered = true

        let observedIdentifiers: [HKQuantityTypeIdentifier] = [
            .restingHeartRate,
            .heartRateVariabilitySDNN,
            .stepCount,
            .activeEnergyBurned
        ]

        var sampleTypesToObserve: [HKSampleType] = []
        for id in observedIdentifiers {
            if let type = HKObjectType.quantityType(forIdentifier: id) {
                sampleTypesToObserve.append(type)
            }
        }
        if let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
            sampleTypesToObserve.append(sleepType)
        }
        sampleTypesToObserve.append(HKObjectType.workoutType())

        for sampleType in sampleTypesToObserve {
            let query = HKObserverQuery(sampleType: sampleType, predicate: nil) { [weak self] query, completionHandler, error in
                guard let self = self else {
                    completionHandler()
                    return
                }

                if let error = error {
                    print("[GAA HealthKit] Observer query error for \(sampleType.identifier): \(error.localizedDescription)")
                    completionHandler()
                    return
                }

                print("[GAA HealthKit] Background update trigger received for \(sampleType.identifier)")
                
                // Execute background sync with background task assertion
                let bgTask = UIApplication.shared.beginBackgroundTask(withName: "GAA-HealthKit-BackgroundSync")
                
                self.queryLatestBiometrics { telemetry in
                    if let telemetry = telemetry {
                        self.onTelemetryUpdated?(telemetry)
                        self.syncTelemetryToBackend(telemetry: telemetry) { _ in
                            completionHandler()
                            UIApplication.shared.endBackgroundTask(bgTask)
                        }
                    } else {
                        completionHandler()
                        UIApplication.shared.endBackgroundTask(bgTask)
                    }
                }
            }

            observerQueries.append(query)
            healthStore.execute(query)
        }
        
        print("[GAA HealthKit] Registered \(observerQueries.count) background observer queries.")
    }

    // MARK: - Query Latest Biometrics & Nutrition
    
    public func queryLatestBiometrics(completion: @escaping ([String: Any]?) -> Void) {
        guard isHealthDataAvailable() else {
            completion(nil)
            return
        }

        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)
        let last24Hours = now.addingTimeInterval(-86400)
        let last7Days = now.addingTimeInterval(-7 * 86400)
        let last30Days = now.addingTimeInterval(-30 * 86400)
        
        let dayPredicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)
        let recentPredicate = HKQuery.predicateForSamples(withStart: last24Hours, end: now, options: [])
        let hrPredicate = recentPredicate
        let baseline7DaysPredicate = HKQuery.predicateForSamples(withStart: last7Days, end: now, options: [])
        let baseline30DaysPredicate = HKQuery.predicateForSamples(withStart: last30Days, end: now, options: [])

        var result: [String: Any] = [
            "provider": "apple_health",
            "date": ISO8601DateFormatter().string(from: now).components(separatedBy: "T").first ?? ""
        ]

        func setResultValue(_ key: String, _ value: Any) {
            syncLock.sync {
                result[key] = value
            }
        }

        let dispatchGroup = DispatchGroup()

        // 1. Real-time Heart Rate (Latest in 24h)
        if let hrType = HKObjectType.quantityType(forIdentifier: .heartRate) {
            dispatchGroup.enter()
            fetchLatestQuantitySample(type: hrType, predicate: hrPredicate) { sample in
                if let sample = sample {
                    let bpm = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
                    setResultValue("heart_rate", Int(round(bpm)))
                }
                dispatchGroup.leave()
            }
        }

        // 2. Resting Heart Rate (Latest in 7 days, fallback to 30 days, fallback to baseline regular HR)
        if let rhrType = HKObjectType.quantityType(forIdentifier: .restingHeartRate) {
            dispatchGroup.enter()
            fetchLatestQuantitySample(type: rhrType, predicate: baseline7DaysPredicate) { [weak self] sample in
                guard let self = self else {
                    dispatchGroup.leave()
                    return
                }
                if let sample = sample {
                    let bpm = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
                    setResultValue("resting_heart_rate", Int(round(bpm)))
                    dispatchGroup.leave()
                } else {
                    // Fallback to last 30 days
                    self.fetchLatestQuantitySample(type: rhrType, predicate: baseline30DaysPredicate) { [weak self] sample30 in
                        guard let self = self else {
                            dispatchGroup.leave()
                            return
                        }
                        if let sample30 = sample30 {
                            let bpm = sample30.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
                            setResultValue("resting_heart_rate", Int(round(bpm)))
                            dispatchGroup.leave()
                        } else if let hrType = HKObjectType.quantityType(forIdentifier: .heartRate) {
                            // If user has no resting HR recorded by Apple Watch, use latest heart rate as reference
                            self.fetchLatestQuantitySample(type: hrType, predicate: nil) { hrSample in
                                if let hrSample = hrSample {
                                    let bpm = hrSample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
                                    setResultValue("resting_heart_rate", Int(round(bpm)))
                                }
                                dispatchGroup.leave()
                            }
                        } else {
                            dispatchGroup.leave()
                        }
                    }
                }
            }
        }

        // 3. HRV (rMSSD / SDNN - Latest in 7 days, fallback to 30 days)
        if let hrvType = HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN) {
            dispatchGroup.enter()
            fetchLatestQuantitySample(type: hrvType, predicate: baseline7DaysPredicate) { [weak self] sample in
                guard let self = self else {
                    dispatchGroup.leave()
                    return
                }
                if let sample = sample {
                    let ms = sample.quantity.doubleValue(for: .secondUnit(with: .milli))
                    setResultValue("hrv_rmssd", Int(round(ms)))
                    dispatchGroup.leave()
                } else {
                    self.fetchLatestQuantitySample(type: hrvType, predicate: baseline30DaysPredicate) { sample30 in
                        if let sample30 = sample30 {
                            let ms = sample30.quantity.doubleValue(for: .secondUnit(with: .milli))
                            setResultValue("hrv_rmssd", Int(round(ms)))
                        }
                        dispatchGroup.leave()
                    }
                }
            }
        }

        // 4. Step Count (Cumulative Today)
        if let stepsType = HKObjectType.quantityType(forIdentifier: .stepCount) {
            dispatchGroup.enter()
            fetchCumulativeSum(type: stepsType, unit: .count(), predicate: dayPredicate) { sum in
                if let sum = sum {
                    setResultValue("steps", Int(sum))
                }
                dispatchGroup.leave()
            }
        }

        // 5. Active Calories (Cumulative Today)
        if let activeEnergyType = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned) {
            dispatchGroup.enter()
            fetchCumulativeSum(type: activeEnergyType, unit: .kilocalorie(), predicate: dayPredicate) { sum in
                if let sum = sum {
                    setResultValue("active_calories", Int(round(sum)))
                }
                dispatchGroup.leave()
            }
        }

        // 6. Walking & Running Distance
        if let distanceType = HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning) {
            dispatchGroup.enter()
            fetchCumulativeSum(type: distanceType, unit: .mile(), predicate: dayPredicate) { sum in
                if let sum = sum {
                    setResultValue("distance_miles", round(sum * 100) / 100)
                }
                dispatchGroup.leave()
            }
        }

        // 7. Sleep Architecture (Query past 36h to capture overnight session)
        // Note: VO2 Max and dietary nutrition queries are omitted to match disclosed App Store scopes (#42).
        if let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
            dispatchGroup.enter()
            fetchSleepAnalysis(sleepType: sleepType, start: now.addingTimeInterval(-36 * 3600), end: now) { sleepData in
                setResultValue("sleep", sleepData)
                dispatchGroup.leave()
            }
        }

        // 8. Recent Workouts
        dispatchGroup.enter()
        fetchRecentWorkouts(predicate: recentPredicate) { workouts in
            setResultValue("workouts", workouts)
            dispatchGroup.leave()
        }

        dispatchGroup.notify(queue: .main) { [weak self] in
            guard let self = self else {
                completion(result)
                return
            }
            var finalResult: [String: Any] = [:]
            self.syncLock.sync {
                finalResult = result
            }
            let effectiveUserId = self.currentUserId ?? self.defaults.string(forKey: self.kUserIdKey)
            if let uid = effectiveUserId, !uid.isEmpty {
                finalResult["client_id"] = uid
                finalResult["user_id"] = uid
            }
            completion(finalResult)
        }
    }

    // MARK: - Helper Query Methods
    
    private func fetchLatestQuantitySample(type: HKQuantityType, predicate: NSPredicate?, completion: @escaping (HKQuantitySample?) -> Void) {
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: 1, sortDescriptors: [sort]) { _, samples, _ in
            completion(samples?.first as? HKQuantitySample)
        }
        healthStore.execute(query)
    }

    private func fetchCumulativeSum(type: HKQuantityType, unit: HKUnit, predicate: NSPredicate, completion: @escaping (Double?) -> Void) {
        let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, stats, _ in
            let sum = stats?.sumQuantity()?.doubleValue(for: unit)
            completion(sum)
        }
        healthStore.execute(query)
    }

    // MARK: - Interval Merging & Sleep Calculation Helpers

    private func mergeTimeIntervals(_ intervals: [(start: Date, end: Date)]) -> [(start: Date, end: Date)] {
        guard !intervals.isEmpty else { return [] }
        let sorted = intervals.sorted { $0.start < $1.start }
        var merged: [(start: Date, end: Date)] = [sorted[0]]

        for current in sorted.dropFirst() {
            let lastIdx = merged.count - 1
            if current.start <= merged[lastIdx].end {
                if current.end > merged[lastIdx].end {
                    merged[lastIdx].end = current.end
                }
            } else {
                merged.append(current)
            }
        }
        return merged
    }

    private func totalDuration(of intervals: [(start: Date, end: Date)]) -> TimeInterval {
        let merged = mergeTimeIntervals(intervals)
        return merged.reduce(0.0) { $0 + max(0, $1.end.timeIntervalSince($1.start)) }
    }

    private func fetchSleepAnalysis(sleepType: HKCategoryType, start: Date, end: Date, completion: @escaping ([String: Any]) -> Void) {
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: [])
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
        
        let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { [weak self] _, samples, _ in
            guard let self = self else {
                completion(["total_hours": 0.0, "has_sleep_data": false])
                return
            }

            guard let allSamples = samples as? [HKCategorySample], !allSamples.isEmpty else {
                completion([
                    "total_hours": 0.0,
                    "deep_hours": 0.0,
                    "rem_hours": 0.0,
                    "light_hours": 0.0,
                    "awake_hours": 0.0,
                    "has_sleep_data": false
                ])
                return
            }

            // 1. Filter out invalid/zero-duration samples and sort chronologically
            let validSamples = allSamples
                .filter { $0.endDate > $0.startDate }
                .sorted { $0.startDate < $1.startDate }

            guard !validSamples.isEmpty else {
                completion([
                    "total_hours": 0.0,
                    "deep_hours": 0.0,
                    "rem_hours": 0.0,
                    "light_hours": 0.0,
                    "awake_hours": 0.0,
                    "has_sleep_data": false
                ])
                return
            }

            // 2. Group samples into distinct sleep sessions (gaps > 2.5 hours demarcate sessions)
            var sessions: [[HKCategorySample]] = []
            var currentSession: [HKCategorySample] = []
            var lastSampleEnd: Date?

            for sample in validSamples {
                if let lastEnd = lastSampleEnd {
                    let gap = sample.startDate.timeIntervalSince(lastEnd)
                    if gap > 2.5 * 3600 {
                        if !currentSession.isEmpty {
                            sessions.append(currentSession)
                            currentSession = []
                        }
                    }
                }
                currentSession.append(sample)
                if lastSampleEnd == nil || sample.endDate > lastSampleEnd! {
                    lastSampleEnd = sample.endDate
                }
            }
            if !currentSession.isEmpty {
                sessions.append(currentSession)
            }

            // 3. Target the primary sleep session:
            // Prefer the latest session if it represents the overnight sleep,
            // or the session with substantial sleep volume if the latest was just a brief nap.
            var targetSamples: [HKCategorySample] = validSamples
            if let lastSession = sessions.last {
                let lastSessionSpan = lastSession.last!.endDate.timeIntervalSince(lastSession.first!.startDate)
                if lastSessionSpan >= 2.5 * 3600 || sessions.count == 1 {
                    targetSamples = lastSession
                } else if sessions.count > 1 {
                    let candidateOvernight = sessions.reversed().first { session in
                        let span = session.last!.endDate.timeIntervalSince(session.first!.startDate)
                        return span >= 3.0 * 3600
                    }
                    targetSamples = candidateOvernight ?? lastSession
                }
            }

            // 4. Partition samples into distinct stage intervals
            var deepIntervals: [(start: Date, end: Date)] = []
            var remIntervals: [(start: Date, end: Date)] = []
            var coreIntervals: [(start: Date, end: Date)] = []
            var unspecifiedIntervals: [(start: Date, end: Date)] = []
            var awakeIntervals: [(start: Date, end: Date)] = []
            var inBedIntervals: [(start: Date, end: Date)] = []

            for sample in targetSamples {
                let interval = (start: sample.startDate, end: sample.endDate)
                if #available(iOS 16.0, *) {
                    switch sample.value {
                    case HKCategoryValueSleepAnalysis.asleepDeep.rawValue:
                        deepIntervals.append(interval)
                    case HKCategoryValueSleepAnalysis.asleepREM.rawValue:
                        remIntervals.append(interval)
                    case HKCategoryValueSleepAnalysis.asleepCore.rawValue:
                        coreIntervals.append(interval)
                    case HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue:
                        unspecifiedIntervals.append(interval)
                    case HKCategoryValueSleepAnalysis.awake.rawValue:
                        awakeIntervals.append(interval)
                    case HKCategoryValueSleepAnalysis.inBed.rawValue:
                        inBedIntervals.append(interval)
                    default:
                        break
                    }
                } else {
                    if sample.value == HKCategoryValueSleepAnalysis.asleep.rawValue {
                        unspecifiedIntervals.append(interval)
                    } else if sample.value == HKCategoryValueSleepAnalysis.awake.rawValue {
                        awakeIntervals.append(interval)
                    } else if sample.value == HKCategoryValueSleepAnalysis.inBed.rawValue {
                        inBedIntervals.append(interval)
                    }
                }
            }

            // 5. Calculate merged, non-overlapping stage durations
            let deepSeconds = self.totalDuration(of: deepIntervals)
            let remSeconds = self.totalDuration(of: remIntervals)
            let coreSeconds = self.totalDuration(of: coreIntervals)
            let awakeSeconds = self.totalDuration(of: awakeIntervals)
            let inBedSeconds = self.totalDuration(of: inBedIntervals)
            let unspecifiedSeconds = self.totalDuration(of: unspecifiedIntervals)

            // 6. Compute totalAsleepSeconds accurately without double-counting
            var totalAsleepSeconds: Double = 0
            let hasStageData = (deepSeconds > 0 || remSeconds > 0 || coreSeconds > 0)

            if hasStageData {
                // If Apple Watch recorded stages, asleep is the sum of deep, rem, and core
                totalAsleepSeconds = deepSeconds + remSeconds + coreSeconds
            } else if unspecifiedSeconds > 0 {
                // If only unspecified sleep was recorded (e.g. iPhone or basic tracker)
                totalAsleepSeconds = unspecifiedSeconds
            } else if inBedSeconds > 0 {
                // Fallback to in-bed time if no asleep samples recorded
                totalAsleepSeconds = inBedSeconds
            }

            let totalHours = round((totalAsleepSeconds / 3600.0) * 10) / 10
            let deepHours = round((deepSeconds / 3600.0) * 10) / 10
            let remHours = round((remSeconds / 3600.0) * 10) / 10
            let coreHours = round(((hasStageData ? coreSeconds : max(0, totalAsleepSeconds - deepSeconds - remSeconds)) / 3600.0) * 10) / 10
            let awakeHours = round((awakeSeconds / 3600.0) * 10) / 10

            // 7. Calculate Bedtime & Wake Time formatted as HH:mm
            let timeFormatter = DateFormatter()
            timeFormatter.dateFormat = "HH:mm"
            timeFormatter.timeZone = TimeZone.current

            let earliestStart = targetSamples.map(\.startDate).min()
            let latestEnd = targetSamples.map(\.endDate).max()

            let bedtimeStr = earliestStart != nil ? timeFormatter.string(from: earliestStart!) : "22:30"
            let wakeTimeStr = latestEnd != nil ? timeFormatter.string(from: latestEnd!) : "06:45"

            completion([
                "total_hours": totalHours,
                "deep_hours": deepHours,
                "rem_hours": remHours,
                "light_hours": coreHours,
                "awake_hours": awakeHours,
                "bedtime": bedtimeStr,
                "wakeTime": wakeTimeStr,
                "has_sleep_data": totalHours > 0
            ])
        }
        healthStore.execute(query)
    }

    private func fetchRecentWorkouts(predicate: NSPredicate, completion: @escaping ([[String: Any]]) -> Void) {
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let query = HKSampleQuery(sampleType: HKObjectType.workoutType(), predicate: predicate, limit: 10, sortDescriptors: [sort]) { _, samples, _ in
            guard let workouts = samples as? [HKWorkout] else {
                completion([])
                return
            }

            let mapped: [[String: Any]] = workouts.map { w in
                var item: [String: Any] = [
                    "id": w.uuid.uuidString,
                    "activity_type": "\(w.workoutActivityType.rawValue)",
                    "name": self.nameForWorkoutActivityType(w.workoutActivityType),
                    "duration_mins": Int(round(w.duration / 60.0)),
                    "completed_at": ISO8601DateFormatter().string(from: w.endDate)
                ]

                if let energy = w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) {
                    item["calories"] = Int(round(energy))
                }
                if let dist = w.totalDistance?.doubleValue(for: .mile()) {
                    item["distance_miles"] = round(dist * 100) / 100
                }

                return item
            }
            completion(mapped)
        }
        healthStore.execute(query)
    }

    private func nameForWorkoutActivityType(_ type: HKWorkoutActivityType) -> String {
        switch type {
        case .traditionalStrengthTraining, .functionalStrengthTraining:
            return "Strength Training"
        case .running:
            return "Running"
        case .walking:
            return "Walking"
        case .cycling:
            return "Cycling"
        case .rowing:
            return "Rowing"
        case .highIntensityIntervalTraining:
            return "HIIT"
        case .stairClimbing:
            return "Stair Climber"
        default:
            return "Workout"
        }
    }

    // MARK: - Real-Time Biometric Helpers

    public func getCurrentHeartRate(completion: @escaping (Int?, String?) -> Void) {
        guard isHealthDataAvailable(), let hrType = HKObjectType.quantityType(forIdentifier: .heartRate) else {
            completion(nil, nil)
            return
        }
        // Sample in the last 30 minutes
        let predicate = HKQuery.predicateForSamples(withStart: Date().addingTimeInterval(-1800), end: Date(), options: [])
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let query = HKSampleQuery(sampleType: hrType, predicate: predicate, limit: 1, sortDescriptors: [sort]) { _, samples, _ in
            if let sample = samples?.first as? HKQuantitySample {
                let bpm = Int(round(sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))))
                let iso = ISO8601DateFormatter().string(from: sample.endDate)
                completion(bpm, iso)
            } else {
                completion(nil, nil)
            }
        }
        healthStore.execute(query)
    }

    // MARK: - Save Workout to HealthKit
    
    public func saveWorkout(
        activityType: HKWorkoutActivityType,
        startDate: Date,
        endDate: Date,
        durationMinutes: Double,
        activeCaloriesKcal: Double,
        distanceMiles: Double?,
        avgHeartRate: Double? = nil,
        completion: @escaping (Bool, Error?) -> Void
    ) {
        guard isHealthDataAvailable() else {
            completion(false, NSError(domain: "com.gordonathletic.healthkit", code: 2, userInfo: [NSLocalizedDescriptionKey: "HealthKit unavailable"]))
            return
        }

        let workoutPredicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: [])

        // Deduplication window: check if our watchOS HKWorkoutSession already recorded this workout
        // with "ForgeAthletic_Source" == "watchOS" so Apple Health never double-counts sessions!
        let dedupePredicate = HKQuery.predicateForSamples(
            withStart: startDate.addingTimeInterval(-600),
            end: endDate.addingTimeInterval(600),
            options: []
        )
        var watchWorkoutAlreadySaved = false

        func finalizeWorkoutSave(effectiveCalories: Double, hrSamples: [HKSample]) {
            if watchWorkoutAlreadySaved {
                print("[Forge HealthKit] Skipping duplicate iOS HKWorkout save — watchOS HKWorkoutSession already recorded this session.")
                completion(true, nil)
                return
            }

            let energyBurned = HKQuantity(unit: .kilocalorie(), doubleValue: effectiveCalories)
            var distanceQuantity: HKQuantity? = nil
            if let distance = distanceMiles, distance > 0 {
                distanceQuantity = HKQuantity(unit: .mile(), doubleValue: distance)
            }

            var metadata: [String: Any] = [
                HKMetadataKeyIndoorWorkout: true,
                "ForgeAthletic_Source": "iOS"
            ]
            if let hr = avgHeartRate, hr > 0 {
                metadata["ForgeAthletic_AvgBPM"] = Int(round(hr))
                metadata["GAA_AverageHeartRateBpm"] = Int(round(hr))
            }

            let workout = HKWorkout(
                activityType: activityType,
                start: startDate,
                end: endDate,
                duration: durationMinutes * 60.0,
                totalEnergyBurned: energyBurned,
                totalDistance: distanceQuantity,
                metadata: metadata
            )

            self.healthStore.save(workout) { [weak self] success, error in
                guard let self = self else {
                    completion(success, error)
                    return
                }
                if success && !hrSamples.isEmpty {
                    self.healthStore.add(hrSamples, to: workout) { _, addError in
                        if let addError = addError {
                            print("[Forge HealthKit] Notice attaching HR samples to workout: \(addError.localizedDescription)")
                        }
                        completion(success, error)
                    }
                } else {
                    completion(success, error)
                }
            }
        }

        // Query existing watchOS workouts + true active energy and HR samples recorded during the workout window
        var finalCalories = activeCaloriesKcal
        var finalHrSamples: [HKSample] = []
        let dispatchGroup = DispatchGroup()

        dispatchGroup.enter()
        let existingWorkoutQuery = HKSampleQuery(
            sampleType: HKObjectType.workoutType(),
            predicate: dedupePredicate,
            limit: 10,
            sortDescriptors: nil
        ) { _, samples, _ in
            if let workouts = samples as? [HKWorkout] {
                for existing in workouts {
                    if let source = existing.metadata?["ForgeAthletic_Source"] as? String, source == "watchOS" {
                        watchWorkoutAlreadySaved = true
                        break
                    }
                }
            }
            dispatchGroup.leave()
        }
        self.healthStore.execute(existingWorkoutQuery)

        if let activeEnergyType = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned) {
            dispatchGroup.enter()
            self.fetchCumulativeSum(type: activeEnergyType, unit: .kilocalorie(), predicate: workoutPredicate) { measuredKcal in
                if let measuredKcal = measuredKcal, measuredKcal > 10.0 {
                    finalCalories = measuredKcal
                }
                dispatchGroup.leave()
            }
        }

        if let hrType = HKObjectType.quantityType(forIdentifier: .heartRate) {
            dispatchGroup.enter()
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
            let query = HKSampleQuery(sampleType: hrType, predicate: workoutPredicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, samples, _ in
                if let samples = samples as? [HKQuantitySample], !samples.isEmpty {
                    finalHrSamples = samples
                }
                dispatchGroup.leave()
            }
            self.healthStore.execute(query)
        }

        dispatchGroup.notify(queue: .main) {
            finalizeWorkoutSave(effectiveCalories: finalCalories, hrSamples: finalHrSamples)
        }
    }

    public func saveMindfulSession(
        startDate: Date,
        endDate: Date,
        durationMinutes: Double,
        completion: @escaping (Bool, Error?) -> Void
    ) {
        // Mindful session HealthKit writes are intentionally disabled to match disclosed App Store write scopes (#42).
        completion(
            false,
            NSError(
                domain: "com.forgeathletic.healthkit",
                code: 4,
                userInfo: [
                    NSLocalizedDescriptionKey:
                        "Mindful session HealthKit writes are disabled to match disclosed Apple Health scopes."
                ]
            )
        )
    }

    // MARK: - Backend Telemetry Synchronization
    
    public func syncTelemetryToBackend(telemetry: [String: Any], completion: @escaping (Bool) -> Void) {
        let targetUrl = sanitizeUrl(backendUrl)
        guard let url = URL(string: targetUrl),
              url.scheme?.lowercased() == "https",
              let host = url.host,
              isAllowedHost(host) else {
            print("[Forge HealthKit] Blocked non-HTTPS or untrusted backend URL: \(targetUrl)")
            completion(false)
            return
        }

        let effectiveUserId = currentUserId ?? defaults.string(forKey: kUserIdKey)
        let effectiveToken = authToken ?? readTokenFromKeychain()
        guard let uid = effectiveUserId, !uid.isEmpty,
              let token = effectiveToken, !token.isEmpty else {
            print("[Forge HealthKit] Skipping background sync — no authenticated session active.")
            completion(false)
            return
        }

        var payload = telemetry
        if payload["client_id"] == nil { payload["client_id"] = uid }
        if payload["user_id"] == nil { payload["user_id"] = uid }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload, options: [])
        } catch {
            print("[GAA HealthKit] Failed to serialize telemetry: \(error.localizedDescription)")
            completion(false)
            return
        }

        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("[GAA HealthKit] Sync network error: \(error.localizedDescription)")
                completion(false)
                return
            }

            if let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) {
                let nowIso = ISO8601DateFormatter().string(from: Date())
                self.defaults.set(nowIso, forKey: "GAA_HealthKit_LastSyncTimestamp")
                print("[GAA HealthKit] Background sync succeeded with status \(httpResponse.statusCode)")
                completion(true)
            } else {
                let status = (response as? HTTPURLResponse)?.statusCode ?? 0
                print("[GAA HealthKit] Background sync HTTP warning with status \(status)")
                completion(false)
            }
        }
        task.resume()
    }

    // MARK: - Diagnostics

    public func getTelemetryDiagnostics(completion: @escaping ([String: Any]) -> Void) {
        let isAuth = defaults.bool(forKey: "GAA_HealthKit_AuthorizedOnce") ||
            (healthStore.authorizationStatus(for: HKObjectType.workoutType()) == .sharingAuthorized)
        let lastSync = defaults.string(forKey: "GAA_HealthKit_LastSyncTimestamp") ?? ""
        let bgEnabled = isBackgroundDeliveryEnabled

        let diag: [String: Any] = [
            "platform": "ios",
            "healthKitAvailable": isHealthDataAvailable(),
            "authorizationStatus": isAuth ? "authorized" : "notDetermined",
            "backgroundDeliveryEnabled": bgEnabled,
            "backgroundSyncIntervalMinutes": 60,
            "backendUrl": backendUrl,
            "lastSyncTimestamp": lastSync,
            "telemetryReady": true
        ]
        completion(diag)
    }
}
