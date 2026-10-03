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

const EXERCISES_WAVE_18 = [
  {
    name: 'barbell-cheat-curl.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a heavy barbell power curl with controlled eccentric overload in an elite sports performance facility. Gripping a knurled Olympic barbell loaded with black and gold plates with shoulder-width underhand grip, curling explosively to chin and lowering slowly under high tension with tight core. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'cable-cross-body-tricep.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing dual high cable cross-body triceps extensions in an elite sports performance facility. Standing between two high pulleys with cables crossed, extending arms downward and out across hips, peak lateral and long-head triceps lockout. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'barbell-kang-squat.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a barbell Kang squat in an elite sports performance facility. Transitioning smoothly from a deep hip hinge good morning down into a parallel back squat holding an Olympic barbell in high-bar rack, hamstrings and glutes under peak tension. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'incline-flared-row.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a chest-supported dumbbell row with elbows flared wide at 90 degrees on a 45-degree incline bench in an elite sports performance facility. Pulling dumbbells up in wide horizontal abduction, deep upper back and rear deltoid squeeze. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'landmine-lateral-lunge.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a landmine lateral side lunge in an elite sports performance facility. Holding the end of a landmine barbell at chest with both hands, stepping deep to one side into a parallel lateral lunge while trailing leg stays straight. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'stiff-legged-deadlift.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a barbell stiff-legged deadlift in an elite sports performance facility. Standing with straight legs and knees almost locked, hinging deep at hips with flat neutral spine, lowering loaded knurled barbell to mid-shins with maximum hamstring stretch. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'hanging-knee-twist.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing hanging alternating knee tucks with a lateral twist on a knurled steel pull-up bar in an elite sports performance facility. Hanging with straight arms and locked grip, tucking knees to chest and twisting side to side with peak oblique contraction. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
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
  console.log('⚡ Starting Wave 18 Generation via Flagship Gemini 3 Pro Vision (gemini-3-pro-image)...')
  console.log(`📂 Destination: ${OUTPUT_DIR}\n`)

  for (let i = 0; i < EXERCISES_WAVE_18.length; i++) {
    const item = EXERCISES_WAVE_18[i]
    const destPath = path.join(OUTPUT_DIR, item.name)
    console.log(`[${i + 1}/${EXERCISES_WAVE_18.length}] Generating "${item.name}"...`)

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

  console.log('🎉 Wave 18 Gemini 3 Pro Batch Generation Complete!\n')
}

main()
