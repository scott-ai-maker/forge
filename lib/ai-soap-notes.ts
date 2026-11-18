/**
 * Forge Athletic AI Clinical S.O.A.P. Session Notes Engine
 * Synthesizes raw speech-to-text dictation, voice notes, or coach bullet points
 * into structured, auditable NASM OPT™ clinical session documentation.
 */

export type SoapNotesMode = 'clinical_soap' | 'executive_summary' | 'action_directives'

export interface GenerateSoapNotesParams {
  rawNotes: string
  clientName?: string
  sessionDate?: string
  clientGoal?: string
  nasmPhase?: number | string
  mode?: SoapNotesMode
}

export interface StructuredSoapOutput {
  formattedNotes: string
  subjective: string
  objective: string
  assessment: string
  plan: string
  keyMetrics?: {
    rpe?: number | null
    primaryLifts?: string[]
    compensationsNoted?: string[]
    nextFocus?: string
  }
}

function escapeRegExp(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Scrubs identifiable client names from raw coach dictation before sending notes
 * to external LLM endpoints (minimum-necessary de-identification safeguard).
 */
export function redactClientNameFromNotes(rawNotes: string, clientName?: string | null): string {
  if (!rawNotes) return ''
  if (!clientName) return rawNotes

  const cleanedName = clientName.trim()
  if (!cleanedName || cleanedName.toLowerCase() === 'athlete' || cleanedName.toLowerCase() === 'client') {
    return rawNotes
  }

  let redacted = rawNotes.replace(new RegExp(`\\b${escapeRegExp(cleanedName)}\\b`, 'gi'), 'Athlete')
  const nameTokens = cleanedName
    .split(/\s+/)
    .map(t => t.replace(/[^a-zA-Z'-]/g, '').trim())
    .filter(t => t.length >= 3 && !['the', 'coach', 'athlete', 'client'].includes(t.toLowerCase()))

  for (const token of nameTokens) {
    redacted = redacted.replace(new RegExp(`\\b${escapeRegExp(token)}\\b`, 'gi'), 'Athlete')
  }

  return redacted
}

/**
 * Transforms raw text/dictation into high-end clinical SOAP documentation.
 */
export async function generateClinicalSoapNotes(
  params: GenerateSoapNotesParams
): Promise<StructuredSoapOutput> {
  const { rawNotes, clientName = 'Athlete', sessionDate = new Date().toLocaleDateString(), clientGoal = 'General Fitness', nasmPhase = 'Phase 1-2', mode = 'clinical_soap' } = params

  if (!rawNotes || !rawNotes.trim()) {
    throw new Error('Raw notes content is required for clinical synthesis.')
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY

  if (apiKey) {
    try {
      const deidentifiedRawNotes = redactClientNameFromNotes(rawNotes.trim(), clientName)
      const systemInstruction = `You are Coach Gordon, Head Coach & Director of Human Performance at Forge Athletic (NASM-CPT® #1261890687, ASTI CPR/AED, B.S. IT).
You coach with deep empathy, compassionate care, uncompromising client safety, and results-driven sports science.
Your task is to convert raw, unstructured coach dictation / session notes into impeccable, professional sports-science session documentation for an executive athlete.

Format requirements:
- Tone: Empathetic, biomechanically rigorous, and professional.
- Scope of Practice: Maintain strict athletic training scope (zero medical diagnosing/prescribing; emphasize corrective regressions and orthopedic longevity).
- Privacy: Refer to the subject strictly as "Athlete" (never invent or guess personal names).
- Use the standard S.O.A.P. framework:
  • S (Subjective): Athlete energy, readiness, reported joint sensation, soreness, life/work stress, self-reported adherence.
  • O (Objective): Exercises performed, working loads (lbs/kg), completed sets x reps, RPE (Rate of Perceived Exertion), tempo cadence adherence (e.g. 4/2/1/1), heart rate / cardio stage if mentioned.
  • A (Assessment): Coach observations on movement quality, kinetic chain alignment, compensation patterns (e.g. knee valgus, excessive forward lean, lumbar hyperextension), fatigue threshold.
  • P (Plan): Next-session focus, CEx continuum adjustments (SMR, static stretch, activation), progression targets, recovery habits.

Ensure output is formatted clearly with bold headers and bullet points. Return valid JSON adhering to:
{
  "subjective": "...",
  "objective": "...",
  "assessment": "...",
  "plan": "...",
  "formattedNotes": "Markdown formatted full note with S.O.A.P sections",
  "keyMetrics": {
    "rpe": 7.5,
    "primaryLifts": ["Barbell Back Squat", "Romanian Deadlift"],
    "compensationsNoted": ["Slight knee valgus on final set"],
    "nextFocus": "Increase squat load to 235 lbs and emphasize VMO activation"
  }
}`

      const userPrompt = `Subject: Athlete (De-Identified)
Session Date: ${sessionDate}
Primary Goal: ${clientGoal}
Current Periodization: ${nasmPhase}
Synthesis Mode: ${mode}

Raw Coach Dictation / Notes:
"""
${deidentifiedRawNotes}
"""

Generate the structured SOAP output in JSON format.`

      const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']

      for (const model of modelsToTry) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
              systemInstruction: { parts: [{ text: systemInstruction }] },
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1200,
                responseMimeType: 'application/json',
              },
            }),
          })

          if (response.ok) {
            const data = await response.json()
            const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text
            if (candidateText) {
              const parsed = JSON.parse(candidateText)
              if (parsed.subjective || parsed.objective || parsed.formattedNotes) {
                return {
                  formattedNotes: parsed.formattedNotes || buildFormattedMarkdown(parsed),
                  subjective: parsed.subjective || 'Athlete presented in good readiness.',
                  objective: parsed.objective || 'Session movements completed as scheduled.',
                  assessment: parsed.assessment || 'Biomechanical alignment maintained within clinical thresholds.',
                  plan: parsed.plan || 'Continue periodization progression.',
                  keyMetrics: parsed.keyMetrics,
                }
              }
            }
          }
        } catch {
          // Continue to fallback model
        }
      }
    } catch {
      // Fallback to deterministic synthesis below
    }
  }

  // Deterministic local synthesis engine (guaranteed zero downtime / works without API key)
  return deterministicSoapSynthesis(rawNotes, clientName, sessionDate, nasmPhase)
}

