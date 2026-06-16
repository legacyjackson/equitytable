import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TableSettingsClient } from '@/components/tables/TableSettingsClient'

interface SettingsPageProps {
  params: Promise<{ tableId: string }>
}

export const metadata = { title: 'Table Settings' }

export default async function TableSettingsPage({ params }: SettingsPageProps) {
  const { tableId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const [{ data: membership }, { data: table }] = await Promise.all([
    supabase
      .from('table_memberships')
      .select('role')
      .eq('table_id', tableId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
    supabase
      .from('equity_tables')
      .select('*, table_type:equity_table_types(name, slug)')
      .eq('id', tableId)
      .maybeSingle(),
  ])

  if (!table) notFound()

  const isAdmin = ['owner', 'admin'].includes(membership?.role ?? '')
  if (!isAdmin) redirect(`/app/tables/${tableId}`)

  return (
    <div className="max-w-2xl animate-fade-in">
      <h1 className="text-3xl font-display font-bold text-navy-500 mb-1">Table settings</h1>
      <p className="text-muted-foreground mb-8">Manage your table's profile and community preferences.</p>
      <TableSettingsClient table={table} tableId={tableId} isOwner={membership?.role === 'owner'} />
    </div>
  )
}
