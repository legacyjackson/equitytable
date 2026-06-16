'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { Logo, LogoMark } from '@/components/brand/Logo'
import { createClient } from '@/lib/supabase/client'
import type { Profile, TableMembership, EquityTable } from '@/types/database'

interface MembershipWithTable extends TableMembership {
  equity_tables: Pick<EquityTable, 'id' | 'name' | 'slug' | 'logo_url' | 'status'> | null
}

interface AppShellProps {
  profile: Profile | null
  memberships: MembershipWithTable[]
  isAdmin: boolean
  children: React.ReactNode
}

const NAV_ITEMS = [
  { href: '/app', label: 'Dashboard', icon: '⊞', exact: true },
  { href: '/app/my-tables', label: 'My Tables', icon: '◎' },
  { href: '/app/notifications', label: 'Notifications', icon: '◒' },
  { href: '/app/badges', label: 'Badges', icon: '◈' },
  { href: '/app/profile', label: 'Profile', icon: '◯' },
]

export function AppShell({ profile, memberships, isAdmin, children }: AppShellProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Detect active table from URL
  const tableMatch = pathname.match(/\/app\/tables\/([^\/]+)/)
  const activeTableId = tableMatch?.[1]
  const activeMembership = memberships.find(m => m.table_id === activeTableId)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        <Logo variant="dark-bg" size="sm" />
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scrollbar-thin">
        <p className="et-section-label text-sidebar-foreground/40 px-3 mb-2">Main</p>
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href) && item.href !== '/app'

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn('sidebar-item', isActive && 'active')}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}

        {/* Tables section */}
        {memberships.length > 0 && (
          <div className="mt-6">
            <p className="et-section-label text-sidebar-foreground/40 px-3 mb-2">My Tables</p>
            {memberships.map((m) => {
              if (!m.equity_tables) return null
              const t = m.equity_tables
              const tableActive = pathname.startsWith(`/app/tables/${m.table_id}`)

              return (
                <Link
                  key={m.table_id}
                  href={`/app/tables/${m.table_id}`}
                  onClick={() => setSidebarOpen(false)}
                  className={cn('sidebar-item', tableActive && 'active')}
                >
                  {t.logo_url ? (
                    <img
                      src={t.logo_url}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-blue-600/30 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                      {t.name.charAt(0)}
                    </span>
                  )}
                  <span className="truncate">{t.name}</span>
                  {m.role === 'owner' && (
                    <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-gold-400 shrink-0">
                      Owner
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )}

        {/* Table-specific sub-nav */}
        {activeTableId && activeMembership && (
          <div className="mt-6">
            <p className="et-section-label text-sidebar-foreground/40 px-3 mb-2">
              {activeMembership.equity_tables?.name || 'Table'}
            </p>
            {[
              { href: `/app/tables/${activeTableId}`, label: 'Dashboard', icon: '⊞', exact: true },
              { href: `/app/tables/${activeTableId}/courses`, label: 'Courses', icon: '📚' },
              { href: `/app/tables/${activeTableId}/events`, label: 'Events', icon: '📅' },
              { href: `/app/tables/${activeTableId}/goals`, label: 'Goals', icon: '🎯' },
              { href: `/app/tables/${activeTableId}/message-board`, label: 'Message board', icon: '💬' },
              { href: `/app/tables/${activeTableId}/recordings`, label: 'Recordings', icon: '📹' },
              ...((['owner', 'admin'].includes(activeMembership.role)) ? [
                { href: `/app/tables/${activeTableId}/members`, label: 'Members', icon: '👥' },
                { href: `/app/tables/${activeTableId}/affiliate`, label: 'Affiliate', icon: '🔗' },
                { href: `/app/tables/${activeTableId}/billing`, label: 'Billing', icon: '💳' },
                { href: `/app/tables/${activeTableId}/settings`, label: 'Settings', icon: '⚙️' },
              ] : []),
            ].map((item) => {
              const isActive = 'exact' in item && item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn('sidebar-item text-sm', isActive && 'active')}
                >
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        )}

        {/* Admin */}
        {isAdmin && (
          <div className="mt-6">
            <p className="et-section-label text-sidebar-foreground/40 px-3 mb-2">Admin</p>
            <Link
              href="/admin"
              className={cn('sidebar-item', pathname.startsWith('/admin') && 'active')}
            >
              <span className="text-base w-5 text-center">⚡</span>
              <span>Super Admin</span>
            </Link>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {(profile?.full_name || profile?.email || '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {profile?.full_name || 'Welcome'}
            </p>
            <p className="text-xs text-sidebar-foreground/50 truncate">
              {profile?.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sidebar-foreground/40 hover:text-white transition-colors shrink-0"
            title="Sign out"
          >
            ↪
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex-col',
          'bg-sidebar border-r border-sidebar-border',
          'transition-transform duration-300 ease-in-out',
          'lg:relative lg:translate-x-0 lg:flex',
          sidebarOpen ? 'flex translate-x-0' : '-translate-x-full hidden lg:flex'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top bar — mobile only */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-border bg-white shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground p-1"
            aria-label="Open menu"
          >
            ☰
          </button>
          <LogoMark size={28} variant="light-bg" />
          <span className="font-display font-semibold text-navy-500 text-sm">
            Equity Table
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
