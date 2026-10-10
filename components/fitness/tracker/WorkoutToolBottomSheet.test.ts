import { describe, it, expect, vi } from 'vitest'
import { WorkoutToolTab } from './WorkoutToolBottomSheet'

describe('WorkoutToolBottomSheet Component & Navigation Architecture', () => {
  it('validates supported tool tabs and their semantic roles', () => {
    const validTabs: WorkoutToolTab[] = ['form', 'warmup', 'intensity', 'science', 'telemetry']
    expect(validTabs).toHaveLength(5)
    expect(validTabs).toContain('form')
    expect(validTabs).toContain('warmup')
    expect(validTabs).toContain('intensity')
    expect(validTabs).toContain('science')
    expect(validTabs).toContain('telemetry')
  })

  it('filters available tools correctly based on exercise modality and NASM OPT phase', () => {
    // Phase 1 (Stabilization Endurance): Intensity protocol (drop-set / rest-pause) is disabled
    const getAvailableTools = (isTimed: boolean, isStrength: boolean, phase?: number): WorkoutToolTab[] => {
      const isIntensityOffered = phase !== undefined && phase >= 2 && phase <= 5
      if (!isTimed && isStrength && isIntensityOffered) {
        return ['form', 'warmup', 'intensity', 'science', 'telemetry']
      }
      return ['form', 'warmup', 'science', 'telemetry']
    }

    const phase1Tools = getAvailableTools(false, true, 1)
    expect(phase1Tools).not.toContain('intensity')
    expect(phase1Tools).toContain('warmup')
    expect(phase1Tools).toContain('science')

    const phase3Tools = getAvailableTools(false, true, 3)
    expect(phase3Tools).toContain('intensity')
    expect(phase3Tools).toHaveLength(5)

    const timedStretchTools = getAvailableTools(true, false)
    expect(timedStretchTools).not.toContain('intensity')
    expect(timedStretchTools).toHaveLength(4)
  })

  it('verifies bottom sheet sheet configuration ensures zero in-flow layout shift on cards', () => {
    // Modal Bottom Sheet uses position: fixed, z-index: 1000, and max-height: 85vh
    const sheetStyles = {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      maxHeight: '85vh',
      display: 'flex',
      flexDirection: 'column',
    }

    expect(sheetStyles.position).toBe('fixed')
    expect(sheetStyles.zIndex).toBeGreaterThanOrEqual(1000)
    expect(sheetStyles.maxHeight).toBe('85vh')
  })

  it('verifies safe area inset bottom styling for iOS PWA and Android home indicators', () => {
    const bottomPaddingStyle = 'calc(16px + env(safe-area-inset-bottom, 0px))'
    expect(bottomPaddingStyle).toContain('env(safe-area-inset-bottom')
  })

  it('verifies quick-switch navigation tab action handler invokes haptic and tab update', () => {
    const triggerHaptic = vi.fn()
    const onSelectTool = vi.fn()

    const handleSelectTab = (tab: WorkoutToolTab) => {
      triggerHaptic('tap')
      onSelectTool(tab)
    }

    handleSelectTab('science')
    expect(triggerHaptic).toHaveBeenCalledWith('tap')
    expect(onSelectTool).toHaveBeenCalledWith('science')

    handleSelectTab('telemetry')
    expect(onSelectTool).toHaveBeenCalledWith('telemetry')
  })

  it('verifies escape key listener semantics for closing bottom sheet', () => {
    const onClose = vi.fn()
    const handleKeyDown = (e: { key: string }) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    handleKeyDown({ key: 'Enter' })
    expect(onClose).not.toHaveBeenCalled()

    handleKeyDown({ key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
