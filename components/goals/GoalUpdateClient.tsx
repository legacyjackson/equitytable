'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

interface GoalUpdateClientProps {
  goalId: string
  tableId: string
  currentUserId: string
  isCurrency: boolean
  isAdmin: boolean
}

export function GoalUpdateClient({ goalId, tableId, currentUserId, isCurrency, isAdmin }: GoalUpdateClientProps) {
  const [text, setText] = useState('')
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!text.trim()) return
    setSubmitting(true)

    try {
      const supabase = createClient()
      await supabase.from('goal_updates').insert({
        goal_id: goalId,
        user_id: currentUserId,
        update_text: text.trim(),
        update_value: value ? parseFloat(value) : null,
      })
      setText('')
      setValue('')
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
      // Reload to show new update
      window.location.reload()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="et-card p-5 space-y-3">
      <h2 className="font-display font-semibold text-navy-500 text-sm">Post a progress update</h2>

      {isAdmin && (
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Add to progress {isCurrency ? '($)' : ''}
            <span className="ml-1 font-normal">(optional)</span>
          </label>
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={isCurrency ? '500.00' : '5'}
            step={isCurrency ? '0.01' : '1'}
            min={0}
            className="w-full rounded-lg border border-border px-3.5 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Update note</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Share a progress note with your table…"
          rows={3}
          className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors resize-none"
        />
      </div>

      {submitted && (
        <p className="text-xs text-green-600 font-medium">✓ Update posted!</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!text.trim() || submitting}
        className="w-full rounded-lg bg-navy-500 py-2.5 text-sm font-semibold text-white hover:bg-navy-600 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Posting…' : 'Post update'}
      </button>
    </div>
  )
}
