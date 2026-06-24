'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils/slugify'
import { cn } from '@/lib/utils/cn'
import type { LessonContentBlock } from '@/types/database'

const inputClass = 'w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors'

type EditableBlock = LessonContentBlock & { _key: string }

const BLOCK_LABELS: Record<LessonContentBlock['type'], string> = {
  heading: 'Heading',
  paragraph: 'Paragraph',
  bullet_list: 'Bullet list',
  numbered_list: 'Numbered list',
  callout: 'Callout',
  image: 'Image',
  quote: 'Quote',
  video: 'Video',
  divider: 'Divider',
  quiz_prompt: 'Quiz prompt',
}

function newBlock(type: LessonContentBlock['type']): EditableBlock {
  const id = crypto.randomUUID()
  const _key = id
  switch (type) {
    case 'heading': return { type, id, level: 2, text: '', _key }
    case 'paragraph': return { type, id, text: '', _key }
    case 'bullet_list': return { type, id, items: [''], _key }
    case 'numbered_list': return { type, id, items: [''], _key }
    case 'callout': return { type, id, label: '', text: '', variant: 'info', _key }
    case 'image': return { type, id, url: '', alt: '', caption: '', _key }
    case 'quote': return { type, id, text: '', attribution: '', _key }
    case 'video': return { type, id, url: '', title: '', _key }
    case 'divider': return { type, _key }
    default: return { type: 'paragraph', id, text: '', _key }
  }
}

interface QuizOption { id: string; text: string }
interface QuizQuestion {
  id: string
  type: 'multiple_choice'
  text: string
  options: QuizOption[]
  correct_option_id: string
  explanation?: string
}

function newQuestion(): QuizQuestion {
  return {
    id: crypto.randomUUID(),
    type: 'multiple_choice',
    text: '',
    options: [{ id: crypto.randomUUID(), text: '' }, { id: crypto.randomUUID(), text: '' }],
    correct_option_id: '',
    explanation: '',
  }
}

