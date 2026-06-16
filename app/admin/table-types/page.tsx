import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Table Types — Admin' }

export default async function AdminTableTypesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: types } = await supabase
    .from('equity_table_types')
    .select('*, equity_tables(id)')
    .order('sort_order')

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-navy-500">Table types</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {types?.length || 0} types defined. These shape which courses, goals, and content are recommended per table.
        </p>
      </div>

      <div className="et-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                {['#', 'Type', 'Slug', 'Tables', 'Religious content', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {types?.map(type => {
                const tableCount = Array.isArray(type.equity_tables) ? type.equity_tables.length : 0
                return (
                  <tr key={type.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{type.sort_order}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-navy-500">{type.name}</p>
                      {type.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 max-w-xs">{type.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{type.slug}</td>
                    <td className="px-4 py-3 text-sm text-center">{tableCount}</td>
                    <td className="px-4 py-3">
                      {type.religious_content_allowed
                        ? <span className="badge-pill bg-purple-100 text-purple-700 text-[10px]">Allowed</span>
                        : <span className="text-xs text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      {type.active
                        ? <span className="badge-pill bg-green-100 text-green-700 text-[10px]">Active</span>
                        : <span className="badge-pill bg-gray-100 text-gray-700 text-[10px]">Inactive</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                        Edit →
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        <strong>Note:</strong> Table type slugs are referenced in course filtering and religious content gating logic. Changing slugs requires a code update. Add new types carefully — existing tables cannot change their type after creation.
      </div>
    </div>
  )
}
