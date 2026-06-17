import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatRelativeTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { MessageBoardClient } from '@/components/message-board/MessageBoardClient'
import { firstOf } from '@/lib/utils/firstOf'

interface MessageBoardPageProps {
  params: Promise<{ tableId: string }>
}

export const metadata = { title: 'Message Board' }

const POST_TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  announcement: { label: 'Announcement', color: 'bg-amber-100 text-amber-700', icon: '📣' },
  discussion:   { label: 'Discussion',   color: 'bg-blue-100 text-blue-700',   icon: '💬' },
  resource:     { label: 'Resource',     color: 'bg-purple-100 text-purple-700', icon: '📎' },
  reflection:   { label: 'Reflection',   color: 'bg-green-100 text-green-700', icon: '💭' },
  event_update: { label: 'Event',        color: 'bg-indigo-100 text-indigo-700', icon: '📅' },
  goal_update:  { label: 'Goal',         color: 'bg-teal-100 text-teal-700',   icon: '🎯' },
}

export default async function MessageBoardPage({ params }: MessageBoardPageProps) {
  const { tableId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const [{ data: membership }, { data: table }] = await Promise.all([
    supabase
      .from('table_memberships')
      .select('role')
      .eq('table_id', tableId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
    supabase
      .from('equity_tables')
      .select('name, public_message_board, visibility')
      .eq('id', tableId)
      .maybeSingle(),
  ])

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id, title, body, post_type, visibility, pinned, created_at, updated_at,
      profiles:user_id (id, full_name, username, avatar_url)
    `)
    .eq('table_id', tableId)
    .in('visibility', membership ? ['public', 'table_only', 'admin_only'] : ['public'])
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (!table) notFound()
  const isMember = !!membership
  const isAdmin = ['owner', 'admin'].includes(membership?.role ?? '')

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-navy-500 tracking-tight">Message Board</h1>
          <p className="text-muted-foreground mt-1">{table.name}</p>
        </div>
      </div>

      <MessageBoardClient
        tableId={tableId}
        posts={(posts ?? []).map(p => ({ ...p, profiles: firstOf(p.profiles) }))}
        currentUserId={user.id}
        isMember={isMember}
        isAdmin={isAdmin}
        postTypeLabels={POST_TYPE_LABELS}
      />
    </div>
  )
}
