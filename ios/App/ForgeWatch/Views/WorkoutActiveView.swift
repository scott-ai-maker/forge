import SwiftUI

/**
 * WorkoutActiveView
 * Comprehensive, wrist-first active workout view supporting all 4 workout phases:
 * 1. Warm-Up & Movement Prep
 * 2. Resistance Training (with Digital Crown precision, plate math, and set logging)
 * 3. Cardio Conditioning (with live Tanaka zone pacing)
 * 4. Cool-Down & Mobility (with stretch hold timers)
 * Plus full workout plan overview sheet to jump to any prescribed exercise.
 * Forge Athletic
 */
private enum WorkoutActiveSheet: Identifiable {
    case modality
    case loadHelper
    case phases
    case exerciseDetail

    var id: String {
        switch self {
        case .modality: return "modality"
        case .loadHelper: return "loadHelper"
        case .phases: return "phases"
        case .exerciseDetail: return "exerciseDetail"
        }
    }
}

public struct WorkoutActiveView: View {
    @ObservedObject var coordinator = WatchSessionCoordinator.shared
    @ObservedObject var workoutManager = WatchWorkoutManager.shared

    @State private var loggedReps: Double = 10.0
    @State private var loggedWeight: Double = 135.0
    @State private var loggedRpe: Double = 8.0
    @State private var isCrownFocusedOnReps: Bool = true
    @State private var currentModality: WatchEquipmentModality = .barbell
    @State private var barbellBarWeight: Double = 45.0
    @State private var activeSheet: WorkoutActiveSheet? = nil
    @State private var showCancelConfirmation: Bool = false
    @State private var showFinishConfirmation: Bool = false
    @State private var selectedExerciseForDetail: WatchExerciseInfo? = nil

    // Drill & stretch interactive countdown timer state
    @State private var activeTimerItemName: String? = nil
    @State private var activeTimerRemainingSec: Int = 0
    @State private var activeTimerTotalSec: Int = 0
    @State private var drillTimer: Timer? = nil

    public var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                // 1. Top Glance Header: Workout Day, Focus & Heart Rate
                HStack(alignment: .center) {
                    VStack(alignment: .leading, spacing: 1) {
                        Text("DAY \(coordinator.workoutState.dayNumber)")
                            .font(.system(size: 10, weight: .black, design: .rounded))
                            .foregroundColor(Color(red: 0.83, green: 0.63, blue: 0.09)) // Gold

                        Text(coordinator.workoutState.focus)
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                            .lineLimit(1)
                    }

                    Spacer()

                    // Optical HR Badge
                    HStack(spacing: 3) {
                        Image(systemName: "heart.fill")
                            .font(.system(size: 10))
                            .foregroundColor(heartRateColor)
                        Text(workoutManager.currentHeartRate > 0 ? "\(workoutManager.currentHeartRate)" : "--")
                            .font(.system(size: 13, weight: .black, design: .monospaced))
                            .foregroundColor(.white)
                    }
                    .padding(.horizontal, 6)
                    .padding(.vertical, 3)
                    .background(Color.white.opacity(0.08))
                    .cornerRadius(8)
                }
                .padding(.horizontal, 4)

                // 2. 4-Phase Segmented Navigation Bar
                HStack(spacing: 4) {
                    PhaseTabButton(
                        label: "WARM",
                        phase: "warmup",
                        activePhase: coordinator.workoutState.activePhase,
                        color: Color(red: 0.97, green: 0.58, blue: 0.11), // Orange
                        onSelect: { coordinator.selectPhase("warmup") }
                    )

                    PhaseTabButton(
                        label: coordinator.workoutState.exercises.isEmpty ? "NO LIFTS" : "LIFTS",
                        phase: "resistance",
                        activePhase: coordinator.workoutState.activePhase,
                        color: coordinator.workoutState.exercises.isEmpty ? Color.gray : Color(red: 0.22, green: 0.74, blue: 0.97), // Cyan
                        onSelect: { coordinator.selectPhase("resistance") }
                    )

                    PhaseTabButton(
                        label: (coordinator.workoutState.cardioProtocol?.isCompleted == true || coordinator.isCardioCompleted) ? "CARDIO ✓" : "CARDIO",
                        phase: "cardio",
                        activePhase: coordinator.workoutState.activePhase,
                        color: (coordinator.workoutState.cardioProtocol?.isCompleted == true || coordinator.isCardioCompleted) ? Color(red: 0.20, green: 0.78, blue: 0.55) : Color(red: 0.97, green: 0.35, blue: 0.35), // Red / Emerald
                        onSelect: { coordinator.selectPhase("cardio") }
                    )

                    PhaseTabButton(
                        label: "COOL",
                        phase: "cooldown",
                        activePhase: coordinator.workoutState.activePhase,
                        color: Color(red: 0.20, green: 0.78, blue: 0.55), // Emerald
                        onSelect: { coordinator.selectPhase("cooldown") }
                    )
                }
                .padding(.horizontal, 2)

