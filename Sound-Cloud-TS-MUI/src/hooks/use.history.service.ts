'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoryEntry {
  trackId: number
  durationListened: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL        = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}/api/v1/histories`
const DEBOUNCE_MS    = 15_000  // gom entries trong 15s rồi gửi 1 lần
const MIN_DURATION_S = 3       // bỏ qua skip quá nhanh
const MAX_RETRY_MS   = 30_000
const BATCH_SIZE     = 10

// ─── Module-level singleton state ─────────────────────────────────────────────
// Shared across ALL hook instances — guarantees single queue, single timer.

let _token: string | undefined

// Bài đang phát hiện tại
let _trackId: number | null = null
let _accumulated = 0           // giây đã nghe thực sự
let _playStartedAt: number | null = null // null = đang pause

// Các bài đã KẾT THÚC (commit) chờ flush
let _queue: HistoryEntry[] = []

let _debounceTimer: ReturnType<typeof setTimeout> | null = null
let _retryCount = 0
let _retryTimer: ReturnType<typeof setTimeout> | null = null

// ── Duration helper ────────────────────────────────────────────────────────

const currentSegmentSec = (): number => {
  if (_playStartedAt === null) return 0
  return (Date.now() - _playStartedAt) / 1000
}

// ── Retry ──────────────────────────────────────────────────────────────────

const clearRetry = () => {
  if (_retryTimer) { clearTimeout(_retryTimer); _retryTimer = null }
}

// ── Flush ──────────────────────────────────────────────────────────────────

/**
 * Gom toàn bộ entries đã hoàn thành + snapshot bài đang phát dở
 * → gửi 1 request duy nhất dưới dạng array.
 */
const flush = async () => {
  const token = _token
  if (!token) return

  // ✅ Snapshot bài đang phát DỞ vào queue trước khi gửi
  // (không commitCurrent vì bài vẫn đang phát, chỉ ghi nhận đến thời điểm này)
  const snapshotEntry: HistoryEntry | null = (() => {
    if (_trackId === null) return null
    const listened = Math.floor(_accumulated + currentSegmentSec())
    if (listened < MIN_DURATION_S) return null
    return { trackId: _trackId, durationListened: listened }
  })()

  // Gom: bài đã xong + bài đang phát dở
  const toSend: HistoryEntry[] = [
    ..._queue,
    ...(snapshotEntry ? [snapshotEntry] : [])
  ]

  if (toSend.length === 0) return

  // Xóa queue (bài đang phát dở KHÔNG xóa accumulated — vẫn tiếp tục đếm)
  _queue = []

  try {
    for (let i = 0; i < toSend.length; i += BATCH_SIZE) {
      const chunk = toSend.slice(i, i + BATCH_SIZE)
      await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(chunk)
      })
    }
    _retryCount = 0
    console.log('[history] flushed', toSend.length, 'entries:', toSend)
  } catch (err) {
    console.error('[history] flush failed, re-queuing', err)
    // Chỉ re-queue phần bài đã xong, không re-queue snapshot (tránh đếm 2 lần)
    _queue.unshift(...toSend.filter(e => e !== snapshotEntry))
    scheduleRetry()
  }
}

const scheduleRetry = () => {
  clearRetry()
  if (typeof navigator !== 'undefined' && !navigator.onLine) return
  const delay = Math.min(1_000 * 2 ** _retryCount, MAX_RETRY_MS)
  _retryCount += 1
  _retryTimer = setTimeout(flush, delay)
}

/**
 * Đặt timer flush MỘT LẦN trong window 15s — không reset mỗi commit.
 * Kết quả: toàn bộ bài nghe trong 15s được gom vào 1 request.
 *
 *  t=0s  : Bài A bắt đầu   → timer đặt (flush lúc t=15s)
 *  t=5s  : Bài B bắt đầu   → commit A vào queue, timer vẫn chạy
 *  t=10s : Bài C bắt đầu   → commit B vào queue, timer vẫn chạy
 *  t=15s : flush()          → gửi [A, B, C(đang phát dở)] 1 request ✅
 */
const scheduleFlush = () => {
  if (_debounceTimer) return  // timer đang chạy → không reset
  _debounceTimer = setTimeout(() => {
    _debounceTimer = null
    flush()
  }, DEBOUNCE_MS)
}

// ── Commit bài đã kết thúc vào queue ──────────────────────────────────────

const commitCurrent = () => {
  if (_trackId === null) return

  if (_playStartedAt !== null) {
    _accumulated += currentSegmentSec()
    _playStartedAt = null
  }

  const listened = Math.floor(_accumulated)
  if (listened >= MIN_DURATION_S) {
    _queue.push({ trackId: _trackId, durationListened: listened })
    console.log('[history] committed track', _trackId, 'listened', listened, 's, queue size:', _queue.length)
    scheduleFlush()
  }

  _trackId = null
  _accumulated = 0
}

// ── Public API (module-level functions) ─────────────────────────────────────

/** Gọi khi play / resume / đổi bài */
const startTracking = (newTrackId: number) => {
  if (_trackId !== null && _trackId !== newTrackId) {
    commitCurrent() // bài cũ → commit vào queue
  }

  if (_trackId === null) {
    _trackId = newTrackId
    _accumulated = 0
  }

  _playStartedAt = Date.now()
  scheduleFlush() // đảm bảo timer luôn chạy khi có bài đang phát
  console.log('[history] startTracking', newTrackId)
}

/** Gọi khi pause */
const pauseTracking = () => {
  if (_playStartedAt === null) return
  _accumulated += currentSegmentSec()
  _playStartedAt = null
  console.log('[history] pauseTracking, accumulated', Math.floor(_accumulated), 's')
}

/** Gọi khi onEnded */
const endTracking = () => {
  commitCurrent()
}

/** Force flush immediately */
const flushNow = () => flush()

const getListenedSeconds = () => Math.floor(_accumulated + currentSegmentSec())

const getQueueSize = () => _queue.length

// ── Flush on tab close ────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // Commit bài đang phát dở vào queue
    if (_trackId !== null) {
      if (_playStartedAt !== null) {
        _accumulated += currentSegmentSec()
      }
      const listened = Math.floor(_accumulated)
      if (listened >= MIN_DURATION_S) {
        _queue.push({ trackId: _trackId, durationListened: listened })
      }
    }
    if (!_token || _queue.length === 0) return

    // Use fetch with keepalive instead of sendBeacon (supports auth headers)
    try {
      fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${_token}`
        },
        body: JSON.stringify(_queue),
        keepalive: true
      })
    } catch {
      // Best effort — can't do much if this fails
    }
  })

  window.addEventListener('online', () => { _retryCount = 0; flush() })
  window.addEventListener('offline', () => clearRetry())
}

// ─── Hook (thin wrapper to sync token + expose API) ───────────────────────

export const useHistoryService = () => {
  const { data: session } = useSession()

  // Sync token vào module-level variable
  useEffect(() => {
    _token = session?.access_token as string | undefined
  }, [session?.access_token])

  // Exposed API — delegates to module-level functions
  return {
    startTracking,
    pauseTracking,
    endTracking,
    flushNow,
    getListenedSeconds,
    getQueueSize,
  }
}

// Also export standalone functions for direct use in providers
export {
  startTracking,
  pauseTracking,
  endTracking,
  flushNow,
}