'use server'

import { createServiceClient } from '@/lib/supabase/server'

export async function assignLicense(formData: FormData) {
  const userId = formData.get('userId') as string
  const tableId = formData.get('tableId') as string
  const role = (formData.get('role') as string) || 'member'

  if (!userId || !tableId) return { error: 'User and table required' }

  const svc = await createServiceClient()

  const { data: user } = await svc.from('profiles').select('id').eq('id', userId).single()
  if (!user) return { error: 'User not found' }

  const { data: table } = await svc.from('equity_tables').select('id').eq('id', tableId).single()
  if (!table) return { error: 'Table not found' }

  const { data: existing } = await svc.from('table_memberships').select('id').eq('user_id', userId).eq('table_id', tableId).single()
  if (existing) return { error: 'User already a member' }

  const { error: err } = await svc.from('table_memberships').insert({
    user_id: userId,
    table_id: tableId,
    role: role as 'owner' | 'admin' | 'facilitator' | 'member',
    status: 'active',
  })

  if (err) return { error: err.message }
  return { success: true }
}

export async function revokeLicense(memberId: string) {
  if (!memberId) return { error: 'Membership ID required' }
  const svc = await createServiceClient()
  const { error: err } = await svc.from('table_memberships').delete().eq('id', memberId)
  if (err) return { error: err.message }
  return { success: true }
}
