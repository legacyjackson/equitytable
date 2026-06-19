// app/api/invites/[code]/accept/route.ts
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST /api/invites/[code]/accept
// User accepts invite and joins table
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await params
    const svc = await createServiceClient()

    // Find the invitation
    const { data: invitation, error: inviteError } = await svc
      .from('table_invitations')
      .select('id, table_id, status, invited_email, invited_by, role, expires_at')
      .eq('token', code)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    if (invitation.status !== 'pending' || new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This invite is no longer active' },
        { status: 410 }
      )
    }

    // Verify the invited email matches the logged-in user
    if (invitation.invited_email && invitation.invited_email !== user.email) {
      return NextResponse.json(
        { error: 'This invite was sent to a different email' },
        { status: 403 }
      )
    }

    // Check user isn't already a member
    const { data: existingMembership } = await svc
      .from('table_memberships')
      .select('id')
      .eq('table_id', invitation.table_id)
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
      .upsert({
        table_id: invitation.table_id,
        user_id: user.id,
        role: invitation.role,
        status: 'active',
        invited_by: invitation.invited_by,
        joined_at: new Date().toISOString(),
      }, { onConflict: 'table_id,user_id' })
      .select()
      .single()

    if (memberError || !membership) {
      return NextResponse.json(
        { error: 'Failed to join table' },
        { status: 500 }
      )
    }

    // Mark invitation as accepted
    await svc
      .from('table_invitations')
      .update({
        status: 'accepted',
        accepted_by: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id)

    // Get table info
    const { data: table } = await svc
      .from('equity_tables')
      .select('id, name, slug')
      .eq('id', invitation.table_id)
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
