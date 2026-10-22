import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const SOURCE_LOCKUP = fs.existsSync(path.join(ROOT, 'public', 'images', 'brand', 'forge-brand-lockup.png'))
  ? path.join(ROOT, 'public', 'images', 'brand', 'forge-brand-lockup.png')
  : path.join(ROOT, 'public', 'images', 'logo-mark-source.png')

const BG_COLOR = { r: 8, g: 14, b: 20, alpha: 1.0 } // #080E14 (Forge Athletic Obsidian Slate)

async function main() {
  console.log('🚀 Generating upgraded, seamless Forge Athletic Splash Screens...')
  console.log(`  Source artwork: ${path.relative(ROOT, SOURCE_LOCKUP)}`)

  // Step 1: Create clean seamlessly blended master image (1024x1024)
  const { data, info } = await sharp(SOURCE_LOCKUP)
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  const seamlessBuffer = Buffer.alloc(width * height * 4)
  const targetBg = [8, 14, 20]

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * channels
      const outIdx = (y * width + x) * 4

      const r = data[srcIdx]
      const g = data[srcIdx + 1]
      const b = data[srcIdx + 2]

      // Distance to artwork bounding core: X [200, 824], Y [190, 834]
      const clampedX = Math.max(200, Math.min(824, x))
      const clampedY = Math.max(190, Math.min(834, y))
      const d = Math.hypot(x - clampedX, y - clampedY)

      let factor = 1.0
      if (d > 20) {
        factor = Math.max(0, (120 - d) / 100)
      }

      seamlessBuffer[outIdx] = Math.round(r * factor + targetBg[0] * (1 - factor))
      seamlessBuffer[outIdx + 1] = Math.round(g * factor + targetBg[1] * (1 - factor))
      seamlessBuffer[outIdx + 2] = Math.round(b * factor + targetBg[2] * (1 - factor))
      seamlessBuffer[outIdx + 3] = 255
    }
  }

  const masterPNG = await sharp(seamlessBuffer, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer()

  console.log('✅ Generated seamless 1024x1024 master lockup with smooth #080E14 edge vignette')

  // Helper to render splash canvas
  async function renderSplash(width, height, emblemSize, outputPath) {
    const resizedEmblem = await sharp(masterPNG)
      .resize(emblemSize, emblemSize, { fit: 'contain' })
      .toBuffer()

    const left = Math.round((width - emblemSize) / 2)
    const top = Math.round((height - emblemSize) / 2)

    const targetDir = path.dirname(outputPath)
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: BG_COLOR,
      },
    })
      .composite([
        {
          input: resizedEmblem,
          left,
          top,
        },
      ])
      .removeAlpha()
      .png({ quality: 95, compressionLevel: 8 })
      .toFile(outputPath)

    console.log(`  ✓ Generated: ${path.relative(ROOT, outputPath)} (${width}x${height}, logo: ${emblemSize}px)`)
  }

  // 1. Apple PWA / Standalone Splash Screens (public/splash/)
  console.log('\n📱 Generating Apple iOS Splash Screens (16 device resolutions)...')
  const APPLE_SPLASH_SCREENS = [
    { name: 'apple-splash-1290-2796.png', w: 1290, h: 2796, logoSize: 920 },
    { name: 'apple-splash-1179-2556.png', w: 1179, h: 2556, logoSize: 850 },
    { name: 'apple-splash-1284-2778.png', w: 1284, h: 2778, logoSize: 920 },
    { name: 'apple-splash-1170-2532.png', w: 1170, h: 2532, logoSize: 850 },
    { name: 'apple-splash-1125-2436.png', w: 1125, h: 2436, logoSize: 820 },
    { name: 'apple-splash-1242-2688.png', w: 1242, h: 2688, logoSize: 890 },
    { name: 'apple-splash-828-1792.png',  w: 828,  h: 1792, logoSize: 620 },
    { name: 'apple-splash-1242-2208.png', w: 1242, h: 2208, logoSize: 890 },
    { name: 'apple-splash-750-1334.png',  w: 750,  h: 1334, logoSize: 550 },
    { name: 'apple-splash-640-1136.png',  w: 640,  h: 1136, logoSize: 480 },
    { name: 'apple-splash-2048-2732.png', w: 2048, h: 2732, logoSize: 1400 },
    { name: 'apple-splash-1668-2388.png', w: 1668, h: 2388, logoSize: 1200 },
    { name: 'apple-splash-1640-2360.png', w: 1640, h: 2360, logoSize: 1180 },
    { name: 'apple-splash-1620-2160.png', w: 1620, h: 2160, logoSize: 1150 },
    { name: 'apple-splash-1536-2048.png', w: 1536, h: 2048, logoSize: 1100 },
    { name: 'apple-splash-1488-2266.png', w: 1488, h: 2266, logoSize: 1080 },
  ]

  const splashDir = path.join(ROOT, 'public', 'splash')
  if (!fs.existsSync(splashDir)) fs.mkdirSync(splashDir, { recursive: true })

  for (const s of APPLE_SPLASH_SCREENS) {
    await renderSplash(s.w, s.h, s.logoSize, path.join(splashDir, s.name))
  }

  // Sync to native iOS and Android public/splash asset folders
  const capacitorSplashDirs = [
    path.join(ROOT, 'ios', 'App', 'App', 'public', 'splash'),
    path.join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'public', 'splash'),
  ]
  for (const dir of capacitorSplashDirs) {
    if (fs.existsSync(path.dirname(dir))) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      for (const s of APPLE_SPLASH_SCREENS) {
        fs.copyFileSync(path.join(splashDir, s.name), path.join(dir, s.name))
      }
      console.log(`  ✓ Synced Apple splash screens to ${path.relative(ROOT, dir)}`)
    }
  }

  // 2. iOS Native Assets (ios/App/App/Assets.xcassets/Splash.imageset/)
  console.log('\n🍎 Generating iOS Native Storyboard Splash Assets (Splash.imageset)...')
  const iosSplashDir = path.join(ROOT, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset')
  if (fs.existsSync(iosSplashDir)) {
    await renderSplash(160, 160, 150, path.join(iosSplashDir, 'splash-1x.png'))
    await renderSplash(320, 320, 300, path.join(iosSplashDir, 'splash-2x.png'))
    await renderSplash(480, 480, 450, path.join(iosSplashDir, 'splash-3x.png'))
    console.log('  ✓ Updated iOS Splash.imageset (1x, 2x, 3x)')
  }

  // 3. Android Native Assets (android/app/src/main/res/)
  console.log('\n🤖 Generating Android Native Splash Assets...')
  const androidDensities = [
    { name: 'mipmap-mdpi', size: 288, logoSize: 220 },
    { name: 'mipmap-hdpi', size: 432, logoSize: 330 },
    { name: 'mipmap-xhdpi', size: 576, logoSize: 440 },
    { name: 'mipmap-xxhdpi', size: 864, logoSize: 660 },
    { name: 'mipmap-xxxhdpi', size: 1152, logoSize: 880 },
  ]
  for (const d of androidDensities) {
    const targetDir = path.join(ROOT, 'android', 'app', 'src', 'main', 'res', d.name)
    if (fs.existsSync(targetDir)) {
      await renderSplash(d.size, d.size, d.logoSize, path.join(targetDir, 'splash_icon.png'))
    }
  }
  const androidDrawableDir = path.join(ROOT, 'android', 'app', 'src', 'main', 'res', 'drawable')
  if (fs.existsSync(androidDrawableDir)) {
    await renderSplash(512, 512, 450, path.join(androidDrawableDir, 'splash_icon.png'))
    await renderSplash(512, 512, 450, path.join(androidDrawableDir, 'splash.png'))
  }

  console.log('\n✨ All Forge Athletic Splash Screens generated successfully!')
}

main().catch(err => {
  console.error('❌ Error generating splash assets:', err)
  process.exit(1)
})
