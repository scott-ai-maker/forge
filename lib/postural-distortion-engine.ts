/**
 * Postural Distortion Syndrome & Muscle Synergy Diagnostic Engine
 * 
 * Based on NASM CPT-7:
 * - Chapter 11: Static & Dynamic Postural Assessments
 * - Pronation Distortion Syndrome (Table 11.1)
 * - Lower Crossed Syndrome (Table 11.2)
 * - Upper Crossed Syndrome (Table 11.3)
 * - 4-Phase Corrective Exercise Continuum (Inhibit -> Lengthen -> Activate -> Integrate)
 */

export type DistortionSyndromeType =
  | 'pronation_distortion'
  | 'lower_crossed'
  | 'upper_crossed'
  | 'mixed_distortion'
  | 'optimal_alignment'

export interface PosturalObservationsInput {
  // Checkpoint 1: Feet & Ankles
  feetFlattenOrPronate: boolean
  feetTurnOut: boolean
  heelsElevate: boolean

  // Checkpoint 2: Knees
  kneesValgusInward: boolean
  kneesVarusOutward: boolean
  kneesHyperextended: boolean

  // Checkpoint 3: LPHC (Lumbo-Pelvic-Hip Complex)
  anteriorPelvicTilt: boolean
  posteriorPelvicTilt: boolean
  excessiveForwardLean: boolean
  asymmetricWeightShift: boolean

  // Checkpoint 4: Shoulders & Thoracic
  roundedShouldersProtracted: boolean
  shouldersElevated: boolean
  scapularWinging: boolean
  armsFallForward: boolean

  // Checkpoint 5: Head & Cervical Spine
  forwardHeadCarriage: boolean
  cervicalHyperextension: boolean
}

export interface MuscleSynergyPairing {
  muscleGroup: string
  overactiveMuscles: string[]
  underactiveMuscles: string[]
  reciprocalInhibitionMechanism: string
  associatedInjuryRisks: string[]
}

export interface CexPhaseItem {
  name: string
  phase: 'inhibit' | 'lengthen' | 'activate' | 'integrate'
  targetMuscle: string
  protocol: string
  coachingCue: string
}

export interface PosturalSyndromeDiagnosis {
  syndrome: DistortionSyndromeType
  title: string
  severityScore: number // 0 (Optimal) to 100 (Severe Multi-Syndrome)
  kineticChainDysfunctionLevel: 'Optimal' | 'Mild Distortion' | 'Moderate Distortion' | 'Severe Dysfunction'
  detectedSyndromes: {
    pronation: boolean
    lowerCrossed: boolean
    upperCrossed: boolean
  }
  synergyAnalysis: MuscleSynergyPairing[]
  allOveractiveMuscles: string[]
  allUnderactiveMuscles: string[]
  injuryRisks: string[]
  correctiveProtocol: {
    inhibit: CexPhaseItem[]
    lengthen: CexPhaseItem[]
    activate: CexPhaseItem[]
    integrate: CexPhaseItem[]
  }
  clinicalSummary: string
}

/**
 * Evaluates postural observations and generates clinical syndrome diagnosis
 */
