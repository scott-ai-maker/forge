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

const EXERCISES_WAVE_11 = [
  {
    name: 'incline-dumbbell-curl.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing seated incline dumbbell bicep curls in an elite sports performance facility. Seated back on a 45-degree incline black leather bench, arms hanging straight down in full bicep stretch, supinating wrists and curling heavy dumbbells to peak contraction with elbows pinned back. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'dual-cable-lateral-raise.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing standing dual cable lateral raises in an elite sports performance facility. Standing in the center of a dual cable crossover station with cables crossed behind back, raising arms laterally out to shoulder height with slight elbow bend and peak lateral deltoid contraction. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'barbell-zercher-squat.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a barbell Zercher squat in an elite sports performance facility. Holding a knurled Olympic barbell nestled securely in the crook of the elbows against chest, squatting deep with upright vertical spine, elbows inside knees, loaded with gold competition plates. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 't-bar-row.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a heavy T-bar row on a landmine station in an elite sports performance facility. Straddling the barbell with chest hinged 45 degrees, pulling close-grip handle to upper abdomen with elbows flared out, full upper back and rhomboid contraction. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'dumbbell-floor-press.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a dumbbell floor press on a black training mat in an elite sports performance facility. Lying supine with knees bent and feet flat, pressing heavy matte black dumbbells upward from floor lockout to peak chest squeeze, triceps touching floor gently at bottom. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'cable-crucifix-curl.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing standing overhead dual cable bicep curls (crucifix curls) in the center of a cable crossover machine in an elite sports performance facility. Arms extended horizontally at shoulder height, curling stirrup handles inward toward ears with peak bicep peak contraction. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'captains-chair-leg-raise.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing leg raises in a Captain\'s Chair tower in an elite sports performance facility. Forearms resting on padded armrests, back pressed against lumbar pad, raising straight legs to 90 degrees with strict abdominal compression and locked pelvis. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
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
  console.log('⚡ Starting Wave 11 Generation via Flagship Gemini 3 Pro Vision (gemini-3-pro-image)...')
  console.log(`📂 Destination: ${OUTPUT_DIR}\n`)

  for (let i = 0; i < EXERCISES_WAVE_11.length; i++) {
    const item = EXERCISES_WAVE_11[i]
    const destPath = path.join(OUTPUT_DIR, item.name)
    console.log(`[${i + 1}/${EXERCISES_WAVE_11.length}] Generating "${item.name}"...`)

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

  console.log('🎉 Wave 11 Gemini 3 Pro Batch Generation Complete!\n')
}

main()
