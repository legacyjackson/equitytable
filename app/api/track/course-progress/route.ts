// app/api/track/course-progress/route.ts
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId, status, progressPercent, completedAt } = body

    const svc = await createServiceClient()

    // Update or create course progress
    const { data, error } = await svc
      .from('course_progress')
      .upsert({
        user_id: user.id,
        course_id: courseId,
        status,
        progress_percent: progressPercent || 0,
        completed_at: completedAt,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Course progress tracking error:', error)
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 })
  }
}

---

// app/api/track/user-activity/route.ts
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tableId, lastActive } = body

    const svc = await createServiceClient()

    // Update user activity
    const { data, error } = await svc
      .from('user_activity')
      .upsert({
        user_id: user.id,
        table_id: tableId,
        last_active: lastActive || new Date().toISOString(),
        engagement_score: 10, // Default engagement points per activity
      }, {
        onConflict: 'user_id,table_id'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Activity tracking error:', error)
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 })
  }
}

---

// app/api/track/engagement/route.ts
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tableId, engagementScore } = body

    const svc = await createServiceClient()

    // Update engagement score
    const { data, error } = await svc
      .from('user_activity')
      .update({
        engagement_score: engagementScore,
        last_active: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('table_id', tableId)
      .select()
      .single()

    if (error) {
      // Create if doesn't exist
      await svc
        .from('user_activity')
        .insert({
          user_id: user.id,
          table_id: tableId,
          engagement_score: engagementScore,
        })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Engagement tracking error:', error)
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 })
  }
}
