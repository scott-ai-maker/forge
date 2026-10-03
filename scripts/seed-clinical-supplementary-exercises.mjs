#!/usr/bin/env node

/**
 * scripts/seed-clinical-supplementary-exercises.mjs
 * 
 * Upserts official entries for supplementary clinical exercises used in GAA protocols:
 * 1. Paloff Press with Band
 * 2. Tanaka Stage 1 Incline Walk / Rower
 * 3. Dynamic Leg Swings & Hip Circles
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const CLINICAL_ENTRIES = [
  {
    id: 'c1000001-0000-4000-8000-000000000001',
    source: 'licensed_import',
    source_id: 'gaa-paloff-press-band',
    slug: 'paloff-press-with-band',
    name: 'Paloff Press with Band',
    description: 'Step 1: Setup Anchor a resistance band at mid-chest height. Stand perpendicular to the anchor point in an athletic, shoulder-width stance with knees soft.\n\nStep 2: Brace/Position Grasp the handle with both hands at the center of your chest. Engage your core, retract and depress your scapulae, and establish a neutral spine.\n\nStep 3: Execute Press the band directly away from your sternum until arms are extended. Resist the rotational torque attempting to twist your torso toward the anchor.\n\nStep 4: Return/Repeat Hold the isometric contraction for 2-3 seconds, then return your hands smoothly to your chest with control. Complete prescribed repetitions and switch sides.',
    coaching_cues: [
      'Resist rotational torque through deep transverse abdominis and obliques',
      'Keep pelvis and shoulders squared straight ahead',
      'Exhale sharply on extension while maintaining rib cage depression',
    ],
    primary_equipment: ['Resistance Band'],
    muscle_groups: ['core', 'obliques', 'abdominals'],
    media_image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    media_video_url: null,
    open_externally_only: false,
    metadata_json: {
      category: 'Core Stabilization & Anti-Rotation',
      nasmPhase: [1, 2, 3],
      clinicalContext: 'Lumbar spine anti-rotation and rotary stability conditioning',
      verified_official: true,
    },
    is_active: true,
  },
  {
    id: 'c1000001-0000-4000-8000-000000000002',
    source: 'licensed_import',
    source_id: 'gaa-tanaka-stage-1-cardio',
    slug: 'tanaka-stage-1-incline-walk-rower',
    name: 'Tanaka Stage 1 Incline Walk / Rower',
    description: 'Step 1: Setup Mount the treadmill (incline 6–10%, 3.0–3.8 mph) or rowing ergometer (damper 4–5). Calibrate your heart rate telemetry monitor.\n\nStep 2: Brace/Position Maintain erect posture with tall cervical alignment and steady diaphragmatic breathing through the nasal cavity.\n\nStep 3: Execute Sustain a steady aerobic rhythm targeting Tanaka Stage 1 heart rate thresholds (65–75% HRmax = 208 - 0.7 * age). Avoid holding handrails on the treadmill.\n\nStep 4: Return/Repeat Maintain pace for the prescribed duration (20–45 mins). Conclude with a 3-minute flush in Zone 1 (<60% HRmax).',
    coaching_cues: [
      'Maintain continuous cadence within Tanaka Zone 1–2 (65–75% HRmax)',
      'Keep posture upright with natural reciprocal arm swing',
      'Focus on diaphragmatic nasal breathing for optimal parasympathetic tone',
    ],
    primary_equipment: ['Treadmill', 'Rower'],
    muscle_groups: ['cardiovascular', 'quadriceps', 'hamstrings', 'calves'],
    media_image_url: 'https://images.unsplash.com/photo-1434596922112-19c563067271?auto=format&fit=crop&w=800&q=80',
    media_video_url: null,
    open_externally_only: false,
    metadata_json: {
      category: 'Cardiorespiratory Stage Training',
      nasmPhase: [1, 2, 3, 4, 5],
      clinicalContext: 'Tanaka formula aerobic base development and mitochondrial biogenesis',
      verified_official: true,
    },
    is_active: true,
  },
  {
    id: 'c1000001-0000-4000-8000-000000000003',
    source: 'licensed_import',
    source_id: 'gaa-dynamic-leg-swings-hip-circles',
    slug: 'dynamic-leg-swings-hip-circles',
    name: 'Dynamic Leg Swings & Hip Circles',
    description: 'Step 1: Setup Stand tall adjacent to a wall or stable upright support for balance assistance.\n\nStep 2: Sagittal Swings Swing one leg forward and backward smoothly through the sagittal plane (hip flexion to extension), maintaining an upright lumbar spine.\n\nStep 3: Frontal Swings Turn facing the support and swing the leg laterally across the midline and out through the frontal plane (hip adduction to abduction).\n\nStep 4: Hip Circles Perform slow, controlled multi-planar circumductions of the hip (CARs) both clockwise and counter-clockwise to lubricate the acetabulofemoral joint.',
    coaching_cues: [
      'Keep the standing leg soft with foot firmly rooted',
      'Avoid lumbar hyperextension during backward swing',
      'Progressively increase dynamic amplitude through pain-free range of motion',
    ],
    primary_equipment: ['Bodyweight'],
    muscle_groups: ['glutes', 'hip flexors', 'adductors', 'abductors', 'hamstrings'],
    media_image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
    media_video_url: null,
    open_externally_only: false,
    metadata_json: {
      category: 'Dynamic Kinetic Warmup & Mobilization',
      nasmPhase: [1, 2, 3, 4, 5],
      clinicalContext: 'Pre-workout dynamic mobility and pelvic-hip complex preparation',
      verified_official: true,
    },
    is_active: true,
  },
]

async function seed() {
  console.log(`Seeding ${CLINICAL_ENTRIES.length} clinical supplementary exercises into exercise_library_entries...`)
  for (const entry of CLINICAL_ENTRIES) {
    const { error } = await admin.from('exercise_library_entries').upsert(entry, { onConflict: 'id' })
    if (error) {
      throw new Error(`Failed to upsert ${entry.name}: ${error.message}`)
    }
    console.log(`✅ Upserted official exercise: ${entry.name} (${entry.id})`)
  }
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})

