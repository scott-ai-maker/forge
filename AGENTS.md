<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Forge Athletic Architecture & Video Pipeline Rules

## Live Coach Virtual Background Segmentation Mask (ALWAYS INVERTED)
- In `components/coach/LiveVirtualBackgroundStage.tsx`, the MediaPipe selfie segmenter confidence mask output **MUST ALWAYS BE INVERTED** (`const conf = 1 - rawConf`).
- The coach foreground must evaluate to `conf = 1.0` (opaque alpha 255, retained) and the physical room background must evaluate to `conf = 0.0` (transparent alpha 0, cutout) so the virtual background renders behind the coach, never inside the coach's silhouette.
- Never flip or revert this mask polarity in future refactors.

## Virtual Background True Optical Orientation (NEVER MIRROR BACKGROUND IMAGES)
- In `components/coach/LiveVirtualBackgroundStage.tsx`, the `<canvas>` element must **NEVER** have CSS `transform: scaleX(-1)`.
- Virtual background images containing brand marks, typography ("FORGE ATHLETIC"), and logos must always be rendered in true optical orientation so text reads from left to right.
- Only the coach foreground subject (`offscreen` canvas) is mirrored when `isMirrored` is true (front selfie camera) to maintain natural mirror intuition without reversing the background.