                // 3. Dynamic Phase Body
                if coordinator.workoutState.activePhase == "warmup" {
                    warmupPhaseView
                } else if coordinator.workoutState.activePhase == "cardio" {
                    cardioPhaseView
                } else if coordinator.workoutState.activePhase == "cooldown" {
                    cooldownPhaseView
                } else {
                    resistancePhaseView
                }
            }
            .padding(.horizontal, 4)
        }
        .onAppear {
            syncStateFromCoordinator()
        }
        .onChange(of: coordinator.workoutState.activeExerciseIndex) { _ in
            syncStateFromCoordinator()
        }
        .onChange(of: coordinator.workoutState.activeExercise?.exerciseName) { _ in
            syncStateFromCoordinator()
        }
        .onChange(of: coordinator.workoutState.activeExercise?.equipmentModality) { _ in
            syncStateFromCoordinator()
        }
        .onDisappear {
            stopDrillTimer()
        }
        .sheet(item: $activeSheet) { sheet in
            switch sheet {
            case .modality:
                EquipmentModalityPickerSheet(
                    selectedModality: currentModality,
                    onSelect: { newModality in
                        handleSelectModality(newModality)
                    }
                )
            case .loadHelper:
                DynamicLoadHelperSheet(
                    modality: currentModality,
                    weight: $loggedWeight,
                    barWeight: $barbellBarWeight
                )
            case .phases:
                WorkoutPhasesSheet(
                    onSelectExercise: { name in
                        coordinator.selectExercise(named: name)
                        syncStateFromCoordinator()
                        activeSheet = nil
                    },
                    onInspectExercise: { ex in
                        selectedExerciseForDetail = ex
                        activeSheet = .exerciseDetail
                    }
                )
            case .exerciseDetail:
                if let ex = selectedExerciseForDetail ?? coordinator.workoutState.activeExercise {
                    TerseExerciseCardSheet(exercise: ex)
                }
            }
        }
        .confirmationDialog("Cancel Workout?", isPresented: $showCancelConfirmation, titleVisibility: .visible) {
            Button("Discard Workout", role: .destructive) {
                coordinator.cancelSession(notifyPhone: true)
            }
            Button("Resume Workout", role: .cancel) {}
        } message: {
            Text("Workout will not be saved to Apple Health or training history.")
        }
        .confirmationDialog("Finish Workout?", isPresented: $showFinishConfirmation, titleVisibility: .visible) {
            Button("Save & Complete", role: .none) {
                coordinator.finishSession(notifyPhone: true)
            }
            Button("Discard Workout", role: .destructive) {
                coordinator.cancelSession(notifyPhone: true)
            }
            Button("Continue Workout", role: .cancel) {}
        } message: {
            Text("Save completed session to Apple Health and training history.")
        }
    }

    // MARK: - Phase 1: Pre-Lift Warm-Up View

    private var warmupPhaseView: some View {
        VStack(spacing: 8) {
            HStack {
                Text("PRE-LIFT MOBILITY")
                    .font(.system(size: 11, weight: .black, design: .rounded))
                    .foregroundColor(Color(red: 0.97, green: 0.58, blue: 0.11))
                Spacer()
                Button(action: { activeSheet = .phases }) {
                    Image(systemName: "list.bullet")
                        .font(.system(size: 11))
                }
                .buttonStyle(PlainButtonStyle())
            }
            .padding(.horizontal, 4)

            ForEach(coordinator.workoutState.warmupDrills) { drill in
                HStack(spacing: 8) {
                    // Checkmark Toggle Button
                    Button(action: {
                        coordinator.toggleWarmupDrill(named: drill.name)
                    }) {
                        Image(systemName: drill.isCompleted ? "checkmark.circle.fill" : "circle")
                            .font(.system(size: 18))
                            .foregroundColor(drill.isCompleted ? Color(red: 0.20, green: 0.78, blue: 0.55) : .gray)
                    }
                    .buttonStyle(PlainButtonStyle())

                    // Drill Details (Tap row to toggle)
                    Button(action: {
                        coordinator.toggleWarmupDrill(named: drill.name)
                    }) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(drill.phaseLabel)
                                .font(.system(size: 8, weight: .black, design: .rounded))
                                .foregroundColor(warmupBadgeColor(drill.phaseLabel))
                                .padding(.horizontal, 4)
                                .padding(.vertical, 1.5)
                                .background(warmupBadgeColor(drill.phaseLabel).opacity(0.18))
                                .cornerRadius(3)

                            Text(drill.name)
                                .font(.system(size: 11.5, weight: .bold))
                                .foregroundColor(drill.isCompleted ? .gray : .white)
                                .strikethrough(drill.isCompleted)
                                .lineLimit(1)

                            Text(drill.protocolText)
                                .font(.system(size: 9, weight: .medium))
                                .foregroundColor(.gray)
                                .lineLimit(1)
                        }
                    }
                    .buttonStyle(PlainButtonStyle())

                    Spacer(minLength: 2)

                    // Interactive Hold Timer Button
                    if activeTimerItemName == drill.name {
                        Button(action: { stopDrillTimer() }) {
                            HStack(spacing: 3) {
                                Image(systemName: "stop.fill")
                                    .font(.system(size: 8))
                                Text("\(activeTimerRemainingSec)s")
                                    .font(.system(size: 10, weight: .black, design: .monospaced))
                            }
                            .padding(.horizontal, 6)
                            .padding(.vertical, 5)
                            .background(Color(red: 0.97, green: 0.58, blue: 0.11))
                            .foregroundColor(.black)
                            .cornerRadius(6)
                        }
                        .buttonStyle(PlainButtonStyle())
                    } else {
                        Button(action: {
                            startDrillTimer(named: drill.name, duration: drill.durationSec, isWarmup: true)
                        }) {
                            HStack(spacing: 3) {
                                Image(systemName: "timer")
                                    .font(.system(size: 9))
                                Text("\(drill.durationSec)s")
                                    .font(.system(size: 9, weight: .bold, design: .monospaced))
                            }
                            .padding(.horizontal, 5)
                            .padding(.vertical, 5)
                            .background(Color.white.opacity(0.1))
                            .foregroundColor(drill.isCompleted ? .gray : Color(red: 0.97, green: 0.58, blue: 0.11))
                            .cornerRadius(6)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                .padding(8)
                .background(Color.white.opacity(0.06))
                .cornerRadius(10)
            }

            // Advance Button
            if coordinator.workoutState.exercises.isEmpty {
                Button(action: {
                    coordinator.selectPhase("cardio")
                    WKInterfaceDevice.current().play(.start)
                }) {
                    HStack(spacing: 6) {
                        Text("PROCEED TO CARDIO")
                            .font(.system(size: 12, weight: .black, design: .rounded))
                        Image(systemName: "arrow.right.circle.fill")
                            .font(.system(size: 13))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(
                        LinearGradient(
                            colors: [Color(red: 0.97, green: 0.35, blue: 0.35), Color(red: 0.85, green: 0.25, blue: 0.25)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .foregroundColor(.white)
                    .cornerRadius(10)
                }
                .buttonStyle(PlainButtonStyle())
                .padding(.top, 4)
            } else {
                Button(action: {
                    coordinator.selectPhase("resistance")
                    WKInterfaceDevice.current().play(.start)
                }) {
                    HStack(spacing: 6) {
                        Text("START RESISTANCE LIFTS")
                            .font(.system(size: 12, weight: .black, design: .rounded))
                        Image(systemName: "arrow.right.circle.fill")
                            .font(.system(size: 13))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(
                        LinearGradient(
                            colors: [Color(red: 0.22, green: 0.74, blue: 0.97), Color(red: 0.15, green: 0.60, blue: 0.85)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .foregroundColor(.black)
                    .cornerRadius(10)
                }
                .buttonStyle(PlainButtonStyle())
                .padding(.top, 4)
            }
        }
    }

    // MARK: - Phase 2: Resistance Training (Lifts) View

    private var resistancePhaseView: some View {
        Group {
            if coordinator.workoutState.exercises.isEmpty {
                emptyLiftsRecoveryView
            } else {
                standardResistanceLiftsView
            }
        }
    }

    private var emptyLiftsRecoveryView: some View {
        VStack(spacing: 12) {
            VStack(spacing: 6) {
                ZStack {
                    Circle()
                        .fill(Color(red: 0.22, green: 0.74, blue: 0.97).opacity(0.15))
                        .frame(width: 44, height: 44)
                    Image(systemName: "figure.run")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))
                }
                .padding(.top, 4)

                Text("ACTIVE RECOVERY")
                    .font(.system(size: 13, weight: .black, design: .rounded))
                    .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))

                Text("NO LIFTS SCHEDULED")
                    .font(.system(size: 10, weight: .black, design: .monospaced))
                    .foregroundColor(.white)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color.white.opacity(0.1))
                    .cornerRadius(4)

                Text("Today is dedicated to aerobic base conditioning, cellular mitochondrial density, and tissue restoration.")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 8)
            }
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity)
            .background(Color.white.opacity(0.05))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color(red: 0.22, green: 0.74, blue: 0.97).opacity(0.3), lineWidth: 1)
            )

            // Direct button to proceed to cardio
            Button(action: {
                coordinator.selectPhase("cardio")
                WKInterfaceDevice.current().play(.start)
            }) {
                HStack(spacing: 6) {
                    Text("PROCEED TO CARDIO")
                        .font(.system(size: 12, weight: .black, design: .rounded))
                    Image(systemName: "arrow.right.circle.fill")
                        .font(.system(size: 13))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 11)
                .background(
                    LinearGradient(
                        colors: [Color(red: 0.97, green: 0.35, blue: 0.35), Color(red: 0.85, green: 0.25, blue: 0.25)],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .foregroundColor(.white)
                .cornerRadius(10)
            }
            .buttonStyle(PlainButtonStyle())

            // Or jump directly to cool-down / mobility
            Button(action: {
                coordinator.selectPhase("cooldown")
                WKInterfaceDevice.current().play(.click)
            }) {
                HStack(spacing: 4) {
                    Text("Skip to Cool-Down")
                        .font(.system(size: 11, weight: .semibold))
                    Image(systemName: "chevron.right")
                        .font(.system(size: 9))
                }
                .foregroundColor(.gray)
                .padding(.vertical, 4)
            }
            .buttonStyle(PlainButtonStyle())
        }
        .padding(.horizontal, 4)
    }

    private var standardResistanceLiftsView: some View {
        VStack(spacing: 8) {
            // Exercise Stepper Bar
            HStack(alignment: .center) {
                Button(action: {
                    coordinator.selectPreviousExercise()
                    syncStateFromCoordinator()
                }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(coordinator.workoutState.activeExerciseIndex > 0 ? Color(red: 0.22, green: 0.74, blue: 0.97) : .gray.opacity(0.4))
                        .frame(width: 28, height: 28)
                        .background(Color.white.opacity(0.08))
                        .cornerRadius(6)
                }
                .disabled(coordinator.workoutState.activeExerciseIndex <= 0)
                .buttonStyle(PlainButtonStyle())

                Spacer()

                VStack(spacing: 1) {
                    let totalEx = max(1, coordinator.workoutState.exercises.count)
                    let curEx = min(totalEx, coordinator.workoutState.activeExerciseIndex + 1)
                    Text("EXERCISE \(curEx) OF \(totalEx)")
                        .font(.system(size: 10, weight: .black, design: .rounded))
                        .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))

                    let currentSet = coordinator.workoutState.activeExercise?.setNumber ?? 1
                    let totalSets = coordinator.workoutState.activeExercise?.totalSets ?? 3
                    Text("SET \(currentSet) OF \(totalSets)")
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                        .foregroundColor(.gray)
                }

                Spacer()

                Button(action: {
                    coordinator.selectNextExercise()
                    syncStateFromCoordinator()
                }) {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(coordinator.workoutState.activeExerciseIndex < coordinator.workoutState.exercises.count - 1 ? Color(red: 0.22, green: 0.74, blue: 0.97) : .gray.opacity(0.4))
                        .frame(width: 28, height: 28)
                        .background(Color.white.opacity(0.08))
                        .cornerRadius(6)
                }
                .disabled(coordinator.workoutState.activeExerciseIndex >= coordinator.workoutState.exercises.count - 1)
                .buttonStyle(PlainButtonStyle())

                Button(action: { activeSheet = .phases }) {
                    HStack(spacing: 2) {
                        Image(systemName: "list.bullet")
                            .font(.system(size: 10))
                        Text("ALL")
                            .font(.system(size: 10, weight: .black))
                    }
                    .padding(.horizontal, 6)
                    .frame(height: 28)
                    .background(Color.white.opacity(0.08))
                    .foregroundColor(.white)
                    .cornerRadius(6)
                }
                .buttonStyle(PlainButtonStyle())
            }

            // Exercise Title & Terse Glance Bar
            VStack(alignment: .leading, spacing: 4) {
                HStack(alignment: .center) {
                    Text(coordinator.workoutState.activeExercise?.exerciseName ?? "Bench Press")
                        .font(.system(size: 15, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.75)

                    Spacer()

                    Button(action: {
                        selectedExerciseForDetail = coordinator.workoutState.activeExercise
                        activeSheet = .exerciseDetail
                        WKInterfaceDevice.current().play(.click)
                    }) {
                        HStack(spacing: 3) {
                            Image(systemName: "info.circle.fill")
                                .font(.system(size: 9, weight: .bold))
                            Text("FORM")
                                .font(.system(size: 8.5, weight: .black, design: .rounded))
                        }
                        .padding(.horizontal, 5)
                        .padding(.vertical, 3)
                        .background(Color(red: 0.22, green: 0.74, blue: 0.97).opacity(0.18))
                        .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))
                        .cornerRadius(6)
                    }
                    .buttonStyle(PlainButtonStyle())
                }

                // Modality Selector Pill + Muscle & Equipment Badges
                HStack(spacing: 4) {
                    // 1-Tap Equipment Modality Selector
                    Button(action: {
                        activeSheet = .modality
                        WKInterfaceDevice.current().play(.click)
                    }) {
                        HStack(spacing: 3) {
                            Image(systemName: currentModality.iconName)
                                .font(.system(size: 8, weight: .black))
                            Text(currentModality.shortBadge)
                                .font(.system(size: 8, weight: .black, design: .rounded))
                            Image(systemName: "chevron.up.chevron.down")
                                .font(.system(size: 6, weight: .bold))
                        }
                        .padding(.horizontal, 5)
                        .padding(.vertical, 2.5)
                        .background(modalityColor(currentModality).opacity(0.18))
                        .foregroundColor(modalityColor(currentModality))
                        .cornerRadius(4)
                        .overlay(
                            RoundedRectangle(cornerRadius: 4)
                                .stroke(modalityColor(currentModality).opacity(0.4), lineWidth: 0.8)
                        )
                    }
                    .buttonStyle(PlainButtonStyle())

                    let muscles = coordinator.workoutState.activeExercise?.targetMuscles ?? "TARGET MUSCLES"
                    Text(muscles.uppercased())
                        .font(.system(size: 8, weight: .black, design: .rounded))
                        .foregroundColor(Color(red: 0.83, green: 0.63, blue: 0.09)) // Gold
                        .lineLimit(1)
                        .padding(.horizontal, 5)
                        .padding(.vertical, 2)
                        .background(Color(red: 0.83, green: 0.63, blue: 0.09).opacity(0.15))
                        .cornerRadius(4)

                    if let equip = coordinator.workoutState.activeExercise?.equipment, !equip.isEmpty {
                        Text(equip.uppercased())
                            .font(.system(size: 8, weight: .bold, design: .monospaced))
                            .foregroundColor(.gray)
                            .lineLimit(1)
                            .padding(.horizontal, 5)
                            .padding(.vertical, 2)
                            .background(Color.white.opacity(0.08))
                            .cornerRadius(4)
                    }
                }

                // Glanceable 1-Line Form / Setup Cue
                if let cue = coordinator.workoutState.activeExercise?.coachingTip ?? coordinator.workoutState.activeExercise?.setupCue, !cue.isEmpty {
                    Button(action: {
                        selectedExerciseForDetail = coordinator.workoutState.activeExercise
                        activeSheet = .exerciseDetail
                        WKInterfaceDevice.current().play(.click)
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "lightbulb.fill")
                                .font(.system(size: 8))
                                .foregroundColor(Color(red: 0.97, green: 0.58, blue: 0.11))
                            Text(cue)
                                .font(.system(size: 9, weight: .medium))
                                .foregroundColor(.white.opacity(0.9))
                                .lineLimit(1)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.system(size: 7))
                                .foregroundColor(.gray)
                        }
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(Color.white.opacity(0.06))
                        .cornerRadius(6)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 2)

            // Hero Metric Cards (Reps & Weight) with Tactile Steppers & Crown Rotation
            HStack(spacing: 6) {
                // REPS CARD
                VStack(spacing: 2) {
                    Button(action: {
                        isCrownFocusedOnReps = true
                        WKInterfaceDevice.current().play(.click)
                    }) {
                        HStack(spacing: 3) {
                            if isCrownFocusedOnReps {
                                Circle()
                                    .fill(Color(red: 0.22, green: 0.74, blue: 0.97))
                                    .frame(width: 4, height: 4)
                            }
                            Text("REPS")
                                .font(.system(size: 10, weight: .black))
                                .foregroundColor(isCrownFocusedOnReps ? Color(red: 0.22, green: 0.74, blue: 0.97) : .gray)
                        }
                    }
                    .buttonStyle(PlainButtonStyle())

                    HStack(spacing: 2) {
                        Button(action: {
                            isCrownFocusedOnReps = true
                            if loggedReps > 1 {
                                loggedReps -= 1
                                WKInterfaceDevice.current().play(.click)
                            }
                        }) {
                            Image(systemName: "minus")
                                .font(.system(size: 10, weight: .black))
                                .foregroundColor(.white)
                                .frame(width: 22, height: 22)
                                .background(Color.white.opacity(0.12))
                                .clipShape(Circle())
                        }
                        .buttonStyle(PlainButtonStyle())

                        Text("\(Int(loggedReps))")
                            .font(.system(size: 30, weight: .black, design: .rounded))
                            .monospacedDigit()
                            .foregroundColor(.white)
                            .frame(minWidth: 36)

                        Button(action: {
                            isCrownFocusedOnReps = true
                            if loggedReps < 99 {
                                loggedReps += 1
                                WKInterfaceDevice.current().play(.click)
                            }
                        }) {
                            Image(systemName: "plus")
                                .font(.system(size: 10, weight: .black))
                                .foregroundColor(.white)
                                .frame(width: 22, height: 22)
                                .background(Color.white.opacity(0.12))
                                .clipShape(Circle())
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 6)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(isCrownFocusedOnReps ? Color(red: 0.22, green: 0.74, blue: 0.97).opacity(0.18) : Color.white.opacity(0.06))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(isCrownFocusedOnReps ? Color(red: 0.22, green: 0.74, blue: 0.97) : Color.white.opacity(0.1), lineWidth: isCrownFocusedOnReps ? 2 : 1)
                )

                // WEIGHT CARD
                VStack(spacing: 2) {
                    Button(action: {
                        isCrownFocusedOnReps = false
                        WKInterfaceDevice.current().play(.click)
                    }) {
                        HStack(spacing: 3) {
                            if !isCrownFocusedOnReps {
                                Circle()
                                    .fill(Color(red: 0.83, green: 0.63, blue: 0.09))
                                    .frame(width: 4, height: 4)
                            }
                            Text(currentModality.weightUnitLabel)
                                .font(.system(size: 9.5, weight: .black))
                                .foregroundColor(!isCrownFocusedOnReps ? Color(red: 0.83, green: 0.63, blue: 0.09) : .gray)
                                .lineLimit(1)
                        }
                    }
                    .buttonStyle(PlainButtonStyle())

                    HStack(spacing: 2) {
                        Button(action: {
                            isCrownFocusedOnReps = false
                            let step = currentModality.stepIncrement
                            if loggedWeight >= step {
                                loggedWeight -= step
                                WKInterfaceDevice.current().play(.click)
                            } else if currentModality == .bodyweight && loggedWeight > -50 {
                                loggedWeight -= 5.0
                                WKInterfaceDevice.current().play(.click)
                            }
                        }) {
                            Text(stepFormat(currentModality.stepIncrement, isMinus: true))
                                .font(.system(size: 8.5, weight: .black))
                                .foregroundColor(.white)
                                .frame(width: 22, height: 22)
                                .background(Color.white.opacity(0.12))
                                .clipShape(Circle())
                        }
                        .buttonStyle(PlainButtonStyle())

                        Text(weightDisplayString(weight: loggedWeight, modality: currentModality))
                            .font(.system(size: (currentModality == .bodyweight && loggedWeight == 0) ? 22 : 28, weight: .black, design: .rounded))
                            .monospacedDigit()
                            .foregroundColor(.white)
                            .frame(minWidth: 42)

                        Button(action: {
                            isCrownFocusedOnReps = false
                            let step = currentModality.stepIncrement
                            if loggedWeight <= 995 {
                                loggedWeight += step
                                WKInterfaceDevice.current().play(.click)
                            }
                        }) {
                            Text(stepFormat(currentModality.stepIncrement, isMinus: false))
                                .font(.system(size: 8.5, weight: .black))
                                .foregroundColor(.white)
                                .frame(width: 22, height: 22)
                                .background(Color.white.opacity(0.12))
                                .clipShape(Circle())
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 6)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(!isCrownFocusedOnReps ? Color(red: 0.83, green: 0.63, blue: 0.09).opacity(0.18) : Color.white.opacity(0.06))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(!isCrownFocusedOnReps ? Color(red: 0.83, green: 0.63, blue: 0.09) : Color.white.opacity(0.1), lineWidth: !isCrownFocusedOnReps ? 2 : 1)
                )
            }
            .focusable(true)
            .digitalCrownRotation(
                isCrownFocusedOnReps ? $loggedReps : $loggedWeight,
                from: isCrownFocusedOnReps ? 1.0 : (currentModality == .bodyweight ? -60.0 : 0.0),
                through: isCrownFocusedOnReps ? 50.0 : 800.0,
                by: isCrownFocusedOnReps ? 1.0 : currentModality.stepIncrement,
                sensitivity: .medium,
                isContinuous: false,
                isHapticFeedbackEnabled: true
            )

            // Compact RPE Intensity Selector
            HStack(spacing: 3) {
                Text("RPE")
                    .font(.system(size: 9, weight: .black, design: .rounded))
                    .foregroundColor(Color(red: 0.83, green: 0.63, blue: 0.09))
                    .padding(.leading, 2)

                Spacer()

                ForEach([7.0, 8.0, 8.5, 9.0, 10.0], id: \.self) { rpeVal in
                    Button(action: {
                        loggedRpe = rpeVal
                        WKInterfaceDevice.current().play(.click)
                    }) {
                        Text(rpeVal == 10.0 ? "10" : (rpeVal.truncatingRemainder(dividingBy: 1) == 0 ? "\(Int(rpeVal))" : String(format: "%.1f", rpeVal)))
                            .font(.system(size: 9.5, weight: .bold, design: .rounded))
                            .foregroundColor(loggedRpe == rpeVal ? .black : .white.opacity(0.85))
                            .padding(.horizontal, 5)
                            .padding(.vertical, 2.5)
                            .background(loggedRpe == rpeVal ? Color(red: 0.83, green: 0.63, blue: 0.09) : Color.white.opacity(0.08))
                            .cornerRadius(5)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .padding(.horizontal, 4)
            .padding(.vertical, 2.5)
            .background(Color.white.opacity(0.04))
            .cornerRadius(6)

            // Dynamic Load Helper Button (Replaces static plate math button)
            Button(action: {
                activeSheet = .loadHelper
                WKInterfaceDevice.current().play(.click)
            }) {
                HStack(spacing: 5) {
                    Image(systemName: currentModality.iconName)
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(modalityColor(currentModality))

                    Text(loadHelperSummary(weight: loggedWeight, modality: currentModality, barWeight: barbellBarWeight))
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                        .lineLimit(1)

                    Spacer()

                    Text(loadHelperActionBadge(modality: currentModality))
                        .font(.system(size: 7.5, weight: .black, design: .rounded))
                        .foregroundColor(modalityColor(currentModality))
                        .padding(.horizontal, 4)
                        .padding(.vertical, 2)
                        .background(modalityColor(currentModality).opacity(0.18))
                        .cornerRadius(3)

                    Image(systemName: "chevron.right")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundColor(.gray)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 6)
                .background(Color.white.opacity(0.08))
                .cornerRadius(8)
            }
            .buttonStyle(PlainButtonStyle())

            // Hero Full-Bleed "LOG SET" Button
            Button(action: handleLogSet) {
                HStack(spacing: 6) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 16, weight: .bold))
                    Text("LOG SET")
                        .font(.system(size: 16, weight: .black, design: .rounded))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(
                    LinearGradient(
                        colors: [Color(red: 0.06, green: 0.72, blue: 0.51), Color(red: 0.04, green: 0.55, blue: 0.38)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .foregroundColor(.white)
                .cornerRadius(12)
                .shadow(color: Color(red: 0.06, green: 0.72, blue: 0.51).opacity(0.5), radius: 6, y: 2)
            }
            .buttonStyle(PlainButtonStyle())
            .padding(.top, 2)

            // Tactile Cancel Workout Button at bottom of scroll
            Button(action: {
                showCancelConfirmation = true
                WKInterfaceDevice.current().play(.click)
            }) {
                HStack(spacing: 5) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 11))
                    Text("Cancel Workout")
                        .font(.system(size: 11, weight: .bold))
                }
                .foregroundColor(Color(red: 0.97, green: 0.44, blue: 0.44).opacity(0.85))
                .padding(.vertical, 8)
            }
            .buttonStyle(PlainButtonStyle())
        }
    }

    // MARK: - Phase 3: Cardio Conditioning Protocol View

    private var cardioPhaseView: some View {
        VStack(spacing: 10) {
            let cardio = coordinator.workoutState.cardioProtocol
            let isDone = coordinator.isCardioCompleted || (cardio?.isCompleted ?? false)
            let durationMins = cardio?.durationMins ?? 20
            let targetSecs = durationMins * 60
            let elapsedSecs = coordinator.cardioElapsedSeconds
            let remainingSecs = max(0, targetSecs - elapsedSecs)

            // Header: Protocol Name & Target Tanaka Zone
            VStack(spacing: 2) {
                Text(cardio?.modality.uppercased() ?? "ZONE 2 CARDIO ENGINE")
                    .font(.system(size: 12.5, weight: .black, design: .rounded))
                    .foregroundColor(Color(red: 0.97, green: 0.35, blue: 0.35))
                    .multilineTextAlignment(.center)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)

                Text("\(durationMins) MINS · TANAKA ZONE \(cardio?.targetZone ?? 2)")
                    .font(.system(size: 9.5, weight: .bold))
                    .foregroundColor(.gray)
            }
            .padding(.top, 2)

            if isDone {
                // Completed State Card
                VStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(Color(red: 0.20, green: 0.78, blue: 0.55).opacity(0.18))
                            .frame(width: 44, height: 44)
                        Image(systemName: "checkmark.seal.fill")
                            .font(.system(size: 24))
                            .foregroundColor(Color(red: 0.20, green: 0.78, blue: 0.55))
                    }
                    .padding(.top, 4)

                    Text("CARDIO COMPLETED")
                        .font(.system(size: 12.5, weight: .black, design: .rounded))
                        .foregroundColor(Color(red: 0.20, green: 0.78, blue: 0.55))

                    Text("Logged to Apple Health & Forge Athletic Profile")
                        .font(.system(size: 9.5, weight: .medium))
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 6)

                    Button(action: {
                        coordinator.isCardioCompleted = false
                        coordinator.startCardioInterval()
                    }) {
                        Text("Log Another Interval")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.gray)
                            .padding(.vertical, 4)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                .padding(.vertical, 10)
                .frame(maxWidth: .infinity)
                .background(Color.white.opacity(0.05))
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color(red: 0.20, green: 0.78, blue: 0.55).opacity(0.35), lineWidth: 1)
                )

                // Advance directly to Cool-Down
                Button(action: {
                    coordinator.selectPhase("cooldown")
                    WKInterfaceDevice.current().play(.start)
                }) {
                    HStack(spacing: 6) {
                        Text("PROCEED TO COOL-DOWN")
                            .font(.system(size: 12, weight: .black, design: .rounded))
                        Image(systemName: "arrow.right.circle.fill")
                            .font(.system(size: 13))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Color(red: 0.20, green: 0.78, blue: 0.55))
                    .foregroundColor(.black)
                    .cornerRadius(10)
                }
                .buttonStyle(PlainButtonStyle())
            } else {
                // Interactive Interval Runner Card
                VStack(spacing: 6) {
                    HStack {
                        VStack(alignment: .leading, spacing: 1) {
                            Text(coordinator.isCardioIntervalRunning ? "REMAINING" : (elapsedSecs > 0 ? "PAUSED" : "TARGET INTERVAL"))
                                .font(.system(size: 8.5, weight: .black, design: .monospaced))
                                .foregroundColor(coordinator.isCardioIntervalRunning ? Color(red: 0.97, green: 0.35, blue: 0.35) : .gray)

                            Text(coordinator.isCardioIntervalRunning || elapsedSecs > 0 ? formatElapsed(remainingSecs) : "\(durationMins):00")
                                .font(.system(size: 26, weight: .black, design: .monospaced))
                                .foregroundColor(.white)
                        }

                        Spacer()

                        VStack(alignment: .trailing, spacing: 1) {
                            Text("INTERVAL ELAPSED")
                                .font(.system(size: 8.5, weight: .black, design: .monospaced))
                                .foregroundColor(.gray)

                            Text(formatElapsed(elapsedSecs))
                                .font(.system(size: 14, weight: .bold, design: .monospaced))
                                .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))
                        }
                    }
                    .padding(.horizontal, 4)

                    // Progress bar
                    let progress = min(1.0, Double(elapsedSecs) / Double(max(1, targetSecs)))
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule()
                                .fill(Color.white.opacity(0.12))
                                .frame(height: 6)
                            Capsule()
                                .fill(
                                    LinearGradient(
                                        colors: [Color(red: 0.97, green: 0.35, blue: 0.35), Color(red: 0.97, green: 0.58, blue: 0.22)],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .frame(width: max(6, geo.size.width * CGFloat(progress)), height: 6)
                        }
                    }
                    .frame(height: 6)
                    .padding(.horizontal, 2)
                    .padding(.vertical, 2)

                    // Interval Control Buttons
                    if !coordinator.isCardioIntervalRunning && elapsedSecs == 0 {
                        Button(action: {
                            coordinator.startCardioInterval()
                        }) {
                            HStack(spacing: 6) {
                                Image(systemName: "play.fill")
                                    .font(.system(size: 13))
                                Text("START INTERVAL (\(durationMins) MIN)")
                                    .font(.system(size: 12, weight: .black, design: .rounded))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 9)
                            .background(
                                LinearGradient(
                                    colors: [Color(red: 0.97, green: 0.35, blue: 0.35), Color(red: 0.85, green: 0.25, blue: 0.25)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .foregroundColor(.white)
                            .cornerRadius(9)
                        }
                        .buttonStyle(PlainButtonStyle())
                        .padding(.top, 2)
                    } else if coordinator.isCardioIntervalRunning {
                        HStack(spacing: 6) {
                            Button(action: {
                                coordinator.pauseCardioInterval()
                            }) {
                                HStack(spacing: 4) {
                                    Image(systemName: "pause.fill")
                                        .font(.system(size: 11))
                                    Text("PAUSE")
                                        .font(.system(size: 11, weight: .black))
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 8)
                                .background(Color.white.opacity(0.12))
                                .foregroundColor(.white)
                                .cornerRadius(8)
                            }
                            .buttonStyle(PlainButtonStyle())

                            Button(action: {
                                coordinator.completeCardioInterval()
                            }) {
                                HStack(spacing: 4) {
                                    Image(systemName: "checkmark.circle.fill")
                                        .font(.system(size: 11))
                                    Text("COMPLETE")
                                        .font(.system(size: 11, weight: .black))
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 8)
                                .background(Color(red: 0.20, green: 0.78, blue: 0.55))
                                .foregroundColor(.black)
                                .cornerRadius(8)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                        .padding(.top, 2)
                    } else {
                        // Paused state
                        HStack(spacing: 6) {
                            Button(action: {
                                coordinator.resumeCardioInterval()
                            }) {
                                HStack(spacing: 4) {
                                    Image(systemName: "play.fill")
                                        .font(.system(size: 11))
                                    Text("RESUME")
                                        .font(.system(size: 11, weight: .black))
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 8)
                                .background(Color(red: 0.22, green: 0.74, blue: 0.97))
                                .foregroundColor(.black)
                                .cornerRadius(8)
                            }
                            .buttonStyle(PlainButtonStyle())

                            Button(action: {
                                coordinator.completeCardioInterval()
                            }) {
                                HStack(spacing: 4) {
                                    Image(systemName: "checkmark.circle.fill")
                                        .font(.system(size: 11))
                                    Text("LOG")
                                        .font(.system(size: 11, weight: .black))
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 8)
                                .background(Color(red: 0.20, green: 0.78, blue: 0.55))
                                .foregroundColor(.black)
                                .cornerRadius(8)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                        .padding(.top, 2)

                        Button(action: {
                            coordinator.resetCardioInterval()
                        }) {
                            Text("Reset Timer")
                                .font(.system(size: 9.5, weight: .semibold))
                                .foregroundColor(.gray)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                .padding(8)
                .frame(maxWidth: .infinity)
                .background(Color.white.opacity(0.06))
                .cornerRadius(10)

                // Large Heart Rate Telemetry HUD
                VStack(spacing: 4) {
                    HStack(spacing: 6) {
                        Image(systemName: "heart.fill")
                            .font(.system(size: 16))
                            .foregroundColor(heartRateColor)

                        Text(workoutManager.currentHeartRate > 0 ? "\(workoutManager.currentHeartRate)" : "--")
                            .font(.system(size: 34, weight: .black, design: .monospaced))
                            .foregroundColor(.white)

                        Text("BPM")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.gray)
                    }

                    let minBpm = cardio?.targetBpmMin ?? 125
                    let maxBpm = cardio?.targetBpmMax ?? 142
                    let curBpm = workoutManager.currentHeartRate

                    if curBpm == 0 {
                        Text("Target: \(minBpm)–\(maxBpm) BPM")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.gray)
                    } else if curBpm < minBpm {
                        Text("Accelerate: Target \(minBpm)–\(maxBpm) BPM")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))
                    } else if curBpm <= maxBpm {
                        Text("✓ In Optimal Tanaka Zone (\(minBpm)–\(maxBpm))")
                            .font(.system(size: 10, weight: .black))
                            .foregroundColor(Color(red: 0.06, green: 0.72, blue: 0.51))
                    } else {
                        Text("Ease Pace: Above \(maxBpm) BPM")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.97, green: 0.35, blue: 0.35))
                    }

                    // Button to open Fullscreen 52pt HUD
                    Button(action: {
                        coordinator.selectedTab = 3
                        WKInterfaceDevice.current().play(.click)
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "gauge.with.needle")
                                .font(.system(size: 9))
                            Text("OPEN FULLSCREEN HUD")
                                .font(.system(size: 9, weight: .black, design: .rounded))
                        }
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.white.opacity(0.1))
                        .foregroundColor(.white)
                        .cornerRadius(6)
                    }
                    .buttonStyle(PlainButtonStyle())
                    .padding(.top, 2)
                }
                .padding(.vertical, 6)
                .frame(maxWidth: .infinity)
                .background(Color.white.opacity(0.04))
                .cornerRadius(10)

                // Advance to Cool-Down
                Button(action: {
                    coordinator.selectPhase("cooldown")
                    WKInterfaceDevice.current().play(.start)
                }) {
                    HStack(spacing: 6) {
                        Text("GO TO COOL-DOWN")
                            .font(.system(size: 11.5, weight: .black, design: .rounded))
                        Image(systemName: "arrow.right.circle.fill")
                            .font(.system(size: 12))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 9)
                    .background(Color(red: 0.20, green: 0.78, blue: 0.55))
                    .foregroundColor(.black)
                    .cornerRadius(9)
                }
                .buttonStyle(PlainButtonStyle())
            }
        }
    }

    // MARK: - Phase 4: Cool-Down & Static Stretches View

    private var cooldownPhaseView: some View {
        VStack(spacing: 8) {
            HStack {
                Text("COOL-DOWN & MOBILITY")
                    .font(.system(size: 11, weight: .black, design: .rounded))
                    .foregroundColor(Color(red: 0.20, green: 0.78, blue: 0.55))
                Spacer()
                Button(action: { activeSheet = .phases }) {
                    Image(systemName: "list.bullet")
                        .font(.system(size: 11))
                }
                .buttonStyle(PlainButtonStyle())
            }
            .padding(.horizontal, 4)

            ForEach(coordinator.workoutState.cooldownStretches) { stretch in
                HStack(spacing: 8) {
                    Button(action: {
                        coordinator.toggleCooldownStretch(named: stretch.name)
                    }) {
                        Image(systemName: stretch.isCompleted ? "checkmark.circle.fill" : "circle")
                            .font(.system(size: 18))
                            .foregroundColor(stretch.isCompleted ? Color(red: 0.20, green: 0.78, blue: 0.55) : .gray)
                    }
                    .buttonStyle(PlainButtonStyle())

                    Button(action: {
                        coordinator.toggleCooldownStretch(named: stretch.name)
                    }) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(stretch.name)
                                .font(.system(size: 11.5, weight: .bold))
                                .foregroundColor(stretch.isCompleted ? .gray : .white)
                                .strikethrough(stretch.isCompleted)
                                .lineLimit(1)

                            Text(stretch.protocolText)
                                .font(.system(size: 9, weight: .medium))
                                .foregroundColor(.gray)
                                .lineLimit(1)
                        }
                    }
                    .buttonStyle(PlainButtonStyle())

                    Spacer(minLength: 2)

                    if activeTimerItemName == stretch.name {
                        Button(action: { stopDrillTimer() }) {
                            HStack(spacing: 3) {
                                Image(systemName: "stop.fill")
                                    .font(.system(size: 8))
                                Text("\(activeTimerRemainingSec)s")
                                    .font(.system(size: 10, weight: .black, design: .monospaced))
                            }
                            .padding(.horizontal, 6)
                            .padding(.vertical, 5)
                            .background(Color(red: 0.20, green: 0.78, blue: 0.55))
                            .foregroundColor(.black)
                            .cornerRadius(6)
                        }
                        .buttonStyle(PlainButtonStyle())
                    } else {
                        Button(action: {
                            startDrillTimer(named: stretch.name, duration: stretch.durationSec, isWarmup: false)
                        }) {
                            HStack(spacing: 3) {
                                Image(systemName: "timer")
                                    .font(.system(size: 9))
                                Text("\(stretch.durationSec)s")
                                    .font(.system(size: 9, weight: .bold, design: .monospaced))
                            }
                            .padding(.horizontal, 5)
                            .padding(.vertical, 5)
                            .background(Color.white.opacity(0.1))
                            .foregroundColor(stretch.isCompleted ? .gray : Color(red: 0.20, green: 0.78, blue: 0.55))
                            .cornerRadius(6)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                .padding(8)
                .background(Color.white.opacity(0.06))
                .cornerRadius(10)
            }

            // Finish Workout Button
            Button(action: {
                showFinishConfirmation = true
                WKInterfaceDevice.current().play(.click)
            }) {
                HStack(spacing: 6) {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.system(size: 14))
                    Text("FINISH WORKOUT")
                        .font(.system(size: 13, weight: .black, design: .rounded))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(
                    LinearGradient(
                        colors: [Color(red: 0.06, green: 0.72, blue: 0.51), Color(red: 0.04, green: 0.55, blue: 0.38)],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .foregroundColor(.white)
                .cornerRadius(10)
            }
            .buttonStyle(PlainButtonStyle())
            .padding(.top, 4)
        }
    }

    // MARK: - Helpers

    private func syncStateFromCoordinator() {
        if let ex = coordinator.workoutState.activeExercise {
            loggedReps = Double(ex.prescribedReps)
            loggedWeight = ex.prescribedWeight
            loggedRpe = ex.targetRpe ?? 8.0
            currentModality = ex.detectedModality
        }
    }

    private var heartRateColor: Color {
        let hr = workoutManager.currentHeartRate
        if hr == 0 { return .gray }
        if hr < 115 { return Color(red: 0.06, green: 0.72, blue: 0.51) } // Green
        if hr < 145 { return Color(red: 0.83, green: 0.63, blue: 0.09) } // Gold
        return Color(red: 0.97, green: 0.44, blue: 0.44) // Red
    }

    private func handleLogSet() {
        WatchHapticManager.shared.playSuccessKnock()

        let exName = coordinator.workoutState.activeExercise?.exerciseName ?? "Set"
        let setNum = coordinator.workoutState.activeExercise?.setNumber ?? 1

        coordinator.logCompletedSet(
            exerciseName: exName,
            setIndex: setNum,
            reps: Int(loggedReps),
            weightLbs: loggedWeight,
            rpe: loggedRpe
        )

        // If exercise completed all sets, advance to next exercise automatically
        if let ex = coordinator.workoutState.activeExercise, ex.isCompleted {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                coordinator.selectNextExercise()
                syncStateFromCoordinator()
            }
        }
    }

    private func handleSelectModality(_ modality: WatchEquipmentModality) {
        currentModality = modality
        coordinator.updateActiveExerciseEquipmentModality(modality)

        // Smart auto-adjustment if current weight is outside typical range for new modality
        switch modality {
        case .barbell:
            if loggedWeight < 45 {
                loggedWeight = 135.0
            }
        case .dumbbell:
            if loggedWeight > 120 || loggedWeight <= 0 {
                loggedWeight = 25.0
            }
        case .cable:
            if loggedWeight > 250 || loggedWeight <= 0 {
                loggedWeight = 40.0
            }
        case .bands:
            if loggedWeight > 100 || loggedWeight <= 0 {
                loggedWeight = 25.0
            }
        case .bodyweight:
            if loggedWeight > 100 {
                loggedWeight = 0.0
            }
        case .kettlebell:
            if loggedWeight > 100 || loggedWeight < 10 {
                loggedWeight = 35.0
            }
        }
    }

    private func modalityColor(_ modality: WatchEquipmentModality) -> Color {
        switch modality {
        case .barbell: return Color(red: 0.83, green: 0.63, blue: 0.09) // Gold
        case .dumbbell: return Color(red: 0.22, green: 0.74, blue: 0.97) // Cyan
        case .cable: return Color(red: 0.72, green: 0.45, blue: 0.98) // Purple
        case .bands: return Color(red: 0.97, green: 0.58, blue: 0.11) // Orange
        case .bodyweight: return Color(red: 0.20, green: 0.78, blue: 0.55) // Emerald
        case .kettlebell: return Color(red: 0.97, green: 0.35, blue: 0.35) // Red
        }
    }

    private func stepFormat(_ step: Double, isMinus: Bool) -> String {
        let sign = isMinus ? "-" : "+"
        if step.truncatingRemainder(dividingBy: 1) == 0 {
            return "\(sign)\(Int(step))"
        } else {
            return "\(sign)\(String(format: "%.1f", step))"
        }
    }

    private func weightDisplayString(weight: Double, modality: WatchEquipmentModality) -> String {
        if modality == .bodyweight && weight == 0 {
            return "BW"
        }
        if weight.truncatingRemainder(dividingBy: 1) == 0 {
            return "\(Int(weight))"
        } else {
            return String(format: "%.1f", weight)
        }
    }

    private func loadHelperSummary(weight: Double, modality: WatchEquipmentModality, barWeight: Double) -> String {
        switch modality {
        case .barbell:
            if weight >= barWeight {
                let perSide = (weight - barWeight) / 2
                return "\(Int(perSide)) lb/side (\(Int(barWeight)) lb bar)"
            } else {
                return "\(Int(weight)) lbs · Barbell"
            }
        case .dumbbell:
            return "\(Int(weight)) lbs / hand"
        case .cable:
            return "\(Int(weight)) lbs Stack Pin"
        case .bands:
            return bandTensionLabel(weight)
        case .bodyweight:
            if weight == 0 {
                return "Bodyweight (0 lb added)"
            } else if weight > 0 {
                return "+\(Int(weight)) lb Added Load"
            } else {
                return "\(Int(weight)) lb Assisted"
            }
        case .kettlebell:
            return "\(Int(weight)) lb Kettlebell"
        }
    }

    private func loadHelperActionBadge(modality: WatchEquipmentModality) -> String {
        switch modality {
        case .barbell: return "PLATES"
        case .dumbbell: return "DB RACK"
        case .cable: return "PIN"
        case .bands: return "BANDS"
        case .bodyweight: return "BW LOAD"
        case .kettlebell: return "KB RACK"
        }
    }

    private func bandTensionLabel(_ weight: Double) -> String {
        if weight <= 12 { return "Yellow · X-Light (10 lb)" }
        if weight <= 22 { return "Red · Light (20 lb)" }
        if weight <= 35 { return "Green · Medium (30 lb)" }
        if weight <= 50 { return "Blue · Heavy (45 lb)" }
        if weight <= 70 { return "Black · X-Heavy (60 lb)" }
        return "Orange · Monster (80 lb)"
    }

    private func formatQuickPlateBar(weightLbs: Double) -> String {
        if weightLbs >= 45 {
            let perSide = (weightLbs - 45) / 2
            return "Barbell: \(Int(perSide)) lbs/side"
        } else if weightLbs > 0 {
            return "\(Int(weightLbs)) lbs · Dumbbell / Cable"
        } else {
            return "Bodyweight"
        }
    }

    private func formatElapsed(_ totalSeconds: Int) -> String {
        let mm = totalSeconds / 60
        let ss = totalSeconds % 60
        return String(format: "%02d:%02d", mm, ss)
    }

    private func startDrillTimer(named name: String, duration: Int, isWarmup: Bool) {
        drillTimer?.invalidate()
        activeTimerItemName = name
        activeTimerRemainingSec = duration
        activeTimerTotalSec = duration
        WKInterfaceDevice.current().play(.start)

        drillTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            if self.activeTimerRemainingSec > 1 {
                self.activeTimerRemainingSec -= 1
            } else {
                self.stopDrillTimer()
                WatchHapticManager.shared.playSuccessKnock()
                if isWarmup {
                    self.coordinator.completeWarmupDrill(named: name)
                } else {
                    self.coordinator.completeCooldownStretch(named: name)
                }
            }
        }
    }

    private func stopDrillTimer() {
        drillTimer?.invalidate()
        drillTimer = nil
        activeTimerItemName = nil
        activeTimerRemainingSec = 0
    }

    private func warmupBadgeColor(_ label: String) -> Color {
        let upper = label.uppercased()
        if upper.contains("INHIBIT") {
            return Color(red: 0.97, green: 0.58, blue: 0.11) // Amber
        } else if upper.contains("LENGTHEN") {
            return Color(red: 0.22, green: 0.74, blue: 0.97) // Cyan
        } else if upper.contains("ACTIVATE") {
            return Color(red: 0.20, green: 0.78, blue: 0.55) // Emerald
        }
        return Color(red: 0.83, green: 0.63, blue: 0.09) // Gold
    }
}

