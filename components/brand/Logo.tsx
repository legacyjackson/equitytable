'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

/**
 * Logo usage rules (enforced by variant prop):
 *
 *   variant="light-bg"  → white-background logo (logo-light.png)
 *                         Use on: white, light gray, cream backgrounds
 *                         Shows: navy "e", blue ring, gold accent, navy figures
 *
 *   variant="dark-bg"   → navy-background logo (logo-dark.png)
 *                         Use on: navy (#0F1F4B), dark gradient backgrounds
 *                         Shows: white "e", white figures on navy circle
 *
 * Favicon = logo-light.png (white background mark)
 */

type LogoVariant = 'dark-bg' | 'light-bg'
type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface LogoProps {
  variant: LogoVariant   // required — no default, must be deliberate
  size?: LogoSize
  showWordmark?: boolean
  className?: string
}

const sizeMap: Record<LogoSize, { mark: number; wordmark: string; sub: string }> = {
  xs: { mark: 24, wordmark: 'text-sm',  sub: 'text-[9px]'  },
  sm: { mark: 32, wordmark: 'text-base',sub: 'text-[10px]' },
  md: { mark: 40, wordmark: 'text-xl',  sub: 'text-[10px]' },
  lg: { mark: 52, wordmark: 'text-2xl', sub: 'text-xs'     },
  xl: { mark: 68, wordmark: 'text-3xl', sub: 'text-sm'     },
}

export function Logo({
  variant,
  size = 'md',
  showWordmark = true,
  className,
}: LogoProps) {
  const { mark, wordmark, sub } = sizeMap[size]

  return (
    <div className={cn('flex items-center gap-2.5 shrink-0', className)}>
      <LogoMark variant={variant} size={mark} />
      {showWordmark && (
        <div className="leading-none">
          <div
            className={cn(
              'font-display font-bold tracking-tight leading-none',
              wordmark,
              variant === 'dark-bg' ? 'text-white' : 'text-navy-500'
            )}
          >
            Equity Table
          </div>
          <div
            className={cn(
              'font-semibold uppercase tracking-[0.18em] mt-1',
              sub,
              variant === 'dark-bg' ? 'text-blue-300' : 'text-blue-600'
            )}
          >
            Financial Community
          </div>
        </div>
      )}
    </div>
  )
}

interface LogoMarkProps {
  variant: LogoVariant
  size?: number
  className?: string
}

/**
 * Icon-only mark. Used in:
 *  - Mobile sidebar header (dark-bg)
 *  - Favicon (light-bg) — referenced in app/layout.tsx as /logo-light.png
 *  - Table avatar fallback (light-bg or dark-bg depending on card background)
 */
export function LogoMark({ variant, size = 40, className }: LogoMarkProps) {
  const src = variant === 'dark-bg' ? '/logo-dark.png' : '/logo-light.png'

  return (
    <div
      className={cn('relative shrink-0 rounded-full overflow-hidden', className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt="Equity Table logo"
        width={size}
        height={size}
        className="object-cover"
        priority
      />
    </div>
  )
}

export default Logo
