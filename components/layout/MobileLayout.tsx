'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  // Don't show mobile nav on auth pages
  if (pathname.includes('/sign-') || pathname.includes('/invite')) {
    return <>{children}</>
  }

  const isInApp = pathname.startsWith('/app')

  if (!isInApp) {
    return <>{children}</>
  }

  // Mobile nav items
  const navItems = [
    {
      icon: '🏠',
      label: 'Home',
      href: '/app',
      active: pathname === '/app',
    },
    {
      icon: '📚',
      label: 'Learn',
      href: '/app/courses',
      active: pathname.startsWith('/app/courses') || /^\/app\/tables\/[^/]+\/courses/.test(pathname),
    },
    {
      icon: '🏛️',
      label: 'Tables',
      href: '/app/tables',
      active:
        pathname.startsWith('/app/tables') &&
        !pathname.includes('/analytics') &&
        !/^\/app\/tables\/[^/]+\/courses/.test(pathname),
    },
    {
      icon: '📊',
      label: 'Analytics',
      href: '/app/analytics',
      active: pathname.startsWith('/app/analytics'),
    },
    {
      icon: '👤',
      label: 'Profile',
      href: '/app/profile',
      active: pathname.startsWith('/app/profile'),
    },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50">
        <div className="flex items-center justify-around h-16">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                item.active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-muted-foreground hover:bg-gray-50'
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
