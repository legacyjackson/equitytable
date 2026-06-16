import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { quiz_id, lesson_id, table_id, score, answers, passed } = await request.json()

    await supabase.from('quiz_attempts').insert({
      quiz_id,
      user_id: user.id,
      score,
      answers,
      passed,
    })

    // Award XP for passing
    if (passed) {
      await supabase.from('points_ledger').insert({
        user_id: user.id,
        table_id: table_id || null,
        points: 15,
        reason: 'Passed a lesson quiz',
        source_type: 'quiz_pass',
        source_id: quiz_id,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 })
  }
}
