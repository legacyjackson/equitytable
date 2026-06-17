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

    const { data, error } = await svc
      .from('user_activity')
      .upsert({
        user_id: user.id,
        table_id: tableId,
        last_active: lastActive || new Date().toISOString(),
        engagement_score: 10,
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
