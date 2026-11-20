package com.gordonathletic.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

/**
 * GAAHealthSyncManager
 * Native Health & Biometric Telemetry Coordinator for Android
 * Supporting Android Health Connect, WorkManager Background Delivery, and Direct Backend Synchronization.
 */
public class GAAHealthSyncManager {
    private static final String TAG = "GAAHealthSync";
    private static final String PREFS_NAME = "gaa_health_sync_prefs";
    private static final String KEY_BACKEND_URL = "backend_url";
    private static final String KEY_LEGACY_AUTH_TOKEN = "auth_token";
    private static final String KEY_ENCRYPTED_AUTH_TOKEN = "auth_token_aes_gcm_v1";
    private static final String KEY_USER_ID = "user_id";
    private static final String KEY_BG_ENABLED = "bg_enabled";
    private static final String KEY_BG_INTERVAL = "bg_interval_minutes";
    private static final String KEY_LAST_SYNC = "last_sync_timestamp";
    private static final String WORK_TAG_HEALTH_SYNC = "gaa_health_background_sync";
    private static final String KEYSTORE_ALIAS = "forge_athletic_health_token_key_v1";
    private static final String DEFAULT_ENDPOINT = "https://forge-athletic.app/api/wearables/sync";
    private static final Set<String> ALLOWED_HOSTS = new HashSet<>(Arrays.asList(
            "forge-athletic.app",
            "www.forge-athletic.app"
    ));

    private static GAAHealthSyncManager instance;

    private final Context context;
    private final SharedPreferences prefs;
    private final ExecutorService executor;
    private final Handler mainHandler;

    public interface TelemetryListener {
        void onTelemetryUpdated(JSObject telemetry);
    }

    private TelemetryListener telemetryListener;

    public interface ResultCallback<T> {
        void onResult(boolean success, T data, String error);
    }

    private GAAHealthSyncManager(Context context) {
        this.context = context.getApplicationContext();
        this.prefs = this.context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        this.executor = Executors.newCachedThreadPool();
        this.mainHandler = new Handler(Looper.getMainLooper());
        migrateLegacyPlaintextToken();
    }

    private void migrateLegacyPlaintextToken() {
        String legacy = prefs.getString(KEY_LEGACY_AUTH_TOKEN, null);
        if (legacy != null) {
            if (!legacy.trim().isEmpty()) {
                setAuthToken(legacy.trim());
            }
            prefs.edit().remove(KEY_LEGACY_AUTH_TOKEN).apply();
        }
    }

    private SecretKey getOrCreateSecretKey() throws Exception {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        if (keyStore.containsAlias(KEYSTORE_ALIAS)) {
            return ((KeyStore.SecretKeyEntry) keyStore.getEntry(KEYSTORE_ALIAS, null)).getSecretKey();
        }
        KeyGenerator keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        KeyGenParameterSpec spec = new KeyGenParameterSpec.Builder(
                KEYSTORE_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
        )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build();
        keyGenerator.init(spec);
        return keyGenerator.generateKey();
    }

    private String encryptWithKeystore(String plaintext) {
        try {
            SecretKey secretKey = getOrCreateSecretKey();
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            byte[] iv = cipher.getIV();
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            return Base64.encodeToString(iv, Base64.NO_WRAP) + ":" + Base64.encodeToString(ciphertext, Base64.NO_WRAP);
        } catch (Exception e) {
            Log.e(TAG, "Keystore encryption failed: " + e.getMessage());
            return null;
        }
    }

    private String decryptWithKeystore(String encoded) {
        try {
            String[] parts = encoded.split(":", 2);
            if (parts.length != 2) return null;
            byte[] iv = Base64.decode(parts[0], Base64.NO_WRAP);
            byte[] ciphertext = Base64.decode(parts[1], Base64.NO_WRAP);
            SecretKey secretKey = getOrCreateSecretKey();
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(128, iv));
            byte[] plainBytes = cipher.doFinal(ciphertext);
            return new String(plainBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            Log.e(TAG, "Keystore decryption failed: " + e.getMessage());
            return null;
        }
    }

