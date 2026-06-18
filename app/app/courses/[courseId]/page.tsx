import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface CourseRedirectPageProps {
  params: Promise<{ courseId: string }>
}

export default async function CourseRedirectPage({ params }: CourseRedirectPageProps) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: membership } = await supabase
    .from('table_memberships')
    .select('table_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (membership) redirect(`/app/tables/${membership.table_id}/courses/${courseId}`)
  redirect('/app/my-tables')
}
