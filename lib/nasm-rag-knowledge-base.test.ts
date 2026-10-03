import { describe, expect, it } from 'vitest'
import { NASM_RAG_LIBRARY, queryNasmRagLibrary } from './nasm-rag-knowledge-base'

describe('nasm-rag-knowledge-base', () => {
  it('contains comprehensive index of textbook chapters, workout suites, and assessments', () => {
    expect(NASM_RAG_LIBRARY.length).toBeGreaterThanOrEqual(27)

    const chapters = NASM_RAG_LIBRARY.filter(d => d.category === 'Textbook Chapter')
    expect(chapters.length).toBe(23)

    const workoutSuites = NASM_RAG_LIBRARY.filter(d => d.category === 'Workout Template')
    expect(workoutSuites.length).toBe(3)
  })

  it('queries documents by OPT phase and goal category', () => {
    // Hypertrophy Phase 3
    const hypertrophyDocs = queryNasmRagLibrary({ goal: 'hypertrophy', nasmOptPhase: 3 })
    expect(hypertrophyDocs.length).toBeGreaterThan(0)
    expect(hypertrophyDocs.some(d => d.id === 'cpt7_musclegain_suite')).toBe(true)

    // Fat Loss
    const fatLossDocs = queryNasmRagLibrary({ goal: 'fat_loss' })
    expect(fatLossDocs.length).toBeGreaterThan(0)
    expect(fatLossDocs.some(d => d.id === 'cpt7_fatloss_suite')).toBe(true)

    // Performance / Power
    const performanceDocs = queryNasmRagLibrary({ goal: 'performance', nasmOptPhase: 5 })
    expect(performanceDocs.length).toBeGreaterThan(0)
    expect(performanceDocs.some(d => d.id === 'cpt7_performance_suite')).toBe(true)
  })

  it('searches library by semantic keywords and nutrition protocols', () => {
    const ohsaMatches = queryNasmRagLibrary({ keyword: 'Overhead Squat' })
    expect(ohsaMatches.length).toBeGreaterThan(0)

    const bioenergeticsMatches = queryNasmRagLibrary({ keyword: 'ATP-PC' })
    expect(bioenergeticsMatches.length).toBeGreaterThan(0)

    const parqMatches = queryNasmRagLibrary({ keyword: 'PAR-Q+' })
    expect(parqMatches.length).toBeGreaterThan(0)

    // CNC2 queries
    const motivationalInterviewing = queryNasmRagLibrary({ keyword: 'Motivational Interviewing' })
    expect(motivationalInterviewing.length).toBeGreaterThan(0)
    expect(motivationalInterviewing.some(d => d.id === 'cnc2_w3_motivational_interviewing')).toBe(true)

    const boundaryMatches = queryNasmRagLibrary({ keyword: 'Boundary' })
    expect(boundaryMatches.length).toBeGreaterThan(0)

    const nutritionMatches = queryNasmRagLibrary({ goal: 'nutrition' })
    expect(nutritionMatches.length).toBe(87)

    const fodmapMatches = queryNasmRagLibrary({ keyword: 'FODMAP' })
    expect(fodmapMatches.length).toBeGreaterThan(0)

    const skinfoldMatches = queryNasmRagLibrary({ keyword: 'Skinfold' })
    expect(skinfoldMatches.length).toBeGreaterThan(0)

    // CNCB queries
    const leadMagnetMatches = queryNasmRagLibrary({ keyword: 'Lead Magnet' })
    expect(leadMagnetMatches.length).toBeGreaterThan(0)

    const salesScriptMatches = queryNasmRagLibrary({ keyword: 'Sales Script' })
    expect(salesScriptMatches.length).toBeGreaterThan(0)

    // CES 3 queries
    const correctiveDocs = queryNasmRagLibrary({ goal: 'corrective' })
    expect(correctiveDocs.length).toBe(1)
    expect(correctiveDocs[0].id).toBe('ces3_master_study_guide')

    const continuumMatches = queryNasmRagLibrary({ keyword: 'Corrective Exercise Continuum' })
    expect(continuumMatches.length).toBeGreaterThan(0)
    expect(continuumMatches.some(d => d.id === 'ces3_master_study_guide')).toBe(true)

    const lowerCrossedMatches = queryNasmRagLibrary({ keyword: 'Lower Crossed' })
    expect(lowerCrossedMatches.length).toBeGreaterThan(0)

    // PES 3 queries
    const sportsPerformanceDocs = queryNasmRagLibrary({ goal: 'sports_performance' })
    expect(sportsPerformanceDocs.length).toBe(167)

    const cleanMatches = queryNasmRagLibrary({ keyword: 'Phases of the Clean' })
    expect(cleanMatches.length).toBeGreaterThan(0)

    const proAgilityMatches = queryNasmRagLibrary({ keyword: 'Pro-Agility' })
    expect(proAgilityMatches.length).toBeGreaterThan(0)

    const daviesMatches = queryNasmRagLibrary({ keyword: 'Davies Test' })
    expect(daviesMatches.length).toBeGreaterThan(0)

    // BCS 2 queries
    const bcsDocs = queryNasmRagLibrary({ goal: 'behavior_change' })
    expect(bcsDocs.length).toBe(35)

    const oscarMatches = queryNasmRagLibrary({ keyword: 'OSCAR' })
    expect(oscarMatches.length).toBeGreaterThan(0)

    const multimodalMatches = queryNasmRagLibrary({ keyword: 'Multimodal' })
    expect(multimodalMatches.length).toBeGreaterThan(0)

    // MMACS queries
    const mmaDocs = queryNasmRagLibrary({ goal: 'mma' })
    expect(mmaDocs.length).toBe(22)

    const strikingMatches = queryNasmRagLibrary({ keyword: 'Striking' })
    expect(strikingMatches.length).toBeGreaterThan(0)

    // GFS 2 queries
    const golfDocs = queryNasmRagLibrary({ goal: 'golf' })
    expect(golfDocs.length).toBe(22)

    const xFactorMatches = queryNasmRagLibrary({ keyword: 'X-Factor' })
    expect(xFactorMatches.length).toBeGreaterThan(0)

    const gmapMatches = queryNasmRagLibrary({ keyword: 'Mental Aptitude' })
    expect(gmapMatches.length).toBeGreaterThan(0)

    // Home Gym Design queries
    const hgdDocs = queryNasmRagLibrary({ goal: 'home_gym' })
    expect(hgdDocs.length).toBe(6)

    const siteSpecs = queryNasmRagLibrary({ keyword: 'Site Assessment' })
    expect(siteSpecs.length).toBeGreaterThan(0)

    const discoveryMatches = queryNasmRagLibrary({ keyword: 'Home Gym Discovery' })
    expect(discoveryMatches.length).toBeGreaterThan(0)

    // Social Media Influencer queries
    const smiDocs = queryNasmRagLibrary({ goal: 'social_media' })
    expect(smiDocs.length).toBe(10)

    const brandMessaging = queryNasmRagLibrary({ keyword: 'Brand Messaging' })
    expect(brandMessaging.length).toBeGreaterThan(0)

    const freebieMatches = queryNasmRagLibrary({ keyword: 'Freebie' })
    expect(freebieMatches.length).toBeGreaterThan(0)

    // GLP-1 Weight Loss Medication queries
    const glp1Docs = queryNasmRagLibrary({ goal: 'glp1' })
    expect(glp1Docs.length).toBe(2)

    const sarcopeniaMatches = queryNasmRagLibrary({ keyword: 'Sarcopenia' })
    expect(sarcopeniaMatches.length).toBeGreaterThan(0)

    // Advanced Cardio queries
    const cardioDocs = queryNasmRagLibrary({ goal: 'cardio' })
    expect(cardioDocs.length).toBe(10)

    const lactateMatches = queryNasmRagLibrary({ keyword: 'Lactate Threshold' })
    expect(lactateMatches.length).toBeGreaterThan(0)

    const alacticMatches = queryNasmRagLibrary({ keyword: 'Alactic' })
    expect(alacticMatches.length).toBeGreaterThan(0)

    // Bodybuilding Meal Prep queries
    const mealPrepDocs = queryNasmRagLibrary({ goal: 'meal_prep' })
    expect(mealPrepDocs.length).toBe(18)

    const bisonMatches = queryNasmRagLibrary({ keyword: 'Bison' })
    expect(bisonMatches.length).toBeGreaterThan(0)

    const travelFoodMatches = queryNasmRagLibrary({ keyword: 'TSA' })
    expect(travelFoodMatches.length).toBeGreaterThan(0)

    // Podcasting Playbook queries
    const podcastDocs = queryNasmRagLibrary({ goal: 'podcasting' })
    expect(podcastDocs.length).toBe(24)

    const guestMatches = queryNasmRagLibrary({ keyword: 'Guest Recruitment' })
    expect(guestMatches.length).toBeGreaterThan(0)

    const factCheckingMatches = queryNasmRagLibrary({ keyword: 'Fact-Checking' })
    expect(factCheckingMatches.length).toBeGreaterThan(0)

    // Physique & Bodybuilding Coach queries
    const pbcDocs = queryNasmRagLibrary({ goal: 'physique' })
    expect(pbcDocs.length).toBe(58)

    const peakWeekMatches = queryNasmRagLibrary({ keyword: 'Peak Week' })
    expect(peakWeekMatches.length).toBeGreaterThan(0)

    const posingMatches = queryNasmRagLibrary({ keyword: 'Posing' })
    expect(posingMatches.length).toBeGreaterThan(0)

    const bloodworkMatches = queryNasmRagLibrary({ keyword: 'Bloodwork' })
    expect(bloodworkMatches.length).toBeGreaterThan(0)

    // Weight Loss Specialist queries
    const wlsDocs = queryNasmRagLibrary({ goal: 'weight_loss' })
    expect(wlsDocs.length).toBe(29)

    const woopMatches = queryNasmRagLibrary({ keyword: 'WOOP' })
    expect(woopMatches.length).toBeGreaterThan(0)

    const plateauMatches = queryNasmRagLibrary({ keyword: 'Plateau' })
    expect(plateauMatches.length).toBeGreaterThan(0)
  })
})
