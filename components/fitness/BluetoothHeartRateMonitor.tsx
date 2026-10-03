'use client'

import { useState, useEffect, useRef } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import { identifyHeartRateZone } from '@/lib/nasm-cardio-stage-engine'

interface BluetoothDeviceRef {
  gatt?: {
    connected?: boolean
    connect?: () => Promise<{
      getPrimaryService: (s: string) => Promise<{
        getCharacteristic: (c: string) => Promise<{
          startNotifications: () => Promise<void>
          addEventListener: (e: string, h: (ev: Event) => void) => void
        }>
      }>
    }>
    disconnect?: () => void
  }
  addEventListener?: (e: string, h: () => void) => void
  name?: string
}

interface BluetoothHeartRateMonitorProps {
  athleteAge?: number
  onSyncSessionStats?: (stats: { avgBpm: number; maxBpm: number; durationMins: number }) => void
}

export default function BluetoothHeartRateMonitor({
  athleteAge = 35,
  onSyncSessionStats,
}: BluetoothHeartRateMonitorProps) {
  const [connecting, setConnecting] = useState<boolean>(false)
  const [connected, setConnected] = useState<boolean>(false)
  const [deviceName, setDeviceName] = useState<string | null>(null)
  const [currentBpm, setCurrentBpm] = useState<number | null>(null)
  const [sessionSamples, setSessionSamples] = useState<number[]>([])
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const bluetoothDeviceRef = useRef<BluetoothDeviceRef | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Web Bluetooth capability check
  const supported = typeof navigator !== 'undefined' && 'bluetooth' in navigator

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (connected && sessionStartTime) {
      timer = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000))
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [connected, sessionStartTime])

  const handleCharacteristicValueChanged = (event: Event) => {
    const target = event.target as unknown as { value: DataView }
    if (!target || !target.value) return

    const value = target.value
    const flags = value.getUint8(0)
    const rate16Bits = flags & 0x1
    let bpm: number

    if (rate16Bits) {
      bpm = value.getUint16(1, /* littleEndian= */ true)
    } else {
      bpm = value.getUint8(1)
    }

    if (bpm > 30 && bpm < 250) {
      setCurrentBpm(bpm)
      setSessionSamples(prev => [...prev, bpm])
    }
  }

  async function connectBluetoothHeartRate() {
    setConnecting(true)
    setErrorMessage(null)

    try {
      if (!('bluetooth' in navigator)) {
        throw new Error('Web Bluetooth is not supported on this browser. Please use Google Chrome, Microsoft Edge, or a Web Bluetooth compatible browser.')
      }

      const navBt = (navigator as unknown as { bluetooth: { requestDevice: (opts: unknown) => Promise<{ gatt: { connect: () => Promise<{ getPrimaryService: (s: string) => Promise<{ getCharacteristic: (c: string) => Promise<{ startNotifications: () => Promise<void>; addEventListener: (e: string, h: (ev: Event) => void) => void }> }> }> }; addEventListener: (e: string, h: () => void) => void; name?: string }> } }).bluetooth
      const device = await navBt.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service'],
      })

      bluetoothDeviceRef.current = device
      setDeviceName(device.name || 'Bluetooth Heart Rate Monitor')

      device.addEventListener('gattserverdisconnected', () => {
        setConnected(false)
        setCurrentBpm(null)
        setDeviceName(null)
      })

      const server = await device.gatt.connect()
      const service = await server.getPrimaryService('heart_rate')
      const characteristic = await service.getCharacteristic('heart_rate_measurement')

      await characteristic.startNotifications()
      characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged)

      setConnected(true)
      setSessionStartTime(Date.now())
      setSessionSamples([])
      setConnecting(false)
    } catch (err: unknown) {
      const errorObj = err as { name?: string; message?: string }
      if (errorObj?.name !== 'NotFoundError') {
        setErrorMessage(errorObj?.message || 'Failed to connect to Bluetooth heart rate monitor.')
      }
      setConnecting(false)
    }
  }

  function disconnectBluetooth() {
    if (bluetoothDeviceRef.current?.gatt?.connected) {
      bluetoothDeviceRef.current.gatt.disconnect?.()
    }
    if (intervalRef.current) clearInterval(intervalRef.current)
    setConnected(false)
    setCurrentBpm(null)
    setDeviceName(null)
  }

  const currentZone = currentBpm ? identifyHeartRateZone(currentBpm, athleteAge) : null

  const avgBpm = sessionSamples.length > 0
    ? Math.round(sessionSamples.reduce((a, b) => a + b, 0) / sessionSamples.length)
    : (currentBpm || 0)

  const maxBpm = sessionSamples.length > 0
    ? Math.max(...sessionSamples)
    : (currentBpm || 0)

  const durationMins = Math.max(Math.round(elapsedSeconds / 60), 1)

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #101626 0%, #080C16 100%)',
        border: connected ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(212,160,23,0.3)',
        borderRadius: 8,
        padding: '16px 20px',
        boxShadow: connected ? '0 0 25px rgba(16,185,129,0.15)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              background: connected ? 'rgba(16,185,129,0.15)' : 'rgba(212,160,23,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {connected ? (
              <GaaIcon name="heart-rate" size={16} tone="emerald" />
            ) : (
              <GaaIcon name="bluetooth" size={16} tone="gold" />
            )}
          </div>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800 }}>
              Live Telemetry HUD · Web Bluetooth GATT
            </div>
            <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 16, fontWeight: 700, color: '#FFFFFF', margin: '2px 0 0', letterSpacing: '0.04em' }}>
              {connected ? deviceName : 'Pair Live Heart Rate Sensor'}
            </h4>
          </div>
        </div>

        <div>
          {!connected ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={connectBluetoothHeartRate}
                disabled={connecting || !supported}
                title={!supported ? 'Web Bluetooth is not supported in this browser' : undefined}
                style={{
                  background: !supported
                    ? 'rgba(255,255,255,0.08)'
                    : 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                  color: !supported ? 'var(--gray)' : '#0A0E18',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: 800,
                  fontSize: 12,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: connecting || !supported ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <GaaIcon name="bluetooth" size={13} tone="inherit" />
                <span>{connecting ? 'Scanning...' : (!supported ? 'Bluetooth Unsupported' : 'Pair HR Sensor')}</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {onSyncSessionStats && (
                <button
                  type="button"
                  onClick={() => onSyncSessionStats({ avgBpm, maxBpm, durationMins })}
                  style={{
                    background: 'rgba(16,185,129,0.2)',
                    border: '1px solid #10B981',
                    color: '#34D399',
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <GaaIcon name="lightning" size={12} tone="emerald" />
                  <span>Fill Stats ({avgBpm} BPM)</span>
                </button>
              )}
              <button
                type="button"
                onClick={disconnectBluetooth}
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#F87171',
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div style={{ fontSize: 11, color: '#F87171', marginTop: 10, lineHeight: 1.4 }}>
          {errorMessage}
        </div>
      )}

      {/* Live Active Telemetry Display */}
      {connected && currentBpm && currentZone && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))',
            gap: 12,
            alignItems: 'center',
          }}
        >
          {/* Live BPM */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontFamily: 'var(--font-telemetry, monospace)',
                fontSize: 40,
                fontWeight: 700,
                color: currentZone.color,
                lineHeight: 1,
                textShadow: `0 0 15px ${currentZone.color}66`,
              }}
            >
              {currentBpm}
            </span>
            <div>
              <div style={{ fontSize: 11, color: 'var(--white)', fontWeight: 800 }}>LIVE BPM</div>
              <div style={{ fontSize: 10, color: currentZone.color, fontWeight: 700 }}>
                {currentZone.zoneName.split(':')[0]}
              </div>
            </div>
          </div>

          {/* Target Zone & Status */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 6, border: `1px solid ${currentZone.color}44` }}>
            <div style={{ fontSize: 9, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 800 }}>
              Tanaka Stage Zone
            </div>
            <div style={{ fontSize: 12, color: currentZone.color, fontWeight: 800, margin: '2px 0' }}>
              ● {currentZone.zoneName}
            </div>
            <div style={{ fontSize: 10, color: 'var(--gray)' }}>
              Avg: {avgBpm} BPM · Max: {maxBpm} BPM
            </div>
          </div>

          {/* Live Duration */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 9, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 800 }}>
              Elapsed Cardio Time
            </div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 18, fontWeight: 700, color: 'var(--white)', margin: '2px 0' }}>
              {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s
            </div>
            <div style={{ fontSize: 10, color: '#34D399' }}>
              ● Live Bluetooth Stream
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
