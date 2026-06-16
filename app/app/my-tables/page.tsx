import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

export const metadata = { title: 'My Tables' }

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  owner:       { label: 'Owner',       color: 'bg-gold-100 text-gold-700' },
  admin:       { label: 'Admin',       color: 'bg-blue-100 text-blue-700' },
  facilitator: { label: 'Facilitator', color: 'bg-purple-100 text-purple-700' },
  member:      { label: 'Member',      color: 'bg-gray-100 text-gray-600' },
}

const STATUS_DOT: Record<string, string> = {
  active:   'bg-green-500',
  past_due: 'bg-amber-500',
  canceled: 'bg-red-400',
  suspended:'bg-gray-400',
  trial:    'bg-blue-400',
}

export default async function MyTablesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: memberships } = await supabase
    .from('table_memberships')
    .select(`
      *,
      equity_tables (
        id, name, slug, logo_url, mission, status, member_count,
        pathway_participant_count, visibility,
        table_type:equity_table_types(name, emoji:slug)
      )
    `)
    .eq('user_id', user.id)
    .in('status', ['active', 'invited'])
    .order('joined_at', { ascending: false })

  const active = memberships?.filter(m => m.status === 'active') ?? []
  const invited = memberships?.filter(m => m.status === 'invited') ?? []

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-navy-500 tracking-tight">My Tables</h1>
          <p className="text-muted-foreground mt-1">
            {active.length} active table{active.length !== 1 ? 's' : ''}
            {invited.length > 0 && ` · ${invited.length} pending invite${invited.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href="/create-table"
          className="shrink-0 rounded-lg bg-navy-500 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
        >
          + New table
        </Link>
      </div>

      {/* Pending invitations */}
      {invited.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Pending invitations
          </h2>
          <div className="space-y-3">
            {invited.map(m => {
              const t = m.equity_tables as any
              return (
                <div key={m.id} className="et-card p-5 flex items-center gap-4 border-amber-200 bg-amber-50/50">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-lg shrink-0">
                    📬
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-navy-500">{t?.name ?? 'Unknown table'}</p>
                    <p className="text-xs text-muted-foreground">
                      Invited as {m.role} · {formatDate(m.created_at)}
                    </p>
                  </div>
                  <Link
                    href={`/app/tables/${m.table_id}`}
                    className="shrink-0 rounded-lg bg-navy-500 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
                  >
                    View table
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Active tables */}
      {active.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-16 text-center">
          <div className="text-5xl mb-4">🪑</div>
          <h2 className="font-display text-xl font-semibold text-navy-500 mb-2">
            An empty table is just furniture.
          </h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Create your Equity Table and invite the people you trust to build wealth with you.
          </p>
          <Link
            href="/create-table"
            className="inline-flex items-center rounded-xl bg-navy-500 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
          >
            Start an Equity Table — $49.99/month
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {active.map(m => {
            const t = m.equity_tables as any
            if (!t) return null
            const roleInfo = ROLE_LABELS[m.role] ?? ROLE_LABELS.member
            const statusDot = STATUS_DOT[t.status] ?? 'bg-gray-400'

            return (
              <Link
                key={m.table_id}
                href={`/app/tables/${m.table_id}`}
                className="et-card p-6 flex flex-col gap-4 hover:shadow-et-card-hover transition-all group"
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-navy-100 flex items-center justify-center text-xl font-bold text-navy-500 shrink-0 border border-navy-200/50">
                    {t.name?.charAt(0) ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn('w-2 h-2 rounded-full shrink-0', statusDot)} />
                      <h3 className="font-semibold text-navy-500 truncate group-hover:text-blue-700 transition-colors">
                        {t.name}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {t.table_type?.name ?? 'Equity Table'}
                    </p>
                  </div>
                  <span className={cn('badge-pill shrink-0', roleInfo.color)}>
                    {roleInfo.label}
                  </span>
                </div>

                {/* Mission */}
                {t.mission && (
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {t.mission}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 pt-3 border-t border-border text-xs text-muted-foreground">
                  <span><strong className="text-navy-500">{t.member_count}</strong> members</span>
                  {t.pathway_participant_count > 0 && (
                    <span><strong className="text-green-600">{t.pathway_participant_count}</strong> on Pathway</span>
                  )}
                  <span className="ml-auto capitalize text-[10px] uppercase tracking-wider font-semibold">
                    {t.visibility}
                  </span>
                </div>
              </Link>
            )
          })}

          {/* Create another */}
          <Link
            href="/create-table"
            className="et-card p-6 flex flex-col items-center justify-center gap-3 border-dashed text-muted-foreground hover:text-navy-500 hover:border-navy-300 transition-all min-h-[180px]"
          >
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-current flex items-center justify-center text-xl">
              +
            </div>
            <span className="text-sm font-medium">Start another table</span>
          </Link>
        </div>
      )}
    </div>
  )
}
