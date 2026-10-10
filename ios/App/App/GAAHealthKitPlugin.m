#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(GAAHealthKitPlugin, "GAAHealthKit",
    CAP_PLUGIN_METHOD(isAvailable, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(requestAuthorization, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getAuthorizationStatus, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(enableBackgroundDelivery, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(queryLatestBiometrics, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(syncHealthData, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(setSyncConfiguration, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(writeWorkout, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(writeMindfulSession, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getCurrentHeartRate, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getTelemetryDiagnostics, CAPPluginReturnPromise);
)