/**
 * PhaseTabButton
 * Compact segmented button for selecting one of the 4 workout phases
 */
struct PhaseTabButton: View {
    let label: String
    let phase: String
    let activePhase: String
    let color: Color
    let onSelect: () -> Void

    var isSelected: Bool { phase == activePhase }

    var body: some View {
        Button(action: {
            WKInterfaceDevice.current().play(.click)
            onSelect()
        }) {
            Text(label)
                .font(.system(size: 9.5, weight: .black, design: .rounded))
                .foregroundColor(isSelected ? .black : .white.opacity(0.8))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 4)
                .background(isSelected ? color : Color.white.opacity(0.08))
                .cornerRadius(6)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

/**
 * TerseExerciseCardSheet
 * Wrist-first biomechanical reference card presenting target musculature,
 * equipment, kinetic setup checkpoints, movement cues, tempo, and coaching safety tips.
 * Forge Athletic
 */
struct TerseExerciseCardSheet: View {
    let exercise: WatchExerciseInfo
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 8) {
                // Header with Done button
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 1) {
                        Text("EXERCISE FORM CARD")
                            .font(.system(size: 9, weight: .black, design: .rounded))
                            .foregroundColor(Color(red: 0.83, green: 0.63, blue: 0.09)) // Gold

                        Text(exercise.exerciseName)
                            .font(.system(size: 13, weight: .black, design: .rounded))
                            .foregroundColor(.white)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    Spacer()

                    Button("Done") {
                        presentationMode.wrappedValue.dismiss()
                    }
                    .font(.system(size: 11, weight: .bold))
                }
                .padding(.bottom, 2)

                // 1. Target Musculature
                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 4) {
                        Image(systemName: "figure.strengthtraining.traditional")
                            .font(.system(size: 9))
                            .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))
                        Text("TARGET MUSCLES")
                            .font(.system(size: 9, weight: .black, design: .rounded))
                            .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))
                    }

                    Text(exercise.targetMuscles ?? "Primary Muscle Mover & Core Stabilizers")
                        .font(.system(size: 10.5, weight: .semibold))
                        .foregroundColor(.white)
                }
                .padding(7)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.white.opacity(0.06))
                .cornerRadius(8)

                // 2. Prescription & Equipment Specs
                HStack(spacing: 6) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("EQUIPMENT")
                            .font(.system(size: 8, weight: .black, design: .rounded))
                            .foregroundColor(.gray)
                        Text(exercise.equipment ?? "Free Weights")
                            .font(.system(size: 9.5, weight: .bold))
                            .foregroundColor(.white)
                            .lineLimit(1)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(6)
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(6)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("TEMPO")
                            .font(.system(size: 8, weight: .black, design: .rounded))
                            .foregroundColor(.gray)
                        Text(exercise.tempo ?? "2-0-2-0")
                            .font(.system(size: 9.5, weight: .bold, design: .monospaced))
                            .foregroundColor(Color(red: 0.20, green: 0.78, blue: 0.55))
                            .lineLimit(1)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(6)
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(6)
                }

                // 3. Setup Checkpoint
                if let setup = exercise.setupCue, !setup.isEmpty {
                    VStack(alignment: .leading, spacing: 3) {
                        HStack(spacing: 4) {
                            Image(systemName: "checkmark.shield.fill")
                                .font(.system(size: 9))
                                .foregroundColor(Color(red: 0.97, green: 0.58, blue: 0.11))
                            Text("SETUP CHECKPOINTS")
                                .font(.system(size: 9, weight: .black, design: .rounded))
                                .foregroundColor(Color(red: 0.97, green: 0.58, blue: 0.11))
                        }

                        Text(setup)
                            .font(.system(size: 9.5, weight: .medium))
                            .foregroundColor(.white.opacity(0.95))
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(7)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white.opacity(0.06))
                    .cornerRadius(8)
                }

                // 4. Movement Execution Cues
                if let cues = exercise.movementCues, !cues.isEmpty {
                    VStack(alignment: .leading, spacing: 3) {
                        HStack(spacing: 4) {
                            Image(systemName: "list.bullet.clipboard.fill")
                                .font(.system(size: 9))
                                .foregroundColor(Color(red: 0.20, green: 0.78, blue: 0.55))
                            Text("EXECUTION FORM CUES")
                                .font(.system(size: 9, weight: .black, design: .rounded))
                                .foregroundColor(Color(red: 0.20, green: 0.78, blue: 0.55))
                        }

                        ForEach(cues, id: \.self) { cue in
                            HStack(alignment: .top, spacing: 5) {
                                Image(systemName: "arrow.right.circle.fill")
                                    .font(.system(size: 7))
                                    .foregroundColor(Color(red: 0.20, green: 0.78, blue: 0.55))
                                    .padding(.top, 2)
                                Text(cue)
                                    .font(.system(size: 9.5, weight: .medium))
                                    .foregroundColor(.white.opacity(0.9))
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            .padding(.vertical, 1)
                        }
                    }
                    .padding(7)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white.opacity(0.06))
                    .cornerRadius(8)
                }

                // 5. Coach Safety Note
                if let tip = exercise.coachingTip, !tip.isEmpty {
                    VStack(alignment: .leading, spacing: 3) {
                        HStack(spacing: 4) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .font(.system(size: 9))
                                .foregroundColor(Color(red: 0.83, green: 0.63, blue: 0.09))
                            Text("COACH CUE & SAFETY")
                                .font(.system(size: 9, weight: .black, design: .rounded))
                                .foregroundColor(Color(red: 0.83, green: 0.63, blue: 0.09))
                        }

                        Text(tip)
                            .font(.system(size: 9.5, weight: .medium))
                            .foregroundColor(.white.opacity(0.9))
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(7)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white.opacity(0.09))
                    .cornerRadius(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color(red: 0.83, green: 0.63, blue: 0.09).opacity(0.3), lineWidth: 1)
                    )
                }

                // Bottom Dismiss Action
                Button(action: {
                    presentationMode.wrappedValue.dismiss()
                }) {
                    Text("BACK TO WORKOUT")
                        .font(.system(size: 11, weight: .black, design: .rounded))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color(red: 0.22, green: 0.74, blue: 0.97))
                        .foregroundColor(.black)
                        .cornerRadius(8)
                }
                .buttonStyle(PlainButtonStyle())
                .padding(.top, 4)
            }
            .padding(.horizontal, 4)
        }
    }
}

