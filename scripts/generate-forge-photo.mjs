import fs from 'node:fs'
import path from 'node:path'

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return {}
  const content = fs.readFileSync(envPath, 'utf8')
  const env = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx !== -1) {
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim()
    }
  }
  return env
}

const env = loadEnv()
const API_KEY = env.GEMINI_API_KEY
if (!API_KEY) {
  console.error('❌ Missing GEMINI_API_KEY in .env.local')
  process.exit(1)
}

const LOGO_PATH = path.resolve(process.cwd(), 'public/images/brand-logo.png')
const logoBase64 = fs.readFileSync(LOGO_PATH).toString('base64')

export async function generateForgeExercisePhoto({ prompt, artifactPath, publicPath }) {
  const model = 'gemini-3-pro-image'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`

  console.log(`⚡ Generating via ${model}...`)
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: 'image/png', data: logoBase64 } },
          { text: prompt }
        ]
      }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: '16:9'
        }
      }
    })
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini Pro Vision API Error ${res.status}: ${errText}`)
  }

  const data = await res.json()
  const parts = data.candidates?.[0]?.content?.parts || []
  const imgPart = parts.find((p) => p.inlineData)
  if (!imgPart || !imgPart.inlineData?.data) {
    throw new Error('No image payload returned in response: ' + JSON.stringify(data))
  }

  const buffer = Buffer.from(imgPart.inlineData.data, 'base64')
  
  if (artifactPath) {
    fs.mkdirSync(path.dirname(artifactPath), { recursive: true })
    fs.writeFileSync(artifactPath, buffer)
    console.log(`  💾 Saved artifact: ${artifactPath} (${Math.round(buffer.length / 1024)} KB)`)
  }

  if (publicPath) {
    fs.mkdirSync(path.dirname(publicPath), { recursive: true })
    fs.writeFileSync(publicPath, buffer)
    console.log(`  🚀 Deployed to: ${publicPath} (${Math.round(buffer.length / 1024)} KB)`)
  }

  return buffer
}

// CLI execution helper
if (process.argv[1] && process.argv[1].endsWith('generate-forge-photo.mjs')) {
  const [,, jsonArg] = process.argv
  if (!jsonArg) {
    console.error('Usage: node scripts/generate-forge-photo.mjs <JSON_CONFIG>')
    process.exit(1)
  }
  const config = JSON.parse(jsonArg)
  generateForgeExercisePhoto(config)
    .then(() => console.log('✅ Generation complete!'))
    .catch((err) => {
      console.error('❌ Failed:', err.message)
      process.exit(1)
    })
}
