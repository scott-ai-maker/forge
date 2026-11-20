import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()

function readProjectFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8')
}

describe('Sprint 5 — Native App Store, Companion & Music Broadcast Safeguards', () => {
  it('#41 declares all collected data types in iOS PrivacyInfo.xcprivacy and wires both manifests into Xcode project.pbxproj', () => {
    const appPrivacy = readProjectFile('ios/App/App/PrivacyInfo.xcprivacy')
    for (const dataType of [
      'NSPrivacyCollectedDataTypeHealth',
      'NSPrivacyCollectedDataTypeFitness',
      'NSPrivacyCollectedDataTypeUserID',
      'NSPrivacyCollectedDataTypeEmailAddress',
      'NSPrivacyCollectedDataTypeName',
      'NSPrivacyCollectedDataTypePhoneNumber',
      'NSPrivacyCollectedDataTypePhotosorVideos',
      'NSPrivacyCollectedDataTypeAudioData',
    ]) {
      expect(appPrivacy).toContain(dataType)
    }

    const pbxproj = readProjectFile('ios/App/App.xcodeproj/project.pbxproj')
    expect(pbxproj).toContain('F0A120261120000000000001 /* PrivacyInfo.xcprivacy in Resources */')
    expect(pbxproj).toContain('F0A120261120000000000002 /* PrivacyInfo.xcprivacy */')
    expect(pbxproj).toContain('F0A120261120000000000003 /* PrivacyInfo.xcprivacy in Resources */')
    expect(pbxproj).toContain('F0A120261120000000000004 /* PrivacyInfo.xcprivacy */')
  })

  it('#42 disables fabricated Android Health Connect telemetry, removes unused manifest health permissions, and trims iOS HealthKit queries', () => {
    const androidSync = readProjectFile(
      'android/app/src/main/java/com/gordonathletic/app/GAAHealthSyncManager.java'
    )
    expect(androidSync).toContain('public boolean isHealthDataAvailable() {\n        // Android Health Connect native SDK queries are intentionally disabled until verified on hardware (#42).\n        return false;')
    expect(androidSync).toContain('return "unavailable";')
    expect(androidSync).not.toContain('resting_heart_rate", 54')
    expect(androidSync).not.toContain('hrv_rmssd", 78')
    expect(androidSync).not.toContain('ret.put("heartRate", 64)')

    const manifest = readProjectFile('android/app/src/main/AndroidManifest.xml')
    expect(manifest).not.toContain('android.permission.health.')
    expect(manifest).not.toContain('FOREGROUND_SERVICE_HEALTH')
    expect(manifest).not.toContain('BODY_SENSORS')
    expect(manifest).not.toContain('ACTIVITY_RECOGNITION')
    expect(manifest).not.toContain('HealthPermissionsRationaleActivity')

    const iosSync = readProjectFile('ios/App/App/GAAHealthSyncManager.swift')
    expect(iosSync).not.toContain('.vo2Max')
    expect(iosSync).not.toContain('.dietaryEnergyConsumed')
    expect(iosSync).not.toContain('.dietaryProtein')
    expect(iosSync).not.toContain('.mindfulSession')

    const watchInfoPlist = readProjectFile('ios/App/ForgeWatch/Info.plist')
    expect(watchInfoPlist).not.toContain('5-Minute Desk Reset')
  })

  it('#43 removes external domain steering in companion TierUpgradeModal and hides trademarked store badges for placeholder URLs', () => {
    const upgradeModal = readProjectFile('components/packages/TierUpgradeModal.tsx')
    expect(upgradeModal).toContain('Memberships are managed externally outside this companion app.')
    const companionBlock = upgradeModal.slice(
      upgradeModal.indexOf('{isCompanion ? ('),
      upgradeModal.indexOf(') : (', upgradeModal.indexOf('{isCompanion ? ('))
    )
    expect(companionBlock).not.toContain('forge-athletic.app')
    expect(companionBlock).not.toContain('website')

    const promoSection = readProjectFile('components/marketing/MobileAppPromoSection.tsx')
    expect(promoSection).toContain('{isIosPlaceholder ? (')
    expect(promoSection).toContain('iOS App Coming Soon')
    expect(promoSection).toContain('{isAndroidPlaceholder ? (')
    expect(promoSection).toContain('Android App Coming Soon')
  })

  it('#44 wires live-broadcast and recording-active DOM attributes so GymMusicAudioStudio blocks Spotify during live coaching & Form Lab capture', () => {
    const unifiedHud = readProjectFile('components/coach/UnifiedLiveStudioHud.tsx')
    const liveCameraHud = readProjectFile('components/coach/LiveVideoCameraHud.tsx')
    const formLab = readProjectFile('components/fitness/FormLabRecorder.tsx')
    const musicStudio = readProjectFile('components/fitness/GymMusicAudioStudio.tsx')

    expect(unifiedHud).toContain('data-forge-live-broadcast="true"')
    expect(liveCameraHud).toContain('data-forge-live-broadcast="true"')
    expect(formLab).toContain("data-forge-recording-active={isRecording || watchRecordingActive ? 'true' : undefined}")
    expect(musicStudio).toContain('[data-forge-live-broadcast="true"], [data-forge-recording-active="true"]')
  })
})
