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

const EXERCISES_WAVE_17 = [
  {
    name: 'military-press.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a strict barbell military press in an elite sports performance facility. Standing with heels together and rigid upright posture, pressing an Olympic barbell loaded with black and gold plates vertically overhead to lockout without any knee dip, head poking through at top. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'cross-body-hammer-curl.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a cross-body dumbbell hammer curl in an elite sports performance facility. Standing with athletic posture, curling a heavy matte black dumbbell across chest toward opposite clavicle with neutral grip, peak brachialis and forearm flex. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'cable-glute-kickback.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a standing cable glute kickback in an elite sports performance facility. Ankle strap attached to low cable, standing with slight forward lean holding support tower, kicking leg straight back into full hip extension and peak gluteus maximus contraction. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'incline-tate-press.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing an incline dumbbell Tate press for triceps in an elite sports performance facility. Lying on a 30-degree incline bench with dumbbells touching chest, elbows flared wide, extending elbows outward and up to overhead lockout with sharp triceps tension. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'meadows-row.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a Meadows row on a landmine barbell in an elite sports performance facility. Staggered stance perpendicular to landmine sleeve, gripping thick collar with overhand grip, rowing elbow high and wide for intense lat and upper back contraction. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'deficit-snatch-deadlift.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a snatch-grip deadlift standing on a 2-inch deficit platform in an elite sports performance facility. Wide snatch grip on Olympic barbell loaded with gold plates, deep hip and knee flexion at floor start with flat horizontal spine, driving through heels. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'single-arm-hang.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a single-arm active hang from a thick knurled pull-up bar in an elite sports performance facility. Hanging by one hand with locked grip, engaged shoulder packed down and back, core rigid, non-working arm at side, showcasing muscular lat and forearm definition. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
]

const OUTPUT_DIR = path.resolve(process.cwd(), 'public/images/exercises')
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

async function generateWithGeminiPro(prompt, destPath) {
  const model = 'gemini-3-pro-image'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['IMAGE'],
      },
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini Pro API Error ${res.status}: ${errText}`)
  }

  const data = await res.json()
  const parts = data.candidates?.[0]?.content?.parts || []
  const imgPart = parts.find((p) => p.inlineData)
  if (!imgPart || !imgPart.inlineData?.data) {
    throw new Error('No image payload returned in Gemini Pro response')
  }

  const buffer = Buffer.from(imgPart.inlineData.data, 'base64')
  fs.writeFileSync(destPath, buffer)
}

async function main() {
  console.log('⚡ Starting Wave 17 Generation via Flagship Gemini 3 Pro Vision (gemini-3-pro-image)...')
  console.log(`📂 Destination: ${OUTPUT_DIR}\n`)

  for (let i = 0; i < EXERCISES_WAVE_17.length; i++) {
    const item = EXERCISES_WAVE_17[i]
    const destPath = path.join(OUTPUT_DIR, item.name)
    console.log(`[${i + 1}/${EXERCISES_WAVE_17.length}] Generating "${item.name}"...`)

    try {
      await generateWithGeminiPro(item.prompt, destPath)
      const sizeKb = Math.round(fs.statSync(destPath).size / 1024)
      console.log(`  ✅ Successfully saved: ${item.name} (${sizeKb} KB)\n`)
    } catch (err) {
      console.error(`  ❌ Error generating ${item.name}:`, err.message)
    }

    // 2-second rate-friendly interval
    await new Promise((r) => setTimeout(r, 2000))
  }

  console.log('🎉 Wave 17 Gemini 3 Pro Batch Generation Complete!\n')
}

main()
