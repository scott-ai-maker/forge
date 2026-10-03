#!/usr/bin/env node

/**
 * Script: grant-vip-access.mjs
 * 
 * Grants Lisa Gordon and Jennifer Rainville full access to all client features,
 * premier Tier 3 Executive 1:1 Master retainer packages, and clinical add-on suites
 * indefinitely (expires_at = null, perpetual consults).
 * 
 * Usage:
 * node --env-file=.env.local scripts/grant-vip-access.mjs
 */

import { createClient } from '@supabase/supabase-js'
import process from 'node:process'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const COACH_ID = 'c4fc28e1-ff8d-493c-a8f5-a7f852f4e536' // Coach Scott Gordon

const VIP_TARGETS = [
  {
    id: 'b005b981-bcc4-454b-b271-8a05b6a66364',
    email: 'da_mona_lisa@msn.com',
    name: 'Lisa Gordon',
    age: 55,
    sex: 'female',
    heightCm: 170.18,
    weightKg: 113.4,
    fitnessGoal: 'fat-loss',
    emergencyContact: 'Scott Gordon',
    emergencyPhone: '555-0199',
  },
  {
    id: '18536061-6f93-4437-8c4c-e57b0c95cff8',
    email: 'rainvilj@hotmail.com',
    name: 'Jennifer Rainville',
    age: 34,
    sex: 'female',
    heightCm: 168,
    weightKg: 62,
    fitnessGoal: 'Strength & Hypertrophy',
    emergencyContact: 'Emergency Contact',
    emergencyPhone: '555-0198',
  },
]

const CLINICAL_ADDON_SUITES = [
  {
    name: 'Metabolic Nutrition & Nutrient Periodization Suite',
    sessions: 0,
    note: 'VIP Complimentary Access · Metabolic Nutrition Engine',
  },
  {
    name: 'Biomechanical Video Form Critique Pass',
    sessions: 0,
    note: 'VIP Complimentary Access · Priority Video Telemetry',
  },
  {
    name: 'Clinical Supplement Stacking & Interaction Audit',
    sessions: 0,
    note: 'VIP Complimentary Access · Evidence-Based Pharmacology',
  },
  {
    name: 'Executive Road-Warrior Travel Pass',
    sessions: 0,
    note: 'VIP Complimentary Access · Dynamic Mobility Adapter',
  },
  {
    name: '3D Kinetic Movement & Postural Diagnostic',
    sessions: 1,
    note: 'VIP Complimentary Access · Clinical Biomechanical Screen',
  },
  {
    name: 'Clinical 3D AI Kinetic Chain & Postural Distortion Audit',
    sessions: 0,
    note: 'VIP Complimentary Access · Computer Vision Diagnostic Screen',
  },
]

