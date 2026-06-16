import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'

export const metadata = { title: 'Explore Equity Tables' }

export default async function EquityTablesDirectoryPage() {
  const supabase = await createClient()

  const { data: tables } = await supabase
    .from('equity_tables')
    .select('id, name, slug, mission, logo_url, member_count, pathway_participant_count, table_type:equity_table_types(name, slug)')
    .eq('visibility', 'public')
    .eq('status', 'active')
    .order('member_count', { ascending: false })
    .limit(48)

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      {/* Nav */}
      <nav className="border-b border-border bg-white/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* white background → use light-bg logo */}
          <Link href="/"><Logo variant="light-bg" size="sm" /></Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/sign-in" className="text-sm font-semibold text-navy-500 px-3 py-2 hover:bg-muted rounded-lg transition-colors">Sign in</Link>
            <Link href="/auth/sign-up" className="rounded-lg bg-navy-500 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-600 transition-colors">Start a table</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="font-display text-4xl font-bold text-navy-500 tracking-tight mb-2">
            Explore Equity Tables
          </h1>
          <p className="text-muted-foreground">
            Public financial literacy communities building wealth together.
          </p>
        </div>

        {!tables || tables.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No public tables yet. Be the first to start one.</p>
            <Link href="/auth/sign-up" className="inline-flex mt-4 rounded-xl bg-navy-500 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-600 transition-colors">
              Start an Equity Table
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map(table => {
              const tableType = table.table_type as { name: string; slug: string } | null
              return (
                <Link
                  key={table.id}
                  href={`/equity-tables/${table.slug}`}
                  className="et-card p-5 hover:shadow-et-card-hover transition-shadow group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-navy-100 flex items-center justify-center text-navy-500 font-bold shrink-0">
                      {table.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-navy-500 truncate group-hover:text-blue-700 transition-colors">
                        {table.name}
                      </h3>
                      {tableType && (
                        <span className="table-type-chip bg-navy-100 text-navy-500 text-[10px]">
                          {tableType.name}
                        </span>
                      )}
                    </div>
                  </div>
                  {table.mission && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                      {table.mission}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-3 border-t border-border">
                    <span>{table.member_count} member{table.member_count !== 1 ? 's' : ''}</span>
                    {table.pathway_participant_count > 0 && (
                      <span className="text-green-600 font-medium">
                        {table.pathway_participant_count} on Pathway
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
