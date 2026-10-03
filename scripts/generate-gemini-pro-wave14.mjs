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

const EXERCISES_WAVE_14 = [
  {
    name: 'machine-leg-curl.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a prone lying leg curl machine in an elite sports performance facility. Lying prone with torso flat and handles gripped firmly, curling padded roller upward toward glutes with deep hamstring contraction and controlled negative. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'zottman-curl.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing standing dumbbell Zottman curls in an elite sports performance facility. Standing with athletic posture, curling dumbbells upward with palms supinated, rotating wrists at peak to overhand pronated grip, and lowering slowly under control. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'snatch-grip-high-pull.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing an explosive barbell snatch-grip high pull from mid-thigh in an elite sports performance facility. Athlete at peak triple extension with ankles, knees, and hips extended, elbows driven high and wide holding a wide-grip Olympic barbell with gold plates at upper chest. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'cable-face-pull-external-rotation.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a standing high cable rope face pull with external rotation in an elite sports performance facility. Pulling braided rope handles apart to eye level with thumbs pointed backward, elbows high and rotated back, peak rear deltoid and rotator cuff contraction. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'dumbbell-cossack-squat.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a dumbbell Cossack squat in an elite sports performance facility. Stepping into a wide stance, squatting deep onto one leg with trailing leg straight and heel grounded with toes pointed up, holding a heavy dumbbell at chest with upright flat spine. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'tate-press.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a flat bench dumbbell Tate press for triceps in an elite sports performance facility. Lying supine holding dumbbells touching chest with elbows flared out wide, extending elbows outward and up to lockout with intense triceps tension. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'hanging-l-sit.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a strict hanging L-sit hold from a knurled steel pull-up bar in an elite sports performance facility. Hanging with straight arms and active shoulders, holding straight legs locked horizontally at a perfect 90-degree angle to torso with rigid abdominal bracing. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
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
  console.log('⚡ Starting Wave 14 Generation via Flagship Gemini 3 Pro Vision (gemini-3-pro-image)...')
  console.log(`📂 Destination: ${OUTPUT_DIR}\n`)

  for (let i = 0; i < EXERCISES_WAVE_14.length; i++) {
    const item = EXERCISES_WAVE_14[i]
    const destPath = path.join(OUTPUT_DIR, item.name)
    console.log(`[${i + 1}/${EXERCISES_WAVE_14.length}] Generating "${item.name}"...`)

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

  console.log('🎉 Wave 14 Gemini 3 Pro Batch Generation Complete!\n')
}

main()
