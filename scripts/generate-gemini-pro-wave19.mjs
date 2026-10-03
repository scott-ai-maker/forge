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

const EXERCISES_WAVE_19 = [
  {
    name: 'underhand-overhead-press.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a strict supinated underhand-grip overhead barbell press in an elite sports performance facility. Standing with rigid core, pressing an Olympic barbell loaded with black and gold plates vertically overhead from chest to lockout with supinated palms, vertical spine. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'waiter-curl.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a standing dumbbell waiter curl in an elite sports performance facility. Standing upright holding the top inner plate of a single heavy dumbbell flat with palms facing upward like a waiter tray, curling the dumbbell to upper chest with isolated peak bicep tension. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'cable-lat-prayer.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a kneeling cable lat pullover prayer in an elite sports performance facility. Kneeling on a black mat in front of a high pulley rope attachment, arms extended overhead with torso hinged, sweeping rope handles down to hips in a sweeping lat arc with deep latissimus squeeze. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'barbell-pause-squat.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a deep pause squat with a loaded Olympic barbell in an elite sports performance facility. Frozen motionless at rock-bottom squat depth with hips below parallel, vertical rigid spine, knees pushed out, gold competition plates, loaded quadriceps and glutes. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'landmine-single-leg-rdl.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a single-leg Romanian deadlift using a landmine barbell in an elite sports performance facility. Balancing on one foot, holding the end of the landmine sleeve in contralateral hand, hinging until torso and trailing leg are parallel to floor with neutral spine. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'decline-close-grip-bench.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a close-grip barbell bench press on a decline bench in an elite sports performance facility. Lying on a 15-degree decline bench with shins locked, hands spaced shoulder-width apart on knurled Olympic bar, pressing upward with elbows tucked close to ribs for triceps overload. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'hanging-v-up.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing an explosive hanging V-up pike on a knurled steel pull-up bar in an elite sports performance facility. Hanging with straight arms, explosively compressing abdomen to fold body in half, toes touching hands at top of movement with locked knees. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
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
  console.log('⚡ Starting Wave 19 Generation via Flagship Gemini 3 Pro Vision (gemini-3-pro-image)...')
  console.log(`📂 Destination: ${OUTPUT_DIR}\n`)

  for (let i = 0; i < EXERCISES_WAVE_19.length; i++) {
    const item = EXERCISES_WAVE_19[i]
    const destPath = path.join(OUTPUT_DIR, item.name)
    console.log(`[${i + 1}/${EXERCISES_WAVE_19.length}] Generating "${item.name}"...`)

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

  console.log('🎉 Wave 19 Gemini 3 Pro Batch Generation Complete!\n')
}

main()
