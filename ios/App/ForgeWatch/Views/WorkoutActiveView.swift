import SwiftUI

/**
 * WorkoutActiveView
 * High-contrast, large-format wrist-first active exercise card.
 * Designed for 0.5-second glanceability under heavy gym fatigue.
 * Forge Athletic
 */
public struct WorkoutActiveView: View {
    @ObservedObject var coordinator = WatchSessionCoordinator.shared
    @ObservedObject var workoutManager = WatchWorkoutManager.shared

    @State private var loggedReps: Double = 10.0
    @State private var loggedWeight: Double = 135.0
    @State private var loggedRpe: Double = 8.0
    @State private var isCrownFocusedOnReps: Bool = true
    @State private var showPlateSheet: Bool = false
    @State private var showEndConfirmation: Bool = false

    public var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                // 1. Top Glance Header: Heart Rate + Set Progress
                HStack(alignment: .center) {
                    // Optical HR Badge with Heart Rate Zone Color
                    HStack(spacing: 4) {
                        Image(systemName: "heart.fill")
                            .font(.system(size: 11))
                            .foregroundColor(heartRateColor)
                        Text(workoutManager.currentHeartRate > 0 ? "\(workoutManager.currentHeartRate)" : "--")
                            .font(.system(size: 14, weight: .black, design: .monospaced))
                            .foregroundColor(.white)
                        Text("BPM")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.gray)
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.white.opacity(0.08))
                    .cornerRadius(8)

                    Spacer()

                    // Set Progress Pill
                    let currentSet = coordinator.workoutState.activeExercise?.setNumber ?? 1
                    let totalSets = coordinator.workoutState.activeExercise?.totalSets ?? 4
                    Text("SET \(currentSet) OF \(totalSets)")
                        .font(.system(size: 11, weight: .black, design: .rounded))
                        .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97)) // Cyan
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color(red: 0.22, green: 0.74, blue: 0.97).opacity(0.15))
                        .cornerRadius(8)
                }

                // 2. Exercise Title (Large & High Contrast)
                Text(coordinator.workoutState.activeExercise?.exerciseName ?? "Bench Press")
                    .font(.system(size: 17, weight: .black, design: .rounded))
                    .foregroundColor(.white)
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 2)

                // 3. Hero Metric Cards (Reps & Weight) with Crown Glow
                HStack(spacing: 8) {
                    // REPS CARD
                    Button(action: {
                        isCrownFocusedOnReps = true
                        WKInterfaceDevice.current().play(.click)
                    }) {
                        VStack(spacing: 2) {
                            HStack(spacing: 4) {
                                if isCrownFocusedOnReps {
                                    Circle()
                                        .fill(Color(red: 0.22, green: 0.74, blue: 0.97))
                                        .frame(width: 5, height: 5)
                                }
                                Text("REPS")
                                    .font(.system(size: 11, weight: .black))
                                    .foregroundColor(isCrownFocusedOnReps ? Color(red: 0.22, green: 0.74, blue: 0.97) : .gray)
                            }

                            Text("\(Int(loggedReps))")
                                .font(.system(size: 38, weight: .black, design: .rounded))
                                .monospacedDigit()
                                .foregroundColor(.white)
                                .minimumScaleFactor(0.8)
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
                    }
                    .buttonStyle(PlainButtonStyle())

                    // WEIGHT CARD
                    Button(action: {
                        isCrownFocusedOnReps = false
                        WKInterfaceDevice.current().play(.click)
                    }) {
                        VStack(spacing: 2) {
                            HStack(spacing: 4) {
                                if !isCrownFocusedOnReps {
                                    Circle()
                                        .fill(Color(red: 0.83, green: 0.63, blue: 0.09))
                                        .frame(width: 5, height: 5)
                                }
                                Text("LBS")
                                    .font(.system(size: 11, weight: .black))
                                    .foregroundColor(!isCrownFocusedOnReps ? Color(red: 0.83, green: 0.63, blue: 0.09) : .gray)
                            }

                            Text("\(Int(loggedWeight))")
                                .font(.system(size: 38, weight: .black, design: .rounded))
                                .monospacedDigit()
                                .foregroundColor(.white)
                                .minimumScaleFactor(0.8)
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
                    .buttonStyle(PlainButtonStyle())
                }
                .focusable(true)
                .digitalCrownRotation(
                    isCrownFocusedOnReps ? $loggedReps : $loggedWeight,
                    from: isCrownFocusedOnReps ? 1.0 : 0.0,
                    through: isCrownFocusedOnReps ? 50.0 : 800.0,
                    by: isCrownFocusedOnReps ? 1.0 : 5.0,
                    sensitivity: .medium,
                    isContinuous: false,
                    isHapticFeedbackEnabled: true
                )

                // 4. Quick Visual Plate Math Pill
                Button(action: {
                    showPlateSheet = true
                    WKInterfaceDevice.current().play(.click)
                }) {
                    HStack(spacing: 5) {
                        Image(systemName: "scalemass.fill")
                            .font(.system(size: 10))
                            .foregroundColor(Color(red: 0.83, green: 0.63, blue: 0.09))
                        Text(formatQuickPlateBar(weightLbs: loggedWeight))
                            .font(.system(size: 11, weight: .bold, design: .monospaced))
                            .foregroundColor(.white)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.gray)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color.white.opacity(0.08))
                    .cornerRadius(8)
                }
                .buttonStyle(PlainButtonStyle())

                // 5. Hero Full-Bleed "LOG SET" Button
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

                // 6. Tactile End Workout Button at bottom of scroll
                Button(action: {
                    showEndConfirmation = true
                    WKInterfaceDevice.current().play(.click)
                }) {
                    HStack(spacing: 5) {
                        Image(systemName: "xmark.circle")
                            .font(.system(size: 11))
                        Text("End Workout")
                            .font(.system(size: 11, weight: .bold))
                    }
                    .foregroundColor(Color(red: 0.97, green: 0.44, blue: 0.44).opacity(0.85))
                    .padding(.vertical, 8)
                }
                .buttonStyle(PlainButtonStyle())
            }
            .padding(.horizontal, 4)
        }
        .onAppear {
            if let ex = coordinator.workoutState.activeExercise {
                loggedReps = Double(ex.prescribedReps)
                loggedWeight = ex.prescribedWeight
                loggedRpe = ex.targetRpe ?? 8.0
            }
        }
        .sheet(isPresented: $showPlateSheet) {
            PlateCalculatorSheet(totalWeightLbs: loggedWeight)
        }
        .confirmationDialog("End Workout?", isPresented: $showEndConfirmation, titleVisibility: .visible) {
            Button("End Workout", role: .destructive) {
                coordinator.endSession()
            }
            Button("Cancel", role: .cancel) {}
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
        // Authoritative success haptic
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
    }

    private func formatQuickPlateBar(weightLbs: Double) -> String {
        guard weightLbs > 45 else { return "Bar only (45 lbs)" }
        let perSide = (weightLbs - 45) / 2
        return "Side: \(Int(perSide)) lbs"
    }
}

