-- Forge Athletic — Private Coach Voice Cache Storage Bucket
-- Stores SHA-256 hashed ElevenLabs synthesized MP3 briefings (`eleven_turbo_v2_5/<sha256>.mp3`)
-- Strictly private (`public = false`) and accessed exclusively via server-side `/api/voice/synthesize`.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'coach-voice-cache',
  'coach-voice-cache',
  false,
  5242880,
  ARRAY['audio/mpeg']
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['audio/mpeg'];

-- Service role bypasses RLS automatically; restrict direct storage.objects policies to coach role only.
DROP POLICY IF EXISTS "coach_voice_cache_coach_read" ON storage.objects;
CREATE POLICY "coach_voice_cache_coach_read"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'coach-voice-cache'
    AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = auth.uid() AND c.role = 'coach'
    )
  );
