import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import { tableInviteEmail } from '@/lib/email/templates'

// GET /api/tables/[tableId]/invites
// List pending invitations for a table
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tableId } = await params

    const { data: table } = await supabase
      .from('equity_tables')
      .select('owner_id')
      .eq('id', tableId)
      .single()

    if (!table || table.owner_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const svc = await createServiceClient()
    const { data: invites } = await svc
      .from('table_invitations')
      .select('id, invited_email, role, status, token, expires_at, created_at')
      .eq('table_id', tableId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    return NextResponse.json({
      invites: (invites ?? []).map((inv) => ({
        id: inv.id,
        email: inv.invited_email,
        role: inv.role,
        status: inv.status,
        link: `${appUrl}/invite/${inv.token}`,
        expires_at: inv.expires_at,
        created_at: inv.created_at,
      })),
    })
  } catch (error) {
    console.error('Fetch invites error:', error)
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 })
  }
}

// POST /api/tables/[tableId]/invites
// Create a new email invitation
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tableId } = await params
    const body = await request.json()
    const { email, role = 'member' } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const { data: table } = await supabase
      .from('equity_tables')
      .select('owner_id, name')
      .eq('id', tableId)
      .single()

    if (!table || table.owner_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const svc = await createServiceClient()

    const { data: invite, error: inviteError } = await svc
      .from('table_invitations')
      .insert({
        table_id: tableId,
        invited_email: email,
        invited_by: user.id,
        role,
      })
      .select('id, invited_email, role, status, token, expires_at, created_at')
      .single()

    if (inviteError || !invite) {
      console.error('Failed to create invite:', inviteError)
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteLink = `${appUrl}/invite/${invite.token}`

    const { data: { user: inviter } } = await supabase.auth.getUser()
    const inviterName = inviter?.user_metadata?.full_name ?? inviter?.email ?? 'Someone'

    const { subject, html } = tableInviteEmail({
      inviterName,
      tableName: table.name,
      inviteLink,
      role: invite.role,
    })
    await sendEmail({ to: invite.invited_email, subject, html }).catch((err) =>
      console.error('Invite email failed:', err)
    )

    return NextResponse.json({
      invite: {
        id: invite.id,
        email: invite.invited_email,
        role: invite.role,
        status: invite.status,
        link: inviteLink,
        expires_at: invite.expires_at,
        created_at: invite.created_at,
      },
    })
  } catch (error) {
    console.error('Create invite error:', error)
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }
}
