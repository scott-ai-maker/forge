# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /Users/scottgordon/Library/Android/sdk/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.

-keep class com.getcapacitor.** { *; }
-keep class com.gordonathletic.app.** { *; }
-keep class androidx.health.connect.** { *; }
-keep class androidx.work.** { *; }

