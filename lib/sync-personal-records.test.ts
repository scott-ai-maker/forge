import { describe, it, expect, vi, beforeEach } from 'vitest'
import { syncDatabasePersonalRecordsForExercises } from './sync-personal-records'
import { SupabaseClient } from '@supabase/supabase-js'

describe('syncDatabasePersonalRecordsForExercises', () => {
  let mockSupabase: Record<string, unknown>
  let mockSelect: ReturnType<typeof vi.fn>
  let mockDelete: ReturnType<typeof vi.fn>
  let mockUpsert: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockSelect = vi.fn()
    mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        ilike: vi.fn().mockResolvedValue({ error: null }),
      }),
    })
    mockUpsert = vi.fn().mockResolvedValue({ error: null })

    mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'workout_set_logs') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                ilike: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    gt: vi.fn().mockReturnValue({
                      gt: mockSelect,
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'client_personal_records') {
          return {
            delete: mockDelete,
            upsert: mockUpsert,
          }
        }
        return {}
      }),
    }
  })

  it('deletes personal records when no sets remain for an exercise', async () => {
    mockSelect.mockResolvedValueOnce({ data: [], error: null })

    await syncDatabasePersonalRecordsForExercises(
      mockSupabase as unknown as SupabaseClient,
      'user-123',
      ['Russian Twist']
    )

    expect(mockDelete).toHaveBeenCalled()
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('recalculates and upserts personal record when remaining sets exist', async () => {
    const remainingSets = [
      { exercise_name: 'Dumbbell Bent Over Row', reps: 10, weight_kg: 20, session_date: '2026-10-10' },
      { exercise_name: 'Dumbbell Bent Over Row', reps: 8, weight_kg: 25, session_date: '2026-10-15' },
    ]
    mockSelect.mockResolvedValueOnce({ data: remainingSets, error: null })

    await syncDatabasePersonalRecordsForExercises(
      mockSupabase as unknown as SupabaseClient,
      'user-123',
      ['Dumbbell Bent Over Row']
    )

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        exercise_name: 'Dumbbell Bent Over Row',
        max_weight_kg: 25,
        max_weight_reps: 8,
        max_weight_date: '2026-10-15',
        total_sets_logged: 2,
      }),
      { onConflict: 'user_id,exercise_name' }
    )
  })
})
