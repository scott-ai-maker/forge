import { createClient } from '@supabase/supabase-js'
import { validateAndEnforceNasmOptGuardrails } from '../lib/nasm-opt-guardrails'
import type { GeneratedMacrocyclePlan } from '../lib/rag-nasm-program-generator'

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase credentials in environment')
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const PLAN_ID = 'a936e62d-c5e4-4f4d-8c91-41507cd455e3'
  const { data: plan, error } = await admin
    .from('workout_plans')
    .select('*')
    .eq('id', PLAN_ID)
    .single()

  if (error || !plan) {
    console.error('Plan not found:', error)
    return
  }

  console.log(`Found plan: "${plan.name}" (Current estimated_duration_mins: ${plan.estimated_duration_mins})`)

  const rawMacrocyclePlan = {
    planTitle: plan.name,
    primaryGoal: plan.goal || 'fat_loss',
    nasmOptPhase: plan.nasm_opt_phase || 1,
    phaseName: plan.phase_name || 'Phase 1: Stabilization Endurance',
    totalWeeks: 12,
    workouts: plan.plan_json?.workouts || [],
  } as GeneratedMacrocyclePlan

  // Also slice bloated warmups if present
  rawMacrocyclePlan.workouts = rawMacrocyclePlan.workouts.map(day => ({
    ...day,
    warmupProtocol: {
      inhibitSmr: (day.warmupProtocol?.inhibitSmr || []).slice(0, 3),
      lengthenStaticStretch: (day.warmupProtocol?.lengthenStaticStretch || []).slice(0, 3),
      activateDynamic: (day.warmupProtocol?.activateDynamic || []).slice(0, 3),
    },
  }))

  const { sanitizedPlan, audit } = validateAndEnforceNasmOptGuardrails(rawMacrocyclePlan, {
    targetPhase: 1,
  })

  console.log('\n--- AUDIT REPAIRS APPLIED ---')
  audit.repairsApplied.forEach(r => console.log(' •', r))

  console.log('\n--- CALIBRATED WORKOUT DURATIONS ---')
  sanitizedPlan.workouts.forEach((w, i) => {
    console.log(` Day ${i + 1} (${w.dayName || w.focus}): ${w.estimatedDurationMins} minutes (exercises: ${w.exercises.length}, cardio: ${w.cardioProtocol?.title || 'None'})`)
  })

  const avgDuration = Math.round(
    sanitizedPlan.workouts.reduce((acc, w) => acc + (w.estimatedDurationMins || 45), 0) / sanitizedPlan.workouts.length
  )
  console.log(`\nNew Plan Average Duration: ${avgDuration} minutes`)

  // Update plan_json with sanitized workouts
  const updatedPlanJson = {
    ...plan.plan_json,
    workouts: sanitizedPlan.workouts,
    sessions: sanitizedPlan.workouts,
  }

  const { error: updateError } = await admin
    .from('workout_plans')
    .update({
      estimated_duration_mins: avgDuration,
      plan_json: updatedPlanJson,
    })
    .eq('id', PLAN_ID)

  if (updateError) {
    console.error('Failed to update plan:', updateError)
  } else {
    console.log(`\n✅ Successfully updated workout plan ${PLAN_ID} in Supabase!`)
  }
}

run().catch(console.error)