/**
 * WorkoutPhasesSheet
 * Full workout plan drawer showing all 4 phases and prescribed exercises
 */
struct WorkoutPhasesSheet: View {
    @ObservedObject var coordinator = WatchSessionCoordinator.shared
    let onSelectExercise: (String) -> Void
    var onInspectExercise: ((WatchExerciseInfo) -> Void)? = nil
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                // Header
                HStack {
                    Text("WORKOUT PLAN")
                        .font(.system(size: 13, weight: .black, design: .rounded))
                        .foregroundColor(Color(red: 0.83, green: 0.63, blue: 0.09))
                    Spacer()
                    Button("Done") {
                        presentationMode.wrappedValue.dismiss()
                    }
                    .font(.system(size: 11, weight: .bold))
                }
                .padding(.bottom, 2)

                // 1. Warm-Up Section
                if !coordinator.workoutState.warmupDrills.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("1. WARM-UP & MOBILITY")
                            .font(.system(size: 10, weight: .black, design: .rounded))
                            .foregroundColor(Color(red: 0.97, green: 0.58, blue: 0.11))

                        ForEach(coordinator.workoutState.warmupDrills) { drill in
                            HStack(spacing: 6) {
                                Image(systemName: drill.isCompleted ? "checkmark.circle.fill" : "circle")
                                    .font(.system(size: 11))
                                    .foregroundColor(drill.isCompleted ? Color(red: 0.20, green: 0.78, blue: 0.55) : .gray)
                                Text(drill.name)
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundColor(.white)
                                    .lineLimit(1)
                            }
                            .padding(.vertical, 2)
                        }
                    }
                    .padding(8)
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(8)
                }

                // 2. Resistance Section
                VStack(alignment: .leading, spacing: 4) {
                    Text("2. RESISTANCE TRAINING")
                        .font(.system(size: 10, weight: .black, design: .rounded))
                        .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))

                    if coordinator.workoutState.exercises.isEmpty {
                        HStack(spacing: 6) {
                            Image(systemName: "figure.run")
                                .font(.system(size: 11))
                                .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))
                            Text("Active Recovery · No Lifts Scheduled")
                                .font(.system(size: 10.5, weight: .medium))
                                .foregroundColor(.gray)
                        }
                        .padding(.vertical, 4)
                        .padding(.horizontal, 2)
                    } else {
                        ForEach(coordinator.workoutState.exercises) { ex in
                            HStack(spacing: 4) {
                                Button(action: {
                                    onSelectExercise(ex.exerciseName)
                                    presentationMode.wrappedValue.dismiss()
                                }) {
                                    HStack(spacing: 6) {
                                        Image(systemName: ex.isCompleted ? "checkmark.circle.fill" : "circle")
                                            .font(.system(size: 11))
                                            .foregroundColor(ex.isCompleted ? Color(red: 0.20, green: 0.78, blue: 0.55) : .gray)

                                        VStack(alignment: .leading, spacing: 1) {
                                            Text(ex.exerciseName)
                                                .font(.system(size: 11, weight: .bold))
                                                .foregroundColor(ex.isCompleted ? .gray : .white)
                                                .lineLimit(1)

                                            if let muscles = ex.targetMuscles, !muscles.isEmpty {
                                                Text(muscles)
                                                    .font(.system(size: 8.5, weight: .semibold))
                                                    .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))
                                                    .lineLimit(1)
                                            }

                                            let equipStr = (ex.equipment != nil && !ex.equipment!.isEmpty) ? " · \(ex.equipment!)" : ""
                                            Text("\(ex.totalSets) sets × \(ex.repsDisplay) · \(Int(ex.prescribedWeight)) lbs\(equipStr)")
                                                .font(.system(size: 8.5, weight: .medium))
                                                .foregroundColor(.gray)
                                                .lineLimit(1)
                                        }

                                        Spacer()

                                        Image(systemName: "chevron.right")
                                            .font(.system(size: 9))
                                            .foregroundColor(.gray)
                                    }
                                }
                                .buttonStyle(PlainButtonStyle())

                                if onInspectExercise != nil {
                                    Button(action: {
                                        onInspectExercise?(ex)
                                    }) {
                                        Image(systemName: "info.circle.fill")
                                            .font(.system(size: 12))
                                            .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))
                                            .frame(width: 24, height: 24)
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                }
                            }
                            .padding(6)
                            .background(ex.exerciseName == coordinator.workoutState.activeExercise?.exerciseName ? Color(red: 0.22, green: 0.74, blue: 0.97).opacity(0.15) : Color.clear)
                            .cornerRadius(6)
                        }
                    }
                }
                .padding(8)
                .background(Color.white.opacity(0.05))
                .cornerRadius(8)

                // 3. Cardio Section
                if let cardio = coordinator.workoutState.cardioProtocol {
                    let cardioDone = cardio.isCompleted || coordinator.isCardioCompleted
                    VStack(alignment: .leading, spacing: 4) {
                        Text("3. CARDIO PROTOCOL")
                            .font(.system(size: 10, weight: .black, design: .rounded))
                            .foregroundColor(Color(red: 0.97, green: 0.35, blue: 0.35))

                        HStack(spacing: 6) {
                            Image(systemName: cardioDone ? "checkmark.circle.fill" : "circle")
                                .font(.system(size: 11))
                                .foregroundColor(cardioDone ? Color(red: 0.20, green: 0.78, blue: 0.55) : .gray)

                            Text(cardio.modality)
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(cardioDone ? .gray : .white)
                                .strikethrough(cardioDone)
                        }

                        Text("\(cardio.durationMins) mins · Tanaka Zone \(cardio.targetZone) (\(cardio.targetBpmMin)–\(cardio.targetBpmMax) BPM)")
                            .font(.system(size: 9, weight: .medium))
                            .foregroundColor(.gray)
                    }
                    .padding(8)
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(8)
                }

                // 4. Cool-Down Section
                if !coordinator.workoutState.cooldownStretches.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("4. COOL-DOWN & MOBILITY")
                            .font(.system(size: 10, weight: .black, design: .rounded))
                            .foregroundColor(Color(red: 0.20, green: 0.78, blue: 0.55))

                        ForEach(coordinator.workoutState.cooldownStretches) { stretch in
                            HStack(spacing: 6) {
                                Image(systemName: stretch.isCompleted ? "checkmark.circle.fill" : "circle")
                                    .font(.system(size: 11))
                                    .foregroundColor(stretch.isCompleted ? Color(red: 0.20, green: 0.78, blue: 0.55) : .gray)
                                Text(stretch.name)
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundColor(.white)
                                    .lineLimit(1)
                            }
                            .padding(.vertical, 2)
                        }
                    }
                    .padding(8)
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(8)
                }

                // 5. Explicit Session Completion & Discard Actions
                VStack(spacing: 6) {
                    Button(action: {
                        presentationMode.wrappedValue.dismiss()
                        coordinator.finishSession()
                    }) {
                        HStack(spacing: 5) {
                            Image(systemName: "checkmark.seal.fill")
                                .font(.system(size: 11))
                            Text("SAVE & FINISH WORKOUT")
                                .font(.system(size: 10, weight: .black, design: .rounded))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 7)
                        .background(Color(red: 0.20, green: 0.78, blue: 0.55))
                        .foregroundColor(.black)
                        .cornerRadius(8)
                    }
                    .buttonStyle(PlainButtonStyle())

                    Button(action: {
                        presentationMode.wrappedValue.dismiss()
                        coordinator.cancelSession()
                    }) {
                        HStack(spacing: 5) {
                            Image(systemName: "xmark.circle")
                                .font(.system(size: 11))
                            Text("DISCARD / CANCEL WORKOUT")
                                .font(.system(size: 10, weight: .bold, design: .rounded))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 6)
                        .background(Color.white.opacity(0.06))
                        .foregroundColor(Color(red: 0.97, green: 0.44, blue: 0.44))
                        .cornerRadius(8)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                .padding(.top, 4)
            }
            .padding(.horizontal, 4)
        }
    }
}

