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

## Brand Identity & Nomenclature (STRICT: Forge Athletic, NEVER "GAA")
- The company, platform, and brand identity is **Forge Athletic** (or "Forge").
- **NEVER** refer to the brand, company, or platform as "GAA", "Gordon Athletic", or "Gordon Athletic Advisory" in any user communications, notes, summaries, or new code.
- Legacy codebase references (e.g. historical file names or service worker cache tokens) must be treated strictly as legacy internal plumbing, while all current and future architectural notes, UI copy, and agent communications must consistently and exclusively use **Forge Athletic**.

## Client Information Security & HIPAA (1996) Privacy Standard
- **Core Directive**: When saving, processing, or transmitting client information online (PAR-Q+ questionnaires, health histories, medications, orthopedic limitations, biometric telemetry, posture photos, and video assessments), always maintain strict information security consistent with HIPAA (1996) Privacy & Security standards.
- **Technical Safeguards**:
  - All client data must be encrypted in transit via **TLS 1.3** and at rest via **AES-256**.
  - Enforce PostgreSQL **Row-Level Security (RLS)** across all client tables (`fitness_profiles`, `client_intake_forms`, `coach_client_messages`, `nasm_assessments`, `workout_logs`, etc.). Clients may only access their own records (`auth.uid() = user_id`).
  - Coach access to athlete records must always verify authorization and active assignment (`designated_coach_id === authz.user.id`) via [`requireCoachAssignedClient`](file:///Users/scottgordon/Repos/forge/lib/authz.ts) or server-side gatekeepers. Never expose client health data through unauthenticated endpoints.
- **Media & Assessment Privacy**:
  - Movement screen videos, OHSA photos, live studio telestrator recordings, and DEXA scans must reside strictly in private Supabase Storage buckets secured with RLS and accessed only via time-limited signed URLs—never public CDN buckets.
- **Minimum Necessary Rule**:
  - Only collect and transmit health and orthopedic indicators strictly necessary for biomechanical safety, NASM OPT™ exercise contraindication screening, and emergency remote action plans (ERAP).

## Athlete Photography Wardrobe & Visual Standards (GUYS MUST KEEP SHIRTS ON)
- **Shirts On at All Times**: All male athletes in exercise photography, demonstrations, and marketing assets must strictly have their shirts kept on at all times.
- **No Shirtless or Sleeveless Tops**: Male models must never be shirtless, bare-chested, or wearing sleeveless stringer/tank tops.
- **Approved Apparel**: Always dress male athletes in fitted charcoal, dark slate, dark navy, or black athletic performance crewneck t-shirts (short-sleeve) or athletic long-sleeve compression tops, paired with athletic training shorts/tights and clean black training shoes.
