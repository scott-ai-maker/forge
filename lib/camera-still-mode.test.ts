import { describe, expect, it, vi } from 'vitest'
import {
  applyStillCameraConstraints,
  detectStillCameraPlatform,
  IOS_STILL_CAMERA_STEPS,
  ANDROID_STILL_CAMERA_STEPS,
  STILL_CAMERA_REQUEST_EVENT,
} from './camera-still-mode'

describe('Still Camera Mode & Auto-Zoom Prevention Engine', () => {
  it('detects iOS platform from iPhone and iPad user agents', () => {
    const iphoneUa = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
    expect(detectStillCameraPlatform(iphoneUa)).toBe('ios')

    const ipadUa = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
    expect(detectStillCameraPlatform(ipadUa)).toBe('ios')
  })

  it('detects Android platform from Android user agent', () => {
    const androidUa = 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile'
    expect(detectStillCameraPlatform(androidUa)).toBe('android')
  })

  it('falls back to desktop for non-mobile user agents', () => {
    const macUa = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    expect(detectStillCameraPlatform(macUa)).toBe('desktop')

    const winUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    expect(detectStillCameraPlatform(winUa)).toBe('desktop')
  })

  it('applies zoom constraint to lock track to 1.0x / min zoom when capability exists', async () => {
    const applyConstraints = vi.fn().mockResolvedValue(undefined)
    const mockTrack = {
      kind: 'video',
      getCapabilities: vi.fn().mockReturnValue({
        zoom: { min: 1.0, max: 5.0 },
        pan: { min: -100, max: 100 },
        tilt: { min: -100, max: 100 },
      }),
      applyConstraints,
    } as unknown as MediaStreamTrack

    const result = await applyStillCameraConstraints(mockTrack)
    expect(result).toBe(true)
    expect(applyConstraints).toHaveBeenCalledWith({
      advanced: [{ zoom: 1.0, pan: 0, tilt: 0 }],
    })
  })

  it('gracefully handles tracks without PTZ capabilities without error', async () => {
    const applyConstraints = vi.fn()
    const mockTrack = {
      kind: 'video',
      getCapabilities: vi.fn().mockReturnValue({}),
      applyConstraints,
    } as unknown as MediaStreamTrack

    const result = await applyStillCameraConstraints(mockTrack)
    expect(result).toBe(false)
    expect(applyConstraints).not.toHaveBeenCalled()
  })

  it('safely handles null or non-video tracks', async () => {
    expect(await applyStillCameraConstraints(null)).toBe(false)
    const audioTrack = { kind: 'audio' } as unknown as MediaStreamTrack
    expect(await applyStillCameraConstraints(audioTrack)).toBe(false)
  })

  it('provides structured 3-step guides for both iOS and Android', () => {
    expect(IOS_STILL_CAMERA_STEPS).toHaveLength(3)
    expect(IOS_STILL_CAMERA_STEPS[0].title).toBe('Open Control Center')
    expect(IOS_STILL_CAMERA_STEPS[2].instruction).toContain('Center Stage')

    expect(ANDROID_STILL_CAMERA_STEPS).toHaveLength(3)
    expect(ANDROID_STILL_CAMERA_STEPS[1].instruction).toContain('Auto-framing')

    expect(STILL_CAMERA_REQUEST_EVENT).toBe('still_camera_request')
  })
})

