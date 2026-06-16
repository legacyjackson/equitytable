'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import { formatDuration } from '@/lib/utils/format'

interface VideoPlayerProps {
  videoUrl: string
  thumbnailUrl?: string | null
  title?: string
  muxAssetId?: string | null        // When Mux is enabled, use this
  storagePath?: string | null       // Supabase Storage path (Phase 1/2 default)
  duration?: number | null
  className?: string
  onProgress?: (seconds: number) => void
}

// ── Mux configuration ─────────────────────────────────────────
// Phase 3+: When feature flag 'mux-video' is enabled, recordings
// are processed through Mux for adaptive bitrate streaming and
// automatic thumbnail generation.
//
// MVP path: videoUrl from Supabase Storage → native HTML5 <video>
// Phase 3+ path: muxAssetId → Mux stream URL via mux.com/vod/...
//
// This component automatically picks the right player.
// ─────────────────────────────────────────────────────────────

function getMuxStreamUrl(assetId: string): string {
  return `https://stream.mux.com/${assetId}.m3u8`
}

function getMuxThumbnailUrl(assetId: string, time = 0): string {
  return `https://image.mux.com/${assetId}/thumbnail.jpg?time=${time}`
}

export function VideoPlayer({
  videoUrl,
  thumbnailUrl,
  title,
  muxAssetId,
  storagePath,
  duration,
  className,
  onProgress,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(duration || 0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [buffering, setBuffering] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Use Mux stream if available, else direct URL
  const src = muxAssetId ? getMuxStreamUrl(muxAssetId) : videoUrl
  const thumb = thumbnailUrl
    || (muxAssetId ? getMuxThumbnailUrl(muxAssetId) : null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      onProgress?.(video.currentTime)
    }
    const onDurationChange = () => setVideoDuration(video.duration)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onWaiting = () => setBuffering(true)
    const onPlaying = () => setBuffering(false)
    const onError = () => setError('Could not load video. The file may have been moved or deleted.')

    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('durationchange', onDurationChange)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('playing', onPlaying)
    video.addEventListener('error', onError)

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('durationchange', onDurationChange)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('error', onError)
    }
  }, [onProgress])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (playing) video.pause()
    else video.play()
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video || !videoDuration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    video.currentTime = pct * videoDuration
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !muted
    setMuted(!muted)
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }

  const pct = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0

  if (error) {
    return (
      <div className={cn('aspect-video bg-navy-100 rounded-xl flex items-center justify-center', className)}>
        <div className="text-center p-6">
          <div className="text-3xl mb-2">📹</div>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative group bg-black rounded-xl overflow-hidden', className)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={thumb || undefined}
        className="w-full aspect-video object-contain"
        preload="metadata"
        playsInline
      />

      {/* Buffering overlay */}
      {buffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-10 h-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        </div>
      )}

      {/* Center play button (shows when paused, hides on hover while playing) */}
      {!playing && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center group"
        >
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
            <span className="text-navy-500 text-2xl pl-1">▶</span>
          </div>
        </button>
      )}

      {/* Controls bar — always visible */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8',
        'transition-opacity',
        playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
      )}>
        {/* Progress bar */}
        <div
          className="w-full h-1.5 bg-white/30 rounded-full cursor-pointer mb-3 hover:h-2.5 transition-all"
          onClick={seek}
        >
          <div
            className="h-full bg-white rounded-full relative"
            style={{ width: `${pct}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow" />
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center gap-3">
          <button onClick={togglePlay} className="text-white hover:text-white/80 transition-colors">
            {playing ? '⏸' : '▶'}
          </button>
          <button onClick={toggleMute} className="text-white hover:text-white/80 transition-colors text-sm">
            {muted ? '🔇' : '🔊'}
          </button>
          <div className="flex items-center gap-1 text-white/80 text-xs font-mono">
            <span>{formatDuration(currentTime)}</span>
            <span>/</span>
            <span>{formatDuration(videoDuration)}</span>
          </div>
          {title && (
            <span className="flex-1 text-white/70 text-xs truncate">{title}</span>
          )}
          <button onClick={toggleFullscreen} className="ml-auto text-white hover:text-white/80 transition-colors text-sm">
            {fullscreen ? '⊡' : '⛶'}
          </button>
        </div>
      </div>

      {/* Mux badge (Phase 3+) */}
      {muxAssetId && (
        <div className="absolute top-2 right-2 badge-pill bg-black/60 text-white/70 text-[9px]">
          Mux
        </div>
      )}
    </div>
  )
}

// ── Mux readiness helper ──────────────────────────────────────
// Called server-side to check if a recording should use Mux
export function shouldUseMux(muxAssetId: string | null | undefined): boolean {
  return !!muxAssetId && process.env.NEXT_PUBLIC_MUX_ENABLED === 'true'
}