    public static String sanitizeBackendUrl(String candidate) {
        if (candidate == null || candidate.trim().isEmpty()) {
            return DEFAULT_ENDPOINT;
        }
        String trimmed = candidate.trim();
        if (trimmed.startsWith("/")) {
            return "https://forge-athletic.app" + trimmed;
        }
        try {
            URI uri = new URI(trimmed);
            String scheme = uri.getScheme() != null ? uri.getScheme().toLowerCase(Locale.US) : "";
            String host = uri.getHost() != null ? uri.getHost().toLowerCase(Locale.US) : "";
            if ("https".equals(scheme) && ALLOWED_HOSTS.contains(host)) {
                return trimmed;
            }
        } catch (Exception ignored) {
        }
        return DEFAULT_ENDPOINT;
    }

    public static synchronized GAAHealthSyncManager getInstance(Context context) {
        if (instance == null) {
            instance = new GAAHealthSyncManager(context);
        }
        return instance;
    }

    public void setTelemetryListener(TelemetryListener listener) {
        this.telemetryListener = listener;
    }

    public void initializeOnAppLaunch() {
        if (isBackgroundDeliveryEnabled()) {
            int interval = getBackgroundSyncIntervalMinutes();
            scheduleWorkManagerBackgroundDelivery(interval);
        }
    }

    // MARK: - Configuration Getters & Setters

    public String getBackendUrl() {
        return sanitizeBackendUrl(prefs.getString(KEY_BACKEND_URL, DEFAULT_ENDPOINT));
    }

    public void setBackendUrl(String url) {
        if (url != null && !url.trim().isEmpty()) {
            prefs.edit().putString(KEY_BACKEND_URL, sanitizeBackendUrl(url)).apply();
        }
    }

    public String getAuthToken() {
        String encrypted = prefs.getString(KEY_ENCRYPTED_AUTH_TOKEN, null);
        if (encrypted == null || encrypted.isEmpty()) {
            return null;
        }
        return decryptWithKeystore(encrypted);
    }

    public void setAuthToken(String token) {
        SharedPreferences.Editor editor = prefs.edit().remove(KEY_LEGACY_AUTH_TOKEN);
        if (token == null || token.trim().isEmpty()) {
            editor.remove(KEY_ENCRYPTED_AUTH_TOKEN).apply();
            return;
        }
        String encrypted = encryptWithKeystore(token.trim());
        if (encrypted != null) {
            editor.putString(KEY_ENCRYPTED_AUTH_TOKEN, encrypted).apply();
        } else {
            editor.remove(KEY_ENCRYPTED_AUTH_TOKEN).apply();
        }
    }

    public String getCurrentUserId() {
        return prefs.getString(KEY_USER_ID, null);
    }

