import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/upload/sign
// Generates a signed upload URL for Supabase Storage.
// The client uploads directly to Supabase — the file never touches our server.
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { bucket, path, contentType } = await request.json()

    // Validate allowed buckets
    const ALLOWED_BUCKETS = ['avatars', 'banners', 'recordings', 'lesson-audio', 'files']
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
    }

    // Ensure path includes user ID to prevent overwrites
    const safePath = path.startsWith(`${user.id}/`) ? path : `${user.id}/${path}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(safePath)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: safePath,
    })
  } catch (error) {
    console.error('Sign upload error:', error)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}
