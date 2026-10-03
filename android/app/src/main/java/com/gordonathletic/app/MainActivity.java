package com.gordonathletic.app;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register custom native HealthKit / Health Connect bridge plugin
        registerPlugin(GAAHealthKitPlugin.class);

        super.onCreate(savedInstanceState);

        // Apply dark obsidian luxury styling to status & navigation bars
        configureSystemBars();

        // Initialize background delivery observer & work scheduler
        GAAHealthSyncManager.getInstance(getApplicationContext()).initializeOnAppLaunch();
    }

    private void configureSystemBars() {
        Window window = getWindow();
        if (window != null) {
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.parseColor("#080E14"));
            window.setNavigationBarColor(Color.parseColor("#080E14"));

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                // Light icons on dark status bar
                View decor = window.getDecorView();
                decor.setSystemUiVisibility(decor.getSystemUiVisibility() & ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
            }
        }
    }
}

