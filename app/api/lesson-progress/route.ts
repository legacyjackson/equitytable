import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/lesson-progress
// Upserts lesson progress for the current user.
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { lesson_id, table_id, progress_percent, last_position_seconds, status } = await request.json()

    const { error } = await supabase
      .from('lesson_progress')
      .upsert({
        user_id: user.id,
        lesson_id,
        table_id: table_id || null,
        status,
        progress_percent: Math.min(100, Math.max(0, progress_percent)),
        last_position_seconds: last_position_seconds ?? 0,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,lesson_id,table_id' })

    if (error) throw error

    // Award points on first completion
    if (status === 'completed') {
      await supabase.from('points_ledger').insert({
        user_id: user.id,
        table_id: table_id || null,
        points: 10,
        reason: 'Completed a lesson',
        source_type: 'lesson_complete',
        source_id: lesson_id,
      })

      // Check for first-lesson badge
      const { data: badge } = await supabase
        .from('badges').select('id').eq('slug', 'first-lesson').maybeSingle()

      if (badge) {
        await supabase.from('user_badges').insert({
          user_id: user.id,
          badge_id: badge.id,
          table_id: table_id || null,
        }).onConflict('user_id,badge_id,table_id').ignore()
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Progress save error:', error)
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }
}