/**
 * EquipmentModalityPickerSheet
 * Allows 1-tap switching between Barbell, Dumbbell, Cable, Bands, Bodyweight, and Kettlebell
 * Forge Athletic
 */
struct EquipmentModalityPickerSheet: View {
    let selectedModality: WatchEquipmentModality
    let onSelect: (WatchEquipmentModality) -> Void
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        ScrollView {
            VStack(spacing: 6) {
                Text("EQUIPMENT MODALITY")
                    .font(.system(size: 11, weight: .black, design: .rounded))
                    .foregroundColor(Color(red: 0.83, green: 0.63, blue: 0.09))
                    .padding(.top, 2)

                Text("Choose loading type for this lift")
                    .font(.system(size: 9.5, weight: .medium))
                    .foregroundColor(.gray)
                    .padding(.bottom, 2)

                ForEach(WatchEquipmentModality.allCases) { modality in
                    let isSelected = modality == selectedModality
                    Button(action: {
                        onSelect(modality)
                        WKInterfaceDevice.current().play(.click)
                        presentationMode.wrappedValue.dismiss()
                    }) {
                        HStack(spacing: 8) {
                            ZStack {
                                Circle()
                                    .fill(modalityColor(modality).opacity(0.2))
                                    .frame(width: 24, height: 24)
                                Image(systemName: modality.iconName)
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(modalityColor(modality))
                            }

                            VStack(alignment: .leading, spacing: 1) {
                                Text(modality.displayName)
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(.white)
                                Text(modalitySubtitle(modality))
                                    .font(.system(size: 8.5, weight: .medium))
                                    .foregroundColor(.gray)
                            }

                            Spacer()

                            if isSelected {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 14))
                                    .foregroundColor(Color(red: 0.20, green: 0.78, blue: 0.55))
                            }
                        }
                        .padding(8)
                        .background(isSelected ? modalityColor(modality).opacity(0.12) : Color.white.opacity(0.06))
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(isSelected ? modalityColor(modality) : Color.clear, lineWidth: 1)
                        )
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .padding(.horizontal, 4)
        }
    }

    private func modalitySubtitle(_ m: WatchEquipmentModality) -> String {
        switch m {
        case .barbell: return "Olympic / EZ / Smith bar"
        case .dumbbell: return "Individual pairs (per hand)"
        case .cable: return "Pin-select weight stack"
        case .bands: return "Color-coded elastic tension"
        case .bodyweight: return "Bodyweight, vest or assist"
        case .kettlebell: return "Cast iron / competition"
        }
    }

    private func modalityColor(_ m: WatchEquipmentModality) -> Color {
        switch m {
        case .barbell: return Color(red: 0.83, green: 0.63, blue: 0.09)
        case .dumbbell: return Color(red: 0.22, green: 0.74, blue: 0.97)
        case .cable: return Color(red: 0.72, green: 0.45, blue: 0.98)
        case .bands: return Color(red: 0.97, green: 0.58, blue: 0.11)
        case .bodyweight: return Color(red: 0.20, green: 0.78, blue: 0.55)
        case .kettlebell: return Color(red: 0.97, green: 0.35, blue: 0.35)
        }
    }
}

