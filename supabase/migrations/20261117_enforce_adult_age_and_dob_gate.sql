-- =============================================================================
-- Remediation #8: Enforce 18+ Adult Eligibility (COPPA / Minor Waiver Protection)
-- Adds `date_of_birth` to `fitness_profiles` and enforces PostgreSQL CHECK
-- constraints blocking minor ages (< 18) and minor birthdates at the DB layer.
-- =============================================================================

ALTER TABLE public.fitness_profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Clear any legacy out-of-range test age values prior to enforcing CHECK constraint
UPDATE public.fitness_profiles
SET age = NULL
WHERE age IS NOT NULL AND (age < 18 OR age > 105);

UPDATE public.fitness_profiles
SET date_of_birth = NULL
WHERE date_of_birth IS NOT NULL
  AND (
    date_of_birth < DATE '1920-01-01'
    OR date_of_birth > (CURRENT_DATE - INTERVAL '18 years')::date
  );

ALTER TABLE public.fitness_profiles
  DROP CONSTRAINT IF EXISTS fitness_profiles_adult_age_check;

ALTER TABLE public.fitness_profiles
  ADD CONSTRAINT fitness_profiles_adult_age_check
  CHECK (age IS NULL OR (age >= 18 AND age <= 105));

ALTER TABLE public.fitness_profiles
  DROP CONSTRAINT IF EXISTS fitness_profiles_dob_adult_check;

ALTER TABLE public.fitness_profiles
  ADD CONSTRAINT fitness_profiles_dob_adult_check
  CHECK (
    date_of_birth IS NULL
    OR (
      date_of_birth >= DATE '1920-01-01'
      AND date_of_birth <= (CURRENT_DATE - INTERVAL '18 years')::date
    )
  );
