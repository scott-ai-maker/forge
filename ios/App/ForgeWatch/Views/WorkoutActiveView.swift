import SwiftUI

/**
 * WorkoutActiveView
 * Wrist-first active exercise card, Digital Crown rep/RPE micro-adjuster,
 * and Apple Watch Ultra Action Button confirmation.
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

    public var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                // Header: Exercise Title & Set Progress Pill
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(coordinator.workoutState.activeExercise?.exerciseName ?? "Bench Press")
                            .font(.system(size: 15, weight: .black, design: .rounded))
                            .foregroundColor(.white)
                            .lineLimit(1)
                            .minimumScaleFactor(0.8)

                        Text("Set \(coordinator.workoutState.activeExercise?.setNumber ?? 1) of \(coordinator.workoutState.activeExercise?.totalSets ?? 4)")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97)) // Cyan
                    }
                    Spacer()

                    // Live Optical Heart Rate Badge
                    HStack(spacing: 3) {
                        Image(systemName: "heart.fill")
                            .font(.system(size: 10))
                            .foregroundColor(Color(red: 0.97, green: 0.44, blue: 0.44))
                        Text(workoutManager.currentHeartRate > 0 ? "\(workoutManager.currentHeartRate)" : "--")
                            .font(.system(size: 12, weight: .heavy, design: .monospaced))
                            .foregroundColor(.white)
                    }
                    .padding(.horizontal, 6)
                    .padding(.vertical, 3)
                    .background(Color.white.opacity(0.1))
                    .cornerRadius(6)
                }

                // Digital Crown Selector (Reps / RPE)
                VStack(spacing: 4) {
                    HStack(spacing: 12) {
                        // Reps Box
                        Button(action: { isCrownFocusedOnReps = true }) {
                            VStack(spacing: 1) {
                                Text("REPS")
                                    .font(.system(size: 9, weight: .black))
                                    .foregroundColor(.gray)
                                Text("\(Int(loggedReps))")
                                    .font(.system(size: 26, weight: .black, design: .rounded))
                                    .foregroundColor(isCrownFocusedOnReps ? Color(red: 0.22, green: 0.74, blue: 0.97) : .white)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 4)
                            .background(isCrownFocusedOnReps ? Color(red: 0.22, green: 0.74, blue: 0.97).opacity(0.15) : Color.white.opacity(0.06))
                            .cornerRadius(8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(isCrownFocusedOnReps ? Color(red: 0.22, green: 0.74, blue: 0.97) : Color.clear, lineWidth: 1.5)
                            )
                        }
                        .buttonStyle(PlainButtonStyle())

                        // Weight Box
                        Button(action: { isCrownFocusedOnReps = false }) {
                            VStack(spacing: 1) {
                                Text("WEIGHT")
                                    .font(.system(size: 9, weight: .black))
                                    .foregroundColor(.gray)
                                Text("\(Int(loggedWeight))")
                                    .font(.system(size: 26, weight: .black, design: .rounded))
                                    .foregroundColor(!isCrownFocusedOnReps ? Color(red: 0.83, green: 0.63, blue: 0.09) : .white)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 4)
                            .background(!isCrownFocusedOnReps ? Color(red: 0.83, green: 0.63, blue: 0.09).opacity(0.15) : Color.white.opacity(0.06))
                            .cornerRadius(8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(!isCrownFocusedOnReps ? Color(red: 0.83, green: 0.63, blue: 0.09) : Color.clear, lineWidth: 1.5)
                            )
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
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

                // Biomechanical Safety Alert (Strict Neutral Hammer Curl Guardrail)
                if coordinator.workoutState.activeExercise?.isHammerCurl == true {
                    HStack(spacing: 4) {
                        Image(systemName: "checkmark.shield.fill")
                            .font(.system(size: 9))
                            .foregroundColor(Color(red: 0.83, green: 0.63, blue: 0.09))
                        Text("Strict Neutral Grip · Thumbs to ceiling")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(Color(red: 0.83, green: 0.63, blue: 0.09))
                    }
                    .padding(.vertical, 2)
                }

                // Big Primary "LOG SET" Button
                Button(action: handleLogSet) {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 14, weight: .bold))
                        Text("LOG SET")
                            .font(.system(size: 14, weight: .heavy, design: .rounded))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(
                        LinearGradient(
                            colors: [Color(red: 0.06, green: 0.72, blue: 0.51), Color(red: 0.04, green: 0.55, blue: 0.38)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .foregroundColor(.white)
                    .cornerRadius(10)
                    .shadow(color: Color(red: 0.06, green: 0.72, blue: 0.51).opacity(0.4), radius: 4, y: 2)
                }
                .buttonStyle(PlainButtonStyle())
                .padding(.top, 2)

                // Sub-footer: Quick Plate Math
                HStack {
                    Button(action: { showPlateSheet = true }) {
                        HStack(spacing: 3) {
                            Image(systemName: "scalemass.fill")
                                .font(.system(size: 9))
                            Text(calculatePlateHint(weightLbs: loggedWeight))
                                .font(.system(size: 10, weight: .semibold))
                        }
                        .foregroundColor(.gray)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
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
    }

    private func handleLogSet() {
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

    private func calculatePlateHint(weightLbs: Double) -> String {
        guard weightLbs > 45 else { return "Bar only (45 lbs)" }
        let perSide = (weightLbs - 45) / 2
        return "Per side: \(Int(perSide)) lbs"
    }
}

/**
 * 1-Second Plate Calculator Sheet for Barbell Movements
 */
struct PlateCalculatorSheet: View {
    let totalWeightLbs: Double
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        VStack(spacing: 8) {
            Text("\(Int(totalWeightLbs)) LBS TOTAL")
                .font(.system(size: 13, weight: .heavy))
                .foregroundColor(Color(red: 0.83, green: 0.63, blue: 0.09))

            let perSide = max(0, (totalWeightLbs - 45) / 2)
            Text("Load \(Int(perSide)) lbs per side")
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(.white)

            Text(plateBreakdownString(perSide: perSide))
                .font(.system(size: 14, weight: .black, design: .monospaced))
                .foregroundColor(Color(red: 0.22, green: 0.74, blue: 0.97))
                .padding(.vertical, 4)

            Button("Done") {
                presentationMode.wrappedValue.dismiss()
            }
            .font(.system(size: 12, weight: .bold))
            .foregroundColor(.white)
            .padding(.top, 4)
        }
        .padding()
    }

    private func plateBreakdownString(perSide: Double) -> String {
        var remaining = perSide
        var plates: [String] = []

        let standard = [45.0, 35.0, 25.0, 10.0, 5.0, 2.5]
        for p in standard {
            while remaining >= p {
                plates.append(p == 2.5 ? "2.5" : "\(Int(p))")
                remaining -= p
            }
        }
        return plates.isEmpty ? "No extra plates" : plates.joined(separator: " + ")
    }
}
