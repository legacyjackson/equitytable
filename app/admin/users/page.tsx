import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatRelativeTime } from '@/lib/utils/format'

export const metadata = { title: 'Users — Admin' }

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>
}) {
  const { q, role, page } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const pageNum = parseInt(page || '1', 10)
  const perPage = 25
  const from = (pageNum - 1) * perPage
  const to = from + perPage - 1

  // Build query
  let query = supabase
    .from('profiles')
    .select(`
      id, email, full_name, username, created_at, public_profile,
      platform_roles(role),
      table_memberships(id)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (q) {
    query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%,username.ilike.%${q}%`)
  }

  const { data: users, count } = await query
  const totalPages = Math.ceil((count || 0) / perPage)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-500">Users</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{count?.toLocaleString()} total</p>
        </div>
      </div>

      {/* Filters */}
      <form className="flex gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by email, name, or username…"
          className="flex-1 rounded-lg border border-border px-3.5 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors"
        />
        <button type="submit" className="rounded-lg bg-navy-500 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-600 transition-colors">
          Search
        </button>
        {q && (
          <Link href="/admin/users" className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="et-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">User</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Tables</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Joined</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users?.map(u => {
                const platformRoles = (u.platform_roles as { role: string }[] | null) || []
                const tableCount = Array.isArray(u.table_memberships) ? u.table_memberships.length : 0
                const isAdmin = platformRoles.some(r => r.role === 'super_admin')
                const isContent = platformRoles.some(r => r.role === 'content_admin')

                return (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-500 font-bold text-xs shrink-0">
                          {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-navy-500">{u.full_name || '—'}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                          {u.username && <p className="text-[11px] text-muted-foreground/70">@{u.username}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {isAdmin && <span className="badge-pill bg-red-100 text-red-700 text-[10px]">Super Admin</span>}
                        {isContent && <span className="badge-pill bg-purple-100 text-purple-700 text-[10px]">Content</span>}
                        {platformRoles.length === 0 && <span className="text-xs text-muted-foreground">Member</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{tableCount}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {pageNum} of {totalPages} · {count?.toLocaleString()} users
            </p>
            <div className="flex gap-2">
              {pageNum > 1 && (
                <Link
                  href={`/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), page: String(pageNum - 1) })}`}
                  className="rounded border border-border px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                >
                  ← Previous
                </Link>
              )}
              {pageNum < totalPages && (
                <Link
                  href={`/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), page: String(pageNum + 1) })}`}
                  className="rounded border border-border px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                >
                  Next →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
