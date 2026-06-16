import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatMinutes } from '@/lib/utils/format'

export const metadata = { title: 'Courses — Admin' }

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string }>
}) {
  const { q, status, category } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const [{ data: courses, count }, { data: categories }] = await Promise.all([
    (() => {
      let query = supabase
        .from('courses')
        .select(`
          id, title, slug, status, level, estimated_minutes, created_at,
          category:course_categories(name, slug),
          course_modules(id)
        `, { count: 'exact' })
        .order('title')

      if (q) query = query.ilike('title', `%${q}%`)
      if (status) query = query.eq('status', status)
      if (category) query = query.eq('category_id', category)
      return query
    })(),
    supabase.from('course_categories').select('id, name, slug').eq('active', true).order('sort_order'),
  ])

  const statusColors: Record<string, string> = {
    published: 'bg-green-100 text-green-700',
    draft: 'bg-amber-100 text-amber-700',
    archived: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-500">Courses</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{count?.toLocaleString()} total</p>
        </div>
        <Link
          href="/admin/courses/new"
          className="rounded-lg bg-navy-500 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
        >
          + New course
        </Link>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search courses…"
          className="flex-1 min-w-48 rounded-lg border border-border px-3.5 py-2 text-sm outline-none focus:border-blue-600 transition-colors"
        />
        <select name="status" defaultValue={status || ''}
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-blue-600 transition-colors">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select name="category" defaultValue={category || ''}
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-blue-600 transition-colors">
          <option value="">All categories</option>
          {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="submit" className="rounded-lg bg-navy-500 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-600 transition-colors">
          Filter
        </button>
        {(q || status || category) && (
          <Link href="/admin/courses" className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">Clear</Link>
        )}
      </form>

      <div className="et-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                {['Course', 'Category', 'Level', 'Modules', 'Duration', 'Status', 'Created', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {courses?.map(course => {
                const cat = course.category as { name: string; slug: string } | null
                const moduleCount = Array.isArray((course as { course_modules?: unknown[] }).course_modules) ? (course as { course_modules: unknown[] }).course_modules.length : 0

                return (
                  <tr key={course.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-navy-500">{course.title}</p>
                      <p className="text-[11px] text-muted-foreground">{course.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{cat?.name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{course.level}</td>
                    <td className="px-4 py-3 text-sm text-center">{moduleCount}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {course.estimated_minutes ? formatMinutes(course.estimated_minutes) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge-pill text-[10px] ${statusColors[course.status] || ''}`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(course.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/courses/${course.id}`} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                        Edit →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
