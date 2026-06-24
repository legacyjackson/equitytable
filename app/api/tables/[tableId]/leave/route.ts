import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST /api/tables/[tableId]/leave
// Lets the current user leave a table they're a member of.
// Owners can't leave their own table — they'd need to transfer
// ownership or delete the table instead.
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
    const svc = await createServiceClient()

    const { data: membership } = await svc
      .from('table_memberships')
      .select('id, role, status')
      .eq('table_id', tableId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership || membership.status !== 'active') {
      return NextResponse.json({ error: 'You are not an active member of this table' }, { status: 404 })
    }

    if (membership.role === 'owner') {
      return NextResponse.json(
        { error: "You own this table and can't leave it. Transfer ownership or delete the table from Settings instead." },
        { status: 400 }
      )
    }

    const { error } = await svc
      .from('table_memberships')
      .update({ status: 'removed' })
      .eq('id', membership.id)

    if (error) {
      console.error('Failed to leave table:', error)
      return NextResponse.json({ error: 'Failed to leave table' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Leave table error:', error)
    return NextResponse.json({ error: 'Failed to leave table' }, { status: 500 })
  }
}
