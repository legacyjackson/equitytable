import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { inviteMemberSchema } from '@/lib/validations'

// POST /api/tables/[tableId]/invite
export async function POST(request: Request, { params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await params

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify inviter is admin/owner
    const { data: membership } = await supabase
      .from('table_memberships')
      .select('role')
      .eq('table_id', tableId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'You do not have permission to invite members.' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = inviteMemberSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { email, role } = parsed.data

    // Check for existing invitation
    const serviceClient = await createServiceClient()
    const { data: existing } = await serviceClient
      .from('table_invitations')
      .select('id')
      .eq('table_id', tableId)
      .eq('invited_email', email.toLowerCase())
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'An invitation for this email is already pending.' }, { status: 409 })
    }

    // Check if already a member
    const { data: alreadyMember } = await serviceClient
      .from('table_memberships')
      .select('id')
      .eq('table_id', tableId)
      .eq('status', 'active')
      .eq('profiles.email', email.toLowerCase())
      .maybeSingle()

    // Create invitation
    const { data: invitation, error } = await serviceClient
      .from('table_invitations')
      .insert({
        table_id: tableId,
        invited_email: email.toLowerCase(),
        invited_by: user.id,
        role,
        status: 'pending',
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // TODO Phase 2: Send invitation email via Resend
    // For now, log the token for testing
    console.log(`Invitation token for ${email}: ${invitation.token}`)

    // Audit log
    await serviceClient.from('audit_logs').insert({
      actor_user_id: user.id,
      action: 'table.member.invited',
      target_type: 'table_invitation',
      target_id: invitation.id,
      metadata: { table_id: tableId, invited_email: email, role },
    })

    return NextResponse.json({ success: true, invitation_id: invitation.id })
  } catch (error) {
    console.error('Invite error:', error)
    return NextResponse.json({ error: 'Failed to send invitation.' }, { status: 500 })
  }
}
