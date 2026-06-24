import { LessonEditorClient } from '@/components/admin/LessonEditorClient'

export const metadata = { title: 'New Lesson — Admin' }

interface NewLessonPageProps {
  params: Promise<{ courseId: string }>
}

export default async function NewLessonPage({ params }: NewLessonPageProps) {
  const { courseId } = await params
  return <LessonEditorClient courseId={courseId} lessonId={null} />
}