/**
 * DynamicLoadHelperSheet
 * Routes to the specialized wrist-first adjuster matching the active exercise modality
 */
struct DynamicLoadHelperSheet: View {
    let modality: WatchEquipmentModality
    @Binding var weight: Double
    @Binding var barWeight: Double

    var body: some View {
        Group {
            switch modality {
            case .barbell:
                BarbellPlateCalculatorSheet(totalWeightLbs: $weight, barWeight: $barWeight)
            case .dumbbell:
                DumbbellRackSheet(selectedWeight: $weight)
            case .cable:
                CableStackSheet(selectedWeight: $weight)
            case .bands:
                BandSelectorSheet(selectedTension: $weight)
            case .bodyweight:
                BodyweightAdjusterSheet(selectedLoad: $weight)
            case .kettlebell:
                KettlebellPickerSheet(selectedWeight: $weight)
            }
        }
    }
}

/**
 * BarbellPlateCalculatorSheet
 * Olympic sleeve bumper visualization, bar weight selector, and quick jump buttons
 */
struct BarbellPlateCalculatorSheet: View {
    @Binding var totalWeightLbs: Double
    @Binding var barWeight: Double
    @Environment(\.presentationMode) var presentationMode

    private let availableBars: [(name: String, weight: Double)] = [
        ("45 lb Standard", 45.0),
        ("35 lb Tech/Women", 35.0),
        ("25 lb EZ Curl", 25.0),
        ("15 lb Light", 15.0),
        ("0 lb Smith/Sled", 0.0)
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                // Header & Total
                VStack(spacing: 2) {
                    Text("\(Int(totalWeightLbs)) LBS")
                        .font(.system(size: 24, weight: .black, design: .rounded))
                        .foregroundColor(Color(red: 0.83, green: 0.63, blue: 0.09))

                    let perSide = max(0, (totalWeightLbs - barWeight) / 2)
                    Text("Load \(Int(perSide)) lbs/side on \(Int(barWeight)) lb bar")
                        .font(.system(size: 10.5, weight: .semibold))
                        .foregroundColor(.gray)
                }
                .padding(.top, 2)

                // Selectable Bar Weight Chips
                VStack(alignment: .leading, spacing: 3) {
                    Text("BAR WEIGHT")
                        .font(.system(size: 8.5, weight: .black, design: .rounded))
                        .foregroundColor(.gray)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 4) {
                            ForEach(availableBars, id: \.weight) { bar in
                                let isSelected = barWeight == bar.weight
                                Button(action: {
                                    barWeight = bar.weight
                                    if totalWeightLbs < bar.weight {
                                        totalWeightLbs = bar.weight
                                    }
                                    WKInterfaceDevice.current().play(.click)
                                }) {
                                    Text("\(Int(bar.weight))#")
                                        .font(.system(size: 9.5, weight: .bold, design: .rounded))
                                        .foregroundColor(isSelected ? .black : .white)
                                        .padding(.horizontal, 6)
                                        .padding(.vertical, 3)
                                        .background(isSelected ? Color(red: 0.83, green: 0.63, blue: 0.09) : Color.white.opacity(0.1))
                                        .cornerRadius(5)
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                        }
                    }
                }
                .padding(.horizontal, 4)

                // Visual Barbell Sleeve Representation
                let perSide = max(0, (totalWeightLbs - barWeight) / 2)
                let plates = calculatePlates(perSide: perSide)

                VStack(spacing: 4) {
                    HStack(alignment: .center, spacing: 3) {
                        // Shaft
                        Rectangle()
                            .fill(Color.gray.opacity(0.5))
                            .frame(width: 12, height: 14)
                            .cornerRadius(2)

                        // Collar
                        Rectangle()
                            .fill(Color.white.opacity(0.85))
                            .frame(width: 7, height: 26)
                            .cornerRadius(2)

                        // Plates Stacked on Sleeve
                        if plates.isEmpty {
                            Text(barWeight > 0 ? "Empty Bar (\(Int(barWeight)) lbs)" : "0 lbs")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.gray)
                                .padding(.leading, 4)
                        } else {
                            ForEach(plates.indices, id: \.self) { idx in
                                let p = plates[idx]
                                PlateBumperView(weight: p)
                            }
                        }

                        Spacer()
                    }
                    .padding(.horizontal, 6)
                    .padding(.vertical, 10)
                    .background(Color.white.opacity(0.06))
                    .cornerRadius(8)

                    if !plates.isEmpty {
                        Text(platesSummaryString(plates: plates))
                            .font(.system(size: 11, weight: .bold, design: .monospaced))
                            .foregroundColor(.white)
                            .padding(.vertical, 1)
                    }
                }

