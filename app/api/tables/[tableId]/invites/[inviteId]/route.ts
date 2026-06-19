import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// DELETE /api/tables/[tableId]/invites/[inviteId]
// Revoke a pending invitation
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tableId: string; inviteId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tableId, inviteId } = await params

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
      .from('table_invitations')
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
