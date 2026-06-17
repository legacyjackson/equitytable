import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST /api/qr/checkin
// Records RSVP check-in for an event attendee.
// Accepts either a token (from QR scan) or email (manual entry by host).
// Also awards "Event Attendee" badge and points on first check-in.
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Sign in to check in' }, { status: 401 })

    const body = await request.json()
    const { event_id, table_id, token, email } = body

    if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 })

    const serviceClient = await createServiceClient()

    // Verify event exists and belongs to this table
    const { data: event } = await serviceClient
      .from('equity_events')
      .select('id, title, table_id, status')
      .eq('id', event_id)
      .eq('table_id', table_id)
      .maybeSingle()

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    if (event.status === 'canceled') return NextResponse.json({ error: 'Event is canceled' }, { status: 400 })

    // Determine user to check in
    let targetUserId = user.id
    let targetProfile: { id: string; full_name: string | null; email: string } | null = null

    if (email) {
      // Host is checking someone in by email
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', email.toLowerCase())
        .maybeSingle()

      if (!profile) {
        return NextResponse.json({ error: `No user found with email ${email}` }, { status: 404 })
      }
      targetUserId = profile.id
      targetProfile = profile
    } else {
      // Self check-in or QR scan — the requesting user checks themselves in
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', user.id)
        .maybeSingle()
      targetProfile = profile
    }

    // Upsert RSVP with checked_in = true
    const { error: rsvpErr } = await serviceClient
      .from('event_rsvps')
      .upsert({
        event_id,
        user_id: targetUserId,
        status: 'going',
        checked_in: true,
        checked_in_at: new Date().toISOString(),
      }, { onConflict: 'event_id, user_id' })

    if (rsvpErr) {
      console.error('RSVP check-in error:', rsvpErr)
      return NextResponse.json({ error: rsvpErr.message }, { status: 500 })
    }

    // Award badge + points (first time only via upsert conflict ignore)
    const { data: badge } = await serviceClient
      .from('badges')
      .select('id')
      .eq('slug', 'event-attendee')
      .maybeSingle()

    if (badge) {
      await serviceClient.from('user_badges').upsert({
        user_id: targetUserId,
        badge_id: badge.id,
        table_id,
      }, { onConflict: 'user_id,badge_id,table_id', ignoreDuplicates: true })
    }

    // Only award points once per event (check if they already have points for this)
    const { data: existingPoints } = await serviceClient
      .from('points_ledger')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('source_type', 'event_attend')
      .eq('source_id', event_id)
      .maybeSingle()

    if (!existingPoints) {
      await serviceClient.from('points_ledger').insert({
        user_id: targetUserId,
        table_id,
        points: 30,
        reason: `Attended: ${event.title}`,
        source_type: 'event_attend',
        source_id: event_id,
      })
    }

    return NextResponse.json({
      success: true,
      user_id: targetUserId,
      name: targetProfile?.full_name || targetProfile?.email || 'Attendee',
      event_title: event.title,
    })
  } catch (error: any) {
    console.error('QR check-in error:', error)
    return NextResponse.json({ error: error.message || 'Check-in failed' }, { status: 500 })
  }
}

// GET /api/qr/checkin?event_id=...
// Returns check-in list for an event (host use only)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('event_id')
  const tableId = searchParams.get('table_id')

  if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Must be facilitator or above
  if (tableId) {
    const { data: membership } = await supabase
      .from('table_memberships')
      .select('role')
      .eq('table_id', tableId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!['owner', 'admin', 'facilitator'].includes(membership?.role || '')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }
  }

  const { data: rsvps } = await supabase
    .from('event_rsvps')
    .select('user_id, status, checked_in, checked_in_at, profiles(full_name, email, avatar_url)')
    .eq('event_id', eventId)
    .order('checked_in_at', { ascending: false })

  return NextResponse.json({ rsvps: rsvps || [] })
}
