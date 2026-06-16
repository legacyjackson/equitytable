import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LessonPlayer } from '@/components/courses/LessonPlayer'

interface LessonPageProps {
  params: Promise<{ tableId: string; lessonId: string }>
}

export async function generateMetadata({ params }: LessonPageProps) {
  const { lessonId } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('lessons').select('title').eq('id', lessonId).maybeSingle()
  return { title: data?.title || 'Lesson' }
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { tableId, lessonId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: membership } = await supabase
    .from('table_memberships')
    .select('role')
    .eq('table_id', tableId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!membership) notFound()

  const [{ data: lesson }, { data: audio }, { data: segments }, { data: progress }, { data: affiliateLink }] = await Promise.all([
    supabase
      .from('lessons')
      .select('*, courses(id, title, slug), quizzes(*)')
      .eq('id', lessonId)
      .eq('status', 'published')
      .maybeSingle(),

    supabase
      .from('lesson_audio')
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('status', 'ready')
      .maybeSingle(),

    supabase
      .from('lesson_audio_segments')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('segment_index'),

    supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .eq('table_id', tableId)
      .maybeSingle(),

    supabase
      .from('affiliate_links')
      .select('destination_url')
      .eq('table_id', tableId)
      .eq('active', true)
      .maybeSingle(),
  ])

  if (!lesson) notFound()

  return (
    <LessonPlayer
      lesson={lesson as any}
      audio={audio}
      segments={segments || []}
      initialProgress={progress}
      tableId={tableId}
      userId={user.id}
      affiliateUrl={affiliateLink?.destination_url || process.env.DEFAULT_GLOBAL_PATHWAYS_URL || 'https://legacyplan.app/'}
    />
  )
}