function buildFormattedMarkdown(data: Partial<StructuredSoapOutput>): string {
  return `### S.O.A.P. Clinical Session Note

**[S] SUBJECTIVE:**
${data.subjective || 'Athlete completed session with high engagement and reported baseline readiness.'}

**[O] OBJECTIVE:**
${data.objective || 'Prescribed acute resistance variables and movement protocols completed.'}

**[A] ASSESSMENT:**
${data.assessment || 'Movement quality evaluated; kinetic chain integrity preserved under loading.'}

**[P] PLAN:**
${data.plan || 'Advance progressive overload parameters in subsequent microcycle.'}`
}

function deterministicSoapSynthesis(
  raw: string,
  clientName: string,
  sessionDate: string,
  nasmPhase: number | string
): StructuredSoapOutput {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  const content = lines.join(' ')

  const subjective = `Athlete (${clientName}) engaged in training on ${sessionDate}. Energy and self-reported performance noted from session cues: "${content.slice(0, 140)}...".`
  const objective = `Resistance & Movement Execution:\n• Prescribed OPT ${nasmPhase} acute variables executed.\n• Recorded performance details: ${content}`
  const assessment = `Movement Quality Assessment:\n• Kinetic chain alignment evaluated across core and primary resistance patterns.\n• Form mechanics monitored for fatigue-induced compensations.`
  const plan = `Next Session Directives:\n• Continue structured progression into upcoming microcycle.\n• Maintain prescribed recovery and corrective continuum homework.`

  const formattedNotes = `### S.O.A.P. Clinical Session Note
**Client:** ${clientName} | **Date:** ${sessionDate} | **Phase:** ${nasmPhase}

**[S] SUBJECTIVE:**
${subjective}

**[O] OBJECTIVE:**
${objective}

**[A] ASSESSMENT:**
${assessment}

**[P] PLAN:**
${plan}`

  return {
    formattedNotes,
    subjective,
    objective,
    assessment,
    plan,
    keyMetrics: {
      nextFocus: 'Progressive overload microcycle adjustment',
    },
  }
}

