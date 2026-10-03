import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { enrichExerciseMedia } from '@/lib/nasm-exercise-video-catalog'
import { BRAND_LOGO_FALLBACK_IMAGE } from '@/lib/nasm-generated-images'

export async function GET(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach'])
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const admin = supabaseAdmin()

  const { data, error } = await admin
    .from('exercise_library_entries')
    .select('id, name, slug, description, coaching_cues, primary_equipment, muscle_groups, media_image_url, media_video_url, open_externally_only, is_active, metadata_json, created_at')
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(500)

  if (error) {
    return NextResponse.json({ error: 'Failed to load exercise library' }, { status: 500 })
  }

  const exercises = (data ?? []).map((e) => {
    const enriched = enrichExerciseMedia({
      name: e.name,
      videoUrl: e.media_video_url,
      imageUrl: e.media_image_url,
    })
    const resolvedImageUrl = enriched.imageUrl || BRAND_LOGO_FALLBACK_IMAGE

    return {
      id: e.id,
      name: e.name,
      slug: e.slug,
      description: e.description,
      coaching_cues: e.coaching_cues,
      primary_equipment: e.primary_equipment,
      muscle_groups: e.muscle_groups,
      media_image_url: resolvedImageUrl,
      media_video_url: enriched.videoUrl || e.media_video_url,
      embed_url: enriched.embedUrl,
      open_externally_only: e.open_externally_only,
      is_active: e.is_active,
      metadata: e.metadata_json ?? {},
      created_at: e.created_at,
    }
  })

  return NextResponse.json({ exercises })
}
