import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/format'

export const metadata = { title: 'Dashboard' }

export default async function AppDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/sign-in')

  const [{ data: profile }, { data: memberships }, { data: recentProgress }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('table_memberships')
      .select('*, equity_tables(id, name, slug, logo_url, member_count, status, pathway_participant_count)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at'),
    supabase
      .from('lesson_progress')
      .select('*, lessons(title, course_id, courses(title))')
      .eq('user_id', user.id)
      .eq('status', 'in_progress')
      .order('updated_at', { ascending: false })
      .limit(3),
  ])

  const name = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-display font-bold text-navy-500 tracking-tight">
          Good to see you, {name}.
        </h1>
        <p className="text-muted-foreground mt-1">
          {memberships && memberships.length > 0
            ? `You're part of ${memberships.length} Equity Table${memberships.length > 1 ? 's' : ''}.`
            : 'Ready to start your first Equity Table?'}
        </p>
      </div>

      {/* No tables — create CTA */}
      {(!memberships || memberships.length === 0) && (
        <div className="rounded-2xl bg-gradient-to-br from-navy-500 to-blue-700 p-8 text-center text-white">
          <div className="text-4xl mb-3">🪑</div>
          <h2 className="font-display text-xl font-semibold mb-2">
            An empty table is just furniture.
          </h2>
          <p className="text-blue-100 text-sm mb-6 max-w-sm mx-auto">
            Create your Equity Table and invite the people you trust to build wealth with you.
          </p>
          <Link
            href="/create-table"
            className="inline-flex items-center rounded-xl bg-gold-400 px-6 py-3 text-sm font-bold text-navy-500 hover:bg-gold-300 transition-colors"
          >
            Start an Equity Table — $49.99/month
          </Link>
        </div>
      )}

      {/* Tables grid */}
      {memberships && memberships.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-navy-500">Your tables</h2>
            <Link href="/app/my-tables" className="text-sm text-blue-600 hover:underline font-medium">
              View all
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {memberships.map((m) => {
              const t = m.equity_tables
              if (!t) return null
              return (
                <Link
                  key={m.table_id}
                  href={`/app/tables/${m.table_id}`}
                  className="et-card p-5 hover:shadow-et-card-hover transition-shadow group"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-navy-100 flex items-center justify-center shrink-0 text-navy-500 font-bold">
                      {t.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-navy-500 truncate group-hover:text-blue-700 transition-colors">
                        {t.name}
                      </h3>
                      <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{t.member_count} member{t.member_count !== 1 ? 's' : ''}</span>
                    {t.pathway_participant_count > 0 && (
                      <span className="text-green-600 font-medium">
                        {t.pathway_participant_count} on Pathway
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}

            {/* Create table card */}
            <Link
              href="/create-table"
              className="et-card p-5 border-dashed hover:shadow-et-card-hover transition-shadow flex flex-col items-center justify-center gap-2 text-center text-muted-foreground hover:text-navy-500 transition-colors min-h-[120px]"
            >
              <span className="text-2xl">+</span>
              <span className="text-sm font-medium">Start another table</span>
            </Link>
          </div>
        </div>
      )}

      {/* Continue learning */}
      {recentProgress && recentProgress.length > 0 && (
        <div>
          <h2 className="text-lg font-display font-semibold text-navy-500 mb-4">Continue learning</h2>
          <div className="space-y-3">
            {recentProgress.map((p) => {
              const lesson = p.lessons as { title: string; course_id: string; courses: { title: string } | null } | null
              if (!lesson) return null
              const tableId = memberships?.[0]?.table_id
              const href = tableId
                ? `/app/tables/${tableId}/lessons/${p.lesson_id}`
                : '/app'

              return (
                <Link
                  key={p.id}
                  href={href}
                  className="et-card p-4 flex items-center gap-4 hover:shadow-et-card-hover transition-shadow"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    📚
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy-500 truncate">{lesson.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{lesson.courses?.title}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs font-semibold text-blue-600">{Math.round(p.progress_percent)}%</div>
                    <div className="w-16 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${p.progress_percent}%` }}
                      />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Global Pathways CTA — bottom of dashboard */}
      <div className="rounded-xl border border-gold-400/30 bg-gold-50 p-5 flex items-start gap-4">
        <span className="text-2xl shrink-0">🚀</span>
        <div className="flex-1">
          <p className="font-semibold text-navy-500 mb-0.5">
            Keep learning here. When you're ready to act, start your Pathway.
          </p>
          <p className="text-sm text-muted-foreground mb-3">
            Global Pathways turns financial education into a 6-month personalized action plan.
          </p>
          <a
            href={process.env.DEFAULT_GLOBAL_PATHWAYS_URL || 'https://legacyplan.app/'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Learn about Global Pathways →
          </a>
        </div>
      </div>
    </div>
  )
}
