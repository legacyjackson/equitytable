// app/api/tables/[tableId]/invites/route.ts
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// GET /api/tables/[tableId]/invites
// List all active invites for a table
export async function GET(
  request: Request,
  { params }: { params: { tableId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tableId } = params

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
      .select('id, code, email, created_at, status, claimed_by')
      .eq('table_id', tableId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    return NextResponse.json({ invites })
  } catch (error) {
    console.error('Fetch invites error:', error)
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 })
  }
}

// POST /api/tables/[tableId]/invites
// Create a new invite link or email invite
export async function POST(
  request: Request,
  { params }: { params: { tableId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tableId } = params
    const body = await request.json()
    const { email, type = 'link' } = body // type: 'link' or 'email'

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

    // Create invite record
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

    // If email type, send email notification (implement with Resend/SendGrid)
    if (type === 'email' && email) {
      // TODO: Send email to user with invite link
      // await sendInviteEmail(email, table.name, inviteLink, user.full_name)
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

// DELETE /api/tables/[tableId]/invites/[inviteId]
// Revoke an invite
export async function DELETE(
  request: Request,
  { params }: { params: { tableId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tableId } = params
    const url = new URL(request.url)
    const inviteId = url.pathname.split('/').pop()

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
