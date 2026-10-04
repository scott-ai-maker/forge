'use client'

import { useMemo, useState, useEffect } from 'react'

type Choice = { value: string; label: string }

type Question = {
  key: string
  title: string
  description?: string
  choices: Choice[]
}

const QUESTIONS: Question[] = [
  {
    key: 'goal',
    title: 'What are your main training or fitness goals?',
    description: 'We will use your goals to suggest a plan that may work for you.',
    choices: [
      { value: 'lose_body_fat', label: 'Lose body fat' },
      { value: 'build_muscle', label: 'Build strength or muscle' },
      { value: 'improve_strength', label: 'Improve strength or power' },
      { value: 'rebuild_consistency', label: 'Move more comfortably and build consistency' },
    ],
  },
  {
    key: 'timeline',
    title: 'What is your preferred timeline?',
    description: 'Choose a pace that feels manageable for you.',
    choices: [
      { value: 'asap', label: 'I would like to get started soon' },
      { value: '1_to_3_months', label: 'In the next 1–3 months' },
      { value: '3_to_6_months', label: 'In the next 3–6 months' },
      { value: 'no_strict_timeline', label: 'I do not have a set timeline' },
    ],
  },
  {
    key: 'trainingDays',
    title: 'How many days per week can you realistically train?',
    description: 'We will work around the time you have available.',
    choices: [
      { value: '2', label: '2 days per week' },
      { value: '3', label: '3 days per week' },
      { value: '4', label: '4 days per week' },
      { value: '5_plus', label: '5 or more days per week' },
    ],
  },
  {
    key: 'supportLevel',
    title: 'What kind of coaching support would you like?',
    description: 'Choose the tools and coach feedback that fit your needs.',
    choices: [
      { value: 'program_only', label: 'Self-guided training tools (Core)' },
      { value: 'program_and_messaging', label: 'Training tools and audio guidance (Plus)' },
      { value: 'hybrid_monthly_calls', label: 'Movement feedback and progress reviews (Plus)' },
      { value: 'weekly_direct_calls', label: 'One-to-one coaching and video reviews (Coach Support)' },
    ],
  },
  {
    key: 'primaryObstacle',
    title: 'What has made it harder to reach your goals?',
    description: 'Your answer can help us suggest support that fits your life.',
    choices: [
      { value: 'no_clear_plan', label: 'I do not have a clear training plan' },
      { value: 'inconsistent_accountability', label: 'My schedule changes or I need help staying consistent' },
      { value: 'nutrition_habits', label: 'I have questions about food or supplements' },
      { value: 'technique_confidence', label: 'I want help with movement or exercise technique' },
    ],
  },
  {
    key: 'coachingHistory',
    title: 'Have you worked with a coach before?',
    choices: [
      { value: 'yes_worked', label: 'Yes, and I would like to continue' },
      { value: 'yes_no_consistency', label: 'Yes, but I had trouble staying consistent' },
      { value: 'no_first_time', label: 'No, this would be my first time' },
    ],
  },
  {
    key: 'budgetBand',
    title: 'What monthly membership fits your budget?',
    description: 'Choose the level of training support that works for you.',
    choices: [
      { value: 'under_50', label: 'Core ($19.99/month or $149/year)' },
      { value: '50_150', label: 'Plus ($49/month)' },
      { value: '150_plus', label: 'Coach Support ($199/month)' },
    ],
  },
  {
    key: 'readiness',
    title: 'When would you like to get started?',
    choices: [
      { value: 'this_week', label: 'This week' },
      { value: 'within_2_weeks', label: 'In the next two weeks' },
      { value: 'within_30_days', label: 'Within 30 days' },
      { value: 'just_researching', label: 'I am still exploring my options' },
    ],
  },
]

type Answers = Record<string, string>

type Tier = 'digital_lab' | 'program_messaging' | 'hybrid' | 'premium_1_1' | 'waitlist'

function recommendationFromAnswers(answers: Answers): Tier {
  if (answers.readiness === 'just_researching' && answers.budgetBand === 'under_50') {
    return 'digital_lab'
  }

  if (answers.budgetBand === 'under_50' || answers.supportLevel === 'program_only') {
    return 'digital_lab'
  }

  if (answers.supportLevel === 'weekly_direct_calls' || answers.budgetBand === '150_plus') {
    return 'premium_1_1'
  }

  if (answers.supportLevel === 'hybrid_monthly_calls' || answers.supportLevel === 'program_and_messaging' || answers.budgetBand === '50_150') {
    return 'hybrid'
  }

  return 'program_messaging'
}

