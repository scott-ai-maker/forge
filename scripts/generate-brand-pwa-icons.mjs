import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const SOURCE_LOGO = path.join(ROOT, 'public', 'images', 'logo-mark-source.png')
const BG_COLOR = { r: 8, g: 14, b: 20, alpha: 1.0 } // #080E14

async function main() {
  console.log('🔥 Generating accurate PWA icons from the official Forge Athletic brand logo...')

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

      // If pixel has significant color (orange, cyan, white), preserve it
      if ((r > 60 || g > 60 || b > 60) && !(r < 25 && g < 30 && b < 40)) {
        fade = Math.max(fade, 0.9)
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

  console.log('✅ Master Forge Athletic emblem processed.')

  // 1. Standard Launcher Icons
  await sharp(masterPNG)
    .resize(512, 512)
    .png({ quality: 95 })
    .toFile(path.join(ROOT, 'public', 'images', 'icon-512.png'))

  await sharp(masterPNG)
    .resize(192, 192)
    .png({ quality: 95 })
    .toFile(path.join(ROOT, 'public', 'images', 'icon-192.png'))

  await sharp(masterPNG)
    .resize(180, 180)
    .png({ quality: 95 })
    .toFile(path.join(ROOT, 'public', 'apple-touch-icon.png'))

  await sharp(masterPNG)
    .resize(512, 512)
    .png({ quality: 95 })
    .toFile(path.join(ROOT, 'public', 'favicon.png'))

  await sharp(masterPNG)
    .resize(32, 32)
    .png({ quality: 95 })
    .toFile(path.join(ROOT, 'public', 'favicon-32.png'))

  console.log('✅ Standard icons & favicons generated.')

  // 2. Android Maskable Icons with Safe-Zone Padding (80% safe zone circle)
  // We place the emblem sized to 410px centered on a 512x512 #080E14 background
  const maskable512Emblem = await sharp(masterPNG)
    .resize(410, 410, { fit: 'contain' })
    .toBuffer()

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .composite([{ input: maskable512Emblem, left: 51, top: 51 }])
    .png({ quality: 95 })
    .toFile(path.join(ROOT, 'public', 'images', 'icon-maskable-512.png'))

  const maskable192Emblem = await sharp(masterPNG)
    .resize(154, 154, { fit: 'contain' })
    .toBuffer()

  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .composite([{ input: maskable192Emblem, left: 19, top: 19 }])
    .png({ quality: 95 })
    .toFile(path.join(ROOT, 'public', 'images', 'icon-maskable-192.png'))

  console.log('✅ Android maskable icons (with 80% safe zone) generated.')

  // 3. Monochrome Notification Icon
  // Convert colored logo into pure high-contrast white silhouette on transparent background
  const monoEmblem = await sharp(SOURCE_LOGO)
    .resize(192, 192, { fit: 'contain' })
    .threshold(40)
    .negate({ alpha: false })
    .toBuffer()

  await sharp(monoEmblem)
    .png()
    .toFile(path.join(ROOT, 'public', 'images', 'icon-monochrome.png'))

  await sharp(monoEmblem)
    .resize(512, 512)
    .png()
    .toFile(path.join(ROOT, 'public', 'images', 'icon-monochrome-512.png'))

  console.log('✅ Monochrome badge icons generated.')

  // 4. Update brand mark copy for consistency
  await sharp(masterPNG)
    .resize(512, 512)
    .png()
    .toFile(path.join(ROOT, 'public', 'images', 'brand', 'forge-crest-mark.png'))

  console.log('✨ All official Forge Athletic icons successfully generated!')
}

main().catch(err => {
  console.error('❌ Error generating icons:', err)
  process.exit(1)
})