export function LessonEditorClient({ courseId, lessonId }: { courseId: string; lessonId: string | null }) {
  const router = useRouter()
  const supabase = createClient()
  const isNew = !lessonId

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [courseTitle, setCourseTitle] = useState('')
  const [modules, setModules] = useState<{ id: string; title: string }[]>([])
  const [otherLessons, setOtherLessons] = useState<{ id: string; title: string }[]>([])
  const [quizId, setQuizId] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    slug: '',
    module_id: '',
    summary: '',
    estimated_minutes: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    reflection_prompt: '',
    cta_override_text: '',
    next_lesson_id: '',
  })
  const [slugTouched, setSlugTouched] = useState(false)

  const [blocks, setBlocks] = useState<EditableBlock[]>([])

  const [hasQuiz, setHasQuiz] = useState(false)
  const [quizTitle, setQuizTitle] = useState('')
  const [passingScore, setPassingScore] = useState('70')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])

  // ── Load data ────────────────────────────────────────────────
  useEffect(() => {
    let active = true
    ;(async () => {
      const [{ data: course }, { data: moduleRows }, { data: lessonRows }] = await Promise.all([
        supabase.from('courses').select('title').eq('id', courseId).maybeSingle(),
        supabase.from('course_modules').select('id, title').eq('course_id', courseId).order('sort_order'),
        supabase.from('lessons').select('id, title').eq('course_id', courseId).order('sort_order'),
      ])
      if (!active) return
      setCourseTitle(course?.title || '')
      setModules(moduleRows || [])
      setOtherLessons((lessonRows || []).filter((l) => l.id !== lessonId))

      if (!isNew && lessonId) {
        const { data: lesson } = await supabase
          .from('lessons')
          .select('*, quizzes(*)')
          .eq('id', lessonId)
          .maybeSingle()

        if (lesson && active) {
          setForm({
            title: lesson.title,
            slug: lesson.slug,
            module_id: lesson.module_id || '',
            summary: lesson.summary || '',
            estimated_minutes: lesson.estimated_minutes?.toString() || '',
            status: lesson.status,
            reflection_prompt: lesson.reflection_prompt || '',
            cta_override_text: lesson.cta_override_text || '',
            next_lesson_id: lesson.next_lesson_id || '',
          })
          setSlugTouched(true)
          const content = Array.isArray(lesson.content) ? lesson.content : []
          setBlocks(content.map((b: LessonContentBlock) => ({ ...b, _key: crypto.randomUUID() })))

          const quiz = Array.isArray(lesson.quizzes) ? lesson.quizzes[0] : lesson.quizzes
          if (quiz) {
            setHasQuiz(true)
            setQuizId(quiz.id)
            setQuizTitle(quiz.title || '')
            setPassingScore(quiz.passing_score?.toString() || '70')
            setQuestions(Array.isArray(quiz.questions) ? quiz.questions : [])
          }
        }
        setLoading(false)
      }
    })()
    return () => { active = false }
  }, [courseId, lessonId, isNew])

  // ── Block editor ──────────────────────────────────────────────
  const addBlock = (type: LessonContentBlock['type']) => setBlocks([...blocks, newBlock(type)])
  const updateBlock = (key: string, patch: Partial<LessonContentBlock>) =>
    setBlocks(blocks.map((b) => (b._key === key ? ({ ...b, ...patch } as EditableBlock) : b)))
  const removeBlock = (key: string) => setBlocks(blocks.filter((b) => b._key !== key))
  const moveBlock = (key: string, dir: -1 | 1) => {
    const idx = blocks.findIndex((b) => b._key === key)
    const swap = idx + dir
    if (swap < 0 || swap >= blocks.length) return
    const copy = [...blocks]
    ;[copy[idx], copy[swap]] = [copy[swap], copy[idx]]
    setBlocks(copy)
  }

  // ── Quiz editor ────────────────────────────────────────────────
  const addQuestion = () => setQuestions([...questions, newQuestion()])
  const updateQuestion = (id: string, patch: Partial<QuizQuestion>) =>
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)))
  const removeQuestion = (id: string) => setQuestions(questions.filter((q) => q.id !== id))
  const addOption = (qId: string) =>
    setQuestions(questions.map((q) => (q.id === qId ? { ...q, options: [...q.options, { id: crypto.randomUUID(), text: '' }] } : q)))
  const updateOption = (qId: string, optId: string, text: string) =>
    setQuestions(questions.map((q) => (q.id === qId ? { ...q, options: q.options.map((o) => (o.id === optId ? { ...o, text } : o)) } : q)))
  const removeOption = (qId: string, optId: string) =>
    setQuestions(questions.map((q) => (q.id === qId ? { ...q, options: q.options.filter((o) => o.id !== optId) } : q)))

  // ── Save ───────────────────────────────────────────────────────
  const handleTitleChange = (title: string) => {
    setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }))
  }

  const save = async () => {
    setError(null)
    if (!form.title.trim()) { setError('Title is required'); return }
    if (!form.slug.trim()) { setError('Slug is required'); return }

    setSaving(true)

    const cleanBlocks: LessonContentBlock[] = blocks.map(({ _key, ...b }) => b as LessonContentBlock)

    const payload = {
      course_id: courseId,
      module_id: form.module_id || null,
      title: form.title,
      slug: form.slug,
      summary: form.summary || null,
      content: cleanBlocks,
      estimated_minutes: form.estimated_minutes ? parseInt(form.estimated_minutes, 10) : null,
      status: form.status,
      reflection_prompt: form.reflection_prompt || null,
      cta_override_text: form.cta_override_text || null,
      next_lesson_id: form.next_lesson_id || null,
    }

    let savedLessonId = lessonId

    if (isNew) {
      const { count } = await supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('course_id', courseId)
      const { data: created, error: createErr } = await supabase
        .from('lessons')
        .insert({ ...payload, sort_order: count ?? 0 })
        .select('id')
        .single()
      if (createErr || !created) { setError(createErr?.message || 'Failed to create lesson'); setSaving(false); return }
      savedLessonId = created.id
    } else {
      const { error: updateErr } = await supabase.from('lessons').update(payload).eq('id', lessonId)
      if (updateErr) { setError(updateErr.message); setSaving(false); return }
    }

    // Quiz
    if (hasQuiz && questions.length > 0) {
      const quizPayload = {
        lesson_id: savedLessonId,
        title: quizTitle || null,
        questions: questions.map(({ id, type, text, options, correct_option_id, explanation }) => ({
          id, type, text, options, correct_option_id, explanation,
        })),
        passing_score: parseFloat(passingScore) || 70,
      }
      if (quizId) {
        await supabase.from('quizzes').update(quizPayload).eq('id', quizId)
      } else {
        await supabase.from('quizzes').insert(quizPayload)
      }
    } else if (!hasQuiz && quizId) {
      await supabase.from('quizzes').delete().eq('id', quizId)
    }

    setSaving(false)
    router.push(`/admin/courses/${courseId}`)
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <Link href={`/admin/courses/${courseId}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← {courseTitle || 'Course'}
        </Link>
        <h1 className="text-xl font-display font-bold text-navy-500 mt-2">{isNew ? 'New lesson' : 'Edit lesson'}</h1>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Lesson fields */}
      <div className="et-card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">Title</label>
          <input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Slug</label>
          <input
            value={form.slug}
            onChange={(e) => { setSlugTouched(true); setForm({ ...form, slug: slugify(e.target.value) }) }}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Summary</label>
          <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={2} className={cn(inputClass, 'resize-none')} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Module</label>
            <select value={form.module_id} onChange={(e) => setForm({ ...form, module_id: e.target.value })} className={inputClass}>
              <option value="">No module</option>
              {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Minutes</label>
            <input type="number" min="1" value={form.estimated_minutes} onChange={(e) => setForm({ ...form, estimated_minutes: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })} className={inputClass}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Reflection prompt</label>
          <textarea
            value={form.reflection_prompt}
            onChange={(e) => setForm({ ...form, reflection_prompt: e.target.value })}
            rows={2}
            placeholder="Shown after the lesson — e.g. 'What's one thing you'll change this week?'"
            className={cn(inputClass, 'resize-none')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Next lesson</label>
          <select value={form.next_lesson_id} onChange={(e) => setForm({ ...form, next_lesson_id: e.target.value })} className={inputClass}>
            <option value="">None</option>
            {otherLessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
        </div>
      </div>

      {/* Content blocks */}
      <div className="et-card p-6 space-y-4">
        <h2 className="font-display font-semibold text-navy-500">Lesson content</h2>

        {blocks.map((block, idx) => (
          <div key={block._key} className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{BLOCK_LABELS[block.type]}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => moveBlock(block._key, -1)} disabled={idx === 0} className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30">▲</button>
                <button onClick={() => moveBlock(block._key, 1)} disabled={idx === blocks.length - 1} className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30">▼</button>
                <button onClick={() => removeBlock(block._key)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
              </div>
            </div>

            {block.type === 'heading' && (
              <div className="flex gap-2">
                <select value={block.level ?? 2} onChange={(e) => updateBlock(block._key, { level: Number(e.target.value) as 1 | 2 | 3 })} className={cn(inputClass, 'w-24')}>
                  <option value={1}>H1</option>
                  <option value={2}>H2</option>
                  <option value={3}>H3</option>
                </select>
                <input value={block.text} onChange={(e) => updateBlock(block._key, { text: e.target.value })} placeholder="Heading text" className={inputClass} />
              </div>
            )}

            {block.type === 'paragraph' && (
              <textarea value={block.text} onChange={(e) => updateBlock(block._key, { text: e.target.value })} rows={3} placeholder="Paragraph text" className={cn(inputClass, 'resize-none')} />
            )}

            {(block.type === 'bullet_list' || block.type === 'numbered_list') && (
              <div className="space-y-2">
                {block.items.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={item}
                      onChange={(e) => updateBlock(block._key, { items: block.items.map((it, ii) => (ii === i ? e.target.value : it)) })}
                      className={inputClass}
                    />
                    <button onClick={() => updateBlock(block._key, { items: block.items.filter((_, ii) => ii !== i) })} className="text-xs text-red-500 px-2">✕</button>
                  </div>
                ))}
                <button onClick={() => updateBlock(block._key, { items: [...block.items, ''] })} className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ Add item</button>
              </div>
            )}

            {block.type === 'callout' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input value={block.label || ''} onChange={(e) => updateBlock(block._key, { label: e.target.value })} placeholder="Label (optional)" className={cn(inputClass, 'w-40')} />
                  <select value={block.variant || 'info'} onChange={(e) => updateBlock(block._key, { variant: e.target.value as 'info' | 'warning' | 'success' | 'tip' })} className={inputClass}>
                    <option value="info">Info</option>
                    <option value="tip">Tip</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                  </select>
                </div>
                <textarea value={block.text} onChange={(e) => updateBlock(block._key, { text: e.target.value })} rows={2} placeholder="Callout text" className={cn(inputClass, 'resize-none')} />
              </div>
            )}

            {block.type === 'image' && (
              <div className="space-y-2">
                <input value={block.url} onChange={(e) => updateBlock(block._key, { url: e.target.value })} placeholder="Image URL" className={inputClass} />
                <input value={block.alt || ''} onChange={(e) => updateBlock(block._key, { alt: e.target.value })} placeholder="Alt text" className={inputClass} />
                <input value={block.caption || ''} onChange={(e) => updateBlock(block._key, { caption: e.target.value })} placeholder="Caption (optional)" className={inputClass} />
              </div>
            )}

            {block.type === 'quote' && (
              <div className="space-y-2">
                <textarea value={block.text} onChange={(e) => updateBlock(block._key, { text: e.target.value })} rows={2} placeholder="Quote text" className={cn(inputClass, 'resize-none')} />
                <input value={block.attribution || ''} onChange={(e) => updateBlock(block._key, { attribution: e.target.value })} placeholder="Attribution (optional)" className={inputClass} />
              </div>
            )}

            {block.type === 'video' && (
              <div className="space-y-2">
                <input value={block.url} onChange={(e) => updateBlock(block._key, { url: e.target.value })} placeholder="Video URL" className={inputClass} />
                <input value={block.title || ''} onChange={(e) => updateBlock(block._key, { title: e.target.value })} placeholder="Title (optional)" className={inputClass} />
              </div>
            )}

            {block.type === 'divider' && (
              <p className="text-xs text-muted-foreground italic">A horizontal divider — no content needed.</p>
            )}
          </div>
        ))}

        <div className="flex flex-wrap gap-2 pt-2">
          {(['heading', 'paragraph', 'bullet_list', 'numbered_list', 'callout', 'image', 'quote', 'video', 'divider'] as const).map((t) => (
            <button
              key={t}
              onClick={() => addBlock(t)}
              className="text-xs rounded-lg border border-border px-3 py-1.5 hover:bg-muted transition-colors"
            >
              + {BLOCK_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Quiz */}
      <div className="et-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-navy-500">Quiz</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hasQuiz} onChange={(e) => setHasQuiz(e.target.checked)} />
            Add a quiz to this lesson
          </label>
        </div>

        {hasQuiz && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <input value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} placeholder="Quiz title (optional)" className={inputClass} />
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground whitespace-nowrap">Passing score %</label>
                <input type="number" min="0" max="100" value={passingScore} onChange={(e) => setPassingScore(e.target.value)} className={inputClass} />
              </div>
            </div>

            {questions.map((q, qi) => (
              <div key={q.id} className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Question {qi + 1}</span>
                  <button onClick={() => removeQuestion(q.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                </div>
                <input value={q.text} onChange={(e) => updateQuestion(q.id, { text: e.target.value })} placeholder="Question text" className={inputClass} />

                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        checked={q.correct_option_id === opt.id}
                        onChange={() => updateQuestion(q.id, { correct_option_id: opt.id })}
                      />
                      <input value={opt.text} onChange={(e) => updateOption(q.id, opt.id, e.target.value)} placeholder="Option text" className={inputClass} />
                      <button onClick={() => removeOption(q.id, opt.id)} className="text-xs text-red-500 px-1">✕</button>
                    </div>
                  ))}
                  <button onClick={() => addOption(q.id)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ Add option</button>
                </div>

                <input
                  value={q.explanation || ''}
                  onChange={(e) => updateQuestion(q.id, { explanation: e.target.value })}
                  placeholder="Explanation shown after answering (optional)"
                  className={inputClass}
                />
              </div>
            ))}

            <button onClick={addQuestion} className="text-sm text-blue-600 hover:text-blue-700 font-medium">+ Add question</button>
          </>
        )}
      </div>

      <div className="flex justify-end gap-3 pb-8">
        <Link href={`/admin/courses/${courseId}`} className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
          Cancel
        </Link>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-navy-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-600 disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : isNew ? 'Create lesson' : 'Save lesson'}
        </button>
      </div>
    </div>
  )
}
