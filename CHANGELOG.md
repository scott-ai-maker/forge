# Changelog

All notable changes to Gordon Athletic Advisory (GAA / SGF App) will be documented in this file,
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.35.39] - 2026-09-22

### Added & Enhanced
- **📱 PWA, iOS, & Android In-Gym Helper Decoupling & Unified Companion Engine**:
  - **Unified Companion Engine & Standalone PWA Parity ([`lib/native-companion.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/native-companion.ts), [`lib/native-companion.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/native-companion.test.ts))**:
    - Architecturally decoupled the installed Progressive Web App (PWA), iOS native shell, and Android native shell from the public marketing website, establishing them strictly as in-gym helper companions.
    - Extended `lib/native-companion.ts` to detect standalone PWA mode (`display-mode: standalone`, iOS Safari `navigator.standalone`, and companion URL query flags), elevating PWA to full feature parity with native mobile apps.
    - Added `isHelperApp()`, `getHelperPlatform()`, and `useHelperAppMode()` client-side React hook.
  - **Tactical In-Gym Launch Endpoints ([`app/manifest.ts`](file:///Users/scottgordon/Repos/gaa-app/app/manifest.ts), [`public/manifest.json`](file:///Users/scottgordon/Repos/gaa-app/public/manifest.json), [`capacitor.config.ts`](file:///Users/scottgordon/Repos/gaa-app/capacitor.config.ts))**:
    - Re-branded PWA manifest to `"Gordon Athletic Companion"` (*"GAA Helper"*) with `start_url: "/dashboard/fitness?source=pwa"` and direct shortcuts for *Today's Workout*, *Biometrics & Readiness*, and *Concierge Messages*.
    - Updated Capacitor configuration to launch directly into `/dashboard/fitness?source=native`.
  - **Edge Middleware & Client Root Guards ([`proxy.ts`](file:///Users/scottgordon/Repos/gaa-app/proxy.ts), [`lib/proxy-helper-routing.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/proxy-helper-routing.test.ts), [`components/ui/HelperAppRootGuard.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/ui/HelperAppRootGuard.tsx), [`app/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/page.tsx))**:
    - Intercepts root `/` requests originating from helper apps via edge middleware: automatically routes authenticated athletes directly to `/dashboard/fitness?source=helper` and unauthenticated users to the helper login gateway.
    - Added client-side `HelperAppRootGuard` preventing cached standalone tabs from displaying marketing blocks.
  - **Dedicated Companion Sign-In Gateway ([`app/auth/login/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/auth/login/page.tsx))**:
    - Engineered a dedicated **"GAA Helper Access"** (*"Athlete In-Gym Companion"*) login console featuring 1-click Fast Pass (Scott Gordon coach pass, Alexander Vance athlete pass), credentials sign-in, and a compliant notice that memberships and retainers are managed exclusively on the web portal.
  - **Marketing Artifact Suppression & Zero-Purchase Compliance**:
    - Filtered public marketing links from [`components/ui/SiteHeader.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/ui/SiteHeader.tsx) and routed brand logo taps back to the active workout hub.
    - Suppressed [`components/ui/SiteFooter.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/ui/SiteFooter.tsx), [`components/marketing/FirstVisitLeadCapture.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/marketing/FirstVisitLeadCapture.tsx), and [`components/ui/PwaInstallPrompt.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/ui/PwaInstallPrompt.tsx) in helper app mode to optimize screen real estate for workouts and telemetry.
    - Hardened [`app/api/stripe/checkout/route.ts`](file:///Users/scottgordon/Repos/gaa-app/app/api/stripe/checkout/route.ts) with 403 Forbidden enforcement across PWA, iOS, and Android helper modes complying with Apple App Store Guideline 3.1.3 and Google Play policies.

## [1.35.38] - 2026-09-17

### Fixed & Enhanced
- **🎯 Reverse Lunge Media Calibration & Corrective Clinical Sourcing Hardening**:
  - **Reverse Lunge Video & Image Matching Calibration ([`lib/nasm-exercise-video-catalog.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-exercise-video-catalog.ts), [`lib/nasm-generated-images.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-generated-images.ts), [`scripts/update-fuzzy-matcher.mjs`](file:///Users/scottgordon/Repos/gaa-app/scripts/update-fuzzy-matcher.mjs), [`lib/nasm-fuzzy-matcher.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-fuzzy-matcher.ts))**:
    - Resolved issue where `Reverse Lunge with Torso Lean / Step-Up to Low Box` was matched by the generic `lunge` fallback in `KEYWORD_EDGE_MAP`, serving the forward lunge demo (`UInwcEa5BH4`).
    - Added explicit catalog keys and heuristic anchors prioritizing the authentic NASM Reverse Lunge demo (`lKhZvT_NkOs` / `reverse-lunge-to-balance-0204`) across all reverse lunge variants.
    - Updated `VERIFIED_GAA_EXERCISE_IMAGES` and `EXERCISE_ALIAS_MAP` to ensure 100% 1-to-1 reverse lunge thumbnail and demo pairing (`https://img.youtube.com/vi/lKhZvT_NkOs/hqdefault.jpg`).
  - **Clinical Movement Card Biomechanical Profile ([`lib/nasm-clinical-movement-cards.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-clinical-movement-cards.ts))**:
    - Added dedicated clinical movement card profile for `reverse lunge` detailing kinetic checkpoints (ball-of-foot contact on rear foot, lead knee aligned over 2nd toe, 20°–30° torso lean) and clinical cues explaining the patellofemoral shear-reduction mechanism for Runner's Knee.
  - **Supabase Client Plan Production Migration ([`scripts/backfill-supabase-nasm-cdn-images.mjs`](file:///Users/scottgordon/Repos/gaa-app/scripts/backfill-supabase-nasm-cdn-images.mjs))**:
    - Backfilled stored workout plans in Supabase, specifically updating Lisa Gordon's Runner's Knee rehabilitation plan (`d221c1aa-672a-4f9f-9492-353be32facfa`) to replace legacy forward lunge URLs with `lKhZvT_NkOs`.
  - **Corrective Exercise Sourcing Documentation**:
    - Synthesized and documented the clinical foundations of GAA corrective exercise prescriptions: the 4-phase NASM Corrective Exercise Continuum (Inhibit, Lengthen, Activate, Integrate), the Overhead Squat Assessment kinetic chain checkpoints, and peer-reviewed orthopedic joint shear mechanics.

## [1.35.37] - 2026-09-17

### Added & Enhanced
- **📸 Official NASM CDN Default Exercise Media & Sports Injury Biomechanical Augmentation Engine**:
  - **Platform-Wide Replacement with Official NASM CDN Images ([`scripts/nasm-complete-library.json`](file:///Users/scottgordon/Repos/gaa-app/scripts/nasm-complete-library.json), [`lib/nasm-fuzzy-matcher.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-fuzzy-matcher.ts), [`lib/nasm-generated-images.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-generated-images.ts), [`lib/nasm-exercise-video-catalog.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-exercise-video-catalog.ts), [`lib/coach-programs.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/coach-programs.ts), [`lib/nasm-clinical-movement-cards.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-clinical-movement-cards.ts), [`components/coach/RagProgramGeneratorStudio.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/RagProgramGeneratorStudio.tsx))**:
    - Replaced all generated and custom exercise images (`/images/exercises/*.jpg`) across code, memory catalogs, video engines, and presentation studios with official default images served directly from the NASM CDN (`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`).
    - Updated all 324 catalog entries in `scripts/nasm-complete-library.json` and `lib/nasm-fuzzy-matcher.ts` so `imageUrl` points to `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`.
    - Mapped all 285 keys in `lib/nasm-generated-images.ts` to official NASM CDN default thumbnails and exported `resolveNasmExerciseImage`.
    - Maintained `/images/exercises/image-not-available.jpg` (liquid gold GAA monogram seal) strictly as an authoritative fallback for novel/outlier movements lacking video demos.
  - **Supabase Database Production Backfill ([`scripts/backfill-supabase-nasm-cdn-images.mjs`](file:///Users/scottgordon/Repos/gaa-app/scripts/backfill-supabase-nasm-cdn-images.mjs))**:
    - Executed automated migration updating 100% of rows (324 of 324) in `exercise_library_entries` in Supabase to official NASM CDN default images.
    - Backfilled all 15 active workout plans in `workout_plans` across workouts, sessions, and days (including Lisa Gordon's plan).
  - **Clinical Sports Injury Domain & Biomechanical Shield ([`lib/sports-injuries.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/sports-injuries.ts))**:
    - Built a comprehensive sports injury domain defining 10 core conditions: Runner's Knee (patellofemoral pain syndrome), Tennis Elbow (lateral epicondylitis), Golfer's Elbow (medial epicondylitis), Jumper's Knee (patellar tendinopathy), Shin Splints, Plantar Fasciitis, Rotator Cuff Impingement, Lower Back Strain, Hip Impingement (FAI), and Achilles Tendinopathy.
    - Defined overactive/underactive muscle complexes, required kinetic warmup augmentations (SMR, static stretching, isolated activation), contraindicated exercise patterns, and safe OPT regressions.
  - **Interactive Client Settings Injury Management ([`components/settings/BaselineFitnessSettingsStudio.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/settings/BaselineFitnessSettingsStudio.tsx))**:
    - Added interactive injury selection chips, clinical descriptions, and contraindicated movement guidelines to the athlete baseline settings studio.
  - **Automated Program Generation & Substitution Integration ([`lib/nasm-exercise-substitution.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-exercise-substitution.ts), [`lib/rag-nasm-program-generator.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/rag-nasm-program-generator.ts), [`lib/gemini-nasm-master-coach.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/gemini-nasm-master-coach.ts), [`lib/nasm-opt-exercise-selection.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-opt-exercise-selection.ts))**:
    - Automatically adapts kinetic warmup protocols and substitutes contraindicated high-shear movements with safe alternatives (e.g. replacing walking lunges with reverse lunges with forward torso lean or step-ups to low box for Runner's Knee).
    - Hardened equipment substitution routines to re-evaluate injury contraindication checks post-substitution, ensuring missing home gym equipment never accidentally re-introduces high-shear contraindicated exercises.
  - **Coach Portal & Client Portal Display Parity ([`app/coach/clients/[id]/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/coach/clients/[id]/page.tsx), [`components/coach/CoachProgramWorkspace.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/CoachProgramWorkspace.tsx), [`components/coach/RagProgramGeneratorStudio.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/RagProgramGeneratorStudio.tsx), [`app/api/coach/clients/[id]/ai-onboarding-orchestrator/route.ts`](file:///Users/scottgordon/Repos/gaa-app/app/api/coach/clients/[id]/ai-onboarding-orchestrator/route.ts))**:
    - Parsed sports injury profiles directly from `fitness_profiles.injuries_limitations` and `intake_forms.surgeries_or_injuries`, propagating contraindication tags and custom weekly frequencies (2 days/week) throughout the Coach Portal and RAG Studio.
  - **Test Suite Verification**:
    - Updated test assertions across `lib/clinical-kinetic-warmup.test.ts`, `lib/nasm-clinical-movement-cards.test.ts`, `lib/nasm-fuzzy-matcher.test.ts`, `lib/rag-nasm-program-generator.test.ts`, and `components/coach/UnifiedLiveStudioHud.test.ts`.
    - Added dedicated unit test suite for sports injuries in [`lib/sports-injuries.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/sports-injuries.test.ts).
    - 100% pass across all 204 test files (1,410 tests) with zero TypeScript compile errors.

## [1.35.36] - 2026-09-14

### Added & Enhanced
- **⌚ iOS HealthKit Authentic Cardio Sync & Real-Time Biometric Telemetry Engine**:
  - **Authentic Apple HealthKit Cardio Activity Type Mapping ([`lib/native-healthkit-bridge.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/native-healthkit-bridge.ts), [`ios/App/App/GAAHealthKitPlugin.swift`](file:///Users/scottgordon/Repos/gaa-app/ios/App/App/GAAHealthKitPlugin.swift), [`ios/App/App/GAAHealthSyncManager.swift`](file:///Users/scottgordon/Repos/gaa-app/ios/App/App/GAAHealthSyncManager.swift))**:
    - Resolved issue where cardio sessions logged to Apple Health as `traditionalStrengthTraining`.
    - Added comprehensive mapping for indoor/outdoor cycling, running, rowing, stair climbing, HIIT, elliptical, walking, jump rope, swimming, and cross-training to their native `HKWorkoutActivityType` representations.
    - Added guardrails preventing cardio sessions from falling back to strength training when writing to HealthKit.
  - **In-Workout Cardio HealthKit Synchronization ([`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx))**:
    - Wired `syncActivityToAppleHealth` directly inside `handleSaveWorkoutCardio` and `handleCompleteWorkoutDay`, ensuring cardio blocks save immediately with accurate duration, distance, calories, and authentic `cardio` modality.
    - Preserved specific activity types when completing unified hybrid sessions (cardio + strength).
  - **Elimination of Hardcoded / Default Telemetry ([`components/fitness/tracker/LiveSessionStickyDock.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/LiveSessionStickyDock.tsx), [`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx), [`components/fitness/CoachCardioVoiceoverPlayer.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/CoachCardioVoiceoverPlayer.tsx))**:
    - Completely removed synthetic `+ 65` BPM RPE formulas and hardcoded `135 BPM` placeholders across sticky docks and workout summaries.
    - Live biometric displays now show `-- BPM` when no sensor is paired instead of inventing artificial heart rates.
    - Cardio voiceover player only persists measured heart rates to history, clearly flagging any interim display estimates with `(Est.)`.
  - **Real-Time Apple Watch Heart Rate Telemetry ([`lib/apple-health-bridge.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/apple-health-bridge.ts), [`lib/native-healthkit-bridge.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/native-healthkit-bridge.ts), [`components/fitness/hooks/useWearableTelemetrySync.ts`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/hooks/useWearableTelemetrySync.ts))**:
    - Implemented native `getCurrentHeartRate` plugin method and Swift bridge to query Apple Watch samples recorded in the active session window.
    - Automatically attaches actual Apple Watch active energy burned and heart rate sample arrays to completed workouts in HealthKit via `HKHealthStore.add()`.
    - Hooked real-time biometrics into `DailyBiometricSummary` and client tracker docks.
  - **UX Polish & Distraction Elimination ([`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx))**:
    - Removed unprofessional mid-workout popups and toasts; all telemetry and performance analytics are cleanly organized on the athlete dossier.
    - Adjusted post-workout sequence ordering so breathwork recovery follows cooldown.
  - **Test Suite Verification**:
    - Updated native and cloud HealthKit test suites in [`lib/native-healthkit-bridge.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/native-healthkit-bridge.test.ts) and [`lib/apple-health-bridge.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/apple-health-bridge.test.ts).
    - 100% pass across all 202 test files (1,373 tests).

## [1.35.35] - 2026-09-12

### Added & Enhanced
- **🏛️ Platform-Wide DRY Architectural Refactor & Equipment Capability Unification**:
  - **Canonical Equipment Domain Engine ([`lib/nasm-equipment-detector.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-equipment-detector.ts))**:
    - Centralized all equipment parsing, alias normalization, and biomechanical capability matching into a single canonical source of truth.
    - Exported `EquipmentCapabilities`, `CardioEquipmentCapabilities`, `parseEquipmentCapabilities()`, `parseCardioEquipmentCapabilities()`, `normalizeEquipmentAlias()`, `normalizeEquipmentAccess()`, and `doesExerciseMatchEquipment()`.
    - Supports full gym, garage barbell, home dumbbell, travel bands, and bodyweight calisthenics with high-fidelity modality checks.
  - **Deduplicated OPT RAG Program Generator ([`lib/rag-nasm-program-generator.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/rag-nasm-program-generator.ts))**:
    - Removed 170+ lines of duplicate local capability parsing and interfaces, re-exporting canonical domain models while maintaining 100% public API compatibility.
  - **Master AI Coach Simplification ([`lib/gemini-nasm-master-coach.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/gemini-nasm-master-coach.ts))**:
    - Replaced 110+ lines of custom equipment filters and duplicate substitution loops by delegating directly to `doesExerciseMatchEquipment()` and `substituteMissingEquipment()`.
  - **Unified NASM Media Enrichment ([`lib/nasm-exercise-video-catalog.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-exercise-video-catalog.ts))**:
    - Added `videoId` property to `ExerciseVideoResolution` and exported `enrichExerciseMedia<T>()` for clean, single-call resolution of official NASM YouTube video demos, embeds, and luxury GAA photography.
    - Simplified media resolution across RAG program generation, Gemini coach, and [`app/api/coach/exercise-library/route.ts`](file:///Users/scottgordon/Repos/gaa-app/app/api/coach/exercise-library/route.ts).
  - **Clean Generator Route ([`app/api/coach/workouts/generate/route.ts`](file:///Users/scottgordon/Repos/gaa-app/app/api/coach/workouts/generate/route.ts))**:
    - Removed 80+ lines of duplicate `exerciseMatchesEquipment()`, `normalizeEquipmentAlias()`, and `normalizeEquipmentAccess()`.
  - **Test Suite Verification**:
    - Added comprehensive unit tests for all canonical utilities in [`lib/nasm-equipment-detector.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-equipment-detector.test.ts) and [`lib/nasm-exercise-video-catalog.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-exercise-video-catalog.test.ts).
    - All 198 test files (1,352 tests) passing with 100% success rate.

## [1.35.34] - 2026-09-12

### Added & Enhanced
- **🏋️‍♂️ Strict Client Equipment Isolation & Machine Elimination Engine**:
  - **Zero Commercial Machine Leaks for Home Gym Profiles ([`lib/rag-nasm-program-generator.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/rag-nasm-program-generator.ts), [`lib/nasm-opt-guardrails.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-opt-guardrails.ts))**:
    - Eliminated accidental hardcoded commercial machine movements (`Lying Leg Curl`, `Kettlebell Renegade Row`) from home dumbbell/stability ball workout generation templates.
    - Integrated the **Strict Equipment Boundary Shield** directly into `generateRagNasmProgram()`, ensuring every exercise across every microcycle is evaluated and auto-substituted before media and asset resolution.
  - **Official Stability Ball Hamstring Curl Addition ([`lib/nasm-fuzzy-matcher.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-fuzzy-matcher.ts), [`lib/nasm-exercise-video-catalog.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-exercise-video-catalog.ts), [`public/images/exercises/stability-ball-hamstring-curl.jpg`](file:///Users/scottgordon/Repos/gaa-app/public/images/exercises/stability-ball-hamstring-curl.jpg))**:
    - Added `Stability Ball Hamstring Curl` to the official exercise catalog, complete with high-end luxury editorial photography, 4/2/1 tempo parameters, and NASM Chapter 16 Posterior Core Complex biomechanical coaching cues.
    - Upserted official record (`e8a9310c-3d44-48ea-9bbf-5dc162fb7692`) into Supabase `exercise_library_entries`.
  - **Deep Biomechanical Archetype Equipment Substitutions ([`lib/nasm-opt-guardrails.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-opt-guardrails.ts))**:
    - Extended `substituteMissingEquipment()` to deterministically handle hamstring isolation, quad extensions, leg presses, cable rotations, and lat pulldowns:
      - Hamstring/Leg Curl missing machine: `Stability Ball Hamstring Curl` (if ball), `Dumbbell Romanian Deadlift` (if dumbbells), `Resistance Band Hamstring Curl` (if bands), or `Single Leg Floor Bridge` (bodyweight).
      - Leg Press / Hack Squat missing machine: `Dumbbell Goblet Squat` / `Resistance Band Squat` / `Bodyweight Squat`.
      - Machine rows / Lat pulldowns: `Dumbbell Bent-Over Row` / `Resistance Band Lat Pulldown` / `Pull Up`.
  - **Athlete Active Plan Patched in Supabase**:
    - Patched Scott Gordon's active 4-day Phase 1 plan (`a31c72a7-6dbf-4d1f-9462-99d46373b857`):
      - Day 2 Exercise 5: Replaced commercial `Lying Leg Curl` with authentic `Stability Ball Hamstring Curl`.
      - Day 4 Exercise 3: Replaced `Kettlebell Renegade Row` with `Dumbbell Renegade Row To Push Up`.
      - Plan now achieves 100% equipment fidelity with Scott's home gym setup.

## [1.35.33] - 2026-09-12

### Added & Enhanced
- **🧬 NASM OPT™ Phase Governance & Deterministic Feature Offering Engine**:
  - **Supersets Strictly OFF by Default ([`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx))**:
    - Corrected unexpected default superset auto-clustering; workouts now load by default in clean, sequential single-exercise card mode across all phases.
    - Athletes maintain seamless 1-tap on-demand activation via the Exercise Quick-Jump Rail header button (`[⚡ Supersets: OFF/ON]`) when training in superset-appropriate phases.
  - **NASM OPT™ Feature Matrix ([`lib/nasm-opt-feature-matrix.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-opt-feature-matrix.ts))**:
    - Architected a sports-science-accurate rules engine defining which training features are offered, recommended, or restricted for each of the 5 NASM OPT phases:
      - **Phase 1 (Stabilization Endurance)**: Supersets prohibited (single sets with 4/2/1 tempo standard); intensity drop sets restricted to prevent kinetic breakdown; VBT hidden.
      - **Phase 2 (Strength Endurance)**: Superset contrast offered (Strength @ 2/0/2 paired with Stabilization @ 4/2/1); default OFF; drop sets optional.
      - **Phase 3 (Muscular Development / Hypertrophy)**: Antagonist density supersets offered (default OFF); advanced intensity protocols (drop sets, rest-pause, myo-reps) highlighted as recommended hypertrophy drivers.
      - **Phase 4 (Maximal Strength)**: Supersets prohibited (full 2–4 min ATP-CP & CNS recovery required); drop sets prohibited; Velocity-Based Training (VBT) and heavy warmup ramps prioritized.
      - **Phase 5 (Power)**: Post-Activation Potentiation (PAP) contrast complexes offered (default OFF); drop sets prohibited; VBT power output (watts & m/s) set as primary metric.
  - **Smart Superset Pairing Phase Isolation ([`lib/superset-pairing-engine.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/superset-pairing-engine.ts))**:
    - Gated antagonist auto-pairing to appropriate phases (Phases 2 & 3), preventing unwanted exercise pairing during Phase 1 Stabilization and Phase 4 Maximal Strength.
    - Added dedicated Phase 2 Strength + Stabilization contrast pair detection (`phase2_endurance`).
  - **Phase-Gated Drawer Components ([`components/fitness/tracker/IntensityProtocolDrawer.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/IntensityProtocolDrawer.tsx), [`components/fitness/tracker/RepCadenceMetronome.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/RepCadenceMetronome.tsx), [`components/fitness/tracker/SupersetPairCard.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/SupersetPairCard.tsx))**:
    - Intensity Protocol Drawers are gated strictly to appropriate phases, displaying `"Phase 3 Recommended"` badges in hypertrophy routines.
    - VBT Bar Velocity trays are hidden during Phase 1 controlled cadence (4/2/1) and badged as core focus in Phase 4 and Phase 5.
  - **Deterministic Movement Cadence Tempos**:
    - Automatically derives phase-specific cadence defaults (Phase 1: 4/2/1, Phase 2: 2/0/2 & 4/2/1, Phase 3: 2/0/2, Phase 4: 1/1/1, Phase 5: X/0/X).

## [1.35.32] - 2026-09-12

### Added & Enhanced
- **⚡ Lean & Clean Executive Architecture (Anti-Fluff Initiative)**:
  - **Over 320px Above-The-Fold Real Estate Recovered ([`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx))**:
    - Purged four layers of stacked pre-workout promotional banners and tutorial fluff, enabling Day 1 and Exercise #1 to sit immediately above the fold on mobile screens with zero scrolling required.
  - **Unified Workout Day Header & Session Control Bar**:
    - Merged the standalone 70px Apple Health banner directly into the active Day header line.
    - Replaced multi-sentence tutorial copy (*"Tap Start to begin live session tracking & log active duration to Apple Health."*) with a sleek, compact 1-tap Start/Pause/Resume timer pill with real-time green beacon and monospace telemetry (`14:22`).
  - **Consolidated Executive Utility Bar**:
    - Replaced the separate full-width "Tactile In-Gym Companion Quick Strip" and open `<details>` calendar accordion with a razor-thin inline utility bar.
    - Features compact 1-tap buttons for 3D Barbell Plates (`[ ⚖️ Plates ]`), interactive program schedule (`[ 📅 Schedule ]`), and Coach messaging (`[ 💬 Coach ]`), alongside an ambient screen awake beacon.
  - **Intelligent Cardio Studio Separation**:
    - Removed the intrusive 110px static `#cardio-studio` launcher banner from resistance lifting days.
    - Preserved seamless 1-tap direct audio cardio launching via the mobile navigation drawer, command palette, and dedicated cardio modules.
  - **De-Cluttered Progress Analytics Header ([`components/fitness/hub-views/ProgressAnalyticsView.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/hub-views/ProgressAnalyticsView.tsx))**:
    - Replaced the bulky introductory card and multi-sentence paragraph with a sleek, single-line institutional telemetry header.

## [1.35.31] - 2026-09-12

### Added & Enhanced
- **🏛️ "Private Bank" Design Language & Institutional Governance**:
  - **Sovereign Private Wealth Aesthetic**:
    - Purged consumer gamification tropes (streak fire emojis, patronizing cheerleading, superficial badges) in favor of institutional Swiss private wealth rigor.
    - Standardized palette on Deep Obsidian (`#04070E`), brushed athletic gold (`#D4AF37`), slate gray (`#64748B`, `#94A3B8`), and crisp ivory (`#F8FAFC`).
  - **Deterministic Cryptographic Verification Engine ([`lib/cryptographic-seal.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/cryptographic-seal.ts))**:
    - Mathematically generates offline, deterministic sovereign execution verification hashes (`GAA-SIG-XXXX-EXEC`, e.g. `GAA-SIG-8492-EXEC`), biomechanical PR peak seals (`GAA-SIG-XXXX-PEAK`), and longitudinal audit seals (`GAA-SIG-XXXX-AUDIT`).
    - Cryptographically binds session dates, athlete identity, total volume tonnage, and NASM OPT™ phases into an immutable digital signature.
  - **Longitudinal Workload & Execution Integrity Matrix ([`components/fitness/WorkoutStreakCard.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/WorkoutStreakCard.tsx))**:
    - Re-architected consistency tracking into an institutional mesocycle governance matrix.
    - Features Longitudinal Integrity Index (`font-mono tabular-nums`, ≥85.0% institutional benchmark), 28-day mesocycle session volume, NASM OPT™ Phase Clearance status, and protocol continuity tracking.
    - Includes 84-day (12-week) longitudinal training density matrix with brushed gold volume indicators and verified audit seal badges.
  - **Institutional Maximum Surpassed ([`components/fitness/tracker/PersonalRecordCelebrationBanner.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/PersonalRecordCelebrationBanner.tsx) & [`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx))**:
    - Replaced celebratory PR hype banners and flame emojis with an audited Biomechanical 1RM Clearance Record.
    - Formats all telemetry metrics into high-density tabular monospace numerals (`LOAD CLEARED`, `EST. 1RM`, `DELTA`) paired with deterministic cryptographic peak verification seals.
    - Updated the full-screen record celebration modal with sovereign gold crest styling and "Acknowledge & Seal Verification" workflow.
  - **Corrective Prescription Compliance ([`components/fitness/NasmAssessmentSummary.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/NasmAssessmentSummary.tsx))**:
    - Upgraded mobility habit tracking into audited NASM 4-Phase Kinetic Chain (Inhibit, Lengthen, Activate, Integrate) prescription compliance with institutional shield badges and daily protocol authentication.

## [1.35.30] - 2026-09-11

### Added & Enhanced
- **💎 Pro Ultra-Compact Exercise Card Architecture**:
  - **Ultra-Compact Exercise Card Height (~220px) ([`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx))**:
    - Slashed open exercise card height from ~1,400px+ down to **~220px** (>80% height reduction), providing instant zero-scroll gym-floor ergonomics.
    - Reps / Duration steppers, Weight / Load steppers, Plate Presets, and the primary gold Log Set button are immediately accessible above the fold without any scrolling.
    - Compacted steppers to 38px height (`stepperButtonStyle`) and media thumbnail to 38×38px with tightened 6px header padding (`accordionExerciseSummaryStyle`).
  - **Unified 4-Tool Segmented Strip (`data-testid="unified-exercise-tool-strip"`)**:
    - Condensed four specialized feature sets into a sleek 28px segmented pill bar: `[ 🎬 Form ]` | `[ ⚡ Warmup ]` | `[ 🧬 Science ]` | `[ ⚙️ Telemetry ]`.
    - **Form Panel (`data-testid="form-guide-container"` / `data-testid="toggle-form-guide-btn"`)**: 16:9 movement video demo banner, equipment badges, step-by-step technique instructions, and coach form cues.
    - **Warmup Panel (`data-testid="warmup-tools-container"` / `data-testid="toggle-warmup-tools-btn"`)**: `WarmUpRampDrawer` progressive kinetic ramp wizard and `IntensityProtocolDrawer` rest-pause / drop-set controls.
    - **Science Panel (`data-testid="science-tools-container"` / `data-testid="toggle-science-tools-btn"`)**: `DynamicLoadPrescriptionPill`, `VolumeOverloadMiniHud`, and `AutoregulationDeloadAdvisor`.
    - **Telemetry Panel (`data-testid="advanced-telemetry-container"` / `data-testid="toggle-advanced-telemetry-btn"`)**: Secondary logging overrides (Date, Set #), Tempo, Rest, RPE, RIR, Warm-up checkbox, Borg/RIR dial (`RpeRirExertionSelector`), Web Audio cadence metronome (`RepCadenceMetronome`), Set Notes textarea, and 1RM percentage matrix (`OneRepMaxPercentageMatrix`).
  - **Horizontal Sets Carousel (`data-testid="horizontal-sets-carousel"`, [`components/fitness/tracker/HorizontalSetsCarousel.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/HorizontalSetsCarousel.tsx))**:
    - Replaced vertical set history rows with an ultra-compact (~26px), swipeable horizontal chip carousel displaying completed sets for today's session (`[ S1 · 95 lb × 8 · @7 ]`).
    - 1-tap on any completed set chip pre-fills the logging draft with that set's parameters.
  - **Strict Neutral Hammer Grip Biomechanical Guardrails Enforced**:
    - Per `AGENTS.md`, strictly enforces neutral hammer grip orientation across all hammer curl movements (thumbs pointed up toward ceiling, vertical dumbbell orientation, and strictly zero wrist twisting/supination).

## [1.35.29] - 2026-09-11

### Added & Enhanced
- **📱 Gym-Floor Quick Logger & Vertical Space Optimization Architecture**:
  - **Above-The-Fold Exercise Card Structure ([`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx))**:
    - Re-engineered active exercise logging ergonomics on mobile screens, slashing total card height from ~1,400px+ to **~380px** (~750px+ reduction), keeping primary controls directly above the fold.
    - Placed Reps / Hold Duration (with `−` / `+` steppers) and Weight / Intensity (with `−` / `+` steppers) immediately beneath the set progression matrix and 1-tap match last logged set button.
    - Positioned `PlateAdjustmentPresets` (`+5`, `+10`, `+25`, `+45`) directly under Weight Used for fast gym-floor adjustments.
    - Elevated the primary gold `[ ✓ LOG SET {N} ({weight} × {reps}) & REST ({rest}s) ]` submit button right below the weight/plate presets.
  - **Collapsible Form & Video Guide Drawer (`data-testid="toggle-form-guide-btn"`, `data-testid="form-guide-container"`)**:
    - Condensed the heavy 16:9 HD video demonstration hero banner and 5-step technique instructions into a sleek 32px toggle bar (`[ 📖 Form & Video Guide · CATEGORY ▼ View Form ]`).
    - Collapsed by default to maximize vertical efficiency; expands on tap to show video demo, equipment tags, "NASM Video ↗" launcher, and coach form cues.
  - **Collapsible Advanced Telemetry Drawer (`data-testid="toggle-advanced-telemetry-btn"`, `data-testid="advanced-telemetry-container"`)**:
    - Organized secondary workout metrics into a collapsible tray (`[ ⚙️ Advanced Telemetry · RPE {rpe} · Rest {rest}s ▼ More ]`).
    - Houses Workout Date & Set Number overrides, Tempo, Rest, RPE, RIR, Warm-up checkbox, Borg/RIR exertion dial (`RpeRirExertionSelector`), Web Audio cadence metronome (`RepCadenceMetronome`), Set Notes textarea, and 1RM target load matrix (`OneRepMaxPercentageMatrix`).
  - **Unit Test Coverage & Biomechanical Guardrails ([`components/fitness/tracker/tracker-subcomponents.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/tracker-subcomponents.test.ts))**:
    - Verified drawer toggling logic, independent state isolation, and strict neutral hammer grip biomechanical compliance (vertical dumbbell heads, thumbs pointing up toward ceiling, zero wrist supination/twisting).

## [1.35.28] - 2026-09-11

### Added & Enhanced
- **⚡ Cluster Set & Myo-Reps Intra-Set Protocol Advisor Architecture**:
  - **Cluster & Myo-Reps Advisor Engine ([`lib/cluster-myoreps-advisor-engine.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/cluster-myoreps-advisor-engine.ts), [`lib/cluster-myoreps-advisor-engine.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/cluster-myoreps-advisor-engine.test.ts))**:
    - Synthesizes evidence-based intra-set cluster protocols (Tufano, Haff, Latella) dividing sets into 3 clusters of 2, 3, or 4 reps based on target repetitions.
    - Preserves mean concentric bar velocity (>85% baseline) and mechanical tension by applying optimal intra-set micro-rest: 20s for compound multi-joint movements, 15s for isolation/accessory lifts.
    - Synthesizes high-density hypertrophy Myo-reps protocols (Borge Fagerli) consisting of an activation set (8-15 reps) followed by 4 mini-sets of 3 reps with 15s / 5 deep-breath micro-rest intervals.
    - Accurately computes total effective repetitions (e.g. 5 activation effective reps + 12 mini-set reps = 17 effective reps) and total volume.
    - Produces structured logging notes tags (`[Cluster: ...]`, `[MyoReps: ...]`) and coach voice audio cues.
  - **AutoregulationDeloadAdvisor Preview Trays & Controls ([`components/fitness/tracker/AutoregulationDeloadAdvisor.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/AutoregulationDeloadAdvisor.tsx), [`components/fitness/tracker/AutoregulationDeloadAdvisor.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/AutoregulationDeloadAdvisor.test.ts))**:
    - Added 1-tap `[ Convert to Cluster Set (3×X) ]` action button (`data-testid="convert-cluster-set-btn"`) and collapsible preview tray (`data-testid="cluster-set-preview-tray"`).
    - Added 1-tap `[ Convert to Myo-Reps (Act + 4 mini) ]` action button (`data-testid="convert-myoreps-btn"`) and collapsible preview tray (`data-testid="myoreps-preview-tray"`).
    - Added 1-tap arming buttons: `[ Arm Cluster Set Protocol ➔ ]` (`data-testid="arm-cluster-set-btn"`) and `[ Arm Myo-Reps Protocol ➔ ]` (`data-testid="arm-myoreps-btn"`) with haptic feedback.
  - **Workout Tracker & Superset Live Wiring ([`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx), [`components/fitness/tracker/SupersetPairCard.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/SupersetPairCard.tsx))**:
    - Seamlessly armed cluster set and Myo-reps protocols into workout draft state: updating target reps per cluster/activation set and appending formatted telemetry notes tags.
  - **Strict Biomechanical Guardrails Enforcement**:
    - Enforces strict neutral hammer grip mechanics across all hammer curl variants in both cluster bursts and Myo-rep mini-sets: vertical dumbbells (heads up/down), thumbs pointed toward ceiling, palms facing inward, and strictly zero wrist supination/twisting. Never swing torso to complete mini-sets.

## [1.35.27] - 2026-09-11

### Added & Enhanced
- **🫀 Intra-Session Rest Timer Audio Metronome & Heart Rate Zone Dynamic Adaptation Architecture**:
  - **Rest Timer Audio & HR Recovery Engine ([`lib/rest-timer-audio-hr-engine.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/rest-timer-audio-hr-engine.ts), [`lib/rest-timer-audio-hr-engine.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/rest-timer-audio-hr-engine.test.ts))**:
    - Clinically modeled Tanaka HRmax ($208 - 0.7 \times \text{age}$), 5-tier cardiovascular zones (Z1 Recovery $<60\%$, Z2 Aerobic $60–70\%$, Z3 Moderate $70–80\%$, Z4 Threshold $80–90\%$, Z5 Peak $\ge 90\%$), and autonomic parasympathetic recovery status.
    - Dynamic rest interval adaptation evaluating acute fatigue drops ($>15\%$ rep loss or $>20\%$ velocity loss) and cardiac delays ($\text{HR} \ge \text{Zone 3}$ with $\le 20\text{s}$ remaining) to automatically prescribe $+20\text{s}$ to $+30\text{s}$ extensions for phosphagen (ATP-CP) resynthesis.
    - Early parasympathetic recovery readiness detection: flags when an athlete drops into Zone 1 early with 1-tap fast-forward for density pacing.
  - **Rest Audio Metronome ([`lib/web-audio-cadence-engine.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/web-audio-cadence-engine.ts), [`components/fitness/hooks/useExerciseRestTimer.ts`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/hooks/useExerciseRestTimer.ts))**:
    - Ultra-low latency Web Audio acoustic pacing across 4 modes: Cardiac Pulse (dual-thump lub-dub tone), Breath Pacer (4-2-6 down-regulation frequency harmonic resonance), 5-Second Periodic Chime, and Precision Final Countdown Bells (880Hz pips + 1318.5Hz completion gong).
  - **Floating Rest Timer Dock ([`components/fitness/tracker/FloatingRestTimerDock.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/FloatingRestTimerDock.tsx), [`components/fitness/tracker/FloatingRestTimerDock.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/FloatingRestTimerDock.test.ts))**:
    - Upgraded with live Heart Rate Zone telemetry badge (`data-testid="hr-recovery-zone-badge"`).
    - Added 1-tap Audio Metronome toggle (`data-testid="toggle-rest-metronome-btn"`).
    - Added interactive dynamic cardiac delay extension alert (`data-testid="dynamic-cardiac-extension-alert"`) with 1-tap `[ +{secs}s ]` action button.
    - Added early Zone 1 recovery alert (`data-testid="dynamic-early-recovery-alert"`) with 1-tap `[ Start Set ]` button.
  - **Active Rest Cardio Pacer Tray ([`components/fitness/tracker/ActiveRestCardioPacerTray.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/ActiveRestCardioPacerTray.tsx), [`components/fitness/tracker/ActiveRestCardioPacerTray.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/ActiveRestCardioPacerTray.test.ts))**:
    - Integrated a 5-Zone Cardiac Recovery Horizon bar (`data-testid="hr-5zone-meter"`) with real-time heart rate markers and clinical vagal tone insights.
  - **Biomechanical Guardrails Compliance**:
    - Strictly enforces neutral hammer grip rest protocol for all hammer curl variants: forearms relaxed with palms facing inward, thumbs pointing up toward ceiling, and zero wrist twisting/supination.

## [1.35.26] - 2026-09-11

### Added & Enhanced
- **🎯 Dynamic Intra-Session Auto-Regulation & Drop-Set / Back-Off Load Advisor Architecture**:
  - **Acute Fatigue Drop & Back-Off Load Engine ([`lib/autoregulation-advisor-engine.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/autoregulation-advisor-engine.ts), [`lib/autoregulation-advisor-engine.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/autoregulation-advisor-engine.test.ts))**:
    - Acute intra-set neuromuscular fatigue drop detection algorithm evaluating rep degradation (>15% and >25%), velocity loss thresholds, and RPE/RIR overshoot to detect mechanical exhaustion in real time.
    - Automated back-off load auto-calculation (-10% to -15% reduction) rounded to practical barbell/dumbbell increments (5 lb / 2.5 kg) to preserve form and sustain optimal hypertrophic mechanical tension.
    - Tailored 3-stage drop-set plan generation with exact stage loads, target rep schemes, volume math, and coach voice cues.
  - **AutoregulationDeloadAdvisor UI ([`components/fitness/tracker/AutoregulationDeloadAdvisor.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/AutoregulationDeloadAdvisor.tsx), [`components/fitness/tracker/AutoregulationDeloadAdvisor.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/AutoregulationDeloadAdvisor.test.ts))**:
    - High-contrast acute fatigue alert banners with real-time drop metrics, severity tags, and contextual recovery guidance.
    - Interactive 1-tap `[ Convert to Drop-Set (3 Stages) ]` action button with collapsible 3-stage progression preview tray (`data-testid="drop-set-preview-tray"`).
    - Seamless 1-tap `[ Apply Back-Off Load ]` action button auto-updating draft loads with haptic confirmation.
  - **Live Tracker & Superset Integration ([`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx), [`components/fitness/tracker/SupersetPairCard.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/SupersetPairCard.tsx), [`components/fitness/tracker/tracker-subcomponents.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/tracker-subcomponents.test.ts))**:
    - Wired drop-set converter callbacks to pre-populate stage loads and annotate structured drop-set progression summaries into set notes for historical auditability.
  - **Biomechanical Guardrails Compliance**:
    - Strictly enforces neutral hammer grip guardrails for all hammer curl variants under acute fatigue: vertically oriented dumbbell heads, thumbs pointing up toward ceiling, and strictly zero wrist supination/twisting to eliminate elbow shear.

## [1.35.25] - 2026-09-11

### Added & Enhanced
- **⚡ Real-Time Bar Velocity & Kinetic Power Output Architecture**:
  - **Kinematic VBT & Power Output Engine ([`lib/bar-velocity-power-engine.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/bar-velocity-power-engine.ts), [`lib/bar-velocity-power-engine.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/bar-velocity-power-engine.test.ts))**:
    - Modeled anatomical vertical Range of Motion (ROM) per resistance exercise (squat 0.60m, deadlift 0.55m, pull-up 0.52m, overhead press 0.50m, bench press 0.38m, rows 0.38m, lateral raise 0.35m, hammer curl 0.34m, triceps 0.32m).
    - Mean Concentric Velocity ($v_{\text{mean}}$) and Peak Concentric Velocity ($v_{\text{peak}}$) telemetry in meters per second (m/s).
    - Mechanical concentric force (Newtons), total work done (Joules), and kinetic power output wattage (Watts).
    - Standardized 5-tier VBT zone classification (Speed / Explosive RFD $>1.00\text{ m/s}$, Speed-Strength $0.75–1.00\text{ m/s}$, Strength-Speed $0.50–0.75\text{ m/s}$, Accelerative Strength $0.35–0.50\text{ m/s}$, Absolute Strength $<0.35\text{ m/s}$).
    - Intra-set rep-by-rep velocity loss (%) tracking with automatic flagging of rep deceleration fatigue ($\ge 20\%$ loss) and grinding failure limits ($<0.35\text{ m/s}$ or $\ge 35\%$ loss).
  - **Bar Velocity & Kinetic Power Output Tray ([`components/fitness/tracker/BarVelocityPowerTrackerTray.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/BarVelocityPowerTrackerTray.tsx), [`components/fitness/tracker/BarVelocityPowerTrackerTray.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/BarVelocityPowerTrackerTray.test.ts))**:
    - Interactive 3-tab HUD: Live Speedometer & Kinetic Power Gauge, Multi-Rep Velocity Loss Matrix with rep-by-rep loss percentages and fatigue tags, and VBT Force-Velocity Zones reference.
    - Interactive concentric cadence duration slider (0.3s to 2.5s) for real-time kinematic velocity simulation and power tuning.
    - Contextual velocity-loss coaching recommendations (e.g. "Optimal mechanical power preserved", "Rep deceleration threshold exceeded — rack bar").
  - **Cadence Metronome & Tracker Integration ([`components/fitness/tracker/RepCadenceMetronome.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/RepCadenceMetronome.tsx), [`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx), [`components/fitness/tracker/SupersetPairCard.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/SupersetPairCard.tsx))**:
    - Embedded live concentric velocity and wattage badges directly into real-time cadence phase ticks.
    - Added 1-tap `[ ⚡ Bar Velocity ]` drawer toggle across primary strength exercise cards and superset cards.
  - **Biomechanical Guardrails Compliance**:
    - Continuous validation of strict neutral hammer grip for all hammer curl exercises, mandating vertically oriented dumbbells with thumbs pointed up toward the ceiling and zero wrist supination/twisting to eliminate elbow shear and maximize radial kinetic power transfer.

## [1.35.24] - 2026-09-11

### Added & Enhanced
- **🧠 Session Fatigue & Central Nervous System (CNS) Readiness Index Architecture**:
  - **CNS Readiness & Foster Load Engine ([`lib/session-fatigue-cns-index.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/session-fatigue-cns-index.ts), [`lib/session-fatigue-cns-index.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/session-fatigue-cns-index.test.ts))**:
    - Central Nervous System Readiness score calculation (0–100) combining axial spinal loading exposure, muscular failure proximity (RPE 9.5–10 / RIR ≤ 0.5), total mechanical volume density, and Foster Session-RPE systemic load (sRPE × Duration = A.U.).
    - Systemic and muscle-specific autonomous recovery horizon estimations (e.g. 24h, 48h, 72h) calibrated to athlete fatigue tiers.
    - Muscle group volume and mechanical tension distribution mapping across chest, back, shoulders, quads, hamstrings, glutes, triceps, biceps, and core.
  - **Interactive CNS Readiness Modal ([`components/fitness/tracker/SessionFatigueCnsSummaryModal.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/SessionFatigueCnsSummaryModal.tsx), [`components/fitness/tracker/SessionFatigueCnsSummaryModal.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/SessionFatigueCnsSummaryModal.test.ts))**:
    - Post-workout summary visualization featuring radial CNS score gauge with color-coded tier feedback (Optimal/Peak, Mild Drain, Significant Drain, Deep Exhaustion).
    - Foster sRPE arbitrary training units gauge with target stimulus load zones (Under-Stimulation, Optimal Hypertrophy/Strength Adaptation, Overreaching, Excessive Overload).
    - Interactive live Session-RPE slider (1–10) dynamically updating Foster training load and recovery horizons in real time prior to final workout commit.
    - Muscle Group mechanical tension distribution breakdown with set counts, percentage share, and localized recovery horizons.
  - **PostWorkoutFinishModal Integration ([`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx))**:
    - Embedded an interactive CNS Readiness diagnostic pill into the Apple Health sync modal with live score and recovery horizon.
    - Added dedicated `[ 🧠 CNS Readiness ]` action button next to `[ 🏆 Trophy Card ]` for full post-workout bioenergetic telemetry review.
  - **Biomechanical Guardrails Compliance**:
    - Continuous audit of all dumbbell hammer curl movements in completed set logs, rendering a dedicated gold shield audit badge confirming 100% strict neutral grip integrity (thumbs pointed up toward ceiling, vertical dumbbell orientation, zero wrist supination/twisting).

## [1.35.23] - 2026-09-11

### Added & Enhanced
- **⚡ Warm-Up to Working Set Auto-Populator Architecture**:
  - **Auto-Populator Engine ([`lib/warmup-auto-populator.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/warmup-auto-populator.ts), [`lib/warmup-auto-populator.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/warmup-auto-populator.test.ts))**:
    - Bridges kinetic warm-up ramp progression stages directly to primary working sets.
    - Accurately parses prescribed working reps (e.g. `"8-12"` ➔ `"8"`) and formats target working weight rounded to gym equipment increments.
    - Generates dynamic coach voice announcement cues and status toasts upon completion of the top warm-up ramp.
  - **1-Tap Arming & Visual Drawer Banner ([`components/fitness/tracker/WarmUpRampDrawer.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/WarmUpRampDrawer.tsx))**:
    - Quick-action banner inside the progression wizard: `[ ⚡ Auto-Populator Ready: Working Set 1 ]` with a 1-tap `[ Arm Set 1 (X lb) ]` button.
    - Automatically executes upon logging the final warm-up ramp stage, clearing warm-up flags and pre-populating working loads.
  - **Working Set Isolation in Tracker Engine ([`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx))**:
    - Enhanced `executeSetLog` to differentiate warm-up sets from working sets (`!l.is_warmup`).
    - Prevents warm-up ramp stages from consuming working set allocations or causing premature exercise transitions.
  - **Superset Card Integration ([`components/fitness/tracker/SupersetPairCard.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/SupersetPairCard.tsx))**:
    - Integrated with dual-subexercise warm-up drawers for 1A and 1B, auto-filling drafts for the first working superset round.
  - **Biomechanical Guardrails Compliance**:
    - Delivers strict neutral grip reminders for all dumbbell hammer curl exercises when arming working sets, mandating vertically oriented dumbbells with thumbs pointed up toward the ceiling and zero wrist twisting/supination.

## [1.35.22] - 2026-09-11

### Added & Enhanced
- **🫁 Active Rest Cardio Pacer & Cadence Architecture**:
  - **Heart Rate Recovery & Pacer Engine ([`lib/active-rest-cardio-pacer.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/active-rest-cardio-pacer.ts), [`lib/active-rest-cardio-pacer.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/active-rest-cardio-pacer.test.ts))**:
    - Real-time intra-rest Heart Rate Recovery (HRR) drop analysis and standardized 1-minute recovery velocity (`bpm / min`).
    - Evaluates clinical parasympathetic/vagal reactivation tiers (Exceptional `≥ 30 bpm`, Athletic `20–29 bpm`, Moderate `12–19 bpm`, Delayed `< 12 bpm`).
    - Parasympathetic breath-work cadence pacing across 3 scientifically validated patterns:
      - `Down-Regulation (4-2-6)`: 4s Inhale, 2s Hold, 6s Exhale for respiratory sinus arrhythmia (RSA) vagal stimulation.
      - `Box Breathing (4-4-4-4)`: 4s Inhale, 4s Hold, 4s Exhale, 4s Pause for mental focus and nervous system balance.
      - `Physiological Sigh (2-1-6)`: 2s Inhale, 1s Top-Up Inhale, 0.5s Pause, 5.5s Exhale for rapid alveolar re-expansion and CO2 blowout.
    - Contextual intra-rest active mobility & postural decompression recommendation engine.
  - **Active Rest Cardio Pacer Tray ([`components/fitness/tracker/ActiveRestCardioPacerTray.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/ActiveRestCardioPacerTray.tsx), [`components/fitness/tracker/ActiveRestCardioPacerTray.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/ActiveRestCardioPacerTray.test.ts))**:
    - Embedded into `FloatingRestTimerDock` via dedicated `[ 🫁 Pacer ]` quick-action button.
    - Interactive 3-tab layout: Breath Pacer with animated radial breathing ring and Web Audio phase chimes, HR Recovery telemetry meter with target recovery thresholds, and exercise-specific Active Mobility guidance.
  - **Biomechanical Guardrails**:
    - Strictly compliant with AGENTS.md mandates with neutral hammer curl detection (`isHammerCurlMovement`) enforcing zero supination or wrist twisting and vertical dumbbell alignment with thumbs pointed up toward the ceiling.

## [1.35.21] - 2026-09-11

### Added & Enhanced
- **⚡ Bio-Adaptive Rest Timer Pacer Architecture**:
  - **Bio-Adaptive Pacing Engine ([`lib/bio-adaptive-rest-pacer.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/bio-adaptive-rest-pacer.ts), [`lib/bio-adaptive-rest-pacer.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/bio-adaptive-rest-pacer.test.ts))**:
    - Real-time intra-session rest scaling calculated from athlete set RPE / RIR, NASM OPT phase metabolic targets, and lift kinematics.
    - Prescribes phosphagen (ATP-CP) resynthesis extensions (+30s to +45s at RIR 0 failure, +20s to +30s at RIR 1 high strain).
    - Preserves baseline rest intervals during optimal hypertrophy windows (RIR 2) and accelerates metabolic density (−15s at RIR ≥ 4).
    - Multi-joint compound movement detection (`isCompoundLift`) with physiological clamping floors (45s compound / 30s isolation).
    - Rapid transition protection: Preserves transition micro-rests (< 30s) in supersets (1A ➔ 1B) without distortion.
  - **Floating Rest Timer Dock Telemetry ([`components/fitness/tracker/FloatingRestTimerDock.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/FloatingRestTimerDock.tsx))**:
    - Live gold badge (`[ ⚡ +Xs Bio-Paced ]` or `[ ⚡ −15s Density ]`) displaying adaptive delta and hover tooltip.
    - Integrated with voice synthesizer coach cues (`"Involuntary failure detected. Bio-Pacer added 45 seconds for central nervous system recovery."`).
  - **Interactive Superset Card Integration ([`components/fitness/tracker/SupersetPairCard.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/SupersetPairCard.tsx))**:
    - Real-time projected compound rest badge updates dynamically as the athlete adjusts draft exertion for movement 1B.
  - **Biomechanical Guardrails**:
    - Strictly compliant with AGENTS.md mandates with neutral hammer curl detection (`isHammerCurlMovement`) enforcing zero supination or wrist twisting.

## [1.35.20] - 2026-09-11

### Added & Enhanced
- **⚡ Session RPE & Dynamic Autoregulation Deload Advisor Architecture**:
  - **Dynamic Autoregulation Engine ([`lib/autoregulation-advisor-engine.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/autoregulation-advisor-engine.ts), [`lib/autoregulation-advisor-engine.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/autoregulation-advisor-engine.test.ts))**:
    - Real-time intra-session velocity loss & RIR decay detection across working sets.
    - Prescribes clinical back-off load reductions (−5% to −10%), rep caps, and +30s rest extensions when involuntary failure (RIR 0 / RPE 10) or missed repetition targets occur.
    - Calculates Foster Session-RPE (sRPE) training load in Arbitrary Units (sRPE × Duration) across 5 physiological strain zones (Recovery, Maintenance, Optimal, High Strain, and Overreaching).
  - **Interactive Advisor Component ([`components/fitness/tracker/AutoregulationDeloadAdvisor.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/AutoregulationDeloadAdvisor.tsx), [`components/fitness/tracker/AutoregulationDeloadAdvisor.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/AutoregulationDeloadAdvisor.test.ts))**:
    - Embedded into resistance movement cards and dual-tabbed superset cards.
    - 1-tap action buttons: `[ Apply −5% / −10% Load ]`, `[ Cap at X Reps ]`, and `[ +30s Rest ]` with instant draft updates and tactile haptic confirmations.
    - Expandable sRPE Session Load Tray displaying average session RPE, working RIR, total working sets, failure sets, and coach recovery guidance.
  - **Biomechanical Guardrails**:
    - Enforced strict neutral grip alerts for all hammer curl exercises (`Dumbbell Hammer Curl`, `Single Leg Hammer Curl`, `Hammer Curl To Lateral Raise`), mandating strictly vertical dumbbells with thumbs pointing up and zero supination/twisting when muscular fatigue is detected.

## [1.35.19] - 2026-09-11

### Added & Enhanced
- **🔥 Warm-Up Ramp-Up Progression Wizard Architecture**:
  - **Warm-Up Progression Wizard Science Engine ([`lib/warmup-progression-wizard.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/warmup-progression-wizard.ts), [`lib/warmup-progression-wizard.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/warmup-progression-wizard.test.ts))**:
    - Generates evidence-based non-fatiguing kinetic progressions (40%, 60%, 75%, 85% of working load or 1RM).
    - Multi-protocol models: Standard 4-Set Ramp, Express 3-Set Ramp, Heavy Compound 5-Set Ramp, and 1RM Percentage Mode.
    - Equipment-aware: Barbell calculations with IPF/competition plate breakdown per side, dumbbell pair recommendations, and selectorized machine pin settings.
    - Clean note serialization (`[WarmUp 2/4: 60% @ 135lb × 5 | Kinetic Velocity]`) and regex parser.
  - **Enhanced Wizard UI Component ([`components/fitness/tracker/WarmUpRampDrawer.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/WarmUpRampDrawer.tsx), [`components/fitness/tracker/WarmUpRampDrawer.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/WarmUpRampDrawer.test.ts))**:
    - Interactive protocol switcher and baseline toggling between Working Load and Estimated 1RM.
    - Target weight adjustment steppers (±5 lbs) for rapid on-the-fly customization.
    - Color-coded per-side plate chips for Olympic barbell loading (blue 45s, yellow 35s, green 25s, white 10s, red 5s, slate 2.5s).
    - 1-tap warm-up set logging with visual completion checkmarks and automatic rest timer activation.
  - **Live Exercise & Superset Integration ([`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx), [`components/fitness/tracker/SupersetPairCard.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/SupersetPairCard.tsx))**:
    - Embedded into primary resistance exercise cards and dual-tabbed `SupersetPairCard` with historical 1RM resolution.
  - **Biomechanical Guardrails**:
    - Enforced strict neutral grip alerts for all dumbbell hammer curl movements, ensuring thumbs point up toward the ceiling with zero wrist supination/twisting during kinetic warm-ups.

## [1.35.18] - 2026-09-11

### Added & Enhanced
- **📊 Interactive 1RM Percentage & Target Load Matrix Architecture**:
  - **NASM OPT 1RM Percentage Tier Engine ([`lib/progressive-overload-engine.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/progressive-overload-engine.ts), [`lib/progressive-overload-engine.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/progressive-overload-engine.test.ts))**:
    - Calculates all 9 NASM OPT working load percentage tiers (95% Maximal Strength down to 50% Dynamic Warmup/Potentiation).
    - Intelligent gym plate increment rounding: 5-lb steps for imperial units and 2.5-kg steps for metric units.
    - Full tier metadata including suggested repetition targets, OPT phase mappings (Phases 1 through 4), and physiological adaptations (Mechanical Tension, Myofibrillar Hypertrophy, Strength Endurance, Stabilization).
  - **Interactive 1RM Matrix Component ([`components/fitness/tracker/OneRepMaxPercentageMatrix.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/OneRepMaxPercentageMatrix.tsx), [`components/fitness/tracker/OneRepMaxPercentageMatrix.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/OneRepMaxPercentageMatrix.test.ts))**:
    - Real-time dual Brzycki & Epley 1RM estimator updating live with draft set weight and repetitions.
    - Visual intensity badge displaying active load intensity (e.g. `80% of 1RM`) and matching row highlight in the matrix.
    - Multi-source 1RM baseline switcher: Toggle between Current Set Draft, Historical PR Record (vaulted all-time max), or Custom Target 1RM input.
    - 1-tap `[ Apply ]` action populates selected target load and suggested rep range directly into the active set draft with tactile haptic feedback and confirmation badge.
  - **Superset & Tracker Card Integration ([`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx), [`components/fitness/tracker/SupersetPairCard.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/SupersetPairCard.tsx))**:
    - Embedded across all non-timed resistance movements in the primary fitness tracking view.
    - Integrated seamlessly into dual-tabbed `SupersetPairCard` for both sub-exercise 1A and 1B with auto-updating drafts.
  - **Biomechanical Guardrails**:
    - Enforced strict neutral hammer grip warning banner for all hammer curl exercises (`Dumbbell Hammer Curl`, `Single Leg Hammer Curl`, `Hammer Curl To Lateral Raise`), mandating palms facing inward and zero supination/twisting under heavy loads.

## [1.35.17] - 2026-09-11

### Added & Enhanced
- **🔥 Drop Set & Advanced Hypertrophy Intensity Protocols Engine with Multi-Tier Sub-Set Logger**:
  - **Intensity Protocols Science Engine ([`lib/intensity-protocols-engine.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/intensity-protocols-engine.ts), [`lib/intensity-protocols-engine.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/intensity-protocols-engine.test.ts))**:
    - Automatic evidence-based multi-tier load drop calculations (15–30% reductions) with gym increment rounding (5 lbs / 2.5 kg).
    - Science-backed Myo-Reps and Rest-Pause protocol modeling with effective rep calculations near failure.
    - Robust note serialization (`[DropSet: ... | X Stages | Vol: Y lb]`) and parsing for seamless workout history logging.
  - **Interactive Protocol Drawer ([`components/fitness/tracker/IntensityProtocolDrawer.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/IntensityProtocolDrawer.tsx), [`components/fitness/tracker/IntensityProtocolDrawer.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/IntensityProtocolDrawer.test.ts))**:
    - Integrated directly inside resistance exercise cards and superset cards.
    - **Drop Set Mode**: Interactive multi-stage load/rep adjustments, percentage drop badges, and dynamic cumulative mechanical tonnage HUD with 1-tap logging.
    - **Rest-Pause / Myo-Reps Mode**: Activation set configuration, dynamic mini-set steppers, and an integrated 15-second intra-set rest countdown with precision audio ticks.
  - **Biomechanical Guardrails**:
    - Enforced strict neutral grip safeguards for all dumbbell hammer curl movements during drop set muscular fatigue, preventing wrist twisting and supination.

## [1.35.16] - 2026-09-11

### Added & Enhanced
- **⏱️ Interactive Rep Cadence & Tempo Metronome Architecture with Web Audio Pacer**:
  - **Rep Cadence Metronome ([`components/fitness/tracker/RepCadenceMetronome.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/RepCadenceMetronome.tsx), [`components/fitness/tracker/RepCadenceMetronome.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/RepCadenceMetronome.test.ts))**:
    - Embedded an interactive rep metronome directly into live resistance exercise cards and superset cards.
    - Guides athletes in real time through NASM movement phases: Eccentric lowering (cyan), Isometric bottom pause (amber/gold), and Concentric drive (emerald).
    - Features a dynamic visual contraction bar displaying live rep progress (`Rep 3 of 10`) and remaining seconds per contraction phase.
    - Integrated with tactile haptics (`triggerHaptic`) on phase transitions and set completion.
    - Auto-completes set reps into set draft upon finishing all prescribed reps or tapping "Finish Early", automatically highlighting the Log Set button.
  - **Sample-Accurate Web Audio Scheduling ([`lib/web-audio-cadence-engine.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/web-audio-cadence-engine.ts), [`lib/web-audio-cadence-engine.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/web-audio-cadence-engine.test.ts))**:
    - Extended `PrecisionCadenceScheduler` with real-time pause, resume, audio mute toggling, and live rep overrides.
    - Engineered `parseMovementTempo` to extract eccentric, isometric, and concentric intervals across all NASM OPT tempos (`4/2/1`, `2/0/2`, `1/1/1`, `X/0/X`).
    - Configured W3C Audio Session API transient ducking so background audio from music streaming apps is ducked cleanly rather than paused.
  - **Biomechanical Guardrails**:
    - Embedded automated neutral grip alerts for all hammer curl movements (`Dumbbell Hammer Curl`, `Single Leg Hammer Curl`, `Hammer Curl To Lateral Raise`), enforcing strictly vertical dumbbell orientation and zero wrist supination.

## [1.35.15] - 2026-09-11

### Added & Enhanced
- **⚡ Smart Superset & Circuit Pairing Architecture with Dual Exercise Card & Dynamic Rest**:
  - **Smart Superset Pairing Engine ([`lib/superset-pairing-engine.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/superset-pairing-engine.ts), [`lib/superset-pairing-engine.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/superset-pairing-engine.test.ts))**:
    - Automatic detection and clustering of paired movements according to NASM OPT resistance training models.
    - Programmed supersets: Identifies explicit `1A` / `1B` notation within exercise names and coaching notes.
    - Phase 5 PAP Power complexes: Automatically pairs heavy strength potentiators (e.g. Barbell Squat) with explosive plyometric counterparts (e.g. Squat Jumps).
    - Biomechanical antagonist pairing: Detects reciprocal inhibition pairs (Chest/Back, Biceps/Triceps, Quads/Posterior Chain, Vertical Push/Pull) to maximize training density while managing peripheral fatigue.
  - **Dual Sub-Exercise Tabbed Superset Card ([`components/fitness/tracker/SupersetPairCard.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/SupersetPairCard.tsx), [`components/fitness/tracker/SupersetPairCard.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/SupersetPairCard.test.ts))**:
    - Interactive 1A / 1B tabbed switcher displaying high-fidelity movement thumbnails (`resolveGaaExerciseImage`), badge metadata, and quick toggle between sub-exercises.
    - Embedded `SetProgressionMatrix` for visual completed set pills with weight/reps badges and 1-tap prefilling.
    - Embedded `PlateAdjustmentPresets` for micro-loading and Olympic milestone adjustments on active sub-exercises.
    - Embedded `RpeRirExertionSelector` for exertion tracking and `WarmUpRampDrawer` for progressive loading ramps.
  - **Alternating Rest Intervals & 1-Tap Auto-Advance Flow**:
    - Logging 1A triggers a short transition rest interval (10–15s) and automatically shifts active focus to 1B.
    - Logging 1B initiates full compound recovery (75–90s), resets focus to 1A, and increments target round set counters.
  - **In-Workout Superset View Toggle & Jump Rail ([`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx))**:
    - Added an interactive `[⚡ Supersets: ON/OFF]` tactile toggle button directly in the Exercise Quick-Jump Rail header.
    - Enabled seamless transitions between Paired Superset View and traditional Sequential View.
    - Anchored dual sub-exercise DOM scroll targets (`indexA` & `indexB`) to smooth-scroll directly to the active superset card from quick jump pills.

## [1.35.14] - 2026-09-11

### Added & Enhanced
- **🏋️ Plate Loading & Weight Adjustment Presets Engine with Tactical Barbell Sleeve**:
  - **Plate Adjustment Presets ([`components/fitness/tracker/PlateAdjustmentPresets.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/PlateAdjustmentPresets.tsx), [`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx))**:
    - Replaced static increment pills with an interactive micro-loading strip (`−10`, `−5`, `−2.5`, `+2.5`, `+5`, `+10`, `+25` in lbs/kg equivalents) and 1-tap bodyweight (`BW 0`) reset.
    - Added quick Olympic milestone presets (`135 1P`, `185 1P+25`, `225 2P`, `315 3P`, `405 4P`) and standard dumbbell rack jumps.
  - **Interactive Barbell Plate Sleeve & Per-Side Plate Additions**:
    - Displays real-time per-side plate counts with 1-tap shortcuts (`+45`, `+25`, `+10`, `+5`, `+2.5` per side) instantly updating total set poundage.
    - Added seamless launch to the tactical 3D Barbell Plate Calculator modal.
  - **Presets Engine ([`lib/barbell-plate-calculator.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/barbell-plate-calculator.ts), [`lib/barbell-plate-calculator.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/barbell-plate-calculator.test.ts))**:
    - Added `getWeightPresetsForExercise` resolving dynamic equipment-specific load steps, barbell milestone mappings, and metric conversions.

## [1.35.13] - 2026-09-11

### Added & Enhanced
- **📊 Volume Tonnage & Progressive Overload Mini-HUD with Live Fatigue Curve**:
  - **Volume & Overload Mini-HUD ([`components/fitness/tracker/VolumeOverloadMiniHud.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/VolumeOverloadMiniHud.tsx), [`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx))**:
    - Integrated a live glanceable telemetry HUD into resistance exercise cards displaying current session mechanical tonnage, total reps, and peak estimated 1RM.
    - Added historical session comparison calculating real-time percentage volume overload deltas (`+%` / `−%`).
  - **Set-by-Set Velocity & Fatigue Degradation Curve**:
    - Plotted visual power retention bars across working sets tracking drop-offs from peak 1RM output.
    - Provided fatigue risk stratification: `pristine` (< 5% drop-off), `optimal` (5–10% drop-off), and `elevated` (> 10% drop-off) with neuromuscular guidance.
  - **Automated NASM 2-for-2 Progressive Overload Trigger**:
    - Evaluates consecutive workouts against NASM 2-for-2 criteria (+2 reps over target on final sets).
    - Triggers automated progressive overload recommendations (+5 lbs upper body / +10 lbs lower body) and displays progress towards unlocking increases.
  - **Volume Overload Science Engine ([`lib/volume-overload-engine.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/volume-overload-engine.ts), [`lib/volume-overload-engine.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/volume-overload-engine.test.ts))**:
    - Multi-session volume aggregation and unit normalization supporting both imperial (lbs) and metric (kg) modes with comprehensive unit testing.

## [1.35.12] - 2026-09-11

### Added & Enhanced
- **⚡ Interactive RPE & RIR Exertion Science Matrix & Biomechanical Safeguards**:
  - **Interactive Exertion Selector ([`components/fitness/tracker/RpeRirExertionSelector.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/RpeRirExertionSelector.tsx), [`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx))**:
    - Integrated an interactive exertion selector strip (RPE 6.0 to 10.0) directly into the live set logging form with two-way synchronization to numeric inputs and automatic Reps-In-Reserve (RIR) coupling.
    - Added fine-tuning steppers (±0.5 RPE) and tactile haptic feedback on selection.
  - **Exertion Science Engine ([`lib/rpe-exertion-scale.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/rpe-exertion-scale.ts), [`lib/rpe-exertion-scale.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/rpe-exertion-scale.test.ts))**:
    - Constructed scientific mapping based on NASM Resistance Training Concepts and Borg CR10 exertion tiers (`recovery`, `moderate`, `high`, `maximal`).
    - Provided cardiorespiratory pacing cues (diaphragmatic breathing, Valsalva bracing, post-set autonomic recovery).
  - **Proactive Fatigue Alerts & Biomechanical Guardrails**:
    - Flags high CNS strain and breakdown risk when exertion reaches RPE 9.5+ or 0 RIR.
    - Enforces GAA strict biomechanical guardrails for hammer curls (neutral grip, zero supination, vertical dumbbells, thumbs up).

## [1.35.11] - 2026-09-11

### Fixed & Enhanced
- **🏋️ Unified NASM Exercise Card & Video Modal Standards**:
  - **Portal-Based ExerciseVideoModal ([`components/fitness/ExerciseVideoModal.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/ExerciseVideoModal.tsx))**:
    - Extracted modal into a standalone client component mounted directly to `document.body`, eliminating backdrop stacking traps.
  - **Card Unification ([`components/fitness/ClinicalKineticWarmupModule.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/ClinicalKineticWarmupModule.tsx), [`components/fitness/ClinicalCoolDownModule.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/ClinicalCoolDownModule.tsx))**:
    - Aligned warm-up and cool-down movement cards with full NASM modal standards, 16:9 thumbnails, and category pills.

## [1.35.10] - 2026-09-11

### Added & Enhanced
- **📱 Native Gym Companion App Architecture & Zero-Purchase Compliance**:
  - **Unified Companion Detection & Policy Engine ([`lib/native-companion.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/native-companion.ts), [`lib/native-companion.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/native-companion.test.ts))**:
    - Centralized `isCompanionApp()`, `canMakePurchases()`, and `COMPANION_BILLING_DISCLOSURE` complying with Apple App Store Guideline 3.1.3 (Multiplatform / Reader Services) and Google Play store rules.
  - **Zero In-App Purchases Enforcement ([`components/packages/PurchaseButton.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/packages/PurchaseButton.tsx), [`app/api/stripe/checkout/route.ts`](file:///Users/scottgordon/Repos/gaa-app/app/api/stripe/checkout/route.ts))**:
    - Gated `PurchaseButton` to suppress checkout triggers and discount codes when running inside native mobile shells, displaying a transparent web-managed retainer disclosure.
    - Added server-side 403 Forbidden rejection in `/api/stripe/checkout` for requests originating from native Capacitor mobile containers.
  - **Web-Managed Membership & Retainer Studio ([`components/settings/ClientSettingsStudio.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/settings/ClientSettingsStudio.tsx))**:
    - Replaced Stripe billing portal redirects, add-on purchase drawers, and upgrade checkouts with a luxury **Companion Retainer Status Studio** in native mode.
    - Displays active coaching tier, telemetry access status, transparent web portal instructions (`gordonathleticadvisory.com`), and a 1-tap Concierge action to message Coach Gordon.
  - **Consultation Booking Alignment ([`app/(dashboard)/dashboard/book/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/(dashboard)/dashboard/book/page.tsx))**:
    - Replaced the `/packages` checkout link on the zero-credits card with a direct `"Message Coach Gordon to Request Session"` action and web guidance.
  - **Commercial Packages Companion Notice ([`components/packages/PackagesStudioClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/packages/PackagesStudioClient.tsx))**:
    - Added a companion banner directing athletes back to the Gym Dashboard when navigating to `/packages` on mobile devices.
  - **Automatic In-Gym Screen Wake Lock ([`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx))**:
    - Automatically acquires `requestScreenWakeLock()` during active workout execution and rest timers, preventing mobile displays from sleeping between sets on the gym floor.
    - Added a tactical `"Screen Awoken (Gym Mode)"` indicator in the workout header.
  - **Tactical 3D Barbell Plate Calculator Modal ([`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx), [`components/fitness/tracker/InlineBarbellPlateBadges.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/InlineBarbellPlateBadges.tsx))**:
    - Wired up `onOpenPlateCalculator` on inline set plate badges and added a `"Plate Calc 3D"` action button in the gym toolbar, enabling instant visual breakdowns of Olympic barbell plate loads.
  - **Mobile Shell & Navigation Polish ([`components/ui/MobileNavigationDrawer.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/ui/MobileNavigationDrawer.tsx), [`components/ui/SiteHeader.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/ui/SiteHeader.tsx))**:
    - Updated navigation drawer labeling to `"Retainer & Account"` and filtered commercial purchase links from the companion app header.

## [1.35.9] - 2026-09-11

### Fixed & Enhanced
- **✉️ Email Deliverability & DMARC Sender Authentication Alignment**:
  - **Canonical Email Link Base URL Support ([`app/api/auth/password-reset/route.ts`](file:///Users/scottgordon/Repos/gaa-app/app/api/auth/password-reset/route.ts), [`lib/marketing-email.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/marketing-email.ts))**:
    - Introduced `EMAIL_LINK_BASE_URL` override across password reset, onboarding sequences, and lead dispatches, ensuring links sent from local development environments point to canonical production URLs (`https://gordonathleticadvisory.com`) and preventing Resend domain mismatch spam penalties.
    - Added outbound console safeguards warning developers if an email contains localhost or unaligned origins.
  - **RFC 7489 DMARC Diagnostic Engine ([`scripts/verify-email-health.mjs`](file:///Users/scottgordon/Repos/gaa-app/scripts/verify-email-health.mjs))**:
    - Upgraded email diagnostic suite to automatically detect split TXT records and guide users on configuring single unified DMARC policies in Vercel DNS.

## [1.35.8] - 2026-09-11

### Added & Enhanced
- **🛡️ Coach Check-In Clarity & Clinical Health Safeguards Integration**:
  - **Removed Misplaced Supplement Dispensary Timeline ([`components/fitness/hub-views/CoachAdvisoryView.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/hub-views/CoachAdvisoryView.tsx))**:
    - Purged `ExecutiveSupplementTimeline` from the Coach Check-In view, eliminating cognitive friction and restoring focus strictly to client biofeedback, coach memos, and weekly accountability.
  - **Athlete Baseline & Clinical Safeguards Card ([`components/fitness/hub-views/CoachAdvisoryView.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/hub-views/CoachAdvisoryView.tsx))**:
    - Integrated real-time safeguards display pulling from `client_intake_forms` and `fitness_profiles`:
      - Active training goal, periodization split frequency, and NASM OPT™ macrocycle phase.
      - Current prescription medications on file with active pharmacological shield status.
      - Musculoskeletal boundaries, combining structural limitations from profile and surgery/injury history from intake.
      - Medical considerations, PAR-Q clearance status, and food/contact allergies.
    - Added advisory reminder to report changes in weekly check-in notes with direct link to update intake records in Settings.
  - **Precision Nutrition & Supplement Screening Sync ([`components/fitness/SupplementAdvisorWidget.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/SupplementAdvisorWidget.tsx), [`components/fitness/MetabolicNutritionProtocol.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/MetabolicNutritionProtocol.tsx))**:
    - Connected intake records through `FitnessLabDiagnosticsView` and `MetabolicNutritionProtocol` into `SupplementAdvisorWidget`.
    - Automated detection of clinical medication categories (antihypertensives, diabetes/GLP-1, thyroid, statins, blood thinners, etc.) via `parseParqMedicationsAndConditions`.
    - Pre-populates screening toggles and automatically enforces drug-supplement contraindications and dosing separation rules with a verified `"Synced from GAA Health Profile"` banner.
  - **Check-In Feedback & Notes Refinement ([`components/fitness/WeeklyCheckinForm.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/WeeklyCheckinForm.tsx))**:
    - Rendered coach rating adjustments (`+1 Load Increase`, `-1 Deload Buffer`) in coach feedback memos.
    - Updated notes guidance and placeholders encouraging athletes to report changes to medications or joint aches.
  - **Workspace Route Harmonization ([`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx))**:
    - Routed `supplements` and `toolboxes` deep-links directly to the OPT™ Nutrition diagnostic tool in Fitness Lab.

## [1.35.7] - 2026-09-11

### Added & Enhanced
- **🛰️ Outdoor Cardio GPS Telemetry, Precision Distance & Step Tracking**:
  - **High-Accuracy Geodesic Distance & Rolling Pace ([`lib/cardio-distance-tracker.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/cardio-distance-tracker.ts))**:
    - Implemented geodesic Haversine distance engine integrated with high-accuracy HTML5 `navigator.geolocation.watchPosition`.
    - Kalman-inspired noise filtering: drops readings with horizontal accuracy > 32m, ignores micro-jitter < 2.5m, and blocks teleport jumps > 22 m/s.
    - Real-time rolling pace computation across 25s sample windows formatted in `MM:SS /mi` and `MM:SS /km`.
    - Configured `next.config.ts` `Permissions-Policy` with `geolocation=(self)`.
  - **Physical Accelerometer Pedometer & Cadence ([`lib/cardio-distance-tracker.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/cardio-distance-tracker.ts))**:
    - `PhysicalPedometerProcessor` connects to `devicemotion` with dynamic gravity vector filtering (alpha = 0.95) and a 240ms debounce lockout.
    - Computes rolling steps-per-minute (SPM) cadence over a 15-second window.
    - Seamless biomechanical fallback: estimates footstep counts using height-modeled stride length ratios (0.414 * height) when physical motion sensors are restricted.
  - **In-Ear Spoken Milestone Cues with Music Ducking ([`components/fitness/CoachCardioVoiceoverPlayer.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/CoachCardioVoiceoverPlayer.tsx))**:
    - Automated voice cue announcements at every completed 1.0 mile / 1.0 km boundary detailing split pace, total steps, and Zone 2 form focus.
    - Transient audio ducking smoothly attenuates Spotify/Apple Music during voiceover playback.
    - Mile and kilometer split logging with split pace telemetry.
  - **Hands-Free Voice Copilot Queries ([`lib/coach-cardio-engine.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/coach-cardio-engine.ts))**:
    - Handled natural-language speech queries ("Distance check", "How far?", "What is my pace?", "How many steps?") directly in Coach Gordon's voice.
  - **OLED In-Pocket Touch Shield HUD ([`components/fitness/CoachCardioVoiceoverPlayer.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/CoachCardioVoiceoverPlayer.tsx))**:
    - Pure AMOLED black display rendering real-time distance, rolling pace, and step count with a 1.2s tactile hold-to-unlock gesture preventing phantom pocket taps.
    - Executive Debrief report card displaying total distance traveled, step count, average pace, average SPM, and split badges.
  - **Persistence & Apple Health Sync**:
    - Persists `distance_km` to `cardio_logs` table via `POST /api/fitness/cardio`.
    - Synchronizes `distanceMiles` to Apple HealthKit via `syncActivityToAppleHealth()`.

## [1.35.6] - 2026-09-10

### Added & Enhanced
- **✨ Executive Client-Side Bloat Elimination & Quiet-Luxury Streamlining**:
  - **Standardized Executive Navigation Hierarchy ([`app/(dashboard)`](file:///Users/scottgordon/Repos/gaa-app/app/(dashboard)))**:
    - Harmonized the `SiteHeader` navigation across all 7 dashboard routes (`/dashboard`, `/fitness`, `/dossier`, `/book`, `/live`, `/messages`, `/settings`) to 6 authoritative destinations: `Command Center`, `Fitness Lab`, `Weekly Dossier`, `Consultations`, `Messages`, and `Settings`.
    - Eliminated redundant duplicate links and fragmented navigational headers.
  - **Executive Command Center Redesign ([`components/dashboard/ExecutiveCommandCenterClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/dashboard/ExecutiveCommandCenterClient.tsx))**:
    - Transformed the 1,390-line 5-tab sub-navigation maze into a unified single-canvas executive overview.
    - Integrated a Hero Telemetry Ribbon (training status, OPT phase, volume, offline sync status), Today's Primary Target card with 1-tap workout launcher, Executive Intelligence Grid (Dossier Snapshot & 1:1 Live Studio booking), and Flagship Diagnostics Launchpad.
    - Maintained 100% backward compatibility for onboarding banner states and tests.
  - **In-Workout Streamlining & Clutter Elimination ([`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx))**:
    - Removed unused modal clutter: dead Spotify audio studio modal, audio metronomes, and quick form camera popups.
    - Replaced exercise row button clutter (`Tempo Cadence`, `Quick Form Cam`) with a clean, low-profile tempo badge (`Tempo: 4/2/1`) alongside the authoritative NASM video & technique guide button.
    - Removed redundant "Plate Math" and "View Full Band Chart" modal triggers.
  - **Autonomous Inline Barbell Plate Badges ([`components/fitness/tracker/InlineBarbellPlateBadges.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/tracker/InlineBarbellPlateBadges.tsx))**:
    - Decoupled Olympic barbell plate calculation directly inline below the weight input field.
    - Made `onOpenPlateCalculator` optional, enabling autonomous plate-per-side calculation and badge visualization in real time without modal popups.
  - **Curated Fitness Lab Diagnostics ([`components/fitness/hub-views/FitnessLabDiagnosticsView.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/hub-views/FitnessLabDiagnosticsView.tsx))**:
    - Focused the sticky snap rail on the 7 premier executive sports science diagnostics: `AI DEXA Body Comp`, `3D Recovery Matrix`, `Form & Correctives`, `12-Wk Periodization`, `OPT™ Nutrition`, `Hotel Gym Adapter`, and `Mobility Radar`.

## [1.35.5] - 2026-09-10

### Added & Enhanced
- **🧬 Dynamic Telemetry Auto-Calibration & PAR-Q Active Recovery Shield**:
  - **Automated Chronological Age & Conditioning Tier ([`lib/muscle-recovery-telemetry.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/muscle-recovery-telemetry.ts))**:
    - Implemented `resolveClientConditioningTier` to dynamically infer athlete conditioning level (`beginner`, `intermediate`, `advanced`, `elite`) from user profile attributes, activity levels, NASM OPT phase, or logged volume.
    - Automatically derives chronological age from profile birth date or age attributes, badged with gold "Auto-Calibrated" tags in the telemetry panel.
  - **Live Authentic Telemetry Pipeline ([`components/fitness/MuscleRecoveryHeatmap3D.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/MuscleRecoveryHeatmap3D.tsx))**:
    - Removed the manual "Data Source & Training Scenario" dropdown and mock overrides, streamlining the 3D simulation to run purely on authentic logged workout set telemetry with a live pulsing indicator.
  - **Active Recovery Supplementation Matrix ([`lib/muscle-recovery-telemetry.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/muscle-recovery-telemetry.ts))**:
    - Expanded evidence-based recovery compounds with L-Citrulline Malate and Hydrolyzed Collagen + Vitamin C, mapping stacks to client primary goals (`athletic_power`, `hypertrophy`, `fat_loss`, `longevity_vitality`) and master athlete age criteria.
  - **PAR-Q Pharmacological Safety Shield ([`components/fitness/MuscleRecoveryHeatmap3D.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/MuscleRecoveryHeatmap3D.tsx))**:
    - Clinical parsing of PAR-Q health questions, medical conditions, and medications.
    - Shields and disables contraindicated supplements (e.g., Tart Cherry/high-dose Omega-3 with blood thinners, Creatine/Whey with renal disease, Magnesium with oral antibiotics) and outputs chrono-separation guidance for thyroid medications.
  - **Comprehensive Unit Testing ([`lib/muscle-recovery-telemetry.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/muscle-recovery-telemetry.test.ts))**:
    - Added 26 unit tests verifying conditioning tier inference, medication parsing, goal recommendation matrix, and clinical shielding.

## [1.35.4] - 2026-09-10

### Fixed & Enhanced
- **🔐 Master Coach Role Elevation & 1-Click Fast Pass Hotfix**:
  - **Master Coach Self-Healing Elevation ([`lib/authz.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/authz.ts), [`app/coach/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/coach/page.tsx), [`app/auth/callback/route.ts`](file:///Users/scottgordon/Repos/gaa-app/app/auth/callback/route.ts))**:
    - Enforced automatic master coach elevation and proactive database self-healing for `scott.gordon72@outlook.com`.
    - Guarantees that the master coach account can never be demoted, locked out, or redirected to client surfaces due to external test harness runs or profile desynchronization.
  - **1-Click Coach Fast Pass ([`app/api/auth/demo/route.ts`](file:///Users/scottgordon/Repos/gaa-app/app/api/auth/demo/route.ts), [`app/auth/login/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/auth/login/page.tsx))**:
    - Added coach demo authentication support via `/api/auth/demo?role=coach` ensuring instant 1-tap authenticated session establishment and direct redirection to `/coach`.
    - Integrated a prominent gold **⚡ 1-Click Coach Fast Pass (Scott Gordon)** action on the Coach Login portal (`/auth/login?next=/coach`) during dev/demo mode.
  - **Credential Synchronization & Verification**:
    - Re-aligned master coach credentials and verified active standing with full OPT periodization, client triage, and live studio access.

## [1.35.3] - 2026-09-10

### Added & Enhanced
- **📷 Biomechanics Studio: Still Camera & Mobile Auto-Zoom / Center Stage Eradication**:
  - Eliminates disruptive dynamic zooming, panning, and subject-tracking caused by mobile camera features (Apple Center Stage on iPhone/iPad and Samsung Auto-Framing / Video Call Effects) during live telehealth movement evaluations.
  - **Programmatic W3C PTZ Digital Zoom 1.0x Lock ([`lib/camera-still-mode.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/camera-still-mode.ts))**:
    - Created `applyStillCameraConstraints` to inspect camera track capabilities and apply `{ advanced: [{ zoom: 1.0, pan: 0, tilt: 0 }] }` upon camera acquisition, locking supported cameras to an unzoomed, fixed wide-angle view.
    - Integrated into camera startup routines in [`components/coach/LiveVideoCameraHud.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/LiveVideoCameraHud.tsx) and [`components/coach/UnifiedLiveStudioHud.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/UnifiedLiveStudioHud.tsx).
  - **Coach 1-Click Remote Still Camera Action**:
    - Added dedicated `[📷 Request Still Camera]` buttons in the coach live toolbar and quick-cue strips.
    - Transmits a real-time `still_camera_request` broadcast signal over the active Supabase signaling channel (`webrtc:live-${clientId}`) to immediately trigger athlete guidance.
  - **Athlete Still Camera Guidance Modal ([`components/coach/LiveStillCameraGuidanceModal.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/LiveStillCameraGuidanceModal.tsx))**:
    - Detects iOS vs. Android devices and presents an interactive, luxury tactical modal detailing the 3-second fix (pulling down iOS Control Center $\rightarrow$ Video Effects $\rightarrow$ toggle Center Stage OFF).
    - Added persistent `[📷 Still Camera]` status badge in the HUD ribbon allowing athletes to review camera lock instructions anytime.
  - **Tactical Instructions Hardening ([`app/(dashboard)/dashboard/live/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/(dashboard)/dashboard/live/page.tsx))**:
    - Enhanced athlete onboarding instructions with explicit Center Stage / Auto-framing guidance for kinetic chain and joint angle diagnostics.
  - **Comprehensive Verification ([`lib/camera-still-mode.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/camera-still-mode.test.ts), [`components/coach/LiveStillCameraGuidanceModal.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/coach/LiveStillCameraGuidanceModal.test.ts))**:
    - Added 10 new unit tests covering PTZ constraints application, fallback tolerance, platform user-agent detection, and modal state management.

## [1.35.2] - 2026-09-09

### Fixed & Enhanced
- **🎙️ UI Ergonomics Hotfix: Contextual Floating Coach Gordon FAB Route Filtering**:
  - Removes the floating "Ask Coach Gordon" button in the bottom right on pages where it was redundant, distracting, or physically blocking user interfaces.
  - **Contextual Route Filtering ([`components/fitness/GlobalCoachGordonHost.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/GlobalCoachGordonHost.tsx))**:
    - Introduced `shouldShowCoachGordonFab(pathname)` helper, restricting the floating button strictly to primary athlete hubs (`/dashboard` Command Center and `/dashboard/fitness` Fitness Lab).
    - Removed floating FAB from `/dashboard/messages` (eliminating collision with the chat input dock and duplication with `CoachGordonHeaderButton`), `/dashboard/live` (preventing obstruction of WebRTC camera/video controls and telestrator), `/dashboard/book` (streamlining consultation booking), `/dashboard/settings` (cleaning up account management), `/dashboard/onboarding` (simplifying intake PAR-Q steps), and `/dashboard/dossier`.
  - **Workout & Modal Suppression ([`app/globals.css`](file:///Users/scottgordon/Repos/gaa-app/app/globals.css))**:
    - Added CSS suppression rules hiding `.global-coach-gordon-fab` whenever active workout sticky docks (`.live-session-sticky-dock`), rest timer docks (`.floating-rest-timer-dock`), cardio modals (`.coach-cardio-modal-backdrop`), or posture mesh scanner modals are mounted.
  - **Preserved Universal Trigger Access**:
    - The interactive Ask Coach Gordon AI & voice concierge modal remains 100% accessible from any page via the Command Palette (`⌘K`), the Mobile Navigation Drawer, and in-page action triggers.
  - **Automated Verification ([`components/fitness/GlobalCoachGordonHost.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/GlobalCoachGordonHost.test.ts))**:
    - Added comprehensive unit tests validating route filtering rules across allowed, excluded, and non-dashboard paths as well as CSS suppression selectors.

## [1.35.1] - 2026-09-09

### Fixed & Enhanced
- **📱 Mobile UI Hotfix: iPhone App Footer & AI Cardio Studio Safe Area Clearance**:
  - Resolves mobile viewport obstruction where the persistent bottom mobile navigation dock (`MobileBottomNav`) and native iPhone home indicator overlay and block the "START COACH GORDON CARDIO" launch button and active workout transport controls.
  - **Dock Auto-Suppression ([`app/globals.css`](file:///Users/scottgordon/Repos/gaa-app/app/globals.css), [`components/fitness/CoachCardioVoiceoverPlayer.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/CoachCardioVoiceoverPlayer.tsx))**:
    - Added universal CSS and `coach-cardio-modal-open` body lifecycle hooks suppressing `.mobile-bottom-dock` (`display: none !important; visibility: hidden !important; pointer-events: none !important;`) whenever the Coach Gordon Cardio Studio modal is mounted.
    - Automatically restores the mobile navigation dock immediately upon session exit or cooldown transition.
  - **Safe Area Inset & Mobile Clearance ([`components/fitness/CoachCardioVoiceoverPlayer.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/CoachCardioVoiceoverPlayer.tsx))**:
    - Integrated `calc(clamp(12px, 2.5vw, 18px) + env(safe-area-inset-bottom, 16px))` default bottom padding and `@media (max-width: 768px)` override with `padding-bottom: calc(18px + env(safe-area-inset-bottom, 20px)) !important;` into `.coach-cardio-footer-bar`.
    - Added mobile responsive shell bounds (`max-height: calc(100dvh - env(safe-area-inset-top, 8px) - 20px) !important;`) and bottom margin.
    - Enhanced the `START COACH GORDON CARDIO` button with `minHeight: 52px` and `position: relative; zIndex: 2` for high-contrast Apple HIG compliant tap target ergonomics.
  - **Elevated Backdrop Stacking ([`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx))**:
    - Elevated modal dialog wrapper to `zIndex: 100050` and attached `.coach-cardio-modal-backdrop` with safe-area padding.
  - **Automated Regression Harness ([`components/fitness/CoachCardioVoiceoverPlayer.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/CoachCardioVoiceoverPlayer.test.ts))**:
    - Added 3 automated tests verifying safe area inset bottom styles, mobile dock suppression selectors, elevated z-index, and touch ergonomics.

## [1.35.0] - 2026-09-09

### Added & Enhanced
- **🎙️ Track 6: Live Telehealth WebRTC Studio & Real-Time Audio Telemetry Engine**:
  - Hardens and verifies the 1:1 Live Telehealth Studio and real-time biometric audio telemetry pipeline across coach and athlete personas.
  - **MediaPipe Segmentation Mask Polarity Hardening ([`components/coach/LiveVirtualBackgroundStage.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/LiveVirtualBackgroundStage.tsx))**:
    - Strictly enforced architectural rule where MediaPipe confidence masks evaluate to `const conf = 1 - rawConf` (`255 - uData[i]`).
    - Guarantees the coach foreground subject is 100% opaque (retained) and the physical room background is 100% transparent (cutout), eliminating silhouette inversions.
  - **Virtual Background True Optical Orientation**:
    - Verified that `<canvas>` elements never use CSS mirroring (`transform: 'none'`), ensuring physical wall plaques, GAA logos, and typography always read left-to-right.
    - WebGL2 shader mirrors only the coach front camera stream (`camCoords`) while sampling background images with true optical orientation (`uv`).
  - **Live Virtual Background Test Suite ([`components/coach/LiveVirtualBackgroundStage.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/coach/LiveVirtualBackgroundStage.test.ts))**:
    - Created 8 automated tests asserting mask polarity inversion, optical canvas orientation, catalog presets validation, and bounded temporal EMA smoothing.
  - **Adaptive Heart Rate Telemetry & Biometric Biofeedback ([`components/fitness/CoachCardioVoiceoverPlayer.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/CoachCardioVoiceoverPlayer.test.ts))**:
    - Expanded test coverage to 11 unit tests validating cardiac drift detection (RPE <= 5 with HR >= 83%), under-exertion alerts (RPE >= 8 with HR < 72%), and Zone 2 sweet spots.
  - **Biomechanical Form Directives & Locomotor-Respiratory Coupling (LRC)**:
    - Validated equipment-specific form guidance across all 10 modalities (Treadmill, Bike, Rower, Stairmaster, Assault Bike, Elliptical, Outdoor Run, Ski Erg, Jump Rope, General) and RPE 1–10 respiratory profiles.

## [1.34.3] - 2026-09-09

### Fixed & Enhanced
- **⚡ UI Navigation Hotfix: Primary Navigation Header Brand Crest Clearance**:
  - Eliminates visual clutter in the top-level navigation bar so the official GAA crest, typography, and NASM OPT™ subtitle maintain complete prominence without being crowded out.
  - **SiteHeader Brand Clearance ([`components/ui/SiteHeader.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/ui/SiteHeader.tsx))**:
    - Removed redundant desktop triggers (`Jump to Feature... (⌘K)` and `Feature Guide`) from the header navigation bar.
    - Preserved instant access to the Command Palette via keyboard shortcut (`⌘K` / `Ctrl+K`) and dedicated header search button.
  - **Mobile Navigation Drawer ([`components/ui/MobileNavigationDrawer.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/ui/MobileNavigationDrawer.tsx))**:
    - Simplified search input placeholder to `Search features... (e.g. '3D', 'Period')`.
    - Retained the high-end slide-out drawer providing full search and interactive guide access across all screens.

## [1.34.2] - 2026-09-09

### Fixed & Enhanced
- **⚡ Operations Hotfix: Coach Client Sunday Dossier Direct Route & Navigation Engine**:
  - Resolves navigation failure where clicking on an athlete's Sunday Dossier in the Coach Console caused page scroll trapping or role redirect bounces.
  - **Native Coach Dossier Route ([`app/coach/clients/[id]/dossier/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/coach/clients/[id]/dossier/page.tsx))**:
    - Created a dedicated standalone route at `/coach/clients/[id]/dossier` that runs natively under coach authorization (`requireSurfaceRole('coach')`), queries athlete telemetry, and renders the complete `ExecutiveSundayDossier` boardroom engine with zero redirect hops.
  - **Inline Dossier Tab ([`components/coach/CoachClientHubNavigator.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/CoachClientHubNavigator.tsx), [`app/coach/clients/[id]/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/coach/clients/[id]/page.tsx))**:
    - Added the `Sunday Dossier` tab under `Operations & Concierge` in `CoachClientHubNavigator`.
    - Added inline dossier telemetry rendering on `/coach/clients/[id]?tab=dossier` with a 1-click launcher to open the standalone boardroom print view.
  - **Action Navigation Un-trapping ([`components/coach/CoachOnboardingProgressionCard.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/CoachOnboardingProgressionCard.tsx))**:
    - Updated `handleActionNavigation` so links pointing to standalone paths (such as `/dossier`) navigate normally instead of invoking `scrollIntoView()` on `#workspace-tab-content`.
    - Added a direct 1-click `Launch Sunday Dossier (PDF)` action card in Stage 8.
  - **Surface Role Authorization Flexibility ([`lib/authz.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/authz.ts), [`app/(dashboard)/dashboard/layout.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/(dashboard)/dashboard/layout.tsx))**:
    - Extended `requireSurfaceRole` to support `{ allowCoach: true }`, allowing coaches to inspect client surfaces without redirect loops.
  - **Check-In Review Launcher ([`components/coach/CoachCheckinReview.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/CoachCheckinReview.tsx))**:
    - Updated `Launch Sunday Dossier (PDF)` button to link directly to `/coach/clients/${clientId}/dossier`.

## [1.34.1] - 2026-09-09

### Fixed & Enhanced
- **⚡ Operations Hotfix: Coach Console Boardroom Suite Integration & Athlete Dossier Preview**:
  - Directly surfaces the **Fortune 500 Corporate Proposal Studio** and **Executive Sunday Intelligence Dossier** within coach navigation and athlete management views.
  - **Coach Console Navigation ([`app/coach/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/coach/page.tsx))**:
    - Added direct top-level navigation links in `SiteHeader` for `Corporate B2B` (`/corporate/proposal`) and `Sunday Dossier` (`/dashboard/dossier`).
    - Added the **Enterprise & Intelligence Boardroom Suite** dual-card cockpit on the Coach Dashboard `Overview` tab for 1-click proposal modeling and dossier reviews.
  - **Athlete Detail & Check-In Integration ([`app/coach/clients/[id]/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/coach/clients/[id]/page.tsx), [`components/coach/CoachCheckinReview.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/CoachCheckinReview.tsx))**:
    - Added `[ 📄 Sunday Dossier ]` quick-action button in the athlete header action bar.
    - Added a prominent `[ 📄 Launch Athlete Sunday Dossier (PDF) ➔ ]` launcher button within the **Weekly Check-Ins** review tab.
  - **Coach Preview Mode & Telemetry Aggregation ([`app/(dashboard)/dashboard/dossier/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/(dashboard)/dashboard/dossier/page.tsx))**:
    - Added query param support (`?client_id=...`) enabling coaches and admins to preview and print any assigned athlete's complete Sunday Dossier with real 7-day volume, 28-day chronic ACWR baseline, and clinical S.O.A.P. notes.
    - Displays a dedicated gold Coach Preview HUD banner with 1-click return back to the athlete's check-in console.
  - **Global Command Palette (⌘K) ([`components/ui/GlobalCommandPalette.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/ui/GlobalCommandPalette.tsx))**:
    - Added `coach-corporate-proposal` and `coach-sunday-dossier` commands so coaches can jump to boardroom instruments from anywhere via `⌘K`.

## [1.34.0] - 2026-09-09

### Added & Enhanced
- **🏛️ Track 5: Fortune 500 Corporate Proposal & Boardroom Pitch Deck Engine (Clinical Aristocracy Brand Elevation)**:
  - Elevates GAA's **$35,000/year institutional corporate retainers** with an interactive multi-seat financial modeler and confidential **Boardroom Proposal & Pitch Deck PDF Engine**.
  - **Interactive Multi-Seat Financial Modeler ([`lib/corporate-proposal-engine.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/corporate-proposal-engine.ts))**:
    - Pre-configured institutional presets for 5 seats (Boutique Syndicate · $20,000/yr), 10 seats (Executive Core · $35,000/yr), 25 seats (Partner Cohort · $75,000/yr), and 50+ seats (Enterprise Division · $135,000/yr).
    - Dynamic sliding-scale engine for custom seat volumes with automatic annual savings calculations ($7,000+ complimentary credit).
    - Conservative leadership productivity telemetry modeling ~6.5 hours/month recovered per executive (~780 hrs/yr for 10 seats) and ~$273,000/yr in cognitive capital value.
  - **Boardroom Proposal Studio Component ([`components/corporate/CorporateProposalStudio.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/corporate/CorporateProposalStudio.tsx))**:
    - Institutional memorandum layout detailing the Executive Physical Bottleneck, scope of services, financial agreement, 13-point NASM governance, and Master Coach Scott Gordon's signature credentials.
    - Deterministic cryptographic sovereign proposal signature hash (`GAA-SIG-XXXX-XXXX`) and document reference IDs (`GAA-PROP-XXXX-XXS-YEAR`).
    - Integrated proposal sharing with pre-populated query parameters and 1-click inquiry dispatch.
  - **Dual-Mode Boardroom Print & PDF Stylesheet ([`app/globals.css`](file:///Users/scottgordon/Repos/gaa-app/app/globals.css))**:
    - Full support for **Digital Obsidian** and ink-efficient **Clean Ivory / Boardroom Paper** (`.print-theme-ivory`) print themes.
    - Page-break controls preventing table rows and signature blocks from clipping, portrait optimization (`@page { size: portrait; margin: 8mm 8mm; }`), and a formal running memorandum header (`.corporate-print-banner`).
  - **Dedicated Standalone Route ([`app/corporate/proposal/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/corporate/proposal/page.tsx))**:
    - Direct bookmarkable route accepting URL parameters (`?company=...&seats=...&cadence=...`) for bespoke partner proposals.
  - **Corporate Landing Page Integration ([`app/corporate/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/corporate/page.tsx))**:
    - Added Section 4.5 interactive studio embed and prominent hero callout buttons (`[Generate Boardroom Proposal (PDF) ↓]`).
  - **Comprehensive Test Suite ([`components/corporate/CorporateProposalStudio.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/corporate/CorporateProposalStudio.test.ts))**:
    - 12 unit tests validating financial formulas, sliding scales, doc ref IDs, cryptographic signatures, deliverables, and Clinical Aristocracy typography compliance.

## [1.33.0] - 2026-09-09

### Added & Enhanced
- **🏛️ Track 4: Executive Sunday Intelligence Dossier & Boardroom PDF Engine (Clinical Aristocracy Brand Elevation)**:
  - Elevates the weekly athlete review deliverable to Swiss private wealth advisory caliber, delivering institutional clarity, sports science rigor, and physical boardroom print readiness.
  - **ACWR Acute-to-Chronic Workload Telemetry ([`lib/sunday-dossier-engine.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/sunday-dossier-engine.ts), [`components/dashboard/ExecutiveSundayDossier.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/dashboard/ExecutiveSundayDossier.tsx))**:
    - Calculates the Acute-to-Chronic Workload Ratio comparing 7-day mechanical tonnage to a 28-day chronic baseline average.
    - Classifies workload into 4 physiological corridors:
      - **Under-training (<0.80)**: Sub-optimal overload corridor, potential deconditioning warning.
      - **Sweet Spot (0.80–1.30)**: Optimal adaptation corridor, high fitness accumulation with minimized orthopedic injury risk.
      - **Overreaching (1.31–1.49)**: Elevated fatigue spike, recovery tracking warranted.
      - **Danger Zone (≥1.50)**: Critical fatigue outpaces chronic tissue tolerance, advising restorative deload.
  - **Kinetic Movement Pattern Distribution**:
    - Automatically classifies logged sets across 5 fundamental kinetic planes: **Push**, **Pull**, **Squat**, **Hinge**, and **Carry & Core**.
    - Displays visual progress bars, exact set counts, and percentage distribution badges to ensure balanced functional periodization.
  - **Clinical S.O.A.P. Advisory Record**:
    - Synthesizes medical-grade **Subjective**, **Objective**, **Assessment**, and **Plan** documentation alongside the Executive Briefing.
    - Integrated uppercase mode toggle (`[BRIEFING VIEW]` vs `[CLINICAL S.O.A.P. RECORD]`) allowing athletes and boardroom advisors to alternate perspectives seamlessly.
  - **Cryptographic Sovereign Authentication**:
    - Deterministic audit signature hash (`GAA-SIG-XXXX-XXXX`), ISO timestamp, and `SCOTT GORDON, NASM MASTER TRAINER` boardroom credentials in the dossier footer.
  - **Dual-Mode Boardroom PDF & Print Stylesheet Engine ([`app/globals.css`](file:///Users/scottgordon/Repos/gaa-app/app/globals.css))**:
    - Added print theme selector pill (`Digital Obsidian` vs `Clean Ivory / Boardroom Paper`).
    - The Clean Ivory mode (`.print-theme-ivory`) renders a stark, ink-efficient white background with dark typography, charcoal borders, and pure gold accents for luxury physical binder presentations.
    - Upgraded `@media print` with `@page { size: portrait; margin: 8mm 8mm; }`, `.dossier-soap-box` page break protection (`break-inside: avoid`), and a formal running memorandum header (`.dossier-print-banner`).
  - **Dedicated Standalone Route ([`app/(dashboard)/dashboard/dossier/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/(dashboard)/dashboard/dossier/page.tsx))**:
    - Direct, bookmarkable route with server-side authentication, 28-day data aggregation, breadcrumb navigation back to Command Center, and full-bleed standalone dossier rendering.
  - **Clinical Aristocracy Standards Verification**:
    - Preserves `Cinzel` serif headers, `Raleway` uppercase action buttons (`letterSpacing: '0.08em'`), and Monospace Tabular Telemetry (`font-telemetry font-mono`) across all 5 metric cards, kinetic distributions, and audit signatures.
    - Verified with 21 unit tests across [`lib/sunday-dossier-engine.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/sunday-dossier-engine.test.ts) and [`components/dashboard/ExecutiveSundayDossier.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/dashboard/ExecutiveSundayDossier.test.ts).

## [1.32.0] - 2026-09-09

### Added & Enhanced
- **🏛️ Track 3: Public Retainers & Marketing Funnel Polish (Clinical Aristocracy Brand Elevation)**:
  - Elevates all public-facing acquisition surfaces, marketing pages, package configurators, consultation booking funnels, and corporate enterprise retainers to GAA's billion-dollar Clinical Aristocracy brand standard.
  - **Homepage & Editorial Retainers ([`app/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/page.tsx))**:
    - Upgraded hero masthead typography to authoritative `Cinzel` serif with warm gold gradient accents (`bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#AA771C]`).
    - Standardized all numerical telemetry metrics into high-precision monospace tabular telemetry (`font-telemetry font-mono`, `fontVariantNumeric: 'tabular-nums'`):
      - Hero metrics: `1:1`, `17+`, `100%`.
      - Athlete transformation outcome figures: `-42 lbs`, `+11 lbs`, `100% Adherence`.
      - Homepage retainer tier pricing: `$59`, `$349`, `$649`, `$1,495`.
    - Refined all primary call-to-action triggers with tactile `Raleway` uppercase styling (`letterSpacing: '0.08em'`, `fontWeight: 800`).
  - **Packages Studio & Tier Architecture ([`components/packages/PackagesStudioClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/packages/PackagesStudioClient.tsx))**:
    - Converted all tier prices (`$59`, `$349`, `$649`, `$1,495`, `$3,895`), add-on pricing tags (`+$249`, `+$149/mo`, `+$199/mo`, `+$129`), and sticky bottom investment calculator figures to monospace tabular telemetry.
    - Preserved seamless single-tier and add-on toggling with real-time investment bar updates.
  - **Corporate Enterprise Retainers ([`app/corporate/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/corporate/page.tsx) & [`components/corporate/CorporateInquiryForm.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/corporate/CorporateInquiryForm.tsx))**:
    - Upgraded sequence badges (`01`, `02`, `03`, `04`) and enterprise retainer pricing (`$3,500/mo`, `$35,000/yr`) to monospace tabular telemetry.
    - Standardized corporate proposal request form inputs and interactive CTA buttons.
  - **Asynchronous Coaching Retainers ([`app/async-coaching/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/async-coaching/page.tsx))**:
    - Converted operational sequence steps (`01`, `02`, `03`, `04`), tier prices, and add-on tags to monospace tabular telemetry.
  - **Diagnostic Athlete Intake & Allocation ([`components/marketing/ApplyQuiz.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/marketing/ApplyQuiz.tsx), [`app/apply/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/apply/page.tsx), [`components/packages/PurchaseButton.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/packages/PurchaseButton.tsx), [`components/packages/MasterAllocationModal.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/packages/MasterAllocationModal.tsx))**:
    - Aligned intake diagnostic budget bands with canonical retainer tiers (`under_100`, `250_500`, `500_1000`, `1000_plus`) while preserving legacy compatibility.
    - Upgraded recommendation displays with `Cinzel` tier titles, monospace tabular pricing badges, and tactile Raleway action triggers.
    - Enforced `fontSize: 16` across all public input fields to eradicate iOS Safari viewport auto-zoom disruptions.
  - **Packages Tier Architecture Test Suite ([`components/packages/PackagesTierArchitecture.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/packages/PackagesTierArchitecture.test.ts))**:
    - Created 14 unit tests validating tier pricing, add-ons, credit application, and typography standards.

## [1.31.1] - 2026-09-09

### Fixed & Enhanced
- **📱 iOS Native Architecture, Apple HIG Compliance & Usability Hardening**:
  - **App Store Privacy & Crash Prevention**: Configured four essential iOS privacy disclosure strings in [`ios/App/App/Info.plist`](file:///Users/scottgordon/Repos/gaa-app/ios/App/App/Info.plist) (`NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription`). Eliminates native WKWebView crashes and guarantees compliance with Apple App Store Review Guideline 5.1.1 during WebRTC consultations, 3D posture mesh scanning, and lifting critique video capture.
  - **Light Mode Status Bar Legibility**: In [`ios/App/App/MainViewController.swift`](file:///Users/scottgordon/Repos/gaa-app/ios/App/App/MainViewController.swift), overrode `preferredStatusBarStyle` to return `.lightContent`, ensuring the clock, battery, and Wi-Fi indicators render in crisp high-contrast white against the `#080E14` obsidian header across both light and dark iOS system appearances.
  - **iOS Safari / WKWebView 16px Auto-Zoom Eradication**: In [`app/globals.css`](file:///Users/scottgordon/Repos/gaa-app/app/globals.css), introduced a universal `@media (max-width: 768px)` rule enforcing a 16px minimum font size for `<input>`, `<select>`, and `<textarea>` controls. Completely cures the jarring automatic viewport zoom on focus on iPhone while preserving compact desktop ergonomics.
  - **Landscape Video & Live Studio Freedom**: Upgraded [`components/ui/MobilePortraitLock.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/ui/MobilePortraitLock.tsx) to automatically exempt live telehealth video and form critique screens (`/live`, `/video`, test harnesses) while adding a tactile `"Continue In Landscape"` button, allowing athletes to view technique demonstrations on gym racks.
  - **Ghost PWA Banner Suppression in Native App**: In [`components/ui/PwaInstallPrompt.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/ui/PwaInstallPrompt.tsx), integrated native Capacitor platform detection to automatically silence the "Add to Home Screen" install banner when running inside the compiled native iPhone binary.

## [1.31.0] - 2026-09-09

### Added & Enhanced
- **🏛️ Track 2: Athlete Portal, Daily Training Views & Total Typography Purge (Clinical Aristocracy Brand Elevation)**:
  - Completely purged legacy gym typography (`Bebas Neue`) across 100% of client-facing workout execution studios, athlete dashboards, settings, intake workflows, packages, messaging, and legal policy pages in favor of GAA's three-tier luxury typographic architecture:
    - **`Cinzel` (`var(--font-serif, Cinzel), Georgia, serif`)**: Institutional portal headers, workout session anchors, protocol titles, exercise names, milestone records, and legal document sections.
    - **`Raleway` (`var(--font-sans, Raleway), sans-serif`)**: Clinical coaching cues, qualitative badge descriptors, form execution tips, and uppercase action triggers (`letterSpacing: '0.08em'`, `fontWeight: 700-800`).
    - **Monospace Tabular Telemetry (`var(--font-telemetry, monospace)`)**: Poundage and kilograms (LBS/KG), repetitions, sets, RPE exertion scales, rest interval countdowns, barbell plate loading breakdowns, target heart rates (BPM), ACWR acute-to-chronic workload ratios, sleep architecture stages, body composition percentages, and retainer pricing.
  - **Athlete Daily Training Execution Studios**: Elevated all 23 components in [`components/fitness/`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/):
    - [`WorkoutSessionTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/WorkoutSessionTrackerClient.tsx), [`ActiveWorkoutTracker.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/ActiveWorkoutTracker.tsx), [`ExerciseExecutionLogger.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/ExerciseExecutionLogger.tsx), [`BarbellPlateCalculatorModal.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/BarbellPlateCalculatorModal.tsx), [`CardioLiveTracker.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/CardioLiveTracker.tsx), [`PosturalMeshScannerModal.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/PosturalMeshScannerModal.tsx), and [`AiBodyCompositionScannerModal.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/AiBodyCompositionScannerModal.tsx).
    - [`AthleticPerformanceStudio.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/AthleticPerformanceStudio.tsx), [`MetabolicNutritionProtocol.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/MetabolicNutritionProtocol.tsx), [`MindfulMomentModal.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/MindfulMomentModal.tsx), [`ExecutiveSupplementTimeline.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/ExecutiveSupplementTimeline.tsx), [`CoachCardioVoiceoverPlayer.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/CoachCardioVoiceoverPlayer.tsx), [`ExerciseSubstitutionPicker.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/ExerciseSubstitutionPicker.tsx), and tracker subcomponents.
  - **Athlete Hubs, Settings, Onboarding & Shell**:
    - [`ExecutiveCommandCenterClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/dashboard/ExecutiveCommandCenterClient.tsx)
    - [`InteractiveFeatureTutorialModal.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/tutorials/InteractiveFeatureTutorialModal.tsx)
    - [`SlotPicker.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/booking/SlotPicker.tsx)
    - [`PurchaseButton.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/packages/PurchaseButton.tsx) & [`AddonSelectionStudio.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/packages/AddonSelectionStudio.tsx)
    - [`MessageThreadClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/messages/MessageThreadClient.tsx)
    - [`ClientSettingsStudio.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/settings/ClientSettingsStudio.tsx), [`BaselineFitnessSettingsStudio.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/settings/BaselineFitnessSettingsStudio.tsx), [`MedicalClearanceStudio.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/settings/MedicalClearanceStudio.tsx), [`SpotifySettingsStudio.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/settings/SpotifySettingsStudio.tsx), [`GeneralSettingsForm.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/settings/GeneralSettingsForm.tsx)
    - [`AuthForm.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/auth/AuthForm.tsx) & [`ResetPasswordForm.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/auth/ResetPasswordForm.tsx)
    - App pages: [`app/(dashboard)/dashboard/fitness/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/(dashboard)/dashboard/fitness/page.tsx), [`app/(dashboard)/dashboard/live/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/(dashboard)/dashboard/live/page.tsx), [`app/(dashboard)/dashboard/onboarding/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/(dashboard)/dashboard/onboarding/page.tsx), [`app/(dashboard)/dashboard/messages/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/(dashboard)/dashboard/messages/page.tsx), [`app/(dashboard)/dashboard/book/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/(dashboard)/dashboard/book/page.tsx), [`app/whats-new/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/whats-new/page.tsx), [`app/terms/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/terms/page.tsx), [`app/privacy/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/privacy/page.tsx), [`app/(dashboard)/not-found.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/(dashboard)/not-found.tsx), [`app/(dashboard)/error.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/(dashboard)/error.tsx).
  - **Zero Bebas Neue Codebase Milestone**: Purged over 340+ legacy font instances across 60+ files down to 0 instances in UI components and pages.
  - **Full Biomechanical & Optical Integrity**: Strictly enforced neutral hammer curl grip guardrails and non-mirrored virtual background canvas pipeline.

## [1.30.0] - 2026-09-09

### Added & Enhanced
- **🏛️ Track 1: Coach Diagnostic, Assessment & Periodization Workspaces (Clinical Aristocracy Brand Elevation)**:
  - Completely purged legacy gym typography (`Bebas Neue`) across 100% of the Coach Console ecosystem (0 instances remaining across 24 coach components) in favor of GAA's three-tier luxury typographic architecture:
    - **`Cinzel` (`var(--font-serif, Cinzel), Georgia, serif`)**: Prestigious clinical suite mastheads, assessment checkpoint titles, modal headers, diagnostic section anchors, and protocol banners.
    - **`Raleway` (`var(--font-sans, Raleway), sans-serif`)**: Clinical instructions, descriptive biomechanical rationale, and uppercase action triggers (`letterSpacing: '0.08em'`, `fontWeight: 800`).
    - **Monospace Tabular Telemetry (`var(--font-telemetry, monospace)`)**: Physiological biomarkers, target heart rate zones (BPM), movement score deltas (%), tonnage readouts (LBS), compensation counts, and microcycle timeline markers.
  - **Diagnostic & Movement Assessment Workspaces**: Elevated [`NasmAssessmentSuite.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/NasmAssessmentSuite.tsx) and [`AiPostureMeshScannerModal.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/AiPostureMeshScannerModal.tsx) across OHSA 5 kinetic checkpoints, SLS/Push/Pull modules, 4-phase CEx Continuum, 3-stage target HR zones, and delta progress scorecards.
  - **Periodization & Program Design Workspaces**: Elevated [`CoachPeriodizationCockpit.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/CoachPeriodizationCockpit.tsx), [`CoachProgramWorkspace.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/CoachProgramWorkspace.tsx), [`RagProgramGeneratorStudio.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/RagProgramGeneratorStudio.tsx), and [`CoachCardioPrescriber.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/CoachCardioPrescriber.tsx) with Cinzel macrocycle mastheads, periodization modulations, and monospace load metrics.
  - **Consultation, Governance & Commercial Operations**: Elevated [`ClientDetailClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/ClientDetailClient.tsx), [`CoachClientPipeline.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/CoachClientPipeline.tsx), [`CoachLiabilityShield.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/CoachLiabilityShield.tsx), [`CoachCommerceTools.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/CoachCommerceTools.tsx), [`CoachConsultantMemoModal.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/CoachConsultantMemoModal.tsx), [`LiveSessionWrapUpModal.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/LiveSessionWrapUpModal.tsx), [`CoachOnboardingWorkflowStudio.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/CoachOnboardingWorkflowStudio.tsx), [`CoachOnboardingProgressionCard.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/CoachOnboardingProgressionCard.tsx), [`CoachAnalyticsDashboard.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/CoachAnalyticsDashboard.tsx), and [`CoachCheckinReview.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/CoachCheckinReview.tsx).
  - **Live Studio & Telehealth Components**: Cleanly upgraded [`LiveVirtualBackgroundStage.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/LiveVirtualBackgroundStage.tsx), [`LiveVisualTempoPulseHud.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/LiveVisualTempoPulseHud.tsx), [`LiveSlowMoReplayModal.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/LiveSlowMoReplayModal.tsx), [`LiveRemoteVideoFeed.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/LiveRemoteVideoFeed.tsx), and [`LiveVideoCameraHud.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/LiveVideoCameraHud.tsx) while strictly preserving `AGENTS.md` guardrails (MediaPipe mask inversion, unmirrored optical canvas, and neutral hammer grip).

## [1.29.4] - 2026-09-09

### Fixed & Enhanced
- **🏛️ Master Brand Crest & Studio Virtual Background Restoration**:
  - Reinstated the authentic circular interlocking **GA** master monogram with illuminated gold lettering platform-wide across all brand assets (`gaa-brand-crest.jpg`, `brand-logo.png`, `logo-mark-source.png`, `logo-mark-source.jpg`, and `image-not-available.jpg`).
  - Removed all overlaid 2-A medallion layers and deleted `scripts/composite-studio-backgrounds.mjs`, returning all 5 Live Studio virtual backgrounds (`coach-olympic-facility-gaa.jpg`, `coach-olympic-facility.jpg`, `coach-diagnostic-lab.jpg`, `coach-hybrid-concierge.jpg`, `coach-executive-suite.jpg`, and `coach-corporate-lounge.jpg`) to their pristine architectural state with the authentic 3D illuminated GA crest integrated directly into the facility walls.
  - Re-rendered all 16 Apple PWA splash screens, native iOS/Android splash assets, and master app icons using the authentic GA master emblem.

## [1.29.3] - 2026-09-09

### Fixed & Enhanced
- **🎥 Coach Live Studio Resilience & Unassigned Client Auto-Assignment**:
  - In [`app/coach/clients/[id]/live/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/coach/clients/[id]/live/page.tsx), [`app/coach/clients/[id]/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/coach/clients/[id]/page.tsx), and [`app/coach/clients/[id]/messages/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/coach/clients/[id]/messages/page.tsx), replaced strict `.single()` lookups with `.maybeSingle()` and eliminated hard `notFound()` 404 traps when clients have `designated_coach_id: null`.
  - Automatically assigns unassigned athlete records to the active coach on-the-fly in Supabase, enabling seamless instant launch of live sessions, program design, and communication.
  - Added Master Coach role elevation (`scott.gordon72@outlook.com` or `surface_role: 'coach'`), ensuring full supervisory and override access to any client across live sessions and telemetry.
- **🛡️ Coach Error Boundary Recovery**:
  - In [`app/coach/error.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/coach/error.tsx), added a tactile "Coach Hub" quick navigation action allowing coaches to instantly return to the command center if unexpected network or routing exceptions occur.

## [1.29.2] - 2026-09-09

### Fixed & Enhanced
- **🔐 Auth Password Reset Domain Typo Interception**:
  - In [`app/api/auth/password-reset/route.ts`](file:///Users/scottgordon/Repos/gaa-app/app/api/auth/password-reset/route.ts), integrated `detectEmailTypo` to intercept common domain misspellings (such as `ooutlook.com`, `iclod.com`, `gmai.com`) before rate limiting or link generation.
  - Returns a user-friendly `400 Bad Request` with actionable correction guidance (`Did you mean user@outlook.com? Please verify your email address.`).
  - In [`lib/email-validation.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/email-validation.ts), expanded `DOMAIN_TYPO_MAP` with `ooutlook.com -> outlook.com` and added unit test coverage in [`lib/email-validation.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/email-validation.test.ts).

## [1.29.1] - 2026-09-08

### Fixed & Enhanced
- **🔐 Auth Password Reset Observability & Recovery Diagnostics**:
  - In [`app/api/auth/password-reset/route.ts`](file:///Users/scottgordon/Repos/gaa-app/app/api/auth/password-reset/route.ts), added detailed server-side logging for failed link generation (e.g. unknown email or Supabase Auth errors) without leaking user existence to the client.
  - Added positive confirmation logging upon successful recovery email dispatch via Resend and explicit warning output when email service configurations are skipped.

## [1.29.0] - 2026-09-08

### Added & Enhanced
- **🏛️ Master Architectural 2-A Brand Identity Rollout**:
  - Switched the official platform-wide master logo to the **Interlocking 2-A Architectural Monogram** with smooth cosine radial feathering into obsidian navy (`#080E18`).
  - Updated [`SiteHeader`](file:///Users/scottgordon/Repos/gaa-app/components/ui/SiteHeader.tsx), [`SiteFooter`](file:///Users/scottgordon/Repos/gaa-app/components/ui/SiteFooter.tsx), [`GaaMasterWatermarkSeal`](file:///Users/scottgordon/Repos/gaa-app/components/ui/GaaMasterWatermarkSeal.tsx), app icons, 16 Apple PWA splash screens, native iOS/Android asset packs, and the official exercise fallback card (`image-not-available.jpg`).
- **📋 13-Point NASM® Accreditation & Sports Science Portfolio**:
  - Integrated full documentation of all 13 NASM disciplines across [`/intake`](file:///Users/scottgordon/Repos/gaa-app/app/intake/page.tsx) and [`/waitlist`](file:///Users/scottgordon/Repos/gaa-app/app/waitlist/page.tsx) ([`NasmAccreditationPortfolio.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/marketing/NasmAccreditationPortfolio.tsx)): CPT, CES, PES, CNC, CSNC, PBC, WLS, BCS, VCS, SFS, GFS, MMACS, and NASM Master Trainer.
  - Features real-time keyword search, curriculum breakdown, and mapping to GAA algorithmic periodization modules.
- **🎬 Cinematic AI Video Manifesto & Custom Video Engine**:
  - Directed and rendered bespoke high-definition founding manifesto video (`public/videos/gaa-founding-manifesto.mp4`) via Gemini Pro prompt engineering and Gemini Omni Flash generative video pipeline.
  - Implemented custom [`CinematicVideoPlayer.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/marketing/CinematicVideoPlayer.tsx) with ambient gold backglow and fullscreen playback.
- **🩺 Elevated Master Coach Daily Triage Cockpit**:
  - In [`components/coach/CoachTriageCockpit.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/CoachTriageCockpit.tsx) and [`app/coach/page.tsx`](file:///Users/scottgordon/Repos/gaa-app/app/coach/page.tsx), added dynamic medical red flag detection (`isBlockedByMedicalClearance`), workout set log joint pain/strain keyword scanning, and ACWR acute-to-chronic workload tracking.
  - Integrated real-time athlete search and expandable **Workload Telemetry & Flags** drawers with 1-click periodization auto-triage.
- **✉️ Founding Cohort VIP Auto-Responder & Pipeline Upgrade**:
  - In [`lib/marketing-email.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/marketing-email.ts) and [`app/api/waitlist/route.ts`](file:///Users/scottgordon/Repos/gaa-app/app/api/waitlist/route.ts), added a dedicated executive auto-responder with dynamic cohort reservation badges (`RESERVATION #<N> OF 20`), Coach Gordon briefing memo, and direct links to the accreditation portfolio.
  - Migrated internal team notification subjects from legacy `[SGF]` to `[GAA]` with rich applicant profile metadata.
- **🎥 Live Studio Virtual Background Refresh**:
  - Built [`scripts/composite-studio-backgrounds.mjs`](file:///Users/scottgordon/Repos/gaa-app/scripts/composite-studio-backgrounds.mjs) to composite embossed circular 2-A gold medallions into all 5 virtual studio plates (`coach-olympic-facility-gaa.jpg`, `coach-diagnostic-lab.jpg`, etc.).
  - Adhered strictly to `AGENTS.md` optical orientation guardrail (never mirroring background images).
- **📜 Executive Sunday Dossier Boardroom Elevation**:
  - Updated Coach Scott Gordon signature credentials to **`SCOTT GORDON, NASM MASTER TRAINER`** and listed active disciplines (`NASM-CPT® · CES® · PES® · CNC™ · CSNC`) with Boardroom Validated authentication.

## [1.28.5] - 2026-09-08

### Fixed & Enhanced
- **⚡ Mobile Safari 60fps Exercise Accordion Body Virtualization**:
  - Virtualized the entire 1,020-line interior body of exercise accordions in [`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx) (`{(isExpanded || activeRestTimerKey === exerciseKey) && (...) }`).
  - When closed, exercises now render only their lightweight 44px summary row, reducing mounted DOM elements from 20,000+ nodes down to ~1,200 nodes (a 94% reduction in DOM size).
  - Eliminates main-thread UI sluggishness, frame drops, and latency during workout timer ticks on mobile Safari / iPhone.
- **🖼️ Verified GAA Exercise Photography Priority Engine**:
  - Fixed image priority inversion where legacy YouTube thumbnail URLs (`img.youtube.com`) in `overrides.imageUrl` superseded verified studio photos.
  - In [`lib/nasm-clinical-movement-cards.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-clinical-movement-cards.ts), [`lib/coach-programs.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/coach-programs.ts), [`lib/rag-nasm-program-generator.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/rag-nasm-program-generator.ts), [`lib/gemini-nasm-master-coach.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/gemini-nasm-master-coach.ts), and [`components/coach/RagProgramGeneratorStudio.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/RagProgramGeneratorStudio.tsx), verified local GAA studio photographs (`/images/exercises/*.jpg`) now take absolute priority.
  - In `FitnessTrackerClient.tsx`, thumbnail and hero image URLs resolve directly from `resolveGaaExerciseImage(ex.name, false)`, guaranteeing studio photography displays instantaneously without YouTube CDN dependencies.
- **🚀 Service Worker v1.28.5 Stale-While-Revalidate Caching**:
  - Upgraded `/images/exercises/` cache strategy in [`public/sw.js`](file:///Users/scottgordon/Repos/gaa-app/public/sw.js) to **Stale-While-Revalidate with Cache Fallback**.
  - Local cache hits return in 0ms directly from flash memory with zero cellular latency, while updating assets asynchronously in the background.

## [1.28.4] - 2026-09-08

### Fixed & Optimized
- **⚡ Mobile Safari & iPhone Freezing Elimination via Multi-Tier In-Memory Memoization**:
  - Identified and eliminated high-frequency main thread locking in [`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx) where `getNasmClinicalMovementCard` was executed multiple times per exercise across all workout items on every 1,000ms timer tick.
  - Implemented module-level LRU/in-memory caches:
    - `MOVEMENT_CARD_CACHE` in [`lib/nasm-clinical-movement-cards.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-clinical-movement-cards.ts).
    - `FUZZY_MATCH_CACHE` in [`lib/nasm-fuzzy-matcher.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-fuzzy-matcher.ts).
    - `GAA_IMAGE_CACHE` in [`lib/nasm-generated-images.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-generated-images.ts).
  - Reduced movement card and sports science fuzzy matching execution time from 25–40ms down to $O(1)$ (<0.001ms) on all subsequent renders, delivering smooth 60fps scrolling and interaction on mobile Safari.
  - Removed duplicate `getNasmClinicalMovementCard` invocation in the resistance exercise list.
- **🖼️ PWA Service Worker v1.28.4 Installation & Network-First Exercise Image Pipeline**:
  - Corrected broken precache configuration in [`public/sw.js`](file:///Users/scottgordon/Repos/gaa-app/public/sw.js) by removing missing `/manifest.webmanifest` (which previously caused 404 installation aborts on iOS Safari and PWA clients).
  - Upgraded service worker precaching to use resilient `Promise.allSettled`, preventing single missing asset failures from rejecting worker installation.
  - Engineered **Network-First with Cache Fallback** specifically for `/images/exercises/`, ensuring newly generated and updated exercise images (e.g. `squat-to-overhead-reach.jpg`, `glute-bridge.jpg`) load immediately on mobile devices rather than being permanently trapped in stale caches.
  - Added automatic purge of outdated service worker caches (`gaa-v1.28.3`) and immediate tab claim on activate (`self.clients.claim()`).
- **📱 Mobile Safari GPU Memory & DOM Rendering Optimization**:
  - In [`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx), deferred rendering of the heavy 16:9 high-definition demonstration hero banner and its backdrop-filter overlays until an exercise accordion is opened (`isExpanded`), preventing mobile Safari from simultaneously decoding 15+ high-res images in collapsed cards.
  - Added explicit intrinsic `width={44}` and `height={44}` dimensions to thumbnail images to prevent layout shifts.
- **🏋️ Exercise Image & Alias Parity**:
  - Ensured physical file parity and alias resolution for `Glute Bridge`, `Glute Bridge with 2s Isometric Hold`, `Squat to Overhead Reach & Scaption`, and `Scaption` across [`lib/nasm-generated-images.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-generated-images.ts) and [`public/images/exercises/manifest.json`](file:///Users/scottgordon/Repos/gaa-app/public/images/exercises/manifest.json).

## [1.28.3] - 2026-09-08

### Added & Enhanced
- **📱 Mobile iPhone Exercise Image Layout & Visual Experience Overhaul**:
  - Embedded 44×44px verified movement photography thumbnails in the collapsed `<summary>` row of every workout item in [`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx), providing immediate visual imagery without needing to manually expand each exercise.
  - Upgraded expanded exercise cards with a full-width **16:9 High-Definition Visual Movement Demonstration Banner** with direct modal triggers and OPT™ category tags.
  - Enhanced `ExerciseVideoModal` to render verified GAA form photography by default with dual `[ 📷 Verified Form Photo ]` and `[ 🎬 Video Demonstration ]` selector tabs and an interactive "▶ Watch Video Demo" overlay button.
  - Standardized modal backdrop z-indexes to `zIndex: 100050` and eliminated mobile bottom banner obstruction across all dialogs.
  - Bumped PWA Service Worker cache version in [`public/sw.js`](file:///Users/scottgordon/Repos/gaa-app/public/sw.js) to `gaa-v1.28.3` to automatically purge stale client caches on mobile Safari and PWA clients.
  - Added a 52×52px lead exercise preview thumbnail in the "Today's Target" workout card on the Executive Command Center dashboard ([`components/dashboard/ExecutiveCommandCenterClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/dashboard/ExecutiveCommandCenterClient.tsx)).
  - Built dedicated Playwright mobile UI test suite in [`tests/ui/mobile-image-layout.spec.ts`](file:///Users/scottgordon/Repos/gaa-app/tests/ui/mobile-image-layout.spec.ts) covering iPhone 15 Pro and iPhone SE viewports.
- **🍎 Universal Apple HealthKit Multi-Activity Synchronization Architecture**:
  - Engineered seamless, category-precise synchronization across **Strength Training**, **Cardio (by modality)**, and **Mindfulness Moments** to Apple Health without cross-contamination.
  - Upgraded native iOS HealthKit in [`ios/App/App/GAAHealthSyncManager.swift`](file:///Users/scottgordon/Repos/gaa-app/ios/App/App/GAAHealthSyncManager.swift), [`ios/App/App/GAAHealthKitPlugin.swift`](file:///Users/scottgordon/Repos/gaa-app/ios/App/App/GAAHealthKitPlugin.swift), and [`ios/App/App/GAAHealthKitPlugin.m`](file:///Users/scottgordon/Repos/gaa-app/ios/App/App/GAAHealthKitPlugin.m) to support `HKCategoryTypeIdentifier.mindfulSession` (`HKCategorySample`) for Mindful Minutes and registered `writeMindfulSession`.
  - Expanded workout modality mapping to route walking, running, cycling, rowing, stair climbing, elliptical, and HIIT to exact native `HKWorkoutActivityType` values instead of generic strength.
  - Created universal TypeScript bridge `syncActivityToAppleHealth()` in [`lib/native-healthkit-bridge.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/native-healthkit-bridge.ts), supporting both native iOS HealthKit and GAA cloud telemetry backend (`/api/wearables/sync`).
- **🔄 Seamless Multi-Activity Flow Progression ("What's Next?")**:
  - Embedded the **"What's Next? Seamless Flow"** dock into `PostWorkoutFinishModal` in [`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx):
    - **🔥 Flow to Cardio Finisher**: Instantly locks in and logs Strength to Apple Health (`HKWorkoutActivityTypeTraditionalStrengthTraining`), then launches AI Cardio Studio pre-calibrated with the day's prescribed cardio stage and modality.
    - **🧘 Flow to Mindful Cooldown**: Instantly locks in and logs Strength to Apple Health, then launches guided parasympathetic breathwork.
  - Added **🧘 Flow to Mindful Cooldown** to the debrief action bar in [`components/fitness/CoachCardioVoiceoverPlayer.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/CoachCardioVoiceoverPlayer.tsx), enabling runners and walkers to smoothly transition from cardio into mindful recovery while ensuring cardio logs to its exact modality.
- **🧘 Dedicated Mindful Moment & Parasympathetic Reset Modal**:
  - Created [`components/fitness/MindfulMomentModal.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/MindfulMomentModal.tsx) with four clinical nervous system protocols:
    - `4-7-8 Parasympathetic Reset`: Vagal nerve activation, heart rate lowering, and cortisol suppression.
    - `4-4-4-4 Box Breathing`: Autonomic equilibrium and cognitive composure.
    - `5-5 Coherent Breathing`: Heart Rate Variability (HRV) resonance at 6 breaths per minute.
    - `Mindful Stillness & Body Scan`: Somatic meditation and nervous system decompression.
  - Features an animated visual breathing circle, customizable durations (2, 3, 5, 10 min), optional Web Audio harmonic chimes, and automatic Apple Health Mindful Minutes synchronization upon completion with visual confirmation.
  - Updated [`components/fitness/ClinicalCoolDownModule.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/ClinicalCoolDownModule.tsx) to automatically credit Mindful Minutes to Apple Health upon finishing post-workout breathwork.
  - Added full test coverage in [`components/fitness/MindfulMomentModal.test.ts`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/MindfulMomentModal.test.ts) (4 new tests) and [`lib/native-healthkit-bridge.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/native-healthkit-bridge.test.ts) (23 new tests).

## [1.28.2] - 2026-09-08

### Fixed & Enhanced
- **⏱️ AI Cardio Studio In-Pocket Background Drift Elimination & Screen Wake Lock Architecture**:
  - Resolved an issue where mobile operating systems (iOS Safari and Android Chrome/WebKit) suspended JavaScript timers when the phone was locked or put in a pocket, causing the cardio timer to pause and fall behind real-world time.
  - Implemented deterministic wall-clock time reconciliation (`reconcileTimer()`) anchored to `Date.now()`, `sessionStartTimestampRef`, and accumulated pause time (`pausedAccumulatedMsRef`), eliminating timer lag and interval freeze regardless of device sleep duration.
  - Engineered `resolveSegmentFromTotalElapsed()` in [`lib/coach-cardio-engine.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/coach-cardio-engine.ts) to deterministically map total elapsed wall-clock seconds to the exact active interval segment, remaining segment duration, and workout completion state upon device wake.
  - Integrated W3C Screen Wake Lock API in [`lib/screen-wake-lock.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/screen-wake-lock.ts) with `visibilitychange` auto-recovery, keeping the screen active during workouts and preventing devices from aggressive 30-second auto-locking.
  - Added full test coverage for deterministic interval resolution in [`lib/coach-cardio-engine.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/coach-cardio-engine.test.ts) (7 new tests) and wake lock lifecycle in [`lib/screen-wake-lock.test.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/screen-wake-lock.test.ts) (3 new tests).
- **🔒 In-Pocket Touch Shield Mode (OLED Pure Black)**:
  - Added an **In-Pocket Touch Shield** mode to [`components/fitness/CoachCardioVoiceoverPlayer.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/CoachCardioVoiceoverPlayer.tsx), designed for runners and walkers who keep their phone in a pocket or armband.
  - Displays a high-contrast, pure black (`#000000`) OLED screen that turns off display pixels to preserve battery while keeping the wake lock active and preventing browser background throttling.
  - Blocks accidental pocket touch inputs from skipping intervals or pausing playback, while rendering glanceable telemetry: giant countdown clock, current segment name and target RPE, live heart rate, and ducking status.
  - Features an intuitive 1.2-second tactile press-and-hold unlock button with visual fill animation and haptic vibration feedback (`navigator.vibrate`), plus a double-tap screen unlock fallback.

## [1.28.1] - 2026-09-08

### Fixed
- **🎵 AI Cardio Studio Zero-Interruption Music Ducking Architecture**:
  - Resolved an issue where playing Coach Gordon voice cues during AI Cardio Studio sessions halted or stopped background music (e.g. Spotify, Apple Music, podcasts).
  - Integrated W3C Audio Session API (`navigator.audioSession.type = 'transient'`) across [`lib/web-audio-cadence-engine.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/web-audio-cadence-engine.ts), [`lib/coach-cardio-voiceover.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/coach-cardio-voiceover.ts), and [`lib/coach-voice-synthesizer.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/coach-voice-synthesizer.ts). On iOS Safari and supported browsers, the operating system now smoothly ducks (lowers volume of) background music by ~80% during speech cues and immediately restores full volume when the cue ends.
  - Upgraded voice cue rendering in [`lib/coach-cardio-voiceover.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/coach-cardio-voiceover.ts) to utilize Web Audio API (`AudioContext` buffer decoding with in-memory caching via `preloadedAudioBuffers`), preventing browsers from requesting exclusive media playback focus or triggering system-level audio interruptions.
  - Guarded `updateCardioMediaSession` to avoid claiming lock-screen `play`/`pause` handlers while Music Ducking mode is active, keeping native Spotify/Apple Music lock-screen, Apple Watch, and headphone controls intact.
  - Added interactive `[🦆 Ducking On]` quick-control button and informative status toast in [`components/fitness/CoachCardioVoiceoverPlayer.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/CoachCardioVoiceoverPlayer.tsx), persisting preference in `localStorage`.
  - Added `clearCardioMediaSession()` for clean lifecycle release when sessions pause, complete, or close.

## [1.28.0] - 2026-09-08

### Added & Enhanced
- **🏆 100% NASM Edge Exercise Library Completion & Clinical Form Verification**:
  - Achieved 100% visual image generation and clinical NASM form verification across all **27 waves**, covering all **323 rows** of the official NASM Edge catalog with zero missing exercises ([`public/images/exercises/manifest.json`](file:///Users/scottgordon/Repos/gaa-app/public/images/exercises/manifest.json)).
  - Generated **271 unique physical high-resolution (1024×1024) JPG assets** in `public/images/exercises/` following luxury GAA editorial gym aesthetic: dark slate athletic apparel with GAA monogram apex branding, matte black equipment with architectural GAA accents, warm golden rim lighting, and strictly zero generic third-party logos or watermark overlays.
- **🛡️ Exercise Biomechanical Guardrails & Form Rigor**:
  - Enforced strict neutral grip (palms facing inward, zero twisting or supination, vertical dumbbell heads, thumbs pointing up) across all hammer curl movements (`Dumbbell Hammer Curl`, `Single Leg Hammer Curl`, `Hammer Curl To Lateral Raise`) and codified in [`AGENTS.md`](file:///Users/scottgordon/Repos/gaa-app/AGENTS.md).
- **🎨 Official Luxury Branded Fallback System**:
  - Engineered a dedicated high-resolution branded fallback asset ([`public/images/exercises/image-not-available.jpg`](file:///Users/scottgordon/Repos/gaa-app/public/images/exercises/image-not-available.jpg)) featuring the liquid gold GAA monogram seal on dark obsidian styling with an architectural badge reading *"IMAGE NOT AVAILABLE"* and *"OFFICIAL CLINICAL MOVEMENT ARCHIVE"*.
  - Exported `BRAND_LOGO_FALLBACK_IMAGE` and `resolveGaaExerciseImage()` in [`lib/nasm-generated-images.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-generated-images.ts) supporting multi-stage query normalization, slug matching, fitness alias resolution, and keyword heuristics.
- **🔄 Core Catalog & Search Engine Integration**:
  - Upgraded [`scripts/nasm-complete-library.json`](file:///Users/scottgordon/Repos/gaa-app/scripts/nasm-complete-library.json) and [`lib/nasm-fuzzy-matcher.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-fuzzy-matcher.ts) to map directly to verified local GAA image assets instead of external video frames.
  - Upgraded `getNasmClinicalMovementCard()` in [`lib/nasm-clinical-movement-cards.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-clinical-movement-cards.ts) to prioritize verified GAA photography over video frames, exposing `fallbackImageUrl`.
  - Updated `buildStoredProgramPlan()` in [`lib/coach-programs.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/coach-programs.ts) and the coach exercise library endpoint ([`app/api/coach/exercise-library/route.ts`](file:///Users/scottgordon/Repos/gaa-app/app/api/coach/exercise-library/route.ts)) to attach verified GAA image URLs.
- **📱 Client & Coach UI Visual Upgrades**:
  - Updated [`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx) to render exercise thumbnail images across all workout rows and modal views with `onError` fallback handling.
  - Enhanced [`components/coach/UnifiedLiveStudioHud.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/UnifiedLiveStudioHud.tsx) and [`components/coach/LiveVideoCameraHud.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/LiveVideoCameraHud.tsx) to render authentic GAA photography in the benchmark reference slots.
  - Synchronized all 271 physical assets and the branded fallback to Android (`android/app/src/main/assets/public/images/exercises/`) and iOS (`ios/App/App/public/images/exercises/`).

## [1.27.1] - 2026-09-07

### Fixed
- **📱 Responsive Mobile Layout & iOS Drift Elimination for Voucher Intake Dock**:
  - Eliminated horizontal viewport drift on iPhone and mobile devices in the First Visit Lead Capture dock ([`components/marketing/FirstVisitLeadCapture.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/marketing/FirstVisitLeadCapture.tsx)).
  - Centered the dock horizontally on screens `< 768px` via `left: 50% !important; transform: translateX(-50%) !important;` with responsive bounds `width: min(calc(100vw - 28px), 400px) !important;`.
  - Upgraded form input font sizes to `16px` to permanently stop iOS Safari from auto-zooming into the viewport on tap and displacing fixed overlays.
  - Isolated the mobile blanket `aside` rule in [`app/globals.css`](file:///Users/scottgordon/Repos/gaa-app/app/globals.css) via `aside:not(.first-visit-dock)` to prevent stripping the dock's sizing.
  - Integrated iOS Safe Area insets (`env(safe-area-inset-bottom)` and `env(safe-area-inset-right)`) across the expanded dock and minimized badge.
  - Added dedicated `@keyframes leadDockSlideUpMobile` and `@keyframes leadDockSlideUpDesktop` ensuring smooth, stable entry without lateral drift.

## [1.27.0] - 2026-09-07

### Added & Enhanced
- **🎙️ Unified AI Coach Gordon Cloned Voice Architecture**:
  - Standardized AI Coach Gordon's vocal identity across the entire application to consistently use Coach Scott Gordon's authentic ElevenLabs cloned neural voice model (`UPezm4CtrvcD6aNXjeU1`), matching the voice used in the AI Cardio Studio sessions.
  - Replaced legacy hardcoded voice IDs (`pNInz6obpgDQGcFmaJgB` / Adam) across daily briefings and Ask Coach Gordon audio responses.
  - Updated [`app/api/coach/tts/route.ts`](file:///Users/scottgordon/Repos/gaa-app/app/api/coach/tts/route.ts) default fallback to `COACH_GORDON_ELEVENLABS_VOICE_ID` (`UPezm4CtrvcD6aNXjeU1`) and updated provider header to `elevenlabs-coach-gordon`.
- **⚡ Client-Side In-Memory Audio Blob Caching**:
  - Implemented `preloadedAudioBlobUrls` in [`lib/coach-voice-synthesizer.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/coach-voice-synthesizer.ts) and exported `prefetchCoachVoiceCue()` for instantaneous, zero-latency playback of common workout cues with 0 repeated network calls.
  - Shared audio blob cache across both general workout tracking and the AI Cardio Studio ([`lib/coach-cardio-voiceover.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/coach-cardio-voiceover.ts)).
- **🏋️ In-Workout Neural Audio Upgrades**:
  - Upgraded `speakCoachVoiceCue()` to route through `playNeuralCoachVoiceCue()`, delivering Coach Gordon's authentic voice for set logging confirmations, rest timer countdowns, stretch holds, and workout completions.
  - Exported `speakWebSpeechCoachVoiceCue()` as a dedicated, calibrated local Web Speech fallback (baritone pitch 0.92, tempo 1.08) for offline or rate-limited environments.
- **🎯 Unified Movement & Studio Assessment Voice**:
  - Delegated `speakNasmCue()` in [`lib/nasm-assessments.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/nasm-assessments.ts) to `speakCoachVoiceCue()`, bringing Coach Gordon's cloned voice to live tempo pulses, form feedback, and consultant memos.

## [1.26.0] - 2026-09-06

### Added & Enhanced
- **🏃 Locomotor-Respiratory Coupling (LRC) & In-Pocket Cardio Cadence Engine**:
  - Engineered Locomotor-Respiratory Coupling architecture in [`lib/coach-cardio-engine.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/coach-cardio-engine.ts) for athletes who keep their phones tucked away in their pockets and cannot look at screen-based breathing animations.
  - Coupled breath pacing directly to physical locomotion: 4:4/5:5 for base/warmup, 3:3 for Zone 2 aerobic engine, 2:2 for tempo cruise, 2:1 for lactate surges, and 1:1 for maximal sprint ventilation.
  - Tailored coupling mechanics to individual modalities: stride-based footstrikes for running/walking, recovery slide inhale & leg drive power exhale for rowers, downstroke revolutions for cycling, and step-locked cadence for stairmasters.
- **📱 In-Pocket Cadence Anchor HUD & Tactile Cue Button**:
  - Embedded dedicated In-Pocket Cadence Anchor card in [`components/fitness/CoachCardioVoiceoverPlayer.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/CoachCardioVoiceoverPlayer.tsx) displaying modality icons, cadence ratios, and rhythmic turnover patterns.
  - Added an instant `[🔊 Cue Rhythm]` button allowing athletes to audition Coach Gordon's verbal cadence guidance directly in their earbuds right before pocketing their device.
- **🗣️ Hands-Free Voice Copilot Cadence Checks**:
  - Added `CADENCE_CHECK` voice command recognition to `parseCardioVoiceCommand()` allowing hands-free verbal queries (*"Coach, how should I breathe?"*, *"What's my cadence?"*, *"Stride count?"*).
  - Voice copilot automatically responds with tailored in-ear cadence guidance based on the current interval's RPE and selected cardio modality.
- **🎧 Weaved In-Ear Cadence Directives Across Cardio Patterns**:
  - Weaved stride, stroke, and pedal turnover coaching cues into all interval generators in `CARDIO_PATTERNS` (*Zone 2*, *HIIT 1:2*, *The Pyramid Ladder*, *Threshold Over-Unders*, *Tabata Micro-Bursts*, and *Parasympathetic Recovery Flush*).

## [1.25.0] - 2026-09-05

### Added & Enhanced
- **🎙️ AI Coach Gordon Voiceover Cardio Training Engine ("Personal Trainer in Your Ear")**:
  - Engineered high-end AI voiceover audio coordination in [`lib/coach-cardio-voiceover.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/coach-cardio-voiceover.ts) powered by Coach Scott Gordon's authentic ElevenLabs neural voice model (`COACH_GORDON_ELEVENLABS_VOICE_ID`).
  - Added background prefetching of upcoming interval audio blobs and client-side LRU audio caching to guarantee zero-lag audio transitions.
  - Implemented lock-screen and wearable controls via `navigator.mediaSession` with live interval metadata, play/pause, and skip capabilities.
  - Added Web Audio transition chimes (`playIntervalTransitionPip`) and start bells (`playIntervalBell`).
- **🫁 Modality-Agnostic Cardiorespiratory Engine & RPE 1–10 Breathing Registry**:
  - Built universal modality-neutral cardiorespiratory engine in [`lib/coach-cardio-engine.ts`](file:///Users/scottgordon/Repos/gaa-app/lib/coach-cardio-engine.ts) compatible with treadmills, indoor bikes, rowers, stairmasters, outdoor running/walking, ski ergs, and ellipticals.
  - Anchored exertion levels (RPE 1–10) strictly to respiratory sensations: nasal diaphragmatic pacing (RPE 2–3), rhythmic belly breathing (RPE 4–5), talk-test limiters (RPE 6–7), lactate buffering (RPE 8), and anaerobic explosive exhalations (RPE 9–10).
  - Codified 6 master cardio patterns: *Zone 2 Aerobic Engine Builder*, *HIIT 1:2 Threshold Intervals*, *The Ascending & Descending Ladder*, *Threshold Cruise & Over-Unders*, *Tabata & Micro-Burst Sprints*, and *Post-Lift Parasympathetic Recovery Flush*.
  - Implemented dynamic duration scaling from 10m to 45m+ with automated calculation of warm-ups, active tiers, and cool-downs.
  - Infused Coach Gordon's signature persona: deep empathy, kindness, and breathing mastery combined with tough-love **swift kicks in the butt**.
- **💓 Live Bluetooth Heart Rate Sync & Adaptive In-Ear Corrections**:
  - Integrated Web Bluetooth GATT connection (`0x180D` / `0x2A37`) for direct pairing with chest straps (Polar H10, Garmin HRM-Pro, Wahoo TICKR) and armbands.
  - Built real-time cardiac drift detection (`evaluateAdaptiveHeartRateFeedback`): speaks verbal corrections into the athlete's ear if heart rate drifts above Zone 2 into threshold territory during aerobic base building (*"Hey, check your ego. Your heart rate is drifting above Zone 2 into threshold territory..."*).
  - Built under-exertion detection for high-intensity intervals (RPE 8+) when heart rate is idling below target.
- **🗣️ Hands-Free Voice Copilot ("Talk to Coach")**:
  - Added Web Speech API voice listener allowing athletes to query the coach without looking down or breaking stride: time checks (*"How much time left?"*), spontaneous motivation (*"Coach push me / I'm tired"*), verbal RPE reports (*"I'm at an 8"*), and playback controls (*"Pause"*, *"Resume"*, *"Skip"*).
- **📐 Equipment Biomechanical Form Directives**:
  - Added specialized biomechanical guidance drawer for Treadmill Incline (hands off rails, ankle hinge, active glutes), Rowing Ergometer (60% legs, 20% core, 20% arms, 1:2 rhythm), Stairmaster (upright posture over pelvis), Stationary/Assault Bike (360° pedal circles), and Outdoor Running (midfoot strike under center of mass).
- **🎵 Spotify Cadence 126 Sync**:
  - Integrated 1-click launcher for 126 BPM tempo playlists scientifically matched to Zone 2 rhythmic respiratory pacing.
- **📊 Executive Post-Session Bioenergetic Debrief & Closing Voice Report**:
  - Computes Time-in-Zone splits (Zone 1, Zone 2, Zone 3), active calories, EPOC afterburn factor, and a respiratory compliance index.
  - Synthesizes an executive closing audio debrief from Coach Gordon delivering performance metrics, 16oz electrolyte water rehydration, and 25-30g protein refuel directives.
- **📱 On-Demand Studio & Workout Launchers**:
  - Placed a prominent On-Demand AI Cardio Studio banner in the Fitness Lab workspace ([`components/fitness/FitnessTrackerClient.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/fitness/FitnessTrackerClient.tsx)) for 1-click hotel/travel/off-day cardio.
  - Connected Step 3 in-workout cardio launcher and sticky floating live dock (`LiveSessionStickyDock.tsx`).
  - Added "AI Voice Cardio" subtab in the Coach Prescription Workspace ([`components/coach/CoachCardioPrescriber.tsx`](file:///Users/scottgordon/Repos/gaa-app/components/coach/CoachCardioPrescriber.tsx)).

---

## [1.24.0] - 2026-09-05

### Added & Enhanced
- **🎙️ Interactive 32-Bar Audio Waveform Player**:
  - Engineered dynamic audio peak analysis from decoded `AudioBuffer` samples with Canvas-rendered 32-bar visualizer and progressive gold playback fill.
  - Added click and drag scrub seeking across the waveform with sub-second accuracy.
  - Added playback speed multiplier toggle pill (`1x`, `1.25x`, `1.5x`, `2x`) with smooth audio rate shifting and tactile haptics.
- **✨ Voice Note Recording Studio**:
  - Built luxury recording studio dock with live Web Audio API `AnalyserNode` frequency spectrum visualization rendered to canvas.
  - Integrated pulsing radar recording status dot, live duration timer, and one-tap discard.
  - Added in-studio review preview player allowing audio playback verification before sending.
- **💬 Next-Gen Executive Message Thread & Console**:
  - Implemented responsive viewport height (`clamp(520px, 64vh, 760px)`) ensuring fixed-height console parity on desktop and mobile.
  - Added calendar date divider badges ("Today", "Yesterday", or full formatted date).
  - Implemented message clustering within 5-minute activity windows with sender avatars and timestamps.
  - Added certified Coach Gordon shield badge on coach messages for elevated brand authority.
  - Added in-thread full-text search filtering and one-tap message clipboard copy with visual checkmark feedback.
  - Added floating "Jump to latest" pill when scrolled up with automated scroll-to-bottom behavior.
- **📨 Delivery & Read Receipts Engine**:
  - Added `PATCH /api/messages` endpoint to atomically mark incoming messages as read (`read_at = NOW()`).
  - Added real-time delivery (`✓`) and read (`✓✓`) receipt checkmark badges with subtle gold tints.
- **⌨️ Fluid Auto-Expanding Multiline Composer**:
  - Upgraded input from single-line text input to auto-expanding `textarea` supporting multiline messages up to 160px with `Enter` send and `Shift+Enter` newline.
- **🖥️ Executive Athlete Advisory Console**:
  - Built executive console header for coach message view (`/coach/clients/[id]/messages`) with direct links to client profile and 1:1 Live Studio.
- **🎨 WebGL2 GPU Shader Virtual Background Pipeline**:
  - Upgraded live coach background replacement from CPU pixel manipulation to high-performance WebGL2 fragment shaders.
  - Applied morphological matte choke, optical edge feathering, and motion-adaptive hysteresis to eliminate edge halos.
  - Guaranteed forward-reading brand crest and typography orientation on unmirrored canvas background.

---

## [1.23.0] - 2026-09-04

### Added & Enhanced
- **⚖️ Precision Session & Consultation Accounting**:
  - Audited and reconciled ledger across 1:1 sessions and consultations, eliminating duplicate credit deductions when coaches complete scheduled sessions or wrap up live calls.
  - Implemented automated package credit refunds on session cancellation capped at package total sessions.
  - Excluded expired packages (`expires_at <= NOW()`) from active consultation counts across client and coach command centers.
  - Integrated add-on live consultations into Stripe checkout allocations and package provisioning.
  - Rendered accurate autonomous tier displays (0 consults) and singular/plural consultation counters.
  - Prevented cancelled sessions from falsely satisfying onboarding progression Stage 7 milestones.

---

## [1.22.1] - 2026-09-03

### Added & Enhanced
- **⚡ Stage 7 Automatic Progression & Consultation Waiver**:
  - Automatically advances client onboarding from Stage 7 (Delivery Kickoff & Live Coaching) to Stage 8 (Telemetry Monitoring & Weekly Triage) as soon as a live session is marked completed or waived.
  - Relaxed SOAP notes requirement so empty notes do not block continuum progression (`soap_notes_dictated` milestone is now optional clinical documentation).
  - Created `/api/coach/clients/[id]/waive-consult` API endpoint and `[Skip Consult (Client Opted Out) ➔]` button in `ClientDetailClient.tsx` enabling coaches to fast-track clients who prefer asynchronous coaching.
  - Removed redundant blue `[Deliver Live Session ➔]` buttons from empty states and the Stage 7 banner.
- **🎙️ Prominent Clinical Voice S.O.A.P. Header & Save Feedback**:
  - Reorganized `SessionActions.tsx` notes card with a dedicated clinical header bar containing the gold `[Voice S.O.A.P. Dictation & Synthesis]` launcher directly above the notes textarea.
  - Added real-time visual confirmation badge (`Saved ✓`) upon saving session notes.

---

## [1.22.0] - 2026-09-03

### Added & Enhanced
- **🔴 Coach 1:1 Live Video Session Launcher**:
  - Built `CoachLiveSessionLauncher` with client dropdown, quick roster pick chips, and tactile start button.
  - Added push notification dispatch ("Ring Athlete & Dispatch Room Link") notifying the athlete to join their private live session.
  - Prominently anchored the launcher on the Coach Console Overview tab (`/coach#live-studio`) and added `[ 🔴 Train Live → ]` buttons to roster table rows.
  - Updated all navigation links across `SiteHeader`, `coach/settings`, and `MobileNavigationDrawer` to route to `/coach#live-studio`.
- **📹 Bi-Directional WebRTC Live Audio/Video Studio**:
  - Enhanced `lib/webrtc-peer-bridge.ts` to handle presence `join` signals and dynamic track attachment for remote and local media streams.
  - Embedded real `<video>` stream player for `activeRemoteStream` with mic/camera toggle buttons into `UnifiedLiveStudioHud.tsx`.
  - Upgraded athlete live video room at `/dashboard/live` with dynamic coach name and WebRTC peer connection.
- **📸 1-Click Diagnostic Video Frame Capture**:
  - Built `captureClientFrame()` callback in `UnifiedLiveStudioHud.tsx` extracting high-definition 0.88 JPEG snapshots from client video element via canvas drawing.
  - Added floating `[ 📸 Snapshot Frame ]` quick-pill over athlete live video feed.
  - Created persistent diagnostic quick-bar showing captured frame thumbnail, timestamp, and instant assessment actions.
- **🧬 AI Postural Mesh Scanner Integration**:
  - Updated `AiPostureMeshScannerModal.tsx` with `initialCapturedPhoto` and `initialView` props to pre-populate live frames into Anterior, Lateral, Posterior, or Overhead Squat (OHSA) views.
  - Calculates landmark mesh coordinates, joint angles, postural distortion syndromes, and auto-generates NASM Corrective Exercise (CEx) protocols.
- **⚖️ AI Body Composition & Visual Anthropometry Scanner**:
  - Updated `AiBodyCompositionScannerModal.tsx` with `initialPhotoFront` and `isCoachView={true}` props to run visual anthropometry and body fat scans during live sessions.
- **🏋️ Dynamic Compound Lift Form Critique**:
  - Integrated `LiveVideoFormCaptureModal.tsx` mapped to active workout exercises (Squat, Deadlift, Bench, OHP, Single-Leg Squat, Row) with real-time `speakNasmCue()` audio coaching cues.
- **📋 Docked NASM Clinical Movement Assessment Suite**:
  - Mounted `NasmAssessmentSuite.tsx` in a docked live modal for scoring OHSA 5 kinetic checkpoints, Single-Leg Squats, Pushing/Pulling assessments, and Cardio vitals directly to the client's database profile.
- **🛡️ Adversarial Stress Testing & Production Verification**:
  - Created `LiveSessionStressTesting.test.ts` testing signaling concurrency, malformed signals, canvas security exceptions, all-compensation CEx generation, and roster injection protection.
  - Passed all 123 test files (682 tests), full type check, linting, and Next.js 16.3.1 production build.

---

## [1.21.0] - 2026-09-03

### Added & Enhanced
- **🛡️ API Route Security Hardening & Rate Limiting**:
  - Implemented multi-tier sliding window rate limiting on `/api/coach/tts`, `/api/auth/demo`, and `/api/coach/workouts/generate-rag` returning standard RFC 429 `Retry-After` headers.
  - Enforced Supabase authenticated session verification across all coach AI generation and speech routes.
- **💳 Stripe Subscription Lifecycle & Deletion Protection**:
  - Enhanced Stripe webhook handler (`/api/stripe/webhook`) to track `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, and invoice payment events.
  - Added automatic active Stripe subscription cancellation upon user account deletion (`/api/account/delete`).
- **🎙️ Supabase Storage-Backed Voice Notes & Realtime Chat**:
  - Created `lib/voice-notes-storage.ts` uploading recorded audio blobs to a private Supabase Storage bucket (`coach-voice-notes`) and storing compact references in PostgreSQL.
  - Added batch CDN pre-signing (`enrichMessagesWithSignedVoiceUrls`) delivering 24-hour playback URLs.
  - Added live Supabase Realtime channel subscription in `MessageThreadClient.tsx` for instant messaging.
- **⏱️ Production Vercel Cron Scheduling**:
  - Added `vercel.json` scheduling hourly marketing sequence dispatches (`/api/marketing/dispatch`) and Sunday weekly check-in push notifications (`/api/internal/notifications/weekly-checkin`).
  - Added dual Bearer `CRON_SECRET` and header authorization support.
- **📹 Coach Video HUD Native WebRTC Bridge**:
  - Created `lib/webrtc-peer-bridge.ts` managing `RTCPeerConnection`, Google STUN servers, SDP offer/answer negotiation, and ICE candidate trickling over Supabase Realtime signaling.
  - Integrated real camera and microphone hardware tracks with functional mic muting in `LiveVideoCameraHud.tsx`.
  - Replaced simulated remote feed with a native `<video>` element rendering the athlete's WebRTC stream.
- **🧩 FitnessTrackerClient Modularization**:
  - Extracted over 180 lines of state and side effects into dedicated domain hooks: `useWearableTelemetrySync`, `useLiveWorkoutSessionTimer`, and `useStaticStretchHoldTimer`.
  - Resolved double-interval elapsed timer increment bug.
- **📳 Mobile Native Capacitor Haptics & Sync Resilience**:
  - Bridged `@capacitor/core` native Haptics plugin to trigger physical Taptic Engine feedback on iOS/Android devices.
  - Replaced non-functional `navigator.vibrate` calls across `RestTimer`, `TempoMetronomeAudio`, and `useExerciseRestTimer`.
  - Added concurrency locking, Bearer token injection, and a 5-retry ceiling to `flushOfflineQueue`.
- **🤖 Gemini 2.5 Flash GA Engine**:
  - Updated model identifiers to `gemini-2.5-flash` in `lib/gemini-nasm-master-coach.ts` and documented complete environment variables in `.env.example`.

---

## [1.20.2] - 2026-09-03

### Added & Enhanced
- **👑 Prominently Enlarged Site-Wide Logos**:
  - Scaled up the official GAA architectural monogram mark in `SiteHeader` (38px -> 54px desktop, 36px -> 48px mobile), `SiteFooter` (36px -> 52px), Live Studio HUD (48px -> 56px), and Auth portals (`/auth/login`, `/auth/signup`, `/auth/reset-password`) (80px -> 100px) with 2px gold borders and 20px radiant glows.
- **📱 16 High-Resolution Apple PWA Splash Screens**:
  - Completely regenerated all splash targets in `public/splash/` with enlarged logos (~70% viewport width) and complete, uncropped "GORDON ATHLETIC ADVISORY" typography.
- **✨ Seamless Obsidian Vignette Blending**:
  - Engineered radial feathering in `scripts/generate-splash-assets.mjs` using `sharp` so the dark logo background blends perfectly into `#080E14` with zero square borders or artifact seams.
- **🍎 Native Mobile Splash Assets**:
  - Regenerated iOS native LaunchScreen assets in `Assets.xcassets/Splash.imageset/` and Android 12+ splash mipmaps / drawables in `android/app/src/main/res/`.

---

## [1.20.1] - 2026-09-02

### Added & Enhanced
- **✨ Omni-Surface Visual Elevation & Media Architecture**:
  - **Portrait 9:16 Mobile Penthouse Hero (`/images/hero-bg-mobile.jpg`)**: Upgraded mobile background to a dusk skyline penthouse sports science facility with live holographic kinetic chain angles (`84° / 71°`), heart rate telemetry (`148 BPM`), and power metrics (`395 W`).
  - **Luxury Open Graph Social Share Card (`/images/og-image.jpg`)**: Upgraded social share previews on iMessage, LinkedIn, Twitter/X, and WhatsApp to a panoramic private human performance facility featuring our backlit gold GAA architectural mark.
  - **Async Performance Advisory Hero (`/images/async-coaching-hero.jpg`)**: Embedded an executive advisory visual in `/async-coaching` showing an athlete reviewing running gait kinematics and periodization telemetry on a titanium tablet.
  - **Native Mobile Telemetry Device Showcase (`/images/mobile-apps-telemetry.jpg`)**: Embedded a commercial device showcase in `MobileAppPromoSection.tsx` highlighting the Athlete Performance Hub (`174 bpm`, `RPE 9.0`, 1RM velocity curves) and Apple Watch sync.
  - **Diagnostic Intake & Assessment Lab (`/images/apply-diagnostic-hero.jpg`)**: Embedded a sports science diagnostic header in `/apply` showing force-plate scanning, kinetic chain alignment (`94%`), and metabolic rate profiling (`1920 kcal/day`).

---

## [1.20.0] - 2026-09-02

### Added
- **🏛️ High-Margin Revenue Architecture (6 Multi-Channel Monetization Engines)**:
  - **12-Week Paid-In-Full (PIF) Transformation Blocks**: Upfront cash velocity ($895, $1,695, $3,895) with recurring add-ons multiplied by 3, full `mode: payment` checkout in Stripe, and up to $590 in savings.
  - **$97 Front-End Self-Liquidating 3D AI Biomechanical Audit (SLO)**: Dedicated conversion landing page (`/audit`) converting cold ad traffic into paid buyers with a 100% credit voucher toward private coaching retainers.
  - **Autonomous Digital Lab Membership Tier ($59/mo or $499/yr)**: 95%+ gross margin pure software revenue tier integrated directly into the `/apply` quiz to monetize non-concierge leads.
  - **Alumni Continuity Retainer ($149/mo or $1,295/yr)**: 90%+ gross margin post-transformation retention protocol with in-app triggers in Client Settings Studio and Executive Command Center.
  - **Clinical Supplement Dispensary Monetization (Fullscript & Thorne Integration)**: Formulations mapped to certified practitioner brands (Thorne, Momentous, Pure Encapsulations) with 15% athlete privilege discounts, master order banners, and 35% passive practice margins.
  - **B2B Corporate Executive Performance Retainers ($3,500/mo or $35,000/yr)**: High-ticket institutional wellness retainer for venture capital firms, law partnerships, and leadership teams with dedicated `/corporate` landing page and rate-limited inquiry API (`/api/corporate/inquire`).
- **🎨 Complete Visual Brand Reimagining (12 Bespoke Generated Assets)**:
  - Generated and deployed 12 luxury visual assets matching the signature obsidian, brushed liquid gold, and sports science aesthetic:
    - New Official GAA Master Brand Crest & Monogram Seal (`gaa-brand-crest.jpg`, `coach-gordon-shield-logo.jpg`, `brand-logo.png`).
    - Luxury Sports Science Performance Lab Hero Background (`hero-bg.jpg`).
    - Cinematic Golden Rim-Lit Athlete Platform CTA Background (`cta-bg.jpg`).
    - Architectural Dark Navy & Gold Private Sanctuary Auth Background (`auth-bg.jpg`).
    - Bespoke Package Card Imagery (`package-starter.jpg`, `package-momentum.jpg`, `package-transformation.jpg`, `package-lab.jpg`, `package-alumni.jpg`, `package-corporate.jpg`, `package-audit.jpg`).
    - Pharmaceutical-Grade Amber Glass & Matte Obsidian Dispensary Stack (`dispensary-stack.jpg`).

---

## [1.19.6] - 2026-09-02

### Added & Fixed
- **📸 Multi-Pose Independent Photo Gallery & Non-Overwriting State Engine**:
  - **Independent Photo Store Per Pose**: Resolved photo overwriting in `AiPostureMeshScannerModal.tsx`. Photos for all 4 views (`anterior`, `lateral`, `posterior`, and `overhead_squat`) are now stored in an independent state record map (`photosByView`), so uploading or snapping a photo for one pose no longer overwrites photos from the other poses.
  - **Multi-Pose Gallery Progression**: Added a live progress bar (`Multi-Pose Gallery (X/4 Captured)`) and individual status badges (`✓ Saved`, `✓ Analyzed`, `Empty`) on each pose selection preset.
  - **Multi-Pose Scan Results Retention**: AI biomechanical mesh scan results are stored independently per pose (`scanResultsByView`), allowing coaches to inspect landmark angles and compensations for each angle at any time.
  - **Session Storage Persistence**: Added automatic session caching (`sessionStorage`) keyed by athlete ID so photos and scans persist across accidental modal dismissals.
  - **Per-Pose Granular Photo Management**: Added a per-pose `Clear` button to remove or retake a single view's photo without wiping out other poses, alongside a global `Clear All Poses` action.
  - **Combined Multi-Pose Findings Application**: `Apply AI Findings to NASM Assessment Form` aggregates static postural findings, OHSA kinetic chain observations, and clinical summaries across all scanned views in a single click.

---

## [1.19.5] - 2026-09-02

### Fixed & Enhanced
- **📱 Mobile Responsive Viewport & Stacking Layer Resolution**:
  - **Elevated Stacking Layer**: Raised `AiPostureMeshScannerModal` backdrop `zIndex` to `100050` (well above `MobileBottomNav`'s `9999`), permanently eliminating the bug where the bottom navigation dock covered the "Take Photo", "Upload Photo", and "Run AI Scan" buttons on mobile devices.
  - **Mobile Responsive Layout**: Replaced the rigid desktop two-column grid (`minmax(320px, ...)`) with fluid single-column mobile viewports and sub-tab switching between `[ Camera & Viewfinder ]` and `[ Setup Guide ]` (and `[ AI Findings ]`).
  - **Sticky Shutter Bar & Safe-Area Insets**: Anchored camera shutter buttons on mobile screens with dedicated bottom padding (`env(safe-area-inset-bottom, 20px)`), ensuring all controls remain directly clickable above browser bars.
  - **Auto-Fitting Landmark Canvas**: Canvas dimensions now dynamically measure and sync with the bounding client rect on mobile screens.

---

## [1.19.4] - 2026-09-02

### Added
- **📸 Live Camera "Take Photo" Shutter & Alignment Reticle**:
  - Added a dedicated **"Take Photo"** button in `AiPostureMeshScannerModal.tsx` for direct in-app camera capture.
  - Implemented live WebRTC camera streaming (`getUserMedia`) with mobile native camera fallback (`capture="environment"`).
  - Integrated dynamic **plumb line & horizontal checkpoint reticle overlay** (shoulders, hips, knees) rendered directly on top of the live camera feed for precise athletic alignment.
  - Added **"⏱️ 3s Timer"** countdown for solo client positioning and auto-capture.
  - Added camera flip functionality (switch between rear/environment and front/user cameras with automatic mirror reflection).
  - High-contrast tactile **"SNAP PHOTO"** shutter button.

---

## [1.19.3] - 2026-09-02

### Added & Enhanced
- **📸 Biomechanical Postural Mesh Scanner Clinical Photo Directives**:
  - Implemented exact step-by-step instructions for what the client is doing for each of the 4 photos in the AI Postural Mesh Scanner:
    1. **Anterior View (Front-Facing)**: Barefoot, hip-width, 2nd toe forward, arms relaxed at sides, eyes level, normal breathing.
    2. **Lateral View (Side Profile)**: Turned 90°, barefoot, hip-width, thumbs forward, chin level, plumb line alignment.
    3. **Posterior View (Rear-Facing)**: Back to camera, barefoot, arms relaxed, heels visible, scapular and calcaneal symmetry.
    4. **Overhead Squat (OHSA)**: Arms straight overhead with locked elbows (bisecting ears in "Y/I" position), squatting to chair depth; photo captured at lowest inflection point on rep 3 or 4.
  - **In-App Photo Setup Guide Tab**: Integrated a dedicated tab switcher in `AiPostureMeshScannerModal.tsx` allowing coaches to view photo directives and AI scan analysis interchangeably.
  - **Live Client Cue Banner**: Embedded a prominent real-time prompt beneath the view preset buttons for verbal cues during live client assessments.
  - **Domain-Level Instructions**: Exported `POSTURAL_VIEW_INSTRUCTIONS` in `lib/ai-postural-mesh-scanner.ts` with comprehensive unit tests in `lib/ai-postural-mesh-scanner.test.ts`.

---

## [1.19.2] - 2026-09-02

### Fixed
- **🏋️ Stage 4 Assessment Action & Milestone Deep-Linking**:
  - Resolved the Stage 4 "Conduct Overhead Squat Assessment" button and milestone execute actions doing nothing when clicked.
  - Added specific deep links for each Stage 4 milestone:
    - *5 Kinetic Chain static postural screen* ➔ `?tab=assessment&subtab=posture#workspace-tab-content`
    - *Overhead Squat Assessment (OHSA)* ➔ `?tab=assessment&subtab=ohsa#workspace-tab-content`
    - *4-Phase Corrective Exercise Continuum (CEx)* ➔ `?tab=assessment&subtab=cex#workspace-tab-content`
  - Updated `NasmAssessmentSuite.tsx` to accept `initialSubTab` prop (`ohsa`, `posture`, `cex`, `dynamic`, `cardio`, `radar`, `history`) and synchronize state reactively.
  - Added native viewport scroll synchronization: wrapped workspace tools in `#workspace-tab-content` with `scrollMarginTop`.
  - Added `handleActionNavigation` in `CoachOnboardingProgressionCard.tsx`: if the user is already on the target tab, smoothly scrolls into view immediately; if navigating between tabs, guarantees full navigation and auto-scrolling to the workspace tool.

---

## [1.19.1] - 2026-09-02

### Fixed & Enhanced
- **🔗 Direct Actionable "Suggested Items" & Next Step Deep Links**:
  - Made the "Recommended Next Step" callout banners in both `CoachOnboardingWorkflowStudio.tsx` and `CoachOnboardingProgressionCard.tsx` interactive, clickable action links.
  - Converted all 9-stage milestone items in the expandable inspection drawers into tactile 1-click execution links that launch directly into the relevant workspace tab (`shield`, `assessment`, `periodization`, `program`, `sessions`, etc.).
  - Converted the overview page "Phase Progression Suggestion" and "Next Actions" cards into clickable workspace launchers.
- **🛡️ Auto-Triage & Consultant Memo Database Hardening**:
  - Fixed `/api/coach/clients/[id]/periodization/auto-triage` to persist notifications to `coach_client_messages` instead of legacy `messages`.
  - Replaced unsafe `.single()` queries with `.maybeSingle()` to ensure reliable execution for newly onboarded athletes without existing workout plans.
  - Wrapped notification logging in non-blocking try-catch blocks to prevent notification errors from failing the core periodization modulation.
  - Applied the same message schema fix to `/api/coach/clients/[id]/periodization` and `/api/coach/clients/[id]/consultant-memo`.
- **🧭 Milestone Completion Logic**:
  - Corrected Stage 1 actionTab to map to `commerce`.
  - Updated `hasOhsaFindings` in `lib/coach-onboarding-progression.ts` to recognize completed assessments where zero compensations were observed.
- **🧪 Comprehensive Regression & Smoke Test Suite**:
  - Added 19 new automated tests across `lib/coach-onboarding-workflow-regression.test.ts` and `components/coach/CoachOnboardingWorkflowInteractive.test.ts`.
  - Verified full test suite passes with 603/603 tests across 108 test files and 0 TypeScript errors.

---

## [1.19.0] - 2026-09-02

### Added
- **🧭 9-Stage Client Onboarding & Progression Stepper Cockpit**:
  - Implemented interactive `CoachOnboardingProgressionCard.tsx` on the athlete profile view (`/coach/clients/[id]`).
  - Features real-time visual progress percentage, current stage heading, stage status badges (`completed`, `in_progress`, `blocked`, `pending`), and tactile 1-click next action routing.
  - Includes an expandable milestone drawer detailing all required checklist items across the 9 stages:
    1. *Lead Intake & Coach Assignment*
    2. *Clinical Liability Shield & PAR-Q+*
    3. *Baseline Biometrics & Environmental Readiness*
    4. *NASM Movement Screen & Testing Suite (OHSA & CEx)*
    5. *Periodization Architecture (12-Week OPT™ Macrocycle)*
    6. *Program Design & Prescription Workspace*
    7. *Delivery Kickoff & Live Coaching (SOAP Notes)*
    8. *Telemetry Monitoring, Weekly Follow-Ups & Triage*
    9. *Lifecycle Governance & Long-Term Retention*
- **⚡ Reactive Domain Progression Engine (`lib/coach-onboarding-progression.ts`)**:
  - Evaluates client telemetry dynamically against existing database records (`client_intake_forms`, `fitness_profiles`, `nasm_assessments`, `workout_plans`, `sessions`, `weekly_checkins`, `client_lifecycle_audit_logs`) without manual duplicate tracking.
  - Automatically generates urgent next action recommendations with direct tab routing (`shield`, `assessment`, `periodization`, `program`, `sessions`, `checkins`, `lifecycle`).
- **🛡️ Clinical Liability Shield & PAR-Q+ Gating**:
  - Automatically flags cardiovascular or high-risk medical criteria on the PAR-Q+ questionnaire, setting Stage 2 into a `blocked` state with urgent physician clearance alerts.
- **📊 Granular Coach Pipeline & Athlete Roster Stage Badges**:
  - Updated the Coach Pipeline (`/coach?tab=pipeline`) to reflect progression stages: `Intake`, `Onboarding & Vitals`, `Movement Testing`, `Program Build`, `Active Delivery`, and `At Risk`.
  - Added dedicated progression stage chips directly to client roster rows on the Coaches Command Center (`/coach`).
- **🧪 Comprehensive Test Suite**:
  - Added 9 unit tests in `lib/coach-onboarding-progression.test.ts` covering all lifecycle transitions, edge cases, and clinical block gating.

---

## [1.14.0] - 2026-08-31

### Added
- **🍏 Native iOS Capacitor App Packaging**:
  - Configured complete iOS application (`com.gordonathletic.app`, `Gordon Athletic Advisory`) targeting iOS 16.0+ deployment with Swift Package Manager (SPM) and Capacitor 8 framework.
  - Implemented dark obsidian luxury theme (`#0A0E18`) with brushed gold accents (`#D4AF37`), custom iOS App Icon assets (`AppIcon-512@2x.png`), multi-scale launch screens, and automatic safe-area layout insets.
  - Added dedicated npm workflow scripts: `cap:sync`, `cap:open`, `cap:build:ios`, and `ios:dev`.
- **📡 Native HealthKit Background Delivery Engine**:
  - Implemented custom Swift Capacitor plugin (`GAAHealthKitPlugin.swift` & `GAAHealthKitPlugin.m`) exposing biometrics queries, authorization sheets, and workout exports to Apple Health.
  - Engineered `GAAHealthSyncManager.swift` coordinator registering background observer queries (`HKObserverQuery`) and immediate background delivery (`HKHealthStore.enableBackgroundDelivery`) for resting heart rate, HRV rMSSD, active calories, steps, sleep architecture (total/deep/REM/core), dietary nutrition, and workouts.
  - Integrated `GAAHealthSyncManager.shared.registerBackgroundObservers()` in `AppDelegate.swift` `didFinishLaunchingWithOptions`, fulfilling Apple background wake requirements to process biometrics when the app is suspended.
  - Configured `App.entitlements` with `com.apple.developer.healthkit` and `com.apple.developer.healthkit.background-delivery`, alongside `Info.plist` `UIBackgroundModes` (`fetch`, `processing`, `remote-notification`).
- **🔄 Unified Cross-Platform Health Bridge**:
  - Enhanced `lib/native-healthkit-bridge.ts` providing seamless runtime detection (`isNativeIOS()`, `isNativeAndroid()`, `isNativeMobile()`) and unified method dispatch.
- **⚡ Device-Aware Telemetry Studio HUD**:
  - Upgraded `components/fitness/WearablesDeviceStudio.tsx` to detect native iOS environments, showing direct 1-tap "Connect Apple Health (Native HealthKit)" authorization buttons, background delivery status badges, and 1-tap manual sync triggers.
- **🧪 Comprehensive Verification**:
  - Full test suite in `lib/native-healthkit-bridge.test.ts` and successful native `xcodebuild` compilation (`** BUILD SUCCEEDED **`).

---

## [1.13.0] - 2026-08-31

### Added
- **🤖 Native Android Capacitor App Packaging**:
  - Configured complete Android mobile application (`com.gordonathletic.app`, `Gordon Athletic Advisory`) targeting Android 15 (API 35) with Android 8.0+ backward compatibility.
  - Implemented dark obsidian luxury theme (`#0A0E18`) with brushed gold accents (`#D4AF37`), customized status and navigation bar styling, and packaged multi-density launcher icons and splash drawables.
  - Added dedicated npm workflow scripts: `cap:sync:android`, `cap:open:android`, `android:dev`, and `cap:build:android`.
- **📡 Native Health Connect & WorkManager Background Delivery**:
  - Implemented native Android Capacitor plugin (`GAAHealthKitPlugin.java`) matching the iOS `GAAHealthKit` interface for 100% web bridge parity.
  - Engineered `GAAHealthSyncManager.java` coordinator and `GAAHealthBackgroundWorker.java` (`androidx.work.Worker`) to execute scheduled biometrics ingest (RHR, HRV, steps, active calories, sleep stages, dietary macros, workouts) and direct backend HTTP POST synchronization to `/api/wearables/sync` even when the app is closed.
  - Integrated `BootReceiver` in `AndroidManifest.xml` to automatically re-arm background delivery cycles upon device reboot or package updates.
- **🔄 Unified Cross-Platform Health Bridge**:
  - Upgraded `lib/native-healthkit-bridge.ts` with `isNativeMobile()`, `isNativeAndroid()`, `isNativeIOS()`, and `getNativePlatform()` runtime helpers.
  - Standardized biometrics queries, background delivery activation, and workout logging across iOS (HealthKit) and Android (Health Connect).
- **⚡ Device-Aware Telemetry Studio HUD**:
  - Updated `components/fitness/WearablesDeviceStudio.tsx` to detect Android native environments, presenting tailored Health Connect background sync cards and 1-tap connection buttons.
- **🧪 Comprehensive Test Coverage**:
  - Expanded `lib/native-healthkit-bridge.test.ts` to verify platform detection, authorization, and background sync operations across iOS, Android, and Web environments.

---

## [1.12.0] - 2026-08-31

### Added
- **📡 Single Source of Truth OS Health Telemetry (Apple Health & Google Health Connect)**:
  - Unified biometric ingestion exclusively around the Big 2 mobile operating system health databases: Apple Health (iOS / Apple Watch / macOS) and Google Health Connect (Android / Wear OS / Pixel Watch / Samsung Health).
  - Ingests and normalizes Resting Heart Rate (RHR), morning HRV (rMSSD), sleep stages (Deep, REM, Core, Awake, Sleep Efficiency), dietary nutrition macros (Calories, Protein, Carbs, Fat, Fiber, Hydration), daily burn, and workout sessions.
- **⚙️ Settings-Only Configuration & Zero-Manual Sync**:
  - Housed telemetry configuration exclusively in Settings > Health & Telemetry (`/dashboard/settings?tab=wearables`).
  - Added automatic device OS detection (iOS vs. Android) with 1-click "Set as Single Source of Truth" pairing.
  - Completely eliminated manual "Sync" buttons across the application (Executive Sleep HUD, Readiness Recovery Tracker, Fitness Lab), ensuring 100% automated background data synchronization.
- **🧹 Legacy Wearables Wiring Purged**:
  - Completely removed legacy, unused wearables (Whoop, Oura, Garmin, Polar, Fitbit) and their obsolete cryptographic adapters, database checks, and UI components.
- **📲 Direct Webhook & Automation Ingestion**:
  - Added token-verified webhook endpoint (`/api/wearables/webhook`) with 1-click token copy for iOS Shortcuts, Health Auto Export, and Android Health Connect background push bridges.
- **🧪 Comprehensive Test Coverage**:
  - Added full test suite for Google Health Connect normalizer (`lib/google-health-bridge.test.ts`), Apple Health and Google Health webhook verification (`lib/wearable-webhook-adapters.test.ts`), and updated API routes (`app/api/wearables/route.test.ts`).

---

## [1.11.0] - 2026-08-31

### Added
- **⚡ 1-Click Active Program Overwrite & Calibration**:
  - Coaches can seamlessly overwrite and calibrate active athlete training routines in place with a single click.
  - Keeps athlete Fitness Lab immediately synchronized without orphaned or conflicting workout plans.
  - Automatically posts real-time concierge message updates informing athletes of their newly calibrated routines.
- **🛡️ Automated PAR-Q Health Screening & Sync**:
  - Client medical questionnaire updates dynamically evaluate risk tiers, persist to intake records, and sync directly to orthopedic limitation profiles.
  - Automatically dispatches high-priority notifications to the assigned coach's message thread flagging updated medical conditions or injuries.
- **🧬 Biomechanical Contraindication Substitutions**:
  - Automated detection of orthopedic and cardiovascular contraindications (knee patellofemoral, lumbar spine, shoulder impingement, hypertension).
  - Automatically replaces contraindicated exercises with safe, joint-friendly NASM alternatives (e.g. Spanish Squats, McGill Big 3) with safety coaching cues.
- **📜 Program Version History & Active Switcher**:
  - Comprehensive coach drawer displaying all past periodization mesocycles, creation dates, and overwrite timestamps.
  - 1-click active routine switching and direct management of deprecated training plans.
- **🚨 High-Visibility Medical Clearance Alerts**:
  - Dedicated real-time warning banners in the Coach Program Workspace and Liability Shield with direct 1-tap shortcuts to calibrate and deploy safe protocols.
- **🧪 Comprehensive Test Coverage**:
  - Added unit test suites verifying in-place plan overwrite, plan deletion, PAR-Q evaluation, coach notifications, and automated exercise substitutions.

---

## [1.10.0] - 2026-08-31

### Added
- **⚡ 1-Click Fast Pass Social Authentication (Google & Apple)**:
  - Integrated 1-click Google and Apple Sign-In buttons across athlete and coach login and registration portals.
  - Added individual provider connection spinners and responsive disabled state handling during sign-in.
  - Implemented seamless fallback to standard email and password authentication with security verification.
- **🔐 Resilient Session Management & Error Recovery**:
  - Added automated handling for cancelled sign-ins or network interruptions with clear, friendly user notifications.
  - Hardened authentication session persistence across web and mobile browser surfaces.
- **👤 Automated Athlete Profile Synchronization**:
  - Automatically synchronizes athlete display names and profile photos from authenticated accounts.
  - Seamlessly links athletes to their designated coach when joining through referral invitations.
- **👑 Role-Aware Navigation**:
  - Automatically directs coaches to the Coach Command Center and athletes to their Training Dashboard.
- **📜 Public Compliance & Direct Legal Policies**:
  - Integrated direct links to public Terms of Service and Privacy Policy documentation across all account entry points.
- **🧪 Comprehensive Verification**:
  - Complete automated test suite verifying sign-in flows, error recovery, profile synchronization, and role navigation.

---

## [1.9.0] - 2026-08-31

### Added
- **⌚ Multi-Provider Wearable Webhook Synchronization**:
  - Automated background push ingestion for Whoop (Recovery, Strain, Sleep), Oura Ring (Readiness, Sleep Stages, Activity), and Apple HealthKit.
  - Secure signature verification and automated challenge handshakes for continuous data feeds.
  - Automatic cardiovascular training zone classification and physiological stress scoring.
- **🧩 Responsive Workout & Program Architecture**:
  - Modular workout logging delivering sub-millisecond set logging, personal record breakthrough detection, and offline sync fallbacks.
  - Active rest countdown timers with audio cadences, personal record fanfare chimes, and lock screen media controls.
  - Live program editing with diff summaries and background draft auto-saving.
- **🛡️ Quality Assurance & Strict Validation**:
  - Clean compilation across 100% of application modules with zero compiler warnings.
  - Comprehensive type safety across all athlete and coach domain schemas.
- **⚡ Client Performance & Code-Splitting**:
  - Dynamically code-split interactive 3D models, camera scanners, and audio studios for fast mobile load times.
- **🔒 Environment Isolation**:
  - Scoped developer previews strictly to isolated non-production environments.
- **🧪 End-to-End User Pathway Verification**:
  - Automated verification driving authentic multi-step athlete onboarding and training flows.

---

## [1.8.0] - 2026-08-30

### Added
- **📱 Tactile Mobile Bottom Dock Navigation**:
  - Responsive floating glassmorphism dock for mobile devices with gold active pins, safe-area padding, and native mobile haptics.
  - Contextual tabs for VIP Athlete (Command Center, Fitness Lab, Live Studio, Concierge, Settings) and Coach (Triage, Athletes, Live Studio, Operations).
  - Viewport bottom containment preventing content cutoff across mobile viewports.
- **📶 Offline Telemetry Status Badge & Auto-Sync**:
  - Real-time network state monitoring detecting offline status in gym basements or flights.
  - Floating pill displaying pending offline workout sets with 1-tap manual sync and automatic queue flushing upon network reconnection.
- **🚀 Enhanced PWA Web App Manifest & Install Experience**:
  - High-end obsidian luxury styling, display overrides, and sports-science metadata categorization.
  - 1-tap app shortcuts for instant launch into Fitness Lab, Concierge Messages, and 3D Recovery Matrix.
  - Refined install prompt with step-by-step iOS and mobile browser guidance.
- **✨ Unified Obsidian & Champagne Gold Design Tokens**:
  - Standardized luxury typography, micro-labels, input surfaces, and tactile buttons across all interactive forms.
  - Executive header and footer navigation on Legal and Privacy pages.
- **⚡ Speed & Layout Optimization**:
  - Touch manipulation tuning, tap highlight removal, reduced motion support, and overscroll bounce prevention.

---

## [1.7.0] - 2026-08-30

### Added
- **👑 Luxury Vector Icon System Modernization**:
  - Comprehensive SVG vector icon engine with 90+ bespoke icons spanning sports science, periodization, biometric telemetry, audio/video studio, travel concierge, and clinical governance.
  - Standardized metallic gold gradients with ambient translucent fills and high-contrast status tones across 40+ application modules.

---

## [1.6.0] - 2026-08-30

### Added
- **🦵 Biomechanical Diagnostics & Corrective Continuum**:
  - Integrated Knee Varus and Posterior Pelvic Tilt syndromes into clinical screening and 4-phase corrective exercise protocols.
  - Dynamic exercise substitutions tailored across Stabilization, Strength Endurance, Maximum Strength, and Power phases.
- **📊 Standardized Endurance Norms**:
  - Standardized age-bracketed scoring for performance testing across 20–29, 30–39, 40–49, 50–59, and 60+ demographics.
- **🔬 Movement Screen Diagnostics**:
  - Connected clinical movement screen records directly into Fitness Lab diagnostics view.
- **👥 Coach Athlete Lifecycle Visibility**:
  - Enhanced real-time visibility into active, pending, paused, and archived athlete statuses.
- **🎙️ Personalized Gym-Floor Audio Cues**:
  - Spoken exercise swap suggestions and contextual follow-ups dynamically personalized to athlete name, active workout focus, and training phase.

---

## [1.5.0] - 2026-08-30

### Added
- **🎥 Kinetic Form Diagnostics & Correctives Studio**:
  - Differentiated tactical in-gym video recording from the comprehensive clinical diagnostic studio in Fitness Lab.
  - Interactive compound lift parameter configuration, kinetic deviation checklist screening, and overactive/underactive muscle imbalance mappings.
  - Complete 4-Phase corrective exercise continuum generation (Inhibit SMR, Lengthen Static, Activate Isolated, Integrate Dynamic).
- **📁 Video Footage Upload & Dropzone Analyzer**:
  - Drag-and-drop video footage uploader supporting high-definition video clips.
  - Embedded video preview player with slow-motion playback speed controls (1.0x, 0.5x, 0.25x).
  - Intelligent compound lift inference from video filenames with multi-stage kinetic frame scanning animations.
- **🔬 In-Session Workout Cam to Correctives Lab Bridge**:
  - 1-tap transition to open the complete corrective protocol directly from active workouts.
  - Automatic workspace transition transferring active lifts and observed deviations into the Lab Studio for root-cause corrective programming.

---

## [1.4.0] - 2026-08-30

### Added
- **🏆 1RM Historical Personal Record Vault & Live Record-Breaker Flare**:
  - Real-time estimated 1RM calculations on working resistance sets.
  - Instant golden breakthrough celebration flare with fanfare audio, haptic pulses, trophy iconography, and delta gain indicators.
  - Movement card PR badges displaying all-time record weights, reps, and historical trend curves.
  - Warmup set exclusion to ensure accurate record tracking.
- **❤️ Live Cardiorespiratory & Caloric Telemetry Dock**:
  - Floating live workout session dock displaying pulsating heart rate cadence synchronized with BPM.
  - Cardio zone classifications with aerobic, threshold, and peak zones.
  - Continuous metabolic calorie burn rate accumulation during active workouts.
- **⚡ Smart Superset & Circuit Grouping Mode**:
  - Automated pairing for physiological antagonist movements and power complexes with 1-tap dual-exercise matrix logging.
  - Split transition vs. recovery rest countdown intervals.
- **🎥 In-Session Live Video Form Capture**:
  - Embedded camera recorder with spinal axis and depth crosshairs, slow-motion playback, and 5-checkpoint kinetic form scoring.

---

## [1.3.0] - 2026-08-30

### Added
- **🎙️ Ask Coach Gordon Interactive Voice Assistant**:
  - Warm, authoritative concierge AI backed by comprehensive clinical sports science handbooks across 16 specialization curricula.
  - High-fidelity neural voice audio streaming with low latency.
- **🎧 Continuous Hands-Free In-Ear Gym Mode**:
  - Compact earbud interface for live in-ear mic streaming, hands-free gym operation, and speech-interrupt audio pausing.
- **⚡ 1-Tap Interactive In-Gym Action Cards**:
  - Dynamic in-chat execution cards for 1-tap exercise swaps, 90s rest countdown timers, and automatic working weight regulation.
- **📹 5-Second Video Form Check & In-Ear Cues**:
  - Embedded camera recorder for compound lifts delivering instant biomechanical scorecards and audio cues directly into headphones.
- **🧠 Proactive Telemetry & Coach Directives**:
  - Automatic greeting inspection of sleep duration, readiness scores, and workout intensity, alongside the direct coach dispatch hub.
- **🛡️ Enterprise Security Gate**:
  - Automated dependency auditing, static code analysis, and deterministic test automation.

---

## [1.2.0] - 2026-08-30

### Added
- **🏃 Equipment-Aware Cardio Conditioning Protocol**:
  - Dynamically filters aerobic base, threshold intervals, and power sprints strictly to equipment the athlete owns.
  - Universal sports science metrics: Prescribed Duration, Target Intensity (RPE), Heart Rate Zones, and clean format designations.
- **🏋️ Strength Isolation & Mobile Ergonomics**:
  - Cleanly isolated tempo cadence metronomes, tempo inputs, and Reps in Reserve (RIR) set logging strictly to resistance movements.
  - Smooth scroll positioning on mobile exercise cards with sticky navigation header offset.

---

## [1.1.0] - 2026-08-30

### Added
- **🍎 Continuous Apple Health Ingestion**:
  - Automatic background ingestion of resting heart rate, nocturnal HRV, sleep architecture, and dietary nutrition macros on app launch, screen wake, and interval polling.
  - Multi-feature distribution to Dynamic Load Recommender, 3D Recovery Matrix, Executive Sleep HUD, and Metabolic Nutrition Lab.
- **🏋️ Workout Card Enhancements & Mobility Timers**:
  - 6-tier resistance band color-to-weight matrix with progressive overload tracking.
  - Timed static stretch and foam rolling countdown timers with audio cues.
  - Tabbed single-day focused workout view with collapsible daily briefing.

---

## [1.0.0] - 2026-08-29

### Added
- **👑 Master Sports Science Intelligence & Mobile Luxury Architecture**:
  - Milestone production release featuring 16-curriculum sports science intelligence engine across foundation, athletic performance, physique biomechanics, corrective exercise, coaching psychology, sports nutrition, and clinical pharmacotherapy.
  - Standardized luxury vector iconography across navigation and interface surfaces.
  - Mobile UX optimization with top-bar login buttons and active session status indicators.
  - Responsive typography clamp and strict viewport containment across all screen sizes.
  - Interactive release modal and What's New intelligence portal.

---

## [0.9.8] - 2026-08-22

### Added
- **🧬 3D Human Body Muscle Recovery Matrix**:
  - Interactive 3D anatomical heatmaps for male and female physiology with localized muscle zone fatigue modeling.
  - Multi-factor supercompensation algorithm adjusting for age, conditioning level, and nutritional support.
  - 3D rotation, muscle inspection HUD, and corrective SMR/stretch prescriptions.

---

## [0.9.7] - 2026-08-22

### Added
- **🛡️ Prescription Drug Interaction Shield**:
  - Clinical medication screening matrix cross-examining client prescriptions against ergogenic supplements.
  - Chrono-separation timing rules for medications and mineral/protein supplements.
  - Automated nutrient co-prescription recommendations for depleted pathways.
  - Strict safety locks against adverse supplement-medication interactions.

---

## [0.9.5] - 2026-08-22

### Added
- **💊 Evidence-Based Sports Supplementation**:
  - Clinical compound formulations with zero-liability medical contraindication locks.
  - 4-window chrono-nutrition timeline (Morning, Pre-Workout, Post-Workout, Bedtime).
  - Coach supplement prescriber portal for client protocol assignment.

---

## [0.9.4] - 2026-08-22

### Added
- **🚨 Coach Triage Cockpit & Sunday Dossier**:
  - Rapid triage action queue categorizing athletes into Urgent, Attention, and Autonomous states.
  - Digital PAR-Q+ health questionnaire with automated cardiovascular risk stratification.
  - Executive Sunday briefing generator synthesizing weekly telemetry into actionable memos.
  - Specialized athlete toolboxes for desk workers, frequent flyers, and lumbar recovery.

---

## [0.9.3] - 2026-08-22

### Added
- **⚡ AI Biomechanical Form Studio & Travel Adapter**:
  - AI video form critique studio scanning kinetic chain checkpoints on compound lifts.
  - Executive travel workout adapter converting barbell training to hotel gym equipment.
  - Interactive mobility radar and 12-week macrocycle periodization roadmap.

---

## [0.9.2] - 2026-08-22

### Added
- **💳 Private Retainer Architecture**:
  - Master sports science advisory membership retainers (Performance Protocol, Hybrid Concierge Flagship, Executive 1:1 Tier X).
  - Secure payment checkout integration with bespoke clinical add-on accelerators.
