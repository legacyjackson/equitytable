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

    // Recompute course-level progress from the lesson this belongs to
    const { data: lesson } = await supabase
      .from('lessons')
      .select('course_id')
      .eq('id', lesson_id)
      .single()

    if (lesson?.course_id) {
      const { data: courseLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', lesson.course_id)
        .eq('status', 'published')

      const lessonIds = (courseLessons ?? []).map((l) => l.id)
      const totalLessons = lessonIds.length

      let completedLessons = 0
      if (totalLessons > 0) {
        const { count } = await supabase
          .from('lesson_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('table_id', table_id || null)
          .eq('status', 'completed')
          .in('lesson_id', lessonIds)
        completedLessons = count ?? 0
      }

      const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

      await supabase.from('course_progress').upsert({
        user_id: user.id,
        course_id: lesson.course_id,
        table_id: table_id || null,
        completed_lessons: completedLessons,
        total_lessons: totalLessons,
        progress_percent: progressPercent,
        completed_at: totalLessons > 0 && completedLessons >= totalLessons ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,course_id,table_id' })
    }

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
        await supabase.from('user_badges').upsert({
          user_id: user.id,
          badge_id: badge.id,
          table_id: table_id || null,
        }, { onConflict: 'user_id,badge_id,table_id', ignoreDuplicates: true })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Progress save error:', error)
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }
}