function recommendationDetails(tier: Tier) {
  if (tier === 'digital_lab') {
    return {
      title: 'Core',
      price: '$19.99',
      cadence: '/month',
    }
  }
  if (tier === 'premium_1_1') {
    return {
      title: 'Coach Support',
      price: '$199',
      cadence: '/month',
    }
  }
  if (tier === 'hybrid') {
    return {
      title: 'Plus',
      price: '$49',
      cadence: '/month',
    }
  }
  if (tier === 'waitlist') {
    return {
      title: 'Early Access',
      price: '',
      cadence: '',
    }
  }
  return {
    title: 'Core',
    price: '$19.99',
    cadence: '/month',
  }
}

function recommendationCta(tier: Tier) {
  if (tier === 'digital_lab') return { href: '/packages?tier=forge-core', label: 'Choose Core' }
  if (tier === 'premium_1_1') return { href: '/packages?tier=forge-transformation-direct', label: 'Choose Coach Support' }
  if (tier === 'hybrid') return { href: '/packages?tier=forge-pro-athlete', label: 'Choose Plus' }
  if (tier === 'waitlist') return { href: '/#waitlist-hero', label: 'Join the early access list' }
  return { href: '/packages?tier=forge-core', label: 'Choose Core' }
}

export default function ApplyQuiz() {
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  useEffect(() => {
    setMounted(true)
  }, [])

  const current = QUESTIONS[step]
  const isLastQuestion = step === QUESTIONS.length - 1
  const canAdvance = Boolean(current && answers[current.key])
  const recommendation = useMemo(() => recommendationFromAnswers(answers), [answers])

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const canSubmit = isEmailValid && submitState !== 'loading'

  async function submitApplication() {
    if (!canSubmit) return
    setSubmitState('loading')

    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName,
          goal: answers.goal,
          timeline: answers.timeline,
          trainingDays: answers.trainingDays,
          supportLevel: answers.supportLevel,
          primaryObstacle: answers.primaryObstacle,
          coachingHistory: answers.coachingHistory,
          budgetBand: answers.budgetBand,
          readiness: answers.readiness,
          recommendedTier: recommendation,
        }),
      })

      if (!res.ok) throw new Error('submit_failed')
      setSubmitState('success')
    } catch {
      setSubmitState('error')
    }
  }

  if (step >= QUESTIONS.length) {
    const tierDetails = recommendationDetails(recommendation)
    const cta = recommendationCta(recommendation)

    return (
      <section
        className="apply-quiz-card glass-card-gold"
        data-hydrated={mounted ? 'true' : 'false'}
        style={{
          padding: 'clamp(20px, 4vw, 36px)',
          maxWidth: 760,
          width: '100%',
          boxSizing: 'border-box',
          borderRadius: 12,
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(197, 160, 89, 0.15)',
        }}
      >
        <p style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 8 }}>
          Recommended Advisory Pathway
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <h2 className="font-serif" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', lineHeight: 1.2, margin: 0, color: '#FFFFFF', letterSpacing: '0.04em' }}>
            {tierDetails.title}
          </h2>
          {tierDetails.price && (
            <span className="font-telemetry font-mono" style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', color: 'var(--gold)', fontWeight: 700 }}>
              {tierDetails.price}
              <span style={{ fontSize: 13, color: 'var(--gray)', fontFamily: 'Raleway, sans-serif', fontWeight: 400, marginLeft: 2 }}>{tierDetails.cadence}</span>
            </span>
          )}
        </div>
        <p style={{ color: '#CBD5E1', lineHeight: 1.7, marginBottom: 24, fontSize: 15 }}>
          Based on your goals, budget, and support preference, this is your highest-fit starting path.
        </p>

        <form
          onSubmit={e => {
            e.preventDefault()
            void submitApplication()
          }}
        >
          <div className="apply-quiz-form-grid sgf-form-grid" style={{ marginBottom: 18, gap: 14 }}>
            <div>
              <label htmlFor="apply-first-name" style={{ display: 'block', marginBottom: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)', fontWeight: 700 }}>
                First Name (Optional)
              </label>
              <input
                id="apply-first-name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Your name"
                autoComplete="given-name"
                autoCapitalize="words"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(14, 23, 36, 0.9)',
                  border: '1px solid rgba(197, 160, 89, 0.3)',
                  borderRadius: 8,
                  color: '#FFFFFF',
                  fontSize: 16,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label htmlFor="apply-email" style={{ display: 'block', marginBottom: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)', fontWeight: 700 }}>
                Email Address *
              </label>
              <input
                id="apply-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(14, 23, 36, 0.9)',
                  border: '1px solid rgba(197, 160, 89, 0.3)',
                  borderRadius: 8,
                  color: '#FFFFFF',
                  fontSize: 16,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {submitState === 'success' && (
            <p style={{ color: '#34D399', margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>
              ✓ Application received. Coach Gordon will review your submission.
            </p>
          )}
          {submitState === 'error' && (
            <p style={{ color: 'var(--error)', margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>
              Could not submit right now. Please check your network and try again.
            </p>
          )}

          <div className="apply-quiz-actions" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="submit"
              disabled={!canSubmit}
              className="tactile-btn"
              style={{
                border: 'none',
                background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                color: '#080E14',
                fontFamily: 'var(--font-sans, Raleway), sans-serif',
                fontSize: 13.5,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '12px 24px',
                borderRadius: 6,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                opacity: canSubmit ? 1 : 0.6,
                fontWeight: 800,
                boxShadow: '0 4px 14px rgba(197, 160, 89, 0.35)',
              }}
            >
              {submitState === 'loading' ? 'Submitting...' : 'Submit Application'}
            </button>
            <a
              href={cta.href}
              className="tactile-btn"
              style={{
                border: '1px solid rgba(197, 160, 89, 0.4)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: 'var(--gold-lt)',
                textDecoration: 'none',
                fontFamily: 'var(--font-sans, Raleway), sans-serif',
                fontSize: 13.5,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '12px 20px',
                borderRadius: 6,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {cta.label} →
            </a>
            <button
              type="button"
              onClick={() => {
                setStep(0)
                setSubmitState('idle')
                setEmail('')
                setFirstName('')
              }}
              className="tactile-btn"
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--gray)',
                fontFamily: 'Raleway, sans-serif',
                fontSize: 13,
                padding: '12px 14px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Retake Quiz
            </button>
          </div>
        </form>
      </section>
    )
  }

  return (
    <section
      className="apply-quiz-card glass-card"
      data-hydrated={mounted ? 'true' : 'false'}
      style={{
        padding: 'clamp(20px, 4vw, 36px)',
        maxWidth: 760,
        width: '100%',
        boxSizing: 'border-box',
        borderRadius: 12,
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 800, margin: 0 }}>
          Fit Assessment Step {step + 1} of {QUESTIONS.length}
        </p>
        <div style={{ width: 100, height: 4, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%`, height: '100%', background: 'var(--gold)', transition: 'width 0.25s ease' }} />
        </div>
      </div>

      <h2 className="font-serif" style={{ fontSize: 'clamp(1.5rem, 4.5vw, 2.2rem)', lineHeight: 1.25, marginBottom: 8, color: '#FFFFFF', letterSpacing: '0.03em', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
        {current.title}
      </h2>
      {current.description && <p style={{ color: '#CBD5E1', marginBottom: 14, fontSize: 14 }}>{current.description}</p>}

      <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
        {current.choices.map(choice => {
          const selected = answers[current.key] === choice.value
          return (
            <button
              key={choice.value}
              type="button"
              disabled={!mounted}
              onClick={() => {
                setAnswers(prev => ({ ...prev, [current.key]: choice.value }))
              }}
              className="tactile-btn"
              style={{
                border: selected ? '1.5px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.08)',
                background: selected ? 'rgba(197, 160, 89, 0.14)' : 'rgba(8, 14, 24, 0.65)',
                color: selected ? '#FFFFFF' : '#CBD5E1',
                textAlign: 'left',
                padding: '14px 16px',
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'Raleway, sans-serif',
                fontSize: 14,
                fontWeight: selected ? 700 : 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.18s ease',
              }}
            >
              <span>{choice.label}</span>
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  border: selected ? '1.5px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.2)',
                  background: selected ? 'var(--gold)' : 'transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {selected && <span style={{ width: 6, height: 6, borderRadius: 3, background: '#080E14' }} />}
              </span>
            </button>
          )
        })}
      </div>

      <div className="apply-quiz-nav" style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button
          type="button"
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="tactile-btn"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'transparent',
            color: 'var(--gray)',
            fontFamily: 'Raleway, sans-serif',
            fontSize: 13,
            fontWeight: 600,
            padding: '10px 18px',
            borderRadius: 6,
            cursor: step === 0 ? 'not-allowed' : 'pointer',
            opacity: step === 0 ? 0.4 : 1,
          }}
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => setStep(s => s + 1)}
          disabled={!canAdvance}
          className="tactile-btn"
          style={{
            border: 'none',
            background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
            color: '#080E14',
            fontFamily: 'Raleway, sans-serif',
            fontSize: 13.5,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '12px 24px',
            borderRadius: 6,
            cursor: canAdvance ? 'pointer' : 'not-allowed',
            opacity: canAdvance ? 1 : 0.5,
            fontWeight: 800,
          }}
        >
          {isLastQuestion ? 'See Recommended Tier →' : 'Continue →'}
        </button>
      </div>
    </section>
  )
}
