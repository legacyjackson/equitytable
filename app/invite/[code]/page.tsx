// app/invite/[code]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Logo } from '@/components/brand/Logo'
import { createClient } from '@/lib/supabase/client'

export default function InvitePage() {
  const router = useRouter()
  const params = useParams()
  const code = params.code as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tableName, setTableName] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Redirect to login, then back to this invite
      router.push(`/sign-in?redirect=/invite/${code}`)
      return
    }

    setLoading(false)
  }

  const acceptInvite = async () => {
    setAccepting(true)
    setError(null)

    try {
      const res = await fetch(`/api/invites/${code}/accept`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to accept invite')
        setAccepting(false)
        return
      }

      // Redirect to table
      window.location.href = `/app/tables/${data.table.id}`
    } catch (err) {
      setError('Something went wrong')
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-500 to-navy-600 py-10 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex justify-center mb-6">
          <Logo variant="light-bg" size="sm" />
        </div>

        <h1 className="font-display text-2xl font-bold text-navy-500 text-center mb-2">
          You're invited!
        </h1>
        <p className="text-muted-foreground text-sm text-center mb-6">
          Join an Equity Table and start building wealth together.
        </p>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={acceptInvite}
          disabled={accepting}
          className="w-full rounded-xl bg-navy-500 py-3.5 text-sm font-semibold text-white hover:bg-navy-600 disabled:opacity-60 transition-colors"
        >
          {accepting ? 'Joining...' : 'Join table'}
        </button>

        <p className="text-xs text-muted-foreground text-center mt-4">
          This will add you as a member to the table and you can start learning immediately.
        </p>
      </div>
    </div>
  )
}
