'use client'

import { useState } from 'react'

export function BillingPortalButton({ tableId }: { tableId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/stripe/billing-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId }),
      })
      const { url, error: apiError } = await res.json()
      if (apiError) throw new Error(apiError)
      if (url) window.location.href = url
    } catch (err: any) {
      setError(err.message ?? 'Could not open billing portal')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-xl bg-navy-500 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-600 transition-colors disabled:opacity-60"
      >
        {loading ? 'Opening billing portal…' : 'Open billing portal →'}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