                // Quick Plate Jumps (+ / - pair of plates)
                VStack(spacing: 4) {
                    HStack(spacing: 4) {
                        Button(action: {
                            if totalWeightLbs >= barWeight + 20 { totalWeightLbs -= 20; WKInterfaceDevice.current().play(.click) }
                        }) {
                            Text("-10/sd")
                                .font(.system(size: 9, weight: .bold))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 4)
                                .background(Color.white.opacity(0.08))
                                .foregroundColor(.white)
                                .cornerRadius(5)
                        }
                        .buttonStyle(PlainButtonStyle())

                        Button(action: {
                            if totalWeightLbs >= barWeight + 50 { totalWeightLbs -= 50; WKInterfaceDevice.current().play(.click) }
                        }) {
                            Text("-25/sd")
                                .font(.system(size: 9, weight: .bold))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 4)
                                .background(Color.white.opacity(0.08))
                                .foregroundColor(.white)
                                .cornerRadius(5)
                        }
                        .buttonStyle(PlainButtonStyle())

                        Button(action: {
                            if totalWeightLbs >= barWeight + 90 { totalWeightLbs -= 90; WKInterfaceDevice.current().play(.click) }
                        }) {
                            Text("-45/sd")
                                .font(.system(size: 9, weight: .bold))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 4)
                                .background(Color.white.opacity(0.08))
                                .foregroundColor(.white)
                                .cornerRadius(5)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }

                    HStack(spacing: 4) {
                        Button(action: { totalWeightLbs += 20; WKInterfaceDevice.current().play(.click) }) {
                            Text("+10/sd")
                                .font(.system(size: 9, weight: .black))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 4)
                                .background(Color(red: 0.18, green: 0.70, blue: 0.35).opacity(0.25))
                                .foregroundColor(Color(red: 0.18, green: 0.70, blue: 0.35))
                                .cornerRadius(5)
                        }
                        .buttonStyle(PlainButtonStyle())

                        Button(action: { totalWeightLbs += 50; WKInterfaceDevice.current().play(.click) }) {
                            Text("+25/sd")
                                .font(.system(size: 9, weight: .black))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 4)
                                .background(Color(red: 0.95, green: 0.75, blue: 0.10).opacity(0.25))
                                .foregroundColor(Color(red: 0.95, green: 0.75, blue: 0.10))
                                .cornerRadius(5)
                        }
                        .buttonStyle(PlainButtonStyle())

                        Button(action: { totalWeightLbs += 90; WKInterfaceDevice.current().play(.click) }) {
                            Text("+45/sd")
                                .font(.system(size: 9, weight: .black))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 4)
                                .background(Color(red: 0.90, green: 0.22, blue: 0.21).opacity(0.25))
                                .foregroundColor(Color(red: 0.90, green: 0.22, blue: 0.21))
                                .cornerRadius(5)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                .padding(.horizontal, 2)

                // Common Total Presets
                VStack(alignment: .leading, spacing: 3) {
                    Text("STANDARD PRESETS")
                        .font(.system(size: 8.5, weight: .black, design: .rounded))
                        .foregroundColor(.gray)

                    HStack(spacing: 3) {
                        ForEach([95.0, 135.0, 185.0, 225.0, 275.0, 315.0], id: \.self) { preset in
                            Button(action: {
                                totalWeightLbs = preset
                                WKInterfaceDevice.current().play(.click)
                            }) {
                                Text("\(Int(preset))")
                                    .font(.system(size: 9, weight: totalWeightLbs == preset ? .black : .medium))
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 3.5)
                                    .background(totalWeightLbs == preset ? Color(red: 0.83, green: 0.63, blue: 0.09) : Color.white.opacity(0.08))
                                    .foregroundColor(totalWeightLbs == preset ? .black : .white)
                                    .cornerRadius(4)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }
                }
                .padding(.horizontal, 2)

                Button("Done") {
                    presentationMode.wrappedValue.dismiss()
                }
                .font(.system(size: 13, weight: .bold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(Color.white.opacity(0.12))
                .foregroundColor(.white)
                .cornerRadius(8)
            }
            .padding(.horizontal, 4)
        }
    }

    private func calculatePlates(perSide: Double) -> [Double] {
        var remaining = perSide
        var plates: [Double] = []
        let standard = [45.0, 35.0, 25.0, 10.0, 5.0, 2.5]
        for p in standard {
            while remaining >= p {
                plates.append(p)
                remaining -= p
            }
        }
        return plates
    }

    private func platesSummaryString(plates: [Double]) -> String {
        var counts: [Double: Int] = [:]
        for p in plates {
            counts[p, default: 0] += 1
        }
        let sortedKeys = counts.keys.sorted(by: >)
        let parts = sortedKeys.map { k -> String in
            let count = counts[k]!
            let label = k == 2.5 ? "2.5" : "\(Int(k))"
            return "\(count)×\(label) lb"
        }
        return parts.joined(separator: " + ")
    }
}

/**
 * DumbbellRackSheet
 * Quick-tap grid of standard dumbbell pairs for instantaneous 1-tap weight selection
 */
struct DumbbellRackSheet: View {
    @Binding var selectedWeight: Double
    @Environment(\.presentationMode) var presentationMode

    private let weights: [Double] = [
        5, 7.5, 10,
        12.5, 15, 17.5,
        20, 22.5, 25,
        27.5, 30, 32.5,
        35, 40, 45,
        50, 55, 60,
        65, 70, 75,
        80, 85, 90,
        95, 100, 110
    ]

    private let columns = [
        GridItem(.flexible(), spacing: 4),
        GridItem(.flexible(), spacing: 4),
        GridItem(.flexible(), spacing: 4)
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                VStack(spacing: 2) {
                    HStack(spacing: 4) {
                        Image(systemName: "dumbbell.fill")
                            .font(.system(size: 11))
                            .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))
                        Text("DUMBBELL RACK")
                            .font(.system(size: 11, weight: .black, design: .rounded))
                            .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))
                    }
                    Text("Select weight per hand")
                        .font(.system(size: 9.5, weight: .medium))
                        .foregroundColor(.gray)
                }
                .padding(.top, 2)

                LazyVGrid(columns: columns, spacing: 4) {
                    ForEach(weights, id: \.self) { w in
                        let isSelected = selectedWeight == w
                        Button(action: {
                            selectedWeight = w
                            WKInterfaceDevice.current().play(.click)
                            presentationMode.wrappedValue.dismiss()
                        }) {
                            Text(w.truncatingRemainder(dividingBy: 1) == 0 ? "\(Int(w))" : String(format: "%.1f", w))
                                .font(.system(size: 12, weight: isSelected ? .black : .bold, design: .rounded))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 8)
                                .background(isSelected ? Color(red: 0.22, green: 0.74, blue: 0.97) : Color.white.opacity(0.08))
                                .foregroundColor(isSelected ? .black : .white)
                                .cornerRadius(6)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 6)
                                        .stroke(isSelected ? Color.white : Color.clear, lineWidth: 1)
                                )
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
            }
            .padding(.horizontal, 4)
        }
    }
}

/**
 * BandSelectorSheet
 * Visual color-coded resistance band tiers for 1-tap tension selection
 */
struct BandSelectorSheet: View {
    @Binding var selectedTension: Double
    @Environment(\.presentationMode) var presentationMode

    private struct BandTier: Identifiable {
        let id: String
        let colorName: String
        let color: Color
        let tensionLbs: Double
        let levelLabel: String
        let recommendedUses: String
    }

    private let tiers: [BandTier] = [
        BandTier(id: "yellow", colorName: "Yellow", color: Color(red: 0.95, green: 0.85, blue: 0.20), tensionLbs: 10, levelLabel: "Extra Light (10 lbs)", recommendedUses: "Mobility, rotator cuff & warm-up"),
        BandTier(id: "red", colorName: "Red", color: Color(red: 0.92, green: 0.25, blue: 0.25), tensionLbs: 20, levelLabel: "Light (20 lbs)", recommendedUses: "High reps, lateral raises & pull-aparts"),
        BandTier(id: "green", colorName: "Green", color: Color(red: 0.20, green: 0.78, blue: 0.40), tensionLbs: 30, levelLabel: "Medium (30 lbs)", recommendedUses: "Biceps, triceps & face pulls"),
        BandTier(id: "blue", colorName: "Blue", color: Color(red: 0.22, green: 0.55, blue: 0.95), tensionLbs: 45, levelLabel: "Heavy (45 lbs)", recommendedUses: "Chest press, rows & light squats"),
        BandTier(id: "black", colorName: "Black", color: Color(red: 0.45, green: 0.45, blue: 0.50), tensionLbs: 60, levelLabel: "X-Heavy (60 lbs)", recommendedUses: "Assisted pull-ups & heavy rows"),
        BandTier(id: "orange", colorName: "Orange", color: Color(red: 0.97, green: 0.55, blue: 0.15), tensionLbs: 80, levelLabel: "Monster (80 lbs)", recommendedUses: "Deadlifts, heavy squats & max effort")
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 6) {
                VStack(spacing: 2) {
                    HStack(spacing: 4) {
                        Image(systemName: "waveform.path")
                            .font(.system(size: 11))
                            .foregroundColor(Color(red: 0.97, green: 0.58, blue: 0.11))
                        Text("RESISTANCE BANDS")
                            .font(.system(size: 11, weight: .black, design: .rounded))
                            .foregroundColor(Color(red: 0.97, green: 0.58, blue: 0.11))
                    }
                    Text("Select band tension tier")
                        .font(.system(size: 9.5, weight: .medium))
                        .foregroundColor(.gray)
                }
                .padding(.top, 2)

                ForEach(tiers) { tier in
                    let isSelected = abs(selectedTension - tier.tensionLbs) < 5
                    Button(action: {
                        selectedTension = tier.tensionLbs
                        WKInterfaceDevice.current().play(.click)
                        presentationMode.wrappedValue.dismiss()
                    }) {
                        HStack(spacing: 8) {
                            Circle()
                                .fill(tier.color)
                                .frame(width: 14, height: 14)
                                .overlay(Circle().stroke(Color.white.opacity(0.3), lineWidth: 1))

                            VStack(alignment: .leading, spacing: 1) {
                                Text(tier.levelLabel)
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(.white)
                                Text(tier.recommendedUses)
                                    .font(.system(size: 8, weight: .medium))
                                    .foregroundColor(.gray)
                                    .lineLimit(1)
                            }

                            Spacer()

                            if isSelected {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 13))
                                    .foregroundColor(Color(red: 0.20, green: 0.78, blue: 0.55))
                            }
                        }
                        .padding(8)
                        .background(isSelected ? Color.white.opacity(0.14) : Color.white.opacity(0.06))
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(isSelected ? tier.color : Color.clear, lineWidth: 1)
                        )
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .padding(.horizontal, 4)
        }
    }
}

