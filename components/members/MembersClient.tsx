'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { inviteMemberSchema, type InviteMemberInput } from '@/lib/validations'
import { cn } from '@/lib/utils/cn'
import { formatRelativeTime } from '@/lib/utils/format'
import type { TableRoleType } from '@/types/database'

interface Member {
  id: string
  role: TableRoleType
  status: string
  joined_at: string | null
  profiles: { id: string; email: string; full_name: string | null; avatar_url: string | null; username: string | null } | null
}

interface Invitation {
  id: string
  invited_email: string
  role: TableRoleType
  expires_at: string
  created_at: string
}

interface MembersClientProps {
  tableId: string
  tableName: string
  members: Member[]
  pendingInvitations: Invitation[]
  currentUserId: string
  currentRole: 'owner' | 'admin'
  activeCount: number
  includedSeats: number
  totalSeats: number
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  facilitator: 'Facilitator',
  member: 'Member',
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-gold-100 text-gold-700',
  admin: 'bg-blue-100 text-blue-700',
  facilitator: 'bg-purple-100 text-purple-700',
  member: 'bg-gray-100 text-gray-600',
}

export function MembersClient({
  tableId,
  tableName,
  members,
  pendingInvitations,
  currentUserId,
  currentRole,
  activeCount,
  includedSeats,
  totalSeats,
}: MembersClientProps) {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { role: 'member' },
  })

  const willAddSeat = activeCount >= includedSeats

  const sendInvite = async (data: InviteMemberInput) => {
    setInviting(true)
    setInviteError(null)

    const res = await fetch(`/api/tables/${tableId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const result = await res.json()
    setInviting(false)

    if (!res.ok) {
      setInviteError(result.error || 'Failed to send invitation')
      return
    }

    setInviteSuccess(data.email)
    reset()
    setTimeout(() => {
      setInviteSuccess(null)
      setShowInviteModal(false)
    }, 2500)
  }

  const removeMember = async (membershipId: string) => {
    if (!confirm('Remove this member from the table?')) return
    setRemovingId(membershipId)
    await fetch(`/api/tables/${tableId}/members/${membershipId}`, { method: 'DELETE' })
    setRemovingId(null)
    window.location.reload()
  }

  const revokeInvitation = async (invitationId: string) => {
    await fetch(`/api/tables/${tableId}/invitations/${invitationId}`, { method: 'DELETE' })
    window.location.reload()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-navy-500 tracking-tight">Members</h1>
          <p className="text-muted-foreground mt-1">
            {activeCount} of {totalSeats} seats used
            {activeCount >= includedSeats && (
              <span className="text-amber-600 ml-2">
                · {activeCount - includedSeats} extra seat{activeCount - includedSeats !== 1 ? 's' : ''} billed
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="rounded-xl bg-navy-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-600 transition-colors shrink-0"
        >
          + Invite member
        </button>
      </div>

      {/* Seat usage bar */}
      <div className="et-card p-4">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="text-muted-foreground">{activeCount} active</span>
          <span className="text-muted-foreground">{totalSeats} total seats</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', activeCount > includedSeats ? 'bg-amber-500' : 'bg-blue-600')}
            style={{ width: `${Math.min(100, (activeCount / totalSeats) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Base plan includes {includedSeats} seats · Extra seats $4.99/month each
        </p>
      </div>

      {/* Members list */}
      <div className="et-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/30">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Active members ({members.filter(m => m.status === 'active').length})
          </p>
        </div>
        <div className="divide-y divide-border">
          {members.filter(m => m.status === 'active').map(m => {
            const p = m.profiles
            const isCurrentUser = p?.id === currentUserId
            const canRemove = currentRole === 'owner' && m.role !== 'owner' && !isCurrentUser

            return (
              <div key={m.id} className="flex items-center gap-4 px-5 py-4">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center text-navy-500 font-bold text-sm shrink-0">
                  {(p?.full_name || p?.email || '?').charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-navy-500 text-sm">
                      {p?.full_name || p?.username || p?.email}
                    </span>
                    {isCurrentUser && <span className="text-[10px] text-muted-foreground">(you)</span>}
                  </div>
                  <span className="text-xs text-muted-foreground truncate block">{p?.email}</span>
                </div>

                {/* Role + joined */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn('badge-pill text-[10px]', ROLE_COLORS[m.role])}>
                    {ROLE_LABELS[m.role]}
                  </span>
                  {m.joined_at && (
                    <span className="hidden sm:inline text-xs text-muted-foreground">
                      {formatRelativeTime(m.joined_at)}
                    </span>
                  )}
                  {canRemove && (
                    <button
                      onClick={() => removeMember(m.id)}
                      disabled={removingId === m.id}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <div className="et-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-amber-50">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              Pending invitations ({pendingInvitations.length})
            </p>
          </div>
          <div className="divide-y divide-border">
            {pendingInvitations.map(inv => (
              <div key={inv.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-sm shrink-0">
                  ✉
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-navy-500 text-sm block">{inv.invited_email}</span>
                  <span className="text-xs text-muted-foreground">Expires {formatRelativeTime(inv.expires_at)}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn('badge-pill text-[10px]', ROLE_COLORS[inv.role])}>
                    {ROLE_LABELS[inv.role]}
                  </span>
                  <button
                    onClick={() => revokeInvitation(inv.id)}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-navy-500">Invite a member</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
            </div>

            {inviteSuccess ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-3">✓</div>
                <p className="font-semibold text-navy-500">Invitation sent to {inviteSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(sendInvite)} className="space-y-4">
                {willAddSeat && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
                    This invite may add a seat (+$4.99/month) when accepted, since all {includedSeats} included seats are in use.
                  </div>
                )}

                {inviteError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {inviteError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1.5">Email address</label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="member@example.com"
                    className={cn(
                      'w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none',
                      'focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors',
                      errors.email ? 'border-red-300' : 'border-border'
                    )}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Role</label>
                  <select
                    {...register('role')}
                    className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                  >
                    <option value="member">Member — access courses, events, goals</option>
                    <option value="facilitator">Facilitator — can host events and upload recordings</option>
                    {currentRole === 'owner' && (
                      <option value="admin">Admin — full management access</option>
                    )}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex-1 rounded-xl bg-navy-500 py-2.5 text-sm font-semibold text-white hover:bg-navy-600 disabled:opacity-50 transition-colors"
                  >
                    {inviting ? 'Sending…' : 'Send invitation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
