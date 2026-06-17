'use server'

import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST /api/audio-jobs
// Creates an audio job for a lesson or content
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, lesson_id, table_id, provider = 'kokoro', voice = 'default' } = body

    if (!content || !lesson_id) {
      return NextResponse.json({ error: 'Missing content or lesson_id' }, { status: 400 })
    }

    // Check user has access to this lesson's table
    const { data: lesson } = await supabase
      .from('lessons')
      .select('course_id')
      .eq('id', lesson_id)
      .single()

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Create audio job record
    const svc = await createServiceClient()
    const { data: audioJob, error: jobError } = await svc
      .from('audio_jobs')
      .insert({
        lesson_id,
        content_text: content,
        provider_type: provider as 'kokoro' | 'piper' | 'xtts' | 'human_upload' | 'other',
        voice: voice,
        status: 'pending',
        created_by: user.id,
      })
      .select()
      .single()

    if (jobError || !audioJob) {
      return NextResponse.json({ error: 'Failed to create audio job' }, { status: 500 })
    }

    // TODO: Queue job for async processing (worker/cron job)
    // For now, just return the job record with pending status

    return NextResponse.json({
      job_id: audioJob.id,
      status: audioJob.status,
      created_at: audioJob.created_at,
    })
  } catch (error) {
    console.error('Audio job error:', error)
    return NextResponse.json({ error: 'Failed to create audio job' }, { status: 500 })
  }
}

// GET /api/audio-jobs/:jobId
// Get status of an audio job
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const jobId = url.pathname.split('/').pop()

    if (!jobId) {
      return NextResponse.json({ error: 'Missing job ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: job } = await supabase
      .from('audio_jobs')
      .select('id, status, audio_url, created_at, updated_at')
      .eq('id', jobId)
      .single()

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({
      job_id: job.id,
      status: job.status,
      audio_url: job.audio_url,
      created_at: job.created_at,
      updated_at: job.updated_at,
    })
  } catch (error) {
    console.error('Audio job fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch audio job' }, { status: 500 })
  }
}

// DELETE /api/audio-jobs/:jobId
// Cancel or delete an audio job
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const jobId = url.pathname.split('/').pop()

    if (!jobId) {
      return NextResponse.json({ error: 'Missing job ID' }, { status: 400 })
    }

    const svc = await createServiceClient()

    // Only allow deletion if user created it or is admin
    const { data: job } = await svc
      .from('audio_jobs')
      .select('created_by')
      .eq('id', jobId)
      .single()

    if (!job || (job.created_by !== user.id && !(await isAdmin(user.id, svc)))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await svc.from('audio_jobs').delete().eq('id', jobId)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Audio job delete error:', error)
    return NextResponse.json({ error: 'Failed to delete audio job' }, { status: 500 })
  }
}

// Helper: Check if user is admin
async function isAdmin(userId: string, supabase: Awaited<ReturnType<typeof createServiceClient>>) {
  const { data } = await supabase
    .from('platform_roles')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['super_admin', 'content_admin'])

  return (data || []).length > 0
}
