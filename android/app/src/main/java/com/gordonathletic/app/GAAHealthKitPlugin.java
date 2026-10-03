package com.gordonathletic.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * GAAHealthKitPlugin
 * Native Capacitor Bridge Plugin for Gordon Athletic Advisory on Android.
 * Compatible with GAAHealthKit iOS plugin interface for 100% web bridge parity.
 */
@CapacitorPlugin(name = "GAAHealthKit")
public class GAAHealthKitPlugin extends Plugin {

    private GAAHealthSyncManager syncManager;

    @Override
    public void load() {
        super.load();
        syncManager = GAAHealthSyncManager.getInstance(getContext());
        syncManager.setTelemetryListener(telemetry -> {
            notifyListeners("onTelemetryUpdate", telemetry);
        });
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        boolean available = syncManager.isHealthDataAvailable();
        JSObject ret = new JSObject();
        ret.put("available", available);
        ret.put("platform", "android");
        call.resolve(ret);
    }

    @PluginMethod
    public void requestAuthorization(PluginCall call) {
        syncManager.requestAuthorization((success, data, error) -> {
            if (success) {
                // Auto-enable background delivery worker if authorized
                syncManager.enableBackgroundDelivery(syncManager.getBackgroundSyncIntervalMinutes(), null);

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("authorized", true);
                call.resolve(ret);
            } else {
                call.reject(error != null ? error : "Authorization failed on Android.");
            }
        });
    }

    @PluginMethod
    public void getAuthorizationStatus(PluginCall call) {
        String status = syncManager.getAuthorizationStatus();
        JSObject ret = new JSObject();
        ret.put("authorized", "authorized".equals(status));
        ret.put("status", status);
        call.resolve(ret);
    }

    @PluginMethod
    public void enableBackgroundDelivery(PluginCall call) {
        int interval = syncManager.getBackgroundSyncIntervalMinutes();
        syncManager.enableBackgroundDelivery(interval, (success, data, error) -> {
            if (success) {
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("backgroundDeliveryEnabled", true);
                call.resolve(ret);
            } else {
                call.reject("Failed enabling background delivery: " + error);
            }
        });
    }

    @PluginMethod
    public void queryLatestBiometrics(PluginCall call) {
        syncManager.queryLatestBiometrics((success, telemetry, error) -> {
            if (success && telemetry != null) {
                call.resolve(telemetry);
            } else {
                call.reject("Unable to query Android biometrics: " + (error != null ? error : "Unknown error"));
            }
        });
    }

    @PluginMethod
    public void syncHealthData(PluginCall call) {
        String endpoint = call.getString("endpoint");
        String token = call.getString("authToken");
        String userId = call.getString("userId");

        if (endpoint != null && !endpoint.isEmpty()) {
            syncManager.setBackendUrl(endpoint);
        }
        if (token != null && !token.isEmpty()) {
            syncManager.setAuthToken(token);
        }
        if (userId != null && !userId.isEmpty()) {
            syncManager.setCurrentUserId(userId);
        }

        syncManager.queryLatestBiometrics((querySuccess, telemetry, queryError) -> {
            if (!querySuccess || telemetry == null) {
                call.reject("No telemetry data retrieved from health provider.");
                return;
            }

            syncManager.syncTelemetryToBackend(telemetry, (syncSuccess, data, syncError) -> {
                notifyListeners("onTelemetryUpdate", telemetry);
                JSObject ret = new JSObject();
                ret.put("success", syncSuccess);
                ret.put("synced", syncSuccess);
                ret.put("telemetry", telemetry);
                call.resolve(ret);
            });
        });
    }

    @PluginMethod
    public void setSyncConfiguration(PluginCall call) {
        String endpoint = call.getString("endpoint");
        String token = call.getString("authToken");
        String userId = call.getString("userId");

        if (endpoint != null) {
            syncManager.setBackendUrl(endpoint);
        }
        if (token != null) {
            syncManager.setAuthToken(token);
        }
        if (userId != null) {
            syncManager.setCurrentUserId(userId);
        }

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void writeWorkout(PluginCall call) {
        String activityType = call.getString("activityType");
        Double calories = call.getDouble("calories");
        Double durationMinutes = call.getDouble("durationMinutes");
        Double distanceMiles = call.getDouble("distanceMiles");

        if (activityType == null || calories == null || durationMinutes == null) {
            call.reject("Missing required workout parameters (activityType, calories, durationMinutes).");
            return;
        }

        syncManager.saveWorkout(activityType, calories, durationMinutes, distanceMiles, (success, data, error) -> {
            if (success) {
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } else {
                call.reject("Failed saving workout to Android health: " + error);
            }
        });
    }
}

