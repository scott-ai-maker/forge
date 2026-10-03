package com.gordonathletic.app;

import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import com.getcapacitor.JSObject;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * GAAHealthBackgroundWorker
 * Background WorkManager Task executing scheduled biometrics ingest and synchronization
 * for Gordon Athletic Advisory on Android.
 */
public class GAAHealthBackgroundWorker extends Worker {
    private static final String TAG = "GAABackgroundWorker";

    public GAAHealthBackgroundWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        Log.i(TAG, "Executing periodic background health delivery worker...");

        GAAHealthSyncManager syncManager = GAAHealthSyncManager.getInstance(getApplicationContext());
        if (!syncManager.isBackgroundDeliveryEnabled()) {
            Log.i(TAG, "Background delivery is disabled in preferences. Skipping sync cycle.");
            return Result.success();
        }

        final CountDownLatch latch = new CountDownLatch(1);
        final AtomicBoolean successResult = new AtomicBoolean(false);

        syncManager.queryLatestBiometrics((querySuccess, telemetry, queryError) -> {
            if (!querySuccess || telemetry == null) {
                Log.w(TAG, "Failed querying biometrics in background worker: " + queryError);
                latch.countDown();
                return;
            }

            syncManager.syncTelemetryToBackend(telemetry, (syncSuccess, data, syncError) -> {
                if (syncSuccess) {
                    Log.i(TAG, "Background worker successfully synced telemetry to GAA backend.");
                    successResult.set(true);
                } else {
                    Log.w(TAG, "Background worker telemetry sync failed: " + syncError);
                }
                latch.countDown();
            });
        });

        try {
            boolean completed = latch.await(45, TimeUnit.SECONDS);
            if (!completed) {
                Log.w(TAG, "Background worker timed out waiting for network sync.");
                return Result.retry();
            }
        } catch (InterruptedException e) {
            Log.e(TAG, "Background worker interrupted: " + e.getMessage());
            return Result.retry();
        }

        return successResult.get() ? Result.success() : Result.retry();
    }
}

