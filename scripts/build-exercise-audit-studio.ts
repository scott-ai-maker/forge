import fs from 'fs'
import path from 'path'
import { getNasmClinicalMovementCard } from '../lib/nasm-clinical-movement-cards'
import { NASM_EDGE_OFFICIAL_CATALOG } from '../lib/nasm-exercise-video-catalog'
import { resolveGaaExerciseImage } from '../lib/nasm-generated-images'

interface ExerciseData {
  id: string
  name: string
  slug: string
  description: string | null
  primaryEquipment: string[]
  muscleGroups: string[]
  imageUrl: string | null
  videoId: string | null
  videoUrl: string | null
  videoThumbnailUrl: string | null
  candidatePhotoUrl: string | null
  hasCandidatePhoto: boolean
  ytTitle?: string
  ytAuthor?: string
  ytStatus?: string
  card?: any
  warnings: string[]
}

const libraryPath = path.resolve(process.cwd(), 'scripts/nasm-complete-library.json')
const rawExercises: any[] = JSON.parse(fs.readFileSync(libraryPath, 'utf8'))

console.log(`Loaded ${rawExercises.length} canonical exercises for audit studio generation...`)

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function resolveCandidatePhoto(ex: any): { url: string | null; exists: boolean } {
  const gaa = resolveGaaExerciseImage(ex.name)
  const baseSlug = ex.slug ? ex.slug.replace(/-\d{4}$/, '') : slugify(ex.name)
  const slugPath = `/images/exercises/${baseSlug}.jpg`
  const namePath = `/images/exercises/${slugify(ex.name)}.jpg`

  const candidates = [gaa, slugPath, namePath].filter(Boolean) as string[]
  for (const cand of candidates) {
    const diskPath = path.resolve(process.cwd(), 'public', cand.replace(/^\//, ''))
    if (fs.existsSync(diskPath)) {
      return { url: cand, exists: true }
    }
  }
  return { url: gaa || slugPath, exists: false }
}

// Function to fetch YouTube oEmbed title
async function fetchOembed(videoId: string): Promise<{ title?: string; author?: string; status: string }> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, {
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (res.ok) {
      const data = await res.json()
      return { title: data.title, author: data.author_name, status: 'OK' }
    }
    return { status: `HTTP_${res.status}` }
  } catch (err: any) {
    return { status: err.name === 'AbortError' ? 'TIMEOUT' : 'ERROR' }
  }
}

// Check heuristic warnings
function analyzeWarnings(ex: ExerciseData, ytTitle?: string): string[] {
  const warnings: string[] = []
  const nameLower = ex.name.toLowerCase()
  const descLower = (ex.description || '').toLowerCase()
  const ytLower = (ytTitle || '').toLowerCase()

  // 1. YouTube Title Discrepancy
  if (ytTitle) {
    if (nameLower.includes('single leg') || nameLower.includes('single-leg')) {
      if (!ytLower.includes('single leg') && !ytLower.includes('single-leg') && !ytLower.includes('one leg')) {
        warnings.push(`Video title "${ytTitle}" does not mention Single-Leg. Possible bilateral fallback.`)
      }
    }
    if (nameLower.includes('single arm') || nameLower.includes('single-arm')) {
      if (!ytLower.includes('single arm') && !ytLower.includes('single-arm') && !ytLower.includes('one arm')) {
        warnings.push(`Video title "${ytTitle}" does not mention Single-Arm. Possible bilateral fallback.`)
      }
    }
    if (nameLower.includes('scaption') && !ytLower.includes('scaption')) {
      warnings.push(`Video title "${ytTitle}" does not mention Scaption.`)
    }
    if (nameLower.includes('incline') && !ytLower.includes('incline')) {
      warnings.push(`Video title "${ytTitle}" does not mention Incline.`)
    }
    if (nameLower.includes('decline') && !ytLower.includes('decline')) {
      warnings.push(`Video title "${ytTitle}" does not mention Decline.`)
    }
  }

  // 2. Unilateral description cue check
  if (nameLower.includes('single leg') || nameLower.includes('single-leg')) {
    if (!descLower.includes('single leg') && !descLower.includes('one leg') && !descLower.includes('lift') && !descLower.includes('balance on')) {
      warnings.push(`Instructions omit single-leg stance cue.`)
    }
  }

  // 3. Candidate photo existence check
  if (ex.candidatePhotoUrl) {
    const localImg = path.resolve(process.cwd(), 'public', ex.candidatePhotoUrl.replace(/^\//, ''))
    if (!fs.existsSync(localImg)) {
      warnings.push(`Candidate photo file ${ex.candidatePhotoUrl} not found on disk.`)
    }
  }

  return warnings
}

async function build() {
  const exercises: ExerciseData[] = rawExercises.map(ex => {
    const candidate = resolveCandidatePhoto(ex)
    const videoThumbnail = ex.videoId ? `https://img.youtube.com/vi/${ex.videoId}/hqdefault.jpg` : null
    return {
      ...ex,
      // DEFAULT ACTIVE IMAGE: Authentic NASM Edge Video Thumbnail
      imageUrl: videoThumbnail,
      videoThumbnailUrl: videoThumbnail,
      candidatePhotoUrl: candidate.url,
      hasCandidatePhoto: candidate.exists,
      warnings: [],
    }
  })

  console.log(`Auditing YouTube oEmbed metadata for ${exercises.length} exercises...`)
  const concurrency = 10
  for (let i = 0; i < exercises.length; i += concurrency) {
    const batch = exercises.slice(i, i + concurrency)
    await Promise.all(
      batch.map(async (ex) => {
        const officialVideoId = NASM_EDGE_OFFICIAL_CATALOG[ex.name.toLowerCase().trim()] || ex.videoId
        if (officialVideoId) {
          const info = await fetchOembed(officialVideoId)
          ex.ytTitle = info.title
          ex.ytAuthor = info.author
          ex.ytStatus = info.status
        }
        // Attach clinical movement card
        const card = getNasmClinicalMovementCard(ex.name)
        if (card) {
          ex.card = {
            category: card.category,
            phase: card.optPhase,
            primeMover: card.primeMover,
            kineticCheckpoints: card.kineticCheckpoints,
            clinicalCues: card.clinicalCues,
            howToSteps: card.howToSteps,
          }
        }
        ex.warnings = analyzeWarnings(ex, ex.ytTitle)
      })
    )
    process.stdout.write(`\rProgress: ${Math.min(i + concurrency, exercises.length)}/${exercises.length} checked...`)
  }
  console.log('\nAll metadata gathered.')

  const warningCount = exercises.filter(e => e.warnings.length > 0).length
  console.log(`Found ${warningCount} exercises with automatic heuristic warnings.`)

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Forge Athletic — Master Exercise Library Visual Audit Studio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #080C14;
      --card-bg: #101726;
      --card-border: #1E293B;
      --card-hover: #26334D;
      --accent-cyan: #06B6D4;
      --accent-indigo: #6366F1;
      --accent-emerald: #10B981;
      --accent-amber: #F59E0B;
      --accent-rose: #F43F5E;
      --text-main: #F8FAFC;
      --text-muted: #94A3B8;
      --text-dim: #64748B;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg-dark);
      color: var(--text-main);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: rgba(16, 23, 38, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--card-border);
      position: sticky;
      top: 0;
      z-index: 100;
      padding: 16px 24px;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .brand-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-title h1 {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #FFFFFF, #94A3B8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 9999px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: #A5B4FC;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stats-bar {
      display: flex;
      gap: 12px;
      font-size: 0.8rem;
      flex-wrap: wrap;
    }
    .stat-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 8px;
      background: #172033;
      border: 1px solid var(--card-border);
    }
    .stat-pill strong { font-weight: 800; color: #fff; }
    .stat-pill.baseline strong { color: var(--accent-cyan); }
    .stat-pill.approved strong { color: var(--accent-emerald); }
    .stat-pill.kept strong { color: #818CF8; }
    .stat-pill.flagged strong { color: var(--accent-rose); }
    .stat-pill.warnings strong { color: var(--accent-amber); }

    .header-controls {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
    }
    .search-box {
      flex: 1;
      min-width: 260px;
      position: relative;
    }
    .search-box input {
      width: 100%;
      background: #0B111E;
      border: 1px solid var(--card-border);
      color: #fff;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.85rem;
      outline: none;
      transition: border-color 0.15s;
    }
    .search-box input:focus {
      border-color: var(--accent-cyan);
    }
    select, button {
      background: #0B111E;
      border: 1px solid var(--card-border);
      color: var(--text-main);
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      outline: none;
      transition: all 0.15s;
    }
    select:focus, button:hover {
      border-color: var(--accent-cyan);
    }
    button.btn-primary {
      background: linear-gradient(135deg, #0284C7, #2563EB);
      border: none;
      color: #fff;
    }
    button.btn-primary:hover {
      opacity: 0.9;
    }
    button.btn-export {
      background: #1E293B;
      border: 1px solid var(--card-border);
    }
    button.btn-toggle-all {
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: #C7D2FE;
    }
    button.btn-toggle-all:hover {
      background: rgba(99, 102, 241, 0.3);
    }

    main {
      flex: 1;
      padding: 24px;
      max-width: 1680px;
      margin: 0 auto;
      width: 100%;
    }
    .keyboard-hint {
      display: flex;
      gap: 16px;
      font-size: 0.75rem;
      color: var(--text-dim);
      margin-bottom: 20px;
      font-family: 'JetBrains Mono', monospace;
      flex-wrap: wrap;
    }
    .keyboard-hint kbd {
      background: #1E293B;
      color: #E2E8F0;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #334155;
    }

    .exercise-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      margin-bottom: 24px;
      overflow: hidden;
      display: grid;
      grid-template-columns: 400px 420px 1fr;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .exercise-card:hover {
      border-color: var(--card-hover);
    }
    .exercise-card.is-approved-photo {
      border-left: 4px solid var(--accent-emerald);
    }
    .exercise-card.is-kept-video {
      border-left: 4px solid var(--accent-cyan);
    }
    .exercise-card.is-flagged {
      border-left: 4px solid var(--accent-rose);
      background: rgba(244, 63, 94, 0.03);
    }
    .exercise-card.has-warning {
      border-top: 2px solid var(--accent-amber);
    }

    /* Col 1: Image Asset */
    .media-col {
      padding: 20px;
      border-right: 1px solid var(--card-border);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .media-title-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .media-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .source-tag {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.02em;
    }
    .source-tag.video {
      background: rgba(6, 182, 212, 0.15);
      border: 1px solid rgba(6, 182, 212, 0.3);
      color: #67E8F9;
    }
    .source-tag.photo {
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: #A5B4FC;
    }

    .image-mode-toggle {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      background: #080C14;
      padding: 3px;
      border-radius: 6px;
      border: 1px solid var(--card-border);
    }
    .mode-pill {
      background: transparent;
      border: none;
      color: var(--text-dim);
      font-size: 0.72rem;
      font-weight: 700;
      padding: 6px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .mode-pill:hover:not(.disabled) {
      color: #fff;
    }
    .mode-pill.active {
      background: #1E293B;
      color: var(--accent-cyan);
    }
    .mode-pill.disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    .image-preview-container {
      width: 100%;
      height: 240px;
      background: #080C14;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--card-border);
      position: relative;
    }
    .image-preview-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      cursor: zoom-in;
      transition: transform 0.2s;
    }
    .image-preview-container img:hover {
      transform: scale(1.02);
    }
    .inspect-hint {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(8, 12, 20, 0.85);
      backdrop-filter: blur(4px);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: 600;
      color: var(--text-muted);
      pointer-events: none;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .image-meta-details {
      background: #0A101D;
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.7rem;
    }
    .meta-row {
      display: flex;
      gap: 6px;
      align-items: baseline;
      word-break: break-all;
    }
    .meta-label {
      color: var(--text-dim);
      font-weight: 700;
      min-width: 65px;
    }
    .meta-val {
      color: #CBD5E1;
      font-family: 'JetBrains Mono', monospace;
    }

    /* Col 2: Video */
    .video-col {
      padding: 20px;
      border-right: 1px solid var(--card-border);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .video-frame-container {
      width: 100%;
      height: 240px;
      background: #000;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--card-border);
    }
    .video-frame-container iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    .yt-meta-badge {
      background: #0A101D;
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 0.75rem;
    }
    .yt-title-row {
      font-weight: 700;
      color: #E2E8F0;
      margin-bottom: 2px;
      line-height: 1.3;
    }
    .yt-author-row {
      color: var(--accent-cyan);
      font-size: 0.7rem;
    }

    /* Col 3: Details & Action Controls */
    .details-col {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .exercise-header {
      margin-bottom: 12px;
    }
    .exercise-name {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.01em;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .tags-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 6px;
    }
    .tag {
      font-size: 0.7rem;
      padding: 3px 8px;
      border-radius: 4px;
      background: #1E293B;
      color: #CBD5E1;
      font-weight: 600;
    }
    .tag.prime-mover {
      background: rgba(99, 102, 241, 0.15);
      color: #C7D2FE;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    .tag.equipment {
      background: rgba(6, 182, 212, 0.15);
      color: #A5F3FC;
      border: 1px solid rgba(6, 182, 212, 0.3);
    }

    .warning-alert {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #FCD34D;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 0.78rem;
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .warning-item {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      line-height: 1.3;
    }

    .steps-container {
      background: #080C14;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 12px 16px;
      max-height: 200px;
      overflow-y: auto;
      font-size: 0.82rem;
      line-height: 1.5;
      color: #CBD5E1;
      margin-bottom: 12px;
    }
    .step-item {
      margin-bottom: 8px;
    }
    .step-item:last-child {
      margin-bottom: 0;
    }
    .step-label {
      font-weight: 700;
      color: var(--accent-cyan);
    }

    .checkpoints-box {
      background: #0B111E;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 0.75rem;
      color: var(--text-muted);
      line-height: 1.4;
      border: 1px dashed var(--card-border);
      margin-bottom: 16px;
    }

    .action-panel {
      display: flex;
      align-items: center;
      gap: 10px;
      border-top: 1px solid var(--card-border);
      padding-top: 16px;
      flex-wrap: wrap;
    }
    .btn-action {
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-action.btn-keep-video {
      background: rgba(6, 182, 212, 0.12);
      border: 1px solid rgba(6, 182, 212, 0.4);
      color: #67E8F9;
    }
    .btn-action.btn-keep-video:hover, .btn-action.btn-keep-video.active {
      background: var(--accent-cyan);
      color: #080C14;
      border-color: var(--accent-cyan);
    }
    .btn-action.btn-approve {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34D399;
    }
    .btn-action.btn-approve:hover, .btn-action.btn-approve.active {
      background: var(--accent-emerald);
      color: #fff;
      border-color: var(--accent-emerald);
    }
    .btn-action.btn-flag {
      background: rgba(244, 63, 94, 0.12);
      border: 1px solid rgba(244, 63, 94, 0.4);
      color: #FB7185;
    }
    .btn-action.btn-flag:hover, .btn-action.btn-flag.active {
      background: var(--accent-rose);
      color: #fff;
      border-color: var(--accent-rose);
    }
    .notes-input {
      flex: 1;
      min-width: 220px;
      background: #080C14;
      border: 1px solid var(--card-border);
      color: #F8FAFC;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      outline: none;
    }
    .notes-input:focus {
      border-color: var(--accent-cyan);
    }

    /* Lightbox modal */
    .lightbox {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.92);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      cursor: zoom-out;
      flex-direction: column;
      gap: 12px;
      padding: 24px;
    }
    .lightbox.active { display: flex; }
    .lightbox img {
      max-width: 90vw;
      max-height: 85vh;
      border-radius: 8px;
      border: 1px solid #334155;
      object-fit: contain;
    }
    .lightbox-caption {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: #94A3B8;
      background: rgba(16, 23, 38, 0.8);
      padding: 6px 14px;
      border-radius: 6px;
    }

    @media (max-width: 1200px) {
      .exercise-card {
        grid-template-columns: 1fr;
      }
      .media-col, .video-col {
        border-right: none;
        border-bottom: 1px solid var(--card-border);
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="header-top">
      <div class="brand-title">
        <h1>Forge Athletic — Master Exercise Library Audit Studio</h1>
        <span class="brand-badge">273 Canonical Movements</span>
      </div>
      <div class="stats-bar">
        <div class="stat-pill baseline">Default Baseline: <strong id="stat-baseline">273 Video Frames</strong></div>
        <div class="stat-pill kept">Keep Video: <strong id="stat-kept">0</strong></div>
        <div class="stat-pill approved">Photos Approved: <strong id="stat-approved">0</strong></div>
        <div class="stat-pill flagged">Flagged: <strong id="stat-flagged">0</strong></div>
        <div class="stat-pill warnings">Warnings: <strong id="stat-warnings">${warningCount}</strong></div>
      </div>
    </div>
    <div class="header-controls">
      <div class="search-box">
        <input type="text" id="search-input" placeholder="Search exercises, equipment, muscles, or YouTube titles..." autofocus>
      </div>
      <select id="filter-status">
        <option value="all">All Movements (273)</option>
        <option value="unreviewed">Unreviewed / In Progress</option>
        <option value="kept-video">Keep Video Default</option>
        <option value="approved-photo">Approved Studio Photo</option>
        <option value="flagged">Flagged Issues / Needs Reshoot</option>
        <option value="warnings">Heuristic Warnings (${warningCount})</option>
      </select>
      <select id="filter-category">
        <option value="all">All Categories</option>
        <option value="chest">Chest</option>
        <option value="back">Back</option>
        <option value="shoulders">Shoulders</option>
        <option value="legs">Legs / Glutes</option>
        <option value="arms">Arms / Biceps / Triceps</option>
        <option value="core">Core / Abdominals</option>
        <option value="balance">Balance / Stabilization</option>
        <option value="stretch">Flexibility / SMR / Stretch</option>
      </select>
      <button class="btn-toggle-all" id="btn-toggle-all" title="Toggle between Video Frame and Candidate Photo for all visible cards">
        Toggle All to Photos
      </button>
      <button class="btn-export" id="btn-export">Export Decisions (JSON)</button>
      <button class="btn-primary" id="btn-save">Save Progress</button>
    </div>
  </header>

  <main>
    <div class="keyboard-hint">
      <span>Shortcuts:</span>
      <span><kbd>V</kbd> Keep Video Default</span>
      <span><kbd>A</kbd> Approve Studio Photo</span>
      <span><kbd>F</kbd> Flag Issue</span>
      <span><kbd>T</kbd> Toggle Photo/Video</span>
      <span><kbd>J</kbd> / <kbd>K</kbd> Next/Prev</span>
      <span><kbd>/</kbd> Search</span>
    </div>

    <div id="exercise-list">
      <!-- Injected by JavaScript -->
    </div>
  </main>

  <div class="lightbox" id="lightbox" onclick="this.classList.remove('active')">
    <img id="lightbox-img" src="" alt="Enlarged Asset View">
    <div class="lightbox-caption" id="lightbox-caption"></div>
  </div>

  <script>
    const EXERCISES = ${JSON.stringify(exercises)};
    const STORAGE_KEY = 'forge_exercise_audit_state_v2';
    // Migrate from v1 if present
    const legacyState = JSON.parse(localStorage.getItem('forge_exercise_audit_state_v1') || '{}');
    let auditState = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    
    // Seed legacy state if v2 is empty
    if (Object.keys(auditState).length === 0 && Object.keys(legacyState).length > 0) {
      for (const [k, v] of Object.entries(legacyState)) {
        auditState[k] = {
          status: v.status === 'APPROVED' ? 'APPROVE_PHOTO' : v.status,
          notes: v.notes || '',
        };
      }
    }

    // Active image view mode per card ('video' or 'photo')
    const viewModes = {};
    let globalMode = 'video';

    function saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auditState));
      updateStats();
    }

    function updateStats() {
      let approved = 0;
      let kept = 0;
      let flagged = 0;
      for (const ex of EXERCISES) {
        const s = auditState[ex.name]?.status;
        if (s === 'APPROVE_PHOTO' || s === 'APPROVED') approved++;
        else if (s === 'KEEP_VIDEO') kept++;
        else if (s === 'FLAGGED') flagged++;
      }
      document.getElementById('stat-approved').textContent = approved;
      document.getElementById('stat-kept').textContent = kept;
      document.getElementById('stat-flagged').textContent = flagged;
    }

    function formatImageSrc(url) {
      if (!url) return './images/brand-logo.png';
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      if (url.startsWith('/')) return '.' + url;
      return './' + url;
    }

    function handleImageError(img, videoId) {
      if (!img.dataset.triedFallback && videoId) {
        img.dataset.triedFallback = '1';
        img.src = 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg';
      } else if (!img.dataset.triedBrand) {
        img.dataset.triedBrand = '1';
        img.src = './images/brand-logo.png';
      }
    }

    function renderExercises() {
      const query = document.getElementById('search-input').value.toLowerCase().trim();
      const statusFilter = document.getElementById('filter-status').value;
      const catFilter = document.getElementById('filter-category').value;
      const container = document.getElementById('exercise-list');

      const filtered = EXERCISES.filter(ex => {
        // Text match
        if (query) {
          const nameM = ex.name.toLowerCase().includes(query);
          const eqM = (ex.primaryEquipment || []).some(eq => eq.toLowerCase().includes(query));
          const mgM = (ex.muscleGroups || []).some(mg => mg.toLowerCase().includes(query));
          const ytM = (ex.ytTitle || '').toLowerCase().includes(query);
          const notesM = (auditState[ex.name]?.notes || '').toLowerCase().includes(query);
          if (!nameM && !eqM && !mgM && !ytM && !notesM) return false;
        }

        // Status match
        const state = auditState[ex.name] || {};
        const st = state.status || 'UNREVIEWED';
        if (statusFilter === 'unreviewed') {
          if (st === 'APPROVE_PHOTO' || st === 'APPROVED' || st === 'KEEP_VIDEO' || st === 'FLAGGED') return false;
        } else if (statusFilter === 'approved-photo') {
          if (st !== 'APPROVE_PHOTO' && st !== 'APPROVED') return false;
        } else if (statusFilter === 'kept-video') {
          if (st !== 'KEEP_VIDEO') return false;
        } else if (statusFilter === 'flagged') {
          if (st !== 'FLAGGED') return false;
        } else if (statusFilter === 'warnings') {
          if (!ex.warnings || ex.warnings.length === 0) return false;
        }

        // Category match
        if (catFilter !== 'all') {
          const cardCat = (ex.card?.category || '').toLowerCase();
          const mus = (ex.muscleGroups || []).join(' ').toLowerCase();
          if (catFilter === 'chest' && !cardCat.includes('chest') && !mus.includes('chest') && !mus.includes('pector')) return false;
          if (catFilter === 'back' && !cardCat.includes('back') && !mus.includes('back') && !mus.includes('lat')) return false;
          if (catFilter === 'shoulders' && !cardCat.includes('shoulder') && !mus.includes('shoulder') && !mus.includes('deltoid')) return false;
          if (catFilter === 'legs' && !cardCat.includes('leg') && !mus.includes('leg') && !mus.includes('glute') && !mus.includes('quad') && !mus.includes('hamstring') && !mus.includes('calf')) return false;
          if (catFilter === 'arms' && !cardCat.includes('arm') && !mus.includes('bicep') && !mus.includes('tricep')) return false;
          if (catFilter === 'core' && !cardCat.includes('core') && !mus.includes('abdom') && !mus.includes('core')) return false;
          if (catFilter === 'balance' && !cardCat.includes('stabil') && !ex.name.toLowerCase().includes('balance') && !ex.name.toLowerCase().includes('stabil')) return false;
          if (catFilter === 'stretch' && !cardCat.includes('flexibility') && !cardCat.includes('smr') && !ex.name.toLowerCase().includes('smr') && !ex.name.toLowerCase().includes('stretch') && !ex.name.toLowerCase().includes('roll')) return false;
        }

        return true;
      });

      if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:60px; color:#64748B;">No exercises match the selected filters.</div>';
        return;
      }

      container.innerHTML = filtered.map((ex, idx) => {
        const state = auditState[ex.name] || {};
        const isApprovedPhoto = state.status === 'APPROVE_PHOTO' || state.status === 'APPROVED';
        const isKeptVideo = state.status === 'KEEP_VIDEO';
        const isFlagged = state.status === 'FLAGGED';
        const hasWarning = ex.warnings && ex.warnings.length > 0;
        const notes = state.notes || '';

        const mode = viewModes[ex.name] || 'video';
        const isPhotoActive = mode === 'photo';

        const steps = ex.card?.howToSteps || (ex.description ? ex.description.split('\\n\\n') : []);
        const checkpoints = ex.card?.kineticCheckpoints || {};

        const currentImgSrc = isPhotoActive ? formatImageSrc(ex.candidatePhotoUrl) : formatImageSrc(ex.videoThumbnailUrl);

        return \`
          <div class="exercise-card \${isApprovedPhoto ? 'is-approved-photo' : ''} \${isKeptVideo ? 'is-kept-video' : ''} \${isFlagged ? 'is-flagged' : ''} \${hasWarning ? 'has-warning' : ''}" data-name="\${encodeURIComponent(ex.name)}" id="card-\${idx}">
            <!-- Col 1: Image Asset -->
            <div class="media-col">
              <div class="media-title-bar">
                <div class="media-title">1. Image Asset</div>
                <span class="source-tag \${isPhotoActive ? 'photo' : 'video'}" id="source-tag-\${idx}">
                  \${isPhotoActive ? '📸 Candidate Studio Photo' : '🎬 NASM Video Default'}
                </span>
              </div>

              <div class="image-mode-toggle">
                <button class="mode-pill \${!isPhotoActive ? 'active' : ''}" id="btn-mode-video-\${idx}" onclick="switchCardMode('\${encodeURIComponent(ex.name)}', 'video', \${idx})">
                  🎬 Video Default
                </button>
                <button class="mode-pill \${isPhotoActive ? 'active' : ''} \${ex.hasCandidatePhoto ? '' : 'disabled'}" id="btn-mode-photo-\${idx}" onclick="switchCardMode('\${encodeURIComponent(ex.name)}', 'photo', \${idx})" \${ex.hasCandidatePhoto ? '' : 'disabled'}>
                  📸 Candidate Photo
                </button>
              </div>

              <div class="image-preview-container">
                <img id="img-\${idx}" 
                     src="\${currentImgSrc}" 
                     data-video-src="\${formatImageSrc(ex.videoThumbnailUrl)}" 
                     data-photo-src="\${formatImageSrc(ex.candidatePhotoUrl)}" 
                     alt="\${ex.name}" 
                     onclick="openLightbox(this.src, '\${ex.name} — ' + (viewModes['\${ex.name}'] === 'photo' ? 'Candidate Studio Photo' : 'Default NASM Video Image'))" 
                     onerror="handleImageError(this, '\${ex.videoId || ''}')" 
                     loading="lazy">
                <div class="inspect-hint">🔍 Click to Zoom</div>
              </div>

              <div class="image-meta-details">
                <div class="meta-row">
                  <span class="meta-label">Active:</span>
                  <span class="meta-val" id="active-path-\${idx}">\${isPhotoActive ? ex.candidatePhotoUrl : ex.videoThumbnailUrl}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Candidate:</span>
                  <span class="meta-val" style="color: \${ex.hasCandidatePhoto ? '#34D399' : '#F43F5E'}">\${ex.candidatePhotoUrl || 'Missing file'}</span>
                </div>
              </div>
            </div>

            <!-- Col 2: YouTube Video -->
            <div class="video-col">
              <div class="media-title">2. NASM Edge Video Demonstration</div>
              <div class="video-frame-container">
                \${ex.videoId ? \`
                  <iframe src="https://www.youtube.com/embed/\${ex.videoId}?rel=0&modestbranding=1" allowfullscreen loading="lazy"></iframe>
                \` : '<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#64748B;">No video ID available</div>'}
              </div>
              <div class="yt-meta-badge">
                <div class="yt-title-row">\${ex.ytTitle || 'YouTube Title Unavailable'}</div>
                <div class="yt-author-row">Channel: \${ex.ytAuthor || 'National Academy of Sports Medicine (NASM)'} • ID: \${ex.videoId || 'N/A'}</div>
              </div>
            </div>

            <!-- Col 3: Details & Cues -->
            <div class="details-col">
              <div>
                <div class="exercise-header">
                  <div class="exercise-name">
                    \${ex.name}
                  </div>
                  <div class="tags-row">
                    \${ex.card?.phase ? \`<span class=\"tag\" style=\"background:rgba(16, 185, 129, 0.15); color:#6EE7B7; border:1px solid rgba(16, 185, 129, 0.3);\">\${ex.card.phase}</span>\` : ''}
                    \${ex.card?.primeMover ? \`<span class=\"tag prime-mover\">Prime: \${ex.card.primeMover}</span>\` : ''}
                    \${(ex.primaryEquipment || []).map(eq => \`<span class=\"tag equipment\">\${eq}</span>\`).join('')}
                    \${(ex.muscleGroups || []).map(mg => \`<span class=\"tag\">\${mg}</span>\`).join('')}
                  </div>
                </div>

                \${hasWarning ? \`
                  <div class="warning-alert">
                    \${ex.warnings.map(w => \`<div class="warning-item">⚠️ \${w}</div>\`).join('')}
                  </div>
                \` : ''}

                <div class="steps-container">
                  \${steps.length > 0 ? steps.map((s, sIdx) => \`
                    <div class="step-item">
                      <span class="step-label">Step \${sIdx + 1}:</span> \${s.replace(/^Step\\s*\\d+:\\s*/i, '')}
                    </div>
                  \`).join('') : '<div style="color:#64748B;">No steps available.</div>'}
                </div>

                \${checkpoints && typeof checkpoints === 'object' && Object.keys(checkpoints).length > 0 ? \`
                  <div class="checkpoints-box">
                    <strong>Kinetic Checkpoints:</strong> \${Object.entries(checkpoints).map(([k, v]) => \`<strong>\${k}:</strong> \${v}\`).join(' • ')}
                  </div>
                \` : ''}
              </div>

              <div class="action-panel">
                <button class="btn-action btn-keep-video \${isKeptVideo ? 'active' : ''}" onclick="toggleStatus('\${encodeURIComponent(ex.name)}', 'KEEP_VIDEO')" title="Confirm this movement keeps the official NASM Edge video thumbnail">
                  🎬 Keep Video Default
                </button>
                <button class="btn-action btn-approve \${isApprovedPhoto ? 'active' : ''}" onclick="toggleStatus('\${encodeURIComponent(ex.name)}', 'APPROVE_PHOTO')" title="Approve candidate studio photo to replace video thumbnail">
                  ✓ Approve Studio Photo
                </button>
                <button class="btn-action btn-flag \${isFlagged ? 'active' : ''}" onclick="toggleStatus('\${encodeURIComponent(ex.name)}', 'FLAGGED')" title="Flag defect (e.g. incorrect form, attire violation, needs reshoot)">
                  ⚠️ Flag Issue
                </button>
                <input type="text" class="notes-input" placeholder="Coach notes (e.g., shirts standard, elbow flare, incorrect grip, reshoot)..." value="\${notes}" onchange="updateNotes('\${encodeURIComponent(ex.name)}', this.value)">
              </div>
            </div>
          </div>
        \`;
      }).join('');
    }

    function switchCardMode(encodedName, mode, idx) {
      const name = decodeURIComponent(encodedName);
      viewModes[name] = mode;
      const img = document.getElementById(\`img-\${idx}\`);
      const btnVideo = document.getElementById(\`btn-mode-video-\${idx}\`);
      const btnPhoto = document.getElementById(\`btn-mode-photo-\${idx}\`);
      const tag = document.getElementById(\`source-tag-\${idx}\`);
      const pathVal = document.getElementById(\`active-path-\${idx}\`);

      if (mode === 'photo') {
        img.src = img.dataset.photoSrc;
        btnPhoto.classList.add('active');
        btnVideo.classList.remove('active');
        tag.textContent = '📸 Candidate Studio Photo';
        tag.className = 'source-tag photo';
        pathVal.textContent = img.dataset.photoSrc;
      } else {
        img.src = img.dataset.videoSrc;
        btnVideo.classList.add('active');
        btnPhoto.classList.remove('active');
        tag.textContent = '🎬 NASM Video Default';
        tag.className = 'source-tag video';
        pathVal.textContent = img.dataset.videoSrc;
      }
    }

    function toggleStatus(encodedName, status) {
      const name = decodeURIComponent(encodedName);
      if (!auditState[name]) auditState[name] = {};
      auditState[name].status = auditState[name].status === status ? 'UNREVIEWED' : status;
      saveState();
      renderExercises();
    }

    function updateNotes(encodedName, notes) {
      const name = decodeURIComponent(encodedName);
      if (!auditState[name]) auditState[name] = {};
      auditState[name].notes = notes;
      saveState();
    }

    function openLightbox(src, caption) {
      const lb = document.getElementById('lightbox');
      const img = document.getElementById('lightbox-img');
      const cap = document.getElementById('lightbox-caption');
      img.src = src;
      cap.textContent = caption || '';
      lb.classList.add('active');
    }

    // Toggle all visible cards between Video Default and Candidate Photo
    document.getElementById('btn-toggle-all').addEventListener('click', () => {
      globalMode = globalMode === 'video' ? 'photo' : 'video';
      for (const ex of EXERCISES) {
        viewModes[ex.name] = globalMode;
      }
      document.getElementById('btn-toggle-all').textContent = globalMode === 'video' ? 'Toggle All to Photos' : 'Toggle All to Videos';
      renderExercises();
    });

    // Export decisions JSON
    document.getElementById('btn-export').addEventListener('click', () => {
      const results = {
        exportTimestamp: new Date().toISOString(),
        totalCanonicalExercises: EXERCISES.length,
        summary: {
          approvedStudioPhotos: 0,
          retainedVideoDefaults: 0,
          flaggedIssues: 0,
          unreviewed: 0,
        },
        decisions: [],
      };

      for (const ex of EXERCISES) {
        const state = auditState[ex.name] || {};
        const st = state.status || 'UNREVIEWED';
        if (st === 'APPROVE_PHOTO' || st === 'APPROVED') results.summary.approvedStudioPhotos++;
        else if (st === 'KEEP_VIDEO') results.summary.retainedVideoDefaults++;
        else if (st === 'FLAGGED') results.summary.flaggedIssues++;
        else results.summary.unreviewed++;

        results.decisions.push({
          name: ex.name,
          slug: ex.slug,
          status: st,
          activeImageBaseline: ex.videoThumbnailUrl,
          candidatePhotoUrl: ex.candidatePhotoUrl,
          hasCandidatePhoto: ex.hasCandidatePhoto,
          videoId: ex.videoId,
          videoTitle: ex.ytTitle,
          notes: state.notes || '',
          warnings: ex.warnings,
        });
      }

      const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`forge-exercise-audit-decisions-\${new Date().toISOString().slice(0, 10)}.json\`;
      a.click();
    });

    // Save button
    document.getElementById('btn-save').addEventListener('click', () => {
      saveState();
      alert('Audit decisions successfully saved!');
    });

    // Keyboard navigation
    let focusedIndex = 0;
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const cards = document.querySelectorAll('.exercise-card');
      if (cards.length === 0) return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        focusedIndex = Math.min(focusedIndex + 1, cards.length - 1);
        cards[focusedIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        focusedIndex = Math.max(focusedIndex - 1, 0);
        cards[focusedIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (e.key === 'v' || e.key === 'V') {
        const card = cards[focusedIndex];
        if (card) {
          const name = card.dataset.name;
          toggleStatus(name, 'KEEP_VIDEO');
        }
      } else if (e.key === 'a' || e.key === 'A') {
        const card = cards[focusedIndex];
        if (card) {
          const name = card.dataset.name;
          toggleStatus(name, 'APPROVE_PHOTO');
        }
      } else if (e.key === 'f' || e.key === 'F') {
        const card = cards[focusedIndex];
        if (card) {
          const name = card.dataset.name;
          toggleStatus(name, 'FLAGGED');
        }
      } else if (e.key === 't' || e.key === 'T') {
        const card = cards[focusedIndex];
        if (card) {
          const name = decodeURIComponent(card.dataset.name);
          const currentMode = viewModes[name] || 'video';
          switchCardMode(card.dataset.name, currentMode === 'video' ? 'photo' : 'video', focusedIndex);
        }
      } else if (e.key === '/') {
        e.preventDefault();
        document.getElementById('search-input').focus();
      }
    });

    // Event listeners for filters
    document.getElementById('search-input').addEventListener('input', renderExercises);
    document.getElementById('filter-status').addEventListener('change', renderExercises);
    document.getElementById('filter-category').addEventListener('change', renderExercises);

    // Initial render
    updateStats();
    renderExercises();
  </script>
</body>
</html>
`

  const outputPath = path.resolve(process.cwd(), 'public/exercise-audit.html')
  fs.writeFileSync(outputPath, htmlContent)
  console.log(`\n🎉 Visual Audit Studio successfully generated at ${outputPath}`)
}

build().catch(console.error)
