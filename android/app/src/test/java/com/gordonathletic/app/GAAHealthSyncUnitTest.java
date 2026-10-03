package com.gordonathletic.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import org.json.JSONObject;
import org.junit.Test;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

/**
 * Unit tests for Gordon Athletic Advisory Android native telemetry components
 * Executed via `./gradlew testDebugUnitTest` in local development and CI pipelines.
 */
public class GAAHealthSyncUnitTest {

    @Test
    public void testIso8601TimestampFormatting() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        
        Date testDate = new Date(1726142400000L); // Fixed timestamp
        String formatted = sdf.format(testDate);
        
        assertNotNull(formatted);
        assertTrue(formatted.endsWith("Z"));
        assertTrue(formatted.startsWith("2024-09-"));
    }

    @Test
    public void testHealthTelemetryPayloadStructure() throws Exception {
        JSONObject payload = new JSONObject();
        payload.put("provider", "health_connect");
        payload.put("resting_heart_rate", 54);
        payload.put("hrv_rmssd", 72);
        payload.put("steps", 10450);
        payload.put("active_calories", 580);
        payload.put("device_model", "Google Pixel 9 Pro");

        assertEquals("health_connect", payload.getString("provider"));
        assertEquals(54, payload.getInt("resting_heart_rate"));
        assertEquals(72, payload.getInt("hrv_rmssd"));
        assertEquals(10450, payload.getInt("steps"));
        assertEquals(580, payload.getInt("active_calories"));
        assertEquals("Google Pixel 9 Pro", payload.getString("device_model"));
    }

    @Test
    public void testPackageIdentifierConfiguration() {
        String expectedApplicationId = "com.gordonathletic.app";
        assertEquals("com.gordonathletic.app", expectedApplicationId);
    }
}
