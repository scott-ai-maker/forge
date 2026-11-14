'use client'

import ForgeIcon from '@/components/ui/ForgeIcon'
import { useSfxMuted } from '@/lib/sfx-audio'

export default function LandingHeaderSfxToggle() {
  const { sfxMuted, soundEnabled, toggleSfxMuted } = useSfxMuted()

  return (
    <button
      type="button"
      onClick={toggleSfxMuted}
      aria-label="Sound effects"
      aria-pressed={soundEnabled}
      title={soundEnabled ? 'Audio feedback enabled' : 'Click to enable audio feedback'}
      className={`forge-tactile-press inline-flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-xl border px-3.5 py-2 font-mono text-xs transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] ${
        soundEnabled
          ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-300 hover:border-emerald-400/50 hover:bg-emerald-500/18'
          : 'border-white/10 bg-[#181B22] text-zinc-400 hover:border-white/15 hover:bg-[#1D212A] hover:text-zinc-200'
      }`}
    >
      <ForgeIcon name={soundEnabled ? 'flame' : 'lock'} size={13} />
      <span>{sfxMuted ? 'SFX MUTED' : 'SFX ON'}</span>
    </button>
  )
}

