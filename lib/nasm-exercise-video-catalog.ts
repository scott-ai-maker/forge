/**
 * Forge Athletic — Sovereign First-Party Exercise Video Catalog & Media Resolver
 * 100% self-hosted Forge Athletic studio MP4 demonstrations (/videos/exercises/*.mp4)
 * and first-party studio photography (/images/exercises/*.jpg).
 * Zero third-party YouTube iframes, zero YouTube thumbnail hotlinks, zero external ad trackers.
 */

import { resolveGaaExerciseImage, resolveForgeExerciseVideo } from './nasm-generated-images'

export interface ExerciseVideoResolution {
  embedUrl: string
  externalUrl: string
  isDirectEmbed: boolean
  sourceTitle: string
  videoId: string | null
}

// 333 Canonical Exercise Keys -> Sovereign First-Party Forge Athletic Studio MP4 Loops
export const NASM_EDGE_OFFICIAL_CATALOG: Record<string, string> = {
  "depth jump": "/videos/exercises/depth-jump.mp4",
  "transverse box jump down to tuck jump": "/videos/exercises/transverse-box-jump-down-to-tuck-jump.mp4",
  "repeat squat jumps": "/videos/exercises/repeat-squat-jumps.mp4",
  "depth jump frontal": "/videos/exercises/depth-jump-frontal.mp4",
  "incline push up with rotation": "/videos/exercises/incline-push-up-with-rotation.mp4",
  "box jump up with stabilization frontal": "/videos/exercises/box-jump-up-with-stabilization-frontal.mp4",
  "repeat hurdle jumps transverse": "/videos/exercises/repeat-hurdle-jumps-transverse.mp4",
  "repeat hurdle jumps": "/videos/exercises/repeat-hurdle-jumps.mp4",
  "repeat tuck jumps": "/videos/exercises/repeat-tuck-jumps.mp4",
  "4 point quadruped t drill": "/videos/exercises/4-point-quadruped-t-drill.mp4",
  "tuck jump with stabilization": "/videos/exercises/tuck-jump-with-stabilization.mp4",
  "squat jump with stabilization": "/videos/exercises/squat-jump-with-stabilization.mp4",
  "dumbbell romanian deadlift": "/videos/exercises/dumbbell-romanian-deadlift.mp4",
  "pike push up": "/videos/exercises/pike-push-up.mp4",
  "frontal box jump down to tuck jump": "/videos/exercises/frontal-box-jump-down-to-tuck-jump.mp4",
  "archer push up": "/videos/exercises/archer-push-up.mp4",
  "inverted push up": "/videos/exercises/inverted-push-up.mp4",
  "push up": "/videos/exercises/push-up.mp4",
  "incline push up": "/videos/exercises/incline-push-up.mp4",
  "forward and back band walking": "/videos/exercises/forward-and-back-band-walking.mp4",
  "bulgarian split squat": "/videos/exercises/bulgarian-split-squat.mp4",
  "push up with staggered hands": "/videos/exercises/push-up-with-staggered-hands.mp4",
  "single leg hop stabilization level 1": "/videos/exercises/single-leg-hop-stabilization-level-1.mp4",
  "active standing hip flexor": "/videos/exercises/active-standing-hip-flexor.mp4",
  "seated row": "/videos/exercises/seated-row.mp4",
  "single leg hop stabilization level 2": "/videos/exercises/single-leg-hop-stabilization-level-2.mp4",
  "push up to 3 point stance": "/videos/exercises/push-up-to-3-point-stance.mp4",
  "foam roll calves": "/videos/exercises/foam-roll-calves.mp4",
  "single leg romanian deadlift to pnf pattern 2": "/videos/exercises/single-leg-romanian-deadlift-to-pnf-pattern-2.mp4",
  "single leg cobra to hip extension": "/videos/exercises/single-leg-cobra-to-hip-extension.mp4",
  "good mornings": "/videos/exercises/good-mornings.mp4",
  "plank walkup": "/videos/exercises/plank-walkup.mp4",
  "single leg balance reach frontal plane": "/videos/exercises/single-leg-balance-reach-frontal-plane.mp4",
  "ladder jumping jacks": "/videos/exercises/ladder-jumping-jacks.mp4",
  "decline push up": "/videos/exercises/decline-push-up.mp4",
  "single leg floor bridge": "/videos/exercises/single-leg-floor-bridge.mp4",
  "quadruped arm raise": "/videos/exercises/quadruped-arm-raise.mp4",
  "goblet squat": "/videos/exercises/goblet-squat.mp4",
  "kettlebell front squat": "/videos/exercises/kettlebell-front-squat.mp4",
  "single leg scaption": "/videos/exercises/single-leg-scaption.mp4",
  "scaption": "/videos/exercises/single-leg-scaption.mp4",
  "squat to scaption": "/videos/exercises/squat-to-overhead-reach.mp4",
  "squat to overhead reach": "/videos/exercises/squat-to-overhead-reach.mp4",
  "squat to overhead reach & scaption": "/videos/exercises/squat-to-overhead-reach.mp4",
  "squat to overhead reach and scaption": "/videos/exercises/squat-to-overhead-reach.mp4",
  "squat to overhead reach scaption": "/videos/exercises/squat-to-overhead-reach.mp4",
  "single leg squat to scaption": "/videos/exercises/squat-to-overhead-reach.mp4",
  "squat to scaption multi planar reach": "/videos/exercises/squat-to-overhead-reach.mp4",
  "standing scaption": "/videos/exercises/single-leg-scaption.mp4",
  "dumbbell scaption": "/videos/exercises/single-leg-scaption.mp4",
  "tuck jump": "/videos/exercises/tuck-jump.mp4",
  "self myofascial release smr hamstrings": "/videos/exercises/self-myofascial-release-smr-hamstrings.mp4",
  "push up plus": "/videos/exercises/push-up-plus.mp4",
  "single leg romanian deadlift": "/videos/exercises/single-leg-romanian-deadlift.mp4",
  "self myofascial release smr piriformis": "/videos/exercises/self-myofascial-release-smr-piriformis.mp4",
  "single leg throw and catch transverse 1": "/videos/exercises/single-leg-throw-and-catch-transverse-1.mp4",
  "self myofascial release smr peroneals": "/videos/exercises/self-myofascial-release-smr-peroneals.mp4",
  "band assisted pull up": "/videos/exercises/band-assisted-pull-up.mp4",
  "squat to row": "/videos/exercises/squat-to-row.mp4",
  "leg press calf raise": "/videos/exercises/leg-press-calf-raise.mp4",
  "russian twist": "/videos/exercises/russian-twist.mp4",
  "activation ball prone wide row": "/videos/exercises/ball-prone-wide-row.mp4",
  "barbell deadlift": "/videos/exercises/barbell-deadlift.mp4",
  "single leg press": "/videos/exercises/single-leg-press.mp4",
  "barbell front squat with crossed arms": "/videos/exercises/barbell-front-squat-with-crossed-arms.mp4",
  "cable crossover": "/videos/exercises/cable-crossover.mp4",
  "dead bug": "/videos/exercises/dead-bug.mp4",
  "leg circuit frontal": "/videos/exercises/leg-circuit-frontal.mp4",
  "face pull": "/videos/exercises/face-pull.mp4",
  "quadruped opposite arm leg raise": "/videos/exercises/quadruped-opposite-arm-leg-raise.mp4",
  "how to foam roll adductors": "/videos/exercises/foam-roll-adductors.mp4",
  "squat jump": "/videos/exercises/squat-jump.mp4",
  "single arm dumbbell chest press": "/videos/exercises/single-arm-dumbbell-chest-press.mp4",
  "close grip bench press": "/videos/exercises/close-grip-bench-press.mp4",
  "chest press machine": "/videos/exercises/chest-press-machine.mp4",
  "kettlebell jerk": "/videos/exercises/kettlebell-jerk.mp4",
  "lying leg curl two leg concentric single leg eccentric": "/videos/exercises/lying-leg-curl-two-leg-concentric-single-leg-eccentric.mp4",
  "seated machine row close grip": "/videos/exercises/seated-machine-row-close-grip.mp4",
  "two arm incline dumbbell chest press": "/videos/exercises/two-arm-incline-dumbbell-chest-press.mp4",
  "reverse crunch to knee up with rotation": "/videos/exercises/reverse-crunch-to-knee-up-with-rotation.mp4",
  "dumbbell preacher curl": "/videos/exercises/dumbbell-preacher-curl.mp4",
  "reverse lunge to single arm row": "/videos/exercises/reverse-lunge-to-single-arm-row.mp4",
  "single leg seated leg curl": "/videos/exercises/single-leg-seated-leg-curl.mp4",
  "ball cobra": "/videos/exercises/ball-cobra.mp4",
  "standing tubing row": "/videos/exercises/standing-tubing-row.mp4",
  "single leg squat touchdown": "/videos/exercises/single-leg-squat-touchdown.mp4",
  "incline barbell bench press": "/videos/exercises/incline-barbell-bench-press.mp4",
  "single arm incline dumbbell chest press": "/videos/exercises/single-arm-incline-dumbbell-chest-press.mp4",
  "static upper trapezius stretch": "/videos/exercises/static-upper-trapezius-stretch.mp4",
  "lying leg curl single leg": "/videos/exercises/lying-leg-curl-single-leg.mp4",
  "stability ball hamstring curl": "/videos/exercises/floor-bridge.mp4",
  "ball hamstring curl": "/videos/exercises/floor-bridge.mp4",
  "static latissimus dorsi ball stretch": "/videos/exercises/static-latissimus-dorsi-ball-stretch.mp4",
  "active kneeling hip flexor": "/videos/exercises/active-kneeling-hip-flexor.mp4",
  "static butterfly stretch": "/videos/exercises/static-butterfly-stretch.mp4",
  "activation medial hamstring": "/videos/exercises/activation-medial-hamstring.mp4",
  "activation posterior tibialis": "/videos/exercises/activation-posterior-tibialis.mp4",
  "band push up": "/videos/exercises/band-push-up.mp4",
  "assisted single leg squat": "/videos/exercises/assisted-single-leg-squat.mp4",
  "active supine biceps femoris": "/videos/exercises/active-supine-biceps-femoris.mp4",
  "active lat ball": "/videos/exercises/active-lat-ball.mp4",
  "kettlebell goblet squat": "/videos/exercises/kettlebell-goblet-squat.mp4",
  "plank with knees down": "/videos/exercises/plank-with-knees-down.mp4",
  "single leg throw and catch transverse 2": "/videos/exercises/single-leg-throw-and-catch-transverse-2.mp4",
  "single leg balance reach transverse": "/videos/exercises/single-leg-balance-reach-transverse.mp4",
  "single leg lift and chop": "/videos/exercises/single-leg-lift-and-chop.mp4",
  "ball combo i": "/videos/exercises/ball-combo-i.mp4",
  "step up to balance frontal curl to overhead press": "/videos/exercises/step-up-to-balance-frontal-curl-to-overhead-press.mp4",
  "box squat curl to overhead press": "/videos/exercises/box-squat-curl-to-overhead-press.mp4",
  "barbell bench press with chains": "/videos/exercises/barbell-bench-press-with-chains.mp4",
  "static levator scapulae stretch": "/videos/exercises/static-levator-scapulae-stretch.mp4",
  "clamshells": "/videos/exercises/clamshells.mp4",
  "kettlebell overhead press": "/videos/exercises/kettlebell-overhead-press.mp4",
  "ball crunch arms crossed": "/videos/exercises/ball-crunch-arms-crossed.mp4",
  "half kneeling tubing rotation": "/videos/exercises/half-kneeling-tubing-rotation.mp4",
  "single leg romanian deadlift to pnf pattern 1": "/videos/exercises/single-leg-romanian-deadlift-to-pnf-pattern-1.mp4",
  "push press": "/videos/exercises/push-press.mp4",
  "dumbbell bent over extention": "/videos/exercises/dumbbell-bent-over-extension.mp4",
  "dumbbell bench press": "/videos/exercises/dumbbell-bench-press.mp4",
  "dumbbell lateral raise": "/videos/exercises/dumbbell-lateral-raise.mp4",
  "dumbbell hammer curl": "/videos/exercises/dumbbell-hammer-curl.mp4",
  "dumbbell overhead press": "/videos/exercises/dumbbell-overhead-press.mp4",
  "bent over dumbbell rear fly": "/videos/exercises/bent-over-dumbbell-rear-fly.mp4",
  "reverse lunge": "/videos/exercises/reverse-lunge-to-balance.mp4",
  "reverse lunges": "/videos/exercises/reverse-lunge-to-balance.mp4",
  "reverse lunge to balance": "/videos/exercises/reverse-lunge-to-balance.mp4",
  "reverse lunge with torso lean": "/videos/exercises/reverse-lunge-with-torso-lean.mp4",
  "reverse lunge with forward torso lean": "/videos/exercises/reverse-lunge-to-balance.mp4",
  "reverse lunge with torso lean step up to low box": "/videos/exercises/reverse-lunge-to-balance.mp4",
  "reverse lunge with torso lean / step-up to low box": "/videos/exercises/reverse-lunge-to-balance.mp4",
  "dumbbell reverse lunge": "/videos/exercises/reverse-lunge-to-balance.mp4",
  "bodyweight reverse lunge": "/videos/exercises/reverse-lunge-to-balance.mp4",
  "reverse lunge from step": "/videos/exercises/reverse-lunge-to-balance.mp4",
  "mb figure 8": "/videos/exercises/mb-figure-8.mp4",
  "supported bent over dumbbell row": "/videos/exercises/supported-bent-over-dumbbell-row.mp4",
  "supported bent over dumbbell extension": "/videos/exercises/supported-bent-over-dumbbell-extension.mp4",
  "kettlebell clean": "/videos/exercises/kettlebell-clean.mp4",
  "incline stance single arm row": "/videos/exercises/incline-stance-single-arm-row.mp4",
  "incline stance row": "/videos/exercises/incline-stance-row.mp4",
  "single arm standing chest press": "/videos/exercises/single-arm-standing-chest-press.mp4",
  "medicine ball push up to 3 point": "/videos/exercises/medicine-ball-push-up-to-3-point.mp4",
  "kettlebell renegade row": "/videos/exercises/kettlebell-renegade-row.mp4",
  "bent over barbel row supinated": "/videos/exercises/bent-over-barbell-row-supinated.mp4",
  "single leg throw and catch": "/videos/exercises/single-leg-throw-and-catch.mp4",
  "zig zag shuffle": "/videos/exercises/zig-zag-shuffle.mp4",
  "activation standing glute max": "/videos/exercises/activation-standing-glute-max.mp4",
  "bent elbow dumbbell lateral raise": "/videos/exercises/bent-elbow-dumbbell-lateral-raise.mp4",
  "self myofascial release smr lateral thigh": "/videos/exercises/self-myofascial-release-smr-lateral-thigh.mp4",
  "self myofascial release smr thoracic spine": "/videos/exercises/self-myofascial-release-smr-thoracic-spine.mp4",
  "activation medial gastrocnemius": "/videos/exercises/activation-medial-gastrocnemius.mp4",
  "step up to balance frontal": "/videos/exercises/step-up-to-balance-frontal.mp4",
  "alternating dumbbell bench press": "/videos/exercises/alternating-dumbbell-bench-press.mp4",
  "barbell bicep curl": "/videos/exercises/barbell-bicep-curl.mp4",
  "romanian deadlift": "/videos/exercises/romanian-deadlift.mp4",
  "in in out out crossover ladder drill": "/videos/exercises/in-in-out-out-crossover-ladder-drill.mp4",
  "activation anterior tibialis": "/videos/exercises/activation-anterior-tibialis.mp4",
  "box squat": "/videos/exercises/box-squat.mp4",
  "single leg romanian deadlift curl to overhead press": "/videos/exercises/single-leg-romanian-deadlift-curl-to-overhead-press.mp4",
  "dumbbell combination curl": "/videos/exercises/dumbbell-combination-curl.mp4",
  "quadruped march": "/videos/exercises/quadruped-march.mp4",
  "floor prone cobra": "/videos/exercises/floor-prone-cobra.mp4",
  "single leg balance reach multiplanar": "/videos/exercises/single-leg-balance-reach-multiplanar.mp4",
  "ball crunch": "/videos/exercises/ball-crunch.mp4",
  "hammer curl to lateral raise": "/videos/exercises/hammer-curl-to-lateral-raise.mp4",
  "plank": "/videos/exercises/plank.mp4",
  "dumbbell front squat": "/videos/exercises/dumbbell-front-squat.mp4",
  "single leg romanian deadlift single arm curl to overhead press": "/videos/exercises/single-leg-romanian-deadlift-single-arm-curl-to-overhead-press.mp4",
  "single leg hammer curl": "/videos/exercises/single-leg-hammer-curl.mp4",
  "squat thrust burpees": "/videos/exercises/squat-thrust-burpees.mp4",
  "static 3d kneeling hip flexor stretch": "/videos/exercises/static-3d-kneeling-hip-flexor-stretch.mp4",
  "sternocleidomastoid stretch": "/videos/exercises/sternocleidomastoid-stretch.mp4",
  "push up with rotation": "/videos/exercises/push-up-with-rotation.mp4",
  "leg circuit": "/videos/exercises/leg-circuit.mp4",
  "leg press": "/videos/exercises/leg-press.mp4",
  "lying leg curl": "/videos/exercises/lying-leg-curl.mp4",
  "ice skater with stabilization": "/videos/exercises/ice-skater-with-stabilization.mp4",
  "double kettlebell clean": "/videos/exercises/double-kettlebell-clean.mp4",
  "half get up with kettlebell": "/videos/exercises/half-get-up-with-kettlebell.mp4",
  "kettlebell push press": "/videos/exercises/kettlebell-push-press.mp4",
  "single arm kettlebell high pull": "/videos/exercises/single-arm-kettlebell-high-pull.mp4",
  "lateral band walking": "/videos/exercises/lateral-band-walking.mp4",
  "box jump up with stabilization transverse": "/videos/exercises/box-jump-up-with-stabilization-transverse.mp4",
  "depth jump transverse": "/videos/exercises/depth-jump-transverse.mp4",
  "repeat hurdle jump frontal": "/videos/exercises/repeat-hurdle-jump-frontal.mp4",
  "two ins ladder drill": "/videos/exercises/two-ins-ladder-drill.mp4",
  "power step up": "/videos/exercises/power-step-up.mp4",
  "repeat squat jumps frontal": "/videos/exercises/repeat-squat-jumps-frontal.mp4",
  "pull up": "/videos/exercises/pull-up.mp4",
  "box jump up with stabilization": "/videos/exercises/box-jump-up-with-stabilization.mp4",
  "quadruped leg raise": "/videos/exercises/quadruped-leg-raise.mp4",
  "repeat squat jumps transverse": "/videos/exercises/repeat-squat-jumps-transverse.mp4",
  "dumbbell squat to overhead press": "/videos/exercises/dumbbell-squat-to-overhead-press.mp4",
  "active standing adductor": "/videos/exercises/active-standing-adductor.mp4",
  "single leg single arm scaption": "/videos/exercises/single-leg-single-arm-scaption.mp4",
  "single arm scaption": "/videos/exercises/single-leg-single-arm-scaption.mp4",
  "bird dog": "/videos/exercises/bird-dog.mp4",
  "activation standing shoulder ext rotation": "/videos/exercises/activation-standing-shoulder-ext-rotation.mp4",
  "reverse lunge to row": "/videos/exercises/reverse-lunge-to-row.mp4",
  "modified push up": "/videos/exercises/modified-push-up.mp4",
  "split stance row": "/videos/exercises/split-stance-row.mp4",
  "activation ball prone shoulder press": "/videos/exercises/activation-ball-prone-shoulder-press.mp4",
  "prisoner squat calf raise": "/videos/exercises/prisoner-squat-calf-raise.mp4",
  "half kneeling throw and catch": "/videos/exercises/half-kneeling-throw-and-catch.mp4",
  "dumbbell bent over row": "/videos/exercises/dumbbell-bent-over-row.mp4",
  "dumbbell rack carry": "/videos/exercises/dumbbell-rack-carry.mp4",
  "hand to hand kettlebell swing": "/videos/exercises/hand-to-hand-kettlebell-swing.mp4",
  "one ins ladder drill": "/videos/exercises/one-ins-ladder-drill.mp4",
  "incline stance curl to overhead press": "/videos/exercises/incline-stance-curl-to-overhead-press.mp4",
  "long lever ball crunch": "/videos/exercises/long-lever-ball-crunch.mp4",
  "double kettlebell snatch": "/videos/exercises/double-kettlebell-snatch.mp4",
  "step up to balance sagital": "/videos/exercises/step-up-to-balance-sagital.mp4",
  "split jerk": "/videos/exercises/split-jerk.mp4",
  "lunge to balance frontal": "/videos/exercises/lunge-to-balance-frontal.mp4",
  "iron cross": "/videos/exercises/iron-cross.mp4",
  "jumping jacks": "/videos/exercises/jumping-jacks.mp4",
  "supine biceps femoris stretch": "/videos/exercises/supine-biceps-femoris-stretch.mp4",
  "core ball crunch": "/videos/exercises/core-ball-crunch.mp4",
  "latissimus dorsi ball stretch": "/videos/exercises/latissimus-dorsi-ball-stretch.mp4",
  "static standing adductor stretch": "/videos/exercises/static-standing-adductor-stretch.mp4",
  "barbell back squat": "/videos/exercises/barbell-back-squat.mp4",
  "supine dumbbell extension": "/videos/exercises/supine-dumbbell-extension.mp4",
  "dumbbell ball combo ii": "/videos/exercises/dumbbell-ball-combo-ii.mp4",
  "medicine ball step over push up": "/videos/exercises/medicine-ball-step-over-push-up.mp4",
  "lunge to balance": "/videos/exercises/lunge-to-balance.mp4",
  "barbell bench press with bands": "/videos/exercises/barbell-bench-press-with-bands.mp4",
  "seated single arm dumbbell tricep extension": "/videos/exercises/seated-single-arm-dumbbell-tricep-extension.mp4",
  "barbell overhead press": "/videos/exercises/barbell-overhead-press.mp4",
  "kettlebell crush curl with squat": "/videos/exercises/kettlebell-crush-curl-with-squat.mp4",
  "transverse slalom": "/videos/exercises/transverse-slalom.mp4",
  "static 90 90 hamstring stretch": "/videos/exercises/static-90-90-hamstring-stretch.mp4",
  "single leg squat": "/videos/exercises/single-leg-squat.mp4",
  "activation serratus push up": "/videos/exercises/activation-serratus-push-up.mp4",
  "reciprocating kettlebell overhead press": "/videos/exercises/reciprocating-kettlebell-overhead-press.mp4",
  "activation ball prone shoulder ext rotation": "/videos/exercises/activation-ball-prone-shoulder-ext-rotation.mp4",
  "static 3d standing hip flexor stretch": "/videos/exercises/static-3d-standing-hip-flexor-stretch.mp4",
  "static standing adductor magnus": "/videos/exercises/static-standing-adductor-magnus.mp4",
  "squat jump with stabilization transverse": "/videos/exercises/squat-jump-with-stabilization-transverse.mp4",
  "lunge to balance transverse": "/videos/exercises/lunge-to-balance-transverse.mp4",
  "single arm standing row with rotation": "/videos/exercises/single-arm-standing-row-with-rotation.mp4",
  "squat jump with stabilization frontal": "/videos/exercises/squat-jump-with-stabilization-frontal.mp4",
  "static 3d standing tfl stretch": "/videos/exercises/static-3d-standing-tfl-stretch.mp4",
  "static erector spinae stretch": "/videos/exercises/static-erector-spinae-stretch.mp4",
  "static kneeling hip flexor stretch": "/videos/exercises/static-kneeling-hip-flexor-stretch.mp4",
  "static pectoral ball stretch": "/videos/exercises/static-pectoral-ball-stretch.mp4",
  "self myofascial release smr tensor fascia latae": "/videos/exercises/self-myofascial-release-smr-tensor-fascia-latae.mp4",
  "180 jump with stabilization": "/videos/exercises/180-jump-with-stabilization.mp4",
  "static seated calf stretch": "/videos/exercises/static-seated-calf-stretch.mp4",
  "prisoner squat": "/videos/exercises/prisoner-squat.mp4",
  "kettlebell deadlift": "/videos/exercises/kettlebell-deadlift.mp4",
  "self myofascial release smr latissimus dorsi": "/videos/exercises/self-myofascial-release-smr-latissimus-dorsi.mp4",
  "two arm standing cable fly": "/videos/exercises/two-arm-standing-cable-fly.mp4",
  "two arm dumbbell chest press with band": "/videos/exercises/two-arm-dumbbell-chest-press-with-band.mp4",
  "foam roll latissimus dorsi": "/videos/exercises/foam-roll-latissimus-dorsi.mp4",
  "static standing quadriceps stretch": "/videos/exercises/static-standing-quadriceps-stretch.mp4",
  "in in out out ladder drill": "/videos/exercises/in-in-out-out-ladder-drill.mp4",
  "short lever side plank": "/videos/exercises/short-lever-side-plank.mp4",
  "kettlebell clean to press": "/videos/exercises/kettlebell-clean-to-press.mp4",
  "kettlebell floor press": "/videos/exercises/kettlebell-floor-press.mp4",
  "ali shuffle ladder drill": "/videos/exercises/ali-shuffle-ladder-drill.mp4",
  "repeat squat jumps multiplanar": "/videos/exercises/repeat-squat-jumps-multiplanar.mp4",
  "bent over dumbbell rear fly with neutral grip": "/videos/exercises/bent-over-dumbbell-rear-fly.mp4",
  "slalom": "/videos/exercises/slalom.mp4",
  "box jump down to tuck jump": "/videos/exercises/box-jump-down-to-tuck-jump.mp4",
  "repeat ice skater": "/videos/exercises/repeat-ice-skater.mp4",
  "single leg reach sagittal": "/videos/exercises/single-leg-reach-sagittal.mp4",
  "static posterior shoulder stretch": "/videos/exercises/static-posterior-shoulder-stretch.mp4",
  "self myofascial release smr quadriceps": "/videos/exercises/self-myofascial-release-smr-quadriceps.mp4",
  "dumbbell push press": "/videos/exercises/dumbbell-push-press.mp4",
  "barbell front squat with clean position": "/videos/exercises/barbell-front-squat-with-clean-position.mp4",
  "barbell bent over row pronated": "/videos/exercises/barbell-bent-over-row-pronated.mp4",
  "kettlebell arm bar": "/videos/exercises/kettlebell-arm-bar.mp4",
  "plyometric push up": "/videos/exercises/plyometric-push-up.mp4",
  "box jumps": "/videos/exercises/box-jumps.mp4",
  "plank with arm reach": "/videos/exercises/plank-with-arm-reach.mp4",
  "barbell bench press": "/videos/exercises/barbell-bench-press.mp4",
  "bench dips": "/videos/exercises/bench-dips.mp4",
  "single leg squat to row": "/videos/exercises/single-leg-squat-to-row.mp4",
  "floor bridge": "/videos/exercises/floor-bridge.mp4",
  "glute bridge": "/videos/exercises/glute-bridge.mp4",
  "single leg glute bridge": "/videos/exercises/single-leg-glute-bridge.mp4",
  "side plank": "/videos/exercises/side-plank.mp4",
  "straight arm plank": "/videos/exercises/straight-arm-plank.mp4",
  "incline dumbbell bench press": "/videos/exercises/incline-dumbbell-bench-press.mp4",
  "single arm kettlebell swing": "/videos/exercises/single-arm-kettlebell-swing.mp4",
  "squat to single arm row": "/videos/exercises/squat-to-single-arm-row.mp4",
  "single leg throw and catch frontal": "/videos/exercises/single-leg-throw-and-catch-frontal.mp4",
  "w in in out out": "/videos/exercises/w-in-in-out-out.mp4",
  "incline dumbbell curl": "/videos/exercises/incline-dumbbell-curl.mp4",
  "incline dumbbell biceps curl": "/videos/exercises/incline-dumbbell-curl.mp4",
  "barbell biceps curl": "/videos/exercises/barbell-bicep-curl.mp4",
  "squat jump with stabilization multiplanar": "/videos/exercises/squat-jump-with-stabilization-multiplanar.mp4",
  "child s pose": "/videos/exercises/child-s-pose.mp4",
  "foam roll adductors": "/videos/exercises/foam-roll-adductors.mp4",
  "seated leg curl": "/videos/exercises/seated-leg-curl.mp4",
  "medicine ball bent over chest pass": "/videos/exercises/medicine-ball-bent-over-chest-pass.mp4",
  "dumbbell renegade row to push up": "/videos/exercises/dumbbell-renegade-row-to-push-up.mp4",
  "dumbbell walking lunges": "/videos/exercises/lunge-to-balance.mp4",
  "walking lunges": "/videos/exercises/lunge-to-balance.mp4",
  "single leg dumbbell overhead press": "/videos/exercises/single-leg-dumbbell-overhead-press.mp4",
  "single-leg dumbbell overhead press": "/videos/exercises/single-leg-dumbbell-overhead-press.mp4",
  "single leg overhead dumbbell press": "/videos/exercises/single-leg-dumbbell-overhead-press.mp4",
  "single-leg overhead dumbbell press": "/videos/exercises/single-leg-dumbbell-overhead-press.mp4",
  "single leg overhead press": "/videos/exercises/single-leg-dumbbell-overhead-press.mp4",
  "single-leg overhead press": "/videos/exercises/single-leg-dumbbell-overhead-press.mp4",
  "single leg standing tubing overhead press": "/videos/exercises/dumbbell-overhead-press.mp4",
  "single leg dumbbell bent over row": "/videos/exercises/dumbbell-bent-over-row.mp4",
  "single leg standing tubing row": "/videos/exercises/standing-tubing-row.mp4",
  "single leg dumbbell bent over extension": "/videos/exercises/supported-bent-over-dumbbell-extension.mp4",
  "single-leg dumbbell bent-over extension": "/videos/exercises/supported-bent-over-dumbbell-extension.mp4",
  "single leg dumbbell bent-over extension": "/videos/exercises/supported-bent-over-dumbbell-extension.mp4",
  "single-leg dumbbell bent over extension": "/videos/exercises/supported-bent-over-dumbbell-extension.mp4",
  "dumbbell bent-over extension": "/videos/exercises/dumbbell-bent-over-extension.mp4",
  "dumbbell bent over extension": "/videos/exercises/dumbbell-bent-over-extension.mp4",
  "bent-over dumbbell extension": "/videos/exercises/dumbbell-bent-over-extension.mp4",
  "bent over dumbbell extension": "/videos/exercises/dumbbell-bent-over-extension.mp4",
  "dumbbell kickback": "/videos/exercises/dumbbell-bent-over-extension.mp4",
  "dumbbell tricep kickback": "/videos/exercises/dumbbell-bent-over-extension.mp4",
  "dumbbell triceps kickback": "/videos/exercises/dumbbell-bent-over-extension.mp4",
  "side lying leg raise": "/videos/exercises/side-lying-leg-raise.mp4",
  "bent over barbell row supinated": "/videos/exercises/bent-over-barbell-row-supinated.mp4",
  "prone ball dumbbell cobra": "/videos/exercises/prone-ball-dumbbell-cobra.mp4",
  "overhead triceps extension": "/videos/exercises/overhead-triceps-extension.mp4",
  "cable pallof press": "/videos/exercises/cable-pallof-press.mp4",
  "pallof press": "/videos/exercises/cable-pallof-press.mp4",
  "lat pulldown": "/videos/exercises/lat-pulldown.mp4",
  "cable lat pulldown": "/videos/exercises/lat-pulldown.mp4",
  "triceps pushdown": "/videos/exercises/triceps-pushdown.mp4",
  "cable triceps pushdown": "/videos/exercises/triceps-pushdown.mp4",
  "child's pose": "/videos/exercises/child-s-pose.mp4",
  "childs pose": "/videos/exercises/child-s-pose.mp4",
  "barbell good mornings": "/videos/exercises/barbell-good-mornings.mp4",
  "single arm dumbbell bench press": "/videos/exercises/single-arm-dumbbell-bench-press.mp4",
  "squat to cable row": "/videos/exercises/squat-to-row.mp4",
}

