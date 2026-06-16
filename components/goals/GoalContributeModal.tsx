'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format'

interface ContributeModalProps {
  goalId: string
  tableId: string
  goalTitle: string
  contributionType: 'manual' | 'pledge' | 'stripe'
  suggestedAmounts?: number[]
  currentValue: number
  targetValue: number
  currency?: string
  onClose: () => void
  onSuccess: (amount: number) => void
}

export function GoalContributeModal({
  goalId,
  tableId,
  goalTitle,
  contributionType,
  suggestedAmounts = [25, 50, 100, 250],
  currentValue,
  targetValue,
  currency = 'USD',
  onClose,
  onSuccess,
}: ContributeModalProps) {
  const [amount, setAmount] = useState<string>('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'amount' | 'confirm' | 'done'>('amount')

  const numAmount = parseFloat(amount) || 0
  const remaining = targetValue - currentValue
  const cappedAmount = Math.min(numAmount, remaining)

  const handleSuggestedAmount = (a: number) => {
    setAmount(String(a))
  }

  const handleContribute = async () => {
    if (numAmount <= 0) { setError('Enter a valid amount.'); return }
    setLoading(true)
    setError(null)

    try {
      if (contributionType === 'stripe') {
        // Redirect to Stripe checkout for this goal
        const res = await fetch('/api/stripe/goal-contribute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal_id: goalId, table_id: tableId, amount: numAmount, note }),
        })
        const { url, error: err } = await res.json()
        if (err) throw new Error(err)
        window.location.href = url
        return
      }

      // Manual or pledge — record directly
      const res = await fetch(`/api/tables/${tableId}/goals/${goalId}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          contribution_type: contributionType,
          note: note || null,
        }),
      })
      const { error: err } = await res.json()
      if (err) throw new Error(err)

      setStep('done')
      onSuccess(numAmount)
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-navy-500/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-navy-500">Contribute to goal</h2>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{goalTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
          >
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>{formatCurrency(currentValue, currency)} raised</span>
            <span>{formatCurrency(targetValue, currency)} goal</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${Math.min(100, (currentValue / targetValue) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(remaining, currency)} remaining to reach goal
          </p>
        </div>

        <div className="px-6 pb-6">
          {step === 'done' ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-display text-xl font-semibold text-navy-500 mb-2">
                Contribution recorded!
              </h3>
              <p className="text-sm text-muted-foreground mb-5">
                {formatCurrency(numAmount, currency)} {contributionType === 'pledge' ? 'pledged' : 'contributed'} toward {goalTitle}.
              </p>
              <button
                onClick={onClose}
                className="rounded-xl bg-navy-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Suggested amounts */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Choose an amount
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {suggestedAmounts.map(a => (
                    <button
                      key={a}
                      onClick={() => handleSuggestedAmount(a)}
                      className={cn(
                        'rounded-lg border py-2 text-sm font-semibold transition-colors',
                        numAmount === a
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-border hover:border-blue-300 hover:bg-blue-50 text-navy-500'
                      )}
                    >
                      {formatCurrency(a, currency)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom amount */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                  Or enter amount
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className={cn(
                      'w-full rounded-lg border pl-8 pr-3.5 py-2.5 text-sm outline-none transition-colors',
                      'focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10',
                      error ? 'border-red-300' : 'border-border'
                    )}
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                  Note (optional)
                </label>
                <input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Proud to contribute!"
                  maxLength={200}
                  className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors"
                />
              </div>

              {/* Type indicator */}
              <div className="rounded-lg bg-muted/60 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">
                  {contributionType === 'stripe' && '💳 Paid via Stripe — you\'ll be redirected to complete payment.'}
                  {contributionType === 'pledge' && '🤝 This is a pledge — you commit to contributing this amount.'}
                  {contributionType === 'manual' && '📝 Manual contribution — this will be recorded directly.'}
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <button
                onClick={handleContribute}
                disabled={loading || numAmount <= 0}
                className={cn(
                  'w-full rounded-xl py-3.5 text-sm font-bold text-white transition-colors',
                  numAmount > 0
                    ? 'bg-navy-500 hover:bg-navy-600'
                    : 'bg-muted text-muted-foreground cursor-not-allowed',
                  loading && 'opacity-60'
                )}
              >
                {loading
                  ? 'Processing…'
                  : contributionType === 'stripe'
                  ? `Pay ${numAmount > 0 ? formatCurrency(numAmount, currency) : '—'} →`
                  : contributionType === 'pledge'
                  ? `Pledge ${numAmount > 0 ? formatCurrency(numAmount, currency) : '—'}`
                  : `Record ${numAmount > 0 ? formatCurrency(numAmount, currency) : '—'}`
                }
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
