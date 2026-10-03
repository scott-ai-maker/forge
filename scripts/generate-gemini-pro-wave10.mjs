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

const EXERCISES_WAVE_10 = [
  {
    name: 'barbell-sumo-deadlift.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a barbell sumo deadlift in an elite sports performance facility. Wide stance with toes pointed out, upright torso, arms hanging straight inside knees gripping a knurled Olympic barbell loaded with black and gold bumper plates, driving through heels with full hip lockout. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'arnold-press.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing standing dumbbell Arnold presses in an elite sports performance facility. Standing with rigid core posture, rotating dumbbells from palms-facing chest starting position out into full overhead lockout with palms facing forward, engaging all three deltoid heads. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'decline-barbell-bench-press.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a decline barbell bench press in an elite sports performance facility. Lying supine on a secure 15-degree decline bench with shins locked, pressing a knurled Olympic barbell upward from lower chest to lockout with full pectoral contraction. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'single-leg-rdl.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a single-leg Romanian deadlift with a matte black kettlebell in an elite sports performance facility. Balancing on one slightly bent standing leg, hinging forward until torso and straight trailing leg form a horizontal line parallel to floor, holding kettlebell in contralateral hand with neutral spine. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'cable-straight-arm-pulldown.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a standing cable straight-arm pulldown on a high cable column in an elite sports performance facility. Torso leaned forward 30 degrees, holding a straight bar with overhand grip and extended arms, sweeping the bar down in a wide arc to thighs with pure latissimus dorsi isolation. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'dumbbell-step-up.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a dumbbell step-up onto a sturdy 20-inch wooden plyometric box in an elite sports performance facility. Driving through the lead heel to full hip extension atop the box while driving the trailing knee upward to 90 degrees in a powerful athletic stance, holding heavy dumbbells at sides. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'hanging-knee-to-elbow.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a hanging knee-to-elbow core crunch on a knurled steel pull-up bar in an elite sports performance facility. Hanging with straight arms, curling pelvis and pulling knees up to touch elbows with maximum abdominal flexion and controlled lower. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
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
  console.log('⚡ Starting Wave 10 Generation via Flagship Gemini 3 Pro Vision (gemini-3-pro-image)...')
  console.log(`📂 Destination: ${OUTPUT_DIR}\n`)

  for (let i = 0; i < EXERCISES_WAVE_10.length; i++) {
    const item = EXERCISES_WAVE_10[i]
    const destPath = path.join(OUTPUT_DIR, item.name)
    console.log(`[${i + 1}/${EXERCISES_WAVE_10.length}] Generating "${item.name}"...`)

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

  console.log('🎉 Wave 10 Gemini 3 Pro Batch Generation Complete!\n')
}

main()
