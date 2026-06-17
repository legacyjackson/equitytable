'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UserActionsCellProps {
  userId: string
  currentLicenseTier: string
  currentTables: any[]
  allTables: any[]
  isSuper: boolean
}

export function UserActionsCell({
  userId,
  currentLicenseTier,
  currentTables,
  allTables,
  isSuper,
}: UserActionsCellProps) {
  const [licenseTier, setLicenseTier] = useState(currentLicenseTier)
  const [loading, setLoading] = useState(false)
  const [selectedTable, setSelectedTable] = useState('')
  const supabase = createClient()

  const maxTables = isSuper ? 999 : 3
  const canAddTable = currentTables.length < maxTables

  const tierLabels: Record<string, string> = {
    'free': 'Free',
    'seat': '$4.99/mo (Seat)',
    'owner': '$49.99/mo (Owner)',
  }

  const handleTierChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTier = e.target.value
    setLicenseTier(newTier)
    setLoading(true)

    await supabase
      .from('profiles')
      .update({ license_tier: newTier, updated_at: new Date().toISOString() })
      .eq('id', userId)

    setLoading(false)
  }

  const handleAddTable = async () => {
    if (!selectedTable || !canAddTable) return

    setLoading(true)
    const { data: existing } = await supabase
      .from('table_memberships')
      .select('id')
      .eq('user_id', userId)
      .eq('table_id', selectedTable)
      .single()

    if (!existing) {
      await supabase.from('table_memberships').insert({
        user_id: userId,
        table_id: selectedTable,
        role: 'member',
        status: 'active',
      })
      setSelectedTable('')
      window.location.reload()
    }
    setLoading(false)
  }

  const handleRemoveTable = async (memberId: string) => {
    setLoading(true)
    await supabase.from('table_memberships').delete().eq('id', memberId)
    setLoading(false)
    window.location.reload()
  }

  return (
    <div className="space-y-2">
      {/* License Tier Dropdown */}
      <div>
        <select
          value={licenseTier}
          onChange={handleTierChange}
          disabled={loading}
          className="w-full text-xs px-2 py-1 rounded border border-border focus:border-blue-600 outline-none"
        >
          <option value="free">Free</option>
          <option value="seat">$4.99/mo (Seat)</option>
          <option value="owner">$49.99/mo (Owner)</option>
        </select>
      </div>

      {/* Table Assignment */}
      <div className="space-y-1">
        {canAddTable && (
          <div className="flex gap-1">
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              disabled={loading}
              className="flex-1 text-xs px-2 py-1 rounded border border-border focus:border-blue-600 outline-none"
            >
              <option value="">+ Add table</option>
              {allTables
                .filter(t => !currentTables.some(m => m.table_id === t.id))
                .map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
            <button
              onClick={handleAddTable}
              disabled={loading || !selectedTable}
              className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Add
            </button>
          </div>
        )}

        {currentTables.length > 0 ? (
          <div className="space-y-1">
            {currentTables.map(m => {
              const table = allTables.find(t => t.id === m.table_id)
              return (
                <div key={m.id} className="text-xs flex items-center justify-between bg-gray-50 px-2 py-1 rounded border border-gray-200">
                  <span className="font-medium">{table?.name || 'Unknown'}</span>
                  <button
                    onClick={() => handleRemoveTable(m.id)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700 disabled:opacity-60"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic">No tables</div>
        )}

        {!canAddTable && (
          <div className="text-[11px] text-orange-600 font-semibold">
            Max {maxTables} tables
          </div>
        )}
      </div>
    </div>
  )
}
