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

const EXERCISES_WAVE_8 = [
  {
    name: 'incline-dumbbell-bench-press.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing an incline dumbbell bench press in an elite sports performance facility. Set on a 30-degree incline black leather bench, pressing heavy dumbbells upward in a slight converging arc, elbows tucked at 45 degrees, chest proud, feet planted firmly on the floor. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'deficit-romanian-deadlift.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a barbell Romanian deadlift standing on a 2-inch deficit platform in an elite sports performance facility. Athlete is at the bottom of the hip hinge with flat neutral spine, knees slightly soft, barbell kept close to shins with deep hamstring stretch, loaded with gold competition plates. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'neutral-grip-lat-pulldown.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a neutral-grip lat pulldown on a selectorized cable station in an elite sports performance facility. Seated tall with thighs locked under foam pads, slight torso lean, pulling a dual-handle neutral grip bar down to upper chest with elbows driving down and in, full latissimus dorsi contraction. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'barbell-shrug.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a heavy standing barbell shrug in an elite sports performance facility. Standing upright with shoulder-width stance, holding a loaded knurled barbell with double overhand grip, elevating scapulae straight upward to ears with peak trapezius contraction, zero rolling of shoulders. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'pallof-press.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a standing cable Pallof press in an elite sports performance facility. Athletic square stance perpendicular to cable column, pressing the D-handle straight out from chest, resisting rotational torque with rigid core stability and locked pelvis. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'seated-calf-raise.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a seated calf raise machine in an elite sports performance facility. Seated with thighs secured under padded levers, balls of feet on textured footplate, pressing up onto toes with full plantarflexion and peak soleus contraction. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'barbell-good-morning.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a barbell good morning in an elite sports performance facility. Knurled Olympic barbell resting securely across upper traps in high-bar position, hinging deeply at hips with flat rigid spine, soft knees, hamstrings and spinal erectors loaded under tension. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
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
  console.log('⚡ Starting Wave 8 Generation via Flagship Gemini 3 Pro Vision (gemini-3-pro-image)...')
  console.log(`📂 Destination: ${OUTPUT_DIR}\n`)

  for (let i = 0; i < EXERCISES_WAVE_8.length; i++) {
    const item = EXERCISES_WAVE_8[i]
    const destPath = path.join(OUTPUT_DIR, item.name)
    console.log(`[${i + 1}/${EXERCISES_WAVE_8.length}] Generating "${item.name}"...`)

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

  console.log('🎉 Wave 8 Gemini 3 Pro Batch Generation Complete!\n')
}

main()