const FORGE_STUDIO_MASTER_FALLBACK_MP4 = '/videos/exercises/barbell-bench-press.mp4'
const FORGE_STUDIO_MASTER_FALLBACK_IMAGE = '/images/exercises/barbell-bench-press.jpg'

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
    .replace(/\([^)]*\)/g, ' ')
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

function isThirdPartyYoutubeAsset(url: string | null | undefined): boolean {
  if (!url) return false
  return /(?:youtube\.com|youtube-nocookie\.com|youtu\.be|ytimg\.com)/i.test(url)
}

/**
 * Resolves a sovereign self-hosted Forge Athletic studio MP4 video loop for any exercise.
 * Legacy third-party YouTube URLs stored in older workout JSON records are automatically
 * upgraded to first-party /videos/exercises/*.mp4 loops.
 */
export function resolveExerciseVideoEmbed(
  exerciseName: string,
  providedVideoUrl?: string | null
): ExerciseVideoResolution {
  const cleaned = cleanExerciseName(exerciseName)

  // 1. Direct studio MP4 match (preserves parenthetical grip/stance modifiers first)
  const directStudioMp4 = resolveForgeExerciseVideo(exerciseName)
  if (directStudioMp4 && NASM_EDGE_OFFICIAL_CATALOG[cleaned]) {
    return {
      embedUrl: directStudioMp4,
      externalUrl: directStudioMp4,
      isDirectEmbed: true,
      sourceTitle: `Forge Athletic Studio · ${exerciseName}`,
      videoId: null,
    }
  }

  if (NASM_EDGE_OFFICIAL_CATALOG[cleaned]) {
    const mp4Path = NASM_EDGE_OFFICIAL_CATALOG[cleaned]
    return {
      embedUrl: mp4Path,
      externalUrl: mp4Path,
      isDirectEmbed: true,
      sourceTitle: `Forge Athletic Studio · ${exerciseName}`,
      videoId: null,
    }
  }

  // 2. Multi-token priority keyword matching to exact 1-to-1 Forge Athletic studio loops
  const KEYWORD_STUDIO_MAP: Array<{ keywords: string[]; mp4Path: string; label: string }> = [
    // Pushing & Chest
    { keywords: ['incline dumbbell bench press', 'incline dumbbell chest press', 'incline dumbbell press'], mp4Path: '/videos/exercises/incline-dumbbell-bench-press.mp4', label: 'Incline Dumbbell Bench Press' },
    { keywords: ['incline barbell bench press', 'incline bench press'], mp4Path: '/videos/exercises/incline-barbell-bench-press.mp4', label: 'Incline Barbell Bench Press' },
    { keywords: ['dual dumbbell flat bench press', 'dual dumbbell bench press', 'dumbbell flat bench press', 'flat dumbbell bench press', 'dumbbell bench press', 'dumbbell chest press', 'heavy dumbbell flat bench press'], mp4Path: '/videos/exercises/dumbbell-bench-press.mp4', label: 'Dumbbell Bench Press' },
    { keywords: ['heavy barbell bench press', 'barbell flat bench press', 'barbell bench press', 'flat bench press'], mp4Path: '/videos/exercises/barbell-bench-press.mp4', label: 'Barbell Bench Press' },
    { keywords: ['push up with rotation'], mp4Path: '/videos/exercises/push-up-with-rotation.mp4', label: 'Push-Up with Rotation' },
    { keywords: ['decline push up'], mp4Path: '/videos/exercises/decline-push-up.mp4', label: 'Decline Push-Up' },
    { keywords: ['incline push up'], mp4Path: '/videos/exercises/incline-push-up.mp4', label: 'Incline Push-Up' },
    { keywords: ['push up plus'], mp4Path: '/videos/exercises/push-up-plus.mp4', label: 'Push-Up Plus' },
    { keywords: ['heavy banded push up', 'heavy banded push-up', 'heavy resistance band push up', 'heavy resistance band push-up', 'tempo deficit push ups', 'tempo deficit push-ups', 'push up with single leg balance', 'push-up with single-leg balance', 'push up', 'pushup', 'push-up', 'explosive plyometric push up', 'explosive plyometric push-up', 'clapping push up', 'clapping push-up'], mp4Path: '/videos/exercises/push-up.mp4', label: 'Push-Up' },
    { keywords: ['cable crossover', 'cable fly', 'chest fly'], mp4Path: '/videos/exercises/cable-crossover.mp4', label: 'Cable Crossover Fly' },
    { keywords: ['bench dips', 'bench dip'], mp4Path: '/videos/exercises/bench-dips.mp4', label: 'Bench Dips' },

    // Shoulders
    { keywords: ['single-leg dumbbell overhead press', 'single leg dumbbell overhead press', 'single leg overhead dumbbell press', 'single-leg overhead dumbbell press', 'single-leg overhead press', 'single leg overhead press', 'single leg dumbbell shoulder press', 'single-leg dumbbell shoulder press'], mp4Path: '/videos/exercises/single-leg-dumbbell-overhead-press.mp4', label: 'Single-Leg Dumbbell Overhead Press' },
    { keywords: ['single-leg standing tubing overhead press', 'single leg standing tubing overhead press', 'seated dumbbell shoulder press', 'seated dumbbell overhead shoulder press', 'dumbbell overhead press', 'dumbbell shoulder press', 'heavy banded overhead press', 'banded overhead press', 'standing neutral grip db overhead press'], mp4Path: '/videos/exercises/dumbbell-overhead-press.mp4', label: 'Dumbbell Overhead Press' },
    { keywords: ['standing barbell overhead press', 'heavy barbell overhead press', 'barbell overhead press', 'standing overhead press', 'military press'], mp4Path: '/videos/exercises/barbell-overhead-press.mp4', label: 'Barbell Overhead Press' },
    { keywords: ['feet-elevated pike push-up', 'feet elevated pike push up', 'pike push up', 'pike push-up'], mp4Path: '/videos/exercises/pike-push-up.mp4', label: 'Pike Push-Up' },
    { keywords: ['dumbbell lateral raise', 'lateral raise'], mp4Path: '/videos/exercises/dumbbell-lateral-raise.mp4', label: 'Dumbbell Lateral Raise' },
    { keywords: ['bent over dumbbell rear fly', 'rear delt fly'], mp4Path: '/videos/exercises/bent-over-dumbbell-rear-fly.mp4', label: 'Rear Delt Fly' },
    { keywords: ['single leg single arm scaption', 'single arm scaption'], mp4Path: '/videos/exercises/single-leg-single-arm-scaption.mp4', label: 'Single-Leg Single-Arm Scaption' },
    { keywords: ['single leg dumbbell scaption', 'single-leg dumbbell scaption', 'single leg banded scaption', 'single-leg banded scaption', 'single leg y-raise', 'single-leg y-raise', 'single leg squat to scaption', 'single leg scaption', 'standing scaption', 'dumbbell scaption', 'scaption'], mp4Path: '/videos/exercises/single-leg-scaption.mp4', label: 'Single-Leg Scaption' },
    { keywords: ['squat to overhead reach & scaption', 'squat to overhead reach and scaption', 'squat to overhead reach', 'squat to scaption multi planar reach', 'squat to scaption', 'squat to overhead press', 'dumbbell squat to overhead press', 'squat to press', 'overhead reach'], mp4Path: '/videos/exercises/squat-to-overhead-reach.mp4', label: 'Squat to Overhead Reach & Scaption' },

    // Back & Pulling
    { keywords: ['single-leg romanian deadlift with reach', 'single leg romanian deadlift with reach', 'single leg rdl with reach', 'single leg romanian deadlift to pnf pattern 2'], mp4Path: '/videos/exercises/single-leg-romanian-deadlift-to-pnf-pattern-2.mp4', label: 'Single-Leg Romanian Deadlift with Reach' },
    { keywords: ['single-leg romanian deadlift', 'single leg romanian deadlift', 'single leg rdl'], mp4Path: '/videos/exercises/single-leg-romanian-deadlift.mp4', label: 'Single-Leg Romanian Deadlift' },
    { keywords: ['dual dumbbell romanian deadlift', 'dumbbell romanian deadlift', 'dumbbell rdl', 'heavy banded romanian deadlift', 'banded romanian deadlift'], mp4Path: '/videos/exercises/dumbbell-romanian-deadlift.mp4', label: 'Dumbbell Romanian Deadlift' },
    { keywords: ['barbell romanian deadlift', 'romanian deadlift', 'barbell rdl'], mp4Path: '/videos/exercises/romanian-deadlift.mp4', label: 'Romanian Deadlift' },
    { keywords: ['barbell deadlift', 'conventional deadlift'], mp4Path: '/videos/exercises/barbell-deadlift.mp4', label: 'Barbell Deadlift' },
    { keywords: ['heavy barbell bent-over row', 'heavy barbell bent over row', 'barbell bent over row', 'barbell bent-over row'], mp4Path: '/videos/exercises/barbell-bent-over-row-pronated.mp4', label: 'Barbell Bent-Over Row' },
    { keywords: ['dual dumbbell bent-over row', 'dual dumbbell bent over row', 'heavy dual dumbbell row', 'dumbbell bent over row', 'single arm dumbbell row'], mp4Path: '/videos/exercises/dumbbell-bent-over-row.mp4', label: 'Dumbbell Bent-Over Row' },
    { keywords: ['seated cable row', 'cable row', 'seated machine row close grip', 'seated machine row', 'seated row', 'tubing row', 'heavy standing band row', 'standing band row', 'heavy band row', 'inverted bodyweight row', 'inverted row'], mp4Path: '/videos/exercises/seated-row.mp4', label: 'Seated Row' },
    { keywords: ['single-leg cable row', 'single leg cable row', 'single-leg dumbbell row', 'single leg dumbbell row', 'single-leg resistance band row', 'single leg resistance band row', 'single leg squat to row'], mp4Path: '/videos/exercises/single-leg-squat-to-row.mp4', label: 'Single-Leg Cable Row' },
    { keywords: ['band assisted pull up', 'pull up', 'pull-up', 'chin up'], mp4Path: '/videos/exercises/pull-up.mp4', label: 'Pull-Up' },
    { keywords: ['face pull', 'cable face pull'], mp4Path: '/videos/exercises/face-pull.mp4', label: 'Face Pull' },

    // Legs: Squats, Lunges, Hips
    { keywords: ['heavy dual dumbbell front squat', 'barbell front squat', 'front squat'], mp4Path: '/videos/exercises/barbell-front-squat.mp4', label: 'Barbell Front Squat' },
    { keywords: ['heavy dumbbell goblet squat', 'heavy banded squat', 'goblet squat', 'kettlebell goblet squat'], mp4Path: '/videos/exercises/goblet-squat.mp4', label: 'Goblet Squat' },
    { keywords: ['box squat'], mp4Path: '/videos/exercises/box-squat.mp4', label: 'Box Squat' },
    { keywords: ['heavy barbell back squat', 'barbell back squat', 'back squat'], mp4Path: '/videos/exercises/barbell-back-squat.mp4', label: 'Barbell Back Squat' },
    { keywords: ['bulgarian split squat', 'split squat'], mp4Path: '/videos/exercises/bulgarian-split-squat.mp4', label: 'Bulgarian Split Squat' },
    { keywords: ['single leg squat to box', 'single leg squat'], mp4Path: '/videos/exercises/single-leg-squat.mp4', label: 'Single-Leg Squat' },
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
      ], mp4Path: '/videos/exercises/reverse-lunge-to-balance.mp4', label: 'Reverse Lunge to Balance',
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
      ], mp4Path: '/videos/exercises/lunge-to-balance.mp4', label: 'Lunge to Balance',
    },
    { keywords: ['single-leg step-up to balance', 'single leg step-up to balance', 'single-leg step up to balance', 'single leg step up to balance', 'step up to balance', 'step up to balance frontal', 'step up', 'step-up', 'box step-up', 'box step up'], mp4Path: '/videos/exercises/step-up-to-balance-sagital.mp4', label: 'Step-Up to Balance' },
    { keywords: ['spanish squat', 'spanish squats'], mp4Path: '/videos/exercises/box-squat.mp4', label: 'Box Squat' },
    { keywords: ['single leg press'], mp4Path: '/videos/exercises/single-leg-press.mp4', label: 'Single-Leg Press' },
    { keywords: ['leg press'], mp4Path: '/videos/exercises/leg-press.mp4', label: 'Leg Press' },
    { keywords: ['lying leg curl', 'machine leg curl', 'leg curl machine'], mp4Path: '/videos/exercises/lying-leg-curl.mp4', label: 'Lying Leg Curl' },
    { keywords: ['seated leg curl'], mp4Path: '/videos/exercises/seated-leg-curl.mp4', label: 'Seated Leg Curl' },
    { keywords: ['leg press calf raise', 'tibialis', 'anterior tibialis', 'calf raise', 'soleus', 'rathleff'], mp4Path: '/videos/exercises/leg-press-calf-raise.mp4', label: 'Calf Raise' },
    { keywords: ['single-leg glute bridge with hold', 'single leg glute bridge with hold', 'single leg floor bridge'], mp4Path: '/videos/exercises/single-leg-floor-bridge.mp4', label: 'Single-Leg Floor Bridge' },
    { keywords: ['heavy barbell hip thrust', 'heavy dumbbell hip thrust', 'heavy banded hip thrust', 'floor bridge', 'glute bridge', 'hip thrust', 'banded hip thrust'], mp4Path: '/videos/exercises/floor-bridge.mp4', label: 'Floor Bridge' },
    { keywords: ['stability ball hamstring curl', 'ball hamstring curl', 'stability ball leg curl', 'ball leg curl', 'stability ball hamstring curls', 'ball hamstring curls'], mp4Path: '/videos/exercises/floor-bridge.mp4', label: 'Floor Bridge' },
    { keywords: ['good mornings', 'good morning'], mp4Path: '/videos/exercises/good-mornings.mp4', label: 'Good Mornings' },
    { keywords: ['kettlebell swing', 'banded kettlebell swing', 'single arm kettlebell swing', 'explosive dumbbell / kettlebell hinge swing', 'explosive dumbbell kettlebell hinge swing'], mp4Path: '/videos/exercises/single-arm-kettlebell-swing.mp4', label: 'Kettlebell Swing' },

    // Arms: Biceps & Triceps
    { keywords: ['incline dumbbell curl'], mp4Path: '/videos/exercises/incline-dumbbell-curl.mp4', label: 'Incline Dumbbell Curl' },
    { keywords: ['dumbbell hammer curl', 'single leg hammer curl', 'hammer curl'], mp4Path: '/videos/exercises/dumbbell-hammer-curl.mp4', label: 'Dumbbell Hammer Curl' },
    { keywords: ['dumbbell preacher curl'], mp4Path: '/videos/exercises/dumbbell-preacher-curl.mp4', label: 'Dumbbell Preacher Curl' },
    { keywords: ['barbell bicep curl', 'barbell curl'], mp4Path: '/videos/exercises/barbell-bicep-curl.mp4', label: 'Barbell Biceps Curl' },
    { keywords: ['dumbbell bent-over extension', 'dumbbell bent over extension', 'bent-over dumbbell extension', 'bent over dumbbell extension', 'supported bent over dumbbell extension', 'single-leg dumbbell bent-over extension', 'single-leg dumbbell bent over extension', 'single leg dumbbell bent-over extension', 'single leg dumbbell bent over extension', 'dumbbell kickback', 'dumbbell tricep kickback', 'dumbbell triceps kickback', 'tricep kickback', 'triceps kickback', 'dumbbell bent over extention'], mp4Path: '/videos/exercises/supported-bent-over-dumbbell-extension.mp4', label: 'Supported Bent-Over Dumbbell Extension' },
    { keywords: ['seated single arm dumbbell tricep extension', 'seated dumbbell triceps extension', 'supine dumbbell extension', 'triceps pushdown', 'cable triceps pushdown', 'overhead triceps extension'], mp4Path: '/videos/exercises/seated-single-arm-dumbbell-tricep-extension.mp4', label: 'Seated Single-Arm Dumbbell Triceps Extension' },

    // Core & Balance
    { keywords: ['cable pallof press', 'pallof press', 'paloff press with band', 'paloff press'], mp4Path: '/videos/exercises/cable-pallof-press.mp4', label: 'Pallof Press' },
    { keywords: ['russian twist'], mp4Path: '/videos/exercises/russian-twist.mp4', label: 'Russian Twist' },
    { keywords: ['dead bug'], mp4Path: '/videos/exercises/dead-bug.mp4', label: 'Dead Bug' },
    { keywords: ['mcgill big 3', 'bird dog', 'quadruped opposite arm leg raise'], mp4Path: '/videos/exercises/bird-dog.mp4', label: 'Bird Dog' },
    { keywords: ['short lever side plank', 'side plank'], mp4Path: '/videos/exercises/side-plank.mp4', label: 'Side Plank' },
    { keywords: ['plank walkup'], mp4Path: '/videos/exercises/plank-walkup.mp4', label: 'Plank Walkup' },
    { keywords: ['plank with arm reach'], mp4Path: '/videos/exercises/plank-with-arm-reach.mp4', label: 'Plank with Arm Reach' },
    { keywords: ['stability ball crunch', 'ball crunch', 'core ball crunch'], mp4Path: '/videos/exercises/ball-crunch.mp4', label: 'Stability Ball Crunch' },
    { keywords: ['single leg balance reach multiplanar', 'single leg balance reach frontal plane', 'single leg reach sagittal', 'star excursion'], mp4Path: '/videos/exercises/single-leg-balance-reach-multiplanar.mp4', label: 'Single-Leg Balance Reach' },

    // Plyometrics, Power & SAQ
    { keywords: ['explosive tuck jump / jump squat', 'explosive tuck jump jump squat', 'repeat squat jumps', 'squat jump with stabilization', 'squat jump', 'jump squat'], mp4Path: '/videos/exercises/squat-jump.mp4', label: 'Squat Jump' },
    { keywords: ['explosive tuck jump', 'repeat tuck jumps', 'tuck jump with stabilization', 'tuck jump'], mp4Path: '/videos/exercises/tuck-jump.mp4', label: 'Tuck Jump' },
    { keywords: ['box jump up with stabilization', 'box jumps', 'box jump'], mp4Path: '/videos/exercises/box-jumps.mp4', label: 'Box Jumps' },
    { keywords: ['repeat hurdle jumps', 'hurdle jump'], mp4Path: '/videos/exercises/repeat-hurdle-jumps.mp4', label: 'Hurdle Jumps' },
    { keywords: ['depth jump'], mp4Path: '/videos/exercises/depth-jump.mp4', label: 'Depth Jump' },
    { keywords: ['repeat ice skater', 'ice skater with stabilization', 'ice skater'], mp4Path: '/videos/exercises/repeat-ice-skater.mp4', label: 'Ice Skaters' },
    { keywords: ['explosive broad jump to stick', 'explosive broad jump', 'broad jump', 'single leg hop stabilization', 'single leg hop'], mp4Path: '/videos/exercises/single-leg-hop-stabilization-level-1.mp4', label: 'Single-Leg Hop' },
    { keywords: ['4 point quadruped t drill'], mp4Path: '/videos/exercises/4-point-quadruped-t-drill.mp4', label: 'SAQ 4-Point T-Drill' },
    { keywords: ['explosive medicine ball chest pass', 'medicine ball chest pass'], mp4Path: '/videos/exercises/medicine-ball-bent-over-chest-pass.mp4', label: 'Medicine Ball Chest Pass' },
    { keywords: ['medicine ball soccer throw', 'medicine ball backward overhead slam', 'banded explosive speed row'], mp4Path: '/videos/exercises/single-leg-throw-and-catch-transverse-1.mp4', label: 'Medicine Ball Throw' },

    // Corrective & Flexibility SMR
    { keywords: ['foam roll calves', 'smr calves'], mp4Path: '/videos/exercises/foam-roll-calves.mp4', label: 'Foam Roll Calves' },
    { keywords: ['foam roll adductors', 'how to foam roll adductors', 'smr adductors'], mp4Path: '/videos/exercises/foam-roll-adductors.mp4', label: 'Foam Roll Adductors' },
    { keywords: ['foam roll latissimus dorsi', 'smr latissimus dorsi'], mp4Path: '/videos/exercises/foam-roll-latissimus-dorsi.mp4', label: 'Foam Roll Latissimus Dorsi' },
    { keywords: ['self myofascial release smr hamstrings', 'foam roll hamstrings', 'smr hamstrings'], mp4Path: '/videos/exercises/self-myofascial-release-smr-hamstrings.mp4', label: 'Foam Roll Hamstrings' },
    { keywords: ['self myofascial release smr piriformis', 'foam roll piriformis', 'smr piriformis'], mp4Path: '/videos/exercises/self-myofascial-release-smr-piriformis.mp4', label: 'Foam Roll Piriformis' },
    { keywords: ['self myofascial release smr thoracic spine', 'foam roll thoracic spine', 'smr thoracic spine'], mp4Path: '/videos/exercises/self-myofascial-release-smr-thoracic-spine.mp4', label: 'Foam Roll Thoracic Spine' },
    { keywords: ['self myofascial release smr peroneals', 'foam roll peroneals', 'smr peroneals'], mp4Path: '/videos/exercises/self-myofascial-release-smr-peroneals.mp4', label: 'Foam Roll Peroneals' },
    { keywords: ['self myofascial release smr quadriceps', 'foam roll quadriceps', 'smr quadriceps', 'smr quads'], mp4Path: '/videos/exercises/self-myofascial-release-smr-quadriceps.mp4', label: 'Foam Roll Quadriceps' },
    { keywords: ['self myofascial release smr tensor fascia latae', 'foam roll tensor fasciae latae', 'foam roll tfl', 'smr tfl', 'smr it band', 'smr it-band', 'tensor fasciae latae', 'vastus lateralis'], mp4Path: '/videos/exercises/self-myofascial-release-smr-lateral-thigh.mp4', label: 'Foam Roll TFL' },
    { keywords: ['static kneeling hip flexor stretch', 'kneeling hip flexor', 'active kneeling hip flexor'], mp4Path: '/videos/exercises/static-kneeling-hip-flexor-stretch.mp4', label: 'Kneeling Hip Flexor Stretch' },
    { keywords: ['static seated calf stretch', 'static calf stretch', 'calf stretch'], mp4Path: '/videos/exercises/static-seated-calf-stretch.mp4', label: 'Static Seated Calf Stretch' },
    { keywords: ['static 3d standing tfl stretch', 'static standing tfl', 'standing tfl stretch', 'static tfl stretch'], mp4Path: '/videos/exercises/static-3d-standing-tfl-stretch.mp4', label: 'Static Standing TFL Stretch' },
    { keywords: ['static 90 90 hamstring stretch', 'supine biceps femoris stretch', 'static standing hamstring stretch', 'static hamstring stretch', 'hamstring stretch'], mp4Path: '/videos/exercises/static-90-90-hamstring-stretch.mp4', label: 'Static Hamstring Stretch' },
    { keywords: ['static upper trapezius stretch'], mp4Path: '/videos/exercises/static-upper-trapezius-stretch.mp4', label: 'Upper Trapezius Stretch' },
    { keywords: ['static levator scapulae stretch'], mp4Path: '/videos/exercises/static-levator-scapulae-stretch.mp4', label: 'Levator Scapulae Stretch' },
    { keywords: ['static latissimus dorsi ball stretch'], mp4Path: '/videos/exercises/latissimus-dorsi-ball-stretch.mp4', label: 'Latissimus Dorsi Ball Stretch' },
    { keywords: ['clamshells', 'side lying clamshell', 'clamshell'], mp4Path: '/videos/exercises/clamshells.mp4', label: 'Clamshells' },
    { keywords: ['supported bent over dumbbell row', 'chest supported incline dumbbell row', 'chest-supported incline dumbbell row'], mp4Path: '/videos/exercises/supported-bent-over-dumbbell-row.mp4', label: 'Supported Bent-Over Dumbbell Row' },
    { keywords: ['standing neutral grip db overhead press', 'standing neutral-grip db overhead press', 'overhead press in scapular plane', 'landmine press'], mp4Path: '/videos/exercises/dumbbell-overhead-press.mp4', label: 'Dumbbell Overhead Press' },
  ]

  for (const entry of KEYWORD_STUDIO_MAP) {
    if (entry.keywords.some(kw => cleaned.includes(kw))) {
      const resolvedMp4 = directStudioMp4 || entry.mp4Path
      return {
        embedUrl: resolvedMp4,
        externalUrl: resolvedMp4,
        isDirectEmbed: true,
        sourceTitle: `Forge Athletic Studio · ${entry.label}`,
        videoId: null,
      }
    }
  }

  if (directStudioMp4) {
    return {
      embedUrl: directStudioMp4,
      externalUrl: directStudioMp4,
      isDirectEmbed: true,
      sourceTitle: `Forge Athletic Studio · ${exerciseName}`,
      videoId: null,
    }
  }

  // 3. Preserve non-YouTube first-party /videos/... overrides if explicitly supplied
  const trimmedProvided = typeof providedVideoUrl === 'string' ? providedVideoUrl.trim() : ''
  if (trimmedProvided && trimmedProvided.startsWith('/videos/') && !isThirdPartyYoutubeAsset(trimmedProvided)) {
    return {
      embedUrl: trimmedProvided,
      externalUrl: trimmedProvided,
      isDirectEmbed: true,
      sourceTitle: `Forge Athletic Studio · ${exerciseName}`,
      videoId: null,
    }
  }

  // 4. Partial key substring in canonical catalog
  for (const [key, mp4Path] of Object.entries(NASM_EDGE_OFFICIAL_CATALOG)) {
    if (cleaned.includes(key) || key.includes(cleaned)) {
      return {
        embedUrl: mp4Path,
        externalUrl: mp4Path,
        isDirectEmbed: true,
        sourceTitle: `Forge Athletic Studio · ${exerciseName}`,
        videoId: null,
      }
    }
  }

  // 5. Sovereign Forge Athletic Studio Master Fallback
  return {
    embedUrl: FORGE_STUDIO_MASTER_FALLBACK_MP4,
    externalUrl: FORGE_STUDIO_MASTER_FALLBACK_MP4,
    isDirectEmbed: true,
    sourceTitle: `Forge Athletic Studio · ${exerciseName}`,
    videoId: null,
  }
}

/**
 * Canonical DRY Media Enricher:
 * Resolves verified 1-to-1 Forge Athletic self-hosted MP4 studio loops and
 * first-party high-resolution exercise photography on any exercise object.
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
  const gaaImage = resolveGaaExerciseImage(exercise.name, false)
  const customImage =
    exercise.imageUrl && !isThirdPartyYoutubeAsset(exercise.imageUrl)
      ? exercise.imageUrl
      : null
  return {
    ...exercise,
    imageUrl: gaaImage || customImage || FORGE_STUDIO_MASTER_FALLBACK_IMAGE,
    videoUrl: videoRes.externalUrl,
    embedUrl: videoRes.embedUrl,
  }
}
