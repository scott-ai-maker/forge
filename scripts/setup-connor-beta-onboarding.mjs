#!/usr/bin/env node

/**
 * scripts/setup-connor-beta-onboarding.mjs
 *
 * Provisions Connor Gordon (connor.gordon2002@gmail.com) with the full VIP Beta Tester
 * treatment (Executive 1:1 Master plan with all clinical suites comped),
 * resets his onboarding status to a pristine state, and dispatches the welcome email via Resend.
 *
 * Usage:
 *   node --env-file=.env.local scripts/setup-connor-beta-onboarding.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import process from 'node:process'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.MARKETING_FROM_EMAIL || 'coaching@forge-athletic.app'
const replyTo = process.env.MARKETING_REPLY_TO_EMAIL || 'scott@forge-athletic.app'

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const COACH_ID = 'a896b7f6-5946-4452-a501-ace7feda0e55' // Coach Gordon
const CLIENT_EMAIL = 'connor.gordon2002@gmail.com'
const CLIENT_NAME = 'Connor Gordon'
const CLIENT_PASSWORD = process.env.CONNOR_CLIENT_PASSWORD || process.env.TEMP_CLIENT_PASSWORD || 'ForgeBeta2026!'

const CLINICAL_ADDON_SUITES = [
  {
    name: 'Metabolic Nutrition & Nutrient Periodization Suite',
    sessions: 0,
    note: 'VIP Beta Complimentary Access · Metabolic Nutrition Engine',
  },
  {
    name: 'Biomechanical Video Form Critique Pass',
    sessions: 0,
    note: 'VIP Beta Complimentary Access · Priority Video Telemetry (Form Lab)',
  },
  {
    name: 'Clinical Supplement Stacking & Interaction Audit',
    sessions: 0,
    note: 'VIP Beta Complimentary Access · Evidence-Based Pharmacology',
  },
  {
    name: 'Executive Road-Warrior Travel Pass',
    sessions: 0,
    note: 'VIP Beta Complimentary Access · Dynamic Mobility Adapter',
  },
  {
    name: '3D Kinetic Movement & Postural Diagnostic',
    sessions: 1,
    note: 'VIP Beta Complimentary Access · Clinical Biomechanical Screen',
  },
  {
    name: 'Clinical 3D AI Kinetic Chain & Postural Distortion Audit',
    sessions: 0,
    note: 'VIP Beta Complimentary Access · Computer Vision Diagnostic Screen',
  },
]

const ENTITLEMENT_FEATURES = ['video-review', 'nutrition', 'travel']

async function setupConnor() {
  console.log('================================================================')
  console.log(`⚡ PROVISIONING & RESETTING VIP BETA TESTER: ${CLIENT_NAME}`)
  console.log('================================================================\n')

  const now = new Date()
  const nowIso = now.toISOString()
  const expiresAt = new Date(now)
  expiresAt.setFullYear(expiresAt.getFullYear() + 10)

  // 1. Locate Auth User
  const { data: userList, error: listError } = await admin.auth.admin.listUsers({ perPage: 200 })
  if (listError) {
    console.error(`❌ Error listing users: ${listError.message}`)
    process.exit(1)
  }

  const user = userList.users.find(u => u.email?.toLowerCase() === CLIENT_EMAIL.toLowerCase())
  if (!user) {
    console.error(`❌ User ${CLIENT_EMAIL} not found in Supabase Auth!`)
    process.exit(1)
  }

  const userId = user.id
  console.log(`✓ Located user: ${userId} (${CLIENT_EMAIL})`)

  // 2. Synchronize Auth User Credentials & Metadata
  console.log('1. Synchronizing Auth user metadata & password...')
  const { error: updateAuthError } = await admin.auth.admin.updateUserById(userId, {
    password: CLIENT_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: CLIENT_NAME,
      display_name: CLIENT_NAME,
      name: CLIENT_NAME,
      surface_role: 'client',
      must_reset_password: false,
      vip_all_access: true,
      tier: 'Executive 1:1 Master',
    },
  })

  if (updateAuthError) {
    console.error(`❌ Failed to update auth user: ${updateAuthError.message}`)
    process.exit(1)
  }
  console.log(`   ✓ Password set to "${CLIENT_PASSWORD}" and VIP metadata applied`)

  // 3. Update Clients Record
  console.log('2. Updating client record & coach assignment...')
  const { error: clientUpsertError } = await admin.from('clients').upsert({
    id: userId,
    email: CLIENT_EMAIL,
    full_name: CLIENT_NAME,
    role: 'client',
    status: 'active',
    status_reason: 'VIP Beta Tester · Executive 1:1 Master All-Access',
    status_updated_at: nowIso,
    status_updated_by: COACH_ID,
    designated_coach_id: COACH_ID,
    must_reset_password: false,
  }, { onConflict: 'id' })

  if (clientUpsertError) {
    console.error(`❌ Failed to upsert client record: ${clientUpsertError.message}`)
    process.exit(1)
  }
  console.log(`   ✓ Client record active and assigned to Coach Gordon`)

  // 4. Grant Premier Executive 1:1 Master Package
  console.log('3. Granting Executive 1:1 Master Retainer & Clinical Add-on Suites...')
  const { data: existingPremierPkg } = await admin
    .from('client_packages')
    .select('id')
    .eq('client_id', userId)
    .eq('package_name', 'Executive 1:1 Master')
    .maybeSingle()

  let premierPkgId = existingPremierPkg?.id
  if (!premierPkgId) {
    const { data: premierPkg, error: premierErr } = await admin
      .from('client_packages')
      .insert({
        client_id: userId,
        package_name: 'Executive 1:1 Master',
        sessions_total: 12,
        sessions_remaining: 12,
        source: 'comp',
        granted_by_coach_id: COACH_ID,
        grant_note: 'VIP Beta Tester Full All-Access Pass (Perpetual)',
        discount_code: 'ALLACCESS_BETA',
        discount_amount_cents: 149500,
        purchased_at: nowIso,
        expires_at: null,
      })
      .select('id')
      .single()

    if (premierErr) {
      console.warn(`   ⚠️ Premier package notice: ${premierErr.message}`)
    } else {
      premierPkgId = premierPkg?.id
      console.log('   ✓ Premier Package Granted: Executive 1:1 Master (12 comp sessions, perpetual)')

      await admin.from('comp_session_grants').insert({
        client_id: userId,
        coach_id: COACH_ID,
        sessions_granted: 12,
        note: 'Executive 1:1 Master VIP Beta Pass (Perpetual)',
        client_package_id: premierPkgId,
      })
    }
  } else {
    console.log('   ✓ Premier Package already present')
  }

  // Grant 6 Clinical Add-on Suites
  for (const addon of CLINICAL_ADDON_SUITES) {
    const { data: existingAddon } = await admin
      .from('client_packages')
      .select('id')
      .eq('client_id', userId)
      .eq('package_name', addon.name)
      .maybeSingle()

    if (!existingAddon) {
      await admin.from('client_packages').insert({
        client_id: userId,
        package_name: addon.name,
        sessions_total: addon.sessions,
        sessions_remaining: addon.sessions,
        source: 'comp',
        granted_by_coach_id: COACH_ID,
        grant_note: addon.note,
        discount_code: 'ALLACCESS_BETA',
        discount_amount_cents: 14900,
        purchased_at: nowIso,
        expires_at: null,
      })
    }
  }
  console.log('   ✓ All 6 Clinical Add-on Suites loaded into member wallet')

  // 5. Grant Feature Entitlements
  console.log('4. Granting feature entitlements (video-review, nutrition, travel)...')
  const entitlementRows = ENTITLEMENT_FEATURES.map(feature => ({
    client_id: userId,
    addon_id: 'vip-all-access',
    feature,
    uses_total: null,
    uses_remaining: null,
    stripe_payment_id: `vip-all-access:${userId}:${feature}`,
    granted_at: nowIso,
    expires_at: expiresAt.toISOString(),
  }))

  await admin.from('client_addon_entitlements').upsert(entitlementRows, { onConflict: 'stripe_payment_id' })
  console.log('   ✓ Feature entitlements active')

  // 6. Clear Previous Workout Plans & Logs for Pristine Onboarding
  console.log('5. Clearing workout plans, logs, and pre-existing records...')
  await admin.from('workout_plans').delete().eq('user_id', userId)
  await admin.from('workout_set_logs').delete().eq('user_id', userId)
  await admin.from('workout_logs').delete().eq('user_id', userId)
  await admin.from('workout_video_events').delete().eq('user_id', userId)
  await admin.from('cardio_logs').delete().eq('user_id', userId)
  await admin.from('exercise_skips').delete().eq('user_id', userId)
  await admin.from('client_personal_records').delete().eq('user_id', userId)
  await admin.from('nasm_assessments').delete().eq('client_id', userId)
  await admin.from('body_composition_analyses').delete().eq('user_id', userId)
  await admin.from('weekly_checkins').delete().eq('user_id', userId)
  await admin.from('client_intake_forms').delete().eq('user_id', userId)
  console.log('   ✓ Previous workouts, logs, assessments, and intake cleared')

  // 7. Reset Fitness Profile
  console.log('6. Resetting fitness profile to pre-onboarding baseline...')
  await admin.from('fitness_profiles').upsert({
    user_id: userId,
    preferred_units: 'imperial',
    age: null,
    sex: null,
    height_cm: null,
    weight_kg: null,
    waist_cm: null,
    neck_cm: null,
    hip_cm: null,
    activity_level: null,
    training_days_per_week: null,
    preferred_training_days: [],
    fitness_goal: null,
    target_weight_kg: null,
    target_bodyfat_percent: null,
    injuries_limitations: null,
    experience_level: null,
    workout_location: null,
    equipment_access: [],
    cardio_equipment_access: [],
    onboarding_completed_at: null,
    updated_at: nowIso,
  }, { onConflict: 'user_id' })
  console.log('   ✓ Fitness profile reset: onboarding_completed_at is NULL')

  // 8. Dispatch Welcome Email via Resend
  console.log('\n7. Dispatching VIP Beta Welcome Email via Resend...')
  const subject = 'Welcome to Forge Athletic Beta! Here are your VIP access & setup directions'

  const textBody = `Hi Connor,

Thank you so much for agreeing to be one of our premier beta testers for Forge Athletic!

I've set you up with our highest-tier VIP membership—our Executive 1:1 Coach Support plan with all clinical suites, Form Lab video reviews, and nutrition tools comped. Because you are testing the brand-new platform, I want you to experience the complete client onboarding funnel from start to finish so we can calibrate your training protocol specifically around your personal fitness goals and the equipment you have available.

------------------------------------------------------------
WHAT IS EXPECTED OF A BETA TESTER
------------------------------------------------------------
As a beta tester, your honest, unfiltered feedback is the most valuable part of this process:
1. Walk through every screen without skipping questions so we can test the intake logic.
2. Install the app on your iPhone Home Screen (directions below) to test the mobile companion during a workout.
3. Don't hold back: Tell me if anything feels confusing, clunky, slow, or broken.
4. Try logging a workout to test the exercise tracker, rest timers, and audio tempo cadence.
5. Send me your thoughts directly via the in-app messaging tab or reply to this email anytime.

------------------------------------------------------------
YOUR EXACT STEP-BY-STEP ONBOARDING FUNNEL
------------------------------------------------------------

STEP 1: Test Drive the Plan Matching Quiz (Optional, 2 mins)
Start by exploring our intake quiz to see how new clients are matched with their training plans:
https://forge-athletic.app/apply
(Note: You don't need to purchase anything at the end—your top-tier VIP plan is already unlocked on the house!)

STEP 2: Log Into Your VIP Account
Head to the member sign-in page:
https://forge-athletic.app/auth/login
• Email: ${CLIENT_EMAIL}
• Temporary Password: ${CLIENT_PASSWORD}
(You can change your password anytime under Settings > Security once logged in.)

STEP 3: Add to Your iPhone Home Screen (Crucial for Mobile)
Forge Athletic is designed as a full-screen mobile app:
1. Open https://forge-athletic.app in Safari on your iPhone.
2. Tap the Safari Share button (the square with an arrow pointing upward at the bottom of the screen).
3. Scroll down and tap "Add to Home Screen".
4. Tap "Add" in the top-right corner.
5. Launch Forge Athletic from your iPhone Home Screen icon. This unlocks full-screen mode without browser bars, keeps your screen awake during rest timers, and enables audio metronome tones.

STEP 4: Complete Your Baseline Fitness & Health Intake
Once logged in, you will see a prominent gold banner: "COMPLETE YOUR BASELINE FITNESS SETUP".
Tap "Start Setup" or go directly to:
https://forge-athletic.app/dashboard/onboarding

Please complete the intake screens:
• Baseline Vitals: Your height, weight, and fitness background.
• Training Goals & Schedule: Tell the system your primary goal (e.g., strength, body composition, athletic endurance), how many days a week you want to train, and what equipment you have access to (home dumbbells, kettlebells, or a full gym).
• PAR-Q+ Health Questionnaire: Standard 7 medical screening questions.
• Emergency Remote Action Plan (ERAP): Street address and emergency contact (standard safety protocol for remote athletic training).
• Digital Signature: Sign your name and submit.

STEP 5: Your Custom Training Plan Deployment
The moment you submit your intake, our AI programming engine will analyze your answers and generate your periodized NASM OPT™ training macrocycle. I will review and certify your custom plan through our coach safety gate, and it will immediately populate on your dashboard under "Today" and "Training & Progress".

STEP 6: Test Your First Workout & Give Feedback
• Open Day 1 of your new program.
• Try tapping an exercise to see the video demonstration and coaching cues.
• Try logging a set to test the audio cadence metronome and rest countdown.
• Tap the "Messages" tab at the bottom to send me a direct message letting me know how the onboarding felt!

Thank you again for helping shape Forge Athletic. Let me know if you run into any questions getting logged in!

Best,
Coach Gordon
Forge Athletic
coach@forge-athletic.app
`

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; padding: 24px 16px; margin: 0; }
    .card { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0B1523; padding: 28px 24px; text-align: center; border-bottom: 2px solid #C5A059; }
    .header h1 { margin: 0; color: #ffffff; font-size: 24px; letter-spacing: 0.05em; text-transform: uppercase; }
    .header p { margin: 6px 0 0; color: #C5A059; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }
    .content { padding: 32px 28px; }
    .box { background: #f1f5f9; border-left: 4px solid #C5A059; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 24px 0; }
    .box h3 { margin: 0 0 8px; color: #0B1523; font-size: 15px; }
    .step-badge { display: inline-block; background: #C5A059; color: #0B1523; font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; margin-right: 6px; }
    .btn { display: inline-block; background: #C5A059; color: #0B1523; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; margin: 12px 0; }
    .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Forge Athletic</h1>
      <p>VIP Beta Tester Access</p>
    </div>
    <div class="content">
      <p>Hi Connor,</p>
      <p>Thank you so much for agreeing to be one of our premier beta testers for <strong>Forge Athletic</strong>!</p>
      <p>I’ve set you up with our highest-tier VIP membership—our <strong>Executive 1:1 Coach Support</strong> plan with all clinical suites, Form Lab video reviews, and nutrition tools comped. Because you are testing the brand-new platform, I want you to experience the complete client onboarding funnel from start to finish so we can calibrate your training protocol specifically around your personal fitness goals and the equipment you have available.</p>

      <div class="box">
        <h3>What is Expected of a Beta Tester</h3>
        <ol style="margin: 0; padding-left: 20px;">
          <li>Walk through every screen without skipping questions so we can test the intake logic.</li>
          <li>Install the app on your iPhone Home Screen (directions below) to test the mobile companion during a workout.</li>
          <li>Don't hold back: Tell me if anything feels confusing, clunky, slow, or broken.</li>
          <li>Try logging a workout to test the exercise tracker, rest timers, and audio tempo cadence.</li>
          <li>Send me your thoughts directly via the in-app messaging tab or reply to this email anytime.</li>
        </ol>
      </div>

      <h3 style="color: #0B1523; margin-top: 32px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Your Step-by-Step Onboarding Funnel</h3>

      <div style="margin-bottom: 24px;">
        <p><span class="step-badge">Step 1</span> <strong>Plan Matching Quiz (Optional, 2 mins)</strong></p>
        <p>Explore our intake quiz to see how new clients are matched with their training plans: <br><a href="https://forge-athletic.app/apply" style="color: #b4852c; font-weight: 600;">forge-athletic.app/apply</a><br><small style="color: #64748b;">(You don't need to purchase anything at the end—your top-tier VIP plan is already unlocked on the house!)</small></p>
      </div>

      <div style="margin-bottom: 24px;">
        <p><span class="step-badge">Step 2</span> <strong>Log Into Your VIP Account</strong></p>
        <p>Sign in at <a href="https://forge-athletic.app/auth/login" style="color: #b4852c; font-weight: 600;">forge-athletic.app/auth/login</a></p>
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px 16px; font-family: monospace; font-size: 13px;">
          Email: <strong>${CLIENT_EMAIL}</strong><br>
          Temporary Password: <strong>${CLIENT_PASSWORD}</strong>
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <p><span class="step-badge">Step 3</span> <strong>Add to Your iPhone Home Screen</strong></p>
        <p>Forge Athletic is built as a full-screen mobile app:</p>
        <ol style="margin: 0; padding-left: 20px; font-size: 14px;">
          <li>Open <a href="https://forge-athletic.app" style="color: #b4852c;">forge-athletic.app</a> in <strong>Safari</strong> on your iPhone.</li>
          <li>Tap the Safari <strong>Share button</strong> (square with arrow pointing up).</li>
          <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
          <li>Tap <strong>Add</strong> in the top-right corner.</li>
          <li>Launch Forge Athletic from your Home Screen.</li>
        </ol>
      </div>

      <div style="margin-bottom: 24px;">
        <p><span class="step-badge">Step 4</span> <strong>Complete Baseline Fitness & Health Setup</strong></p>
        <p>On your dashboard, tap the gold banner <strong>"COMPLETE YOUR BASELINE FITNESS SETUP"</strong> or visit <a href="https://forge-athletic.app/dashboard/onboarding" style="color: #b4852c; font-weight: 600;">forge-athletic.app/dashboard/onboarding</a>.</p>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
          <li><strong>Vitals:</strong> Height, weight, age, and biological sex.</li>
          <li><strong>Goals & Equipment:</strong> Your primary goal, workout days, and available gym/home equipment.</li>
          <li><strong>PAR-Q+ & ERAP:</strong> Standard 7 medical screening questions and emergency dispatch address.</li>
          <li><strong>Signature:</strong> Electronic consent and signature.</li>
        </ul>
      </div>

      <div style="margin-bottom: 24px;">
        <p><span class="step-badge">Step 5</span> <strong>Your Custom Training Plan Deployment</strong></p>
        <p>As soon as you submit your intake, our AI engine will generate your periodized NASM OPT™ training macrocycle. I will review and certify your custom plan through our coach safety gate, and it will immediately populate on your dashboard under "Today" and "Training & Progress".</p>
      </div>

      <div style="margin-bottom: 24px;">
        <p><span class="step-badge">Step 6</span> <strong>Test Your First Workout & Give Feedback</strong></p>
        <p>Open Day 1, try the audio tempo metronome and rest timer, and message me directly in the app's <strong>Messages</strong> tab with your candid impressions!</p>
      </div>

      <p style="margin-top: 32px;">Thank you again for helping shape Forge Athletic!<br><br>Best,<br><strong>Coach Gordon</strong><br>Forge Athletic<br><a href="mailto:coach@forge-athletic.app" style="color: #b4852c;">coach@forge-athletic.app</a></p>
    </div>
    <div class="footer">
      Forge Athletic LLC · Online Personal Training & Performance Coaching<br>
      Massachusetts, Coaching Nationwide
    </div>
  </div>
</body>
</html>
`

  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY missing')
    process.exit(1)
  }

  const resend = new Resend(resendApiKey)
  const result = await resend.emails.send({
    from: fromEmail,
    to: CLIENT_EMAIL,
    replyTo: replyTo,
    subject: subject,
    text: textBody,
    html: htmlBody,
  })

  if (result.error) {
    console.error('❌ Failed to dispatch email:', result.error)
    process.exit(1)
  }

  console.log(`🎉 EMAIL DISPATCHED TO CONNOR SUCCESSFULLY!`)
  console.log(`Resend ID: ${result.data?.id}`)
  console.log(`Recipient: ${CLIENT_EMAIL}\n`)

  console.log('================================================================')
  console.log('🎉 CONNOR GORDON ACCOUNT PROVISIONED, RESET & NOTIFIED!')
  console.log('================================================================')
}

setupConnor().catch(err => {
  console.error('❌ Error provisioning Connor:', err)
  process.exit(1)
})
