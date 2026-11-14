import SwiftUI
import WatchKit

/**
 * CameraRemoteView
 * Hands-Free Wrist Camera Remote surfaced automatically when the iPhone enters:
 * - 2-Minute Quick Posture Check ("quick_posture")
 * - 30-Second Camera Readiness Check ("readiness_check")
 * - Desk Ergonomics Audit ("desk_audit")
 * - Form Lab Video Recorder ("form_lab")
 *
 * Forge Athletic — Obsidian (#000000 / #14171F) & Emerald (#10B981) Wrist Design
 */
public struct CameraRemoteView: View {
    @ObservedObject var coordinator = WatchSessionCoordinator.shared
    @Environment(\.dismiss) private var dismiss

    private let cardSurface = Color(red: 0.078, green: 0.090, blue: 0.122) // #14171F
    private let emeraldPrimary = Color(red: 0.063, green: 0.725, blue: 0.506) // #10B981
    private let amberBadge = Color(red: 0.961, green: 0.620, blue: 0.043) // #F59E0B
    private let coralBadge = Color(red: 0.957, green: 0.247, blue: 0.369) // #F43F5E

    public init() {}

    public var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 8) {
                    // Top Mode & Calibration Lock Status Pill
                    VStack(spacing: 5) {
                        HStack(spacing: 5) {
                            Image(systemName: modeIconName)
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(emeraldPrimary)

                            Text(coordinator.cameraRemote.modeTitle.uppercased())
                                .font(.system(size: 9.5, weight: .black, design: .rounded))
                                .foregroundColor(.white.opacity(0.88))
                                .lineLimit(1)
                                .minimumScaleFactor(0.75)

                            Spacer(minLength: 2)

                            Button(action: {
                                coordinator.sendCameraRemoteCommand("dismissRemote")
                                dismiss()
                            }) {
                                Image(systemName: "xmark")
                                    .font(.system(size: 9, weight: .bold))
                                    .foregroundColor(.gray)
                                    .frame(width: 20, height: 20)
                                    .background(Color.white.opacity(0.08))
                                    .clipShape(Circle())
                            }
                            .buttonStyle(PlainButtonStyle())
                        }

                        // Real-time 33-Point Detector Calibration Lock Badge
                        HStack(spacing: 6) {
                            Circle()
                                .fill(coordinator.cameraRemote.isLockedEmerald ? emeraldPrimary : amberBadge)
                                .frame(width: 7, height: 7)

                            Text(coordinator.cameraRemote.framingDisplayLabel)
                                .font(.system(size: 11, weight: .black, design: .rounded))
                                .foregroundColor(coordinator.cameraRemote.isLockedEmerald ? emeraldPrimary : amberBadge)

                            Spacer()

                            if coordinator.cameraRemote.countdownSeconds > 0 {
                                Text("\(coordinator.cameraRemote.countdownSeconds)s")
                                    .font(.system(size: 12, weight: .black, design: .monospaced))
                                    .monospacedDigit()
                                    .foregroundColor(.white)
                            } else if coordinator.cameraRemote.repCount > 0 {
                                Text("REP \(coordinator.cameraRemote.repCount)")
                                    .font(.system(size: 10, weight: .black, design: .monospaced))
                                    .monospacedDigit()
                                    .foregroundColor(.white)
                            }
                        }
                        .padding(.horizontal, 8)
                        .padding(.vertical, 6)
                        .background(
                            RoundedRectangle(cornerRadius: 9)
                                .fill((coordinator.cameraRemote.isLockedEmerald ? emeraldPrimary : amberBadge).opacity(0.14))
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 9)
                                .stroke((coordinator.cameraRemote.isLockedEmerald ? emeraldPrimary : amberBadge).opacity(0.45), lineWidth: 1)
                        )

                        Text(coordinator.cameraRemote.statusHint)
                            .font(.system(size: 9.5, weight: .medium))
                            .foregroundColor(.gray)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .lineLimit(2)
                    }
                    .padding(9)
                    .background(cardSurface)
                    .cornerRadius(12)

                    // Primary Thumb-Friendly Trigger: Start 5s Timer OR Record Rep
                    Button(action: {
                        let cmd = coordinator.cameraRemote.mode == "form_lab" ? "recordRep" : "startTimer5s"
                        coordinator.sendCameraRemoteCommand(cmd)
                    }) {
                        HStack(spacing: 6) {
                            Image(systemName: coordinator.cameraRemote.mode == "form_lab" ? "record.circle.fill" : "timer")
                                .font(.system(size: 15, weight: .bold))
                            Text(coordinator.cameraRemote.mode == "form_lab" ? "Record Rep" : "Start 5s Timer")
                                .font(.system(size: 13.5, weight: .black, design: .rounded))
                                .monospacedDigit()
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(emeraldPrimary)
                        .foregroundColor(.black)
                        .cornerRadius(12)
                    }
                    .buttonStyle(PlainButtonStyle())

                    // Secondary Action: Record Rep (when in Readiness / Scan mode) or Stop & Review
                    if coordinator.cameraRemote.mode != "form_lab" {
                        Button(action: {
                            coordinator.sendCameraRemoteCommand("recordRep")
                        }) {
                            HStack(spacing: 5) {
                                Image(systemName: "camera.aperture")
                                    .font(.system(size: 12, weight: .bold))
                                Text("Record Rep")
                                    .font(.system(size: 11.5, weight: .bold, design: .rounded))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 9)
                            .background(cardSurface)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(Color.white.opacity(0.12), lineWidth: 1)
                            )
                        }
                        .buttonStyle(PlainButtonStyle())
                    }

                    // Stop & Review Trigger
                    Button(action: {
                        coordinator.sendCameraRemoteCommand("stopAndReview")
                    }) {
                        HStack(spacing: 5) {
                            Image(systemName: "stop.circle.fill")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(coralBadge)
                            Text("Stop & Review")
                                .font(.system(size: 12, weight: .black, design: .rounded))
                                .foregroundColor(.white)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(coralBadge.opacity(0.18))
                        .cornerRadius(10)
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(coralBadge.opacity(0.45), lineWidth: 1)
                        )
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                .padding(.horizontal, 4)
                .padding(.vertical, 4)
            }
        }
    }

    private var modeIconName: String {
        switch coordinator.cameraRemote.mode {
        case "form_lab": return "video.fill"
        case "desk_audit": return "desktopcomputer"
        case "readiness_check": return "figure.cooldown"
        default: return "viewfinder"
        }
    }
}