/**
 * Visual Barbell Plate Calculator Sheet
 * Displays an actual Olympic barbell sleeve with color-coded plates
 */
struct PlateCalculatorSheet: View {
    let totalWeightLbs: Double
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                // Total Weight Header
                VStack(spacing: 2) {
                    Text("\(Int(totalWeightLbs)) LBS")
                        .font(.system(size: 24, weight: .black, design: .rounded))
                        .foregroundColor(Color(red: 0.83, green: 0.63, blue: 0.09))

                    let perSide = max(0, (totalWeightLbs - 45) / 2)
                    Text("Load \(Int(perSide)) lbs per side on a 45 lb bar")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.gray)
                }
                .padding(.top, 4)

                // Visual Barbell Sleeve Representation
                let perSide = max(0, (totalWeightLbs - 45) / 2)
                let plates = calculatePlates(perSide: perSide)

                VStack(spacing: 6) {
                    // Barbell Collar & Plates Row
                    HStack(alignment: .center, spacing: 3) {
                        // Barbell Shaft
                        Rectangle()
                            .fill(Color.gray.opacity(0.5))
                            .frame(width: 14, height: 16)
                            .cornerRadius(2)

                        // Collar
                        Rectangle()
                            .fill(Color.white.opacity(0.8))
                            .frame(width: 8, height: 28)
                            .cornerRadius(2)

                        // Plates Stacked on Sleeve
                        if plates.isEmpty {
                            Text("Empty Bar (45 lbs)")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(.gray)
                                .padding(.leading, 6)
                        } else {
                            ForEach(plates.indices, id: \.self) { idx in
                                let p = plates[idx]
                                PlateBumperView(weight: p)
                            }
                        }

                        Spacer()
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 12)
                    .background(Color.white.opacity(0.06))
                    .cornerRadius(10)
                }

                // Plate Count Legend
                if !plates.isEmpty {
                    Text(platesSummaryString(plates: plates))
                        .font(.system(size: 12, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                        .padding(.vertical, 2)
                }

                Button("Done") {
                    presentationMode.wrappedValue.dismiss()
                }
                .font(.system(size: 13, weight: .bold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(Color.white.opacity(0.12))
                .foregroundColor(.white)
                .cornerRadius(8)
                .padding(.top, 4)
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
