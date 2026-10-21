import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const SOURCE_CREST = '/Users/scottgordon/.gemini/antigravity-ide/brain/3d53ebc0-76fb-45bb-b742-d9602cf34c79/forge_apex_crest_master_1792580373155.jpg'
const SOURCE_LOCKUP = '/Users/scottgordon/.gemini/antigravity-ide/brain/3d53ebc0-76fb-45bb-b742-d9602cf34c79/forge_apex_crest_lockup_1792580390011.jpg'

const BG_COLOR = { r: 8, g: 14, b: 20, alpha: 1.0 } // #080E14

async function main() {
  console.log('🚀 Deploying Proof 2: Precision Apex Crest as official Forge Athletic brand assets...')

  // 1. Save master lockup and crest source
  await sharp(SOURCE_LOCKUP)
    .resize(1024, 1024)
    .png({ quality: 95 })
    .toFile(path.join(ROOT, 'public', 'images', 'logo-mark-source.png'))

  await sharp(SOURCE_LOCKUP)
    .resize(1024, 1024)
    .png({ quality: 95 })
    .toFile(path.join(ROOT, 'public', 'images', 'brand-logo.png'))

  await sharp(SOURCE_CREST)
    .resize(512, 512)
    .png({ quality: 95 })
    .toFile(path.join(ROOT, 'public', 'images', 'brand', 'forge-crest-mark.png'))

  console.log('✅ Master brand lockup & crest mark saved.')

  // 2. Standard Launcher Icons & Favicons
  await sharp(SOURCE_CREST)
    .resize(512, 512)
    .png({ quality: 95 })
    .toFile(path.join(ROOT, 'public', 'images', 'icon-512.png'))

  await sharp(SOURCE_CREST)
    .resize(192, 192)
    .png({ quality: 95 })
    .toFile(path.join(ROOT, 'public', 'images', 'icon-192.png'))

  await sharp(SOURCE_CREST)
    .resize(180, 180)
    .png({ quality: 95 })
    .toFile(path.join(ROOT, 'public', 'apple-touch-icon.png'))

  await sharp(SOURCE_CREST)
    .resize(512, 512)
    .png({ quality: 95 })
    .toFile(path.join(ROOT, 'public', 'favicon.png'))

  await sharp(SOURCE_CREST)
    .resize(32, 32)
    .png({ quality: 95 })
    .toFile(path.join(ROOT, 'public', 'favicon-32.png'))

  console.log('✅ App icons & favicons updated.')

  // 3. Android Maskable Icons with 80% Safe-Zone Padding
  const maskable512Emblem = await sharp(SOURCE_CREST)
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

  const maskable192Emblem = await sharp(SOURCE_CREST)
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

  console.log('✅ Android maskable icons (80% safe zone) generated.')

  // 4. Monochrome Notification Icon
  const monoEmblem = await sharp(SOURCE_CREST)
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

  console.log('✅ Monochrome notification icons generated.')

  // 5. SVG Favicon with embedded high-res PNG
  const faviconPngBuffer = await sharp(SOURCE_CREST)
    .resize(256, 256)
    .png()
    .toBuffer()
  const base64Favicon = faviconPngBuffer.toString('base64')

  const svgContent = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'>
  <rect width='512' height='512' fill='#080E14' rx='96'/>
  <image href='data:image/png;base64,${base64Favicon}' x='32' y='32' width='448' height='448' preserveAspectRatio='xMidYMid meet'/>
</svg>`

  await import('fs').then(fs => fs.promises.writeFile(path.join(ROOT, 'public', 'favicon.svg'), svgContent, 'utf-8'))
  console.log('✅ SVG favicon updated.')

  console.log('🎉 All Forge Athletic brand assets successfully deployed with Proof 2 (Precision Apex Crest)!')
}

main().catch(err => {
  console.error('❌ Error deploying brand crest:', err)
  process.exit(1)
})
