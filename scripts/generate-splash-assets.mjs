import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const SOURCE_LOGO = path.join(ROOT, 'public', 'images', 'logo-mark-source.png')
const BG_COLOR = { r: 8, g: 14, b: 20, alpha: 1.0 } // #080E14

async function main() {
  console.log('🚀 Generating upgraded, enlarged, seamless Splash Screens and App Icons...')

  // Step 1: Create clean seamlessly blended master image (1024x1024)
  const { data, info } = await sharp(SOURCE_LOGO)
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  const seamlessBuffer = Buffer.alloc(width * height * 4)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * channels
      const outIdx = (y * width + x) * 4

      const r = data[srcIdx]
      const g = data[srcIdx + 1]
      const b = data[srcIdx + 2]

      // Distance from monogram center (512, 445)
      const dMonogram = Math.hypot(x - 512, y - 445)
      // Distance from text horizontal segment (y=788, x between 200 and 824)
      const clampedX = Math.max(200, Math.min(824, x))
      const dText = Math.hypot(x - clampedX, y - 788)

      let fade = 0
      if (dMonogram <= 260 || dText <= 30) {
        fade = 1.0
      } else if (dMonogram < 370) {
        fade = Math.max(0, (370 - dMonogram) / 110)
      } else if (dText < 70) {
        fade = Math.max(0, (70 - dText) / 40)
      }

      // If pixel itself is gold, force fade to 1.0
      if (r > 70 && g > 55) {
        fade = 1.0
      }

      const bgR = 8, bgG = 14, bgB = 20
      seamlessBuffer[outIdx] = Math.round(r * fade + bgR * (1 - fade))
      seamlessBuffer[outIdx + 1] = Math.round(g * fade + bgG * (1 - fade))
      seamlessBuffer[outIdx + 2] = Math.round(b * fade + bgB * (1 - fade))
      seamlessBuffer[outIdx + 3] = 255
    }
  }

  const masterPNG = await sharp(seamlessBuffer, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer()

  console.log('✅ Generated seamless 1024x1024 master emblem with smooth #080E14 vignette')

  // Helper to render splash canvas
  async function renderSplash(width, height, emblemSize, outputPath) {
    const resizedEmblem = await sharp(masterPNG)
      .resize(emblemSize, emblemSize, { fit: 'contain' })
      .toBuffer()

    const left = Math.round((width - emblemSize) / 2)
    const top = Math.round((height - emblemSize) / 2)

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
      .png({ quality: 95, compressionLevel: 8 })
      .toFile(outputPath)

    console.log(`  ✓ Generated: ${path.relative(ROOT, outputPath)} (${width}x${height}, logo: ${emblemSize}px)`)
  }

  // 1. Apple PWA Splash Screens (public/splash/)
  console.log('\n📱 Generating Enlarged Apple PWA Splash Screens in public/splash/...')
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

  // Also sync to android/app/src/main/assets/public/splash and ios/App/App/public/splash if they exist
  const capacitorSplashDirs = [
    path.join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'public', 'splash'),
    path.join(ROOT, 'ios', 'App', 'App', 'public', 'splash'),
  ]
  for (const dir of capacitorSplashDirs) {
    if (fs.existsSync(path.dirname(dir))) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      for (const s of APPLE_SPLASH_SCREENS) {
        fs.copyFileSync(path.join(splashDir, s.name), path.join(dir, s.name))
      }
      console.log(`  ✓ Synced PWA splashes to ${path.relative(ROOT, dir)}`)
    }
  }

  // 2. iOS Native Assets (ios/App/App/Assets.xcassets/Splash.imageset/)
  console.log('\n🍎 Generating Enlarged iOS Native Splash Assets...')
  const iosSplashDir = path.join(ROOT, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset')
  if (fs.existsSync(iosSplashDir)) {
    await renderSplash(160, 160, 150, path.join(iosSplashDir, 'splash-1x.png'))
    await renderSplash(320, 320, 300, path.join(iosSplashDir, 'splash-2x.png'))
    await renderSplash(480, 480, 450, path.join(iosSplashDir, 'splash-3x.png'))
  }

  // 3. Android Native Assets (android/app/src/main/res/)
  console.log('\n🤖 Generating Enlarged Android 12+ Splash Assets...')
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

  // 4. Master App Icons (512x512, 192x192, apple-touch-icon, favicon-32)
  console.log('\n⭐ Generating App Icons from Master Emblem...')
  await sharp(masterPNG)
    .resize(512, 512)
    .png()
    .toFile(path.join(ROOT, 'public', 'images', 'icon-512.png'))
  await sharp(masterPNG)
    .resize(192, 192)
    .png()
    .toFile(path.join(ROOT, 'public', 'images', 'icon-192.png'))
  await sharp(masterPNG)
    .resize(180, 180)
    .png()
    .toFile(path.join(ROOT, 'public', 'apple-touch-icon.png'))
  await sharp(masterPNG)
    .resize(32, 32)
    .png()
    .toFile(path.join(ROOT, 'public', 'favicon-32.png'))
  await sharp(masterPNG)
    .resize(512, 512)
    .png()
    .toFile(path.join(ROOT, 'public', 'favicon.png'))

  console.log('✨ All Splash Screens and Brand Icons generated successfully with enlarged, uncropped logos!')
}

main().catch(err => {
  console.error('❌ Error generating splash assets:', err)
  process.exit(1)
})
