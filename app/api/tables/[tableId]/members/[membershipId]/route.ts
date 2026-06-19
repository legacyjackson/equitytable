import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// DELETE /api/tables/[tableId]/members/[membershipId]
// Remove a member from the table (owner only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tableId: string; membershipId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tableId, membershipId } = await params

    const { data: table } = await supabase
      .from('equity_tables')
      .select('owner_id')
      .eq('id', tableId)
      .single()

    if (!table || table.owner_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const svc = await createServiceClient()

    const { data: membership } = await svc
      .from('table_memberships')
      .select('role')
      .eq('id', membershipId)
      .eq('table_id', tableId)
      .single()

    if (membership?.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove the table owner' }, { status: 400 })
    }

    const { error } = await svc
      .from('table_memberships')
      .update({ status: 'removed' })
      .eq('id', membershipId)
      .eq('table_id', tableId)

    if (error) {
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove member error:', error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
