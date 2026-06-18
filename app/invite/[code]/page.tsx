import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Logo } from '@/components/brand/Logo'

interface InvitePageProps {
  params: Promise<{ code: string }>
}

export const metadata = { title: 'Accept Invitation' }

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const serviceClient = await createServiceClient()

  // --- Try token-based system first (table_invitations) ---
  const { data: invitation } = await serviceClient
    .from('table_invitations')
    .select('*, equity_tables(id, name, mission, slug, logo_url)')
    .eq('token', code)
    .maybeSingle()

  if (invitation) {
    if (invitation.status !== 'pending' || new Date(invitation.expires_at) < new Date()) {
      return (
        <InviteShell>
          <div className="text-center">
            <div className="text-4xl mb-4">⏰</div>
            <h1 className="font-display text-2xl font-bold text-navy-500 mb-2">This invitation has expired</h1>
            <p className="text-muted-foreground text-sm mb-2">Invitations expire after 14 days.</p>
            <p className="text-muted-foreground text-sm">Ask your table admin to send a new one.</p>
          </div>
        </InviteShell>
      )
    }

    const table = invitation.equity_tables as { id: string; name: string; mission: string | null; slug: string; logo_url: string | null } | null

    if (!user) {
      return (
        <InviteShell>
          <div className="text-center">
            <div className="text-3xl mb-4">🪑</div>
            <h1 className="font-display text-2xl font-bold text-navy-500 mb-2">You've been invited to join</h1>
            <h2 className="font-display text-xl text-blue-700 mb-3">{table?.name}</h2>
            {table?.mission && (
              <p className="text-muted-foreground text-sm italic mb-6 max-w-xs mx-auto">"{table.mission}"</p>
            )}
            <div className="space-y-3">
              <Link
                href={`/auth/sign-up?redirect=/invite/${code}`}
                className="block w-full rounded-xl bg-navy-500 py-3 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
              >
                Create an account to join
              </Link>
              <Link
                href={`/auth/sign-in?redirect=/invite/${code}`}
                className="block w-full rounded-xl border border-border py-3 text-sm font-semibold text-navy-500 hover:bg-muted transition-colors"
              >
                Sign in to existing account
              </Link>
            </div>
          </div>
        </InviteShell>
      )
    }

    // Logged in — auto-accept token invite
    const { data: existingMembership } = await serviceClient
      .from('table_memberships')
      .select('id, status')
      .eq('table_id', invitation.table_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingMembership?.status === 'active') {
      redirect(`/app/tables/${invitation.table_id}`)
    }

    await Promise.all([
      serviceClient.from('table_memberships').upsert({
        table_id: invitation.table_id,
        user_id: user.id,
        role: invitation.role,
        status: 'active',
        invited_by: invitation.invited_by,
        joined_at: new Date().toISOString(),
      }, { onConflict: 'table_id,user_id' }),
      serviceClient.from('table_invitations').update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by: user.id,
      }).eq('id', invitation.id),
    ])

    const { data: badge } = await serviceClient.from('badges').select('id').eq('slug', 'seat-at-the-table').maybeSingle()
    if (badge) {
      await serviceClient.from('user_badges').upsert({
        user_id: user.id,
        badge_id: badge.id,
        table_id: invitation.table_id,
      }, { onConflict: 'user_id,badge_id,table_id', ignoreDuplicates: true })
    }

    redirect(`/app/tables/${invitation.table_id}?joined=true`)
  }

  // --- Fall back to code-based system (table_invites) ---
  const { data: invite } = await serviceClient
    .from('table_invites')
    .select('id, table_id, status, email')
    .eq('code', code)
    .maybeSingle()

  if (!invite) {
    return (
      <InviteShell>
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="font-display text-2xl font-bold text-navy-500 mb-2">Invitation not found</h1>
          <p className="text-muted-foreground text-sm">This invitation link is invalid or has already been used.</p>
          <Link href="/" className="inline-flex mt-6 text-sm font-semibold text-blue-600 hover:underline">
            Back to Equity Table
          </Link>
        </div>
      </InviteShell>
    )
  }

  if (invite.status !== 'active') {
    return (
      <InviteShell>
        <div className="text-center">
          <div className="text-4xl mb-4">⏰</div>
          <h1 className="font-display text-2xl font-bold text-navy-500 mb-2">Invite no longer active</h1>
          <p className="text-muted-foreground text-sm">This invite has already been used or has expired.</p>
        </div>
      </InviteShell>
    )
  }

  if (!user) {
    return (
      <InviteShell>
        <div className="text-center">
          <div className="text-3xl mb-4">🪑</div>
          <h1 className="font-display text-2xl font-bold text-navy-500 mb-2">You're invited!</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Join an Equity Table and start building wealth together.
          </p>
          <div className="space-y-3">
            <Link
              href={`/auth/sign-up?redirect=/invite/${code}`}
              className="block w-full rounded-xl bg-navy-500 py-3 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
            >
              Create an account to join
            </Link>
            <Link
              href={`/auth/sign-in?redirect=/invite/${code}`}
              className="block w-full rounded-xl border border-border py-3 text-sm font-semibold text-navy-500 hover:bg-muted transition-colors"
            >
              Sign in to existing account
            </Link>
          </div>
        </div>
      </InviteShell>
    )
  }

  // Email mismatch check
  if (invite.email && invite.email !== user.email) {
    return (
      <InviteShell>
        <div className="text-center">
          <div className="text-4xl mb-4">✉️</div>
          <h1 className="font-display text-2xl font-bold text-navy-500 mb-2">Wrong account</h1>
          <p className="text-muted-foreground text-sm">
            This invite was sent to a different email address.
          </p>
        </div>
      </InviteShell>
    )
  }

  // Logged in — auto-accept code invite
  const { data: existingMembership } = await serviceClient
    .from('table_memberships')
    .select('id, status')
    .eq('table_id', invite.table_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingMembership?.status === 'active') {
    redirect(`/app/tables/${invite.table_id}`)
  }

  await serviceClient.from('table_memberships').insert({
    table_id: invite.table_id,
    user_id: user.id,
    role: 'member',
    status: 'active',
    joined_at: new Date().toISOString(),
  })

  await serviceClient.from('table_invites').update({
    status: 'claimed',
    claimed_by: user.id,
    claimed_at: new Date().toISOString(),
  }).eq('id', invite.id)

  redirect(`/app/tables/${invite.table_id}?joined=true`)
}

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo variant="dark-bg" size="md" />
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
