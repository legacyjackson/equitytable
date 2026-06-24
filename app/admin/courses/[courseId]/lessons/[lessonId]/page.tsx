import { LessonEditorClient } from '@/components/admin/LessonEditorClient'

export const metadata = { title: 'Edit Lesson — Admin' }

interface EditLessonPageProps {
  params: Promise<{ courseId: string; lessonId: string }>
}

export default async function EditLessonPage({ params }: EditLessonPageProps) {
  const { courseId, lessonId } = await params
  return <LessonEditorClient courseId={courseId} lessonId={lessonId} />
}
