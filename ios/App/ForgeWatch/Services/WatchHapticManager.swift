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
     * Final rest timer expiration haptic pattern.
     */
    public func playRestComplete() {
        let device = WKInterfaceDevice.current()
        device.play(.success)
    }

    /**
     * Instant tactile feedback upon tapping "Log Set" or pressing Apple Watch Ultra Action Button.
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
     * Paces NASM OPT™ tempo phases (e.g. 4-2-1-1).
     */
    public func playTempoBeat(phase: String) {
        let device = WKInterfaceDevice.current()
        switch phase {
        case "eccentric":
            device.play(.click)
        case "isometric":
            device.play(.directionDown)
        case "concentric":
            device.play(.directionUp)
        default:
            device.play(.click)
        }
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