export function diagnosePosturalDistortions(
  input: PosturalObservationsInput
): PosturalSyndromeDiagnosis {
  const {
    feetFlattenOrPronate,
    feetTurnOut,
    heelsElevate,
    kneesValgusInward,
    kneesVarusOutward,
    kneesHyperextended,
    anteriorPelvicTilt,
    posteriorPelvicTilt,
    excessiveForwardLean,
    asymmetricWeightShift,
    roundedShouldersProtracted,
    shouldersElevated,
    scapularWinging,
    armsFallForward,
    forwardHeadCarriage,
    cervicalHyperextension,
  } = input

  // 1. Syndrome Scoring
  let pronationScore = 0
  if (feetFlattenOrPronate) pronationScore += 3
  if (feetTurnOut) pronationScore += 2
  if (kneesValgusInward) pronationScore += 3
  if (kneesVarusOutward) pronationScore += 2
  if (heelsElevate) pronationScore += 1

  let lowerCrossedScore = 0
  if (anteriorPelvicTilt) lowerCrossedScore += 4
  if (posteriorPelvicTilt) lowerCrossedScore += 3
  if (excessiveForwardLean) lowerCrossedScore += 2
  if (kneesHyperextended) lowerCrossedScore += 1
  if (asymmetricWeightShift) lowerCrossedScore += 1

  let upperCrossedScore = 0
  if (forwardHeadCarriage) upperCrossedScore += 3
  if (roundedShouldersProtracted) upperCrossedScore += 3
  if (armsFallForward) upperCrossedScore += 2
  if (shouldersElevated) upperCrossedScore += 1
  if (scapularWinging) upperCrossedScore += 2
  if (cervicalHyperextension) upperCrossedScore += 1

  const isPronation = pronationScore >= 3
  const isLowerCrossed = lowerCrossedScore >= 3
  const isUpperCrossed = upperCrossedScore >= 3

  const totalScore = pronationScore + lowerCrossedScore + upperCrossedScore
  const severityScore = Math.min(100, Math.round((totalScore / 20) * 100))

  let syndrome: DistortionSyndromeType = 'optimal_alignment'
  let title = 'Optimal Postural Alignment'

  const activeSyndromeCount = (isPronation ? 1 : 0) + (isLowerCrossed ? 1 : 0) + (isUpperCrossed ? 1 : 0)

  if (activeSyndromeCount >= 2) {
    syndrome = 'mixed_distortion'
    title = 'Mixed Postural Distortion Syndrome'
  } else if (isPronation) {
    syndrome = 'pronation_distortion'
    title = 'Pronation Distortion Syndrome (Foot/Ankle & Knee Valgus/Varus)'
  } else if (isLowerCrossed) {
    syndrome = 'lower_crossed'
    title = posteriorPelvicTilt
      ? 'Posterior Pelvic Tilt Distortion (Flat Back / Hamstring Dominance)'
      : 'Lower Crossed Syndrome (Anterior Pelvic Tilt & Hyperlordosis)'
  } else if (isUpperCrossed) {
    syndrome = 'upper_crossed'
    title = 'Upper Crossed Syndrome (Forward Head & Rounded Shoulders)'
  }

  let dysfunctionLevel: PosturalSyndromeDiagnosis['kineticChainDysfunctionLevel'] = 'Optimal'
  if (severityScore >= 65) dysfunctionLevel = 'Severe Dysfunction'
  else if (severityScore >= 40) dysfunctionLevel = 'Moderate Distortion'
  else if (severityScore >= 15) dysfunctionLevel = 'Mild Distortion'

  // Build Muscle Synergies & Corrective Exercise items
  const synergies: MuscleSynergyPairing[] = []
  const overactive = new Set<string>()
  const underactive = new Set<string>()
  const risks = new Set<string>()

  const inhibitItems: CexPhaseItem[] = []
  const lengthenItems: CexPhaseItem[] = []
  const activateItems: CexPhaseItem[] = []
  const integrateItems: CexPhaseItem[] = []

  // PRONATION DISTORTION SYNDROME (CPT-7 Table 11.1)
  if (isPronation || feetFlattenOrPronate || kneesValgusInward || kneesVarusOutward) {
    if (kneesVarusOutward) {
      synergies.push({
        muscleGroup: 'Lateral Kinetic Chain & Knee Varus Complex',
        overactiveMuscles: ['Tensor Fasciae Latae (TFL)', 'Gluteus Medius (Posterior Fibers)', 'Piriformis', 'Biceps Femoris (Long Head)'],
        underactiveMuscles: ['Adductor Complex (Adductor Longus/Magnus)', 'Gracilis', 'Medial Hamstrings'],
        reciprocalInhibitionMechanism: 'Overactive hip abductors and rotators inhibit adductors, creating lateral knee displacement and IT band friction.',
        associatedInjuryRisks: ['Iliotibial (IT) Band Syndrome', 'Lateral Meniscus Compression', 'Lateral Patellar Tracking'],
      })
      ;['TFL', 'Gluteus Medius (Lateral)', 'Piriformis', 'Biceps Femoris'].forEach(m => overactive.add(m))
      ;['Adductor Complex', 'Gracilis', 'Medial Hamstrings'].forEach(m => underactive.add(m))
      ;['IT Band Syndrome', 'Lateral Meniscus Strain'].forEach(r => risks.add(r))

      inhibitItems.push({
        name: 'SMR TFL & IT Band Margin',
        phase: 'inhibit',
        targetMuscle: 'Tensor Fasciae Latae & Lateral Quad',
        protocol: 'Hold tender spots for 30–60s',
        coachingCue: 'Roll outer hip just anterior to greater trochanter.',
      })
      lengthenItems.push({
        name: 'Standing ITB / Lateral Hip Stretch',
        phase: 'lengthen',
        targetMuscle: 'TFL / Gluteus Medius',
        protocol: '30s hold per side',
        coachingCue: 'Cross affected leg behind and lean torso away from target side.',
      })
      activateItems.push({
        name: 'Side-Lying Adductor Leg Lift',
        phase: 'activate',
        targetMuscle: 'Adductor Complex',
        protocol: '2 sets of 12-15 reps (4/2/1 tempo)',
        coachingCue: 'Top leg crossed in front, lift bottom leg toward ceiling.',
      })
      integrateItems.push({
        name: 'Multi-Directional Lunge with Neutral Knee Tracking',
        phase: 'integrate',
        targetMuscle: 'Lower Kinetic Chain Alignment',
        protocol: '2 sets of 8-10 reps per leg',
        coachingCue: 'Keep knee aligned strictly over 2nd and 3rd toes during deceleration.',
      })
    }

    if (isPronation || feetFlattenOrPronate || kneesValgusInward) {
      synergies.push({
        muscleGroup: 'Foot, Ankle & Knee Complex (Pronation Distortion)',
        overactiveMuscles: ['Gastrocnemius (Lateral)', 'Soleus', 'Peroneal Complex', 'Adductor Complex', 'Tensor Fasciae Latae (TFL)', 'Biceps Femoris (Short Head)'],
        underactiveMuscles: ['Anterior Tibialis', 'Posterior Tibialis', 'Gluteus Medius', 'Gluteus Maximus', 'Vastus Medialis Oblique (VMO)'],
        reciprocalInhibitionMechanism: 'Hypertonic adductors and TFL alter reciprocal inhibition to weaken gluteus medius, forcing dynamic knee valgus collapse.',
        associatedInjuryRisks: ['Plantar Fasciitis', 'Posterior Tibialis Tendinitis', 'Patellofemoral Pain Syndrome (PFPS)', 'ACL Strain', 'Medial Meniscus Stress'],
      })

      ;['Lateral Gastrocnemius', 'Soleus', 'Peroneals', 'Adductors', 'TFL'].forEach(m => overactive.add(m))
      ;['Anterior Tibialis', 'Posterior Tibialis', 'Gluteus Medius', 'Gluteus Maximus', 'VMO'].forEach(m => underactive.add(m))
      ;['Plantar Fasciitis', 'Patellofemoral Pain Syndrome (PFPS)', 'ACL Tear / Strain Risk', 'Medial Meniscus Stress'].forEach(r => risks.add(r))

      inhibitItems.push(
        { name: 'SMR Calves & Peroneals', phase: 'inhibit', targetMuscle: 'Peroneals / Soleus', protocol: 'Hold tender spot for 30–60s', coachingCue: 'Roll outer calf slowly; pause on high-tension trigger points.' },
        { name: 'SMR Adductor Complex', phase: 'inhibit', targetMuscle: 'Adductors', protocol: 'Hold tender spot for 30–60s', coachingCue: 'Prone position with roller parallel to body along medial thigh.' }
      )

      lengthenItems.push(
        { name: 'Static Wall Gastroc / Soleus Stretch', phase: 'lengthen', targetMuscle: 'Gastrocnemius / Soleus', protocol: '30s hold per side', coachingCue: 'Keep back heel flat and rear foot pointing straight forward.' },
        { name: 'Static Standing Adductor Stretch', phase: 'lengthen', targetMuscle: 'Adductor Longus / Magnus', protocol: '30s hold per side', coachingCue: 'Shift weight into side lunge position with upright neutral pelvis.' }
      )

      activateItems.push(
        { name: 'Side-Lying Clamshells with Band', phase: 'activate', targetMuscle: 'Gluteus Medius', protocol: '1-2 sets of 12-15 reps (4/2/1 tempo)', coachingCue: 'Keep pelvis stacked; do not roll hips backward.' },
        { name: 'Isolated Anterior Tibialis Dorsiflexion', phase: 'activate', targetMuscle: 'Anterior Tibialis', protocol: '1-2 sets of 15 reps', coachingCue: 'Pull toes up and slightly inward against band resistance.' }
      )

      integrateItems.push(
        { name: 'Lateral Mini-Band Monster Walk', phase: 'integrate', targetMuscle: 'Gluteus Medius & VMO Tracking', protocol: '2 sets of 12-15 steps per direction', coachingCue: 'Push knees outward over 2nd/3rd toes in athletic ready position.' }
      )
    }
  }

  // LOWER CROSSED SYNDROME / PELVIC DISTORTION (CPT-7 Table 11.2)
  if (isLowerCrossed || anteriorPelvicTilt || posteriorPelvicTilt) {
    if (posteriorPelvicTilt) {
      synergies.push({
        muscleGroup: 'Lumbo-Pelvic-Hip Complex (Posterior Pelvic Tilt / Flat Back)',
        overactiveMuscles: ['Hamstrings Complex', 'Rectus Abdominis', 'External Obliques', 'Gluteus Maximus'],
        underactiveMuscles: ['Iliopsoas', 'Erector Spinae', 'Rectus Femoris', 'Intrinsic Core Stabilizers'],
        reciprocalInhibitionMechanism: 'Shortened hamstrings and rectus abdominis posteriorly tilt pelvis, flattening natural lumbar lordosis.',
        associatedInjuryRisks: ['Posterior Disc Bulge / Herniation', 'Loss of Lumbar Shock Absorption', 'Hamstring Tendinopathy'],
      })
      ;['Hamstrings', 'Rectus Abdominis', 'External Obliques'].forEach(m => overactive.add(m))
      ;['Iliopsoas', 'Erector Spinae', 'Rectus Femoris'].forEach(m => underactive.add(m))
      ;['Lumbar Disc Herniation Risk', 'Hamstring Tendinitis'].forEach(r => risks.add(r))

      inhibitItems.push({
        name: 'SMR Hamstrings & Glutes',
        phase: 'inhibit',
        targetMuscle: 'Biceps Femoris & Semitendinosus',
        protocol: 'Hold tender spot for 30–60s',
        coachingCue: 'Sit on roller, slowly sweep mid-belly of hamstrings.',
      })
      lengthenItems.push({
        name: 'Static Seated / Supine Hamstring Stretch',
        phase: 'lengthen',
        targetMuscle: 'Hamstrings Complex',
        protocol: '30s hold per side',
        coachingCue: 'Maintain slight anterior tilt and neutral spine while hinging.',
      })
      activateItems.push({
        name: 'Quadruped Bird Dog with Anterior Pelvic Neutral',
        phase: 'activate',
        targetMuscle: 'Erector Spinae & Multifidus',
        protocol: '2 sets of 10 reps per side (3s hold)',
        coachingCue: 'Maintain subtle natural lumbar arch; reach long from fingertips to heel.',
      })
      integrateItems.push({
        name: 'Kettlebell Romanian Deadlift to Balance',
        phase: 'integrate',
        targetMuscle: 'Hip Hinge & Lumbar Control',
        protocol: '2 sets of 10 reps',
        coachingCue: 'Reach hips back into deep hinge while preserving lordotic curve.',
      })
    }

    if (anteriorPelvicTilt || isLowerCrossed) {
      synergies.push({
        muscleGroup: 'Lumbo-Pelvic-Hip Complex (Lower Crossed Syndrome)',
        overactiveMuscles: ['Iliopsoas', 'Rectus Femoris', 'Tensor Fasciae Latae (TFL)', 'Erector Spinae', 'Latissimus Dorsi'],
        underactiveMuscles: ['Gluteus Maximus', 'Gluteus Medius', 'Transverse Abdominis (TVA)', 'Internal Obliques', 'Hamstrings (Complex)'],
        reciprocalInhibitionMechanism: 'Shortened hip flexors (iliopsoas) reciprocally inhibit prime hip extensors (gluteus maximus), shifting lumbar spine into compensatory shear stress.',
        associatedInjuryRisks: ['Hamstring Strain', 'Low-Back Sacroiliac (SI) Joint Pain', 'Lumbosacral Disc Compression', 'Hip Labral Impingement'],
      })

      ;['Iliopsoas', 'Rectus Femoris', 'TFL', 'Erector Spinae', 'Latissimus Dorsi'].forEach(m => overactive.add(m))
      ;['Gluteus Maximus', 'Gluteus Medius', 'Transverse Abdominis', 'Internal Obliques'].forEach(m => underactive.add(m))
      ;['Low-Back SI Joint Pain', 'Hamstring Strain', 'Lumbosacral Disc Herniation Risk', 'Hip Impingement'].forEach(r => risks.add(r))

      inhibitItems.push(
        { name: 'SMR Hip Flexor / TFL', phase: 'inhibit', targetMuscle: 'TFL / Iliopsoas', protocol: 'Hold tender spot for 30–60s', coachingCue: 'Target front pocket area just below anterior superior iliac spine.' },
        { name: 'SMR Thoracolumbar Erector Spinae', phase: 'inhibit', targetMuscle: 'Erector Spinae', protocol: 'Hold tender spot for 30–60s', coachingCue: 'Cross arms across chest to open posterior chain; avoid hyperextending low back.' }
      )

      lengthenItems.push(
        { name: 'Half-Kneeling Hip Flexor & Quad Stretch', phase: 'lengthen', targetMuscle: 'Iliopsoas & Rectus Femoris', protocol: '30s hold per side', coachingCue: 'Posteriorly tilt pelvis (tuck tailbone) and squeeze glute on back leg.' }
      )

      activateItems.push(
        { name: 'Supine Floor Bridge with Isometric Hold', phase: 'activate', targetMuscle: 'Gluteus Maximus', protocol: '2 sets of 12-15 reps (4/2/1 tempo)', coachingCue: 'Drive through heels, squeeze glutes at apex without overarching lower back.' },
        { name: 'Dead Bug with Core Bracing', phase: 'activate', targetMuscle: 'Transverse Abdominis (TVA)', protocol: '2 sets of 10 reps per side', coachingCue: 'Keep lumbar spine pinned flat against the floor throughout movement.' }
      )

      integrateItems.push(
        { name: 'Single-Leg Romanian Deadlift to Balance', phase: 'integrate', targetMuscle: 'Posterior Chain & Core Stabilizers', protocol: '2 sets of 8-10 reps per leg', coachingCue: 'Hinge at hip with square pelvis and neutral spine.' }
      )
    }
  }

  // UPPER CROSSED SYNDROME (CPT-7 Table 11.3)
  if (isUpperCrossed || forwardHeadCarriage || roundedShouldersProtracted) {
    synergies.push({
      muscleGroup: 'Cervicothoracic & Shoulder Complex (Upper Crossed Syndrome)',
      overactiveMuscles: ['Upper Trapezius', 'Levator Scapulae', 'Sternocleidomastoid (SCM)', 'Scalenes', 'Pectoralis Major', 'Pectoralis Minor', 'Latissimus Dorsi'],
      underactiveMuscles: ['Deep Cervical Flexors (Longus Colli/Capitis)', 'Serratus Anterior', 'Rhomboids', 'Middle & Lower Trapezius', 'Infraspinatus', 'Teres Minor'],
      reciprocalInhibitionMechanism: 'Hyperactive upper traps and pectorals inhibit the lower trapezius and serratus anterior, causing anterior humeral glide and subacromial impingement.',
      associatedInjuryRisks: ['Subacromial Impingement Syndrome', 'Rotator Cuff Tendinitis', 'Thoracic Outlet Syndrome', 'Cervical Radiculopathy', 'Biceps Tendinitis'],
    })

    ;['Upper Trapezius', 'Levator Scapulae', 'SCM', 'Pectoralis Major', 'Pectoralis Minor', 'Latissimus Dorsi'].forEach(m => overactive.add(m))
    ;['Deep Cervical Flexors', 'Serratus Anterior', 'Rhomboids', 'Lower Trapezius', 'Rotator Cuff (Infraspinatus)'].forEach(m => underactive.add(m))
    ;['Rotator Cuff Impingement', 'Subacromial Bursitis', 'Thoracic Outlet Syndrome', 'Cervical Disc Strain'].forEach(r => risks.add(r))

    inhibitItems.push(
      { name: 'SMR Upper Trapezius / Levator Scapulae', phase: 'inhibit', targetMuscle: 'Upper Trapezius & Levator Scapulae', protocol: 'Hold trigger point with lacrosse ball for 30–60s', coachingCue: 'Place ball between upper shoulder blade and spine against wall.' },
      { name: 'SMR Pectoralis Minor & Latissimus Dorsi', phase: 'inhibit', targetMuscle: 'Pectoralis Minor', protocol: 'Hold tender spot for 30–60s', coachingCue: 'Use massage ball against wall on anterior chest below collarbone.' }
    )

    lengthenItems.push(
      { name: 'Doorway Pec Major & Minor Stretch', phase: 'lengthen', targetMuscle: 'Pectoralis Major / Minor', protocol: '30s hold at 90° and 120° arm angles', coachingCue: 'Step forward through doorway without arching lower back.' },
      { name: 'Upper Trapezius / Scalene Lateral Neck Stretch', phase: 'lengthen', targetMuscle: 'Upper Trapezius & Scalenes', protocol: '30s hold per side', coachingCue: 'Gently draw ear toward shoulder while depressing opposite collarbone.' }
    )

    activateItems.push(
      { name: 'Chin Tucks (Deep Cervical Flexor Activation)', phase: 'activate', targetMuscle: 'Deep Cervical Flexors', protocol: '2 sets of 10 reps (5s isometric hold)', coachingCue: 'Retract chin straight back creating a double chin without flexing neck.' },
      { name: 'Prone Cobra / Y-Raises', phase: 'activate', targetMuscle: 'Lower & Middle Trapezius', protocol: '2 sets of 12-15 reps (4/2/1 tempo)', coachingCue: 'Depress shoulders away from ears, thumbs up to ceiling, squeeze mid-back.' },
      { name: 'Standing Wall Slides with Serratus Reach', phase: 'activate', targetMuscle: 'Serratus Anterior', protocol: '2 sets of 10 reps', coachingCue: 'Protract and upwardly rotate scapulae at top of slide.' }
    )

    integrateItems.push(
      { name: 'Cable Squat to Row with Scapular Retraction', phase: 'integrate', targetMuscle: 'Integrated Kinetic Chain Pulling', protocol: '2 sets of 10-12 reps', coachingCue: 'Lead pull with elbow drive and scapular depression; avoid shrugging.' }
    )
  }

  // Baseline optimal fallback
  if (synergies.length === 0) {
    synergies.push({
      muscleGroup: 'Global Kinetic Chain (Optimal Alignment)',
      overactiveMuscles: ['None detected'],
      underactiveMuscles: ['None detected'],
      reciprocalInhibitionMechanism: 'Agonist-antagonist pairs demonstrate balanced length-tension relationships and optimal joint arthrokinematics.',
      associatedInjuryRisks: ['Low soft-tissue risk under controlled loads'],
    })

    inhibitItems.push({ name: 'Full-Body Foam Rolling Maintenance', phase: 'inhibit', targetMuscle: 'Full Posterior Chain', protocol: 'General flush', coachingCue: 'Roll major muscle groups for 30s.' })
    lengthenItems.push({ name: 'World’s Greatest Stretch', phase: 'lengthen', targetMuscle: 'Global Mobility', protocol: '5 reps per side', coachingCue: 'Smooth dynamic range of motion.' })
    activateItems.push({ name: 'Glute Bridge & Bird Dog', phase: 'activate', targetMuscle: 'LPHC Stabilizers', protocol: '10 reps each', coachingCue: 'Maintain neutral spine.' })
    integrateItems.push({ name: 'Squat to Overhead Reach', phase: 'integrate', targetMuscle: 'Kinetic Chain Coordination', protocol: '10 reps', coachingCue: 'Full triple extension.' })
  }

  let clinicalSummary = `Comprehensive screening indicates ${title} (${dysfunctionLevel}). `
  if (isPronation) clinicalSummary += 'Pronation and knee valgus require targeted medial arch activation and glute medius strengthening. '
  if (isLowerCrossed) clinicalSummary += 'Anterior pelvic tilt requires hip flexor inhibition and deep gluteus maximus / core activation. '
  if (isUpperCrossed) clinicalSummary += 'Forward head and rounded shoulders require upper trap/pec release and serratus/lower trap recruitment. '

  return {
    syndrome,
    title,
    severityScore,
    kineticChainDysfunctionLevel: dysfunctionLevel,
    detectedSyndromes: {
      pronation: isPronation,
      lowerCrossed: isLowerCrossed,
      upperCrossed: isUpperCrossed,
    },
    synergyAnalysis: synergies,
    allOveractiveMuscles: Array.from(overactive),
    allUnderactiveMuscles: Array.from(underactive),
    injuryRisks: Array.from(risks),
    correctiveProtocol: {
      inhibit: inhibitItems,
      lengthen: lengthenItems,
      activate: activateItems,
      integrate: integrateItems,
    },
    clinicalSummary,
  }
}