    public void setCurrentUserId(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            prefs.edit().remove(KEY_USER_ID).apply();
        } else {
            prefs.edit().putString(KEY_USER_ID, userId.trim()).apply();
        }
    }

    public void clearSessionAndStopBackgroundSync() {
        prefs.edit()
                .remove(KEY_LEGACY_AUTH_TOKEN)
                .remove(KEY_ENCRYPTED_AUTH_TOKEN)
                .remove(KEY_USER_ID)
                .putBoolean(KEY_BG_ENABLED, false)
                .apply();
        try {
            WorkManager wm = WorkManager.getInstance(context);
            wm.cancelUniqueWork(WORK_TAG_HEALTH_SYNC);
            wm.cancelAllWorkByTag(WORK_TAG_HEALTH_SYNC);
        } catch (Exception e) {
            Log.w(TAG, "Notice cancelling background health worker on logout: " + e.getMessage());
        }
    }

    public boolean isBackgroundDeliveryEnabled() {
        return false;
    }

    public void setBackgroundDeliveryEnabled(boolean enabled) {
        prefs.edit().putBoolean(KEY_BG_ENABLED, false).apply();
    }

    public int getBackgroundSyncIntervalMinutes() {
        return prefs.getInt(KEY_BG_INTERVAL, 60);
    }

    public void setBackgroundSyncIntervalMinutes(int interval) {
        prefs.edit().putInt(KEY_BG_INTERVAL, Math.max(15, interval)).apply();
    }

    // MARK: - Health Availability & Authorization

    public boolean isHealthDataAvailable() {
        // Android Health Connect native SDK queries are intentionally disabled until verified on hardware (#42).
        return false;
    }

    public void requestAuthorization(ResultCallback<Boolean> callback) {
        mainHandler.post(() -> {
            if (callback != null) {
                callback.onResult(
                        false,
                        false,
                        "Android Health Connect integration is pending native SDK verification."
                );
            }
        });
    }

    public String getAuthorizationStatus() {
        return "unavailable";
    }

    // MARK: - Background Delivery Scheduling (Android WorkManager)

    public void enableBackgroundDelivery(int intervalMinutes, ResultCallback<Boolean> callback) {
        setBackgroundDeliveryEnabled(false);
        try {
            WorkManager.getInstance(context).cancelAllWorkByTag(WORK_TAG_HEALTH_SYNC);
        } catch (Exception e) {
            Log.w(TAG, "Unable to cancel WorkManager health sync jobs: " + e.getMessage());
        }

        Log.i(TAG, "Android Health Connect background delivery disabled pending native SDK verification.");
        if (callback != null) {
            mainHandler.post(() -> callback.onResult(
                    false,
                    false,
                    "Android Health Connect background delivery is disabled pending native SDK verification."
            ));
        }
    }

    // MARK: - Query Latest Biometrics & Nutrition

    public void queryLatestBiometrics(ResultCallback<JSObject> callback) {
        // Never fabricate synthetic biometric vitals or sync placeholder health payloads (#42).
        mainHandler.post(() -> {
            if (callback != null) {
                callback.onResult(
                        false,
                        null,
                        "Android Health Connect integration is pending native SDK verification."
                );
            }
        });
    }

    // MARK: - Backend Telemetry Synchronization

    public void syncTelemetryToBackend(JSObject telemetry, ResultCallback<Boolean> callback) {
        executor.execute(() -> {
            HttpURLConnection conn = null;
            try {
                String token = getAuthToken();
                String userId = getCurrentUserId();
                if (token == null || token.trim().isEmpty() || userId == null || userId.trim().isEmpty()) {
                    Log.i(TAG, "Skipping background telemetry sync — no authenticated session active.");
                    mainHandler.post(() -> {
                        if (callback != null) {
                            callback.onResult(false, false, "Unauthenticated");
                        }
                    });
                    return;
                }

                String targetUrl = getBackendUrl();
                URL url = new URL(targetUrl);
                if (!"https".equalsIgnoreCase(url.getProtocol()) || !ALLOWED_HOSTS.contains(url.getHost().toLowerCase(Locale.US))) {
                    Log.w(TAG, "Blocked non-HTTPS or untrusted sync URL: " + targetUrl);
                    mainHandler.post(() -> {
                        if (callback != null) {
                            callback.onResult(false, false, "Untrusted endpoint");
                        }
                    });
                    return;
                }
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json; utf-8");
                conn.setRequestProperty("Accept", "application/json");
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(15000);
                conn.setDoOutput(true);
                conn.setRequestProperty("Authorization", "Bearer " + token.trim());

                byte[] input = telemetry.toString().getBytes(StandardCharsets.UTF_8);
                try (OutputStream os = conn.getOutputStream()) {
                    os.write(input, 0, input.length);
                }

                int code = conn.getResponseCode();
                boolean isSuccess = (code >= 200 && code < 300);

                if (isSuccess) {
                    SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
                    String lastSync = isoFormat.format(new Date());
                    prefs.edit().putString(KEY_LAST_SYNC, lastSync).apply();
                    Log.i(TAG, "Telemetry background sync succeeded with HTTP status: " + code);
                    mainHandler.post(() -> {
                        if (telemetryListener != null) {
                            telemetryListener.onTelemetryUpdated(telemetry);
                        }
                        if (callback != null) {
                            callback.onResult(true, true, null);
                        }
                    });
                } else {
                    Log.w(TAG, "Telemetry sync responded with status: " + code);
                    mainHandler.post(() -> {
                        if (callback != null) {
                            callback.onResult(false, false, "HTTP " + code);
                        }
                    });
                }
            } catch (Exception e) {
                Log.e(TAG, "Sync network exception: " + e.getMessage(), e);
                mainHandler.post(() -> {
                    if (callback != null) {
                        callback.onResult(false, false, e.getMessage());
                    }
                });
            } finally {
                if (conn != null) {
                    conn.disconnect();
                }
            }
        });
    }

    // MARK: - Query Current Heart Rate

    public void getCurrentHeartRate(ResultCallback<JSObject> callback) {
        mainHandler.post(() -> {
            if (callback != null) {
                callback.onResult(
                        false,
                        null,
                        "Android Health Connect live heart rate is pending native SDK verification."
                );
            }
        });
    }

    // MARK: - Save Mindful Session

    public void saveMindfulSession(
            double durationMinutes,
            String completedAt,
            ResultCallback<Boolean> callback
    ) {
        mainHandler.post(() -> {
            if (callback != null) {
                callback.onResult(
                        false,
                        false,
                        "Android Health Connect write integration is pending native SDK verification."
                );
            }
        });
    }

    // MARK: - Save Workout

    public void saveWorkout(
            String activityType,
            double calories,
            double durationMinutes,
            Double distanceMiles,
            ResultCallback<Boolean> callback
    ) {
        saveWorkout(activityType, calories, durationMinutes, distanceMiles, null, null, callback);
    }

    public void saveWorkout(
            String activityType,
            double calories,
            double durationMinutes,
            Double distanceMiles,
            Double avgHeartRate,
            String completedAt,
            ResultCallback<Boolean> callback
    ) {
        mainHandler.post(() -> {
            if (callback != null) {
                callback.onResult(
                        false,
                        false,
                        "Android Health Connect workout write integration is pending native SDK verification."
                );
            }
        });
    }

    // MARK: - Telemetry Diagnostics

    public void getTelemetryDiagnostics(ResultCallback<JSObject> callback) {
        executor.execute(() -> {
            try {
                JSObject diag = new JSObject();
                diag.put("platform", "android");
                diag.put("healthKitAvailable", isHealthDataAvailable());
                diag.put("authorizationStatus", getAuthorizationStatus());
                diag.put("backgroundDeliveryEnabled", isBackgroundDeliveryEnabled());
                diag.put("backgroundSyncIntervalMinutes", getBackgroundSyncIntervalMinutes());
                diag.put("backendUrl", getBackendUrl());
                diag.put("lastSyncTimestamp", prefs.getString(KEY_LAST_SYNC, ""));
                diag.put("telemetryReady", false);

                mainHandler.post(() -> {
                    if (callback != null) {
                        callback.onResult(true, diag, null);
                    }
                });
            } catch (Exception e) {
                mainHandler.post(() -> {
                    if (callback != null) {
                        callback.onResult(false, null, e.getMessage());
                    }
                });
            }
        });
    }

    // MARK: - Boot Receiver for Persistence

    public static class BootReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction()) ||
                Intent.ACTION_MY_PACKAGE_REPLACED.equals(intent.getAction())) {
                Log.i(TAG, "Device booted / package replaced. Re-initializing background health sync worker.");
                GAAHealthSyncManager.getInstance(context).initializeOnAppLaunch();
            }
        }
    }
}

