import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Explore Equity Tables',
  description: 'Discover public financial literacy communities building wealth together.',
}

interface PageProps {
  searchParams: Promise<{ q?: string; type?: string }>
}

export default async function EquityTablesDirectoryPage({ searchParams }: PageProps) {
  const { q, type } = await searchParams
  const supabase = await createClient()

  const [{ data: tableTypes }, tablesResult] = await Promise.all([
    supabase
      .from('equity_table_types')
      .select('id, name, slug')
      .eq('active', true)
      .order('sort_order'),
    (() => {
      let query = supabase
        .from('equity_tables')
        .select(`
          id, name, slug, mission, logo_url, member_count,
          pathway_participant_count,
          table_type:equity_table_types(id, name, slug)
        `)
        .eq('visibility', 'public')
        .eq('status', 'active')
        .order('member_count', { ascending: false })
        .limit(60)

      if (q) query = query.ilike('name', `%${q}%`)
      if (type) {
        // filter by type slug via join — use raw filter
        query = query.eq('equity_table_types.slug', type)
      }
      return query
    })(),
  ])

  // Client-side filter for type (Supabase join filtering is limited)
  let tables = tablesResult.data || []
  if (type) {
  tables = tables.filter(t => {
    // Supabase joins can return an array or a single object
    const tt = Array.isArray(t.table_type)
      ? t.table_type[0]
      : t.table_type
    return (tt as { slug?: string } | null)?.slug === type
  })
}
  if (q) {
    tables = tables.filter(t =>
      t.name.toLowerCase().includes(q.toLowerCase()) ||
      t.mission?.toLowerCase().includes(q.toLowerCase())
    )
  }

  const typeEmojis: Record<string, string> = {
    'cbo': '🏛️', 'christian': '✝️', 'muslim': '☪️', 'jewish': '✡️',
    'common-interest': '🌐', 'family-and-friends': '👨‍👩‍👧‍👦', 'business': '💼',
    'school-youth': '🎓', 'workforce': '🏗️', 'reentry': '⚖️',
    'womens-wealth': '💪', 'first-gen': '🌱', 'investor-club': '📈',
    'greek-alumni': '🎭', 'faith-based': '🕊️',
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      {/* Nav — white background, use light-bg logo */}
      <nav className="border-b border-border bg-white/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/"><Logo variant="light-bg" size="sm" /></Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/sign-in" className="text-sm font-semibold text-navy-500 px-3 py-2 hover:bg-muted rounded-lg transition-colors">Sign in</Link>
            <Link href="/auth/sign-up" className="rounded-lg bg-navy-500 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-600 transition-colors">Start a table</Link>
          </div>
        </div>
      </nav>

      {/* Hero strip — navy background, use dark-bg logo in footer only */}
      <div className="bg-navy-500 py-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display text-4xl font-bold text-white mb-2 tracking-tight">
            Explore Equity Tables
          </h1>
          <p className="text-blue-100 mb-6">
            Public financial literacy communities building wealth together.
          </p>

          {/* Search */}
          <form className="flex gap-2 max-w-xl mx-auto">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by name or mission…"
              className="flex-1 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gold-400/50 transition-all bg-white text-navy-500"
            />
            {type && <input type="hidden" name="type" value={type} />}
            <button
              type="submit"
              className="rounded-xl bg-gold-400 px-5 py-3 text-sm font-bold text-navy-500 hover:bg-gold-300 transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Type filter pills */}
        <div className="flex gap-2 flex-wrap mb-6">
          <Link
            href={q ? `/equity-tables?q=${q}` : '/equity-tables'}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors border ${
              !type ? 'bg-navy-500 text-white border-navy-500' : 'border-border hover:bg-muted'
            }`}
          >
            All types
          </Link>
          {tableTypes?.map(t => (
            <Link
              key={t.slug}
              href={`/equity-tables?type=${t.slug}${q ? `&q=${q}` : ''}`}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors border flex items-center gap-1.5 ${
                type === t.slug ? 'bg-navy-500 text-white border-navy-500' : 'border-border hover:bg-muted'
              }`}
            >
              <span>{typeEmojis[t.slug] || '📌'}</span>
              {t.name}
            </Link>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-5">
          {tables.length === 0
            ? 'No tables found'
            : `${tables.length} table${tables.length !== 1 ? 's' : ''}${type || q ? ' matching your search' : ''}`}
        </p>

        {/* Grid */}
        {tables.length === 0 ? (
          <div className="et-card p-14 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="font-display text-xl font-semibold text-navy-500 mb-2">No tables found</h3>
            <p className="text-muted-foreground text-sm mb-5">
              {q ? `No public tables matching "${q}". Try a different search.` : 'No public tables yet. Be the first to start one.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              {(q || type) && (
                <Link href="/equity-tables" className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
                  Clear filters
                </Link>
              )}
              <Link href="/auth/sign-up" className="rounded-xl bg-navy-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-600 transition-colors">
                Start an Equity Table
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tables.map(table => {
              const tableType = table.table_type as { name: string; slug: string } | null
              return (
                <Link
                  key={table.id}
                  href={`/equity-tables/${table.slug}`}
                  className="et-card p-5 hover:shadow-et-card-hover transition-all group flex flex-col"
                >
                  {/* Logo / initial */}
                  <div className="flex items-center gap-3 mb-3">
                    {table.logo_url ? (
                      <img src={table.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-navy-100 flex items-center justify-center text-navy-500 font-bold text-lg shrink-0">
                        {table.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold text-navy-500 truncate group-hover:text-blue-700 transition-colors text-sm leading-snug">
                        {table.name}
                      </h3>
                      {tableType && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px]">{typeEmojis[tableType.slug] || ''}</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {tableType.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mission */}
                  {table.mission && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1 mb-3">
                      {table.mission}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-3 border-t border-border mt-auto">
                    <span className="font-medium">{table.member_count} member{table.member_count !== 1 ? 's' : ''}</span>
                    {table.pathway_participant_count > 0 && (
                      <span className="text-green-600 font-semibold">
                        {table.pathway_participant_count} on Pathway
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* CTA at bottom */}
        <div className="mt-12 rounded-2xl bg-navy-500 p-8 text-center">
          <div className="et-gold-bar mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-white mb-2">
            Don't see your table? Start one.
          </h2>
          <p className="text-blue-100 text-sm mb-6">
            $49.99/month · 10 seats · Any community type
          </p>
          <Link href="/auth/sign-up" className="inline-flex items-center rounded-xl bg-gold-400 px-6 py-3 text-sm font-bold text-navy-500 hover:bg-gold-300 transition-colors">
            Start an Equity Table
          </Link>
        </div>
      </div>

      {/* Footer — white background */}
      <footer className="border-t border-border bg-white py-8 px-4 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          {/* White footer background → light-bg logo */}
          <Logo variant="light-bg" size="xs" />
          <nav className="flex gap-5">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/legal/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
