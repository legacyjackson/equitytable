import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ tableId: string }>
}

// POST /api/tables/[tableId]/recordings
// Creates a recording record after a successful upload to Supabase Storage.
export async function POST(request: Request, { params }: RouteParams) {
  const { tableId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify the user is a facilitator, admin, or owner
  const { data: membership } = await supabase
    .from('table_memberships')
    .select('role')
    .eq('table_id', tableId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!membership || !['owner', 'admin', 'facilitator'].includes(membership.role)) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json()
  const { event_id, title, video_url, storage_path, duration_seconds, storage_provider = 'supabase', description, visibility = 'table_only' } = body

  if (!title || !video_url) {
    return NextResponse.json({ error: 'title and video_url are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('event_recordings')
    .insert({
      event_id: event_id || null,
      table_id: tableId,
      uploaded_by: user.id,
      title,
      description: description || null,
      video_url,
      storage_path: storage_path || null,
      storage_provider,
      duration_seconds: duration_seconds || null,
      visibility,
      status: 'ready',
    })
    .select('id')
    .single()

  if (error) {
    console.error('Recording insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Award "Event Host" badge to uploader
  const { data: badge } = await supabase
    .from('badges')
    .select('id')
    .eq('slug', 'event-host')
    .maybeSingle()

  if (badge) {
    await supabase.from('user_badges').insert({
      user_id: user.id,
      badge_id: badge.id,
      table_id: tableId,
    }).onConflict('user_id, badge_id, table_id').ignore()
  }

  await supabase.from('points_ledger').insert({
    user_id: user.id,
    table_id: tableId,
    points: 75,
    reason: 'Uploaded event recording',
    source_type: 'recording_upload',
    source_id: data.id,
  })

  return NextResponse.json({ id: data.id })
}
