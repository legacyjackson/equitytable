'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'

const courseSchema = z.object({
  title: z.string().min(3, 'Title required'),
  description: z.string().optional(),
  category_id: z.string().uuid('Select a category'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  estimated_minutes: z.coerce.number().int().positive().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  religious_context: z.string().optional(),
  table_type_recommendations: z.array(z.string()).optional(),
})

type CourseForm = z.infer<typeof courseSchema>

// We need categories — fetch client-side since this is a client component
export default function NewCoursePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([])
  const [categoriesLoaded, setCategoriesLoaded] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    defaultValues: { level: 'beginner', status: 'draft' },
  })

  // Load categories on first render
  if (!categoriesLoaded) {
    setCategoriesLoaded(true)
    const supabase = createClient()
    supabase.from('course_categories').select('id, name, slug').eq('active', true).order('sort_order')
      .then(({ data }) => { if (data) setCategories(data) })
  }

  const onSubmit = async (data: CourseForm) => {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    // Generate slug from title
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')

    const { data: course, error: err } = await supabase
      .from('courses')
      .insert({
        title: data.title,
        slug,
        description: data.description || null,
        category_id: data.category_id,
        level: data.level,
        estimated_minutes: data.estimated_minutes || null,
        status: data.status,
        religious_context: data.religious_context || null,
      })
      .select('id')
      .single()

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    router.push(`/admin/courses/${course.id}`)
  }

  const inputClass = (hasError?: boolean) => cn(
    'w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors',
    'focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10',
    hasError ? 'border-red-300' : 'border-border'
  )

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-6">
        <Link href="/admin/courses" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Courses
        </Link>
        <h1 className="text-2xl font-display font-bold text-navy-500 mt-2">New course</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="et-card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">Title <span className="text-red-500">*</span></label>
          <input {...register('title')} placeholder="e.g. Budgeting Basics" className={inputClass(!!errors.title)} />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea {...register('description')} rows={3} placeholder="What will learners get from this course?"
            className={cn(inputClass(), 'resize-none')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Category <span className="text-red-500">*</span></label>
            <select {...register('category_id')} className={inputClass(!!errors.category_id)}>
              <option value="">Select category…</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.category_id && <p className="mt-1 text-xs text-red-600">{errors.category_id.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Level</label>
            <select {...register('level')} className={inputClass()}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Estimated minutes</label>
            <input {...register('estimated_minutes')} type="number" min="1" placeholder="e.g. 45" className={inputClass()} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Status</label>
            <select {...register('status')} className={inputClass()}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Religious context</label>
          <select {...register('religious_context')} className={inputClass()}>
            <option value="">None (general audience)</option>
            <option value="christian">Christian</option>
            <option value="muslim">Muslim</option>
            <option value="jewish">Jewish</option>
            <option value="general">Faith-based general</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">Religious courses only show for matching table types.</p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/admin/courses" className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-navy-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-600 transition-colors disabled:opacity-60"
          >
            {loading ? 'Creating…' : 'Create course'}
          </button>
        </div>
      </form>
    </div>
  )
}
