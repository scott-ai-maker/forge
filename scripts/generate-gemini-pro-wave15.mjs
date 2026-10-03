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

const EXERCISES_WAVE_15 = [
  {
    name: 'strict-dumbbell-lateral-raise.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing strict standing dumbbell lateral raises in an elite sports performance facility. Standing with athletic posture and slight forward torso lean, raising matte black dumbbells out to shoulder height with elbows slightly bent and pinkies slightly elevated, peak lateral deltoid isolation. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'barbell-bradford-press.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a barbell Bradford press in an elite sports performance facility. Standing with rigid core, pressing an Olympic barbell just clearing the crown of the head and alternating smoothly between front rack and behind-the-neck positions under constant shoulder tension. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'incline-rear-delt-fly.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a prone incline dumbbell rear delt fly in an elite sports performance facility. Lying prone on a 30-degree incline bench with chest supported, raising dumbbells out wide in horizontal abduction with elbows soft, peak posterior deltoid squeeze. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'barbell-jefferson-squat.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a barbell Jefferson squat straddling a knurled Olympic barbell in an elite sports performance facility. Straddling the barbell with one foot forward and one foot back, gripping the bar with mixed grip, squatting deep through heels with upright vertical spine, gold calibrated plates. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'single-arm-kneeling-lat-pulldown.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a single-arm kneeling cable lat pulldown in an elite sports performance facility. Half-kneeling on a black mat, pulling a high-cable D-handle down to side with elbow driving down into hip, full latissimus dorsi stretch and contraction. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'dumbbell-squeeze-press.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a flat bench dumbbell hex squeeze press in an elite sports performance facility. Lying supine on a black leather bench, pressing hexagonal dumbbells squeezed tightly together along their inner surfaces throughout the full pressing range of motion, peak inner pectoral contraction. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'hanging-oblique-knee-raise.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing hanging oblique knee raises on a knurled steel pull-up bar in an elite sports performance facility. Hanging with straight arms and locked shoulders, twisting hips and curling knees upward toward one armpit with intense lateral oblique flexion. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
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
  console.log('⚡ Starting Wave 15 Generation via Flagship Gemini 3 Pro Vision (gemini-3-pro-image)...')
  console.log(`📂 Destination: ${OUTPUT_DIR}\n`)

  for (let i = 0; i < EXERCISES_WAVE_15.length; i++) {
    const item = EXERCISES_WAVE_15[i]
    const destPath = path.join(OUTPUT_DIR, item.name)
    console.log(`[${i + 1}/${EXERCISES_WAVE_15.length}] Generating "${item.name}"...`)

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

  console.log('🎉 Wave 15 Gemini 3 Pro Batch Generation Complete!\n')
}

main()
