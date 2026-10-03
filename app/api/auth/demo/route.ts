import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase'
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit'

const DEMO_EMAIL = process.env.DEMO_USER_EMAIL || 'vip.athlete@gordonathleticadvisory.com'
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'DemoAthlete2026!GAA'

const COACH_DEMO_EMAIL = process.env.TEST_COACH_EMAIL || 'scott.gordon72@outlook.com'
const COACH_DEMO_PASSWORD = process.env.TEST_COACH_PASSWORD || 'CoachGordon2026!GAA'
const COACH_DEMO_NAME = 'Coach Scott Gordon'

const MASTER_DEMO_PLAN_JSON = {
  name: 'Phase 2: Strength Endurance & Power Contrast',
  goal: 'Athletic Hypertrophy & Stability',
  nasmOptPhase: 2,
  phaseName: 'Phase 2: Strength Endurance',
  sessionsPerWeek: 3,
  estimatedDurationMins: 60,
  workouts: [
    {
      day: 1,
      focus: 'Push / Pull Supercompensation Contrast',
      scheduledDate: new Date().toISOString().split('T')[0],
      exercises: [
        {
          name: 'Barbell Bench Press',
          sets: 4,
          reps: '8-10',
          tempo: '2-0-2-0',
          restSeconds: 60,
          intensityPercentage1RM: 75,
          supersetPairWith: 'Standing Cable Row',
          coachingCues: ['Retract scapulae into bench', 'Drive heels into floor', 'Lower bar with 2s eccentric control'],
        },
        {
          name: 'Standing Cable Row',
          sets: 4,
          reps: '10-12',
          tempo: '2-0-2-0',
          restSeconds: 60,
          intensityPercentage1RM: 70,
          coachingCues: ['Neutral athletic stance', 'Drive elbows past torso', 'Squeeze mid-traps and rhomboids'],
        },
        {
          name: 'Barbell Back Squat',
          sets: 4,
          reps: '8-10',
          tempo: '2-0-2-0',
          restSeconds: 75,
          intensityPercentage1RM: 75,
          coachingCues: ['Chest proud', 'Knees tracking second toe', 'Drive through midfoot'],
        },
        {
          name: 'Romanian Deadlift (RDL)',
          sets: 3,
          reps: '10-12',
          tempo: '3-1-1-0',
          restSeconds: 60,
          intensityPercentage1RM: 70,
          coachingCues: ['Hinge hips back toward wall', 'Keep bar glued to thighs', 'Feel high hamstring tension'],
        },
        {
          name: 'Dumbbell Bicep Curl',
          sets: 3,
          reps: '10-12',
          tempo: '2-0-2-0',
          restSeconds: 45,
          supersetPairWith: 'Cable Tricep Pushdown',
          coachingCues: ['Elbows pinned to ribcage', 'Full supination at peak', 'Controlled 2s eccentric'],
        },
        {
          name: 'Cable Tricep Pushdown',
          sets: 3,
          reps: '12-15',
          tempo: '2-0-2-0',
          restSeconds: 60,
          coachingCues: ['Keep shoulders back', 'Flare rope at lockout', 'Full elbow extension'],
        },
      ],
      cardio: {
        title: 'Stage 2 Lactate Threshold Intervals',
        protocolType: 'stage_interval_conditioning',
        stage: 2,
        stageName: 'Stage 2: Lactate Threshold',
        targetZone: 'Zone 2-3',
        targetBpmRange: '145-165 BPM',
        targetRpe: '7-8 / 10',
        durationMins: 15,
        workRestRatio: '1:2 Work/Rest (60s ON / 120s OFF)',
        recommendedModalities: ['Treadmill Incline Sprints', 'Assault AirBike', 'Rowing Ergometer'],
      },
    },
    {
      day: 2,
      focus: 'Posterior Chain & Unilateral Strength',
      exercises: [
        {
          name: 'Trap Bar Deadlift',
          sets: 4,
          reps: '6-8',
          tempo: '2-1-1-0',
          restSeconds: 90,
          intensityPercentage1RM: 80,
          coachingCues: ['Pack lats and set thoracic spine', 'Push the floor away', 'Lock out glutes firmly'],
        },
        {
          name: 'Bulgarian Split Squat',
          sets: 3,
          reps: '10-12 / leg',
          tempo: '2-0-2-0',
          restSeconds: 60,
          intensityPercentage1RM: 65,
          coachingCues: ['Vertical front shin', 'Lower back knee towards mat', 'Drive through front heel'],
        },
        {
          name: 'Incline Dumbbell Chest Press',
          sets: 4,
          reps: '8-10',
          tempo: '2-0-2-0',
          restSeconds: 60,
          intensityPercentage1RM: 75,
          supersetPairWith: 'Wide-Grip Lat Pulldown',
          coachingCues: ['30-degree bench angle', 'Tuck elbows 45 degrees', 'Press upward in smooth arc'],
        },
        {
          name: 'Wide-Grip Lat Pulldown',
          sets: 4,
          reps: '10-12',
          tempo: '2-0-2-0',
          restSeconds: 60,
          intensityPercentage1RM: 70,
          coachingCues: ['Drive elbows straight down', 'Chest up to bar', 'Control the 2s stretch'],
        },
        {
          name: 'Standing Lateral Dumbbell Raise',
          sets: 3,
          reps: '12-15',
          tempo: '2-0-1-1',
          restSeconds: 45,
          coachingCues: ['Lead with elbows', 'Slight forward lean', 'Pause 1s at horizontal'],
        },
      ],
    },
    {
      day: 3,
      focus: 'Athletic Power & Kinetic Armor',
      exercises: [
        {
          name: 'Standing Dumbbell Push Press',
          sets: 4,
          reps: '6-8',
          tempo: '1-0-X-0',
          restSeconds: 75,
          intensityPercentage1RM: 75,
          coachingCues: ['Quick 3-inch knee dip', 'Triple extension drive', 'Lock overhead with ribs locked down'],
        },
        {
          name: 'Medicine Ball Overhead Slam',
          sets: 4,
          reps: '10',
          tempo: '1-0-X-0',
          restSeconds: 60,
          coachingCues: ['Full triple extension reach', 'Engage core violently', 'Slam ball into turf'],
        },
        {
          name: 'Goblet Squat',
          sets: 3,
          reps: '12-15',
          tempo: '2-1-2-0',
          restSeconds: 60,
          intensityPercentage1RM: 65,
          coachingCues: ['Hold dumbbell tight to chest', 'Knees out wide', '1s pause in deep hole'],
        },
        {
          name: 'McGill Curl-Up & Side Plank Matrix',
          sets: 3,
          reps: '45s / side',
          tempo: 'Isometric',
          restSeconds: 45,
          coachingCues: ['Brace 360 abdominal cylinder', 'Maintain neutral lumbar spine', 'Breathe into braced wall'],
        },
      ],
    },
  ],
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const isCoach = searchParams.get('role') === 'coach' || searchParams.get('as') === 'coach'

  const allowDemo = process.env.ENABLE_DEMO_LOGIN === 'true' || process.env.NODE_ENV === 'development'
  // Master Coach Fast Pass is always authorized for Coach Scott Gordon across production and dev
  const isAuthorized = isCoach || allowDemo
  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Demo authentication is disabled in this environment.' },
      { status: 403 }
    )
  }

  const ip = getClientIp(request)
  const rateLimit = await enforceRateLimit({
    key: `auth:demo:${ip}`,
    limit: 10,
    windowSeconds: 60,
    route: '/api/auth/demo',
    dimension: 'ip',
  })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many demo login requests. Please try again later.' },
      { status: 429 }
    )
  }

  const targetEmail = isCoach ? COACH_DEMO_EMAIL : DEMO_EMAIL
  const targetPassword = isCoach ? COACH_DEMO_PASSWORD : DEMO_PASSWORD
  const redirectPath = isCoach ? '/coach' : '/dashboard/fitness?workspace=train'

  const { origin } = new URL(request.url)
  const redirectUrl = new URL(redirectPath, origin)
  const response = NextResponse.redirect(redirectUrl.toString())

  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (supabaseUrl && !supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    supabaseUrl = `https://${supabaseUrl}`
  }

  const supabase = createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const admin = supabaseAdmin()

  // 1. Check or Create Demo User
  let userId: string | null = null

  const { data: userList } = await admin.auth.admin.listUsers()
  const existingUser = userList?.users?.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase())

  if (existingUser) {
    userId = existingUser.id
  } else {
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: targetEmail,
      password: targetPassword,
      email_confirm: true,
      user_metadata: {
        full_name: isCoach ? COACH_DEMO_NAME : 'VIP Demo Athlete',
        display_name: isCoach ? COACH_DEMO_NAME : 'VIP Demo Athlete',
        surface_role: isCoach ? 'coach' : 'client',
      },
    })
    if (newUser?.user) {
      userId = newUser.user.id
    } else if (createError) {
      console.warn('[DemoAuth] User creation error:', createError)
    }
  }

  // 2. Sign In to establish session
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: targetEmail,
    password: targetPassword,
  })

  if (signInError && userId) {
    // If password mismatch, update password and re-attempt sign in
    await admin.auth.admin.updateUserById(userId, {
      password: targetPassword,
      email_confirm: true,
      user_metadata: {
        ...(existingUser?.user_metadata || {}),
        surface_role: isCoach ? 'coach' : 'client',
        must_reset_password: false,
      },
    })
    await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: targetPassword,
    })
  }

  // 3. Ensure Client Record & Configuration
  if (userId) {
    try {
      await admin.from('clients').upsert({
        id: userId,
        email: targetEmail,
        full_name: isCoach ? COACH_DEMO_NAME : 'VIP Demo Athlete',
        role: isCoach ? 'coach' : 'client',
        status: 'active',
        must_reset_password: false,
      }, { onConflict: 'id' })
    } catch {
      // Non-blocking
    }

    if (!isCoach) {
      try {
        await admin.from('fitness_profiles').upsert({
          user_id: userId,
          preferred_units: 'imperial',
          age: 32,
          sex: 'male',
          fitness_goal: 'Strength & Power',
          onboarding_completed_at: new Date().toISOString(),
          primary_telemetry_source: 'apple_health',
        }, { onConflict: 'user_id' })
      } catch {
        // Non-blocking
      }

      try {
        const { data: existingPlans } = await admin
          .from('workout_plans')
          .select('id')
          .eq('user_id', userId)
          .limit(1)

        if (!existingPlans || existingPlans.length === 0) {
          await admin.from('workout_plans').insert({
            user_id: userId,
            name: 'Phase 2: Strength Endurance & Power Contrast',
            goal: 'Athletic Hypertrophy & Stability',
            nasm_opt_phase: 2,
            phase_name: 'Phase 2: Strength Endurance',
            sessions_per_week: 3,
            estimated_duration_mins: 60,
            plan_json: MASTER_DEMO_PLAN_JSON,
          })
        }
      } catch {
        // Non-blocking
      }
    }
  }

  return response
}
