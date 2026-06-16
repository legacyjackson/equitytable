'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { formatDuration } from '@/lib/utils/format'
import { GlobalPathwaysCTA } from '@/components/affiliate/GlobalPathwaysCTA'
import type { Lesson, LessonAudio, LessonAudioSegment, LessonProgress, LessonContentBlock } from '@/types/database'

interface LessonPlayerProps {
  lesson: Lesson & { courses: { id: string; title: string; slug: string } | null }
  audio: LessonAudio | null
  segments: LessonAudioSegment[]
  initialProgress: LessonProgress | null
  tableId: string
  userId: string
  affiliateUrl: string
}

export function LessonPlayer({
  lesson,
  audio,
  segments,
  initialProgress,
  tableId,
  userId,
  affiliateUrl,
}: LessonPlayerProps) {
  // Audio state
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(initialProgress?.last_position_seconds ?? 0)
  const [duration, setDuration] = useState(audio?.duration_seconds ?? 0)
  const [speed, setSpeed] = useState(1)
  const [activeSegmentIdx, setActiveSegmentIdx] = useState(-1)
  const segmentRefs = useRef<Record<number, HTMLElement | null>>({})

  // Progress state
  const [completed, setCompleted] = useState(initialProgress?.status === 'completed')
  const [showCompletion, setShowCompletion] = useState(false)
  const [saving, setSaving] = useState(false)
  const progressSaveRef = useRef<ReturnType<typeof setTimeout>>()

  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)

  const quiz = (lesson as any).quizzes?.[0] ?? null

  // ── Audio controls ──────────────────────────────────────────
  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) audioRef.current.pause()
    else audioRef.current.play()
  }

  const seek = (t: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = t
    setCurrentTime(t)
  }

  const skip = (delta: number) => seek(Math.max(0, Math.min(duration, currentTime + delta)))

  useEffect(() => {
    const el = audioRef.current
    if (!el) return

    const onPlay    = () => setPlaying(true)
    const onPause   = () => setPlaying(false)
    const onEnded   = () => { setPlaying(false); handleProgress(100) }
    const onLoaded  = () => { setDuration(el.duration); el.currentTime = initialProgress?.last_position_seconds ?? 0 }
    const onTime    = () => {
      setCurrentTime(el.currentTime)
      // Find active segment
      const idx = segments.findIndex(s => el.currentTime >= s.start_time && el.currentTime < s.end_time)
      if (idx !== activeSegmentIdx) {
        setActiveSegmentIdx(idx)
        // Scroll segment into view
        if (idx >= 0 && segmentRefs.current[idx]) {
          segmentRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }
      // Throttled progress save
      if (progressSaveRef.current) clearTimeout(progressSaveRef.current)
      progressSaveRef.current = setTimeout(() => {
        saveProgress(Math.round((el.currentTime / el.duration) * 100), el.currentTime)
      }, 5000)
    }

    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('ended', onEnded)
    el.addEventListener('loadedmetadata', onLoaded)
    el.addEventListener('timeupdate', onTime)
    el.playbackRate = speed

    return () => {
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('ended', onEnded)
      el.removeEventListener('loadedmetadata', onLoaded)
      el.removeEventListener('timeupdate', onTime)
    }
  }, [segments, activeSegmentIdx, speed])

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed
  }, [speed])

  // ── Progress persistence ────────────────────────────────────
  const saveProgress = useCallback(async (pct: number, pos: number) => {
    await fetch('/api/lesson-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lesson_id: lesson.id,
        table_id: tableId,
        progress_percent: pct,
        last_position_seconds: pos,
        status: pct >= 100 ? 'completed' : 'in_progress',
      }),
    })
  }, [lesson.id, tableId])

  const handleProgress = useCallback(async (pct: number) => {
    if (completed) return
    setSaving(true)
    await saveProgress(pct, audioRef.current?.currentTime ?? 0)
    setSaving(false)
    if (pct >= 90) {
      setCompleted(true)
      setShowCompletion(true)
    }
  }, [completed, saveProgress])

  const markComplete = async () => {
    await handleProgress(100)
    setShowCompletion(true)
  }

  // ── Quiz ────────────────────────────────────────────────────
  const submitQuiz = async () => {
    if (!quiz) return
    let score = 0
    quiz.questions.forEach((q: { id: string; correct_option_id: string }) => {
      if (quizAnswers[q.id] === q.correct_option_id) score++
    })
    const pct = Math.round((score / quiz.questions.length) * 100)
    setQuizScore(pct)
    setQuizSubmitted(true)

    await fetch('/api/quiz-attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quiz_id: quiz.id,
        lesson_id: lesson.id,
        table_id: tableId,
        score: pct,
        answers: quizAnswers,
        passed: pct >= quiz.passing_score,
      }),
    })

    if (pct >= 70) await handleProgress(100)
  }

  // ── Content renderer ────────────────────────────────────────
  function renderBlock(block: LessonContentBlock, idx: number) {
    switch (block.type) {
      case 'heading':
        return (
          <h3 key={idx} className="font-display text-xl font-semibold text-navy-500 mt-8 mb-3">
            {block.text}
          </h3>
        )
      case 'paragraph': {
        const segIdx = segments.findIndex(s => s.block_id === block.id)
        const isActive = segIdx >= 0 && segIdx === activeSegmentIdx
        return (
          <p
            key={idx}
            ref={el => { if (segIdx >= 0) segmentRefs.current[segIdx] = el }}
            className={cn(
              'text-[15px] leading-relaxed mb-4 rounded px-1 -mx-1 transition-colors duration-150',
              isActive ? 'bg-blue-50 text-blue-900' : 'text-foreground'
            )}
          >
            {block.text}
          </p>
        )
      }
      case 'bullet_list':
        return (
          <ul key={idx} className="mb-4 space-y-2">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )
      case 'callout':
        return (
          <div key={idx} className="my-5 p-4 rounded-xl border-l-4 border-gold-400 bg-gold-50">
            {block.label && <p className="text-[10px] font-bold uppercase tracking-widest text-gold-600 mb-1">{block.label}</p>}
            <p className="text-[15px] leading-relaxed text-navy-500">{block.text}</p>
          </div>
        )
      case 'quote':
        return (
          <blockquote key={idx} className="my-5 pl-4 border-l-4 border-blue-600 italic text-muted-foreground">
            <p className="text-[15px] leading-relaxed">{block.text}</p>
            {block.attribution && <cite className="text-xs not-italic mt-1 block">— {block.attribution}</cite>}
          </blockquote>
        )
      default:
        return null
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Back nav */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href={`/app/tables/${tableId}/courses`} className="text-muted-foreground hover:text-foreground transition-colors">
          Courses
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">{lesson.courses?.title}</span>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-navy-500 truncate">{lesson.title}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lesson header */}
          <div>
            <h1 className="font-display text-3xl font-bold text-navy-500 tracking-tight mb-2">
              {lesson.title}
            </h1>
            {lesson.summary && (
              <p className="text-muted-foreground leading-relaxed">{lesson.summary}</p>
            )}
            {completed && (
              <span className="inline-flex items-center gap-1.5 mt-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                ✓ Completed
              </span>
            )}
          </div>

          {/* ── Audio player ── */}
          {audio?.audio_url && (
            <div className="et-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Read-along audio
                </span>
                {audio.audio_provider === 'human_upload' && (
                  <span className="text-[10px] text-blue-600 font-semibold">· Human narrated</span>
                )}
              </div>

              <audio ref={audioRef} src={audio.audio_url} preload="metadata" />

              {/* Progress track */}
              <div
                className="audio-track mb-3"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  seek(((e.clientX - rect.left) / rect.width) * duration)
                }}
              >
                <div
                  className="audio-track-fill"
                  style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {/* Skip back 10s */}
                  <button onClick={() => skip(-10)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground text-sm font-mono">
                    −10s
                  </button>
                  {/* Play/Pause */}
                  <button
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-navy-500 hover:bg-navy-600 flex items-center justify-center text-white transition-colors"
                  >
                    {playing ? '⏸' : '▶'}
                  </button>
                  {/* Skip forward 10s */}
                  <button onClick={() => skip(10)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground text-sm font-mono">
                    +10s
                  </button>
                </div>

                {/* Time */}
                <span className="text-xs font-mono text-muted-foreground tabular-nums">
                  {formatDuration(currentTime)} / {formatDuration(duration)}
                </span>

                {/* Speed */}
                <select
                  value={speed}
                  onChange={e => setSpeed(Number(e.target.value))}
                  className="text-xs border border-border rounded-lg px-2 py-1 bg-white outline-none focus:border-blue-600"
                >
                  {[0.75, 1, 1.25, 1.5, 1.75, 2].map(s => (
                    <option key={s} value={s}>{s}×</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {!audio?.audio_url && (
            <div className="rounded-xl border border-dashed border-border p-4 text-center">
              <p className="text-xs text-muted-foreground">Audio narration coming soon for this lesson.</p>
            </div>
          )}

          {/* Lesson content */}
          <div className="et-card p-6 md:p-8">
            {(lesson.content as LessonContentBlock[]).map((block, idx) => renderBlock(block, idx))}

            {/* Reflection prompt */}
            {lesson.reflection_prompt && (
              <div className="mt-8 p-5 rounded-xl bg-navy-50 border border-navy-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-navy-400 mb-2">
                  Reflection
                </p>
                <p className="text-[15px] leading-relaxed text-navy-600 italic">
                  {lesson.reflection_prompt}
                </p>
              </div>
            )}

            {/* Mark complete */}
            {!completed && !quiz && (
              <div className="mt-8 pt-6 border-t border-border">
                <button
                  onClick={markComplete}
                  disabled={saving}
                  className="w-full rounded-xl bg-navy-500 py-3.5 text-sm font-semibold text-white hover:bg-navy-600 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving…' : 'Mark lesson complete'}
                </button>
              </div>
            )}

            {/* Quiz */}
            {quiz && !completed && (
              <div className="mt-8 pt-6 border-t border-border">
                <button
                  onClick={() => setShowQuiz(true)}
                  className="w-full rounded-xl bg-navy-500 py-3.5 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
                >
                  Check your understanding →
                </button>
              </div>
            )}
          </div>

          {/* Quiz modal */}
          {showQuiz && quiz && (
            <div className="et-card p-6">
              <h3 className="font-display text-xl font-semibold text-navy-500 mb-4">
                Check your understanding
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {quiz.questions.length} questions · {quiz.passing_score}% to pass
              </p>

              {quizSubmitted ? (
                <div className={cn(
                  'rounded-xl p-5 mb-6',
                  quizScore >= quiz.passing_score ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
                )}>
                  <p className={cn('font-semibold', quizScore >= quiz.passing_score ? 'text-green-700' : 'text-amber-700')}>
                    {quizScore >= quiz.passing_score ? `Nice work — you scored ${quizScore}%!` : `You scored ${quizScore}%. Review the lesson and try again.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {quiz.questions.map((q: { id: string; text: string; options: { id: string; text: string }[] }, qi: number) => (
                    <div key={q.id}>
                      <p className="font-medium text-navy-500 mb-3">
                        {qi + 1}. {q.text}
                      </p>
                      <div className="space-y-2">
                        {q.options.map((opt: { id: string; text: string }) => (
                          <button
                            key={opt.id}
                            onClick={() => setQuizAnswers(a => ({ ...a, [q.id]: opt.id }))}
                            className={cn(
                              'w-full text-left p-3 rounded-lg border-2 text-sm transition-colors',
                              quizAnswers[q.id] === opt.id
                                ? 'border-blue-600 bg-blue-50 text-blue-900'
                                : 'border-border hover:border-blue-300'
                            )}
                          >
                            {opt.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={submitQuiz}
                    disabled={Object.keys(quizAnswers).length < quiz.questions.length}
                    className="w-full rounded-xl bg-navy-500 py-3 text-sm font-semibold text-white hover:bg-navy-600 disabled:opacity-40 transition-colors"
                  >
                    Submit answers
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Completion celebration */}
          {showCompletion && (
            <div className="et-card p-8 text-center border-green-200 bg-green-50">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="font-display text-2xl font-bold text-navy-500 mb-2">Lesson complete!</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Great work. You've earned 10 XP.
              </p>
              {lesson.next_lesson_id ? (
                <Link
                  href={`/app/tables/${tableId}/lessons/${lesson.next_lesson_id}`}
                  className="inline-flex items-center rounded-xl bg-navy-500 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
                >
                  Next lesson →
                </Link>
              ) : (
                <Link
                  href={`/app/tables/${tableId}/courses`}
                  className="inline-flex items-center rounded-xl bg-navy-500 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
                >
                  Back to courses
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Lesson info */}
          <div className="et-card p-5">
            <h2 className="font-display font-semibold text-navy-500 mb-3">This lesson</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              {lesson.estimated_minutes && (
                <div className="flex items-center gap-2">
                  <span>⏱</span>
                  <span>{lesson.estimated_minutes} minutes</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span>📚</span>
                <span>{lesson.courses?.title}</span>
              </div>
            </div>
          </div>

          {/* Global Pathways CTA — sidebar */}
          <GlobalPathwaysCTA
            tableId={tableId}
            lessonId={lesson.id}
            courseId={lesson.course_id}
            text={lesson.cta_override_text || undefined}
            placement="lesson_sidebar"
            variant="card"
          />
        </div>
      </div>
    </div>
  )
}
