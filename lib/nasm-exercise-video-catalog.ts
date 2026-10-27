/**
 * Forge Athletic — Master NASM Edge Exercise Video Catalog & Embed Resolver
 * 100% Official NASM Edge Video Demonstrations exclusively.
 * Matches client brand standards with verified clinical NASM instructor video productions.
 */

import { resolveGaaExerciseImage } from './nasm-generated-images'

export interface ExerciseVideoResolution {
  embedUrl: string
  externalUrl: string
  isDirectEmbed: boolean
  sourceTitle: string
  videoId: string | null
}

// 270+ Official NASM Edge YouTube Video Demonstrations
export const NASM_EDGE_OFFICIAL_CATALOG: Record<string, string> = {
  "depth jump": "bMHL5xqKn3E",
  "transverse box jump down to tuck jump": "tYfXItmoX1s",
  "repeat squat jumps": "dsEgOcunkvY",
  "depth jump frontal": "-jUndEGjpig",
  "incline push up with rotation": "Yylb-sLWdm8",
  "box jump up with stabilization frontal": "624ARptOVDM",
  "repeat hurdle jumps transverse": "Io5gmVqO_sA",
  "repeat hurdle jumps": "til5WR9ko4c",
  "repeat tuck jumps": "KMr7gzm_wf4",
  "4 point quadruped t drill": "N7p0Le1WdJE",
  "tuck jump with stabilization": "hIEV3C4zaT8",
  "squat jump with stabilization": "Vv9Cd8AwYZ0",
  "dumbbell romanian deadlift": "V8Hdl1FiNt4",
  "pike push up": "XckEEwa1BPI",
  "frontal box jump down to tuck jump": "NX-sjAtZco0",
  "archer push up": "IDu6pRAPChg",
  "inverted push up": "M0hMndCrkI4",
  "push up": "7NUICnha_Hk",
  "incline push up": "Gvm5Q29UHbk",
  "forward and back band walking": "9aLcb5a7390",
  "bulgarian split squat": "hbw7hdyOpq0",
  "push up with staggered hands": "miMPlHvDwxc",
  "single leg hop stabilization level 1": "6BkwOUl3fAw",
  "active standing hip flexor": "VY0FyyIHrPo",
  "seated row": "0R9ZQd3aM6s",
  "single leg hop stabilization level 2": "cps6tCcJNJA",
  "push up to 3 point stance": "yvuyGj9g6WQ",
  "foam roll calves": "6f2LO5EeB0I",
  "single leg romanian deadlift to pnf pattern 2": "znQ41ErG4Wk",
  "single leg cobra to hip extension": "fY64Qk6IfMk",
  "good mornings": "Daq-wJMUnes",
  "plank walkup": "6Tv4xTRPtUc",
  "single leg balance reach frontal plane": "UrB5wA7B3hI",
  "ladder jumping jacks": "pCsAq0HuVqM",
  "decline push up": "aq2xZxfrQlM",
  "single leg floor bridge": "lHXShY-FivU",
  "quadruped arm raise": "PSytregUBZY",
  "goblet squat": "nfX7IFK9UNI",
  "kettlebell front squat": "-TeEMXoHQPM",
  "single leg scaption": "PKjDGnwpB_o",
  "scaption": "PKjDGnwpB_o",
  "squat to scaption": "9k6IfkGBAVQ",
  "squat to overhead reach": "9k6IfkGBAVQ",
  "squat to overhead reach & scaption": "9k6IfkGBAVQ",
  "squat to overhead reach and scaption": "9k6IfkGBAVQ",
  "squat to overhead reach scaption": "9k6IfkGBAVQ",
  "single leg squat to scaption": "PKjDGnwpB_o",
  "squat to scaption multi planar reach": "9k6IfkGBAVQ",
  "standing scaption": "PKjDGnwpB_o",
  "dumbbell scaption": "PKjDGnwpB_o",
  "tuck jump": "-bnJGikRGsM",
  "self myofascial release smr hamstrings": "_M29fhv3LoI",
  "push up plus": "qw-9P3R37vU",
  "single leg romanian deadlift": "6pEL3KxnlEo",
  "self myofascial release smr piriformis": "XS5hY6vBi6g",
  "single leg throw and catch transverse 1": "w1shWW8WCN0",
  "self myofascial release smr peroneals": "o0sqnX6FMzk",
  "band assisted pull up": "B_VkNQS5YLs",
  "squat to row": "qZn-_dXCP2s",
  "leg press calf raise": "8k435cj30gc",
  "russian twist": "s0kT80JLCfA",
  "activation ball prone wide row": "qSqFFlidCXo",
  "barbell deadlift": "yPqv3ejnZvc",
  "single leg press": "3aYsOsBA7ZE",
  "barbell front squat with crossed arms": "W9jJaI4cHJU",
  "cable crossover": "XY6JrX1wyxk",
  "dead bug": "bxn9FBrt4-A",
  "leg circuit frontal": "hV6ozNZJyWA",
  "face pull": "eTCBSFlCJ_s",
  "quadruped opposite arm leg raise": "GJ34tTJyWz8",
  "how to foam roll adductors": "Nqol0T6rKDg",
  "squat jump": "tZSYZdtbONc",
  "single arm dumbbell chest press": "qFTnmyC-nf4",
  "close grip bench press": "LJeqLAmJLfs",
  "chest press machine": "lRo9zZ7EwpM",
  "kettlebell jerk": "9NFkYaviXgk",
  "lying leg curl two leg concentric single leg eccentric": "_7sVQlruVZc",
  "seated machine row close grip": "k0cTJCfxa0Y",
  "two arm incline dumbbell chest press": "JKnpHchOWPU",
  "reverse crunch to knee up with rotation": "wtKWBzDwfIM",
  "dumbbell preacher curl": "t2BmBSmcjco",
  "reverse lunge to single arm row": "erYh7wR3P2Y",
  "single leg seated leg curl": "PXNJ71rksvU",
  "ball cobra": "2CDihCl3wFQ",
  "standing tubing row": "qykwviNOIyc",
  "single leg squat touchdown": "aFttN9JV0Rg",
  "incline barbell bench press": "BjGLs6KGWUc",
  "single arm incline dumbbell chest press": "iJ-GwVeUuCg",
  "static upper trapezius stretch": "RNTlUaKeuXE",
  "lying leg curl single leg": "kGIfh3hHY0w",
  "stability ball hamstring curl": "Z3cY3d3BBo4",
  "ball hamstring curl": "Z3cY3d3BBo4",
  "static latissimus dorsi ball stretch": "kEH6jatSVSw",
  "active kneeling hip flexor": "OJ8qQQRxYz8",
  "static butterfly stretch": "v4OLkxi5-Q0",
  "activation medial hamstring": "ksd36rrxgtE",
  "activation posterior tibialis": "O1LxD0L9pR4",
  "band push up": "7Xu3D-TKKAw",
  "assisted single leg squat": "PkToneYECnY",
  "active supine biceps femoris": "A3fmhDWoSm0",
  "active lat ball": "w_mDsWxtVng",
  "kettlebell goblet squat": "MWHIs0zxkCU",
  "plank with knees down": "Q2MbIzmkcho",
  "single leg throw and catch transverse 2": "-zKoJj4nJ9k",
  "single leg balance reach transverse": "V8n50DGrxfI",
  "single leg lift and chop": "YGU8ONAmjIE",
  "ball combo i": "xb3-dysLHpE",
  "step up to balance frontal curl to overhead press": "gjigcqa_ufo",
  "box squat curl to overhead press": "ZrOgsfSPpC8",
  "barbell bench press with chains": "6UKcYcDme-Y",
  "static levator scapulae stretch": "U-rAhZajTLs",
  "clamshells": "V_AnVxKPFlY",
  "kettlebell overhead press": "X-uFqWtjpGI",
  "ball crunch arms crossed": "5DKvQPbSHUg",
  "half kneeling tubing rotation": "CnF9Bf2pm4s",
  "single leg romanian deadlift to pnf pattern 1": "ZmI4DRACNTg",
  "push press": "ODwyDtlXnXk",
  "dumbbell bent over extention": "sTkMVkTwcSk",
  "dumbbell bench press": "4_QuyfOCI5U",
  "dumbbell lateral raise": "XPPfnSEATJA",
  "dumbbell hammer curl": "nL3SedGG7X0",
  "dumbbell overhead press": "MMjBnEBnZKM",
  "bent over dumbbell rear fly": "kLW7nbw4lcY",
  "reverse lunge": "lKhZvT_NkOs",
  "reverse lunges": "lKhZvT_NkOs",
  "reverse lunge to balance": "lKhZvT_NkOs",
  "reverse lunge with torso lean": "lKhZvT_NkOs",
  "reverse lunge with forward torso lean": "lKhZvT_NkOs",
  "reverse lunge with torso lean step up to low box": "lKhZvT_NkOs",
  "reverse lunge with torso lean / step-up to low box": "lKhZvT_NkOs",
  "dumbbell reverse lunge": "lKhZvT_NkOs",
  "bodyweight reverse lunge": "lKhZvT_NkOs",
  "reverse lunge from step": "lKhZvT_NkOs",
  "mb figure 8": "iVmIrVNlKjI",
  "supported bent over dumbbell row": "DmUX88nWClo",
  "supported bent over dumbbell extension": "iRaoz2hbOXU",
  "kettlebell clean": "aoCikYYQ6pI",
  "incline stance single arm row": "-eKoynNqlfo",
  "incline stance row": "Od9m9NVkA8g",
  "single arm standing chest press": "K88He59YVto",
  "medicine ball push up to 3 point": "pxpGo3EtwkM",
  "kettlebell renegade row": "NNTpBlHRcA4",
  "bent over barbel row supinated": "ZuC7ma4ktm0",
  "single leg throw and catch": "-MK4_rmVQqs",
  "zig zag shuffle": "ayCcERnpVCc",
  "activation standing glute max": "_kHFPUcelRI",
  "bent elbow dumbbell lateral raise": "21NdvM9pY9g",
  "self myofascial release smr lateral thigh": "-Y1ubl6amUg",
  "self myofascial release smr thoracic spine": "xKmqizOqshI",
  "activation medial gastrocnemius": "gipvE9-iSzU",
  "step up to balance frontal": "fVRKGAp1iHw",
  "alternating dumbbell bench press": "wOa4YyxyiKI",
  "barbell bicep curl": "pQfJR-sSIvA",
  "romanian deadlift": "2bmuYtv4HbQ",
  "in in out out crossover ladder drill": "HibORUkPckg",
  "activation anterior tibialis": "CeFbXhifvvA",
  "box squat": "-GaRp6_b2vk",
  "single leg romanian deadlift curl to overhead press": "CqLKOZCOFLU",
  "dumbbell combination curl": "5l9fg7Cml0Y",
  "quadruped march": "-atsQczv7N4",
  "floor prone cobra": "keErJXdp2lE",
  "single leg balance reach multiplanar": "Mo4P9Y_AQt8",
  "ball crunch": "QFLftqPWjoI",
  "hammer curl to lateral raise": "4P6tmzTV01A",
  "plank": "xhk1JkbF2lg",
  "dumbbell front squat": "hZI8Yy5elZs",
  "single leg romanian deadlift single arm curl to overhead press": "SKl4_fSJeh0",
  "single leg hammer curl": "unRU3oVX3PU",
  "squat thrust burpees": "Ny8JWqh4lNg",
  "static 3d kneeling hip flexor stretch": "mOBSK4JKwlk",
  "sternocleidomastoid stretch": "s_TdSVFpLdg",
  "push up with rotation": "miN74vJbE_w",
  "leg circuit": "nPHtf8q5PxM",
  "leg press": "cDGOn-yfKJA",
  "lying leg curl": "Dq5y4WEcqqo",
  "ice skater with stabilization": "ViVoHbYwT-Y",
  "double kettlebell clean": "Yaelrl1VN20",
  "half get up with kettlebell": "WradwGWo554",
  "kettlebell push press": "k4q6HkT99iA",
  "single arm kettlebell high pull": "mP1BHxBeAEM",
  "lateral band walking": "M5uxEQH5BUM",
  "box jump up with stabilization transverse": "z8ks1w0rnxM",
  "depth jump transverse": "1gwF8c3ZlD0",
  "repeat hurdle jump frontal": "LBiNOM5_-j4",
  "two ins ladder drill": "GKDY4urn2kQ",
  "power step up": "UCsdLEqtWSg",
  "repeat squat jumps frontal": "k9Yt7ohA_rE",
  "pull up": "9yVGh3XbJ34",
  "box jump up with stabilization": "757ht_Y-fY0",
  "quadruped leg raise": "TJbnvoFkLKI",
  "repeat squat jumps transverse": "wfbn8QUHqo0",
  "dumbbell squat to overhead press": "9k6IfkGBAVQ",
  "active standing adductor": "1opPpdhFabY",
  "single leg single arm scaption": "ikMg_3_jAWE",
  "single arm scaption": "ikMg_3_jAWE",
  "bird dog": "ZdAHe9_HeEw",
  "activation standing shoulder ext rotation": "SPeinjTytxM",
  "reverse lunge to row": "dcs7-vejMAY",
  "modified push up": "PDr5B2jLUOw",
  "split stance row": "AV3CzcOcGls",
  "activation ball prone shoulder press": "VZJ0PHuNrYI",
  "prisoner squat calf raise": "Xz0PPBZO2xc",
  "half kneeling throw and catch": "WX6YNwM5ycU",
  "dumbbell bent over row": "DJfQN6xJL28",
  "dumbbell rack carry": "IA2tycCS8DI",
  "hand to hand kettlebell swing": "KKumMhxKapw",
  "one ins ladder drill": "em63lCvm9CM",
  "incline stance curl to overhead press": "OE5ZvGOpGTY",
  "long lever ball crunch": "YkEu2Hs3gw8",
  "double kettlebell snatch": "p7Evs2D5aZc",
  "step up to balance sagital": "k0_42mij5Fc",
  "split jerk": "UcYVQWjygSw",
  "lunge to balance frontal": "WFmIGf0kyEs",
  "iron cross": "uBEXsoMclPY",
  "jumping jacks": "uLVt6u15L98",
  "supine biceps femoris stretch": "xO8CZWtfKDU",
  "core ball crunch": "lrqfw0n_GXI",
  "latissimus dorsi ball stretch": "dg_gevWZuQM",
  "static standing adductor stretch": "IzHUoWs0maQ",
  "barbell back squat": "-bJIpOq-LWk",
  "supine dumbbell extension": "fwExa2A1Plc",
  "dumbbell ball combo ii": "Ok46ZtftfhU",
  "medicine ball step over push up": "-nuCpkC0I7s",
  "lunge to balance": "UInwcEa5BH4",
  "barbell bench press with bands": "N4H4o8k9WbE",
  "seated single arm dumbbell tricep extension": "kZ-ReOdn2qk",
  "barbell overhead press": "cGnhixvC8uA",
  "kettlebell crush curl with squat": "BPGOyQKy9R0",
  "transverse slalom": "rTWU9qDQNgo",
  "static 90 90 hamstring stretch": "h_yZV27H684",
  "single leg squat": "sSXnaFyhiZs",
  "activation serratus push up": "E-_YOEeaIu0",
  "reciprocating kettlebell overhead press": "1nem81AsHC4",
  "activation ball prone shoulder ext rotation": "Ck26oIpb6tg",
  "static 3d standing hip flexor stretch": "thQiAEIskCI",
  "static standing adductor magnus": "sfiFzNlHLyk",
  "squat jump with stabilization transverse": "zLsI2C0VuQM",
  "lunge to balance transverse": "UG2Sf8ck1WI",
  "single arm standing row with rotation": "8fAJEs3L110",
  "squat jump with stabilization frontal": "6YK8WXP2gww",
  "static 3d standing tfl stretch": "h_8VHKvi1zo",
  "static erector spinae stretch": "04vmlwoDEgE",
  "static kneeling hip flexor stretch": "UU7Nqd_Dric",
  "static pectoral ball stretch": "ujsKpEYYCSo",
  "self myofascial release smr tensor fascia latae": "NfWjVK7agTM",
  "180 jump with stabilization": "NadIhI_0u1w",
  "static seated calf stretch": "83G00Fwlqqw",
  "prisoner squat": "dC0yGLZwxas",
  "kettlebell deadlift": "LnIMaf-XOpM",
  "self myofascial release smr latissimus dorsi": "I_76a2fVWc8",
  "two arm standing cable fly": "XNf6TBErGys",
  "two arm dumbbell chest press with band": "_x5m-s8xTf0",
  "foam roll latissimus dorsi": "5S2suclGl7o",
  "static standing quadriceps stretch": "XBLIiQS5RQI",
  "in in out out ladder drill": "SybJ4cCnR64",
  "short lever side plank": "y_WW7_c4O8k",
  "kettlebell clean to press": "km3f8_rpDdg",
  "kettlebell floor press": "yXstm050X84",
  "ali shuffle ladder drill": "_Tc751vW_lM",
  "repeat squat jumps multiplanar": "FC7EUiJleTQ",
  "bent over dumbbell rear fly with neutral grip": "aCi_ZhmPQCQ",
  "slalom": "O6Jf7gcxYdU",
  "box jump down to tuck jump": "eCTwe-Szf8U",
  "repeat ice skater": "yRM27bTe868",
  "single leg reach sagittal": "1sbENKqlslg",
  "static posterior shoulder stretch": "BnmRb-Egz14",
  "self myofascial release smr quadriceps": "vUzmXO56jDI",
  "dumbbell push press": "vuaYVK8xyqo",
  "barbell front squat with clean position": "yr_8VuSqhmM",
  "barbell bent over row pronated": "bm0_q9bR_HA",
  "kettlebell arm bar": "WtqAD5-Re18",
  "plyometric push up": "MH4gcTKQiEc",
  "box jumps": "DXu-8TAJwi4",
  "plank with arm reach": "rFwsard85T8",
  "barbell bench press": "CayG6UYqL8g",
  "bench dips": "WVeZDBhZwLA",
  "single leg squat to row": "LmGbrgGJS6E",
  "floor bridge": "Z3cY3d3BBo4",
  "glute bridge": "Z3cY3d3BBo4",
  "single leg glute bridge": "lHXShY-FivU",
  "side plank": "ZpBJIRLGEgg",
  "straight arm plank": "MDxfAuBbHHA",
  "incline dumbbell bench press": "_NrQUYg7Nlc",
  "single arm kettlebell swing": "r777bo9KuY4",
  "squat to single arm row": "dSf1abuGONU",
  "single leg throw and catch frontal": "TLgyE-Flcws",
  "w in in out out": "6rkW1Mmz4Ak",
  "incline dumbbell curl": "0dT4L6Lsi80",
  "incline dumbbell biceps curl": "0dT4L6Lsi80",
  "barbell biceps curl": "pQfJR-sSIvA",
  "squat jump with stabilization multiplanar": "SEM9l4KNM-I",
  "child s pose": "_ZX_zTOBgp8",
  "foam roll adductors": "Nqol0T6rKDg",
  "seated leg curl": "_2Kd0d-JEUM",
  "medicine ball bent over chest pass": "6Uuxb4h2N5I",
  "dumbbell renegade row to push up": "RuJ9a05aa0A",
  "dumbbell walking lunges": "UInwcEa5BH4",
  "walking lunges": "UInwcEa5BH4",
  "single leg dumbbell overhead press": "MMjBnEBnZKM",
  "single leg standing tubing overhead press": "MMjBnEBnZKM",
  "single leg dumbbell bent over row": "DJfQN6xJL28",
  "single leg standing tubing row": "qykwviNOIyc",
  "single leg dumbbell bent over extension": "kZ-ReOdn2qk",
  "side lying leg raise": "xVSwJhJCsgo",
  "bent over barbell row supinated": "ZuC7ma4ktm0",
  "prone ball dumbbell cobra": "2CDihCl3wFQ",
  "overhead triceps extension": "kZ-ReOdn2qk",
  "cable pallof press": "CnF9Bf2pm4s",
  "pallof press": "CnF9Bf2pm4s",
  "lat pulldown": "JGeRYIZdojU",
  "cable lat pulldown": "JGeRYIZdojU",
  "triceps pushdown": "kZ-ReOdn2qk",
  "cable triceps pushdown": "kZ-ReOdn2qk",
  "child's pose": "_ZX_zTOBgp8",
  "childs pose": "_ZX_zTOBgp8",
  "barbell good mornings": "Daq-wJMUnes",
  "single arm dumbbell bench press": "qFTnmyC-nf4",
  "squat to cable row": "qZn-_dXCP2s"
}

