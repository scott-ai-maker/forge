/**
 * Forge Athletic — Clinical Assessment Attire Standards & Image Quality Rules
 *
 * Enforces strict, professional attire standards for:
 * 1. Biomechanical Movement Screens (NASM Overhead Squat, SLS, Dynamic Screens)
 * 2. Body Composition & Bodyfat Assessments (AI DEXA-Vision, Progress Photos)
 *
 * Rule: Submissions that do not adhere to clinical best practices are strictly rejected
 * and returned to the client for re-recording / re-taking.
 */

export type AssessmentAttireCategory = 'movement_screen' | 'body_composition'

export interface AttireStandard {
  category: AssessmentAttireCategory
  title: string
  requiredAttire: {
    male: string[]
    female: string[]
    general: string[]
  }
  prohibitedAttire: string[]
  rejectionReasons: string[]
  nasmClinicalRationale: string
}

export const MOVEMENT_SCREEN_ATTIRE_STANDARDS: AttireStandard = {
  category: 'movement_screen',
  title: 'Movement Screen Clinical Attire Standard',
  requiredAttire: {
    male: [
      'Form-fitting athletic crewneck t-shirt or compression top (tucked into waistband if loose)',
      'Fitted athletic training shorts (above the knee) or athletic compression tights',
      'Barefoot or thin flat socks on a non-slip, level surface',
    ],
    female: [
      'Form-fitting athletic performance tank or t-shirt (tucked into waistband if loose)',
      'Fitted athletic shorts (above the knee) or athletic compression tights/leggings',
      'Barefoot or thin flat socks on a non-slip, level surface',
    ],
    general: [
      'Key kinetic checkpoints (knees, ankles, hips, spine, shoulders) must remain completely visible',
      'Clothing color must contrast with the background wall and flooring for clear silhouette segmentation',
      'Camera positioned at waist height, 8–12 feet away with full body in frame',
    ],
  },
  prohibitedAttire: [
    'Baggy sweatpants, wide-leg joggers, cargo pants, or jeans',
    'Oversized hoodies, baggy sweatshirts, loose sweaters, or bulky jackets',
    'Cushioned running shoes, platform sneakers, or elevated-heel lifting shoes',
    'Non-athletic or inappropriate garments',
  ],
  rejectionReasons: [
    'Knee tracking is obscured (cannot diagnose knee valgus, varus, or patellar tracking)',
    'Waistline or pelvis is hidden (cannot assess anterior pelvic tilt, lumbar lordosis, or asymmetric shift)',
    'Footwear alters natural ankle dorsiflexion and masks subtalar arch pronation/flattening',
    'Loose fabric billowing introduces motion artifacts and optical false positives',
  ],
  nasmClinicalRationale:
    'Biomechanical movement diagnostics require unobstructed optical visibility of key kinetic chain joints. Loose clothing conceals knee valgus/varus, anterior pelvic tilt, and spinal compensations. Cushioned shoes artificially alter foot-ankle complex mechanics.',
}

export const BODY_COMPOSITION_ATTIRE_STANDARDS: AttireStandard = {
  category: 'body_composition',
  title: 'Body Composition & DEXA-Vision Attire Standard',
  requiredAttire: {
    male: [
      'Form-fitting athletic compression shorts or fitted athletic training shorts (above mid-thigh)',
      'Fitted athletic performance crewneck top / compression top, or standard clinical physique assessment wear',
      'Natural waistline, abdominal wall contour, and quadriceps clearly visible',
    ],
    female: [
      'Form-fitting athletic sports bra and fitted athletic shorts or compression shorts',
      'Natural waistline, abdominal wall contour, and hips clearly visible',
      'Minimalist athletic garments that hug the natural anatomical silhouette',
    ],
    general: [
      'Clean, professional athletic training apparel',
      'Form-fitting garments without loose fabric bunching or drapery',
      'Uniform frontal lighting without harsh backlighting or room clutter',
    ],
  },
  prohibitedAttire: [
    'Baggy t-shirts, oversized flannel shirts, or loose cotton tops',
    'Hoodies, jackets, sweatshirts, or robes',
    'Baggy sweatpants, loose basketball shorts, or denim',
    'Underwear, lingerie, or complete nudity',
    'Thick shoes, boots, or bulky footwear',
  ],
  rejectionReasons: [
    'Loose clothing creates artificial volume, falsely inflating fat mass and circumference calculations',
    'Natural waistline and iliac crest landmarks are obscured, preventing accurate waist-to-hip ratio',
    'Garment drape masks subcutaneous muscle definition and regional adiposity landmarks',
    'Inappropriate attire violates professional athletic standards',
  ],
  nasmClinicalRationale:
    'DEXA-calibrated computer vision algorithms calculate body density, volume, and fat percentage based on high-precision silhouette contour extraction and subcutaneous landmark visibility. Loose garments create false bulk and occlusion, introducing multi-percent errors.',
}

export interface AttireValidationResult {
  adheresToBestPractices: boolean
  isRejected: boolean
  rejectionReason: string | null
  detectedIssues: string[]
  recommendations: string[]
}

/**
 * Validates whether an assessment submission conforms to Forge Athletic attire standards.
 */
export function validateAssessmentAttire(params: {
  category: AssessmentAttireCategory
  clothingOcclusionDetected?: boolean
  detectedIssues?: string[]
  isBaggyOrNonAthletic?: boolean
  attireConfirmedByClient?: boolean
}): AttireValidationResult {
  const {
    category,
    clothingOcclusionDetected = false,
    detectedIssues = [],
    isBaggyOrNonAthletic = false,
    attireConfirmedByClient = true,
  } = params

  const standards = category === 'movement_screen'
    ? MOVEMENT_SCREEN_ATTIRE_STANDARDS
    : BODY_COMPOSITION_ATTIRE_STANDARDS

  const issues: string[] = [...detectedIssues]

  if (clothingOcclusionDetected) {
    issues.push('clothing_occlusion')
  }
  if (isBaggyOrNonAthletic) {
    issues.push('baggy_or_non_athletic_attire')
  }
  if (!attireConfirmedByClient) {
    issues.push('attire_confirmation_missing')
  }

  // If any disqualifying issue is present, reject the submission
  if (issues.length > 0) {
    const mainReason = category === 'movement_screen'
      ? 'Movement Screen Rejected: Attire does not adhere to clinical best practices. Loose or non-athletic clothing obscures key kinetic joints (knees, hips, spine) or cushioned footwear alters biomechanical joint angles.'
      : 'Body Composition Scan Rejected: Attire does not adhere to clinical DEXA standards. Loose or baggy garments obscure anatomical landmarks and silhouette contours, making accurate body fat calculation impossible.'

    return {
      adheresToBestPractices: false,
      isRejected: true,
      rejectionReason: mainReason,
      detectedIssues: Array.from(new Set(issues)),
      recommendations: [
        ...standards.requiredAttire.general,
        ...standards.requiredAttire.male.slice(0, 1),
        ...standards.requiredAttire.female.slice(0, 1),
      ],
    }
  }

  return {
    adheresToBestPractices: true,
    isRejected: false,
    rejectionReason: null,
    detectedIssues: [],
    recommendations: [],
  }
}
