'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

interface Post {
  id: string
  title: string | null
  body: string
  post_type: string
  visibility: string
  pinned: boolean
  created_at: string
  profiles: { id: string; full_name: string | null; username: string | null; avatar_url: string | null } | null
}

interface MessageBoardClientProps {
  tableId: string
  posts: Post[]
  currentUserId: string
  isMember: boolean
  isAdmin: boolean
  postTypeLabels: Record<string, { label: string; color: string; icon: string }>
}

export function MessageBoardClient({
  tableId,
  posts: initialPosts,
  currentUserId,
  isMember,
  isAdmin,
  postTypeLabels,
}: MessageBoardClientProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [composing, setComposing] = useState(false)
  const [postBody, setPostBody] = useState('')
  const [postTitle, setPostTitle] = useState('')
  const [postType, setPostType] = useState('discussion')
  const [submitting, setSubmitting] = useState(false)
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, any[]>>({})
  const [commentBody, setCommentBody] = useState<Record<string, string>>({})

  const submitPost = async () => {
    if (!postBody.trim()) return
    setSubmitting(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('posts')
        .insert({
          table_id: tableId,
          user_id: currentUserId,
          title: postTitle.trim() || null,
          body: postBody.trim(),
          post_type: postType,
          visibility: 'table_only',
          pinned: false,
        })
        .select(`
          id, title, body, post_type, visibility, pinned, created_at, updated_at,
          profiles:user_id (id, full_name, username, avatar_url)
        `)
        .single()

      if (!error && data) {
        setPosts(prev => [data as Post, ...prev])
        setPostBody('')
        setPostTitle('')
        setPostType('discussion')
        setComposing(false)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const loadComments = async (postId: string) => {
    if (comments[postId]) return // already loaded
    const supabase = createClient()
    const { data } = await supabase
      .from('comments')
      .select('id, body, created_at, profiles:user_id (full_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at')
    setComments(prev => ({ ...prev, [postId]: data ?? [] }))
  }

  const togglePost = async (postId: string) => {
    const next = expandedPost === postId ? null : postId
    setExpandedPost(next)
    if (next) await loadComments(next)
  }

  const submitComment = async (postId: string) => {
    const body = commentBody[postId]?.trim()
    if (!body) return

    const supabase = createClient()
    const { data } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: currentUserId, body })
      .select('id, body, created_at, profiles:user_id (full_name, avatar_url)')
      .single()

    if (data) {
      setComments(prev => ({ ...prev, [postId]: [...(prev[postId] ?? []), data] }))
      setCommentBody(prev => ({ ...prev, [postId]: '' }))
    }
  }

  const Avatar = ({ profile }: { profile: Post['profiles'] }) => (
    <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-sm font-bold text-navy-500 shrink-0 overflow-hidden border border-border">
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
      ) : (
        (profile?.full_name ?? '?').charAt(0).toUpperCase()
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Compose */}
      {isMember && !composing && (
        <button
          onClick={() => setComposing(true)}
          className="w-full rounded-xl border border-dashed border-border bg-white px-4 py-3.5 text-left text-sm text-muted-foreground hover:border-navy-300 hover:text-navy-500 transition-colors"
        >
          Share something with your table…
        </button>
      )}

      {composing && (
        <div className="et-card p-5 space-y-3">
          <div className="flex items-center gap-3">
            <select
              value={postType}
              onChange={e => setPostType(e.target.value)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold outline-none focus:border-blue-600"
            >
              {Object.entries(postTypeLabels).map(([v, { label, icon }]) => (
                isAdmin || !['announcement'].includes(v) ? (
                  <option key={v} value={v}>{icon} {label}</option>
                ) : null
              ))}
            </select>
          </div>
          <input
            value={postTitle}
            onChange={e => setPostTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full rounded-lg border border-border px-3.5 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
          />
          <textarea
            value={postBody}
            onChange={e => setPostBody(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 resize-none"
          />
          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={() => { setComposing(false); setPostBody(''); setPostTitle('') }}
              className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5"
            >
              Cancel
            </button>
            <button
              onClick={submitPost}
              disabled={!postBody.trim() || submitting}
              className="rounded-lg bg-navy-500 px-5 py-2 text-sm font-semibold text-white hover:bg-navy-600 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="et-card p-14 text-center">
          <div className="text-4xl mb-3">💬</div>
          <p className="font-display font-semibold text-navy-500 mb-1">The board is quiet.</p>
          <p className="text-sm text-muted-foreground">Be the first to share something with your table.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const typeInfo = postTypeLabels[post.post_type] ?? postTypeLabels.discussion
            const isOpen = expandedPost === post.id
            const postComments = comments[post.id] ?? []

            return (
              <div key={post.id} className={cn('et-card overflow-hidden', post.pinned && 'border-gold-300 bg-gold-50/30')}>
                <div className="p-5">
                  {/* Post header */}
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar profile={post.profiles} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-navy-500">
                          {post.profiles?.full_name ?? 'Member'}
                        </span>
                        <span className={cn('badge-pill text-[10px]', typeInfo.color)}>
                          {typeInfo.icon} {typeInfo.label}
                        </span>
                        {post.pinned && (
                          <span className="badge-pill text-[10px] bg-gold-100 text-gold-700">📌 Pinned</span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto shrink-0">
                          {formatRelativeTime(post.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {post.title && (
                    <h3 className="font-semibold text-navy-500 mb-1.5">{post.title}</h3>
                  )}
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{post.body}</p>

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-4">
                    <button
                      onClick={() => togglePost(post.id)}
                      className="text-xs font-semibold text-muted-foreground hover:text-navy-500 transition-colors"
                    >
                      {isOpen ? '▲ Hide replies' : `💬 ${isOpen ? '' : 'Reply'}`}
                    </button>
                  </div>
                </div>

                {/* Comments */}
                {isOpen && (
                  <div className="border-t border-border bg-muted/20 px-5 py-4 space-y-3">
                    {postComments.map((c: any) => (
                      <div key={c.id} className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-navy-100 flex items-center justify-center text-xs font-bold text-navy-500 shrink-0">
                          {(c.profiles?.full_name ?? '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-semibold text-navy-500 mr-2">
                            {c.profiles?.full_name ?? 'Member'}
                          </span>
                          <span className="text-xs text-muted-foreground">{formatRelativeTime(c.created_at)}</span>
                          <p className="text-sm text-foreground mt-0.5">{c.body}</p>
                        </div>
                      </div>
                    ))}

                    {isMember && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          value={commentBody[post.id] ?? ''}
                          onChange={e => setCommentBody(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitComment(post.id)}
                          placeholder="Write a reply…"
                          className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                        />
                        <button
                          onClick={() => submitComment(post.id)}
                          disabled={!commentBody[post.id]?.trim()}
                          className="rounded-lg bg-navy-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-600 disabled:opacity-40 transition-colors"
                        >
                          Send
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