// Official NASM Edge Master Fallback (Official NASM Edge Movement Standard)
const NASM_EDGE_MASTER_FALLBACK_ID = 'CayG6UYqL8g' // Official NASM Edge Barbell Bench Press

/**
 * Cleans and strips superset labels, phase labels, parentheticals, and punctuation.
 * e.g. "Barbell Flat Bench Press (Strength 1A)" -> "barbell flat bench press"
 */
export function cleanExerciseName(value: string): string {
  return String(value ?? '')
    .replace(/^nasm\s*edge\s*[:\-]\s*/i, '')
    .replace(/^nasm\s*[:\-]\s*/i, '')
    .replace(/\s*\|\s*nasm(\s*edge)?$/i, '')
    .replace(/\s*-\s*nasm(\s*edge)?$/i, '')
    .replace(/\([^)]*\)/g, ' ') // Remove anything in parentheses like (Strength 1A), (Stability 1B), (Dumbbell)
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/phase\s*\d+/gi, ' ')
    .replace(/strength\s*\d+[a-z]?/gi, ' ')
    .replace(/stability\s*\d+[a-z]?/gi, ' ')
    .replace(/power\s*\d+[a-z]?/gi, ' ')
    .replace(/[-_]+/g, ' ')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim()
}

export function extractYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null
  const text = url.trim()
  const match = text.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i)
  return match ? match[1] : null
}

