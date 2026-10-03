export type MovementPattern =
  | 'squat'
  | 'hinge'
  | 'horizontal_push'
  | 'vertical_pull'
  | 'horizontal_row'
  | 'overhead_press'
  | 'lunge_split'
  | 'core_rotation'
  | 'isolation_arms'

export type DiscomfortArea =
  | 'shoulder'
  | 'lower_back'
  | 'knee'
  | 'elbow'
  | 'wrist'
  | 'equipment_busy'
  | 'runners_knee'
  | 'tennis_elbow'
  | 'golfers_elbow'
  | 'jumpers_knee'
  | 'it_band'
  | 'shin_splints'
  | 'plantar_fasciitis'
  | 'rotator_cuff'
  | 'hamstring'
  | 'achilles'
  | 'ankle_sprain'
  | 'hip_impingement'
  | 'cervical_spine'
  | 'groin_strain'

export interface ExerciseSubstitution {
  name: string
  category: MovementPattern
  reasoning: string
  benefitTag: 'Pain-Free Regression' | 'Machine / Cable Swap' | 'Hypertrophy Alternative' | 'Power Progression'
  prescribedTempo: string
  equipmentRequired: string
}

export function detectMovementPattern(exerciseName: string): MovementPattern {
  const name = exerciseName.toLowerCase()
  if (name.includes('squat') || name.includes('leg press')) return 'squat'
  if (name.includes('deadlift') || name.includes('rdl') || name.includes('hip thrust') || name.includes('good morning')) return 'hinge'
  if (name.includes('bench') || name.includes('push-up') || name.includes('chest fly') || name.includes('dip')) return 'horizontal_push'
  if (name.includes('lat pulldown') || name.includes('pull-up') || name.includes('chin-up')) return 'vertical_pull'
  if (name.includes('row') || name.includes('face pull')) return 'horizontal_row'
  if (name.includes('overhead') || name.includes('shoulder press') || name.includes('lateral raise') || name.includes('military')) return 'overhead_press'
  if (name.includes('split') || name.includes('lunge') || name.includes('step-up')) return 'lunge_split'
  if (name.includes('woodchop') || name.includes('plank') || name.includes('pallof') || name.includes('twist')) return 'core_rotation'
  if (name.includes('curl') || name.includes('tricep') || name.includes('extension') || name.includes('pushdown')) return 'isolation_arms'
  return 'horizontal_push'
}

