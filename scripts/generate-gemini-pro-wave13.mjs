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

const EXERCISES_WAVE_13 = [
  {
    name: 'barbell-push-press.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing an explosive barbell push press in an elite sports performance facility. Athlete is at top overhead lockout, driving through heels with knees snapped straight, pressing a loaded knurled Olympic barbell with gold plates locked directly overhead, vertical rigid spine. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'cable-overhead-ez-tricep.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a low-cable overhead triceps extension with a revolving EZ-bar attachment in an elite sports performance facility. Standing in split stance facing away from low cable, arms bent back with deep triceps stretch, extending arms upward to full overhead triceps lockout. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'incline-y-raise.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a prone incline dumbbell Y-raise for lower traps in an elite sports performance facility. Lying prone on a 30-degree incline bench, raising light dumbbells in a 45-degree Y-shape with thumbs pointed up, engaging lower trapezius and serratus anterior. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'barbell-hack-squat.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a barbell hack squat in an elite sports performance facility. Standing with knurled Olympic barbell held behind thighs with double overhand grip, squatting deep through heels with upright torso and quadriceps locked under load, gold calibrated plates. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'cable-low-to-high-fly.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a low-to-high cable chest fly in an elite sports performance facility. Standing in athletic split stance in the center of a cable crossover with pulleys at floor height, sweeping D-handles upward in a scooping arc to upper chest height, clavicular head pectoral contraction. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'toes-to-bar.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing dynamic toes-to-bar on a knurled steel pull-up bar in an elite sports performance facility. Athlete in full core pike flexion with straight toes touching the bar between hands, shoulders active and lat-engaged, zero swing. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'machine-leg-extension.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a seated leg extension machine in an elite sports performance facility. Seated back against support pad with handles gripped tightly, extending knees fully to horizontal lockout with peak quadriceps rectus femoris contraction. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
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
  console.log('⚡ Starting Wave 13 Generation via Flagship Gemini 3 Pro Vision (gemini-3-pro-image)...')
  console.log(`📂 Destination: ${OUTPUT_DIR}\n`)

  for (let i = 0; i < EXERCISES_WAVE_13.length; i++) {
    const item = EXERCISES_WAVE_13[i]
    const destPath = path.join(OUTPUT_DIR, item.name)
    console.log(`[${i + 1}/${EXERCISES_WAVE_13.length}] Generating "${item.name}"...`)

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

  console.log('🎉 Wave 13 Gemini 3 Pro Batch Generation Complete!\n')
}

main()
