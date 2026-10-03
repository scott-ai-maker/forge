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

const EXERCISES_WAVE_9 = [
  {
    name: 'dumbbell-romanian-deadlift.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a dumbbell Romanian deadlift in an elite sports performance facility. Standing with feet hip-width apart, holding heavy matte black dumbbells in front of thighs, hinging deep at hips with flat neutral spine, pushing hips back until deep stretch in hamstrings and glutes, soft knees. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'concentration-curl.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a seated dumbbell concentration curl in an elite sports performance facility. Seated on a flat leather bench with elbow braced securely against inner thigh, curling heavy dumbbell to shoulder with isolated peak bicep contraction and zero torso swing. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'barbell-overhead-squat.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a deep overhead squat with a knurled Olympic barbell in an elite sports performance facility. In full deep squat with hips below parallel, barbell locked out with wide snatch grip directly over crown of head, rigid vertical torso and thoracic extension, black and gold plates. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'incline-dumbbell-row.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a chest-supported dumbbell row on an incline bench in an elite sports performance facility. Lying prone on a 45-degree incline black leather bench, pulling heavy dumbbells upwards with elbows driving past ribs, full middle trapezius and rhomboid retraction. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'landmine-press.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a standing landmine shoulder press in an elite sports performance facility. Standing in athletic split stance, holding the end of a pivot-mounted barbell sleeve at shoulder, pressing upward and forward with explosive shoulder and core power. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'swiss-ball-hamstring-curl.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing a supine hamstring curl on a textured stability ball in an elite sports performance facility. Lying supine with arms flat on floor, bridging hips high into the air and curling heels in toward glutes on top of the stability ball, peak hamstring and glute contraction. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
  },
  {
    name: 'hanging-windshield-wipers.jpg',
    prompt: 'High-end luxury fitness photography of a fit athletic athlete performing hanging windshield wipers in an elite sports performance facility. Hanging from a heavy pull-up bar with inverted hips and legs pointed vertically to the ceiling, rotating legs smoothly side to side in a controlled arc, peak oblique tension. Dark navy and slate gym aesthetic with warm golden ambient rim lighting, sharp focus, commercial fitness editorial style.',
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
  console.log('⚡ Starting Wave 9 Generation via Flagship Gemini 3 Pro Vision (gemini-3-pro-image)...')
  console.log(`📂 Destination: ${OUTPUT_DIR}\n`)

  for (let i = 0; i < EXERCISES_WAVE_9.length; i++) {
    const item = EXERCISES_WAVE_9[i]
    const destPath = path.join(OUTPUT_DIR, item.name)
    console.log(`[${i + 1}/${EXERCISES_WAVE_9.length}] Generating "${item.name}"...`)

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

  console.log('🎉 Wave 9 Gemini 3 Pro Batch Generation Complete!\n')
}

main()
