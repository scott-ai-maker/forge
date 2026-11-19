-- =============================================================================
-- Forge Athletic — Deactivate Legacy Unrestricted 100% Demo Codes
-- =============================================================================
-- Deactivates open-ended 100%-off demo codes (`VIPDEMO`, `FOUNDERPASS`, `ALLACCESS`)
-- that lacked `restricted_client_id` or `max_redemptions` caps.

UPDATE public.discount_codes
SET is_active = false
WHERE code IN ('VIPDEMO', 'FOUNDERPASS', 'ALLACCESS')
  AND is_active = true;
