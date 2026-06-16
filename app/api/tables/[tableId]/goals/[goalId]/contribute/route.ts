import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ tableId: string; goalId: string }>
}

// POST /api/tables/[tableId]/goals/[goalId]/contribute
// Records a manual or pledge contribution — no Stripe involved.
export async function POST(request: Request, { params }: RouteParams) {
  const { tableId, goalId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Must be a table member
  const { data: membership } = await supabase
    .from('table_memberships')
    .select('role')
    .eq('table_id', tableId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!membership) return NextResponse.json({ error: 'Not a member of this table' }, { status: 403 })

  const { data: goal } = await supabase
    .from('goals')
    .select('id, accept_contributions, contribution_type, status')
    .eq('id', goalId)
    .eq('table_id', tableId)
    .maybeSingle()

  if (!goal || goal.status !== 'active') {
    return NextResponse.json({ error: 'Goal not found or inactive' }, { status: 404 })
  }
  if (!goal.accept_contributions) {
    return NextResponse.json({ error: 'This goal does not accept contributions' }, { status: 400 })
  }

  const body = await request.json()
  const { amount, contribution_type, note } = body

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Positive amount required' }, { status: 400 })
  }

  // Record contribution
  const { data: contrib, error: contribErr } = await supabase
    .from('goal_contributions')
    .insert({
      goal_id: goalId,
      user_id: user.id,
      amount,
      contribution_type: contribution_type || goal.contribution_type,
      note: note || null,
      status: contribution_type === 'pledge' ? 'pledged' : 'confirmed',
    })
    .select('id')
    .single()

  if (contribErr) return NextResponse.json({ error: contribErr.message }, { status: 500 })

  // For confirmed (manual) contributions, update goal current_value via goal_update
  if (contribution_type !== 'pledge') {
    await supabase.from('goal_updates').insert({
      goal_id: goalId,
      user_id: user.id,
      update_value: amount,
      update_text: note || `Contributed ${amount}`,
    })
  }

  // Points
  await supabase.from('points_ledger').insert({
    user_id: user.id,
    table_id: tableId,
    points: 50,
    reason: 'Contributed to a goal',
    source_type: 'goal_contribution',
    source_id: contrib.id,
  })

  // Badge
  const { data: badge } = await supabase
    .from('badges')
    .select('id')
    .eq('slug', 'community-investor')
    .maybeSingle()

  if (badge) {
    await supabase.from('user_badges').insert({
      user_id: user.id,
      badge_id: badge.id,
      table_id: tableId,
    }).onConflict('user_id, badge_id, table_id').ignore()
  }

  return NextResponse.json({ id: contrib.id })
}