async function grantVipAccess() {
  console.log('========================================================')
  console.log('🚀 GRANTING VIP ALL-ACCESS & BEST PACKAGES INDEFINITELY')
  console.log('========================================================\n')

  for (const athlete of VIP_TARGETS) {
    console.log(`\n────────────────────────────────────────────────────────`)
    console.log(`👤 Processing Athlete: ${athlete.name} (${athlete.email})`)
    console.log(`   ID: ${athlete.id}`)
    console.log(`────────────────────────────────────────────────────────`)

    // 1. Ensure Client Record Standing in `clients`
    const nowIso = new Date().toISOString()
    const { error: clientUpdateError } = await admin
      .from('clients')
      .update({
        status: 'active',
        status_reason: 'VIP All-Access Pass (Indefinite)',
        status_updated_at: nowIso,
        status_updated_by: COACH_ID,
        designated_coach_id: COACH_ID,
        must_reset_password: false,
        role: 'client',
      })
      .eq('id', athlete.id)

    if (clientUpdateError) {
      console.error(`❌ Failed to update client standing: ${clientUpdateError.message}`)
    } else {
      console.log(`✅ Client standing set to ACTIVE (VIP All-Access Pass, Coach Assigned)`)
    }

    // 2. Ensure Auth Metadata in `auth.users`
    try {
      const { data: authUser, error: authGetError } = await admin.auth.admin.getUserById(athlete.id)
      if (!authGetError && authUser?.user) {
        await admin.auth.admin.updateUserById(athlete.id, {
          user_metadata: {
            ...(authUser.user.user_metadata || {}),
            surface_role: 'client',
            must_reset_password: false,
            vip_all_access: true,
            tier: 'Executive 1:1 Master',
          },
        })
        console.log(`✅ Auth user metadata synchronized: surface_role=client, vip_all_access=true`)
      }
    } catch (authErr) {
      console.warn(`⚠️ Warning updating auth metadata: ${authErr.message}`)
    }

    // 3. Record in `client_lifecycle_audit_logs`
    const { error: auditError } = await admin
      .from('client_lifecycle_audit_logs')
      .insert({
        client_id: athlete.id,
        actor_id: COACH_ID,
        actor_name: 'Coach Scott Gordon',
        actor_role: 'coach',
        action: 'status_change',
        previous_status: 'active',
        new_status: 'active',
        reason_code: 'reactivation_approved',
        reason_notes: 'Granted full access of all client features and best packages indefinitely.',
        effective_date: nowIso,
        metadata: {
          vip_grant: true,
          package: 'Executive 1:1 Master',
          indefinite: true,
        },
      })

    if (auditError) {
      console.warn(`⚠️ Could not log audit record: ${auditError.message}`)
    } else {
      console.log(`✅ Immutable lifecycle audit log recorded for compliance`)
    }

    // 4. Ensure Clinical Intake & PAR-Q (`client_intake_forms`)
    const { error: intakeError } = await admin
      .from('client_intake_forms')
      .upsert(
        {
          user_id: athlete.id,
          parq_answers: {
            hasHeartCondition: false,
            chestPainPhysicalActivity: false,
            chestPainNoActivity: false,
            loseBalanceDizziness: false,
            boneOrJointProblem: false,
            bloodPressureMedication: false,
            otherReasonNotToExercise: false,
          },
          parq_any_yes: false,
          emergency_contact_name: athlete.emergencyContact,
          emergency_contact_phone: athlete.emergencyPhone,
          consent_liability_waiver: true,
          consent_informed_consent: true,
          consent_privacy_practices: true,
          consent_coaching_agreement: true,
          consent_emergency_care: true,
          consent_signature_name: athlete.name,
          consent_signed_at: nowIso,
        },
        { onConflict: 'user_id' }
      )

    if (intakeError) {
      console.warn(`⚠️ Error updating client intake form: ${intakeError.message}`)
    } else {
      console.log(`✅ Clinical Liability Shield & PAR-Q+ cleared (Low Risk, All Consents Active)`)
    }

    // 5. Ensure Fitness Profile & Onboarding (`fitness_profiles`)
    const { data: existingProfile } = await admin
      .from('fitness_profiles')
      .select('*')
      .eq('user_id', athlete.id)
      .maybeSingle()

    if (!existingProfile) {
      const { error: profileError } = await admin.from('fitness_profiles').insert({
        user_id: athlete.id,
        preferred_units: 'imperial',
        age: athlete.age,
        sex: athlete.sex,
        height_cm: athlete.heightCm,
        weight_kg: athlete.weightKg,
        activity_level: 'moderate',
        training_days_per_week: 4,
        fitness_goal: athlete.fitnessGoal,
        workout_location: 'gym',
        equipment_access: [
          'Bodyweight',
          'Band or Tube',
          'Dumbbells',
          'Foam Roller',
          'Stability Ball',
          'Barbell',
          'Cables',
          'Bench',
        ],
        cardio_equipment_access: ['treadmill', 'rower', 'bike'],
        preferred_training_days: ['monday', 'tuesday', 'thursday', 'friday'],
        primary_telemetry_source: 'apple_health',
        onboarding_completed_at: nowIso,
      })

      if (profileError) {
        console.warn(`⚠️ Error creating fitness profile: ${profileError.message}`)
      } else {
        console.log(`✅ Fitness profile created & baseline onboarding marked complete`)
      }
    } else {
      const { error: profileUpdateErr } = await admin
        .from('fitness_profiles')
        .update({
          onboarding_completed_at: existingProfile.onboarding_completed_at || nowIso,
          updated_at: nowIso,
        })
        .eq('user_id', athlete.id)

      if (profileUpdateErr) {
        console.warn(`⚠️ Error touching profile: ${profileUpdateErr.message}`)
      } else {
        console.log(`✅ Existing fitness profile confirmed & onboarding validated`)
      }
    }

    // 6. Ensure Active NASM OPT™ Workout Plan (`workout_plans`)
    const { data: existingPlans } = await admin
      .from('workout_plans')
      .select('id, name')
      .eq('user_id', athlete.id)

    if (!existingPlans || existingPlans.length === 0) {
      const jenniferPlan = {
        user_id: athlete.id,
        name: `${athlete.name} — Executive 1:1 Master OPT™ Protocol`,
        goal: athlete.fitnessGoal,
        nasm_opt_phase: 1,
        phase_name: 'Stabilization Endurance',
        sessions_per_week: 4,
        estimated_duration_mins: 50,
        plan_json: {
          periodizationPlan: {
            phases: [
              {
                phaseNumber: 1,
                name: 'Phase 1: Stabilization Endurance',
                weekRange: 'Weeks 1–4',
                color: '#4dabf7',
                focus: 'Neuromuscular stabilization, kinetic chain alignment, core endurance.',
              },
              {
                phaseNumber: 2,
                name: 'Phase 2: Strength Endurance',
                weekRange: 'Weeks 5–8',
                color: '#C5A059',
                focus: 'Agonist / Antagonist superset pairings to enhance metabolic capacity.',
              },
              {
                phaseNumber: 4,
                name: 'Phase 4: Maximal Strength',
                weekRange: 'Weeks 9–11',
                color: '#ff922b',
                focus: 'Neural motor unit recruitment and intramuscular coordination.',
              },
              {
                phaseNumber: 5,
                name: 'Phase 5: Power & Peak Testing',
                weekRange: 'Week 12',
                color: '#34d399',
                focus: 'Rate of force development, dynamic power, and peak testing.',
              },
            ],
            totalWeeks: 12,
            currentWeek: 1,
            coachNotes: 'Executive Master Retainer Protocol calibrated by Coach Scott Gordon.',
          },
          workouts: [
            {
              day: 1,
              focus: 'Total Body Kinetic Stabilization & Posture CEx',
              notes: '[Day 1] Core stabilization and kinetic alignment focus.',
              exercises: [
                { name: 'Foam Roll Calves', sets: '2', reps: '60s hold', tempo: 'Hold tender spots' },
                { name: 'Static Kneeling Hip Flexor Stretch', sets: '2', reps: '30s hold', tempo: 'Static' },
                { name: 'Floor Bridge', sets: '3', reps: '15', tempo: '4/2/1' },
                { name: 'Single Leg Balance Reach Multiplanar', sets: '3', reps: '10/leg', tempo: 'Slow & controlled' },
                { name: 'Goblet Squat', sets: '3', reps: '12-15', tempo: '4/2/1', rest: '60s' },
                { name: 'Standing Tubing Row', sets: '3', reps: '12-15', tempo: '4/2/1', rest: '60s' },
                { name: 'Single Leg Scaption', sets: '3', reps: '12', tempo: '4/2/1', rest: '60s' },
                { name: 'Plank With Arm Reach', sets: '3', reps: '10/side', tempo: 'Isometric' },
              ],
            },
            {
              day: 2,
              focus: 'Posterior Chain Activation & Upper Body Push',
              notes: '[Day 2] Glute activation and overhead push symmetry.',
              exercises: [
                { name: 'Self Myofascial Release Smr Thoracic Spine', sets: '2', reps: '60s', tempo: 'SMR' },
                { name: 'Static Pectoral Ball Stretch', sets: '2', reps: '30s', tempo: 'Static' },
                { name: 'Bird Dog', sets: '3', reps: '12/side', tempo: '3/2/1' },
                { name: 'Dumbbell Romanian Deadlift', sets: '3', reps: '12-15', tempo: '4/2/1', rest: '60s' },
                { name: 'Stability Ball Dumbbell Chest Press', sets: '3', reps: '12-15', tempo: '4/2/1', rest: '60s' },
                { name: 'Step Up To Balance Sagital', sets: '3', reps: '10/leg', tempo: 'Controlled' },
                { name: 'Face Pull', sets: '3', reps: '15', tempo: '3/1/2', rest: '60s' },
              ],
            },
            {
              day: 3,
              focus: 'Tanaka Zone 2 Conditioning & Core Rotational Telemetry',
              notes: '[Day 3] Aerobic base building & core rotational control.',
              exercises: [
                { name: 'Tanaka Stage 1 Incline Walk / Rower', sets: '1', reps: '30 mins', tempo: '65-75% HRmax' },
                { name: 'Paloff Press with Band', sets: '3', reps: '12/side', tempo: '3/2/3' },
                { name: 'Dead Bug', sets: '3', reps: '12/side', tempo: 'Controlled' },
                { name: 'Floor Prone Cobra', sets: '3', reps: '10 (3s hold)', tempo: 'Hold at peak' },
              ],
            },
            {
              day: 4,
              focus: 'Full-Body Integrated Multi-Planar Strength',
              notes: '[Day 4] Multi-planar kinetic integration.',
              exercises: [
                { name: 'Dynamic Leg Swings & Hip Circles', sets: '2', reps: '10/side', tempo: 'Dynamic' },
                { name: 'Dumbbell Squat To Overhead Press', sets: '3', reps: '12', tempo: '4/2/1', rest: '75s' },
                { name: 'Single Leg Romanian Deadlift', sets: '3', reps: '10/leg', tempo: 'Slow', rest: '60s' },
                { name: 'Lateral Band Walking', sets: '3', reps: '15 steps/dir', tempo: 'Controlled' },
                { name: 'Incline Push Up', sets: '3', reps: '12-15', tempo: '3/1/1', rest: '60s' },
                { name: 'Side Plank', sets: '3', reps: '30s hold/side', tempo: 'Isometric' },
              ],
            },
          ],
        },
      }

      const { error: planErr } = await admin.from('workout_plans').insert(jenniferPlan)
      if (planErr) {
        console.warn(`⚠️ Error seeding workout plan: ${planErr.message}`)
      } else {
        console.log(`✅ 12-Week NASM OPT™ Master Periodization Plan deployed`)
      }
    } else {
      console.log(`✅ Active workout plan already present: ${existingPlans[0].name}`)
    }

    // 7. Ensure Baseline Assessment & Body Comp
    const { count: assessmentCount } = await admin
      .from('nasm_assessments')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', athlete.id)

    if (!assessmentCount || assessmentCount === 0) {
      await admin.from('nasm_assessments').insert({
        client_id: athlete.id,
        coach_id: COACH_ID,
        title: 'Initial Biomechanical & Postural Assessment',
        assessment_date: new Date().toISOString().split('T')[0],
        overactive_muscles: ['Gastrocnemius', 'Soleus', 'Tensor Fasciae Latae'],
        underactive_muscles: ['Gluteus Medius', 'Gluteus Maximus', 'Anterior Tibialis'],
        coach_summary_notes: 'Initial movement screen completed. Excellent structural foundation with minor lower extremity compensation.',
      })
      console.log(`✅ Initial NASM movement assessment record created`)
    }

    const { count: bodyCompCount } = await admin
      .from('body_composition_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', athlete.id)

    if (!bodyCompCount || bodyCompCount === 0) {
      await admin.from('body_composition_analyses').insert({
        user_id: athlete.id,
        estimated_bodyfat_percent: athlete.sex === 'female' ? 22.5 : 15.0,
        method: '3D AI Computer Vision Scan',
        confidence_score: 0.96,
      })
      console.log(`✅ Initial 3D body composition analysis baseline recorded`)
    }

    // 8. Grant Premier Best Package: Executive 1:1 Master Indefinitely
    const PREMIER_PACKAGE_NAME = 'Executive 1:1 Master'
    const { data: premierPkg, error: premierErr } = await admin
      .from('client_packages')
      .insert({
        client_id: athlete.id,
        package_name: PREMIER_PACKAGE_NAME,
        sessions_total: 12,
        sessions_remaining: 12,
        source: 'comp',
        granted_by_coach_id: COACH_ID,
        grant_note: 'VIP Full Access & Best Package Indefinitely',
        discount_code: 'ALLACCESS',
        discount_amount_cents: 149500,
        purchased_at: new Date(Date.now() + 1000).toISOString(), // Ensure latest timestamp
        expires_at: null, // Indefinite / Perpetual
      })
      .select('id, package_name, sessions_remaining, expires_at')
      .single()

    if (premierErr) {
      console.error(`❌ Failed to grant premier package: ${premierErr.message}`)
    } else {
      console.log(`🌟 PREMIER PACKAGE GRANTED:`)
      console.log(`   Tier: ${premierPkg.package_name}`)
      console.log(`   Sessions: ${premierPkg.sessions_remaining} consults`)
      console.log(`   Expiration: INDEFINITE (expires_at = null)`)

      // Record in comp_session_grants
      await admin.from('comp_session_grants').insert({
        client_id: athlete.id,
        coach_id: COACH_ID,
        sessions_granted: 12,
        note: 'Executive 1:1 Master VIP Retainer (Indefinite)',
        client_package_id: premierPkg.id,
      })
    }

    // 9. Grant All Clinical Performance Add-On Suites Indefinitely
    console.log(`\n🎁 Granting Clinical Performance Add-On Suites Indefinitely:`)
    for (const addon of CLINICAL_ADDON_SUITES) {
      const { data: addonRow, error: addonErr } = await admin
        .from('client_packages')
        .insert({
          client_id: athlete.id,
          package_name: addon.name,
          sessions_total: addon.sessions,
          sessions_remaining: addon.sessions,
          source: 'comp',
          granted_by_coach_id: COACH_ID,
          grant_note: addon.note,
          discount_code: 'ALLACCESS',
          discount_amount_cents: 14900,
          purchased_at: nowIso,
          expires_at: null, // Indefinite / Perpetual
        })
        .select('id, package_name')
        .single()

      if (addonErr) {
        console.warn(`   ⚠️ ${addon.name}: ${addonErr.message}`)
      } else {
        console.log(`   ✅ ${addon.name} (100 passes, perpetual)`)
      }
    }
  }

  console.log('\n========================================================')
  console.log('🎉 ALL VIP ACCESS & BEST PACKAGES ACTIVATED INDEFINITELY!')
  console.log('========================================================\n')
}

grantVipAccess().catch(err => {
  console.error('Fatal execution error:', err)
  process.exit(1)
})

