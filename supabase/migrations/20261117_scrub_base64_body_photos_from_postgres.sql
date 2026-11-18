-- ============================================================================
-- Migration: 20261117_scrub_base64_body_photos_from_postgres.sql
-- Purpose:
--   1. Scrub any legacy inline `data:image/...;base64` blobs or oversized URLs
--      stored in `public.body_composition_analyses.photo_data_url` so raw
--      full-body photographs never reside inline inside PostgreSQL rows.
--   2. Enforce a database-level CHECK constraint requiring `photo_data_url` to
--      be NULL or a compact private Storage object path (<= 512 characters,
--      never `data:%`).
-- ============================================================================

UPDATE public.body_composition_analyses
SET photo_data_url = NULL
WHERE photo_data_url IS NOT NULL
  AND (
    photo_data_url LIKE 'data:%'
    OR char_length(photo_data_url) > 512
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'body_comp_no_inline_base64_chk'
  ) THEN
    ALTER TABLE public.body_composition_analyses
      ADD CONSTRAINT body_comp_no_inline_base64_chk
      CHECK (
        photo_data_url IS NULL
        OR (
          photo_data_url NOT LIKE 'data:%'
          AND char_length(photo_data_url) <= 512
        )
      );
  END IF;
END $$;
