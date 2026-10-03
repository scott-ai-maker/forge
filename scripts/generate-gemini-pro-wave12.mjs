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

const EXERCISES_WAVE_12 = [
  {
    name: 'seated-dumbbell-shoulder-press.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a seated dumbbell shoulder press in an elite sports performance facility. Seated upright on an 85-degree black leather bench, pressing heavy dumbbells overhead in a smooth converging arc with elbows tucked slightly forward, core braced, feet flat on floor. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'bayesian-cable-curl.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a standing Bayesian cable curl in an elite sports performance facility. Facing away from a low cable pulley in a split stance with arm extended behind body, curling the D-handle forward to shoulder under continuous long-head bicep stretch. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'pendlay-row.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a strict Pendlay barbell row in an elite sports performance facility. Torso strictly parallel to floor, pulling a loaded knurled Olympic barbell explosively from floor to sternum with wide overhand grip, returning bar to dead stop on floor between reps. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'deficit-bulgarian-split-squat.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a deficit Bulgarian split squat in an elite sports performance facility. Front foot elevated on a 2-inch black rubber platform, rear foot resting on a padded roller bench, dropping deep into hip flexion below parallel while holding heavy matte black dumbbells. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'cable-reverse-fly.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing standing cable rear delt reverse flyes in an elite sports performance facility. Standing in center of dual cable crossover with pulleys at shoulder height, cables crossed in front, pulling arms wide apart in horizontal abduction with peak posterior deltoid squeeze. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'decline-russian-twist.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a decline Russian twist on a steep decline abdominal bench in an elite sports performance facility. Legs anchored, torso held at 45 degrees, rotating a black textured medicine ball smoothly across obliques side to side with rigid core tension. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'landmine-squat.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a landmine goblet squat in an elite sports performance facility. Cupping the thick end of a pivot-mounted barbell against sternum with both hands, dropping into a deep upright squat with chest proud, elbows inside knees, on dark rubber turf. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
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
  console.log('⚡ Starting Wave 12 Generation via Flagship Gemini 3 Pro Vision (gemini-3-pro-image)...')
  console.log(`📂 Destination: ${OUTPUT_DIR}\n`)

  for (let i = 0; i < EXERCISES_WAVE_12.length; i++) {
    const item = EXERCISES_WAVE_12[i]
    const destPath = path.join(OUTPUT_DIR, item.name)
    console.log(`[${i + 1}/${EXERCISES_WAVE_12.length}] Generating "${item.name}"...`)

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

  console.log('🎉 Wave 12 Gemini 3 Pro Batch Generation Complete!\n')
}

main()
