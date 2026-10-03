'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import GaaIcon, { GaaIconName } from '@/components/ui/GaaIcon'
import { configureAudioSession } from '@/lib/web-audio-cadence-engine'

export interface CuratedPlaylist {
  id: string
  title: string
  subtitle: string
  category: 'strength' | 'cardio' | 'recovery'
  bpm: string
  iconName: GaaIconName
  badge: string
  badgeColor: string
  spotifyUrl: string
  spotifyEmbedId: string
  description: string
}

export const GAA_CURATED_PLAYLISTS: CuratedPlaylist[] = [
  {
    id: 'heavy-iron-drive',
    title: 'Heavy Iron & Strength Drive',
    subtitle: 'Compound Lifts · Hypertrophy · High Arousal',
    category: 'strength',
    bpm: '140–155 BPM',
    iconName: 'barbell',
    badge: 'STRENGTH MODE',
    badgeColor: '#10B981',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP',
    spotifyEmbedId: '37i9dQZF1DX76Wlfdnj7AP',
    description: 'High-octane bass, phonk, and driving rhythms calibrated to elevate CNS excitation and rate of force development.',
  },
  {
    id: 'zone-2-cadence-flow',
    title: 'Zone 2 Cardio Rhythm',
    subtitle: 'Incline Walks · Steady-State Aerobic Flow',
    category: 'cardio',
    bpm: '124–128 BPM',
    iconName: 'heart-rate',
    badge: 'CARDIO MODE',
    badgeColor: '#38BDF8',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXdLEN7aqioXM',
    spotifyEmbedId: '37i9dQZF1DXdLEN7aqioXM',
    description: 'Hypnotic progressive house and melodic electronic beats calibrated to steady-state stride frequency.',
  },
  {
    id: 'alpha-wave-recovery',
    title: 'Alpha Wave & Parasympathetic Recovery',
    subtitle: 'Cool-Down · Mobility · Cortisol Reduction',
    category: 'recovery',
    bpm: '60–80 BPM',
    iconName: 'sleep',
    badge: 'RECOVERY MODE',
    badgeColor: '#C5A059',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY',
    spotifyEmbedId: '37i9dQZF1DX3Ogo9pFvBkY',
    description: 'Ambient acoustic frequencies, binaural tones, and lo-fi textures to trigger rapid parasympathetic reactivation.',
  },
]

