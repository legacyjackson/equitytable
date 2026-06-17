import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/format'

export const metadata = { title: 'Users — Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page } = await searchParams
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/sign-in')

  // Check if admin
  const { data: myRoles } = await authClient
    .from('platform_roles')
    .select('role')
    .eq('user_id', user.id)
  const isAdmin = (myRoles || []).some(r => r.role === 'super_admin' || r.role === 'support_admin')
  if (!isAdmin) redirect('/app')

  const pageNum = parseInt(page || '1', 10)
  const perPage = 25
  const from = (pageNum - 1) * perPage
  const to = from + perPage - 1

  // Use service client
  const svc = await createServiceClient()

  // Simple query — no nested embeds
  const { data: profiles, count } = await svc
    .from('profiles')
    .select('id, email, full_name, username, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalPages = Math.ceil((count || 0) / perPage)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-500">Users</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{count?.toLocaleString()} total</p>
        </div>
      </div>

      <div className="et-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Username</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(profiles || []).length > 0 ? (
                profiles.map(user => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-navy-500 font-medium">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{user.full_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">@{user.username}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(user.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <Link
              key={i + 1}
              href={`/admin/users?page=${i + 1}`}
              className={`px-3 py-1 rounded text-sm ${
                pageNum === i + 1
                  ? 'bg-navy-500 text-white'
                  : 'border border-border hover:bg-muted'
              }`}
            >
              {i + 1}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
