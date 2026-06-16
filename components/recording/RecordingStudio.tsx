'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils/cn'
import { formatDuration } from '@/lib/utils/format'

interface RecordingStudioProps {
  tableId: string
  eventId: string
  eventTitle: string
  onUploadComplete?: (recordingId: string) => void
}

type RecordingState = 'idle' | 'requesting' | 'preview' | 'recording' | 'paused' | 'review' | 'uploading' | 'done'

interface DeviceInfo {
  deviceId: string
  label: string
}

export function RecordingStudio({ tableId, eventId, eventTitle, onUploadComplete }: RecordingStudioProps) {
  const [state, setState] = useState<RecordingState>('idle')
  const [cameras, setCameras] = useState<DeviceInfo[]>([])
  const [mics, setMics] = useState<DeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [selectedMic, setSelectedMic] = useState<string>('')
  const [consentGiven, setConsentGiven] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)
  const [title, setTitle] = useState(eventTitle)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [recordingId, setRecordingId] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const playbackRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Enumerate devices
  const loadDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = devices.filter(d => d.kind === 'videoinput').map(d => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 6)}` }))
      const audioInputs = devices.filter(d => d.kind === 'audioinput').map(d => ({ deviceId: d.deviceId, label: d.label || `Mic ${d.deviceId.slice(0, 6)}` }))
      setCameras(videoInputs)
      setMics(audioInputs)
      if (videoInputs[0]) setSelectedCamera(videoInputs[0].deviceId)
      if (audioInputs[0]) setSelectedMic(audioInputs[0].deviceId)
    } catch (e) {
      setError('Could not load devices. Please check browser permissions.')
    }
  }, [])

  // Start preview stream
  const startPreview = useCallback(async () => {
    setState('requesting')
    setError(null)
    try {
      const constraints: MediaStreamConstraints = {
        video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
        audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.muted = true
        await videoRef.current.play()
      }
      await loadDevices() // Re-enumerate with labels now available
      setState('preview')
    } catch (e: any) {
      setError(e.name === 'NotAllowedError'
        ? 'Camera/mic access denied. Please allow access in your browser settings.'
        : `Could not start camera: ${e.message}`)
      setState('idle')
    }
  }, [selectedCamera, selectedMic, loadDevices])

  // Start actual recording
  const startRecording = useCallback(() => {
    if (!streamRef.current || !consentGiven) return
    chunksRef.current = []
    setElapsed(0)

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : 'video/mp4'

    const recorder = new MediaRecorder(streamRef.current, { mimeType, videoBitsPerSecond: 2_500_000 })
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType })
      setRecordingBlob(blob)
      if (playbackRef.current) {
        playbackRef.current.src = URL.createObjectURL(blob)
        playbackRef.current.controls = true
      }
      setState('review')
    }

    recorder.start(1000) // collect chunks every second
    mediaRecorderRef.current = recorder
    setState('recording')

    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
  }, [consentGiven])

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause()
      if (timerRef.current) clearInterval(timerRef.current)
      setState('paused')
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume()
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
      setState('recording')
    }
  }

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  const discardRecording = () => {
    setRecordingBlob(null)
    setElapsed(0)
    chunksRef.current = []
    setState('idle')
  }

  const uploadRecording = async () => {
    if (!recordingBlob) return
    setState('uploading')
    setError(null)

    try {
      // 1. Get signed upload URL
      const ext = recordingBlob.type.includes('mp4') ? 'mp4' : 'webm'
      const filename = `${tableId}/${eventId}/${Date.now()}.${ext}`

      const signRes = await fetch('/api/upload/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filename, bucket: 'recordings', contentType: recordingBlob.type }),
      })
      const { signedUrl, publicUrl, error: signError } = await signRes.json()
      if (signError) throw new Error(signError)

      // 2. Upload to Supabase Storage
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100))
      })

      await new Promise<void>((resolve, reject) => {
        xhr.open('PUT', signedUrl)
        xhr.setRequestHeader('Content-Type', recordingBlob.type)
        xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`))
        xhr.onerror = () => reject(new Error('Upload network error'))
        xhr.send(recordingBlob)
      })

      // 3. Create recording record in DB
      const dbRes = await fetch(`/api/tables/${tableId}/recordings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          title,
          video_url: publicUrl,
          storage_path: filename,
          duration_seconds: elapsed,
          storage_provider: 'supabase',
        }),
      })
      const { id, error: dbError } = await dbRes.json()
      if (dbError) throw new Error(dbError)

      setRecordingId(id)
      setState('done')
      onUploadComplete?.(id)
    } catch (e: any) {
      setError(e.message || 'Upload failed')
      setState('review')
    }
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // ── DONE ──────────────────────────────────────────────────────
  if (state === 'done') {
    return (
      <div className="et-card p-10 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="font-display text-2xl font-bold text-navy-500 mb-2">Recording saved</h2>
        <p className="text-muted-foreground mb-6">Your recording is now in the table's recording library.</p>
        <button onClick={discardRecording} className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
          Record another
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* IDLE: Start button */}
      {state === 'idle' && (
        <div className="et-card p-8 text-center">
          <div className="text-4xl mb-4">🎥</div>
          <h2 className="font-display text-xl font-bold text-navy-500 mb-2">Recording Studio</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Record your Equity Event directly in the browser. Your camera and microphone will be used.
          </p>
          <button
            onClick={startPreview}
            className="rounded-xl bg-navy-500 px-8 py-3.5 font-semibold text-white hover:bg-navy-600 transition-colors"
          >
            Set up camera & mic
          </button>
        </div>
      )}

      {/* REQUESTING */}
      {state === 'requesting' && (
        <div className="et-card p-10 text-center">
          <div className="w-10 h-10 border-3 border-navy-200 border-t-navy-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Requesting camera and microphone access…</p>
        </div>
      )}

      {/* PREVIEW */}
      {(state === 'preview' || state === 'recording' || state === 'paused') && (
        <div className="space-y-5">
          {/* Device selectors */}
          {state === 'preview' && (
            <div className="et-card p-5 grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Camera</label>
                <select
                  value={selectedCamera}
                  onChange={e => { setSelectedCamera(e.target.value); setState('idle') }}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-blue-600 transition-colors"
                >
                  {cameras.map(c => <option key={c.deviceId} value={c.deviceId}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Microphone</label>
                <select
                  value={selectedMic}
                  onChange={e => { setSelectedMic(e.target.value); setState('idle') }}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-blue-600 transition-colors"
                >
                  {mics.map(m => <option key={m.deviceId} value={m.deviceId}>{m.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Video preview */}
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

            {/* Recording indicator */}
            {state === 'recording' && (
              <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/60 backdrop-blur px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white text-sm font-mono font-bold">{formatDuration(elapsed)}</span>
              </div>
            )}
            {state === 'paused' && (
              <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/60 backdrop-blur px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-white text-sm font-bold">Paused — {formatDuration(elapsed)}</span>
              </div>
            )}
          </div>

          {/* Consent */}
          {state === 'preview' && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={e => setConsentGiven(e.target.checked)}
                className="mt-0.5 rounded border-border"
              />
              <span className="text-sm text-muted-foreground leading-relaxed">
                I confirm that all event participants have been notified this session may be recorded, consistent with Equity Table's{' '}
                <a href="/legal/recording-consent" target="_blank" className="text-blue-600 hover:underline">recording consent policy</a>.
              </span>
            </label>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            {state === 'preview' && (
              <button
                onClick={startRecording}
                disabled={!consentGiven}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-8 py-3.5 font-bold text-white transition-colors',
                  consentGiven ? 'bg-red-600 hover:bg-red-700' : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
              >
                <span className="w-3 h-3 rounded-full bg-white" />
                Start recording
              </button>
            )}
            {state === 'recording' && (
              <>
                <button onClick={pauseRecording} className="rounded-xl border border-border px-5 py-3 text-sm font-semibold hover:bg-muted transition-colors">
                  ⏸ Pause
                </button>
                <button onClick={stopRecording} className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors">
                  ⏹ Stop & review
                </button>
              </>
            )}
            {state === 'paused' && (
              <>
                <button onClick={resumeRecording} className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 transition-colors">
                  ▶ Resume
                </button>
                <button onClick={stopRecording} className="rounded-xl border border-border px-5 py-3 text-sm font-semibold hover:bg-muted transition-colors">
                  ⏹ Stop & review
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* REVIEW */}
      {state === 'review' && recordingBlob && (
        <div className="space-y-5">
          <div className="et-card p-5">
            <h3 className="font-display font-semibold text-navy-500 mb-3">Review your recording</h3>
            <video ref={playbackRef} className="w-full rounded-xl aspect-video bg-black" controls />
            <p className="text-sm text-muted-foreground mt-2">
              Duration: {formatDuration(elapsed)} · Size: {(recordingBlob.size / 1_048_576).toFixed(1)} MB
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Recording title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={discardRecording} className="rounded-xl border border-border px-5 py-3 text-sm font-semibold hover:bg-muted transition-colors">
              Discard & redo
            </button>
            <button onClick={uploadRecording} className="flex-1 rounded-xl bg-navy-500 py-3 text-sm font-bold text-white hover:bg-navy-600 transition-colors">
              Save recording to table
            </button>
          </div>
        </div>
      )}

      {/* UPLOADING */}
      {state === 'uploading' && (
        <div className="et-card p-10 text-center">
          <div className="w-full bg-muted rounded-full h-2.5 mb-4 overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm font-semibold text-navy-500 mb-1">Uploading… {uploadProgress}%</p>
          <p className="text-xs text-muted-foreground">Don't close this tab until the upload is complete.</p>
        </div>
      )}
    </div>
  )
}
