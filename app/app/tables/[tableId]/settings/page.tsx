// app/app/tables/[tableId]/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Invite {
  id: string
  link: string
  email: string
  status: string
  created_at: string
}

export default function TableSettingsPage() {
  const params = useParams()
  const tableId = params.tableId as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [invites, setInvites] = useState<Invite[]>([])
  const [newInviteEmail, setNewInviteEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    loadInvites()
  }, [])

  const loadInvites = async () => {
    setLoading(true)
    const res = await fetch(`/api/tables/${tableId}/invites`)
    const data = await res.json()
    setInvites(data.invites || [])
    setLoading(false)
  }

  const createInvite = async () => {
    if (!newInviteEmail) return
    setCreating(true)
    const res = await fetch(`/api/tables/${tableId}/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newInviteEmail, role: 'member' }),
    })

    const data = await res.json()
    if (res.ok) {
      setInvites([data.invite, ...invites])
      setNewInviteEmail('')
    }
    setCreating(false)
  }

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link)
    setCopied(link)
    setTimeout(() => setCopied(null), 2000)
  }

  const revokeInvite = async (inviteId: string) => {
    const res = await fetch(`/api/tables/${tableId}/invites/${inviteId}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      setInvites(invites.filter(i => i.id !== inviteId))
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="space-y-6 p-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-navy-500">Table Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage invites and members</p>
      </div>

      {/* Create Invite */}
      <div className="et-card p-6">
        <h2 className="text-lg font-display font-semibold text-navy-500 mb-4">Invite members</h2>

        <div className="flex gap-3">
          <input
            type="email"
            value={newInviteEmail}
            onChange={(e) => setNewInviteEmail(e.target.value)}
            placeholder="member@example.com"
            required
            className="flex-1 rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600"
          />
          <button
            onClick={createInvite}
            disabled={creating || !newInviteEmail}
            className="rounded-lg bg-navy-500 text-white px-4 py-2.5 font-semibold hover:bg-navy-600 disabled:opacity-60"
          >
            {creating ? 'Creating...' : 'Create invite'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Sends an email invitation and gives you a shareable link.
        </p>
      </div>

      {/* Active Invites */}
      {invites.length > 0 && (
        <div className="et-card p-6">
          <h2 className="text-lg font-display font-semibold text-navy-500 mb-4">Active invites ({invites.length})</h2>

          <div className="space-y-3">
            {invites.map(invite => (
              <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50">
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy-500">{invite.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created {new Date(invite.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyLink(invite.link)}
                    className="text-xs px-3 py-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                  >
                    {copied === invite.link ? '✓ Copied' : 'Copy link'}
                  </button>
                  <button
                    onClick={() => revokeInvite(invite.id)}
                    className="text-xs px-3 py-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {invites.length === 0 && (
        <div className="et-card p-6 text-center">
          <p className="text-muted-foreground text-sm">No active invites yet. Create one to get started!</p>
        </div>
      )}
    </div>
  )
}
