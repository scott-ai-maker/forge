import Foundation
import Capacitor
import HealthKit

/**
 * GAAHealthKitPlugin
 * Capacitor Native Plugin for Gordon Athletic Advisory
 */
@objc(GAAHealthKitPlugin)
public class GAAHealthKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "GAAHealthKitPlugin"
    public let jsName = "GAAHealthKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestAuthorization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getAuthorizationStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "enableBackgroundDelivery", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "queryLatestBiometrics", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "syncHealthData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setSyncConfiguration", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeWorkout", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeMindfulSession", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getCurrentHeartRate", returnType: CAPPluginReturnPromise)
    ]

    override public func load() {
        super.load()
        GAAHealthSyncManager.shared.onTelemetryUpdated = { [weak self] telemetry in
            self?.notifyListeners("onTelemetryUpdate", data: telemetry)
        }
    }

    @objc public func isAvailable(_ call: CAPPluginCall) {
        let available = GAAHealthSyncManager.shared.isHealthDataAvailable()
        call.resolve([
            "available": available,
            "platform": "ios"
        ])
    }

    @objc public func requestAuthorization(_ call: CAPPluginCall) {
        GAAHealthSyncManager.shared.requestAuthorization { success, error in
            if let error = error {
                call.reject(error.localizedDescription)
            } else {
                if success {
                    UserDefaults.standard.set(true, forKey: "GAA_HealthKit_AuthorizedOnce")
                }
                call.resolve([
                    "success": success,
                    "authorized": success
                ])
            }
        }
    }

    @objc public func getAuthorizationStatus(_ call: CAPPluginCall) {
        guard GAAHealthSyncManager.shared.isHealthDataAvailable() else {
            call.resolve([
                "authorized": false,
                "status": "unavailable"
            ])
            return
        }

        let workoutStatus = GAAHealthSyncManager.shared.healthStore.authorizationStatus(for: HKObjectType.workoutType())
        let isWorkoutAuth = workoutStatus == .sharingAuthorized
        let hasAuthDefaults = UserDefaults.standard.bool(forKey: "GAA_HealthKit_AuthorizedOnce")

        let isAuth = isWorkoutAuth || hasAuthDefaults
        let statusStr = isAuth ? "authorized" : (workoutStatus == .sharingDenied ? "denied" : "notDetermined")

        call.resolve([
            "authorized": isAuth,
            "status": statusStr
        ])
    }

    @objc public func enableBackgroundDelivery(_ call: CAPPluginCall) {
        GAAHealthSyncManager.shared.enableBackgroundDelivery { success, error in
            if let error = error {
                call.reject("Failed enabling background delivery: \(error.localizedDescription)")
            } else {
                GAAHealthSyncManager.shared.registerBackgroundObservers()
                call.resolve([
                    "success": true,
                    "backgroundDeliveryEnabled": true
                ])
            }
        }
    }

    @objc public func queryLatestBiometrics(_ call: CAPPluginCall) {
        GAAHealthSyncManager.shared.queryLatestBiometrics { telemetry in
            if let telemetry = telemetry {
                call.resolve(telemetry)
            } else {
                call.reject("Unable to query Apple Health telemetry.")
            }
        }
    }

    @objc public func syncHealthData(_ call: CAPPluginCall) {
        let endpoint = call.getString("endpoint")
        let token = call.getString("authToken")
        let userId = call.getString("userId")

        GAAHealthSyncManager.shared.updateConfiguration(endpoint: endpoint, token: token, userId: userId)

        GAAHealthSyncManager.shared.queryLatestBiometrics { [weak self] telemetry in
            guard let telemetry = telemetry else {
                call.reject("No telemetry data retrieved from Apple Health.")
                return
            }

            GAAHealthSyncManager.shared.syncTelemetryToBackend(telemetry: telemetry) { success in
                self?.notifyListeners("onTelemetryUpdate", data: telemetry)
                call.resolve([
                    "success": success,
                    "synced": success,
                    "telemetry": telemetry
                ])
            }
        }
    }

    @objc public func setSyncConfiguration(_ call: CAPPluginCall) {
        let endpoint = call.getString("endpoint")
        let token = call.getString("authToken")
        let userId = call.getString("userId")

        GAAHealthSyncManager.shared.updateConfiguration(endpoint: endpoint, token: token, userId: userId)
        call.resolve(["success": true])
    }

    @objc public func writeWorkout(_ call: CAPPluginCall) {
        guard let activityTypeName = call.getString("activityType"),
              let calories = call.getDouble("calories"),
              let durationMinutes = call.getDouble("durationMinutes") else {
            call.reject("Missing required workout parameters (activityType, calories, durationMinutes).")
            return
        }

        let startDate = Date().addingTimeInterval(-durationMinutes * 60)
        let endDate = Date()
        let distance = call.getDouble("distanceMiles")
        let avgHeartRate = call.getDouble("avgHeartRate")

        let norm = activityTypeName.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)

        // Delegate mindfulness / meditation to dedicated MindfulSession category sample
        if norm == "mindfulness" || norm == "mindful" || norm == "meditation" || norm == "breathwork" {
            GAAHealthSyncManager.shared.saveMindfulSession(
                startDate: startDate,
                endDate: endDate,
                durationMinutes: durationMinutes
            ) { success, error in
                if let error = error {
                    call.reject("Failed saving mindful session to Apple Health: \(error.localizedDescription)")
                } else {
                    call.resolve(["success": success])
                }
            }
            return
        }

        let activityType: HKWorkoutActivityType
        switch norm {
        case "running", "run", "outdoor run / walk", "treadmill run", "hkworkoutactivitytyperunning":
            activityType = .running
        case "walking", "walk", "treadmill", "treadmill walk", "treadmill incline walk", "incline walk", "outdoor walk", "hkworkoutactivitytypewalking":
            activityType = .walking
        case "cycling", "bike", "stationary bike", "spin", "indoor cycling", "outdoor cycling", "hkworkoutactivitytypecycling":
            activityType = .cycling
        case "rowing", "row", "rowing machine", "hkworkoutactivitytyperowing":
            activityType = .rowing
        case "hiit", "assault bike", "air bike", "assault / air bike", "sprint intervals", "highintensityintervaltraining", "hkworkoutactivitytypehighintensityintervaltraining":
            activityType = .highIntensityIntervalTraining
        case "stairs", "stairmaster", "stairclimber", "stair climbing", "stairclimbing", "hkworkoutactivitytypestairs":
            activityType = .stairClimbing
        case "elliptical", "hkworkoutactivitytypeelliptical":
            activityType = .elliptical
        case "swimming", "swim", "pool", "hkworkoutactivitytypeswimming":
            activityType = .swimming
        case "jumprope", "jump rope", "rope", "hkworkoutactivitytypejumprope":
            activityType = .jumpRope
        case "skiing", "skierg", "ski erg", "crosscountryskiing", "hkworkoutactivitytypecrosscountryskiing":
            activityType = .crossCountrySkiing
        case "functionalstrengthtraining", "functional strength", "functional strength training", "hkworkoutactivitytypefunctionalstrengthtraining":
            activityType = .functionalStrengthTraining
        case "traditionalstrengthtraining", "strength", "weightlifting", "weights", "strength training", "hkworkoutactivitytypetraditionalstrengthtraining":
            activityType = .traditionalStrengthTraining
        case "cooldown", "flexibility", "stretching", "stretch", "hkworkoutactivitytypeflexibility", "hkworkoutactivitytypecooldown":
            activityType = .flexibility
        case "crosstraining", "cross training", "cardio", "cardiovascular", "aerobic", "aerobics", "general modality", "other", "hkworkoutactivitytypecrosstraining":
            activityType = .crossTraining
        default:
            activityType = .traditionalStrengthTraining
        }

        GAAHealthSyncManager.shared.saveWorkout(
            activityType: activityType,
            startDate: startDate,
            endDate: endDate,
            durationMinutes: durationMinutes,
            activeCaloriesKcal: calories,
            distanceMiles: distance,
            avgHeartRate: avgHeartRate
        ) { success, error in
            if let error = error {
                call.reject("Failed saving workout to Apple Health: \(error.localizedDescription)")
            } else {
                call.resolve(["success": success])
            }
        }
    }

    @objc public func getCurrentHeartRate(_ call: CAPPluginCall) {
        GAAHealthSyncManager.shared.getCurrentHeartRate { bpm, timestamp in
            if let bpm = bpm {
                call.resolve([
                    "heartRate": bpm,
                    "timestamp": timestamp ?? ""
                ])
            } else {
                call.resolve([
                    "heartRate": NSNull(),
                    "timestamp": NSNull()
                ])
            }
        }
    }

    @objc public func writeMindfulSession(_ call: CAPPluginCall) {
        guard let durationMinutes = call.getDouble("durationMinutes") else {
            call.reject("Missing required durationMinutes.")
            return
        }

        let endDate = Date()
        let startDate = Date().addingTimeInterval(-durationMinutes * 60)

        GAAHealthSyncManager.shared.saveMindfulSession(
            startDate: startDate,
            endDate: endDate,
            durationMinutes: durationMinutes
        ) { success, error in
            if let error = error {
                call.reject("Failed saving mindful session to Apple Health: \(error.localizedDescription)")
            } else {
                call.resolve(["success": success])
            }
        }
    }
}