export function getSmartSubstitutions(
  currentExerciseName: string,
  optPhase = 'Phase 2: Strength Endurance',
  discomfort?: DiscomfortArea
): ExerciseSubstitution[] {
  const pattern = detectMovementPattern(currentExerciseName)
  const results: ExerciseSubstitution[] = []

  const isPhase1 = /phase 1|stabilization/i.test(optPhase)
  const isPhase4 = /phase 4|max.*strength/i.test(optPhase)
  const isPhase5 = /phase 5|power/i.test(optPhase)

  // ── Targeted Sports Injury Interventions ──
  if (discomfort === 'tennis_elbow' || (discomfort === 'elbow' && (pattern === 'isolation_arms' || pattern === 'horizontal_row'))) {
    return [
      {
        name: 'Standing Dumbbell Hammer Curl (Strict Neutral Grip, Heads Vertical)',
        category: 'isolation_arms',
        reasoning: 'Strict neutral hammer grip (palms facing inward toward each other with strictly zero twisting or supination). Dumbbells remain oriented vertically with thumbs up.',
        benefitTag: 'Pain-Free Regression',
        prescribedTempo: isPhase1 ? '4-2-1' : '2-0-2',
        equipmentRequired: 'Dumbbells',
      },
      {
        name: 'Chest-Supported Neutral-Grip Dumbbell Row',
        category: 'horizontal_row',
        reasoning: 'Neutral/parallel handles eliminate extensor tensile shear force across the lateral epicondyle.',
        benefitTag: 'Pain-Free Regression',
        prescribedTempo: isPhase1 ? '4-2-1' : '2-1-2',
        equipmentRequired: 'Incline Bench + Dumbbells',
      },
      {
        name: 'Cable Rope Neutral-Grip Pushdown',
        category: 'isolation_arms',
        reasoning: 'Rope allows natural neutral wrist tracking and self-adjusting joint plane without rigid barbell torque.',
        benefitTag: 'Pain-Free Regression',
        prescribedTempo: '3-0-1',
        equipmentRequired: 'Cable Stack + Rope Attachment',
      },
    ]
  }

  if (discomfort === 'runners_knee') {
    return [
      {
        name: 'Spanish Squats with Heavy Loop Band',
        category: 'squat',
        reasoning: 'Closed kinetic chain eliminates anterior patellar shear while maximizing isometric VMO motor unit recruitment.',
        benefitTag: 'Pain-Free Regression',
        prescribedTempo: '3-2-1',
        equipmentRequired: 'Heavy Loop Resistance Band',
      },
      {
        name: 'Box Squat with Vertical Shins',
        category: 'squat',
        reasoning: 'Eliminates anterior tibial translation and shifts load entirely into posterior hip hinge.',
        benefitTag: 'Pain-Free Regression',
        prescribedTempo: '3-1-1',
        equipmentRequired: 'Barbell / DB + Box',
      },
      {
        name: 'Reverse Lunge from Step',
        category: 'lunge_split',
        reasoning: 'Rearward stepping vector reduces peak patellar tendon shear compared to forward lunges.',
        benefitTag: 'Pain-Free Regression',
        prescribedTempo: '2-1-2',
        equipmentRequired: 'Dumbbells',
      },
      {
        name: 'Barbell Romanian Deadlift',
        category: 'hinge',
        reasoning: 'Direct pivot to hip hinge allows patellar recovery while maintaining high volume tonnage.',
        benefitTag: 'Hypertrophy Alternative',
        prescribedTempo: '3-0-1',
        equipmentRequired: 'Barbell',
      },
    ]
  }

  if (discomfort === 'shin_splints') {
    return [
      {
        name: 'Assault / Air Bike Sprint Intervals',
        category: 'horizontal_push',
        reasoning: 'Delivers equal or superior VO2 peak and EPOC stimulus with zero impact shock to the tibia.',
        benefitTag: 'Pain-Free Regression',
        prescribedTempo: 'X-0-X',
        equipmentRequired: 'Assault / Air Bike',
      },
      {
        name: 'Standing Tibialis Anterior Wall Raises',
        category: 'squat',
        reasoning: 'Strengthens the shock-absorbing musculature of the lower leg to tolerate future impact.',
        benefitTag: 'Pain-Free Regression',
        prescribedTempo: '2-1-2',
        equipmentRequired: 'Bodyweight + Wall',
      },
      {
        name: 'Concept2 Rower Power Intervals',
        category: 'horizontal_row',
        reasoning: 'High-intensity conditioning with zero ground reaction shock to the posteromedial tibial border.',
        benefitTag: 'Machine / Cable Swap',
        prescribedTempo: '2-0-2',
        equipmentRequired: 'Rowing Machine',
      },
    ]
  }

  if (discomfort === 'plantar_fasciitis') {
    return [
      {
        name: 'High-Load Flat-Ground Calf Raise with Big Toe Elevation (Rathleff Protocol)',
        category: 'squat',
        reasoning: 'Loads the plantar fascia windlass mechanism under controlled isometric/eccentric tension without micro-tearing.',
        benefitTag: 'Pain-Free Regression',
        prescribedTempo: '3-2-3',
        equipmentRequired: 'Rolled Towel + Flat Ground',
      },
      {
        name: 'Seated High-Resistance Rowing Intervals',
        category: 'horizontal_row',
        reasoning: 'Maintains maximal cardiorespiratory conditioning while eliminating ground impact force across the arch.',
        benefitTag: 'Machine / Cable Swap',
        prescribedTempo: '2-0-1',
        equipmentRequired: 'Rowing Machine',
      },
    ]
  }

  if (discomfort === 'rotator_cuff') {
    return [
      {
        name: 'Dumbbell Neutral-Grip Floor Press',
        category: 'horizontal_push',
        reasoning: 'Floor limits shoulder hyperextension and neutral grip decompresses the subacromial space.',
        benefitTag: 'Pain-Free Regression',
        prescribedTempo: isPhase1 ? '4-2-1' : '3-1-1',
        equipmentRequired: 'Dumbbells + Mat',
      },
      {
        name: 'Half-Kneeling Landmine Press',
        category: 'horizontal_push',
        reasoning: 'Angled plane of motion provides natural scapulohumeral upward rotation with zero impingement.',
        benefitTag: 'Pain-Free Regression',
        prescribedTempo: isPhase1 ? '4-2-1' : '2-0-2',
        equipmentRequired: 'Landmine / Barbell',
      },
      {
        name: 'Standing Neutral-Grip DB Overhead Press in Scapular Plane (30° Angle)',
        category: 'overhead_press',
        reasoning: 'Opens subacromial space, preventing supraspinatus tendon pinching.',
        benefitTag: 'Pain-Free Regression',
        prescribedTempo: '3-1-1',
        equipmentRequired: 'Dumbbells',
      },
    ]
  }

  if (pattern === 'horizontal_push') {
    if (discomfort === 'shoulder') {
      results.push({
        name: 'Dumbbell Neutral-Grip Floor Press',
        category: 'horizontal_push',
        reasoning: 'Floor limits shoulder hyperextension and neutral grip decompresses the subacromial space.',
        benefitTag: 'Pain-Free Regression',
        prescribedTempo: isPhase1 ? '4-2-1' : isPhase5 ? 'X-0-X' : '3-1-1',
        equipmentRequired: 'Dumbbells + Mat',
      })
      results.push({
        name: 'Half-Kneeling Landmine Press',
        category: 'horizontal_push',
        reasoning: 'Angled plane of motion provides natural scapulohumeral upward rotation with zero impingement.',
        benefitTag: 'Pain-Free Regression',
        prescribedTempo: isPhase1 ? '4-2-1' : isPhase4 ? '1-1-1' : '2-0-2',
        equipmentRequired: 'Landmine / Barbell',
      })
      results.push({
        name: 'Standing Cable Chest Press',
        category: 'horizontal_push',
        reasoning: 'Continuous tension through mid-range with free-moving cables to auto-adjust joint path.',
        benefitTag: 'Machine / Cable Swap',
        prescribedTempo: '4-2-1',
        equipmentRequired: 'Cable Stack',
      })
    } else {
      if (isPhase5) {
        results.push({
          name: 'Medicine Ball Chest Pass',
          category: 'horizontal_push',
          reasoning: 'High-velocity contrast power movement accelerating through triple extension without decelerating at lockout.',
          benefitTag: 'Power Progression',
          prescribedTempo: 'X-0-X',
          equipmentRequired: 'Medicine Ball (8-12 lbs) + Wall',
        })
      }
      results.push({
        name: 'Dumbbell Flat Bench Press',
        category: 'horizontal_push',
        reasoning: 'Allows convergent natural pressing arc and independent bilateral limb balance.',
        benefitTag: 'Hypertrophy Alternative',
        prescribedTempo: isPhase1 ? '4-2-1' : isPhase4 ? '1-1-1' : '2-0-2',
        equipmentRequired: 'Dumbbells + Flat Bench',
      })
      results.push({
        name: 'Standing Cable Chest Press',
        category: 'horizontal_push',
        reasoning: 'High core stabilization demand with constant tension curve at lockout.',
        benefitTag: 'Machine / Cable Swap',
        prescribedTempo: '4-2-1',
        equipmentRequired: 'Cable Machine',
      })
      results.push({
        name: 'Push-Up with Feet Elevated',
        category: 'horizontal_push',
        reasoning: 'Closed-kinetic chain exercise activating serratus anterior and core stabilizing sling.',
        benefitTag: 'Pain-Free Regression',
        prescribedTempo: isPhase1 ? '4-2-1' : '2-0-2',
        equipmentRequired: 'Bodyweight + Bench',
      })
    }
  } else if (pattern === 'squat') {
    if (discomfort === 'lower_back') {
      results.push({
        name: 'Goblet Box Squat',
        category: 'squat',
        reasoning: 'Anterior load forces upright torso angle, eliminating lumbar compressive shear force.',
        benefitTag: 'Pain-Free Regression',
        prescribedTempo: '3-2-1',
        equipmentRequired: 'Kettlebell / DB + 16" Box',
      })
      results.push({
        name: 'Bulgarian Split Squat',
        category: 'squat',
        reasoning: 'Unilateral loading halves spinal axial load while quadrupling glute medius activation.',
        benefitTag: 'Pain-Free Regression',
        prescribedTempo: '2-0-2',
        equipmentRequired: 'Dumbbells + Bench',
      })
      results.push({
        name: 'Incline 45° Leg Press',
        category: 'squat',
        reasoning: 'Back is completely supported against pad; isolates quadriceps with zero spinal loading.',
        benefitTag: 'Machine / Cable Swap',
        prescribedTempo: '2-0-2',
        equipmentRequired: 'Leg Press Machine',
      })
    } else if (discomfort === 'knee') {
      results.push({
        name: 'Box Squat with Vertical Shins',
        category: 'squat',
        reasoning: 'Eliminates anterior tibial translation and shifts load entirely into posterior hip hinge.',
        benefitTag: 'Pain-Free Regression',
        prescribedTempo: '3-1-1',
        equipmentRequired: 'Barbell + Box',
      })
      results.push({
        name: 'Reverse Lunge from Step',
        category: 'squat',
        reasoning: 'Rearward stepping vector reduces peak patellar tendon shear compared to forward lunges.',
        benefitTag: 'Pain-Free Regression',
        prescribedTempo: '2-1-2',
        equipmentRequired: 'Dumbbells',
      })
      results.push({
        name: 'Barbell Romanian Deadlift',
        category: 'hinge',
        reasoning: 'Direct pivot to hip hinge to allow quad/patellar recovery while maintaining high tonnage.',
        benefitTag: 'Hypertrophy Alternative',
        prescribedTempo: '3-0-1',
        equipmentRequired: 'Barbell',
      })
    } else {
      results.push({
        name: 'Barbell Front Squat',
        category: 'squat',
        reasoning: 'Emphasizes anterior quad recruitment with higher vertical thoracic spine posture.',
        benefitTag: 'Hypertrophy Alternative',
        prescribedTempo: '2-0-2',
        equipmentRequired: 'Olympic Barbell + Rack',
      })
      results.push({
        name: 'Goblet Squat on Heel Elevation Board',
        category: 'squat',
        reasoning: 'Heel elevation removes ankle dorsiflexion restrictions for full Olympic depth.',
        benefitTag: 'Pain-Free Regression',
        prescribedTempo: '4-2-1',
        equipmentRequired: 'Kettlebell + Slant Board',
      })
      results.push({
        name: 'Incline 45° Leg Press',
        category: 'squat',
        reasoning: 'High mechanical volume overload with zero balance constraint for maximum fiber fatigue.',
        benefitTag: 'Machine / Cable Swap',
        prescribedTempo: '2-0-2',
        equipmentRequired: 'Leg Press Machine',
      })
    }
  } else if (pattern === 'hinge') {
    results.push({
      name: 'Trap Bar Deadlift (High Handles)',
      category: 'hinge',
      reasoning: 'Neutral handles place load in line with center of gravity, reducing lumbar moment arm by 22%.',
      benefitTag: 'Pain-Free Regression',
      prescribedTempo: '2-1-1',
      equipmentRequired: 'Trap Bar',
    })
    results.push({
      name: 'Dumbbell Romanian Deadlift',
      category: 'hinge',
      reasoning: 'Allows freedom of hand placement closer to shins for strict hamstring tension.',
      benefitTag: 'Hypertrophy Alternative',
      prescribedTempo: '3-0-1',
      equipmentRequired: 'Dumbbells',
    })
    results.push({
      name: 'Barbell Hip Thrust',
      category: 'hinge',
      reasoning: 'Horizontal force vector isolates gluteus maximus without spinal axial compression.',
      benefitTag: 'Hypertrophy Alternative',
      prescribedTempo: '2-1-2',
      equipmentRequired: 'Barbell + Hip Thrust Pad',
    })
  } else {
    // Default fallback
    results.push({
      name: 'Chest-Supported Dumbbell Row',
      category: 'horizontal_row',
      reasoning: 'Eliminates lower back fatigue and locks strict scapular retraction.',
      benefitTag: 'Pain-Free Regression',
      prescribedTempo: '2-1-2',
      equipmentRequired: 'Incline Bench + Dumbbells',
    })
    results.push({
      name: 'Single-Arm Cable Lat Pulldown',
      category: 'vertical_pull',
      reasoning: 'Unilateral cable allows custom humeral path of motion matching scapular plane.',
      benefitTag: 'Machine / Cable Swap',
      prescribedTempo: '3-1-1',
      equipmentRequired: 'Cable Stack',
    })
    results.push({
      name: 'Standing Half-Kneeling Cable Press',
      category: 'horizontal_push',
      reasoning: 'High anti-rotational core demand in transverse plane.',
      benefitTag: 'Pain-Free Regression',
      prescribedTempo: '4-2-1',
      equipmentRequired: 'Cable Stack',
    })
  }

  return results
}