export function launchSpotifyNative(url: string) {
  if (typeof window === 'undefined') return
  configureAudioSession('transient')
  const playlistId = url.split('playlist/')[1]?.split('?')[0]
  const albumId = url.split('album/')[1]?.split('?')[0]
  const trackId = url.split('track/')[1]?.split('?')[0]

  let deepLink = url
  if (playlistId) deepLink = `spotify:playlist:${playlistId}`
  else if (albumId) deepLink = `spotify:album:${albumId}`
  else if (trackId) deepLink = `spotify:track:${trackId}`

  // Safe non-navigating anchor dispatch (does not blank out GAA)
  const a = document.createElement('a')
  a.href = deepLink
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function launchSpotifyWeb(url: string) {
  if (typeof window === 'undefined') return
  configureAudioSession('transient')
  window.open(url, '_blank', 'noopener,noreferrer')
}

export default function GymMusicAudioStudio({
  activeStage = 'strength',
  onClose,
}: {
  activeStage?: 'warmup' | 'strength' | 'cardio' | 'cooldown' | 'idle'
  onClose?: () => void
}) {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(() => {
    if (activeStage === 'cardio') return 'zone-2-cadence-flow'
    if (activeStage === 'cooldown') return 'alpha-wave-recovery'
    return 'heavy-iron-drive'
  })

  const [savedCustomLinks, setSavedCustomLinks] = useState<string[]>([])
  const [customUrlInput, setCustomUrlInput] = useState<string>('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gaa_custom_spotify_links_v1')
      if (saved) {
        setSavedCustomLinks(JSON.parse(saved))
      }
    } catch {}
  }, [])

  const selectedPlaylist =
    GAA_CURATED_PLAYLISTS.find(p => p.id === selectedPlaylistId) || GAA_CURATED_PLAYLISTS[0]

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customUrlInput.trim()) return
    const updated = [customUrlInput.trim(), ...savedCustomLinks.filter(l => l !== customUrlInput.trim())].slice(0, 5)
    setSavedCustomLinks(updated)
    try {
      localStorage.setItem('gaa_custom_spotify_links_v1', JSON.stringify(updated))
    } catch {}
    launchSpotifyNative(customUrlInput.trim())
    setCustomUrlInput('')
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(8,14,20,0.98) 0%, rgba(14,23,36,0.98) 100%)',
        border: '1px solid rgba(29,185,84,0.45)',
        borderRadius: 14,
        padding: '22px 20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 30px rgba(29,185,84,0.2)',
        maxWidth: 520,
        width: '100%',
        margin: '0 auto',
        color: '#FFFFFF',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <GaaIcon name="music" size={15} tone="emerald" />
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#1DB954' }}>
              Spotify In-Gym Audio Studio
            </span>
          </div>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, fontWeight: 700, letterSpacing: '0.04em', color: '#FFFFFF' }}>
            Coach Gordon&apos;s Training Soundtracks
          </h3>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--gray)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <GaaIcon name="close" size={16} tone="slate" />
          </button>
        )}
      </div>

      {/* Playlist Category Selector Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {GAA_CURATED_PLAYLISTS.map(pl => {
          const isSelected = pl.id === selectedPlaylistId
          return (
            <button
              key={pl.id}
              type="button"
              onClick={() => setSelectedPlaylistId(pl.id)}
              className="tactile-btn"
              style={{
                flex: 1,
                minWidth: 140,
                padding: '10px 12px',
                borderRadius: 8,
                background: isSelected ? 'rgba(29,185,84,0.2)' : 'rgba(255,255,255,0.03)',
                border: isSelected ? '1px solid #1DB954' : '1px solid rgba(255,255,255,0.08)',
                color: isSelected ? '#1DB954' : 'var(--gray)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <GaaIcon name={pl.iconName} size={18} tone={isSelected ? 'emerald' : 'slate'} />
                <span style={{ fontSize: 9.5, fontWeight: 800, color: pl.badgeColor, letterSpacing: '0.06em' }}>
                  {pl.bpm}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {pl.title.split('&')[0].trim()}
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected Playlist Hero Card */}
      <div
        style={{
          background: 'rgba(13,27,42,0.85)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          padding: '18px 20px',
          marginBottom: 16,
        }}
      >
        <div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: selectedPlaylist.badgeColor,
              background: `${selectedPlaylist.badgeColor}22`,
              padding: '2px 8px',
              borderRadius: 4,
              border: `1px solid ${selectedPlaylist.badgeColor}44`,
              letterSpacing: '0.06em',
            }}
          >
            {selectedPlaylist.badge} · {selectedPlaylist.bpm}
          </span>
          <h4 style={{ margin: '8px 0 2px', fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>
            {selectedPlaylist.title}
          </h4>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--gray)' }}>
            {selectedPlaylist.subtitle}
          </p>
        </div>

        <p style={{ margin: '12px 0 16px', fontSize: 12.5, lineHeight: 1.45, color: '#CBD5E1', fontStyle: 'italic' }}>
          &quot;{selectedPlaylist.description}&quot;
        </p>

        {/* 1-Tap Launch in Spotify App Button */}
        <button
          type="button"
          onClick={() => launchSpotifyNative(selectedPlaylist.spotifyUrl)}
          className="tactile-btn"
          style={{
            width: '100%',
            padding: '14px 20px',
            background: 'linear-gradient(135deg, #1DB954 0%, #169C46 100%)',
            border: 'none',
            borderRadius: 8,
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: '0 6px 20px rgba(29, 185, 84, 0.45)',
            marginBottom: 8,
          }}
        >
          <GaaIcon name="play" size={16} tone="white" />
          <span>LAUNCH IN SPOTIFY APP</span>
        </button>

        {/* Web Tab Secondary Launch */}
        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => launchSpotifyWeb(selectedPlaylist.spotifyUrl)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--gold-lt)',
              fontSize: 12,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 4,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <GaaIcon name="external-link" size={12} tone="gold" />
            <span>Or open in Spotify Web Tab</span>
          </button>
        </div>
      </div>

      {/* Custom Mix Input */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#1DB954', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
          <GaaIcon name="lightning" size={12} tone="emerald" />
          <span>Launch Any Personal Spotify Playlist</span>
        </div>
        <form onSubmit={handleSaveCustom} style={{ display: 'flex', gap: 6 }}>
          <input
            type="url"
            value={customUrlInput}
            onChange={e => setCustomUrlInput(e.target.value)}
            placeholder="Paste Spotify link (https://open.spotify.com/...)"
            style={{
              flex: 1,
              padding: '8px 10px',
              background: '#060A10',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 6,
              color: '#FFFFFF',
              fontSize: 12,
            }}
          />
          <button
            type="submit"
            className="tactile-btn"
            style={{
              padding: '8px 14px',
              background: 'linear-gradient(135deg, #1DB954 0%, #169C46 100%)',
              border: 'none',
              borderRadius: 6,
              color: '#FFFFFF',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Launch
          </button>
        </form>

        {savedCustomLinks.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {savedCustomLinks.map((link, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => launchSpotifyNative(link)}
                style={{
                  fontSize: 10.5,
                  color: '#1DB954',
                  background: 'rgba(29,185,84,0.12)',
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid rgba(29,185,84,0.3)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <GaaIcon name="music" size={10} tone="emerald" />
                <span>Saved Mix #{idx + 1}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px', fontSize: 11, color: 'var(--gray)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <GaaIcon name="volume" size={12} tone="slate" />
          <span>AirPods Pro &amp; Watch Sync Active</span>
        </span>
        <Link
          href="/dashboard/settings?tab=spotify"
          onClick={onClose}
          style={{ color: 'var(--gold-lt)', textDecoration: 'underline', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <GaaIcon name="settings" size={12} tone="gold" />
          <span>Music Settings</span>
        </Link>
      </div>
    </div>
  )
}
