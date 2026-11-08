#!/usr/bin/env node
/**
 * Forge Athletic — Google Voice Direct Digital Audio Router (Zero-Loss WebAudio Stream)
 *
 * Embeds `forge-athletic-voicemail-default.mp3` into a self-contained browser snippet
 * that hooks `navigator.mediaDevices.getUserMedia` on https://voice.google.com,
 * streams Coach Gordon's voicemail directly into Google Voice's recorder with zero
 * acoustic loss or background noise, and auto-stops recording when finished.
 *
 * Uses pure DOM APIs (no innerHTML) to comply with Google Voice's TrustedTypes CSP.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'

const MP3_PATH = path.resolve(process.cwd(), 'public/audio/voicemail/forge-athletic-voicemail-default.mp3')
const OUT_JS_PATH = path.resolve(process.cwd(), 'public/audio/voicemail/google-voice-direct-router.js')

async function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    const proc = spawn('pbcopy')
    proc.on('error', reject)
    proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`pbcopy exited with ${code}`))))
    proc.stdin.write(text)
    proc.stdin.end()
  })
}

async function main() {
  const mp3Buffer = await fs.readFile(MP3_PATH)
  const base64Audio = mp3Buffer.toString('base64')

  const snippet = `(() => {
  const BASE64_MP3 = "${base64Audio}";

  const existing = document.getElementById("forge-gv-router");
  if (existing) existing.remove();

  const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
  const dest = ctx.createMediaStreamDestination();

  // Keep-alive sub-audible source so MediaRecorder/WebRTC never drops silent frames
  const keepAliveOsc = ctx.createOscillator();
  const keepAliveGain = ctx.createGain();
  keepAliveGain.gain.value = 0.00001;
  keepAliveOsc.connect(keepAliveGain);
  keepAliveGain.connect(dest);
  keepAliveOsc.start();

  let decodedBuffer = null;
  let activeSource = null;

  // UI HUD on Google Voice page (TrustedTypes-safe: zero innerHTML)
  const panel = document.createElement("div");
  panel.id = "forge-gv-router";
  panel.style.cssText = [
    "position:fixed",
    "top:16px",
    "right:16px",
    "z-index:2147483647",
    "background:#0E1726",
    "color:#F5F0E8",
    "border:2px solid #C5A059",
    "border-radius:12px",
    "padding:16px 20px",
    "font-family:system-ui,-apple-system,sans-serif",
    "box-shadow:0 16px 40px rgba(0,0,0,0.6)",
    "width:340px",
  ].join(";");

  const badgeEl = document.createElement("div");
  badgeEl.style.cssText = "display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#C5A059;margin-bottom:4px;";
  badgeEl.textContent = "Forge Athletic · Direct Audio Router";

  const closeBtn = document.createElement("button");
  closeBtn.style.cssText = "background:transparent;border:none;color:#8A99AA;font-size:14px;cursor:pointer;padding:0 0 0 8px;";
  closeBtn.textContent = "✕";
  closeBtn.title = "Dismiss router panel";
  closeBtn.addEventListener("click", () => panel.remove());
  badgeEl.appendChild(closeBtn);

  const titleEl = document.createElement("div");
  titleEl.style.cssText = "font-size:15px;font-weight:700;margin-bottom:8px;";
  titleEl.textContent = "Coach Gordon Default Voicemail (22.2s)";

  const statusEl = document.createElement("div");
  statusEl.id = "forge-gv-status";
  statusEl.style.cssText = "font-size:13px;color:#CBD5E1;margin-bottom:12px;line-height:1.4;";
  statusEl.textContent = "⏳ Decoding audio buffer...";

  const playBtn = document.createElement("button");
  playBtn.id = "forge-gv-play-btn";
  playBtn.style.cssText = "width:100%;padding:10px 14px;background:#C5A059;color:#0E1726;font-weight:800;font-size:13px;border:none;border-radius:8px;cursor:pointer;";
  playBtn.textContent = "▶ Play Greeting Into Recorder Now";

  panel.appendChild(badgeEl);
  panel.appendChild(titleEl);
  panel.appendChild(statusEl);
  panel.appendChild(playBtn);
  document.body.appendChild(panel);

  function updateStatus(msg) {
    statusEl.textContent = msg;
  }

  // Decode embedded MP3 immediately
  const binary = atob(BASE64_MP3);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  ctx.decodeAudioData(bytes.buffer.slice(0)).then((buf) => {
    decodedBuffer = buf;
    updateStatus("✅ Ready (" + buf.duration.toFixed(1) + "s) — Click '+ Record a greeting' in Google Voice");
  });

  // Override getUserMedia to route pure digital WebAudio stream into Google Voice
  const origGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = async function (constraints) {
    if (constraints && constraints.audio) {
      if (ctx.state === "suspended") await ctx.resume();
      console.log("[Forge Athletic] Routed virtual Coach Gordon audio stream to Google Voice.");
      // Keep track clones returning fresh tracks so Google Voice never closes our master stream
      return dest.stream.clone();
    }
    return origGetUserMedia(constraints);
  };

  async function playGreetingIntoStream() {
    if (!decodedBuffer) {
      updateStatus("⚠️ Still decoding audio buffer, try again in a second.");
      return;
    }
    if (ctx.state === "suspended") await ctx.resume();
    if (activeSource) {
      try { activeSource.stop(); } catch {}
    }

    const src = ctx.createBufferSource();
    src.buffer = decodedBuffer;
    src.connect(dest);            // Pure digital stream into Google Voice
    src.connect(ctx.destination); // Monitor through speakers/headphones
    activeSource = src;

    const startTime = Date.now();
    const totalSec = decodedBuffer.duration;
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= totalSec) {
        clearInterval(timer);
      } else {
        updateStatus("🎙️ Streaming to Google Voice... " + elapsed.toFixed(1) + "s / " + totalSec.toFixed(1) + "s");
      }
    }, 100);

    src.onended = () => {
      clearInterval(timer);
      updateStatus("✅ Finished! Clicking Stop in Google Voice...");
      const buttons = Array.from(document.querySelectorAll("button"));
      const stopBtn = buttons.find((b) => /\\bstop\\b/i.test(b.textContent || "") || /stop recording/i.test(b.getAttribute("aria-label") || ""));
      if (stopBtn) {
        stopBtn.click();
        updateStatus("🎉 Recording complete! Click 'Save' in Google Voice.");
      } else {
        updateStatus("🎉 Greeting finished! Click 'Stop' then 'Save' in Google Voice.");
      }
    };

    src.start(0);
  }

  playBtn.addEventListener("click", playGreetingIntoStream);

  // Auto-detect when user clicks Google Voice's microphone / Record button inside the dialog
  document.addEventListener("click", (e) => {
    const btn = e.target && e.target.closest ? e.target.closest("button") : null;
    if (!btn || btn.id === "forge-gv-play-btn") return;
    const text = (btn.textContent || "").trim();
    const aria = (btn.getAttribute("aria-label") || "").trim();
    if (/^record$/i.test(text) || /start recording|record greeting/i.test(aria)) {
      setTimeout(() => playGreetingIntoStream(), 400);
    }
  }, true);

  console.log("✅ Forge Athletic Direct Audio Router armed! Click '+ Record a greeting' in Google Voice.");
})();`

  await fs.writeFile(OUT_JS_PATH, snippet, 'utf8')
  await copyToClipboard(snippet)
  console.log(`✅ Direct audio router script written to: ${OUT_JS_PATH}`)
  console.log(`📋 Copied to your macOS clipboard (${(snippet.length / 1024).toFixed(0)} KB)!`)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
