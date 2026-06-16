'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils/cn'

interface QRCheckinProps {
  eventId: string
  tableId: string
  eventTitle: string
  /** 'host' = show QR code for attendees to scan; 'attendee' = scan or use code */
  mode: 'host' | 'attendee'
  onCheckin?: (userId: string) => void
}

// Lightweight QR code generator using a public API (no deps needed)
function QRCodeImage({ value, size = 200 }: { value: string; size?: number }) {
  const encoded = encodeURIComponent(value)
  return (
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=10&color=0F1F4B&bgcolor=FFFFFF`}
      alt="QR Code"
      width={size}
      height={size}
      className="rounded-xl"
    />
  )
}

export function QRCheckin({ eventId, tableId, eventTitle, mode, onCheckin }: QRCheckinProps) {
  const [checkinUrl, setCheckinUrl] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [checkinCount, setCheckinCount] = useState(0)

  useEffect(() => {
    const appUrl = window.location.origin
    const token = btoa(`${eventId}:${tableId}:${Date.now()}`)
      .replace(/=/g, '')
      .slice(0, 16)
    setCheckinUrl(`${appUrl}/app/tables/${tableId}/events/${eventId}/checkin?token=${token}`)
  }, [eventId, tableId])

  const copyLink = async () => {
    await navigator.clipboard.writeText(checkinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const submitManualCode = async (code: string) => {
    if (!code.trim()) return
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/qr/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, table_id: tableId, token: code.trim() }),
      })
      const data = await res.json()

      if (data.error) {
        setResult({ success: false, message: data.error })
      } else {
        setResult({ success: true, message: `✓ ${data.name || 'Attendee'} checked in!` })
        setCheckinCount(c => c + 1)
        setManualCode('')
        onCheckin?.(data.user_id)
      }
    } catch {
      setResult({ success: false, message: 'Network error. Try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'host') {
    return (
      <div className="space-y-5">
        <div className="et-card p-6 text-center">
          <p className="text-sm font-semibold text-navy-500 mb-1">Check-in QR code</p>
          <p className="text-xs text-muted-foreground mb-4">{eventTitle}</p>

          {checkinUrl ? (
            <div className="flex justify-center mb-4">
              <QRCodeImage value={checkinUrl} size={200} />
            </div>
          ) : (
            <div className="w-48 h-48 bg-muted rounded-xl mx-auto mb-4 animate-pulse" />
          )}

          <p className="text-xs text-muted-foreground mb-3">
            Attendees scan this to check themselves in. Display on screen or print.
          </p>

          <div className="flex gap-2 justify-center">
            <button
              onClick={copyLink}
              className="rounded-lg border border-border px-4 py-2 text-xs font-semibold hover:bg-muted transition-colors"
            >
              {copied ? '✓ Copied!' : 'Copy link'}
            </button>
            <button
              onClick={() => window.print()}
              className="rounded-lg border border-border px-4 py-2 text-xs font-semibold hover:bg-muted transition-colors"
            >
              Print
            </button>
          </div>
        </div>

        {/* Manual check-in fallback */}
        <div className="et-card p-5">
          <h3 className="font-semibold text-navy-500 mb-1 text-sm">Manual check-in</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Enter an attendee's email or check-in token if they can't scan.
          </p>
          <div className="flex gap-2">
            <input
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitManualCode(manualCode)}
              placeholder="Email or check-in token…"
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-blue-600 transition-colors"
            />
            <button
              onClick={() => submitManualCode(manualCode)}
              disabled={loading || !manualCode.trim()}
              className="rounded-lg bg-navy-500 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-600 transition-colors disabled:opacity-60"
            >
              {loading ? '…' : 'Check in'}
            </button>
          </div>

          {result && (
            <div className={cn(
              'mt-3 rounded-lg px-3 py-2 text-sm font-medium',
              result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            )}>
              {result.message}
            </div>
          )}

          {checkinCount > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {checkinCount} check-in{checkinCount !== 1 ? 's' : ''} this session
            </p>
          )}
        </div>
      </div>
    )
  }

  // Attendee mode — show their personal check-in link/button
  return (
    <div className="et-card p-5 text-center">
      <div className="text-2xl mb-2">📍</div>
      <h3 className="font-semibold text-navy-500 mb-1">Check in to this event</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Scan the QR code displayed at the event, or click below if you're already there.
      </p>
      <button
        onClick={() => submitManualCode(eventId)}
        disabled={loading}
        className="rounded-xl bg-navy-500 px-6 py-3 text-sm font-bold text-white hover:bg-navy-600 transition-colors disabled:opacity-60"
      >
        {loading ? 'Checking in…' : 'Check me in'}
      </button>
      {result && (
        <div className={cn(
          'mt-3 rounded-lg px-3 py-2 text-sm font-medium',
          result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        )}>
          {result.message}
        </div>
      )}
    </div>
  )
}
