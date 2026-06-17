import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatMinutes } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

interface PageProps {
  params: Promise<{ tableId: string; courseId: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('courses').select('title').eq('id', courseId).maybeSingle()
  return { title: data?.title ?? 'Course' }
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { tableId, courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const [{ data: membership }, { data: course }, { data: modules }, { data: lessons }, { data: progRows }] = await Promise.all([
    supabase.from('table_memberships').select('role').eq('table_id', tableId).eq('user_id', user.id).maybeSingle(),
    supabase.from('courses').select('*, category:course_categories(name, icon)').eq('id', courseId).eq('status', 'published').maybeSingle(),
    supabase.from('course_modules').select('*').eq('course_id', courseId).order('sort_order'),
    supabase.from('lessons').select('id, module_id, title, slug, summary, estimated_minutes, sort_order, status').eq('course_id', courseId).eq('status', 'published').order('sort_order'),
    supabase.from('lesson_progress').select('lesson_id, status, progress_percent, completed_at').eq('user_id', user.id).eq('table_id', tableId),
  ])

  if (!course || !membership) notFound()

  const progressMap = Object.fromEntries((progRows || []).map(p => [p.lesson_id, p]))
  const allLessons = lessons || []
  const completedCount = allLessons.filter(l => progressMap[l.id]?.status === 'completed').length
  const overallPct = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0

  // Group lessons by module
  type ModuleWithLessons = NonNullable<typeof modules>[number] & { lessons: typeof allLessons }
  const moduleMap: Record<string, ModuleWithLessons> = Object.fromEntries(
    (modules || []).map(m => [m.id, { ...m, lessons: [] as typeof allLessons }])
  )
  const unassigned: typeof allLessons = []
  for (const lesson of allLessons) {
    if (lesson.module_id && moduleMap[lesson.module_id]) {
      moduleMap[lesson.module_id].lessons.push(lesson)
    } else {
      unassigned.push(lesson)
    }
  }

  // Find first incomplete lesson for "Continue" button
  const firstIncomplete = allLessons.find(l => progressMap[l.id]?.status !== 'completed')
  const category = course.category as { name: string; icon: string | null } | null

  return (
    <div className="max-w-3xl space-y-8 animate-fade-in">
      {/* Back */}
      <Link href={`/app/tables/${tableId}/courses`} className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
        ← Course library
      </Link>

      {/* Header */}
      <div className="et-card overflow-hidden">
        <div className="h-40 bg-gradient-to-br from-navy-100 to-blue-100 flex items-center justify-center">
          <span className="text-5xl">{category?.icon || '📚'}</span>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-pill bg-muted text-muted-foreground capitalize">{course.level}</span>
            {category && <span className="badge-pill bg-blue-50 text-blue-700">{category.name}</span>}
          </div>
          <h1 className="font-display text-3xl font-bold text-navy-500 tracking-tight mb-2">{course.title}</h1>
          {course.description && <p className="text-muted-foreground leading-relaxed mb-5">{course.description}</p>}

          {/* Progress */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-medium text-navy-500">{completedCount}/{allLessons.length} lessons complete</span>
                <span className={overallPct === 100 ? 'text-green-600 font-semibold' : 'text-muted-foreground'}>{overallPct}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', overallPct === 100 ? 'bg-green-500' : 'bg-blue-600')} style={{ width: `${overallPct}%` }} />
              </div>
            </div>
          </div>

          {firstIncomplete ? (
            <Link
              href={`/app/tables/${tableId}/lessons/${firstIncomplete.id}`}
              className="inline-flex items-center rounded-xl bg-navy-500 px-6 py-3 text-sm font-bold text-white hover:bg-navy-600 transition-colors"
            >
              {completedCount > 0 ? '▶ Continue course' : '▶ Start course'}
            </Link>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-5 py-3 text-sm font-semibold text-green-700">
              ✓ Course complete!
            </div>
          )}
        </div>
      </div>

      {/* Modules & Lessons */}
      <div>
        <h2 className="font-display text-xl font-semibold text-navy-500 mb-4">Lessons</h2>

        <div className="space-y-4">
          {Object.values(moduleMap).map(mod => (
            mod.lessons.length > 0 && (
              <div key={mod.id} className="et-card overflow-hidden">
                <div className="px-5 py-3.5 bg-muted/50 border-b border-border">
                  <h3 className="font-semibold text-navy-500 text-sm">{mod.title}</h3>
                </div>
                <div className="divide-y divide-border">
                  {mod.lessons.map((lesson: (typeof allLessons)[number], i: number) => {
                    const prog = progressMap[lesson.id]
                    const done = prog?.status === 'completed'
                    const inProg = prog?.status === 'in_progress'
                    return (
                      <Link
                        key={lesson.id}
                        href={`/app/tables/${tableId}/lessons/${lesson.id}`}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                          done ? 'bg-green-100 text-green-700' : inProg ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'
                        )}>
                          {done ? '✓' : i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium', done ? 'text-muted-foreground' : 'text-navy-500')}>{lesson.title}</p>
                          {lesson.summary && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{lesson.summary}</p>}
                        </div>
                        <div className="shrink-0 flex items-center gap-2 text-xs text-muted-foreground">
                          {lesson.estimated_minutes && <span>{lesson.estimated_minutes} min</span>}
                          {inProg && !done && <span className="text-blue-600 font-semibold">{Math.round(prog.progress_percent)}%</span>}
                          <span className="text-muted-foreground">→</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          ))}

          {/* Unassigned lessons */}
          {unassigned.length > 0 && (
            <div className="et-card overflow-hidden">
              <div className="divide-y divide-border">
                {unassigned.map((lesson, i) => {
                  const prog = progressMap[lesson.id]
                  const done = prog?.status === 'completed'
                  const inProg = prog?.status === 'in_progress'
                  return (
                    <Link
                      key={lesson.id}
                      href={`/app/tables/${tableId}/lessons/${lesson.id}`}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                        done ? 'bg-green-100 text-green-700' : inProg ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'
                      )}>
                        {done ? '✓' : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium', done ? 'text-muted-foreground' : 'text-navy-500')}>{lesson.title}</p>
                        {lesson.summary && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{lesson.summary}</p>}
                      </div>
                      <div className="shrink-0 flex items-center gap-2 text-xs text-muted-foreground">
                        {lesson.estimated_minutes && <span>{lesson.estimated_minutes} min</span>}
                        <span>→</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
