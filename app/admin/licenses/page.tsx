'use client'

import { useState } from 'react'
import Link from 'next/link'
import { assignLicense } from '@/app/actions/assign-license'
import { cn } from '@/lib/utils/cn'

export default function LicenseAssignmentPage() {
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedTable, setSelectedTable] = useState('')
  const [selectedRole, setSelectedRole] = useState('member')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData()
    formData.append('userId', selectedUser)
    formData.append('tableId', selectedTable)
    formData.append('role', selectedRole)

    const result = await assignLicense(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setSelectedUser('')
      setSelectedTable('')
      setSelectedRole('member')
      setTimeout(() => setSuccess(false), 3000)
    }

    setLoading(false)
  }

  const inputClass = (hasError?: boolean) => cn(
    'w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors',
    'focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10',
    hasError ? 'border-red-300' : 'border-border'
  )

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-6">
        <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Users
        </Link>
        <h1 className="text-2xl font-display font-bold text-navy-500 mt-2">Assign licenses</h1>
        <p className="text-muted-foreground text-sm mt-1">Manually add users to equity tables</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">License assigned!</div>
      )}

      <form onSubmit={handleAssign} className="et-card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">User ID <span className="text-red-500">*</span></label>
          <input
            type="text"
            placeholder="Paste user UUID here"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className={inputClass()}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Table ID <span className="text-red-500">*</span></label>
          <input
            type="text"
            placeholder="Paste table UUID here"
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className={inputClass()}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Role</label>
          <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className={inputClass()}>
            <option value="member">Member</option>
            <option value="facilitator">Facilitator</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !selectedUser || !selectedTable}
          className="w-full rounded-lg bg-navy-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-600 transition-colors disabled:opacity-60"
        >
          {loading ? 'Assigning…' : 'Assign license'}
        </button>
      </form>
    </div>
  )
}
