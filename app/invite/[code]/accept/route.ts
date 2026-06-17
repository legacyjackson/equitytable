// app/api/invites/[code]/accept/route.ts
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST /api/invites/[code]/accept
// User accepts invite and joins table
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }  // ✅ CORRECT
)
{
  const { code } = await params  // ← Must await it! {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = params
    const svc = await createServiceClient()

    // Find the invite
    const { data: invite, error: inviteError } = await svc
      .from('table_invites')
      .select('id, table_id, status, email')
      .eq('code', code)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    if (invite.status !== 'active') {
      return NextResponse.json(
        { error: 'This invite is no longer active' },
        { status: 410 }
      )
    }

    // If invite has email, verify it matches
    if (invite.email && invite.email !== user.email) {
      return NextResponse.json(
        { error: 'This invite was sent to a different email' },
        { status: 403 }
      )
    }

    // Check user isn't already a member
    const { data: existingMembership } = await svc
      .from('table_memberships')
      .select('id')
      .eq('table_id', invite.table_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of this table' },
        { status: 400 }
      )
    }

    // Add user as member
    const { data: membership, error: memberError } = await svc
      .from('table_memberships')
      .insert({
        table_id: invite.table_id,
        user_id: user.id,
        role: 'member',
        status: 'active',
        joined_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (memberError || !membership) {
      return NextResponse.json(
        { error: 'Failed to join table' },
        { status: 500 }
      )
    }

    // Mark invite as claimed
    await svc
      .from('table_invites')
      .update({
        status: 'claimed',
        claimed_by: user.id,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', invite.id)

    // Get table info
    const { data: table } = await svc
      .from('equity_tables')
      .select('id, name, slug')
      .eq('id', invite.table_id)
      .single()

    return NextResponse.json({
      success: true,
      table: {
        id: table?.id,
        name: table?.name,
        slug: table?.slug,
      },
    })
  } catch (error) {
    console.error('Accept invite error:', error)
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 })
  }
}
