#!/usr/bin/env node
/**
 * Forge Athletic — Static ElevenLabs Coach Gordon Cue Generator (`npm run voice:seed`)
 *
 * Reads `public/audio/coach-gordon/manifest.json` and renders all 9 zero-latency `.mp3`
 * audio cues via ElevenLabs (`eleven_turbo_v2_5`) into `public/audio/coach-gordon/`.
 *
 * Usage:
 *   npm run voice:seed
 *   npm run voice:seed -- --force
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const audioDir = path.join(repoRoot, 'public', 'audio', 'coach-gordon')
const manifestPath = path.join(audioDir, 'manifest.json')

const apiKey = (process.env.ELEVENLABS_API_KEY || '').trim()
const voiceId = (
  process.env.COACH_GORDON_VOICE_ID ||
  process.env.COACH_GORDON_ELEVENLABS_VOICE_ID ||
  process.env.ELEVENLABS_VOICE_ID ||
  'UPezm4CtrvcD6aNXjeU1'
).trim()
const forceOverwrite = process.argv.includes('--force')

async function fileExistsNonEmpty(targetPath) {
  try {
    const stat = await fs.stat(targetPath)
    return stat.isFile() && stat.size > 256
  } catch {
    return false
  }
}

async function main() {
  if (!apiKey) {
    console.error(
      '[voice:seed] Missing ELEVENLABS_API_KEY in .env.local. Add ELEVENLABS_API_KEY and COACH_GORDON_VOICE_ID before generating static MP3 cues.'
    )
    process.exit(1)
  }

  const rawManifest = await fs.readFile(manifestPath, 'utf8')
  const manifest = JSON.parse(rawManifest)
  const modelId = manifest.modelId || 'eleven_turbo_v2_5'
  const outputFormat = manifest.outputFormat || 'mp3_44100_128'
  const voiceSettings = manifest.voiceSettings || {
    stability: 0.62,
    similarity_boost: 0.86,
    style: 0.18,
    use_speaker_boost: true,
  }

  const entries = Object.entries(manifest.cues || {})
  let generated = 0
  let skipped = 0

  for (const [cueKey, cueMeta] of entries) {
    const outPath = path.join(audioDir, cueMeta.filename)
    if (!forceOverwrite && (await fileExistsNonEmpty(outPath))) {
      console.log(`[voice:seed] Skipping existing cue: ${cueMeta.filename}`)
      skipped += 1
      continue
    }

    console.log(`[voice:seed] Synthesizing ${cueKey} -> ${cueMeta.filename} ...`)
    const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${encodeURIComponent(outputFormat)}`

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: cueMeta.script,
        model_id: modelId,
        voice_settings: voiceSettings,
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.error(
        `[voice:seed] Failed on ${cueKey} (HTTP ${res.status}):`,
        errText.slice(0, 240)
      )
      process.exit(1)
    }

    const bytes = new Uint8Array(await res.arrayBuffer())
    await fs.writeFile(outPath, bytes)
    generated += 1
  }

  console.log(
    `[voice:seed] Complete — generated ${generated} MP3 cue(s), skipped ${skipped} existing cue(s) in public/audio/coach-gordon/.`
  )
}

void main()