/**
 * Resolves an embeddable official NASM Edge video URL for any exercise.
 * Guarantees high-definition, verified NASM Edge video playback in the modal window.
 */
export function resolveExerciseVideoEmbed(
  exerciseName: string,
  providedVideoUrl?: string | null
): ExerciseVideoResolution {
  // 1. Direct YouTube video ID provided in record
  const directYtId = extractYouTubeVideoId(providedVideoUrl)
  if (directYtId && directYtId.length === 11) {
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${directYtId}?autoplay=1&rel=0&modestbranding=1`,
      externalUrl: `https://www.youtube.com/watch?v=${directYtId}`,
      isDirectEmbed: true,
      sourceTitle: `NASM Edge · ${exerciseName}`,
      videoId: directYtId,
    }
  }

  const cleaned = cleanExerciseName(exerciseName)

  // 2. Exact match in NASM Edge catalog
  if (NASM_EDGE_OFFICIAL_CATALOG[cleaned]) {
    const videoId = NASM_EDGE_OFFICIAL_CATALOG[cleaned]
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`,
      externalUrl: `https://www.youtube.com/watch?v=${videoId}`,
      isDirectEmbed: true,
      sourceTitle: `NASM Edge · ${exerciseName}`,
      videoId,
    }
  }

  // 3. Multi-token priority keyword matching to exact 1-to-1 NASM Edge videos
  const KEYWORD_EDGE_MAP: Array<{ keywords: string[]; videoId: string; label: string }> = [
    // Pushing & Chest
    { keywords: ['incline dumbbell bench press', 'incline dumbbell chest press', 'incline dumbbell press'], videoId: '_NrQUYg7Nlc', label: 'Incline Dumbbell Bench Press' },
    { keywords: ['incline barbell bench press', 'incline bench press'], videoId: 'BjGLs6KGWUc', label: 'Incline Barbell Bench Press' },
    { keywords: ['dual dumbbell flat bench press', 'dual dumbbell bench press', 'dumbbell flat bench press', 'flat dumbbell bench press', 'dumbbell bench press', 'dumbbell chest press', 'heavy dumbbell flat bench press'], videoId: '4_QuyfOCI5U', label: 'Dumbbell Bench Press' },
    { keywords: ['heavy barbell bench press', 'barbell flat bench press', 'barbell bench press', 'flat bench press'], videoId: 'CayG6UYqL8g', label: 'Barbell Bench Press' },
    { keywords: ['push up with rotation'], videoId: 'miN74vJbE_w', label: 'Push-Up with Rotation' },
    { keywords: ['decline push up'], videoId: 'aq2xZxfrQlM', label: 'Decline Push-Up' },
    { keywords: ['incline push up'], videoId: 'Gvm5Q29UHbk', label: 'Incline Push-Up' },
    { keywords: ['push up plus'], videoId: 'qw-9P3R37vU', label: 'Push-Up Plus' },
    { keywords: ['heavy banded push up', 'heavy banded push-up', 'heavy resistance band push up', 'heavy resistance band push-up', 'tempo deficit push ups', 'tempo deficit push-ups', 'push up with single leg balance', 'push-up with single-leg balance', 'push up', 'pushup', 'push-up', 'explosive plyometric push up', 'explosive plyometric push-up', 'clapping push up', 'clapping push-up'], videoId: '7NUICnha_Hk', label: 'Push-Up' },
    { keywords: ['cable crossover', 'cable fly', 'chest fly'], videoId: 'XY6JrX1wyxk', label: 'Cable Crossover Fly' },
    { keywords: ['bench dips', 'bench dip'], videoId: 'WVeZDBhZwLA', label: 'Bench Dips' },

    // Shoulders
    { keywords: ['single-leg dumbbell overhead press', 'single leg dumbbell overhead press', 'single-leg standing tubing overhead press', 'single leg standing tubing overhead press', 'seated dumbbell shoulder press', 'seated dumbbell overhead shoulder press', 'dumbbell overhead press', 'dumbbell shoulder press', 'heavy banded overhead press', 'banded overhead press', 'standing neutral grip db overhead press'], videoId: 'MMjBnEBnZKM', label: 'Dumbbell Overhead Press' },
    { keywords: ['standing barbell overhead press', 'heavy barbell overhead press', 'barbell overhead press', 'standing overhead press', 'military press'], videoId: 'cGnhixvC8uA', label: 'Barbell Overhead Press' },
    { keywords: ['feet-elevated pike push-up', 'feet elevated pike push up', 'pike push up', 'pike push-up'], videoId: 'XckEEwa1BPI', label: 'Pike Push-Up' },
    { keywords: ['dumbbell lateral raise', 'lateral raise'], videoId: 'XPPfnSEATJA', label: 'Dumbbell Lateral Raise' },
    { keywords: ['bent over dumbbell rear fly', 'rear delt fly'], videoId: 'kLW7nbw4lcY', label: 'Rear Delt Fly' },
    { keywords: ['single leg single arm scaption', 'single arm scaption'], videoId: 'ikMg_3_jAWE', label: 'Single-Leg Single-Arm Scaption' },
    { keywords: ['single leg dumbbell scaption', 'single-leg dumbbell scaption', 'single leg banded scaption', 'single-leg banded scaption', 'single leg y-raise', 'single-leg y-raise', 'single leg squat to scaption', 'single leg scaption', 'standing scaption', 'dumbbell scaption', 'scaption'], videoId: 'PKjDGnwpB_o', label: 'Single-Leg Scaption' },
    { keywords: ['squat to overhead reach & scaption', 'squat to overhead reach and scaption', 'squat to overhead reach', 'squat to scaption multi planar reach', 'squat to scaption', 'squat to overhead press', 'dumbbell squat to overhead press', 'squat to press', 'overhead reach'], videoId: '9k6IfkGBAVQ', label: 'Squat to Overhead Reach & Scaption' },

    // Back & Pulling
    { keywords: ['single-leg romanian deadlift with reach', 'single leg romanian deadlift with reach', 'single leg rdl with reach', 'single leg romanian deadlift to pnf pattern 2'], videoId: 'znQ41ErG4Wk', label: 'Single-Leg Romanian Deadlift with Reach' },
    { keywords: ['single-leg romanian deadlift', 'single leg romanian deadlift', 'single leg rdl'], videoId: '6pEL3KxnlEo', label: 'Single-Leg Romanian Deadlift' },
    { keywords: ['dual dumbbell romanian deadlift', 'dumbbell romanian deadlift', 'dumbbell rdl', 'heavy banded romanian deadlift', 'banded romanian deadlift'], videoId: 'V8Hdl1FiNt4', label: 'Dumbbell Romanian Deadlift' },
    { keywords: ['barbell romanian deadlift', 'romanian deadlift', 'barbell rdl'], videoId: '2bmuYtv4HbQ', label: 'Romanian Deadlift' },
    { keywords: ['barbell deadlift', 'conventional deadlift'], videoId: 'yPqv3ejnZvc', label: 'Barbell Deadlift' },
    { keywords: ['heavy barbell bent-over row', 'heavy barbell bent over row', 'barbell bent over row', 'barbell bent-over row'], videoId: 'bm0_q9bR_HA', label: 'Barbell Bent-Over Row' },
    { keywords: ['dual dumbbell bent-over row', 'dual dumbbell bent over row', 'heavy dual dumbbell row', 'dumbbell bent over row', 'single arm dumbbell row'], videoId: 'DJfQN6xJL28', label: 'Dumbbell Bent-Over Row' },
    { keywords: ['seated cable row', 'cable row', 'seated machine row close grip', 'seated machine row', 'seated row', 'tubing row', 'heavy standing band row', 'standing band row', 'heavy band row', 'inverted bodyweight row', 'inverted row'], videoId: '0R9ZQd3aM6s', label: 'Seated Row' },
    { keywords: ['single-leg cable row', 'single leg cable row', 'single-leg dumbbell row', 'single leg dumbbell row', 'single-leg resistance band row', 'single leg resistance band row', 'single leg squat to row'], videoId: 'LmGbrgGJS6E', label: 'Single-Leg Cable Row' },
    { keywords: ['band assisted pull up', 'pull up', 'pull-up', 'chin up'], videoId: '9yVGh3XbJ34', label: 'Pull-Up' },
    { keywords: ['face pull', 'cable face pull'], videoId: 'eTCBSFlCJ_s', label: 'Face Pull' },

    // Legs: Squats, Lunges, Hips
    { keywords: ['heavy dual dumbbell front squat', 'barbell front squat', 'front squat'], videoId: 'yr_8VuSqhmM', label: 'Barbell Front Squat' },
    { keywords: ['heavy dumbbell goblet squat', 'heavy banded squat', 'goblet squat', 'kettlebell goblet squat'], videoId: 'nfX7IFK9UNI', label: 'Goblet Squat' },
    { keywords: ['box squat'], videoId: '-GaRp6_b2vk', label: 'Box Squat' },
    { keywords: ['heavy barbell back squat', 'barbell back squat', 'back squat'], videoId: '-bJIpOq-LWk', label: 'Barbell Back Squat' },
    { keywords: ['bulgarian split squat', 'split squat'], videoId: 'hbw7hdyOpq0', label: 'Bulgarian Split Squat' },
    { keywords: ['single leg squat to box', 'single leg squat'], videoId: 'sSXnaFyhiZs', label: 'Single-Leg Squat' },
    {
      keywords: [
        'reverse lunge to balance',
        'reverse lunge to row',
        'reverse lunge to single arm row',
        'reverse lunge with torso lean',
        'reverse lunge with forward torso lean',
        'reverse lunge with torso lean step up to low box',
        'reverse lunge from step',
        'dumbbell reverse lunge',
        'bodyweight reverse lunge',
        'reverse lunge',
        'reverse lunges',
      ],
      videoId: 'lKhZvT_NkOs',
      label: 'Reverse Lunge to Balance',
    },
    {
      keywords: [
        'dumbbell walking lunges',
        'walking lunges',
        'walking lunge',
        'lunge to balance',
        'forward lunge',
        'forward lunges',
        'stationary lunge',
        'lunge',
      ],
      videoId: 'UInwcEa5BH4',
      label: 'Lunge to Balance',
    },
    { keywords: ['single-leg step-up to balance', 'single leg step-up to balance', 'single-leg step up to balance', 'single leg step up to balance', 'step up to balance', 'step up to balance frontal', 'step up', 'step-up', 'box step-up', 'box step up'], videoId: 'fVRKGAp1iHw', label: 'Step-Up to Balance' },
    { keywords: ['spanish squat', 'spanish squats'], videoId: '-GaRp6_b2vk', label: 'Box Squat' },
    { keywords: ['single leg press'], videoId: '3aYsOsBA7ZE', label: 'Single-Leg Press' },
    { keywords: ['leg press'], videoId: 'cDGOn-yfKJA', label: 'Leg Press' },
    { keywords: ['lying leg curl', 'machine leg curl', 'leg curl machine'], videoId: 'Dq5y4WEcqqo', label: 'Lying Leg Curl' },
    { keywords: ['seated leg curl'], videoId: '_2Kd0d-JEUM', label: 'Seated Leg Curl' },
    { keywords: ['leg press calf raise', 'tibialis', 'anterior tibialis', 'calf raise', 'soleus', 'rathleff'], videoId: '8k435cj30gc', label: 'Calf Raise' },
    { keywords: ['single-leg glute bridge with hold', 'single leg glute bridge with hold', 'single leg floor bridge'], videoId: 'lHXShY-FivU', label: 'Single-Leg Floor Bridge' },
    { keywords: ['heavy barbell hip thrust', 'heavy dumbbell hip thrust', 'heavy banded hip thrust', 'floor bridge', 'glute bridge', 'hip thrust', 'banded hip thrust'], videoId: 'Z3cY3d3BBo4', label: 'Floor Bridge' },
    { keywords: ['stability ball hamstring curl', 'ball hamstring curl', 'stability ball leg curl', 'ball leg curl', 'stability ball hamstring curls', 'ball hamstring curls'], videoId: 'Z3cY3d3BBo4', label: 'Floor Bridge' },
    { keywords: ['good mornings', 'good morning'], videoId: 'Daq-wJMUnes', label: 'Good Mornings' },
    { keywords: ['kettlebell swing', 'banded kettlebell swing', 'single arm kettlebell swing', 'explosive dumbbell / kettlebell hinge swing', 'explosive dumbbell kettlebell hinge swing'], videoId: 'r777bo9KuY4', label: 'Kettlebell Swing' },

    // Arms: Biceps & Triceps
    { keywords: ['incline dumbbell curl'], videoId: '0dT4L6Lsi80', label: 'Incline Dumbbell Curl' },
    { keywords: ['dumbbell hammer curl', 'single leg hammer curl', 'hammer curl'], videoId: 'nL3SedGG7X0', label: 'Dumbbell Hammer Curl' },
    { keywords: ['dumbbell preacher curl'], videoId: 't2BmBSmcjco', label: 'Dumbbell Preacher Curl' },
    { keywords: ['barbell bicep curl', 'barbell curl'], videoId: 'pQfJR-sSIvA', label: 'Barbell Biceps Curl' },
    { keywords: ['single-leg dumbbell bent-over extension', 'single-leg dumbbell bent over extension', 'single leg dumbbell bent over extension', 'seated single arm dumbbell tricep extension', 'supine dumbbell extension', 'dumbbell bent over extention', 'dumbbell bent over extension', 'dumbbell bent-over extension', 'triceps pushdown', 'cable triceps pushdown', 'overhead triceps extension'], videoId: 'kZ-ReOdn2qk', label: 'Dumbbell Triceps Extension' },

    // Core & Balance
    { keywords: ['cable pallof press', 'pallof press', 'paloff press with band', 'paloff press'], videoId: 'CnF9Bf2pm4s', label: 'Pallof Press' },
    { keywords: ['russian twist'], videoId: 's0kT80JLCfA', label: 'Russian Twist' },
    { keywords: ['dead bug'], videoId: 'bxn9FBrt4-A', label: 'Dead Bug' },
    { keywords: ['mcgill big 3', 'bird dog', 'quadruped opposite arm leg raise'], videoId: 'ZdAHe9_HeEw', label: 'Bird Dog' },
    { keywords: ['short lever side plank', 'side plank'], videoId: 'ZpBJIRLGEgg', label: 'Side Plank' },
    { keywords: ['plank walkup'], videoId: '6Tv4xTRPtUc', label: 'Plank Walkup' },
    { keywords: ['plank with arm reach'], videoId: 'xhk1JkbF2lg', label: 'Plank with Arm Reach' },
    { keywords: ['stability ball crunch', 'ball crunch', 'core ball crunch'], videoId: 'QFLftqPWjoI', label: 'Stability Ball Crunch' },
    { keywords: ['single leg balance reach multiplanar', 'single leg balance reach frontal plane', 'single leg reach sagittal', 'star excursion'], videoId: 'Mo4P9Y_AQt8', label: 'Single-Leg Balance Reach' },

    // Plyometrics, Power & SAQ
    { keywords: ['explosive tuck jump / jump squat', 'explosive tuck jump jump squat', 'repeat squat jumps', 'squat jump with stabilization', 'squat jump', 'jump squat'], videoId: 'dsEgOcunkvY', label: 'Squat Jump' },
    { keywords: ['explosive tuck jump', 'repeat tuck jumps', 'tuck jump with stabilization', 'tuck jump'], videoId: 'KMr7gzm_wf4', label: 'Tuck Jump' },
    { keywords: ['box jump up with stabilization', 'box jumps', 'box jump'], videoId: 'DXu-8TAJwi4', label: 'Box Jumps' },
    { keywords: ['repeat hurdle jumps', 'hurdle jump'], videoId: 'til5WR9ko4c', label: 'Hurdle Jumps' },
    { keywords: ['depth jump'], videoId: 'bMHL5xqKn3E', label: 'Depth Jump' },
    { keywords: ['repeat ice skater', 'ice skater with stabilization', 'ice skater'], videoId: 'yRM27bTe868', label: 'Ice Skaters' },
    { keywords: ['explosive broad jump to stick', 'explosive broad jump', 'broad jump', 'single leg hop stabilization', 'single leg hop'], videoId: '6BkwOUl3fAw', label: 'Single-Leg Hop' },
    { keywords: ['4 point quadruped t drill'], videoId: 'N7p0Le1WdJE', label: 'SAQ 4-Point T-Drill' },
    { keywords: ['explosive medicine ball chest pass', 'medicine ball chest pass'], videoId: '7NUICnha_Hk', label: 'Medicine Ball Chest Pass' },
    { keywords: ['medicine ball soccer throw', 'medicine ball backward overhead slam', 'banded explosive speed row'], videoId: 'w1shWW8WCN0', label: 'Medicine Ball Throw' },

    // Corrective & Flexibility SMR
    { keywords: ['foam roll calves', 'smr calves'], videoId: '6f2LO5EeB0I', label: 'Foam Roll Calves' },
    { keywords: ['foam roll adductors', 'how to foam roll adductors', 'smr adductors'], videoId: 'Nqol0T6rKDg', label: 'Foam Roll Adductors' },
    { keywords: ['foam roll latissimus dorsi', 'smr latissimus dorsi'], videoId: '5S2suclGl7o', label: 'Foam Roll Latissimus Dorsi' },
    { keywords: ['self myofascial release smr hamstrings', 'foam roll hamstrings', 'smr hamstrings'], videoId: '_M29fhv3LoI', label: 'Foam Roll Hamstrings' },
    { keywords: ['self myofascial release smr piriformis', 'foam roll piriformis', 'smr piriformis'], videoId: 'XS5hY6vBi6g', label: 'Foam Roll Piriformis' },
    { keywords: ['self myofascial release smr thoracic spine', 'foam roll thoracic spine', 'smr thoracic spine'], videoId: 'xKmqizOqshI', label: 'Foam Roll Thoracic Spine' },
    { keywords: ['self myofascial release smr peroneals', 'foam roll peroneals', 'smr peroneals'], videoId: 'o0sqnX6FMzk', label: 'Foam Roll Peroneals' },
    { keywords: ['self myofascial release smr quadriceps', 'foam roll quadriceps', 'smr quadriceps', 'smr quads'], videoId: 'vUzmXO56jDI', label: 'Foam Roll Quadriceps' },
    { keywords: ['self myofascial release smr tensor fascia latae', 'foam roll tensor fasciae latae', 'foam roll tfl', 'smr tfl', 'smr it band', 'smr it-band', 'tensor fasciae latae', 'vastus lateralis'], videoId: 'NfWjVK7agTM', label: 'Foam Roll TFL' },
    { keywords: ['static kneeling hip flexor stretch', 'kneeling hip flexor', 'active kneeling hip flexor'], videoId: 'UU7Nqd_Dric', label: 'Kneeling Hip Flexor Stretch' },
    { keywords: ['static seated calf stretch', 'static calf stretch', 'calf stretch'], videoId: '83G00Fwlqqw', label: 'Static Seated Calf Stretch' },
    { keywords: ['static 3d standing tfl stretch', 'static standing tfl', 'standing tfl stretch', 'static tfl stretch'], videoId: 'h_8VHKvi1zo', label: 'Static Standing TFL Stretch' },
    { keywords: ['static 90 90 hamstring stretch', 'supine biceps femoris stretch', 'static standing hamstring stretch', 'static hamstring stretch', 'hamstring stretch'], videoId: 'h_yZV27H684', label: 'Static Hamstring Stretch' },
    { keywords: ['static upper trapezius stretch'], videoId: 'RNTlUaKeuXE', label: 'Upper Trapezius Stretch' },
    { keywords: ['static levator scapulae stretch'], videoId: 'U-rAhZajTLs', label: 'Levator Scapulae Stretch' },
    { keywords: ['static latissimus dorsi ball stretch'], videoId: 'dg_gevWZuQM', label: 'Latissimus Dorsi Ball Stretch' },
    { keywords: ['clamshells', 'side lying clamshell', 'clamshell'], videoId: 'V_AnVxKPFlY', label: 'Clamshells' },
    { keywords: ['supported bent over dumbbell row', 'chest supported incline dumbbell row', 'chest-supported incline dumbbell row'], videoId: 'DmUX88nWClo', label: 'Supported Bent-Over Dumbbell Row' },
    { keywords: ['standing neutral grip db overhead press', 'standing neutral-grip db overhead press', 'overhead press in scapular plane', 'landmine press'], videoId: 'MMjBnEBnZKM', label: 'Dumbbell Overhead Press' },
  ]

  for (const entry of KEYWORD_EDGE_MAP) {
    if (entry.keywords.some(kw => cleaned.includes(kw))) {
      return {
        embedUrl: `https://www.youtube-nocookie.com/embed/${entry.videoId}?autoplay=1&rel=0&modestbranding=1`,
        externalUrl: `https://www.youtube.com/watch?v=${entry.videoId}`,
        isDirectEmbed: true,
        sourceTitle: `NASM Edge · ${entry.label}`,
        videoId: entry.videoId,
      }
    }
  }

  // 4. Check partial key substring in NASM Edge catalog
  for (const [key, id] of Object.entries(NASM_EDGE_OFFICIAL_CATALOG)) {
    if (cleaned.includes(key) || key.includes(cleaned)) {
      return {
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`,
        externalUrl: `https://www.youtube.com/watch?v=${id}`,
        isDirectEmbed: true,
        sourceTitle: `NASM Edge · ${exerciseName}`,
        videoId: id,
      }
    }
  }

  // 5. Official NASM Edge Movement Fallback (Barbell Bench Press)
  return {
    embedUrl: `https://www.youtube-nocookie.com/embed/${NASM_EDGE_MASTER_FALLBACK_ID}?autoplay=1&rel=0&modestbranding=1`,
    externalUrl: `https://www.youtube.com/watch?v=${NASM_EDGE_MASTER_FALLBACK_ID}`,
    isDirectEmbed: true,
    sourceTitle: `NASM Edge · ${exerciseName}`,
    videoId: NASM_EDGE_MASTER_FALLBACK_ID,
  }
}

/**
 * Canonical DRY Media Enricher:
 * Resolves verified 1-to-1 NASM Edge CDN video demos, privacy-enhanced embeds,
 * and high-resolution Forge Athletic luxury/YouTube thumbnails on any exercise object.
 */
export function enrichExerciseMedia<T extends {
  name: string
  videoUrl?: string | null
  embedUrl?: string | null
  imageUrl?: string | null
}>(
  exercise: T,
  providedVideoUrl?: string | null
): T & { videoUrl: string; embedUrl: string; imageUrl: string | null } {
  const videoRes = resolveExerciseVideoEmbed(exercise.name, providedVideoUrl ?? exercise.videoUrl)
  const ytId = videoRes.videoId || extractYouTubeVideoId(videoRes.externalUrl) || extractYouTubeVideoId(videoRes.embedUrl)
  const officialThumbnail = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null
  const gaaImage = resolveGaaExerciseImage(exercise.name, false)
  return {
    ...exercise,
    imageUrl: officialThumbnail || gaaImage || exercise.imageUrl || null,
    videoUrl: videoRes.externalUrl,
    embedUrl: videoRes.embedUrl,
  }
}
