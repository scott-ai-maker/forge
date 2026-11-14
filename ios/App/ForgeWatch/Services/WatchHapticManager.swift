import Foundation
import WatchKit

/**
 * WatchHapticManager
 * High-precision Taptic Engine patterns for Forge Athletic training cues
 * Forge Athletic
 */
public final class WatchHapticManager {
    public static let shared = WatchHapticManager()

    private init() {}

    /**
     * Signature double-pulse indicating parasympathetic autonomic recovery achieved (Zone 1).
     */
    public func playReadyToLift() {
        let device = WKInterfaceDevice.current()
        device.play(.notification)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) {
            device.play(.directionUp)
        }
    }

    /**
     * Warning pulses delivered 10 seconds before rest timer expires to prepare for un-racking.
     */
    public func playRestEndingWarning() {
        let device = WKInterfaceDevice.current()
        device.play(.directionDown)
    }

    /**
     * Silent rest timer expiration double-tap haptic pulse at 0:00 (WKHapticType.notification)
     * so shared spaces and home gyms stay completely quiet while signaling next set readiness.
     */
    public func playRestComplete() {
        let device = WKInterfaceDevice.current()
        device.play(.notification)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.22) {
            device.play(.notification)
        }
    }

    /**
     * Instant tactile feedback upon tapping "Complete Set" or pressing Apple Watch Ultra Action Button.
     */
    public func playSetLoggedConfirmation() {
        let device = WKInterfaceDevice.current()
        device.play(.click)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) {
            device.play(.directionUp)
        }
    }

    /**
     * Authoritative success haptic knock upon set or action completion.
     */
    public func playSuccessKnock() {
        let device = WKInterfaceDevice.current()
        device.play(.success)
    }

    /**
     * Silent tactile metronome for NASM OPT™ Phase 01 slow-eccentric lifts (3-1-1 or 4-2-1).
     * Guides lowering (.click / .directionDown), bottom pause (.directionDown), and concentric drive (.directionUp).
     */
    public func playTempoBeat(phase: String, beatInPhase: Int = 1) {
        let device = WKInterfaceDevice.current()
        switch phase {
        case "eccentric":
            if beatInPhase == 1 {
                device.play(.directionDown)
            } else {
                device.play(.click)
            }
        case "isometric":
            device.play(beatInPhase == 1 ? .directionDown : .click)
        case "concentric":
            device.play(.directionUp)
        case "top":
            device.play(.click)
        default:
            device.play(.click)
        }
    }

    /**
     * Subtle wrist chime when transitioning between 30s/45s mobility drills in 5-Min Desk Reset.
     */
    public func playDeskResetIntervalChime() {
        let device = WKInterfaceDevice.current()
        device.play(.directionUp)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.14) {
            device.play(.click)
        }
    }

    /**
     * Tactile confirmation when the iPhone 33-point camera detector locks framing ("Locked · Emerald").
     */
    public func playCameraLockedEmerald() {
        let device = WKInterfaceDevice.current()
        device.play(.success)
    }

    /**
     * Subtle tick for remote 5-second camera countdown on wrist.
     */
    public func playCameraCountdownTick() {
        WKInterfaceDevice.current().play(.click)
    }

    /**
     * Alert triggered when crossing Tanaka cardio boundaries (e.g. entering Zone 3 anaerobic peak).
     */
    public func playCardioZoneBoundary(zone: Int) {
        let device = WKInterfaceDevice.current()
        if zone >= 3 {
            device.play(.failure) // Double urgent vibration for high anaerobic strain
        } else {
            device.play(.notification)
        }
    }
}
