'use client'

import ForgeIcon from '@/components/ui/ForgeIcon'
import { useSfxMuted } from '@/lib/sfx-audio'

export default function LandingHeaderSfxToggle() {
  const { sfxMuted, soundEnabled, toggleSfxMuted } = useSfxMuted()

  return (
    <button
      type="button"
      onClick={toggleSfxMuted}
      aria-label={sfxMuted ? 'Sound effects muted. Activate sound effects' : 'Mute sound effects'}
      aria-pressed={soundEnabled}
      title={soundEnabled ? 'Audio feedback enabled' : 'Click to enable audio feedback'}
      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs transition"
      style={{
        background: soundEnabled ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
        borderColor: soundEnabled ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.14)',
        color: soundEnabled ? '#FBBF24' : '#94A3B8',
      }}
    >
      <ForgeIcon name={soundEnabled ? 'flame' : 'lock'} size={13} />
      <span>{sfxMuted ? 'SFX MUTED' : 'SFX ON'}</span>
    </button>
  )
}

