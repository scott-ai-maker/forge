/**
 * Forge Athletic — Master Coach Gordon Types & Client-Safe Helpers
 * 
 * Lightweight client-safe definitions and pure telemetry formatters.
 * Contains ZERO imports of heavy server knowledge bases or databases.
 */

export interface CoachActionRecommendation {
  type: 'swap_exercise' | 'start_timer' | 'form_critique' | 'auto_regulate_load'
  targetExerciseName?: string
  restSeconds?: number
  loadReductionPercent?: number
  cueTitle?: string
  buttonText: string
}

export interface AskCoachGordonRequest {
  question: string
  athleteName?: string
  clientAge?: number
  clientSex?: 'male' | 'female'
  goal?: string
  nasmOptPhase?: number
  currentWorkoutFocus?: string
  currentExerciseName?: string
  equipmentAccess?: string[]
  cardioEquipmentAccess?: string[]
  kineticCompensations?: string[]
  recentReadinessScore?: number
  recentSleepHours?: number
  recentRpe?: number
  activeConversationHistory?: Array<{ role: 'user' | 'assistant'; text: string }>
}

export interface AskCoachGordonResponse {
  answerMarkdown: string
  spokenAudioText: string
  relevantCurriculums: string[]
  recommendedAction?: CoachActionRecommendation
  suggestedFollowUps: string[]
  requiresCoachPing?: boolean
  coachPingReason?: string
  isEmergency911?: boolean
}

export type ClinicalUrgencyTier = 'EMERGENCY_911' | 'SERIOUS_MEDICAL_REFERRAL' | 'STANDARD_TRAINING'

export interface ClinicalTriageEvaluation {
  tier: ClinicalUrgencyTier
  isEmergency911: boolean
  requiresCoachPing: boolean
  pingReason?: string
  overrideMarkdown?: string
  overrideAudioText?: string
}

/**
 * Generates an empathetic, proactive telemetry-aware greeting on modal open.
 */
export function deriveProactiveTelemetryGreeting(params: {
  athleteName?: string
  nasmOptPhase?: number
  goal?: string
  recentReadinessScore?: number
  recentSleepHours?: number
  recentRpe?: number
  currentExerciseName?: string
  currentWorkoutFocus?: string
}): { text: string; audioText: string; recommendedAction?: CoachActionRecommendation } {
  const {
    athleteName = 'Athlete',
    nasmOptPhase = 1,
    goal = 'fat_loss',
    recentReadinessScore = 82,
    recentSleepHours,
    recentRpe,
    currentExerciseName,
    currentWorkoutFocus,
  } = params

  const cleanGoal = goal.replace('_', ' ').toUpperCase()
  const focusClause = currentWorkoutFocus ? ` focusing on **${currentWorkoutFocus}**` : ''

  if (recentSleepHours !== undefined && recentSleepHours < 5.5) {
    const text = `**Coach Scott Gordon here.** I'm dialed into your live telemetry, ${athleteName}.${focusClause ? ` For today's session${focusClause},` : ''} I noticed your sleep was only **${recentSleepHours} hours** last night and readiness is **${recentReadinessScore}%**. \n\nWe train for the next 20 years, not just 20 minutes. I recommend we **auto-regulate working loads down 15%** today and lock into Phase ${nasmOptPhase} tempo control to protect your nervous system. How is your energy feeling right now on the floor?`
    const audioText = `Coach Scott Gordon here. I noticed your sleep was ${recentSleepHours} hours last night. Let us auto-regulate working loads down 15% today to protect your recovery. How is your energy feeling right now on the gym floor?`
    return {
      text,
      audioText,
      recommendedAction: {
        type: 'auto_regulate_load',
        loadReductionPercent: 15,
        buttonText: 'Auto-Regulate: Drop Working Weight 15%',
      },
    }
  }

  if (recentRpe !== undefined && recentRpe >= 9) {
    const text = `**Coach Scott Gordon here.** I see you just logged an **RPE ${recentRpe}** on ${currentExerciseName || 'your last set'}, ${athleteName}. Outstanding intensity! \n\nSince that set was near muscular failure, let's take a full **90 to 120-second rest** before your next set to restore intracellular ATP and prevent form breakdown. Need an exercise calibration or rest timer?`
    const audioText = `Coach Scott Gordon here. I see your last set was an RPE ${recentRpe}. Let us take a full 90 to 120-second rest before your next set to restore ATP and protect your spine.`
    return {
      text,
      audioText,
      recommendedAction: {
        type: 'start_timer',
        restSeconds: 90,
        buttonText: 'Start 90s Rest Timer (Spoken in Earbuds)',
      },
    }
  }

  const text = `**Coach Scott Gordon here.** I'm dialed into your live telemetry, ${athleteName} (Phase ${nasmOptPhase} · ${cleanGoal}${currentWorkoutFocus ? ` · ${currentWorkoutFocus}` : ''} · Readiness ${recentReadinessScore}%). \n\nHow can I calibrate your training, form cues, nutrition, or recovery right now on the gym floor?`
  const audioText = `Coach Scott Gordon here. I am dialed into your live telemetry. How can I calibrate your training, form cues, nutrition, or recovery right now?`

  return { text, audioText }
}

