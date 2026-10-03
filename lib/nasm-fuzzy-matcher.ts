/**
 * Gordon Athletic Advisory — NASM Heuristic Media & Movement Search Engine
 * Cross-references the 350+ verified official NASM and licensed exercise catalog.
 * Uses exact canonical name matching to strictly prevent incorrect video/image pairing.
 */

export interface NasmLibraryRecord {
  id: string
  name: string
  slug: string
  description: string | null
  coachingCues: string[] | null
  primaryEquipment: string[] | null
  muscleGroups: string[] | null
  imageUrl: string | null
  videoId: string | null
  videoUrl: string | null
}

export interface FuzzyMatchResult {
  record: NasmLibraryRecord
  score: number
  matchedKey: string
  isDirectMatch: boolean
}

export const NASM_COMPLETE_LIBRARY: NasmLibraryRecord[] = [
  {
    "id": "45d59f3a-160b-4138-890c-b2cb1c497ef2",
    "name": "Repeat Squat Jumps",
    "slug": "repeat-squat-jumps-0181",
    "description": "Step 1: Stand with your feet shoulder-width apart and engage your core.\n\nStep 2: Lower into a squat position, keeping your chest up and knees behind your toes.\n\nStep 3: Explode upward, jumping as high as you can while swinging your arms for momentum.\n\nStep 4: Land softly back into the squat position and immediately repeat the jump.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/dsEgOcunkvY/hqdefault.jpg",
    "videoId": "dsEgOcunkvY",
    "videoUrl": "https://www.youtube.com/watch?v=dsEgOcunkvY"
  },
  {
    "id": "0addf908-beff-460f-99d9-cc7ece1afc4a",
    "name": "Depth Jump",
    "slug": "depth-jump-0173",
    "description": "Step 1: Stand on a sturdy platform or box that is 12-24 inches high with your feet shoulder-width apart.\n\nStep 2: Step off the platform and allow your body to fall freely towards the ground.\n\nStep 3: Upon landing, absorb the impact by bending your knees and hips while keeping your feet flat on the ground.\n\nStep 4: Immediately jump vertically as high as possible after landing, using the momentum from the fall.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/bMHL5xqKn3E/hqdefault.jpg",
    "videoId": "bMHL5xqKn3E",
    "videoUrl": "https://www.youtube.com/watch?v=bMHL5xqKn3E"
  },
  {
    "id": "e8a9310c-3d44-48ea-9bbf-5dc162fb7692",
    "name": "Stability Ball Hamstring Curl",
    "slug": "stability-ball-hamstring-curl",
    "description": "Step 1: Setup Lie supine on the floor with your heels and lower calves resting on top of a stability ball, arms extended at your sides on the floor for balance.\n\nStep 2: Brace/Position Draw in your abdominal muscles and squeeze your glutes to lift your hips off the floor until your body forms a straight line from shoulders to ankles.\n\nStep 3: Execute Keeping your hips lifted and stable, bend your knees and pull the ball towards your hips by digging your heels into the ball.\n\nStep 4: Return/Repeat Slowly extend your legs back out to the starting bridged position under a 4-second eccentric tempo, maintaining elevated hips throughout, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Stability Ball"
    ],
    "muscleGroups": [
      "hamstrings",
      "glutes",
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/Z3cY3d3BBo4/hqdefault.jpg",
    "videoId": "Z3cY3d3BBo4",
    "videoUrl": "https://www.youtube.com/watch?v=Z3cY3d3BBo4"
  },
  {
    "id": "b0500002-0000-4000-8000-000000000001",
    "name": "Stability Ball Hamstring Curl",
    "slug": "stability-ball-hamstring-curl",
    "description": "Step 1: Setup Lie supine on floor with heels and lower calves centered on the TheraBand Stability Ball, arms extended at your sides for lateral stability.\n\nStep 2: Brace/Position Drive hips upward into full bridge alignment, forming a straight line from shoulders to heels.\n\nStep 3: Execute Curl heels smoothly toward glutes by flexing knees while maintaining elevated hip extension. Avoid sagging hips toward the floor.\n\nStep 4: Return/Repeat Slowly extend legs back out over 4 controlled seconds to starting bridge position and repeat.",
    "coachingCues": [],
    "primaryEquipment": [
      "Stability Ball"
    ],
    "muscleGroups": [
      "hamstrings",
      "gluteus maximus",
      "calves",
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/Z3cY3d3BBo4/hqdefault.jpg",
    "videoId": "Z3cY3d3BBo4",
    "videoUrl": "https://www.youtube.com/watch?v=Z3cY3d3BBo4"
  },
  {
    "id": "eaadcb60-0de9-474d-a8b4-7012a3100eb1",
    "name": "Depth Jump Frontal",
    "slug": "depth-jump-frontal-0174",
    "description": "Step 1: Stand on a sturdy platform or box that is 12-24 inches high, with your feet shoulder-width apart.\n\nStep 2: Step off the platform and allow your body to fall freely, maintaining a straight posture.\n\nStep 3: Upon landing, absorb the impact by bending your knees and hips, keeping your feet flat on the ground.\n\nStep 4: Immediately jump vertically as high as possible, extending your arms overhead for momentum.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/-jUndEGjpig/hqdefault.jpg",
    "videoId": "-jUndEGjpig",
    "videoUrl": "https://www.youtube.com/watch?v=-jUndEGjpig"
  },
  {
    "id": "674b5e6a-43bb-4a06-ba89-7381182e54f4",
    "name": "Box Jump Up With Stabilization Frontal",
    "slug": "box-jump-up-with-stabilization-frontal-0171",
    "description": "Step 1: Stand in front of the box with your feet shoulder-width apart and knees slightly bent.\n\nStep 2: Bend your knees and swing your arms back to generate momentum.\n\nStep 3: Jump explosively onto the box, landing softly with your knees slightly bent and feet flat.\n\nStep 4: Stabilize your position for a moment before stepping back down to the starting position.",
    "coachingCues": [],
    "primaryEquipment": [
      "Box or Step"
    ],
    "muscleGroups": [
      "calves",
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/624ARptOVDM/hqdefault.jpg",
    "videoId": "624ARptOVDM",
    "videoUrl": "https://www.youtube.com/watch?v=624ARptOVDM"
  },
  {
    "id": "b1279e98-e533-43f2-8d26-9ef66229b7fc",
    "name": "Transverse Box Jump Down To Tuck Jump",
    "slug": "transverse-box-jump-down-to-tuck-jump-0169",
    "description": "Step 1: Stand on top of the box or step with your feet shoulder-width apart and your knees slightly bent.\n\nStep 2: Jump off the box laterally, landing softly on the ground with your feet shoulder-width apart.\n\nStep 3: Immediately transition into a tuck jump by bending your knees and driving your knees toward your chest as you jump upward.\n\nStep 4: Land softly with your knees slightly bent, ready to repeat the movement.",
    "coachingCues": [],
    "primaryEquipment": [
      "Box or Step"
    ],
    "muscleGroups": [
      "calves",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/tYfXItmoX1s/hqdefault.jpg",
    "videoId": "tYfXItmoX1s",
    "videoUrl": "https://www.youtube.com/watch?v=tYfXItmoX1s"
  },
  {
    "id": "2c5781ee-4c2e-426e-9880-77ff7370cd71",
    "name": "Repeat Hurdle Jumps Transverse",
    "slug": "repeat-hurdle-jumps-transverse-0179",
    "description": "Step 1: Stand with your feet shoulder-width apart and visualize a line on the ground for the hurdle jump.\n\nStep 2: Bend your knees slightly and jump laterally over an imaginary hurdle, landing softly on the opposite side.\n\nStep 3: Immediately jump back to the starting position, maintaining a controlled landing.\n\nStep 4: Repeat the jumps for the desired number of repetitions, focusing on explosive power and proper form.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/Io5gmVqO_sA/hqdefault.jpg",
    "videoId": "Io5gmVqO_sA",
    "videoUrl": "https://www.youtube.com/watch?v=Io5gmVqO_sA"
  },
  {
    "id": "313d2bd0-91b4-433c-b00f-0b988fec8061",
    "name": "Repeat Hurdle Jumps",
    "slug": "repeat-hurdle-jumps-0177",
    "description": "Step 1: Stand with your feet shoulder-width apart and knees slightly bent.\n\nStep 2: Jump forward over an imaginary hurdle, driving your knees up and swinging your arms for momentum.\n\nStep 3: Land softly on the balls of your feet, absorbing the impact with your knees slightly bent.\n\nStep 4: Immediately jump back over the hurdle and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/til5WR9ko4c/hqdefault.jpg",
    "videoId": "til5WR9ko4c",
    "videoUrl": "https://www.youtube.com/watch?v=til5WR9ko4c"
  },
  {
    "id": "9eb79c5f-6d32-479d-9aef-cf5ba215a772",
    "name": "Repeat Tuck Jumps",
    "slug": "repeat-tuck-jumps-0185",
    "description": "Step 1: Stand with your feet shoulder-width apart and engage your core.\n\nStep 2: Bend your knees slightly and lower into a quarter squat.\n\nStep 3: Explode upward, tucking your knees towards your chest while jumping as high as possible.\n\nStep 4: Land softly on the balls of your feet, absorbing the impact, and immediately prepare for the next jump.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/KMr7gzm_wf4/hqdefault.jpg",
    "videoId": "KMr7gzm_wf4",
    "videoUrl": "https://www.youtube.com/watch?v=KMr7gzm_wf4"
  },
  {
    "id": "3a873b3d-89b9-4e23-b5cc-eb8668b0465a",
    "name": "Incline Push Up With Rotation",
    "slug": "incline-push-up-with-rotation-0197",
    "description": "Step 1: Setup Position your hands on an elevated surface, such as a bench or step, slightly wider than shoulder-width apart.\n\nStep 2: Brace/Position Engage your core and maintain a straight line from your head to your heels, keeping your feet together or slightly apart for stability.\n\nStep 3: Execute Lower your chest towards the elevated surface by bending your elbows, then push back up while rotating your torso to one side, extending the opposite arm upwards.\n\nStep 4: Return/Repeat Lower back to the starting position and repeat the movement, alternating the rotation to the opposite side with each repetition.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "chest",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/Yylb-sLWdm8/hqdefault.jpg",
    "videoId": "Yylb-sLWdm8",
    "videoUrl": "https://www.youtube.com/watch?v=Yylb-sLWdm8"
  },
  {
    "id": "4aa2a02b-14ee-4753-a404-88d2350849cc",
    "name": "4 Point Quadruped T Drill",
    "slug": "4-point-quadruped-t-drill-0070",
    "description": "Step 1: Setup Begin on all fours with your hands directly under your shoulders and knees under your hips, maintaining a neutral spine.\n\nStep 2: Brace/Position Engage your core and keep your back flat while extending your right arm forward and left leg back, forming a straight line from fingertips to toes.\n\nStep 3: Execute Slowly lift your right arm and left leg off the ground, then move them out to the side, creating a \"T\" shape with your body.\n\nStep 4: Return/Repeat Return to the starting position and repeat the movement on the opposite side, extending your left arm and right leg.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/VV8nykWXjNY/hqdefault.jpg",
    "videoId": "VV8nykWXjNY",
    "videoUrl": "https://www.youtube.com/watch?v=VV8nykWXjNY"
  },
  {
    "id": "2153e45b-8c72-4b27-a0a3-5654fa102ab1",
    "name": "4 Point Quadruped T Drill",
    "slug": "4-point-quadruped-t-drill-0003",
    "description": "Step 1: Setup Begin on all fours in a tabletop position with your hands directly under your shoulders and knees under your hips.\n\nStep 2: Brace/Position Engage your core, keeping your back flat and head in a neutral position, looking down at the floor.\n\nStep 3: Execute Lift your right hand and left knee off the ground, extending them outward to the sides, forming a “T” shape with your body.\n\nStep 4: Return/Repeat Return to the starting position and alternate sides, lifting your left hand and right knee to form the “T” shape.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/N7p0Le1WdJE/hqdefault.jpg",
    "videoId": "N7p0Le1WdJE",
    "videoUrl": "https://www.youtube.com/watch?v=N7p0Le1WdJE"
  },
  {
    "id": "897a4bcb-5cde-4fe9-9b17-70965a45b7e6",
    "name": "Squat Jump With Stabilization",
    "slug": "squat-jump-with-stabilization-0186",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, toes slightly pointed out, and arms at your sides.\n\nStep 2: Brace/Position Engage your core, keeping your chest up and back straight, and lower into a squat position until your thighs are parallel to the ground.\n\nStep 3: Execute Explode upward from the squat position, jumping as high as possible while swinging your arms overhead for momentum.\n\nStep 4: Return/Repeat Land softly with your knees slightly bent, stabilize your position for a moment, then lower back into the squat to repeat the movement.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/Vv9Cd8AwYZ0/hqdefault.jpg",
    "videoId": "Vv9Cd8AwYZ0",
    "videoUrl": "https://www.youtube.com/watch?v=Vv9Cd8AwYZ0"
  },
  {
    "id": "4490f474-6e9a-4339-9a3d-984c84331655",
    "name": "Decline Push Up",
    "slug": "decline-push-up-0195",
    "description": "Step 1: Setup Position your feet on an elevated surface, such as a bench or step, and place your hands shoulder-width apart on the floor, ensuring your body forms a straight line from head to heels.\n\nStep 2: Brace/Position Engage your core and glutes, keeping your elbows slightly tucked in towards your body as you lower your chest towards the floor.\n\nStep 3: Execute Inhale as you lower your body until your chest nearly touches the ground, maintaining a straight line from your head to your feet.\n\nStep 4: Return/Repeat Exhale as you push through your palms to return to the starting position, fully extending your arms and repeating for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "chest",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/aq2xZxfrQlM/hqdefault.jpg",
    "videoId": "aq2xZxfrQlM",
    "videoUrl": "https://www.youtube.com/watch?v=aq2xZxfrQlM"
  },
  {
    "id": "339c0bca-5719-47a8-9e24-ef1de244c9c7",
    "name": "Tuck Jump With Stabilization",
    "slug": "tuck-jump-with-stabilization-0190",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart and knees slightly bent, ensuring a stable base.\n\nStep 2: Brace/Position Engage your core and lower your hips slightly, preparing for an explosive jump.\n\nStep 3: Execute Jump upward explosively, tucking your knees toward your chest while extending your arms upward.\n\nStep 4: Return/Repeat Land softly on the balls of your feet, stabilizing your body before immediately transitioning into the next jump.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/hIEV3C4zaT8/hqdefault.jpg",
    "videoId": "hIEV3C4zaT8",
    "videoUrl": "https://www.youtube.com/watch?v=hIEV3C4zaT8"
  },
  {
    "id": "9eab002e-2d6e-4630-a80b-bf45e68fa884",
    "name": "Frontal Box Jump Down To Tuck Jump",
    "slug": "frontal-box-jump-down-to-tuck-jump-0168",
    "description": "Step 1: Stand on top of the box with your feet shoulder-width apart and your knees slightly bent.\n\nStep 2: Jump off the box, landing softly on the ground with your feet together and knees bent to absorb the impact.\n\nStep 3: Immediately transition into a tuck jump by driving your knees towards your chest as you jump upward.\n\nStep 4: Land softly with your feet shoulder-width apart and prepare for the next repetition.",
    "coachingCues": [],
    "primaryEquipment": [
      "Box or Step"
    ],
    "muscleGroups": [
      "calves",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/NX-sjAtZco0/hqdefault.jpg",
    "videoId": "NX-sjAtZco0",
    "videoUrl": "https://www.youtube.com/watch?v=NX-sjAtZco0"
  },
  {
    "id": "b8734ae0-850f-4596-8df9-9c19d5bf9d34",
    "name": "Archer Push Up",
    "slug": "archer-push-up-0194",
    "description": "Step 1: Setup Begin in a high plank position with your hands wider than shoulder-width apart and feet hip-width apart.\n\nStep 2: Brace/Position Engage your core and maintain a straight line from head to heels, shifting your weight to one side while bending that elbow to lower your body.\n\nStep 3: Execute Push your body back up to the starting position while straightening the bent arm and shifting your weight to the opposite side, lowering your body again.\n\nStep 4: Return/Repeat Continue alternating sides for the desired number of repetitions, ensuring to maintain proper form throughout the movement.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/IDu6pRAPChg/hqdefault.jpg",
    "videoId": "IDu6pRAPChg",
    "videoUrl": "https://www.youtube.com/watch?v=IDu6pRAPChg"
  },
  {
    "id": "6fad3c55-d0cd-416f-ad39-57f4f22aa794",
    "name": "Pike Push Up",
    "slug": "pike-push-up-0201",
    "description": "Step 1: Setup Begin in a downward dog position with your hands shoulder-width apart and feet hip-width apart, hips raised towards the ceiling.\n\nStep 2: Brace/Position Engage your core and keep your head between your arms, ensuring your body forms a straight line from your hands to your feet.\n\nStep 3: Execute Bend your elbows to lower your head towards the ground, keeping your body in an inverted V-shape and your elbows pointing slightly outwards.\n\nStep 4: Return/Repeat Press through your hands to extend your elbows and return to the starting position, maintaining control throughout the movement.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/XckEEwa1BPI/hqdefault.jpg",
    "videoId": "XckEEwa1BPI",
    "videoUrl": "https://www.youtube.com/watch?v=XckEEwa1BPI"
  },
  {
    "id": "d9aa2845-fdfa-444c-8f9b-5a49fa9fd842",
    "name": "Inverted Push Up",
    "slug": "inverted-push-up-0198",
    "description": "Step 1: Setup Position your feet on an elevated surface, such as a bench or box, and place your hands shoulder-width apart on the ground, ensuring your body forms a straight line from head to heels.\n\nStep 2: Brace/Position Engage your core and glutes, keeping your body rigid while lowering your chest towards the ground, maintaining a neutral spine throughout the movement.\n\nStep 3: Execute Press through your palms to lift your body back to the starting position, fully extending your arms while keeping your feet elevated.\n\nStep 4: Return/Repeat Lower your body again in a controlled manner, ensuring proper form is maintained, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/M0hMndCrkI4/hqdefault.jpg",
    "videoId": "M0hMndCrkI4",
    "videoUrl": "https://www.youtube.com/watch?v=M0hMndCrkI4"
  },
  {
    "id": "6df16f98-d608-4cd2-9d87-c101794205da",
    "name": "Incline Push Up",
    "slug": "incline-push-up-0196",
    "description": "Step 1: Setup Position your hands on an elevated surface, such as a bench or sturdy table, slightly wider than shoulder-width apart.\n\nStep 2: Brace/Position Engage your core and keep your body in a straight line from head to heels, with your feet together or slightly apart for stability.\n\nStep 3: Execute Lower your chest toward the elevated surface by bending your elbows, keeping them at a 45-degree angle to your body.\n\nStep 4: Return/Repeat Push through your palms to extend your elbows and return to the starting position, maintaining a straight body alignment throughout the movement.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "chest",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/Gvm5Q29UHbk/hqdefault.jpg",
    "videoId": "Gvm5Q29UHbk",
    "videoUrl": "https://www.youtube.com/watch?v=Gvm5Q29UHbk"
  },
  {
    "id": "47f9866c-bfee-40bc-bf7c-9fc025b86ea7",
    "name": "Bulgarian Split Squat",
    "slug": "bulgarian-split-squat",
    "description": "Step 1: Stand with feet hip width apart and approximately 2 shoulder widths in length with shoelaces down on a bench. Set spine in neutral, dumbbells at your sides and core braced.\n\nStep 2: Drop the trailing knee down until it is 1-2 inches off the ground maintaining a slight forward torso angle. Strive to achieve a 90˚ knee angle or thigh parallel at the bottom of the movement.\n\nStep 3: Reverse the pattern and return to the starting position. Maintain posture throughout.\n\nStep 4: Repeat for the desired number of repetitions. Ensure knee tracks in line with toes. Avoid lifting the front heel, allowing the knee to collapse inward while lowering. Keep laces flat on the bench (make sure the bench or box is the correct height to allow for this).",
    "coachingCues": [],
    "primaryEquipment": [
      "Bench",
      "Dumbbells"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/hbw7hdyOpq0/hqdefault.jpg",
    "videoId": "hbw7hdyOpq0",
    "videoUrl": "https://www.youtube.com/watch?v=hbw7hdyOpq0"
  },
  {
    "id": "fc8a4137-a083-41cb-9dc2-dd92c43d32f8",
    "name": "Dumbbell Romanian Deadlift",
    "slug": "dumbbell-romanian-deadlift",
    "description": "Step 1: Stand in athletic posture with your feet hip to shoulder width, toes pointing straight ahead and knees unlocked. Hinge at the hips and bend the knees to grab onto the dumbbells and stand. Brace the abs and lock the shoulder blades back and down.\n\nStep 2: Hold the dumbbells in front of your thighs. Hinge at the hips and lower the dumbbells through a maximum range that you can maintain good posture. Keep the back flat and dumbbells close to the body at all times.\n\nStep 3: Reverse the pattern pushing the hips forward to return to the starting position. Maintain posture throughout.\n\nStep 4: Repeat for the desired number of repetitions. Avoid locking knees, slouching or over arching the lower and upper back. Keep the head in line with the back at all times.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "back",
      "glutes",
      "hamstrings"
    ],
    "imageUrl": "https://img.youtube.com/vi/V8Hdl1FiNt4/hqdefault.jpg",
    "videoId": "V8Hdl1FiNt4",
    "videoUrl": "https://www.youtube.com/watch?v=V8Hdl1FiNt4"
  },
  {
    "id": "c3ab32b1-4fbd-42e3-96f4-f3945a5063fa",
    "name": "Push Up",
    "slug": "push-up-0192",
    "description": "Step 1: Setup Begin in a high plank position with your hands placed slightly wider than shoulder-width apart and your feet together.\n\nStep 2: Brace/Position Engage your core, keep your body in a straight line from head to heels, and tuck your elbows close to your body.\n\nStep 3: Execute Lower your body towards the ground by bending your elbows, keeping them at a 45-degree angle, until your chest nearly touches the floor.\n\nStep 4: Return/Repeat Push through your palms to extend your arms and return to the starting position, then repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/7NUICnha_Hk/hqdefault.jpg",
    "videoId": "7NUICnha_Hk",
    "videoUrl": "https://www.youtube.com/watch?v=7NUICnha_Hk"
  },
  {
    "id": "43e700b2-2ca0-4dcf-9bd9-3b8aee2fa8f3",
    "name": "Push Up",
    "slug": "push-up-0191",
    "description": "Step 1: Setup Begin in a plank position with your hands slightly wider than shoulder-width apart and your feet together.\n\nStep 2: Brace/Position Engage your core, keep your body in a straight line from head to heels, and position your elbows at a 45-degree angle to your torso.\n\nStep 3: Execute Lower your body towards the ground by bending your elbows until your chest nearly touches the floor, maintaining a straight line.\n\nStep 4: Return/Repeat Push through your palms to extend your arms and return to the starting position, then repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/7NUICnha_Hk/hqdefault.jpg",
    "videoId": "7NUICnha_Hk",
    "videoUrl": "https://www.youtube.com/watch?v=7NUICnha_Hk"
  },
  {
    "id": "4ae0d03a-ba2c-41b0-8d04-a2cbd8998acf",
    "name": "Single Leg Hop Stabilization Level 2",
    "slug": "single-leg-hop-stabilization-level-2-0214",
    "description": "Step 1: Setup Stand on your right leg with your left knee bent at 90 degrees, foot off the ground, and arms at your sides.\n\nStep 2: Brace/Position Engage your core, maintain a neutral spine, and focus on a fixed point in front of you to enhance balance.\n\nStep 3: Execute Hop forward on your right leg, landing softly while maintaining balance and control, ensuring your knee stays aligned with your toes.\n\nStep 4: Return/Repeat Stabilize for a moment before hopping back to the starting position, then repeat for the desired number of repetitions before switching to the left leg.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/cps6tCcJNJA/hqdefault.jpg",
    "videoId": "cps6tCcJNJA",
    "videoUrl": "https://www.youtube.com/watch?v=cps6tCcJNJA"
  },
  {
    "id": "d1bcc326-e2c4-403e-ac0b-2087d08a1a2e",
    "name": "Push Up With Staggered Hands",
    "slug": "push-up-with-staggered-hands-0203",
    "description": "Step 1: Setup Place your hands on the floor, staggered with one hand positioned slightly forward and the other hand slightly back, shoulder-width apart.\n\nStep 2: Brace/Position Engage your core, keep your body in a straight line from head to heels, and position your feet together or slightly apart for stability.\n\nStep 3: Execute Lower your body towards the floor by bending your elbows, keeping them close to your sides, until your chest nearly touches the ground.\n\nStep 4: Return/Repeat Push through your palms to extend your arms, returning to the starting position, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/miMPlHvDwxc/hqdefault.jpg",
    "videoId": "miMPlHvDwxc",
    "videoUrl": "https://www.youtube.com/watch?v=miMPlHvDwxc"
  },
  {
    "id": "a2d8fd35-68b8-428e-8207-493536fc3cd4",
    "name": "Forward And Back Band Walking",
    "slug": "forward-and-back-band-walking-0127",
    "description": "Step 1: Setup Stand with feet shoulder-width apart, placing a resistance band around your thighs just above the knees.\n\nStep 2: Brace/Position Engage your core and maintain a slight bend in your knees, ensuring your hips are aligned with your feet.\n\nStep 3: Execute Step forward with your right foot, followed by your left, maintaining tension in the band; then step backward with your right foot, followed by your left.\n\nStep 4: Return/Repeat Continue alternating between forward and backward steps for the desired number of repetitions, keeping your movements controlled and steady.",
    "coachingCues": [],
    "primaryEquipment": [
      "Band or Tube"
    ],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/9aLcb5a7390/hqdefault.jpg",
    "videoId": "9aLcb5a7390",
    "videoUrl": "https://www.youtube.com/watch?v=9aLcb5a7390"
  },
  {
    "id": "2626f35c-d839-45fb-9c9e-4208ae157584",
    "name": "Active Standing Hip Flexor",
    "slug": "active-standing-hip-flexor-0024",
    "description": "Step 1: Setup Stand tall with your feet hip-width apart, engaging your core and ensuring your posture is upright.\n\nStep 2: Brace/Position Shift your weight onto your left leg, lifting your right knee towards your chest while keeping your left knee slightly bent.\n\nStep 3: Execute Extend your right leg forward, straightening it while maintaining balance on your left leg, and engage your hip flexors.\n\nStep 4: Return/Repeat Bring your right leg back to the starting position, then switch to the left leg and repeat the movement.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/VY0FyyIHrPo/hqdefault.jpg",
    "videoId": "VY0FyyIHrPo",
    "videoUrl": "https://www.youtube.com/watch?v=VY0FyyIHrPo"
  },
  {
    "id": "9077ec57-2a7e-4673-a305-a1dad5922867",
    "name": "Active Standing Hip Flexor",
    "slug": "active-standing-hip-flexor-0023",
    "description": "Step 1: Setup Stand with your feet hip-width apart, ensuring your weight is evenly distributed on both legs.\n\nStep 2: Brace/Position Engage your core and slightly bend your knees while keeping your back straight and chest lifted.\n\nStep 3: Execute Lift one knee towards your chest, driving your knee upward while maintaining a neutral spine and keeping your opposite leg stable.\n\nStep 4: Return/Repeat Lower your leg back to the starting position and alternate with the opposite leg, repeating for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/VY0FyyIHrPo/hqdefault.jpg",
    "videoId": "VY0FyyIHrPo",
    "videoUrl": "https://www.youtube.com/watch?v=VY0FyyIHrPo"
  },
  {
    "id": "fdc31a21-db47-47dd-a795-1df00cdf9550",
    "name": "Seated Row",
    "slug": "seated-row-0210",
    "description": "Step 1: Setup Sit on the seated row machine with your feet flat on the footrests and knees slightly bent.\n\nStep 2: Brace/Position Grasp the handles with an overhand grip, keeping your back straight and shoulders retracted.\n\nStep 3: Execute Pull the handles towards your torso, squeezing your shoulder blades together while keeping your elbows close to your body.\n\nStep 4: Return/Repeat Slowly extend your arms back to the starting position, maintaining control throughout the movement.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "biceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/0R9ZQd3aM6s/hqdefault.jpg",
    "videoId": "0R9ZQd3aM6s",
    "videoUrl": "https://www.youtube.com/watch?v=0R9ZQd3aM6s"
  },
  {
    "id": "89da9c9e-a178-4d28-9241-bf03fc696178",
    "name": "Single Leg Cobra To Hip Extension",
    "slug": "single-leg-cobra-to-hip-extension-0212",
    "description": "Step 1: Setup Lie face down on a mat with your arms extended in front of you and legs straight, ensuring your forehead is resting on the mat.\n\nStep 2: Brace/Position Engage your core and glutes, lifting one leg off the ground while keeping it straight, and extend the opposite arm forward.\n\nStep 3: Execute Slowly lift your extended arm and the opposite leg simultaneously, raising them towards the ceiling while keeping your hips pressed into the mat.\n\nStep 4: Return/Repeat Lower your arm and leg back to the starting position, then switch sides and repeat the movement.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes",
      "hamstrings"
    ],
    "imageUrl": "https://img.youtube.com/vi/NmkqBhheGFM/hqdefault.jpg",
    "videoId": "NmkqBhheGFM",
    "videoUrl": "https://www.youtube.com/watch?v=NmkqBhheGFM"
  },
  {
    "id": "64be99d5-c183-4327-975d-27f2d161416a",
    "name": "Single Leg Cobra To Hip Extension",
    "slug": "single-leg-cobra-to-hip-extension-0028",
    "description": "Step 1: Setup Lie face down on a mat with your arms extended in front of you and legs straight, engaging your core.\n\nStep 2: Brace/Position Bend your right knee and lift your right foot off the ground, keeping your left leg extended and your hips square to the floor.\n\nStep 3: Execute Raise your chest and right leg off the ground simultaneously, extending your right hip and squeezing your glutes at the top of the movement.\n\nStep 4: Return/Repeat Lower your chest and right leg back to the starting position, then switch to the left leg and repeat the movement.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes",
      "hamstrings"
    ],
    "imageUrl": "https://img.youtube.com/vi/fY64Qk6IfMk/hqdefault.jpg",
    "videoId": "fY64Qk6IfMk",
    "videoUrl": "https://www.youtube.com/watch?v=fY64Qk6IfMk"
  },
  {
    "id": "5226d740-1bca-4229-8ac3-3800777646ea",
    "name": "Foam Roll Calves",
    "slug": "foam-roll-calves-0225",
    "description": "Step 1: Setup Sit on the floor with your legs extended in front of you and place a foam roller under your calves, positioning it just above your ankles.\n\nStep 2: Brace/Position Place your hands on the floor behind you for support and lift your hips off the ground, creating a straight line from your shoulders to your feet.\n\nStep 3: Execute Slowly roll your calves over the foam roller by shifting your body weight forward and backward, applying pressure to any tight or sore areas.\n\nStep 4: Return/Repeat Continue rolling for 30 seconds to 1 minute, then switch to the other calf and repeat the process.",
    "coachingCues": [],
    "primaryEquipment": [
      "Foam Roller"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/6f2LO5EeB0I/hqdefault.jpg",
    "videoId": "6f2LO5EeB0I",
    "videoUrl": "https://www.youtube.com/watch?v=6f2LO5EeB0I"
  },
  {
    "id": "68aef686-12f0-470d-bcb2-abab20c82fbb",
    "name": "Seated Leg Curl",
    "slug": "seated-leg-curl",
    "description": "Step 1: Sit in the leg curl machine with feet hip width apart, abs drawn in and braced and toes pulled toward the nose. Ensure setup positions knee close to hinge on the machine and pad resting on lower calf/achilles.\n\nStep 2: Position head in line with the back and lock shoulder blades back and down. Drive the heels down toward the glutes as far as possible without arching the lower back.\n\nStep 3: Reverse the pattern and lower the weight back to the starting position. Maintain posture throughout.\n\nStep 4: Repeat for the desired number of repetitions. Avoid overarching the lower back, pointing or turning the toes out or jutting the chin forward.",
    "coachingCues": [],
    "primaryEquipment": [
      "Leg Curl Machine"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings"
    ],
    "imageUrl": "https://img.youtube.com/vi/_2Kd0d-JEUM/hqdefault.jpg",
    "videoId": "_2Kd0d-JEUM",
    "videoUrl": "https://www.youtube.com/watch?v=_2Kd0d-JEUM"
  },
  {
    "id": "8c7f84ba-d917-4674-810e-4dd14f79c793",
    "name": "Single Leg Hop Stabilization Level 1",
    "slug": "single-leg-hop-stabilization-level-1-0213",
    "description": "Step 1: Setup Stand on one leg with your knee slightly bent and your foot flat on the ground, ensuring your hips are level and aligned with your shoulders.\n\nStep 2: Brace/Position Engage your core muscles to stabilize your torso and maintain an upright posture; keep your opposite knee lifted to hip height.\n\nStep 3: Execute Hop forward a short distance, landing softly on the same leg while maintaining balance and control throughout the movement.\n\nStep 4: Return/Repeat Return to the starting position and repeat the hop for the desired number of repetitions, focusing on stability and minimizing excessive movement.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/6BkwOUl3fAw/hqdefault.jpg",
    "videoId": "6BkwOUl3fAw",
    "videoUrl": "https://www.youtube.com/watch?v=6BkwOUl3fAw"
  },
  {
    "id": "0004c866-0df0-40ef-b8af-74adb167a8dc",
    "name": "Push Up To 3 Point Stance",
    "slug": "push-up-to-3-point-stance-0193",
    "description": "Step 1: Setup Begin in a high plank position with your hands slightly wider than shoulder-width apart and your feet hip-width apart.\n\nStep 2: Brace/Position Engage your core, keeping your body in a straight line from head to heels, and ensure your shoulders are directly over your wrists.\n\nStep 3: Execute Lower your body towards the ground by bending your elbows, keeping them close to your sides, then push back up to the starting position.\n\nStep 4: Return/Repeat After returning to the starting position, lift one foot off the ground and extend it out to the side, holding for a moment before returning to the plank and repeating the push-up.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/yvuyGj9g6WQ/hqdefault.jpg",
    "videoId": "yvuyGj9g6WQ",
    "videoUrl": "https://www.youtube.com/watch?v=yvuyGj9g6WQ"
  },
  {
    "id": "fed54790-62ea-4c80-951d-d940c226149a",
    "name": "Plank Walkup",
    "slug": "plank-walkup",
    "description": "Step 1: Lie on the stomach with the feet together and the forearms on the ground with elbows under the shoulders. Draw in the belly button, brace, and squeeze the glute muscles. Lift the body off of the floor and form a straight line from head to heel.\n\nStep 2: Next, push up from the ground, one arm at a time, into a push up position.\n\nStep 3: Reverse the pattern and return to the starting position.\n\nStep 4: Repeat for the desired number of repetitions or time. Avoid feet collapsing inward, shoulder blades winging or chin falling toward the floor.",
    "coachingCues": [],
    "primaryEquipment": [
      "None"
    ],
    "muscleGroups": [
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/6Tv4xTRPtUc/hqdefault.jpg",
    "videoId": "6Tv4xTRPtUc",
    "videoUrl": "https://www.youtube.com/watch?v=6Tv4xTRPtUc"
  },
  {
    "id": "b27e0212-e95e-4fa7-bb08-159108200451",
    "name": "Single Leg Balance Reach Frontal Plane",
    "slug": "single-leg-balance-reach-frontal-plane",
    "description": "Step 1: Stand in athletic posture one one foot with hands on hips, toe pointed straight forward, neutral spine, and abs drawn in.\n\nStep 2: Move the floating foot to the side as far as possible without compromising posture.\n\nStep 3: Reverse the movement and return to starting position.\n\nStep 4: Repeat. Maintain posture throughout. Ensure toes are forward at all times, hips stay level and balance is maintained.",
    "coachingCues": [],
    "primaryEquipment": [
      "None"
    ],
    "muscleGroups": [
      "core",
      "glutes"
    ],
    "imageUrl": "https://img.youtube.com/vi/UrB5wA7B3hI/hqdefault.jpg",
    "videoId": "UrB5wA7B3hI",
    "videoUrl": "https://www.youtube.com/watch?v=UrB5wA7B3hI"
  },
  {
    "id": "745368a6-cbcb-4578-a172-4bce71cbd22c",
    "name": "Ladder Jumping Jacks",
    "slug": "ladder-jumping-jacks-0155",
    "description": "Step 1: Setup Stand with your feet together at the base of the agility ladder, arms relaxed at your sides.\n\nStep 2: Brace/Position Engage your core and slightly bend your knees, preparing for explosive movement.\n\nStep 3: Execute Jump into the first square of the ladder, spreading your legs apart while raising your arms overhead, then quickly return to the starting position.\n\nStep 4: Return/Repeat Continue jumping into each square of the ladder, alternating leg positions and arm movements for a set duration.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/pCsAq0HuVqM/hqdefault.jpg",
    "videoId": "pCsAq0HuVqM",
    "videoUrl": "https://www.youtube.com/watch?v=pCsAq0HuVqM"
  },
  {
    "id": "b82e6160-d83b-4c3b-b9bf-2ba5305da2d2",
    "name": "Single Leg Romanian Deadlift To Pnf Pattern 2",
    "slug": "single-leg-romanian-deadlift-to-pnf-pattern-2-0222",
    "description": "Step 1: Setup Stand on your right leg with a slight bend in the knee, holding a dumbbell in your left hand, and engage your core.\n\nStep 2: Brace/Position Hinge at the hips, lowering the dumbbell towards the ground while extending your left leg straight back, keeping your back flat and chest up.\n\nStep 3: Execute As you reach the bottom of the movement, rotate your torso to the left and bring the dumbbell across your body towards your right hip, engaging your glutes and hamstrings.\n\nStep 4: Return/Repeat Reverse the motion by rotating back to the starting position, bringing the dumbbell back to the starting point, and switch legs after completing the desired repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "core",
      "glutes",
      "hamstrings"
    ],
    "imageUrl": "https://img.youtube.com/vi/znQ41ErG4Wk/hqdefault.jpg",
    "videoId": "znQ41ErG4Wk",
    "videoUrl": "https://www.youtube.com/watch?v=znQ41ErG4Wk"
  },
  {
    "id": "1c3bad06-74ec-4d8c-b65a-83930f7b1d4e",
    "name": "Goblet Squat",
    "slug": "goblet-squat",
    "description": "Step 1: Stand in athletic posture with feet hip to shoulder width apart and toes forward. Draw in and brace the abs. Pull the shoulder blades back and down and lock the elbows into the side of the body.\n\nStep 2: Drive the hips back and squat down to a maximum depth that posture and alignment can be maintained (typically between 90˚ at the knee and thigh parallel to the floor). Keep the weight balanced from heel to ball of foot.\n\nStep 3: Reverse the pattern and return to the starting position. Maintain posture throughout.\n\nStep 4: Repeat for the desired number of repetitions. Avoid slouching the back or shoulders, letting the elbows flare out, knees caving in or toes turning out.",
    "coachingCues": [],
    "primaryEquipment": [
      "Kettlebell"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/nfX7IFK9UNI/hqdefault.jpg",
    "videoId": "nfX7IFK9UNI",
    "videoUrl": "https://www.youtube.com/watch?v=nfX7IFK9UNI"
  },
  {
    "id": "471dfd56-713b-4895-9fb5-6c854eeaac9b",
    "name": "Quadruped Arm Raise",
    "slug": "quadruped-arm-raise-0083",
    "description": "Step 1: Setup Begin in a quadruped position on all fours, with your hands directly under your shoulders and knees under your hips.\n\nStep 2: Brace/Position Engage your core, keeping your back flat and neck neutral, while maintaining a stable base with your hands and knees.\n\nStep 3: Execute Slowly raise your right arm straight out in front of you, keeping it in line with your shoulder, while maintaining balance and stability in your torso.\n\nStep 4: Return/Repeat Lower your right arm back to the starting position and repeat the movement with your left arm, alternating sides for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/PSytregUBZY/hqdefault.jpg",
    "videoId": "PSytregUBZY",
    "videoUrl": "https://www.youtube.com/watch?v=PSytregUBZY"
  },
  {
    "id": "883f8a42-af07-4ee9-9ee0-31049afbd88c",
    "name": "Good Mornings",
    "slug": "good-mornings",
    "description": "Step 1: Set the barbell on your upper back, just below the neck, and stand with your feet shoulder-width apart.\n\nStep 2: Engage your core and slightly bend your knees while keeping your back straight.\n\nStep 3: Hinge at the hips to lower your torso forward until it's nearly parallel to the ground, maintaining a neutral spine.\n\nStep 4: Drive through your heels to return to the starting position, fully extending your hips at the top.",
    "coachingCues": [],
    "primaryEquipment": [
      "Barbell"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings"
    ],
    "imageUrl": "https://img.youtube.com/vi/Daq-wJMUnes/hqdefault.jpg",
    "videoId": "Daq-wJMUnes",
    "videoUrl": "https://www.youtube.com/watch?v=Daq-wJMUnes"
  },
  {
    "id": "bfbcab76-8996-469b-8b97-12e71e0f3e57",
    "name": "Supported Bent Over Dumbbell Extension",
    "slug": "supported-bent-over-dumbbell-extension-0118",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a dumbbell in each hand. Bend at the hips and knees, resting your torso on a bench or support surface, keeping your back flat and head in a neutral position.\n\nStep 2: Brace/Position Engage your core and retract your shoulder blades, allowing your arms to hang straight down toward the floor with a slight bend in your elbows.\n\nStep 3: Execute While keeping your elbows stationary, extend your arms back by squeezing your shoulder blades together and lifting the dumbbells until your arms are parallel to the ground.\n\nStep 4: Return/Repeat Slowly lower the dumbbells back to the starting position, maintaining control, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/iRaoz2hbOXU/hqdefault.jpg",
    "videoId": "iRaoz2hbOXU",
    "videoUrl": "https://www.youtube.com/watch?v=iRaoz2hbOXU"
  },
  {
    "id": "1aad3ce7-3c0d-4dc5-b90c-8f10865628fc",
    "name": "Single Leg Floor Bridge",
    "slug": "single-leg-floor-bridge-0090",
    "description": "Step 1: Setup Lie on your back with your knees bent and feet flat on the floor, hip-width apart. Extend one leg straight up toward the ceiling.\n\nStep 2: Brace/Position Engage your core and press your heel into the floor, ensuring your shoulder blades are retracted and your arms are at your sides for stability.\n\nStep 3: Execute Push through your heel to lift your hips off the ground, creating a straight line from your shoulders to your extended knee.\n\nStep 4: Return/Repeat Lower your hips back to the floor with control and repeat for the desired number of repetitions before switching legs.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes"
    ],
    "imageUrl": "https://img.youtube.com/vi/lHXShY-FivU/hqdefault.jpg",
    "videoId": "lHXShY-FivU",
    "videoUrl": "https://www.youtube.com/watch?v=lHXShY-FivU"
  },
  {
    "id": "d54c63d1-43bc-403d-b50f-45c757b277af",
    "name": "Single Leg Floor Bridge",
    "slug": "single-leg-floor-bridge-0091",
    "description": "Step 1: Setup Lie on your back with your knees bent and feet flat on the floor, hip-width apart.\n\nStep 2: Brace/Position Extend one leg straight out, keeping it in line with your torso, and engage your core while pressing your heel into the ground.\n\nStep 3: Execute Push through your heel to lift your hips off the ground, creating a straight line from your shoulders to your extended knee.\n\nStep 4: Return/Repeat Lower your hips back to the ground with control, then repeat for the desired number of repetitions before switching legs.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes"
    ],
    "imageUrl": "https://img.youtube.com/vi/lHXShY-FivU/hqdefault.jpg",
    "videoId": "lHXShY-FivU",
    "videoUrl": "https://www.youtube.com/watch?v=lHXShY-FivU"
  },
  {
    "id": "904b7635-e724-4291-b0f5-81e42762a957",
    "name": "Single Leg Scaption",
    "slug": "single-leg-scaption-0216",
    "description": "Step 1: Setup Stand on your right leg with a slight bend in the knee, holding a light dumbbell in your left hand at your side.\n\nStep 2: Brace/Position Engage your core and maintain an upright posture, ensuring your left arm is straight and your shoulder is relaxed.\n\nStep 3: Execute Raise your left arm diagonally in front of you at a 30-degree angle, keeping your elbow straight and your thumb pointing up, until it reaches shoulder height.\n\nStep 4: Return/Repeat Lower your left arm back to the starting position with control, then repeat for the desired number of repetitions before switching to the right arm.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes"
    ],
    "imageUrl": "https://img.youtube.com/vi/PKjDGnwpB_o/hqdefault.jpg",
    "videoId": "PKjDGnwpB_o",
    "videoUrl": "https://www.youtube.com/watch?v=PKjDGnwpB_o"
  },
  {
    "id": "3cd75552-990b-4712-aa9b-e7bc06a98dcf",
    "name": "Tuck Jump",
    "slug": "tuck-jump",
    "description": "Step 1: Stand with your feet shoulder-width apart and engage your core.\n\nStep 2: Bend your knees slightly and lower your body into a quarter squat.\n\nStep 3: Explode upward, driving your knees towards your chest while keeping your arms in front for balance.\n\nStep 4: Land softly on the balls of your feet, absorbing the impact by bending your knees and returning to the starting position.",
    "coachingCues": [],
    "primaryEquipment": [
      "None"
    ],
    "muscleGroups": [
      "calves",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/-bnJGikRGsM/hqdefault.jpg",
    "videoId": "-bnJGikRGsM",
    "videoUrl": "https://www.youtube.com/watch?v=-bnJGikRGsM"
  },
  {
    "id": "2c5e5351-a02f-49ba-8c39-e311279276aa",
    "name": "Self Myofascial Release Smr Hamstrings",
    "slug": "self-myofascial-release-smr-hamstrings-0226",
    "description": "Step 1: Setup Sit on the floor with your legs extended straight in front of you, placing a foam roller under your hamstrings.\n\nStep 2: Brace/Position Engage your core and maintain a neutral spine while positioning your hands behind you for support.\n\nStep 3: Execute Slowly roll the foam roller from the back of your knees to the glutes, applying pressure to the hamstrings for 30 seconds to 2 minutes.\n\nStep 4: Return/Repeat Reverse the movement, rolling back down to the knees, then repeat the process for additional time as needed.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/_M29fhv3LoI/hqdefault.jpg",
    "videoId": "_M29fhv3LoI",
    "videoUrl": "https://www.youtube.com/watch?v=_M29fhv3LoI"
  },
  {
    "id": "7512458f-639d-451d-8940-dbc004c0dd3a",
    "name": "Push Up Plus",
    "slug": "push-up-plus-0202",
    "description": "Step 1: Setup Begin in a high plank position with your hands slightly wider than shoulder-width apart and your feet hip-width apart, ensuring your body forms a straight line from head to heels.\n\nStep 2: Brace/Position Engage your core and glutes, keeping your shoulders directly over your wrists and your neck neutral.\n\nStep 3: Execute Lower your body towards the ground by bending your elbows while keeping them close to your sides, then push back up to the starting position. At the top, protract your shoulder blades by pushing through your palms, rounding your upper back slightly.\n\nStep 4: Return/Repeat Lower back into the push-up position, then repeat the movement for the desired number of repetitions, maintaining proper form throughout.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/qw-9P3R37vU/hqdefault.jpg",
    "videoId": "qw-9P3R37vU",
    "videoUrl": "https://www.youtube.com/watch?v=qw-9P3R37vU"
  },
  {
    "id": "29d45ad2-3eb3-418b-84e3-6590a300006f",
    "name": "Single Leg Romanian Deadlift",
    "slug": "single-leg-romanian-deadlift-0218",
    "description": "Step 1: Setup Stand on your right leg with a slight bend in the knee, holding a dumbbell in your left hand, and engage your core.\n\nStep 2: Brace/Position Hinge at the hip, extending your left leg straight back while lowering the dumbbell toward the ground, keeping your back flat and shoulders retracted.\n\nStep 3: Execute Lower the dumbbell until you feel a stretch in your right hamstring, maintaining balance on your right leg.\n\nStep 4: Return/Repeat Drive through your right heel to return to the starting position, then repeat for the desired number of repetitions before switching legs.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "core",
      "glutes",
      "hamstrings"
    ],
    "imageUrl": "https://img.youtube.com/vi/6pEL3KxnlEo/hqdefault.jpg",
    "videoId": "6pEL3KxnlEo",
    "videoUrl": "https://www.youtube.com/watch?v=6pEL3KxnlEo"
  },
  {
    "id": "fe9eda96-3237-454e-b900-26e05b9905f0",
    "name": "Self Myofascial Release Smr Piriformis",
    "slug": "self-myofascial-release-smr-piriformis-0232",
    "description": "Step 1: Setup Sit on the floor with your legs extended in front of you, placing a foam roller or massage ball under your right glute.\n\nStep 2: Brace/Position Bend your right knee and place your right foot on the floor, crossing your right ankle over your left knee to open the hip.\n\nStep 3: Execute Gently roll your body weight onto the foam roller or ball, targeting the piriformis muscle, and pause on any tight or tender spots for 20-30 seconds.\n\nStep 4: Return/Repeat Switch to the left side by moving the foam roller or ball under your left glute and repeat the process.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/XS5hY6vBi6g/hqdefault.jpg",
    "videoId": "XS5hY6vBi6g",
    "videoUrl": "https://www.youtube.com/watch?v=XS5hY6vBi6g"
  },
  {
    "id": "02457199-3e35-44c3-b342-93ae85de8bb1",
    "name": "Self Myofascial Release Smr Piriformis",
    "slug": "self-myofascial-release-smr-piriformis-0231",
    "description": "Step 1: Setup Sit on the floor with your legs extended in front of you, and place a foam roller or massage ball under your right glute, targeting the piriformis muscle.\n\nStep 2: Brace/Position Bend your right knee and cross your right ankle over your left knee, creating a figure-four position to increase pressure on the piriformis.\n\nStep 3: Execute Gently roll back and forth on the foam roller or ball, focusing on any tight or tender spots in the right glute for 30-60 seconds.\n\nStep 4: Return/Repeat Switch to the left side by moving the foam roller or ball under your left glute and repeating the process for another 30-60 seconds.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/XS5hY6vBi6g/hqdefault.jpg",
    "videoId": "XS5hY6vBi6g",
    "videoUrl": "https://www.youtube.com/watch?v=XS5hY6vBi6g"
  },
  {
    "id": "3dbe88df-3d55-48aa-9d90-7c049d350175",
    "name": "Self Myofascial Release Smr Peroneals",
    "slug": "self-myofascial-release-smr-peroneals-0230",
    "description": "Step 1: Setup Sit on the floor with your legs extended in front of you and place a foam roller under your outer lower leg, targeting the peroneal muscles.\n\nStep 2: Brace/Position Position your body so that your weight is distributed on the foam roller, with your opposite leg crossed over the leg being rolled for added pressure.\n\nStep 3: Execute Slowly roll the foam roller along the outer side of your lower leg, from the ankle to just below the knee, pausing on any tight or tender spots for 20-30 seconds.\n\nStep 4: Return/Repeat After rolling, switch to the other leg and repeat the process, ensuring to maintain controlled movements throughout.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/o0sqnX6FMzk/hqdefault.jpg",
    "videoId": "o0sqnX6FMzk",
    "videoUrl": "https://www.youtube.com/watch?v=o0sqnX6FMzk"
  },
  {
    "id": "8af448ba-c90f-45e4-a2d6-46341183547a",
    "name": "Single Leg Throw And Catch Transverse 1",
    "slug": "single-leg-throw-and-catch-transverse-1-0039",
    "description": "Step 1: Setup Stand on one leg with a slight bend in the knee, holding a medicine ball at chest level with both hands.\n\nStep 2: Brace/Position Engage your core and maintain an upright torso, ensuring your standing leg is stable and balanced.\n\nStep 3: Execute Rotate your torso towards the side of your standing leg and throw the medicine ball against a wall or to a partner, maintaining balance on the standing leg.\n\nStep 4: Return/Repeat Catch the ball on the rebound, rotate back to the starting position, and repeat for the desired number of repetitions before switching legs.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes"
    ],
    "imageUrl": "https://img.youtube.com/vi/w1shWW8WCN0/hqdefault.jpg",
    "videoId": "w1shWW8WCN0",
    "videoUrl": "https://www.youtube.com/watch?v=w1shWW8WCN0"
  },
  {
    "id": "7774afa0-8ac2-4353-b79b-c3a7693c9dac",
    "name": "Squat To Row",
    "slug": "squat-to-row-0241",
    "description": "Step 1: Setup Stand with feet shoulder-width apart, holding a dumbbell in each hand with palms facing your body, arms fully extended at your sides.\n\nStep 2: Brace/Position Engage your core and hinge at the hips, lowering your body into a squat while keeping your chest up and back straight.\n\nStep 3: Execute As you rise from the squat, pull the dumbbells towards your torso, squeezing your shoulder blades together to perform a row.\n\nStep 4: Return/Repeat Lower the dumbbells back to the starting position as you descend into the squat again, maintaining control throughout the movement.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "biceps",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/qZn-_dXCP2s/hqdefault.jpg",
    "videoId": "qZn-_dXCP2s",
    "videoUrl": "https://www.youtube.com/watch?v=qZn-_dXCP2s"
  },
  {
    "id": "0f5b24b8-3ad6-4292-8da9-8b6a1a56cbd3",
    "name": "Squat To Row",
    "slug": "squat-to-row-0242",
    "description": "Step 1: Setup Stand with feet shoulder-width apart, holding a dumbbell in each hand, arms fully extended in front of you.\n\nStep 2: Brace/Position Engage your core, hinge at the hips, and lower into a squat while keeping your chest up and back straight.\n\nStep 3: Execute From the squat position, push through your heels to stand up while simultaneously pulling the dumbbells towards your ribcage in a rowing motion.\n\nStep 4: Return/Repeat Lower back into the squat position, extending your arms back to the starting position, and repeat the movement.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "biceps",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/qZn-_dXCP2s/hqdefault.jpg",
    "videoId": "qZn-_dXCP2s",
    "videoUrl": "https://www.youtube.com/watch?v=qZn-_dXCP2s"
  },
  {
    "id": "a75abb96-9d1f-4655-a5e4-eb5d8093d68e",
    "name": "Band Assisted Pull Up",
    "slug": "band-assisted-pull-up",
    "description": "Step 1: Secure the band or tube around the pull-up bar, ensuring it is tightly fastened and hangs down.\n\nStep 2: Place one foot or knee into the band to provide assistance as you grip the pull-up bar with an overhand grip.\n\nStep 3: Engage your core and pull yourself up towards the bar, focusing on using your back and arms.\n\nStep 4: Lower yourself back down in a controlled manner, fully extending your arms before repeating the movement.",
    "coachingCues": [],
    "primaryEquipment": [
      "Pull-Up Bar",
      "Band or Tube"
    ],
    "muscleGroups": [
      "back",
      "biceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/B_VkNQS5YLs/hqdefault.jpg",
    "videoId": "B_VkNQS5YLs",
    "videoUrl": "https://www.youtube.com/watch?v=B_VkNQS5YLs"
  },
  {
    "id": "e6197915-d387-44c8-8501-41a7a0526437",
    "name": "Russian Twist",
    "slug": "russian-twist",
    "description": "Step 1: Lie with upper back and head supported on a stability ball with good posture and feet hip width apart. Extend arms overhead and place hands together.\n\nStep 2: Starting in a bridged position, lock the arms and shoulder together as a unit and drive the hands and chest to the side rotating the body and rolling the ball backwards until you are on the side of your shoulder. Keep the hips bridged at all times.\n\nStep 3: Reverse the pattern and return to the starting position.\n\nStep 4: Repeat on the other side. Maintain posture throughout. Ensure balance, posture and control of the stability ball are maintained. Avoid turning the feet, dropping the hips, or using momentum.",
    "coachingCues": [],
    "primaryEquipment": [
      "Stability Ball"
    ],
    "muscleGroups": [
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/s0kT80JLCfA/hqdefault.jpg",
    "videoId": "s0kT80JLCfA",
    "videoUrl": "https://www.youtube.com/watch?v=s0kT80JLCfA"
  },
  {
    "id": "13c261b3-5fec-4e1e-8622-221a669581bc",
    "name": "Single Arm Dumbbell Chest Press",
    "slug": "single-arm-dumbbell-chest-press",
    "description": "Step 1: Lie supine with neutral spine on a bench with your feet straight and flat on the floor. Draw in and brace the abs and lock the shoulders blades back and down on the bench. Hold the dumbbell at approximately shoulder level to begin slightly out to the sides of the body in line with the chest.\n\nStep 2: Press the dumbbell up and in until the arm is completely extended ending with it directly above the shoulder.\n\nStep 3: Reverse the pattern and return the starting position.\n\nStep 4: Repeat. Maintain posture throughout. Do not arch the back or jut the head forward. Avoid letting the shoulders round, posture shift or feet lift in the air. Keep the elbows under the dumbbells to maintain balance at all times.",
    "coachingCues": [],
    "primaryEquipment": [
      "Bench",
      "Dumbbells"
    ],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/qFTnmyC-nf4/hqdefault.jpg",
    "videoId": "qFTnmyC-nf4",
    "videoUrl": "https://www.youtube.com/watch?v=qFTnmyC-nf4"
  },
  {
    "id": "a8ce935d-47f8-4056-ab5a-98e32591d59d",
    "name": "Activation Ball Prone Wide Row",
    "slug": "activation-ball-prone-wide-row-0008",
    "description": "Step 1: Setup Lie face down on an activation ball with your chest supported, feet shoulder-width apart, and toes pointed down for stability.\n\nStep 2: Brace/Position Engage your core and retract your shoulder blades, allowing your arms to hang straight down toward the floor with palms facing each other.\n\nStep 3: Execute While keeping your elbows slightly bent, pull your arms out to the sides in a wide arc, squeezing your shoulder blades together at the top of the movement.\n\nStep 4: Return/Repeat Slowly lower your arms back to the starting position, maintaining control, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "biceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/qSqFFlidCXo/hqdefault.jpg",
    "videoId": "qSqFFlidCXo",
    "videoUrl": "https://www.youtube.com/watch?v=qSqFFlidCXo"
  },
  {
    "id": "50392a04-b80c-41f9-b8df-bbbb51db86f9",
    "name": "Leg Press Calf Raise",
    "slug": "leg-press-calf-raise",
    "description": "Step 1: Sit on the leg press machine with your back against the pad and feet positioned shoulder-width apart on the platform.\n\nStep 2: Push the platform away by extending your legs fully, keeping a slight bend in your knees at the top.\n\nStep 3: Shift your focus to your toes by raising your heels off the platform, engaging your calf muscles.\n\nStep 4: Lower your heels back down to the platform, then repeat the calf raise for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Leg Press Machine"
    ],
    "muscleGroups": [
      "calves",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/8k435cj30gc/hqdefault.jpg",
    "videoId": "8k435cj30gc",
    "videoUrl": "https://www.youtube.com/watch?v=8k435cj30gc"
  },
  {
    "id": "f72a4814-62c0-4b20-8e6f-21abbda384d3",
    "name": "Single Leg Press",
    "slug": "single-leg-press",
    "description": "Step 1: Sit in the leg press machine with feet hip to shoulder width apart and straight ahead on the leg press platform. Ensure foot height placement allows for good range of movement at both the hip and knee. Let one foot rest on the foot rest below. Draw in and brace the abs. Lock the shoulder blades back and down. Stabilize the upper body by grasping the handles.\n\nStep 2: Lower the platform down toward the body ensuring the knee stays aligned with the middle toes and weight is distributed evenly across the foot. Move through a maximum range without losing technique or bottoming out the thighs into the rib cage.\n\nStep 3: Reverse the pattern and return to starting position.\n\nStep 4: Repeat. Maintain posture throughout. Avoid locking the knees, bouncing at the bottom of the movement to create momentum, rounding the spine or letting the hips come off the pad, or collapsing the knees inward. Do not let the hips or torso rotate.",
    "coachingCues": [],
    "primaryEquipment": [
      "Leg Press Machine"
    ],
    "muscleGroups": [
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/3aYsOsBA7ZE/hqdefault.jpg",
    "videoId": "3aYsOsBA7ZE",
    "videoUrl": "https://www.youtube.com/watch?v=3aYsOsBA7ZE"
  },
  {
    "id": "3ec7a823-6eaa-4a52-b8b1-2fa35cf965da",
    "name": "Barbell Front Squat With Crossed Arms",
    "slug": "barbell-front-squat-with-crossed-arms-0061",
    "description": "Step 1: Setup Position the barbell across the front of your shoulders, crossing your arms to hold the bar in place.\n\nStep 2: Brace/Position Stand with your feet shoulder-width apart, toes slightly pointed out, and engage your core while maintaining a neutral spine.\n\nStep 3: Execute Lower your body by bending at the hips and knees, keeping your elbows high and chest up, until your thighs are parallel to the ground.\n\nStep 4: Return/Repeat Push through your heels to return to the starting position, fully extending your hips and knees, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Barbell"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/W9jJaI4cHJU/hqdefault.jpg",
    "videoId": "W9jJaI4cHJU",
    "videoUrl": "https://www.youtube.com/watch?v=W9jJaI4cHJU"
  },
  {
    "id": "70c36845-9901-4a40-8f81-67ebbdd1f62a",
    "name": "Single Arm Incline Dumbbell Chest Press",
    "slug": "single-arm-incline-dumbbell-chest-press",
    "description": "Step 1: Lie supine with neutral spine on an incline bench with your feet straight and flat on the floor. Draw in and brace the abs and lock the shoulders blades back and down on the bench. Hold the dumbbell at approximately shoulder level to begin slightly out to the sides of the body in line with the chest.\n\nStep 2: Press the dumbbell up and in until the arm is completely extended ending with it directly above the shoulder.\n\nStep 3: Reverse the pattern and return the starting position.\n\nStep 4: Repeat. Maintain posture throughout. Do not arch the back or jut the head forward. Avoid letting the shoulders round, posture shift or feet lift in the air. Keep the elbows under the dumbbells to maintain balance at all times.",
    "coachingCues": [],
    "primaryEquipment": [
      "Bench",
      "Dumbbells"
    ],
    "muscleGroups": [
      "chest",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/iJ-GwVeUuCg/hqdefault.jpg",
    "videoId": "iJ-GwVeUuCg",
    "videoUrl": "https://www.youtube.com/watch?v=iJ-GwVeUuCg"
  },
  {
    "id": "662dd925-bea0-4a2b-b273-d3514d077cbf",
    "name": "Dead Bug",
    "slug": "dead-bug",
    "description": "Step 1: Lie supine on the floor with your arms and legs extended behind and in front of you. Draw in your abs.\n\nStep 2: Slowly and simultaneously lift your opposite arm and leg bringing the arm above the shoulder and knee above your hip at 90˚ angles.\n\nStep 3: Reverse the pattern and return to the starting position.\n\nStep 4: Repeat on the other side. Maintain posture throughout. Avoid arching the back, letting the ribs flare or body rotate.",
    "coachingCues": [],
    "primaryEquipment": [
      "None"
    ],
    "muscleGroups": [
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/bxn9FBrt4-A/hqdefault.jpg",
    "videoId": "bxn9FBrt4-A",
    "videoUrl": "https://www.youtube.com/watch?v=bxn9FBrt4-A"
  },
  {
    "id": "c2827d20-b823-456e-9167-8872de1b5e95",
    "name": "Leg Circuit Frontal",
    "slug": "leg-circuit-frontal-0162",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, toes pointing forward, and engage your core.\n\nStep 2: Brace/Position Shift your weight onto your left leg, lifting your right leg to the side while keeping your hips level.\n\nStep 3: Execute Press through your left heel to lift your right leg higher, maintaining a straight leg and a controlled motion.\n\nStep 4: Return/Repeat Lower your right leg back to the starting position and repeat for the desired number of repetitions before switching to the left leg.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/hV6ozNZJyWA/hqdefault.jpg",
    "videoId": "hV6ozNZJyWA",
    "videoUrl": "https://www.youtube.com/watch?v=hV6ozNZJyWA"
  },
  {
    "id": "c147cca8-b0bd-4343-830a-e2f9a95a87e6",
    "name": "Incline Stance Single Arm Row",
    "slug": "incline-stance-single-arm-row-0131",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a dumbbell in one hand, and hinge at the hips to create a 45-degree incline with your torso.\n\nStep 2: Brace/Position Engage your core and maintain a neutral spine, allowing the opposite arm to rest on your thigh for support while the dumbbell hangs straight down.\n\nStep 3: Execute Pull the dumbbell towards your hip, keeping your elbow close to your body and squeezing your shoulder blade towards your spine at the top of the movement.\n\nStep 4: Return/Repeat Lower the dumbbell back to the starting position in a controlled manner, then repeat for the desired number of repetitions before switching arms.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "biceps",
      "chest",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/-eKoynNqlfo/hqdefault.jpg",
    "videoId": "-eKoynNqlfo",
    "videoUrl": "https://www.youtube.com/watch?v=-eKoynNqlfo"
  },
  {
    "id": "a1a2db70-c0a1-4591-b455-c909d68c2cde",
    "name": "Quadruped Opposite Arm Leg Raise",
    "slug": "quadruped-opposite-arm-leg-raise-0087",
    "description": "Step 1: Setup Begin on all fours with your hands directly under your shoulders and knees under your hips, maintaining a neutral spine.\n\nStep 2: Brace/Position Engage your core and ensure your back is flat, avoiding any sagging or arching.\n\nStep 3: Execute Extend your right arm forward and your left leg backward simultaneously, keeping both parallel to the ground and maintaining balance.\n\nStep 4: Return/Repeat Lower your right arm and left leg back to the starting position, then switch sides and repeat the movement with your left arm and right leg.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/GJ34tTJyWz8/hqdefault.jpg",
    "videoId": "GJ34tTJyWz8",
    "videoUrl": "https://www.youtube.com/watch?v=GJ34tTJyWz8"
  },
  {
    "id": "775c55b1-c479-46bf-b1cf-f965b20796b5",
    "name": "How To Foam Roll Adductors",
    "slug": "how-to-foam-roll-adductors-0224",
    "description": "Step 1: Setup Sit on the floor with your legs extended in front of you, placing a foam roller horizontally under your inner thighs.\n\nStep 2: Brace/Position Lean back slightly on your hands for support, keeping your elbows slightly bent and your core engaged.\n\nStep 3: Execute Slowly roll the foam roller from your groin down to your knees, applying pressure to the adductor muscles, and pause on any tight spots for 15-30 seconds.\n\nStep 4: Return/Repeat Reverse the movement, rolling back up to the groin, and repeat the process for 2-3 sets on each leg.",
    "coachingCues": [],
    "primaryEquipment": [
      "Foam Roller"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/Nqol0T6rKDg/hqdefault.jpg",
    "videoId": "Nqol0T6rKDg",
    "videoUrl": "https://www.youtube.com/watch?v=Nqol0T6rKDg"
  },
  {
    "id": "5e81a3d7-57e2-44fa-83d6-d35f4733b25a",
    "name": "How To Foam Roll Adductors",
    "slug": "how-to-foam-roll-adductors-0223",
    "description": "Step 1: Setup Position the foam roller on the floor and sit beside it, extending one leg out to the side while keeping the other leg bent with the foot flat on the ground.\n\nStep 2: Brace/Position Lean onto the foam roller by shifting your weight onto the extended leg, ensuring that the inner thigh is resting on the roller.\n\nStep 3: Execute Slowly roll back and forth along the inner thigh from the knee to the groin, pausing on any tight or tender spots for 15-30 seconds.\n\nStep 4: Return/Repeat Switch to the opposite leg and repeat steps 1-3, ensuring even coverage of both adductors.",
    "coachingCues": [],
    "primaryEquipment": [
      "Foam Roller"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/Nqol0T6rKDg/hqdefault.jpg",
    "videoId": "Nqol0T6rKDg",
    "videoUrl": "https://www.youtube.com/watch?v=Nqol0T6rKDg"
  },
  {
    "id": "e2c6fe01-befe-4e67-be82-294323549359",
    "name": "Leg Circuit",
    "slug": "leg-circuit-0161",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a dumbbell in each hand at your sides.\n\nStep 2: Brace/Position Engage your core, keeping your chest up and shoulders back as you prepare to move.\n\nStep 3: Execute Lower into a squat by bending your knees and pushing your hips back, keeping your weight on your heels; then rise back to standing.\n\nStep 4: Return/Repeat Perform a series of lunges by stepping forward with one leg, lowering your back knee toward the ground, then return to standing and alternate legs.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/nPHtf8q5PxM/hqdefault.jpg",
    "videoId": "nPHtf8q5PxM",
    "videoUrl": "https://www.youtube.com/watch?v=nPHtf8q5PxM"
  },
  {
    "id": "b0500001-0000-4000-8000-000000000011",
    "name": "BOSU Lateral Bound with Stabilization",
    "slug": "bosu-lateral-bound-with-stabilization",
    "description": "Step 1: Setup Place the BOSU dome-side up. Stand to the left side of the dome, balanced on your right leg with knee and hip slightly flexed.\n\nStep 2: Brace/Position Load your right glute and push off forcefully laterally, leaping over and landing on the center apex of the dome with your left foot.\n\nStep 3: Execute Absorb the landing with knee flexed, chest up, and freeze in a single-leg balance for 3 full seconds, establishing complete stability.\n\nStep 4: Return/Repeat Push off the left foot to bound back to the right landing softly, and repeat for prescribed power repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "BOSU Balance Trainer"
    ],
    "muscleGroups": [
      "quadriceps",
      "glutes",
      "calves",
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/vEGpyuTh3zw/hqdefault.jpg",
    "videoId": "vEGpyuTh3zw",
    "videoUrl": "https://www.youtube.com/watch?v=vEGpyuTh3zw"
  },
  {
    "id": "84ee4846-4058-4322-839f-32ba3216bf36",
    "name": "Chest Press Machine",
    "slug": "chest-press-machine",
    "description": "Step 1: Adjust the seat height so that the handles are at chest level when seated.\n\nStep 2: Sit down and firmly grip the handles with your palms facing forward.\n\nStep 3: Press the handles forward until your arms are fully extended, keeping your elbows slightly bent.\n\nStep 4: Slowly return to the starting position, controlling the weight as you bring the handles back to your chest.",
    "coachingCues": [],
    "primaryEquipment": [
      "Chest Press Machine"
    ],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/lRo9zZ7EwpM/hqdefault.jpg",
    "videoId": "lRo9zZ7EwpM",
    "videoUrl": "https://www.youtube.com/watch?v=lRo9zZ7EwpM"
  },
  {
    "id": "9d992449-875f-451d-9653-009b9c13e6c2",
    "name": "Kettlebell Jerk",
    "slug": "kettlebell-jerk-0142",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a kettlebell in one hand at shoulder height with your elbow tucked close to your body.\n\nStep 2: Brace/Position Engage your core and maintain a neutral spine, keeping your opposite arm relaxed at your side.\n\nStep 3: Execute Dip slightly by bending your knees, then explosively extend your legs while pressing the kettlebell overhead, locking out your arm at the top.\n\nStep 4: Return/Repeat Lower the kettlebell back to shoulder height in a controlled manner, then repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Kettlebell"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/9NFkYaviXgk/hqdefault.jpg",
    "videoId": "9NFkYaviXgk",
    "videoUrl": "https://www.youtube.com/watch?v=9NFkYaviXgk"
  },
  {
    "id": "9853daa6-40fb-4595-8fe7-36175682f0ec",
    "name": "Kettlebell Jerk",
    "slug": "kettlebell-jerk-0141",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a kettlebell in one hand at shoulder height, with your elbow tucked close to your body.\n\nStep 2: Brace/Position Engage your core and maintain a neutral spine, keeping your opposite arm relaxed at your side.\n\nStep 3: Execute Drive through your legs and explosively extend your hips while pressing the kettlebell overhead, locking your arm out at the top.\n\nStep 4: Return/Repeat Lower the kettlebell back to shoulder height in a controlled manner and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Kettlebell"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/9NFkYaviXgk/hqdefault.jpg",
    "videoId": "9NFkYaviXgk",
    "videoUrl": "https://www.youtube.com/watch?v=9NFkYaviXgk"
  },
  {
    "id": "e27ef731-876a-414b-933e-d925156ef8ae",
    "name": "Close Grip Bench Press",
    "slug": "close-grip-bench-press",
    "description": "Step 1: Lie on the bench with your feet straight and flat on the floor. Grasp the barbell to narrower-than-shoulder-width apart.\n\nStep 2: Unrack the bar and bring it directly over shoulders with straight arms (this is the starting position).\n\nStep 3: Press the bar up, fully extending the arms returning to the starting position. Pause.\n\nStep 4: Repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Bench"
    ],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/LJeqLAmJLfs/hqdefault.jpg",
    "videoId": "LJeqLAmJLfs",
    "videoUrl": "https://www.youtube.com/watch?v=LJeqLAmJLfs"
  },
  {
    "id": "a0607344-b5c1-4b9d-8454-17147e768e67",
    "name": "Lying Leg Curl Two Leg Concentric Single Leg Eccentric",
    "slug": "lying-leg-curl-two-leg-concentric-single-leg-eccentric",
    "description": "Step 1: Adjust the machine so that the pad rests comfortably against your lower calves, ensuring your knees align with the pivot point.\n\nStep 2: Lie face down on the machine, grasp the handles, and engage your core while keeping your hips pressed against the bench.\n\nStep 3: Curl both legs up simultaneously towards your glutes, squeezing your hamstrings at the top of the movement.\n\nStep 4: Lower one leg slowly back to the starting position while maintaining control, then repeat with the other leg.",
    "coachingCues": [],
    "primaryEquipment": [
      "Lying Leg Curl Machine"
    ],
    "muscleGroups": [
      "core",
      "glutes",
      "hamstrings"
    ],
    "imageUrl": "https://img.youtube.com/vi/_7sVQlruVZc/hqdefault.jpg",
    "videoId": "_7sVQlruVZc",
    "videoUrl": "https://www.youtube.com/watch?v=_7sVQlruVZc"
  },
  {
    "id": "1e676b47-4fdf-491e-83b3-d1fe407c6c85",
    "name": "Double Kettlebell Clean",
    "slug": "double-kettlebell-clean-0134",
    "description": "Step 1: Setup Stand with feet shoulder-width apart, holding a kettlebell in each hand with palms facing your body, and kettlebells positioned between your feet.\n\nStep 2: Brace/Position Hinge at the hips, slightly bend your knees, and maintain a neutral spine while engaging your core to prepare for the lift.\n\nStep 3: Execute Drive through your heels, extend your hips and knees, and pull the kettlebells upward, keeping them close to your body as you rotate your wrists to catch them at shoulder height.\n\nStep 4: Return/Repeat Lower the kettlebells back to the starting position by reversing the movement, ensuring to maintain control and proper form before repeating the exercise.",
    "coachingCues": [],
    "primaryEquipment": [
      "Kettlebell"
    ],
    "muscleGroups": [
      "back",
      "glutes",
      "hamstrings",
      "quadriceps",
      "shoulders"
    ],
    "imageUrl": "https://img.youtube.com/vi/Yaelrl1VN20/hqdefault.jpg",
    "videoId": "Yaelrl1VN20",
    "videoUrl": "https://www.youtube.com/watch?v=Yaelrl1VN20"
  },
  {
    "id": "500d28b2-dc9d-402b-9c0f-48f399ccd61d",
    "name": "Seated Machine Row Close Grip",
    "slug": "seated-machine-row-close-grip",
    "description": "Step 1: Sit tall with good posture on the bench and place your feet on the platform with a slight bend in the knee. Grip handles so palms face one another. Draw in and brace the abs. Lock the shoulder blades back and down and align the head with the spine.\n\nStep 2: Slowly pull the handles back to a comfortable range of motion driving the hands toward the lower ribs and pinching the shoulder blades together.\n\nStep 3: Reverse the pattern and return to the starting position.\n\nStep 4: Repeat. Maintain posture throughout. Avoid jutting the chin forward, arching or slouching the lower back, letting the shoulders round or shrug, or leaning forward at the waist/spine and creating momentum.",
    "coachingCues": [],
    "primaryEquipment": [
      "Seated Cable Row Machine"
    ],
    "muscleGroups": [
      "back",
      "biceps",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/k0cTJCfxa0Y/hqdefault.jpg",
    "videoId": "k0cTJCfxa0Y",
    "videoUrl": "https://www.youtube.com/watch?v=k0cTJCfxa0Y"
  },
  {
    "id": "78beaaac-8635-46d4-9652-90ec1714fa80",
    "name": "Two Arm Incline Dumbbell Chest Press",
    "slug": "two-arm-incline-dumbbell-chest-press",
    "description": "Step 1: Lie supine with neutral spine on an incline bench with your feet straight and flat on the floor. Draw in and brace the abs and lock the shoulders blades back and down on the bench. Hold the dumbbells at approximately shoulder level to begin slightly out to the sides of the body in line with the chest.\n\nStep 2: Press the dumbbells up and together until the arms are completely extended ending with them directly above the shoulders.\n\nStep 3: Reverse the pattern and return to the starting position.\n\nStep 4: Repeat. Maintain posture throughout. Do not arch the back or jut the head forward. Avoid letting the shoulders round, posture shift or feet lift in the air. Keep the elbows under the dumbbells to maintain balance at all times.",
    "coachingCues": [],
    "primaryEquipment": [
      "Bench",
      "Dumbbells"
    ],
    "muscleGroups": [
      "chest",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/JKnpHchOWPU/hqdefault.jpg",
    "videoId": "JKnpHchOWPU",
    "videoUrl": "https://www.youtube.com/watch?v=JKnpHchOWPU"
  },
  {
    "id": "6d011e56-693c-4202-88b6-34f90521cda8",
    "name": "Single Leg Seated Leg Curl",
    "slug": "single-leg-seated-leg-curl",
    "description": "Step 1: Sit in the leg curl machine with feet hip width apart, abs drawn in and braced and toe pulled toward the nose. Ensure setup positions knee close to hinge on the machine and pad resting on lower calf/achilles. Hang one leg straight down. Position head in line with the back and lock shoulder blades back and down.\n\nStep 2: Drive the heels down toward the glutes as far as possible without arching the lower back.\n\nStep 3: Reverse the pattern and lower the weight back to the starting position. Maintain posture throughout.\n\nStep 4: Repeat for the desired number of repetitions. Avoid overarching the lower back, pointing or turning the toes out or jutting the chin forward.",
    "coachingCues": [],
    "primaryEquipment": [
      "Leg Curl Machine"
    ],
    "muscleGroups": [
      "core",
      "glutes",
      "hamstrings"
    ],
    "imageUrl": "https://img.youtube.com/vi/PXNJ71rksvU/hqdefault.jpg",
    "videoId": "PXNJ71rksvU",
    "videoUrl": "https://www.youtube.com/watch?v=PXNJ71rksvU"
  },
  {
    "id": "30f4fbef-8d6d-4757-b6c3-29a9b77c2e8e",
    "name": "Ball Cobra",
    "slug": "ball-cobra-0051",
    "description": "Step 1: Setup Lie face down on a stability ball with your hips and abdomen supported, feet shoulder-width apart on the ground, and arms extended straight in front of you.\n\nStep 2: Brace/Position Engage your core, maintain a neutral spine, and keep your head in line with your body while allowing your arms to hang down.\n\nStep 3: Execute Raise your arms and chest off the ball simultaneously, squeezing your shoulder blades together and lifting until your body forms a straight line from head to heels.\n\nStep 4: Return/Repeat Lower your arms and chest back to the starting position with control, then repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/2CDihCl3wFQ/hqdefault.jpg",
    "videoId": "2CDihCl3wFQ",
    "videoUrl": "https://www.youtube.com/watch?v=2CDihCl3wFQ"
  },
  {
    "id": "fe2a7257-53ac-4b34-b85e-4eae8f2c752c",
    "name": "Ball Cobra",
    "slug": "ball-cobra-0052",
    "description": "Step 1: Setup Position your chest and stomach on a stability ball, with your feet shoulder-width apart on the ground for stability.\n\nStep 2: Brace/Position Engage your core and keep your head in a neutral position, allowing your arms to hang down towards the floor.\n\nStep 3: Execute Lift your chest and arms off the ball by squeezing your shoulder blades together, extending your arms forward and upward in a controlled motion.\n\nStep 4: Return/Repeat Lower your chest and arms back to the starting position, maintaining control, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/2CDihCl3wFQ/hqdefault.jpg",
    "videoId": "2CDihCl3wFQ",
    "videoUrl": "https://www.youtube.com/watch?v=2CDihCl3wFQ"
  },
  {
    "id": "59007b1f-7369-4e1d-8ba3-28175b7e2076",
    "name": "Standing Tubing Row",
    "slug": "standing-tubing-row-0244",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding the tubing with both hands, palms facing each other, and the tubing anchored securely behind you.\n\nStep 2: Brace/Position Engage your core, slightly bend your knees, and hinge forward at the hips while keeping your back straight and chest up.\n\nStep 3: Execute Pull the tubing towards your torso, squeezing your shoulder blades together, and keeping your elbows close to your body.\n\nStep 4: Return/Repeat Slowly extend your arms back to the starting position, maintaining control of the tubing, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "biceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/qykwviNOIyc/hqdefault.jpg",
    "videoId": "qykwviNOIyc",
    "videoUrl": "https://www.youtube.com/watch?v=qykwviNOIyc"
  },
  {
    "id": "6ef4b200-d8df-4a94-b5aa-ac93ab6fb98c",
    "name": "Standing Tubing Row",
    "slug": "standing-tubing-row-0245",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding the tubing with both hands, arms extended in front of you at shoulder height.\n\nStep 2: Brace/Position Engage your core and maintain a slight bend in your knees, ensuring your back is straight and shoulders are relaxed.\n\nStep 3: Execute Pull the tubing towards your torso, bending your elbows and squeezing your shoulder blades together, keeping your elbows close to your body.\n\nStep 4: Return/Repeat Slowly extend your arms back to the starting position, maintaining control of the tubing, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "biceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/qykwviNOIyc/hqdefault.jpg",
    "videoId": "qykwviNOIyc",
    "videoUrl": "https://www.youtube.com/watch?v=qykwviNOIyc"
  },
  {
    "id": "170ad3b7-bc2c-4d4f-8a84-903f071b26b9",
    "name": "Dumbbell Preacher Curl",
    "slug": "dumbbell-preacher-curl-0105",
    "description": "Step 1: Setup Sit on a preacher bench with your upper arms resting on the pad, holding a dumbbell in one hand with an underhand grip.\n\nStep 2: Brace/Position Keep your back straight and feet flat on the ground, ensuring your elbows are positioned at the edge of the pad.\n\nStep 3: Execute Curl the dumbbell upward towards your shoulder by flexing your elbow, squeezing your bicep at the top of the movement.\n\nStep 4: Return/Repeat Lower the dumbbell back to the starting position in a controlled manner, fully extending your arm before repeating the movement.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "biceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/t2BmBSmcjco/hqdefault.jpg",
    "videoId": "t2BmBSmcjco",
    "videoUrl": "https://www.youtube.com/watch?v=t2BmBSmcjco"
  },
  {
    "id": "857a5c69-193b-46cd-8c8a-d37c8114dfb6",
    "name": "Reverse Lunge To Single Arm Row",
    "slug": "reverse-lunge-to-single-arm-row-0207",
    "description": "Step 1: Setup Stand with feet hip-width apart, holding a dumbbell in your right hand with your arm fully extended at your side.\n\nStep 2: Brace/Position Engage your core and step back with your left foot into a lunge, lowering your body until your right thigh is parallel to the ground and your left knee is close to the floor.\n\nStep 3: Execute As you push through your right heel to return to standing, simultaneously pull the dumbbell towards your ribcage, keeping your elbow close to your body.\n\nStep 4: Return/Repeat Lower the dumbbell back to the starting position and step back into the lunge again, alternating sides with each repetition.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "biceps",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/lKhZvT_NkOs/hqdefault.jpg",
    "videoId": "erYh7wR3P2Y",
    "videoUrl": "https://www.youtube.com/watch?v=erYh7wR3P2Y"
  },
  {
    "id": "44574460-a398-49b6-a943-7a4464b1664f",
    "name": "Reverse Lunge To Single Arm Row",
    "slug": "reverse-lunge-to-single-arm-row-0206",
    "description": "Step 1: Setup Stand with feet hip-width apart, holding a dumbbell in your right hand with your arm extended down by your side.\n\nStep 2: Brace/Position Engage your core, step back with your left foot into a lunge, ensuring your right knee stays aligned over your right ankle while your left knee hovers just above the ground.\n\nStep 3: Execute As you lower into the lunge, pull the dumbbell towards your hip with your right arm, squeezing your shoulder blade at the top of the movement.\n\nStep 4: Return/Repeat Push through your right heel to return to the starting position, lowering the dumbbell back to your side, and repeat for the desired number of repetitions before switching arms.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "biceps",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/lKhZvT_NkOs/hqdefault.jpg",
    "videoId": "erYh7wR3P2Y",
    "videoUrl": "https://www.youtube.com/watch?v=erYh7wR3P2Y"
  },
  {
    "id": "a5e198f2-6604-407d-85f1-d99fb5fc4a4b",
    "name": "Incline Barbell Bench Press",
    "slug": "incline-barbell-bench-press",
    "description": "Step 1: Lie supine on your back with neutral spine on an incline bench with your feet straight and flat on the floor. Draw in and brace the abs and lock the shoulders blades back and down on the bench. Grasp the barbell at about 1.5 - 2x shoulder width ensuring the hands are evenly distributed on the bar.\n\nStep 2: Unrack the bar (always use a spotter if you are able) bringing it directly above the shoulders.\n\nStep 3: Starting with arms extended, slowly lower the bar toward the chest moving through the maximum comfortable range.\n\nStep 4: Reverse the pattern and return the starting position. Repeat. Maintain posture throughout. Do not arch the back or jut the head forward. Avoid letting the shoulders round, posture shift or feet lift in the air. Keep the elbows under the bar to maintain balance at all times.",
    "coachingCues": [],
    "primaryEquipment": [
      "Bench",
      "Barbell",
      "Plates",
      "Safety Collars"
    ],
    "muscleGroups": [
      "chest",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/BjGLs6KGWUc/hqdefault.jpg",
    "videoId": "BjGLs6KGWUc",
    "videoUrl": "https://www.youtube.com/watch?v=BjGLs6KGWUc"
  },
  {
    "id": "acbe3a5a-a5e6-4459-b52d-750da4b933fe",
    "name": "Static Upper Trapezius Stretch",
    "slug": "static-upper-trapezius-stretch-0266",
    "description": "Step 1: Setup Sit or stand in a comfortable position with your back straight and shoulders relaxed.\n\nStep 2: Brace/Position Gently tilt your head to one side, bringing your ear toward your shoulder while keeping your opposite shoulder down.\n\nStep 3: Execute Hold the stretch for 15-30 seconds, feeling the stretch along the side of your neck and upper trapezius.\n\nStep 4: Return/Repeat Slowly return your head to the neutral position and repeat on the other side.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "shoulders"
    ],
    "imageUrl": "https://img.youtube.com/vi/RNTlUaKeuXE/hqdefault.jpg",
    "videoId": "RNTlUaKeuXE",
    "videoUrl": "https://www.youtube.com/watch?v=RNTlUaKeuXE"
  },
  {
    "id": "f0a8771d-b130-4c45-a71e-2c1a3426ecb8",
    "name": "Static Latissimus Dorsi Ball Stretch",
    "slug": "static-latissimus-dorsi-ball-stretch",
    "description": "Step 1: Get into quadruped (on all fours) position with hands under shoulders and knees under hips. Draw in the abs and press away from the floor with with the hands to stabilize the shoulder blades.\n\nStep 2: Position one forearm on the physioball with thumb pointing upward.\n\nStep 3: Slowly roll the ball forward/away from the body until a stretch is felt in the latissimus. Hold position for 20-30 seconds.\n\nStep 4: Repeat on the other side. Maintain posture throughout. Keep a relaxed breathing pattern. Keep the back slightly rounded. Avoid letting the head fall toward the ground or arching of the lower back.",
    "coachingCues": [],
    "primaryEquipment": [
      "Stability Ball"
    ],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/kEH6jatSVSw/hqdefault.jpg",
    "videoId": "kEH6jatSVSw",
    "videoUrl": "https://www.youtube.com/watch?v=kEH6jatSVSw"
  },
  {
    "id": "af02b7ee-1381-42a4-b3ef-879a93daadd0",
    "name": "Active Kneeling Hip Flexor",
    "slug": "active-kneeling-hip-flexor-0018",
    "description": "Step 1: Setup Begin in a kneeling position with your right knee on the ground and your left foot in front, forming a 90-degree angle at both knees.\n\nStep 2: Brace/Position Engage your core and maintain an upright torso, ensuring your hips are square and facing forward.\n\nStep 3: Execute Shift your weight forward into your left hip while keeping your back straight, feeling a stretch in the right hip flexor.\n\nStep 4: Return/Repeat Slowly return to the starting position and repeat for the desired number of repetitions before switching sides.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/OJ8qQQRxYz8/hqdefault.jpg",
    "videoId": "OJ8qQQRxYz8",
    "videoUrl": "https://www.youtube.com/watch?v=OJ8qQQRxYz8"
  },
  {
    "id": "02dd9ea7-a304-4a1c-bdab-831506013104",
    "name": "Active Kneeling Hip Flexor",
    "slug": "active-kneeling-hip-flexor-0017",
    "description": "Step 1: Setup Begin in a kneeling position with your right knee on the ground and your left foot in front, forming a 90-degree angle at both knees.\n\nStep 2: Brace/Position Engage your core and maintain an upright torso, ensuring your hips are squared forward and your pelvis is tucked slightly under.\n\nStep 3: Execute Shift your weight forward into your left hip, feeling a stretch in the right hip flexor while keeping your back straight and chest lifted.\n\nStep 4: Return/Repeat Slowly return to the starting position and repeat for the desired number of repetitions before switching sides.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/OJ8qQQRxYz8/hqdefault.jpg",
    "videoId": "OJ8qQQRxYz8",
    "videoUrl": "https://www.youtube.com/watch?v=OJ8qQQRxYz8"
  },
  {
    "id": "c8f8bb50-7034-4b0d-b210-7d7d4889c8ce",
    "name": "Self Myofascial Release Smr Lateral Thigh",
    "slug": "self-myofascial-release-smr-lateral-thigh-0229",
    "description": "Step 1: Setup Position a foam roller on the floor and sit beside it with your right hip against the roller, legs extended straight in front of you.\n\nStep 2: Brace/Position Place your right hand on the floor behind you for support, and stack your left leg on top of your right leg, keeping your body in a straight line.\n\nStep 3: Execute Slowly roll the foam roller from your hip down to your knee, applying pressure to the lateral thigh, and pause on any tight spots for 15-30 seconds.\n\nStep 4: Return/Repeat After completing the roll, return to the starting position and switch to the left side to repeat the process.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/-Y1ubl6amUg/hqdefault.jpg",
    "videoId": "-Y1ubl6amUg",
    "videoUrl": "https://www.youtube.com/watch?v=-Y1ubl6amUg"
  },
  {
    "id": "e39101a7-a260-4b5a-8f9d-440409fc1259",
    "name": "Self Myofascial Release Smr Lateral Thigh",
    "slug": "self-myofascial-release-smr-lateral-thigh-0228",
    "description": "Step 1: Setup Position a foam roller on the floor and sit beside it with your right side against the roller, legs extended straight out in front of you.\n\nStep 2: Brace/Position Place your right hand on the floor for support and stack your left leg over your right, keeping your body aligned.\n\nStep 3: Execute Slowly roll your body over the foam roller from your hip to your knee, applying pressure to the lateral thigh, and pause on any tight spots for 20-30 seconds.\n\nStep 4: Return/Repeat Shift your body to roll back to the starting position and repeat for 1-2 minutes before switching to the left side.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/-Y1ubl6amUg/hqdefault.jpg",
    "videoId": "-Y1ubl6amUg",
    "videoUrl": "https://www.youtube.com/watch?v=-Y1ubl6amUg"
  },
  {
    "id": "53a83c89-3a82-4dc7-8d7f-da58fa3362f2",
    "name": "Incline Stance Curl To Overhead Press",
    "slug": "incline-stance-curl-to-overhead-press-0129",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a dumbbell in each hand, arms at your sides, and palms facing forward.\n\nStep 2: Brace/Position Engage your core, slightly bend your knees, and lean back against an incline bench, ensuring your back is supported and your elbows are close to your body.\n\nStep 3: Execute Curl the dumbbells up towards your shoulders, rotating your palms to face you at the top of the movement, then press the weights overhead until your arms are fully extended.\n\nStep 4: Return/Repeat Lower the dumbbells back to shoulder level while rotating your palms to face forward, then extend your arms back down to the starting position.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "biceps",
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/OE5ZvGOpGTY/hqdefault.jpg",
    "videoId": "OE5ZvGOpGTY",
    "videoUrl": "https://www.youtube.com/watch?v=OE5ZvGOpGTY"
  },
  {
    "id": "d3a5ab09-ca84-41cc-a5f6-686d0ca8213a",
    "name": "Activation Posterior Tibialis",
    "slug": "activation-posterior-tibialis-0012",
    "description": "Step 1: Setup Stand with your feet hip-width apart, and place a resistance band around the balls of your feet, securing it to a stable object behind you.\n\nStep 2: Brace/Position Keep your knees slightly bent and engage your core, ensuring your back is straight and your shoulders are relaxed.\n\nStep 3: Execute Slowly pull your feet towards your body against the resistance of the band, focusing on activating the muscles along the inside of your lower legs.\n\nStep 4: Return/Repeat Gradually return to the starting position, maintaining control, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves"
    ],
    "imageUrl": "https://img.youtube.com/vi/O1LxD0L9pR4/hqdefault.jpg",
    "videoId": "O1LxD0L9pR4",
    "videoUrl": "https://www.youtube.com/watch?v=O1LxD0L9pR4"
  },
  {
    "id": "37a3355d-b67e-4fc1-b578-ef3c51a70a1f",
    "name": "Activation Posterior Tibialis",
    "slug": "activation-posterior-tibialis-0013",
    "description": "Step 1: Setup Stand with your feet hip-width apart, and place a resistance band around your forefoot, securing the other end to a stable object behind you.\n\nStep 2: Brace/Position Shift your weight slightly onto your heels and maintain a slight bend in your knees, keeping your core engaged and your back straight.\n\nStep 3: Execute Slowly pull your foot back against the resistance of the band, focusing on activating your posterior tibialis by drawing your toes towards your shin while keeping your heel grounded.\n\nStep 4: Return/Repeat Gradually return your foot to the starting position and repeat for the desired number of repetitions, ensuring controlled movement throughout.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves"
    ],
    "imageUrl": "https://img.youtube.com/vi/O1LxD0L9pR4/hqdefault.jpg",
    "videoId": "O1LxD0L9pR4",
    "videoUrl": "https://www.youtube.com/watch?v=O1LxD0L9pR4"
  },
  {
    "id": "193fd9f5-3d76-4c9f-81be-e0be75ff374a",
    "name": "Activation Medial Hamstring",
    "slug": "activation-medial-hamstring-0011",
    "description": "Step 1: Setup Stand with your feet hip-width apart and knees slightly bent, ensuring your weight is evenly distributed on both feet.\n\nStep 2: Brace/Position Engage your core and hinge at the hips, lowering your torso while keeping your back straight and chest up.\n\nStep 3: Execute Extend one leg straight back, keeping it in line with your torso, and flex the foot to activate the medial hamstring.\n\nStep 4: Return/Repeat Return the leg to the starting position and alternate legs, performing the movement for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/ksd36rrxgtE/hqdefault.jpg",
    "videoId": "ksd36rrxgtE",
    "videoUrl": "https://www.youtube.com/watch?v=ksd36rrxgtE"
  },
  {
    "id": "f2c746c2-abc1-4df9-9b97-ae03244774d3",
    "name": "Band Push Up",
    "slug": "band-push-up-0055",
    "description": "Step 1: Setup Anchor a resistance band around your upper back and secure the ends under your palms on the floor.\n\nStep 2: Brace/Position Assume a push-up position with your hands slightly wider than shoulder-width apart, feet together, and body in a straight line from head to heels.\n\nStep 3: Execute Engage your core and lower your body towards the floor by bending your elbows, keeping them at a 45-degree angle to your torso.\n\nStep 4: Return/Repeat Push through your palms to extend your arms and return to the starting position, maintaining tension in the band throughout the movement.",
    "coachingCues": [],
    "primaryEquipment": [
      "Band or Tube"
    ],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/7Xu3D-TKKAw/hqdefault.jpg",
    "videoId": "7Xu3D-TKKAw",
    "videoUrl": "https://www.youtube.com/watch?v=7Xu3D-TKKAw"
  },
  {
    "id": "e4fa58f3-7e1f-45f2-a16b-e6994257dbc1",
    "name": "Assisted Single Leg Squat",
    "slug": "assisted-single-leg-squat-0027",
    "description": "Step 1: Setup Stand facing a sturdy object, such as a bench or wall, and position one foot slightly behind you, resting on the object for support.\n\nStep 2: Brace/Position Engage your core and maintain an upright torso, ensuring your standing foot is flat on the ground and aligned with your knee.\n\nStep 3: Execute Slowly lower your body by bending the standing knee, keeping the other leg elevated and extended behind you, until your thigh is parallel to the ground.\n\nStep 4: Return/Repeat Press through your heel to return to the starting position, then repeat for the desired number of repetitions before switching legs.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/PkToneYECnY/hqdefault.jpg",
    "videoId": "PkToneYECnY",
    "videoUrl": "https://www.youtube.com/watch?v=PkToneYECnY"
  },
  {
    "id": "74ff6344-0f53-4e36-8ba1-e3647c928db8",
    "name": "Active Supine Biceps Femoris",
    "slug": "active-supine-biceps-femoris-0026",
    "description": "Step 1: Setup Lie on your back on a flat surface with your legs extended and feet hip-width apart.\n\nStep 2: Brace/Position Engage your core and press your lower back into the surface while keeping your arms at your sides, palms facing down.\n\nStep 3: Execute Flex your right knee, bringing your heel towards your glutes while keeping your left leg straight and engaged.\n\nStep 4: Return/Repeat Slowly lower your right foot back to the starting position and repeat for the desired number of repetitions before switching to the left leg.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/A3fmhDWoSm0/hqdefault.jpg",
    "videoId": "A3fmhDWoSm0",
    "videoUrl": "https://www.youtube.com/watch?v=A3fmhDWoSm0"
  },
  {
    "id": "6039f75b-f39f-4ced-8e20-8236a9a6e962",
    "name": "Active Supine Biceps Femoris",
    "slug": "active-supine-biceps-femoris-0025",
    "description": "Step 1: Setup Lie on your back on a flat surface with your legs extended straight and arms at your sides.\n\nStep 2: Brace/Position Engage your core and press your lower back into the floor while keeping your legs together and straight.\n\nStep 3: Execute Flex your right knee to bring your heel towards your glutes, maintaining tension in your hamstring, then extend your leg back to the starting position.\n\nStep 4: Return/Repeat Perform the movement for the desired repetitions, then switch to the left leg and repeat.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/A3fmhDWoSm0/hqdefault.jpg",
    "videoId": "A3fmhDWoSm0",
    "videoUrl": "https://www.youtube.com/watch?v=A3fmhDWoSm0"
  },
  {
    "id": "5156b6c9-9102-4aa7-93ad-b9854184c683",
    "name": "Active Lat Ball",
    "slug": "active-lat-ball-0019",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a stability ball with both hands at chest level, arms extended forward.\n\nStep 2: Brace/Position Engage your core, slightly bend your knees, and maintain a neutral spine as you position the ball directly in front of your body.\n\nStep 3: Execute Press the ball outward by extending your arms while simultaneously engaging your lats, keeping your elbows slightly bent throughout the movement.\n\nStep 4: Return/Repeat Slowly retract the ball back to the starting position at chest level, maintaining control and tension in your lats, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/w_mDsWxtVng/hqdefault.jpg",
    "videoId": "w_mDsWxtVng",
    "videoUrl": "https://www.youtube.com/watch?v=w_mDsWxtVng"
  },
  {
    "id": "e121c48d-c135-4e3a-aa8c-812321ee7397",
    "name": "Active Lat Ball",
    "slug": "active-lat-ball-0020",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a stability ball with both hands at chest level, arms extended forward.\n\nStep 2: Brace/Position Engage your core, slightly bend your knees, and ensure your back is straight while keeping the ball at chest height.\n\nStep 3: Execute Rotate your torso to one side, allowing the ball to move with you, while keeping your hips facing forward.\n\nStep 4: Return/Repeat Return to the center and then rotate to the opposite side, continuing to alternate sides for the desired repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/w_mDsWxtVng/hqdefault.jpg",
    "videoId": "w_mDsWxtVng",
    "videoUrl": "https://www.youtube.com/watch?v=w_mDsWxtVng"
  },
  {
    "id": "00a4d0a1-6574-4e52-9411-26b0f9d40e2e",
    "name": "Kettlebell Goblet Squat",
    "slug": "kettlebell-goblet-squat-0137",
    "description": "Step 1: Setup Hold a kettlebell by the horns close to your chest, with your elbows pointing down and feet shoulder-width apart.\n\nStep 2: Brace/Position Engage your core, keep your chest up, and maintain a neutral spine while standing tall.\n\nStep 3: Execute Initiate the squat by bending at the hips and knees, lowering your body until your thighs are parallel to the ground, keeping the kettlebell close to your chest.\n\nStep 4: Return/Repeat Push through your heels to return to the starting position, fully extending your hips and knees, then repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Kettlebell"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/MWHIs0zxkCU/hqdefault.jpg",
    "videoId": "MWHIs0zxkCU",
    "videoUrl": "https://www.youtube.com/watch?v=MWHIs0zxkCU"
  },
  {
    "id": "66a31fc6-12e0-478a-ac80-5c9259ce8c42",
    "name": "Kettlebell Goblet Squat",
    "slug": "kettlebell-goblet-squat-0138",
    "description": "Step 1: Setup Hold a kettlebell by the handles with both hands, positioning it close to your chest, elbows pointing down. Stand with your feet shoulder-width apart and toes slightly turned out.\n\nStep 2: Brace/Position Engage your core, keeping your chest up and shoulders back. Ensure your weight is distributed evenly across your feet.\n\nStep 3: Execute Initiate the squat by bending at the hips and knees, lowering your body until your thighs are parallel to the ground while keeping the kettlebell close to your chest.\n\nStep 4: Return/Repeat Push through your heels to return to the starting position, fully extending your hips and knees. Repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Kettlebell"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/MWHIs0zxkCU/hqdefault.jpg",
    "videoId": "MWHIs0zxkCU",
    "videoUrl": "https://www.youtube.com/watch?v=MWHIs0zxkCU"
  },
  {
    "id": "b0500001-0000-4000-8000-000000000001",
    "name": "BOSU Plank",
    "slug": "bosu-plank",
    "description": "Step 1: Setup Place the BOSU Balance Trainer dome-side up on a non-slip floor mat. Kneel in front of the dome and rest your forearms directly across the center crown of the dome, elbows bent 90 degrees directly beneath your shoulders.\n\nStep 2: Brace/Position Step your feet back into a full plank position, feet hip-width apart. Engage your glutes, draw your navel toward your spine, and establish a neutral pelvic tilt.\n\nStep 3: Execute Maintain a rigid isometric bridge line from occiput to heels. Press your forearms actively into the dome to prevent scapular winging, resisting the micro-oscillations of the air bladder.\n\nStep 4: Return/Repeat Hold with steady diaphragmatic breathing for the prescribed duration (20-60 seconds) without allowing hips to sag or hike.",
    "coachingCues": [],
    "primaryEquipment": [
      "BOSU Balance Trainer"
    ],
    "muscleGroups": [
      "core",
      "abdominals",
      "shoulders"
    ],
    "imageUrl": "https://img.youtube.com/vi/C_NM5IbRlqM/hqdefault.jpg",
    "videoId": "C_NM5IbRlqM",
    "videoUrl": "https://www.youtube.com/watch?v=C_NM5IbRlqM"
  },
  {
    "id": "9e85d35f-9712-4aae-9700-9e8af607dfc1",
    "name": "Plank With Knees Down",
    "slug": "plank-with-knees-down-0082",
    "description": "Step 1: Setup Begin in a kneeling position on a mat, with your hands placed directly under your shoulders and your knees hip-width apart.\n\nStep 2: Brace/Position Engage your core by pulling your belly button towards your spine and maintain a neutral spine position, keeping your head aligned with your back.\n\nStep 3: Execute Slowly extend your body forward, lifting your torso while keeping your knees on the ground, forming a straight line from your head to your knees.\n\nStep 4: Return/Repeat Hold the plank position for the desired duration, then gently lower your torso back to the starting position and repeat.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/Q2MbIzmkcho/hqdefault.jpg",
    "videoId": "Q2MbIzmkcho",
    "videoUrl": "https://www.youtube.com/watch?v=Q2MbIzmkcho"
  },
  {
    "id": "940fb12b-9c10-4182-a5f3-cd3e0cb94e1c",
    "name": "Single Leg Throw And Catch Transverse 2",
    "slug": "single-leg-throw-and-catch-transverse-2-0040",
    "description": "Step 1: Setup Stand on one leg with a slight bend in the knee, holding a medicine ball at chest level with both hands.\n\nStep 2: Brace/Position Engage your core, maintaining a straight posture, and position your free leg slightly behind you for balance.\n\nStep 3: Execute Rotate your torso towards the side of your standing leg and throw the medicine ball against a wall or to a partner, focusing on a controlled, powerful movement.\n\nStep 4: Return/Repeat Catch the ball as it rebounds, return to the starting position, and repeat for the desired number of repetitions before switching legs.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes"
    ],
    "imageUrl": "https://img.youtube.com/vi/-zKoJj4nJ9k/hqdefault.jpg",
    "videoId": "-zKoJj4nJ9k",
    "videoUrl": "https://www.youtube.com/watch?v=-zKoJj4nJ9k"
  },
  {
    "id": "4fbd7757-c680-4f4d-a1ac-f2d3e9e2e808",
    "name": "Single Leg Balance Reach Transverse",
    "slug": "single-leg-balance-reach-transverse-0035",
    "description": "Step 1: Setup Stand on your right leg with a slight bend in the knee, keeping your left leg lifted behind you and your arms at your sides.\n\nStep 2: Brace/Position Engage your core and maintain an upright posture, ensuring your hips are level and your shoulders are back.\n\nStep 3: Execute Reach your left leg out to the side while bending at the hip and extending your torso forward, keeping your right leg stable and your arms extended in front for balance.\n\nStep 4: Return/Repeat Return to the starting position by driving your left leg back and raising your torso, then repeat for the desired number of repetitions before switching to the left leg.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes"
    ],
    "imageUrl": "https://img.youtube.com/vi/V8n50DGrxfI/hqdefault.jpg",
    "videoId": "V8n50DGrxfI",
    "videoUrl": "https://www.youtube.com/watch?v=V8n50DGrxfI"
  },
  {
    "id": "33217f7c-b817-4775-a164-ccf5075e177a",
    "name": "Single Leg Balance Reach Transverse",
    "slug": "single-leg-balance-reach-transverse-0034",
    "description": "Step 1: Setup Stand on your right leg with a slight bend in the knee, keeping your left leg lifted behind you and your arms at your sides.\n\nStep 2: Brace/Position Engage your core and maintain an upright posture, ensuring your hips are level and your shoulders are relaxed.\n\nStep 3: Execute Slowly reach your left leg out to the side while extending your left arm towards the left, maintaining balance on your right leg.\n\nStep 4: Return/Repeat Return to the starting position by bringing your left leg and arm back to the center, then repeat for the desired number of repetitions before switching to the left leg.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes"
    ],
    "imageUrl": "https://img.youtube.com/vi/V8n50DGrxfI/hqdefault.jpg",
    "videoId": "V8n50DGrxfI",
    "videoUrl": "https://www.youtube.com/watch?v=V8n50DGrxfI"
  },
  {
    "id": "56d3cd35-3c3f-4c4b-a92f-370739627b57",
    "name": "Single Leg Lift And Chop",
    "slug": "single-leg-lift-and-chop-0030",
    "description": "Step 1: Setup Stand on your right leg with your left knee lifted to hip height, holding a medicine ball or weight with both hands at your chest.\n\nStep 2: Brace/Position Engage your core and maintain a straight posture, keeping your shoulders back and down.\n\nStep 3: Execute Rotate your torso to the left while extending your left leg out to the side, simultaneously bringing the weight down towards your left foot in a controlled motion.\n\nStep 4: Return/Repeat Reverse the movement by bringing the weight back to your chest while lifting your left leg back to hip height; repeat for the desired number of repetitions before switching legs.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/YGU8ONAmjIE/hqdefault.jpg",
    "videoId": "YGU8ONAmjIE",
    "videoUrl": "https://www.youtube.com/watch?v=YGU8ONAmjIE"
  },
  {
    "id": "c888910c-7f42-4a0b-b02b-833c6f9fe77c",
    "name": "Single Leg Lift And Chop",
    "slug": "single-leg-lift-and-chop-0029",
    "description": "Step 1: Setup Stand on your right leg with a slight bend in the knee, holding a weight or medicine ball in both hands at chest level.\n\nStep 2: Brace/Position Engage your core and maintain a straight posture, ensuring your left leg is extended behind you and your arms are ready to move.\n\nStep 3: Execute Rotate your torso to the right while simultaneously lifting your left leg and bringing the weight down towards your right foot in a chopping motion.\n\nStep 4: Return/Repeat Return to the starting position and repeat for the desired number of repetitions before switching to the left leg.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/YGU8ONAmjIE/hqdefault.jpg",
    "videoId": "YGU8ONAmjIE",
    "videoUrl": "https://www.youtube.com/watch?v=YGU8ONAmjIE"
  },
  {
    "id": "b0500001-0000-4000-8000-000000000002",
    "name": "BOSU Push-Up",
    "slug": "bosu-push-up",
    "description": "Step 1: Setup Invert the BOSU Balance Trainer platform-side up (dome on floor). Grasp the outer perimeter handles or platform rim with both hands in a neutral grip, wrists straight.\n\nStep 2: Brace/Position Step feet back into high push-up plank stance, balls of feet anchored, core fully braced, and glutes clamped.\n\nStep 3: Execute Lower your chest toward the center of the platform under a controlled 4-second eccentric count, keeping elbows tucked at 45 degrees and maintaining platform stability.\n\nStep 4: Return/Repeat Press through both palms explosively to full elbow lockout without allowing the platform to wobble, and repeat for prescribed repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "BOSU Balance Trainer"
    ],
    "muscleGroups": [
      "chest",
      "triceps",
      "shoulders",
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/Wo3viNH3E1c/hqdefault.jpg",
    "videoId": "Wo3viNH3E1c",
    "videoUrl": "https://www.youtube.com/watch?v=Wo3viNH3E1c"
  },
  {
    "id": "b0500001-0000-4000-8000-000000000003",
    "name": "BOSU Single-Leg Balance Reach",
    "slug": "bosu-single-leg-balance-reach",
    "description": "Step 1: Setup Place the BOSU dome-side up. Stand centered on the dome with your stance foot aligned over the bullseye logo, hands on hips.\n\nStep 2: Brace/Position Lift the non-support leg so the thigh is parallel to the ground, knee bent 90 degrees. Establish single-leg tripod balance through the heel and forefoot.\n\nStep 3: Execute Slowly reach the non-support leg forward in the sagittal plane, then return to center; reach laterally in the frontal plane, and then transversely behind while maintaining level hips.\n\nStep 4: Return/Repeat Complete prescribed multiplanar reaches with a 4-second tempo before alternating to the opposite leg.",
    "coachingCues": [],
    "primaryEquipment": [
      "BOSU Balance Trainer"
    ],
    "muscleGroups": [
      "glutes",
      "calves",
      "core",
      "hamstrings"
    ],
    "imageUrl": "https://img.youtube.com/vi/I4kiGgKpb58/hqdefault.jpg",
    "videoId": "I4kiGgKpb58",
    "videoUrl": "https://www.youtube.com/watch?v=I4kiGgKpb58"
  },
  {
    "id": "58570826-86a5-4d5e-980d-91d15fb346f5",
    "name": "Ball Combo I",
    "slug": "ball-combo-i-0053",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a stability ball with both hands at chest level.\n\nStep 2: Brace/Position Engage your core, slightly bend your knees, and position the ball close to your chest with elbows bent.\n\nStep 3: Execute Press the ball forward while simultaneously extending your arms, then pull it back to your chest in a controlled manner.\n\nStep 4: Return/Repeat Return to the starting position and repeat the pressing and pulling motion for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/xb3-dysLHpE/hqdefault.jpg",
    "videoId": "xb3-dysLHpE",
    "videoUrl": "https://www.youtube.com/watch?v=xb3-dysLHpE"
  },
  {
    "id": "cfd1f1a5-0775-46aa-930a-34fc07083a91",
    "name": "Ball Combo I",
    "slug": "ball-combo-i-0054",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a stability ball at chest level with both hands.\n\nStep 2: Brace/Position Engage your core, keeping your back straight and shoulders relaxed, while positioning the ball close to your chest.\n\nStep 3: Execute Press the ball forward, extending your arms fully while simultaneously squatting down into a low position, keeping your knees behind your toes.\n\nStep 4: Return/Repeat Reverse the movement by pulling the ball back to your chest as you rise back to standing, then repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/xb3-dysLHpE/hqdefault.jpg",
    "videoId": "xb3-dysLHpE",
    "videoUrl": "https://www.youtube.com/watch?v=xb3-dysLHpE"
  },
  {
    "id": "5a25ec16-625e-4b5f-bd74-f69910f4ac6e",
    "name": "Step Up To Balance Frontal Curl To Overhead Press",
    "slug": "step-up-to-balance-frontal-curl-to-overhead-press-0048",
    "description": "Step 1: Setup Stand in front of a sturdy step or platform with your feet hip-width apart, holding a dumbbell in each hand at your sides.\n\nStep 2: Brace/Position Step up onto the platform with your right foot, ensuring your knee is aligned over your ankle, and curl the dumbbells to shoulder height as you balance on your right leg.\n\nStep 3: Execute Press the dumbbells overhead while maintaining your balance on the right leg, engaging your core and keeping your back straight.\n\nStep 4: Return/Repeat Lower the dumbbells back to shoulder height, step down with your right foot, and repeat the movement on the left leg.",
    "coachingCues": [],
    "primaryEquipment": [
      "Box or Step"
    ],
    "muscleGroups": [
      "biceps",
      "core",
      "glutes",
      "hamstrings",
      "quadriceps",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/gjigcqa_ufo/hqdefault.jpg",
    "videoId": "gjigcqa_ufo",
    "videoUrl": "https://www.youtube.com/watch?v=gjigcqa_ufo"
  },
  {
    "id": "657cc99c-9dfb-41c9-9f72-d2d10c857aba",
    "name": "Step Up To Balance Frontal Curl To Overhead Press",
    "slug": "step-up-to-balance-frontal-curl-to-overhead-press-0047",
    "description": "Step 1: Setup Stand in front of a sturdy step or platform with feet hip-width apart and a dumbbell in each hand at your sides.\n\nStep 2: Brace/Position Engage your core, step up with your right foot onto the platform, and balance on your right leg while curling the dumbbells to shoulder height.\n\nStep 3: Execute Press the dumbbells overhead while maintaining your balance on the right leg, ensuring your arms are fully extended without locking the elbows.\n\nStep 4: Return/Repeat Lower the dumbbells back to shoulder height, step down with your right foot, and repeat the movement on the left leg.",
    "coachingCues": [],
    "primaryEquipment": [
      "Box or Step"
    ],
    "muscleGroups": [
      "biceps",
      "core",
      "glutes",
      "hamstrings",
      "quadriceps",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/gjigcqa_ufo/hqdefault.jpg",
    "videoId": "gjigcqa_ufo",
    "videoUrl": "https://www.youtube.com/watch?v=gjigcqa_ufo"
  },
  {
    "id": "b0500001-0000-4000-8000-000000000004",
    "name": "BOSU Glute Bridge",
    "slug": "bosu-glute-bridge",
    "description": "Step 1: Setup Lie supine on the floor with knees bent, arms resting by your sides, and heels positioned firmly on top of the dome apex of the BOSU Balance Trainer.\n\nStep 2: Brace/Position Draw in your abdominal wall, brace your core, and set your pelvis in neutral alignment.\n\nStep 3: Execute Drive through your heels into the dome to extend hips toward the ceiling until your body forms a straight line from knees through hips to shoulders.\n\nStep 4: Return/Repeat Hold glute contraction at top for 2 seconds, then slowly lower hips under a 4-second eccentric descent without fully unloading at the bottom.",
    "coachingCues": [],
    "primaryEquipment": [
      "BOSU Balance Trainer"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/d28NVu5bQPk/hqdefault.jpg",
    "videoId": "d28NVu5bQPk",
    "videoUrl": "https://www.youtube.com/watch?v=d28NVu5bQPk"
  },
  {
    "id": "b0500001-0000-4000-8000-000000000005",
    "name": "BOSU Bird-Dog",
    "slug": "bosu-bird-dog",
    "description": "Step 1: Setup Place the BOSU dome-side up. Position your knees on the center of the dome and your hands on the floor directly under your shoulders in a quadruped stance.\n\nStep 2: Brace/Position Engage your transverse abdominis, lock your pelvis level, and draw your shoulder blades back and down.\n\nStep 3: Execute Simultaneously raise your right arm straight forward and your left leg straight back until parallel to the floor, resisting rotational torque from the dome.\n\nStep 4: Return/Repeat Pause for 2 seconds at full extension, return to the dome under control, and alternate contralateral sides for prescribed reps.",
    "coachingCues": [],
    "primaryEquipment": [
      "BOSU Balance Trainer"
    ],
    "muscleGroups": [
      "core",
      "glutes",
      "back",
      "shoulders"
    ],
    "imageUrl": "https://img.youtube.com/vi/w75gGKGNsY0/hqdefault.jpg",
    "videoId": "w75gGKGNsY0",
    "videoUrl": "https://www.youtube.com/watch?v=w75gGKGNsY0"
  },
  {
    "id": "b0500001-0000-4000-8000-000000000006",
    "name": "BOSU Dome Squat",
    "slug": "bosu-dome-squat",
    "description": "Step 1: Setup Place the BOSU dome-side up. Step onto the dome with both feet hip-to-shoulder width apart, toes angled slightly outward, knees softly unlocked.\n\nStep 2: Brace/Position Find your center of mass over the dome, brace your core, keep your chest high, and extend arms forward for counter-balance.\n\nStep 3: Execute Hinge at the hips and bend knees to squat down to parallel under a strict 4-second eccentric tempo, keeping weight evenly distributed across both feet.\n\nStep 4: Return/Repeat Drive through midfoot and heels to return to standing position, extending hips and squeezing glutes at top without hyperextending knees.",
    "coachingCues": [],
    "primaryEquipment": [
      "BOSU Balance Trainer"
    ],
    "muscleGroups": [
      "quadriceps",
      "glutes",
      "hamstrings",
      "calves",
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/evJOL2cdmt4/hqdefault.jpg",
    "videoId": "evJOL2cdmt4",
    "videoUrl": "https://www.youtube.com/watch?v=evJOL2cdmt4"
  },
  {
    "id": "93cad0bc-b091-421a-bcce-493bc90b8ba9",
    "name": "Clamshells",
    "slug": "clamshells-0067",
    "description": "Step 1: Setup Lie on your side with your legs stacked, knees bent at a 90-degree angle, and feet together.\n\nStep 2: Brace/Position Engage your core and keep your hips stacked to maintain proper alignment throughout the movement.\n\nStep 3: Execute Lift your top knee away from the bottom knee while keeping your feet together, focusing on activating the gluteus medius.\n\nStep 4: Return/Repeat Lower your top knee back to the starting position and repeat for the desired number of repetitions before switching sides.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "legs"
    ],
    "imageUrl": "https://img.youtube.com/vi/V_AnVxKPFlY/hqdefault.jpg",
    "videoId": "V_AnVxKPFlY",
    "videoUrl": "https://www.youtube.com/watch?v=V_AnVxKPFlY"
  },
  {
    "id": "0139add0-cf3c-45b9-93f5-09ee04ffc4fb",
    "name": "Clamshells",
    "slug": "clamshells-0068",
    "description": "Step 1: Setup Lie on your side with your legs stacked, knees bent at a 90-degree angle, and feet together.\n\nStep 2: Brace/Position Engage your core and ensure your hips are aligned, keeping your head resting on your lower arm or a pillow for support.\n\nStep 3: Execute Keeping your feet together, lift your top knee upward while keeping your hips stable and avoiding rotation.\n\nStep 4: Return/Repeat Lower your top knee back to the starting position and repeat for the desired number of repetitions before switching sides.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "legs"
    ],
    "imageUrl": "https://img.youtube.com/vi/V_AnVxKPFlY/hqdefault.jpg",
    "videoId": "V_AnVxKPFlY",
    "videoUrl": "https://www.youtube.com/watch?v=V_AnVxKPFlY"
  },
  {
    "id": "130568a5-44b3-4108-a84b-ab8d2b0c4cab",
    "name": "Static Levator Scapulae Stretch",
    "slug": "static-levator-scapulae-stretch-0255",
    "description": "Step 1: Setup Sit or stand with your back straight and shoulders relaxed.\n\nStep 2: Brace/Position Tilt your head to one side, bringing your ear toward your shoulder while keeping the opposite shoulder down.\n\nStep 3: Execute Gently pull your head further toward your shoulder with your hand, feeling a stretch along the side of your neck.\n\nStep 4: Return/Repeat Hold the stretch for 15-30 seconds, then switch sides and repeat.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/U-rAhZajTLs/hqdefault.jpg",
    "videoId": "U-rAhZajTLs",
    "videoUrl": "https://www.youtube.com/watch?v=U-rAhZajTLs"
  },
  {
    "id": "af79b829-81b4-43bc-8122-8d12964c3cc6",
    "name": "Box Squat Curl To Overhead Press",
    "slug": "box-squat-curl-to-overhead-press-0066",
    "description": "Step 1: Setup Stand with feet shoulder-width apart, holding a dumbbell in each hand at your sides, and position a sturdy box behind you.\n\nStep 2: Brace/Position Engage your core, hinge at the hips, and lower your body into a squat while keeping your chest up and back straight, allowing your thighs to touch the box lightly.\n\nStep 3: Execute Push through your heels to stand back up, simultaneously curling the dumbbells to shoulder height, then press them overhead until your arms are fully extended.\n\nStep 4: Return/Repeat Lower the dumbbells back to shoulder height, then return to the squat position, lightly touching the box before repeating the movement.",
    "coachingCues": [],
    "primaryEquipment": [
      "Box or Step"
    ],
    "muscleGroups": [
      "biceps",
      "glutes",
      "hamstrings",
      "quadriceps",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/ZrOgsfSPpC8/hqdefault.jpg",
    "videoId": "ZrOgsfSPpC8",
    "videoUrl": "https://www.youtube.com/watch?v=ZrOgsfSPpC8"
  },
  {
    "id": "b0500001-0000-4000-8000-000000000007",
    "name": "BOSU Dumbbell Chest Press",
    "slug": "bosu-dumbbell-chest-press",
    "description": "Step 1: Setup Sit on the forward slope of the BOSU dome holding a pair of dumbbells at your chest. Walk your feet out and roll back until your upper back, shoulders, and neck are supported by the dome.\n\nStep 2: Brace/Position Press hips up into a rigid bridge, knees bent 90 degrees, glutes locked, and dumbbells held outside shoulders with forearms vertical.\n\nStep 3: Execute Press dumbbells upward in an arc over your chest until elbows reach full extension without clanging weights together.\n\nStep 4: Return/Repeat Lower dumbbells slowly under a 4-second count to chest level while maintaining full glute bridge stability, and repeat.",
    "coachingCues": [],
    "primaryEquipment": [
      "BOSU Balance Trainer",
      "Dumbbells"
    ],
    "muscleGroups": [
      "chest",
      "triceps",
      "shoulders",
      "glutes",
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/cjTVlA2WwqY/hqdefault.jpg",
    "videoId": "cjTVlA2WwqY",
    "videoUrl": "https://www.youtube.com/watch?v=cjTVlA2WwqY"
  },
  {
    "id": "b0500001-0000-4000-8000-000000000008",
    "name": "BOSU Lunge to Balance",
    "slug": "bosu-lunge-to-balance",
    "description": "Step 1: Setup Place BOSU dome-side up. Stand 2-3 feet behind the dome with feet hip-width apart and hands on hips or at chest.\n\nStep 2: Brace/Position Step forward with your lead foot directly onto the center apex of the dome, sinking into a lunge until both knees reach 90-degree flexion.\n\nStep 3: Execute Push forcefully through the lead heel and step straight back up into a single-leg balance on the trailing leg, holding opposite knee at 90 degrees.\n\nStep 4: Return/Repeat Hold the single-leg balance for 2 seconds before stepping back into the next lunge repetition, completing all reps before switching legs.",
    "coachingCues": [],
    "primaryEquipment": [
      "BOSU Balance Trainer"
    ],
    "muscleGroups": [
      "quadriceps",
      "glutes",
      "hamstrings",
      "calves",
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/BAC6B69Q70A/hqdefault.jpg",
    "videoId": "BAC6B69Q70A",
    "videoUrl": "https://www.youtube.com/watch?v=BAC6B69Q70A"
  },
  {
    "id": "b0500001-0000-4000-8000-000000000009",
    "name": "BOSU Mountain Climbers",
    "slug": "bosu-mountain-climbers",
    "description": "Step 1: Setup Invert the BOSU platform-side up. Grip the handles on the edges of the platform and assume a high plank position.\n\nStep 2: Brace/Position Align shoulders over wrists, draw in abdominal wall, and establish an unbroken spine line.\n\nStep 3: Execute Drive one knee smoothly toward your chest while keeping hips low and the platform stable, then quickly switch legs in a rhythmic running cadence.\n\nStep 4: Return/Repeat Continue alternating knees at a high, controlled tempo for the prescribed time interval (30-45 seconds).",
    "coachingCues": [],
    "primaryEquipment": [
      "BOSU Balance Trainer"
    ],
    "muscleGroups": [
      "core",
      "hip flexors",
      "shoulders",
      "calves"
    ],
    "imageUrl": "https://img.youtube.com/vi/iyZHqgsI4Zk/hqdefault.jpg",
    "videoId": "iyZHqgsI4Zk",
    "videoUrl": "https://www.youtube.com/watch?v=iyZHqgsI4Zk"
  },
  {
    "id": "b0500001-0000-4000-8000-000000000010",
    "name": "BOSU Russian Twist",
    "slug": "bosu-russian-twist",
    "description": "Step 1: Setup Sit on top of the BOSU dome with knees bent and feet flat on the floor in front of you. Lean back slightly until your core engages, holding a V-sit posture.\n\nStep 2: Brace/Position Lift feet 2-4 inches off the floor to balance solely on the dome. Clasp hands together in front of your chest with elbows slightly bent.\n\nStep 3: Execute Rotate your torso to the right, tapping hands near the dome rim, then rotate across to the left under strict rotary control.\n\nStep 4: Return/Repeat Continue alternating rotations smoothly for prescribed repetitions while maintaining V-sit balance on the dome.",
    "coachingCues": [],
    "primaryEquipment": [
      "BOSU Balance Trainer"
    ],
    "muscleGroups": [
      "obliques",
      "abdominals",
      "hip flexors"
    ],
    "imageUrl": "https://img.youtube.com/vi/M2AAcj_K0mg/hqdefault.jpg",
    "videoId": "M2AAcj_K0mg",
    "videoUrl": "https://www.youtube.com/watch?v=M2AAcj_K0mg"
  },
  {
    "id": "b0500001-0000-4000-8000-000000000012",
    "name": "BOSU Burpee with Overhead Press",
    "slug": "bosu-burpee-with-overhead-press",
    "description": "Step 1: Setup Place BOSU platform-side up on floor. Stand behind the platform with feet shoulder-width apart.\n\nStep 2: Brace/Position Squat down and grip the side handles of the platform firmly. Jump feet back into a push-up plank, perform a push-up, and jump feet back in toward hands.\n\nStep 3: Execute Powerfully stand up out of the squat while lifting the BOSU off the floor, pressing it overhead to full arm lockout.\n\nStep 4: Return/Repeat Lower the BOSU back to the floor with control and immediately initiate the next burpee repetition.",
    "coachingCues": [],
    "primaryEquipment": [
      "BOSU Balance Trainer"
    ],
    "muscleGroups": [
      "chest",
      "shoulders",
      "quadriceps",
      "glutes",
      "core",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/RbvEl_XAZU0/hqdefault.jpg",
    "videoId": "RbvEl_XAZU0",
    "videoUrl": "https://www.youtube.com/watch?v=RbvEl_XAZU0"
  },
  {
    "id": "459ac156-1ca4-437f-97c4-77b21b7c04e9",
    "name": "Kettlebell Overhead Press",
    "slug": "kettlebell-overhead-press-0145",
    "description": "Step 1: Setup Stand with feet shoulder-width apart, holding a kettlebell in one hand at shoulder height with your elbow tucked close to your body.\n\nStep 2: Brace/Position Engage your core, keeping your back straight and your shoulder down and back to stabilize your torso.\n\nStep 3: Execute Press the kettlebell overhead in a straight line, fully extending your arm while keeping your wrist neutral and your elbow locked out at the top.\n\nStep 4: Return/Repeat Lower the kettlebell back to shoulder height in a controlled manner, ensuring your core remains engaged, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Kettlebell"
    ],
    "muscleGroups": [
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/X-uFqWtjpGI/hqdefault.jpg",
    "videoId": "X-uFqWtjpGI",
    "videoUrl": "https://www.youtube.com/watch?v=X-uFqWtjpGI"
  },
  {
    "id": "d66dbd06-34d8-4fe3-90b4-d7ef2a4649b3",
    "name": "Ball Crunch Arms Crossed",
    "slug": "ball-crunch-arms-crossed-0072",
    "description": "Step 1: Setup Sit on a stability ball with your feet flat on the floor, hip-width apart, and your knees bent at a 90-degree angle.\n\nStep 2: Brace/Position Cross your arms over your chest, engaging your core, and lean back slightly until your lower back is supported by the ball.\n\nStep 3: Execute Contract your abdominal muscles to lift your upper body towards your thighs, exhaling as you crunch up.\n\nStep 4: Return/Repeat Lower your upper body back to the starting position, maintaining control, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/5DKvQPbSHUg/hqdefault.jpg",
    "videoId": "5DKvQPbSHUg",
    "videoUrl": "https://www.youtube.com/watch?v=5DKvQPbSHUg"
  },
  {
    "id": "89d65a69-d8c5-41a7-a0ae-574f3edc3b98",
    "name": "Half Kneeling Tubing Rotation",
    "slug": "half-kneeling-tubing-rotation-0079",
    "description": "Step 1: Setup Position your right knee on the ground with your left foot flat on the floor in front of you, securing one end of the resistance tubing to a stable anchor at waist height on your right side.\n\nStep 2: Brace/Position Engage your core and maintain a neutral spine while holding the other end of the tubing with both hands, arms extended in front of you at chest height.\n\nStep 3: Execute Rotate your torso to the left, pulling the tubing across your body while keeping your hips stable and your knees aligned.\n\nStep 4: Return/Repeat Slowly return to the starting position, then repeat for the desired number of repetitions before switching sides.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/CnF9Bf2pm4s/hqdefault.jpg",
    "videoId": "CnF9Bf2pm4s",
    "videoUrl": "https://www.youtube.com/watch?v=CnF9Bf2pm4s"
  },
  {
    "id": "b365b929-a17a-403c-bd05-f99b8f2f760a",
    "name": "Half Kneeling Tubing Rotation",
    "slug": "half-kneeling-tubing-rotation-0078",
    "description": "Step 1: Setup Anchor a resistance band at waist height and kneel on one knee, positioning the opposite foot flat on the ground in front of you.\n\nStep 2: Brace/Position Engage your core, maintain a neutral spine, and grasp the band with both hands, keeping your elbows slightly bent and arms extended in front of you.\n\nStep 3: Execute Rotate your torso away from the anchor point while keeping your hips stable, pulling the band across your body until your hands are in line with your shoulder.\n\nStep 4: Return/Repeat Slowly return to the starting position, maintaining control, and repeat for the desired number of repetitions before switching sides.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/CnF9Bf2pm4s/hqdefault.jpg",
    "videoId": "CnF9Bf2pm4s",
    "videoUrl": "https://www.youtube.com/watch?v=CnF9Bf2pm4s"
  },
  {
    "id": "c2ec473a-a4ef-4419-b69b-9621e07dca6f",
    "name": "Single Leg Romanian Deadlift To Pnf Pattern 1",
    "slug": "single-leg-romanian-deadlift-to-pnf-pattern-1-0221",
    "description": "Step 1: Setup Stand on your right leg with a slight bend in the knee, holding a dumbbell in your left hand, and engage your core.\n\nStep 2: Brace/Position Hinge at the hips while extending your left leg straight back, keeping your back flat and lowering the dumbbell toward the ground.\n\nStep 3: Execute Once you reach the bottom of the movement, rotate your torso to the left and lift the dumbbell diagonally across your body, engaging your core and glutes.\n\nStep 4: Return/Repeat Lower the dumbbell back down to the starting position, return to the single-leg stance, and repeat for the desired number of repetitions before switching legs.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "core",
      "glutes",
      "hamstrings"
    ],
    "imageUrl": "https://img.youtube.com/vi/ZmI4DRACNTg/hqdefault.jpg",
    "videoId": "ZmI4DRACNTg",
    "videoUrl": "https://www.youtube.com/watch?v=ZmI4DRACNTg"
  },
  {
    "id": "d1445efb-b5df-415c-b8a9-933b11a68620",
    "name": "Push Press",
    "slug": "push-press-0063",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a barbell at shoulder height with an overhand grip, elbows slightly in front of the bar.\n\nStep 2: Brace/Position Engage your core, keep your chest up, and maintain a neutral spine while positioning your feet firmly on the ground.\n\nStep 3: Execute Press the barbell overhead by extending your arms while simultaneously driving through your legs, using a slight dip in your knees for momentum.\n\nStep 4: Return/Repeat Lower the barbell back to shoulder height in a controlled manner, ensuring your elbows remain in front of the bar before repeating the movement.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/ODwyDtlXnXk/hqdefault.jpg",
    "videoId": "ODwyDtlXnXk",
    "videoUrl": "https://www.youtube.com/watch?v=ODwyDtlXnXk"
  },
  {
    "id": "d0973d9c-d32e-4f99-9171-41f102785498",
    "name": "Dumbbell Bent Over Extention",
    "slug": "dumbbell-bent-over-extention-0095",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a dumbbell in each hand, palms facing your body.\n\nStep 2: Brace/Position Hinge at your hips, bending your knees slightly, and lower your torso until it's nearly parallel to the ground, keeping your back flat and core engaged.\n\nStep 3: Execute With a controlled motion, extend your arms straight back, squeezing your shoulder blades together at the top of the movement.\n\nStep 4: Return/Repeat Lower the dumbbells back to the starting position, maintaining control, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/sTkMVkTwcSk/hqdefault.jpg",
    "videoId": "sTkMVkTwcSk",
    "videoUrl": "https://www.youtube.com/watch?v=sTkMVkTwcSk"
  },
  {
    "id": "71f66836-2bf6-4039-bb2b-2949e8c93498",
    "name": "Dumbbell Bench Press",
    "slug": "dumbbell-bench-press-0094",
    "description": "Step 1: Setup Lie on a flat bench with a dumbbell in each hand, arms fully extended above your chest, and feet flat on the floor.\n\nStep 2: Brace/Position Engage your core and retract your shoulder blades, ensuring your back remains flat against the bench.\n\nStep 3: Execute Lower the dumbbells slowly to the sides of your chest, keeping your elbows at a 45-degree angle to your torso.\n\nStep 4: Return/Repeat Press the dumbbells back up to the starting position, fully extending your arms while maintaining control throughout the movement.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells",
      "Bench"
    ],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/4_QuyfOCI5U/hqdefault.jpg",
    "videoId": "4_QuyfOCI5U",
    "videoUrl": "https://www.youtube.com/watch?v=4_QuyfOCI5U"
  },
  {
    "id": "b0500002-0000-4000-8000-000000000008",
    "name": "Stability Ball Back Extension with Rotation",
    "slug": "stability-ball-back-extension",
    "description": "Step 1: Setup Position anterior pelvis and thighs over ball, feet anchored firmly against base of wall or floor.\n\nStep 2: Brace/Position Cross arms over chest or place fingertips by ears, draping upper torso forward over ball.\n\nStep 3: Execute Extend spine to neutral alignment, then smoothly rotate torso 15-20 degrees to one side by contracting obliques.\n\nStep 4: Return/Repeat Rotate back to center, lower torso over ball curve, and alternate rotation on subsequent repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Stability Ball"
    ],
    "muscleGroups": [
      "erector spinae",
      "internal obliques",
      "external obliques",
      "multifidus"
    ],
    "imageUrl": "https://img.youtube.com/vi/b_Iri5nayDk/hqdefault.jpg",
    "videoId": "b_Iri5nayDk",
    "videoUrl": "https://www.youtube.com/watch?v=b_Iri5nayDk"
  },
  {
    "id": "cc4ff35f-3457-4ad0-a02a-83020d5e72b1",
    "name": "Dumbbell Overhead Press",
    "slug": "dumbbell-overhead-press-0104",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a dumbbell in each hand at shoulder height with palms facing forward.\n\nStep 2: Brace/Position Engage your core and maintain a neutral spine, ensuring your elbows are slightly in front of your body and your wrists are straight.\n\nStep 3: Execute Press the dumbbells overhead by extending your arms fully while keeping your elbows slightly bent at the top of the movement.\n\nStep 4: Return/Repeat Lower the dumbbells back to shoulder height in a controlled manner, then repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/MMjBnEBnZKM/hqdefault.jpg",
    "videoId": "MMjBnEBnZKM",
    "videoUrl": "https://www.youtube.com/watch?v=MMjBnEBnZKM"
  },
  {
    "id": "b0500002-0000-4000-8000-000000000002",
    "name": "Stability Ball Push-Up",
    "slug": "stability-ball-push-up",
    "description": "Step 1: Setup Place hands shoulder-width apart on the apex of the TheraBand Stability Ball, fingers spread wide and wrists in neutral alignment.\n\nStep 2: Brace/Position Extend feet behind you into a push-up plank, feet hip-width apart. Engage core and glutes to lock spine in neutral.\n\nStep 3: Execute Lower chest toward ball over 4 controlled seconds, keeping elbows tracking at a 45-degree angle to ribcage.\n\nStep 4: Return/Repeat Press aggressively through palms to full arm extension without allowing the ball to roll or wobble.",
    "coachingCues": [],
    "primaryEquipment": [
      "Stability Ball"
    ],
    "muscleGroups": [
      "pectorals",
      "triceps",
      "rotator cuff",
      "anterior core"
    ],
    "imageUrl": "https://img.youtube.com/vi/pxpGo3EtwkM/hqdefault.jpg",
    "videoId": "pxpGo3EtwkM",
    "videoUrl": "https://www.youtube.com/watch?v=pxpGo3EtwkM"
  },
  {
    "id": "3cfb7e0a-7dc7-4321-9536-3613d23786b5",
    "name": "Bent Over Dumbbell Rear Fly",
    "slug": "bent-over-dumbbell-rear-fly-0108",
    "description": "Step 1: Setup Stand with feet shoulder-width apart, holding a dumbbell in each hand, and hinge at the hips to bend forward while keeping your back straight and knees slightly bent.\n\nStep 2: Brace/Position Engage your core and allow the dumbbells to hang directly below your shoulders, palms facing each other, with a slight bend in your elbows.\n\nStep 3: Execute Raise the dumbbells out to the sides in a wide arc until they are in line with your shoulders, squeezing your shoulder blades together at the top of the movement.\n\nStep 4: Return/Repeat Lower the dumbbells back to the starting position in a controlled manner, maintaining tension in your back and core, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/kLW7nbw4lcY/hqdefault.jpg",
    "videoId": "kLW7nbw4lcY",
    "videoUrl": "https://www.youtube.com/watch?v=kLW7nbw4lcY"
  },
  {
    "id": "b072be55-fd6f-4e03-8f38-4379dbea96a8",
    "name": "Bent Over Dumbbell Rear Fly",
    "slug": "bent-over-dumbbell-rear-fly-0109",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a dumbbell in each hand, and hinge at the hips while keeping your back straight, allowing your torso to lean forward at about a 45-degree angle.\n\nStep 2: Brace/Position Engage your core and maintain a neutral spine, letting your arms hang down towards the floor with a slight bend in the elbows.\n\nStep 3: Execute Raise the dumbbells out to the sides, squeezing your shoulder blades together at the top of the movement, until your arms are parallel to the ground.\n\nStep 4: Return/Repeat Lower the dumbbells back to the starting position with control, ensuring to maintain the slight bend in your elbows, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/kLW7nbw4lcY/hqdefault.jpg",
    "videoId": "kLW7nbw4lcY",
    "videoUrl": "https://www.youtube.com/watch?v=kLW7nbw4lcY"
  },
  {
    "id": "3bf3fdac-0012-40d8-9050-0fa92076c30e",
    "name": "Dumbbell Lateral Raise",
    "slug": "dumbbell-lateral-raise-0102",
    "description": "Step 1: Setup Stand with feet shoulder-width apart, holding a dumbbell in each hand at your sides with palms facing your body.\n\nStep 2: Brace/Position Engage your core and maintain a slight bend in your elbows while keeping your arms straight but not locked.\n\nStep 3: Execute Raise the dumbbells out to the sides until they reach shoulder height, keeping your elbows slightly above your wrists and your palms facing down.\n\nStep 4: Return/Repeat Lower the dumbbells back to the starting position with control and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "shoulders"
    ],
    "imageUrl": "https://img.youtube.com/vi/XPPfnSEATJA/hqdefault.jpg",
    "videoId": "XPPfnSEATJA",
    "videoUrl": "https://www.youtube.com/watch?v=XPPfnSEATJA"
  },
  {
    "id": "bbc099b2-913d-427a-a885-8c652bd0a19c",
    "name": "Dumbbell Hammer Curl",
    "slug": "dumbbell-hammer-curl-0098",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a dumbbell in each hand with your arms fully extended at your sides, palms facing each other.\n\nStep 2: Brace/Position Engage your core and maintain a neutral spine, keeping your elbows close to your torso.\n\nStep 3: Execute Curl the dumbbells upward by flexing your elbows, bringing them towards your shoulders while keeping your palms facing each other throughout the movement.\n\nStep 4: Return/Repeat Lower the dumbbells back to the starting position in a controlled manner, fully extending your arms before repeating the movement.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "biceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/nL3SedGG7X0/hqdefault.jpg",
    "videoId": "nL3SedGG7X0",
    "videoUrl": "https://www.youtube.com/watch?v=nL3SedGG7X0"
  },
  {
    "id": "f434306b-a9c7-46f9-a1f7-465b16ae1831",
    "name": "Reverse Lunge To Balance",
    "slug": "reverse-lunge-to-balance-0204",
    "description": "Step 1: Setup Stand tall with your feet hip-width apart, engaging your core and maintaining a neutral spine.\n\nStep 2: Brace/Position Step back with your right foot, lowering into a lunge while keeping your left knee aligned over your left ankle and your torso upright.\n\nStep 3: Execute Push through your left heel to return to a standing position, bringing your right knee up towards your chest to balance on your left leg.\n\nStep 4: Return/Repeat Lower your right foot back to the ground, step back into the lunge again, and alternate legs for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/lKhZvT_NkOs/hqdefault.jpg",
    "videoId": "lKhZvT_NkOs",
    "videoUrl": "https://www.youtube.com/watch?v=lKhZvT_NkOs"
  },
  {
    "id": "f4d2ccdc-3b2b-4294-9551-635f91334ae5",
    "name": "Mb Figure 8",
    "slug": "mb-figure-8-0120",
    "description": "Step 1: Setup Stand with feet shoulder-width apart, holding a medicine ball with both hands at chest level.\n\nStep 2: Brace/Position Engage your core and maintain a slight bend in your knees, keeping your back straight and shoulders relaxed.\n\nStep 3: Execute Rotate your torso to the right, lowering the medicine ball towards your right hip, then smoothly move it in a figure 8 pattern across your body to the left side.\n\nStep 4: Return/Repeat Continue the figure 8 motion for the desired number of repetitions, ensuring to maintain control and stability throughout the movement.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/iVmIrVNlKjI/hqdefault.jpg",
    "videoId": "iVmIrVNlKjI",
    "videoUrl": "https://www.youtube.com/watch?v=iVmIrVNlKjI"
  },
  {
    "id": "b0500002-0000-4000-8000-000000000003",
    "name": "Stability Ball Wall Squat",
    "slug": "stability-ball-wall-squat",
    "description": "Step 1: Setup Place the TheraBand Stability Ball against a smooth wall, positioned snug against the lumbar curve of your lower back.\n\nStep 2: Brace/Position Walk feet forward 12-18 inches, shoulder-width apart with toes pointing straight ahead.\n\nStep 3: Execute Squat down smoothly by flexing hips and knees until thighs are parallel to floor, allowing ball to roll up spine.\n\nStep 4: Return/Repeat Drive upward through midfoot and heels back to standing, maintaining constant pressure against the ball.",
    "coachingCues": [],
    "primaryEquipment": [
      "Stability Ball"
    ],
    "muscleGroups": [
      "quadriceps",
      "gluteus medius",
      "vastus medialis",
      "lumbar erectors"
    ],
    "imageUrl": "https://img.youtube.com/vi/2TOqw5wSfgE/hqdefault.jpg",
    "videoId": "2TOqw5wSfgE",
    "videoUrl": "https://www.youtube.com/watch?v=2TOqw5wSfgE"
  },
  {
    "id": "b0500002-0000-4000-8000-000000000010",
    "name": "Stability Ball Russian Twist",
    "slug": "stability-ball-russian-twist",
    "description": "Step 1: Setup Lie supine with head and shoulders centered on ball in a rigid bridge, knees at 90 degrees and feet flat.\n\nStep 2: Brace/Position Clasp hands together straight above chest with arms extended.\n\nStep 3: Execute Rotate torso smoothly onto one shoulder while keeping hips elevated and level to the floor.\n\nStep 4: Return/Repeat Pause at 45-degree shoulder roll, rotate back across center to opposite shoulder, and repeat.",
    "coachingCues": [],
    "primaryEquipment": [
      "Stability Ball"
    ],
    "muscleGroups": [
      "internal obliques",
      "external obliques",
      "transverse abdominis",
      "glutes"
    ],
    "imageUrl": "https://img.youtube.com/vi/t3HhJ_LolVg/hqdefault.jpg",
    "videoId": "t3HhJ_LolVg",
    "videoUrl": "https://www.youtube.com/watch?v=t3HhJ_LolVg"
  },
  {
    "id": "b1c8503f-6883-4f6b-8501-3103ee2e7f9a",
    "name": "Supported Bent Over Dumbbell Row",
    "slug": "supported-bent-over-dumbbell-row-0119",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a dumbbell in each hand, and hinge at the hips to lower your torso until it's nearly parallel to the floor, keeping a slight bend in your knees.\n\nStep 2: Brace/Position Engage your core, maintain a flat back, and allow the dumbbells to hang directly below your shoulders with your palms facing each other.\n\nStep 3: Execute Pull the dumbbells towards your hips by driving your elbows back, squeezing your shoulder blades together at the top of the movement.\n\nStep 4: Return/Repeat Lower the dumbbells back to the starting position in a controlled manner, fully extending your arms before repeating the movement.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "back",
      "biceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/DmUX88nWClo/hqdefault.jpg",
    "videoId": "DmUX88nWClo",
    "videoUrl": "https://www.youtube.com/watch?v=DmUX88nWClo"
  },
  {
    "id": "2a9fe1e5-acb8-491e-bc2f-2c0b03fa6a1e",
    "name": "Depth Jump Transverse",
    "slug": "depth-jump-transverse-0175",
    "description": "Step 1: Stand on a stable platform or box at a height of 12-24 inches.\n\nStep 2: Step off the platform and land softly on the ground with your feet shoulder-width apart.\n\nStep 3: Immediately rotate your torso to one side and jump laterally as high as possible.\n\nStep 4: Land softly on the opposite foot, absorbing the impact with your knees slightly bent.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/1gwF8c3ZlD0/hqdefault.jpg",
    "videoId": "1gwF8c3ZlD0",
    "videoUrl": "https://www.youtube.com/watch?v=1gwF8c3ZlD0"
  },
  {
    "id": "b14b8750-1084-4ebf-bf67-e1806e822ded",
    "name": "Incline Stance Row",
    "slug": "incline-stance-row-0130",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a dumbbell in each hand, and hinge at your hips to lean forward while keeping your back straight.\n\nStep 2: Brace/Position Engage your core and maintain a neutral spine, allowing your arms to hang straight down from your shoulders, palms facing each other.\n\nStep 3: Execute Pull the dumbbells towards your lower ribcage, squeezing your shoulder blades together at the top of the movement while keeping your elbows close to your body.\n\nStep 4: Return/Repeat Lower the dumbbells back to the starting position in a controlled manner, fully extending your arms before repeating the movement.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "biceps",
      "chest",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/Od9m9NVkA8g/hqdefault.jpg",
    "videoId": "Od9m9NVkA8g",
    "videoUrl": "https://www.youtube.com/watch?v=Od9m9NVkA8g"
  },
  {
    "id": "8959e7d1-cbd7-41e6-8ce6-31f47f9856b2",
    "name": "Single Arm Standing Chest Press",
    "slug": "single-arm-standing-chest-press-0208",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a dumbbell in one hand at chest level with your elbow bent and palm facing forward.\n\nStep 2: Brace/Position Engage your core and maintain a neutral spine, ensuring your shoulder is down and back to stabilize your upper body.\n\nStep 3: Execute Press the dumbbell forward until your arm is fully extended, keeping your wrist straight and elbow slightly bent at the top of the movement.\n\nStep 4: Return/Repeat Slowly return the dumbbell to the starting position at chest level, maintaining control throughout the movement, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/K88He59YVto/hqdefault.jpg",
    "videoId": "K88He59YVto",
    "videoUrl": "https://www.youtube.com/watch?v=K88He59YVto"
  },
  {
    "id": "03d8179b-32d2-42fa-878a-cc54a55866d0",
    "name": "Single Leg Squat Touchdown",
    "slug": "single-leg-squat-touchdown-0126",
    "description": "Step 1: Setup Stand on your right leg with your left leg extended straight in front of you, keeping your core engaged and your chest up.\n\nStep 2: Brace/Position Bend your right knee and hinge at your hips, lowering your torso while reaching your left hand towards the ground, maintaining balance on your right leg.\n\nStep 3: Execute Lower your body until your right thigh is parallel to the ground, ensuring your right knee stays aligned with your toes and your left leg remains extended.\n\nStep 4: Return/Repeat Push through your right heel to return to the starting position, then repeat for the desired number of repetitions before switching to the left leg.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/_zaJ28rebLo/hqdefault.jpg",
    "videoId": "_zaJ28rebLo",
    "videoUrl": "https://www.youtube.com/watch?v=_zaJ28rebLo"
  },
  {
    "id": "07249629-6828-46a0-8c97-2e95211dcc9f",
    "name": "Single Leg Squat Touchdown",
    "slug": "single-leg-squat-touchdown-0044",
    "description": "Step 1: Setup Stand on your right leg with your left leg extended straight in front of you, keeping your core engaged and your chest lifted.\n\nStep 2: Brace/Position Bend your right knee to lower your body while reaching your left hand toward the ground, maintaining balance and ensuring your right knee tracks over your toes.\n\nStep 3: Execute Lower your body until your right thigh is parallel to the ground or as low as your mobility allows, keeping your left leg extended and your torso upright.\n\nStep 4: Return/Repeat Push through your right heel to return to the starting position, then switch legs and repeat the movement on the left side.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/aFttN9JV0Rg/hqdefault.jpg",
    "videoId": "aFttN9JV0Rg",
    "videoUrl": "https://www.youtube.com/watch?v=aFttN9JV0Rg"
  },
  {
    "id": "91798025-46b1-4ab5-9081-3554d92f1e93",
    "name": "Single Leg Squat Touchdown",
    "slug": "single-leg-squat-touchdown-0045",
    "description": "Step 1: Setup Stand on your right leg with your left leg extended straight in front of you, arms at your sides.\n\nStep 2: Brace/Position Engage your core, maintain a neutral spine, and extend your arms forward for balance.\n\nStep 3: Execute Bend your right knee and lower your body while reaching down with your left hand to touch the ground, keeping your left leg extended.\n\nStep 4: Return/Repeat Push through your right heel to return to the starting position and repeat for the desired number of repetitions before switching legs.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/aFttN9JV0Rg/hqdefault.jpg",
    "videoId": "aFttN9JV0Rg",
    "videoUrl": "https://www.youtube.com/watch?v=aFttN9JV0Rg"
  },
  {
    "id": "68e06f94-40ca-439d-b74f-b0d2eccb1db0",
    "name": "Single Leg Squat Touchdown",
    "slug": "single-leg-squat-touchdown-0217",
    "description": "Step 1: Setup Stand on your right leg with your left leg extended straight in front of you, arms at your sides or in front for balance.\n\nStep 2: Brace/Position Engage your core and maintain a neutral spine as you hinge at the hips, lowering your torso toward the ground while keeping your right knee aligned over your right ankle.\n\nStep 3: Execute Bend your right knee and lower your body until your left hand touches the ground or a stable surface, ensuring your left leg remains extended and your right heel stays flat.\n\nStep 4: Return/Repeat Press through your right heel to return to the starting position, then repeat for the desired number of repetitions before switching to the left leg.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/pr7y-9YuDak/hqdefault.jpg",
    "videoId": "pr7y-9YuDak",
    "videoUrl": "https://www.youtube.com/watch?v=pr7y-9YuDak"
  },
  {
    "id": "b0500002-0000-4000-8000-000000000004",
    "name": "Stability Ball Crunch",
    "slug": "stability-ball-crunch",
    "description": "Step 1: Setup Sit on the TheraBand Stability Ball and roll forward until ball supports your lumbar spine and middle back, feet flat on floor.\n\nStep 2: Brace/Position Support head lightly with fingertips or cross arms over chest. Allow spine to gently drape back over curvature.\n\nStep 3: Execute Contract abdominals to flex thoracic spine upward over ball, curling ribcage toward pelvis with 2-second peak isometric hold.\n\nStep 4: Return/Repeat Lower under control back over curvature to full abdominal stretch and repeat.",
    "coachingCues": [],
    "primaryEquipment": [
      "Stability Ball"
    ],
    "muscleGroups": [
      "rectus abdominis",
      "transverse abdominis",
      "internal obliques"
    ],
    "imageUrl": "https://img.youtube.com/vi/QFLftqPWjoI/hqdefault.jpg",
    "videoId": "QFLftqPWjoI",
    "videoUrl": "https://www.youtube.com/watch?v=QFLftqPWjoI"
  },
  {
    "id": "b0500002-0000-4000-8000-000000000011",
    "name": "Stability Ball Scapular Triad (Ball Combo I)",
    "slug": "stability-ball-scapular-triad",
    "description": "Step 1: Setup Lie prone with chest supported on the TheraBand Stability Ball, light dumbbells in hand, neck neutral.\n\nStep 2: Brace/Position Brace core and anchor toes to floor.\n\nStep 3: Execute Raise arms in Y-scaption (45 degrees), then T-abduction (90 degrees), then W-retraction, squeezing rhomboids and lower traps.\n\nStep 4: Return/Repeat Lower smoothly between each phase, ensuring upper trapezius remains relaxed.",
    "coachingCues": [],
    "primaryEquipment": [
      "Stability Ball",
      "Dumbbells"
    ],
    "muscleGroups": [
      "middle trapezius",
      "lower trapezius",
      "posterior deltoids"
    ],
    "imageUrl": "https://img.youtube.com/vi/xb3-dysLHpE/hqdefault.jpg",
    "videoId": "xb3-dysLHpE",
    "videoUrl": "https://www.youtube.com/watch?v=xb3-dysLHpE"
  },
  {
    "id": "8bb0b786-e555-43be-85c6-1f426b527bd9",
    "name": "Kettlebell Clean",
    "slug": "kettlebell-clean-0133",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, kettlebell positioned on the floor between your feet, with your toes slightly pointed out.\n\nStep 2: Brace/Position Hinge at the hips, bend your knees, and grasp the kettlebell with one hand, keeping your back straight and core engaged.\n\nStep 3: Execute Drive through your heels, extend your hips, and pull the kettlebell upward, keeping it close to your body, rotating your wrist to catch it at shoulder height.\n\nStep 4: Return/Repeat Lower the kettlebell back to the starting position by reversing the movement, ensuring control, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Kettlebell"
    ],
    "muscleGroups": [
      "back",
      "glutes",
      "hamstrings",
      "quadriceps",
      "shoulders"
    ],
    "imageUrl": "https://img.youtube.com/vi/aoCikYYQ6pI/hqdefault.jpg",
    "videoId": "aoCikYYQ6pI",
    "videoUrl": "https://www.youtube.com/watch?v=aoCikYYQ6pI"
  },
  {
    "id": "ae881219-5a06-4f42-ab1b-5bc51ad8eaff",
    "name": "Medicine Ball Push Up To 3 Point",
    "slug": "medicine-ball-push-up-to-3-point-0199",
    "description": "Step 1: Setup Place a medicine ball under one hand while in a push-up position, ensuring your body forms a straight line from head to heels.\n\nStep 2: Brace/Position Engage your core and maintain a neutral spine, keeping your feet shoulder-width apart for stability.\n\nStep 3: Execute Lower your body into a push-up by bending your elbows, then push back up to the starting position.\n\nStep 4: Return/Repeat After the push-up, rotate your torso and lift the opposite arm towards the ceiling, holding for a moment before returning to the push-up position and repeating.",
    "coachingCues": [],
    "primaryEquipment": [
      "Medicine Ball"
    ],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/pxpGo3EtwkM/hqdefault.jpg",
    "videoId": "pxpGo3EtwkM",
    "videoUrl": "https://www.youtube.com/watch?v=pxpGo3EtwkM"
  },
  {
    "id": "b0500002-0000-4000-8000-000000000005",
    "name": "Stability Ball Dumbbell Chest Press",
    "slug": "stability-ball-dumbbell-chest-press",
    "description": "Step 1: Setup Hold dumbbells at shoulders and sit on ball. Roll forward into a supine bridge with head, neck, and upper back firmly supported.\n\nStep 2: Brace/Position Contract glutes and core so torso and thighs form a rigid table-top parallel to floor.\n\nStep 3: Execute Press dumbbells upward in a slight arc directly over mid-chest, stopping just short of full elbow lockout.\n\nStep 4: Return/Repeat Lower dumbbells smoothly over 2 seconds until elbows reach 90 degrees, maintaining rigid level hips throughout.",
    "coachingCues": [],
    "primaryEquipment": [
      "Stability Ball",
      "Dumbbells"
    ],
    "muscleGroups": [
      "pectoralis major",
      "anterior deltoids",
      "triceps",
      "gluteus maximus"
    ],
    "imageUrl": "https://img.youtube.com/vi/FfTyQAYrnqM/hqdefault.jpg",
    "videoId": "FfTyQAYrnqM",
    "videoUrl": "https://www.youtube.com/watch?v=FfTyQAYrnqM"
  },
  {
    "id": "8bb200d0-5d72-4bc4-be20-1f74a7d4d1ae",
    "name": "Kettlebell Renegade Row",
    "slug": "kettlebell-renegade-row-0147",
    "description": "Step 1: Setup Position a kettlebell on the floor between your hands and assume a high plank position with your feet shoulder-width apart and your body in a straight line from head to heels.\n\nStep 2: Brace/Position Engage your core and glutes to stabilize your body, ensuring your shoulders are directly over your wrists and your hips are level.\n\nStep 3: Execute With control, shift your weight to one side and row the kettlebell towards your hip, keeping your elbow close to your body while maintaining a stable plank position.\n\nStep 4: Return/Repeat Lower the kettlebell back to the floor, then switch sides and repeat the row with the opposite arm, maintaining core engagement throughout the movement.",
    "coachingCues": [],
    "primaryEquipment": [
      "Kettlebell"
    ],
    "muscleGroups": [
      "back",
      "biceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/NNTpBlHRcA4/hqdefault.jpg",
    "videoId": "NNTpBlHRcA4",
    "videoUrl": "https://www.youtube.com/watch?v=NNTpBlHRcA4"
  },
  {
    "id": "3d9b8bb2-d328-4ec4-9760-fe3fd05be99a",
    "name": "Bent Over Barbel Row Supinated",
    "slug": "bent-over-barbel-row-supinated-0058",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a barbell with an underhand (supinated) grip, and hinge at the hips to lower your torso until it's nearly parallel to the ground.\n\nStep 2: Brace/Position Engage your core, maintain a neutral spine, and let the barbell hang at arm's length in front of you, with your elbows slightly bent.\n\nStep 3: Execute Pull the barbell towards your lower ribcage by bending your elbows and squeezing your shoulder blades together, keeping your elbows close to your body.\n\nStep 4: Return/Repeat Lower the barbell back to the starting position in a controlled manner, fully extending your arms, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "biceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/ZuC7ma4ktm0/hqdefault.jpg",
    "videoId": "ZuC7ma4ktm0",
    "videoUrl": "https://www.youtube.com/watch?v=ZuC7ma4ktm0"
  },
  {
    "id": "b0500002-0000-4000-8000-000000000012",
    "name": "Stability Ball Prone Shoulder Press",
    "slug": "stability-ball-prone-shoulder-press",
    "description": "Step 1: Setup Lie prone on the TheraBand Stability Ball, balls of feet anchored on floor, holding light dumbbells at shoulder level.\n\nStep 2: Brace/Position Establish unbroken line from heels through head, activating glutes and erectors.\n\nStep 3: Execute Press dumbbells forward and overhead in line with torso plane, fully extending arms without arching lower back.\n\nStep 4: Return/Repeat Pull dumbbells smoothly back to shoulder level over 2 seconds and repeat.",
    "coachingCues": [],
    "primaryEquipment": [
      "Stability Ball",
      "Dumbbells"
    ],
    "muscleGroups": [
      "deltoids",
      "triceps",
      "erector spinae",
      "glutes"
    ],
    "imageUrl": "https://img.youtube.com/vi/VZJ0PHuNrYI/hqdefault.jpg",
    "videoId": "VZJ0PHuNrYI",
    "videoUrl": "https://www.youtube.com/watch?v=VZJ0PHuNrYI"
  },
  {
    "id": "a40cbaac-49d2-469e-9850-9714bf4a65db",
    "name": "Single Leg Throw And Catch",
    "slug": "single-leg-throw-and-catch-0037",
    "description": "Step 1: Setup Stand on one leg with a slight bend in the knee, holding a medicine ball at chest level with both hands.\n\nStep 2: Brace/Position Engage your core and maintain an upright posture, ensuring your supporting leg is stable and balanced.\n\nStep 3: Execute Rotate your torso towards the wall or partner, then explosively throw the medicine ball while maintaining balance on your standing leg.\n\nStep 4: Return/Repeat Catch the ball as it returns, then rotate back to the starting position before repeating the throw for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes"
    ],
    "imageUrl": "https://img.youtube.com/vi/-MK4_rmVQqs/hqdefault.jpg",
    "videoId": "-MK4_rmVQqs",
    "videoUrl": "https://www.youtube.com/watch?v=-MK4_rmVQqs"
  },
  {
    "id": "6fbe8bf4-6e97-44db-80af-5b67170d3542",
    "name": "Zig Zag Shuffle",
    "slug": "zig-zag-shuffle-0159",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, knees slightly bent, and arms at your sides.\n\nStep 2: Brace/Position Engage your core and maintain an athletic stance, ready to move laterally.\n\nStep 3: Execute Push off with your right foot, moving diagonally to the left while keeping your body low, then quickly push off with your left foot to move diagonally to the right.\n\nStep 4: Return/Repeat Continue alternating the zig-zag movement for the desired distance or repetitions, maintaining a quick pace and low center of gravity.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "chest"
    ],
    "imageUrl": "https://img.youtube.com/vi/ayCcERnpVCc/hqdefault.jpg",
    "videoId": "ayCcERnpVCc",
    "videoUrl": "https://www.youtube.com/watch?v=ayCcERnpVCc"
  },
  {
    "id": "b0500002-0000-4000-8000-000000000006",
    "name": "Stability Ball Prone Cobra (W-Y Raise)",
    "slug": "stability-ball-prone-cobra",
    "description": "Step 1: Setup Lie prone over the TheraBand Stability Ball with chest and abdomen supported, feet anchored wide against floor for balance.\n\nStep 2: Brace/Position Keep neck neutral with chin tucked. Arms hang loosely toward floor.\n\nStep 3: Execute Retract and depress shoulder blades, lifting chest slightly off ball and driving arms upward in a W-to-Y trajectory thumbs up.\n\nStep 4: Return/Repeat Hold 2 seconds at peak contraction, then lower slowly back to start.",
    "coachingCues": [],
    "primaryEquipment": [
      "Stability Ball"
    ],
    "muscleGroups": [
      "lower trapezius",
      "rhomboids",
      "infraspinatus",
      "erector spinae"
    ],
    "imageUrl": "https://img.youtube.com/vi/j6D0V742sT8/hqdefault.jpg",
    "videoId": "j6D0V742sT8",
    "videoUrl": "https://www.youtube.com/watch?v=j6D0V742sT8"
  },
  {
    "id": "f3909b4d-a5a3-4d27-85f9-d48a7220c888",
    "name": "Activation Standing Glute Max",
    "slug": "activation-standing-glute-max-0015",
    "description": "Step 1: Setup Stand with your feet hip-width apart, weight evenly distributed on both feet, and engage your core.\n\nStep 2: Brace/Position Shift your weight onto your right leg, slightly bending the knee, while lifting your left leg behind you, keeping it straight and in line with your body.\n\nStep 3: Execute Squeeze your glute on the right side as you lift your left leg to a height of about 12-15 inches, maintaining a neutral spine and avoiding arching your back.\n\nStep 4: Return/Repeat Lower your left leg back to the starting position, then switch sides and repeat the movement on the right leg.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/_kHFPUcelRI/hqdefault.jpg",
    "videoId": "_kHFPUcelRI",
    "videoUrl": "https://www.youtube.com/watch?v=_kHFPUcelRI"
  },
  {
    "id": "b0500002-0000-4000-8000-000000000007",
    "name": "Stability Ball Roll-In / Pike",
    "slug": "stability-ball-roll-in",
    "description": "Step 1: Setup Start in a rigid push-up plank with shins resting on the apex of the TheraBand Stability Ball and hands on floor.\n\nStep 2: Brace/Position Brace abdominal wall and stabilize shoulders directly over wrists.\n\nStep 3: Execute Pull knees inward toward chest (or pike hips upward) by contracting abdominals, rolling ball forward onto tops of toes.\n\nStep 4: Return/Repeat Slowly roll ball back out to starting plank line without sagging hips.",
    "coachingCues": [],
    "primaryEquipment": [
      "Stability Ball"
    ],
    "muscleGroups": [
      "rectus abdominis",
      "iliopsoas",
      "serratus anterior",
      "shoulders"
    ],
    "imageUrl": "https://img.youtube.com/vi/ZquTk8GmA_I/hqdefault.jpg",
    "videoId": "ZquTk8GmA_I",
    "videoUrl": "https://www.youtube.com/watch?v=ZquTk8GmA_I"
  },
  {
    "id": "a9b3d200-1db8-4fe2-9377-4fdc99d17e8f",
    "name": "Bent Elbow Dumbbell Lateral Raise",
    "slug": "bent-elbow-dumbbell-lateral-raise-0103",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a dumbbell in each hand at your sides with a slight bend in your elbows.\n\nStep 2: Brace/Position Engage your core and maintain a neutral spine, keeping your elbows slightly bent throughout the movement.\n\nStep 3: Execute Raise the dumbbells out to the sides until they reach shoulder height, keeping your elbows at a 90-degree angle and palms facing down.\n\nStep 4: Return/Repeat Lower the dumbbells back to the starting position with control and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "shoulders"
    ],
    "imageUrl": "https://img.youtube.com/vi/21NdvM9pY9g/hqdefault.jpg",
    "videoId": "21NdvM9pY9g",
    "videoUrl": "https://www.youtube.com/watch?v=21NdvM9pY9g"
  },
  {
    "id": "b0500002-0000-4000-8000-000000000009",
    "name": "Stability Ball Loaded Bridge",
    "slug": "stability-ball-loaded-bridge",
    "description": "Step 1: Setup Support upper back and shoulders on the TheraBand Stability Ball, knees bent at 90 degrees with feet flat on floor.\n\nStep 2: Brace/Position Optionally place a dumbbell or plate across hips, holding it securely with both hands.\n\nStep 3: Execute Lower hips toward floor, then drive through heels to full hip extension, squeezing glutes hard for 2 seconds at top.\n\nStep 4: Return/Repeat Lower hips under control over 4 seconds and repeat without bouncing.",
    "coachingCues": [],
    "primaryEquipment": [
      "Stability Ball"
    ],
    "muscleGroups": [
      "gluteus maximus",
      "biceps femoris",
      "transverse abdominis"
    ],
    "imageUrl": "https://img.youtube.com/vi/wgcyPpK60wc/hqdefault.jpg",
    "videoId": "wgcyPpK60wc",
    "videoUrl": "https://www.youtube.com/watch?v=wgcyPpK60wc"
  },
  {
    "id": "f24e8cd8-d660-45ff-a2fd-550d169fb90d",
    "name": "Self Myofascial Release Smr Thoracic Spine",
    "slug": "self-myofascial-release-smr-thoracic-spine-0237",
    "description": "Step 1: Setup Sit on the floor with your knees bent and feet flat, placing a foam roller horizontally under your upper back, just below the shoulder blades.\n\nStep 2: Brace/Position Cross your arms over your chest or place your hands behind your head to support your neck, ensuring your head is in a neutral position.\n\nStep 3: Execute Gently roll your upper back over the foam roller, moving from the mid-back to the upper back, applying pressure to any tight or tender areas for 30 seconds to 1 minute.\n\nStep 4: Return/Repeat Slowly return to the starting position and repeat the rolling motion, adjusting the position of the foam roller as needed to target different areas of the thoracic spine.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/xKmqizOqshI/hqdefault.jpg",
    "videoId": "xKmqizOqshI",
    "videoUrl": "https://www.youtube.com/watch?v=xKmqizOqshI"
  },
  {
    "id": "dba7e4ea-dd47-4667-8e5d-19bfd9aafd4d",
    "name": "Self Myofascial Release Smr Thoracic Spine",
    "slug": "self-myofascial-release-smr-thoracic-spine-0236",
    "description": "Step 1: Setup Sit on the floor with your knees bent and feet flat, placing a foam roller horizontally behind your upper back.\n\nStep 2: Brace/Position Lean back onto the foam roller, positioning it at the mid-thoracic spine, and support your head with your hands interlaced behind your neck.\n\nStep 3: Execute Slowly roll up and down the thoracic spine, from the upper back to the mid-back, applying gentle pressure on the foam roller.\n\nStep 4: Return/Repeat Continue rolling for 30 seconds to 1 minute, focusing on areas of tightness, then reposition as needed to target different sections of the thoracic spine.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/xKmqizOqshI/hqdefault.jpg",
    "videoId": "xKmqizOqshI",
    "videoUrl": "https://www.youtube.com/watch?v=xKmqizOqshI"
  },
  {
    "id": "0cd109a3-8952-4b84-ac0c-5559c2e9cd67",
    "name": "Activation Medial Gastrocnemius",
    "slug": "activation-medial-gastrocnemius-0010",
    "description": "Step 1: Setup Stand with your feet hip-width apart, toes pointing forward, and a slight bend in your knees.\n\nStep 2: Brace/Position Engage your core and shift your weight slightly onto your heels while keeping your upper body upright.\n\nStep 3: Execute Rise onto the balls of your feet, lifting your heels off the ground while squeezing your calf muscles at the top of the movement.\n\nStep 4: Return/Repeat Lower your heels back to the ground in a controlled manner and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/gipvE9-iSzU/hqdefault.jpg",
    "videoId": "gipvE9-iSzU",
    "videoUrl": "https://www.youtube.com/watch?v=gipvE9-iSzU"
  },
  {
    "id": "218a1f4d-8381-4b66-abae-af280f215633",
    "name": "Activation Medial Gastrocnemius",
    "slug": "activation-medial-gastrocnemius-0009",
    "description": "Step 1: Setup Stand with your feet hip-width apart, toes pointing forward, and knees slightly bent.\n\nStep 2: Brace/Position Engage your core and shift your weight onto your right foot, lifting your left heel off the ground.\n\nStep 3: Execute Press through the ball of your right foot, raising your right heel off the ground while keeping your left heel elevated.\n\nStep 4: Return/Repeat Lower your right heel back to the ground and repeat for the desired number of repetitions before switching to the left foot.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/gipvE9-iSzU/hqdefault.jpg",
    "videoId": "gipvE9-iSzU",
    "videoUrl": "https://www.youtube.com/watch?v=gipvE9-iSzU"
  },
  {
    "id": "3fc6f481-2ef6-4600-b340-b5a32b010122",
    "name": "Step Up To Balance Frontal",
    "slug": "step-up-to-balance-frontal-0046",
    "description": "Step 1: Setup Stand in front of a sturdy step or platform with your feet hip-width apart and your weight evenly distributed.\n\nStep 2: Brace/Position Engage your core and place your right foot firmly on the step, ensuring your knee is aligned with your ankle.\n\nStep 3: Execute Press through your right heel to step up onto the platform, bringing your left knee up towards your chest to balance.\n\nStep 4: Return/Repeat Lower your left leg back to the ground, step down with your right foot, and repeat the movement for the desired number of repetitions before switching sides.",
    "coachingCues": [],
    "primaryEquipment": [
      "Box or Step"
    ],
    "muscleGroups": [
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/fVRKGAp1iHw/hqdefault.jpg",
    "videoId": "fVRKGAp1iHw",
    "videoUrl": "https://www.youtube.com/watch?v=fVRKGAp1iHw"
  },
  {
    "id": "f6dc1e07-99a4-48cd-bfab-b1f50ef62248",
    "name": "Barbell Bicep Curl",
    "slug": "barbell-bicep-curl",
    "description": "Step 1: Stand in athletic posture with feet hip to shoulder width apart, toes pointing forward and abs braced. Place arms comfortably at your side and then grip the bar width hands at that width, palms forward. Keep the head in line with the back and lock the shoulder blades back and down.\n\nStep 2: Curl the barbell forward, up and in toward the chest through a maximum range the does not allow the elbows to swing forward.\n\nStep 3: Reverse the movement to return to the start position. Maintain posture throughout.\n\nStep 4: Repeat for the desired number of repetitions. Do not allow the shoulders to round, back to arch, chin to jut forward or barbell to swing with momentum.",
    "coachingCues": [],
    "primaryEquipment": [
      "Barbell"
    ],
    "muscleGroups": [
      "biceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/pQfJR-sSIvA/hqdefault.jpg",
    "videoId": "pQfJR-sSIvA",
    "videoUrl": "https://www.youtube.com/watch?v=pQfJR-sSIvA"
  },
  {
    "id": "9fe59f5e-e3ee-4140-878b-f389e0beb46e",
    "name": "In In Out Out Crossover Ladder Drill",
    "slug": "in-in-out-out-crossover-ladder-drill-0154",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart at one end of the agility ladder, facing forward.\n\nStep 2: Brace/Position Engage your core and slightly bend your knees, preparing to move quickly through the ladder.\n\nStep 3: Execute Step into the first square with your right foot, then your left foot, followed by stepping out to the right side with your right foot and then your left foot, continuing this pattern down the ladder.\n\nStep 4: Return/Repeat Once you reach the end, turn around and repeat the drill, focusing on speed and precision with each step.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "full body"
    ],
    "imageUrl": "https://img.youtube.com/vi/HibORUkPckg/hqdefault.jpg",
    "videoId": "HibORUkPckg",
    "videoUrl": "https://www.youtube.com/watch?v=HibORUkPckg"
  },
  {
    "id": "7dd1b64b-0edf-477d-99fd-f5589171fb1b",
    "name": "Alternating Dumbbell Bench Press",
    "slug": "alternating-dumbbell-bench-press-0092",
    "description": "Step 1: Setup Lie on a flat bench with a dumbbell in each hand, arms extended above your chest, and feet flat on the floor.\n\nStep 2: Brace/Position Engage your core and retract your shoulder blades, ensuring your back is flat against the bench.\n\nStep 3: Execute Lower one dumbbell towards your chest while keeping the other arm extended, maintaining control throughout the movement.\n\nStep 4: Return/Repeat Press the lowered dumbbell back to the starting position and alternate arms, repeating the movement for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells",
      "Bench"
    ],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/wOa4YyxyiKI/hqdefault.jpg",
    "videoId": "wOa4YyxyiKI",
    "videoUrl": "https://www.youtube.com/watch?v=wOa4YyxyiKI"
  },
  {
    "id": "3d5b3ce1-d5ec-4768-b649-3f8a0367f912",
    "name": "Romanian Deadlift",
    "slug": "romanian-deadlift-0064",
    "description": "Step 1: Setup Stand with your feet hip-width apart, holding a barbell or dumbbells in front of your thighs with an overhand grip.\n\nStep 2: Brace/Position Engage your core and hinge at your hips, keeping a slight bend in your knees as you lower the weights along your legs, maintaining a neutral spine.\n\nStep 3: Execute Drive through your heels to extend your hips forward, lifting the weights back to the starting position while squeezing your glutes at the top.\n\nStep 4: Return/Repeat Lower the weights back down in a controlled manner, keeping your back straight and repeating for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "glutes",
      "hamstrings"
    ],
    "imageUrl": "https://img.youtube.com/vi/2bmuYtv4HbQ/hqdefault.jpg",
    "videoId": "2bmuYtv4HbQ",
    "videoUrl": "https://www.youtube.com/watch?v=2bmuYtv4HbQ"
  },
  {
    "id": "2afbd3c8-c248-4d8d-b34e-9f7d10893888",
    "name": "Activation Anterior Tibialis",
    "slug": "activation-anterior-tibialis-0005",
    "description": "Step 1: Setup Sit on a chair or bench with your feet flat on the ground and knees bent at 90 degrees.\n\nStep 2: Brace/Position Keep your back straight and engage your core while ensuring your feet are hip-width apart.\n\nStep 3: Execute Lift your toes towards your shins while keeping your heels on the ground, focusing on contracting the anterior tibialis.\n\nStep 4: Return/Repeat Lower your toes back to the starting position and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves"
    ],
    "imageUrl": "https://img.youtube.com/vi/CeFbXhifvvA/hqdefault.jpg",
    "videoId": "CeFbXhifvvA",
    "videoUrl": "https://www.youtube.com/watch?v=CeFbXhifvvA"
  },
  {
    "id": "c1000001-0000-4000-8000-000000000001",
    "name": "Paloff Press with Band",
    "slug": "paloff-press-with-band",
    "description": "Step 1: Setup Anchor a resistance band at mid-chest height. Stand perpendicular to the anchor point in an athletic, shoulder-width stance with knees soft.\n\nStep 2: Brace/Position Grasp the handle with both hands at the center of your chest. Engage your core, retract and depress your scapulae, and establish a neutral spine.\n\nStep 3: Execute Press the band directly away from your sternum until arms are extended. Resist the rotational torque attempting to twist your torso toward the anchor.\n\nStep 4: Return/Repeat Hold the isometric contraction for 2-3 seconds, then return your hands smoothly to your chest with control. Complete prescribed repetitions and switch sides.",
    "coachingCues": [],
    "primaryEquipment": [
      "Resistance Band"
    ],
    "muscleGroups": [
      "core",
      "obliques",
      "abdominals"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
    "videoId": null,
    "videoUrl": null
  },
  {
    "id": "c1000001-0000-4000-8000-000000000002",
    "name": "Tanaka Stage 1 Incline Walk / Rower",
    "slug": "tanaka-stage-1-incline-walk-rower",
    "description": "Step 1: Setup Mount the treadmill (incline 6–10%, 3.0–3.8 mph) or rowing ergometer (damper 4–5). Calibrate your heart rate telemetry monitor.\n\nStep 2: Brace/Position Maintain erect posture with tall cervical alignment and steady diaphragmatic breathing through the nasal cavity.\n\nStep 3: Execute Sustain a steady aerobic rhythm targeting Tanaka Stage 1 heart rate thresholds (65–75% HRmax = 208 - 0.7 * age). Avoid holding handrails on the treadmill.\n\nStep 4: Return/Repeat Maintain pace for the prescribed duration (20–45 mins). Conclude with a 3-minute flush in Zone 1 (<60% HRmax).",
    "coachingCues": [],
    "primaryEquipment": [
      "Treadmill",
      "Rower"
    ],
    "muscleGroups": [
      "cardiovascular",
      "quadriceps",
      "hamstrings",
      "calves"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1434596922112-19c563067271?auto=format&fit=crop&w=800&q=80",
    "videoId": null,
    "videoUrl": null
  },
  {
    "id": "3231ee9e-ed64-49f5-a85f-fecab5cd43f5",
    "name": "Box Squat",
    "slug": "box-squat-0065",
    "description": "Step 1: Setup Stand in front of a box or bench with feet shoulder-width apart and toes slightly pointed out.\n\nStep 2: Brace/Position Engage your core, maintain a neutral spine, and hinge at the hips while lowering into a squat position, ensuring your knees track over your toes.\n\nStep 3: Execute Lower your body until your glutes lightly touch the box, keeping your weight distributed evenly through your heels.\n\nStep 4: Return/Repeat Push through your heels to stand back up, fully extending your hips and knees, then repeat the movement.",
    "coachingCues": [],
    "primaryEquipment": [
      "Box or Step"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/-GaRp6_b2vk/hqdefault.jpg",
    "videoId": "-GaRp6_b2vk",
    "videoUrl": "https://www.youtube.com/watch?v=-GaRp6_b2vk"
  },
  {
    "id": "f8f1e306-1b8e-494e-a0b8-ac809b6f9000",
    "name": "Single Leg Romanian Deadlift Curl To Overhead Press",
    "slug": "single-leg-romanian-deadlift-curl-to-overhead-press-0041",
    "description": "Step 1: Setup Stand on your right leg with a slight bend in the knee, holding a dumbbell in your left hand, and engage your core.\n\nStep 2: Brace/Position Hinge at the hips, lowering the dumbbell towards the ground while extending your left leg straight back, keeping your back flat and eyes forward.\n\nStep 3: Execute As you return to standing, curl the dumbbell towards your shoulder, then press it overhead while maintaining balance on your right leg.\n\nStep 4: Return/Repeat Lower the dumbbell back to shoulder level, then hinge at the hips again to return to the starting position, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "biceps",
      "core",
      "glutes",
      "hamstrings",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/vubwNFuJeE8/hqdefault.jpg",
    "videoId": "vubwNFuJeE8",
    "videoUrl": "https://www.youtube.com/watch?v=vubwNFuJeE8"
  },
  {
    "id": "a1f47199-e99b-44b3-8466-9a9c09a774e8",
    "name": "Single Leg Romanian Deadlift Curl To Overhead Press",
    "slug": "single-leg-romanian-deadlift-curl-to-overhead-press-0219",
    "description": "Step 1: Setup Stand on your right leg with a slight bend in the knee, holding a dumbbell in your left hand, and keep your right arm at your side.\n\nStep 2: Brace/Position Engage your core, hinge at the hips to lower your torso towards the ground while extending your left leg straight back, maintaining a flat back and neutral spine.\n\nStep 3: Execute Once your torso is parallel to the ground, curl the dumbbell towards your shoulder, then press it overhead while stabilizing on your right leg.\n\nStep 4: Return/Repeat Lower the dumbbell back to the starting position, extend your left leg back, and return to the hinged position before repeating the movement for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "biceps",
      "core",
      "glutes",
      "hamstrings",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/CqLKOZCOFLU/hqdefault.jpg",
    "videoId": "CqLKOZCOFLU",
    "videoUrl": "https://www.youtube.com/watch?v=CqLKOZCOFLU"
  },
  {
    "id": "779d781a-e3e0-40eb-a7ab-a84b36048485",
    "name": "Single Leg Romanian Deadlift Curl To Overhead Press",
    "slug": "single-leg-romanian-deadlift-curl-to-overhead-press-0220",
    "description": "Step 1: Setup Stand on your right leg with a slight bend in the knee, holding a dumbbell in your left hand, and engage your core.\n\nStep 2: Brace/Position Hinge at the hips, lowering the dumbbell towards the ground while extending your left leg straight back, keeping your back flat and your gaze forward.\n\nStep 3: Execute As you return to an upright position, curl the dumbbell towards your shoulder, then press it overhead while balancing on your right leg.\n\nStep 4: Return/Repeat Lower the dumbbell back to your shoulder, then hinge at the hips to return to the starting position; repeat for the desired number of repetitions before switching legs.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "biceps",
      "core",
      "glutes",
      "hamstrings",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/CqLKOZCOFLU/hqdefault.jpg",
    "videoId": "CqLKOZCOFLU",
    "videoUrl": "https://www.youtube.com/watch?v=CqLKOZCOFLU"
  },
  {
    "id": "0a2436c3-f21d-4ab3-bb26-98db6d7668f2",
    "name": "Dumbbell Combination Curl",
    "slug": "dumbbell-combination-curl-0097",
    "description": "Step 1: Setup Stand with feet shoulder-width apart, holding a dumbbell in each hand at your sides with palms facing forward.\n\nStep 2: Brace/Position Engage your core and maintain a neutral spine, keeping your elbows close to your torso.\n\nStep 3: Execute Curl the dumbbells up towards your shoulders, rotating your wrists so that your palms face your shoulders at the top of the movement.\n\nStep 4: Return/Repeat Lower the dumbbells back to the starting position, rotating your wrists back to the original position, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "biceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/5l9fg7Cml0Y/hqdefault.jpg",
    "videoId": "5l9fg7Cml0Y",
    "videoUrl": "https://www.youtube.com/watch?v=5l9fg7Cml0Y"
  },
  {
    "id": "c22a1b7f-eed2-4706-9406-e3f6102bada0",
    "name": "Quadruped March",
    "slug": "quadruped-march-0086",
    "description": "Step 1: Setup Begin on all fours with your hands directly under your shoulders and knees under your hips, maintaining a neutral spine.\n\nStep 2: Brace/Position Engage your core and glutes, ensuring your back remains flat and your head is in line with your spine.\n\nStep 3: Execute Lift your right knee off the ground, driving it forward while simultaneously lifting your left arm, keeping both parallel to the ground.\n\nStep 4: Return/Repeat Lower your right knee and left arm back to the starting position, then alternate sides, lifting your left knee and right arm.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/-atsQczv7N4/hqdefault.jpg",
    "videoId": "-atsQczv7N4",
    "videoUrl": "https://www.youtube.com/watch?v=-atsQczv7N4"
  },
  {
    "id": "8ba52551-1811-4603-8454-9e09c13665ed",
    "name": "Quadruped March",
    "slug": "quadruped-march-0085",
    "description": "Step 1: Setup Begin on all fours with your hands directly under your shoulders and knees under your hips, maintaining a neutral spine.\n\nStep 2: Brace/Position Engage your core and glutes, ensuring your back remains flat and your head is in a neutral position.\n\nStep 3: Execute Lift your right knee off the ground, driving it forward while simultaneously lifting your left arm, keeping both parallel to the ground.\n\nStep 4: Return/Repeat Lower your right knee and left arm back to the starting position, then alternate sides, lifting your left knee and right arm.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/-atsQczv7N4/hqdefault.jpg",
    "videoId": "-atsQczv7N4",
    "videoUrl": "https://www.youtube.com/watch?v=-atsQczv7N4"
  },
  {
    "id": "1615d0bf-f76f-419d-ae62-a8924c5589f8",
    "name": "Floor Prone Cobra",
    "slug": "floor-prone-cobra-0075",
    "description": "Step 1: Setup Lie face down on the floor with your arms extended straight out to the sides at shoulder height, palms facing down.\n\nStep 2: Brace/Position Engage your core and glutes, ensuring your body is in a straight line from head to heels, and keep your neck neutral.\n\nStep 3: Execute Slowly lift your chest and arms off the ground by squeezing your shoulder blades together, while rotating your thumbs up towards the ceiling.\n\nStep 4: Return/Repeat Lower your chest and arms back to the floor with control, then repeat the movement for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/keErJXdp2lE/hqdefault.jpg",
    "videoId": "keErJXdp2lE",
    "videoUrl": "https://www.youtube.com/watch?v=keErJXdp2lE"
  },
  {
    "id": "1a0a38bb-637d-4732-896c-a28a4f07924d",
    "name": "Floor Prone Cobra",
    "slug": "floor-prone-cobra-0076",
    "description": "Step 1: Setup Lie face down on the floor with your legs extended straight behind you and arms positioned at your sides, palms facing down.\n\nStep 2: Brace/Position Engage your core and glutes, ensuring your neck is neutral and your forehead is resting lightly on the ground.\n\nStep 3: Execute Lift your chest and arms off the ground by squeezing your shoulder blades together, keeping your elbows slightly bent and your palms facing down.\n\nStep 4: Return/Repeat Lower your chest and arms back to the starting position with control, then repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/keErJXdp2lE/hqdefault.jpg",
    "videoId": "keErJXdp2lE",
    "videoUrl": "https://www.youtube.com/watch?v=keErJXdp2lE"
  },
  {
    "id": "c1000001-0000-4000-8000-000000000003",
    "name": "Dynamic Leg Swings & Hip Circles",
    "slug": "dynamic-leg-swings-hip-circles",
    "description": "Step 1: Setup Stand tall adjacent to a wall or stable upright support for balance assistance.\n\nStep 2: Sagittal Swings Swing one leg forward and backward smoothly through the sagittal plane (hip flexion to extension), maintaining an upright lumbar spine.\n\nStep 3: Frontal Swings Turn facing the support and swing the leg laterally across the midline and out through the frontal plane (hip adduction to abduction).\n\nStep 4: Hip Circles Perform slow, controlled multi-planar circumductions of the hip (CARs) both clockwise and counter-clockwise to lubricate the acetabulofemoral joint.",
    "coachingCues": [],
    "primaryEquipment": [
      "Bodyweight"
    ],
    "muscleGroups": [
      "glutes",
      "hip flexors",
      "adductors",
      "abductors",
      "hamstrings"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80",
    "videoId": null,
    "videoUrl": null
  },
  {
    "id": "3e514855-e4eb-4e27-b39a-084dfc5f3add",
    "name": "Single Leg Balance Reach Multiplanar",
    "slug": "single-leg-balance-reach-multiplanar-0031",
    "description": "Step 1: Setup Stand on your right leg with a slight bend in the knee, keeping your left leg lifted behind you and your arms at your sides.\n\nStep 2: Brace/Position Engage your core, maintain an upright posture, and focus your gaze on a fixed point in front of you to enhance stability.\n\nStep 3: Execute Slowly reach your left leg out to the side, forward, and then backward while maintaining balance on your right leg, keeping your torso upright throughout the movement.\n\nStep 4: Return/Repeat Return to the starting position after each reach, then repeat the sequence for the desired number of repetitions before switching to the left leg.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes"
    ],
    "imageUrl": "https://img.youtube.com/vi/Mo4P9Y_AQt8/hqdefault.jpg",
    "videoId": "Mo4P9Y_AQt8",
    "videoUrl": "https://www.youtube.com/watch?v=Mo4P9Y_AQt8"
  },
  {
    "id": "e308b3e8-6e8d-4157-96aa-73a436d4abe1",
    "name": "Single Leg Balance Reach Multiplanar",
    "slug": "single-leg-balance-reach-multiplanar-0032",
    "description": "Step 1: Setup Stand on your right leg with a slight bend in the knee, keeping your left leg lifted behind you and your arms at your sides.\n\nStep 2: Brace/Position Engage your core and maintain an upright posture, ensuring your hips are level and your shoulders are back.\n\nStep 3: Execute Reach forward with your left leg while extending your arms forward, keeping your torso stable and avoiding excessive rotation.\n\nStep 4: Return/Repeat Return to the starting position by bringing your left leg back and arms to your sides, then repeat for the desired number of repetitions before switching legs.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes"
    ],
    "imageUrl": "https://img.youtube.com/vi/Mo4P9Y_AQt8/hqdefault.jpg",
    "videoId": "Mo4P9Y_AQt8",
    "videoUrl": "https://www.youtube.com/watch?v=Mo4P9Y_AQt8"
  },
  {
    "id": "e9813f4d-0ae5-4340-90db-6cd04f2adca8",
    "name": "Hammer Curl To Lateral Raise",
    "slug": "hammer-curl-to-lateral-raise-0099",
    "description": "Step 1: Setup Stand with feet shoulder-width apart, holding a dumbbell in each hand with palms facing your body and arms fully extended at your sides.\n\nStep 2: Brace/Position Engage your core and maintain a slight bend in your knees, keeping your elbows close to your torso.\n\nStep 3: Execute Curl the dumbbells up towards your shoulders while keeping your palms facing each other, then rotate your arms to lift the weights laterally to shoulder height.\n\nStep 4: Return/Repeat Lower the dumbbells back to the starting position in a controlled manner, then repeat the movement for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "biceps",
      "shoulders"
    ],
    "imageUrl": "https://img.youtube.com/vi/4P6tmzTV01A/hqdefault.jpg",
    "videoId": "4P6tmzTV01A",
    "videoUrl": "https://www.youtube.com/watch?v=4P6tmzTV01A"
  },
  {
    "id": "6d3a88e1-0da0-4c91-af74-1e5192b0787a",
    "name": "Plank",
    "slug": "plank-0080",
    "description": "Step 1: Setup Begin in a prone position on the floor, placing your forearms on the ground with elbows directly under your shoulders.\n\nStep 2: Brace/Position Engage your core, glutes, and legs, ensuring your body forms a straight line from head to heels.\n\nStep 3: Execute Hold the position, maintaining tension in your core and avoiding sagging or arching of the back.\n\nStep 4: Return/Repeat Hold for the desired duration, then lower your knees to the ground to release the position before repeating.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/xhk1JkbF2lg/hqdefault.jpg",
    "videoId": "xhk1JkbF2lg",
    "videoUrl": "https://www.youtube.com/watch?v=xhk1JkbF2lg"
  },
  {
    "id": "102555ec-dfea-411f-a79b-5ed8d064be73",
    "name": "Bird Dog",
    "slug": "bird-dog",
    "description": "Step 1: Get into quadruped position (on all fours) with the hands under the shoulders and knees under the hips. Press away from the floor with the arms to stabilize shoulder girdle. Draw the abs in. Position spine in neutral.\n\nStep 2: Slowly reach one arm and the opposite leg with toes pointed away from the body. Reach long for the walls attempting to get the body in a straight line.\n\nStep 3: Reverse the pattern and return the starting position sweeping the hand and knee into position.\n\nStep 4: Repeat with the other side. Maintain posture throughout. Avoid letting the head fall to the ground, back arch or slouch, shoulder collapse or torso rotate.",
    "coachingCues": [],
    "primaryEquipment": [
      "None"
    ],
    "muscleGroups": [
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/ZdAHe9_HeEw/hqdefault.jpg",
    "videoId": "ZdAHe9_HeEw",
    "videoUrl": "https://www.youtube.com/watch?v=ZdAHe9_HeEw"
  },
  {
    "id": "ac4f63cb-05f4-486a-adcf-bca551fa7a94",
    "name": "Dumbbell Front Squat",
    "slug": "dumbbell-front-squat",
    "description": "Step 1: Stand in athletic posture with feet hip to shoulder width apart and toes forward. Draw in and brace the abs. Pull the shoulder blades back and down and lock the elbows into the side of the body. Balance the dumbbells above the elbows at all times (or set them on the shoulders).\n\nStep 2: Drive the hips back and squat down to a maximum depth that posture and alignment can be maintained (typically between 90˚ at the knee and thigh parallel to the floor). Keep the weight balanced from heel to ball of foot and torso fairly upright.\n\nStep 3: Reverse the pattern and return to the starting position. Maintain posture throughout.\n\nStep 4: Repeat for the desired number of repetitions. Avoid slouching the back or shoulders, letting the elbows flare out, knees caving in or toes turning out.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/hZI8Yy5elZs/hqdefault.jpg",
    "videoId": "hZI8Yy5elZs",
    "videoUrl": "https://www.youtube.com/watch?v=hZI8Yy5elZs"
  },
  {
    "id": "6b78ff68-889b-4926-ab91-d52bb0b349d0",
    "name": "Single Leg Romanian Deadlift Single Arm Curl To Overhead Press",
    "slug": "single-leg-romanian-deadlift-single-arm-curl-to-overhead-press-0042",
    "description": "Step 1: Setup Stand on your right leg with a slight bend in the knee, holding a dumbbell in your left hand at your side.\n\nStep 2: Brace/Position Hinge at the hips, lowering the dumbbell towards the ground while extending your left leg straight back, keeping your back flat and core engaged.\n\nStep 3: Execute Once you reach the bottom position, drive through your right heel to return to standing while simultaneously curling the dumbbell up to your shoulder.\n\nStep 4: Return/Repeat Press the dumbbell overhead until your arm is fully extended, then lower it back to your shoulder and repeat the entire sequence.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "biceps",
      "core",
      "glutes",
      "hamstrings",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/SKl4_fSJeh0/hqdefault.jpg",
    "videoId": "SKl4_fSJeh0",
    "videoUrl": "https://www.youtube.com/watch?v=SKl4_fSJeh0"
  },
  {
    "id": "699b18dc-9c33-4420-bf4f-0ab2ccd71452",
    "name": "Single Leg Romanian Deadlift Single Arm Curl To Overhead Press",
    "slug": "single-leg-romanian-deadlift-single-arm-curl-to-overhead-press-0043",
    "description": "Step 1: Setup Stand on your right leg with a slight bend in the knee, holding a dumbbell in your left hand at your side.\n\nStep 2: Brace/Position Engage your core and hinge at the hips, lowering the dumbbell toward the ground while extending your left leg straight back for balance.\n\nStep 3: Execute Once you reach a comfortable stretch in your hamstring, return to the upright position while simultaneously curling the dumbbell to your shoulder and pressing it overhead.\n\nStep 4: Return/Repeat Lower the dumbbell back to your shoulder, then hinge at the hips again to return to the starting position; complete the desired repetitions before switching to the right arm.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "biceps",
      "core",
      "glutes",
      "hamstrings",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/SKl4_fSJeh0/hqdefault.jpg",
    "videoId": "SKl4_fSJeh0",
    "videoUrl": "https://www.youtube.com/watch?v=SKl4_fSJeh0"
  },
  {
    "id": "e33ae4f2-1072-498e-a969-d00bb5db67b0",
    "name": "Static 3d Kneeling Hip Flexor Stretch",
    "slug": "static-3d-kneeling-hip-flexor-stretch-0246",
    "description": "Step 1: Setup Begin in a kneeling position with your right knee on the ground and your left foot flat on the floor in front of you, forming a 90-degree angle at both knees.\n\nStep 2: Brace/Position Engage your core and maintain an upright torso, ensuring your hips are square and facing forward.\n\nStep 3: Execute Gently push your hips forward while keeping your back straight, feeling a stretch in the hip flexor of your right leg.\n\nStep 4: Return/Repeat Hold the stretch for 20-30 seconds, then switch legs and repeat the process on the opposite side.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/mOBSK4JKwlk/hqdefault.jpg",
    "videoId": "mOBSK4JKwlk",
    "videoUrl": "https://www.youtube.com/watch?v=mOBSK4JKwlk"
  },
  {
    "id": "c3779742-47a8-47fa-8dd4-cdfff2885595",
    "name": "Sternocleidomastoid Stretch",
    "slug": "sternocleidomastoid-stretch-0262",
    "description": "Step 1: Setup Stand or sit upright with your shoulders relaxed and your head in a neutral position.\n\nStep 2: Brace/Position Gently tilt your head to one side, bringing your ear toward your shoulder while keeping your opposite shoulder down.\n\nStep 3: Execute Hold the stretch for 15-30 seconds, feeling the stretch along the side of your neck.\n\nStep 4: Return/Repeat Slowly return your head to the neutral position and repeat on the opposite side.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "full body"
    ],
    "imageUrl": "https://img.youtube.com/vi/s_TdSVFpLdg/hqdefault.jpg",
    "videoId": "s_TdSVFpLdg",
    "videoUrl": "https://www.youtube.com/watch?v=s_TdSVFpLdg"
  },
  {
    "id": "e6b6b5c5-1f43-4b6c-8365-b5fa25d18c10",
    "name": "Sternocleidomastoid Stretch",
    "slug": "sternocleidomastoid-stretch-0263",
    "description": "Step 1: Setup Stand or sit upright with your shoulders relaxed and your head in a neutral position.\n\nStep 2: Brace/Position Gently tilt your head to one side, bringing your ear towards your shoulder while keeping your opposite shoulder down.\n\nStep 3: Execute Hold the stretch for 15-30 seconds, feeling the stretch along the side of your neck.\n\nStep 4: Return/Repeat Slowly return your head to the neutral position and repeat on the opposite side.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "full body"
    ],
    "imageUrl": "https://img.youtube.com/vi/s_TdSVFpLdg/hqdefault.jpg",
    "videoId": "s_TdSVFpLdg",
    "videoUrl": "https://www.youtube.com/watch?v=s_TdSVFpLdg"
  },
  {
    "id": "08f02c08-4d30-42e3-afc9-80df9a9319bc",
    "name": "Single Leg Hammer Curl",
    "slug": "single-leg-hammer-curl-0113",
    "description": "Step 1: Setup Stand on your right leg with a slight bend in the knee, holding a dumbbell in your left hand at your side, palm facing your body.\n\nStep 2: Brace/Position Engage your core and maintain a straight posture, keeping your left elbow close to your torso.\n\nStep 3: Execute Curl the dumbbell upward by flexing your left elbow, bringing it towards your shoulder while keeping your right leg stable.\n\nStep 4: Return/Repeat Lower the dumbbell back to the starting position, then repeat for the desired number of repetitions before switching to the right arm.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "biceps",
      "core",
      "glutes"
    ],
    "imageUrl": "https://img.youtube.com/vi/unRU3oVX3PU/hqdefault.jpg",
    "videoId": "unRU3oVX3PU",
    "videoUrl": "https://www.youtube.com/watch?v=unRU3oVX3PU"
  },
  {
    "id": "b1506d50-3463-43c5-a501-7bd5cf5fbe23",
    "name": "Single Leg Hammer Curl",
    "slug": "single-leg-hammer-curl-0114",
    "description": "Step 1: Setup Stand on your right leg with a slight bend in the knee, holding a dumbbell in your right hand at your side, palm facing your body.\n\nStep 2: Brace/Position Engage your core and maintain a straight posture, keeping your left leg lifted slightly behind you.\n\nStep 3: Execute Curl the dumbbell up towards your shoulder while keeping your elbow close to your body, squeezing your bicep at the top of the movement.\n\nStep 4: Return/Repeat Lower the dumbbell back to the starting position with control, then repeat for the desired number of repetitions before switching to the left leg.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "biceps",
      "core",
      "glutes"
    ],
    "imageUrl": "https://img.youtube.com/vi/unRU3oVX3PU/hqdefault.jpg",
    "videoId": "unRU3oVX3PU",
    "videoUrl": "https://www.youtube.com/watch?v=unRU3oVX3PU"
  },
  {
    "id": "7f1723c1-48e9-4fb8-9af5-1d8c75fe2850",
    "name": "Push Up With Rotation",
    "slug": "push-up-with-rotation-0125",
    "description": "Step 1: Setup Begin in a high plank position with your hands slightly wider than shoulder-width apart and your feet hip-width apart.\n\nStep 2: Brace/Position Engage your core and maintain a straight line from your head to your heels, ensuring your hips are neither sagging nor elevated.\n\nStep 3: Execute Lower your body towards the floor by bending your elbows, keeping them at a 45-degree angle to your torso. As you push back up, rotate your torso to one side, extending the opposite arm towards the ceiling.\n\nStep 4: Return/Repeat Return to the starting plank position and repeat the movement, alternating the rotation to the opposite side with each repetition.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/miN74vJbE_w/hqdefault.jpg",
    "videoId": "miN74vJbE_w",
    "videoUrl": "https://www.youtube.com/watch?v=miN74vJbE_w"
  },
  {
    "id": "4fc20801-509b-4f06-a148-0ee27de3de2f",
    "name": "Leg Press",
    "slug": "leg-press",
    "description": "Step 1: Sit in the leg press machine with feet hip to shoulder width apart and straight ahead on the leg press platform. Ensure foot height placement allows for good range of movement at both the hip and knee. Draw in and brace the abs. Lock the shoulder blades back and down. Stabilize the upper body by grasping the handles.\n\nStep 2: Lower the platform down toward the body ensuring the knees stay aligned with the middle toes and weight is distributed evenly across the foot. Move through a maximum range without losing technique or bottoming out the thighs into the rib cage.\n\nStep 3: Reverse the pattern and return to starting position.\n\nStep 4: Repeat. Maintain posture throughout. Avoid locking the knees, bouncing at the bottom of the movement to create momentum, rounding the spine or letting the hips come off the pad, or collapsing the knees inward.",
    "coachingCues": [],
    "primaryEquipment": [
      "Leg Press Machine"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/cDGOn-yfKJA/hqdefault.jpg",
    "videoId": "cDGOn-yfKJA",
    "videoUrl": "https://www.youtube.com/watch?v=cDGOn-yfKJA"
  },
  {
    "id": "b72bb8fe-4b44-4805-9203-d05322b8a056",
    "name": "Half Get Up With Kettlebell",
    "slug": "half-get-up-with-kettlebell-0139",
    "description": "Step 1: Setup Lie on your back with a kettlebell in your right hand, arm extended straight above you, and your right knee bent at 90 degrees with your foot flat on the floor.\n\nStep 2: Brace/Position Engage your core and press your left hand into the floor at a 45-degree angle from your body, keeping your left leg extended straight.\n\nStep 3: Execute Push through your right foot and left hand to lift your torso off the ground, rotating your body towards your left while keeping the kettlebell overhead.\n\nStep 4: Return/Repeat Lower your torso back to the ground in a controlled manner, returning to the starting position, and repeat for the desired number of repetitions before switching sides.",
    "coachingCues": [],
    "primaryEquipment": [
      "Kettlebell"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/WradwGWo554/hqdefault.jpg",
    "videoId": "WradwGWo554",
    "videoUrl": "https://www.youtube.com/watch?v=WradwGWo554"
  },
  {
    "id": "94f4597b-1cfa-4fbf-ae47-091f347b58a8",
    "name": "Kettlebell Push Press",
    "slug": "kettlebell-push-press-0143",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a kettlebell in one hand at shoulder height with your elbow tucked in and palm facing forward.\n\nStep 2: Brace/Position Engage your core, maintain a neutral spine, and slightly bend your knees while keeping your feet firmly planted.\n\nStep 3: Execute Press the kettlebell overhead by extending your arm and using your legs to generate momentum, ensuring the kettlebell moves in a straight path.\n\nStep 4: Return/Repeat Lower the kettlebell back to shoulder height with control, then repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Kettlebell"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/k4q6HkT99iA/hqdefault.jpg",
    "videoId": "k4q6HkT99iA",
    "videoUrl": "https://www.youtube.com/watch?v=k4q6HkT99iA"
  },
  {
    "id": "44f7a10c-2766-46b6-a769-7b98a8eeb9d3",
    "name": "Kettlebell Push Press",
    "slug": "kettlebell-push-press-0144",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a kettlebell in one hand at shoulder height with your elbow tucked close to your body.\n\nStep 2: Brace/Position Engage your core and maintain a neutral spine, ensuring your knees are slightly bent and your weight is evenly distributed on your feet.\n\nStep 3: Execute Press the kettlebell overhead by extending your arm while simultaneously using your legs to generate upward momentum, keeping your wrist straight and your shoulder stable.\n\nStep 4: Return/Repeat Lower the kettlebell back to shoulder height in a controlled manner, then repeat for the desired number of repetitions before switching arms.",
    "coachingCues": [],
    "primaryEquipment": [
      "Kettlebell"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/k4q6HkT99iA/hqdefault.jpg",
    "videoId": "k4q6HkT99iA",
    "videoUrl": "https://www.youtube.com/watch?v=k4q6HkT99iA"
  },
  {
    "id": "407941bf-8ee5-471b-8f5b-2b9b3075365e",
    "name": "Ice Skater With Stabilization",
    "slug": "ice-skater-with-stabilization-0128",
    "description": "Step 1: Setup Stand on your right leg with your left leg slightly behind you, arms at your sides, and your core engaged.\n\nStep 2: Brace/Position Shift your weight onto your right leg, bending your knee slightly while keeping your torso upright and your hips level.\n\nStep 3: Execute Jump laterally to your left, landing softly on your left leg while extending your right leg behind you and swinging your arms for balance.\n\nStep 4: Return/Repeat Stabilize on your left leg for a moment, then jump back to the right leg, continuing to alternate sides for the desired repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes"
    ],
    "imageUrl": "https://img.youtube.com/vi/ViVoHbYwT-Y/hqdefault.jpg",
    "videoId": "ViVoHbYwT-Y",
    "videoUrl": "https://www.youtube.com/watch?v=ViVoHbYwT-Y"
  },
  {
    "id": "06773f37-8083-4cdd-be86-2cf5ebde2e3b",
    "name": "Transverse Slalom",
    "slug": "transverse-slalom-0157",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, knees slightly bent, and hold a medicine ball at chest level.\n\nStep 2: Brace/Position Engage your core, keeping your back straight and shoulders relaxed, while positioning the medicine ball close to your body.\n\nStep 3: Execute Rotate your torso to one side, pivoting on your feet, and then quickly shift your weight to the opposite side while moving the medicine ball across your body in a slalom motion.\n\nStep 4: Return/Repeat Reverse the movement back to the starting position and repeat for the desired number of repetitions, maintaining control and stability throughout.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/rTWU9qDQNgo/hqdefault.jpg",
    "videoId": "rTWU9qDQNgo",
    "videoUrl": "https://www.youtube.com/watch?v=rTWU9qDQNgo"
  },
  {
    "id": "40cb1549-060d-4b6d-8798-6e2f14a954da",
    "name": "Single Arm Kettlebell High Pull",
    "slug": "single-arm-kettlebell-high-pull-0148",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a kettlebell in one hand with a neutral grip, positioned between your feet.\n\nStep 2: Brace/Position Hinge at your hips while keeping your back straight, allowing the kettlebell to swing slightly back between your legs, and engage your core.\n\nStep 3: Execute Drive through your hips to propel the kettlebell upward, pulling it towards your shoulder while keeping your elbow above your wrist and your arm close to your body.\n\nStep 4: Return/Repeat Lower the kettlebell back down in a controlled manner, allowing it to swing back between your legs before repeating the movement for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Kettlebell"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/mP1BHxBeAEM/hqdefault.jpg",
    "videoId": "mP1BHxBeAEM",
    "videoUrl": "https://www.youtube.com/watch?v=mP1BHxBeAEM"
  },
  {
    "id": "c0fe2c24-0393-4115-ad83-1cb4f0bcce61",
    "name": "Lateral Band Walking",
    "slug": "lateral-band-walking-0160",
    "description": "Step 1: Setup Stand with your feet hip-width apart and place a resistance band around your legs, just above the knees.\n\nStep 2: Brace/Position Bend your knees slightly and hinge at the hips, keeping your chest up and core engaged.\n\nStep 3: Execute Step to the right with your right foot, followed by your left foot, maintaining tension in the band throughout the movement.\n\nStep 4: Return/Repeat Continue stepping to the right for a designated number of steps, then return to the left using the same pattern.",
    "coachingCues": [],
    "primaryEquipment": [
      "Band or Tube"
    ],
    "muscleGroups": [
      "glutes",
      "legs"
    ],
    "imageUrl": "https://img.youtube.com/vi/M5uxEQH5BUM/hqdefault.jpg",
    "videoId": "M5uxEQH5BUM",
    "videoUrl": "https://www.youtube.com/watch?v=M5uxEQH5BUM"
  },
  {
    "id": "1f498349-016c-499e-a698-c874b532febc",
    "name": "Repeat Hurdle Jump Frontal",
    "slug": "repeat-hurdle-jump-frontal-0178",
    "description": "Step 1: Stand with your feet shoulder-width apart and knees slightly bent, preparing to jump.\n\nStep 2: Bend your knees and swing your arms back to generate momentum.\n\nStep 3: Explode upward, jumping over an imaginary hurdle while driving your knees up towards your chest.\n\nStep 4: Land softly with your knees slightly bent and immediately prepare for the next jump.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/LBiNOM5_-j4/hqdefault.jpg",
    "videoId": "LBiNOM5_-j4",
    "videoUrl": "https://www.youtube.com/watch?v=LBiNOM5_-j4"
  },
  {
    "id": "61f7d960-4f6f-453c-b61e-6b36e2ec2fb0",
    "name": "Two Ins Ladder Drill",
    "slug": "two-ins-ladder-drill-0151",
    "description": "Step 1: Setup Stand facing the agility ladder with your feet shoulder-width apart, ensuring the ladder is flat on the ground.\n\nStep 2: Brace/Position Begin with a slight bend in your knees and engage your core, preparing to move quickly through the ladder.\n\nStep 3: Execute Step into the first square of the ladder with your right foot, followed by your left foot, then step out to the right side with your right foot, and finally bring your left foot to meet it.\n\nStep 4: Return/Repeat Move to the next square and repeat the same pattern, alternating your leading foot with each repetition as you progress down the ladder.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "full body"
    ],
    "imageUrl": "https://img.youtube.com/vi/GKDY4urn2kQ/hqdefault.jpg",
    "videoId": "GKDY4urn2kQ",
    "videoUrl": "https://www.youtube.com/watch?v=GKDY4urn2kQ"
  },
  {
    "id": "449f7ec4-a9da-41b3-8243-961cd1cc2dc5",
    "name": "Activation Ball Prone Shoulder Ext Rotation",
    "slug": "activation-ball-prone-shoulder-ext-rotation-0006",
    "description": "Step 1: Setup Lie face down on a mat with your legs extended and feet hip-width apart, holding an activation ball between your hands, positioned under your forehead.\n\nStep 2: Brace/Position Engage your core and maintain a neutral spine, ensuring your shoulders are relaxed and away from your ears while keeping your elbows bent at 90 degrees.\n\nStep 3: Execute Squeeze the activation ball and rotate your shoulders outward, lifting your forearms off the ground while keeping your elbows close to your body.\n\nStep 4: Return/Repeat Slowly lower your forearms back to the ground, maintaining control, and repeat the movement for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/Ck26oIpb6tg/hqdefault.jpg",
    "videoId": "Ck26oIpb6tg",
    "videoUrl": "https://www.youtube.com/watch?v=Ck26oIpb6tg"
  },
  {
    "id": "54ca19a3-be1a-4a67-8809-60274f3d10a4",
    "name": "Squat To Single Arm Row",
    "slug": "squat-to-single-arm-row-0243",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a dumbbell in your right hand with your arm fully extended toward the floor.\n\nStep 2: Brace/Position Engage your core, keeping your chest up and shoulders back, and initiate the squat by bending at the hips and knees while lowering your body.\n\nStep 3: Execute As you reach the bottom of the squat, pull the dumbbell towards your ribcage with your right arm, squeezing your shoulder blade at the top of the movement.\n\nStep 4: Return/Repeat Lower the dumbbell back to the starting position as you rise from the squat, then repeat for the desired number of repetitions before switching to the left arm.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "biceps",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/dSf1abuGONU/hqdefault.jpg",
    "videoId": "dSf1abuGONU",
    "videoUrl": "https://www.youtube.com/watch?v=dSf1abuGONU"
  },
  {
    "id": "2be6cc11-206e-49f0-b8d0-20170db04e56",
    "name": "Box Jump Up With Stabilization Transverse",
    "slug": "box-jump-up-with-stabilization-transverse-0172",
    "description": "Step 1: Stand in front of the box or step with your feet shoulder-width apart and knees slightly bent.\n\nStep 2: Bend your knees and swing your arms back to generate momentum, then explosively jump onto the box, landing softly with your feet flat.\n\nStep 3: Stabilize your position by engaging your core and holding for a moment before stepping back down.\n\nStep 4: Step down carefully, reset your stance, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Box or Step"
    ],
    "muscleGroups": [
      "calves",
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/z8ks1w0rnxM/hqdefault.jpg",
    "videoId": "z8ks1w0rnxM",
    "videoUrl": "https://www.youtube.com/watch?v=z8ks1w0rnxM"
  },
  {
    "id": "539f190c-2402-42f4-a40e-366e9c669618",
    "name": "Repeat Squat Jumps Frontal",
    "slug": "repeat-squat-jumps-frontal-0182",
    "description": "Step 1: Stand with your feet shoulder-width apart and engage your core.\n\nStep 2: Lower into a squat by bending your knees and pushing your hips back, keeping your chest up.\n\nStep 3: Explode upward from the squat position, jumping as high as you can while extending your arms overhead.\n\nStep 4: Land softly back into the squat position, absorbing the impact with your knees slightly bent before repeating.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/k9Yt7ohA_rE/hqdefault.jpg",
    "videoId": "k9Yt7ohA_rE",
    "videoUrl": "https://www.youtube.com/watch?v=k9Yt7ohA_rE"
  },
  {
    "id": "3ec8001e-6413-4b2a-b1b3-565a41156725",
    "name": "Pull Up",
    "slug": "pull-up",
    "description": "Step 1: Grab the pull-up bar with a 1-1.5x shoulder width grip, palms facing away from you. Draw in and brace the abs. Slightly pack the shoulders back and down.\n\nStep 2: Pull the body upward driving the chest toward the bar/handles until the arms/elbows are packed into the side of the body. Drive the shoulder blades back and down as you do.\n\nStep 3: Reverse the pattern and return to starting position.\n\nStep 4: Repeat. Maintain posture throughout. Avoid shrugging the shoulders, arching the lower back, swinging, jutting the head forward or not fully extending the elbows on the descent.",
    "coachingCues": [],
    "primaryEquipment": [
      "Pull-Up Bar"
    ],
    "muscleGroups": [
      "back",
      "biceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/9yVGh3XbJ34/hqdefault.jpg",
    "videoId": "9yVGh3XbJ34",
    "videoUrl": "https://www.youtube.com/watch?v=9yVGh3XbJ34"
  },
  {
    "id": "715cd116-279b-4717-a7da-43c5c1a6b175",
    "name": "Foam Roll Latissimus Dorsi",
    "slug": "foam-roll-latissimus-dorsi",
    "description": "Step 1: Lay down with the foam roller under your arm pit. Using your arms for support, increase the amount of pressure on the muscle until you feel a manageable level of tenderness.\n\nStep 2: Then, roll the length of the muscle to about mid rib area at about 1 inch per second looking for the most tender area.\n\nStep 3: Once you've found the most tender area, hold the position and pressure there for the recommended time. Maintain posture throughout.\n\nStep 4: Repeat on the other side. Avoid continuous movement, letting the head fall forward or holding your breath.",
    "coachingCues": [],
    "primaryEquipment": [
      "Foam Roller"
    ],
    "muscleGroups": [
      "chest"
    ],
    "imageUrl": "https://img.youtube.com/vi/5S2suclGl7o/hqdefault.jpg",
    "videoId": "5S2suclGl7o",
    "videoUrl": "https://www.youtube.com/watch?v=5S2suclGl7o"
  },
  {
    "id": "262d3002-c12e-49a6-86d0-ab677aa2904a",
    "name": "Quadruped Leg Raise",
    "slug": "quadruped-leg-raise-0084",
    "description": "Step 1: Setup Begin in a quadruped position on all fours, with your hands directly under your shoulders and knees under your hips.\n\nStep 2: Brace/Position Engage your core and maintain a neutral spine, ensuring your head is in line with your back and your gaze is directed towards the floor.\n\nStep 3: Execute Lift your right leg towards the ceiling, keeping your knee bent at 90 degrees and your foot flexed, while maintaining stability in your core and hips.\n\nStep 4: Return/Repeat Lower your right leg back to the starting position and repeat for the desired number of repetitions before switching to the left leg.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/TJbnvoFkLKI/hqdefault.jpg",
    "videoId": "TJbnvoFkLKI",
    "videoUrl": "https://www.youtube.com/watch?v=TJbnvoFkLKI"
  },
  {
    "id": "ed7ab179-1337-4d03-b053-f8a38f9745f9",
    "name": "Repeat Squat Jumps Transverse",
    "slug": "repeat-squat-jumps-transverse-0184",
    "description": "Step 1: Stand with your feet shoulder-width apart and engage your core.\n\nStep 2: Lower into a squat position, keeping your chest up and knees behind your toes.\n\nStep 3: Explode upward into a jump, rotating your body 90 degrees to the side as you ascend.\n\nStep 4: Land softly back into a squat position, ready to repeat the jump in the opposite direction.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/wfbn8QUHqo0/hqdefault.jpg",
    "videoId": "wfbn8QUHqo0",
    "videoUrl": "https://www.youtube.com/watch?v=wfbn8QUHqo0"
  },
  {
    "id": "97519c9e-124a-4ee4-8307-d36980b93f4a",
    "name": "Dumbbell Squat To Overhead Press",
    "slug": "dumbbell-squat-to-overhead-press-0115",
    "description": "Step 1: Setup Stand with feet shoulder-width apart, holding a dumbbell in each hand at shoulder height with palms facing forward.\n\nStep 2: Brace/Position Engage your core, keeping your chest up and back straight, while slightly bending your knees in preparation for the squat.\n\nStep 3: Execute Lower your body into a squat by bending at the hips and knees, keeping the dumbbells at shoulder height, then press through your heels to stand up while simultaneously pressing the dumbbells overhead.\n\nStep 4: Return/Repeat Lower the dumbbells back to shoulder height as you descend into the squat again, maintaining control throughout the movement.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/9k6IfkGBAVQ/hqdefault.jpg",
    "videoId": "9k6IfkGBAVQ",
    "videoUrl": "https://www.youtube.com/watch?v=9k6IfkGBAVQ"
  },
  {
    "id": "7a8db49f-9a03-4a1c-ace6-0f3b8f1bf480",
    "name": "Dumbbell Squat To Overhead Press",
    "slug": "dumbbell-squat-to-overhead-press-0116",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a dumbbell in each hand at shoulder height with palms facing forward.\n\nStep 2: Brace/Position Engage your core, keep your chest up, and maintain a neutral spine as you prepare to squat.\n\nStep 3: Execute Lower your body into a squat by bending your knees and pushing your hips back, then drive through your heels to stand up while pressing the dumbbells overhead until your arms are fully extended.\n\nStep 4: Return/Repeat Lower the dumbbells back to shoulder height as you descend into the squat again, maintaining control throughout the movement.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/9k6IfkGBAVQ/hqdefault.jpg",
    "videoId": "9k6IfkGBAVQ",
    "videoUrl": "https://www.youtube.com/watch?v=9k6IfkGBAVQ"
  },
  {
    "id": "a5804a85-9548-4ce1-afb6-cf0b73c4f4b8",
    "name": "Single Leg Single Arm Scaption",
    "slug": "single-leg-single-arm-scaption-0215",
    "description": "Step 1: Setup Stand on your right leg with your left knee lifted to hip height, holding a dumbbell in your right hand at your side.\n\nStep 2: Brace/Position Engage your core, maintain a neutral spine, and slightly bend your right knee while keeping your left leg stable.\n\nStep 3: Execute Raise the dumbbell diagonally in front of you at a 45-degree angle, lifting it to shoulder height while keeping your elbow slightly bent.\n\nStep 4: Return/Repeat Lower the dumbbell back to the starting position with control, then repeat for the desired number of repetitions before switching to the left leg.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes"
    ],
    "imageUrl": "https://img.youtube.com/vi/ikMg_3_jAWE/hqdefault.jpg",
    "videoId": "ikMg_3_jAWE",
    "videoUrl": "https://www.youtube.com/watch?v=ikMg_3_jAWE"
  },
  {
    "id": "f2967323-2edd-4d01-ace0-a952a6ce7a20",
    "name": "Single Leg Single Arm Scaption",
    "slug": "single-leg-single-arm-scaption-0036",
    "description": "Step 1: Setup Stand on your right leg with a slight bend in the knee, holding a dumbbell in your left hand at your side.\n\nStep 2: Brace/Position Engage your core, maintain a neutral spine, and lift your left arm to shoulder height, keeping your elbow slightly bent.\n\nStep 3: Execute Raise your left arm diagonally upward at a 30-degree angle from your body while maintaining balance on your right leg.\n\nStep 4: Return/Repeat Lower your left arm back to the starting position and repeat for the desired number of repetitions before switching legs.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes"
    ],
    "imageUrl": "https://img.youtube.com/vi/P7NmvKXWfyI/hqdefault.jpg",
    "videoId": "P7NmvKXWfyI",
    "videoUrl": "https://www.youtube.com/watch?v=P7NmvKXWfyI"
  },
  {
    "id": "f636f59a-7671-4f5d-8668-d68bfe6aa3c1",
    "name": "Barbell Deadlift",
    "slug": "barbell-deadlift-0059",
    "description": "Step 1: Setup Stand with your feet hip-width apart, barbell positioned over the midfoot, and your shins close to the bar.\n\nStep 2: Brace/Position Bend at the hips and knees to grip the barbell with both hands just outside your legs, keeping your back flat and chest up.\n\nStep 3: Execute Drive through your heels, extending your hips and knees simultaneously to lift the barbell off the ground, keeping it close to your body.\n\nStep 4: Return/Repeat Lower the barbell by hinging at the hips and bending the knees, maintaining a flat back until the bar reaches the ground, then reset for the next repetition.",
    "coachingCues": [],
    "primaryEquipment": [
      "Barbell"
    ],
    "muscleGroups": [
      "back",
      "glutes",
      "hamstrings"
    ],
    "imageUrl": "https://img.youtube.com/vi/yPqv3ejnZvc/hqdefault.jpg",
    "videoId": "yPqv3ejnZvc",
    "videoUrl": "https://www.youtube.com/watch?v=yPqv3ejnZvc"
  },
  {
    "id": "e73a7c52-3f6e-46e2-a160-a6b78c4d31e5",
    "name": "Active Standing Adductor",
    "slug": "active-standing-adductor-0021",
    "description": "Step 1: Setup Stand with your feet hip-width apart, toes pointing forward, and engage your core while maintaining a neutral spine.\n\nStep 2: Brace/Position Shift your weight onto your left leg, keeping it slightly bent, and lift your right leg off the ground, keeping it straight and aligned with your body.\n\nStep 3: Execute Slowly raise your right leg out to the side, leading with your heel, while maintaining balance on your left leg.\n\nStep 4: Return/Repeat Lower your right leg back to the starting position and repeat for the desired number of repetitions before switching to the left leg.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/1opPpdhFabY/hqdefault.jpg",
    "videoId": "1opPpdhFabY",
    "videoUrl": "https://www.youtube.com/watch?v=1opPpdhFabY"
  },
  {
    "id": "190e3325-7df2-4cac-8ee0-db79c195d3a1",
    "name": "Active Standing Adductor",
    "slug": "active-standing-adductor-0022",
    "description": "Step 1: Setup Stand with your feet hip-width apart, weight evenly distributed on both legs, and engage your core.\n\nStep 2: Brace/Position Shift your weight onto your right leg, slightly bending the knee, while lifting your left leg out to the side, keeping it straight.\n\nStep 3: Execute Actively lift your left leg to the side, engaging your adductor muscles, and hold for a moment at the top of the movement.\n\nStep 4: Return/Repeat Lower your left leg back to the starting position and repeat for the desired number of repetitions before switching to the right leg.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/1opPpdhFabY/hqdefault.jpg",
    "videoId": "1opPpdhFabY",
    "videoUrl": "https://www.youtube.com/watch?v=1opPpdhFabY"
  },
  {
    "id": "c5e0d99e-02f0-431a-b0db-91a2b71a998f",
    "name": "Activation Standing Shoulder Ext Rotation",
    "slug": "activation-standing-shoulder-ext-rotation-0016",
    "description": "Step 1: Setup Stand tall with your feet shoulder-width apart, holding a resistance band with both hands at hip level, palms facing up.\n\nStep 2: Brace/Position Engage your core and retract your shoulder blades, keeping your elbows close to your body at a 90-degree angle.\n\nStep 3: Execute Rotate your shoulders externally by pulling the band apart, keeping your elbows fixed at your sides and squeezing your shoulder blades together.\n\nStep 4: Return/Repeat Slowly return to the starting position, maintaining control, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/SPeinjTytxM/hqdefault.jpg",
    "videoId": "SPeinjTytxM",
    "videoUrl": "https://www.youtube.com/watch?v=SPeinjTytxM"
  },
  {
    "id": "b8115d6c-ba97-4967-989d-ae5686852a91",
    "name": "Modified Push Up",
    "slug": "modified-push-up",
    "description": "Step 1: Assume a push up position on the knees with the body in a straight line from head to knee, feet/knees hip to shoulder width and hands 1.5-2x shoulder width. Brace the core and tighten the glutes. Press away from the floor to prevent the shoulder blades from winging.\n\nStep 2: Lower the chest toward the floor through a maximum range of motion until the chest is a few inches off the floor or shoulders have reached elbow depth.\n\nStep 3: Reverse the pattern and return to starting position.\n\nStep 4: Repeat. Maintain posture throughout. Keep the shoulders from elevating or rounding. Do not let the back round or arch or the hips sag or pike. Avoid letting the head jut forward.",
    "coachingCues": [],
    "primaryEquipment": [
      "None"
    ],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/PDr5B2jLUOw/hqdefault.jpg",
    "videoId": "PDr5B2jLUOw",
    "videoUrl": "https://www.youtube.com/watch?v=PDr5B2jLUOw"
  },
  {
    "id": "ced8c37d-8d2a-420e-b576-801803cbdb64",
    "name": "Reverse Lunge To Row",
    "slug": "reverse-lunge-to-row-0205",
    "description": "Step 1: Setup Stand with feet hip-width apart, holding a dumbbell in each hand at your sides.\n\nStep 2: Brace/Position Engage your core, step back with your right foot into a lunge, keeping your left knee aligned over your left ankle.\n\nStep 3: Execute As you lower into the lunge, pull the dumbbells towards your ribcage, squeezing your shoulder blades together.\n\nStep 4: Return/Repeat Push through your left heel to return to standing, lowering the dumbbells back to your sides, and repeat on the opposite leg.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "biceps",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/lKhZvT_NkOs/hqdefault.jpg",
    "videoId": "dcs7-vejMAY",
    "videoUrl": "https://www.youtube.com/watch?v=dcs7-vejMAY"
  },
  {
    "id": "6ef9e5ef-63e7-4e75-93df-bd783d3a04b5",
    "name": "Split Stance Row",
    "slug": "split-stance-row-0239",
    "description": "Step 1: Setup Stand in a split stance with your left foot forward and right foot back, holding a dumbbell in your right hand, arm extended towards the floor.\n\nStep 2: Brace/Position Engage your core, keeping your back straight and hinge slightly at the hips, allowing your torso to lean forward at about a 45-degree angle.\n\nStep 3: Execute Pull the dumbbell towards your hip, bending your elbow and squeezing your shoulder blade towards your spine, maintaining a stable lower body.\n\nStep 4: Return/Repeat Lower the dumbbell back to the starting position with control, then repeat for the desired number of repetitions before switching sides.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "biceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/AV3CzcOcGls/hqdefault.jpg",
    "videoId": "AV3CzcOcGls",
    "videoUrl": "https://www.youtube.com/watch?v=AV3CzcOcGls"
  },
  {
    "id": "9ca7473a-9b63-4914-a861-b5b07fe45826",
    "name": "Split Stance Row",
    "slug": "split-stance-row-0240",
    "description": "Step 1: Setup Stand in a split stance with your left foot forward and right foot back, holding a dumbbell in your right hand, with your left hand resting on your left thigh for support.\n\nStep 2: Brace/Position Engage your core and maintain a neutral spine, ensuring your shoulders are pulled back and down away from your ears.\n\nStep 3: Execute Pull the dumbbell towards your hip by bending your elbow and squeezing your shoulder blade towards your spine, keeping your upper arm close to your body.\n\nStep 4: Return/Repeat Lower the dumbbell back to the starting position with control, fully extending your arm, and repeat for the desired number of repetitions before switching sides.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "biceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/AV3CzcOcGls/hqdefault.jpg",
    "videoId": "AV3CzcOcGls",
    "videoUrl": "https://www.youtube.com/watch?v=AV3CzcOcGls"
  },
  {
    "id": "572d0c5c-5e5d-4f2d-91e1-0b9490918f1e",
    "name": "Activation Ball Prone Shoulder Press",
    "slug": "activation-ball-prone-shoulder-press-0007",
    "description": "Step 1: Setup Position yourself on your stomach on an activation ball, ensuring your feet are hip-width apart and your body is in a straight line from head to heels.\n\nStep 2: Brace/Position Engage your core and stabilize your hips, then extend your arms straight down towards the floor, holding a light dumbbell in each hand.\n\nStep 3: Execute Press the dumbbells upward in a controlled manner until your arms are fully extended above your shoulders, keeping your elbows slightly bent.\n\nStep 4: Return/Repeat Lower the dumbbells back to the starting position with control, maintaining core engagement, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/VZJ0PHuNrYI/hqdefault.jpg",
    "videoId": "VZJ0PHuNrYI",
    "videoUrl": "https://www.youtube.com/watch?v=VZJ0PHuNrYI"
  },
  {
    "id": "bf07feae-17af-4720-b8e4-0e5c1d80634d",
    "name": "Power Step Up",
    "slug": "power-step-up-0176",
    "description": "Step 1: Stand facing the box or step with your feet hip-width apart and your core engaged.\n\nStep 2: Shift your weight onto one foot and place the other foot firmly on the box or step.\n\nStep 3: Push through the heel of the foot on the box to lift your body up, bringing the opposite knee toward your chest.\n\nStep 4: Lower yourself back down to the starting position with control and repeat on the other side.",
    "coachingCues": [],
    "primaryEquipment": [
      "Box or Step"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/UCsdLEqtWSg/hqdefault.jpg",
    "videoId": "UCsdLEqtWSg",
    "videoUrl": "https://www.youtube.com/watch?v=UCsdLEqtWSg"
  },
  {
    "id": "a4dd5d3d-64b6-42bc-aaa7-8febe1db7af9",
    "name": "Prisoner Squat Calf Raise",
    "slug": "prisoner-squat-calf-raise-0123",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, toes slightly pointed out, and place your hands behind your head with elbows flared out.\n\nStep 2: Brace/Position Engage your core, keeping your chest up and back straight, while maintaining a neutral spine.\n\nStep 3: Execute Lower your body into a squat by bending at the knees and hips, then rise back up to standing while simultaneously lifting your heels off the ground into a calf raise.\n\nStep 4: Return/Repeat Lower your heels back to the ground, return to the starting squat position, and repeat the movement for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/Xz0PPBZO2xc/hqdefault.jpg",
    "videoId": "Xz0PPBZO2xc",
    "videoUrl": "https://www.youtube.com/watch?v=Xz0PPBZO2xc"
  },
  {
    "id": "cab0e1e9-ca74-4320-a4ba-a434a29592ac",
    "name": "Prisoner Squat Calf Raise",
    "slug": "prisoner-squat-calf-raise-0124",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, toes slightly pointed out, and place your hands behind your head with elbows flared out.\n\nStep 2: Brace/Position Engage your core, keeping your chest up and back straight as you prepare to squat.\n\nStep 3: Execute Lower your body into a squat by bending at the knees and hips, keeping your weight on your heels, then rise back up and immediately lift your heels off the ground into a calf raise.\n\nStep 4: Return/Repeat Lower your heels back to the ground, return to the squat position, and repeat the movement for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/Xz0PPBZO2xc/hqdefault.jpg",
    "videoId": "Xz0PPBZO2xc",
    "videoUrl": "https://www.youtube.com/watch?v=Xz0PPBZO2xc"
  },
  {
    "id": "43d27492-4839-4f2d-983e-fbb7f2256073",
    "name": "Squat Jump",
    "slug": "squat-jump",
    "description": "Step 1: Stand with your feet hip to shoulder width apart and toes pointing straight ahead. Draw in the belly button.\n\nStep 2: Rapidly descend to a depth that feels explosive (typically around a quarter squat) while pulling the arms back to the side.\n\nStep 3: Quickly and powerfully reverse the pattern and jump up, raising the arms above the head. Land as quietly as possible and immediately begin the next repetition. Maintain posture throughout.\n\nStep 4: Repeat for the desired number of repetitions. Avoid knees collapsing inward, back arching or slouching, or uncontrolled head movement.",
    "coachingCues": [],
    "primaryEquipment": [
      "None"
    ],
    "muscleGroups": [
      "calves",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/tZSYZdtbONc/hqdefault.jpg",
    "videoId": "tZSYZdtbONc",
    "videoUrl": "https://www.youtube.com/watch?v=tZSYZdtbONc"
  },
  {
    "id": "608b30ce-2965-4150-90e0-103d7c0e0e28",
    "name": "Half Kneeling Throw And Catch",
    "slug": "half-kneeling-throw-and-catch-0077",
    "description": "Step 1: Setup Begin in a half-kneeling position with your right knee on the ground and your left foot flat on the floor, ensuring your left knee is at a 90-degree angle.\n\nStep 2: Brace/Position Hold a medicine ball or weighted object with both hands at chest level, engaging your core and maintaining an upright posture.\n\nStep 3: Execute Rotate your torso to the left, then explosively throw the ball to a partner or against a wall, using your core and upper body to generate power.\n\nStep 4: Return/Repeat Catch the ball as it returns, then rotate back to the starting position, maintaining control and stability before repeating the throw.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/WX6YNwM5ycU/hqdefault.jpg",
    "videoId": "WX6YNwM5ycU",
    "videoUrl": "https://www.youtube.com/watch?v=WX6YNwM5ycU"
  },
  {
    "id": "cb486a8a-4ecd-4532-8e8c-d6d71cb57dfd",
    "name": "Dumbbell Bent Over Row",
    "slug": "dumbbell-bent-over-row-0096",
    "description": "Step 1: Setup Stand with feet hip-width apart, holding a dumbbell in each hand with a neutral grip, and hinge at the hips to lower your torso until it's nearly parallel to the ground.\n\nStep 2: Brace/Position Engage your core, keep your back straight, and allow your arms to hang straight down from your shoulders, with a slight bend in your elbows.\n\nStep 3: Execute Pull the dumbbells towards your lower ribcage by bending your elbows and squeezing your shoulder blades together, keeping your elbows close to your body.\n\nStep 4: Return/Repeat Slowly lower the dumbbells back to the starting position, fully extending your arms while maintaining a stable torso, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "back",
      "biceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/DJfQN6xJL28/hqdefault.jpg",
    "videoId": "DJfQN6xJL28",
    "videoUrl": "https://www.youtube.com/watch?v=DJfQN6xJL28"
  },
  {
    "id": "067424d7-272e-4cfd-a2ac-3e218ded2f4a",
    "name": "Dumbbell Rack Carry",
    "slug": "dumbbell-rack-carry-0107",
    "description": "Step 1: Setup Stand upright with a dumbbell in each hand, arms fully extended at your sides, feet shoulder-width apart.\n\nStep 2: Brace/Position Engage your core, keep your shoulders back and down, and maintain a neutral spine.\n\nStep 3: Execute Begin walking forward in a straight line, maintaining an upright posture and controlled pace, while keeping the dumbbells stable at your sides.\n\nStep 4: Return/Repeat Walk for a designated distance or time, then carefully set the dumbbells down on the ground before resting or repeating the exercise.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "back",
      "shoulders"
    ],
    "imageUrl": "https://img.youtube.com/vi/IA2tycCS8DI/hqdefault.jpg",
    "videoId": "IA2tycCS8DI",
    "videoUrl": "https://www.youtube.com/watch?v=IA2tycCS8DI"
  },
  {
    "id": "b7321bd5-f79d-4d52-8c50-4d3dcbf27ed1",
    "name": "Long Lever Ball Crunch",
    "slug": "long-lever-ball-crunch-0073",
    "description": "Step 1: Setup Lie on your back on a mat with your knees bent and feet flat on the ground, holding a stability ball above your chest with both hands.\n\nStep 2: Brace/Position Engage your core by pulling your navel towards your spine and extend your arms and the ball overhead while keeping your elbows slightly bent.\n\nStep 3: Execute Lift your upper body off the mat by curling your torso towards your thighs, bringing the ball towards your knees while maintaining a neutral spine.\n\nStep 4: Return/Repeat Slowly lower your upper body back to the mat, extending your arms and the ball overhead to return to the starting position, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/YkEu2Hs3gw8/hqdefault.jpg",
    "videoId": "YkEu2Hs3gw8",
    "videoUrl": "https://www.youtube.com/watch?v=YkEu2Hs3gw8"
  },
  {
    "id": "4e9fad51-3c1d-4966-8cd5-369dede24e4f",
    "name": "Double Kettlebell Snatch",
    "slug": "double-kettlebell-snatch-0135",
    "description": "Step 1: Setup Stand with feet shoulder-width apart, holding a kettlebell in each hand with a neutral grip, positioned between your legs.\n\nStep 2: Brace/Position Hinge at the hips, slightly bend your knees, and engage your core while keeping your back straight and chest up.\n\nStep 3: Execute Forcefully extend your hips and knees, driving the kettlebells upward, and pull them close to your body as you transition into an overhead position.\n\nStep 4: Return/Repeat Lower the kettlebells back to the starting position by reversing the movement, ensuring control throughout, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Kettlebell"
    ],
    "muscleGroups": [
      "back",
      "glutes",
      "hamstrings",
      "quadriceps",
      "shoulders"
    ],
    "imageUrl": "https://img.youtube.com/vi/p7Evs2D5aZc/hqdefault.jpg",
    "videoId": "p7Evs2D5aZc",
    "videoUrl": "https://www.youtube.com/watch?v=p7Evs2D5aZc"
  },
  {
    "id": "03622b11-e63d-4ef7-b936-5ef4245f6763",
    "name": "Hand To Hand Kettlebell Swing",
    "slug": "hand-to-hand-kettlebell-swing-0140",
    "description": "Step 1: Setup Stand with feet shoulder-width apart, holding a kettlebell in one hand with a neutral grip, arms extended in front of you.\n\nStep 2: Brace/Position Engage your core, hinge at the hips, and slightly bend your knees while allowing the kettlebell to swing back between your legs.\n\nStep 3: Execute Drive through your hips to propel the kettlebell forward, swinging it to shoulder height while switching hands at the top of the movement.\n\nStep 4: Return/Repeat Allow the kettlebell to swing back down between your legs, switch hands again, and repeat the movement for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Kettlebell"
    ],
    "muscleGroups": [
      "back",
      "glutes",
      "hamstrings",
      "quadriceps",
      "shoulders"
    ],
    "imageUrl": "https://img.youtube.com/vi/KKumMhxKapw/hqdefault.jpg",
    "videoId": "KKumMhxKapw",
    "videoUrl": "https://www.youtube.com/watch?v=KKumMhxKapw"
  },
  {
    "id": "7dc2764e-12ab-464f-a1ac-9134665686e4",
    "name": "One Ins Ladder Drill",
    "slug": "one-ins-ladder-drill-0150",
    "description": "Step 1: Setup Stand with your feet hip-width apart, facing the ladder, ensuring the ladder is flat on the ground.\n\nStep 2: Brace/Position Engage your core, maintain a slight bend in your knees, and keep your chest up as you prepare to move.\n\nStep 3: Execute Step into the first square of the ladder with your right foot, followed by your left foot, then quickly step out with your right foot to the side of the ladder.\n\nStep 4: Return/Repeat Move back to the starting position by stepping back into the ladder with your left foot, followed by your right foot, and repeat the sequence for the desired duration.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/em63lCvm9CM/hqdefault.jpg",
    "videoId": "em63lCvm9CM",
    "videoUrl": "https://www.youtube.com/watch?v=em63lCvm9CM"
  },
  {
    "id": "74ec1c2c-21d5-44ff-a806-9aef21e22669",
    "name": "Jumping Jacks",
    "slug": "jumping-jacks",
    "description": "Step 1: Stand with your feet together and arms at your sides.\n\nStep 2: Jump up while spreading your legs shoulder-width apart and raising your arms overhead.\n\nStep 3: Land softly with your feet back together and arms at your sides.\n\nStep 4: Repeat the movement continuously at a steady pace.",
    "coachingCues": [],
    "primaryEquipment": [
      "None"
    ],
    "muscleGroups": [
      "calves",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/uLVt6u15L98/hqdefault.jpg",
    "videoId": "uLVt6u15L98",
    "videoUrl": "https://www.youtube.com/watch?v=uLVt6u15L98"
  },
  {
    "id": "971fcfc4-5bdd-4ce4-99ea-bbe35c346bf3",
    "name": "Step Up To Balance Sagital",
    "slug": "step-up-to-balance-sagital-0049",
    "description": "Step 1: Setup Stand in front of a sturdy step or platform with your feet hip-width apart.\n\nStep 2: Brace/Position Engage your core and place your right foot firmly on the step, ensuring your knee is aligned over your ankle.\n\nStep 3: Execute Push through your right heel to lift your body onto the step, bringing your left knee up to a 90-degree angle for balance.\n\nStep 4: Return/Repeat Lower your left leg back to the ground and step down with your right foot, then repeat the movement on the opposite side.",
    "coachingCues": [],
    "primaryEquipment": [
      "Box or Step"
    ],
    "muscleGroups": [
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/k0_42mij5Fc/hqdefault.jpg",
    "videoId": "k0_42mij5Fc",
    "videoUrl": "https://www.youtube.com/watch?v=k0_42mij5Fc"
  },
  {
    "id": "bc4eed6d-f2c9-4e17-82d6-32d167aed777",
    "name": "Step Up To Balance Sagital",
    "slug": "step-up-to-balance-sagital-0050",
    "description": "Step 1: Setup Stand facing a sturdy bench or step with your feet hip-width apart and your weight evenly distributed.\n\nStep 2: Brace/Position Place your right foot firmly on the bench, ensuring your entire foot is in contact, and engage your core while maintaining an upright torso.\n\nStep 3: Execute Press through your right heel to lift your body upward, extending your right leg fully while bringing your left knee up toward your chest to achieve balance.\n\nStep 4: Return/Repeat Lower your left leg back to the ground and step down with your right foot, returning to the starting position. Repeat for the desired number of repetitions before switching to the left leg.",
    "coachingCues": [],
    "primaryEquipment": [
      "Box or Step"
    ],
    "muscleGroups": [
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/k0_42mij5Fc/hqdefault.jpg",
    "videoId": "k0_42mij5Fc",
    "videoUrl": "https://www.youtube.com/watch?v=k0_42mij5Fc"
  },
  {
    "id": "45bcd25e-18d3-499c-85b9-0dd2fdedb024",
    "name": "Split Jerk",
    "slug": "split-jerk-0238",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, barbell resting on your upper chest with elbows slightly in front, and grip the barbell just outside shoulder width.\n\nStep 2: Brace/Position Engage your core, maintain a neutral spine, and position your feet in a staggered stance with one foot slightly forward.\n\nStep 3: Execute Dip slightly by bending your knees, then explosively extend your hips and knees while pressing the barbell overhead, splitting your feet into a lunge position.\n\nStep 4: Return/Repeat Lower the barbell back to your upper chest, return to the starting stance, and prepare for the next repetition.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/UcYVQWjygSw/hqdefault.jpg",
    "videoId": "UcYVQWjygSw",
    "videoUrl": "https://www.youtube.com/watch?v=UcYVQWjygSw"
  },
  {
    "id": "f6b1d583-aa32-4dcf-84b8-189e66a9122b",
    "name": "Lunge To Balance Frontal",
    "slug": "lunge-to-balance-frontal-0164",
    "description": "Step 1: Setup Stand with your feet hip-width apart and engage your core, ensuring your shoulders are relaxed and your chest is up.\n\nStep 2: Brace/Position Step forward with your right foot into a lunge, lowering your back knee toward the ground while keeping your front knee aligned over your ankle.\n\nStep 3: Execute Push through your right heel to rise up, bringing your left knee up to hip height while balancing on your right leg.\n\nStep 4: Return/Repeat Lower your left leg back down to the ground, step back into the starting position, and alternate legs for the desired repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/WFmIGf0kyEs/hqdefault.jpg",
    "videoId": "WFmIGf0kyEs",
    "videoUrl": "https://www.youtube.com/watch?v=WFmIGf0kyEs"
  },
  {
    "id": "1e2e74bb-bbd7-4f12-9442-03546fd7e9ca",
    "name": "Static Standing Adductor Stretch",
    "slug": "static-standing-adductor-stretch-0258",
    "description": "Step 1: Setup Stand upright with your feet shoulder-width apart and your hands on your hips.\n\nStep 2: Brace/Position Shift your weight to your right leg and extend your left leg out to the side, keeping it straight.\n\nStep 3: Execute Slowly lower your body towards the right side, feeling a stretch in your left inner thigh.\n\nStep 4: Return/Repeat Hold the stretch for 15-30 seconds, then return to the starting position and switch sides.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/IzHUoWs0maQ/hqdefault.jpg",
    "videoId": "IzHUoWs0maQ",
    "videoUrl": "https://www.youtube.com/watch?v=IzHUoWs0maQ"
  },
  {
    "id": "fa74ec24-373c-4137-a240-93b7775eade8",
    "name": "Supine Biceps Femoris Stretch",
    "slug": "supine-biceps-femoris-stretch-0264",
    "description": "Step 1: Setup Lie on your back on a flat surface with your legs extended straight and arms at your sides.\n\nStep 2: Brace/Position Bend your right knee and place your right foot flat on the ground, keeping your left leg straight.\n\nStep 3: Execute Using a strap or your hands, gently pull your left leg towards your chest while keeping it straight, feeling a stretch in the back of your thigh.\n\nStep 4: Return/Repeat Hold the stretch for 15-30 seconds, then slowly lower your left leg back to the ground and switch to the right leg.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/xO8CZWtfKDU/hqdefault.jpg",
    "videoId": "xO8CZWtfKDU",
    "videoUrl": "https://www.youtube.com/watch?v=xO8CZWtfKDU"
  },
  {
    "id": "1a4abced-da4e-4e2c-a179-c31e2186a56e",
    "name": "Supine Biceps Femoris Stretch",
    "slug": "supine-biceps-femoris-stretch-0265",
    "description": "Step 1: Setup Lie on your back on a flat surface with your legs extended straight and arms at your sides.\n\nStep 2: Brace/Position Bend one knee and bring that foot towards your glutes, keeping the opposite leg straight on the ground.\n\nStep 3: Execute Grasp the ankle of the bent leg with both hands and gently pull it towards your chest while keeping the opposite leg straight.\n\nStep 4: Return/Repeat Hold the stretch for 15-30 seconds, then switch legs and repeat the process.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/xO8CZWtfKDU/hqdefault.jpg",
    "videoId": "xO8CZWtfKDU",
    "videoUrl": "https://www.youtube.com/watch?v=xO8CZWtfKDU"
  },
  {
    "id": "c28c4002-3195-4c94-9e34-62ddb1f759bd",
    "name": "Core Ball Crunch",
    "slug": "core-ball-crunch-0069",
    "description": "Step 1: Setup Sit on a stability ball with your feet flat on the floor, hip-width apart, and your lower back supported by the ball.\n\nStep 2: Brace/Position Engage your core by pulling your navel towards your spine and lean back slightly, ensuring your head, neck, and shoulders are aligned with your spine.\n\nStep 3: Execute Contract your abdominal muscles to lift your torso off the ball, curling your upper body towards your hips while exhaling.\n\nStep 4: Return/Repeat Slowly lower your torso back to the starting position, maintaining control, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/lrqfw0n_GXI/hqdefault.jpg",
    "videoId": "lrqfw0n_GXI",
    "videoUrl": "https://www.youtube.com/watch?v=lrqfw0n_GXI"
  },
  {
    "id": "db47db4b-79ce-4fcb-a10a-2d2352a0502c",
    "name": "Barbell Back Squat",
    "slug": "barbell-back-squat-0056",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, barbell resting on your upper traps, and grip the bar with hands slightly wider than shoulder-width.\n\nStep 2: Brace/Position Engage your core, keep your chest up, and pull your shoulder blades together to stabilize your upper body.\n\nStep 3: Execute Lower your body by bending at the hips and knees, keeping your back straight and descending until your thighs are at least parallel to the ground.\n\nStep 4: Return/Repeat Push through your heels to return to the starting position, fully extending your hips and knees, then repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Barbell"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/-bJIpOq-LWk/hqdefault.jpg",
    "videoId": "-bJIpOq-LWk",
    "videoUrl": "https://www.youtube.com/watch?v=-bJIpOq-LWk"
  },
  {
    "id": "7ccaef6d-3131-4cb1-8bae-92d8f0e9a858",
    "name": "Supine Dumbbell Extension",
    "slug": "supine-dumbbell-extension-0117",
    "description": "Step 1: Setup Lie on your back on a flat bench with a dumbbell in each hand, arms extended above your chest, palms facing each other.\n\nStep 2: Brace/Position Engage your core and maintain a neutral spine, ensuring your feet are flat on the floor or resting on the bench.\n\nStep 3: Execute Slowly bend your elbows to lower the dumbbells towards your forehead, keeping your upper arms stationary and your elbows close to your head.\n\nStep 4: Return/Repeat Extend your arms back to the starting position, fully straightening your elbows while maintaining control, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/fwExa2A1Plc/hqdefault.jpg",
    "videoId": "fwExa2A1Plc",
    "videoUrl": "https://www.youtube.com/watch?v=fwExa2A1Plc"
  },
  {
    "id": "21c977b5-1ba0-4627-aa43-db3e5fb26f1d",
    "name": "Dumbbell Ball Combo Ii",
    "slug": "dumbbell-ball-combo-ii-0093",
    "description": "Step 1: Setup Hold a dumbbell in each hand, standing with your feet shoulder-width apart and a stability ball positioned against a wall at chest height.\n\nStep 2: Brace/Position Engage your core, maintain a neutral spine, and position the dumbbells at shoulder height with elbows bent.\n\nStep 3: Execute Press the dumbbells overhead while simultaneously pushing the stability ball away from your chest, extending your arms fully.\n\nStep 4: Return/Repeat Lower the dumbbells back to shoulder height and pull the stability ball back to your chest, maintaining control throughout the movement.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/Ok46ZtftfhU/hqdefault.jpg",
    "videoId": "Ok46ZtftfhU",
    "videoUrl": "https://www.youtube.com/watch?v=Ok46ZtftfhU"
  },
  {
    "id": "eaa123e7-2bd7-4d90-a3f3-c73d181fc6f4",
    "name": "Medicine Ball Step Over Push Up",
    "slug": "medicine-ball-step-over-push-up-0200",
    "description": "Step 1: Setup Position a medicine ball on the floor in front of you and kneel beside it, placing one hand on the ball and the other on the ground.\n\nStep 2: Brace/Position Engage your core and maintain a straight line from your head to your knees, ensuring your shoulders are directly over your hands.\n\nStep 3: Execute Lower your chest towards the ground into a push-up, then push back up to the starting position. As you rise, step over the medicine ball with your opposite hand.\n\nStep 4: Return/Repeat Repeat the push-up and step over movement, alternating sides with each repetition for the desired number of sets.",
    "coachingCues": [],
    "primaryEquipment": [
      "Medicine Ball",
      "Box or Step"
    ],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/-nuCpkC0I7s/hqdefault.jpg",
    "videoId": "-nuCpkC0I7s",
    "videoUrl": "https://www.youtube.com/watch?v=-nuCpkC0I7s"
  },
  {
    "id": "c4f776f5-fa6d-4623-b6ce-36ac635ae326",
    "name": "Lunge To Balance",
    "slug": "lunge-to-balance-0163",
    "description": "Step 1: Setup Stand tall with your feet hip-width apart and engage your core.\n\nStep 2: Brace/Position Step forward with your right leg into a lunge, ensuring your knee is directly above your ankle and your left knee hovers just above the ground.\n\nStep 3: Execute Push through your right heel to rise up, bringing your left knee up towards your chest, balancing on your right leg.\n\nStep 4: Return/Repeat Lower your left leg back to the ground, step back into the starting position, and alternate legs for the desired repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/UInwcEa5BH4/hqdefault.jpg",
    "videoId": "UInwcEa5BH4",
    "videoUrl": "https://www.youtube.com/watch?v=UInwcEa5BH4"
  },
  {
    "id": "90136476-eb11-410f-9be8-d4707a4736e9",
    "name": "Barbell Bench Press With Bands",
    "slug": "barbell-bench-press-with-bands",
    "description": "Step 1: Attach resistance bands or tubes around the barbell and anchor them to heavy dumbbells on the floor. Lie supine on your back with neutral spine on a bench with your feet straight and flat on the floor. Draw in and brace the abs and lock the shoulders blades back and down on the bench. Grasp the barbell at about 1.5 - 2x shoulder width ensuring the hands are evenly distributed on the bar.\n\nStep 2: Unrack the bar (always use a spotter if you are able) bringing it directly above the shoulders. Starting with arms extended, slowly lower the bar toward the mid to lower chest moving through the maximum comfortable range.\n\nStep 3: Reverse the pattern and return the starting position.\n\nStep 4: Repeat. Maintain posture throughout. Do not arch the back or jut the head forward. Avoid letting the shoulders round, posture shift or feet lift in the air. Keep the elbows under the bar to maintain balance at all times.",
    "coachingCues": [],
    "primaryEquipment": [
      "Bench",
      "Barbell",
      "Plates",
      "Safety Collars",
      "Band or Tube"
    ],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/N4H4o8k9WbE/hqdefault.jpg",
    "videoId": "N4H4o8k9WbE",
    "videoUrl": "https://www.youtube.com/watch?v=N4H4o8k9WbE"
  },
  {
    "id": "6648f5af-a808-4406-b6c8-58317be3c1c8",
    "name": "Squat Thrust Burpees",
    "slug": "squat-thrust-burpees",
    "description": "Step 1: Stand with your feet shoulder-width apart and lower into a squat position, placing your hands on the ground.\n\nStep 2: Jump your feet back into a plank position, keeping your body straight and core engaged.\n\nStep 3: Jump your feet back towards your hands to return to the squat position.\n\nStep 4: Explode upward into a jump, reaching your arms overhead before landing softly back into the starting position.",
    "coachingCues": [],
    "primaryEquipment": [
      "None"
    ],
    "muscleGroups": [
      "chest",
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/Ny8JWqh4lNg/hqdefault.jpg",
    "videoId": "Ny8JWqh4lNg",
    "videoUrl": "https://www.youtube.com/watch?v=Ny8JWqh4lNg"
  },
  {
    "id": "c4d741bc-93c2-468e-8167-9c84d73db6e3",
    "name": "Seated Single Arm Dumbbell Tricep Extension",
    "slug": "seated-single-arm-dumbbell-tricep-extension-0112",
    "description": "Step 1: Setup Sit on a bench or chair with your feet flat on the floor, holding a dumbbell in one hand.\n\nStep 2: Brace/Position Raise the dumbbell overhead with your elbow close to your ear, keeping your core engaged and back straight.\n\nStep 3: Execute Lower the dumbbell behind your head by bending your elbow, ensuring your upper arm remains stationary.\n\nStep 4: Return/Repeat Extend your arm back to the starting position, then repeat for the desired number of repetitions before switching arms.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/kZ-ReOdn2qk/hqdefault.jpg",
    "videoId": "kZ-ReOdn2qk",
    "videoUrl": "https://www.youtube.com/watch?v=kZ-ReOdn2qk"
  },
  {
    "id": "133e8ba9-e2ae-4b40-8915-023b3d7620ac",
    "name": "Barbell Overhead Press",
    "slug": "barbell-overhead-press-0062",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, grasp the barbell with an overhand grip slightly wider than shoulder-width, and position it at shoulder height.\n\nStep 2: Brace/Position Engage your core, retract your shoulder blades, and ensure your elbows are slightly in front of the barbell while keeping your wrists straight.\n\nStep 3: Execute Press the barbell overhead by extending your arms, keeping the bar in line with your head and maintaining a neutral spine throughout the movement.\n\nStep 4: Return/Repeat Lower the barbell back to shoulder height with control, ensuring your elbows remain slightly in front, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Barbell"
    ],
    "muscleGroups": [
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/cGnhixvC8uA/hqdefault.jpg",
    "videoId": "cGnhixvC8uA",
    "videoUrl": "https://www.youtube.com/watch?v=cGnhixvC8uA"
  },
  {
    "id": "5058acac-fce5-4c07-a86a-8dd7976439eb",
    "name": "Kettlebell Crush Curl With Squat",
    "slug": "kettlebell-crush-curl-with-squat",
    "description": "Step 1: Squat into a deep squat position with feet wider than shoulder width and toes rotated slightly out. Lock shoulder blades back and down and brace core.\n\nStep 2: Grip the kettlebell bottoms up (upside down) with handle positioned between forearms and hands wrapped around the bell. Slowly lower the kettlebell performing a bicep curl.\n\nStep 3: Once elbows have reached full extension, reverse the pattern and curl the weight up to the chest through a full range.\n\nStep 4: Repeat. Maintain posture throughout. Minimize shoulder forward roll or elbow swing behind or in front of body. Do not bottom out on the squat or let the hamstrings rest on the calves.",
    "coachingCues": [],
    "primaryEquipment": [
      "Kettlebell"
    ],
    "muscleGroups": [
      "biceps",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/BPGOyQKy9R0/hqdefault.jpg",
    "videoId": "BPGOyQKy9R0",
    "videoUrl": "https://www.youtube.com/watch?v=BPGOyQKy9R0"
  },
  {
    "id": "3fc7e565-a9b8-402e-8d18-162c1a601e62",
    "name": "Static Butterfly Stretch",
    "slug": "static-butterfly-stretch",
    "description": "Step 1: Sit on the floor with your knees bent and the soles of your feet together. Draw in the abs.\n\nStep 2: Grasp your feet and ankles and slowly let your knees fall toward the floor.\n\nStep 3: Slowly sit into the tallest position you can driving the chest up to the sky and pulling the body toward a forward leaning position using your elbows to press the thighs outward until a stretch is felt in the groin. Hold position for 20-30 seconds.\n\nStep 4: Repeat on the other side. Maintain posture throughout. Keep a relaxed breathing pattern. Avoid letting the head fall forward and back or shoulders slouch.",
    "coachingCues": [],
    "primaryEquipment": [
      "None"
    ],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/v4OLkxi5-Q0/hqdefault.jpg",
    "videoId": "v4OLkxi5-Q0",
    "videoUrl": "https://www.youtube.com/watch?v=v4OLkxi5-Q0"
  },
  {
    "id": "6f4a1aad-5374-428f-ba3a-b82abb53d606",
    "name": "Single Leg Squat",
    "slug": "single-leg-squat",
    "description": "Step 1: Stand on one leg with your knee slightly bent and your other leg extended in front of you.\n\nStep 2: Engage your core and lower your body by bending the standing leg at the knee, keeping your chest upright.\n\nStep 3: Go down as low as you can while maintaining balance, ensuring your knee stays aligned with your toes.\n\nStep 4: Push through your heel to return to the starting position, fully extending your standing leg.",
    "coachingCues": [],
    "primaryEquipment": [
      "None"
    ],
    "muscleGroups": [
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/sSXnaFyhiZs/hqdefault.jpg",
    "videoId": "sSXnaFyhiZs",
    "videoUrl": "https://www.youtube.com/watch?v=sSXnaFyhiZs"
  },
  {
    "id": "b308a3b4-d902-4428-b48d-49cd79acd8e0",
    "name": "Reciprocating Kettlebell Overhead Press",
    "slug": "reciprocating-kettlebell-overhead-press-0146",
    "description": "Step 1: Setup Stand with feet shoulder-width apart, holding a kettlebell in one hand at shoulder height with your elbow tucked in and palm facing forward.\n\nStep 2: Brace/Position Engage your core, maintain a neutral spine, and press your shoulder down away from your ear while stabilizing the kettlebell overhead.\n\nStep 3: Execute Press the kettlebell directly overhead until your arm is fully extended, keeping your wrist straight and elbow locked out.\n\nStep 4: Return/Repeat Lower the kettlebell back to shoulder height in a controlled manner, then switch to the opposite arm and repeat the movement.",
    "coachingCues": [],
    "primaryEquipment": [
      "Kettlebell"
    ],
    "muscleGroups": [
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/1nem81AsHC4/hqdefault.jpg",
    "videoId": "1nem81AsHC4",
    "videoUrl": "https://www.youtube.com/watch?v=1nem81AsHC4"
  },
  {
    "id": "d3f3ff17-9bbc-4fce-a566-c1b99ebf82ce",
    "name": "Static 3d Standing Hip Flexor Stretch",
    "slug": "static-3d-standing-hip-flexor-stretch-0247",
    "description": "Step 1: Setup Stand tall with your feet hip-width apart, ensuring your weight is evenly distributed on both legs.\n\nStep 2: Brace/Position Step your right foot back about two feet, keeping your left knee slightly bent and your right leg straight, with your toes pointing forward.\n\nStep 3: Execute Engage your core and gently push your hips forward while keeping your torso upright, feeling a stretch in the front of your right hip.\n\nStep 4: Return/Repeat Hold the stretch for 20-30 seconds, then switch legs and repeat the stretch on the opposite side.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/thQiAEIskCI/hqdefault.jpg",
    "videoId": "thQiAEIskCI",
    "videoUrl": "https://www.youtube.com/watch?v=thQiAEIskCI"
  },
  {
    "id": "07c41d28-7839-47a3-bdc4-b9f885c27b74",
    "name": "Static 3d Standing Hip Flexor Stretch",
    "slug": "static-3d-standing-hip-flexor-stretch-0248",
    "description": "Step 1: Setup Stand tall with your feet hip-width apart and engage your core.\n\nStep 2: Brace/Position Step your right foot back about two feet, keeping your left knee over your left ankle, and ensure your hips are square to the front.\n\nStep 3: Execute Gently push your hips forward while keeping your torso upright, feeling the stretch in the right hip flexor.\n\nStep 4: Return/Repeat Hold the stretch for 20-30 seconds, then switch legs and repeat the process.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/thQiAEIskCI/hqdefault.jpg",
    "videoId": "thQiAEIskCI",
    "videoUrl": "https://www.youtube.com/watch?v=thQiAEIskCI"
  },
  {
    "id": "32ef47c5-86ab-42f1-83a4-34a3b9d451e9",
    "name": "Activation Serratus Push Up",
    "slug": "activation-serratus-push-up-0014",
    "description": "Step 1: Setup Begin in a high plank position with your hands directly under your shoulders and your body in a straight line from head to heels.\n\nStep 2: Brace/Position Engage your core and squeeze your glutes to maintain stability, ensuring your shoulders are down and away from your ears.\n\nStep 3: Execute Lower your body slightly by retracting your shoulder blades together, then push through your hands to protract your shoulder blades, rounding your upper back.\n\nStep 4: Return/Repeat Return to the starting position by retracting your shoulder blades again, then repeat the movement for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/E-_YOEeaIu0/hqdefault.jpg",
    "videoId": "E-_YOEeaIu0",
    "videoUrl": "https://www.youtube.com/watch?v=E-_YOEeaIu0"
  },
  {
    "id": "8abef730-a3cf-42e6-890f-a0bf8008f8ec",
    "name": "Lunge To Balance Transverse",
    "slug": "lunge-to-balance-transverse-0165",
    "description": "Step 1: Setup Stand with your feet hip-width apart, engaging your core and maintaining a neutral spine.\n\nStep 2: Brace/Position Take a step forward with your right foot into a lunge, ensuring your knee is aligned over your ankle and your back knee is hovering just above the ground.\n\nStep 3: Execute Push through your right heel to rise up, bringing your left knee up towards your chest while rotating your torso to the right for balance.\n\nStep 4: Return/Repeat Lower your left leg back down into the lunge position, step back to the starting position, and repeat on the opposite side.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/UG2Sf8ck1WI/hqdefault.jpg",
    "videoId": "UG2Sf8ck1WI",
    "videoUrl": "https://www.youtube.com/watch?v=UG2Sf8ck1WI"
  },
  {
    "id": "b6587b7d-98fb-4020-b3e2-06f1efc1192f",
    "name": "Single Arm Standing Row With Rotation",
    "slug": "single-arm-standing-row-with-rotation-0209",
    "description": "Step 1: Setup Stand with feet hip-width apart, holding a dumbbell in one hand, and hinge slightly at the hips while keeping your back straight.\n\nStep 2: Brace/Position Engage your core and rotate your torso towards the side holding the dumbbell, ensuring your shoulder is down and back.\n\nStep 3: Execute Pull the dumbbell towards your hip while rotating your torso back to the starting position, squeezing your shoulder blade at the top of the movement.\n\nStep 4: Return/Repeat Lower the dumbbell back to the starting position with control, then repeat for the desired number of repetitions before switching sides.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back",
      "biceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/8fAJEs3L110/hqdefault.jpg",
    "videoId": "8fAJEs3L110",
    "videoUrl": "https://www.youtube.com/watch?v=8fAJEs3L110"
  },
  {
    "id": "191705db-fe0d-41b0-86b2-ae39df6910a8",
    "name": "Squat Jump With Stabilization Frontal",
    "slug": "squat-jump-with-stabilization-frontal-0187",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart and toes slightly pointed out, ensuring a stable base.\n\nStep 2: Brace/Position Engage your core and lower your hips into a squat position, keeping your chest up and back straight.\n\nStep 3: Execute Explode upward into a jump, extending your arms overhead, and land softly on the balls of your feet.\n\nStep 4: Return/Repeat Stabilize your landing by bending your knees slightly and immediately lower back into the squat position for the next jump.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/6YK8WXP2gww/hqdefault.jpg",
    "videoId": "6YK8WXP2gww",
    "videoUrl": "https://www.youtube.com/watch?v=6YK8WXP2gww"
  },
  {
    "id": "d47a5d0e-a9e1-4991-bef4-eac6cbe8f825",
    "name": "Squat Jump With Stabilization Transverse",
    "slug": "squat-jump-with-stabilization-transverse-0189",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, toes slightly pointed outward, and arms at your sides.\n\nStep 2: Brace/Position Engage your core, maintain a neutral spine, and lower into a squat position, ensuring your knees track over your toes.\n\nStep 3: Execute Explode upward into a jump, extending your arms overhead while driving through your heels, and rotate your torso to one side during the jump.\n\nStep 4: Return/Repeat Land softly with your knees slightly bent, stabilize your position, and return to the squat before repeating the jump and rotation to the opposite side.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/zLsI2C0VuQM/hqdefault.jpg",
    "videoId": "zLsI2C0VuQM",
    "videoUrl": "https://www.youtube.com/watch?v=zLsI2C0VuQM"
  },
  {
    "id": "054e0a8f-dd15-4797-8f67-cd88ace4ba00",
    "name": "Static 3d Standing Tfl Stretch",
    "slug": "static-3d-standing-tfl-stretch-0249",
    "description": "Step 1: Setup Stand with your feet hip-width apart and your right leg slightly behind your left leg.\n\nStep 2: Brace/Position Engage your core and tilt your pelvis slightly forward while keeping your torso upright.\n\nStep 3: Execute Reach your right arm overhead and lean to the left, feeling a stretch along the right side of your torso and hip.\n\nStep 4: Return/Repeat Hold the stretch for 15-30 seconds, then return to the starting position and switch sides.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/h_8VHKvi1zo/hqdefault.jpg",
    "videoId": "h_8VHKvi1zo",
    "videoUrl": "https://www.youtube.com/watch?v=h_8VHKvi1zo"
  },
  {
    "id": "bc955198-2e49-4dc4-b215-6d02a50b1b0d",
    "name": "Static Erector Spinae Stretch",
    "slug": "static-erector-spinae-stretch-0251",
    "description": "Step 1: Setup Stand with your feet hip-width apart, ensuring your knees are slightly bent and your spine is neutral.\n\nStep 2: Brace/Position Place your hands on your hips or thighs, engaging your core to stabilize your lower back.\n\nStep 3: Execute Slowly hinge at your hips, leaning forward while keeping your back straight, until you feel a stretch in your lower back and hamstrings.\n\nStep 4: Return/Repeat Hold the stretch for 15-30 seconds, then return to the starting position and repeat as needed.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/04vmlwoDEgE/hqdefault.jpg",
    "videoId": "04vmlwoDEgE",
    "videoUrl": "https://www.youtube.com/watch?v=04vmlwoDEgE"
  },
  {
    "id": "c3249d5b-5126-4bff-b5f6-4c18f0f96199",
    "name": "Static Kneeling Hip Flexor Stretch",
    "slug": "static-kneeling-hip-flexor-stretch-0253",
    "description": "Step 1: Setup Begin in a kneeling position with your right knee on the ground and your left foot flat on the floor in front of you, creating a 90-degree angle at both knees.\n\nStep 2: Brace/Position Engage your core and maintain an upright torso, ensuring your hips are square and facing forward.\n\nStep 3: Execute Gently push your hips forward while keeping your back straight, feeling a stretch in the hip flexor of your right leg.\n\nStep 4: Return/Repeat Hold the stretch for 20-30 seconds, then switch legs and repeat the process on the opposite side.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/UU7Nqd_Dric/hqdefault.jpg",
    "videoId": "UU7Nqd_Dric",
    "videoUrl": "https://www.youtube.com/watch?v=UU7Nqd_Dric"
  },
  {
    "id": "707a8994-85b8-4ee6-97c4-62fe07ebf1d7",
    "name": "Static Kneeling Hip Flexor Stretch",
    "slug": "static-kneeling-hip-flexor-stretch-0252",
    "description": "Step 1: Setup Begin in a kneeling position on a soft surface, with one knee on the ground and the other foot positioned in front, creating a 90-degree angle at both knees.\n\nStep 2: Brace/Position Engage your core and maintain an upright torso, ensuring your hips are squared forward and your back is straight.\n\nStep 3: Execute Gently push your hips forward while keeping your back straight, feeling a stretch in the hip flexor of the kneeling leg. Hold this position for 20-30 seconds.\n\nStep 4: Return/Repeat Slowly release the stretch by shifting your hips back, then switch legs and repeat the stretch on the opposite side.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/UU7Nqd_Dric/hqdefault.jpg",
    "videoId": "UU7Nqd_Dric",
    "videoUrl": "https://www.youtube.com/watch?v=UU7Nqd_Dric"
  },
  {
    "id": "2c12c7e2-eba2-4af9-bea7-33726c3af299",
    "name": "Static Pectoral Ball Stretch",
    "slug": "static-pectoral-ball-stretch-0256",
    "description": "Step 1: Setup Stand tall with your feet shoulder-width apart, holding a stability ball at chest height with both hands.\n\nStep 2: Brace/Position Extend your arms out to the sides, keeping a slight bend in the elbows, and position the ball against your chest.\n\nStep 3: Execute Gently push the ball forward while maintaining tension in your arms, feeling a stretch across your chest and shoulders.\n\nStep 4: Return/Repeat Hold the stretch for 15-30 seconds, then slowly bring the ball back to your chest and repeat as needed.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/ujsKpEYYCSo/hqdefault.jpg",
    "videoId": "ujsKpEYYCSo",
    "videoUrl": "https://www.youtube.com/watch?v=ujsKpEYYCSo"
  },
  {
    "id": "045f30f0-8110-48f5-9a09-f948f8713245",
    "name": "Self Myofascial Release Smr Tensor Fascia Latae",
    "slug": "self-myofascial-release-smr-tensor-fascia-latae-0235",
    "description": "Step 1: Setup Sit on the floor with your legs extended in front of you, placing a foam roller under your right hip, targeting the tensor fascia latae (TFL) muscle.\n\nStep 2: Brace/Position Shift your body weight onto the foam roller, supporting yourself with your hands behind you, and keep your left leg extended or bent at the knee for stability.\n\nStep 3: Execute Slowly roll your body forward and backward over the foam roller, focusing on the TFL area, applying moderate pressure to release tension.\n\nStep 4: Return/Repeat After 30-60 seconds, switch to the left side and repeat the process, ensuring even tension release on both sides.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/NfWjVK7agTM/hqdefault.jpg",
    "videoId": "NfWjVK7agTM",
    "videoUrl": "https://www.youtube.com/watch?v=NfWjVK7agTM"
  },
  {
    "id": "647bb070-1dc0-443a-9bfb-1569bb4a04d5",
    "name": "180 Jump With Stabilization",
    "slug": "180-jump-with-stabilization-0004",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart and knees slightly bent, preparing for the jump.\n\nStep 2: Brace/Position Engage your core, maintain an upright posture, and shift your weight onto your heels.\n\nStep 3: Execute Jump explosively to the right, rotating your hips and shoulders 180 degrees while extending your legs.\n\nStep 4: Return/Repeat Land softly on the balls of your feet, stabilize your position, and immediately prepare for the next jump in the opposite direction.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/NadIhI_0u1w/hqdefault.jpg",
    "videoId": "NadIhI_0u1w",
    "videoUrl": "https://www.youtube.com/watch?v=NadIhI_0u1w"
  },
  {
    "id": "ae89ee8b-8411-470d-830b-b025dfa6166f",
    "name": "Self Myofascial Release Smr Latissimus Dorsi",
    "slug": "self-myofascial-release-smr-latissimus-dorsi-0227",
    "description": "Step 1: Setup Sit on the floor with your legs extended in front of you, and place a foam roller horizontally under your left side, positioned just above your hip.\n\nStep 2: Brace/Position Shift your body weight onto the foam roller, ensuring your left arm is extended overhead and your right hand is on the floor for support.\n\nStep 3: Execute Slowly roll the foam roller along your latissimus dorsi, moving from your armpit down to your lower back, pausing on any tight or tender spots for 20-30 seconds.\n\nStep 4: Return/Repeat Shift your body to roll back to the starting position, then repeat the process on the right side.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/I_76a2fVWc8/hqdefault.jpg",
    "videoId": "I_76a2fVWc8",
    "videoUrl": "https://www.youtube.com/watch?v=I_76a2fVWc8"
  },
  {
    "id": "ab64238b-990e-4d39-82bd-a4f3267eafd8",
    "name": "Static Seated Calf Stretch",
    "slug": "static-seated-calf-stretch-0002",
    "description": "Step 1: Setup Sit on the floor with your legs extended straight in front of you and your back upright.\n\nStep 2: Brace/Position Flex your feet by pulling your toes towards your shins, keeping your legs straight.\n\nStep 3: Execute Gently lean forward from your hips, reaching towards your toes while maintaining a straight back.\n\nStep 4: Return/Repeat Hold the stretch for 15-30 seconds, then return to the starting position and repeat as desired.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/83G00Fwlqqw/hqdefault.jpg",
    "videoId": "83G00Fwlqqw",
    "videoUrl": "https://www.youtube.com/watch?v=83G00Fwlqqw"
  },
  {
    "id": "2569dc98-445a-4131-83fd-bf205ccea5fc",
    "name": "Prisoner Squat",
    "slug": "prisoner-squat-0121",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart and toes slightly pointed out. Place your hands behind your head, interlocking your fingers.\n\nStep 2: Brace/Position Engage your core and pull your shoulder blades back and down to maintain an upright posture.\n\nStep 3: Execute Lower your body by bending at the hips and knees, keeping your chest up and back straight until your thighs are parallel to the ground.\n\nStep 4: Return/Repeat Push through your heels to return to the starting position, fully extending your hips and knees, then repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/dC0yGLZwxas/hqdefault.jpg",
    "videoId": "dC0yGLZwxas",
    "videoUrl": "https://www.youtube.com/watch?v=dC0yGLZwxas"
  },
  {
    "id": "e369704b-3ab4-4c2a-93d0-7f8581f57b97",
    "name": "Prisoner Squat",
    "slug": "prisoner-squat-0122",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, toes slightly pointed out, and place your hands behind your head, interlocking your fingers.\n\nStep 2: Brace/Position Engage your core, keeping your chest up and shoulders back while maintaining a neutral spine.\n\nStep 3: Execute Lower your body by bending at the hips and knees, keeping your elbows inside your knees and lowering until your thighs are parallel to the ground.\n\nStep 4: Return/Repeat Push through your heels to return to the starting position, fully extending your hips and knees, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/dC0yGLZwxas/hqdefault.jpg",
    "videoId": "dC0yGLZwxas",
    "videoUrl": "https://www.youtube.com/watch?v=dC0yGLZwxas"
  },
  {
    "id": "f8af3ab9-dd70-4d24-a651-550fdf69f2fd",
    "name": "Static Standing Quadriceps Stretch",
    "slug": "static-standing-quadriceps-stretch-0261",
    "description": "Step 1: Setup Stand upright with your feet hip-width apart and your weight evenly distributed on both legs.\n\nStep 2: Brace/Position Bend your right knee, bringing your heel towards your glutes, and grasp your right ankle with your right hand.\n\nStep 3: Execute Gently pull your right ankle towards your glutes, keeping your knees close together and your hips aligned.\n\nStep 4: Return/Repeat Hold the stretch for 15-30 seconds, then slowly lower your right foot to the ground and repeat on the left side.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/XBLIiQS5RQI/hqdefault.jpg",
    "videoId": "XBLIiQS5RQI",
    "videoUrl": "https://www.youtube.com/watch?v=XBLIiQS5RQI"
  },
  {
    "id": "14d4c0d9-f36b-4fbd-b333-6c38f20265b0",
    "name": "Two Arm Standing Cable Fly",
    "slug": "two-arm-standing-cable-fly",
    "description": "Step 1: Ensure cables are adjusted at chest height. Stand with your back toward the cable machine. Grab the handles and hold them out to the side of your body with your palms facing forward. Draw in and brace your abs. Lock shoulder blades back and down.\n\nStep 2: Drive the hands forward and together in an arcing motion until the hands touch.\n\nStep 3: Reverse the pattern and return to the starting position moving through a maximum range of motion that technique can be maintained.\n\nStep 4: Repeat. Maintain posture throughout. Avoid arching or slouching the back, jutting the chin forward, slouching or shrugging the shoulders.",
    "coachingCues": [],
    "primaryEquipment": [
      "Cable Machine"
    ],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/XNf6TBErGys/hqdefault.jpg",
    "videoId": "XNf6TBErGys",
    "videoUrl": "https://www.youtube.com/watch?v=XNf6TBErGys"
  },
  {
    "id": "92df0bf7-21c1-4015-934e-9059d69d482e",
    "name": "Two Arm Dumbbell Chest Press With Band",
    "slug": "two-arm-dumbbell-chest-press-with-band",
    "description": "Step 1: Wrap band around the upper back/lower shoulder blade area and in the palms prior to picking up dumbbells. Lie supine with neutral spine on a bench with your feet straight and flat on the floor. Draw in and brace the abs and lock the shoulders blades back and down on the bench. Hold the dumbbells at approximately shoulder level to begin slightly out to the sides of the body in line with the chest.\n\nStep 2: Press the dumbbells up and together until the arms are completely extended ending with them directly above the shoulders.\n\nStep 3: Reverse the pattern and return to the starting position.\n\nStep 4: Repeat. Maintain posture throughout. Do not arch the back or jut the head forward. Avoid letting the shoulders round, posture shift or feet lift in the air. Keep the elbows under the dumbbells to maintain balance at all times.",
    "coachingCues": [],
    "primaryEquipment": [
      "Bench",
      "Dumbbells",
      "Band or Tube"
    ],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/_x5m-s8xTf0/hqdefault.jpg",
    "videoId": "_x5m-s8xTf0",
    "videoUrl": "https://www.youtube.com/watch?v=_x5m-s8xTf0"
  },
  {
    "id": "84959c1f-39e6-45b9-a15d-06ce9830a685",
    "name": "Static Standing Adductor Magnus",
    "slug": "static-standing-adductor-magnus-0259",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, ensuring your weight is evenly distributed on both legs.\n\nStep 2: Brace/Position Shift your weight onto your right leg, keeping your left leg straight and extended out to the side, engaging your core for stability.\n\nStep 3: Execute Slowly lower your left leg towards the ground, feeling the stretch in the inner thigh, while maintaining a straight posture and keeping your hips square.\n\nStep 4: Return/Repeat Hold the stretch for 15-30 seconds, then return to the starting position and switch to the right leg, repeating the process.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/sfiFzNlHLyk/hqdefault.jpg",
    "videoId": "sfiFzNlHLyk",
    "videoUrl": "https://www.youtube.com/watch?v=sfiFzNlHLyk"
  },
  {
    "id": "36b8cc63-8eb6-4898-b4eb-2d832a714100",
    "name": "Static Standing Adductor Magnus",
    "slug": "static-standing-adductor-magnus-0260",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, toes pointing forward, and weight evenly distributed on both feet.\n\nStep 2: Brace/Position Engage your core and maintain a neutral spine while placing one foot slightly behind the other, keeping the back leg straight and the front leg bent at a 90-degree angle.\n\nStep 3: Execute Slowly lower your hips toward the ground by bending the front knee, ensuring the back leg remains straight and the back heel stays off the ground, feeling a stretch in the inner thigh of the front leg.\n\nStep 4: Return/Repeat Push through the front heel to return to the starting position, then switch legs and repeat the movement for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/sfiFzNlHLyk/hqdefault.jpg",
    "videoId": "sfiFzNlHLyk",
    "videoUrl": "https://www.youtube.com/watch?v=sfiFzNlHLyk"
  },
  {
    "id": "f22b416a-ddd4-4eff-94ba-9ff1e2585464",
    "name": "In In Out Out Ladder Drill",
    "slug": "in-in-out-out-ladder-drill-0153",
    "description": "Step 1: Setup Stand facing the agility ladder with your feet shoulder-width apart, ensuring the ladder is flat on the ground.\n\nStep 2: Brace/Position Begin with your knees slightly bent and your core engaged, ready to move quickly.\n\nStep 3: Execute Step into the first square of the ladder with your right foot, followed by your left foot, then step out to the right side, and back in, alternating feet as you progress through the ladder.\n\nStep 4: Return/Repeat Once you reach the end of the ladder, turn around and repeat the drill, maintaining a quick pace and proper foot placement.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/SybJ4cCnR64/hqdefault.jpg",
    "videoId": "SybJ4cCnR64",
    "videoUrl": "https://www.youtube.com/watch?v=SybJ4cCnR64"
  },
  {
    "id": "baf4b5b2-b217-44f1-8d8b-68527a245260",
    "name": "Short Lever Side Plank",
    "slug": "short-lever-side-plank-0089",
    "description": "Step 1: Setup Lie on your side with your elbow directly beneath your shoulder, legs stacked, and knees bent at a 90-degree angle.\n\nStep 2: Brace/Position Engage your core and lift your hips off the ground, creating a straight line from your shoulders to your knees.\n\nStep 3: Execute Hold the position, ensuring your shoulder is aligned with your elbow and your hips are elevated without sagging.\n\nStep 4: Return/Repeat Lower your hips back to the ground to rest, then repeat for the desired number of repetitions before switching sides.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/y_WW7_c4O8k/hqdefault.jpg",
    "videoId": "y_WW7_c4O8k",
    "videoUrl": "https://www.youtube.com/watch?v=y_WW7_c4O8k"
  },
  {
    "id": "74092cef-9579-46e2-8a09-73be638650e8",
    "name": "Kettlebell Clean To Press",
    "slug": "kettlebell-clean-to-press-0001",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a kettlebell in one hand with a neutral grip, positioned between your feet.\n\nStep 2: Brace/Position Hinge at your hips to lower your torso slightly, keeping your back straight and core engaged, while positioning the kettlebell close to your body.\n\nStep 3: Execute Drive through your heels to extend your hips and knees, pulling the kettlebell upward in a clean motion, rotating your wrist to bring it to shoulder height.\n\nStep 4: Return/Repeat From the shoulder position, press the kettlebell overhead until your arm is fully extended, then lower it back to the starting position and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Kettlebell"
    ],
    "muscleGroups": [
      "back",
      "glutes",
      "hamstrings",
      "quadriceps",
      "shoulders"
    ],
    "imageUrl": "https://img.youtube.com/vi/km3f8_rpDdg/hqdefault.jpg",
    "videoId": "km3f8_rpDdg",
    "videoUrl": "https://www.youtube.com/watch?v=km3f8_rpDdg"
  },
  {
    "id": "1c0d00aa-b1f2-4abe-8170-f68d9973ec7b",
    "name": "Kettlebell Floor Press",
    "slug": "kettlebell-floor-press-0136",
    "description": "Step 1: Setup Lie on your back on the floor with your knees bent and feet flat, holding a kettlebell in one hand at chest level, elbow bent at 90 degrees.\n\nStep 2: Brace/Position Engage your core, press your lower back into the floor, and keep your opposite arm extended out to the side for stability.\n\nStep 3: Execute Press the kettlebell upward until your arm is fully extended, keeping your wrist straight and elbow close to your body.\n\nStep 4: Return/Repeat Lower the kettlebell back to the starting position with control, ensuring your elbow returns to the 90-degree angle before repeating the movement.",
    "coachingCues": [],
    "primaryEquipment": [
      "Kettlebell"
    ],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/yXstm050X84/hqdefault.jpg",
    "videoId": "yXstm050X84",
    "videoUrl": "https://www.youtube.com/watch?v=yXstm050X84"
  },
  {
    "id": "ca5a1084-a8a1-424f-ab9e-0b69eb8ab786",
    "name": "Ali Shuffle Ladder Drill",
    "slug": "ali-shuffle-ladder-drill-0152",
    "description": "Step 1: Setup Stand beside the agility ladder with your feet shoulder-width apart and knees slightly bent.\n\nStep 2: Brace/Position Position your body in an athletic stance, with your core engaged and arms bent at 90 degrees, ready to move.\n\nStep 3: Execute Step laterally into the first square of the ladder with your right foot, followed quickly by your left foot, then step out of the ladder with your right foot, followed by your left foot.\n\nStep 4: Return/Repeat Continue the lateral movement down the ladder, alternating your lead foot, and maintain a quick pace throughout the drill.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "full body"
    ],
    "imageUrl": "https://img.youtube.com/vi/_Tc751vW_lM/hqdefault.jpg",
    "videoId": "_Tc751vW_lM",
    "videoUrl": "https://www.youtube.com/watch?v=_Tc751vW_lM"
  },
  {
    "id": "353fb661-da2d-4438-a6ea-e65ff6adbc0b",
    "name": "Repeat Squat Jumps Multiplanar",
    "slug": "repeat-squat-jumps-multiplanar-0183",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, toes slightly pointed out, and arms at your sides or in front of you for balance.\n\nStep 2: Brace/Position Engage your core, keeping your chest up and back straight, and lower into a squat position with your thighs parallel to the ground.\n\nStep 3: Execute Explode upward from the squat position, jumping off the ground while rotating your body 90 degrees to the right or left, and extend your arms overhead.\n\nStep 4: Return/Repeat Land softly back into the squat position, absorbing the impact, and immediately transition into the next jump, alternating the direction with each repetition.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/FC7EUiJleTQ/hqdefault.jpg",
    "videoId": "FC7EUiJleTQ",
    "videoUrl": "https://www.youtube.com/watch?v=FC7EUiJleTQ"
  },
  {
    "id": "94c7ea81-a922-4841-85a8-0c0fc03da9af",
    "name": "Bent Over Dumbbell Rear Fly With Neutral Grip",
    "slug": "bent-over-dumbbell-rear-fly-with-neutral-grip-0110",
    "description": "Step 1: Setup Stand with feet hip-width apart, holding a dumbbell in each hand with a neutral grip, and hinge at the hips until your torso is nearly parallel to the ground.\n\nStep 2: Brace/Position Engage your core and maintain a flat back, allowing your arms to hang straight down from your shoulders, palms facing each other.\n\nStep 3: Execute With a slight bend in your elbows, lift the dumbbells out to the sides, squeezing your shoulder blades together at the top of the movement.\n\nStep 4: Return/Repeat Lower the dumbbells back to the starting position with control, ensuring to maintain tension in your back muscles, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/aCi_ZhmPQCQ/hqdefault.jpg",
    "videoId": "aCi_ZhmPQCQ",
    "videoUrl": "https://www.youtube.com/watch?v=aCi_ZhmPQCQ"
  },
  {
    "id": "2b02edfb-8e49-45af-a3b4-1b2a832758a0",
    "name": "Slalom",
    "slug": "slalom-0156",
    "description": "Step 1: Setup Stand with your feet hip-width apart, knees slightly bent, and weight evenly distributed on both feet.\n\nStep 2: Brace/Position Engage your core and maintain an upright posture, keeping your chest lifted and shoulders relaxed.\n\nStep 3: Execute Shift your weight to one foot and push off, jumping laterally to the opposite side while landing softly on the other foot, maintaining balance.\n\nStep 4: Return/Repeat Immediately push off from the landing foot and jump back to the starting side, continuing to alternate sides for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/O6Jf7gcxYdU/hqdefault.jpg",
    "videoId": "O6Jf7gcxYdU",
    "videoUrl": "https://www.youtube.com/watch?v=O6Jf7gcxYdU"
  },
  {
    "id": "27532143-da51-4dcf-9a36-b4b652b0bb72",
    "name": "Box Jump Up With Stabilization",
    "slug": "box-jump-up-with-stabilization-0170",
    "description": "Step 1: Stand in front of the box with your feet shoulder-width apart and knees slightly bent.\n\nStep 2: Bend your knees and swing your arms back to generate momentum as you prepare to jump.\n\nStep 3: Explode upward, driving your knees towards your chest, and land softly on the box with your feet flat.\n\nStep 4: Stabilize your position for a moment, then step back down carefully to the starting position.",
    "coachingCues": [],
    "primaryEquipment": [
      "Box or Step"
    ],
    "muscleGroups": [
      "calves",
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/757ht_Y-fY0/hqdefault.jpg",
    "videoId": "757ht_Y-fY0",
    "videoUrl": "https://www.youtube.com/watch?v=757ht_Y-fY0"
  },
  {
    "id": "e096247c-374f-4172-9f9a-87e0a61fa058",
    "name": "Box Jump Down To Tuck Jump",
    "slug": "box-jump-down-to-tuck-jump-0167",
    "description": "Step 1: Stand in front of the box with your feet shoulder-width apart and knees slightly bent.\n\nStep 2: Jump onto the box, landing softly with your knees bent and feet flat.\n\nStep 3: Step back down from the box with control, landing softly on the ground.\n\nStep 4: Immediately perform a tuck jump by jumping up and bringing your knees towards your chest.",
    "coachingCues": [],
    "primaryEquipment": [
      "Box or Step"
    ],
    "muscleGroups": [
      "calves",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/eCTwe-Szf8U/hqdefault.jpg",
    "videoId": "eCTwe-Szf8U",
    "videoUrl": "https://www.youtube.com/watch?v=eCTwe-Szf8U"
  },
  {
    "id": "d1f683df-3f27-4fdd-a10b-0406484dc291",
    "name": "Single Leg Reach Sagittal",
    "slug": "single-leg-reach-sagittal-0033",
    "description": "Step 1: Setup Stand on one leg with a slight bend in the knee, keeping the opposite leg extended behind you and arms at your sides.\n\nStep 2: Brace/Position Engage your core, maintaining a neutral spine, and focus on balancing on the standing leg while keeping your hips level.\n\nStep 3: Execute Slowly hinge forward at the hips, extending the rear leg straight back while reaching your arms forward, maintaining balance and control.\n\nStep 4: Return/Repeat Return to the starting position by driving through the standing leg, bringing the torso upright and the rear leg forward, then repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes"
    ],
    "imageUrl": "https://img.youtube.com/vi/1sbENKqlslg/hqdefault.jpg",
    "videoId": "1sbENKqlslg",
    "videoUrl": "https://www.youtube.com/watch?v=1sbENKqlslg"
  },
  {
    "id": "d2fef051-3e15-41a2-ba11-674524f2a71e",
    "name": "Static Posterior Shoulder Stretch",
    "slug": "static-posterior-shoulder-stretch-0257",
    "description": "Step 1: Setup Stand tall with your feet shoulder-width apart, and extend one arm across your body at shoulder height.\n\nStep 2: Brace/Position Use your opposite hand to gently pull the extended arm closer to your chest, keeping your shoulder relaxed and down.\n\nStep 3: Execute Hold the stretch for 15-30 seconds, feeling the stretch across the back of your shoulder and upper arm.\n\nStep 4: Return/Repeat Release the stretch, switch arms, and repeat the process for the same duration on the opposite side.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/BnmRb-Egz14/hqdefault.jpg",
    "videoId": "BnmRb-Egz14",
    "videoUrl": "https://www.youtube.com/watch?v=BnmRb-Egz14"
  },
  {
    "id": "c3e17cf5-0b8d-42ae-a561-e08805ec6875",
    "name": "Self Myofascial Release Smr Quadriceps",
    "slug": "self-myofascial-release-smr-quadriceps-0234",
    "description": "Step 1: Setup Position a foam roller on the floor and kneel in front of it, placing one thigh on the roller with the knee positioned just above the roller's edge.\n\nStep 2: Brace/Position Engage your core and maintain a neutral spine while resting your forearms on the ground for support.\n\nStep 3: Execute Slowly roll the foam roller from just above the knee to the hip, applying pressure to the quadriceps, and pause on any tight spots for 20-30 seconds.\n\nStep 4: Return/Repeat Shift to the opposite leg and repeat the rolling process, ensuring even coverage across both quadriceps.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/vUzmXO56jDI/hqdefault.jpg",
    "videoId": "vUzmXO56jDI",
    "videoUrl": "https://www.youtube.com/watch?v=vUzmXO56jDI"
  },
  {
    "id": "92f43fe3-00a3-4164-9312-0c42728f3f94",
    "name": "Self Myofascial Release Smr Quadriceps",
    "slug": "self-myofascial-release-smr-quadriceps-0233",
    "description": "Step 1: Setup Position a foam roller on the floor and kneel in front of it, placing your right thigh on the roller, just above the knee.\n\nStep 2: Brace/Position Engage your core and maintain a neutral spine while resting your hands on the floor for support.\n\nStep 3: Execute Slowly roll the foam roller up your thigh towards your hip, applying pressure to the quadriceps, and pause on any tight spots for 20-30 seconds.\n\nStep 4: Return/Repeat Roll back down to the starting position and repeat for 1-2 minutes before switching to the left thigh.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/vUzmXO56jDI/hqdefault.jpg",
    "videoId": "vUzmXO56jDI",
    "videoUrl": "https://www.youtube.com/watch?v=vUzmXO56jDI"
  },
  {
    "id": "43d0bdec-43e3-46da-bf14-6cb94ad2c973",
    "name": "Dumbbell Push Press",
    "slug": "dumbbell-push-press-0106",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a dumbbell in each hand at shoulder height with palms facing forward.\n\nStep 2: Brace/Position Engage your core and slightly bend your knees while keeping your chest up and shoulders back.\n\nStep 3: Execute Press the dumbbells overhead by extending your arms and using your legs to generate upward momentum, keeping the dumbbells aligned with your ears.\n\nStep 4: Return/Repeat Lower the dumbbells back to shoulder height in a controlled manner, ensuring to maintain core engagement throughout the movement.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/vuaYVK8xyqo/hqdefault.jpg",
    "videoId": "vuaYVK8xyqo",
    "videoUrl": "https://www.youtube.com/watch?v=vuaYVK8xyqo"
  },
  {
    "id": "9da43698-14eb-4609-a9a8-caa7197799fb",
    "name": "Barbell Front Squat With Clean Position",
    "slug": "barbell-front-squat-with-clean-position-0060",
    "description": "Step 1: Setup Position the barbell on your front deltoids, using a clean grip with your elbows high and hands just outside shoulder-width.\n\nStep 2: Brace/Position Stand with your feet shoulder-width apart, toes slightly pointed out, and engage your core while maintaining an upright torso.\n\nStep 3: Execute Lower your body by bending at the knees and hips, keeping your chest up and elbows high, until your thighs are at least parallel to the ground.\n\nStep 4: Return/Repeat Push through your heels to return to the starting position, fully extending your hips and knees, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Barbell"
    ],
    "muscleGroups": [
      "back",
      "glutes",
      "hamstrings",
      "quadriceps",
      "shoulders"
    ],
    "imageUrl": "https://img.youtube.com/vi/yr_8VuSqhmM/hqdefault.jpg",
    "videoId": "yr_8VuSqhmM",
    "videoUrl": "https://www.youtube.com/watch?v=yr_8VuSqhmM"
  },
  {
    "id": "9588a84c-1fd7-4ded-95ed-cb54413eaed9",
    "name": "Barbell Bent Over Row Pronated",
    "slug": "barbell-bent-over-row-pronated-0057",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a barbell with a pronated grip (palms facing down) and arms fully extended in front of you.\n\nStep 2: Brace/Position Hinge at your hips, keeping your back straight and knees slightly bent, until your torso is approximately parallel to the ground.\n\nStep 3: Execute Pull the barbell towards your lower ribcage by retracting your shoulder blades and bending your elbows, keeping your elbows close to your body.\n\nStep 4: Return/Repeat Lower the barbell back to the starting position with control, fully extending your arms while maintaining a stable torso.",
    "coachingCues": [],
    "primaryEquipment": [
      "Barbell"
    ],
    "muscleGroups": [
      "back",
      "biceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/bm0_q9bR_HA/hqdefault.jpg",
    "videoId": "bm0_q9bR_HA",
    "videoUrl": "https://www.youtube.com/watch?v=bm0_q9bR_HA"
  },
  {
    "id": "f34e36a7-59ef-42da-9d02-64e6ea3820a3",
    "name": "Kettlebell Arm Bar",
    "slug": "kettlebell-arm-bar-0132",
    "description": "Step 1: Setup Lie on your back on a flat surface, holding a kettlebell in one hand with your arm extended straight up towards the ceiling.\n\nStep 2: Brace/Position Bend your knees and place your feet flat on the ground, ensuring your shoulder blades are retracted and your core is engaged.\n\nStep 3: Execute Slowly rotate your body away from the kettlebell, allowing your arm to lower towards the floor while keeping your elbow slightly bent and your shoulder packed.\n\nStep 4: Return/Repeat Reverse the motion by rotating your torso back to the starting position, maintaining control of the kettlebell, and repeat for the desired number of repetitions before switching sides.",
    "coachingCues": [],
    "primaryEquipment": [
      "Kettlebell"
    ],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/WtqAD5-Re18/hqdefault.jpg",
    "videoId": "WtqAD5-Re18",
    "videoUrl": "https://www.youtube.com/watch?v=WtqAD5-Re18"
  },
  {
    "id": "05c34452-4a30-4e43-899e-49831ac7953e",
    "name": "Box Jumps",
    "slug": "box-jumps",
    "description": "Step 1: Stand in front of the box with your feet shoulder-width apart and knees slightly bent.\n\nStep 2: Bend your knees and swing your arms back to generate momentum.\n\nStep 3: Explode upward, driving your knees toward your chest as you jump onto the box.\n\nStep 4: Land softly with your knees slightly bent, then step back down to repeat.",
    "coachingCues": [],
    "primaryEquipment": [
      "Box or Step"
    ],
    "muscleGroups": [
      "calves",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/DXu-8TAJwi4/hqdefault.jpg",
    "videoId": "DXu-8TAJwi4",
    "videoUrl": "https://www.youtube.com/watch?v=DXu-8TAJwi4"
  },
  {
    "id": "3826e0d7-9753-48a3-aca2-190dcfdf83c1",
    "name": "Plyometric Push Up",
    "slug": "plyometric-push-up",
    "description": "Step 1: Start in a standard push-up position with your hands slightly wider than shoulder-width apart and your body in a straight line from head to heels.\n\nStep 2: Lower your chest towards the ground by bending your elbows while keeping your core engaged.\n\nStep 3: Explode upward by pushing through your palms, allowing your hands to leave the ground.\n\nStep 4: Land softly back in the starting push-up position, absorbing the impact with your arms and legs.",
    "coachingCues": [],
    "primaryEquipment": [
      "None"
    ],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/MH4gcTKQiEc/hqdefault.jpg",
    "videoId": "MH4gcTKQiEc",
    "videoUrl": "https://www.youtube.com/watch?v=MH4gcTKQiEc"
  },
  {
    "id": "daa2f9d8-2af7-479f-81ba-cca48c4c2386",
    "name": "Plank With Arm Reach",
    "slug": "plank-with-arm-reach-0081",
    "description": "Step 1: Setup Begin in a high plank position with your hands directly under your shoulders, legs extended, and feet hip-width apart.\n\nStep 2: Brace/Position Engage your core, keeping your body in a straight line from head to heels, and maintain a neutral spine.\n\nStep 3: Execute Reach your right arm forward, extending it in line with your shoulder while maintaining stability in your torso.\n\nStep 4: Return/Repeat Lower your right arm back to the starting position and repeat on the left side, alternating arms for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/rFwsard85T8/hqdefault.jpg",
    "videoId": "rFwsard85T8",
    "videoUrl": "https://www.youtube.com/watch?v=rFwsard85T8"
  },
  {
    "id": "a4c58341-0efc-4084-ad04-7123acee3253",
    "name": "Barbell Bench Press",
    "slug": "barbell-bench-press",
    "description": "Step 1: Lie supine on your back with neutral spine on a bench with your feet straight and flat on the floor. Draw in and brace the abs and lock the shoulders blades back and down on the bench. Grasp the barbell at about 1.5 - 2x shoulder width ensuring the hands are evenly distributed on the bar.\n\nStep 2: Unrack the bar (always use a spotter if you are able) bringing it directly above the shoulders. Starting with arms extended, slowly lower the bar toward the mid to lower chest moving through the maximum comfortable range.\n\nStep 3: Reverse the pattern and return the starting position.\n\nStep 4: Repeat. Maintain posture throughout. Do not arch the back or jut the head forward. Avoid letting the shoulders round, posture shift or feet lift in the air. Keep the elbows under the bar to maintain balance at all times.",
    "coachingCues": [],
    "primaryEquipment": [
      "Bench",
      "Barbell",
      "Plates",
      "Safety Collars"
    ],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/CayG6UYqL8g/hqdefault.jpg",
    "videoId": "CayG6UYqL8g",
    "videoUrl": "https://www.youtube.com/watch?v=CayG6UYqL8g"
  },
  {
    "id": "cd6207bd-ce8d-4710-b01d-0d537137569b",
    "name": "Bench Dips",
    "slug": "bench-dips",
    "description": "Step 1: Sit on the edge of the bench with your hands placed shoulder-width apart, fingers facing forward.\n\nStep 2: Extend your legs out in front of you, keeping your heels on the ground or elevated on another bench.\n\nStep 3: Lower your body by bending your elbows until your upper arms are parallel to the ground.\n\nStep 4: Push through your palms to return to the starting position, fully extending your arms.",
    "coachingCues": [],
    "primaryEquipment": [
      "Bench"
    ],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/WVeZDBhZwLA/hqdefault.jpg",
    "videoId": "WVeZDBhZwLA",
    "videoUrl": "https://www.youtube.com/watch?v=WVeZDBhZwLA"
  },
  {
    "id": "5663480d-a2a8-4bee-b0e5-a3153c4b4d32",
    "name": "Single Leg Squat To Row",
    "slug": "single-leg-squat-to-row",
    "description": "Step 1: Adjust the cable machine to a low position and attach a single handle.\n\nStep 2: Stand on one leg, holding the handle with the opposite hand, and engage your core.\n\nStep 3: Lower into a single-leg squat while simultaneously pulling the handle towards your torso.\n\nStep 4: Return to the starting position by pushing through your heel and extending your leg while releasing the handle.",
    "coachingCues": [],
    "primaryEquipment": [
      "Cable Machine"
    ],
    "muscleGroups": [
      "back",
      "biceps",
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/LmGbrgGJS6E/hqdefault.jpg",
    "videoId": "LmGbrgGJS6E",
    "videoUrl": "https://www.youtube.com/watch?v=LmGbrgGJS6E"
  },
  {
    "id": "f508b81c-5a03-41b1-a2c5-c8a0e05edadf",
    "name": "Side Plank",
    "slug": "side-plank-0088",
    "description": "Step 1: Setup Lie on your side with your legs extended straight, stacking your feet on top of each other, and place your elbow directly under your shoulder.\n\nStep 2: Brace/Position Engage your core and lift your hips off the ground, forming a straight line from your head to your feet.\n\nStep 3: Execute Hold the position, ensuring your shoulder is aligned with your elbow and your body remains straight without sagging or twisting.\n\nStep 4: Return/Repeat Lower your hips back to the ground to rest, then repeat for the desired number of repetitions before switching sides.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/ZpBJIRLGEgg/hqdefault.jpg",
    "videoId": "ZpBJIRLGEgg",
    "videoUrl": "https://www.youtube.com/watch?v=ZpBJIRLGEgg"
  },
  {
    "id": "0e53ce20-892c-4eb0-b53f-e0281f03ecf5",
    "name": "Floor Bridge",
    "slug": "floor-bridge-0074",
    "description": "Step 1: Setup Lie on your back on the floor with your knees bent and feet flat on the ground, hip-width apart.\n\nStep 2: Brace/Position Engage your core and press your shoulder blades into the floor, keeping your arms at your sides.\n\nStep 3: Execute Drive through your heels to lift your hips towards the ceiling, forming a straight line from your shoulders to your knees.\n\nStep 4: Return/Repeat Lower your hips back to the starting position, then repeat the movement for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/Z3cY3d3BBo4/hqdefault.jpg",
    "videoId": "Z3cY3d3BBo4",
    "videoUrl": "https://www.youtube.com/watch?v=Z3cY3d3BBo4"
  },
  {
    "id": "85b5ac29-2901-4937-8901-104c90759e8a",
    "name": "Straight Arm Plank",
    "slug": "straight-arm-plank",
    "description": "Step 1: Position the body on the hands and knees with hands under the shoulders and knees/feet hip to shoulder width apart. Draw in the belly button and brace the abs.\n\nStep 2: Lift the body off of the floor and form a straight line from head to heel flexing the glutes. Hold.\n\nStep 3: Return to the starting position. Maintain posture throughout.\n\nStep 4: Repeat for the desired number of repetitions or time. Avoid feet collapsing inward, shoulder blades winging or chin falling toward the floor.",
    "coachingCues": [],
    "primaryEquipment": [
      "None"
    ],
    "muscleGroups": [
      "back",
      "biceps",
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/MDxfAuBbHHA/hqdefault.jpg",
    "videoId": "MDxfAuBbHHA",
    "videoUrl": "https://www.youtube.com/watch?v=MDxfAuBbHHA"
  },
  {
    "id": "edeb2418-0ff6-4280-bab8-6387209df81e",
    "name": "Single Arm Kettlebell Swing",
    "slug": "single-arm-kettlebell-swing-0149",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, holding a kettlebell in one hand with a neutral grip, and position it slightly in front of you.\n\nStep 2: Brace/Position Hinge at the hips, keeping your back flat and core engaged, while allowing the kettlebell to swing back between your legs.\n\nStep 3: Execute Forcefully drive your hips forward, swinging the kettlebell upward to shoulder height while keeping your arm straight and your core tight.\n\nStep 4: Return/Repeat Allow the kettlebell to swing back down between your legs, maintaining control, and repeat the movement for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Kettlebell"
    ],
    "muscleGroups": [
      "back",
      "glutes",
      "hamstrings",
      "quadriceps",
      "shoulders"
    ],
    "imageUrl": "https://img.youtube.com/vi/r777bo9KuY4/hqdefault.jpg",
    "videoId": "r777bo9KuY4",
    "videoUrl": "https://www.youtube.com/watch?v=r777bo9KuY4"
  },
  {
    "id": "c71d5c4a-8151-4809-bb9e-13acb432ae62",
    "name": "Incline Dumbbell Bench Press",
    "slug": "incline-dumbbell-bench-press-0100",
    "description": "Step 1: Setup Lie back on an incline bench set at a 30-45 degree angle, holding a dumbbell in each hand at shoulder level with palms facing forward.\n\nStep 2: Brace/Position Engage your core, keep your feet flat on the floor, and ensure your shoulder blades are retracted and pressed against the bench.\n\nStep 3: Execute Press the dumbbells upward until your arms are fully extended, maintaining a slight bend in your elbows at the top of the movement.\n\nStep 4: Return/Repeat Lower the dumbbells back to the starting position at shoulder level, controlling the movement and keeping your elbows at a 45-degree angle to your body.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells",
      "Bench"
    ],
    "muscleGroups": [
      "chest",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/_NrQUYg7Nlc/hqdefault.jpg",
    "videoId": "_NrQUYg7Nlc",
    "videoUrl": "https://www.youtube.com/watch?v=_NrQUYg7Nlc"
  },
  {
    "id": "37008f09-3ac8-4a99-911d-a13ccb0da42f",
    "name": "W In In Out Out",
    "slug": "w-in-in-out-out-0158",
    "description": "Step 1: Setup Stand with your feet hip-width apart and arms extended in front of you at shoulder height, palms facing down.\n\nStep 2: Brace/Position Engage your core and maintain a slight bend in your knees while keeping your back straight.\n\nStep 3: Execute Step out to the right with your right foot, then bring your left foot to meet it, forming a 'W' shape. Next, step out to the left with your left foot, then bring your right foot to meet it, returning to the starting position.\n\nStep 4: Return/Repeat Repeat the sequence for the desired number of repetitions, ensuring to maintain proper posture throughout the movement.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/6rkW1Mmz4Ak/hqdefault.jpg",
    "videoId": "6rkW1Mmz4Ak",
    "videoUrl": "https://www.youtube.com/watch?v=6rkW1Mmz4Ak"
  },
  {
    "id": "6cc1f544-2da5-42b3-ba2c-11814d9e9be6",
    "name": "Side Lying Leg Raise",
    "slug": "side-lying-leg-raise-0211",
    "description": "Step 1: Setup Lie on your side with your legs extended straight, stacking your hips and shoulders.\n\nStep 2: Brace/Position Engage your core and rest your head on your lower arm, keeping your upper arm in front of your chest for support.\n\nStep 3: Execute Lift your top leg upward to about a 45-degree angle, keeping it straight and your foot flexed.\n\nStep 4: Return/Repeat Lower your leg back to the starting position without letting it touch your bottom leg, then repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/xVSwJhJCsgo/hqdefault.jpg",
    "videoId": "xVSwJhJCsgo",
    "videoUrl": "https://www.youtube.com/watch?v=xVSwJhJCsgo"
  },
  {
    "id": "d790bfcb-2712-4a85-9fbb-32dde8b5a334",
    "name": "Incline Dumbbell Curl",
    "slug": "incline-dumbbell-curl-0101",
    "description": "Step 1: Setup Sit on an incline bench with your back supported, holding a dumbbell in each hand at arm's length, palms facing forward.\n\nStep 2: Brace/Position Keep your elbows close to your torso and engage your core to maintain stability throughout the movement.\n\nStep 3: Execute Curl the dumbbells upward by flexing your elbows, bringing them towards your shoulders while keeping your upper arms stationary.\n\nStep 4: Return/Repeat Lower the dumbbells back to the starting position in a controlled manner, fully extending your arms before repeating the movement.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "biceps",
      "chest",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/0dT4L6Lsi80/hqdefault.jpg",
    "videoId": "0dT4L6Lsi80",
    "videoUrl": "https://www.youtube.com/watch?v=0dT4L6Lsi80"
  },
  {
    "id": "39c2984a-c917-4df7-9631-3d7fc9cdc1e2",
    "name": "Single Leg Throw And Catch Frontal",
    "slug": "single-leg-throw-and-catch-frontal-0038",
    "description": "Step 1: Setup Stand on one leg with a slight bend in the knee, holding a medicine ball at chest level with both hands.\n\nStep 2: Brace/Position Engage your core and maintain an upright posture, ensuring your standing leg is stable and aligned under your hip.\n\nStep 3: Execute Rotate your torso to one side and throw the medicine ball against a wall or to a partner, using your upper body while maintaining balance on the standing leg.\n\nStep 4: Return/Repeat Catch the ball as it rebounds, return to the starting position, and repeat the throw for the designated number of repetitions before switching legs.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core",
      "glutes"
    ],
    "imageUrl": "https://img.youtube.com/vi/TLgyE-Flcws/hqdefault.jpg",
    "videoId": "TLgyE-Flcws",
    "videoUrl": "https://www.youtube.com/watch?v=TLgyE-Flcws"
  },
  {
    "id": "c4dd8a74-bbb9-4b36-8045-bceae6527e45",
    "name": "Child's Pose",
    "slug": "child-s-pose",
    "description": "Step 1: Start on your hands and knees in a tabletop position with your wrists aligned under your shoulders and knees under your hips.\n\nStep 2: Exhale and sit back on your heels, extending your arms forward and lowering your chest toward the floor.\n\nStep 3: Relax your forehead on the ground and breathe deeply, allowing your body to sink into the stretch.\n\nStep 4: Hold the position for 30 seconds to 1 minute, focusing on releasing tension in your back and shoulders.",
    "coachingCues": [],
    "primaryEquipment": [
      "None"
    ],
    "muscleGroups": [
      "back"
    ],
    "imageUrl": "https://img.youtube.com/vi/_ZX_zTOBgp8/hqdefault.jpg",
    "videoId": "_ZX_zTOBgp8",
    "videoUrl": "https://www.youtube.com/watch?v=_ZX_zTOBgp8"
  },
  {
    "id": "b1807729-75b5-455c-ae34-c46073931c3d",
    "name": "Squat Jump With Stabilization Multiplanar",
    "slug": "squat-jump-with-stabilization-multiplanar-0188",
    "description": "Step 1: Setup Stand with your feet shoulder-width apart, toes slightly pointed out, and arms at your sides.\n\nStep 2: Brace/Position Engage your core, keep your chest up, and lower into a squat position, ensuring your knees track over your toes.\n\nStep 3: Execute Explode upward into a jump, reaching your arms overhead, and rotate your body 90 degrees to the right mid-air.\n\nStep 4: Return/Repeat Land softly with your knees slightly bent, stabilize your position, then return to the squat and repeat the jump, rotating to the left on the next repetition.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "calves",
      "core",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/SEM9l4KNM-I/hqdefault.jpg",
    "videoId": "SEM9l4KNM-I",
    "videoUrl": "https://www.youtube.com/watch?v=SEM9l4KNM-I"
  },
  {
    "id": "36cede00-2077-455e-a39c-ef3d6f940d5f",
    "name": "Foam Roll Adductors",
    "slug": "foam-roll-adductors",
    "description": "Step 1: From a modified plank, position the foam roller underneath the groin with the thigh out to your side. Using your arms and other leg for support, increase the amount of pressure on the muscle until you feel a manageable level of tenderness.\n\nStep 2: Then, roll the length of the muscle area at about 1 inch per second looking for the most tender area.\n\nStep 3: Once you've found the most tender area, hold the position and pressure there for the recommended time. Maintain posture throughout.\n\nStep 4: Repeat on the other side. Avoid continuous movement, letting the head fall forward, collapsing the shoulders or spine, or holding your breath.",
    "coachingCues": [],
    "primaryEquipment": [
      "Foam Roller"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/Nqol0T6rKDg/hqdefault.jpg",
    "videoId": "Nqol0T6rKDg",
    "videoUrl": "https://www.youtube.com/watch?v=Nqol0T6rKDg"
  },
  {
    "id": "d7decfc6-98b3-4def-a749-d53d6db8b772",
    "name": "Medicine Ball Bent Over Chest Pass",
    "slug": "medicine-ball-bent-over-chest-pass-0166",
    "description": "Step 1: Stand with your feet shoulder-width apart, holding the medicine ball at chest level with both hands.\n\nStep 2: Hinge at your hips to bend forward slightly while keeping your back straight and core engaged.\n\nStep 3: Rotate your torso to one side and then explosively pass the medicine ball forward, aiming for a target.\n\nStep 4: Retrieve the ball and repeat the movement, alternating sides with each pass.",
    "coachingCues": [],
    "primaryEquipment": [
      "Medicine Ball"
    ],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/6Uuxb4h2N5I/hqdefault.jpg",
    "videoId": "6Uuxb4h2N5I",
    "videoUrl": "https://www.youtube.com/watch?v=6Uuxb4h2N5I"
  },
  {
    "id": "e53d8b8f-1e98-4076-896f-ad300f7901cf",
    "name": "Lunge Jump",
    "slug": "lunge-jump",
    "description": "Step 1: Start in a lunge position with arms pulled back, trail leg a few inches off the floor, and knees at approximately 90˚. Draw in the abs.\n\nStep 2: Rapidly explode upward off both legs and jump.\n\nStep 3: As you leave the ground, switch the legs in the air landing with the other leg out in front. Land as quietly as possible, keeping the feet, knees, and hips pointing straight ahead.\n\nStep 4: Upon impact immediately repeat. Maintain posture throughout. Avoid landing hard/loudly, letting the heels strike the ground hard, allowing the knees to collapse inward or your back to arch or slouch.",
    "coachingCues": [],
    "primaryEquipment": [
      "None"
    ],
    "muscleGroups": [
      "calves",
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/_5kDxC0flg0/hqdefault.jpg",
    "videoId": "_5kDxC0flg0",
    "videoUrl": "https://www.youtube.com/watch?v=_5kDxC0flg0"
  },
  {
    "id": "ea373dd2-d352-4459-8576-2fbc095e0bd1",
    "name": "Kettlebell Front Squat",
    "slug": "kettlebell-front-squat",
    "description": "Step 1: Stand in athletic posture with feet hip to shoulder width apart and toes forward. Draw in and brace the abs. Pull the shoulder blades back and down and lock the elbows into the side of the body. Hold the kettlebells on the sides of the handles.\n\nStep 2: Drive the hips back and squat down to a maximum depth that posture and alignment can be maintained (typically between 90˚ at the knee and thigh parallel to the floor). Keep the weight balanced from heel to ball of foot and torso fairly upright.\n\nStep 3: Reverse the pattern and return to the starting position. Maintain posture throughout.\n\nStep 4: Repeat for the desired number of repetitions. Avoid slouching the back or shoulders, letting the elbows flare out, knees caving in or toes excessively turning out.",
    "coachingCues": [],
    "primaryEquipment": [
      "Kettlebell"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/-TeEMXoHQPM/hqdefault.jpg",
    "videoId": "-TeEMXoHQPM",
    "videoUrl": "https://www.youtube.com/watch?v=-TeEMXoHQPM"
  },
  {
    "id": "3f03eba2-b1fd-4d59-9424-5922f46f46bf",
    "name": "Cable Crossover",
    "slug": "cable-crossover",
    "description": "Step 1: Ensure cables are adjusted at chest height. Stand with your back toward the cable machine. Grab the handles and hold them out to the side of your body with your palms facing forward. Draw in and brace your abs. Lock shoulder blades back and down.\n\nStep 2: Drive the hands forward and together in an arcing motion allowing the hands to pass with one hand above and one below.\n\nStep 3: Reverse the pattern and return to the starting position moving through a maximum range of motion that technique can be maintained.\n\nStep 4: Repeat, alternating the top/bottom hand. Maintain posture throughout. Avoid arching or slouching the back, jutting the chin forward, slouching or shrugging the shoulders.",
    "coachingCues": [],
    "primaryEquipment": [
      "Cable Machine"
    ],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/XY6JrX1wyxk/hqdefault.jpg",
    "videoId": "XY6JrX1wyxk",
    "videoUrl": "https://www.youtube.com/watch?v=XY6JrX1wyxk"
  },
  {
    "id": "e87acc5c-d1fa-4eb4-98b5-78c0be3bf2ee",
    "name": "Face Pull",
    "slug": "face-pull",
    "description": "Step 1: Position the cable slightly above the head and grasp the rope with the thumbs pointing toward you. Stand tall with your feet slightly staggered and toes pointing straight ahead. Draw your abs.\n\nStep 2: Pull the cable toward your face by bending your elbows out to the side and pinching your shoulder blades together attempting to drive your fists by your ears.\n\nStep 3: Reverse the pattern and return to the starting position.\n\nStep 4: Repeat. Maintain posture throughout. Avoid jutting the chin forward, arching the lower back, letting the ribs flare, or shrugging the shoulders.",
    "coachingCues": [],
    "primaryEquipment": [
      "Cable Machine",
      "Rope"
    ],
    "muscleGroups": [
      "shoulders"
    ],
    "imageUrl": "https://img.youtube.com/vi/eTCBSFlCJ_s/hqdefault.jpg",
    "videoId": "eTCBSFlCJ_s",
    "videoUrl": "https://www.youtube.com/watch?v=eTCBSFlCJ_s"
  },
  {
    "id": "08c7ea8d-b31c-499e-b4cf-76ad9595b3e3",
    "name": "Reverse Crunch To Knee Up With Rotation",
    "slug": "reverse-crunch-to-knee-up-with-rotation",
    "description": "Step 1: Lie on your back on a bench with your legs hanging off the edge and your hands gripping the sides for support.\n\nStep 2: Engage your core and lift your knees towards your chest while simultaneously curling your hips off the bench.\n\nStep 3: Rotate your hips to one side as you bring your knees up, then return to the starting position.\n\nStep 4: Alternate sides with each repetition, ensuring controlled movement throughout the exercise.",
    "coachingCues": [],
    "primaryEquipment": [
      "Bench"
    ],
    "muscleGroups": [
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/wtKWBzDwfIM/hqdefault.jpg",
    "videoId": "wtKWBzDwfIM",
    "videoUrl": "https://www.youtube.com/watch?v=wtKWBzDwfIM"
  },
  {
    "id": "db0d149a-7f08-488e-b90f-59e44f1d598d",
    "name": "Lying Leg Curl Single Leg",
    "slug": "lying-leg-curl-single-leg",
    "description": "Step 1: Lie face down on the leg curl machine with feet hip width apart, abs drawn in and braced and glutes flexed. Ensure setup positions knee close to hinge on the machine and pad resting on lower calf/achilles. Position head in line with the back and lock shoulder blades back and down.\n\nStep 2: Pull toes toward the knees then drive the heel up toward the glutes as far as possible without arching the lower back or lifting the hips off of the pad. Leave one leg lying flat/extended on the pad.\n\nStep 3: Reverse the pattern and lower the weight back to the starting position. Maintain posture throughout.\n\nStep 4: Repeat for the desired number of repetitions. Avoid overarching the lower back, pointing or turning the toes out or letting the head fall toward the pad.",
    "coachingCues": [],
    "primaryEquipment": [
      "Lying Leg Curl Machine"
    ],
    "muscleGroups": [
      "core",
      "glutes",
      "hamstrings"
    ],
    "imageUrl": "https://img.youtube.com/vi/kGIfh3hHY0w/hqdefault.jpg",
    "videoId": "kGIfh3hHY0w",
    "videoUrl": "https://www.youtube.com/watch?v=kGIfh3hHY0w"
  },
  {
    "id": "98271241-d59a-42af-929b-1bfc55ba214f",
    "name": "Ball Crunch",
    "slug": "ball-crunch-0071",
    "description": "Step 1: Setup Sit on a stability ball with your feet flat on the floor, hip-width apart, and your lower back resting against the ball.\n\nStep 2: Brace/Position Engage your core by pulling your navel in towards your spine, and place your hands behind your head or crossed over your chest.\n\nStep 3: Execute Lean back slightly, allowing the ball to roll under your lower back, then curl your torso forward by contracting your abdominal muscles, lifting your shoulders off the ball.\n\nStep 4: Return/Repeat Slowly lower your torso back to the starting position, maintaining control, and repeat for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "core"
    ],
    "imageUrl": "https://img.youtube.com/vi/QFLftqPWjoI/hqdefault.jpg",
    "videoId": "QFLftqPWjoI",
    "videoUrl": "https://www.youtube.com/watch?v=QFLftqPWjoI"
  },
  {
    "id": "1803225d-fedb-4c3b-ab56-e8f6d5b25a2d",
    "name": "Lying Leg Curl",
    "slug": "lying-leg-curl",
    "description": "Step 1: Lie face down on the leg curl machine with feet hip width apart, abs drawn in and braced and glutes flexed. Ensure setup positions knee close to hinge on the machine and pad resting on lower calf/achilles. Position head in line with the back and lock shoulder blades back and down.\n\nStep 2: Pull toes toward the knees then drive the heels up toward the glutes as far as possible without arching the lower back or lifting the hips off of the pad.\n\nStep 3: Reverse the pattern and lower the weight back to the starting position. Maintain posture throughout.\n\nStep 4: Repeat for the desired number of repetitions. Avoid overarching the lower back, pointing or turning the toes out or letting the head fall toward the pad.",
    "coachingCues": [],
    "primaryEquipment": [
      "Lying Leg Curl Machine"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings"
    ],
    "imageUrl": "https://img.youtube.com/vi/Dq5y4WEcqqo/hqdefault.jpg",
    "videoId": "Dq5y4WEcqqo",
    "videoUrl": "https://www.youtube.com/watch?v=Dq5y4WEcqqo"
  },
  {
    "id": "3f3cac07-f4c8-412b-978e-2533660c7061",
    "name": "Repeat Ice Skater",
    "slug": "repeat-ice-skater-0180",
    "description": "Step 1: Stand on one leg with your knee slightly bent and your opposite leg extended behind you.\n\nStep 2: Jump laterally to the side, landing on your opposite leg while swinging your other leg behind you.\n\nStep 3: Immediately push off from the landing leg to jump back to the starting position.\n\nStep 4: Continue alternating sides for the desired number of repetitions or time.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/yRM27bTe868/hqdefault.jpg",
    "videoId": "yRM27bTe868",
    "videoUrl": "https://www.youtube.com/watch?v=yRM27bTe868"
  },
  {
    "id": "1e7054e2-ffe1-4591-956b-da5346ba76ee",
    "name": "Barbell Bench Press With Chains",
    "slug": "barbell-bench-press-with-chains",
    "description": "Step 1: Attach chains that attach to the collars or directly to the barbell. Lie supine on your back with neutral spine on a bench with your feet straight and flat on the floor. Draw in and brace the abs and lock the shoulders blades back and down on the bench. Grasp the barbell at about 1.5 - 2x shoulder width ensuring the hands are evenly distributed on the bar.\n\nStep 2: Unrack the bar (always use a spotter if you are able) bringing it directly above the shoulders. Starting with arms extended, slowly lower the bar toward the mid to lower chest moving through the maximum comfortable range.\n\nStep 3: Reverse the pattern and return the starting position.\n\nStep 4: Repeat. Maintain posture throughout. Do not arch the back or jut the head forward. Avoid letting the shoulders round, posture shift or feet lift in the air. Keep the elbows under the bar to maintain balance at all times.",
    "coachingCues": [],
    "primaryEquipment": [
      "Bench",
      "Barbell",
      "Plates",
      "Safety Collars",
      "Chains"
    ],
    "muscleGroups": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/6UKcYcDme-Y/hqdefault.jpg",
    "videoId": "6UKcYcDme-Y",
    "videoUrl": "https://www.youtube.com/watch?v=6UKcYcDme-Y"
  },
  {
    "id": "0719e25a-a570-4cac-a2aa-ff9c50cf8407",
    "name": "Iron Cross",
    "slug": "iron-cross",
    "description": "Step 1: Lie supine with the arms stretched to the side, palms up, and the feet together with legs straight. Draw in the abs.\n\nStep 2: Using momentum, bring one foot across the body toward the opposite hand through maximum range of motion.\n\nStep 3: Reverse the pattern and return to the starting position.\n\nStep 4: Repeat with the other leg. Maintain posture throughout. Avoid letting the shoulders pull up off the floor, holding the breath, or back excessively round.",
    "coachingCues": [],
    "primaryEquipment": [
      "None"
    ],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/uBEXsoMclPY/hqdefault.jpg",
    "videoId": "uBEXsoMclPY",
    "videoUrl": "https://www.youtube.com/watch?v=uBEXsoMclPY"
  },
  {
    "id": "c725120e-70dd-437f-8ea6-8bd258568285",
    "name": "Latissimus Dorsi Ball Stretch",
    "slug": "latissimus-dorsi-ball-stretch-0254",
    "description": "Step 1: Setup Stand next to a stability ball with your feet shoulder-width apart and knees slightly bent.\n\nStep 2: Brace/Position Place one hand on the ball, extending your arm fully while keeping your opposite arm at your side.\n\nStep 3: Execute Gently lean into the ball, allowing your torso to stretch towards the ground while keeping your hips stable.\n\nStep 4: Return/Repeat Hold the stretch for 15-30 seconds, then switch sides and repeat the process.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "full body"
    ],
    "imageUrl": "https://img.youtube.com/vi/dg_gevWZuQM/hqdefault.jpg",
    "videoId": "dg_gevWZuQM",
    "videoUrl": "https://www.youtube.com/watch?v=dg_gevWZuQM"
  },
  {
    "id": "8de5d0c8-d838-42d5-8410-d31c6eedcd75",
    "name": "Static 90 90 Hamstring Stretch",
    "slug": "static-90-90-hamstring-stretch-0250",
    "description": "Step 1: Setup Sit on the floor with your legs extended in front of you, bending one knee to create a 90-degree angle with your thigh and calf, while the other leg remains straight.\n\nStep 2: Brace/Position Keep your back straight and engage your core, ensuring your shoulders are relaxed and aligned over your hips.\n\nStep 3: Execute Gently lean forward from your hips towards the straight leg, reaching your hands towards your foot while maintaining a flat back.\n\nStep 4: Return/Repeat Hold the stretch for 20-30 seconds, then return to the starting position and switch legs to repeat the stretch.",
    "coachingCues": [],
    "primaryEquipment": [],
    "muscleGroups": [
      "glutes",
      "hamstrings",
      "quadriceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/h_yZV27H684/hqdefault.jpg",
    "videoId": "h_yZV27H684",
    "videoUrl": "https://www.youtube.com/watch?v=h_yZV27H684"
  },
  {
    "id": "de3e78aa-3189-447c-971d-be81570c42c1",
    "name": "Kettlebell Deadlift",
    "slug": "kettlebell-deadlift",
    "description": "Step 1: Stand in athletic posture with feet hip to shoulder width apart and toes pointing forward. Hinge at the hips and bend the knees to grab onto the kettlebell which is positioned between the midfeet. Brace the abs.\n\nStep 2: With the back flat and chin tucked, push into the floor to lift the kettlebell until the body is full upright.\n\nStep 3: Reverse the pattern, hinging at the hips to initiate, to return the bell to its starting position.\n\nStep 4: Repeat for the desired number of repetitions. Avoid rounding the spine, losing head position, letting the knees collapse inward or rounding the shoulders.",
    "coachingCues": [],
    "primaryEquipment": [
      "Kettlebell"
    ],
    "muscleGroups": [
      "back",
      "glutes",
      "hamstrings"
    ],
    "imageUrl": "https://img.youtube.com/vi/LnIMaf-XOpM/hqdefault.jpg",
    "videoId": "LnIMaf-XOpM",
    "videoUrl": "https://www.youtube.com/watch?v=LnIMaf-XOpM"
  },
  {
    "id": "413a9fc5-a91c-4d76-a875-db58b877904e",
    "name": "Dumbbell Renegade Row To Push Up",
    "slug": "dumbbell-renegade-row-to-push-up-0111",
    "description": "Step 1: Setup Position two dumbbells on the floor shoulder-width apart and assume a high plank position with your hands gripping the dumbbells, feet hip-width apart, and body in a straight line from head to heels.\n\nStep 2: Brace/Position Engage your core, keep your hips level, and maintain a neutral spine as you prepare to row the dumbbell.\n\nStep 3: Execute Row one dumbbell towards your hip while stabilizing your body, then place it back down and perform a push-up by lowering your chest to the ground and pressing back up.\n\nStep 4: Return/Repeat Alternate rowing the opposite dumbbell and continue the sequence for the desired number of repetitions.",
    "coachingCues": [],
    "primaryEquipment": [
      "Dumbbells"
    ],
    "muscleGroups": [
      "back",
      "biceps",
      "chest",
      "shoulders",
      "triceps"
    ],
    "imageUrl": "https://img.youtube.com/vi/RuJ9a05aa0A/hqdefault.jpg",
    "videoId": "RuJ9a05aa0A",
    "videoUrl": "https://www.youtube.com/watch?v=RuJ9a05aa0A"
  }
]

/**
 * Normalizes an exercise name for heuristic matching.
 * Strips superset suffixes "(Strength 1A)", "(Stability 1B)", parentheticals, phase markers, and punctuation.
 */
export function normalizeExerciseQuery(name: string): string {
  return String(name ?? '')
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

export const EXERCISE_ALIASES: Record<string, string> = {
  'prone cobra on floor': 'floor prone cobra',
  'squat to neutral overhead dumbbell press': 'dumbbell squat to overhead press',
  'single leg romanian deadlift to row': 'single leg romanian deadlift',
  'lateral tube walk': 'lateral band walking',
  'incline push up with scapular protraction': 'incline push up',
  'side plank with top leg lift': 'side plank',
  'chest supported dumbbell row': 'supported bent over dumbbell row',
  'dumbbell bent over extention': 'supported bent over dumbbell extension',
  'stability ball hamstring curl': 'floor bridge',
  'stability ball hamstring curls': 'floor bridge',
  'ball hamstring curl': 'floor bridge',
  'ball hamstring curls': 'floor bridge',
}

/**
 * Searches the official NASM library using exact canonical names only.
 * Deliberately rejects fuzzy or constructed exercise names so the app only uses
 * verified official movements from approved brand libraries.
 */
export function searchNasmLibraryMedia(query: string): FuzzyMatchResult | null {
  if (!query || !query.trim()) return null

  const normalizedQuery = normalizeExerciseQuery(query)
  if (!normalizedQuery) return null

  const resolvedQuery = EXERCISE_ALIASES[normalizedQuery] || normalizedQuery

  for (const record of NASM_COMPLETE_LIBRARY) {
    const normName = normalizeExerciseQuery(record.name)
    if (normName === resolvedQuery) {
      return {
        record,
        score: 100,
        matchedKey: record.name,
        isDirectMatch: true,
      }
    }
  }

  return null
}
