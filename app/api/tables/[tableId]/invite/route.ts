import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// GET /api/tables/[tableId]/invite
// List all active invites for a table
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user owns this table
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
      .from('table_invites')
      .select('id, code, email, created_at, status, claimed_by, invite_link')
      .eq('table_id', tableId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    return NextResponse.json({ invites: invites || [] })
  } catch (error) {
    console.error('Fetch invites error:', error)
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 })
  }
}

// POST /api/tables/[tableId]/invite
// Create a new invite link
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, type = 'link' } = body

    // Check user owns this table
    const { data: table } = await supabase
      .from('equity_tables')
      .select('owner_id, name')
      .eq('id', tableId)
      .single()

    if (!table || table.owner_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Generate unique invite code
    const code = crypto.randomBytes(16).toString('hex')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteLink = `${appUrl}/invite/${code}`

    const svc = await createServiceClient()

    const { data: invite, error: inviteError } = await svc
      .from('table_invites')
      .insert({
        table_id: tableId,
        code,
        email: email || null,
        created_by: user.id,
        status: 'active',
        invite_link: inviteLink,
      })
      .select()
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
    }

    return NextResponse.json({
      invite: {
        id: invite.id,
        code: invite.code,
        link: inviteLink,
        email: invite.email,
        created_at: invite.created_at,
      },
    })
  } catch (error) {
    console.error('Create invite error:', error)
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }
}

// DELETE /api/tables/[tableId]/invite
// Revoke an invite (pass inviteId in body)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { inviteId } = body

    // Check user owns this table
    const { data: table } = await supabase
      .from('equity_tables')
      .select('owner_id')
      .eq('id', tableId)
      .single()

    if (!table || table.owner_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const svc = await createServiceClient()
    const { error } = await svc
      .from('table_invites')
      .update({ status: 'revoked' })
      .eq('id', inviteId)
      .eq('table_id', tableId)

    if (error) {
      return NextResponse.json({ error: 'Failed to revoke invite' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Revoke invite error:', error)
    return NextResponse.json({ error: 'Failed to revoke invite' }, { status: 500 })
  }
}
