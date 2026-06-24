'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  category_id: string
  level: 'beginner' | 'intermediate' | 'advanced'
  estimated_minutes: number | null
  status: 'draft' | 'published' | 'archived'
  religious_context: string | null
}

interface CourseModule {
  id: string
  title: string
  description: string | null
  sort_order: number
}

interface CourseLesson {
  id: string
  title: string
  slug: string
  module_id: string | null
  status: 'draft' | 'published' | 'archived'
  estimated_minutes: number | null
  sort_order: number
  hasQuiz: boolean
}

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-amber-100 text-amber-700',
  archived: 'bg-gray-100 text-gray-700',
}

const inputClass = 'w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors'

export function CourseDetailClient({
  course,
  categories,
  modules: initialModules,
  lessons: initialLessons,
}: {
  course: Course
  categories: { id: string; name: string; slug: string }[]
  modules: CourseModule[]
  lessons: CourseLesson[]
}) {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    title: course.title,
    description: course.description || '',
    category_id: course.category_id,
    level: course.level,
    estimated_minutes: course.estimated_minutes?.toString() || '',
    status: course.status,
    religious_context: course.religious_context || '',
  })
  const [savingCourse, setSavingCourse] = useState(false)
  const [courseError, setCourseError] = useState<string | null>(null)

  const [modules, setModules] = useState(initialModules)
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [addingModule, setAddingModule] = useState(false)

  const [lessons, setLessons] = useState(initialLessons)

  // ── Course fields ──────────────────────────────────────────
  const saveCourse = async () => {
    setSavingCourse(true)
    setCourseError(null)
    const { error } = await supabase
      .from('courses')
      .update({
        title: form.title,
        description: form.description || null,
        category_id: form.category_id,
        level: form.level,
        estimated_minutes: form.estimated_minutes ? parseInt(form.estimated_minutes, 10) : null,
        status: form.status,
        religious_context: form.religious_context || null,
      })
      .eq('id', course.id)

    if (error) setCourseError(error.message)
    setSavingCourse(false)
  }

  const deleteCourse = async () => {
    if (!confirm(`Delete "${course.title}" and all its modules/lessons? This can't be undone.`)) return
    await supabase.from('courses').delete().eq('id', course.id)
    router.push('/admin/courses')
  }

  // ── Modules ────────────────────────────────────────────────
  const addModule = async () => {
    if (!newModuleTitle.trim()) return
    setAddingModule(true)
    const { data, error } = await supabase
      .from('course_modules')
      .insert({
        course_id: course.id,
        title: newModuleTitle.trim(),
        sort_order: modules.length,
      })
      .select()
      .single()
    if (!error && data) {
      setModules([...modules, data])
      setNewModuleTitle('')
    }
    setAddingModule(false)
  }

  const renameModule = async (moduleId: string, title: string) => {
    setModules(modules.map((m) => (m.id === moduleId ? { ...m, title } : m)))
    await supabase.from('course_modules').update({ title }).eq('id', moduleId)
  }

  const deleteModule = async (moduleId: string) => {
    if (!confirm('Delete this module? Lessons inside it will become unassigned, not deleted.')) return
    await supabase.from('course_modules').delete().eq('id', moduleId)
    setModules(modules.filter((m) => m.id !== moduleId))
    setLessons(lessons.map((l) => (l.module_id === moduleId ? { ...l, module_id: null } : l)))
  }

  // ── Lessons ────────────────────────────────────────────────
  const deleteLesson = async (lessonId: string) => {
    if (!confirm('Delete this lesson and its content/quiz?')) return
    await supabase.from('lessons').delete().eq('id', lessonId)
    setLessons(lessons.filter((l) => l.id !== lessonId))
  }

  const moveLesson = async (lessonId: string, direction: -1 | 1) => {
    const lesson = lessons.find((l) => l.id === lessonId)
    if (!lesson) return
    const siblings = lessons
      .filter((l) => l.module_id === lesson.module_id)
      .sort((a, b) => a.sort_order - b.sort_order)
    const idx = siblings.findIndex((l) => l.id === lessonId)
    const swapWith = siblings[idx + direction]
    if (!swapWith) return

    const updated = lessons.map((l) => {
      if (l.id === lesson.id) return { ...l, sort_order: swapWith.sort_order }
      if (l.id === swapWith.id) return { ...l, sort_order: lesson.sort_order }
      return l
    })
    setLessons(updated)

    await Promise.all([
      supabase.from('lessons').update({ sort_order: swapWith.sort_order }).eq('id', lesson.id),
      supabase.from('lessons').update({ sort_order: lesson.sort_order }).eq('id', swapWith.id),
    ])
  }

  const groups: { module: CourseModule | null; lessons: CourseLesson[] }[] = [
    ...modules.map((m) => ({
      module: m,
      lessons: lessons.filter((l) => l.module_id === m.id).sort((a, b) => a.sort_order - b.sort_order),
    })),
    {
      module: null,
      lessons: lessons.filter((l) => !l.module_id).sort((a, b) => a.sort_order - b.sort_order),
    },
  ]

  return (
    <div className="space-y-8">
      {/* Course fields */}
      <div className="et-card p-6 space-y-5 max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-display font-bold text-navy-500">{course.title}</h1>
          <span className={cn('badge-pill text-[10px]', STATUS_COLORS[form.status])}>{form.status}</span>
        </div>

        {courseError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{courseError}</div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5">Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className={cn(inputClass, 'resize-none')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Category</label>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={inputClass}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Level</label>
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as Course['level'] })} className={inputClass}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Estimated minutes</label>
            <input
              type="number"
              min="1"
              value={form.estimated_minutes}
              onChange={(e) => setForm({ ...form, estimated_minutes: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Course['status'] })} className={inputClass}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button onClick={deleteCourse} className="text-sm text-red-600 hover:text-red-700 font-medium">
            Delete course
          </button>
          <button
            onClick={saveCourse}
            disabled={savingCourse}
            className="rounded-lg bg-navy-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-600 disabled:opacity-60 transition-colors"
          >
            {savingCourse ? 'Saving…' : 'Save course'}
          </button>
        </div>
      </div>

      {/* Modules + Lessons */}
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold text-navy-500">Content</h2>
          <Link
            href={`/admin/courses/${course.id}/lessons/new`}
            className="rounded-lg bg-navy-500 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
          >
            + Add lesson
          </Link>
        </div>

        {groups.map((g, gi) => (
          (g.module || g.lessons.length > 0) && (
            <div key={g.module?.id || 'unassigned'} className="et-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between gap-2">
                {g.module ? (
                  <input
                    defaultValue={g.module.title}
                    onBlur={(e) => renameModule(g.module!.id, e.target.value)}
                    className="text-sm font-semibold text-navy-500 bg-transparent outline-none border-b border-transparent focus:border-blue-600 flex-1"
                  />
                ) : (
                  <span className="text-sm font-semibold text-muted-foreground">Unassigned lessons</span>
                )}
                {g.module && (
                  <button onClick={() => deleteModule(g.module!.id)} className="text-xs text-red-500 hover:text-red-700 shrink-0">
                    Delete module
                  </button>
                )}
              </div>

              {g.lessons.length === 0 ? (
                <div className="px-4 py-4 text-xs text-muted-foreground italic">No lessons yet</div>
              ) : (
                <div className="divide-y divide-border">
                  {g.lessons.map((l, li) => (
                    <div key={l.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex flex-col">
                        <button
                          onClick={() => moveLesson(l.id, -1)}
                          disabled={li === 0}
                          className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >▲</button>
                        <button
                          onClick={() => moveLesson(l.id, 1)}
                          disabled={li === g.lessons.length - 1}
                          className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >▼</button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy-500 truncate">{l.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {l.estimated_minutes ? `${l.estimated_minutes} min` : '—'}
                          {l.hasQuiz && ' · has quiz'}
                        </p>
                      </div>
                      <span className={cn('badge-pill text-[10px] shrink-0', STATUS_COLORS[l.status])}>{l.status}</span>
                      <Link
                        href={`/admin/courses/${course.id}/lessons/${l.id}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0"
                      >
                        Edit
                      </Link>
                      <button onClick={() => deleteLesson(l.id)} className="text-xs text-red-500 hover:text-red-700 shrink-0">
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        ))}

        {/* Add module */}
        <div className="et-card p-4 flex gap-2">
          <input
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            placeholder="New module title (e.g. Chapter 1: Getting Started)"
            className={cn(inputClass, 'flex-1')}
          />
          <button
            onClick={addModule}
            disabled={addingModule || !newModuleTitle.trim()}
            className="rounded-lg bg-navy-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-600 disabled:opacity-60 transition-colors shrink-0"
          >
            + Add module
          </button>
        </div>
      </div>
    </div>
  )
}
