'use client'

import { useState } from 'react'

interface GlobalPathwaysCTAProps {
  tableId?: string
  lessonId?: string
  courseId?: string
  eventId?: string
  text?: string
  placement?: string
  variant?: 'card' | 'inline' | 'banner'
}

export function GlobalPathwaysCTA({
  tableId,
  lessonId,
  courseId,
  eventId,
  text,
  placement = 'lesson_end',
  variant = 'card',
}: GlobalPathwaysCTAProps) {
  const [loading, setLoading] = useState(false)

  const ctaText = text || "Ready to turn this lesson into a real plan? Start your Global Pathway."

  const handleClick = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/affiliate/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_id: tableId,
          lesson_id: lessonId,
          course_id: courseId,
          event_id: eventId,
          cta_text: ctaText,
          placement,
        }),
      })

      const { destination_url } = await res.json()
      window.open(destination_url, '_blank', 'noopener,noreferrer')
    } catch {
      // Fallback direct link
      window.open(process.env.NEXT_PUBLIC_PATHWAYS_URL || 'https://legacyplan.app/', '_blank', 'noopener,noreferrer')
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'inline') {
    return (
      <span className="inline-flex items-center gap-1 text-sm">
        <button
          onClick={handleClick}
          disabled={loading}
          className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2"
        >
          Start your Global Pathway
        </button>
        <span className="text-[10px] text-muted-foreground">when ready</span>
      </span>
    )
  }

  if (variant === 'banner') {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl bg-navy-500 p-4 text-white">
        <p className="text-sm font-medium leading-snug">{ctaText}</p>
        <button
          onClick={handleClick}
          disabled={loading}
          className="shrink-0 rounded-lg bg-gold-400 px-4 py-2 text-xs font-bold text-navy-500 hover:bg-gold-300 transition-colors disabled:opacity-60"
        >
          {loading ? '…' : 'Start →'}
        </button>
      </div>
    )
  }

  // Default: card
  return (
    <div className="rounded-xl border border-gold-400/30 bg-gradient-to-br from-navy-500/5 to-blue-600/5 p-6 text-center">
      <div className="text-2xl mb-3">🚀</div>
      <p className="text-sm font-semibold text-navy-500 mb-1.5 leading-snug max-w-sm mx-auto">
        {ctaText}
      </p>
      <p className="text-xs text-muted-foreground mb-4">
        Global Pathways — $179.99/month · 6-month personalized financial plan
      </p>
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center rounded-lg bg-navy-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-600 transition-colors disabled:opacity-60"
      >
        {loading ? 'Opening…' : 'Start your Global Pathway'}
      </button>
      <p className="mt-3 text-[10px] text-muted-foreground">
        No pressure. Keep learning here — act when you're ready.
      </p>
    </div>
  )
}
