package com.gordonathletic.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

/**
 * Standalone, zero-authentication Health Connect Permissions Rationale screen
 * required by Google Play Health Connect Limited Use Policy.
 */
public class HealthPermissionsRationaleActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundColor(Color.parseColor("#080E14"));

        LinearLayout container = new LinearLayout(this);
        container.setOrientation(LinearLayout.VERTICAL);
        int pad = dp(24);
        container.setPadding(pad, dp(36), pad, dp(36));

        TextView title = new TextView(this);
        title.setText("Forge Athletic — Health Connect Limited Use Disclosure");
        title.setTextColor(Color.parseColor("#F59E0B"));
        title.setTextSize(19f);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        container.addView(title);

        TextView body = new TextView(this);
        body.setText(
                "\nWhy Forge Athletic Requests Health Connect Access:\n\n" +
                "• Read Scopes (Heart Rate, Resting Heart Rate, HRV, Steps, Distance, Active & Total Calories Burned, Sleep, and Exercise): " +
                "Used exclusively to calculate your recovery readiness score and calibrate training workload inside Forge Athletic.\n\n" +
                "• Write Scopes (Exercise, Active & Total Calories Burned, and Distance): " +
                "Used solely to log workouts you complete in Forge Athletic back to Health Connect.\n\n" +
                "Strict Limited Use Guarantee:\n" +
                "Data obtained from Health Connect adheres strictly to the Google Health Connect Permissions Policy, including Limited Use requirements. " +
                "Your health data is encrypted via TLS 1.3 and AES-256, is NEVER sold to data brokers, and is NEVER used for advertising, marketing, or creditworthiness.\n\n" +
                "You can revoke permissions or permanently delete your account and synchronized health data at any time in Android Health Connect settings or Forge Athletic Account Settings."
        );
        body.setTextColor(Color.parseColor("#E2E8F0"));
        body.setTextSize(14.5f);
        body.setLineSpacing(0f, 1.35f);
        container.addView(body);

        Button policyButton = new Button(this);
        policyButton.setText("Read Consumer Health Data Privacy Policy");
        policyButton.setOnClickListener(v -> {
            Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://forge-athletic.app/health-privacy"));
            startActivity(browserIntent);
        });
        LinearLayout.LayoutParams policyParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        policyParams.topMargin = dp(20);
        container.addView(policyButton, policyParams);

        Button closeButton = new Button(this);
        closeButton.setText("Close");
        closeButton.setGravity(Gravity.CENTER);
        closeButton.setOnClickListener(v -> finish());
        LinearLayout.LayoutParams closeParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        closeParams.topMargin = dp(10);
        container.addView(closeButton, closeParams);

        scroll.addView(container);
        setContentView(scroll);
    }

    private int dp(int value) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(value * density);
    }
}
