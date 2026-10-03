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

const EXERCISES_WAVE_7 = [
  {
    name: 'single-arm-dumbbell-row.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a single-arm dumbbell row in an elite sports performance facility. One knee and same-side hand braced firmly on a black leather flat bench, flat horizontal back, pulling a heavy matte black dumbbell upwards along ribs to hip with elbow driving straight back, latissimus contracted. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'dumbbell-hammer-curl.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing standing dumbbell hammer curls in an elite sports performance facility. Standing with athletic posture, neutral grip with palms facing each other, curling heavy matte black dumbbells upwards towards shoulders with elbows pinned at sides, brachialis and forearm vascularity. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'overhead-tricep-extension.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a standing overhead triceps rope cable extension in an elite sports performance facility. Standing in forward-leaning split stance, holding braided rope handles overhead from high cable pulley, extending arms forward and locking out triceps at full elbow extension. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'hanging-leg-raise.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a hanging leg raise in an elite sports performance facility. Hanging with straight arms from a heavy knurled steel pull-up bar, raising straight legs horizontally to 90 degrees with strict abdominal and hip flexor control, zero body swing. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'dumbbell-lateral-lunge.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a dumbbell lateral side lunge in an elite sports performance facility. Stepping wide to one side with hip sitting deep and back into lunge, opposite trailing leg straight, holding dumbbells framing the lead knee with upright flat chest on dark rubber turf. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'ab-wheel-rollout.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing an ab wheel rollout on a black training mat in an elite sports performance facility. Kneeling with core braced, rolling a dual-wheel roller fully forward until body is extended straight and parallel just above the floor, lats and rectus abdominis under peak tension. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'cable-lateral-raise.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a single-arm low-cable lateral shoulder raise in an elite sports performance facility. Standing sideways to low pulley station, grasping single D-handle, raising arm laterally out to shoulder height with slight elbow bend and peak lateral deltoid contraction. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
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
  console.log('⚡ Starting Wave 7 Generation via Flagship Gemini 3 Pro Vision (gemini-3-pro-image)...')
  console.log(`📂 Destination: ${OUTPUT_DIR}\n`)

  for (let i = 0; i < EXERCISES_WAVE_7.length; i++) {
    const item = EXERCISES_WAVE_7[i]
    const destPath = path.join(OUTPUT_DIR, item.name)
    console.log(`[${i + 1}/${EXERCISES_WAVE_7.length}] Generating "${item.name}"...`)

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

  console.log('🎉 Wave 7 Gemini 3 Pro Batch Generation Complete!\n')
}

main()
