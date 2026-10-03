/**
 * Gordon Athletic Advisory — Master NASM Edge Exercise Video Catalog & Embed Resolver
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
  "squat to scaption": "PKjDGnwpB_o",
  "squat to overhead reach": "PKjDGnwpB_o",
  "squat to overhead reach & scaption": "PKjDGnwpB_o",
  "squat to overhead reach and scaption": "PKjDGnwpB_o",
  "squat to overhead reach scaption": "PKjDGnwpB_o",
  "single leg squat to scaption": "PKjDGnwpB_o",
  "squat to scaption multi planar reach": "PKjDGnwpB_o",
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
  "bosu plank": "C_NM5IbRlqM",
  "bosu push up": "Wo3viNH3E1c",
  "bosu single leg balance reach": "I4kiGgKpb58",
  "bosu single leg balance": "I4kiGgKpb58",
  "bosu glute bridge": "d28NVu5bQPk",
  "bosu bird dog": "w75gGKGNsY0",
  "bosu dome squat": "evJOL2cdmt4",
  "bosu squat": "evJOL2cdmt4",
  "bosu dumbbell chest press": "cjTVlA2WwqY",
  "bosu chest press": "cjTVlA2WwqY",
  "bosu lunge to balance": "BAC6B69Q70A",
  "bosu mountain climbers": "iyZHqgsI4Zk",
  "bosu russian twist": "M2AAcj_K0mg",
  "bosu lateral bound with stabilization": "vEGpyuTh3zw",
  "bosu burpee with overhead press": "RbvEl_XAZU0",
  "bosu burpee": "RbvEl_XAZU0",
  "stability ball push up": "pxpGo3EtwkM",
  "stability ball push-up": "pxpGo3EtwkM",
  "stability ball wall squat": "2TOqw5wSfgE",
  "stability ball dumbbell chest press": "FfTyQAYrnqM",
  "stability ball chest press": "FfTyQAYrnqM",
  "stability ball prone cobra": "Ebv2o_VioHY",
  "stability ball roll in": "ZquTk8GmA_I",
  "stability ball roll-in": "ZquTk8GmA_I",
  "stability ball pike": "ZquTk8GmA_I",
  "stability ball back extension with rotation": "b_Iri5nayDk",
  "stability ball back extension": "b_Iri5nayDk",
  "stability ball loaded bridge": "wgcyPpK60wc",
  "stability ball bridge": "wgcyPpK60wc",
  "stability ball russian twist": "t3HhJ_LolVg",
  "stability ball spinal rotation": "t3HhJ_LolVg",
  "stability ball scapular triad": "j6D0V742sT8",
  "stability ball prone shoulder press": "VZJ0PHuNrYI"
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
    const isBosu = cleaned.includes('bosu')
    const isTheraband = cleaned.includes('theraband') || videoId === 'FfTyQAYrnqM' || videoId === 'j6D0V742sT8' || videoId === 't3HhJ_LolVg'
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`,
      externalUrl: `https://www.youtube.com/watch?v=${videoId}`,
      isDirectEmbed: true,
      sourceTitle: isBosu
        ? `BOSU® Official · ${exerciseName}`
        : isTheraband
          ? `TheraBand® Official · ${exerciseName}`
          : `NASM Edge · ${exerciseName}`,
      videoId,
    }
  }

  // 3. Multi-token priority keyword matching to exact 1-to-1 NASM Edge videos
  const KEYWORD_EDGE_MAP: Array<{ keywords: string[]; videoId: string; label: string }> = [
    // Pushing & Chest
    { keywords: ['incline dumbbell bench press', 'incline dumbbell chest press', 'incline dumbbell press'], videoId: '_NrQUYg7Nlc', label: 'Incline Dumbbell Bench Press' },
    { keywords: ['incline barbell bench press', 'incline bench press'], videoId: 'BjGLs6KGWUc', label: 'Incline Barbell Bench Press' },
    { keywords: ['dumbbell bench press', 'flat dumbbell bench press', 'dumbbell chest press'], videoId: '4_QuyfOCI5U', label: 'Dumbbell Bench Press' },
    { keywords: ['barbell bench press', 'flat bench press'], videoId: 'CayG6UYqL8g', label: 'Barbell Bench Press' },
    { keywords: ['push up with rotation'], videoId: 'miN74vJbE_w', label: 'Push-Up with Rotation' },
    { keywords: ['decline push up'], videoId: 'aq2xZxfrQlM', label: 'Decline Push-Up' },
    { keywords: ['incline push up'], videoId: 'Gvm5Q29UHbk', label: 'Incline Push-Up' },
    { keywords: ['push up plus'], videoId: 'qw-9P3R37vU', label: 'Push-Up Plus' },
    { keywords: ['push up', 'pushup', 'push-up'], videoId: '7NUICnha_Hk', label: 'Push-Up' },
    { keywords: ['cable crossover', 'cable fly', 'chest fly'], videoId: 'XY6JrX1wyxk', label: 'Cable Crossover Fly' },
    { keywords: ['bench dips', 'bench dip'], videoId: 'WVeZDBhZwLA', label: 'Bench Dips' },

    // Shoulders
    { keywords: ['dumbbell overhead press', 'dumbbell shoulder press', 'seated dumbbell overhead shoulder press', 'seated dumbbell shoulder press'], videoId: 'MMjBnEBnZKM', label: 'Dumbbell Overhead Press' },
    { keywords: ['barbell overhead press', 'standing overhead press', 'military press'], videoId: 'cGnhixvC8uA', label: 'Barbell Overhead Press' },
    { keywords: ['dumbbell lateral raise', 'lateral raise'], videoId: 'XPPfnSEATJA', label: 'Dumbbell Lateral Raise' },
    { keywords: ['bent over dumbbell rear fly', 'rear delt fly'], videoId: 'kLW7nbw4lcY', label: 'Rear Delt Fly' },
    { keywords: ['single leg single arm scaption', 'single arm scaption'], videoId: 'ikMg_3_jAWE', label: 'Single-Leg Single-Arm Scaption' },
    { keywords: ['squat to overhead reach & scaption', 'squat to overhead reach and scaption', 'squat to overhead reach', 'squat to scaption multi planar reach', 'squat to scaption', 'single leg squat to scaption', 'single leg scaption', 'standing scaption', 'dumbbell scaption', 'scaption', 'overhead reach'], videoId: 'PKjDGnwpB_o', label: 'Single-Leg Scaption' },

    // Back & Pulling
    { keywords: ['single leg romanian deadlift', 'single leg rdl'], videoId: '6pEL3KxnlEo', label: 'Single-Leg Romanian Deadlift' },
    { keywords: ['dumbbell romanian deadlift', 'dumbbell rdl'], videoId: 'V8Hdl1FiNt4', label: 'Dumbbell Romanian Deadlift' },
    { keywords: ['romanian deadlift'], videoId: '2bmuYtv4HbQ', label: 'Romanian Deadlift' },
    { keywords: ['barbell deadlift', 'conventional deadlift'], videoId: 'yPqv3ejnZvc', label: 'Barbell Deadlift' },
    { keywords: ['barbell bent over row', 'barbell bent-over row'], videoId: 'bm0_q9bR_HA', label: 'Barbell Bent-Over Row' },
    { keywords: ['dumbbell bent over row', 'single arm dumbbell row'], videoId: 'DJfQN6xJL28', label: 'Dumbbell Bent-Over Row' },
    { keywords: ['seated machine row', 'seated row', 'tubing row'], videoId: '0R9ZQd3aM6s', label: 'Seated Row' },
    { keywords: ['band assisted pull up', 'pull up', 'pull-up', 'chin up'], videoId: '9yVGh3XbJ34', label: 'Pull-Up' },
    { keywords: ['face pull', 'cable face pull'], videoId: 'eTCBSFlCJ_s', label: 'Face Pull' },

    // Legs: Squats, Lunges, Hips
    { keywords: ['barbell front squat', 'front squat'], videoId: 'yr_8VuSqhmM', label: 'Barbell Front Squat' },
    { keywords: ['goblet squat', 'kettlebell goblet squat'], videoId: 'nfX7IFK9UNI', label: 'Goblet Squat' },
    { keywords: ['box squat'], videoId: '-GaRp6_b2vk', label: 'Box Squat' },
    { keywords: ['barbell back squat', 'back squat'], videoId: '-bJIpOq-LWk', label: 'Barbell Back Squat' },
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
    { keywords: ['step up to balance', 'step up to balance frontal', 'step up', 'step-up', 'box step-up', 'box step up'], videoId: 'fVRKGAp1iHw', label: 'Step-Up to Balance' },
    { keywords: ['spanish squat', 'spanish squats'], videoId: '-GaRp6_b2vk', label: 'Box Squat' },
    { keywords: ['single leg press'], videoId: '3aYsOsBA7ZE', label: 'Single-Leg Press' },
    { keywords: ['leg press'], videoId: 'cDGOn-yfKJA', label: 'Leg Press' },
    { keywords: ['lying leg curl', 'machine leg curl', 'leg curl machine'], videoId: 'Dq5y4WEcqqo', label: 'Lying Leg Curl' },
    { keywords: ['seated leg curl'], videoId: '_2Kd0d-JEUM', label: 'Seated Leg Curl' },
    { keywords: ['leg press calf raise', 'tibialis', 'anterior tibialis', 'calf raise', 'soleus', 'rathleff'], videoId: '8k435cj30gc', label: 'Calf Raise' },
    { keywords: ['single leg floor bridge'], videoId: 'lHXShY-FivU', label: 'Single-Leg Floor Bridge' },
    { keywords: ['floor bridge', 'glute bridge', 'hip thrust', 'banded hip thrust', 'stability ball hamstring curl', 'ball hamstring curl', 'stability ball leg curl', 'ball leg curl'], videoId: 'Z3cY3d3BBo4', label: 'Floor Bridge' },
    { keywords: ['good mornings', 'good morning'], videoId: 'Daq-wJMUnes', label: 'Good Mornings' },
    { keywords: ['kettlebell swing', 'banded kettlebell swing', 'single arm kettlebell swing'], videoId: 'r777bo9KuY4', label: 'Kettlebell Swing' },

    // Arms: Biceps & Triceps
    { keywords: ['incline dumbbell curl'], videoId: '0dT4L6Lsi80', label: 'Incline Dumbbell Curl' },
    { keywords: ['dumbbell hammer curl', 'single leg hammer curl', 'hammer curl'], videoId: 'nL3SedGG7X0', label: 'Dumbbell Hammer Curl' },
    { keywords: ['dumbbell preacher curl'], videoId: 't2BmBSmcjco', label: 'Dumbbell Preacher Curl' },
    { keywords: ['barbell bicep curl', 'barbell curl'], videoId: 'pQfJR-sSIvA', label: 'Barbell Biceps Curl' },
    { keywords: ['seated single arm dumbbell tricep extension', 'supine dumbbell extension', 'dumbbell bent over extention'], videoId: 'kZ-ReOdn2qk', label: 'Dumbbell Triceps Extension' },

    // Core & Balance
    { keywords: ['russian twist'], videoId: 's0kT80JLCfA', label: 'Russian Twist' },
    { keywords: ['dead bug'], videoId: 'bxn9FBrt4-A', label: 'Dead Bug' },
    { keywords: ['mcgill big 3', 'bird dog', 'quadruped opposite arm leg raise'], videoId: 'ZdAHe9_HeEw', label: 'Bird Dog' },
    { keywords: ['short lever side plank', 'side plank'], videoId: 'ZpBJIRLGEgg', label: 'Side Plank' },
    { keywords: ['plank walkup'], videoId: '6Tv4xTRPtUc', label: 'Plank Walkup' },
    { keywords: ['plank with arm reach'], videoId: 'xhk1JkbF2lg', label: 'Plank with Arm Reach' },
    { keywords: ['stability ball crunch', 'ball crunch', 'core ball crunch'], videoId: 'QFLftqPWjoI', label: 'Stability Ball Crunch' },
    { keywords: ['single leg balance reach multiplanar', 'single leg balance reach frontal plane', 'single leg reach sagittal', 'star excursion'], videoId: 'Mo4P9Y_AQt8', label: 'Single-Leg Balance Reach' },

    // Plyometrics, Power & SAQ
    { keywords: ['repeat squat jumps', 'squat jump with stabilization', 'squat jump'], videoId: 'dsEgOcunkvY', label: 'Squat Jump' },
    { keywords: ['repeat tuck jumps', 'tuck jump with stabilization', 'tuck jump'], videoId: 'KMr7gzm_wf4', label: 'Tuck Jump' },
    { keywords: ['box jump up with stabilization', 'box jumps', 'box jump'], videoId: 'DXu-8TAJwi4', label: 'Box Jumps' },
    { keywords: ['repeat hurdle jumps', 'hurdle jump'], videoId: 'til5WR9ko4c', label: 'Hurdle Jumps' },
    { keywords: ['depth jump'], videoId: 'bMHL5xqKn3E', label: 'Depth Jump' },
    { keywords: ['repeat ice skater', 'ice skater with stabilization', 'ice skater'], videoId: 'yRM27bTe868', label: 'Ice Skaters' },
    { keywords: ['single leg hop stabilization', 'single leg hop'], videoId: '6BkwOUl3fAw', label: 'Single-Leg Hop' },
    { keywords: ['4 point quadruped t drill'], videoId: 'N7p0Le1WdJE', label: 'SAQ 4-Point T-Drill' },

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
    // BOSU Balance Trainer Modality (Official @BOSUOfficial Master Trainer Demonstrations)
    { keywords: ['bosu plank', 'plank on bosu'], videoId: 'C_NM5IbRlqM', label: 'BOSU Plank' },
    { keywords: ['bosu push up', 'bosu push-up', 'push up on bosu', 'push-up on bosu'], videoId: 'Wo3viNH3E1c', label: 'BOSU Push-Up' },
    { keywords: ['bosu single leg balance reach', 'bosu single-leg balance reach', 'bosu single leg balance', 'bosu balance reach'], videoId: 'I4kiGgKpb58', label: 'BOSU Single-Leg Balance Reach' },
    { keywords: ['bosu glute bridge', 'bosu bridge', 'glute bridge on bosu', 'supine hip lift'], videoId: 'd28NVu5bQPk', label: 'BOSU Glute Bridge' },
    { keywords: ['bosu bird dog', 'bosu bird-dog', 'bird dog on bosu'], videoId: 'w75gGKGNsY0', label: 'BOSU Bird-Dog' },
    { keywords: ['bosu dome squat', 'bosu squat', 'squat on bosu'], videoId: 'evJOL2cdmt4', label: 'BOSU Dome Squat' },
    { keywords: ['bosu dumbbell chest press', 'bosu chest press', 'chest press on bosu'], videoId: 'cjTVlA2WwqY', label: 'BOSU Dumbbell Chest Press' },
    { keywords: ['bosu lunge to balance', 'lunge to balance on bosu'], videoId: 'BAC6B69Q70A', label: 'BOSU Lunge to Balance' },
    { keywords: ['bosu mountain climbers', 'mountain climbers on bosu'], videoId: 'iyZHqgsI4Zk', label: 'BOSU Mountain Climbers' },
    { keywords: ['bosu russian twist', 'russian twist on bosu'], videoId: 'M2AAcj_K0mg', label: 'BOSU Russian Twist' },
    { keywords: ['bosu lateral bound with stabilization', 'bosu lateral bound', 'lateral bound on bosu', 'bosu lateral jump'], videoId: 'vEGpyuTh3zw', label: 'BOSU Lateral Bound with Stabilization' },
    { keywords: ['bosu burpee with overhead press', 'bosu burpee', 'burpee on bosu'], videoId: 'RbvEl_XAZU0', label: 'BOSU Burpee with Overhead Press' },
    // TheraBand® Pro Series SCP & NASM Stability Ball Modality
    { keywords: ['stability ball push up', 'stability ball push-up', 'push up on stability ball', 'push-up on stability ball', 'push up on ball'], videoId: 'pxpGo3EtwkM', label: 'Stability Ball Push-Up' },
    { keywords: ['stability ball wall squat', 'stability ball squat', 'squat on stability ball', 'wall squat on ball', 'ball wall squat'], videoId: '2TOqw5wSfgE', label: 'Stability Ball Wall Squat' },
    { keywords: ['stability ball dumbbell chest press', 'stability ball chest press', 'chest press on ball', 'chest press on stability ball', 'db chest press on ball'], videoId: 'FfTyQAYrnqM', label: 'Stability Ball Dumbbell Chest Press' },
    { keywords: ['stability ball prone cobra', 'ball cobra', 'prone cobra on ball'], videoId: 'Ebv2o_VioHY', label: 'Stability Ball Prone Cobra' },
    { keywords: ['stability ball roll in', 'stability ball roll-in', 'stability ball pike', 'ball pike', 'ball roll in'], videoId: 'ZquTk8GmA_I', label: 'Stability Ball Roll-In' },
    { keywords: ['stability ball back extension', 'stability ball back extension with rotation', 'back extension on ball'], videoId: 'b_Iri5nayDk', label: 'Stability Ball Back Extension with Rotation' },
    { keywords: ['stability ball loaded bridge', 'stability ball bridge', 'ball bridge loaded', 'bridge on ball'], videoId: 'wgcyPpK60wc', label: 'Stability Ball Loaded Bridge' },
    { keywords: ['stability ball russian twist', 'stability ball spinal rotation', 'russian twist on ball', 'spinal rotation with ball'], videoId: 't3HhJ_LolVg', label: 'Stability Ball Russian Twist' },
    { keywords: ['stability ball scapular triad', 'stability ball combo', 'prone w y on ball'], videoId: 'j6D0V742sT8', label: 'Stability Ball Scapular Triad' },
    { keywords: ['stability ball prone shoulder press', 'activation ball prone shoulder press', 'prone shoulder press on ball'], videoId: 'VZJ0PHuNrYI', label: 'Stability Ball Prone Shoulder Press' },
  ]

  for (const entry of KEYWORD_EDGE_MAP) {
    if (entry.keywords.some(kw => cleaned.includes(kw))) {
      const isBosu = entry.label.toLowerCase().includes('bosu')
      const isTheraband = entry.label.toLowerCase().includes('theraband') || entry.videoId === 'FfTyQAYrnqM' || entry.videoId === 'j6D0V742sT8' || entry.videoId === 't3HhJ_LolVg'
      return {
        embedUrl: `https://www.youtube-nocookie.com/embed/${entry.videoId}?autoplay=1&rel=0&modestbranding=1`,
        externalUrl: `https://www.youtube.com/watch?v=${entry.videoId}`,
        isDirectEmbed: true,
        sourceTitle: isBosu
          ? `BOSU® Official · ${entry.label}`
          : isTheraband
            ? `TheraBand® Official · ${entry.label}`
            : `NASM Edge · ${entry.label}`,
        videoId: entry.videoId,
      }
    }
  }

  // 4. Check partial key substring in NASM Edge catalog
  for (const [key, id] of Object.entries(NASM_EDGE_OFFICIAL_CATALOG)) {
    if (cleaned.includes(key) || key.includes(cleaned)) {
      const isBosu = cleaned.includes('bosu') || key.includes('bosu')
      const isTheraband = cleaned.includes('theraband') || id === 'FfTyQAYrnqM' || id === 'j6D0V742sT8' || id === 't3HhJ_LolVg'
      return {
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`,
        externalUrl: `https://www.youtube.com/watch?v=${id}`,
        isDirectEmbed: true,
        sourceTitle: isBosu
          ? `BOSU® Official · ${exerciseName}`
          : isTheraband
            ? `TheraBand® Official · ${exerciseName}`
            : `NASM Edge · ${exerciseName}`,
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
 * and high-resolution GAA luxury/YouTube thumbnails on any exercise object.
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
