import { playPrFanfare } from '@/lib/web-audio-cadence-engine'

/**
 * High-performance Gold PR particle confetti burst
 * Creates a celebratory explosion of metallic gold and emerald flakes on all-time Personal Records.
 */
export function triggerGoldPrCelebration(_options?: { message?: string }) {
  if (typeof window === 'undefined') return

  // 1. Audio fanfare
  playPrFanfare()

  // 2. Visual Particle Explosion Canvas
  const canvas = document.createElement('canvas')
  canvas.style.position = 'fixed'
  canvas.style.inset = '0'
  canvas.style.width = '100vw'
  canvas.style.height = '100vh'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '999999'
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    document.body.removeChild(canvas)
    return
  }

  const width = (canvas.width = window.innerWidth * window.devicePixelRatio)
  const height = (canvas.height = window.innerHeight * window.devicePixelRatio)
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

  const colors = ['#D4A017', '#E5D0A1', '#F59E0B', '#34D399', '#10B981', '#FFFFFF']
  const particleCount = 80

  const particles: Array<{
    x: number
    y: number
    vx: number
    vy: number
    size: number
    color: string
    rotation: number
    vRot: number
    alpha: number
  }> = []

  const originX = window.innerWidth / 2
  const originY = window.innerHeight * 0.4

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5
    const speed = Math.random() * 14 + 6
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.2,
      alpha: 1,
    })
  }

  const startTime = performance.now()

  function render(now: number) {
    if (!ctx) return
    const elapsed = now - startTime
    if (elapsed > 2200) {
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas)
      }
      return
    }

    ctx.clearRect(0, 0, width, height)

    particles.forEach(p => {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.35 // Gravity
      p.vx *= 0.98 // Air resistance
      p.rotation += p.vRot
      p.alpha = Math.max(0, 1 - elapsed / 2200)

      ctx.save()
      ctx.globalAlpha = p.alpha
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      ctx.restore()
    })

    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)
}
