'use client'

import React, { useEffect, useRef } from 'react'
import { useTrackContext } from '@/lib/track.wrapper'
import { useHistoryService } from '@/hooks/use.history.service'

/**
 * HistoryTrackingProvider
 *
 * Provider toàn cục, wrap bên trong TrackContextProvider.
 * Tự động theo dõi currentTrack thay đổi + lắng nghe audio events
 * → gọi startTracking / pauseTracking / endTracking mà KHÔNG CẦN
 * mỗi component tự gọi.
 *
 * Flow:
 *   t=0s  : User click bài A  → startTracking(A), timer 15s bắt đầu
 *   t=5s  : User click bài B  → commit A vào queue, startTracking(B)
 *   t=10s : User click bài C  → commit B vào queue, startTracking(C)
 *   t=15s : flush()            → gửi [A, B, C(đang phát)] trong 1 request
 */
const HistoryTrackingProvider = ({ children }: { children: React.ReactNode }) => {
  const { currentTrack, audioRef } = useTrackContext() as ITrackContext
  const { startTracking, pauseTracking, endTracking } = useHistoryService()

  // Keep refs to avoid stale closures in audio event listeners
  const trackRef = useRef(currentTrack)
  trackRef.current = currentTrack

  const startTrackingRef = useRef(startTracking)
  startTrackingRef.current = startTracking
  const pauseTrackingRef = useRef(pauseTracking)
  pauseTrackingRef.current = pauseTracking
  const endTrackingRef = useRef(endTracking)
  endTrackingRef.current = endTracking

  // ── Track change detection ───────────────────────────────────────────
  // Khi currentTrack.id hoặc trackUrl thay đổi → start tracking bài mới
  const prevTrackIdRef = useRef<string | null>(null)

  useEffect(() => {
    const trackId = currentTrack.id
    const isYoutube = currentTrack.isYoutube

    // Skip YouTube tracks (no local track ID to track) and empty tracks
    if (!trackId || isYoutube) {
      prevTrackIdRef.current = null
      return
    }

    // Track changed → start tracking new track
    if (trackId !== prevTrackIdRef.current) {
      prevTrackIdRef.current = trackId

      if (currentTrack.isPlaying) {
        startTrackingRef.current(Number(trackId))
      }
    }
  }, [currentTrack.id, currentTrack.trackUrl, currentTrack.isYoutube])

  // ── Play/Pause state sync ────────────────────────────────────────────
  // Khi isPlaying thay đổi cho CÙNG bài → pause/resume tracking
  const prevIsPlayingRef = useRef<boolean>(false)

  useEffect(() => {
    const trackId = currentTrack.id
    if (!trackId || currentTrack.isYoutube) return

    // Only handle play/pause toggle for the same track
    if (trackId === prevTrackIdRef.current) {
      if (currentTrack.isPlaying && !prevIsPlayingRef.current) {
        // Resumed playing
        startTrackingRef.current(Number(trackId))
      } else if (!currentTrack.isPlaying && prevIsPlayingRef.current) {
        // Paused
        pauseTrackingRef.current()
      }
    }

    prevIsPlayingRef.current = currentTrack.isPlaying
  }, [currentTrack.isPlaying, currentTrack.id, currentTrack.isYoutube])

  // ── Audio ended event ────────────────────────────────────────────────
  // Lắng nghe 'ended' event trên audioRef → endTracking
  useEffect(() => {
    const audio = audioRef?.current
    if (!audio) return

    const handleEnded = () => {
      endTrackingRef.current()
    }

    audio.addEventListener('ended', handleEnded)
    return () => {
      audio.removeEventListener('ended', handleEnded)
    }
  }, [audioRef?.current])

  return <>{children}</>
}

export default HistoryTrackingProvider
