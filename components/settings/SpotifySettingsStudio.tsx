'use client'

import React, { useState, useEffect } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  GAA_CURATED_PLAYLISTS,
  launchSpotifyNative,
  launchSpotifyWeb,
  type CuratedPlaylist,
} from '@/components/fitness/GymMusicAudioStudio'

export default function SpotifySettingsStudio() {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('heavy-iron-drive')
  const [customPlaylistUrl, setCustomPlaylistUrl] = useState<string>('')
  const [savedCustomLinks, setSavedCustomLinks] = useState<string[]>([])
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gaa_custom_spotify_links_v1')
      if (saved) {
        setSavedCustomLinks(JSON.parse(saved))
      }
    } catch {}
  }, [])

  const selectedPlaylist: CuratedPlaylist =
    GAA_CURATED_PLAYLISTS.find(p => p.id === selectedPlaylistId) || GAA_CURATED_PLAYLISTS[0]

  const handleSaveCustomLink = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customPlaylistUrl.trim()) return
    const updated = [customPlaylistUrl.trim(), ...savedCustomLinks.filter(l => l !== customPlaylistUrl.trim())].slice(0, 5)
    setSavedCustomLinks(updated)
    try {
      localStorage.setItem('gaa_custom_spotify_links_v1', JSON.stringify(updated))
    } catch {}
    setCustomPlaylistUrl('')
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleDeleteCustomLink = (index: number) => {
    const updated = savedCustomLinks.filter((_, idx) => idx !== index)
    setSavedCustomLinks(updated)
    try {
      localStorage.setItem('gaa_custom_spotify_links_v1', JSON.stringify(updated))
    } catch {}
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hero Overview */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16,22,38,0.95) 0%, rgba(9,13,24,0.95) 100%)',
          border: '1px solid rgba(29, 185, 84, 0.35)',
          borderRadius: 12,
          padding: '24px 28px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              background: '#1DB954',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              boxShadow: '0 0 16px rgba(29,185,84,0.5)',
            }}
          >
            <GaaIcon name="music" size={22} tone="inherit" />
          </div>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#1DB954', fontWeight: 800 }}>
              Audio &amp; Entertainment Integration
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, color: '#FFFFFF', margin: '2px 0 0', letterSpacing: '0.04em' }}>
              Spotify In-Gym Soundtracks &amp; Playlists
            </h3>
          </div>
        </div>

        <p style={{ fontSize: 13, lineHeight: 1.5, color: '#CBD5E1', margin: '8px 0 16px', maxWidth: 720 }}>
          Calibrate your in-gym atmosphere with Coach Gordon&apos;s curated high-drive Spotify soundscapes. 1-tap launching streams full master-quality audio continuously in the background on your phone, AirPods Pro, and Apple Watch while GAA logs sets and announces voice cadence over your music.
        </p>

        {/* 3 Pillars Banner */}
        <div
          style={{
            background: 'rgba(29,185,84,0.08)',
            border: '1px solid rgba(29,185,84,0.25)',
            borderRadius: 8,
            padding: '14px 16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#1DB954', marginBottom: 2 }}>
              <GaaIcon name="lightning" size={13} tone="inherit" />
              <span>1-Tap Background Play</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray)' }}>Plays directly in your native Spotify app with full master quality and zero timeouts.</div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#1DB954', marginBottom: 2 }}>
              <GaaIcon name="headphones" size={13} tone="inherit" />
              <span>Seamless Voice Layering</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray)' }}>Coach Gordon&apos;s tempo cues and 3-2-1 rest pips layer smoothly over your music.</div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#1DB954', marginBottom: 2 }}>
              <GaaIcon name="watch" size={13} tone="inherit" />
              <span>Lock Screen &amp; Watch Sync</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray)' }}>Keeps playing with screen locked, in pocket, and via Apple Watch controls.</div>
          </div>
        </div>
      </div>

      {/* Playlist Selector & Launch Surface */}
      <div
        style={{
          background: '#0D1726',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '22px 24px',
        }}
      >
        <h4 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
          <GaaIcon name="music" size={16} tone="gold" />
          <span>Curated Training Soundtracks</span>
        </h4>

        {/* Playlist Selector Pills */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          {GAA_CURATED_PLAYLISTS.map(pl => {
            const isSelected = pl.id === selectedPlaylistId
            return (
              <button
                key={pl.id}
                type="button"
                onClick={() => setSelectedPlaylistId(pl.id)}
                className="tactile-btn"
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  background: isSelected ? 'rgba(29,185,84,0.2)' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? '1px solid #1DB954' : '1px solid rgba(255,255,255,0.1)',
                  color: isSelected ? '#1DB954' : 'var(--gray)',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <GaaIcon name={pl.iconName} size={14} tone={isSelected ? 'emerald' : 'slate'} />
                <span>{pl.title}</span>
                <span style={{ fontSize: 10, color: pl.badgeColor, background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: 4 }}>
                  {pl.bpm}
                </span>
              </button>
            )
          })}
        </div>

        {/* Playlist Action Bar */}
        <div style={{ background: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: '18px 20px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '16px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: selectedPlaylist.badgeColor, fontWeight: 800 }}>
                {selectedPlaylist.badge} · {selectedPlaylist.bpm}
              </div>
              <h4 style={{ margin: '4px 0 2px', fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>
                {selectedPlaylist.title}
              </h4>
              <p style={{ margin: 0, fontSize: 12, color: '#CBD5E1' }}>
                {selectedPlaylist.subtitle}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => launchSpotifyNative(selectedPlaylist.spotifyUrl)}
                className="tactile-btn"
                style={{
                  background: 'linear-gradient(135deg, #1DB954 0%, #169C46 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '12px 20px',
                  borderRadius: 7,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 16px rgba(29,185,84,0.45)',
                }}
              >
                <GaaIcon name="play" size={14} tone="inherit" />
                <span>Open in Spotify App</span>
              </button>

              <button
                type="button"
                onClick={() => launchSpotifyWeb(selectedPlaylist.spotifyUrl)}
                className="tactile-btn"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#FFFFFF',
                  padding: '12px 16px',
                  borderRadius: 7,
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <GaaIcon name="globe" size={14} tone="inherit" />
                <span>Open in Web Tab ➔</span>
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 10, fontSize: 12, fontWeight: 700, color: 'var(--gold-lt)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="headphones" size={14} tone="gold" />
            <span>Tracklist &amp; Audio Preview:</span>
          </div>

          {/* Embedded Spotify Tracklist & Artwork Preview */}
          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <iframe
              src={`https://open.spotify.com/embed/playlist/${selectedPlaylist.spotifyEmbedId}?utm_source=generator&theme=0`}
              width="100%"
              height="352"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify Embedded Settings Player"
            />
          </div>
        </div>
      </div>

      {/* Custom Workout Mix Links Vault */}
      <div
        style={{
          background: '#0D1726',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '22px 24px',
        }}
      >
        <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
          <GaaIcon name="lightning" size={16} tone="gold" />
          <span>Save Your Personal Spotify Playlists</span>
        </h4>
        <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--gray)' }}>
          Paste links to your favorite personal training playlists or albums to launch them with 1 tap during workouts.
        </p>

        <form onSubmit={handleSaveCustomLink} style={{ display: 'flex', gap: 8, maxWidth: 640 }}>
          <input
            type="url"
            value={customPlaylistUrl}
            onChange={e => setCustomPlaylistUrl(e.target.value)}
            placeholder="https://open.spotify.com/playlist/..."
            style={{
              flex: 1,
              padding: '10px 14px',
              background: '#060A10',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 7,
              color: '#FFFFFF',
              fontSize: 13,
            }}
          />
          <button
            type="submit"
            className="tactile-btn"
            style={{
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #1DB954 0%, #169C46 100%)',
              border: 'none',
              borderRadius: 7,
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Save Playlist
          </button>
        </form>

        {saveSuccess && (
          <div style={{ marginTop: 8, color: '#10B981', fontSize: 12, fontWeight: 700 }}>
            ✓ Playlist saved to your in-gym library!
          </div>
        )}

        {savedCustomLinks.length > 0 && (
          <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', fontWeight: 800 }}>
              Your Saved Playlists ({savedCustomLinks.length}/5)
            </div>
            {savedCustomLinks.map((link, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 6,
                  padding: '8px 12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  <GaaIcon name="music" size={14} tone="inherit" />
                  <button
                    type="button"
                    onClick={() => launchSpotifyNative(link)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#1DB954',
                      fontSize: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      textDecoration: 'underline',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {link}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCustomLink(idx)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#EF4444',
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: '2px 6px',
                  }}
                  title="Remove playlist"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