/**
 * CableStackSheet
 * Quick selector pin grid for standard cable machine weight stacks
 */
struct CableStackSheet: View {
    @Binding var selectedWeight: Double
    @Environment(\.presentationMode) var presentationMode

    private let pinWeights: [Double] = [
        10, 15, 20,
        25, 30, 35,
        40, 50, 60,
        70, 80, 90,
        100, 110, 120,
        130, 140, 150,
        160, 180, 200
    ]

    private let columns = [
        GridItem(.flexible(), spacing: 4),
        GridItem(.flexible(), spacing: 4),
        GridItem(.flexible(), spacing: 4)
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                VStack(spacing: 2) {
                    HStack(spacing: 4) {
                        Image(systemName: "cable.connector.horizontal")
                            .font(.system(size: 11))
                            .foregroundColor(Color(red: 0.72, green: 0.45, blue: 0.98))
                        Text("CABLE PIN STACK")
                            .font(.system(size: 11, weight: .black, design: .rounded))
                            .foregroundColor(Color(red: 0.72, green: 0.45, blue: 0.98))
                    }
                    Text("Select stack plate pin")
                        .font(.system(size: 9.5, weight: .medium))
                        .foregroundColor(.gray)
                }
                .padding(.top, 2)

                LazyVGrid(columns: columns, spacing: 4) {
                    ForEach(pinWeights, id: \.self) { w in
                        let isSelected = selectedWeight == w
                        Button(action: {
                            selectedWeight = w
                            WKInterfaceDevice.current().play(.click)
                            presentationMode.wrappedValue.dismiss()
                        }) {
                            Text("\(Int(w))")
                                .font(.system(size: 12, weight: isSelected ? .black : .bold, design: .rounded))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 8)
                                .background(isSelected ? Color(red: 0.72, green: 0.45, blue: 0.98) : Color.white.opacity(0.08))
                                .foregroundColor(isSelected ? .black : .white)
                                .cornerRadius(6)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 6)
                                        .stroke(isSelected ? Color.white : Color.clear, lineWidth: 1)
                                )
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
            }
            .padding(.horizontal, 4)
        }
    }
}

/**
 * BodyweightAdjusterSheet
 * Adjusts bodyweight exercises between unweighted, added load (vest/dip belt), or machine assist
 */
struct BodyweightAdjusterSheet: View {
    @Binding var selectedLoad: Double
    @Environment(\.presentationMode) var presentationMode

    private let addedWeights: [Double] = [5, 10, 15, 20, 25, 35, 45, 55]
    private let assistedWeights: [Double] = [-10, -20, -30, -40, -50]

    private let columns = [
        GridItem(.flexible(), spacing: 4),
        GridItem(.flexible(), spacing: 4),
        GridItem(.flexible(), spacing: 4),
        GridItem(.flexible(), spacing: 4)
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                VStack(spacing: 2) {
                    HStack(spacing: 4) {
                        Image(systemName: "figure.walk")
                            .font(.system(size: 11))
                            .foregroundColor(Color(red: 0.20, green: 0.78, blue: 0.55))
                        Text("BODYWEIGHT & LOAD")
                            .font(.system(size: 11, weight: .black, design: .rounded))
                            .foregroundColor(Color(red: 0.20, green: 0.78, blue: 0.55))
                    }
                    Text("Select loading profile")
                        .font(.system(size: 9.5, weight: .medium))
                        .foregroundColor(.gray)
                }
                .padding(.top, 2)

                // 1. Unweighted Button
                Button(action: {
                    selectedLoad = 0.0
                    WKInterfaceDevice.current().play(.click)
                    presentationMode.wrappedValue.dismiss()
                }) {
                    HStack {
                        Image(systemName: "figure.walk")
                            .font(.system(size: 12))
                        Text("Bodyweight Only (0 lb added)")
                            .font(.system(size: 11, weight: .bold))
                        Spacer()
                        if selectedLoad == 0.0 {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 13))
                                .foregroundColor(Color(red: 0.20, green: 0.78, blue: 0.55))
                        }
                    }
                    .padding(8)
                    .background(selectedLoad == 0.0 ? Color(red: 0.20, green: 0.78, blue: 0.55).opacity(0.18) : Color.white.opacity(0.08))
                    .foregroundColor(.white)
                    .cornerRadius(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(selectedLoad == 0.0 ? Color(red: 0.20, green: 0.78, blue: 0.55) : Color.clear, lineWidth: 1)
                    )
                }
                .buttonStyle(PlainButtonStyle())

                // 2. Added Load Grid
                VStack(alignment: .leading, spacing: 3) {
                    Text("ADDED WEIGHT (DIP BELT / VEST)")
                        .font(.system(size: 8.5, weight: .black, design: .rounded))
                        .foregroundColor(Color(red: 0.83, green: 0.63, blue: 0.09))

                    LazyVGrid(columns: columns, spacing: 4) {
                        ForEach(addedWeights, id: \.self) { w in
                            let isSelected = selectedLoad == w
                            Button(action: {
                                selectedLoad = w
                                WKInterfaceDevice.current().play(.click)
                                presentationMode.wrappedValue.dismiss()
                            }) {
                                Text("+\(Int(w))")
                                    .font(.system(size: 11, weight: isSelected ? .black : .bold, design: .rounded))
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 6)
                                    .background(isSelected ? Color(red: 0.83, green: 0.63, blue: 0.09) : Color.white.opacity(0.08))
                                    .foregroundColor(isSelected ? .black : .white)
                                    .cornerRadius(6)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }
                }

                // 3. Assisted Grid
                VStack(alignment: .leading, spacing: 3) {
                    Text("ASSISTED (COUNTERWEIGHT)")
                        .font(.system(size: 8.5, weight: .black, design: .rounded))
                        .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))

                    LazyVGrid(columns: columns, spacing: 4) {
                        ForEach(assistedWeights, id: \.self) { w in
                            let isSelected = selectedLoad == w
                            Button(action: {
                                selectedLoad = w
                                WKInterfaceDevice.current().play(.click)
                                presentationMode.wrappedValue.dismiss()
                            }) {
                                Text("\(Int(w))")
                                    .font(.system(size: 11, weight: isSelected ? .black : .bold, design: .rounded))
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 6)
                                    .background(isSelected ? Color(red: 0.22, green: 0.74, blue: 0.97) : Color.white.opacity(0.08))
                                    .foregroundColor(isSelected ? .black : .white)
                                    .cornerRadius(6)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }
                }
            }
            .padding(.horizontal, 4)
        }
    }
}

/**
 * KettlebellPickerSheet
 * Standard Russian and American kettlebell weights for 1-tap setting
 */
struct KettlebellPickerSheet: View {
    @Binding var selectedWeight: Double
    @Environment(\.presentationMode) var presentationMode

    private struct KettlebellOption: Identifiable {
        let id: Int
        let lbs: Double
        let kg: Int
        let tier: String
    }

    private let options: [KettlebellOption] = [
        KettlebellOption(id: 9, lbs: 9, kg: 4, tier: "Light / Rehab"),
        KettlebellOption(id: 18, lbs: 18, kg: 8, tier: "Warm-Up / Form"),
        KettlebellOption(id: 26, lbs: 26, kg: 12, tier: "Endurance / Mobility"),
        KettlebellOption(id: 35, lbs: 35, kg: 16, tier: "Standard / Conditioning"),
        KettlebellOption(id: 44, lbs: 44, kg: 20, tier: "Intermediate Power"),
        KettlebellOption(id: 53, lbs: 53, kg: 24, tier: "Strength Standard"),
        KettlebellOption(id: 62, lbs: 62, kg: 28, tier: "Heavy Swings"),
        KettlebellOption(id: 70, lbs: 70, kg: 32, tier: "The Beast / Max Power"),
        KettlebellOption(id: 88, lbs: 88, kg: 40, tier: "Super Heavy Elite")
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 6) {
                VStack(spacing: 2) {
                    HStack(spacing: 4) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 11))
                            .foregroundColor(Color(red: 0.97, green: 0.35, blue: 0.35))
                        Text("KETTLEBELL RACK")
                            .font(.system(size: 11, weight: .black, design: .rounded))
                            .foregroundColor(Color(red: 0.97, green: 0.35, blue: 0.35))
                    }
                    Text("Select bell weight")
                        .font(.system(size: 9.5, weight: .medium))
                        .foregroundColor(.gray)
                }
                .padding(.top, 2)

                ForEach(options) { opt in
                    let isSelected = abs(selectedWeight - opt.lbs) < 2
                    Button(action: {
                        selectedWeight = opt.lbs
                        WKInterfaceDevice.current().play(.click)
                        presentationMode.wrappedValue.dismiss()
                    }) {
                        HStack(spacing: 8) {
                            Text("\(Int(opt.lbs))#")
                                .font(.system(size: 13, weight: .black, design: .rounded))
                                .foregroundColor(isSelected ? .black : Color(red: 0.97, green: 0.35, blue: 0.35))
                                .frame(width: 38)

                            VStack(alignment: .leading, spacing: 1) {
                                Text("\(opt.kg) kg · \(opt.tier)")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(isSelected ? .black : .white)
                            }

                            Spacer()

                            if isSelected {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 13))
                                    .foregroundColor(.black)
                            }
                        }
                        .padding(7)
                        .background(isSelected ? Color(red: 0.97, green: 0.35, blue: 0.35) : Color.white.opacity(0.06))
                        .cornerRadius(7)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .padding(.horizontal, 4)
        }
    }
}

/**
 * PlateBumperView
 * Color-coded Olympic bumper plate visual icon
 */
struct PlateBumperView: View {
    let weight: Double

    var body: some View {
        VStack(spacing: 0) {
            Text(weight == 2.5 ? "2.5" : "\(Int(weight))")
                .font(.system(size: 8, weight: .black))
                .foregroundColor(.black)
                .rotationEffect(.degrees(-90))
        }
        .frame(width: plateWidth, height: plateHeight)
        .background(plateColor)
        .cornerRadius(3)
        .overlay(
            RoundedRectangle(cornerRadius: 3)
                .stroke(Color.black.opacity(0.3), lineWidth: 0.5)
        )
    }

    private var plateHeight: CGFloat {
        switch weight {
        case 45: return 48
        case 35: return 44
        case 25: return 40
        case 10: return 34
        case 5: return 28
        case 2.5: return 24
        default: return 30
        }
    }

    private var plateWidth: CGFloat {
        switch weight {
        case 45: return 14
        case 35: return 12
        case 25: return 10
        case 10: return 8
        case 5: return 7
        case 2.5: return 6
        default: return 8
        }
    }

    private var plateColor: Color {
        switch weight {
        case 45: return Color(red: 0.90, green: 0.22, blue: 0.21) // Olympic Red
        case 35: return Color(red: 0.16, green: 0.50, blue: 0.90) // Olympic Blue
        case 25: return Color(red: 0.95, green: 0.75, blue: 0.10) // Olympic Yellow
        case 10: return Color(red: 0.18, green: 0.70, blue: 0.35) // Olympic Green
        case 5: return Color(red: 0.85, green: 0.85, blue: 0.88)  // White
        case 2.5: return Color(red: 0.45, green: 0.45, blue: 0.48) // Metal / Grey
        default: return Color.gray
        }
    }
}
