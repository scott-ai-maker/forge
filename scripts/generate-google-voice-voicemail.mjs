#!/usr/bin/env node
/**
 * Forge Athletic — Google Voice Default Voicemail Greeting Generator
 *
 * Synthesizes Coach Gordon's authentic ElevenLabs cloned voice (UPezm4CtrvcD6aNXjeU1)
 * into broadcast-normalized MP3 and WAV voicemail greeting files for Google Voice.
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-google-voice-voicemail.mjs
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const COACH_GORDON_VOICE_ID =
  process.env.COACH_GORDON_ELEVENLABS_VOICE_ID ||
  process.env.ELEVENLABS_VOICE_ID ||
  'UPezm4CtrvcD6aNXjeU1'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY

if (!ELEVENLABS_API_KEY) {
  console.error('Error: ELEVENLABS_API_KEY is missing. Run with: node --env-file=.env.local scripts/generate-google-voice-voicemail.mjs')
  process.exit(1)
}

const OUTPUT_DIR = path.resolve(process.cwd(), 'public/audio/voicemail')

export const VOICEMAIL_GREETINGS = [
  {
    id: 'forge-athletic-voicemail-default',
    label: 'Default Full Greeting (Recommended)',
    script:
      "You've reached Coach Gordon at Forge Athletic. I'm currently on the training floor or in a client session and can't take your call right now. If you're a current athlete, please send any training or health updates through your secure Forge Athletic portal. Otherwise, leave your name, number, and a brief message after the tone, and I'll get back to you soon. You can also visit us anytime at forge-athletic.app. Stay locked in.",
  },
  {
    id: 'forge-athletic-voicemail-concise',
    label: 'Concise Executive Greeting',
    script:
      "You've reached Coach Gordon, Founder and Head Coach at Forge Athletic. I'm currently in a session and away from my desk. Please leave your name, phone number, and a brief message after the tone, or message me directly inside the Forge Athletic app, and I'll return your call as soon as I wrap up. Stay locked in.",
  },
]

async function synthesizeElevenLabsAudio(text, voiceId) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_192`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.58,
        similarity_boost: 0.80,
        style: 0.32,
        use_speaker_boost: true,
      },
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`ElevenLabs API returned ${response.status}: ${errText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function masterAudioFiles(rawMp3Path, baseName) {
  const finalMp3Path = path.join(OUTPUT_DIR, `${baseName}.mp3`)
  const finalWavPath = path.join(OUTPUT_DIR, `${baseName}.wav`)

  // Broadcast loudness normalization (-16 LUFS) + gentle 250ms silence pad at start & 400ms at end for clean telephony pickup
  const filterGraph = 'adelay=250|250,apad=pad_dur=0.4,loudnorm=I=-16:TP=-1.5:LRA=11'

  await execFileAsync('ffmpeg', [
    '-y',
    '-i',
    rawMp3Path,
    '-af',
    filterGraph,
    '-ar',
    '44100',
    '-ac',
    '1',
    '-b:a',
    '192k',
    finalMp3Path,
  ])

  await execFileAsync('ffmpeg', [
    '-y',
    '-i',
    rawMp3Path,
    '-af',
    filterGraph,
    '-ar',
    '44100',
    '-ac',
    '1',
    '-c:a',
    'pcm_s16le',
    finalWavPath,
  ])

  const { stdout } = await execFileAsync('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    finalMp3Path,
  ])

  const durationSec = Number.parseFloat(stdout.trim()).toFixed(1)
  return { finalMp3Path, finalWavPath, durationSec }
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  console.log(`🎙️  Generating Forge Athletic Google Voice Voicemail Greetings...`)
  console.log(`   Voice ID: ${COACH_GORDON_VOICE_ID} (Coach Gordon ElevenLabs Clone)\n`)

  for (const item of VOICEMAIL_GREETINGS) {
    console.log(`→ Synthesizing: ${item.label} (${item.id})...`)
    const rawBuffer = await synthesizeElevenLabsAudio(item.script, COACH_GORDON_VOICE_ID)
    const rawTmpPath = path.join(OUTPUT_DIR, `${item.id}.raw.mp3`)
    await fs.writeFile(rawTmpPath, rawBuffer)

    const { finalMp3Path, finalWavPath, durationSec } = await masterAudioFiles(rawTmpPath, item.id)
    await fs.unlink(rawTmpPath).catch(() => {})

    console.log(`  ✓ Duration: ${durationSec}s`)
    console.log(`  ✓ MP3: ${finalMp3Path}`)
    console.log(`  ✓ WAV: ${finalWavPath}\n`)
  }

  console.log('✅ Done! All Google Voice voicemail greetings are mastered and ready.')
}

main().catch((err) => {
  console.error('❌ Voicemail generation failed:', err)
  process.exit(1)
})