/**
 * Performs immediate clinical safety triage for emergency red flags and structural injuries.
 */
export function evaluateClinicalUrgencyTriage(question: string): ClinicalTriageEvaluation {
  const q = question.toLowerCase()

  // Helper matching functions
  const has = (...terms: string[]) => terms.some(t => q.includes(t))

  // 1. Emergency Red Flags (Call 911 / ER)
  const isEmergency =
    // Cardiac / Pulmonary
    (has('chest') && has('pain', 'tight', 'pressure', 'heavy')) ||
    has('heart racing', 'palpitations', 'shortness of breath', 'can\'t breathe', 'cant breathe', 'trouble breathing', 'difficulty breathing') ||
    // Neurological / Loss of Consciousness / Stroke
    has('passed out', 'fainted', 'loss of consciousness', 'blackout', 'syncope', 'severe dizziness', 'sudden dizziness', 'vision went black', 'stroke', 'seizure', 'facial droop', 'slurred speech', 'paralyzed') ||
    has('cauda equina', 'numbness in groin', 'numb groin', 'lost bowel control', 'lost bladder control') ||
    (has('legs') && has('gave out', 'give out', 'can\'t feel', 'cant feel')) ||
    // Acute Traumatic Trauma / Dropped Loads
    (has('neck') && has('barbell', 'bar', 'weight', 'dropped', 'pinned')) ||
    (has('dropped') && (has('plate', 'dumbbell') && has('foot', 'head', 'face', 'neck', 'chest'))) ||
    has('bone sticking out', 'bone broke through', 'compound fracture', 'open fracture', 'crushed throat') ||
    (has('dislocated') && has('shoulder', 'joint', 'elbow', 'hip', 'knee', 'can\'t move', 'cant move')) ||
    (has('concussion') || (has('hit my head', 'head injury') && has('vomiting', 'dizzy', 'blackout'))) ||
    // Tendon Rupture / Inability to Bear Weight
    (has('achilles', 'patellar', 'tendon', 'hamstring', 'quad', 'calf', 'joint', 'knee', 'ankle') &&
      has('pop', 'snap', 'gunshot', 'snapped', 'popped', 'torn') &&
      has('cannot walk', 'can\'t walk', 'cant walk', 'cannot bear weight', 'can\'t put weight', 'cant put weight', 'unable to walk', 'unable to bear weight', 'can\'t walk', 'cannot walk')) ||
    (has('bicep') && has('rolled up', 'popeye', 'detached', 'tear', 'tore')) ||
    // Exertional Emergencies (Rhabdo / Heat Stroke)
    (has('urine') && (has('brown', 'tea', 'cola', 'dark'))) ||
    has('rhabdo', 'rhabdomyolysis', 'heat stroke') ||
    (has('sauna', 'hot') && has('confused', 'stopped sweating', 'chills'))

  if (isEmergency) {
    const overrideMarkdown = `**EMERGENCY MEDICAL DIRECTIVE — STOP ALL ACTIVITY IMMEDIATELY**

Based on the acute symptoms you described, **please stop all physical activity immediately and call 911 or proceed to the nearest emergency room.**

Do not attempt to stretch, foam roll, or continue training. Cardiac symptoms, sudden loss of motor control, acute neurovascular disruption, exertional rhabdomyolysis, tendon ruptures, or traumatic fractures require immediate emergency medical care.

*Your health and safety are the absolute top priority. I have triggered an urgent critical notification to Coach Scott Gordon.*`

    const overrideAudioText = `Stop all activity immediately. Based on your symptoms, this requires urgent medical attention. Please call 911 or proceed to the nearest emergency room immediately. Do not attempt to stretch or continue lifting. Your safety is our absolute top priority.`

    return {
      tier: 'EMERGENCY_911',
      isEmergency911: true,
      requiresCoachPing: true,
      pingReason: `URGENT EMERGENCY: Critical red flag symptoms detected in query ("${question}"). Instructed to call 911 immediately.`,
      overrideMarkdown,
      overrideAudioText,
    }
  }

  // 2. Serious Structural Orthopedic Injuries / Medical Diagnoses (Out of Scope -> Medical Referral + Ping Scott)
  const isSeriousInjury =
    has('surgery', 'surgical', 'post-op', 'post op', 'operation', 'knee replacement', 'hip replacement', 'arthroscopy', 'spinal fusion') ||
    has('herniated', 'herniation', 'bulging disc', 'sciatica', 'spondylolisthesis') ||
    has('torn acl', 'torn mcl', 'torn lcl', 'torn pcl', 'torn meniscus', 'torn rotator cuff', 'rotator cuff tear', 'labrum tear', 'torn labrum', 'torn bicep', 'torn tendon', 'muscle tear') ||
    has('fracture', 'broken bone', 'stress fracture', 'avulsion') ||
    has('shooting electrical pain', 'sharp shooting pain', 'pinched nerve', 'radiating pain down leg', 'numbness and tingling') ||
    has('mri showed', 'x-ray showed', 'orthopedic surgeon said', 'doctor told me i have', 'cortisone injection') ||
    has('hernia', 'groin bulge', 'inguinal hernia', 'umbilical hernia', 'abdominal bulge') ||
    has('compartment syndrome', 'pacemaker', 'cardiac stent')

  if (isSeriousInjury) {
    const overrideMarkdown = `I need you to stop this workout right now. Diagnosing, treating, or prescribing exercise for acute structural injuries, ligament/tendon tears, spinal disc herniations, or post-surgical joints is **strictly outside the professional scope of personal training and sports science**.

We never take risks with your spine or structural joints. Please schedule an evaluation with an orthopedic physician or licensed physical therapist for clinical diagnostic imaging (MRI/X-ray) and formal medical clearance before continuing any loaded training.

I have flagged your training log and pinged Coach Scott Gordon directly on his private concierge line. Once your medical doctor evaluates and clears you, Scott and your physical therapist will coordinate directly to design a customized, safe adaptation protocol.`

    const overrideAudioText = `I need you to stop this workout right now. Diagnosing or training through acute structural injuries, tears, or post-surgical joints is strictly outside the scope of personal training. Please consult an orthopedic physician or physical therapist for clinical evaluation and imaging. I have flagged this and pinged Coach Scott Gordon on his private line so we can coordinate your modified programming once you are medically cleared.`

    return {
      tier: 'SERIOUS_MEDICAL_REFERRAL',
      isEmergency911: false,
      requiresCoachPing: true,
      pingReason: `Out of Scope / Structural Injury: Client referred to physician/PT; Coach Scott Gordon notified for 1-on-1 coordination.`,
      overrideMarkdown,
      overrideAudioText,
    }
  }

  return {
    tier: 'STANDARD_TRAINING',
    isEmergency911: false,
    requiresCoachPing: false,
  }
}

