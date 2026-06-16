import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatMinutes } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

interface CoursesPageProps {
  params: Promise<{ tableId: string }>
}

export const metadata = { title: 'Course Library' }

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
}

export default async function CoursesPage({ params }: CoursesPageProps) {
  const { tableId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  // Verify membership
  const { data: membership } = await supabase
    .from('table_memberships')
    .select('role')
    .eq('table_id', tableId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!membership) notFound()

  // Load table + courses in parallel
  const [{ data: table }, { data: courses }, { data: progress }] = await Promise.all([
    supabase.from('equity_tables').select('name, table_type_id').eq('id', tableId).single(),

    supabase
      .from('courses')
      .select('*, course_categories(name, slug, religious_context)')
      .eq('status', 'published')
      .order('title'),

    supabase
      .from('course_progress')
      .select('course_id, completed_lessons, total_lessons, progress_percent, completed_at')
      .eq('user_id', user.id)
      .eq('table_id', tableId),
  ])

  // Index progress by course ID
  const progressMap: Record<string, typeof progress extends Array<infer T> ? T : never> = {}
  progress?.forEach(p => { progressMap[p.course_id] = p })

  // Group courses by category
  const byCategory: Record<string, { name: string; courses: typeof courses }> = {}
  courses?.forEach(course => {
    const cat = (course.course_categories as { name: string; slug: string } | null)
    const key = cat?.slug || 'other'
    const label = cat?.name || 'Other'
    if (!byCategory[key]) byCategory[key] = { name: label, courses: [] }
    byCategory[key].courses!.push(course)
  })

  const inProgress = courses?.filter(c => {
    const p = progressMap[c.id]
    return p && p.progress_percent > 0 && !p.completed_at
  }) ?? []

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-navy-500 tracking-tight">
          Course library
        </h1>
        <p className="text-muted-foreground mt-1">
          {courses?.length ?? 0} courses · Learn together, build together.
        </p>
      </div>

      {/* Continue learning */}
      {inProgress.length > 0 && (
        <section>
          <h2 className="text-lg font-display font-semibold text-navy-500 mb-3">
            Continue learning
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgress.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                progress={progressMap[course.id]}
                tableId={tableId}
              />
            ))}
          </div>
        </section>
      )}

      {/* All courses by category */}
      {Object.entries(byCategory).map(([slug, { name, courses: catCourses }]) => (
        <section key={slug}>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-display font-semibold text-navy-500">{name}</h2>
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">{catCourses?.length} course{catCourses?.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catCourses?.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                progress={progressMap[course.id]}
                tableId={tableId}
              />
            ))}
          </div>
        </section>
      ))}

      {(!courses || courses.length === 0) && (
        <div className="text-center py-20 et-card">
          <div className="text-4xl mb-3">📚</div>
          <h2 className="font-display text-xl font-semibold text-navy-500 mb-2">
            Courses are being added
          </h2>
          <p className="text-muted-foreground text-sm">Check back soon — more courses are on the way.</p>
        </div>
      )}
    </div>
  )
}

function CourseCard({
  course,
  progress,
  tableId,
}: {
  course: { id: string; title: string; description: string | null; level: string; estimated_minutes: number | null; thumbnail_url: string | null }
  progress?: { progress_percent: number; completed_at: string | null } | null
  tableId: string
}) {
  const pct = progress?.progress_percent ?? 0
  const done = !!progress?.completed_at

  return (
    <Link
      href={`/app/tables/${tableId}/courses/${course.id}`}
      className="et-card flex flex-col hover:shadow-et-card-hover transition-shadow group"
    >
      {/* Thumbnail */}
      <div className="h-32 rounded-t-lg bg-gradient-to-br from-navy-500 to-blue-700 relative overflow-hidden">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">📚</div>
        )}
        {done && (
          <div className="absolute top-2 right-2 rounded-full bg-green-500 text-white text-xs font-bold px-2 py-0.5">
            ✓ Done
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('badge-pill text-[10px]', LEVEL_COLORS[course.level] || 'bg-gray-100 text-gray-600')}>
            {LEVEL_LABELS[course.level] || course.level}
          </span>
          {course.estimated_minutes && (
            <span className="text-[10px] text-muted-foreground">{formatMinutes(course.estimated_minutes)}</span>
          )}
        </div>

        <h3 className="font-semibold text-navy-500 leading-snug mb-1 group-hover:text-blue-700 transition-colors">
          {course.title}
        </h3>

        {course.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">
            {course.description}
          </p>
        )}

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">{Math.round(pct)}% complete</span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: done ? '#16A34A' : '#2563EB'
              }}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
