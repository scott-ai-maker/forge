#!/usr/bin/env node
/**
 * GAA — Gemini Pro & Omni Flash Video Generation Script
 * 
 * Generates bespoke cinematic biomechanics & private facility video reels
 * for the Gordon Athletic Advisory intake splash page using Gemini Pro 
 * for directorial prompt engineering and Gemini Omni Flash for high-definition
 * generative video rendering.
 * 
 * Usage:
 *   node scripts/generate-intake-video.mjs
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

function loadApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY
  const envPath = path.join(ROOT, '.env.local')
  if (existsSync(envPath)) {
    const raw = readFileSync(envPath, 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (trimmed.startsWith('GEMINI_API_KEY=')) {
        return trimmed.split('=')[1].trim()
      }
    }
  }
  return null
}

async function generateDirectorPromptWithGeminiPro(apiKey) {
  console.log('Directing video storyboard with Gemini Pro...')
  const systemPrompt = `You are an elite luxury cinematic director for Gordon Athletic Advisory (GAA), a ultra-high-end human performance and clinical biomechanics advisory for executives and competitive athletes.
Craft a 1-paragraph, highly vivid, descriptive, photographic video generation prompt for an AI video model.
Describe:
- Camera movement: Smooth, elegant, slow tracking or orbiting shot.
- Setting: Private architectural sports science laboratory, matte black and brushed gold steel equipment, subtle gravitational laser/plumb grid lines, dark obsidian background with warm amber champagne accent lighting.
- Athlete/Subject: An elite athlete in focused, controlled, biomechanically perfect motion (or an immaculate barbell/kinetic setup).
- Lighting & Texture: High-contrast chiaroscuro, cinematic 4K hyperrealism, soft volumetric atmospheric haze.
- Output ONLY the prompt text, no quotes, no markdown.`

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: systemPrompt }] }]
    })
  })

  if (!res.ok) {
    console.warn('Gemini Pro prompt generation fallback to default luxury directive')
    return 'A cinematic slow-motion tracking shot gliding through an ultra-luxury private sports science biomechanics laboratory. Matte obsidian walls, warm champagne gold architectural accent lighting, precision calibrated barbells, subtle geometric kinetic laser mesh projected across the floor, 4K hyperrealism, cinematic chiaroscuro.'
  }

  const data = await res.json()
  const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  return candidate || 'A cinematic slow-motion tracking shot gliding through an ultra-luxury private sports science biomechanics laboratory. Matte obsidian walls, warm champagne gold architectural accent lighting, precision calibrated barbells, subtle geometric kinetic laser mesh projected across the floor, 4K hyperrealism, cinematic chiaroscuro.'
}

async function renderVideoWithGeminiOmni(apiKey, prompt) {
  console.log(`Rendering 10s video with gemini-omni-1.1-flash...`)
  console.log(`Prompt: "${prompt}"`)

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/interactions?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemini-omni-1.1-flash',
      input: prompt
    })
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini Omni Flash error (${res.status}): ${errText}`)
  }

  const data = await res.json()
  const step = data.steps?.find(s => s.type === 'model_output' && s.content?.[0]?.data)
  if (!step || !step.content[0].data) {
    throw new Error('Video generation completed but no video payload was found in response steps.')
  }

  return Buffer.from(step.content[0].data, 'base64')
}

async function main() {
  const apiKey = loadApiKey()
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY is not set in environment or .env.local')
    process.exit(1)
  }

  try {
    const prompt = await generateDirectorPromptWithGeminiPro(apiKey)
    const videoBuffer = await renderVideoWithGeminiOmni(apiKey, prompt)

    const outDir = path.join(ROOT, 'public', 'videos')
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

    const outPath = path.join(outDir, 'gaa-founding-manifesto.mp4')
    writeFileSync(outPath, videoBuffer)

    console.log(`Success! Video saved to: ${outPath} (${(videoBuffer.length / (1024 * 1024)).toFixed(2)} MB)`)
  } catch (err) {
    console.error('Failed to generate video:', err)
    process.exit(1)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}

