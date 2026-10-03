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

const EXERCISES_WAVE_16 = [
  {
    name: 'barbell-clean-and-press.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a barbell clean and press in an elite sports performance facility. Athlete at peak overhead lockout holding a knurled Olympic barbell with gold competition plates, vertical rigid spine, knees and hips locked out, proud chest. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'incline-dumbbell-hammer-curl.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing seated incline dumbbell hammer curls in an elite sports performance facility. Seated back on a 45-degree incline black leather bench, holding heavy dumbbells with neutral palms-facing grip, curling upwards with elbows pinned back, peak brachialis and forearm vascularity. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'cable-pull-through.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a cable pull-through in an elite sports performance facility. Straddling a low cable rope attachment facing away from pulley, hinging deeply at hips with flat neutral spine, and driving hips forward into full glute lockout. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'dumbbell-spider-curl.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a chest-supported spider curl on a 45-degree incline bench in an elite sports performance facility. Torso resting on bench pad with arms hanging vertically over the front edge, curling dumbbells to peak bicep contraction with zero shoulder swing. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'landmine-rotational-twist.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a landmine 180 rotational twist in an elite sports performance facility. Standing in athletic square stance, gripping the end of a landmine barbell with straight arms, rotating the bar in a controlled 180-degree arc from hip to hip with rigid oblique bracing. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'banded-barbell-rdl.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a banded barbell Romanian deadlift in an elite sports performance facility. Standing on a thick gold resistance band looped over a loaded knurled barbell, hinging deep at hips with flat spine and soft knees under accommodating band tension. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'hanging-bicycle-kicks.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing hanging bicycle kicks on a knurled steel pull-up bar in an elite sports performance facility. Hanging with straight arms, pedaling legs alternately in high horizontal circular arcs with alternating oblique contraction and locked pelvis. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
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
  console.log('⚡ Starting Wave 16 Generation via Flagship Gemini 3 Pro Vision (gemini-3-pro-image)...')
  console.log(`📂 Destination: ${OUTPUT_DIR}\n`)

  for (let i = 0; i < EXERCISES_WAVE_16.length; i++) {
    const item = EXERCISES_WAVE_16[i]
    const destPath = path.join(OUTPUT_DIR, item.name)
    console.log(`[${i + 1}/${EXERCISES_WAVE_16.length}] Generating "${item.name}"...`)

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

  console.log('🎉 Wave 16 Gemini 3 Pro Batch Generation Complete!\n')
}

main()
