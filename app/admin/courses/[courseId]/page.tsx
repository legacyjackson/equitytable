import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CourseDetailClient } from '@/components/admin/CourseDetailClient'

export const metadata = { title: 'Edit Course — Admin' }
export const dynamic = 'force-dynamic'

interface CourseDetailPageProps {
  params: Promise<{ courseId: string }>
}

export default async function AdminCourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const [{ data: course }, { data: categories }, { data: modules }, { data: lessons }] = await Promise.all([
    supabase.from('courses').select('*').eq('id', courseId).maybeSingle(),
    supabase.from('course_categories').select('id, name, slug').eq('active', true).order('sort_order'),
    supabase.from('course_modules').select('*').eq('course_id', courseId).order('sort_order'),
    supabase
      .from('lessons')
      .select('id, title, slug, module_id, status, estimated_minutes, sort_order, quizzes(id)')
      .eq('course_id', courseId)
      .order('sort_order'),
  ])

  if (!course) notFound()

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Link href="/admin/courses" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Courses
        </Link>
      </div>

      <CourseDetailClient
        course={course}
        categories={categories || []}
        modules={modules || []}
        lessons={(lessons || []).map((l) => ({
          ...l,
          hasQuiz: Array.isArray(l.quizzes) ? l.quizzes.length > 0 : !!l.quizzes,
        }))}
      />
    </div>
  )
}
