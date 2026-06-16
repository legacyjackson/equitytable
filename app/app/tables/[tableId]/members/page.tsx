import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MembersClient } from '@/components/members/MembersClient'

interface MembersPageProps {
  params: Promise<{ tableId: string }>
}

export const metadata = { title: 'Members' }

export default async function MembersPage({ params }: MembersPageProps) {
  const { tableId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: membership } = await supabase
    .from('table_memberships')
    .select('role')
    .eq('table_id', tableId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!membership || !['owner', 'admin'].includes(membership.role)) notFound()

  const [{ data: table }, { data: members }, { data: invitations }, { data: subscription }] = await Promise.all([
    supabase.from('equity_tables').select('name').eq('id', tableId).single(),

    supabase
      .from('table_memberships')
      .select('*, profiles(id, email, full_name, avatar_url, username)')
      .eq('table_id', tableId)
      .in('status', ['active', 'invited', 'pending'])
      .order('joined_at', { ascending: false }),

    supabase
      .from('table_invitations')
      .select('*')
      .eq('table_id', tableId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }),

    supabase
      .from('subscriptions')
      .select('included_seats, extra_seats, status')
      .eq('table_id', tableId)
      .maybeSingle(),
  ])

  const activeCount = members?.filter(m => m.status === 'active').length ?? 0
  const includedSeats = subscription?.included_seats ?? 10
  const extraSeats = subscription?.extra_seats ?? 0
  const totalSeats = includedSeats + extraSeats

  return (
    <MembersClient
      tableId={tableId}
      tableName={table?.name ?? ''}
      members={(members ?? []) as any}
      pendingInvitations={(invitations ?? []) as any}
      currentUserId={user.id}
      currentRole={membership.role as 'owner' | 'admin'}
      activeCount={activeCount}
      includedSeats={includedSeats}
      totalSeats={totalSeats}
    />
  )
}
